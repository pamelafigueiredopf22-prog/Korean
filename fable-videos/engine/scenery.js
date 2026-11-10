// Reusable painted scenery: trees, foliage, grass, flowers, mushrooms, ferns, hills, clouds.
// All painters draw in the current ctx coordinates with the watercolor engine.
import { wash, ink, strokes, pool, ellipse, smooth, ribbon, fluffy, bbox, rng, rgba, shade, tint, mix, path, speckle, shadeEdge, pencil, glaze, penLine, hatch } from './watercolor.js';

export const PAL = {
  olive: '#8f9a5b', sage: '#9fae84', moss: '#6f7d4c', deep: '#4f5d3c', ochre: '#c9a24f', gold: '#e2b86a',
  rust: '#b8603a', bark: '#7b5a44', barkDark: '#4d3628', cream: '#f3e3c3', pink: '#d99a8e', rose: '#c46e62',
  lavender: '#b4a2b6', dusk: '#e7c2a2', sky: '#f2d9b4', berry: '#b5443a', teal: '#7e9a8e',
};

// a cluster of leafy blobs (tree crowns, bushes)
export function foliage(g, cx, cy, rx, ry, opts = {}) {
  const { seed = 1, colors = [PAL.olive, PAL.moss, PAL.ochre, PAL.sage], blobs = 9, opacity = 0.8, haze = 0, detail = true } = opts;
  const r = rng(seed);
  const col = (c) => haze ? mix(c, opts.hazeColor || PAL.sky, haze) : c;
  // dark underside first, light top last
  const items = [];
  for (let i = 0; i < blobs; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    const x = cx + Math.cos(a) * rx * d * 0.75, y = cy + Math.sin(a) * ry * d * 0.75;
    items.push([y, x, r.range(0.35, 0.6)]);
  }
  items.sort((a, b) => b[0] - a[0]);
  wash(g, fluffy(cx, cy + ry * 0.1, rx, ry * 0.9, 9, 0.22, seed + 1), { color: col(shade(colors[1], 0.15)), opacity: opacity * 0.7, seed: seed + 2, bleed: 0.06 });
  items.forEach(([y, x, k], i) => {
    const c = colors[i % colors.length];
    // loose dabs: some round, some scalloped, all a bit different
    const shape = r() < 0.5 ? ellipse(x, y, rx * k, ry * k * r.range(0.6, 0.9), 22, r.gauss(0, 0.3))
      : fluffy(x, y, rx * k, ry * k * 0.8, 5 + Math.floor(r() * 5), r.range(0.1, 0.3), seed + 10 + i);
    wash(g, shape, { color: col(c), opacity: opacity * r.range(0.5, 0.85), seed: seed + 30 + i, bleed: r.range(0.07, 0.13), layers: 24 });
  });
  // individual painted leaves: darker underneath, sunlit on top, breaking the silhouette
  if (opts.leaves !== false) {
    const n = Math.round((rx * ry) / (opts.leafDensity || 95));
    const ls = opts.leafSize || Math.max(6, Math.min(16, rx / 11));
    const lit = (c) => col(tint(c, 0.25));
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2, d = Math.pow(r(), 0.45);
      const x = cx + Math.cos(a) * rx * d * 1.02, y = cy + Math.sin(a) * ry * d * 1.02;
      const up = (cy - y) / ry; // -1 bottom .. 1 top
      const base = colors[Math.floor(r() * colors.length)];
      const c = up > 0.15 && r() < 0.6 ? lit(base) : up < -0.3 ? col(shade(base, 0.25)) : col(base);
      const L = ls * r.range(0.7, 1.3), ang = a + r.gauss(0, 0.6) + Math.PI / 2 * (r() < 0.5 ? 1 : -1) * 0.3;
      g.save(); g.translate(x, y); g.rotate(ang);
      g.fillStyle = rgba(c, opacity * r.range(0.55, 0.9));
      g.beginPath(); g.moveTo(-L, 0); g.quadraticCurveTo(0, -L * 0.48, L, 0); g.quadraticCurveTo(0, L * 0.48, -L, 0); g.fill();
      if (r() < 0.25 && !haze) { g.strokeStyle = rgba(PAL.deep, 0.3); g.lineWidth = 0.7; g.beginPath(); g.moveTo(-L * 0.8, 0); g.lineTo(L * 0.8, 0); g.stroke(); }
      g.restore();
    }
    const outline = fluffy(cx, cy, rx * 0.95, ry * 0.95, 10, 0.2, seed + 7);
    shadeEdge(g, outline, { color: col(PAL.deep), alpha: 0.28 * opacity, width: ry * 0.35, dy: -ry * 0.18 });
  }
  if (detail) {
    strokes(g, fluffy(cx, cy, rx, ry, 9, 0.2, seed + 3), { color: col(PAL.deep), count: Math.round(rx * ry / 300), len: 7, width: 1.6, alpha: 0.35 * opacity, seed: seed + 4, dir: () => 1.2, curve: 0.6 });
    speckle(g, { x0: cx - rx * 0.7, x1: cx + rx * 0.7, y0: cy - ry * 0.7, y1: cy + ry * 0.4 }, { color: tint(colors[2] || PAL.ochre, 0.3), count: Math.round(rx / 3), size: 3, alpha: 0.5 * opacity, seed: seed + 5 });
  }
}

