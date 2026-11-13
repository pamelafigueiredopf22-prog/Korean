// The fells, the winding stony lane between dry-stone walls, the pine wood and the old apple tree,
// painted pen-and-wash (after the classic English storybook look): broken washes with the paper showing,
// and fine, broken ink lines on everything. Two moods: 'cold' (the Wind's day) and 'warm' (the Sun's day).
// Painters draw in the current ctx coordinates (a 1920x1080 page).
import { wash, pool, smooth, ellipse, fluffy, rng, rgba, shade, tint, mix, noise1, glaze, penLine, sprite, bbox, path, ink, sketch, hatch, clamp } from '../../engine/watercolor.js';

const INKC = '#3a2c24';
export const MOOD = {
  cold: { sky: ['#9aa8b8', '#c2c8cc', '#dcdad2'], cloud: '#e8e8e6', cloudShade: '#7a849a',
    fellFar: ['#a8a8c0', '#b8b4c8', '#9fa8bc'], fell: ['#b8ae96', '#a8a8b8', '#b4b48e', '#a89cb0'], heather: '#9a8aa8',
    field: ['#a8ac8a', '#b8b694', '#9ca484'], pine: ['#4a5c5a', '#566862', '#42524c'], grass: ['#8f9878', '#a4a684', '#7c866c'],
    lane: ['#d4cbb8', '#c4bcae', '#beb4a8'], stone: ['#b8b4aa', '#c4b8a0', '#a8a6a8', '#b4aa98'], leaves: ['#7f9060', '#6a7a52', '#8f9a68'], apple: '#b0564a',
    flowers: ['#c8b8c8', '#e0dcd0', '#c8b48a'], light: 0 },
  warm: { sky: ['#9cc4dc', '#e8e2c4', '#f6e2b2'], cloud: '#fdf6e6', cloudShade: '#e0c4a8',
    fellFar: ['#b4a8c8', '#c8b4c0', '#a8b0cc'], fell: ['#d8b878', '#c8a8b8', '#c4c07c', '#b89cb8'], heather: '#b88ab8',
    field: ['#b8c47c', '#d0c884', '#a8bc78'], pine: ['#4a6a58', '#58745c', '#40604e'], grass: ['#9cb064', '#b8bc6c', '#86a058'],
    lane: ['#e8dcc0', '#d8ccb4', '#cfc6b8'], stone: ['#d0c4aa', '#dcc8a0', '#c0b4b4', '#ccbc9c'], leaves: ['#7f9a52', '#6a8a48', '#9aaa5c'], apple: '#cc4a3a',
    flowers: ['#e89aa8', '#f4ead0', '#f0c050', '#c8a0d8', '#f8f4ec'], light: 1 },
};

// ---------------------------------------------------------------- brushwork
// Broken colour: a pale wash, then many loose brush strokes of varied colour along a direction,
// clipped to the shape, softened, with bits of paper left bare.
export function brushWash(g, shape, colors, o = {}) {
  const { seed = 1, count = 60, width = [18, 46], len = [80, 260], angle = () => 0, alpha = [0.16, 0.34], base = 0.3, blur = 0.9, edge = 0.25, under = false, lifts = 0.12 } = o;
  const r = rng(seed), b = bbox(shape);
  wash(g, shape, { color: colors[0], opacity: base, seed, bleed: 0.03, layers: 18, edge, under });
  g.save(); path(g, shape); g.clip(); g.lineCap = 'round'; g.filter = `blur(${blur}px)`;
  // pigment settles darker along the top edge of a wash
  g.save(); g.filter = 'blur(6px)'; g.strokeStyle = rgba(shade(colors[0], 0.25), 0.3); g.lineWidth = 10; path(g, shape); g.stroke(); g.restore();
  for (let i = 0; i < count; i++) {
    const x = r.range(b.x0 - 40, b.x1 + 40), y = r.range(b.y0, b.y1), a = angle(x, y) + r.gauss(0, 0.06), l = r.range(...len);
    g.strokeStyle = rgba(colors[i % colors.length], r.range(...alpha)); g.lineWidth = r.range(...width);
    const ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l, c = r.gauss(0, l * 0.06);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + ex) / 2 - Math.sin(a) * c, (y + ey) / 2 + Math.cos(a) * c, ex, ey); g.stroke();
  }
  // a few lifted streaks where the bare paper shows
  for (let i = 0; i < count * lifts; i++) {
    const x = r.range(b.x0, b.x1), y = r.range(b.y0, b.y1), a = angle(x, y), l = r.range(...len) * 0.6;
    g.save(); g.filter = 'blur(3px)'; g.strokeStyle = `rgba(250,244,230,${r.range(0.15, 0.35)})`; g.lineWidth = r.range(width[0] * 0.5, width[1] * 0.6);
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.5 + r.gauss(0, 4), x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); g.restore();
  }
  g.restore();
}
// short dry-brush flecks (heather, grass texture, distant scrub)
function flecks(g, shape, colors, o = {}) {
  const { seed = 3, count = 200, size = [3, 8], alpha = [0.2, 0.45], dy = 0.5 } = o;
  const r = rng(seed), b = bbox(shape);
  g.save(); path(g, shape); g.clip();
  for (let i = 0; i < count; i++) { const x = r.range(b.x0, b.x1), y = r.range(b.y0, b.y1), s = r.range(...size) * (o.scale ? o.scale(y) : 1);
    g.fillStyle = rgba(colors[i % colors.length], r.range(...alpha)); g.beginPath(); g.ellipse(x, y, s, s * dy, r.gauss(0, 0.2), 0, 7); g.fill(); }
  g.restore();
}
// grass flicks in ink and colour, standing up from a base line
function grassFlicks(g, x, y, h, o = {}) {
  const { seed = 5, n = 9, colors = ['#7f9068'], inkA = 0.55, lean = 0 } = o;
  const r = rng(seed);
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const bx = x + r.gauss(0, h * 0.25), a = -Math.PI / 2 + r.gauss(lean, 0.35), l = h * r.range(0.5, 1.1), c = r.gauss(0, 0.3);
    const ex = bx + Math.cos(a) * l, ey = y + Math.sin(a) * l;
    const isInk = r() < 0.45;
    g.strokeStyle = isInk ? rgba(INKC, inkA) : rgba(colors[i % colors.length], 0.8); g.lineWidth = isInk ? 0.9 : 1.6;
    g.beginPath(); g.moveTo(bx, y); g.quadraticCurveTo(bx + Math.cos(a + c) * l * 0.5, y + Math.sin(a + c) * l * 0.5, ex, ey); g.stroke();
  }
  g.restore();
}

