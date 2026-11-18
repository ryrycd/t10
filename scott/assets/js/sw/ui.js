// SolidWorks chrome for the film. Every frame: ui.reset() sets defaults, beats call ui.set(...),
// then ui.commit() writes only what changed. UI state changes are hard cuts, like the real app.
const $ = (id) => document.getElementById(id);

// ---------- icons (our own simplified drawings in the SolidWorks colour language) ----------
export const IC = {
  extrude: `<svg viewBox="0 0 24 24"><path d="M4 15 L12 19 L20 15 L12 11Z" fill="#F2C14E" stroke="#8F7426"/><path d="M4 9 L12 13 L20 9 L12 5Z" fill="#FFE38A" stroke="#8F7426"/><path d="M4 9 V15 M20 9 V15 M12 13 V19" stroke="#8F7426"/></svg>`,
  revolve: `<svg viewBox="0 0 24 24"><ellipse cx="12" cy="15" rx="8" ry="4" fill="#F2C14E" stroke="#8F7426"/><path d="M4 15 V9 a8 4 0 0 1 16 0 V15" fill="#FFE38A" stroke="#8F7426"/><path d="M12 2 V22" stroke="#555" stroke-dasharray="2 2"/></svg>`,
  sweep: `<svg viewBox="0 0 24 24"><path d="M4 18 C8 6 16 18 20 6" stroke="#8F7426" stroke-width="4" fill="none"/><path d="M4 18 C8 6 16 18 20 6" stroke="#FFE38A" stroke-width="2" fill="none"/></svg>`,
  loft: `<svg viewBox="0 0 24 24"><path d="M5 18 L9 6 H15 L19 18Z" fill="#FFE38A" stroke="#8F7426"/></svg>`,
  cut: `<svg viewBox="0 0 24 24"><path d="M3 9 L12 13 L21 9 L12 5Z" fill="#DDE6F2" stroke="#55708F"/><path d="M3 9 V16 L12 20 L21 16 V9" fill="#C6D3E4" stroke="#55708F"/><path d="M9 8 L12 9.5 L15 8 L12 6.5Z" fill="#F2C14E" stroke="#8F7426"/></svg>`,
  hole: `<svg viewBox="0 0 24 24"><path d="M4 8 L12 12 L20 8 L12 4Z" fill="#DDE6F2" stroke="#55708F"/><path d="M4 8 V16 L12 20 L20 16 V8" fill="#C6D3E4" stroke="#55708F"/><ellipse cx="12" cy="8" rx="3" ry="1.5" fill="#55708F"/></svg>`,
  fillet: `<svg viewBox="0 0 24 24"><path d="M4 20 V11 Q4 4 11 4 H20 V20Z" fill="#C6D3E4" stroke="#55708F"/><path d="M4 11 Q4 4 11 4" stroke="#F2A33A" stroke-width="2" fill="none"/></svg>`,
  pattern: `<svg viewBox="0 0 24 24"><rect x="2" y="9" width="5" height="6" fill="#F2C14E" stroke="#8F7426"/><rect x="9.5" y="9" width="5" height="6" fill="#C6D3E4" stroke="#55708F"/><rect x="17" y="9" width="5" height="6" fill="#C6D3E4" stroke="#55708F"/></svg>`,
  rib: `<svg viewBox="0 0 13 13"><path d="M2 11 L6 3 H8 L11 11Z" fill="#C6D3E4" stroke="#55708F"/></svg>`,
  sm: `<svg viewBox="0 0 13 13"><rect x="1.5" y="3" width="10" height="7" fill="#DDE6F2" stroke="#55708F"/></svg>`,
  smY: `<svg viewBox="0 0 13 13"><rect x="1.5" y="3" width="10" height="7" fill="#FFE38A" stroke="#8F7426"/></svg>`,
  ref: `<svg viewBox="0 0 24 24"><path d="M3 15 L10 19 L21 12 L14 8Z" fill="#CFE0F5" stroke="#5B83C2"/></svg>`,
  curves: `<svg viewBox="0 0 24 24"><path d="M4 18 C8 4 14 22 20 6" stroke="#5B83C2" fill="none" stroke-width="1.8"/></svg>`,
  i3d: `<svg viewBox="0 0 24 24"><path d="M5 15 L12 19 L19 15 L12 11Z" fill="#F3D27A" stroke="#8F7426"/><path d="M12 15 V4" stroke="#E5731F" stroke-width="2"/><path d="M9 7 L12 3 L15 7Z" fill="#E5731F"/></svg>`,
  sketch: `<svg viewBox="0 0 24 24"><rect x="3" y="7" width="13" height="13" fill="#DDE6F2" stroke="#5B83C2"/><path d="M10 15 L20 3 L22 5 L12 17 L9 18Z" fill="#F2C14E" stroke="#8F7426"/></svg>`,
  smartdim: `<svg viewBox="0 0 24 24"><path d="M3 18 H21" stroke="#333"/><path d="M3 18 L6 16 V20Z M21 18 L18 16 V20Z" fill="#333"/><path d="M5 12 L13 4 L16 7 L8 15 L4 16Z" fill="#9BB6D8" stroke="#43638F"/></svg>`,
  line: `<svg viewBox="0 0 13 13"><path d="M2 11 L11 2" stroke="#2D4F84" stroke-width="1.4"/><circle cx="2" cy="11" r="1.4" fill="#2D4F84"/></svg>`,
  rect: `<svg viewBox="0 0 13 13"><rect x="2" y="3" width="9" height="7" fill="none" stroke="#2D4F84" stroke-width="1.3"/></svg>`,
  circle: `<svg viewBox="0 0 13 13"><circle cx="6.5" cy="6.5" r="4.5" fill="none" stroke="#2D4F84" stroke-width="1.3"/></svg>`,
  trim: `<svg viewBox="0 0 24 24"><path d="M4 18 L20 6" stroke="#2D4F84" stroke-width="1.5"/><path d="M10 8 L14 16 M14 8 L10 16" stroke="#C0392B" stroke-width="1.6"/></svg>`,
  rel: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" fill="#E8F6E9" stroke="#2E9B48"/><path d="M7 12 H17" stroke="#2E9B48" stroke-width="2"/></svg>`,
  exitsk: `<svg viewBox="0 0 24 24"><rect x="3" y="7" width="13" height="13" fill="#DDE6F2" stroke="#5B83C2"/><path d="M13 9 L21 3" stroke="#2E9B48" stroke-width="2"/><path d="M17 3 H21 V7" stroke="#2E9B48" stroke-width="2" fill="none"/></svg>`,
  shaded: `<svg viewBox="0 0 24 24"><path d="M4 18 L12 5 L20 18Z" fill="#9DA0BB" stroke="#2D4F84"/></svg>`,
  // tree icons
  part: `<svg viewBox="0 0 14 14"><path d="M2 5 L7 2.5 L12 5 V10 L7 12.5 L2 10Z" fill="#F0C15A" stroke="#8C6C1A"/><path d="M2 5 L7 7.5 L12 5 M7 7.5 V12.5" stroke="#8C6C1A" fill="none"/></svg>`,
  history: `<svg viewBox="0 0 14 14"><rect x="1.5" y="1.5" width="11" height="11" fill="#fff" stroke="#6E7F96"/><circle cx="7" cy="7" r="3.6" fill="none" stroke="#3A6EA5"/><path d="M7 4.6 V7 H8.8" stroke="#3A6EA5" fill="none"/></svg>`,
  sensors: `<svg viewBox="0 0 14 14"><rect x="1.5" y="1.5" width="11" height="11" fill="#fff" stroke="#6E7F96"/><path d="M4 9 a4 4 0 0 1 6 0" stroke="#D96B2B" fill="none"/><circle cx="7" cy="9.5" r="1" fill="#D96B2B"/></svg>`,
  annot: `<svg viewBox="0 0 14 14"><rect x="1.5" y="1.5" width="11" height="11" fill="#fff" stroke="#6E7F96"/><text x="4" y="11" font-size="9" font-family="Arial" fill="#3A6EA5">A</text></svg>`,
  bodies: `<svg viewBox="0 0 14 14"><rect x="1.5" y="1.5" width="11" height="11" fill="#fff" stroke="#6E7F96"/><path d="M4 6 L7 4.5 L10 6 V9 L7 10.5 L4 9Z" fill="#9AA6B6"/></svg>`,
  material: `<svg viewBox="0 0 14 14"><path d="M2 4 H12 M2 7 H12 M2 10 H12" stroke="#7A5C3C" stroke-width="1.8"/><path d="M2 2.5 H12" stroke="#B48A5A"/></svg>`,
  plane: `<svg viewBox="0 0 14 14"><path d="M2 4 L9 2 V10 L2 12Z" fill="#9FC0EA" stroke="#3A6EA5"/></svg>`,
  origin: `<svg viewBox="0 0 14 14"><path d="M3 2 V11 H12" stroke="#333" stroke-width="1.3" fill="none"/></svg>`,
  sk: `<svg viewBox="0 0 14 14"><rect x="1.5" y="4" width="8" height="8" fill="#DDE6F2" stroke="#5B83C2"/><path d="M6 9 L12 2.5 L13 3.5 L7 10Z" fill="#F2C14E" stroke="#8C6C1A"/></svg>`,
  motion: `<svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" fill="#E8F1FB" stroke="#3A6EA5"/><path d="M6 4.5 L9.5 7 L6 9.5Z" fill="#3A6EA5"/></svg>`,
};

