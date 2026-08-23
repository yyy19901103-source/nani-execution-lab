/**
 * firebase_auth.js — Firebase Authentication + Realtime Database モジュール
 *
 * 機能:
 *  - Firebase SDK を必要時に動的ロード（初回のみ CDN から取得）
 *  - 匿名認証: 自動サインイン（UID が playerId になる）
 *  - Email/Password: 任意で設定（デバイス間引き継ぎ用）
 *  - 匿名 → Email/Password へのアカウント昇格（データを引き継ぐ）
 *  - データ変化を検知して debounce 同期（ゲームが直接 save() するだけでOK）
 *
 * 利用する Firebase サービス:
 *  - Firebase Authentication
 *  - Firebase Realtime Database
 *
 * セキュリティルール（Firebase Console で設定）:
 *  {
 *    "rules": {
 *      "players": {
 *        "$uid": {
 *          ".read":  "$uid === auth.uid",
 *          ".write": "$uid === auth.uid"
 *        }
 *      }
 *    }
 *  }
 */
const FirebaseAuth = (() => {
  const FIREBASE_VERSION = '10.12.0';
  const CDN_BASE = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}`;
  const CONFIG_KEY = 'magic_garden_firebase_cfg';

  let _initialized  = false;
  let _sdkLoading   = false;
  let _sdkLoaded    = false;
  let _firebaseApp  = null;
  let _auth         = null;
  let _db           = null;
  let _user         = null;     // null=unknown, false=signedOut, object=signedIn
  let _authCallbacks = [];
  let _config       = null;

  // ─── SDK 動的ロード ─────────────────────────────────────────────────────

  function _loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error(`Failed to load: ${src}`));
      document.head.appendChild(s);
    });
  }

  async function _loadSDK() {
    if (_sdkLoaded || typeof firebase !== 'undefined') { _sdkLoaded = true; return; }
    if (_sdkLoading) {
      // 別の呼び出しがロード中なら完了を待つ
      await new Promise(resolve => {
        const check = setInterval(() => { if (_sdkLoaded) { clearInterval(check); resolve(); } }, 100);
      });
      return;
    }
    _sdkLoading = true;
    try {
      await _loadScript(`${CDN_BASE}/firebase-app-compat.js`);
      await _loadScript(`${CDN_BASE}/firebase-auth-compat.js`);
      await _loadScript(`${CDN_BASE}/firebase-database-compat.js`);
      _sdkLoaded = true;
    } finally {
      _sdkLoading = false;
    }
  }

  // ─── 設定管理 ──────────────────────────────────────────────────────────

  function saveConfig(cfg) {
    _config = cfg;
    localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  }

  function loadSavedConfig() {
    try {
      const raw = localStorage.getItem(CONFIG_KEY);
      if (!raw) return null;
      const cfg = JSON.parse(raw);
      // 必須フィールド確認
      if (cfg.apiKey && cfg.databaseURL) { _config = cfg; return cfg; }
    } catch(_) {}
    return null;
  }

  function getConfig() { return _config || loadSavedConfig(); }
  function hasConfig()  { return !!getConfig(); }

  // ─── 初期化 ────────────────────────────────────────────────────────────

  async function init(config) {
    if (_initialized) return true;
    await _loadSDK();

    const cfg = config || loadSavedConfig();
    if (!cfg || !cfg.apiKey) return false;

    try {
      // Firebase は initializeApp を複数回呼ぶとエラーになる
      _firebaseApp = firebase.apps.length > 0
        ? firebase.apps[0]
        : firebase.initializeApp(cfg);

      _auth = firebase.auth(_firebaseApp);
      _db   = firebase.database(_firebaseApp);
      _config = cfg;
      _initialized = true;

      // 認証状態監視
      _auth.onAuthStateChanged(user => {
        _user = user || false;
        console.log('[FirebaseAuth] User:', user ? (user.isAnonymous ? `anonymous(${user.uid.slice(0,8)})` : user.email) : 'none');
        _authCallbacks.forEach(fn => { try { fn(_user); } catch(_){} });
      });

      return true;
    } catch(e) {
      console.error('[FirebaseAuth] init failed:', e.message);
      return false;
    }
  }

  // 保存済み設定があれば起動時に自動初期化
  async function autoInit() {
    const cfg = loadSavedConfig();
    if (!cfg) return false;
    return await init(cfg);
  }

  // ─── 認証 ──────────────────────────────────────────────────────────────

  /** 匿名サインイン（自動 playerId 割当） */
  async function signInAnonymously() {
    if (!_initialized) throw new Error('Firebase not initialized');
    const cred = await _auth.signInAnonymously();
    return cred.user;
  }

  /** Email+Password でログイン */
  async function signInWithEmail(email, password) {
    if (!_initialized) throw new Error('Firebase not initialized');
    const cred = await _auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  }

  /** Email+Password で新規登録 */
  async function createAccount(email, password) {
    if (!_initialized) throw new Error('Firebase not initialized');
    const cred = await _auth.createUserWithEmailAndPassword(email, password);
    return cred.user;
  }

  /**
   * 匿名アカウント → Email/Password に昇格
   * データは引き継がれる（UID が変わらない）
   */
  async function linkToEmail(email, password) {
    if (!_user || !_user.isAnonymous) throw new Error('匿名ユーザーではありません');
    const credential = firebase.auth.EmailAuthProvider.credential(email, password);
    const cred = await _user.linkWithCredential(credential);
    return cred.user;
  }

  /** サインアウト */
  async function signOut() {
    if (_auth) await _auth.signOut();
  }

  // ─── データベース操作 ───────────────────────────────────────────────────

  /** ゲームデータを Firebase に保存 */
  async function saveData(state) {
    if (!_db || !isSignedIn()) throw new Error('Not ready');
    await _db.ref(`players/${_user.uid}`).set(state);
  }

  /** ゲームデータを Firebase から読込 */
  async function loadData() {
    if (!_db || !isSignedIn()) throw new Error('Not ready');
    const snap = await _db.ref(`players/${_user.uid}`).once('value');
    return snap.val();
  }

  /** 接続テスト */
  async function ping() {
    if (!_db) return false;
    try {
      await _db.ref('.info/connected').once('value');
      return true;
    } catch(_) { return false; }
  }

  // ─── ゲッター ──────────────────────────────────────────────────────────

  function getUID()       { return _user ? _user.uid   : null; }
  function getEmail()     { return _user ? _user.email : null; }
  function isAnonymous()  { return !!(_user && _user.isAnonymous); }
  function isSignedIn()   { return !!(_user && _user.uid); }
  function isReady()      { return _initialized && isSignedIn(); }

  /** auth状態変化コールバック登録 */
  function onAuthChange(fn) {
    _authCallbacks.push(fn);
    if (_user !== null) fn(_user);   // 既知の状態を即通知
  }

  /** ユーザー表示名を返す */
  function getUserLabel() {
    if (!_user) return '未ログイン';
    if (_user.isAnonymous) return `匿名ユーザー (${_user.uid.slice(0,8)}...)`;
    return _user.email || '不明';
  }

  return {
    init, autoInit, hasConfig, getConfig, saveConfig, loadSavedConfig,
    signInAnonymously, signInWithEmail, createAccount, linkToEmail, signOut,
    saveData, loadData, ping,
    getUID, getEmail, isAnonymous, isSignedIn, isReady,
    onAuthChange, getUserLabel
  };
})();
