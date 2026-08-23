/**
 * storage.js — 保存・読込モジュール v4.1
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 【アーキテクチャ要約（AI向け）】
 *   実測確認済み: バックエンドは GAS PropertiesService（type='gas'）
 *   Firebase: コード上は実装済みだが現環境では未設定（magic_garden_firebase_cfg なし）
 *   GAS: スプレッドシート不使用。PropertiesService のみ使用。
 *   管理操作: admin.html の GAS タブ（ADMIN_KEY設定済みの場合）
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 保存の優先順位:
 *  1. LocalStorage（即時・同期）← 常に実行
 *  2. Firebase Auth SDK（推奨）← FirebaseAuth が初期化済みの場合
 *  3. Firebase REST / GAS（フォールバック）← SDK未使用時
 *
 * debounce 自動同期:
 *  - save() を呼ぶたびにローカルは即保存
 *  - クラウドは 2 秒後にまとめて送信（連続操作でも1回に間引き）
 *  - 失敗時は最大3回リトライ（5s/15s/30s）
 *  - flushSave(state) でdebounceをキャンセルして即クラウド同期
 *
 * v4.1 変更点（CODEX指摘修正）:
 *  - リトライカウンタバグ修正: 失敗時は_retryCountをリセットしない
 *  - flushSave()公開: pagehide/手動保存時にdebounceをキャンセルして即送信
 *  - GAS保存をPOSTボディに変更: GETのURL長制限を回避 & saveChunk不整合を解消
 *
 * 依存: firebase_auth.js (任意 — なくても動く)
 */