// ---------------------------------------------------------------- the lane
export const LANE = [[380, 590], [560, 596], [740, 610], [880, 632], [968, 668], [956, 716], [870, 762], [800, 822], [812, 892], [905, 972], [1030, 1062], [1110, 1150], [1180, 1240], [1240, 1330]];
export const laneW = (y) => 12 + Math.pow(clamp((y - 588) / 552), 1.25) * 560;
function lanePath(n = 120) { return smooth(LANE, false, 10); }
function laneEdges() {
  const P = lanePath(), A = [], B = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = laneW(P[i][1]) / 2;
    A.push([P[i][0] - dy * w, P[i][1] + dx * w * 0.35]); B.push([P[i][0] + dy * w, P[i][1] - dx * w * 0.35]);
  }
  return { P, A, B };
}
// where is the middle of the lane at height y (nearest part of the lane)? used for placing the traveller
export function laneAt(y) { const P = lanePath(); let best = P[0]; for (const p of P) if (Math.abs(p[1] - y) < Math.abs(best[1] - y)) best = p; return best; }

function paintLane(g, m, seed = 70) {
  const { P, A, B } = laneEdges();
  const shape = A.concat(B.slice().reverse());
  const r = rng(seed);
  brushWash(g, shape, m.lane, { seed, count: 140, width: [8, 26], len: [40, 140], angle: (x, y) => 0.1, alpha: [0.14, 0.32], base: 0.45, under: '#f4ecdc', lifts: 0.2 });
  flecks(g, shape, ['#a49ab4', '#b8aaa0'], { seed: seed + 7, count: 300, size: [4, 14], alpha: [0.08, 0.2], dy: 0.3, scale: (y) => 0.3 + (y - 590) / 400 });
  // a grassy strip down the middle and soft wheel ruts
  const mid = P.map(([x, y]) => [x, y]), w = (y) => laneW(y);
  for (const off of [-0.22, 0.22]) {
    const rut = mid.map(([x, y], i) => [x + off * w(y) * 0.9, y]);
    ink(g, rut.filter((_, i) => i % 2 === 0), { color: shade(m.lane[2], 0.45), width: 1.2, alpha: 0.35, gaps: 2.5, seed: seed + (off > 0 ? 1 : 2) });
  }
  for (let i = 0; i < P.length; i += 2) { const [x, y] = P[i]; if (y < 700) continue; grassFlicks(g, x + r.gauss(0, 4), y, 4 + w(y) * 0.03, { seed: seed + 10 + i, n: 4, colors: m.grass, inkA: 0.35 }); }
  // cobbles and pebbles, bigger as they come nearer
  for (let i = 0; i < 520; i++) {
    const k = Math.floor(Math.pow(r(), 0.7) * (P.length - 1)), [px, py] = P[k];
    if (py < 600) continue;
    const ww = w(py), x = px + r.range(-0.48, 0.48) * ww, y = py + r.gauss(0, 3);
    const s = 1.2 + ww * 0.012 * r.range(0.6, 1.5);
    const peb = ellipse(x, y, s * 1.5, s * 0.75, 10);
    g.fillStyle = rgba('#7a7084', 0.18); g.beginPath(); g.ellipse(x + s * 0.3, y + s * 0.45, s * 1.5, s * 0.4, 0, 0, 7); g.fill();
    g.fillStyle = rgba(m.stone[Math.floor(r() * m.stone.length)], 0.85); path(g, peb); g.fill();
    g.fillStyle = 'rgba(255,250,240,0.45)'; g.beginPath(); g.ellipse(x - s * 0.3, y - s * 0.25, s * 0.7, s * 0.3, 0, 0, 7); g.fill();
    if (s > 2.4) ink(g, peb.slice(5, 10).concat([peb[0]]), { width: 0.9, alpha: 0.6, wobble: 0.3, seed: seed + 100 + i });
  }
  // the lane edges: broken pen lines with grass spilling over
  for (const E of [A, B]) ink(g, E.filter((_, i) => i % 2 === 0 && E[i][1] > 592), { width: 1.2, alpha: 0.6, gaps: 1.2, seed: seed + (E === A ? 3 : 4) });
  return { shape, A, B, P };
}

