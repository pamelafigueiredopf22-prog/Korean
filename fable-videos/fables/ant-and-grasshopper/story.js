// The Ant and the Grasshopper: scenes, staging and timing. A tiny world: giant grass, flowers and seeds.
import { W, H, rng, canvas, wash, pool, strokes, ellipse, smooth, sprite, drawSprite, bbox, noise1, rgba, shade, tint, mix,
  clamp, lerp, ease, span, glaze, shadeEdge, penLine, hatch, path, ribbon } from '../../engine/watercolor.js';
import { PAL, foliage, trunk, grass, flower, berries, mushroom, fern, cloud, leaf, plant } from '../../engine/scenery.js';
import { M, MY, LW, LH, INK, layer, cam, drawLayer, fireflies, motes, nightGrade, sunlight, stars, moon, zzz, makeStage } from '../../engine/stage.js';
import { makeGrasshopper, makeAnt, makeGrain } from '../../engine/characters/insects.js';

let S, hop, ant, GRAIN, SEED, SEASONS, DOOR, BURROW, TITLE;
const line = (id) => S.line(id);
const say = (id, t) => S.talking(id, t);
const GROUND = 880, LEDGE = [1290, 600];   // the path, and the big leaf the grasshopper plays on
const DOOR_AT = [330, 880];

