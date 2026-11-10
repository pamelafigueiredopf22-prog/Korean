// The Fox and the Crow: scenes, staging and timing.
import { W, H, rng, canvas, wash, pool, strokes, ellipse, smooth, sprite, drawSprite, bbox, noise1, rgba, shade, tint,
  clamp, lerp, ease, span, glaze, shadeEdge, penLine, hatch, looseWash } from '../../engine/watercolor.js';
import { PAL, foliage, trunk, grass, flower, berries, mushroom, fern, hills, cloud, leaf, plant, oak, cottage } from '../../engine/scenery.js';
import { M, MY, LW, LH, INK, layer, cam, drawLayer, fireflies, motes, nightGrade, sunlight, stars, moon, zzz, makeStage } from '../../engine/stage.js';
import { makeFox2 } from '../../engine/characters/fox2.js';
import { makeCrow } from '../../engine/characters/crow.js';

let S, SUNSET, fox, crow, crowBig, MEADOW, OAK, PERCH, DEN, TITLE, NIGHT_SKY, NEST_BACK, NEST_FRONT, LEAF;
const line = (id) => S.line(id);

// ---------------------------------------------------------------- painting helpers
function sky(g, top, mid, bottom) {
  const grd = g.createLinearGradient(0, -MY, 0, 820);
  grd.addColorStop(0, top); grd.addColorStop(0.6, mid); grd.addColorStop(1, bottom);
  g.fillStyle = grd; g.fillRect(-M, -MY, LW, LH);
}
function meadowGround(g, y0, seed, clear = () => false) {
  wash(g, smooth([[-M - 50, y0], [500, y0 - 14], [1100, y0 + 10], [W + M + 50, y0 - 6], [W + M + 50, LH], [-M - 50, LH]]), { color: '#bfb179', opacity: 0.9, seed, bleed: 0.02, layers: 24 });
  wash(g, smooth([[-M - 50, y0 + 140], [700, y0 + 120], [W + M + 50, y0 + 140], [W + M + 50, LH], [-M - 50, LH]]), { color: '#9ea477', opacity: 0.55, seed: seed + 1, bleed: 0.03, layers: 20 });
  const r = rng(seed + 2);
  for (let i = 0; i < 24; i++) { const x = r.range(-60, W + 60), y = r.range(y0 + 20, H + 40), sz = r.range(60, 170); pool(g, x, y, sz, sz * 0.3, r() < 0.5 ? '#5f6b3a' : '#fbe2a0', r.range(0.1, 0.22)); }
  strokes(g, [[-M, y0], [W + M, y0], [W + M, LH], [-M, LH]], { color: '#6f7d4c', count: 1300, len: 9, width: 1.1, alpha: 0.28, seed: seed + 3, dir: () => -Math.PI / 2, curve: 0.4 });
  strokes(g, [[-M, y0], [W + M, y0], [W + M, LH], [-M, LH]], { color: '#e9d79a', count: 450, len: 8, width: 1, alpha: 0.3, seed: seed + 4, dir: () => -Math.PI / 2, curve: 0.4 });
  for (let i = 0; i < 160; i++) { const x = r.range(-80, W + 80), y = r.range(y0 + 10, H + 60); if (clear(x, y)) continue; grass(g, x, y, { seed: seed + 10 + i, h: 16 + (y - y0) * 0.1, n: 6, alpha: 0.55 }); }
  for (let i = 0; i < 55; i++) {
    const x = r.range(-60, W + 60), y = r.range(y0 + 20, H + 40); if (clear(x, y)) continue;
    if (r() < 0.65) flower(g, x, y, { seed: seed + 300 + i, size: 4 + (y - y0) * 0.012, color: r.pick([PAL.pink, '#f1e2c8', '#e7a35a', '#cdb3d6']), stem: 8 + (y - y0) * 0.03 });
    else berries(g, x, y, { seed: seed + 400 + i, size: 3 + (y - y0) * 0.006 });
  }
}
function fgPlants(seed, spots) {
  const r = rng(seed), out = [];
  for (const [i, [x, h, big]] of spots.entries()) {
    const y = H + 40;
    out.push({ x, y, ph: r() * 6, s: sprite({ x0: x - h * 1.3, y0: y - h * 1.35, x1: x + h * 1.3, y1: y + 10, w: h * 2.6, h: h * 1.35 + 10 }, 1, (g) => {
      grass(g, x, y, { seed: seed + i, h: h * 0.7, n: 18, width: 4.5, alpha: 0.8, colors: [PAL.moss, PAL.deep, PAL.olive, '#7d8a52'] });
      if (big) fern(g, x - h * 0.3, y, { seed: seed + 20 + i, len: h * 1.15, angle: -1.25, curl: 0.55, color: PAL.deep, alpha: 0.85, leaf: 1.6 });
      plant(g, x, y, { seed: seed + 40 + i, h, n: big ? 7 : 5, under: true, colors: [PAL.moss, '#7f9a6a', PAL.olive, '#62774a'] });
      if (i % 2) berries(g, x + h * 0.45, y - h * 0.55, { seed: seed + 60 + i, n: 5, size: 7 });
      else flower(g, x - h * 0.4, y - h * 0.7, { seed: seed + 80 + i, size: 11, color: i % 3 ? '#f0e0c4' : PAL.pink, stem: h * 0.7 });
    }) });
  }
  return out;
}
function drawFg(g, c, list, t) {
  for (const p of list) { cam(g, c, 1.2); g.translate(p.x, p.y); g.rotate(Math.sin(t * 0.6 + p.ph) * 0.02); g.translate(-p.x, -p.y); drawSprite(g, p.s); }
}
// a big oak: trunk at x, a branch reaching left to bx at height by
function oakTree(g, x, ground, bx, by, seed, w = 150) {
  trunk(g, [[x, ground], [x - 14, ground - 300], [x + 6, ground - 600], [x - 10, -80]], w, w * 0.72, { seed, under: true });
  for (const [pts, ww, sd] of [[[[x - w * 0.45, ground - 6], [x - w * 0.8, ground + 8], [x - w * 1.2, ground + 14]], 40, 1], [[[x + w * 0.45, ground - 6], [x + w * 0.8, ground + 8], [x + w * 1.2, ground + 14]], 40, 2]])
    trunk(g, pts, ww, 6, { seed: seed + sd, under: true });
  const mid = (x + bx) / 2;
  trunk(g, [[x - 20, by - 40], [mid + 120, by - 10], [mid - 120, by + 6], [bx, by - 8]], 46, 12, { seed: seed + 3, under: true });
  trunk(g, [[mid, by], [mid - 40, by - 70], [mid - 70, by - 120]], 14, 4, { seed: seed + 4 });
  penLine(g, [[x - 20, by - 62], [mid + 120, by - 32], [mid - 120, by - 16], [bx, by - 14]], { w: 2, alpha: 0.5, seed: seed + 6 });
  wash(g, ellipse(x - 6, ground - 360, 18, 26, 20), { color: '#3c2a20', opacity: 0.85, seed: seed + 7 });
}
function canopy(list, seed, colors = [PAL.olive, PAL.moss, PAL.ochre, PAL.sage, '#c98a4a']) {
  return list.map(([x, y, rx, ry], i) => ({ x, y, s: sprite({ x0: x - rx, y0: y - ry, x1: x + rx, y1: y + ry, w: 2 * rx, h: 2 * ry }, 1, (g) => {
    foliage(g, x, y, rx, ry, { seed: seed + i * 11, colors, blobs: 11, opacity: 0.9 });
  }) }));
}
function drawCanopy(g, c, list, t) {
  for (const [i, cn] of list.entries()) { cam(g, c, 1.05); g.translate(cn.x, cn.y - 80); g.rotate(Math.sin(t * 0.5 + i) * 0.012); g.translate(-cn.x, -(cn.y - 80)); drawSprite(g, cn.s); }
}

