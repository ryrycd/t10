// Onshape in a browser window, drawn over the stage while beats 8-10 are current.
// State lives in ui.set("os", {...}); we hook ui.commit so it hides itself on every other beat.
const $ = (id) => document.getElementById(id);

export const FOUNDERS = [
  { n: "Jon", i: "JH", c: "#E8603C" }, { n: "John", i: "JM", c: "#2E86DE" }, { n: "Dave", i: "DC", c: "#1E9E57" },
  { n: "Tommy", i: "TL", c: "#8E44AD" }, { n: "Mike", i: "ML", c: "#E19A12" }, { n: "Scott", i: "SH", c: "#D81B60" },
];
export const AJ = { n: "AJ", i: "AJ", c: "#0F9DB0" };

const ICONS = ["M4 18 L10 6 L16 18Z", "M4 14 H20 V18 H4Z M7 6 H17 V14 H7Z", "M12 4 A8 8 0 1 1 11.9 4Z", "M4 18 C8 4 16 20 20 6", "M5 18 L9 6 H15 L19 18Z", "M4 12 H20", "M4 20 V10 Q4 4 10 4 H20", "M4 20 L10 4 H20", "M6 18 L12 6 L18 18", "M5 5 H19 V19 H5Z", "M12 5 A7 7 0 1 0 12.1 5Z M12 9 A3 3 0 1 0 12.1 9Z", "M4 12 L12 4 L20 12 L12 20Z"];
const ico = (d) => `<svg viewBox="0 0 24 24" width="24" height="24"><path d="${d}" fill="none" stroke="#3C4A57" stroke-width="1.6" stroke-linejoin="round"/></svg>`;