const QA = {
  home: `<svg viewBox="0 0 14 14"><path d="M2 7 L7 2.5 L12 7 V12 H2Z" fill="none" stroke="#444" stroke-width="1.1"/></svg>`,
  new: `<svg viewBox="0 0 14 14"><path d="M3 1.5 H9 L11.5 4 V12.5 H3Z" fill="#fff" stroke="#444"/></svg>`,
  open: `<svg viewBox="0 0 14 14"><path d="M1.5 4 H6 L7 5 H12.5 V11.5 H1.5Z" fill="#F6D47E" stroke="#8A6D1A"/></svg>`,
  save: `<svg viewBox="0 0 14 14"><rect x="2" y="2" width="10" height="10" fill="#3F6FB5"/><rect x="4" y="2.6" width="6" height="3.6" fill="#fff"/></svg>`,
  print: `<svg viewBox="0 0 14 14"><rect x="2" y="5" width="10" height="5" fill="#666"/><rect x="4" y="2" width="6" height="3" fill="#fff" stroke="#444"/></svg>`,
  undo: `<svg viewBox="0 0 14 14"><path d="M4 5 H9 a3 3 0 0 1 0 6 H6" fill="none" stroke="#444" stroke-width="1.2"/><path d="M4 2.5 V7.5 L1.5 5Z" fill="#444"/></svg>`,
  redo: `<svg viewBox="0 0 14 14"><path d="M10 5 H5 a3 3 0 0 0 0 6 H8" fill="none" stroke="#BBB" stroke-width="1.2"/><path d="M10 2.5 V7.5 L12.5 5Z" fill="#BBB"/></svg>`,
  sel: `<svg viewBox="0 0 14 14"><path d="M3 2 L3 12 L6 9 L8 13 L9.5 12.3 L7.6 8.4 L11.5 8.4Z" fill="#fff" stroke="#333"/></svg>`,
  rebuild: `<svg viewBox="0 0 14 14"><rect x="4.5" y="1" width="5" height="12" rx="1.2" fill="#3E3E3E"/><circle cx="7" cy="3.6" r="1.25" fill="#E2423A"/><circle cx="7" cy="7" r="1.25" fill="#F2B632"/><circle cx="7" cy="10.4" r="1.25" fill="#39A845"/></svg>`,
  props: `<svg viewBox="0 0 14 14"><rect x="3" y="2" width="8" height="10" fill="#fff" stroke="#444"/><path d="M5 5 H9 M5 7 H9 M5 9 H8" stroke="#888"/></svg>`,
  gear: `<svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="3.4" fill="none" stroke="#444" stroke-width="1.8" stroke-dasharray="1.8 1.2"/><circle cx="7" cy="7" r="1.3" fill="#444"/></svg>`,
};