// a tapered trunk with bark strokes, from base (x,y) up to top
export function trunk(g, pts, w0, w1, opts = {}) {
  const { seed = 1, color = PAL.bark, opacity = 0.9, haze = 0, under = false } = opts;
  const col = (c) => haze ? mix(c, opts.hazeColor || PAL.sky, haze) : c;
  const shape = ribbon(pts, w0, w1);
  wash(g, shape, { color: col(color), opacity, seed, bleed: 0.025, under });
  const b = bbox(shape);
  wash(g, ribbon(pts.map(([x, y]) => [x + w0 * 0.22, y]), w0 * 0.45, w1 * 0.4), { color: col(shade(color, 0.3)), opacity: opacity * 0.4, seed: seed + 1, edge: 0 });
  strokes(g, shape, { color: col(PAL.barkDark), count: Math.round(b.h * b.w / 500), len: 22, width: 1.3, alpha: 0.35 * opacity, seed: seed + 2, dir: () => -Math.PI / 2, curve: 0.15 });
  if (!haze) ink(g, pts.map(([x, y], i) => [x - (w0 + (w1 - w0) * i / (pts.length - 1)) / 2, y]), { alpha: 0.35, seed: seed + 3, gaps: 1.5 });
}

// a tuft of grass blades from (x, y)
export function grass(g, x, y, opts = {}) {
  const { seed = 1, h = 40, n = 9, colors = [PAL.olive, PAL.moss, PAL.sage, PAL.ochre], alpha = 0.75, spread = 0.9, width = 3.2, lean = 0 } = opts;
  const r = rng(seed);
  g.save();
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + lean + r.gauss(0, spread * 0.4);
    const L = h * r.range(0.5, 1.15), bend = r.gauss(0, 0.35) + lean;
    const bx = x + r.gauss(0, h * 0.08);
    const tx = bx + Math.cos(a) * L + bend * L * 0.3, ty = y + Math.sin(a) * L;
    const mx = bx + Math.cos(a) * L * 0.5, my = y + Math.sin(a) * L * 0.5;
    const w = width * r.range(0.6, 1.3);
    g.fillStyle = rgba(r.pick(colors), alpha * r.range(0.6, 1));
    g.beginPath(); g.moveTo(bx - w, y);
    g.quadraticCurveTo(mx - w * 0.6, my, tx, ty);
    g.quadraticCurveTo(mx + w * 0.6, my, bx + w, y);
    g.closePath(); g.fill();
  }
  g.restore();
}

// little five-petal flower on a stem
export function flower(g, x, y, opts = {}) {
  const { seed = 1, size = 7, color = PAL.pink, stem = 18 } = opts;
  const r = rng(seed);
  g.save();
  g.strokeStyle = rgba(PAL.moss, 0.7); g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(x, y + stem); g.quadraticCurveTo(x + r.gauss(0, 3), y + stem / 2, x, y); g.stroke();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + r() ;
    g.fillStyle = rgba(color, 0.75);
    g.beginPath(); g.ellipse(x + Math.cos(a) * size * 0.55, y + Math.sin(a) * size * 0.55, size * 0.55, size * 0.38, a, 0, 7); g.fill();
  }
  g.fillStyle = rgba('#e8b04a', 0.9); g.beginPath(); g.arc(x, y, size * 0.28, 0, 7); g.fill();
  g.restore();
}

