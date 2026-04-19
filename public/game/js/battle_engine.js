/**
 * battle_engine.js — 自動戦闘計算エンジン
 *
 * ゲーム状態・UIに非依存の純粋な計算モジュール。
 * simulate() にチームと敵を渡すと結果とログを返す。
 */
const BattleEngine = (() => {

  const MAX_TURNS = 120;

  // ─── ダメージ計算 ──────────────────────────────────────────────────────────

  function calcDamage(atk, def, power = 1.0) {
    // 防御軽減: def / (def + 500) が軽減率（上限80%）
    const reduction = Math.min(0.8, def / (def + 500));
    const base = atk * power * (1 - reduction);
    const variance = 0.9 + Math.random() * 0.2; // ±10%
    return Math.max(1, Math.floor(base * variance));
  }

  function calcHeal(atk, power = 1.0) {
    return Math.floor(atk * power * (0.9 + Math.random() * 0.2));
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
        const dmg = calcDamage(actor.stats.atk, target.stats.def, skill.power);
        target.currentHp -= dmg;
        log.push({ type: 'skill', text: `✨ ${aName}の【${skill.name}】！ ${target.name}に ${fmtN(dmg)} の大ダメージ！`, dmg, isSkill: true });
        if (target.currentHp <= 0) log.push({ type: 'defeat', text: `💀 ${target.name}が倒れた！`, isEnemy: target.isEnemy });
        break;
      }

      case 'damage_all': {
        log.push({ type: 'skill', text: `💥 ${aName}の【${skill.name}】！ 全体攻撃！`, isSkill: true });
        enemies.forEach(t => {
          const dmg = calcDamage(actor.stats.atk, t.stats.def, skill.power);
          t.currentHp -= dmg;
          log.push({ type: 'aoe', text: `  → ${t.name}に ${fmtN(dmg)} ダメージ！`, dmg });
          if (t.currentHp <= 0) log.push({ type: 'defeat', text: `💀 ${t.name}が倒れた！`, isEnemy: t.isEnemy });
        });
        break;
      }

      case 'damage_multi': {
        const target = enemies[Math.floor(Math.random() * enemies.length)];
        let total = 0;
        const hits = skill.hits || 3;
        for (let i = 0; i < hits; i++) {
          const dmg = calcDamage(actor.stats.atk, target.stats.def, skill.power);
          target.currentHp -= dmg;
          total += dmg;
        }
        log.push({ type: 'skill', text: `⚡ ${aName}の【${skill.name}】！ ${hits}連撃で計 ${fmtN(total)} ダメージ！`, dmg: total, isSkill: true });
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
        // 防御バフ: 簡易実装（DEFを一時的に1.3倍）
        allies.forEach(a => { a.stats.def = Math.floor(a.stats.def * 1.3); });
        log.push({ type: 'skill', text: `🛡️ ${aName}の【${skill.name}】！ 全体の防御力が上がった！`, isSkill: true });
        break;
      }

      case 'defense_buff': {
        actor.stats.def = Math.floor(actor.stats.def * (1 + skill.power));
        log.push({ type: 'skill', text: `🛡️ ${aName}の【${skill.name}】！ 防御力が大きく上がった！`, isSkill: true });
        break;
      }

      case 'atk_buff': {
        actor.stats.atk = Math.floor(actor.stats.atk * (1 + skill.power));
        log.push({ type: 'skill', text: `💢 ${aName}の【${skill.name}】！ 攻撃力が上がった！`, isSkill: true });
        break;
      }

      case 'atk_down': {
        // 敵全体の攻撃力を下げる
        enemies.forEach(e => { e.stats.atk = Math.floor(e.stats.atk * (1 - skill.power)); });
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

    for (let turn = 0; turn < MAX_TURNS; turn++) {

      const alive = fighters.filter(f => f.currentHp > 0);
      const aliveTeam    = alive.filter(f => !f.isEnemy);
      const aliveEnemies = alive.filter(f =>  f.isEnemy);

      if (aliveTeam.length === 0) {
        log.push({ type: 'result', text: '⚡ 敗北…' });
        return { win: false, log, turns: turn + 1 };
      }
      if (aliveEnemies.length === 0) {
        log.push({ type: 'result', text: '🎉 勝利！' });
        return { win: true, log, turns: turn + 1 };
      }

      // SPD順に行動
      alive.sort((a, b) => b.stats.spd - a.stats.spd);

      for (const actor of alive) {
        if (actor.currentHp <= 0) continue;

        const enemies = fighters.filter(f => f.isEnemy  !== actor.isEnemy && f.currentHp > 0);
        const allies  = fighters.filter(f => f.isEnemy  === actor.isEnemy && f.currentHp > 0);

        if (enemies.length === 0) break;

        actor.sp += 1;

        // スキル判定（SPが足りれば最初に使えるスキルを発動）
        let acted = false;
        if (actor.skills && actor.skills.length > 0) {
          for (const sk of actor.skills) {
            if (actor.sp >= sk.sp) {
              actor.sp -= sk.sp;
              const skLog = useSkill(actor, sk, enemies, allies);
              log.push(...skLog);
              acted = true;
              break;
            }
          }
        }

        if (!acted) {
          // 通常攻撃
          const target = enemies[Math.floor(Math.random() * enemies.length)];
          const dmg = calcDamage(actor.stats.atk, target.stats.def);
          target.currentHp -= dmg;
          log.push({ type: 'attack', text: `⚔️ ${actor.name}の攻撃！ ${target.name}に ${fmtN(dmg)} ダメージ！`, dmg });
          if (target.currentHp <= 0) {
            log.push({ type: 'defeat', text: `💀 ${target.name}が倒れた！`, isEnemy: target.isEnemy });
          }
        }
      }
    }

    // タイムアウト = 敗北
    log.push({ type: 'result', text: '⏰ 時間切れ…' });
    return { win: false, log, turns: MAX_TURNS };
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

  return { simulate, extractHighlights };
})();
