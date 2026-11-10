// The Tortoise and the Hare: scenes, staging and timing.
import { W, H, rng, canvas, wash, pool, strokes, ellipse, smooth, sprite, drawSprite, bbox, noise1, rgba, shade, tint,
  clamp, lerp, ease, span, glaze, shadeEdge, penLine, hatch, path, ribbon } from '../../engine/watercolor.js';
import { PAL, foliage, trunk, grass, flower, berries, mushroom, fern, hills, cloud, leaf, plant, oak } from '../../engine/scenery.js';
import { M, MY, LW, LH, INK, layer, cam, drawLayer, fireflies, motes, nightGrade, sunlight, stars, moon, zzz, makeStage } from '../../engine/stage.js';
import { makeHare } from '../../engine/characters/hare.js';
import { makeTortoise } from '../../engine/characters/tortoise.js';
import { makeOwl, makeSongbird } from '../../engine/characters/birds.js';

let S, hare, tort, owl, birds, MEADOW, START, PATHP, POND, TITLE, NIGHT_SKY, SUNSET_SKY;
const line = (id) => S.line(id);
const say = (id, t) => S.talking(id, t);

// ---------------------------------------------------------------- painting helpers
function sky(g, top, mid, bottom) {
  const grd = g.createLinearGradient(0, -MY, 0, 820);
  grd.addColorStop(0, top); grd.addColorStop(0.6, mid); grd.addColorStop(1, bottom);
  g.fillStyle = grd; g.fillRect(-M, -MY, LW, LH);
}
function ground(g, y0, seed, clear = () => false, o = {}) {
  wash(g, smooth([[-M - 50, y0], [500, y0 - 14], [1100, y0 + 10], [W + M + 50, y0 - 6], [W + M + 50, LH], [-M - 50, LH]]), { color: o.c1 || '#b6b276', opacity: 0.9, seed, bleed: 0.02, layers: 24 });
  wash(g, smooth([[-M - 50, y0 + 140], [700, y0 + 120], [W + M + 50, y0 + 140], [W + M + 50, LH], [-M - 50, LH]]), { color: o.c2 || '#94a070', opacity: 0.55, seed: seed + 1, bleed: 0.03, layers: 20 });
  const r = rng(seed + 2);
  for (let i = 0; i < 24; i++) { const x = r.range(-60, W + 60), y = r.range(y0 + 20, H + 40), sz = r.range(60, 170); pool(g, x, y, sz, sz * 0.3, r() < 0.5 ? '#5f6b3a' : '#fbe2a0', r.range(0.1, 0.22)); }
  strokes(g, [[-M, y0], [W + M, y0], [W + M, LH], [-M, LH]], { color: '#6f7d4c', count: 1300, len: 9, width: 1.1, alpha: 0.28, seed: seed + 3, dir: () => -Math.PI / 2, curve: 0.4 });
  strokes(g, [[-M, y0], [W + M, y0], [W + M, LH], [-M, LH]], { color: '#e9d79a', count: 450, len: 8, width: 1, alpha: 0.3, seed: seed + 4, dir: () => -Math.PI / 2, curve: 0.4 });
  for (let i = 0; i < 150; i++) { const x = r.range(-80, W + 80), y = r.range(y0 + 10, H + 60); if (clear(x, y)) continue; grass(g, x, y, { seed: seed + 10 + i, h: 16 + (y - y0) * 0.1, n: 6, alpha: 0.55 }); }
  for (let i = 0; i < (o.flowers ?? 55); i++) {
    const x = r.range(-60, W + 60), y = r.range(y0 + 20, H + 40); if (clear(x, y)) continue;
    if (r() < 0.75) flower(g, x, y, { seed: seed + 300 + i, size: 4 + (y - y0) * 0.012, color: r.pick(o.flowerColors || [PAL.pink, '#f1e2c8', '#e7a35a', '#cdb3d6', '#f6f0e0']), stem: 8 + (y - y0) * 0.03 });
    else berries(g, x, y, { seed: seed + 400 + i, size: 3 + (y - y0) * 0.006 });
  }
}
function farLayer(seed, haze = '#eadbb8', hillCol = '#b9b991') {
  return layer((g) => {
    hills(g, 640, 60, hillCol, { seed, opacity: 0.55, bumps: 3 });
    for (let i = 0; i < 18; i++) foliage(g, -60 + i * 120 + noise1(i, seed) * 40, 630 + noise1(i, seed + 3) * 20, 60, 42, { seed: seed * 10 + i, haze: 0.6, hazeColor: haze, blobs: 4, opacity: 0.7, detail: false, leaves: false });
    hills(g, 680, 34, '#a9b07e', { seed: seed + 1, opacity: 0.55, bumps: 5 });
  });
}
function fgPlants(seed, spots) {
  const r = rng(seed), out = [];
  for (const [i, [x, h, big]] of spots.entries()) {
    const y = H + 40;
    out.push({ x, y, ph: r() * 6, s: sprite({ x0: x - h * 1.3, y0: y - h * 1.35, x1: x + h * 1.3, y1: y + 10, w: h * 2.6, h: h * 1.35 + 10 }, 1, (g) => {
      grass(g, x, y, { seed: seed + i, h: h * 0.7, n: 18, width: 4.5, alpha: 0.8, colors: [PAL.moss, PAL.deep, PAL.olive, '#7d8a52'] });
      if (big) fern(g, x - h * 0.3, y, { seed: seed + 20 + i, len: h * 1.15, angle: -1.25, curl: 0.55, color: PAL.deep, alpha: 0.85, leaf: 1.6 });
      plant(g, x, y, { seed: seed + 40 + i, h, n: big ? 7 : 5, under: true, colors: [PAL.moss, '#7f9a6a', PAL.olive, '#62774a'] });
      flower(g, x - h * 0.4, y - h * 0.7, { seed: seed + 80 + i, size: 11, color: i % 2 ? '#f0e0c4' : PAL.pink, stem: h * 0.7 });
    }) });
  }
  return out;
}
function drawFg(g, c, list, t) {
  for (const p of list) { cam(g, c, 1.2); g.translate(p.x, p.y); g.rotate(Math.sin(t * 0.6 + p.ph) * 0.02); g.translate(-p.x, -p.y); drawSprite(g, p.s); }
}
function cloudsFor(seed, cols = ['#fbeedc']) {
  return [[350, 150, 190, 46], [1000, 110, 230, 52], [1650, 170, 190, 44]].map(([x, y, w, h], i) => ({ s: sprite({ x0: x - w, y0: y - h, x1: x + w, y1: y + h, w: 2 * w, h: 2 * h }, 1, (g) => cloud(g, x, y, w, h, { seed: seed + i * 7, color: cols[i % cols.length] }), { granulate: false }) }));
}
// a weeping willow: a stout trunk and long curtains of hanging leaves
function willow(g, x, groundY, seed) {
  const r = rng(seed);
  trunk(g, [[x, groundY], [x - 14, groundY - 160], [x + 10, groundY - 320], [x - 6, groundY - 430]], 120, 70, { seed, under: true });
  for (const [dx, a] of [[-60, -0.9], [50, 0.8], [0, -0.1]]) trunk(g, [[x + dx * 0.2, groundY - 380], [x + dx, groundY - 470], [x + dx * 2, groundY - 520]], 36, 10, { seed: seed + 1 + Math.round(a * 10), under: true });
  // the crown: a soft dome, then long hanging strands
  foliage(g, x, groundY - 540, 330, 130, { seed: seed + 5, colors: ['#8fa252', '#a0b060', '#7a9048', '#b4b866'], blobs: 10, opacity: 0.88 });
  for (let k = 0; k < 70; k++) {
    const sx = x + r.range(-330, 330), sy = groundY - 540 + r.range(-40, 80) + Math.abs(sx - x) * 0.25;
    const L = r.range(180, 380) * (1 - Math.abs(sx - x) / 600);
    const col = r.pick(['#8fa252', '#a6b45e', '#7a9048', '#b8bc6a', '#6e8a44']);
    for (let j = 0; j < L / 14; j++) {
      const yy = sy + j * 14, xx = sx + Math.sin(j * 0.3 + k) * 4 + (sx - x) * j * 0.004;
      g.fillStyle = rgba(col, 0.8); g.beginPath(); g.ellipse(xx, yy, 2.6, 7.5, 0.15 * Math.sign(sx - x), 0, 7); g.fill();
    }
  }
}

