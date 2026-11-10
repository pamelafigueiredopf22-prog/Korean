// Watercolor painting engine for canvas 2D.
// Everything here is deterministic (seeded), so a scene paints the same way
// on every frame and every render.
//
// Core idea (after Tyler Hobbs' generative watercolor): a shape is deformed
// many times by recursive midpoint displacement and each copy is filled with
// a very low alpha. The overlapping copies give soft, bleeding edges and
// uneven pigment, like a real wash. Granulation, edge darkening, paper grain
// and wobbly ink lines finish the look.

export const W = 1920, H = 1080;

// ---------- random ----------
export function rng(seed) {
  let a = seed >>> 0;
  const r = () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (lo, hi) => lo + r() * (hi - lo);
  r.gauss = (m = 0, s = 1) => {
    const u = 1 - r(), v = r();
    return m + s * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  return r;
}

// smooth 1D/2D value noise for motion & textures
export function noise1(x, seed = 0) {
  const h = (n) => { const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return s - Math.floor(s); };
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return h(i) * (1 - u) + h(i + 1) * u;
}

// ---------- colour ----------
export function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgba(c, a = 1) { const [r, g, b] = hex(c); return `rgba(${r},${g},${b},${a})`; }
export function mix(c1, c2, t) {
  const a = hex(c1), b = hex(c2);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
export const shade = (c, t) => mix(c, '#2a1a12', t);   // toward warm dark
export const tint = (c, t) => mix(c, '#fbf4e6', t);    // toward paper

// ---------- canvases ----------
// Painting canvases use 16-bit float pixels: hundreds of faint glazes would
// otherwise round off in 8 bits and drift the colour.
export function canvas(w, h, float = true) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  if (float) c.getContext('2d', { colorType: 'float16' });
  return c;
}

// ---------- shapes ----------
export function ellipse(cx, cy, rx, ry, n = 28, rot = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    pts.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]);
  }
  return pts;
}

// Catmull-Rom spline through points -> dense polyline
export function smooth(pts, closed = true, seg = 8) {
  const out = [], n = pts.length;
  const P = (i) => closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))];
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let s = 0; s < seg; s++) {
      const t = s / seg, t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * t +
        (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
    }
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}

// Turn a centre line into a filled ribbon with varying width (tails, stems, branches)
export function ribbon(line, w0, w1 = w0, seg = 6) {
  const c = smooth(line, false, seg), L = [], R = [];
  for (let i = 0; i < c.length; i++) {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const t = i / (c.length - 1), w = (w0 + (w1 - w0) * t) / 2;
    L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]);
  }
  return L.concat(R.reverse());
}

// bumpy, irregular outline (manes, foliage, clouds)
export function fluffy(cx, cy, rx, ry, bumps, depth, seed, rot = 0) {
  const r = rng(seed), pts = [];
  let a = rot + r() * 0.5;
  const step = (Math.PI * 2) / bumps;
  for (let i = 0; i < bumps; i++) {
    const w = step * r.range(0.7, 1.3) * (i === bumps - 1 ? 0 : 1) || (Math.PI * 2 + rot - a);
    const peak = 1 - depth * r() * 0.35, valley = 1 - depth * r.range(0.7, 1.3);
    const a1 = a + w * 0.5, a2 = a + Math.min(w, Math.PI * 2 + rot - a) ;
    pts.push([cx + Math.cos(a) * rx * valley, cy + Math.sin(a) * ry * valley]);
    pts.push([cx + Math.cos(a + w * 0.25) * rx * (peak - depth * 0.1), cy + Math.sin(a + w * 0.25) * ry * (peak - depth * 0.1)]);
    pts.push([cx + Math.cos(a1) * rx * peak, cy + Math.sin(a1) * ry * peak]);
    pts.push([cx + Math.cos(a + w * 0.75) * rx * (peak - depth * 0.1), cy + Math.sin(a + w * 0.75) * ry * (peak - depth * 0.1)]);
    a = a2;
    if (a >= Math.PI * 2 + rot - 1e-6) break;
  }
  return smooth(pts, true, 3);
}

export function bbox(pts) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

export function path(ctx, pts, closed = true) {
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  if (closed) ctx.closePath();
}

