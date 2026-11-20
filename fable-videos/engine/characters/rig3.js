// rig3: the shared machinery of the "3" rigs (crow3's architecture, factored out for mice3 / cat3).
//   key(u, keys)           smooth monotone keyframes [[u, v], ...]
//   saccade / glance       idle glances;  event(t, period, dur, seed) -> 0..1 progress of an occasional event, or -1
//   kernel(f, zeta, win, n) damped-spring impulse response taps, for follow-through
//   makeFilter(PHASES, DEF) -> filtered(poseFn, t, ker, since, cache): a state seen through a spring (numbers
//                          blended, event phases / cycles delayed instead of averaged)
//   ik2(S, T, a, b, hint)  two-bone IK in 2D -> { E, T, reach }
//   tube(g, pts, ...)      a soft rounded pen-and-wash limb along a polyline
//   taper(g, pts, w0, w1)  a tapered ribbon (thin tails) filled and inked
//   bendStrips(g, spr, pts) draw a straight painted sprite (painted along +x from x = 0) bent along a chain
//   smileMouth(...)        mice.js' one-piece smiling / talking mouth (copied: it is not exported there)
import { clamp, lerp, rgba, path, smooth } from '../watercolor.js';
import { INK } from './kit.js';

export const TAU = Math.PI * 2;
export const hash = (n, s = 0) => { const v = Math.sin(n * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
export const fr = (x) => x - Math.floor(x);
export const easeInOut = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const sstep = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const backOut = (x) => { x = clamp(x); const c = 1.4; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
export const bell = (u, a, b) => (u <= a || u >= b ? 0 : Math.sin(Math.PI * (u - a) / (b - a)) ** 2);
export const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
export const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
export const on = (u) => (u > 0 && u < 1 ? 1 : 0);

// smooth keyframes, monotone cubic (no overshoot between keys)
export function key(u, ks) {
  const n = ks.length;
  if (u <= ks[0][0]) return ks[0][1];
  if (u >= ks[n - 1][0]) return ks[n - 1][1];
  let i = 1; while (u > ks[i][0]) i++;
  const [u0, v0] = ks[i - 1], [u1, v1] = ks[i], h = u1 - u0, d = v1 - v0;
  const tan = (j) => {
    if (j <= 0 || j >= n - 1) return 0;
    const va = ks[j - 1][1], v = ks[j][1], vb = ks[j + 1][1];
    if ((v - va) * (vb - v) <= 0) return 0;
    return (vb - va) / (ks[j + 1][0] - ks[j - 1][0]);
  };
  let m0 = tan(i - 1) * h, m1 = tan(i) * h;
  const lim = 3 * Math.abs(d); m0 = clamp(m0, -lim, lim); m1 = clamp(m1, -lim, lim);
  const s = (u - u0) / h, s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * v0 + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * v1 + (s3 - s2) * m1;
}
// a soft glance: holds, then eases (dur seconds) to a new random value in -1..1
export function glance(t, period, seed, dur = 0.4) {
  const b = (j) => j * period + period * 0.5 * hash(j, seed);
  let j = Math.floor(t / period); if (t < b(j)) j--;
  const v = (k) => hash(k, seed + 7) * 2 - 1;
  return lerp(v(j - 1), v(j), easeInOut((t - b(j)) / dur));
}
export function event(t, period, dur, seed) {
  const j = Math.floor(t / period), st = j * period + (period - dur) * hash(j, seed);
  const u = (t - st) / dur;
  return u >= 0 && u <= 1 ? u : -1;
}

export function kernel(f, zeta, win, n) {
  const w = TAU * f, wd = w * Math.sqrt(1 - zeta * zeta), out = [];
  let sum = 0;
  for (let k = 0; k < n; k++) { const tau = (k + 0.5) * win / n, h = Math.exp(-zeta * w * tau) * Math.sin(wd * tau); out.push([tau, h]); sum += h; }
  for (const o of out) o[1] /= sum;
  out.lag = out.reduce((a, [tau, w]) => a + tau * w, 0);
  return out;
}
export function makeFilter(PHASES, DEF) {
  return function filtered(poseFn, t, ker, since, cache) {
    const get = (tt) => { tt = Math.max(since, Math.round(tt * 960) / 960); let s = cache.get(tt); if (!s) { s = poseFn(tt); cache.set(tt, s); } return s; };
    const samples = ker.map(([tau, w]) => [get(t - tau), w]);
    const keys = new Set();
    for (const [s] of samples) for (const k in s) if (typeof s[k] === 'number') keys.add(k);
    const out = {};
    for (const k of keys) {
      if (PHASES.has(k)) continue;
      let a = 0; for (const [s, w] of samples) a += w * (typeof s[k] === 'number' ? s[k] : (DEF[k] ?? 0)); out[k] = a;
    }
    const d = get(t - ker.lag * 0.6);
    for (const k of PHASES) if (typeof d[k] === 'number') out[k] = d[k];
    return out;
  };
}

// two-bone IK: shoulder S, target T, bone lengths a, b; the elbow goes to the side of `hint` (a direction from S).
// stretch: how much the bones may stretch (1 = not at all) when the target is out of reach.
export function ik2(S, T, a, b, hint = [0, 1], stretch = 1) {
  let dx = T[0] - S[0], dy = T[1] - S[1]; let d = Math.hypot(dx, dy) || 1e-6;
  const ux = dx / d, uy = dy / d;
  let k = 1;
  if (d > a + b) { k = Math.min(stretch, d / (a + b)); a *= k; b *= k; }
  const dd = clamp(d, Math.abs(a - b) + 0.01, (a + b) * 0.9999);
  const x = (a * a - b * b + dd * dd) / (2 * dd), h = Math.sqrt(Math.max(0, a * a - x * x));
  const px = -uy, py = ux;
  const side = (px * hint[0] + py * hint[1]) >= 0 ? 1 : -1;
  const E = [S[0] + ux * x + px * h * side, S[1] + uy * x + py * h * side];
  const Te = [S[0] + ux * dd, S[1] + uy * dd];
  return { E, T: Te, reach: d <= (a + b) * 1.001 };
}

// a soft limb: an ink outline and a coloured core along a smooth line (round ends), plus a light stroke
export function tube(g, pts, w, fill, o = {}) {
  const line = pts.length > 2 ? smooth(pts, false, 6) : pts;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const pl = () => { g.beginPath(); g.moveTo(line[0][0], line[0][1]); for (let i = 1; i < line.length; i++) g.lineTo(line[i][0], line[i][1]); };
  pl(); g.strokeStyle = rgba(o.ink || INK, o.inkA ?? 0.72); g.lineWidth = w + (o.inkW ?? 2.4); g.stroke();
  pl(); g.strokeStyle = fill; g.lineWidth = w; g.stroke();
  if (o.light) { g.save(); g.translate(-w * 0.18, -w * 0.18); pl(); g.strokeStyle = o.light; g.lineWidth = w * 0.3; g.globalAlpha *= 0.5; g.stroke(); g.restore(); }
  g.restore();
}

// a tapered ribbon along a polyline: fill + pen outline (a thin bending tail)
export function taper(g, pts, w0, w1, fill, o = {}) {
  const L = [], R = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = lerp(w0, w1, i / (n - 1)) / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  const tip = pts[n - 1], prev = pts[n - 2];
  const tdx = tip[0] - prev[0], tdy = tip[1] - prev[1], td = Math.hypot(tdx, tdy) || 1;
  const cap = [tip[0] + tdx / td * w1 * 0.5, tip[1] + tdy / td * w1 * 0.5];
  const shape = L.concat([cap], R.reverse());
  g.save(); g.lineJoin = 'round';
  g.fillStyle = fill; path(g, shape); g.fill();
  if (o.shade) { // a darker underside: offset copy clipped
    g.save(); path(g, shape); g.clip(); g.translate(0, (w0 + w1) * 0.22); g.globalAlpha *= 0.35; g.fillStyle = o.shade; path(g, shape); g.fill(); g.restore();
  }
  if (o.light) { g.save(); g.strokeStyle = o.light; g.globalAlpha *= 0.45; g.lineWidth = Math.max(0.6, w0 * 0.18); g.lineCap = 'round'; g.beginPath(); g.moveTo(...pts[1]); for (let i = 2; i < n - 2; i++) g.lineTo(pts[i][0], pts[i][1] - (lerp(w0, w1, i / (n - 1))) * 0.18); g.stroke(); g.restore(); }
  g.strokeStyle = rgba(o.ink || INK, o.inkA ?? 0.6); g.lineWidth = o.inkW ?? 1.2; path(g, shape); g.stroke();
  g.restore();
}

// a painted straight sprite (along +x, root at x = 0, centred on y = 0) bent along a chain of points
// pts[0..N] with equal spacing L/N: each strip is drawn rotated along its chain segment, overlapping a little.
export function bendStrips(g, s, pts, L, o = {}) {
  const N = pts.length - 1, ds = L / N, ov = o.overlap ?? 1.6, res = s.c.width / s.w;
  // the part behind the root (x < 0) rides with the first segment
  const a0 = Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]);
  const from = o.from || 0;
  if (s.x0 < 0 && !from) {
    g.save(); g.translate(pts[0][0], pts[0][1]); g.rotate(a0);
    g.drawImage(s.c, 0, 0, (-s.x0 + ov) * res, s.c.height, s.x0, s.y0, -s.x0 + ov, s.h); g.restore();
  }
  for (let i = from; i < N; i++) {
    const p = pts[i], q = pts[i + 1], a = Math.atan2(q[1] - p[1], q[0] - p[0]);
    const x0 = i * ds - (i > from ? ov : 0), x1 = Math.min(s.x0 + s.w, (i + 1) * ds + ov + (i === N - 1 ? s.x0 + s.w : 0));
    if (x1 <= x0) continue;
    g.save(); g.translate(p[0], p[1]); g.rotate(a);
    g.drawImage(s.c, (x0 - s.x0) * res, 0, (x1 - x0) * res, s.c.height, x0 - i * ds, s.y0, x1 - x0, s.h);
    g.restore();
  }
}

// a chain of N segments of length ds from root p0 at base angle a0, each turning by angs[i] more than the last
export function chain(p0, a0, angs, ds) {
  const pts = [p0]; let a = a0, p = p0;
  for (let i = 0; i < angs.length; i++) { a += angs[i]; p = [p[0] + Math.cos(a) * ds, p[1] + Math.sin(a) * ds]; pts.push(p); }
  return pts;
}

// mice.js' one-piece mouth: a smile line that opens into ONE filled shape (no ring, no separate parts)
export function smileMouth(g, x, y, w, m, sm = 0.5, o = {}) {
  const top = (k) => [x - w / 2 + k * w, y - Math.sin(k * Math.PI) * 2 * (1 - sm) + (Math.abs(k - 0.5) * 2) ** 2 * (-sm * 5)];
  const pts = []; for (let k = 0; k <= 10; k++) pts.push(top(k / 10));
  const outline = (depth) => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.quadraticCurveTo(x, y + depth * 1.6, pts[0][0], pts[0][1]); g.closePath(); };
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  if (m > 0.04) {
    const depth = 3 + (o.deep ?? 11) * m;
    outline(depth); g.fillStyle = '#5c2622'; g.fill(); g.save(); g.clip();
    g.fillStyle = '#d8857c'; g.beginPath(); g.ellipse(x, y + depth * 0.9, w * 0.3, depth * 0.4, 0, 0, 7); g.fill(); g.restore();
    outline(depth); g.strokeStyle = rgba(INK, 0.8); g.lineWidth = o.lw ?? 1.6; g.stroke();
  } else { g.strokeStyle = rgba(INK, 0.8); g.lineWidth = o.lw ?? 1.6; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.stroke(); }
  g.restore();
}
