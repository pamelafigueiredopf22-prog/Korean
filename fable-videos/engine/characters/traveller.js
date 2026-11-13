// The traveller: a kindly old badger on a long walk, in a red wool coat, a knitted scarf, a felt hat
// with a feather, tweed trousers, a knapsack with a blanket roll and a tin cup, and a knobbly staff.
// Three-quarter view facing right, feet at y = 0, about 300 tall to the hat.
// Poses: walk, huddle into the wind, hold his hat, wipe his brow, unbutton, coat off / carry the coat,
// sit against a tree, asleep. Plus the coat folded on the grass.
import { wash, pool, ellipse, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, rgba, shade, tint, lerp, clamp,
  penLine, looseWash, soften, path, blooms, hatch, ink, fluffy } from '../watercolor.js';
import { makeFurPart, buttonEye, PAPER, INK } from './kit.js';

const COAT = '#b4473a', COAT_D = '#7e2e28', SCARF = '#d9a441', SCARF2 = '#7f9254', TWEED = '#8a7660', SHIRT = '#f2e8d6', VEST = '#5f7a52',
  HAT = '#6e6248', BAND = '#a8643a', LEATHER = '#8e5e36', BLANKET = '#c8b48c', FUR_GREY = '#8f8a84', FUR_DARK = '#2e2a28', FUR_WHITE = '#f2ece2';

