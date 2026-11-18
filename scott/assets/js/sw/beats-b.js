// Beats: the 1995 PC, $310M (sold), Cosmic Blobs, Onshape, collab + $470M, Schneider $22.6B, and k.osHome()
// (the Onshape window minimising into the tablet on the wall). The Olin beat is kept but unused since v4.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { treeWith, statR } from "./beats-a.js";
import { installOnshape, cursorHTML, FOUNDERS, AJ, drawSW95, drawOnshapeScreen } from "./onshape.js";

const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);

export default function beatsB(k) {
  const { vp, ui, W, SLOT, ease, seg, lerp, lerpRig, C } = k;
  installOnshape(ui);

  const camTo = (shot, t, a, b, e = ease.cam) => lerpRig(vp, k.cam0, shot, e(seg(t, a, b)));
  const drift = (deg = 0.3) => { if (k.cur) vp.rig.az += Math.min(k.hold, 20) * deg; };
  const sketchUI = (skName, def, extra = {}) => ui.set({ cmdTab: "Sketch", title: `${skName} of Scott Harris *`, confirm: "sketch", statr: statR(def, `Editing ${skName}`, ["-612.40mm", "-150.00mm", "118.25mm"]), ...extra });
  const pmUI = (pm, depth, extra = {}) => ui.set({ panel: "pm", pm, pmDepth: depth, cmdDis: true, pressed: "Instant3D", flyout: "Scott Harris (Default) &lt;&lt;D...", confirm: "feature", ...extra });

  // a big Century Gothic dimension, drawn like the real thing (extension lines, arrows, text on the line)
  function bigDim(a, b, off, label, sub, size = 56) {
    const A = vp.project(a), B = vp.project(b), A2 = vp.project(a.clone().add(off)), B2 = vp.project(b.clone().add(off));
    const ext = (P, Q) => { const dx = Q.x - P.x, dy = Q.y - P.y, L = Math.hypot(dx, dy) || 1; return `M${P.x + dx / L * 6} ${P.y + dy / L * 6} L${Q.x + dx / L * 14} ${Q.y + dy / L * 14}`; };
    const arr = (T, F) => { const dx = T.x - F.x, dy = T.y - F.y, L = Math.hypot(dx, dy) || 1, u = dx / L, w = dy / L; return `<path d="M${T.x} ${T.y} L${T.x - u * 20 - w * 6} ${T.y - w * 20 + u * 6} L${T.x - u * 20 + w * 6} ${T.y - w * 20 - u * 6}Z" fill="#000"/>`; };
    const mx = (A2.x + B2.x) / 2, my = (A2.y + B2.y) / 2;
    const gap = label.length * size * 0.31 + 18, dx = B2.x - A2.x, dy = B2.y - A2.y, L = Math.hypot(dx, dy), u = dx / L, w = dy / L;
    vp.svg(`<path d="${ext(A, A2)} ${ext(B, B2)}" stroke="#000" stroke-width="1.6" fill="none"/><path d="M${A2.x} ${A2.y} L${mx - u * gap} ${my - w * gap} M${mx + u * gap} ${my + w * gap} L${B2.x} ${B2.y}" stroke="#000" stroke-width="1.6"/>${arr(A2, B2)}${arr(B2, A2)}`);
    vp.html(`<div class="mega" style="left:${mx}px;top:${my}px;font-size:${size}px">${label}${sub ? `<small>${sub}</small>` : ""}</div>`);
    return { x: mx, y: my };
  }
  // SolidWorks note with a leader
  function note(textHTML, tx, ty, target) {
    const P = vp.project(target);
    vp.svg(`<path d="M${tx - 8} ${ty + 16} L${P.x} ${P.y}" stroke="#000" stroke-width="1.5"/><circle cx="${P.x}" cy="${P.y}" r="4" fill="#000"/>`);
    vp.html(`<div class="swnote" style="left:${tx}px;top:${ty}px">${textHTML}</div>`);
  }

  // =====================================================================================
  // 6 PC: a beige 1995 desktop on the shelf, built feature by feature, then RealView + SolidWorks 95 on screen
  // =====================================================================================
  const pc = W.group("pc"); pc.position.copy(SLOT.pc);
  const beige = new THREE.MeshPhysicalMaterial({ color: 0xD9CFB2, roughness: 0.55, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const beigeDk = new THREE.MeshPhysicalMaterial({ color: 0xBDB295, roughness: 0.6 });
  const darkPl = new THREE.MeshStandardMaterial({ color: 0x2E2C29, roughness: 0.5 });
  const scr = document.createElement("canvas"); scr.width = 640; scr.height = 480; drawSW95(scr);
  const scrTex = new THREE.CanvasTexture(scr); scrTex.colorSpace = THREE.SRGBColorSpace; scrTex.anisotropy = 8;
  const scrMat = new THREE.MeshStandardMaterial({ map: scrTex, emissive: 0xffffff, emissiveMap: scrTex, emissiveIntensity: 0.85, roughness: 0.15, metalness: 0 });
  const scrOff = new THREE.MeshStandardMaterial({ color: 0x23292B, roughness: 0.1, metalness: 0.2 });
  // parts: [name, sharp size, rounded radius, position (centre), grow axis]
  const PARTS = [
    { n: "tower", s: [120, 300, 210], r: 8, p: [-150, 150, 118], ax: "y" },
    { n: "back", s: [230, 200, 105], r: 16, p: [60, 130, 58], ax: "z" },
    { n: "bezel", s: [300, 260, 56], r: 10, p: [60, 150, 136], ax: "z" },
    { n: "stand", s: [150, 20, 120], r: 4, p: [60, 10, 100], ax: "y" },
    { n: "kbd", s: [300, 16, 62], r: 4, p: [60, 8, 200], ax: "y" },
  ];
  for (const P of PARTS) {
    const g = new THREE.Group(); g.position.set(...P.p); pc.add(g);
    const sharp = new THREE.BoxGeometry(...P.s), round = new RoundedBoxGeometry(...P.s, 4, P.r);
    P.g = g; P.sw = new THREE.Mesh(sharp, vp.swMat()); P.swR = new THREE.Mesh(round, vp.swMat());
    P.e = vp.edges(sharp, 0x000000, 1.3); P.eR = vp.edges(round, 0x000000, 1.1, 40);
    P.real = new THREE.Mesh(round, P.n === "kbd" || P.n === "stand" ? beigeDk : beige);
    P.prev = new THREE.Mesh(sharp, vp.previewMat());
    for (const m of [P.sw, P.swR, P.real]) { m.castShadow = true; m.receiveShadow = true; }
    g.add(P.sw, P.swR, P.e, P.eR, P.real, P.prev);
  }
  const P_ = Object.fromEntries(PARTS.map((p) => [p.n, p]));
  // screen + front details
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(240, 180), scrMat); screen.position.set(60, 155, 164.6); pc.add(screen);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(240, 180), new THREE.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.05, metalness: 0, clearcoat: 1 })); glass.position.set(60, 155, 165.2); pc.add(glass);
  const details = new THREE.Group(); pc.add(details);
  { const bay = (w, h, y) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 3), darkPl); m.position.set(-150, y, 224.5); details.add(m); };
    bay(96, 22, 250); bay(60, 8, 214); const btn = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 4, 24), beigeDk); btn.rotation.x = Math.PI / 2; btn.position.set(-150, 60, 224.5); details.add(btn);
    const led = new THREE.Mesh(new THREE.CircleGeometry(2.4, 16), new THREE.MeshBasicMaterial({ color: 0x3BE36B })); led.position.set(-122, 60, 223.6); details.add(led);
    const mled = led.clone(); mled.position.set(185, 36, 164.5); details.add(mled);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 15; c++) { const key = new THREE.Mesh(new THREE.BoxGeometry(15, 4, 11), beige); key.position.set(-50 + c * 16, 17, 180 + r * 12.5); details.add(key); }
  }
  const towerSketch = vp.line([V(-210, 0.5, 13), V(-90, 0.5, 13), V(-90, 0.5, 223), V(-210, 0.5, 223), V(-210, 0.5, 13)], C.sketchBlue, 2.2); pc.add(towerSketch);

  const pcShot = { t: V(-455, -25, 110), dist: 2200, az: 27, el: 6, fov: 16, roll: 0, centre: 1 };
  const pcDim = { t: V(-470, -70, 120), dist: 2650, az: 22, el: 9, fov: 16, roll: 0, centre: 1 };
  const growAt = (P, a, b, t) => {          // Instant3D-style grow along an axis from its base
    const p = ease.out(seg(t, a, b)), s = Math.max(0.001, p), g = P.g;
    g.scale.set(1, 1, 1); g.scale[P.ax] = s;
    const base = { x: 0, y: P.p[1] - P.s[1] / 2, z: P.p[2] - P.s[2] / 2 }[P.ax];
    g.position.set(...P.p); if (P.ax === "y") g.position.y = base + P.s[1] / 2 * s; if (P.ax === "z") g.position.z = base + P.s[2] / 2 * s;
    return p;
  };

  // =====================================================================================
  // 7 COSMIC BLOBS: the real patent figure pinned up, then a goofy purple blob inflates on the shelf
  // =====================================================================================
  const blob = W.group("blob"); blob.position.copy(SLOT.blob).add(V(0, 0, 112));
  const blobGeo = new THREE.SphereGeometry(1, 128, 80);
  { const p = blobGeo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const a = Math.atan2(y, x), pl = Math.hypot(x, y);
      const R = 1 + 0.62 * Math.pow(0.5 + 0.5 * Math.cos(6 * (a - Math.PI / 6)), 2.4); const Rp = 1 + (R - 1) * Math.pow(pl, 1.6);
      p.setXYZ(i, x * 52 * Rp, y * 52 * Rp, z * 40 * (1 - 0.18 * (Rp - 1))); }
    blobGeo.computeVertexNormals(); }
  const blobMat = new THREE.MeshPhysicalMaterial({ color: 0x8A3FE0, roughness: 0.32, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.12, sheen: 0.4, sheenColor: 0xff9be6 });
  const blobBody = new THREE.Mesh(blobGeo, blobMat); blobBody.castShadow = true;
  const blobCore = new THREE.Group(); blob.add(blobCore); blobCore.add(blobBody);
  const white = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.2, clearcoat: 1 }), black = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 });
  const eyes = [];
  for (const [x, y, r] of [[-17, 18, 17], [19, 22, 14]]) { const e = new THREE.Group(); const w = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), white); const pu = new THREE.Mesh(new THREE.SphereGeometry(r * 0.45, 24, 16), black); pu.position.set(r * 0.12, -r * 0.1, r * 0.72); e.add(w, pu); e.position.set(x, y, 34); blobCore.add(e); eyes.push(e); }
  const mouth = new THREE.Mesh(new THREE.TorusGeometry(13, 2.8, 12, 32, Math.PI * 0.8), new THREE.MeshStandardMaterial({ color: 0x2A0C3F, roughness: 0.4 })); mouth.rotation.z = Math.PI * 1.1; mouth.position.set(2, -6, 38); blobCore.add(mouth);
  const cheekM = new THREE.MeshStandardMaterial({ color: 0xFF7EC8, roughness: 0.6 });
  for (const x of [-30, 32]) { const ch = new THREE.Mesh(new THREE.SphereGeometry(6, 16, 12), cheekM); ch.scale.set(1, 0.6, 0.3); ch.position.set(x, -4, 36); blobCore.add(ch); }
  // the patent sheet, pinned above the shelf
  const pat = W.group("patent"); pat.position.set(180, -22, 0.8);
  const patTex = new THREE.TextureLoader().load("../assets/img/patent-cosmicblobs-fig1.png"); patTex.colorSpace = THREE.SRGBColorSpace; patTex.anisotropy = 8;
  k.assets.push(new Promise((ok) => { const i = new Image(); i.onload = ok; i.onerror = ok; i.src = "../assets/img/patent-cosmicblobs-fig1.png"; }));
  const patMesh = new THREE.Mesh(new THREE.PlaneGeometry(196, 212), new THREE.MeshStandardMaterial({ map: patTex, roughness: 0.95 })); patMesh.receiveShadow = true; pat.add(patMesh);
  for (const [x, y] of [[-88, 96], [88, 96]]) { const tack = new THREE.Mesh(new THREE.SphereGeometry(4.5, 16, 12), new THREE.MeshStandardMaterial({ color: 0x2E86DE, roughness: 0.35 })); tack.position.set(x, y, 3); tack.castShadow = true; pat.add(tack); }
  const blobShot = { t: V(25, -45, 90), dist: 2150, az: 14, el: 7, fov: 16, roll: 0, centre: 1 };

  // =====================================================================================
  // 8-10 ONSHAPE: a separate "part studio" far off to the side, where six founders build a tablet together
  // =====================================================================================
  const OS = V(6000, 0, 0);
  const os = W.group("onshape-part"); os.position.copy(OS);
  const osMat = new THREE.MeshStandardMaterial({ color: 0x7B848B, roughness: 0.55, metalness: 0.15, envMapIntensity: 0.6 });
  const tabSharp = new THREE.BoxGeometry(280, 196, 12), tabRound = new RoundedBoxGeometry(280, 196, 12, 6, 14);
  const osSlab = new THREE.Mesh(tabSharp, osMat), osSlabR = new THREE.Mesh(tabRound, osMat);
  const osE = vp.edges(tabSharp, 0x2B3238, 1.4), osER = vp.edges(tabRound, 0x2B3238, 1.2, 40);
  const pocketGeo = new RoundedBoxGeometry(244, 166, 4, 4, 4);
  const osPocket = new THREE.Mesh(pocketGeo, new THREE.MeshStandardMaterial({ color: 0x486778, roughness: 0.4 })); osPocket.position.z = 5;
  const osPocketE = vp.edges(pocketGeo, 0x2B3238, 1.1, 40); osPocketE.position.z = 5;
  const cam = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 2, 24), new THREE.MeshStandardMaterial({ color: 0x2B3238 })); cam.rotation.x = Math.PI / 2; cam.position.set(0, 90, 6.5);
  const osSk = vp.line([V(-140, -98, 6.5), V(140, -98, 6.5), V(140, 98, 6.5), V(-140, 98, 6.5), V(-140, -98, 6.5)], 0x2D6FD6, 2.4);
  const osSk2 = vp.line([V(-122, -83, 6.5), V(122, -83, 6.5), V(122, 83, 6.5), V(-122, 83, 6.5), V(-122, -83, 6.5)], 0x2D6FD6, 2.2);
  const osTilt = new THREE.Group(); os.add(osTilt); osTilt.rotation.set(-0.35, 0.45, 0.05);
  osTilt.add(osSlab, osSlabR, osE, osER, osPocket, osPocketE, cam, osSk, osSk2);
  // coloured selection edges per founder (what each one is working on)
  const selLines = FOUNDERS.map((f, i) => {
    const segs = [[V(-140, -98, 6.4), V(140, -98, 6.4)], [V(140, -98, 6.4), V(140, 98, 6.4)], [V(-140, 98, 6.4), V(140, 98, 6.4)], [V(-122, -83, 6), V(122, -83, 6)], [V(-140, -98, 6.4), V(-140, 98, 6.4)], [V(-122, 83, 6), V(122, 83, 6)]][i];
    const l = vp.line(segs, new THREE.Color(f.c).getHex(), 4.5); osTilt.add(l); return l;
  });
  const osShot = { t: OS.clone().add(V(10, -5, 0)), dist: 1650, az: 0, el: 0, fov: 18, roll: 0, centre: 1 };
  // where each founder's cursor points (local tablet points) and how they wander
  const CUR = [V(-120, -70, 7), V(110, 80, 7), V(60, -96, 7), V(-60, 40, 7), V(138, -10, 7), V(0, 88, 7)];
  const osPt = (v) => { os.updateMatrixWorld(true); return vp.project(osTilt.localToWorld(v.clone())); };

  // the tablet that ends up on Scott's wall: Onshape on a screen ("CAD anywhere")
  const tab = W.group("tablet"); tab.position.copy(SLOT.tablet).add(V(0, 0, 10)); tab.rotation.z = -0.04;
  const tabC = document.createElement("canvas"); tabC.width = 768; tabC.height = 512; drawOnshapeScreen(tabC);
  const tabTex = new THREE.CanvasTexture(tabC); tabTex.colorSpace = THREE.SRGBColorSpace; tabTex.anisotropy = 8;
  const tabBody = new THREE.Mesh(new RoundedBoxGeometry(280, 196, 10, 6, 14), new THREE.MeshPhysicalMaterial({ color: 0x2A2D31, roughness: 0.35, metalness: 0.6, clearcoat: 0.6 }));
  tabBody.castShadow = true;
  const tabScr = new THREE.Mesh(new THREE.PlaneGeometry(250, 170), new THREE.MeshStandardMaterial({ map: tabTex, emissive: 0xffffff, emissiveMap: tabTex, emissiveIntensity: 0.9, roughness: 0.08 })); tabScr.position.z = 5.2;
  const tabHook1 = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 30, 12), new THREE.MeshStandardMaterial({ color: 0xC9CCD2, metalness: 0.9, roughness: 0.3 })); tabHook1.rotation.x = Math.PI / 2; tabHook1.position.set(-90, -103, -6);
  const tabHook2 = tabHook1.clone(); tabHook2.position.x = 90;
  tab.add(tabBody, tabScr, tabHook1, tabHook2);
  const tabShot = { t: SLOT.tablet.clone().add(V(-40, -65, 20)), dist: 1900, az: -12, el: 6, fov: 16, roll: 0, centre: 1 };

  // Onshape feature list by step
  const FEATS = [
    { n: "Sketch 1", by: 0, icon: "✎" }, { n: "Extrude 1", by: 2, icon: "▣" }, { n: "Fillet 1", by: 5, icon: "◜" },
    { n: "Sketch 2", by: 3, icon: "✎" }, { n: "Extrude 2", by: 4, icon: "▣" }, { n: "Hole 1", by: 1, icon: "◎" },
  ];
  const FT = [1.0, 1.55, 2.15, 2.7, 3.2, 3.75];      // when each founder's feature lands (beat 8)
  function setOnshapePart(t, tCur) {                   // geometry state at beat-8 time t (persisting afterwards)
    os.visible = true;
    const n = FT.filter((x) => t >= x).length;
    osSk.visible = n === 1; osSk.material.color.set(0x2D6FD6);
    const rect = (l, w, h, p) => { const x = lerp(-w, w, Math.max(0.02, p)), y = lerp(-h, h, Math.max(0.02, p)); vp.setLine(l, [V(-w, -h, 6.5), V(x, -h, 6.5), V(x, y, 6.5), V(-w, y, 6.5), V(-w, -h, 6.5)]); };
    if (n === 1) rect(osSk, 140, 98, ease.out(seg(t, FT[0], FT[0] + 0.35)));
    if (n === 4) rect(osSk2, 122, 83, ease.out(seg(t, FT[3], FT[3] + 0.3)));
    const slab = n >= 2, round = n >= 3;
    osSlab.visible = osE.visible = slab && !round; osSlabR.visible = osER.visible = round;
    osSk2.visible = n === 4; osPocket.visible = osPocketE.visible = n >= 5; cam.visible = n >= 6;
    selLines.forEach((l, i) => { l.visible = tCur !== null && t >= 0.7 + i * 0.25; l.material.opacity = 0.9; });
    return n;
  }
  function osState(extra) {                      // base Onshape chrome state
    return Object.assign({ feats: [], parts: [], avatars: [] }, extra);
  }
  const featList = (n, sel = -1) => FEATS.slice(0, n).map((f, i) => ({ n: f.n, icon: f.icon, by: FOUNDERS[f.by], sel: i === sel }));

  // =====================================================================================
  const beats = [];

  // 6 PC (body shared by "pc" and "sold": the dimension only shows from t = 5.0 on, which only "sold" reaches)
  function pcBody(t) {
    camTo(t < 4.4 ? pcShot : pcDim, t, t < 4.4 ? 0 : 4.4, t < 4.4 ? 1.1 : 5.4, ease.io);
    if (t >= 4.4) lerpRig(vp, pcShot, pcDim, ease.io(seg(t, 4.4, 5.4)));
    drift(0.2);
    pc.visible = true;
    const real = t >= 3.85, fil = t >= 3.25;
    // tower: sketch → extrude (Instant3D), then monitor, stand, keyboard pop as more extrudes
    towerSketch.visible = t >= 0.5 && t < 1.4; towerSketch.material.color.set(t >= 1.1 ? C.orange : C.sketchBlue);
    if (towerSketch.visible) { const p = ease.out(seg(t, 0.5, 0.85)), x1 = lerp(-210, -90, Math.max(0.02, p)), z1 = lerp(13, 223, Math.max(0.02, p));   // rectangle tool: corner to corner
      vp.setLine(towerSketch, [V(-210, 0.5, 13), V(x1, 0.5, 13), V(x1, 0.5, z1), V(-210, 0.5, z1), V(-210, 0.5, 13)]); }
    const steps = [["tower", 1.3, 1.9], ["stand", 1.95, 2.15], ["back", 2.15, 2.45], ["bezel", 2.45, 2.75], ["kbd", 2.8, 3.1]];
    for (const [n, a, b] of steps) {
      const P = P_[n]; const on = t >= a; P.g.visible = on;
      if (!on) continue;
      const p = growAt(P, a, b, t), building = t < b + 0.12;
      P.prev.visible = building; P.sw.visible = P.e.visible = !building && !fil; P.swR.visible = P.eR.visible = fil && !real; P.real.visible = real;
      P.e.material.color.set(t >= 3.0 && t < 3.25 ? C.orange : 0x000000);
    }
    screen.visible = true; screen.material = real ? scrMat : scrOff; glass.visible = real; details.visible = real;
    if (!(t >= 2.75)) screen.visible = false;
    // ---- UI ----
    const tree = (x) => ui.set({ tree: treeWith(k, x) });
    if (t < 0.5) { tree([]); ui.set({ statr: statR("", "Editing Part") }); }
    else if (t < 1.3) { sketchUI("Sketch3", t >= 1.0 ? "Fully Defined" : "Under Defined"); tree([{ icon: "sk", label: t >= 1.0 ? "Sketch3" : "(-) Sketch3" }]);
      if (k.cur) { const c = vp.project(pc.position.clone().add(V(-150, 1, 118))); vp.dimLinear(pc.position.clone().add(V(-210, 1, 223)), pc.position.clone().add(V(-90, 1, 223)), V(0, 0, 40), "120.00"); ui.set({ cursor: { x: c.x + 60, y: c.y + 30, kind: "pencil" } }); } }
    else if (t < 3.25) {
      const which = t < 1.95 ? "300.00mm" : t < 2.8 ? "260.00mm" : "16.00mm";
      pmUI("Boss-Extrude", t < 1.95 ? (300 * ease.out(seg(t, 1.3, 1.9))).toFixed(2) + "mm" : which);
      tree([{ icon: "sk", label: "Sketch3" }, ...(t >= 1.95 ? [{ icon: "extrude", label: "Boss-Extrude3" }] : []), ...(t >= 2.8 ? [{ icon: "extrude", label: "Boss-Extrude4" }] : [])]);
      if (k.cur && t < 1.95) { const h = 300 * ease.out(seg(t, 1.3, 1.9)); const P = vp.project(pc.position.clone().add(V(-150, h + 2, 118))); vp.tip(P.x + 22, P.y - 6, `Direction 1: Blind (${h.toFixed(2)}mm)`); ui.set({ cursor: { x: P.x, y: P.y, kind: "hand" } }); }
      if (t >= 3.0) { ui.set({ pm: "Fillet", pmDepth: "8.00mm" }); }
    } else if (t < 3.85) { pmUI("Fillet", "8.00mm", { pressed: "" }); tree([{ icon: "extrude", label: "Boss-Extrude3" }, { icon: "extrude", label: "Boss-Extrude4" }]); }
    else { tree([{ icon: "extrude", label: "Boss-Extrude3" }, { icon: "extrude", label: "Boss-Extrude4" }, { icon: "fillet", label: "Fillet1", sel: t < 4.6 }]); ui.set({ hint: "RealView Graphics", statr: statR("", "Editing Part") }); }
    // the price of it, as a Smart Dimension across the front of the shelf
    if (k.cur && t >= 5.0) {
      const a = pc.position.clone().add(V(-210, -12, 245)), b = pc.position.clone().add(V(215, -12, 245));
      if (t < 5.7) { const E = vp.project(pc.position.clone().add(V(0, -92, 245))); ui.set({ modify: { x: E.x + 120, y: E.y - 70, value: t < 5.35 ? "310,000,000" : "$310,000,000", name: "D1@Dassault, 1997" } }); bigDim(a, b, V(0, -80, 0), "$310,000,000", "", 48); }
      else bigDim(a, b, V(0, -80, 0), "$310,000,000", "Dassault Systèmes, 1997", 60);
    }
  }
  beats.push({ id: "pc", dur: 4.4, update(t) {
    pcBody(t);
    if (t >= 3.85) k.treeExtra = [...(k.treeExtra || []), { icon: "extrude", label: "Boss-Extrude3", ex: "▸" }, { icon: "extrude", label: "Boss-Extrude4", ex: "▸" }, { icon: "fillet", label: "Fillet1" }];
  } });
  beats.push({ id: "sold", dur: 2.3, cues: [[0.6, "click"], [0.72, "type"], [0.8, "type"], [0.88, "type"], [0.96, "type"], [1.28, "ok"]], update(t) {
    pcBody(4.4 + t);
    ui.set({ tree: treeWith(k, []), hint: "RealView Graphics", statr: statR("", "Editing Part") });
  } });

  // 7 COSMIC BLOBS
  beats.push({ id: "blobs", dur: 6.4, update(t) {
    camTo(blobShot, t, 0, 1.3, ease.io);
    drift(0.25);
    pc.visible = true;
    pat.visible = t >= 1.7;
    if (pat.visible) { const d = ease.out(seg(t, 1.7, 2.05)); pat.position.z = 0.8 + (1 - d) * 60; pat.rotation.z = (1 - d) * 0.08; } else { pat.position.z = 0.8; pat.rotation.z = 0; }
    const inf = seg(t, 3.5, 4.35), on = t >= 3.5;
    blob.visible = on;
    if (on) {
      const s = inf < 1 ? Math.max(0.02, ease.out(inf) * 1.06) : 1 + Math.sin(Math.min(k.hold + t - 4.35, 40) * 7) * Math.exp(-(t - 4.35) * 3) * 0.06;
      const L = k.live || 0, wob = inf >= 1 ? 1 : 0;
      blobCore.scale.set(s * (1 + wob * 0.025 * Math.sin(L * 3.1)), s * (1 + wob * 0.03 * Math.sin(L * 3.1 + 1.6)), s);
      blobCore.position.set(0, 74 * s, 0); blobCore.rotation.z = wob * 0.05 * Math.sin(L * 1.7);
      for (const e of eyes) e.scale.setScalar(t > 5.6 && t < 5.75 ? 0.15 : 1);   // a blink
    }
    if (on) ui.set({ tree: treeWith(k, [{ icon: "sk", label: "Sketch Picture1" }, { icon: "part", label: "Cosmic Blob", sel: true }]), hint: "RealView Graphics" });
    else if (pat.visible) ui.set({ tree: treeWith(k, [{ icon: "sk", label: "Sketch Picture1", sel: true }]) });
    else ui.set({ tree: treeWith(k, []) });
    if (k.cur && pat.visible) {
      const T = vp.project(pat.position.clone().add(V(98, 60, 2)));
      note(`US 7,936,352 B2<br><span style="font-size:20px;color:#333">Fig. 1 · “Cosmic Blobs 0.5.197”</span>`, T.x - 420, T.y - 150, pat.position.clone().add(V(-98, 70, 2)));
    }
    if (k.cur && t >= 4.7) { const B = vp.project(blob.position.clone().add(V(60, 40, 0))); note(`Cosmic Blobs<br><span style="font-size:20px;color:#333">3D design for kids, 2004</span>`, B.x - 420, B.y + 190, blob.position.clone().add(V(-40, -40, 20))); }
    if (t >= 4.4) k.treeExtra = [...(k.treeExtra || []), { icon: "sk", label: "Sketch Picture1" }, { icon: "part", label: "Cosmic Blob" }];
  } });

  // 8 ONSHAPE
  beats.push({ id: "onshape", dur: 7.6, update(t) {
    if (!k.cur) return;
    // camera lives at the Onshape part studio for this beat
    vp.rig.t.copy(osShot.t); Object.assign(vp.rig, { dist: osShot.dist * (1.04 - 0.04 * ease.out(seg(t, 0, 7))) , az: osShot.az + Math.sin(Math.min(t + k.hold, 40) * 0.25) * 4, el: osShot.el, fov: osShot.fov, roll: 0, centre: 1 });
    const n = setOnshapePart(t, t);
    ui.set({ swHidden: true });
    let html = "";
    if (t < 0.45) html += `<div class="os-load" style="width:${Math.round(1920 * ease.out(seg(t, 0, 0.45)))}px"></div>`;
    // founders join one by one
    const joined = FOUNDERS.filter((_, i) => t >= 0.5 + i * 0.22);
    joined.forEach((f, i) => {
      const P = osPt(CUR[i]); const L = (k.live || 0) + i;
      const wx = Math.sin(L * 1.3 + i) * 10, wy = Math.cos(L * 1.1 + i * 2) * 8;
      const enter = ease.out(seg(t, 0.5 + i * 0.22, 0.9 + i * 0.22));
      const fromX = [0, 1920, 1920, 0, 1920, 960][i], fromY = [600, 300, 900, 900, 600, 1080][i];
      const ft = FT[FEATS.findIndex((x) => x.by === i)];
      const pulse = ft !== undefined && t >= ft && t < ft + 0.45 ? (t - ft) / 0.45 : 0;
      html += cursorHTML(lerp(fromX, P.x + wx, enter), lerp(fromY, P.y + wy, enter), f, pulse);
    });
    // the three phrases, as they're said
    const chips = [];
    if (t >= 4.5) chips.push(`<span class="os-chip sw">SolidWorks</span>`);
    if (t >= 5.4) chips.push(`<span class="os-chip gd"><em>meets</em>Google Docs</span>`);
    if (t >= 6.3) chips.push(`<span class="os-chip gh"><em>meets</em>GitHub</span>`);
    if (chips.length) html += `<div class="os-chips">${chips.join("")}</div>`;
    if (t >= 6.3) html += versionsPanel(seg(t, 6.3, 7.3));
    ui.set({ os: osState({ feats: featList(n, n - 1), parts: n >= 2 ? ["Tablet"] : [], avatars: [{ ...FOUNDERS[5] }, ...joined.filter((f) => f.n !== "Scott")], html }) });
  } });

  // 9 COLLAB → $470M: cursors from around the world land on the same part, live
  const CITIES = [["Boston", "#1B7BD6", 8], ["Berlin", "#D81B60", 148], ["Tokyo", "#1E9E57", 34], ["São Paulo", "#E8A33A", 172], ["Bangalore", "#7B4FD6", 330],
    ["Detroit", "#0FA3A3", 196], ["Seoul", "#C0392B", 352], ["Munich", "#5D6D7E", 126], ["Toronto", "#D35400", 54], ["Shenzhen", "#16A085", 214]];
  beats.push({ id: "collab", dur: 6.2, update(t) {
    if (!k.cur) return;
    vp.rig.t.copy(osShot.t); Object.assign(vp.rig, { dist: osShot.dist * (1.0 - 0.06 * ease.io(seg(t, 0, 6))), az: osShot.az + Math.sin(Math.min(t + k.hold + 7.6, 60) * 0.25) * 4, el: osShot.el, fov: osShot.fov, roll: 0, centre: 1 });
    setOnshapePart(99, t);
    ui.set({ swHidden: true });
    let html = `<div class="os-chips" style="opacity:.35"><span class="os-chip sw">SolidWorks</span><span class="os-chip gd"><em>meets</em>Google Docs</span><span class="os-chip gh"><em>meets</em>GitHub</span></div>`;
    // engineers in other cities join and work on the same part at once
    const C0 = osPt(V(0, 0, 7));
    CITIES.forEach(([n, c, deg], i) => { const a = 0.2 + i * 0.17; if (t < a) return; const e = ease.out(seg(t, a, a + 0.5)); const L = (k.live || 0) + i * 1.7;
      const r = deg * Math.PI / 180, tx = C0.x + Math.cos(r) * (400 + (i % 3) * 45), ty = C0.y - Math.sin(r) * (250 + (i % 2) * 40);
      const fx = C0.x + Math.cos(r) * 1400, fy = C0.y - Math.sin(r) * 900;
      html += cursorHTML(lerp(fx, tx, e) + Math.sin(L * 1.2) * 9, lerp(fy, ty, e) + Math.cos(L) * 7, { n, c }, t >= a + 0.5 && t < a + 0.95 ? (t - a - 0.5) / 0.45 : 0); });
    if (t >= 2.2) html += `<div class="os-toast"><span class="os-av" style="background:#1B7BD6;margin:0">+</span>10 people editing “Scott Harris”</div>`;
    // founder cursors stay, a little sheepish
    FOUNDERS.forEach((f, i) => { const P = osPt(CUR[i]); const L = (k.live || 0) + i; html += cursorHTML(P.x + Math.sin(L * 1.3 + i) * 10, P.y + Math.cos(L * 1.1 + i * 2) * 8, f); });
    ui.set({ os: osState({ feats: featList(6), parts: ["Tablet"], avatars: [FOUNDERS[5], ...FOUNDERS.slice(0, 5), ...CITIES.slice(0, Math.min(4, Math.floor((t - 0.2) / 0.17) + 1)).filter(() => t >= 0.2).map(([n, c]) => ({ n, i: n.split(" ").map((w) => w[0]).join(""), c }))], html }) });
    // the deal, in Onshape's own dimension style
    if (t >= 3.6) dim470(lerp(30, 60, ease.out(seg(t, 3.6, 4.0))), t >= 4.2 ? "PTC, 2019" : "");
  } });
  function dim470(size, sub, label = "$470,000,000") {
    os.updateMatrixWorld(true);
    const a = osTilt.localToWorld(V(-140, -98, 6)), b = osTilt.localToWorld(V(140, -98, 6)), off = osTilt.localToWorld(V(0, -170, 6)).sub(osTilt.localToWorld(V(0, -98, 6)));
    return bigDim(a, b, off, label, sub, size);
  }

  // 9b SCHNEIDER: edit that same dimension to $22.6 billion; it runs off the screen as the camera pulls back
  beats.push({ id: "schneider", dur: 4.4, cues: [[0.3, "click"], [0.62, "type"], [0.7, "type"], [0.78, "type"], [0.86, "type"], [0.94, "type"], [1.02, "type"], [1.1, "type"], [1.18, "type"], [1.3, "ok"], [1.45, "snap"]], update(t) {
    if (!k.cur) return;
    const pull = ease.io(seg(t, 1.35, 3.2));
    vp.rig.t.copy(osShot.t); Object.assign(vp.rig, { dist: osShot.dist * lerp(0.94, 1.55, pull), az: osShot.az + Math.sin(Math.min(t + k.hold + 13.8, 60) * 0.25) * 4, el: osShot.el, fov: osShot.fov, roll: 0, centre: 1 });
    setOnshapePart(99, null);
    ui.set({ swHidden: true });
    let html = "";
    FOUNDERS.forEach((f, i) => { const P = osPt(CUR[i]); const L = (k.live || 0) + i; html += cursorHTML(P.x + Math.sin(L * 1.3 + i) * 10, P.y + Math.cos(L * 1.1 + i * 2) * 8, f); });
    const edited = t >= 1.3;
    if (!edited) {
      const M = dim470(60, "PTC, 2019");
      if (t >= 0.3) {
        const val = t < 0.6 ? `<span class="sel">470,000,000</span>` : "22,600,000,000".slice(0, Math.max(1, Math.round(14 * seg(t, 0.6, 1.2))));
        html += `<div class="os-dimedit" style="left:${M.x}px;top:${M.y - 4}px">$ ${val}<span class="caret"></span></div>`;
        html += cursorHTML(M.x + 150, M.y + 30, FOUNDERS[5]);
      }
    } else {
      // the new dimension: from the tablet's top-left corner, off the right edge of the screen
      os.updateMatrixWorld(true);
      const A = osPt(V(-140, 98, 6)), y = A.y - 120, g = ease.in(seg(t, 1.3, 1.9)), xEnd = lerp(A.x + 40, 2000, g);
      const size = lerp(40, 84, ease.out(seg(t, 1.5, 2.0))), cx = (A.x + 1920) / 2 - 30, gap = 7.4 * size * 0.31 + 18 + size * 2.2;
      vp.svg(`<path d="M${A.x} ${A.y - 6} L${A.x} ${y - 16}" stroke="#000" stroke-width="1.6"/><path d="M${A.x} ${y} L${Math.min(xEnd, cx - gap)} ${y}${xEnd > cx + gap ? ` M${cx + gap} ${y} L${xEnd} ${y}` : ""}" stroke="#000" stroke-width="1.6"/><path d="M${A.x} ${y} L${A.x + 20} ${y - 6} L${A.x + 20} ${y + 6}Z" fill="#000"/>`);
      if (t >= 1.5) vp.html(`<div class="mega" style="left:${cx}px;top:${y}px;font-size:${size}px">$22,600,000,000${t >= 2.1 ? `<small style="font-size:28px">Schneider Electric · agreed Oct 2026</small>` : ""}</div>`);
    }
    ui.set({ os: osState({ feats: featList(6), parts: ["Tablet"], avatars: [FOUNDERS[5], ...FOUNDERS.slice(0, 5)], html }) });
  } });

  // leaving Onshape: the browser window minimises into the tablet that hangs on Scott's wall.
  // Called by the next SolidWorks beat with its own time; returns true while the window is still shrinking.
  k.osHome = (t) => {
    tab.visible = true;
    if (!k.cur || t >= 0.7) return false;
    vp.rig.t.copy(tabShot.t); Object.assign(vp.rig, { dist: tabShot.dist, az: tabShot.az, el: tabShot.el, fov: tabShot.fov, roll: 0, centre: 1 });
    const m = ease.in(seg(t, 0.05, 0.7));
    const S = vp.project(tab.position.clone().add(V(0, 0, 6)));
    const st = osState({ feats: featList(6), parts: ["Tablet"], avatars: [FOUNDERS[5], ...FOUNDERS.slice(0, 5)], html: "" });
    st.min = { x: S.x, y: S.y, s: lerp(1, 0.11, m), o: t >= 0.62 ? 0 : 1 };
    ui.set({ os: st, swHidden: false });
    return true;
  };
  k.tabShot = tabShot;

  // 10 OLIN: share with the whole school, forty seconds, then minimise into the tablet on the wall
  beats.push({ id: "olin", dur: 12.0, update(tRaw) { const t = tRaw * 9.2 / 12.0;
    tab.visible = t >= 7.7 || !k.cur;
    if (!k.cur) { if (k.treeExtra && !k.treeExtra.some((x) => x.label === "Imported1")) k.treeExtra = [...k.treeExtra, { icon: "part", label: "Imported1", ex: "▸" }]; return; }
    const back = t >= 7.7;
    if (!back) {
      vp.rig.t.copy(osShot.t); Object.assign(vp.rig, { dist: osShot.dist * 0.94, az: osShot.az + Math.sin(Math.min(t + 13.8, 60) * 0.25) * 4, el: osShot.el, fov: osShot.fov, roll: 0, centre: 1 });
      setOnshapePart(99, null);
    } else {
      vp.rig.t.copy(tabShot.t); Object.assign(vp.rig, { dist: tabShot.dist * (1 + 0.05 * (1 - ease.out(seg(t, 7.7, 9.2)))), az: tabShot.az + Math.min(k.hold, 20) * 0.2, el: tabShot.el, fov: tabShot.fov, roll: 0, centre: 1 });
    }
    const avatars = [FOUNDERS[5], ...FOUNDERS.slice(0, 5), ...(t >= 1.9 ? [{ ...AJ, ring: t < 3.2 }] : [])];
    let html = "";
    if (t >= 1.9 && t < 3.4) html += `<div class="os-toast"><span class="os-av" style="background:${AJ.c};margin:0">AJ</span>AJ joined “Scott Harris”</div>`;
    const typed = "Olin College of Engineering".slice(0, Math.round(27 * seg(t, 0.3, 1.5)));
    if (t < 2.7) {
      html += `<div class="os-modal"><div class="h">Share “Scott Harris”<span>✕</span></div><div class="b"><div class="in">👥︎ ${typed}<span class="caret"></span></div>
        <div class="opts"><span>☑ Can edit</span><span>☑ Can comment</span><span>☐ Can export</span></div></div><div class="f"><span>Cancel</span><span class="go">Share</span></div></div>`;
      if (t >= 2.3) html += cursorHTML(1320, 548, FOUNDERS[5], seg(t, 2.35, 2.7));
      else html += cursorHTML(lerp(1500, 1320, ease.io(seg(t, 1.6, 2.3))), lerp(820, 548, ease.io(seg(t, 1.6, 2.3))), FOUNDERS[5]);
    } else {
      // forty seconds, compressed
      const p = seg(t, 3.0, 7.2), secs = Math.max(0, Math.ceil(40 * (1 - p)));
      const COLS = 25, ROWS = 14; let grid = "";
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
        const w = (c + r * 0.9) / (COLS + ROWS * 0.9); const on = p >= w * 0.98 + 0.01; const aj = r === 6 && c === 13;
        grid += `<div class="os-lap${on ? " on" : ""}${aj && p > 0.45 ? " aj" : ""}" style="left:${c * 58}px;top:${r * 37}px"><b></b><u></u></div>`;
      }
      const ajTag = p > 0.45 ? `<div class="os-ajtag" style="left:${72 + 13 * 58 + 56}px;top:${220 + 6 * 37 - 4}px">AJ</div>` : "";
      html += `<div class="os-deploy"><div class="t">Switching Olin College to Onshape</div><div class="s">Every student · every laptop · nothing to install</div>
        <div class="clock">0:${String(secs).padStart(2, "0")}</div><div class="bar"><i style="width:${(p * 100).toFixed(1)}%"></i></div>
        <div class="os-grid">${grid}</div>${ajTag}${p >= 1 ? `<div class="done">✓ Done. Everyone's in.</div>` : ""}</div>`;
    }
    const osSt = osState({ feats: featList(6), parts: ["Tablet"], avatars, html });
    if (t >= 7.7) {
      // minimise into the tablet hanging on the wall
      const m = ease.in(seg(t, 7.7, 8.35));
      const S = vp.project(tab.position.clone().add(V(0, 0, 6)));
      osSt.min = { x: S.x, y: S.y, s: lerp(1, 0.11, m), o: t >= 8.25 ? 0 : 1 };
      if (t >= 8.35) { ui.set({ os: null }); }
      else ui.set({ os: osSt });
      ui.set({ swHidden: false });
    } else ui.set({ os: osSt, swHidden: true });
    if (back) {
      ui.set({ tree: treeWith(k, [{ icon: "part", label: "Imported1", sel: t < 8.9, ex: "▸" }]), hint: "Imported from Onshape", statr: statR("", "Editing Part") });
      k.treeExtra = [...(k.treeExtra || []), { icon: "part", label: "Imported1", ex: "▸" }];
    }
  } });

  // Onshape "Versions and history": main line, a branch, a merge
  function versionsPanel(p) {
    const s = (a) => Math.min(1, Math.max(0, (p - a) / 0.25));
    const node = (x, y, c, a, label, sub) => `<g opacity="${s(a)}"><circle cx="${x}" cy="${y}" r="9" fill="${c}"/><text x="${x + 22}" y="${y + 6}" font-size="17" fill="#222" font-family="Segoe UI, Arial">${label}</text>${sub ? `<text x="${x + 22}" y="${y + 26}" font-size="14" fill="#8693A0" font-family="Segoe UI, Arial">${sub}</text>` : ""}</g>`;
    return `<div class="os-vers"><div class="h">Versions and history<span style="color:#8693A0">✕</span></div>
      <svg width="380" height="420" viewBox="0 0 380 420">
        <path d="M44 30 V390" stroke="#1B7BD6" stroke-width="4"/>
        <path d="M44 120 C 44 160, 130 150, 130 190 V 250 C 130 290, 44 280, 44 320" stroke="#D81B60" stroke-width="4" fill="none" opacity="${s(0.25)}"/>
        ${node(44, 40, "#1B7BD6", 0, "Start", "Jon · 2012")}${node(44, 120, "#1B7BD6", 0.1, "V1  Tablet", "Dave")}
        ${node(130, 200, "#D81B60", 0.3, "branch: rounds", "Scott")}${node(130, 250, "#D81B60", 0.4, "Fillet 1", "Scott")}
        ${node(44, 320, "#1B7BD6", 0.55, "Merge", "into Main")}${node(44, 384, "#1E9E57", 0.7, "V2  Shipped", "")}
      </svg></div>`;
  }

  // Fillet PropertyManager (ui.js has no template for it): fill the body after commit
  const FILLET = `<div style="display:flex;gap:0;margin:2px 10px 6px"><span style="flex:1;text-align:center;border:1px solid #C9C9CC;background:#fff;padding:2px 0;font-weight:600">Manual</span><span style="flex:1;text-align:center;border:1px solid #C9C9CC;padding:2px 0">FilletXpert</span></div>
    <div class="grp">Fillet Type<span class="chev"></span></div><div class="row" style="gap:10px;margin-left:16px">◰ ◱ ◲ ◳</div>
    <div class="grp">Items To Fillet<span class="chev"></span></div><div class="selbox" style="min-height:58px">Edge&lt;1&gt;<br>Edge&lt;2&gt;<br>Edge&lt;3&gt;<br>Edge&lt;4&gt; …</div>
    <div class="chk" style="color:#111"><i style="background:#3399FF;border-color:#3399FF"></i>Tangent propagation</div>
    <div class="grp">Fillet Parameters<span class="chev"></span></div><div class="row"><span style="width:16px;font-weight:600;color:#2A6CC2">R</span><div class="spin">8.00mm</div></div>
    <div class="grp"><span class="cb"></span>Fillet Options<span class="chev dn"></span></div>`;
  const orig = ui.commit;
  let filletShown = false;
  ui.commit = () => {
    orig();
    const isF = ui.get("panel") === "pm" && ui.get("pm") === "Fillet";
    if (isF && !filletShown) { const b = document.getElementById("pmbody"); if (b) b.innerHTML = FILLET; const ic = document.getElementById("pmicon"); if (ic) ic.innerHTML = `<svg viewBox="0 0 24 24"><path d="M4 20 V11 Q4 4 11 4 H20 V20Z" fill="#C6D3E4" stroke="#55708F"/><path d="M4 11 Q4 4 11 4" stroke="#F2A33A" stroke-width="2" fill="none"/></svg>`; }
    filletShown = isF;
  };

  return beats;
}