const Storage = (() => {
  const KEY        = 'magic_garden_v2';
  const CONFIG_KEY = 'magic_garden_gas_config';
  const DEFAULT_ENDPOINT = 'https://script.google.com/macros/s/AKfycbx9gWYwh1lbqpSlNJBFm5dvtPejACyAScbA-dO8TWPYtQ_AxFj4KtYNnLnVVG778jxk/exec';
  const DEBOUNCE_MS    = 2000;   // クラウド同期の間引き時間

  // ─── 同期ステータス ─────────────────────────────────────────────────────
  let _syncStatus    = 'idle';
  let _syncCallbacks = [];
  let _retryQueue    = null;
  let _retryCount    = 0;
  let _retryTimer    = null;
  let _debounceTimer = null;    // debounce 用タイマー
  const MAX_RETRY    = 3;
  const RETRY_DELAYS = [5000, 15000, 30000];

  function _setSyncStatus(s) {
    if (_syncStatus === s) return;
    _syncStatus = s;
    _syncCallbacks.forEach(fn => { try { fn(s); } catch(_){} });
  }

  function onSyncStatusChange(fn) { _syncCallbacks.push(fn); fn(_syncStatus); }
  function getSyncStatus() { return _syncStatus; }

  // ─── GAS/REST 設定 ────────────────────────────────────────────────────

  function getConfig() {
    try {
      const raw   = localStorage.getItem(CONFIG_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      return {
        type:     saved.type     || 'gas',
        endpoint: saved.endpoint || DEFAULT_ENDPOINT,
        playerId: saved.playerId || ''
      };
    } catch (_) { return { type: 'gas', endpoint: DEFAULT_ENDPOINT, playerId: '' }; }
  }

  function setConfig(endpoint, playerId, type) {
    const cfg = getConfig();
    localStorage.setItem(CONFIG_KEY, JSON.stringify({
      type:     type     || cfg.type || 'gas',
      endpoint: endpoint || cfg.endpoint,
      playerId: playerId || cfg.playerId
    }));
  }

  function isConfigured() {
    // Firebase Auth が使える場合は常に「設定済み」
    if (typeof FirebaseAuth !== 'undefined' && FirebaseAuth.isReady()) return true;
    const c = getConfig();
    return !!(c.endpoint && c.playerId);
  }

  // ─── ローカル保存（即時・二重保存） ──────────────────────────────────────

  function saveLocal(state) {
    try {
      const payload = JSON.stringify(state);
      localStorage.setItem(KEY, payload);
      localStorage.setItem(KEY + '_backup', payload);
      return true;
    } catch(e) {
      console.error('[Storage] Local save failed:', e);
      return false;
    }
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return migrate(JSON.parse(raw));
    } catch(e) {
      // バックアップから復旧
      try {
        const bk = localStorage.getItem(KEY + '_backup');
        if (bk) return migrate(JSON.parse(bk));
      } catch(_) {}
      return null;
    }
  }

  // ─── クラウド保存（debounce + リトライ） ─────────────────────────────────

  async function _doSaveCloud(state) {
    _setSyncStatus('syncing');

    // ① Firebase Auth SDK 経由（推奨）
    if (typeof FirebaseAuth !== 'undefined' && FirebaseAuth.isReady()) {
      try {
        await FirebaseAuth.saveData(state);
        _retryQueue = null;
        _retryCount = 0;
        _setSyncStatus('ok');
        return;
      } catch(e) {
        console.warn('[Storage] Firebase SDK save failed:', e.message);
        // Firebase が失敗した場合はリトライキューへ
      }
    } else {
      // ② REST API フォールバック（Firebase REST or GAS）
      const { endpoint, playerId, type } = getConfig();
      if (endpoint && playerId) {
        const ok = await _trySaveRest(type, endpoint, playerId, state);
        if (ok) {
          _retryQueue = null;
          _retryCount = 0;
          _setSyncStatus('ok');
          return;
        }
      } else {
        _setSyncStatus('idle');
        return;
      }
    }

    // 失敗 → リトライキュー
    // ★ Fix: _retryCount をここでリセットしない（CODEX指摘③）
    //         リセットすると MAX_RETRY が無限にリセットされ続ける
    _retryQueue = state;
    _setSyncStatus('retry');
    _scheduleRetry();
  }

  function _scheduleRetry() {
    if (_retryTimer) clearTimeout(_retryTimer);
    if (_retryCount >= MAX_RETRY || !_retryQueue) {
      if (_retryCount >= MAX_RETRY) { _setSyncStatus('error'); }
      return;
    }
    const delay = RETRY_DELAYS[_retryCount] || 30000;
    _retryTimer = setTimeout(async () => {
      if (!_retryQueue) return;
      _retryCount++;
      await _doSaveCloud(_retryQueue);
    }, delay);
  }

  // ─── REST API (Firebase REST / GAS) ──────────────────────────────────────

  async function _trySaveRest(type, endpoint, playerId, state) {
    try {
      if (type === 'firebase') return await _saveFirebaseRest(endpoint, playerId, state);
      else                     return await _saveGasRest(endpoint, playerId, state);
    } catch(e) {
      console.warn('[Storage] REST save failed:', e.message);
      return false;
    }
  }

  async function _saveFirebaseRest(endpoint, playerId, state) {
    const url = `${endpoint.replace(/\/$/, '')}/players/${encodeURIComponent(playerId)}.json`;
    const res = await fetch(url, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state), signal: AbortSignal.timeout(10000)
    });
    return res.ok;
  }

  /**
   * GAS REST 保存
   * ★ Fix v4.2: Content-Type を text/plain に変更して preflight を回避。
   *   - application/json は CORS preflight (OPTIONS) を要求するが GAS は OPTIONS に 405 を返す
   *   - text/plain は "simple request" 扱いで preflight なし → レスポンスが読める
   *   - GAS 側の doPost は e.postData.contents を JSON.parse するので動作に変化なし
   *   - no-cors を廃止してレスポンス検証を行う（サイレント失敗の根本解消）
   */
  async function _saveGasRest(endpoint, playerId, state) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'save', playerId, data: state }),
        signal: AbortSignal.timeout(15000)
      });
      if (!res.ok) {
        console.warn('[Storage] GAS POST save HTTP error:', res.status);
        return false;
      }
      const json = await res.json();
      return json.ok === true;
    } catch(e) {
      console.warn('[Storage] GAS POST save failed:', e.message);
      return false;
    }
  }

  // ─── クラウド読込 ─────────────────────────────────────────────────────────

  async function loadCloud() {
    // Firebase Auth SDK 経由
    if (typeof FirebaseAuth !== 'undefined' && FirebaseAuth.isReady()) {
      try {
        const data = await FirebaseAuth.loadData();
        return data ? migrate(data) : null;
      } catch(e) {
        console.warn('[Storage] Firebase SDK load failed:', e.message);
      }
    }
    // REST フォールバック
    const { endpoint, playerId, type } = getConfig();
    if (!endpoint || !playerId) return null;
    try {
      if (type === 'firebase') {
        const url = `${endpoint.replace(/\/$/, '')}/players/${encodeURIComponent(playerId)}.json`;
        const res  = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const data = await res.json();
        return data ? migrate(data) : null;
      } else {
        const res  = await fetch(`${endpoint}?action=load&playerId=${encodeURIComponent(playerId)}`, { signal: AbortSignal.timeout(12000) });
        const json = await res.json();
        return json.ok && json.data ? migrate(json.data) : null;
      }
    } catch(e) {
      console.warn('[Storage] REST load failed:', e.message);
      return null;
    }
  }

  // ─── 疎通テスト ───────────────────────────────────────────────────────────

  async function ping(endpoint, type) {
    if (typeof FirebaseAuth !== 'undefined' && FirebaseAuth.isReady()) {
      return await FirebaseAuth.ping();
    }
    const t = type || getConfig().type;
    try {
      if (t === 'firebase') {
        const res = await fetch(`${endpoint.replace(/\/$/, '')}/.json`, { signal: AbortSignal.timeout(8000) });
        return res.ok;
      } else {
        const res  = await fetch(`${endpoint}?action=ping`, { signal: AbortSignal.timeout(8000) });
        const json = await res.json();
        return json.ok === true;
      }
    } catch(_) { return false; }
  }

  // ─── 公開 API ─────────────────────────────────────────────────────────────

  /**
   * セーブ:
   *  - ローカル保存: 即時
   *  - クラウド同期: 2秒後（debounce — 連続保存を1回にまとめる）
   */
  function save(state) {
    const ok = saveLocal(state);

    // debounce: 2秒以内の連続 save() はまとめて1回のクラウド同期に
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      _doSaveCloud(state);
      _debounceTimer = null;
    }, DEBOUNCE_MS);

    return ok;
  }

  /**
   * ★ 新規: flushSave() — debounceをキャンセルして即クラウド同期（CODEX指摘④）
   *  pagehide/手動保存時に呼ぶ。終了直前の保存取りこぼしを防ぐ。
   */
  function flushSave(state) {
    if (_debounceTimer) {
      clearTimeout(_debounceTimer);
      _debounceTimer = null;
    }
    saveLocal(state);
    _doSaveCloud(state);
  }

  function load() { return loadLocal(); }

  /**
   * ★ Fix v4.2: クラウドから読み込む前に debounce/retry を必ずキャンセル
   *   - 復元直後に古い pending 保存が発火してデータを上書きするバグを防ぐ
   *   - pullFromCloud() は "信頼できるクラウドデータで現状を置き換える" 操作なので
   *     保留中の送信はすべて破棄してよい
   */
  async function pullFromCloud() {
    // pending な debounce 保存をキャンセル
    if (_debounceTimer) { clearTimeout(_debounceTimer); _debounceTimer = null; }
    // retry キューもクリア（古い state を送らせない）
    if (_retryTimer)  { clearTimeout(_retryTimer);  _retryTimer  = null; }
    _retryQueue = null;
    _retryCount = 0;

    const data = await loadCloud();
    if (data) { saveLocal(data); return data; }
    return null;
  }

  function diagnose() {
    const raw    = localStorage.getItem(KEY);
    const config = getConfig();
    const fbReady = typeof FirebaseAuth !== 'undefined' && FirebaseAuth.isReady();
    return {
      localDataSize:  raw ? raw.length : 0,
      urlEncodedSize: raw ? encodeURIComponent(raw).length : 0,
      hasLocal:       !!raw,
      backupExists:   !!localStorage.getItem(KEY + '_backup'),
      isConfigured:   isConfigured(),
      firebaseAuthReady: fbReady,
      firebaseUser:   fbReady ? FirebaseAuth.getUserLabel() : 'N/A',
      backendType:    config.type,
      syncStatus:     _syncStatus,
      retryCount:     _retryCount,
      debounceActive: !!_debounceTimer
    };
  }

  function clear() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(KEY + '_backup');
  }

  // ─── マイグレーション ─────────────────────────────────────────────────────

  function migrate(data) {
    if (!data) return data;
    if (data.formation && !Array.isArray(data.formation)) {
      data.formation = Object.values(data.formation);
    }
    if (data.daily && !data.daily.hasOwnProperty('claimed')) {
      data.daily.claimed = {};
    }
    return data;
  }

  return {
    save, load, flushSave, pullFromCloud, clear,
    getConfig, setConfig, isConfigured,
    ping, getSyncStatus, onSyncStatusChange, diagnose
  };
})();
