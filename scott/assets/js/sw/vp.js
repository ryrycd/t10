// The graphics area: one three.js world (units = mm) drawn on a full-stage canvas behind the chrome,
// plus a 2D overlay for dimensions, labels and tooltips projected from 3D every frame.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";

export const STAGE_W = 1920, STAGE_H = 1080;
export const VP = { x: 285, y: 156, w: 1590, h: 873 };          // graphics area in stage px
export const C = {
  sketchBlue: 0x1530C8, black: 0x000000, preview: 0xEFE867, previewEdge: 0xD9DE2E, orange: 0xFF7F04,
  contour: 0x9DA0BB, sel: 0x61B3E7, plane: 0x5284F6, green: 0x03CA35, magenta: 0xCA17CA,
};

export function createVP(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;

  const hemi = new THREE.HemisphereLight(0xffffff, 0xb9bcc6, 0.9); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(-500, 900, 1400); key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  const sc = key.shadow.camera; sc.left = -1000; sc.right = 1000; sc.top = 700; sc.bottom = -700; sc.near = 100; sc.far = 4000;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.6; key.shadow.radius = 6;
  scene.add(key); scene.add(key.target);
  const warm = new THREE.PointLight(0xffd6a0, 0, 2600, 1.6); warm.position.set(300, 500, 700); scene.add(warm);

  const camera = new THREE.PerspectiveCamera(16, STAGE_W / STAGE_H, 5, 30000);
  const res = new THREE.Vector2(STAGE_W, STAGE_H);
  const lineMats = new Set();

  const vp = {
    THREE, renderer, scene, camera, key, hemi, warm, env, res,
    // camera rig: target, distance, azimuth/elevation (deg), fov, and how far the view centre is
    // pulled toward the graphics area (1) or the full stage (0)
    rig: { t: new THREE.Vector3(0, 0, 0), dist: 4000, az: 0, el: 0, fov: 16, roll: 0, centre: 1 },
    setPixelRatio(pr) { renderer.setPixelRatio(pr); renderer.setSize(STAGE_W, STAGE_H, false); res.set(STAGE_W * pr, STAGE_H * pr); for (const m of lineMats) m.resolution.copy(res); },
    applyRig() {
      vp._rigKey = rigKey(vp.rig);
      const r = vp.rig, az = THREE.MathUtils.degToRad(r.az), el = THREE.MathUtils.degToRad(r.el);
      const d = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
      camera.position.copy(r.t).addScaledVector(d, r.dist);
      camera.up.set(Math.sin(THREE.MathUtils.degToRad(r.roll)), Math.cos(THREE.MathUtils.degToRad(r.roll)), 0);
      camera.lookAt(r.t);
      camera.fov = r.fov; camera.near = Math.max(1, r.dist * 0.02); camera.far = r.dist * 20 + 4000;
      // shift the principal point so the target sits in the middle of the graphics area
      const cx = VP.x + VP.w / 2 - STAGE_W / 2, cy = VP.y + VP.h / 2 - STAGE_H / 2;
      camera.setViewOffset(STAGE_W, STAGE_H, -cx * r.centre, -cy * r.centre, STAGE_W, STAGE_H);
      camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    },
    render() { vp.applyRig(); renderer.render(scene, camera); },
    // lights and exposure go back to the SolidWorks defaults every frame; beats raise them as needed
    resetLights() { hemi.intensity = 0.9; hemi.color.set(0xffffff); key.intensity = 1.5; key.color.set(0xffffff); warm.intensity = 0; renderer.toneMappingExposure = 1.0; },
    project(v) {
      if (vp._rigKey !== rigKey(vp.rig)) vp.applyRig();
      const p = v.clone().project(camera);
      return { x: (p.x + 1) / 2 * STAGE_W, y: (1 - p.y) / 2 * STAGE_H, z: p.z };
    },
    lineMat(color, width, opts = {}) {
      const m = new LineMaterial({ color, linewidth: width, resolution: res, transparent: true, opacity: opts.opacity ?? 1, dashed: !!opts.dashed, dashSize: opts.dash || 6, gapSize: opts.gap || 4, depthTest: opts.depthTest ?? true, worldUnits: false });
      lineMats.add(m); return m;
    },
    // polyline (array of Vector3)
    line(pts, color = C.black, width = 2, opts = {}) {
      const g = new LineGeometry(); g.setPositions(flat(pts));
      const l = new Line2(g, vp.lineMat(color, width, opts)); if (opts.dashed) l.computeLineDistances();
      l.renderOrder = opts.order ?? 5; return l;
    },
    setLine(l, pts) {
      // three.js caches a line's segment count the first time it is drawn (_maxInstanceCount), so a line that
      // grows point by point stayed stuck at its first tiny segment. Clear it so the new length is drawn.
      const e = pts[pts.length - 1], key = `${pts.length}:${e.x.toFixed(2)},${e.y.toFixed(2)},${e.z.toFixed(2)}`;
      if (l.userData.key === key) return;             // unchanged: skip the buffer rebuild
      l.geometry.setPositions(flat(pts)); delete l.geometry._maxInstanceCount; l.userData.key = key;
      if (l.material.dashed) l.computeLineDistances();
    },
    // black silhouette/feature edges of a mesh geometry
    edges(geometry, color = C.black, width = 1.4, angle = 30) {
      const eg = new THREE.EdgesGeometry(geometry, angle);
      const g = new LineSegmentsGeometry().setPositions(eg.attributes.position.array);
      const l = new LineSegments2(g, vp.lineMat(color, width)); l.renderOrder = 4; return l;
    },
    // ---- materials ----
    swMat(color = 0x8F8F95) { return new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1, envMapIntensity: 0.45, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }); },
    previewMat() { return new THREE.MeshLambertMaterial({ color: C.preview, transparent: true, opacity: 0.42, side: THREE.DoubleSide, depthWrite: false }); },
    contourMat() { return new THREE.MeshBasicMaterial({ color: C.contour, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }); },
    // ---- overlay (2D) ----
    ovBegin() { ovSvg.length = 0; ovHtml.length = 0; },
    ovEnd() { document.getElementById("ov").innerHTML = ovSvg.join(""); document.getElementById("ovh").innerHTML = ovHtml.join(""); },
    svg(s) { ovSvg.push(s); },
    html(s) { ovHtml.push(s); },
    // dimension between two 3D points, offset along a 3D direction; text in Century Gothic
    dimLinear(a, b, off, label, o = {}) {
      const A = vp.project(a), B = vp.project(b), A2 = vp.project(a.clone().add(off)), B2 = vp.project(b.clone().add(off));
      const col = o.color || "#000";
      const ext = (P, Q) => { const dx = Q.x - P.x, dy = Q.y - P.y, L = Math.hypot(dx, dy) || 1; return `M${P.x + dx / L * 5} ${P.y + dy / L * 5} L${Q.x + dx / L * 10} ${Q.y + dy / L * 10}`; };
      vp.svg(`<path d="${ext(A, A2)} ${ext(B, B2)}" stroke="${col}" stroke-width="1.3" fill="none"/>`);
      vp.svg(`<path d="M${A2.x} ${A2.y} L${B2.x} ${B2.y}" stroke="${col}" stroke-width="1.3"/>${arrow(A2, B2, col)}${arrow(B2, A2, col)}`);
      const mx = (A2.x + B2.x) / 2, my = (A2.y + B2.y) / 2;
      vp.html(`<div class="dim${o.big ? " big" : ""}${o.red ? " red" : ""}" style="left:${mx}px;top:${my}px;background:${o.bg || "transparent"};padding:0 6px">${label}</div>`);
      return { x: mx, y: my };
    },
    // diameter: leader through the centre with arrows on the circle, text outside
    dimDia(centre, r, ang, label, axisU, axisV, out = 60, o = {}) {
      const a = THREE.MathUtils.degToRad(ang);
      const p = centre.clone().addScaledVector(axisU, Math.cos(a) * r).addScaledVector(axisV, Math.sin(a) * r);
      const q = centre.clone().addScaledVector(axisU, -Math.cos(a) * r).addScaledVector(axisV, -Math.sin(a) * r);
      const P = vp.project(p), Q = vp.project(q);
      const dx = P.x - Q.x, dy = P.y - Q.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
      const E = { x: P.x + ux * out, y: P.y + uy * out };
      vp.svg(`<path d="M${Q.x} ${Q.y} L${E.x} ${E.y} L${E.x + (ux > 0 ? 26 : -26)} ${E.y}" stroke="#000" stroke-width="1.3" fill="none"/>${arrow(P, Q, "#000")}${arrow(Q, P, "#000")}`);
      vp.html(`<div class="dim${o.big ? " big" : ""}" style="left:${E.x + (ux > 0 ? 26 + 52 : -26 - 52)}px;top:${E.y - 2}px">${label}</div>`);
      return E;
    },
    label(pos, text, cls = "plabel", dx = 0, dy = 0) { const P = vp.project(pos); vp.html(`<div class="${cls}" style="left:${P.x + dx}px;top:${P.y + dy}px">${text}</div>`); return P; },
    tip(x, y, text) { vp.html(`<div class="tip" style="left:${x}px;top:${y}px">${text}</div>`); },
    // green relation square glyph
    rel(pos, sym = "—") { const P = vp.project(pos); vp.html(`<div style="position:absolute;left:${P.x - 9}px;top:${P.y - 9}px;width:18px;height:18px;background:#03CA35;color:#fff;font:700 12px Arial;display:grid;place-items:center;border:1px solid #028A25">${sym}</div>`); },
  };
  const ovSvg = [], ovHtml = [];
  return vp;
}