// ---------- deformation ----------
// polygon points carry a per-vertex "wetness" (how far they may bleed)
function deform(poly, depth, r, amt) {
  let p = poly;
  for (let d = 0; d < depth; d++) {
    const out = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      out.push(a);
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const v = (a[2] + b[2]) / 2;
      const sd = len * amt * v;
      out.push([(a[0] + b[0]) / 2 + r.gauss(0, sd), (a[1] + b[1]) / 2 + r.gauss(0, sd), v * r.range(0.45, 0.75)]);
    }
    p = out;
  }
  return p;
}

// ---------- textures (built once) ----------
let NOISE = null;
export function noiseTexture() {
  if (NOISE) return NOISE;
  const S = 512, c = canvas(S, S), g = c.getContext('2d');
  const r = rng(99);
  // layered blurred random dots -> soft fBm-ish mottling
  g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
  for (const [n, rad, a] of [[900, 40, 0.05], [2500, 12, 0.07], [9000, 3, 0.10], [30000, 0.9, 0.18]]) {
    for (let i = 0; i < n; i++) {
      g.fillStyle = r() < 0.5 ? `rgba(0,0,0,${a})` : `rgba(255,255,255,${a})`;
      const x = r() * S, y = r() * S, rr = rad * r.range(0.5, 1.5);
      for (const [ox, oy] of [[0, 0], [S, 0], [-S, 0], [0, S], [0, -S]]) { // tileable
        g.beginPath(); g.arc(x + ox, y + oy, rr, 0, Math.PI * 2); g.fill();
      }
    }
  }
  NOISE = c;
  return c;
}

// granulation: uneven pigment, only where paint already is (soft-light noise)
export function granulate(ctx, w, h, strength = 0.22, seed = 1) {
  const r = rng(seed), n = noiseTexture();
  const tmp = canvas(w, h), t = tmp.getContext('2d');
  const pat = t.createPattern(n, 'repeat');
  pat.setTransform(new DOMMatrix().translate(r() * 512, r() * 512));
  t.fillStyle = pat; t.fillRect(0, 0, w, h);
  t.globalCompositeOperation = 'destination-in';
  t.drawImage(ctx.canvas, 0, 0);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = Math.min(1, strength * 3);
  ctx.drawImage(tmp, 0, 0);
  ctx.restore();
}