// ---------------------------------------------------------------- places
function paintMeadow() {
  const P = {};
  P.sky = layer((g) => { sky(g, '#bcd2dc', '#f1dcb6', '#f5e2b8'); pool(g, 1250, 480, 600, 300, '#fde2a4', 0.5); });
  P.clouds = [[350, 150, 190, 46], [1000, 110, 230, 52], [1650, 170, 190, 44]].map(([x, y, w, h], i) => ({ x, s: sprite({ x0: x - w, y0: y - h, x1: x + w, y1: y + h, w: 2 * w, h: 2 * h }, 1, (g) => cloud(g, x, y, w, h, { seed: 30 + i * 7, color: '#fbeedc' }), { granulate: false }) }));
  P.far = layer((g) => {
    hills(g, 640, 60, '#b9b991', { seed: 4, opacity: 0.55, bumps: 3 });
    for (let i = 0; i < 18; i++) foliage(g, -60 + i * 120 + noise1(i, 2) * 40, 630 + noise1(i, 5) * 20, 60, 42, { seed: 200 + i, haze: 0.6, hazeColor: '#eadbb8', blobs: 4, opacity: 0.7, detail: false, leaves: false });
    hills(g, 680, 34, '#a9b07e', { seed: 5, opacity: 0.55, bumps: 5 });
  });
  P.ground = layer((g) => meadowGround(g, 700, 50, (x, y) => (x < 730 && y < 820) || (x > 1300 && x < 1720 && y < 830)));
  let ck, ok;
  P.cottage = layer((g) => { ck = cottage(g, 400, 800, 0.95, { seed: 5 }); });
  P.oak = layer((g) => { ok = oak(g, 1500, 812, 0.72, { seed: 9, perchX: -560, perchY: 300 }); });
  P.sill = ck.sill; P.chimney = ck.chimney; P.ridge = ck.ridge;
  P.branch = ok.perch; // where the crow lands
  P.canopy = [];
  P.fg = fgPlants(160, [[-30, 230, 1], [300, 120, 0], [880, 100, 0], [1360, 130, 0], [1930, 240, 1]]);
  return P;
}
function drawMeadow(g, t, c, o = {}) {
  const P = MEADOW, night = o.night || 0;
  S.paperBg(g);
  drawLayer(g, c, P.sky, 0.15);
  if (night > 0) { cam(g, c, 0.15); g.globalAlpha = night; g.drawImage(NIGHT_SKY, -M, -MY); g.globalAlpha = 1; }
  for (const cl of P.clouds) { cam(g, c, 0.2); g.translate(t * 3.5, 0); drawSprite(g, cl.s, 0.9 * (1 - night)); }
  drawLayer(g, c, P.far, 0.35);
  drawLayer(g, c, P.ground, 1);
  drawLayer(g, c, P.cottage, 1);
  drawLayer(g, c, P.oak, 1);
  cam(g, c, 1);
  // a soft curl of smoke from the chimney
  g.save();
  for (let k = 0; k < 7; k++) {
    const ph = ((t * 0.12 + k / 7) % 1), [cx, cy] = P.chimney;
    g.globalAlpha = Math.sin(ph * Math.PI) * 0.35 * (1 - night * 0.5);
    pool(g, cx + Math.sin(ph * 5 + k) * 18 + ph * 60, cy - 20 - ph * 240, 16 + ph * 40, 14 + ph * 34, '#efe8de', 0.8);
  }
  g.restore();
  if (o.cheese) cheeseAt(g, o.cheese[0], o.cheese[1], 0.55, 0);
  if (o.actors) o.actors(g);
  drawCanopy(g, c, P.canopy, t);
  cam(g, c, 1);
  if (night < 1) { g.save(); g.globalAlpha = 1 - night; motes(g, t, 30, 11); g.restore(); }
  drawFg(g, c, P.fg, t);
  sunlight(g, 1 - night, o.sunset || 0);
  nightGrade(g, night);
  if (night > 0) {
    cam(g, c, 0.15); stars(g, t, night, o.starsFrom ?? -99); moon(g, 650, 150, 32, night);
    cam(g, c, 1);
    g.save(); g.globalCompositeOperation = 'lighter'; pool(g, P.sill[0], P.sill[1] - 55, 80, 70, '#ffcf80', 0.45 * night); g.restore(); // glowing window
    fireflies(g, t, 24, { x0: 0, x1: W, y0: 420, y1: 1000 }, 41, night);
    if (o.after) o.after(g);
  }
}

