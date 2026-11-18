// The deck: a live SolidWorks session. One beat per click; every frame is a pure function of
// (beat, seconds since the click), so back, jumps and the remote can land anywhere cleanly.
// ?beat=N&t=S freezes a frame (for stills); window.__seek(beat, t) drives capture.
import * as THREE from "three";
import { createVP, snapRig, ease, seg, lerp, lerpRig, clamp, C, VP } from "./vp.js";
import { createUI } from "./ui.js";
import { createWorld, SLOT, WALL } from "./world.js";
import beatsA from "./beats-a.js";
import beatsB from "./beats-b.js";
import beatsC from "./beats-c.js";

const $ = (id) => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const N = window.SCRIPT.length;

const vp = createVP($("gl"));
const ui = createUI();
const W = createWorld(vp);
const k = { THREE, vp, ui, W, SLOT, WALL, C, VP, ease, seg, lerp, lerpRig, clamp, snapRig, cur: false, live: 0, hold: 0, assets: [] };

// every beat module offers beats by id; the script decides which ones play and in what order
const ALL = {};
for (const b of [...beatsA(k), ...beatsB(k), ...beatsC(k)]) ALL[b.id] = b;
const BEATS = window.SCRIPT.map((s) => ALL[s.id] || (console.warn("no beat for", s.id), { id: s.id, dur: 1, update() {} }));
window.BEATS = BEATS;

// ---------- fit the 1920x1080 stage to the window ----------
let scale = 1;
function fit() {
  scale = Math.min(innerWidth / 1920, innerHeight / 1080);
  const x = (innerWidth - 1920 * scale) / 2, y = (innerHeight - 1080 * scale) / 2;
  $("stage").style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  const pr = Q.has("pr") ? +Q.get("pr") : Math.min(2, scale * (window.devicePixelRatio || 1) * 1.15);
  vp.setPixelRatio(Math.max(1, pr));
}
addEventListener("resize", fit); fit();

// ---------- render one state ----------
const PERF = { js: 0, worstJs: 0, ui: 0, gl: 0 };
window.__perf = PERF;
function renderState(beat, t, live) {
  const _t0 = performance.now();
  ui.reset(); W.reset(); vp.ovBegin(); vp.resetLights();
  k.live = live;
  vp.ovMute = true;
  for (let i = 0; i < beat; i++) {
    k.cur = false; k.hold = 0; k.cam0 = snapRig(vp); k.index = i;
    BEATS[i].update(BEATS[i].dur, k);
  }
  ui.resetTransient(); vp.resetLights();
  k.cur = true; k.cam0 = snapRig(vp); k.index = beat;
  k.hold = Math.max(0, t - BEATS[beat].dur);
  vp.ovMute = false;
  BEATS[beat].update(Math.min(t, BEATS[beat].dur), k);
  const _t1 = performance.now();
  ui.commit(); vp.ovEnd();
  const _t2 = performance.now();
  vp.render();
  const _t3 = performance.now();
  PERF.js = _t1 - _t0; PERF.ui = _t2 - _t1; PERF.gl = _t3 - _t2;
  PERF.worstJs = Math.max(PERF.worstJs, _t3 - _t0); PERF.worst = PERF.worst || {};
  for (const [kk, v] of [["js", PERF.js], ["ui", PERF.ui], ["gl", PERF.gl]]) PERF.worst[kk] = Math.max(PERF.worst[kk] || 0, v);
}
// overlay calls from earlier beats are muted
for (const fn of ["svg", "html"]) { const f = vp[fn]; vp[fn] = (s) => { if (!vp.ovMute) f(s); }; }

// ---------- capture / still modes ----------
window.__seek = (beat, t) => { renderState(beat, t, t + beat * 10); return true; };
if (Q.has("beat") || Q.has("cap")) document.getElementById("hint").classList.add("gone");
if (Q.has("beat")) {
  const b = +Q.get("beat"), t = Q.has("t") ? +Q.get("t") : 99;
  Promise.all([document.fonts.ready, ...k.assets]).then(() => { renderState(b, t, 7); window.__ready = true; });
} else if (Q.has("cap")) {
  Promise.all([document.fonts.ready, ...k.assets]).then(() => { window.__ready = true; });
} else {
  startLive();
}

