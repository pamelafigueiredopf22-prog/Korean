// Belling the Cat: scenery and environment.
//
// Pen-and-wash after the classic English storybook (broken washes with the paper showing, granulation, fine
// broken ink lines on everything). All painters draw in the page coordinates of a 1920x1080 frame; the big sets
// are 2x layers with the usual camera margins (M, MY), so the camera can push in to ~2.3x and stay crisp.
// Every set is painted ONCE in its plain colours, then lit for each mood by a painted light pass (cast shadows,
// a brushed shade map cleared where the light falls, glows, moonlight), so a mood is painted, not just tinted.
//
// Places
//   homeLayers()                   the mice's home behind the kitchen wall (mouse scale, the main set, 2x), both
//                                  moods painted at once: { candle: {back, nests, front}, dark: {...} }
//   drawHome(g, t, c, o)           the whole home for one frame: hooks behind / sleepers / actors / after, and
//                                  o.outAt (blow the candle out: flame bends and goes, smoke, the dark fades in)
//   kitchenLayers()                the farmhouse kitchen at human scale seen low (2x), both moods painted at once:
//                                  { evening: {back, table, front, bars}, night: {...} }
//   drawKitchen(g, t, c, mood, o)  the whole kitchen for one frame (curtains, clock, fire, moon, lamp: all live)
//   drawThoughtBubble(g, x, y, w, h, t, k, o)   the storybook "imagination" vignette (paper cloud, painted inside;
//                                  the stager paints the belled cat with o.inside); bubbleInner(w, h) its picture oval
// Moods: home 'candle' (one candle stub, warm and golden, soft dark edges) and 'dark' (candle out: deep blue-violet,
// a thread of moonlight through the door's crack); kitchen 'evening' (lamplight, dusk in the window) and 'night'
// (moonlight through the window, embers in the range). Set constants: HOME, KITCHEN (positions for staging).
// Ambient life (functions of t), all smooth (no frame-to-frame jumps at 30 fps):
//   home:    flicker, candleK, darkK, candleLight, drawCandle, candleMotes, moonMotes, candleShadow (for actors),
//            drawNestFronts, councilSpot
//   kitchen: drawCurtains, pendulum, embers, lampGlow, kettleSteam, kitchenMoon / moonPos, moth, mouseDoorGlow
//
// Scale: the home is drawn for mice about 160-220 px tall (makeMouse2 at ~1.2-1.6: the cotton reel is 150 px high);
// the kitchen for a cat about 300-340 px long curled on the rug (makeCat at ~0.55) and mice about 40 px tall at the
// mouse door (makeMouse2 at ~0.3). Keep the lower ~180 px for the captions: nothing important is painted below y = 900.
// Cost: painting both sets takes ~20 s at set-up; per frame each set is ~20-30 ms (one 2x layer and a few pieces).
import { W, H, rng, canvas, wash, pool, smooth, ellipse, rgba, shade, tint, mix, noise1, glaze, penLine, sprite, drawSprite,
  bbox, path, ink, sketch, hatch, clamp, lerp, ease, span, granulate, shadeEdge, blooms, speckle, ribbon } from '../../engine/watercolor.js';
import { M, MY, LW, LH, cam } from '../../engine/stage.js';
import { brushWash } from '../crow-and-pitcher/scene.js';

const TAU = Math.PI * 2;
const INKC = '#3a2c24';

// ---------------------------------------------------------------- moods
export const MOODS = {
  candle: { name: 'candle', set: 'home', amb: '#5a3828', ambK: 0.82, glow: '#ffb050' },
  dark: { name: 'dark', set: 'home', amb: '#2e3266', ambK: 0.95, glow: '#9aaee8' },
  evening: { name: 'evening', set: 'kitchen', amb: '#6a4a3e', ambK: 0.7, glow: '#ffb060' },
  night: { name: 'night', set: 'kitchen', amb: '#323a72', ambK: 0.9, glow: '#a8b8f0' },
};
// set-up timing per painter (ms), to check how long the sets take
export const TIMING = {};
const tm = (k, fn) => { const t0 = performance.now(); const v = fn(); TIMING[k] = (TIMING[k] || 0) + performance.now() - t0; return v; };

// ---------------------------------------------------------------- cameras and layers
// a camera looking at (cx, cy) with zoom z, kept inside the painted page
export function view(cx, cy, z) {
  const hw = W / 2 / z, hh = H / 2 / z;
  return { z, x: clamp(cx, -M + hw, W + M - hw) - W / 2, y: clamp(cy, -MY + hh, H + MY - hh) - H / 2 };
}
export const RES = 2;   // pixels per page unit of the big sets
function hcanvas(float = true) { return canvas(LW * RES, LH * RES, float); }
function pageCtx(c) { const g = c.getContext('2d'); g.setTransform(RES, 0, 0, RES, M * RES, MY * RES); return g; }
function hpaint(fn, float = true) { const c = hcanvas(float); fn(pageCtx(c), c); return c; }
export const drawH = (g, c, img, alpha = 1) => { cam(g, c, 1); const a = g.globalAlpha; g.globalAlpha = a * alpha; g.drawImage(img, -M, -MY, LW, LH); g.globalAlpha = a; };
function to8(c) { const o = canvas(c.width, c.height, false); o.getContext('2d').drawImage(c, 0, 0); return o; }
// a closed polygon with no side longer than `max` (long straight sides make the wash bleed into spikes)
function densify(pts, max = 22) {
  const out = [];
  for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / max)); for (let k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
  return out;
}
function free(c) { if (c) { c.width = 1; c.height = 1; } }
// cut the painted parts of a full-page layer into small pieces (so the per-frame draw only touches them)
function pieces(c, boxes) {
  return boxes.map((b) => {
    const x0 = Math.max(-M, b.x0), y0 = Math.max(-MY, b.y0), x1 = Math.min(W + M, b.x1), y1 = Math.min(H + MY, b.y1);
    const pc = canvas((x1 - x0) * RES, (y1 - y0) * RES, false);
    pc.getContext('2d').drawImage(c, (x0 + M) * RES, (y0 + MY) * RES, (x1 - x0) * RES, (y1 - y0) * RES, 0, 0, pc.width, pc.height);
    return { c: pc, x0, y0, w: x1 - x0, h: y1 - y0 };
  });
}
const drawPieces = (g, ps, alpha = 1) => { for (const p of ps) drawSprite(g, p, alpha); };

