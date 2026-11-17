// The meadow and the stream: soft hills, a line of trees, the winding stream with pebbly banks and reeds,
// the old oak on the bank (with a long branch over the water) and the ant's little round door among its roots.
// Pen-and-wash, painted in the current ctx coordinates (a 1920x1080 page). Moods: 'day', 'dusk'.
import { wash, pool, smooth, ellipse, fluffy, rng, rgba, shade, tint, mix, noise1, glaze, penLine, sprite, bbox, path, ink, sketch, hatch, clamp } from '../../engine/watercolor.js';
import { oak } from '../../engine/scenery.js';
import { brushWash, flecks, grassFlicks, cumulus } from '../north-wind-and-sun/scene.js';

const INKC = '#3a2c24';
export const MOOD = {
  day: { sky: ['#a8c8dc', '#e6e6cc', '#f4e4bc'], cloud: '#fdf6e8', cloudShade: '#d8c4b4', hills: ['#b8c08c', '#a8b884', '#c4bc8c'], far: ['#8fa070', '#9aab7a', '#a8b080'],
    grass: ['#9cb064', '#b4bc6c', '#86a058', '#c4bc70'], water: ['#8cb4b8', '#a8c8c4', '#78a0a8'], bank: ['#b8a478', '#a89068', '#c8b48c'], stone: ['#c8bca8', '#b4aca0', '#d4c8b0', '#a8a4a4'],
    flowers: ['#8cb0e0', '#f4ead0', '#f0c050', '#e89aa8'], reed: ['#7f9a52', '#6a8448', '#9aa85c'] },
};
export const STREAM = [[1600, 596], [1440, 604], [1250, 626], [1110, 664], [1080, 716], [1020, 780], [880, 846], [720, 912], [600, 990], [540, 1080], [520, 1200]];
export const streamW = (y) => 18 + Math.pow(clamp((y - 596) / 600), 1.1) * 760;
export function streamPath() { return smooth(STREAM, false, 10); }
export function streamEdges() {
  const P = streamPath(), A = [], B = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = streamW(P[i][1]) / 2;
    A.push([P[i][0] - dy * w, P[i][1] + dx * w * 0.35]); B.push([P[i][0] + dy * w, P[i][1] - dx * w * 0.35]);
  }
  return { P, A, B, shape: A.concat(B.slice().reverse()) };
}
export const OAK = { x: 330, ground: 790 };
export const DOOR = [470, 806];

