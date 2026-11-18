// The Crow and the Pitcher: scenery and environment.
//
// Pen-and-wash, after the classic English storybook (broken washes with the paper showing, granulation,
// fine broken ink lines on everything). All painters draw in the current ctx coordinates of a 1920x1080
// page; layers carry the usual camera margins (M, MY) and the big sets are painted at 2x so the camera can
// push in to ~2.3x and stay crisp.
//
// Places
//   paintDryFields(g, mood)        the opening: parched patchwork fields seen from high up, a dried stream
//                                  bed, hazy hills, and far below the little cottage garden (FIELDS_COTTAGE)
//   gardenLayers(mood)             the main set (2x): { back, front } canvases; draw the back, then the live
//                                  things (drawGardenFlowers, pitcher, pebbles, crow), then the front
//   drawGarden(g, t, c, mood, o)   convenience: the whole garden for one frame with hooks for the actors
//   drawPitcher(g, mood, o)        the tall clay pitcher (a live sprite, so the crow can be before/behind it)
//   PEBBLES, drawPebble(g, p, o)   the loose pebbles on the path by the pitcher (picked up one by one)
//   drawPitcherCloseup(g, level, t, o)       looking down into the pitcher's mouth at the water far below
//   drawPitcherCutaway(g, level, stones, t, o) a storybook "peek through the clay" side view
//   drawNestFront(g, mood)         the front rim of the nest in the elm (draw after a crow sitting in it)
// Moods: 'hot' (midday, bleached, heat shimmer), 'sunset' (pink-gold, long shadows), 'night' (moonlit blue,
// the cottage window lit). Each mood is painted (its own sky, shadows and a brushed glaze), not just tinted.
// Ambient life (functions of t): heatShimmer, butterflies, dustMotes, swifts, moths, windowGlow, plus
// stars / moon / fireflies from engine/stage.js.
import { W, H, rng, canvas, wash, pool, smooth, ellipse, fluffy, rgba, shade, tint, mix, noise1, glaze, penLine, sprite, drawSprite,
  bbox, path, ink, sketch, hatch, clamp, lerp, ease, ribbon, granulate, shadeEdge } from '../../engine/watercolor.js';
import { M, MY, LW, LH, cam, fireflies, stars, moon } from '../../engine/stage.js';
import { flecks, grassFlicks, cumulus } from '../north-wind-and-sun/scene.js';

const INKC = '#3a2c24';
const TAU = Math.PI * 2;

// Broken colour, as north-wind-and-sun's brushWash (a pale wash, then loose strokes of varied colour clipped to
// the shape, softened, with lifted streaks of bare paper), but the strokes are painted unfiltered into a small
// offscreen canvas and softened with a single blur: the same look, many times faster on the big 2x layers.
// Assumes the current transform has no rotation.
export function brushWash(g, shape, colors, o = {}) {
  const { seed = 1, count = 60, width = [18, 46], len = [80, 260], angle = () => 0, alpha = [0.16, 0.34], base = 0.3, blur = 0.9, edge = 0.25, under = false, lifts = 0.12 } = o;
  const r = rng(seed), b = bbox(shape), mt = g.getTransform(), sc = Math.hypot(mt.a, mt.b) || 1;
  wash(g, shape, { color: colors[0], opacity: base, seed, bleed: 0.03, layers: 18, edge, under });
  const pad = 12, x0 = b.x0 - pad, y0 = b.y0 - pad, tw = Math.ceil((b.w + 2 * pad) * sc), th = Math.ceil((b.h + 2 * pad) * sc);
  const mk = () => { const c = canvas(tw, th, false), t = c.getContext('2d'); t.setTransform(sc, 0, 0, sc, -x0 * sc, -y0 * sc); t.lineCap = 'round'; return [c, t]; };
  const [sc1, s] = mk(), [sc2, l] = mk();
  for (let i = 0; i < count; i++) {
    const x = r.range(b.x0 - 40, b.x1 + 40), y = r.range(b.y0, b.y1), a = angle(x, y) + r.gauss(0, 0.06), L = r.range(...len);
    s.strokeStyle = rgba(colors[i % colors.length], r.range(...alpha)); s.lineWidth = r.range(...width);
    const ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L, c = r.gauss(0, L * 0.06);
    s.beginPath(); s.moveTo(x, y); s.quadraticCurveTo((x + ex) / 2 - Math.sin(a) * c, (y + ey) / 2 + Math.cos(a) * c, ex, ey); s.stroke();
  }
  for (let i = 0; i < count * lifts; i++) {
    const x = r.range(b.x0, b.x1), y = r.range(b.y0, b.y1), a = angle(x, y), L = r.range(...len) * 0.6;
    l.strokeStyle = `rgba(250,244,230,${r.range(0.15, 0.35)})`; l.lineWidth = r.range(width[0] * 0.5, width[1] * 0.6);
    l.beginPath(); l.moveTo(x, y); l.quadraticCurveTo(x + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.5 + r.gauss(0, 4), x + Math.cos(a) * L, y + Math.sin(a) * L); l.stroke();
  }
  g.save(); path(g, shape); g.clip();
  g.save(); g.filter = `blur(${(6 * sc).toFixed(1)}px)`; g.strokeStyle = rgba(shade(colors[0], 0.25), 0.3); g.lineWidth = 10; path(g, shape); g.stroke(); g.restore();
  g.setTransform(1, 0, 0, 1, 0, 0);
  const dx = mt.a * x0 + mt.e, dy = mt.d * y0 + mt.f;
  g.filter = `blur(${(blur * sc).toFixed(2)}px)`; g.drawImage(sc1, dx, dy);
  g.filter = `blur(${(3 * sc).toFixed(1)}px)`; g.drawImage(sc2, dx, dy);
  g.restore();
}
// copy a finished float16 painting into an ordinary 8-bit canvas (faster to draw every frame, half the memory)
function to8(c) { const o = canvas(c.width, c.height, false); o.getContext('2d').drawImage(c, 0, 0); return o; }

// ---------------------------------------------------------------- moods
export const MOODS = {
  hot: {
    name: 'hot', sky: ['#bcd2d8', '#ece6cc', '#f8ecc6'], cloud: '#fdf8ea', cloudShade: '#dccab0',
    hills: ['#c8b8b4', '#d4c4a8', '#bcb0b4'], far: ['#d8c088', '#ccb27a', '#e0cc96'],
    field: ['#d8b05a', '#c99440', '#e0bc6c', '#b8864c', '#d4bc78', '#ae8c5c'], hedge: ['#5f6a38', '#4f5a34', '#6f7642'],
    lawn: ['#c8b46e', '#bcae6a', '#d4c07c', '#a8a464', '#c0a868'], earth: ['#c49a6c', '#a87e56', '#d0a878'],
    gravel: ['#e2d4b8', '#d4c6aa', '#cbbca4', '#dccab0'], stone: ['#dccfb2', '#cfc0a0', '#c4b8a8', '#d8c6a2', '#bfb2a0'],
    leaf: ['#7f8a50', '#6f7a46', '#94985a', '#a89a58'], elm: ['#64703e', '#738048', '#58663a', '#86884e'],
    clay: '#c4683e', clayLight: '#e09868', clayDark: '#7a3a24', slip: '#f2e2c4',
    shadow: '#6a5a78', shadowA: 0.32, light: 1,
  },
  sunset: {
    name: 'sunset', sky: ['#a8a0c4', '#eab4a4', '#f8d494'], cloud: '#fbe0c8', cloudShade: '#c890a0',
    hills: ['#b49ab4', '#c4a4b0', '#a894b0'], far: ['#d8a87c', '#c89a78', '#e0b488'],
    field: ['#dca868', '#cf9458', '#e4b47c', '#c08a5c', '#d8b480', '#b88c6c'], hedge: ['#5f6048', '#565640', '#6a6a50'],
    lawn: ['#c8a46a', '#bc9c66', '#d4b07a', '#a89a64', '#c09a68'], earth: ['#c89a78', '#b88a6a', '#d2a488'],
    gravel: ['#e8ccb4', '#dcbea8', '#d0b4a4', '#e2c4ae'], stone: ['#e0c4aa', '#d4b49c', '#c8aca4', '#dcbaa0', '#c4a69c'],
    leaf: ['#7a7c50', '#6a6e48', '#90885a', '#a88a58'], elm: ['#5e6440', '#6c7048', '#525a3c', '#807a4e'],
    clay: '#c8643e', clayLight: '#f0a070', clayDark: '#743624', slip: '#f6dcc0',
    shadow: '#6a4a80', shadowA: 0.4, light: 1,
  },
  night: { // painted from a dusk palette, then glazed blue (see moodGlaze)
    name: 'night', sky: ['#1e2a4c', '#34446c', '#5a6890'], cloud: '#8890b0', cloudShade: '#3a4468',
    hills: ['#a8a0bc', '#b0a8c0', '#9c98b8'], far: ['#c8b494', '#bcaa8c', '#d0bc9c'],
    field: ['#d0b47c', '#c4a46c', '#d8bc8c', '#b8a07c', '#ccbc98', '#ae9c80'], hedge: ['#5f6a4c', '#566044', '#687054'],
    lawn: ['#bcae7c', '#b0a878', '#c8b888', '#a0a070', '#b4a478'], earth: ['#bca488', '#ac9478', '#c4ac90'],
    gravel: ['#dcd4c4', '#d0c8b8', '#c8c0b4', '#d8ccbc'], stone: ['#d8d0bc', '#ccc0ac', '#c0bab4', '#d0c6b0', '#bcb4ac'],
    leaf: ['#74805a', '#647050', '#88905e', '#9a9460'], elm: ['#56644a', '#627050', '#4c5a44', '#727856'],
    clay: '#b86a48', clayLight: '#d89a78', clayDark: '#6a3a2c', slip: '#ece0cc',
    shadow: '#3a3a68', shadowA: 0.3, light: 0,
  },
};
// set-up timing, per painter (ms), for checking how long the sets take to paint
export const TIMING = {};
const tm = (k, fn) => { const t0 = performance.now(); const v = fn(); TIMING[k] = (TIMING[k] || 0) + performance.now() - t0; return v; };
const MD = (mood) => (typeof mood === 'object' ? mood : MOODS[mood] || MOODS.hot);

// ---------------------------------------------------------------- staging constants (page coordinates)
export const PITCHER = { x: 1140, y: 790, h: 210, rimY: 580, mouthW: 72 };   // y: base of the pitcher on the ground
export const COTTAGE = { x: 345, ground: 652, S: 0.92 };
export const WALL = { x0: 500, x1: 2080, y0: 698, y1: 708, h: 92 };          // the garden wall's foot runs from (x0,y0) to (x1,y1)
export const ELM = { x: 1712, ground: 676 };
export const NEST = [1700, 318];                                               // the middle of the nest's rim, in the elm's fork
export const BIRDBATH = { x: 760, y: 752 };
export const CAN = { x: 1420, y: 812 };                                        // the empty watering can, lying on its side
export const MOON = [660, 118];                                                // where to hang the moon at night
export const WINDOW = { x: 442, y: 527, w: 120, h: 110 };                       // the cottage window (centre, size) for glows and moths
export const DOOR = [216, 652];

// a camera looking at (cx, cy) with zoom z, kept inside the painted page (same as the other fables)
export function view(cx, cy, z) {
  const hw = W / 2 / z, hh = H / 2 / z;
  return { z, x: clamp(cx, -M + hw, W + M - hw) - W / 2, y: clamp(cy, -MY + hh, H + MY - hh) - H / 2 };
}
// a layer painted at twice the resolution (as in dove-and-ant), drawn with drawH
export function hlayer(fn, res = 2) {
  const c = canvas(LW * res, LH * res), g = c.getContext('2d'); g.scale(res, res); g.translate(M, MY); fn(g, c); return c;
}
export const drawH = (g, c, img) => { cam(g, c, 1); g.drawImage(img, -M, -MY, LW, LH); };

// ---------------------------------------------------------------- painting helpers
// Glaze everything already painted on canvas `c` (not the empty parts) for a mood, in a painterly way:
// broad uneven brush strokes rather than a flat tint. res: pixels per page unit of that canvas.
export function moodGlaze(c, mood, res = 1, seed = 5, o = {}) {
  const m = MD(mood);
  // the glaze is soft, so it is brushed at a quarter of the size (same coordinates) and enlarged when applied
  const w = c.width, h = c.height, q = 4, small = canvas(Math.ceil(w / q), Math.ceil(h / q)), t = small.getContext('2d'), r = rng(seed);
  t.setTransform(1 / q, 0, 0, 1 / q, 0, 0);
  const tmp = canvas(w, h), tf = tmp.getContext('2d');
  const strokesOf = (cols, n, wid, alpha, ang = 0) => {
    t.lineCap = 'round'; t.filter = `blur(${(wid * 0.25 * res / q).toFixed(1)}px)`;
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = r() * h, l = r.range(0.2, 0.5) * w, a = ang + r.gauss(0, 0.08);
      t.strokeStyle = rgba(cols[i % cols.length], r.range(alpha * 0.6, alpha)); t.lineWidth = wid * res * r.range(0.6, 1.4);
      t.beginPath(); t.moveTo(x - Math.cos(a) * l / 2, y - Math.sin(a) * l / 2); t.quadraticCurveTo(x, y + r.gauss(0, 20 * res), x + Math.cos(a) * l / 2, y + Math.sin(a) * l / 2); t.stroke();
    }
    t.filter = 'none';
  };
  const apply = (op, alpha = 1) => {
    tf.clearRect(0, 0, w, h); tf.imageSmoothingQuality = 'high'; tf.drawImage(small, 0, 0, w, h);
    tf.globalCompositeOperation = 'destination-in'; tf.drawImage(c, 0, 0); tf.globalCompositeOperation = 'source-over';
    const g = c.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = op; g.globalAlpha = alpha; g.drawImage(tmp, 0, 0); g.restore();
    t.clearRect(0, 0, w, h);
  };
  if (m.name === 'night') {
    t.fillStyle = '#6676b4'; t.fillRect(0, 0, w, h);
    strokesOf(['#4a5a9c', '#7a88c0', '#56649e', '#8a90b8'], 46, 90, 0.55, -0.05);
    apply('multiply', o.k ?? 0.92);
    t.fillStyle = 'rgba(30,40,100,1)'; t.fillRect(0, 0, w, h); apply('soft-light', 0.3 * (o.k ?? 1));
  } else if (m.name === 'sunset') {
    const lg = t.createLinearGradient(0, 0, w, h * 0.4);
    lg.addColorStop(0, 'rgba(255,190,120,1)'); lg.addColorStop(0.6, 'rgba(240,150,140,1)'); lg.addColorStop(1, 'rgba(170,110,150,1)');
    t.fillStyle = lg; t.fillRect(0, 0, w, h); strokesOf(['#ffb070', '#f08a8a', '#c87ab0', '#ffd090'], 36, 80, 0.5, 0.03);
    apply('soft-light', 0.7);
    t.fillStyle = '#f6d6c4'; t.fillRect(0, 0, w, h); strokesOf(['#e8b8b0', '#f4c8a0', '#d8b0c0'], 30, 90, 0.6, 0.03);
    apply('multiply', 0.55);
  } else {
    // hot: bleached, warm and dusty
    t.fillStyle = 'rgba(255,214,140,1)'; t.fillRect(0, 0, w, h); strokesOf(['#ffe0a0', '#f8c880', '#fff0c8'], 30, 90, 0.5, 0.02);
    apply('soft-light', 0.45);
    if (o.bleach !== false) { t.fillStyle = '#fbf1d8'; t.fillRect(0, 0, w, h); apply('source-atop', 0.1); }
  }
}

// a soft painted cast shadow on the ground for an object with foot (x, y), half-width hw and height hgt
export function castShadow(g, x, y, hw, hgt, mood, o = {}) {
  const m = MD(mood), r = rng(o.seed || Math.round(x * 3 + y));
  let shp;
  if (m.name === 'sunset') { const L = hgt * (o.len || 2.1), d = hgt * 0.16; shp = smooth([[x - hw, y - 2], [x + hw * 0.4, y - hw * 0.25], [x + L, y + d - hw * 0.15], [x + L + hw * 0.6, y + d + hw * 0.2], [x + hw * 0.6, y + hw * 0.3], [x - hw * 0.8, y + hw * 0.25]]); }
  else if (m.name === 'night') { const L = hgt * 0.6; shp = smooth([[x - hw, y], [x + hw * 0.2, y - hw * 0.2], [x + L, y + hw * 0.05], [x + L * 0.9, y + hw * 0.35], [x - hw * 0.6, y + hw * 0.3]]); }
  else shp = ellipse(x + hw * 0.18, y + hw * 0.05, hw * 1.15, Math.max(4, hw * 0.24), 22);
  g.save(); g.globalCompositeOperation = 'multiply';
  wash(g, shp, { color: m.shadow, opacity: (o.alpha ?? 1) * m.shadowA * 1.6, seed: r() * 1e5 | 0, bleed: 0.04, layers: 14, edge: 0.15 });
  g.restore();
}

// ---------------------------------------------------------------- the tall clay pitcher
// Profile: [height fraction, half-width fraction] from the foot up to the flared rim.
const PROF = [[0, 0.15], [0.025, 0.165], [0.045, 0.152], [0.1, 0.205], [0.2, 0.27], [0.33, 0.302], [0.46, 0.296], [0.58, 0.262], [0.68, 0.205],
  [0.76, 0.152], [0.83, 0.128], [0.89, 0.126], [0.94, 0.142], [0.975, 0.168], [1.0, 0.172]];
const RIM_RY = 0.3;   // the mouth seen from slightly above: ry = rx * RIM_RY
function profW(y) { // half-width at height fraction y (0..1)
  for (let i = 1; i < PROF.length; i++) if (y <= PROF[i][0]) { const [y0, w0] = PROF[i - 1], [y1, w1] = PROF[i]; const k = (y - y0) / (y1 - y0); return w0 + (w1 - w0) * (k * k * (3 - 2 * k)); }
  return PROF[PROF.length - 1][1];
}
// outline of the pitcher's body (without the handle), foot at (cx, base), height h
function pitcherOutline(cx, base, h) {
  const L = [], R = [], n = 60;
  for (let i = 0; i <= n; i++) { const y = i / n, w = profW(y) * h; L.push([cx - w, base - y * h]); R.push([cx + w, base - y * h]); }
  const fw = profW(0) * h, bot = [], top = [];
  for (let i = 1; i < 16; i++) { const a = Math.PI - (i / 16) * Math.PI; bot.push([cx + Math.cos(a) * fw, base + Math.sin(a) * fw * RIM_RY]); }
  const rw = profW(1) * h;
  for (let i = 1; i < 16; i++) { const a = (i / 16) * Math.PI; top.push([cx + Math.cos(a) * rw, base - h + Math.sin(a) * rw * RIM_RY]); }
  return L.slice().reverse().concat(bot).concat(R).concat(top);
}
function handleLine(cx, base, h) {
  const P = (x, y) => [cx + x * h, base - y * h];
  return [P(0.115, 0.875), P(0.21, 0.885), P(0.31, 0.83), P(0.345, 0.72), P(0.31, 0.62), P(0.24, 0.565)];
}
// Paint the pitcher (body, handle, mouth, decoration, ink) at foot (cx, base) with height h.
export function paintPitcher(g, cx, base, h, mood = 'hot', o = {}) {
  const m = MD(mood), r = rng(o.seed || 77), s = h / 210;
  const body = pitcherOutline(cx, base, h);
  const hl = handleLine(cx, base, h), hw = 0.05 * h;
  const handle = ribbon(hl, hw * 1.1, hw * 0.85, 6);
  // the handle first (its root hides under the body edge)
  wash(g, handle, { color: m.clay, opacity: 0.97, seed: 101, under: '#f0e0cc', bleed: 0.01, layers: 14 });
  shadeEdge(g, handle, { color: m.clayDark, alpha: 0.55, width: hw * 0.9, dx: -hw * 0.3, dy: hw * 0.2 });
  // the body: per-row shading round the form (light from the upper left), so it reads as a turned pot
  wash(g, body, { color: m.clay, opacity: 0.97, seed: 102, under: '#f0e0cc', bleed: 0.008, layers: 20, edge: 0.4 });
  g.save(); path(g, body); g.clip();
  const step = Math.max(1, h / 140);
  for (let y = base + 8; y > base - h - 20; y -= step) {
    const f = clamp((base - y) / h), w = profW(f) * h;
    const lg = g.createLinearGradient(cx - w, 0, cx + w, 0);
    lg.addColorStop(0, rgba(m.clayDark, 0.18)); lg.addColorStop(0.18, rgba(m.clayLight, 0.32)); lg.addColorStop(0.34, rgba(m.clayLight, 0.5));
    lg.addColorStop(0.52, rgba(m.clay, 0)); lg.addColorStop(0.8, rgba(m.clayDark, 0.42)); lg.addColorStop(0.93, rgba(m.clayDark, 0.55)); lg.addColorStop(1, rgba(m.clay, 0.25));
    g.fillStyle = lg; g.fillRect(cx - w - 2, y - step, 2 * w + 4, step + 0.6);
  }
  // under the shoulder and the belly's lower curve sit in shadow; the shoulder top catches the sun
  pool(g, cx + 0.05 * h, base - 0.62 * h, 0.3 * h, 0.07 * h, m.clayDark, 0.35);
  pool(g, cx - 0.06 * h, base - 0.5 * h, 0.22 * h, 0.06 * h, m.clayLight, 0.35);
  pool(g, cx, base - 0.02 * h, 0.3 * h, 0.08 * h, m.clayDark, 0.45);
  // broken colour: loose strokes going round the pot, and throwing rings
  g.lineCap = 'round';
  for (let i = 0; i < 70; i++) {
    const f = r.range(0.04, 0.97), w = profW(f) * h, y = base - f * h, a0 = r.range(0.1, 0.9) * Math.PI, a1 = a0 + r.range(0.2, 0.6);
    g.strokeStyle = rgba(r.pick([m.clayLight, m.clayDark, '#d8885a', '#a85030', '#c87850']), r.range(0.08, 0.22)); g.lineWidth = r.range(2, 7) * s;
    g.beginPath(); g.ellipse(cx, y, w, w * RIM_RY * 0.8, 0, a0, a1); g.stroke();
  }
  // a cream slip band with a wavy line and dots round the shoulder, and two scratched rings on the belly
  const band = (f, fn) => { const w = profW(f) * h, y = base - f * h; return (a) => [cx + Math.cos(a) * w, y + Math.sin(a) * w * RIM_RY * 0.75 + (fn ? fn(a) : 0)]; };
  for (const [f, al] of [[0.705, 0.7], [0.665, 0.55]]) { const P = band(f), pts = []; for (let i = 0; i <= 30; i++) pts.push(P(0.05 + i / 30 * (Math.PI - 0.1))); ink(g, pts, { color: m.slip, width: 2.2 * s, alpha: al, wobble: 0.3, seed: 110 + f * 100 }); }
  { const pts = []; for (let i = 0; i <= 60; i++) { const a = 0.08 + i / 60 * (Math.PI - 0.16); const w = profW(0.685) * h; pts.push([cx + Math.cos(a) * w, base - 0.685 * h + Math.sin(a) * w * RIM_RY * 0.75 + Math.sin(a * 14) * 2.2 * s]); }
    ink(g, pts, { color: m.slip, width: 1.6 * s, alpha: 0.85, wobble: 0.2, seed: 113 }); }
  for (let i = 0; i < 9; i++) { const a = 0.25 + i / 8 * (Math.PI - 0.5), P = band(0.42); const [x, y] = P(a); g.fillStyle = rgba(m.slip, 0.75 * Math.sin(a)); g.beginPath(); g.ellipse(x, y, 2.4 * s * Math.sin(a), 2.4 * s, 0, 0, TAU); g.fill(); }
  for (const f of [0.47, 0.37]) { const P = band(f), pts = []; for (let i = 0; i <= 30; i++) pts.push(P(0.08 + i / 30 * (Math.PI - 0.16))); ink(g, pts, { color: m.clayDark, width: 1 * s, alpha: 0.45, wobble: 0.3, gaps: 0.4, seed: 120 + f * 100 }); }
  // a darker damp stain round the foot, and a few chips and specks of earth
  pool(g, cx, base - 0.06 * h, 0.28 * h, 0.05 * h, '#5a3020', 0.25);
  for (let i = 0; i < 26; i++) { const f = r.range(0.02, 0.95), w = profW(f) * h * r.range(-0.9, 0.9); g.fillStyle = rgba(r() < 0.5 ? m.clayDark : m.slip, r.range(0.15, 0.4)); g.beginPath(); g.arc(cx + w, base - f * h, r.range(0.6, 1.6) * s, 0, TAU); g.fill(); }
  // ink hatching down the shadow side
  hatch(g, body, { color: INKC, count: Math.round(160 * s), len: 7 * s, width: 0.8, alpha: 0.4, seed: 130, dir: () => Math.PI / 2 + 0.15, curve: 0.3,
    density: (x) => clamp(((x - cx) / (0.3 * h) - 0.35) * 1.6) });
  g.restore();
  // the mouth: a dark opening inside the flared rim, its far inner wall catching a little light
  const rw = profW(1) * h, ry = rw * RIM_RY, ty = base - h;
  const outer = ellipse(cx, ty, rw, ry, 40), inner = ellipse(cx, ty + ry * 0.12, rw * 0.8, ry * 0.68, 40);
  wash(g, outer, { color: tint(m.clay, 0.15), opacity: 0.97, seed: 140, under: '#f0e0cc', bleed: 0.005, layers: 10, edge: 0.3 });
  glaze(g, outer, cx - rw * 0.35, ty - ry * 0.3, rw * 0.5, ry * 0.5, m.clayLight, 0.5);
  g.save(); path(g, inner); g.clip();
  g.fillStyle = '#2a1a16'; g.fill();
  const ig = g.createLinearGradient(0, ty - ry, 0, ty + ry); ig.addColorStop(0, rgba(m.clayDark, 0.95)); ig.addColorStop(0.45, rgba('#3a2018', 0.6)); ig.addColorStop(1, 'rgba(20,12,10,0)');
  g.fillStyle = ig; g.fillRect(cx - rw, ty - ry, rw * 2, ry * 2);
  g.restore();
  penLine(g, inner, { closed: true, w: 1.4 * s, alpha: 0.75, seed: 141 });
  penLine(g, outer.slice(18).concat(outer.slice(0, 3)), { w: 1.2 * s, alpha: 0.55, seed: 142 });
  // ink: a swelling pen line round the body (heavier on the shadow side), and the handle
  const n = body.length;
  penLine(g, body.slice(0, Math.floor(n * 0.47)), { w: 1.7 * s, alpha: 0.82, seed: 150, weight: (t) => 0.45 + 0.5 * Math.sin(Math.PI * t) });
  penLine(g, body.slice(Math.floor(n * 0.42), Math.floor(n * 0.92)), { w: 2.3 * s, alpha: 0.88, seed: 151, weight: (t) => 0.5 + 0.6 * Math.sin(Math.PI * t) });
  const hL = [], hR = []; { const c = smooth(hl, false, 6); for (let i = 0; i < c.length; i++) { const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d; const ww = lerp(hw * 1.1, hw * 0.85, i / (c.length - 1)) / 2; hL.push([c[i][0] - dy * ww, c[i][1] + dx * ww]); hR.push([c[i][0] + dy * ww, c[i][1] - dx * ww]); } }
  penLine(g, hL.slice(3), { w: 1.4 * s, alpha: 0.75, seed: 152 }); penLine(g, hR.slice(3), { w: 1.8 * s, alpha: 0.8, seed: 153 });
  // a single hairline crack and a chip in the lip: an old, much-loved pot
  ink(g, [[cx - 0.06 * h, base - 0.985 * h + ry * 0.9], [cx - 0.07 * h, base - 0.93 * h], [cx - 0.055 * h, base - 0.88 * h]], { width: 0.8 * s, alpha: 0.5, seed: 160 });
}