// ---------------------------------------------------------------- painting helpers
const R4 = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
// a hand-cut box: a rectangle whose sides wander a little
function handBox(x0, y0, x1, y1, r, j = 1.2, n = 3) {
  const pts = [];
  const edge = (ax, ay, bx, by) => { for (let i = 0; i < n; i++) { const k = i / n; pts.push([ax + (bx - ax) * k + (i ? r.gauss(0, j) : 0), ay + (by - ay) * k + (i ? r.gauss(0, j) : 0)]); } };
  edge(x0, y0, x1, y0); edge(x1, y0, x1, y1); edge(x1, y1, x0, y1); edge(x0, y1, x0, y0);
  return pts;
}
// a cylinder seen from a little above: { side, top } (top: the whole top ellipse; side: the visible band)
function cyl(cx, yb, yt, rx, ry, n = 24, rxTop = rx) {
  const side = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI; side.push([cx + rx * Math.cos(a), yb + ry * Math.sin(a)]); }
  const ryT = ry * rxTop / rx;
  for (let i = n; i >= 0; i--) { const a = (i / n) * Math.PI; side.push([cx + rxTop * Math.cos(a), yt + ryT * Math.sin(a)]); }
  return { side, top: ellipse(cx, yt, rxTop, ryT, 2 * n) };
}
const half = (cx, cy, rx, ry, lower = true, n = 20) => { const p = []; for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI; p.push([cx + rx * Math.cos(a), cy + (lower ? 1 : -1) * ry * Math.sin(a)]); } return p; };
// wood grain: long wavering broken lines along angle `ang`, clipped to the shape
function grain(g, shape, col, o = {}) {
  const { seed = 1, n = 40, ang = 0, alpha = 0.3, wid = [0.6, 1.4], wave = 3, knots = 0 } = o;
  const r = rng(seed), b = bbox(shape), ca = Math.cos(ang), sa = Math.sin(ang);
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2, hl = Math.hypot(b.w, b.h) / 2;
  const hw = Math.abs(-sa * b.w / 2) + Math.abs(ca * b.h / 2) + 2;
  g.save(); path(g, shape); g.clip(); g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 0; i < n; i++) {
    const off = r.range(-hw, hw), ph = r() * TAU, fr = r.range(0.008, 0.03), amp = wave * r.range(0.3, 1.4);
    g.strokeStyle = rgba(col, alpha * r.range(0.35, 1)); g.lineWidth = r.range(...wid);
    const s0 = r.range(-hl, -hl * 0.2), s1 = r.range(hl * 0.2, hl);
    g.beginPath();
    for (let s = s0, f = true; s <= s1; s += 8, f = false) { const o2 = off + Math.sin(s * fr + ph) * amp; const x = cx + ca * s - sa * o2, y = cy + sa * s + ca * o2; if (f) g.moveTo(x, y); else g.lineTo(x, y); }
    g.stroke();
  }
  for (let k = 0; k < knots; k++) {
    const x = r.range(b.x0 + b.w * 0.15, b.x1 - b.w * 0.15), y = r.range(b.y0 + b.h * 0.15, b.y1 - b.h * 0.15), kr = r.range(4, 9);
    for (let q = 0; q < 4; q++) { g.strokeStyle = rgba(col, alpha * (1.2 - q * 0.2)); g.lineWidth = q ? 0.8 : 2; g.beginPath(); g.ellipse(x, y, kr * (1 + q * 0.9) * (Math.abs(ca) + 0.4), kr * (1 + q * 0.9) * (Math.abs(sa) + 0.4), ang, 0, TAU); g.stroke(); }
    g.fillStyle = rgba(shade(col, 0.3), alpha * 1.4); g.beginPath(); g.ellipse(x, y, kr * 0.7, kr * 0.5, ang, 0, TAU); g.fill();
  }
  g.restore();
}
// a piece of wood: wash, blooms, grain, form shading and a pen outline
function wood(g, shape, cols, o = {}) {
  const { seed = 1, ang = 0, n = 26, line = 1.6, lineA = 0.75, sharp = false } = o;
  wash(g, densify(shape), { color: cols[0], opacity: o.op ?? 0.95, seed, under: o.under ?? true, bleed: 0.012, layers: o.layers ?? 14, edge: 0.3 });
  if (cols.length > 1) blooms(g, shape, cols.slice(1), { n: o.blooms ?? 4, seed: seed + 1, alpha: 0.3, size: 0.3 });
  grain(g, shape, shade(cols[0], 0.55), { seed: seed + 2, n, ang, alpha: o.grainA ?? 0.3, knots: o.knots || 0, wave: o.wave ?? 3, wid: o.wid });
  if (o.sdx || o.sdy) shadeEdge(g, shape, { color: shade(cols[0], 0.65), alpha: o.sa ?? 0.42, width: o.sw || 22, dx: o.sdx || 0, dy: o.sdy || 0 });
  if (o.hi) glaze(g, shape, ...o.hi, tint(cols[0], 0.5), 0.45);
  if (line) penLine(g, shape, { closed: true, w: line, alpha: lineA, seed: seed + 3, sharp: sharp || shape.length <= 6 });
}
// a small painted thing: wash (opaque), blooms, shading toward the side away from the light, outline
function thing(g, shape, col, o = {}) {
  const { seed = 1 } = o;
  wash(g, densify(shape), { color: col, opacity: o.op ?? 0.96, seed, under: o.under ?? true, bleed: o.bleed ?? 0.01, layers: o.layers ?? 12, edge: o.edge ?? 0.3 });
  if (o.blooms) blooms(g, shape, o.blooms, { n: 4, seed: seed + 1, alpha: o.ba ?? 0.3, size: 0.32 });
  if (o.hi) glaze(g, shape, ...o.hi, o.hiCol || tint(col, 0.6), o.hiA ?? 0.5);
  if (o.sdx || o.sdy) shadeEdge(g, shape, { color: o.shadow || shade(col, 0.6), alpha: o.sa ?? 0.4, width: o.sw || 14, dx: o.sdx || 0, dy: o.sdy || 0 });
  if (o.line !== 0) penLine(g, shape, { closed: true, w: o.line ?? 1.4, alpha: o.lineA ?? 0.72, seed: seed + 2, sharp: o.sharp ?? shape.length <= 6 });
}
// fluffy wool / feather down: a soft mound of strands
function wool(g, cx, cy, rx, ry, cols, seed, o = {}) {
  const r = rng(seed);
  const n = Math.max(8, Math.round(rx / 9)), raw = [];
  for (let i = 0; i < n * 2; i++) { // soft lumps round the outline
    const a = (i / (n * 2)) * TAU, k = (i % 2 ? 1.06 : 0.94) * (1 + r.gauss(0, 0.04));
    raw.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k * (Math.sin(a) > 0 ? (o.flat ?? 0.6) : 1)]);
  }
  const sh = smooth(raw, true, 4);
  wash(g, sh, { color: cols[0], opacity: 0.95, seed, under: true, bleed: 0.025, layers: 12, edge: 0.12 });
  blooms(g, sh, cols, { n: 7, seed: seed + 1, alpha: 0.4, size: 0.28 });
  g.save(); path(g, sh); g.clip(); g.lineCap = 'round';
  for (let i = 0; i < (o.n ?? 70); i++) { // curly strands, mostly pale
    const x = r.range(cx - rx, cx + rx), y = r.range(cy - ry, cy + ry), a = r() * TAU, L = r.range(8, 20) * (o.s ?? 1);
    g.strokeStyle = rgba(i % 4 === 0 ? shade(r.pick(cols), 0.3) : tint(r.pick(cols), 0.55), r.range(0.25, 0.55)); g.lineWidth = r.range(0.8, 1.7);
    g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + Math.cos(a) * L, y + Math.sin(a) * L * 0.6, x + Math.cos(a + 2) * L, y + Math.sin(a + 2) * L * 0.6, x + Math.cos(a + 1) * L * 0.5, y + Math.sin(a + 1) * L * 0.3); g.stroke();
  }
  g.restore();
  shadeEdge(g, sh, { color: shade(cols[0], 0.45), alpha: 0.26, width: ry * 0.6, dy: -ry * 0.25 });
  ink(g, sh.filter((_, i) => i % 2 === 0), { closed: true, width: 0.9, alpha: 0.35, gaps: 1.6, wobble: 1.2, seed: seed + 2 });
  for (let i = 0; i < Math.round(rx / 8); i++) { const p = sh[Math.floor(r() * sh.length)], a = r() * TAU; ink(g, [p, [p[0] + Math.cos(a) * 9, p[1] + Math.sin(a) * 5], [p[0] + Math.cos(a + 1) * 13, p[1] + Math.sin(a + 1) * 7]], { color: shade(cols[0], 0.2), width: 0.8, alpha: 0.4, seed: seed + 10 + i }); }
  return sh;
}
// a feather (curving quill, soft vane)
function feather(g, x, y, ang, L, col, seed) {
  const r = rng(seed), ca = Math.cos(ang), sa = Math.sin(ang), P = (s, o) => [x + ca * s - sa * o, y + sa * s + ca * o];
  const vane = smooth([P(0, 0), P(L * 0.2, -L * 0.12), P(L * 0.6, -L * 0.16), P(L, -L * 0.03), P(L * 0.7, L * 0.11), P(L * 0.3, L * 0.12), P(L * 0.08, L * 0.04)]);
  wash(g, vane, { color: col, opacity: 0.9, seed, under: true, layers: 8, bleed: 0.03, edge: 0.1 });
  g.save(); path(g, vane); g.clip(); g.strokeStyle = rgba(shade(col, 0.35), 0.4); g.lineWidth = 0.7;
  for (let s = L * 0.1; s < L; s += 3.2) { const [ax, ay] = P(s, 0), [bx, by] = P(s + L * 0.12, (r() < 0.5 ? -1 : 1) * L * 0.2); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
  g.restore();
  penLine(g, [P(-L * 0.12, 0), P(L * 0.5, -L * 0.02), P(L, -L * 0.03)], { w: 1.4, alpha: 0.7, seed: seed + 1 });
  ink(g, vane, { closed: true, width: 0.8, alpha: 0.35, gaps: 1.2, seed: seed + 2 });
}

// ---------------------------------------------------------------- the light pass (how a mood is painted)
// Light a finished 2x layer for a mood. A shade map is brushed at quarter size (the ambient colour, in broad
// uneven strokes), cleared with soft white where each light falls, then multiplied over the painting; glows go on
// with 'screen'. With mask, only the painted (non-transparent) parts are touched.
// o: { amb, ambK, cols (stroke colours), lights: [{ x, y, rx, ry, a, inner }], glows: [{ x, y, rx, ry, col, a }], seed, mask }
function lightPass(c, o) {
  const w = c.width, h = c.height, q = 4, r = rng(o.seed || 5);
  const sm = canvas(Math.ceil(w / q), Math.ceil(h / q), false), t = sm.getContext('2d');
  const s = RES / q; t.setTransform(s, 0, 0, s, M * s, MY * s);
  t.fillStyle = o.amb; t.fillRect(-M, -MY, LW, LH);
  t.lineCap = 'round';
  for (let i = 0; i < (o.strokes ?? 46); i++) {
    const x = r.range(-M, W + M), y = r.range(-MY, H + MY), L = r.range(300, 800), a = r.gauss(0, 0.12);
    t.strokeStyle = rgba(r.pick(o.cols || [o.amb]), r.range(0.12, 0.32)); t.lineWidth = r.range(50, 150);
    t.beginPath(); t.moveTo(x - Math.cos(a) * L / 2, y - Math.sin(a) * L / 2); t.quadraticCurveTo(x, y + r.gauss(0, 40), x + Math.cos(a) * L / 2, y + Math.sin(a) * L / 2); t.stroke();
  }
  for (const L of o.lights || []) {
    t.save(); t.translate(L.x, L.y); t.scale(1, L.ry / L.rx);
    const gr = t.createRadialGradient(0, 0, 0, 0, 0, L.rx), a = L.a ?? 1;
    gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(L.inner ?? 0.3, `rgba(255,255,255,${a * 0.92})`);
    gr.addColorStop(Math.min(0.95, (L.inner ?? 0.3) + 0.35), `rgba(255,255,255,${a * 0.45})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
    t.fillStyle = gr; t.fillRect(-L.rx, -L.rx, L.rx * 2, L.rx * 2); t.restore();
  }
  if (o.paintMap) o.paintMap(t);
  const tmp = canvas(w, h, false), tg = tmp.getContext('2d');
  tg.imageSmoothingQuality = 'high'; tg.filter = 'blur(3px)'; tg.drawImage(sm, 0, 0, w, h); tg.filter = 'none';
  let keep = null;
  if (o.mask) { keep = canvas(w, h, false); keep.getContext('2d').drawImage(c, 0, 0); }
  const g = c.getContext('2d');
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.globalAlpha = o.ambK ?? 1; g.drawImage(tmp, 0, 0); g.restore();
  free(tmp); free(sm);
  if (o.soft) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'soft-light'; g.fillStyle = o.soft; g.fillRect(0, 0, w, h); g.restore(); }
  g.save(); g.setTransform(RES, 0, 0, RES, M * RES, MY * RES); g.globalCompositeOperation = 'screen';
  for (const L of o.glows || []) pool(g, L.x, L.y, L.rx, L.ry, L.col, L.a);
  if (o.paintLight) { g.globalCompositeOperation = 'source-over'; o.paintLight(g); }
  g.restore();
  if (keep) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(keep, 0, 0); g.restore(); free(keep); }
}
// a soft shadow lying on the floor from foot (x, y), pointing along (dx, dy) for `len`, `w` wide at the foot
function floorShadow(g, x, y, dx, dy, len, w, col, a, blur = 6) {
  const d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, px = -uy, py = ux;
  const tip = [x + ux * len, y + uy * len], w1 = w * 1.35;
  g.save(); g.globalCompositeOperation = 'multiply'; g.filter = `blur(${blur * RES}px)`;
  const lg = g.createLinearGradient(x, y, tip[0], tip[1]); lg.addColorStop(0, rgba(col, a)); lg.addColorStop(0.55, rgba(col, a * 0.55)); lg.addColorStop(1, rgba(col, 0));
  g.fillStyle = lg;
  g.beginPath(); g.moveTo(x + px * w * 0.5, y + py * w * 0.5 * 0.4);
  g.quadraticCurveTo(x + ux * len * 0.5 + px * w1 * 0.55, y + uy * len * 0.5 + py * w1 * 0.55 * 0.5, tip[0] + px * w1 * 0.45, tip[1] + py * w1 * 0.45 * 0.5);
  g.lineTo(tip[0] - px * w1 * 0.45, tip[1] - py * w1 * 0.45 * 0.5);
  g.quadraticCurveTo(x + ux * len * 0.5 - px * w1 * 0.55, y + uy * len * 0.5 - py * w1 * 0.55 * 0.5, x - px * w * 0.5, y - py * w * 0.5 * 0.4);
  g.closePath(); g.fill();
  g.restore();
}

// ================================================================ THE MICE'S HOME BEHIND THE KITCHEN WALL
// A hollow between two old studs and a beam, its back wall big old bricks with a scrap of rose wallpaper pasted on,
// a floor of wide boards with a crocheted doily for a carpet, and the candle stub in the middle on a penny.
export const HOME = {
  floorY: 732,                                                // where the back wall meets the floor
  vp: [960, 360],                                             // the floorboards' vanishing point
  CANDLE: { x: 960, y: 804, top: 700, flame: [963, 664], wick: [965, 686] },  // y: the penny on the floor; flame: its middle
  REEL: { x: 560, y: 812, top: [560, 662], rx: 70, ry: 17 },  // the cotton reel; top: the middle of its top (stand a mouse here)
  SEAT: { x: 1342, y: 824, top: [1342, 730], rx: 36 },        // a cork stool with a felt cushion (for the elder)
  TABLE: { x: 772, y: 740, top: [772, 672], rx: 92 },          // the button table with the bottle-cap plate and thimbles
  FOOD: { cheese: [748, 655], cake: [722, 660], cups: [[820, 664], [848, 676]] },
  CHEST: { x0: 1468, x1: 1644, y: 744, top: 572 },            // the matchbox chest of drawers
  DOOR: { x: 1215, y: 734, w: 126, h: 188, crack: [1268, 566, 1268, 732] },   // the little door to the kitchen (ajar); crack: the bright gap
  LADDER: { foot: [258, 770], top: [302, 346] },
  SHELF: { x0: 198, x1: 548, y: 346 },
  STAMPS: [[640, 300], [760, 288], [880, 304]],
  DOILY: { x: 960, y: 818, rx: 382, ry: 86 },
  COUNCIL: { x: 960, y: 806, rx: 430, ry: 80 },               // a ring of places around the candle for the meeting / the dance
  // nests (for sleeping at the end): x, y = base on the floor; sleep: where a curled-up mouse lies (its bottom, on the
  // wool), pillow: the little pillow for its head; s: a size hint for the sleeper. Draw sleepers with drawHome's
  // o.sleepers hook (or before drawNestFronts): the quilt turned down over each rim then tucks them in.
  NESTS: [
    { kind: 'teacup', x: 404, y: 752, sleep: [404, 630], pillow: [446, 622], s: 1 },
    { kind: 'walnut', x: 252, y: 886, sleep: [252, 816], pillow: [296, 810], s: 0.85 },
    { kind: 'walnut', x: 1512, y: 808, sleep: [1512, 738], pillow: [1468, 732], s: 0.85 },
    { kind: 'walnut', x: 1694, y: 886, sleep: [1694, 816], pillow: [1650, 810], s: 0.85 },
  ],
  MOONBEAM: [[1262, 732], [1274, 732], [1240, 1134], [1150, 1134]],   // the thread of moonlight on the floor (dark)
};
const C0 = HOME.CANDLE;
const awayX = (x) => Math.sign(C0.x - x) || 1;   // +1 when the candle is to the right of x
// The i-th of n places round the council ring (for the meeting, or the dance round the candle with turn = t * speed):
// { x, y (feet), s (a size factor: smaller at the back), back (true: behind the candle, draw with drawHome's o.behind),
// face (+1 facing right, -1 facing left: towards the candle) }. a0 starts the ring (0 = front middle).
export function councilSpot(i, n, turn = 0, a0 = 0) {
  const { x, y, rx, ry } = HOME.COUNCIL, a = Math.PI / 2 + a0 + (i / n) * TAU + turn, px = x + Math.cos(a) * rx, py = y + Math.sin(a) * ry;
  return { x: px, y: py, s: 0.86 + 0.14 * (py - (y - ry)) / (2 * ry), back: py < C0.y, face: px < x ? 1 : -1 };
}

// ---- the back wall: big old bricks (at mouse scale a brick is a great block), crumbling lime mortar
const BRICK = ['#a8644a', '#9a5a44', '#b07858', '#8e5444', '#a86e52', '#9c6250', '#b48464', '#86503e', '#a07060'];
function brick(g, x0, y0, x1, y1, col, r, sd) {
  const c = 6 + r() * 8, j = () => r.gauss(0, 1.8);
  const pts = smooth([[x0 + c, y0 + j()], [(x0 + x1) / 2, y0 + j()], [x1 - c * r.range(0.4, 1.4), y0 + j()], [x1 + j(), y0 + c], [x1 + j(), (y0 + y1) / 2], [x1 + j(), y1 - c],
    [x1 - c, y1 + j()], [(x0 + x1) / 2, y1 + j()], [x0 + c, y1 + j()], [x0 + j(), y1 - c * r.range(0.5, 1.5)], [x0 + j(), (y0 + y1) / 2], [x0 + j(), y0 + c]], true, 4);
  const b = bbox(pts);
  wash(g, pts, { color: col, opacity: 0.9, seed: sd, bleed: 0.008, layers: 7, edge: 0.45 });
  g.save(); path(g, pts); g.clip();
  for (let k = 0; k < 4; k++) pool(g, r.range(b.x0, b.x1), r.range(b.y0, b.y1), b.w * r.range(0.15, 0.4), b.h * r.range(0.3, 0.7), r.pick(BRICK.concat(['#7a5a50', '#c09070'])), 0.45);
  if (r() < 0.5) { const lx = r.range(b.x0, b.x1), ly = r.range(b.y0, b.y1); wash(g, smooth([[lx - 30, ly], [lx - 6, ly - 10], [lx + 34, ly - 4], [lx + 20, ly + 9], [lx - 14, ly + 8]]), { color: '#e0d4bc', opacity: r.range(0.25, 0.45), seed: sd + 4, layers: 5, edge: 0.1 }); } // old limewash
  speckle(g, b, { color: shade(col, 0.6), count: Math.round(b.w * 0.3), size: 2.6, alpha: 0.5, seed: sd });
  speckle(g, b, { color: tint(col, 0.5), count: Math.round(b.w * 0.1), size: 2, alpha: 0.35, seed: sd + 1 });
  g.restore();
  shadeEdge(g, pts, { color: shade(col, 0.6), alpha: 0.45, width: 26, dy: -10 });        // the lower edge in shadow
  hatch(g, pts, { color: '#3a2418', count: 26, len: 12, width: 0.9, alpha: 0.4, seed: sd + 5, dir: () => -0.9, density: (x, y) => clamp((y - b.y0) / b.h - 0.35) });
  ink(g, pts, { closed: true, width: 1.5, alpha: 0.6, wobble: 0.5, gaps: 0.7, seed: sd + 2 });
  penLine(g, pts.slice(Math.floor(pts.length * 0.5), Math.floor(pts.length * 0.85)), { w: 2.2, alpha: 0.35, seed: sd + 6 });   // a heavier line under it
  if (r() < 0.35) { const cx = r.range(b.x0 + 20, b.x1 - 20); ink(g, [[cx, b.y0 + 4], [cx + r.gauss(0, 8), b.y0 + b.h * 0.4], [cx + r.gauss(0, 12), b.y0 + b.h * r.range(0.6, 0.9)]], { width: 1.1, alpha: 0.5, seed: sd + 3 }); }
}
function brickWall(g, x0, y0, x1, y1, seed) {
  const r = rng(seed);
  brushWash(g, R4(x0, y0, x1, y1), ['#9a8a74', '#8a7a66', '#a89880', '#7e6e5c'], { seed, count: 50, width: [20, 50], len: [100, 300], alpha: [0.2, 0.4], base: 0.92, under: true });
  speckle(g, { x0, y0, x1, y1 }, { color: '#4a3a2e', count: 1200, size: 2.4, alpha: 0.45, seed: seed + 1 });
  let y = y1, row = 0;
  while (y > y0 - 40) {
    const bh = r.range(86, 100), yt = y - bh;
    let x = x0 - (row % 2 ? r.range(110, 150) : r.range(0, 40));
    while (x < x1 + 20) {
      const bw = r.range(220, 280);
      if (r() > 0.04) brick(g, x + 5, yt + 5, x + bw - 5, y - 5, r.pick(BRICK), r, seed + row * 50 + Math.round(x));
      x += bw;
    }
    y = yt; row++;
  }
  // the mortar recessed: a little shadow under each course on the wall is in the bricks' own shading
}
// ---- a scrap of old rose-sprigged wallpaper pasted on the bricks, torn round the edges
function wallpaper(g, x0, y0, x1, y1, seed) {
  const r = rng(seed), pts = [];
  const side = (ax, ay, bx, by, n) => { for (let i = 0; i < n; i++) { const k = i / n; pts.push([ax + (bx - ax) * k + r.gauss(0, 5), ay + (by - ay) * k + r.gauss(0, 5)]); } };
  side(x0, y0, x1, y0 + 10, 16); side(x1, y0 + 10, x1 - 14, y1, 10); side(x1 - 14, y1, x0 + 10, y1 - 8, 16); side(x0 + 10, y1 - 8, x0, y0, 10);
  const sh = smooth(pts, true, 2);
  wash(g, sh, { color: '#ecd8c6', opacity: 0.96, seed, under: '#f2e8d8', bleed: 0.01, layers: 12, edge: 0.4 });
  blooms(g, sh, ['#e8cbb8', '#f0dcc8', '#dcc0ac'], { n: 6, seed: seed + 1, alpha: 0.35 });
  g.save(); path(g, sh); g.clip();
  for (let x = x0 + 10; x < x1; x += 46) { g.fillStyle = rgba('#d8b8a8', 0.35); g.fillRect(x, y0 - 10, 12, y1 - y0 + 20); g.fillStyle = rgba('#c8a49a', 0.25); g.fillRect(x + 16, y0 - 10, 2, y1 - y0 + 20); }
  for (let yy = y0 + 20, k = 0; yy < y1; yy += 54, k++) for (let x = x0 + 20 + (k % 2) * 23; x < x1; x += 46) { // rose sprigs
    const cx = x + r.gauss(0, 2), cy = yy + r.gauss(0, 2);
    g.fillStyle = rgba('#8a9a68', 0.55); for (const a of [-0.6, 0.6, 2.4]) { g.beginPath(); g.ellipse(cx + Math.cos(a) * 7, cy + 6 + Math.sin(a) * 4, 5, 2.4, a, 0, TAU); g.fill(); }
    g.fillStyle = rgba('#d47a80', 0.6); g.beginPath(); g.arc(cx, cy, 5.5, 0, TAU); g.fill();
    g.strokeStyle = rgba('#a8485a', 0.55); g.lineWidth = 1; g.beginPath(); g.arc(cx + 0.5, cy, 2.6, 0, 5); g.stroke();
  }
  for (let k = 0; k < 5; k++) pool(g, r.range(x0, x1), r.range(y0, y1), r.range(40, 110), r.range(30, 70), '#b08a60', 0.18); // old stains
  shadeEdge(g, sh, { color: '#7a5a40', alpha: 0.3, width: 30, dy: -8 });
  g.restore();
  // a corner curling away (the pale back of the paper) and the torn edge
  const cx = x1 - 10, cy = y0 + 12;
  const curl = smooth([[cx - 50, cy - 2], [cx - 8, cy + 4], [cx + 2, cy + 46], [cx - 22, cy + 20]]);
  wash(g, curl, { color: '#f4ead8', opacity: 0.96, seed: seed + 5, under: true, layers: 8 }); shadeEdge(g, curl, { color: '#8a6a4a', alpha: 0.35, width: 12, dx: 4, dy: 4 });
  ink(g, curl, { closed: true, width: 1.1, alpha: 0.6, seed: seed + 6 });
  ink(g, sh, { closed: true, width: 1.2, alpha: 0.5, gaps: 1, wobble: 0.8, seed: seed + 7 });
}
// ---- a postage stamp (perforated) with a little picture, pinned to the wall
function stamp(g, x, y, kind, seed) {
  const r = rng(seed), w = 64, h = 78, x0 = x - w / 2, y0 = y - h / 2, pts = [];
  const per = (ax, ay, bx, by) => { const L = Math.hypot(bx - ax, by - ay), n = Math.round(L / 7), nx = (by - ay) / L, ny = -(bx - ax) / L;
    for (let i = 0; i < n; i++) { const k = i / n; const d = i % 2 ? -1.8 : 0; pts.push([ax + (bx - ax) * k + nx * d, ay + (by - ay) * k + ny * d]); } };
  per(x0, y0, x0 + w, y0); per(x0 + w, y0, x0 + w, y0 + h); per(x0 + w, y0 + h, x0, y0 + h); per(x0, y0 + h, x0, y0);
  g.save(); g.translate(x, y); g.rotate(r.gauss(0, 0.04)); g.translate(-x, -y);
  pool(g, x + 5, y + 6, w * 0.6, h * 0.6, '#4a3020', 0.25);
  wash(g, pts, { color: '#f6f0e2', opacity: 0.98, seed, under: '#f8f2e6', bleed: 0.004, layers: 6, edge: 0.1 });
  const ix0 = x0 + 8, iy0 = y0 + 8, ix1 = x0 + w - 8, iy1 = y0 + h - 18, pic = R4(ix0, iy0, ix1, iy1);
  const sky = kind === 'mill' ? '#c8d8e0' : kind === 'ship' ? '#d8e0e4' : '#e8dcc8';
  wash(g, pic, { color: sky, opacity: 0.95, seed: seed + 1, under: true, layers: 6, bleed: 0.004 });
  g.save(); path(g, pic); g.clip();
  if (kind === 'ship') {
    wash(g, R4(ix0 - 4, iy1 - 18, ix1 + 4, iy1 + 4), { color: '#5a7aa0', opacity: 0.9, seed: seed + 2, layers: 6 });
    g.fillStyle = rgba('#7a4a30', 0.9); g.beginPath(); g.moveTo(x - 16, iy1 - 18); g.lineTo(x + 16, iy1 - 18); g.lineTo(x + 11, iy1 - 11); g.lineTo(x - 12, iy1 - 11); g.closePath(); g.fill();
    g.fillStyle = rgba('#fbf6ea', 0.95); g.beginPath(); g.moveTo(x - 1, iy1 - 20); g.lineTo(x - 1, iy0 + 8); g.lineTo(x - 15, iy1 - 21); g.closePath(); g.fill(); g.beginPath(); g.moveTo(x + 1, iy1 - 20); g.lineTo(x + 1, iy0 + 12); g.lineTo(x + 13, iy1 - 21); g.closePath(); g.fill();
    ink(g, [[x, iy1 - 18], [x, iy0 + 6]], { width: 0.9, alpha: 0.7, seed: seed + 3 });
  } else if (kind === 'rose') {
    g.fillStyle = rgba('#7a9060', 0.85); for (const [dx, dy, a] of [[-8, 10, -0.6], [9, 8, 0.6], [0, 18, 0]]) { g.beginPath(); g.ellipse(x + dx, y - 6 + dy, 8, 4, a, 0, TAU); g.fill(); }
    g.fillStyle = rgba('#c8505a', 0.95); g.beginPath(); g.arc(x, y - 10, 11, 0, TAU); g.fill();
    g.strokeStyle = rgba('#7a2030', 0.7); g.lineWidth = 1; for (const rr of [6, 3]) { g.beginPath(); g.arc(x + 1, y - 10, rr, 0.5, 5.6); g.stroke(); }
  } else {
    wash(g, smooth([[ix0 - 6, iy1 + 4], [ix0 - 6, iy1 - 14], [x, iy1 - 24], [ix1 + 6, iy1 - 12], [ix1 + 6, iy1 + 4]]), { color: '#8aa068', opacity: 0.95, seed: seed + 2, layers: 6 });
    g.fillStyle = rgba('#8a6a4a', 0.95); g.fillRect(x - 4, iy1 - 40, 8, 20);
    g.strokeStyle = rgba('#5a3a2a', 0.85); g.lineWidth = 1.6; g.beginPath(); g.moveTo(x - 13, iy1 - 53); g.lineTo(x + 13, iy1 - 27); g.moveTo(x + 13, iy1 - 53); g.lineTo(x - 13, iy1 - 27); g.stroke();
  }
  g.restore();
  penLine(g, pic, { closed: true, sharp: true, w: 1.1, alpha: 0.7, seed: seed + 4 });
  g.fillStyle = rgba('#6a4a3a', 0.7); g.font = 'italic 10px Georgia, serif'; g.textAlign = 'center'; g.fillText(['½d', '1d', '2d'][seed % 3], x, y0 + h - 6);
  ink(g, pts, { closed: true, width: 0.8, alpha: 0.4, gaps: 1, seed: seed + 5 });
  // the pin
  g.fillStyle = rgba('#c84a3a', 0.95); g.beginPath(); g.arc(x, y0 + 4, 4, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,240,220,0.8)'; g.beginPath(); g.arc(x - 1.3, y0 + 2.6, 1.3, 0, TAU); g.fill();
  g.restore();
}
// ---- the old timbers: two studs and the beam above
function timber(g, shape, seed, ang, o = {}) {
  brushWash(g, densify(shape, 30), ['#7e5a3c', '#8a6646', '#6c4c32', '#9a7454'], { seed, count: 40, width: [10, 30], len: [200, 500], angle: () => ang, alpha: [0.2, 0.4], base: 0.92, under: true });
  grain(g, shape, '#3e2a1c', { seed: seed + 1, n: o.n ?? 60, ang, alpha: 0.35, wave: 4, knots: o.knots ?? 2, wid: [0.7, 1.8] });
  if (o.sdx || o.sdy) shadeEdge(g, shape, { color: '#2a1a10', alpha: 0.45, width: o.sw || 50, dx: o.sdx || 0, dy: o.sdy || 0 });
  penLine(g, shape, { closed: true, w: 2.4, alpha: 0.8, seed: seed + 2, sharp: shape.length <= 6 });
  const r = rng(seed + 3), b = bbox(shape);
  for (let k = 0; k < (o.nails ?? 3); k++) { // old square nails, rusty
    const x = r.range(b.x0 + 30, b.x1 - 30), y = r.range(b.y0 + 30, b.y1 - 30);
    pool(g, x + 3, y + 6, 12, 18, '#6a3a1a', 0.35);
    g.fillStyle = rgba('#3a2a22', 0.9); g.fillRect(x - 5, y - 5, 10, 10); g.fillStyle = rgba('#8a5a3a', 0.6); g.fillRect(x - 4, y - 4, 4, 4);
  }
}
// ---- the floor of wide old boards, in perspective
function floorBoards(g, seed) {
  const r = rng(seed), [vx, vy] = HOME.vp, yb = HOME.floorY, yf = H + MY + 4;
  const k = (yf - vy) / (yb - vy), xf = (xb) => vx + (xb - vx) * k;
  const cols = ['#a8835a', '#b08c62', '#9c784e', '#b89468', '#a07c56'];
  let xb = vx - 230 * 0.5 - 230 * 6;
  while (xf(xb) < W + M + 40) {
    const bw = r.range(210, 250), x2 = xb + bw;
    const board = [[xb, yb], [x2, yb], [xf(x2), yf], [xf(xb), yf]];
    const col = r.pick(cols);
    wash(g, board, { color: col, opacity: 0.95, seed: seed + Math.round(xb), under: true, bleed: 0.004, layers: 10, edge: 0.2 });
    blooms(g, board, [tint(col, 0.2), shade(col, 0.15), '#c8a070'], { n: 5, seed: seed + Math.round(xb) + 1, alpha: 0.3, size: 0.25 });
    // grain toward the vanishing point
    g.save(); path(g, board); g.clip(); g.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const u = r(), ph = r() * TAU, amp = r.range(1, 4);
      g.strokeStyle = rgba(shade(col, 0.55), r.range(0.12, 0.35)); g.lineWidth = r.range(0.6, 1.6);
      const v0 = r.range(0, 0.5), v1 = r.range(0.6, 1);
      g.beginPath();
      for (let v = v0, f = true; v <= v1; v += 0.03, f = false) {
        const y = yb + (yf - yb) * v, s = (y - vy) / (yb - vy), x = vx + (lerp(xb, x2, u) - vx) * s + Math.sin(v * 9 + ph) * amp * s;
        if (f) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
    // a butt joint with two nails, somewhere along the board
    if (r() < 0.6) { const v = r.range(0.15, 0.75), y = yb + (yf - yb) * v, s = (y - vy) / (yb - vy), xa = vx + (xb - vx) * s, xc = vx + (x2 - vx) * s;
      ink(g, [[xa, y], [xc, y + r.gauss(0, 1)]], { width: 2, alpha: 0.6, seed: seed + i3(xb) });
      for (const u of [0.25, 0.75]) { g.fillStyle = rgba('#3a2a20', 0.75); g.beginPath(); g.arc(lerp(xa, xc, u), y + 10 * s, 3.5 * s, 0, TAU); g.fill(); } }
    g.restore();
    // the dark gap between boards
    penLine(g, [[xb, yb], [xf(xb), yf]], { w: 3.2, alpha: 0.75, color: '#3a2618', weight: (t) => 0.5 + t, seed: seed + i3(xb) + 2 });
    xb = x2;
  }
  // dust and crumbs and seeds in the cracks
  speckle(g, { x0: -M, y0: yb, x1: W + M, y1: yf }, { color: '#6a4a30', count: 700, size: 2.2, alpha: 0.4, seed: seed + 9 });
  speckle(g, { x0: -M, y0: yb, x1: W + M, y1: yf }, { color: '#e8d0a0', count: 260, size: 2, alpha: 0.5, seed: seed + 10 });
}
const i3 = (x) => Math.abs(Math.round(x * 7)) % 997;
// ---- the crocheted doily on the floor (the council's carpet)
function doily(g, seed) {
  const { x, y, rx, ry } = HOME.DOILY, r = rng(seed), n = 220;
  const edge = []; for (let i = 0; i < n; i++) { const a = (i / n) * TAU, sc = 1 - 0.035 * Math.pow(Math.abs(Math.sin(a * 18)), 0.6); edge.push([x + Math.cos(a) * rx * sc, y + Math.sin(a) * ry * sc]); }
  g.save(); g.globalCompositeOperation = 'multiply'; pool(g, x, y + 8, rx * 1.05, ry * 1.2, '#7a5a40', 0.25); g.restore();
  wash(g, edge, { color: '#efe4cc', opacity: 0.93, seed, bleed: 0.006, layers: 12, edge: 0.25 });
  blooms(g, edge, ['#e8dcc0', '#f4ecd8', '#e0d0b0'], { n: 7, seed: seed + 1, alpha: 0.3 });
  // rings of lace holes (the floor showing through), and the thread rings
  const hole = (a, k, s) => { const hx = x + Math.cos(a) * rx * k, hy = y + Math.sin(a) * ry * k; g.beginPath(); g.ellipse(hx, hy, s, s * ry / rx * 1.6, 0, 0, TAU); g.fill(); };
  g.fillStyle = rgba('#8a6a48', 0.55);
  for (const [k, m, s] of [[0.92, 36, 9], [0.78, 28, 11], [0.62, 22, 10], [0.46, 16, 9], [0.3, 10, 8]]) for (let i = 0; i < m; i++) hole((i + (k * 10) % 1 * 0.5) / m * TAU, k, s * r.range(0.85, 1.1));
  g.strokeStyle = rgba('#b8a888', 0.55); g.lineWidth = 1.2;
  for (const k of [0.98, 0.85, 0.7, 0.54, 0.38, 0.22]) { g.beginPath(); g.ellipse(x, y, rx * k, ry * k, 0, 0, TAU); g.stroke(); }
  for (let i = 0; i < 36; i++) { const a = (i / 36) * TAU; g.beginPath(); g.moveTo(x + Math.cos(a) * rx * 0.22, y + Math.sin(a) * ry * 0.22); g.lineTo(x + Math.cos(a) * rx * 0.85, y + Math.sin(a) * ry * 0.85); g.stroke(); }
  ink(g, edge.filter((_, i) => i % 2 === 0), { closed: true, width: 1, alpha: 0.4, gaps: 1, wobble: 0.6, seed: seed + 2 });
}
// ---- the little door to the kitchen: an arched hole in the bricks, a door made of a cigar-box lid, ajar
const doorArch = (x, y, w, h, n = 14) => { const p = [[x - w / 2, y]]; for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; p.push([x + Math.cos(a) * w / 2, y - h + w / 2 + Math.sin(a) * w / 2]); } p.push([x + w / 2, y]); return p; };
function mouseDoorHome(g, seed) {
  const { x, y, w, h } = HOME.DOOR, r = rng(seed);
  const surround = doorArch(x, y + 2, w + 34, h + 18), hole = doorArch(x, y, w, h);
  // a ring of small split twigs round the arch
  wash(g, surround, { color: '#8a6440', opacity: 0.96, seed, under: true, layers: 10 });
  grain(g, surround, '#3e2a1c', { seed: seed + 1, n: 30, ang: Math.PI / 2, alpha: 0.35 });
  penLine(g, surround, { closed: true, w: 2, alpha: 0.8, seed: seed + 2 });
  wash(g, hole, { color: '#2a1c16', opacity: 0.98, seed: seed + 3, under: true, layers: 10 });
  glaze(g, hole, x + 20, y - h * 0.45, w * 0.4, h * 0.5, '#4a3226', 0.6);    // the passage going away
  // the door (hinged on the left, opened inward: narrower, its far edge set back)
  const dx0 = x - w / 2 + 3, dx1 = x + w / 2 - 34, top = (xx) => { const u = (xx - (x - w / 2)) / w; return y - h + w / 2 - Math.sqrt(Math.max(0, 1 - (2 * u - 1) ** 2)) * w / 2; };
  const door = []; door.push([dx0, y - 1]); for (let i = 0; i <= 10; i++) { const xx = lerp(dx0, dx1, i / 10); door.push([xx, top(xx) + 4 + i * 1.2]); } door.push([dx1, y - 6]);
  wash(g, door, { color: '#a8784a', opacity: 0.97, seed: seed + 4, under: true, layers: 12 });
  blooms(g, door, ['#b8885a', '#986a40'], { n: 4, seed: seed + 5, alpha: 0.35 });
  g.save(); path(g, door); g.clip();
  for (let k = 1; k < 3; k++) penLine(g, [[lerp(dx0, dx1, k / 3), y - h], [lerp(dx0, dx1, k / 3), y]], { w: 1.2, alpha: 0.55, seed: seed + 10 + k });
  grain(g, door, '#4a2e1c', { seed: seed + 6, n: 24, ang: Math.PI / 2, alpha: 0.3 });
  // a faded label from the cigar box
  wash(g, ellipse(x - 12, y - h * 0.5, 22, 15, 20), { color: '#e8d4a0', opacity: 0.8, seed: seed + 7, layers: 6 });
  g.strokeStyle = rgba('#b8503a', 0.6); g.lineWidth = 1.2; g.beginPath(); g.ellipse(x - 12, y - h * 0.5, 18, 11, 0, 0, TAU); g.stroke();
  g.restore();
  shadeEdge(g, door, { color: '#3a2214', alpha: 0.45, width: 20, dx: -10 });
  penLine(g, door, { closed: true, w: 1.8, alpha: 0.85, seed: seed + 8 });
  // a bead knob and two leather hinges
  g.fillStyle = rgba('#4a7aa0', 0.95); g.beginPath(); g.arc(dx1 - 12, y - h * 0.38, 6, 0, TAU); g.fill(); g.fillStyle = 'rgba(240,248,255,0.8)'; g.beginPath(); g.arc(dx1 - 14, y - h * 0.38 - 2, 2, 0, TAU); g.fill();
  for (const hy of [y - h * 0.72, y - 30]) { g.fillStyle = rgba('#5a3a26', 0.9); g.fillRect(dx0 - 8, hy - 5, 20, 10); }
  // a stone step
  const step = smooth([[x - w / 2 - 10, y + 2], [x + w / 2 + 10, y + 2], [x + w / 2 + 16, y + 12], [x - w / 2 - 16, y + 12]]);
  thing(g, step, '#b4a690', { seed: seed + 9, line: 1.2 });
}
// ---- the shelf (a piece of an old wooden ruler on two nails) with acorn cups, a pencil stub and a needle
function shelf(g, seed) {
  const { x0, x1, y } = HOME.SHELF, r = rng(seed);
  for (const nx of [x0 + 40, x1 - 40]) { pool(g, nx, y + 14, 10, 14, '#2a1a10', 0.35); }
  // acorn cups
  for (const [ax, s] of [[268, 1], [318, 0.85]]) {
    const cup = smooth([[ax - 16 * s, y - 14 * s], [ax + 16 * s, y - 14 * s], [ax + 13 * s, y - 3], [ax, y], [ax - 13 * s, y - 3]]);
    thing(g, cup, '#9a7a48', { seed: seed + ax, line: 1.1 });
    g.save(); path(g, cup); g.clip(); g.strokeStyle = rgba('#5a4026', 0.6); g.lineWidth = 0.9; for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(ax - 16 * s, y - 12 * s + k * 2.6); g.lineTo(ax + 16 * s, y - 12 * s + k * 2.6 + 1); g.stroke(); } g.restore();
    wash(g, ellipse(ax, y - 14 * s, 16 * s, 4 * s, 16), { color: '#4a3020', opacity: 0.9, seed: seed + ax + 1, layers: 6 });
  }
  // the pencil stub
  const pen = R4(372, y - 13, 452, y - 1);
  thing(g, pen, '#3e6a52', { seed: seed + 3, line: 1.1, hi: [410, y - 10, 40, 3] });
  thing(g, [[452, y - 13], [474, y - 7], [452, y - 1]], '#e0c090', { seed: seed + 4, line: 1 });
  g.fillStyle = rgba('#3a3030', 0.9); g.beginPath(); g.moveTo(468, y - 9); g.lineTo(476, y - 7); g.lineTo(468, y - 5); g.fill();
  // a needle stuck into a little pin cushion (a felt ball), trailing blue thread
  const pc = ellipse(508, y - 13, 18, 14, 20); thing(g, pc, '#c05050', { seed: seed + 5, line: 1.1, hi: [502, y - 18, 7, 4] });
  ink(g, [[506, y - 24], [516, y - 58]], { color: '#8a8a94', width: 1.6, alpha: 0.9, seed: seed + 6 });
  ink(g, [[516, y - 56], [528, y - 40], [522, y - 20], [540, y + 6], [536, y + 40]], { color: '#4a6aa0', width: 1.2, alpha: 0.8, seed: seed + 7 });
  // the ruler
  const rul = handBox(x0, y, x1, y + 22, r, 0.6, 4);
  wood(g, rul, ['#d8b878', '#c8a868', '#e4c890'], { seed: seed + 8, n: 10, line: 1.6, sdy: -6, sw: 10 });
  for (let k = 0; k <= 34; k++) { const xx = x0 + 6 + k * 10; ink(g, [[xx, y + 1], [xx, y + (k % 5 ? 5 : 10)]], { width: 0.8, alpha: 0.6, wobble: 0.1, seed: seed + 20 + k }); }
  g.fillStyle = rgba('#4a3226', 0.65); g.font = '9px Georgia, serif'; g.textAlign = 'center';
  for (let k = 1; k < 7; k++) g.fillText(String(k), x0 + 6 + k * 50, y + 19);
}
// ---- the matchstick ladder, its rungs tied on with red thread
function ladder(g, seed) {
  const { foot, top } = HOME.LADDER, r = rng(seed), w = 54;
  const railL = [[foot[0] - w / 2, foot[1]], [top[0] - w / 2 + 4, top[1] - 16]], railR = [[foot[0] + w / 2, foot[1] - 2], [top[0] + w / 2 - 4, top[1] - 18]];
  pool(g, foot[0] + 10, foot[1] + 2, 50, 8, '#2a1a10', 0.35);
  const P = (rail, t) => [lerp(rail[0][0], rail[1][0], t), lerp(rail[0][1], rail[1][1], t)];
  for (let k = 1; k < 9; k++) { // rungs: matchsticks, the red heads sticking out on the left
    const t = k / 9.2, a = P(railL, t), b = P(railR, t), rung = ribbon([[a[0] - 10, a[1] + 1], [b[0] + 6, b[1]]], 6, 6);
    thing(g, rung, '#e0c28c', { seed: seed + k, line: 1, sdy: -2, sw: 4 });
    thing(g, ellipse(a[0] - 12, a[1] + 1, 6, 4.4, 12), k % 3 ? '#b8443a' : '#6a3a30', { seed: seed + 30 + k, line: 0.9 });
    for (const p of [a, b]) { g.strokeStyle = rgba('#b03a32', 0.85); g.lineWidth = 1.3; g.beginPath(); g.moveTo(p[0] - 5, p[1] - 4); g.lineTo(p[0] + 5, p[1] + 4); g.moveTo(p[0] - 5, p[1] + 4); g.lineTo(p[0] + 5, p[1] - 4); g.stroke(); }
  }
  for (const rail of [railL, railR]) thing(g, ribbon(rail, 9, 8), '#c8a470', { seed: seed + 50 + rail[0][0], line: 1.3, sdx: 3, sw: 5 });
}
// ---- the cotton reel (red thread), with a paper label on its top
function reel(g, seed) {
  const { x, y, rx, ry } = HOME.REEL, H1 = 150, th = 14, core = 50, sd = awayX(x) * 12;
  pool(g, x, y + 3, rx * 1.25, ry * 1.6, '#2a1a10', 0.4);
  const bot = cyl(x, y, y - th, rx, ry), mid = cyl(x, y - th, y - H1 + th, core, core * ry / rx), topF = cyl(x, y - H1 + th, y - H1, rx, ry);
  const woodC = ['#d4ac74', '#c49a62', '#e0bc88'];
  thing(g, bot.side, woodC[0], { seed: seed + 1, sdx: sd, sw: 20, line: 1.5 });
  thing(g, bot.top, tint(woodC[0], 0.1), { seed: seed + 2, line: 1.1 });
  // the thread, wound round and round
  thing(g, mid.side, '#b8403a', { seed: seed + 3, blooms: ['#c85048', '#a03430'], sdx: sd, sw: 26, sa: 0.5, line: 0, hi: [x - sd * 1.2, y - H1 / 2, 14, 50], hiCol: '#f0a090', hiA: 0.45 });
  g.save(); path(g, mid.side); g.clip(); g.lineWidth = 0.8;
  for (let yy = y - th - 2; yy > y - H1 + th; yy -= 2.6) { g.strokeStyle = rgba(rng(yy | 0)() < 0.5 ? '#7a2420' : '#e07870', 0.35); g.beginPath(); const p = half(x, yy, core, core * ry / rx * 0.9, true, 12); g.moveTo(...p[0]); for (const q of p) g.lineTo(...q); g.stroke(); }
  g.restore();
  penLine(g, mid.side, { closed: true, w: 1.4, alpha: 0.7, seed: seed + 4 });
  thing(g, topF.side, woodC[0], { seed: seed + 5, sdx: sd, sw: 20, line: 1.5 });
  thing(g, topF.top, woodC[2], { seed: seed + 6, line: 1.6, hi: [x + 10, y - H1 - 4, rx * 0.6, ry * 0.6] });
  // turned rings, the paper label and the hole
  g.strokeStyle = rgba('#8a6a40', 0.5); g.lineWidth = 0.9; for (const k of [0.92, 0.8]) { g.beginPath(); g.ellipse(x, y - H1, rx * k, ry * k, 0, 0, TAU); g.stroke(); }
  wash(g, ellipse(x, y - H1, rx * 0.62, ry * 0.62, 30), { color: '#f2e8cc', opacity: 0.95, seed: seed + 7, layers: 8 });
  g.strokeStyle = rgba('#b8403a', 0.7); g.lineWidth = 1.4; g.beginPath(); g.ellipse(x, y - H1, rx * 0.56, ry * 0.56, 0, 0, TAU); g.stroke();
  g.strokeStyle = rgba('#4a3a30', 0.5); g.lineWidth = 0.8; for (let k = 0; k < 10; k++) { const a = Math.PI * (0.15 + k * 0.07); g.beginPath(); g.moveTo(x + Math.cos(a) * rx * 0.42, y - H1 - Math.sin(a) * ry * 0.42); g.lineTo(x + Math.cos(a + 0.04) * rx * 0.42, y - H1 - Math.sin(a + 0.04) * ry * 0.42); g.stroke(); }
  wash(g, ellipse(x, y - H1, 10, 3, 14), { color: '#2a1a12', opacity: 0.95, seed: seed + 8, layers: 6 });
  // the loose end of the thread, trailing down and across the floor
  ink(g, [[x + core - 6, y - 60], [x + core + 6, y - 30], [x + core + 20, y + 4], [x + core + 70, y + 20], [x + core + 110, y + 14], [x + core + 150, y + 26]], { color: '#a8302c', width: 1.6, alpha: 0.85, seed: seed + 9 });
}
// ---- the button table: a big wooden coat button on a cork, a bottle-cap plate of cheese and seed cake, thimble cups
function buttonTable(g, seed) {
  const { x, y, rx } = HOME.TABLE, ry = 21, r = rng(seed), sd = awayX(x) * 10;
  pool(g, x, y + 3, rx * 0.8, 12, '#2a1a10', 0.4);
  const leg = cyl(x, y, y - 54, 32, 8);
  thing(g, leg.side, '#c89a64', { seed: seed + 1, sdx: sd, sw: 16, line: 1.4 });
  speckle(g, bbox(leg.side), { color: '#7a5030', count: 60, size: 2.4, alpha: 0.6, seed: seed + 2 });
  const btn = cyl(x, y - 54, y - 66, rx, ry);
  thing(g, btn.side, '#7a4a2c', { seed: seed + 3, sdx: sd, sw: 20, line: 1.5 });
  thing(g, btn.top, '#9a623c', { seed: seed + 4, line: 1.6, blooms: ['#a87048', '#8a5432'], hi: [x + 14, y - 70, rx * 0.5, ry * 0.4] });
  g.strokeStyle = rgba('#4a2a18', 0.55); g.lineWidth = 2; g.beginPath(); g.ellipse(x, y - 66, rx * 0.78, ry * 0.78, 0, 0, TAU); g.stroke();
  g.strokeStyle = rgba('#d8a070', 0.4); g.lineWidth = 1.4; g.beginPath(); g.ellipse(x, y - 65, rx * 0.74, ry * 0.74, 0, 0.2, 2.6); g.stroke();
  for (const [hx, hy] of [[-12, -3], [12, -3], [-12, 5], [12, 5]]) { g.fillStyle = rgba('#2a1810', 0.85); g.beginPath(); g.ellipse(x + 40 + hx * 0.8, y - 66 + hy * 0.8, 5, 2.4, 0, 0, TAU); g.fill(); }
  // the bottle-cap plate (crimped, red paint worn to the tin) with a crumb of cheese and a slice of seed cake
  const px = x - 30, py = y - 70, prx = 40, pry = 10;
  const cap = cyl(px, py + 2, py - 6, prx, pry), crimp = [];
  for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI; const k = i % 2 ? 1.04 : 0.98; crimp.push([px + prx * k * Math.cos(a), py + 2 + pry * k * Math.sin(a)]); }
  for (let i = 40; i >= 0; i--) { const a = (i / 40) * Math.PI; crimp.push([px + prx * Math.cos(a), py - 6 + pry * Math.sin(a)]); }
  thing(g, crimp, '#b84a3a', { seed: seed + 5, line: 1.2, sdx: sd * 0.6, sw: 8 });
  thing(g, cap.top, '#d8c8a0', { seed: seed + 6, line: 1.2, hi: [px + 10, py - 8, 16, 4], hiCol: '#fff4d8' });
  g.strokeStyle = rgba('#c8a050', 0.7); g.lineWidth = 1.2; g.beginPath(); g.ellipse(px, py - 6, prx * 0.72, pry * 0.72, 0, 0, TAU); g.stroke();
  // seed cake: a wedge, brown crust, crumb with dark seeds
  const ck = [[px - 30, py - 8], [px - 4, py - 14], [px - 2, py - 30], [px - 28, py - 26]];
  thing(g, ck, '#c8945a', { seed: seed + 7, line: 1.2, blooms: ['#d8a868', '#b07a48'] });
  thing(g, [[px - 28, py - 26], [px - 2, py - 30], [px - 6, py - 34], [px - 30, py - 30]], '#8a5a34', { seed: seed + 8, line: 1 });
  for (let k = 0; k < 9; k++) { g.fillStyle = rgba('#3a2a20', 0.85); g.beginPath(); g.ellipse(px - 26 + r() * 22, py - 24 + r() * 14, 1.6, 0.9, r() * 3, 0, TAU); g.fill(); }
  // the crumb of cheese: a wedge with holes
  const ch = [[px + 2, py - 10], [px + 34, py - 12], [px + 30, py - 30], [px + 4, py - 22]];
  thing(g, ch, '#f0c850', { seed: seed + 9, line: 1.3, hi: [px + 12, py - 20, 10, 5], hiCol: '#fff2b0', sdy: 4, sw: 8 });
  thing(g, [[px + 4, py - 22], [px + 30, py - 30], [px + 26, py - 34]], '#f8dc78', { seed: seed + 10, line: 1 });
  for (const [hx, hy, hr] of [[12, -16, 3], [22, -20, 2.4], [26, -14, 1.8]]) { g.fillStyle = rgba('#c89a30', 0.85); g.beginPath(); g.ellipse(px + hx, py + hy, hr, hr * 0.8, 0, 0, TAU); g.fill(); }
  // thimble cups (one silver, one brass), open side up
  for (const [[tx, ty], col] of [[HOME.FOOD.cups[0], '#b8b8c4'], [HOME.FOOD.cups[1], '#d0a858']]) {
    const tb = cyl(tx, ty + 4, ty - 28, 13, 3.4, 16, 15);
    thing(g, tb.side, col, { seed: seed + tx, line: 1.2, sdx: sd * 0.5, sw: 7, hi: [tx - sd * 0.4, ty - 14, 3, 12], hiCol: '#ffffff', hiA: 0.6 });
    g.save(); path(g, tb.side); g.clip(); g.fillStyle = rgba(shade(col, 0.5), 0.55);
    for (let yy = ty - 22; yy < ty; yy += 4) for (let xx = tx - 14; xx < tx + 14; xx += 4) { g.beginPath(); g.arc(xx + ((yy / 4) % 2) * 2, yy, 0.8, 0, TAU); g.fill(); }
    g.restore();
    thing(g, tb.top, '#3a2a24', { seed: seed + tx + 1, line: 1.2 });
    wash(g, ellipse(tx, ty - 27, 11, 2.4, 14), { color: '#c8a070', opacity: 0.8, seed: seed + tx + 2, layers: 4 }); // a sip of something
  }
}
// ---- the cork stool with its felt cushion
function corkSeat(g, seed) {
  const { x, y, rx } = HOME.SEAT, ry = 9, sd = awayX(x) * 10, h = 80;
  pool(g, x, y + 3, rx * 1.4, 12, '#2a1a10', 0.4);
  const c = cyl(x, y, y - h, rx, ry);
  thing(g, c.side, '#c49a68', { seed: seed + 1, sdx: sd, sw: 22, sa: 0.5, line: 1.6, blooms: ['#d4aa78', '#a8804e', '#caa070'] });
  speckle(g, bbox(c.side), { color: '#5a3a20', count: 220, size: 2.2, alpha: 0.65, seed: seed + 2 });
  speckle(g, bbox(c.side), { color: '#f0d8a8', count: 60, size: 1.6, alpha: 0.5, seed: seed + 3 });
  thing(g, c.top, '#d0a674', { seed: seed + 4, line: 1.3 });
  // a felt cushion, tufted with one button
  const cush = smooth([[x - rx - 3, y - h + 2], [x - rx - 1, y - h - 8], [x - 10, y - h - 13], [x + 14, y - h - 13], [x + rx + 1, y - h - 8], [x + rx + 4, y - h + 2], [x, y - h + 8]]);
  thing(g, cush, '#5e7e8c', { seed: seed + 5, line: 1.6, blooms: ['#6a8a98', '#4e6a78'], hi: [x - sd, y - h - 10, 18, 6], sdy: -4, sw: 8 });
  g.setLineDash([3, 3]); g.strokeStyle = rgba('#f0d8b0', 0.7); g.lineWidth = 1; g.beginPath(); g.ellipse(x, y - h - 6, rx * 0.8, 7, 0, 0, TAU); g.stroke(); g.setLineDash([]);
  g.fillStyle = rgba('#e8c868', 0.95); g.beginPath(); g.ellipse(x, y - h - 8, 4, 2.4, 0, 0, TAU); g.fill();
}
// ---- the matchbox chest of drawers (three boxes, labels faded), the middle drawer pulled out
function matchChest(g, seed) {
  const { x0, x1, y, top } = HOME.CHEST, bh = (y - top - 18) / 3, r = rng(seed);
  pool(g, (x0 + x1) / 2, y + 3, (x1 - x0) * 0.6, 12, '#2a1a10', 0.4);
  const labels = [['#2a4a7a', '#e8c860'], ['#8a2a2a', '#f0e0b0'], ['#3a6a4a', '#e8d8a8']];
  for (let k = 0; k < 3; k++) {
    const yb = y - k * bh, yt = yb - bh + 2, front = handBox(x0, yt, x1, yb, r, 0.6);
    thing(g, front, '#d8c49a', { seed: seed + k * 10, line: 1.6, sharp: true, sdy: -6, sw: 12, blooms: ['#e0d0a8', '#c8b088'] });
    // the label: a coloured panel with a pale border and a little picture (a star, a bird, a ship)
    const [lc, lc2] = labels[k], lb = R4(x0 + 18, yt + 9, x1 - 18, yb - 9);
    wash(g, lb, { color: lc, opacity: 0.85, seed: seed + k * 10 + 1, layers: 8, under: true });
    g.strokeStyle = rgba(lc2, 0.85); g.lineWidth = 1.6; g.strokeRect(x0 + 22, yt + 13, x1 - x0 - 44, bh - 28);
    const cx = (x0 + x1) / 2, cy = (yt + yb) / 2;
    g.fillStyle = rgba(lc2, 0.9);
    if (k === 0) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 4.5 : 11; g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } g.closePath(); g.fill(); }
    else if (k === 1) { g.beginPath(); g.ellipse(cx, cy, 11, 6, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(cx + 11, cy - 4, 4.5, 0, TAU); g.fill(); g.beginPath(); g.moveTo(cx - 9, cy); g.lineTo(cx - 20, cy - 6); g.lineTo(cx - 18, cy + 3); g.fill(); }
    else { g.beginPath(); g.moveTo(cx - 16, cy + 3); g.lineTo(cx + 16, cy + 3); g.lineTo(cx + 11, cy + 9); g.lineTo(cx - 11, cy + 9); g.closePath(); g.fill(); g.beginPath(); g.moveTo(cx, cy + 2); g.lineTo(cx, cy - 12); g.lineTo(cx + 10, cy + 1); g.closePath(); g.fill(); }
    for (let i = 0; i < 6; i++) { g.fillRect(x0 + 30 + i * 6, yb - 17, 3, 1.4); g.fillRect(x1 - 66 + i * 6, yb - 17, 3, 1.4); } // tiny lettering
    ink(g, lb, { closed: true, width: 1, alpha: 0.5, seed: seed + k * 10 + 2 });
  }
  // the top: a little lid seen from above
  const lid = [[x0, top + 18], [x1, top + 18], [x1 - 10, top], [x0 + 10, top]];
  thing(g, lid, '#e4d4ac', { seed: seed + 40, line: 1.5, sharp: true, hi: [(x0 + x1) / 2, top + 8, 50, 6] });
  // the middle drawer pulled out a little: the tray's front, and inside a tuft of wool and two buttons
  const my = y - bh, mt = my - bh + 2;
  const inside = [[x0 + 8, mt + 2], [x1 - 8, mt + 2], [x1 - 4, mt + 14], [x0 + 4, mt + 14]];
  thing(g, inside, '#4a3426', { seed: seed + 41, line: 1 });
  wool(g, x0 + 60, mt + 2, 34, 11, ['#e8e0d0', '#c8d0e0', '#f0e6d4'], seed + 42, { n: 30, s: 0.6 });
  for (const [bx, bc] of [[x1 - 50, '#4a7aa0'], [x1 - 30, '#c8a050']]) { thing(g, ellipse(bx, mt + 6, 9, 4, 14), bc, { seed: seed + bx, line: 1 }); }
  const tray = handBox(x0 + 4, mt + 12, x1 - 4, my + 6, r, 0.5);
  thing(g, tray, '#cdb88c', { seed: seed + 43, line: 1.7, sharp: true, sdy: -5, sw: 10 });
  // bead knobs
  for (let k = 0; k < 3; k++) { const yb = y - k * bh, cy = k === 1 ? (mt + 12 + my + 6) / 2 : yb - bh / 2 + 1, col = ['#c84a3a', '#4a7aa0', '#5a9a5a'][k];
    g.fillStyle = rgba('#2a1a12', 0.4); g.beginPath(); g.arc((x0 + x1) / 2 + 2, cy + 3, 7, 0, TAU); g.fill();
    g.fillStyle = rgba(col, 0.95); g.beginPath(); g.arc((x0 + x1) / 2, cy, 7, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,250,235,0.8)'; g.beginPath(); g.arc((x0 + x1) / 2 - 2.4, cy - 2.4, 2.2, 0, TAU); g.fill();
    g.strokeStyle = rgba(INKC, 0.7); g.lineWidth = 1; g.beginPath(); g.arc((x0 + x1) / 2, cy, 7, 0, TAU); g.stroke(); }
  // a red thread hanging out of the bottom drawer
  ink(g, [[x1 - 30, y - 10], [x1 - 24, y + 6], [x1 - 6, y + 14]], { color: '#a8302c', width: 1.3, alpha: 0.8, seed: seed + 44 });
}
// ---- nests: a teacup and walnut shells full of wool and feathers. back(g) and front(g) are painted separately so a
// sleeping mouse can lie between them.
// a roll of wool spilling over the front of a rim (angles a0..a1 of pi round the rim ellipse), a tuft hanging down
function woolRoll(g, x, rimY, rx, ry, seed, cols, a0 = 0.12, a1 = 0.88) {
  const r = rng(seed), top = [], bot = [];
  for (let i = 0; i <= 18; i++) { const a = Math.PI * lerp(a0, a1, i / 18), th = 9 + 5 * Math.sin(i * 1.3 + seed) + (Math.abs(i - 11) < 2 ? 10 : 0);
    const px = x + Math.cos(a) * rx, py = rimY + Math.sin(a) * ry; top.push([px + r.gauss(0, 1.5), py - 7 + r.gauss(0, 1.5)]); bot.push([px + r.gauss(0, 2), py + th]); }
  const sh = smooth(top.concat(bot.reverse()), true, 3);
  wash(g, sh, { color: cols[0], opacity: 0.95, seed, under: true, bleed: 0.03, layers: 10, edge: 0.12 });
  blooms(g, sh, cols, { n: 5, seed: seed + 1, alpha: 0.35, size: 0.25 });
  g.save(); path(g, sh); g.clip(); g.lineCap = 'round';
  const b = bbox(sh);
  for (let i = 0; i < 40; i++) { const px = r.range(b.x0, b.x1), py = r.range(b.y0, b.y1), a = r() * TAU, L = r.range(6, 14);
    g.strokeStyle = rgba(i % 4 ? tint(r.pick(cols), 0.5) : shade(r.pick(cols), 0.25), r.range(0.25, 0.55)); g.lineWidth = r.range(0.8, 1.5);
    g.beginPath(); g.moveTo(px, py); g.quadraticCurveTo(px + Math.cos(a) * L, py + Math.sin(a) * L * 0.5, px + Math.cos(a + 1.5) * L * 0.6, py + Math.sin(a + 1.5) * L * 0.4); g.stroke(); }
  g.restore();
  shadeEdge(g, sh, { color: shade(cols[0], 0.45), alpha: 0.3, width: 10, dy: -4 });
  ink(g, sh.filter((_, i) => i % 3 === 0), { closed: true, width: 0.9, alpha: 0.35, gaps: 1.6, wobble: 1, seed: seed + 2 });
  for (let i = 0; i < 9; i++) { const p = sh[Math.floor(r() * sh.length)], a = r() * TAU; ink(g, [p, [p[0] + Math.cos(a) * 8, p[1] + Math.sin(a) * 5], [p[0] + Math.cos(a + 1) * 12, p[1] + Math.sin(a + 1) * 7]], { color: shade(cols[0], 0.2), width: 0.8, alpha: 0.45, seed: seed + 10 + i }); }
}
const WOOL = ['#f4e8d2', '#f0d8cc', '#e8e0d4', '#f6ecd8'];
// a little patchwork quilt turned down over the front of a nest's rim (a sleeping mouse is tucked in under it)
const PATCH = ['#c87a6a', '#7a9ab8', '#ecdcb4', '#9aae7a', '#d8a850', '#b88aa8', '#e8c8b8'];
function quilt(g, x, rimY, rx, ry, seed, a0 = 0.08, a1 = 0.92, drop = 30) {
  const r = rng(seed), top = [], bot = [];
  // top: the fold, straight across the opening (lying on the wool); bottom: lapping a little over the front rim
  for (let i = 0; i <= 20; i++) { const u = i / 20, a = Math.PI * lerp(a1, a0, u); const px = x + Math.cos(a) * rx * 1.03, py = rimY + Math.sin(a) * ry;
    top.push([px, rimY - 8 - Math.pow(Math.sin(u * Math.PI), 0.7) * 12 + Math.sin(u * 7 + seed) * 1.5]); bot.push([px + Math.sin(u * 11) * 2, py + drop * (0.6 + 0.4 * Math.sin(u * Math.PI)) + Math.sin(u * 9 + seed) * 3]); }
  const sh = smooth(top.concat(bot.reverse()), true, 3), b = bbox(sh);
  wash(g, sh, { color: PATCH[2], opacity: 0.97, seed, under: true, layers: 8, bleed: 0.01 });
  g.save(); path(g, sh); g.clip();
  const s = 17;
  for (let yy = b.y0 + 9, row = 0; yy < b.y1; yy += s, row++) for (let xx = b.x0 - (row % 2) * s * 0.5; xx < b.x1; xx += s) {
    const c = r.pick(PATCH); g.fillStyle = rgba(c, 0.85); g.fillRect(xx + r.gauss(0, 0.6), yy + r.gauss(0, 0.6), s - 0.5, s - 0.5);
    if (r() < 0.4) { g.fillStyle = rgba(tint(c, 0.6), 0.6); for (let q = 0; q < 3; q++) { g.beginPath(); g.arc(xx + 4 + q * 5, yy + 5 + (q % 2) * 6, 1.4, 0, TAU); g.fill(); } } // sprigged print
  }
  g.setLineDash([2.5, 2.5]); g.strokeStyle = rgba('#fbf2e0', 0.7); g.lineWidth = 0.9;
  for (let yy = b.y0 + 9; yy < b.y1; yy += s) { g.beginPath(); g.moveTo(b.x0, yy); g.lineTo(b.x1, yy); g.stroke(); }
  g.setLineDash([]);
  // the turned-down sheet along the top, and soft folds
  const band = top.map(([px, py]) => [px, py + 9]); g.strokeStyle = rgba('#f8f2e6', 0.95); g.lineWidth = 9; g.lineCap = 'round'; g.beginPath(); band.forEach((p, i) => (i ? g.lineTo(...p) : g.moveTo(...p))); g.stroke();
  g.restore();
  shadeEdge(g, sh, { color: '#5a3a30', alpha: 0.4, width: 14, dy: -7 });
  for (let k = 0; k < 4; k++) { const fx = lerp(b.x0, b.x1, 0.2 + k * 0.2) + r.gauss(0, 5); glaze(g, sh, fx, b.y1 - 6, 5, drop * 0.6, '#5a3a30', 0.3); }
  penLine(g, sh, { closed: true, w: 1.6, alpha: 0.75, seed: seed + 1 });
  penLine(g, top.map(([px, py]) => [px, py + 13]), { w: 1, alpha: 0.4, seed: seed + 2 });
}
// a pillow (ticking stripes) for a sleeping head
function pillow(g, x, y, w, seed) {
  const sh = smooth([[x - w, y + 2], [x - w * 0.8, y - w * 0.42], [x, y - w * 0.5], [x + w * 0.8, y - w * 0.42], [x + w, y + 2], [x + w * 0.6, y + w * 0.3], [x - w * 0.6, y + w * 0.3]]);
  thing(g, sh, '#f6f0e4', { seed, line: 1.3, sdy: -5, sw: 9, sa: 0.3, hi: [x - w * 0.2, y - w * 0.2, w * 0.4, w * 0.15], hiCol: '#ffffff' });
  g.save(); path(g, sh); g.clip(); g.strokeStyle = rgba('#8aa0c0', 0.5); g.lineWidth = 1.4; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(x + k * w * 0.25, y - w); g.lineTo(x + k * w * 0.25 + 4, y + w); g.stroke(); } g.restore();
}
function teacupNest(g, n, part, seed) {
  const { x, y } = n, rimY = y - 118, rx = 84, ry = 21, sd = awayX(x) * 14;
  const body = smooth([[x - rx, rimY], [x - rx + 4, rimY + 46], [x - 52, rimY + 92], [x - 36, y - 10], [x + 36, y - 10], [x + 52, rimY + 92], [x + rx - 4, rimY + 46], [x + rx, rimY]], false, 6).concat(half(x, rimY, rx, ry, true, 20).reverse());
  if (part === 'back') {
    pool(g, x, y + 4, 140, 22, '#2a1a10', 0.4);
    // the saucer
    const sau = cyl(x, y + 4, y - 6, 120, 25);
    thing(g, sau.side, '#ece6dc', { seed: seed + 1, line: 1.4, sdx: sd, sw: 20 });
    thing(g, sau.top, '#f4f0e8', { seed: seed + 2, line: 1.4, hi: [x - sd * 3, y - 10, 50, 10], hiCol: '#ffffff' });
    g.strokeStyle = rgba('#5a7ab0', 0.6); g.lineWidth = 2; g.beginPath(); g.ellipse(x, y - 6, 104, 20, 0, 0, TAU); g.stroke();
    g.strokeStyle = rgba('#b8903a', 0.6); g.lineWidth = 1.4; g.beginPath(); g.ellipse(x, y - 6, 116, 23.5, 0, 0, TAU); g.stroke();
    // the handle (on the left)
    const hd = ribbon([[x - rx + 8, rimY + 16], [x - rx - 26, rimY + 10], [x - rx - 34, rimY + 40], [x - rx - 12, rimY + 64], [x - rx + 18, rimY + 74]], 14, 10);
    thing(g, hd, '#f0ebe0', { seed: seed + 3, line: 1.5, sdy: -4, sw: 6, sdx: 4 });
    penLine(g, [[x - rx - 18, rimY + 18], [x - rx - 24, rimY + 40], [x - rx - 8, rimY + 60]], { w: 2, color: '#b8903a', alpha: 0.7, seed: seed + 7 });
    // inside the cup (the back wall) and the wool mound
    const inn = ellipse(x, rimY, rx, ry, 40);
    thing(g, inn, '#c8c0b4', { seed: seed + 4, line: 1.5, sdy: 10, sw: 18, sa: 0.5 });
    wool(g, x, rimY - 6, rx * 0.94, 32, WOOL, seed + 5, { n: 60 });
    feather(g, x - 44, rimY - 26, -2.3, 58, '#f2ece0', seed + 6);
    pillow(g, n.pillow[0], n.pillow[1], 24, seed + 8);
  } else {
    // the outside of the cup: white china, a blue band, rose sprigs, a gold rim
    thing(g, body, '#f2ede2', { seed: seed + 10, line: 1.9, sdx: sd, sw: 34, sa: 0.38, hi: [x - sd * 3, rimY + 50, 26, 40], hiCol: '#ffffff' });
    g.save(); path(g, body); g.clip();
    g.strokeStyle = rgba('#5a7ab0', 0.7); g.lineWidth = 5; g.beginPath(); for (const [i, p] of half(x, rimY + 16, rx - 2, ry, true, 20).entries()) i ? g.lineTo(...p) : g.moveTo(...p); g.stroke();
    for (let k = 0; k < 4; k++) { const a = Math.PI * (0.18 + k * 0.21), cx = x + Math.cos(a) * rx * 0.8, cy = rimY + 56 + Math.sin(a) * 10;
      g.fillStyle = rgba('#8a9a68', 0.6); g.beginPath(); g.ellipse(cx - 7, cy + 4, 6, 2.6, -0.5, 0, TAU); g.fill(); g.beginPath(); g.ellipse(cx + 7, cy + 4, 6, 2.6, 0.5, 0, TAU); g.fill();
      g.fillStyle = rgba('#d06a78', 0.75); g.beginPath(); g.arc(cx, cy, 6.5, 0, TAU); g.fill(); g.strokeStyle = rgba('#9a3a4a', 0.6); g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, 3, 0.4, 5.6); g.stroke(); }
    g.restore();
    penLine(g, half(x, rimY, rx, ry, true, 24), { w: 3, color: '#b8903a', alpha: 0.85, seed: seed + 11 });
    quilt(g, x, rimY, rx, ry, seed + 20, 0.03, 0.97, 18);
    feather(g, x + 46, rimY + 4, 0.6, 46, '#e8dccc', seed + 30);
  }
}
function walnutNest(g, n, part, seed) {
  const { x, y } = n, rx = 88, ry = 24, rimY = y - 66, sd = awayX(x) * 14, r = rng(seed);
  const shell = []; // the outer bowl: the rim's front half, then down round the bumpy bottom
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI; shell.push([x + rx * Math.cos(a), rimY + ry * Math.sin(a)]); }
  const bottom = []; for (let i = 0; i <= 30; i++) { const a = Math.PI - (i / 30) * Math.PI; const k = 1 + 0.035 * Math.sin(i * 2.1 + seed); bottom.push([x + rx * Math.cos(a) * (1.03 + 0.05 * Math.sin(a)) * k, rimY + 4 + Math.pow(Math.sin(a), 0.8) * (y - rimY - 4) * k]); }
  const body = shell.concat(bottom.reverse());
  const nut = ['#9a6a3e', '#a8784a', '#86582f', '#b48454'];
  if (part === 'back') {
    pool(g, x, y + 2, rx * 1.2, 14, '#2a1a10', 0.45);
    const inn = ellipse(x, rimY, rx, ry, 40);
    thing(g, inn, '#5a3a22', { seed: seed + 1, line: 1.6, sdy: 10, sw: 18, sa: 0.5 });
    wool(g, x, rimY - 6, rx * 0.92, 28, WOOL, seed + 2, { n: 50 });
    feather(g, x + 30, rimY - 22, -0.9, 48, '#d8c4a8', seed + 3);
    pillow(g, n.pillow[0], n.pillow[1], 22, seed + 4);
  } else {
    thing(g, body, nut[0], { seed: seed + 10, line: 2, sdx: sd, sw: 34, sa: 0.5, blooms: nut.slice(1), hi: [x - sd * 2, rimY + 24, 30, 16], hiCol: '#d8a878' });
    // the walnut's wrinkles: grooves with a lit ridge beside each
    g.save(); path(g, body); g.clip();
    for (let k = 0; k < 14; k++) { const u = -0.92 + k * 0.14 + r.gauss(0, 0.03), x0 = x + u * rx, pts = [];
      for (let q = 0; q <= 6; q++) { const v = q / 6; pts.push([x0 + Math.sin(v * 5 + k) * 6 - u * v * 14, rimY + 10 + v * (y - rimY - 14) * (1 - Math.abs(u) * 0.3)]); }
      penLine(g, pts, { color: '#4a2e18', w: r.range(2, 3.4), alpha: 0.55, seed: seed + 20 + k });
      ink(g, pts.map(([px, py]) => [px + 4, py]), { color: '#d8a878', width: 1.4, alpha: 0.4, seed: seed + 40 + k }); }
    g.restore();
    penLine(g, half(x, rimY, rx, ry, true, 24), { w: 2.4, alpha: 0.8, seed: seed + 11 });
    quilt(g, x, rimY, rx, ry, seed + 30, 0.04, 0.96, 12);
  }
}
function paintNest(g, n, part, i) { (n.kind === 'teacup' ? teacupNest : walnutNest)(g, n, part, 900 + i * 50); }
// ---- hanging from the beam: dried seed-heads and rose hips on threads, and a cobweb in the corner
function hangings(g, seed) {
  const r = rng(seed);
  for (const [x, L] of [[1408, 150], [1452, 112], [640, 90]]) {
    ink(g, [[x, 88], [x + r.gauss(0, 2), 88 + L]], { color: '#6a5a48', width: 1, alpha: 0.7, seed: seed + x });
    const y = 88 + L;
    if (x === 640) { for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * 0.3; ink(g, [[x, y], [x + Math.cos(a) * 26, y + 30 + Math.sin(a) * 10]], { width: 0.9, alpha: 0.6, seed: seed + k }); g.fillStyle = rgba('#d8c088', 0.85); g.beginPath(); g.arc(x + Math.cos(a) * 26, y + 30 + Math.sin(a) * 10, 5, 0, TAU); g.fill(); } }
    else for (let k = 0; k < 5; k++) { const hx = x + r.gauss(0, 10), hy = y + r.range(0, 30); thing(g, ellipse(hx, hy, 7, 9, 14), k % 2 ? '#c0402e' : '#b04a2a', { seed: seed + x + k, line: 1, hi: [hx - 2, hy - 3, 2, 3], hiCol: '#ffd0b0' }); }
  }
  const cx = 1724, cy = 96, rs = [40, 80, 120, 160];
  for (let k = 0; k < 7; k++) { const a = Math.PI * (0.5 + k * 0.083); ink(g, [[cx, cy], [cx + Math.cos(a) * 190, cy + Math.sin(a) * 190]], { color: '#e8e0d0', width: 0.8, alpha: 0.45, seed: seed + 40 + k }); }
  for (const rr of rs) { const p = []; for (let k = 0; k < 7; k++) { const a = Math.PI * (0.5 + k * 0.083); p.push([cx + Math.cos(a) * rr * (k % 2 ? 0.92 : 1), cy + Math.sin(a) * rr * (k % 2 ? 0.92 : 1)]); } ink(g, p, { color: '#e8e0d0', width: 0.7, alpha: 0.4, seed: seed + rr }); }
}

function homeBackdrop(g) {
  g.fillStyle = '#6a4a34'; g.fillRect(-M, -MY, LW, LH);
  tm('h.bricks', () => brickWall(g, 120, 60, 1800, HOME.floorY + 6, 310));
  tm('h.paper', () => wallpaper(g, 548, 214, 1112, 548, 330));
  tm('h.stamps', () => HOME.STAMPS.forEach(([x, y], i) => stamp(g, x, y, ['ship', 'rose', 'mill'][i], 340 + i)));
  tm('h.door', () => mouseDoorHome(g, 360));
  // the beam above and the two old studs
  tm('h.timber', () => {
    timber(g, smooth([[-M - 10, -MY - 10], [W + M + 10, -MY - 10], [W + M + 10, 92], [1400, 98], [900, 94], [400, 100], [-M - 10, 96]], true, 2), 380, 0, { sdy: -30, sw: 60, nails: 4 });
    timber(g, [[-M - 10, 60], [196, 70], [188, HOME.floorY + 8], [-M - 10, HOME.floorY + 12]], 390, Math.PI / 2, { sdx: 40, sw: 70, knots: 2 });
    timber(g, [[1726, 70], [W + M + 10, 60], [W + M + 10, HOME.floorY + 12], [1734, HOME.floorY + 8]], 400, Math.PI / 2, { sdx: -40, sw: 70, knots: 1 });
  });
  tm('h.floor', () => floorBoards(g, 420));
  // where the wall meets the floor: a soft shadow
  g.save(); g.globalCompositeOperation = 'multiply';
  wash(g, [[-M, HOME.floorY - 8], [W + M, HOME.floorY - 8], [W + M, HOME.floorY + 16], [-M, HOME.floorY + 20]], { color: '#5a3a24', opacity: 0.5, seed: 430, bleed: 0.02, layers: 10 });
  g.restore();
  tm('h.doily', () => doily(g, 440));
}
function homeObjects(g) {
  tm('h.shelf', () => shelf(g, 500));
  tm('h.ladder', () => ladder(g, 520));
  tm('h.hang', () => hangings(g, 540));
  tm('h.chest', () => matchChest(g, 560));
  tm('h.nestsB', () => HOME.NESTS.forEach((n, i) => paintNest(g, n, 'back', i)));
  tm('h.table', () => buttonTable(g, 580));
  tm('h.seat', () => corkSeat(g, 600));
  tm('h.reel', () => reel(g, 620));
}
// the foreground: straw, a hazelnut and a feather in the left corner, a pin and a dropped seed in the right, a loose
// strand of wool dangling from the beam in front (all low, soft and quiet so the captions read)
function homeFront(g) {
  const r = rng(700);
  for (const [a, b, w] of [[[-120, 1010], [380, 940], 7], [[-60, 1060], [300, 1040], 6], [[1640, 1050], [2030, 990], 6]]) {
    const st = ribbon([a, [lerp(a[0], b[0], 0.5), lerp(a[1], b[1], 0.5) - 6], b], w, w * 0.8);
    thing(g, st, '#d8b868', { seed: 700 + a[0], line: 1.2, sdy: -2, sw: 4 });
    g.save(); path(g, st); g.clip(); g.strokeStyle = rgba('#a88838', 0.6); g.lineWidth = 0.8; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.restore();
  }
  // a hazelnut
  const hz = smooth([[96, 1016], [110, 976], [140, 966], [168, 980], [176, 1014], [140, 1032]]);
  thing(g, hz, '#9a6a3a', { seed: 710, line: 1.6, sdx: -10, sw: 14, hi: [130, 984, 14, 8], hiCol: '#d8a870' });
  thing(g, smooth([[112, 984], [138, 964], [166, 978], [140, 988]]), '#c8a878', { seed: 711, line: 1.1 });
  feather(g, 226, 1030, -0.35, 74, '#c8bca8', 712);
  // a pin
  ink(g, [[1720, 996], [1880, 966]], { color: '#9a9aa6', width: 2, alpha: 0.9, seed: 713 });
  g.fillStyle = rgba('#d8b040', 0.95); g.beginPath(); g.arc(1716, 997, 5, 0, TAU); g.fill();
  // the dangling wool strand (top left, in front)
  const strand = [[214, -MY], [222, 40], [212, 120], [226, 190], [218, 236]];
  penLine(g, strand, { color: '#8a9ab8', w: 4.2, alpha: 0.85, weight: () => 1, seed: 714 });
  ink(g, strand.map(([x, y]) => [x + 1.5, y]), { color: '#c8d0e0', width: 1.2, alpha: 0.6, seed: 715 });
  wool(g, 220, 244, 14, 12, ['#8a9ab8', '#a8b4cc'], 716, { n: 14, s: 0.5, flat: 1 });
}
const HOME_FRONT_BOXES = [{ x0: -M, y0: 920, x1: 420, y1: H + MY }, { x0: 1620, y0: 940, x1: W + M, y1: H + MY }, { x0: 180, y0: -MY, x1: 260, y1: 270 }];
const nestBox = (n) => (n.kind === 'teacup' ? { x0: n.x - 140, y0: n.y - 150, x1: n.x + 150, y1: n.y + 20 } : { x0: n.x - 110, y0: n.y - 90, x1: n.x + 110, y1: n.y + 16 });

// the candle-lit and dark light passes for the home
const HOME_CASTERS = () => [
  { x: HOME.REEL.x, y: HOME.REEL.y, w: 140, h: 150 }, { x: HOME.TABLE.x, y: HOME.TABLE.y, w: 120, h: 90 }, { x: HOME.SEAT.x, y: HOME.SEAT.y, w: 84, h: 78 },
  { x: (HOME.CHEST.x0 + HOME.CHEST.x1) / 2, y: HOME.CHEST.y, w: 176, h: 172 }, { x: HOME.LADDER.foot[0], y: HOME.LADDER.foot[1], w: 60, h: 120 },
  ...HOME.NESTS.map((n) => ({ x: n.x, y: n.y, w: n.kind === 'teacup' ? 190 : 170, h: n.kind === 'teacup' ? 130 : 80 })),
];
// The candle's shadow of a thing standing at (x, y) on the floor, w wide and h tall: long and soft, pointing away
// from the candle, fading toward the walls. Also used for the actors (k: strength, 0..1).
export function candleShadow(g, x, y, w, h, k = 1) {
  if (k <= 0) return;
  const dx = x - C0.x, dy = (y - C0.y) * 2.2, d = Math.hypot(dx, dy);
  if (d < 20) { pool(g, x, y, w * 0.7, w * 0.16, '#2a1a10', 0.35 * k); return; }
  const len = clamp(d * h / 220, h * 0.7, 380);
  floorShadow(g, x, y, dx, dy * 0.3, len, w, '#3a2418', 0.7 * k, 5);
  pool(g, x, y + 2, w * 0.6, w * 0.13, '#2a1a10', 0.35 * k);
}
function homeShadows(g, mood) {
  if (mood === 'candle') {
    for (const s of HOME_CASTERS()) candleShadow(g, s.x, s.y, s.w, s.h, 1);
    // the shadows of the things at the back climb the wall behind them, big and soft
    g.save(); g.globalCompositeOperation = 'multiply'; g.filter = `blur(${12 * RES}px)`;
    for (const s of HOME_CASTERS().filter((s) => s.y < 790)) {
      const lean = (s.x - C0.x) * 0.6, hh = s.h * 1.6 + 40;
      g.fillStyle = rgba('#3a2418', 0.4); g.beginPath();
      g.moveTo(s.x - s.w * 0.55, HOME.floorY + 4); g.lineTo(s.x - s.w * 0.6 + lean, HOME.floorY - hh); g.quadraticCurveTo(s.x + lean, HOME.floorY - hh - 30, s.x + s.w * 0.6 + lean, HOME.floorY - hh); g.lineTo(s.x + s.w * 0.55, HOME.floorY + 4); g.fill();
    }
    g.restore();
  } else {
    for (const s of HOME_CASTERS()) pool(g, s.x, s.y + 2, s.w * 0.7, s.w * 0.14, '#1a1a30', 0.4);
  }
}
const HOME_LIGHT = {
  candle: {
    amb: '#4e3024', ambK: 0.9, cols: ['#422a20', '#6a4430', '#5a3a2c', '#3a2620'], seed: 11,
    lights: [{ x: C0.flame[0], y: C0.flame[1] + 60, rx: 860, ry: 540, inner: 0.16 }, { x: C0.flame[0], y: C0.flame[1] + 120, rx: 480, ry: 260, inner: 0.4 }],
    glows: [{ x: C0.flame[0], y: C0.flame[1] + 40, rx: 640, ry: 420, col: '#e88a3a', a: 0.18 }, { x: C0.flame[0], y: C0.flame[1], rx: 240, ry: 200, col: '#ffcf80', a: 0.24 }],
    soft: 'rgba(255,170,90,0.14)',
  },
  dark: {
    amb: '#2a2c5c', ambK: 0.97, cols: ['#22244e', '#34366a', '#2a2a58', '#3a3470'], seed: 12, strokes: 60,
    lights: [{ x: 1262, y: 860, rx: 380, ry: 300, a: 0.4, inner: 0.1 }, { x: 960, y: 760, rx: 1000, ry: 520, a: 0.16, inner: 0.2 }],
    soft: 'rgba(40,40,110,0.3)',
  },
};
function moonThread(g) { // the thread of moonlight through the door's crack, lying across the floorboards
  const [cx, cy0, , cy1] = HOME.DOOR.crack;
  g.save(); g.globalCompositeOperation = 'screen';
  g.filter = `blur(${3 * RES}px)`;
  const lg = g.createLinearGradient(0, cy1, 0, 1134); lg.addColorStop(0, 'rgba(180,196,250,0.55)'); lg.addColorStop(0.5, 'rgba(150,170,240,0.32)'); lg.addColorStop(1, 'rgba(130,150,230,0.08)');
  g.fillStyle = lg; path(g, HOME.MOONBEAM); g.fill();
  g.filter = `blur(${10 * RES}px)`; g.fillStyle = 'rgba(120,140,220,0.16)';
  g.beginPath(); g.moveTo(cx - 10, cy1); g.lineTo(cx + 16, cy1); g.lineTo(1290, 1134); g.lineTo(1100, 1134); g.closePath(); g.fill();
  g.filter = `blur(${1.2 * RES}px)`; g.fillStyle = 'rgba(210,222,255,0.85)'; g.fillRect(cx - 2, cy0, 5, cy1 - cy0);
  g.filter = `blur(${6 * RES}px)`; g.fillStyle = 'rgba(160,180,250,0.3)'; g.fillRect(cx - 9, cy0 - 6, 18, cy1 - cy0 + 6);
  g.restore();
}
function crackGlow(g) { // candle mood: the faint warm glow of the kitchen range far down the passage
  const [cx, cy0, , cy1] = HOME.DOOR.crack;
  g.save(); g.globalCompositeOperation = 'screen'; g.filter = `blur(${2 * RES}px)`;
  g.fillStyle = 'rgba(200,120,60,0.45)'; g.fillRect(cx - 2, cy0 + 40, 4, cy1 - cy0 - 40); g.restore();
}

let HOMEL = null;
// Both moods of the home, painted once: { candle: { back, nests, front }, dark: { ... } }. back: a 2x layer (draw with
// drawH); nests: [{ c, x0, y0, w, h }] the fronts of the nests (one per HOME.NESTS); front: foreground pieces.
export function homeLayers() {
  if (HOMEL) return HOMEL;
  const bd = tm('h.backdrop', () => hpaint(homeBackdrop));
  const ob = tm('h.objects', () => hpaint(homeObjects));
  const nf = tm('h.nestFronts', () => hpaint((g) => HOME.NESTS.forEach((n, i) => paintNest(g, n, 'front', i))));
  const fr = tm('h.front', () => hpaint(homeFront));
  HOMEL = {};
  for (const mood of ['candle', 'dark']) {
    const back = hcanvas(), g = back.getContext('2d');
    g.drawImage(bd, 0, 0);
    g.setTransform(RES, 0, 0, RES, M * RES, MY * RES);
    tm('h.shadows', () => homeShadows(g, mood));
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(ob, 0, 0);
    tm('h.light', () => lightPass(back, HOME_LIGHT[mood]));
    g.setTransform(RES, 0, 0, RES, M * RES, MY * RES);
    if (mood === 'dark') moonThread(g); else crackGlow(g);
    g.setTransform(1, 0, 0, 1, 0, 0); tm('h.granulate', () => granulate(g, back.width, back.height, 0.2, 5));
    const lit = (src, sd) => { const c = hcanvas(false); c.getContext('2d').drawImage(src, 0, 0); lightPass(c, { ...HOME_LIGHT[mood], mask: true, seed: sd }); return c; };
    const nl = lit(nf, 21), fl = lit(fr, 22);
    HOMEL[mood] = { back: to8(back), nests: pieces(nl, HOME.NESTS.map(nestBox)), front: pieces(fl, HOME_FRONT_BOXES), mood };
    free(back); free(nl); free(fl);
  }
  free(bd); free(ob); free(nf); free(fr);
  return HOMEL;
}

// ---------------------------------------------------------------- the candle stub (live: flame, glow, blow-out, smoke)
// The flicker of a small flame, about 0.8..1 (smooth: it never jumps between two frames)
export function flicker(t, seed = 0) {
  return 0.86 + 0.07 * (noise1(t * 2.6, 11 + seed) - 0.5) * 2 + 0.04 * (noise1(t * 6.1, 12 + seed) - 0.5) * 2 + 0.02 * Math.sin(t * 9.7 + 6 * noise1(t * 0.7, 13 + seed));
}
// How lit the candle is at t when it is blown out at outAt (1 = burning, 0 = out); a quick dip, a last gutter, gone.
export function candleK(t, outAt = null) {
  if (outAt == null || t < outAt) return 1;
  const u = t - outAt;
  return clamp(1 - u / 0.22) * 0.85 + 0.15 * clamp(1 - u / 0.5) * (0.6 + 0.4 * Math.sin(u * 40));
}
// How dark the home is (0 = candle, 1 = dark mood), easing in over ~1.6 s after the candle goes out (eyes adjusting)
export function darkK(t, outAt = null) { return outAt == null ? 0 : span(t, outAt, outAt + 1.6); }

const CANDLE_SPR = {};
function candleSprite(mood) {
  if (CANDLE_SPR[mood]) return CANDLE_SPR[mood];
  const { x, y, top } = C0, rx = 34;
  const s = sprite({ x0: x - 70, y0: top - 30, x1: x + 70, y1: y + 22, w: 140, h: y - top + 52 }, RES, (g) => {
    pool(g, x, y + 4, 70, 14, '#2a1a10', 0.35);
    // the penny
    const pen = cyl(x, y + 4, y, 54, 13);
    thing(g, pen.side, '#9a5a30', { seed: 801, line: 1.3 });
    thing(g, pen.top, '#c07a44', { seed: 802, line: 1.3, blooms: ['#d08a50', '#a86a3a'], hi: [x - 18, y - 2, 18, 4] });
    g.strokeStyle = rgba('#7a4424', 0.6); g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, 46, 10.5, 0, 0, TAU); g.stroke();
    // a puddle of wax on the penny
    const pud = smooth([[x - 40, y - 2], [x - 30, y - 8], [x + 10, y - 9], [x + 42, y - 4], [x + 30, y + 4], [x - 10, y + 6]]);
    thing(g, pud, '#f2e2bc', { seed: 803, line: 1, hi: [x - 10, y - 4, 16, 3], hiCol: '#fffaf0' });
    // the stub, its top melted into a little crater, drips down its sides
    const body = [[x - rx - 2, y - 3], [x - rx, y - 30], [x - rx + 1, top + 30]];
    for (let i = 0; i <= 12; i++) { const u = i / 12, xx = x - rx + u * rx * 2; body.push([xx, top + 6 + Math.sin(u * 9 + 1) * 3 + (u > 0.6 ? 5 : 0) + (u < 0.15 ? 4 : 0)]); }
    body.push([x + rx - 1, top + 34], [x + rx + 1, y - 30], [x + rx + 3, y - 3], [x, y + 3]);
    const stub = smooth(body, true, 3);
    thing(g, stub, '#eedab0', { seed: 804, line: 1.7, blooms: ['#f6e8c8', '#e4c89a', '#f2dcb4'], sdx: 12, sw: 22, sa: 0.32, hi: [x - 8, top + 30, 14, 40], hiCol: '#fff6e0' });
    shadeEdge(g, stub, { color: '#a88458', alpha: 0.35, width: 30, dy: -16 });          // darker toward the foot, away from the flame
    // drips: thin runs ending in round beads, one long one pooling on the penny
    for (const [dx, L] of [[-27, 40], [-12, 28], [10, 74], [24, 34]]) {
      const x0 = x + dx, y0 = top + 6, w0 = dx === 10 ? 5.5 : 4.2;
      const d = smooth([[x0 - w0, y0], [x0 - w0 * 0.9, y0 + L * 0.6], [x0 - w0 * 1.4, y0 + L - 3], [x0, y0 + L + w0 * 0.9], [x0 + w0 * 1.4, y0 + L - 3], [x0 + w0 * 0.9, y0 + L * 0.6], [x0 + w0, y0]], true, 4);
      thing(g, d, '#f4e6c4', { seed: 810 + dx, line: 1.1, hi: [x0 - 1, y0 + L * 0.4, 1.6, L * 0.35], hiCol: '#fffaf0', hiA: 0.7, sdx: 2, sw: 3 });
    }
    const cr = ellipse(x, top + 7, rx - 4, 7.5, 24); thing(g, cr, '#e6c48e', { seed: 805, line: 1.1, sdy: 5, sw: 7 });
    g.save(); g.globalCompositeOperation = 'screen'; pool(g, x, top + 16, 34, 30, '#ffd080', 0.65); g.restore();   // the wax glowing near the flame
    // the wick, curled and blackened at its tip
    ink(g, [[x, top + 8], [x + 1, top - 2], [x + 3, top - 12], [x + 5, top - 15]], { color: '#2a1a14', width: 2.8, alpha: 0.95, seed: 806 });
  }, { grain: 0.12, seed: 807 });
  if (mood === 'dark') { // the same stub, in the dark: cooled to blue-violet, the wick a dull ember for a moment
    const g = s.c.getContext('2d'), keep = canvas(s.c.width, s.c.height, false); keep.getContext('2d').drawImage(s.c, 0, 0);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = '#3e4078'; g.fillRect(0, 0, s.c.width, s.c.height);
    g.globalCompositeOperation = 'soft-light'; g.fillStyle = 'rgba(40,40,110,0.4)'; g.fillRect(0, 0, s.c.width, s.c.height);
    g.globalCompositeOperation = 'destination-in'; g.drawImage(keep, 0, 0); g.restore();
  }
  return (CANDLE_SPR[mood] = s);
}
// The flame itself: a soft teardrop that sways and breathes, with a blue root and a bright heart.
function flame(g, t, x, y, k) {
  if (k <= 0.01) return;
  const f = flicker(t), sway = (noise1(t * 1.7, 21) - 0.5) * 8 + Math.sin(t * 5.1) * 0.8, h = 56 * (0.86 + 0.25 * (f - 0.86) / 0.1) * (0.35 + 0.65 * k), w = 13 * (0.6 + 0.4 * k);
  const tipX = x + sway, tipY = y + 22 - h;
  const shape = (s) => [[x - w * s, y + 12], [x - w * s * 1.05, y + 2], [x - w * 0.8 * s + sway * 0.3, y - h * 0.25], [tipX, tipY + (1 - s) * h * 0.2], [x + w * 0.8 * s + sway * 0.3, y - h * 0.25], [x + w * s * 1.05, y + 2], [x + w * s, y + 12], [x, y + 18 * s]];
  g.save();
  g.globalCompositeOperation = 'lighter';
  pool(g, x + sway * 0.4, y - 6, 60 * k, 74 * k, '#ffb050', 0.4 * k * f);
  pool(g, x + sway * 0.5, y - h * 0.3, 26 * k, 44 * k, "#ff9a40", 0.22 * k * f);
  g.globalCompositeOperation = 'source-over';
  // a soft fringe, the body (orange at the tip to pale gold), a bright heart low down, a faint blue root
  const grd = (a) => { const gr = g.createLinearGradient(0, tipY, 0, y + 18); gr.addColorStop(0, 'rgba(255,150,60,0)'); gr.addColorStop(0.2, `rgba(255,170,80,${0.8 * a})`); gr.addColorStop(0.62, `rgba(255,222,140,${0.95 * a})`); gr.addColorStop(0.88, `rgba(255,236,190,${0.85 * a})`); gr.addColorStop(1, `rgba(150,160,220,${0.4 * a})`); return gr; };
  g.fillStyle = grd(0.3 * k); path(g, smooth(shape(1.25))); g.fill();
  g.fillStyle = grd(k); path(g, smooth(shape(1))); g.fill();
  const heart = g.createRadialGradient(x + sway * 0.15, y + 2, 0, x + sway * 0.15, y + 2, h * 0.4);
  heart.addColorStop(0, `rgba(255,253,240,${0.95 * k})`); heart.addColorStop(0.6, `rgba(255,246,210,${0.6 * k})`); heart.addColorStop(1, 'rgba(255,240,200,0)');
  g.fillStyle = heart; path(g, smooth(shape(0.7))); g.fill();
  const root = g.createRadialGradient(x, y + 13, 0, x, y + 13, w * 0.8); root.addColorStop(0, `rgba(110,130,210,${0.35 * k})`); root.addColorStop(1, 'rgba(110,130,210,0)');
  g.fillStyle = root; g.fillRect(x - w, y + 4, w * 2, 18);
  // the wick, dark inside the flame's root
  g.strokeStyle = `rgba(40,26,20,${0.75 * k})`; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 1, y + 22); g.quadraticCurveTo(x + 2, y + 12, x + 4, y + 7); g.stroke();
  g.restore();
}
// A curl of smoke rising from the wick after the candle is blown out (age: seconds since it went out)
function smoke(g, t, x, y, age) {
  if (age < 0 || age > 7) return;
  // one thin ribbon rising and slowly unravelling (a fainter twin beside it), drifting a little as it climbs
  const a0 = clamp(age / 0.25) * clamp((7 - age) / 4.5);
  g.save(); g.lineCap = 'round';
  for (let s = 0; s < 2; s++) {
    const pts = [], L = (30 + age * 55) * (s ? 0.75 : 1), fq = s ? 5.3 : 4.1, ph = s ? 1.9 : 0;
    for (let i = 0; i <= 30; i++) {
      const u = i / 30, hgt = u * L;
      const curl = Math.sin(u * fq - age * 0.9 + ph) * (1.5 + u * u * 22) + (noise1(u * 2.2 + age * 0.35, 30 + s) - 0.5) * 36 * u * u + u * age * 4;
      pts.push([x + curl + s * 2, y - hgt]);
    }
    for (let i = 1; i < pts.length; i++) {
      const u = i / pts.length;
      g.strokeStyle = `rgba(226,220,222,${a0 * Math.pow(1 - u, 1.3) * (s ? 0.25 : 0.5)})`; g.lineWidth = 1.6 + u * u * 9;
      g.beginPath(); g.moveTo(...pts[i - 1]); g.lineTo(...pts[i]); g.stroke();
    }
  }
  g.restore();
}
// Draw the candle stub with its flame. o: { outAt: time it is blown out (flame bends, shrinks and goes, then smoke),
// dark: 0..1 (the stub in the dark mood; default from outAt), blow: 0..1 extra lean of the flame (someone blowing) }
export function drawCandle(g, t, o = {}) {
  const d = o.dark ?? darkK(t, o.outAt), k = o.outAt != null ? candleK(t, o.outAt) : clamp(1 - d * 3);
  drawSprite(g, candleSprite('candle'));
  if (d > 0) drawSprite(g, candleSprite('dark'), d);
  const [wx, wy] = C0.wick, lean = o.blow ?? (o.outAt != null ? span(t, o.outAt - 0.5, o.outAt) : 0);
  if (k > 0.01) {
    g.save(); g.translate(wx, wy + 14); g.transform(1, 0, -0.5 * lean, 1, 0, 0); g.translate(-wx, -wy - 14);
    flame(g, t, wx - 2, wy - 10, k * (1 - 0.3 * lean));
    g.restore();
  }
  if (o.outAt != null && t > o.outAt) {
    const age = t - o.outAt;
    if (age < 2.5) { g.save(); g.globalCompositeOperation = 'lighter'; pool(g, wx, wy - 1, 5, 5, '#ff7a30', 0.8 * clamp(1 - age / 2.5)); g.restore(); } // the glowing wick
    smoke(g, t, wx, wy - 2, age);
  }
}
// The candle's live warm glow on everything (draw it after the actors). k: 0..1 (candleK when blowing it out).
export function candleLight(g, t, x = C0.flame[0], y = C0.flame[1], k = 1) {
  if (k <= 0.01) return;
  // pulse: 0..1 as the flame dips and swells (smooth, so the light breathes rather than strobes)
  const pulse = clamp((flicker(t) - 0.76) / 0.2), jx = (noise1(t * 1.7, 21) - 0.5) * 5;
  g.save(); g.globalCompositeOperation = 'lighter';
  pool(g, x + jx, y + 60, 760 * (0.97 + 0.03 * pulse), 520, '#ff9a40', (0.04 + 0.06 * pulse) * k);
  pool(g, x + jx, y + 20, 300, 240, '#ffbe68', (0.06 + 0.07 * pulse) * k);
  pool(g, x + jx * 0.6, y, 90, 100, '#ffe8b0', (0.12 + 0.1 * pulse) * k);
  g.restore();
  // the edges breathe darker as the flame dips
  const dip = (1 - pulse) * k;
  if (dip > 0.01) {
    g.save(); g.globalCompositeOperation = 'multiply'; g.translate(x, y); g.scale(1, 0.62);
    const gr = g.createRadialGradient(0, 0, 260, 0, 0, 1300); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(80,52,44,${0.32 * dip})`);
    g.fillStyle = gr; g.fillRect(-1400, -1400, 2800, 2800); g.restore();
  }
}
// Dust motes drifting slowly in the candlelight (brighter near the flame). k: 0..1
export function candleMotes(g, t, n = 30, k = 1, seed = 3) {
  if (k <= 0) return;
  const [cx, cy] = C0.flame;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const sp = 0.004 + 0.005 * noise1(i * 1.3, seed), v = (t * sp + noise1(i * 3.1, seed + 9)) % 1;
    const x = cx + (noise1(i * 7.3, seed) - 0.5) * 900 + Math.sin(t * 0.25 + i) * 18 + (noise1(t * 0.04 + i, seed + 2) - 0.5) * 60;
    const y = cy + 260 - v * 640;
    const near = Math.exp(-(((x - cx) / 380) ** 2 + ((y - cy) / 300) ** 2));
    const a = Math.sin(v * Math.PI) * near * k * (0.35 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.9 + i * 2)));
    if (a <= 0.02) continue;
    g.fillStyle = `rgba(255,226,170,${a})`; g.beginPath(); g.arc(x, y, 1.1 + (i % 3) * 0.6, 0, TAU); g.fill();
  }
  g.restore();
}
// motes floating in the thread of moonlight (dark mood)
export function moonMotes(g, t, n = 14, k = 1, seed = 8) {
  if (k <= 0) return;
  const [cx, cy0, , cy1] = HOME.DOOR.crack;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const v = (t * (0.01 + 0.008 * noise1(i, seed)) + noise1(i * 2.7, seed + 1)) % 1;
    const y = cy0 + 40 + v * 320, x = lerp(cx, 1196, (y - cy1) / 400) + (noise1(i * 5.1 + t * 0.05, seed + 2) - 0.5) * 50;
    const a = Math.sin(v * Math.PI) * 0.35 * k * (0.5 + 0.5 * Math.sin(t * 0.8 + i));
    if (a < 0.02) continue;
    g.fillStyle = `rgba(200,214,255,${a})`; g.beginPath(); g.arc(x, y, 1 + (i % 2) * 0.6, 0, TAU); g.fill();
  }
  g.restore();
}
// the fronts of the nests (the shells' and cup's near walls, wool spilling over), drawn after sleeping mice
export function drawNestFronts(g, d = 0, which = null) {
  const L = homeLayers();
  L.candle.nests.forEach((p, i) => { if (!which || which.includes(i)) { if (d < 1) drawSprite(g, p); if (d > 0) drawSprite(g, L.dark.nests[i], d); } });
}

