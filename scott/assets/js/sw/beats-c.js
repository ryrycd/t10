// Beats: dogs (Pico + Echo tags, then the dog door motion study), pico (pull back, the wall turns real), and the
// exploded view of SolidWorks itself, leaving Scott's portrait on the finished wall. audi/screws: unused since v4.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { circlePts } from "./vp.js";
import { treeWith, statR } from "./beats-a.js";
import { pegHook } from "./world.js";

const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const VIS = 5;                     // the radar angle is drawn 5x so 1.7 degrees can be seen at all
const DEG = Math.PI / 180;

export default function beatsC(k) {
  const { vp, ui, W, SLOT, ease, seg, lerp, lerpRig, C } = k;
  const camTo = (shot, t, a, b, e = ease.cam) => lerpRig(vp, k.cam0, shot, e(seg(t, a, b)));
  const drift = (deg = 0.3) => { if (k.cur) vp.rig.az += Math.min(k.hold, 25) * deg; };
  const sw = () => vp.swMat();
  const real = (color, rough = 0.5, metal = 0, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
  // a part that has a SolidWorks look and a RealView look
  function part(geo, realMat, parent, edgeAngle = 30) {
    const m = new THREE.Mesh(geo, sw()); m.castShadow = true; m.receiveShadow = true;
    const e = vp.edges(geo, 0x000000, 1.2, edgeAngle);
    const p = new THREE.Mesh(geo, vp.previewMat());
    const g = new THREE.Group(); g.add(m, e, p); parent.add(g);
    return { g, m, e, p, sw: m.material, real: realMat,
      set(mode, depthScale = 1) {           // mode: hidden | prev | sw | real
        g.visible = mode !== "hidden";
        m.visible = mode === "sw" || mode === "real"; e.visible = mode === "sw"; p.visible = mode === "prev";
        m.material = mode === "real" ? realMat : this.sw; g.scale.z = depthScale;
      } };
  }
  const tex = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

  // ======================= 11 DOG DOOR =======================
  const dd = W.group("dogdoor"); dd.position.copy(SLOT.dogdoor);
  const FW = 230, FH = 280, OW = 166, OH = 214, FD = 34;
  const frameShape = new THREE.Shape(); frameShape.moveTo(-FW / 2, -FH / 2); frameShape.lineTo(FW / 2, -FH / 2); frameShape.lineTo(FW / 2, FH / 2); frameShape.lineTo(-FW / 2, FH / 2); frameShape.closePath();
  const opening = new THREE.Path(); { const r = 14, w = OW / 2, h = OH / 2; opening.moveTo(-w + r, -h); opening.lineTo(w - r, -h); opening.quadraticCurveTo(w, -h, w, -h + r); opening.lineTo(w, h - r); opening.quadraticCurveTo(w, h, w - r, h); opening.lineTo(-w + r, h); opening.quadraticCurveTo(-w, h, -w, h - r); opening.lineTo(-w, -h + r); opening.quadraticCurveTo(-w, -h, -w + r, -h); }
  frameShape.holes.push(opening);
  const frameGeo = new THREE.ExtrudeGeometry(frameShape, { depth: FD, bevelEnabled: true, bevelThickness: 2, bevelSize: 2, bevelSegments: 2, curveSegments: 8 });
  const frame = part(frameGeo, real(0xECEAE4, 0.45), dd, 40);
  // flap hangs from a hinge at the top of the opening
  const hinge = new THREE.Group(); hinge.position.set(0, OH / 2 - 2, 20); dd.add(hinge);
  const flapGeo = new RoundedBoxGeometry(OW - 6, OH - 6, 5, 3, 2); flapGeo.translate(0, -(OH - 6) / 2, 0);
  const flap = part(flapGeo, new THREE.MeshPhysicalMaterial({ color: 0x5B6066, roughness: 0.15, metalness: 0, transmission: 0.35, transparent: true, opacity: 0.82, clearcoat: 0.6 }), hinge, 40);
  const hingeBar = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, OW, 16), real(0x9AA0A8, 0.3, 0.9)); hingeBar.rotation.z = Math.PI / 2; hinge.add(hingeBar);
  // latch at the bottom of the opening
  const latchGeo = new RoundedBoxGeometry(46, 16, 14, 2, 2);
  const latch = part(latchGeo, real(0xE0662B, 0.4), dd, 40);
  const LATCH_Y = -OH / 2 + 6;
  // collar + bluetooth tag
  const collar = W.group("collar"); collar.position.copy(SLOT.dogdoor);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(52, 7, 16, 64), real(0xC8352B, 0.6)); ring.castShadow = true;
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(22, 18, 16), real(0xB9BEC6, 0.3, 0.9)); buckle.position.set(0, 52, 0);
  const tagTex = tex(256, 320, (g, w, h) => { g.fillStyle = "#1E2328"; g.fillRect(0, 0, w, h); g.strokeStyle = "#2F7BE0"; g.lineWidth = 16; g.lineJoin = "round"; g.lineCap = "round";
    g.beginPath(); g.moveTo(84, 104); g.lineTo(172, 192); g.lineTo(128, 236); g.lineTo(128, 84); g.lineTo(172, 128); g.lineTo(84, 216); g.stroke(); });
  const tag = new THREE.Mesh(new RoundedBoxGeometry(30, 38, 9, 3, 3), [real(0x1E2328, 0.4), real(0x1E2328, 0.4), real(0x1E2328, 0.4), real(0x1E2328, 0.4), real(0xffffff, 0.35, 0, { map: tagTex }), real(0x1E2328, 0.4)]);
  tag.position.set(0, -66, 6); tag.castShadow = true;
  collar.add(ring, buckle, tag);
  const pulses = [0, 1, 2].map(() => { const l = vp.line(circlePts(THREE, V(0, 0, 0), 1, V(1, 0, 0), V(0, 1, 0), 64), 0x2F7BE0, 2.4, { opacity: 1 }); collar.add(l); return l; });

  // ======================= 12 / 13 RADAR =======================
  const rad = W.group("radar"); rad.position.copy(SLOT.radar);
  // bracket: back plate on the pegboard + a shelf arm the sensor sits on
  const plateGeo = new RoundedBoxGeometry(170, 120, 6, 2, 1.5); plateGeo.translate(0, 0, 3);
  const plate = part(plateGeo, real(0xA7ADB5, 0.35, 0.85), rad);
  const armGeo = new RoundedBoxGeometry(150, 6, 120, 2, 1.5); armGeo.translate(0, -50, 60);
  const arm = part(armGeo, real(0xA7ADB5, 0.35, 0.85), rad);
  // the sensor yaws about a pivot on the arm
  const yaw = new THREE.Group(); yaw.position.set(0, -47, 66); rad.add(yaw);
  const bodyGeo = new RoundedBoxGeometry(128, 92, 46, 4, 8); bodyGeo.translate(0, 46, 0);
  const body = part(bodyGeo, real(0x1D1F22, 0.55, 0.1), yaw, 40);
  const lensGeo = new THREE.SphereGeometry(140, 48, 24, 0, Math.PI * 2, 0, 0.36); lensGeo.rotateX(Math.PI / 2); lensGeo.translate(0, 46, 23 - 140 * Math.cos(0.36) + 0.5);
  lensGeo.scale(1, 0.72, 1);
  const lens = part(lensGeo, new THREE.MeshPhysicalMaterial({ color: 0x0E1013, roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }), yaw, 50);
  const connGeo = new RoundedBoxGeometry(26, 18, 22, 2, 2); connGeo.translate(52, 70, -26);
  const conn = part(connGeo, real(0x2B2D31, 0.5), yaw);
  // adjustment screw (top of the arm, beside the sensor), pointing up
  const screw = new THREE.Group(); screw.position.set(56, -44, 108); rad.add(screw);
  const sHead = new THREE.Mesh(new THREE.CylinderGeometry(8, 8, 6, 24), real(0xC9CDD3, 0.25, 1)); sHead.position.y = 3; sHead.castShadow = true;
  const slotA = new THREE.Mesh(new THREE.BoxGeometry(14, 2.2, 2.4), real(0x30343A, 0.6)); slotA.position.y = 6.2;
  const slotB = slotA.clone(); slotB.rotation.y = Math.PI / 2;
  const screwSpin = new THREE.Group(); screwSpin.add(sHead, slotA, slotB); screw.add(screwSpin);
  const hookL = pegHook(vp, true), hookR = pegHook(vp, true); hookL.position.set(-60, 52, 0); hookR.position.set(60, 52, 0); hookL.scale.setScalar(0.5); hookR.scale.setScalar(0.5); rad.add(hookL, hookR);
  // dealer quote: a paper tag hanging from a peg
  const quote = W.group("quote"); quote.position.copy(SLOT.radar).add(V(-5, 205, 0));
  const quoteTex = tex(520, 300, (g, w, h) => {
    g.fillStyle = "#F4EFE2"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#555"; g.font = "600 34px 'Helvetica Neue', Arial"; g.fillText("DEALER QUOTE", 34, 62);
    g.fillStyle = "#777"; g.font = "28px 'Helvetica Neue', Arial"; g.fillText("Radar calibration · 10 min", 34, 106);
    g.fillStyle = "#111"; g.font = "700 120px 'Helvetica Neue', Arial"; g.fillText("$1,200", 30, 240);
    g.strokeStyle = "#BBB"; g.lineWidth = 3; g.beginPath(); g.arc(486, 40, 14, 0, Math.PI * 2); g.stroke();
  });
  const qShape = new THREE.Shape(); qShape.moveTo(-90, -52); qShape.lineTo(90, -52); qShape.lineTo(90, 36); qShape.lineTo(66, 52); qShape.lineTo(-90, 52); qShape.closePath();
  const qGeo = new THREE.ExtrudeGeometry(qShape, { depth: 1.2, bevelEnabled: false });
  { const uv = qGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + 90) / 180, (uv.getY(i) + 52) / 104); uv.needsUpdate = true; }
  const quoteMesh = new THREE.Mesh(qGeo, [new THREE.MeshStandardMaterial({ map: quoteTex, roughness: 0.9 }), real(0xE8E2D2, 0.9)]); quoteMesh.castShadow = true;
  const qPivot = new THREE.Group(); qPivot.position.set(70, 52, 14); quote.add(qPivot); quoteMesh.position.set(-70, -52 - 20, 0); qPivot.add(quoteMesh);
  const qString = vp.line([V(70, 52, 14), V(70, 72, 8), V(70, 86, 2)], 0x8A7A5A, 1.4); quote.add(qString);
  const qHook = pegHook(vp, true); qHook.position.set(70, 90, 0); qHook.scale.setScalar(0.45); quote.add(qHook);
  const strike1 = vp.line([V(-82, 10, 2.5), V(78, -40, 2.5)], 0xDF2603, 5), strike2 = vp.line([V(-82, -40, 2.5), V(78, 10, 2.5)], 0xDF2603, 5);
  quoteMesh.add(strike1, strike2);
  // screwdriver: hangs on the pegboard on two pegs, flies to the screw
  const drv = W.group("driver");
  const drvG = new THREE.Group(); drv.add(drvG);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(13, 11, 92, 24), real(0xE2B007, 0.35, 0, { }));
  handle.position.y = 46 + 70; handle.castShadow = true;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(13, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), real(0xE2B007, 0.35)); cap.position.y = 162;
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(13.6, 12.6, 50, 24), real(0x1A1A1A, 0.8)); grip.position.y = 116;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 70, 16), real(0xD7DBE0, 0.2, 1)); shaft.position.y = 35; shaft.castShadow = true;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(3.2, 8, 4), real(0xD7DBE0, 0.2, 1)); tip.rotation.x = Math.PI; tip.position.y = -4;
  const stripes = new THREE.Group(); for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(2.2, 46, 2.5), real(0x8A6A00, 0.6)); const a = i / 6 * Math.PI * 2; s.position.set(Math.cos(a) * 13.4, 116, Math.sin(a) * 13.4); s.rotation.y = -a; stripes.add(s); }
  drvG.add(handle, cap, grip, shaft, tip, stripes);
  const drvHang = { pos: SLOT.radar.clone().add(V(-210, -140, 40)), rot: V(0, 0, Math.PI / 2) };
  const drvHooks = [pegHook(vp, true), pegHook(vp, true)]; for (const [i, h] of drvHooks.entries()) { h.position.copy(SLOT.radar).add(V(-280 + i * 120, -160, 0)); h.scale.setScalar(0.55); drv.add(h); }

  // ======================= 14 / 15 FINALE =======================
  // a dark warm room the UI explodes away to reveal (big gradient sphere, only shown at the end)
  const roomMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, transparent: true, uniforms: { o: { value: 1 } },
    vertexShader: "varying vec3 p; void main(){ p = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform float o; varying vec3 p; void main(){ float y = p.y; vec3 top = vec3(0.10,0.09,0.085); vec3 hz = vec3(0.30,0.25,0.205); vec3 bot = vec3(0.16,0.135,0.115); vec3 c = y > 0.0 ? mix(hz, top, smoothstep(0.0, 0.55, y)) : mix(hz, bot, smoothstep(0.0, 0.25, -y)); gl_FragColor = vec4(c, o); }" });
  const room = W.reg(new THREE.Mesh(new THREE.SphereGeometry(30000, 48, 24), roomMat)); room.renderOrder = -10;
  // a wood shelf to stand in for the grey one in RealView
  const woodTex = tex(1024, 64, (g, w, h) => { const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, "#8C5E36"); grd.addColorStop(1, "#6E4527"); g.fillStyle = grd; g.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(50,28,12,${0.08 + (i % 5) * 0.03})`; g.lineWidth = 1 + (i % 3); g.beginPath(); const y = (i * 37) % h; g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.01 + i) * 3); g.stroke(); } });
  const shelfGeo = new THREE.BoxGeometry(760, 18, 240); shelfGeo.translate(0, -9, 120);
  const woodShelf = W.reg(new THREE.Mesh(shelfGeo, real(0xffffff, 0.55, 0, { map: woodTex }))); woodShelf.castShadow = woodShelf.receiveShadow = true;
  // gallery spot on the portrait
  const spot = new THREE.SpotLight(0xffe2bd, 0, 0, 0.36, 0.8, 0); spot.position.set(SLOT.portrait.x + 60, SLOT.portrait.y + 520, 900);
  const spotTarget = new THREE.Object3D(); spotTarget.position.copy(SLOT.portrait); spot.target = spotTarget;
  const spotG = W.group("spot"); spotG.add(spot, spotTarget);
  // the portrait: photo + white mat + walnut frame (the final part)
  const PW = 190, PH = Math.round(190 * 1193 / 1100), MAT = 22, FR = 17, PD = 24;
  const portrait = W.group("portrait");
  const pin = new THREE.Group(); portrait.add(pin);
  const photoTex = new THREE.Texture(); photoTex.colorSpace = THREE.SRGBColorSpace;
  k.assets.push(new Promise((done) => new THREE.TextureLoader().load("../assets/img/scott-portrait.jpg", (t) => { photoTex.image = t.image; photoTex.needsUpdate = true; done(); }, undefined, () => done())));
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map: photoTex, toneMapped: false })); photo.position.z = PD - 6;
  const matShape = new THREE.Shape(); matShape.moveTo(-PW / 2 - MAT, -PH / 2 - MAT); matShape.lineTo(PW / 2 + MAT, -PH / 2 - MAT); matShape.lineTo(PW / 2 + MAT, PH / 2 + MAT); matShape.lineTo(-PW / 2 - MAT, PH / 2 + MAT); matShape.closePath();
  const matHole = new THREE.Path(); matHole.moveTo(-PW / 2, -PH / 2); matHole.lineTo(-PW / 2, PH / 2); matHole.lineTo(PW / 2, PH / 2); matHole.lineTo(PW / 2, -PH / 2); matHole.closePath(); matShape.holes.push(matHole);
  const matMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(matShape, { depth: 3, bevelEnabled: false }), real(0xF4F1EA, 0.85)); matMesh.position.z = PD - 7;
  const frShape = new THREE.Shape(); { const w = PW / 2 + MAT + FR, h = PH / 2 + MAT + FR; frShape.moveTo(-w, -h); frShape.lineTo(w, -h); frShape.lineTo(w, h); frShape.lineTo(-w, h); frShape.closePath(); }
  const frHole = new THREE.Path(); { const w = PW / 2 + MAT, h = PH / 2 + MAT; frHole.moveTo(-w, -h); frHole.lineTo(-w, h); frHole.lineTo(w, h); frHole.lineTo(w, -h); frHole.closePath(); } frShape.holes.push(frHole);
  const frGeo = new THREE.ExtrudeGeometry(frShape, { depth: PD, bevelEnabled: true, bevelThickness: 2.5, bevelSize: 2.5, bevelSegments: 3 });
  const frMesh = new THREE.Mesh(frGeo, real(0x3B2414, 0.38, 0, { })); frMesh.castShadow = true; frMesh.receiveShadow = true;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(PW + 2 * MAT, PH + 2 * MAT), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 1, transparent: true, opacity: 0.03, clearcoat: 1 })); glass.position.z = PD - 1;
  pin.add(photo, matMesh, frMesh, glass);
  portrait.position.copy(SLOT.portrait);

  // grab beats-a's name sign so it can switch to RealView at the end
  let signParts = null;
  function signReal(on) {
    if (!signParts) { const s = vp.scene.getObjectByName("sign"); if (!s) return; const meshes = s.children.filter((c) => c.isMesh && !c.isLineSegments2); const edges = s.children.find((c) => c.isLineSegments2); if (meshes.length < 2) return; signParts = { sw: meshes[0], real: meshes[1], edges, outline: s.children.find((c) => c.isGroup) }; }
    if (!on) return;
    signParts.sw.visible = false; signParts.edges.visible = false; if (signParts.outline) signParts.outline.visible = false;
    signParts.real.visible = true; signParts.real.scale.z = 30;
  }

  // ---------- angle dimension between the true axis and the sensor's axis (drawn in the overlay) ----------
  function angleDim(angDeg, col = "#D0262A", label) {
    const o = rad.position.clone().add(V(0, -47 + 46, 66));            // pivot height at sensor centre
    const L = 300, R = 210, a = angDeg * VIS * DEG;
    const trueEnd = o.clone().add(V(0, 0, L)), sensEnd = o.clone().add(V(Math.sin(a) * L, 0, Math.cos(a) * L));
    const P = (v) => vp.project(v);
    const O = P(o), A = P(trueEnd), B = P(sensEnd);
    vp.svg(`<path d="M${O.x} ${O.y} L${A.x} ${A.y}" stroke="#000" stroke-width="1.6" stroke-dasharray="18 5 3 5" fill="none"/>`);
    vp.svg(`<path d="M${O.x} ${O.y} L${B.x} ${B.y}" stroke="${col}" stroke-width="2.4" stroke-dasharray="18 5 3 5" fill="none"/>`);
    // spec cone (±0.8 deg, same exaggeration)
    const s = 0.8 * VIS * DEG, c1 = P(o.clone().add(V(Math.sin(s) * L, 0, Math.cos(s) * L))), c2 = P(o.clone().add(V(-Math.sin(s) * L, 0, Math.cos(s) * L)));
    vp.svg(`<path d="M${O.x} ${O.y} L${c1.x} ${c1.y} L${c2.x} ${c2.y}Z" fill="rgba(3,202,53,.16)" stroke="rgba(3,160,45,.55)" stroke-width="1.2"/>`);
    const arc = []; for (let i = 0; i <= 24; i++) { const u = a * i / 24; const p = P(o.clone().add(V(Math.sin(u) * R, 0, Math.cos(u) * R))); arc.push(`${i ? "L" : "M"}${p.x} ${p.y}`); }
    vp.svg(`<path d="${arc.join(" ")}" stroke="${col}" stroke-width="1.6" fill="none"/>`);
    const M = P(o.clone().add(V(Math.sin(a / 2) * (R + 40), 0, Math.cos(a / 2) * (R + 40))));
    vp.html(`<div class="dim big ${col === "#000" ? "" : "red"}" style="left:${M.x + 46}px;top:${M.y}px">${label || angDeg.toFixed(1) + "°"}</div>`);
    const sl = P(o.clone().add(V(-Math.sin(s) * L * 1.04, 0, Math.cos(s) * L * 1.04)));
    vp.html(`<div class="dim fin-spec" style="left:${sl.x - 70}px;top:${sl.y + 4}px">≤ 0.8°</div>`);
    return { O, A, B };
  }

  // ======================= PICO + ECHO: two bone-shaped name tags on one peg (v4) =======================
  const dogTags = W.group("dogtags"); dogTags.position.copy(SLOT.radar).add(V(-20, 10, 0)); dogTags.scale.setScalar(1.5);
  for (const x of [-52, 52]) { const h = pegHook(vp, true); h.scale.setScalar(0.42); h.position.set(x, 40, 0); dogTags.add(h); }
  function boneTag(name, color, metal) {
    const mat = real(color, 0.26, metal ? 1 : 0.2, { envMapIntensity: 1.2 });
    const pivot = new THREE.Group(); pivot.position.set(0, 36, 6); dogTags.add(pivot);
    const body = new THREE.Group(); body.position.set(0, -44, 0); pivot.add(body);
    const shaft = new THREE.Mesh(new RoundedBoxGeometry(76, 22, 5, 2, 2), mat); shaft.castShadow = true; body.add(shaft);
    for (const [x, y] of [[-38, -9], [-38, 9], [38, -9], [38, 9]]) { const l = new THREE.Mesh(new THREE.CylinderGeometry(13, 13, 5, 32), mat); l.rotation.x = Math.PI / 2; l.position.set(x, y, 0); l.castShadow = true; body.add(l); }
    const ringM = new THREE.Mesh(new THREE.TorusGeometry(7, 1.6, 10, 28), real(0xB8BCC2, 0.3, 1)); ringM.position.set(0, 22, 0); body.add(ringM);
    const link = vp.line([V(0, 0, 0), V(0, -14, 0)], 0x9A9EA4, 1.6); pivot.add(link);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(76, 22), new THREE.MeshStandardMaterial({ transparent: true, roughness: 0.6, map: tex(512, 148, (g, w, h) => {
      g.clearRect(0, 0, w, h); g.fillStyle = "rgba(30,24,16,.88)"; g.font = "700 104px 'Avenir Next', 'Helvetica Neue', Arial"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(name, w / 2, h / 2 + 6); }) }));
    label.position.z = 2.7; body.add(label);
    return pivot;
  }
  const tagP = boneTag("PICO", 0xD7AE55, true), tagE = boneTag("ECHO", 0xC9CDD3, true);
  tagP.position.x = -52; tagE.position.x = 52;
  function setTags(tt, live) {          // tt: seconds since the tags started to drop (large = settled)
    dogTags.visible = true;
    for (const [pv, a, rest, ph] of [[tagP, 0, 0.05, 0], [tagE, 0.22, -0.07, 1.3]]) {
      const p = seg(tt, a, a + 0.6), e = ease.expo(p);
      pv.visible = p > 0;
      pv.position.z = 6 + (1 - e) * 260; pv.position.y = 36 + (1 - e) * 70;
      const st = tt - a - 0.6, swing = st > 0 ? Math.sin(st * 5.2 + ph) * 0.32 * Math.exp(-st * 1.6) : (1 - e) * 0.5;
      pv.rotation.z = rest + swing + (live ? Math.sin(live * 0.7 + ph) * 0.01 : 0);
    }
  }

  // ======================= BEATS =======================
  const beats = [];
  const keepWallParts = (mode) => {   // persistent states every later beat re-applies via the update chain
    dd.visible = true; collar.visible = true;
  };

  // ---- DOGS: Pico + Echo tags, then the dog door (motion study) ----
  const MK = [[0, 0, 1, "#B9C7D8"], [3, 0.02, 0.92, "#E8A33A"], [1, 0.44, 0.6, "#3A8DDE"], [2, 0.58, 1.0, "#3A8DDE"]];
  const dogShot = { t: V(430, -362, 60), dist: 2250, az: 14, el: 4, fov: 16, roll: 0, centre: 1 };
  const DOOR_AT = 2.0;
  beats.push({ id: "dogs", dur: 6.6 + DOOR_AT, update(tRaw) {
    const leaving = k.osHome(tRaw);               // the Onshape window shrinks into the tablet on the wall
    if (!leaving) { lerpRig(vp, k.tabShot, dogShot, ease.cam(seg(tRaw, 0.7, 1.9))); if (tRaw >= 1.9) { vp.rig.t.copy(dogShot.t); Object.assign(vp.rig, { dist: dogShot.dist, az: dogShot.az, el: dogShot.el, fov: dogShot.fov }); } drift(0.2); }
    if (tRaw >= 0.7) k.treeExtra = [...(k.treeExtra || []), { icon: "part", label: "Imported1", ex: "▸" }];
    if (tRaw >= 1.3) setTags(k.cur ? tRaw - 1.3 : 99, k.cur ? k.live : 0);
    if (tRaw >= 2.2) k.treeExtra = [...(k.treeExtra || []), { icon: "part", label: "Pico", ex: "▸" }, { icon: "part", label: "Echo", ex: "▸" }];
    if (tRaw < DOOR_AT) { ui.set({ tree: treeWith(k, tRaw >= 1.3 ? [{ icon: "part", label: "Pico", sel: true }, { icon: "part", label: "Echo", sel: true }] : []), hint: leaving ? "" : "RealView Graphics", statr: statR("", "Editing Part") }); return; }
    const t = tRaw - DOOR_AT;
    ui.set({ onshape: null, swHidden: false });
    dd.visible = collar.visible = true;
    // quick build: frame, flap, latch (extrude previews), then the collar part drops in
    const fP = seg(t, 0.25, 0.75), flP = seg(t, 0.7, 1.05), lP = seg(t, 1.0, 1.3);
    const isReal = t >= 5.9;
    const mode = (p) => (isReal ? "real" : p <= 0 ? "hidden" : p < 1 ? "prev" : "sw");
    frame.set(mode(fP), fP < 1 ? Math.max(0.02, ease.out(fP)) : 1);
    flap.set(mode(flP), 1); latch.set(mode(lP), 1);
    hingeBar.visible = flP >= 1;
    // motion study 1.6 → 5.6
    const mp = seg(t, 1.7, 5.6);
    const cp = ease.io(seg(mp, 0.02, 0.42)), cin = ease.io(seg(mp, 0.66, 0.84)), thru = ease.in(seg(mp, 0.84, 0.92));
    collar.visible = t >= 1.3 && thru < 1;
    collar.position.copy(SLOT.dogdoor).add(V(lerp(lerp(330, 92, cp), 0, cin), lerp(lerp(-40, -96, cp), -70, cin), lerp(lerp(260, 112, cp), 70, cin) - thru * 110));
    collar.rotation.set(lerp(0.35, 0.1, cin), lerp(lerp(-0.9, -0.35, cp), 0, cin), lerp(0.25, 0.08, cp));
    collar.scale.setScalar(1 - thru * 0.4);
    ring.material = tag.material[0] = isReal || t >= 1.3 ? ring.material : ring.material;
    for (const [i, l] of pulses.entries()) {
      const pp = seg(mp, 0.36 + i * 0.05, 0.62 + i * 0.05); l.visible = pp > 0 && pp < 1 && k.cur;
      l.scale.setScalar(lerp(14, 140, ease.out(pp))); l.material.opacity = 1 - pp; l.position.set(0, -66, 12);
    }
    const lp = ease.io(seg(mp, 0.44, 0.6));
    latch.g.position.set(0, LATCH_Y - lp * 22, FD - 6);
    const fo = ease.io(seg(mp, 0.58, 0.74)), fc = seg(mp, 0.88, 1.0);
    const fp = fo * (fc <= 0 ? 1 : Math.max(0, Math.cos(fc * Math.PI * 2.5) * (1 - fc)));
    hinge.rotation.x = -fp * 68 * DEG;
    // ---- UI ----
    const tree = (x = []) => ui.set({ tree: treeWith(k, x) });
    if (t < 1.4) {
      const what = t < 0.75 ? ["Frame", "34.00mm"] : t < 1.05 ? ["Flap", "5.00mm"] : ["Latch", "14.00mm"];
      ui.set({ panel: "pm", pm: "Boss-Extrude", pmDepth: what[1], cmdDis: true, pressed: "Instant3D", flyout: "Scott Harris (Default) &lt;&lt;D...", confirm: "feature", statr: statR("Fully Defined", "Editing Part") });
      tree([...(t > 0.75 ? [{ icon: "extrude", label: "Frame" }] : []), ...(t > 1.05 ? [{ icon: "extrude", label: "Flap" }] : [])]);
    } else {
      tree([{ icon: "extrude", label: "Dog door", ex: "▸", sel: t < 1.7 }]);
      ui.set({ btab: "Motion Study 1", motion: { p: mp, keys: MK }, hint: mp > 0 && mp < 1 ? "Playing animation" : isReal ? "RealView Graphics" : "", statr: statR("", "Editing Part") });
      if (k.cur && t < 2.1) ui.set({ cursor: { x: 528, y: 858, kind: "arrow" } });
      if (k.cur && mp > 0.36 && mp < 0.72) { const P = vp.project(collar.position.clone().add(V(0, -66, 20))); vp.html(`<div class="fin-tip" style="left:${P.x + 46}px;top:${P.y + 22}px">Pico’s collar: Bluetooth in range</div>`); }
      if (k.cur && mp > 0.6 && mp < 0.88) { const P = vp.project(dd.position.clone().add(V(-FW / 2 - 10, OH / 2, FD))); vp.html(`<div class="fin-tip" style="left:${P.x - 250}px;top:${P.y - 14}px">Flap&lt;1&gt;: ${Math.round(fp * 68)}°</div>`); }
    }
    if (t >= 5.9) k.treeExtra = [...(k.treeExtra || []), { icon: "extrude", label: "Dog door", ex: "▸" }];
  } });

  // ---- 12 AUDI RADAR ----
  const radShot = { t: SLOT.radar.clone().add(V(-20, 20, 140)), dist: 2350, az: -12, el: 26, fov: 16, roll: 0, centre: 1 };
  const radParts = [plate, arm, body, lens, conn];
  beats.push({ id: "audi", dur: 6.2, update(t) {
    camTo(radShot, t, 0, 1.2);
    drift(-0.22);
    rad.visible = true;
    const bp = [seg(t, 0.25, 0.55), seg(t, 0.5, 0.8), seg(t, 0.75, 1.1), seg(t, 1.0, 1.25), seg(t, 1.2, 1.4)];
    const isReal = t >= 1.6;
    radParts.forEach((p, i) => p.set(isReal ? "real" : bp[i] <= 0 ? "hidden" : bp[i] < 1 ? "prev" : "sw", bp[i] < 1 ? Math.max(0.03, ease.out(bp[i])) : 1));
    screw.visible = isReal; hookL.visible = hookR.visible = isReal;
    yaw.rotation.y = 1.7 * VIS * DEG;
    screwSpin.rotation.y = 0;
    // dealer quote swings in, then gets crossed out
    const qp = seg(t, 2.9, 3.6);
    quote.visible = qp > 0;
    qPivot.rotation.z = qp < 1 ? Math.sin(ease.out(qp) * 7) * (1 - qp) * 0.35 : Math.sin((t + k.hold) * 1.3) * 0.012;
    const xs = seg(t, 4.4, 4.75), xs2 = seg(t, 4.75, 5.1);
    strike1.visible = xs > 0; strike2.visible = xs2 > 0;
    if (xs > 0) vp.setLine(strike1, [V(-82, 10, 2.5), V(lerp(-82, 78, xs), lerp(10, -40, xs), 2.5)]);
    if (xs2 > 0) vp.setLine(strike2, [V(-82, -40, 2.5), V(lerp(-82, 78, xs2), lerp(-40, 10, xs2), 2.5)]);
    // UI
    if (t < 1.6) ui.set({ panel: "pm", pm: "Boss-Extrude", pmDepth: ["6.00mm", "120.00mm", "46.00mm", "8.00mm", "22.00mm"][Math.min(4, Math.floor(t / 0.3))], cmdDis: true, pressed: "Instant3D", flyout: "Scott Harris (Default) &lt;&lt;D...", confirm: "feature", tree: treeWith(k, [{ icon: "extrude", label: "Radar bracket" }]), statr: statR("Fully Defined", "Editing Part") });
    else ui.set({ tree: treeWith(k, [{ icon: "extrude", label: "Radar bracket", ex: "▸", sel: t < 2.2 }, ...(qp > 0 ? [{ icon: "sk", label: xs2 >= 1 ? "<s>Dealer quote</s>" : "Dealer quote" }] : [])]), statr: statR("", "Editing Part"), hint: "RealView Graphics" });
    if (k.cur && t >= 1.8) { const ap = seg(t, 1.8, 2.3); if (ap > 0) angleDim(1.7); }
    if (k.cur && t >= 4.3 && t < 5.3) { const P = vp.project(quote.position.clone().add(V(0, -20, 10))); ui.set({ cursor: { x: P.x + 60, y: P.y + 10, kind: "pencil" } }); }
    if (t >= 6.2) k.treeExtra = [...(k.treeExtra || []), { icon: "extrude", label: "Radar bracket", ex: "▸" }, { icon: "sk", label: "<s>Dealer quote</s>" }];
    // keep the screwdriver hanging on its pegs
    drv.visible = isReal;
    drvG.position.copy(drvHang.pos); drvG.rotation.set(0, 0, Math.PI / 2);
    for (const h of drvHooks) h.visible = isReal;
  } });

  // ---- 13 SCREWS: wrong way, back, and an honest "?" ----
  const scrShot = { t: SLOT.radar.clone().add(V(10, -10, 120)), dist: 1500, az: -16, el: 34, fov: 16, roll: 0, centre: 1 };
  beats.push({ id: "screws", dur: 3.9, update(t) {
    camTo(scrShot, t, 0, 0.8);
    rad.visible = quote.visible = drv.visible = true;
    radParts.forEach((p) => p.set("real")); screw.visible = hookL.visible = hookR.visible = true;
    // screwdriver flies from its pegs to the screw, upright above it
    const fly = ease.cam(seg(t, 0.05, 0.75));
    const target = SLOT.radar.clone().add(V(56, -44 + 12, 108));
    drvG.position.lerpVectors(drvHang.pos, target, fly);
    drvG.rotation.set(0, 0, lerp(Math.PI / 2, 0, fly));
    // turn: 0.8–1.8 clockwise (angle grows: wrong way), 1.9–2.6 back, then hesitate
    const cw = ease.io(seg(t, 0.85, 1.75)), ccw = ease.io(seg(t, 1.95, 2.65));
    const turns = cw * 1.5 - ccw * 1.5 + (t > 2.7 && k.cur ? Math.sin((t + k.hold - 2.7) * 3.2) * 0.06 : 0);
    const spin = -turns * Math.PI * 2;
    drvG.rotation.y = spin; screwSpin.rotation.y = spin;
    const ang = 1.7 + 0.7 * cw - 0.7 * ccw;
    yaw.rotation.y = ang * VIS * DEG;
    strike1.visible = strike2.visible = true; vp.setLine(strike1, [V(-82, 10, 2.5), V(78, -40, 2.5)]); vp.setLine(strike2, [V(-82, -40, 2.5), V(78, 10, 2.5)]);
    qPivot.rotation.z = 0;
    ui.set({ tree: treeWith(k, [{ icon: "extrude", label: "Screwdriver", sel: true }]), statr: statR("", "Editing Part"), hint: "" });
    if (t >= 3.85) k.treeExtra = [...(k.treeExtra || []), { icon: "extrude", label: "Screwdriver", ex: "▸" }];
    if (k.cur) {
      angleDim(ang);
      const S = vp.project(target.clone().add(V(0, 60, 0)));
      if (t > 0.85 && t < 1.8) vp.svg(rotArrow(S.x, S.y, 1, "#D0262A"));
      if (t > 1.95 && t < 2.7) vp.svg(rotArrow(S.x, S.y, -1, "#1C6FD8"));
      if (t >= 2.75) { vp.svg(rotArrow(S.x - 4, S.y, 1, "#444") + rotArrow(S.x + 4, S.y, -1, "#444")); vp.html(`<div class="fin-tip" style="left:${S.x + 104}px;top:${S.y - 46}px">Which way?</div>`); vp.html(`<div class="fin-q" style="left:${S.x + 170}px;top:${S.y - 190}px">?</div>`); }
      if (t > 0.85 && t < 1.8 && cw > 0.6) vp.html(`<div class="fin-warn" style="left:${S.x - 330}px;top:${S.y + 80}px">⚠ Out of spec</div>`);
      ui.set({ cursor: { x: S.x + 30, y: S.y + 70, kind: t > 2.7 ? "rotate" : "hand" } });
    }
  } });
  function rotArrow(x, y, dir, col) {
    const r = 64, a0 = dir > 0 ? -150 : -30, a1 = dir > 0 ? 40 : -220;
    const p = (a) => [x + Math.cos(a * DEG) * r * 1.5, y + Math.sin(a * DEG) * r * 0.55];
    const pts = []; for (let i = 0; i <= 20; i++) pts.push(p(a0 + (a1 - a0) * i / 20));
    const [ex, ey] = pts[20], [px, py] = pts[18]; const dx = ex - px, dy = ey - py, L = Math.hypot(dx, dy) || 1, u = dx / L, w = dy / L;
    return `<path d="M${pts.map((q) => q.join(" ")).join(" L")}" stroke="${col}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M${ex + u * 10} ${ey + w * 10} L${ex - u * 8 - w * 9} ${ey - w * 8 + u * 9} L${ex - u * 8 + w * 9} ${ey - w * 8 - u * 9}Z" fill="${col}"/>`;
  }

  // ---- 14 PRODUCT: pull back; the whole wall turns real ----
  const wallShot = { t: V(0, 25, 0), dist: 6100, az: 7, el: 5, fov: 16, roll: 0, centre: 1 };
  function realWorkshop(level = 1) {
    W.setWallReal(true); W.floor.visible = true;
    W.shelf.visible = false; woodShelf.visible = true; woodShelf.position.copy(W.shelf.position);
    vp.hemi.intensity = lerp(0.9, 0.5, level); vp.hemi.color.set(0xf2efea);
    vp.key.intensity = lerp(1.5, 1.3, level); vp.key.color.set(0xfff6ee);
    vp.warm.intensity = 0.22e5 * level; vp.warm.color.set(0xffe2c4); vp.warm.position.set(-650, 380, 900);
    W.floor.material.color.set(0x4A4038);
    signReal(true);
  }
  beats.push({ id: "pico", dur: 3.0, update(t) {
    camTo(wallShot, t, 0, 2.6);
    drift(0.12);
    realWorkshop(ease.io(seg(t, 0.2, 1.6)));
    k.cdFinal(seg(t, 0.9, 1.5));                       // the signed gold CD, first revenue copy (1995)
    ui.set({ tree: treeWith(k, [{ icon: "extrude", label: "First revenue CD, 1995", ex: "▸", sel: t > 0.9 && t < 2.4 }]), statr: statR("", "Editing Part"), hint: "RealView Graphics", viewname: "*Front" });
    if (t >= 1.5) k.treeExtra = [...(k.treeExtra || []), { icon: "extrude", label: "First revenue CD, 1995", ex: "▸" }];
  } });

  // ---- 15 WELCOME: the program explodes away; the portrait lands ----
  const finShot = { t: V(20, 80, 0), dist: 3050, az: 11, el: 4, fov: 24, roll: 0, centre: 0 };
  const pushShot = { t: V(30, 245, 0), dist: 1720, az: 5, el: 2, fov: 24, roll: 0, centre: 0 };
  const PANELS = [["title", 640, 13, 0, -1], ["cmd", 640, 54, 0, -1], ["tabs", 640, 92, 0, -1], ["left", 94, 394, -1, 0], ["tp", 1265, 394, 1, 0], ["btabs", 640, 694, 0, 1], ["status", 640, 711, 0, 1]];
  beats.push({ id: "welcome", dur: 3.6, finale: true, cues: [[0.05, "swell"]], update(t) {
    realWorkshop(1);
    const ex = seg(t, 0.0, 1.5), ep = ex * ex;
    ui.set({ explode: ep, viewname: "", tree: treeWith(k, [{ icon: "extrude", label: "Portrait", sel: true }]) });
    const vpui = document.getElementById("vpui"); if (vpui && ep > 0) vpui.style.opacity = String(1 - seg(t, 0, 0.35));
    camTo(finShot, t, 0.15, 2.4);
    const T = t + k.hold;
    if (T > 2.4) lerpRig(vp, finShot, pushShot, ease.io(seg(T, 2.4, 10)));
    vp.hemi.intensity = 0.42; vp.key.intensity = 1.2; vp.warm.intensity = 0.18e5;
    room.visible = true; roomMat.uniforms.o.value = ease.io(seg(t, 0.1, 0.9));
    quote.visible = false;
    // portrait flies in from the room and lands on the wall
    portrait.visible = t >= 0.9;
    const fp = seg(t, 0.9, 2.15), fe = ease.expo(fp);
    portrait.position.copy(SLOT.portrait).add(V(lerp(-60, 0, fe), lerp(-140, 0, fe), lerp(1700, 0, fe)));
    const settle = fp >= 1 ? Math.sin(Math.min(1, (t - 2.15) / 0.5) * Math.PI) * (1 - Math.min(1, (t - 2.15) / 0.5)) * 2.5 : 0;
    portrait.position.z += settle;
    portrait.rotation.set(lerp(-0.35, 0, fe), lerp(0.55, 0, fe), lerp(-0.12, 0, fe));
    spotG.visible = true; spot.intensity = 6 * ease.io(seg(t, 1.9, 3.0));
    vp.renderer.toneMappingExposure = lerp(0.96, 0.98, seg(t, 1.5, 3));
  } });

  return beats;
}
