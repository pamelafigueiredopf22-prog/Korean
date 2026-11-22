// The Milkmaid and Her Pail: scenery and environment.
//
// Pen-and-wash after the classic English storybook (broken washes with the paper showing, granulation, fine
// broken ink lines on everything). Painters draw in the page coordinates of a 1920x1080 frame; layers carry the
// usual camera margins (M, MY), and the big sets are painted at 2x so the camera can push in to ~2.3x and stay
// crisp. Everything is painted once and cached; per frame only cached canvases and small live things are drawn.
//
// Places
//   FARMYARD   farmLayers(mood) -> { back, front, skyMask }         moods 'dawn', 'dusk', 'night'
//              drawFarm(g, t, c, mood, o)   the whole yard for one frame (hooks behind / actors / after;
//                                           o.gateOpen 0..1, o.lantern, o.smoke, o.ambient, o.starsK)
//              the land is painted ONCE and lit for each mood by a painted light pass (sky, glaze, cast shadows,
//              back-lit walls at dawn, long gold side-light at dusk, moonlight and lit windows at night).
//              Spots: COW, STOOL, DOOR, GATE, HENHOUSE, PUMP, BYRE (straw bed for the night), FARM.personH(y)
//   LANE       laneParallax(mood) / drawLaneParallax(g, P, c, scroll, t, o)   the side-on travelling set (multiplane:
//              sky, far valley with the church spire, mid fields with sheep, the lane with its hedgerow, the near
//              verge sliding fastest). LANE_PAN: length, plane speeds, groundAt(x) (the lane's ground line on the
//              page at a scroll), stileAt / bridgeAt / spillAt (scrolls that bring each to page x 960).
//              laneWideLayers(mood) / drawLaneWide(g, t, c, mood, o)   the 2x wide view of the winding lane
//              (LANE_WIDE: path, laneAt(u) -> {x, y, w, s}, SPILL)
//              drawSpill(g, x, y, k, t)   the spilled milk: a creamy puddle spreading, droplets, soaking into the dust
//   DAYDREAM   drawDream(g, x, y, w, h, t, k, o)  rosy dream cloud with sparkles; o.scene 'eggs' | 'hens' | 'shop' |
//              'fair' (o.from + o.mix to melt one dream into the next), o.tail, o.inside(g, s) for the stager.
//              dreamInner(w, h) its picture rect/oval; dreamSpot(scene, name, x, y, w, h) page points inside.
//   BEDROOM    bedroomLayers() / drawBedroom(g, t, c, o)   Molly's attic room at night (candle, window with
//              stars and moon, bed with patchwork quilt, rag doll, jug and basin, chair with apron).
//              o.sleeper(g) draws Molly in bed between the bed and the quilt; o.candle 0..1. Spots: BEDROOM.
//   NIGHT BYRE the farmyard in mood 'night' (drawFarm(..., 'night')), framed with view() on BYRE / HENHOUSE.
// Ambient life (functions of t, cheap): sunRays, mist, birds, butterflies, bees, swallows, chimneySmoke,
// pumpDrip, candleGlow, flicker, plus stars / moon / fireflies (engine/stage.js, crow-and-pitcher softStars).
// Keep the lower ~180 px for the captions: nothing important is painted below y = 900; key spots are above 880.
import { W, H, rng, canvas, wash as wash0, pool, smooth, ellipse, fluffy, rgba, shade, tint, mix, noise1, glaze, penLine, sprite, drawSprite,
  bbox, path, ink, sketch, hatch, clamp, lerp, ease, span, ribbon, granulate, shadeEdge, blooms, speckle, strokes } from '../../engine/watercolor.js';
import { M, MY, LW, LH, cam, fireflies, moon } from '../../engine/stage.js';
import { foliage, plant, PAL } from '../../engine/scenery.js';
import { brushWash, softStars } from '../crow-and-pitcher/scene.js';
import { flecks, grassFlicks, cumulus } from '../north-wind-and-sun/scene.js';

const INKC = '#3a2c24';
const TAU = Math.PI * 2;
// every wash goes through dz() first (see below), so long straight edges do not bulge
const wash = (g, shape, o) => wash0(g, dz(shape), o);
const brushW = (g, shape, cols, o) => brushWash(g, dz(shape, 40), cols, o);

// ---------------------------------------------------------------- moods
// The land's own colours are painted once (a fresh June morning); a mood is its sky, a painterly glaze and a light pass.
export const MOODS = {
  dawn: { name: 'dawn', sky: ['#97a3cc', '#e6b8c0', '#fcdcae'], cloud: '#fde6d8', cloudShade: '#c29ab8', sun: [1092, 378], sunCol: '#fff2cc', glow: '#ffd49a',
    haze: '#f6d6cc', hazeK: 0.34, shadow: '#6a5c96', shadowA: 0.34 },
  morning: { name: 'morning', sky: ['#88b0d4', '#cde0e6', '#f4eed8'], cloud: '#fffaf0', cloudShade: '#b4c0d4', sun: [240, 40], sunCol: '#fffbea', glow: '#fff4d0',
    haze: '#e8eee8', hazeK: 0.4, shadow: '#5c6894', shadowA: 0.3 },
  dusk: { name: 'dusk', sky: ['#8a84b8', '#e4a6a2', '#f9cc8a'], cloud: '#fbdcc4', cloudShade: '#bc88a2', sun: [690, 452], sunCol: '#ffe0a0', glow: '#ffbe78',
    haze: '#f2c4a8', hazeK: 0.34, shadow: '#684a84', shadowA: 0.4 },
  night: { name: 'night', sky: ['#16203c', '#283860', '#4a5884'], cloud: '#7c86a8', cloudShade: '#38426a', moon: [1500, 150], glow: '#ffb860',
    haze: '#56648c', hazeK: 0.35, shadow: '#2c3260', shadowA: 0.3 },
};
const MD = (m) => (typeof m === 'object' ? m : MOODS[m] || MOODS.dawn);
// the land's colours (one fresh green valley)
const C = {
  grass: ['#9cb06c', '#87a05e', '#b2bc76', '#7a9256', '#a6b882', '#c0c482'], meadow: ['#a8b874', '#94aa66', '#bcc27c', '#c8c88c'],
  hedge: ['#56693c', '#4a5e36', '#677c44', '#73884a'], leaf: ['#6f8a46', '#7f9a52', '#5e7640', '#94a85c'],
  earth: ['#c2a47c', '#ab8c66', '#d0b48c', '#b89870'], dust: ['#e0ccaa', '#d4bf9c', '#cbb698', '#e4d4b6'],
  stone: ['#d2c6b0', '#c4b8a2', '#b8ae9c', '#ccbc9e', '#bcb0a2', '#d8ccb4'], cobble: ['#b8ac9a', '#a89e90', '#c6b8a2', '#9c948a', '#bcae96', '#aca4a0'],
  thatch: '#c8a564', thatchDark: '#8a6a34', tile: ['#b8644a', '#a85a44', '#c4745a', '#9c5040'], wood: '#8a6a4c', woodDark: '#5a4232',
  lime: '#f4efe3', limeShade: '#d8d4cc', door: '#5f84ae', straw: ['#e4c87c', '#d8b464', '#ecd89a', '#c8a458'], far: ['#a8b8a0', '#9cb094', '#b4c0a4'],
};
// set-up timing per painter (ms)
export const TIMING = {};
const tm = (k, fn) => { const t0 = performance.now(); const v = fn(); TIMING[k] = (TIMING[k] || 0) + performance.now() - t0; return v; };

// ---------------------------------------------------------------- cameras and layers
// a camera looking at (cx, cy) with zoom z, kept inside the painted page
export function view(cx, cy, z) {
  const hw = W / 2 / z, hh = H / 2 / z;
  return { z, x: clamp(cx, -M + hw, W + M - hw) - W / 2, y: clamp(cy, -MY + hh, H + MY - hh) - H / 2 };
}
export const RES = 2;
export function hlayer(fn, res = RES) {
  const c = canvas(LW * res, LH * res), g = c.getContext('2d'); g.scale(res, res); g.translate(M, MY); fn(g, c); return c;
}
export const drawH = (g, c, img, alpha = 1) => { cam(g, c, 1); const a = g.globalAlpha; g.globalAlpha = a * alpha; g.drawImage(img, -M, -MY, LW, LH); g.globalAlpha = a; };
function to8(c) { return tm("to8", () => { const o = canvas(c.width, c.height, false); o.getContext("2d").drawImage(c, 0, 0); return o; }); }
function cloneC(c) { return tm("clone", () => { const o = canvas(c.width, c.height); o.getContext("2d").drawImage(c, 0, 0); return o; }); }
const pageG = (c, res = RES) => { const g = c.getContext('2d'); g.setTransform(res, 0, 0, res, M * res, MY * res); return g; };
function grain(c, s = 0.2, seed = 5) { tm("grain", () => grain0(c, s, seed)); }
function grain0(c, s, seed) { const g = c.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); granulate(g, c.width, c.height, s, seed); g.restore(); }

// Glaze everything already painted on canvas c (not the empty parts) for a mood, with broad uneven brush strokes rather
// than a flat tint (after crow-and-pitcher's moodGlaze). res: pixels per page unit of that canvas.
export function moodGlaze(c, mood, res = 1, seed = 5, o = {}) {
  const m = MD(mood), k = o.k ?? 1;
  const w = c.width, h = c.height, q = 4, small = canvas(Math.ceil(w / q), Math.ceil(h / q)), t = small.getContext('2d'), r = rng(seed);
  t.setTransform(1 / q, 0, 0, 1 / q, 0, 0);
  const tmp = canvas(w, h), tf = tmp.getContext('2d');
  const keep = canvas(w, h); keep.getContext('2d').drawImage(c, 0, 0);
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
    t.fillStyle = '#6474b4'; t.fillRect(0, 0, w, h);
    strokesOf(['#4a5a9c', '#7a88c0', '#56649e', '#8a90b8'], 46, 90, 0.55, -0.05);
    apply('multiply', 0.94 * k);
    t.fillStyle = 'rgba(30,40,100,1)'; t.fillRect(0, 0, w, h); apply('soft-light', 0.3 * k);
  } else if (m.name === 'dusk') {
    const lg = t.createLinearGradient(0, 0, w, h * 0.4);
    lg.addColorStop(0, 'rgba(255,190,120,1)'); lg.addColorStop(0.6, 'rgba(240,150,140,1)'); lg.addColorStop(1, 'rgba(170,110,150,1)');
    t.fillStyle = lg; t.fillRect(0, 0, w, h); strokesOf(['#ffb070', '#f08a8a', '#c87ab0', '#ffd090'], 36, 80, 0.5, 0.03);
    apply('soft-light', 0.72 * k);
    t.fillStyle = '#f4d2c4'; t.fillRect(0, 0, w, h); strokesOf(['#e8b4b0', '#f4c8a0', '#d4acc4'], 30, 90, 0.6, 0.03);
    apply('multiply', 0.5 * k);
  } else if (m.name === 'dawn') {
    // rose-gold light from the sun's side, cool lavender in the shade, pearly and soft
    const sx = (m.sun[0] + M) * res, lg = t.createRadialGradient(sx, 0, 0, sx, 0, w * 0.7);
    lg.addColorStop(0, 'rgba(255,206,150,1)'); lg.addColorStop(0.5, 'rgba(246,176,170,1)'); lg.addColorStop(1, 'rgba(176,156,206,1)');
    t.fillStyle = lg; t.fillRect(0, 0, w, h); strokesOf(['#ffc89a', '#f2a8b0', '#c4a8dc', '#ffe0b0'], 36, 80, 0.45, 0.02);
    apply('soft-light', 0.62 * k);
    t.fillStyle = '#ece0ea'; t.fillRect(0, 0, w, h); strokesOf(['#e4d0e4', '#f2dcd0', '#d8d0e8'], 30, 90, 0.55, 0.02);
    apply('multiply', 0.26 * k);
  } else {
    t.fillStyle = 'rgba(255,226,160,1)'; t.fillRect(0, 0, w, h); strokesOf(['#ffe8b0', '#f8d890', '#fff4d8'], 30, 90, 0.5, 0.02);
    apply('soft-light', 0.32 * k);
  }
  const g = c.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(keep, 0, 0); g.restore();
}

// ---------------------------------------------------------------- small painting helpers
// split long edges so a wash's bleed stays proportionate (wash deforms each edge by a share of its length)
function dz(poly, step = 22) {
  const out = [];
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]); }
  return out;
}
const rect = (x0, y0, x1, y1) => dz([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
// a rounded stone (cobble, wall stone, bridge stone): body, a lit top, a shaded foot, and a broken pen outline
function stone(g, x, y, w, h, col, seed, o = {}) {
  const r = rng(seed), j = () => r.range(-0.08, 0.08);
  const st = smooth([[x - w * (0.5 + j()), y], [x - w * (0.42 + j()), y - h * (0.42 + j())], [x, y - h * (0.5 + j())], [x + w * (0.44 + j()), y - h * (0.4 + j())], [x + w * (0.5 + j()), y + h * j()],
    [x + w * (0.42 + j()), y + h * (0.42 + j())], [x, y + h * (0.5 + j())], [x - w * (0.44 + j()), y + h * (0.4 + j())]], true, 3);
  g.fillStyle = rgba(col, o.alpha ?? 0.95); path(g, st); g.fill();
  g.save(); path(g, st); g.clip();
  g.fillStyle = rgba(tint(col, 0.55), 0.6); g.beginPath(); g.ellipse(x - w * 0.12, y - h * 0.22, w * 0.36, h * 0.24, 0, 0, TAU); g.fill();
  g.fillStyle = rgba(shade(col, 0.4), 0.4); g.beginPath(); g.ellipse(x + w * 0.1, y + h * 0.5, w * 0.55, h * 0.3, 0, 0, TAU); g.fill();
  g.restore();
  if (o.ink !== false) ink(g, o.half ? st.slice(Math.floor(st.length * 0.45)) : st, { closed: !o.half, width: o.lw ?? 1.1, alpha: o.inkA ?? 0.6, wobble: 0.3, gaps: 0.6, seed: seed + 1 });
  return st;
}
// a small round tree (distant or middle), trunk, a crown of washes lit from the upper left, ink on its top edge
function roundTree(g, x, gy, R, seed, o = {}) {
  const r = rng(seed), cols = o.cols || C.hedge, haze = o.haze || 0, hc = o.hazeCol || '#e8e4d4', col = (c) => mix(c, hc, haze);
  const cy = gy - R * (o.tall || 1.25);
  g.strokeStyle = rgba(col('#5a4636'), 0.85); g.lineWidth = Math.max(1, R * 0.12); g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, gy); g.quadraticCurveTo(x + R * 0.05, (gy + cy) / 2, x - R * 0.04, cy + R * 0.2); g.stroke();
  const sh = fluffy(x, cy, R, R * (o.squash || 0.88), 8, 0.2, seed);
  wash(g, sh, { color: col(cols[seed % cols.length]), opacity: 0.95, seed, layers: 12, under: o.under ?? col('#e6ddc4'), bleed: 0.04, edge: 0.3 });
  g.save(); path(g, sh); g.clip(); g.filter = `blur(${Math.max(1, R * 0.18).toFixed(1)}px)`;
  g.fillStyle = rgba(col(shade(cols[0], 0.4)), 0.5); g.beginPath(); g.ellipse(x + R * 0.2, cy + R * 0.55, R, R * 0.45, 0, 0, TAU); g.fill();
  g.fillStyle = rgba(col(tint(C.leaf[3], 0.4)), 0.5); g.beginPath(); g.ellipse(x - R * 0.3, cy - R * 0.4, R * 0.5, R * 0.3, 0, 0, TAU); g.fill();
  g.restore();
  if (R > 14 && !o.noDabs) { g.save(); path(g, sh); g.clip();
    for (let k = 0; k < R * 1.2; k++) { const a = r() * TAU, d = Math.sqrt(r()), lx = x + Math.cos(a) * R * d, ly = cy + Math.sin(a) * R * 0.85 * d, up = (cy - ly) / R;
      g.fillStyle = rgba(col(up > 0.1 ? tint(r.pick(C.leaf), 0.3) : shade(r.pick(C.leaf), 0.3)), 0.55); g.beginPath(); g.ellipse(lx, ly, R * 0.09, R * 0.06, r() * 3, 0, TAU); g.fill(); }
    g.restore(); }
  ink(g, sh.filter(([, py]) => py < cy + R * 0.1), { width: o.lw || 0.8, alpha: o.inkA ?? 0.45, gaps: 1.2, seed: seed + 3 });
  return sh;
}
// a run of hedgerow along a line (pts), height h(x): leafy humps, dark under, lit on top, ink scallops; with trees
function hedgerow(g, pts, h, seed, o = {}) {
  const r = rng(seed), haze = o.haze || 0, hc = o.hazeCol || '#e8e4d4', col = (c) => mix(c, hc, haze);
  const line = smooth(pts, false, 8), top = [];
  for (const [x, y] of line) top.push([x, y - h * (0.75 + 0.35 * noise1(x * 0.02, seed)) ]);
  const body = top.concat(line.slice().reverse().map(([x, y]) => [x, y + h * 0.12]));
  wash(g, body, { color: col(C.hedge[1]), opacity: 0.95, seed, layers: 12, under: col('#d8d4bc'), bleed: 0.02, edge: 0.2 });
  // humps
  for (let i = 0; i < line.length; i += o.step || 3) {
    const [x, y] = line[i], hh = h * r.range(0.7, 1.1), R = hh * r.range(0.45, 0.7);
    const sh = fluffy(x, y - hh * 0.55, R * 1.3, R, 7, 0.22, seed + i);
    wash(g, sh, { color: col(r.pick(C.hedge)), opacity: 0.9, seed: seed + 100 + i, layers: 8, bleed: 0.04, edge: 0.2 });
    g.fillStyle = rgba(col(tint(r.pick(C.leaf), 0.35)), 0.5); g.beginPath(); g.ellipse(x - R * 0.3, y - hh * 0.75, R * 0.6, R * 0.3, 0, 0, TAU); g.fill();
  }
  g.save(); path(g, body); g.clip(); g.filter = `blur(${Math.max(1, h * 0.12).toFixed(1)}px)`;
  g.strokeStyle = rgba(col('#2e3a22'), 0.45); g.lineWidth = h * 0.35; path(g, line.map(([x, y]) => [x, y + h * 0.05]), false); g.stroke(); g.restore();
  if (h > 12) { g.save(); path(g, body); g.clip(); for (let k = 0; k < line.length * (o.dabs ?? 2); k++) { const [x, y] = r.pick(line), dy = r.range(0, h);
    g.fillStyle = rgba(col(dy > h * 0.55 ? tint(r.pick(C.leaf), 0.3) : shade(r.pick(C.leaf), 0.25)), 0.55); g.beginPath(); g.ellipse(x + r.range(-6, 6), y - dy, h * 0.08, h * 0.05, r() * 3, 0, TAU); g.fill(); } g.restore(); }
  ink(g, top.filter((_, i) => i % 2 === 0), { width: o.lw || 0.9, alpha: o.inkA ?? 0.5, gaps: 1.3, seed: seed + 7 });
  return { top, line, body };
}
// a hill band: brushed wash with a sketched top
function hillBand(g, top, bottom, cols, seed, o = {}) {
  const sh = top.concat([[top[top.length - 1][0], bottom], [top[0][0], bottom]]);
  brushW(g, sh, cols, { seed, count: o.count || 90, width: o.width || [16, 44], len: o.len || [80, 300], angle: o.angle || (() => -0.03), alpha: [0.12, 0.28], base: o.base ?? 0.55, under: o.under ?? true, lifts: o.lifts ?? 0.18 });
  sketch(g, top, { alpha: o.inkA ?? 0.4, width: o.lw ?? 1, seed: seed + 1 });
  return sh;
}
const hillLine = (x0, x1, y, amp, seed, step = 30, f = 0.0022) => { const pts = []; for (let x = x0; x <= x1; x += step) pts.push([x, y - amp * (0.5 + 0.5 * Math.sin(x * f + seed) * Math.sin(x * f * 0.43 + seed * 2)) - amp * 0.3 * noise1(x * 0.008, seed)]); return smooth(pts, false, 3); };
// interpolate along a polyline by x (polyline sorted by x)
function yOn(line, x) { if (x <= line[0][0]) return line[0][1]; for (let i = 1; i < line.length; i++) if (line[i][0] >= x) { const a = line[i - 1], b = line[i]; return lerp(a[1], b[1], (x - a[0]) / ((b[0] - a[0]) || 1)); } return line[line.length - 1][1]; }

// ---------------------------------------------------------------- wildflowers (painted)
function foxglove(g, x, y, h, seed, o = {}) {
  const r = rng(seed), lean = o.lean ?? r.gauss(0, 0.08), cols = o.cols || ['#c868a0', '#d888b8', '#b8588c'], s = h / 200;
  const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push([x + lean * h * t + Math.sin(t * 2) * 3 * s, y - h * t]); }
  // a rosette of soft leaves at the foot
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.55, L = h * 0.22; g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = rgba(r.pick(C.leaf), 0.85); g.beginPath(); g.ellipse(L * 0.55, 0, L * 0.6, L * 0.2, 0, 0, TAU); g.fill(); g.restore(); }
  g.save(); g.strokeStyle = rgba('#5e7640', 0.95); g.lineWidth = Math.max(1, 3 * s); g.lineCap = 'round'; path(g, smooth(pts, false, 3), false); g.stroke(); g.restore();
  for (let k = 3; k <= 10; k++) {
    const [bx0, by0] = pts[k], t = k / 10, R = ((1 - t) * 9 + 3.5) * s * 1.4, side = k % 2 ? 1 : -1;
    if (t > 0.88) { g.fillStyle = rgba(mix(cols[0], '#7f9a52', 0.5), 0.95); g.beginPath(); g.ellipse(bx0 + side * 2 * s, by0, 2.4 * s, 3.6 * s, 0.3, 0, TAU); g.fill(); continue; }
    const bx = bx0 + side * R * 0.6, by = by0 + R * 0.3;
    const bell = smooth([[bx - R * 0.4, by - R * 0.6], [bx + R * 0.4, by - R * 0.6], [bx + R * 0.66, by + R * 0.7], [bx, by + R * 0.85], [bx - R * 0.66, by + R * 0.7]]);
    g.fillStyle = rgba(cols[k % cols.length], 0.95); path(g, bell); g.fill();
    g.fillStyle = rgba(shade(cols[0], 0.45), 0.75); g.beginPath(); g.ellipse(bx, by + R * 0.6, R * 0.45, R * 0.2, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(250,240,245,0.85)'; for (let q = 0; q < 3; q++) { g.beginPath(); g.arc(bx + (q - 1) * R * 0.2, by + R * 0.35, R * 0.08, 0, TAU); g.fill(); }
    if (R > 5) ink(g, bell, { closed: true, width: 0.7, alpha: 0.55, gaps: 0.5, seed: seed + k });
  }
  ink(g, pts, { width: 0.7, alpha: 0.45, seed: seed + 50 });
}
function cowParsley(g, x, y, h, seed, o = {}) {
  const r = rng(seed), s = h / 160, lean = r.gauss(0, 0.1);
  const top = [x + lean * h, y - h];
  g.save(); g.strokeStyle = rgba('#6a8048', 0.9); g.lineWidth = Math.max(0.8, 2 * s); g.lineCap = 'round';
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * h * 0.3, y - h * 0.6, top[0], top[1]); g.stroke();
  // feathery leaves low down
  for (let k = 0; k < 3; k++) { const ly = y - h * (0.15 + k * 0.15), sd = k % 2 ? 1 : -1; g.lineWidth = Math.max(0.6, 1 * s); g.beginPath(); g.moveTo(x + lean * h * 0.15, ly); g.quadraticCurveTo(x + sd * 14 * s, ly - 6 * s, x + sd * 26 * s, ly + 2 * s); g.stroke();
    for (let q = 0; q < 5; q++) { g.fillStyle = rgba(r.pick(C.leaf), 0.7); g.beginPath(); g.ellipse(x + sd * (8 + q * 4) * s, ly - 2 * s + r.gauss(0, 2 * s), 3 * s, 1.6 * s, r() * 3, 0, TAU); g.fill(); } }
  // umbels: lacy white domes of tiny florets on spokes
  const umbels = o.n || 3;
  for (let u = 0; u < umbels; u++) {
    const ux = top[0] + (u - (umbels - 1) / 2) * 22 * s + r.gauss(0, 4 * s), uy = top[1] + Math.abs(u - (umbels - 1) / 2) * 14 * s + r.gauss(0, 3 * s), R = r.range(12, 18) * s;
    g.lineWidth = Math.max(0.5, 0.8 * s); g.strokeStyle = rgba('#6a8048', 0.8); g.beginPath(); g.moveTo(top[0], top[1] + 16 * s); g.lineTo(ux, uy + R * 0.25); g.stroke();
    for (let q = 0; q < 9; q++) { const a = Math.PI + (q / 8) * Math.PI, ex = ux + Math.cos(a) * R, ey = uy + Math.sin(a) * R * 0.45; g.beginPath(); g.moveTo(ux, uy + R * 0.25); g.lineTo(ex, ey); g.stroke();
      for (let f = 0; f < 6; f++) { g.fillStyle = rgba(f % 3 ? '#fbf6ea' : '#efe8d4', 0.95); g.beginPath(); g.arc(ex + r.gauss(0, 2.6 * s), ey + r.gauss(0, 1.6 * s) - 1 * s, Math.max(0.6, 1.5 * s), 0, TAU); g.fill(); } }
  }
}
function dogRose(g, x, y, R, seed, o = {}) {
  const r = rng(seed), col = o.col || r.pick(['#f2b8c0', '#f6ccd0', '#eaa4b2', '#fbe4e4']);
  for (let p = 0; p < 5; p++) { const a = p / 5 * TAU + r.gauss(0, 0.1) - Math.PI / 2; g.fillStyle = rgba(col, 0.95); g.beginPath(); g.ellipse(x + Math.cos(a) * R * 0.55, y + Math.sin(a) * R * 0.5, R * 0.5, R * 0.42, a, 0, TAU); g.fill(); }
  g.fillStyle = rgba(tint(col, 0.5), 0.7); g.beginPath(); g.arc(x - R * 0.15, y - R * 0.15, R * 0.35, 0, TAU); g.fill();
  g.fillStyle = '#e8c048'; g.beginPath(); g.arc(x, y, R * 0.22, 0, TAU); g.fill();
  if (R > 4) ink(g, ellipse(x, y, R * 1.02, R * 0.95, 10), { closed: true, width: 0.6, alpha: 0.4, gaps: 1.2, seed: seed + 3 });
}
function rambler(g, pts, seed, o = {}) { // a dog-rose briar: arching thorny stem, leaves, roses
  const r = rng(seed), line = smooth(pts, false, 5), s = o.s || 1;
  ink(g, line, { color: '#4a5a34', width: 1.6 * s, alpha: 0.85, seed });
  for (let i = 1; i < line.length; i += 2) { const [lx, ly] = line[i];
    for (let q = 0; q < 2; q++) { g.save(); g.translate(lx, ly); g.rotate(r() * TAU); g.fillStyle = rgba(r.pick(C.leaf), 0.85); g.beginPath(); g.ellipse(5 * s, 0, 5 * s, 2.8 * s, 0, 0, TAU); g.fill(); g.restore(); }
    if (r() < (o.roses ?? 0.35)) dogRose(g, lx + r.gauss(0, 4 * s), ly + r.gauss(0, 3 * s), r.range(6, 8.5) * s, seed + i * 7); }
}
function buttercups(g, b, n, seed, s = 1) { const r = rng(seed); for (let i = 0; i < n; i++) { const x = r.range(b.x0, b.x1), y = r.range(b.y0, b.y1), k = s * (0.6 + 0.6 * (y - b.y0) / (b.y1 - b.y0 + 1));
  g.strokeStyle = rgba('#6a8048', 0.7); g.lineWidth = 0.7 * k; g.beginPath(); g.moveTo(x, y + 6 * k); g.lineTo(x, y); g.stroke();
  g.fillStyle = rgba(r() < 0.75 ? '#f2cc40' : '#fbf4e4', 0.95); g.beginPath(); g.arc(x, y, 2.6 * k, 0, TAU); g.fill(); } }