// a piece of clothing: paper base, loose wash, blooms, form shading, woven texture, pen line
function cloth(res, shape, col, sd, o = {}) {
  return sprite(bbox(shape.concat(o.extra || [])), res, (g) => {
    wash(g, shape, { color: PAPER, opacity: 1, under: PAPER, seed: sd, edge: 0 });
    looseWash(g, shape, col, { opacity: o.op ?? 0.92, seed: sd + 1, shift: 2, reserves: o.reserves ?? 1 });
    blooms(g, shape, [tint(col, 0.15), shade(col, 0.15), o.bloom || tint(col, 0.3)], { n: 5, seed: sd + 2, alpha: 0.28 });
    if (o.paint) o.paint(g);
    shadeEdge(g, shape, { color: shade(col, 0.6), alpha: 0.4, width: o.shadeW || 16, dx: o.sdx ?? -6, dy: o.sdy ?? -3 });
    if (o.hi) glaze(g, shape, ...o.hi, '#fff6e6', 0.35);
    soften(g, 0.9 * res);
    if (o.weave !== 0) hatch(g, shape, { color: shade(col, 0.5), count: o.weave ?? 120, len: 6, width: 0.8, alpha: 0.3, seed: sd + 3, dir: o.dir || (() => Math.PI / 2), curve: 0.2 });
    if (o.after) o.after(g);
    penLine(g, shape, { closed: true, color: INK, w: 2, alpha: 0.85, seed: sd + 5, weight: (t) => 0.35 + 0.8 * Math.max(0, Math.sin(t * Math.PI * 2 + (o.phase || 0.6))) });
  }, { seed: sd + 6, grain: 0.14 });
}
// a live-drawn limb (sleeve, leg): flat wash colour, a shaded underside, a pen outline
function limb(g, pts, w0, w1, col, o = {}) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = lerp(w0, w1, i / (pts.length - 1)) / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  const sh = smooth(L.concat(R.reverse()));
  g.save(); g.lineJoin = 'round';
  g.fillStyle = col; path(g, sh); g.fill();
  g.save(); path(g, sh); g.clip();
  g.strokeStyle = rgba(shade(col, 0.5), 0.4); g.lineWidth = w0 * 0.55; g.beginPath(); smooth(L, false).forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
  g.strokeStyle = rgba(tint(col, 0.35), 0.35); g.lineWidth = w0 * 0.2; g.beginPath(); smooth(R, false).forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
  if (o.cuff) { const c = pts[pts.length - 1], p = pts[pts.length - 2], a = Math.atan2(c[1] - p[1], c[0] - p[0]); g.strokeStyle = rgba(shade(col, 0.35), 0.9); g.lineWidth = 2; g.beginPath(); g.moveTo(c[0] - Math.cos(a) * 9 - Math.sin(a) * w1 * 0.6, c[1] - Math.sin(a) * 9 + Math.cos(a) * w1 * 0.6); g.lineTo(c[0] - Math.cos(a) * 9 + Math.sin(a) * w1 * 0.6, c[1] - Math.sin(a) * 9 - Math.cos(a) * w1 * 0.6); g.stroke(); }
  g.restore();
  g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 1.8; path(g, sh); g.stroke(); g.restore();
}
const joint = (r, a1, l1, a2, l2) => { const k = [r[0] + Math.cos(a1) * l1, r[1] + Math.sin(a1) * l1]; return [r, k, [k[0] + Math.cos(a2) * l2, k[1] + Math.sin(a2) * l2]]; };
// a badger's dark paw, with little pale claws
function paw(g, x, y, a = 0, r = 10) {
  g.save(); g.translate(x, y); g.rotate(a);
  g.fillStyle = FUR_DARK; g.beginPath(); g.ellipse(0, 0, r, r * 0.85, 0, 0, 7); g.fill();
  g.strokeStyle = rgba(INK, 0.9); g.lineWidth = 1.4; g.stroke();
  g.strokeStyle = 'rgba(240,230,210,0.85)'; g.lineWidth = 1.3; g.lineCap = 'round';
  for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(r * 0.75, k * r * 0.4); g.lineTo(r * 1.15, k * r * 0.45 + 1); g.stroke(); }
  g.restore();
}
// one-piece mouth under the muzzle: a smile line from the corner to the front, or an open mouth
function mouth(g, x0, y0, x1, y1, m, sm) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push([lerp(x0, x1, u), lerp(y0, y1, u) - (1 - u) * sm * 5 + Math.sin(u * Math.PI) * 2]); }
  if (m > 0.04) {
    const d = 3 + 10 * m, outline = () => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.quadraticCurveTo(lerp(x0, x1, 0.55), y1 + d * 1.8, pts[0][0], pts[0][1]); g.closePath(); };
    outline(); g.fillStyle = '#5c2622'; g.fill(); g.save(); g.clip(); g.fillStyle = '#d8857c'; g.beginPath(); g.ellipse(lerp(x0, x1, 0.5), y1 + d * 1.1, (x1 - x0) * 0.32, d * 0.45, 0, 0, 7); g.fill(); g.restore();
    outline(); g.strokeStyle = rgba(INK, 0.85); g.lineWidth = 1.7; g.stroke();
  } else { g.strokeStyle = rgba(INK, 0.85); g.lineWidth = 1.8; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.stroke(); }
  g.restore();
}