// ---------------------------------------------------------------- dry-stone walls
// A wall standing on a ground line E (far to near). h(y): wall height. Every stone is washed and inked.
function wall(g, E, m, seed, o = {}) {
  const { hk = 0.3, minY = 0, maxY = 9999 } = o;
  const r = rng(seed);
  const pts = E.filter(([x, y]) => y >= minY && y <= maxY);
  if (pts.length < 3) return;
  const H = (y) => 3 + laneW(y) * hk;
  // cumulative length along the base
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const at = (s) => { let i = 1; while (i < cum.length - 1 && cum[i] < s) i++; const k = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]; };
  const map = (s, v) => { const [x, y] = at(s); return [x, y - v * H(y)]; };
  const total = cum[cum.length - 1];
  // the wall's body: a shadowy grey band so gaps between stones read as dark
  const top = [], bot = [];
  for (let s = 0; s <= total; s += 6) { bot.push(map(s, -0.04)); top.push(map(s, 1.0)); }
  wash(g, bot.concat(top.reverse()), { color: shade(m.stone[2], 0.45), opacity: 0.8, seed, bleed: 0.01, layers: 10, edge: 0 });
  // stones in courses
  let s = 0;
  while (s < total) {
    const [, y] = at(s), h = H(y), rows = h < 10 ? 1 : h < 22 ? 2 : h < 46 ? 3 : 4, rh = 1 / rows;
    const step = Math.max(3, h * rh * r.range(1.1, 1.9));
    for (let k = 0; k < rows; k++) {
      const s0 = Math.min(total - 2, s + (k % 2 ? step * 0.45 : 0) + r.range(0, step * 0.15)), s1 = Math.min(total, s0 + step * r.range(0.75, 1.05));
      if (s1 - s0 < 2) continue;
      const v0 = k * rh + r.range(0, 0.04), v1 = (k + 1) * rh - r.range(0.02, 0.08);
      const bu = () => r.range(-0.05, 0.05), q = [map(s0, v0 + bu()), map((s0 + s1) / 2, v0 - 0.04 + bu()), map(s1, v0 + bu()), map(s1 + step * 0.06, (v0 + v1) / 2), map(s1, v1 + bu()), map((s0 + s1) / 2, v1 + 0.05 + bu()), map(s0, v1 + bu()), map(s0 - step * 0.06, (v0 + v1) / 2)];
      const st = smooth(q);
      const c = m.stone[Math.floor(r() * m.stone.length)];
      g.fillStyle = rgba(c, 0.95); path(g, st); g.fill();
      if (h > 14) { g.save(); path(g, st); g.clip(); const b = bbox(st); g.fillStyle = rgba(tint(c, 0.5), 0.65); g.beginPath(); g.ellipse(b.x0 + b.w * 0.4, b.y0 + b.h * 0.25, b.w * 0.4, b.h * 0.28, 0, 0, 7); g.fill(); g.fillStyle = rgba(shade(c, 0.35), 0.4); g.beginPath(); g.ellipse(b.x0 + b.w * 0.6, b.y1, b.w * 0.5, b.h * 0.3, 0, 0, 7); g.fill(); g.restore(); }
      if (h > 6) ink(g, st, { closed: true, width: h > 30 ? 1.4 : 0.9, alpha: 0.75, wobble: 0.3, gaps: 0.6, seed: seed + Math.round(s * 7 + k) });
    }
    // upright coping stones on top
    const cs = Math.max(2, h * 0.16);
    for (let c0 = s; c0 < s + step && c0 < total; c0 += cs * r.range(1.0, 1.3)) {
      const [bx, by] = map(c0, 1), ch = h * r.range(0.18, 0.26);
      const cap = smooth([[bx - cs * 0.5, by + 1], [bx - cs * 0.55, by - ch * 0.8], [bx - cs * 0.1, by - ch], [bx + cs * 0.5, by - ch * 0.85], [bx + cs * 0.5, by + 1]]);
      g.fillStyle = rgba(m.stone[Math.floor(r() * m.stone.length)], 0.95); path(g, cap); g.fill();
      if (h > 12) ink(g, cap, { closed: true, width: 0.8, alpha: 0.55, wobble: 0.3, gaps: 0.8, seed: seed + Math.round(c0 * 3) });
    }
    s += step;
  }
  // a few fence posts and tufts of grass at the foot of the wall
  for (let s2 = 30; s2 < total; s2 += r.range(120, 240)) {
    const [x, y] = at(s2), h = H(y);
    if (h > 18) grassFlicks(g, x, y + 2, h * 0.5, { seed: seed + s2, n: 10, colors: m.grass });
    if (h > 24 && r() < 0.35) { g.save(); g.strokeStyle = rgba('#7a6048', 0.9); g.lineWidth = Math.max(2, h * 0.07); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 2, y - h * 1.5); g.stroke(); ink(g, [[x - h * 0.035, y], [x - h * 0.035 + 2, y - h * 1.5]], { width: 0.9, alpha: 0.7 }); g.restore(); }
  }
}