// a little sheep (side view, facing f = 1 right / -1 left), body s px long; head down (grazing) or up
export function paintSheep(g, x, y, s, f = 1, seed = 1, o = {}) {
  const r = rng(seed), down = o.down ?? 0.6;
  g.save(); g.translate(x, y); g.scale(f, 1);
  g.fillStyle = rgba(o.shadow || '#6a6a80', 0.2); g.beginPath(); g.ellipse(0, 0, s * 0.6, s * 0.1, 0, 0, TAU); g.fill();
  g.strokeStyle = rgba('#3a302a', 0.9); g.lineWidth = Math.max(0.8, s * 0.06); g.lineCap = 'round';
  for (const lx of [-0.28, -0.16, 0.18, 0.28]) { g.beginPath(); g.moveTo(lx * s, -s * 0.2); g.lineTo(lx * s, 0); g.stroke(); }
  const body = fluffy(0, -s * 0.36, s * 0.48, s * 0.26, 11, 0.16, seed);
  g.fillStyle = rgba(o.wool || '#f4eee0', 1); path(g, body); g.fill();
  g.save(); path(g, body); g.clip(); g.fillStyle = rgba('#b8b0a8', 0.45); g.beginPath(); g.ellipse(0, -s * 0.18, s * 0.5, s * 0.14, 0, 0, TAU); g.fill(); g.restore();
  const hx = s * 0.5, hy = -s * 0.36 + down * s * 0.26;
  if (!o.headless) { g.fillStyle = '#4a3c34'; g.beginPath(); g.ellipse(hx, hy, s * 0.13, s * 0.09, 0.5 + down * 0.6, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(hx - s * 0.06, hy - s * 0.07, s * 0.06, s * 0.025, -0.3, 0, TAU); g.fill(); }
  if (s > 10) ink(g, body.filter((_, i) => i % 2 === 0), { closed: true, width: 0.8, alpha: 0.55, gaps: 0.8, seed: seed + 2 });
  g.restore();
}

// ---------------------------------------------------------------- skies
// hz: where the land starts. sun: draw the sun disc (dawn/dusk) or its glare (morning).
export function paintSky(g, mood, o = {}) {
  const m = MD(mood), { hz = 470, seed = 3, x0 = -M, x1 = W + M, y0 = -MY, y1 = H + MY } = o, r = rng(seed), SW = x1 - x0 + 40;
  g.fillStyle = '#f4ecdc'; g.fillRect(x0 - 20, y0 - 10, SW, y1 - y0 + 20);
  const grd = g.createLinearGradient(0, y0, 0, hz + 30);
  grd.addColorStop(0, m.sky[0]); grd.addColorStop(0.6, m.sky[1]); grd.addColorStop(1, m.sky[2]);
  g.globalAlpha = 0.9; g.fillStyle = grd; g.fillRect(x0 - 20, y0 - 10, SW, y1 - y0 + 20); g.globalAlpha = 1;
  const box = [[x0 - 40, y0 - 40], [x1 + 40, y0 - 40], [x1 + 40, hz + 60], [x0 - 40, hz + 60]];
  brushW(g, box, [m.sky[0], tint(m.sky[0], 0.3), m.sky[1], shade(m.sky[0], 0.08)], { seed, count: Math.round(70 * SW / 2100), width: [30, 90], len: [200, 640], alpha: [0.1, 0.24], base: 0.04, blur: 3, angle: () => -0.03, lifts: m.name === 'night' ? 0 : 0.18 });
  const sunX = o.sunX ?? m.sun?.[0], sunY = o.sunY ?? m.sun?.[1];
  if (m.name === 'dawn' || m.name === 'dusk') {
    if (o.sun !== false) {
      pool(g, sunX, sunY, 760, 420, m.glow, 0.55); pool(g, sunX, sunY, 300, 200, '#fff0c8', 0.7);
      g.save(); g.filter = 'blur(2.5px)'; g.fillStyle = rgba(m.sunCol, 0.97); g.beginPath(); g.arc(sunX, sunY, 54, 0, TAU); g.fill(); g.restore();
      ink(g, ellipse(sunX, sunY, 56, 56, 30), { closed: true, color: '#d08a50', width: 1, alpha: 0.3, gaps: 1.4, seed: seed + 3 });
    }
    // long streaky clouds, lit from below
    for (let i = 0; i < (o.clouds ?? 10); i++) {
      const x = r.range(x0 - 60, x1), y = r.range(60, hz - 110), w = r.range(140, 380), hh = r.range(9, 20);
      const sh = smooth([[x - w, y + hh * 0.3], [x - w * 0.5, y - hh * 0.6], [x + w * 0.2, y - hh], [x + w, y], [x + w * 0.4, y + hh * 0.7], [x - w * 0.5, y + hh * 0.7]]);
      wash(g, sh, { color: m.name === 'dawn' ? r.pick(['#b8a0c4', '#c8a4bc', '#a8a0c8']) : r.pick(['#c88aa4', '#b88aa8']), opacity: 0.55, seed: seed + 50 + i, bleed: 0.06, layers: 14, edge: 0.15 });
      glaze(g, sh, x + (sunX - x) * 0.05, y + hh * 0.6, w * 0.9, hh * 0.7, m.name === 'dawn' ? '#ffd0b0' : '#ffc888', 0.75);
      ink(g, sh.slice(0, Math.floor(sh.length * 0.5)), { width: 0.8, alpha: 0.28, gaps: 1.5, seed: seed + 70 + i });
    }
  } else if (m.name === 'morning') {
    if (o.sun !== false) { pool(g, sunX, sunY, 620, 480, '#fffbea', 0.6); pool(g, sunX, sunY, 200, 200, '#ffffff', 0.6); }
    for (const [cx, cy, cw, sd] of (o.cumulus || [[360, 200, 200, 1], [1080, 130, 250, 2], [1720, 230, 190, 3], [700, 360, 110, 4], [1460, 340, 120, 5]])) cumulus(g, m, cx, cy, cw, seed + 40 + sd);
  } else {
    if (m.moon) pool(g, m.moon[0], m.moon[1], 560, 440, '#9aa8d0', 0.32);
  }
}

// ================================================================ THE FARMYARD
// Ground plane: the horizon is at y = 470, a grown-up standing at page y is personH(y) px tall (300 px at y = 880).
export const FARM = { hz: 470, personH: (y) => Math.max(0, 0.732 * (y - 470)) };
const HOUSE = { x: 352, ground: 646, S: 0.74 };
export const DOOR = [HOUSE.x + -4 * HOUSE.S, HOUSE.ground];                    // the foot of the blue door (doorstep)
export const PUMP = { x: 668, y: 748, spout: [700, 690] };                     // the pump's foot; its spout (water falls into the trough)
export const HENHOUSE = { x: 888, y: 716, door: [888, 642], ladder: [[870, 652], [800, 716]], perch: { x0: 812, x1: 868, y: 700 } };
export const GATE = { x: 1112, y: 712, w: 108 };                               // the picket gate's foot (centre), onto the lane
export const COW = { x: 1560, y: 838, face: -1 };                              // where Buttercup stands (feet), facing left
export const STOOL = { x: 1410, y: 862 };                                       // the milking stool, by her flank
export const BYRE = { x0: 1250, x1: 2060, ground: 694, bay: [1452, 2060], straw: { x: 1640, y: 690 }, lantern: [1462, 548] };
export const FARM_SPOTS = { DOOR, PUMP, HENHOUSE, GATE, COW, STOOL, BYRE, LANE: [1020, 560] };
const FREF = {};   // shapes recorded while painting the yard (for the light passes)

// --- the far valley: hazy hills, patchwork fields with hedgerows, little trees, a distant farm
function paintValley(g, seed = 20, o = {}) {
  const r = rng(seed), x0 = o.x0 ?? -M - 40, x1 = o.x1 ?? W + M + 40, hz = o.hz ?? 470;
  // the far range, blue-violet
  const far = hillLine(x0, x1, hz - 64, 70, seed, 30, 0.0019);
  hillBand(g, far, hz + 80, ['#a8aac4', '#b4b0c8', '#9ca4c0', '#bcb4c4'], seed + 1, { base: 0.5, inkA: 0.3 });
  // two green flanks of the valley, converging at the lane's end
  const L = smooth([[x0, hz - 66], [200, hz - 72], [520, hz - 40], [820, hz - 6], [1000, hz + 6], [1300, hz + 30]], false, 6);
  const R = smooth([[700, hz + 30], [980, hz + 4], [1180, hz - 18], [1480, hz - 46], [1760, hz - 60], [x1, hz - 52]], false, 6);
  const bands = [];
  for (const [line, sd, cols] of [[R, 7, C.far], [L, 3, ['#a4b494', '#98ac8c', '#b0bc9c']]]) {
    const sh = hillBand(g, line, hz + 140, cols.map((c) => mix(c, '#d8dcc8', 0.15)), seed + sd, { base: 0.6, inkA: 0.35, lifts: 0.25 });
    bands.push([line, sh]);
    // patchwork: field strips following the slope, hedgerow lines between them, dotted with trees
    g.save(); path(g, sh); g.clip();
    for (let k = 0; k < 6; k++) {
      const off = 10 + k * k * 4.2, strip = line.map(([x, y]) => [x, y + off]), nxt = line.map(([x, y]) => [x, y + 10 + (k + 1) * (k + 1) * 4.2]);
      const fill = strip.concat(nxt.slice().reverse()), c = [C.meadow[2], '#c8c08c', C.meadow[0], '#b8b07c', C.meadow[1], '#d0c494'][(k + sd) % 6];
      g.globalAlpha = 0.5; wash(g, fill, { color: mix(c, '#d8dcc8', 0.3 - k * 0.04), opacity: 0.5, seed: seed + 30 + k + sd * 10, bleed: 0.02, layers: 8, edge: 0.05 }); g.globalAlpha = 1;
      for (let x = line[0][0]; x < line[line.length - 1][0]; x += r.range(4, 8)) { const y = yOn(strip, x), s0 = 1.4 + k * 0.5; if (r() < 0.06) { x += 14; continue; }
        g.fillStyle = rgba(mix(r.pick(C.hedge), '#c8ccc0', 0.35 - k * 0.04), 0.85); g.beginPath(); g.ellipse(x, y - s0 * 0.5, s0 * 1.2, s0 * 0.8, 0, 0, TAU); g.fill(); }
      // cross hedges, running down the slope
      for (let q = 0; q < 5; q++) { const cx = r.range(line[0][0], line[line.length - 1][0]), ya = yOn(strip, cx), yb = yOn(nxt, cx + 12);
        for (let u = 0; u <= 1; u += 0.1) { const s0 = 1.4 + k * 0.5; g.fillStyle = rgba(mix(r.pick(C.hedge), '#c8ccc0', 0.3), 0.8); g.beginPath(); g.ellipse(cx + 12 * u, lerp(ya, yb, u) - s0 * 0.4, s0, s0 * 0.7, 0, 0, TAU); g.fill(); } }
      for (let q = 0; q < 3; q++) { const tx = r.range(line[0][0], line[line.length - 1][0]); roundTree(g, tx, yOn(strip, tx), 4 + k * 1.6, seed + 200 + k * 10 + q + sd * 100, { haze: 0.35 - k * 0.04, inkA: 0.3, lw: 0.6, noDabs: true }); }
    }
    g.restore();
  }
  // a little farm far off on the right flank, its chimney smoking (smoke is live)
  { const fx = 1600, fy = yOn(R, 1600) + 34;
    wash(g, rect(fx - 22, fy - 16, fx + 22, fy), { color: '#ece4d4', opacity: 0.95, seed: seed + 60, under: true, layers: 8 });
    wash(g, [[fx - 26, fy - 15], [fx - 14, fy - 28], [fx + 14, fy - 28], [fx + 26, fy - 15]], { color: '#a87a5c', opacity: 0.9, seed: seed + 61, layers: 8 });
    ink(g, [[fx - 22, fy], [fx - 22, fy - 16], [fx + 22, fy - 16], [fx + 22, fy]], { width: 0.7, alpha: 0.45, seed: seed + 62 });
    roundTree(g, fx + 40, fy + 2, 13, seed + 63, { haze: 0.25, inkA: 0.35, lw: 0.6 }); }
  return { far, L, R };
}

// --- the meadow behind the yard fence, with the lane winding away from the gate up into the valley
const LANE_BACK = [[1112, 716], [1100, 690], [1070, 660], [1040, 630], [1030, 600], [1048, 574], [1060, 550], [1040, 530], [1012, 512], [1002, 494], [1004, 480]];
const backLaneW = (y) => 4 + Math.pow(clamp((y - 476) / 240), 1.3) * 118;
function backLaneShape() {
  const P = smooth(LANE_BACK, false, 6), A = [], B = [];
  for (const [x, y] of P) { const w = backLaneW(y) / 2; A.push([x - w, y]); B.push([x + w, y]); }
  return A.concat(B.reverse());
}
function paintMeadow(g, seed = 40) {
  const r = rng(seed);
  const top = smooth([[-M - 40, 500], [300, 506], [700, 492], [1000, 488], [1300, 496], [1700, 506], [W + M + 40, 498]], false, 6);
  const sh = top.concat([[W + M + 40, 760], [-M - 40, 760]]);
  brushW(g, sh, C.meadow, { seed, count: 200, width: [14, 40], len: [60, 260], angle: () => 0.01, alpha: [0.14, 0.3], base: 0.6, under: true, lifts: 0.22 });
  // hedgerows crossing the meadow, getting bigger nearer, with trees
  const HR = [[[-M - 40, 524], [300, 530], [640, 520], [900, 516]], [[1180, 520], [1500, 530], [1800, 524], [W + M + 40, 528]], [[-M - 40, 580], [200, 590], [520, 572]], [[1260, 586], [1600, 600], [W + M + 40, 590]]];
  HR.forEach((pts, i) => { hedgerow(g, pts, 10 + i * 4, seed + 10 + i, { step: 2, lw: 0.7, inkA: 0.4 });
    for (let q = 0; q < 3; q++) { const tx = r.range(pts[0][0] + 40, pts[pts.length - 1][0] - 40); roundTree(g, tx, yOn(smooth(pts, false, 4), tx) - 2, 16 + i * 6, seed + 50 + i * 5 + q, { inkA: 0.45 }); } });
  // the lane, a pale earth track narrowing into the valley
  const lane = backLaneShape();
  brushW(g, lane, C.dust, { seed: seed + 5, count: 60, width: [6, 20], len: [30, 120], angle: () => -1.2, alpha: [0.15, 0.32], base: 0.6, under: '#f2e8d4', lifts: 0.3 });
  const P = smooth(LANE_BACK, false, 6);
  // two wheel ruts and a grassy crown
  for (const sd of [-0.22, 0.22]) ink(g, P.map(([x, y]) => [x + sd * backLaneW(y), y]), { color: shade(C.dust[1], 0.35), width: 1, alpha: 0.35, gaps: 1.2, seed: seed + 6 + sd * 10 });
  for (let i = 0; i < P.length; i += 2) { const [x, y] = P[i]; grassFlicks(g, x, y, 2 + backLaneW(y) * 0.06, { seed: seed + 300 + i, n: 3, colors: [C.grass[1]], inkA: 0.25 }); }
  sketch(g, P.map(([x, y]) => [x - backLaneW(y) / 2, y]), { alpha: 0.4, width: 0.9, seed: seed + 7 });
  sketch(g, P.map(([x, y]) => [x + backLaneW(y) / 2, y]), { alpha: 0.4, width: 0.9, seed: seed + 8 });
  // grass texture and buttercups in the meadow
  hatch(g, sh, { color: shade(C.meadow[1], 0.3), count: 2600, len: 6, width: 0.8, alpha: 0.3, seed: seed + 9, dir: () => -Math.PI / 2 + 0.1, curve: 0.4, density: (x, y) => clamp((y - 500) / 260) });
  buttercups(g, { x0: -M, x1: 900, y0: 600, y1: 700 }, 160, seed + 11, 1);
  buttercups(g, { x0: 1250, x1: W + M, y0: 600, y1: 690 }, 120, seed + 12, 1);
  return { top, lane };
}

// --- the yard: packed earth, cobbled aprons before the house and the byre, a cobbled path from the door to the gate
const YPATH = smooth([[330, 660], [380, 712], [520, 770], [720, 800], [930, 778], [1060, 740], [1112, 716]], false, 10);
function distTo(line, x, y) { let best = 1e9; for (let i = 0; i < line.length - 1; i++) { const [ax, ay] = line[i], [bx, by] = line[i + 1], dx = bx - ax, dy = by - ay, u = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)); best = Math.min(best, Math.hypot(x - ax - u * dx, (y - ay - u * dy) * 1.6)); } return best; }
function cobbleYard(g, seed = 60) {
  const r = rng(seed), hz = FARM.hz;
  const yard = smooth([[-M - 40, 640], [240, 646], [560, 660], [760, 700], [980, 712], [1240, 704], [1700, 700], [W + M + 40, 704], [W + M + 40, LH], [-M - 40, LH]], true, 4);
  brushW(g, yard, C.earth.concat(C.dust), { seed, count: 300, width: [16, 44], len: [60, 260], angle: () => 0.02, alpha: [0.12, 0.28], base: 0.55, under: '#efe4d0', lifts: 0.3 });
  FREF.yard = yard;
  // worn grass along the edges of the yard and in its far corners
  for (const [cx, cy, rx, ry] of [[-40, 700, 220, 40], [680, 708, 120, 16], [1000, 724, 140, 14], [1960, 760, 160, 40], [140, 900, 260, 60], [1700, 940, 300, 70]]) {
    const gp = fluffy(cx, cy, rx, ry, 10, 0.35, seed + cx); wash(g, gp, { color: r.pick(C.grass), opacity: 0.55, seed: seed + 7 + cx, bleed: 0.08, layers: 14, edge: 0.1 });
    hatch(g, gp, { color: shade(C.grass[3], 0.3), count: Math.round(rx * ry / 30), len: 5 + (cy - hz) * 0.02, width: 0.8, alpha: 0.4, seed: seed + 8 + cx, dir: () => -Math.PI / 2 + 0.15, curve: 0.5 });
  }
  // cart ruts in the earth
  for (const [k, pts] of [[1, [[1500, 780], [1300, 820], [1100, 860], [900, 950], [760, 1100]]], [2, [[1560, 790], [1370, 834], [1180, 880], [990, 960], [860, 1100]]]]) ink(g, smooth(pts, false, 6), { color: shade(C.earth[1], 0.35), width: 1.4, alpha: 0.3, gaps: 1.6, seed: seed + 20 + k });
  // cobbles in perspective (bigger nearer): the aprons and the path, a few strays elsewhere
  const cobbled = (x, y) => {
    const n = noise1(x * 0.01 + y * 0.013, seed) * 0.5;
    if (y < 716 + n * 30 && x > 40 - n * 80 && x < 650 + n * 60) return 1;                       // before the house
    if (y > 690 && y < 790 + n * 50 - (x - 1240) * 0.02 && x > 1226 - n * 50) return 1;            // before the byre
    if (distTo(YPATH, x, y) < (26 + (y - hz) * 0.12) * (0.85 + n * 0.5)) return 1;                   // the path
    return 0;
  };
  g.save(); path(g, yard); g.clip();
  for (let y = 646; y < 1000; ) {
    const s = (y - hz) / 410, ch = 15 * s, cw = 27 * s;
    for (let x = -M - 40 + r.range(0, cw); x < W + M + 40; x += cw * r.range(0.95, 1.18)) {
      if (r() > cobbled(x, y)) continue;
      const c = r.pick(C.cobble);
      g.fillStyle = rgba('#5a4a3a', 0.22); g.beginPath(); g.ellipse(x + cw * 0.05, y + ch * 0.28, cw * 0.5, ch * 0.4, 0, 0, TAU); g.fill();
      stone(g, x, y, cw * r.range(0.74, 0.95), ch * r.range(0.72, 0.92), c, seed + Math.round(x * 3 + y * 7), { lw: 0.5 + s * 0.5, inkA: 0.32 + s * 0.12, half: s < 0.75 });
    }
    y += ch * 0.92;
  }
  g.restore();
  // a puddle catching the sky (its reflection is painted in the light pass)
  const pud = fluffy(760, 862, 80, 13, 9, 0.25, seed + 3);
  wash(g, pud, { color: '#8a8c98', opacity: 0.55, seed: seed + 4, layers: 10, edge: 0.4 }); FREF.puddle = pud;
  ink(g, pud.slice(0, Math.floor(pud.length / 2)), { width: 0.9, alpha: 0.5, gaps: 1, seed: seed + 5 });
  // grass tufts between the stones, straw scattered from the byre
  for (let i = 0; i < 60; i++) { const x = r.range(-80, 2000), y = r.range(660, 1000); grassFlicks(g, x, y, 4 + (y - 600) * 0.03, { seed: seed + 100 + i, n: 4, colors: [C.grass[1], C.grass[3]], inkA: 0.35 }); }
  for (let i = 0; i < 220; i++) { const x = r.range(1240, 2010), y = r.range(696, 860), s = (y - hz) / 410, a = r.gauss(0, 0.8), L = r.range(8, 22) * s;
    g.strokeStyle = rgba(r.pick(C.straw), 0.85); g.lineWidth = 1.4 * s; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.2 - 2, x + Math.cos(a) * L, y + Math.sin(a) * L * 0.4); g.stroke(); }
  // two milk churns by the byre's first post
  for (const [cx, cy, sd] of [[1404, 730, 1], [1442, 744, 2]]) {
    const body = smooth([[cx - 15, cy], [cx - 16, cy - 40], [cx - 10, cy - 52], [cx - 7, cy - 62], [cx + 7, cy - 62], [cx + 10, cy - 52], [cx + 16, cy - 40], [cx + 15, cy]], true, 3);
    wash(g, body, { color: '#b8bcc0', opacity: 0.97, seed: seed + 40 + sd, under: true, layers: 10 }); glaze(g, body, cx - 6, cy - 30, 5, 26, '#f4f6f8', 0.8);
    shadeEdge(g, body, { color: '#5a6068', alpha: 0.5, width: 12, dx: 6, dy: 0 });
    wash(g, rect(cx - 9, cy - 68, cx + 9, cy - 62), { color: '#9aa0a8', opacity: 0.97, seed: seed + 42 + sd, under: true, layers: 6 });
    ink(g, body, { closed: true, width: 1.2, alpha: 0.7, seed: seed + 44 + sd }); ink(g, [[cx - 16, cy - 40], [cx + 16, cy - 40]], { width: 1, alpha: 0.5 });
  }
  return yard;
}

// --- the farmhouse: whitewashed, thatched, a blue stable door in an arch of roses, an eyebrow window in the thatch
function farmhouse(g, seed = 3) {
  const { x, ground, S } = HOUSE, r = rng(seed);
  const P = (px, py) => [x + px * S, ground - py * S], R = (x0, y0, x1, y1) => dz([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)]), lw = (w) => Math.max(0.4, w * S);
  const half = 300, wallH = 236;
  // chimneys at both gable ends, whitewashed, with pots
  for (const [cx, sd] of [[-262, 1], [262, 2]]) {
    const ch = R(cx - 28, wallH + 60, cx + 28, wallH + 270);
    wash(g, ch, { color: C.lime, opacity: 0.98, seed: seed + sd, under: C.lime, bleed: 0.006 });
    shadeEdge(g, ch, { color: '#8a8478', alpha: 0.4, width: 26 * S, dx: -12 * S, dy: 0 });
    wash(g, R(cx - 34, wallH + 262, cx + 34, wallH + 280), { color: '#d8d0c4', opacity: 0.98, seed: seed + 10 + sd, under: true, bleed: 0.006 });
    penLine(g, ch, { closed: true, sharp: true, w: lw(2), alpha: 0.7, seed: seed + 20 + sd });
    for (const px of [cx - 14, cx + 12]) { const pot = R(px - 7, wallH + 280, px + 7, wallH + 308); wash(g, pot, { color: '#b86a4a', opacity: 0.96, seed: seed + 30 + px, under: true, layers: 8 }); penLine(g, pot, { closed: true, sharp: true, w: lw(1.4), alpha: 0.7 }); }
    FREF['chim' + sd] = P(cx, wallH + 308);
  }
  // walls: lime-washed, with cool blooms, faint brush streaks, a few flakes showing stone, a tarred plinth
  const wall = R(-half, 0, half, wallH);
  wash(g, wall, { color: C.lime, opacity: 0.98, seed: seed + 4, under: C.lime, bleed: 0.006 });
  blooms(g, wall, ['#e4e0d8', '#dcdde6', '#f0e6d2', '#e8e4ec'], { n: 12, alpha: 0.45, size: 0.18, seed: seed + 5 });
  strokes(g, wall, { color: '#b8b4ac', count: 160, len: 34 * S, width: 1.1, alpha: 0.16, seed: seed + 6, dir: () => -Math.PI / 2 + 0.04, curve: 0.1 });
  for (let k = 0; k < 5; k++) { const [fx, fy] = P(r.range(-270, 270), r.range(30, 200)), fl = fluffy(fx, fy, r.range(12, 22) * S, r.range(7, 12) * S, 7, 0.4, seed + 40 + k);
    wash(g, fl, { color: '#cfc2aa', opacity: 0.7, seed: seed + 50 + k, layers: 6, edge: 0.4 }); ink(g, fl, { closed: true, width: lw(0.9), alpha: 0.4, gaps: 1, seed: seed + 60 + k }); }
  wash(g, R(-half, 0, half, 22), { color: '#4c4642', opacity: 0.88, seed: seed + 7, bleed: 0.004, layers: 10 });
  shadeEdge(g, wall, { color: '#7c7468', alpha: 0.5, width: 80 * S, dy: 34 * S });
  penLine(g, [P(-half, 0), P(-half, wallH)], { sharp: true, w: lw(2.2), alpha: 0.7, seed: seed + 8 }); penLine(g, [P(half, 0), P(half, wallH)], { sharp: true, w: lw(2.2), alpha: 0.7, seed: seed + 9 });
  ink(g, [P(-half, 0), P(half, 0)], { width: lw(1.6), alpha: 0.6, seed: seed + 10 });
  FREF.houseWall = wall;
  // windows: deep reveals, white glazing bars, little curtains, slate sills, a geranium
  const windows = [];
  const win = (cx, y0, w, h, sd) => {
    const rev = R(cx - w / 2 - 8, y0 - 6, cx + w / 2 + 8, y0 + h + 8);
    wash(g, rev, { color: '#d4cec4', opacity: 0.95, seed: seed + sd, under: true, bleed: 0.004, layers: 8 });
    const gl = R(cx - w / 2, y0, cx + w / 2, y0 + h);
    wash(g, gl, { color: '#4a5866', opacity: 0.96, seed: seed + sd + 1, under: true, bleed: 0.004 });
    glaze(g, gl, ...P(cx - w * 0.2, y0 + h * 0.75), w * 0.5 * S, h * 0.35 * S, '#b8ccd8', 0.6);
    for (const sd2 of [-1, 1]) { const c0 = cx + sd2 * (w / 2 - 2), c1 = cx + sd2 * (w / 2 - 20); const cu = smooth([P(c0, y0 + h - 2), P(c1, y0 + h - 2), P(c1 - sd2 * 6, y0 + h * 0.45), P(c1 + sd2 * 2, y0 + 4), P(c0, y0 + 4)]);
      wash(g, cu, { color: '#f2e6d8', opacity: 0.9, seed: seed + sd + 3 + sd2, layers: 8 }); g.save(); path(g, cu); g.clip(); for (let q = 0; q < 6; q++) { g.strokeStyle = rgba('#c88a8a', 0.4); g.lineWidth = lw(1.5); const [lx0, ly0] = P(c1 + q * sd2 * 3.5, y0); g.beginPath(); g.moveTo(lx0, ly0); g.lineTo(lx0, ly0 - h * S); g.stroke(); } g.restore(); }
    for (const fx of [cx - w / 6, cx + w / 6]) penLine(g, [P(fx, y0), P(fx, y0 + h)], { sharp: true, w: lw(3.2), alpha: 0.9, color: '#f6f2e8' });
    penLine(g, [P(cx - w / 2, y0 + h / 2), P(cx + w / 2, y0 + h / 2)], { sharp: true, w: lw(3.2), alpha: 0.9, color: '#f6f2e8' });
    penLine(g, gl, { closed: true, sharp: true, w: lw(2.6), alpha: 0.85, seed: seed + sd + 4 });
    const sill = R(cx - w / 2 - 14, y0 - 12, cx + w / 2 + 14, y0);
    wash(g, sill, { color: '#8c8c90', opacity: 0.97, seed: seed + sd + 5, under: true, bleed: 0.004 }); penLine(g, sill, { closed: true, sharp: true, w: lw(1.6), alpha: 0.75 });
    // a pot of geraniums on the sill
    const [gx, gy] = P(cx + w * 0.28, y0); const pot = [[gx - 9 * S, gy - 22 * S], [gx + 9 * S, gy - 22 * S], [gx + 7 * S, gy], [gx - 7 * S, gy]];
    wash(g, pot, { color: '#b86a4a', opacity: 0.96, seed: seed + sd + 6, under: true, layers: 6 }); penLine(g, pot, { closed: true, sharp: true, w: lw(1.2), alpha: 0.7 });
    for (let q = 0; q < 6; q++) { g.fillStyle = rgba(r.pick(C.leaf), 0.9); g.beginPath(); g.ellipse(gx + r.gauss(0, 9 * S), gy - 28 * S + r.gauss(0, 4 * S), 6 * S, 4 * S, r() * 3, 0, TAU); g.fill(); }
    for (let q = 0; q < 5; q++) { g.fillStyle = rgba(q % 2 ? '#d0504a' : '#e0706a', 0.95); g.beginPath(); g.arc(gx + r.gauss(0, 6 * S), gy - 38 * S + r.gauss(0, 4 * S), 4.5 * S, 0, TAU); g.fill(); }
    windows.push({ x: P(cx, 0)[0], y: P(0, y0 + h / 2)[1], w: w * S, h: h * S });
  };
  win(-176, 78, 108, 110, 100); win(170, 78, 108, 110, 120);
  // the door: a blue stable door in a white frame, a stone step, roses all round
  const dx0 = -52, dx1 = 44, dh = 196;
  const frame = R(dx0 - 10, 0, dx1 + 10, dh + 10);
  wash(g, frame, { color: '#ece6da', opacity: 0.97, seed: seed + 140, under: true, bleed: 0.004 });
  const door = R(dx0, 2, dx1, dh);
  wash(g, door, { color: C.door, opacity: 0.97, seed: seed + 141, under: true, bleed: 0.004 });
  blooms(g, door, ['#7a9cc0', '#4e6e98', '#8aa8c4'], { n: 5, alpha: 0.35, size: 0.3, seed: seed + 142 });
  glaze(g, door, ...P(dx0 + 26, 150), 30 * S, 60 * S, '#b8d0e4', 0.5);
  for (let k = 1; k < 4; k++) penLine(g, [P(dx0 + k * 24, 4), P(dx0 + k * 24, dh - 2)], { sharp: true, w: lw(1.2), alpha: 0.45, seed: seed + 143 + k });
  penLine(g, [P(dx0, 100), P(dx1, 100)], { sharp: true, w: lw(2.2), alpha: 0.75, seed: seed + 147 });            // the stable door's split
  for (const ly of [30, 128, 176]) { const ledge = R(dx0 + 4, ly, dx1 - 4, ly + 9); wash(g, ledge, { color: shade(C.door, 0.2), opacity: 0.7, seed: seed + 150 + ly, layers: 6 }); }
  g.fillStyle = '#2e2a28'; g.beginPath(); g.arc(...P(dx1 - 16, 96), 4 * S, 0, TAU); g.fill();
  penLine(g, [P(dx1 - 30, 96), P(dx1 - 8, 96)], { sharp: true, w: lw(2.4), alpha: 0.85 });
  penLine(g, door, { closed: true, sharp: true, w: lw(2.4), alpha: 0.85, seed: seed + 148 });
  penLine(g, frame, { closed: true, sharp: true, w: lw(1.6), alpha: 0.6, seed: seed + 149 });
  const step = R(dx0 - 20, -10, dx1 + 20, 4); wash(g, step, { color: '#bcb2a2', opacity: 0.97, seed: seed + 155, under: true }); penLine(g, step, { closed: true, sharp: true, w: lw(1.4), alpha: 0.7 });
  FREF.door = door; FREF.windows = windows;
  // the thatched roof: deep and soft, block-cut ridge with liggers, an eyebrow over the attic window
  const roof = smooth([P(-half - 46, wallH - 26), P(-half - 30, wallH + 30), P(-half + 4, wallH + 120), P(-half + 30, wallH + 188), P(-half + 70, wallH + 204), P(0, wallH + 210),
    P(half - 70, wallH + 204), P(half - 30, wallH + 188), P(half - 4, wallH + 120), P(half + 30, wallH + 30), P(half + 46, wallH - 26), P(half + 10, wallH - 12), P(0, wallH - 8), P(-half - 10, wallH - 12)], true, 3);
  wash(g, roof, { color: C.thatch, opacity: 0.98, seed: seed + 160, under: true, bleed: 0.008 });
  glaze(g, roof, ...P(-100, wallH + 150), 300 * S, 70 * S, '#ecd494', 0.55);
  hatch(g, roof, { color: '#7d5e30', count: 1400, len: 22 * S, width: 1.1, alpha: 0.42, seed: seed + 161, dir: (px) => Math.PI / 2 - (px - x) / (half * S) * 0.35, curve: 0.2 });
  shadeEdge(g, roof, { color: '#6a4a24', alpha: 0.4, width: 60 * S, dy: -24 * S });
  // the eyebrow: the attic window, and the thatch swelling up over it
  const ex = 120, ey0 = wallH + 42, ew = 76, eh = 58;
  const ewin = R(ex - ew / 2, ey0, ex + ew / 2, ey0 + eh);
  wash(g, ewin, { color: '#4a5866', opacity: 0.96, seed: seed + 170, under: true, bleed: 0.004 });
  glaze(g, ewin, ...P(ex - 12, ey0 + eh * 0.7), 20 * S, 16 * S, '#b8ccd8', 0.6);
  penLine(g, [P(ex, ey0), P(ex, ey0 + eh)], { sharp: true, w: lw(3), alpha: 0.9, color: '#f6f2e8' }); penLine(g, [P(ex - ew / 2, ey0 + eh / 2), P(ex + ew / 2, ey0 + eh / 2)], { sharp: true, w: lw(3), alpha: 0.9, color: '#f6f2e8' });
  penLine(g, ewin, { closed: true, sharp: true, w: lw(2.4), alpha: 0.85 });
  const brow = ribbon([P(ex - ew / 2 - 48, ey0 + eh - 8), P(ex - ew / 2 - 10, ey0 + eh + 26), P(ex, ey0 + eh + 34), P(ex + ew / 2 + 10, ey0 + eh + 26), P(ex + ew / 2 + 48, ey0 + eh - 8)], 26 * S, 16 * S);
  wash(g, brow, { color: '#c09a58', opacity: 0.98, seed: seed + 171, under: true });
  hatch(g, brow, { color: '#6d4e26', count: 160, len: 12 * S, width: 1, alpha: 0.5, seed: seed + 172, dir: (px) => Math.PI / 2 + (px - P(ex, 0)[0]) / (80 * S) * 0.5 });
  penLine(g, brow, { sharp: true, closed: true, w: lw(1.6), alpha: 0.6 });
  FREF.attic = { x: P(ex, 0)[0], y: P(0, ey0 + eh / 2)[1], w: ew * S, h: eh * S };
  // the rolled eaves
  const eave = ribbon([P(-half - 50, wallH - 24), P(-half + 40, wallH - 10), P(0, wallH - 6), P(half - 40, wallH - 10), P(half + 50, wallH - 24)], 30 * S, 30 * S);
  wash(g, eave, { color: '#b28a48', opacity: 0.98, seed: seed + 173, under: true });
  hatch(g, eave, { color: '#6d4e26', count: 340, len: 12 * S, width: 1, alpha: 0.5, seed: seed + 174, dir: () => Math.PI / 2 });
  penLine(g, eave, { sharp: true, closed: true, w: lw(1.8), alpha: 0.7 });
  // the block-cut ridge: a band with a pointed (scalloped) lower edge, crossed liggers
  const ry0 = wallH + 168, ry1 = wallH + 212, rx0 = -half + 50, rx1 = half - 50;
  const ridge = [P(rx0 - 10, ry1 - 6), P(rx1 + 10, ry1 - 6)]; for (let px = rx1; px >= rx0; px -= 30) { ridge.push(P(px, ry0 + 6)); ridge.push(P(px - 15, ry0 - 8)); } ridge.push(P(rx0, ry0 + 6));
  wash(g, ridge, { color: '#d4b474', opacity: 0.98, seed: seed + 175, under: true, bleed: 0.004 });
  for (let px = rx0; px < rx1; px += 22) ink(g, [P(px, ry1 - 10), P(px + 22, ry0 + 2)], { width: lw(1), alpha: 0.5, seed: seed + 176 + px });
  for (let px = rx0 + 22; px < rx1 + 22; px += 22) ink(g, [P(px, ry1 - 10), P(px - 22, ry0 + 2)], { width: lw(1), alpha: 0.5, seed: seed + 177 + px });
  penLine(g, ridge, { sharp: true, closed: true, w: lw(1.8), alpha: 0.75 });
  penLine(g, roof.slice(0, Math.floor(roof.length * 0.74)), { sharp: true, w: lw(2.6), alpha: 0.8, seed: seed + 178 });
  FREF.houseRoof = roof;
  // roses round the door: two climbing stems from the foot of the frame, meeting in an arch over it
  for (const sd of [-1, 1]) {
    const bx = sd < 0 ? dx0 - 24 : dx1 + 24, arch = [P(bx, 0), P(bx + sd * 4, 80), P(bx - sd * 2, 160), P(bx - sd * 10, 220), P((dx0 + dx1) / 2 + sd * 30, 246), P((dx0 + dx1) / 2 - sd * 10, 250)];
    ink(g, smooth(arch, false, 5), { color: '#4a5a34', width: lw(2.4), alpha: 0.85, seed: seed + 180 + sd });
    const along = smooth(arch, false, 6);
    for (let i = 0; i < along.length; i += 1) { const [ax, ay] = along[i], R0 = r.range(16, 24) * S;
      const sh = fluffy(ax + r.gauss(0, 6 * S), ay + r.gauss(0, 6 * S), R0, R0 * 0.8, 7, 0.3, seed + 190 + i + sd * 50);
      wash(g, sh, { color: r.pick(C.leaf), opacity: 0.92, seed: seed + 200 + i + sd * 50, layers: 8, edge: 0.3 });
      g.fillStyle = rgba(tint(C.leaf[3], 0.3), 0.5); g.beginPath(); g.ellipse(ax - R0 * 0.3, ay - R0 * 0.3, R0 * 0.5, R0 * 0.3, 0, 0, TAU); g.fill();
      ink(g, sh.filter((_, q) => q % 3 === 0), { width: lw(0.9), alpha: 0.4, gaps: 1.3, seed: seed + 210 + i }); }
    for (let i = 1; i < along.length; i += 1) { const [ax, ay] = along[i]; for (let q = 0; q < 2; q++) {
      const rx = ax + r.gauss(0, 12 * S), ry = ay + r.gauss(0, 10 * S), rr = r.range(7, 10) * S, c = r.pick(['#e88a9a', '#f0a8b4', '#d86a80', '#f6c4cc']);
      g.fillStyle = rgba(c, 0.95); g.beginPath(); g.arc(rx, ry, rr, 0, TAU); g.fill();
      g.strokeStyle = rgba(shade(c, 0.4), 0.6); g.lineWidth = lw(1); g.beginPath(); g.arc(rx, ry, rr * 0.5, 0.3, 4.6); g.stroke(); g.beginPath(); g.arc(rx + rr * 0.1, ry + rr * 0.1, rr * 0.25, 2, 6); g.stroke(); } }
  }
  // lavender and a cottage border along the front, a bench
  for (let k = 0; k < 18; k++) { const px = -half + 10 + k * 16 + r.gauss(0, 3); if (px > dx0 - 40 && px < dx1 + 40) continue; if (px > half) continue;
    const [lx, ly] = P(px, -2); for (let q = 0; q < 5; q++) { const a = -Math.PI / 2 + (q - 2) * 0.18, L = r.range(26, 40) * S; g.strokeStyle = rgba('#7a8a60', 0.8); g.lineWidth = lw(1.2); g.beginPath(); g.moveTo(lx, ly); g.lineTo(lx + Math.cos(a) * L, ly + Math.sin(a) * L); g.stroke();
      for (let f = 0; f < 4; f++) { g.fillStyle = rgba(r.pick(['#9a86c0', '#8a78b4', '#b0a0d0']), 0.9); g.beginPath(); g.ellipse(lx + Math.cos(a) * (L - f * 3 * S), ly + Math.sin(a) * (L - f * 3 * S), 2 * S, 3 * S, a + Math.PI / 2, 0, TAU); g.fill(); } } }
  return { wall, roof, door, windows };
}