// ---------------------------------------------------------------- the tiny meadow, in three seasons
const SEASON = {
  summer: { sky: ['#bcd2dc', '#f1dcb6', '#f5e2b8'], grass: ['#7f9a4a', '#8fa252', '#6f8a40', '#a0b05a'], soil: '#b89a6a', flowers: ['#f2c4d0', '#f8f0dc', '#e8a04a'], haze: '#eadbb8', snow: 0 },
  autumn: { sky: ['#c8c0b8', '#e8cfa8', '#f0d8b0'], grass: ['#b8903e', '#a8783a', '#c8a050', '#8a7a3a'], soil: '#a88458', flowers: ['#d88a4a', '#c86a3a', '#e8c070'], haze: '#e6cfae', snow: 0 },
  winter: { sky: ['#c8d0dc', '#dfe3ea', '#eef0f2'], grass: ['#8a9078', '#9a9a84', '#7a806c', '#a4a690'], soil: '#a8a49a', flowers: ['#e8e4dc', '#d8d4cc', '#c8c4bc'], haze: '#e4e8ee', snow: 1 },
};
function blade(g, x, y, h, lean, w, col, snow) {
  const pts = [[x, y], [x + lean * h * 0.3, y - h * 0.5], [x + lean * h, y - h]];
  const sh = ribbon(pts, w, 1.5);
  wash(g, sh, { color: col, opacity: 0.92, seed: Math.round(x * 3 + h), under: true, layers: 12, bleed: 0.015 });
  shadeEdge(g, sh, { color: '#2e3a1c', alpha: 0.3, width: w * 0.6, dx: w * 0.3 });
  penLine(g, smooth(pts, false), { w: 1, alpha: 0.35, color: '#3a4a22' });
  if (snow) { const s2 = ribbon([[pts[0][0] + lean * h * 0.55, y - h * 0.55], [pts[2][0], pts[2][1] + 2]], w * 0.7, 1); wash(g, s2, { color: '#fbfcfd', opacity: 0.9, seed: Math.round(x), layers: 8 }); }
}
function paintSeason(name) {
  const C = SEASON[name], P = {};
  P.sky = layer((g) => {
    const grd = g.createLinearGradient(0, -MY, 0, 820); grd.addColorStop(0, C.sky[0]); grd.addColorStop(0.6, C.sky[1]); grd.addColorStop(1, C.sky[2]);
    g.fillStyle = grd; g.fillRect(-M, -MY, LW, LH);
    if (!C.snow) pool(g, 1300, 420, 600, 300, name === 'summer' ? '#fde2a4' : '#f6d2a0', 0.45);
  });
  // far: huge soft-focus flowers and grass, like looking through a tiny window
  const soft = layer((g) => {
    const r = rng(11);
    for (let i = 0; i < 40; i++) blade(g, r.range(-80, W + 80), 760, r.range(300, 700), r.gauss(0, 0.25), r.range(20, 34), mix(r.pick(C.grass), C.haze, 0.45), C.snow);
    for (const [x, y, s] of [[300, 320, 1.4], [820, 260, 1.1], [1600, 300, 1.5]]) {
      const col = mix(r.pick(C.flowers), C.haze, 0.3);
      for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; wash(g, ellipse(x + Math.cos(a) * 60 * s, y + Math.sin(a) * 60 * s, 52 * s, 26 * s, 20, a), { color: col, opacity: 0.7, seed: x + k, layers: 10 }); }
      wash(g, ellipse(x, y, 34 * s, 34 * s, 20), { color: C.snow ? '#d8d4cc' : '#e8b040', opacity: 0.8, seed: x + 9 });
      blade(g, x, 800, 800 - y, 0, 18, mix('#6f8a40', C.haze, 0.4), 0);
    }
  });
  P.far = canvas(LW, LH); { const g = P.far.getContext('2d'); g.filter = 'blur(9px)'; g.drawImage(soft, 0, 0); }
  P.ground = layer((g) => {
    const r = rng(21);
    // the soil path, with pebbles as big as boulders
    wash(g, smooth([[-M - 50, 820], [600, 800], [1300, 830], [W + M + 50, 810], [W + M + 50, LH], [-M - 50, LH]]), { color: C.soil, opacity: 0.95, seed: 22, bleed: 0.02 });
    strokes(g, [[-M, 820], [W + M, 820], [W + M, LH], [-M, LH]], { color: shade(C.soil, 0.35), count: 900, len: 5, width: 1.5, alpha: 0.35, seed: 23, dir: () => r() * 3 });
    for (const [x, y, rx, ry] of [[700, 990, 60, 34], [1600, 980, 80, 40], [1100, 1030, 46, 26], [40, 1000, 70, 40]]) {
      const st = ellipse(x, y, rx, ry, 20); wash(g, st, { color: C.snow ? '#c8ccd2' : '#b4aa98', opacity: 0.97, seed: x, under: true }); glaze(g, st, x - rx * 0.3, y - ry * 0.4, rx * 0.5, ry * 0.3, '#f4f0e6', 0.6);
      if (C.snow) wash(g, ellipse(x, y - ry * 0.6, rx * 0.9, ry * 0.45, 20), { color: '#fbfcfd', opacity: 0.95, seed: x + 1 });
      penLine(g, st, { closed: true, w: 1.4, alpha: 0.5 });
    }
    // giant grass blades all along the back of the path
    for (let i = 0; i < 46; i++) { const x = r.range(-80, W + 80); if (x > 120 && x < 560) continue; blade(g, x, 830, r.range(260, 620), r.gauss(0, 0.2), r.range(16, 28), r.pick(C.grass), C.snow); }
    // the tall plant with its broad leaf: the grasshopper's stage
    const stem = ribbon([[1360, 840], [1340, 600], [1350, 300], [1330, 60]], 26, 14);
    wash(g, stem, { color: r.pick(C.grass), opacity: 0.95, seed: 31, under: true }); shadeEdge(g, stem, { color: '#2e3a1c', alpha: 0.35, width: 12, dx: 8 }); penLine(g, stem, { closed: true, w: 1.6, alpha: 0.5 });
    const lf = smooth([[1350, 610], [1250, 590], [1120, 600], [1060, 618], [1140, 640], [1270, 640], [1350, 626]]);
    wash(g, lf, { color: C.grass[1], opacity: 0.95, seed: 32, under: true });
    glaze(g, lf, 1200, 606, 100, 10, tint(C.grass[1], 0.4), 0.7);
    penLine(g, [[1350, 618], [1220, 616], [1080, 618]], { w: 1.2, alpha: 0.5 });
    penLine(g, lf, { closed: true, w: 1.8, alpha: 0.7 });
    if (C.snow) wash(g, smooth([[1340, 604], [1220, 588], [1090, 604], [1200, 600], [1340, 612]]), { color: '#fbfcfd', opacity: 0.95, seed: 33 });
    // a big flower head on top of the plant
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2; wash(g, ellipse(1330 + Math.cos(a) * 70, 70 + Math.sin(a) * 40, 60, 24, 20, a), { color: C.flowers[0], opacity: 0.9, seed: 34 + k, under: true, layers: 10 }); }
    wash(g, ellipse(1330, 70, 36, 26, 20), { color: C.snow ? '#e8e4dc' : '#d89a3a', opacity: 0.95, seed: 45, under: true });
    // the ant's home: a grassy bank running off the left edge, under a twisting root, with a round door
    const mound = smooth([[-M - 60, 880], [-M - 60, 560], [60, 560], [220, 590], [380, 590], [520, 640], [600, 740], [640, 880]]);
    wash(g, mound, { color: shade(C.soil, 0.1), opacity: 0.97, seed: 50, under: true });
    shadeEdge(g, mound, { color: shade(C.soil, 0.55), alpha: 0.35, width: 60, dx: 26, dy: -10 });
    strokes(g, mound, { color: shade(C.soil, 0.4), count: 420, len: 6, width: 1.4, alpha: 0.4, seed: 51, dir: () => r() * 3 });
    for (let k = 0; k < 18; k++) { const x = r.range(-80, 560), y = r.range(640, 860); if (x > 240 && x < 440 && y > 720) continue;
      const st = ellipse(x, y, r.range(8, 16), r.range(6, 10), 12); wash(g, st, { color: shade(C.soil, 0.25), opacity: 0.7, seed: 54 + k, layers: 6 }); }  // little stones in the earth
    trunk(g, [[-M - 60, 600], [120, 580], [300, 560], [470, 600], [640, 700], [700, 880]], 56, 30, { seed: 52, under: true });
    trunk(g, [[60, 585], [20, 650], [-20, 720]], 18, 6, { seed: 55, under: true });
    const capCol = C.snow ? ['#f4f6f8', '#e6eaee'] : name === 'autumn' ? ['#a8883a', '#8a7a3a', '#c09048'] : [PAL.moss, '#7f9a5a', '#8fa252'];
    for (let k = 0; k < 13; k++) foliage(g, -80 + k * 54, 560 + Math.max(0, k - 6) * 14 + (k % 2) * 6, 46, 18, { seed: 56 + k, colors: capCol, blobs: 3, opacity: 0.92, detail: false });
    if (!C.snow) for (let k = 0; k < 12; k++) grass(g, -60 + k * 55, 570 + Math.max(0, k - 6) * 14, { seed: 70 + k, h: 40, n: 6, colors: capCol });
    // a stone arch around the door
    for (let k = 0; k < 9; k++) { const a = Math.PI * (1 + k / 8), x = 340 + Math.cos(a) * 92, y = 822 + Math.sin(a) * 96 * (k === 0 || k === 8 ? 0.5 : 1);
      const st = ellipse(x, y, 18, 13, 12, a + Math.PI / 2); wash(g, st, { color: C.snow ? '#c8ccd2' : '#b8ae9c', opacity: 0.97, seed: 80 + k, under: true, layers: 8 }); penLine(g, st, { closed: true, w: 1.2, alpha: 0.6 }); }
    const door = smooth([[270, 880], [270, 790], [300, 752], [340, 742], [380, 752], [410, 790], [410, 880]]);
    wash(g, door, { color: '#7a5236', opacity: 0.98, seed: 60, under: true });
    for (let k = 1; k < 4; k++) penLine(g, [[270 + k * 35, 884], [270 + k * 35, 760 - Math.abs(k - 2) * 8]], { w: 1.4, alpha: 0.5 });
    penLine(g, door, { closed: true, w: 2.2, alpha: 0.85 });
    g.fillStyle = '#e8c070'; g.beginPath(); g.arc(392, 820, 6, 0, 7); g.fill();
    // the round window with little shutters and a flower box
    const win = ellipse(500, 712, 30, 30, 20); wash(g, win, { color: C.snow ? '#f2c070' : '#7a8a90', opacity: 0.95, seed: 61, under: true });
    penLine(g, [[470, 712], [530, 712]], { w: 2, alpha: 0.8 }); penLine(g, [[500, 682], [500, 742]], { w: 2, alpha: 0.8 }); penLine(g, win, { closed: true, w: 2.2, alpha: 0.8 });
    wash(g, smooth([[466, 748], [534, 748], [530, 764], [470, 764]]), { color: '#8a5a32', opacity: 0.95, seed: 63, under: true });
    if (!C.snow) for (let k = 0; k < 4; k++) flower(g, 474 + k * 17, 744, { seed: 64 + k, size: 6, color: k % 2 ? '#f2c4d0' : '#f8f0dc', stem: 0 });
    // a little lantern hanging from the root, the doorstep and a path of flat stones
    penLine(g, [[200, 586], [200, 640]], { w: 1.4, alpha: 0.8 });
    const lamp = smooth([[188, 640], [212, 640], [216, 672], [184, 672]]); wash(g, lamp, { color: '#f2c070', opacity: 0.95, seed: 65, under: true, layers: 8 }); penLine(g, lamp, { closed: true, w: 1.6, alpha: 0.8 });
    pool(g, 200, 656, 40, 34, '#ffe0a0', 0.35);
    wash(g, smooth([[250, 880], [430, 880], [446, 902], [234, 902]]), { color: C.snow ? '#c8ccd2' : '#a49884', opacity: 0.97, seed: 62, under: true });
    penLine(g, [[234, 902], [446, 902]], { w: 1.4, alpha: 0.6 });
    for (const [x, y] of [[470, 930], [560, 960], [660, 990]]) { const st = ellipse(x, y, 36, 12, 14); wash(g, st, { color: C.snow ? '#d4d8de' : '#b8ae9c', opacity: 0.95, seed: x, under: true, layers: 8 }); penLine(g, st, { closed: true, w: 1.2, alpha: 0.5 }); }
    if (!C.snow) { for (const [x, sc] of [[120, 1.0], [150, 0.7], [560, 0.8]]) mushroom(g, x, 880, { seed: x, s: sc }); for (let k = 0; k < 6; k++) flower(g, 440 + k * 22, 872 - (k % 2) * 6, { seed: 90 + k, size: 7, color: name === 'autumn' ? '#e8a04a' : k % 2 ? '#f2c4d0' : '#f8f0dc', stem: 16 }); }
    if (C.snow) { // snow over everything
      wash(g, smooth([[-M - 50, 860], [600, 850], [1300, 868], [W + M + 50, 856], [W + M + 50, LH], [-M - 50, LH]]), { color: '#f6f8fa', opacity: 0.9, seed: 70 });
      wash(g, smooth([[-M - 60, 556], [60, 552], [220, 584], [380, 584], [520, 632], [600, 730], [480, 680], [300, 640], [60, 600], [-M - 60, 600]]), { color: '#fbfcfd', opacity: 0.95, seed: 71 });
      wash(g, smooth([[-M - 60, 584], [300, 540], [480, 584], [640, 684], [700, 860], [660, 700], [470, 600], [300, 556], [-M - 60, 604]]), { color: '#fbfcfd', opacity: 0.95, seed: 72 });
    }
    // fallen leaves in autumn
    if (name === 'autumn') for (let k = 0; k < 40; k++) leaf(g, r.range(0, W), r.range(840, 1080), r.range(12, 20), r() * 6, r.pick(['#c86a3a', '#d89a3a', '#a85a2a', '#e8b050']));
  });
  P.fg = [];
  const r = rng(80 + name.length);
  for (const [i, x] of [-40, 1960, 860].entries()) {
    P.fg.push({ x, ph: r() * 6, s: sprite({ x0: x - 200, y0: H - 420, x1: x + 200, y1: H + 40, w: 400, h: 460 }, 1, (g) => {
      for (let k = 0; k < 7; k++) blade(g, x - 80 + k * 26, H + 40, i === 2 ? 160 + k * 20 : 300 + k * 30, (k - 3) * 0.12, 24, r.pick(C.grass), C.snow);
    }) });
  }
  return P;
}
function drawFg(g, c, list, t) { for (const p of list) { cam(g, c, 1.2); g.translate(p.x, H + 40); g.rotate(Math.sin(t * 0.6 + p.ph) * 0.02); g.translate(-p.x, -(H + 40)); drawSprite(g, p.s); } }

