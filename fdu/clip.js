/* clip.js — tiny deterministic motion engine for Sync Studio social clips.
   Every frame is a pure function of time: window.seek(t) sets all styles for time t (seconds).
   The renderer (render.py) calls seek(frame/fps) and screenshots each frame.
   In a normal browser, the clip plays in real time (window.play()) for previewing.

   API (inside a composition):
     R                       → "16x9" | "9x16" | "1x1" (from ?r=, default 16x9); W, H = pixel size
     key(el, frames)         → keyframes: [[t, {o, x, y, s, r, blur, cx, rx, ry, z, br}], ...]  (o=opacity, s=scale, r=rotate deg,
                               cx = clip-reveal 0..1 from left, rx/ry = rotateX/Y deg, z = translateZ px (parent needs CSS
                               perspective), br = brightness). Missing props hold their last value. Ease per frame:
                               {e:"out"|"in"|"io"|"lin"|"back"} or the playbook curves "cam"|"enter"|"exit"|"ui"|"expo"|"settle"|"calm"
     bez(x1,y1,x2,y2)        → any cubic-bezier as an ease function; EASE.cam(p) etc. for use inside on()
     on(t0, t1, fn)          → custom per-frame function fn(p, t) with p = 0..1 progress (clamped) for counters etc.
     words(el, t0, step)     → split el text into words that rise in one by one
     dur                     → set window.DURATION (seconds)
     window.WARP             → optional cut-down: [[out0, out1, in0, in1], ...] plays source time in0..in1 during
                               output time out0..out1 (jumps between segments = hard cuts). Set it (and DURATION)
                               when ?cut= asks for a shorter version; cues are remapped by cuesOut().
     window.CUES             → sound cues [[t, type, {opts}], ...] in source time; engine/sfx.py synthesizes them
     spring(t, k, d)         → closed-form damped spring 0 → 1 (presets SNAP, BASE, HEAVY = [k, d]); track(t, [[t, v], ...]) sums
                               one spring per target change; indicator(t, stops, w) stretchy tab underline; swapAlpha(t, tIn, tOut)
                               text inside a morphing box; rng(seed)() seeded noise (never Math.random)

   layout(spec) — one timeline, every format (playbook §7.7). Write scenes against L, never fixed pixels, so 9:16 and 1:1
   are re-laid out (text 1.3–1.4× larger, inside the platform-safe box), never cropped from 16:9:
     const L = layout({"16x9": {head: [120, 380], panel: 1380},     // the 16:9 master's numbers
                       "9x16": {head: [0, 520]},                     // only what differs; 9:16 and 1:1 fall back to 16:9 keys
                       "1x1":  {head: [0, 300], panel: 1000}});
     L.head, L.panel …       → the values for this ratio          L.R, L.W, L.H, L.portrait, L.square
     L.ts                    → text scale vs 16:9: 1 / 1.4 (9:16) / 1.3 (1:1); L.fs(96) → a 16:9 font size scaled for this ratio
     L.safe                  → {l, t, r, b, w, h, cx, cy}: the box text must stay inside (9:16 clears the platform UI)
     L.x(f), L.y(f)          → a fraction (0–1) of the safe box in px;  L.fit(w, h) → scale that fits a w×h group in the box
     L.pick(a16, a9, a1)     → one value per ratio inline;  L.place(el, {left, top, width, height, fontSize}) sets px styles
                               (fontSize is scaled by L.ts). key() x/y take L values the same way: key(el, [[t, {x: L.x(.1)}]]).
   CSS gets --ts and --safe-l/-t/-r/-b on :root (font-size: calc(48px * var(--ts))) and [data-r="9x16"] selectors for overrides.
*/
(function () {
  const q = new URLSearchParams(location.search);
  const R = q.get("r") || "16x9";
  const SIZES = { "16x9": [1920, 1080], "9x16": [1080, 1920], "1x1": [1080, 1080] };
  const [W, H] = SIZES[R] || SIZES["16x9"];
  document.documentElement.style.setProperty("--W", W + "px");
  document.documentElement.style.setProperty("--H", H + "px");
  document.documentElement.dataset.r = R;
  // cubic-bezier(x1,y1,x2,y2) as a pure function of progress (Newton + bisection), for the playbook's named curves
  function bez(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
    return p => {
      if (p <= 0) return 0; if (p >= 1) return 1;
      let t = p;
      for (let i = 0; i < 8; i++) { const e = X(t) - p, d = dX(t); if (Math.abs(e) < 1e-6) return Y(t); if (Math.abs(d) < 1e-6) break; t -= e / d; }
      let lo = 0, hi = 1; t = p;
      for (let i = 0; i < 30; i++) { const x = X(t); if (Math.abs(x - p) < 1e-6) break; if (x < p) lo = t; else hi = t; t = (lo + hi) / 2; }
      return Y(t);
    };
  }
  const EASE = {
    // named curves from 00 Brain/craft/ui-trailer-playbook.md (one meaning each)
    cam: bez(.8, 0, .2, 1),        // camera moves between regions: long soft start and settle
    enter: bez(.05, .7, .1, 1),    // things arriving
    exit: bez(.3, 0, .8, .15),     // things leaving (cut at speed)
    ui: bez(.2, 0, 0, 1),          // UI state A → B
    expo: bez(.16, 1, .3, 1),      // mask-rise type, arrivals
    settle: bez(.22, 1, .36, 1),   // Apple settle orbit (steep 3D → frontal)
    calm: bez(.33, 0, .67, 1),     // slow creeps / drifts
    lin: p => p,
    out: p => 1 - Math.pow(1 - p, 3),
    in: p => p * p * p,
    io: p => (p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    back: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  };
  const tracks = [], fns = [];
  // rx/ry = rotateX/Y deg, z = translateZ px (needs a parent with CSS perspective + transform-style: preserve-3d),
  // br = brightness multiplier (1 = unchanged). 2D transforms are emitted unchanged when all 3D props are 0.
  const DEF = { o: 1, x: 0, y: 0, s: 1, r: 0, blur: 0, cx: 1, rx: 0, ry: 0, z: 0, br: 1 };
  function key(el, frames) {
    if (typeof el === "string") el = document.querySelector(el);
    if (!el) throw new Error("key(): element not found");
    // fill missing props forward so each keyframe is complete
    let last = Object.assign({}, DEF, frames[0][1]);
    const full = frames.map(([t, v]) => { last = Object.assign({}, last, v); return [t, last]; });
    tracks.push({ el, full });
  }
  function on(t0, t1, fn) { fns.push({ t0, t1, fn }); }
  function words(el, t0, step = 0.09, rise = 26, dur = 0.45) {
    // wraps every word (also inside nested elements like <em>) in an inline-block span that rises in
    if (typeof el === "string") el = document.querySelector(el);
    const spans = [];
    (function wrap(node) {
      for (const ch of [...node.childNodes]) {
        if (ch.nodeType === 3) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(w => {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
            const sp = document.createElement("span"); sp.className = "w"; sp.style.display = "inline-block"; sp.textContent = w;
            frag.appendChild(sp); spans.push(sp);
          });
          node.replaceChild(frag, ch);
        } else if (ch.nodeType === 1 && ch.tagName !== "BR") {
          if (ch.classList.contains("w")) spans.push(ch); else wrap(ch);
        }
      }
    })(el);
    spans.forEach((s, i) => key(s, [[t0 + i * step, { o: 0, y: rise }], [t0 + i * step + dur, { o: 1, y: 0, e: "out" }]]));
  }
  function apply(el, v) {
    const is3d = v.rx || v.ry || v.z;
    const tf = is3d
      ? `translate3d(${v.x}px, ${v.y}px, ${v.z}px) rotateX(${v.rx}deg) rotateY(${v.ry}deg) rotate(${v.r}deg) scale(${v.s})`
      : `translate(${v.x}px, ${v.y}px) scale(${v.s}) rotate(${v.r}deg)`;
    el.style.transform = tf;
    el.style.opacity = v.o;
    const fl = (v.blur ? `blur(${v.blur}px) ` : "") + (v.br !== 1 ? `brightness(${v.br})` : "");
    el.style.filter = fl.trim();
    el.style.clipPath = v.cx < 1 ? `inset(0 ${(1 - v.cx) * 100}% 0 0)` : "";
  }
  function at(full, t) {
    if (t <= full[0][0]) return full[0][1];
    for (let i = 1; i < full.length; i++) {
      const [t1, v1] = full[i];
      if (t <= t1) {
        const [t0, v0] = full[i - 1];
        const p = (EASE[v1.e] || EASE.out)((t - t0) / Math.max(1e-6, t1 - t0));
        const o = {};
        for (const k of Object.keys(DEF)) o[k] = v0[k] + (v1[k] - v0[k]) * p;
        return o;
      }
    }
    return full[full.length - 1][1];
  }
  function warpIn(t) {
    const Wp = window.WARP; if (!Wp) return t;
    for (const [o0, o1, i0, i1] of Wp) if (t >= o0 && t < o1) return i0 + (t - o0) * (i1 - i0) / (o1 - o0);
    return t < Wp[0][0] ? Wp[0][2] : Wp[Wp.length - 1][3];
  }
  function warpOut(ti, nearest) {
    const Wp = window.WARP; if (!Wp) return ti;
    for (const [o0, o1, i0, i1] of Wp) if (ti >= i0 && ti <= i1) return o0 + (ti - i0) * (o1 - o0) / (i1 - i0);
    if (!nearest) return null;
    const next = Wp.find(s => s[2] > ti); return next ? next[0] : Wp[Wp.length - 1][1];
  }
  function cuesOut() {
    const out = [];
    for (const [t, k, o] of (window.CUES || [])) {
      if (k === "pad" || k === "pulse") {  // continuous beds: keep the part that survives the cut
        const a = warpOut(t, true), b = warpOut(t + ((o && o.d) || 4), true);
        if (b - a > .3) out.push([a, k, Object.assign({}, o, {d: b - a})]);
      } else { const to = warpOut(t, false); if (to !== null) out.push([to, k, o]); }
    }
    return out;
  }
  function seek(t) {
    const ti = warpIn(t);
    for (const tr of tracks) apply(tr.el, at(tr.full, ti));
    for (const f of fns) f.fn(Math.min(1, Math.max(0, (ti - f.t0) / Math.max(1e-6, f.t1 - f.t0))), ti);
    window.__t = t;
    return t;
  }
  let raf = null;
  function play(from = 0) {
    cancelAnimationFrame(raf);
    const start = performance.now() - from * 1000;
    const loop = () => { const t = (performance.now() - start) / 1000; seek(t % (window.DURATION || 20)); raf = requestAnimationFrame(loop); };
    loop();
  }
  // ---- closed-form springs (pure functions of time; see 00 Brain/craft/motion-playbook.md "Springs") ----
  // spring(t,k,d): 0 → 1 damped spring starting at t=0. Presets: SNAP (buttons/toggles), BASE (cards/camera), HEAVY (big type/logos).
  const SNAP = [320, 30], BASE = [170, 26], HEAVY = [110, 24];
  function spring(t, k = 170, d = 26) {
    if (t <= 0) return 0;
    const w0 = Math.sqrt(k), z = d / (2 * w0);
    if (z < 1) { const wd = w0 * Math.sqrt(1 - z * z);
      return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t)); }
    return 1 - Math.exp(-w0 * t) * (1 + w0 * t);  // critically damped (z >= 1)
  }
  // track(t, [[time, value], ...]): a value that changes target several times = one spring per change (never restart)
  function track(t, keys, k = 170, d = 26) {
    let v = keys[0][1];
    for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * spring(t - keys[i][0], k, d);
    return v;
  }
  // indicator(t, [[time, x], ...], width): tab underline that stretches (leading edge stiffer than trailing edge)
  function indicator(t, stops, width = 120) {
    const lead = track(t, stops, 320, 30), trail = track(t, stops, 140, 22);
    return { left: Math.min(lead, trail), right: Math.max(lead, trail) + width };
  }
  // swapAlpha(t, tIn, tOut): text inside a morphing container enters after the morph starts, leaves before the next one
  const clamp01 = x => Math.max(0, Math.min(1, x));
  function swapAlpha(t, tIn, tOut) { return Math.min(clamp01((t - tIn - 0.08) / 0.12), clamp01((tOut - 0.1 - t) / 0.1)); }
  // ---- layout(): one timeline, every format (see header). Safe box = l, t, r, b insets; 9:16 keeps clear of platform UI ----
  const SAFE = { "16x9": [96, 72, 96, 72], "9x16": [72, 240, 120, 400], "1x1": [72, 72, 72, 96] };
  const TS = { "16x9": 1, "9x16": 1.4, "1x1": 1.3 };
  const [sl, st, sr, sb] = SAFE[R] || SAFE["16x9"], ts = TS[R] || 1;
  [["--ts", ts], ["--safe-l", sl + "px"], ["--safe-t", st + "px"], ["--safe-r", sr + "px"], ["--safe-b", sb + "px"]]
    .forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
  function layout(spec = {}) {
    const safe = { l: sl, t: st, r: W - sr, b: H - sb, w: W - sl - sr, h: H - st - sb };
    safe.cx = safe.l + safe.w / 2; safe.cy = safe.t + safe.h / 2;
    return Object.assign({}, spec["16x9"], spec[R], {
      R, W, H, ts, safe, portrait: H > W, square: W === H,
      fs: px => Math.round(px * ts),
      x: f => safe.l + f * safe.w, y: f => safe.t + f * safe.h,
      fit: (w, h) => Math.min(safe.w / w, safe.h / h),
      pick: (a16, a9 = a16, a1 = a16) => (R === "9x16" ? a9 : R === "1x1" ? a1 : a16),
      place(el, o) {
        if (typeof el === "string") el = document.querySelector(el);
        for (const [k, v] of Object.entries(o))
          el.style[k] = typeof v !== "number" || /^(opacity|zIndex|lineHeight|flex)$/.test(k) ? v : (k === "fontSize" ? v * ts : v) + "px";
        return el;
      },
    });
  }
  // seeded noise (never Math.random): rng(seed)() → [0,1)
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed);
    x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }
  Object.assign(window, { R, W, H, key, on, words, seek, play, EASE, bez, cuesOut, warpIn,
                          spring, track, indicator, swapAlpha, rng, SNAP, BASE, HEAVY, layout });
  window.addEventListener("load", () => {
    document.fonts && document.fonts.ready.then(() => { window.__ready = true; seek(+(q.get("t") || 0));  // page mode: no looping preview; the page player plays once and holds });
  });
})();
