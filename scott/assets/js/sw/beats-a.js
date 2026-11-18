// Beats: standby, name sign (v4 opener), graph paper, "it clicked" + revolve. The CD/signed/reveal beats are kept
// but unused since v4 (the script picks beats by id); the finished CD hangs on the wall via k.cdFinal().
import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { circlePts, rng } from "./vp.js";
import { pegHook } from "./world.js";

const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
export const BASE_TREE = [
  { icon: "part", label: "Scott Harris (Default) &lt;&lt;Default&gt;_Display State 1&gt;", root: true },
  { icon: "history", label: "History", ex: "▸" }, { icon: "sensors", label: "Sensors" }, { icon: "annot", label: "Annotations", ex: "▸" },
  { icon: "bodies", label: "Solid Bodies(3)", ex: "▸" }, { icon: "material", label: "Material &lt;not specified&gt;" },
  { icon: "plane", label: "Front Plane" }, { icon: "plane", label: "Top Plane" }, { icon: "plane", label: "Right Plane" }, { icon: "origin", label: "Origin" },
  { icon: "extrude", label: "Pegboard", ex: "▸" }, { icon: "pattern", label: "LPattern1" }, { icon: "extrude", label: "Shelf", ex: "▸" },
];
export const WIDE = { t: V(0, 40, 0), dist: 6900, az: 24, el: 14, fov: 16, roll: 0, centre: 1 };
export const statR = (def, edit, xyz) => `${xyz ? xyz.map((v) => `<span>${v}</span>`).join("") : ""}${def ? `<span>${def}</span>` : ""}<span>${edit}</span><span class="tl"></span><span style="color:#777">MMGS ▾</span>`;

// ---- shared tree state: beats push their features here in order ----
export function treeWith(k, extra) { return [...BASE_TREE, ...(k.treeExtra || []), ...extra]; }