// cached pitcher sprites per mood (3x resolution: the camera goes very close)
const PSPR = {};
export function pitcherSprite(mood = 'hot') {
  const m = MD(mood);
  if (PSPR[m.name]) return PSPR[m.name];
  const { x, y, h } = PITCHER;
  const s = sprite({ x0: x - h * 0.42, y0: y - h * 1.08, x1: x + h * 0.48, y1: y + h * 0.08, w: h * 0.9, h: h * 1.16 }, 3, (g) => paintPitcher(g, x, y, h, m), { seed: 9, grain: 0.16 });
  if (m.name !== 'hot') moodGlaze(s.c, m, 3, 21);
  if (m.name === 'night') { const g = s.c.getContext('2d'); g.save(); g.setTransform(3, 0, 0, 3, -s.x0 * 3, -s.y0 * 3); g.globalCompositeOperation = 'source-atop';
    shadeEdge(g, pitcherOutline(x, y, h), { color: '#c8d4f8', alpha: 0.55, width: h * 0.09, dx: h * 0.045, dy: 0, blend: 'screen' });
    shadeEdge(g, ellipse(x, y - h, profW(1) * h, profW(1) * h * RIM_RY, 30), { color: '#c8d4f8', alpha: 0.5, width: h * 0.05, dx: 0, dy: h * 0.02, blend: 'screen' }); g.restore(); }
  PSPR[m.name] = s;
  return s;
}
const SHSPR = {};
function pitcherShadowSprite(mood) {
  const m = MD(mood);
  if (SHSPR[m.name]) return SHSPR[m.name];
  const { x, y, h } = PITCHER;
  return (SHSPR[m.name] = sprite({ x0: x - 120, y0: y - 60, x1: x + 560, y1: y + 90, w: 680, h: 150 }, 2, (g) => castShadow(g, x, y + 2, h * 0.3, h, m, { len: 1.5, seed: 31 }), { granulate: false }));
}
// Draw the pitcher where it stands (PITCHER). o.tilt: rocking angle (radians, + leans right) about the edge of its foot;
// o.dx/o.dy: nudge; o.shadow (default true) draws its cast shadow.
export function drawPitcher(g, mood = 'hot', o = {}) {
  const { tilt = 0, dx = 0, dy = 0, shadow = true } = o;
  const { x, y, h } = PITCHER;
  if (shadow) drawSprite(g, pitcherShadowSprite(mood));
  g.save(); g.translate(dx, dy);
  if (tilt) { const px = x + Math.sign(tilt) * profW(0) * h; g.translate(px, y); g.rotate(tilt); g.translate(-px, -y); }
  drawSprite(g, pitcherSprite(mood));
  g.restore();
}

// ---------------------------------------------------------------- pebbles on the path
// The loose pebbles lying on the path's edge by the pitcher, each { x, y, r, col } (page coords, the foot of the pebble).
export const PEBBLES = (() => {
  const r = rng(808), out = [], cols = ['#d6ccbc', '#c4b8a6', '#b8b0a8', '#d8c4a4', '#a8a4a4', '#cbb69a', '#e0d6c4', '#9c968e'];
  const spots = [[1010, 832], [1046, 846], [1088, 838], [1124, 852], [1172, 846], [1214, 836], [1252, 850], [1296, 842], [1032, 868], [1104, 874], [1186, 872], [1262, 876], [1330, 864], [978, 856]];
  spots.forEach(([x, y], i) => out.push({ x: x + r.gauss(0, 5), y: y + r.gauss(0, 3), r: r.range(7.5, 10.5), col: cols[i % cols.length], rot: r.gauss(0, 0.25), seed: 900 + i }));
  return out;
})();
const PEB = new Map();
function pebbleSprite(p, mood) {
  const m = MD(mood), key = p.seed + ':' + m.name;
  if (PEB.has(key)) return PEB.get(key);
  const R = p.r, box = { x0: -R * 1.6, y0: -R * 1.7, x1: R * 1.6, y1: R * 0.4, w: R * 3.2, h: R * 2.1 };
  const s = sprite(box, 4, (g) => paintPebble(g, 0, 0, R, p.col, p.seed, p.rot || 0), { grain: 0.25, seed: p.seed });
  if (m.name !== 'hot') moodGlaze(s.c, m, 4, p.seed);
  PEB.set(key, s);
  return s;
}
function paintPebble(g, x, y, R, col, seed, rot = 0) {
  const r = rng(seed), cy = y - R * 0.62;
  const shp = smooth([[x - R * 1.3, cy + R * 0.1], [x - R * 0.9, cy - R * 0.55], [x - R * 0.1, cy - R * 0.72], [x + R * 0.8, cy - R * 0.5], [x + R * 1.32, cy + R * 0.05], [x + R * 0.9, cy + R * 0.55], [x, cy + R * 0.62], [x - R * 0.95, cy + R * 0.5]]
    .map(([px, py]) => [x + (px - x) * Math.cos(rot) - (py - cy) * Math.sin(rot) + r.gauss(0, R * 0.05), cy + (px - x) * Math.sin(rot) + (py - cy) * Math.cos(rot) + r.gauss(0, R * 0.05)]));
  wash(g, shp, { color: col, opacity: 0.97, under: '#f2ead8', seed, layers: 10, edge: 0.35, bleed: 0.02 });
  shadeEdge(g, shp, { color: shade(col, 0.45), alpha: 0.6, width: R * 0.7, dx: R * 0.15, dy: -R * 0.35 });
  glaze(g, shp, x - R * 0.35, cy - R * 0.3, R * 0.6, R * 0.3, '#ffffff', 0.55);
  for (let i = 0; i < 6; i++) { g.fillStyle = rgba(r() < 0.5 ? shade(col, 0.4) : '#ffffff', 0.35); g.beginPath(); g.arc(x + r.range(-R, R) * 0.8, cy + r.range(-R, R) * 0.4, r.range(0.3, 0.8), 0, TAU); g.fill(); }
  penLine(g, shp, { closed: true, w: Math.max(0.7, R * 0.11), alpha: 0.75, seed: seed + 1, weight: (t) => 0.4 + 0.8 * Math.max(0, Math.sin(Math.PI * (t + 0.15))) });
}
// Draw one pebble. o: { x, y } to draw it somewhere else (e.g. in the crow's beak), rot (radians), scale,
// shadow (default true; false when carried), mood.
export function drawPebble(g, p, o = {}) {
  const { x = p.x, y = p.y, rot = 0, scale = 1, shadow = true, mood = 'hot' } = o;
  if (shadow) { g.save(); g.fillStyle = rgba(MD(mood).shadow, 0.35); g.beginPath(); g.ellipse(x + p.r * 0.25, y + 0.5, p.r * 1.35, p.r * 0.32, 0, 0, TAU); g.fill(); g.restore(); }
  const s = pebbleSprite(p, mood);
  g.save(); g.translate(x, y); if (rot) g.rotate(rot); if (scale !== 1) g.scale(scale, scale);
  drawSprite(g, s); g.restore();
}

// ---------------------------------------------------------------- skies
// hz: where the land starts (the sky is brightest there). Paints the whole layer.
export function paintSky(g, mood, o = {}) {
  const m = MD(mood), { hz = 450, seed = 3, sun = true } = o, r = rng(seed);
  g.fillStyle = '#f4ecdc'; g.fillRect(-M - 10, -MY - 10, LW + 20, LH + 20);
  const grd = g.createLinearGradient(0, -MY, 0, hz + 40);
  grd.addColorStop(0, m.sky[0]); grd.addColorStop(0.62, m.sky[1]); grd.addColorStop(1, m.sky[2]);
  g.globalAlpha = 0.9; g.fillStyle = grd; g.fillRect(-M - 10, -MY - 10, LW + 20, LH + 20); g.globalAlpha = 1;
  const box = [[-M - 40, -MY - 40], [W + M + 40, -MY - 40], [W + M + 40, hz + 60], [-M - 40, hz + 60]];
  brushWash(g, box, [m.sky[0], tint(m.sky[0], 0.3), m.sky[1], shade(m.sky[0], 0.08)], { seed, count: 70, width: [30, 90], len: [200, 640], alpha: [0.1, 0.26], base: 0.04, blur: 3, angle: () => -0.03, lifts: m.name === 'night' ? 0 : 0.18 });
  if (m.name === 'hot') {
    // a bleached white sun high up on the left, its glare washing out the sky round it
    if (sun) { pool(g, 300, 40, 620, 520, '#fffbea', 0.75); pool(g, 300, 40, 220, 220, '#ffffff', 0.7);
      g.save(); g.filter = 'blur(2px)'; g.fillStyle = 'rgba(255,253,240,0.95)'; g.beginPath(); g.arc(300, 40, 46, 0, TAU); g.fill(); g.restore();
      ink(g, ellipse(300, 40, 50, 50, 30), { closed: true, color: '#c8a050', width: 1, alpha: 0.35, gaps: 1.2, seed: seed + 3 }); }
    // high thin wisps and one small fair-weather cloud far off: no rain today
    for (let i = 0; i < 9; i++) { const x = r.range(500, 2000), y = r.range(60, 260), l = r.range(160, 380);
      g.save(); g.filter = 'blur(4px)'; g.strokeStyle = rgba(m.cloud, r.range(0.35, 0.6)); g.lineWidth = r.range(5, 14); g.lineCap = 'round';
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l * 0.5, y - r.range(4, 14), x + l, y + r.gauss(0, 6)); g.stroke(); g.restore(); }
    if (o.clouds !== false) { cumulus(g, m, 1500, hz - 70, 110, seed + 40); cumulus(g, m, 860, hz - 46, 70, seed + 41); }
  } else if (m.name === 'sunset') {
    if (sun) { pool(g, 250, hz - 40, 700, 420, '#ffd890', 0.6); pool(g, 250, hz - 40, 200, 160, '#fff0c0', 0.8);
      g.save(); g.filter = 'blur(2.5px)'; g.fillStyle = 'rgba(255,214,120,0.95)'; g.beginPath(); g.arc(250, hz - 34, 64, 0, TAU); g.fill(); g.restore(); }
    // long streaky clouds, lit gold underneath
    for (let i = 0; i < 11; i++) {
      const x = r.range(-60, 1900), y = r.range(70, hz - 80), w = r.range(160, 420), hh = r.range(10, 22);
      const sh = smooth([[x - w, y + hh * 0.3], [x - w * 0.5, y - hh * 0.6], [x + w * 0.2, y - hh], [x + w, y], [x + w * 0.4, y + hh * 0.7], [x - w * 0.5, y + hh * 0.7]]);
      wash(g, sh, { color: r() < 0.5 ? '#c88aa4' : '#b88aa8', opacity: 0.6, seed: seed + 50 + i, bleed: 0.06, layers: 14, edge: 0.15 });
      glaze(g, sh, x, y + hh * 0.6, w * 0.9, hh * 0.7, '#ffc888', 0.75);
      ink(g, sh.slice(0, Math.floor(sh.length * 0.5)), { width: 0.8, alpha: 0.3, gaps: 1.5, seed: seed + 70 + i });
    }
  } else {
    pool(g, MOON[0], MOON[1], 520, 420, '#9aa8d0', 0.35);
    for (let i = 0; i < 0; i++) { // (no clouds at night: they read as smears against the dark sky)
      const x = r.range(-60, 1900), y = r.range(90, hz - 120), w = r.range(160, 380), hh = r.range(10, 20);
      const sh = smooth([[x - w, y + hh * 0.3], [x - w * 0.5, y - hh * 0.6], [x + w * 0.2, y - hh], [x + w, y], [x + w * 0.4, y + hh * 0.7], [x - w * 0.5, y + hh * 0.7]]);
      wash(g, sh, { color: '#2c3658', opacity: 0.45, seed: seed + 50 + i, bleed: 0.06, layers: 12, edge: 0.1 });
      glaze(g, sh, x - w * 0.2, y - hh * 0.6, w * 0.7, hh * 0.4, '#8a96bc', 0.25);
    }
  }
}