// ---------------------------------------------------------------- a pine wood
function conifer(g, x, y, h, cols, seed) {
  const r = rng(seed), w = h * r.range(0.2, 0.3), tiers = 9;
  g.save(); g.strokeStyle = rgba('#4a3a30', 0.7); g.lineWidth = Math.max(1, h * 0.03); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h * 0.9); g.stroke(); g.restore();
  const L = [[x, y - h]], R = [[x, y - h]];
  for (let k = 1; k <= tiers; k++) {
    const t = k / tiers, yy = y - h + t * h * 0.88, ww = w * (0.25 + 0.75 * t) * r.range(0.85, 1.1);
    L.push([x - ww * r.range(0.8, 1.15), yy + h * 0.03]); L.push([x - ww * 0.45, yy - h * 0.025]);
    R.push([x + ww * r.range(0.8, 1.15), yy + h * 0.03]); R.push([x + ww * 0.45, yy - h * 0.025]);
  }
  const sh = L.concat(R.reverse());
  const c = cols[seed % cols.length];
  g.fillStyle = rgba(c, 0.92); path(g, sh); g.fill();
  g.save(); path(g, sh); g.clip(); g.fillStyle = rgba(shade(c, 0.35), 0.55); g.fillRect(x, y - h, w * 1.2, h); g.fillStyle = rgba(tint(c, 0.25), 0.35); g.fillRect(x - w * 1.2, y - h, w * 0.7, h); g.restore();
  ink(g, L, { width: 0.8, alpha: 0.55, wobble: 0.3, gaps: 0.6, seed: seed + 1, taper: false });
  ink(g, R, { width: 0.8, alpha: 0.4, wobble: 0.3, gaps: 1.2, seed: seed + 2, taper: false });
}
function pineWood(g, m, x0, x1, yBase, seed) {
  const r = rng(seed), trees = [];
  for (let i = 0; i < 130; i++) { const x = r.range(x0, x1), edge = Math.min(x - x0, x1 - x) / (x1 - x0); trees.push([x, yBase + r.range(-26, 12) - edge * 24, r.range(40, 96) * (0.6 + Math.min(1, edge * 4) * 0.7), i]); }
  trees.sort((a, b) => a[1] - b[1]);
  const top = []; for (let x = x0 - 20; x <= x1 + 20; x += 16) { const e = Math.min(x - x0, x1 - x) / (x1 - x0); top.push([x, yBase - 30 - Math.min(1, Math.max(0, e) * 4) * 50 + noise1(x * 0.05, seed) * 8]); }
  wash(g, top.concat([[x1 + 20, yBase + 12], [x0 - 20, yBase + 12]]), { color: shade(m.pine[2], 0.2), opacity: 0.9, seed, bleed: 0.02, layers: 16 });
  for (const [x, y, h, i] of trees) conifer(g, x, y, h, m.pine, seed * 10 + i);
}