export default function beatsA(k) {
  const { vp, ui, W, SLOT, ease, seg, lerp, lerpRig, C } = k;
  const sc = vp.scene;

  // ================= the CD =================
  const R = 60, r = 7.5, T = 1.2;
  const ringShape = new THREE.Shape(); ringShape.absarc(0, 0, R, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, r, 0, Math.PI * 2, true); ringShape.holes.push(hole);
  const cdGeo = new THREE.ExtrudeGeometry(ringShape, { depth: T, bevelEnabled: false, curveSegments: 128 });
  const cd = W.group("cd"); cd.position.copy(SLOT.cd).setZ(6);
  const cdSW = new THREE.Mesh(cdGeo, vp.swMat()); cdSW.castShadow = true;
  const cdEdges = vp.edges(cdGeo, 0x000000, 1.3);
  cd.add(cdSW, cdEdges);
  // preview (yellow) whose depth we animate by scaling z
  const prev = new THREE.Mesh(cdGeo, vp.previewMat()); cd.add(prev);
  const prevTop = vp.line(circlePts(THREE, V(0, 0, T), R, V(1, 0, 0), V(0, 1, 0)), C.previewEdge, 1.6);
  const prevTopIn = vp.line(circlePts(THREE, V(0, 0, T), r, V(1, 0, 0), V(0, 1, 0)), C.previewEdge, 1.6);
  cd.add(prevTop, prevTopIn);
  // sketch: two circles, contour fill, centre point
  const skO = vp.line(circlePts(THREE, V(0, 0, 0.3), R, V(1, 0, 0), V(0, 1, 0)), C.sketchBlue, 2.2);
  const skI = vp.line(circlePts(THREE, V(0, 0, 0.3), r, V(1, 0, 0), V(0, 1, 0)), C.sketchBlue, 2.2);
  const contour = new THREE.Mesh(new THREE.ShapeGeometry(ringShape, 96), vp.contourMat()); contour.position.z = 0.2;
  const cpt = new THREE.Mesh(new THREE.CircleGeometry(1.6, 16), new THREE.MeshBasicMaterial({ color: C.sketchBlue })); cpt.position.z = 0.5;
  cd.add(skO, skI, contour, cpt);
  // RealView: a gold CD-R with Sharpie signatures on the label side
  const cdCanvas = document.createElement("canvas"); cdCanvas.width = cdCanvas.height = 1024;
  const cdTex = new THREE.CanvasTexture(cdCanvas); cdTex.colorSpace = THREE.SRGBColorSpace; cdTex.anisotropy = 8;
  const gold = new THREE.MeshPhysicalMaterial({ color: 0xF6D27A, metalness: 0.78, roughness: 0.3, map: cdTex, iridescence: 0.55, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 520], clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.9 });
  const cdSide = new THREE.MeshStandardMaterial({ color: 0xD8D2C0, metalness: 0.6, roughness: 0.3 });
  const cdReal = new THREE.Mesh(cdGeo, [gold, cdSide]); cdReal.castShadow = true;
  cd.add(cdReal);
  // UVs of ExtrudeGeometry caps are in shape units (-60..60): map them to 0..1
  { const uv = cdGeo.attributes.uv; for (let i = 0; i < uv.count; i++) { uv.setXY(i, (uv.getX(i) + R) / (2 * R), (uv.getY(i) + R) / (2 * R)); } uv.needsUpdate = true; }
  const hook = pegHook(vp, true); hook.position.set(0, R - 5, -6); cd.add(hook);
  // signature strokes, generated once (deterministic)
  const sigs = []; { const rnd = rng(1995);
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2 + rnd() * 0.3, rad = 0.6 + rnd() * 0.25;
      const cx = 512 + Math.cos(ang) * rad * 470, cy = 512 + Math.sin(ang) * rad * 470;
      const len = 150 + rnd() * 120, rot = ang + Math.PI / 2 + (rnd() - 0.5) * 0.5;
      const pts = [], P = (x, y) => pts.push([cx + Math.cos(rot) * x - Math.sin(rot) * y, cy + Math.sin(rot) * x + Math.cos(rot) * y]);
      // capital: a tall loop
      const H = 34 + rnd() * 20; for (let j = 0; j <= 24; j++) { const a = j / 24 * Math.PI * 2; P(-len / 2 + 10 * Math.sin(a) + j * 0.6, -H * 0.5 + H * (0.5 - 0.5 * Math.cos(a))); }
      // lower-case run: loops whose count and size vary
      const w = 2 * Math.PI * (4 + Math.floor(rnd() * 5)), A = 9 + rnd() * 6, B = 10 + rnd() * 7, ph = rnd() * 3;
      for (let j = 0; j <= 120; j++) { const u = j / 120; P(-len / 2 + 12 + u * (len - 12) - A * Math.sin(w * u + ph), -B * Math.cos(w * u + ph) * (0.7 + 0.3 * Math.sin(u * 9 + ph)) + Math.sin(u * 4) * 4); }
      if (rnd() < 0.7) { pts.push(null); for (let j = 0; j <= 16; j++) { const u = j / 16; P(-len / 2 + u * len * 0.9, 22 + Math.sin(u * 3.1) * 4 + u * 3); } }
      sigs.push(pts);
    } }
  let cdDrawn = -1;
  function drawCD(sigP, labelP) {
    const key = Math.round(sigP * 400) + 1000 * Math.round(labelP * 100);
    if (key === cdDrawn) return; cdDrawn = key;
    const g = cdCanvas.getContext("2d");
    const grd = g.createRadialGradient(512, 512, 40, 512, 512, 512); grd.addColorStop(0, "#F3E3A6"); grd.addColorStop(0.5, "#E6C366"); grd.addColorStop(1, "#D4A845");
    g.fillStyle = grd; g.fillRect(0, 0, 1024, 1024);
    g.strokeStyle = "rgba(120,90,30,.35)"; g.lineWidth = 3; g.beginPath(); g.arc(512, 512, 150, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(512, 512, 495, 0, Math.PI * 2); g.stroke();
    g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#141210"; g.lineWidth = 4.6;
    const n = sigs.length * sigP;
    for (let i = 0; i < sigs.length; i++) {
      const p = Math.min(1, Math.max(0, n - i)); if (p <= 0) break;
      const pts = sigs[i]; const m = Math.floor(pts.length * p); g.beginPath(); let pen = false;
      for (let j = 0; j < m; j++) { const q = pts[j]; if (!q) { pen = false; continue; } if (!pen) { g.moveTo(q[0], q[1]); pen = true; } else g.lineTo(q[0], q[1]); }
      g.stroke();
    }
    if (labelP > 0) {
      g.save(); g.translate(512, 318); g.rotate(-0.08);
      g.font = "86px 'Marker Felt', 'Bradley Hand', 'Chalkboard', cursive"; g.fillStyle = "#121010"; g.textAlign = "center";
      const txt = "SolidWorks 95"; const w = g.measureText(txt).width;
      g.beginPath(); g.rect(-w / 2 - 10, -100, (w + 20) * Math.min(1, labelP * 1.15), 160); g.clip();
      g.fillText(txt, 0, 0); g.restore();
      if (labelP > 0.7) { g.save(); g.translate(512, 730); g.rotate(0.05); g.font = "54px 'Marker Felt', 'Bradley Hand', cursive"; g.fillStyle = "#121010"; g.textAlign = "center"; g.globalAlpha = Math.min(1, (labelP - 0.7) / 0.3); g.fillText("first revenue copy", 0, 0); g.restore(); }
    }
    cdTex.needsUpdate = true;
  }

  // ================= name sign: SCOTT HARRIS (sketch text, then extruded) =================
  let signGeo = null, signMesh = null, signEdges = null, signReal = null; const sign = W.group("sign");
  const signOutline = new THREE.Group(); sign.add(signOutline);
  k.assets.push(new Promise((done) => new FontLoader().load("../vendor/three/examples/fonts/helvetiker_bold.typeface.json", (font) => {
    signGeo = new TextGeometry("SCOTT HARRIS", { font, size: 78, depth: 1, curveSegments: 6, bevelEnabled: false });
    signGeo.computeBoundingBox(); const bb = signGeo.boundingBox; const ox = (bb.max.x + bb.min.x) / 2, oy = (bb.max.y + bb.min.y) / 2; signGeo.translate(-ox, -oy, 0);
    signMesh = new THREE.Mesh(signGeo, vp.swMat()); signMesh.castShadow = true;
    signEdges = vp.edges(signGeo, 0x000000, 1.2, 40);
    signReal = new THREE.Mesh(signGeo, new THREE.MeshStandardMaterial({ color: 0xF2EFE8, roughness: 0.45, metalness: 0 })); signReal.castShadow = true;
    sign.add(signMesh, signEdges, signReal);
    // outlines for the sketch-text state
    for (const sh of font.generateShapes("SCOTT HARRIS", 78)) {
      for (const path of [sh, ...sh.holes]) {
        const pts = path.getPoints(6).map((p) => V(p.x - ox, p.y - oy, 0.5)); pts.push(pts[0].clone());
        signOutline.add(vp.line(pts, C.sketchBlue, 1.6));
      }
    }
    done();
  })));
  sign.position.copy(SLOT.sign);

  // ================= graph paper + the nacelle =================
  const paper = W.group("paper"); paper.position.copy(SLOT.graph).setZ(0.6);
  const pc = document.createElement("canvas"); pc.width = 1280; pc.height = 880;
  { const g = pc.getContext("2d"); g.fillStyle = "#F4F1E6"; g.fillRect(0, 0, 1280, 880);
    for (let x = 0; x <= 1280; x += 16) { g.strokeStyle = x % 80 === 0 ? "rgba(58,110,165,.55)" : "rgba(58,110,165,.22)"; g.lineWidth = x % 80 === 0 ? 2 : 1; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 880); g.stroke(); }
    for (let y = 0; y <= 880; y += 16) { g.strokeStyle = y % 80 === 0 ? "rgba(58,110,165,.55)" : "rgba(58,110,165,.22)"; g.lineWidth = y % 80 === 0 ? 2 : 1; g.beginPath(); g.moveTo(0, y); g.lineTo(1280, y); g.stroke(); }
    g.fillStyle = "rgba(40,40,40,.75)"; g.font = "28px 'Bradley Hand', 'Marker Felt', cursive"; g.fillText("NACELLE  INLET  —  STA 0-230", 60, 830); }
  const ptex = new THREE.CanvasTexture(pc); ptex.colorSpace = THREE.SRGBColorSpace; ptex.anisotropy = 8;
  const paperMesh = new THREE.Mesh(new THREE.PlaneGeometry(320, 220), new THREE.MeshStandardMaterial({ map: ptex, roughness: 0.95 }));
  paperMesh.receiveShadow = true; paper.add(paperMesh);
  for (const [x, y] of [[-150, 100], [150, 100], [-150, -100], [150, -100]]) { const tack = new THREE.Mesh(new THREE.SphereGeometry(4.5, 16, 12), new THREE.MeshStandardMaterial({ color: 0xC0392B, roughness: 0.35 })); tack.position.set(x, y, 3); tack.castShadow = true; paper.add(tack); }
  // the nacelle half-profile (x along the engine axis, y = radius), axis 40 mm below the paper centre
  const AX = -55;
  const outer = [], inner = [];
  for (let i = 0; i <= 40; i++) { const u = i / 40, x = -115 + u * 230; const rr = 52 + 16 * Math.sin(Math.min(1, u * 2.2) * Math.PI / 2) - 12 * Math.pow(Math.max(0, u - 0.6) / 0.4, 1.7); outer.push([x, rr]); }
  for (let i = 40; i >= 0; i--) { const u = i / 40, x = -115 + u * 230; const rr = 46 - 10 * Math.sin(Math.min(1, u * 2.6) * Math.PI / 2) + 6 * u; inner.push([x, rr]); }
  const lip = []; for (let i = 0; i <= 8; i++) { const a = Math.PI / 2 + i / 8 * Math.PI; lip.push([-115 + Math.cos(a) * 3, 47 + Math.sin(a) * 3]); }
  const profile = [...outer, ...inner, [-115, 46], [-115, 52]];
  const pencilPts = (wob) => { const rnd = rng(7 + wob); return profile.map(([x, y]) => V(x + (rnd() - 0.5) * 1.6, AX + y + (rnd() - 0.5) * 1.6, 0.9)); };
  const pencil = vp.line(pencilPts(0), 0x55524C, 2.1, { opacity: 0.9 });
  const pencilAxis = vp.line([V(-140, AX, 0.9), V(140, AX, 0.9)], 0x55524C, 1.4, { dashed: true, dash: 14, gap: 5, opacity: 0.8 });
  const skProfile = vp.line(profile.map(([x, y]) => V(x, AX + y, 1.4)).concat([V(profile[0][0], AX + profile[0][1], 1.4)]), C.sketchBlue, 2.3);
  const skAxis = vp.line([V(-140, AX, 1.4), V(140, AX, 1.4)], C.sketchBlue, 1.6, { dashed: true, dash: 16, gap: 5 });
  paper.add(pencil, pencilAxis, skProfile, skAxis);
  // revolve (half, 180 deg out of the wall, like a museum cutaway)
  const lathePts = profile.map(([x, y]) => new THREE.Vector2(y, x)); lathePts.push(lathePts[0].clone());
  const nac = new THREE.Group(); paper.add(nac); nac.position.set(0, AX, 1.5); nac.rotation.z = -Math.PI / 2;
  const nacMat = vp.swMat(); const nacPrev = vp.previewMat();
  const nacReal = new THREE.MeshPhysicalMaterial({ color: 0xD9DDE2, metalness: 1, roughness: 0.28, envMapIntensity: 1.1, side: THREE.DoubleSide });
  let nacMesh = null, nacEdges = null, nacPhi = -1;
  function setNacelle(phi, mode) {
    if (Math.abs(phi - nacPhi) > 1e-3) {
      nacPhi = phi; if (nacMesh) { nac.remove(nacMesh, nacEdges); nacMesh.geometry.dispose(); }
      const g = new THREE.LatheGeometry(lathePts, Math.max(3, Math.round(64 * phi / Math.PI)), Math.PI / 2 - phi, phi);
      nacMesh = new THREE.Mesh(g, nacMat); nacMesh.castShadow = true;
      nacEdges = vp.edges(g, 0x000000, 1.2, 35); nac.add(nacMesh, nacEdges);
    }
    nacMesh.material = mode === "prev" ? nacPrev : mode === "real" ? nacReal : nacMat;
    nacEdges.visible = mode === "sw";
  }
  // inner fan for the RealView cutaway
  const fan = new THREE.Group(); { const hub = new THREE.Mesh(new THREE.SphereGeometry(16, 24, 16, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x3B3F46, metalness: 0.8, roughness: 0.35 }));
    hub.rotation.y = -Math.PI / 2; fan.add(hub);
    for (let i = 0; i < 9; i++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(2.2, 36, 9), new THREE.MeshStandardMaterial({ color: 0x9AA1AA, metalness: 0.9, roughness: 0.3 })); const a = -Math.PI / 2 + (i + 0.5) / 9 * Math.PI; bl.position.set(0, Math.sin(a) * 24, Math.cos(a) * 24); bl.rotation.x = -a; bl.rotation.y = 0.5; fan.add(bl); }
    fan.position.set(-82, AX, 1.5); paper.add(fan); }

  // --------------- helpers ---------------
  const camTo = (shot, t, a, b, e = ease.cam) => lerpRig(vp, k.cam0, shot, e(seg(t, a, b)));
  const drift = (deg = 0.35) => { if (k.cur) vp.rig.az += Math.min(k.hold, 20) * deg; };
  const sketchUI = (skName, def, extra = {}) => { ui.set({ cmdTab: "Sketch", title: `${skName} of Scott Harris *`, confirm: "sketch", statr: statR(def, `Editing ${skName}`, ["-48.62mm", "31.07mm", "0mm"]), ...extra }); };
  const cdShot = { t: SLOT.cd.clone().add(V(14, -6, 0)), dist: 1500, az: 22, el: 12, fov: 16, roll: 0, centre: 1 };

  // ================================================================
  const beats = [];
  // 0 STANDBY
  beats.push({ id: "standby", dur: 0.01, update(t) {
    W.wall.visible = W.shelf.visible = true; W.setWallReal(false);
    vp.rig.t.copy(WIDE.t); Object.assign(vp.rig, { dist: WIDE.dist, az: WIDE.az + Math.sin(k.live * 0.15) * 1.5, el: WIDE.el, fov: WIDE.fov, roll: 0, centre: 1 });
    vp.warm.intensity = 0; vp.key.intensity = 1.5; vp.hemi.intensity = 0.9;
    k.treeExtra = [];
    ui.set({ tree: treeWith(k, []), hint: "SOLIDWORKS Premium 2024 SP5.0", statr: statR("", "Editing Part"), title: "Scott Harris.SLDPRT" });
    if (k.cur) ui.set({ cursor: { x: 1180 + Math.sin(k.live * 0.6) * 4, y: 640 + Math.cos(k.live * 0.5) * 3, kind: "arrow" } });
  } });

  // 1 CD: select the wall face, sketch two circles, dimension them, extrude 1.2 mm
  beats.push({ id: "cd", dur: 6.2, cues: [[0.85, "click"], [1.1, "click"], [1.75, "click"], [1.95, "click"], [2.25, "type"], [2.35, "type"], [2.45, "type"], [2.55, "click"], [2.85, "click"], [3.25, "click"], [3.38, "click"], [3.52, "type"], [3.62, "type"], [3.75, "click"], [4.3, "click"], [4.88, "type"], [4.96, "type"], [5.05, "type"], [5.5, "click"], [5.56, "ok"]], update(t) {
    camTo(cdShot, t, 0, 1.0);
    drift();
    cd.visible = true; cdReal.visible = false; hook.visible = false;
    const sk = t >= 0.9 && t < 4.3, ext = t >= 4.3;
    const rO = t < 1.1 ? 0 : t < 1.75 ? lerp(4, 55.2, ease.out(seg(t, 1.1, 1.75))) : t < 2.55 ? 55.2 : R;
    const rI = t < 2.85 ? 0 : t < 3.25 ? lerp(1, 9.6, ease.out(seg(t, 2.85, 3.25))) : t < 3.75 ? 9.6 : r;
    const black = t >= 3.95;
    const skCol = black ? C.black : C.sketchBlue;
    skO.visible = sk && rO > 0; skI.visible = sk && rI > 0; cpt.visible = sk;
    if (skO.visible) { skO.scale.setScalar(rO / R); skO.material.color.set(skCol); }
    if (skI.visible) { skI.scale.setScalar(rI / r); skI.material.color.set(skCol); }
    cpt.material.color.set(skCol);
    contour.visible = sk && t >= 3.3;
    // extrude preview + final
    const depth = t < 4.3 ? 0 : t < 4.85 ? lerp(10, 10, 0) : t < 5.25 ? 10 : T;
    prev.visible = prevTop.visible = prevTopIn.visible = ext && t < 5.55;
    if (prev.visible) { prev.scale.z = depth / T; prevTop.position.z = prevTopIn.position.z = depth - T; }
    cdSW.visible = cdEdges.visible = t >= 5.55;
    if (t >= 4.3 && t < 5.55) { skO.visible = skI.visible = true; skO.material.color.set(C.orange); skI.material.color.set(C.orange); skO.scale.setScalar(1); skI.scale.setScalar(1); }
    // ---- UI ----
    if (t < 0.9) ui.set({ tree: treeWith(k, []), statr: statR("", "Editing Part"), cursor: k.cur ? { x: lerp(1180, 890, ease.io(seg(t, 0.1, 0.8))), y: lerp(640, 420, ease.io(seg(t, 0.1, 0.8))), kind: "arrow" } : null });
    if (sk) {
      sketchUI("Sketch1", black ? "Fully Defined" : "Under Defined", { tree: treeWith(k, [{ icon: "sk", label: black ? "Sketch1" : "(-) Sketch1" }]), pressed: t < 1.85 || (t > 2.8 && t < 3.3) ? "" : "Smart Dimension" });
      const c = vp.project(cd.position.clone().setZ(6.3));
      if (k.cur) {
        const cx = c.x, cy = c.y;
        if (t < 1.85) ui.set({ cursor: { x: cx + (t < 1.1 ? 0 : rO * 3.05), y: cy - (t < 1.1 ? 0 : rO * 1.2), kind: "pencil" } });
        else if (t < 2.8) ui.set({ cursor: { x: cx + 280, y: cy - 150, kind: "dim" } });
        else if (t < 3.3) ui.set({ cursor: { x: cx + rI * 3.0, y: cy - rI * 1.1, kind: "pencil" } });
        else ui.set({ cursor: { x: cx - 240, y: cy + 170, kind: "dim" } });
      }
      // dimensions + Modify boxes
      if (t >= 1.95) { const E = vp.dimDia(cd.position.clone().setZ(6.3), rO, 30, `Ø${(rO * 2).toFixed(2)}`, V(1, 0, 0), V(0, 1, 0), 70); if (t < 2.55) ui.set({ modify: { x: E.x + 40, y: E.y - 40, value: t < 2.2 ? "110.37mm" : "120", name: "D1@Sketch1" } }); }
      if (t >= 3.35) { const E = vp.dimDia(cd.position.clone().setZ(6.3), rI, 205, `Ø${(rI * 2).toFixed(2)}`, V(1, 0, 0), V(0, 1, 0), 120); if (t < 3.75) ui.set({ modify: { x: E.x - 330, y: E.y - 20, value: t < 3.5 ? "19.20mm" : "15", name: "D2@Sketch1" } }); }
      if (t < 1.1 && t > 0.9) ui.set({ hint: "Select a plane on which to create a sketch for the entity." });
    }
    if (ext) {
      ui.set({ cmdTab: "Features", title: "Scott Harris.SLDPRT *" });
      if (t < 5.55) {
        ui.set({ panel: "pm", pm: "Boss-Extrude", pmDepth: t < 4.85 ? "10.00mm" : "1.20mm", cmdDis: true, pressed: "Instant3D", flyout: "Scott Harris (Default) &lt;&lt;D...", confirm: "feature", hint: "Select a handle to modify parameters", statr: statR("Fully Defined", "Editing Sketch1", ["-48.62mm", "31.07mm", "0mm"]), tree: treeWith(k, [{ icon: "sk", label: "Sketch1" }]) });
        const hp = vp.project(cd.position.clone().add(V(30, -22, 6 + depth)));
        if (k.cur) { vp.tip(hp.x + 18, hp.y + 22, `Direction 1: Blind (${depth.toFixed(2)}mm)`); ui.set({ cursor: { x: hp.x, y: hp.y, kind: t > 4.6 && t < 4.9 ? "hand" : "arrow" } });
          if (t > 4.5 && t < 4.95) ui.set({ modify: null }); }
      } else {
        ui.set({ tree: treeWith(k, [{ icon: "extrude", label: "Boss-Extrude1", sel: true, ex: "▸" }]), statr: statR("", "Editing Part"), hint: "", cursor: k.cur ? { x: 1100, y: 690, kind: "arrow" } : null });
      }
    }
    if (t >= 5.55) k.treeExtra = [{ icon: "extrude", label: "Boss-Extrude1", ex: "▸" }];
  } });

  // 2 SIGNED: RealView on; it's a gold CD; the whole company signs it
  const cdMacro = { t: SLOT.cd.clone().add(V(4, 4, 0)), dist: 900, az: 16, el: 9, fov: 16, roll: 0, centre: 1 };
  beats.push({ id: "signed", dur: 6.0, cues: [[0.03, "snap"]], update(t) {
    camTo(cdMacro, t, 0, 1.6);
    if (k.cur) { vp.rig.az += Math.sin(Math.min(t + k.hold, 30) * 0.45) * 5; vp.rig.el += Math.sin(Math.min(t + k.hold, 30) * 0.3) * 2; }
    cd.visible = true; cdSW.visible = cdEdges.visible = false; cdReal.visible = true; hook.visible = true;
    skO.visible = skI.visible = contour.visible = cpt.visible = prev.visible = prevTop.visible = prevTopIn.visible = false;
    drawCD(seg(t, 0.6, 5.0), 0);
    vp.warm.intensity = 2.4e5; vp.warm.color.set(0xfff1d6); vp.warm.position.copy(SLOT.cd).add(V(-260 + 420 * ease.io(seg((t + k.hold) % 9, 0.4, 6)), 160, 520));
    ui.set({ tree: treeWith(k, []), statr: statR("", "Editing Part"), hint: "RealView Graphics" });
  } });

  // 3 REVEAL: "SolidWorks 95" + rename the feature; pull back; SCOTT HARRIS sketch text, extrude
  const signShot = { t: V(-40, 300, 0), dist: 5200, az: 9, el: 5, fov: 16, roll: 0, centre: 1 };
  beats.push({ id: "reveal", dur: 7.0, cues: [[0.15, "click"], [0.26, "click"], [0.40, "type"], [0.47, "type"], [0.54, "type"], [0.61, "type"], [0.68, "type"], [0.75, "type"], [0.82, "type"], [0.89, "type"], [0.96, "type"], [1.03, "type"], [1.10, "type"], [1.17, "type"], [1.24, "type"], [1.31, "type"], [1.38, "type"], [1.45, "type"], [1.6, "click"], [3.35, "click"], [3.45, "type"], [3.53, "type"], [3.60, "type"], [3.68, "type"], [3.76, "type"], [3.84, "type"], [3.91, "type"], [3.99, "type"], [4.07, "type"], [4.15, "type"], [4.22, "type"], [4.30, "type"], [4.6, "click"], [5.0, "click"], [5.75, "click"], [5.8, "ok"]], update(t) {
    camTo(signShot, t, 1.6, 3.2);
    drift(0.25);
    cd.visible = true; cdSW.visible = cdEdges.visible = false; cdReal.visible = true; hook.visible = true;
    skO.visible = skI.visible = contour.visible = cpt.visible = prev.visible = prevTop.visible = prevTopIn.visible = false;
    drawCD(1, seg(t, 0.1, 1.3));
    // rename the feature in the tree (slow double-click, type, Enter)
    const name = "First revenue CD, 1995"; const typed = name.slice(0, Math.round(name.length * seg(t, 0.35, 1.5)));
    const renaming = t >= 0.2 && t < 1.65;
    k.treeExtra = [{ icon: "extrude", label: t < 0.2 ? "Boss-Extrude1" : renaming ? typed : name, ex: "▸", sel: t < 1.8, edit: renaming }];
    ui.set({ tree: treeWith(k, []), hint: "" });
    // sketch text then extrude for the name sign
    sign.visible = true;
    const sOn = t >= 3.4, eOn = t >= 5.0;
    signOutline.visible = t >= 4.35 && t < 5.0;
    for (const l of signOutline.children) l.material.color.set(t >= 4.6 ? C.black : C.sketchBlue);
    if (signMesh) { const d = eOn ? lerp(1, 30, ease.out(seg(t, 5.0, 5.7))) : 0; signMesh.visible = signEdges.visible = eOn; signReal.visible = false; signMesh.scale.z = signEdges.scale.z = d; if (eOn && t < 5.8) signMesh.material = signMat.prev; else signMesh.material = signMat.sw; }
    if (sOn && t < 5.0) {
      sketchUI("Sketch2", t >= 4.6 ? "Fully Defined" : "Under Defined", { panel: t < 4.6 ? "pm" : "tree", pm: "Sketch Text", pmDepth: "SCOTT HARRIS".slice(0, Math.round(12 * seg(t, 3.4, 4.3))), cmdTab: "Sketch", tree: treeWith(k, [{ icon: "sk", label: t >= 4.6 ? "Sketch2" : "(-) Sketch2" }]) });
    } else if (eOn && t < 5.8) {
      ui.set({ panel: "pm", pm: "Boss-Extrude", pmDepth: "30.00mm", cmdDis: true, pressed: "Instant3D", flyout: "Scott Harris (Default) &lt;&lt;D...", confirm: "feature", tree: treeWith(k, [{ icon: "sk", label: "Sketch2" }]) });
    } else if (t >= 5.8) {
      ui.set({ tree: treeWith(k, [{ icon: "extrude", label: "Name sign", sel: true, ex: "▸" }]) });
    }
    if (t >= 5.8) k.treeExtra = [...k.treeExtra.map((x) => ({ ...x, sel: false })), { icon: "extrude", label: "Name sign", ex: "▸" }];
  } });
  const signMat = { sw: vp.swMat(), prev: vp.previewMat() };

  // NAME (v4 opener): SCOTT HARRIS typed as sketch text letter by letter, then extruded into the sign
  const nameShot = { t: V(0, 385, 0), dist: 3100, az: 8, el: 6, fov: 16, roll: 0, centre: 1 };
  const typeCues = []; for (let i = 0; i < 12; i++) typeCues.push([0.95 + i * 0.075, "type"]);
  beats.push({ id: "name", dur: 3.9, cues: [[0.85, "click"], ...typeCues, [2.1, "click"], [2.5, "click"], [3.25, "click"], [3.3, "ok"]], update(t) {
    camTo(nameShot, t, 0, 1.3);
    drift(0.2);
    sign.visible = true;
    const typed = Math.round(12 * seg(t, 0.9, 1.8)), eOn = t >= 2.5;
    // outline letters appear as they are typed (one child per letter outline/hole, in text order)
    const kids = signOutline.children, nShow = Math.round(kids.length * typed / 12);
    signOutline.visible = t >= 0.9 && t < 2.5;
    kids.forEach((l, i) => { l.visible = i < nShow; l.material.color.set(t >= 2.1 ? C.black : C.sketchBlue); });
    if (signMesh) { const d = eOn ? lerp(1, 30, ease.out(seg(t, 2.5, 3.2))) : 0; signMesh.visible = signEdges.visible = eOn; signReal.visible = false; signMesh.scale.z = signEdges.scale.z = d; signMesh.material = eOn && t < 3.3 ? signMat.prev : signMat.sw; }
    if (t >= 0.9 && t < 2.5) {
      sketchUI("Sketch1", t >= 2.1 ? "Fully Defined" : "Under Defined", { panel: t < 2.1 ? "pm" : "tree", pm: "Sketch Text", pmDepth: "SCOTT HARRIS".slice(0, typed), cmdTab: "Sketch", tree: treeWith(k, [{ icon: "sk", label: t >= 2.1 ? "Sketch1" : "(-) Sketch1" }]) });
    } else if (eOn && t < 3.3) {
      ui.set({ panel: "pm", pm: "Boss-Extrude", pmDepth: (30 * ease.out(seg(t, 2.5, 3.2))).toFixed(2) + "mm", cmdDis: true, pressed: "Instant3D", flyout: "Scott Harris (Default) &lt;&lt;D...", confirm: "feature", title: "Scott Harris.SLDPRT *", tree: treeWith(k, [{ icon: "sk", label: "Sketch1" }]) });
    } else if (t >= 3.3) {
      ui.set({ tree: treeWith(k, [{ icon: "extrude", label: "Name sign", sel: true, ex: "▸" }]), title: "Scott Harris.SLDPRT *", statr: statR("", "Editing Part"), hint: "" });
    } else ui.set({ tree: treeWith(k, []), statr: statR("", "Editing Part") });
    if (k.cur && t < 0.9) ui.set({ cursor: { x: lerp(1180, 1010, ease.io(seg(t, 0.1, 0.8))), y: lerp(640, 330, ease.io(seg(t, 0.1, 0.8))), kind: "arrow" } });
    if (t >= 3.3) k.treeExtra = [...(k.treeExtra || []), { icon: "extrude", label: "Name sign", ex: "▸" }];
  } });

  // the signed gold CD, finished, for later beats to hang on the wall (p: 0..1 drop-in)
  k.cdFinal = (p = 1) => {
    cd.visible = true; cdSW.visible = cdEdges.visible = false; cdReal.visible = true; hook.visible = true;
    skO.visible = skI.visible = contour.visible = cpt.visible = prev.visible = prevTop.visible = prevTopIn.visible = false;
    drawCD(1, 1);
    const e = ease.out(p); cd.position.copy(SLOT.cd).setZ(6 + (1 - e) * 220); cd.rotation.z = (1 - e) * 0.25;
  };

  // 4 GRAPH PAPER: pinned paper, a pencil nacelle drawn by hand, then traced as a blue sketch
  const graphShot = { t: SLOT.graph.clone().add(V(0, -5, 20)), dist: 1500, az: 14, el: 10, fov: 16, roll: 0, centre: 1 };
  beats.push({ id: "graph", dur: 7.2, cues: [[5.08, "click"]], update(t) {
    camTo(graphShot, t, 0, 1.1);
    drift(0.2);
    paper.visible = true; nac.visible = false; fan.visible = false;
    const pp = seg(t, 1.0, 4.6);
    pencil.visible = pp > 0; pencilAxis.visible = t > 0.6;
    if (pencilAxis.visible) vp.setLine(pencilAxis, [V(-140, AX, 0.9), V(lerp(-140, 140, ease.io(seg(t, 0.6, 1.0))) + 0.01, AX, 0.9)]);
    if (pencil.visible) { const pts = pencilPts(0); const n = Math.max(2, Math.floor(pts.length * ease.io(pp))); vp.setLine(pencil, pts.slice(0, n)); }
    const tr = t >= 5.0;
    // SolidWorks trace: the centreline first, then the profile line by line
    const ax = ease.io(seg(t, 5.0, 5.35)), pr = seg(t, 5.4, 6.7);
    skAxis.visible = tr; skProfile.visible = pr > 0;
    if (tr) vp.setLine(skAxis, [V(-140, AX, 1.4), V(lerp(-140, 140, Math.max(0.01, ax)), AX, 1.4)]);
    const full = profile.map(([x, y]) => V(x, AX + y, 1.4)).concat([V(profile[0][0], AX + profile[0][1], 1.4)]);
    const nP = Math.max(2, Math.min(full.length, Math.floor(full.length * pr) + 1));
    if (pr > 0) vp.setLine(skProfile, pr >= 1 ? full : full.slice(0, nP));
    skProfile.material.color.set(C.sketchBlue); skAxis.material.color.set(C.sketchBlue);
    if (tr) { sketchUI("Sketch2", "Under Defined", { tree: treeWith(k, [{ icon: "sk", label: "(-) Sketch2" }]), pressed: pr < 1 ? "Line" : "" }); }
    else ui.set({ tree: treeWith(k, []), statr: statR("", "Editing Part") });
    if (k.cur && tr) {
      const tip = pr <= 0 ? V(lerp(-140, 140, ax), AX, 1.4) : pr < 1 ? full[nP - 1] : V(60, AX + 63, 1.4);
      const P = vp.project(paper.position.clone().add(tip).add(V(0, 0, 0.6))); ui.set({ cursor: { x: P.x, y: P.y, kind: "pencil" } });
      if (pr >= 1) for (const q of [[-115, 50], [0, 64], [115, 47]]) vp.rel(paper.position.clone().add(V(q[0], AX + q[1] + 8, 2)), "↗");
    }
  } });

  // 5 IT CLICKED: blue → black in one frame, then a half revolve out of the wall, then RealView
  const engShot = { t: SLOT.graph.clone().add(V(10, -55, 50)), dist: 1650, az: 36, el: 11, fov: 16, roll: 0, centre: 1 };
  beats.push({ id: "clicked", dur: 4.6, cues: [[0.06, "snap"], [0.7, "click"], [2.72, "click"], [2.77, "ok"]], update(t) {
    camTo(engShot, t, 0.55, 2.4, ease.io);
    drift(0.3);
    paper.visible = true; pencil.visible = pencilAxis.visible = true; vp.setLine(pencil, pencilPts(0)); vp.setLine(pencilAxis, [V(-140, AX, 0.9), V(140, AX, 0.9)]);
    vp.setLine(skAxis, [V(-140, AX, 1.4), V(140, AX, 1.4)]); vp.setLine(skProfile, profile.map(([x, y]) => V(x, AX + y, 1.4)).concat([V(profile[0][0], AX + profile[0][1], 1.4)]));
    const black = t >= 0.06;
    const rev = t >= 0.7, done = t >= 2.75;
    skProfile.visible = skAxis.visible = !done;
    skProfile.material.color.set(rev ? C.orange : black ? C.black : C.sketchBlue); skAxis.material.color.set(black ? C.black : C.sketchBlue);
    nac.visible = rev; fan.visible = done;
    if (rev) setNacelle(Math.max(0.05, Math.PI * ease.io(seg(t, 0.8, 2.3))), done ? "real" : "prev");
    if (!rev) sketchUI("Sketch2", black ? "Fully Defined" : "Under Defined", { tree: treeWith(k, [{ icon: "sk", label: black ? "Sketch2" : "(-) Sketch2" }]) });
    else if (!done) ui.set({ panel: "pm", pm: "Revolve", pmDepth: (180 * ease.io(seg(t, 0.8, 2.3))).toFixed(2) + "deg", cmdDis: true, flyout: "Scott Harris (Default) &lt;&lt;D...", confirm: "feature", tree: treeWith(k, [{ icon: "sk", label: "Sketch2" }]) });
    else ui.set({ tree: treeWith(k, [{ icon: "revolve", label: "Revolve1", sel: true, ex: "▸" }]), hint: "RealView Graphics", title: "Scott Harris.SLDPRT *", statr: statR("", "Editing Part") });
    if (rev) ui.set({ title: "Scott Harris.SLDPRT *" });
    if (done) pencil.visible = false;
    if (k.cur && t < 0.7) { const P = vp.project(paper.position.clone().add(V(60, AX + 63, 2))); ui.set({ cursor: { x: P.x, y: P.y, kind: "pencil" } }); }
    if (done) k.treeExtra = [...k.treeExtra, { icon: "revolve", label: "Revolve1", ex: "▸" }];
  } });

  return beats;
}
