// The Town Mouse and the Country Mouse: scenes, staging and timing.
import { W, H, rng, canvas, wash, pool, strokes, ellipse, smooth, sprite, drawSprite, bbox, noise1, rgba, shade, tint, mix,
  clamp, lerp, ease, span, glaze, shadeEdge, penLine, hatch, path, ribbon } from '../../engine/watercolor.js';
import { PAL, foliage, trunk, grass, flower, berries, mushroom, fern, hills, cloud, leaf, plant, cottage } from '../../engine/scenery.js';
import { M, MY, LW, LH, INK, layer, cam, drawLayer, fireflies, motes, nightGrade, sunlight, stars, moon, zzz, makeStage } from '../../engine/stage.js';
import { makeMouse2, makeCat } from '../../engine/characters/mice.js';

let S, cm, tm, cat, P = {};
const line = (id) => S.line(id);
const say = (id, t) => S.talking(id, t);
const CM = { sleeve: '#a898c0' }, TM = { sleeve: '#3e5a8a' };
const GROUND = 860;

// ---------------------------------------------------------------- helpers
function skyL(top, mid, bottom, sun) {
  return layer((g) => { const grd = g.createLinearGradient(0, -MY, 0, 820); grd.addColorStop(0, top); grd.addColorStop(0.6, mid); grd.addColorStop(1, bottom); g.fillStyle = grd; g.fillRect(-M, -MY, LW, LH); if (sun) pool(g, ...sun, 600, 300, '#fde2a4', 0.5); });
}
function soften(c, px) { const o = canvas(LW, LH); const g = o.getContext('2d'); g.filter = `blur(${px}px)`; g.drawImage(c, 0, 0); return o; }
function wheat(g, x, y, h, col = '#d8b45a') {
  penLine(g, [[x, y], [x + 4, y - h * 0.5], [x + 2, y - h]], { color: shade(col, 0.25), w: 2, alpha: 0.85 });
  for (let k = 0; k < 7; k++) { const yy = y - h + k * 7; for (const sd of [-1, 1]) { g.fillStyle = rgba(k % 2 ? col : tint(col, 0.2), 0.95); g.beginPath(); g.ellipse(x + 2 + sd * 4, yy, 3.4, 6, sd * 0.4, 0, 7); g.fill(); } }
}
function burrowDoor(g, x, y, o = {}) { // round wooden door in a stone arch, a window, a lantern
  for (let k = 0; k < 9; k++) { const a = Math.PI * (1 + k / 8), sx = x + Math.cos(a) * 82, sy = y - 70 + Math.sin(a) * 86 * (k === 0 || k === 8 ? 0.4 : 1);
    const st = ellipse(sx, sy, 16, 12, 12, a + Math.PI / 2); wash(g, st, { color: '#b8ae9c', opacity: 0.97, seed: 80 + k, under: true, layers: 8 }); penLine(g, st, { closed: true, w: 1.1, alpha: 0.6 }); }
  const door = smooth([[x - 62, y], [x - 62, y - 70], [x - 36, y - 110], [x, y - 120], [x + 36, y - 110], [x + 62, y - 70], [x + 62, y]]);
  wash(g, door, { color: '#7a8a5a', opacity: 0.98, seed: 60, under: true });
  for (let k = 1; k < 4; k++) penLine(g, [[x - 62 + k * 31, y + 2], [x - 62 + k * 31, y - 104 + Math.abs(k - 2) * 8]], { w: 1.3, alpha: 0.5 });
  penLine(g, door, { closed: true, w: 2.1, alpha: 0.85 });
  g.fillStyle = '#e8c070'; g.beginPath(); g.arc(x + 44, y - 50, 5.5, 0, 7); g.fill();
  wash(g, smooth([[x - 80, y], [x + 80, y], [x + 92, y + 18], [x - 92, y + 18]]), { color: '#a49884', opacity: 0.97, seed: 62, under: true });
}