export function berries(g, x, y, opts = {}) {
  const { seed = 1, n = 4, size = 5, color = PAL.berry } = opts;
  const r = rng(seed);
  g.save();
  g.strokeStyle = rgba(PAL.moss, 0.7); g.lineWidth = 1.2;
  for (let i = 0; i < n; i++) {
    const bx = x + r.gauss(0, size * 1.6), by = y + r.gauss(0, size * 1.2);
    g.beginPath(); g.moveTo(x, y + size * 4); g.quadraticCurveTo(bx, by + size * 2, bx, by); g.stroke();
    g.fillStyle = rgba(color, 0.85); g.beginPath(); g.arc(bx, by, size * r.range(0.8, 1.1), 0, 7); g.fill();
    g.fillStyle = 'rgba(255,240,220,0.6)'; g.beginPath(); g.arc(bx - size * 0.3, by - size * 0.3, size * 0.25, 0, 7); g.fill();
  }
  g.restore();
}

export function mushroom(g, x, y, opts = {}) {
  const { seed = 1, s = 1, cap = '#c0563c' } = opts;
  const r = rng(seed);
  const stem = smooth([[x - 7 * s, y], [x - 6 * s, y - 22 * s], [x + 6 * s, y - 22 * s], [x + 8 * s, y]]);
  wash(g, stem, { color: PAL.cream, opacity: 0.95, seed, under: true });
  const capShape = smooth([[x - 22 * s, y - 18 * s], [x - 16 * s, y - 34 * s], [x, y - 40 * s], [x + 16 * s, y - 34 * s], [x + 22 * s, y - 18 * s], [x, y - 21 * s]]);
  wash(g, capShape, { color: cap, opacity: 0.92, seed: seed + 1, under: true });
  g.save(); g.fillStyle = 'rgba(250,236,214,0.9)';
  for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(x + r.range(-14, 14) * s, y - r.range(24, 35) * s, r.range(1.5, 3) * s, 0, 7); g.fill(); }
  g.restore();
  ink(g, capShape.slice(0, Math.floor(capShape.length * 0.7)), { alpha: 0.45, seed: seed + 2, width: 1.2 });
}

export function fern(g, x, y, opts = {}) {
  const { seed = 1, len = 120, angle = -1.2, curl = 0.5, color = PAL.moss, alpha = 0.8, leaf = 1 } = opts;
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10, a = angle + curl * t * t;
    const prev = pts[i - 1] || [x, y];
    pts.push(i ? [prev[0] + Math.cos(a) * len / 10, prev[1] + Math.sin(a) * len / 10] : [x, y]);
  }
  g.save();
  g.strokeStyle = rgba(shade(color, 0.2), alpha); g.lineWidth = 1.6;
  path(g, smooth(pts, false), false); g.stroke();
  for (let i = 1; i < pts.length; i++) {
    const t = i / pts.length, [px, py] = pts[i], a = angle + curl * t * t;
    const L = (1 - t * 0.8) * 22 * leaf;
    for (const side of [-1, 1]) {
      g.fillStyle = rgba(r() < 0.5 ? color : tint(color, 0.15), alpha * r.range(0.6, 0.95));
      const la = a + side * 1.1;
      g.beginPath(); g.ellipse(px + Math.cos(la) * L * 0.5, py + Math.sin(la) * L * 0.5, L * 0.55, L * 0.2, la, 0, 7); g.fill();
    }
  }
  g.restore();
}

export function hills(g, y0, amp, color, opts = {}) {
  const { seed = 1, x0 = -200, x1 = 2300, bottom = 1300, opacity = 0.7, bumps = 4 } = opts;
  const r = rng(seed), top = [];
  const ph = [r() * 6, r() * 6, r() * 6];
  for (let x = x0; x <= x1; x += 40) {
    const t = x / 1920;
    top.push([x, y0 - amp * (0.55 * Math.sin(t * bumps + ph[0]) + 0.3 * Math.sin(t * bumps * 2.3 + ph[1]) + 0.15 * Math.sin(t * bumps * 5.1 + ph[2]))]);
  }
  const shape = top.concat([[x1, bottom], [x0, bottom]]);
  wash(g, shape, { color, opacity, seed: seed + 1, bleed: 0.02, layers: 24 });
  return top;
}

export function cloud(g, x, y, w, h, opts = {}) {
  const { seed = 1, color = '#f6e2cf', opacity = 0.55 } = opts;
  wash(g, fluffy(x, y, w, h, 7, 0.3, seed), { color, opacity, seed: seed + 1, bleed: 0.09, edge: 0.15 });
  wash(g, fluffy(x - w * 0.2, y - h * 0.25, w * 0.6, h * 0.6, 6, 0.3, seed + 2), { color: tint(color, 0.5), opacity: opacity * 0.7, seed: seed + 3, bleed: 0.1, edge: 0 });
}