function paintOak() {
  const P = {};
  P.sky = layer((g) => { sky(g, '#c4d6dc', '#f2dfba', '#f4e0b4'); pool(g, 500, 420, 700, 320, '#fde2a4', 0.45); });
  const soft = layer((g) => {
    for (let i = 0; i < 9; i++) foliage(g, -40 + i * 240, 640 + (i % 2) * 20, 140, 90, { seed: 300 + i, haze: 0.45, hazeColor: '#eadbb8', blobs: 6, detail: false, leaves: false });
    hills(g, 700, 30, '#b4b48c', { seed: 6, opacity: 0.5 });
  });
  P.far = canvas(LW, LH); { const g = P.far.getContext('2d'); g.filter = 'blur(7px)'; g.drawImage(soft, 0, 0); }
  P.ground = layer((g) => meadowGround(g, 760, 70, (x, y) => (x > 300 && x < 1000 && y < 1000)));
  let ok;
  P.oak = layer((g) => {
    ok = oak(g, 1700, 905, 1.25, { seed: 9, perchX: -560, perchY: 330 });
    for (const [x, y, sc] of [[1440, 910, 1.2], [1480, 916, 0.8], [1900, 912, 1]]) mushroom(g, x, y, { seed: x, s: sc });
  });
  P.perch = ok.perch;
  P.canopy = [];
  P.fg = fgPlants(470, [[-20, 250, 1], [1100, 110, 0], [1940, 260, 1]]);
  return P;
}
// a perch close-up: the crow's branch, soft blurred leaves behind
function paintPerch() {
  const P = {};
  const soft = layer((g) => {
    sky(g, '#c9d6d8', '#f1dcb4', '#f2d9a8');
    for (let i = 0; i < 12; i++) foliage(g, (i % 6) * 360 - 60, i < 6 ? 120 : 900, 260, 170, { seed: 500 + i, blobs: 8, detail: false, opacity: 0.85 });
    pool(g, 900, 500, 700, 380, '#fde2a4', 0.5);
  });
  P.bg = canvas(LW, LH); { const g = P.bg.getContext('2d'); g.filter = 'blur(10px)'; g.drawImage(soft, 0, 0); }
  P.branch = layer((g) => {
    trunk(g, [[W + 80, 760], [1300, 730], [800, 760], [300, 790], [-80, 770]], 92, 54, { seed: 520, under: true });
    trunk(g, [[1100, 740], [1220, 640], [1280, 560]], 26, 8, { seed: 521 });
    trunk(g, [[500, 780], [440, 690], [420, 620]], 22, 6, { seed: 522 });
    penLine(g, [[W + 80, 714], [1300, 686], [800, 716], [300, 746], [-80, 726]], { w: 2.6, alpha: 0.55, seed: 523 });
    for (let k = 0; k < 9; k++) leaf(g, 1220 + Math.sin(k) * 50, 600 + k * 14, 18, k * 0.7, k % 2 ? PAL.olive : PAL.moss);
    for (let k = 0; k < 7; k++) leaf(g, 430 + Math.cos(k) * 40, 640 + k * 14, 16, k * 0.6, k % 2 ? PAL.moss : PAL.ochre);
  });
  P.perch = [960, 742];
  return P;
}
function paintDen() {
  return layer((g) => {
    sky(g, '#6c76a8', '#9c93b8', '#b5a6b8');
    meadowGround(g, 800, 600);
    // a great root arch, the fox's cosy den beneath
    const mound = smooth([[-M - 40, 820], [300, 520], [700, 400], [1200, 420], [1600, 560], [W + M + 40, 820], [W + M + 40, 1000], [-M - 40, 1000]]);
    wash(g, mound, { color: '#8a7a54', opacity: 0.95, seed: 601, under: true });
    strokes(g, mound, { color: '#5f6b3a', count: 700, len: 10, width: 1.2, alpha: 0.35, seed: 602, dir: () => -Math.PI / 2, curve: 0.4 });
    for (let i = 0; i < 9; i++) foliage(g, 200 + i * 190, 470 + Math.abs(i - 4) * 30, 120, 50, { seed: 610 + i, colors: [PAL.moss, PAL.olive, PAL.sage], blobs: 5, opacity: 0.85 });
    const hole = smooth([[560, 990], [560, 760], [700, 640], [960, 610], [1220, 650], [1360, 770], [1360, 990]]);
    wash(g, hole, { color: '#3a2c22', opacity: 0.95, seed: 620, under: true });
    glaze(g, hole, 960, 860, 360, 160, '#6a4c36', 0.6);
    for (const [pts, w, sd] of [[[[540, 990], [560, 760], [700, 640], [900, 600]], 60, 1], [[[1380, 990], [1360, 770], [1220, 650], [1020, 600]], 60, 2], [[[700, 640], [960, 590], [1220, 650]], 44, 3]])
      trunk(g, pts, w, w * 0.6, { seed: 630 + sd, under: true });
    for (let i = 0; i < 6; i++) fern(g, 450 + i * 22, 990, { seed: 640 + i, len: 180, angle: -1.9 + i * 0.25, curl: 0.6, color: PAL.moss });
    for (let i = 0; i < 6; i++) fern(g, 1460 - i * 22, 990, { seed: 650 + i, len: 180, angle: -1.2 - i * 0.25, curl: -0.6, color: PAL.olive });
    // a soft bed of leaves inside
    wash(g, ellipse(960, 975, 300, 40, 30), { color: '#b8803e', opacity: 0.85, seed: 660 });
    for (let k = 0; k < 24; k++) leaf(g, 700 + k * 22, 965 + (k % 3) * 8, 14, k * 0.9, k % 2 ? PAL.ochre : PAL.rust);
  });
}
function paintNest() {
  // a deep, cosy bowl of woven twigs, lined with soft moss and downy feathers
  const twigArc = (g, r, cx, cy, rx, ry, a0, a1, cols, w) => {
    const pts = []; const n = 10;
    for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    penLine(g, pts, { color: r.pick(cols), w, alpha: 0.95, seed: Math.floor(r() * 1e6), weight: (t) => 0.5 + 0.6 * Math.sin(Math.PI * t) });
  };
  const back = sprite({ x0: -175, y0: -95, x1: 175, y1: 20, w: 350, h: 115 }, 2, (g) => {
    const r = rng(702);
    // the inside of the bowl, in shadow, with a soft lining
    wash(g, ellipse(0, -30, 142, 40, 40), { color: '#5a4230', opacity: 0.97, seed: 703, under: true });
    glaze(g, ellipse(0, -30, 142, 40, 40), 0, -22, 110, 26, '#2e2018', 0.6);
    for (let k = 0; k < 40; k++) twigArc(g, r, 0, -26, r.range(130, 150), r.range(34, 44), Math.PI * r.range(1.02, 1.3), Math.PI * r.range(1.6, 1.98), ['#6f5236', '#8a6a46', '#4a3424'], r.range(1.4, 2.6));
    for (let k = 0; k < 26; k++) { // moss around the back rim, a little down here and there
      const a = Math.PI * r.range(1.05, 1.95), x = Math.cos(a) * 128, y = -30 + Math.sin(a) * 34;
      g.fillStyle = rgba(k % 5 ? r.pick(['#7f9a5a', '#6f8a4a']) : '#e9e0d0', 0.7); g.beginPath(); g.ellipse(x, y, r.range(8, 15), r.range(4, 7), r.range(-0.4, 0.4), 0, 7); g.fill();
    }
    // a soft grey feather tucked in at the back
    const f = smooth([[60, -40], [80, -86], [96, -92], [90, -60], [70, -36]]);
    wash(g, f, { color: '#d6d2cc', opacity: 0.95, seed: 704, under: true, layers: 10 });
    penLine(g, [[64, -38], [92, -88]], { w: 1.2, alpha: 0.5 });
  }, { granulate: false });
  const front = sprite({ x0: -185, y0: -70, x1: 185, y1: 90, w: 370, h: 160 }, 2, (g) => {
    const r = rng(705);
    const bowl = smooth([[-150, -32], [-146, 6], [-110, 50], [-40, 72], [40, 72], [110, 50], [146, 6], [150, -32], [100, -14], [0, -8], [-100, -14]]);
    wash(g, bowl, { color: '#8a6a46', opacity: 0.97, seed: 706, under: true });
    shadeEdge(g, bowl, { color: '#3e2a1c', alpha: 0.55, width: 40, dy: -16 });
    glaze(g, bowl, -40, -6, 100, 24, '#c9a36e', 0.45);
    // layer upon layer of curved, woven twigs following the bowl
    for (let k = 0; k < 120; k++) {
      const yy = r.range(-20, 64), rx = 150 - Math.max(0, yy) * 0.55;
      twigArc(g, r, r.gauss(0, 6), yy - 30, rx * r.range(0.85, 1.05), r.range(24, 44), Math.PI * r.range(0.02, 0.35), Math.PI * r.range(0.6, 0.98), ['#6f5236', '#8a6a46', '#a88454', '#4a3424', '#b8955e'], r.range(1.4, 3));
    }
    // twig ends poking out of the weave
    for (let k = 0; k < 16; k++) {
      const a = Math.PI * r.range(-0.08, 1.08), x = Math.cos(a) * 150, y = -26 + Math.sin(a) * 60, d = r.range(18, 40);
      penLine(g, [[x - Math.cos(a + 1.4) * 8, y], [x + Math.cos(a) * d * 0.4 + r.gauss(0, 8), y + Math.sin(a) * d * 0.3 - 4], [x + Math.cos(a) * d, y + Math.sin(a) * d * 0.5 + r.gauss(0, 6)]], { color: r.pick(['#6f5236', '#8a6a46', '#4a3424']), w: 2, alpha: 0.9 });
    }
    // downy lining peeking over the front rim, moss tufts and a little leaf sprig
    for (let k = 0; k < 18; k++) { // soft moss along the rim
      const x = -140 + k * 16 + r.gauss(0, 4), y = -20 + Math.abs(x) * 0.07 + r.gauss(0, 2);
      g.fillStyle = rgba(r.pick(['#7f9a5a', '#6f8a4a', '#93a862']), 0.75); g.beginPath(); g.ellipse(x, y, r.range(9, 15), r.range(4, 7), r.gauss(0, 0.2), 0, 7); g.fill();
    }
    g.save(); g.lineCap = 'round'; // wisps of downy feathers peeking over the rim
    for (let k = 0; k < 9; k++) {
      const x0 = r.range(-120, 120), y0 = -22 + Math.abs(x0) * 0.07;
      for (let j = 0; j < 9; j++) {
        const a = -Math.PI / 2 + r.gauss(0, 1.1), L = r.range(4, 9);
        g.strokeStyle = rgba('#f1e8da', r.range(0.25, 0.55)); g.lineWidth = r.range(1.5, 3);
        g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + Math.cos(a) * L * 0.6 + r.gauss(0, 3), y0 + Math.sin(a) * L * 0.6, x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); g.stroke();
      }
    }
    g.restore();
    for (let k = 0; k < 7; k++) foliage(g, -130 + k * 44 + r.gauss(0, 8), 30 + Math.abs(k - 3) * 6, 18, 10, { seed: 707 + k, colors: ['#6f8a4a', '#8fa252', '#5c7040'], blobs: 3, opacity: 0.9, detail: false });
    for (let k = 0; k < 5; k++) leaf(g, -150 + k * 10, -10 + k * 9, 11, -0.8 + k * 0.3, k % 2 ? '#8fa252' : '#c9a24f');
    penLine(g, bowl.slice(Math.floor(bowl.length * 0.08), Math.floor(bowl.length * 0.72)), { w: 2.2, alpha: 0.6, seed: 708 });
  }, { granulate: false });
  return [back, front];
}
// a soft pink-and-gold evening sky behind the crow's branch
function paintSunset() {
  const soft = layer((g) => {
    const grd = g.createLinearGradient(0, -MY, 0, H + MY);
    grd.addColorStop(0, '#b8a9d2'); grd.addColorStop(0.3, '#e9b9c8'); grd.addColorStop(0.55, '#f6c9bd'); grd.addColorStop(0.75, '#fadcb4'); grd.addColorStop(1, '#f2c79c');
    g.fillStyle = grd; g.fillRect(-M, -MY, LW, LH);
    pool(g, 1350, 640, 520, 300, '#fff0c8', 0.7);                       // the low sun's glow
    g.fillStyle = 'rgba(255,240,205,0.9)'; g.beginPath(); g.arc(1350, 650, 60, 0, 7); g.fill();
    for (const [x, y, w, h, c] of [[300, 220, 260, 50, '#f3b6c2'], [900, 150, 300, 46, '#f6c4cc'], [1600, 260, 240, 44, '#f8cfc0'], [600, 420, 220, 36, '#f9d2c4']])
      cloud(g, x, y, w, h, { seed: x, color: c, opacity: 0.75 });
    hills(g, 820, 40, '#b99aaa', { seed: 8, opacity: 0.6, bumps: 4 });
    for (let i = 0; i < 16; i++) foliage(g, -60 + i * 130, 820 + (i % 3) * 10, 70, 46, { seed: 900 + i, haze: 0.55, hazeColor: '#d8a6b4', blobs: 4, detail: false, leaves: false, opacity: 0.8 });
    // leafy branches framing the top corners, rosy in the evening light
    for (const [x, y] of [[-40, 40], [220, -20], [1700, -10], [1960, 60]]) foliage(g, x, y, 240, 150, { seed: 950 + x, colors: ['#7a8a5a', '#8f8a5a', '#a08a62'], blobs: 8, detail: false, opacity: 0.9 });
  });
  const c = canvas(LW, LH); const g = c.getContext('2d'); g.filter = 'blur(6px)'; g.drawImage(soft, 0, 0);
  return c;
}

