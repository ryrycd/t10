/* Sound for the Scott Harris deck, all synthesised live (no files):
   - a soft, warm music bed (pads + a quiet plucked arpeggio + sub), well under a speaking voice
   - soft mouse clicks, keyboard ticks and a tiny "OK" chime, scheduled from each beat's cues
   Browsers only allow sound after a click or key on the deck page (F for fullscreen counts).
   S on the deck turns it off and on. If there are no speakers, nothing breaks. */
(function () {
  "use strict";
  const LEVEL = 0.55;
  const MUSIC_VOL = 0.1;  // Nov 18: music bed at 10% of its first level
  const CLICK_VOL = 0.2;  // Nov 18: mouse clicks at 20% of their first level
  let ctx = null, master = null, music = null, sfx = null, clickBus = null, wet = null, noise = null, timer = null;
  let on = true, started = false, nextBar = 0, bar = 0, finale = false;
  const BPM = 88, BEAT = 60 / BPM, BARLEN = BEAT * 4;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  // Cmaj9 · Am9 · Fmaj9 · G6/9 (two bars each)
  const CHORDS = [
    { bass: 36, pad: [55, 60, 64, 71, 74], arp: [72, 76, 79, 83, 86, 79] },
    { bass: 33, pad: [52, 57, 60, 67, 71], arp: [69, 72, 76, 79, 83, 76] },
    { bass: 29, pad: [53, 57, 60, 64, 67], arp: [69, 72, 76, 79, 81, 76] },
    { bass: 31, pad: [55, 59, 62, 64, 69], arp: [71, 74, 76, 79, 83, 76] },
  ];

  function init() {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = on ? LEVEL : 0;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3;
    master.connect(comp); comp.connect(ctx.destination);
    music = ctx.createGain(); music.gain.value = 0; music.connect(master);
    sfx = ctx.createGain(); sfx.gain.value = 1; sfx.connect(master);
    clickBus = ctx.createGain(); clickBus.gain.value = CLICK_VOL; clickBus.connect(sfx);
    const len = Math.floor(ctx.sampleRate * 2.6), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0; for (let i = 0; i < len; i++) { const t = i / len; lp += 0.25 * ((Math.random() * 2 - 1) - lp); d[i] = lp * Math.pow(1 - t, 2.6); } }
    const conv = ctx.createConvolver(); conv.buffer = ir;
    wet = ctx.createGain(); wet.gain.value = 0.7; wet.connect(conv); conv.connect(master);
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const nd = noise.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  }

  // ---------------- music ----------------
  function pad(t, m, dur, g) {
    const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700; f.Q.value = 0.4;
    f.frequency.setValueAtTime(500, t); f.frequency.linearRampToValueAtTime(1100, t + dur * 0.5); f.frequency.linearRampToValueAtTime(600, t + dur);
    const e = ctx.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g, t + 1.6); e.gain.setValueAtTime(g, t + dur - 0.2); e.gain.linearRampToValueAtTime(0.0001, t + dur + 1.8);
    for (const det of [-7, 6]) { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = hz(m); o.detune.value = det; o.connect(f); o.start(t); o.stop(t + dur + 2); }
    f.connect(e); e.connect(music); const s = ctx.createGain(); s.gain.value = 0.5 * MUSIC_VOL; e.connect(s); s.connect(wet);
  }
  function pluck(t, m, g) {
    const o = ctx.createOscillator(), o2 = ctx.createOscillator(), e = ctx.createGain();
    o.type = "sine"; o.frequency.value = hz(m); o2.type = "sine"; o2.frequency.value = hz(m) * 4.01;
    const e2 = ctx.createGain(); e2.gain.value = 0.12; o2.connect(e2); e2.connect(e); o.connect(e);
    e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(g, t + 0.006); e.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
    e.connect(music); const s = ctx.createGain(); s.gain.value = 0.9 * MUSIC_VOL; e.connect(s); s.connect(wet);
    o.start(t); o2.start(t); o.stop(t + 1.2); o2.stop(t + 1.2);
  }
  function sub(t, m, dur, g) {
    const o = ctx.createOscillator(), e = ctx.createGain(); o.type = "sine"; o.frequency.value = hz(m + 12);
    e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g, t + 0.4); e.gain.setValueAtTime(g, t + dur - 0.3); e.gain.linearRampToValueAtTime(0.0001, t + dur + 0.3);
    o.connect(e); e.connect(music); o.start(t); o.stop(t + dur + 0.4);
  }
  function scheduleBar(t, i) {
    const ch = CHORDS[Math.floor(i / 2) % CHORDS.length];
    if (i % 2 === 0) { for (const m of ch.pad) pad(t, m, BARLEN * 2, 0.018); sub(t, ch.bass, BARLEN * 2, 0.07); }
    // a sparse, gentle arpeggio: 8ths with gaps, quieter on the off-beats
    const pat = finale ? [0, 1, 2, 3, 4, 5, 4, 2] : [0, -1, 2, -1, 4, -1, 2, 5];
    pat.forEach((n, j) => { if (n >= 0) pluck(t + j * BEAT / 2, ch.arp[n % ch.arp.length], j % 2 ? 0.035 : 0.05); });
  }
  function tick() {
    if (!ctx) return;
    while (nextBar < ctx.currentTime + 1.2) { scheduleBar(nextBar, bar++); nextBar += BARLEN; }
  }

  // ---------------- effects ----------------
  function burst(t, freq, q, g, dec, dest = sfx) {
    const s = ctx.createBufferSource(); s.buffer = noise; s.playbackRate.value = 1 + Math.random() * 0.2;
    const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
    const e = ctx.createGain(); e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    s.connect(f); f.connect(e); e.connect(dest); s.start(t, Math.random() * 0.5); s.stop(t + dec + 0.02);
  }
  const FX = {
    click(t) { burst(t, 3800, 2.2, 0.32, 0.018, clickBus); burst(t + 0.065, 3200, 2.2, 0.2, 0.014, clickBus); },
    type(t) { burst(t, 2600 + Math.random() * 900, 1.6, 0.14, 0.02); },
    ok(t) { for (const [f, d] of [[1046.5, 0], [1568, 0.06]]) { const o = ctx.createOscillator(), e = ctx.createGain(); o.type = "sine"; o.frequency.value = f; e.gain.setValueAtTime(0.0001, t + d); e.gain.exponentialRampToValueAtTime(0.045, t + d + 0.008); e.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.5); o.connect(e); e.connect(sfx); const s = ctx.createGain(); s.gain.value = 0.6; e.connect(s); s.connect(wet); o.start(t + d); o.stop(t + d + 0.6); } },
    snap(t) { burst(t, 1500, 1.2, 0.22, 0.05); },
    whoosh(t) { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 0.8; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(2200, t + 0.5); f.frequency.exponentialRampToValueAtTime(600, t + 1.1); const e = ctx.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(0.06, t + 0.45); e.gain.linearRampToValueAtTime(0.0001, t + 1.2); s.connect(f); f.connect(e); e.connect(sfx); s.start(t); s.stop(t + 1.3); },
    swell(t) { // finale: a bright chord bloom
      for (const m of [60, 64, 67, 71, 74, 79]) { const o = ctx.createOscillator(), e = ctx.createGain(); o.type = "triangle"; o.frequency.value = hz(m); e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(0.03, t + 0.25); e.gain.exponentialRampToValueAtTime(0.0001, t + 4); o.connect(e); e.connect(sfx); const s = ctx.createGain(); s.gain.value = 0.8; e.connect(s); s.connect(wet); o.start(t); o.stop(t + 4.1); }
    },
  };

  let pending = [];
  window.SOUND = {
    unlock() {
      init(); if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      if (!started) { started = true; nextBar = ctx.currentTime + 0.1; music.gain.setValueAtTime(0, ctx.currentTime); music.gain.linearRampToValueAtTime(0.85 * MUSIC_VOL, ctx.currentTime + 3); timer = setInterval(tick, 120); tick(); }
    },
    // beat started: play its cues ([t, kind] relative to the click). Every click gets a mouse click.
    beat(b, beatObj) {
      if (!ctx || !started) return;
      for (const id of pending) clearTimeout(id); pending = [];
      const now = ctx.currentTime + 0.02;
      FX.click(now);
      const cues = (beatObj && beatObj.cues) || [];
      for (const [t, kind] of cues) if (FX[kind]) FX[kind](now + t);
      finale = !!(beatObj && beatObj.finale);
      if (finale) music.gain.linearRampToValueAtTime(1.15 * MUSIC_VOL, now + 1.5);
    },
    toggle() { on = !on; if (master) master.gain.setTargetAtTime(on ? LEVEL : 0, ctx.currentTime, 0.05); },
    get on() { return on; },
  };
})();