// ---------------------------------------------------------------- the dry fields, from high up
// A bird's-eye patchwork: ground-plane (X across, Z away) projected onto the page.
const FZ = { hz: 318, f: 860 };
const fproj = (X, Z) => [960 + FZ.f * X / Z, FZ.hz + FZ.f / Z];
// where the little cottage garden lies in the opening shot (zoom toward it), and its pitcher
export const FIELDS_COTTAGE = fproj(0.45, 2.45);
export const FIELDS_PITCHER = fproj(0.5, 2.66);
// the dried-up stream's course on the ground plane
const streamX = (Z) => -0.74 + 0.45 * Math.sin(Z * 0.55 + 0.6) + 0.06 * Z - 0.2 * Math.sin(Z * 1.7);
export function paintDryFields(g, mood = 'hot', o = {}) {
  const m = MD(mood), seed = o.seed || 61, r = rng(seed);
  paintSky(g, m, { hz: FZ.hz, seed: seed + 1, clouds: false });
  // hazy hills on the horizon, two ranges
  const hill = (y0, amp, sd) => { const pts = []; for (let x = -M - 40; x <= W + M + 40; x += 40) pts.push([x, y0 - amp * (0.5 + 0.5 * Math.sin(x * 0.0021 + sd) * Math.sin(x * 0.0009 + sd * 2)) - amp * 0.25 * noise1(x * 0.01, sd)]); return smooth(pts, false, 4); };
  const h1 = hill(FZ.hz - 8, 90, 2);
  brushWash(g, h1.concat([[W + M + 40, FZ.hz + 40], [-M - 40, FZ.hz + 40]]), m.hills.map((c) => mix(c, m.sky[2], 0.35)), { seed: seed + 2, count: 70, width: [20, 50], angle: () => 0.05, alpha: [0.1, 0.22], base: 0.45, under: true });
  sketch(g, h1, { alpha: 0.3, width: 1, seed: seed + 3 });
  const h2 = hill(FZ.hz + 6, 46, 5);
  brushWash(g, h2.concat([[W + M + 40, FZ.hz + 60], [-M - 40, FZ.hz + 60]]), m.hills.map((c) => mix(c, m.far[0], 0.4)), { seed: seed + 4, count: 60, width: [16, 40], angle: () => -0.03, alpha: [0.12, 0.26], base: 0.5, under: true });
  sketch(g, h2, { alpha: 0.35, width: 1, seed: seed + 5 });
  // the patchwork: rows of fields from the horizon down; row boundaries wander and field sides are skewed,
  // so it reads as old fields bounded by hedges, not a grid
  const zs = []; for (let z = 34; z > 0.7; z /= 1.32) zs.push(z);
  const rowZ = (k, X) => zs[k] * (1 + 0.075 * Math.sin(X * 0.8 + k * 1.7) + 0.045 * Math.sin(X * 2.3 + k * 0.6));
  const rows = zs.map((Z) => { const sp = 0.45 + Z * 0.08, xs = []; const lim = (1250 + M) * Z / FZ.f + sp * 2;
    for (let X = -lim - r() * sp; X < lim + sp; X += sp * r.range(0.6, 1.45)) xs.push([X, r.range(-0.12, 0.12)]); return xs; });
  const hedges = [], copses = [];
  for (let k = 0; k < zs.length - 1; k++) {
    const xs = rows[k + 1];
    for (let j = 0; j < xs.length - 1; j++) {
      const [X0, s0] = xs[j], [X1, s1] = xs[j + 1];
      // corners in the plane: far edge on boundary k, near edge on boundary k+1, sides slanting by s
      const side = (X, s) => { const za = rowZ(k, X); const pts = []; for (let q = 0; q <= 4; q++) { const u = q / 4, z = lerp(za, rowZ(k + 1, X + s * (za - zs[k + 1])), u); pts.push([X + s * (za - z), z]); } return pts; };
      const far = [], near = []; for (let q = 0; q <= 6; q++) { const X = lerp(X0, X1, q / 6); far.push([X, rowZ(k, X)]); }
      const L = side(X0, s0), R = side(X1, s1);
      for (let q = 0; q <= 6; q++) { const u = q / 6, X = lerp(L[4][0], R[4][0], u); near.push([X, rowZ(k + 1, X)]); }
      const plane = far.concat(R.slice(1), near.slice().reverse().slice(1), L.slice().reverse().slice(1, -1));
      const shp = plane.map(([X, Z]) => fproj(X, Z)), b = bbox(shp);
      if (b.x1 < -M - 50 || b.x0 > W + M + 50) continue;
      const Za = zs[k], nearCell = (b.y1 - b.y0) > 40;
      const roll = r(), kind = roll < 0.38 ? 'stubble' : roll < 0.58 ? 'plough' : roll < 0.8 ? 'pasture' : roll < 0.93 ? 'hay' : 'copse';
      const base = kind === 'plough' ? m.earth : kind === 'pasture' || kind === 'copse' ? [mix(m.lawn[3], m.field[4], 0.4), m.lawn[0], m.field[4]] : [m.field[j % m.field.length], m.field[(j + 2) % m.field.length], m.field[(k + 1) % m.field.length]];
      const hazeK = clamp((Za - 6) / 30) * 0.55;
      const cols = base.map((c) => mix(c, m.sky[2], hazeK));
      const toward = r() < 0.55, vx = (b.x0 + b.x1) / 2, ang = toward ? Math.atan2(FZ.hz - b.y1, 960 - vx) : 0.0;
      if (nearCell) brushWash(g, shp, cols, { seed: seed + 100 + k * 50 + j, count: Math.min(60, 10 + Math.round(b.w * b.h / 3000)), width: [6, Math.max(8, b.h * 0.2)], len: [b.w * 0.2, b.w * 0.6], angle: () => ang, alpha: [0.16, 0.34], base: 0.6, under: '#f2e8d4', lifts: 0.2, blur: 0.7 });
      else { g.fillStyle = rgba(cols[0], 0.85); path(g, shp); g.fill(); g.save(); path(g, shp); g.clip(); g.fillStyle = rgba(cols[1], 0.4); g.beginPath(); g.ellipse(b.x0 + b.w * r(), (b.y0 + b.y1) / 2, b.w * 0.3, b.h * 0.5, 0, 0, TAU); g.fill(); g.restore(); }
      g.save(); path(g, shp); g.clip();
      if (kind === 'stubble' || kind === 'plough') { // rows in the field, running toward the horizon or across
        const nL = toward ? Math.max(3, Math.round((X1 - X0) / 0.035)) : Math.max(4, Math.round(16 * Math.min(1, b.h / 60)));
        g.strokeStyle = rgba(shade(cols[0], kind === 'plough' ? 0.42 : 0.28), (kind === 'plough' ? 0.38 : 0.26) * (1 - hazeK)); g.lineWidth = Math.max(0.5, 2.4 / Za);
        for (let q = 0; q < nL; q++) { const u = (q + 0.5) / nL;
          const P0 = toward ? [lerp(X0, X1, u), rowZ(k, lerp(X0, X1, u))] : [lerp(L[0][0], L[4][0], u), lerp(L[0][1], L[4][1], u)];
          const P1 = toward ? [lerp(L[4][0], R[4][0], u), rowZ(k + 1, lerp(L[4][0], R[4][0], u))] : [lerp(R[0][0], R[4][0], u), lerp(R[0][1], R[4][1], u)];
          const [ax, ay] = fproj(...P0), [bx, by] = fproj(...P1); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
      } else if (kind === 'hay' && Za < 14) { // round hay bales
        for (let q = 0; q < 10; q++) { const u = r.range(0.1, 0.9), v = r.range(0.15, 0.85), X = lerp(lerp(X0, X1, u), lerp(L[4][0], R[4][0], u), v), Z = lerp(rowZ(k, X), rowZ(k + 1, X), v), [x, y] = fproj(X, Z), s = 14 / Z;
          g.fillStyle = rgba(m.shadow, 0.3); g.beginPath(); g.ellipse(x + s * 0.6, y + s * 0.3, s * 1.2, s * 0.35, 0, 0, TAU); g.fill();
          g.fillStyle = rgba(mix('#e4c880', m.sky[2], hazeK), 0.95); g.beginPath(); g.ellipse(x, y - s * 0.5, s, s * 0.75, 0, 0, TAU); g.fill();
          g.strokeStyle = rgba(INKC, 0.5); g.lineWidth = Math.max(0.5, 0.9 * s / 7); g.stroke(); g.beginPath(); g.ellipse(x - s * 0.3, y - s * 0.5, s * 0.35, s * 0.6, 0, 0, TAU); g.stroke(); }
      } else flecks(g, shp, [shade(cols[0], 0.2), tint(cols[1], 0.2)], { seed: seed + 300 + j, count: Math.min(900, Math.round(b.w * b.h / 300)), size: [1, 3.5], alpha: [0.15, 0.35], dy: 0.5 });
      g.restore();
      if (kind === 'copse' && Za < 16) copses.push([lerp(X0, X1, 0.5), lerp(Za, zs[k + 1], 0.5), (X1 - X0) * 0.35]);
      // hedgerows along the field's left side and its near edge (not every edge: some fields run together)
      if (r() < 0.82) hedges.push(L);
      if (r() < 0.75) hedges.push(near);
    }
  }
  // the dried-up stream: a pale bed of cracked mud between dusty banks, winding toward us
  const sP = []; for (let Z = 30; Z > 0.75; Z /= 1.035) sP.push([streamX(Z), Z]);
  const half = (Z) => 0.06 + 0.015 * Math.sin(Z * 3);
  const sL = sP.map(([X, Z]) => fproj(X - half(Z), Z)), sR = sP.map(([X, Z]) => fproj(X + half(Z), Z));
  const bank = sP.map(([X, Z]) => fproj(X - half(Z) * 1.8, Z)).concat(sP.map(([X, Z]) => fproj(X + half(Z) * 1.8, Z)).reverse());
  brushWash(g, bank, [mix(m.hedge[2], m.earth[1], 0.5), mix(m.lawn[3], m.earth[0], 0.4), m.earth[1]], { seed: seed + 500, count: 90, width: [3, 12], len: [20, 70], alpha: [0.2, 0.4], base: 0.55, lifts: 0.1 });
  const bed = sL.concat(sR.slice().reverse());
  brushWash(g, bed, [mix(m.earth[2], m.gravel[1], 0.35), m.earth[2], tint(m.earth[0], 0.15), mix(m.earth[1], m.gravel[0], 0.3)], { seed: seed + 501, count: 140, width: [4, 16], len: [30, 120], angle: () => 0.0, alpha: [0.18, 0.36], base: 0.8, under: '#efe4cc', lifts: 0.12 });
  g.save(); path(g, bed); g.clip();
  // the last of the damp along the bottom of the bed: a darker winding line
  for (let i = 1; i < sP.length; i++) { const [X0, Z0] = sP[i - 1], [X1, Z1] = sP[i], A = fproj(X0 + 0.012 * Math.sin(Z0 * 4), Z0), B = fproj(X1 + 0.012 * Math.sin(Z1 * 4), Z1);
    g.strokeStyle = rgba(shade(m.earth[1], 0.25), 0.35); g.lineWidth = 34 / Z1; g.lineCap = 'round'; g.beginPath(); g.moveTo(...A); g.lineTo(...B); g.stroke(); }
  // mud plates: a jittered grid across and along the bed; every plate curls up a little (lit top edge, shaded foot),
  // and the cracks between them are shared dark lines, so it reads as one dried, cracked skin of mud
  const NU = 6, grid = sP.map(([X, Z], i) => { const row = []; for (let j = 0; j <= NU; j++) { const u = -1 + 2 * j / NU, jit = j === 0 || j === NU ? 0 : r.gauss(0, 0.22) / NU * 2; row.push(fproj(X + (u + jit) * half(Z) * 1.05, Z * (1 + r.gauss(0, 0.008)))); } return row; });
  for (let i = 1; i < grid.length; i++) {
    const Z = sP[i][1], px = 34 / Z; if (px < 2.5) continue;
    for (let j = 0; j < NU; j++) {
      const q = [grid[i - 1][j], grid[i - 1][j + 1], grid[i][j + 1], grid[i][j]];
      g.fillStyle = rgba(r.pick([m.earth[2], tint(m.earth[2], 0.2), mix(m.earth[0], m.gravel[0], 0.4), shade(m.earth[2], 0.08)]), 0.55); path(g, q); g.fill();
      if (px > 5) { g.strokeStyle = rgba('#fff4e0', 0.45); g.lineWidth = Math.max(0.6, px * 0.05); g.beginPath(); g.moveTo(...q[0]); g.lineTo(...q[1]); g.stroke(); // the curled, lit lip of each plate
        g.strokeStyle = rgba(shade(m.earth[1], 0.45), 0.35); g.lineWidth = Math.max(0.6, px * 0.08); g.beginPath(); g.moveTo(...q[3]); g.lineTo(...q[2]); g.stroke(); }
    }
  }
  g.strokeStyle = rgba('#5a3a24', 0.7); g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 1; i < grid.length; i++) { const Z = sP[i][1], px = 34 / Z; if (px < 1.6) continue; g.lineWidth = Math.max(0.5, px * 0.045);
    g.beginPath(); for (let j = 0; j <= NU; j++) { const [x, y] = grid[i][j]; j ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    for (let j = 1; j < NU; j++) { g.beginPath(); g.moveTo(...grid[i - 1][j]); g.lineTo(...grid[i][j]); g.stroke(); } }
  // a few stones the water left behind
  for (let i = 0; i < 40; i++) { const k = Math.floor(Math.pow(r(), 0.5) * (sP.length - 1)), [X, Z] = sP[sP.length - 1 - k], [x, y] = fproj(X + r.range(-0.7, 0.7) * half(Z), Z), s0 = (9 / Z) * r.range(0.6, 1.3); if (s0 < 1.2) continue;
    g.fillStyle = rgba(m.shadow, 0.35); g.beginPath(); g.ellipse(x + s0 * 0.3, y + s0 * 0.35, s0 * 1.3, s0 * 0.4, 0, 0, TAU); g.fill();
    g.fillStyle = rgba(r.pick(m.stone), 1); g.beginPath(); g.ellipse(x, y, s0 * 1.25, s0 * 0.75, r.gauss(0, 0.3), 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,250,240,0.6)'; g.beginPath(); g.ellipse(x - s0 * 0.3, y - s0 * 0.25, s0 * 0.5, s0 * 0.22, 0, 0, TAU); g.fill();
    if (s0 > 2.5) ink(g, ellipse(x, y, s0 * 1.25, s0 * 0.75, 12), { closed: true, width: 0.8, alpha: 0.65, wobble: 0.2 }); }
  g.restore();
  ink(g, sL.filter((_, i) => i % 2 === 0), { width: 1.4, alpha: 0.6, gaps: 0.8, seed: seed + 510 }); ink(g, sR.filter((_, i) => i % 2 === 0), { width: 1.4, alpha: 0.6, gaps: 0.8, seed: seed + 511 });
  // dry reeds and grass tufts along the banks nearby
  for (let i = 0; i < sP.length; i += 2) { const [X, Z] = sP[i]; if (Z > 6) continue; for (const sd of [-1, 1]) if (r() < 0.6) { const [x, y] = fproj(X + sd * half(Z) * 1.25, Z); grassFlicks(g, x, y, 60 / Z, { seed: seed + 5000 + i * 2 + sd, n: 5, colors: [mix(m.hedge[2], m.lawn[3], 0.5), m.lawn[3]], inkA: 0.45 }); } }
  // hedgerows, copses and the stream's dusty willows: all far to near
  const trees = [];
  const tree = (x, y, R, sd, hz, willow) => {
    g.strokeStyle = rgba('#5a4636', 0.9); g.lineWidth = Math.max(0.8, R * 0.12); g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - R * 0.9); g.stroke();
    g.fillStyle = rgba(m.shadow, 0.28 * (1 - hz)); g.beginPath(); g.ellipse(x + R * 0.9, y + R * 0.08, R * 1.3, R * 0.28, 0, 0, TAU); g.fill();
    const ty = y - R * 1.25, sh = fluffy(x, ty, R, R * (willow ? 0.95 : 0.85), 8, 0.2, sd);
    wash(g, sh, { color: mix(willow ? '#8a9468' : m.elm[sd % 4], m.sky[2], hz), opacity: 0.95, seed: sd + 1, layers: 10, bleed: 0.03, under: '#ece2c8' });
    glaze(g, sh, x - R * 0.35, ty - R * 0.35, R * 0.6, R * 0.4, tint(m.leaf[3], 0.4), 0.5);
    if (willow && R > 6) { g.strokeStyle = rgba(shade('#8a9468', 0.3), 0.5); g.lineWidth = Math.max(0.5, R * 0.04); for (let q = 0; q < 7; q++) { const lx = x + (q / 6 - 0.5) * R * 1.6; g.beginPath(); g.moveTo(lx, ty - R * 0.3); g.quadraticCurveTo(lx + R * 0.1, ty + R * 0.3, lx, ty + R * 0.75); g.stroke(); } }
    ink(g, sh.filter(([, py]) => py < ty), { width: Math.max(0.5, R * 0.03), alpha: 0.45, gaps: 1.2, seed: sd + 2 });
  };
  const items = [];
  for (const hp of hedges) items.push([Math.min(...hp.map((p) => p[1])), 'hedge', hp]);
  for (const c of copses) items.push([c[1], 'copse', c]);
  for (let i = 4; i < sP.length; i += 5) if (r() < 0.45) { const [X, Z] = sP[i]; items.push([Z, 'willow', [X + (r() < 0.5 ? -1 : 1) * half(Z) * 2.2, Z]]); }
  items.sort((a, b) => b[0] - a[0]);
  for (const [, kind, d] of items) {
    if (kind === 'copse') { const [Xc, Zc, w] = d; for (let q = 0; q < 7; q++) { const X = Xc + r.gauss(0, w * 0.5), Z = Zc * (1 + r.gauss(0, 0.04)), [x, y] = fproj(X, Z); tree(x, y, (30 / Z) * r.range(0.8, 1.2), seed + 2000 + q * 7 + Math.round(Zc * 100), clamp((Z - 6) / 30) * 0.5, false); } continue; }
    if (kind === 'willow') { const [X, Z] = d, [x, y] = fproj(X, Z); if (Z < 18) tree(x, y, 30 / Z, seed + 3000 + Math.round(Z * 100), clamp((Z - 6) / 30) * 0.5, true); continue; }
    // a hedge: dusty bushes of uneven size along the edge, with gaps, and a tree now and then
    const pts = d, dense = []; for (let i = 0; i < pts.length - 1; i++) { const A = fproj(...pts[i]), B = fproj(...pts[i + 1]), zm = (pts[i][1] + pts[i + 1][1]) / 2, n = Math.max(1, Math.round(Math.hypot(A[0] - B[0], A[1] - B[1]) / Math.max(2.5, 11 / zm))); for (let q = 0; q < n; q++) dense.push([lerp(pts[i][0], pts[i + 1][0], q / n), lerp(pts[i][1], pts[i + 1][1], q / n)]); }
    if (dense.length > 900) continue;
    let gap = 0;
    for (let q = 0; q < dense.length; q++) {
      const [X, Z] = dense[q], [x, y] = fproj(X, Z), s = (10 / Z) * r.range(0.65, 1.45);
      if (x < -M - 30 || x > W + M + 30) continue;
      if (gap > 0) { gap--; continue; } if (r() < 0.03) { gap = 2 + Math.floor(r() * 5); continue; }
      const hz = clamp((Z - 6) / 30) * 0.5, c = mix(m.hedge[Math.floor(r() * 3)], m.sky[2], hz);
      g.fillStyle = rgba(m.shadow, 0.22 * (1 - hz)); g.beginPath(); g.ellipse(x + s * 0.5, y + s * 0.2, s * 1.1, s * 0.35, 0, 0, TAU); g.fill();
      g.fillStyle = rgba(c, 0.9); g.beginPath(); g.ellipse(x, y - s * 0.55, s * r.range(0.8, 1.2), s * r.range(0.6, 0.95), 0, 0, TAU); g.fill();
      g.fillStyle = rgba(tint(c, 0.3), 0.5); g.beginPath(); g.ellipse(x - s * 0.25, y - s * 0.8, s * 0.5, s * 0.3, 0, 0, TAU); g.fill();
      if (r() < 0.05 && Z < 16) tree(x, y, (10 / Z) * r.range(2.4, 3.8), seed + 700 + q + Math.round(Z * 37), hz, false);
    }
    if (pts[0][1] < 16 && pts[pts.length - 1][1] < 16) ink(g, pts.map(([X, Z]) => { const [x, y] = fproj(X, Z); return [x, y - 9 / Z]; }), { width: Math.max(0.5, 1.4 / Math.min(pts[0][1], pts[pts.length - 1][1])), alpha: 0.3, gaps: 1.8, seed: seed + 1000 + Math.round(pts[0][0] * 100) });
  }
  // a farm far off: a barn and a house with red roofs among trees
  for (const [X, Z, w, h, roof] of [[-1.6, 7.5, 0.16, 0.07, '#a8584a'], [-1.38, 7.8, 0.1, 0.08, '#b86a50']]) {
    const [x, y] = fproj(X, Z), pw = FZ.f * w / Z, ph = FZ.f * h / Z, hz = clamp((Z - 6) / 30) * 0.5;
    const wallS = [[x - pw / 2, y], [x + pw / 2, y], [x + pw / 2, y - ph], [x - pw / 2, y - ph]], rf = [[x - pw / 2 - 2, y - ph], [x + pw / 2 + 2, y - ph], [x + pw / 2 - pw * 0.15, y - ph * 1.7], [x - pw / 2 + pw * 0.15, y - ph * 1.7]];
    wash(g, wallS, { color: mix('#e8dcc0', m.sky[2], hz), opacity: 0.95, seed: seed + 4000 + X * 10, under: true, layers: 8 });
    wash(g, rf, { color: mix(roof, m.sky[2], hz), opacity: 0.95, seed: seed + 4001 + X * 10, under: true, layers: 8 });
    ink(g, wallS, { closed: true, width: 0.8, alpha: 0.6 }); ink(g, rf, { closed: true, width: 0.8, alpha: 0.6 });
  }
  paintTinyGarden(g, m, seed + 1200);
  // a soft heat haze lying over the distance
  const hg = g.createLinearGradient(0, FZ.hz - 60, 0, FZ.hz + 200);
  hg.addColorStop(0, rgba(m.sky[2], 0)); hg.addColorStop(0.3, rgba(m.sky[2], m.name === 'night' ? 0.15 : 0.32)); hg.addColorStop(1, rgba(m.sky[2], 0));
  g.fillStyle = hg; g.fillRect(-M, FZ.hz - 60, LW, 260);
  g.save(); g.globalCompositeOperation = 'multiply';
  const dg = g.createLinearGradient(0, FZ.hz + 40, 0, H + MY); dg.addColorStop(0, 'rgba(255,255,255,0)'); dg.addColorStop(0.45, 'rgba(236,200,150,0.35)'); dg.addColorStop(1, 'rgba(200,150,100,0.55)');
  g.fillStyle = dg; g.fillRect(-M, FZ.hz + 40, LW, LH);
  g.restore();
}
// the cottage garden as the crow first sees it, far below: the cottage and the wall along the back (as in the
// garden set), the elm beyond it, a lawn, a path to the gate, flower beds and a vegetable patch, and the pitcher
const TG = { X0: 0.2, X1: 0.72, Zf: 2.74, Zn: 2.14 };
function paintTinyGarden(g, m, seed) {
  const r = rng(seed), q = (X, Z) => fproj(X, Z), { X0, X1, Zf, Zn } = TG;
  const quad = (a, b, c, d) => [q(a, c), q(b, c), q(b, d), q(a, d)];
  const plot = quad(X0, X1, Zf, Zn);
  brushWash(g, plot, [mix(m.lawn[3], m.leaf[0], 0.45), m.lawn[0], mix(m.leaf[2], m.lawn[2], 0.5)], { seed, count: 40, width: [3, 10], len: [10, 40], alpha: [0.2, 0.4], base: 0.85, under: '#efe4cc', lifts: 0.1 });
  flecks(g, plot, [shade(m.leaf[1], 0.2), tint(m.lawn[2], 0.3)], { seed: seed + 1, count: 500, size: [0.6, 1.6], alpha: [0.2, 0.45], dy: 0.6 });
  // a vegetable patch: rows of greens on brown earth
  const veg = quad(0.56, 0.69, 2.5, 2.3);
  wash(g, veg, { color: m.earth[1], opacity: 0.9, seed: seed + 2, layers: 8, under: true });
  for (let k = 0; k < 6; k++) { const Z = lerp(2.48, 2.32, k / 5); const [ax, ay] = q(0.57, Z), [bx, by] = q(0.68, Z); for (let u = 0; u < 9; u++) { g.fillStyle = rgba(m.leaf[(k + u) % 4], 0.95); g.beginPath(); g.arc(lerp(ax, bx, u / 8), lerp(ay, by, u / 8) - 0.8, 1.4, 0, TAU); g.fill(); } }
  ink(g, veg, { closed: true, width: 0.5, alpha: 0.5 });
  // flower beds along the back wall and down the left side: green mounds dotted with colour
  const bedPts = [];
  for (let i = 0; i < 70; i++) bedPts.push([r.range(X0 + 0.05, X1 - 0.02), r.range(Zf - 0.06, Zf - 0.015)]);
  for (let i = 0; i < 30; i++) bedPts.push([r.range(X0 + 0.01, X0 + 0.045), r.range(Zn + 0.05, Zf - 0.05)]);
  bedPts.sort((a, b) => b[1] - a[1]);
  for (const [X, Z] of bedPts) { const [x, y] = q(X, Z); g.fillStyle = rgba(m.leaf[Math.floor(r() * 4)], 0.95); g.beginPath(); g.ellipse(x, y - 1, 2.4, 1.6, 0, 0, TAU); g.fill();
    if (r() < 0.75) { g.fillStyle = rgba(r.pick(['#e098a8', '#f4e8d8', '#f0c040', '#a890c8', '#d86a5a']), 1); g.beginPath(); g.arc(x + r.gauss(0, 1), y - 2.2, 1.1, 0, TAU); g.fill(); } }
  // tall hollyhocks and sunflowers against the back wall
  for (const [X, c] of [[0.43, '#e098a8'], [0.45, '#f2e0cc'], [0.61, '#f0c040'], [0.63, '#f0c040']]) { const [x, y] = q(X, Zf - 0.02); g.strokeStyle = rgba(m.leaf[1], 1); g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 9); g.stroke(); g.fillStyle = c; g.beginPath(); g.arc(x, y - 9, 1.6, 0, TAU); g.fill(); }
  // the gravel path from the door, past the pitcher, to a little gate in the front wall
  const pth = []; for (let k = 0; k <= 14; k++) { const u = k / 14; pth.push(q(lerp(0.3, 0.52, u) + 0.05 * Math.sin(u * Math.PI), lerp(Zf - 0.03, Zn, u))); }
  g.save(); g.lineCap = 'round'; g.strokeStyle = rgba(shade(m.gravel[2], 0.15), 0.9); g.lineWidth = 7; path(g, pth, false); g.stroke(); g.strokeStyle = rgba(m.gravel[0], 1); g.lineWidth = 5; path(g, pth, false); g.stroke(); g.restore();
  for (let i = 0; i < 40; i++) { const [x, y] = pth[Math.floor(r() * pth.length)]; g.fillStyle = rgba(r.pick(m.stone), 0.9); g.beginPath(); g.arc(x + r.gauss(0, 1.4), y + r.gauss(0, 0.8), 0.6, 0, TAU); g.fill(); }
  // the dry-stone wall all round: a band of little inked stones with coping, shadow on the inside
  const wallEdge = (a, b) => { const n = Math.ceil(Math.hypot(a[0] - b[0], a[1] - b[1]) / 2.6); for (let k = 0; k <= n; k++) { const x = lerp(a[0], b[0], k / n), y = lerp(a[1], b[1], k / n);
      g.fillStyle = rgba(m.shadow, 0.3); g.beginPath(); g.ellipse(x + 1.5, y + 1.5, 2, 1, 0, 0, TAU); g.fill();
      g.fillStyle = rgba(m.stone[k % m.stone.length], 1); g.beginPath(); g.ellipse(x, y - 1.6, 1.8, 1.5, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x + 0.6, y - 3.2, 1.3, 1, 0, 0, TAU); g.fill(); }
    ink(g, [[a[0], a[1] - 4.4], [b[0], b[1] - 4.4]], { width: 0.6, alpha: 0.55, gaps: 0.6 }); ink(g, [[a[0], a[1] + 0.2], [b[0], b[1] + 0.2]], { width: 0.5, alpha: 0.4, gaps: 1 }); };
  const [A, B, C, D] = [q(X0, Zf), q(X1, Zf), q(X1, Zn), q(X0, Zn)], gateA = lerp(D[0], C[0], 0.6), gateB = gateA + 9;
  // the elm beyond the back wall, then the back wall, the cottage in line with it, the sides and the front with its gate
  const [ex, ey] = q(0.66, 2.86); miniElm(g, ex, ey, 128, m, seed + 40);
  wallEdge(A, B);
  const [cx, cy] = q(0.27, Zf + 0.02);
  castShadow(g, cx + 8, cy + 2, 44, 50, m, { seed: seed + 5 });
  stoneCottage(g, cx, cy, 0.15, m, { far: true, seed: 7 });
  wallEdge(B, C); wallEdge(A, D);
  wallEdge(D, [gateA, lerp(D[1], C[1], 0.6)]); wallEdge([gateB, lerp(D[1], C[1], 0.6) + (C[1] - D[1]) * 9 / (C[0] - D[0])], C);
  // the pitcher by the back wall (as in the garden), small and tall, with its shadow
  const [px, py] = FIELDS_PITCHER;
  castShadow(g, px, py, 5, 16, m, { seed: seed + 6 });
  paintPitcher(g, px, py, 20, m);
}
// a small old elm for the distant views: a tall trunk dividing high into a vase of limbs, crown in clumps
function miniElm(g, x, y, H, m, seed) {
  const r = rng(seed), split = y - H * 0.38;
  castShadow(g, x, y, H * 0.22, H * 0.4, m, { seed: seed + 1 });
  g.save(); g.lineCap = 'round'; g.strokeStyle = '#5a4636';
  g.lineWidth = H * 0.06; g.beginPath(); g.moveTo(x, y); g.lineTo(x - H * 0.01, split); g.stroke();
  const tips = [];
  for (const a of [-0.55, -0.22, 0.08, 0.38, 0.6]) { const tx = x + Math.sin(a) * H * 0.42, ty = split - Math.cos(a) * H * 0.48; tips.push([tx, ty]); g.lineWidth = H * 0.028; g.beginPath(); g.moveTo(x, split); g.quadraticCurveTo(x + Math.sin(a) * H * 0.1, split - H * 0.2, tx, ty); g.stroke(); }
  g.restore();
  const cl = [];
  for (const [tx, ty] of tips) for (let k = 0; k < 4; k++) cl.push([tx + r.gauss(0, H * 0.05), ty + r.range(-H * 0.06, H * 0.3) * (Math.abs(tx - x) / (H * 0.3)), H * r.range(0.09, 0.14)]);
  cl.sort((a, b) => b[1] - a[1]);
  for (const [i, [cx, cy, rr]] of cl.entries()) { const sh = fluffy(cx, cy, rr, rr * 0.8, 9, 0.25, seed + 10 + i);
    wash(g, sh, { color: m.elm[i % 4], opacity: 0.95, seed: seed + 30 + i, layers: 8, under: '#ece2c8' }); glaze(g, sh, cx - rr * 0.3, cy - rr * 0.3, rr * 0.6, rr * 0.4, tint(m.leaf[3], 0.4), 0.5);
    ink(g, sh.filter(([, py]) => py < cy), { width: 0.6, alpha: 0.5, gaps: 1, seed: seed + 50 + i }); }
}
// ---------------------------------------------------------------- the stone cottage
// After engine/scenery.js cottage() (the approved one), but built of honey-coloured stone, every stone washed
// and inked, under the same thick thatch. Shutters, an arched door, a window box gone limp in the heat.
export function stoneCottage(g, x, ground, S, mood, o = {}) {
  const m = MD(mood), { seed = 3, far = false } = o, r = rng(seed);
  const P = (px, py) => [x + px * S, ground - py * S];
  const rect = (x0, y0, x1, y1) => [P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)];
  const wallH = 230, half = 250, lw = (w) => Math.max(0.35, w * S);
  const honey = m.stone.map((c) => mix(c, '#e0c088', 0.3));
  const stones = (x0, x1, y0, y1, avoid = [], sd = 0) => { // courses of stones inside a rectangle (local units)
    if (far) return;
    const rs = rng(seed + 500 + sd);
    for (let y = y0, row = 0; y < y1 - 6; row++) {
      const rh = rs.range(18, 26), yy1 = Math.min(y1, y + rh);
      for (let xx = x0 - (row % 2 ? rs.range(10, 26) : 0); xx < x1; ) {
        const sw = rs.range(30, 62), a0 = Math.max(x0, xx + 2), a1 = Math.min(x1, xx + sw - 2);
        xx += sw;
        if (a1 - a0 < 8) continue;
        if (avoid.some(([ax0, ay0, ax1, ay1]) => a1 > ax0 && a0 < ax1 && yy1 > ay0 && y < ay1)) continue;
        const j = () => rs.range(-1.5, 1.5);
        const st = smooth([P(a0 + 2, y + 2 + j()), P((a0 + a1) / 2, y + 1 + j()), P(a1 - 2, y + 2 + j()), P(a1, (y + yy1) / 2), P(a1 - 2, yy1 - 2 + j()), P((a0 + a1) / 2, yy1 - 1 + j()), P(a0 + 2, yy1 - 2 + j()), P(a0, (y + yy1) / 2)]);
        const c = honey[Math.floor(rs() * honey.length)];
        g.fillStyle = rgba(c, 0.92); path(g, st); g.fill();
        const b = bbox(st);
        g.save(); path(g, st); g.clip();
        g.fillStyle = rgba(tint(c, 0.5), 0.55); g.beginPath(); g.ellipse(b.x0 + b.w * 0.4, b.y0 + b.h * 0.3, b.w * 0.42, b.h * 0.3, 0, 0, TAU); g.fill();
        g.fillStyle = rgba(shade(c, 0.35), 0.35); g.beginPath(); g.ellipse(b.x0 + b.w * 0.6, b.y1, b.w * 0.5, b.h * 0.32, 0, 0, TAU); g.fill();
        g.restore();
        ink(g, st, { closed: true, width: lw(1.3), alpha: 0.62, wobble: 0.3, gaps: 0.7, seed: seed + Math.round(a0 * 7 + y * 3) });
      }
      y = yy1;
    }
  };
  // chimney (behind the roof), stone
  const chim = rect(150, 300, 205, 470);
  wash(g, chim, { color: honey[2], opacity: 0.97, seed: seed + 1, under: true, bleed: 0.008 });
  stones(150, 205, 300, 466, [], 1);
  wash(g, rect(142, 462, 213, 484), { color: '#8f7660', opacity: 0.97, seed: seed + 2, under: true, bleed: 0.008 });
  penLine(g, chim, { closed: true, sharp: true, w: lw(2), alpha: 0.7, seed: seed + 3 });
  // walls: a warm mortar wash, then the stones
  const wall = rect(-half, 0, half, wallH);
  wash(g, wall, { color: mix(honey[1], '#a89070', 0.35), opacity: 0.97, seed: seed + 4, under: true, bleed: 0.008 });
  const wx0 = 40, wx1 = 170, wy0 = 76, wy1 = 196;
  stones(-half, half, 0, wallH, [[-212, -10, -68, 200], [wx0 - 58, wy0 - 16, wx1 + 58, wy1 + 6]], 2);
  if (far) { for (let k = 0; k < 6; k++) ink(g, [P(-half, 30 + k * 36), P(half, 30 + k * 36)], { width: 0.5, alpha: 0.3, gaps: 1.5, seed: seed + 40 + k }); }
  // big lintel and quoin stones
  for (const [qx, sd] of [[-half, 1], [half - 34, -1]]) for (let k = 0; k < 6; k++) { const qy = 4 + k * 38, qw = k % 2 ? 34 : 50, q = rect(sd > 0 ? qx : qx + 34 - qw, qy, sd > 0 ? qx + qw : qx + 34, qy + 34);
    wash(g, q, { color: tint(honey[0], 0.15), opacity: 0.95, seed: seed + 200 + k + qx, under: true, layers: 8, bleed: 0.01 }); if (!far) ink(g, q, { closed: true, width: lw(1.3), alpha: 0.65, wobble: 0.3, gaps: 0.5, seed: seed + 210 + k }); }
  glaze(g, wall, ...P(-120, 150), 260 * S, 120 * S, '#fff6e2', 0.35);
  shadeEdge(g, wall, { color: '#6c5440', alpha: 0.5, width: 80 * S, dy: 34 * S }); // shadow under the eaves
  shadeEdge(g, wall, { color: '#6c5440', alpha: 0.35, width: 60 * S, dx: -30 * S, dy: 0 }); // the right end in shade
  // the door: arched, planked, sun-faded blue-green, with a stone step
  const door = smooth([P(-200, 4), P(-200, 150), P(-178, 182), P(-140, 194), P(-102, 182), P(-80, 150), P(-80, 4)]);
  const arch = smooth([P(-214, 150), P(-190, 196), P(-140, 212), P(-90, 196), P(-66, 150), P(-80, 150), P(-102, 184), P(-140, 196), P(-178, 184), P(-200, 150)]);
  wash(g, arch, { color: tint(honey[0], 0.1), opacity: 0.97, seed: seed + 5, under: true, bleed: 0.008 });
  if (!far) for (let k = 0; k < 7; k++) { const a = Math.PI + (k + 0.5) / 7 * Math.PI, cx0 = -140 + Math.cos(a) * 64, cy0 = 150 - Math.sin(a) * 52; ink(g, [P(-140 + Math.cos(a) * 52, 150 - Math.sin(a) * 40), P(cx0, cy0)], { width: lw(1.1), alpha: 0.55, seed: seed + 60 + k }); }
  penLine(g, arch, { closed: true, w: lw(1.6), alpha: 0.7, seed: seed + 61 });
  wash(g, door, { color: '#6f8f86', opacity: 0.96, seed: seed + 6, under: true, bleed: 0.008 });
  glaze(g, door, ...P(-165, 120), 40 * S, 70 * S, '#c8dcd0', 0.45);
  for (let k = 1; k < 5; k++) penLine(g, [P(-200 + k * 24, 8), P(-200 + k * 24, 184 - Math.abs(k - 2.5) * 6)], { w: lw(1.2), alpha: 0.45 });
  penLine(g, door, { closed: true, w: lw(2.2), alpha: 0.8, seed: seed + 7 });
  g.fillStyle = '#c8a058'; g.beginPath(); g.arc(...P(-98, 100), 5 * S, 0, TAU); g.fill();
  const step = rect(-214, -8, -66, 6);
  wash(g, step, { color: m.stone[2], opacity: 0.97, seed: seed + 8, under: true }); penLine(g, step, { closed: true, sharp: true, w: lw(1.4), alpha: 0.7 });
  // the window: four panes, shutters, a sill and a window box of drooping geraniums
  const win = rect(wx0, wy0, wx1, wy1);
  wash(g, win, { color: '#4c5d6a', opacity: 0.95, seed: seed + 9, under: true, bleed: 0.008 });
  glaze(g, win, ...P(wx0 + 34, wy1 - 30), 50 * S, 36 * S, '#c8dce4', 0.7);
  const curtains = [[wx0 + 4, wx0 + 30], [wx1 - 30, wx1 - 4]];
  for (const [c0, c1] of curtains) { const cu = smooth([P(c0, wy1 - 4), P(c1, wy1 - 4), P((c0 + c1) / 2 + (c0 < 100 ? -6 : 6), wy0 + 50), P(c1 + (c0 < 100 ? -4 : 4), wy0 + 6), P(c0, wy0 + 6)]); wash(g, cu, { color: '#f0e4d0', opacity: 0.9, seed: seed + 90 + c0, under: true, layers: 8 }); if (!far) ink(g, cu, { closed: true, width: lw(0.9), alpha: 0.4, gaps: 1 }); }
  penLine(g, [P((wx0 + wx1) / 2, wy0), P((wx0 + wx1) / 2, wy1)], { w: lw(3.4), alpha: 0.85 });
  penLine(g, [P(wx0, (wy0 + wy1) / 2), P(wx1, (wy0 + wy1) / 2)], { w: lw(3.4), alpha: 0.85 });
  penLine(g, win, { closed: true, sharp: true, w: lw(3), alpha: 0.9, seed: seed + 11 });
  for (const [s0, s1] of [[wx0 - 52, wx0 - 6], [wx1 + 6, wx1 + 52]]) {
    const sh = rect(s0, wy0, s1, wy1);
    wash(g, sh, { color: '#7a9a90', opacity: 0.96, seed: seed + 12 + s0, under: true, bleed: 0.008 });
    for (let k = 1; k < 6; k++) penLine(g, [P(s0 + 4, wy0 + k * 20), P(s1 - 4, wy0 + k * 20)], { w: lw(1), alpha: 0.45 });
    penLine(g, sh, { closed: true, sharp: true, w: lw(1.8), alpha: 0.75 });
  }
  const lintel = rect(wx0 - 10, wy1, wx1 + 10, wy1 + 16);
  wash(g, lintel, { color: tint(honey[0], 0.1), opacity: 0.97, seed: seed + 14, under: true }); penLine(g, lintel, { closed: true, sharp: true, w: lw(1.4), alpha: 0.7 });
  const box = rect(wx0 - 16, wy0 - 30, wx1 + 16, wy0);
  wash(g, box, { color: '#8a6040', opacity: 0.97, seed: seed + 13, under: true, bleed: 0.008 });
  penLine(g, box, { closed: true, sharp: true, w: lw(1.8), alpha: 0.8 });
  if (!far) {
    // geraniums flopping over the edge of the box, leaves limp
    for (let k = 0; k < 7; k++) { const px = wx0 - 6 + k * 22, [lx, ly] = P(px, wy0 + 2);
      for (let q = 0; q < 3; q++) { const a = Math.PI * (0.15 + q * 0.35) + r.gauss(0, 0.2), L = 16 * S * r.range(0.8, 1.2); g.save(); g.translate(lx, ly); g.rotate(a); g.fillStyle = rgba(r.pick(m.leaf), 0.85); g.beginPath(); g.ellipse(L * 0.6, 0, L * 0.7, L * 0.45, 0, 0, TAU); g.fill(); g.restore(); } }
    for (let k = 0; k < 6; k++) { const [fx, fy] = P(wx0 + 6 + k * 24 + r.gauss(0, 4), wy0 + r.range(-8, 4)); for (let q = 0; q < 5; q++) { g.fillStyle = rgba(q % 2 ? '#c85a50' : '#d87068', 0.85); g.beginPath(); g.arc(fx + r.gauss(0, 4 * S), fy + r.gauss(0, 3 * S), 4 * S, 0, TAU); g.fill(); } }
  }
  // the thatched roof: thick, rounded, overhanging (as in the approved cottage), bleached by summer
  const roof = smooth([P(-half - 66, wallH - 24), P(-half - 40, wallH + 10), P(-half + 20, wallH + 80), P(-150, wallH + 160), P(-110, wallH + 200), P(-60, wallH + 214),
    P(60, wallH + 214), P(110, wallH + 200), P(150, wallH + 160), P(half - 20, wallH + 80), P(half + 40, wallH + 10), P(half + 66, wallH - 24), P(half + 20, wallH - 10), P(0, wallH - 4), P(-half - 20, wallH - 10)], true, 3);
  wash(g, roof, { color: '#cfae6a', opacity: 0.97, seed: seed + 15, under: true, bleed: 0.01 });
  glaze(g, roof, ...P(-80, wallH + 160), 220 * S, 70 * S, '#f0dc9c', 0.6);
  hatch(g, roof, { color: '#7d5e30', count: far ? 220 : 900, len: 20 * S, width: far ? 0.5 : 1.1, alpha: 0.45, seed: seed + 16, dir: (px) => Math.PI / 2 - (px - x) / (half * S) * 0.6, curve: 0.2 });
  const eave = ribbon([P(-half - 70, wallH - 22), P(-half + 40, wallH - 6), P(0, wallH - 2), P(half - 40, wallH - 6), P(half + 70, wallH - 22)], 34 * S, 34 * S);
  wash(g, eave, { color: '#b8904c', opacity: 0.97, seed: seed + 17, under: true });
  hatch(g, eave, { color: '#6d4e26', count: far ? 80 : 300, len: 12 * S, width: far ? 0.5 : 1, alpha: 0.5, seed: seed + 18, dir: () => Math.PI / 2 });
  penLine(g, eave, { closed: true, w: lw(2), alpha: 0.7 });
  // a patterned ridge (a storybook touch) and the ridge line
  if (!far) { const rid = []; for (let k = 0; k <= 12; k++) rid.push(P(-110 + k * 18.3, wallH + 196 - (k % 2) * 16)); ink(g, rid, { width: lw(1.4), alpha: 0.5, seed: seed + 20 }); }
  penLine(g, roof.slice(0, Math.floor(roof.length * 0.74)), { w: lw(2.6), alpha: 0.8, seed: seed + 19 });
  // a climbing rose on the left wall, tired in the heat
  if (!far) {
    for (let k = 0; k < 8; k++) { const [fx, fy] = P(-half + 6 + Math.sin(k) * 12, 20 + k * 26), rr = 22 * S;
      const sh = fluffy(fx, fy, rr, rr * 0.75, 7, 0.25, seed + 300 + k);
      wash(g, sh, { color: m.leaf[k % 4], opacity: 0.9, seed: seed + 310 + k, layers: 10 }); ink(g, sh.filter((_, i) => i % 3 === 0), { width: lw(0.8), alpha: 0.4, gaps: 1.4, seed: seed + 320 + k }); }
    for (let k = 0; k < 10; k++) { const [fx, fy] = P(-half + r.range(-14, 24), r.range(30, 220)); g.fillStyle = rgba(k % 3 ? '#d88080' : '#e8b0a8', 0.9); g.beginPath(); g.arc(fx, fy, 7 * S, 0, TAU); g.fill(); g.strokeStyle = rgba('#8a3a3a', 0.5); g.lineWidth = lw(0.9); g.beginPath(); g.arc(fx, fy, 3.5 * S, 0, 5); g.stroke(); }
  }
  return { roof, window: { x: x + (wx0 + wx1) / 2 * S, y: ground - (wy0 + wy1) / 2 * S, w: (wx1 - wx0) * S, h: (wy1 - wy0) * S }, door: P(-140, 0), chimney: P(178, 484) };
}
// the cottage window lit from inside (night), painted after the night glaze
// Night only, painted over the glaze: cool moonlight catching the edges that face the moon (upper left) - the wall's
// coping, the thatch, the bird bath, the elm's trunk - and the shadows on the far sides deepened.
function moonlight(g, ck) {
  const ml = 'rgba(200,214,250,', soft = (w) => `blur(${w}px)`;
  g.save();
  // deeper night toward the bottom and the right, lighter in the moon's quarter
  g.globalCompositeOperation = 'multiply';
  const dg = g.createLinearGradient(0, 400, 0, H + MY); dg.addColorStop(0, 'rgba(255,255,255,0)'); dg.addColorStop(1, 'rgba(70,80,130,0.55)'); g.fillStyle = dg; g.fillRect(-M, 400, LW, LH);
  g.globalCompositeOperation = 'screen';
  pool(g, MOON[0], MOON[1] + 200, 900, 500, '#8090c0', 0.22);
  g.lineCap = 'round'; g.lineJoin = 'round';
  const glint = (pts, w, a) => { g.filter = soft(w * 0.4); g.strokeStyle = ml + a + ')'; g.lineWidth = w; path(g, pts, false); g.stroke(); g.filter = 'none'; };
  // the wall: moonlight on the top of every coping stone
  { const { x0, x1, y0, y1, h } = WALL, r = rng(41); g.filter = soft(1.5);
    for (let x = x0 + 4; x < x1; x += r.range(15, 23)) { const y = y0 + (y1 - y0) * (x - x0) / (x1 - x0) - (h - 14) - r.range(11, 14); g.fillStyle = ml + r.range(0.25, 0.45) + ')'; g.beginPath(); g.ellipse(x + 5, y, 5.5, 2, -0.1, 0, TAU); g.fill(); }
    g.filter = 'none'; }
  // the thatch, along its upper left slope, and the chimney's left side
  const roof = ck.roof, n = roof.length; glint(roof.slice(Math.floor(n * 0.02), Math.floor(n * 0.36)), 9, 0.4);
  // the bird bath's rim, the elm's trunk and the watering can
  glint(ellipse(BIRDBATH.x, BIRDBATH.y - 114, 62, 12, 30).slice(14, 26), 4, 0.5);
  // the elm's trunk: a soft cool light down its moonward side
  g.filter = soft(10); g.fillStyle = ml + '0.22)'; g.beginPath(); g.ellipse(ELM.x - 40, (ELM.ground + NEST[1]) / 2 + 40, 16, (ELM.ground - NEST[1]) / 2 - 40, 0.02, 0, TAU); g.fill(); g.filter = 'none';
  // the window's warm light falling out across the ground in front of the cottage
  g.globalCompositeOperation = 'lighter';
  const { x, y, w } = ck.window, gy = COTTAGE.ground;
  g.filter = soft(14); g.fillStyle = 'rgba(255,170,80,0.22)';
  g.beginPath(); g.moveTo(x - w * 0.6, gy + 6); g.lineTo(x + w * 0.6, gy + 6); g.lineTo(x + w * 1.6, gy + 120); g.lineTo(x - w * 0.2, gy + 130); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,190,100,0.16)'; for (const [dx, dy] of [[-0.25, 0.3], [0.45, 0.3], [-0.05, 0.75], [0.75, 0.75]]) { g.beginPath(); g.ellipse(x + w * dx + w * 0.35, gy + 30 + dy * 80, w * 0.32, 18, 0.1, 0, TAU); g.fill(); }
  g.filter = 'none';
  g.restore();
}
function paintLitWindow(g, wnd) {
  const { x, y, w, h } = wnd;
  g.save();
  pool(g, x, y, w * 1.6, h * 1.4, '#ffc870', 0.35, 'lighter');
  const panes = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (const [sx, sy] of panes) { const px = x + sx * w * 0.25, py = y + sy * h * 0.25;
    g.globalCompositeOperation = 'source-over'; g.fillStyle = 'rgba(250,200,110,0.85)'; g.fillRect(px - w * 0.21, py - h * 0.21, w * 0.42, h * 0.42);
    pool(g, px, py + h * 0.05, w * 0.22, h * 0.2, '#fff0c0', 0.8); }
  g.restore();
  // the frame and the curtains in silhouette again on top
  penLine(g, [[x, y - h / 2], [x, y + h / 2]], { w: 3, alpha: 0.85 }); penLine(g, [[x - w / 2, y], [x + w / 2, y]], { w: 3, alpha: 0.85 });
  for (const sd of [-1, 1]) { const c0 = x + sd * w * 0.5, c1 = x + sd * w * 0.3; g.fillStyle = 'rgba(200,120,70,0.55)'; g.beginPath(); g.moveTo(c0, y - h / 2); g.quadraticCurveTo(c1 - sd * 4, y, c0, y + h / 2); g.lineTo(c0, y - h / 2); g.fill(); }
  penLine(g, [[x - w / 2, y - h / 2], [x + w / 2, y - h / 2], [x + w / 2, y + h / 2], [x - w / 2, y + h / 2]], { closed: true, sharp: true, w: 2.6, alpha: 0.9 });
}