// The whole home for one frame. c: camera ({z, x, y}; see view()). o:
//   outAt   time the candle is blown out (then the dark mood fades in, smoke rises); or dark: 0..1 set directly
//   behind(g)   actors behind the candle (after the back layer); sleepers(g) mice in the nests (before the nest fronts)
//   actors(g)   actors in front of the candle; after(g) on top of everything (after the light)
//   motes (default true), blow: 0..1 (the flame leaning from someone's breath)
export function drawHome(g, t, c, o = {}) {
  const L = homeLayers(), d = o.dark ?? darkK(t, o.outAt), k = o.outAt != null ? candleK(t, o.outAt) : clamp(1 - d * 3);
  if (d < 1) drawH(g, c, L.candle.back);
  if (d > 0) drawH(g, c, L.dark.back, d);
  cam(g, c, 1);
  if (o.behind) o.behind(g);
  if (o.sleepers) o.sleepers(g);
  drawNestFronts(g, d);
  drawCandle(g, t, { outAt: o.outAt, dark: d, blow: o.blow });
  if (o.actors) o.actors(g);
  if (d < 1) drawPieces(g, L.candle.front);
  if (d > 0) drawPieces(g, L.dark.front, d);
  candleLight(g, t, C0.flame[0], C0.flame[1], k * (1 - d * 0.5));
  if (o.motes !== false) { candleMotes(g, t, 30, k); moonMotes(g, t, 14, d); }
  if (o.after) o.after(g);
}