export function leaf(g, x, y, s, a, color) {
  const shape = smooth([[0, -1], [0.45, -0.3], [0.3, 0.5], [0, 1], [-0.3, 0.5], [-0.45, -0.3]].map(([px, py]) => {
    const c = Math.cos(a), sn = Math.sin(a);
    return [x + (px * c - py * sn) * s, y + (px * sn + py * c) * s];
  }));
  wash(g, shape, { color, opacity: 0.85, seed: Math.round(x * 7 + y), bleed: 0.03, layers: 10 });
  ink(g, [[x - Math.sin(-a) * s * 0.9, y - Math.cos(a) * s * 0.9], [x + Math.sin(-a) * s * 0.9, y + Math.cos(a) * s * 0.9]], { alpha: 0.3, width: 0.8 });
}

// a broad-leaf plant: a few big painted leaves on curving stems, veined and shaded
// (the lush foreground plants of a storybook page)
export function plant(g, x, y, opts = {}) {
  const { seed = 1, h = 140, n = 6, colors = [PAL.moss, PAL.olive, '#7f9a6a', PAL.deep], spread = 1.3, opacity = 0.92, haze = 0 } = opts;
  const r = rng(seed);
  const col = (c) => haze ? mix(c, opts.hazeColor || PAL.sky, haze) : c;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * spread + r.gauss(0, 0.12);
    const L = h * r.range(0.65, 1.05), w = L * r.range(0.32, 0.42);
    const stemL = L * 0.45;
    const sx = x + Math.cos(a) * stemL, sy = y + Math.sin(a) * stemL * 0.9;
    g.save(); g.strokeStyle = rgba(col(shade(PAL.moss, 0.2)), 0.8); g.lineWidth = 2.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * stemL * 0.3, sy + stemL * 0.15, sx, sy); g.stroke(); g.restore();
    const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca, droop = r.gauss(0.25, 0.15) * Math.sign(ca || 1);
    const P = (d, o) => [sx + ca * d + px * o + droop * d * d / L * 0.35, sy + sa * d + py * o + Math.abs(droop) * d * d / L * 0.5];
    const leafShape = smooth([P(0, 0), P(L * 0.2, -w * 0.42), P(L * 0.5, -w * 0.5), P(L * 0.8, -w * 0.3), P(L, 0), P(L * 0.8, w * 0.3), P(L * 0.5, w * 0.5), P(L * 0.2, w * 0.42)]);
    const c = col(colors[i % colors.length]);
    wash(g, leafShape, { color: c, opacity, seed: seed * 31 + i, bleed: 0.02, layers: 16, under: opts.under ? col('#e9dcc2') : false });
    shadeEdge(g, leafShape, { edge: smooth([P(0, 0), P(L * 0.5, 0), P(L, 0)], false), color: col(PAL.deep), alpha: 0.35, width: w * 0.35, dy: w * 0.12 });
    shadeEdge(g, leafShape, { color: col(tint(c, 0.4)), alpha: 0.5, width: w * 0.25, dy: w * 0.1 });
    // midrib and side veins
    g.save(); g.strokeStyle = rgba(col(tint(c, 0.55)), 0.7); g.lineWidth = 1.3; g.lineCap = 'round';
    const mid = smooth([P(L * 0.02, 0), P(L * 0.5, 0), P(L * 0.95, 0)], false);
    g.beginPath(); g.moveTo(mid[0][0], mid[0][1]); for (const p of mid) g.lineTo(p[0], p[1]); g.stroke();
    g.lineWidth = 0.9;
    for (let k = 1; k < 6; k++) for (const sd of [-1, 1]) {
      const d = L * k / 6.5, [ax, ay] = P(d, 0), [bx, by] = P(d + L * 0.12, sd * w * 0.36);
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke();
    }
    g.restore();
    if (!haze) pencil(g, leafShape, { closed: true, seed: seed * 7 + i, width: 1.1, alpha: 0.35 });
  }
}