// ---------- paper ----------
export function paper(w = W, h = H, base = '#f2e7d3', seed = 7) {
  const c = canvas(w, h), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  // large soft mottling
  for (let i = 0; i < 160; i++) {
    const x = r() * w, y = r() * h, rad = r.range(80, 380);
    const grd = g.createRadialGradient(x, y, 0, x, y, rad);
    const dark = r() < 0.5;
    grd.addColorStop(0, dark ? 'rgba(150,115,80,0.035)' : 'rgba(255,250,240,0.05)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // cold-press tooth: tiny pits and bumps
  const img = g.getImageData(0, 0, w, h), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const k = (r() - 0.5) * 14 + (r() < 0.02 ? -12 : 0);
    d[i] += k; d[i + 1] += k; d[i + 2] += k * 0.9;
  }
  g.putImageData(img, 0, 0);
  // fibres
  g.lineWidth = 0.6;
  for (let i = 0; i < 260; i++) {
    const x = r() * w, y = r() * h, a = r() * Math.PI, l = r.range(4, 16);
    g.strokeStyle = r() < 0.5 ? 'rgba(120,90,60,0.10)' : 'rgba(255,255,255,0.25)';
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l / 2 + r.gauss(0, 2), y + Math.sin(a) * l / 2 + r.gauss(0, 2), x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return c;
}

// ---------- the wash ----------
// opts: color, opacity (0..1 overall), layers, bleed (edge softness),
//       edge (edge-darkening strength), wet: per-vertex wetness override
export function wash(ctx, shape, opts = {}) {
  const {
    color = '#c08040', opacity = 0.75, layers = 36, bleed = 0.06, seed = 1,
    edge = 0.35, blend = 'source-over', depth = 3, hard = false, under = false,
  } = opts;
  const r = rng(seed);
  const base0 = shape.map(([x, y]) => [x, y, r.range(0.6, 1.4)]);
  const base = deform(base0, 2, r, bleed * 0.6);
  const n = layers;
  const a = 1 - Math.pow(1 - opacity * 0.65, 1 / n);
  ctx.save();
  if (under) { // opaque paper underneath, so a part hides what is behind it
    ctx.fillStyle = typeof under === 'string' ? under : '#f2e7d3';
    path(ctx, base); ctx.fill();
  }
  ctx.globalCompositeOperation = blend;
  ctx.fillStyle = color;
  // a soft core first so the middle never looks hollow
  ctx.globalAlpha = opacity * 0.35;
  path(ctx, deform(base, 1, r, bleed * 0.2)); ctx.fill();
  ctx.globalAlpha = a;
  for (let i = 0; i < n; i++) {
    const p = deform(base, depth, r, hard ? bleed * 0.4 : bleed);
    path(ctx, p); ctx.fill();
  }
  if (edge > 0) {
    // pigment collects at the drying edge
    ctx.globalAlpha = edge * opacity;
    ctx.strokeStyle = shade(color, 0.25);
    const m = ctx.getTransform(); const sc = Math.hypot(m.a, m.b) || 1;
    ctx.lineWidth = 1.6 / sc;
    ctx.lineJoin = 'round';
    path(ctx, deform(base, 2, r, bleed * 0.3)); ctx.stroke();
  }
  ctx.restore();
}

// soft radial pool of colour (glows, blush, shadows)
export function pool(ctx, x, y, rx, ry, color, alpha = 0.3, blend = 'source-over') {
  ctx.save();
  ctx.globalCompositeOperation = blend;
  ctx.translate(x, y); ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, rgba(color, alpha));
  g.addColorStop(0.55, rgba(color, alpha * 0.45));
  g.addColorStop(1, rgba(color, 0));
  ctx.fillStyle = g; ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
  ctx.restore();
}

// ---------- ink ----------
export function ink(ctx, pts, opts = {}) {
  const { color = '#4a3226', width = 1.6, alpha = 0.7, seed = 3, wobble = 0.8, gaps = 0, closed = false, taper = true } = opts;
  const r = rng(seed);
  const line = smooth(closed ? pts.concat([pts[0]]) : pts, false, 5);
  const m = ctx.getTransform(); const sc = Math.hypot(m.a, m.b) || 1;
  ctx.save();
  ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let pass = 0; pass < 2; pass++) {
    ctx.globalAlpha = alpha * (pass ? 0.45 : 1);
    let drawing = true;
    for (let i = 1; i < line.length; i++) {
      if (gaps && r() < gaps * 0.08) drawing = !drawing;
      if (!drawing) continue;
      const t = i / line.length;
      const tp = taper ? Math.sin(Math.PI * Math.min(1, Math.max(0, t)) * 0.999) * 0.7 + 0.3 : 1;
      ctx.lineWidth = (width * tp * r.range(0.8, 1.15)) / sc;
      const j = (wobble * (pass + 0.6)) / sc;
      ctx.beginPath();
      ctx.moveTo(line[i - 1][0] + r.gauss(0, j * 0.3), line[i - 1][1] + r.gauss(0, j * 0.3));
      ctx.lineTo(line[i][0] + r.gauss(0, j * 0.3), line[i][1] + r.gauss(0, j * 0.3));
      ctx.stroke();
    }
  }
  ctx.restore();
}