// ================================================================ THE FARMHOUSE KITCHEN (human scale, seen low)
// The eye is low (about a mouse's height plus a little: the horizon is at y = 500), so the furniture is tall and
// cropped by the top of the frame and the worktops are seen from just below. Left to right: the dresser with its
// plates and the big cheese under a glass cloche; the deep-set window with checked curtains (the moon at night),
// the scrubbed table with the oil lamp in front of it; the wall clock; the mouse door in the skirting; the big
// black range in its brick chimney recess, the rag rug in front of it (the cat's place); copper pans on the right.
export const KITCHEN = {
  horizon: 500, floorY: 716,                                  // the eye's height; where the back wall meets the floor
  WINDOW: { x0: 640, x1: 850, y0: -40, y1: 360, barX: 745, barY: [94, 228], reveal: [596, 894], sill: 376 },
  TABLE: { x0: 470, x1: 1000, top: 436, legs: [[512, 792], [958, 792], [548, 744], [924, 744]] },  // legs: [x, foot y]
  LAMP: { x: 622, y: 440, flame: [622, 296] },                // y: its foot on the table; flame: the middle of the flame
  DRESSER: { x0: 34, x1: 470, top: 389, y: 726 },             // top: the worktop; y: its foot
  CHEESE: { x: 330, y: 389, top: 262 },                       // the cheese under its glass cloche, on the dresser
  CLOCK: { x: 1052, y: 118, pivot: [1052, 238], len: 64 },     // the dial's middle; the pendulum's pivot and length
  MOUSE_DOOR: { x: 1052, y: 718, w: 42, h: 50 },              // the little arched door in the skirting (x: middle, y: floor)
  RANGE: { x0: 1180, x1: 1640, top: 424, y: 714, fire: { x0: 1356, y0: 470, x1: 1464, y1: 556 } },
  RECESS: { x0: 1110, x1: 1700, top: 176 },
  RUG: { x: 1410, y: 836, rx: 262, ry: 56 },                  // the rag rug; a curled cat fits about 320 px long here
  CAT: [1420, 846],                                           // where the sleeping cat's middle goes (on the rug)
  PANS: [[1790, 238, 64], [1872, 236, 50], [1742, 300, 38]],  // copper pans [x, y (hook), radius]
  MOON: { x0: 690, x1: 810, y: 86 },                          // the moon crosses the window between x0 and x1
};
const KI = KITCHEN;
const kz = (y) => (y - KI.horizon) / (KI.floorY - KI.horizon);   // scale at a floor point, relative to the back wall
const KLAMP = KI.LAMP.flame, KFIRE = [(KI.RANGE.fire.x0 + KI.RANGE.fire.x1) / 2, (KI.RANGE.fire.y0 + KI.RANGE.fire.y1) / 2];