// ---------------------------------------------------------------- the whole landscape
// a soft cumulus: paper-white body, a cool shadow glazed into its lower half, pen on the sunny top only
export function cumulus(g, m, cx, cy, w, seed) {
  const r = rng(seed), bumps = [];
  for (let i = 0; i < 7; i++) { const u = (i / 6) * 2 - 1; bumps.push([cx + u * w * 0.8, cy - (1 - u * u) * w * 0.22 + r.gauss(0, w * 0.03), w * r.range(0.22, 0.32) * (1.2 - Math.abs(u) * 0.5)]); }
  const shapes = bumps.map(([x, y, rr], i) => fluffy(x, y, rr, rr * 0.8, 7, 0.18, seed + i));
  const base = smooth([[cx - w * 0.95, cy + w * 0.08], [cx + w * 0.95, cy + w * 0.08], [cx + w * 0.7, cy + w * 0.15], [cx - w * 0.7, cy + w * 0.15]]);
  g.save(); g.filter = 'blur(1.2px)';
  for (const sh of shapes.concat([base])) { g.fillStyle = rgba(m.cloud, 0.95); path(g, sh); g.fill(); }
  g.restore();
  g.save(); g.beginPath(); for (const sh of shapes.concat([base])) { g.moveTo(...sh[0]); for (const p of sh) g.lineTo(...p); g.closePath(); } g.clip();
  g.filter = 'blur(14px)'; g.fillStyle = rgba(m.cloudShade, 0.55); g.beginPath(); g.ellipse(cx + w * 0.1, cy + w * 0.16, w * 0.95, w * 0.16, 0, 0, 7); g.fill();
  g.fillStyle = rgba(m.cloudShade, 0.3); for (const [x, y, rr] of bumps) { g.beginPath(); g.ellipse(x + rr * 0.3, y + rr * 0.45, rr * 0.7, rr * 0.35, 0, 0, 7); g.fill(); }
  g.restore();
  for (const [i, sh] of shapes.entries()) ink(g, sh.filter(([x, y]) => y < bumps[i][1] - bumps[i][2] * 0.25), { width: 0.9, alpha: 0.42, gaps: 1.4, seed: seed + 20 + i });
}
export const CLOUDS = [[250, 170, 230], [960, 110, 280], [1720, 200, 210], [600, 330, 120], [1380, 300, 140]];
export function paintSky(g, m, seed = 3, o = {}) {
  const grd = g.createLinearGradient(0, -100, 0, 640);
  grd.addColorStop(0, m.sky[0]); grd.addColorStop(0.6, m.sky[1]); grd.addColorStop(1, m.sky[2]);
  g.fillStyle = '#f4ecdc'; g.fillRect(-400, -300, 2720, 1700);
  g.globalAlpha = 0.85; g.fillStyle = grd; g.fillRect(-400, -300, 2720, 1700); g.globalAlpha = 1;
  brushWash(g, [[-400, -300], [2320, -300], [2320, 560], [-400, 560]], [m.sky[0], tint(m.sky[0], 0.3), m.sky[1], shade(m.sky[0], 0.1)], { seed, count: 70, width: [30, 80], len: [200, 600], alpha: [0.12, 0.3], base: 0.05, blur: 3, angle: () => -0.04, lifts: 0.15 });
  if (o.clouds !== false) CLOUDS.forEach(([cx, cy, cw], i) => cumulus(g, m, cx, cy, cw, seed * 50 + i * 13));
}
export function paintLand(g, m, seed = 11) {
  const r = rng(seed);
  const hill = (pts) => smooth(pts, false, 6);
  // far fells: blue-lilac, misty, two summits
  const far = hill([[-400, 440], [-120, 380], [180, 318], [430, 262], [600, 240], [760, 258], [920, 312], [1080, 358], [1240, 372], [1420, 352], [1640, 300], [1860, 276], [2320, 300]]);
  brushWash(g, far.concat([[2320, 900], [-400, 900]]), m.fellFar, { seed: seed + 1, count: 90, width: [24, 60], angle: (x) => x < 600 ? -0.35 : 0.25, alpha: [0.12, 0.26], base: 0.5, under: true });
  sketch(g, far, { alpha: 0.5, width: 1.2, seed: seed + 2 });
  { const farSh = far.concat([[2320, 900], [-400, 900]]);
    flecks(g, farSh, [shade(m.fellFar[0], 0.15), tint(m.heather, 0.2)], { seed: seed + 40, count: 500, size: [4, 12], alpha: [0.08, 0.2], dy: 0.35 });
    g.save(); path(g, farSh); g.clip(); // contour strokes following the slopes, like the folds of the fells
    for (let i = 0; i < 22; i++) { const x = r.range(-100, 1700), yTop = far.reduce((b, p) => Math.abs(p[0] - x) < Math.abs(b[0] - x) ? p : b)[1], y = yTop + r.range(20, 120), sl = x < 600 ? -0.35 : 0.3;
      ink(g, [[x, y], [x + 60, y + sl * 60 + 4], [x + 120, y + sl * 120 + 2]], { width: 0.8, alpha: 0.28, gaps: 2, seed: seed + 50 + i }); }
    g.restore(); }
  // a lighter, nearer ridge on the left
  const left = hill([[-400, 470], [-100, 440], [200, 452], [460, 500], [700, 548], [1000, 600]]);
  brushWash(g, left.concat([[1000, 900], [-400, 900]]), [m.fell[2], m.fell[0], m.heather], { seed: seed + 9, count: 60, angle: () => 0.12, alpha: [0.14, 0.28], base: 0.5, under: true });
  sketch(g, left, { alpha: 0.5, width: 1.1, seed: seed + 10 });
  // the big near fell on the right: ochre grass and purple heather, with gullies running down
  const fell = hill([[780, 600], [1000, 520], [1200, 440], [1420, 380], [1640, 344], [1880, 330], [2320, 340]]);
  const fellSh = fell.concat([[2320, 900], [780, 900]]);
  brushWash(g, fellSh, m.fell, { seed: seed + 3, count: 160, width: [20, 54], angle: (x, y) => -0.32 + (x - 1000) / 4000, alpha: [0.14, 0.3], base: 0.5, under: true });
  flecks(g, fellSh, [m.heather, shade(m.heather, 0.15), tint(m.heather, 0.3)], { seed: seed + 4, count: 1100, size: [3, 10], alpha: [0.15, 0.4], dy: 0.4 });
  g.save(); path(g, fellSh); g.clip();
  for (let i = 0; i < 10; i++) { const x = 1050 + i * 120 + r.gauss(0, 30), y0 = 420 - i * 6 + r.gauss(0, 10); ink(g, [[x, y0], [x - 14, y0 + 50], [x - 30, y0 + 110]], { width: 0.8, alpha: 0.35, gaps: 1.5, seed: seed + 20 + i }); }
  g.restore();
  sketch(g, fell, { alpha: 0.6, width: 1.3, seed: seed + 5 });
  // the pine wood along the valley
  pineWood(g, m, 160, 1240, 545, seed + 6);
  // patchwork fields with little stone walls dividing them, and sheep
  const fields = smooth([[-400, 552], [300, 548], [700, 550], [1000, 556], [1300, 592], [1500, 604], [2320, 596], [2320, 1400], [-400, 1400]]);
  brushWash(g, fields, m.field, { seed: seed + 7, count: 150, angle: () => 0.04, width: [12, 36], alpha: [0.16, 0.34], base: 0.4, under: true, lifts: 0.15 });
  for (let i = 0; i < 7; i++) { // field walls running across the valley
    const y = 572 + i * 9 + r.range(0, 6), xa = r.range(-200, 900), xb = xa + r.range(300, 900);
    const sl = r.range(-0.03, 0.03), pts = []; for (let x = xa; x < xb; x += 24) pts.push([x, y + Math.sin(x / 400 + i) * 3 + (x - xa) * sl]);
    ink(g, pts, { width: 0.9, alpha: 0.45, gaps: 0.8, wobble: 0.3, seed: seed + 30 + i });
    for (let k = 0; k < pts.length; k += 1) { g.fillStyle = rgba(m.stone[2], 0.7); g.beginPath(); g.ellipse(pts[k][0], pts[k][1] - 1.5, 3, 1.6, 0, 0, 7); g.fill(); }
  }
  for (let i = 0; i < 14; i++) { const x = r.range(1250, 1900), y = r.range(585, 640); g.fillStyle = 'rgba(250,246,236,0.95)'; g.beginPath(); g.ellipse(x, y, 5, 3.2, 0, 0, 7); g.fill(); g.fillStyle = rgba(INKC, 0.8); g.beginPath(); g.arc(x + 5, y - 1, 1.6, 0, 7); g.fill(); ink(g, [[x - 5, y], [x, y + 3.2], [x + 5, y]], { width: 0.6, alpha: 0.5 }); }
  // the meadow nearer by, with heather and grass texture
  const meadow = smooth([[-400, 640], [500, 630], [1200, 655], [2320, 650], [2320, 1400], [-400, 1400]]);
  brushWash(g, meadow, m.grass.concat([m.fell[0], m.field[1]]), { seed: seed + 8, count: 420, angle: (x, y) => -0.05 + noise1(x * 0.003, seed) * 0.5, width: [8, 34], len: [30, 160], alpha: [0.12, 0.3], base: 0.4, under: true, lifts: 0.15 });
  hatch(g, meadow, { color: shade(m.grass[2], 0.35), count: 7000, len: 9, width: 1, alpha: 0.4, seed: seed + 12, dir: () => -Math.PI / 2 + 0.15, curve: 0.5, density: (x, y) => 0.25 + 0.75 * Math.max(0, noise1(x * 0.006 + y * 0.004, seed + 3)) });
  hatch(g, meadow, { color: INKC, count: 2400, len: 8, width: 0.8, alpha: 0.35, seed: seed + 13, dir: () => -Math.PI / 2, curve: 0.5, density: (x, y) => (y - 640) / 440 });
  flecks(g, meadow, [m.heather, tint(m.heather, 0.3)], { seed: seed + 9, count: 260, size: [4, 10], alpha: [0.12, 0.3], dy: 0.45, scale: (y) => 0.5 + (y - 640) / 400 });
  for (let i = 0; i < 260; i++) { const x = r.range(-80, 2000), y = r.range(650, 1100); grassFlicks(g, x, y, 5 + (y - 640) * 0.05, { seed: seed + 100 + i, n: 5, colors: m.grass, inkA: 0.4 }); }
}
// paint the lane and the walls. Walls with their foot nearer than splitY go on a separate front layer.
export function paintLaneAndWalls(gBack, gFront, m, splitY = 9999, seed = 90) {
  const L = paintLane(gBack, m, seed);
  const { A, B } = L;
  const out = (E, k) => E.map(([x, y], i) => { const P = L.P[i]; const dx = x - P[0], dy = y - P[1], d = Math.hypot(dx, dy) || 1; const o = laneW(y) * 0.06 + 2; return [x + dx / d * o, y + dy / d * o]; });
  const WA = out(A), WB = out(B);
  // back pieces first (far to near), then front pieces
  wall(gBack, WA, m, seed + 1, { maxY: splitY });
  wall(gBack, WB, m, seed + 2, { maxY: splitY, minY: 610 });
  if (gFront) { wall(gFront, WA, m, seed + 3, { minY: splitY - 2 }); wall(gFront, WB, m, seed + 4, { minY: splitY - 2 }); }
  return L;
}