// ---- shapes (feet at 0, facing right)
const HEAD = smooth([[-40, -222], [-32, -248], [-10, -262], [18, -258], [38, -240], [56, -224], [66, -212], [62, -200], [48, -192], [24, -184], [-4, -182], [-30, -190]]);
const STRIPE = smooth([[58, -218], [40, -231], [18, -244], [-6, -254], [-24, -248], [-26, -232], [-4, -230], [18, -221], [40, -212], [56, -209]]);
const CHEEK = smooth([[-38, -222], [-26, -232], [-6, -228], [8, -214], [20, -200], [0, -184], [-26, -190]]);
const EAR = ellipse(-22, -240, 12, 11, 18);
const NOSE = ellipse(64, -211, 8.5, 7, 16);
const COAT_SH = smooth([[-32, -186], [-4, -194], [30, -186], [42, -150], [48, -104], [56, -60], [62, -34], [26, -28], [-14, -26], [-50, -32], [-46, -80], [-42, -130], [-40, -166]]);
const COLLAR = smooth([[-30, -192], [-6, -204], [26, -200], [40, -186], [30, -170], [10, -178], [-14, -176], [-28, -172]]);
const BODY_SH = smooth([[-30, -184], [-4, -190], [28, -184], [36, -148], [38, -112], [-34, -110], [-36, -150]]); // shirt and waistcoat
const VEST_SH = smooth([[-32, -180], [-8, -178], [8, -150], [36, -136], [38, -110], [-34, -108], [-36, -148]]);
const SEAT = smooth([[-36, -116], [38, -118], [42, -72], [30, -50], [-30, -48], [-44, -70]]); // trousers top (coat off)
const HAT_SH = smooth([[-30, -250], [-26, -284], [-6, -298], [22, -296], [40, -282], [44, -252]]);
const BRIM = smooth([[-54, -248], [-30, -256], [10, -258], [48, -254], [72, -248], [70, -240], [40, -244], [6, -246], [-30, -244], [-54, -240]]);
const FOOT = smooth([[-12, -14], [10, -16], [24, -10], [30, -2], [24, 2], [-12, 2]]);
const PACK = smooth([[-80, -176], [-40, -180], [-34, -110], [-40, -96], [-80, -100], [-86, -140]]);
const ROLL = smooth([[-92, -194], [-36, -198], [-32, -184], [-36, -172], [-92, -168], [-96, -182]]);
const SCARF_KNOT = smooth([[-26, -196], [4, -204], [34, -196], [38, -184], [16, -178], [-10, -178], [-28, -184]]);
const FOLD = smooth([[-70, -6], [-64, -34], [-24, -46], [34, -44], [70, -30], [74, -4], [34, 6], [-34, 6]]);