// --- the byre: a long, low rubble-stone cow shed with a red pantile roof, a hay loft, and an open bay full of straw
function byre(g, seed = 70) {
  const r = rng(seed), { x0, x1, ground: gy } = BYRE, eave = 486, ridge = 392, bay0 = BYRE.bay[0];
  // roof: pantiles, seen as a deep band from the eaves up to the ridge
  const roof = [[x0 - 30, eave + 8], [x0 + 10, ridge], [x1 + 40, ridge], [x1 + 40, eave + 8]];
  wash(g, roof, { color: C.tile[0], opacity: 0.97, seed, under: true, bleed: 0.005 });
  for (let y = ridge + 8, row = 0; y < eave + 8; y += 16, row++) {
    // one course of pantiles: S-shaped rolls running down the slope, each lapping the course below
    const xs = lerp(x0 + 10, x0 - 30, (y - ridge) / (eave + 8 - ridge)), yy = y + 16;
    for (let x = xs + r.range(0, 6); x < x1 + 40; x += 18 + r.range(-0.8, 0.8)) {
      const c = r.pick(C.tile), j = r.range(-1, 1);
      g.fillStyle = rgba(shade(c, 0.2), 0.55); g.fillRect(x + 10, y + 1, 8, 15);                                         // the pan, in the roll's shade
      g.fillStyle = rgba(tint(c, 0.12), 0.85); g.beginPath(); g.moveTo(x + 1, y); g.quadraticCurveTo(x + 5.5, y - 2, x + 10, y); g.lineTo(x + 10.5 + j, yy); g.quadraticCurveTo(x + 5.5, yy + 4, x + 0.5 + j, yy); g.closePath(); g.fill(); // the roll
      g.fillStyle = rgba(tint(c, 0.5), 0.45); g.fillRect(x + 2.5, y + 2, 2.2, 12);
      if (r() < 0.06) { g.fillStyle = rgba(r.pick(['#a8a868', '#c0b870', '#8a9a5a']), 0.6); g.beginPath(); g.ellipse(x + 8, y + 10, r.range(6, 12), 3.5, 0, 0, TAU); g.fill(); } // moss and lichen
      if (r() < 0.35) ink(g, [[x + 1, yy], [x + 1, y + 3]], { width: 0.6, alpha: 0.3, seed: seed + Math.round(x + y) });
    }
    g.save(); g.filter = 'blur(2px)'; g.strokeStyle = rgba('#5a2418', 0.35); g.lineWidth = 3; g.beginPath(); g.moveTo(xs, yy + 1); g.lineTo(x1 + 40, yy + 1); g.stroke(); g.restore();
    ink(g, [[xs, yy], [x1 + 40, yy]], { width: 0.8, alpha: 0.4, gaps: 1.1, seed: seed + row });
  }
  shadeEdge(g, roof, { color: '#5a2a1a', alpha: 0.35, width: 40, dy: 14 });
  // ridge tiles
  wash(g, rect(x0 + 6, ridge - 10, x1 + 40, ridge + 4), { color: shade(C.tile[0], 0.15), opacity: 0.97, seed: seed + 1, under: true });
  for (let x = x0 + 10; x < x1 + 40; x += 38) ink(g, [[x, ridge - 10], [x, ridge + 4]], { width: 0.8, alpha: 0.5, seed: seed + 2 + x });
  penLine(g, roof, { sharp: true, closed: true, w: 2, alpha: 0.75, seed: seed + 3 });
  // the walls: rubble stone with big quoins
  const wall = rect(x0, eave + 4, x1 + 40, gy);
  wash(g, wall, { color: '#bdb09a', opacity: 0.97, seed: seed + 4, under: true, bleed: 0.005 });
  g.save(); path(g, wall); g.clip();
  for (let y = gy, row = 0; y > eave; row++) {
    const rh = r.range(18, 26);
    for (let x = x0 - (row % 2) * r.range(8, 24); x < x1 + 40; ) { const sw = r.range(30, 60); if (!(x + sw > bay0 + 4 && x < x1 + 40 && y < gy + 2 && y > eave + 30) || x < bay0)
      stone(g, x + sw / 2, y - rh / 2, sw - 4, rh - 4, r.pick(C.stone), seed + 100 + row * 50 + Math.round(x), { lw: 1, inkA: 0.55 }); x += sw; }
    y -= rh;
  }
  g.restore();
  for (let k = 0; k < 7; k++) { const qy = gy - k * 30, qw = k % 2 ? 34 : 52, q = rect(x0, qy - 28, x0 + qw, qy - 2); wash(g, q, { color: '#d8ccb4', opacity: 0.96, seed: seed + 30 + k, under: true, layers: 8 }); ink(g, q, { closed: true, width: 1.1, alpha: 0.6, seed: seed + 40 + k }); }
  shadeEdge(g, wall, { color: '#5a4a3a', alpha: 0.5, width: 70, dy: 30 });
  // the loft: a little gable through the eaves, its door ajar, hay poking out, a hoist beam
  const lx = 1340, loft = [[lx - 58, eave + 20], [lx - 58, eave - 70], [lx, eave - 112], [lx + 58, eave - 70], [lx + 58, eave + 20]];
  wash(g, loft, { color: '#bdb09a', opacity: 0.98, seed: seed + 50, under: true });
  g.save(); path(g, loft); g.clip(); for (let y = eave + 20, row = 0; y > eave - 112; row++, y -= 20) for (let x = lx - 70 + (row % 2) * 14; x < lx + 70; x += 32) stone(g, x, y - 10, 28, 16, r.pick(C.stone), seed + 600 + row * 9 + x, { lw: 0.9, inkA: 0.5 }); g.restore();
  wash(g, [[lx - 66, eave - 64], [lx, eave - 122], [lx + 66, eave - 64], [lx + 66, eave - 54], [lx, eave - 110], [lx - 66, eave - 54]], { color: C.tile[3], opacity: 0.97, seed: seed + 51, under: true });
  penLine(g, loft, { sharp: true, closed: false, w: 1.8, alpha: 0.75 });
  const ld = rect(lx - 30, eave - 66, lx + 30, eave + 14);
  wash(g, ld, { color: '#2e2620', opacity: 0.95, seed: seed + 52, under: true });
  for (let k = 0; k < 40; k++) { const a = -Math.PI / 2 + r.gauss(0, 0.9), L = r.range(10, 34), hx = lx + r.range(-26, 26), hy = eave + 14 - r.range(0, 30);
    g.strokeStyle = rgba(r.pick(C.straw), 0.9); g.lineWidth = 1.4; g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo(hx + Math.cos(a) * L * 0.5 + 4, hy + Math.sin(a) * L * 0.3, hx + Math.cos(a) * L, hy - Math.abs(Math.sin(a)) * L * 0.4 + 8); g.stroke(); }
  const leaf = [[lx + 30, eave - 66], [lx + 70, eave - 56], [lx + 70, eave + 22], [lx + 30, eave + 14]];
  wash(g, leaf, { color: '#8a6a4c', opacity: 0.97, seed: seed + 53, under: true }); for (let k = 1; k < 3; k++) ink(g, [[lx + 30 + k * 13, eave - 62 + k * 3.3], [lx + 30 + k * 13, eave + 18]], { width: 0.9, alpha: 0.5 }); penLine(g, leaf, { closed: true, sharp: true, w: 1.6, alpha: 0.75 });
  penLine(g, ld, { closed: true, sharp: true, w: 1.8, alpha: 0.8 });
  const beam = rect(lx - 8, eave - 128, lx + 70, eave - 118); wash(g, beam, { color: '#6a4a34', opacity: 0.97, seed: seed + 54, under: true }); penLine(g, beam, { closed: true, sharp: true, w: 1.4, alpha: 0.8 });
  ink(g, [[lx + 62, eave - 118], [lx + 62, eave - 60]], { width: 1.2, alpha: 0.7 }); ink(g, ellipse(lx + 62, eave - 54, 5, 5, 10), { closed: true, width: 1.2, alpha: 0.7 });
  // the stable door (top half open: dark inside), under the loft
  const sd0 = 1296, sd1 = 1384, sdy = gy - 168;
  const sdoor = rect(sd0, sdy, sd1, gy);
  wash(g, sdoor, { color: '#7a8a72', opacity: 0.97, seed: seed + 55, under: true });
  wash(g, rect(sd0 + 3, sdy + 3, sd1 - 3, sdy + 80), { color: '#2a2420', opacity: 0.95, seed: seed + 56, under: true });
  for (let k = 1; k < 4; k++) ink(g, [[sd0 + k * 22, sdy + 84], [sd0 + k * 22, gy - 2]], { width: 1, alpha: 0.45 });
  ink(g, [[sd0 + 4, sdy + 92], [sd1 - 4, gy - 10]], { width: 1.6, alpha: 0.5 });
  penLine(g, [[sd0, sdy + 82], [sd1, sdy + 82]], { sharp: true, w: 2.2, alpha: 0.8 }); penLine(g, sdoor, { closed: true, sharp: true, w: 2.2, alpha: 0.85 });
  // the open bay: dim inside, the back wall, a hay rack, a deep straw bed; oak posts carry the beam
  const bay = rect(bay0, eave + 18, x1 + 40, gy);
  wash(g, bay, { color: '#4a3e32', opacity: 0.97, seed: seed + 57, under: true, bleed: 0.004 });
  g.save(); path(g, bay); g.clip();
  const lg = g.createLinearGradient(0, eave + 18, 0, gy); lg.addColorStop(0, 'rgba(30,24,20,0.7)'); lg.addColorStop(1, 'rgba(90,70,50,0.1)'); g.fillStyle = lg; g.fillRect(bay0, eave, x1 + 40 - bay0, gy - eave);
  for (let k = 0; k < 14; k++) ink(g, [[bay0 + 20 + k * 46, eave + 30], [bay0 + 26 + k * 46, gy - 70]], { color: '#1e1814', width: 1, alpha: 0.35, seed: seed + 60 + k }); // the back wall's boarding
  // hay rack: a slanted wooden ladder against the back wall, stuffed with hay
  for (const [hx0, hx1] of [[1500, 1700], [1780, 2000]]) {
    const rack = [[hx0, 560], [hx1, 560], [hx1 + 10, 610], [hx0 - 10, 610]];
    wash(g, rack, { color: '#8a7048', opacity: 0.8, seed: seed + 70 + hx0, layers: 8 });
    hatch(g, rack, { color: '#e0c078', count: 160, len: 12, width: 1, alpha: 0.6, seed: seed + 71 + hx0, dir: () => -Math.PI / 2 + 0.3 });
    ink(g, [[hx0 - 10, 610], [hx1 + 10, 610]], { width: 2, alpha: 0.75 }); ink(g, [[hx0, 556], [hx1, 556]], { width: 2, alpha: 0.75 });
    for (let x = hx0; x <= hx1; x += 18) ink(g, [[x, 556], [x - 4, 610]], { width: 1.2, alpha: 0.6, seed: seed + 72 + x });
  }
  // the straw bed: a great golden heap filling the floor
  const straw = smooth([[bay0 - 6, gy + 6], [bay0 + 20, gy - 40], [1560, gy - 62], [1700, gy - 72], [1860, gy - 60], [x1 + 40, gy - 58], [x1 + 40, gy + 6]]);
  wash(g, straw, { color: C.straw[0], opacity: 0.95, seed: seed + 80, under: true, bleed: 0.02 });
  blooms(g, straw, [C.straw[2], C.straw[1], '#f4e4b0'], { n: 8, alpha: 0.5, size: 0.2, seed: seed + 81 });
  hatch(g, straw, { color: '#9a7a3a', count: 900, len: 14, width: 1, alpha: 0.55, seed: seed + 82, dir: () => r.gauss(-0.3, 0.9), curve: 0.4 });
  hatch(g, straw, { color: '#fbf0c8', count: 300, len: 12, width: 1.2, alpha: 0.6, seed: seed + 83, dir: () => r.gauss(-0.2, 0.9), curve: 0.4, density: (x, y) => clamp((gy - y) / 70) });
  g.restore();
  FREF.straw = straw;
  // oak posts and the beam over the bay
  const beamY = eave + 18;
  wash(g, rect(bay0 - 10, beamY - 14, x1 + 40, beamY + 8), { color: '#6a4c36', opacity: 0.98, seed: seed + 90, under: true });
  penLine(g, rect(bay0 - 10, beamY - 14, x1 + 40, beamY + 8), { closed: true, sharp: true, w: 1.8, alpha: 0.8 });
  for (const px of [bay0, 1760, 2050]) { const post = [[px - 11, beamY], [px + 11, beamY], [px + 13, gy + 4], [px - 13, gy + 4]];
    wash(g, post, { color: '#7a5a40', opacity: 0.98, seed: seed + 91 + px, under: true }); shadeEdge(g, post, { color: '#3a2a1c', alpha: 0.5, width: 12, dx: 6, dy: 0 });
    hatch(g, post, { count: 30, len: 16, width: 0.8, alpha: 0.5, seed: seed + 92 + px, dir: () => Math.PI / 2 });
    penLine(g, post, { closed: true, sharp: true, w: 1.8, alpha: 0.8 });
    stone(g, px, gy + 4, 40, 14, '#b8ae9c', seed + 93 + px, { lw: 1.1 }); }
  // a pitchfork leaning on the first post, a pail upturned on the cobbles
  ink(g, [[bay0 + 28, gy + 6], [bay0 + 66, gy - 180]], { width: 2.6, alpha: 0.85 });
  for (const d of [-7, 0, 7]) ink(g, [[bay0 + 66 + d * 0.4, gy - 180], [bay0 + 70 + d, gy - 210], [bay0 + 72 + d * 1.2, gy - 230]], { width: 1.4, alpha: 0.8 });
  ink(g, [[bay0 + 60, gy - 180], [bay0 + 80, gy - 182]], { width: 2, alpha: 0.8 });
  FREF.byreWall = wall; FREF.byreRoof = roof; FREF.bay = bay;
  return { wall, roof, bay };
}

// --- the hen house: a little wooden house on legs, faded red, with a pop-hole, a hens' ladder and a nest box
function henhouse(g, seed = 80) {
  const r = rng(seed), { x, y } = HENHOUSE, legH = 36, bw = 150, bh = 92, by = y - legH;
  for (const lx of [x - 64, x + 64]) { const leg = rect(lx - 5, by - 4, lx + 5, y + 2); wash(g, leg, { color: '#6a4c36', opacity: 0.98, seed: seed + lx, under: true }); penLine(g, leg, { closed: true, sharp: true, w: 1.2, alpha: 0.8 }); }
  const body = rect(x - bw / 2, by - bh, x + bw / 2, by);
  wash(g, body, { color: '#b06a4c', opacity: 0.97, seed, under: true, bleed: 0.004 });
  blooms(g, body, ['#c4806a', '#9a5a44', '#c89070'], { n: 6, alpha: 0.4, size: 0.3, seed: seed + 1 });
  for (let k = 1; k < 7; k++) ink(g, [[x - bw / 2, by - k * (bh / 7)], [x + bw / 2, by - k * (bh / 7) + r.gauss(0, 0.6)]], { width: 0.9, alpha: 0.45, seed: seed + 2 + k });
  shadeEdge(g, body, { color: '#5a2a1c', alpha: 0.45, width: 30, dy: 14 });
  // gable roof of weathered boards
  const roof = [[x - bw / 2 - 16, by - bh + 4], [x, by - bh - 62], [x + bw / 2 + 16, by - bh + 4], [x + bw / 2 + 6, by - bh + 10], [x, by - bh - 50], [x - bw / 2 - 6, by - bh + 10]];
  const gable = [[x - bw / 2, by - bh], [x, by - bh - 54], [x + bw / 2, by - bh]];
  wash(g, gable, { color: '#a86448', opacity: 0.97, seed: seed + 10, under: true }); for (let k = 1; k < 4; k++) ink(g, [[x - bw / 2 + k * 18, by - bh - k * 14 + 4], [x + bw / 2 - k * 18, by - bh - k * 14 + 4]], { width: 0.8, alpha: 0.4 });
  wash(g, roof, { color: '#6e6a68', opacity: 0.97, seed: seed + 11, under: true }); penLine(g, roof, { sharp: true, closed: true, w: 1.8, alpha: 0.8 });
  // a little round vent in the gable, the pop-hole with its slide door, the nest box on the side
  g.fillStyle = '#2e2420'; g.beginPath(); g.arc(x, by - bh - 20, 7, 0, TAU); g.fill(); ink(g, ellipse(x, by - bh - 20, 8, 8, 12), { closed: true, width: 1, alpha: 0.7 });
  const pop = smooth([[x - 18, by - 2], [x - 18, by - 30], [x - 12, by - 40], [x, by - 44], [x + 12, by - 40], [x + 18, by - 30], [x + 18, by - 2]], false, 4);
  wash(g, pop, { color: '#241c18', opacity: 0.97, seed: seed + 12, under: true }); penLine(g, pop, { sharp: true, w: 1.6, alpha: 0.8 });
  const slide = rect(x + 22, by - 46, x + 50, by - 4); wash(g, slide, { color: '#c48064', opacity: 0.97, seed: seed + 13, under: true }); penLine(g, slide, { closed: true, sharp: true, w: 1.4, alpha: 0.75 });
  const box = [[x + bw / 2, by - 56], [x + bw / 2 + 44, by - 46], [x + bw / 2 + 44, by - 6], [x + bw / 2, by - 6]];
  wash(g, box, { color: '#9a5a40', opacity: 0.97, seed: seed + 14, under: true }); const lid = [[x + bw / 2 - 2, by - 62], [x + bw / 2 + 50, by - 50], [x + bw / 2 + 50, by - 44], [x + bw / 2 - 2, by - 54]];
  wash(g, lid, { color: '#6e6a68', opacity: 0.97, seed: seed + 15, under: true }); penLine(g, box, { closed: true, sharp: true, w: 1.4, alpha: 0.75 }); penLine(g, lid, { closed: true, sharp: true, w: 1.4, alpha: 0.75 });
  penLine(g, body, { closed: true, sharp: true, w: 2, alpha: 0.85, seed: seed + 16 });
  // the ladder: a sloping plank with little cross-slats, from the pop-hole down to the yard
  const [[ax, ay], [bx, byy]] = HENHOUSE.ladder;
  const plank = ribbon([[ax, ay], [bx, byy]], 16, 16);
  wash(g, plank, { color: '#9a7a58', opacity: 0.98, seed: seed + 17, under: true }); penLine(g, plank, { sharp: true, closed: true, w: 1.3, alpha: 0.8 });
  for (let k = 1; k < 7; k++) { const u = k / 7, px = lerp(ax, bx, u), py = lerp(ay, byy, u); penLine(g, [[px - 3, py - 9], [px + 3, py + 7]], { sharp: true, w: 2.4, alpha: 0.75 }); }
  // its shadow and some straw under it
  g.save(); g.globalCompositeOperation = 'multiply'; pool(g, x + 10, y + 4, 110, 12, '#6a5a50', 0.45); g.restore();
  for (let k = 0; k < 40; k++) { const sx = x + r.range(-80, 80), sy = y + r.range(-4, 8), a = r.gauss(0, 0.7), L = r.range(6, 14); g.strokeStyle = rgba(r.pick(C.straw), 0.85); g.lineWidth = 1; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a) * L, sy + Math.sin(a) * L * 0.3); g.stroke(); }
  FREF.hen = body;
  return { body };
}

// --- the pump and the trough
function pumpAndTrough(g, seed = 90) {
  const { x, y } = PUMP, r = rng(seed);
  // the stone trough (in front, to the right of the pump)
  const tx0 = x + 14, tx1 = x + 130, ty = y + 10, th = 46;
  const front = rect(tx0, ty - th, tx1, ty), top = [[tx0, ty - th], [tx0 + 10, ty - th - 12], [tx1 + 10, ty - th - 12], [tx1, ty - th]];
  wash(g, top, { color: '#cfc4b0', opacity: 0.98, seed, under: true }); const water = [[tx0 + 8, ty - th - 2], [tx0 + 14, ty - th - 9], [tx1 + 4, ty - th - 9], [tx1 - 2, ty - th - 2]];
  wash(g, water, { color: '#7c8c9c', opacity: 0.9, seed: seed + 1 }); FREF.trough = water;
  wash(g, front, { color: '#bcb09c', opacity: 0.98, seed: seed + 2, under: true }); blooms(g, front, ['#a8a088', '#ccc0a8', '#9ca08a'], { n: 5, alpha: 0.4, seed: seed + 3 });
  speckle(g, bbox(front), { color: '#8a9a6a', count: 30, size: 2.4, alpha: 0.4, seed: seed + 4 });
  penLine(g, front, { closed: true, sharp: true, w: 1.8, alpha: 0.8 }); penLine(g, top, { closed: true, sharp: true, w: 1.4, alpha: 0.7 });
  // the pump: a fluted iron column, a domed cap, a long curved handle, a spout over the trough
  const col = '#4e5a58';
  const body = [[x - 13, y], [x - 11, y - 132], [x + 11, y - 132], [x + 13, y]];
  wash(g, body, { color: col, opacity: 0.98, seed: seed + 5, under: true });
  glaze(g, body, x - 5, y - 70, 5, 60, '#a8b8b4', 0.6);
  for (const d of [-5, 0, 5]) ink(g, [[x + d, y - 6], [x + d * 0.9, y - 126]], { width: 0.7, alpha: 0.35 });
  const cap = smooth([[x - 16, y - 130], [x - 14, y - 146], [x, y - 156], [x + 14, y - 146], [x + 16, y - 130]], false, 4);
  wash(g, cap.concat([[x + 16, y - 128], [x - 16, y - 128]]), { color: shade(col, 0.1), opacity: 0.98, seed: seed + 6, under: true });
  g.fillStyle = col; g.beginPath(); g.arc(x, y - 160, 5, 0, TAU); g.fill();
  const spout = ribbon([[x + 8, y - 92], [x + 26, y - 88], [x + 34, y - 74], [x + 34, y - 64]], 11, 8);
  wash(g, spout, { color: col, opacity: 0.98, seed: seed + 7, under: true }); penLine(g, spout, { sharp: true, closed: true, w: 1.3, alpha: 0.8 });
  PUMP.spout = [x + 34, y - 62];
  const handle = ribbon([[x - 4, y - 140], [x - 30, y - 150], [x - 62, y - 140], [x - 82, y - 118]], 6, 4);
  wash(g, handle, { color: col, opacity: 0.98, seed: seed + 8, under: true }); penLine(g, handle, { sharp: true, closed: true, w: 1.2, alpha: 0.8 });
  g.fillStyle = col; g.beginPath(); g.ellipse(x - 84, y - 116, 6, 5, 0, 0, TAU); g.fill();
  penLine(g, body, { closed: true, sharp: true, w: 1.8, alpha: 0.85 }); penLine(g, cap, { sharp: true, w: 1.6, alpha: 0.8 });
  wash(g, rect(x - 20, y - 4, x + 20, y + 8), { color: '#a89c8c', opacity: 0.98, seed: seed + 9, under: true }); penLine(g, rect(x - 20, y - 4, x + 20, y + 8), { closed: true, sharp: true, w: 1.3, alpha: 0.7 });
  // ferns and grass at the trough's foot (it is always damp here)
  for (let k = 0; k < 6; k++) grassFlicks(g, tx0 + r.range(0, tx1 - tx0), ty + 4, r.range(14, 26), { seed: seed + 20 + k, n: 6, colors: C.grass, inkA: 0.45 });
  FREF.pump = body;
}