// meadow flowers that can open; returns spots so the story can animate them
export function flowerSpots(seed = 31) {
  const r = rng(seed), out = [];
  for (let i = 0; i < 150; i++) {
    const y = r.range(690, 1070), x = r.range(20, 1900), c = laneAt(y);
    if (Math.abs(x - c[0]) < laneW(y) * 0.7) continue;
    out.push({ x, y, c: i, s: 4.5 + (y - 690) * 0.026, ph: r() * 6 });
  }
  return out.sort((a, b) => a.y - b.y);
}
export function drawFlowers(g, m, spots, open, t = 0, sway = 0) {
  for (const f of spots) {
    const col = m.flowers[f.c % m.flowers.length], st = 8 + f.s * 2.4;
    g.save(); g.translate(f.x, f.y); g.rotate(Math.sin(t * 2 + f.ph) * 0.05 + sway);
    g.strokeStyle = rgba('#5f7048', 0.8); g.lineWidth = 1.1; g.beginPath(); g.moveTo(0, st); g.quadraticCurveTo(2, st / 2, 0, 0); g.stroke();
    const o = clamp(open * 1.3 - (f.ph / 6) * 0.3);
    if (o < 0.12) { g.fillStyle = rgba(shade(col, 0.2), 0.9); g.beginPath(); g.ellipse(0, -f.s * 0.3, f.s * 0.35, f.s * 0.75, 0, 0, 7); g.fill(); g.strokeStyle = rgba(INKC, 0.5); g.lineWidth = 0.7; g.stroke(); }
    else {
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + f.ph; g.fillStyle = rgba(col, 0.9); g.beginPath(); g.ellipse(Math.cos(a) * f.s * 0.6 * o, Math.sin(a) * f.s * 0.45 * o, f.s * (0.3 + 0.38 * o), f.s * 0.3, a, 0, 7); g.fill(); }
      g.fillStyle = rgba('#d89a30', 0.95); g.beginPath(); g.arc(0, 0, f.s * 0.28, 0, 7); g.fill();
    }
    g.restore();
  }
}

