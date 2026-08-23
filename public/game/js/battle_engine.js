/**
 * battle_engine.js — 自動戦闘計算エンジン
 *
 * ゲーム状態・UIに非依存の純粋な計算モジュール。
 * simulate() にチームと敵を渡すと結果とログを返す。
 */
const BattleEngine = (() => {

  const MAX_TURNS = 60; // ③ 短縮: 120→60（長期膠着防止）

  // ─── 属性相性テーブル ────────────────────────────────────────────────────────
  // キー: 攻撃側属性 → 配列: 弱点となる防御側属性
  const ELEMENT_WEAKNESS = {
    '炎': ['氷', '森', '甘'],
    '氷': ['雷', '炎'],
    '雷': ['水', '鉄'],
    '水': ['炎', '土'],
    '光': ['闇', '影'],
    '闇': ['月', '光'],
    '月': ['闇', '影'],
    '風': ['土', '森'],
    '土': ['雷', '風'],
    '鉄': ['水', '炎'],
    '森': ['炎', '氷'],
    '影': ['光', '月'],
    '夢': ['闇', '影'],
    '甘': ['炎', '氷'],
  };
  const ELEM_BONUS   = 1.40;  // 弱点時ダメージ倍率
  const ELEM_RESIST  = 0.72;  // 耐性時ダメージ倍率

  /** 属性相性倍率を返す。弱点=1.4、耐性=0.72、それ以外=1.0 */
  function getElemMult(atkElem, defElem) {
    if (!atkElem || !defElem) return 1.0;
    const weakTo = ELEMENT_WEAKNESS[atkElem] || [];
    if (weakTo.includes(defElem)) return ELEM_BONUS;
    // 逆方向（防御側が攻撃側の弱点）= 耐性
    const defWeak = ELEMENT_WEAKNESS[defElem] || [];
    if (defWeak.includes(atkElem)) return ELEM_RESIST;
    return 1.0;
  }

  // ─── ダメージ計算 ──────────────────────────────────────────────────────────

  function calcDamage(atk, def, power = 1.0, atkElem, defElem) {
    // 防御軽減: def / (def + 500) が軽減率（上限80%）
    const reduction = Math.min(0.8, def / (def + 500));
    const elemMult = getElemMult(atkElem, defElem);
    const base = atk * power * (1 - reduction) * elemMult;
    const variance = 0.9 + Math.random() * 0.2; // ±10%
    return Math.max(1, Math.floor(base * variance));
  }

  /** クリティカル込みダメージ計算。{ dmg, isCrit } を返す */
  function calcDmgCrit(atk, def, power, atkElem, defElem, critRate) {
    const isCrit = Math.random() < (critRate || 0.05);
    const dmg = calcDamage(atk, def, power * (isCrit ? 1.75 : 1.0), atkElem, defElem);
    return { dmg, isCrit };
  }

  function isWeakness(atkElem, defElem) {
    if (!atkElem || !defElem) return false;
    return (ELEMENT_WEAKNESS[atkElem] || []).includes(defElem);
  }

  function calcHeal(atk, power = 1.0) {
    return Math.floor(atk * power * (0.9 + Math.random() * 0.2));
  }

  // ─── ① スキル発動条件チェック ────────────────────────────────────────────
  /**
   * スキルを今使うべきか判断する（無駄打ち防止）
   * - 回復系: 誰かが HP 80% 未満の時のみ
   * - バフ系: バトル中1回のみ（actor._atkBuffed / _defBuffed フラグで管理）
   * - デバフ系: 敵に未適用の時のみ（actor._atkDownUsed フラグ）
   * - ダメージ系: 常時OK
   */
  function shouldUseSkill(actor, sk, allies) {
    const t = sk.type || '';

    // 回復系 — 誰かがHP80%以下の時だけ
    if (t === 'heal_single' || t === 'heal_all') {
      const minRatio = Math.min(...allies.map(a => a.currentHp / a.stats.hp));
      return minRatio < 0.80;
    }

    // 攻撃バフ — 1回のみ
    if (t === 'atk_buff') {
      if (actor._atkBuffed) return false;
      return true; // フラグは useSkill 内で立てる
    }

    // 防御バフ・全体シールド — 1回のみ
    if (t === 'defense_buff' || t === 'shield_all') {
      if (actor._defBuffed) return false;
      return true;
    }

    // 敵デバフ（攻撃力低下）— 1回のみ
    if (t === 'atk_down') {
      if (actor._atkDownUsed) return false;
      return true;
    }

    // ダメージ系・その他は常時OK
    return true;
  }

  // ─── スキル実行 ──────────────────────────────────────────────────────────

  /**
   * スキルを使用し、ログを返す
   * @param {object} actor - 行動者
   * @param {object} skill - スキル定義
   * @param {Array}  enemies - 敵リスト（生存のみ）
   * @param {Array}  allies  - 味方リスト（生存のみ）
   * @returns {Array} ログエントリ配列
   */
  function useSkill(actor, skill, enemies, allies) {
    const log = [];
    const aName = actor.name;

    switch (skill.type) {

      case 'damage_single': {
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        const cr = actor.critRate || 0.05;
        const { dmg, isCrit } = calcDmgCrit(actor.stats.atk, target.stats.def, skill.power, actor.element, target.element, cr);
        target.currentHp -= dmg;
        const weakTag = isWeakness(actor.element, target.element) ? ' 🔥弱点！' : '';
        const critTag = isCrit ? ' ✨暴撃！' : '';
        log.push({ type: 'skill', text: `✨ ${aName}の【${skill.name}】！ ${target.name}に ${fmtN(dmg)} の大ダメージ！${weakTag}${critTag}`, dmg, isSkill: true });
        if (target.currentHp <= 0) log.push({ type: 'defeat', text: `💀 ${target.name}が倒れた！`, isEnemy: target.isEnemy });
        break;
      }

      case 'damage_all': {
        const cr = actor.critRate || 0.05;
        log.push({ type: 'skill', text: `💥 ${aName}の【${skill.name}】！ 全体攻撃！`, isSkill: true });
        enemies.forEach(t => {
          const { dmg, isCrit } = calcDmgCrit(actor.stats.atk, t.stats.def, skill.power, actor.element, t.element, cr);
          t.currentHp -= dmg;
          const wt = isWeakness(actor.element, t.element) ? ' 🔥弱点！' : '';
          const ct = isCrit ? ' ✨暴撃！' : '';
          log.push({ type: 'aoe', text: `  → ${t.name}に ${fmtN(dmg)} ダメージ！${wt}${ct}`, dmg });
          if (t.currentHp <= 0) log.push({ type: 'defeat', text: `💀 ${t.name}が倒れた！`, isEnemy: t.isEnemy });
        });
        break;
      }

      case 'damage_multi': {
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        const cr = actor.critRate || 0.05;
        let total = 0; let critHits = 0;
        const hits = skill.hits || 3;
        for (let i = 0; i < hits; i++) {
          const { dmg, isCrit } = calcDmgCrit(actor.stats.atk, target.stats.def, skill.power, actor.element, target.element, cr);
          target.currentHp -= dmg;
          total += dmg;
          if (isCrit) critHits++;
        }
        const wt = isWeakness(actor.element, target.element) ? ' 🔥弱点！' : '';
        const ct = critHits > 0 ? ` ✨暴撃${critHits}回！` : '';
        log.push({ type: 'skill', text: `⚡ ${aName}の【${skill.name}】！ ${hits}連撃で計 ${fmtN(total)} ダメージ！${wt}${ct}`, dmg: total, isSkill: true });
        if (target.currentHp <= 0) log.push({ type: 'defeat', text: `💀 ${target.name}が倒れた！`, isEnemy: target.isEnemy });
        break;
      }

      case 'heal_single': {
        const weakest = allies.slice().sort((a, b) => (a.currentHp / a.stats.hp) - (b.currentHp / b.stats.hp))[0];
        const heal = calcHeal(actor.stats.atk, skill.power);
        weakest.currentHp = Math.min(weakest.stats.hp, weakest.currentHp + heal);
        log.push({ type: 'skill', text: `💚 ${aName}の【${skill.name}】！ ${weakest.name}のHPを ${fmtN(heal)} 回復！`, isSkill: true });
        break;
      }

      case 'heal_all': {
        log.push({ type: 'skill', text: `💚 ${aName}の【${skill.name}】！ 全体のHPを回復！`, isSkill: true });
        allies.forEach(a => {
          const heal = calcHeal(actor.stats.atk, skill.power);
          a.currentHp = Math.min(a.stats.hp, a.currentHp + heal);
        });
        break;
      }

      case 'shield_all': {
        allies.forEach(a => { a.stats.def = Math.floor(a.stats.def * 1.3); });
        actor._defBuffed = true; // ① バフ使用フラグ
        log.push({ type: 'skill', text: `🛡️ ${aName}の【${skill.name}】！ 全体の防御力が上がった！`, isSkill: true });
        break;
      }

      case 'defense_buff': {
        actor.stats.def = Math.floor(actor.stats.def * (1 + skill.power));
        actor._defBuffed = true; // ① バフ使用フラグ
        log.push({ type: 'skill', text: `🛡️ ${aName}の【${skill.name}】！ 防御力が大きく上がった！`, isSkill: true });
        break;
      }

      case 'atk_buff': {
        actor.stats.atk = Math.floor(actor.stats.atk * (1 + skill.power));
        actor._atkBuffed = true; // ① バフ使用フラグ
        log.push({ type: 'skill', text: `💢 ${aName}の【${skill.name}】！ 攻撃力が上がった！`, isSkill: true });
        break;
      }

      case 'atk_down': {
        enemies.forEach(e => { e.stats.atk = Math.floor(e.stats.atk * (1 - skill.power)); });
        actor._atkDownUsed = true; // ① デバフ使用フラグ
        log.push({ type: 'skill', text: `🌀 ${aName}の【${skill.name}】！ 敵全体の攻撃力が下がった！`, isSkill: true });
        break;
      }

      case 'drain': {
        // 吸収攻撃
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        const dmg = calcDamage(actor.stats.atk, target.stats.def, skill.power);
        target.currentHp -= dmg;
        actor.currentHp = Math.min(actor.stats.hp, actor.currentHp + Math.floor(dmg * 0.4));
        log.push({ type: 'skill', text: `🩸 ${aName}の【${skill.name}】！ ${target.name}から ${fmtN(dmg)} 吸収！`, dmg, isSkill: true });
        if (target.currentHp <= 0) log.push({ type: 'defeat', text: `💀 ${target.name}が倒れた！`, isEnemy: target.isEnemy });
        break;
      }

      default: {
        // 未定義スキルは通常攻撃扱い
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        const dmg = calcDamage(actor.stats.atk, target.stats.def);
        target.currentHp -= dmg;
        log.push({ type: 'skill', text: `⚡ ${aName}の【${skill.name}】！ ${target.name}に ${fmtN(dmg)} ダメージ！`, dmg, isSkill: true });
        if (target.currentHp <= 0) log.push({ type: 'defeat', text: `💀 ${target.name}が倒れた！`, isEnemy: target.isEnemy });
        break;
      }
    }

    return log;
  }

  // ─── メイン戦闘シミュレーション ─────────────────────────────────────────

  /**
   * @param {Array} teamDefs  - [{ name, emoji, stats, skills, isEnemy: false }]
   * @param {Array} enemyDefs - [{ name, emoji, stats, isEnemy: true }]
   * @returns {{ win: boolean, log: Array, turns: number }}
   */
  function simulate(teamDefs, enemyDefs) {
    const log = [];

    // ファイター初期化
    const fighters = [
      ...teamDefs.map(t => ({
        ...t,
        currentHp: t.stats.hp,
        sp: 0,
        isEnemy: false
      })),
      ...enemyDefs.map(e => ({
        ...e,
        currentHp: e.stats.hp,
        sp: 0,
        isEnemy: true,
        skills: e.skills || []
      }))
    ];

    // ─── 編成ボーナス解析 ─────────────────────────────────────────────────────
    const teamFighters = fighters.filter(f => !f.isEnemy);
    const teamRoles  = new Set(teamFighters.map(f => f.type || ''));
    const teamElems  = teamFighters.map(f => f.element).filter(Boolean);
    const allSameElem = teamElems.length > 1 && teamElems.every(e => e === teamElems[0]);
    const hasTank    = teamRoles.has('tank');
    const hasHealer  = teamRoles.has('healer');
    const hasAttacker = teamRoles.has('attacker') || teamRoles.has('assassin') || teamRoles.has('mage');
    const roleCoverage = (hasTank ? 1 : 0) + (hasHealer ? 1 : 0) + (hasAttacker ? 1 : 0);

    // 同属性ボーナス: チーム全員のATK +15%
    if (allSameElem) {
      teamFighters.forEach(f => { f.stats.atk = Math.floor(f.stats.atk * 1.15); });
      log.push({ type: 'skill', text: `✨ 全員が「${teamElems[0]}」属性！ 属性共鳴 ATK+15%！`, isSkill: true });
    }
    // 役割カバーボーナス (タンク+ヒーラー+アタッカー) → チームATK+10%
    if (roleCoverage >= 3) {
      teamFighters.forEach(f => { f.stats.atk = Math.floor(f.stats.atk * 1.10); });
      log.push({ type: 'skill', text: `⚡ 編成ボーナス！ タンク+回復+攻撃の完璧な布陣 ATK+10%！`, isSkill: true });
    }
    // タンクボーナス: 敵全体のATK -15%（盾役が前衛に立つ）
    if (hasTank) {
      fighters.filter(f => f.isEnemy).forEach(e => { e.stats.atk = Math.floor(e.stats.atk * 0.85); });
      log.push({ type: 'skill', text: `🛡️ タンクが前衛！ 敵の攻撃力が下がった！(-15%)`, isSkill: true });
    }

    for (let turn = 0; turn < MAX_TURNS; turn++) {

      const alive = fighters.filter(f => f.currentHp > 0);
      const aliveTeam    = alive.filter(f => !f.isEnemy);
      const aliveEnemies = alive.filter(f =>  f.isEnemy);

      if (aliveTeam.length === 0) {
        log.push({ type: 'result', text: '⚡ 敗北…' });
        const totalDmg = log.filter(e=>e.dmg && !fighters.find(f=>!f.isEnemy && f.name===e.actorName)).reduce((s,e)=>s+(e.dmg||0),0);
        return { win: false, log, turns: turn + 1, stats: _calcStats(log, fighters) };
      }
      if (aliveEnemies.length === 0) {
        log.push({ type: 'result', text: '🎉 勝利！' });
        return { win: true, log, turns: turn + 1, stats: _calcStats(log, fighters) };
      }

      // SPD順に行動
      alive.sort((a, b) => b.stats.spd - a.stats.spd);

      for (const actor of alive) {
        if (actor.currentHp <= 0) continue;

        const enemies = fighters.filter(f => f.isEnemy  !== actor.isEnemy && f.currentHp > 0);
        const allies  = fighters.filter(f => f.isEnemy  === actor.isEnemy && f.currentHp > 0);

        if (enemies.length === 0) break;

        // ② SPD-SP関係: SPD150以上は+2 SP/行動、それ未満は+1
        actor.sp += 1 + Math.floor(actor.stats.spd / 150);

        // ① スキル判定: SP足りる かつ 発動条件を満たす最初のスキルを実行
        let acted = false;
        if (actor.skills && actor.skills.length > 0) {
          for (const sk of actor.skills) {
            if (actor.sp >= sk.sp && shouldUseSkill(actor, sk, allies)) {
              actor.sp -= sk.sp;
              const skLog = useSkill(actor, sk, enemies, allies);
              log.push(...skLog);
              acted = true;
              break;
            }
          }
        }

        if (!acted) {
          // 通常攻撃（属性相性＋クリティカル考慮）
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const cr = actor.critRate || (actor.isEnemy ? 0.04 : 0.07);
          const { dmg, isCrit } = calcDmgCrit(actor.stats.atk, target.stats.def, 1.0, actor.element, target.element, cr);
          target.currentHp -= dmg;
          const wt = isWeakness(actor.element, target.element) ? ' 🔥弱点！' : '';
          const ct = isCrit ? ' ✨暴撃！' : '';
          log.push({ type: 'attack', text: `⚔️ ${actor.name}の攻撃！ ${target.name}に ${fmtN(dmg)} ダメージ！${wt}${ct}`, dmg, isEnemyAttacker: actor.isEnemy });
          if (target.currentHp <= 0) {
            log.push({ type: 'defeat', text: `💀 ${target.name}が倒れた！`, isEnemy: target.isEnemy });
          }
        }
      }

      // ターン終了: ヒーラー役割ボーナス — HP70%未満の時だけ3%回復（3ターンごと）
      if (hasHealer && turn % 3 === 0) {
        const liveTeam = fighters.filter(f => !f.isEnemy && f.currentHp > 0);
        const minHpRatio = liveTeam.length > 0
          ? Math.min(...liveTeam.map(f => f.currentHp / f.stats.hp))
          : 1;
        if (minHpRatio < 0.70) {
          liveTeam.forEach(f => {
            const heal = Math.floor(f.stats.hp * 0.03);
            f.currentHp = Math.min(f.stats.hp, f.currentHp + heal);
          });
        }
      }
    }

    // タイムアウト = 敗北
    log.push({ type: 'result', text: '⏰ 時間切れ…' });
    return { win: false, log, turns: MAX_TURNS, stats: _calcStats(log, fighters) };
  }

  function _calcStats(log, fighters) {
    let teamDmg = 0, enemyDmg = 0, skillCount = 0, defeatedEnemies = 0;
    log.forEach(e => {
      if (e.type === 'attack' || e.type === 'skill') {
        if (e.isEnemyAttacker) enemyDmg += (e.dmg || 0);
        else teamDmg += (e.dmg || 0);
      }
      if (e.type === 'skill') skillCount++;
      if (e.type === 'defeat' && e.isEnemy) defeatedEnemies++;
    });
    return { teamDmg, enemyDmg, skillCount, defeatedEnemies };
  }

  // ─── ユーティリティ ──────────────────────────────────────────────────────

  function fmtN(n) {
    return n.toLocaleString();
  }

  /**
   * バトルログから見所だけ抽出する（最大 limit 件）
   * - スキル使用行
   * - 撃破行
   * - 最終行（勝利/敗北）
   */
  function extractHighlights(log, limit = 8) {
    const highlights = log.filter(e =>
      e.type === 'skill' || e.type === 'defeat' || e.type === 'result'
    );
    const last = log[log.length - 1];
    const result = highlights.slice(0, limit);
    if (!result.includes(last)) result.push(last);
    return result;
  }

  /**
   * 属性相性情報を返すユーティリティ
   * @param {string} elem キャラの属性
   * @returns {{ strong: string[], weak: string[], resist: string[] }}
   *   strong  = このキャラが攻撃時に+40%ボーナスを得る相手属性
   *   weak    = このキャラが被ダメ時に+40%受けてしまう攻撃属性
   *   resist  = このキャラが被ダメ時に×0.72で軽減できる攻撃属性
   */
  function getElementInfo(elem) {
    if (!elem) return { strong: [], weak: [], resist: [] };
    // 攻撃時ボーナス: 自分の属性が相手の弱点
    const strong = ELEMENT_WEAKNESS[elem] || [];
    // 被ダメ弱点: 相手の属性の弱点リストに自分が含まれる
    const weak = Object.entries(ELEMENT_WEAKNESS)
      .filter(([, v]) => v.includes(elem))
      .map(([k]) => k);
    // 被ダメ耐性: 自分の弱点リストに含まれる属性の攻撃は自分への耐性（逆関係）
    // 炎→氷/森/甘 が弱点なので、氷/森/甘から炎への攻撃は耐性
    const resist = (ELEMENT_WEAKNESS[elem] || []).reduce((acc, defElem) => {
      const defWeak = ELEMENT_WEAKNESS[defElem] || [];
      if (defWeak.includes(elem)) acc.push(defElem); // defElemが炎に弱い = 炎は耐性
      return acc;
    }, []);
    return { strong, weak, resist };
  }

  return { simulate, extractHighlights, getElementInfo };
})();