// ---------------------------------------------------------------- the garden wall (dry stone, every stone inked)
function gardenWall(g, m, seed = 40) {
  const r = rng(seed), { x0, x1, y0, y1, h } = WALL;
  const yAt = (x) => y0 + (y1 - y0) * (x - x0) / (x1 - x0);
  // body: a shadowy band so the gaps read dark
  wash(g, [[x0, yAt(x0) + 3], [x1, yAt(x1) + 3], [x1, yAt(x1) - h], [x0, yAt(x0) - h]], { color: shade(m.stone[2], 0.45), opacity: 0.85, seed, bleed: 0.005, layers: 10, edge: 0 });
  const rows = 4, rh = (h - 14) / rows;
  for (let k = 0; k < rows; k++) {
    for (let x = x0 - (k % 2 ? r.range(10, 30) : 0); x < x1; ) {
      const sw = r.range(36, 70), a0 = Math.max(x0, x + 2), a1 = Math.min(x1, x + sw - 2); x += sw;
      if (a1 - a0 < 10) continue;
      const yb = (xx) => yAt(xx) - k * rh, j = () => r.range(-2, 2);
      const st = smooth([[a0 + 3, yb(a0) - 2 + j()], [(a0 + a1) / 2, yb((a0 + a1) / 2) - 1 + j()], [a1 - 3, yb(a1) - 2 + j()], [a1 + 1, yb(a1) - rh / 2], [a1 - 3, yb(a1) - rh + 2 + j()], [(a0 + a1) / 2, yb((a0 + a1) / 2) - rh + 1 + j()], [a0 + 3, yb(a0) - rh + 2 + j()], [a0 - 1, yb(a0) - rh / 2]]);
      const c = m.stone[Math.floor(r() * m.stone.length)];
      g.fillStyle = rgba(c, 0.95); path(g, st); g.fill();
      const b = bbox(st);
      g.save(); path(g, st); g.clip();
      g.fillStyle = rgba(tint(c, 0.5), 0.6); g.beginPath(); g.ellipse(b.x0 + b.w * 0.4, b.y0 + b.h * 0.28, b.w * 0.42, b.h * 0.28, 0, 0, TAU); g.fill();
      g.fillStyle = rgba(shade(c, 0.35), 0.4); g.beginPath(); g.ellipse(b.x0 + b.w * 0.62, b.y1, b.w * 0.5, b.h * 0.3, 0, 0, TAU); g.fill();
      if (r() < 0.25) { g.fillStyle = rgba(r() < 0.5 ? '#c8c070' : '#e0d8a8', 0.55); for (let q = 0; q < 4; q++) { g.beginPath(); g.arc(b.x0 + r() * b.w, b.y0 + r() * b.h, r.range(1, 3), 0, TAU); g.fill(); } } // lichen
      g.restore();
      ink(g, st, { closed: true, width: 1.3, alpha: 0.75, wobble: 0.3, gaps: 0.6, seed: seed + Math.round(a0 * 3 + k) });
    }
  }
  // coping: rounded stones set on edge along the top
  for (let x = x0; x < x1; ) {
    const cw = r.range(14, 22), yb = yAt(x) - rows * rh, ch = r.range(12, 16);
    const cap = smooth([[x, yb + 1], [x - 1, yb - ch * 0.8], [x + cw * 0.4, yb - ch], [x + cw, yb - ch * 0.85], [x + cw, yb + 1]]);
    const c = m.stone[Math.floor(r() * m.stone.length)];
    g.fillStyle = rgba(c, 0.97); path(g, cap); g.fill();
    g.fillStyle = rgba(tint(c, 0.5), 0.6); g.beginPath(); g.ellipse(x + cw * 0.4, yb - ch * 0.7, cw * 0.3, ch * 0.2, 0, 0, TAU); g.fill();
    ink(g, cap, { closed: true, width: 1, alpha: 0.6, wobble: 0.3, gaps: 0.8, seed: seed + Math.round(x * 5) });
    x += cw + r.range(0, 2);
  }
  // the wall's shadow on the garden side (short at midday, long and violet at sunset)
  const sl = m.name === 'sunset' ? 34 : m.name === 'night' ? 14 : 9;
  g.save(); g.globalCompositeOperation = 'multiply';
  wash(g, [[x0, yAt(x0) + 1], [x1, yAt(x1) + 1], [x1, yAt(x1) + sl], [x0 + 60, yAt(x0) + sl]], { color: m.shadow, opacity: m.shadowA * 1.5, seed: seed + 9, bleed: 0.02, layers: 12 });
  g.restore();
}

// ---------------------------------------------------------------- the old elm (beyond the wall), with the nest
function limb(g, pts, w0, w1, sd, bark = '#8a7a68') {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = (w0 + (w1 - w0) * i / (pts.length - 1)) / 2 * (1 + 0.12 * noise1(i * 1.7, sd));
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  const sh = smooth(L.concat(R.slice().reverse()));
  wash(g, sh, { color: bark, opacity: 0.97, seed: sd, under: true, bleed: 0.015 });
  g.save(); path(g, sh); g.clip(); g.filter = 'blur(4px)'; g.strokeStyle = rgba('#3e342c', 0.5); g.lineWidth = w0 * 0.45; g.beginPath(); smooth(R, false).forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke();
  g.strokeStyle = rgba('#d8c8b0', 0.35); g.lineWidth = w0 * 0.2; g.beginPath(); smooth(L, false).forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke(); g.restore();
  // elm bark: long, deep, criss-crossing furrows
  hatch(g, sh, { count: Math.round(w0 * 9), len: Math.max(8, w0 * 0.55), dir: () => -Math.PI / 2 + 0.06, alpha: 0.45, width: 0.9, seed: sd + 1, curve: 0.15 });
  penLine(g, smooth(L, false), { w: 2, alpha: 0.85, seed: sd + 2 }); penLine(g, smooth(R, false), { w: 2.4, alpha: 0.85, seed: sd + 3 });
  return sh;
}
function leafClump(g, cx, cy, rr, sd, cols, o = {}) {
  const sh = fluffy(cx, cy, rr, rr * 0.75, 12, 0.24, sd);
  wash(g, sh, { color: cols[sd % cols.length], opacity: 1, seed: sd, under: o.under || shade(cols[0], 0.35), bleed: 0.03, edge: 0.3 });
  g.save(); path(g, sh); g.clip(); g.filter = 'blur(8px)';
  g.fillStyle = rgba(shade(cols[0], 0.45), 0.55); g.beginPath(); g.ellipse(cx + rr * 0.15, cy + rr * 0.55, rr, rr * 0.5, 0, 0, TAU); g.fill();
  g.fillStyle = rgba(tint(cols[3] || cols[1], 0.45), 0.5); g.beginPath(); g.ellipse(cx - rr * 0.25, cy - rr * 0.35, rr * 0.55, rr * 0.3, 0, 0, TAU); g.fill(); g.restore();
  const rl = rng(sd + 3);
  for (let k = 0; k < rr * 1.5; k++) { // small serrated elm leaves, some already yellow in the drought
    const a = rl() * TAU, d = Math.sqrt(rl()), lx = cx + Math.cos(a) * rr * d * 0.97, ly = cy + Math.sin(a) * rr * 0.72 * d, up = (cy - ly) / rr;
    g.save(); g.translate(lx, ly); g.rotate(rl.range(-1, 1) + (lx - cx) / rr);
    const c = rl() < 0.06 ? '#d8b048' : up > 0.1 && rl() < 0.6 ? tint(cols[3] || cols[1], 0.3) : rl() < 0.4 ? shade(cols[0], 0.35) : cols[k % cols.length];
    g.fillStyle = rgba(c, 0.75); g.beginPath(); g.moveTo(-6, 0); g.quadraticCurveTo(0, -4.4, 6.5, 0); g.quadraticCurveTo(0, 4, -6, 0); g.fill();
    if (rl() < 0.2) { g.strokeStyle = rgba(INKC, 0.45); g.lineWidth = 0.6; g.stroke(); }
    g.restore();
  }
  ink(g, sh.slice(Math.floor(sh.length * 0.55)).concat(sh.slice(0, Math.floor(sh.length * 0.05))), { width: 1.1, alpha: 0.6, gaps: 1, seed: sd + 4 });
  return sh;
}
// fine twigs fanning out from a crown clump's edge (above and to the sides), with a few leaves at their tips
function twigs(g, cx, cy, rr, sd, cols) {
  const r = rng(sd); g.save(); g.lineCap = 'round';
  for (let k = 0; k < rr / 4; k++) {
    const a = Math.PI * r.range(0.95, 2.05), x0 = cx + Math.cos(a) * rr * 0.8, y0 = cy + Math.sin(a) * rr * 0.62, L = rr * r.range(0.25, 0.5);
    const x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L * 0.8 - L * 0.15;
    g.strokeStyle = rgba(INKC, 0.55); g.lineWidth = 0.8; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + r.gauss(0, 3), (y0 + y1) / 2 + r.gauss(0, 3), x1, y1); g.stroke();
    for (let q = 0; q < 2; q++) { const u = r.range(0.4, 1), bx = lerp(x0, x1, u), by = lerp(y0, y1, u), ba = a + r.gauss(0, 0.7); g.lineWidth = 0.5; g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(ba) * L * 0.3, by + Math.sin(ba) * L * 0.3); g.stroke(); }
    for (let q = 0; q < 4; q++) { g.fillStyle = rgba(cols[(k + q) % cols.length], 0.85); g.beginPath(); g.ellipse(x1 + r.gauss(0, 4), y1 + r.gauss(0, 4), 3.4, 2.2, r() * 3, 0, TAU); g.fill(); }
  }
  g.restore();
}
const along = (pts, t) => { const f = t * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), k = f - i; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; };
// The old elm beyond the wall: a tall, strong trunk dividing high (the nest sits in the fork) into a vase of
// steep limbs, which branch and vanish into a fine, dense crown of clumps; the crown is broad at the top and
// ragged underneath, never flat-bottomed.
function elmTree(g, m) {
  const { x, ground: gd } = ELM, r = rng(311), [nx, ny] = NEST, fy = ny + 30;
  const L = [
    [[x - 18, fy + 10], [x - 80, fy - 120], [x - 170, fy - 270], [x - 250, fy - 420]],
    [[x - 6, fy + 6], [x - 34, fy - 150], [x - 60, fy - 300], [x - 70, fy - 460]],
    [[x + 10, fy + 6], [x + 46, fy - 150], [x + 100, fy - 300], [x + 150, fy - 450]],
    [[x + 22, fy + 10], [x + 110, fy - 100], [x + 230, fy - 220], [x + 340, fy - 310]],
  ];
  const W0 = [56, 46, 48, 50];
  const branches = [];
  L.forEach((pts, i) => { const out = i < 2 ? -1 : 1;
    for (const t of [0.42, 0.62, 0.8]) { const [bx, by] = along(pts, t), ang = -Math.PI / 2 + out * r.range(0.5, 0.95) + (r() - 0.5) * 0.3, len = r.range(90, 150) * (1.1 - t * 0.4);
      branches.push([[bx, by], [bx + Math.cos(ang) * len * 0.5, by + Math.sin(ang) * len * 0.5 - 10], [bx + Math.cos(ang) * len, by + Math.sin(ang) * len], W0[i] * 0.42 * (1 - t * 0.5)]); } });
  // clumps: inner ones (darker, behind the limbs) and outer ones (in front, swallowing the limb and branch ends)
  const back = [], front = [];
  L.forEach((pts, i) => { for (const t of [0.5, 0.68, 0.86, 1.02]) { const [cx, cy] = along(pts, Math.min(1, t)); back.push([cx + r.gauss(0, 30), cy - (t > 1 ? 50 : 0) + r.gauss(0, 20), r.range(80, 115)]); }
    const [ex, ey] = pts[3]; front.push([ex + r.gauss(0, 20), ey + 10, r.range(95, 125)]); });
  for (const [, , [bx, by], w] of branches) front.push([bx + r.gauss(0, 12), by + r.gauss(0, 10), r.range(62, 92) * (0.8 + w / 30)]);
  for (let k = 0; k < 6; k++) front.push([x + r.range(-260, 300), r.range(-110, -30), r.range(100, 130)]);  // the high, broad top of the vase
  // the trunk and the four limbs, then the branches
  limb(g, [[x + 4, gd + 10], [x - 6, gd - 110], [x + 8, gd - 230], [x - 2, fy + 20]], 124, 96, 320);
  for (const [i, pts] of L.entries()) back.filter((_, k) => Math.floor(k / 4) === i && k % 4 >= 2).forEach(([cx, cy, rr], k) => leafClump(g, cx, cy, rr * 0.9, 390 + i * 9 + k, m.elm.map((c) => shade(c, 0.28)), {}));
  L.forEach((pts, i) => limb(g, pts, W0[i], 12, 321 + i));
  for (const [a, b, c, w] of branches) limb(g, [a, b, c], w, 4, 340 + Math.round(a[0]));
  for (const [i, [cx, cy, rr]] of back.filter((_, k) => k % 4 < 2).entries()) leafClump(g, cx, cy, rr * 0.85, 360 + i * 7, m.elm.map((c) => shade(c, 0.2)), {});
  // leafy sprays climbing the limbs (old elms are full of them), so the limbs run up into the crown with no bare gap;
  // they thicken toward the top, and none sit over the nest
  const sprays = [];
  L.forEach((pts, i) => { for (let t = 0.12; t < 0.75; t += r.range(0.07, 0.11)) { const [lx, ly] = along(pts, t), side = (Math.round(t * 30) % 2 ? 1 : -1) * (i < 2 ? 1 : -1);
    const sx = lx + side * r.range(16, 34), sy = ly + r.gauss(0, 8); if (Math.hypot(sx - nx, sy - ny) < 95) continue; sprays.push([sx, sy, r.range(26, 40) + t * 50]); } });
  sprays.sort((a, b) => a[1] - b[1]);
  for (const [i, [cx, cy, rr]] of sprays.entries()) { leafClump(g, cx, cy, rr, 700 + i * 5, m.elm); twigs(g, cx, cy, rr * 1.2, 800 + i, m.elm); }
  // the outer crown, top first so the lower clumps overlap it; twigs at every clump's edge
  front.sort((a, b) => a[1] - b[1]);
  for (const [i, [cx, cy, rr]] of front.entries()) { leafClump(g, cx, cy, rr, 400 + i * 7, m.elm); twigs(g, cx, cy, rr, 600 + i, m.elm); }
  // the nest in the fork: a bowl of twigs (the front rim is drawNestFront, so a crow can sit in it)
  nestBack(g, nx, ny, m);
}
function nestTwigs(g, cx, cy, w, h, n, seed, cols, lw = [1, 2.4]) {
  const r = rng(seed); g.save(); g.lineCap = 'round';
  for (let k = 0; k < n; k++) { const a = r.range(-w, w), b = r.range(-h, h); g.strokeStyle = rgba(r.pick(cols), r.range(0.6, 0.95)); g.lineWidth = r.range(...lw);
    g.beginPath(); g.moveTo(cx + a, cy + b); g.quadraticCurveTo(cx + a + r.gauss(0, 14), cy + b + r.gauss(0, 4), cx + a + r.range(-34, 34), cy + b + r.gauss(0, 5)); g.stroke(); }
  g.restore();
}
function nestBack(g, x, y, m) {
  const bowl = smooth([[x - 52, y - 4], [x - 44, y - 18], [x, y - 22], [x + 44, y - 18], [x + 54, y - 4], [x + 36, y + 14], [x, y + 20], [x - 38, y + 14]]);
  wash(g, bowl, { color: '#7a5a3a', opacity: 0.97, under: '#d8c8a8', seed: 340 });
  g.fillStyle = 'rgba(50,34,22,0.6)'; g.beginPath(); g.ellipse(x, y - 12, 40, 8, 0, 0, TAU); g.fill();
  nestTwigs(g, x, y - 6, 48, 12, 40, 341, ['#4a3420', '#8a6a44', '#b89a70']);
  penLine(g, bowl, { closed: true, w: 1.4, alpha: 0.6 });
}
const NESTSPR = {};
// the front rim of the nest (draw after a crow sitting in it); also baked into the garden so it is there when empty
export function drawNestFront(g, mood = 'hot') {
  const m = MD(mood), [x, y] = NEST;
  if (!NESTSPR[m.name]) {
    NESTSPR[m.name] = sprite({ x0: x - 70, y0: y - 30, x1: x + 70, y1: y + 34, w: 140, h: 64 }, 3, (g2) => {
      const rim = smooth([[x - 56, y - 10], [x - 30, y - 2], [x, y + 1], [x + 30, y - 2], [x + 58, y - 10], [x + 52, y + 10], [x + 30, y + 22], [x, y + 26], [x - 32, y + 22], [x - 52, y + 10]]);
      wash(g2, rim, { color: '#8a6a44', opacity: 0.97, under: '#d8c8a8', seed: 350 });
      g2.save(); path(g2, rim); g2.clip(); nestTwigs(g2, x, y + 10, 54, 14, 70, 351, ['#4a3420', '#6a4c30', '#a88a60', '#c8ae84'], [0.8, 2.2]); g2.restore();
      nestTwigs(g2, x, y + 4, 60, 10, 14, 352, ['#4a3420', '#8a6a44'], [0.8, 1.6]); // a few twigs poking out
      penLine(g2, rim, { closed: true, w: 1.3, alpha: 0.7 });
    }, { grain: 0.2, seed: 353 });
    if (m.name !== 'hot') moodGlaze(NESTSPR[m.name].c, m, 3, 354);
  }
  drawSprite(g, NESTSPR[m.name]);
}