// ---------------------------------------------------------------- staging
let OAK_CROW = [1290, 430]; const OAK_CS = 1.5;   // crow on the branch in the oak scene
const FOX_SIT = [700, 960], FOX_S = 1.4;
function cheeseInBeak(cx, cy, s) { return [cx + -120 * s, cy - 104 * s]; }
function foxMouth(x, y, s) { // where the cheese sits in the sitting fox's mouth (screen space)
  const a = -0.22, hx = 52, hy = -318, mx = 96, my = 22;
  return [x + (hx + mx * Math.cos(a) - my * Math.sin(a)) * s, y + (hy + mx * Math.sin(a) + my * Math.cos(a)) * s];
}
function cheeseAt(g, x, y, s = 1, rot = 0) { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); crow.drawCheese(g); g.restore(); }

// ---- title
function drawTitle(g, t) {
  S.paperBg(g);
  g.fillStyle = 'rgba(250,214,160,0.2)'; g.fillRect(0, 0, W, H);
  const c = { z: 1 + t * 0.004, x: 0, y: 0 };
  drawLayer(g, c, TITLE, 1);
  cam(g, c, 1);
  g.save(); g.textAlign = 'center'; g.fillStyle = INK;
  const a1 = span(t, 0.6, 2.4), a2 = span(t, 1.4, 3.2), a3 = span(t, 2.4, 4.0);
  g.globalAlpha = a1 * 0.9; g.font = '150px "Fell"'; g.fillText('The Fox', 960, 400 + (1 - a1) * 10);
  g.globalAlpha = a2 * 0.9; g.font = 'italic 120px "Fell"'; g.fillText('& the Crow', 960, 540 + (1 - a2) * 10);
  g.globalAlpha = a3 * 0.75; g.font = 'italic 40px "Fell"'; g.fillText('an Aesop’s fable, for sleepy little ones', 960, 630);
  g.restore();
  g.save(); g.translate(1430, 742); g.scale(0.62, 0.62); crow.draw(g, { t, cheese: true, eye: 1 - S.blink(t, 3) }); g.restore();
  g.save(); g.translate(560, 800); g.scale(0.5, 0.5); fox.drawSit(g, { eyes: 1 - S.blink(t, 5), smile: 0.6, breath: Math.sin(t * 1.2) }); g.restore();
}
function paintTitle() {
  return layer((g) => {
    trunk(g, [[1200, 750], [1450, 742], [1700, 736]], 22, 10, { seed: 801, under: true });
    for (let k = 0; k < 8; k++) leaf(g, 1220 + k * 60, 732 + Math.sin(k) * 8, 13, k * 0.8, k % 2 ? PAL.olive : PAL.moss);
    for (let i = 0; i < 6; i++) fern(g, 380 + i * 30, 820, { seed: 810 + i, len: 130 - i * 6, angle: -2.0 + i * 0.22, curl: 0.5, color: i % 2 ? PAL.moss : PAL.olive });
    berries(g, 700, 790, { seed: 3, size: 7 }); flower(g, 740, 800, { seed: 4, size: 11, color: PAL.pink, stem: 30 });
    wash(g, smooth([[340, 830], [800, 812], [820, 836], [330, 846]]), { color: '#a9ae7f', opacity: 0.4, seed: 7, edge: 0 });
  });
}

