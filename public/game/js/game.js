/**
 * game.js — ゲーム状態管理モジュール
 *
 * UIに依存しない純粋なゲームロジック。
 * 依存: generals_data.js / stages_data.js / battle_engine.js / storage.js / idle.js
 */
const Game = (() => {

  // ─── デフォルト状態 ─────────────────────────────────────────────────────

  const DEFAULT_STATE = {
    version: '0.3.0',
    player: {
      name: 'まほうつかい',
      firstPlayDate: null,
      totalSaves: 0
    },
    resources: {
      coins: 500,
      crystals: 100,
      stamina: 30,
      staminaAt: null,
      lastIdleTime: null
    },
    generals: {
      seraphina: _newGeneral('seraphina'),
      flame:     _newGeneral('flame'),
      arca:      _newGeneral('arca')
    },
    formation: ['seraphina', 'flame', 'arca'],
    inventory: {
      equipment: [],   // [{ instanceId, defId, enhanceLevel }]
      materials: {}    // materialId -> count
    },
    progress: {
      clearedStages: [],
      battleCount: 0,
      totalWins: 0,
      totalDraws: 0,
      gachaPity: 0,
      winStreak: 0,    // 現在の連勝数
      maxWinStreak: 0, // 最大連勝記録
      achievements: [] // 解放済みアチーブメントID配列
    },
    daily: {
      date: null,
      login: false,
      battles: 0,
      collected: false,
      drew: false,
      bossAttempts: 0,
      bossWins: 0,
      enhanced: false,
      claimed: {}
    },
    shop: { items: [], refreshedAt: null },
    weekly: {
      date:     null,   // 'YYYY-WW' 形式（年+週番号）
      battles:  0,
      draws:    0,
      enhanced: 0,
      bossWins: 0,
      dailyCompleted: 0,
      claimed:  {}
    }
  };

  function _newGeneral(id) {
    return { id, level: 1, exp: 0, stars: 1, shards: 0,
             equips: { weapon: null, armor: null, accessory: null },
             skillLevels: {} };
  }

  let state = null;

  // ─── 計算ヘルパー ────────────────────────────────────────────────────────

  function expToNext(level)    { return level * 100; }
  function levelUpCost(level)  { return level * 50; }

  function calcCharStats(gs, def) {
    const lv = gs.level;
    const stats = {
      hp:  Math.floor(def.baseStats.hp  + def.statGrowth.hp  * (lv - 1)),
      atk: Math.floor(def.baseStats.atk + def.statGrowth.atk * (lv - 1)),
      def: Math.floor(def.baseStats.def + def.statGrowth.def * (lv - 1)),
      spd: Math.floor(def.baseStats.spd + def.statGrowth.spd * (lv - 1))
    };
    // 装備ボーナス
    Object.values(gs.equips).forEach(instanceId => {
      if (!instanceId) return;
      const inst = state.inventory.equipment.find(e => e.instanceId === instanceId);
      if (!inst) return;
      const ed = EQUIPMENT_DATA[inst.defId];
      if (!ed) return;
      const bonus = 1 + inst.enhanceLevel * 0.1;
      Object.entries(ed.stats).forEach(([k, v]) => {
        if (stats[k] !== undefined) stats[k] += Math.floor(v * bonus);
      });
    });
    // 覚醒ボーナス（星1以上で+12%/星ごと）
    const stars = gs.stars || 1;
    if (stars > 1) {
      const starMult = 1 + (stars - 1) * 0.12;
      stats.hp  = Math.floor(stats.hp  * starMult);
      stats.atk = Math.floor(stats.atk * starMult);
      stats.def = Math.floor(stats.def * starMult);
      stats.spd = Math.floor(stats.spd * starMult);
    }
    return stats;
  }

  function getIdleRate() {
    return state.formation
      .filter(id => id && state.generals[id])
      .reduce((r, id) => r + state.generals[id].level * 1.5, 0);
  }

  function calcTeamPower() {
    return state.formation
      .filter(id => id && state.generals[id])
      .reduce((total, id) => {
        const s = calcCharStats(state.generals[id], GENERALS_DATA[id]);
        return total + s.hp * 0.1 + s.atk * 2 + s.def * 1.5 + s.spd;
      }, 0);
  }

  function _isStageAccessible(stageId) {
    const all = getAllStageIds();
    const idx = all.indexOf(stageId);
    if (idx < 0) return false;
    if (idx === 0) return true;
    return state.progress.clearedStages.includes(all[idx - 1])
        || state.progress.clearedStages.includes(stageId);
  }

  const BREAK_LIMIT_SHARD_COST = 100;
  const BREAK_LIMIT_MAX        = 3;   // 最大3回 = Lv.160まで

  function _maxLevel(gs) { return 100 + (gs.breakCount || 0) * 20; }

  function _applyExp(generalId, amount) {
    const gs = state.generals[generalId];
    if (!gs) return;
    const maxLv = _maxLevel(gs);
    if (gs.level >= maxLv) { gs.exp = 0; return; }
    gs.exp += amount;
    while (gs.level < maxLv && gs.exp >= expToNext(gs.level)) {
      gs.exp -= expToNext(gs.level);
      gs.level++;
    }
    if (gs.level >= maxLv) gs.exp = 0;
  }

  function getBreakLimitInfo(generalId) {
    const gs = state.generals[generalId];
    if (!gs) return null;
    const bc = gs.breakCount || 0;
    return {
      breakCount: bc,
      maxLevel:   _maxLevel(gs),
      canBreak:   bc < BREAK_LIMIT_MAX && (gs.shards || 0) >= BREAK_LIMIT_SHARD_COST,
      isMaxBreak: bc >= BREAK_LIMIT_MAX,
      shards:     gs.shards || 0,
      cost:       BREAK_LIMIT_SHARD_COST
    };
  }

  function breakLimit(generalId) {
    const gs = state.generals[generalId];
    if (!gs) return { success: false, reason: 'not_found' };
    const bc = gs.breakCount || 0;
    if (bc >= BREAK_LIMIT_MAX) return { success: false, reason: 'max_break' };
    if ((gs.shards || 0) < BREAK_LIMIT_SHARD_COST)
      return { success: false, reason: 'no_shards', needed: BREAK_LIMIT_SHARD_COST, have: gs.shards || 0 };
    gs.shards      -= BREAK_LIMIT_SHARD_COST;
    gs.breakCount   = bc + 1;
    return { success: true, newMaxLevel: _maxLevel(gs), breakCount: gs.breakCount };
  }

  // ─── スタミナ ────────────────────────────────────────────────────────────

  const STAMINA_MAX    = 30;
  const STAMINA_REGEN  = 5; // 分

  function _calcStamina() {
    const base = state.resources.stamina ?? STAMINA_MAX;
    if (base >= STAMINA_MAX) return STAMINA_MAX;
    const at = state.resources.staminaAt;
    if (!at) return STAMINA_MAX;
    const elapsedMin = (Date.now() - new Date(at).getTime()) / 60000;
    return Math.min(STAMINA_MAX, Math.floor(base + elapsedMin / STAMINA_REGEN));
  }

  function getStamina() {
    const current = _calcStamina();
    let nextRegenMin = 0;
    let nextRegenSec = 0;
    let secsToFull   = 0;
    if (current < STAMINA_MAX) {
      const at = state.resources.staminaAt || new Date().toISOString();
      const elapsedMs  = Date.now() - new Date(at).getTime();
      const regenMs    = STAMINA_REGEN * 60 * 1000;
      const done       = Math.floor(elapsedMs / regenMs);
      const nextMs     = (done + 1) * regenMs - elapsedMs;
      nextRegenSec = Math.max(1, Math.ceil(nextMs / 1000));
      nextRegenMin = Math.ceil(nextRegenSec / 60);
      secsToFull   = nextRegenSec + (STAMINA_MAX - current - 1) * STAMINA_REGEN * 60;
    }
    return { current, max: STAMINA_MAX, nextRegenMin, nextRegenSec, secsToFull };
  }

  function consumeStamina(amount) {
    const current = _calcStamina();
    if (current < amount) return false;
    state.resources.stamina  = current - amount;
    state.resources.staminaAt = new Date().toISOString();
    return true;
  }

  // ─── 日課管理 ────────────────────────────────────────────────────────────

  function _todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  function checkAndResetDaily() {
    const today = _todayStr();
    if (state.daily.date === today) return;
    // 日が変わった → リセット
    state.daily = {
      date: today, login: false, battles: 0, collected: false, drew: false,
      bossAttempts: 0, bossWins: 0, enhanced: false, claimed: {}
    };
    // ログインボーナス自動付与
    if (!state.daily.login) {
      state.resources.coins += 100;
      state.daily.login = true;
    }
  }

  // ─── 週番号ヘルパー ──────────────────────────────────────────────────────
  function _weekStr() {
    const d = new Date();
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2,'0')}`;
  }

  function checkAndResetWeekly() {
    if (!state.weekly) {
      state.weekly = JSON.parse(JSON.stringify(DEFAULT_STATE.weekly));
    }
    const thisWeek = _weekStr();
    if (state.weekly.date === thisWeek) return;
    // 週が変わった → リセット
    state.weekly = {
      date: thisWeek, battles: 0, draws: 0, enhanced: 0,
      bossWins: 0, dailyCompleted: 0, claimed: {}
    };
  }

  const WEEKLY_DEFS = [
    { id: 'w_battle',   label: 'バトル 20回',           icon: '⚔️', target: 20, reward: { crystals: 100 }, done: s => s.battles  >= 20, prog: s => Math.min(s.battles,  20) },
    { id: 'w_draw',     label: 'ガチャを10回引く',       icon: '🎲', target: 10, reward: { crystals:  50 }, done: s => s.draws    >= 10, prog: s => Math.min(s.draws,    10) },
    { id: 'w_enhance',  label: '装備を10回強化',         icon: '🔨', target: 10, reward: { coins:   5000 }, done: s => s.enhanced >= 10, prog: s => Math.min(s.enhanced, 10) },
    { id: 'w_boss',     label: 'ボスに5回勝利',          icon: '👹', target:  5, reward: { coins:   3000 }, done: s => s.bossWins >= 5,  prog: s => Math.min(s.bossWins,  5) },
    { id: 'w_daily',    label: '日課を5日分完了',        icon: '📋', target:  5, reward: { crystals:  30 }, done: s => s.dailyCompleted >= 5, prog: s => Math.min(s.dailyCompleted, 5) },
  ];

  function getWeeklyTasks() {
    if (!state.weekly) checkAndResetWeekly();
    const w = state.weekly;
    return WEEKLY_DEFS.map(d => {
      const isDone    = d.done(w);
      const isClaimed = !!(w.claimed[d.id]);
      const progress  = d.prog(w);
      return { ...d, isDone, isClaimed, progress };
    });
  }

  function claimWeeklyTask(taskId) {
    if (!state.weekly) checkAndResetWeekly();
    const task = WEEKLY_DEFS.find(d => d.id === taskId);
    if (!task) return { success: false, reason: 'not_found' };
    if (!task.done(state.weekly)) return { success: false, reason: 'not_done' };
    if (state.weekly.claimed[taskId]) return { success: false, reason: 'already_claimed' };
    state.weekly.claimed[taskId] = true;
    if (task.reward.coins)    state.resources.coins    += task.reward.coins;
    if (task.reward.crystals) state.resources.crystals += task.reward.crystals;
    save();
    return { success: true, reward: task.reward };
  }

  const DAILY_DEFS = [
    { id: 'login',    label: 'ログインボーナス',       icon: '🌅', target: 1, reward: { coins: 100 },    done: s => s.login },
    { id: 'battle',   label: 'バトル 3回',              icon: '⚔️', target: 3, reward: { coins: 200 },    done: s => s.battles >= 3 },
    { id: 'collected',label: '放置報酬を受け取る',     icon: '🌸', target: 1, reward: { coins: 100 },    done: s => s.collected },
    { id: 'drew',     label: '副将を召喚する',          icon: '🎲', target: 1, reward: { crystals: 20 }, done: s => s.drew },
    { id: 'boss',     label: '日課ボスに挑む',          icon: '👹', target: 1, reward: { crystals: 30 }, done: s => (s.bossWins || 0) >= 1 },
    { id: 'enhanced', label: '装備を強化する',          icon: '🔨', target: 1, reward: { coins: 300 },   done: s => s.enhanced }
  ];

  function getDailyTasks() {
    const claimed = state.daily.claimed || {};
    return DAILY_DEFS.map(d => {
      const isDone    = d.done(state.daily);
      const isClaimed = d.id === 'login' ? true : !!(claimed[d.id]);
      let progress = isDone ? d.target : 0;
      if (d.id === 'battle') progress = Math.min(state.daily.battles, 3);
      if (d.id === 'boss')   progress = Math.min(state.daily.bossWins || 0, 1);
      return { ...d, isDone, isClaimed, progress };
    });
  }

  function claimDailyTask(taskId) {
    if (!state.daily.claimed) state.daily.claimed = {};
    const task = DAILY_DEFS.find(d => d.id === taskId);
    if (!task) return { success: false, reason: 'not_found' };
    if (!task.done(state.daily)) return { success: false, reason: 'not_done' };
    if (state.daily.claimed[taskId]) return { success: false, reason: 'already_claimed' };
    state.daily.claimed[taskId] = true;
    if (task.reward.coins)    state.resources.coins    += task.reward.coins;
    if (task.reward.crystals) state.resources.crystals += task.reward.crystals;

    // 全日課クリア判定 → 週課カウンタ更新
    const allDone = DAILY_DEFS.every(d => d.done(state.daily) || !!(state.daily.claimed[d.id]));
    if (allDone && state.weekly) {
      state.weekly.dailyCompleted = (state.weekly.dailyCompleted || 0) + 1;
    }
    return { success: true, reward: task.reward };
  }

  // ─── 公開メソッド ────────────────────────────────────────────────────────

  function init(savedState) {
    state = savedState
      ? savedState
      : JSON.parse(JSON.stringify(DEFAULT_STATE));

    if (!state.player.firstPlayDate) {
      state.player.firstPlayDate = new Date().toISOString();
    }
    if (!state.resources.lastIdleTime) {
      state.resources.lastIdleTime = new Date().toISOString();
    }
    // 空のフォーメーションスロットを null で埋める
    while (state.formation.length < 3) state.formation.push(null);

    checkAndResetDaily();
    checkAndResetWeekly();

    return Idle.calculate(state.resources.lastIdleTime, getIdleRate());
  }

  function calculateIdleReward() {
    return Idle.calculate(state.resources.lastIdleTime, getIdleRate());
  }

  function collectIdleReward() {
    const earned = calculateIdleReward();
    state.resources.coins += earned;
    state.resources.lastIdleTime = new Date().toISOString();
    state.daily.collected = true;
    return earned;
  }

  // ─── バトル ──────────────────────────────────────────────────────────────

  function battle(stageId) {
    const stage = findStageDef(stageId);
    if (!stage) return { success: false, reason: 'stage_not_found' };
    if (!_isStageAccessible(stageId)) return { success: false, reason: 'stage_locked' };
    if (!consumeStamina(1)) return { success: false, reason: 'no_stamina' };

    const teamIds = state.formation.filter(id => id && state.generals[id]);
    if (teamIds.length === 0) return { success: false, reason: 'no_team' };

    // ファイター構築（チーム）
    const TYPE_CRIT = { assassin: 0.18, attacker: 0.12, mage: 0.10, tank: 0.04, healer: 0.05, support: 0.06, speedster: 0.15 };
    const RARITY_CRIT = { LR: 0.14, MR: 0.10, UR: 0.07, SSR: 0.04, SR: 0.02, R: 0 };
    const teamRaw = teamIds.map(id => {
      const gs  = state.generals[id];
      const def = GENERALS_DATA[id];
      const critRate = (TYPE_CRIT[def.type] || 0.07) + (RARITY_CRIT[def.rarity] || 0);
      return {
        id, name: def.name, emoji: def.emoji,
        stats: calcCharStats(gs, def), isEnemy: false,
        element: def.element, type: def.type, critRate
      };
    });
    const team = _applySkillLevelsToTeam(teamRaw);

    // ファイター構築（敵）
    const enemies = stage.enemies.map(e => ({
      name: e.name, emoji: e.emoji,
      stats: { hp: e.hp, atk: e.atk, def: e.def, spd: e.spd },
      isEnemy: true,
      element: e.element || null,  // 敵の属性（定義があれば）
      skills: e.skills || []
    }));

    const result = BattleEngine.simulate(team, enemies);

    // 日課・週課・カウント更新
    state.daily.battles = Math.min((state.daily.battles || 0) + 1, 99);
    state.progress.battleCount++;
    if (state.weekly) state.weekly.battles = (state.weekly.battles || 0) + 1;

    // ─── 連勝ストリーク更新 ────────────────────────────────────────────────
    if (result.win) {
      state.progress.totalWins = (state.progress.totalWins || 0) + 1;
      state.progress.winStreak = (state.progress.winStreak || 0) + 1;
      if (state.progress.winStreak > (state.progress.maxWinStreak || 0)) {
        state.progress.maxWinStreak = state.progress.winStreak;
      }
    } else {
      state.progress.winStreak = 0;
    }

    // 連勝ボーナス倍率（連勝数に応じて報酬増加）
    const streak = state.progress.winStreak;
    const streakMult = streak >= 20 ? 1.5
                     : streak >= 10 ? 1.3
                     : streak >= 5  ? 1.2
                     : streak >= 3  ? 1.1
                     : 1.0;

    const loot = { coins: 0, exp: 0, items: [], material: null, firstClear: null, levelUps: [],
                   streak, streakMult: streakMult > 1 ? streakMult : null };

    if (result.win) {
      // コイン（ストリークボーナス適用）
      const [cMin, cMax] = stage.rewards.coins;
      loot.coins = Math.floor(_randInt(cMin, cMax) * streakMult);
      state.resources.coins += loot.coins;

      // 経験値（ストリークボーナス適用、編成キャラに均等配布）
      const [eMin, eMax] = stage.rewards.exp;
      loot.exp = Math.floor(_randInt(eMin, eMax) * streakMult);
      const share = Math.floor(loot.exp / teamIds.length);
      teamIds.forEach(id => {
        const before = state.generals[id].level;
        _applyExp(id, share);
        const after = state.generals[id].level;
        if (after > before) loot.levelUps.push({ id, name: GENERALS_DATA[id].name, newLevel: after });
      });

      // 装備ドロップ（ストリーク5以上で+10% ドロップ率）
      if (stage.rewards.equipIds) {
        const dropBoost = streak >= 5 ? 1.1 : 1.0;
        stage.rewards.equipIds.forEach(({ id, chance }) => {
          if (Math.random() < chance * dropBoost) {
            const inst = { instanceId: `eq_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, defId: id, enhanceLevel: 0 };
            state.inventory.equipment.push(inst);
            loot.items.push(inst);
          }
        });
      }

      // 素材ドロップ（ストリーク10以上で+20% ドロップ率）
      if (stage.rewards.material) {
        const { id, chance } = stage.rewards.material;
        const matBoost = streak >= 10 ? 1.2 : 1.0;
        if (Math.random() < chance * matBoost) {
          state.inventory.materials[id] = (state.inventory.materials[id] || 0) + 1;
          loot.material = id;
        }
      }

      // 初回クリアボーナス
      if (!state.progress.clearedStages.includes(stageId)) {
        state.progress.clearedStages.push(stageId);
        if (stage.firstClear) {
          loot.firstClear = stage.firstClear;
          if (stage.firstClear.crystals) state.resources.crystals += stage.firstClear.crystals;
        }
      }
    }

    const newAchievements = checkAchievements();
    return { win: result.win, log: result.log, loot, turns: result.turns, stats: result.stats, newAchievements };
  }

  // ─── 無限塔 ─────────────────────────────────────────────────────────────

  // 無限塔のアンロック条件: 6-6（第6章最終ステージ）クリア済み
  function isTowerUnlocked() {
    return state.progress.clearedStages.includes('6-6');
  }

  // 最高到達階（0 = 未挑戦）
  function getTowerFloor() {
    return state.progress.towerFloor || 0;
  }

  // フロアに応じた敵データを動的生成
  function _buildTowerEnemies(floor) {
    // 基礎パラメータ（フロアに応じてスケール）
    const scale = 1 + (floor - 1) * 0.18;   // 1階 x1.00 → 10階 x2.62 → 30階 x6.22
    const r = n => Math.round(n * scale);

    // 敵プール（属性ローテーション）
    const ENEMY_POOL = [
      { name: 'スライム騎士',  emoji: '🛡️',  baseHp: 90,  baseAtk: 14, baseDef: 8,  baseSpd: 10, element: '水' },
      { name: '炎の魔獣',      emoji: '🔥',  baseHp: 110, baseAtk: 18, baseDef: 6,  baseSpd: 14, element: '炎' },
      { name: '氷の精霊',      emoji: '❄️',  baseHp: 80,  baseAtk: 16, baseDef: 10, baseSpd: 16, element: '氷' },
      { name: '雷鬼',          emoji: '⚡',  baseHp: 100, baseAtk: 20, baseDef: 5,  baseSpd: 18, element: '雷' },
      { name: '闇の刺客',      emoji: '🌑',  baseHp: 95,  baseAtk: 22, baseDef: 4,  baseSpd: 20, element: '闇' },
      { name: '光の守護者',    emoji: '✨',  baseHp: 130, baseAtk: 15, baseDef: 15, baseSpd: 12, element: '光' },
      { name: '風の踊り子',    emoji: '🌪️', baseHp: 85,  baseAtk: 17, baseDef: 7,  baseSpd: 22, element: '風' },
      { name: '大地の巨人',    emoji: '🪨',  baseHp: 160, baseAtk: 12, baseDef: 18, baseSpd: 8,  element: '土' },
    ];
    // ボスプール（10階ごと）
    const BOSS_POOL = [
      { name: '塔の番人 α',   emoji: '👹',  baseHp: 280, baseAtk: 28, baseDef: 18, baseSpd: 14, element: '炎' },
      { name: '深淵の竜',      emoji: '🐉',  baseHp: 350, baseAtk: 32, baseDef: 22, baseSpd: 12, element: '闇' },
      { name: '魔眼の君主',    emoji: '👁️', baseHp: 300, baseAtk: 35, baseDef: 16, baseSpd: 18, element: '雷' },
      { name: '永劫の巨王',    emoji: '🗿',  baseHp: 400, baseAtk: 25, baseDef: 30, baseSpd: 10, element: '土' },
    ];

    const isBossFloor = floor % 10 === 0;
    let enemies = [];

    if (isBossFloor) {
      // 10の倍数フロア: ボス + 取り巻き1体
      const boss = BOSS_POOL[Math.floor((floor / 10 - 1)) % BOSS_POOL.length];
      const minion = ENEMY_POOL[floor % ENEMY_POOL.length];
      enemies = [
        { name: boss.name, emoji: boss.emoji, element: boss.element,
          hp: r(boss.baseHp), atk: r(boss.baseAtk), def: r(boss.baseDef), spd: r(boss.baseSpd) },
        { name: minion.name, emoji: minion.emoji, element: minion.element,
          hp: r(minion.baseHp * 0.7), atk: r(minion.baseAtk * 0.7), def: r(minion.baseDef * 0.7), spd: r(minion.baseSpd) },
      ];
    } else {
      // 通常フロア: 2〜3体
      const count = floor % 5 === 0 ? 3 : 2;
      for (let i = 0; i < count; i++) {
        const e = ENEMY_POOL[(floor + i) % ENEMY_POOL.length];
        enemies.push({ name: e.name, emoji: e.emoji, element: e.element,
          hp: r(e.baseHp), atk: r(e.baseAtk), def: r(e.baseDef), spd: r(e.baseSpd) });
      }
    }

    return enemies.map(e => ({
      name: e.name, emoji: e.emoji, element: e.element || null, skills: [],
      stats: { hp: e.hp, atk: e.atk, def: e.def, spd: e.spd }, isEnemy: true
    }));
  }

  /**
   * 無限塔バトル
   * @param {number} floor 挑戦するフロア（1〜）
   */
  function towerBattle(floor) {
    if (!isTowerUnlocked()) return { success: false, reason: 'tower_locked' };

    const maxFloor = getTowerFloor();
    if (floor > maxFloor + 1) return { success: false, reason: 'floor_locked' };
    if (!consumeStamina(1)) return { success: false, reason: 'no_stamina' };

    const teamIds = state.formation.filter(id => id && state.generals[id]);
    if (teamIds.length === 0) return { success: false, reason: 'no_team' };

    // チームビルド（通常バトルと同じロジック）
    const TYPE_CRIT  = { assassin: 0.18, attacker: 0.12, mage: 0.10, tank: 0.04, healer: 0.05, support: 0.06, speedster: 0.15 };
    const RARITY_CRIT= { LR: 0.14, MR: 0.10, UR: 0.07, SSR: 0.04, SR: 0.02, R: 0 };
    const teamRaw = teamIds.map(id => {
      const gs = state.generals[id]; const def = GENERALS_DATA[id];
      const critRate = (TYPE_CRIT[def.type] || 0.07) + (RARITY_CRIT[def.rarity] || 0);
      return { id, name: def.name, emoji: def.emoji, stats: calcCharStats(gs, def),
               isEnemy: false, element: def.element, type: def.type, critRate };
    });
    const team = _applySkillLevelsToTeam(teamRaw);
    const enemies = _buildTowerEnemies(floor);

    const result = BattleEngine.simulate(team, enemies);

    // バトル統計更新
    state.daily.battles = Math.min((state.daily.battles || 0) + 1, 99);
    state.progress.battleCount++;
    if (state.weekly) state.weekly.battles = (state.weekly.battles || 0) + 1;

    const loot = { coins: 0, exp: 0, crystals: 0, floor, isBossFloor: floor % 10 === 0 };

    if (result.win) {
      // 最高到達階を更新
      if (floor > maxFloor) {
        state.progress.towerFloor = floor;
      }

      // 報酬: フロアに比例
      const base = floor * 80;
      loot.coins = Math.floor(base * (0.8 + Math.random() * 0.4));
      loot.exp   = Math.floor(base * 0.6 * (0.8 + Math.random() * 0.4));
      state.resources.coins += loot.coins;

      // EXP配布
      const share = Math.floor(loot.exp / teamIds.length);
      teamIds.forEach(id => _applyExp(id, share));

      // 10階ごとのボーナス: クリスタル
      if (floor % 10 === 0) {
        loot.crystals = floor;   // 10F→💎10、20F→💎20、30F→💎30…
        state.resources.crystals += loot.crystals;
      }
    }

    const newAchievements = checkAchievements();
    Storage.save(state);
    return { win: result.win, log: result.log, loot, turns: result.turns, newAchievements };
  }

  // ─── 育成 ────────────────────────────────────────────────────────────────

  function levelUpGeneral(generalId) {
    const gs = state.generals[generalId];
    if (!gs) return { success: false, reason: 'not_found' };
    if (gs.level >= _maxLevel(gs)) return { success: false, reason: 'max_level' };
    const cost = levelUpCost(gs.level);
    if (state.resources.coins < cost) return { success: false, reason: 'no_coins', needed: cost };

    state.resources.coins -= cost;
    _applyExp(generalId, expToNext(gs.level)); // 次レベルまでのEXPを一気に与える
    return { success: true, newLevel: state.generals[generalId].level, cost };
  }

  function addToFormation(generalId) {
    if (state.formation.includes(generalId)) return false;
    const slot = state.formation.indexOf(null);
    if (slot < 0) return false; // 満員
    state.formation[slot] = generalId;
    return true;
  }

  function removeFromFormation(generalId) {
    const slot = state.formation.indexOf(generalId);
    if (slot < 0) return false;
    state.formation[slot] = null;
    return true;
  }

  function equipItem(generalId, slot, instanceId) {
    const gs = state.generals[generalId];
    if (!gs) return false;
    gs.equips[slot] = instanceId;
    return true;
  }

  function unequipItem(generalId, slot) {
    const gs = state.generals[generalId];
    if (!gs) return false;
    gs.equips[slot] = null;
    return true;
  }

  // ─── ガチャ ──────────────────────────────────────────────────────────────

  const DRAW_COST_1  = 30;
  const DRAW_COST_10 = 280;
  const PITY_LIMIT   = 90;

  function draw(count) {
    const cost = count >= 10 ? DRAW_COST_10 : DRAW_COST_1 * count;
    if (state.resources.crystals < cost) return { success: false, reason: 'no_crystals', needed: cost };

    state.resources.crystals -= cost;
    state.daily.drew = true;
    if (state.weekly) state.weekly.draws = (state.weekly.draws || 0) + count;
    state.progress.totalDraws = (state.progress.totalDraws || 0) + count;

    const results = [];
    for (let i = 0; i < count; i++) {
      state.progress.gachaPity++;
      const HIGH_RARITIES = ['LR', 'MR', 'UR', 'SSR'];
      const forceHighRarity = state.progress.gachaPity >= PITY_LIMIT;
      if (forceHighRarity) state.progress.gachaPity = 0;

      const pool = forceHighRarity
        ? GACHA_POOL.filter(e => HIGH_RARITIES.includes(GENERALS_DATA[e.id].rarity))
        : GACHA_POOL;

      const total = pool.reduce((s, e) => s + e.weight, 0);
      let rand = Math.random() * total;
      let entry = pool[pool.length - 1];
      for (const e of pool) { rand -= e.weight; if (rand <= 0) { entry = e; break; } }

      const gid = entry.id;
      const def = GENERALS_DATA[gid];
      const isNew = !state.generals[gid];

      if (isNew) {
        state.generals[gid] = _newGeneral(gid);
        const slot = state.formation.indexOf(null);
        if (slot >= 0) state.formation[slot] = gid;
      } else {
        state.generals[gid].shards += 5;
      }

      results.push({ def, isNew });
    }

    const newAchievements = checkAchievements();
    return { success: true, results, newAchievements };
  }

  // ─── 覚醒（星アップ）────────────────────────────────────────────────────

  const AWAKEN_COST = [20, 40, 80, 150, 300]; // index = current stars-1 → cost to go to next star

  function awakenGeneral(generalId) {
    const gs = state.generals[generalId];
    if (!gs) return { success: false, reason: 'not_found' };
    const stars = gs.stars || 1;
    if (stars >= 6) return { success: false, reason: 'max_stars' };
    const cost = AWAKEN_COST[stars - 1];
    if ((gs.shards || 0) < cost) return { success: false, reason: 'no_shards', needed: cost };
    gs.shards -= cost;
    gs.stars = stars + 1;
    return { success: true, newStars: gs.stars };
  }

  function getAwakenCost(generalId) {
    const gs = state.generals[generalId];
    if (!gs) return null;
    const stars = gs.stars || 1;
    if (stars >= 6) return null;
    return AWAKEN_COST[stars - 1];
  }

  // ─── お気に入り ──────────────────────────────────────────────────────────
  function toggleFavorite(generalId) {
    const gs = state.generals[generalId];
    if (!gs) return false;
    gs.favorite = !gs.favorite;
    save();
    return !!gs.favorite;
  }

  // ─── 一括覚醒 ────────────────────────────────────────────────────────────
  function bulkAwaken() {
    const results = []; // { name, oldStars, newStars }
    Object.keys(state.generals).forEach(gid => {
      const gs = state.generals[gid];
      if (!gs) return;
      const oldStars = gs.stars || 1;
      // 欠片が足りる限り連続覚醒
      let changed = false;
      while (true) {
        const stars = gs.stars || 1;
        if (stars >= 6) break;
        const cost = AWAKEN_COST[stars - 1];
        if ((gs.shards || 0) < cost) break;
        gs.shards -= cost;
        gs.stars = stars + 1;
        changed = true;
      }
      if (changed) {
        const def = GENERALS_DATA[gid];
        results.push({ name: def ? def.name : gid, oldStars, newStars: gs.stars });
      }
    });
    if (results.length > 0) save();
    return { count: results.length, results };
  }

  // ─── 装備強化 ────────────────────────────────────────────────────────────

  const ENHANCE_BASE_COST = { R: 100, SR: 300, SSR: 800, UR: 2000, MR: 3500, LR: 5000 };
  const ENHANCE_MAX = 10;

  function enhanceEquip(instanceId) {
    const inst = state.inventory.equipment.find(e => e.instanceId === instanceId);
    if (!inst) return { success: false, reason: 'not_found' };
    if (inst.enhanceLevel >= ENHANCE_MAX) return { success: false, reason: 'max_enhance' };
    const ed = EQUIPMENT_DATA[inst.defId];
    if (!ed) return { success: false, reason: 'no_data' };
    const base = ENHANCE_BASE_COST[ed.rarity] || 100;
    const cost = base * (inst.enhanceLevel + 1);
    if (state.resources.coins < cost) return { success: false, reason: 'no_coins', needed: cost };
    state.resources.coins -= cost;
    inst.enhanceLevel++;
    state.daily.enhanced = true;
    if (state.weekly) state.weekly.enhanced = (state.weekly.enhanced || 0) + 1;
    const newAchievements = checkAchievements();
    return { success: true, newLevel: inst.enhanceLevel, cost, newAchievements };
  }

  function getEnhanceCost(instanceId) {
    const inst = state.inventory.equipment.find(e => e.instanceId === instanceId);
    if (!inst) return null;
    if (inst.enhanceLevel >= ENHANCE_MAX) return null;
    const ed = EQUIPMENT_DATA[inst.defId];
    if (!ed) return null;
    const base = ENHANCE_BASE_COST[ed.rarity] || 100;
    return base * (inst.enhanceLevel + 1);
  }

  // ─── 日課ボス ────────────────────────────────────────────────────────────

  const DAILY_BOSS_ATTEMPTS = 3; // 1日最大3回

  function battleBoss(difficultyId) {
    const bossData = DAILY_BOSS_DATA.find(b => b.id === difficultyId);
    if (!bossData) return { success: false, reason: 'not_found' };
    if ((state.daily.bossAttempts || 0) >= DAILY_BOSS_ATTEMPTS)
      return { success: false, reason: 'no_attempts' };
    if (!consumeStamina(3)) return { success: false, reason: 'no_stamina' };

    const teamIds = state.formation.filter(id => id && state.generals[id]);
    if (teamIds.length === 0) return { success: false, reason: 'no_team' };

    const TYPE_CRIT2 = { assassin: 0.18, attacker: 0.12, mage: 0.10, tank: 0.04, healer: 0.05, support: 0.06, speedster: 0.15 };
    const RARITY_CRIT2 = { LR: 0.14, MR: 0.10, UR: 0.07, SSR: 0.04, SR: 0.02, R: 0 };
    const teamRaw = teamIds.map(id => {
      const gs  = state.generals[id];
      const def = GENERALS_DATA[id];
      const critRate = (TYPE_CRIT2[def.type] || 0.07) + (RARITY_CRIT2[def.rarity] || 0);
      return {
        id, name: def.name, emoji: def.emoji,
        stats: calcCharStats(gs, def), isEnemy: false,
        element: def.element, type: def.type, critRate
      };
    });
    const team = _applySkillLevelsToTeam(teamRaw);
    const enemies = bossData.enemies.map(e => ({
      name: e.name, emoji: e.emoji,
      stats: { hp: e.hp, atk: e.atk, def: e.def, spd: e.spd },
      isEnemy: true,
      element: e.element || null,
      skills: e.skills || []
    }));

    const result = BattleEngine.simulate(team, enemies);
    state.daily.bossAttempts = (state.daily.bossAttempts || 0) + 1;
    state.daily.battles = Math.min((state.daily.battles || 0) + 1, 99);
    state.progress.battleCount++;

    const loot = { coins: 0, crystals: 0, material: null, materialCount: 0 };

    if (result.win) {
      const [cMin, cMax] = bossData.rewards.coins;
      loot.coins = _randInt(cMin, cMax);
      loot.crystals = bossData.rewards.crystals;
      loot.material = bossData.rewards.material;
      loot.materialCount = bossData.rewards.materialCount;

      state.resources.coins    += loot.coins;
      state.resources.crystals += loot.crystals;
      state.inventory.materials[loot.material] =
        (state.inventory.materials[loot.material] || 0) + loot.materialCount;
      state.daily.bossWins = (state.daily.bossWins || 0) + 1;
      if (state.weekly) state.weekly.bossWins = (state.weekly.bossWins || 0) + 1;

      // EXP配布
      const share = Math.floor(500 / teamIds.length);
      teamIds.forEach(id => _applyExp(id, share));
    }

    return { win: result.win, log: result.log, loot, attemptsLeft: DAILY_BOSS_ATTEMPTS - state.daily.bossAttempts };
  }

  function getDailyBossState() {
    return {
      attempts:     state.daily.bossAttempts || 0,
      wins:         state.daily.bossWins     || 0,
      attemptsLeft: DAILY_BOSS_ATTEMPTS - (state.daily.bossAttempts || 0)
    };
  }

  // ─── 装備売却 ────────────────────────────────────────────────────────────

  const SELL_PRICE = { R: 100, SR: 500, SSR: 2000, UR: 8000, MR: 15000, LR: 20000 };

  function sellEquip(instanceId) {
    const idx = state.inventory.equipment.findIndex(e => e.instanceId === instanceId);
    if (idx < 0) return { success: false, reason: 'not_found' };
    const inst = state.inventory.equipment[idx];
    const ed   = EQUIPMENT_DATA[inst.defId];
    if (!ed)    return { success: false, reason: 'no_data' };
    const isEquipped = Object.values(state.generals).some(gs =>
      Object.values(gs.equips).includes(instanceId)
    );
    if (isEquipped) return { success: false, reason: 'equipped' };
    const base  = SELL_PRICE[ed.rarity] || 100;
    const coins = Math.floor(base * (1 + inst.enhanceLevel * 0.5));
    state.inventory.equipment.splice(idx, 1);
    state.resources.coins += coins;
    return { success: true, coins };
  }

  // ─── 素材合成 ────────────────────────────────────────────────────────────

  const SYNTH_RECIPES = [
    { from: 'herb',          cost: 5, to: 'fang',           get: 1 },
    { from: 'fang',          cost: 5, to: 'pelt',           get: 1 },
    { from: 'pelt',          cost: 5, to: 'bark',           get: 1 },
    { from: 'bark',          cost: 5, to: 'iron',           get: 1 },
    { from: 'iron',          cost: 5, to: 'darkstone',      get: 1 },
    { from: 'darkstone',     cost: 5, to: 'crystaldust',    get: 1 },
    { from: 'crystaldust',   cost: 5, to: 'goddessfeather', get: 1 },
    { from: 'goddessfeather',cost: 5, to: 'dragonscale',    get: 1 },
    { from: 'dragonscale',   cost: 5, to: 'holywater',      get: 1 },
    { from: 'shard_s',       cost: 10, to: '_crystals',     get: 30 }
  ];

  function synthesize(fromId) {
    const recipe = SYNTH_RECIPES.find(r => r.from === fromId);
    if (!recipe) return { success: false, reason: 'no_recipe' };
    const have = state.inventory.materials[fromId] || 0;
    if (have < recipe.cost) return { success: false, reason: 'not_enough', needed: recipe.cost };
    state.inventory.materials[fromId] -= recipe.cost;
    if (recipe.to === '_crystals') {
      state.resources.crystals += recipe.get;
    } else {
      state.inventory.materials[recipe.to] = (state.inventory.materials[recipe.to] || 0) + recipe.get;
    }
    return { success: true, to: recipe.to, got: recipe.get };
  }

  function getSynthRecipes() { return SYNTH_RECIPES; }

  // ─── ショップ ────────────────────────────────────────────────────────────

  // ショップ価格テーブル（レアリティ別）
  const SHOP_RARITY_PRICE = { R: 800, SR: 2500, SSR: 8000, UR: 20000 };

  // EQUIPMENT_DATA から動的に生成（UR以下のみ対象、LRは入手困難なので除外）
  const SHOP_POOL = Object.values(EQUIPMENT_DATA)
    .filter(ed => SHOP_RARITY_PRICE[ed.rarity] !== undefined)
    .map(ed => ({ defId: ed.id, price: SHOP_RARITY_PRICE[ed.rarity] }));

  function _buildShopItems() {
    // R×3 + SR×2 + SSR×1 をランダムに選ぶ（重複なし）
    const byRarity = r => SHOP_POOL.filter(i => EQUIPMENT_DATA[i.defId]?.rarity === r);
    const shuffle  = arr => arr.slice().sort(() => Math.random() - 0.5);
    return [
      ...shuffle(byRarity('R')).slice(0, 3),
      ...shuffle(byRarity('SR')).slice(0, 2),
      ...shuffle(byRarity('SSR')).slice(0, 1)
    ].map((item, idx) => ({ ...item, idx, sold: false }));
  }

  function _refreshShopIfNeeded() {
    if (!state.shop) state.shop = { items: [], refreshedAt: null };
    const today = _todayStr();
    if (state.shop.refreshedAt !== today) {
      state.shop.items       = _buildShopItems();
      state.shop.refreshedAt = today;
    }
  }

  function getShop() {
    _refreshShopIfNeeded();
    return state.shop.items.map(item => ({
      ...item,
      def: EQUIPMENT_DATA[item.defId]
    }));
  }

  /** ショップを手動リフレッシュ（30💎消費、1日1回まで無料） */
  function refreshShop() {
    if (!state.shop) state.shop = { items: [], refreshedAt: null };
    const today = _todayStr();

    // 無料リフレッシュ（1日1回）
    if (!state.shop.freeRefreshDate || state.shop.freeRefreshDate !== today) {
      state.shop.items          = _buildShopItems();
      state.shop.refreshedAt    = today;
      state.shop.freeRefreshDate= today;
      Storage.save(state);
      return { success: true, free: true };
    }

    // 有料リフレッシュ（30💎）
    const COST = 30;
    if (state.resources.crystals < COST)
      return { success: false, reason: 'no_crystals', needed: COST };

    state.resources.crystals -= COST;
    state.shop.items       = _buildShopItems();
    state.shop.refreshedAt = today;
    Storage.save(state);
    return { success: true, free: false, cost: COST };
  }

  /** スタミナ回復（コイン購入、スタミナが最大値未満の場合のみ） */
  function buyStaminaPotion() {
    const COST = 1000;
    const RECOVER = 10;
    if (state.resources.coins < COST)
      return { success: false, reason: 'no_coins', needed: COST };
    const st = getStamina();
    if (st.current >= st.max)
      return { success: false, reason: 'stamina_full' };
    state.resources.coins -= COST;
    state.resources.stamina = Math.min(st.max, (state.resources.stamina || st.current) + RECOVER);
    Storage.save(state);
    return { success: true, recovered: RECOVER };
  }

  function buyShopItem(idx) {
    _refreshShopIfNeeded();
    const item = state.shop.items[idx];
    if (!item)       return { success: false, reason: 'not_found' };
    if (item.sold)   return { success: false, reason: 'already_sold' };
    if (state.resources.coins < item.price)
      return { success: false, reason: 'no_coins', needed: item.price };

    state.resources.coins -= item.price;
    item.sold = true;

    const instanceId = `${item.defId}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
    state.inventory.equipment.push({ instanceId, defId: item.defId, enhanceLevel: 0 });
    return { success: true, instanceId };
  }

  // ─── 保存 ────────────────────────────────────────────────────────────────

  function save() {
    state.player.totalSaves++;
    return Storage.save(state);
  }

  // ─── ゲッター ────────────────────────────────────────────────────────────

  function getState()          { return state; }
  function getGeneralDef(id)   { return GENERALS_DATA[id] || null; }
  function getAllGeneralDefs()  { return GENERALS_DATA; }
  function getCharStats(id)    { return state.generals[id] ? calcCharStats(state.generals[id], GENERALS_DATA[id]) : null; }
  function getFormationTeam()  {
    return state.formation
      .filter(id => id && state.generals[id])
      .map(id => ({
        state: state.generals[id],
        def:   GENERALS_DATA[id],
        stats: calcCharStats(state.generals[id], GENERALS_DATA[id])
      }));
  }

  // ─── スキルレベル ────────────────────────────────────────────────────────

  // 各スキルレベル段階で消費する素材 (index = currentLevel - 1, max lv5)
  const SKILL_UP_MATS = ['herb', 'fang', 'pelt', 'bark'];
  const SKILL_UP_COUNT = 3;

  function getSkillUpgradeCost(gid, skillIdx) {
    const gs = state.generals[gid];
    if (!gs) return null;
    const currentLv = (gs.skillLevels?.[skillIdx] ?? 1);
    if (currentLv >= 5) return null;
    return { mat: SKILL_UP_MATS[currentLv - 1], count: SKILL_UP_COUNT, nextLevel: currentLv + 1 };
  }

  function upgradeSkill(gid, skillIdx) {
    const gs = state.generals[gid];
    if (!gs) return { success: false, reason: 'not_found' };
    if (!gs.skillLevels) gs.skillLevels = {};
    const currentLv = gs.skillLevels[skillIdx] ?? 1;
    if (currentLv >= 5) return { success: false, reason: 'max_level' };
    const cost = getSkillUpgradeCost(gid, skillIdx);
    const have  = state.inventory.materials[cost.mat] || 0;
    if (have < cost.count) return { success: false, reason: 'no_materials', needed: cost.count, have };
    state.inventory.materials[cost.mat] -= cost.count;
    gs.skillLevels[skillIdx] = currentLv + 1;
    return { success: true, newLevel: currentLv + 1 };
  }

  // バトル用チームビルド時にスキルレベルを適用する
  function _applySkillLevelsToTeam(teamEntries) {
    return teamEntries.map(entry => {
      const gs = state.generals[entry.id];
      const skillLevels = gs?.skillLevels || {};
      const boostedSkills = (GENERALS_DATA[entry.id]?.skills || []).map((sk, idx) => {
        const skLv = skillLevels[idx] ?? 1;
        if (skLv <= 1) return sk;
        return { ...sk, power: sk.power * (1 + (skLv - 1) * 0.1) };
      });
      return { ...entry, skills: boostedSkills };
    });
  }

  // ─── プレイヤー名 ────────────────────────────────────────────────────────

  function setPlayerName(name) {
    name = (name || '').trim().slice(0, 12);
    if (!name) return { success: false, reason: 'empty' };
    state.player.name = name;
    save();
    return { success: true, name };
  }

  // ─── アチーブメント ──────────────────────────────────────────────────────

  const ACHIEVEMENTS = [
    // 戦闘マイルストーン
    { id: 'first_win',   name: '初陣',       emoji: '⚔️',  desc: '初めての勝利を収めた'            , check: s => (s.progress.totalWins||0) >= 1   },
    { id: 'wins_10',     name: '歴戦の士',   emoji: '🏆',  desc: '累計10勝を達成した'             , check: s => (s.progress.totalWins||0) >= 10  },
    { id: 'wins_50',     name: '猛将',       emoji: '🔥',  desc: '累計50勝を達成した'             , check: s => (s.progress.totalWins||0) >= 50  },
    { id: 'wins_100',    name: '伝説の将',   emoji: '👑',  desc: '累計100勝を達成した'            , check: s => (s.progress.totalWins||0) >= 100 },
    // 連勝
    { id: 'streak_3',    name: '三連勝',     emoji: '⚡',  desc: '3連勝を達成した'                , check: s => (s.progress.maxWinStreak||0) >= 3   },
    { id: 'streak_10',   name: '無双将軍',   emoji: '🌟',  desc: '10連勝を達成した'               , check: s => (s.progress.maxWinStreak||0) >= 10  },
    // ステージクリア
    { id: 'ch1_clear',   name: '第一章制覇', emoji: '🏰',  desc: '第一章を全ステージクリアした'    , check: s => [1,2,3,4,5,6].every(n=>s.progress.clearedStages.includes(`1-${n}`)) },
    { id: 'ch3_clear',   name: '神殿の覇者', emoji: '⛩️',  desc: '第三章を全ステージクリアした'    , check: s => [1,2,3,4,5,6].every(n=>s.progress.clearedStages.includes(`3-${n}`)) },
    { id: 'ch6_clear',   name: '幻夢の覇者', emoji: '✨',  desc: '第六章を全ステージクリアした'    , check: s => [1,2,3,4,5,6].every(n=>s.progress.clearedStages.includes(`6-${n}`)) },
    // ガチャ・コレクション
    { id: 'first_draw',  name: '運命の出会い', emoji: '🎲', desc: '初めてガチャを引いた'          , check: s => (s.progress.totalDraws||0) >= 1   },
    { id: 'draws_100',   name: 'ガチャ廃人',   emoji: '💎', desc: '累計100回ガチャを引いた'       , check: s => (s.progress.totalDraws||0) >= 100  },
    { id: 'own_5',       name: '仲間集め',   emoji: '📚',  desc: '5体の副将を獲得した'            , check: s => Object.keys(s.generals).length >= 5  },
    { id: 'own_15',      name: 'コレクター', emoji: '💼',  desc: '15体の副将を獲得した'           , check: s => Object.keys(s.generals).length >= 15 },
    { id: 'get_ssr',     name: 'SSR降臨',   emoji: '💫',  desc: 'SSR以上を初めて獲得した'         , check: s => Object.keys(s.generals).some(id => ['SSR','UR','MR','LR'].includes(GENERALS_DATA[id]?.rarity)) },
    { id: 'get_lr',      name: '天帝降臨',   emoji: '⚜️',  desc: 'LRレアリティを獲得した'         , check: s => Object.keys(s.generals).some(id => GENERALS_DATA[id]?.rarity === 'LR') },
    // 成長
    { id: 'lv10',        name: '高みへの道', emoji: '📈',  desc: '副将をLv.10にした'              , check: s => Object.values(s.generals).some(g => g.level >= 10) },
    { id: 'enhance_max', name: '鍛冶の極み', emoji: '🔨',  desc: '装備を+10まで強化した'           , check: s => s.inventory.equipment.some(e => (e.enhanceLevel||0) >= 10) },
  ];

  function checkAchievements() {
    if (!state.progress.achievements) state.progress.achievements = [];
    const unlocked = state.progress.achievements;
    const newlyUnlocked = [];
    for (const ach of ACHIEVEMENTS) {
      if (!unlocked.includes(ach.id) && ach.check(state)) {
        unlocked.push(ach.id);
        newlyUnlocked.push(ach);
      }
    }
    return newlyUnlocked;
  }

  function getAchievements() {
    const unlocked = state.progress.achievements || [];
    return ACHIEVEMENTS.map(a => ({ ...a, unlocked: unlocked.includes(a.id) }));
  }

  // ─── ユーティリティ ──────────────────────────────────────────────────────

  function _randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }

  return {
    init, calculateIdleReward, collectIdleReward,
    battle,
    levelUpGeneral, addToFormation, removeFromFormation,
    equipItem, unequipItem,
    awakenGeneral, getAwakenCost, bulkAwaken, toggleFavorite,
    enhanceEquip, getEnhanceCost,
    battleBoss, getDailyBossState,
    draw,
    save,
    checkAndResetDaily, getDailyTasks, claimDailyTask,
    checkAndResetWeekly, getWeeklyTasks, claimWeeklyTask,
    getStamina, consumeStamina,
    sellEquip, synthesize, getSynthRecipes,
    getShop, buyShopItem,
    upgradeSkill, getSkillUpgradeCost,
    breakLimit, getBreakLimitInfo,
    getState, getGeneralDef, getAllGeneralDefs,
    getCharStats, getFormationTeam,
    getIdleRate, calcTeamPower,
    expToNext, levelUpCost,
    setPlayerName,
    getAchievements, checkAchievements,
    towerBattle, isTowerUnlocked, getTowerFloor,
    getTowerEnemyPreview: _buildTowerEnemies,
    refreshShop, buyStaminaPotion
  };
})();