// ---------------------------------------------------------------- an oak tree
// A proper oak: a short, massive, gnarled trunk; crooked limbs spreading wide; a broad crown
// built from many shaded clumps of lobed leaves. Returns useful points (the low perch limb).
function oakLeaf(g, x, y, s, a, color, alpha = 0.9) {
  // a small lobed oak leaf (four rounded lobes a side)
  g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
  g.fillStyle = rgba(color, alpha); g.beginPath(); g.moveTo(0, 1);
  for (const side of [1, -1]) {
    for (let k = 0; k < 4; k++) { const yy = 0.8 - k * 0.45; g.quadraticCurveTo(side * (0.62 - k * 0.08), yy + 0.05, side * 0.22, yy - 0.2); }
    g.quadraticCurveTo(0, -1.15, 0, -1.1);
  }
  g.fill();
  g.restore();
}
function clamp01(v) { return Math.max(0, Math.min(1, v)); }
export function oak(g, x, ground, S = 1, opts = {}) {
  const { seed = 1, crownW = 1000, crownH = 520, crownY = 560, perchX = -520, perchY = 320, haze = 0, hazeColor = '#e9dcbc', clip = null } = opts;
  const r = rng(seed);
  const col = (c) => haze ? mix(c, hazeColor, haze) : c;
  const P = (px, py) => [x + px * S, ground - py * S];
  const cy = crownY, cw = crownW / 2, ch = crownH / 2;
  // ---- the crown's clumps, in a broad dome, wider than tall, bumpy on top
  const clumps = [];
  for (let i = 0; i < 46; i++) {
    const u = r.range(-1, 1), v = r.range(-1, 1);
    if (u * u + v * v * 1.3 > 1) { i--; continue; }
    const px = u * cw * 0.92, py = cy + v * ch * 0.8 + (1 - u * u) * ch * 0.18;
    clumps.push({ px, py, rr: r.range(90, 150) * (0.8 + 0.35 * (1 - Math.abs(u))) });
  }
  clumps.sort((a, b) => a.py - b.py); // lower clumps first (further back), higher ones on top... then lit ones last
  const clumpShape = (c, k = 1, dx = 0, dy = 0) => fluffy(x + (c.px + dx) * S, ground - (c.py + dy) * S, c.rr * S * k, c.rr * 0.78 * S * k, 7 + Math.floor(r() * 3), 0.2, seed + Math.round(c.px * 3 + c.py));
  // dark mass behind everything: the shadowed inside of the crown
  for (const c of clumps) wash(g, clumpShape(c, 1.05, 10, -14), { color: col('#3f4d2e'), opacity: 0.88, seed: seed + 7, bleed: 0.05, layers: 12 });
  // ---- trunk and limbs
  const limb = (pts, w0, w1, sd) => trunk(g, pts.map(([a, b]) => P(a, b)), w0 * S, w1 * S, { seed: seed + sd, under: true, haze, hazeColor });
  limb([[0, 0], [-8, 90], [6, 200], [-4, 300], [10, 380]], 190, 120, 1);                 // the main trunk
  limb([[-60, 14], [-110, 2], [-160, -8]], 70, 10, 2); limb([[60, 14], [116, 2], [170, -8]], 70, 10, 3); // root flare
  limb([[-10, 330], [-120, 420], [-240, 470], [-360, 520]], 92, 34, 4);                  // big limbs into the crown
  limb([[16, 340], [120, 430], [240, 480], [380, 520]], 88, 30, 5);
  limb([[0, 370], [-20, 470], [10, 560], [-10, 640]], 80, 28, 6);
  // the long low limb reaching out sideways (the crow's perch), crooked like an oak's
  const pl = [[-30, 250], [perchX * 0.3, perchY + 20], [perchX * 0.6, perchY - 14], [perchX * 0.85, perchY + 8], [perchX, perchY - 6]];
  limb(pl, 70, 18, 7);
  limb([[perchX * 0.55, perchY], [perchX * 0.62, perchY + 70], [perchX * 0.72, perchY + 110]], 18, 5, 8);
  if (!haze) {
    // bark: knots, a hollow, gnarled ridges
    wash(g, ellipse(...P(-10, 170), 22 * S, 32 * S, 20), { color: '#3a281c', opacity: 0.9, seed: seed + 9 });
    penLine(g, ellipse(...P(-10, 170), 26 * S, 36 * S, 20), { closed: true, w: 2 * S, alpha: 0.5, seed: seed + 10 });
    for (let k = 0; k < 7; k++) penLine(g, [P(-70 + k * 22, 10), P(-60 + k * 20 + r.gauss(0, 6), 120), P(-66 + k * 20 + r.gauss(0, 8), 240), P(-50 + k * 16, 340)], { w: 1.4 * S, alpha: 0.35, seed: seed + 20 + k });
    penLine(g, pl.map(([a, b]) => P(a, b + 26 - 20 * Math.abs(a / perchX))), { w: 2 * S, alpha: 0.5, seed: seed + 13 });
  }
  // ---- crown clumps, shaded like real foliage masses: dark below, sunlit on the upper left
  const greens = ['#5f7a3e', '#6d8744', '#58703a', '#7a9048'];
  const keep = (c) => !(c.py < cy - ch * 0.35 && Math.abs(c.px - perchX * 0.55) < 200); // keep the perch in view
  for (const c of clumps) {
    if (!keep(c)) continue;
    const sh = clumpShape(c);
    wash(g, sh, { color: col(r.pick(greens)), opacity: 0.92, seed: seed + Math.round(c.px), bleed: 0.06, layers: 16 });
    shadeEdge(g, sh, { color: col('#2f3c22'), alpha: 0.5, width: c.rr * 0.5 * S, dx: 8 * S, dy: -c.rr * 0.25 * S });
    glaze(g, sh, x + (c.px - c.rr * 0.3) * S, ground - (c.py + c.rr * 0.35) * S, c.rr * 0.7 * S, c.rr * 0.45 * S, col('#c2c06e'), 0.5);
  }
  // leafy texture: soft dabs inside each clump (sunlit above, shaded below) and small bumps breaking the edge
  for (const c of clumps) {
    if (!keep(c)) continue;
    const cx = x + c.px * S, cyy = ground - c.py * S, R = c.rr * S;
    const sh = clumpShape(c);
    g.save(); path(g, sh); g.clip();
    for (let k = 0; k < c.rr * 0.9; k++) {
      const u = r.range(-1, 1), v = r.range(-1, 1); if (u * u + v * v > 1) continue;
      const lx = cx + u * R, ly = cyy + v * R * 0.78, light = clamp01(0.5 - v * 0.6 - u * 0.25);
      g.fillStyle = rgba(col(light > 0.55 ? r.pick(['#9fb05c', '#b2b866', '#8ea452']) : light > 0.3 ? r.pick(['#6f8a46', '#7a9450']) : r.pick(['#3f5130', '#4a5e34'])), r.range(0.35, 0.7));
      g.beginPath(); g.ellipse(lx, ly, r.range(5, 11) * S, r.range(3.5, 7) * S, r() * 3, 0, 7); g.fill();
    }
    g.restore();
    // the bumpy, leafy outline along the top of the clump
    for (let k = 0; k < c.rr / 5; k++) {
      const a = Math.PI * r.range(1.05, 1.95), rr = R * r.range(0.92, 1.03);
      const lx = cx + Math.cos(a) * rr, ly = cyy + Math.sin(a) * rr * 0.78;
      g.fillStyle = rgba(col(Math.sin(a) < -0.6 ? '#8ea452' : '#6a8444'), 0.85);
      g.beginPath(); g.ellipse(lx, ly, r.range(6, 11) * S, r.range(5, 8) * S, a, 0, 7); g.fill();
    }
  }
  // acorns, a few, hanging under the crown
  if (!haze) for (let k = 0; k < 6; k++) {
    const [ax, ay] = P(r.range(-cw * 0.6, cw * 0.6), cy - ch * 0.75 + r.range(-20, 20));
    g.fillStyle = '#9a6a32'; g.beginPath(); g.ellipse(ax, ay + 6 * S, 5 * S, 7 * S, 0, 0, 7); g.fill();
    g.fillStyle = '#6a4a2a'; g.beginPath(); g.ellipse(ax, ay, 6 * S, 4 * S, 0, 0, 7); g.fill();
  }
  return { perch: P(perchX * 0.72, perchY + 8), limb: pl.map(([a, b]) => P(a, b)) };
}