// ---- scene 1: the meadow, the windowsill, the flight to the oak
const CS1 = 0.55; // crow size in the wide meadow
// a flight from p0 to p1 between t0 and t1, arcing up by `lift`; returns position, pitch and wing state
function flight(t, t0, t1, p0, p1, lift, beats = 3.4) {
  const k = clamp((t - t0) / (t1 - t0)), e = k * k * (3 - 2 * k);
  const c = [(p0[0] + p1[0]) / 2, Math.min(p0[1], p1[1]) - lift];
  const B = (u) => [(1 - u) ** 2 * p0[0] + 2 * (1 - u) * u * c[0] + u * u * p1[0], (1 - u) ** 2 * p0[1] + 2 * (1 - u) * u * c[1] + u * u * p1[1]];
  const [x, y] = B(e), [x2, y2] = B(Math.min(1, e + 0.02));
  const vx = x2 - x, vy = y2 - y;
  const glide = span(k, 0.38, 0.5) * (1 - span(k, 0.66, 0.76));
  const flare = span(k, 0.8, 0.97), legs = Math.max(1 - span(k, 0.04, 0.16), span(k, 0.74, 0.9));
  const pitch = clamp(Math.atan2(-vy, Math.abs(vx) + 1e-3), -0.45, 0.45) * 0.7 + flare * 0.5;
  return { x, y: y - Math.sin(Math.PI * k) * 0, pitch, glide, flare, legs, beat: (t - t0) * beats, dir: Math.sign(p1[0] - p0[0]) || 1 };
}
function crow1(t) {
  const n02 = line('n02'), n03 = line('n03'), c01 = line('c01');
  const ridge = [MEADOW.ridge[0] - 30, MEADOW.ridge[1] + 4], sill = [MEADOW.sill[0] - 36, MEADOW.sill[1] - 2], perch = MEADOW.branch;
  const cheese = [sill[0] + 96 * CS1 / 0.55 * 0.55, sill[1] - 8];
  const hopT0 = n02.start + 1.6, hopT1 = hopT0 + 1.7;          // a short flight down to the sill
  const grabT = hopT1 + 2.4;                                     // she looks at it... then picks it up
  const flyT0 = n03.start + 1.1, flyT1 = flyT0 + 4.2;            // off to the oak
  const turnT = c01.start - 0.6;
  if (t < hopT0) {
    const spot = span(t, n02.start - 0.2, n02.start + 0.6);      // she spots the cheese and peers down
    return { pose: 'perch', x: ridge[0], y: ridge[1], flip: -1, tilt: -Math.sin(t * 0.7) * 0.12 * (1 - spot), lean: spot * 0.35, crouch: span(t, hopT0 - 0.3, hopT0) , cheeseOnSill: cheese };
  }
  if (t < hopT1) return { pose: 'fly', ...flight(t, hopT0, hopT1, ridge, sill, 90, 3.8), cheeseOnSill: cheese };
  if (t < flyT0) {
    const settle = 1 - span(t, hopT1, hopT1 + 0.45);
    const look = Math.sin((t - hopT1) * 3.2) * 0.18 * (1 - span(t, grabT - 0.7, grabT - 0.5));
    const dip = span(t, grabT - 0.5, grabT - 0.05) * (1 - span(t, grabT + 0.15, grabT + 0.6));
    const has = t >= grabT;
    const happy = has ? span(t, grabT + 0.6, grabT + 0.9) * (1 - span(t, grabT + 2.2, grabT + 2.5)) : 0;
    return { pose: 'perch', x: sill[0], y: sill[1], flip: -1, wingOpen: settle, tilt: look, lean: dip * 0.5, hasCheese: has, happy,
      crouch: span(t, flyT0 - 0.3, flyT0), cheeseOnSill: has ? null : cheese };
  }
  if (t < flyT1) return { pose: 'fly', ...flight(t, flyT0, flyT1, sill, perch, 260, 3.2), hasCheese: true };
  const settle = 1 - span(t, flyT1, flyT1 + 0.5);
  const turned = t > turnT + 0.25;
  const hop = t > turnT && t < turnT + 0.5 ? Math.sin((t - turnT) / 0.5 * Math.PI) * 18 : 0;
  const happy = S.mood(t, 'c01', 0.2, 1.4);
  return { pose: 'perch', x: perch[0], y: perch[1] - hop, flip: turned ? 1 : -1, wingOpen: settle, hasCheese: true, happy: happy > 0.5, fluff: happy * 0.6 };
}
function drawScene1(g, t) {
  // wide, then in close on the cottage window for the cheese, then back out for the flight to the oak
  const n02 = line('n02'), n03 = line('n03');
  const close = ease(span(t, n02.start - 0.2, n02.start + 1.6)) * (1 - ease(span(t, n03.start + 0.6, n03.start + 2.8)));
  const wide = { z: 1.0 + 0.04 * span(t, 6, line('c01').end), x: 40 * span(t, n03.start + 2, line('c01').end), y: 0 };
  const near = { z: 1.55, x: MEADOW.sill[0] - 60 - W / 2, y: MEADOW.sill[1] - 175 - H / 2 };
  const c = { z: lerp(wide.z, near.z, close), x: lerp(wide.x, near.x, close), y: lerp(wide.y, near.y, close) };
  const p = crow1(t);
  drawMeadow(g, t, c, { cheese: p.cheeseOnSill, actors: (g) => {
    g.save(); g.translate(p.x, p.y);
    if (p.pose === 'fly') {
      g.scale(-p.dir * CS1, CS1);
      crow.drawFly(g, { beat: p.beat, glide: p.glide, flare: p.flare, legs: p.legs, pitch: p.pitch, cheese: p.hasCheese, eye: 1 });
    } else {
      g.rotate(-(p.lean || 0) * p.flip); g.scale(p.flip * CS1, CS1 * (1 - 0.08 * (p.crouch || 0)));
      crow.draw(g, { t, cheese: p.hasCheese, headTilt: p.tilt || 0, wingOpen: p.wingOpen || 0, fluff: p.fluff || 0,
        eye: p.happy ? 0 : 1 - S.blink(t, 3), happy: !!p.happy });
    }
    g.restore();
  } });
}