export function makeTraveller(res = 1, seed = 81) {
  const s = (n) => seed * 100 + n;
  const pal = { fur: FUR_WHITE, blooms: ['#e8e2d8', '#d8d4cc'], shadow: '#6a6460', hatch: '#5a544e' };
  const fur = makeFurPart(res, seed, pal);
  const head = fur(HEAD, { sd: 1, op: 0.75, hatch: 60, fur: 50, furLen: 6, extra: NOSE, dir: () => Math.PI, paint: (g) => {
    // grey cheek and back of the head, the black stripe through the eye, a pink-ish muzzle
    wash(g, CHEEK, { color: FUR_GREY, opacity: 0.9, seed: s(2), bleed: 0.03 });
    hatch(g, CHEEK, { color: '#4a4440', count: 70, len: 7, width: 0.9, alpha: 0.5, seed: s(3), dir: () => Math.PI * 0.9 });
    wash(g, STRIPE, { color: FUR_DARK, opacity: 0.95, seed: s(4), bleed: 0.02, edge: 0.2 });
    hatch(g, STRIPE, { color: '#6a6460', count: 60, len: 6, width: 0.8, alpha: 0.5, seed: s(5), dir: () => Math.PI * 1.05 });
    pool(g, 30, -200, 14, 9, '#e8a49a', 0.45); // a rosy cheek
  }, after: (g) => {
    wash(g, NOSE, { color: '#2a2422', opacity: 1, seed: s(6), under: true }); glaze(g, NOSE, 62, -214, 3, 2, '#ffffff', 0.7); penLine(g, NOSE, { closed: true, w: 1.3, alpha: 0.8 });
  } });
  const ear = sprite(bbox(EAR), res, (g) => { wash(g, EAR, { color: FUR_DARK, opacity: 0.97, under: PAPER, seed: s(7) }); penLine(g, EAR.slice(0, 13), { color: FUR_WHITE, w: 3, alpha: 0.9 }); penLine(g, EAR, { closed: true, w: 1.5, alpha: 0.8 }); }, { granulate: false });
  const coat = cloth(res, COAT_SH, COAT, s(10), { hi: [10, -150, 14, 34], weave: 200, after: (g) => {
    penLine(g, [[12, -190], [18, -120], [26, -30]], { w: 1.5, alpha: 0.7 });                                   // front edge
    penLine(g, [[-24, -150], [-30, -80], [-34, -30]], { w: 1.1, alpha: 0.4 });                                  // a seam
    for (const [x, y] of [[-26, -78], [42, -76]]) { const f = smooth([[x - 12, y], [x + 12, y - 1], [x + 11, y + 8], [x - 11, y + 9]]); wash(g, f, { color: COAT_D, opacity: 0.5, seed: s(11) + x }); penLine(g, f, { closed: true, w: 1.1, alpha: 0.6 }); } // pocket flaps
    for (const y of [-168, -142, -116, -90]) { const bx = 22 + (y + 168) * 0.03; g.fillStyle = '#c89a4a'; g.beginPath(); g.arc(bx, y, 4.2, 0, 7); g.fill(); g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1; g.stroke(); g.fillStyle = 'rgba(255,240,200,0.8)'; g.beginPath(); g.arc(bx - 1.3, y - 1.3, 1.3, 0, 7); g.fill(); }
    for (let k = 0; k < 5; k++) penLine(g, [[-44 + k * 22, -36], [-40 + k * 22, -56]], { w: 0.8, alpha: 0.3 }); // folds at the hem
  } });
  const collar = cloth(res, COLLAR, shade(COAT, 0.08), s(15), { weave: 30, shadeW: 6, sdy: 4 });
  const body = cloth(res, BODY_SH, SHIRT, s(20), { weave: 40, paint: (g) => {
    wash(g, VEST_SH, { color: VEST, opacity: 0.95, seed: s(21), under: true }); hatch(g, VEST_SH, { color: shade(VEST, 0.5), count: 60, len: 5, width: 0.8, alpha: 0.35, seed: s(22) });
    penLine(g, VEST_SH, { closed: true, w: 1.4, alpha: 0.7 });
    for (const y of [-150, -132, -116]) { g.fillStyle = '#c89a4a'; g.beginPath(); g.arc(-2 + (y + 150) * 0.15, y, 3, 0, 7); g.fill(); }
  } });
  const seat = cloth(res, SEAT, TWEED, s(25), { weave: 0, paint: (g) => { // tweed check
    g.save(); path(g, SEAT); g.clip(); g.strokeStyle = rgba(shade(TWEED, 0.5), 0.35); g.lineWidth = 1.2;
    for (let x = -50; x < 50; x += 9) { g.beginPath(); g.moveTo(x, -120); g.lineTo(x + 4, -40); g.stroke(); }
    for (let y = -116; y < -40; y += 9) { g.beginPath(); g.moveTo(-50, y); g.lineTo(50, y + 2); g.stroke(); } g.restore(); } });
  const hat = cloth(res, HAT_SH, HAT, s(30), { hi: [10, -284, 12, 6], weave: 40, paint: (g) => {
    g.save(); path(g, HAT_SH); g.clip(); g.fillStyle = rgba(BAND, 0.95); g.beginPath(); g.moveTo(-34, -268); g.quadraticCurveTo(8, -272, 48, -266); g.lineTo(48, -252); g.quadraticCurveTo(8, -256, -34, -252); g.closePath(); g.fill(); g.restore();
    penLine(g, [[-28, -268], [8, -271], [44, -266]], { w: 1, alpha: 0.6 });
  }, after: (g) => { // a pheasant feather tucked in the band
    const f = smooth([[-22, -262], [-44, -280], [-66, -292], [-60, -284], [-42, -272], [-20, -266]]);
    wash(g, f, { color: '#b8884a', opacity: 0.95, seed: s(31), under: true });
    for (let k = 0; k < 6; k++) penLine(g, [[-26 - k * 6.5, -265 - k * 4], [-30 - k * 6.5, -273 - k * 4]], { w: 0.9, alpha: 0.6 });
    penLine(g, f, { closed: true, w: 1.2, alpha: 0.7 });
  } });
  const brim = cloth(res, BRIM, shade(HAT, 0.1), s(35), { weave: 20, shadeW: 6, sdy: 3 });
  const foot = cloth(res, FOOT, FUR_DARK, s(40), { weave: 0, shadeW: 4, after: (g) => { g.strokeStyle = 'rgba(240,230,210,0.85)'; g.lineWidth = 1.3; g.lineCap = 'round'; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(24 + k * 1.5, -6 + k * 3); g.lineTo(31 + k * 1.5, -5 + k * 3); g.stroke(); } } });
  const pack = cloth(res, PACK, LEATHER, s(45), { weave: 40, after: (g) => {
    const flap = smooth([[-82, -176], [-38, -180], [-38, -146], [-60, -140], [-82, -146]]); wash(g, flap, { color: shade(LEATHER, 0.15), opacity: 0.8, seed: s(46) }); penLine(g, flap, { closed: true, w: 1.3, alpha: 0.7 });
    g.fillStyle = '#c89a4a'; g.fillRect(-63, -150, 6, 8); g.strokeStyle = rgba(INK, 0.6); g.strokeRect(-63, -150, 6, 8);
    // a little tin cup hanging from the side
    const cup = smooth([[-92, -124], [-80, -124], [-81, -108], [-91, -108]]); wash(g, cup, { color: '#a8aab0', opacity: 0.95, seed: s(47), under: true }); penLine(g, cup, { closed: true, w: 1.1, alpha: 0.7 });
  } });
  const roll = cloth(res, ROLL, BLANKET, s(48), { weave: 0, paint: (g) => { g.save(); path(g, ROLL); g.clip(); g.strokeStyle = rgba('#a8443a', 0.6); g.lineWidth = 3; for (let x = -90; x < -30; x += 14) { g.beginPath(); g.moveTo(x, -200); g.lineTo(x + 2, -166); g.stroke(); } g.restore(); }, after: (g) => { penLine(g, [[-46, -198], [-44, -170]], { w: 1.2, alpha: 0.6 }); g.fillStyle = LEATHER; g.fillRect(-72, -199, 5, 32); g.fillRect(-52, -199, 5, 32); } });
  const knot = cloth(res, SCARF_KNOT, SCARF, s(50), { weave: 0, shadeW: 8, sdy: 4, paint: (g) => { g.save(); path(g, SCARF_KNOT); g.clip(); g.strokeStyle = rgba(SCARF2, 0.85); g.lineWidth = 5; for (let x = -30; x < 40; x += 16) { g.beginPath(); g.moveTo(x, -206); g.lineTo(x + 4, -176); g.stroke(); } g.strokeStyle = rgba(shade(SCARF, 0.4), 0.4); g.lineWidth = 0.8; for (let x = -30; x < 40; x += 4) { g.beginPath(); g.moveTo(x, -206); g.lineTo(x + 3, -176); g.stroke(); } g.restore(); } });
  const folded = cloth(res, FOLD, COAT, s(60), { weave: 120, shadeW: 10, sdy: 5, hi: [0, -34, 34, 7], after: (g) => {
    const sleeve = smooth([[-46, -40], [10, -36], [50, -22], [46, -10], [6, -22], [-44, -26]]);
    wash(g, sleeve, { color: shade(COAT, 0.1), opacity: 0.95, seed: s(61), under: true }); penLine(g, sleeve, { closed: true, w: 1.4, alpha: 0.75 });
    const col = smooth([[-70, -6], [-64, -34], [-50, -36], [-54, -6]]); wash(g, col, { color: COAT_D, opacity: 0.7, seed: s(62) }); penLine(g, col, { closed: true, w: 1.2, alpha: 0.6 });
    for (const x of [-22, 6, 34]) { g.fillStyle = '#c89a4a'; g.beginPath(); g.arc(x, -3, 3.8, 0, 7); g.fill(); g.strokeStyle = rgba(INK, 0.6); g.lineWidth = 0.9; g.stroke(); }
  } });

  // the long end of the scarf (live: it flaps in the wind). From the knot, falling down his front or streaming back.
  function scarfTail(g, t, wind, sit = false) {
    const pts = [];
    for (let k = 0; k <= 10; k++) {
      const u = k / 10, back = clamp(wind * 1.2);
      const hx = lerp(26 + u * 6, 10 - u * (70 + 70 * wind), back), hy = lerp(-186 + u * 70, -190 + u * (10 - 30 * wind), back);
      pts.push([hx, hy + Math.sin(u * 7 - t * (5 + 14 * wind)) * (1 + 14 * wind) * u]);
    }
    limb(g, pts, 18, 15, SCARF);
    // stripes and fringe
    g.save(); g.strokeStyle = rgba(SCARF2, 0.9); g.lineWidth = 4;
    for (const k of [3, 6, 9]) { const a = pts[k - 1], b = pts[k + 1] || pts[k]; const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; g.beginPath(); g.moveTo(pts[k][0] + dy / d * 8, pts[k][1] - dx / d * 8); g.lineTo(pts[k][0] - dy / d * 8, pts[k][1] + dx / d * 8); g.stroke(); }
    const e = pts[10], p = pts[9], a = Math.atan2(e[1] - p[1], e[0] - p[0]);
    g.strokeStyle = rgba(shade(SCARF, 0.25), 0.9); g.lineWidth = 1.6; g.lineCap = 'round';
    for (let k = -3; k <= 3; k++) { const ox = -Math.sin(a) * k * 2.6, oy = Math.cos(a) * k * 2.6; g.beginPath(); g.moveTo(e[0] + ox, e[1] + oy); g.lineTo(e[0] + ox + Math.cos(a + k * 0.05) * 10, e[1] + oy + Math.sin(a + k * 0.05) * 10); g.stroke(); }
    g.restore();
  }
  function face(g, st, hud, x = 0, y = 0) {
    const eo = hud > 0.6 ? 0.25 : st.eyes ?? 1;
    // the eye sits in the dark stripe, so it gets a pale ring
    g.save(); g.fillStyle = 'rgba(232,224,212,0.95)'; g.beginPath(); g.ellipse(x + 22, y - 230, 10, 9.5, 0, 0, 7); g.fill(); g.restore();
    buttonEye(g, x + 22, y - 230, eo, { R: 7, happy: st.happy, sly: hud * 0.5 + (st.sleepy || 0) * 0.6 });
    g.strokeStyle = rgba('#d8d0c4', 0.9); g.lineWidth = 2.6; g.lineCap = 'round'; const bu = (st.browUp || 0) * 4 - hud * 3;
    g.beginPath(); g.moveTo(x + 13, y - 245 - bu); g.quadraticCurveTo(x + 22, y - 250 - bu, x + 31, y - 245 - bu + hud * 2); g.stroke();
    mouth(g, x + 36, y - 195, x + 58, y - 202, st.mouth || 0, hud > 0.6 ? -0.5 : st.smile ?? 0.6);
  }
  function headGroup(g, st, hud, tilt) {
    g.save(); g.translate(8, -188); g.rotate(tilt); g.translate(-8, 188);
    drawSprite(g, ear);
    drawSprite(g, head);
    face(g, st, hud);
    if (!st.hatOff) {
      const lift = st.hatLift || 0;
      g.save(); g.translate(lift * 24, -lift * 62); g.rotate(-lift * 0.55 + (st.hatTip || 0)); drawSprite(g, hat); drawSprite(g, brim); g.restore();
    }
    g.restore();
  }
  function staff(g, hand, bob) {
    g.save(); g.lineCap = 'round';
    const top = [hand[0] + 4, hand[1] - 40], bot = [hand[0] + 18, bob];
    g.strokeStyle = '#7a5a3a'; g.lineWidth = 7; g.beginPath(); g.moveTo(...top); g.quadraticCurveTo(hand[0] + 6, hand[1] + 40, ...bot); g.stroke();
    g.strokeStyle = rgba('#4a3420', 0.8); g.lineWidth = 1.3; g.beginPath(); g.moveTo(top[0] + 3, top[1]); g.quadraticCurveTo(hand[0] + 9, hand[1] + 40, bot[0] + 3, bot[1]); g.stroke();
    for (const k of [0.3, 0.65]) { const x = lerp(top[0], bot[0], k), y = lerp(top[1], bot[1], k); g.fillStyle = '#6a4a2e'; g.beginPath(); g.ellipse(x + 1, y, 5, 3, 0.4, 0, 7); g.fill(); }
    g.fillStyle = '#8a6a44'; g.beginPath(); g.arc(top[0], top[1] - 2, 7, 0, 7); g.fill(); g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1.2; g.stroke();
    g.restore();
  }

  // st: walk (phase 0..1), huddle 0..1 (leaning into the wind, eyes screwed up), wind 0..1 (blowing from the right),
  //     hatHold, hatLift, wipe, unbutton, coatOff, carryCoat, mouth, smile, eyes, happy, browUp, headTilt, breath, t
  function draw(g, st = {}) {
    const t = st.t || 0, p = (st.walk ?? 0) * Math.PI * 2, moving = st.walk != null, hud = st.huddle || 0, wind = st.wind || 0;
    const bob = moving ? Math.abs(Math.sin(p)) * 3.5 : (st.breath || 0) * 1.2;
    g.save();
    pool(g, 0, 2, 70, 9, '#2a1e12', 0.25);
    const legs = (far) => {
      const o = far ? Math.PI : 0, sw = moving ? Math.sin(p + o) * 0.42 * (1 - hud * 0.4) : 0;
      const hip = [far ? -12 : 6, -50 - bob];
      const ft = [hip[0] + Math.sin(sw) * 40, -12 - (moving ? Math.max(0, Math.cos(p + o)) * 7 : 0)];
      limb(g, [hip, [(hip[0] + ft[0]) / 2 + 2, (hip[1] + ft[1]) / 2], ft], 26, 22, far ? shade(TWEED, 0.2) : TWEED);
      g.save(); g.translate(ft[0], ft[1] + 12); if (far) g.globalAlpha = 0.95; drawSprite(g, foot); g.restore();
    };
    legs(true);
    if (st.coatOff) legs(false);
    g.save(); g.translate(0, -bob); g.translate(0, -40); g.rotate(hud * 0.16); g.translate(0, 40);
    // far arm
    const shF = [-12, -170];
    let armF;
    if (st.hatHold) armF = joint(shF, -2.05, 42, -2.0, 36);
    else if (hud > 0.5) armF = joint(shF, 0.9, 32, -0.2, 28);
    else if (st.carryCoat) armF = joint(shF, 1.3, 32, 0.7, 28);
    else if (st.unbutton) armF = joint(shF, 1.0, 32, -0.4, 28);
    else if (moving) armF = joint(shF, 1.57 + Math.sin(p + Math.PI) * 0.4, 32, 1.35, 28);
    else armF = joint(shF, 1.5, 32, 1.3, 28);
    const sleeveF = st.coatOff ? SHIRT : shade(COAT, 0.2);
    if (!st.hatHold) { limb(g, armF, 22, 18, sleeveF, { cuff: true }); paw(g, ...armF[2], 0.4, 9); }
    if (!st.coatOff) { drawSprite(g, roll); drawSprite(g, pack); }
    if (!st.coatOff) {
      g.save(); // the coat hem swings back in the wind
      const flap = wind * (0.06 + 0.06 * Math.sin(t * 9)) + (moving ? Math.sin(p * 2) * 0.012 : 0);
      g.translate(0, -150); g.transform(1, 0, flap * 1.4, 1, 0, 0); g.translate(0, 150);
      drawSprite(g, coat); g.restore();
      drawSprite(g, collar);
    } else { drawSprite(g, seat); drawSprite(g, body); }
    drawSprite(g, knot);
    if (wind < 0.3) scarfTail(g, t, wind);
    if (st.hatHold) limb(g, armF, 20, 17, sleeveF, { cuff: true });
    headGroup(g, st, hud, (st.headTilt || 0) + hud * 0.14);
    if (wind >= 0.3) scarfTail(g, t, wind);
    if (st.hatHold) paw(g, ...armF[2], -2.2, 9);
    // near arm
    const shN = [14, -168];
    let armN;
    if (hud > 0.5 || st.hatHold) armN = joint(shN, 1.0, 30, -2.5, 28);                 // clutching his coat shut
    else if (st.wipe > 0.5) armN = joint(shN, -0.45, 34, -2.6 + Math.sin(t * 6) * 0.2, 30);
    else if (st.unbutton) armN = joint(shN, 1.1, 30, -0.9 + Math.sin(t * 5) * 0.15, 26);
    else if (st.carryCoat) armN = joint(shN, 1.15, 32, -0.25, 30);
    else if (moving) armN = joint(shN, 1.25 + Math.sin(p) * 0.35, 32, 0.75, 28);
    else armN = joint(shN, 1.3, 32, 0.9, 28);
    limb(g, armN, 23, 19, st.coatOff ? SHIRT : COAT, { cuff: true });
    const hand = armN[2];
    if (st.carryCoat) { g.save(); g.translate(hand[0] - 4, hand[1] + 6); g.rotate(0.1); g.scale(0.62, 0.62); g.translate(0, 30); drawSprite(g, folded); g.restore(); }
    if (!st.noStick && !st.hatHold && hud < 0.5 && !(st.wipe > 0.5) && !st.carryCoat && !st.unbutton) staff(g, hand, bob);
    paw(g, ...hand, 0.3, 10);
    g.restore();
    if (!st.coatOff) legs(false);
    g.restore();
  }
  // sitting on the grass with his back against a tree (behind him, to the left), legs stretched out; sleep 0..1
  function drawSit(g, st = {}) {
    const t = st.t || 0, sl = st.sleep || 0, br = (st.breath || 0) * 1.6, lean = -0.1 - sl * 0.04; // leaning back against the trunk
    g.save();
    pool(g, 40, 2, 120, 12, '#2a1e12', 0.25);
    const upper = (fn) => { g.save(); g.translate(-20, -4); g.rotate(lean); g.translate(20, 4); g.translate(0, 46 - br); fn(); g.restore(); };
    upper(() => {
      const armF = joint([-12, -170], 1.75, 30, 0.35, 24); limb(g, armF, 22, 18, SHIRT, { cuff: true }); paw(g, ...armF[2], 0.4, 9);
      drawSprite(g, seat); drawSprite(g, body);
    });
    for (const far of [true, false]) { // legs stretched out along the grass
      const hip = [far ? -10 : 2, -24], y1 = far ? -16 : -12;
      limb(g, [hip, [hip[0] + 46, y1 - 2], [hip[0] + 88, y1]], 28, 22, far ? shade(TWEED, 0.2) : TWEED);
      g.save(); g.translate(hip[0] + 92, y1 + 12); g.rotate(-0.7); drawSprite(g, foot); g.restore();
    }
    upper(() => {
      drawSprite(g, knot);
      scarfTail(g, t, 0);
      headGroup(g, { ...st, eyes: sl > 0.5 ? 0 : st.eyes, smile: st.smile ?? 0.7, hatTip: sl * 0.18, sleepy: sl }, 0, sl * 0.2 + (st.headTilt || 0));
      // paws folded on his tummy
      const armN = joint([14, -168], 1.8, 30, 0.45 - sl * 0.1, 24); limb(g, armN, 23, 19, SHIRT, { cuff: true }); paw(g, ...armN[2], 0.2, 10);
    });
    g.restore();
  }
  function drawCoatLaid(g) { pool(g, 0, 4, 90, 12, '#2a1e12', 0.22); drawSprite(g, folded); }
  function drawPackLaid(g) { g.save(); g.translate(60, 96); drawSprite(g, roll); drawSprite(g, pack); g.restore(); }
  return { draw, drawSit, drawCoatLaid, drawPackLaid, coat };
}