// ---------------------------------------------------------------- places
function paintCountry() {
  const Q = {};
  Q.sky = skyL('#bcd2dc', '#f1dcb6', '#f5e2b8', [1300, 420]);
  Q.far = soften(layer((g) => {
    hills(g, 620, 60, '#b9b991', { seed: 4, opacity: 0.6, bumps: 3 });
    const r = rng(3); for (let i = 0; i < 260; i++) wheat(g, r.range(-80, W + 80), r.range(660, 760), r.range(50, 80), '#e2c070');
  }), 4);
  Q.ground = layer((g) => {
    const r = rng(5);
    // the wheat field behind
    for (let i = 0; i < 160; i++) wheat(g, r.range(560, W + 80), r.range(740, 830), r.range(120, 200));
    // the lane
    wash(g, smooth([[-M - 50, 840], [800, 826], [W + M + 50, 840], [W + M + 50, LH], [-M - 50, LH]]), { color: '#c8b07a', opacity: 0.95, seed: 6 });
    strokes(g, [[-M, 840], [W + M, 840], [W + M, LH], [-M, LH]], { color: '#8a7448', count: 700, len: 6, width: 1.3, alpha: 0.35, seed: 7, dir: () => r() * 3 });
    for (let i = 0; i < 70; i++) grass(g, r.range(-80, W + 80), r.range(850, 1100), { seed: 8 + i, h: 30 + r() * 30, n: 6, alpha: 0.6 });
    // the old hedge bank, with roots and the burrow
    const bank = smooth([[-M - 60, 870], [-M - 60, 420], [100, 400], [320, 430], [520, 520], [640, 700], [680, 870]]);
    wash(g, bank, { color: '#8a7a54', opacity: 0.97, seed: 9, under: true });
    shadeEdge(g, bank, { color: '#3e3420', alpha: 0.4, width: 60, dx: 26 });
    for (let k = 0; k < 9; k++) foliage(g, -60 + k * 80, 400 + Math.max(0, k - 4) * 40, 90, 70, { seed: 10 + k, colors: [PAL.moss, '#6f8a46', PAL.olive, '#5f7a3e'], blobs: 6, opacity: 0.92 });
    for (const [pts, w] of [[[[-M - 60, 520], [140, 500], [320, 540], [520, 600], [660, 760], [700, 870]], 46], [[[60, 520], [20, 600], [-30, 680]], 16], [[[420, 560], [460, 640], [470, 720]], 14]])
      trunk(g, pts, w, w * 0.6, { seed: 20 + w, under: true });
    burrowDoor(g, 300, 870);
    const win = ellipse(470, 700, 26, 26, 20); wash(g, win, { color: '#7a8a90', opacity: 0.95, seed: 61, under: true }); penLine(g, [[444, 700], [496, 700]], { w: 2, alpha: 0.8 }); penLine(g, [[470, 674], [470, 726]], { w: 2, alpha: 0.8 }); penLine(g, win, { closed: true, w: 2.2, alpha: 0.8 });
    for (const [x, sc] of [[120, 1], [150, 0.7], [560, 0.8]]) mushroom(g, x, 870, { seed: x, s: sc });
    for (let k = 0; k < 8; k++) flower(g, 400 + k * 24, 862 - (k % 2) * 6, { seed: 30 + k, size: 8, color: k % 2 ? PAL.pink : '#f8f0dc', stem: 18 });
    berries(g, 600, 820, { seed: 40, size: 7, n: 5 });
  });
  return Q;
}
function paintBurrowIn() {
  return layer((g) => {
    const r = rng(90);
    g.fillStyle = '#5a3e2a'; g.fillRect(-M, -MY, LW, LH);
    const room = smooth([[60, 1000], [40, 600], [200, 250], [600, 90], [1100, 70], [1600, 160], [1860, 420], [1880, 1000]]);
    wash(g, room, { color: '#8a6a4a', opacity: 0.97, seed: 91, under: true });
    glaze(g, room, 960, 560, 800, 420, '#c09060', 0.6);
    strokes(g, room, { color: '#5a3e2a', count: 600, len: 7, width: 1.5, alpha: 0.35, seed: 92, dir: () => r() * 3 });
    for (let k = 0; k < 14; k++) { const x = r.range(200, 1700), y0 = 120 + Math.abs(x - 1000) * 0.18; penLine(g, [[x, y0], [x + r.gauss(0, 6), y0 + 40], [x + r.gauss(0, 10), y0 + r.range(60, 120)]], { color: '#6a4a32', w: r.range(2, 3.4), alpha: 0.85 }); }
    wash(g, smooth([[40, 880], [960, 860], [1880, 880], [1880, 1100], [40, 1100]]), { color: '#9a7a56', opacity: 0.97, seed: 93 });
    wash(g, ellipse(960, 930, 420, 60, 30), { color: '#6f8a4a', opacity: 0.8, seed: 94 }); // a mossy rug
    // round window looking out at the sky
    const win = ellipse(1400, 300, 90, 90, 30); wash(g, win, { color: '#c8d6e2', opacity: 0.97, seed: 97, under: true });
    penLine(g, [[1310, 300], [1490, 300]], { w: 3, alpha: 0.85 }); penLine(g, [[1400, 210], [1400, 390]], { w: 3, alpha: 0.85 }); penLine(g, win, { closed: true, w: 3, alpha: 0.85 });
    // dried flowers and a little shelf
    trunk(g, [[260, 420], [560, 420]], 14, 14, { seed: 95, under: true });
    for (let k = 0; k < 5; k++) { const x = 290 + k * 60; wash(g, ellipse(x, 398, 16, 20, 14), { color: r.pick(['#b8503a', '#d8a050', '#8a6a9a']), opacity: 0.9, seed: x, under: true, layers: 8 }); }
    // the table with a leaf plate
    trunk(g, [[760, 800], [1160, 800]], 22, 22, { seed: 100, under: true });
    for (const x of [800, 1120]) trunk(g, [[x, 800], [x, 880]], 12, 12, { seed: 101 + x, under: true });
    // the moss bed
    const bed = smooth([[1460, 880], [1460, 780], [1800, 780], [1800, 880]]);
    wash(g, bed, { color: '#7a5236', opacity: 0.97, seed: 103, under: true }); penLine(g, bed, { closed: true, w: 2, alpha: 0.7 });
    wash(g, smooth([[1470, 790], [1790, 790], [1796, 820], [1468, 826]]), { color: '#8fa252', opacity: 0.95, seed: 104 });
    for (let k = 0; k < 20; k++) { g.fillStyle = rgba(r.pick(['#7f9a4a', '#a0b45e', '#6f8a40']), 0.8); g.beginPath(); g.arc(r.range(1480, 1780), r.range(784, 812), r.range(4, 9), 0, 7); g.fill(); }
  });
}
function seedsSupper(g, x, y) { // a leaf plate with barley seeds, blackberries and a piece of corn
  const lf = smooth([[x - 110, y], [x - 60, y - 22], [x + 60, y - 22], [x + 110, y], [x + 60, y + 14], [x - 60, y + 14]]);
  wash(g, lf, { color: '#7f9a4a', opacity: 0.95, seed: 200, under: true, layers: 10 }); penLine(g, lf, { closed: true, w: 1.4, alpha: 0.7 });
  for (let k = 0; k < 9; k++) { g.fillStyle = '#d8c08a'; g.beginPath(); g.ellipse(x - 80 + k * 9, y - 6 - (k % 2) * 4, 4, 6.5, 0.5, 0, 7); g.fill(); }
  for (let k = 0; k < 3; k++) berries(g, x + k * 26, y - 14, { seed: 210 + k, size: 7, n: 3, color: '#3a2a4a' });
  const corn = smooth([[x + 64, y - 10], [x + 96, y - 22], [x + 100, y - 8], [x + 70, y + 2]]); wash(g, corn, { color: '#e8c050', opacity: 0.95, seed: 220, under: true, layers: 8 }); penLine(g, corn, { closed: true, w: 1.2, alpha: 0.7 });
}
function paintJourney() {
  const Q = {};
  Q.sky = skyL('#bcd2dc', '#f1dcb6', '#f5e2b8', [500, 400]);
  Q.land = layer((g) => {
    const r = rng(300);
    hills(g, 640, 70, '#b9b991', { seed: 31, opacity: 0.7, bumps: 2 });
    // the town far away on the right: roofs and a church spire
    for (let k = 0; k < 9; k++) { const x = 1380 + k * 60, h = r.range(60, 120); wash(g, smooth([[x, 640], [x, 640 - h], [x + 26, 620 - h - 20], [x + 52, 640 - h], [x + 52, 640]]), { color: mix(r.pick(['#c8a080', '#b89070', '#d8b8a0']), '#e6dccc', 0.5), opacity: 0.85, seed: 310 + k, layers: 10 }); }
    wash(g, smooth([[1700, 640], [1700, 470], [1716, 400], [1732, 470], [1732, 640]]), { color: mix('#a89080', '#e6dccc', 0.5), opacity: 0.85, seed: 330 });
    hills(g, 720, 50, '#a9b07e', { seed: 32, opacity: 0.8, bumps: 3 });
    // the winding lane over the hill
    wash(g, smooth([[-M, 900], [300, 860], [700, 800], [1000, 760], [1300, 700], [1500, 680], [1520, 690], [1310, 716], [1010, 780], [710, 830], [310, 900], [-M, 960]]), { color: '#d8c090', opacity: 0.9, seed: 33 });
    for (let i = 0; i < 120; i++) grass(g, r.range(-80, W + 80), r.range(760, 1100), { seed: 340 + i, h: 24, n: 6, alpha: 0.55 });
    for (let i = 0; i < 40; i++) flower(g, r.range(0, W), r.range(800, 1060), { seed: 500 + i, size: 6, color: r.pick([PAL.pink, '#f8f0dc', '#e8a04a']), stem: 12 });
    // a hedge and a gate on the way
    for (let k = 0; k < 7; k++) foliage(g, -40 + k * 120, 760 - k * 6, 80, 50, { seed: 600 + k, colors: [PAL.moss, '#6f8a46', PAL.olive], blobs: 5, opacity: 0.9 });
  });
  return Q;
}
function paintTownHouse() {
  const Q = {};
  Q.sky = skyL('#c4d4de', '#ecdcc4', '#f2e2c4', [1500, 300]);
  Q.house = layer((g) => {
    const r = rng(700);
    wash(g, smooth([[-M, 860], [W + M, 860], [W + M, LH], [-M, LH]]), { color: '#a8a49c', opacity: 0.97, seed: 701 }); // cobbled street
    for (let i = 0; i < 260; i++) { const x = r.range(-M, W + M), y = r.range(870, LH); g.strokeStyle = rgba('#6a665e', 0.4); g.lineWidth = 1.2; g.beginPath(); g.ellipse(x, y, 18, 8, 0, 0, 7); g.stroke(); }
    // the grand house: tall, with columns, big windows, steps and a door
    const wall = [[260, 860], [260, 120], [1660, 120], [1660, 860]];
    wash(g, wall, { color: '#e8dccb', opacity: 0.97, seed: 702, under: true, bleed: 0.008 });
    shadeEdge(g, wall, { color: '#8a7a66', alpha: 0.35, width: 80, dy: 40 });
    for (let k = 0; k < 14; k++) penLine(g, [[260, 160 + k * 52], [1660, 160 + k * 52]], { sharp: true, w: 0.9, alpha: 0.18 });
    wash(g, [[220, 140], [1700, 140], [1700, 100], [220, 100]], { color: '#c8baa6', opacity: 0.97, seed: 703, under: true }); // cornice
    for (const x of [340, 560, 1360, 1580]) { // tall windows
      const w = [[x - 70, 760], [x - 70, 300], [x + 70, 300], [x + 70, 760]];
      wash(g, w, { color: '#5d6c78', opacity: 0.95, seed: x, under: true });
      glaze(g, w, x - 30, 360, 40, 60, '#c8dce4', 0.6);
      wash(g, smooth([[x - 66, 600], [x + 66, 600], [x + 66, 760], [x - 66, 760]]), { color: '#e6b86a', opacity: 0.35, seed: x + 1, edge: 0 }); // warm light inside
      penLine(g, [[x, 300], [x, 760]], { sharp: true, w: 3, alpha: 0.85 }); for (const y of [420, 540, 650]) penLine(g, [[x - 70, y], [x + 70, y]], { sharp: true, w: 2.5, alpha: 0.85 });
      penLine(g, w, { closed: true, sharp: true, w: 3, alpha: 0.9 });
      wash(g, [[x - 86, 300], [x + 86, 300], [x + 86, 276], [x - 86, 276]], { color: '#c8baa6', opacity: 0.97, seed: x + 2, under: true });
      wash(g, [[x - 80, 760], [x + 80, 760], [x + 80, 780], [x - 80, 780]], { color: '#c8baa6', opacity: 0.97, seed: x + 3, under: true });
    }
    for (const x of [760, 1160]) { const c = [[x - 30, 860], [x - 30, 180], [x + 30, 180], [x + 30, 860]]; wash(g, c, { color: '#f2ead8', opacity: 0.97, seed: x, under: true }); shadeEdge(g, c, { color: '#8a7a66', alpha: 0.4, width: 30, dx: 14 }); penLine(g, c, { closed: true, sharp: true, w: 2, alpha: 0.7 }); }
    const door = smooth([[880, 860], [880, 480], [920, 420], [960, 404], [1000, 420], [1040, 480], [1040, 860]]);
    wash(g, door, { color: '#3e5a4a', opacity: 0.98, seed: 710, under: true }); penLine(g, door, { closed: true, w: 3, alpha: 0.9 });
    for (const y of [560, 720]) for (const x of [904, 984]) penLine(g, [[x, y], [x + 32, y], [x + 32, y + 100], [x, y + 100]], { closed: true, sharp: true, w: 1.6, alpha: 0.6 });
    g.fillStyle = '#d8b050'; g.beginPath(); g.arc(1018, 680, 9, 0, 7); g.fill();
    for (let k = 0; k < 3; k++) wash(g, [[840 - k * 30, 860 + k * 20], [1080 + k * 30, 860 + k * 20], [1080 + k * 30, 880 + k * 20], [840 - k * 30, 880 + k * 20]], { color: '#c8c0b2', opacity: 0.97, seed: 720 + k, under: true });
    for (const x of [600, 1320]) { const pot = smooth([[x - 30, 860], [x - 40, 790], [x + 40, 790], [x + 30, 860]]); wash(g, pot, { color: '#b86a4a', opacity: 0.95, seed: x, under: true }); foliage(g, x, 740, 60, 60, { seed: x + 1, colors: [PAL.moss, PAL.deep], blobs: 5, opacity: 0.92 }); }
    // the mouse hole by the steps
    wash(g, smooth([[1150, 862], [1150, 838], [1166, 826], [1182, 838], [1182, 862]]), { color: '#2a1e16', opacity: 0.97, seed: 730 });
  });
  return Q;
}
function paintTable() { // the dining room at mouse size: on top of the long table
  let backL;
  const front = layer((g) => {
    const r = rng(800);
    // the room behind, soft
    const room = layer((h) => {
      h.fillStyle = '#d8c4a8'; h.fillRect(-M, -MY, LW, LH);
      for (let k = 0; k < 12; k++) wash(h, [[k * 180 - 60, -MY], [k * 180 + 30, -MY], [k * 180 + 30, 640], [k * 180 - 60, 640]], { color: k % 2 ? '#c8a888' : '#d8b898', opacity: 0.6, seed: 810 + k, edge: 0 }); // wallpaper stripes
      for (const x of [380, 1500]) { const f = [[x - 140, 120], [x + 140, 120], [x + 140, 420], [x - 140, 420]]; wash(h, f, { color: '#b8945a', opacity: 0.9, seed: x, under: true }); wash(h, [[x - 120, 140], [x + 120, 140], [x + 120, 400], [x - 120, 400]], { color: '#8aa0a8', opacity: 0.9, seed: x + 1 }); } // paintings
      for (const x of [700, 1200]) { pool(h, x, 180, 70, 70, '#ffd890', 0.6); } // chandelier glow
    });
    backL = canvas(LW, LH); { const b = backL.getContext('2d'); b.filter = 'blur(10px)'; b.drawImage(room, 0, 0); }
    // the tablecloth: white with a lace edge, stretching to the front
    const cloth = smooth([[-M - 50, 700], [W + M + 50, 690], [W + M + 50, LH], [-M - 50, LH]]);
    wash(g, cloth, { color: '#f4efe6', opacity: 0.98, seed: 820, under: true });
    for (let k = 0; k < 10; k++) penLine(g, [[k * 220 - 60, 700], [k * 220 + 40, LH]], { color: '#d8d0c4', w: 2, alpha: 0.6 });
    shadeEdge(g, cloth, { color: '#a89a8a', alpha: 0.3, width: 80, dy: -30 });
    // the feast: a cream cake, a wedge of cheese, a wobbly red jelly (drawn live), a candlestick
    const plate = (x, y, w) => { const p = ellipse(x, y, w, w * 0.22, 30); wash(g, p, { color: '#ffffff', opacity: 0.98, seed: x, under: true }); penLine(g, p, { closed: true, w: 1.6, alpha: 0.6 }); pool(g, x, y + 10, w * 1.1, w * 0.2, '#8a7a6a', 0.2); };
    plate(420, 840, 210); plate(1520, 850, 190);
    // the cake
    const cake = smooth([[260, 840], [260, 640], [580, 640], [580, 840]]);
    wash(g, cake, { color: '#f0d8a8', opacity: 0.98, seed: 830, under: true });
    wash(g, [[260, 720], [580, 720], [580, 740], [260, 740]], { color: '#c84a5a', opacity: 0.9, seed: 831 }); // jam layer
    wash(g, smooth([[250, 650], [300, 600], [540, 600], [590, 650], [560, 680], [520, 660], [480, 690], [430, 664], [380, 694], [330, 662], [280, 688]]), { color: '#fbf6ee', opacity: 0.98, seed: 832, under: true }); // cream
    for (let k = 0; k < 4; k++) { berries(g, 300 + k * 80, 596, { seed: 840 + k, size: 9, n: 1, color: '#c0303a' }); }
    penLine(g, cake, { closed: true, sharp: true, w: 2, alpha: 0.6 });
    // the cheese wedge with holes
    const ch = smooth([[1380, 850], [1380, 720], [1660, 640], [1660, 850]]);
    wash(g, ch, { color: '#f2c84e', opacity: 0.98, seed: 850, under: true }); shadeEdge(g, ch, { color: '#b88a2a', alpha: 0.4, width: 30, dx: 10 });
    for (const [x, y, rr] of [[1450, 780, 14], [1540, 740, 18], [1600, 800, 12], [1500, 820, 9], [1620, 700, 10]]) { g.fillStyle = '#c89a3a'; g.beginPath(); g.ellipse(x, y, rr, rr * 0.8, 0, 0, 7); g.fill(); }
    penLine(g, ch, { closed: true, sharp: true, w: 2, alpha: 0.6 });
    // a candlestick far back
    wash(g, [[1100, 690], [1130, 690], [1130, 300], [1100, 300]], { color: '#f6efe0', opacity: 0.97, seed: 860, under: true });
    wash(g, smooth([[1060, 700], [1170, 700], [1150, 680], [1080, 680]]), { color: '#d8b050', opacity: 0.97, seed: 861, under: true });
    // crumbs
    for (let k = 0; k < 30; k++) { g.fillStyle = rgba('#e8c890', 0.9); g.beginPath(); g.arc(r.range(200, 1700), r.range(860, 1000), r.range(2, 5), 0, 7); g.fill(); }
  });
  return { back: backL, front };
}
function jelly(g, x, y, t, wob) {
  const k = Math.sin(t * 14) * wob, sh = smooth([[x - 110 - k * 6, y], [x - 96 + k * 8, y - 150], [x - 60, y - 180 - k * 4], [x + 60, y - 180 + k * 4], [x + 96 - k * 8, y - 150], [x + 110 + k * 6, y]]);
  const p = ellipse(x, y, 170, 36, 30); g.fillStyle = '#ffffff'; path(g, p); g.fill(); g.strokeStyle = rgba(INK, 0.4); g.lineWidth = 1.5; path(g, p); g.stroke();
  g.save(); g.globalAlpha = 0.85; g.fillStyle = '#d83a4a'; path(g, sh); g.fill(); g.restore();
  g.save(); g.globalAlpha = 0.5; g.fillStyle = '#ff9aa0'; g.beginPath(); g.ellipse(x - 40, y - 120, 20, 40, 0.2, 0, 7); g.fill(); g.restore();
  penLine(g, sh, { closed: true, color: '#7a1a24', w: 2, alpha: 0.7 });
}
function paintFloor() { // the wall and floor below the table, with the mouse hole
  return layer((g) => {
    const wall = [[-M, -MY], [W + M, -MY], [W + M, 820], [-M, 820]];
    wash(g, wall, { color: '#d8c4a8', opacity: 0.97, seed: 900, under: true });
    for (let k = 0; k < 12; k++) wash(g, [[k * 180 - 60, -MY], [k * 180 + 30, -MY], [k * 180 + 30, 760], [k * 180 - 60, 760]], { color: k % 2 ? '#c8a888' : '#d8b898', opacity: 0.6, seed: 910 + k, edge: 0 });
    wash(g, [[-M, 760], [W + M, 760], [W + M, 830], [-M, 830]], { color: '#f2ead8', opacity: 0.97, seed: 920, under: true }); // skirting board
    penLine(g, [[-M, 760], [W + M, 760]], { sharp: true, w: 2, alpha: 0.6 });
    wash(g, [[-M, 830], [W + M, 830], [W + M, LH], [-M, LH]], { color: '#a8784a', opacity: 0.97, seed: 921, under: true }); // floorboards
    for (let k = 0; k < 8; k++) penLine(g, [[-M, 860 + k * 40], [W + M, 860 + k * 40]], { sharp: true, w: 1.4, alpha: 0.4 });
    // the hanging tablecloth on the left, with lace
    const cloth = smooth([[-M - 40, -MY], [520, -MY], [540, 400], [500, 700], [-M - 40, 720]]);
    wash(g, cloth, { color: '#f4efe6', opacity: 0.98, seed: 930, under: true });
    for (let k = 0; k < 6; k++) penLine(g, [[k * 100, -MY], [k * 100 + 20, 700]], { color: '#d8d0c4', w: 2, alpha: 0.6 });
    for (let k = 0; k < 14; k++) { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(-60 + k * 42, 712 - k * 0.5, 14, 0, Math.PI); g.fill(); g.strokeStyle = rgba(INK, 0.3); g.lineWidth = 1; g.stroke(); }
    // the mouse hole in the skirting
    const hole = smooth([[1380, 830], [1380, 740], [1420, 690], [1470, 676], [1520, 690], [1560, 740], [1560, 830]]);
    wash(g, hole, { color: '#21160f', opacity: 0.98, seed: 940, under: true }); penLine(g, hole, { closed: true, w: 2, alpha: 0.7 });
  });
}
function paintHole() {
  return layer((g) => {
    g.fillStyle = '#2a1e16'; g.fillRect(-M, -MY, LW, LH);
    const tunnel = smooth([[-M, 1000], [-M, 400], [300, 240], [900, 200], [1500, 260], [W + M, 420], [W + M, 1000]]);
    wash(g, tunnel, { color: '#5a4230', opacity: 0.95, seed: 950, under: true });
    strokes(g, tunnel, { color: '#2a1e16', count: 500, len: 8, width: 1.5, alpha: 0.4, seed: 951, dir: () => 0.3 });
    // the bright arch of the way out (on the right), where the room is
    const out = smooth([[1500, 900], [1500, 600], [1580, 500], [1680, 480], [1780, 500], [1860, 600], [1860, 900]]);
    wash(g, out, { color: '#f2dcb4', opacity: 0.97, seed: 952, under: true }); glaze(g, out, 1680, 700, 160, 200, '#fff4dc', 0.8);
    wash(g, [[-M, 900], [W + M, 900], [W + M, LH], [-M, LH]], { color: '#3a2a1e', opacity: 0.97, seed: 953 });
    for (let k = 0; k < 20; k++) { const x = 100 + k * 90, y = 900 + (k % 3) * 30; g.fillStyle = rgba('#6a5240', 0.7); g.beginPath(); g.ellipse(x, y, 14, 7, 0, 0, 7); g.fill(); }
  });
}