// ---- scenes 2 & 3: under the oak
function foxState(t) {
  const n04 = line('n04'), n09 = line('n09');
  const stopT = n04.start + 4.2, inT = n04.start - 0.8;
  const leaveT = n09.start + 1.4;
  if (t < stopT) { const k = clamp((t - inT) / (stopT - inT)); return { mode: 'trot', x: lerp(-260, FOX_SIT[0] - 60, 1 - (1 - k) ** 2), walk: t * 0.95, flip: 1 }; }
  if (t < leaveT) return { mode: 'sit', x: FOX_SIT[0], blend: span(t, stopT, stopT + 0.5) };
  const k = t - leaveT;
  return { mode: 'trot', x: FOX_SIT[0] - 40 - k * 230, walk: t * 0.95, flip: -1, blend: span(t, leaveT, leaveT + 0.4) };
}
function drawOak(g, t) {
  const n05 = line('n05'), f01 = line('f01'), n07 = line('n07'), c02 = line('c02'), n08 = line('n08'), n09 = line('n09');
  // camera: wide, then a slow look up at the crow as the fox spots her, then back down
  const up = span(t, n05.start + 1.2, n05.start + 3.2) * (1 - span(t, n05.end - 0.4, f01.start + 0.8));
  const c = { z: 1.0 + 0.12 * up + 0.04 * span(t, f01.start, n09.start), x: lerp(0, 160, up), y: lerp(0, -170, up) };
  const P = OAK;
  S.paperBg(g);
  drawLayer(g, c, P.sky, 0.15);
  drawLayer(g, c, P.far, 0.35);
  drawLayer(g, c, P.ground, 1);
  drawLayer(g, c, P.oak, 1);
  cam(g, c, 1);
  // ---- the cheese's journey
  const fallT0 = c02.start + 0.45, fallT1 = n08.start + 3.4;
  const beak = cheeseInBeak(OAK_CROW[0], OAK_CROW[1], OAK_CS), mouth = foxMouth(FOX_SIT[0], FOX_SIT[1], FOX_S);
  // the fox lifts a paw to catch it, holds it while he talks, then pops it into his mouth and trots off
  const leaveT = n09.start + 1.4, popT = leaveT - 1.1;
  const pawUp = span(t, fallT1 - 1.4, fallT1 - 0.5) * (1 - span(t, popT + 0.25, popT + 0.8));
  const PIV = [73, -140], HOLD = [98, 2];
  const pawAt = (up) => { const a = -1.85 * up, dx = HOLD[0] - PIV[0], dy = HOLD[1] - PIV[1];
    return [FOX_SIT[0] + (PIV[0] + dx * Math.cos(a) - dy * Math.sin(a)) * FOX_S, FOX_SIT[1] + (PIV[1] + dx * Math.sin(a) + dy * Math.cos(a)) * FOX_S]; };
  const paw = pawAt(1);
  const crowHas = t < fallT0, inPaw = t >= fallT1 && t < popT, popping = t >= popT && t < popT + 0.4, foxHas = t >= popT + 0.4;
  // ---- the crow
  const proud = S.mood(t, 'n06', 0.2, 99) * (1 - span(t, c02.end + 0.3, c02.end + 1.2));
  const singUp = span(t, n07.start + 2.5, n07.end + 0.4) * (1 - span(t, c02.end + 0.2, c02.end + 0.9));
  const caw = S.talking('c02', t);
  const shock = span(t, fallT0 + 0.2, fallT0 + 0.5) * (1 - span(t, n09.end, n09.end + 2));
  const listen = Math.max(S.mood(t, 'f01'), S.mood(t, 'f02'), S.mood(t, 'f03'));
  g.save(); g.translate(OAK_CROW[0], OAK_CROW[1]); g.scale(OAK_CS, OAK_CS);
  crow.draw(g, { t, cheese: crowHas, fluff: Math.max(proud, singUp) * 0.8, headTilt: -singUp * 0.45 + listen * 0.08 * Math.sin(t * 0.7) - shock * 0.1,
    beak: Math.max(caw * 1.1, shock * 0.25), eye: singUp > 0.4 && caw > 0.1 ? 0 : 1 - S.blink(t, 4), happy: singUp > 0.4 && caw > 0.1, wingOpen: caw * 0.4 + shock * 0.3 });
  g.restore();
  if (!crowHas && !foxHas) { // fluttering down, down, down
    const k = (t - fallT0) / (fallT1 - fallT0), e = k * k * 0.4 + k * 0.6;
    const x = lerp(beak[0], paw[0], e) + Math.sin(k * Math.PI * 3) * 40 * (1 - k), y = lerp(beak[1], paw[1], e);
    cheeseAt(g, x + 120 * 1.2 - 120 * 1.2, y, 1.2, Math.sin(k * 9) * 0.6);
  }
  // ---- the fox
  const fs = foxState(t);
  const lookUp = S.mood(t, 'n05', -1.0, 99) * (1 - span(t, n09.start, n09.start + 1));
  const sly = Math.max(S.mood(t, 'f01', 0.1, 0.4), S.mood(t, 'f02', 0.1, 0.4), S.mood(t, 'f03', 0.1, 0.6)) * 0.75;
  const foxTalk = S.talk(['f01', 'f02', 'f03', 'f04', 'f05'], t);
  const sniff = t > line('n04').start + 4.5 && t < line('n04').end ? Math.max(0, Math.sin((t - line('n04').start) * 9)) * 0.3 : 0;
  const catchK = 0.3 * span(t, fallT1 - 0.6, fallT1 - 0.1) * (1 - span(t, fallT1 + 0.05, fallT1 + 0.4)) + 0.8 * span(t, popT - 0.1, popT + 0.2) * (1 - span(t, popT + 0.35, popT + 0.6));
  const pleased = S.mood(t, 'f04', 0.4, 1.0) + S.mood(t, 'f05', 0.2, 1.0);
  const st = { t, eyes: 1 - S.blink(t, 6), sly: sly + pleased * 0.3, smile: 0.4 + sly * 0.6 + pleased * 0.6, browUp: Math.max(S.mood(t, 'n05', -1.5, 1), sly * 0.6),
    mouth: Math.max(foxTalk * 0.8, catchK * 0.9, sniff), breath: Math.sin(t * 1.3), tail: Math.sin(t * 0.9),
    headDY: -sniff * 6, cheese: foxHas ? (g, x, y) => cheeseAt(g, x * 1.22 + 6, y * 1.22 + 2, 1.0 / FOX_S * 1.2, 0.3) : null,
    pawUp, pawHold: inPaw ? (g, x, y) => cheeseAt(g, HOLD[0], HOLD[1], 1.35 / FOX_S, 1.85) : null };
  if (fs.mode === 'sit') {
    g.save(); g.translate(FOX_SIT[0], FOX_SIT[1]); g.scale(FOX_S, FOX_S); fox.drawSit(g, { ...st, headDY: st.headDY - lookUp * 6 }); g.restore();
    if (fs.blend < 1) { g.save(); g.globalAlpha = 1 - fs.blend; g.translate(FOX_SIT[0] - 60, FOX_SIT[1]); g.scale(FOX_S * 0.86, FOX_S * 0.86); fox.drawTrot(g, { ...st, walk: null }); g.restore(); }
  } else {
    g.save(); g.translate(fs.x, FOX_SIT[1]); g.scale(FOX_S * 0.86 * fs.flip, FOX_S * 0.86); fox.drawTrot(g, { ...st, walk: fs.walk, sly: 0, smile: 0.8 }); g.restore();
    if (fs.blend !== undefined && fs.blend < 1) { g.save(); g.globalAlpha = 1 - fs.blend; g.translate(FOX_SIT[0], FOX_SIT[1]); g.scale(FOX_S, FOX_S); fox.drawSit(g, st); g.restore(); }
  }
  if (popping) { const k = ease((t - popT) / 0.4), from = pawAt(1 - span(t, popT + 0.25, popT + 0.8)); cheeseAt(g, lerp(from[0], mouth[0], k), lerp(from[1], mouth[1], k) - Math.sin(k * Math.PI) * 30, 1.2, k * 0.3); }
  // ---- leaves, motes, foreground
  drawCanopy(g, c, P.canopy, t);
  cam(g, c, 1.05);
  for (let i = 0; i < 3; i++) {
    const period = 15, ph = ((t + i * 4.7) % period) / period;
    g.save(); g.globalAlpha = Math.sin(ph * Math.PI); g.translate(700 + i * 380 + Math.sin(ph * 9 + i) * 60, 140 + ph * 860); g.rotate(ph * 8 + i); drawSprite(g, LEAF[i % LEAF.length]); g.restore();
  }
  cam(g, c, 1);
  motes(g, t, 36, 21);
  drawFg(g, c, P.fg, t);
  sunlight(g, 1);
}