// ---------------------------------------------------------------- ground: distance, lawn, path
function paintDistance(g, m, seed = 20) {
  const r = rng(seed);
  // far hills, hazy, then fields with hedgerows sloping away behind the wall
  const hill = (pts) => smooth(pts, false, 6);
  const h1 = hill([[-M - 40, 440], [200, 412], [520, 430], [800, 400], [1100, 420], [1400, 396], [1700, 418], [W + M + 40, 404]]);
  brushWash(g, h1.concat([[W + M + 40, 720], [-M - 40, 720]]), m.hills.map((c) => mix(c, m.sky[2], 0.3)), { seed: seed + 1, count: 80, width: [20, 50], angle: () => -0.04, alpha: [0.1, 0.24], base: 0.5, under: true });
  sketch(g, h1, { alpha: 0.35, width: 1, seed: seed + 2 });
  // a church tower far off, a storybook landmark
  { const tx = 1240, ty = 418, tw = 16, th = 46; const tw0 = [[tx - tw / 2, ty], [tx + tw / 2, ty], [tx + tw / 2, ty - th], [tx - tw / 2, ty - th]];
    wash(g, tw0, { color: mix(m.stone[2], m.hills[0], 0.5), opacity: 0.9, seed: seed + 3, layers: 8, under: true });
    for (let k = 0; k < 3; k++) g.fillRect(tx - tw / 2 + 2 + k * 5, ty - th - 4, 3, 4);
    ink(g, tw0, { closed: true, width: 0.8, alpha: 0.45, seed: seed + 4 }); }
  const fields = hill([[-M - 40, 470], [400, 462], [900, 476], [1400, 466], [W + M + 40, 474], [W + M + 40, 760], [-M - 40, 760]]);
  brushWash(g, fields, m.far, { seed: seed + 5, count: 140, width: [10, 30], len: [60, 260], angle: () => 0.01, alpha: [0.16, 0.34], base: 0.55, under: true, lifts: 0.25 });
  // stubble rows and hedgerow lines, getting closer
  g.save(); path(g, fields); g.clip();
  for (let i = 0; i < 26; i++) { const y = 478 + Math.pow(i / 26, 1.6) * 200, x0 = r.range(-100, 1600), l = r.range(200, 700);
    ink(g, [[x0, y], [x0 + l / 2, y + r.gauss(0, 2)], [x0 + l, y + r.gauss(0, 3)]], { color: shade(m.far[1], 0.35), width: 0.6 + i * 0.03, alpha: 0.3, gaps: 1.2, seed: seed + 10 + i }); }
  g.restore();
  const HR = [[484, -100, 1050, 1, 0.012], [498, 880, 2100, 2, -0.008], [522, -100, 760, 3, 0.02], [548, 1080, 2100, 4, -0.012], [600, -100, 520, 5, 0.03]];
  const hyAt = ([hy, x0, , sd, sl], x) => hy + (x - x0) * sl * 0.3 + noise1(x * 0.01, sd) * 6;
  // strips of stubble, plough and parched grass between the hedges
  HR.forEach((h, i) => { const [, x0, x1, sd] = h, nxt = HR[i + 1] || [h[0] + 60, x0, x1, sd + 1, 0], top = [], bot = [];
    for (let x = x0; x <= x1; x += 40) { top.push([x, hyAt(h, x)]); bot.push([x, Math.min(hyAt(nxt, x), hyAt(h, x) + 50)]); }
    const strip = top.concat(bot.reverse()), c = [m.far[0], m.earth[1], m.lawn[3], m.far[2], m.field[3]][i % 5];
    wash(g, strip, { color: mix(c, m.sky[2], clamp((560 - h[0]) / 200) * 0.4), opacity: 0.45, seed: seed + 80 + i, bleed: 0.02, layers: 12, edge: 0.1 });
    g.save(); path(g, strip); g.clip(); for (let q = 0; q < 30; q++) { const yy = lerp(h[0], h[0] + 40, q / 30); ink(g, [[x0, yy], [x1, yy + r.gauss(0, 2)]], { color: shade(c, 0.35), width: 0.6, alpha: 0.18, gaps: 1.5, seed: seed + 90 + i * 40 + q }); } g.restore(); });
  for (const h of HR) {
    const [hy, x0, x1, sd] = h;
    let gap = 0;
    for (let x = x0; x < x1; x += r.range(6, 13)) {
      if (gap > 0) { gap--; continue; } if (r() < 0.025) { gap = 3 + Math.floor(r() * 6); continue; }
      const s0 = (4 + (hy - 480) * 0.07) * r.range(0.7, 1.5), c = mix(m.hedge[Math.floor(r() * 3)], m.sky[2], clamp((560 - hy) / 160) * 0.45), y = hyAt(h, x);
      g.fillStyle = rgba(m.shadow, 0.18); g.beginPath(); g.ellipse(x + s0 * 0.4, y + s0 * 0.15, s0 * 1.1, s0 * 0.3, 0, 0, TAU); g.fill();
      g.fillStyle = rgba(c, 0.92); g.beginPath(); g.ellipse(x, y - s0 * 0.5, s0 * r.range(0.9, 1.3), s0 * r.range(0.6, 0.9), 0, 0, TAU); g.fill();
      g.fillStyle = rgba(tint(c, 0.3), 0.5); g.beginPath(); g.ellipse(x - s0 * 0.2, y - s0 * 0.75, s0 * 0.5, s0 * 0.28, 0, 0, TAU); g.fill();
    }
    for (let k = 0; k < 6; k++) { const tx = r.range(x0, x1), R = (10 + (hy - 480) * 0.17) * r.range(0.7, 1.3), ty = hyAt(h, tx) - R * 1.15; const sh = fluffy(tx, ty, R, R * 0.85, 7, 0.2, seed + 40 + sd * 7 + k);
      g.strokeStyle = rgba('#5a4636', 0.8); g.lineWidth = Math.max(1, R * 0.1); g.beginPath(); g.moveTo(tx, hyAt(h, tx)); g.lineTo(tx, ty); g.stroke();
      wash(g, sh, { color: mix(m.elm[k % 4], m.sky[2], 0.3), opacity: 0.92, seed: seed + 50 + sd * 7 + k, layers: 10, under: '#ece2c8' }); glaze(g, sh, tx - R * 0.3, ty - R * 0.3, R * 0.5, R * 0.35, tint(m.leaf[3], 0.4), 0.5); ink(g, sh.filter(([, py]) => py < ty), { width: 0.7, alpha: 0.4, gaps: 1.2, seed: seed + 60 + k }); }
    ink(g, [[x0, hyAt(h, x0) - 6], [(x0 + x1) / 2, hyAt(h, (x0 + x1) / 2) - 6], [x1, hyAt(h, x1) - 6]], { width: 0.7, alpha: 0.25, gaps: 2, seed: seed + 70 + sd });
  }
  // a few round hay bales and stooks in the stubble beyond the wall
  for (const [x, y, s0] of [[860, 512, 7], [905, 516, 7], [1290, 530, 9], [1560, 560, 10], [1610, 566, 10], [300, 540, 9]]) {
    g.fillStyle = rgba(m.shadow, 0.25); g.beginPath(); g.ellipse(x + s0 * 0.6, y + s0 * 0.25, s0 * 1.3, s0 * 0.3, 0, 0, TAU); g.fill();
    g.fillStyle = rgba(mix('#e2c47c', m.sky[2], 0.25), 0.95); g.beginPath(); g.ellipse(x, y - s0 * 0.55, s0 * 1.05, s0 * 0.75, 0, 0, TAU); g.fill();
    ink(g, ellipse(x, y - s0 * 0.55, s0 * 1.05, s0 * 0.75, 16), { closed: true, width: 0.7, alpha: 0.45 }); ink(g, ellipse(x - s0 * 0.35, y - s0 * 0.55, s0 * 0.35, s0 * 0.6, 12), { closed: true, width: 0.6, alpha: 0.35 });
  }
}
// the dried-out lawn of the garden (in front of the wall, round the cottage)
const LAWN = smooth([[-M - 40, 636], [140, 640], [520, 650], [560, 700], [1100, 704], [W + M + 40, 712], [W + M + 40, LH], [-M - 40, LH]]);
// the gravel path: from the cottage door, sweeping past the pitcher and away to the right
const PATHC = [[214, 656], [300, 694], [470, 748], [690, 800], [940, 834], [1200, 852], [1480, 862], [1760, 868], [2100, 872]];
const pathW = (x) => clamp(30 + (x - 214) * 0.08, 30, 108);
function pathEdges() {
  const P = smooth(PATHC, false, 10), A = [], B = [];
  for (let i = 0; i < P.length; i++) {
    const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = pathW(P[i][0]) / 2;
    A.push([P[i][0] + dy * w * 1.6, P[i][1] - dx * w * 0.55]); B.push([P[i][0] - dy * w * 1.6, P[i][1] + dx * w * 0.55]);
  }
  return { P, A, B, shape: A.concat(B.slice().reverse()) };
}
function paintLawn(g, m, seed = 30) {
  const r = rng(seed);
  brushWash(g, LAWN, m.lawn, { seed, count: 460, angle: (x) => -0.03 + noise1(x * 0.003, seed) * 0.3, width: [10, 40], len: [40, 200], alpha: [0.12, 0.3], base: 0.5, under: true, lifts: 0.22 });
  // bare, baked patches of earth with fine cracks
  for (let i = 0; i < 9; i++) { const x = r.range(80, 1880), y = r.range(740, 1060), w = r.range(60, 160);
    const sh = fluffy(x, y, w, w * 0.22, 9, 0.3, seed + 10 + i);
    wash(g, sh, { color: m.earth[i % 3], opacity: 0.5, seed: seed + 20 + i, bleed: 0.08, layers: 14, edge: 0.15 });
    g.save(); path(g, sh); g.clip(); for (let q = 0; q < 10; q++) { const cx0 = x + r.range(-w, w), cy0 = y + r.range(-w * 0.2, w * 0.2); ink(g, [[cx0, cy0], [cx0 + r.range(-14, 14), cy0 + r.range(-3, 3)], [cx0 + r.range(-26, 26), cy0 + r.range(-4, 4)]], { width: 0.7, alpha: 0.35, seed: seed + 30 + q }); } g.restore(); }
  hatch(g, LAWN, { color: shade(m.lawn[3], 0.35), count: 7000, len: 9, width: 1, alpha: 0.32, seed: seed + 4, dir: () => -Math.PI / 2 + 0.15, curve: 0.5, density: (x, y) => 0.25 + 0.75 * Math.max(0, noise1(x * 0.006 + y * 0.004, seed + 5)) * (y > 900 ? 0.5 : 1) });
  hatch(g, LAWN, { color: INKC, count: 1800, len: 8, width: 0.8, alpha: 0.28, seed: seed + 6, dir: () => -Math.PI / 2, curve: 0.5, density: (x, y) => (y < 900 ? (y - 640) / 400 : 0.35) });
  for (let i = 0; i < 160; i++) { const x = r.range(-80, 2000), y = r.range(720, 1110); grassFlicks(g, x, y, 5 + (y - 640) * 0.035, { seed: seed + 100 + i, n: 5, colors: [m.lawn[3], shade(m.lawn[1], 0.2), m.leaf[3]], inkA: 0.3 }); }
  g.save(); g.globalCompositeOperation = 'multiply';
  const band = smooth([[-M - 40, 1010], [300, 990], [700, 1004], [1100, 985], [1500, 1000], [W + M + 40, 980], [W + M + 40, LH], [-M - 40, LH]]);
  wash(g, band, { color: m.shadow, opacity: m.shadowA * 1.3, seed: seed + 7, bleed: 0.05, layers: 16, edge: 0.05 });
  for (let i = 0; i < 9; i++) pool(g, r.range(-40, 1960), r.range(940, 1000), r.range(80, 200), r.range(14, 30), m.shadow, 0.18);
  g.restore();
}
function paintPath(g, m, seed = 70) {
  const { P, A, B, shape } = pathEdges(), r = rng(seed);
  brushWash(g, shape, m.gravel, { seed, count: 160, width: [8, 26], len: [40, 140], angle: () => 0.08, alpha: [0.14, 0.32], base: 0.5, under: '#f4ecdc', lifts: 0.25 });
  flecks(g, shape, [shade(m.gravel[2], 0.25), '#a8a0b0', tint(m.gravel[0], 0.4)], { seed: seed + 7, count: 2600, size: [1, 3.4], alpha: [0.2, 0.5], dy: 0.6 });
  // little gravel stones, bigger nearer
  g.save(); path(g, shape); g.clip();
  for (let i = 0; i < 900; i++) {
    const k = Math.floor(r() * (P.length - 1)), [px, py] = P[k], w = pathW(px);
    const x = px + r.range(-0.8, 0.8) * w, y = py + r.range(-0.3, 0.3) * w * 0.6, s = 1.2 + w * 0.025 * r.range(0.5, 1.4);
    g.fillStyle = rgba(m.shadow, 0.16); g.beginPath(); g.ellipse(x + s * 0.3, y + s * 0.45, s * 1.4, s * 0.4, 0, 0, TAU); g.fill();
    g.fillStyle = rgba(m.stone[Math.floor(r() * m.stone.length)], 0.9); g.beginPath(); g.ellipse(x, y, s * 1.4, s * 0.75, r.gauss(0, 0.3), 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,250,240,0.45)'; g.beginPath(); g.ellipse(x - s * 0.3, y - s * 0.25, s * 0.6, s * 0.28, 0, 0, TAU); g.fill();
    if (s > 3) ink(g, ellipse(x, y, s * 1.4, s * 0.75, 10).slice(4, 10), { width: 0.8, alpha: 0.5, wobble: 0.3, seed: seed + 100 + i });
  }
  g.restore();
  // edging: a row of rounded stones half-sunk along both sides, then broken pen lines
  for (const [E, sd] of [[A, 1], [B, 2]]) {
    for (let i = 0; i < E.length; i += 2) { const [x, y] = E[i], s = 3 + pathW(x) * 0.05;
      const st = ellipse(x, y, s * 1.5, s * 0.8, 12, r.gauss(0, 0.15));
      g.fillStyle = rgba(m.stone[i % m.stone.length], 0.95); path(g, st); g.fill();
      g.fillStyle = 'rgba(255,250,240,0.5)'; g.beginPath(); g.ellipse(x - s * 0.4, y - s * 0.3, s * 0.7, s * 0.25, 0, 0, TAU); g.fill();
      ink(g, st, { closed: true, width: 0.9, alpha: 0.55, wobble: 0.2, gaps: 0.5, seed: seed + 300 + i + sd * 1000 }); }
    ink(g, E.filter((_, i) => i % 2 === 0), { width: 1.1, alpha: 0.45, gaps: 1.4, seed: seed + sd });
  }
  return { A, B };
}
// flagstones under the pitcher, between the wall and the path
function paintFlags(g, m, seed = 90) {
  const r = rng(seed);
  for (const [x, y, w, h, a] of [[1100, 742, 70, 26, -0.03], [1186, 746, 66, 24, 0.04], [1068, 782, 64, 22, 0.02], [1150, 790, 84, 26, -0.02], [1236, 782, 52, 22, 0.05]]) {
    const st = smooth([[x - w / 2, y - h / 2 + r.gauss(0, 2)], [x + w / 2, y - h / 2 + r.gauss(0, 2)], [x + w / 2 + 3, y + h / 2], [x - w / 2 + 2, y + h / 2 + 1]].map(([px, py]) => [x + (px - x) * Math.cos(a) - (py - y) * Math.sin(a), y + (px - x) * Math.sin(a) + (py - y) * Math.cos(a)]), true, 4);
    wash(g, st, { color: m.stone[Math.floor(r() * m.stone.length)], opacity: 0.95, seed: seed + x, under: true, layers: 10, edge: 0.3 });
    glaze(g, st, x - w * 0.2, y - h * 0.2, w * 0.4, h * 0.3, '#ffffff', 0.35);
    ink(g, st, { closed: true, width: 1.1, alpha: 0.65, wobble: 0.3, gaps: 0.4, seed: seed + x + 1 });
    grassFlicks(g, x + w / 2 + 2, y + h / 2, 7, { seed: seed + x + 2, n: 4, colors: [m.lawn[3]], inkA: 0.35 });
  }
}

// ---------------------------------------------------------------- props
function paintBirdBath(g, m, seed = 120) {
  const { x, y } = BIRDBATH, r = rng(seed);
  castShadow(g, x, y + 2, 34, 120, m, { seed: seed + 1, len: 1.4 });
  const st = m.stone[0], sd = shade(m.stone[2], 0.15);
  const ped = smooth([[x - 30, y], [x - 26, y - 14], [x - 13, y - 22], [x - 11, y - 60], [x - 17, y - 84], [x - 10, y - 104], [x + 10, y - 104], [x + 17, y - 84], [x + 11, y - 60], [x + 13, y - 22], [x + 26, y - 14], [x + 30, y]]);
  wash(g, ped, { color: st, opacity: 0.97, seed: seed + 2, under: true, bleed: 0.008 });
  shadeEdge(g, ped, { color: shade(sd, 0.3), alpha: 0.55, width: 16, dx: -6, dy: 0 });
  glaze(g, ped, x - 6, y - 60, 6, 40, '#ffffff', 0.4);
  for (let k = 0; k < 7; k++) { g.fillStyle = rgba(r() < 0.5 ? '#c8c070' : '#a8b080', 0.5); g.beginPath(); g.arc(x + r.range(-12, 12), y - r.range(5, 95), r.range(1.5, 3.5), 0, TAU); g.fill(); } // lichen
  penLine(g, ped, { closed: true, w: 1.6, alpha: 0.8, seed: seed + 3 });
  // the bowl: a wide shallow dish, quite dry: a pale tide-mark, a curled leaf and a feather
  const by = y - 108, bw = 64;
  const bowl = smooth([[x - bw, by - 6], [x - bw + 6, by + 6], [x - 30, by + 16], [x + 30, by + 16], [x + bw - 6, by + 6], [x + bw, by - 6]]).concat(ellipse(x, by - 6, bw, 12, 30).slice(0, 16));
  wash(g, bowl, { color: st, opacity: 0.97, seed: seed + 4, under: true, bleed: 0.006 });
  shadeEdge(g, bowl, { color: shade(sd, 0.3), alpha: 0.5, width: 18, dx: -8, dy: -4 });
  const top = ellipse(x, by - 6, bw, 13, 40), inner = ellipse(x, by - 5, bw - 8, 9, 40);
  wash(g, top, { color: tint(st, 0.2), opacity: 0.97, seed: seed + 5, under: true, bleed: 0.004, layers: 8 });
  wash(g, inner, { color: shade(m.stone[3], 0.1), opacity: 0.95, seed: seed + 6, under: true, bleed: 0.004, layers: 8 });
  g.save(); path(g, inner); g.clip(); g.strokeStyle = rgba('#8a7a60', 0.5); g.lineWidth = 1.2; g.beginPath(); g.ellipse(x + 2, by - 3, bw - 20, 5.5, 0, 0, TAU); g.stroke();
  g.fillStyle = rgba('#a89070', 0.35); g.beginPath(); g.ellipse(x + 4, by - 2, bw - 26, 4, 0, 0, TAU); g.fill(); g.restore();
  // a curled brown leaf and a little grey feather lying in it
  g.save(); g.translate(x - 18, by - 5); g.rotate(-0.3); g.fillStyle = rgba('#a87038', 0.95); g.beginPath(); g.moveTo(-9, 0); g.quadraticCurveTo(0, -6, 9, 0); g.quadraticCurveTo(0, 3, -9, 0); g.fill(); g.restore();
  ink(g, [[x - 27, by - 3], [x - 18, by - 8], [x - 9, by - 6]], { width: 0.8, alpha: 0.6 });
  g.save(); g.translate(x + 20, by - 5); g.rotate(0.2); g.fillStyle = 'rgba(200,200,205,0.9)'; g.beginPath(); g.ellipse(0, 0, 10, 2.6, 0, 0, TAU); g.fill(); g.restore();
  ink(g, [[x + 10, by - 6], [x + 30, by - 3]], { width: 0.6, alpha: 0.6 });
  penLine(g, top, { closed: true, w: 1.5, alpha: 0.8, seed: seed + 7 }); penLine(g, inner.slice(0, 20), { w: 1, alpha: 0.6, seed: seed + 8 });
  penLine(g, bowl.slice(0, 26), { w: 1.6, alpha: 0.8, seed: seed + 9 });
  for (let i = 0; i < 6; i++) grassFlicks(g, x + r.range(-34, 34), y + 1, 14, { seed: seed + 20 + i, n: 4, colors: [m.lawn[3]], inkA: 0.35 });
}
function paintWateringCan(g, m, seed = 140) {
  const { x, y } = CAN, r = rng(seed);
  castShadow(g, x + 10, y + 2, 52, 40, m, { seed: seed + 1, len: 1.6 });
  const col = '#7a968c', dark = '#4a6058';
  // spout first, reaching left along the ground, with its rose
  const spout = ribbon([[x - 30, y - 22], [x - 70, y - 20], [x - 108, y - 14]], 9, 5, 6);
  wash(g, spout, { color: col, opacity: 0.97, seed: seed + 2, under: true, bleed: 0.008 });
  penLine(g, spout, { closed: true, w: 1.2, alpha: 0.75 });
  const rose = smooth([[x - 104, y - 20], [x - 118, y - 26], [x - 124, y - 14], [x - 118, y - 2], [x - 104, y - 8]]);
  wash(g, rose, { color: '#b8a070', opacity: 0.97, seed: seed + 3, under: true });
  for (let k = 0; k < 7; k++) { g.fillStyle = 'rgba(60,50,40,0.7)'; g.beginPath(); g.arc(x - 121 + (k % 2) * 2, y - 22 + k * 2.2, 0.9, 0, TAU); g.fill(); }
  penLine(g, rose, { closed: true, w: 1.1, alpha: 0.8 });
  // the barrel lying on its side (its open top toward the right), handle arching over
  const body = smooth([[x - 40, y - 46], [x + 44, y - 46], [x + 50, y - 26], [x + 44, y - 2], [x - 40, y - 2], [x - 46, y - 24]]);
  wash(g, body, { color: col, opacity: 0.97, seed: seed + 4, under: true, bleed: 0.008 });
  g.save(); path(g, body); g.clip();
  const lg = g.createLinearGradient(0, y - 46, 0, y); lg.addColorStop(0, 'rgba(255,255,240,0.35)'); lg.addColorStop(0.35, 'rgba(255,255,240,0.05)'); lg.addColorStop(1, rgba(dark, 0.6));
  g.fillStyle = lg; g.fillRect(x - 50, y - 50, 100, 52);
  for (const bx of [x - 30, x + 34]) { g.strokeStyle = rgba(dark, 0.5); g.lineWidth = 2; g.beginPath(); g.moveTo(bx, y - 46); g.lineTo(bx, y - 2); g.stroke(); }
  for (let k = 0; k < 9; k++) { g.fillStyle = rgba(r() < 0.5 ? '#a0603a' : '#c08050', r.range(0.3, 0.6)); g.beginPath(); g.ellipse(x + r.range(-36, 40), y - r.range(6, 40), r.range(1.5, 4), r.range(1, 2.5), 0, 0, TAU); g.fill(); } // rust
  g.restore();
  const mouth = ellipse(x + 46, y - 24, 9, 22, 30);
  wash(g, mouth, { color: shade(col, 0.25), opacity: 0.97, seed: seed + 5, under: true });
  wash(g, ellipse(x + 47, y - 24, 6, 18, 24), { color: '#2a2420', opacity: 0.95, seed: seed + 6, under: true, layers: 8 });
  penLine(g, mouth, { closed: true, w: 1.3, alpha: 0.8 });
  penLine(g, body.slice(0, Math.floor(body.length * 0.55)), { w: 1.5, alpha: 0.8, seed: seed + 7 }); penLine(g, body.slice(Math.floor(body.length * 0.5)), { w: 2, alpha: 0.85, seed: seed + 8 });
  const handle = [[x - 20, y - 46], [x - 6, y - 70], [x + 22, y - 72], [x + 34, y - 46]];
  g.save(); g.strokeStyle = col; g.lineWidth = 6; g.lineCap = 'round'; path(g, smooth(handle, false, 6), false); g.stroke(); g.restore();
  ink(g, handle, { width: 1.2, alpha: 0.75 });
  for (let i = 0; i < 4; i++) grassFlicks(g, x + r.range(-60, 50), y + 2, 12, { seed: seed + 20 + i, n: 4, colors: [m.lawn[3]], inkA: 0.3 });
}
// the flower beds at the foot of the wall: parched earth, lavender, flopping daisies, marigolds
function paintBeds(g, m, seed = 160) {
  const r = rng(seed);
  for (const [x0, x1] of [[540, 1050], [1260, 2080]]) {
    const yA = (x) => WALL.y0 + (WALL.y1 - WALL.y0) * (x - WALL.x0) / (WALL.x1 - WALL.x0);
    const bed = smooth([[x0, yA(x0) - 4], [x1, yA(x1) - 4], [x1, yA(x1) + 36], [(x0 + x1) / 2, yA((x0 + x1) / 2) + 44], [x0 + 20, yA(x0) + 34]]);
    brushWash(g, bed, m.earth, { seed: seed + x0, count: 40, width: [6, 18], len: [20, 80], alpha: [0.2, 0.4], base: 0.6, under: true });
    g.save(); path(g, bed); g.clip(); for (let q = 0; q < 26; q++) { const cx0 = r.range(x0, x1), cy0 = yA(cx0) + r.range(4, 36); ink(g, [[cx0, cy0], [cx0 + r.range(-12, 12), cy0 + r.range(-2, 2)], [cx0 + r.range(-22, 22), cy0 + r.range(-3, 3)]], { width: 0.7, alpha: 0.4, seed: seed + q }); } g.restore();
    ink(g, bed.slice(Math.floor(bed.length * 0.3)), { width: 1, alpha: 0.4, gaps: 1.4, seed: seed + x0 + 1 });
    for (let x = x0 + 20; x < x1 - 10; x += r.range(34, 60)) {
      const y = yA(x) + r.range(14, 30), kind = r() < 0.4 ? 'lavender' : r() < 0.55 ? 'daisy' : 'marigold';
      if (Math.abs(x - PITCHER.x) < 90) continue;
      if (kind === 'lavender') {
        const sh = fluffy(x, y - 14, 26, 16, 8, 0.25, seed + x);
        wash(g, sh, { color: mix(m.leaf[2], '#a8b0a0', 0.5), opacity: 0.9, seed: seed + x + 2, layers: 10 });
        for (let k = 0; k < 14; k++) { const sx = x + r.range(-22, 22), lean = r.gauss(0, 0.25) + (sx - x) * 0.01, L = r.range(26, 44);
          ink(g, [[sx, y - 18], [sx + lean * L * 0.5, y - 18 - L * 0.5], [sx + lean * L, y - 18 - L]], { color: shade(m.leaf[1], 0.2), width: 0.8, alpha: 0.6 });
          g.fillStyle = rgba(r() < 0.5 ? '#9a88b8' : '#b0a0c4', 0.75); g.beginPath(); g.ellipse(sx + lean * L, y - 18 - L, 2.4, 6, lean, 0, TAU); g.fill(); }
      } else if (kind === 'daisy') {
        for (let k = 0; k < 7; k++) { const sx = x + r.range(-18, 18), L = r.range(30, 50), bend = r.range(0.5, 1.2) * (r() < 0.5 ? -1 : 1);
          const tip = [sx + bend * L * 0.45, y - L * 0.7], mid = [sx + bend * 4, y - L * 0.7];
          g.strokeStyle = rgba(m.leaf[1], 0.85); g.lineWidth = 1.4; g.beginPath(); g.moveTo(sx, y); g.quadraticCurveTo(mid[0], mid[1] - 8, tip[0], tip[1]); g.stroke();
          g.save(); g.translate(tip[0], tip[1] + 3); g.rotate(bend * 0.9);
          for (let q = 0; q < 9; q++) { const a = Math.PI * 0.1 + q / 8 * Math.PI * 0.8; g.fillStyle = 'rgba(250,246,234,0.92)'; g.beginPath(); g.ellipse(Math.cos(a) * 5, Math.sin(a) * 5, 4.5, 1.4, a, 0, TAU); g.fill(); }
          g.fillStyle = '#d8a030'; g.beginPath(); g.ellipse(0, 0, 3.4, 2.2, 0, 0, TAU); g.fill(); g.restore(); }
      } else {
        const sh = fluffy(x, y - 10, 18, 11, 7, 0.3, seed + x + 5);
        wash(g, sh, { color: m.leaf[k3(x)], opacity: 0.88, seed: seed + x + 6, layers: 8 });
        for (let k = 0; k < 4; k++) { g.fillStyle = rgba(k % 2 ? '#e09030' : '#d87828', 0.9); g.beginPath(); g.arc(x + r.range(-14, 14), y - 14 - r.range(0, 8), 4.5, 0, TAU); g.fill(); g.fillStyle = 'rgba(120,60,20,0.6)'; g.beginPath(); g.arc(x + r.range(-14, 14), y - 14 - r.range(0, 8), 1.2, 0, TAU); g.fill(); }
      }
    }
  }
}
const k3 = (x) => Math.abs(Math.round(x)) % 3;
// a big bush (elder, gone dusty) at the far left, behind and beside the cottage
function paintBush(g, m) {
  for (const [i, [x, y, rr]] of [[60, 520, 100], [-40, 470, 110], [130, 440, 80], [-60, 600, 90], [40, 610, 80]].entries()) leafClump(g, x, y, rr, 500 + i * 7, m.leaf);
}