// ---- the back wall: old limewashed plaster with patches of brick, a painted skirting board
function kitchenWall(g, seed) {
  const r = rng(seed), wall = R4(-M - 10, -MY - 10, W + M + 10, KI.floorY + 4);
  brushWash(g, wall, ['#e8d8b8', '#e0cca6', '#ecdcc0', '#d8c49c', '#e4d2b0'], { seed, count: 70, width: [30, 70], len: [200, 600], alpha: [0.18, 0.34], base: 0.95, under: true, angle: () => -0.1 });
  for (let k = 0; k < 9; k++) pool(g, r.range(-M, W + M), r.range(-MY, 700), r.range(80, 240), r.range(60, 160), r.pick(['#c8a878', '#d8bc90', '#f2e6cc']), 0.25);
  // patches where the plaster has fallen away, showing bricks
  for (const [px, py, pw, ph] of []) {
    const sh = fluffyPatch(px, py, pw, ph, r);
    wash(g, sh, { color: '#a8684c', opacity: 0.85, seed: seed + px, layers: 8, edge: 0.4 });
    g.save(); path(g, sh); g.clip(); g.strokeStyle = rgba('#e0d0b0', 0.8); g.lineWidth = 2.4;
    for (let yy = py - ph; yy < py + ph; yy += 18) { g.beginPath(); g.moveTo(px - pw, yy); g.lineTo(px + pw, yy); g.stroke(); for (let xx = px - pw + ((yy / 18) % 2) * 22; xx < px + pw; xx += 44) { g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 18); g.stroke(); } }
    g.restore();
    ink(g, sh, { closed: true, width: 1.2, alpha: 0.55, gaps: 0.8, seed: seed + px + 1 });
  }
  // fine cracks
  for (let k = 0; k < 7; k++) { let x = r.range(0, W), y = r.range(60, 640); const pts = [[x, y]]; for (let q = 0; q < 5; q++) { x += r.gauss(0, 14); y += r.range(8, 22); pts.push([x, y]); } ink(g, pts, { width: 0.9, alpha: 0.4, seed: seed + 50 + k }); }
  // the skirting
  const sk = [[-M - 10, 688], [W + M + 10, 688], [W + M + 10, KI.floorY + 2], [-M - 10, KI.floorY + 2]];
  wood(g, sk, ['#5e6a52', '#4e5a44', '#6a765c'], { seed: seed + 9, n: 20, line: 1.6, sdy: -6, sw: 10, grainA: 0.2 });
  penLine(g, [[-M, 692], [W + M, 692]], { w: 1.2, alpha: 0.4, seed: seed + 10 });
}
function fluffyPatch(x, y, w, h, r) { const p = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; p.push([x + Math.cos(a) * w * r.range(0.7, 1.1), y + Math.sin(a) * h * r.range(0.7, 1.1)]); } return smooth(p, true, 3); }
// ---- the flagstone floor, in perspective
function flagstones(g, seed) {
  const r = rng(seed), hz = KI.horizon, f = KI.floorY - hz, cm = 3.6;
  const Y = (z) => hz + f / z, X = (xc, z) => 960 + xc * cm / z;
  g.fillStyle = '#5a5046'; g.fillRect(-M, KI.floorY - 2, LW, H + MY - KI.floorY + 4);
  const cols = ['#c0b098', '#b0a490', '#ccbca0', '#a89c88', '#b8a88c', '#c4b294', '#ac9c84'];
  const zs = [1, 0.84, 0.7, 0.59, 0.5, 0.43, 0.37, 0.32, 0.28];
  for (let k = 0; k < zs.length - 1; k++) {
    const z0 = zs[k], z1 = zs[k + 1], half = (W / 2 + M + 40) * z1 / cm;
    let xc = -half - r.range(0, 50);
    while (xc < half) {
      const sw = r.range(32, 52), xa = xc + 0.9, xb = xc + sw - 0.9, za = z0 - 0.004, zb = z1 + 0.004;
      const j = () => r.gauss(0, 1.2);
      const st = smooth([[X(xa, za) + j(), Y(za) + j()], [X((xa + xb) / 2, za) + j(), Y(za) + j()], [X(xb, za) + j(), Y(za) + j()], [X(xb, (za + zb) / 2) + j(), Y((za + zb) / 2)], [X(xb, zb) + j(), Y(zb) + j()], [X((xa + xb) / 2, zb) + j(), Y(zb) + j()], [X(xa, zb) + j(), Y(zb) + j()], [X(xa, (za + zb) / 2) + j(), Y((za + zb) / 2)]], true, 3);
      const col = r.pick(cols), b = bbox(st);
      wash(g, st, { color: col, opacity: 0.95, seed: seed + Math.round(xc * 3 + k * 101), layers: 8, bleed: 0.006, edge: 0.4 });
      g.save(); path(g, st); g.clip();
      for (let q = 0; q < 3; q++) pool(g, r.range(b.x0, b.x1), r.range(b.y0, b.y1), b.w * r.range(0.15, 0.4), b.h * r.range(0.3, 0.6), r.pick(cols.concat(['#8a8478', '#d0c4ac'])), 0.4);
      speckle(g, b, { color: '#5a5044', count: Math.round(b.w * 0.15), size: 2, alpha: 0.4, seed: seed + k * 31 + Math.round(xc) });
      g.restore();
      shadeEdge(g, st, { color: '#4a4036', alpha: 0.35, width: 14 / kz(b.y0) * 0.5 + 8, dy: -5 });
      ink(g, st, { closed: true, width: 1.3, alpha: 0.55, wobble: 0.5, gaps: 0.6, seed: seed + k * 7 + Math.round(xc) });
      xc += sw;
    }
  }
}
// ---- the window: a deep reveal in the thick wall, a sill, glazing bars; the sky is painted per mood
function windowPanes() {
  const { x0, x1, y0, y1, barX, barY } = KI.WINDOW, bw = 5, xs = [[x0, barX - bw], [barX + bw, x1]], ys = [[y0, barY[0] - bw], [barY[0] + bw, barY[1] - bw], [barY[1] + bw, y1]];
  const out = []; for (const [a, b] of xs) for (const [c, d] of ys) out.push([a, c, b, d]); return out;
}
function windowFrame(g, seed) {
  const { x0, x1, y0, y1, barX, barY, reveal, sill } = KI.WINDOW;
  // the splayed reveal (limewashed), lit side and shaded side
  const L = [[reveal[0], -MY - 10], [x0, -MY - 10], [x0, y1], [reveal[0], sill]], Rr = [[x1, -MY - 10], [reveal[1], -MY - 10], [reveal[1], sill], [x1, y1]];
  thing(g, L, '#ece0c8', { seed: seed + 1, line: 1.6, sharp: true, sdx: 16, sw: 26, sa: 0.3 });
  thing(g, Rr, '#d8c8a8', { seed: seed + 2, line: 1.6, sharp: true, sdx: -14, sw: 30, sa: 0.4 });
  // the glass (a dark placeholder: the sky goes in per mood) and the frame
  wash(g, R4(x0, y0, x1, y1), { color: '#3a4458', opacity: 0.97, seed: seed + 3, under: true, layers: 6, bleed: 0.004 });
  const fr = '#f0e8d8';
  for (const sh of [R4(x0 - 8, -MY - 10, x0 + 4, y1 + 6), R4(x1 - 4, -MY - 10, x1 + 8, y1 + 6), R4(x0 - 8, y1 - 4, x1 + 8, y1 + 8), R4(barX - 5, -MY - 10, barX + 5, y1), R4(x0, barY[0] - 5, x1, barY[0] + 5), R4(x0, barY[1] - 5, x1, barY[1] + 5)])
    thing(g, sh, fr, { seed: seed + 4 + Math.round(sh[0][0] + sh[0][1]), line: 1.3, sharp: true, layers: 6, sdy: -2, sw: 4 });
  // the sill: a deep stone ledge
  const sl = [[reveal[0] - 22, sill], [reveal[1] + 22, sill], [reveal[1] + 26, sill + 22], [reveal[0] - 26, sill + 22]];
  thing(g, [[reveal[0], sill - 2], [reveal[1], sill - 2], [x1, y1 + 6], [x0, y1 + 6]], '#e4d8c0', { seed: seed + 5, line: 1.3, sharp: true });
  thing(g, sl, '#d8ccb4', { seed: seed + 6, line: 1.8, sharp: true, sdy: -6, sw: 10 });
  // a geranium in a clay pot on the sill
  const px = 832, py = 372, pot = [[px - 22, py - 40], [px + 22, py - 40], [px + 16, py], [px - 16, py]];
  thing(g, pot, '#c06a44', { seed: seed + 7, line: 1.5, sdx: -6, sw: 10, hi: [px - 8, py - 26, 5, 12] });
  thing(g, R4(px - 25, py - 46, px + 25, py - 38), '#c87650', { seed: seed + 8, line: 1.3, sharp: true });
  const rr = rng(seed + 9);
  for (let k = 0; k < 9; k++) { const lx = px + rr.gauss(0, 20), ly = py - 60 - rr.range(0, 40); thing(g, ellipse(lx, ly, 13, 10, 14), rr.pick(['#6a8a4a', '#7a9a56', '#5a7a40']), { seed: seed + 20 + k, line: 1, layers: 6 }); }
  for (let k = 0; k < 3; k++) { const fx = px - 14 + k * 16, fy = py - 104 - (k % 2) * 12; ink(g, [[fx, fy + 30], [fx, fy]], { color: '#5a7a40', width: 1.4, alpha: 0.8, seed: seed + 40 + k }); for (let q = 0; q < 6; q++) { g.fillStyle = rgba(q % 2 ? '#d84a48' : '#e86a60', 0.9); g.beginPath(); g.arc(fx + rr.gauss(0, 5), fy + rr.gauss(0, 4), 4.5, 0, TAU); g.fill(); } }
}
// the sky in the window for a mood (painted after the light pass, inside the panes only)
function windowSky(g, mood) {
  const { x0, x1, y0, y1 } = KI.WINDOW, r = rng(mood === 'night' ? 71 : 72);
  g.save(); g.beginPath(); for (const [a, c, b, d] of windowPanes()) g.rect(a, c, b - a, d - c); g.clip();
  const lg = g.createLinearGradient(0, y0, 0, y1);
  if (mood === 'night') { lg.addColorStop(0, '#141c3a'); lg.addColorStop(0.6, '#222e58'); lg.addColorStop(1, '#34406a'); }
  else { lg.addColorStop(0, '#2e3a6a'); lg.addColorStop(0.45, '#5a5e8c'); lg.addColorStop(0.78, '#c08a8a'); lg.addColorStop(1, '#e8b088'); }
  g.fillStyle = lg; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let k = 0; k < 8; k++) pool(g, r.range(x0, x1), r.range(y0, y1), r.range(30, 70), r.range(20, 40), mood === 'night' ? '#3a4a7a' : '#8a7aa0', 0.3);
  // a far hill and a hedge with one tree
  const hill = smooth([[x0 - 20, y1 + 10], [x0 - 20, 300], [700, 288], [760, 296], [820, 282], [x1 + 20, 292], [x1 + 20, y1 + 10]]);
  wash(g, hill, { color: mood === 'night' ? '#1e2640' : '#4a4a62', opacity: 0.95, seed: 73, layers: 8 });
  for (const [tx, ty, tr] of [[790, 274, 17], [712, 282, 10], [842, 280, 12]]) { const tree = fluffyPatch(tx, ty - tr * 0.4, tr, tr * 1.1, r); wash(g, tree, { color: mood === 'night' ? '#182036' : '#3e3e56', opacity: 0.95, seed: 74 + tx, layers: 6 }); ink(g, [[tx, ty + tr * 0.9], [tx + 1, ty]], { width: 2, alpha: 0.6, seed: 75 + tx }); }
  g.restore();
  // the glass catches a little light
  g.save(); g.globalCompositeOperation = 'screen';
  for (const [a, c, b, d] of windowPanes()) { g.fillStyle = 'rgba(255,255,255,0.05)'; g.beginPath(); g.moveTo(a + 6, c + 6); g.lineTo(a + (b - a) * 0.45, c + 6); g.lineTo(a + 6, c + (d - c) * 0.5); g.closePath(); g.fill(); }
  g.restore();
}
// ---- the checked curtains (live sprites so they can stir in the draught)
const CURT_W = 96, CURT_TOP = -64, CURT_BOT = 398;
function curtainShape(side) { // side -1: left curtain, +1: right; local x from 0 (rod end, inner) outward
  const x0 = side < 0 ? KI.WINDOW.reveal[0] - 28 : KI.WINDOW.reveal[1] - CURT_W + 28;
  const p = [], q = [];
  for (let i = 0; i <= 10; i++) { const v = i / 10, y = lerp(CURT_TOP, CURT_BOT, v); const nar = (side < 0 ? 1 : -1) * Math.sin(v * Math.PI * 0.9) * 14;
    p.push([x0 + nar * (side < 0 ? 0.4 : 1) + Math.sin(v * 13) * 2, y]); q.push([x0 + CURT_W + nar * (side < 0 ? 1 : 0.4) + Math.sin(v * 11) * 2, y]); }
  return smooth(p.concat(q.reverse()), true, 3);
}
function paintCurtain(g, side, seed) {
  const sh = curtainShape(side), b = bbox(sh), r = rng(seed);
  wash(g, sh, { color: '#f2e8d6', opacity: 0.97, seed, under: true, layers: 10, bleed: 0.008 });
  g.save(); path(g, sh); g.clip();
  const s = 15;
  g.fillStyle = rgba('#c0504a', 0.42); for (let x = b.x0; x < b.x1; x += s * 2) g.fillRect(x + Math.sin(x) * 1.5, b.y0, s, b.h);
  for (let y = b.y0; y < b.y1; y += s * 2) g.fillRect(b.x0, y, b.w, s);
  // folds: vertical soft shadows and lit ridges
  for (let k = 0; k < 5; k++) { const fx = b.x0 + b.w * (0.12 + k * 0.2) + r.gauss(0, 3); glaze(g, sh, fx, (b.y0 + b.y1) / 2, 6, b.h * 0.6, '#5a2a24', 0.32); glaze(g, sh, fx + 9, (b.y0 + b.y1) / 2, 4, b.h * 0.6, '#fff4e0', 0.3); }
  g.restore();
  shadeEdge(g, sh, { color: '#5a3028', alpha: 0.3, width: 16, dy: -8 });
  penLine(g, sh, { closed: true, w: 1.7, alpha: 0.75, seed: seed + 1 });
  for (let k = 0; k < 5; k++) { const fx = b.x0 + b.w * (0.12 + k * 0.2); ink(g, [[fx, CURT_TOP + 20], [fx + r.gauss(0, 2), CURT_BOT - 40]], { width: 0.9, alpha: 0.35, gaps: 1, seed: seed + 3 + k }); }
}
const CURT = {};
function curtainSprites(mood) {
  if (CURT[mood]) return CURT[mood];
  const mk = (side) => {
    const sh = curtainShape(side), b = bbox(sh);
    const s = sprite(b, RES, (g) => paintCurtain(g, side, side < 0 ? 31 : 32), { grain: 0.15, seed: 33 });
    tintSprite(s, mood, b);
    return s;
  };
  return (CURT[mood] = { L: mk(-1), R: mk(1) });
}
// light a small sprite for a kitchen mood (multiply the ambient, then the glows), keeping its shape
function tintSprite(s, mood, b) {
  const L = KITCHEN_LIGHT[mood], g = s.c.getContext('2d'), keep = canvas(s.c.width, s.c.height, false);
  keep.getContext('2d').drawImage(s.c, 0, 0);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.globalAlpha = L.ambK * (mood === 'night' ? 0.97 : 0.85); g.fillStyle = L.amb; g.fillRect(0, 0, s.c.width, s.c.height); g.restore();
  const res = s.c.width / s.w;
  g.save(); g.setTransform(res, 0, 0, res, -s.x0 * res, -s.y0 * res); g.globalCompositeOperation = 'screen';
  for (const gl of L.spriteGlows || []) pool(g, gl.x, gl.y, gl.rx, gl.ry, gl.col, gl.a);
  g.restore();
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'destination-in'; g.drawImage(keep, 0, 0); g.restore();
}
// the curtains stirring a little (a draught from the old window): each hangs from its rod and sways at its hem
export function drawCurtains(g, t, mood = 'evening', amt = 1) {
  const S = curtainSprites(mood);
  for (const [s, side, ph] of [[S.L, -1, 0], [S.R, 1, 2.1]]) {
    const n = 24, res = s.c.width / s.w, hh = s.h / n;
    for (let i = 0; i < n; i++) {
      const y = s.y0 + i * hh, v = clamp((y - CURT_TOP) / (CURT_BOT - CURT_TOP));
      const dx = amt * Math.pow(v, 1.6) * (5 * Math.sin(t * 0.55 + ph) + 2.5 * Math.sin(t * 1.27 + ph * 2) + 3 * (noise1(t * 0.3 + ph, 41) - 0.5)) * side * -1;
      g.drawImage(s.c, 0, i * hh * res, s.c.width, hh * res + 1, s.x0 + dx, y, s.w, hh + 0.6);
    }
  }
  // the rod and its rings
  penLine(g, [[KI.WINDOW.reveal[0] - 40, CURT_TOP + 2], [KI.WINDOW.reveal[1] + 40, CURT_TOP + 2]], { w: 5, color: '#6a4a2a', alpha: 0.9, seed: 77, weight: () => 1 });
}
// ---- the dresser: plates on the rack, cups on hooks, the big cheese under its glass cloche on the worktop
function plate(g, x, y, rr, seed, pattern) {
  const sh = ellipse(x, y, rr, rr * 0.96, 30);
  thing(g, sh, '#f4f0e6', { seed, line: 1.4, sdx: 6, sw: 10, sa: 0.3, hi: [x - rr * 0.3, y - rr * 0.3, rr * 0.3, rr * 0.25], hiCol: '#ffffff' });
  g.strokeStyle = rgba(pattern, 0.75); g.lineWidth = rr * 0.13; g.beginPath(); g.ellipse(x, y, rr * 0.86, rr * 0.82, 0, 0, TAU); g.stroke();
  g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, rr * 0.6, rr * 0.57, 0, 0, TAU); g.stroke();
  const r = rng(seed); g.fillStyle = rgba(pattern, 0.6); for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(x + r.gauss(0, rr * 0.22), y + r.gauss(0, rr * 0.2), rr * 0.13, rr * 0.08, r() * 3, 0, TAU); g.fill(); }
}
function cup(g, x, y, seed, col) { // a cup hanging from a hook (y: the hook)
  ink(g, [[x, y - 6], [x, y + 4], [x + 4, y + 6]], { color: '#8a6a3a', width: 2, alpha: 0.9, seed });
  const body = smooth([[x - 14, y + 8], [x + 14, y + 8], [x + 11, y + 28], [x, y + 32], [x - 11, y + 28]]);
  thing(g, body, '#f2ece0', { seed: seed + 1, line: 1.3, sdx: 4, sw: 8 });
  g.strokeStyle = rgba(col, 0.7); g.lineWidth = 3; g.beginPath(); g.moveTo(x - 13, y + 13); g.lineTo(x + 13, y + 13); g.stroke();
  g.strokeStyle = rgba(INKC, 0.6); g.lineWidth = 3.4; g.beginPath(); g.arc(x - 15, y + 17, 6, 1.2, 5.2); g.stroke(); g.strokeStyle = 'rgba(242,236,224,0.95)'; g.lineWidth = 2; g.stroke();
}
function dresser(g, seed) {
  const { x0, x1, top, y } = KI.DRESSER, r = rng(seed), pine = ['#b8824a', '#c8945a', '#a87444', '#c08a50'];
  // the rack's back boards
  const back = R4(x0 + 22, -MY - 10, x1 - 22, top);
  wood(g, back, ['#8a5e36', '#7a5230', '#946640'], { seed, ang: Math.PI / 2, n: 40, line: 1.4 });
  for (let k = 1; k < 6; k++) penLine(g, [[x0 + 22 + k * (x1 - x0 - 44) / 6, -MY], [x0 + 22 + k * (x1 - x0 - 44) / 6, top]], { w: 1.4, alpha: 0.5, color: '#3a2414', seed: seed + k });
  shadeEdge(g, back, { color: '#2a1a10', alpha: 0.5, width: 60, dy: 30 });
  // shelves with plates standing on them, cups on hooks beneath
  const shelves = [8, 148, 280];
  const pats = ['#4a6aa8', '#4a6aa8', '#8a4a5a', '#4a6aa8', '#5a7a5a'];
  shelves.forEach((sy, si) => {
    if (si > 0) for (let k = 0; k < 4; k++) { const px = x0 + 82 + k * 92 + r.gauss(0, 3), rr = r.range(34, 42); plate(g, px, sy - rr - 4, rr, seed + 20 + si * 10 + k, pats[(si + k) % pats.length]); }
    const sh = R4(x0 + 16, sy, x1 - 16, sy + 14);
    wood(g, sh, pine, { seed: seed + 50 + si, n: 8, line: 1.6, sdy: -4, sw: 8 });
    // a plate rail (a thin bar in front of the plates)
    if (si > 0) penLine(g, [[x0 + 22, sy - 22], [x1 - 22, sy - 22]], { w: 3.4, color: '#7a5030', alpha: 0.85, seed: seed + 60 + si, weight: () => 1 });
    for (let k = 0; k < 5; k++) cup(g, x0 + 60 + k * 82, sy + 16, seed + 70 + si * 10 + k, r.pick(['#4a6aa8', '#c05050', '#5a8a5a']));
  });
  // the sides of the rack
  for (const sx of [x0 + 6, x1 - 26]) wood(g, R4(sx, -MY - 10, sx + 20, top), pine, { seed: seed + 90 + sx, ang: Math.PI / 2, n: 10, line: 1.6, sdx: sx < 200 ? 5 : -5, sw: 8 });
  // the lower cupboard: worktop (seen from just below), two panelled doors, a drawer row, the plinth
  const body = R4(x0 + 10, top + 16, x1 - 10, y - 14);
  wood(g, body, pine, { seed: seed + 100, n: 30, line: 2, sdx: 10, sw: 30, sa: 0.3 });
  for (const [dx0, dx1] of [[x0 + 30, (x0 + x1) / 2 - 8], [(x0 + x1) / 2 + 8, x1 - 30]]) {
    const dr = R4(dx0, top + 30, dx1, top + 62); thing(g, dr, pine[1], { seed: seed + 110 + dx0, line: 1.4, sharp: true, sdy: -3, sw: 6 });
    g.fillStyle = rgba('#d8b050', 0.95); g.beginPath(); g.arc((dx0 + dx1) / 2, top + 46, 5, 0, TAU); g.fill();
    const door = R4(dx0, top + 76, dx1, y - 34), pan = R4(dx0 + 18, top + 94, dx1 - 18, y - 52);
    thing(g, door, pine[2], { seed: seed + 120 + dx0, line: 1.6, sharp: true, sdx: 4, sw: 10 });
    thing(g, pan, pine[1], { seed: seed + 130 + dx0, line: 1.3, sharp: true, sdy: 6, sw: 10, hi: [(dx0 + dx1) / 2 - 20, top + 120, 30, 40] });
    g.fillStyle = rgba('#d8b050', 0.95); g.beginPath(); g.arc(dx0 < 200 ? dx1 - 12 : dx0 + 12, (top + y) / 2 + 20, 5, 0, TAU); g.fill();
  }
  const plinth = R4(x0 + 6, y - 16, x1 - 6, y); wood(g, plinth, ['#8a5a32', '#7a4e2c'], { seed: seed + 140, n: 6, line: 1.6 });
  const wt = R4(x0, top, x1, top + 18); wood(g, wt, ['#c89a62', '#d4a870'], { seed: seed + 150, n: 10, line: 2, sdy: 6, sw: 8 });
  penLine(g, [[x0 + 4, top + 22], [x1 - 4, top + 22]], { w: 2, alpha: 0.6, seed: seed + 151 });
  // a brown jug and a stoneware crock on the worktop
  const jx = 130, jug = smooth([[jx - 26, top], [jx - 34, top - 40], [jx - 22, top - 70], [jx - 26, top - 84], [jx + 20, top - 86], [jx + 22, top - 70], [jx + 34, top - 40], [jx + 26, top]]);
  thing(g, jug, '#8a5a34', { seed: seed + 160, line: 1.6, sdx: 8, sw: 14, hi: [jx - 10, top - 50, 8, 20], blooms: ['#9a6a40', '#7a4a2a'] });
  thing(g, R4(jx - 24, top - 72, jx + 24, top - 60), '#e8dcc0', { seed: seed + 161, line: 1.1, layers: 6 });
  g.strokeStyle = rgba(INKC, 0.7); g.lineWidth = 6; g.beginPath(); g.arc(jx + 38, top - 46, 16, -1.2, 1.3); g.stroke(); g.strokeStyle = rgba('#8a5a34', 1); g.lineWidth = 4; g.stroke();
}
// the big cheese under a glass cloche on a board
function cheeseCloche(g, seed) {
  const { x, y, top } = KI.CHEESE, rr = 86;
  const board = cyl(x, y + 1, y - 8, rr + 14, 10);
  wood(g, board.side, ['#9a6a3a', '#8a5a30'], { seed: seed + 1, n: 6, line: 1.4 });
  // the cheese: a round truckle with a wedge cut out, its rind and pale inside
  const cw = 62, ch = 62, cy0 = y - 8;
  const side = cyl(x, cy0, cy0 - ch, cw, 9);
  thing(g, side.side, '#d8a848', { seed: seed + 2, line: 1.6, sdx: 14, sw: 24, blooms: ['#e0b858', '#c89838', '#b88830'], hi: [x - 24, cy0 - 30, 12, 22], hiCol: '#f8e0a0' });
  speckle(g, bbox(side.side), { color: '#8a6420', count: 40, size: 1.6, alpha: 0.4, seed: seed + 3 });
  thing(g, side.top, '#ecc870', { seed: seed + 4, line: 1.4 });
  const cut = [[x, cy0 - ch], [x + cw * 0.9, cy0 - ch + 4], [x + cw * 0.9, cy0 - 4], [x, cy0 - 2]];
  thing(g, cut, '#f4dc88', { seed: seed + 5, line: 1.4, sharp: true, hi: [x + 26, cy0 - 36, 14, 14], hiCol: '#fff4c0' });
  for (const [hx, hy, h2] of [[x + 20, cy0 - 40, 5], [x + 38, cy0 - 22, 4], [x + 46, cy0 - 48, 3]]) { g.fillStyle = rgba('#c89a40', 0.8); g.beginPath(); g.ellipse(hx, hy, h2, h2 * 0.8, 0, 0, TAU); g.fill(); }
  // the glass dome: a faint wash, bright reflections, a fine outline, a knob on top
  const dome = smooth([[x - rr, y - 6], [x - rr, y - 70], [x - rr * 0.86, top + 40], [x - rr * 0.5, top + 8], [x, top], [x + rr * 0.5, top + 8], [x + rr * 0.86, top + 40], [x + rr, y - 70], [x + rr, y - 6]], false, 6);
  g.save(); g.fillStyle = 'rgba(220,232,240,0.14)'; path(g, dome); g.fill(); g.restore();
  shadeEdge(g, dome, { color: '#8090a0', alpha: 0.25, width: 12, dx: 3 });
  g.save(); g.lineCap = 'round';
  g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 5; g.beginPath(); g.moveTo(x - rr * 0.72, y - 40); g.quadraticCurveTo(x - rr * 0.78, top + 50, x - rr * 0.4, top + 20); g.stroke();
  g.lineWidth = 2.5; g.beginPath(); g.moveTo(x + rr * 0.7, y - 60); g.quadraticCurveTo(x + rr * 0.74, top + 54, x + rr * 0.56, top + 34); g.stroke();
  g.restore();
  penLine(g, dome, { w: 1.4, alpha: 0.55, color: '#4a5a6a', seed: seed + 6 });
  thing(g, ellipse(x, top - 6, 9, 7, 14), '#e8eef2', { seed: seed + 7, line: 1.1, hi: [x - 3, top - 8, 3, 2], hiCol: '#ffffff' });
}
// ---- the table (seen from just below its top), the oil lamp, a brown teapot and a loaf
function kitchenTable(g, seed) {
  const { x0, x1, top, legs } = KI.TABLE, r = rng(seed), pine = ['#c8a06a', '#d4ae78', '#b8905a'];
  // the back legs, a little smaller and in the shade under the table
  for (const [lx, ly] of legs.slice(2)) tableLeg(g, lx, top + 50, ly, 14, seed + lx, true);
  // things on the table (their feet hidden behind its edge)
  // the loaf on a board
  const lb = smooth([[830, top + 2], [826, top - 30], [850, top - 52], [906, top - 56], [948, top - 40], [954, top + 2]]);
  thing(g, lb, '#c88a48', { seed: seed + 1, line: 1.6, sdx: -10, sw: 16, blooms: ['#d89a58', '#a86a30'], hi: [880, top - 44, 30, 8], hiCol: '#f0c080' });
  for (let k = 0; k < 4; k++) ink(g, [[848 + k * 24, top - 40 - (k % 2) * 6], [862 + k * 24, top - 52 - (k % 2) * 4]], { width: 2, alpha: 0.6, seed: seed + 2 + k });
  // the brown teapot
  const tx = 740, tp = smooth([[tx - 46, top], [tx - 54, top - 30], [tx - 40, top - 60], [tx + 40, top - 60], [tx + 54, top - 30], [tx + 46, top]]);
  thing(g, tp, '#6a3a24', { seed: seed + 10, line: 1.7, sdx: -10, sw: 20, blooms: ['#7a4a2c', '#5a2e1c'], hi: [tx - 18, top - 40, 12, 10], hiCol: '#c8805a' });
  thing(g, ribbon([[tx + 50, top - 30], [tx + 72, top - 46], [tx + 84, top - 68]], 12, 6), '#6a3a24', { seed: seed + 11, line: 1.4 });
  g.strokeStyle = rgba(INKC, 0.75); g.lineWidth = 7; g.beginPath(); g.arc(tx - 56, top - 34, 18, 1.8, 4.6); g.stroke(); g.strokeStyle = rgba('#6a3a24', 1); g.lineWidth = 5; g.stroke();
  thing(g, ellipse(tx, top - 62, 30, 7, 20), '#7a4a2c', { seed: seed + 12, line: 1.3 }); thing(g, ellipse(tx, top - 72, 7, 6, 12), '#6a3a24', { seed: seed + 13, line: 1.1 });
  // the oil lamp: a brass foot and font, a glass chimney (the flame is live)
  const { x: lx, y: ly } = KI.LAMP;
  g.save(); g.translate(lx, ly); g.scale(1.35, 1.35); g.translate(-lx, -ly);
  const foot = smooth([[lx - 30, ly], [lx - 24, ly - 10], [lx - 8, ly - 16], [lx - 8, ly - 30], [lx - 30, ly - 46], [lx - 34, ly - 62], [lx - 20, ly - 74], [lx + 20, ly - 74], [lx + 34, ly - 62], [lx + 30, ly - 46], [lx + 8, ly - 30], [lx + 8, ly - 16], [lx + 24, ly - 10], [lx + 30, ly]]);
  thing(g, foot, '#c8a04a', { seed: seed + 20, line: 1.6, sdx: 10, sw: 14, blooms: ['#d8b05a', '#a8803a'], hi: [lx - 12, ly - 58, 6, 10], hiCol: '#fff0b0', hiA: 0.7 });
  thing(g, R4(lx - 14, ly - 86, lx + 14, ly - 74), '#a8803a', { seed: seed + 21, line: 1.3, sharp: true });
  const ch = smooth([[lx - 14, ly - 86], [lx - 22, ly - 104], [lx - 20, ly - 120], [lx - 10, ly - 132], [lx - 10, ly - 178], [lx + 10, ly - 178], [lx + 10, ly - 132], [lx + 20, ly - 120], [lx + 22, ly - 104], [lx + 14, ly - 86]], false, 5);
  g.save(); g.fillStyle = 'rgba(236,240,236,0.3)'; path(g, ch); g.fill(); g.restore();
  shadeEdge(g, ch, { color: '#6a7a80', alpha: 0.35, width: 6, dx: -3, dy: 0 });
  penLine(g, ch, { w: 1.4, alpha: 0.8, color: '#3a4a50', seed: seed + 22 });
  g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(lx - 15, ly - 104); g.quadraticCurveTo(lx - 16, ly - 118, lx - 6, ly - 130); g.lineTo(lx - 6, ly - 170); g.stroke();
  g.lineWidth = 1.4; g.beginPath(); g.moveTo(lx + 16, ly - 108); g.quadraticCurveTo(lx + 16, ly - 120, lx + 6, ly - 134); g.stroke();
  ink(g, [[lx - 6, ly - 88], [lx, ly - 96], [lx + 6, ly - 88]], { color: '#2a1a10', width: 2.4, alpha: 0.9, seed: seed + 23 }); // the wick holder
  g.restore();
  // the table top's front edge and the apron with its drawer, seen from below
  const edge = R4(x0, top, x1, top + 22), under = [[x0 + 6, top + 22], [x1 - 6, top + 22], [x1 - 20, top + 30], [x0 + 20, top + 30]];
  wood(g, edge, ['#e2caa0', '#d8bc90', '#ecd8b4'], { seed: seed + 30, n: 12, line: 2, hi: [(x0 + x1) / 2, top + 6, 200, 6] });
  thing(g, under, '#6a5038', { seed: seed + 31, line: 1.2, layers: 6 });
  const apron = R4(x0 + 26, top + 30, x1 - 26, top + 74);
  wood(g, apron, pine, { seed: seed + 32, n: 12, line: 1.8, sdy: 12, sw: 20, sa: 0.5 });
  thing(g, R4(660, top + 36, 820, top + 68), '#c09662', { seed: seed + 33, line: 1.4, sharp: true });
  g.fillStyle = rgba('#5a3a22', 0.9); g.beginPath(); g.arc(740, top + 52, 6, 0, TAU); g.fill();
  // the dark under the table
  g.save(); g.globalCompositeOperation = 'multiply'; pool(g, (x0 + x1) / 2, top + 220, (x1 - x0) * 0.55, 200, '#4a3828', 0.5); g.restore();
  // the back stretcher and the front legs
  thing(g, R4(legs[2][0], 676, legs[3][0], 686), '#8a6a42', { seed: seed + 34, line: 1.3, sharp: true, layers: 6 });
  for (const [lx2, ly2] of legs.slice(0, 2)) tableLeg(g, lx2, top + 74, ly2, 16, seed + 40 + lx2, false);
}
function tableLeg(g, x, y0, y1, w, seed, back) { // a turned leg: a square block, rings and a long taper to a little foot
  const L = y1 - y0, P = (v, k) => [x + k * w, y0 + v * L];
  const prof = [[0, 0.82], [0.14, 0.82], [0.16, 0.6], [0.19, 0.86], [0.22, 0.6], [0.3, 0.7], [0.46, 0.62], [0.82, 0.42], [0.88, 0.5], [0.92, 0.38], [0.97, 0.44], [1, 0.42]];
  const sh = prof.map(([v, k]) => P(v, -k)).concat(prof.slice().reverse().map(([v, k]) => P(v, k)));
  thing(g, sh, back ? '#9a7448' : '#c09662', { seed, line: back ? 1.3 : 1.8, sdx: 7, sw: w * 0.8, sa: 0.45, hi: [x - w * 0.25, y0 + L * 0.5, w * 0.16, L * 0.32], hiCol: '#f0d0a0', hiA: back ? 0.2 : 0.45 });
  for (const v of [0.16, 0.22, 0.88, 0.92]) ink(g, [P(v, -0.6), P(v + 0.004, 0), P(v, 0.6)], { width: 1, alpha: 0.5, seed: seed + v * 100 });
}
// ---- the wall clock (a drop-dial school clock: round face, a little case below with a window for the pendulum)
function wallClock(g, seed) {
  const { x, y, pivot, len } = KI.CLOCK, rr = 62;
  pool(g, x + 8, y + 70, 80, 160, '#6a5038', 0.25);
  const trunk = smooth([[x - 36, y + 40], [x + 36, y + 40], [x + 36, pivot[1] + len + 20], [x + 10, pivot[1] + len + 44], [x - 10, pivot[1] + len + 44], [x - 36, pivot[1] + len + 20]], true, 2);
  thing(g, trunk, '#7a4028', { seed: seed + 1, line: 1.8, sdx: -8, sw: 14, blooms: ['#8a4a30', '#6a3420'] });
  grain(g, trunk, '#3a1a10', { seed: seed + 2, n: 12, ang: Math.PI / 2, alpha: 0.3 });
  const win = R4(x - 20, pivot[1] - 6, x + 20, pivot[1] + len + 14);
  thing(g, win, '#2e2018', { seed: seed + 3, line: 1.4, sharp: true });
  g.save(); path(g, win); g.clip(); g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 16, pivot[1] + 40); g.lineTo(x - 4, pivot[1]); g.stroke(); g.restore();
  const surround = ellipse(x, y, rr + 12, rr + 12, 40);
  thing(g, surround, '#8a4a2e', { seed: seed + 4, line: 1.8, sdx: -6, sw: 12, blooms: ['#9a5a38', '#7a3e24'], hi: [x - 30, y - 30, 20, 16], hiCol: '#c88a5a' });
  const face = ellipse(x, y, rr, rr, 40);
  thing(g, face, '#f4ecd8', { seed: seed + 5, line: 1.4, hi: [x - 18, y - 18, 30, 24], hiCol: '#fffaf0' });
  g.strokeStyle = rgba(INKC, 0.8); g.fillStyle = rgba(INKC, 0.85); g.font = 'italic 13px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const nums = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  for (let k = 0; k < 60; k++) { const a = (k / 60) * TAU - Math.PI / 2, r0 = k % 5 ? rr - 6 : rr - 10; g.lineWidth = k % 5 ? 0.7 : 1.6; g.beginPath(); g.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); g.lineTo(x + Math.cos(a) * (rr - 3), y + Math.sin(a) * (rr - 3)); g.stroke(); }
  for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU - Math.PI / 2; g.fillText(nums[k], x + Math.cos(a) * (rr - 20), y + Math.sin(a) * (rr - 20)); }
  // the hands (about ten to nine) and the brass bezel
  const hand = (a, L, w) => penLine(g, [[x - Math.cos(a) * 8, y - Math.sin(a) * 8], [x + Math.cos(a) * L, y + Math.sin(a) * L]], { w, alpha: 0.9, color: '#2a1a14', weight: (t) => 1.2 - t * 0.8 });
  hand((50 / 60) * TAU - Math.PI / 2, rr - 12, 3); hand((8.83 / 12) * TAU - Math.PI / 2, rr - 28, 4.4);
  g.fillStyle = rgba('#2a1a14', 0.95); g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill();
  g.strokeStyle = rgba('#c8a050', 0.9); g.lineWidth = 3; g.beginPath(); g.arc(x, y, rr + 1, 0, TAU); g.stroke();
}
// ---- the mouse door in the skirting (a tiny arch with a little wooden door, ajar)
function kitchenMouseDoor(g, seed) {
  const { x, y, w, h } = KI.MOUSE_DOOR;
  const hole = doorArch(x, y, w, h, 12);
  thing(g, doorArch(x, y + 1, w + 10, h + 6, 12), '#c8b896', { seed: seed + 1, line: 1.2 });
  thing(g, hole, '#1e140e', { seed: seed + 2, line: 1.5 });
  const door = [[x - w / 2 + 1, y - 1], [x - w / 2 + 1, y - h + w / 2 + 2], [x - w / 2 + 6, y - h + 6], [x + w / 2 - 14, y - h + 6], [x + w / 2 - 12, y - 2]];
  thing(g, smooth(door, true, 2), '#9a6a40', { seed: seed + 3, line: 1.3, sdx: -3, sw: 5 });
  ink(g, [[x - 4, y - h + 8], [x - 4, y - 2]], { width: 0.8, alpha: 0.5, seed: seed + 4 });
  g.fillStyle = rgba('#4a7aa0', 0.95); g.beginPath(); g.arc(x + w / 2 - 17, y - h * 0.42, 2, 0, TAU); g.fill();
}
// ---- the chimney recess (brick, sooty), the oak mantel beam and the things on it
function recess(g, seed) {
  const { x0, x1, top } = KI.RECESS, r = rng(seed);
  const arch = [[x0, KI.floorY], [x0, top + 40], [x0 + 60, top + 12], [(x0 + x1) / 2, top], [x1 - 60, top + 12], [x1, top + 40], [x1, KI.floorY]];
  const inner = smooth(arch, false, 4).concat([[x1, KI.floorY], [x0, KI.floorY]]);
  wash(g, inner, { color: '#5a3a2c', opacity: 0.97, seed, under: true, layers: 10, bleed: 0.005 });
  g.save(); path(g, inner); g.clip();
  for (let yy = KI.floorY, row = 0; yy > top - 20; yy -= 26, row++) for (let xx = x0 - (row % 2) * 30; xx < x1; xx += 62) {
    const col = r.pick(['#8a4a34', '#7a4030', '#9a5a40', '#6a3828']);
    g.fillStyle = rgba(col, 0.85); g.fillRect(xx + 2, yy - 24, 58, 22);
    g.strokeStyle = rgba('#2a1a14', 0.4); g.lineWidth = 1; g.strokeRect(xx + 2, yy - 24, 58, 22);
  }
  // soot, darkest above the range
  g.globalCompositeOperation = 'multiply';
  pool(g, (x0 + x1) / 2, top + 60, 380, 220, '#1a1410', 0.8); pool(g, 1410, 300, 120, 200, '#1a1410', 0.6);
  g.restore();
  shadeEdge(g, inner, { color: '#1a1008', alpha: 0.5, width: 50, dx: 0, dy: 20 });
  penLine(g, smooth(arch, false, 4), { w: 2.2, alpha: 0.8, seed: seed + 1 });
  // the flue going up into the dark
  const flue = R4(1388, top - 10, 1432, KI.RANGE.top);
  thing(g, flue, '#2e2a2c', { seed: seed + 2, line: 1.6, sharp: true, sdx: -6, sw: 12, hi: [1400, 300, 5, 80], hiCol: '#7a7a88', hiA: 0.4 });
  for (const yy of [260, 360]) thing(g, R4(1384, yy, 1436, yy + 8), '#3a3438', { seed: seed + yy, line: 1.2, sharp: true });
}
function mantel(g, seed) {
  const { x0, x1, top } = KI.RECESS, r = rng(seed);
  const beam = R4(x0 - 30, top - 52, x1 + 30, top + 4);
  timber(g, beam, seed, 0, { sdy: 16, sw: 30, nails: 0, knots: 1, n: 30 });
  // a shelf board on top, with candlesticks, a tea caddy and a stoneware jar of spills
  const sh = R4(x0 - 44, top - 64, x1 + 44, top - 50); wood(g, sh, ['#7a5434', '#8a6040'], { seed: seed + 1, n: 8, line: 1.8, sdy: 4, sw: 6 });
  const st = top - 64;
  for (const cx of [x0 + 40, x1 - 40]) {
    const cs = smooth([[cx - 18, st], [cx - 14, st - 6], [cx - 5, st - 10], [cx - 4, st - 40], [cx - 10, st - 46], [cx + 10, st - 46], [cx + 4, st - 40], [cx + 5, st - 10], [cx + 14, st - 6], [cx + 18, st]]);
    thing(g, cs, '#c8a04a', { seed: seed + cx, line: 1.4, sdx: -4, sw: 6, hi: [cx - 3, st - 26, 2, 10], hiCol: '#fff0b0' });
    thing(g, R4(cx - 6, st - 86, cx + 6, st - 46), '#f2ead6', { seed: seed + cx + 1, line: 1.2, sharp: true });
    ink(g, [[cx, st - 86], [cx + 1, st - 94]], { width: 1.6, alpha: 0.9, seed: seed + cx + 2 });
  }
  const tc = R4(1240, st - 54, 1290, st); thing(g, tc, '#a8402e', { seed: seed + 3, line: 1.6, sharp: true, sdx: -5, sw: 8 });
  g.strokeStyle = rgba('#e0b850', 0.85); g.lineWidth = 2; g.strokeRect(1246, st - 44, 38, 34); thing(g, R4(1236, st - 62, 1294, st - 54), '#8a3020', { seed: seed + 4, line: 1.2, sharp: true });
  const jar = smooth([[1540, st], [1534, st - 30], [1540, st - 44], [1580, st - 44], [1586, st - 30], [1580, st]]);
  thing(g, jar, '#c8b896', { seed: seed + 5, line: 1.4, sdx: -6, sw: 8 });
  for (let k = 0; k < 5; k++) ink(g, [[1552 + k * 5, st - 44], [1548 + k * 7, st - 78 - (k % 2) * 8]], { color: '#e8d0a0', width: 2.2, alpha: 0.9, seed: seed + 10 + k });
  // a china plate standing at the back, and a little brass jug
  plate(g, 1450, st - 38, 34, seed + 20, '#4a6aa8');
  const bj = smooth([[1356, st], [1350, st - 18], [1360, st - 34], [1384, st - 34], [1392, st - 18], [1386, st]]); thing(g, bj, '#c8a04a', { seed: seed + 21, line: 1.3, hi: [1364, st - 20, 4, 8], hiCol: '#fff0b0' });
}
// ---- the black range: two oven doors, the firebox with its grate in the middle, a brass rail with a tea towel,
// a kettle and a saucepan on the hob, the hearth stone and a fender in front
const IRON = ['#2e2a2e', '#3a3438', '#262226', '#423c42'];
function ironPiece(g, sh, seed, o = {}) {
  wash(g, sh, { color: IRON[0], opacity: 0.97, seed, under: true, layers: 8, bleed: 0.004, edge: 0.3 });
  blooms(g, sh, IRON.slice(1), { n: 4, seed: seed + 1, alpha: 0.45, size: 0.3 });
  if (o.hi) glaze(g, sh, ...o.hi, '#8a8a9a', o.hiA ?? 0.4);
  shadeEdge(g, sh, { color: '#0e0a0c', alpha: 0.5, width: o.sw || 16, dx: o.sdx ?? 0, dy: o.sdy ?? -6 });
  penLine(g, sh, { closed: true, w: o.line ?? 1.8, alpha: 0.85, color: '#141012', seed: seed + 2, sharp: o.sharp ?? true });
  if (o.bevel) penLine(g, o.bevel, { closed: true, w: 1.4, alpha: 0.55, color: '#8a8896', seed: seed + 3, sharp: true });
}
function range(g, seed) {
  const { x0, x1, top, y, fire } = KI.RANGE, r = rng(seed);
  // the hearth stone
  const hs = [[x0 - 40, y - 4], [x1 + 40, y - 4], [x1 + 56, y + 30], [x0 - 56, y + 30]];
  thing(g, hs, '#a49a8a', { seed: seed + 1, line: 1.8, sharp: true, blooms: ['#b4aa98', '#948a7a'], sdy: -6, sw: 10 });
  // the body
  ironPiece(g, R4(x0, top, x1, y), seed + 2, { hi: [x0 + 60, top + 120, 60, 200], hiA: 0.25, sw: 30, sdx: -10 });
  // the hob plate (its front edge; we are below it) and the plinth
  ironPiece(g, R4(x0 - 14, top - 14, x1 + 14, top + 6), seed + 3, { hi: [x0 + 100, top - 6, 140, 4] });
  ironPiece(g, R4(x0 - 6, y - 20, x1 + 6, y), seed + 4);
  // oven doors with embossed panels and brass knobs
  for (const [dx0, dx1] of [[x0 + 14, fire.x0 - 16], [fire.x1 + 16, x1 - 14]]) {
    const d = R4(dx0, top + 40, dx1, y - 56), p = R4(dx0 + 14, top + 56, dx1 - 14, y - 72);
    ironPiece(g, d, seed + dx0, { bevel: p, hi: [dx0 + 30, top + 80, 30, 50], hiA: 0.3 });
    g.strokeStyle = rgba('#7a7888', 0.5); g.lineWidth = 1.2; g.beginPath(); g.ellipse((dx0 + dx1) / 2, (top + y) / 2 - 10, 26, 18, 0, 0, TAU); g.stroke();   // a cast rosette
    const kx = dx0 < fire.x0 ? dx1 - 20 : dx0 + 20, ky = (top + y) / 2 - 10;
    thing(g, ellipse(kx, ky, 9, 9, 14), '#d0a850', { seed: seed + dx0 + 1, line: 1.2, hi: [kx - 3, ky - 3, 3, 3], hiCol: '#fff4c0', hiA: 0.8 });
    for (const hy of [top + 56, y - 72]) thing(g, R4(dx0 < fire.x0 ? dx0 - 4 : dx1 - 6, hy, dx0 < fire.x0 ? dx0 + 6 : dx1 + 4, hy + 18), '#5a5258', { seed: seed + hy, line: 1, sharp: true });
  }
  // the firebox: its opening (dark, with coals; the glow is painted per mood and live), and the ash door below
  const fb = R4(fire.x0, fire.y0, fire.x1, fire.y1);
  wash(g, fb, { color: '#2a1410', opacity: 0.98, seed: seed + 20, under: true, layers: 6 });
  for (let k = 0; k < 14; k++) { const cx = r.range(fire.x0 + 8, fire.x1 - 8), cy = r.range(fire.y1 - 34, fire.y1 - 6); thing(g, ellipse(cx, cy, r.range(8, 14), r.range(5, 9), 12), r.pick(['#3a2018', '#4a2418', '#2e1a14']), { seed: seed + 30 + k, line: 0.9, layers: 4 }); }
  penLine(g, fb, { closed: true, w: 2.4, alpha: 0.9, color: '#141012', sharp: true, seed: seed + 21 });
  ironPiece(g, R4(fire.x0 - 4, fire.y1 + 30, fire.x1 + 4, y - 28), seed + 22, { bevel: R4(fire.x0 + 8, fire.y1 + 38, fire.x1 - 8, y - 36) });
  for (let k = 0; k < 5; k++) thing(g, R4(fire.x0 + 14 + k * 18, fire.y1 + 46, fire.x0 + 24 + k * 18, y - 44), '#141012', { seed: seed + 40 + k, line: 0, layers: 3 });   // the ash door's vents
  // the brass towel rail with a checked tea towel
  penLine(g, [[x0 - 10, top + 26], [x1 + 10, top + 26]], { w: 6, color: '#c8a04a', alpha: 0.95, seed: seed + 50, weight: () => 1 });
  ink(g, [[x0 - 8, top + 24], [x1 + 8, top + 24]], { color: '#fff0b0', width: 1.4, alpha: 0.7, seed: seed + 51 });
  const tw = smooth([[1220, top + 20], [1300, top + 20], [1302, top + 110], [1292, top + 124], [1262, top + 118], [1230, top + 126], [1218, top + 112]]);
  wash(g, tw, { color: '#eae4d8', opacity: 0.97, seed: seed + 52, under: true, layers: 8 });
  g.save(); path(g, tw); g.clip(); g.fillStyle = rgba('#4a6aa0', 0.4); for (let xx = 1218; xx < 1310; xx += 16) g.fillRect(xx, top, 8, 140); for (let yy = top + 20; yy < top + 130; yy += 16) g.fillRect(1210, yy, 100, 8); g.restore();
  shadeEdge(g, tw, { color: '#3a3040', alpha: 0.35, width: 12, dx: 6 }); penLine(g, tw, { closed: true, w: 1.5, alpha: 0.75, seed: seed + 53 });
  // the kettle (left) and a saucepan (right) on the hob
  const kx = 1290, kb = top - 14, kt = smooth([[kx - 52, kb], [kx - 58, kb - 30], [kx - 44, kb - 62], [kx - 20, kb - 72], [kx + 20, kb - 72], [kx + 44, kb - 62], [kx + 58, kb - 30], [kx + 52, kb]]);
  ironPiece(g, kt, seed + 60, { sharp: false, hi: [kx - 22, kb - 48, 14, 14], hiA: 0.5, sdx: 10, sw: 20 });
  ironPiece(g, ribbon([[kx - 50, kb - 34], [kx - 78, kb - 58], [kx - 92, kb - 80]], 14, 7), seed + 61, { sharp: false });
  g.strokeStyle = rgba('#141012', 0.85); g.lineWidth = 6; g.beginPath(); g.arc(kx, kb - 70, 38, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.strokeStyle = rgba('#5a5460', 0.7); g.lineWidth = 2; g.stroke();
  thing(g, ellipse(kx, kb - 74, 14, 5, 12), '#3a3438', { seed: seed + 62, line: 1.1 });
  const px = 1520, pb = top - 14, pan = R4(px - 44, pb - 50, px + 44, pb);
  thing(g, pan, '#b86a44', { seed: seed + 63, line: 1.6, sharp: true, sdx: -8, sw: 14, hi: [px - 20, pb - 26, 8, 16], hiCol: '#f0a878', blooms: ['#c87850', '#a85a38'] });
  thing(g, R4(px - 48, pb - 56, px + 48, pb - 48), '#c87850', { seed: seed + 64, line: 1.3, sharp: true });
  thing(g, ribbon([[px + 46, pb - 44], [px + 120, pb - 52]], 8, 7), '#3a3438', { seed: seed + 65, line: 1.2 });
  // the fender: a low brass rail on the hearth
  penLine(g, [[x0 - 30, y + 18], [x1 + 30, y + 18]], { w: 5, color: '#b89040', alpha: 0.9, seed: seed + 70, weight: () => 1 });
  for (const fx of [x0 - 30, x1 + 30]) thing(g, ellipse(fx, y + 18, 7, 7, 12), '#c8a04a', { seed: seed + fx, line: 1.1 });
}
// the grate's bars (painted alone, drawn live over the fire's glow)
function grateBars(g, seed) {
  const { fire } = KI.RANGE;
  for (let k = 0; k <= 6; k++) { const xx = lerp(fire.x0 + 6, fire.x1 - 6, k / 6); thing(g, R4(xx - 3.5, fire.y0 + 4, xx + 3.5, fire.y1 - 4), '#1e1a1c', { seed: seed + k, line: 1, sharp: true, layers: 3, hi: [xx - 1, (fire.y0 + fire.y1) / 2, 1, 30], hiCol: '#6a6470', hiA: 0.5 }); }
  for (const yy of [fire.y0 + 26, fire.y0 + 54]) thing(g, R4(fire.x0 + 2, yy - 3, fire.x1 - 2, yy + 3), '#1e1a1c', { seed: seed + yy, line: 1, sharp: true, layers: 3 });
  // the firebox's frame
  const fr = R4(fire.x0 - 10, fire.y0 - 10, fire.x1 + 10, fire.y1 + 10), inn = R4(fire.x0, fire.y0, fire.x1, fire.y1);
  g.save(); g.beginPath(); for (const pp of [fr, inn]) { g.moveTo(...pp[0]); for (const p of pp.slice(1)) g.lineTo(...p); g.closePath(); } g.clip('evenodd'); ironPiece(g, fr, seed + 20, { hi: [fire.x0, fire.y0 - 6, 60, 4] }); g.restore();
  penLine(g, inn, { closed: true, w: 2, alpha: 0.9, color: '#141012', sharp: true, seed: seed + 21 });
}
// ---- copper pans on the right-hand wall, a ladle, and the herbs drying from the beam above
function copperPans(g, seed) {
  penLine(g, [[1712, 214], [W + M, 214]], { w: 5, color: '#4a3a2e', alpha: 0.9, seed, weight: () => 1 });
  for (const [x, y, rr] of KI.PANS) {
    const i = KI.PANS.findIndex((p) => p[0] === x);
    ink(g, [[x, 212], [x, y + 4]], { color: '#3a2a20', width: 2.2, alpha: 0.9, seed: seed + x });
    const hd = ribbon([[x, y], [x, y + rr * 0.9]], 10, 12); thing(g, hd, '#a85a34', { seed: seed + x + 1, line: 1.3 });
    const body = ellipse(x, y + rr * 0.9 + rr, rr, rr, 36);
    thing(g, body, '#c0703e', { seed: seed + x + 2, line: 1.8, blooms: ['#d8885a', '#a85a30', '#e0a070'], sdx: -12, sw: rr * 0.5, sa: 0.5, hi: [x - rr * 0.35, y + rr * 1.5, rr * 0.25, rr * 0.4], hiCol: '#ffd0a0', hiA: 0.7 });
    g.strokeStyle = rgba('#7a3a1c', 0.5); g.lineWidth = 1.2; g.beginPath(); g.arc(x, y + rr * 1.9, rr * 0.8, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(255,220,180,0.6)'; g.lineWidth = 2.5; g.beginPath(); g.arc(x, y + rr * 1.9, rr * 0.62, Math.PI * 1.05, Math.PI * 1.45); g.stroke();
    if (i === 2) g.globalAlpha = 1;
  }
  // a ladle
  ink(g, [[1910, 212], [1910, 360]], { color: '#9a9aa4', width: 5, alpha: 0.95, seed: seed + 9 });
  thing(g, ellipse(1910, 372, 20, 16, 16), '#a8a8b2', { seed: seed + 10, line: 1.4, hi: [1904, 366, 6, 4], hiCol: '#ffffff' });
}
function herbs(g, seed) {
  const r = rng(seed);
  for (const [x, L, kind] of [[478, 110, 'lav'], [548, 150, 'sage'], [918, 96, 'ros'], [990, 60, 'garlic'], [1720, 120, 'sage']]) {
    ink(g, [[x, -MY], [x + r.gauss(0, 2), L - 40]], { color: '#8a7a5a', width: 1.4, alpha: 0.8, seed: seed + x });
    const y = L - 40;
    if (kind === 'garlic') { for (let k = 0; k < 4; k++) { const gy = y + k * 26, gx = x + (k % 2 ? 8 : -8); thing(g, smooth([[gx - 14, gy + 8], [gx - 12, gy - 6], [gx, gy - 16], [gx + 12, gy - 6], [gx + 14, gy + 8], [gx, gy + 16]]), '#f0e6d0', { seed: seed + x + k, line: 1.2, sdx: -4, sw: 6 }); for (const dx of [-5, 0, 5]) ink(g, [[gx + dx, gy - 10], [gx + dx * 1.4, gy + 12]], { width: 0.7, alpha: 0.4, seed: seed + k + dx }); } continue; }
    const col = kind === 'lav' ? ['#8a7ab0', '#a090c0', '#6a8a5a'] : kind === 'ros' ? ['#5a7a5a', '#6a8a64', '#4a6a4a'] : ['#8a9a7a', '#9aaa88', '#7a8a6a'];
    for (let k = 0; k < 14; k++) { // stems hanging down, flowers/leaves at the bottom
      const a = Math.PI / 2 + r.gauss(0, 0.22), len = r.range(50, 90), ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len;
      ink(g, [[x, y], [ex, ey]], { color: '#6a7a4a', width: 1.1, alpha: 0.8, seed: seed + x + k });
      if (kind === 'lav') for (let q = 0; q < 5; q++) { g.fillStyle = rgba(r.pick(col.slice(0, 2)), 0.85); g.beginPath(); g.ellipse(ex + r.gauss(0, 1.5), ey - q * 4, 3, 2.4, 0, 0, TAU); g.fill(); }
      else for (let q = 0; q < 4; q++) { const lx = lerp(x, ex, 0.3 + q * 0.2), ly = lerp(y, ey, 0.3 + q * 0.2); g.fillStyle = rgba(r.pick(col), 0.8); g.beginPath(); g.ellipse(lx + (q % 2 ? 5 : -5), ly, kind === 'ros' ? 6 : 8, kind === 'ros' ? 1.8 : 4, q % 2 ? 0.8 : -0.8, 0, TAU); g.fill(); }
    }
    thing(g, R4(x - 7, y - 6, x + 7, y + 6), '#c8a878', { seed: seed + x + 30, line: 1.1, layers: 4 });   // the tie
  }
}
// ---- the rag rug: a braided oval of old rags in many soft colours
function ragRug(g, seed) {
  const { x, y, rx, ry } = KI.RUG, r = rng(seed);
  g.save(); g.globalCompositeOperation = 'multiply'; pool(g, x, y + 10, rx * 1.08, ry * 1.4, '#4a3a2e', 0.45); g.restore();
  const cols = ['#a86a58', '#7a8a96', '#c8b088', '#8a7a8e', '#8a9a76', '#d4c0a0', '#9a7458', '#6a7488', '#b89070'];
  const rings = 11;
  for (let k = rings; k >= 1; k--) {
    const f = k / rings, sh = ellipse(x, y, rx * f, ry * f, 60);
    wash(g, sh, { color: cols[(k * 3) % cols.length], opacity: 0.95, seed: seed + k, layers: 6, bleed: 0.004, edge: 0.3, under: k === rings });
  }
  // the braid: little slanted ticks along each ring
  for (let k = 1; k <= rings; k++) {
    const f = (k - 0.5) / rings, n = Math.round(60 + 140 * f);
    g.strokeStyle = rgba('#3a2a20', 0.35); g.lineWidth = 1;
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU, px = x + Math.cos(a) * rx * f, py = y + Math.sin(a) * ry * f, tx = -Math.sin(a), ty = Math.cos(a) * ry / rx; g.beginPath(); g.moveTo(px - tx * 3 - 1.5, py - ty * 3 - 2); g.lineTo(px + tx * 3 + 1.5, py + ty * 3 + 2); g.stroke(); }
    g.strokeStyle = rgba('#3a2a20', 0.3); g.beginPath(); g.ellipse(x, y, rx * k / rings, ry * k / rings, 0, 0, TAU); g.stroke();
  }
  shadeEdge(g, ellipse(x, y, rx, ry, 60), { color: '#3a2a20', alpha: 0.3, width: 20, dy: -8 });
  penLine(g, ellipse(x, y, rx, ry, 60), { closed: true, w: 1.8, alpha: 0.7, seed: seed + 40 });
}
// ---- foreground: a sack of flour and a besom broom (left), a basket of logs (right)
function flourSackAndBroom(g, seed) {
  const r = rng(seed);
  // the broom leaning against the end of the dresser, its twigs on the floor
  const hx0 = 424, hy0 = 300, hx1 = 456, hy1 = 676;
  thing(g, ribbon([[hx0, hy0], [hx1, hy1]], 12, 12), '#b08a5a', { seed: seed + 1, line: 1.6, sdx: 4, sw: 6, hi: [lerp(hx0, hx1, 0.4) - 2, lerp(hy0, hy1, 0.4), 2, 120], hiCol: '#e8c890' });
  const tw = smooth([[hx1 - 16, hy1 - 20], [hx1 + 14, hy1 - 22], [hx1 + 46, KI.floorY + 50], [hx1 + 20, KI.floorY + 62], [hx1 - 26, KI.floorY + 60], [hx1 - 40, KI.floorY + 46]]);
  wash(g, tw, { color: '#a88a50', opacity: 0.95, seed: seed + 2, under: true, layers: 8 });
  g.save(); path(g, tw); g.clip(); for (let k = 0; k < 70; k++) { const u = r(); ink(g, [[lerp(hx1 - 12, hx1 + 12, u), hy1 - 20], [lerp(hx1 - 40, hx1 + 46, u) + r.gauss(0, 4), KI.floorY + 62]], { color: r() < 0.5 ? '#6a5028' : '#d8bc80', width: 1, alpha: 0.6, wobble: 1.4, seed: seed + 10 + k }); } g.restore();
  for (const yy of [hy1 - 6, hy1 + 6]) penLine(g, [[hx1 - 16, yy], [hx1 + 16, yy - 2]], { w: 3, color: '#6a3a24', alpha: 0.9, seed: seed + yy, weight: () => 1 });
  penLine(g, tw, { closed: true, w: 1.6, alpha: 0.75, seed: seed + 3 });
  // the sack, slumped, its neck tied and folded over, a faded blue stencil
  g.save(); g.globalCompositeOperation = 'multiply'; pool(g, 130, 1004, 190, 28, '#3a2e24', 0.5); g.restore();
  const sack = smooth([[-60, 1010], [-70, 900], [-40, 800], [10, 760], [70, 740], [150, 748], [214, 790], [250, 870], [262, 960], [240, 1014], [100, 1026]]);
  thing(g, sack, '#d8c8a0', { seed: seed + 4, line: 2.2, sdx: -18, sw: 50, sa: 0.45, blooms: ['#e4d6b0', '#c8b48a', '#d0bc94'], hi: [80, 860, 60, 70], hiCol: '#f4ecd4' });
  g.save(); path(g, sack); g.clip(); g.strokeStyle = rgba('#8a7a58', 0.25); g.lineWidth = 1;
  for (let k = 0; k < 60; k++) { g.beginPath(); g.moveTo(-80, 740 + k * 5); g.lineTo(280, 750 + k * 5); g.stroke(); }
  for (let k = 0; k < 70; k++) { g.beginPath(); g.moveTo(-80 + k * 5, 740); g.lineTo(-70 + k * 5, 1030); g.stroke(); }
  g.fillStyle = rgba('#5a6a90', 0.5); g.font = 'bold 44px Georgia, serif'; g.textAlign = 'center'; g.save(); g.translate(96, 912); g.rotate(-0.06); g.fillText('FLOUR', 0, 0); g.restore();
  g.restore();
  for (let k = 0; k < 5; k++) ink(g, [[20 + k * 40, 780 + (k % 2) * 6], [10 + k * 44, 900 + (k % 3) * 20]], { width: 1.2, alpha: 0.35, seed: seed + 40 + k });   // creases
  const neck = smooth([[40, 770], [70, 700], [120, 690], [150, 716], [140, 760], [90, 770]]);
  thing(g, neck, '#d0bc94', { seed: seed + 5, line: 1.8, sdx: -6, sw: 14 });
  penLine(g, [[64, 742], [146, 736]], { w: 5, color: '#8a6a3a', alpha: 0.9, seed: seed + 6, weight: () => 1 });
  ink(g, [[100, 740], [116, 770], [108, 800]], { color: '#8a6a3a', width: 2.4, alpha: 0.9, seed: seed + 7 });
  // a little spill of flour on the flagstones
  g.save(); g.globalAlpha = 0.6; wash(g, smooth([[250, 1000], [300, 990], [350, 1006], [320, 1020], [260, 1018]]), { color: '#f4ecdc', opacity: 0.7, seed: seed + 8, layers: 6, edge: 0.1 }); g.restore();
}
function logBasket(g, seed) {
  const r = rng(seed), x = 1880, y = 960;
  g.save(); g.globalCompositeOperation = 'multiply'; pool(g, x, y + 6, 220, 30, '#3a2e24', 0.5); g.restore();
  // logs sticking up
  for (const [lx, ly, a, L, rr] of [[1760, 760, -0.3, 120, 26], [1840, 740, 0.1, 140, 30], [1930, 752, 0.35, 130, 28], [1990, 770, 0.6, 110, 24]]) {
    const ex = lx + Math.sin(a) * L, ey = ly + Math.cos(a) * L;
    const log = ribbon([[lx, ly], [ex, ey]], rr * 2, rr * 2);
    thing(g, log, '#7a6048', { seed: seed + lx, line: 1.6, sdx: 6, sw: 14, blooms: ['#8a7058', '#6a5038'] });
    hatch(g, log, { color: '#3a2a1e', count: 40, len: 18, width: 1, alpha: 0.5, seed: seed + lx + 1, dir: () => Math.PI / 2 - a });
    const end = ellipse(lx, ly, rr, rr * 0.7, 20, a);
    thing(g, end, '#d8b888', { seed: seed + lx + 2, line: 1.4 });
    g.strokeStyle = rgba('#8a6a48', 0.6); g.lineWidth = 1; for (const k of [0.65, 0.35]) { g.beginPath(); g.ellipse(lx, ly, rr * k, rr * 0.7 * k, a, 0, TAU); g.stroke(); }
  }
  // the wicker basket
  const bk = smooth([[1700, 830], [W + M + 20, 820], [W + M + 20, 1000], [1730, 990]]);
  wash(g, bk, { color: '#b89058', opacity: 0.97, seed: seed + 1, under: true, layers: 10 });
  g.save(); path(g, bk); g.clip();
  for (let yy = 820; yy < 1010; yy += 12) for (let xx = 1690 + ((yy / 12) % 2) * 10; xx < W + M + 20; xx += 20) { g.fillStyle = rgba(r.pick(['#c8a068', '#a88048', '#d0aa70']), 0.9); g.beginPath(); g.ellipse(xx, yy, 9, 5, 0.2, 0, TAU); g.fill(); g.strokeStyle = rgba('#5a4028', 0.5); g.lineWidth = 1; g.stroke(); }
  for (let xx = 1700; xx < W + M; xx += 20) { g.strokeStyle = rgba('#6a4a28', 0.4); g.lineWidth = 2; g.beginPath(); g.moveTo(xx, 820); g.lineTo(xx + 6, 1000); g.stroke(); }
  g.restore();
  shadeEdge(g, bk, { color: '#3a2818', alpha: 0.5, width: 50, dx: 20, dy: -10 });
  penLine(g, bk, { closed: true, w: 2.2, alpha: 0.85, seed: seed + 2 });
  const rim = ribbon([[1696, 830], [1900, 818], [W + M + 20, 818]], 18, 18); thing(g, rim, '#a8804a', { seed: seed + 3, line: 1.8, sdy: -4, sw: 8 });
}

function kitchenBackdrop(g) {
  tm('k.wall', () => kitchenWall(g, 1300));
  tm('k.window', () => windowFrame(g, 1320));
  tm('k.floor', () => flagstones(g, 1340));
  tm('k.recess', () => recess(g, 1360));
  tm('k.door', () => kitchenMouseDoor(g, 1380));
  tm('k.rug', () => ragRug(g, 1390));
}
function kitchenObjects(g) {
  tm('k.mantel', () => mantel(g, 1400));
  tm('k.range', () => range(g, 1420));
  tm('k.pans', () => copperPans(g, 1440));
  tm('k.clock', () => wallClock(g, 1460));
  tm('k.dresser', () => dresser(g, 1480));
  tm('k.cheese', () => cheeseCloche(g, 1500));
  tm('k.herbs', () => herbs(g, 1540));
}
function kitchenFront(g) {
  tm('k.sack', () => flourSackAndBroom(g, 1600));
  tm('k.basket', () => logBasket(g, 1620));
}
const KITCHEN_FRONT_BOXES = [{ x0: -M, y0: 240, x1: 540, y1: H + MY }, { x0: 1680, y0: 700, x1: W + M, y1: H + MY }];
const TABLE_BOX = { x0: 440, y0: 180, x1: 1030, y1: 810 };
const KITCHEN_LIGHT = {
  evening: {
    amb: '#6a4a3a', ambK: 0.78, cols: ['#5a3c30', '#7a5644', '#6a4838', '#4e3a32'], seed: 31,
    lights: [{ x: KLAMP[0], y: KLAMP[1] + 140, rx: 900, ry: 640, inner: 0.15 }, { x: KFIRE[0], y: KFIRE[1] + 160, rx: 520, ry: 340, inner: 0.15, a: 0.8 }],
    glows: [{ x: KLAMP[0], y: KLAMP[1] + 40, rx: 560, ry: 420, col: '#f0a050', a: 0.18 }, { x: KLAMP[0], y: KLAMP[1], rx: 160, ry: 160, col: '#ffd890', a: 0.3 },
      { x: KFIRE[0], y: KFIRE[1] + 200, rx: 360, ry: 220, col: '#e87a30', a: 0.18 }],
    soft: 'rgba(255,170,100,0.12)',
    spriteGlows: [{ x: KLAMP[0], y: KLAMP[1], rx: 260, ry: 300, col: '#f0a050', a: 0.3 }],
  },
  night: {
    amb: '#2c3268', ambK: 0.95, cols: ['#262c5e', '#363c78', '#2c3062', '#3a3a74'], seed: 32, strokes: 60,
    lights: [{ x: 760, y: 600, rx: 520, ry: 520, a: 0.45, inner: 0.1 }, { x: 760, y: 860, rx: 360, ry: 140, a: 0.55, inner: 0.2 }, { x: KFIRE[0], y: KFIRE[1] + 220, rx: 460, ry: 300, a: 0.75, inner: 0.15 }],
    glows: [{ x: KFIRE[0], y: KFIRE[1] + 250, rx: 380, ry: 200, col: '#d86828', a: 0.22 }, { x: KFIRE[0], y: KFIRE[1] + 30, rx: 200, ry: 160, col: '#e06a28', a: 0.2 }],
    soft: 'rgba(40,46,120,0.3)',
    spriteGlows: [{ x: 745, y: 200, rx: 200, ry: 300, col: '#5a6aa8', a: 0.25 }],
  },
};
// evening: the lamp's light pooling on the table, the dresser and the floor; the fire burning low
function eveningLight(g) {
  const { fire } = KI.RANGE;
  g.save(); g.globalCompositeOperation = 'screen'; g.filter = `blur(${8 * RES}px)`;
  g.fillStyle = 'rgba(255,150,60,0.32)'; g.fillRect(fire.x0, fire.y0, fire.x1 - fire.x0, fire.y1 - fire.y0);
  g.filter = 'none'; g.restore();
  g.save(); g.globalCompositeOperation = 'screen'; pool(g, KFIRE[0], KI.RANGE.y + 60, 300, 70, '#f08a40', 0.25); g.restore();
}
// night: moonlight through the window falling on the floor in front of the table (the panes' shapes), the embers
function nightLight(g) {
  const { fire } = KI.RANGE;
  g.save(); g.globalCompositeOperation = 'screen';
  g.filter = `blur(${5 * RES}px)`;
  const sk = (x, y) => [x - 60 + (y - 760) * -0.5 + (x - 745) * 1.25, y];       // the panes' light, skewed onto the floor
  for (const [a, c, b, d] of windowPanes()) {
    if (c < 0) continue;
    const ya = 770 + (c / 360) * 120, yb = 770 + (d / 360) * 120;
    const p = [sk(a, ya), sk(b, ya), sk(b, yb), sk(a, yb)];
    g.fillStyle = 'rgba(150,170,240,0.32)'; path(g, p); g.fill();
  }
  g.filter = `blur(${24 * RES}px)`; g.fillStyle = 'rgba(110,130,220,0.12)';
  g.beginPath(); g.moveTo(KI.WINDOW.x0, 0); g.lineTo(KI.WINDOW.x1, 0); g.lineTo(980, 900); g.lineTo(560, 900); g.closePath(); g.fill();
  // the moon catching the edges: the table's edge, the sill, the cloche, the kettle
  g.filter = `blur(${2 * RES}px)`; g.fillStyle = 'rgba(190,206,255,0.4)';
  g.fillRect(KI.WINDOW.reveal[0] - 20, KI.WINDOW.sill, KI.WINDOW.reveal[1] - KI.WINDOW.reveal[0] + 40, 5);
  g.fillRect(KI.TABLE.x0 + 10, KI.TABLE.top + 1, KI.TABLE.x1 - KI.TABLE.x0 - 20, 4);
  // embers: a deep red in the firebox, a warm pool on the hearth and the rug
  g.filter = `blur(${10 * RES}px)`; g.fillStyle = 'rgba(230,90,30,0.6)'; g.fillRect(fire.x0, fire.y1 - 40, fire.x1 - fire.x0, 40);
  g.filter = 'none';
  pool(g, KFIRE[0], KI.RANGE.y + 40, 260, 60, '#e0702c', 0.3);
  g.restore();
}

let KITL = null;
// Both moods of the kitchen, painted once: { evening: { back, front, bars }, night: { ... } }. back: a 2x layer
// (drawH); front: foreground pieces (the chair, the log basket); bars: the grate's bars (drawn over the fire's glow).
export function kitchenLayers() {
  if (KITL) return KITL;
  const bd = tm('k.backdrop', () => hpaint(kitchenBackdrop));
  const ob = tm('k.objects', () => hpaint(kitchenObjects));
  const fr = tm('k.front', () => hpaint(kitchenFront));
  const tb = tm('k.table', () => hpaint((g) => kitchenTable(g, 1520)));
  const gb = hpaint((g) => grateBars(g, 1700));
  for (const c of [fr, tb]) { const g = c.getContext('2d'); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); granulate(g, c.width, c.height, 0.2, 9); g.restore(); }
  KITL = {};
  for (const mood of ['evening', 'night']) {
    const back = hcanvas(), g = back.getContext('2d');
    g.drawImage(bd, 0, 0);
    g.setTransform(RES, 0, 0, RES, M * RES, MY * RES);
    // shadows on the floor: under the dresser, the range's plinth, the table's legs (from the lamp, or the moon)
    g.save(); g.globalCompositeOperation = 'multiply';
    pool(g, 250, KI.DRESSER.y + 6, 260, 26, '#3a2a20', 0.5); pool(g, 1410, KI.RANGE.y + 36, 300, 22, '#2a2020', 0.5);
    for (const [lx, ly] of KI.TABLE.legs) floorShadow(g, lx, ly, mood === 'evening' ? lx - KLAMP[0] : -60, mood === 'evening' ? 30 : 60, mood === 'evening' ? 120 : 90, 26, mood === 'evening' ? '#3a2418' : '#1e2040', 0.5, 4);
    g.restore();
    g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(ob, 0, 0); g.drawImage(tb, 0, 0);
    tm('k.light', () => lightPass(back, KITCHEN_LIGHT[mood]));
    g.setTransform(RES, 0, 0, RES, M * RES, MY * RES);
    windowSky(g, mood);
    if (mood === 'night') nightLight(g); else eveningLight(g);
    g.setTransform(1, 0, 0, 1, 0, 0); tm('k.granulate', () => granulate(g, back.width, back.height, 0.2, 7));
    const lit = (src, sd) => { const c = hcanvas(false); c.getContext('2d').drawImage(src, 0, 0); lightPass(c, { ...KITCHEN_LIGHT[mood], mask: true, seed: sd }); return c; };
    const fl = lit(fr, 41), bl = lit(gb, 42), tl = lit(tb, 43);
    const f = KI.RANGE.fire;
    KITL[mood] = { back: to8(back), table: pieces(tl, [TABLE_BOX]), front: pieces(fl, KITCHEN_FRONT_BOXES), bars: pieces(bl, [{ x0: f.x0 - 14, y0: f.y0 - 14, x1: f.x1 + 14, y1: f.y1 + 14 }]), mood };
    free(back); free(fl); free(bl); free(tl);
  }
  free(bd); free(ob); free(fr); free(gb); free(tb);
  return KITL;
}