// ---- scene 4: the crow thinks it over
function drawPerch(g, t) {
  const n10 = line('n10'), c03 = line('c03'), n11 = line('n11'), n12 = line('n12');
  const k = clamp((t - n10.start + 1) / (n12.end - n10.start + 3));
  const c = { z: 1.02 + 0.05 * ease(k), x: lerp(-20, 20, ease(k)), y: 0 };
  S.paperBg(g);
  drawLayer(g, c, PERCH.bg, 0.5);
  drawLayer(g, c, PERCH.branch, 1);
  cam(g, c, 1);
  const think = S.mood(t, 'n10', 0.5, 0.6) + S.mood(t, 'c03', 0.2, 0.5);
  const bright = span(t, n11.start + 1.5, n11.start + 3);
  const nod = bright * Math.max(0, Math.sin((t - n12.start) * 2)) * 0.08 * (t > n12.start ? 1 : 0);
  g.save(); g.translate(PERCH.perch[0], PERCH.perch[1]); g.scale(2.6, 2.6);
  crowBig.draw(g, { t, headTilt: think * 0.22 * Math.sin(t * 0.6) + think * 0.12 - bright * 0.12 + nod, beak: S.talking('c03', t) * 0.7,
    eye: bright > 0.5 && S.talking('n12', t) > 0 && Math.sin(t * 0.5) > 0.3 ? 0 : 1 - S.blink(t, 9), happy: bright > 0.5 && Math.sin(t * 0.5) > 0.3, fluff: bright * 0.5 });
  g.restore();
  // a little thought: three soft dots
  if (think > 0.05) {
    g.save(); g.fillStyle = INK;
    for (let i = 0; i < 3; i++) { g.globalAlpha = think * 0.5 * clamp((t - n10.start - 0.6 - i * 0.6) / 0.5); g.beginPath(); g.arc(760 - i * 34, 330 - i * 40, 7 + i * 3, 0, 7); g.fill(); }
    g.restore();
  }
  motes(g, t, 24, 31);
  sunlight(g, 1, bright * 0.3);
}