// ---------------------------------------------------------------- tall flowers (live: they sway a little)
function paintHollyhock(g, x, y, hgt, m, seed, cols) {
  const r = rng(seed);
  // the stalk: up, then the top bowing over in the heat
  const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12, bow = Math.max(0, t - 0.65) / 0.35; pts.push([x + Math.sin(t * 2) * 4 + bow * bow * 34, y - t * hgt + bow * bow * 30]); }
  g.save(); g.strokeStyle = rgba(shade(m.leaf[1], 0.15), 0.9); g.lineWidth = 3.4; g.lineCap = 'round'; path(g, smooth(pts, false, 4), false); g.stroke(); g.restore();
  ink(g, pts, { width: 1, alpha: 0.5, seed: seed + 1 });
  // limp, rounded leaves low down
  for (let k = 0; k < 5; k++) { const t = 0.08 + k * 0.1, [px, py] = pts[Math.round(t * 12)], sd = k % 2 ? 1 : -1, L = 34 - k * 3;
    const lf = smooth([[px, py], [px + sd * L * 0.5, py - L * 0.2], [px + sd * L * 1.05, py + L * 0.2], [px + sd * L * 0.95, py + L * 0.7], [px + sd * L * 0.4, py + L * 0.55]]);
    wash(g, lf, { color: m.leaf[k % 4], opacity: 0.92, seed: seed + 10 + k, under: '#e8dcc0', layers: 10 });
    glaze(g, lf, px + sd * L * 0.8, py + L * 0.5, L * 0.3, L * 0.2, '#b89048', 0.6); // dry, browning edge
    ink(g, lf, { closed: true, width: 0.9, alpha: 0.55, gaps: 0.6, seed: seed + 20 + k }); ink(g, [[px, py], [px + sd * L * 0.8, py + L * 0.35]], { width: 0.6, alpha: 0.4 }); }
  // flowers up the stalk: open cups below, buds at the bowed tip, a few going brown
  for (let k = 0; k < 14; k++) {
    const t = 0.36 + k * 0.042, i = Math.min(12, Math.round(t * 12)), [px, py] = pts[i], sd = k % 2 ? 1 : -1;
    const fx = px + sd * 7, fy = py + r.range(-4, 4), R = (k < 10 ? 13 : 7) * r.range(0.85, 1.1), c = r() < 0.15 ? '#b0886a' : cols[k % cols.length];
    if (k >= 10) { g.fillStyle = rgba(mix(c, m.leaf[0], 0.5), 0.9); g.beginPath(); g.ellipse(fx, fy, R * 0.6, R, 0.3 * sd, 0, TAU); g.fill(); ink(g, ellipse(fx, fy, R * 0.6, R, 14, 0.3 * sd), { closed: true, width: 0.7, alpha: 0.5 }); continue; }
    const cup = []; for (let q = 0; q < 10; q++) { const a = q / 10 * TAU; cup.push([fx + Math.cos(a) * R * (0.9 + 0.12 * Math.sin(a * 5)), fy + Math.sin(a) * R * 0.85 * (0.9 + 0.12 * Math.sin(a * 5))]); }
    const cs = smooth(cup);
    wash(g, cs, { color: c, opacity: 0.95, seed: seed + 40 + k, under: '#f4e8dc', layers: 8, edge: 0.4 });
    pool(g, fx, fy, R * 0.5, R * 0.45, shade(c, 0.35), 0.6);
    g.fillStyle = 'rgba(250,236,170,0.9)'; g.beginPath(); g.arc(fx, fy, R * 0.16, 0, TAU); g.fill();
    for (let q = 0; q < 5; q++) { const a = q / 5 * TAU + 0.3; ink(g, [[fx + Math.cos(a) * R * 0.25, fy + Math.sin(a) * R * 0.22], [fx + Math.cos(a) * R * 0.8, fy + Math.sin(a) * R * 0.7]], { width: 0.6, alpha: 0.35 }); }
    ink(g, cs, { closed: true, width: 0.9, alpha: 0.55, gaps: 0.5, seed: seed + 60 + k });
  }
}
function paintSunflower(g, x, y, hgt, m, seed, face = -1) {
  const r = rng(seed);
  // a tall stalk whose neck bends right over, so the heavy head hangs down, facing the ground
  const top = [x + face * 6, y - hgt], neck = [x + face * 40, y - hgt + 10], head = [x + face * 46, y - hgt + 32];
  const stalk = [[x, y], [x + face * 2, y - hgt * 0.4], [x - face * 2, y - hgt * 0.8], top, neck];
  g.save(); g.strokeStyle = rgba(shade(m.leaf[0], 0.1), 0.95); g.lineWidth = 5; g.lineCap = 'round'; path(g, smooth(stalk, false, 6), false); g.stroke();
  g.strokeStyle = rgba(tint(m.leaf[2], 0.3), 0.5); g.lineWidth = 1.6; path(g, smooth(stalk.map(([a, b]) => [a - 1.4, b]), false, 6), false); g.stroke(); g.restore();
  ink(g, stalk, { width: 1, alpha: 0.6, seed: seed + 1 });
  // big heart-shaped leaves hanging limp from the stalk
  for (let k = 0; k < 6; k++) { const t = 0.15 + k * 0.12, py = y - hgt * t, px = x + Math.sin(t * 5) * 2, sd = k % 2 ? 1 : -1, L = 46 - k * 4;
    const lf = smooth([[px, py], [px + sd * L * 0.35, py - L * 0.1], [px + sd * L * 0.75, py + L * 0.25], [px + sd * L * 0.7, py + L * 0.85], [px + sd * L * 0.5, py + L * 1.05], [px + sd * L * 0.25, py + L * 0.6]]);
    wash(g, lf, { color: m.leaf[(k + 1) % 4], opacity: 0.93, seed: seed + 10 + k, under: '#e8dcc0', layers: 10 });
    shadeEdge(g, lf, { color: shade(m.leaf[1], 0.4), alpha: 0.4, width: L * 0.25, dx: -sd * L * 0.08, dy: -L * 0.05 });
    glaze(g, lf, px + sd * L * 0.55, py + L * 0.95, L * 0.22, L * 0.15, '#b88a40', 0.7);
    ink(g, lf, { closed: true, width: 0.9, alpha: 0.6, gaps: 0.5, seed: seed + 20 + k }); ink(g, [[px, py], [px + sd * L * 0.5, py + L * 0.5], [px + sd * L * 0.5, py + L * 0.95]], { width: 0.6, alpha: 0.4 }); }
  // the nodding head: its face turned down to the ground and a little toward us, so we see the green back on
  // top, the dark seed face as a narrow ellipse beneath, and the ring of petals all round it, wilting
  const [hx, hy] = head, R = 32;
  g.save(); g.translate(hx, hy); g.rotate(-face * 0.32);
  const fy = 9, fry = 0.36; // the face's centre below the back, and how edge-on it is
  const petal = (a, front) => {
    const ex = Math.cos(a), ey = Math.sin(a);
    const bx = ex * R * 0.72, by = fy + ey * R * 0.72 * fry;
    let dx = ex, dy = ey * fry + 0.55 + (front ? 0.25 : 0.05); const d = Math.hypot(dx, dy); dx /= d; dy /= d; // petals hang down a little
    const Lp = R * r.range(0.55, 0.78) * (front ? 1 : 0.9), wp = R * 0.13;
    const c = r() < 0.16 ? '#b88038' : front ? (r() < 0.5 ? '#f0c040' : '#e8b030') : '#d09a30';
    const tx = bx + dx * Lp + r.gauss(0, 1.5), ty = by + dy * Lp + (front ? Lp * 0.18 : 0);
    g.fillStyle = rgba(c, 0.96); g.beginPath(); g.moveTo(bx - dy * wp, by + dx * wp);
    g.quadraticCurveTo((bx + tx) / 2 - dy * wp * 1.3, (by + ty) / 2 + dx * wp * 1.3, tx, ty);
    g.quadraticCurveTo((bx + tx) / 2 + dy * wp * 1.3, (by + ty) / 2 - dx * wp * 1.3, bx + dy * wp, by - dx * wp); g.closePath(); g.fill();
    g.strokeStyle = rgba('#7a4a14', 0.5); g.lineWidth = 0.7; g.stroke();
  };
  for (let k = 0; k < 13; k++) petal(Math.PI + (k + 0.5) / 13 * Math.PI, false);         // the far petals, behind the face
  const back = smooth([[-R * 0.95, fy - 2], [-R * 0.8, -R * 0.38], [-R * 0.3, -R * 0.62], [R * 0.3, -R * 0.62], [R * 0.8, -R * 0.38], [R * 0.95, fy - 2], [0, fy + R * 0.2]]);
  wash(g, back, { color: m.leaf[1], opacity: 0.96, seed: seed + 30, under: '#e8dcc0', layers: 10 });
  glaze(g, back, -R * 0.3, -R * 0.35, R * 0.4, R * 0.18, tint(m.leaf[2], 0.4), 0.6);
  for (let k = 0; k < 9; k++) { const a = Math.PI + 0.25 + k / 8 * (Math.PI - 0.5), sx = Math.cos(a) * R * 0.86, sy = fy - 2 + Math.sin(a) * R * 0.3; g.fillStyle = rgba(shade(m.leaf[1], 0.15), 0.9); g.beginPath(); g.moveTo(sx - 4, sy); g.lineTo(sx + Math.cos(a) * 9, sy + Math.sin(a) * 5 - 3); g.lineTo(sx + 4, sy); g.fill(); } // sepals
  ink(g, back.slice(0, Math.floor(back.length * 0.72)), { width: 1, alpha: 0.6, gaps: 0.5, seed: seed + 33 });
  const face0 = ellipse(0, fy, R * 0.74, R * 0.74 * fry, 30);
  wash(g, face0, { color: '#5a3a1e', opacity: 0.97, seed: seed + 31, under: true, layers: 8 });
  for (let k = 0; k < 34; k++) { const a = r() * TAU, d = Math.sqrt(r()) * 0.9; g.fillStyle = rgba(r() < 0.5 ? '#2a1a10' : '#9a7038', 0.7); g.beginPath(); g.arc(Math.cos(a) * R * 0.74 * d, fy + Math.sin(a) * R * 0.74 * fry * d, 1.1, 0, TAU); g.fill(); }
  ink(g, face0, { closed: true, width: 1, alpha: 0.7, seed: seed + 32 });
  for (let k = 0; k < 13; k++) petal((k + 0.5) / 13 * Math.PI, true);                     // the near petals, hanging in front
  g.restore();
}
// the tall flowers along the wall and by the cottage: [kind, x, y (foot), height, seed, extra]
const TALL = [['holly', 470, 668, 300, 601, ['#e098a8', '#d0788a', '#f2c8c8']], ['holly', 600, 712, 330, 602, ['#f2e0cc', '#e8c8b4', '#f6ece0']], ['holly', 668, 716, 280, 603, ['#c85a78', '#b04a68', '#d8708a']],
  ['sun', 1318, 716, 300, 611, -1], ['sun', 1398, 718, 340, 612, 1], ['sun', 1490, 720, 290, 613, -1], ['holly', 1960, 726, 320, 604, ['#e8a0b0', '#f2d0d0', '#d88898']]];
const TSPR = {};
function tallSprites(mood) {
  const m = MD(mood);
  if (TSPR[m.name]) return TSPR[m.name];
  return (TSPR[m.name] = TALL.map(([kind, x, y, hgt, seed, ex], i) => {
    const box = { x0: x - 110, y0: y - hgt - 30, x1: x + 110, y1: y + 10, w: 220, h: hgt + 40 };
    const s = sprite(box, 2, (g) => kind === 'holly' ? paintHollyhock(g, x, y, hgt, m, seed, ex) : paintSunflower(g, x, y, hgt, m, seed, ex), { seed: seed, grain: 0.2 });
    if (m.name !== 'hot') moodGlaze(s.c, m, 2, seed);
    return { s, x, y, hgt, ph: i * 1.7 };
  }));
}
// the hollyhocks and sunflowers: drawn after the garden's back layer, before the pitcher. sway: extra lean (radians)
export function drawGardenFlowers(g, t, mood = 'hot', sway = 0) {
  for (const f of tallSprites(mood)) {
    const a = Math.sin(t * 0.42 + f.ph) * 0.006 + Math.sin(t * 1.07 + f.ph * 2.3) * 0.0025 + sway;
    g.save(); g.translate(f.x, f.y); g.rotate(a); g.translate(-f.x, -f.y); drawSprite(g, f.s); g.restore();
  }
}

// ---------------------------------------------------------------- the foreground (front layer)
function limpLeaf(g, x, y, ang, L, w, col, seed, m) {
  const ca = Math.cos(ang), sa = Math.sin(ang), px = -sa, py = ca;
  const P = (d, o) => { const dr = d * d / L * 0.55; return [x + ca * d + px * o, y + sa * d + py * o + dr]; };
  const lf = smooth([P(0, 0), P(L * 0.25, -w * 0.45), P(L * 0.55, -w * 0.5), P(L * 0.85, -w * 0.25), P(L, 0), P(L * 0.8, w * 0.3), P(L * 0.5, w * 0.5), P(L * 0.2, w * 0.4)]);
  wash(g, lf, { color: col, opacity: 0.95, seed, under: '#e6dac0', layers: 14, bleed: 0.02 });
  shadeEdge(g, lf, { edge: smooth([P(0, 0), P(L * 0.5, 0), P(L, 0)], false), color: shade(col, 0.45), alpha: 0.4, width: w * 0.4, dy: w * 0.15 });
  glaze(g, lf, ...P(L * 0.9, w * 0.2), L * 0.18, w * 0.4, '#b88a40', 0.65);
  g.save(); g.strokeStyle = rgba(tint(col, 0.5), 0.6); g.lineWidth = 1.2; g.beginPath(); smooth([P(L * 0.02, 0), P(L * 0.5, 0), P(L * 0.95, 0)], false).forEach((p, i) => i ? g.lineTo(...p) : g.moveTo(...p)); g.stroke(); g.restore();
  penLine(g, lf, { closed: true, w: 1.5, alpha: 0.7, seed: seed + 1 });
}
function paintFront(g, m, seed = 700) {
  const r = rng(seed);
  // bottom left: a clump of foxgloves, their tips bowed in the heat, among big limp leaves and seed grasses
  pool(g, 200, 1040, 280, 46, m.shadow, 0.3);
  for (let i = 0; i < 22; i++) { const x = r.range(-90, 330), y = r.range(1010, 1110); grassFlicks(g, x, y, r.range(40, 90), { seed: seed + i, n: 6, colors: [m.lawn[3], m.lawn[0], shade(m.lawn[1], 0.2)], inkA: 0.45, lean: 0.15 }); }
  for (let k = 0; k < 7; k++) { const x = r.range(230, 340), L = r.range(140, 230), lean = r.range(0.05, 0.3), tip = [x + lean * L, 1050 - L];
    ink(g, [[x, 1060], [x + lean * L * 0.4, 1060 - L * 0.5], tip], { color: shade(m.lawn[3], 0.3), width: 1.2, alpha: 0.7 });
    for (let q = 0; q < 6; q++) { g.fillStyle = rgba(r() < 0.5 ? '#c8a868' : '#b8945a', 0.85); g.beginPath(); g.ellipse(tip[0] - lean * q * 4, tip[1] + q * 5, 2.4, 5, lean - 0.2 + (q % 2) * 0.4, 0, TAU); g.fill(); } }
  for (const [fx, fy, H, lean, cols] of [[180, 1012, 260, -0.16, ['#c86a9a', '#d888b0', '#b85888']], [246, 1020, 210, 0.16, ['#e0a0c0', '#d080a8', '#ecc0d4']], [126, 1016, 170, -0.25, ['#c86a9a', '#d888b0']]]) {
    // the stem rises, its top bowing over; bells hang along one side, biggest at the bottom, buds at the tip
    const pts = []; for (let k = 0; k <= 12; k++) { const t = k / 12, bow = Math.max(0, t - 0.6) / 0.4; pts.push([fx + lean * H * t + Math.sign(lean || 1) * bow * bow * 30, fy - H * t + bow * bow * 26]); }
    g.save(); g.strokeStyle = rgba(shade(m.leaf[1], 0.1), 0.95); g.lineWidth = 3.4; g.lineCap = 'round'; path(g, smooth(pts, false, 4), false); g.stroke(); g.restore();
    ink(g, pts, { width: 0.9, alpha: 0.55 });
    for (let k = 2; k <= 12; k++) { const [x, y] = pts[k], t = k / 12, R = (1 - t) * 10 + 4, c = cols[k % cols.length], side = Math.sign(lean || 1);
      if (t > 0.85) { g.fillStyle = rgba(mix(c, m.leaf[2], 0.4), 0.95); g.beginPath(); g.ellipse(x + side * 3, y + 2, 2.6, 4, 0.3, 0, TAU); g.fill(); continue; }
      const bx = x + side * R * 0.7, by = y + R * 0.5, bell = smooth([[bx - R * 0.45, by - R * 0.6], [bx + R * 0.45, by - R * 0.6], [bx + R * 0.7, by + R * 0.7], [bx, by + R * 0.9], [bx - R * 0.7, by + R * 0.7]]);
      wash(g, bell, { color: c, opacity: 0.96, seed: seed + 900 + k + Math.round(fx), under: '#f4e6ec', layers: 8, edge: 0.4 });
      g.fillStyle = rgba(shade(c, 0.45), 0.8); g.beginPath(); g.ellipse(bx, by + R * 0.62, R * 0.5, R * 0.22, 0, 0, TAU); g.fill();
      for (let q = 0; q < 3; q++) { g.fillStyle = 'rgba(250,240,245,0.85)'; g.beginPath(); g.arc(bx + (q - 1) * R * 0.22, by + R * 0.4, R * 0.08, 0, TAU); g.fill(); }
      ink(g, bell, { closed: true, width: 0.8, alpha: 0.6, gaps: 0.4, seed: seed + 950 + k }); }
  }
  for (const [i, [x, y, a, L]] of [[150, 1018, -2.75, 160], [170, 1022, -2.3, 180], [200, 1026, -1.85, 150], [210, 1026, -1.2, 170], [240, 1028, -0.75, 180], [260, 1030, -0.35, 150], [120, 1024, -3.0, 130]].entries())
    limpLeaf(g, x, y, a, L, L * 0.6, m.leaf[i % 4], seed + 50 + i * 7, m);
  // bottom right: an old pot of geraniums gone limp, and long dry grass
  pool(g, 1770, 1022, 200, 34, m.shadow, 0.35);
  for (let i = 0; i < 26; i++) { const x = r.range(1640, 2010), y = r.range(1010, 1130); grassFlicks(g, x, y, r.range(40, 100), { seed: seed + 200 + i, n: 6, colors: [m.lawn[3], m.lawn[0], shade(m.lawn[1], 0.2)], inkA: 0.45, lean: -0.15 }); }
  const px = 1764, py = 1012;
  const pot = smooth([[px - 74, py - 120], [px + 74, py - 120], [px + 60, py + 10], [px - 60, py + 10]]);
  for (let k = 0; k < 9; k++) { const a = -Math.PI / 2 + (k - 4) * 0.36, L = r.range(60, 90); limpLeaf(g, px + (k - 4) * 9, py - 128, a + (k - 4) * 0.12, L, L * 0.75, m.leaf[k % 4], seed + 300 + k * 5, m); }
  for (let k = 0; k < 5; k++) { const fx = px - 40 + k * 22 + r.gauss(0, 5), fy = py - 196 + Math.abs(k - 2) * 18; ink(g, [[px - 10 + k * 5, py - 124], [fx, fy - 10], [fx + 6, fy]], { color: shade(m.leaf[0], 0.2), width: 1.6, alpha: 0.8 });
    for (let q = 0; q < 6; q++) { g.fillStyle = rgba(q % 2 ? '#c85a50' : '#d87068', 0.9); g.beginPath(); g.arc(fx + 6 + r.gauss(0, 6), fy + 4 + r.gauss(0, 5), 5.5, 0, TAU); g.fill(); } }
  wash(g, pot, { color: m.clay, opacity: 0.97, seed: seed + 400, under: true, bleed: 0.008 });
  shadeEdge(g, pot, { color: m.clayDark, alpha: 0.5, width: 40, dx: -14, dy: 0 });
  glaze(g, pot, px - 30, py - 70, 26, 50, m.clayLight, 0.5);
  const rimP = smooth([[px - 82, py - 140], [px + 82, py - 140], [px + 80, py - 116], [px - 80, py - 116]]);
  wash(g, rimP, { color: tint(m.clay, 0.1), opacity: 0.97, seed: seed + 401, under: true, bleed: 0.008 });
  penLine(g, rimP, { closed: true, w: 2, alpha: 0.8 }); penLine(g, pot.slice(Math.floor(pot.length * 0.25)), { w: 2.2, alpha: 0.85 });
  // a few long grass blades standing in front of it all
  for (let i = 0; i < 12; i++) { const x = r.range(1600, 2010); grassFlicks(g, x, 1130, r.range(60, 130), { seed: seed + 500 + i, n: 4, colors: [m.lawn[0], m.lawn[3]], inkA: 0.5, lean: -0.1 }); }
}