// ---------------------------------------------------------------- a storybook cottage
// Plaster walls with timber framing on a stone footing, a thick rounded thatched roof,
// a shuttered window with a sill and window box, an arched door, a stone chimney, roses.
export function cottage(g, x, ground, S = 1, opts = {}) {
  const { seed = 3 } = opts;
  const r = rng(seed);
  const P = (px, py) => [x + px * S, ground - py * S];
  const rect = (x0, y0, x1, y1) => [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)];
  const wallH = 230, half = 250;
  // chimney (behind the roof)
  const chim = rect(150, 300, 205, 470);
  wash(g, chim, { color: '#b49a80', opacity: 0.97, seed: seed + 1, under: true, bleed: 0.008 });
  for (let k = 0; k < 9; k++) penLine(g, [P(150, 310 + k * 18), P(205, 310 + k * 18)], { w: 1 * S, alpha: 0.35, seed: seed + 50 + k });
  wash(g, rect(142, 462, 213, 484), { color: '#8f7660', opacity: 0.97, seed: seed + 2, under: true, bleed: 0.008 });
  penLine(g, chim, { closed: true, sharp: true, w: 2 * S, alpha: 0.7, seed: seed + 3 });
  // walls
  const wall = rect(-half, 0, half, wallH);
  wash(g, wall, { color: '#f1e3c4', opacity: 0.97, seed: seed + 4, under: true, bleed: 0.008 });
  glaze(g, wall, ...P(-120, 150), 260 * S, 120 * S, '#fff6e2', 0.5);
  // stone footing
  const foot = rect(-half - 6, 0, half + 6, 46);
  wash(g, foot, { color: '#b8ab98', opacity: 0.97, seed: seed + 5, under: true, bleed: 0.008 });
  for (let row = 0; row < 2; row++) for (let k = 0; k < 13; k++) {
    const sx = -half + k * 40 + (row ? 20 : 0) + r.gauss(0, 3), sy = 4 + row * 21;
    const st = smooth([P(sx + 2, sy + 2), P(sx + 36, sy + 1), P(sx + 37, sy + 18), P(sx + 1, sy + 19)]);
    wash(g, st, { color: r.pick(['#a99a86', '#c2b6a2', '#9c8f7e']), opacity: 0.8, seed: seed + 60 + row * 20 + k, layers: 8, edge: 0.2 });
    penLine(g, st, { closed: true, w: 1 * S, alpha: 0.4, seed: seed + 100 + row * 20 + k });
  }
  // timber framing
  const beam = (pts, w) => { const b = ribbon(pts.map(([a, c]) => P(a, c)), w * S, w * S); wash(g, b, { color: '#6b4a34', opacity: 0.95, seed: seed + Math.round(pts[0][0] + pts[0][1]), under: true, layers: 10, bleed: 0.01 }); penLine(g, pts.map(([a2, c2]) => P(a2, c2)), { w: 1 * S, alpha: 0.3 }); };
  for (const bx of [-half + 10, -40, half - 10]) beam([[bx, 46], [bx, wallH]], 18);
  beam([[-half, 140], [half, 140]], 14);
  beam([[-half + 10, 140], [-150, 230]], 12); beam([[half - 10, 140], [150, 230]], 12);
  shadeEdge(g, wall, { color: '#7c6448', alpha: 0.45, width: 70 * S, dy: 30 * S }); // shadow under the eaves
  // the door: arched, planked
  const door = smooth([P(-200, 46), P(-200, 150), P(-178, 182), P(-140, 194), P(-102, 182), P(-80, 150), P(-80, 46)]);
  wash(g, door, { color: '#5f7a72', opacity: 0.96, seed: seed + 6, under: true, bleed: 0.008 });
  for (let k = 1; k < 5; k++) penLine(g, [P(-200 + k * 24, 50), P(-200 + k * 24, 184 - Math.abs(k - 2.5) * 6)], { w: 1.2 * S, alpha: 0.45 });
  penLine(g, door, { closed: true, w: 2.2 * S, alpha: 0.8, seed: seed + 7 });
  g.fillStyle = '#d8b060'; g.beginPath(); g.arc(...P(-98, 110), 5 * S, 0, 7); g.fill();
  wash(g, rect(-212, -8, -68, 6), { color: '#a4998a', opacity: 0.95, seed: seed + 8, under: true });
  // the window: four panes, shutters, a sill and a window box of flowers
  const wx0 = 40, wx1 = 170, wy0 = 76, wy1 = 196;
  const win = rect(wx0, wy0, wx1, wy1);
  wash(g, win, { color: '#4c5d6a', opacity: 0.95, seed: seed + 9, under: true, bleed: 0.008 });
  glaze(g, win, ...P(wx0 + 34, wy1 - 30), 50 * S, 36 * S, '#c8dce4', 0.7);
  const glow = rect(wx0 + 6, wy0 + 4, wx1 - 6, wy1 - 6); // warm lamplight inside, drawn faintly
  wash(g, glow, { color: '#e6b86a', opacity: 0.18, seed: seed + 10, edge: 0 });
  penLine(g, [P((wx0 + wx1) / 2, wy0), P((wx0 + wx1) / 2, wy1)], { w: 3.4 * S, alpha: 0.85 });
  penLine(g, [P(wx0, (wy0 + wy1) / 2), P(wx1, (wy0 + wy1) / 2)], { w: 3.4 * S, alpha: 0.85 });
  penLine(g, win, { closed: true, sharp: true, w: 3 * S, alpha: 0.9, seed: seed + 11 });
  for (const [s0, s1] of [[wx0 - 52, wx0 - 6], [wx1 + 6, wx1 + 52]]) {
    const sh = rect(s0, wy0, s1, wy1);
    wash(g, sh, { color: '#6f8f86', opacity: 0.96, seed: seed + 12 + s0, under: true, bleed: 0.008 });
    for (let k = 1; k < 6; k++) penLine(g, [P(s0 + 4, wy0 + k * 20), P(s1 - 4, wy0 + k * 20)], { w: 1 * S, alpha: 0.45 });
    penLine(g, sh, { closed: true, sharp: true, w: 1.8 * S, alpha: 0.75 });
  }
  const sill = rect(wx0 - 14, wy0 - 12, wx1 + 14, wy0);
  wash(g, sill, { color: '#8a6040', opacity: 0.97, seed: seed + 13, under: true, bleed: 0.008 });
  penLine(g, sill, { closed: true, sharp: true, w: 1.8 * S, alpha: 0.8 });
  for (const px of [-226, -54]) { // flower pots by the door
    const pot = smooth([P(px - 14, 0), P(px - 18, 30), P(px + 18, 30), P(px + 14, 0)]);
    wash(g, pot, { color: '#b86a4a', opacity: 0.95, seed: seed + 220 + px, under: true, layers: 10 });
    penLine(g, pot, { closed: true, sharp: true, w: 1.4 * S, alpha: 0.7 });
    foliage(g, ...P(px, 44), 22 * S, 16 * S, { seed: seed + 230 + px, colors: [PAL.moss, PAL.olive], blobs: 3, opacity: 0.9, detail: false });
    for (let k = 0; k < 3; k++) flower(g, ...P(px - 10 + k * 10, 52 + (k % 2) * 6), { seed: seed + 240 + px + k, size: 7 * S, color: k % 2 ? '#d8706a' : '#f2e2c4', stem: 0 });
  }
  // the thatched roof: thick, rounded, overhanging
  const roof = smooth([P(-half - 66, wallH - 24), P(-half - 40, wallH + 10), P(-half + 20, wallH + 80), P(-150, wallH + 160), P(-110, wallH + 200), P(-60, wallH + 214),
    P(60, wallH + 214), P(110, wallH + 200), P(150, wallH + 160), P(half - 20, wallH + 80), P(half + 40, wallH + 10), P(half + 66, wallH - 24), P(half + 20, wallH - 10), P(0, wallH - 4), P(-half - 20, wallH - 10)], true, 3);
  wash(g, roof, { color: '#c9a560', opacity: 0.97, seed: seed + 15, under: true, bleed: 0.01 });
  glaze(g, roof, ...P(-80, wallH + 160), 220 * S, 70 * S, '#e8cf8a', 0.6);
  hatch(g, roof, { color: '#7d5e30', count: 900, len: 20 * S, width: 1.1, alpha: 0.45, seed: seed + 16, dir: (px) => Math.PI / 2 - (px - x) / (half * S) * 0.6, curve: 0.2 });
  // the thick rolled edge of the thatch along the eaves
  const eave = ribbon([P(-half - 70, wallH - 22), P(-half + 40, wallH - 6), P(0, wallH - 2), P(half - 40, wallH - 6), P(half + 70, wallH - 22)], 34 * S, 34 * S);
  wash(g, eave, { color: '#b28a48', opacity: 0.97, seed: seed + 17, under: true });
  hatch(g, eave, { color: '#6d4e26', count: 300, len: 12 * S, width: 1, alpha: 0.5, seed: seed + 18, dir: () => Math.PI / 2 });
  penLine(g, eave, { closed: true, w: 2 * S, alpha: 0.7 });
  // ridge, and a little eyebrow over the window
  penLine(g, roof.slice(0, Math.floor(roof.length * 0.74)), { w: 2.6 * S, alpha: 0.8, seed: seed + 19 });
  // roses climbing the left wall
  for (let k = 0; k < 8; k++) foliage(g, ...P(-half + 4 + Math.sin(k) * 10, 30 + k * 24), 26 * S, 18 * S, { seed: seed + 300 + k, colors: [PAL.moss, PAL.deep, PAL.olive], blobs: 3, opacity: 0.9, detail: false });
  for (let k = 0; k < 9; k++) flower(g, ...P(-half + r.range(-14, 22), r.range(40, 210)), { seed: seed + 320 + k, size: 9 * S, color: k % 3 ? '#cf6a6a' : '#e9a0a0', stem: 0 });
  // bushes along the footing
  for (let k = 0; k < 9; k++) foliage(g, ...P(-half + 20 + k * 60, 10), 40 * S, 26 * S, { seed: seed + 400 + k, colors: [PAL.moss, PAL.olive, PAL.sage], blobs: 4, opacity: 0.9 });
  return { sill: P((wx0 + wx1) / 2, wy0), chimney: P(178, 484), window: P((wx0 + wx1) / 2, (wy0 + wy1) / 2), ridge: P(0, wallH + 222) };
}