// --- the picket fence along the back of the yard, with the gate gap (the gate itself is a live sprite)
const FENCE = { x0: 940, x1: 1262, y0: 708, y1: 702, h: 62 };
const fenceY = (x) => lerp(FENCE.y0, FENCE.y1, (x - FENCE.x0) / (FENCE.x1 - FENCE.x0));
function picket(g, px, py, h, w, seed, col = '#ece4d2') {
  const p = [[px - w / 2, py], [px - w / 2, py - h + 6], [px, py - h], [px + w / 2, py - h + 6], [px + w / 2, py]];
  wash(g, p, { color: col, opacity: 0.98, seed, under: true, layers: 6, bleed: 0.004 });
  g.fillStyle = rgba('#9a9488', 0.4); g.fillRect(px + w * 0.15, py - h + 8, w * 0.32, h - 10);
  penLine(g, p, { closed: true, sharp: true, w: 1.1, alpha: 0.75, seed: seed + 1 });
}
function picketFence(g, seed = 100) {
  const { x0, x1, h } = FENCE, gx0 = GATE.x - GATE.w / 2 - 8, gx1 = GATE.x + GATE.w / 2 + 8;
  for (const [a, b] of [[x0, gx0], [gx1, x1]]) {
    for (const ry of [0.3, 0.75]) { const rail = [[a, fenceY(a) - h * ry - 3], [b, fenceY(b) - h * ry - 3], [b, fenceY(b) - h * ry + 3], [a, fenceY(a) - h * ry + 3]]; wash(g, rail, { color: '#d8d0bc', opacity: 0.98, seed: seed + ry * 10, under: true, layers: 6 }); penLine(g, rail, { closed: true, sharp: true, w: 0.9, alpha: 0.6 }); }
    for (let x = a + 6; x < b - 4; x += 15) picket(g, x, fenceY(x) + 2, h * (0.92 + 0.08 * Math.sin(x)), 10, seed + Math.round(x));
  }
  for (const px of [gx0, gx1]) { const post = rect(px - 7, fenceY(px) - h - 14, px + 7, fenceY(px) + 4); wash(g, post, { color: '#d8ccb4', opacity: 0.98, seed: seed + px, under: true }); g.fillStyle = '#c8bca4'; g.beginPath(); g.arc(px, fenceY(px) - h - 16, 8, 0, TAU); g.fill(); penLine(g, post, { closed: true, sharp: true, w: 1.4, alpha: 0.8 }); }
  // cow parsley and a dog rose along the fence
  for (let k = 0; k < 7; k++) { const fx = x0 + 10 + k * 22; if (fx > gx0 - 10) break; cowParsley(g, fx, fenceY(fx) + 4, 70 + (k % 3) * 14, seed + 40 + k, { n: 2 }); }
  rambler(g, [[gx1 + 20, fenceY(gx1) + 2], [gx1 + 40, fenceY(gx1) - 50], [gx1 + 80, fenceY(gx1) - 70], [gx1 + 120, fenceY(gx1) - 58], [gx1 + 150, fenceY(gx1) - 20]], seed + 60, { roses: 0.5 });
}
// the gate (a live sprite: it swings open)
const GSPR = {};
function gateSprite() {
  if (GSPR.s) return GSPR.s;
  const { w } = GATE, h = FENCE.h;
  return (GSPR.s = sprite({ x0: 0, y0: -h - 10, x1: w, y1: 8, w, h: h + 18 }, 2, (g) => {
    for (const ry of [0.25, 0.8]) { const rail = rect(0, -h * ry - 4, w, -h * ry + 4); wash(g, rail, { color: '#d8d0bc', opacity: 0.98, seed: 7 + ry * 10, under: true, layers: 6 }); penLine(g, rail, { closed: true, sharp: true, w: 1, alpha: 0.7 }); }
    const br = ribbon([[4, -h * 0.25], [w - 4, -h * 0.8]], 6, 6); wash(g, br, { color: '#d0c8b4', opacity: 0.98, seed: 9, under: true }); penLine(g, br, { sharp: true, closed: true, w: 1, alpha: 0.65 });
    for (let x = 6; x < w - 2; x += 14) picket(g, x, 0, h * 0.96 + Math.sin(x * 0.06) * 3, 10, 30 + x);
    g.fillStyle = '#3a3430'; g.fillRect(w - 10, -h * 0.55, 8, 4);
  }, { grain: 0.15, seed: 11 }));
}
export function drawGate(g, open = 0, mood = 'dawn') {
  const s = gateSprite(), x0 = GATE.x - GATE.w / 2, y = fenceY(GATE.x) + 2, a = open * 1.2;
  g.save(); g.translate(x0, y); g.scale(Math.cos(a), 1); g.transform(1, Math.sin(a) * 0.18, 0, 1, 0, 0);
  drawSprite(g, s, 1);
  if (MD(mood).name === 'night') { g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(70,84,150,0.62)'; g.fillRect(-4, -FENCE.h - 12, GATE.w + 8, FENCE.h + 22); }
  else if (MD(mood).name === 'dusk') { g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(236,190,170,0.5)'; g.fillRect(-4, -FENCE.h - 12, GATE.w + 8, FENCE.h + 22); }
  else if (MD(mood).name === 'dawn') { g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgba(214,196,220,0.5)'; g.fillRect(-4, -FENCE.h - 12, GATE.w + 8, FENCE.h + 22); }
  g.restore();
}

// --- a great old tree: a short strong trunk dividing into limbs, a broad irregular crown of many shaded clumps
// (dark and cool underneath, sunlit on top, leafy dabs, an inked scalloped top edge, gaps where the sky shows through)
function limbShape(pts, w0, w1, sd) {
  const L = [], Rr = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = (w0 + (w1 - w0) * i / (pts.length - 1)) / 2 * (1 + 0.12 * noise1(i * 1.7, sd));
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); Rr.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  return { sh: smooth(L.concat(Rr.slice().reverse())), L, R: Rr };
}
function limb(g, pts, w0, w1, sd, bark = '#8a8072') {
  const { sh, L, R: Rr } = limbShape(pts, w0, w1, sd);
  wash(g, sh, { color: bark, opacity: 0.98, seed: sd, under: true, bleed: 0.015 });
  g.save(); path(g, sh); g.clip(); g.filter = 'blur(4px)'; g.strokeStyle = rgba('#3e342c', 0.45); g.lineWidth = w0 * 0.45; path(g, smooth(Rr, false), false); g.stroke();
  g.strokeStyle = rgba('#e0d4c0', 0.35); g.lineWidth = w0 * 0.2; path(g, smooth(L, false), false); g.stroke(); g.restore();
  hatch(g, sh, { count: Math.round(w0 * 5), len: Math.max(6, w0 * 0.4), dir: () => -Math.PI / 2 + 0.05, alpha: 0.4, width: 0.8, seed: sd + 1, curve: 0.15 });
  penLine(g, smooth(L, false), { sharp: true, w: 1.8, alpha: 0.8, seed: sd + 2 }); penLine(g, smooth(Rr, false), { sharp: true, w: 2.2, alpha: 0.8, seed: sd + 3 });
}
function clump(g, cx, cy, rr, sd, o = {}) {
  const r = rng(sd), cols = o.cols || ['#6a8048', '#5e7642', '#7a8e50', '#6e8448'], dark = o.dark || 0;
  const sh = fluffy(cx, cy, rr, rr * 0.78, 11, 0.24, sd);
  wash(g, sh, { color: shade(cols[sd % cols.length], dark), opacity: 1, seed: sd, under: shade(cols[0], 0.35 + dark), bleed: 0.03, edge: 0.3, layers: 18 });
  g.save(); path(g, sh); g.clip(); g.filter = `blur(${(rr * 0.12).toFixed(1)}px)`;
  g.fillStyle = rgba(shade(cols[0], 0.5), 0.55); g.beginPath(); g.ellipse(cx + rr * 0.15, cy + rr * 0.55, rr, rr * 0.5, 0, 0, TAU); g.fill();
  if (!dark) { g.fillStyle = rgba(tint(cols[2], 0.45), 0.55); g.beginPath(); g.ellipse(cx - rr * 0.25, cy - rr * 0.38, rr * 0.55, rr * 0.3, 0, 0, TAU); g.fill(); }
  g.restore();
  g.save(); path(g, sh); g.clip();
  for (let k = 0; k < rr * 1.6; k++) { const a = r() * TAU, d = Math.sqrt(r()), lx = cx + Math.cos(a) * rr * d, ly = cy + Math.sin(a) * rr * 0.78 * d, up = (cy - ly) / rr;
    const c = up > 0.15 && !dark ? tint(r.pick(cols), 0.3) : up < -0.25 ? shade(r.pick(cols), 0.35) : r.pick(cols);
    g.save(); g.translate(lx, ly); g.rotate(r() * TAU); g.fillStyle = rgba(shade(c, dark), 0.7); g.beginPath(); g.moveTo(-5.5, 0); g.quadraticCurveTo(0, -4, 6, 0); g.quadraticCurveTo(0, 3.6, -5.5, 0); g.fill(); g.restore(); }
  g.restore();
  // leaves breaking the edge on top
  for (let k = 0; k < rr / 4; k++) { const a = Math.PI * r.range(1.05, 1.95), lx = cx + Math.cos(a) * rr * r.range(0.95, 1.05), ly = cy + Math.sin(a) * rr * 0.78 * r.range(0.95, 1.05);
    g.fillStyle = rgba(shade(tint(r.pick(cols), 0.15), dark), 0.85); g.beginPath(); g.ellipse(lx, ly, 5, 3.2, a + 1.4, 0, TAU); g.fill(); }
  ink(g, sh.slice(Math.floor(sh.length * 0.55)).concat(sh.slice(0, Math.floor(sh.length * 0.04))), { width: 1, alpha: dark ? 0.35 : 0.55, gaps: 1, seed: sd + 4 });
  return sh;
}
function bigTree(g, x, gy, seed, o = {}) {
  const r = rng(seed), S = o.S || 1, cw = (o.w || 520) * S, ch = (o.h || 330) * S, cy = gy - (o.crownY || 470) * S;
  const fork = [x, gy - 200 * S];
  const limbs = [[[x - 4, gy - 170 * S], [x - 90 * S, gy - 270 * S], [x - 190 * S, gy - 350 * S], [x - 250 * S, gy - 400 * S]],
    [[x, gy - 190 * S], [x - 20 * S, gy - 320 * S], [x - 40 * S, gy - 450 * S], [x - 30 * S, gy - 560 * S]],
    [[x + 6, gy - 180 * S], [x + 60 * S, gy - 300 * S], [x + 110 * S, gy - 430 * S], [x + 120 * S, gy - 520 * S]],
    [[x + 8, gy - 170 * S], [x + 120 * S, gy - 250 * S], [x + 220 * S, gy - 320 * S], [x + 280 * S, gy - 350 * S]]];
  // crown clumps: back ones (darker), then the limbs, then the front ones (top-lit), leaving a few holes
  const back = [], front = [];
  for (let i = 0; i < 22; i++) { const u = r.range(-1, 1), v = r.range(-1, 0.7); if (u * u + v * v > 1.05) { i--; continue; } back.push([x + u * cw * 0.5, cy + v * ch * 0.5, r.range(80, 115) * S]); }
  for (const L of limbs) { const [ex, ey] = L[3]; front.push([ex + r.gauss(0, 14 * S), ey + r.gauss(0, 10 * S), r.range(80, 105) * S]); const [mx, my] = L[2]; front.push([mx + r.gauss(0, 20 * S), my - 10 * S, r.range(60, 85) * S]); }
  for (let i = 0; i < 11; i++) front.push([x + r.range(-0.45, 0.45) * cw, cy - ch * r.range(0.15, 0.42), r.range(70, 95) * S]);
  front.sort((a, b) => b[1] - a[1]);
  for (const [i, [cx, cy2, rr]] of back.entries()) clump(g, cx, cy2, rr, seed + 100 + i, { dark: 0.3, cols: o.cols });
  limb(g, [[x + 6, gy + 6], [x - 6, gy - 80 * S], [x + 6, fork[1] + 20], [x, fork[1]]], 84 * S, 60 * S, seed + 1);
  limbs.forEach((L, i) => limb(g, L, 44 * S, 14 * S, seed + 2 + i));
  // roots flaring into the grass
  for (const sd of [-1, 1]) limb(g, [[x + sd * 20 * S, gy - 26 * S], [x + sd * 50 * S, gy - 4 * S], [x + sd * 76 * S, gy + 4]], 26 * S, 6 * S, seed + 10 + sd);
  const shapes = [];
  for (const [i, [cx, cy2, rr]] of front.entries()) shapes.push(clump(g, cx, cy2, rr, seed + 200 + i, { cols: o.cols }));
  return { clumps: front, shapes };
}
// --- the great tree behind the house, an elder in flower and a hedge behind the hen house
function yardTrees(g, seed = 110) {
  const r = rng(seed);
  const t = bigTree(g, 690, 606, seed, { S: 0.82, w: 600, h: 320, crownY: 470 });
  FREF.ash = t.clumps;
  hedgerow(g, [[740, 610], [860, 600], [990, 606]], 66, seed + 30, { step: 2, dabs: 3 });
  for (const [i, [cx, cy, rr]] of [[1196, 560, 64], [1240, 516, 56], [1150, 606, 46]].entries()) clump(g, cx, cy, rr, seed + 40 + i, { cols: ['#5e7642', '#6a8048', '#4e6438', '#7a8e50'] });
  for (let k = 0; k < 14; k++) { const fx = 1150 + r.range(-40, 110), fy = r.range(470, 590); g.fillStyle = rgba('#f6efda', 0.92); for (let q = 0; q < 9; q++) { g.beginPath(); g.arc(fx + r.gauss(0, 7), fy + r.gauss(0, 3), 1.9, 0, TAU); g.fill(); } } // elderflower
}

// --- the foreground (a separate layer, drawn over the actors): kept low, in the corners
function farmFront(g, seed = 130) {
  const r = rng(seed);
  // bottom left: the end of a dry-stone wall, a milk churn, dock leaves, cow parsley and long grass
  const wallTop = smooth([[-M - 40, 930], [40, 922], [150, 934], [200, 960], [220, 1000]], false, 6);
  const ws = wallTop.concat([[230, LH], [-M - 40, LH]]);
  wash(g, ws, { color: '#a89c8a', opacity: 0.98, seed, under: true, bleed: 0.004 });
  g.save(); path(g, ws); g.clip(); for (let y = 1140, row = 0; y > 900; y -= 34, row++) for (let x = -M - 40 + (row % 2) * 30; x < 240; x += r.range(50, 74)) stone(g, x + 28, y - 16, r.range(46, 66), 28, r.pick(C.stone), seed + row * 40 + Math.round(x), { lw: 1.5, inkA: 0.65 }); g.restore();
  for (let x = -M; x < 210; x += r.range(22, 30)) { const y = yOn(wallTop, x); stone(g, x + 10, y - 6, r.range(22, 30), r.range(16, 22), r.pick(C.stone), seed + 300 + Math.round(x), { lw: 1.4, inkA: 0.65 }); }
  for (let k = 0; k < 6; k++) { const x = r.range(-80, 180), y = yOn(wallTop, x) - 8; g.fillStyle = rgba(r.pick(['#8aa060', '#a8b070', '#c8c080']), 0.7); g.beginPath(); g.ellipse(x, y, r.range(10, 22), r.range(4, 7), 0, 0, TAU); g.fill(); } // moss on the coping
  plant(g, 250, 1050, { seed: seed + 5, h: 150, n: 6, colors: ['#6a8048', '#7f9a52', '#5e7640', '#4e6438'], spread: 1.6 });
  for (let k = 0; k < 4; k++) cowParsley(g, 120 + k * 50 + r.gauss(0, 10), 1010 + r.range(0, 30), r.range(160, 230), seed + 20 + k, { n: 3 });
  for (let i = 0; i < 18; i++) grassFlicks(g, r.range(-80, 330), r.range(1000, 1110), r.range(40, 90), { seed: seed + 40 + i, n: 6, colors: C.grass, inkA: 0.45, lean: 0.12 });
  // bottom right: a heap of hay against a hurdle, a tabby... no: a hay fork's worth of hay, long grass and buttercups
  const hay = smooth([[1700, 1110], [1730, 1020], [1800, 976], [1890, 960], [1980, 980], [W + M + 40, 1000], [W + M + 40, 1110]]);
  wash(g, hay, { color: C.straw[0], opacity: 0.96, seed: seed + 60, under: true });
  blooms(g, hay, C.straw, { n: 6, alpha: 0.5, seed: seed + 61 });
  hatch(g, hay, { color: '#9a7a3a', count: 400, len: 22, width: 1.2, alpha: 0.55, seed: seed + 62, dir: () => r.gauss(-0.4, 0.8), curve: 0.4 });
  hatch(g, hay, { color: '#fbf0c8', count: 140, len: 18, width: 1.4, alpha: 0.6, seed: seed + 63, dir: () => r.gauss(-0.3, 0.8), curve: 0.4 });
  for (let k = 0; k < 30; k++) { const a = -Math.PI / 2 + r.gauss(0, 0.9), L = r.range(14, 40), x = r.range(1720, 2000), y = yOn([[1700, 1040], [1800, 976], [1900, 962], [2020, 990]], x) + 6;
    g.strokeStyle = rgba(r.pick(C.straw), 0.9); g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.5 - 4, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
  penLine(g, hay.slice(1, Math.floor(hay.length * 0.7)), { sharp: true, w: 1.6, alpha: 0.6 });
  for (let i = 0; i < 16; i++) grassFlicks(g, r.range(1600, 2010), r.range(1060, 1120), r.range(50, 110), { seed: seed + 80 + i, n: 5, colors: C.grass, inkA: 0.45, lean: -0.1 });
  buttercups(g, { x0: 1560, x1: 1760, y0: 1040, y1: 1100 }, 30, seed + 90, 2.2);
}

// --- the light passes (per mood), painted over the glazed land
// a cast shadow: a textured wash, blurred soft at the edges, multiplied onto the ground
function softShadow(g, shp, m, k = 1, blur = 6, seed = 1) {
  g.save(); g.globalCompositeOperation = 'multiply'; g.filter = `blur(${(blur * RES).toFixed(1)}px)`;
  wash(g, shp, { color: m.shadow, opacity: m.shadowA * 1.3 * k, seed, bleed: 0.03, layers: 8, edge: 0 });
  g.restore();
}
// the far land (valley and meadow): haze toward the horizon and the glow of a low sun
function farLight(g, m) {
  g.save(); g.globalCompositeOperation = 'source-atop';
  const hg = g.createLinearGradient(0, 380, 0, 640); hg.addColorStop(0, rgba(m.haze, m.hazeK)); hg.addColorStop(0.4, rgba(m.haze, m.hazeK * 0.55)); hg.addColorStop(1, rgba(m.haze, 0));
  g.fillStyle = hg; g.fillRect(-M, 380, LW, 260);
  if (m.sun && (m.name === 'dawn' || m.name === 'dusk')) { g.globalCompositeOperation = 'screen'; pool(g, m.sun[0], m.sun[1] + 40, 520, 120, m.glow, 0.32); pool(g, m.sun[0], m.sun[1] + 16, 160, 40, '#fff0d0', 0.4); }
  if (m.name === 'dawn') { g.globalCompositeOperation = 'screen'; pool(g, GATE.x - 40, 640, 300, 110, '#ffe0b0', 0.3); }
  if (m.name === 'night') { g.globalCompositeOperation = 'screen'; pool(g, m.moon[0], 470, 700, 120, '#7080b0', 0.25); }
  g.restore();
}
function farmLight(g, m) {
  g.save();
  const bases = [[HOUSE.x - 236, HOUSE.x + 236, HOUSE.ground + 2], [BYRE.x0, BYRE.x1 + 60, BYRE.ground + 2], [HENHOUSE.x - 80, HENHOUSE.x + 80, HENHOUSE.y + 2], [PUMP.x - 16, PUMP.x + 130, PUMP.y + 10], [FENCE.x0, FENCE.x1, FENCE.y0 + 2]];
  const hts = [330, 300, 130, 150, 60];
  if (m.name === 'dawn') {
    // the sun is behind the buildings: their faces are in cool shade; their shadows run toward us across the yard
    g.save(); g.globalCompositeOperation = 'multiply';
    for (const [shp, a] of [[FREF.houseWall, 0.28], [FREF.byreWall, 0.26], [FREF.hen, 0.22], [FREF.pump, 0.2], [FREF.door, 0.2]]) wash(g, shp, { color: '#9890c4', opacity: a, seed: 501, layers: 8, bleed: 0.005, edge: 0 });
    g.restore();
    bases.forEach(([x0, x1, gy], i) => { const L = hts[i] * 0.42, sk = (x) => (x - m.sun[0]) * 0.22 * (L / 120);
      softShadow(g, [[x0, gy - 2], [x1, gy - 2], [x1 + sk(x1), gy + L], [x0 + sk(x0), gy + L]], m, 0.9, 8, 510 + i); });
    // a gold rim on everything that faces the sun: the thatch ridge, the byre's ridge, the tree tops
    g.save(); g.globalCompositeOperation = 'screen'; g.lineCap = 'round'; g.filter = `blur(${3 * RES}px)`;
    const rim = (pts, w, a) => { g.strokeStyle = `rgba(255,214,160,${a})`; g.lineWidth = w; path(g, pts, false); g.stroke(); };
    const roof = FREF.houseRoof; rim(roof.slice(Math.floor(roof.length * 0.38), Math.floor(roof.length * 0.74)), 7, 0.5);
    rim([[BYRE.x0 + 10, 390], [W + M, 390]], 6, 0.5);
    for (const c of FREF.ash) rim(fluffy(c[0], c[1], c[2], c[2] * 0.78, 8, 0.2, 1).slice(10, 22), 5, 0.3);
    g.restore();
    g.save(); g.globalCompositeOperation = 'screen'; pool(g, GATE.x, 740, 300, 70, '#ffe0b0', 0.3); g.restore();
    glaze(g, FREF.puddle, 760, 858, 60, 10, '#f8d0c0', 0.85); glaze(g, FREF.trough, PUMP.x + 70, PUMP.y - 44, 50, 6, '#f8d8c8', 0.8);
  } else if (m.name === 'dusk') {
    // a low gold sun from the left: warm on the walls facing it, long violet shadows reaching right
    bases.forEach(([x0, x1, gy], i) => { if (i === 1) return; const L = hts[i] * 1.5, d = hts[i] * 0.1;
      softShadow(g, smooth([[x0, gy], [x1, gy - 2], [x1 + L, gy + d * 0.6], [x1 + L + 30, gy + d * 1.4], [x0 + L * 0.7, gy + d * 1.8], [x0 - 6, gy + d * 0.5]]), m, 1, 7, 520 + i); });
    g.save(); g.globalCompositeOperation = 'multiply'; wash(g, FREF.byreWall, { color: '#b890b8', opacity: 0.25, seed: 530, layers: 8, bleed: 0.005, edge: 0 }); g.restore();
    g.save(); g.globalCompositeOperation = 'soft-light';
    for (const shp of [FREF.houseWall, FREF.hen, FREF.byreWall]) { const b = bbox(shp); g.save(); path(g, shp); g.clip(); const lg = g.createLinearGradient(b.x0, 0, b.x1, 0); lg.addColorStop(0, 'rgba(255,190,110,0.9)'); lg.addColorStop(1, 'rgba(160,110,150,0.5)'); g.fillStyle = lg; g.fillRect(b.x0, b.y0, b.w, b.h); g.restore(); }
    g.restore();
    glaze(g, FREF.puddle, 760, 858, 60, 10, '#f8c098', 0.85); glaze(g, FREF.trough, PUMP.x + 70, PUMP.y - 44, 50, 6, '#f8c8a0', 0.8);
  } else if (m.name === 'night') {
    g.save(); g.globalCompositeOperation = 'multiply';
    const dg = g.createLinearGradient(0, 600, 0, H + MY); dg.addColorStop(0, 'rgba(255,255,255,0)'); dg.addColorStop(1, 'rgba(70,80,130,0.5)'); g.fillStyle = dg; g.fillRect(-M, 600, LW, LH);
    g.restore();
    bases.forEach(([x0, x1, gy], i) => { const L = hts[i] * 0.25; softShadow(g, [[x0, gy], [x1, gy], [x1 - L, gy + L * 0.3], [x0 - L, gy + L * 0.3]], m, 0.8, 8, 540 + i); });
    // moonlight on the thatch, the byre ridge, the pump's cap
    g.save(); g.globalCompositeOperation = 'screen'; g.filter = `blur(${4 * RES}px)`; g.lineCap = 'round';
    const roof = FREF.houseRoof; g.strokeStyle = 'rgba(190,206,250,0.35)'; g.lineWidth = 9; path(g, roof.slice(Math.floor(roof.length * 0.38), Math.floor(roof.length * 0.74)), false); g.stroke();
    g.strokeStyle = 'rgba(190,206,250,0.3)'; g.lineWidth = 7; g.beginPath(); g.moveTo(BYRE.x0 + 10, 392); g.lineTo(W + M, 392); g.stroke();
    for (const c of FREF.ash) { g.strokeStyle = 'rgba(170,190,240,0.25)'; g.lineWidth = 5; path(g, fluffy(c[0], c[1], c[2], c[2] * 0.78, 8, 0.2, 1).slice(10, 22), false); g.stroke(); }
    g.restore();
    glaze(g, FREF.puddle, 760, 858, 60, 10, '#a8b8e8', 0.6);
  } else {
    bases.forEach(([x0, x1, gy], i) => { const L = hts[i] * 0.2; softShadow(g, [[x0, gy], [x1, gy], [x1 + L, gy + L * 0.3], [x0 + L, gy + L * 0.3]], m, 0.8, 5, 550 + i); });
  }
  g.restore();
}
// lit windows (night), painted over everything
function litWindow(g, wnd, k = 1) {
  const { x, y, w, h } = wnd;
  g.save(); pool(g, x, y, w * 1.6, h * 1.4, '#ffc870', 0.32 * k, 'lighter');
  g.fillStyle = `rgba(250,200,110,${0.85 * k})`; g.fillRect(x - w / 2 + 2, y - h / 2 + 2, w - 4, h - 4);
  pool(g, x, y + h * 0.1, w * 0.4, h * 0.4, '#fff0c0', 0.7 * k); g.restore();
  for (const sd of [-1, 1]) { const c0 = x + sd * w * 0.5, c1 = x + sd * w * 0.3; g.fillStyle = 'rgba(200,120,70,0.55)'; g.beginPath(); g.moveTo(c0, y - h / 2); g.quadraticCurveTo(c1 - sd * 4, y, c0, y + h / 2); g.lineTo(c0, y - h / 2); g.fill(); }
  const bars = w > 70 ? [-1 / 6, 1 / 6] : [0];
  for (const fx of bars) penLine(g, [[x + fx * w, y - h / 2], [x + fx * w, y + h / 2]], { sharp: true, w: 2.6, alpha: 0.85, color: '#3a3040' });
  penLine(g, [[x - w / 2, y], [x + w / 2, y]], { sharp: true, w: 2.6, alpha: 0.85, color: '#3a3040' });
  penLine(g, rect(x - w / 2, y - h / 2, x + w / 2, y + h / 2), { closed: true, sharp: true, w: 2.4, alpha: 0.9 });
}

// --- the set
const FL = {};
let FARMBASE = null;
function farmBase() {
  if (FARMBASE) return FARMBASE;
  const far = hlayer((g) => { tm('valley', () => paintValley(g)); tm('meadow', () => paintMeadow(g)); });
  const near = hlayer((g) => {
    tm('trees', () => yardTrees(g));
    tm('byre', () => byre(g));
    tm('yard', () => cobbleYard(g));
    tm('fence', () => picketFence(g));
    tm('house', () => farmhouse(g));
    tm('henhouse', () => henhouse(g));
    tm('pump', () => pumpAndTrough(g));
  });
  const front = tm('front', () => hlayer((g) => farmFront(g)));
  return (FARMBASE = { far, near, front });
}
// Builds the farmyard for a mood (cached): { back (sky and the far valley), near (the yard and its buildings), front,
// skyMask }. Draw back, the mist, near, the gate (drawGate) and the actors, then front (drawFarm does all this).
export function farmLayers(mood = 'dawn') {
  const m = MD(mood);
  if (FL[m.name]) return FL[m.name];
  const B = farmBase();
  const back = tm('sky', () => hlayer((g) => paintSky(g, m, { hz: 470, seed: 5 })));
  const far = cloneC(B.far), near = cloneC(B.near);
  tm('glaze', () => { moodGlaze(far, m, RES, 9); moodGlaze(near, m, RES, 10); });
  tm('light', () => { farLight(pageG(far), m); farmLight(pageG(near), m); });
  const skyMask = canvas(LW, LH, false);
  { const sg = skyMask.getContext('2d'); sg.fillStyle = '#fff'; sg.fillRect(0, 0, LW, LH); sg.globalCompositeOperation = 'destination-out'; sg.drawImage(far, 0, 0, LW, LH); sg.drawImage(near, 0, 0, LW, LH); }
  const bg = back.getContext('2d'); bg.save(); bg.setTransform(1, 0, 0, 1, 0, 0); bg.drawImage(far, 0, 0); bg.restore();
  if (m.name === 'night') { const g = pageG(near); for (const w of FREF.windows) litWindow(g, w, 1); litWindow(g, FREF.attic, 0.8); }
  grain(back, 0.2, 5); grain(near, 0.2, 6);
  const front = cloneC(B.front);
  moodGlaze(front, m, RES, 13);
  if (m.name !== 'morning') { const g = pageG(front); g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = { night: 'rgba(30,36,80,0.3)', dawn: 'rgba(90,70,120,0.16)', dusk: 'rgba(110,60,90,0.12)' }[m.name]; g.fillRect(-M, -MY, LW, LH); g.restore(); }
  grain(front, 0.2, 7);
  return (FL[m.name] = { back: to8(back), near: to8(near), front: to8(front), skyMask, mood: m.name });
}

// ================================================================ AMBIENT LIFE (functions of t, cheap per frame)
// soft rays of early sunlight fanning from the sun (dawn); k: strength. Drawn in world coordinates after cam().
let RAYS = null;
function raysSprite() {
  if (RAYS) return RAYS;
  const S = 1400, c = canvas(S, S, false), g = c.getContext('2d'), r = rng(808);
  g.translate(S / 2, S / 2); g.filter = 'blur(14px)';
  for (let i = 0; i < 16; i++) {
    const a = Math.PI * (0.02 + 0.96 * (i + r.range(0.1, 0.9)) / 16), w = r.range(0.03, 0.08), L = r.range(0.6, 1) * S / 2;
    const gr = g.createRadialGradient(0, 0, 40, 0, 0, L); gr.addColorStop(0, 'rgba(255,236,200,0.5)'); gr.addColorStop(1, 'rgba(255,236,200,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, L, a - w, a + w); g.closePath(); g.fill();
  }
  return (RAYS = c);
}
export function sunRays(g, t, at = MOODS.dawn.sun, k = 1) {
  if (k <= 0) return;
  const s = raysSprite();
  g.save(); g.globalCompositeOperation = 'screen'; g.translate(at[0], at[1]); g.rotate(Math.sin(t * 0.05) * 0.03);
  g.globalAlpha = k * (0.55 + 0.15 * Math.sin(t * 0.4)); g.drawImage(s, -s.width / 2, -s.height / 2);
  g.rotate(0.07 + Math.sin(t * 0.07 + 1) * 0.04); g.globalAlpha = k * (0.3 + 0.15 * Math.sin(t * 0.31 + 2)); g.scale(0.85, 0.85); g.drawImage(s, -s.width / 2, -s.height / 2);
  g.restore();
}
// mist lying in the valley and over the meadow, drifting; lift 0..1 raises and thins it (the morning burning it off)
let MIST = null;
function mistSprite() {
  if (MIST) return MIST;
  const w = 2600, h = 260, c = canvas(w, h, false), g = c.getContext('2d'), r = rng(909);
  g.filter = 'blur(18px)';
  for (let i = 0; i < 70; i++) { const x = r() * w, y = h * 0.5 + r.gauss(0, h * 0.13), rx = r.range(120, 360), ry = r.range(12, 34);
    g.fillStyle = `rgba(255,248,244,${r.range(0.12, 0.3)})`; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill();
    if (x < 400) { g.beginPath(); g.ellipse(x + w, y, rx, ry, 0, 0, TAU); g.fill(); } if (x > w - 400) { g.beginPath(); g.ellipse(x - w, y, rx, ry, 0, 0, TAU); g.fill(); } }
  return (MIST = c);
}
export function mist(g, t, k = 1, lift = 0, o = {}) {
  if (k <= 0) return;
  const s = mistSprite(), y0 = (o.y ?? 470) - lift * 60, a = k * (1 - lift * 0.85);
  g.save();
  for (const [sp, dy, sc, al] of [[6, -40, 0.8, 0.7], [10, 20, 1, 1], [15, 90, 1.25, 0.8]]) {
    const off = ((t * sp) % s.width + s.width) % s.width;
    g.globalAlpha = a * al;
    for (let x = -M - off; x < W + M; x += s.width) g.drawImage(s, x, y0 + dy - s.height * sc / 2, s.width, s.height * sc);
  }
  g.restore();
}
// small birds flapping slowly across the sky (ink ticks), n of them
export function birds(g, t, n = 4, area = { x0: -100, x1: 2020, y0: 120, y1: 360 }, seed = 3, scale = 1, color = 'rgba(50,40,44,0.75)') {
  g.save(); g.strokeStyle = color; g.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const sp = 22 + 14 * noise1(i, seed), span0 = area.x1 - area.x0 + 200, u = ((t * sp + i * 523) % span0 + span0) % span0;
    const x = area.x0 - 100 + u, y = area.y0 + (area.y1 - area.y0) * noise1(i * 3.3 + t * 0.03, seed + 1) + Math.sin(t * 0.8 + i) * 6;
    const fl = Math.sin(t * (6 + (i % 3)) + i * 2), s = scale * (6 + 3 * noise1(i, seed + 2));
    g.lineWidth = 1.3 * scale; g.beginPath(); g.moveTo(x - s, y - fl * s * 0.6); g.quadraticCurveTo(x - s * 0.4, y - s * 0.2 - fl * s * 0.3, x, y); g.quadraticCurveTo(x + s * 0.4, y - s * 0.2 - fl * s * 0.3, x + s, y - fl * s * 0.6); g.stroke();
  }
  g.restore();
}
// swallows at dusk: dark, fork-tailed, swooping low over the yard and the meadow
export function swallows(g, t, n = 5, area = { x0: 200, x1: 1700, y0: 200, y1: 600 }, seed = 7, scale = 1) {
  for (let i = 0; i < n; i++) {
    const w = 0.22 + 0.08 * noise1(i, seed), ph = i * 1.9, cx = (area.x0 + area.x1) / 2 + (area.x1 - area.x0) * 0.3 * Math.sin(t * 0.06 + ph);
    const x = cx + (area.x1 - area.x0) * 0.3 * Math.cos(t * w + ph), y = (area.y0 + area.y1) / 2 + (area.y1 - area.y0) * 0.4 * Math.sin(t * w * 1.7 + ph);
    const vx = -Math.sin(t * w + ph), vy = Math.cos(t * w * 1.7 + ph) * 1.7 * 0.6, ang = Math.atan2(vy, vx), fl = Math.sin(t * 10 + i * 3) * 0.3, sc = scale * (0.8 + 0.3 * noise1(i, seed + 1));
    g.save(); g.translate(x, y); g.rotate(ang); g.scale(sc, sc); g.fillStyle = 'rgba(36,32,48,0.85)';
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(3, 0); g.quadraticCurveTo(-1, sd * (8 + fl * 5), -10, sd * (14 - fl * 4)); g.quadraticCurveTo(-3, sd * (5 + fl * 2), -2, 0); g.closePath(); g.fill(); }
    g.beginPath(); g.ellipse(0, 0, 6, 2, 0, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(-5, 0); g.lineTo(-14, -3.5); g.lineTo(-9, 0); g.lineTo(-14, 3.5); g.closePath(); g.fill();
    g.restore();
  }
}
// butterflies: cabbage whites, a common blue and a brimstone, wandering
export function butterflies(g, t, n = 2, area = { x0: 700, x1: 1700, y0: 600, y1: 860 }, seed = 3, scale = 1) {
  const cols = ['#f8f4e8', '#9ab4e0', '#f0e070'];
  for (let i = 0; i < n; i++) {
    const s = seed * 10 + i, u = t * 0.035 + i * 7.1;
    const x = area.x0 + (area.x1 - area.x0) * noise1(u, s), y = area.y0 + (area.y1 - area.y0) * noise1(u * 1.3 + 4, s + 9) + Math.sin(t * 2.2 + i) * 6;
    const vx = noise1(u + 0.02, s) - noise1(u - 0.02, s), face = vx >= 0 ? 1 : -1, flap = Math.abs(Math.cos(t * 7.5 + i * 2)), col = cols[(i + seed) % 3];
    g.save(); g.translate(x, y); g.scale(face * scale, scale);
    for (const [wy, wl, wh] of [[-1, 8, 6.5], [1.5, 6, 4.5]]) { g.fillStyle = rgba(col, 0.95); g.beginPath(); g.ellipse(-wl * 0.15, wy - wh * flap * 0.6, wl * 0.6, wh * (0.25 + 0.75 * flap) * 0.6, -0.5, 0, TAU); g.fill(); g.strokeStyle = rgba(INKC, 0.55); g.lineWidth = 0.6; g.stroke(); }
    g.strokeStyle = rgba(INKC, 0.85); g.lineWidth = 1.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-3, 1); g.lineTo(4, -1); g.stroke();
    g.lineWidth = 0.5; g.beginPath(); g.moveTo(4, -1); g.lineTo(7, -4); g.moveTo(4, -1); g.lineTo(7.5, -2.5); g.stroke();
    g.restore();
  }
}
// bumblebees bumbling from flower to flower in a small area
export function bees(g, t, n = 3, area = { x0: 0, x1: 300, y0: 600, y1: 700 }, seed = 5, scale = 1) {
  for (let i = 0; i < n; i++) {
    const s = seed * 13 + i, u = t * 0.09 + i * 4.3, x = area.x0 + (area.x1 - area.x0) * noise1(u, s) + Math.sin(t * 5 + i) * 3, y = area.y0 + (area.y1 - area.y0) * noise1(u * 1.2 + 3, s + 2) + Math.sin(t * 7 + i * 2) * 2;
    const face = noise1(u + 0.02, s) - noise1(u - 0.02, s) >= 0 ? 1 : -1, wing = Math.abs(Math.sin(t * 40 + i));
    g.save(); g.translate(x, y); g.scale(face * scale, scale);
    g.fillStyle = 'rgba(240,244,250,0.6)'; g.beginPath(); g.ellipse(-1, -4 - wing, 3.2, 2 + wing, -0.4, 0, TAU); g.fill();
    g.fillStyle = '#3a2c22'; g.beginPath(); g.ellipse(0, 0, 4.4, 3.2, 0, 0, TAU); g.fill();
    g.fillStyle = '#e8b830'; g.beginPath(); g.ellipse(0.6, 0, 1.4, 3, 0, 0, TAU); g.fill(); g.fillStyle = '#f4ecd8'; g.beginPath(); g.ellipse(-3.2, 0, 1.2, 2.4, 0, 0, TAU); g.fill();
    g.restore();
  }
}
// smoke curling from a chimney (k: 0..1), drifting with the breeze (wind: px per s, + right)
export function chimneySmoke(g, t, at, k = 1, wind = 12, o = {}) {
  if (k <= 0 || !at) return;
  const [x, y] = at, col = o.color || '236,232,236';
  g.save();
  for (let i = 0; i < 14; i++) {
    const ph = ((t * 0.09 + i / 14) % 1), h = ph * 230, sz = 8 + ph * 36;
    const px = x + wind * ph * 9 + Math.sin(t * 0.6 + i * 1.7 + ph * 5) * (4 + ph * 18), py = y - h;
    const a = k * 0.32 * Math.sin(ph * Math.PI) * (1 - ph * 0.5);
    if (a < 0.01) continue;
    const gr = g.createRadialGradient(px, py, 0, px, py, sz); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
    g.fillStyle = gr; g.fillRect(px - sz, py - sz, sz * 2, sz * 2);
  }
  g.restore();
}
// water dripping from the pump's spout into the trough, with rings
export function pumpDrip(g, t, k = 1) {
  if (k <= 0) return;
  const [sx, sy] = PUMP.spout, ty = PUMP.y - 42, period = 1.7, ph = (t % period) / period;
  g.save(); g.globalAlpha = k;
  if (ph < 0.35) { const yy = sy + (ty - sy) * Math.pow(ph / 0.35, 2); g.fillStyle = 'rgba(220,234,244,0.85)'; g.beginPath(); g.ellipse(sx, yy, 1.8, 2.6, 0, 0, TAU); g.fill(); }
  else { const u = (ph - 0.35) / 0.65; g.strokeStyle = `rgba(230,240,250,${0.6 * (1 - u)})`; g.lineWidth = 1; g.beginPath(); g.ellipse(sx, ty, 4 + u * 22, (4 + u * 22) * 0.22, 0, 0, TAU); g.stroke(); }
  g.restore();
}
// a candle / lantern flicker value around 1 (smooth)
export function flicker(t, seed = 0) { return 0.88 + 0.07 * noise1(t * 2.3, 31 + seed) + 0.05 * Math.sin(t * 7.3 + seed) * noise1(t * 0.9, 32 + seed); }
// warm light round a flame at (x, y), radius R
export function candleGlow(g, t, x, y, R = 260, k = 1, seed = 0) {
  if (k <= 0) return;
  const f = flicker(t, seed);
  g.save(); g.globalCompositeOperation = 'lighter';
  pool(g, x, y, R * (0.96 + 0.04 * f), R * 0.9, '#ffb050', 0.16 * k * f);
  pool(g, x, y, R * 0.35, R * 0.32, '#ffe6a8', 0.2 * k * f);
  g.restore();
}
// a little painted flame (teardrop) standing on (x, y), h tall, swaying
export function flame(g, t, x, y, h = 26, k = 1, seed = 0) {
  if (k <= 0) return;
  const f = flicker(t, seed), sway = (noise1(t * 1.7, 40 + seed) - 0.5) * h * 0.25, hh = h * (0.9 + 0.15 * f);
  g.save(); g.globalAlpha *= k;
  g.globalCompositeOperation = 'lighter'; pool(g, x, y - hh * 0.4, h * 1.4, h * 1.6, '#ffc060', 0.35 * f);
  g.globalCompositeOperation = 'source-over';
  const fl = (w, hgt, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(x - w, y - hgt * 0.15); g.quadraticCurveTo(x - w, y - hgt * 0.55, x + sway, y - hgt); g.quadraticCurveTo(x + w, y - hgt * 0.55, x + w, y - hgt * 0.15); g.quadraticCurveTo(x, y + w * 0.6, x - w, y - hgt * 0.15); g.fill(); };
  fl(h * 0.2, hh, 'rgba(255,170,60,0.9)'); fl(h * 0.12, hh * 0.72, 'rgba(255,236,170,0.95)');
  g.fillStyle = 'rgba(90,110,200,0.5)'; g.beginPath(); g.ellipse(x, y - h * 0.08, h * 0.08, h * 0.08, 0, 0, TAU); g.fill();
  g.restore();
}
// the night sky (stars and moon) kept to where the sky shows (a layer's skyMask)
let SKYBUF = null;
export function nightSky(g, t, c, skyMask, k = 1, appear = -99, moonAt = MOODS.night.moon, moonK = 1) {
  if (k <= 0 || !skyMask) return;
  if (!SKYBUF) SKYBUF = canvas(W, H, false);
  const b = SKYBUF.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H);
  cam(b, c, 1); softStars(b, t, k, appear); moon(b, moonAt[0], moonAt[1], 40, moonK * k);
  b.globalCompositeOperation = 'destination-in'; b.drawImage(skyMask, -M, -MY, LW, LH); b.globalCompositeOperation = 'source-over';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(SKYBUF, 0, 0); g.restore();
}

// ---------------------------------------------------------------- the farmyard for one frame
const LANTERN = {};
function lanternSprite() {
  if (LANTERN.s) return LANTERN.s;
  return (LANTERN.s = sprite({ x0: -16, y0: -46, x1: 16, y1: 6, w: 32, h: 52 }, 3, (g) => {
    ink(g, [[0, -46], [0, -38]], { width: 1.4, alpha: 0.9 }); ink(g, ellipse(0, -42, 5, 4, 10), { closed: true, width: 1.2, alpha: 0.8 });
    const body = [[-10, -34], [10, -34], [12, 0], [-12, 0]];
    g.fillStyle = 'rgba(255,214,140,0.9)'; path(g, body); g.fill();
    wash(g, [[-12, -38], [12, -38], [8, -32], [-8, -32]], { color: '#3a3430', opacity: 0.98, seed: 3, under: true, layers: 6 });
    wash(g, rect(-13, 0, 13, 5), { color: '#3a3430', opacity: 0.98, seed: 4, under: true, layers: 6 });
    for (const x of [-10, 0, 10]) ink(g, [[x, -33], [x * 1.15, 0]], { width: 1.4, alpha: 0.85 });
  }, { grain: 0.1, seed: 5 }));
}
export function drawLantern(g, t, x, y, k = 1) {
  const sw = Math.sin(t * 0.7) * 0.03;
  candleGlow(g, t, x, y - 18, 230, k, 3);
  g.save(); g.translate(x, y - 46); g.rotate(sw); g.translate(-x, -y + 46); g.translate(x, y); drawSprite(g, lanternSprite(), 1); flame(g, t, 0, -8, 16, k, 3); g.restore();
}
// The whole farmyard for one frame. c: camera (view()). o: behind(g) (after the gate, before the actors), actors(g),
// after(g) (over the foreground); gateOpen 0..1; smoke (default 1); lantern (default on at night); ambient (default on);
// sunK (dawn rays strength), mistK / mistLift (dawn mist), starsK, starsAppear (night), fireflies (night count).
export function drawFarm(g, t, c, mood = 'dawn', o = {}) {
  const m = MD(mood), L = farmLayers(m);
  drawH(g, c, L.back);
  if (m.name === 'night') nightSky(g, t, c, L.skyMask, o.starsK ?? 1, o.starsAppear ?? -99);
  cam(g, c, 1);
  const amb = o.ambient !== false;
  if (amb && m.name === 'dawn') { mist(g, t, o.mistK ?? 0.6, o.mistLift ?? 0, { y: 505 }); sunRays(g, t, m.sun, (o.sunK ?? 1) * 0.7); }
  if (amb && m.name === 'night') mist(g, t, 0.25, 0, { y: 520 });
  g.drawImage(L.near, -M, -MY, LW, LH);
  chimneySmoke(g, t, FREF.chim1, o.smoke ?? (m.name === 'night' ? 0.4 : 1), m.name === 'dusk' ? 6 : 12, m.name === 'night' ? { color: '160,170,200' } : {});
  if (amb && m.name === 'dawn') birds(g, t, 5, undefined, 3, 1);
  if (amb && m.name === 'dusk') swallows(g, t, 6, undefined, 7, 1);
  drawGate(g, o.gateOpen || 0, m);
  if (o.behind) o.behind(g);
  if (m.name === 'night' && o.lantern !== false) { ink(g, [[BYRE.lantern[0], BYRE.lantern[1] - 62], [BYRE.lantern[0], BYRE.lantern[1] - 44]], { width: 1.2, alpha: 0.8 }); drawLantern(g, t, BYRE.lantern[0], BYRE.lantern[1], o.lantern ?? 1); }
  if (o.actors) o.actors(g);
  g.drawImage(L.front, -M, -MY, LW, LH);
  if (amb) {
    if (m.name === 'dawn') { sunRays(g, t, m.sun, (o.sunK ?? 1) * 0.35); butterflies(g, t, 1, { x0: 200, x1: 700, y0: 620, y1: 760 }, 4); bees(g, t, 2, { x0: 80, x1: 300, y0: 860, y1: 940 }, 5); pumpDrip(g, t); }
    else if (m.name === 'dusk') { butterflies(g, t, 1, { x0: 300, x1: 900, y0: 640, y1: 800 }, 6); pumpDrip(g, t, 0.7); }
    else if (m.name === 'night') fireflies(g, t, o.fireflies ?? 8, { x0: 300, x1: 1300, y0: 520, y1: 760 }, 21, 0.8);
  }
  if (o.after) o.after(g);
}

// ================================================================ THE COUNTRY LANE: the side-on travelling set
// Six planes painted wide and drawn far to near, each sliding left by scroll * k (Molly walks left to right; the camera
// keeps pace with her, so the lane under her feet moves at k = 1 and the near verge streams past fastest):
//   sky (0.03, drifting), far (0.09: violet fells and the market town with its church spire, the walk's destination),
//   mid (0.32: patchwork fields, sheep, the brook coming down from the hills), hedge (0.75: the hedgerow on the far side
//   of the lane with foxgloves, cow parsley and dog roses, a field gate, the stile, the brook's gap), lane (1: the
//   lane itself, its ruts and stones, the little hump-backed bridge, the stony bit where the milk is spilt) and near
//   (1.4: the near verge, buttercups and tall grass, now and then a tall plant sweeping past in front).
// Scroll is in lane units (page px of the lane plane). Features arrive at page x 960 at these scrolls:
//   LANE_PAN.stileAt 1300, LANE_PAN.bridgeAt 2600, LANE_PAN.spillAt 4500 (max 4800).
// Ground: LANE_PAN.groundAt(x, scroll) is the page y of the lane's walking line at page x (it rises over the bridge).
const LPAN = 4800, BRIDGE_X = 960 + 2600, BRIDGE_HALF = 250, SPILL_X = 960 + 4500, STILE_X = 960 + 1300 * 0.75, GATE_X = 960 + 300 * 0.75, BROOK_HX = 960 + 2600 * 0.75, BROOK_MX = 960 + 2600 * 0.32, BROOK_NX = 960 + 2600 * 1.4, TOWN_X = 1660;
const hump = (u) => (Math.abs(u) < 1 ? Math.pow(Math.cos(u * Math.PI / 2), 2) : 0);
const laneLift = (X) => 40 * hump((X - BRIDGE_X) / BRIDGE_HALF);
const laneGround = (X) => 870 + 3.5 * Math.sin(X * 0.0037) + 2.5 * Math.sin(X * 0.011 + 1) - laneLift(X);
const LPL = [
  { name: 'sky', k: 0.03, y0: -MY, y1: 560 },
  { name: 'far', k: 0.09, y0: 240, y1: 600 },
  { name: 'mid', k: 0.32, y0: 380, y1: 800 },
  { name: 'hedge', k: 0.75, y0: 360, y1: 870 },
  { name: 'lane', k: 1, y0: 760, y1: 1030 },
  { name: 'near', k: 1.4, y0: 560, y1: H + MY },
];
export const LANE_PAN = {
  max: LPAN, planes: LPL.map((p) => ({ name: p.name, k: p.k })),
  stileAt: 1300, bridgeAt: 2600, spillAt: 4500,
  groundAt: (x, scroll) => laneGround(x + scroll),                 // page y of the walking line at page x
  worldX: (x, scroll) => x + scroll,                               // lane-plane x under page x
  spillPoint: (scroll) => [SPILL_X - scroll, laneGround(SPILL_X) + 4],  // the stony bit, on the page at this scroll
  feetH: 330,                                                     // a good height for Molly on this set (px)
};
const LSHEEP = [];   // grazing sheep drawn live on the mid plane: [x, y, size, facing, seed]

// --- the planes' painters (x0..x1: the plane's own x extent)
function laneFar(g, x0, x1) {
  const r = rng(301);
  const fells = hillLine(x0, x1, 372, 92, 3, 30, 0.0016);
  hillBand(g, fells, 620, ['#a6a8c6', '#b4aec8', '#9ca4c2', '#bcb2c6'], 302, { base: 0.5, inkA: 0.3 });
  const downs = hillLine(x0, x1, 452, 46, 7, 30, 0.0024);
  const sh = hillBand(g, downs, 620, ['#a8b8a4', '#9cb098', '#b4c0a8'].map((c) => mix(c, '#d4d8cc', 0.25)), 303, { base: 0.6, inkA: 0.32, lifts: 0.25 });
  g.save(); path(g, sh); g.clip();
  for (let k = 0; k < 5; k++) { const off = 8 + k * k * 5, strip = downs.map(([x, y]) => [x, y + off]);
    for (let x = x0; x < x1; x += r.range(4, 8)) { if (r() < 0.05) { x += 16; continue; } const y = yOn(strip, x), s0 = 1.3 + k * 0.45; g.fillStyle = rgba(mix(r.pick(C.hedge), '#c8ccc0', 0.4), 0.8); g.beginPath(); g.ellipse(x, y, s0 * 1.2, s0 * 0.8, 0, 0, TAU); g.fill(); }
    for (let q = 0; q < (x1 - x0) / 500; q++) { const tx = r.range(x0, x1); roundTree(g, tx, yOn(strip, tx), 4 + k * 1.4, 310 + k * 30 + q, { haze: 0.4, inkA: 0.3, lw: 0.6, noDabs: true }); } }
  g.restore();
  // the market town on its hill: little roofs, a church with a tall spire, a wisp of smoke
  const ty = yOn(downs, TOWN_X) + 10, hz = (c) => mix(c, '#d8d4d8', 0.35);
  for (let i = 0; i < 16; i++) { const hx = TOWN_X + r.range(-150, 170), hy = ty + r.range(-6, 16), hw = r.range(9, 16), hh = r.range(8, 14);
    wash(g, rect(hx - hw, hy - hh, hx + hw, hy), { color: hz(r.pick(['#ece4d4', '#e4d8c4', '#d8ccbc'])), opacity: 0.95, seed: 320 + i, under: true, layers: 6 });
    wash(g, [[hx - hw - 2, hy - hh], [hx, hy - hh - hw * 0.7], [hx + hw + 2, hy - hh]], { color: hz(r.pick(['#a86a54', '#8a7a78', '#b07a5c'])), opacity: 0.95, seed: 340 + i, under: true, layers: 6 });
    ink(g, [[hx - hw, hy], [hx - hw, hy - hh], [hx, hy - hh - hw * 0.7], [hx + hw, hy - hh], [hx + hw, hy]], { width: 0.6, alpha: 0.35, seed: 360 + i }); }
  { const cx = TOWN_X + 40, cy = ty - 4, tw = 16;
    wash(g, rect(cx - 50, cy - 26, cx - 4, cy), { color: hz('#d8d0c0'), opacity: 0.96, seed: 380, under: true, layers: 6 });
    wash(g, [[cx - 54, cy - 26], [cx - 27, cy - 40], [cx, cy - 26]], { color: hz('#8a8890'), opacity: 0.95, seed: 381, under: true, layers: 6 });
    wash(g, rect(cx - tw / 2, cy - 64, cx + tw / 2, cy), { color: hz('#dcd4c4'), opacity: 0.97, seed: 382, under: true, layers: 6 });
    wash(g, [[cx - tw / 2 - 1, cy - 64], [cx, cy - 138], [cx + tw / 2 + 1, cy - 64]], { color: hz('#9a98a0'), opacity: 0.97, seed: 383, under: true, layers: 6 });
    ink(g, [[cx - tw / 2, cy], [cx - tw / 2, cy - 64], [cx, cy - 138], [cx + tw / 2, cy - 64], [cx + tw / 2, cy]], { width: 0.8, alpha: 0.5, seed: 384 });
    g.fillStyle = rgba('#6a6060', 0.6); g.fillRect(cx - 2, cy - 54, 4, 7); g.strokeStyle = rgba('#6a6060', 0.7); g.lineWidth = 0.8; g.beginPath(); g.moveTo(cx, cy - 138); g.lineTo(cx, cy - 148); g.moveTo(cx - 3, cy - 144); g.lineTo(cx + 3, cy - 144); g.stroke();
    LANE_PAN.spire = [cx, cy - 148]; }
  for (let q = 0; q < 5; q++) { const tx = TOWN_X + r.range(-190, 210); roundTree(g, tx, ty + r.range(6, 18), r.range(7, 11), 390 + q, { haze: 0.35, inkA: 0.3, lw: 0.6, noDabs: true }); }
  g.save(); g.globalCompositeOperation = 'source-atop'; const hg = g.createLinearGradient(0, 300, 0, 600); hg.addColorStop(0, 'rgba(232,236,236,0.35)'); hg.addColorStop(1, 'rgba(232,236,236,0.1)'); g.fillStyle = hg; g.fillRect(x0 - 50, 240, x1 - x0 + 100, 380); g.restore();
}
const brookMid = () => smooth([[BROOK_MX - 260, 520], [BROOK_MX - 170, 556], [BROOK_MX - 220, 600], [BROOK_MX - 90, 650], [BROOK_MX - 60, 700], [BROOK_MX, 760], [BROOK_MX + 10, 810]], false, 8);
function laneMid(g, x0, x1, o = {}) {
  const r = rng(401);
  const top = hillLine(x0, x1, 520, 40, 11, 30, 0.003);
  const sh = hillBand(g, top, 820, C.meadow.concat(['#b4c47e']), 402, { base: 0.6, inkA: 0.4, lifts: 0.22, count: Math.round((x1 - x0) / 12) });
  g.save(); path(g, sh); g.clip();
  // fields: strips with hedgerows between, a few in hay or plough for a patchwork
  const rows = [];
  for (let k = 0; k < 5; k++) rows.push(top.map(([x, y]) => [x, y + 12 + k * k * 10 + 7 * Math.sin(x * 0.002 + k) + 22 * (noise1(x * 0.0016, k + 20) - 0.5) * (k ? 1 : 0)]));
  for (let k = 0; k < 4; k++) {
    for (let xa = x0; xa < x1; ) { const w = r.range(260, 620), xb = Math.min(x1, xa + w), c = r.pick(['#b4c27c', '#a8bc70', '#98ac64', '#d4c890', '#bcc684', '#c8b88a', '#8ea85e', '#c0c47c']);
      const strip = rows[k].filter(([x]) => x >= xa && x <= xb), nxt = rows[k + 1].filter(([x]) => x >= xa && x <= xb);
      if (strip.length > 1) { const f = strip.concat(nxt.slice().reverse()); wash(g, f, { color: c, opacity: 0.72, seed: 410 + k * 50 + Math.round(xa), bleed: 0.02, layers: 8, edge: 0.05 });
        if (c === '#d4c890' || c === '#c8b88a') { g.save(); path(g, f); g.clip(); for (let q = 0; q < 14; q++) { const yy = lerp(strip[0][1], nxt[0][1], q / 14); ink(g, [[xa, yy], [xb, yy + 4]], { color: shade(c, 0.3), width: 0.6, alpha: 0.25, gaps: 1.4, seed: 420 + q + Math.round(xa) }); } g.restore(); } }
      // a cross hedge down the slope
      const ya = yOn(rows[k], xb), yb2 = yOn(rows[k + 1], xb + 18);
      for (let u = 0; u <= 1; u += 0.08) { const s0 = 2 + k * 1.2; g.fillStyle = rgba(r.pick(C.hedge), 0.9); g.beginPath(); g.ellipse(xb + 18 * u, lerp(ya, yb2, u) - s0 * 0.5, s0 * 1.2, s0 * 0.8, 0, 0, TAU); g.fill(); }
      xa = xb; }
    { const pts = rows[k + 1].filter((_, i) => i % 3 === 0); let i0 = 0; while (i0 < pts.length - 2) { const n = 14 + Math.floor(r() * 30), seg = pts.slice(i0, i0 + n); if (seg.length > 1) hedgerow(g, seg, 6 + k * 4, 440 + k * 50 + i0, { step: 2, lw: 0.6, inkA: 0.35, dabs: 0.6 }); i0 += n - 1 + (r() < 0.3 ? 2 : 0); } }
    for (let q = 0; q < (x1 - x0) / 420; q++) { const tx = r.range(x0, x1); roundTree(g, tx, yOn(rows[k + 1], tx) - 2, 9 + k * 5, 450 + k * 40 + q, { inkA: 0.45 }); }
  }
  g.restore();
  if (o.brook !== false) {
  // the brook coming down from the hills, with alders along it
  const bp = brookMid(), L = [], Rr = [];
  bp.forEach(([x, y], i) => { const w = 2 + Math.pow(i / (bp.length - 1), 1.6) * 26; L.push([x - w, y]); Rr.push([x + w, y]); });
  const water = L.concat(Rr.reverse());
  wash(g, water, { color: '#8eaec4', opacity: 0.9, seed: 470, under: '#dce8ec', bleed: 0.01, layers: 10 });
  glaze(g, water, BROOK_MX - 40, 720, 40, 60, '#e8f2f6', 0.7);
  ink(g, L, { width: 0.9, alpha: 0.5, gaps: 0.8, seed: 471 });
  for (let q = 0; q < 7; q++) { const [bx, by] = bp[Math.floor(r.range(4, bp.length - 4))]; roundTree(g, bx + r.pick([-1, 1]) * r.range(30, 50), by + 6, r.range(16, 26), 472 + q, { cols: ['#7a8a66', '#6a7c5a', '#8a9870'], inkA: 0.45 }); }
  }
  // sheep, dotted about the fields (a few more are drawn live, grazing)
  for (let q = 0; q < (x1 - x0) / 90; q++) { const sx = r.range(x0, x1), k = r.range(0.5, 3.5), sy = yOn(rows[Math.floor(k)], sx) + 6 + r.range(0, 20); if (o.brook !== false && Math.abs(sx - BROOK_MX) < 160) continue;
    const s = 8 + (sy - 520) * 0.07; if (o.live !== false && r() < 0.18) LSHEEP.push([sx, sy, s, r() < 0.5 ? 1 : -1, 500 + q]); else paintSheep(g, sx, sy, s, r() < 0.5 ? 1 : -1, 500 + q, { down: r.range(0, 1) }); }
}
// --- hedge plane bits
function stilePainted(g, x, y) {
  // a wooden stile in a gap in the hedge: two stout posts, a top rail, a step, with a fingerpost beside it
  const post = (px, h, sd) => { const p = rect(px - 6, y - h, px + 6, y + 6); wash(g, p, { color: '#8a6a4c', opacity: 0.98, seed: sd, under: true, layers: 8 }); hatch(g, p, { count: 10, len: 12, width: 0.8, alpha: 0.5, dir: () => Math.PI / 2, seed: sd + 1 }); penLine(g, p, { sharp: true, closed: true, w: 1.5, alpha: 0.85 }); };
  post(x - 46, 92, 601); post(x + 46, 92, 602); post(x - 4, 52, 603);
  for (const [ry, h] of [[y - 78, 9], [y - 40, 8]]) { const rail = rect(x - 54, ry, x + 54, ry + h); wash(g, rail, { color: '#9a7a58', opacity: 0.98, seed: 604 + ry, under: true, layers: 8 }); penLine(g, rail, { sharp: true, closed: true, w: 1.4, alpha: 0.8 }); }
  const step = rect(x - 30, y - 36, x + 22, y - 28); wash(g, step, { color: '#a8865e', opacity: 0.98, seed: 606, under: true }); penLine(g, step, { sharp: true, closed: true, w: 1.4, alpha: 0.8 });
  const fx = x + 96, fp = rect(fx - 5, y - 150, fx + 5, y + 6); wash(g, fp, { color: '#e8e0d0', opacity: 0.98, seed: 607, under: true }); penLine(g, fp, { sharp: true, closed: true, w: 1.3, alpha: 0.8 });
  const arm = [[fx - 4, y - 140], [fx + 54, y - 140], [fx + 66, y - 131], [fx + 54, y - 122], [fx - 4, y - 122]];
  wash(g, arm, { color: '#ece4d4', opacity: 0.98, seed: 608, under: true }); penLine(g, arm, { sharp: true, closed: true, w: 1.3, alpha: 0.8 });
  g.save(); g.fillStyle = rgba('#4a3a30', 0.75); g.font = 'italic 12px "Fell", Georgia, serif'; g.fillText('Market', fx + 6, y - 127); g.restore();
}
function fieldGate(g, x, y) {
  const post = (px) => { const p = rect(px - 7, y - 84, px + 7, y + 6); wash(g, p, { color: '#8a7a64', opacity: 0.98, seed: 620 + px, under: true }); penLine(g, p, { sharp: true, closed: true, w: 1.5, alpha: 0.85 }); };
  post(x - 74); post(x + 74);
  for (let k = 0; k < 5; k++) { const ry = y - 74 + k * 15, b = rect(x - 68, ry, x + 68, ry + 5); wash(g, b, { color: '#c8bca4', opacity: 0.98, seed: 630 + k, under: true, layers: 6 }); penLine(g, b, { sharp: true, closed: true, w: 1, alpha: 0.75 }); }
  const br = ribbon([[x - 66, y - 10], [x + 66, y - 72]], 6, 6); wash(g, br, { color: '#bcb098', opacity: 0.98, seed: 640, under: true }); penLine(g, br, { sharp: true, closed: true, w: 1, alpha: 0.7 });
}
function laneHedge(g, x0, x1) {
  const r = rng(501), base = (x) => 790 + 6 * Math.sin(x * 0.003) + 4 * noise1(x * 0.01, 3);
  // the bank: a grassy verge under the hedge, running down to the lane
  const bankTop = []; for (let x = x0 - 40; x <= x1 + 40; x += 30) bankTop.push([x, base(x) - 10]);
  const bank = bankTop.concat([[x1 + 40, 880], [x0 - 40, 880]]);
  brushW(g, bank, C.grass, { seed: 502, count: Math.round((x1 - x0) / 10), width: [8, 26], len: [40, 160], angle: () => -0.05, alpha: [0.14, 0.3], base: 0.65, under: true, lifts: 0.2 });
  // the brook's channel through the bank
  { const bx = BROOK_HX, ch = smooth([[bx - 40, 784], [bx + 40, 784], [bx + 70, 880], [bx - 70, 880]]); wash(g, ch, { color: '#8eaec4', opacity: 0.92, seed: 503, under: '#dce8ec', layers: 10 }); glaze(g, ch, bx - 10, 840, 30, 30, '#e8f2f6', 0.6); ink(g, [[bx - 40, 784], [bx - 70, 880]], { width: 1, alpha: 0.5 }); ink(g, [[bx + 40, 784], [bx + 70, 880]], { width: 1, alpha: 0.5 }); }
  // hedge runs between the gaps (the field gate, the stile, the brook)
  const gaps = [[GATE_X - 84, GATE_X + 84], [STILE_X - 56, STILE_X + 56], [BROOK_HX - 70, BROOK_HX + 70]];
  const runs = []; let xa = x0 - 40;
  for (const [ga, gb] of gaps) { runs.push([xa, ga]); xa = gb; } runs.push([xa, x1 + 40]);
  const trees = [];
  for (let tx = x0 + r.range(200, 500); tx < x1; tx += r.range(650, 1100)) if (!gaps.some(([a, b]) => tx > a - 120 && tx < b + 120)) trees.push(tx);
  // hedgerow trees behind the hedge (oak and ash), their crowns high over it
  for (const [i, tx] of trees.entries()) {
    const gy = base(tx) - 40, S = r.range(0.75, 1);
    limb(g, [[tx, gy], [tx - 6, gy - 120 * S], [tx + 4, gy - 220 * S]], 34 * S, 20 * S, 520 + i * 7);
    for (const [dx, dy] of [[-70, -230], [60, -250], [0, -300], [-110, -170], [110, -180], [-40, -200], [50, -190]]) clump(g, tx + dx * S + r.gauss(0, 8), gy + dy * S + r.gauss(0, 8), r.range(56, 76) * S, 530 + i * 13 + dx, {});
  }
  runs.forEach(([a, b], i) => {
    if (b - a < 20) return;
    const pts = []; for (let x = a; x <= b; x += 90) pts.push([x, base(x)]); if (pts[pts.length - 1][0] < b) pts.push([b, base(b)]);
    const hh = (x) => 110 + 50 * noise1(x * 0.004, 9) + (gaps.some(([ga, gb]) => Math.abs(x - ga) < 60 || Math.abs(x - gb) < 60) ? -40 : 0);
    // the hedge: one long hedgerow of humps, then extra clumps for height variation
    hedgerow(g, pts, 70, 560 + i, { step: 2, dabs: 3, lw: 1 });
    for (let x = a + 30; x < b - 30; x += r.range(50, 80)) clump(g, x, base(x) - hh(x) * 0.6, r.range(36, 52), 580 + Math.round(x), { cols: ['#5e7642', '#6a8048', '#56703e', '#7a8e50'] });
    // hawthorn blossom and dog roses over the top
    for (let x = a + 40; x < b - 40; x += r.range(120, 240)) rambler(g, [[x, base(x) - hh(x) * 0.4], [x + 30, base(x) - hh(x) * 0.95], [x + 80, base(x) - hh(x) * 1.05], [x + 120, base(x) - hh(x) * 0.7]], 600 + Math.round(x), { roses: 0.55 });
    for (let k = 0; k < (b - a) / 40; k++) { const fx = r.range(a, b), fy = base(fx) - r.range(30, hh(fx) * 0.9); g.fillStyle = rgba('#f8f2e4', 0.9); for (let q = 0; q < 5; q++) { g.beginPath(); g.arc(fx + r.gauss(0, 5), fy + r.gauss(0, 3), 1.6, 0, TAU); g.fill(); } }
  });
  fieldGate(g, GATE_X, base(GATE_X));
  stilePainted(g, STILE_X, base(STILE_X));
  // the verge in front of the hedge: foxgloves, cow parsley, red campion, buttercups
  for (let x = x0 + r.range(40, 160); x < x1; x += r.range(140, 300)) { if (gaps.some(([a, b]) => x > a - 10 && x < b + 10)) continue;
    const n = 1 + Math.floor(r() * 3); for (let q = 0; q < n; q++) foxglove(g, x + q * r.range(14, 26), base(x) + r.range(4, 22), r.range(110, 170), 700 + Math.round(x) + q); }
  for (let x = x0 + r.range(0, 80); x < x1; x += r.range(50, 110)) { if (gaps.some(([a, b]) => x > a && x < b) && r() < 0.8) continue; cowParsley(g, x, base(x) + r.range(14, 36), r.range(70, 120), 800 + Math.round(x), { n: 2 + Math.floor(r() * 2) }); }
  for (let k = 0; k < (x1 - x0) / 60; k++) { const fx = r.range(x0, x1), fy = base(fx) + r.range(20, 70); g.strokeStyle = rgba('#6a8048', 0.7); g.lineWidth = 0.8; g.beginPath(); g.moveTo(fx, fy + 10); g.lineTo(fx, fy); g.stroke(); dogRose(g, fx, fy, 3.2, 900 + k, { col: r.pick(['#d8507a', '#e0688a', '#c84870']) }); } // red campion
  for (let i = 0; i < (x1 - x0) / 28; i++) { const x = r.range(x0, x1); grassFlicks(g, x, base(x) + r.range(30, 84), r.range(12, 24), { seed: 1000 + i, n: 5, colors: C.grass, inkA: 0.35 }); }
  buttercups(g, { x0, x1, y0: 820, y1: 870 }, Math.round((x1 - x0) / 14), 1100, 1.2);
}
// --- the lane itself
function laneEdges(x0, x1) {
  const top = [], bot = [];
  for (let x = x0 - 40; x <= x1 + 40; x += 20) { const lift = laneLift(x); top.push([x, 828 + 3 * noise1(x * 0.02, 1) - lift]); bot.push([x, 936 + 4 * noise1(x * 0.015, 2) - lift * 0.6]); }
  return { top, bot, shape: top.concat(bot.slice().reverse()) };
}
function bridgePainted(g) {
  const bx = BRIDGE_X, hw = BRIDGE_HALF, r = rng(1201);
  // the far parapet, behind the walker: a low wall of stones following the hump, with rounded coping
  const farTop = (x) => 828 - laneLift(x) - 62, farBot = (x) => 832 - laneLift(x);
  const fp = []; for (let x = bx - hw - 30; x <= bx + hw + 30; x += 12) fp.push([x, farTop(x) + (Math.abs(x - bx) > hw ? (Math.abs(x - bx) - hw) * 1.2 : 0)]);
  const fw = fp.concat(fp.slice().reverse().map(([x]) => [x, farBot(x)]));
  wash(g, fw, { color: '#bcb09c', opacity: 0.98, seed: 1202, under: true });
  g.save(); path(g, fw); g.clip(); for (let row = 0; row < 4; row++) for (let x = bx - hw - 40 + (row % 2) * 16; x < bx + hw + 40; x += r.range(28, 40)) stone(g, x, farBot(x) - 8 - row * 16, r.range(24, 34), 14, r.pick(C.stone), 1210 + row * 100 + Math.round(x), { lw: 1, inkA: 0.6 }); g.restore();
  for (let x = bx - hw - 20; x < bx + hw + 20; x += 16) { const y = yOn(fp, x); stone(g, x + 8, y + 2, 15, 12, r.pick(C.stone), 1400 + Math.round(x), { lw: 1, inkA: 0.6 }); }
  // the near parapet and the face of the bridge with its arch, below the lane's near edge (it runs down into the caption band)
  const nTop = (x) => 930 - laneLift(x) * 0.6;
  const face = []; for (let x = bx - hw - 30; x <= bx + hw + 30; x += 12) face.push([x, nTop(x) - 18 + (Math.abs(x - bx) > hw ? (Math.abs(x - bx) - hw) * 0.6 : 0)]);
  const fc = face.concat([[bx + hw + 30, 1040], [bx - hw - 30, 1040]]);
  wash(g, fc, { color: '#b4a894', opacity: 0.98, seed: 1203, under: true });
  g.save(); path(g, fc); g.clip(); for (let row = 0; row < 8; row++) for (let x = bx - hw - 40 + (row % 2) * 18; x < bx + hw + 40; x += r.range(32, 46)) stone(g, x, nTop(x) + 8 + row * 20, r.range(28, 40), 17, r.pick(C.stone), 1500 + row * 100 + Math.round(x), { lw: 1.1, inkA: 0.6 }); g.restore();
  // the arch: voussoirs round a dark opening, water glinting inside
  const ar = 120, ay = 1046, arch = []; for (let a = Math.PI; a <= TAU + 1e-6; a += Math.PI / 24) arch.push([bx + Math.cos(a) * ar, ay + Math.sin(a) * ar * 0.8]);
  wash(g, arch, { color: '#2e3036', opacity: 0.96, seed: 1204, under: true });
  g.save(); path(g, arch); g.clip(); const lg = g.createLinearGradient(0, ay - 40, 0, ay); lg.addColorStop(0, 'rgba(140,170,190,0)'); lg.addColorStop(1, 'rgba(140,170,190,0.7)'); g.fillStyle = lg; g.fillRect(bx - ar, ay - 50, ar * 2, 50); g.restore();
  for (let k = 0; k <= 12; k++) { const a = Math.PI + k / 12 * Math.PI, ca = Math.cos(a), sa = Math.sin(a), v = [[bx + ca * ar, ay + sa * ar * 0.8], [bx + ca * (ar + 26), ay + sa * (ar + 26) * 0.8]];
    ink(g, v, { width: 1.2, alpha: 0.65, seed: 1600 + k }); }
  penLine(g, arch.slice(0, arch.length), { sharp: true, w: 2, alpha: 0.8 });
  penLine(g, face.filter((_, i) => i % 2 === 0), { sharp: true, w: 1.6, alpha: 0.7 });
  // coping on the near parapet
  for (let x = bx - hw - 20; x < bx + hw + 20; x += 17) { const y = yOn(face, x); stone(g, x + 8, y + 2, 16, 12, r.pick(C.stone), 1700 + Math.round(x), { lw: 1, inkA: 0.6 }); }
  // ferns and moss in the joints
  for (let k = 0; k < 12; k++) { const x = bx + r.range(-hw, hw), y = r.range(nTop(x) + 10, 1020); g.fillStyle = rgba(r.pick(['#8aa060', '#a8b070', '#6a8a50']), 0.65); g.beginPath(); g.ellipse(x, y, r.range(6, 14), r.range(3, 5), 0, 0, TAU); g.fill(); }
}
function laneSurface(g, x0, x1) {
  const r = rng(1301), { top, bot, shape } = laneEdges(x0, x1);
  brushW(g, shape, C.dust.concat([C.earth[2]]), { seed: 1302, count: Math.round((x1 - x0) / 8), width: [8, 24], len: [60, 220], angle: () => 0, alpha: [0.14, 0.3], base: 0.62, under: '#f2e8d4', lifts: 0.3 });
  // wheel ruts and a grassy crown
  for (const [dy, sd] of [[22, 1], [82, 2]]) ink(g, top.map(([x, y]) => [x, y + dy + 2 * Math.sin(x * 0.01 + sd)]), { color: shade(C.dust[1], 0.4), width: 1.1, alpha: 0.3, gaps: 1.4, seed: 1303 + sd });
  for (let i = 0; i < (x1 - x0) / 16; i++) { const x = r.range(x0, x1), y = yOn(top, x) + r.range(44, 60); grassFlicks(g, x, y, r.range(5, 9), { seed: 1310 + i, n: 3, colors: C.grass, inkA: 0.25 }); }
  // little stones and pebbles; many more on the stony bit where the milk is spilt
  for (let i = 0; i < (x1 - x0) / 7; i++) { const x = r.range(x0, x1), y = r.range(yOn(top, x) + 6, yOn(bot, x) - 4), s = r.range(2, 5); g.fillStyle = rgba(r.pick(C.cobble), 0.85); g.beginPath(); g.ellipse(x, y, s * 1.3, s * 0.7, 0, 0, TAU); g.fill(); if (s > 3.6) ink(g, ellipse(x, y, s * 1.3, s * 0.7, 8).slice(3, 8), { width: 0.6, alpha: 0.45, seed: 1400 + i }); }
  for (let i = 0; i < 90; i++) { const x = SPILL_X + r.gauss(0, 110), y = r.range(yOn(top, x) + 10, yOn(bot, x) - 6), s = r.range(4, 11); stone(g, x, y, s * 2, s * 1.1, r.pick(C.cobble), 1500 + i, { lw: 0.8, inkA: 0.55 }); }
  // the far edge: grass hanging over it; the near edge: a crumbly lip
  for (let i = 0; i < (x1 - x0) / 12; i++) { const x = r.range(x0, x1); grassFlicks(g, x, yOn(top, x) + 4, r.range(8, 16), { seed: 1600 + i, n: 4, colors: C.grass, inkA: 0.35, lean: 0.1 }); }
  sketch(g, top.filter((_, i) => i % 2 === 0), { alpha: 0.4, width: 1, seed: 1601 });
  sketch(g, bot.filter((_, i) => i % 2 === 0), { alpha: 0.4, width: 1, seed: 1602 });
  bridgePainted(g);
}
function laneNear(g, x0, x1) {
  const r = rng(1701), top = []; for (let x = x0 - 40; x <= x1 + 40; x += 24) top.push([x, 934 + 6 * noise1(x * 0.01, 4) + 80 * hump((x - BROOK_NX) / 330)]);
  const verge = top.concat([[x1 + 40, H + MY], [x0 - 40, H + MY]]);
  brushW(g, verge, C.grass.concat(['#8ca460']), { seed: 1702, count: Math.round((x1 - x0) / 7), width: [10, 30], len: [40, 160], angle: () => -0.1, alpha: [0.16, 0.32], base: 0.7, under: true, lifts: 0.15 });
  // the brook, flowing toward us out from under the bridge, between reedy banks
  { const bx = BROOK_NX, wtr = smooth([[bx - 150, 1006], [bx + 150, 1006], [bx + 200, 1050], [bx + 250, H + MY + 10], [bx - 270, H + MY + 10], [bx - 210, 1050]]);
    wash(g, wtr, { color: '#86a8c0', opacity: 0.95, seed: 1703, under: '#dce8ec', layers: 12 }); blooms(g, wtr, ['#a8c4d4', '#c8dce4', '#7a9cb4'], { n: 6, seed: 1704, alpha: 0.5 });
    for (let k = 0; k < 10; k++) { const yy = 1014 + k * 9, ww = 150 + k * 10; ink(g, [[bx - ww * 0.6 + r.gauss(0, 20), yy], [bx - ww * 0.2, yy + 2], [bx + ww * 0.3 + r.gauss(0, 20), yy]], { color: '#f4f8fa', width: 1.2, alpha: 0.6, gaps: 1.5, seed: 1705 + k }); }
    for (const sd of [-1, 1]) for (let k = 0; k < 26; k++) { const rx = bx + sd * (170 + k * 5 + r.range(0, 30)), ry = 1000 + k * 4 + r.range(0, 16), L = r.range(40, 110), a = -Math.PI / 2 + sd * r.range(0, 0.25);
      g.strokeStyle = rgba(r.pick(['#6a8048', '#7a8a50', '#5a7040']), 0.9); g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(rx, ry); g.quadraticCurveTo(rx + Math.cos(a) * L * 0.5 + sd * 4, ry + Math.sin(a) * L * 0.5, rx + Math.cos(a) * L, ry + Math.sin(a) * L); g.stroke(); }
    for (let k = 0; k < 14; k++) { g.fillStyle = rgba('#7a9ad8', 0.9); g.beginPath(); g.arc(bx + r.pick([-1, 1]) * r.range(160, 230), r.range(1010, 1070), 2.6, 0, TAU); g.fill(); } }  // forget-me-nots
  // tall grass along the top edge, buttercups, clover and daisies
  for (let i = 0; i < (x1 - x0) / 9; i++) { const x = r.range(x0, x1); if (Math.abs(x - BROOK_NX) < 260) continue; grassFlicks(g, x, yOn(top, x) + r.range(10, 50), r.range(26, 56), { seed: 1800 + i, n: 6, colors: C.grass.concat(['#c8c888']), inkA: 0.45, lean: 0.12 }); }
  buttercups(g, { x0, x1, y0: 940, y1: 1060 }, Math.round((x1 - x0) / 18), 1900, 1.6);
  for (let k = 0; k < (x1 - x0) / 30; k++) { const fx = r.range(x0, x1), fy = r.range(950, 1080); dogRose(g, fx, fy, 4.2, 2000 + k, { col: '#fbf6ec' }); } // daisies
  // now and then a tall plant right in front, sweeping past the walker
  for (let x = x0 + 700; x < x1 - 200; x += r.range(1100, 1600)) { if (Math.abs(x - BROOK_NX) < 400 || Math.abs(x - (960 + 4500 * 1.4)) < 700) continue;
    if (r() < 0.5) { for (let q = 0; q < 3; q++) cowParsley(g, x + q * 30, 1000 + r.range(0, 30), r.range(300, 380), 2100 + Math.round(x) + q, { n: 3 }); }
    else { for (let q = 0; q < 2; q++) foxglove(g, x + q * 34, 1010, r.range(320, 400), 2200 + Math.round(x) + q); }
    plant(g, x + 20, 1060, { seed: 2300 + Math.round(x), h: 130, n: 6, colors: ['#6a8048', '#7f9a52', '#5e7640', '#4e6438'], spread: 1.7 }); }
}

// --- the multiplane set (cached)
const LPAR = {};
export function laneParallax(mood = 'morning') {
  const m = MD(mood);
  if (LPAR[m.name]) return LPAR[m.name];
  const res = RES;
  return (LPAR[m.name] = LPL.map((P) => {
    const x1 = W + M + Math.ceil(LPAN * P.k) + 80, w = x1 + M, h = P.y1 - P.y0;
    const c = canvas(w * res, h * res), g = c.getContext('2d');
    g.setTransform(res, 0, 0, res, M * res, -P.y0 * res);
    tm('lane-' + P.name, () => {
      if (P.name === 'sky') paintSky(g, m, { hz: 470, seed: 41, x1: x1 + 200, cumulus: [[300, 190, 190, 1], [900, 120, 250, 2], [1500, 220, 200, 3], [2050, 150, 230, 4], [600, 340, 110, 5], [1250, 330, 120, 6], [1850, 330, 100, 7]] });
      else if (P.name === 'far') laneFar(g, -M, x1);
      else if (P.name === 'mid') laneMid(g, -M, x1);
      else if (P.name === 'hedge') laneHedge(g, -M, x1);
      else if (P.name === 'lane') laneSurface(g, -M, x1);
      else laneNear(g, -M, x1);
    });
    if (P.name !== 'sky') moodGlaze(c, m, res, 17 + P.k * 10, { k: 1 });
    grain(c, 0.2, 7);
    return { img: to8(c), k: P.k, x0: -M, y0: P.y0, w, h, name: P.name };
  }));
}
// live sheep heads: a sheep's head going down to graze and up to look about
function liveSheep(g, dx, t) {
  for (const [x, y, s, f, sd] of LSHEEP) {
    const X = x + dx; if (X < -100 || X > W + 100) continue;
    const down = 0.5 + 0.5 * Math.sin(t * 0.25 + sd) * Math.sin(t * 0.11 + sd * 2);
    paintSheepFast(g, X, y, s, f, sd, down);
  }
}
const SHEEPSPR = {};
function paintSheepFast(g, x, y, s, f, sd, down) {
  const key = Math.round(s * 2);
  if (!SHEEPSPR[key]) { const ss = key / 2; SHEEPSPR[key] = sprite({ x0: -ss * 0.7, y0: -ss * 0.7, x1: ss * 0.7, y1: ss * 0.15, w: ss * 1.4, h: ss * 0.85 }, 3, (gg) => paintSheep(gg, 0, 0, ss, 1, 77, { headless: true, down: 0 }), { grain: 0.1 }); }
  g.save(); g.translate(x, y); g.scale(f, 1);
  drawSprite(g, SHEEPSPR[key], 1);
  const hx = s * 0.5, hy = -s * 0.36 + down * s * 0.26;
  g.fillStyle = '#4a3c34'; g.beginPath(); g.ellipse(hx, hy, s * 0.13, s * 0.09, 0.5 + down * 0.6, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(hx - s * 0.06, hy - s * 0.07, s * 0.06, s * 0.025, -0.3, 0, TAU); g.fill();
  g.restore();
}
// glints on running water (brook), in an area, cheap
export function brookGlints(g, t, area, n = 12, seed = 9, flow = [0, 1]) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const u = noise1(i * 7.7, seed), v = ((t * 0.18 * (0.7 + 0.6 * noise1(i, seed + 1)) + noise1(i * 3.1, seed + 2)) % 1);
    const x = area.x0 + (area.x1 - area.x0) * (u + flow[0] * v * 0.2), y = area.y0 + (area.y1 - area.y0) * v;
    const a = Math.sin(v * Math.PI) * (0.4 + 0.4 * Math.sin(t * 3 + i * 1.7));
    if (a <= 0.03) continue;
    g.fillStyle = `rgba(255,255,250,${a})`; g.beginPath(); g.ellipse(x, y, 4 + (i % 3) * 2, 1.2, 0, 0, TAU); g.fill();
  }
  g.restore();
}
// Draw the travelling lane. c: camera; scroll: 0..LANE_PAN.max (lane units); t: time (sky drift, ambient).
// o: behind(g) (after the hedge, before the lane), actors(g) (on the lane, before the near verge), after(g); ambient.
export function drawLaneParallax(g, P, c, scroll = 0, t = 0, o = {}) {
  cam(g, c, 1);
  const amb = o.ambient !== false;
  for (const L of P) {
    // the sky plane drifts very slowly with time as well (the clouds moving), never past its painted edge
    const dx = L.x0 - scroll * L.k - (L.name === 'sky' ? Math.min(150, t * 0.6) : 0);
    g.drawImage(L.img, dx, L.y0, L.w, L.h);
    const off = -scroll * L.k;
    if (amb) {
      if (L.name === 'sky') birds(g, t, 4, { x0: -100, x1: 2020, y0: 90, y1: 300 }, 11, 0.9);
      else if (L.name === 'mid') { liveSheep(g, off, t); brookGlints(g, t, { x0: BROOK_MX - 40 + off, x1: BROOK_MX + 20 + off, y0: 660, y1: 800 }, 6, 3); }
      else if (L.name === 'hedge') { butterflies(g, t, 3, { x0: 300, x1: 1700, y0: 640, y1: 820 }, 5); bees(g, t, 3, { x0: 500, x1: 1500, y0: 760, y1: 830 }, 7); brookGlints(g, t, { x0: BROOK_HX - 40 + off, x1: BROOK_HX + 40 + off, y0: 790, y1: 870 }, 5, 4); }
      else if (L.name === 'near') brookGlints(g, t, { x0: BROOK_NX - 180 + off, x1: BROOK_NX + 180 + off, y0: 1012, y1: 1120 }, 16, 5);
    }
    if (L.name === 'hedge' && o.behind) o.behind(g);
    if (L.name === 'lane' && o.actors) o.actors(g);
  }
  if (o.after) o.after(g);
}