const HUD = [
  `<svg viewBox="0 0 15 15"><circle cx="6" cy="6" r="4" fill="none" stroke="#3C5F8F" stroke-width="1.5"/><path d="M9 9 L13 13" stroke="#3C5F8F" stroke-width="2"/></svg>`,
  `<svg viewBox="0 0 15 15"><rect x="2" y="2" width="11" height="11" fill="none" stroke="#3C5F8F" stroke-dasharray="2 1.5"/><circle cx="7" cy="7" r="2.5" fill="none" stroke="#3C5F8F"/></svg>`,
  `<svg viewBox="0 0 15 15"><path d="M4 7 a4 4 0 1 1 1.5 3" fill="none" stroke="#3C5F8F" stroke-width="1.4"/><path d="M2 5 L4.5 8 L6 4.5Z" fill="#3C5F8F"/></svg>`,
  `<svg viewBox="0 0 15 15"><path d="M2 10 L7 13 L13 9 V4 L8 1.5 L2 5Z" fill="#A9C1E0" stroke="#3C5F8F"/><path d="M2 5 L13 9" stroke="#D0453A" stroke-width="1.2"/></svg>`,
  `<svg viewBox="0 0 15 15"><rect x="2" y="3" width="11" height="9" fill="#DDE7F3" stroke="#3C5F8F"/><path d="M4 9 L7 6 L11 9" stroke="#3C5F8F" fill="none"/></svg>`,
  `<svg viewBox="0 0 15 15"><path d="M2 5 L7.5 2 L13 5 V11 L7.5 14 L2 11Z" fill="#B9CDE6" stroke="#3C5F8F"/><path d="M2 5 L7.5 8 L13 5 M7.5 8 V14" stroke="#3C5F8F" fill="none"/></svg>`,
  `<svg viewBox="0 0 15 15"><path d="M2 5 L7.5 2 L13 5 V11 L7.5 14 L2 11Z" fill="#7F93B0" stroke="#2E3F59"/></svg>`,
  `<svg viewBox="0 0 15 15"><circle cx="7.5" cy="7.5" r="5" fill="none" stroke="#3C5F8F" stroke-width="1.4"/><circle cx="7.5" cy="7.5" r="1.8" fill="#3C5F8F"/></svg>`,
  `<svg viewBox="0 0 15 15"><circle cx="7.5" cy="7.5" r="5.5" fill="#E9604F"/><circle cx="5.5" cy="5.5" r="1.8" fill="#F7C64A"/><circle cx="9.8" cy="9.5" r="1.8" fill="#4E9BD8"/></svg>`,
  `<svg viewBox="0 0 15 15"><path d="M1.5 12 Q7.5 2 13.5 12Z" fill="#9CC5E8" stroke="#3C5F8F"/></svg>`,
  `<svg viewBox="0 0 15 15"><rect x="2" y="3" width="11" height="9" fill="none" stroke="#3C5F8F"/><path d="M2 6 H13" stroke="#3C5F8F"/></svg>`,
];