// cosy inside the ant's home
function paintBurrow() {
  return layer((g) => {
    const r = rng(90);
    g.fillStyle = '#5a3e2a'; g.fillRect(-M, -MY, LW, LH);
    const room = smooth([[60, 1000], [40, 600], [200, 250], [600, 90], [1100, 70], [1600, 160], [1860, 420], [1880, 1000]]);
    wash(g, room, { color: '#8a6446', opacity: 0.97, seed: 91, under: true });
    glaze(g, room, 960, 560, 800, 420, '#c08a5a', 0.6);
    strokes(g, room, { color: '#5a3e2a', count: 600, len: 7, width: 1.5, alpha: 0.35, seed: 92, dir: () => r() * 3 });
    for (let k = 0; k < 14; k++) { const x = r.range(200, 1700), y0 = 120 + Math.abs(x - 1000) * 0.18; penLine(g, [[x, y0], [x + r.gauss(0, 6), y0 + 40], [x + r.gauss(0, 10), y0 + r.range(60, 120)]], { color: '#6a4a32', w: r.range(2, 3.4), alpha: 0.85 }); }
    // the floor
    wash(g, smooth([[40, 880], [960, 860], [1880, 880], [1880, 1100], [40, 1100]]), { color: '#9a7452', opacity: 0.97, seed: 93 });
    wash(g, ellipse(960, 930, 420, 60, 30), { color: '#b8503a', opacity: 0.85, seed: 94 }); // a rug
    for (let k = 0; k < 5; k++) penLine(g, ellipse(960, 930, 400 - k * 70, 56 - k * 10, 30), { closed: true, color: '#e8c070', w: 1.6, alpha: 0.6 });
    // shelves full of seeds and grains
    for (const y of [380, 520]) {
      trunk(g, [[1330, y], [1700, y]], 14, 14, { seed: 95 + y, under: true });
      for (let k = 0; k < 8; k++) { const x = 1350 + k * 44; wash(g, ellipse(x, y - 22, 18, 22, 16), { color: r.pick(['#e0b050', '#c89a4a', '#a8783a', '#d8c08a']), opacity: 0.95, seed: x + y, under: true, layers: 10 }); penLine(g, ellipse(x, y - 22, 18, 22, 16), { closed: true, w: 1.1, alpha: 0.6 }); }
    }
    // a little round window with snow outside
    const win = ellipse(620, 300, 90, 90, 30);
    wash(g, win, { color: '#c6d0dc', opacity: 0.97, seed: 97, under: true });
    glaze(g, win, 600, 340, 70, 30, '#ffffff', 0.7);
    penLine(g, [[530, 300], [710, 300]], { w: 3, alpha: 0.85 }); penLine(g, [[620, 210], [620, 390]], { w: 3, alpha: 0.85 }); penLine(g, win, { closed: true, w: 3, alpha: 0.85 });
    // a little fireplace with a pot
    const hearth = smooth([[220, 880], [220, 640], [300, 590], [380, 640], [380, 880]]);
    wash(g, hearth, { color: '#8a8070', opacity: 0.97, seed: 98, under: true }); penLine(g, hearth, { closed: true, w: 2, alpha: 0.7 });
    wash(g, smooth([[250, 880], [250, 720], [300, 690], [350, 720], [350, 880]]), { color: '#2a1a12', opacity: 0.97, seed: 99 });
    // a table, two acorn-cap bowls, and a bed with a leaf blanket
    trunk(g, [[700, 800], [990, 800]], 22, 22, { seed: 100, under: true });
    for (const x of [740, 950]) trunk(g, [[x, 800], [x, 880]], 12, 12, { seed: 101 + x, under: true });
    const bed = smooth([[1200, 880], [1200, 760], [1530, 760], [1530, 880]]);
    wash(g, bed, { color: '#7a5236', opacity: 0.97, seed: 103, under: true }); penLine(g, bed, { closed: true, w: 2, alpha: 0.7 });
    wash(g, smooth([[1210, 770], [1510, 770], [1522, 800], [1208, 806]]), { color: '#e8dcc0', opacity: 0.95, seed: 104 });
    wash(g, ellipse(1450, 772, 46, 18, 20), { color: '#f4ecdc', opacity: 0.97, seed: 105, under: true }); // pillow
  });
}
function bowl(g, x, y, full) {
  const b = smooth([[x - 30, y - 16], [x + 30, y - 16], [x + 24, y + 8], [x - 24, y + 8]]);
  wash(g, b, { color: '#8a5a32', opacity: 0.97, seed: Math.round(x), under: true, layers: 8 }); penLine(g, b, { closed: true, w: 1.4, alpha: 0.8 });
  if (full) { wash(g, ellipse(x, y - 16, 28, 6, 16), { color: '#e8c070', opacity: 0.95, seed: Math.round(x) + 1, layers: 8 });
    g.save(); g.globalAlpha = 0.5; for (let k = 0; k < 3; k++) { const ph = ((S._t || 0) * 0.4 + k / 3) % 1; pool(g, x - 10 + k * 10 + Math.sin(ph * 6) * 4, y - 26 - ph * 60, 8 + ph * 10, 10 + ph * 8, '#f8f0e0', (1 - ph) * 0.8); } g.restore(); }
}