// ---------------------------------------------------------------- the old apple tree
export const TREE = { x: 1590, ground: 880 };
export function appleTree(m, seed = 51) {
  const { x, ground } = TREE, r = rng(seed);
  const limb = (g, pts, w0, w1, sd) => {
    const L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const w = (w0 + (w1 - w0) * i / (pts.length - 1)) / 2 * (1 + 0.12 * noise1(i * 1.7, sd));
      L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
    }
    const sh = smooth(L.concat(R.slice().reverse()));
    wash(g, sh, { color: '#8a7058', opacity: 0.95, seed: sd, under: true, bleed: 0.015 });
    g.save(); path(g, sh); g.clip(); g.filter = 'blur(3px)'; g.strokeStyle = rgba('#4a3a30', 0.45); g.lineWidth = w0 * 0.45; g.beginPath(); smooth(R, false).forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke(); g.restore();
    hatch(g, sh, { count: Math.round(w0 * 6), len: w0 * 0.5, dir: () => -Math.PI / 2 + 0.1, alpha: 0.4, width: 0.9, seed: sd + 1, curve: 0.4 });
    penLine(g, smooth(L, false), { w: 2, alpha: 0.85, seed: sd + 2 }); penLine(g, smooth(R, false), { w: 2.4, alpha: 0.85, seed: sd + 3 });
  };
  const trunkS = sprite({ x0: x - 360, y0: ground - 560, x1: x + 360, y1: ground + 40, w: 720, h: 600 }, 1, (g) => {
    pool(g, x - 10, ground + 8, 280, 34, '#3a3020', 0.28);
    grassFlicks(g, x, ground + 6, 26, { seed: seed + 90, n: 26, colors: m.grass });
    limb(g, [[x + 4, ground + 6], [x - 14, ground - 90], [x + 12, ground - 180], [x - 4, ground - 260]], 92, 56, seed + 1);
    limb(g, [[x - 10, ground - 220], [x - 100, ground - 300], [x - 190, ground - 330], [x - 280, ground - 380]], 46, 12, seed + 2);
    limb(g, [[x + 6, ground - 230], [x + 110, ground - 300], [x + 220, ground - 330], [x + 290, ground - 390]], 44, 12, seed + 3);
    limb(g, [[x - 4, ground - 250], [x - 30, ground - 360], [x + 10, ground - 470]], 40, 12, seed + 4);
    for (const [dx, dy] of [[-56, 6], [58, 8]]) limb(g, [[x + dx * 0.4, ground - 6], [x + dx, ground + dy]], 30, 8, seed + 5 + dx);
    // a knot hole and bark curls
    wash(g, ellipse(x + 8, ground - 120, 9, 14, 14), { color: '#3a2a20', opacity: 0.9, seed: seed + 8 }); ink(g, ellipse(x + 8, ground - 120, 12, 17, 14), { closed: true, width: 1.2, alpha: 0.7 });
  });
  const mass = sprite({ x0: x - 440, y0: ground - 740, x1: x + 440, y1: ground - 200, w: 880, h: 540 }, 1, (g) => {
    wash(g, fluffy(x, ground - 450, 330, 180, 11, 0.2, seed + 9), { color: shade(m.leaves[1], 0.45), opacity: 1, seed: seed + 10, under: true, bleed: 0.03 });
  });
  const clumps = [];
  const spots = [[-230, -400, 120], [230, -410, 120], [0, -560, 150], [-120, -520, 130], [130, -520, 130], [-310, -340, 90], [310, -350, 90], [-60, -400, 120], [80, -390, 120], [-200, -560, 100], [200, -570, 100], [0, -660, 100], [-110, -640, 90], [110, -650, 90]];
  for (const [i, [dx, dy, rr]] of spots.entries()) {
    const cx = x + dx, cy = ground + dy, sd = seed + 20 + i * 7;
    const apples = []; for (let k = 0; k < 3; k++) apples.push([cx + r.range(-rr * 0.55, rr * 0.55), cy + r.range(-rr * 0.1, rr * 0.5)]);
    clumps.push({ cx, cy, ph: r() * 6, s: sprite({ x0: cx - rr * 1.2, y0: cy - rr, x1: cx + rr * 1.2, y1: cy + rr, w: rr * 2.4, h: rr * 2 }, 1, (g) => {
      const sh = fluffy(cx, cy, rr, rr * 0.72, 12, 0.22, sd);
      wash(g, sh, { color: m.leaves[i % 3], opacity: 1, seed: sd, under: shade(m.leaves[1], 0.3), bleed: 0.03, edge: 0.3 });
      g.save(); path(g, sh); g.clip(); g.filter = 'blur(6px)';
      g.fillStyle = rgba(shade(m.leaves[1], 0.45), 0.55); g.beginPath(); g.ellipse(cx + rr * 0.15, cy + rr * 0.55, rr, rr * 0.5, 0, 0, 7); g.fill();
      g.fillStyle = rgba(tint(m.leaves[2], 0.45), 0.6); g.beginPath(); g.ellipse(cx - rr * 0.25, cy - rr * 0.35, rr * 0.55, rr * 0.3, 0, 0, 7); g.fill();
      g.restore();
      // individual leaves: little pointed dabs with a stroke of ink here and there
      const rl = rng(sd + 3);
      for (let k = 0; k < rr * 1.6; k++) {
        const a = rl() * Math.PI * 2, d = Math.sqrt(rl()), lx = cx + Math.cos(a) * rr * d * 0.95, ly = cy + Math.sin(a) * rr * 0.7 * d, la = rl.range(-1, 1) + (lx - cx) / rr;
        g.save(); g.translate(lx, ly); g.rotate(la); g.fillStyle = rgba(rl() < 0.5 ? tint(m.leaves[2], 0.25) : shade(m.leaves[0], 0.2), 0.75);
        g.beginPath(); g.moveTo(-7, 0); g.quadraticCurveTo(0, -4.5, 7, 0); g.quadraticCurveTo(0, 4.5, -7, 0); g.fill();
        if (rl() < 0.3) { g.strokeStyle = rgba(INKC, 0.55); g.lineWidth = 0.7; g.stroke(); }
        g.restore();
      }
      ink(g, sh.slice(Math.floor(sh.length * 0.55)).concat(sh.slice(0, Math.floor(sh.length * 0.05))), { width: 1.1, alpha: 0.6, gaps: 1, seed: sd + 4 });
      for (const [ax, ay] of apples) {
        const ap = ellipse(ax, ay, 9, 8.5, 16);
        wash(g, ap, { color: m.apple, opacity: 1, seed: Math.round(ax + ay), under: true, layers: 10, edge: 0.4 });
        glaze(g, ap, ax - 3, ay - 3, 4, 3, '#fff0e0', 0.8);
        ink(g, ap, { closed: true, width: 0.9, alpha: 0.7, wobble: 0.2 });
        g.strokeStyle = rgba('#4a3a28', 0.9); g.lineWidth = 1.3; g.beginPath(); g.moveTo(ax, ay - 8); g.lineTo(ax + 2, ay - 13); g.stroke();
      }
    }) });
  }
  clumps.sort((a, b) => b.cy - a.cy);
  return { trunk: trunkS, mass, clumps };
}
// bend 0..1 leans the crown away from the wind (to the left), t for flutter
export function drawAppleTree(g, tree, t = 0, bend = 0, drawSprite) {
  const { x, ground } = TREE, pivot = ground - 260;
  g.save(); g.translate(x, pivot); g.rotate(-bend * 0.05 + Math.sin(t * 0.7) * 0.004); g.translate(-x, -pivot); drawSprite(g, tree.mass); g.restore();
  drawSprite(g, tree.trunk);
  for (const c of tree.clumps) {
    const h = pivot - c.cy, ab = Math.abs(bend), sw = Math.sin(t * (0.8 + ab * 5) + c.ph) * (0.006 + ab * 0.025);
    g.save(); g.translate(x, pivot); g.rotate(-bend * 0.05 * (1 + h / 400) + sw); g.translate(-x, -pivot); drawSprite(g, c.s); g.restore();
  }
}

// a drifting cumulus as a sprite (same painting as the sky's own clouds)
export function cloudSprite(m, cx, cy, cw, seed) {
  return sprite({ x0: cx - cw * 1.2, y0: cy - cw * 0.6, x1: cx + cw * 1.2, y1: cy + cw * 0.6, w: cw * 2.4, h: cw * 1.2 }, 1, (g) => cumulus(g, m, cx, cy, cw, seed), { granulate: false });
}