const TP = [
  `<svg viewBox="0 0 16 16"><path d="M2 8 L8 2.5 L14 8 V14 H2Z" fill="#3F6FB5"/></svg>`,
  `<svg viewBox="0 0 16 16"><rect x="2.5" y="2" width="11" height="12" fill="#fff" stroke="#556"/><path d="M5 5 H11 M5 8 H11" stroke="#5B8"/></svg>`,
  `<svg viewBox="0 0 16 16"><path d="M2 4 H7 L8 5 H14 V13 H2Z" fill="#F6D47E" stroke="#8A6D1A"/></svg>`,
  `<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="#E8EEF6" stroke="#556"/><path d="M4 11 L7 6 L10 9 L12 7" stroke="#C33" fill="none"/></svg>`,
  `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#E9604F"/><circle cx="6" cy="6" r="2" fill="#F7C64A"/><circle cx="10.5" cy="9.5" r="2" fill="#4E9BD8"/></svg>`,
  `<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" fill="#fff" stroke="#556"/><path d="M4 5 H12 M4 8 H12 M4 11 H10" stroke="#999"/></svg>`,
  `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#2F6DB5"/><path d="M5 8 H11 M8 5 V11" stroke="#fff" stroke-width="1.5"/></svg>`,
];

const LTABS = [
  `<svg viewBox="0 0 16 16"><path d="M2 5 L8 2 L14 5 V11 L8 14 L2 11Z" fill="#F0C15A" stroke="#8C6C1A"/><path d="M2 5 L8 8 L14 5 M8 8 V14" stroke="#8C6C1A" fill="none"/></svg>`,
  `<svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="1" fill="#5A7FB5"/><path d="M5 5.5 H11 M5 8.5 H11 M5 11.5 H9" stroke="#fff" stroke-width="1.3"/></svg>`,
  `<svg viewBox="0 0 16 16"><rect x="2" y="3" width="5" height="10" fill="#7C9ACB"/><rect x="9" y="3" width="5" height="10" fill="#B6C7E3"/></svg>`,
  `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="5.5" fill="none" stroke="#3C5F8F" stroke-width="1.5"/><path d="M8 2 V14 M2 8 H14" stroke="#3C5F8F"/></svg>`,
  `<svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6" fill="#E9604F"/><circle cx="6" cy="6" r="2" fill="#F7C64A"/><circle cx="10.5" cy="9.5" r="2" fill="#4E9BD8"/></svg>`,
];

// CommandManager layouts
function cmdFeatures() {
  const b = (t, s, x, w = 50) => `<div class="big" data-k="${t.replace(/<br>/g, " ")}" style="left:${x}px;width:${w}px">${s}${t}</div>`;
  const s = (t, x, y, ic = IC.sm) => `<div class="small" style="left:${x}px;top:${y}px">${ic}${t}</div>`;
  return b("Extruded<br>Boss/Base", IC.extrude, 6) + b("Revolved<br>Boss/Base", IC.revolve, 56)
    + s("Swept Boss/Base", 112, 4, IC.smY) + s("Lofted Boss/Base", 112, 21, IC.smY) + s("Boundary Boss/Base", 112, 38, IC.smY)
    + b("Extruded<br>Cut", IC.cut, 218) + b("Hole<br>Wizard", IC.hole, 266) + b("Revolved<br>Cut", IC.cut, 314)
    + s("Swept Cut", 366, 4) + s("Lofted Cut", 366, 21) + s("Boundary Cut", 366, 38)
    + b("Fillet", IC.fillet, 446) + b("Linear<br>Pattern", IC.pattern, 494)
    + s("Rib", 554, 4, IC.rib) + s("Draft", 554, 21) + s("Shell", 554, 38) + s("Wrap", 604, 4) + s("Intersect", 604, 21) + s("Mirror", 604, 38)
    + b("Reference<br>Geometry", IC.ref, 668, 56) + b("Curves", IC.curves, 724)
    + b("Instant3D", IC.i3d, 776, 54);
}
function cmdSketch() {
  const b = (t, s, x, w = 56) => `<div class="big" data-k="${t.replace(/<br>/g, " ")}" style="left:${x}px;width:${w}px">${s}${t}</div>`;
  const s = (t, x, y, ic = IC.sm) => `<div class="small" style="left:${x}px;top:${y}px">${ic}${t}</div>`;
  return b("Exit<br>Sketch", IC.exitsk, 4, 44) + b("Smart<br>Dimension", IC.smartdim, 50, 60)
    + s("Line", 116, 4, IC.line) + s("Rectangle", 116, 21, IC.rect) + s("Circle", 116, 38, IC.circle)
    + b("Trim<br>Entities", IC.trim, 196) + b("Convert<br>Entities", IC.sketch, 252) + b("Offset<br>Entities", IC.sketch, 308)
    + s("Mirror Entities", 372, 4) + s("Linear Sketch Pattern", 372, 21) + s("Move Entities", 372, 38)
    + b("Display/Delete<br>Relations", IC.rel, 506, 80) + b("Repair<br>Sketch", IC.sketch, 590) + b("Rapid<br>Sketch", IC.sketch, 646) + b("Instant2D", IC.smartdim, 702)
    + b("Shaded Sketch<br>Contours", IC.shaded, 762, 70);
}