// short fur / grass / texture strokes clipped to a shape, following a direction field
export function strokes(ctx, clipShape, opts = {}) {
  const { color = '#7a4a2a', count = 120, len = 14, width = 1.1, alpha = 0.35, seed = 5,
    dir = () => -Math.PI / 2, curve = 0.3 } = opts;
  const r = rng(seed), b = bbox(clipShape);
  const m = ctx.getTransform(); const sc = Math.hypot(m.a, m.b) || 1;
  ctx.save();
  if (clipShape) { path(ctx, clipShape); ctx.clip(); }
  ctx.strokeStyle = color; ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const x = r.range(b.x0, b.x1), y = r.range(b.y0, b.y1);
    const a = dir(x, y) + r.gauss(0, 0.18), l = len * r.range(0.6, 1.3);
    ctx.globalAlpha = alpha * r.range(0.5, 1);
    ctx.lineWidth = width * r.range(0.6, 1.2) / sc;
    const ex = x + Math.cos(a) * l, ey = y + Math.sin(a) * l;
    const c = curve * l * r.gauss(0, 1);
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.quadraticCurveTo((x + ex) / 2 - Math.sin(a) * c, (y + ey) / 2 + Math.cos(a) * c, ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

// splatter dots (texture, flowers, speckles)
export function speckle(ctx, b, opts = {}) {
  const { color = '#7a5a40', count = 60, size = 2.5, alpha = 0.4, seed = 11 } = opts;
  const r = rng(seed);
  ctx.save(); ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = alpha * r.range(0.4, 1);
    ctx.beginPath();
    ctx.arc(r.range(b.x0, b.x1), r.range(b.y0, b.y1), size * Math.pow(r(), 2) + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- sprites ----------
// Paint something once (in local units) into its own canvas at `res`
// pixels per unit, then draw it every frame with any transform.
export function sprite(box, res, paintFn, opts = {}) {
  const m = opts.margin ?? 0.12;
  const mx = box.w * m + 6, my = box.h * m + 6;
  const x0 = box.x0 - mx, y0 = box.y0 - my, w = box.w + 2 * mx, h = box.h + 2 * my;
  const c = canvas(w * res, h * res), g = c.getContext('2d');
  g.setTransform(res, 0, 0, res, -x0 * res, -y0 * res);
  paintFn(g);
  if (opts.granulate !== false) granulate(g, c.width, c.height, opts.grain ?? 0.18, opts.seed ?? 1);
  return { c, x0, y0, w, h };
}
export function drawSprite(ctx, s, alpha = 1) {
  if (alpha <= 0) return;
  const a = ctx.globalAlpha; ctx.globalAlpha = a * alpha;
  ctx.drawImage(s.c, s.x0, s.y0, s.w, s.h);
  ctx.globalAlpha = a;
}

// ---------- easing ----------
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const ease = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const lerp = (a, b, t) => a + (b - a) * t;
// 0 -> 1 between t0 and t1
export const span = (t, t0, t1) => ease((t - t0) / (t1 - t0));

// ---------- form shading ----------
// Soft shading inside a shape, like a second wet glaze dropped along one side.
// The outline of `edge` (default: the shape itself) is stroked wide, blurred, and
// shifted by (dx, dy) so only one side's band falls inside the clip.
export function shadeEdge(ctx, shape, opts = {}) {
  const { color = '#7a4a2a', alpha = 0.35, width = 30, dx = 0, dy = -10, edge = shape, blend = 'source-over' } = opts;
  const m = ctx.getTransform(); const sc = Math.hypot(m.a, m.b) || 1;
  ctx.save();
  path(ctx, shape); ctx.clip();
  ctx.globalCompositeOperation = blend;
  ctx.filter = `blur(${(width * 0.45 * sc).toFixed(1)}px)`;
  ctx.translate(dx, dy);
  ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = width; ctx.lineJoin = 'round';
  path(ctx, edge, edge === shape); ctx.stroke();
  ctx.restore();
}

// a soft blurred glaze of colour clipped to a shape (wet-in-wet blooms, cheek warmth)
export function glaze(ctx, shape, x, y, rx, ry, color, alpha = 0.3) {
  ctx.save(); path(ctx, shape); ctx.clip(); pool(ctx, x, y, rx, ry, color, alpha); ctx.restore();
}

// a tapered lock of fur / a leaf-like petal growing outward at angle a from (cx, cy)
export function lock(cx, cy, a, r0, r1, w, curl = 0) {
  const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
  const P = (d, o) => [cx + ca * d + px * o, cy + sa * d + py * o];
  const L = r1 - r0;
  return smooth([P(r0 - L * 0.08, -w * 0.42), P(r0 + L * 0.4, -w * 0.58 + curl * w * 0.15), P(r0 + L * 0.8, -w * 0.22 + curl * w * 0.55),
    P(r1, curl * w * 0.95), P(r0 + L * 0.72, w * 0.3 + curl * w * 0.55), P(r0 + L * 0.32, w * 0.55), P(r0 - L * 0.08, w * 0.4)]);
}

// a clean graphite/sepia contour: one steady line plus a faint second pass
export function pencil(ctx, pts, opts = {}) {
  ink(ctx, pts, { width: 1.5, alpha: 0.62, wobble: 0.5, gaps: 0.25, ...opts });
}

// a soft, round-tipped tuft (fluffy manes, cheek ruffs): like lock() but with a curled, rounded end
export function tuft(cx, cy, a, r0, r1, w, curl = 0) {
  const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
  const L = r1 - r0;
  const P = (d, o) => { const c = curl * w * Math.pow(Math.max(0, (d - r0) / L), 1.6); return [cx + ca * d + px * (o + c), cy + sa * d + py * (o + c)]; };
  const pts = [P(r0 - L * 0.1, -w * 0.45), P(r0 + L * 0.35, -w * 0.55), P(r0 + L * 0.7, -w * 0.5)];
  const R = w * 0.5, tipD = r1 - R;
  for (let k = 1; k < 8; k++) { const t = -Math.PI / 2 + (k / 8) * Math.PI; pts.push(P(tipD + Math.cos(t) * R, Math.sin(t) * R)); }
  pts.push(P(r0 + L * 0.7, w * 0.5), P(r0 + L * 0.35, w * 0.55), P(r0 - L * 0.1, w * 0.45));
  return smooth(pts);
}

// ---------- softer, hand-drawn finishing ----------
function centroid(shape) { let x = 0, y = 0; for (const p of shape) { x += p[0]; y += p[1]; } return [x / shape.length, y / shape.length]; }

// Fur (or feathers) breaking the silhouette: short strokes along the outline, leaning outward.
// lean: extra angle (radians) to comb the fur in one direction.
export function furEdge(ctx, shape, opts = {}) {
  const { color = '#a24d22', count = 220, len = 10, width = 1.4, alpha = 0.8, seed = 9, lean = 0, inner = 0.45, skip = null } = opts;
  const r = rng(seed), [cx, cy] = centroid(shape), n = shape.length;
  const m = ctx.getTransform(); const sc = Math.hypot(m.a, m.b) || 1;
  ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const k = Math.floor(r() * n), p = shape[k], a = shape[(k + n - 1) % n], b = shape[(k + 1) % n];
    if (skip && skip(p[0], p[1])) continue;
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const d = Math.hypot(nx, ny) || 1; nx /= d; ny /= d;
    if (nx * (p[0] - cx) + ny * (p[1] - cy) < 0) { nx = -nx; ny = -ny; }
    // combed: lying mostly along the outline rather than sticking straight out
    const ang = Math.atan2(ny, nx) + 0.95 + lean * 0.4 + r.gauss(0, 0.22), L = len * 0.7 * r.range(0.5, 1.2);
    const x0 = p[0] - Math.cos(ang) * L * inner, y0 = p[1] - Math.sin(ang) * L * inner;
    const x1 = p[0] + Math.cos(ang) * L * (1 - inner), y1 = p[1] + Math.sin(ang) * L * (1 - inner);
    ctx.globalAlpha = alpha * 0.8 * r.range(0.5, 1); ctx.lineWidth = width * r.range(0.6, 1.2) / sc;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2 + r.gauss(0, L * 0.15), (y0 + y1) / 2 + r.gauss(0, L * 0.15), x1, y1); ctx.stroke();
  }
  ctx.restore();
}

// Wet-in-wet colour variation: soft pools of related hues, kept inside the shape.
export function blooms(ctx, shape, colors, opts = {}) {
  const { n = 7, size = 0.35, alpha = 0.3, seed = 13 } = opts;
  const r = rng(seed), b = bbox(shape);
  ctx.save(); path(ctx, shape); ctx.clip();
  for (let i = 0; i < n; i++) {
    const x = r.range(b.x0, b.x1), y = r.range(b.y0, b.y1), rr = Math.max(b.w, b.h) * size * r.range(0.5, 1.2);
    pool(ctx, x, y, rr, rr * r.range(0.6, 1), r.pick(colors), alpha * r.range(0.5, 1));
  }
  ctx.restore();
}

// Soften everything painted so far on this canvas (like wet edges), before the fine details go on.
export function soften(ctx, px = 1.2) {
  const c = ctx.canvas, tmp = canvas(c.width, c.height);
  tmp.getContext('2d').drawImage(c, 0, 0);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height);
  ctx.filter = `blur(${px}px)`; ctx.drawImage(tmp, 0, 0); ctx.restore();
}

// A light, sketchy pencil line: two loose passes with breaks, never a hard continuous outline.
export function sketch(ctx, pts, opts = {}) {
  const { closed = false, color = '#4a3226', alpha = 0.42, width = 1.2, seed = 21 } = opts;
  ink(ctx, pts, { closed, color, alpha, width, wobble: 0.9, gaps: 0.9, seed, taper: true });
  ink(ctx, pts.map(([x, y], i) => [x + Math.sin(i * 1.7) * 0.8, y + Math.cos(i * 1.3) * 0.8]), { closed, color, alpha: alpha * 0.45, width: width * 0.7, wobble: 1.2, gaps: 1.6, seed: seed + 1, taper: true });
}