// ================================================================ THE COUNTRY LANE: the wide view (2x)
// Looking down the winding lane from a little above: it comes toward us out of the fields, over the little stone bridge
// where the brook runs under it, past the stile in the hedge, with the church spire of the market town far off.
// LANE_WIDE.path (page points, far to near), laneAt(u) -> { x, y, w, s } (u = 0 nearest, at the bottom .. 1 the far end; s: the scale of
// a figure there, 1 = LANE_PAN.feetH tall), SPILL (the stony bit on the lane in the foreground), BRIDGE, STILE.
const LW_PATH = smooth([[1196, 516], [1150, 534], [1070, 560], [1010, 596], [1030, 640], [1150, 690], [1250, 744], [1240, 806], [1130, 866], [1010, 930], [940, 1010], [910, 1150]], false, 8);
const lwWidth = (y) => 6 + Math.pow(clamp((y - 510) / 640), 1.15) * 520;
const lwScale = (y) => Math.max(0.05, 0.75 * (y - 450) / 330);
const LW_BROOK = smooth([[380, 556], [540, 596], [760, 628], [930, 660], [1060, 684], [1150, 698], [1270, 724], [1430, 774], [1590, 846], [1720, 940], [1830, 1046], [1900, 1160]], false, 8);
function lwEdges() {
  const A = [], B = [];
  for (let i = 0; i < LW_PATH.length; i++) { const [x, y] = LW_PATH[i], a = LW_PATH[Math.max(0, i - 1)], b = LW_PATH[Math.min(LW_PATH.length - 1, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d; const w = lwWidth(y) / 2;
    A.push([x + dy * w, y - dx * w * 0.25]); B.push([x - dy * w, y + dx * w * 0.25]); }
  return { A, B };   // A: the lane's left edge (as we look down it), B: its right edge
}
export const LANE_WIDE = {
  path: LW_PATH,
  laneAt(u) { const f = clamp(1 - u) * (LW_PATH.length - 1), i = Math.min(LW_PATH.length - 2, Math.floor(f)), k = f - i, x = lerp(LW_PATH[i][0], LW_PATH[i + 1][0], k), y = lerp(LW_PATH[i][1], LW_PATH[i + 1][1], k); return { x, y, w: lwWidth(y), s: lwScale(y) }; },
  scaleAt: lwScale, SPILL: [1090, 884], BRIDGE: [1150, 690], STILE: null,
};
function laneWideLand(g) {
  const r = rng(2501);
  laneFar(g, -M, W + M);
  laneMid(g, -M, W + M, { live: false, brook: false });
  // the near meadows, sloping down toward us
  const mtop = smooth([[-M - 40, 700], [400, 690], [900, 676], [1400, 690], [W + M + 40, 680]], false, 6);
  const meadow = mtop.concat([[W + M + 40, LH], [-M - 40, LH]]);
  brushW(g, meadow, C.grass.concat(['#9cb070']), { seed: 2502, count: 360, width: [14, 40], len: [60, 220], angle: () => -0.05, alpha: [0.14, 0.3], base: 0.62, under: true, lifts: 0.2 });
  hatch(g, meadow, { color: shade(C.grass[3], 0.3), count: 3000, len: 8, width: 0.9, alpha: 0.35, seed: 2503, dir: () => -Math.PI / 2 + 0.12, curve: 0.5, density: (x, y) => clamp((y - 680) / 300) });
  // a hedge across the meadow, with an oak, and sheep
  hedgerow(g, [[-M - 40, 704], [300, 696], [620, 690], [880, 682]], 26, 2504, { step: 2, dabs: 2 });
  hedgerow(g, [[1380, 700], [1700, 706], [W + M + 40, 700]], 26, 2505, { step: 2, dabs: 2 });
  bigTree(g, 260, 700, 2506, { S: 0.42, w: 560, h: 320, crownY: 470 });
  for (const [sx, sy, s, f] of [[480, 760, 24, 1], [560, 790, 26, -1], [1560, 770, 24, -1], [1700, 750, 22, 1], [380, 820, 30, 1]]) paintSheep(g, sx, sy, s, f, 2510 + sx, { down: r.range(0.2, 1) });
  // the brook winding across the meadow and under the lane, toward us on the right; alders and reeds
  const BL = [], BR = [];
  LW_BROOK.forEach(([x, y]) => { const w = 7 + Math.pow(clamp((y - 550) / 600), 1.1) * 70; BL.push([x, y - w * 0.45]); BR.push([x, y + w * 0.45]); });
  const bw = BL.concat(BR.slice().reverse()); wash(g, bw, { color: '#9cb8c8', opacity: 0.92, seed: 2520, under: '#dce8ec', layers: 12 });
  blooms(g, bw, ['#a8c4d4', '#c8dce4', '#7a9cb4'], { n: 8, seed: 2521, alpha: 0.45 });
  ink(g, BL, { width: 1, alpha: 0.5, gaps: 0.8, seed: 2522 }); ink(g, BR.filter((_, i) => i % 2 === 0), { width: 0.8, alpha: 0.35, gaps: 1.2, seed: 2523 });
  for (const [x, y, R] of [[700, 640, 26], [860, 660, 30], [1420, 760, 40], [1560, 820, 46]]) roundTree(g, x, y, R, 2524 + x, { cols: ['#7a8a66', '#6a7c5a', '#8a9870'], inkA: 0.5 });
  for (let k = 0; k < 40; k++) { const [x, y] = LW_BROOK[Math.floor(r.range(10, LW_BROOK.length - 1))], s = lwScale(y); grassFlicks(g, x + r.pick([-1, 1]) * r.range(20, 50) * s, y, r.range(16, 30) * s, { seed: 2530 + k, n: 5, colors: ['#6a8048', '#7a8a50'], inkA: 0.4 }); }
  // the lane: pale dust, two ruts and a grassy crown, little stones, a stony bit in the foreground
  const { A, B } = lwEdges(), lane = A.concat(B.slice().reverse());
  brushW(g, lane, C.dust.concat([C.earth[2]]), { seed: 2540, count: 240, width: [6, 30], len: [30, 200], angle: () => -0.4, alpha: [0.14, 0.3], base: 0.62, under: '#f2e8d4', lifts: 0.3 });
  for (const sd of [0.25, 0.75]) ink(g, A.map(([ax, ay], i) => [lerp(ax, B[i][0], sd), lerp(ay, B[i][1], sd)]), { color: shade(C.dust[1], 0.4), width: 1.2, alpha: 0.32, gaps: 1.4, seed: 2541 + sd * 10 });
  for (let i = 0; i < LW_PATH.length; i += 2) { const [x, y] = LW_PATH[i]; grassFlicks(g, x, y + 2, 2 + lwWidth(y) * 0.025, { seed: 2545 + i, n: 4, colors: C.grass, inkA: 0.3 }); }
  g.save(); path(g, lane); g.clip();
  for (let i = 0; i < 700; i++) { const p = LANE_WIDE.laneAt(Math.pow(r(), 0.6)), x = p.x + r.range(-0.5, 0.5) * p.w, y = p.y + r.range(-0.08, 0.08) * p.w, s = 0.8 + p.s * r.range(1, 3.6); g.fillStyle = rgba(r.pick(C.cobble), 0.85); g.beginPath(); g.ellipse(x, y, s * 1.3, s * 0.65, 0, 0, TAU); g.fill(); }
  for (let i = 0; i < 70; i++) { const [sx, sy] = LANE_WIDE.SPILL, x = sx + r.gauss(0, 80), y = sy + r.gauss(0, 14), s = r.range(5, 11); stone(g, x, y, s * 2.1, s, r.pick(C.cobble), 2550 + i, { lw: 0.9, inkA: 0.55 }); }
  g.restore();
  sketch(g, A, { alpha: 0.45, width: 1.1, seed: 2560 }); sketch(g, B, { alpha: 0.45, width: 1.1, seed: 2561 });
  // the little bridge: low stone parapets either side of the lane where it crosses the brook, the arch's ring on our side
  { const i0 = LW_PATH.findIndex(([x, y]) => y >= LANE_WIDE.BRIDGE[1]), s = lwScale(LANE_WIDE.BRIDGE[1]);
    for (const [E, sd] of [[A, 1], [B, 2]]) { const pw = E.slice(Math.max(0, i0 - 4), i0 + 5).map(([x, y], k, arr) => [x, y - 4 * Math.sin(Math.PI * k / (arr.length - 1))]); const hgt = 20 * s;
      const wall = pw.map(([x, y]) => [x, y - hgt]).concat(pw.slice().reverse());
      wash(g, wall, { color: '#c8bca8', opacity: 0.98, seed: 2570 + sd, under: true, layers: 8 });
      for (let k = 0; k < pw.length - 1; k++) for (const f of [0.3, 0.75]) stone(g, (pw[k][0] + pw[k + 1][0]) / 2, (pw[k][1] + pw[k + 1][1]) / 2 - hgt * f, 12 * s + 6, 8 * s + 3, r.pick(C.stone), 2580 + k + sd * 30 + f * 10, { lw: 0.7, inkA: 0.55 });
      ink(g, wall, { closed: true, width: 1, alpha: 0.7, seed: 2590 + sd }); }
    const [bx, by] = B[i0], ar = 18; const arch = []; for (let a = Math.PI; a <= TAU + 0.01; a += Math.PI / 12) arch.push([bx + 12 + Math.cos(a) * ar, by + 22 + Math.sin(a) * ar * 0.8]);
    wash(g, arch, { color: '#3a3c44', opacity: 0.85, seed: 2595, under: true, layers: 6 }); ink(g, arch, { width: 1, alpha: 0.7 }); }
  // hedges along the lane: on the right as it goes away, on the left in the middle distance (with the stile)
  const hedgeAlong = (E, i0, i1, sgn, seed, out = 0.12) => {
    const pts = E.slice(i0, i1).map(([x, y], i) => { const [cx, cy] = LW_PATH[i0 + i], dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1; return [x + dx / d * (lwWidth(y) * out + 8), y + dy / d * (lwWidth(y) * out + 8) * 0.3]; });
    for (let i = 0; i < pts.length - 1; i += 2) { const seg = pts.slice(i, i + 3); if (seg.length < 2) continue; const y = seg[0][1], hh = Math.min(46, 6 + (y - 510) * 0.3);
      hedgerow(g, seg, hh, seed + i, { step: 1, dabs: 2, lw: 0.6 + (y - 510) * 0.002 });
      if (r() < 0.6) rambler(g, [[seg[0][0] - hh * 0.3, seg[0][1] - hh * 0.5], [seg[0][0], seg[0][1] - hh * 1.05], [seg[0][0] + hh * 0.5, seg[0][1] - hh * 0.8]], seed + 300 + i, { s: Math.max(0.4, hh / 70), roses: 0.6 });
      if (r() < 0.5) foxglove(g, seg[0][0] + r.range(-6, 6), seg[0][1] + 4, hh * r.range(1.1, 1.6), seed + 500 + i); }
    return pts;
  };
  const iB = LW_PATH.findIndex(([, y]) => y >= LANE_WIDE.BRIDGE[1]);
  hedgeAlong(B, 0, iB - 4, -1, 2600);
  const leftPts = hedgeAlong(A, 4, iB - 5, 1, 2700);
  // (nearer than the bridge the lane runs between open verges of flowers)
  // the stile in the left hedge, about where the lane bends
  { const [sx, sy] = leftPts[Math.floor(leftPts.length * 0.6)]; LANE_WIDE.STILE = [sx, sy]; const s = lwScale(sy) * 0.9;
    for (const px of [-40, 40]) { const p = rect(sx + px * s - 5 * s, sy - 84 * s, sx + px * s + 5 * s, sy + 4); wash(g, p, { color: '#8a6a4c', opacity: 0.98, seed: 2810 + px, under: true }); penLine(g, p, { sharp: true, closed: true, w: 1.2, alpha: 0.85 }); }
    for (const ry of [-70, -34]) { const rr = rect(sx - 46 * s, sy + ry * s, sx + 46 * s, sy + ry * s + 8 * s); wash(g, rr, { color: '#9a7a58', opacity: 0.98, seed: 2820 + ry, under: true }); penLine(g, rr, { sharp: true, closed: true, w: 1.1, alpha: 0.8 }); } }
  // verges of flowers along the lane in the foreground
  for (let i = iB + 2; i < LW_PATH.length; i++) { const [x, y] = LW_PATH[i], w = lwWidth(y), s = lwScale(y);
    for (const sgn of [-1, 1]) for (let q = 0; q < 2; q++) { const fx = x + sgn * (w * 0.55 + r.range(10, 140) * s), fy = y + r.range(-4, 14) * s; if (fx > 1660 && fx < 1960 && y > 860) continue;
      const pick = r(); if (pick < 0.35) foxglove(g, fx, fy, r.range(90, 140) * s, 2900 + i * 10 + q + sgn * 500); else if (pick < 0.75) cowParsley(g, fx, fy, r.range(60, 110) * s, 3100 + i * 10 + q + sgn * 500, { n: 2 }); else grassFlicks(g, fx, fy, 30 * s, { seed: 3300 + i + q, n: 6, colors: C.grass, inkA: 0.4 }); } }
  buttercups(g, { x0: 1300, x1: 1900, y0: 860, y1: 1040 }, 110, 2950, 1.6);
  buttercups(g, { x0: -M, x1: 640, y0: 860, y1: 1060 }, 110, 2951, 1.6);
}
function laneWideFront(g) {
  const r = rng(3001);
  // bottom left: a tall clump of foxgloves and cow parsley in the hedge bottom, big dock leaves
  for (let q = 0; q < 4; q++) foxglove(g, 60 + q * 46 + r.range(-10, 10), 1110, r.range(330, 420), 3002 + q, { lean: 0.05 - q * 0.03 });
  for (let q = 0; q < 4; q++) cowParsley(g, 230 + q * 40, 1100, r.range(260, 330), 3010 + q, { n: 3 });
  plant(g, 140, 1120, { seed: 3020, h: 180, n: 7, colors: ['#6a8048', '#7f9a52', '#5e7640', '#4e6438'], spread: 1.8 });
  for (let i = 0; i < 18; i++) grassFlicks(g, r.range(-80, 380), r.range(1060, 1120), r.range(50, 100), { seed: 3030 + i, n: 6, colors: C.grass, inkA: 0.45, lean: 0.1 });
  // bottom right: a dog-rose briar arching in from the edge
  rambler(g, [[W + M, 820], [1900, 800], [1830, 840], [1780, 900], [1770, 960]], 3040, { s: 2.4, roses: 0.7 });
  rambler(g, [[W + M, 900], [1920, 930], [1860, 990], [1850, 1050]], 3041, { s: 2.2, roses: 0.6 });
  for (let i = 0; i < 14; i++) grassFlicks(g, r.range(1640, 2010), r.range(1070, 1120), r.range(50, 100), { seed: 3050 + i, n: 6, colors: C.grass, inkA: 0.45, lean: -0.1 });
}
const LWL = {};
export function laneWideLayers(mood = 'morning') {
  const m = MD(mood);
  if (LWL[m.name]) return LWL[m.name];
  const back = tm('lw-sky', () => hlayer((g) => paintSky(g, m, { hz: 470, seed: 51, cumulus: [[330, 180, 200, 1], [1000, 110, 240, 2], [1700, 200, 200, 3], [700, 330, 110, 4], [1380, 320, 110, 5]] })));
  const land = tm('lw-land', () => hlayer((g) => laneWideLand(g)));
  moodGlaze(land, m, RES, 21);
  const bg = back.getContext('2d'); bg.save(); bg.setTransform(1, 0, 0, 1, 0, 0); bg.drawImage(land, 0, 0); bg.restore();
  grain(back, 0.2, 8);
  const front = tm('lw-front', () => hlayer((g) => laneWideFront(g)));
  moodGlaze(front, m, RES, 23); grain(front, 0.2, 9);
  return (LWL[m.name] = { back: to8(back), front: to8(front), mood: m.name });
}
// The wide lane for one frame: o.actors(g) between the land and the foreground plants; o.after; ambient (default on).
export function drawLaneWide(g, t, c, mood = 'morning', o = {}) {
  const L = laneWideLayers(mood);
  drawH(g, c, L.back);
  cam(g, c, 1);
  if (o.ambient !== false) { birds(g, t, 4, { x0: -100, x1: 2020, y0: 80, y1: 300 }, 13, 0.9); brookGlints(g, t, { x0: 1800, x1: 1960, y0: 830, y1: 1100 }, 14, 6); butterflies(g, t, 2, { x0: 400, x1: 1600, y0: 640, y1: 860 }, 8); bees(g, t, 2, { x0: 1300, x1: 1700, y0: 820, y1: 900 }, 9); }
  if (o.actors) o.actors(g);
  g.drawImage(L.front, -M, -MY, LW, LH);
  if (o.after) o.after(g);
}

// ---------------------------------------------------------------- the spilled milk
// A creamy puddle spreading over the stony lane at (x, y) (its middle, on the ground), a few droplets around it, the
// edge soaking darkly into the dust. k: 0 (just landed: a small splash) .. 1 (spread and half soaked away); t: time
// (a faint sheen); o.scale (1 = for a figure LANE_PAN.feetH tall), o.seed.
const SPILLS = {};
export function drawSpill(g, x, y, k, t = 0, o = {}) {
  if (k <= 0) return;
  const sc = o.scale ?? 1, seed = o.seed ?? 7, key = seed;
  if (!SPILLS[key]) { const r = rng(seed); const lobes = []; for (let i = 0; i < 6; i++) lobes.push([r.range(-1.1, 1.1), r.range(-0.4, 0.6), r.range(0.25, 0.5), r.range(0.5, 1)]);
    const drops = []; for (let i = 0; i < 16; i++) { const a = r.range(-0.3, Math.PI + 0.3) + Math.PI, d = r.range(1.05, 1.8); drops.push([Math.cos(a) * d, Math.sin(a) * d * 0.35 + r.range(-0.1, 0.25), r.range(0.02, 0.06)]); }
    SPILLS[key] = { lobes, outline: fluffy(0, 0, 1, 1, 7, 0.12, seed), drops }; }
  const S = SPILLS[key], spread = ease(clamp(k / 0.55)), soak = clamp((k - 0.4) / 0.6), R = (18 + 78 * spread) * sc, ry = 0.3;
  g.save(); g.translate(x, y);
  // the dark wet ring soaking into the dust
  if (soak > 0) { g.save(); g.scale(1, ry); g.filter = `blur(${(4 * sc).toFixed(1)}px)`; g.fillStyle = `rgba(120,92,66,${0.28 * soak})`; g.beginPath(); for (const [i, [px, py]] of S.outline.entries()) { const X = px * R * 1.12, Y = py * R * 1.12; i ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.closePath(); g.fill(); g.restore(); }
  // the creamy pool, its lobes running between the stones
  g.save(); g.scale(1, ry);
  const a = 0.86 - 0.36 * soak;
  g.filter = `blur(${(1.2 * sc).toFixed(1)}px)`; g.fillStyle = `rgba(247,240,222,${a})`; g.beginPath(); for (const [i, [px, py]] of S.outline.entries()) { const X = px * R, Y = py * R; i ? g.lineTo(X, Y) : g.moveTo(X, Y); } g.closePath(); g.fill();
  for (const [lx, ly, lr, lk] of S.lobes) { const e = clamp(spread * 1.3 - (1 - lk) * 0.5); if (e <= 0) continue; g.beginPath(); g.ellipse(lx * R * 0.8, ly * R * 0.8, lr * R * e, lr * R * e * 0.8, 0, 0, TAU); g.fill(); }
  // a cool shadow at its far edge, a sheen near ours
  g.globalCompositeOperation = 'source-atop';
  g.fillStyle = `rgba(200,200,214,${0.35 * a})`; g.beginPath(); g.ellipse(R * 0.1, -R * 0.55, R * 0.9, R * 0.35, 0, 0, TAU); g.fill();
  g.fillStyle = `rgba(255,255,255,${(0.5 + 0.15 * Math.sin(t * 1.3)) * a})`; g.beginPath(); g.ellipse(-R * 0.25 + Math.sin(t * 0.4) * 3, R * 0.15, R * 0.35, R * 0.12, 0, 0, TAU); g.fill();
  g.restore();
  // the inked edge, broken
  g.save(); g.strokeStyle = `rgba(90,80,90,${0.35 * a})`; g.lineWidth = 1.1 * sc; g.beginPath(); S.outline.forEach(([px, py], i) => { if (i % 5 === 4) { g.moveTo(px * R, py * R * ry); return; } i ? g.lineTo(px * R, py * R * ry) : g.moveTo(px * R, py * R * ry); }); g.stroke(); g.restore();
  // droplets: flung out at first, then lying as little white beads
  const dk = clamp(k / 0.25);
  for (const [dx, dy, dr] of S.drops) { const out = 0.6 + 0.4 * ease(dk), da = (1 - soak * 0.8); if (da <= 0.02) continue;
    g.fillStyle = `rgba(252,249,240,${0.9 * da})`; g.beginPath(); g.ellipse(dx * R * out, dy * R * out, dr * R * 1.2 + 1.2 * sc, (dr * R + 1) * 0.6, 0, 0, TAU); g.fill(); }
  g.restore();
}

// ================================================================ THE DAYDREAM
// A rosy dream cloud: a cloud of warm paper with a scalloped, softly inked edge, blushing pink and lilac, sparkles
// twinkling round it, and a little painted picture inside that melts into the paper at its edge. Four pictures:
//   'eggs'  a nest basket of straw on a sunny shelf (the eggs themselves are drawn live: drawDreamEggs, so they can hatch)
//   'hens'  a sunny hen run: grass, a little hen house, a wire fence, sunflowers, a blue sky
//   'shop'  a pretty shop window: a blue dress with ribbons on a dress form, hat boxes, ribbon reels, a striped awning
//   'fair'  a country fair: bunting, a carousel with painted horses, a striped tent, green grass
// The stager draws the chicks, hens and Molly in the dress inside (o.inside); dreamSpot() gives page points for them.
// Everything is cached per size; per frame it only scales, fades and twinkles.
const DREAM_SCENES = ['eggs', 'hens', 'shop', 'fair'];
// the inner picture (local to the cloud's middle): an oval rx x ry; ground: the v (-1..1) where figures stand
export function dreamInner(w, h) { const rx = w * 0.4, ry = h * 0.37; return { rx, ry, x0: -rx, y0: -ry, w: rx * 2, h: ry * 2 }; }
// named places inside each picture, in units of the inner oval (u, v in -1..1, v down)
export const DREAM_SPOTS = {
  eggs: { basket: [0, 0.32], eggs: [[-0.26, 0.12], [-0.1, 0.06], [0.07, 0.1], [0.23, 0.08], [-0.17, 0.2], [0.0, 0.2], [0.17, 0.21]], chicks: [0, 0.55], ground: [0, 0.62] },
  hens: { ground: [0, 0.62], hen1: [-0.45, 0.6], hen2: [0.05, 0.68], hen3: [0.45, 0.58], chicks: [-0.1, 0.72], henhouse: [0.55, 0.2] },
  shop: { dress: [0.02, 0.05], window: [0, -0.05], molly: [0, 0.78], ground: [0, 0.9] },
  fair: { molly: [0.0, 0.78], ground: [0, 0.78], carousel: [0.38, 0.02], tent: [-0.5, 0.1] },
};
// a named spot inside the dream at (x, y) of size w x h, as a page point (for o.inside or anything drawn with the dream)
export function dreamSpot(scene, name, x, y, w, h) {
  const inn = dreamInner(w, h), s = DREAM_SPOTS[scene][name];
  if (Array.isArray(s[0])) return s.map(([u, v]) => [x + u * inn.rx, y + v * inn.ry]);
  return [x + s[0] * inn.rx, y + s[1] * inn.ry];
}
function dreamOutline(cx, cy, rx, ry, seed) {
  const r = rng(seed), n = Math.max(9, Math.round((rx + ry) / 40)), pts = [], ph = r() * TAU;
  for (let i = 0; i < 240; i++) { const a = (i / 240) * TAU, s = Math.abs(Math.sin((a * n) / 2 + ph)), bump = Math.pow(s, 0.55); const k = 0.9 + 0.12 * bump + 0.015 * Math.sin(a * 3 + seed); pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
  return pts;
}
// --- the pictures, painted in the inner oval's coordinates (centre 0, 0; half-sizes rx, ry)
function dreamPicture(g, scene, rx, ry) {
  const r = rng(4000 + DREAM_SCENES.indexOf(scene) * 100), U = (u) => u * rx, V = (v) => v * ry, s = rx / 300;
  const box = rect(-rx - 4, -ry - 4, rx + 4, ry + 4);
  if (scene === 'eggs') {
    // a warm barn shelf in sunlight: golden wall, a beam of light, straw, the basket
    const lg = g.createLinearGradient(0, -ry, 0, ry); lg.addColorStop(0, '#f4d8a8'); lg.addColorStop(0.55, '#f0cc98'); lg.addColorStop(1, '#d8a870');
    g.fillStyle = lg; g.fillRect(-rx, -ry, rx * 2, ry * 2);
    blooms(g, box, ['#f8e4bc', '#ecc490', '#f4d0c0', '#fff0d0'], { n: 10, seed: 4001, alpha: 0.5, size: 0.3 });
    for (let k = 0; k < 7; k++) ink(g, [[U(-1 + k * 0.32), V(-1)], [U(-1 + k * 0.32 + 0.02), V(0.35)]], { color: '#a87a48', width: 1.2 * s, alpha: 0.3, seed: 4002 + k }); // the boards
    g.save(); g.globalCompositeOperation = 'screen'; g.filter = `blur(${18 * s}px)`; g.fillStyle = 'rgba(255,240,200,0.6)'; g.beginPath(); g.moveTo(U(-0.9), V(-1.1)); g.lineTo(U(-0.45), V(-1.1)); g.lineTo(U(0.35), V(0.6)); g.lineTo(U(-0.15), V(0.6)); g.fill(); g.restore();
    const shelf = rect(U(-1.1), V(0.42), U(1.1), V(1.1)); wash(g, shelf, { color: '#b88858', opacity: 0.95, seed: 4003, layers: 10 });
    penLine(g, [[U(-1.1), V(0.42)], [U(1.1), V(0.42)]], { sharp: true, w: 2 * s, alpha: 0.7 });
    for (let k = 0; k < 120; k++) { const x = U(r.range(-1, 1)), y = V(r.range(0.38, 0.9)), a = r.gauss(0, 0.6), L = r.range(8, 20) * s; g.strokeStyle = rgba(r.pick(C.straw), 0.9); g.lineWidth = 1.4 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L * 0.4); g.stroke(); }
    // the basket (back half: the inside, full of straw)
    const [bx, by] = [0, V(DREAM_SPOTS.eggs.basket[1])], bw = U(0.42), bh = V(0.16);
    const inside = ellipse(bx, by - bh * 0.9, bw, bh * 0.62, 40); wash(g, inside, { color: '#8a6438', opacity: 0.95, seed: 4004, under: true });
    for (let k = 0; k < 60; k++) { const a = r() * TAU, d = Math.sqrt(r()), x = bx + Math.cos(a) * bw * d * 0.95, y = by - bh * 0.9 + Math.sin(a) * bh * 0.6 * d; g.strokeStyle = rgba(r.pick(C.straw), 0.95); g.lineWidth = 1.5 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + r.gauss(0, 10 * s), y + r.gauss(0, 3 * s)); g.stroke(); }
  } else if (scene === 'hens') {
    const lg = g.createLinearGradient(0, -ry, 0, V(0.2)); lg.addColorStop(0, '#9cc4e0'); lg.addColorStop(1, '#e8f0e0'); g.fillStyle = lg; g.fillRect(-rx, -ry, rx * 2, ry * 2);
    blooms(g, box, ['#b4d4ea', '#f4ecd8', '#cfe2ee'], { n: 8, seed: 4101, alpha: 0.5, size: 0.3 });
    pool(g, U(-0.6), V(-0.7), U(0.35), U(0.35), '#fff4c8', 0.8); g.save(); g.filter = `blur(${2 * s}px)`; g.fillStyle = '#fff4c8'; g.beginPath(); g.arc(U(-0.6), V(-0.7), 22 * s, 0, TAU); g.fill(); g.restore();
    cumulus(g, MOODS.morning, U(0.35), V(-0.62), 90 * s, 4102);
    const hill = smooth([[U(-1.2), V(0.12)], [U(-0.5), V(0.02)], [U(0.2), V(0.1)], [U(1.2), V(0.0)], [U(1.2), V(1.2)], [U(-1.2), V(1.2)]]);
    wash(g, hill, { color: '#a8c070', opacity: 0.95, seed: 4103, layers: 14 }); blooms(g, hill, ['#bcd080', '#94b064', '#c8d488'], { n: 8, seed: 4104, alpha: 0.5 });
    hatch(g, hill, { color: '#6a8048', count: 500, len: 8 * s, width: 1, alpha: 0.4, seed: 4105, dir: () => -Math.PI / 2 + 0.1, curve: 0.5 });
    // a little hen house on the right, a wire fence across, sunflowers
    const [hx, hy] = [U(0.55), V(0.28)], hw = 60 * s;
    wash(g, rect(hx - hw, hy - hw * 0.9, hx + hw, hy), { color: '#c87a5a', opacity: 0.97, seed: 4106, under: true }); wash(g, [[hx - hw - 8 * s, hy - hw * 0.9], [hx, hy - hw * 1.7], [hx + hw + 8 * s, hy - hw * 0.9]], { color: '#7a6e6a', opacity: 0.97, seed: 4107, under: true });
    for (let k = 1; k < 5; k++) ink(g, [[hx - hw, hy - k * hw * 0.18], [hx + hw, hy - k * hw * 0.18]], { width: 0.8 * s, alpha: 0.4 });
    g.fillStyle = '#3a2a24'; g.beginPath(); g.arc(hx, hy - hw * 0.25, hw * 0.25, Math.PI, TAU); g.lineTo(hx + hw * 0.25, hy); g.lineTo(hx - hw * 0.25, hy); g.fill();
    penLine(g, [[hx - hw, hy], [hx - hw, hy - hw * 0.9], [hx, hy - hw * 1.7], [hx + hw, hy - hw * 0.9], [hx + hw, hy]], { sharp: true, w: 1.6 * s, alpha: 0.8 });
    for (let k = 0; k < 4; k++) { const fx = U(-0.92 + k * 0.13), fy = V(0.25), fh = 120 * s * r.range(0.85, 1.1); ink(g, [[fx, fy], [fx + 3 * s, fy - fh]], { color: '#5e7640', width: 3 * s, alpha: 0.9 });
      for (let q = 0; q < 3; q++) { g.save(); g.translate(fx, fy - fh * (0.3 + q * 0.2)); g.rotate(q % 2 ? 0.8 : -0.8); g.fillStyle = rgba('#6f8a46', 0.9); g.beginPath(); g.ellipse(10 * s, 0, 12 * s, 5 * s, 0, 0, TAU); g.fill(); g.restore(); }
      const cx = fx + 3 * s, cy = fy - fh; for (let p = 0; p < 14; p++) { const a = p / 14 * TAU; g.fillStyle = rgba(p % 2 ? '#f4c430' : '#e8b020', 0.95); g.beginPath(); g.ellipse(cx + Math.cos(a) * 13 * s, cy + Math.sin(a) * 13 * s, 8 * s, 3.5 * s, a, 0, TAU); g.fill(); }
      g.fillStyle = '#6a4424'; g.beginPath(); g.arc(cx, cy, 8 * s, 0, TAU); g.fill(); }
    for (let x = -rx; x <= rx; x += 34 * s) ink(g, [[x, V(0.44)], [x, V(0.18)]], { color: '#8a7a64', width: 2.2 * s, alpha: 0.85, seed: 4110 + Math.round(x) });
    g.save(); g.strokeStyle = rgba('#8a8a90', 0.45); g.lineWidth = 0.8 * s; for (let x = -rx; x < rx; x += 9 * s) { g.beginPath(); g.moveTo(x, V(0.2)); g.lineTo(x + 9 * s, V(0.44)); g.moveTo(x + 9 * s, V(0.2)); g.lineTo(x, V(0.44)); g.stroke(); } g.restore();
    buttercups(g, { x0: -rx, x1: rx, y0: V(0.5), y1: V(0.95) }, 50, 4111, 2 * s);
    for (let k = 0; k < 30; k++) { const x = U(r.range(-1, 1)), y = V(r.range(0.5, 0.9)); g.fillStyle = rgba('#f0d890', 0.8); g.beginPath(); g.ellipse(x, y, 2.4 * s, 1.2 * s, r() * 3, 0, TAU); g.fill(); } // corn scattered for the hens
  } else if (scene === 'shop') {
    // the shop front: rosy plaster, a bow window of small panes, a striped awning; inside, the blue dress
    g.fillStyle = '#f0d8cc'; g.fillRect(-rx, -ry, rx * 2, ry * 2);
    blooms(g, box, ['#f4e0d4', '#e8c8c0', '#f8ecdc'], { n: 8, seed: 4201, alpha: 0.5, size: 0.3 });
    const wx0 = U(-0.66), wx1 = U(0.66), wy0 = V(-0.55), wy1 = V(0.5);
    wash(g, rect(wx0 - 18 * s, wy0 - 10 * s, wx1 + 18 * s, wy1 + 34 * s), { color: '#5a7a8a', opacity: 0.97, seed: 4202, under: true });  // painted wooden frame
    const glass = rect(wx0, wy0, wx1, wy1);
    wash(g, glass, { color: '#f6ecd8', opacity: 0.98, seed: 4203, under: true }); blooms(g, glass, ['#fff4e0', '#f4e0c8', '#e8e8f0'], { n: 6, seed: 4204, alpha: 0.5 });
    // inside: shelves with hat boxes and ribbon reels, the dress on its stand in the middle
    for (const [hx, hy, hw2, hc] of [[-0.5, 0.36, 0.13, '#e8a8b8'], [-0.36, 0.38, 0.1, '#a8c8d8'], [0.4, 0.36, 0.14, '#f0d090'], [0.53, 0.4, 0.09, '#c8a8d8']]) {
      const b = rect(U(hx - hw2), V(hy - 0.14), U(hx + hw2), V(hy)); wash(g, b, { color: hc, opacity: 0.96, seed: 4205 + Math.round(hx * 100), under: true }); penLine(g, b, { sharp: true, closed: true, w: 1.2 * s, alpha: 0.7 });
      ink(g, [[U(hx - hw2), V(hy - 0.1)], [U(hx + hw2), V(hy - 0.1)]], { width: 1 * s, alpha: 0.5 }); }
    for (let k = 0; k < 5; k++) { const cx = U(-0.52 + k * 0.08), cy = V(-0.3), c = ['#e86a7a', '#f4c040', '#6a9ad8', '#8ac080', '#d890c8'][k];
      g.fillStyle = rgba(c, 0.95); g.beginPath(); g.ellipse(cx, cy, 11 * s, 14 * s, 0, 0, TAU); g.fill(); g.strokeStyle = rgba(shade(c, 0.3), 0.8); g.lineWidth = 1 * s; g.stroke(); g.fillStyle = '#f8f0e0'; g.beginPath(); g.ellipse(cx, cy, 3 * s, 4 * s, 0, 0, TAU); g.fill();
      ink(g, [[cx, cy + 14 * s], [cx + r.range(-6, 6) * s, cy + 34 * s]], { color: c, width: 2 * s, alpha: 0.9 }); }
    ink(g, [[U(-0.62), V(-0.18)], [U(-0.18), V(-0.18)]], { width: 2 * s, alpha: 0.7 });
    // the blue dress: fitted bodice, puffed sleeves, a full skirt, a sash and ribbons, on a turned wooden stand
    const [dx, dy] = [U(DREAM_SPOTS.shop.dress[0]), V(DREAM_SPOTS.shop.dress[1])], ds = ry / 210;
    ink(g, [[dx, dy + 150 * ds], [dx, dy + 190 * ds]], { color: '#6a4a34', width: 4 * ds, alpha: 0.9 }); ink(g, [[dx - 30 * ds, dy + 192 * ds], [dx + 30 * ds, dy + 192 * ds]], { color: '#6a4a34', width: 4 * ds, alpha: 0.9 });
    const skirt = smooth([[dx - 30 * ds, dy + 10 * ds], [dx + 30 * ds, dy + 10 * ds], [dx + 70 * ds, dy + 110 * ds], [dx + 86 * ds, dy + 158 * ds], [dx + 30 * ds, dy + 166 * ds], [dx - 30 * ds, dy + 166 * ds], [dx - 86 * ds, dy + 158 * ds], [dx - 70 * ds, dy + 110 * ds]]);
    wash(g, skirt, { color: '#6a9ad8', opacity: 0.97, seed: 4220, under: true }); blooms(g, skirt, ['#8ab4e8', '#5a86c8', '#a8c8f0'], { n: 6, seed: 4221, alpha: 0.5 });
    for (let k = -2; k <= 2; k++) ink(g, [[dx + k * 12 * ds, dy + 14 * ds], [dx + k * 30 * ds, dy + 160 * ds]], { color: '#3a5a98', width: 1 * ds, alpha: 0.45, seed: 4222 + k }); // folds
    const hem = []; for (let k = 0; k <= 16; k++) { const u = k / 16; hem.push([dx - 86 * ds + u * 172 * ds, dy + 158 * ds + Math.sin(u * Math.PI) * 9 * ds + (k % 2 ? 4 : 0) * ds]); }
    ink(g, hem, { color: '#fbf6ee', width: 3 * ds, alpha: 0.9 }); // a lace hem
    const bod = smooth([[dx - 26 * ds, dy - 62 * ds], [dx + 26 * ds, dy - 62 * ds], [dx + 32 * ds, dy + 12 * ds], [dx - 32 * ds, dy + 12 * ds]]);
    wash(g, bod, { color: '#5a8ad0', opacity: 0.97, seed: 4223, under: true });
    for (const sd of [-1, 1]) { const sl = ellipse(dx + sd * 38 * ds, dy - 52 * ds, 20 * ds, 16 * ds, 18); wash(g, sl, { color: '#7aa6e0', opacity: 0.97, seed: 4224 + sd, under: true }); ink(g, sl, { closed: true, width: 1.2 * ds, alpha: 0.7 }); }
    ink(g, ellipse(dx, dy - 64 * ds, 16 * ds, 6 * ds, 16).slice(8, 16), { color: '#fbf6ee', width: 3 * ds, alpha: 0.9 });  // the lace collar
    ink(g, ellipse(dx, dy - 84 * ds, 7 * ds, 20 * ds, 12), { closed: true, color: '#8a6a50', width: 2 * ds, alpha: 0.8 }); // the stand's neck
    const sash = rect(dx - 33 * ds, dy + 2 * ds, dx + 33 * ds, dy + 16 * ds); wash(g, sash, { color: '#f4b8c8', opacity: 0.97, seed: 4225, under: true });
    for (const sd of [-1, 1]) { const lp = ellipse(dx + sd * 16 * ds, dy + 6 * ds, 16 * ds, 9 * ds, 14, sd * 0.4); wash(g, lp, { color: '#f0a0b8', opacity: 0.97, seed: 4226 + sd, under: true }); ink(g, lp, { closed: true, width: 1 * ds, alpha: 0.7 });
      ink(g, [[dx + sd * 4 * ds, dy + 12 * ds], [dx + sd * 14 * ds, dy + 50 * ds], [dx + sd * 8 * ds, dy + 80 * ds]], { color: '#f0a0b8', width: 4 * ds, alpha: 0.95 }); }
    for (const [ux, uy] of [[-50, 60], [44, 90], [-20, 120], [60, 140], [-64, 130]]) dogRose(g, dx + ux * ds, dy + uy * ds, 5 * ds, 4230 + ux, { col: '#f8d8e0' }); // little ribbon rosettes
    ink(g, skirt, { closed: true, width: 1.6 * ds, alpha: 0.8 }); ink(g, bod, { closed: true, width: 1.4 * ds, alpha: 0.8 });
    // glazing bars over everything, a gleam on the glass, the awning on top, a sill box of flowers
    for (const fx of [-0.33, 0, 0.33]) penLine(g, [[U(fx * 0.66 / 0.66) * 1, wy0], [U(fx), wy1]], { sharp: true, w: 3 * s, alpha: 0.85, color: '#4a6a7a' });
    penLine(g, [[wx0, V(-0.05)], [wx1, V(-0.05)]], { sharp: true, w: 3 * s, alpha: 0.85, color: '#4a6a7a' });
    g.save(); g.globalCompositeOperation = 'screen'; g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.moveTo(U(-0.6), wy0); g.lineTo(U(-0.45), wy0); g.lineTo(U(-0.7), wy1); g.lineTo(U(-0.85), wy1); g.fill(); g.restore();
    penLine(g, glass, { sharp: true, closed: true, w: 2.4 * s, alpha: 0.85 });
    const aw = []; for (let k = 0; k <= 10; k++) aw.push([U(-1.05 + k * 0.21), V(-0.68)]);
    for (let k = 0; k < 10; k++) { const st = [[aw[k][0], V(-1.1)], [aw[k + 1][0], V(-1.1)], [aw[k + 1][0], V(-0.68)], [(aw[k][0] + aw[k + 1][0]) / 2, V(-0.6)], [aw[k][0], V(-0.68)]];
      wash(g, st, { color: k % 2 ? '#f8f0e4' : '#d86a7a', opacity: 0.97, seed: 4240 + k, under: true, layers: 8 }); penLine(g, st, { sharp: true, closed: true, w: 1 * s, alpha: 0.6 }); }
    const sb = rect(wx0 - 10 * s, wy1 + 34 * s, wx1 + 10 * s, wy1 + 56 * s); wash(g, sb, { color: '#5a7a8a', opacity: 0.97, seed: 4250, under: true });
    for (let k = 0; k < 26; k++) { const fx = r.range(wx0, wx1), fy = wy1 + 34 * s - r.range(0, 14) * s; g.fillStyle = rgba(r.pick(['#e86a7a', '#f4c040', '#f8f0e0', '#c890d8']), 0.95); g.beginPath(); g.arc(fx, fy, 4.5 * s, 0, TAU); g.fill(); }
    g.save(); g.fillStyle = rgba('#3a2a2a', 0.75); g.font = `italic ${Math.round(26 * s)}px "Fell", Georgia, serif`; g.textAlign = 'center'; g.fillText('Ribbons & Gowns', 0, V(-0.76)); g.restore();
  } else if (scene === 'fair') {
    const lg = g.createLinearGradient(0, -ry, 0, V(0.3)); lg.addColorStop(0, '#a8c8e4'); lg.addColorStop(1, '#f4ecd8'); g.fillStyle = lg; g.fillRect(-rx, -ry, rx * 2, ry * 2);
    blooms(g, box, ['#c4dcee', '#f8ecd8', '#f4d8d0'], { n: 8, seed: 4301, alpha: 0.5, size: 0.3 });
    cumulus(g, MOODS.morning, U(-0.45), V(-0.55), 80 * s, 4302);
    const ground = smooth([[U(-1.2), V(0.28)], [U(0), V(0.24)], [U(1.2), V(0.3)], [U(1.2), V(1.2)], [U(-1.2), V(1.2)]]);
    wash(g, ground, { color: '#a8c070', opacity: 0.95, seed: 4303, layers: 14 }); hatch(g, ground, { color: '#6a8048', count: 400, len: 8 * s, width: 1, alpha: 0.35, seed: 4304, dir: () => -Math.PI / 2 + 0.1, curve: 0.5 });
    // a striped tent on the left
    const [tx, ty] = [U(-0.55), V(0.3)], tw = 90 * s;
    for (let k = 0; k < 6; k++) { const a0 = tx - tw + k * tw / 3, st = [[a0, ty], [a0 + tw / 3, ty], [tx, ty - tw * 1.3]]; wash(g, st, { color: k % 2 ? '#f8f0e4' : '#6a9ad8', opacity: 0.97, seed: 4305 + k, under: true, layers: 8 }); }
    penLine(g, [[tx - tw, ty], [tx, ty - tw * 1.3], [tx + tw, ty]], { sharp: true, w: 1.6 * s, alpha: 0.8 }); g.fillStyle = '#e86a7a'; g.beginPath(); g.moveTo(tx, ty - tw * 1.3); g.lineTo(tx + 20 * s, ty - tw * 1.36); g.lineTo(tx, ty - tw * 1.44); g.fill();
    // the carousel: a striped canopy, a gilded rim, twisted poles, painted horses
    const [cx, cy] = [U(DREAM_SPOTS.fair.carousel[0]), V(DREAM_SPOTS.fair.carousel[1])], cw = 150 * s;
    const plat = ellipse(cx, cy + 112 * s, cw, 20 * s, 40); wash(g, plat, { color: '#c8a070', opacity: 0.97, seed: 4310, under: true });
    for (let k = 0; k < 5; k++) { const px = cx - cw * 0.8 + k * cw * 0.4; ink(g, [[px, cy - 10 * s], [px, cy + 110 * s]], { color: '#d8b050', width: 3 * s, alpha: 0.95 });
      const hy = cy + 50 * s + Math.sin(k * 1.7) * 14 * s, hc = ['#f8f0e4', '#e8a8b8', '#f8f0e4', '#a8c8e8', '#f4d890'][k];
      const horse = smooth([[px - 26 * s, hy], [px - 18 * s, hy - 10 * s], [px + 12 * s, hy - 10 * s], [px + 20 * s, hy - 26 * s], [px + 30 * s, hy - 22 * s], [px + 24 * s, hy - 4 * s], [px + 20 * s, hy + 8 * s], [px - 20 * s, hy + 10 * s]]);
      wash(g, horse, { color: hc, opacity: 0.97, seed: 4311 + k, under: true, layers: 8 }); ink(g, horse, { closed: true, width: 1.1 * s, alpha: 0.75 });
      for (const lx of [-16, -8, 10, 18]) ink(g, [[px + lx * s, hy + 8 * s], [px + lx * s + 4 * s, hy + 26 * s]], { width: 1.6 * s, alpha: 0.75 }); }
    const can = [[cx - cw * 1.08, cy - 10 * s], [cx, cy - 86 * s], [cx + cw * 1.08, cy - 10 * s]];
    for (let k = 0; k < 8; k++) { const u0 = k / 8, u1 = (k + 1) / 8, st = [[lerp(can[0][0], can[2][0], u0), cy - 10 * s], [lerp(can[0][0], can[2][0], u1), cy - 10 * s], [cx, cy - 86 * s]]; wash(g, st, { color: k % 2 ? '#f8f0e4' : '#d86a7a', opacity: 0.97, seed: 4320 + k, under: true, layers: 8 }); }
    const rim = rect(cx - cw * 1.08, cy - 14 * s, cx + cw * 1.08, cy + 2 * s); wash(g, rim, { color: '#e8c060', opacity: 0.97, seed: 4330, under: true });
    for (let k = 0; k < 12; k++) { g.fillStyle = '#fff4c8'; g.beginPath(); g.arc(cx - cw + k * cw / 5.5, cy - 6 * s, 3 * s, 0, TAU); g.fill(); }
    penLine(g, rim, { sharp: true, closed: true, w: 1.4 * s, alpha: 0.8 }); penLine(g, can, { sharp: true, w: 1.6 * s, alpha: 0.8 }); g.fillStyle = '#6a9ad8'; g.beginPath(); g.moveTo(cx, cy - 86 * s); g.lineTo(cx + 22 * s, cy - 94 * s); g.lineTo(cx, cy - 102 * s); g.fill(); ink(g, [[cx, cy - 86 * s], [cx, cy - 104 * s]], { width: 1.4 * s, alpha: 0.8 });
    buttercups(g, { x0: -rx, x1: rx, y0: V(0.55), y1: V(0.95) }, 40, 4331, 2 * s);
  }
  // bunting over the fair and the hen run; the shop has its own awning
  if (scene === 'fair' || scene === 'hens') {
    for (const [y0, sag, sd] of [[-0.86, 0.2, 1], [-0.7, 0.16, 2]]) { const pts = []; for (let k = 0; k <= 14; k++) { const u = -1.1 + k * 2.2 / 14; pts.push([U(u), V(y0 + sag * (1 - Math.pow(u / 1.1, 2)))]); }
      if (scene === 'hens' && sd === 2) break;
      ink(g, pts, { width: 1.2 * s, alpha: 0.7, seed: 4400 + sd });
      for (let k = 0; k < pts.length - 1; k++) { const [ax, ay] = pts[k], [bx, by] = pts[k + 1], c = ['#e86a7a', '#f4c040', '#6a9ad8', '#8ac080', '#f8f0e4'][(k + sd) % 5];
        const fl = [[ax + (bx - ax) * 0.15, ay + (by - ay) * 0.15], [ax + (bx - ax) * 0.85, ay + (by - ay) * 0.85], [(ax + bx) / 2, (ay + by) / 2 + 26 * s]]; wash(g, fl, { color: c, opacity: 0.97, seed: 4410 + k + sd * 20, under: true, layers: 6 }); ink(g, fl, { closed: true, width: 0.8 * s, alpha: 0.5 }); } }
  }
}
// the front half of the nest basket (drawn over the eggs and chicks)
function basketFront(g, rx, ry) {
  const r = rng(4500), [bx, by] = [0, DREAM_SPOTS.eggs.basket[1] * ry], bw = rx * 0.42, bh = ry * 0.16, s = rx / 300;
  const body = smooth([[bx - bw, by - bh * 0.9], [bx - bw * 0.96, by + bh * 0.2], [bx - bw * 0.7, by + bh * 0.9], [bx, by + bh * 1.05], [bx + bw * 0.7, by + bh * 0.9], [bx + bw * 0.96, by + bh * 0.2], [bx + bw, by - bh * 0.9], [bx, by - bh * 0.35]]);
  wash(g, body, { color: '#b8864c', opacity: 0.98, seed: 4501, under: true });
  g.save(); path(g, body); g.clip();
  for (let row = 0; row < 7; row++) { const y = by - bh * 0.8 + row * bh * 0.3; for (let x = bx - bw; x < bx + bw; x += 14 * s) { g.fillStyle = rgba(row % 2 ? '#d0a060' : '#a87840', 0.8); g.beginPath(); g.ellipse(x + (row % 2) * 7 * s, y, 7 * s, bh * 0.14, 0.2, 0, TAU); g.fill(); } }
  g.restore();
  shadeEdge(g, body, { color: '#5a3a1a', alpha: 0.45, width: 30 * s, dy: -12 * s });
  for (let k = 0; k < 30; k++) { const a = r.range(Math.PI * 1.05, Math.PI * 1.95), x = bx + Math.cos(a) * bw * 0.98, y = by - bh * 0.9 + Math.sin(a) * bh * 0.58 + bh * 0.5; g.strokeStyle = rgba(r.pick(C.straw), 0.95); g.lineWidth = 1.5 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + r.gauss(0, 12 * s), y - r.range(4, 14) * s); g.stroke(); }
  const rim = ribbon(ellipse(bx, by - bh * 0.9, bw, bh * 0.62, 40).slice(0, 21), 9 * s, 9 * s); wash(g, rim, { color: '#c8965a', opacity: 0.98, seed: 4502, under: true }); ink(g, rim, { closed: true, width: 1.2 * s, alpha: 0.7 });
  ink(g, body.slice(0, Math.floor(body.length * 0.8)), { width: 1.6 * s, alpha: 0.8 });
  // the handle arching over
  const hd = ribbon([[bx - bw * 0.92, by - bh * 0.9], [bx - bw * 0.6, by - bh * 3.4], [bx + bw * 0.6, by - bh * 3.4], [bx + bw * 0.92, by - bh * 0.9]], 10 * s, 10 * s);
  wash(g, hd, { color: '#b8864c', opacity: 0.98, seed: 4503, under: true }); hatch(g, hd, { color: '#6a4a24', count: 60, len: 8 * s, width: 1, alpha: 0.6, seed: 4504, dir: () => 0.9 }); ink(g, hd, { closed: true, width: 1.2 * s, alpha: 0.75 });
}
// an egg (for the dream basket and anywhere): s px tall, standing on (x, y); crack 0..1 (a zig-zag crack runs round it,
// then the top lifts off and tips away, leaving the bottom half for a chick to sit in)
export function drawDreamEgg(g, x, y, s, crack = 0, col = '#f4e6cc', seed = 1) {
  g.save(); g.translate(x, y);
  const egg = () => { g.beginPath(); g.ellipse(0, -s * 0.4, s * 0.37, s * 0.6, 0, Math.PI, TAU); g.ellipse(0, -s * 0.4, s * 0.37, s * 0.42, 0, 0, Math.PI); g.closePath(); };
  const zz = []; for (let k = 0; k <= 8; k++) zz.push([-s * 0.4 + k * s * 0.1, -s * 0.52 + (k % 2 ? -s * 0.08 : s * 0.04)]);
  const lift = ease(clamp((crack - 0.5) / 0.5));
  const paintEgg = () => { g.fillStyle = col; egg(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(-s * 0.12, -s * 0.62, s * 0.08, s * 0.16, -0.3, 0, TAU); g.fill();
    g.fillStyle = 'rgba(150,110,80,0.25)'; g.beginPath(); g.ellipse(s * 0.1, -s * 0.1, s * 0.24, s * 0.12, 0, 0, TAU); g.fill();
    g.strokeStyle = rgba(INKC, 0.7); g.lineWidth = Math.max(0.8, s * 0.05); egg(); g.stroke(); };
  const below = () => { g.beginPath(); g.moveTo(-s, s); g.lineTo(-s, zz[0][1]); zz.forEach(([px, py]) => g.lineTo(px, py)); g.lineTo(s, zz[8][1]); g.lineTo(s, s); g.closePath(); };
  const above = () => { g.beginPath(); g.moveTo(-s, -s * 1.3); g.lineTo(-s, zz[0][1]); zz.forEach(([px, py]) => g.lineTo(px, py)); g.lineTo(s, zz[8][1]); g.lineTo(s, -s * 1.3); g.closePath(); };
  if (lift <= 0) { paintEgg(); }
  else {
    g.save(); below(); g.clip(); paintEgg(); g.fillStyle = 'rgba(120,90,70,0.35)'; g.beginPath(); g.ellipse(0, zz[4][1] + s * 0.04, s * 0.3, s * 0.06, 0, 0, TAU); g.fill(); g.restore();
    g.save(); g.translate(s * 0.4 * lift, -s * 0.3 * lift); g.rotate(0.7 * lift); above(); g.clip(); paintEgg(); g.restore();
  }
  if (crack > 0 && lift <= 0) { const n = Math.ceil(clamp(crack * 2) * 8); g.strokeStyle = rgba(INKC, 0.75); g.lineWidth = Math.max(0.8, s * 0.045); g.beginPath(); g.moveTo(zz[0][0], zz[0][1]); for (let k = 1; k <= n; k++) g.lineTo(zz[k][0], zz[k][1]); g.stroke(); }
  g.restore();
}
// the eggs in the dream basket, at the dream at (x, y), w x h (scaled like it); crack: a number or an array per egg
export function drawDreamEggs(g, x, y, w, h, o = {}) {
  const spots = dreamSpot('eggs', 'eggs', x, y, w, h), s = h / 520 * 48, crack = o.crack || 0, show = o.show ?? spots.length;
  const cols = ['#f4e6cc', '#e8cca4', '#f8eedc', '#d8b088', '#f0dcc0', '#ead2b0', '#f6e8d0'];
  spots.slice(0, show).sort((a, b) => a[1] - b[1]).forEach(([ex, ey], i) => drawDreamEgg(g, ex, ey, s * (0.9 + 0.1 * (i % 3)), Array.isArray(crack) ? crack[i] || 0 : crack, cols[i % cols.length], i));
}
const DRM = {};
function dreamSprites(w, h) {
  const key = `${Math.round(w)}x${Math.round(h)}`;
  if (DRM[key]) return DRM[key];
  const rx = w / 2, ry = h / 2, seed = 5000 + Math.round(w + h), outline = dreamOutline(0, 0, rx, ry, seed), inn = dreamInner(w, h);
  const box = { x0: -rx - 40, y0: -ry - 40, x1: rx + 40, y1: ry + 50, w: w + 80, h: h + 90 };
  const back = sprite(box, 1.5, (g) => {
    g.save(); g.filter = 'blur(14px)'; g.fillStyle = 'rgba(200,120,140,0.22)'; path(g, outline.map(([x, y]) => [x * 1.02, y * 1.02 + 10])); g.fill(); g.restore();   // a rosy glow round it
    wash(g, outline, { color: '#fbf0ea', opacity: 1, seed, under: '#fbf0ea', bleed: 0.004, layers: 8, edge: 0.15 });
    blooms(g, outline, ['#f6d4d8', '#ecdcf0', '#fbe4cc', '#f4c8d0'], { n: 12, seed: seed + 1, alpha: 0.45, size: 0.25 });
  }, { grain: 0.15, seed });
  const edge = sprite(box, 1.5, (g) => {
    const sc = ellipse(0, 0, inn.rx, inn.ry, 60);
    g.save(); g.beginPath(); for (const pp of [outline, sc]) { g.moveTo(...pp[0]); for (const p of pp.slice(1)) g.lineTo(...p); g.closePath(); } g.clip('evenodd');
    wash(g, outline, { color: '#fbf0ea', opacity: 1, seed: seed + 6, under: '#fbf0ea', bleed: 0.004, layers: 6, edge: 0 });
    blooms(g, outline, ['#f6d4d8', '#ecdcf0', '#fbe4cc', '#f4c8d0'], { n: 12, seed: seed + 1, alpha: 0.45, size: 0.25 });
    g.restore();
    g.save(); g.scale(1, inn.ry / inn.rx);
    const gr = g.createRadialGradient(0, 0, inn.rx * 0.74, 0, 0, inn.rx * 1.01); gr.addColorStop(0, 'rgba(251,240,234,0)'); gr.addColorStop(1, 'rgba(251,240,234,1)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, inn.rx * 1.01, 0, TAU); g.fill(); g.restore();
    // a rosy blush at the cloud's lower edge, gold where the light catches its top
    g.save(); path(g, outline); g.clip(); g.globalCompositeOperation = 'multiply'; pool(g, 0, ry * 0.9, rx * 1.1, ry * 0.35, '#f0b8c4', 0.35); g.globalCompositeOperation = 'source-over'; pool(g, -rx * 0.3, -ry * 0.85, rx * 0.7, ry * 0.25, '#fff4dc', 0.5); g.restore();
    sketch(g, outline.filter((_, i) => i % 3 === 0), { closed: true, alpha: 0.55, width: 1.6, seed: seed + 7, color: '#6a3a44' });
    ink(g, ellipse(0, 0, inn.rx * 1.02, inn.ry * 1.02, 60), { closed: true, width: 0.9, alpha: 0.2, gaps: 1.4, seed: seed + 8 });
  }, { grain: 0.15, seed: seed + 9 });
  const pics = {};
  for (const sc of DREAM_SCENES) pics[sc] = sprite({ x0: -inn.rx, y0: -inn.ry, x1: inn.rx, y1: inn.ry, w: inn.rx * 2, h: inn.ry * 2 }, 1.5, (g) => { g.save(); g.beginPath(); g.ellipse(0, 0, inn.rx, inn.ry, 0, 0, TAU); g.clip(); dreamPicture(g, sc, inn.rx, inn.ry); g.restore(); }, { grain: 0.18, seed: seed + 20, margin: 0.02 });
  pics.basketFront = sprite({ x0: -inn.rx, y0: -inn.ry, x1: inn.rx, y1: inn.ry, w: inn.rx * 2, h: inn.ry * 2 }, 1.5, (g) => basketFront(g, inn.rx, inn.ry), { grain: 0.12, seed: seed + 30, margin: 0.02 });
  return (DRM[key] = { back, edge, outline, pics });
}
const DPUFF = {};
function dreamPuff(rad) {
  const key = Math.round(rad);
  if (DPUFF[key]) return DPUFF[key];
  const o = dreamOutline(0, 0, rad, rad * 0.86, 7100 + key);
  return (DPUFF[key] = sprite({ x0: -rad - 10, y0: -rad - 10, x1: rad + 10, y1: rad + 16, w: rad * 2 + 20, h: rad * 2 + 26 }, 1.6, (g) => {
    g.save(); g.filter = 'blur(5px)'; g.fillStyle = 'rgba(200,120,140,0.25)'; path(g, o.map(([x, y]) => [x + 3, y + 5])); g.fill(); g.restore();
    wash(g, o, { color: '#fbf0ea', opacity: 1, seed: 7200 + key, under: '#fbf0ea', layers: 6, edge: 0.15 });
    blooms(g, o, ['#f6d4d8', '#ecdcf0'], { n: 3, seed: 7300 + key, alpha: 0.4 });
    sketch(g, o.filter((_, i) => i % 4 === 0), { closed: true, alpha: 0.55, width: 1.3, seed: 7400 + key, color: '#6a3a44' });
  }, { grain: 0.12, seed: 7500 + key }));
}
// sparkles: little four-pointed twinkles round the cloud's rim, each fading in and out
function dreamSparkles(g, t, rx, ry, k, n = 14) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const a = noise1(i * 3.3, 61) * TAU + t * 0.04 * (i % 2 ? 1 : -1), d = 0.98 + 0.16 * noise1(i * 1.7, 62), x = Math.cos(a) * rx * d, y = Math.sin(a) * ry * d;
    const tw = Math.pow(Math.max(0, Math.sin(t * (0.9 + 0.5 * noise1(i, 63)) + i * 2.1)), 3) * k;
    if (tw < 0.03) continue;
    const L = (6 + 8 * noise1(i, 64)) * (0.6 + 0.4 * tw), col = i % 3 ? '255,236,200' : '255,214,228';
    g.fillStyle = `rgba(${col},${0.9 * tw})`;
    g.beginPath(); g.moveTo(x, y - L); g.quadraticCurveTo(x, y, x + L * 0.6, y); g.quadraticCurveTo(x, y, x, y + L); g.quadraticCurveTo(x, y, x - L * 0.6, y); g.quadraticCurveTo(x, y, x, y - L); g.fill();
    pool(g, x, y, L * 1.4, L * 1.4, '#fff0e0', 0.25 * tw);
  }
  g.restore();
}
// Draw the dream cloud centred at (x, y), w x h, at time t, appearing with k (0 gone .. 1 there: it swells gently, the
// little puffs first). o: scene ('eggs' | 'hens' | 'shop' | 'fair'), from + mix (the previous scene, melting into this one
// as mix goes 0 -> 1), tail: [x, y] the dreamer's head, inside(g, s): the stager's figures in page coordinates (clipped
// to the inner oval, under the soft edge), eggs: { show, crack } (the basket's eggs, for 'eggs'), sparkles (default on).
export function drawDream(g, x, y, w, h, t, k = 1, o = {}) {
  if (k <= 0) return;
  const D = dreamSprites(w, h), inn = dreamInner(w, h), scene = o.scene || 'eggs';
  const kb = clamp((k - 0.3) / 0.7), e = ease(kb), s = (0.7 + 0.3 * e) * (1 + 0.01 * Math.sin(t * 1.1)), bob = Math.sin(t * 0.8) * 4;
  if (o.tail) { const [tx, ty] = o.tail, ex = x + (tx - x) * 0.62, ey = y + bob + (ty - y) * 0.62;
    for (let i = 0; i < 3; i++) { const a = clamp(k * 4 - i * 0.7), u = (i + 1) / 4; if (a <= 0) continue; const px = lerp(tx, ex, u), py = lerp(ty, ey, u) - Math.sin(u * Math.PI) * 18, rad = 10 + i * 8;
      g.save(); g.translate(px, py + Math.sin(t * 1.1 + i) * 2); g.scale(0.6 + 0.4 * ease(a), 0.6 + 0.4 * ease(a)); drawSprite(g, dreamPuff(rad), ease(a)); g.restore(); } }
  if (kb <= 0) return;
  g.save(); g.translate(x, y + bob); g.scale(s, s);
  drawSprite(g, D.back, e);
  const mixK = o.from ? ease(clamp(o.mix ?? 1)) : 1;
  if (o.from && mixK < 1) drawSprite(g, D.pics[o.from], e);
  drawSprite(g, D.pics[scene], e * mixK);
  const drawEggs = (sc, a) => { if (sc !== 'eggs' || a <= 0) return; g.save(); g.globalAlpha *= a; drawDreamEggs(g, 0, 0, w, h, o.eggs || {}); g.restore(); };
  if (o.from === 'eggs' && mixK < 1) drawEggs('eggs', e * (1 - mixK));
  drawEggs(scene, e * mixK);
  if (o.inside) { g.save(); g.beginPath(); g.ellipse(0, 0, inn.rx, inn.ry, 0, 0, TAU); g.clip(); g.globalAlpha *= e; g.translate(-x, -y - bob); o.inside(g, s); g.restore(); }
  if (scene === 'eggs' || o.from === 'eggs') drawSprite(g, D.pics.basketFront, e * (scene === 'eggs' ? mixK : 1 - mixK));
  drawSprite(g, D.edge, e);
  if (o.sparkles !== false) dreamSparkles(g, t, w * 0.5, h * 0.5, e);
  g.restore();
}

// ================================================================ MOLLY'S BEDROOM (night)
// A cosy attic under the thatch: the gable wall with the little window (stars and the moon outside), the sloping ceiling
// with its rafters and a tie-beam, wide floorboards, a rag rug. Under the window her little bed with a patchwork quilt and
// a rag doll; on the stool beside it a candle in a brass holder; on the right a washstand with a jug and basin; in front
// a ladder-back chair with her apron over it and the empty milk pail beside it, her bonnet on a peg.
// Painted once in its own colours, glazed for the night, a moonbeam falling from the window; the candlelight is live.
//   bedroomLayers() -> { back, quilt, quiltHump, front, windowMask }
//   drawBedroom(g, t, c, o): o.sleeper(g) (Molly in bed: between the bed and the quilt; the quilt then has the shape of
//   someone curled under it), o.actors(g) (in the room, over the quilt, behind the chair), o.after(g); o.candle 0..1
//   (1 lit, 0 out: the warm light fades), o.starsK, o.moonK.
// BEDROOM: head (where her head lies on the pillow), bed {x0, x1, top}, window {x, y, w, h}, flame (the candle flame's
// foot), floor (a standing figure's feet), personH (a good height for Molly standing in the room), chair, pail, doll.
export const BEDROOM = {
  head: [752, 604], bed: { x0: 650, x1: 1300, top: 632, front: 812 }, window: { x: 960, y: 344, w: 236, h: 196 },
  flame: [520, 566], floor: 900, personH: 360, chair: [1756, 904], pail: [1620, 904], doll: [1232, 630], vp: [960, 560],
};
const BR_WALL = [[200, 784], [200, 380], [960, -300], [1720, 380], [1720, 784]];
const slopeY = (x) => (x < 960 ? 380 - (x - 200) * (680 / 760) : 380 - (1720 - x) * (680 / 760));
function towardViewer(px, py, toX) { const [vx, vy] = BEDROOM.vp, k = (toX - vx) / (px - vx); return [toX, vy + (py - vy) * k]; }
function bedroomBack(g) {
  const r = rng(6001), WL = -M - 40, WR = W + M + 40, B = BEDROOM;
  // the gable wall: warm plaster, a little uneven, with soft blooms
  wash(g, BR_WALL, { color: '#e8d4b4', opacity: 0.98, seed: 6002, under: '#efdcc0', bleed: 0.004 });
  blooms(g, BR_WALL, ['#f0dcbc', '#dcc4a4', '#ecd8c4', '#e4ccb0'], { n: 16, seed: 6003, alpha: 0.5, size: 0.18 });
  strokes(g, BR_WALL, { color: '#b8a080', count: 260, len: 40, width: 1.2, alpha: 0.12, seed: 6004, dir: () => -Math.PI / 2 + 0.08, curve: 0.2 });
  // the side walls (knee walls) and the sloping ceilings, in perspective toward us
  for (const sd of [-1, 1]) {
    const ex = sd < 0 ? 200 : 1720, edge = sd < 0 ? WL : WR;
    const top = towardViewer(ex, 380, edge), bot = towardViewer(ex, 784, edge);
    const side = [[ex, 784], [ex, 380], top, bot];
    wash(g, side, { color: '#dcc4a0', opacity: 0.98, seed: 6010 + sd, under: true, bleed: 0.004 }); blooms(g, side, ['#e4ccac', '#ccb08c'], { n: 6, seed: 6012 + sd, alpha: 0.4 });
    shadeEdge(g, side, { color: '#6a5040', alpha: 0.3, width: 120, dx: sd * 40, dy: 0 });
    const ceil = [[ex, 380], [960, -300], [edge, -300], top];
    wash(g, ceil, { color: '#e0ccac', opacity: 0.98, seed: 6014 + sd, under: true, bleed: 0.004 }); blooms(g, ceil, ['#e8d4b8', '#d0b494', '#ecdcc4'], { n: 8, seed: 6016 + sd, alpha: 0.45 });
    // rafters: dark oak, running from the wall's slope toward us
    for (let k = 0; k < 4; k++) { const wx = sd < 0 ? 260 + k * 190 : 1660 - k * 190, wy = slopeY(wx), [fx, fy] = towardViewer(wx, wy, edge), w0 = 22, w1 = 90;
      const raf = [[wx - w0 / 2, wy], [wx + w0 / 2, wy], [fx + w1 / 2 * sd, fy - w1 * 0.3], [fx - w1 / 2 * sd, fy + w1 * 0.3]];
      wash(g, raf, { color: '#6a4a34', opacity: 0.98, seed: 6020 + k + sd * 10, under: true }); hatch(g, raf, { color: '#3a2a1c', count: 60, len: 22, width: 1, alpha: 0.45, seed: 6030 + k, dir: () => Math.atan2(fy - wy, fx - wx) });
      penLine(g, raf, { sharp: true, closed: true, w: 1.8, alpha: 0.8 }); }
    // the wall plate along the knee wall's top
    const plate = [[ex, 368], [ex, 392], towardViewer(ex, 392, edge), towardViewer(ex, 368, edge)]; wash(g, plate, { color: '#5e4230', opacity: 0.98, seed: 6040 + sd, under: true }); penLine(g, plate, { sharp: true, closed: true, w: 1.6, alpha: 0.8 });
  }
  penLine(g, BR_WALL, { sharp: true, w: 2, alpha: 0.6 });
  // the floor: wide boards converging on the wall, a rag rug
  const floor = [[200, 784], [1720, 784], towardViewer(1720, 784, WR), [WR, LH], [WL, LH], towardViewer(200, 784, WL)];
  wash(g, floor, { color: '#a87c58', opacity: 0.98, seed: 6050, under: true, bleed: 0.004 }); blooms(g, floor, ['#b88c64', '#946c4c', '#c09470'], { n: 12, seed: 6051, alpha: 0.4 });
  for (let k = -9; k <= 9; k++) { const bx = 960 + k * 84, [fx, fy] = towardViewer(bx, 784, bx + (bx - 960) * 3); ink(g, [[bx, 784], [lerp(bx, fx, 0.999), Math.min(fy, LH)]], { color: '#4a3020', width: 1.4, alpha: 0.5, seed: 6052 + k }); }
  for (let k = 0; k < 40; k++) { const x = r.range(WL, WR), y = r.range(800, 1120); ink(g, [[x, y], [x + r.range(-30, 30), y + r.range(20, 50)]], { color: '#5a3a24', width: 0.8, alpha: 0.25, seed: 6060 + k }); } // grain
  ink(g, [[200, 784], [1720, 784]], { width: 1.6, alpha: 0.7 });
  // skirting along the wall's foot
  wash(g, rect(200, 762, 1720, 786), { color: '#8a6a4c', opacity: 0.97, seed: 6062, under: true }); penLine(g, rect(200, 762, 1720, 786), { sharp: true, closed: true, w: 1.2, alpha: 0.6 });
  // the window: a deep reveal, small panes, the night beyond (painted dark; stars and moon are live), gingham curtains
  const { x: wx, y: wy, w: ww, h: wh } = B.window, gl = rect(wx - ww / 2, wy - wh / 2, wx + ww / 2, wy + wh / 2);
  wash(g, rect(wx - ww / 2 - 22, wy - wh / 2 - 22, wx + ww / 2 + 22, wy + wh / 2 + 18), { color: '#d8c0a0', opacity: 0.98, seed: 6070, under: true });
  wash(g, gl, { color: '#2a3a64', opacity: 0.98, seed: 6071, under: true }); glaze(g, gl, wx, wy + wh * 0.3, ww * 0.6, wh * 0.4, '#4a5a88', 0.8);
  // far-off hills under the night sky, a field and a tree in silhouette
  { const hl = []; for (let x = wx - ww / 2; x <= wx + ww / 2; x += 12) hl.push([x, wy + wh * 0.26 - 14 * Math.sin((x - wx) * 0.012 + 1)]); const hsh = hl.concat([[wx + ww / 2, wy + wh / 2], [wx - ww / 2, wy + wh / 2]]);
    wash(g, hsh, { color: '#3a4a5a', opacity: 0.95, seed: 6072, layers: 8 }); roundTree(g, wx + 60, wy + wh * 0.3, 16, 6073, { cols: ['#2e3a40', '#34424a'], under: false, inkA: 0.3 }); }
  BEDROOM.windowGlass = gl;
  penLine(g, [[wx, wy - wh / 2], [wx, wy + wh / 2]], { sharp: true, w: 4, alpha: 0.95, color: '#e8dcc8' }); penLine(g, [[wx - ww / 2, wy], [wx + ww / 2, wy]], { sharp: true, w: 4, alpha: 0.95, color: '#e8dcc8' });
  penLine(g, gl, { sharp: true, closed: true, w: 3, alpha: 0.85 });
  const sill = rect(wx - ww / 2 - 30, wy + wh / 2 + 10, wx + ww / 2 + 30, wy + wh / 2 + 28); wash(g, sill, { color: '#9a7a58', opacity: 0.98, seed: 6074, under: true }); penLine(g, sill, { sharp: true, closed: true, w: 1.6, alpha: 0.8 });
  // a jam jar of wildflowers on the sill: foxglove, buttercups, cow parsley (picked on the way home)
  { const jx = wx + ww / 2 - 30, jy = wy + wh / 2 + 10; const jar = smooth([[jx - 16, jy], [jx - 18, jy - 40], [jx - 13, jy - 46], [jx + 13, jy - 46], [jx + 18, jy - 40], [jx + 16, jy]]);
    foxglove(g, jx - 4, jy - 30, 90, 6080, { lean: -0.12 }); cowParsley(g, jx + 6, jy - 30, 70, 6081, { n: 2 });
    for (let k = 0; k < 5; k++) { const fx = jx - 14 + k * 8, fy = jy - 64 - (k % 2) * 12; ink(g, [[jx, jy - 30], [fx, fy]], { color: '#6a8048', width: 1, alpha: 0.8 }); g.fillStyle = '#f2cc40'; g.beginPath(); g.arc(fx, fy, 3.4, 0, TAU); g.fill(); }
    wash(g, jar, { color: '#d8e4e4', opacity: 0.55, seed: 6082 }); glaze(g, jar, jx - 6, jy - 22, 4, 16, '#ffffff', 0.7); ink(g, jar, { closed: true, width: 1.2, alpha: 0.6 }); }
  // the curtains on their rod
  ink(g, [[wx - ww / 2 - 50, wy - wh / 2 - 34], [wx + ww / 2 + 50, wy - wh / 2 - 34]], { width: 3, alpha: 0.85 });
  for (const sd of [-1, 1]) { const c0 = wx + sd * (ww / 2 + 44), c1 = wx + sd * (ww / 2 - 26);
    const cu = smooth([[c0, wy - wh / 2 - 34], [c1, wy - wh / 2 - 34], [c1 + sd * 10, wy - wh * 0.05], [c1 - sd * 6, wy + wh * 0.25], [c1 + sd * 30, wy + wh / 2 + 6], [c0, wy + wh / 2 + 6]]);
    wash(g, cu, { color: '#f0e4d4', opacity: 0.98, seed: 6090 + sd, under: true });
    g.save(); path(g, cu); g.clip(); g.globalAlpha = 0.45; for (let x = c0 - 60; x < c0 + 60; x += 14) { g.fillStyle = '#d88a8a'; g.fillRect(x, wy - wh, 6, wh * 2); } for (let y = wy - wh; y < wy + wh; y += 14) { g.fillStyle = '#d88a8a'; g.fillRect(c0 - 60, y, 120, 6); } g.restore();
    for (let k = 0; k < 4; k++) ink(g, [[lerp(c0, c1, 0.2 + k * 0.2), wy - wh / 2 - 30], [lerp(c0, c1, 0.15 + k * 0.2) + sd * 8, wy + wh / 2]], { width: 0.9, alpha: 0.35, seed: 6092 + k + sd * 9 });
    ink(g, cu, { closed: true, width: 1.4, alpha: 0.7, seed: 6095 + sd }); const tie = [c1 + sd * 4, wy + wh * 0.18]; ink(g, [[tie[0] - 12, tie[1]], [tie[0] + 12, tie[1] + 4]], { color: '#c86a6a', width: 3, alpha: 0.9 }); }
  // the tie-beam across the roof, a little shelf, a framed picture of a cow, pegs with the bonnet and a shawl
  { const y0 = 112, y1 = 146, x0 = 200 + (380 - y1) / (680 / 760) - 6, x1 = 1720 - (380 - y1) / (680 / 760) + 6, beam = [[x0, y0 + 4], [x1, y0 + 4], [x1, y1], [x0, y1]];
    wash(g, beam, { color: '#6a4a34', opacity: 0.98, seed: 6100, under: true }); hatch(g, beam, { color: '#3a2a1c', count: 160, len: 26, width: 1, alpha: 0.4, seed: 6101, dir: () => 0 }); penLine(g, beam, { sharp: true, closed: true, w: 2, alpha: 0.85 });
    shadeEdge(g, BR_WALL, { edge: [[x0, y1 + 4], [x1, y1 + 4]], color: '#5a4030', alpha: 0.3, width: 50, dy: 18 }); }
  { const fx = 420, fy = 470, frame = rect(fx - 58, fy - 46, fx + 58, fy + 46); wash(g, frame, { color: '#8a6a4c', opacity: 0.98, seed: 6110, under: true });
    const pic = rect(fx - 46, fy - 34, fx + 46, fy + 34); wash(g, pic, { color: '#e8dcc0', opacity: 0.98, seed: 6111, under: true }); wash(g, rect(fx - 46, fy + 8, fx + 46, fy + 34), { color: '#a8bc78', opacity: 0.9, seed: 6112 });
    const cow = smooth([[fx - 26, fy + 2], [fx - 22, fy - 12], [fx + 14, fy - 12], [fx + 22, fy - 18], [fx + 30, fy - 12], [fx + 26, fy - 4], [fx + 16, fy + 2], [fx + 16, fy + 14], [fx + 12, fy + 14], [fx + 10, fy + 4], [fx - 18, fy + 4], [fx - 20, fy + 14], [fx - 24, fy + 14]]);
    wash(g, cow, { color: '#a8643c', opacity: 0.95, seed: 6113, under: true, layers: 8 }); ink(g, cow, { closed: true, width: 1, alpha: 0.7 });
    penLine(g, pic, { sharp: true, closed: true, w: 1.4, alpha: 0.7 }); penLine(g, frame, { sharp: true, closed: true, w: 1.8, alpha: 0.8 });
    ink(g, [[fx - 40, fy - 46], [fx, fy - 76], [fx + 40, fy - 46]], { width: 1, alpha: 0.6 }); g.fillStyle = '#5a4030'; g.beginPath(); g.arc(fx, fy - 76, 3, 0, TAU); g.fill(); }
  { const py = 470; ink(g, [[1480, py], [1660, py]], { color: '#6a4a34', width: 8, alpha: 0.95 }); for (const px of [1510, 1580, 1640]) { ink(g, [[px, py], [px + 4, py + 16]], { color: '#5a3a28', width: 5, alpha: 0.95 }); }
    // her sun bonnet
    const bon = smooth([[1556, py + 14], [1604, py + 14], [1618, py + 50], [1600, py + 74], [1560, py + 74], [1542, py + 50]]); wash(g, bon, { color: '#f4e4d0', opacity: 0.98, seed: 6120, under: true }); ink(g, bon, { closed: true, width: 1.3, alpha: 0.7 });
    ink(g, [[1564, py + 70], [1556, py + 120], [1562, py + 150]], { color: '#e8a8b8', width: 3, alpha: 0.95 }); ink(g, [[1594, py + 70], [1600, py + 116], [1594, py + 140]], { color: '#e8a8b8', width: 3, alpha: 0.95 });
    // a knitted shawl
    const sh = smooth([[1622, py + 14], [1660, py + 16], [1670, py + 120], [1640, py + 160], [1616, py + 110]]); wash(g, sh, { color: '#9aa8c8', opacity: 0.97, seed: 6121, under: true }); hatch(g, sh, { color: '#5a6888', count: 60, len: 6, width: 1, alpha: 0.5, seed: 6122, dir: () => Math.PI / 2 }); ink(g, sh, { closed: true, width: 1.2, alpha: 0.7 }); }
  // the washstand with jug and basin, a towel
  { const x0 = 1380, x1 = 1600, ty = 640, top = rect(x0, ty - 14, x1, ty), body = rect(x0 + 8, ty, x1 - 8, 790);
    wash(g, body, { color: '#9a7452', opacity: 0.98, seed: 6130, under: true }); for (const dx of [0.33, 0.66]) ink(g, [[lerp(x0, x1, dx), ty + 6], [lerp(x0, x1, dx), 784]], { width: 1, alpha: 0.5 });
    for (const yy of [700, 740]) { g.fillStyle = '#c8a060'; g.beginPath(); g.arc(lerp(x0, x1, 0.16), yy, 3.4, 0, TAU); g.fill(); g.beginPath(); g.arc(lerp(x0, x1, 0.84), yy, 3.4, 0, TAU); g.fill(); }
    penLine(g, body, { sharp: true, closed: true, w: 1.8, alpha: 0.8 }); wash(g, top, { color: '#b08a64', opacity: 0.98, seed: 6131, under: true }); penLine(g, top, { sharp: true, closed: true, w: 1.6, alpha: 0.8 });
    const towel = smooth([[x1 - 6, ty + 8], [x1 + 14, ty + 8], [x1 + 18, ty + 100], [x1 + 2, ty + 110], [x1 - 6, ty + 96]]); wash(g, towel, { color: '#f4ecdc', opacity: 0.98, seed: 6132, under: true }); for (const yy of [ty + 80, ty + 88]) ink(g, [[x1 - 4, yy], [x1 + 16, yy]], { color: '#8aa0c8', width: 2, alpha: 0.8 }); ink(g, towel, { closed: true, width: 1.2, alpha: 0.7 });
    const bx = 1478, by = ty - 14, basin = smooth([[bx - 74, by - 30], [bx + 74, by - 30], [bx + 56, by], [bx - 56, by]]); wash(g, basin, { color: '#f6f2ea', opacity: 0.98, seed: 6133, under: true }); ink(g, [[bx - 70, by - 22], [bx + 70, by - 22]], { color: '#6a88c0', width: 3, alpha: 0.85 }); ink(g, basin, { closed: true, width: 1.4, alpha: 0.75 });
    const jug = smooth([[bx - 22, by - 26], [bx - 30, by - 70], [bx - 20, by - 100], [bx - 18, by - 120], [bx + 14, by - 124], [bx + 30, by - 132], [bx + 22, by - 112], [bx + 22, by - 96], [bx + 32, by - 66], [bx + 22, by - 26]]);
    wash(g, jug, { color: '#f8f4ec', opacity: 0.98, seed: 6134, under: true }); glaze(g, jug, bx - 12, by - 80, 8, 30, '#ffffff', 0.7); shadeEdge(g, jug, { color: '#8a8aa0', alpha: 0.4, width: 18, dx: 8, dy: 0 });
    for (let k = 0; k < 5; k++) { const fx = bx - 12 + (k % 3) * 12, fy = by - 52 - Math.floor(k / 3) * 22; for (let p = 0; p < 5; p++) { g.fillStyle = rgba('#6a88c0', 0.85); g.beginPath(); g.ellipse(fx + Math.cos(p * 1.26) * 4, fy + Math.sin(p * 1.26) * 4, 2.6, 1.6, p * 1.26, 0, TAU); g.fill(); } }
    ink(g, [[bx - 24, by - 102], [bx - 46, by - 96], [bx - 44, by - 64], [bx - 28, by - 60]], { width: 3, alpha: 0.75 }); ink(g, jug, { closed: true, width: 1.5, alpha: 0.8 }); }
  // the candle's stool, the bed (frame, mattress, pillow): the quilt is a separate layer, over the sleeper
  { const sx = 520, sy = 648, top = smooth([[sx - 64, sy - 10], [sx + 64, sy - 10], [sx + 70, sy + 6], [sx - 70, sy + 6]]);
    for (const lx of [-50, -14, 22, 52]) { const leg = rect(sx + lx - 5, sy + 4, sx + lx + 5, 800 + (lx > 0 ? 6 : 0)); wash(g, leg, { color: '#7a5a40', opacity: 0.98, seed: 6140 + lx, under: true }); penLine(g, leg, { sharp: true, closed: true, w: 1.3, alpha: 0.8 }); }
    wash(g, top, { color: '#9a7452', opacity: 0.98, seed: 6144, under: true }); penLine(g, top, { sharp: true, closed: true, w: 1.6, alpha: 0.85 });
    // a little book and the candlestick (brass dish, ring handle, a white candle stub)
    const bk = rect(sx + 14, sy - 26, sx + 58, sy - 10); wash(g, bk, { color: '#6a4a6a', opacity: 0.97, seed: 6145, under: true }); penLine(g, bk, { sharp: true, closed: true, w: 1.2, alpha: 0.8 });
    const [cx, cy] = BEDROOM.flame, dish = ellipse(cx, sy - 14, 34, 9, 30); wash(g, dish, { color: '#c8a050', opacity: 0.98, seed: 6146, under: true }); glaze(g, dish, cx - 10, sy - 16, 12, 3, '#fff0c0', 0.8); ink(g, dish, { closed: true, width: 1.2, alpha: 0.8 });
    ink(g, ellipse(cx + 40, sy - 18, 10, 8, 16), { closed: true, color: '#a88038', width: 3, alpha: 0.95 });
    const holder = rect(cx - 10, sy - 40, cx + 10, sy - 16); wash(g, holder, { color: '#c8a050', opacity: 0.98, seed: 6147, under: true }); penLine(g, holder, { sharp: true, closed: true, w: 1.2, alpha: 0.8 });
    const candle = rect(cx - 8, cy, cx + 8, sy - 38); wash(g, candle, { color: '#f6efe0', opacity: 0.98, seed: 6148, under: true }); ink(g, [[cx + 2, cy], [cx + 4, cy + 14], [cx + 3, cy + 22]], { color: '#e8dcc4', width: 3, alpha: 0.9 }); penLine(g, candle, { sharp: true, closed: true, w: 1.2, alpha: 0.75 });
    ink(g, [[cx, cy], [cx + 1, cy - 6]], { color: '#2a2018', width: 1.6, alpha: 0.9 }); }
  { const { x0, x1, top: ty, front } = B.bed;
    // headboard (left) and footboard (right): turned posts, arched panels
    for (const [hx, hh, sd] of [[x0, 160, 1], [x1, 90, 2]]) { const panel = smooth([[hx - 14, ty + 10], [hx - 14, ty - hh * 0.7], [hx, ty - hh], [hx + 14, ty - hh * 0.7], [hx + 14, ty + 10]]);
      wash(g, panel, { color: '#8a6040', opacity: 0.98, seed: 6150 + sd, under: true }); hatch(g, panel, { color: '#4a3020', count: 40, len: 14, width: 0.9, alpha: 0.4, seed: 6152 + sd, dir: () => Math.PI / 2 }); penLine(g, panel, { sharp: true, closed: true, w: 1.6, alpha: 0.85 });
      for (const px of [hx - 16, hx + 16]) { const post = rect(px - 8, ty - hh - 18, px + 8, front - 6); wash(g, post, { color: '#7a5434', opacity: 0.98, seed: 6154 + px, under: true }); penLine(g, post, { sharp: true, closed: true, w: 1.4, alpha: 0.85 });
        g.fillStyle = '#8a6040'; g.beginPath(); g.arc(px, ty - hh - 22, 10, 0, TAU); g.fill(); ink(g, ellipse(px, ty - hh - 22, 10, 10, 14), { closed: true, width: 1.2, alpha: 0.8 }); } }
    // the mattress and sheet, the pillow at the head
    const mat = rect(x0 + 18, ty - 6, x1 - 18, ty + 40); wash(g, mat, { color: '#f4ece0', opacity: 0.98, seed: 6160, under: true }); ink(g, [[x0 + 18, ty + 38], [x1 - 18, ty + 38]], { width: 1.2, alpha: 0.5 });
    const [hx, hy] = B.head, pil = smooth([[hx - 74, hy + 14], [hx - 78, hy - 14], [hx - 50, hy - 30], [hx + 40, hy - 30], [hx + 70, hy - 18], [hx + 74, hy + 12], [hx + 40, hy + 26], [hx - 50, hy + 26]]);
    wash(g, pil, { color: '#fbf6ee', opacity: 0.99, seed: 6161, under: true }); glaze(g, pil, hx - 10, hy - 6, 50, 14, '#ffffff', 0.7); shadeEdge(g, pil, { color: '#9a90a8', alpha: 0.35, width: 18, dy: -6 });
    ink(g, pil, { closed: true, width: 1.4, alpha: 0.7 }); for (let k = 0; k < 7; k++) ink(g, [[hx - 70 + k * 21, hy + 24], [hx - 64 + k * 21, hy + 30]], { color: '#d8a8b8', width: 2, alpha: 0.8 }); }
  // the rag rug in front of the bed
  { const [rx0, ry0] = [960, 912], rings = 7; for (let k = rings; k >= 1; k--) { const rr = ellipse(rx0, ry0, 300 * k / rings, 58 * k / rings, 60); wash(g, rr, { color: ['#c8786a', '#d8b878', '#8aa0b8', '#a8b880', '#d89a8a', '#e8d4a8', '#9a7aa0'][k % 7], opacity: 0.96, seed: 6170 + k, under: true, layers: 8, edge: 0.3 });
      ink(g, rr, { closed: true, width: 0.8, alpha: 0.35, gaps: 0.8, seed: 6180 + k }); }
    hatch(g, ellipse(rx0, ry0, 300, 58, 60), { color: '#5a3a2a', count: 600, len: 6, width: 0.8, alpha: 0.3, seed: 6190, dir: (x, y) => Math.atan2(y - ry0, (x - rx0) * 0.2) + Math.PI / 2, curve: 0.2 }); }
}
// the patchwork quilt (over the sleeper): a top in perspective and a front panel hanging down, squares of soft colours,
// running stitches, a scalloped edge; hump: the shape of a little girl curled up under it
function bedroomQuilt(g, hump = false) {
  const r = rng(6300), { x0, x1, top: ty, front } = BEDROOM.bed, qx0 = BEDROOM.head[0] + 34, qx1 = x1 - 12;
  const hTop = (x) => ty + 6 - (hump ? 46 * Math.pow(Math.max(0, Math.sin(Math.PI * clamp((x - qx0 + 10) / 420))), 0.8) + 14 * Math.max(0, Math.sin(Math.PI * clamp((x - qx0 - 300) / 200))) : 0);
  const topEdge = []; for (let x = qx0; x <= qx1; x += 10) topEdge.push([x, hTop(x)]);
  const q = [[qx0 - 14, ty + 30]].concat(topEdge, [[qx1 + 8, ty + 20], [qx1 + 8, front - 18], [qx0 - 4, front - 12]]);
  wash(g, q, { color: '#f0e0cc', opacity: 0.99, seed: 6301, under: true });
  const cols = ['#e8a8a8', '#a8c0dc', '#f4dca0', '#b8cc98', '#d8b4d8', '#f0c8a0', '#c8d8e8', '#e8b8c8'];
  g.save(); path(g, q); g.clip();
  const cs = 52; for (let row = 0; row < 7; row++) for (let col = 0; col < 14; col++) { const x = qx0 - 20 + col * cs, y = ty - 60 + row * cs; const sq = rect(x + 2, y + 2, x + cs - 2, y + cs - 2);
    wash(g, sq, { color: cols[(row * 3 + col * 5 + (row % 2)) % cols.length], opacity: 0.88, seed: 6310 + row * 20 + col, layers: 6, edge: 0.2 });
    if ((row + col) % 3 === 0) { for (let k = 0; k < 4; k++) { g.fillStyle = 'rgba(255,250,240,0.6)'; g.beginPath(); g.arc(x + 12 + (k % 2) * 26, y + 12 + Math.floor(k / 2) * 26, 3, 0, TAU); g.fill(); } } // sprigged prints
    g.save(); g.setLineDash([4, 4]); g.strokeStyle = rgba('#7a5a4a', 0.5); g.lineWidth = 1; g.strokeRect(x + 5, y + 5, cs - 10, cs - 10); g.restore(); }
  // the fold over the bed's front edge: the top in light, the hanging part in soft shade
  g.globalCompositeOperation = 'multiply'; const sg = g.createLinearGradient(0, ty + 30, 0, front); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.12, 'rgba(200,180,200,0.5)'); sg.addColorStop(1, 'rgba(150,130,160,0.55)'); g.fillStyle = sg; g.fillRect(qx0 - 20, ty + 34, qx1 - qx0 + 40, front - ty);
  if (hump) { g.globalCompositeOperation = 'source-over'; shadeEdge(g, q, { edge: topEdge, color: '#6a5a7a', alpha: 0.3, width: 30, dy: 16 }); }
  g.restore();
  ink(g, topEdge, { width: 1.6, alpha: 0.75, seed: 6302 }); ink(g, [[qx0 - 14, ty + 30], [qx1 + 8, ty + 24]], { width: 1, alpha: 0.4, gaps: 1, seed: 6303 });
  const sc = []; for (let x = qx0 - 4; x <= qx1 + 8; x += 6) sc.push([x, front - 14 + 4 * Math.abs(Math.sin((x - qx0) * Math.PI / 26))]);
  ink(g, sc, { width: 1.5, alpha: 0.75, seed: 6304 }); ink(g, [[qx1 + 8, ty + 20], [qx1 + 8, front - 18]], { width: 1.5, alpha: 0.75 }); ink(g, [[qx0 - 14, ty + 30], [qx0 - 4, front - 12]], { width: 1.5, alpha: 0.75 });
  // the rag doll sitting at the foot of the bed, leaning on the footboard
  { const [dx, dy] = BEDROOM.doll, dt = hTop(dx) - ty;
    g.save(); g.translate(0, dt);
    const dress = smooth([[dx - 24, dy + 6], [dx - 14, dy - 34], [dx + 14, dy - 34], [dx + 24, dy + 6]]); wash(g, dress, { color: '#8ab0d8', opacity: 0.98, seed: 6320, under: true }); for (let k = 0; k < 6; k++) { g.fillStyle = '#f8f0e4'; g.beginPath(); g.arc(dx - 12 + (k % 3) * 12, dy - 20 + Math.floor(k / 3) * 14, 2, 0, TAU); g.fill(); } ink(g, dress, { closed: true, width: 1.2, alpha: 0.8 });
    for (const sd of [-1, 1]) { ink(g, [[dx + sd * 12, dy - 30], [dx + sd * 26, dy - 12]], { color: '#f0d8c0', width: 6, alpha: 1 }); ink(g, [[dx + sd * 10, dy + 4], [dx + sd * 16, dy + 22]], { color: '#e8d0b8', width: 7, alpha: 1 }); g.fillStyle = '#c85a5a'; g.beginPath(); g.ellipse(dx + sd * 17, dy + 24, 5, 3.4, 0, 0, TAU); g.fill(); }
    g.fillStyle = '#f2dcc4'; g.beginPath(); g.arc(dx, dy - 50, 16, 0, TAU); g.fill(); ink(g, ellipse(dx, dy - 50, 16, 16, 20), { closed: true, width: 1.2, alpha: 0.8 });
    for (let k = 0; k < 9; k++) { const a = Math.PI * (1.05 + k * 0.1); ink(g, [[dx + Math.cos(a) * 14, dy - 50 + Math.sin(a) * 14], [dx + Math.cos(a) * 22, dy - 48 + Math.sin(a) * 20 + (k % 2) * 4]], { color: '#c87838', width: 3, alpha: 0.95 }); } // woollen hair
    g.fillStyle = '#3a2a24'; for (const sd of [-1, 1]) { g.beginPath(); g.arc(dx + sd * 6, dy - 52, 2, 0, TAU); g.fill(); }
    ink(g, [[dx - 5, dy - 44], [dx, dy - 42], [dx + 5, dy - 44]], { color: '#b85a5a', width: 1.4, alpha: 0.9 }); pool(g, dx - 9, dy - 46, 5, 3, '#e89898', 0.6); pool(g, dx + 9, dy - 46, 5, 3, '#e89898', 0.6);
    g.restore(); }
}
// the chair with the apron, the empty pail beside it (in front of everything; right foreground)
function bedroomFront(g) {
  const [cx, cy] = BEDROOM.chair, seatY = cy - 150;
  for (const [lx, ly, h] of [[cx - 70, cy, 150], [cx + 60, cy + 6, 150], [cx - 46, cy - 20, 130], [cx + 76, cy - 16, 130]]) { const leg = rect(lx - 6, ly - h, lx + 6, ly); wash(g, leg, { color: '#7a5434', opacity: 0.98, seed: 6400 + lx, under: true }); penLine(g, leg, { sharp: true, closed: true, w: 1.4, alpha: 0.85 }); }
  const back = []; for (const px of [cx - 64, cx + 66]) { const post = rect(px - 7, seatY - 250, px + 7, seatY); wash(g, post, { color: '#7a5434', opacity: 0.98, seed: 6410 + px, under: true }); penLine(g, post, { sharp: true, closed: true, w: 1.5, alpha: 0.85 }); back.push(px); }
  for (let k = 0; k < 4; k++) { const sl = rect(cx - 60, seatY - 230 + k * 50, cx + 62, seatY - 214 + k * 50); wash(g, sl, { color: '#8a6040', opacity: 0.98, seed: 6420 + k, under: true }); penLine(g, sl, { sharp: true, closed: true, w: 1.3, alpha: 0.8 }); }
  const seat = [[cx - 84, seatY], [cx + 80, seatY + 4], [cx + 96, seatY + 26], [cx - 70, seatY + 24]]; wash(g, seat, { color: '#c8a868', opacity: 0.98, seed: 6430, under: true }); hatch(g, seat, { color: '#7a5a30', count: 80, len: 10, width: 1, alpha: 0.5, seed: 6431, dir: () => 0.1 }); penLine(g, seat, { sharp: true, closed: true, w: 1.6, alpha: 0.85 });
  // the white apron draped over the chair's back, its ties hanging
  const ap = smooth([[cx - 70, seatY - 236], [cx + 72, seatY - 236], [cx + 80, seatY - 180], [cx + 54, seatY - 60], [cx + 10, seatY - 40], [cx - 40, seatY - 60], [cx - 76, seatY - 170]]);
  wash(g, ap, { color: '#fbf8f0', opacity: 0.99, seed: 6440, under: true }); glaze(g, ap, cx - 20, seatY - 180, 40, 40, '#ffffff', 0.6); shadeEdge(g, ap, { color: '#a8a0b8', alpha: 0.35, width: 30, dx: 10, dy: 0 });
  for (let k = 0; k < 4; k++) ink(g, [[cx - 40 + k * 26, seatY - 226], [cx - 34 + k * 24, seatY - 70]], { width: 1, alpha: 0.35, seed: 6441 + k });
  const pk = rect(cx - 24, seatY - 140, cx + 24, seatY - 100); ink(g, pk, { closed: true, width: 1.2, alpha: 0.6 }); ink(g, ap, { closed: true, width: 1.5, alpha: 0.8 });
  for (const sd of [-1, 1]) ink(g, [[cx + sd * 70, seatY - 230], [cx + sd * 84, seatY - 160], [cx + sd * 78, seatY - 90]], { color: '#f4eee4', width: 5, alpha: 1 });
  // the milk pail on the floor (empty now)
  const [px, py] = BEDROOM.pail, pl = [[px - 44, py - 96], [px + 44, py - 96], [px + 34, py], [px - 34, py]];
  wash(g, pl, { color: '#b8b4ac', opacity: 0.98, seed: 6450, under: true }); glaze(g, pl, px - 18, py - 50, 10, 40, '#f4f4f0', 0.7); shadeEdge(g, pl, { color: '#5a5868', alpha: 0.45, width: 24, dx: 10, dy: 0 });
  for (const yy of [py - 80, py - 20]) ink(g, [[px - 42 + (py - 96 - yy) * -0.1, yy], [px + 42 - (py - 96 - yy) * -0.1, yy]], { width: 1.4, alpha: 0.55 });
  const rim = ellipse(px, py - 96, 44, 9, 30); wash(g, rim, { color: '#5a5860', opacity: 0.9, seed: 6451, under: true }); ink(g, rim, { closed: true, width: 1.4, alpha: 0.8 });
  ink(g, [[px - 44, py - 96], [px - 34, py]], { width: 1.6, alpha: 0.8 }); ink(g, [[px + 44, py - 96], [px + 34, py]], { width: 1.6, alpha: 0.8 }); ink(g, ellipse(px, py, 34, 6, 20).slice(0, 11), { width: 1.4, alpha: 0.7 });
  ink(g, [[px - 42, py - 92], [px - 40, py - 150], [px, py - 170], [px + 40, py - 150], [px + 42, py - 92]], { width: 2, alpha: 0.8 });
}
// the moonbeam from the window to the floor, painted into the night glaze
function moonbeam(g) {
  const { x, y, w, h } = BEDROOM.window;
  g.save(); g.globalCompositeOperation = 'screen'; g.filter = `blur(${16 * RES}px)`;
  g.fillStyle = 'rgba(120,140,200,0.16)'; g.beginPath(); g.moveTo(x - w / 2, y - h / 2); g.lineTo(x + w / 2, y - h / 2); g.lineTo(x + w * 1.4, 1000); g.lineTo(x - w * 0.2, 1000); g.closePath(); g.fill();
  g.filter = `blur(${8 * RES}px)`; g.fillStyle = 'rgba(150,170,230,0.16)';
  for (const [dx, dy] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) { const fx = x + w * 0.6 + dx * w * 0.9 + 120, fy = 930 + dy * 70; g.beginPath(); g.ellipse(fx, fy, w * 0.26, 24, 0, 0, TAU); g.fill(); }
  g.restore();
}
// the night falling on the room: deep blue-violet gathering in the corners and under the roof, the candle's warm pool
// left clear and golden (painted with brushed strokes, multiplied over what is already painted on canvas c)
function roomNight(c, seed = 1) {
  const g = pageG(c), r = rng(seed), [fx, fy] = BEDROOM.flame, keep = canvas(c.width, c.height, false); keep.getContext('2d').drawImage(c, 0, 0);
  const tmp = canvas(c.width, c.height), t = pageG(tmp);
  const rg = t.createRadialGradient(fx + 60, fy + 40, 120, fx + 60, fy + 40, 1500);
  rg.addColorStop(0, '#fff4e4'); rg.addColorStop(0.18, '#f4dcc0'); rg.addColorStop(0.42, '#a8a0c4'); rg.addColorStop(0.75, '#6a6aa0'); rg.addColorStop(1, '#4a4c84');
  t.fillStyle = rg; t.fillRect(-M, -MY, LW, LH);
  t.lineCap = 'round'; t.filter = `blur(${30 * RES}px)`;
  for (let i = 0; i < 40; i++) { const x = r.range(-M, W + M), y = r.range(-MY, H + MY), d = Math.hypot(x - fx, y - fy); if (d < 380) continue; t.strokeStyle = rgba(r.pick(['#5a5a98', '#6a6aa8', '#4e5290', '#7a74b0']), r.range(0.15, 0.35)); t.lineWidth = r.range(60, 160); t.beginPath(); t.moveTo(x - 200, y + r.gauss(0, 30)); t.quadraticCurveTo(x, y + r.gauss(0, 40), x + 200, y + r.gauss(0, 30)); t.stroke(); }
  t.filter = 'none';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.drawImage(tmp, 0, 0);
  g.globalCompositeOperation = 'destination-in'; g.drawImage(keep, 0, 0); g.restore();
}
const BRL = {};
export function bedroomLayers() {
  if (BRL.back) return BRL;
  const back = tm('bed-back', () => hlayer((g) => bedroomBack(g)));
  const quilt = tm('bed-quilt', () => hlayer((g) => bedroomQuilt(g, false)));
  const quiltHump = tm('bed-quilt', () => hlayer((g) => bedroomQuilt(g, true)));
  const front = tm('bed-front', () => hlayer((g) => bedroomFront(g)));
  for (const [c, sd] of [[back, 31], [quilt, 32], [quiltHump, 33], [front, 34]]) roomNight(c, sd);
  moonbeam(pageG(back));
  for (const [c, sd] of [[back, 41], [quilt, 42], [quiltHump, 43], [front, 44]]) grain(c, 0.2, sd);
  BRL.back = to8(back); BRL.quilt = to8(quilt); BRL.quiltHump = to8(quiltHump); BRL.front = to8(front);
  return BRL;
}
// the candle's warm light on the room: soft-light warmth in a wide pool, a brighter glow near the flame (live, flickering)
export function candleRoomLight(g, t, k = 1, at = BEDROOM.flame) {
  if (k <= 0) return;
  const f = flicker(t, 5), [x, y] = at;
  g.save();
  g.globalCompositeOperation = 'soft-light'; pool(g, x + 80, y + 60, 800 * (0.97 + 0.03 * f), 640, '#ffb060', 0.45 * k * f);
  g.globalCompositeOperation = 'lighter'; pool(g, x, y - 10, 380 * (0.96 + 0.04 * f), 330, '#ff9a40', 0.06 * k * f); pool(g, x, y - 14, 120, 110, '#ffe0a0', 0.22 * k * f);
  g.restore();
}
// The bedroom for one frame (see bedroomLayers for o).
export function drawBedroom(g, t, c, o = {}) {
  const L = bedroomLayers(), k = o.candle ?? 1;
  drawH(g, c, L.back);
  cam(g, c, 1);
  // the sky through the window: stars and the moon, kept to the glass
  { const { x, y, w, h } = BEDROOM.window; g.save(); g.beginPath(); g.rect(x - w / 2, y - h / 2, w, h * 0.74); g.clip();
    g.save(); g.translate(x - w / 2, y - h / 2); g.scale(w / 1920, h * 0.74 / 420); softStars(g, t, o.starsK ?? 1); g.restore();
    moon(g, x + w * 0.24, y - h * 0.22, 22, o.moonK ?? 1); g.restore(); }
  if (o.sleeper) o.sleeper(g);
  g.drawImage(o.sleeper || o.hump ? L.quiltHump : L.quilt, -M, -MY, LW, LH);
  flame(g, t, BEDROOM.flame[0], BEDROOM.flame[1], 30, k, 5);
  if (o.actors) o.actors(g);
  g.drawImage(L.front, -M, -MY, LW, LH);
  candleRoomLight(g, t, k);
  if (k < 1) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(86,90,150,${0.5 * (1 - k)})`; g.fillRect(-M, -MY, LW, LH); g.restore(); }   // the candle out: the warm pool goes blue too
  if (o.ambient !== false && k > 0) dustMotes(g, t, 14, k);
  if (o.after) o.after(g);
}
// warm motes drifting slowly in the candlelight
function dustMotes(g, t, n, k) {
  const [x0, y0] = BEDROOM.flame; g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const sp = 0.01 + 0.008 * noise1(i, 3), v = (t * sp + noise1(i * 3.1, 9)) % 1, x = x0 - 260 + 520 * noise1(i * 7.3, 5) + Math.sin(t * 0.3 + i) * 14, y = y0 + 220 - v * 420, a = Math.sin(v * Math.PI) * 0.4 * k;
    if (a <= 0.02) continue; g.fillStyle = `rgba(255,226,170,${a})`; g.beginPath(); g.arc(x, y, 1.2 + (i % 3) * 0.5, 0, TAU); g.fill(); }
  g.restore();
}