// ---------------------------------------------------------------- staging
const C1 = (g, x, y, sc, flip, st) => { g.save(); g.translate(x, y); g.scale(sc * flip, sc); cm.draw(g, { ...CM, ...st }); g.restore(); };
const T1 = (g, x, y, sc, flip, st) => { g.save(); g.translate(x, y); g.scale(sc * flip, sc); tm.draw(g, { ...TM, ...st }); g.restore(); };
function base(g, c, layers) { S.paperBg(g); for (const [img, p] of layers) drawLayer(g, c, img, p); cam(g, c, 1); }
function finishLight(g, o = {}) { sunlight(g, o.sun ?? 1, o.sunset || 0); if (o.sunset) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(255,170,150,${0.45 * o.sunset})`; g.fillRect(0, 0, W, H); g.restore(); } nightGrade(g, o.night || 0); }

function drawTitle(g, t) {
  S.paperBg(g); g.fillStyle = 'rgba(250,214,160,0.2)'; g.fillRect(0, 0, W, H);
  const c = { z: 1 + t * 0.004, x: 0, y: 0 }; cam(g, c, 1);
  wash(g, smooth([[300, 900], [960, 880], [1620, 902], [1620, 930], [300, 934]]), { color: '#a9ae7f', opacity: 0.4, seed: 7, edge: 0 });
  g.save(); g.textAlign = 'center'; g.fillStyle = INK;
  const a1 = span(t, 0.6, 2.4), a2 = span(t, 1.4, 3.2), a3 = span(t, 2.4, 4.0);
  g.globalAlpha = a1 * 0.9; g.font = '110px "Fell"'; g.fillText('The Town Mouse', 960, 340 + (1 - a1) * 10);
  g.globalAlpha = a2 * 0.9; g.font = 'italic 100px "Fell"'; g.fillText('& the Country Mouse', 960, 470 + (1 - a2) * 10);
  g.globalAlpha = a3 * 0.75; g.font = 'italic 40px "Fell"'; g.fillText('an Aesop’s fable, for sleepy little ones', 960, 560);
  g.restore();
  C1(g, 820, 900, 1.0, 1, { t, smile: 0.7, eyes: 1 - S.blink(t, 3), breath: Math.sin(t * 1.4) });
  T1(g, 1100, 900, 1.0, -1, { t, smile: 0.7, eyes: 1 - S.blink(t, 5), arms: 'wave' });
}
function drawCountry(g, t) {
  const n03 = line('n03'), t01 = line('t01'), c01 = line('c01');
  const k = clamp((t - 6) / (c01.end - 6));
  const c = { z: 1.05 + 0.25 * ease(span(t, n03.start, t01.start)), x: lerp(0, 60, ease(k)), y: lerp(60, 130, ease(span(t, n03.start, t01.start))) };
  base(g, c, [[P.country.sky, 0.15], [P.country.far, 0.35], [P.country.ground, 1]]);
  // the country mouse at her door, sweeping, then welcoming
  const delight = S.mood(t, 'c01', 0.3, 1);
  C1(g, 470, GROUND + 6, 1.15, 1, { t, smile: 0.6 + delight * 0.3, mouth: say('c01', t) * 0.85, eyes: 1 - S.blink(t, 3), browUp: Math.max(span(t, n03.start + 3, n03.start + 4), delight * 0.6),
    arms: delight > 0.5 ? 'open' : say('c01', t) > 0 ? 'wave' : 'rest', happy: delight > 0.5 && say('c01', t) < 0.05 && Math.sin(t) > 0.6, breath: Math.sin(t * 1.4), hop: Math.abs(Math.sin(t * 8)) * 8 * span(t, t01.end, t01.end + 0.3) * (1 - span(t, c01.start + 1, c01.start + 1.5)) });
  // the town mouse comes hurrying down the lane
  const inT = n03.start + 2.5, stopT = t01.start + 0.4;
  const tx = lerp(2150, 830, clamp((t - inT) / (stopT - inT)));
  if (t > inT) T1(g, tx, GROUND + 6, 1.15, -1, { t, walk: t < stopT ? t * 2.2 : null, smile: 0.7, mouth: say('t01', t) * 0.85, eyes: 1 - S.blink(t, 5), arms: say('t01', t) > 0.1 ? 'wave' : 'rest', browUp: S.mood(t, 't01') * 0.6 });
  finishLight(g);
}
function drawSupper(g, t) {
  const n04 = line('n04'), t02 = line('t02'), t03 = line('t03'), c02 = line('c02');
  const c = { z: 1.42, x: 0, y: 160 };
  base(g, c, [[P.burrow, 1]]);
  seedsSupper(g, 960, 790);
  const unimpressed = S.mood(t, 't02', 0.3, 0.8), eager = S.mood(t, 't03', 0.3, 0.6), curious = S.mood(t, 'c02', 0.3, 1.2);
  C1(g, 690, 880, 1.0, 1, { t, smile: 0.6 - unimpressed * 0.3 + curious * 0.3, mouth: say('c02', t) * 0.85, eyes: 1 - S.blink(t, 3), browUp: Math.max(curious, eager * 0.6), sad: unimpressed * 0.5,
    arms: span(t, n04.start, n04.start + 1) * (1 - span(t, n04.end, n04.end + 1)) > 0.5 ? 'open' : curious > 0.5 ? 'open' : 'rest', hop: curious * Math.abs(Math.sin(t * 7)) * 8 * (t > c02.start + 1.5 ? 1 : 0) });
  T1(g, 1240, 880, 1.0, -1, { t, smile: 0.6 - unimpressed * 0.5 + eager * 0.3, mouth: Math.max(say('t02', t), say('t03', t)) * 0.85, eyes: (1 - S.blink(t, 5)) * (1 - 0.35 * unimpressed), sad: unimpressed * 0.4,
    browUp: eager, arms: eager > 0.5 ? 'open' : unimpressed > 0.5 ? 'hug' : 'rest', headTilt: unimpressed * 0.1 });
  g.setTransform(1, 0, 0, 1, 0, 0); g.save(); g.globalCompositeOperation = 'lighter'; pool(g, 1100, 300, 300, 200, '#ffe0a0', 0.15); g.restore();
}
function drawJourney(g, t) {
  const n05 = line('n05');
  const k = clamp((t - n05.start + 1) / (n05.end - n05.start + 2.5));
  const c = { z: 1.0 + 0.1 * ease(k), x: lerp(-30, 60, k), y: 40 };
  base(g, c, [[P.journey.sky, 0.15], [P.journey.land, 1]]);
  // two little mice walking up the lane toward the town
  const u = ease(k), x = lerp(-40, 1460, u), y = lerp(920, 700, u), sc = lerp(0.5, 0.18, u);
  T1(g, x + 40 * sc / 0.5, y, sc, 1, { t, walk: t * 2, smile: 0.7 });
  C1(g, x, y + 6, sc, 1, { t, walk: t * 2 + 0.3, smile: 0.7 });
  finishLight(g);
}
function drawTownHouse(g, t) {
  const n06 = line('n06');
  const k = clamp((t - n06.start + 1) / (n06.end - n06.start + 2.5));
  const c = { z: 1.0 + 0.12 * ease(k), x: 120 * ease(k), y: 60 * ease(k) };
  base(g, c, [[P.town.sky, 0.15], [P.town.house, 1]]);
  const u = clamp((t - (n06.start - 0.5)) / 6);
  T1(g, lerp(260, 1120, ease(u)), 870, 0.3, 1, { t, walk: u < 1 ? t * 2.2 : null, smile: 0.7, arms: u >= 1 ? 'point' : 'rest' });
  C1(g, lerp(200, 1080, ease(u)), 872, 0.3, 1, { t, walk: u < 1 ? t * 2.2 + 0.3 : null, smile: 0.6, browUp: u >= 1 ? 1 : 0.4 });
  finishLight(g, { sun: 0.7 });
}
function drawFeast(g, t) {
  const n07 = line('n07'), t04 = line('t04'), c03 = line('c03'), n08 = line('n08'), n09 = line('n09'), t05 = line('t05');
  const c = { z: 1.0, x: 0, y: 30 };
  base(g, c, [[P.table.back, 1]]);
  const catT = n09.start - 0.2, runT = t05.start + 0.4;
  // the cat: pads in behind the table, big and sleepy, and yawns
  if (t > n08.start + 2) {
    const k = clamp((t - (n08.start + 2)) / 4);
    // she is enormous at mouse size: she rises behind the far edge of the table, so only her top half shows
    g.save(); g.beginPath(); g.rect(-M - 200, -MY - 200, LW + 400, 700 + MY + 200); g.clip();
    g.translate(lerp(-900, 120, ease(k)), 1260 - 160 * ease(k)); g.scale(2.3, 2.3);
    cat.draw(g, { t, walk: k < 1 ? t * 0.8 : null, yawn: span(t, n09.start + 2.5, n09.start + 3.2) * (1 - span(t, n09.start + 4.2, n09.start + 4.8)), eyes: 0.35 });
    g.restore();
  }
  drawLayer(g, c, P.table.front, 1); cam(g, c, 1);
  jelly(g, 960, 860, t, 0.3 + (t > catT ? 1 : 0));
  const amazed = S.mood(t, 'c03', 0.3, 1.2), fright = span(t, n08.start + 2.5, n08.start + 3);
  if (t < runT) {
    T1(g, 1180, 910, 1.0, -1, { t, smile: 0.8 * (1 - fright), mouth: Math.max(say('t04', t), say('t05', t)) * 0.85, eyes: 1 - S.blink(t, 5), arms: say('t04', t) > 0.1 ? 'open' : fright > 0.5 ? 'point' : 'rest', browUp: Math.max(fright, S.mood(t, 't05')), headTilt: fright * 0.25 });
    C1(g, 760, 910, 1.0, 1, { t, smile: 0.6 + amazed * 0.3 - fright * 0.5, mouth: say('c03', t) * 0.85, eyes: 1 - S.blink(t, 3), browUp: Math.max(amazed, fright), arms: t > n08.start && t < n08.start + 2.5 ? 'eat' : amazed > 0.5 ? 'open' : 'rest',
      hold: t > n08.start && t < n08.start + 2.8 ? (g2, h) => { g2.fillStyle = '#f0d8a8'; g2.beginPath(); g2.arc(h[0] + 4, h[1] - 4, 7, 0, 7); g2.fill(); } : null, headTilt: fright * -0.2 });
  } else { // scurry, scurry, scurry, off the far edge of the table
    const u = (t - runT) * 600;
    T1(g, 1180 + u, 910, 1.0, 1, { t, walk: t * 4, run: 1 });
    C1(g, 760 + u * 0.95, 910, 1.0, 1, { t, walk: t * 4 + 0.4, run: 1 });
  }
  g.setTransform(1, 0, 0, 1, 0, 0); g.save(); g.globalCompositeOperation = 'lighter'; pool(g, 1115, 260, 60, 80, '#ffd890', 0.5 + 0.1 * Math.sin(t * 7)); g.restore(); // the candle flame
}
function drawFloor(g, t) {
  const n10 = line('n10');
  const c = { z: 1.0, x: 0, y: 30 };
  base(g, c, [[P.floor, 1]]);
  const t0 = n10.start + 2.2;
  // sliding down the tablecloth, then running to the hole
  const lane = (delay, dx) => {
    const u = t - t0 - delay;
    if (u < 0) return null;
    if (u < 1.2) return { x: 420 + dx, y: lerp(300, 880, u / 1.2), slide: true };
    const v = (u - 1.2) * 520;
    return { x: 420 + dx + v, y: 880, slide: false, in: 420 + dx + v > 1440 };
  };
  for (const [fn, delay, dx] of [[T1, 0, 30], [C1, 0.5, 0]]) {
    const p = lane(delay, dx); if (!p || p.in) continue;
    fn(g, p.x, p.y, 0.9, 1, p.slide ? { t, eyes: 0, happy: true, smile: 0.8, arms: 'open' } : { t, walk: t * 4, run: 1 });
  }
}
function drawHole(g, t) {
  const n11 = line('n11'), c04 = line('c04'), c05 = line('c05'), t06 = line('t06');
  const c = { z: 1.15, x: 0, y: 90 };
  base(g, c, [[P.hole, 1]]);
  // the cat's shadow and big eye at the doorway, then gone
  const peek = span(t, n11.start + 1, n11.start + 2) * (1 - span(t, n11.start + 6, n11.start + 7));
  if (peek > 0) { g.save(); g.globalAlpha = peek * 0.7; pool(g, 1690, 660, 200, 220, '#3a2a1e', 0.8); g.restore();
    g.save(); g.globalAlpha = peek; g.fillStyle = '#e8b040'; g.beginPath(); g.ellipse(1680, 640, 26, 16 * peek, 0, 0, 7); g.fill(); g.fillStyle = '#1a120c'; g.beginPath(); g.ellipse(1680, 640, 6, 14 * peek, 0, 0, 7); g.fill(); g.restore(); }
  const thump = t < n11.start + 6.5 ? Math.max(0, Math.sin(t * 9)) * 3 : 0;
  const calm = span(t, n11.start + 7, n11.start + 8.5), sure = S.mood(t, 'c05', 0.3, 1);
  C1(g, 760, 920, 1.05, 1, { t, eyes: (1 - S.blink(t, 3)), browUp: (1 - calm) * 0.9, sad: 0.3 * (1 - calm), smile: 0.3 + calm * 0.3 + sure * 0.2, mouth: Math.max(say('c04', t), say('c05', t)) * 0.85,
    arms: (1 - calm) > 0.5 ? 'hug' : 'rest', hop: thump, headTilt: (1 - calm) * 0.15 });
  T1(g, 1120, 920, 1.05, -1, { t, eyes: (1 - S.blink(t, 5)) * (1 - 0.25 * S.mood(t, 't06')), browUp: (1 - calm) * 0.9, smile: 0.3 + calm * 0.3 + S.mood(t, 't06') * 0.3, mouth: say('t06', t) * 0.85,
    arms: (1 - calm) > 0.5 ? 'hug' : 'rest', hop: thump * 0.8, headTilt: -S.mood(t, 't06') * 0.08 });
}
function drawHome(g, t) {
  const n12 = line('n12'), n13 = line('n13');
  const k = clamp((t - n12.start + 1) / (n12.end - n12.start + 2));
  const c = { z: 1.05 + 0.25 * ease(k), x: lerp(200, 60, ease(k)), y: lerp(60, 130, ease(k)) };
  S.paperBg(g); drawLayer(g, c, P.sunset, 0.15); drawLayer(g, c, P.country.far, 0.35); drawLayer(g, c, P.country.ground, 1); cam(g, c, 1);
  const u = clamp((t - (n12.start - 0.5)) / (n12.end - n12.start + 2));
  C1(g, lerp(1700, 470, u), GROUND + 6, 1.15, -1, { t, walk: u < 1 ? t * 1.8 : null, smile: 0.7, eyes: 1 - S.blink(t, 3), happy: u >= 1 });
  finishLight(g, { sunset: 1 });
}
function drawNightIn(g, t) {
  const n13 = line('n13'), n14 = line('n14'), n15 = line('n15'), n16 = line('n16');
  const k = clamp((t - n13.start) / (S.TL.duration - n13.start));
  const c = { z: 1.42 - 0.12 * ease(k), x: 380, y: 160 - 40 * ease(k) };
  base(g, c, [[P.burrow, 1]]);
  // the window: night sky and stars
  g.save(); g.beginPath(); g.arc(1400, 300, 86, 0, 7); g.clip(); g.fillStyle = '#3a4880'; g.fillRect(1300, 200, 200, 200);
  for (let i = 0; i < 12; i++) { const a = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.5 + i * 0.1) + i)); g.fillStyle = `rgba(255,248,220,${a * span(t, n15.start + i * 0.3, n15.start + i * 0.3 + 1)})`; g.beginPath(); g.arc(1330 + (i * 37) % 140, 240 + (i * 53) % 130, 2.4, 0, 7); g.fill(); }
  g.restore();
  // a few blackberries, then into bed
  const bedT = n13.start + 4.5;
  if (t < bedT) C1(g, 1300, 880, 1.0, 1, { t, arms: 'eat', smile: 0.7, eyes: 1 - S.blink(t, 3), hold: (g2, h) => berries(g2, h[0], h[1], { seed: 9, size: 6, n: 1, color: '#3a2a4a' }) });
  else {
    g.save(); g.translate(1620, 800); g.scale(1.0, 1.0); cm.drawSleep(g, { breath: Math.sin(t * 0.9) }); g.restore();
    const blanket = smooth([[1500, 790], [1780, 786], [1790, 830], [1496, 836]]);
    wash(g, blanket, { color: '#a898c0', opacity: 0.95, seed: 300, under: true, layers: 10 }); penLine(g, blanket, { closed: true, w: 1.6, alpha: 0.7 });
    zzz(g, t, 1640, 690, bedT + 1, S.TL.duration + 10);
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  nightGrade(g, 0.45 * span(t, n13.start, n15.start));
  g.save(); g.globalCompositeOperation = 'lighter'; pool(g, 960, 700, 500, 300, '#ffd090', 0.08); g.restore();
  const a = span(t, n16.end + 2.5, n16.end + 5) * (1 - span(t, S.TL.duration - 12, S.TL.duration - 7));
  if (a > 0) { g.save(); g.textAlign = 'center'; g.fillStyle = `rgba(250,238,210,${0.85 * a})`; g.font = 'italic 76px "Fell"'; g.fillText('Sweet dreams', 760, 330); g.font = 'italic 34px "Fell"'; g.fillStyle = `rgba(250,238,210,${0.6 * a})`; g.fillText('the end', 760, 385); g.restore(); }
}

// ---------------------------------------------------------------- entry points
let SCENES;
window.FABLE = {
  async setup(timeline) {
    S = makeStage(timeline);
    await S.setup(document.getElementById('c'));
    cm = makeMouse2(1.6, 51, { fur: '#a8988a', dress: '#a898c0' });
    tm = makeMouse2(1.6, 52, { fur: '#8a7a6e', coat: '#3e5a8a', tie: '#c0443a', hat: '#2e2a30' });
    cat = makeCat(1.1);
    P.country = paintCountry(); P.burrow = paintBurrowIn(); P.journey = paintJourney(); P.town = paintTownHouse();
    P.table = paintTable(); P.floor = paintFloor(); P.hole = paintHole();
    P.sunset = skyL('#b8a9d2', '#e9b9c8', '#fadcb4', [1400, 560]);
    SCENES = [
      [0, drawTitle], [5.4, drawCountry], [line('n04').start - 1.2, drawSupper], [line('n05').start - 1.2, drawJourney],
      [line('n06').start - 0.8, drawTownHouse], [line('n07').start - 1.2, drawFeast], [line('n10').start + 1.4, drawFloor],
      [line('n11').start - 0.8, drawHole], [line('n12').start - 1.2, drawHome], [line('n13').start - 0.6, drawNightIn],
    ];
  },
  frame(t) { S.frame(t, SCENES); },
};
