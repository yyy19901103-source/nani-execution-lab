/**
 * main.js — UI制御・イベントバインド・起動処理
 * 4タブ: ホーム / 冒険 / 副将 / ガチャ
 */
const UI = (() => {

  // ─── ユーティリティ ─────────────────────────────────────────────────────

  // 画像キャッシュバスター（v81: 2026-05-04 ダッシュボードチップ + 図鑑thumb + プレミアムフォント）
  const IMG_V = '81';

  // UI アイコン helper（PNG優先 + 絵文字フォールバック）
  // 用法: uiIcon('mat_herb', '🌿') → 配置済なら img、なければ絵文字
  // fallback には HTML 文字列も渡せる（data 属性経由で安全に保持）
  function _htmlAttrEscape(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function uiIcon(name, fallback = '', size = 'md') {
    const sizeClass = `ui-icon-${size}`;  // sm/md/lg/xl
    const path = `assets/ui-icons/${name}.webp?v=${IMG_V}`;
    const fbAttr = _htmlAttrEscape(fallback || '');
    // data-fallback 経由で fallback HTML を安全に保持。onerror 時に outerHTML を置換
    return `<img class="ui-icon ${sizeClass}" src="${path}" alt="" data-fallback="${fbAttr}" onerror="if(!this.dataset.fbDone){this.dataset.fbDone='1';this.outerHTML=this.dataset.fallback||'';}" loading="lazy" decoding="async">`;
  }

  const $ = id => document.getElementById(id);
  const show = id => { const e=$(id); if(e) e.classList.remove('hidden'); };
  const hide = id => { const e=$(id); if(e) e.classList.add('hidden'); };
  const showTemp = (id, ms=2000) => { show(id); setTimeout(() => hide(id), ms); };

  // 材料アイコンを統一ピクセル枠で囲む
  // (12種の絵文字を全SVG化せず、ピクセル枠+背景色で「素材タイル」の見た目に統一)
  const MAT_BG = {
    herb:'#3a6b3a',  fang:'#d8d0b8',  pelt:'#7a4a30',  bark:'#5a3a20',
    iron:'#666b78',  darkstone:'#2a1040',  crystaldust:'#4a8acc',
    goddessfeather:'#d8c8e8',  dragonscale:'#8a2222',  holywater:'#4abae8',
    dreamdust:'#a06bd8',  shard_s:'#3a8aaa'
  };
  function matIcon(matId) {
    if (!matId) return '';
    const md = (typeof MATERIALS_DATA !== 'undefined') ? MATERIALS_DATA[matId] : null;
    if (!md) return '';
    const bg = MAT_BG[matId] || '#555';
    // PNG優先 + 旧バブル絵文字をフォールバック
    const fallback = `<span class="mat-icon" style="background:${bg}" title="${md.name}">${md.emoji}</span>`;
    // uiIcon は IMG_V 定義後でないと動かないので関数内で参照（hoist 効くように function 宣言を使用）
    if (typeof uiIcon === 'function') {
      return uiIcon(`mat_${matId}`, fallback, 'sm');
    }
    return fallback;
  }

  // HTML属性エスケープ（XSS防止）
  function escapeAttr(v = '') {
    return String(v)
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  // 既存ボタンのリスナーをクローン置換でリセットして新しい handler をバインド
  // 同じ DOM 要素に複数回 listener が積み重なるのを防ぐ
  function bindFresh(elemOrId, handler) {
    const el = (typeof elemOrId === 'string') ? document.getElementById(elemOrId) : elemOrId;
    if (!el) return null;
    const fresh = el.cloneNode(true);
    el.replaceWith(fresh);
    fresh.addEventListener('click', handler);
    return fresh;
  }

  // ログエントリ配列をDOMに描画 (animDelay指定でフェードイン演出)
  function renderLogEntries(entries, container, animDelay = 0) {
    container.innerHTML = '';
    entries.forEach((entry, i) => {
      const draw = () => {
        const div = document.createElement('div');
        div.className = classifyLogEntry(entry) + (animDelay ? ' anim-fadein' : '');
        div.textContent = entry.text;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
      };
      if (animDelay) setTimeout(draw, i * animDelay); else draw();
    });
  }

  // 戦闘ログ entry の種別を判定して色クラス付与
  function classifyLogEntry(entry) {
    const t = entry.text || '';
    const cls = ['log-entry'];
    if (entry.isSkill)         cls.push('log-skill');
    if (entry.type === 'result') cls.push('log-result');
    // 重要イベント
    if (t.includes('暴撃'))     cls.push('log-crit');
    if (t.includes('弱点'))     cls.push('log-weakness');
    if (t.includes('回復') || t.includes('癒'))     cls.push('log-heal');
    if (t.includes('倒した') || t.includes('撃破')) cls.push('log-kill');
    if (t.includes('被弾') || t.includes('ダメージ')) cls.push('log-dmg');
    if (t.includes('バフ') || t.includes('強化'))   cls.push('log-buff');
    if (t.includes('デバフ') || t.includes('弱体')) cls.push('log-debuff');
    if (t.includes('外し') || t.includes('回避'))   cls.push('log-miss');
    if (entry.type === 'turn')  cls.push('log-turn');
    return cls.join(' ');
  }

  // 敵名 → ピクセルスプライトクラス フォールバックマップ
  // (一次データは stages_data.js の enemy.spriteKey、ここは後方互換用)
  const ENEMY_SPRITE = {
    'スライム': 'slime',
    'ゴブリン': 'goblin',
    'オオカミ': 'wolf',
    '古樹の精': 'treant',
    '古竜': 'dragon',
    '竜王ヴァルグ': 'king',
    'ワイバーン': 'wyvern',
    '魔王': 'demon',
    '古の女神': 'goddess',
    '試練の番人': 'guard',
    '試練の番人・強': 'guard2',
    '試練の番人・極': 'guard3',
    '天空の守護神': 'titan',
    '夢魔女王リリス': 'lilith',
    '鎧ゴブリン': 'goblin_armor',
    '闇の騎士': 'dark_knight',
    '森の妖精': 'fairy',
    '石像兵': 'golem',
    '天空騎士': 'sky_knight',
    'コウモリ': 'bat',
    'スケルトン': 'skeleton',
    'ゾンビ': 'zombie',
    'ハーピー': 'harpy',
    'ミノタウロス': 'minotaur',
    'リッチ': 'lich'
  };

  // enemy: オブジェクト or 文字列。spriteKey を優先しフォールバック→monster
  function enemySprite(enemy, size='') {
    const obj = (typeof enemy === 'string') ? { name: enemy } : (enemy || {});
    const key = obj.spriteKey || ENEMY_SPRITE[obj.name] || 'monster';
    const sz = size === 'lg' ? ' esprite-lg' : size === 'xl' ? ' esprite-xl' : size === 'sm' ? ' esprite-sm' : '';
    return `<span class="esprite esprite-${escapeAttr(key)}${sz}" title="${escapeAttr(obj.name || '')}"></span>`;
  }

  // 汎用トースト通知（alert()の代替）
  function showToast(msg, type='info', ms=2800) {
    let el = document.getElementById('game-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'game-toast';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.className = `game-toast toast-${type} toast-show`;
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.classList.remove('toast-show'); }, ms);
  }

  function showAchievementToast(ach) {
    // 既存のアチーブメントトーストがあれば削除して順次表示
    let el = document.getElementById('achievement-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'achievement-toast';
      document.body.appendChild(el);
    }
    el.innerHTML = `<span class="ach-toast-icon">${ach.emoji}</span>
      <div class="ach-toast-body">
        <div class="ach-toast-label">実績解除！</div>
        <div class="ach-toast-name">${ach.name}</div>
        <div class="ach-toast-desc">${ach.desc}</div>
      </div>`;
    el.classList.remove('ach-toast-show');
    void el.offsetWidth;
    el.classList.add('ach-toast-show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('ach-toast-show'), 4000);
  }

  function handleNewAchievements(newAchievements) {
    if (!newAchievements || newAchievements.length === 0) return;
    // 複数解除時は50msずつずらして表示
    newAchievements.forEach((ach, i) => {
      setTimeout(() => showAchievementToast(ach), i * 600);
    });
    // ダッシュボードを更新
    if (typeof HomeTab !== 'undefined' && HomeTab.renderAchievements) {
      setTimeout(() => HomeTab.renderAchievements(), 200);
    }
    Game.save();
  }

  function makePortrait(def, size='md') {
    const sizeClass = size === 'lg' ? 'portrait-lg' : 'portrait-md';
    const isLg = size === 'lg';
    const lazyAttrs = isLg ? '' : 'loading="lazy" decoding="async"';
    // 詳細用は標準WebP / 一覧はサムネWebP
    // DPR>=2 (Retina/高DPI画面) では1段上の解像度を使う
    const stdSrc   = `assets/characters/${def.id}.webp?v=${IMG_V}`;
    const thumbSrc = `assets/characters/thumbs/${def.id}.webp?v=${IMG_V}`;
    const hiresSrc = `assets/characters/hires/${def.id}.webp?v=${IMG_V}`;
    const pngSrc   = `assets/characters/${def.id}.png?v=${IMG_V}`;
    const primarySrc  = isLg ? stdSrc   : thumbSrc;
    const retinaSrc   = isLg ? hiresSrc : stdSrc;   // 2x で1段アップグレード
    const errHandler = `if(!this.dataset.fb){this.dataset.fb='1';this.src='${pngSrc}';}else{this.remove();}`;
    return `
      <div class="portrait ${sizeClass} rarity-${def.rarity}" style="background:${def.gradient}">
        <span class="portrait-emoji" aria-hidden="true">${def.emoji}</span>
        <img ${lazyAttrs} src="${primarySrc}" srcset="${primarySrc} 1x, ${retinaSrc} 2x"
             alt="${def.name}のポートレート"
             onload="this.classList.add('loaded')" onerror="${errHandler}">
        <span class="rarity-badge badge-${def.rarity}" aria-label="レアリティ ${def.rarity}">${def.rarity}</span>
      </div>`;
  }

  // ─── プレイヤー名表示 ────────────────────────────────────────────────────

  function updatePlayerName() {
    const el = $('player-name');
    if (el) el.textContent = Game.getState().player.name || 'まほうつかい';
  }

  // ─── リソースバー更新（全タブ共通） ────────────────────────────────────

  // ─── LINE通知 ──────────────────────────────────────────────────────────────

  const LINE_NOTIFY_URL = 'https://line-claude-bot-ymn6.onrender.com/line-notify';
  const LINE_UID_KEY    = 'magic_garden_line_uid';
  let _lineUserId         = localStorage.getItem(LINE_UID_KEY) || '';
  let _staminaNotifyArmed = false; // スタミナ<maxだった → 満タン到達で通知

  async function _sendLineNotify(event, message) {
    if (!_lineUserId) return;
    try {
      await fetch(LINE_NOTIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: _lineUserId, event, message }),
      });
    } catch(_) { /* ネットワーク失敗は無視 */ }
  }

  // ─── スタミナ秒単位タイマー用 ────────────────────────────────────────────
  let _staminaTimerIv = null;

  function _fmtSec(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2,'0')}`;
  }

  function _updateStaminaTimer() {
    const timerEl = $('stamina-timer');
    if (!timerEl) return;
    const st = Game.getStamina();
    if (st.current >= st.max) {
      // スタミナ満タン到達 → LINE通知（アームされていた場合のみ）
      if (_staminaNotifyArmed) {
        _staminaNotifyArmed = false;
        _sendLineNotify('stamina_full');
      }
      timerEl.classList.add('hidden');
      timerEl.textContent = '';
      if (_staminaTimerIv) { clearInterval(_staminaTimerIv); _staminaTimerIv = null; }
      return;
    }
    _staminaNotifyArmed = true; // 満タンでない → 次に満タンになったら通知
    timerEl.classList.remove('hidden');
    const toFull = st.secsToFull;
    if (toFull > 0) {
      const h = Math.floor(toFull / 3600);
      const remain = toFull % 3600;
      timerEl.textContent = h > 0
        ? `満タン ${h}h${_fmtSec(remain)}`
        : `満タン ${_fmtSec(remain)}`;
    }
  }

  function updateResourceBar() {
    const r = Game.getState().resources;
    $('coins').textContent    = Math.floor(r.coins).toLocaleString();
    $('crystals').textContent = Math.floor(r.crystals);
    const st   = Game.getStamina();
    const stEl = $('stamina-display');
    if (stEl) {
      const pct = Math.min(100, Math.round(st.current / st.max * 100));
      stEl.innerHTML = `
        <span class="st-label">${uiIcon('res_stamina', '<span class="picon picon-stam"></span>', 'sm')} ${st.current}/${st.max}</span>
        <span class="st-bar-wrap"><span class="st-bar-fill" style="width:${pct}%"></span></span>`;
      stEl.title = st.current < st.max
        ? `次回+1まで${st.nextRegenMin}分`
        : '満タン！';
      stEl.classList.toggle('stamina-low', st.current <= 5);
    }
    // タイマー即時更新 & 定期更新セットアップ
    _updateStaminaTimer();
    if (st.current < st.max && !_staminaTimerIv) {
      _staminaTimerIv = setInterval(_updateStaminaTimer, 1000);
    }
  }

  // ─── タブ切替 ───────────────────────────────────────────────────────────

  function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === tabName));
    document.querySelectorAll('.tab-panel').forEach(p =>
      p.classList.toggle('active', p.id === `tab-${tabName}`));

    if (tabName === 'home')      HomeTab.update();
    if (tabName === 'adventure') AdventureTab.update();
    if (tabName === 'generals')  GeneralsTab.update();
    if (tabName === 'gacha')     GachaTab.update();
    if (tabName === 'zukan')     ZukanTab.update();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ホームタブ
  // ═══════════════════════════════════════════════════════════════════════════

  const HomeTab = {
    update() {
      this.renderFormation();
      this.renderDashboard();
      this.renderDailyTasks();
      this.renderWeeklyTasks();
    },

    renderDashboard() {
      const el = $('home-dashboard');
      if (!el) return;

      // クラウドセーブ未設定バナー
      const banner = $('cloud-save-banner');
      if (banner) {
        const dismissed = sessionStorage.getItem('cloud_banner_dismissed') === '1';
        banner.classList.toggle('hidden', Storage.isConfigured() || dismissed);
      }

      const state   = Game.getState();
      const cleared = state.progress.clearedStages.length;
      const total   = getAllStageIds().length;
      const pct     = Math.round(cleared / total * 100);
      const power   = Math.floor(Game.calcTeamPower());
      const rate    = Math.floor(Game.getIdleRate());
      const genCnt  = Object.keys(state.generals).length;
      const streak  = state.progress.winStreak || 0;
      const maxStreak = state.progress.maxWinStreak || 0;

      // ステージクリア進捗バー付きチップ
      const clearBar = `<div class="dash-progress-wrap">
        <div class="dash-progress-bar" style="width:${pct}%"></div>
      </div><span class="dash-pct">${pct}%</span>`;

      // 連勝ストリーク表示（3以上のみ）
      const streakEmoji = streak >= 20 ? '🌈' : streak >= 10 ? '🔥' : streak >= 5 ? '⚡' : '🎯';
      const streakChip = streak >= 3 ? `
        <div class="dash-chip dash-chip--streak">
          <span class="dash-icon">${uiIcon('ach_streak_10', '<span class="picon picon-fire"></span>', 'lg')}</span>
          <span class="dash-val">${streak}</span>
          <span class="dash-lbl">連勝中！</span>
        </div>` : `
        <div class="dash-chip dash-chip--streak">
          <span class="dash-icon">${uiIcon('ach_streak_3', '<span class="picon picon-target"></span>', 'lg')}</span>
          <span class="dash-val">${maxStreak || '-'}</span>
          <span class="dash-lbl">最大連勝</span>
        </div>`;

      el.innerHTML = `
        <div class="dash-chip dash-chip--clear">
          <span class="dash-icon">${uiIcon('ach_wins_10', '<span class="picon picon-trophy"></span>', 'lg')}</span>
          <span class="dash-val">${cleared}<span class="dash-total">/${total}</span></span>
          <span class="dash-lbl">クリア</span>
          ${clearBar}
        </div>
        <div class="dash-chip dash-chip--power">
          <span class="dash-icon">${uiIcon('equip_weapon', '<span class="picon picon-sword"></span>', 'lg')}</span>
          <span class="dash-val">${power >= 10000 ? (power/1000).toFixed(1)+'K' : power.toLocaleString()}</span>
          <span class="dash-lbl">戦力</span>
        </div>
        ${streakChip}
        <div class="dash-chip dash-chip--idle">
          <span class="dash-icon">${uiIcon('res_coin', '<span class="picon picon-coin"></span>', 'lg')}</span>
          <span class="dash-val">${rate}</span>
          <span class="dash-lbl">毎分収益</span>
        </div>
        <div class="dash-chip dash-chip--generals">
          <span class="dash-icon">${uiIcon('ach_own_15', '<span class="picon picon-people"></span>', 'lg')}</span>
          <span class="dash-val">${genCnt}<span class="dash-total">/${Object.keys(GENERALS_DATA).length}</span></span>
          <span class="dash-lbl">副将</span>
        </div>
        ${Game.isTowerUnlocked() ? `
        <div class="dash-chip dash-chip--tower" title="無限塔 最高到達階" onclick="switchTab('adventure');setTimeout(()=>{document.getElementById('tower-tab-btn')?.click()},100)" style="cursor:pointer">
          <span class="dash-icon">🗼</span>
          <span class="dash-val">${Game.getTowerFloor() || '-'}<span class="dash-total">${Game.getTowerFloor() ? 'F' : ''}</span></span>
          <span class="dash-lbl">無限塔</span>
        </div>` : ''}`;

      // アチーブメントパネルを別途更新
      this.renderAchievements();
    },

    renderAchievements() {
      const el = document.getElementById('achievement-panel');
      if (!el) return;
      const achs = Game.getAchievements ? Game.getAchievements() : [];
      const unlockedCount = achs.filter(a => a.unlocked).length;
      const total = achs.length;
      const pct = Math.round(unlockedCount / total * 100);

      el.innerHTML = `
        <div class="ach-progress-row">
          <span class="ach-progress">${unlockedCount}/${total} <span class="ach-pct">(${pct}%)</span></span>
        </div>
        <div class="ach-grid">
          ${achs.map(a => {
            const iconHtml = a.unlocked
              ? uiIcon(`ach_${a.id}`, `<span class="ach-emoji">${a.emoji}</span>`, 'lg')
              : uiIcon('ach_locked', `<span class="ach-emoji">🔒</span>`, 'lg');
            return `
            <div class="ach-badge ${a.unlocked ? 'ach-unlocked' : 'ach-locked'}" title="${a.desc}">
              ${iconHtml}
              <span class="ach-name">${a.unlocked ? a.name : '???'}</span>
            </div>`;
          }).join('')}
        </div>`;
    },

    renderFormation() {
      const el = $('formation-display');
      if (!el) return;
      const state = Game.getState();
      el.innerHTML = '';

      const formDefs = state.formation
        .filter(gid => gid && state.generals[gid])
        .map(gid => GENERALS_DATA[gid]);

      state.formation.forEach((gid, i) => {
        const slot = document.createElement('div');
        slot.className = 'formation-slot';
        if (gid && state.generals[gid]) {
          const def   = Game.getGeneralDef(gid);
          const gs    = state.generals[gid];
          const stats = Game.getCharStats(gid);
          const power = Math.floor(stats.hp*0.1 + stats.atk*2 + stats.def*1.5 + stats.spd);
          const starsStr = '⭐'.repeat(gs.stars || 1);
          slot.innerHTML = `
            ${makePortrait(def,'md')}
            <div class="slot-name">${def.name}</div>
            <div class="slot-lv">Lv.${gs.level} <span style="font-size:9px;color:var(--gold)">${starsStr}</span></div>
            <div class="slot-power">💪${power.toLocaleString()}</div>`;
          slot.style.cursor = 'pointer';
          slot.addEventListener('click', () => {
            switchTab('generals');
            GeneralsTab.showDetail(gid);
          });
        } else {
          slot.innerHTML = `<div class="slot-empty">＋<br><small>未編成</small></div>`;
          slot.style.cursor = 'pointer';
          slot.addEventListener('click', () => switchTab('generals'));
        }
        el.appendChild(slot);
      });

      // 編成ボーナス表示
      if (formDefs.length >= 2) {
        const elems = formDefs.map(d => d.element).filter(Boolean);
        const roles = formDefs.map(d => d.type).filter(Boolean);
        const hasTank    = roles.includes('tank');
        const hasHealer  = roles.includes('healer');
        const hasAtk     = roles.some(r => ['attacker','assassin','mage'].includes(r));
        const allSameElem = elems.length === formDefs.length && elems.every(e => e === elems[0]);

        const bonuses = [];
        if (allSameElem && elems.length > 1) bonuses.push(`✨ ${elems[0]}属性共鳴 ATK+20%`);
        if (hasTank && hasHealer && hasAtk)   bonuses.push('⚡ 完璧布陣 ATK+10%');
        if (hasTank)   bonuses.push('🛡️ タンク前衛 敵ATK-15%');
        if (hasHealer) bonuses.push('💚 ヒーラー 毎3ターン全体回復');

        if (bonuses.length > 0) {
          const bonusDiv = document.createElement('div');
          bonusDiv.className = 'formation-bonus-bar';
          bonusDiv.innerHTML = bonuses.map(b => `<span class="fm-bonus">${b}</span>`).join('');
          el.parentElement.insertBefore(bonusDiv, el.nextSibling);
        } else {
          // 既存ボーナスバーがあれば削除
          const old = el.parentElement.querySelector('.formation-bonus-bar');
          if (old) old.remove();
        }
      }
    },

    renderDailyTasks() {
      const el = $('daily-tasks');
      if (!el) return;
      el.innerHTML = '';
      const tasks = Game.getDailyTasks();

      // 達成率バッジ更新
      const badge = $('daily-badge');
      if (badge) {
        const claimed = tasks.filter(t => t.isClaimed).length;
        badge.textContent = `${claimed}/${tasks.length}`;
        badge.classList.toggle('badge-complete', claimed === tasks.length);
      }

      tasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `daily-task ${task.isClaimed ? 'done' : ''}`;
        const hasProgress = task.id === 'battle' || task.id === 'boss';
        const progressBar = hasProgress
          ? `<div class="task-progress-wrap"><div class="task-progress-bar" style="width:${(task.progress/task.target*100)}%"></div></div>`
          : '';
        const rewardText = task.reward.coins
          ? `+${task.reward.coins}🪙` : `+${task.reward.crystals}💎`;

        let rightHtml;
        if (task.isClaimed) {
          rightHtml = `<span class="task-reward done">✓</span>`;
        } else if (task.isDone) {
          rightHtml = `<button class="btn-claim" data-task="${task.id}">${rewardText} 受取</button>`;
        } else {
          rightHtml = `<span class="task-reward">${rewardText}</span>`;
        }

        const iconHtml = uiIcon(`task_${task.id}`, `<span class="task-icon">${task.icon}</span>`, 'md');
        div.innerHTML = `
          ${iconHtml}
          <div class="task-info">
            <span class="task-label">${task.label}</span>
            ${hasProgress ? `<span class="task-count">${task.progress}/${task.target}</span>` : ''}
            ${progressBar}
          </div>
          ${rightHtml}`;
        el.appendChild(div);
      });

      el.querySelectorAll('.btn-claim[data-task]').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = Game.claimDailyTask(btn.dataset.task);
          if (r.success) { updateResourceBar(); this.renderDailyTasks(); this.renderWeeklyTasks(); }
        });
      });
    },

    renderWeeklyTasks() {
      const el = $('weekly-tasks');
      if (!el) return;
      el.innerHTML = '';

      // リセット日（次の月曜）を表示
      const label = $('weekly-reset-label');
      if (label) {
        const now   = new Date();
        const daysToMon = (8 - now.getDay()) % 7 || 7;
        const reset = new Date(now);
        reset.setDate(now.getDate() + daysToMon);
        label.textContent = `リセット: ${reset.getMonth()+1}/${reset.getDate()}`;
      }

      Game.getWeeklyTasks().forEach(task => {
        const div = document.createElement('div');
        div.className = `daily-task weekly-task ${task.isClaimed ? 'done' : ''}`;
        const pct      = Math.round(task.progress / task.target * 100);
        const progressBar = `<div class="task-progress-wrap"><div class="task-progress-bar weekly-bar" style="width:${pct}%"></div></div>`;
        const rewardText  = task.reward.crystals
          ? `+${task.reward.crystals}💎` : `+${task.reward.coins.toLocaleString()}🪙`;

        let rightHtml;
        if (task.isClaimed) {
          rightHtml = `<span class="task-reward done">✓</span>`;
        } else if (task.isDone) {
          rightHtml = `<button class="btn-claim weekly-claim" data-task="${task.id}">${rewardText} 受取</button>`;
        } else {
          rightHtml = `<span class="task-reward">${rewardText}</span>`;
        }

        const iconHtml = uiIcon(`task_${task.id}`, `<span class="task-icon">${task.icon}</span>`, 'md');
        div.innerHTML = `
          ${iconHtml}
          <div class="task-info">
            <span class="task-label">${task.label}</span>
            <span class="task-count">${task.progress}/${task.target}</span>
            ${progressBar}
          </div>
          ${rightHtml}`;
        el.appendChild(div);
      });

      el.querySelectorAll('.weekly-claim').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = Game.claimWeeklyTask(btn.dataset.task);
          if (r.success) { updateResourceBar(); this.renderWeeklyTasks(); }
        });
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 冒険タブ
  // ═══════════════════════════════════════════════════════════════════════════

  const AdventureTab = {
    currentChapter: 0,
    isBossTab: false,
    isTowerTab: false,

    update() {
      if (this.isTowerTab) { this.renderTower(); return; }
      this.isBossTab ? this.renderBossSection() : this.renderChapter();
      // 無限塔タブの表示/非表示制御
      const towerBtn = $('tower-tab-btn');
      if (towerBtn) towerBtn.classList.toggle('hidden', !Game.isTowerUnlocked());
    },

    _switchView(mode) {
      // mode: 'chapter' | 'boss' | 'tower'
      this.isBossTab  = mode === 'boss';
      this.isTowerTab = mode === 'tower';
      const stageList   = $('stage-list');
      const bossSection = $('daily-boss-section');
      const towerSection= $('tower-section');
      if (stageList)    stageList.classList.toggle('hidden', mode !== 'chapter');
      if (bossSection)  bossSection.classList.toggle('hidden', mode !== 'boss');
      if (towerSection) towerSection.classList.toggle('hidden', mode !== 'tower');

      document.querySelectorAll('.chapter-tab').forEach(btn => {
        const isTowerBtn   = !!btn.dataset.tower;
        const isBossBtn    = !!btn.dataset.boss;
        const isChapterBtn = btn.dataset.chapter !== undefined;
        let active = false;
        if (mode === 'tower'   && isTowerBtn)   active = true;
        if (mode === 'boss'    && isBossBtn)     active = true;
        if (mode === 'chapter' && isChapterBtn && parseInt(btn.dataset.chapter) === this.currentChapter) active = true;
        btn.classList.toggle('active', active);
      });
    },

    renderChapter() {
      this._switchView('chapter');
      const ch = STAGES_DATA[this.currentChapter];
      if (!ch) return;
      const cleared = Game.getState().progress.clearedStages;
      const allIds  = getAllStageIds();

      const el = $('stage-list');
      if (!el) return;
      el.innerHTML = '';

      // 章背景バナー
      const bgNames = ['ch1_forest', 'ch2_castle', 'ch3_temple', 'ch4_dragon', 'ch5_sky'];
      const bgName = bgNames[this.currentChapter] || 'ch1_forest';
      const banner = document.createElement('div');
      banner.className = 'chapter-banner';
      banner.innerHTML = `
        <img src="assets/backgrounds/${bgName}.png" alt="${ch.name}" onerror="this.style.display='none'">
        <div class="chapter-banner-title">${ch.name}</div>`;
      el.appendChild(banner);

      // ステージボス画像マップ
      const stageBossImg = {
        '1-5': 'boss_ancient_tree', '2-3': 'boss_demon_king',
        '3-6': 'boss_ancient_goddess', '4-6': 'boss_dragon_king', '5-5': 'boss_sky_guardian'
      };

      ch.stages.forEach(stage => {
        const idx       = allIds.indexOf(stage.id);
        const isCleared = cleared.includes(stage.id);
        const isNext    = idx === 0 || cleared.includes(allIds[idx - 1]);
        const isLocked  = !isCleared && !isNext;

        const div = document.createElement('div');
        div.className = `stage-item ${isCleared?'cleared':''} ${isNext&&!isCleared?'available':''} ${isLocked?'locked':''} ${stage.isBoss?'boss':''}`;

        const statusIcon = isCleared
          ? '<span class="picon picon-star"></span>'
          : isNext
            ? '<span class="picon picon-play"></span>'
            : '<span class="picon picon-lock"></span>';
        const btnHtml = !isLocked
          ? `<button class="btn-battle" data-stage="${stage.id}"><span class="picon picon-sword"></span> 戦闘</button>`
          : `<button class="btn-battle" disabled><span class="picon picon-lock"></span></button>`;

        const bossKey = stageBossImg[stage.id];
        const bossImgHtml = bossKey
          ? `<img src="assets/bosses/${bossKey}.png" class="stage-boss-img" alt="${stage.name}" onerror="this.style.display='none'">`
          : '';

        // Reward preview
        const r = stage.rewards;
        const matInfo = r.material && MATERIALS_DATA[r.material.id];
        const matHtml = matInfo
          ? `<span class="reward-chip">${matIcon(r.material.id)} ${matInfo.name} ${Math.round(r.material.chance*100)}%</span>`
          : '';
        const fcHtml = stage.firstClear
          ? `<span class="reward-chip reward-chip-fc">${uiIcon('res_gem', '<span class="picon picon-gem"></span>', 'sm')} 初回+${stage.firstClear.crystals}</span>`
          : '';
        const rewardBar = `<div class="stage-rewards-preview">
          <span class="reward-chip">${uiIcon('res_coin', '<span class="picon picon-coin"></span>', 'sm')} ${r.coins[0]}~${r.coins[1]}</span>
          <span class="reward-chip">${uiIcon('ach_lv10', '<span class="picon picon-exp"></span>', 'sm')} ${r.exp[0]}~${r.exp[1]}</span>
          ${matHtml}${fcHtml}
        </div>`;

        div.innerHTML = `
          <span class="stage-status">${statusIcon}</span>
          ${bossImgHtml}
          <div class="stage-info">
            <div class="stage-name">${stage.isBoss?'👑 ':''}${stage.id} ${stage.name}</div>
            <div class="stage-enemies">${stage.enemies.map(e=>enemySprite(e, 'sm')).join(' ')}</div>
            ${rewardBar}
          </div>
          ${btnHtml}`;
        el.appendChild(div);
      });

      el.querySelectorAll('.btn-battle[data-stage]').forEach(btn => {
        btn.addEventListener('click', () => this.handleBattle(btn.dataset.stage));
      });
    },

    renderBossSection() {
      this._switchView('boss');
      const bossState = Game.getDailyBossState();
      const attemptsEl = $('boss-attempts-text');
      if (attemptsEl) attemptsEl.textContent = `本日の挑戦: ${bossState.attemptsLeft}回残り（3回/日）`;

      const el = $('boss-cards');
      if (!el) return;
      el.innerHTML = '';
      const dailyImgMap = { 'boss_easy': 'daily_easy', 'boss_normal': 'daily_normal', 'boss_hard': 'daily_hard' };
      DAILY_BOSS_DATA.forEach(boss => {
        const card = document.createElement('div');
        const disabled = bossState.attemptsLeft <= 0;
        card.className = `boss-card boss-${boss.difficulty}`;
        const bossImg = dailyImgMap[boss.id] || '';
        const imgHtml = bossImg
          ? `<img src="assets/bosses/${bossImg}.png" class="boss-card-img" alt="${escapeAttr(boss.name)}" onerror="this.outerHTML='${enemySprite(boss, 'lg').replace(/'/g, '&#39;')}'">`
          : enemySprite(boss, 'lg');
        card.innerHTML = `
          <div class="boss-card-header">
            ${imgHtml}
            <div>
              <div class="boss-name">${boss.name}</div>
              <div class="boss-difficulty-label">難易度：${boss.label}</div>
            </div>
          </div>
          <div class="boss-rewards">
            <span class="boss-reward-chip"><span class="picon picon-coin"></span> ${boss.rewards.coins[0].toLocaleString()}〜</span>
            <span class="boss-reward-chip"><span class="picon picon-gem"></span> +${boss.rewards.crystals}</span>
            <span class="boss-reward-chip">${matIcon(boss.rewards.material)} ×${boss.rewards.materialCount}</span>
          </div>
          <button class="btn-boss-fight" data-boss="${boss.id}" ${disabled ? 'disabled' : ''}>
            ${disabled ? '本日終了' : '<span class="picon picon-sword"></span> 挑戦する'}
          </button>`;
        el.appendChild(card);
      });

      el.querySelectorAll('.btn-boss-fight[data-boss]').forEach(btn => {
        btn.addEventListener('click', () => this.handleBossBattle(btn.dataset.boss));
      });
    },

    // ─── 無限塔 ─────────────────────────────────────────────────────────────

    renderTower() {
      this._switchView('tower');
      const el = $('tower-section');
      if (!el) return;

      const maxFloor   = Game.getTowerFloor();
      const nextFloor  = maxFloor + 1;
      const unlocked   = Game.isTowerUnlocked();

      if (!unlocked) {
        el.innerHTML = `<div class="tower-locked">
          <div class="tower-locked-icon">🗼</div>
          <div class="tower-locked-text">第6章「幻夢の回廊」を全クリアすると解放されます</div>
        </div>`;
        return;
      }

      // フロアカード表示（現在挑戦中フロア + 直近5フロア履歴）
      const displayFloors = [];
      for (let f = Math.max(1, maxFloor - 2); f <= nextFloor + 2; f++) {
        displayFloors.push(f);
      }

      let cardsHtml = displayFloors.map(f => {
        const isCleared = f <= maxFloor;
        const isNext    = f === nextFloor;
        const isLocked  = f > nextFloor;
        const isBoss    = f % 10 === 0;

        const icon = isCleared ? '⭐' : isNext ? '⚔️' : '🔒';
        const cls  = isCleared ? 'cleared' : isNext ? 'challenge' : 'locked';
        const bossLabel = isBoss ? '<span class="tower-boss-badge">👹 BOSS</span>' : '';

        // 報酬プレビュー
        const coinReward = f * 80;
        const crystalReward = f % 10 === 0 ? `<span class="reward-chip"><span class="picon picon-gem"></span> +${f}</span>` : '';

        return `<div class="tower-floor-card ${cls}">
          <div class="tower-floor-head">
            <span class="tower-floor-num">${icon} ${f}F ${bossLabel}</span>
          </div>
          <div class="tower-floor-rewards">
            <span class="reward-chip"><span class="picon picon-coin"></span> ~${coinReward}</span>
            <span class="reward-chip"><span class="picon picon-exp"></span> ~${Math.floor(coinReward*0.6)}</span>
            ${crystalReward}
          </div>
          ${!isLocked
            ? `<button class="btn-tower-fight ${isNext?'btn-challenge':''}" data-floor="${f}">
                ${isCleared ? '🔁 再挑戦' : '<span class="picon picon-sword"></span> 挑戦'}</button>`
            : `<button class="btn-tower-fight" disabled>🔒</button>`}
        </div>`;
      }).join('');

      el.innerHTML = `
        <div class="tower-header">
          <div class="tower-title">🗼 無限塔</div>
          <div class="tower-record">最高到達階: <strong>${maxFloor === 0 ? '未挑戦' : maxFloor + 'F'}</strong></div>
          <div class="tower-hint">10の倍数フロアでボス戦！💎クリスタルが手に入ります</div>
        </div>
        <div class="tower-floors">${cardsHtml}</div>`;

      el.querySelectorAll('.btn-tower-fight[data-floor]').forEach(btn => {
        btn.addEventListener('click', () => this.handleTowerBattle(parseInt(btn.dataset.floor)));
      });
    },

    handleTowerBattle(floor) {
      const team = Game.getFormationTeam ? Game.getFormationTeam() : [];
      if (!team || team.filter(t => t).length === 0) {
        showToast('👥 編成に副将を入れてください！', 'warn'); return;
      }
      const stCur = Game.getStamina ? (Game.getStamina().current ?? 0) : 999;
      if (stCur < 1) {
        showToast('⚡ スタミナ不足！', 'warn'); return;
      }

      // バトル演出 → 実行（敵のプレビューを取得してイントロに渡す）
      const towerEnemies = Game.getTowerEnemyPreview?.(floor) || [];
      this.showBattleIntro({ team, enemies: towerEnemies, isBoss: floor % 10 === 0, stageName: `無限塔 ${floor}F` }, () => {
        const result = Game.towerBattle(floor);
        if (!result.win && result.reason) {
          const msgs = { no_stamina: 'スタミナ不足', no_team: '編成が空です', tower_locked: '塔はまだ解放されていません', floor_locked: 'まず前のフロアをクリアしてください' };
          showToast(msgs[result.reason] || result.reason, 'warn'); return;
        }
        updateResourceBar();
        this.showTowerResult(floor, result);
      });
    },

    showTowerResult(floor, result) {
      const overlay = document.createElement('div');
      overlay.className = 'battle-result-overlay';
      const isBoss = floor % 10 === 0;
      const winEmoji = result.win ? (isBoss ? '🏆' : '⭐') : '💀';
      const titleText = result.win
        ? (isBoss ? `${floor}F BOSS 討伐！` : `${floor}F クリア！`)
        : `${floor}F 敗北…`;

      let lootHtml = '';
      if (result.win && result.loot) {
        const l = result.loot;
        lootHtml = `<div class="battle-loot">
          <div class="loot-item"><span class="picon picon-coin"></span> +${l.coins.toLocaleString()}</div>
          <div class="loot-item"><span class="picon picon-exp"></span> +${l.exp.toLocaleString()}</div>
          ${l.crystals ? `<div class="loot-item"><span class="picon picon-gem"></span> +${l.crystals} 💎ボーナス！</div>` : ''}
        </div>`;
      }

      overlay.innerHTML = `
        <div class="battle-result-card ${result.win ? 'win' : 'lose'}">
          <div class="battle-result-title">${winEmoji} ${titleText}</div>
          <div class="battle-result-turns">🕐 ${result.turns}ターン</div>
          ${lootHtml}
          <div class="battle-result-actions">
            <button class="btn btn-primary" id="tower-result-next">
              ${result.win ? (floor < (Game.getTowerFloor() + 1) ? '✅ 閉じる' : `⚔️ ${floor + 1}Fへ挑戦`) : '🔁 再挑戦'}
            </button>
            <button class="btn btn-outline" id="tower-result-close">一覧に戻る</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);

      const closeAndUpdate = () => { overlay.remove(); this.renderTower(); };
      $('tower-result-close')?.addEventListener('click', closeAndUpdate);
      $('tower-result-next')?.addEventListener('click', () => {
        overlay.remove();
        if (result.win && floor === Game.getTowerFloor()) {
          this.handleTowerBattle(floor + 1);
        } else if (!result.win) {
          this.handleTowerBattle(floor);
        } else {
          this.renderTower();
        }
      });
    },

    lastStageId: null,

    handleBattle(stageId) {
      const stage = (typeof findStageDef === 'function') ? findStageDef(stageId) : null;
      const team = Game.getFormationTeam ? Game.getFormationTeam() : [];
      // ── 演出前バリデーション (失敗時は演出をスキップ) ──
      if (!team || team.filter(t => t).length === 0) {
        showToast('👥 編成に副将を入れてください！', 'warn'); return;
      }
      const stCur = Game.getStamina ? (Game.getStamina().current ?? 0) : 999;
      if (stCur < 1) {
        showToast('⚡ スタミナ不足！ 5分ごとに1回復します', 'warn'); updateResourceBar(); return;
      }
      this.showBattleIntro({ team, enemies: stage ? stage.enemies : [], isBoss: stage && stage.isBoss, stageName: stage ? stage.name : '' }, () => {
        const result = Game.battle(stageId);
        if (result.reason) {
          if (result.reason === 'no_team')    { showToast('👥 編成に副将を入れてください！', 'warn'); return; }
          if (result.reason === 'no_stamina') { showToast('⚡ スタミナ不足！', 'warn'); updateResourceBar(); return; }
          if (result.reason !== undefined && !result.win) { showToast('エラー: ' + result.reason, 'error'); return; }
        }
        this.lastStageId = stageId;
        updateResourceBar();
        this.renderChapter();
        HomeTab.renderDailyTasks();
        this.showBattleResult(stageId, result, false);
      });
    },

    handleBossBattle(bossId) {
      const team = Game.getFormationTeam ? Game.getFormationTeam() : [];
      const boss = (typeof DAILY_BOSS_DATA !== 'undefined') ? DAILY_BOSS_DATA.find(b => b.id === bossId) : null;
      // ── 演出前バリデーション ──
      if (!team || team.filter(t => t).length === 0) {
        showToast('👥 編成に副将を入れてください！', 'warn'); return;
      }
      const stateNow = Game.getState ? Game.getState() : {};
      const dailyBoss = stateNow.dailyBoss || {};
      const attemptsLeft = (dailyBoss.maxAttempts ?? 5) - (dailyBoss.bossAttempts ?? 0);
      if (attemptsLeft <= 0) {
        showToast('🔒 本日の挑戦回数が尽きました', 'warn'); return;
      }
      const stCur = Game.getStamina ? (Game.getStamina().current ?? 0) : 999;
      if (stCur < 3) {
        showToast('⚡ スタミナ不足！ 日課ボスは3消費します', 'warn'); updateResourceBar(); return;
      }
      this.showBattleIntro({ team, enemies: boss ? boss.enemies : [], isBoss: true, stageName: boss ? boss.name : '' }, () => {
        const result = Game.battleBoss(bossId);
        if (result.reason === 'no_attempts') { showToast('🔒 本日の挑戦回数が尽きました', 'warn'); return; }
        if (result.reason === 'no_team')     { showToast('👥 編成に副将を入れてください！', 'warn'); return; }
        if (result.reason === 'no_stamina')  { showToast('⚡ スタミナ不足！', 'warn'); updateResourceBar(); return; }
        updateResourceBar();
        this.renderBossSection();
        HomeTab.renderDailyTasks();
        this.showBattleResult(bossId, result, true);
      });
    },

    showBattleIntro({ team, enemies, isBoss, stageName }, onDone) {
      const intro = document.getElementById('battle-intro');
      // 設定で OFF の場合は演出スキップ
      if (!intro || (window.__gameSettings && !window.__gameSettings.vsIntro)) { onDone(); return; }
      const left  = intro.querySelector('.intro-team-left');
      const right = intro.querySelector('.intro-team-right');
      const sub   = intro.querySelector('.intro-vs-sub');
      const warn  = intro.querySelector('.intro-warn');
      const vs    = intro.querySelector('.intro-vs-text');

      // 味方ポートレート (WebP優先・PNG fallback・alt付き)
      left.innerHTML = (team || []).filter(t => t && t.def).map((g, i) => {
        const d = g.def || {};
        const webp = `assets/characters/${d.id}.webp?v=${IMG_V}`;
        const png  = `assets/characters/${d.id}.png?v=${IMG_V}`;
        const err  = `if(!this.dataset.fb){this.dataset.fb='1';this.src='${png}';}else{this.style.display='none';}`;
        return `
        <div class="intro-fighter intro-ally" style="animation-delay:${i * 0.08}s">
          <div class="intro-portrait" style="background:${d.gradient || '#555'}">
            <img src="${webp}" onerror="${err}" alt="${d.name || ''}">
            <span class="intro-emoji" aria-hidden="true">${d.emoji || '⚔️'}</span>
          </div>
          <div class="intro-name">${d.name || ''}${d.element ? ` <span class="intro-elem">${d.element}</span>` : ''}</div>
        </div>
      `;}).join('');

      // 敵アイコン (ピクセルスプライト)
      right.innerHTML = (enemies || []).slice(0, 4).map((e, i) => `
        <div class="intro-fighter intro-foe" style="animation-delay:${i * 0.08}s">
          <div class="intro-portrait intro-portrait-foe ${isBoss ? 'intro-portrait-boss' : ''}">
            ${enemySprite(e, 'lg')}
          </div>
          <div class="intro-name">${e.name || ''}${e.element ? ` <span class="intro-elem">${e.element}</span>` : ''}</div>
        </div>
      `).join('');

      sub.textContent = stageName || '';
      intro.classList.remove('hidden');
      intro.classList.remove('intro-boss');
      warn.classList.add('hidden');
      vs.classList.remove('pulse');

      // ボスなら警告フラッシュ → VS
      const run = () => {
        void intro.offsetWidth;
        intro.classList.add('intro-playing');
        vs.classList.add('pulse');
        setTimeout(() => {
          intro.classList.add('intro-fadeout');
          setTimeout(() => {
            intro.classList.add('hidden');
            intro.classList.remove('intro-playing', 'intro-fadeout');
            onDone();
          }, 350);
        }, 1400);
      };

      if (isBoss) {
        intro.classList.add('intro-boss');
        warn.classList.remove('hidden');
        setTimeout(() => { warn.classList.add('hidden'); run(); }, 850);
      } else {
        run();
      }
    },

    showBattleResult(id, result, isBoss) {
      const win = result.win;

      // チャプター背景を result-panel に適用
      const resultPanel = document.querySelector('#battle-result .result-panel');
      const bgNames = ['ch1_forest', 'ch2_castle', 'ch3_temple', 'ch4_dragon', 'ch5_sky'];
      if (resultPanel && !isBoss && id && id.includes('-')) {
        const chIdx = parseInt(id[0]) - 1;
        const bg = bgNames[chIdx] || 'ch1_forest';
        resultPanel.style.backgroundImage = `linear-gradient(rgba(8,8,18,.88), rgba(8,8,18,.88)), url(assets/backgrounds/${bg}.png)`;
      } else if (resultPanel) {
        resultPanel.style.backgroundImage = '';
      }

      const banner = $('result-banner');
      banner.className = 'result-banner';         // クラス一旦リセット（再アニメ用）
      banner.textContent = win ? '🎉 勝利！' : '💀 敗北…';
      void banner.offsetWidth;                    // reflow で animation をリセット
      banner.classList.add(win ? 'win' : 'lose');

      // 映画級フィニッシュ演出：勝利=光線バースト / 敗北=画面暗転ビネット
      const battleResultEl = document.getElementById('battle-result');
      battleResultEl.classList.remove('finish-win', 'finish-lose', 'finish-boss-win');
      void battleResultEl.offsetWidth;
      if (win) {
        battleResultEl.classList.add('finish-win');
        if (isBoss) battleResultEl.classList.add('finish-boss-win');
      } else {
        battleResultEl.classList.add('finish-lose');
      }

      // クリティカルが発生していたら画面を一瞬震わす
      const logArr = (result && result.log) || [];
      const critCount = logArr.filter(l => typeof l === 'string' && l.includes('暴撃')).length;
      if (critCount >= 1 && win) {
        battleResultEl.classList.add('finish-crit-shake');
        setTimeout(() => battleResultEl.classList.remove('finish-crit-shake'), 700);
      }

      // 勝利時の紙吹雪アニメーション (設定で OFF なら省略)
      const confettiEl = $('confetti-container');
      confettiEl.innerHTML = '';
      if (win && (!window.__gameSettings || window.__gameSettings.confetti)) {
        const colors = ['#ffd700','#ff6b6b','#4ecdc4','#a8e6cf','#ff8b94','#c3b1e1','#fddb92','#d4fc79'];
        for (let i = 0; i < 45; i++) {
          const piece = document.createElement('div');
          piece.className = 'confetti-piece';
          const size = 6 + Math.random() * 8;
          const left = Math.random() * 100;
          const delay = Math.random() * 1.2;
          const dur   = 2.2 + Math.random() * 1.8;
          piece.style.cssText = `
            left:${left}%; width:${size}px; height:${size * (0.4 + Math.random())}px;
            background:${colors[Math.floor(Math.random()*colors.length)]};
            animation-duration:${dur}s; animation-delay:${delay}s;
          `;
          confettiEl.appendChild(piece);
        }
        setTimeout(() => { confettiEl.innerHTML = ''; }, 5000);
      }

      const lootEl = $('result-loot');
      lootEl.innerHTML = '';
      if (win) {
        const loot = result.loot;
        if (loot.coins)    lootEl.innerHTML += `<span class="loot-chip"><span class="picon picon-coin"></span> +${loot.coins.toLocaleString()}</span>`;
        if (loot.exp)      lootEl.innerHTML += `<span class="loot-chip"><span class="picon picon-exp"></span> EXP +${loot.exp}</span>`;
        if (loot.crystals) lootEl.innerHTML += `<span class="loot-chip"><span class="picon picon-gem"></span> +${loot.crystals}</span>`;
        if (loot.material) {
          const md = MATERIALS_DATA[loot.material];
          if (md) lootEl.innerHTML += `<span class="loot-chip">${matIcon(loot.material)} ${md.name} ×${loot.materialCount||1}</span>`;
        }
        if (!isBoss) {
          loot.items?.forEach(inst => {
            const ed = EQUIPMENT_DATA[inst.defId];
            if (ed) lootEl.innerHTML += `<span class="loot-chip rarity-chip-${ed.rarity}">${ed.emoji} ${ed.name}</span>`;
          });
          if (loot.firstClear?.crystals) lootEl.innerHTML += `<span class="loot-chip first-clear"><span class="picon picon-gem"></span> 初回 +${loot.firstClear.crystals}</span>`;
        }
        if (isBoss && result.attemptsLeft !== undefined) {
          lootEl.innerHTML += `<div class="loot-remaining">残り挑戦: ${result.attemptsLeft}回</div>`;
        }
        // レベルアップ通知
        if (!isBoss && loot.levelUps?.length > 0) {
          loot.levelUps.forEach(lu => {
            lootEl.innerHTML += `<span class="loot-chip level-up-chip">⬆️ ${lu.name} Lv.${lu.newLevel}!</span>`;
          });
        }
        // 連勝ストリーク表示
        if (loot.streak >= 3) {
          const streakEmoji = loot.streak >= 20
            ? '<span class="picon picon-trophy"></span>'
            : loot.streak >= 10
              ? '<span class="picon picon-fire"></span>'
              : loot.streak >= 5
                ? '<span class="picon picon-stam"></span>'
                : '<span class="picon picon-target"></span>';
          const multStr = loot.streakMult ? ` (報酬×${loot.streakMult.toFixed(1)})` : '';
          lootEl.innerHTML += `<span class="loot-chip streak-chip">${streakEmoji} ${loot.streak}連勝！${multStr}</span>`;
        }
      }

      // バトル統計サマリー
      const statsEl = $('result-stats');
      if (statsEl) {
        const st = result.stats;
        if (st) {
          statsEl.innerHTML = `
            <span class="bstat">⏱ ${result.turns}ターン</span>
            <span class="bstat"><span class="picon picon-sword"></span> ${st.teamDmg.toLocaleString()}ダメ</span>
            ${st.skillCount > 0 ? `<span class="bstat">✨ スキル${st.skillCount}回</span>` : ''}`;
        } else {
          statsEl.innerHTML = `<span class="bstat">⏱ ${result.turns}ターン</span>`;
        }
      }

      const logEl = $('result-log');
      logEl.innerHTML = '';
      const highlights = BattleEngine.extractHighlights(result.log, 7);
      renderLogEntries(highlights, logEl, 130);

      // 全ログトグル（ハイライト以外のエントリがある場合のみ表示）
      const toggleBtn = $('result-log-toggle');
      if (toggleBtn) {
        const hasMore = result.log.length > highlights.length;
        if (hasMore) {
          toggleBtn.classList.remove('hidden');
          toggleBtn.classList.remove('open');
          toggleBtn.textContent = `📜 全ログを見る（${result.log.length}行） ▼`;
          let expanded = false;
          const fresh = bindFresh(toggleBtn, () => {
            expanded = !expanded;
            fresh.classList.toggle('open', expanded);
            fresh.textContent = expanded
              ? '📜 折りたたむ ▲'
              : `📜 全ログを見る（${result.log.length}行） ▼`;
            if (expanded) {
              renderLogEntries(result.log, logEl);
            } else {
              renderLogEntries(highlights, logEl);
            }
          });
        } else {
          toggleBtn.classList.add('hidden');
        }
      }

      // 再挑戦ボタン（通常ステージのみ。勝敗ともに表示）
      const retryBtn = $('result-retry');
      if (retryBtn) {
        if (!isBoss) {
          retryBtn.classList.remove('hidden');
          retryBtn.innerHTML = win
            ? '<span class="picon picon-play"></span> もう一度'
            : '<span class="picon picon-play"></span> 再挑戦';
          bindFresh(retryBtn, () => {
            hide('battle-result');
            setTimeout(() => this.handleBattle(id), 80);
          });
        } else {
          retryBtn.classList.add('hidden');
        }
      }

      // 次のステージボタン (通常ステージ勝利時、次ステージが解放されている場合)
      const nextBtn = $('result-next');
      if (nextBtn) {
        let nextStageId = null;
        if (!isBoss && win && id && typeof getAllStageIds === 'function') {
          const ids = getAllStageIds();
          const idx = ids.indexOf(id);
          if (idx >= 0 && idx + 1 < ids.length) {
            const candidate = ids[idx + 1];
            // 解放済みかチェック (前ステージクリア済が条件)
            const st = Game.getState ? Game.getState() : {};
            const cleared = st.progress?.clearedStages || [];
            if (cleared.includes(id)) {
              nextStageId = candidate;
            }
          }
        }
        if (nextStageId) {
          nextBtn.classList.remove('hidden');
          const fresh2 = bindFresh(nextBtn, () => {
            hide('battle-result');
            setTimeout(() => this.handleBattle(nextStageId), 80);
          });
          if (!window.__gameSettings || window.__gameSettings.autofocusNext) {
            setTimeout(() => fresh2?.focus(), 50);
          }
        } else {
          nextBtn.classList.add('hidden');
        }
      }

      show('battle-result');

      // ─── 自動連戦モード ───
      const autoOn = window.__gameSettings && window.__gameSettings.autoReplay;
      const arBar  = document.getElementById('auto-replay-bar');
      const arCnt  = document.getElementById('auto-replay-counter');
      if (autoOn && !isBoss) {
        if (this._autoReplayTimer) clearTimeout(this._autoReplayTimer);
        const MAX_AUTO = 30; // 最大周回数
        const MAX_LOSS = 2;  // 連敗停止閾値
        if (win) {
          this._autoLossStreak = 0;
          this._autoReplayCount = (this._autoReplayCount || 0) + 1;
          if (this._autoReplayCount >= MAX_AUTO) {
            window.__stopAutoReplay?.(`⏹ ${MAX_AUTO}周完了。自動連戦を停止しました`, 'info');
          } else {
            const stCur = Game.getStamina ? (Game.getStamina().current ?? 0) : 0;
            if (stCur >= 1) {
              // 自動連戦バー表示・カウント更新
              if (arBar)  arBar.classList.remove('hidden');
              if (arCnt)  arCnt.textContent = `自動連戦中 ${this._autoReplayCount}/${MAX_AUTO}`;
              // スタミナ十分 → 自動再戦
              this._autoReplayTimer = setTimeout(() => {
                if (window.__gameSettings && window.__gameSettings.autoReplay
                    && Game.getStamina && (Game.getStamina().current ?? 0) >= 1
                    && !document.getElementById('battle-result').classList.contains('hidden')) {
                  hide('battle-result');
                  if (arBar) arBar.classList.add('hidden');
                  setTimeout(() => this.handleBattle(id), 80);
                }
              }, 2000);
            } else {
              if (arBar) arBar.classList.add('hidden');
              window.__stopAutoReplay?.('⚡ スタミナ切れ。自動連戦を停止しました', 'warn');
            }
          }
        } else {
          this._autoLossStreak = (this._autoLossStreak || 0) + 1;
          if (arBar) arBar.classList.add('hidden');
          if (this._autoLossStreak >= MAX_LOSS) {
            window.__stopAutoReplay?.(`💀 ${MAX_LOSS}連敗。自動連戦を停止しました（編成を見直してください）`, 'error');
          } else {
            window.__stopAutoReplay?.('💀 敗北。自動連戦を停止しました', 'error');
          }
        }
      } else {
        // 自動連戦OFF時はバーを隠す
        if (arBar) arBar.classList.add('hidden');
      }

      // アチーブメント解除通知
      if (result.newAchievements && result.newAchievements.length > 0) {
        handleNewAchievements(result.newAchievements);
      }
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 副将タブ
  // ═══════════════════════════════════════════════════════════════════════════

  // 属性カラーマップ (カード・フィルターボタン共通)
  const ELEM_COLOR = {
    '光': '#ffe566', '闇': '#cc88ff', '水': '#66ccff',
    '炎': '#ff7744', '火': '#ff7744', /* 炎が正規、火は旧互換 */
    '土': '#aacc66', '風': '#66eedd', '月': '#aabbff'
  };
  const ELEM_EMOJI = {
    '光': '☀', '闇': '🌑', '水': '💧',
    '炎': '🔥', '火': '🔥', /* 炎が正規、火は旧互換 */
    '土': '⛰', '風': '🌀', '月': '🌙'
  };

  const GeneralsTab = {
    _nameFilter:   '',
    _rarityFilter: 'all',
    _elemFilter:   'all',

    // 属性フィルターボタンを動的生成 (初回のみ)
    initElemFilter() {
      const row = $('elem-filter-row');
      if (!row || row.dataset.built) return;
      row.dataset.built = '1';
      // データから属性一覧を収集
      const elems = [...new Set(Object.values(GENERALS_DATA).map(d => d.element))].sort();
      const all = document.createElement('button');
      all.className = 'elem-filter-btn active';
      all.dataset.elem = 'all';
      all.textContent = '全属性';
      row.appendChild(all);
      elems.forEach(el => {
        const btn = document.createElement('button');
        btn.className = 'elem-filter-btn';
        btn.dataset.elem = el;
        btn.style.setProperty('--ec', ELEM_COLOR[el] || '#fff');
        btn.innerHTML = `${ELEM_EMOJI[el] || ''} ${el}`;
        row.appendChild(btn);
      });
      row.addEventListener('click', e => {
        const btn = e.target.closest('.elem-filter-btn');
        if (!btn) return;
        this._elemFilter = btn.dataset.elem;
        row.querySelectorAll('.elem-filter-btn').forEach(b =>
          b.classList.toggle('active', b.dataset.elem === this._elemFilter));
        this.renderGrid();
      });
    },

    update() {
      this.renderFormationEditor();
      this.initElemFilter();
      this.renderGrid();
      // フィルター状態の同期
      const searchEl = $('generals-search');
      if (searchEl) searchEl.value = this._nameFilter;
      document.querySelectorAll('.rarity-filter-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.rarity === this._rarityFilter));
    },

    renderFormationEditor() {
      const el = $('formation-editor');
      if (!el) return;
      const state = Game.getState();
      el.innerHTML = '';
      state.formation.forEach((gid, i) => {
        const slot = document.createElement('div');
        slot.className = 'fe-slot';
        if (gid && state.generals[gid]) {
          const def = Game.getGeneralDef(gid);
          const gs  = state.generals[gid];
          slot.innerHTML = `
            ${makePortrait(def,'md')}
            <div class="fe-name">${def.name}</div>
            <div class="fe-lv">Lv.${gs.level}</div>`;
          slot.addEventListener('click', () => this.showDetail(gid));
        } else {
          slot.innerHTML = `<div class="fe-empty">＋</div>`;
        }
        el.appendChild(slot);
      });
    },

    renderGrid() {
      const el = $('generals-grid');
      if (!el) return;
      const state = Game.getState();
      const inFormation = state.formation;
      const total = Object.keys(state.generals).length;
      $('generals-count') && ($('generals-count').textContent = `(${total}体)`);

      // ソートモード取得（セレクト or デフォルト）
      const sortMode = $('generals-sort')?.value || this._sortMode || 'rarity';
      const order = { LR: 0, MR: 1, UR: 2, SSR: 3, SR: 4, R: 5 };

      let sorted = Object.keys(state.generals).sort((a, b) => {
        const da = GENERALS_DATA[a], db = GENERALS_DATA[b];
        const ga = state.generals[a], gb = state.generals[b];
        if (sortMode === 'level') return gb.level - ga.level;
        if (sortMode === 'power') {
          const pa = Game.calcCharStats?.(ga, da);
          const pb = Game.calcCharStats?.(gb, db);
          const powA = pa ? (pa.atk*2 + pa.hp*0.5 + pa.def + pa.spd) : 0;
          const powB = pb ? (pb.atk*2 + pb.hp*0.5 + pb.def + pb.spd) : 0;
          return powB - powA;
        }
        if (sortMode === 'atk') {
          const pa = Game.calcCharStats?.(ga, da);
          const pb = Game.calcCharStats?.(gb, db);
          return (pb?.atk||0) - (pa?.atk||0);
        }
        if (sortMode === 'spd') {
          const pa = Game.calcCharStats?.(ga, da);
          const pb = Game.calcCharStats?.(gb, db);
          return (pb?.spd||0) - (pa?.spd||0);
        }
        // デフォルト: レア度→レベル
        return (order[da.rarity] - order[db.rarity]) || (gb.level - ga.level);
      });

      // フィルター適用
      const nameQ  = (this._nameFilter || '').trim().toLowerCase();
      const rarQ   = this._rarityFilter;
      const elemQ  = this._elemFilter;
      if (nameQ) {
        sorted = sorted.filter(gid => GENERALS_DATA[gid]?.name.toLowerCase().includes(nameQ));
      }
      if (rarQ && rarQ !== 'all') {
        sorted = sorted.filter(gid => GENERALS_DATA[gid]?.rarity === rarQ);
      }
      if (elemQ && elemQ !== 'all') {
        sorted = sorted.filter(gid => GENERALS_DATA[gid]?.element === elemQ);
      }

      el.innerHTML = '';

      sorted.forEach(gid => {
        const def   = GENERALS_DATA[gid];
        const gs    = state.generals[gid];
        const stats = Game.getCharStats(gid);
        const power = stats ? Math.floor(stats.hp*0.1 + stats.atk*2 + stats.def*1.5 + stats.spd) : 0;
        const card  = document.createElement('div');
        card.className = `general-card rarity-${def.rarity}`;
        const starsStr = '⭐'.repeat(gs.stars || 1);
        const inFm  = inFormation.includes(gid);
        const expNext = Game.expToNext(gs.level);
        const expPct  = expNext > 0 ? Math.min(100, Math.round((gs.exp / expNext) * 100)) : 100;
        const elemColor = ELEM_COLOR[def.element] || '#ccc';
        card.innerHTML = `
          ${makePortrait(def,'md')}
          <span class="card-elem-badge" style="--ec:${elemColor}">${ELEM_EMOJI[def.element] || ''} ${def.element}</span>
          ${inFm ? '<span class="formation-badge">編成中</span>' : ''}
          <div class="card-footer">
            <div class="card-name">${def.name}</div>
            <div class="card-lv">Lv.${gs.level} <span class="card-stars" style="font-size:9px">${starsStr}</span></div>
            <div class="card-exp-bar" title="EXP ${gs.exp}/${expNext} (${expPct}%)">
              <div class="card-exp-fill" style="width:${expPct}%"></div>
            </div>
            <div class="card-power"><span class="picon picon-sword"></span> ${power >= 1000 ? (power/1000).toFixed(1)+'K' : power}</div>
          </div>`;
        card.addEventListener('click', () => this.showDetail(gid));
        el.appendChild(card);
      });
    },

    showDetail(gid) {
      const def   = GENERALS_DATA[gid];
      const gs    = Game.getState().generals[gid];
      const stats = Game.getCharStats(gid);
      const inFm  = Game.getState().formation.includes(gid);
      const expMax = Game.expToNext(gs.level);
      const expPct = Math.min(100, Math.floor(gs.exp / expMax * 100));
      const blInfo0  = Game.getBreakLimitInfo(gid);
      const isAtMaxLv = gs.level >= blInfo0.maxLevel;
      const lvCost   = Game.levelUpCost(gs.level);
      const hasCoins = !isAtMaxLv && Game.getState().resources.coins >= lvCost;

      const equips = gs.equips;
      const slotLabels = {
        weapon:    '<span class="picon picon-sword"></span> 武器',
        armor:     '<span class="picon picon-shield"></span> 防具',
        accessory: '<span class="picon picon-ring"></span> 装飾'
      };
      const equipsHtml = Object.entries(slotLabels).map(([slot, label]) => {
        const iid  = equips[slot];
        const inst = iid ? Game.getState().inventory.equipment.find(e=>e.instanceId===iid) : null;
        const ed   = inst ? EQUIPMENT_DATA[inst.defId] : null;
        const enhTxt = inst && inst.enhanceLevel > 0 ? ` +${inst.enhanceLevel}` : '';
        return `<div class="equip-slot-row" data-general="${gid}" data-slot="${slot}" style="cursor:pointer;">
          <span class="equip-slot-label">${label}</span>
          <span class="equip-slot-val ${ed?'has-equip':''}">
            ${ed ? `${ed.emoji} ${ed.name}${enhTxt}` : '── タップして装備 ──'}
          </span>
          <span class="equip-slot-arrow">›</span>
        </div>`;
      }).join('');

      const stars   = gs.stars || 1;
      const shards  = gs.shards || 0;
      const awakenCost = Game.getAwakenCost(gid);
      const canAwaken  = awakenCost !== null && shards >= awakenCost;
      const starsHtml  = '⭐'.repeat(stars) + '☆'.repeat(6 - stars);
      const awakenHtml = stars < 6
        ? `<button class="btn btn-awaken" id="daw-btn" ${canAwaken?'':'disabled'}>
             覚醒 ${starsHtml}<br><small>欠片 ${shards}/${awakenCost}</small>
           </button>`
        : `<button class="btn btn-awaken" disabled>⭐ 最大覚醒 ⭐</button>`;

      const blInfo = Game.getBreakLimitInfo(gid);
      const breakHtml = blInfo.isMaxBreak
        ? `<button class="btn btn-break-limit" disabled>💎 限界突破完了 (Lv.${blInfo.maxLevel}上限)</button>`
        : `<button class="btn btn-break-limit" id="dbl-btn" ${blInfo.canBreak?'':'disabled'}>
             💎 限界突破 (${blInfo.breakCount+1}回目)<br>
             <small>欠片 ${blInfo.shards}/${blInfo.cost} → Lv.${blInfo.maxLevel+20}まで</small>
           </button>`;

      // ─── 前後キャラ計算（左右スワイプ・ナビボタン用） ───
      const allState = Game.getState();
      const ownedGids = Object.keys(allState.generals).filter(g => GENERALS_DATA[g]);
      const rOrder = { LR:0, MR:1, UR:2, SSR:3, SR:4, R:5 };
      const sortedGids = ownedGids.slice().sort((a, b) => {
        const da = GENERALS_DATA[a], db = GENERALS_DATA[b];
        const ra = rOrder[da.rarity] ?? 9, rb = rOrder[db.rarity] ?? 9;
        if (ra !== rb) return ra - rb;
        return (allState.generals[b].level || 1) - (allState.generals[a].level || 1);
      });
      const curIdx  = Math.max(0, sortedGids.indexOf(gid));
      const prevGid = sortedGids[(curIdx - 1 + sortedGids.length) % sortedGids.length];
      const nextGid = sortedGids[(curIdx + 1) % sortedGids.length];
      const hasMultiple = sortedGids.length > 1;

      // ─── 戦力値（放置少女スタイルの最重要指標） ───
      const power = Math.floor(stats.hp * 0.1 + stats.atk * 2 + stats.def * 1.5 + stats.spd);
      const fmtPower = power >= 10000 ? (power / 10000).toFixed(2) + '万' : power.toLocaleString();

      // ─── お気に入り状態 ───
      const isFav = !!gs.favorite;

      // Hero ビュー用ヘルパー（hires画像優先・標準WebP→PNG fallback）
      const charImgHires = `assets/characters/hires/${def.id}.webp?v=${IMG_V}`;
      const charImgWebp  = `assets/characters/${def.id}.webp?v=${IMG_V}`;
      const charImgPng   = `assets/characters/${def.id}.png?v=${IMG_V}`;
      // 多段フォールバック: hires WebP → 標準 WebP → PNG → 透明
      const heroImgErr   = `if(!this.dataset.fb){this.dataset.fb='1';this.src='${charImgWebp}';}` +
                           `else if(this.dataset.fb==='1'){this.dataset.fb='2';this.src='${charImgPng}';}` +
                           `else{this.style.opacity='0';}`;
      const heroBlurErr  = `if(!this.dataset.fb){this.dataset.fb='1';this.src='${charImgPng}';}else{this.style.opacity='0';}`;
      const skillIconFor = (sk) => {
        const t = sk.type || '';
        const n = sk.name || '';
        if (n.includes('炎') || n.includes('火') || n.includes('焔') || n.includes('焼')) return '🔥';
        if (n.includes('氷') || n.includes('凍') || n.includes('霜')) return '❄️';
        if (n.includes('雷') || n.includes('電')) return '⚡';
        if (n.includes('闇') || n.includes('影') || n.includes('黒')) return '🌑';
        if (n.includes('光') || n.includes('聖')) return '🌟';
        if (n.includes('風')) return '🌪️';
        if (n.includes('水')) return '💧';
        if (t.startsWith('heal')) return '✨';
        if (t.startsWith('buff')) return '🌀';
        if (t.startsWith('debuff')) return '🔮';
        if (t.endsWith('_all')) return '💥';
        if (t === 'taunt') return '🛡️';
        return '⚔️';
      };
      // PNG装備カテゴリアイコン（v75 で配置済）。fallback は絵文字
      const equipSlotIcon = {
        weapon: uiIcon('equip_weapon', '⚔️', 'md'),
        armor:  uiIcon('equip_armor',  '🛡️', 'md'),
        accessory: uiIcon('equip_accessory', '💍', 'md'),
      };
      const heroEquipSlotsHtml = ['weapon','armor','accessory'].map(slot => {
        const iid  = equips[slot];
        const inst = iid ? Game.getState().inventory.equipment.find(e=>e.instanceId===iid) : null;
        const ed   = inst ? EQUIPMENT_DATA[inst.defId] : null;
        if (!ed) {
          return `<button class="hero-slot hero-slot-empty" data-general="${gid}" data-slot="${slot}" aria-label="${slot}空き">
            <span class="hero-slot-icon">${equipSlotIcon[slot]}</span>
            <span class="hero-slot-empty-mark">＋</span>
          </button>`;
        }
        const enhTxt = inst.enhanceLevel > 0 ? `+${inst.enhanceLevel}` : '';
        return `<button class="hero-slot rarity-${ed.rarity}" data-general="${gid}" data-slot="${slot}" aria-label="${ed.name}">
          <span class="hero-slot-rarity-tag">${ed.rarity}</span>
          <span class="hero-slot-icon">${ed.emoji}</span>
          ${enhTxt ? `<span class="hero-slot-enh">${enhTxt}</span>` : ''}
        </button>`;
      }).join('');
      const heroSkillSlotsHtml = def.skills.map((sk, idx) => {
        const skLv = (gs.skillLevels?.[idx] ?? 1);
        return `<button class="hero-slot hero-skill-slot" data-skill-idx="${idx}" aria-label="${sk.name}">
          <span class="hero-slot-rarity-tag hero-slot-sp">SP${sk.sp}</span>
          <span class="hero-slot-icon">${skillIconFor(sk)}</span>
          <span class="hero-slot-enh">Lv.${skLv}</span>
        </button>`;
      }).join('');

      $('detail-body').innerHTML = `
        <!-- ━━━ Hero Zone ━━━ -->
        <div class="hero-zone rarity-${def.rarity}" data-char-id="${def.id}" data-char-name="${escapeAttr(def.name)}">
          <img class="hero-bg-blur" src="${charImgWebp}" onerror="${heroBlurErr}" alt="" aria-hidden="true" loading="eager" decoding="async">
          <img class="hero-bg-main" src="${charImgHires}" onerror="${heroImgErr}" alt="${escapeAttr(def.name)}" loading="eager" decoding="async">
          <div class="hero-vignette"></div>
          <div class="hero-corner hero-corner-tl"></div>
          <div class="hero-corner hero-corner-tr"></div>
          <div class="hero-corner hero-corner-bl"></div>
          <div class="hero-corner hero-corner-br"></div>
          <div class="hero-top-overlay">
            <span class="rarity-badge badge-${def.rarity}">${def.rarity}</span>
            <h2 class="hero-name">${def.name}</h2>
            <span class="hero-stars" title="覚醒">${starsHtml}</span>
            <button class="hero-fav-btn ${isFav?'is-fav':''}" aria-label="お気に入り" title="お気に入り">
              ${isFav ? '❤️' : '🤍'}
            </button>
          </div>
          <div class="hero-side hero-side-left">${heroEquipSlotsHtml}</div>
          <div class="hero-side hero-side-right">${heroSkillSlotsHtml}</div>
          ${hasMultiple ? `
            <button class="hero-nav hero-nav-prev" aria-label="前のキャラ" title="前のキャラ">‹</button>
            <button class="hero-nav hero-nav-next" aria-label="次のキャラ" title="次のキャラ">›</button>
            <div class="hero-page-indicator">${curIdx + 1} / ${sortedGids.length}</div>
          ` : ''}
          <div class="hero-bottom-overlay">
            <div class="hero-title-tag">『${def.title}』</div>
            <div class="hero-tags">
              <span class="tag tag-elem">${def.element}</span>
              <span class="tag tag-type">${def.typeName}</span>
              ${def.faction ? `<span class="tag tag-faction">🏰 ${def.faction}</span>` : ''}
            </div>
          </div>
          <span class="hero-zoom-hint" aria-hidden="true">🔍 タップで拡大</span>
        </div>

        <!-- ━━━ Quick Stats（戦力を1列目に統合） ━━━ -->
        <div class="hero-stats-bar">
          <div class="hero-lv-row">
            <span class="hero-lv">Lv.<strong>${gs.level}</strong></span>
            <div class="hero-exp-bar"><div class="hero-exp-fill" style="width:${expPct}%"></div></div>
            <span class="hero-exp-txt">${gs.exp}/${expMax}</span>
          </div>
          <div class="hero-quick-stats">
            <div class="quick-stat quick-stat-power">${uiIcon('stat_atk', '<span class="qs-icon">⚔️</span>', 'sm')}<span class="qs-val">${fmtPower}</span></div>
            <div class="quick-stat">${uiIcon('stat_hp',  '<span class="qs-icon">❤️</span>', 'sm')}<span class="qs-val">${stats.hp.toLocaleString()}</span></div>
            <div class="quick-stat">${uiIcon('stat_atk', '<span class="qs-icon">⚔️</span>', 'sm')}<span class="qs-val">${stats.atk.toLocaleString()}</span></div>
            <div class="quick-stat">${uiIcon('stat_def', '<span class="qs-icon">🛡️</span>', 'sm')}<span class="qs-val">${stats.def.toLocaleString()}</span></div>
            <div class="quick-stat">${uiIcon('stat_spd', '<span class="qs-icon">💨</span>', 'sm')}<span class="qs-val">${stats.spd}</span></div>
          </div>
        </div>

        <!-- ━━━ アクションアイコン群（市販ゲー風6個並列） ━━━ -->
        <div class="hero-action-grid">
          <button class="hero-act-btn ${hasCoins?'':'disabled'}" id="dlv-btn-icon" ${isAtMaxLv?'disabled':''}>
            ${uiIcon('ach_lv10', '<span class="hab-icon">📈</span>', 'md')}
            <span class="hab-label">育成</span>
            <span class="hab-sub">${isAtMaxLv ? 'MAX' : `${lvCost.toLocaleString()} ${uiIcon('res_coin', '🪙', 'sm')}`}</span>
          </button>
          <button class="hero-act-btn ${stars<6 && shards>=awakenCost?'':'disabled'}" id="daw-btn-icon" ${stars>=6?'disabled':''}>
            ${uiIcon('ach_streak_10', '<span class="hab-icon">⭐</span>', 'md')}
            <span class="hab-label">覚醒</span>
            <span class="hab-sub">${stars>=6 ? 'MAX' : `${shards}/${awakenCost}`}</span>
          </button>
          <button class="hero-act-btn ${blInfo.canBreak?'':'disabled'}" id="dbl-btn-icon" ${blInfo.isMaxBreak?'disabled':''}>
            ${uiIcon('res_gem', '<span class="hab-icon">💎</span>', 'md')}
            <span class="hab-label">限界突破</span>
            <span class="hab-sub">${blInfo.isMaxBreak ? '完了' : `+${blInfo.breakCount+1}回目`}</span>
          </button>
          <button class="hero-act-btn ${inFm?'is-active':''}" id="dfm-btn-icon">
            ${inFm ? '<span class="hab-icon">✅</span>' : uiIcon('equip_weapon', '<span class="hab-icon">⚔️</span>', 'md')}
            <span class="hab-label">${inFm ? '編成中' : '編成'}</span>
            <span class="hab-sub">${inFm ? '外す' : '入れる'}</span>
          </button>
        </div>

        <!-- 説明文 -->
        <p class="hero-desc">${def.description}</p>
        <p class="detail-shards-line">${uiIcon('res_gem', '💎', 'sm')} 欠片: <strong>${shards}</strong>個</p>

        ${(() => {
          const STAT_MAX = { hp: 30000, atk: 3500, def: 1500, spd: 200 };
          const STAT_COLOR = { hp: '#ef4444', atk: '#f97316', def: '#3b82f6', spd: '#10b981' };
          const rows = [
            { key: 'hp',  iconName: 'stat_hp',  emoji: '❤️', label: 'HP',   val: stats.hp,  fmt: stats.hp.toLocaleString() },
            { key: 'atk', iconName: 'stat_atk', emoji: '⚔️', label: '攻撃', val: stats.atk, fmt: stats.atk.toLocaleString() },
            { key: 'def', iconName: 'stat_def', emoji: '🛡️', label: '防御', val: stats.def, fmt: stats.def.toLocaleString() },
            { key: 'spd', iconName: 'stat_spd', emoji: '💨', label: '速度', val: stats.spd, fmt: String(stats.spd) },
          ];
          return `<div class="detail-stats-bars">${rows.map(r => {
            const pct = Math.min(100, Math.round(r.val / STAT_MAX[r.key] * 100));
            return `<div class="stat-bar-row">
              <span class="stat-bar-label">${uiIcon(r.iconName, r.emoji, 'sm')} ${r.label}</span>
              <div class="stat-bar-track">
                <div class="stat-bar-fill" style="width:${pct}%;background:${STAT_COLOR[r.key]}"></div>
              </div>
              <span class="stat-bar-val">${r.fmt}</span>
            </div>`;
          }).join('')}</div>`;
        })()}

        ${(() => {
          // 属性相性表示（BattleEngine.getElementInfo が利用可能な場合のみ）
          if (!def.element || typeof BattleEngine === 'undefined' || !BattleEngine.getElementInfo) return '';
          const ei = BattleEngine.getElementInfo(def.element);
          const chipHtml = (arr, color, label) =>
            arr.length === 0 ? '' :
            `<div class="elem-compat-row">
              <span class="elem-compat-label">${label}</span>
              <span class="elem-compat-chips">${arr.map(e => `<span class="elem-chip" style="color:${color}">${e}</span>`).join('')}</span>
            </div>`;
          return `<div class="detail-section detail-section--elem">
            <h4 class="section-label">属性相性 <span class="elem-self-chip">${def.element}</span></h4>
            ${chipHtml(ei.strong, '#f97316', '⚔️ 得意（×1.4）')}
            ${chipHtml(ei.weak,   '#ef4444', '💀 弱点（×1.4受）')}
            ${chipHtml(ei.resist, '#10b981', '🛡️ 耐性（×0.72受）')}
          </div>`;
        })()}

        <div class="detail-section">
          <h4 class="section-label">スキル</h4>
          ${def.skills.map((sk, idx) => {
            const skLv  = (gs.skillLevels?.[idx] ?? 1);
            const cost  = Game.getSkillUpgradeCost(gid, idx);
            const matMd = cost ? MATERIALS_DATA[cost.mat] : null;
            const have  = cost ? (Game.getState().inventory.materials[cost.mat] || 0) : 0;
            const canUp = cost && have >= cost.count;
            const skLvHtml = `<span class="skill-lv">Lv.${skLv}</span>`;
            const upBtn = cost
              ? `<button class="btn-skill-up" data-gid="${gid}" data-idx="${idx}" ${canUp?'':'disabled'}>
                   ▲ ${matMd?.emoji||'?'}×${cost.count} <small>(${have}/${cost.count})</small>
                 </button>`
              : `<span class="skill-lv-max">MAX</span>`;
            const effectPower = sk.power * (1 + (skLv - 1) * 0.1);
            const nextPower   = sk.power * (1 + skLv * 0.1);
            const isHeal      = sk.type?.startsWith('heal');
            const isAll       = sk.type?.endsWith('_all');
            const isBuff      = sk.type?.startsWith('buff') || sk.type?.startsWith('debuff');
            const typeLabel   = isHeal ? '回復' : isBuff ? '効果' : (isAll ? '全体威力' : '威力');
            const previewHtml = isBuff ? '' : `<div class="skill-preview">
              ${typeLabel} <strong>×${effectPower.toFixed(2)}</strong>
              ${skLv < 10 ? `<span class="preview-next"> → Lv${skLv+1}: ×${nextPower.toFixed(2)}</span>` : `<span class="preview-next"> (MAX)</span>`}
            </div>`;
            return `
            <div class="skill-row">
              <div class="skill-header">
                <span class="skill-name">${sk.name}</span>
                <div class="skill-right">
                  ${skLvHtml}
                  <span class="skill-sp">SP ${sk.sp}</span>
                </div>
              </div>
              <p class="skill-desc">${sk.description}</p>
              ${previewHtml}
              <div class="skill-upgrade-row">${upBtn}</div>
            </div>`;
          }).join('')}
        </div>

        ${(() => {
          const hasLore = def.faction || def.quote || def.lore || (def.relations?.length > 0);
          if (!hasLore) return '';
          const factionHtml = def.faction
            ? `<div class="lore-faction">🏰 <strong>${def.faction}</strong></div>` : '';
          const quoteHtml = def.quote
            ? `<div class="lore-quote">${def.quote}</div>` : '';
          const loreHtml = def.lore
            ? `<p class="lore-text">${def.lore}</p>` : '';
          const relHtml = (def.relations?.length > 0)
            ? `<div class="lore-relations">
                <h5 class="relations-label">⚔️ 人間関係</h5>
                ${def.relations.map(rel => {
                  const rDef = GENERALS_DATA[rel.id];
                  const relTypeLabel = {
                    ally: '味方', enemy: '敵', rival: 'ライバル', mentor: '師弟',
                    sworn_brother: '義兄弟', best_friend: '親友', enemy_turned_ally: '因縁の絆'
                  }[rel.type] || rel.type;
                  return `<div class="relation-row">
                    <span class="relation-char">${rDef ? rDef.emoji + ' ' + rDef.name : rel.id}</span>
                    <span class="relation-tag">${relTypeLabel}</span>
                    <span class="relation-desc">${rel.desc}</span>
                  </div>`;
                }).join('')}
              </div>` : '';
          return `<div class="detail-section detail-section--lore">
            <h4 class="section-label">📖 世界観・人間関係</h4>
            ${factionHtml}${quoteHtml}${loreHtml}${relHtml}
          </div>`;
        })()}

        <div class="detail-section">
          <h4 class="section-label">装備</h4>
          ${equipsHtml}
        </div>

        `;
      // 旧テキストボタンは削除（hero-action-grid に集約）

      show('general-detail');
      // スクロール位置を先頭にリセット
      // iOS Safari: align-items:flex-end の overflow:auto 子要素は初回も底にスクロールするバグあり
      const panel = document.querySelector('.detail-panel');
      if (panel) {
        panel.scrollTop = 0;
        requestAnimationFrame(() => { panel.scrollTop = 0; });
      }

      // 装備スロットをタップ → EquipPicker を開く（旧リスト + Hero Zone 両方）
      $('detail-body').querySelectorAll('[data-slot]').forEach(row => {
        row.addEventListener('click', e => {
          e.stopPropagation();
          EquipPicker.open(row.dataset.general, row.dataset.slot);
        });
      });

      // Hero Zone のスキルスロット → 該当スキル詳細にスクロール
      $('detail-body').querySelectorAll('.hero-skill-slot').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const idx = Number(btn.dataset.skillIdx);
          const skillRows = $('detail-body').querySelectorAll('.skill-row');
          if (skillRows[idx]) {
            skillRows[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
            skillRows[idx].classList.add('skill-row-flash');
            setTimeout(() => skillRows[idx].classList.remove('skill-row-flash'), 1200);
          }
        });
      });

      // お気に入りトグル
      $('detail-body').querySelector('.hero-fav-btn')?.addEventListener('click', e => {
        e.stopPropagation();
        const nowFav = Game.toggleFavorite(gid);
        showToast(nowFav ? '❤️ お気に入りに追加' : '🤍 お気に入りを解除', 'success');
        this.showDetail(gid);
        this.renderGrid();
      });

      // 前/次キャラナビゲーション
      const goToChar = (targetGid) => {
        if (!targetGid || targetGid === gid) return;
        const heroZone = $('detail-body').querySelector('.hero-zone');
        if (heroZone) {
          heroZone.classList.add('hero-zone-fade-out');
          setTimeout(() => this.showDetail(targetGid), 120);
        } else {
          this.showDetail(targetGid);
        }
      };
      $('detail-body').querySelector('.hero-nav-prev')?.addEventListener('click', e => {
        e.stopPropagation();
        goToChar(prevGid);
      });
      $('detail-body').querySelector('.hero-nav-next')?.addEventListener('click', e => {
        e.stopPropagation();
        goToChar(nextGid);
      });

      // 左右スワイプでキャラ切替（hero-zone 上のみ）
      if (hasMultiple) {
        const heroZone = $('detail-body').querySelector('.hero-zone');
        if (heroZone) {
          let tStartX = 0, tStartY = 0, tStartT = 0, tracking = false;
          heroZone.addEventListener('touchstart', e => {
            // スロット・ボタン上のスワイプは無視
            if (e.target.closest('.hero-slot, .hero-nav, .hero-fav-btn, .hero-top-overlay, .hero-bottom-overlay')) {
              tracking = false;
              return;
            }
            tStartX = e.touches[0].clientX;
            tStartY = e.touches[0].clientY;
            tStartT = Date.now();
            tracking = true;
          }, { passive: true });
          heroZone.addEventListener('touchend', e => {
            if (!tracking) return;
            tracking = false;
            const dx = e.changedTouches[0].clientX - tStartX;
            const dy = e.changedTouches[0].clientY - tStartY;
            const dt = Date.now() - tStartT;
            // 横方向 50px 以上 + 縦より明らかに横が大きい + 800ms以内
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4 && dt < 800) {
              if (dx > 0) goToChar(prevGid);
              else         goToChar(nextGid);
            }
          }, { passive: true });
        }
      }

      // アクションアイコンボタン（新6個並列版）
      $('dlv-btn-icon')?.addEventListener('click', () => {
        const r = Game.levelUpGeneral(gid);
        if (r.success) { updateResourceBar(); this.showDetail(gid); this.renderGrid(); }
      });
      $('daw-btn-icon')?.addEventListener('click', () => {
        const r = Game.awakenGeneral(gid);
        if (r.success) { this.showDetail(gid); this.renderGrid(); }
      });
      $('dbl-btn-icon')?.addEventListener('click', () => {
        const r = Game.breakLimit(gid);
        if (r.success) { this.showDetail(gid); this.renderGrid(); }
        else if (r.reason === 'no_shards') showToast(`欠片不足！ 必要: ${r.needed}個`, 'warn');
      });
      $('dfm-btn-icon')?.addEventListener('click', () => {
        inFm ? Game.removeFromFormation(gid) : Game.addToFormation(gid);
        this.showDetail(gid);
        this.renderGrid();
        this.renderFormationEditor();
        HomeTab.renderFormation();
      });

      // キーボード ←/→ でも切替
      const keyHandler = (e) => {
        if ($('general-detail').classList.contains('hidden')) return;
        if (e.key === 'ArrowLeft')  { e.preventDefault(); goToChar(prevGid); }
        if (e.key === 'ArrowRight') { e.preventDefault(); goToChar(nextGid); }
      };
      document.removeEventListener('keydown', this._heroNavKeyHandler);
      document.addEventListener('keydown', keyHandler);
      this._heroNavKeyHandler = keyHandler;

      // 旧 dlv-btn/dfm-btn/daw-btn/dbl-btn は hero-action-grid のアイコン版（-icon 付き）に統合済み

      $('detail-body').querySelectorAll('.btn-skill-up[data-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = Game.upgradeSkill(btn.dataset.gid, Number(btn.dataset.idx));
          if (r.success) { this.showDetail(gid); GachaTab.renderMaterials(); }
          else if (r.reason === 'no_materials') showToast('素材が不足しています！', 'warn');
        });
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ガチャタブ
  // ═══════════════════════════════════════════════════════════════════════════

  const GachaTab = {
    _equipFilter: 'all',
    _equipSort:   'rarity',

    update() {
      const pity = Game.getState().progress.gachaPity;
      const CEIL = 90;
      const pct  = Math.round(pity / CEIL * 100);
      // 天井ゲージ更新
      const cntEl = $('pity-count');
      if (cntEl) cntEl.textContent = `残り${CEIL - pity}回`;
      const drawnEl = $('pity-drawn');
      if (drawnEl) drawnEl.textContent = `${pity}回消化`;
      const barEl = $('pity-bar');
      if (barEl) {
        barEl.style.width = pct + '%';
        // 残り少なくなるほど赤みが増すグラデーション
        barEl.style.background = pct >= 80
          ? 'linear-gradient(90deg,#f59e0b,#ef4444)'
          : pct >= 50
            ? 'linear-gradient(90deg,var(--primary),#f59e0b)'
            : 'linear-gradient(90deg,var(--primary),#ec4899)';
      }
      this.renderShop();
      this.renderEquipInventory();
      this.renderMaterials();
      this.updateButtons();
      // フィルターボタンの状態を同期
      document.querySelectorAll('.equip-filter-btn').forEach(b =>
        b.classList.toggle('active', b.dataset.type === this._equipFilter));
      const sel = $('equip-sort-sel');
      if (sel) sel.value = this._equipSort;
    },

    updateButtons() {
      const cr = Game.getState().resources.crystals;
      const b1 = $('draw-1-btn');
      const b10 = $('draw-10-btn');
      if (b1)  b1.disabled  = cr < 30;
      if (b10) b10.disabled = cr < 280;
    },

    handleDraw(count) {
      const result = Game.draw(count);
      if (!result.success) {
        showToast(`💎 クリスタル不足！ 必要: ${result.needed}`, 'warn');
        return;
      }
      updateResourceBar();
      this.update();
      GeneralsTab.update();
      HomeTab.renderFormation();
      this.showGachaResult(result.results);
      if (result.newAchievements && result.newAchievements.length > 0) {
        setTimeout(() => handleNewAchievements(result.newAchievements), 800);
      }
    },

    showGachaResult(results) {
      const el = $('gacha-result-cards');
      el.innerHTML = '';
      const hasSSR = results.some(r => r.def.rarity === 'SSR');
      // SSR出現時は虹色バーストを overlay 内に1回だけ走らせる
      const overlay = document.getElementById('gacha-result');
      if (overlay) {
        overlay.classList.toggle('has-ssr', hasSSR);
        let burst = overlay.querySelector('.ssr-burst');
        if (hasSSR) {
          if (!burst) {
            burst = document.createElement('div');
            burst.className = 'ssr-burst';
            overlay.appendChild(burst);
          }
          burst.classList.remove('ssr-burst-play'); void burst.offsetWidth;
          burst.classList.add('ssr-burst-play');
        } else if (burst) {
          burst.remove();
        }
      }
      results.forEach(({ def, isNew }, i) => {
        const card = document.createElement('div');
        card.className = `gacha-card rarity-${def.rarity} card-reveal-hidden`;
        const subHtml = isNew
          ? '<span class="picon picon-star"></span> NEW！'
          : '<span class="picon picon-exp"></span> 欠片 +5';
        card.innerHTML = `
          ${makePortrait(def,'md')}
          <div class="gacha-card-name">${def.name}</div>
          <div class="gacha-card-sub">${subHtml}</div>`;
        el.appendChild(card);
        setTimeout(() => {
          card.classList.remove('card-reveal-hidden');
          if (def.rarity === 'SSR') card.classList.add('card-revealed');
        }, 60 + i * 110);
      });
      show('gacha-result');
    },

    renderMaterials() {
      const el = $('materials-list');
      if (!el) return;
      const mats    = Game.getState().inventory.materials;
      const recipes = Game.getSynthRecipes();
      const entries = Object.entries(mats).filter(([,v]) => v > 0);
      if (entries.length === 0) {
        el.innerHTML = '<p class="empty-msg">素材がありません。バトルで集めよう！</p>';
        return;
      }
      el.innerHTML = '';
      entries.forEach(([id, count]) => {
        const md = MATERIALS_DATA[id];
        if (!md) return;
        const recipe   = recipes.find(r => r.from === id);
        const canSynth = recipe && count >= recipe.cost;
        let synthBtn   = '';
        if (recipe) {
          const toLabel = recipe.to === '_crystals'
            ? `💎×${recipe.get}`
            : `${MATERIALS_DATA[recipe.to]?.emoji || '?'}×${recipe.get}`;
          synthBtn = `<button class="btn-synth" data-mat="${id}" ${canSynth ? '' : 'disabled'}>
            合成→${toLabel} <small>(×${recipe.cost})</small>
          </button>`;
        }
        const row = document.createElement('div');
        row.className = 'material-row';
        const iconHtml = uiIcon(`mat_${id}`, `<span class="mat-emoji">${md.emoji}</span>`, 'md');
        row.innerHTML = `
          <div class="material-chip-inner">
            ${iconHtml}
            <span class="mat-name">${md.name}</span>
            <span class="mat-count">×${count}</span>
          </div>
          ${synthBtn}`;
        el.appendChild(row);
      });

      el.querySelectorAll('.btn-synth[data-mat]').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = Game.synthesize(btn.dataset.mat);
          if (r.success) { updateResourceBar(); this.renderMaterials(); }
        });
      });
    },

    renderShop() {
      // リフレッシュボタンの状態更新
      const shopState = Game.getState().shop || {};
      const today     = new Date().toISOString().slice(0, 10);
      const isFreeAvail = !shopState.freeRefreshDate || shopState.freeRefreshDate !== today;
      const refreshBtn  = $('shop-refresh-btn');
      const refreshLabel= $('shop-refresh-label');
      if (refreshBtn && refreshLabel) {
        refreshLabel.textContent = isFreeAvail ? '無料更新' : '💎30更新';
        refreshBtn.title = isFreeAvail ? '1日1回無料でショップを更新できます' : '30💎でショップを更新します';
      }
      // スタミナポーション購入ボタン状態
      const st = Game.getStamina ? Game.getStamina() : { current: 0, max: 30 };
      const staminaFull = st.current >= st.max;
      const buyStBtn = $('buy-stamina-btn');
      if (buyStBtn) {
        buyStBtn.disabled = staminaFull || Game.getState().resources.coins < 1000;
        buyStBtn.title = staminaFull ? 'スタミナは満タンです' : 'スタミナを10回復します';
      }

      const el = $('shop-list');
      if (!el) return;
      const items  = Game.getShop();
      const coins  = Game.getState().resources.coins;
      el.innerHTML = '';
      items.forEach((item, idx) => {
        const ed  = item.def;
        if (!ed) return;
        const row = document.createElement('div');
        row.className = `shop-row rarity-${ed.rarity} ${item.sold ? 'shop-sold' : ''}`;
        const statsText = Object.entries(ed.stats)
          .map(([k, v]) => `${k.toUpperCase()}+${v}`).join(' ');
        const canBuy = !item.sold && coins >= item.price;
        const shopCatIcon = uiIcon(`equip_${ed.type}`, `<span class="equip-emoji">${ed.emoji}</span>`, 'md');
        row.innerHTML = `
          ${shopCatIcon}
          <div class="equip-info">
            <div class="equip-name">${ed.name} <span class="equip-rarity">${ed.rarity}</span></div>
            <div class="equip-stats">${statsText}</div>
          </div>
          <button class="btn-shop-buy" data-idx="${idx}" ${canBuy ? '' : 'disabled'}>
            ${item.sold ? '売切' : `${item.price.toLocaleString()}🪙`}
          </button>`;
        el.appendChild(row);
      });

      el.querySelectorAll('.btn-shop-buy[data-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = Game.buyShopItem(Number(btn.dataset.idx));
          if (r.success) { updateResourceBar(); this.renderShop(); this.renderEquipInventory(); }
          else if (r.reason === 'no_coins') showToast(`🪙 コイン不足！ 必要: ${r.needed?.toLocaleString()}`, 'warn');
        });
      });
    },

    renderEquipInventory() {
      const el = $('equip-inventory');
      if (!el) return;
      let equips = Game.getState().inventory.equipment;
      if (equips.length === 0) {
        el.innerHTML = '<p class="empty-msg">装備がありません。バトルで入手しよう！</p>';
        return;
      }

      // フィルター
      const filterType = this._equipFilter;
      if (filterType !== 'all') {
        equips = equips.filter(inst => {
          const ed = EQUIPMENT_DATA[inst.defId];
          return ed && ed.type === filterType;
        });
      }

      // ソート
      const rarityOrder = { LR: 0, MR: 1, UR: 2, SSR: 3, SR: 4, R: 5 };
      if (this._equipSort === 'rarity') {
        equips = equips.slice().sort((a, b) => {
          const ra = rarityOrder[EQUIPMENT_DATA[a.defId]?.rarity] ?? 9;
          const rb = rarityOrder[EQUIPMENT_DATA[b.defId]?.rarity] ?? 9;
          return ra - rb || b.enhanceLevel - a.enhanceLevel;
        });
      } else if (this._equipSort === 'enhance') {
        equips = equips.slice().sort((a, b) => b.enhanceLevel - a.enhanceLevel);
      }
      // 'new'はデフォルト順（追加順）

      if (equips.length === 0) {
        el.innerHTML = '<p class="empty-msg">この種類の装備はありません</p>';
        return;
      }

      el.innerHTML = '';
      equips.forEach(inst => {
        const ed = EQUIPMENT_DATA[inst.defId];
        if (!ed) return;
        const div = document.createElement('div');
        div.className = `equip-item rarity-${ed.rarity}`;
        div.dataset.enh = String(Math.min(10, inst.enhanceLevel));
        const bonus = 1 + inst.enhanceLevel * 0.1;
        const statsText = Object.entries(ed.stats)
          .map(([k,v]) => `${k.toUpperCase()}+${Math.floor(v * bonus)}`)
          .join(' / ');
        const enhCost = Game.getEnhanceCost(inst.instanceId);
        const coins   = Game.getState().resources.coins;
        const isEquipped = Object.values(Game.getState().generals).some(gs =>
          Object.values(gs.equips).includes(inst.instanceId)
        );
        const enhLabel = inst.enhanceLevel >= 10
          ? '<span class="enhance-max">MAX</span>'
          : `<button class="btn-enhance" data-iid="${inst.instanceId}" ${coins >= enhCost ? '' : 'disabled'}>
               <span class="picon picon-hammer"></span> 強化 <small>(${enhCost?.toLocaleString()}<span class="picon picon-coin"></span>)</small>
             </button>`;
        const sellBase = { R: 100, SR: 500, SSR: 2000 }[ed.rarity] || 100;
        const sellVal  = Math.floor(sellBase * (1 + inst.enhanceLevel * 0.5));
        const sellLabel = isEquipped
          ? '<span class="sell-equipped">装備中</span>'
          : `<button class="btn-sell" data-iid="${inst.instanceId}">売 ${sellVal.toLocaleString()}🪙</button>`;
        const equipCatIcon = uiIcon(`equip_${ed.type}`, `<span class="equip-emoji">${ed.emoji}</span>`, 'md');
        div.innerHTML = `
          ${equipCatIcon}
          <div class="equip-info">
            <div class="equip-name">
              ${ed.name}
              <span class="equip-rarity">${ed.rarity}</span>
              ${inst.enhanceLevel > 0 ? `<span class="enhance-badge">+${inst.enhanceLevel}</span>` : ''}
            </div>
            <div class="equip-stats">${statsText}</div>
          </div>
          <div class="equip-enhance-col">${enhLabel}</div>
          <div class="equip-sell-col">${sellLabel}</div>`;
        el.appendChild(div);
      });

      el.querySelectorAll('.btn-enhance[data-iid]').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = Game.enhanceEquip(btn.dataset.iid);
          if (r.success) { updateResourceBar(); HomeTab.renderDailyTasks(); this.renderEquipInventory(); }
          else if (r.reason === 'no_coins') showToast(`🪙 コイン不足！ 必要: ${r.needed?.toLocaleString()}`, 'warn');
        });
      });

      el.querySelectorAll('.btn-sell[data-iid]').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = Game.sellEquip(btn.dataset.iid);
          if (r.success) { updateResourceBar(); this.renderEquipInventory(); }
        });
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 装備ピッカー
  // ═══════════════════════════════════════════════════════════════════════════

  const EquipPicker = {
    _gid: null, _slot: null,

    open(gid, slot) {
      this._gid  = gid;
      this._slot = slot;
      const slotLabel = { weapon: '⚔️ 武器', armor: '🛡️ 防具', accessory: '💍 装飾' }[slot] || slot;
      $('equip-picker-title').textContent = `${slotLabel}を選ぶ`;
      this.render();
      show('equip-picker');
    },

    render() {
      const el = $('equip-picker-list');
      if (!el) return;
      const gs   = Game.getState().generals[this._gid];
      const equipped = gs?.equips[this._slot];
      const all  = Game.getState().inventory.equipment;
      // 対応タイプのみ
      const slotType = { weapon: 'weapon', armor: 'armor', accessory: 'accessory' }[this._slot];
      const items = all.filter(inst => {
        const ed = EQUIPMENT_DATA[inst.defId];
        return ed && ed.type === slotType;
      });

      el.innerHTML = '';

      // 「外す」行
      if (equipped) {
        const row = document.createElement('div');
        row.className = 'picker-row picker-unequip';
        row.innerHTML = `<span class="picker-emoji">✕</span><div class="picker-info"><div class="picker-name">外す</div></div>`;
        row.addEventListener('click', () => {
          Game.unequipItem(this._gid, this._slot);
          hide('equip-picker');
          GeneralsTab.showDetail(this._gid);
        });
        el.appendChild(row);
      }

      if (items.length === 0 && !equipped) {
        el.innerHTML += '<p class="empty-msg">この種類の装備がありません</p>';
        return;
      }

      items.forEach(inst => {
        const ed = EQUIPMENT_DATA[inst.defId];
        if (!ed) return;
        const isEquipped = inst.instanceId === equipped;
        const bonus = 1 + inst.enhanceLevel * 0.1;
        const statsText = Object.entries(ed.stats)
          .map(([k,v]) => `${k.toUpperCase()}+${Math.floor(v * bonus)}`).join(' ');
        const row = document.createElement('div');
        row.className = `picker-row rarity-${ed.rarity} ${isEquipped ? 'picker-active' : ''}`;
        const pickerCatIcon = uiIcon(`equip_${ed.type}`, `<span class="picker-emoji">${ed.emoji}</span>`, 'md');
        row.innerHTML = `
          ${pickerCatIcon}
          <div class="picker-info">
            <div class="picker-name">
              ${ed.name}
              ${inst.enhanceLevel > 0 ? `<span class="enhance-badge">+${inst.enhanceLevel}</span>` : ''}
              <span class="equip-rarity">${ed.rarity}</span>
            </div>
            <div class="equip-stats">${statsText}</div>
          </div>
          ${isEquipped ? '<span class="picker-check">✓</span>' : ''}`;
        row.addEventListener('click', () => {
          Game.equipItem(this._gid, this._slot, inst.instanceId);
          hide('equip-picker');
          GeneralsTab.showDetail(this._gid);
        });
        el.appendChild(row);
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 図鑑タブ
  // ═══════════════════════════════════════════════════════════════════════════

  const ZukanTab = {
    update() {
      this.renderGenerals();
      this.renderStages();
      this.renderEquips();
    },

    renderGenerals() {
      const el = $('zukan-generals');
      if (!el) return;
      const state = Game.getState();
      const allDefs = Object.values(Game.getAllGeneralDefs());
      const total = allDefs.length;
      const owned = Object.keys(state.generals).length;
      $('zukan-count') && ($('zukan-count').textContent = `(${owned}/${total})`);

      el.innerHTML = '';
      const order = { SSR: 0, SR: 1, R: 2 };
      const sorted = allDefs.slice().sort((a, b) => order[a.rarity] - order[b.rarity]);

      sorted.forEach(def => {
        const gid     = def.id;
        const isOwned = !!state.generals[gid];
        const gs      = state.generals[gid];
        const card    = document.createElement('div');
        card.className = `zukan-card rarity-${def.rarity} ${isOwned ? '' : 'zukan-unknown'}`;
        const starsHtml = isOwned && gs.stars > 1 ? `<div class="zukan-stars">${'⭐'.repeat(gs.stars)}</div>` : '';
        // 既存のキャラthumb画像を採用（owned=フルカラー / locked=シルエット化）
        const thumbWebp = `assets/characters/thumbs/${gid}.webp?v=${IMG_V}`;
        const lockClass = isOwned ? '' : 'zukan-locked-img';
        const lockOverlay = isOwned ? '' : '<div class="zukan-lock-overlay">？？？</div>';
        card.innerHTML = `
          <div class="zukan-portrait" style="background:${isOwned ? def.gradient : '#1a1a2e'}">
            <img class="zukan-thumb ${lockClass}" src="${thumbWebp}" alt="${isOwned ? def.name : 'locked'}"
                 onerror="this.outerHTML='<span style=&quot;font-size:26px;${isOwned ? '' : 'filter:grayscale(1) opacity(.3)'}&quot;>${def.emoji}</span>'"
                 loading="lazy" decoding="async">
            ${lockOverlay}
          </div>
          <div class="zukan-name">${isOwned ? def.name : '???'}</div>
          <span class="zukan-rarity badge-${def.rarity}">${def.rarity}</span>
          ${starsHtml}
          ${isOwned ? `<div class="zukan-lv">Lv.${gs.level}</div>` : ''}`;
        el.appendChild(card);
      });
    },

    renderStages() {
      const el = $('zukan-stages');
      if (!el) return;
      const cleared = Game.getState().progress.clearedStages;
      el.innerHTML = '';

      STAGES_DATA.forEach(chapter => {
        const total = chapter.stages.length;
        const done  = chapter.stages.filter(s => cleared.includes(s.id)).length;
        const pct   = Math.floor(done / total * 100);
        const div   = document.createElement('div');
        div.className = 'zukan-chapter';
        div.innerHTML = `
          <div class="zukan-chapter-header">
            <span class="zukan-ch-name">${chapter.name}</span>
            <span class="zukan-ch-count">${done}/${total}</span>
          </div>
          <div class="zukan-ch-bar-wrap">
            <div class="zukan-ch-bar" style="width:${pct}%"></div>
          </div>`;
        el.appendChild(div);
      });
    },

    renderEquips() {
      const el = $('zukan-equips');
      if (!el) return;
      const inventory = Game.getState().inventory.equipment;
      el.innerHTML = '';

      const order  = { SSR: 0, SR: 1, R: 2 };
      const sorted = Object.entries(EQUIPMENT_DATA).sort((a, b) =>
        order[a[1].rarity] - order[b[1].rarity]
      );

      sorted.forEach(([defId, ed]) => {
        const owned = inventory.some(i => i.defId === defId);
        const div   = document.createElement('div');
        div.className = `zukan-equip rarity-${ed.rarity} ${owned ? '' : 'zukan-unknown'}`;
        const statsText = Object.entries(ed.stats)
          .map(([k, v]) => `${k.toUpperCase()}+${v}`).join(' ');
        div.innerHTML = `
          <span class="equip-emoji" style="${owned ? '' : 'filter:grayscale(1) opacity(.3)'}">
            ${ed.emoji}
          </span>
          <div class="equip-info">
            <div class="equip-name">
              ${owned ? ed.name : '???'}
              <span class="equip-rarity">${ed.rarity}</span>
            </div>
            <div class="equip-stats">${owned ? statsText : '──'}</div>
          </div>`;
        el.appendChild(div);
      });
    }
  };

  // ─── イベントバインド ────────────────────────────────────────────────────

  function bindEvents() {
    // タブ
    document.querySelectorAll('.tab-btn').forEach(btn =>
      btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

    // プレイヤー名編集
    $('btn-edit-name')?.addEventListener('click', () => {
      const nameEl = $('player-name');
      if (!nameEl || nameEl.tagName === 'INPUT') return;  // 二重クリック防止
      const current = nameEl.textContent;
      const input = document.createElement('input');
      input.className = 'player-name-input';
      input.value     = current;
      input.maxLength = 12;
      nameEl.replaceWith(input);
      input.focus();
      input.select();
      let saved = false;
      const commit = () => {
        if (saved) return;
        saved = true;
        const newName = input.value.trim() || current;
        Game.setPlayerName(newName);
        const span = document.createElement('span');
        span.id = 'player-name';
        span.textContent = newName;
        input.replaceWith(span);
      };
      input.addEventListener('blur', commit, { once: true });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter')  { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { input.value = current; input.blur(); }
      });
    });

    // ─── 設定モーダル ───────────────────────────────────────────
    const SETTINGS_KEY = 'mg_settings_v1';
    const defaultSettings = { scanline: true, vsIntro: true, confetti: true, autofocusNext: true, autoReplay: false, reducedMotion: false };
    function loadSettings() {
      try { return { ...defaultSettings, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) }; }
      catch { return { ...defaultSettings }; }
    }
    function saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {} }
    // 自動連戦を停止（メモリ/localStorage/UI 全部同期）
    function stopAutoReplay(toastMsg, toastType = 'warn') {
      if (!window.__gameSettings) return;
      window.__gameSettings.autoReplay = false;
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(window.__gameSettings)); } catch {}
      const optBtn = document.getElementById('opt-auto-replay');
      if (optBtn) {
        optBtn.dataset.on = 'false';
        optBtn.textContent = 'OFF';
        optBtn.classList.remove('settings-toggle--on');
      }
      const badge = document.getElementById('auto-replay-badge');
      if (badge) badge.remove();
      if (toastMsg) showToast(toastMsg, toastType, 4000);
    }
    window.__stopAutoReplay = stopAutoReplay;

    // 自動連戦「停止」ボタン（リザルト内）
    document.getElementById('auto-replay-stop-btn')?.addEventListener('click', () => {
      stopAutoReplay('自動連戦を停止しました', 'info');
      const arBar = document.getElementById('auto-replay-bar');
      if (arBar) arBar.classList.add('hidden');
    });

    function applySettings(s) {
      document.body.classList.toggle('opt-no-scanline', !s.scanline);
      document.body.classList.toggle('opt-no-vs-intro', !s.vsIntro);
      document.body.classList.toggle('opt-no-confetti', !s.confetti);
      document.body.classList.toggle('opt-no-autofocus', !s.autofocusNext);
      document.body.classList.toggle('opt-auto-replay-on', !!s.autoReplay);
      document.body.classList.toggle('opt-reduced-motion', !!s.reducedMotion);
      // 自動連戦インジケータ
      let badge = document.getElementById('auto-replay-badge');
      if (s.autoReplay) {
        if (!badge) {
          badge = document.createElement('div');
          badge.id = 'auto-replay-badge';
          badge.innerHTML = '<span class="picon picon-play"></span> 自動連戦中';
          badge.title = 'クリックで停止';
          badge.addEventListener('click', () => {
            stopAutoReplay('自動連戦を停止しました', 'info');
          });
          document.body.appendChild(badge);
        }
      } else if (badge) {
        badge.remove();
      }
      window.__gameSettings = s;
    }
    const _settings = loadSettings();
    applySettings(_settings);
    function setupSettingsToggle(id, key) {
      const btn = $(id); if (!btn) return;
      const sync = () => { btn.dataset.on = String(_settings[key]); btn.textContent = _settings[key] ? 'ON' : 'OFF'; btn.classList.toggle('settings-toggle--on', _settings[key]); };
      sync();
      btn.addEventListener('click', () => { _settings[key] = !_settings[key]; saveSettings(_settings); applySettings(_settings); sync(); });
    }
    setupSettingsToggle('opt-scanline',       'scanline');
    setupSettingsToggle('opt-vs-intro',       'vsIntro');
    setupSettingsToggle('opt-confetti',       'confetti');
    setupSettingsToggle('opt-autofocus-next', 'autofocusNext');
    setupSettingsToggle('opt-auto-replay',    'autoReplay');
    // 自動連戦ON切替時にカウンターリセット
    $('opt-auto-replay')?.addEventListener('click', () => {
      if (AdventureTab) {
        AdventureTab._autoReplayCount = 0;
        AdventureTab._autoLossStreak = 0;
      }
    });
    setupSettingsToggle('opt-reduced-motion', 'reducedMotion');
    $('btn-settings')?.addEventListener('click', () => show('settings-modal'));
    $('settings-close')?.addEventListener('click', () => hide('settings-modal'));
    $('settings-modal')?.addEventListener('click', e => { if (e.target === $('settings-modal')) hide('settings-modal'); });

    // 放置報酬受取
    $('collect-btn')?.addEventListener('click', () => {
      Game.collectIdleReward();
      // ★ Fix: 受取直後に即クラウド同期（debounce 待ちにしない）
      // タブ閉じ・バックグラウンド移行で報酬が消えるバグを防ぐ
      Storage.flushSave(Game.getState());
      hide('idle-reward');
      updateResourceBar();
      HomeTab.update();
    });

    // バトル結果閉じる
    $('result-close')?.addEventListener('click', () => {
      hide('battle-result');
      // ログトグルをリセット
      const tog = $('result-log-toggle');
      if (tog) { tog.classList.add('hidden'); tog.classList.remove('open'); }
    });

    // 章タブ（data-chapter / data-boss / data-tower で判定）
    document.querySelectorAll('.chapter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.tower) {
          AdventureTab.isTowerTab = true;
          AdventureTab.isBossTab  = false;
          AdventureTab.renderTower();
        } else if (btn.dataset.boss) {
          AdventureTab.isBossTab  = true;
          AdventureTab.isTowerTab = false;
          AdventureTab.renderBossSection();
        } else {
          AdventureTab.isBossTab  = false;
          AdventureTab.isTowerTab = false;
          AdventureTab.currentChapter = parseInt(btn.dataset.chapter);
          AdventureTab.renderChapter();
        }
      });
    });

    // 副将詳細閉じる
    $('detail-close')?.addEventListener('click', () => hide('general-detail'));
    $('general-detail')?.addEventListener('click', e => {
      if (e.target === $('general-detail')) hide('general-detail');
    });

    // ホームに戻るボタン
    $('detail-back-home')?.addEventListener('click', () => {
      hide('general-detail');
      // 副将タブ → ホームタブへ切替
      document.querySelector('.tab-btn[data-tab="home"]')?.click();
    });

    // キャライラストのタップで全画面 lightbox 表示 (event delegation)
    // 旧 detail-portrait-wrap + 新 hero-zone の両方に対応
    document.body.addEventListener('click', e => {
      // ボタン・スロットのクリックは除外（バブリングを止めていない場合の保険）
      if (e.target.closest('.hero-slot, .hero-top-overlay, .hero-bottom-overlay')) return;
      const wrap = e.target.closest('.detail-portrait-wrap, .hero-zone');
      if (!wrap) return;
      const id = wrap.dataset.charId;
      const name = wrap.dataset.charName || '';
      if (!id) return;
      const lbImg = document.getElementById('char-lightbox-img');
      const lbName = document.getElementById('char-lightbox-name');
      if (!lbImg) return;
      // WebP（image_manager変換済み新画像）優先 → PNG（未変換キャラの旧アート）フォールバック
      // 注意: .webp = 変換アプリで生成した新しい写真, .png = 古い生成アート（逆にしてはいけない）
      lbImg.onerror = function() {
        if (!this.dataset.fb) {
          this.dataset.fb = '1';
          this.src = `assets/characters/${id}.png?v=${IMG_V}`;
        } else {
          this.alt = '(画像なし)';
        }
      };
      lbImg.dataset.fb = '';
      // hires (1024x1536) を最優先 → 失敗時は PNG にフォールバック
      lbImg.src = `assets/characters/hires/${id}.webp?v=${IMG_V}`;
      lbImg.alt = name;
      if (lbName) lbName.textContent = name;
      show('char-lightbox');
    });

    $('char-lightbox-close')?.addEventListener('click', () => hide('char-lightbox'));
    $('char-lightbox')?.addEventListener('click', e => {
      if (e.target === $('char-lightbox') || e.target.tagName === 'IMG') hide('char-lightbox');
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !$('char-lightbox').classList.contains('hidden')) {
        hide('char-lightbox');
      }
    });

    // ガチャ
    $('draw-1-btn')?.addEventListener('click',  () => GachaTab.handleDraw(1));
    $('draw-10-btn')?.addEventListener('click', () => GachaTab.handleDraw(10));
    $('gacha-result-close')?.addEventListener('click', () => hide('gacha-result'));

    // 装備ピッカー
    $('equip-picker-close')?.addEventListener('click', () => hide('equip-picker'));
    $('equip-picker')?.addEventListener('click', e => {
      if (e.target === $('equip-picker')) hide('equip-picker');
    });

    // BGM — 初回クリックで起動して 🔇 表示、以降はトグル
    $('btn-bgm')?.addEventListener('click', () => {
      const btn = $('btn-bgm');
      if (!BGM.isRunning()) {
        BGM.start();
        btn.textContent = '🔇';
        btn.classList.remove('muted');
      } else {
        const muted = BGM.toggle();
        btn.textContent = muted ? '🔊' : '🔇';
        btn.classList.toggle('muted', muted);
      }
    });

    // ─── クラウドセーブ ──────────────────────────────────────────────────────
    $('btn-cloud-settings')?.addEventListener('click', () => CloudModal.open());
    $('cloud-close-btn')?.addEventListener('click',   () => hide('cloud-modal'));
    $('cloud-modal')?.addEventListener('click', e => {
      if (e.target === $('cloud-modal')) hide('cloud-modal');
    });
    $('cs-autostart-btn')?.addEventListener('click',      () => CloudModal.autoStart());
    $('firebase-config-apply')?.addEventListener('click', () => CloudModal.applyFirebaseConfig());
    $('cloud-save-btn')?.addEventListener('click',        () => CloudModal.saveGasConfig());
    $('cs-restore-btn')?.addEventListener('click',        () => CloudModal.restoreFromCode());
    $('cloud-pull-btn')?.addEventListener('click',        () => CloudModal.pullCurrent());
    $('cs-advanced-toggle')?.addEventListener('click', () => {
      $('cs-advanced-form')?.classList.toggle('hidden');
    });
    $('cs-restore-toggle')?.addEventListener('click', () => {
      $('cs-restore-form')?.classList.toggle('hidden');
    });
    $('cs-copy-code')?.addEventListener('click', () => {
      // 表示は20文字に切り捨てているが、コピーは完全なIDを使う（CODEX指摘修正）
      const fullId = Storage.getConfig().playerId ||
                     (typeof FirebaseAuth !== 'undefined' && FirebaseAuth.getUID?.()) || '';
      const code = fullId || $('cs-player-code')?.textContent;
      if (code && code !== '----' && code !== '---') {
        navigator.clipboard?.writeText(code).catch(() => {});
        CloudModal.setStatus('コードをコピーしました ✓', 'ok');
      }
    });

    // クラウドセーブバナー
    $('cloud-banner-setup')?.addEventListener('click', () => CloudModal.open());
    $('cloud-banner-dismiss')?.addEventListener('click', () => {
      $('cloud-save-banner')?.classList.add('hidden');
      sessionStorage.setItem('cloud_banner_dismissed', '1');
    });

    // 副将フィルターバー
    $('generals-search')?.addEventListener('input', e => {
      GeneralsTab._nameFilter = e.target.value;
      GeneralsTab.renderGrid();
    });
    document.querySelectorAll('.rarity-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        GeneralsTab._rarityFilter = btn.dataset.rarity;
        document.querySelectorAll('.rarity-filter-btn').forEach(b =>
          b.classList.toggle('active', b === btn));
        GeneralsTab.renderGrid();
      });
    });

    // 副将ソートセレクト
    $('generals-sort')?.addEventListener('change', e => {
      GeneralsTab._sortMode = e.target.value;
      GeneralsTab.renderGrid();
    });

    // 一括覚醒ボタン
    $('bulk-awaken-btn')?.addEventListener('click', () => {
      const { count, results } = Game.bulkAwaken();
      if (count === 0) {
        showToast('覚醒できるキャラがいません（欠片不足または全員★6）', 'warn');
        return;
      }
      const lines = results.map(r => `${r.name} ★${r.oldStars}→★${r.newStars}`).join('、');
      showToast(`✨ ${count}体を覚醒！ ${lines}`, 'success');
      GeneralsTab.renderGrid();
    });

    // 装備フィルターバー
    document.querySelectorAll('.equip-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        GachaTab._equipFilter = btn.dataset.type;
        document.querySelectorAll('.equip-filter-btn').forEach(b =>
          b.classList.toggle('active', b === btn));
        GachaTab.renderEquipInventory();
      });
    });
    $('equip-sort-sel')?.addEventListener('change', e => {
      GachaTab._equipSort = e.target.value;
      GachaTab.renderEquipInventory();
    });

    // ショップリフレッシュ
    $('shop-refresh-btn')?.addEventListener('click', () => {
      const r = Game.refreshShop();
      if (r.success) {
        updateResourceBar();
        GachaTab.renderShop();
        showToast(r.free ? '🔄 ショップを更新しました（無料）' : `🔄 ショップを更新しました（💎${r.cost}消費）`, 'success');
      } else if (r.reason === 'no_crystals') {
        showToast(`💎 クリスタル不足！ 必要: ${r.needed}`, 'warn');
      }
    });

    // スタミナポーション購入
    $('buy-stamina-btn')?.addEventListener('click', () => {
      const r = Game.buyStaminaPotion();
      if (r.success) {
        updateResourceBar();
        GachaTab.renderShop();
        showToast(`⚡ スタミナ+${r.recovered}！`, 'success');
      } else if (r.reason === 'no_coins') {
        showToast(`🪙 コイン不足！ 必要: 1,000`, 'warn');
      } else if (r.reason === 'stamina_full') {
        showToast('⚡ スタミナはすでに満タンです', 'info');
      }
    });

  }

  // ─── ローディング ────────────────────────────────────────────────────────

  function runLoadingAnimation(cb) {
    const bar = $('loading-bar');
    if (!bar) { setTimeout(cb, 800); return; }
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 22 + 8;
      if (p >= 100) {
        p = 100; bar.style.width = '100%';
        clearInterval(iv); setTimeout(cb, 350);
      } else {
        bar.style.width = `${p}%`;
      }
    }, 110);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // クラウドセーブモーダル（シンプル版）
  // ═══════════════════════════════════════════════════════════════════════════

  const CloudModal = {

    open() {
      if ($('cloud-status')) { $('cloud-status').textContent = ''; $('cloud-status').className = 'cloud-status'; }
      const connected = Storage.isConfigured();
      $('cs-setup')?.classList.toggle('hidden', connected);
      $('cs-connected')?.classList.toggle('hidden', !connected);

      if (connected) {
        // 接続済み → 引き継ぎコード表示
        const playerId = Storage.getConfig().playerId ||
                         (typeof FirebaseAuth !== 'undefined' && FirebaseAuth.getUID?.()) || '---';
        const codeEl = $('cs-player-code');
        if (codeEl) codeEl.textContent = playerId.slice(0, 20);
        // GAS設定の既存値を反映
        $('cloud-endpoint') && ($('cloud-endpoint').value = Storage.getConfig().endpoint || '');
        $('cloud-playerid') && ($('cloud-playerid').value = Storage.getConfig().playerId || '');
      }
      show('cloud-modal');
    },

    // ワンタップ自動セットアップ（GASデフォルトエンドポイント + UUID）
    async autoStart() {
      this.setStatus('🔄 接続中…', 'info');
      const $btn = $('cs-autostart-btn');
      if ($btn) { $btn.disabled = true; $btn.textContent = '接続中…'; }

      try {
        // UUID形式の引き継ぎコードを生成
        let playerId = Storage.getConfig().playerId;
        if (!playerId) {
          playerId = _genUUID();
          Storage.setConfig(null, playerId, 'gas');
        }

        // 疎通テスト
        const endpoint = Storage.getConfig().endpoint;
        const ok = await Storage.ping(endpoint, 'gas');
        if (!ok) throw new Error('サーバーに接続できませんでした');

        // 即セーブ（flushSaveでdebounceをキャンセルして即クラウド同期）
        Storage.flushSave(Game.getState());

        $('btn-cloud-settings')?.classList.add('connected');
        this.setStatus('✅ 自動セーブを有効にしました！', 'ok');
        // パネル切替
        $('cs-setup')?.classList.add('hidden');
        $('cs-connected')?.classList.remove('hidden');
        const codeEl = $('cs-player-code');
        if (codeEl) codeEl.textContent = playerId.slice(0, 20);
      } catch(e) {
        this.setStatus(`接続失敗: ${e.message}`, 'err');
        if ($btn) { $btn.disabled = false; $btn.textContent = '✨ ワンタップで自動セーブを始める'; }
      }
    },

    // 上級者向け Firebase 設定
    async applyFirebaseConfig() {
      const jsonStr = $('firebase-config-json')?.value.trim();
      if (!jsonStr) { this.setStatus('設定コードを入力してください', 'err'); return; }
      let cfg;
      try { cfg = JSON.parse(jsonStr.replace(/^const\s+\w+\s*=\s*/, '').replace(/;$/, '')); }
      catch(_) { this.setStatus('JSONの形式が正しくありません', 'err'); return; }
      if (!cfg.apiKey || !cfg.databaseURL) {
        this.setStatus('apiKey と databaseURL が必要です', 'err'); return;
      }
      this.setStatus('🔌 Firebase に接続中…', 'info');
      try {
        FirebaseAuth.saveConfig(cfg);
        const ok = await FirebaseAuth.init(cfg);
        if (!ok) { this.setStatus('Firebase の初期化に失敗しました', 'err'); return; }
        await FirebaseAuth.signInAnonymously();
        Storage.setConfig(null, FirebaseAuth.getUID(), 'firebase');
        this.setStatus('✓ Firebase 接続成功！自動保存されます', 'ok');
        setTimeout(() => Storage.save(Game.getState()), 500);
        $('btn-cloud-settings')?.classList.add('connected');
        $('cs-setup')?.classList.add('hidden');
        $('cs-connected')?.classList.remove('hidden');
        const codeEl = $('cs-player-code');
        if (codeEl) codeEl.textContent = (FirebaseAuth.getUID() || '').slice(0,20);
      } catch(e) { this.setStatus(`エラー: ${e.message}`, 'err'); }
    },

    // GAS手動設定
    saveGasConfig() {
      const endpoint = $('cloud-endpoint')?.value.trim();
      const playerId = $('cloud-playerid')?.value.trim();
      if (!endpoint || !playerId) { this.setStatus('URLとIDを入力してください', 'err'); return; }
      Storage.setConfig(endpoint, playerId, 'gas');
      $('btn-cloud-settings')?.classList.add('connected');
      this.setStatus('✓ GAS設定を保存しました', 'ok');
      Storage.save(Game.getState());
    },

    // 現在の設定からクラウドを読み込む（コード入力不要）
    async pullCurrent() {
      const cfg = Storage.getConfig();
      if (!cfg.playerId) {
        this.setStatus('プレイヤーIDが設定されていません', 'err');
        return;
      }
      this.setStatus('☁️ 読み込み中…', 'info');
      try {
        const data = await Storage.pullFromCloud();
        if (data) {
          Game.init(data);
          updateResourceBar();
          HomeTab.update();
          hide('cloud-modal');
          switchTab('home');
          showToast('☁️ クラウドから読み込みました', 'success');
        } else {
          this.setStatus('データが見つかりません。クラウドにまだ保存されていない可能性があります。', 'err');
        }
      } catch(e) {
        this.setStatus('読み込みエラー: ' + e.message, 'err');
      }
    },

    // 別端末から引き継ぎ
    async restoreFromCode() {
      const code = $('cs-restore-input')?.value.trim();
      if (!code) { this.setStatus('引き継ぎコードを入力してください', 'err'); return; }
      this.setStatus('📥 読み込み中…', 'info');

      // ★ Fix: setConfig は成功後にだけ実行（失敗時に playerId を上書きしない）
      // 1. 旧設定を退避
      const prevConfig = Storage.getConfig();
      // 2. 一時的に新IDをセットしてクラウド読込を試みる
      const existingType = prevConfig.type || 'gas';
      Storage.setConfig(null, code, existingType);
      const data = await Storage.pullFromCloud();
      if (data) {
        // 3. 成功 → 新IDを正式採用してゲームに反映
        Game.init(data);
        updateResourceBar();
        HomeTab.update();
        hide('cloud-modal');
        this.setStatus('✅ データを読み込みました！', 'ok');
        switchTab('home');
      } else {
        // 4. 失敗 → 旧設定を復元（元のplayerIdを失わない）
        Storage.setConfig(prevConfig.endpoint, prevConfig.playerId, prevConfig.type);
        this.setStatus('コードが見つかりませんでした。確認してください。', 'err');
      }
    },

    setStatus(msg, type = '') {
      const el = $('cloud-status');
      if (!el) return;
      el.textContent = msg;
      el.className = `cloud-status ${type}`;
    }
  };

  // UUID生成ユーティリティ
  function _genUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // ─── クラウド同期ステータスインジケーター ─────────────────────────────────

  function initSyncIndicator() {
    const btn = $('btn-cloud-settings');
    if (!btn) return;

    // ステータスドットを挿入
    const dot = document.createElement('span');
    dot.id = 'cloud-sync-dot';
    dot.className = 'cloud-sync-dot';
    btn.appendChild(dot);

    Storage.onSyncStatusChange(status => {
      dot.className = `cloud-sync-dot dot-${status}`;
      switch (status) {
        case 'syncing': dot.title = '同期中…'; break;
        case 'ok':      dot.title = '同期完了 ✓'; break;
        case 'retry':   dot.title = 'リトライ中…'; break;
        case 'error':   dot.title = '同期失敗 ⚠'; break;
        default:        dot.title = ''; break;
      }
    });
  }

  // ─── スワイプタブ切替 ─────────────────────────────────────────────────────

  function setupSwipeTabs() {
    const content = document.querySelector('.tab-content');
    if (!content || !('ontouchstart' in window)) return;

    const TABS = ['home', 'adventure', 'generals', 'gacha', 'zukan'];
    let startX = 0, startY = 0;

    // ヒント表示用（1回だけ）
    let hintShown = false;
    function showSwipeHint(label) {
      if (hintShown) return;
      hintShown = true;
      let hint = document.getElementById('swipe-hint');
      if (!hint) {
        hint = document.createElement('div');
        hint.id = 'swipe-hint';
        hint.className = 'swipe-hint';
        document.body.appendChild(hint);
      }
      hint.textContent = label;
      hint.classList.add('show');
      setTimeout(() => hint.classList.remove('show'), 900);
    }

    content.addEventListener('touchstart', e => {
      startX = e.changedTouches[0].clientX;
      startY = e.changedTouches[0].clientY;
    }, { passive: true });

    content.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      // 縦スクロールが横より大きければ無視
      if (Math.abs(dy) > Math.abs(dx) * 0.8) return;
      if (Math.abs(dx) < 55) return;

      const curBtn = document.querySelector('.tab-btn.active');
      const curTab = curBtn?.dataset.tab;
      const idx    = TABS.indexOf(curTab);
      if (dx < 0 && idx < TABS.length - 1) {
        switchTab(TABS[idx + 1]);
        showSwipeHint('→ ' + TABS[idx + 1]);
      } else if (dx > 0 && idx > 0) {
        switchTab(TABS[idx - 1]);
        showSwipeHint('← ' + TABS[idx - 1]);
      }
    }, { passive: true });
  }

  // ─── 自動保存設定 ────────────────────────────────────────────────────────

  function setupAutoSave() {
    // 30秒ごとに定期保存
    setInterval(() => {
      if (Game.getState()) Game.save();
    }, 30000);

    // タブが隠れた / フォーカス外れたら即保存
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && Game.getState()) {
        Game.save();
      }
    });

    // ページを閉じる直前に同期保存
    window.addEventListener('beforeunload', () => {
      if (Game.getState()) {
        // ローカル保存のみ（クラウドは非同期なので間に合わない可能性あり）
        const state = Game.getState();
        try { localStorage.setItem('magic_garden_v2', JSON.stringify(state)); } catch(_) {}
      }
    });

    // スマホでのバックグラウンド移行（pagehide）- debounceをバイパスして即クラウド同期
    window.addEventListener('pagehide', () => {
      if (Game.getState()) Storage.flushSave(Game.getState());
    });
  }

  // ─── 起動 ────────────────────────────────────────────────────────────────

  function start() {
    const idleEarned = Game.init(Storage.load());

    // 日課リセット通知（今日初回起動のみ）
    (() => {
      const today = new Date().toISOString().slice(0, 10);
      if (sessionStorage.getItem('daily_notified') !== today) {
        sessionStorage.setItem('daily_notified', today);
        _sendLineNotify('daily_reset'); // LINE未設定なら内部でスキップ
      }
    })();

    bindEvents();

    runLoadingAnimation(() => {
      $('screen-loading')?.classList.remove('active');
      $('screen-game')?.classList.add('active');

      updateResourceBar();
      updatePlayerName();
      HomeTab.update();

      if (Storage.isConfigured()) {
        $('btn-cloud-settings')?.classList.add('connected');
      }

      BGM.init();  // 最初のクリックで自動起動

      // 同期インジケーター & 自動保存 & スワイプタブ
      initSyncIndicator();
      setupAutoSave();
      setupSwipeTabs();

      // Firebase Auto-Init（設定済みの場合）
      FirebaseAuth.autoInit().then(ok => {
        if (ok) {
          // 匿名サインインされていなければ自動サインイン
          FirebaseAuth.onAuthChange(async user => {
            if (ok && !user) {
              try { await FirebaseAuth.signInAnonymously(); } catch(_) {}
            }
            // Auth状態変化 → sync indicator 更新
            if (user) $('btn-cloud-settings')?.classList.add('connected');
          });
        }
      });

      if (idleEarned > 0) {
        $('idle-reward-text').textContent = `🪙 ${idleEarned.toLocaleString()} コインを集めておいたよ！`;
        show('idle-reward');
      }
    });
  }

  return { start };
})();

document.addEventListener('DOMContentLoaded', UI.start);