export function paintSky(g, m, seed = 4) {
  const grd = g.createLinearGradient(0, -100, 0, 640);
  grd.addColorStop(0, m.sky[0]); grd.addColorStop(0.6, m.sky[1]); grd.addColorStop(1, m.sky[2]);
  g.fillStyle = '#f4ecdc'; g.fillRect(-400, -300, 2720, 1700);
  g.globalAlpha = 0.85; g.fillStyle = grd; g.fillRect(-400, -300, 2720, 1700); g.globalAlpha = 1;
  brushWash(g, [[-400, -300], [2320, -300], [2320, 560], [-400, 560]], [m.sky[0], tint(m.sky[0], 0.3), m.sky[1]], { seed, count: 60, width: [30, 80], len: [200, 600], alpha: [0.12, 0.28], base: 0.05, blur: 3, angle: () => -0.03, lifts: 0.15 });
  for (const [cx, cy, cw, i] of [[1300, 150, 240, 0], [1800, 230, 180, 1], [700, 120, 200, 2]]) cumulus(g, m, cx, cy, cw, seed * 40 + i * 11);
}
export function paintLand(g, m, seed = 21) {
  const r = rng(seed);
  // soft rolling hills and a hazy line of trees
  const hill = (pts) => smooth(pts, false, 6);
  const h1 = hill([[-400, 520], [0, 470], [400, 486], [800, 440], [1200, 470], [1600, 430], [2320, 470]]);
  brushWash(g, h1.concat([[2320, 900], [-400, 900]]), m.hills, { seed: seed + 1, count: 90, angle: () => -0.05, alpha: [0.12, 0.26], base: 0.5, under: true });
  sketch(g, h1, { alpha: 0.45, width: 1.1, seed: seed + 2 });
  for (let i = 0; i < 26; i++) { // round trees along the hedgerow
    const x = -200 + i * 95 + r.gauss(0, 20), y = 545 + noise1(i, 3) * 18, rr = r.range(34, 58), c = mix(m.far[i % 3], '#e8e4cc', 0.25);
    const sh = fluffy(x, y - rr * 0.6, rr, rr * 0.8, 7, 0.2, seed * 7 + i);
    wash(g, sh, { color: c, opacity: 0.9, seed: seed * 9 + i, bleed: 0.04, layers: 12, under: '#efe8d4' });
    pool(g, x - rr * 0.3, y - rr * 1.0, rr * 0.4, rr * 0.25, '#ffffff', 0.25);
    ink(g, sh.filter(([px, py]) => py < y - rr * 0.6), { width: 0.8, alpha: 0.4, gaps: 1.2, seed: seed * 11 + i });
  }
  const meadow = hill([[-400, 560], [600, 550], [1200, 566], [2320, 550], [2320, 1400], [-400, 1400]]);
  brushWash(g, meadow, m.grass, { seed: seed + 3, count: 380, angle: (x) => -0.04 + noise1(x * 0.003, seed) * 0.4, width: [10, 40], len: [30, 160], alpha: [0.12, 0.3], base: 0.45, under: true, lifts: 0.15 });
  hatch(g, meadow, { color: shade(m.grass[2], 0.35), count: 6000, len: 9, width: 1, alpha: 0.38, seed: seed + 4, dir: () => -Math.PI / 2 + 0.15, curve: 0.5, density: (x, y) => 0.25 + 0.75 * Math.max(0, noise1(x * 0.006 + y * 0.004, seed + 5)) });
  hatch(g, meadow, { color: INKC, count: 2000, len: 8, width: 0.8, alpha: 0.32, seed: seed + 6, dir: () => -Math.PI / 2, curve: 0.5, density: (x, y) => (y - 560) / 520 });
  for (let i = 0; i < 220; i++) { const x = r.range(-80, 2000), y = r.range(580, 1080); grassFlicks(g, x, y, 5 + (y - 560) * 0.05, { seed: seed + 100 + i, n: 5, colors: m.grass, inkA: 0.4 }); }
  // the stream
  const { A, B, shape, P } = streamEdges();
  // earthy banks
  const bankOut = (E, k) => E.map(([x, y], i) => { const c = P[i]; const dx = x - c[0], dy = y - c[1], d = Math.hypot(dx, dy) || 1, o = streamW(y) * 0.12 + 4; return [x + dx / d * o, y + dy / d * o * k]; });
  const bankShape = bankOut(A, 1).concat(bankOut(B, 1).reverse());
  brushWash(g, bankShape, m.bank, { seed: seed + 7, count: 80, width: [6, 20], len: [20, 80], alpha: [0.2, 0.4], base: 0.6, under: '#ece0c8' });
  brushWash(g, shape, m.water, { seed: seed + 8, count: 200, width: [6, 24], len: [40, 200], angle: (x, y) => -0.3 + (y - 600) / 1500, alpha: [0.18, 0.4], base: 0.75, under: '#e8eeea', lifts: 0.35 });
  g.save(); path(g, shape); g.clip();
  g.filter = 'blur(10px)'; g.strokeStyle = rgba(shade(m.water[2], 0.35), 0.45); g.lineWidth = 30; path(g, shape); g.stroke(); g.filter = 'none'; // darker along the banks
  for (let i = 0; i < 70; i++) { // ripple lines
    const k = Math.floor(r() * (P.length - 1)), [px, py] = P[k], w = streamW(py);
    const x = px + r.range(-0.4, 0.4) * w, y = py + r.gauss(0, 3), l = w * r.range(0.08, 0.2);
    ink(g, [[x - l, y], [x, y - 1.5], [x + l, y]], { color: '#4a6a72', width: 0.9, alpha: 0.4, wobble: 0.3 });
  }
  g.restore();
  for (const E of [A, B]) ink(g, E.filter((_, i) => i % 2 === 0 && E[i][1] > 600), { width: 1.3, alpha: 0.65, gaps: 1, seed: seed + (E === A ? 9 : 10) });
  // pebbles in little clusters along the banks, and a few stepping-stones in the water
  const pebble = (px, py, sz) => {
    const peb = ellipse(px, py, sz * 1.4, sz * 0.85, 10, r.gauss(0, 0.2));
    g.fillStyle = rgba('#5a5060', 0.22); g.beginPath(); g.ellipse(px + sz * 0.3, py + sz * 0.6, sz * 1.5, sz * 0.4, 0, 0, 7); g.fill();
    wash(g, peb, { color: m.stone[Math.floor(r() * 4)], opacity: 0.97, under: true, seed: Math.round(px * 3 + py), layers: 8, edge: 0.3 });
    g.fillStyle = 'rgba(255,250,240,0.5)'; g.beginPath(); g.ellipse(px - sz * 0.3, py - sz * 0.35, sz * 0.7, sz * 0.25, 0, 0, 7); g.fill();
    if (sz > 2.5) ink(g, peb, { closed: true, width: 0.9, alpha: 0.65, wobble: 0.2, gaps: 0.5 });
  };
  for (const E of [A, B]) for (let i = 2; i < E.length; i++) {
    const [x, y] = E[i]; if (y < 610 || r() > 0.2) continue;
    const s0 = 1 + streamW(y) * 0.009, n = 2 + Math.floor(r() * 4);
    for (let k = 0; k < n; k++) pebble(x + r.gauss(0, s0 * 5), y + r.gauss(0, s0 * 1.4) + s0, s0 * r.range(0.8, 2.6));
  }
  g.save(); path(g, shape); g.clip();
  for (const [u, off, szk] of [[0.5, 0.22, 0.8], [0.74, -0.28, 1]]) {
    const k = Math.floor(u * (P.length - 1)), [px, py] = P[k], w = streamW(py), x = px + off * w, y = py, sz = (3 + w * 0.02) * szk;
    for (let j = 0; j < 3; j++) ink(g, [[x - sz * (2 + j), y + sz * 0.6 + j * 3], [x, y + sz * (0.9 + j * 0.3)], [x + sz * (2 + j), y + sz * 0.6 + j * 3]], { color: '#ffffff', width: 1.4, alpha: 0.6 - j * 0.15, wobble: 0.3 });
    pebble(x, y, sz);
  }
  g.restore();
  // wildflowers in the grass: cow parsley, buttercups, red campion and forget-me-nots by the water
  for (let i = 0; i < 160; i++) {
    const y = r.range(600, 1080), x = r.range(-60, 1980), c = P.reduce((b, p) => Math.abs(p[1] - y) < Math.abs(b[1] - y) ? p : b);
    if (Math.abs(x - c[0]) < streamW(y) * 0.75) continue;
    const sc = 0.5 + (y - 600) / 480, kind = i % 4;
    if (kind === 0) { // cow parsley: a lacy white umbel
      penLine(g, [[x, y], [x + 2, y - 30 * sc]], { color: '#6a7a48', w: 1.2, alpha: 0.8 });
      for (let k = 0; k < 9; k++) { g.fillStyle = 'rgba(250,248,240,0.92)'; g.beginPath(); g.arc(x + 2 + Math.cos(k * 0.7) * 9 * sc, y - 30 * sc - Math.abs(Math.sin(k * 0.7)) * 4 * sc, 2.2 * sc, 0, 7); g.fill(); }
    } else {
      const col = ['', '#f0c840', '#d86a7a', '#8cb0e0'][kind], st = 12 * sc;
      penLine(g, [[x, y], [x + 1, y - st]], { color: '#6a7a48', w: 1, alpha: 0.8 });
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; g.fillStyle = rgba(col, 0.92); g.beginPath(); g.arc(x + 1 + Math.cos(a) * 2.6 * sc, y - st + Math.sin(a) * 2.2 * sc, 2.2 * sc, 0, 7); g.fill(); }
      g.fillStyle = '#e8b040'; g.beginPath(); g.arc(x + 1, y - st, 1.3 * sc, 0, 7); g.fill();
    }
  }
  return { A, B, P, shape };
}
// reeds and forget-me-nots (live, so they can sway)
export function reedSpots(seed = 41) {
  const { A, B } = streamEdges(), r = rng(seed), out = [];
  for (const [E, i] of [[A, 40], [A, 70], [B, 30], [B, 62], [B, 88], [A, 95]]) { if (i >= E.length) continue; const [x, y] = E[i]; for (let k = 0; k < 3; k++) out.push({ x: x + r.gauss(0, 10), y: y + r.range(-4, 8), h: 30 + (y - 600) * 0.22, n: 3 + Math.floor(r() * 4), ph: r() * 6 }); }
  return out.sort((a, b) => a.y - b.y);
}
export function drawReeds(g, m, spots, t, sway = 0) {
  g.save(); g.lineCap = 'round';
  for (const s of spots) for (let k = 0; k < s.n; k++) {
    const b = Math.sin(t * 1.3 + s.ph + k) * 0.05 + sway, x = s.x + (k - s.n / 2) * 4, h = s.h * (0.7 + 0.3 * ((k * 7) % 3) / 2);
    g.strokeStyle = rgba(m.reed[k % 3], 0.9); g.lineWidth = 2;
    g.beginPath(); g.moveTo(x, s.y); g.quadraticCurveTo(x + Math.sin(b) * h * 0.5, s.y - h * 0.5, x + Math.sin(b * 1.6) * h, s.y - h); g.stroke();
    if (k % 2 === 0) { const tx = x + Math.sin(b * 1.6) * h, ty = s.y - h; g.fillStyle = '#7a5a3a'; g.beginPath(); g.ellipse(tx, ty + 6, 2.6, 7, b, 0, 7); g.fill(); }
  }
  g.restore();
}
// the old oak and the ant's door among its roots
export function paintOak(g, m) {
  const r = rng(77), x = OAK.x, gd = OAK.ground;
  const limb = (pts, w0, w1, sd) => {
    const L = [], Rr = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const w = (w0 + (w1 - w0) * i / (pts.length - 1)) / 2 * (1 + 0.12 * noise1(i * 1.7, sd));
      L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); Rr.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    const sh = smooth(L.concat(Rr.slice().reverse()));
    wash(g, sh, { color: '#8a7058', opacity: 0.97, seed: sd, under: true, bleed: 0.015 });
    g.save(); path(g, sh); g.clip(); g.filter = 'blur(4px)'; g.strokeStyle = rgba('#4a3a30', 0.45); g.lineWidth = w0 * 0.45; g.beginPath(); smooth(Rr, false).forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
    g.strokeStyle = rgba('#c8b090', 0.35); g.lineWidth = w0 * 0.2; g.beginPath(); smooth(L, false).forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke(); g.restore();
    hatch(g, sh, { count: Math.round(w0 * 8), len: Math.max(6, w0 * 0.4), dir: () => -Math.PI / 2 + 0.1, alpha: 0.4, width: 0.9, seed: sd + 1, curve: 0.5 });
    penLine(g, smooth(L, false), { w: 2, alpha: 0.85, seed: sd + 2 }); penLine(g, smooth(Rr, false), { w: 2.4, alpha: 0.85, seed: sd + 3 });
    return sh;
  };
  const clump = (cx, cy, rr, sd, cols = ['#6f8a46', '#7f9a52', '#5f7a3e']) => {
    const sh = fluffy(cx, cy, rr, rr * 0.72, 12, 0.22, sd);
    wash(g, sh, { color: cols[sd % 3], opacity: 1, seed: sd, under: '#4a5e34', bleed: 0.03, edge: 0.3 });
    g.save(); path(g, sh); g.clip(); g.filter = 'blur(8px)';
    g.fillStyle = rgba('#3f5130', 0.55); g.beginPath(); g.ellipse(cx + rr * 0.15, cy + rr * 0.55, rr, rr * 0.5, 0, 0, 7); g.fill();
    g.fillStyle = rgba('#b8c878', 0.5); g.beginPath(); g.ellipse(cx - rr * 0.25, cy - rr * 0.35, rr * 0.55, rr * 0.3, 0, 0, 7); g.fill(); g.restore();
    const rl = rng(sd + 3);
    for (let k = 0; k < rr * 1.4; k++) { // little lobed oak leaves
      const a = rl() * Math.PI * 2, d = Math.sqrt(rl()), lx = cx + Math.cos(a) * rr * d * 0.95, ly = cy + Math.sin(a) * rr * 0.7 * d;
      g.save(); g.translate(lx, ly); g.rotate(rl.range(-1, 1) + (lx - cx) / rr); g.fillStyle = rgba(rl() < 0.5 ? '#a8bc68' : '#56703a', 0.7);
      g.beginPath(); g.moveTo(-7, 0); for (let j = 0; j < 3; j++) { g.quadraticCurveTo(-4 + j * 4, -6, -2 + j * 4, -2); } g.lineTo(7, 0); for (let j = 0; j < 3; j++) { g.quadraticCurveTo(4 - j * 4, 6, 2 - j * 4, 2); } g.closePath(); g.fill(); g.restore();
    }
    ink(g, sh.slice(Math.floor(sh.length * 0.55)).concat(sh.slice(0, Math.floor(sh.length * 0.05))), { width: 1.1, alpha: 0.6, gaps: 1, seed: sd + 4 });
  };
  pool(g, x + 60, gd + 10, 340, 40, '#2a2a18', 0.28);
  // the crown's dark mass behind
  wash(g, fluffy(x + 10, 250, 300, 150, 11, 0.2, 701), { color: '#3f5130', opacity: 0.95, seed: 702, under: true, bleed: 0.03 });
  // trunk, roots and limbs
  limb([[x - 10, gd + 8], [x - 24, gd - 120], [x + 4, gd - 240], [x - 6, gd - 330]], 150, 92, 710);
  for (const [dx, dy, l] of [[-90, 14, 1], [-40, 18, 0.7], [70, 16, 1], [130, 14, 0.8]]) limb([[x + dx * 0.3, gd - 6], [x + dx * 0.8, gd + 4], [x + dx * 1.3 * l, gd + dy]], 46, 8, 720 + dx);
  limb([[x - 16, gd - 280], [x - 120, gd - 380], [x - 230, gd - 450]], 70, 24, 730);
  limb([[x - 4, gd - 300], [x + 10, gd - 420], [x - 10, gd - 520]], 64, 22, 731);
  // the long branch reaching out over the stream (the dove's perch)
  const branch = [[x + 10, gd - 300], [x + 160, gd - 340], [x + 330, gd - 362], [x + 470, gd - 376], [x + 600, gd - 386]];
  limb(branch, 62, 16, 732);
  for (const [bx, by] of [[x + 250, gd - 356], [x + 420, gd - 372]]) limb([[bx, by], [bx + 30, by - 50], [bx + 60, by - 80]], 14, 4, 740 + bx);
  // leaf clumps: the big crown, and a few small ones along the branch
  const spots = [[-150, 280, 120], [180, 260, 120], [10, 180, 150], [-90, 160, 110], [120, 170, 110], [-260, 330, 90], [280, 330, 80], [0, 300, 120], [-170, 200, 90], [170, 210, 90], [40, 110, 100]];
  for (const [i, [dx, cy, rr]] of spots.entries()) clump(x + dx, cy, rr, 800 + i * 7);
  for (const [i, [bx, by, rr]] of [[x + 290, gd - 420, 52], [x + 450, gd - 440, 44], [x + 560, gd - 420, 34]].entries()) clump(bx, by, rr, 900 + i * 7);
  for (let k = 0; k < 9; k++) { const ax = x + r.range(-300, 300), ay = r.range(300, 420); g.fillStyle = '#9a6a32'; g.beginPath(); g.ellipse(ax, ay + 6, 5, 7, 0, 0, 7); g.fill(); g.fillStyle = '#6a4a2a'; g.beginPath(); g.ellipse(ax, ay, 6, 4, 0, 0, 7); g.fill(); }
  const ok = { perch: [x + 520, gd - 398] };
  // the little door
  const [dx, dy] = DOOR;
  for (let k = 0; k < 7; k++) { const a = Math.PI * (1 + k / 6), sx = dx + Math.cos(a) * 30, sy = dy - 26 + Math.sin(a) * 32 * (k === 0 || k === 6 ? 0.4 : 1);
    const st = ellipse(sx, sy, 7, 5, 10, a + Math.PI / 2); wash(g, st, { color: '#b8ae9c', opacity: 0.97, seed: 80 + k, under: true, layers: 8 }); penLine(g, st, { closed: true, w: 0.9, alpha: 0.6 }); }
  const door = smooth([[dx - 22, dy], [dx - 22, dy - 26], [dx - 12, dy - 42], [dx, dy - 46], [dx + 12, dy - 42], [dx + 22, dy - 26], [dx + 22, dy]]);
  wash(g, door, { color: '#7a8a5a', opacity: 0.98, seed: 60, under: true });
  for (let k = 1; k < 3; k++) penLine(g, [[dx - 22 + k * 15, dy], [dx - 22 + k * 15, dy - 40]], { w: 0.9, alpha: 0.5 });
  penLine(g, door, { closed: true, w: 1.4, alpha: 0.85 });
  g.fillStyle = '#e8c070'; g.beginPath(); g.arc(dx + 14, dy - 18, 2.4, 0, 7); g.fill();
  const win = ellipse(dx + 42, dy - 34, 8, 8, 14); wash(g, win, { color: '#e8d090', opacity: 0.95, seed: 62, under: true }); penLine(g, win, { closed: true, w: 1.1, alpha: 0.8 }); penLine(g, [[dx + 34, dy - 34], [dx + 50, dy - 34]], { w: 0.8, alpha: 0.7 });
  for (let k = 0; k < 3; k++) { const st = ellipse(dx - 10 + k * 14, dy + 6 + k * 3, 9, 4, 10); wash(g, st, { color: '#c8bca8', opacity: 0.97, seed: 90 + k, under: true, layers: 8 }); penLine(g, st, { closed: true, w: 0.8, alpha: 0.6 }); }
  // a tiny mushroom and a lantern of a glow-worm
  const cap = smooth([[dx - 64, dy - 10], [dx - 56, dy - 22], [dx - 44, dy - 22], [dx - 36, dy - 10]]); wash(g, smooth([[dx - 52, dy + 2], [dx - 52, dy - 10], [dx - 48, dy - 10], [dx - 48, dy + 2]]), { color: '#f0e6d4', opacity: 0.97, seed: 95, under: true });
  wash(g, cap, { color: '#c05040', opacity: 0.97, seed: 96, under: true }); g.fillStyle = '#fff'; for (const [x, y] of [[dx - 54, dy - 16], [dx - 46, dy - 18]]) { g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill(); } penLine(g, cap, { closed: true, w: 0.9, alpha: 0.7 });
  return ok;
}