export function installOnshape(ui) {
  const root = $("onshape");
  root.innerHTML = `
  <div class="os-frame">
    <div class="os-bt"><div class="os-dots"><i style="background:#FF5F57"></i><i style="background:#FEBC2E"></i><i style="background:#28C840"></i></div>
      <div class="os-tab"><span class="os-fav"></span>Scott Harris | Onshape<span class="os-x">✕</span></div><div class="os-plus">+</div></div>
    <div class="os-url"><span>‹</span><span>›</span><span>⟳</span><div class="os-box"><span class="os-lock">🔒︎</span>cad.onshape.com/documents/6f3a1c2e9b7d4e58a0c1b2d3/w/9e8f7a6b5c4d3e2f1a0b9c8d/e/1a2b3c4d5e6f7a8b9c0d1e2f</div><span>☆</span></div>
    <div class="os-tb"><span class="os-burger">☰</span><img src="../assets/img/onshape-logo.png" alt="onshape"><b>Scott Harris</b><span class="os-main">Main</span>
      <span class="os-right"><span class="os-avs" id="osAvs"></span><span class="os-share">Share</span><span class="os-q">?</span></span></div>
    <div class="os-ft"><span class="os-undo">↶ ↷</span><span class="os-sk">✎ Sketch</span>${ICONS.map((d) => `<i>${ico(d)}</i>`).join("")}<span class="os-search">Search tools…</span></div>
    <div class="os-fl"><div class="os-flh"><b id="osCount">Features (0)</b><span>⌕ ⚲</span></div><div class="os-filter">Filter by name or type</div>
      <div class="os-g">▾ Default geometry</div><div class="os-d">Origin</div><div class="os-d">Top</div><div class="os-d">Front</div><div class="os-d">Right</div>
      <div id="osFeats"></div><div class="os-parts"><b id="osParts">Parts (0)</b><div id="osPartList"></div></div></div>
    <div class="os-bot"><span class="os-addtab">+</span><span class="on">Part Studio 1</span><span>Assembly 1</span><span>Drawing 1</span></div>
    <svg class="os-cube" viewBox="0 0 110 110" width="118" height="118"><path d="M55 14 L92 34 L92 76 L55 96 L18 76 L18 34Z" fill="#F4F6F8" stroke="#9AA7B4"/><path d="M18 34 L55 54 L92 34 M55 54 V96" fill="none" stroke="#9AA7B4"/>
      <text x="55" y="38" font-size="11" text-anchor="middle" fill="#56636F" font-family="Arial">Top</text><text x="36" y="76" font-size="11" text-anchor="middle" fill="#56636F" font-family="Arial">Front</text><text x="74" y="76" font-size="11" text-anchor="middle" fill="#56636F" font-family="Arial">Right</text></svg>
  </div>
  <div id="osDyn"></div>`;
  let last = "", lastFeat = "", lastAv = "", shown = false;
  const vpbg = $("vpbg");
  const orig = ui.commit;
  ui.commit = () => {
    orig();
    const st = ui.get("os");
    if (!st) {
      if (shown) { root.style.display = "none"; root.style.transform = ""; vpbg.style.removeProperty("left"); vpbg.style.removeProperty("top"); vpbg.style.removeProperty("width"); vpbg.style.removeProperty("height"); vpbg.style.removeProperty("background"); shown = false; last = lastFeat = lastAv = ""; }
      return;
    }
    if (!shown) { root.style.display = "block"; shown = true; }
    if (st.min) { for (const p of ["left", "top", "width", "height", "background"]) vpbg.style.removeProperty(p); }
    else Object.assign(vpbg.style, { left: "0px", top: "0px", width: "1920px", height: "1080px", background: "#FFFFFF" });
    const feats = JSON.stringify([st.feats, st.parts]);
    if (feats !== lastFeat) {
      lastFeat = feats;
      $("osCount").textContent = `Features (${st.feats.length})`;
      $("osFeats").innerHTML = st.feats.map((f) => `<div class="os-f${f.sel ? " sel" : ""}"><span class="os-fi">${f.icon || "▱"}</span>${f.n}${f.by ? `<span class="os-by" style="background:${f.by.c}">${f.by.i}</span>` : ""}</div>`).join("");
      $("osParts").textContent = `Parts (${st.parts.length})`;
      $("osPartList").innerHTML = st.parts.map((p) => `<div class="os-d" style="color:#222">◧ ${p}</div>`).join("");
    }
    const av = JSON.stringify(st.avatars);
    if (av !== lastAv) { lastAv = av; $("osAvs").innerHTML = st.avatars.map((a) => `<span class="os-av${a.ring ? " ring" : ""}" style="background:${a.c}">${a.i}</span>`).join(""); }
    const dyn = st.html || "";
    if (dyn !== last) { $("osDyn").innerHTML = dyn; last = dyn; }
    if (st.min) { root.style.transformOrigin = `${st.min.x}px ${st.min.y}px`; root.style.transform = `scale(${st.min.s})`; root.style.opacity = st.min.o ?? 1; }
    else { root.style.transform = ""; root.style.opacity = ""; }
  };
}

// founder cursor: coloured Onshape pointer with a name tag
export const cursorHTML = (x, y, f, pulse = 0) => `<div class="os-cur" style="left:${x}px;top:${y}px"><svg width="26" height="34" viewBox="0 0 16 22"><path d="M1 1 L1 16 L5 12 L8 19 L10.5 18 L7.6 11.4 L13 11.4Z" fill="${f.c}" stroke="#fff" stroke-width="1.2"/></svg><span style="background:${f.c}">${f.n}</span>${pulse > 0 ? `<i style="border-color:${f.c};transform:scale(${1 + pulse * 2});opacity:${1 - pulse}"></i>` : ""}</div>`;