// ---------------------------------------------------------------- the garden set
// Builds the painted garden for a mood at 2x: { back, front, mood }. back: sky, distance, elm with nest, wall,
// cottage, lawn, path, beds, bird bath, watering can (everything that never moves). front: foreground plants.
// Draw back, then drawGardenFlowers, the pitcher, pebbles and the crow, then front.
const LAYERS = {};
export function gardenLayers(mood = 'hot') {
  const m = MD(mood);
  if (LAYERS[m.name]) return LAYERS[m.name];
  const res = 2;
  const back = tm('sky', () => hlayer((g) => paintSky(g, m, { hz: 470, seed: 5 }), res));
  let ck;
  const land = hlayer((g) => {
    tm('distance', () => paintDistance(g, m));
    tm('elm', () => elmTree(g, m));
    tm('lawn', () => paintLawn(g, m));
    tm('bush', () => paintBush(g, m));
    tm('wall', () => gardenWall(g, m));
    tm('beds', () => paintBeds(g, m));
    tm('path', () => paintPath(g, m));
    tm('flags', () => paintFlags(g, m));
    castShadow(g, COTTAGE.x + 40, COTTAGE.ground + 4, 230, 200, m, { seed: 77, len: m.name === 'sunset' ? 1.6 : 1, alpha: m.name === 'hot' ? 0.5 : 0.8 });
    ck = tm('cottage', () => stoneCottage(g, COTTAGE.x, COTTAGE.ground, COTTAGE.S, m, { seed: 3 }));
    tm('props', () => { paintBirdBath(g, m); paintWateringCan(g, m); drawNestFront(g, 'hot'); });
  }, res);
  tm('glaze', () => moodGlaze(land, m, res, 9, { k: m.name === 'night' ? 1 : 1 }));
  // where the sky shows (for stars and the moon at night)
  const skyMask = canvas(LW, LH, false);
  { const sg = skyMask.getContext('2d'); sg.fillStyle = '#fff'; sg.fillRect(0, 0, LW, LH); sg.globalCompositeOperation = 'destination-out'; sg.drawImage(land, 0, 0, LW, LH); }
  const bg = back.getContext('2d');
  bg.save(); bg.setTransform(1, 0, 0, 1, 0, 0); bg.drawImage(land, 0, 0); bg.restore();
  if (m.name === 'night') { bg.save(); bg.setTransform(res, 0, 0, res, M * res, MY * res); moonlight(bg, ck); paintLitWindow(bg, ck.window); bg.restore(); }
  bg.save(); bg.setTransform(1, 0, 0, 1, 0, 0); tm('granulate', () => granulate(bg, back.width, back.height, 0.2, 5)); bg.restore();
  const front = tm('front', () => hlayer((g) => paintFront(g, m), res));
  moodGlaze(front, m, res, 13);
  { const fg = front.getContext('2d'); fg.save(); fg.setTransform(1, 0, 0, 1, 0, 0); granulate(fg, front.width, front.height, 0.2, 6); fg.restore(); }
  return (LAYERS[m.name] = { back: to8(back), front: to8(front), skyMask, mood: m.name, window: ck.window });
}

