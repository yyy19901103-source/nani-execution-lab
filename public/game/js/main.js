/**
 * main.js — UI制御・イベントバインド・起動処理
 * 4タブ: ホーム / 冒険 / 副将 / ガチャ
 */
const UI = (() => {

  // ─── ユーティリティ ─────────────────────────────────────────────────────

  const $ = id => document.getElementById(id);
  const show = id => { const e=$(id); if(e) e.classList.remove('hidden'); };
  const hide = id => { const e=$(id); if(e) e.classList.add('hidden'); };
  const showTemp = (id, ms=2000) => { show(id); setTimeout(() => hide(id), ms); };

  function makePortrait(def, size='md') {
    const sizeClass = size === 'lg' ? 'portrait-lg' : 'portrait-md';
    return `
      <div class="portrait ${sizeClass} rarity-${def.rarity}" style="background:${def.gradient}">
        <span class="portrait-emoji">${def.emoji}</span>
        <img src="assets/characters/${def.id}.png"
             onload="this.classList.add('loaded')" onerror="this.remove()">
        <span class="rarity-badge badge-${def.rarity}">${def.rarity}</span>
      </div>`;
  }

  // ─── リソースバー更新（全タブ共通） ────────────────────────────────────

  function updateResourceBar() {
    const r = Game.getState().resources;
    $('coins').textContent    = Math.floor(r.coins).toLocaleString();
    $('crystals').textContent = Math.floor(r.crystals);
    const st = Game.getStamina();
    const stEl = $('stamina-display');
    if (stEl) {
      stEl.textContent = `⚡ ${st.current}/${st.max}`;
      stEl.title = st.current < st.max ? `${st.nextRegenMin}分後に回復` : '満タン';
      stEl.classList.toggle('stamina-low', st.current <= 5);
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
      this.renderDailyTasks();
      this.renderDashboard();
    },

    renderDashboard() {
      const el = $('home-dashboard');
      if (!el) return;
      const state    = Game.getState();
      const cleared  = state.progress.clearedStages.length;
      const total    = getAllStageIds().length;
      const pct      = Math.floor(cleared / total * 100);
      const power    = Math.floor(Game.calcTeamPower());
      const rate     = Math.floor(Game.getIdleRate());
      el.innerHTML = `
        <div class="dash-chip"><span class="dash-icon">🏆</span><span class="dash-val">${cleared}/${total}</span><span class="dash-lbl">クリア</span></div>
        <div class="dash-chip"><span class="dash-icon">💪</span><span class="dash-val">${power.toLocaleString()}</span><span class="dash-lbl">戦力</span></div>
        <div class="dash-chip"><span class="dash-icon">🪙</span><span class="dash-val">${rate}/分</span><span class="dash-lbl">放置収益</span></div>
        <div class="dash-chip"><span class="dash-icon">👥</span><span class="dash-val">${Object.keys(state.generals).length}/12</span><span class="dash-lbl">副将</span></div>`;
    },

    renderFormation() {
      const el = $('formation-display');
      if (!el) return;
      const state = Game.getState();
      el.innerHTML = '';
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
    },

    renderDailyTasks() {
      const el = $('daily-tasks');
      if (!el) return;
      el.innerHTML = '';
      Game.getDailyTasks().forEach(task => {
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

        div.innerHTML = `
          <span class="task-icon">${task.icon}</span>
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
          if (r.success) { updateResourceBar(); this.renderDailyTasks(); }
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

    update() { this.isBossTab ? this.renderBossSection() : this.renderChapter(); },

    _switchView(isBoss) {
      this.isBossTab = isBoss;
      const stageList = $('stage-list');
      const bossSection = $('daily-boss-section');
      if (stageList)   stageList.classList.toggle('hidden', isBoss);
      if (bossSection) bossSection.classList.toggle('hidden', !isBoss);

      document.querySelectorAll('.chapter-tab').forEach(btn => {
        const bossBtnMatch = isBoss && btn.dataset.boss;
        const chapterBtnMatch = !isBoss && parseInt(btn.dataset.chapter) === this.currentChapter;
        btn.classList.toggle('active', bossBtnMatch || chapterBtnMatch);
      });
    },

    renderChapter() {
      this._switchView(false);
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

        const statusIcon = isCleared ? '⭐' : isNext ? '▶' : '🔒';
        const btnHtml = !isLocked
          ? `<button class="btn-battle" data-stage="${stage.id}">⚔️ 戦闘</button>`
          : `<button class="btn-battle" disabled>🔒</button>`;

        const bossKey = stageBossImg[stage.id];
        const bossImgHtml = bossKey
          ? `<img src="assets/bosses/${bossKey}.png" class="stage-boss-img" alt="${stage.name}" onerror="this.style.display='none'">`
          : '';

        div.innerHTML = `
          <span class="stage-status">${statusIcon}</span>
          ${bossImgHtml}
          <div class="stage-info">
            <div class="stage-name">${stage.isBoss?'👑 ':''}${stage.id} ${stage.name}</div>
            <div class="stage-enemies">${stage.enemies.map(e=>e.emoji).join(' ')}</div>
          </div>
          ${btnHtml}`;
        el.appendChild(div);
      });

      el.querySelectorAll('.btn-battle[data-stage]').forEach(btn => {
        btn.addEventListener('click', () => this.handleBattle(btn.dataset.stage));
      });
    },

    renderBossSection() {
      this._switchView(true);
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
          ? `<img src="assets/bosses/${bossImg}.png" class="boss-card-img" alt="${boss.name}" onerror="this.outerHTML='<span class=\\'boss-emoji\\'>${boss.emoji}</span>'">`
          : `<span class="boss-emoji">${boss.emoji}</span>`;
        card.innerHTML = `
          <div class="boss-card-header">
            ${imgHtml}
            <div>
              <div class="boss-name">${boss.name}</div>
              <div class="boss-difficulty-label">難易度：${boss.label}</div>
            </div>
          </div>
          <div class="boss-rewards">
            <span class="boss-reward-chip">🪙 ${boss.rewards.coins[0].toLocaleString()}〜</span>
            <span class="boss-reward-chip">💎 +${boss.rewards.crystals}</span>
            <span class="boss-reward-chip">${MATERIALS_DATA[boss.rewards.material]?.emoji} ×${boss.rewards.materialCount}</span>
          </div>
          <button class="btn-boss-fight" data-boss="${boss.id}" ${disabled ? 'disabled' : ''}>
            ${disabled ? '本日終了' : '⚔️ 挑戦する'}
          </button>`;
        el.appendChild(card);
      });

      el.querySelectorAll('.btn-boss-fight[data-boss]').forEach(btn => {
        btn.addEventListener('click', () => this.handleBossBattle(btn.dataset.boss));
      });
    },

    lastStageId: null,

    handleBattle(stageId) {
      const result = Game.battle(stageId);
      if (result.reason) {
        if (result.reason === 'no_team')    { alert('編成に副将を入れてください！'); return; }
        if (result.reason === 'no_stamina') { alert('スタミナが不足しています！　⚡ 5分ごとに1回復します。'); updateResourceBar(); return; }
        if (result.reason !== undefined && !result.win) { alert('エラー: ' + result.reason); return; }
      }
      this.lastStageId = stageId;
      updateResourceBar();
      this.renderChapter();
      HomeTab.renderDailyTasks();
      this.showBattleResult(stageId, result, false);
    },

    handleBossBattle(bossId) {
      const result = Game.battleBoss(bossId);
      if (result.reason === 'no_attempts') { alert('本日の挑戦回数が尽きました。明日また挑戦してください！'); return; }
      if (result.reason === 'no_team')     { alert('編成に副将を入れてください！'); return; }
      if (result.reason === 'no_stamina')  { alert('スタミナが不足しています！　日課ボスは⚡3消費します。'); updateResourceBar(); return; }
      updateResourceBar();
      this.renderBossSection();
      HomeTab.renderDailyTasks();
      this.showBattleResult(bossId, result, true);
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

      const lootEl = $('result-loot');
      lootEl.innerHTML = '';
      if (win) {
        const loot = result.loot;
        if (loot.coins)    lootEl.innerHTML += `<span class="loot-chip">🪙 +${loot.coins.toLocaleString()}</span>`;
        if (loot.exp)      lootEl.innerHTML += `<span class="loot-chip">✨ EXP +${loot.exp}</span>`;
        if (loot.crystals) lootEl.innerHTML += `<span class="loot-chip">💎 +${loot.crystals}</span>`;
        if (loot.material) {
          const md = MATERIALS_DATA[loot.material];
          if (md) lootEl.innerHTML += `<span class="loot-chip">${md.emoji} ${md.name} ×${loot.materialCount||1}</span>`;
        }
        if (!isBoss) {
          loot.items?.forEach(inst => {
            const ed = EQUIPMENT_DATA[inst.defId];
            if (ed) lootEl.innerHTML += `<span class="loot-chip rarity-chip-${ed.rarity}">${ed.emoji} ${ed.name}</span>`;
          });
          if (loot.firstClear?.crystals) lootEl.innerHTML += `<span class="loot-chip first-clear">💎 初回 +${loot.firstClear.crystals}</span>`;
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
      }

      const logEl = $('result-log');
      logEl.innerHTML = '';
      BattleEngine.extractHighlights(result.log, 7).forEach((entry, i) => {
        setTimeout(() => {
          const div = document.createElement('div');
          div.className = `log-entry anim-fadein ${entry.isSkill?'log-skill':''} ${entry.type==='result'?'log-result':''}`;
          div.textContent = entry.text;
          logEl.appendChild(div);
          logEl.scrollTop = logEl.scrollHeight;
        }, i * 130);
      });

      // 再挑戦ボタン（通常ステージの勝利時のみ）
      const retryBtn = $('result-retry');
      if (retryBtn) {
        if (!isBoss && win) {
          retryBtn.classList.remove('hidden');
          // イベントを毎回付け直す（クローン置換で重複防止）
          const fresh = retryBtn.cloneNode(true);
          retryBtn.replaceWith(fresh);
          fresh.addEventListener('click', () => {
            hide('battle-result');
            setTimeout(() => this.handleBattle(id), 80);
          });
        } else {
          retryBtn.classList.add('hidden');
        }
      }

      show('battle-result');
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // 副将タブ
  // ═══════════════════════════════════════════════════════════════════════════

  const GeneralsTab = {
    update() {
      this.renderFormationEditor();
      this.renderGrid();
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
      el.innerHTML = '';
      const total = Object.keys(state.generals).length;
      $('generals-count') && ($('generals-count').textContent = `(${total}体)`);

      // SSR→SR→R 順にソート
      const order = { SSR: 0, SR: 1, R: 2 };
      const sorted = Object.keys(state.generals).sort((a, b) => {
        const da = GENERALS_DATA[a], db = GENERALS_DATA[b];
        return (order[da.rarity] - order[db.rarity]) || (state.generals[b].level - state.generals[a].level);
      });

      sorted.forEach(gid => {
        const def = GENERALS_DATA[gid];
        const gs  = state.generals[gid];
        const card = document.createElement('div');
        card.className = `general-card rarity-${def.rarity}`;
        const starsStr = '⭐'.repeat(gs.stars || 1);
        card.innerHTML = `
          ${makePortrait(def,'md')}
          ${inFormation.includes(gid) ? '<span class="formation-badge">編成中</span>' : ''}
          <div class="card-footer">
            <div class="card-name">${def.name}</div>
            <div class="card-lv">Lv.${gs.level} <span class="card-stars">${starsStr}</span></div>
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
      const slotLabels = { weapon: '⚔️ 武器', armor: '🛡️ 防具', accessory: '💍 装飾' };
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

      $('detail-body').innerHTML = `
        <div class="detail-top">
          <div class="detail-portrait-wrap">
            ${makePortrait(def,'lg')}
          </div>
          <div class="detail-meta">
            <h2 class="detail-name">${def.name}</h2>
            <p class="detail-title">${def.title}</p>
            <div class="detail-tags">
              <span class="tag tag-elem">${def.element}</span>
              <span class="tag tag-type">${def.typeName}</span>
            </div>
            <p class="detail-desc">${def.description}</p>
            <div class="detail-stars">${starsHtml}</div>
            <p class="detail-shards">欠片: ${shards}個</p>
          </div>
        </div>

        <div class="detail-level-block">
          <div class="level-row">
            <span class="level-num">Lv. <strong>${gs.level}</strong></span>
            <span class="exp-text">${gs.exp} / ${expMax} EXP</span>
          </div>
          <div class="exp-bar-wrap"><div class="exp-bar" style="width:${expPct}%"></div></div>
        </div>

        <div class="detail-stats">
          <div class="stat-box"><span>❤️ HP</span><strong>${stats.hp.toLocaleString()}</strong></div>
          <div class="stat-box"><span>⚔️ 攻撃</span><strong>${stats.atk.toLocaleString()}</strong></div>
          <div class="stat-box"><span>🛡️ 防御</span><strong>${stats.def.toLocaleString()}</strong></div>
          <div class="stat-box"><span>💨 速度</span><strong>${stats.spd}</strong></div>
        </div>

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
              <div class="skill-upgrade-row">${upBtn}</div>
            </div>`;
          }).join('')}
        </div>

        <div class="detail-section">
          <h4 class="section-label">装備</h4>
          ${equipsHtml}
        </div>

        <div class="detail-actions">
          <button class="btn btn-levelup" id="dlv-btn" ${hasCoins?'':'disabled'}>
            ${isAtMaxLv ? `Lv.MAX (${blInfo0.maxLevel})` : `レベルアップ <small>(${lvCost.toLocaleString()}🪙)</small>`}
          </button>
          <button class="btn ${inFm?'btn-remove':'btn-add'}" id="dfm-btn">
            ${inFm ? '編成から外す' : '編成に入れる'}
          </button>
        </div>
        <div class="detail-actions" style="margin-top:8px;">
          ${awakenHtml}
        </div>
        <div class="detail-actions" style="margin-top:8px;">
          ${breakHtml}
        </div>`;

      show('general-detail');

      // 装備スロットをタップ → EquipPicker を開く
      $('detail-body').querySelectorAll('.equip-slot-row[data-slot]').forEach(row => {
        row.addEventListener('click', () => EquipPicker.open(row.dataset.general, row.dataset.slot));
      });

      $('dlv-btn').addEventListener('click', () => {
        const r = Game.levelUpGeneral(gid);
        if (r.success) { updateResourceBar(); this.showDetail(gid); this.renderGrid(); }
      });
      $('dfm-btn').addEventListener('click', () => {
        inFm ? Game.removeFromFormation(gid) : Game.addToFormation(gid);
        this.showDetail(gid);
        this.renderGrid();
        this.renderFormationEditor();
        HomeTab.renderFormation();
      });
      $('daw-btn')?.addEventListener('click', () => {
        const r = Game.awakenGeneral(gid);
        if (r.success) { this.showDetail(gid); this.renderGrid(); }
      });
      $('dbl-btn')?.addEventListener('click', () => {
        const r = Game.breakLimit(gid);
        if (r.success) { this.showDetail(gid); this.renderGrid(); }
        else if (r.reason === 'no_shards') alert(`欠片が不足しています。必要: ${r.needed}個`);
      });

      $('detail-body').querySelectorAll('.btn-skill-up[data-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = Game.upgradeSkill(btn.dataset.gid, Number(btn.dataset.idx));
          if (r.success) { this.showDetail(gid); GachaTab.renderMaterials(); }
          else if (r.reason === 'no_materials') alert('素材が不足しています！');
        });
      });
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ガチャタブ
  // ═══════════════════════════════════════════════════════════════════════════

  const GachaTab = {
    update() {
      const pity = Game.getState().progress.gachaPity;
      $('pity-count') && ($('pity-count').textContent = `天井まで: ${90 - pity}回`);
      this.renderShop();
      this.renderEquipInventory();
      this.renderMaterials();
      this.updateButtons();
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
        alert(`クリスタルが不足しています。必要: ${result.needed}💎`);
        return;
      }
      updateResourceBar();
      this.update();
      GeneralsTab.update();
      HomeTab.renderFormation();
      this.showGachaResult(result.results);
    },

    showGachaResult(results) {
      const el = $('gacha-result-cards');
      el.innerHTML = '';
      results.forEach(({ def, isNew }) => {
        const card = document.createElement('div');
        card.className = `gacha-card rarity-${def.rarity}`;
        card.innerHTML = `
          ${makePortrait(def,'md')}
          <div class="gacha-card-name">${def.name}</div>
          <div class="gacha-card-sub">${isNew ? '🆕 NEW！' : `✨ 欠片 +5`}</div>`;
        el.appendChild(card);
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
        row.innerHTML = `
          <div class="material-chip-inner">
            <span class="mat-emoji">${md.emoji}</span>
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
        row.innerHTML = `
          <span class="equip-emoji">${ed.emoji}</span>
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
          else if (r.reason === 'no_coins') alert(`コインが不足しています。必要: ${r.needed?.toLocaleString()}🪙`);
        });
      });
    },

    renderEquipInventory() {
      const el = $('equip-inventory');
      if (!el) return;
      const equips = Game.getState().inventory.equipment;
      if (equips.length === 0) {
        el.innerHTML = '<p class="empty-msg">装備がありません。バトルで入手しよう！</p>';
        return;
      }
      el.innerHTML = '';
      equips.forEach(inst => {
        const ed = EQUIPMENT_DATA[inst.defId];
        if (!ed) return;
        const div = document.createElement('div');
        div.className = `equip-item rarity-${ed.rarity}`;
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
               🔨 強化 <small>(${enhCost?.toLocaleString()}🪙)</small>
             </button>`;
        const sellBase = { R: 100, SR: 500, SSR: 2000 }[ed.rarity] || 100;
        const sellVal  = Math.floor(sellBase * (1 + inst.enhanceLevel * 0.5));
        const sellLabel = isEquipped
          ? '<span class="sell-equipped">装備中</span>'
          : `<button class="btn-sell" data-iid="${inst.instanceId}">売 ${sellVal.toLocaleString()}🪙</button>`;
        div.innerHTML = `
          <span class="equip-emoji">${ed.emoji}</span>
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
          else if (r.reason === 'no_coins') alert(`コインが不足しています。必要: ${r.needed?.toLocaleString()}🪙`);
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
        row.innerHTML = `
          <span class="picker-emoji">${ed.emoji}</span>
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
        card.innerHTML = `
          <div class="zukan-portrait" style="background:${isOwned ? def.gradient : 'var(--card)'}">
            <span style="font-size:26px;${isOwned ? '' : 'filter:grayscale(1) opacity(.3)'}">
              ${def.emoji}
            </span>
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

    // 放置報酬受取
    $('collect-btn')?.addEventListener('click', () => {
      Game.collectIdleReward();
      hide('idle-reward');
      updateResourceBar();
      HomeTab.update();
    });

    // 保存
    $('save-btn')?.addEventListener('click', () => {
      if (Game.save()) showTemp('save-confirm', 2000);
    });

    // バトル結果閉じる
    $('result-close')?.addEventListener('click', () => hide('battle-result'));

    // 章タブ（data-chapter / data-boss で判定）
    document.querySelectorAll('.chapter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.boss) {
          AdventureTab.isBossTab = true;
          AdventureTab.renderBossSection();
        } else {
          AdventureTab.isBossTab = false;
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

    // ─── クラウド設定 ────────────────────────────────────────────────────────
    $('btn-cloud-settings')?.addEventListener('click', () => CloudModal.open());
    $('cloud-close-btn')?.addEventListener('click',   () => hide('cloud-modal'));
    $('cloud-modal')?.addEventListener('click', e => {
      if (e.target === $('cloud-modal')) hide('cloud-modal');
    });
    $('cloud-save-btn')?.addEventListener('click',  () => CloudModal.saveConfig());
    $('cloud-test-btn')?.addEventListener('click',  () => CloudModal.testConnection());
    $('cloud-pull-btn')?.addEventListener('click',  () => CloudModal.pullData());
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
  // クラウド設定モーダル
  // ═══════════════════════════════════════════════════════════════════════════

  const CloudModal = {
    open() {
      const cfg = Storage.getConfig();
      $('cloud-endpoint').value  = cfg.endpoint  || '';
      $('cloud-playerid').value  = cfg.playerId  || '';
      $('cloud-status').textContent = '';
      $('cloud-status').className   = 'cloud-status';
      show('cloud-modal');
    },

    saveConfig() {
      const endpoint = $('cloud-endpoint').value.trim();
      const playerId = $('cloud-playerid').value.trim();
      if (!endpoint || !playerId) {
        this.setStatus('URLとプレイヤーIDを入力してください', 'err'); return;
      }
      Storage.setConfig(endpoint, playerId);
      $('btn-cloud-settings').classList.add('connected');
      this.setStatus('✓ 設定を保存しました', 'ok');
      // 現在のセーブをクラウドに即バックアップ
      Storage.save(Game.getState());
    },

    async testConnection() {
      const endpoint = $('cloud-endpoint').value.trim();
      if (!endpoint) { this.setStatus('URLを入力してください', 'err'); return; }
      this.setStatus('🔌 接続確認中…', 'info');
      const ok = await Storage.ping(endpoint);
      this.setStatus(ok ? '✓ 接続成功！' : '✗ 接続失敗（URLを確認してください）', ok ? 'ok' : 'err');
    },

    async pullData() {
      const endpoint = $('cloud-endpoint').value.trim();
      const playerId = $('cloud-playerid').value.trim();
      if (!endpoint || !playerId) {
        this.setStatus('URLとプレイヤーIDを入力してください', 'err'); return;
      }
      Storage.setConfig(endpoint, playerId);
      this.setStatus('📥 クラウドから読み込み中…', 'info');
      const data = await Storage.pullFromCloud();
      if (data) {
        Game.init(data);
        updateResourceBar();
        HomeTab.update();
        hide('cloud-modal');
        switchTab('home');
        this.setStatus('✓ クラウドデータを反映しました', 'ok');
      } else {
        this.setStatus('クラウドにデータが見つかりませんでした', 'err');
      }
    },

    setStatus(msg, type = '') {
      const el = $('cloud-status');
      el.textContent = msg;
      el.className = `cloud-status ${type}`;
    }
  };

  // ─── 起動 ────────────────────────────────────────────────────────────────

  function start() {
    const idleEarned = Game.init(Storage.load());
    bindEvents();

    runLoadingAnimation(() => {
      $('screen-loading')?.classList.remove('active');
      $('screen-game')?.classList.add('active');

      updateResourceBar();
      HomeTab.update();

      if (Storage.isConfigured()) {
        $('btn-cloud-settings')?.classList.add('connected');
      }

      BGM.init();  // 最初のクリックで自動起動

      if (idleEarned > 0) {
        $('idle-reward-text').textContent = `🪙 ${idleEarned.toLocaleString()} コインを集めておいたよ！`;
        show('idle-reward');
      }
    });
  }

  return { start };
})();

document.addEventListener('DOMContentLoaded', UI.start);
