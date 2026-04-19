/**
 * idle.js — 放置報酬計算モジュール
 *
 * ゲームロジックから独立した純粋な計算関数群。
 * 時刻とレートを受け取ってコイン数を返すだけ。
 */
const Idle = (() => {
  /** 最大放置時間（分）: 24時間上限 */
  const MAX_IDLE_MINUTES = 24 * 60;

  /** 報酬が発生する最低経過時間（分）: 30秒未満は無視 */
  const MIN_IDLE_MINUTES = 0.5;

  /**
   * 経過時間とレートから獲得コインを計算する
   * @param {string|null} lastTimeISO - 前回計算時刻（ISO8601文字列）
   * @param {number} ratePerMinute - コイン/分 レート
   * @returns {number} 獲得コイン数（整数）
   */
  function calculate(lastTimeISO, ratePerMinute) {
    if (!lastTimeISO || ratePerMinute <= 0) return 0;

    const now = new Date();
    const last = new Date(lastTimeISO);

    // 時刻が未来になっていたら0（時計ずれ対策）
    if (last > now) return 0;

    const minutesPassed = (now - last) / 1000 / 60;

    if (minutesPassed < MIN_IDLE_MINUTES) return 0;

    const capped = Math.min(minutesPassed, MAX_IDLE_MINUTES);
    return Math.floor(capped * ratePerMinute);
  }

  /**
   * キャラとデッキカードからアイドルレートを計算する
   * @param {object} character - キャラ状態 { level, ... }
   * @param {string[]} deck - 装備中カードID配列
   * @param {object} cardDefs - カード定義オブジェクト
   * @returns {number} コイン/分 レート（小数点1桁）
   */
  function getRate(character, deck, cardDefs) {
    let rate = character.level * 1.0;

    deck.forEach(cardId => {
      const def = cardDefs[cardId];
      if (def && def.idleBonus) {
        rate += def.idleBonus;
      }
    });

    return Math.round(rate * 10) / 10;
  }

  /**
   * EXPボーナス倍率を計算する
   * @param {string[]} deck - 装備中カードID配列
   * @param {object} cardDefs - カード定義オブジェクト
   * @returns {number} EXP倍率（例: 1.3 = +30%）
   */
  function getExpBonus(deck, cardDefs) {
    let bonus = 1.0;

    deck.forEach(cardId => {
      const def = cardDefs[cardId];
      if (def && def.expBonus) {
        bonus += def.expBonus;
      }
    });

    return Math.round(bonus * 100) / 100;
  }

  return { calculate, getRate, getExpBonus };
})();