function rigKey(r) { return [r.t.x, r.t.y, r.t.z, r.dist, r.az, r.el, r.fov, r.roll, r.centre].join(","); }
function flat(pts) { const a = new Float32Array(pts.length * 3); pts.forEach((p, i) => { a[i * 3] = p.x; a[i * 3 + 1] = p.y; a[i * 3 + 2] = p.z; }); return a; }
function arrow(tip, from, col) {
  const dx = tip.x - from.x, dy = tip.y - from.y, L = Math.hypot(dx, dy) || 1, u = dx / L, w = dy / L;
  return `<path d="M${tip.x} ${tip.y} L${tip.x - u * 14 - w * 4.5} ${tip.y - w * 14 + u * 4.5} L${tip.x - u * 14 + w * 4.5} ${tip.y - w * 14 - u * 4.5}Z" fill="${col}"/>`;
}

// ---------- small maths helpers shared by beats ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (t, a, b) => clamp((t - a) / (b - a));                 // 0..1 progress of t in [a,b]
export const ease = {
  io: (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,        // SolidWorks view change
  out: (x) => 1 - Math.pow(1 - x, 3),
  expo: (x) => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x),
  in: (x) => x * x * x,
  cam: (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,  // camera (.65,0,.35,1)-ish
  lin: (x) => x,
};
export const lerp = (a, b, t) => a + (b - a) * t;
export function lerpRig(vp, a, b, t) {
  const r = vp.rig;
  r.t.lerpVectors(a.t, b.t, t);
  r.dist = Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), t));
  r.az = lerp(a.az, b.az, t); r.el = lerp(a.el, b.el, t); r.fov = lerp(a.fov, b.fov, t);
  r.roll = lerp(a.roll || 0, b.roll || 0, t); r.centre = lerp(a.centre ?? 1, b.centre ?? 1, t);
}
export function snapRig(vp) { const r = vp.rig; return { t: r.t.clone(), dist: r.dist, az: r.az, el: r.el, fov: r.fov, roll: r.roll, centre: r.centre }; }
export function circlePts(THREE, c, r, u, v, n = 160, a0 = 0, a1 = Math.PI * 2) {
  const out = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push(c.clone().addScaledVector(u, Math.cos(a) * r).addScaledVector(v, Math.sin(a) * r)); } return out;
}
// seeded noise so every frame is a pure function of time
export function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