// Warm-up: render every beat at a few moments into an off-screen target while the deck sits on
// standby, so every shader and texture is compiled before the room ever sees it (no first-use stutter).
async function warmup(restore) {
  const jobs = [];
  for (let b = 0; b < N; b++) { const d = BEATS[b].dur; for (const t of [0.05, d * 0.25, d * 0.5, d * 0.75, d, d + 3]) jobs.push([b, t]); }
  for (let i = 0; i < jobs.length; i++) {
    const [b, t] = jobs[i];
    ui.reset(); W.reset(); vp.resetLights(); vp.ovMute = true;
    for (let j = 0; j < b; j++) { k.cur = false; k.hold = 0; k.cam0 = snapRig(vp); BEATS[j].update(BEATS[j].dur, k); }
    ui.resetTransient(); vp.resetLights(); k.cur = true; k.cam0 = snapRig(vp); k.hold = Math.max(0, t - BEATS[b].dur);
    try { BEATS[b].update(Math.min(t, BEATS[b].dur), k); } catch (e) {}
    // draw to the real canvas (same shader variants as the show), then put the live frame back
    // before the task ends, so nothing ever reaches the screen
    vp.applyRig(); vp.renderer.render(vp.scene, vp.camera);
    if (i % 3 === 2 || i === jobs.length - 1) { vp.ovMute = false; restore(); await new Promise((r) => setTimeout(r, 0)); }
  }
  vp.ovMute = false; restore(); window.__warm = true;
}

function startLive() {
  let beat = 0, t0 = performance.now();
  let warming = true;
  setTimeout(() => $("hint").classList.add("gone"), 6000);
  const T0 = performance.now();
  const restore = () => { const now = performance.now(); renderState(beat, (now - t0) / 1000, (now - T0) / 1000); };
  Promise.all([document.fonts.ready, ...k.assets]).then(() => warmup(restore)).finally(() => { warming = false; });
  const sync = window.LiveSync ? window.LiveSync({ role: "deck", onState: (b) => go(b, { remote: true }), onStatus: (s, p) => status(s, p) }) : null;
  function go(b, o = {}) {
    b = clamp(b, 0, N - 1) | 0;
    if (b === beat && !o.force) return;
    const back = b < beat;
    beat = b;
    t0 = performance.now() - (back ? BEATS[b].dur * 1000 : 0);
    if (!o.remote && sync) sync.go(b);
    if (!back && window.SOUND) window.SOUND.beat(b, BEATS[b]);
    $("hint").classList.add("gone");
  }
  function loop() {
    requestAnimationFrame(loop);
    const now = performance.now();
    if (warming && beat === 0) { if (!loop.drawn) { renderState(0, 0, 0); loop.drawn = true; } return; }
    renderState(beat, (now - t0) / 1000, (now - T0) / 1000);
  }
  requestAnimationFrame(loop);

  let lastClick = 0;
  const next = () => go(beat + 1), prev = () => go(beat - 1);
  addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown" || e.key === "Enter") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "Backspace") { e.preventDefault(); prev(); }
    else if (e.key === "Home") go(0, { force: true });
    else if (e.key === "End") go(N - 1);
    else if (e.key === "f" || e.key === "F") { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); }
    else if (e.key === "p" || e.key === "P") $("panel").classList.toggle("open");
    else if (e.key === "s" || e.key === "S") { if (window.SOUND) window.SOUND.toggle(); }
    if (window.SOUND) window.SOUND.unlock();
  });
  addEventListener("mousedown", (e) => {
    if (e.target.closest("#panel")) return;
    if (window.SOUND) window.SOUND.unlock();
    const now = performance.now(); if (now - lastClick < 350) return; lastClick = now;
    if (e.button === 0) next(); else if (e.button === 2) prev();
  });
  addEventListener("contextmenu", (e) => e.preventDefault());
  let idleT; addEventListener("mousemove", () => { document.body.classList.remove("idle"); clearTimeout(idleT); idleT = setTimeout(() => document.body.classList.add("idle"), 1800); });

  const scriptUrl = new URL("../script/", location.href).href;
  $("pUrl").textContent = scriptUrl; $("pOpen").href = scriptUrl;
  $("pCopy").onclick = () => navigator.clipboard && navigator.clipboard.writeText(scriptUrl);
  $("pStart").onclick = () => go(0, { force: true });
  function status(s, p) {
    $("pDot").className = "sdot " + (s === "live" ? "on" : "warn");
    $("pStatus").textContent = s === "live" ? `Live · ${p.script || 0} script page${p.script === 1 ? "" : "s"} connected` : (s === "offline" ? "Offline: keys and clicks still work" : "Connecting…");
    $("netdot").classList.toggle("show", s !== "live");
  }
  window.__go = go;
}
