/**
 * image_loader.js — キャラ画像 高品質表示ヘルパー
 *
 * 機能:
 *   - <picture> 要素で hires / 標準 / thumb / PNG fallback を出し分け
 *   - 表示サイズ(size)に応じた最適画像選択
 *   - 高DPI画面の自動対応
 *   - 画像未配置時の emoji + グラデーションフォールバック
 *
 * 使い方:
 *   ImageLoader.character(charId, 'hero')   // Hero View 用 (hires)
 *   ImageLoader.character(charId, 'card')   // 一覧カード用 (標準)
 *   ImageLoader.character(charId, 'thumb')  // サムネ用
 *
 *   // <img> 単体（背景画像など）：
 *   ImageLoader.charImage(charId, 'hero')
 */
(() => {
  const BASE = 'assets/characters';

  /** size → 推奨画像情報 */
  const SIZE_MAP = {
    hero:  { primary: 'hires',  secondary: '',       thumb: false, lazy: false },
    card:  { primary: '',       secondary: 'thumbs', thumb: false, lazy: true  },
    thumb: { primary: 'thumbs', secondary: '',       thumb: true,  lazy: true  },
  };

  /**
   * <picture> HTML を生成
   * @param {string} charId
   * @param {'hero'|'card'|'thumb'} size
   * @param {object} opts - { alt, className, eager, withFallback }
   */
  function picture(charId, size = 'card', opts = {}) {
    const cfg = SIZE_MAP[size] || SIZE_MAP.card;
    const alt = opts.alt || '';
    const className = opts.className || 'character-art';
    const loading = (opts.eager === true || cfg.lazy === false) ? 'eager' : 'lazy';
    const decoding = 'async';

    // ソース候補
    const hiresWebp = `${BASE}/hires/${charId}.webp`;
    const stdWebp   = `${BASE}/${charId}.webp`;
    const thumbWebp = `${BASE}/thumbs/${charId}.webp`;
    const pngFallback = `${BASE}/${charId}.png`;

    let srcsetParts = [];
    if (size === 'hero') {
      srcsetParts.push(`<source type="image/webp" srcset="${hiresWebp}">`);
      srcsetParts.push(`<source type="image/webp" srcset="${stdWebp}">`);
    } else if (size === 'card') {
      // カード: 標準WebP（DPR2なら hires に切替で効果あり）
      srcsetParts.push(`<source type="image/webp" media="(min-resolution: 2dppx)" srcset="${hiresWebp}">`);
      srcsetParts.push(`<source type="image/webp" srcset="${stdWebp}">`);
      srcsetParts.push(`<source type="image/webp" srcset="${thumbWebp}">`);
    } else { // thumb
      srcsetParts.push(`<source type="image/webp" media="(min-resolution: 2dppx)" srcset="${stdWebp}">`);
      srcsetParts.push(`<source type="image/webp" srcset="${thumbWebp}">`);
    }

    // <img> フォールバック（PNG）
    const errHandler = opts.withFallback !== false
      ? `if(!this.dataset.fb){this.dataset.fb='1';this.src='${pngFallback}';}else{this.style.opacity='0';}`
      : '';

    const initialSrc = size === 'hero' ? hiresWebp
                     : size === 'card' ? stdWebp
                     : thumbWebp;

    return `<picture class="${className}">
      ${srcsetParts.join('\n      ')}
      <img src="${initialSrc}" alt="${escapeHtml(alt)}"
           loading="${loading}" decoding="${decoding}"
           onload="this.classList.add('loaded')"
           ${errHandler ? `onerror="${errHandler}"` : ''}>
    </picture>`;
  }

  /**
   * 単純な <img> URL を返す（背景画像 url() 用や img 単体表示）
   */
  function charImage(charId, size = 'card') {
    if (size === 'hero')  return `${BASE}/hires/${charId}.webp`;
    if (size === 'thumb') return `${BASE}/thumbs/${charId}.webp`;
    return `${BASE}/${charId}.webp`;
  }

  /** PNG フォールバックURL */
  function charImagePng(charId) {
    return `${BASE}/${charId}.png`;
  }

  /** onerror チェーン（background-image 用は手動で書く必要あり） */
  function imgErrorHandler(charId) {
    const png = charImagePng(charId);
    return `if(!this.dataset.fb){this.dataset.fb='1';this.src='${png}';}else{this.style.opacity='0';}`;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  /** 画像プリロード（Hero Zoneの次キャラ先読み等） */
  function preload(charId, size = 'hero') {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = charImage(charId, size);
    });
  }

  // グローバルエクスポート
  window.ImageLoader = {
    picture,
    charImage,
    charImagePng,
    imgErrorHandler,
    preload,
  };
})();