// ---------- canvas textures ----------
export function drawSW95(c) {
  const g = c.getContext("2d"), W = c.width, H = c.height;
  g.fillStyle = "#C0C0C0"; g.fillRect(0, 0, W, H);
  const bevel = (x, y, w, h, inset) => { g.fillStyle = "#C0C0C0"; g.fillRect(x, y, w, h); g.strokeStyle = inset ? "#808080" : "#FFFFFF"; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y); g.lineTo(x + w, y); g.stroke(); g.strokeStyle = inset ? "#FFFFFF" : "#404040"; g.beginPath(); g.moveTo(x + w, y); g.lineTo(x + w, y + h); g.lineTo(x, y + h); g.stroke(); };
  // title bar
  g.fillStyle = "#000080"; g.fillRect(2, 2, W - 4, 24);
  g.fillStyle = "#fff"; g.font = "bold 15px Arial"; g.fillText("SolidWorks - [Part1]", 30, 19);
  g.fillStyle = "#D7352C"; g.fillRect(8, 6, 16, 16);
  for (let i = 0; i < 3; i++) { bevel(W - 66 + i * 21, 5, 18, 16); }
  g.fillStyle = "#000"; g.font = "12px Arial"; g.fillText("_", W - 61, 17); g.fillText("□", W - 41, 18); g.fillText("x", W - 18, 17);
  // menu
  g.font = "14px Arial"; g.fillStyle = "#000"; ["File", "Edit", "View", "Insert", "Tools", "Window", "Help"].forEach((m, i) => g.fillText(m, 10 + i * 52, 44));
  // toolbars
  for (let i = 0; i < 22; i++) { bevel(6 + i * 26, 52, 23, 22); g.fillStyle = ["#7B8FB0", "#B9A05A", "#8DA27B", "#A0707A"][i % 4]; g.fillRect(12 + i * 26, 58, 11, 10); }
  // FeatureManager
  g.fillStyle = "#fff"; g.fillRect(6, 82, 150, H - 140); bevel(6, 82, 150, H - 140, true);
  g.fillStyle = "#000"; g.font = "13px Arial";
  ["Part1", "  Annotations", "  Lighting", "  Plane1", "  Plane2", "  Plane3", "  Origin", "  Base-Extrude", "  Fillet1", "  Cut-Extrude1"].forEach((t, i) => { g.fillStyle = i === 7 ? "#000080" : "#000"; if (i === 7) { g.fillRect(14, 110 + i * 20 - 13, 120, 17); g.fillStyle = "#fff"; } g.fillText(t, 14, 110 + i * 20); });
  // graphics area
  g.fillStyle = "#F4F4F0"; g.fillRect(160, 82, W - 168, H - 140);
  // a shaded L-bracket in iso
  const P = (x, y, z) => [W * 0.6 + (x - z) * 0.87 * 2.2, H * 0.52 - y * 2.2 + (x + z) * 0.5 * 2.2];
  const face = (pts, col) => { g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(...P(...p)) : g.moveTo(...P(...p)))); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = "#000"; g.lineWidth = 1.2; g.stroke(); };
  face([[0, 0, 0], [60, 0, 0], [60, 12, 0], [12, 12, 0], [12, 50, 0], [0, 50, 0]], "#9C9CA6");
  face([[0, 50, 0], [12, 50, 0], [12, 50, 40], [0, 50, 40]], "#C9C9D2");
  face([[12, 12, 0], [60, 12, 0], [60, 12, 40], [12, 12, 40]], "#C9C9D2");
  face([[60, 0, 0], [60, 12, 0], [60, 12, 40], [60, 0, 40]], "#76767F");
  face([[12, 12, 0], [12, 50, 0], [12, 50, 40], [12, 12, 40]], "#76767F");
  // triad + status + taskbar
  g.strokeStyle = "#C00"; g.beginPath(); g.moveTo(180, H - 78); g.lineTo(205, H - 70); g.stroke(); g.strokeStyle = "#080"; g.beginPath(); g.moveTo(180, H - 78); g.lineTo(180, H - 104); g.stroke(); g.strokeStyle = "#00C"; g.beginPath(); g.moveTo(180, H - 78); g.lineTo(160, H - 68); g.stroke();
  bevel(2, H - 54, W - 4, 20, true); g.fillStyle = "#000"; g.font = "12px Arial"; g.fillText("Ready", 8, H - 39); g.fillText("Editing Part", W - 110, H - 39);
  g.fillStyle = "#C0C0C0"; g.fillRect(0, H - 30, W, 30); g.strokeStyle = "#fff"; g.beginPath(); g.moveTo(0, H - 29); g.lineTo(W, H - 29); g.stroke();
  bevel(3, H - 26, 62, 23); g.fillStyle = "#000"; g.font = "bold 13px Arial"; g.fillText("Start", 22, H - 9); g.fillStyle = "#555"; g.fillRect(8, H - 20, 10, 10);
  bevel(70, H - 26, 180, 23, true); g.font = "12px Arial"; g.fillStyle = "#000"; g.fillText("SolidWorks - [Part1]", 78, H - 10);
  bevel(W - 70, H - 26, 66, 23, true); g.fillText("9:41 AM", W - 62, H - 10);
}