// ---------------------------------------------------------------- places
function paintMeadow() {
  const P = {};
  P.sky = layer((g) => { sky(g, '#bcd2dc', '#f1dcb6', '#f5e2b8'); pool(g, 1250, 480, 600, 300, '#fde2a4', 0.5); });
  P.clouds = cloudsFor(30);
  P.far = farLayer(4);
  P.ground = layer((g) => {
    ground(g, 700, 50, (x, y) => y > 790 && y < 960);
    oak(g, 1700, 760, 0.55, { seed: 21, perchX: -420, perchY: 260 });
    // a mossy log the hare can leap over
    trunk(g, [[760, 850], [900, 846], [1040, 852]], 46, 40, { seed: 61, under: true });
    wash(g, ellipse(1040, 852, 16, 22, 20), { color: '#c9a878', opacity: 0.95, seed: 62, under: true });
    for (let k = 0; k < 3; k++) penLine(g, ellipse(1040, 852, 4 + k * 4, 6 + k * 5, 20), { closed: true, w: 1, alpha: 0.5 });
    for (let k = 0; k < 5; k++) foliage(g, 790 + k * 50, 828, 26, 10, { seed: 63 + k, colors: [PAL.moss, '#7f9a5a'], blobs: 3, opacity: 0.85, detail: false });
    // clover patches along the path
    const r = rng(64);
    for (let k = 0; k < 40; k++) { const x = r.range(0, W), y = r.range(900, 1000); g.fillStyle = rgba(r.pick(['#6f8a4a', '#86a05a']), 0.7); for (const a of [0, 2.1, 4.2]) { g.beginPath(); g.ellipse(x + Math.cos(a) * 4, y + Math.sin(a) * 3, 4, 3, a, 0, 7); g.fill(); } }
  });
  P.fg = fgPlants(160, [[-30, 230, 1], [1930, 240, 1]]);
  return P;
}
function paintStart() {
  const P = {};
  P.sky = layer((g) => { sky(g, '#c4d8e0', '#f3e2bc', '#f6e4b8'); pool(g, 600, 420, 700, 300, '#fde6ac', 0.5); });
  P.clouds = cloudsFor(40);
  P.far = farLayer(7);
  P.ground = layer((g) => {
    ground(g, 720, 70, (x, y) => (y > 800 && y < 980) || (x > 1260 && x < 1560 && y < 860));
    // the old oak stump
    const stump = smooth([[1290, 860], [1300, 760], [1340, 744], [1420, 742], [1490, 750], [1520, 770], [1530, 860]]);
    wash(g, stump, { color: '#8a6a4c', opacity: 0.96, seed: 71, under: true });
    shadeEdge(g, stump, { color: '#3e2a1c', alpha: 0.45, width: 40, dx: 16 });
    hatch(g, stump, { color: '#4e3424', count: 120, len: 22, width: 1, alpha: 0.45, seed: 72, dir: () => Math.PI / 2 });
    const top = ellipse(1410, 752, 112, 22, 30);
    wash(g, top, { color: '#d8bc90', opacity: 0.97, seed: 73, under: true });
    for (let k = 1; k < 6; k++) penLine(g, ellipse(1410, 752, k * 19, k * 3.8, 30), { closed: true, w: 1, alpha: 0.4 });
    penLine(g, stump, { closed: true, w: 2.2, alpha: 0.7 });
    for (let k = 0; k < 4; k++) mushroom(g, 1300 + k * 30, 860, { seed: 74 + k, s: 0.6 + (k % 2) * 0.3 });
    foliage(g, 1500, 850, 50, 22, { seed: 78, colors: [PAL.moss, '#7f9a5a'], blobs: 3, opacity: 0.85, detail: false });
    // a rustic fence rail where the little birds sit
    for (const x of [180, 420, 660]) { trunk(g, [[x, 860], [x, 720]], 16, 14, { seed: 80 + x, under: true }); }
    trunk(g, [[150, 740], [420, 736], [690, 742]], 12, 12, { seed: 84, under: true });
    trunk(g, [[150, 790], [420, 786], [690, 792]], 12, 12, { seed: 85, under: true });
    // the starting line: a row of pebbles across the path
    const r = rng(86);
    for (let k = 0; k < 14; k++) { const y = 880 + k * 9, x = 760 + r.gauss(0, 3) + k * 2; const st = ellipse(x, y, r.range(8, 13), r.range(5, 8), 14); wash(g, st, { color: r.pick(['#d8d0c0', '#c8bea8', '#e6dccb']), opacity: 0.95, seed: 87 + k, under: true, layers: 8 }); penLine(g, st, { closed: true, w: 1, alpha: 0.5 }); }
  });
  P.fg = fgPlants(190, [[-30, 230, 1], [1950, 240, 1]]);
  P.owlAt = [1410, 752]; P.fence = [[260, 736], [380, 734], [520, 736], [620, 738]];
  return P;
}
function paintPath() {
  const P = {};
  P.sky = layer((g) => { sky(g, '#c0d6de', '#f2dfba', '#f4e0b4'); pool(g, 900, 420, 700, 300, '#fde2a4', 0.45); });
  P.clouds = cloudsFor(50);
  P.far = farLayer(9);
  P.ground = layer((g) => {
    ground(g, 700, 90, (x, y) => (x > 140 && x < 460) || (x > 1200 && x < 1600 && y < 920), { flowers: 30 });
    // a little stream winding across, with stepping stones
    const bank = smooth([[200, 690], [250, 760], [230, 860], [300, 980], [280, LH], [470, LH], [460, 980], [400, 860], [420, 760], [360, 690]]);
    wash(g, bank, { color: '#8fb6c4', opacity: 0.95, seed: 91, under: true });
    glaze(g, bank, 330, 820, 120, 200, '#d6ecf2', 0.6);
    for (let k = 0; k < 18; k++) { const y = 720 + k * 20; penLine(g, [[260 + Math.sin(k) * 40, y], [300 + Math.sin(k) * 40, y + 2]], { color: '#f4fbfd', w: 1.6, alpha: 0.7 }); }
    penLine(g, bank, { closed: true, w: 1.6, alpha: 0.5 });
    for (const [x, y] of [[300, 905], [360, 915], [420, 908]]) { const st = ellipse(x, y, 26, 12, 16); wash(g, st, { color: '#b8b0a0', opacity: 0.97, seed: x, under: true, layers: 10 }); glaze(g, st, x - 6, y - 4, 14, 5, '#e8e2d6', 0.6); penLine(g, st, { closed: true, w: 1.2, alpha: 0.5 }); }
    for (let k = 0; k < 8; k++) grass(g, 200 + k * 6, 700 + k * 40, { seed: 92 + k, h: 50, n: 6, colors: ['#6f8a4a', '#8a9a5a'] }); // reeds by the stream
    // a field of daisies
    const r = rng(93);
    for (let k = 0; k < 120; k++) { const x = r.range(520, 1180), y = r.range(760, 1060); flower(g, x, y, { seed: 94 + k, size: 4 + (y - 700) * 0.014, color: '#f8f4ea', stem: 8 + (y - 700) * 0.03 }); }
    // the hawthorn bush, white with blossom, its cool shade beneath
    pool(g, 1400, 880, 320, 60, '#4a5a32', 0.35);
    for (const [x, y, rx, ry, sd] of [[1290, 760, 150, 120, 1], [1470, 720, 180, 150, 2], [1610, 780, 140, 110, 3], [1400, 640, 150, 110, 4]])
      foliage(g, x, y, rx, ry, { seed: 1000 + sd, colors: ['#5f7a3e', '#6d8744', '#7a9048', '#58703a'], blobs: 9, opacity: 0.9 });
    for (let k = 0; k < 160; k++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); const x = 1450 + Math.cos(a) * 230 * d, y = 720 + Math.sin(a) * 150 * d; flower(g, x, y, { seed: 1100 + k, size: 4, color: r.pick(['#fbf6ee', '#f6e8ea', '#fff']), stem: 0 }); }
  });
  P.fg = fgPlants(220, [[-30, 220, 1], [1950, 230, 1]]);
  P.napAt = [1360, 880];
  return P;
}
function paintPond() {
  const P = {};
  P.sky = layer((g) => { sky(g, '#c4d6dc', '#f2dfba', '#f4e0b4'); pool(g, 1300, 420, 700, 320, '#fde2a4', 0.45); });
  P.clouds = cloudsFor(60);
  P.far = farLayer(11);
  P.ground = layer((g) => {
    ground(g, 700, 110, (x, y) => (x > 1150 && y < 900) || (x > 900 && x < 1300 && y > 820 && y < 960), { flowers: 40 });
    // the pond
    const pond = smooth([[1180, 760], [1400, 730], [1700, 735], [1960, 760], [2020, 840], [1800, 880], [1500, 880], [1250, 850]]);
    wash(g, pond, { color: '#8eb2c0', opacity: 0.95, seed: 111, under: true });
    glaze(g, pond, 1550, 780, 300, 50, '#e2f0f4', 0.6);
    for (let k = 0; k < 10; k++) penLine(g, [[1300 + k * 60, 800 + (k % 3) * 18], [1340 + k * 60, 800 + (k % 3) * 18]], { color: '#f4fbfd', w: 1.6, alpha: 0.7 });
    penLine(g, pond, { closed: true, w: 1.6, alpha: 0.5 });
    for (const [x, y] of [[1380, 800], [1620, 840], [1780, 790]]) { g.fillStyle = rgba('#6f8a4a', 0.9); g.beginPath(); g.ellipse(x, y, 24, 9, 0, 0.3, Math.PI * 2); g.lineTo(x, y); g.fill(); flower(g, x + 6, y - 4, { seed: x, size: 7, color: '#f2c4d0', stem: 0 }); }
    for (let k = 0; k < 14; k++) grass(g, 1200 + k * 60 + (k % 2) * 20, 760 + (k % 3) * 40, { seed: 112 + k, h: 70, n: 6, width: 3, colors: ['#6f8a4a', '#8a9a5a', '#a0a066'] }); // reeds
    willow(g, 1460, 740, 120);
  });
  // the finishing line: two sticks and a garland of flowers
  P.finish = layer((g) => {
    for (const x of [1060, 1200]) trunk(g, [[x, 960], [x, 800]], 12, 9, { seed: 130 + x, under: true });
    const pts = []; for (let k = 0; k <= 20; k++) { const u = k / 20; pts.push([lerp(1060, 1200, u), 810 + Math.sin(u * Math.PI) * 26]); }
    penLine(g, pts, { color: '#6f8a4a', w: 3, alpha: 0.9 });
    for (let k = 1; k < 20; k += 2) flower(g, pts[k][0], pts[k][1] + 3, { seed: 140 + k, size: 7, color: k % 4 === 1 ? PAL.pink : '#f8f0dc', stem: 0 });
  });
  P.fg = fgPlants(240, [[-30, 230, 1], [700, 120, 0]]);
  P.owlAt = [1680, 900]; P.birdsAt = [[1060, 806], [1200, 806], [1560, 905]];
  return P;
}
function drawPlace(g, t, c0, P, o = {}) {
  // frame a little lower and closer, so the characters sit above the captions
  const c = { z: c0.z * 1.12, x: c0.x, y: c0.y + 105 };
  S.paperBg(g);
  drawLayer(g, c, o.skyOverride || P.sky, 0.15);
  const night = o.night || 0;
  if (night > 0) { cam(g, c, 0.15); g.globalAlpha = night; g.drawImage(NIGHT_SKY, -M, -MY); g.globalAlpha = 1; }
  for (const cl of P.clouds) { cam(g, c, 0.2); g.translate(t * 3.5, 0); drawSprite(g, cl.s, 0.9 * (1 - night)); }
  drawLayer(g, c, P.far, 0.35);
  drawLayer(g, c, P.ground, 1);
  if (o.finish && P.finish) drawLayer(g, c, P.finish, 1);
  cam(g, c, 1);
  if (o.actors) o.actors(g);
  cam(g, c, 1);
  if (night < 1 && !o.sunset) { g.save(); g.globalAlpha = 1 - night; motes(g, t, 26, 11); g.restore(); }
  drawFg(g, c, P.fg, t);
  sunlight(g, (1 - night), o.sunset || 0);
  if (o.sunset) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(255,170,150,${0.45 * o.sunset})`; g.fillRect(0, 0, W, H); g.restore(); }
  nightGrade(g, night);
  if (night > 0) { cam(g, c, 0.15); stars(g, t, night, o.starsFrom ?? -99); moon(g, 420, 160, 32, night); cam(g, c, 1); fireflies(g, t, 30, { x0: 0, x1: W, y0: 400, y1: 1000 }, 41, night); }
  if (o.after) { cam(g, c, 1); o.after(g); }
}

// ---------------------------------------------------------------- actors
function HR(g, x, y, sc, flip, st, pose = "sit") {
  sc *= 1.22;
  g.save(); g.translate(x, y); g.scale(sc * flip, sc);
  if (pose === 'run') hare.drawRun(g, st); else if (pose === 'sleep') hare.drawSleep(g, st); else hare.drawSit(g, st);
  g.restore();
}
function T(g, x, y, sc, flip, st) { sc *= 1.22; g.save(); g.translate(x, y); g.scale(sc * flip, sc); tort.draw(g, st); g.restore(); }
function dust(g, t, x, y, t0, dir = -1) {
  if (t < t0 || t > t0 + 1.2) return;
  const k = (t - t0) / 1.2;
  g.save();
  for (let i = 0; i < 6; i++) { g.globalAlpha = (1 - k) * 0.5; pool(g, x + dir * (20 + i * 22) * k * 2, y - 10 - i * 4 * k, 26 + 30 * k, 16 + 14 * k, '#e8dcc0', 0.8); }
  g.restore();
}
function bees(g, t, cx, cy, n = 4) {
  for (let i = 0; i < n; i++) {
    const a = t * (1.3 + i * 0.2) + i * 1.7, x = cx + Math.cos(a) * (80 + i * 18), y = cy + Math.sin(a * 1.6) * 30 - i * 8;
    g.save(); g.fillStyle = '#e8b840'; g.beginPath(); g.ellipse(x, y, 6, 4.5, 0, 0, 7); g.fill();
    g.strokeStyle = '#3a2a1a'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x - 1, y - 4); g.lineTo(x - 1, y + 4); g.moveTo(x + 2, y - 4); g.lineTo(x + 2, y + 4); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(x - 1, y - 6, 3, 4 + Math.sin(t * 40) * 1.5, -0.4, 0, 7); g.fill();
    g.restore();
  }
}

// ---- title
function paintTitle() {
  return layer((g) => {
    wash(g, smooth([[300, 840], [960, 818], [1620, 842], [1620, 870], [300, 874]]), { color: '#a9ae7f', opacity: 0.4, seed: 7, edge: 0 });
    for (let i = 0; i < 6; i++) fern(g, 330 + i * 30, 850, { seed: 810 + i, len: 130 - i * 6, angle: -2.0 + i * 0.22, curl: 0.5, color: i % 2 ? PAL.moss : PAL.olive });
    for (let i = 0; i < 9; i++) flower(g, 1300 + i * 30, 840 - (i % 2) * 8, { seed: 820 + i, size: 9, color: i % 2 ? '#f8f4ea' : PAL.pink, stem: 26 });
  });
}
function drawTitle(g, t) {
  S.paperBg(g);
  g.fillStyle = 'rgba(250,214,160,0.2)'; g.fillRect(0, 0, W, H);
  const c = { z: 1 + t * 0.004, x: 0, y: 0 };
  drawLayer(g, c, TITLE, 1);
  cam(g, c, 1);
  g.save(); g.textAlign = 'center'; g.fillStyle = INK;
  const a1 = span(t, 0.6, 2.4), a2 = span(t, 1.4, 3.2), a3 = span(t, 2.4, 4.0);
  g.globalAlpha = a1 * 0.9; g.font = '140px "Fell"'; g.fillText('The Tortoise', 960, 380 + (1 - a1) * 10);
  g.globalAlpha = a2 * 0.9; g.font = 'italic 120px "Fell"'; g.fillText('& the Hare', 960, 520 + (1 - a2) * 10);
  g.globalAlpha = a3 * 0.75; g.font = 'italic 40px "Fell"'; g.fillText('an Aesop’s fable, for sleepy little ones', 960, 610);
  g.restore();
  T(g, 760, 850, 0.55, 1, { breath: Math.sin(t * 1.2), smile: 0.6, eyes: 1 - S.blink(t, 3) });
  HR(g, 1180, 850, 0.6, -1, { breath: Math.sin(t * 1.4), smile: 0.6, eyes: 1 - S.blink(t, 5), earWiggle: Math.sin(t * 2) * 0.5 });
}

// ---- scene 1: the meadow
function drawMeadow(g, t) {
  const n02 = line('n02'), h01 = line('h01'), n03 = line('n03'), h02 = line('h02'), t01 = line('t01'), t02 = line('t02'), h03 = line('h03');
  const k = clamp((t - 6) / (h03.end - 6));
  const c = { z: 1.02 + 0.08 * ease(span(t, n03.start, t01.start)), x: 60 * ease(span(t, n03.start, t01.start)), y: 30 * ease(span(t, n03.start, t01.start)) };
  drawPlace(g, t, c, MEADOW, { actors: (g) => {
    const GY = 880;
    // ---- the hare: sitting, then zooming about, then stopping to chat
    const dash0 = n02.start - 0.2, dash1 = h01.start + 0.6;
    let hp = 'sit', hx = 1240, hy = GY, flip = 1, run = 0, hst = {};
    if (t >= dash0 && t < dash1) {
      const u = (t - dash0) / (dash1 - dash0), laps = 2.15;
      const xx = ((u * laps * 2600) % 2600) - 300;
      hx = xx; hp = 'run'; run = t * 2.6;
      const over = Math.max(0, 1 - Math.abs(hx - 900) / 160);   // leaping over the log
      hy = GY - Math.sin(over * Math.PI / 2) * 90 * over;
      if (u > 0.88) { hx = lerp(xx, 1240, span(u, 0.88, 1)); }
    }
    const turnT = n03.start + 2.5;
    if (t >= dash1 && t < turnT) flip = 1;
    if (t >= turnT) flip = -1;
    const excited = S.mood(t, 'h01', 0.2, 0.6), tease = Math.max(S.mood(t, 'h02'), S.mood(t, 'h03') * 0.6), laugh = S.mood(t, 'h03', 0.1, 0.3) * (t < h03.start + 2.2 ? 1 : 0);
    const listen = Math.max(S.mood(t, 't01'), S.mood(t, 't02'));
    hst = { t, mouth: Math.max(say('h01', t), say('h02', t), say('h03', t)) * 0.9, smile: 0.5 + excited * 0.4 + tease * 0.3,
      eyes: laugh > 0.4 ? 0 : 1 - S.blink(t, 5), happy: laugh > 0.4, sly: tease * 0.5, browUp: Math.max(excited, listen * 0.6, S.mood(t, 'h03', 0.2, 0) * (t < h03.start + 1 ? 1 : 0)),
      earWiggle: excited * Math.sin(t * 9), breath: Math.sin(t * 1.6), headTilt: listen * 0.06 * Math.sin(t * 0.8), pawWave: excited * (0.5 + 0.5 * Math.sin(t * 6)) * 0.7 };
    if (hp === 'run') HR(g, hx, hy, 0.8, 1, { ...hst, run }, 'run');
    else HR(g, hx, GY - Math.abs(Math.sin(t * 9)) * 10 * excited, 0.8, flip, hst, 'sit');
    // ---- the tortoise: walks slowly in from the left during n03
    const inT = n03.start + 0.5, stopT = h02.start + 3;
    const tx = lerp(-260, 520, clamp((t - inT) / (stopT - inT)));
    const walking = t > inT && t < stopT;
    const warm = Math.max(S.mood(t, 't01'), S.mood(t, 't02'));
    T(g, tx, GY + 14, 0.8, 1, { walk: walking ? (t - inT) * 0.42 : null, breath: Math.sin(t * 1.1), smile: 0.5 + warm * 0.3,
      mouth: Math.max(say('t01', t), say('t02', t)) * 0.85, eyes: 1 - S.blink(t, 8), browUp: S.mood(t, 'h02') * 0.6, neckLift: warm * 0.08 });
  } });
}

// ---- scene 2: the start
function drawStart(g, t) {
  const n04 = line('n04'), n05 = line('n05'), n06 = line('n06'), n07 = line('n07');
  const c = { z: 1.0 + 0.05 * span(t, n04.start, n07.end), x: 20 * span(t, n04.start, n07.end), y: 0 };
  drawPlace(g, t, c, START, { actors: (g) => {
    // little birds arriving on the fence, then the owl
    START.fence.forEach(([x, y], i) => {
      const arrive = n04.start + 1.2 + i * 0.7, a = clamp((t - arrive) / 0.8);
      if (a <= 0) return;
      g.save(); g.translate(lerp(x - 300, x, ease(a)), y - Math.sin(a * Math.PI) * 80 * (1 - a)); g.scale(0.9 * (i % 2 ? -1 : 1), 0.9);
      birds[i % birds.length].draw(g, { t, flap: a < 1 ? 1 : 0, hop: a >= 1 ? Math.abs(Math.sin(t * 3 + i)) * 4 : 0, blink: S.blink(t, 10 + i) });
      g.restore();
    });
    const owlIn = clamp((t - (n04.end - 1.6)) / 0.6);
    const wingUp = span(t, n05.start + 0.4, n05.start + 1.0) * (1 - span(t, n05.end - 0.6, n05.end - 0.3));
    if (owlIn > 0) { g.save(); g.globalAlpha = owlIn; g.translate(START.owlAt[0], START.owlAt[1]); g.scale(0.85, 0.85); owl.draw(g, { wing: wingUp, blink: S.blink(t, 21), headTilt: Math.sin(t * 0.6) * 0.05 }); g.restore(); }
    // the racers at the line
    const go = n05.end - 0.35, GY = 930;
    const ready = span(t, n05.start, n05.start + 1.2);
    if (t < go + 0.15) HR(g, 900, GY - 10, 0.75, 1, { t, smile: 0.6, eyes: 1 - S.blink(t, 5), earWiggle: ready * Math.sin(t * 7) * 0.6, breath: Math.sin(t * 2) }, 'sit');
    else { const u = t - go - 0.15; HR(g, 900 + u * u * 900 + u * 500, GY - 10, 0.75, 1, { t, run: t * 3.2, smile: 0.8 }, 'run'); dust(g, t, 900, GY, go + 0.15); }
    // the tortoise: one slow step... and another... and another
    const step0 = n07.start + 1.0, steps = clamp((t - step0) / 7) * 3;
    const s = Math.floor(steps), f = steps - s, moving = t > step0 && f < 0.7;
    T(g, 520 + (s + ease(Math.min(1, f / 0.7))) * 36, GY + 22, 0.72, 1, { walk: moving ? f / 0.7 * 0.5 + s * 0.5 : null, smile: 0.6, eyes: 1 - S.blink(t, 8), breath: Math.sin(t * 1.1), browUp: S.mood(t, 'n06') * 0.5 });
  } });
}

// ---- scenes 3 & 4: the path (the nap; slow and steady)
function drawPath(g, t) {
  const n08 = line('n08'), h04 = line('h04'), n09 = line('n09'), n10 = line('n10'), t03 = line('t03'), n11 = line('n11');
  const tIn = n10.start - 0.5, tEnd = n11.end + 1.2;
  const tx = lerp(-180, 1720, clamp((t - tIn) / (tEnd - tIn)));
  const follow = span(t, n10.start - 1, n10.start + 1);
  const c = { z: lerp(1.0, 1.22, follow), x: lerp(0, clamp(tx - 960, -200, 420) * 0.85, follow), y: lerp(0, 60, follow) };
  drawPlace(g, t, c, PATHP, { actors: (g) => {
    const [nx, ny] = PATHP.napAt;
    // the hare runs in, stops, looks back, yawns, and lies down for a nap
    const arrive = n08.start + 2.2, lieT = n09.start + 2.6;
    const yawn = span(t, h04.start + 3.4, h04.start + 4.2) * (1 - span(t, h04.start + 5.4, h04.start + 6.2));
    if (t < arrive) { const u = clamp((t - (n08.start - 0.4)) / 2.6); HR(g, lerp(-250, nx - 40, 1 - (1 - u) ** 2), ny, 0.72, 1, { t, run: t * 3 }, 'run'); }
    else if (t < lieT) {
      const lookBack = span(t, n08.start + 3.4, n08.start + 4.2);
      HR(g, nx - 40, ny, 0.72, lookBack > 0.5 ? -1 : 1, { t, mouth: Math.max(say('h04', t) * 0.85, yawn * 0.95), smile: 0.6 * (1 - yawn), sly: S.mood(t, 'h04') * 0.5,
        eyes: yawn > 0.5 ? 0 : 1 - S.blink(t, 5) - 0.3 * span(t, n09.start, lieT), browUp: S.mood(t, 'n08', 0, 0) * 0.4, breath: Math.sin(t * 1.6) }, 'sit');
    } else {
      HR(g, nx, ny, 0.72, 1, { t, eyes: 0, breath: Math.sin(t * 1.0), smile: 0.6 }, 'sleep');
      zzz(g, t, nx + 70, ny - 120, lieT + 1.5, tEnd + 5);
    }
    bees(g, t, nx + 60, ny - 220, 4);
    // the tortoise: step, by step, by step
    if (t > tIn) {
      const onStone = tx > 230 && tx < 470 ? -4 : 0;
      T(g, tx, 935 + onStone, 0.7, 1, { walk: (t - tIn) * 0.45, smile: 0.55 + S.mood(t, 't03') * 0.2, mouth: say('t03', t) * 0.8, eyes: 1 - S.blink(t, 8), breath: Math.sin(t * 1.1),
        neckLift: S.mood(t, 't03') * 0.06, headTilt: tx > nx - 200 && tx < nx + 140 ? -0.1 : 0 });
    }
  } });
}

// ---- scene 5a: the hare wakes at sunset
function drawWake(g, t) {
  const n12 = line('n12'), h05 = line('h05');
  const c = { z: 1.25 + 0.15 * span(t, n12.start, h05.end), x: 300, y: 100 };
  drawPlace(g, t, c, PATHP, { sunset: 1, skyOverride: SUNSET_SKY, actors: (g) => {
    const [nx, ny] = PATHP.napAt;
    const wake = n12.start + 1.4, sit = n12.start + 3.2, look = n12.start + 5.5;
    if (t < sit) HR(g, nx, ny, 0.72, 1, { t, eyes: span(t, wake, wake + 1.2) * 0.7, breath: Math.sin(t), smile: 0.4 }, 'sleep');
    else {
      const panic = S.mood(t, 'h05', 0.3, 2);
      HR(g, nx - 20, ny - Math.abs(Math.sin(t * 10)) * 12 * panic, 0.72, 1, { t, eyes: 1 - S.blink(t, 5), browUp: Math.max(span(t, look, look + 0.5), panic), mouth: say('h05', t) * 0.95,
        smile: 0.4 - panic * 0.5, earsBack: 0, earWiggle: panic * Math.sin(t * 14), headTilt: -0.05 * span(t, look, look + 0.5), pawWave: 0 }, 'sit');
    }
    bees(g, t, nx + 60, ny - 220, 2);
  } });
}

// ---- scene 5b & 6: the finish line by the willow, and making friends
function drawFinish(g, t) {
  const n13 = line('n13'), n14 = line('n14');
  const c = { z: 1.05, x: 60, y: 20 };
  const cross = n14.start + 3.2;
  drawPlace(g, t, c, POND, { sunset: 1, skyOverride: SUNSET_SKY, finish: true, actors: (g) => {
    const GY = 955;
    const cheer = span(t, cross, cross + 0.4);
    POND.birdsAt.forEach(([x, y], i) => {
      g.save(); g.translate(x, y); g.scale(0.85 * (x > 1100 ? -1 : 1), 0.85);
      birds[i % birds.length].draw(g, { t, hop: cheer * Math.abs(Math.sin(t * 7 + i)) * 26, flap: cheer, sing: cheer && Math.sin(t * 6 + i) > 0, blink: S.blink(t, 30 + i), happy: cheer > 0.5 });
      g.restore();
    });
    g.save(); g.translate(POND.owlAt[0], POND.owlAt[1]); g.scale(0.7, 0.7); owl.draw(g, { wing: cheer * (0.6 + 0.4 * Math.sin(t * 8)), hop: cheer * Math.abs(Math.sin(t * 5)) * 10, happy: cheer > 0.5, blink: S.blink(t, 33) }); g.restore();
    // the tortoise plods the last few steps across the line
    const tx = lerp(830, 1250, clamp((t - (n13.start - 1)) / (cross + 2.5 - (n13.start - 1))));
    T(g, tx, GY + 10, 0.72, 1, { walk: t < cross + 2.5 ? t * 0.45 : null, smile: 0.6 + cheer * 0.3, happy: cheer > 0.5 && t < cross + 3, eyes: 1 - S.blink(t, 8), neckLift: cheer * 0.12 });
    // the hare races in from far behind, too late
    const hx = lerp(-300, 760, clamp((t - (n13.start + 0.4)) / (cross + 1.2 - (n13.start + 0.4))) ** 0.8);
    if (hx < 740) HR(g, hx, GY - 4, 0.72, 1, { t, run: t * 3.4, browUp: 1, mouth: 0.3, smile: -0.2 }, 'run');
    else HR(g, 760, GY - 4, 0.72, 1, { t, eyes: 1 - S.blink(t, 5), earsBack: 0.6, browUp: 0.8, mouth: 0.15, smile: 0, breath: Math.sin(t * 6) * 2 }, 'sit');
    if (hx >= 740) dust(g, t, 760, GY, cross + 1.2, -1);
  } });
}
function drawFriends(g, t) {
  const h06 = line('h06'), t04 = line('t04'), n15 = line('n15');
  const k = clamp((t - h06.start + 1) / (n15.end - h06.start + 3));
  const c = { z: 1.45 + 0.05 * ease(k), x: 80, y: 170 };
  drawPlace(g, t, c, POND, { sunset: 1, skyOverride: SUNSET_SKY, finish: true, actors: (g) => {
    const GY = 955;
    const sheep = S.mood(t, 'h06', 0.3, 0.8), warm = S.mood(t, 't04', 0.3, 1.5), joy = span(t, n15.start + 1, n15.start + 2);
    HR(g, 860, GY - 4, 0.72, 1, { t, mouth: say('h06', t) * 0.85, earsBack: sheep * 0.7, eyes: (1 - S.blink(t, 5)) * (1 - 0.35 * sheep), smile: 0.3 + joy * 0.5 + warm * 0.3 - sheep * 0.2,
      browUp: Math.max(sheep * 0.5, warm * 0.4), headTilt: sheep * 0.12, happy: joy > 0.5 && Math.sin(t * 0.7) > 0.4, breath: Math.sin(t * 1.5) }, 'sit');
    T(g, 1260, GY + 10, 0.72, -1, { mouth: say('t04', t) * 0.85, smile: 0.6 + warm * 0.3 + joy * 0.2, eyes: (1 - S.blink(t, 8)) * (1 - 0.25 * warm), neckLift: warm * 0.1, headTilt: warm * 0.05, breath: Math.sin(t * 1.1),
      happy: joy > 0.5 && Math.sin(t * 0.6 + 1) > 0.5 });
  } });
}

// ---- scene 7: goodnight by the pond
function drawNight(g, t) {
  const n16 = line('n16'), n17 = line('n17'), n18 = line('n18'), n19 = line('n19');
  const k = clamp((t - n16.start) / (S.TL.duration - n16.start));
  const c = { z: 1.25 - 0.1 * ease(k), x: 60 - 30 * ease(k), y: 110 - 60 * ease(k) };
  const night = 0.55 + 0.45 * span(t, n16.start - 1, n17.start);
  drawPlace(g, t, c, POND, { night, starsFrom: n17.start, actors: (g) => {
    const GY = 955;
    const curl = span(t, n17.start + 0.5, n17.start + 2.5), tuck = span(t, n17.start + 3, n17.start + 5);
    if (curl < 1) { g.save(); g.globalAlpha = 1 - curl; HR(g, 860, GY - 4, 0.72, 1, { t, eyes: 1 - S.blink(t, 5), smile: 0.7, headTilt: -0.15, breath: Math.sin(t * 1.4) }, 'sit'); g.restore(); }
    if (curl > 0) { g.save(); g.globalAlpha = curl; HR(g, 840, GY + 6, 0.72, 1, { t, eyes: 0, smile: 0.7, breath: Math.sin(t * 0.9) }, 'sleep'); g.restore(); }
    T(g, 1240, GY + 10, 0.72, -1, { out: 1 - tuck, legsIn: tuck, eyes: 1 - span(t, n17.start + 2, n17.start + 3.2), smile: 0.7, breath: Math.sin(t * 0.8), neckLift: -0.05 });
    zzz(g, t, 900, 860, n17.start + 3, S.TL.duration + 10);
  }, after: (g) => {
    const a = span(t, n19.end + 2.5, n19.end + 5) * (1 - span(t, S.TL.duration - 12, S.TL.duration - 7));
    if (a > 0) {
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.textAlign = 'center';
      g.fillStyle = `rgba(250,238,210,${0.85 * a})`; g.font = 'italic 76px "Fell"'; g.fillText('Sweet dreams', 960, 230);
      g.font = 'italic 34px "Fell"'; g.fillStyle = `rgba(250,238,210,${0.6 * a})`; g.fillText('the end', 960, 285);
      g.restore();
    }
  } });
  // the moon's reflection on the pond
  cam(g, { z: c.z * 1.12, x: c.x, y: c.y + 105 }, 1); g.save(); g.globalCompositeOperation = 'lighter'; pool(g, 1560, 800, 60, 14, '#f4e6c0', 0.35 * night); g.restore();
}

// ---------------------------------------------------------------- entry points
let SCENES;
window.FABLE = {
  async setup(timeline) {
    S = makeStage(timeline);
    await S.setup(document.getElementById('c'));
    hare = makeHare(1.4); tort = makeTortoise(1.4); owl = makeOwl(1.4);
    birds = [makeSongbird(1.6, 11, { color: '#8a7052', breast: '#d86a3e' }), makeSongbird(1.6, 12, { color: '#6a8aa8', breast: '#e8d06a' }), makeSongbird(1.6, 13, { color: '#9a8a6a', breast: '#e8dcc8' })];
    TITLE = paintTitle();
    MEADOW = paintMeadow(); START = paintStart(); PATHP = paintPath(); POND = paintPond();
    NIGHT_SKY = layer((g) => {
      const grd = g.createLinearGradient(0, -MY, 0, 760);
      grd.addColorStop(0, '#5d6aa8'); grd.addColorStop(0.7, '#8c8fbf'); grd.addColorStop(1, '#b7a9c6');
      g.fillStyle = grd; g.fillRect(-M, -MY, LW, LH);
    });
    SUNSET_SKY = layer((g) => {
      const grd = g.createLinearGradient(0, -MY, 0, 800);
      grd.addColorStop(0, '#b8a9d2'); grd.addColorStop(0.35, '#e9b9c8'); grd.addColorStop(0.65, '#f6c9bd'); grd.addColorStop(1, '#fadcb4');
      g.fillStyle = grd; g.fillRect(-M, -MY, LW, LH);
      pool(g, 1500, 600, 520, 260, '#fff0c8', 0.6);
    });
    SCENES = [
      [0, drawTitle], [5.4, drawMeadow], [line('n04').start - 1.2, drawStart],
      [line('n08').start - 1.0, drawPath], [line('n12').start - 1.0, drawWake],
      [line('n13').start - 0.6, drawFinish], [line('h06').start - 1.2, drawFriends], [line('n16').start - 1.2, drawNight],
    ];
  },
  frame(t) { S.frame(t, SCENES); },
};