const PM = {
  "Boss-Extrude": (st) => `
    <div class="grp">From<span class="chev"></span></div><div class="dd">Sketch Plane</div>
    <div class="grp">Direction 1<span class="chev"></span></div>
    <div class="row"><svg class="ic" viewBox="0 0 16 16"><path d="M3 12 L13 4" stroke="#444" stroke-width="1.4"/><path d="M13 4 L9 4.5 L12.5 8Z" fill="#444"/></svg><div class="dd" style="margin:0;flex:1">Blind</div></div>
    <div class="selbox"></div>
    <div class="row"><svg class="ic" viewBox="0 0 16 16"><path d="M2 13 H14 M2 3 H14" stroke="#555"/><path d="M8 4 V12" stroke="#2A6CC2" stroke-width="1.4"/><path d="M8 3.5 L6 6.5 H10Z M8 12.5 L6 9.5 H10Z" fill="#2A6CC2"/></svg><div class="spin">${st.depth || "10.00mm"}</div></div>
    <div class="row"><svg class="ic" viewBox="0 0 16 16"><path d="M3 13 L6 3 H13 L10 13Z" fill="#E4E4E4" stroke="#AAA"/></svg><div class="spin dis"></div></div>
    <div class="chk"><i></i>Draft outward</div>
    <div class="grp"><span class="cb"></span>Direction 2<span class="chev dn"></span></div>
    <div class="grp"><span class="cb"></span>Thin Feature<span class="chev dn"></span></div>
    <div class="grp">Selected Contours<span class="chev dn"></span></div>`,
  "Revolve": (st) => `
    <div class="grp">Axis of Revolution<span class="chev"></span></div><div class="selbox">Line1</div>
    <div class="grp">Direction1<span class="chev"></span></div>
    <div class="row"><svg class="ic" viewBox="0 0 16 16"><path d="M3 12 L13 4" stroke="#444" stroke-width="1.4"/></svg><div class="dd" style="margin:0;flex:1">Blind</div></div>
    <div class="row"><svg class="ic" viewBox="0 0 16 16"><path d="M8 3 a5 5 0 1 1 -4.5 3" stroke="#2A6CC2" fill="none" stroke-width="1.4"/></svg><div class="spin">${st.depth || "360.00deg"}</div></div>
    <div class="grp"><span class="cb"></span>Direction2<span class="chev dn"></span></div>
    <div class="grp">Selected Contours<span class="chev dn"></span></div>`,
  "Linear Pattern": (st) => `
    <div class="grp">Direction 1<span class="chev"></span></div><div class="selbox">Edge&lt;1&gt;</div>
    <div class="row"><svg class="ic" viewBox="0 0 16 16"><path d="M2 8 H14" stroke="#2A6CC2" stroke-width="1.4"/></svg><div class="spin">${st.sp1 || "60.00mm"}</div></div>
    <div class="row"><svg class="ic" viewBox="0 0 16 16"><text x="2" y="12" font-size="9" fill="#2A6CC2">#</text></svg><div class="spin">${st.n1 || "20"}</div></div>
    <div class="grp">Direction 2<span class="chev"></span></div><div class="selbox">Edge&lt;2&gt;</div>
    <div class="row"><svg class="ic" viewBox="0 0 16 16"><text x="2" y="12" font-size="9" fill="#2A6CC2">#</text></svg><div class="spin">${st.n2 || "15"}</div></div>
    <div class="grp">Features and Faces<span class="chev"></span></div><div class="selbox">${st.feat || "Boss-Extrude1"}</div>`,
  "Smart Dimension": (st) => `
    <div class="grp">Dimension<span class="chev"></span></div>
    <div class="row"><div class="spin">${st.depth || ""}</div></div>
    <div class="grp">Tolerance/Precision<span class="chev dn"></span></div>
    <div class="grp">Primary Value<span class="chev dn"></span></div>`,
  "Sketch Text": (st) => `
    <div class="grp">Curves<span class="chev"></span></div><div class="selbox"></div>
    <div class="grp">Text<span class="chev"></span></div><div class="selbox" style="min-height:44px;font-size:12px">${st.depth || ""}</div>
    <div class="row" style="margin-left:30px;gap:4px"><b>B</b><i>I</i><span>⟲</span><span>A</span></div>`,
};

