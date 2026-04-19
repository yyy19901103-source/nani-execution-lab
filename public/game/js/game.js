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
      gachaPity: 0
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
    shop: { items: [], refreshedAt: null }
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
    if (current < STAMINA_MAX) {
      const at = state.resources.staminaAt || new Date().toISOString();
      const elapsedMin = (Date.now() - new Date(at).getTime()) / 60000;
      const done = Math.floor(elapsedMin / STAMINA_REGEN);
      nextRegenMin = Math.max(1, Math.ceil((done + 1) * STAMINA_REGEN - elapsedMin));
    }
    return { current, max: STAMINA_MAX, nextRegenMin };
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
    const teamRaw = teamIds.map(id => {
      const gs  = state.generals[id];
      const def = GENERALS_DATA[id];
      return { id, name: def.name, emoji: def.emoji, stats: calcCharStats(gs, def), isEnemy: false };
    });
    const team = _applySkillLevelsToTeam(teamRaw);

    // ファイター構築（敵）
    const enemies = stage.enemies.map(e => ({
      name: e.name, emoji: e.emoji,
      stats: { hp: e.hp, atk: e.atk, def: e.def, spd: e.spd },
      isEnemy: true
    }));

    const result = BattleEngine.simulate(team, enemies);

    // 日課・カウント更新
    state.daily.battles = Math.min((state.daily.battles || 0) + 1, 99);
    state.progress.battleCount++;

    const loot = { coins: 0, exp: 0, items: [], material: null, firstClear: null, levelUps: [] };

    if (result.win) {
      // コイン
      const [cMin, cMax] = stage.rewards.coins;
      loot.coins = _randInt(cMin, cMax);
      state.resources.coins += loot.coins;

      // 経験値（編成キャラに均等配布）
      const [eMin, eMax] = stage.rewards.exp;
      loot.exp = _randInt(eMin, eMax);
      const share = Math.floor(loot.exp / teamIds.length);
      teamIds.forEach(id => {
        const before = state.generals[id].level;
        _applyExp(id, share);
        const after = state.generals[id].level;
        if (after > before) loot.levelUps.push({ id, name: GENERALS_DATA[id].name, newLevel: after });
      });

      // 装備ドロップ
      if (stage.rewards.equipIds) {
        stage.rewards.equipIds.forEach(({ id, chance }) => {
          if (Math.random() < chance) {
            const inst = { instanceId: `eq_${Date.now()}_${Math.random().toString(36).slice(2,7)}`, defId: id, enhanceLevel: 0 };
            state.inventory.equipment.push(inst);
            loot.items.push(inst);
          }
        });
      }

      // 素材ドロップ
      if (stage.rewards.material) {
        const { id, chance } = stage.rewards.material;
        if (Math.random() < chance) {
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

    return { win: result.win, log: result.log, loot };
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

    const results = [];
    for (let i = 0; i < count; i++) {
      state.progress.gachaPity++;
      const forceSSR = state.progress.gachaPity >= PITY_LIMIT;
      if (forceSSR) state.progress.gachaPity = 0;

      const pool = forceSSR
        ? GACHA_POOL.filter(e => GENERALS_DATA[e.id].rarity === 'SSR')
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

    return { success: true, results };
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

  // ─── 装備強化 ────────────────────────────────────────────────────────────

  const ENHANCE_BASE_COST = { R: 100, SR: 300, SSR: 800 };
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
    return { success: true, newLevel: inst.enhanceLevel, cost };
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

    const teamRaw = teamIds.map(id => {
      const gs  = state.generals[id];
      const def = GENERALS_DATA[id];
      return { id, name: def.name, emoji: def.emoji, stats: calcCharStats(gs, def), isEnemy: false };
    });
    const team = _applySkillLevelsToTeam(teamRaw);
    const enemies = bossData.enemies.map(e => ({
      name: e.name, emoji: e.emoji,
      stats: { hp: e.hp, atk: e.atk, def: e.def, spd: e.spd },
      isEnemy: true
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

  const SELL_PRICE = { R: 100, SR: 500, SSR: 2000 };

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

  const SHOP_POOL = [
    // R items (price: 800)
    { defId: 'sword_r',    price: 800 },
    { defId: 'armor_r',    price: 800 },
    { defId: 'ring_r',     price: 800 },
    // SR items (price: 2500)
    { defId: 'sword_sr',   price: 2500 },
    { defId: 'armor_sr',   price: 2500 },
    { defId: 'ring_sr',    price: 2500 },
  ];

  function _buildShopItems() {
    // 3 R + 1 SR をランダムに選ぶ（重複なし）
    const rItems  = SHOP_POOL.filter(i => EQUIPMENT_DATA[i.defId]?.rarity === 'R');
    const srItems = SHOP_POOL.filter(i => EQUIPMENT_DATA[i.defId]?.rarity === 'SR');
    const shuffle = arr => arr.slice().sort(() => Math.random() - 0.5);
    return [
      ...shuffle(rItems).slice(0, 3),
      ...shuffle(srItems).slice(0, 1)
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

  // ─── ユーティリティ ──────────────────────────────────────────────────────

  function _randInt(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); }

  return {
    init, calculateIdleReward, collectIdleReward,
    battle,
    levelUpGeneral, addToFormation, removeFromFormation,
    equipItem, unequipItem,
    awakenGeneral, getAwakenCost,
    enhanceEquip, getEnhanceCost,
    battleBoss, getDailyBossState,
    draw,
    save,
    checkAndResetDaily, getDailyTasks, claimDailyTask,
    getStamina, consumeStamina,
    sellEquip, synthesize, getSynthRecipes,
    getShop, buyShopItem,
    upgradeSkill, getSkillUpgradeCost,
    breakLimit, getBreakLimitInfo,
    getState, getGeneralDef, getAllGeneralDefs,
    getCharStats, getFormationTeam,
    getIdleRate, calcTeamPower,
    expToNext, levelUpCost
  };
})();
