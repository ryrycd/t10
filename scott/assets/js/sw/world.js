// The shared world: Scott's workshop pegboard wall (units mm, wall face at z = 0, +z toward the room)
// and a registry so every frame can start from "everything hidden" and let the beats re-show their parts.
import * as THREE from "three";

export const WALL = { w: 1700, h: 1000, t: 14, pitch: 25.4 };
// where each life object hangs (x, y on the wall face)
export const SLOT = {
  cd: new THREE.Vector3(-610, 210, 0),
  graph: new THREE.Vector3(-290, 200, 0),
  portrait: new THREE.Vector3(30, 190, 0),
  tablet: new THREE.Vector3(360, 215, 0),
  pc: new THREE.Vector3(-470, -150, 0),
  blob: new THREE.Vector3(-150, -150, 0),
  shelfY: -150,
  dogdoor: new THREE.Vector3(190, -300, 0),
  radar: new THREE.Vector3(560, -250, 0),
  sign: new THREE.Vector3(0, 405, 0),
};

export function createWorld(vp) {
  const reg = [];
  const W = {
    reg(o) { reg.push(o); vp.scene.add(o); return o; },
    reset() { for (const o of reg) o.visible = false; },
    group(name) { const g = new THREE.Group(); g.name = name; return W.reg(g); },
  };

  // pegboard textures: SolidWorks look (grey, dark holes) and RealView look (hardboard)
  const tex = (real) => {
    const c = document.createElement("canvas"); const S = 2; c.width = Math.round(WALL.w * S / 2); c.height = Math.round(WALL.h * S / 2);
    const g = c.getContext("2d"); const k = c.width / WALL.w;
    if (real) {
      g.fillStyle = "#8C7257"; g.fillRect(0, 0, c.width, c.height);
      const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
      let s = 1234567; const r = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
      for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 18; d[i] += n; d[i + 1] += n * 0.85; d[i + 2] += n * 0.6; }
      g.putImageData(id, 0, 0);
    } else { g.fillStyle = "#C9C9CF"; g.fillRect(0, 0, c.width, c.height); }
    const nx = Math.floor(WALL.w / WALL.pitch), ny = Math.floor(WALL.h / WALL.pitch);
    const ox = (WALL.w - (nx - 1) * WALL.pitch) / 2, oy = (WALL.h - (ny - 1) * WALL.pitch) / 2;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const x = (ox + i * WALL.pitch) * k, y = (oy + j * WALL.pitch) * k, rr = 3.2 * k;
      g.beginPath(); g.arc(x, y, rr, 0, Math.PI * 2);
      g.fillStyle = real ? "#2A1D12" : "#9C9EA8"; g.fill();
      if (real) { g.beginPath(); g.arc(x - 0.5, y - 0.5, rr, Math.PI * 0.9, Math.PI * 1.6); g.strokeStyle = "rgba(255,230,190,.25)"; g.lineWidth = 1; g.stroke(); }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  };
  const wallGeo = new THREE.BoxGeometry(WALL.w, WALL.h, WALL.t);
  wallGeo.translate(0, 0, -WALL.t / 2);
  const mSW = vp.swMat(0xC4C4CB); mSW.map = tex(false); mSW.color.set(0xffffff); mSW.roughness = 0.75;
  const mReal = new THREE.MeshStandardMaterial({ map: tex(true), roughness: 0.82, metalness: 0, envMapIntensity: 0.6 });
  const side = vp.swMat(0xB8B8C0);
  const wall = new THREE.Mesh(wallGeo, [side, side, side, side, mSW, side]);
  wall.receiveShadow = true;
  const wallEdges = vp.edges(wallGeo, 0x000000, 1.5);
  W.wall = W.reg(new THREE.Group()); W.wall.add(wall, wallEdges);
  W.setWallReal = (real) => { wall.material[4] = real ? mReal : mSW; const s = real ? 0x6E5338 : 0xB8B8C0; side.color.set(s); wallEdges.visible = !real; };

  // a floor and a soft back-room so RealView shots have somewhere for light to land
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(6000, 3000), new THREE.MeshStandardMaterial({ color: 0x8A8178, roughness: 0.9 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -WALL.h / 2 - 2, 1200); floor.receiveShadow = true;
  W.floor = W.reg(floor);

  // shelf for the PC and the blob
  const shelfGeo = new THREE.BoxGeometry(760, 18, 240); shelfGeo.translate(0, -9, 120);
  const shelf = new THREE.Mesh(shelfGeo, vp.swMat()); shelf.castShadow = shelf.receiveShadow = true;
  W.shelf = W.reg(new THREE.Group()); W.shelf.add(shelf, vp.edges(shelfGeo)); W.shelf.position.set(-310, SLOT.shelfY, 0);
  W.shelfMesh = shelf;

  W.setReal = (mesh, mat) => { mesh.userData.sw ??= mesh.material; mesh.material = mat || mesh.userData.sw; };
  return W;
}

// a peg hook (pegboard hardware) at a wall point
export function pegHook(vp, real = false) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: real ? 0xC9CCD2 : 0x9C9AA4, metalness: real ? 0.9 : 0.1, roughness: 0.3 });
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, -4), new THREE.Vector3(0, 0, 8), new THREE.Vector3(0, -6, 14), new THREE.Vector3(0, -6, 60), new THREE.Vector3(0, 6, 70)]);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 2.4, 10), mat); tube.castShadow = true;
  g.add(tube); g.userData.mat = mat; return g;
}