export function createUI() {
  const chrome = $("chrome");
  chrome.innerHTML = `
  <div id="title" class="abs part"><div id="logo"><span class="ds">3DS</span><img src="../assets/img/solidworks-wordmark.svg" alt=""><span class="car">▶</span></div>
    <div id="qa">${Object.values(QA).map((s) => `<i>${s}</i>`).join("")}</div>
    <div id="doc"></div>
    <div id="search"><b>&gt;_</b>Search Commands<span style="margin-left:auto;margin-right:5px">⌕</span></div>
    <div class="winbtn" style="right:58px">—</div><div class="winbtn" style="right:30px">☐</div><div class="winbtn" style="right:2px">✕</div></div>
  <div id="cmd" class="abs part"></div>
  <div id="tabs" class="abs part"></div>
  <div id="left" class="abs part"><div id="ltabs">${LTABS.map((s, i) => `<i class="${i === 0 ? "on" : ""}">${s}</i>`).join("")}<span style="margin-left:auto;margin-right:8px;color:#777">◂ ▸</span></div>
    <div id="treewrap"><div id="filter"><svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1 H11 L7 6 V11 L5 10 V6Z" fill="none" stroke="#444"/></svg></div><div id="tree"></div></div>
    <div id="pm"><div class="pmh"><i id="pmicon"></i><span id="pmname"></span><span class="q">?</span></div>
      <div class="pmok"><svg width="13" height="13" viewBox="0 0 13 13"><path d="M1.5 7 L5 10.5 L11.5 2.5" stroke="#44991D" stroke-width="2.2" fill="none"/></svg><svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 2 L10 10 M10 2 L2 10" stroke="#DF2603" stroke-width="2"/></svg><svg width="16" height="12" viewBox="0 0 16 12"><ellipse cx="8" cy="6" rx="6.5" ry="4" fill="none" stroke="#333" stroke-width="1.1"/><circle cx="8" cy="6" r="2" fill="#333"/></svg></div>
      <div id="pmbody"></div></div></div>
  <div id="vpui" class="abs part"><div id="hud">${HUD.map((s) => `<i>${s}</i>`).join("")}</div>
    <div id="flyout"><span class="tri"></span><i style="width:14px;height:14px;display:block">${IC.part}</i><span id="flytext"></span></div>
    <div id="confirm"></div>
    <svg id="triad" width="56" height="56" viewBox="0 0 56 56"></svg>
    <div id="viewname"></div></div>
  <div id="tp" class="abs part">${TP.map((s) => `<i>${s}</i>`).join("")}</div>
  <div id="motion" class="abs part"><div class="bar"><b>Motion Study 1</b><span style="color:#666">Animation ▾</span><span>▶</span><span>■</span><span style="margin-left:auto;margin-right:12px;color:#666">00:00:00 · 00:00:02 · 00:00:04 · 00:00:06</span></div>
    <div class="lab" style="top:34px">Dog door (Default)</div><div class="lab" style="top:54px;padding-left:12px">Latch</div><div class="lab" style="top:74px;padding-left:12px">Flap</div><div class="lab" style="top:94px;padding-left:12px">Collar</div>
    <div class="grid"></div><div class="keys" id="mkeys"></div><div class="ph" id="mph"></div></div>
  <div id="btabs" class="abs part"><span style="color:#999;letter-spacing:2px">|◂ ◂ ▸ ▸|</span><span data-k="Model">Model</span><span data-k="3D Views">3D Views</span><span data-k="Motion Study 1">Motion Study 1</span></div>
  <div id="status" class="abs part"><span id="shint"></span><div class="r" id="statr"></div></div>`;
  $("tabs").innerHTML = ["Features", "Sketch", "Markup", "Evaluate", "MBD Dimensions", "SOLIDWORKS Add-Ins", "Simulation", "MBD", "SOLIDWORKS CAM", "SOLIDWORKS Visualize", "Analysis Preparation", "SOLIDWORKS Inspection"]
    .map((t) => `<span data-k="${t}">${t}</span>`).join("");
  $("triad").innerHTML = `<path d="M28 36 L48 46" stroke="#B71B1D" stroke-width="2"/><path d="M50 47 L43 46.5 L46 42Z" fill="#B71B1D"/>
    <path d="M28 36 L28 10" stroke="#2D7D2D" stroke-width="2"/><path d="M28 7 L25 13 H31Z" fill="#2D7D2D"/>
    <path d="M28 36 L10 46" stroke="#1C18B7" stroke-width="2"/><path d="M7.5 47.5 L12 42 L14 46.5Z" fill="#1C18B7"/>`;

  const parts = ["title", "cmd", "tabs", "left", "vpui", "tp", "btabs", "status", "motion"].map($);
  let cur = {}, next = {};
  const DEF = {
    title: "Scott Harris.SLDPRT *", cmdTab: "Features", cmdDis: false, pressed: "", panel: "tree", tree: [], pm: null, pmDepth: "",
    flyout: "", hint: "", statr: "", confirm: "none", modify: null, dialog: null, cursor: null, btab: "Model", motion: null,
    viewname: "*Isometric", explode: 0, swHidden: false, onshape: null, stamp: null,
  };
  const ui = {
    reset() { next = { ...DEF }; },
    // after the earlier beats have run: keep what persists (tree, title, status), clear the rest,
    // so the current beat owns every panel, pop-up and overlay it shows
    resetTransient() { const keep = { tree: next.tree, title: next.title, statr: next.statr, viewname: next.viewname }; next = { ...DEF, ...keep }; },
    set(k, v) { if (typeof k === "object") Object.assign(next, k); else next[k] = v; },
    get(k) { return next[k]; },
    commit() {
      const n = next, c = cur, ch = (k) => JSON.stringify(n[k]) !== JSON.stringify(c[k]);
      if (ch("title")) $("doc").textContent = n.title;
      if (ch("cmdTab")) {
        $("cmd").innerHTML = n.cmdTab === "Sketch" ? cmdSketch() : cmdFeatures();
        for (const s of $("tabs").children) s.classList.toggle("on", s.dataset.k === n.cmdTab);
        c.pressed = null;
      }
      if (ch("cmdDis")) $("cmd").classList.toggle("dis", n.cmdDis);
      if (ch("pressed") || c.pressed === null) for (const b of $("cmd").querySelectorAll(".big")) b.classList.toggle("press", b.dataset.k === n.pressed);
      if (ch("panel")) $("left").classList.toggle("pm", n.panel === "pm");
      if (ch("tree")) $("tree").innerHTML = n.tree.map((it) => `<div class="tr${it.sel ? " sel" : ""}${it.root ? " root" : ""}" style="padding-left:${10 + (it.ind || 0) * 14}px"><span class="ex">${it.ex || ""}</span><i>${IC[it.icon] || ""}</i>${it.edit ? `<span class="edit">${it.label}<span class="caret"></span></span>` : `<span>${it.label}</span>`}</div>`).join("");
      if (ch("pm") || ch("pmDepth")) {
        if (n.pm) {
          $("pmname").textContent = n.pm; $("pmicon").innerHTML = { "Boss-Extrude": IC.extrude, Revolve: IC.revolve, "Linear Pattern": IC.pattern, "Smart Dimension": IC.smartdim, "Sketch Text": IC.sketch }[n.pm] || IC.extrude;
          $("pmbody").innerHTML = (PM[n.pm] || (() => ""))({ depth: n.pmDepth, ...(n.pmExtra || {}) });
        }
      }
      if (ch("flyout")) { $("flyout").classList.toggle("on", !!n.flyout); $("flytext").innerHTML = n.flyout; }
      if (ch("hint")) $("shint").textContent = n.hint;
      if (ch("statr")) $("statr").innerHTML = n.statr;
      if (ch("confirm")) $("confirm").innerHTML = n.confirm === "none" ? "" : (n.confirm === "sketch"
        ? `<svg width="30" height="22" viewBox="0 0 30 22"><rect x="2" y="7" width="13" height="13" fill="#E6EDF7" stroke="#8AA6CF"/><path d="M11 9 L22 3" stroke="#86C46B" stroke-width="2.5"/><path d="M17 2 H23 V8" stroke="#86C46B" stroke-width="2.5" fill="none"/></svg><svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 3 L15 15 M15 3 L3 15" stroke="#E98A8C" stroke-width="3"/></svg>`
        : `<svg width="22" height="20" viewBox="0 0 22 20"><path d="M3 11 L9 17 L20 3" stroke="#86C46B" stroke-width="3.2" fill="none"/></svg><svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 3 L15 15 M15 3 L3 15" stroke="#E98A8C" stroke-width="3"/></svg>`);
      if (ch("btab")) for (const s of $("btabs").children) s.classList.toggle("on", s.dataset.k === n.btab);
      if (ch("viewname")) $("viewname").textContent = n.viewname;
      if (ch("motion")) {
        $("motion").classList.toggle("on", !!n.motion);
        if (n.motion) {
          $("mph").style.left = (190 + n.motion.p * 860) + "px";
          $("mkeys").innerHTML = n.motion.keys.map(([row, a, b, col]) => `<div style="left:${190 + a * 860}px;width:${(b - a) * 860}px;top:${38 + row * 20}px;background:${col}"></div>`).join("");
        }
      }
      // stage-level overlays
      if (ch("modify")) {
        const m = $("modify");
        if (!n.modify) m.style.display = "none";
        else {
          m.style.display = "block"; m.style.left = n.modify.x + "px"; m.style.top = n.modify.y + "px";
          m.innerHTML = `<div class="t">Modify</div><div class="icons"><i>${`<svg viewBox="0 0 18 18"><path d="M3 9 L7 13 L15 4" stroke="#44991D" stroke-width="2.4" fill="none"/></svg>`}</i><i><svg viewBox="0 0 18 18"><path d="M4 4 L14 14 M14 4 L4 14" stroke="#DF2603" stroke-width="2.2"/></svg></i><i>${QA.rebuild}</i><i><svg viewBox="0 0 18 18"><path d="M4 12 L9 5 L14 12" stroke="#555" fill="none" stroke-width="1.6"/></svg></i><i><svg viewBox="0 0 18 18"><path d="M4 14 L8 4 L12 10 L15 6" stroke="#555" fill="none" stroke-width="1.4"/></svg></i><i><svg viewBox="0 0 18 18"><text x="2" y="14" font-size="12" fill="#555">±</text></svg></i></div><div class="val">${n.modify.value}</div><div class="wheel"></div><div class="nm">${n.modify.name}</div><div style="height:8px"></div>`;
        }
      }
      if (ch("dialog")) {
        const d = $("dialog");
        if (!n.dialog) d.style.display = "none";
        else { d.style.display = "block"; d.innerHTML = `<div class="t">${QA.rebuild.replace("<svg", '<svg width="18" height="18"')}<span>SOLIDWORKS</span><span style="margin-left:auto">✕</span></div><div class="b">${n.dialog.text}</div><div class="btns">${n.dialog.buttons.map((b, i) => `<span class="${i === 0 ? "def" : ""}">${b}</span>`).join("")}</div>`; }
      }
      if (ch("cursor")) {
        const el = $("cursor");
        if (!n.cursor) el.style.display = "none";
        else {
          el.style.display = "block"; el.style.transform = `translate(${n.cursor.x}px, ${n.cursor.y}px)`;
          if (n.cursor.kind !== c.cursor?.kind) el.innerHTML = CURSORS[n.cursor.kind || "arrow"];
        }
      }
      if (ch("explode")) explodeChrome(parts, n.explode);
      if (ch("swHidden")) $("chrome").style.visibility = n.swHidden ? "hidden" : "visible";
      if (ch("stamp")) { const s = $("stamp"); if (!n.stamp) s.style.display = "none"; else { s.style.display = "block"; Object.assign(s.style, n.stamp.style || {}); s.textContent = n.stamp.text; } }
      cur = { ...n };
    },
  };
  return ui;
}