// ---------------------------------------------------------------- actors
function GH(g, x, y, sc, flip, st) { g.save(); g.translate(x, y); g.scale(sc * flip, sc); hop.draw(g, st); g.restore(); }
function AN(g, x, y, sc, flip, st) { g.save(); g.translate(x, y); g.scale(sc * flip, sc); ant.draw(g, { grain: (g2, p) => { g2.save(); g2.translate(...p); drawSprite(g2, st.seed ? SEED : GRAIN); g2.restore(); }, ...st }); g.restore(); }
function notes(g, t, x, y, k = 1) {
  g.save(); g.fillStyle = INK;
  for (let i = 0; i < 4; i++) {
    const ph = ((t * 0.35 + i / 4) % 1); g.globalAlpha = Math.sin(ph * Math.PI) * 0.7 * k;
    const nx = x + ph * 120 + Math.sin(ph * 6 + i) * 14, ny = y - ph * 160;
    g.beginPath(); g.ellipse(nx, ny, 7, 5, -0.4, 0, 7); g.fill(); g.fillRect(nx + 5, ny - 26, 2.2, 26);
    if (i % 2) g.fillRect(nx + 5, ny - 26, 12, 3);
  }
  g.restore();
}
function snowfall(g, t, n, k = 1) {
  g.save();
  for (let i = 0; i < n; i++) {
    const u = noise1(i * 3.7, 5), sp = 0.03 + noise1(i, 7) * 0.03, v = (t * sp + noise1(i * 1.3, 9)) % 1;
    const x = u * (W + 200) - 100 + Math.sin(t * 0.8 + i) * 20, y = v * (H + 100) - 50, r = 2 + (i % 4);
    g.globalAlpha = 0.85 * k; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  g.restore();
}
function fallingLeaves(g, t, n) {
  for (let i = 0; i < n; i++) {
    const period = 11 + i, ph = ((t + i * 2.7) % period) / period;
    const x = 200 + i * 230 + Math.sin(ph * 8 + i) * 70, y = -40 + ph * 1000;
    g.save(); g.globalAlpha = Math.sin(ph * Math.PI); leaf(g, x, y, 16, ph * 9 + i, ['#c86a3a', '#d89a3a', '#a85a2a', '#e8b050'][i % 4]); g.restore();
  }
}

// ---- one scene in the meadow: season blend, camera, and the actors
function meadow(g, t, c0, season, o = {}) {
  const P = SEASONS[season];
  const c = o.raw ? c0 : { z: c0.z, x: c0.x, y: c0.y + 80 }; // the path sits above the captions
  S.paperBg(g);
  drawLayer(g, c, P.sky, 0.15);
  drawLayer(g, c, P.far, 0.3);
  drawLayer(g, c, P.ground, 1);
  cam(g, c, 1);
  if (o.actors) o.actors(g);
  cam(g, c, 1);
  if (season === 'summer') motes(g, t, 30, 11);
  if (season === 'autumn') fallingLeaves(g, t, 7);
  drawFg(g, c, P.fg, t);
  sunlight(g, season === 'winter' ? 0.3 : 1, season === 'autumn' ? 0.25 : 0);
  if (season === 'winter') { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(150,170,210,0.4)'; g.fillRect(0, 0, W, H); g.restore(); snowfall(g, t, 70); }
  if (o.after) o.after(g);
}

// ---- title
function drawTitle(g, t) {
  S.paperBg(g); g.fillStyle = 'rgba(250,214,160,0.2)'; g.fillRect(0, 0, W, H);
  const c = { z: 1 + t * 0.004, x: 0, y: 0 };
  drawLayer(g, c, TITLE, 1); cam(g, c, 1);
  g.save(); g.textAlign = 'center'; g.fillStyle = INK;
  const a1 = span(t, 0.6, 2.4), a2 = span(t, 1.4, 3.2), a3 = span(t, 2.4, 4.0);
  g.globalAlpha = a1 * 0.9; g.font = '130px "Fell"'; g.fillText('The Ant', 960, 360 + (1 - a1) * 10);
  g.globalAlpha = a2 * 0.9; g.font = 'italic 110px "Fell"'; g.fillText('& the Grasshopper', 960, 490 + (1 - a2) * 10);
  g.globalAlpha = a3 * 0.75; g.font = 'italic 40px "Fell"'; g.fillText('an Aesop’s fable, for sleepy little ones', 960, 580);
  g.restore();
  GH(g, 1220, 860, 0.55, -1, { t, play: 1, bow: t * 0.8, smile: 0.7, eyes: 1 - S.blink(t, 3) });
  AN(g, 720, 860, 0.6, 1, { t, smile: 0.7, eyes: 1 - S.blink(t, 5), breath: Math.sin(t * 1.4) });
  notes(g, t, 1180, 650, 0.8);
}
function paintTitle() {
  return layer((g) => {
    wash(g, smooth([[300, 870], [960, 850], [1620, 872], [1620, 900], [300, 904]]), { color: '#a9ae7f', opacity: 0.4, seed: 7, edge: 0 });
    for (let i = 0; i < 6; i++) fern(g, 330 + i * 30, 880, { seed: 810 + i, len: 130 - i * 6, angle: -2.0 + i * 0.22, curl: 0.5, color: i % 2 ? PAL.moss : PAL.olive });
    for (let i = 0; i < 9; i++) flower(g, 1400 + i * 30, 870 - (i % 2) * 8, { seed: 820 + i, size: 9, color: i % 2 ? '#f8f4ea' : PAL.pink, stem: 26 });
  });
}

// ---- 1 & 2: summer
function drawSummer(g, t) {
  const n02 = line('n02'), g01 = line('g01'), n03 = line('n03'), g02 = line('g02'), a01 = line('a01'), a02 = line('a02'), g03 = line('g03'), n04 = line('n04'), n05 = line('n05'), n06 = line('n06');
  const talkT = n03.start, wideT = n04.start;
  const close = span(t, 6, n02.start + 2) * (1 - span(t, n03.start - 0.5, n03.start + 2));
  const mid = span(t, n03.start, n03.start + 3) * (1 - span(t, wideT, wideT + 2.5));
  const c = { z: 1 + 0.5 * close, x: lerp(0, LEDGE[0] - 980, close) + 220 * mid * (1 - close), y: lerp(0, LEDGE[1] - 640, close) };
  meadow(g, t, c, 'summer', { actors: (g) => {
    // the grasshopper on his leaf, playing, singing, chatting, and dancing
    const chat = Math.max(S.mood(t, 'g02'), S.mood(t, 'g03'), S.mood(t, 'a01') * 0.8, S.mood(t, 'a02') * 0.8);
    const playing = (t < g02.start - 0.3 || t > g03.end + 0.5) ? 1 : 1 - span(t, g02.start - 0.8, g02.start - 0.2) - 0 * chat;
    const play = clamp(playing) * (t > 6.5 ? 1 : 0);
    const dance = t > n06.start ? Math.abs(Math.sin(t * 4)) * 14 : 0;
    const laugh = S.mood(t, 'g03', 0.1, 0) * (t < g03.start + 1.5 ? 1 : 0);
    const look = t > n03.start + 2 && t < g03.end + 0.6;
    GH(g, LEDGE[0] - 80, LEDGE[1] + 14 - dance, 0.9, look ? 1 : 1, { t, play: look ? (t > g03.end ? 1 : 0) : play, bow: t * 0.9,
      mouth: Math.max(say('g01', t), say('g02', t), say('g03', t)) * 0.85, smile: 0.7, eyes: laugh > 0.4 ? 0 : 1 - S.blink(t, 3), happy: laugh > 0.4 || (play > 0.5 && !look && Math.sin(t * 0.7) > 0.3),
      browUp: S.mood(t, 'g02') * 0.8, arms: say('g02', t) > 0.1 ? 'wave' : undefined, antenna: say('g01', t) + dance / 14, headTilt: look ? 0.25 : Math.sin(t * 1.5) * 0.05, lean: look ? 0.08 : 0 });
    if (play > 0.5 && !look) notes(g, t, LEDGE[0] - 30, LEDGE[1] - 140);
    // the ant marches in from the right with her grain, stops to talk, then marches on to her door
    const inT = n03.start + 0.2, stopT = n03.end + 0.6, goT = g03.end + 0.2;
    let ax, walk = null, flip = -1;
    if (t < inT) ax = 2200;
    else if (t < stopT) { ax = lerp(2100, 900, clamp((t - inT) / (stopT - inT))); walk = t * 1.6; }
    else if (t < goT) { ax = 900; flip = t > stopT + 0.4 ? 1 : -1; }   // she turns to look up at him
    else { ax = 900 - (t - goT) * 70; walk = t * 1.6; }
    // later (n05): trip after trip, carrying seeds into her home
    if (t > n05.start - 1) {
      const trip = 9.5, u = ((t - (n05.start - 1)) % trip) / trip;
      const out = u < 0.5;
      ax = out ? lerp(DOOR_AT[0] + 40, 1500, u * 2) : lerp(1500, DOOR_AT[0] + 40, (u - 0.5) * 2);
      flip = out ? 1 : -1; walk = t * 1.8;
      AN(g, ax, GROUND, 1.0, flip, { t, walk, carry: out ? 0 : 1, seed: Math.floor((t - n05.start) / trip) % 2, smile: 0.6, eyes: 1 - S.blink(t, 5) });
    } else if (ax < 2150 && ax > DOOR_AT[0] + 60) {
      const kind = Math.max(S.mood(t, 'a01'), S.mood(t, 'a02'));
      AN(g, ax, GROUND, 1.0, flip, { t, walk, carry: 1, mouth: Math.max(say('a01', t), say('a02', t)) * 0.85, smile: 0.5 + kind * 0.2, eyes: 1 - S.blink(t, 5),
        headTilt: walk == null ? -0.2 : 0, browUp: S.mood(t, 'g02') * 0.6 + S.mood(t, 'g03') * 0.5 });
    }
  } });
}

// ---- 3: autumn
function drawAutumn(g, t) {
  const n07 = line('n07'), n08 = line('n08');
  const c = { z: 1.05 + 0.15 * span(t, n07.start, n08.end), x: 120 * span(t, n07.start, n08.end), y: -30 * span(t, n07.start, n08.end) };
  meadow(g, t, c, 'autumn', { actors: (g) => {
    GH(g, LEDGE[0] - 80, LEDGE[1] + 14, 0.9, 1, { t, play: 1, bow: t * 0.5, smile: 0.55, eyes: 1 - S.blink(t, 3), headTilt: Math.sin(t * 0.9) * 0.05 });
    notes(g, t, LEDGE[0] - 30, LEDGE[1] - 140, 0.6);
  } });
}

// ---- 4: winter
function drawWinter(g, t) {
  const n09 = line('n09'), n10 = line('n10'), g04 = line('g04'), n11 = line('n11');
  const look = span(t, n10.start, n10.end), go = n11.start + 1;
  const c = { z: 1.05 + 0.25 * look * (1 - span(t, go, go + 3)), x: lerp(0, 300, look * (1 - span(t, go, go + 3))), y: lerp(0, 60, look) - 80 * span(t, go, go + 3) };
  meadow(g, t, c, 'winter', { actors: (g) => {
    let x = LEDGE[0] - 80, y = LEDGE[1] + 14, crouch = 0, hopY = 0;
    const down = n10.start + 1.5;
    if (t > down) { const k = clamp((t - down) / 1.2); x = lerp(LEDGE[0] - 80, 1240, k); y = lerp(LEDGE[1] + 14, GROUND, k) - Math.sin(k * Math.PI) * 120; }
    if (t > go) { // slowly, slowly, hop by hop to the ant's door
      const hops = (t - go) / 1.8, k = clamp(hops / 4.2), hh = hops % 1;
      x = lerp(1240, DOOR_AT[0] + 260, k); y = GROUND - (k < 1 ? Math.sin(hh * Math.PI) * 50 : 0); crouch = k < 1 ? Math.max(0, Math.cos(hh * Math.PI)) * 0.4 : 0;
    }
    const sad = Math.max(S.mood(t, 'g04', 0.5, 2), span(t, n10.start + 3, n10.start + 4));
    GH(g, x, y, 0.9, t > go ? -1 : 1, { t, arms: 'hug', shiver: t > n09.start + 3 ? 1 : 0, sad, smile: 0.2 - sad * 0.3, crouch, mouth: say('g04', t) * 0.8,
      eyes: (1 - S.blink(t, 3)) * (1 - 0.3 * sad), browUp: span(t, n11.start, n11.start + 1) * 0.8, headTilt: t > n10.start && t < g04.start ? Math.sin(t * 1.2) * 0.15 : 0 });
  } });
}

// ---- 5a: knock, knock, knock
function drawDoor(g, t) {
  const n12 = line('n12'), a03 = line('a03');
  const c = { z: 1.7, x: DOOR_AT[0] + 150 - W / 2, y: DOOR_AT[1] - 140 - H / 2 };
  meadow(g, t, c, 'winter', { raw: true, actors: (g) => {
    const open = span(t, n12.end + 0.4, n12.end + 1.2);
    // warm light spilling out as the door opens
    if (open > 0) { g.save(); g.globalCompositeOperation = 'lighter'; pool(g, 340, 820, 120 * open, 90 * open, '#ffcf80', 0.5); g.restore(); }
    if (open > 0.2) AN(g, 330, GROUND, 1.0, 1, { t, mouth: say('a03', t) * 0.85, smile: 0.6 + S.mood(t, 'a03') * 0.3, eyes: 1 - S.blink(t, 5), browUp: span(t, a03.start, a03.start + 0.6) * (1 - span(t, a03.start + 1.6, a03.start + 2.2)), arms: t > a03.start + 1.8 ? 'wave' : 'rest' });
    const knock = t > n12.start && t < n12.end + 0.2 ? Math.max(0, Math.sin((t - n12.start) * 11)) : 0;
    GH(g, 600, GROUND, 0.9, -1, { t, arms: knock > 0 ? 'wave' : 'hug', shiver: 1, sad: 1 - open * 0.6, smile: 0.2 + open * 0.3, eyes: 1 - S.blink(t, 3), browUp: open });
  } });
}

// ---- 5b & 6: inside, soup, friends, a sleepy song
function drawInside(g, t) {
  S._t = t;
  const g05 = line('g05'), a04 = line('a04'), n13 = line('n13'), g06 = line('g06'), a05 = line('a05'), n14 = line('n14'), n15 = line('n15'), n16 = line('n16'), n17 = line('n17');
  const k = clamp((t - g05.start) / (S.TL.duration - g05.start));
  const late = span(t, n14.start, n14.start + 3);
  const c = { z: 1.42 - 0.06 * ease(k), x: -60, y: 160 };
  S.paperBg(g);
  drawLayer(g, c, BURROW, 1);
  cam(g, c, 1);
  // the fire
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 4; i++) pool(g, 300 + Math.sin(t * 5 + i) * 8, 840 - i * 22 - Math.abs(Math.sin(t * 7 + i)) * 10, 30 - i * 5, 40 - i * 6, ['#ff9a3a', '#ffc060', '#ffe090', '#fff0c0'][i], 0.7);
  pool(g, 300, 780, 360, 260, '#ffb060', 0.18 + 0.03 * Math.sin(t * 3));
  g.restore();
  // the snow outside the window
  g.save(); g.beginPath(); g.arc(620, 300, 86, 0, 7); g.clip(); g.setTransform(1, 0, 0, 1, 0, 0); snowfall(g, t, 40, 0.9); g.restore(); cam(g, c, 1);
  // soup bowls on the table
  const eat = span(t, a04.end - 0.5, a04.end + 0.5) * (1 - span(t, n13.end, n13.end + 1));
  bowl(g, 760, 784, t < n13.end + 1); bowl(g, 940, 784, t < n14.start);
  // the ant: at the table, then tucking into bed
  const bedT = n14.start + 4;
  if (t < bedT) AN(g, 1080, 880, 0.95, -1, { t, mouth: Math.max(say('a04', t), say('a05', t)) * 0.85, smile: 0.6 + S.mood(t, 'a05') * 0.3, eyes: 1 - S.blink(t, 5),
    happy: S.mood(t, 'a05', 0.1, 1) > 0.5 || (t > g06.start && say('g06', t) < 0.05 && Math.sin(t) > 0.5), arms: S.mood(t, 'a04') > 0.5 ? 'give' : 'rest', browUp: S.mood(t, 'g06') * 0.5 });
  else { // asleep in bed, the leaf blanket pulled up
    AN(g, 1340, 800, 0.75, -1, { t, eyes: 0, smile: 0.6, breath: Math.sin(t * 0.9) });
    const blanket = smooth([[1220, 770], [1500, 766], [1512, 830], [1216, 836]]);
    wash(g, blanket, { color: '#7f9a4a', opacity: 0.97, seed: 300, under: true, layers: 10 }); penLine(g, blanket, { closed: true, w: 1.6, alpha: 0.7 });
    zzz(g, t, 1380, 640, bedT + 1, S.TL.duration + 10);
  }
  // the grasshopper: shivering, then eating, grateful, then playing a soft, sleepy song by the fire
  const warm = span(t, n13.start, n13.end), play = span(t, n14.start + 1, n14.start + 3);
  const sleepy = span(t, n16.start, n17.start + 2);
  const gx = lerp(620, 470, play), gy = 880;
  GH(g, gx, gy, 0.95, 1, { t, shiver: 1 - warm, arms: play > 0.5 ? undefined : eat > 0.5 ? 'eat' : 'hug', play: play * (1 - span(t, n17.start + 2, n17.start + 6)), bow: t * 0.35,
    mouth: Math.max(say('g05', t), say('g06', t)) * 0.85, sad: S.mood(t, 'g05', 0.2, 0.5) * 0.8, smile: 0.4 + warm * 0.3 + S.mood(t, 'g06') * 0.2,
    eyes: sleepy > 0.6 ? 0 : (1 - S.blink(t, 3)) * (1 - 0.4 * sleepy), happy: S.mood(t, 'g06', 0.1, 0.5) > 0.5 && say('g06', t) < 0.05, headTilt: sleepy * 0.25, crouch: sleepy * 0.3 });
  if (play > 0.5 && sleepy < 0.8) notes(g, t, gx + 40, gy - 220, 0.6 * (1 - sleepy));
  if (sleepy > 0.8) zzz(g, t, gx + 60, gy - 260, n17.start + 2, S.TL.duration + 10);
  // drifting into the night
  g.setTransform(1, 0, 0, 1, 0, 0);
  nightGrade(g, 0.35 * span(t, n15.start, n16.end));
  const a = span(t, n17.end + 2.5, n17.end + 5) * (1 - span(t, S.TL.duration - 12, S.TL.duration - 7));
  if (a > 0) {
    g.save(); g.textAlign = 'center';
    g.fillStyle = `rgba(250,238,210,${0.85 * a})`; g.font = 'italic 76px "Fell"'; g.fillText('Sweet dreams', 1100, 330);
    g.font = 'italic 34px "Fell"'; g.fillStyle = `rgba(250,238,210,${0.6 * a})`; g.fillText('the end', 1100, 385);
    g.restore();
  }
}

// ---------------------------------------------------------------- entry points
let SCENES;
window.FABLE = {
  async setup(timeline) {
    S = makeStage(timeline);
    await S.setup(document.getElementById('c'));
    hop = makeGrasshopper(1.4); ant = makeAnt(1.4); GRAIN = makeGrain(1.4); SEED = makeGrain(1.4, '#a8783a');
    TITLE = paintTitle();
    SEASONS = { summer: paintSeason('summer'), autumn: paintSeason('autumn'), winter: paintSeason('winter') };
    BURROW = paintBurrow();
    SCENES = [
      [0, drawTitle], [5.4, drawSummer], [line('n07').start - 1.5, drawAutumn], [line('n09').start - 1.5, drawWinter],
      [line('n12').start - 1.4, drawDoor], [line('g05').start - 1.2, drawInside],
    ];
  },
  frame(t) { S.frame(t, SCENES); },
};