// ---- scene 5a: sunset, the crow in her nest
function drawNest(g, t) {
  const n13 = line('n13');
  const k = clamp((t - n13.start + 1) / (n13.end - n13.start + 3));
  const c = { z: 1.04 + 0.04 * ease(k), x: 0, y: 0 };
  S.paperBg(g);
  drawLayer(g, c, SUNSET, 0.5);
  drawLayer(g, c, PERCH.branch, 1);
  cam(g, c, 1);
  const sleepy = span(t, n13.start + 5.5, n13.end + 0.5);
  const [nx, ny] = [PERCH.perch[0], PERCH.perch[1] - 34];
  g.save(); g.translate(nx, ny); g.scale(1.9, 1.9); drawSprite(g, NEST_BACK); g.restore();
  // she settles down into the nest, fluffs up, and slowly falls asleep
  const sink = span(t, n13.start - 0.5, n13.start + 2.0);
  g.save(); g.translate(nx + 30, ny + 26 + sink * 60); g.scale(2.4, 2.4);
  crowBig.draw(g, { t, fluff: 0.6 + sleepy * 0.4, headTilt: -(0.05 + sleepy * 0.3), eye: 1 - Math.max(sleepy, S.blink(t, 9) * (1 - sleepy)), wingOpen: -sleepy * 0.1 });
  g.restore();
  g.save(); g.translate(nx, ny); g.scale(1.9, 1.9); drawSprite(g, NEST_FRONT); g.restore();
  zzz(g, t, nx - 120, ny - 300, n13.end - 1, n13.end + 6);
  // warm, rosy evening light over everything
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'soft-light';
  const lg = g.createLinearGradient(0, 0, W, H); lg.addColorStop(0, 'rgba(255,190,200,0.55)'); lg.addColorStop(1, 'rgba(255,200,150,0.4)');
  g.fillStyle = lg; g.fillRect(0, 0, W, H); g.restore();
  nightGrade(g, 0.18 * sleepy);
}

// ---- scene 5b: the fox in his den
function drawDen(g, t) {
  const n14 = line('n14');
  const k = clamp((t - n14.start + 1) / (n14.end - n14.start + 3));
  const c = { z: 1.0 + 0.06 * ease(k), x: 0, y: 30 * ease(k) };
  S.paperBg(g);
  drawLayer(g, c, DEN, 1);
  cam(g, c, 1);
  const sleep = span(t, n14.start + 1.5, n14.start + 3.5);
  g.save(); g.translate(970, 975); g.scale(1.25, 1.25);
  fox.drawCurl(g, { eyes: (1 - sleep) * 0.6, breath: Math.sin(t * 1.1), tail: Math.sin(t * 0.5) });
  g.restore();
  zzz(g, t, 860, 760, n14.start + 3.5, n14.end + 6);
  nightGrade(g, 0.6);
  cam(g, c, 1);
  g.save(); g.globalCompositeOperation = 'lighter'; pool(g, 960, 860, 360, 200, '#ffcf80', 0.12); g.restore();
  fireflies(g, t, 22, { x0: 0, x1: W, y0: 380, y1: 1000 }, 71, 1);
}

// ---- scene 5c: night over the meadow
function drawNight(g, t) {
  const n15 = line('n15'), n16 = line('n16');
  const k = clamp((t - n15.start) / (S.TL.duration - n15.start));
  const c = { z: 1.04 - 0.04 * ease(k), x: 20 - 20 * ease(k), y: 0 };
  drawMeadow(g, t, c, { night: 1, starsFrom: n15.start - 0.5, actors: (g) => {
    const [bx, by] = MEADOW.branch;
    g.save(); g.translate(bx, by + 6); g.scale(0.8, 0.8); drawSprite(g, NEST_BACK); g.restore();
    g.save(); g.translate(bx + 12, by + 8); g.scale(0.85, 0.85); crow.draw(g, { t, fluff: 1, headTilt: -0.3, eye: 0 }); g.restore();
    g.save(); g.translate(bx, by + 6); g.scale(0.8, 0.8); drawSprite(g, NEST_FRONT); g.restore();
  }, after: (g) => {
    const a = span(t, n16.end + 2.5, n16.end + 5) * (1 - span(t, S.TL.duration - 12, S.TL.duration - 7));
    if (a > 0) {
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.textAlign = 'center';
      g.fillStyle = `rgba(250,238,210,${0.85 * a})`; g.font = 'italic 76px "Fell"'; g.fillText('Sweet dreams', 960, 230);
      g.font = 'italic 34px "Fell"'; g.fillStyle = `rgba(250,238,210,${0.6 * a})`; g.fillText('the end', 960, 285);
      g.restore();
    }
  } });
}

// ---------------------------------------------------------------- entry points
let SCENES;
window.FABLE = {
  async setup(timeline) {
    S = makeStage(timeline);
    await S.setup(document.getElementById('c'));
    fox = makeFox2(1.2); crow = makeCrow(1.4); crowBig = makeCrow(2.8);
    LEAF = [PAL.ochre, PAL.rust, PAL.olive].map((col) => sprite({ x0: -14, y0: -14, x1: 14, y1: 14, w: 28, h: 28 }, 1, (g) => leaf(g, 0, 0, 12, 0, col), { granulate: false }));
    TITLE = paintTitle();
    MEADOW = paintMeadow();
    OAK = paintOak(); OAK_CROW = OAK.perch;
    PERCH = paintPerch();
    DEN = paintDen();
    [NEST_BACK, NEST_FRONT] = paintNest();
    SUNSET = paintSunset();
    NIGHT_SKY = layer((g) => {
      const grd = g.createLinearGradient(0, -MY, 0, 760);
      grd.addColorStop(0, '#5d6aa8'); grd.addColorStop(0.7, '#8c8fbf'); grd.addColorStop(1, '#b7a9c6');
      g.fillStyle = grd; g.fillRect(-M, -MY, LW, LH);
    });
    SCENES = [
      [0, drawTitle], [5.4, drawScene1], [line('n04').start - 1.4, drawOak],
      [line('n10').start - 1.2, drawPerch], [line('n13').start - 1.2, drawNest],
      [line('n14').start - 1.2, drawDen], [line('n15').start - 1.0, drawNight],
    ];
  },
  frame(t) { S.frame(t, SCENES); },
};