// ---------------------------------------------------------------- close-up: looking down into the mouth
// Page layout of the close-up: the rim fills the frame; the water is a disc far down the dark neck.
export const CLOSEUP = { cx: 960, cy: 438, orx: 800, ory: 318, irx: 652, iry: 250, icy: 446, DY: 215, shrink: 0.7 };
// the water's surface ellipse at depth d (0 = at the brim, 1 = the little that is left at the bottom)
function waterEllipse(d) { const { cx, icy, irx, iry, DY, shrink } = CLOSEUP, k = 1 - shrink * d; return { x: cx + d * 12, y: icy + d * DY, rx: irx * k, ry: iry * k }; }
// a hand-thrown ellipse: the radius wanders a little, so the pot never looks machine-made
function potEllipse(cx, cy, rx, ry, seed, amp = 0.012, n = 120) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = i / n * TAU, k = 1 + amp * (noise1(a * 1.6 + seed, seed) - 0.5) * 2 + amp * 0.5 * Math.sin(a * 3 + seed); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  return pts;
}
// a layer-sized canvas painted at `res`, drawn back at page size with drawL
function layer2(fn, res = 1) { const c = canvas(LW * res, LH * res), g = c.getContext('2d'); g.scale(res, res); g.translate(M, MY); fn(g); return c; }
const drawL = (g, img) => g.drawImage(img, -M, -MY, LW, LH);
const CUS = {};
function closeupSprites(mood) {
  const m = MD(mood);
  if (CUS[m.name]) return CUS[m.name];
  const { cx, cy, orx, ory, irx, iry, icy } = CLOSEUP, r = rng(171);
  const innerE = potEllipse(cx, icy, irx, iry, 3), outerE = potEllipse(cx, cy, orx, ory, 5);
  const dark = '#100907';
  // the inside of the neck: a tunnel of rings from the lip down into the dark
  const inner = to8(layer2((g) => {
    g.save(); path(g, innerE); g.clip();
    g.fillStyle = dark; g.fillRect(cx - irx - 20, icy - iry - 20, irx * 2 + 40, iry * 2 + 40);
    const n = 80;
    for (let i = 0; i <= n; i++) {
      const d = i / n * 1.15, e = waterEllipse(d), k = Math.pow(1 - Math.min(1, d), 2.4);
      g.fillStyle = mix(dark, mix(m.clayDark, m.clay, 0.3), k); g.beginPath(); g.ellipse(e.x + Math.sin(d * 3) * 5, e.y, e.rx, e.ry, 0, 0, TAU); g.fill();
    }
    // the inner face of the lip, just under the rim on the far side, catches the light
    const lipIn = waterEllipse(0.07);
    g.save(); g.beginPath(); g.ellipse(cx, icy, irx, iry, 0, 0, TAU); g.ellipse(lipIn.x, lipIn.y, lipIn.rx, lipIn.ry, 0, 0, TAU); g.clip('evenodd');
    const lg = g.createLinearGradient(cx - irx, 0, cx + irx, 0); lg.addColorStop(0, rgba(m.clay, 0.5)); lg.addColorStop(0.6, rgba(m.clayLight, 0.85)); lg.addColorStop(1, rgba(m.clay, 0.6));
    g.fillStyle = lg; g.fillRect(cx - irx, icy - iry, irx * 2, iry * 2); g.restore();
    // brush strokes running down the far wall into the depths, and the potter's throwing rings
    g.lineCap = 'round';
    for (let i = 0; i < 300; i++) {
      const a = Math.PI + r.range(0.05, 0.95) * Math.PI, d0 = Math.pow(r(), 1.5) * 0.7, e0 = waterEllipse(d0), e1 = waterEllipse(Math.min(1.05, d0 + r.range(0.08, 0.28)));
      const x0 = e0.x + Math.cos(a) * e0.rx * 0.99, y0 = e0.y + Math.sin(a) * e0.ry * 0.99, x1 = e1.x + Math.cos(a) * e1.rx, y1 = e1.y + Math.sin(a) * e1.ry;
      g.strokeStyle = rgba(r.pick([m.clay, m.clayDark, '#4a2618', m.clayLight]), r.range(0.06, 0.2) * Math.pow(1 - d0, 2)); g.lineWidth = r.range(4, 16) * (1 - d0 * 0.6);
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    }
    for (let i = 1; i < 16; i++) { const d = Math.pow(i / 16, 1.3) * 0.9, e = waterEllipse(d), pts = [];
      for (let q = 0; q <= 40; q++) { const a = Math.PI + 0.12 + q / 40 * (Math.PI - 0.24); pts.push([e.x + Math.cos(a) * e.rx, e.y + Math.sin(a) * e.ry]); }
      ink(g, pts, { color: d < 0.3 ? '#6a3420' : '#1a0e0a', width: 1 + (1 - d) * 1.6, alpha: 0.4 * (1 - d * 0.5), gaps: 0.8, wobble: 0.6, seed: 180 + i }); }
    // sunlight falling into the mouth lights a crescent of the far wall, high up on the right
    g.save(); g.globalCompositeOperation = m.name === 'night' ? 'source-over' : 'screen';
    pool(g, cx + irx * 0.32, icy - iry * 0.62, irx * 0.6, iry * 0.3, m.name === 'night' ? '#4a5a80' : '#e88a58', m.name === 'night' ? 0.25 : 0.5);
    g.restore();
    // the near rim's shadow falls across the depths
    g.filter = 'blur(26px)'; g.fillStyle = 'rgba(8,4,3,0.6)'; g.beginPath(); g.ellipse(cx - 50, icy + iry * 0.78, irx * 0.98, iry * 0.55, -0.04, 0, TAU); g.fill(); g.filter = 'none';
    g.restore();
    granulate(g, g.canvas.width, g.canvas.height, 0.2, 172);
  }));
  // the rim, the lip, the pitcher's shoulder curving away below, and the garden far down beyond it
  const rim = layer2((g) => {
    // the ground far below, out of focus: gravel, a flagstone, the edge of a flower bed, the pitcher's own shadow
    const gr = layer2((h) => {
      brushWash(h, [[-M, -MY], [W + M, -MY], [W + M, H + MY], [-M, H + MY]], m.gravel.concat([m.lawn[0]]), { seed: 173, count: 90, width: [30, 90], len: [80, 300], alpha: [0.2, 0.4], base: 0.75, under: true });
      for (const [x, y, w, hh] of [[260, 40, 420, 120], [1500, 20, 380, 110], [-40, 520, 300, 140]]) wash(h, ellipse(x, y, w / 2, hh / 2, 20), { color: m.stone[1], opacity: 0.9, seed: 176 + x, layers: 10 });
      for (const [x, y, rr] of [[1780, 300, 160], [1900, 120, 120], [80, 260, 140]]) { const sh = fluffy(x, y, rr, rr * 0.7, 9, 0.25, 177 + x); wash(h, sh, { color: m.leaf[x % 3], opacity: 0.95, seed: 178 + x, layers: 12 }); for (let q = 0; q < 6; q++) { h.fillStyle = rgba(q % 2 ? '#9a88b8' : '#f2ece0', 0.9); h.beginPath(); h.arc(x + r.range(-rr, rr) * 0.6, y + r.range(-rr, rr) * 0.4, 10, 0, TAU); h.fill(); } }
      for (let i = 0; i < 140; i++) { const x = r.range(-M, W + M), y = r.range(-MY, H + MY), s = r.range(5, 16); h.fillStyle = rgba(r.pick(m.stone), 0.85); h.beginPath(); h.ellipse(x, y, s * 1.4, s, r() * 3, 0, TAU); h.fill(); h.fillStyle = 'rgba(255,250,240,0.45)'; h.beginPath(); h.ellipse(x - s * 0.3, y - s * 0.3, s * 0.6, s * 0.3, 0, 0, TAU); h.fill(); }
      pool(h, cx + 260, 220, 900, 260, m.shadow, 0.55);
    }, 0.5);
    g.save(); g.filter = 'blur(7px)'; g.drawImage(gr, -M, -MY, LW, LH); g.restore();
    // the shoulder: a broad dome of clay below the neck, falling away into shade, with its cream slip bands
    const SC = [cx + 20, 1010, 1260, 570];
    const sh = potEllipse(SC[0], SC[1], SC[2], SC[3], 7, 0.006);
    wash(g, sh, { color: m.clay, opacity: 0.97, seed: 174, under: '#f0e0cc', bleed: 0.004, layers: 16 });
    g.save(); path(g, sh); g.clip();
    const lg = g.createLinearGradient(-M, 0, W + M, 0); lg.addColorStop(0, rgba(m.clayLight, 0.35)); lg.addColorStop(0.3, rgba(m.clayLight, 0.4)); lg.addColorStop(0.55, rgba(m.clay, 0)); lg.addColorStop(0.85, rgba(m.clayDark, 0.5)); lg.addColorStop(1, rgba(m.clayDark, 0.7));
    g.fillStyle = lg; g.fillRect(-M, 300, LW, LH);
    const vg = g.createLinearGradient(0, 700, 0, H + MY); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, rgba(m.clayDark, 0.4)); g.fillStyle = vg; g.fillRect(-M, 700, LW, LH);
    g.lineCap = 'round';
    for (let i = 0; i < 110; i++) { const k = r.range(0.55, 1.02), a0 = Math.PI + r.range(-0.1, 1.1) * Math.PI, a1 = a0 + r.range(0.08, 0.3);
      g.strokeStyle = rgba(r.pick([m.clayLight, m.clayDark, '#d8885a', '#a85030']), r.range(0.08, 0.22)); g.lineWidth = r.range(6, 24);
      g.beginPath(); g.ellipse(SC[0], SC[1], SC[2] * k, SC[3] * k, 0, a0, a1); g.stroke(); }
    for (const [k, w0, al] of [[0.86, 6, 0.75], [0.8, 4, 0.6]]) ink(g, potEllipse(SC[0], SC[1], SC[2] * k, SC[3] * k, 9 + k * 10, 0.004, 160).slice(80, 160), { color: m.slip, width: w0, alpha: al, wobble: 0.4, seed: 175 + k * 10 });
    { const pts = []; for (let q = 0; q <= 160; q++) { const a = Math.PI + q / 160 * Math.PI, k = 0.83; pts.push([SC[0] + Math.cos(a) * SC[2] * k, SC[1] + Math.sin(a) * SC[3] * k + Math.sin(a * 46) * 9]); } ink(g, pts, { color: m.slip, width: 3.6, alpha: 0.85, wobble: 0.3, seed: 177 }); }
    for (let q = 0; q < 26; q++) { const a = Math.PI + (q + 0.5) / 26 * Math.PI, k = 0.74; g.fillStyle = rgba(m.slip, 0.8); g.beginPath(); g.arc(SC[0] + Math.cos(a) * SC[2] * k, SC[1] + Math.sin(a) * SC[3] * k, 6, 0, TAU); g.fill(); }
    hatch(g, sh, { color: INKC, count: 600, len: 18, width: 1, alpha: 0.35, seed: 178, dir: () => 1.9, curve: 0.3, density: (x) => clamp((x - cx - 300) / 700) });
    g.restore();
    // broken colour over the shoulder, strokes following its curve, with bits of paper lifted out
    const tang = (cx0, cy0, rx, ry) => (x, y) => { const th = Math.atan2((y - cy0) / ry, (x - cx0) / rx); return Math.atan2(ry * Math.cos(th), -rx * Math.sin(th)); };
    brushWash(g, sh, [m.clay, m.clayLight, shade(m.clay, 0.15), '#d88858'], { seed: 190, count: 160, width: [14, 40], len: [120, 360], angle: tang(SC[0], SC[1], SC[2], SC[3]), alpha: [0.1, 0.24], base: 0.08, lifts: 0.03 });
    penLine(g, sh.slice(60, 120), { w: 3.2, alpha: 0.75, seed: 179 });
    sketch(g, sh.slice(62, 118).map(([x, y]) => [x, y + 3]), { alpha: 0.35, width: 1.2, seed: 191 });
    // the lip's outer face (the rim is thick and rolled), then the rounded top of the rim catching the light
    const lip = potEllipse(cx, cy + 40, orx * 0.995, ory, 6);
    wash(g, lip, { color: shade(m.clay, 0.05), opacity: 0.97, seed: 181, under: '#f0e0cc', bleed: 0.004, layers: 12 });
    shadeEdge(g, lip, { color: m.clayDark, alpha: 0.6, width: 60, dx: 26, dy: 28 });
    g.save(); g.filter = 'blur(10px)'; g.fillStyle = rgba(m.clayDark, 0.4); g.beginPath(); g.ellipse(cx + 40, cy + 70, orx * 1.0, ory * 0.98, 0, 0.1, Math.PI - 0.1); g.lineWidth = 30; g.strokeStyle = rgba(m.clayDark, 0.45); g.stroke(); g.restore();
    wash(g, outerE, { color: tint(m.clay, 0.12), opacity: 0.97, seed: 182, under: '#f0e0cc', bleed: 0.004, layers: 14, edge: 0.3 });
    g.save(); path(g, outerE); g.clip();
    const rg = g.createLinearGradient(cx - orx, cy - ory, cx + orx, cy + ory); rg.addColorStop(0, rgba(m.clayLight, 0.75)); rg.addColorStop(0.45, rgba(m.clayLight, 0.2)); rg.addColorStop(0.8, rgba(m.clayDark, 0.3)); rg.addColorStop(1, rgba(m.clayDark, 0.5));
    g.fillStyle = rg; g.fillRect(cx - orx, cy - ory, orx * 2, ory * 2);
    // the rounded top: lighter along its crown, broken colour going round
    g.lineCap = 'round';
    for (let i = 0; i < 150; i++) { const a0 = r() * TAU, a1 = a0 + r.range(0.06, 0.26), k = r.range(0.83, 0.99); g.strokeStyle = rgba(r.pick([m.clayLight, m.clayDark, '#f0b080', '#a85030', m.clay]), r.range(0.1, 0.28)); g.lineWidth = r.range(3, 10);
      g.beginPath(); g.ellipse(cx, (cy + icy) / 2, orx * k, ory * k, 0, a0, a1); g.stroke(); }
    g.strokeStyle = rgba('#fbe0c0', 0.35); g.lineWidth = 9; g.filter = 'blur(3px)'; g.beginPath(); g.ellipse(cx, (cy + icy) / 2, orx * 0.91, ory * 0.91, 0, Math.PI * 1.05, Math.PI * 1.75); g.stroke(); g.filter = 'none';
    for (let i = 0; i < 80; i++) { const a = r() * TAU, k = r.range(0.84, 0.99); g.fillStyle = rgba(r() < 0.5 ? m.slip : m.clayDark, r.range(0.2, 0.5)); g.beginPath(); g.arc(cx + Math.cos(a) * orx * k, (cy + icy) / 2 + Math.sin(a) * ory * k, r.range(1, 3), 0, TAU); g.fill(); }
    g.restore();
    brushWash(g, outerE, [tint(m.clay, 0.12), m.clayLight, m.clay, shade(m.clay, 0.12)], { seed: 192, count: 120, width: [6, 18], len: [80, 240], angle: tang(cx, (cy + icy) / 2, orx, ory), alpha: [0.12, 0.28], base: 0.05, lifts: 0.06 });
    brushWash(g, lip, [m.clay, shade(m.clay, 0.2), m.clayDark], { seed: 193, count: 80, width: [6, 16], len: [80, 220], angle: tang(cx, cy + 40, orx, ory), alpha: [0.12, 0.26], base: 0.04, lifts: 0.1 });
    hatch(g, lip, { color: INKC, count: 260, len: 10, width: 0.9, alpha: 0.35, seed: 194, dir: () => 1.75, curve: 0.2, density: (x, y) => clamp((x - cx) / orx + 0.3) * clamp((y - cy) / ory) });
    // a chip out of the lip, front left: an old, much-loved pot
    const chip = smooth([[cx - 476, cy + 240], [cx - 452, cy + 262], [cx - 410, cy + 270], [cx - 386, cy + 254]]);
    g.fillStyle = rgba(m.clayDark, 0.55); path(g, chip); g.fill(); ink(g, chip, { width: 1.4, alpha: 0.6 });
    // cut the opening
    g.save(); g.globalCompositeOperation = 'destination-out'; path(g, innerE); g.fill(); g.restore();
    // ink: the inner edge heavy on the near side, the outer edge, the bottom of the lip
    penLine(g, innerE, { closed: true, w: 3.4, alpha: 0.85, seed: 183, weight: (t) => 0.35 + 0.75 * Math.max(0, Math.sin(TAU * t)) });
    ink(g, innerE.slice(8, 52).map(([x, y]) => [x, y + 7]), { color: '#f8d0a8', width: 2.4, alpha: 0.45, seed: 184 });
    penLine(g, outerE, { closed: true, w: 2.4, alpha: 0.75, seed: 185, weight: (t) => 0.4 + 0.6 * Math.max(0, Math.sin(TAU * t + 0.4)) });
    penLine(g, lip.slice(4, 58), { w: 3, alpha: 0.85, seed: 186 });
    sketch(g, outerE.slice(62, 120).map(([x, y]) => [x + 2, y - 2]), { alpha: 0.4, width: 1.3, seed: 195 });
    sketch(g, lip.slice(6, 56).map(([x, y]) => [x, y + 3]), { alpha: 0.35, width: 1.2, seed: 196 });
    granulate(g, g.canvas.width, g.canvas.height, 0.18, 187);
    // cut the opening again (granulation and the lines leave a faint veil in it), keeping the inked edge
    g.save(); g.globalCompositeOperation = 'destination-out'; path(g, potEllipse(cx, icy, irx * 0.985, iry * 0.975, 3)); g.fill(); g.restore();
  }, 1.5);
  if (m.name !== 'hot') { moodGlaze(inner, m, 1, 188); moodGlaze(rim, m, 1.5, 189); }
  return (CUS[m.name] = { inner, rim: to8(rim) });
}
// where the pebbles lie in the close-up: unit-disc positions, mostly in the near half where the water is clear
const CU_STONES = (() => { const r = rng(919), out = []; for (let i = 0; i < 24; i++) { const a = r() * TAU, d = Math.sqrt(r()) * 0.72; out.push({ u: Math.cos(a) * d, v: Math.abs(Math.sin(a)) * d * 0.9 + 0.05, s: r.range(0.85, 1.2), rot: r.gauss(0, 0.5), p: PEBBLES[i % PEBBLES.length] }); } return out; })();
// Looking down into the pitcher. level: 0 = a little water at the bottom .. 1 = at the brim.
// o.stones: pebbles dropped so far (they lie under the water, the newest nearest the top), o.maxStones (default 12),
// o.splashT: seconds since the last pebble went in (rings and droplets for ~1.5 s; < 0 = none), o.mood.
// Draws in the current transform (page coordinates); call cam() first to push in slowly.
export function drawPitcherCloseup(g, level, t, o = {}) {
  const { stones = 0, maxStones = 12, splashT = -1, mood = 'hot' } = o, m = MD(mood);
  const { inner, rim } = closeupSprites(m), { cx, icy, irx, iry } = CLOSEUP;
  level = clamp(level);
  const d = 1 - level, e = waterEllipse(d);
  drawL(g, inner);
  g.save();
  g.beginPath(); g.ellipse(cx, icy, irx, iry, 0, 0, TAU); g.clip();
  g.beginPath(); g.ellipse(e.x, e.y, e.rx, e.ry, 0, 0, TAU); g.clip();
  // the water: dark and clear, so the pebbles show through it
  const c0 = mix('#0e1a1e', '#2c5058', level), c1 = mix('#05090b', '#14282e', level);
  const wg = g.createRadialGradient(e.x - e.rx * 0.1, e.y + e.ry * 0.2, 0, e.x, e.y, e.rx); wg.addColorStop(0, c0); wg.addColorStop(1, c1);
  g.fillStyle = wg; g.fillRect(e.x - e.rx, e.y - e.ry, e.rx * 2, e.ry * 2);
  const n = Math.min(CU_STONES.length, Math.floor(stones));
  for (let i = 0; i < n; i++) {
    const st = CU_STONES[i], sd = Math.max(d + 0.05, 1 - 0.85 * (i + 1) / Math.max(1, maxStones)), se = waterEllipse(sd);
    const x = se.x + st.u * se.rx * 0.8, y = se.y + st.v * se.ry * 0.8 + st.p.r * 0.6, sc = (1 - CLOSEUP.shrink * sd) * 3.4 * st.s;
    g.save(); g.globalAlpha = clamp(0.9 - (sd - d) * 1.3, 0.3, 0.88);
    g.translate(x, y); g.rotate(st.rot); g.scale(sc, sc * 0.8); drawSprite(g, pebbleSprite(st.p, m)); g.restore();
  }
  g.fillStyle = rgba('#0e2026', 0.25 + 0.2 * (1 - level)); g.fillRect(e.x - e.rx, e.y - e.ry, e.rx * 2, e.ry * 2);
  // the bright mouth of the pitcher mirrored in the water, toward the far side, trembling a little
  const sky = m.name === 'night' ? ['#8a98c8', '#4a5888'] : m.name === 'sunset' ? ['#fbe0c4', '#d89a90'] : ['#f4faf6', '#a8ccd4'];
  const q = lerp(0.6, 0.84, level), rcx = e.x - e.rx * 0.05, rcy = e.y - e.ry * 0.42, rrx = e.rx * q, rry = e.ry * q;
  const refl = []; for (let i = 0; i < 64; i++) { const a = i / 64 * TAU, k = 1 + 0.018 * Math.sin(a * 6 + t * 1.6) + 0.01 * Math.sin(a * 11 - t * 2.3); refl.push([rcx + Math.cos(a) * rrx * k, rcy + Math.sin(a) * rry * k]); }
  const rg = g.createRadialGradient(rcx - rrx * 0.15, rcy - rry * 0.1, rrx * 0.05, rcx, rcy, rrx);
  const ra = lerp(0.85, 0.62, level);
  rg.addColorStop(0, rgba(sky[0], ra)); rg.addColorStop(0.4, rgba(sky[0], ra * 0.85)); rg.addColorStop(0.72, rgba(sky[1], ra * 0.45)); rg.addColorStop(1, rgba(sky[1], 0));
  g.fillStyle = rg; path(g, refl); g.fill();
  // slow rings on the surface
  g.lineWidth = 1.2 + level * 1.8;
  for (let k = 0; k < 3; k++) { const p = (t * 0.16 + k / 3) % 1; g.strokeStyle = `rgba(255,255,255,${(1 - p) * p * 0.7 * (0.5 + level)})`;
    g.beginPath(); g.ellipse(e.x + e.rx * 0.1, e.y + e.ry * 0.1, e.rx * (0.08 + p * 0.85), e.ry * (0.08 + p * 0.85), 0, 0, TAU); g.stroke(); }
  // a splash: a bright crown, rings racing out
  const sx = e.x + e.rx * 0.08, sy = e.y + e.ry * 0.12;
  if (splashT >= 0 && splashT < 1.8) {
    for (let k = 0; k < 4; k++) { const p = clamp((splashT - k * 0.14) / 1.4); if (p <= 0 || p >= 1) continue;
      g.strokeStyle = `rgba(255,255,255,${(1 - p) * 0.9})`; g.lineWidth = (2.5 + level * 2.5) * (1 - p * 0.6);
      g.beginPath(); g.ellipse(sx, sy, e.rx * (0.06 + p * 0.9), e.ry * (0.06 + p * 0.9), 0, 0, TAU); g.stroke(); }
    const f = clamp(1 - splashT / 0.35); if (f > 0) pool(g, sx, sy, e.rx * 0.3, e.ry * 0.3, '#ffffff', 0.8 * f);
  }
  // the meniscus: darker where the water meets the wall
  g.strokeStyle = 'rgba(4,8,10,0.35)'; g.lineWidth = 14; g.beginPath(); g.ellipse(e.x, e.y, e.rx, e.ry, 0, 0, TAU); g.stroke();
  g.strokeStyle = 'rgba(4,8,10,0.4)'; g.lineWidth = 5; g.stroke();
  g.restore();
  g.save(); g.beginPath(); g.ellipse(cx, icy, irx, iry, 0, 0, TAU); g.clip();
  ink(g, ellipse(e.x, e.y, e.rx * 0.98, e.ry * 0.98, 60).slice(32, 58), { color: '#f4f0e0', width: 1.6 + level * 1.4, alpha: 0.5 + level * 0.3, wobble: 0.3, seed: 190 });
  // droplets thrown up out of the splash toward us
  if (splashT >= 0 && splashT < 1.0) {
    const rs = rng(191);
    for (let k = 0; k < 14; k++) { const a = rs() * TAU, v = rs.range(0.4, 1), p = splashT / 0.9;
      const x = sx + Math.cos(a) * e.rx * 0.5 * v * p, y = sy + Math.sin(a) * e.ry * 0.5 * v * p - Math.sin(Math.PI * Math.min(1, p)) * e.ry * 0.9 * v;
      const s = (3 + 5 * level) * (1 + p * 0.8) * rs.range(0.6, 1.2); if (p >= 1) continue;
      g.fillStyle = `rgba(250,252,255,${0.9 * (1 - p)})`; g.beginPath(); g.arc(x, y, s, 0, TAU); g.fill(); }
  }
  g.restore();
  // the glint of the sun on the water: a four-pointed sparkle, bigger and brighter as the water comes up
  if (m.name !== 'night') {
    const gx = rcx - rrx * 0.3, gy = rcy - rry * 0.25, tw = 0.8 + 0.2 * Math.sin(t * 2.1) * Math.sin(t * 0.77 + 1), s = (12 + 30 * level) * tw, a = (0.7 + 0.3 * level) * tw;
    g.save(); g.globalCompositeOperation = 'lighter';
    pool(g, gx, gy, s * 1.6, s * 1.0, '#fff6dc', 0.5 * a);
    g.fillStyle = `rgba(255,252,236,${a})`;
    g.beginPath(); g.ellipse(gx, gy, s, s * 0.09, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(gx, gy, s * 0.09, s * 0.7, 0, 0, TAU); g.fill();
    g.beginPath(); g.arc(gx, gy, s * 0.14, 0, TAU); g.fill();
    for (let k = 0; k < 3; k++) { const px = rcx + rrx * (0.2 + 0.25 * k) * Math.cos(t * 0.3 + k * 2), py = rcy + rry * 0.4 * Math.sin(t * 0.37 + k), tw2 = Math.max(0, Math.sin(t * 2.7 + k * 2.1)); if (tw2 < 0.2) continue;
      g.fillStyle = `rgba(255,252,236,${0.6 * tw2})`; g.beginPath(); g.ellipse(px, py, s * 0.35 * tw2, s * 0.04, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(px, py, s * 0.04, s * 0.25 * tw2, 0, 0, TAU); g.fill(); }
    g.restore();
  }
  drawL(g, rim);
}

// ---------------------------------------------------------------- the cutaway: a peek through the clay
// A side view of the pitcher as a storybook inset: the clay goes see-through over the inside, so we can see
// the water level and the pebbles heaping up at the bottom. level: 0 (a little water) .. 1 (at the brim);
// stones: how many pebbles are in (fractional: the last one is still sinking, e.g. 4.5 = the 5th halfway down).
// o: x, base (foot), h (height), mood, bg (paint a soft paper vignette behind, default true), maxStones (14).
export const CUTAWAY = { x: 960, base: 880, h: 700 };
const CUT = {};
function cutawayInner(cx, base, h) { // the inside of the pot (its wall is ~3.5% of the height thick)
  const tw = 0.034 * h, L = [], R = [], n = 50, y0 = 0.05, y1 = 0.975;
  for (let i = 0; i <= n; i++) { const f = y0 + (y1 - y0) * i / n, w = Math.max(4, profW(f) * h - tw); L.push([cx - w, base - f * h]); R.push([cx + w, base - f * h]); }
  const bot = []; const wb = profW(y0) * h - tw; for (let i = 1; i < 12; i++) { const a = Math.PI - i / 12 * Math.PI; bot.push([cx + Math.cos(a) * wb, base - y0 * h + Math.sin(a) * wb * 0.18]); }
  return L.slice().reverse().concat(bot).concat(R);
}
function cutStones(cx, base, h, n) { // a heap filling the bottom, row by row
  const r = rng(733), out = [], rp = 0.052 * h;
  let y = base - 0.05 * h - rp * 0.7, row = 0;
  while (out.length < n && row < 12) {
    const f = (base - y) / h, w = profW(f) * h - 0.034 * h - rp * 0.9, k = Math.max(1, Math.floor((2 * w) / (rp * 1.9)));
    for (let i = 0; i < k && out.length < n; i++) { const x = cx - w + (i + 0.5) * (2 * w / k) + (row % 2 ? rp * 0.4 : -rp * 0.3) * (i === k - 1 ? 0 : 1);
      out.push({ x: x + r.gauss(0, rp * 0.1), y: y + r.gauss(0, rp * 0.08), r: rp * r.range(0.85, 1.12), rot: r.gauss(0, 0.12), p: PEBBLES[out.length % PEBBLES.length] }); }
    y -= rp * 1.35; row++;
  }
  // drop in an order that fills from the middle out, like stones tumbling to the lowest place
  return out;
}
export function drawPitcherCutaway(g, level, stones, t, o = {}) {
  const { x = CUTAWAY.x, base = CUTAWAY.base, h = CUTAWAY.h, mood = 'hot', bg = true, maxStones = 14 } = o, m = MD(mood);
  const key = `${m.name}:${x}:${base}:${h}:${bg}`;
  if (!CUT[key]) {
    const box = { x0: x - h * 0.42, y0: base - h * 1.06, x1: x + h * 0.48, y1: base + h * 0.06, w: h * 0.9, h: h * 1.12 };
    const body = sprite(box, 1.2, (g2) => paintPitcher(g2, x, base, h, m), { grain: 0.16, seed: 11 });
    if (m.name !== 'hot') moodGlaze(body.c, m, 1.2, 12);
    let back = null;
    if (bg) back = layer2((g2) => { // a soft cream vignette, like an inset picture on the page
      g2.fillStyle = 'rgba(0,0,0,0)';
      const sh = fluffy(x, base - h * 0.5, h * 0.72, h * 0.62, 16, 0.08, 741);
      wash(g2, sh, { color: m.name === 'night' ? '#c8c4d4' : '#f6ead2', opacity: 0.9, seed: 742, bleed: 0.06, layers: 30, edge: 0.25 });
      wash(g2, ellipse(x + 40, base + 8, h * 0.42, h * 0.05, 30), { color: m.shadow, opacity: 0.25, seed: 743, bleed: 0.1, layers: 16, edge: 0 });
      sketch(g2, sh, { closed: true, alpha: 0.35, width: 1.2, seed: 744 });
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.3; grassFlicks(g2, x + Math.cos(a) * h * 0.3, base + 6, 16, { seed: 745 + i, n: 4, colors: [m.lawn[3]], inkA: 0.4 }); }
    });
    CUT[key] = { body, back, inner: cutawayInner(x, base, h), stones: cutStones(x, base, h, 30) };
  }
  const C = CUT[key];
  if (C.back) drawL(g, C.back);
  drawSprite(g, C.body);
  // the inside
  const yW = base - lerp(0.13, 0.95, clamp(level)) * h;
  g.save(); path(g, C.inner); g.clip();
  const b = bbox(C.inner);
  const ig = g.createLinearGradient(b.x0, 0, b.x1, 0); ig.addColorStop(0, rgba(shade(m.clay, 0.45), 0.92)); ig.addColorStop(0.4, rgba(shade(m.clay, 0.3), 0.85)); ig.addColorStop(1, rgba(shade(m.clay, 0.55), 0.95));
  g.fillStyle = ig; g.fillRect(b.x0, b.y0, b.w, b.h);
  for (let i = 1; i < 9; i++) { const f = 0.08 + i * 0.1, w = profW(f) * h; ink(g, [[x - w, base - f * h + 6], [x, base - f * h + 14], [x + w, base - f * h + 6]], { color: '#3a2014', width: 1, alpha: 0.25, gaps: 1, seed: 750 + i }); }
  // the water body
  const wg = g.createLinearGradient(0, yW, 0, base);
  wg.addColorStop(0, rgba(m.name === 'night' ? '#6a88a8' : '#8cbcc0', 0.9)); wg.addColorStop(1, rgba(m.name === 'night' ? '#2a3a5a' : '#3e6a74', 0.95));
  g.fillStyle = wg; g.fillRect(b.x0, yW, b.w, base - yW + 20);
  // the pebbles, the newest one still sinking down through the water
  const n = Math.min(C.stones.length, Math.max(0, stones));
  const whole = Math.floor(n), frac = n - whole;
  const drawSt = (st, sx, sy, a = 1) => { g.save(); g.globalAlpha = a; g.translate(sx, sy + st.r * 0.6); g.rotate(st.rot); const sc = st.r / st.p.r; g.scale(sc, sc); drawSprite(g, pebbleSprite(st.p, m)); g.restore(); };
  for (let i = 0; i < whole; i++) drawSt(C.stones[i], C.stones[i].x, C.stones[i].y);
  if (frac > 0 && whole < C.stones.length) {
    const st = C.stones[whole], y0 = base - h * 1.05, k = ease(frac), sy = lerp(y0, st.y, k), sx = lerp(x + h * 0.02, st.x, k) + Math.sin(frac * 9) * h * 0.01 * (1 - k);
    drawSt(st, sx, sy);
    // where it broke the surface: rings
    const kIn = clamp((yW - y0) / (st.y - y0)), since = frac - (kIn > 0 ? Math.min(1, kIn) : 0);
    if (since > 0 && since < 0.5) { const p = since / 0.5; g.strokeStyle = `rgba(255,255,255,${0.8 * (1 - p)})`; g.lineWidth = 2; for (let q = 0; q < 2; q++) { g.beginPath(); g.ellipse(x, yW, h * (0.04 + p * 0.18 + q * 0.04), h * (0.01 + p * 0.03), 0, 0, TAU); g.stroke(); } }
  }
  // tiny bubbles rising off the stones
  for (let i = 0; i < 9; i++) { const p = (t * 0.22 + i / 9) % 1, bx = x + (noise1(i * 3.1, 7) - 0.5) * h * 0.3 + Math.sin(t * 2 + i) * 3, by = lerp(base - 0.12 * h, yW + 6, p);
    if (by < yW + 4) continue; g.strokeStyle = `rgba(240,250,255,${0.6 * Math.sin(p * Math.PI)})`; g.lineWidth = 1.2; g.beginPath(); g.arc(bx, by, 2 + (i % 3), 0, TAU); g.stroke(); }
  // the surface: a lighter band with a little ripple line
  const wAt = profW((base - yW) / h) * h - 0.034 * h;
  g.fillStyle = rgba('#d8ecec', 0.55); g.beginPath(); g.ellipse(x, yW, wAt, Math.max(3, wAt * 0.12), 0, 0, TAU); g.fill();
  ink(g, [[x - wAt, yW], [x - wAt * 0.5, yW + Math.sin(t * 1.4) * 2], [x, yW], [x + wAt * 0.5, yW - Math.sin(t * 1.4) * 2], [x + wAt, yW]], { color: '#f8ffff', width: 2, alpha: 0.8, wobble: 0.2, seed: 760 });
  // the clay, ghosted over the inside, so it reads as a peek through the side of the pot
  g.globalAlpha = 0.22; drawSprite(g, C.body); g.globalAlpha = 1;
  g.restore();
  sketch(g, C.inner, { alpha: 0.5, width: 1.3, seed: 761, color: '#5a2e1c' });
}

// ---------------------------------------------------------------- ambient life (all functions of t, cheap per frame)
// Heat shimmer: redraws thin strips of a painted layer (2x or 1x) with tiny wavering offsets, over a band of the page.
// Call right after drawing that layer with the same camera c. Keep the band over distant land only.
export const SHIMMER_GARDEN = { x0: 600, x1: 1600, y0: 418, y1: 590 };
export const SHIMMER_FIELDS = { x0: -M, x1: W + M, y0: 210, y1: 470 };
export function heatShimmer(g, img, c, t, band = SHIMMER_GARDEN, amp = 1.3) {
  const res = img.width / LW, step = 3, span0 = band.y1 - band.y0;
  cam(g, c, 1);
  for (let y = band.y0; y < band.y1; y += step) {
    const e = Math.sin(Math.PI * (y - band.y0) / span0);
    const dx = amp * e * (Math.sin(t * 2.3 + y * 0.19) * 0.6 + Math.sin(t * 1.3 - y * 0.071 + 1.3) * 0.4);
    const dy = amp * 0.35 * e * Math.sin(t * 1.9 + y * 0.13);
    g.drawImage(img, (band.x0 + M) * res, (y + MY) * res, (band.x1 - band.x0) * res, step * res, band.x0 + dx, y + dy, band.x1 - band.x0, step + 0.5);
  }
}
// butterflies: cabbage whites and a brimstone, wandering slowly about the garden
export function butterflies(g, t, n = 2, area = { x0: 700, x1: 1700, y0: 520, y1: 820 }, seed = 3, scale = 1) {
  for (let i = 0; i < n; i++) {
    const s = seed * 10 + i, u = t * 0.035 + i * 7.1;
    const x = area.x0 + (area.x1 - area.x0) * noise1(u, s), y = area.y0 + (area.y1 - area.y0) * noise1(u * 1.3 + 4, s + 9) + Math.sin(t * 2.2 + i) * 6;
    const vx = noise1(u + 0.02, s) - noise1(u - 0.02, s), face = vx >= 0 ? 1 : -1;
    const flap = Math.abs(Math.cos(t * 7.5 + i * 2)), col = i % 3 === 2 ? '#f0e070' : '#f8f4e8';
    g.save(); g.translate(x, y); g.scale(face * scale, scale);
    for (const [wy, wl, wh] of [[-1, 8, 6.5], [1.5, 6, 4.5]]) { // fore and hind wings, opening and closing
      g.fillStyle = rgba(col, 0.95); g.beginPath(); g.ellipse(-wl * 0.15, wy - wh * flap * 0.6, wl * 0.6, wh * (0.25 + 0.75 * flap) * 0.6, -0.5, 0, TAU); g.fill();
      g.strokeStyle = rgba(INKC, 0.55); g.lineWidth = 0.6; g.stroke();
    }
    if (col !== '#f0e070') { g.fillStyle = rgba('#5a5a60', 0.7); g.beginPath(); g.arc(-3, -1 - 6.5 * flap * 0.6, 1.4 * flap + 0.3, 0, TAU); g.fill(); }
    g.strokeStyle = rgba(INKC, 0.85); g.lineWidth = 1.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-3, 1); g.lineTo(4, -1); g.stroke();
    g.lineWidth = 0.5; g.beginPath(); g.moveTo(4, -1); g.lineTo(7, -4); g.moveTo(4, -1); g.lineTo(7.5, -2.5); g.stroke();
    g.restore();
  }
}
// dust motes: warm specks drifting slowly up through the sunlit air
export function dustMotes(g, t, n = 30, area = { x0: 300, x1: 1700, y0: 300, y1: 880 }, seed = 5, color = '255,236,196') {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const sp = 0.006 + 0.006 * noise1(i * 1.3, seed), v = (t * sp + noise1(i * 3.1, seed + 9)) % 1;
    const x = area.x0 + (area.x1 - area.x0) * noise1(i * 7.3, seed) + Math.sin(t * 0.3 + i) * 14 + (noise1(t * 0.05 + i, seed + 2) - 0.5) * 40;
    const y = area.y1 - v * (area.y1 - area.y0);
    const a = Math.sin(v * Math.PI) * (0.25 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.1 + i * 2)));
    if (a <= 0.02) continue;
    g.fillStyle = `rgba(${color},${a})`; g.beginPath(); g.arc(x, y, 1.1 + (i % 3) * 0.55, 0, TAU); g.fill();
  }
  g.restore();
}
// swifts: dark sickle-winged birds wheeling high in the evening sky
export function swifts(g, t, n = 5, area = { x0: 300, x1: 1500, y0: 60, y1: 330 }, seed = 7, scale = 1) {
  for (let i = 0; i < n; i++) {
    const s = seed * 10 + i, w = 0.18 + 0.06 * noise1(i, s), ph = i * 1.9;
    const cx = (area.x0 + area.x1) / 2 + (area.x1 - area.x0) * 0.35 * Math.sin(t * 0.05 + ph * 0.7);
    const x = cx + (area.x1 - area.x0) * 0.28 * Math.cos(t * w + ph), y = (area.y0 + area.y1) / 2 + (area.y1 - area.y0) * 0.38 * Math.sin(t * w * 1.3 + ph) + Math.sin(t * 0.7 + i) * 10;
    const vx = -Math.sin(t * w + ph) * w, vy = Math.cos(t * w * 1.3 + ph) * w * 1.3 * 0.5, ang = Math.atan2(vy, vx);
    const flick = Math.sin(t * 9 + i * 3) > 0.6 ? 0.35 : 0, sc = scale * (0.8 + 0.3 * noise1(i, s + 1));
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(sc, sc);
    g.fillStyle = 'rgba(40,32,40,0.85)';
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(2, 0); g.quadraticCurveTo(-2, sd * (7 + flick * 4), -12, sd * (13 - flick * 3)); g.quadraticCurveTo(-4, sd * (5 + flick * 2), -3, 0); g.closePath(); g.fill(); }
    g.beginPath(); g.ellipse(0, 0, 5, 1.8, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(-4, 0); g.lineTo(-9, -1.6); g.lineTo(-7.5, 0); g.lineTo(-9, 1.6); g.closePath(); g.fill();
    g.restore();
  }
}
// moths: pale specks fluttering round the lit window
export function moths(g, t, n = 3, at = WINDOW, seed = 9) {
  for (let i = 0; i < n; i++) {
    const s = seed + i * 13, rx = at.w * (0.55 + 0.25 * noise1(i, s)), ry = at.h * 0.6;
    const a = t * (1.2 + 0.4 * noise1(i * 2, s)) + i * 2.1;
    const x = at.x + Math.cos(a) * rx + (noise1(t * 1.7 + i, s) - 0.5) * 30, y = at.y + Math.sin(a * 1.3) * ry + (noise1(t * 1.9 + i, s + 5) - 0.5) * 24;
    const flap = Math.abs(Math.sin(t * 22 + i));
    g.save(); g.translate(x, y);
    g.fillStyle = 'rgba(250,236,200,0.85)';
    for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 2.6 * flap, -0.5, 3 * (0.4 + 0.6 * flap), 2.2, sd * 0.4, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(120,100,80,0.8)'; g.beginPath(); g.ellipse(0, 0.5, 0.9, 2.2, 0, 0, TAU); g.fill();
    g.restore();
  }
}
// the cottage window's lamplight, flickering softly; k: 0..1 (fade it up as night falls)
export function windowGlow(g, t, k = 1, at = WINDOW) {
  if (k <= 0) return;
  const f = 0.86 + 0.08 * noise1(t * 2.3, 31) + 0.04 * Math.sin(t * 7.3) * noise1(t * 0.9, 32);
  g.save(); g.globalCompositeOperation = 'lighter';
  pool(g, at.x, at.y, at.w * 1.5 * (0.95 + 0.05 * f), at.h * 1.35, '#ffb860', 0.16 * k * f);
  pool(g, at.x, at.y, at.w * 0.55, at.h * 0.5, '#ffe6a8', 0.14 * k * f);
  pool(g, at.x - 20, at.y + 160, 220, 50, '#ffb060', 0.06 * k * f); // a little light spilling on the lawn below
  g.restore();
}
// stars: bigger and softer than the stage's, each with a halo; the brightest have a little four-point glint.
// They come out one by one after `appear` (seconds) and twinkle slowly.
const STARS2 = (() => { const r = rng(4243), out = []; for (let i = 0; i < 90; i++) out.push({ x: r.range(60, 1860), y: Math.pow(r(), 1.3) * 400 + 30, s: Math.pow(r(), 2.2) * 2.2 + 0.9, ph: r() * TAU, sp: r.range(0.3, 0.8) }); return out; })();
export function softStars(g, t, k = 1, appear = -99) {
  if (k <= 0) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  STARS2.forEach((st, i) => {
    const a = k * clamp((t - appear - i * 0.1) / 1.2) * (0.68 + 0.32 * Math.sin(t * st.sp + st.ph));
    if (a <= 0.02) return;
    const R = 7 * st.s, grd = g.createRadialGradient(st.x, st.y, 0, st.x, st.y, R);
    grd.addColorStop(0, `rgba(255,250,228,${a})`); grd.addColorStop(0.18, `rgba(240,240,255,${a * 0.55})`); grd.addColorStop(1, 'rgba(200,210,255,0)');
    g.fillStyle = grd; g.fillRect(st.x - R, st.y - R, 2 * R, 2 * R);
    if (st.s > 2) { g.fillStyle = `rgba(255,250,230,${a * 0.6})`; g.beginPath(); g.ellipse(st.x, st.y, R * 1.3, R * 0.07, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(st.x, st.y, R * 0.07, R * 1.3, 0, 0, TAU); g.fill(); }
  });
  g.restore();
}
// the night sky for the garden: stars and the moon, kept behind the cottage, the elm and everything else
let SKYBUF = null;
export function nightSky(g, t, c, L, k = 1, starsAppear = -99, moonK = 1) {
  if (k <= 0 || !L.skyMask) return;
  if (!SKYBUF) SKYBUF = canvas(W, H, false);
  const b = SKYBUF.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H);
  cam(b, c, 1);
  softStars(b, t, k, starsAppear);
  moon(b, MOON[0], MOON[1], 40, moonK * k);
  b.globalCompositeOperation = 'destination-in'; b.drawImage(L.skyMask, -M, -MY, LW, LH); b.globalCompositeOperation = 'source-over';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(SKYBUF, 0, 0); g.restore();
}
// the right ambient life for a mood, over the garden (in world coordinates, after cam())
export function gardenAmbient(g, t, mood = 'hot', o = {}) {
  const m = MD(mood);
  if (m.name === 'hot') { butterflies(g, t, o.butterflies ?? 2, undefined, 3); dustMotes(g, t, 26, undefined, 5); }
  else if (m.name === 'sunset') { swifts(g, t, o.swifts ?? 6, undefined, 7); dustMotes(g, t, 22, undefined, 6, '255,214,170'); butterflies(g, t, 1, undefined, 4); }
  else { windowGlow(g, t, o.glow ?? 1); moths(g, t, 3); fireflies(g, t, o.fireflies ?? 9, { x0: 520, x1: 1660, y0: 640, y1: 900 }, 21, 0.8); }
}

// ---------------------------------------------------------------- the whole garden for one frame
// c: camera ({z, x, y}, see view()). o: hooks behind (after the flowers, before the pitcher), actors (after the
// pitcher and pebbles: the crow), after (on top of everything); pebbles: the list still lying on the path (default
// all of PEBBLES); pitcher: options for drawPitcher; sway: extra lean of the tall flowers; shimmer (hot, default on);
// starsK / starsAppear (night); ambient (default true).
export function drawGarden(g, t, c, mood = 'hot', o = {}) {
  const m = MD(mood), L = gardenLayers(m);
  drawH(g, c, L.back);
  if (m.name === 'night' && o.sky !== false) nightSky(g, t, c, L, o.starsK ?? 1, o.starsAppear ?? -99);
  if (m.name === 'hot' && o.shimmer !== false) heatShimmer(g, L.back, c, t);
  cam(g, c, 1);
  drawGardenFlowers(g, t, m, o.sway || 0);
  if (o.behind) o.behind(g);
  drawPitcher(g, m, o.pitcher || {});
  for (const p of (o.pebbles ?? PEBBLES)) drawPebble(g, p, { mood: m });
  if (o.actors) o.actors(g);
  g.drawImage(L.front, -M, -MY, LW, LH);
  if (o.ambient !== false) gardenAmbient(g, t, m, o);
  if (o.after) o.after(g);
}
// the opening's painted fields as a 2x layer (cached per mood)
const FIELDS = {};
export function fieldsLayer(mood = 'hot') {
  const m = MD(mood);
  if (FIELDS[m.name]) return FIELDS[m.name];
  const c = hlayer((g) => paintDryFields(g, m));
  moodGlaze(c, m, 2, 15, { k: 0.85, bleach: false });
  { const g = c.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); granulate(g, c.width, c.height, 0.2, 7); g.restore(); }
  return (FIELDS[m.name] = to8(c));
}