// ---------------------------------------------------------------- kitchen: live things
// the fire in the range: evening a low fire (flames flicking behind the bars), night just embers breathing.
// k: 0..1 strength. Draw it after the back layer (it draws the grate's bars over itself).
export function embers(g, t, mood = 'evening', k = 1) {
  const { fire } = KI.RANGE, L = kitchenLayers()[mood];
  if (k > 0) {
    const f = 0.8 + 0.2 * noise1(t * 0.9, 51) * (0.7 + 0.3 * noise1(t * 2.7, 52));
    g.save(); g.beginPath(); g.rect(fire.x0, fire.y0, fire.x1 - fire.x0, fire.y1 - fire.y0); g.clip(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) { // glowing coals pulsing one by one
      const cx = lerp(fire.x0 + 10, fire.x1 - 10, (i + 0.5) / 9) + Math.sin(i * 3.1) * 4, cy = fire.y1 - 10 - (i % 3) * 7;
      const a = (0.25 + 0.35 * noise1(t * 0.6 + i * 1.7, 53)) * k * f;
      pool(g, cx, cy, 16, 10, mood === 'night' ? '#e04a18' : '#ff7a28', a);
    }
    if (mood === 'evening') for (let i = 0; i < 4; i++) { // little flames licking up
      const fx = lerp(fire.x0 + 16, fire.x1 - 16, i / 3), hh = (18 + 16 * noise1(t * 2.2 + i * 2.3, 54)) * k;
      g.fillStyle = `rgba(255,170,70,${0.28 * k})`; g.beginPath(); g.moveTo(fx - 8, fire.y1 - 8); g.quadraticCurveTo(fx - 6, fire.y1 - 8 - hh * 0.6, fx + Math.sin(t * 3 + i) * 4, fire.y1 - 8 - hh); g.quadraticCurveTo(fx + 6, fire.y1 - 8 - hh * 0.6, fx + 8, fire.y1 - 8); g.fill();
    }
    g.restore();
    g.save(); g.globalCompositeOperation = 'lighter';
    pool(g, KFIRE[0], fire.y1 + 10, 140, 60, mood === 'night' ? '#c04a18' : '#e07028', 0.1 * k * f);
    pool(g, KFIRE[0], KI.RANGE.y + 60, 300, 70, '#c85a20', 0.06 * k * f);    // on the hearth and the rug
    g.restore();
  }
  drawPieces(g, L.bars);
}
// the lamp on the table: its flame (live) and the glow round it, flickering softly. k: 0..1 (0 = out)
export function lampGlow(g, t, k = 1) {
  if (k <= 0.01) return;
  const [x, y] = KLAMP, f = flicker(t, 5) * k;
  g.save(); g.globalCompositeOperation = 'lighter';
  pool(g, x, y + 40, 620, 460, '#ff9a40', 0.05 * f);
  pool(g, x, y, 120, 110, '#ffcc80', 0.16 * f);
  g.restore();
  // the flame inside the chimney: small and steady (a lamp, not a candle)
  const h = 40 * (0.94 + 0.06 * (f - 0.86) / 0.1), sway = (noise1(t * 1.3, 55) - 0.5) * 2.5;
  g.save();
  const grd = g.createLinearGradient(0, y - h * 0.6, 0, y + h * 0.4);
  grd.addColorStop(0, `rgba(255,190,90,0)`); grd.addColorStop(0.3, `rgba(255,200,110,${0.9 * k})`); grd.addColorStop(0.7, `rgba(255,240,190,${0.95 * k})`); grd.addColorStop(1, `rgba(140,160,230,${0.6 * k})`);
  g.fillStyle = grd; g.beginPath(); g.moveTo(x - 12, y + h * 0.4); g.quadraticCurveTo(x - 13, y - h * 0.1, x + sway, y - h * 0.6); g.quadraticCurveTo(x + 13, y - h * 0.1, x + 12, y + h * 0.4); g.closePath(); g.fill();
  g.fillStyle = `rgba(255,252,236,${0.8 * k})`; g.beginPath(); g.ellipse(x + sway * 0.3, y, 5, h * 0.22, 0, 0, TAU); g.fill();
  g.restore();
}
// the clock's pendulum swinging behind its little glass window (one swing a second: tick, tock)
export function pendulum(g, t, mood = 'evening') {
  const { pivot, len } = KI.CLOCK, a = 0.16 * Math.sin(t * Math.PI);
  g.save(); g.beginPath(); g.rect(pivot[0] - 19, pivot[1] - 5, 38, len + 18); g.clip();
  g.translate(pivot[0], pivot[1]); g.rotate(a);
  g.strokeStyle = mood === 'night' ? 'rgba(90,90,120,0.9)' : 'rgba(150,120,70,0.95)'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, len - 8); g.stroke();
  g.fillStyle = mood === 'night' ? '#6a6a8a' : '#d0a850'; g.beginPath(); g.arc(0, len, 11, 0, TAU); g.fill();
  g.fillStyle = mood === 'night' ? 'rgba(200,210,255,0.4)' : 'rgba(255,244,200,0.8)'; g.beginPath(); g.arc(-3.5, len - 3.5, 3.4, 0, TAU); g.fill();
  g.strokeStyle = rgba(INKC, 0.7); g.lineWidth = 1.2; g.beginPath(); g.arc(0, len, 11, 0, TAU); g.stroke();
  g.restore();
}
// steam curling from the kettle's spout (evening)
export function kettleSteam(g, t, k = 1) {
  if (k <= 0) return;
  const sx = 1198, sy = 330;
  g.save(); g.lineCap = 'round';
  for (let s = 0; s < 4; s++) {
    const ph = ((t * 0.18 + s / 4) % 1), a = Math.sin(ph * Math.PI) * 0.22 * k;
    if (a < 0.01) continue;
    const pts = []; for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([sx - 30 * u - ph * 50 + Math.sin(u * 5 + t * 0.8 + s) * (6 + 14 * u), sy - u * 70 - ph * 90]); }
    for (let i = 1; i < pts.length; i++) { g.strokeStyle = `rgba(250,244,236,${a * (1 - i / pts.length)})`; g.lineWidth = 4 + i * 0.8; g.beginPath(); g.moveTo(...pts[i - 1]); g.lineTo(...pts[i]); g.stroke(); }
  }
  g.restore();
}
// the moon crossing the window slowly (night), and a few stars in the panes; drawn inside the panes only
export function moonPos(t) { const { x0, x1, y } = KI.MOON, u = (t * 0.0025) % 1; return [lerp(x0, x1, u), y + Math.sin(u * Math.PI) * -18 + u * 30]; }
export function kitchenMoon(g, t, k = 1, mood = 'night') {
  if (k <= 0) return;
  g.save(); g.beginPath(); for (const [a, c, b, d] of windowPanes()) g.rect(a, c, b - a, d - c); g.clip();
  g.globalCompositeOperation = 'lighter';
  const r = rng(88);
  for (let i = 0; i < 9; i++) {
    const x = r.range(KI.WINDOW.x0 + 6, KI.WINDOW.x1 - 6), y = r.range(-30, 250), tw = 0.5 + 0.5 * Math.sin(t * r.range(0.4, 0.9) + i * 2);
    const a = k * (mood === 'night' ? 0.7 : (i < 2 ? 0.6 : 0)) * tw; if (a < 0.02) continue;
    pool(g, x, y, 4, 4, '#fff8e0', a);
  }
  g.globalCompositeOperation = 'source-over';
  if (mood === 'night') {
    const [mx, my] = moonPos(t);
    g.globalCompositeOperation = 'lighter'; pool(g, mx, my, 120, 120, '#a8b8e8', 0.25 * k); g.globalCompositeOperation = 'source-over';
    g.globalAlpha = k; g.fillStyle = '#f6eed6'; g.beginPath(); g.arc(mx, my, 30, 0, TAU); g.fill();
    g.fillStyle = 'rgba(214,200,170,0.5)'; for (const [dx, dy, rr] of [[-0.3, -0.2, 0.22], [0.25, 0.3, 0.15], [0.1, -0.4, 0.1]]) { g.beginPath(); g.arc(mx + dx * 30, my + dy * 30, rr * 30, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(120,110,90,0.4)'; g.lineWidth = 1; g.beginPath(); g.arc(mx, my, 30, 0, TAU); g.stroke();
  }
  g.restore();
}
// a moth fluttering round the lamp (evening)
export function moth(g, t, at = KLAMP, seed = 3) {
  const a = t * 1.3 + seed, x = at[0] + Math.cos(a) * 70 + (noise1(t * 1.6, seed) - 0.5) * 50, y = at[1] - 20 + Math.sin(a * 1.4) * 50 + (noise1(t * 1.9, seed + 4) - 0.5) * 30;
  const flap = Math.abs(Math.sin(t * 20));
  g.save(); g.translate(x, y); g.fillStyle = 'rgba(240,226,196,0.9)';
  for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(sd * 3.4 * flap, -0.5, 4 * (0.4 + 0.6 * flap), 3, sd * 0.4, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(110,90,70,0.85)'; g.beginPath(); g.ellipse(0, 0.5, 1.2, 3, 0, 0, TAU); g.fill();
  g.restore();
}
// a faint warm line of candlelight under the mouse door (the mice are at home; evening), k: 0..1
export function mouseDoorGlow(g, t, k = 1) {
  if (k <= 0) return;
  const { x, y, w, h } = KI.MOUSE_DOOR, f = flicker(t, 9);
  g.save(); g.globalCompositeOperation = 'lighter';
  pool(g, x + w / 2 - 12, y - h * 0.45, 5, h * 0.4, '#ffb060', 0.5 * k * f);
  pool(g, x + 4, y + 4, 26, 6, '#ffa050', 0.25 * k * f);
  g.restore();
}

// The whole kitchen for one frame. c: camera (see view()). mood: 'evening' | 'night'. o:
//   actors(g)  the cat, mice (after the room, before the foreground chair and basket); after(g): on top of all
//   lamp: 0..1 (default 1 evening, 0 night); fire: 0..1; curtains: sway amount (default 1); moon: 0..1 (night)
//   doorGlow: 0..1 (the candle's light under the mouse door; default 1 evening)
export function drawKitchen(g, t, c, mood = 'evening', o = {}) {
  const L = kitchenLayers()[mood];
  drawH(g, c, L.back);
  cam(g, c, 1);
  kitchenMoon(g, t, o.moon ?? 1, mood);
  drawCurtains(g, t, mood, o.curtains ?? 1);
  drawPieces(g, L.table);
  embers(g, t, mood, o.fire ?? 1);
  pendulum(g, t, mood);
  if (mood === 'evening') { kettleSteam(g, t, o.steam ?? 1); mouseDoorGlow(g, t, o.doorGlow ?? 1); }
  if (o.actors) o.actors(g);
  drawPieces(g, L.front);
  const lampK = o.lamp ?? (mood === 'evening' ? 1 : 0);
  lampGlow(g, t, lampK);
  if (mood === 'evening' && o.moth !== false) moth(g, t);
  if (o.after) o.after(g);
}

// ================================================================ THE IMAGINATION VIGNETTE (the young mouse's idea)
// A storybook thought bubble: a cloud of paper with a scalloped, softly inked edge, a little painted scene inside (a
// warm dusk, a floor and a rag rug: the cat with her bell is drawn there by the stager, with o.inside), and three
// little bubbles trailing back to the thinker. Everything is cached per size; per frame it only scales and fades.
const BUB = {};
function bubbleOutline(cx, cy, rx, ry, seed) {
  const r = rng(seed), n = Math.max(9, Math.round((rx + ry) / 42)), pts = [];
  const ph = r() * TAU;
  for (let i = 0; i < 240; i++) {
    const a = (i / 240) * TAU, s = Math.abs(Math.sin((a * n) / 2 + ph)), bump = Math.pow(s, 0.55);
    const k = 0.9 + 0.12 * bump + 0.015 * Math.sin(a * 3 + seed);
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return pts;
}
// the inner oval where the picture is (local to the bubble's middle): use it to place the cat
export function bubbleInner(w, h) { return { rx: w * 0.39, ry: h * 0.36 }; }
function bubbleSprites(w, h) {
  const key = `${Math.round(w)}x${Math.round(h)}`;
  if (BUB[key]) return BUB[key];
  const rx = w / 2, ry = h / 2, cx = 0, cy = 0, seed = 7000 + Math.round(w + h);
  const outline = bubbleOutline(cx, cy, rx, ry, seed), inn = bubbleInner(w, h);
  const box = { x0: -rx - 30, y0: -ry - 30, x1: rx + 30, y1: ry + 40, w: w + 60, h: h + 70 };
  // the paper cloud and the painted background inside it
  const back = sprite(box, 1.6, (g) => {
    g.save(); g.filter = 'blur(10px)'; g.fillStyle = 'rgba(70,45,30,0.28)'; path(g, outline.map(([x, y]) => [x + 8, y + 12])); g.fill(); g.restore();
    wash(g, outline, { color: '#f7f0e2', opacity: 1, seed, under: '#f7f0e2', bleed: 0.004, layers: 8, edge: 0.15 });
    blooms(g, outline, ['#f0dcc8', '#e4e0ec', '#f4e6cc'], { n: 8, seed: seed + 1, alpha: 0.35, size: 0.25 });
    // the little scene: a warm rosy dusk above, a floor below, a rag rug in the middle, stars
    const sc = ellipse(cx, cy, inn.rx, inn.ry, 60);
    g.save(); path(g, sc); g.clip();
    const lg = g.createLinearGradient(0, -inn.ry, 0, inn.ry); lg.addColorStop(0, '#c8b8d8'); lg.addColorStop(0.45, '#f0cdb0'); lg.addColorStop(0.62, '#e8c49a'); lg.addColorStop(1, '#c89a70');
    g.fillStyle = lg; g.fillRect(-inn.rx, -inn.ry, inn.rx * 2, inn.ry * 2);
    blooms(g, sc, ['#e8b8a8', '#d8c8e0', '#f4d8b0', '#c8a080'], { n: 9, seed: seed + 2, alpha: 0.4, size: 0.3 });
    const fy = cy + inn.ry * 0.2;
    wash(g, [[-inn.rx, fy], [inn.rx, fy - 4], [inn.rx, inn.ry + 4], [-inn.rx, inn.ry + 4]], { color: '#b88a60', opacity: 0.7, seed: seed + 3, layers: 8, bleed: 0.01 });
    for (let k = 0; k < 6; k++) ink(g, [[-inn.rx + k * inn.rx * 0.4, fy + 4], [-inn.rx * 1.3 + k * inn.rx * 0.5, inn.ry]], { width: 1, alpha: 0.3, seed: seed + 10 + k });
    const rr = ellipse(cx, fy + inn.ry * 0.38, inn.rx * 0.62, inn.ry * 0.17, 40);
    wash(g, rr, { color: '#b8706a', opacity: 0.8, seed: seed + 4, layers: 8 });
    for (const k of [0.8, 0.6, 0.4, 0.2]) { g.strokeStyle = rgba(['#7a8aa0', '#d8b878', '#8aa078', '#e8c8a8'][Math.round(k * 5) % 4], 0.8); g.lineWidth = 4; g.beginPath(); g.ellipse(cx, fy + inn.ry * 0.38, inn.rx * 0.62 * k, inn.ry * 0.17 * k, 0, 0, TAU); g.stroke(); }
    const r = rng(seed + 5);
    for (let k = 0; k < 7; k++) { const sx = r.range(-inn.rx * 0.8, inn.rx * 0.8), sy = r.range(-inn.ry * 0.85, -inn.ry * 0.25); g.fillStyle = 'rgba(255,250,230,0.85)'; g.beginPath(); for (let q = 0; q < 8; q++) { const a = q * Math.PI / 4, d = q % 2 ? 1.6 : 5; g.lineTo(sx + Math.cos(a) * d, sy + Math.sin(a) * d); } g.closePath(); g.fill(); }
    g.restore();
  }, { grain: 0.15, seed });
  // the edge on top of whatever is painted inside: the picture fades into the paper, then the inked scallops
  const edge = sprite(box, 1.6, (g) => {
    const sc = ellipse(cx, cy, inn.rx, inn.ry, 60);
    g.save(); g.beginPath(); for (const pp of [outline, sc]) { g.moveTo(...pp[0]); for (const p of pp.slice(1)) g.lineTo(...p); g.closePath(); } g.clip('evenodd');
    wash(g, outline, { color: '#f7f0e2', opacity: 1, seed: seed + 6, under: '#f7f0e2', bleed: 0.004, layers: 6, edge: 0 });
    blooms(g, outline, ['#f0dcc8', '#e4e0ec', '#f4e6cc'], { n: 8, seed: seed + 1, alpha: 0.35, size: 0.25 });
    g.restore();
    // a soft feathered ring so the picture melts into the paper
    g.save(); g.translate(cx, cy); g.scale(1, inn.ry / inn.rx);
    const gr = g.createRadialGradient(0, 0, inn.rx * 0.72, 0, 0, inn.rx * 1.01); gr.addColorStop(0, 'rgba(247,240,226,0)'); gr.addColorStop(1, 'rgba(247,240,226,1)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, inn.rx * 1.01, 0, TAU); g.fill(); g.restore();
    sketch(g, outline.filter((_, i) => i % 3 === 0), { closed: true, alpha: 0.6, width: 1.6, seed: seed + 7 });
    ink(g, ellipse(cx, cy, inn.rx * 1.02, inn.ry * 1.02, 60), { closed: true, width: 0.9, alpha: 0.25, gaps: 1.4, seed: seed + 8 });
  }, { grain: 0.15, seed: seed + 9 });
  return (BUB[key] = { back, edge, outline });
}
const PUFF = {};
function puffSprite(rad) {
  const key = Math.round(rad);
  if (PUFF[key]) return PUFF[key];
  const o = bubbleOutline(0, 0, rad, rad * 0.86, 7100 + key);
  return (PUFF[key] = sprite({ x0: -rad - 10, y0: -rad - 10, x1: rad + 10, y1: rad + 16, w: rad * 2 + 20, h: rad * 2 + 26 }, 1.6, (g) => {
    g.save(); g.filter = 'blur(5px)'; g.fillStyle = 'rgba(70,45,30,0.25)'; path(g, o.map(([x, y]) => [x + 4, y + 6])); g.fill(); g.restore();
    wash(g, o, { color: '#f7f0e2', opacity: 1, seed: 7200 + key, under: '#f7f0e2', layers: 6, edge: 0.15 });
    blooms(g, o, ['#f0dcc8', '#e4e0ec'], { n: 3, seed: 7300 + key, alpha: 0.3 });
    sketch(g, o.filter((_, i) => i % 4 === 0), { closed: true, alpha: 0.6, width: 1.3, seed: 7400 + key });
  }, { grain: 0.12, seed: 7500 + key }));
}
// Draw the thought bubble centred at (x, y), w x h, at time t, appearing with k (0 = gone, 1 = fully there: it swells
// gently from small, the little trailing bubbles first). o: { tail: [x, y] the thinker's head (the little bubbles run
// from there to the cloud), inside(g, s): paint the imagined picture in page coordinates around (x, y) (clipped to the
// inner oval, then softened into the paper; s is the bubble's current scale) }
export function drawThoughtBubble(g, x, y, w, h, t, k = 1, o = {}) {
  if (k <= 0) return;
  const B = bubbleSprites(w, h), inn = bubbleInner(w, h);
  const kb = clamp((k - 0.3) / 0.7), e = ease(kb), s = (0.7 + 0.3 * e) * (1 + 0.008 * Math.sin(t * 1.3)), bob = Math.sin(t * 0.9) * 3;
  if (o.tail) { // the little bubbles, from the thinker up to the cloud
    const [tx, ty] = o.tail, ex = x + (tx - x) * 0.62, ey = y + bob + (ty - y) * 0.62;
    for (let i = 0; i < 3; i++) {
      const a = clamp(k * 4 - i * 0.7), u = (i + 1) / 4;
      if (a <= 0) continue;
      const px = lerp(tx, ex, u), py = lerp(ty, ey, u) - Math.sin(u * Math.PI) * 18, rad = 9 + i * 7;
      g.save(); g.translate(px, py + Math.sin(t * 1.1 + i) * 1.5); g.scale(0.6 + 0.4 * ease(a), 0.6 + 0.4 * ease(a)); drawSprite(g, puffSprite(rad), ease(a)); g.restore();
    }
  }
  if (kb <= 0) return;
  g.save(); g.translate(x, y + bob); g.scale(s, s);
  drawSprite(g, B.back, e);
  if (o.inside) {
    g.save(); g.beginPath(); g.ellipse(0, 0, inn.rx, inn.ry, 0, 0, TAU); g.clip();
    g.globalAlpha *= e; g.translate(-x, -y);
    o.inside(g, s);
    g.restore();
  }
  drawSprite(g, B.edge, e);
  g.restore();
}
