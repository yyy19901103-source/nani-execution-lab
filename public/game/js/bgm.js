/**
 * bgm.js — Web Audio API による生成BGM
 *
 * 逍遥游風：D短調五音階 / 笛子（dizi）風音色 / 残響 / ループ
 * 外部ファイル不要。完全にブラウザ内で音声合成する。
 */
const BGM = (() => {

  let ctx = null;
  let master = null;
  let reverb = null;
  let muted = false;
  let loopTimer = null;
  let running = false;

  // ─── D短調五音階（D, F, G, A, C） ────────────────────────────────────────
  const NOTE = {
    D3: 146.83, A3: 220.00,
    D4: 293.66, F4: 349.23, G4: 392.00, A4: 440.00, C5: 523.25,
    D5: 587.33, F5: 698.46, G5: 783.99, A5: 880.00, C6: 1046.50,
  };

  // ─── メロディ楽譜 ─────────────────────────────────────────────────────────
  // [周波数, 長さ(秒), 音量(0-1), ギャップ(秒)]
  const PHRASE_A = [
    [NOTE.D4, 0.55, 0.28, 0.05],
    [NOTE.F4, 0.35, 0.24, 0.04],
    [NOTE.G4, 0.60, 0.30, 0.06],
    [NOTE.A4, 0.90, 0.32, 0.10],
    [NOTE.G4, 0.40, 0.26, 0.04],
    [NOTE.F4, 0.30, 0.22, 0.04],
    [NOTE.G4, 1.30, 0.28, 0.20],
    [NOTE.A4, 0.45, 0.26, 0.04],
    [NOTE.C5, 0.45, 0.28, 0.04],
    [NOTE.D5, 0.70, 0.34, 0.08],
    [NOTE.C5, 0.40, 0.28, 0.04],
    [NOTE.A4, 0.35, 0.24, 0.04],
    [NOTE.G4, 0.40, 0.26, 0.04],
    [NOTE.A4, 1.80, 0.30, 0.30],
  ];

  const PHRASE_B = [
    [NOTE.D5, 0.55, 0.32, 0.06],
    [NOTE.C5, 0.35, 0.26, 0.04],
    [NOTE.A4, 0.45, 0.28, 0.04],
    [NOTE.G4, 0.35, 0.24, 0.04],
    [NOTE.F4, 0.55, 0.26, 0.06],
    [NOTE.G4, 0.45, 0.28, 0.04],
    [NOTE.A4, 1.00, 0.30, 0.15],
    [NOTE.G4, 0.40, 0.24, 0.04],
    [NOTE.F4, 0.35, 0.22, 0.04],
    [NOTE.D4, 0.60, 0.26, 0.06],
    [NOTE.F4, 0.40, 0.24, 0.04],
    [NOTE.G4, 0.35, 0.26, 0.04],
    [NOTE.A4, 0.45, 0.28, 0.04],
    [NOTE.D4, 2.20, 0.28, 0.40],
  ];

  const FULL_MELODY = [...PHRASE_A, ...PHRASE_B];

  // ─── リバーブ（ディレイ網） ───────────────────────────────────────────────

  function buildReverb() {
    const wet = ctx.createGain();
    wet.gain.value = 0.35;

    const delays = [0.22, 0.38, 0.55];
    const fbs    = [0.28, 0.22, 0.18];

    delays.forEach((dt, i) => {
      const d  = ctx.createDelay(2.0);
      const fb = ctx.createGain();
      const lp = ctx.createBiquadFilter();
      d.delayTime.value = dt;
      fb.gain.value     = fbs[i];
      lp.type           = 'lowpass';
      lp.frequency.value = 2800;
      d.connect(lp);
      lp.connect(fb);
      fb.connect(d);
      fb.connect(wet);
      reverb.inputNode.connect(d);
    });

    return wet;
  }

  // ─── 笛子（dizi）音色 ───────────────────────────────────────────────────

  function playDizi(freq, t, dur, vol) {
    // 基音 sine + 2倍音で笛らしさ
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const noiseBuffer = makeNoiseBuffer(dur);
    const noiseSource = ctx.createBufferSource();
    const noiseFilt   = ctx.createBiquadFilter();
    const env         = ctx.createGain();
    const harm2Gain   = ctx.createGain();
    const noiseGain   = ctx.createGain();

    // バイブラート LFO（音が出て0.2秒後から）
    const lfo     = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value   = 5.2;
    lfoGain.gain.setValueAtTime(0,   t);
    lfoGain.gain.linearRampToValueAtTime(0,     t + 0.18);
    lfoGain.gain.linearRampToValueAtTime(freq * 0.012, t + 0.35);
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);

    osc1.type      = 'sine';
    osc1.frequency.value = freq;
    osc2.type      = 'sine';
    osc2.frequency.value = freq * 2.01;
    harm2Gain.gain.value = 0.12;

    // ブレスノイズ（高域ノイズを極小音量で）
    noiseSource.buffer = noiseBuffer;
    noiseFilt.type     = 'bandpass';
    noiseFilt.frequency.value  = freq * 3.5;
    noiseFilt.Q.value          = 0.8;
    noiseGain.gain.value       = 0.025;

    // エンベロープ
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(vol, t + 0.07);
    env.gain.linearRampToValueAtTime(vol * 0.88, t + 0.25);
    env.gain.setValueAtTime(vol * 0.88, t + dur - 0.18);
    env.gain.linearRampToValueAtTime(0, t + dur);

    osc1.connect(env);
    osc2.connect(harm2Gain);
    harm2Gain.connect(env);
    noiseSource.connect(noiseFilt);
    noiseFilt.connect(noiseGain);
    noiseGain.connect(env);
    env.connect(master);
    env.connect(reverb.inputNode);

    osc1.start(t); osc2.start(t); lfo.start(t); noiseSource.start(t);
    osc1.stop(t + dur + 0.05); osc2.stop(t + dur + 0.05);
    lfo.stop(t + dur + 0.05); noiseSource.stop(t + dur + 0.05);
  }

  // ─── ドローン（低音持続） ────────────────────────────────────────────────

  function playDrone(t, dur) {
    [NOTE.D3, NOTE.A3].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      const lp  = ctx.createBiquadFilter();
      osc.type  = 'sawtooth';
      osc.frequency.value = freq;
      lp.type   = 'lowpass';
      lp.frequency.value = 300;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(i === 0 ? 0.06 : 0.03, t + 2.0);
      g.gain.setValueAtTime(i === 0 ? 0.06 : 0.03, t + dur - 2.0);
      g.gain.linearRampToValueAtTime(0, t + dur);
      osc.connect(lp); lp.connect(g); g.connect(master);
      osc.start(t); osc.stop(t + dur);
    });
  }

  // ─── 鑼（ゴング）アクセント ─────────────────────────────────────────────

  function playGong(t) {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type  = 'sine';
    osc.frequency.setValueAtTime(NOTE.D3 * 1.5, t);
    osc.frequency.exponentialRampToValueAtTime(NOTE.D3 * 1.2, t + 0.8);
    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 4.5);
    osc.connect(g);
    g.connect(master);
    g.connect(reverb.inputNode);
    osc.start(t); osc.stop(t + 5);
  }

  // ─── ノイズバッファ ──────────────────────────────────────────────────────

  function makeNoiseBuffer(dur) {
    const len    = Math.ceil(ctx.sampleRate * dur);
    const buf    = ctx.createBuffer(1, len, ctx.sampleRate);
    const data   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1);
    return buf;
  }

  // ─── 1ループ再生 ─────────────────────────────────────────────────────────

  function playLoop() {
    if (!running) return;

    let t = ctx.currentTime + 0.15;
    const loopStart = t;

    // メロディ長さ計算
    let melodySec = FULL_MELODY.reduce((s, n) => s + n[1] + n[3], 0);

    playDrone(loopStart, melodySec + 1.0);
    playGong(loopStart);

    FULL_MELODY.forEach(([freq, dur, vol, gap]) => {
      playDizi(freq, t, dur, vol);
      t += dur + (gap ?? 0.05);
    });

    // ループスケジュール（フェードで繋ぐ）
    loopTimer = setTimeout(playLoop, (melodySec - 0.3) * 1000);
  }

  // ─── 公開API ─────────────────────────────────────────────────────────────

  function init() {
    // 自動起動しない。🔊ボタンから手動で start() を呼ぶ。
  }

  function start() {
    if (running) return;

    ctx    = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.72;
    master.connect(ctx.destination);

    // リバーブ接続用ノード
    reverb = { inputNode: ctx.createGain() };
    reverb.inputNode.gain.value = 1.0;
    const wetOut = buildReverb();
    wetOut.connect(master);

    running = true;
    playLoop();
  }

  function toggle() {
    muted = !muted;
    if (master) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(muted ? 0 : 0.72, ctx.currentTime + 0.4);
    }
    return muted;
  }

  function isMuted()   { return muted; }
  function isRunning() { return running; }

  return { init, start, toggle, isMuted, isRunning };
})();