export function drawOnshapeScreen(c) {
  const g = c.getContext("2d"), W = c.width, H = c.height;
  g.fillStyle = "#fff"; g.fillRect(0, 0, W, H);
  g.fillStyle = "#F3F4F6"; g.fillRect(0, 0, W, 34); g.fillStyle = "#3C4A57"; g.font = "bold 18px Arial"; g.fillText("onshape", 12, 23);
  g.fillStyle = "#1B7BD6"; g.fillRect(W - 86, 6, 74, 22); g.fillStyle = "#fff"; g.font = "13px Arial"; g.fillText("Share", W - 68, 22);
  g.strokeStyle = "#C2C2C2"; g.beginPath(); g.moveTo(0, 34); g.lineTo(W, 34); g.moveTo(0, 60); g.lineTo(W, 60); g.moveTo(120, 60); g.lineTo(120, H - 26); g.stroke();
  for (let i = 0; i < 14; i++) { g.strokeStyle = "#5C6B78"; g.strokeRect(12 + i * 30, 40, 16, 14); }
  g.fillStyle = "#333"; g.font = "13px Arial"; ["Features (6)", "Sketch 1", "Extrude 1", "Fillet 1", "Sketch 2", "Extrude 2", "Fillet 2"].forEach((t, i) => g.fillText(t, 10, 84 + i * 22));
  const cx = W * 0.6, cy = H * 0.55;
  g.fillStyle = "#7B848B"; g.beginPath(); g.moveTo(cx - 120, cy - 20); g.lineTo(cx + 40, cy - 80); g.lineTo(cx + 150, cy - 30); g.lineTo(cx - 10, cy + 40); g.closePath(); g.fill();
  g.fillStyle = "#486778"; g.beginPath(); g.moveTo(cx - 120, cy - 20); g.lineTo(cx - 10, cy + 40); g.lineTo(cx - 10, cy + 54); g.lineTo(cx - 120, cy - 6); g.closePath(); g.fill();
  g.fillStyle = "#56636e"; g.beginPath(); g.moveTo(cx - 10, cy + 40); g.lineTo(cx + 150, cy - 30); g.lineTo(cx + 150, cy - 16); g.lineTo(cx - 10, cy + 54); g.closePath(); g.fill();
  g.fillStyle = "#D1D1D1"; g.fillRect(0, H - 26, W, 26); g.fillStyle = "#fff"; g.fillRect(40, H - 24, 110, 24); g.fillStyle = "#333"; g.font = "12px Arial"; g.fillText("Part Studio 1", 52, H - 8);
  [["#E8603C", "JH"], ["#2E86DE", "JM"], ["#1E9E57", "DC"], ["#D81B60", "SH"]].forEach(([col, t], i) => { g.fillStyle = col; g.beginPath(); g.arc(W - 120 - i * 26, 17, 11, 0, 7); g.fill(); g.fillStyle = "#fff"; g.font = "bold 9px Arial"; g.fillText(t, W - 127 - i * 26, 21); });
}
