// Reusable painted scenery: trees, foliage, grass, flowers, mushrooms, ferns, hills, clouds.
// All painters draw in the current ctx coordinates with the watercolor engine.
import { wash, ink, strokes, pool, ellipse, smooth, ribbon, fluffy, bbox, rng, rgba, shade, tint, mix, path, speckle } from './watercolor.js';

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