const CURSORS = {
  arrow: `<svg width="26" height="36" viewBox="0 0 16 22"><path d="M1 1 L1 16 L5 12 L8 19 L10.5 18 L7.6 11.4 L13 11.4Z" fill="#fff" stroke="#000" stroke-width="1"/></svg>`,
  pencil: `<svg width="40" height="40" viewBox="0 0 24 24"><path d="M2 22 L4 16 L16 4 L20 8 L8 20Z" fill="#fff" stroke="#000" stroke-width="1"/><path d="M2 22 L4 16 L8 20Z" fill="#000"/><circle cx="18" cy="18" r="3.5" fill="none" stroke="#1C18B7" stroke-width="1.2"/></svg>`,
  dim: `<svg width="40" height="40" viewBox="0 0 24 24"><path d="M1 1 L1 16 L5 12 L8 19 L10.5 18 L7.6 11.4 L13 11.4Z" fill="#fff" stroke="#000" stroke-width="1"/><path d="M13 19 H23 M13 17 V21 M23 17 V21" stroke="#000"/></svg>`,
  hand: `<svg width="34" height="34" viewBox="0 0 24 24"><path d="M9 21 C6 18 4 15 5 13 C6 12 7 13 8 14 V4 C8 2.5 10 2.5 10 4 V11 V3 C10 1.5 12 1.5 12 3 V11 V4 C12 2.5 14 2.5 14 4 V11 V6 C14 4.5 16 4.5 16 6 V15 C16 18 14 21 12 21Z" fill="#fff" stroke="#000" stroke-width="1"/></svg>`,
  rotate: `<svg width="34" height="34" viewBox="0 0 24 24"><path d="M5 12 a7 7 0 1 1 3 6" fill="none" stroke="#000" stroke-width="2.4"/><path d="M5 12 a7 7 0 1 1 3 6" fill="none" stroke="#fff" stroke-width="1"/><path d="M2 9 L5 14 L8 9Z" fill="#000"/></svg>`,
};

// exploded view of the program itself: each panel slides out along its own explode direction,
// with a little depth. p in 0..1. Hard start, constant speed, like a real explode step.
const EXPLODE = { title: [0, -1, 0], cmd: [0, -1, 1], tabs: [0, -1, 0.5], left: [-1, 0, 0.6], vpui: [0, 0, -0.3], tp: [1, 0, 0.6], btabs: [0, 1, 0.5], status: [0, 1, 0], motion: [0, 1, 0] };
function explodeChrome(parts, p) {
  for (const el of parts) {
    const d = EXPLODE[el.id] || [0, 0, 0];
    if (p <= 0) { el.style.transform = ""; el.style.opacity = ""; continue; }
    const k = p * 900;
    el.style.transform = `translate3d(${d[0] * k}px, ${d[1] * k * 0.7}px, ${d[2] * k * 0.8}px) rotateX(${d[1] * p * 18}deg) rotateY(${-d[0] * p * 22}deg)`;
  }
}
