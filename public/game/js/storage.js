/**
 * storage.js — 保存・読込モジュール v2.1
 *
 * ローカル保存 (LocalStorage) を常に行い、
 * GAS エンドポイントが設定されている場合は非同期でクラウド同期する。
 *
 * 信頼性機能:
 * - ローカル保存は同期・即時（ゲームをブロックしない）
 * - クラウド同期は非同期・失敗してもゲームは止まらない
 * - URLサイズ超過時は自動チャンク分割保存
 * - 失敗時はキューに入れて最大3回リトライ（指数バックオフ）
 * - sync状態変化コールバック対応（UIインジケーター用）
 * - visibilitychange / beforeunload での自動保存はゲーム側で行う
 */
const Storage = (() => {
  const KEY         = 'magic_garden_v2';
  const CONFIG_KEY  = 'magic_garden_gas_config';
  const DEFAULT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx9gWYwh1lbqpSlNJBFm5dvtPejACyAScbA-dO8TWPYtQ_AxFj4KtYNnLnVVG778jxk/exec';

  // URL安全上限（ブラウザ制限の保守的な値）
  const URL_SAFE_BYTES = 6500;

  // ─── 同期ステータス管理 ─────────────────────────────────────────────────
  // 'idle' | 'syncing' | 'ok' | 'error' | 'retry'
  let _syncStatus    = 'idle';
  let _syncCallbacks = [];
  let _retryQueue    = null;   // 失敗時に再試行するデータ
  let _retryCount    = 0;
  let _retryTimer    = null;
  const MAX_RETRY    = 3;
  const RETRY_DELAYS = [5000, 15000, 30000];   // ms

  function _setSyncStatus(status) {
    if (_syncStatus === status) return;
    _syncStatus = status;
    _syncCallbacks.forEach(fn => { try { fn(status); } catch(_){} });
  }

  function onSyncStatusChange(fn) {
    _syncCallbacks.push(fn);
    fn(_syncStatus);  // 現在状態を即通知
  }

  function getSyncStatus() { return _syncStatus; }

  // ─── GAS 設定 ─────────────────────────────────────────────────────────────

  function getConfig() {
    try {
      const raw  = localStorage.getItem(CONFIG_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      return {
        endpoint: saved.endpoint || DEFAULT_ENDPOINT,
        playerId: saved.playerId || ''
      };
    } catch (_) {
      return { endpoint: DEFAULT_ENDPOINT, playerId: '' };
    }
  }

  function setConfig(endpoint, playerId) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ endpoint, playerId }));
  }

  function isConfigured() {
    const c = getConfig();
    return !!(c.endpoint && c.playerId);
  }

  // ─── ローカル保存（同期・確実） ───────────────────────────────────────────

  function saveLocal(state) {
    try {
      const payload = JSON.stringify(state);
      localStorage.setItem(KEY, payload);
      // バックアップも保持（直前1件）
      localStorage.setItem(KEY + '_backup', payload);
      return true;
    } catch (e) {
      console.error('[Storage] Local save failed:', e);
      return false;
    }
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return migrate(JSON.parse(raw));
    } catch (e) {
      console.error('[Storage] Local load failed, trying backup:', e);
      // バックアップから復旧を試みる
      try {
        const backup = localStorage.getItem(KEY + '_backup');
        if (backup) return migrate(JSON.parse(backup));
      } catch (_) {}
      return null;
    }
  }

  // ─── GAS クラウド保存（非同期・リトライ付き） ─────────────────────────────

  async function saveCloud(state) {
    const { endpoint, playerId } = getConfig();
    if (!endpoint || !playerId) return;

    _setSyncStatus('syncing');
    const success = await _trySaveCloud(endpoint, playerId, state);

    if (success) {
      _retryQueue  = null;
      _retryCount  = 0;
      _setSyncStatus('ok');
    } else {
      // リトライキューに積む
      _retryQueue = { endpoint, playerId, state };
      _retryCount = 0;
      _setSyncStatus('retry');
      _scheduleRetry();
    }
  }

  async function _trySaveCloud(endpoint, playerId, state) {
    try {
      const jsonStr = JSON.stringify(state);
      const encoded = encodeURIComponent(jsonStr);

      if (encoded.length <= URL_SAFE_BYTES) {
        // 通常: 1回のGETで保存
        const url = `${endpoint}?action=save`
          + `&playerId=${encodeURIComponent(playerId)}`
          + `&data=${encoded}`;
        const res  = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const json = await res.json();
        return json.ok === true;
      } else {
        // 大きいデータ: チャンク分割して保存
        return await _saveCloudChunked(endpoint, playerId, jsonStr);
      }
    } catch (e) {
      console.warn('[Storage] Cloud save attempt failed:', e.message);
      return false;
    }
  }

  async function _saveCloudChunked(endpoint, playerId, jsonStr) {
    // 4000文字ずつに分割して順次保存
    const CHUNK_SIZE = 4000;
    const totalChunks = Math.ceil(jsonStr.length / CHUNK_SIZE);
    console.log(`[Storage] Large data (${jsonStr.length}chars), saving in ${totalChunks} chunks`);

    for (let i = 0; i < totalChunks; i++) {
      const chunk  = jsonStr.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const isLast = i === totalChunks - 1;
      const url    = `${endpoint}?action=save`
        + `&playerId=${encodeURIComponent(playerId)}`
        + `&data=${encodeURIComponent(chunk)}`
        + `&chunk=${i}&totalChunks=${totalChunks}&isFinal=${isLast}`;
      try {
        const res  = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const json = await res.json();
        if (!json.ok) return false;
      } catch (e) {
        console.warn(`[Storage] Chunk ${i} failed:`, e.message);
        return false;
      }
      // チャンク間に短い待機（GASのクォータ回避）
      if (!isLast) await _sleep(200);
    }
    return true;
  }

  function _scheduleRetry() {
    if (_retryTimer) clearTimeout(_retryTimer);
    if (_retryCount >= MAX_RETRY || !_retryQueue) {
      if (_retryCount >= MAX_RETRY) {
        console.warn('[Storage] Max retries reached. Cloud sync failed permanently for this save.');
        _setSyncStatus('error');
      }
      return;
    }
    const delay = RETRY_DELAYS[_retryCount] || 30000;
    console.log(`[Storage] Retry ${_retryCount + 1}/${MAX_RETRY} in ${delay/1000}s`);
    _retryTimer = setTimeout(async () => {
      if (!_retryQueue) return;
      const { endpoint, playerId, state } = _retryQueue;
      _retryCount++;
      _setSyncStatus('retry');
      const success = await _trySaveCloud(endpoint, playerId, state);
      if (success) {
        _retryQueue = null;
        _retryCount = 0;
        _setSyncStatus('ok');
        console.log('[Storage] Retry succeeded.');
      } else {
        _scheduleRetry();
      }
    }, delay);
  }

  async function loadCloud() {
    const { endpoint, playerId } = getConfig();
    if (!endpoint || !playerId) return null;
    try {
      const res  = await fetch(
        `${endpoint}?action=load&playerId=${encodeURIComponent(playerId)}`,
        { signal: AbortSignal.timeout(10000) }
      );
      const json = await res.json();
      if (json.ok && json.data) return migrate(json.data);
    } catch (e) {
      console.warn('[Storage] Cloud load failed (offline?):', e.message);
    }
    return null;
  }

  // ─── 疎通テスト ───────────────────────────────────────────────────────────

  async function ping(endpoint) {
    try {
      const res  = await fetch(
        `${endpoint}?action=ping`,
        { signal: AbortSignal.timeout(8000) }
      );
      const json = await res.json();
      return json.ok === true;
    } catch (_) {
      return false;
    }
  }

  // ─── 公開 API ─────────────────────────────────────────────────────────────

  /**
   * セーブ: ローカルに即保存 + クラウドにバックグラウンド同期
   * @returns {boolean} ローカル保存の成否
   */
  function save(state) {
    const ok = saveLocal(state);
    saveCloud(state);   // await しない（ゲームをブロックしない）
    return ok;
  }

  /**
   * ロード: ローカルから即座に返す（起動を止めない）
   */
  function load() {
    return loadLocal();
  }

  /**
   * クラウドから手動で引き継ぎ（非同期）
   * UI の「クラウドから読込」ボタン用
   */
  async function pullFromCloud() {
    const data = await loadCloud();
    if (data) {
      saveLocal(data);
      return data;
    }
    return null;
  }

  /**
   * セーブデータの診断情報を返す（デバッグ用）
   */
  function diagnose() {
    const state  = loadLocal();
    const config = getConfig();
    const raw    = localStorage.getItem(KEY);
    return {
      localDataSize:  raw ? raw.length : 0,
      hasLocal:       !!state,
      isConfigured:   isConfigured(),
      endpoint:       config.endpoint ? config.endpoint.slice(0, 60) + '...' : 'none',
      playerId:       config.playerId || 'none',
      syncStatus:     _syncStatus,
      retryCount:     _retryCount,
      hasRetryQueue:  !!_retryQueue,
      urlEncodedSize: raw ? encodeURIComponent(raw).length : 0,
      urlSafe:        raw ? encodeURIComponent(raw).length <= URL_SAFE_BYTES : true
    };
  }

  function clear() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(KEY + '_backup');
  }

  // ─── バージョンマイグレーション ───────────────────────────────────────────

  function migrate(data) {
    if (!data) return data;
    // v0.2 → v0.3: formation が配列でない場合の修正
    if (data.formation && !Array.isArray(data.formation)) {
      data.formation = Object.values(data.formation);
    }
    // daily フィールド補完
    if (data.daily && !data.daily.hasOwnProperty('claimed')) {
      data.daily.claimed = {};
    }
    return data;
  }

  // ─── ユーティリティ ───────────────────────────────────────────────────────

  function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  return {
    save,
    load,
    pullFromCloud,
    clear,
    getConfig,
    setConfig,
    isConfigured,
    ping,
    getSyncStatus,
    onSyncStatusChange,
    diagnose
  };
})();
