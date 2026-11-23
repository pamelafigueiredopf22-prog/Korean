// BUTTERCUP, the gentle Jersey cow, drawn like a cow in a classic illustrated farm book: soft fawn coat (smoky brown on
// the face, round the eyes, over the hips and down the lower legs; pale on the belly and inside the legs), big dark kind
// eyes with long lashes and a pale ring, a dark wet nose in a pale band, ears sticking out sideways, tiny horn nubs, a
// soft forelock, a small pinkish udder tucked between the hind legs, a thin tail with a dark switch.
//
// HOW SHE IS BUILT (all internal geometry faces RIGHT, hooves on the ground at y = 0; the drawing is mirrored at the end)
//  - Proportions after a real Jersey (withers ~120-130 cm, point of shoulder to pin bone ~1.25x that, legs below the
//    belly ~45% of the withers height, head ~45-50% of the withers height): withers 300 units, body 381, belly 118-143 up.
//  - The body AND the neck are ONE continuous outline, a spline through anatomy landmarks that move with the pose:
//    withers, the dip of the back, the hook (hip) bones, tailhead, pin bones, the back of the thigh (which turns with the
//    near femur), stifle, flank, a round barrel lowest in the middle, the girth, the brisket between the forelegs, the
//    dewlap curving up the throat to the jaw; then from the poll down the crest of the neck to the withers.
//  - The legs are bones solved every frame (fore: shoulder joint -> elbow (goes back) -> knee (carpus) -> fetlock ->
//    pastern -> cloven hoof; hind: hip joint -> stifle (goes forward) -> HOCK (points back) -> cannon -> fetlock ->
//    hoof). The shoulder and thigh live inside the body outline; the near forearm and gaskin are inked as ONE outline with
//    the body (union ink: all outlines stroked wide, then all fills laid over), so the legs grow out of the silhouette.
//    The far legs are drawn behind, a little offset, showing their paler inner side in shadow.
//  - The head is a small 3D model (cranium, eye bumps, a narrower dished face, round cheeks, a broad muzzle, a chin on a
//    hinged jaw), each ellipsoid projected exactly to an ellipse; every feature (eyes, lashes, nostrils, nose pad, mouth,
//    ears, horn nubs, forelock) sits on that model, so a turn of the head is always ONE consistent view.
//
// FACING: drawn facing LEFT, hooves on the ground at y = 0 (withers 300 units up, about Molly's shoulder; nose to tail
// ~530 long). Mirror with scale(-1, 1). Walking moves the root LEFT.
//
//   const cow = makeCow(res, seed)
//   cow.draw(g, st) / cow.drawAt(g, poseFn, t, { since })    follow-through: the head lags a little, ears and the
//                                    tail (a chain with travelling delays) trail; planted hooves never lag
//   cow.STRIDE                       walk = distance / STRIDE, the root moves left by the distance
//   cow.hoovesAt(poseFn, t, o)       -> [hindFar, foreFar, hindNear, foreNear] {x, y, planted}
//   cow.udderAt(st, o)               -> {x, y, teats: [{x, y} x4]} (milking)
//   cow.noseAt / headAt / mouthAt(poseFn, t, o) -> {x, y}   (o = {x, y, scale, face}: page coordinates)
//   cow.shadow(g, st)
//
// ---- state (ease everything; weights 0..1)
//   t, life (idle: breathing, slow blinks, ear flicks, small head moves, tail swaying, swishes now and then)
//   eye 0..1 (default 0.9), happy 0..1 (content closed eyes), mouth 0..1, moo 0..1 (head up, a round "moo" mouth)
//   chew 0..1      chewing the cud: the jaw grinds side to side, cheeks working (automatic rhythm)
//   headTurn -1..1 (+ = the face turns toward us; - = more profile), lookBack 0..1 (the head comes round toward her own
//                  flank: toward someone milking her), nod (rad, + = nose up), headDown 0..1 (nose down: grazing,
//                  sniffing, or a nose lowered to be stroked)
//   earsBack 0..1, earFlick automatic;  tailSwish 0..1 (a bigger swish)
//   walk (cycles) + walkAmt 0..1   four-beat walk (near hind, near fore, far hind, far fore), distance-driven
//   lie 0..1       lie down in the straw: front knees fold first, then the hind end goes down (legs folded under, the
//                  near hock out behind, belly bulging on the straw); sleep 0..1 (eyes closed, chin down on the straw)
import { smooth, bbox, sprite, drawSprite, rgba, shade, tint, mix, clamp, lerp, ease, penLine, hatch, looseWash, wash,
  blooms, soften, path, ellipse, furEdge, pool, rng, shadeEdge } from '../watercolor.js';
import { PAPER, INK } from './kit.js';
import { TAU, fr, easeInOut, glance, event, kernel, makeFilter, ik2, taper } from './rig3.js';
import { fillSprite } from './folk3.js';

const FAWN = '#c6935e', LIGHT = '#e6c190', SMOKE = '#7c5233', DEEP = '#55361f', CREAM = '#f1e2c4', PALE = '#efe4cf';
const HOOF = '#2e2320', NOSEC = '#5c4a46', UDC = '#ebc6b2', TEAT = '#e0a296', SHADOW = '#4a2e1a';

// ---------------------------------------------------------------- body landmarks (standing, internal, facing right)
const W0 = [124, -306];                                     // withers
const TOP = [[96, -297], [56, -287], [4, -287], [-48, -292], [-84, -300], [-108, -306], [-134, -304], [-158, -303], [-178, -304], [-196, -292], [-205, -276]];
const THIGH = [[-204, -250, 0.2], [-200, -222, 0.5], [-192, -196, 0.8], [-180, -174, 1], [-164, -158, 1]];
const UNDER = [[-90, -168, 0.2], [-60, -144, 0.8], [-14, -124, 1], [34, -125, 1], [84, -144, 0.5], [116, -151, 0], [150, -153, 0], [182, -170, 0], [192, -188, 0]];
const SJ = [165, -200], HJ = [-148, -240];                  // shoulder joint, hip joint
const TAIL_ROOT = [-176, -300], TAIL_N = 14, TAIL_L = 205;
const H0 = [248, -294];                                     // cranium centre (standing)
const UDDER_AT = [-106, -142];
// legs: [name, root, hoof rest x, hind?, near?, phase]. Four-beat walk: near hind 0, near fore 0.25, far hind 0.5, far fore 0.75
const LEGS = [['hindFar', [HJ[0] + 10, HJ[1] - 3], -142, true, false, 0.5], ['foreFar', [SJ[0] + 8, SJ[1] - 3], 146, false, false, 0.75],
  ['hindNear', HJ, -156, true, true, 0], ['foreNear', SJ, 132, false, true, 0.25]];
const FORE = { up: 66, lo: 72, can: 54 }, HIND = { up: 100, lo: 80, can: 76 }, PAST = 17, CORO = 14;
export const STRIDE = 170;
const LIFT = 21;
export const walkRest = (p) => Math.ceil(p * 2 - 1e-6) / 2;
// one hoof in root space: [dx, lift, swing 0..1]; planted (stance) for q in [-0.02, 0.76)
function walkHoof(q) { q = fr(q + 0.02) - 0.02; if (q < 0.76) return [-STRIDE * (q - 0.37), 0, 0]; const u = (q - 0.76) / 0.24, s = Math.sin(Math.PI * u); return [-STRIDE * 0.39 + STRIDE * 0.78 * easeInOut(u), LIFT * s ** 0.8, s]; }

// ---------------------------------------------------------------- head model: local [f (poll -> nose), y (down, toward the jaw), l (her near side)]
const HS = 1.14;
const E = (c, r) => ({ c, r });
const CRAN = E([0, 0, 0], [39, 37, 43]), FACE = E([42, 5, 0], [28, 26, 28]), CHEEK = E([30, 18, 0], [36, 24, 33]);
const MUZ = E([73, 12, 0], [26, 30, 32]), CHIN = E([56, 29, 0], [32, 11, 21]);
const ORB = (sg) => E([24, 3, sg * 34], [14, 13, 11]);
const HINGE = [0, 24, 0];
const EYE_AT = (sg) => [26, 9, sg * 44], EYE_N = (sg) => nrm([0.28, -0.08, sg]), ER = 14;
const POLL = [-34, -14, 0], THROAT = [22, 38, 0], JAWB = [-12, 28, 0];

const DEF = { life: 1, eye: 0.84 };
const PHASES = new Set(['walk']);
const filtered = makeFilter(PHASES, DEF);
function solve(st, dl = 0) {
  const t = (st.t || 0) - dl, v = (k) => st[k] ?? DEF[k] ?? 0;
  const P = { bx: 0, hb: 0, sb: 0, bsx: 0, bsy: 0, br: 0, hx: 0, hy: 0, turn: v('headTurn'), back: clamp(v('lookBack')), nod: v('nod'), roll: 0,
    eye: v('eye'), happy: v('happy'), mouth: v('mouth'), moo: clamp(v('moo')), chew: clamp(v('chew')), jaw: 0, earBack: v('earsBack'), flN: 0, flF: 0,
    tSw: 0, tSwish: clamp(v('tailSwish')), lie: clamp(v('lie')), sleep: clamp(v('sleep')), down: clamp(v('headDown')), wa: clamp(v('walkAmt')) };
  const wa = P.wa;
  const busy = clamp(Math.max(wa * 0.5, P.lie * 0.6, P.moo, P.back));
  const life = clamp(v('life')) * (1 - busy);
  const g1 = glance(t, 3.7, 11, 1.0), g2 = glance(t + 1.7, 5.3, 13, 1.2);
  P.turn += life * 0.16 * g2; P.nod += life * 0.05 * g1; P.hx += life * 5 * g1; P.hy += life * 4 * g2; P.roll += life * 0.04 * g1;
  const bl = event(t, 4.6, 0.5, 21); if (!st.noBlink && bl >= 0) P.eye *= 1 - Math.sin(Math.PI * bl) ** 1.2;
  const eN = event(t + 1.1, 3.9, 0.45, 25), eF = event(t + 2.6, 5.1, 0.45, 27);
  if (eN >= 0) P.flN += Math.sin(Math.PI * eN) * Math.sin(eN * TAU * 2);
  if (eF >= 0) P.flF += Math.sin(Math.PI * eF) * Math.sin(eF * TAU * 2);
  const sw = event(t + 0.5, 6.3, 1.4, 29); if (sw >= 0) P.tSwish = Math.max(P.tSwish, Math.sin(Math.PI * sw));
  P.tSw = Math.sin(t * TAU * 0.21) * 0.5 + P.tSwish * Math.sin(t * TAU * 1.3) * 1.6;
  // chewing the cud: the jaw grinds round (sideways and a little down)
  if (P.chew > 0) { const c = t * TAU * 1.25; P.jaw = P.chew * Math.sin(c); P.mouth = Math.max(P.mouth, P.chew * 0.1 * (0.5 + 0.5 * Math.cos(c))); P.hy += P.chew * 1.2 * Math.cos(c); }
  if (wa > 0) { // hips rise over each hind leg, the withers over each fore leg; the head bobs as a fore hoof lands
    const ph = v('walk');
    P.hb = -wa * 4.5 * Math.cos(2 * TAU * (ph - 0.37)); P.sb = -wa * 3.5 * Math.cos(2 * TAU * (ph - 0.12));
    P.bsx = wa * 6 * Math.sin(TAU * ph); P.bsy = wa * 2.5 * Math.sin(2 * TAU * ph);
    P.hy += wa * (10 + 6 * Math.cos(2 * TAU * (ph - 0.78))); P.hx += wa * (8 + 4 * Math.sin(TAU * ph)); P.nod -= wa * 0.1;
    P.tSw += wa * 0.55 * Math.sin(TAU * ph + 1);
  }
  if (P.moo > 0) { P.nod += P.moo * 0.5; P.hy -= P.moo * 18; P.hx += P.moo * 16; P.mouth = Math.max(P.mouth, P.moo * (0.75 + 0.12 * Math.sin(t * 9))); P.eye *= 1 - 0.5 * P.moo; P.earBack += P.moo * 0.5; }
  if (P.down > 0) { P.nod -= P.down * 0.55; P.hy += P.down * 52; P.hx += P.down * 34; }
  if (P.back > 0) { const k = ease(P.back); P.turn += k * 3.8; P.hx -= k * 128; P.hy += k * 30; P.nod += k * 0.12; P.roll -= k * 0.22; }
  P.br = Math.sin(t * TAU * lerp(0.22, 0.14, P.sleep));
  P.lieF = ease(clamp(P.lie / 0.6)); P.lieR = ease(clamp((P.lie - 0.3) / 0.7));
  if (P.lie > 0) { P.hy += -P.lieF * 34 + P.lieR * 6; P.hx -= P.lieF * 18; P.nod += P.lieF * 0.08; P.tWrap = P.lieR; }
  if (P.sleep > 0) { const k2 = ease(P.sleep); P.eye *= 1 - ease(P.sleep / 0.6); P.hy += k2 * 120; P.hx += k2 * 38; P.nod += k2 * 0.5; P.chew *= 1 - k2; P.jaw *= 1 - k2;
    P.earBack += P.sleep * 0.6; P.turn += P.sleep * 0.35; P.roll += k2 * 0.1; P.happy *= 1 - P.sleep; P.tSw *= 1 - 0.8 * P.sleep; }
  return P;
}
const K = { head: kernel(2.4, 0.6, 0.6, 9), body: kernel(1.9, 0.6, 0.7, 9), ear: kernel(2.6, 0.3, 0.8, 9), tail: kernel(1.2, 0.35, 1.3, 9) };
const LAG = { head: 0.03, body: 0.05, ear: 0.08, tail: 0.12 };
const TAIL_DELAYS = [0, 0.12, 0.25, 0.4, 0.58];

// ---------------------------------------------------------------- small vector helpers
const nrm = (v) => { const d = Math.hypot(...v) || 1; return v.map((x) => x / d); };
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const rot2 = (p, c, a) => { const x = p[0] - c[0], y = p[1] - c[1], cs = Math.cos(a), sn = Math.sin(a); return [c[0] + x * cs - y * sn, c[1] + x * sn + y * cs]; };
const inPoly = (q, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0] - a[0]) * (q[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
const L2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);

// a soft limb outline along a smooth centre line: left edge, tip cap, right edge (reversed), root cap
function limb(pts, ws, seg = 5) {
  const c = smooth(pts, false, seg), n = c.length, L = [], R = [];
  const wAt = (t) => { const x = t * (ws.length - 1), i = Math.min(ws.length - 2, Math.floor(x)); return lerp(ws[i], ws[i + 1], x - i); };
  const tn = (i) => { const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; };
  for (let i = 0; i < n; i++) { const [dx, dy] = tn(i), w = wAt(i / (n - 1)) / 2; L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]); }
  const cap = (i, a0) => { const [dx, dy] = tn(i), w = wAt(i === 0 ? 0 : 1) / 2, o = []; for (let k = 1; k < 6; k++) { const a = a0(dx, dy) - Math.PI * k / 6; o.push([c[i][0] + Math.cos(a) * w, c[i][1] + Math.sin(a) * w]); } return o; };
  const tip = cap(n - 1, (dx, dy) => Math.atan2(dx, -dy)), root = cap(0, (dx, dy) => Math.atan2(-dx, dy));
  const Rr = R.slice().reverse();
  return { shape: L.concat(tip, Rr, root), open: L.concat(tip, Rr), line: c, L, R };
}
// a point and tangent at parameter s (0..1, by length) along a polyline
function along(line, s) {
  let tot = 0; const seg = []; for (let i = 1; i < line.length; i++) { const d = Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]); seg.push(d); tot += d; }
  let want = clamp(s) * tot, i = 0; while (i < seg.length - 1 && want > seg[i]) { want -= seg[i]; i++; }
  const k = seg[i] ? want / seg[i] : 0, a = line[i], b = line[i + 1] || a;
  const d = seg[i] || 1; return { p: [lerp(a[0], b[0], k), lerp(a[1], b[1], k)], t: [(b[0] - a[0]) / d, (b[1] - a[1]) / d] };
}

// draw() into an offscreen layer (same transform), then lay it down fading in from point a0 (transparent) to a1 (opaque)
let FADE_C = null;
function faded(g, box, a0, a1, draw) {
  const m = g.getTransform();
  const cs = [[box.x0, box.y0], [box.x1, box.y0], [box.x0, box.y1], [box.x1, box.y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  const bb = bbox(cs), X0 = Math.floor(bb.x0) - 2, Y0 = Math.floor(bb.y0) - 2, Wd = Math.ceil(bb.w) + 4, Hd = Math.ceil(bb.h) + 4;
  if (Wd < 2 || Hd < 2 || Wd > 4096 || Hd > 4096) return;
  if (!FADE_C) FADE_C = document.createElement('canvas');
  if (FADE_C.width < Wd || FADE_C.height < Hd) { FADE_C.width = Math.max(FADE_C.width, Wd); FADE_C.height = Math.max(FADE_C.height, Hd); }
  const o = FADE_C.getContext('2d');
  o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = 'source-over'; o.clearRect(0, 0, Wd + 2, Hd + 2);
  o.setTransform(m.a, m.b, m.c, m.d, m.e - X0, m.f - Y0);
  o.save(); draw(o); o.restore();
  o.globalCompositeOperation = 'destination-in';
  const gr = o.createLinearGradient(a0[0], a0[1], a1[0], a1[1]); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
  o.fillStyle = gr; o.fillRect(box.x0 - 60, box.y0 - 60, box.w + 120, box.h + 120);
  o.globalCompositeOperation = 'source-over';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(FADE_C, 0, 0, Wd, Hd, X0, Y0, Wd, Hd); g.restore();
}

export function makeCow(res = 2, seed = 91) {
  const s = (n) => seed * 100 + n;
  // ---- painted once: the coat (in body space), the face's coat, ears, udder, the switch
  const hairDir = (x, y) => Math.PI - 0.28 + 0.75 * clamp((y + 290) / 170) + (x > 140 ? 0.5 : 0);
  const COATBOX = [[-270, -430], [440, -430], [440, 30], [-270, 30]];
  const coat = sprite(bbox(COATBOX), res, (g) => {
    g.fillStyle = PAPER; g.fillRect(-290, -450, 750, 500);
    wash(g, COATBOX, { color: FAWN, opacity: 0.95, seed: s(10), layers: 30, edge: 0 });
    looseWash(g, COATBOX, '#c08a54', { opacity: 0.45, seed: s(16), shift: 4, reserves: 0 });
    blooms(g, COATBOX, [LIGHT, '#b98450', '#d7a872', '#a87443', '#e2b98a'], { n: 46, size: 0.055, seed: s(11), alpha: 0.42 });
    const gl = (x, y, rx, ry, c, a) => pool(g, x, y, rx, ry, c, a);
    // Jersey colouring, light from the upper front: smoky hips, thigh and shoulder; a light barrel and back
    gl(-160, -238, 96, 106, SMOKE, 0.55); gl(-198, -186, 30, 64, DEEP, 0.32); gl(-112, -300, 52, 24, SMOKE, 0.3);
    gl(148, -236, 58, 88, SMOKE, 0.42); gl(110, -292, 42, 22, SMOKE, 0.25); gl(-60, -150, 60, 30, SMOKE, 0.2);
    gl(8, -246, 140, 58, '#f2cc94', 0.38); gl(-30, -282, 110, 20, '#f8dcae', 0.38); gl(60, -170, 70, 26, '#e8c28e', 0.25);
    { const r = rng(s(12)); for (let i = 0; i < 26; i++) gl(r.range(-250, 420), r.range(-410, 10), r.range(14, 46), r.range(10, 34), r.pick(['#b07a48', '#e0b47e', '#9c6840', '#d9a870']), 0.2); }
    soften(g, 1.3 * res);
    hatch(g, COATBOX, { color: '#64401f', count: 2600, len: 9, width: 0.8, alpha: 0.28, seed: s(13), dir: hairDir, curve: 0.08,
      density: (x, y) => 0.12 + 0.75 * clamp((y + 250) / 140) + (x < -110 && y < -170 ? 0.35 : 0) + (x > 120 ? 0.25 : 0) });
    hatch(g, COATBOX, { color: '#fbe8c6', count: 500, len: 9, width: 0.9, alpha: 0.32, seed: s(15), dir: hairDir, curve: 0.08, density: (x, y) => clamp((-y - 240) / 70) });
  }, { seed: s(14), grain: 0.16 });
  const faceCoat = fillSprite(res, [-130, -130, 130, 130], '#b88454', s(12), { base: 0.92, blooms: ['#a06a40', '#c9965f', '#8d5c38', '#d4a46c'], nb: 14, bsize: 0.14, ba: 0.4,
    weave: 260, wlen: 7, wa: 0.24, dir: () => Math.PI / 2 + 0.35 });
  // ear: a broad leaf, base at x = 0, tip at x = 58; y across (the ear's width)
  const EAR = smooth([[0, -6], [12, -12], [28, -16], [44, -13], [56, -6], [63, 0], [56, 5], [44, 12], [28, 15], [12, 11], [0, 6]]);
  const EAR_IN = smooth([[6, -3], [16, -8], [29, -11], [42, -8], [53, -3], [57, 0], [52, 3], [42, 7], [28, 10], [15, 7], [6, 3]]);
  const earPaint = (inner) => sprite(bbox(EAR), res, (g) => {
    wash(g, EAR, { color: PAPER, opacity: 1, under: PAPER, seed: s(20), edge: 0 });
    looseWash(g, EAR, '#ae7a4c', { opacity: 0.9, seed: s(21), shift: 1.5, reserves: 1 });
    if (inner) {
      looseWash(g, EAR_IN, '#f0d9c4', { opacity: 0.92, seed: s(22), shift: 1, reserves: 0 });
      pool(g, 24, 2, 18, 8, '#e3a59a', 0.45);
      g.save(); path(g, EAR_IN); g.clip(); g.strokeStyle = 'rgba(255,250,240,0.8)'; g.lineCap = 'round';
      for (let k = 0; k < 14; k++) { const x = 10 + k * 3; g.lineWidth = 0.9; g.beginPath(); g.moveTo(x, 8 - (k % 3) * 2); g.quadraticCurveTo(x + 3, 0, x + 7, -8 + (k % 2) * 3); g.stroke(); }
      g.restore();
      shadeEdge(g, EAR_IN, { color: '#7a4a30', alpha: 0.35, width: 6, dy: -3 });
    } else { glaze(g, 30, 0, 30, 14, '#7a5030', 0.35); hatch(g, EAR, { color: '#5e3a22', count: 40, len: 6, alpha: 0.4, seed: s(23), dir: () => 0.1 }); }
    shadeEdge(g, EAR, { color: '#4a2c18', alpha: 0.4, width: 6, dy: 0 });
    furEdge(g, EAR, { color: inner ? '#f4e6d4' : '#b07c4e', count: 40, len: 5, width: 1.1, alpha: 0.8, seed: s(24) });
    penLine(g, EAR, { closed: true, w: 1.5, alpha: 0.85, seed: s(25) });
    function glaze(g2, x, y, rx, ry, c, a) { g2.save(); path(g2, EAR); g2.clip(); pool(g2, x, y, rx, ry, c, a); g2.restore(); }
  }, { granulate: false });
  const earIn = earPaint(true), earOut = earPaint(false);
  // udder: a soft round bag (top attached up under the belly and back between the thighs), four short teats
  const UDDER = smooth([[-44, -22], [-46, 0], [-38, 18], [-18, 27], [8, 27], [28, 20], [40, 6], [38, -14], [20, -22]]);
  const teatShape = (x, y, k = 1) => smooth([[x - 4.5 * k, y - 4], [x + 4.5 * k, y - 4], [x + 4 * k, y + 10 * k], [x, y + 14 * k], [x - 4 * k, y + 10 * k]]);
  const TEATS = [[-24, 22], [10, 24]], TEATS_FAR = [[-14, 19], [20, 21]];
  const udder = sprite(bbox(UDDER.concat([[0, 50]])), res, (g) => {
    for (const [x, y] of TEATS_FAR) { const tt = teatShape(x, y, 0.9); wash(g, tt, { color: shade(TEAT, 0.2), opacity: 0.95, under: PAPER, seed: s(30 + x) }); penLine(g, tt, { closed: true, w: 1.1, alpha: 0.6 }); }
    wash(g, UDDER, { color: PAPER, opacity: 1, under: PAPER, seed: s(31), edge: 0 });
    looseWash(g, UDDER, UDC, { opacity: 0.95, seed: s(32), shift: 1.5, reserves: 1 });
    pool(g, -4, 6, 26, 12, '#f8e6dc', 0.55); pool(g, 0, -20, 50, 12, '#7a4e36', 0.45); pool(g, 30, 4, 16, 20, '#a8705a', 0.3);
    penLine(g, smooth([[-10, 12], [-2, 22]], false), { w: 0.9, alpha: 0.3 });
    shadeEdge(g, UDDER, { color: '#9a6050', alpha: 0.35, width: 10, dy: 5 });
    for (const [x, y] of TEATS) { const tt = teatShape(x, y); wash(g, tt, { color: TEAT, opacity: 0.95, under: PAPER, seed: s(33 + x) }); pool(g, x - 1, y + 2, 2, 5, '#fbe0d8', 0.6); penLine(g, tt, { closed: true, w: 1.2, alpha: 0.7 }); }
    penLine(g, UDDER.slice(1), { w: 1.5, alpha: 0.8, seed: s(34) });
  }, { granulate: false });
  // the switch: a dark, soft brush of hair along +x (root 0 .. tip 52)
  const SWITCH = smooth([[-4, -4], [10, -7], [26, -9], [42, -7], [54, -1], [44, 5], [28, 9], [10, 7], [-4, 4]]);
  const switchS = sprite(bbox(SWITCH), res, (g) => {
    wash(g, SWITCH, { color: '#3e2a20', opacity: 0.95, under: PAPER, seed: s(40) });
    g.save(); g.lineCap = 'round'; const r = rng(s(41));
    for (let i = 0; i < 26; i++) { const y = r.range(-6, 6), x0 = r.range(-2, 16); g.strokeStyle = r() < 0.5 ? 'rgba(120,90,70,0.55)' : 'rgba(30,20,14,0.6)'; g.lineWidth = r.range(0.7, 1.4); g.beginPath(); g.moveTo(x0, y * 0.5); g.quadraticCurveTo(28, y * 1.2, r.range(44, 58), y * 0.6 + r.range(-3, 3)); g.stroke(); }
    g.restore();
    penLine(g, SWITCH, { closed: true, w: 1.1, alpha: 0.6, seed: s(42) });
  }, { granulate: false });
  // fixed hair strokes for the legs (parameter along the leg, offset across it, length)
  const legHair = []; { const r = rng(s(50)); for (let i = 0; i < 34; i++) legHair.push([r.range(0.08, 0.95), r.range(-0.38, 0.38), r.range(5, 9), r()]); }
  // fixed hair strokes on the head (local points + direction)
  const headHair = []; { const r = rng(s(51)); for (let i = 0; i < 34; i++) { const P = r() < 0.55 ? CRAN : FACE, u = r.range(-1, 1), v = r.range(-1, 1); const d = nrm([u * 0.6, v * 0.7 - 0.2, r() < 0.5 ? 1 : -1]); headHair.push([[P.c[0] + P.r[0] * d[0], P.c[1] + P.r[1] * d[1], P.c[2] + P.r[2] * d[2]], d, r.range(5, 9)]); } }

  // ---------------------------------------------------------------- the head transform
  function headXf(P, Hc) {
    const b = 0.32 + 0.55 * P.turn, p = 0.95 - P.nod, r = P.roll || 0;
    const cb = Math.cos(b), sb = Math.sin(b), cp = Math.cos(p), sp = Math.sin(p), cr = Math.cos(r), sr = Math.sin(r);
    const dir = (v) => { // roll (about f), pitch (f toward y), yaw (X toward the viewer Z)
      const f = v[0], y = v[1] * cr - v[2] * sr, l = v[1] * sr + v[2] * cr;
      const X = f * cp - y * sp, Y = f * sp + y * cp, Z = l;
      return [(X * cb - Z * sb) * HS, Y * HS, (X * sb + Z * cb) * HS];
    };
    const at = (q) => { const d = dir(q); return [Hc[0] + d[0], Hc[1] + d[1], d[2]]; };
    // an ellipsoid's exact outline (orthographic): the ellipse of the 2x3 projection of R diag(r)
    const ell = (e, n = 40) => {
      const c = at(e.c), cols = [dir([e.r[0], 0, 0]), dir([0, e.r[1], 0]), dir([0, 0, e.r[2]])];
      let a = 0, bb = 0, d = 0; for (const q of cols) { a += q[0] * q[0]; bb += q[0] * q[1]; d += q[1] * q[1]; }
      const m = (a + d) / 2, k = Math.sqrt(((a - d) / 2) ** 2 + bb * bb), th = 0.5 * Math.atan2(2 * bb, a - d);
      return { pts: ellipse(c[0], c[1], Math.sqrt(m + k), Math.sqrt(Math.max(0.01, m - k)), n, th), c, rx: Math.sqrt(m + k), ry: Math.sqrt(Math.max(0.01, m - k)), th, z: c[2], ext: Math.sqrt(d) };
    };
    const vis = (n) => dir(n)[2] / HS; // + = the surface faces us
    return { dir, at, ell, vis, yaw: b };
  }
  // the chin on the hinged jaw: opens (mouth), slides sideways (chewing)
  function chinE(P) { const a = clamp(P.mouth) * 0.24, c = CHIN.c, x = c[0] - HINGE[0], y = c[1] - HINGE[1]; return E([HINGE[0] + x * Math.cos(a) - y * Math.sin(a), HINGE[1] + x * Math.sin(a) + y * Math.cos(a), (P.jaw || 0) * 6], CHIN.r); }
  const chinPt = (P, q) => { const a = clamp(P.mouth) * 0.24, x = q[0] - HINGE[0], y = q[1] - HINGE[1]; return [HINGE[0] + x * Math.cos(a) - y * Math.sin(a), HINGE[1] + x * Math.sin(a) + y * Math.cos(a), q[2] + (P.jaw || 0) * 6]; };

  // ---------------------------------------------------------------- the rig
  // a body point: landmarks drop front-first when she lies down, and rise and fall over each leg when she walks
  function bodyPt(P, p, under = 0) {
    const wF = clamp((p[0] + 150) / 300);
    const drop = lerp(P.lieR * 128, P.lieF * 116, wF) + lerp(P.hb, P.sb, wF);
    let y = p[1] + drop, x = p[0] + P.bx;
    if (under !== 0) { const u = Math.max(0, under); x += P.bsx * u; y += (P.bsy + P.br * 1.6 * (1 + P.sleep)) * u;
      const lk = lerp(P.lieR, P.lieF, wF); y = lerp(y, Math.min(y, -4 - (1 - u) * 9), lk); x += lk * u * 6; }
    return [x, y];
  }
  function legsSolve(raw, pb) {
    const out = {};
    for (const [name, root0, px, hind, near, off] of LEGS) {
      let [dx, lift, sw] = walkHoof((raw.walkPhase || 0) + off);
      // standing square: each hoof steps into place in its own window (no sliding while the walk eases in or out)
      const stand = 1 - clamp(raw.wa || 0), su = clamp((stand - off * 0.6) / 0.4);
      if (su > 0) { const d0 = Math.abs(dx); dx *= 1 - easeInOut(su); if (su < 1) { lift += 14 * Math.sin(Math.PI * su) * clamp(d0 / 8); sw = Math.max(sw, 0.5 * Math.sin(Math.PI * su) * clamp(d0 / 8)); } }
      const lieK = hind ? pb.lieR : pb.lieF;
      let H = [px + dx, -lift - (near ? 0 : 4)];
      // the shoulder blade swings a little with the leg (more reach)
      const R = bodyPt(pb, [root0[0] + clamp(dx * 0.1, -9, 9) * (1 - lieK), root0[1]]);
      let pitch, a;
      if (!hind) { const phi = Math.atan2(R[0] - H[0], H[1] - R[1]); a = 0.8 * phi + (near ? 0.95 : 0.6) * sw; pitch = (near ? 1.1 : 0.8) * sw; }
      else { const phi = Math.atan2(H[0] - R[0], H[1] - R[1]); a = 0.06 + 0.55 * phi + 0.5 * sw; pitch = 0.5 * sw; }
      // folded (lying): joint targets on the straw (knee / hock, fetlock, coronet), see legBones
      const fold = !hind ? { K: [156 + (near ? 0 : 14), -11 - (near ? 0 : 4)], F: [104 + (near ? 0 : 16), -10 - (near ? 0 : 4)], C: [88 + (near ? 0 : 16), -14 - (near ? 0 : 4)], pitch: 2.0 }
        : { K: [-180 + (near ? 0 : 18), -20 - (near ? 0 : 5)], F: [-104 + (near ? 0 : 14), -12 - (near ? 0 : 4)], C: [-88 + (near ? 0 : 14), -13 - (near ? 0 : 4)], pitch: -1.3 };
      out[name] = { R, H, hind, near, a, pitch, sw, planted: lift < 0.5 && raw.lie < 0.01, lieK, fold };
    }
    return out;
  }
  // the bones of one leg -> joints and an outline
  function legBones(L) {
    const { R, hind, lieK, fold } = L;
    let { H, a, pitch } = L;
    const rp = (v, pt) => [v[0] * Math.cos(pt) - v[1] * Math.sin(pt), v[0] * Math.sin(pt) + v[1] * Math.cos(pt)];
    let cv = rp([-1, -CORO], pitch), C = [H[0] + cv[0], H[1] + cv[1]];
    const bp = 0.5 + pitch; let F = [C[0] - PAST * Math.sin(bp), C[1] - PAST * Math.cos(bp)];
    let Kt = !hind ? [F[0] + FORE.can * Math.sin(a), F[1] - FORE.can * Math.cos(a)] : [F[0] - HIND.can * Math.sin(a), F[1] - HIND.can * Math.cos(a)];
    if (lieK > 0) { // blend every joint toward the fold (the upper bone is re-solved below, so it keeps its length)
      Kt = L2(Kt, fold.K, lieK); F = L2(F, fold.F, lieK); C = L2(C, fold.C, lieK); pitch = lerp(pitch, fold.pitch, lieK);
      cv = rp([-1, -CORO], pitch); H = [C[0] - cv[0], C[1] - cv[1]]; L.H = H; L.pitch = pitch;
    }
    if (!hind) {
      const { E: El, T: Kn } = ik2(R, Kt, FORE.up, FORE.lo, [-1, 0.15], 1.16);
      return { R, E: El, K: Kn, F, C, H, pts: [L2(R, El, 0.7), El, L2(El, Kn, 0.5), Kn, L2(Kn, F, 0.5), F, C], ws: [52, 44, 35, 25, 18, 22, 17] };
    }
    const { E: St, T: Hk } = ik2(R, Kt, HIND.up, HIND.lo, [1, 0.15], 1.16);
    return { R, E: St, K: Hk, F, C, H, pts: [L2(R, St, 0.62), St, L2(St, Hk, 0.5), Hk, L2(Hk, F, 0.5), F, C], ws: [78, 62, 42, 28, 19, 22, 17] };
  }
  function tailShape(P) {
    const angs = [];
    for (let i = 0; i < TAIL_N; i++) { const f = (i + 1) / TAIL_N;
      let a = Math.PI / 2 + 0.06 + 0.95 * Math.exp(-f * 7) + P.tSw * 0.24 * Math.sin(f * 2.6) * f;
      a = lerp(a, lerp(Math.PI / 2 + 0.05, Math.PI - 0.15, ease((f - 0.4) / 0.4)), ease(P.tWrap || 0)); // lying: down the rump, then curled out behind on the straw
      angs.push(a); }
    return angs;
  }
  function rig(raw, ph, pb, pe, tails) {
    const legs = legsSolve(raw, pb), bones = {};
    for (const k in legs) bones[k] = legBones(legs[k]);
    let Hc = bodyPt(pb, H0); Hc = [Hc[0] + ph.hx, Hc[1] + ph.hy];
    let Hx = headXf(ph, Hc);
    { // never below the ground (asleep, the chin rests on the straw)
      const chin = chinE(ph); let low = -1e9; for (const e of [CHEEK, MUZ, chin]) { const q = Hx.ell(e, 12); low = Math.max(low, q.c[1] + q.ext); }
      if (low > -3) { Hc = [Hc[0], Hc[1] - (low + 3)]; Hx = headXf(ph, Hc); }
    }
    // tail chain
    const shapes = tails.map((x) => tailShape(x.P)), ds = TAIL_L / TAIL_N; let p = bodyPt(pb, TAIL_ROOT); p = [p[0] + 5 * pb.lieR, p[1] + 18 * pb.lieR]; const tail = [p];
    for (let i = 0; i < TAIL_N; i++) { const f = i / (TAIL_N - 1), tau = f * (tails.length - 1), j = Math.min(tails.length - 2, Math.floor(tau)), k = tau - j; const a = lerp(shapes[j][i], shapes[j + 1][i], k); p = [p[0] + Math.cos(a) * ds, Math.min(p[1] + Math.sin(a) * ds, -4)]; tail.push(p); }
    return { raw, pb, ph, pe, Hx, Hc, legs, bones, tail };
  }
  // the ONE outline of body and neck (closed), plus a few landmarks for the painting
  function outline(Rg) {
    const pb = Rg.pb, Hx = Rg.Hx, bn = Rg.bones.hindNear;
    const W = bodyPt(pb, W0), pts = [];
    const lr = pb.lieR;
    for (const q of TOP) { const p = bodyPt(pb, q), r = clamp((-q[0] - 40) / 170); pts.push([p[0] + lr * 8 * r * r, p[1] + lr * (34 * r * r - 10 * Math.sin(Math.PI * clamp((q[0] + 120) / 230)))]); }
    const topN = pts.length + 1;
    // the thigh turns with the near femur about the hip joint
    const st0 = [-105, -150], d = ang(bn.R, bn.E) - ang(HJ, st0);
    const hj = bodyPt(pb, HJ);
    const bulge = [0.35, 0.8, 1, 0.75, 0.2];
    THIGH.forEach(([x, y, w], i) => { const q = rot2([x, y], HJ, d * w); pts.push([q[0] - HJ[0] + hj[0] - 14 * pb.lieR * bulge[i], Math.min(-4, q[1] - HJ[1] + hj[1] + pb.lieR * (10 * bulge[i] + 30 * [1, 0.75, 0.5, 0.3, 0.1][i]))]); });
    pts.push([bn.E[0] + 6, bn.E[1] - 4]);
    const iU = pts.length;
    for (const [x, y, u] of UNDER) { const p = bodyPt(pb, [x, y], u || -1); pts.push([p[0] + (x - 20) * 0.1 * lr * (u || 0), p[1]]); }
    const CF = pts[pts.length - 1];
    // the neck: dewlap from the chest up the throat, then (inside the head) jaw and poll, then the crest to the withers
    const th = Hx.at(THROAT), jb = Hx.at(JAWB), po = Hx.at(POLL);
    const nx = th[0] - CF[0], ny = th[1] - CF[1], nl = Math.hypot(nx, ny) || 1, sag = 24 * (1 - 0.4 * clamp(pb.lieF)) * (1 - ease(Rg.ph.back));
    const bk = ease(Rg.ph.back), Wn = [W[0] + 30, W[1] + 46];
    for (const k of [0.25, 0.5, 0.75]) {
      const dw = [lerp(CF[0], th[0], k) + ny / nl * sag * Math.sin(Math.PI * k) ** 0.8, lerp(CF[1], th[1], k) - nx / nl * sag * Math.sin(Math.PI * k) ** 0.8];
      const arc = [lerp(CF[0], Wn[0], k) + 12 * Math.sin(Math.PI * k), lerp(CF[1], Wn[1], k)]; // looking back: the round of the bent neck
      pts.push(L2(dw, arc, bk));
    }
    const iTh = pts.length;
    pts.push([th[0], th[1]], [jb[0], jb[1]], [po[0], po[1]]);
    const iPo = pts.length - 1;
    const cl = Math.hypot(po[0] - W[0], po[1] - W[1]);
    for (const k of [0.3, 0.62]) pts.push([lerp(po[0], W[0], k), lerp(po[1], W[1], k) + 12 * Math.sin(Math.PI * k) - cl * 0.02]);
    pts.unshift(W);
    const sm = smooth(pts, true, 6);
    return { pts, sm, W, iU: iU + 1, iTh: iTh + 1, iPo: iPo + 1, topN, hj };
  }
  const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
  function fill(raw, st) { raw.walkPhase = st.walk || 0; return raw; }
  function rigFromState(st) { const p = fill(solve(st), st); p.tt = st.t || 0; return rig(p, p, p, p, TAIL_DELAYS.map(() => ({ P: p }))); }
  function rigAt(poseFn, t, o = {}) {
    const since = o.since ?? -1e9, cache = new Map(); const cur = poseFn(t); cache.set(Math.round(t * 960) / 960, cur);
    const raw = fill(solve(cur), cur); raw.tt = t;
    const one = (k, dt = 0) => { const p = solve({ ...cur, ...filtered(poseFn, t - dt, K[k], since, cache), t: t - dt }, LAG[k]); p.tt = t - dt - LAG[k]; return p; };
    const pb = one('body'); pb.walkPhase = raw.walkPhase; // the body's bob follows the same (filtered) phase
    return { R: rig(raw, one('head'), pb, one('ear'), TAIL_DELAYS.map((d) => ({ P: one('tail', d) }))), st: cur };
  }

  // ---------------------------------------------------------------- painting (internal, facing right)
  // exitY: where the leg leaves the body outline (above it the leg IS the body: same coat, no leg shading)
  function legFill(g, Lg, B, far, coatAt = null, exitY = -1e9) {
    const ls = limb(B.pts, B.ws), sh = ls.shape;
    const top = far ? mix(FAWN, SHADOW, 0.48) : FAWN, low = far ? shade(SMOKE, 0.3) : SMOKE;
    g.save(); path(g, sh); g.clip();
    const A = B.pts[0], Z = B.C, kn = B.K;
    const len = Math.hypot(Z[0] - A[0], Z[1] - A[1]) || 1, proj = (q) => clamp(((q[0] - A[0]) * (Z[0] - A[0]) + (q[1] - A[1]) * (Z[1] - A[1])) / (len * len)), kf = proj(kn);
    const gr = g.createLinearGradient(A[0], A[1], Z[0], Z[1]), b = bbox(sh);
    if (coatAt) { // the near leg's top IS the body: the same painted coat, darkening down the leg below the body
      g.save(); g.translate(coatAt[0], coatAt[1]); drawSprite(g, coat); g.restore();
      const fe = Math.min(kf - 0.05, proj([A[0], exitY]) + 0.04);
      gr.addColorStop(0, rgba(SMOKE, 0)); gr.addColorStop(clamp(fe), rgba(SMOKE, 0)); gr.addColorStop(clamp((fe + kf) / 2 + 0.03), rgba(SMOKE, 0.4)); gr.addColorStop(clamp(kf + 0.05), rgba(low, 0.92)); gr.addColorStop(1, shade(low, 0.25));
    } else { gr.addColorStop(0, top); gr.addColorStop(clamp(kf - 0.12), top); gr.addColorStop(clamp(kf + 0.08), low); gr.addColorStop(1, shade(low, 0.25)); }
    g.fillStyle = gr; g.fillRect(b.x0 - 2, b.y0 - 2, b.w + 4, b.h + 4);
    // below the body only: the back of the leg in shadow, a light down the front, the belly's shadow, hair
    g.beginPath(); g.rect(b.x0 - 10, exitY - 3, b.w + 20, 600); g.clip();
    const w = 20; g.lineJoin = 'round'; g.lineCap = 'round';
    g.save(); g.translate(w * 0.45, w * 0.1); g.strokeStyle = rgba(SHADOW, far ? 0.18 : 0.26); g.lineWidth = w * 0.9; path(g, sh); g.stroke(); g.restore();
    g.strokeStyle = rgba(SHADOW, 0.12); g.lineWidth = 8; path(g, sh); g.stroke();
    if (!far) { g.save(); g.translate(-5, -1); g.strokeStyle = rgba(tint(FAWN, 0.5), 0.18); g.lineWidth = 4; g.beginPath(); ls.line.slice(2, -4).forEach((q, i) => (i ? g.lineTo(q[0] - 4, q[1]) : g.moveTo(q[0] - 4, q[1]))); g.stroke(); g.restore(); }
    if (far) { const uy = Lg.R[1] + (Lg.hind ? 95 : 62);
      const sg = g.createLinearGradient(0, uy - 10, 0, uy + 46); sg.addColorStop(0, rgba(SHADOW, 0.6)); sg.addColorStop(1, rgba(SHADOW, 0));
      g.fillStyle = sg; g.fillRect(b.x0 - 2, uy - 60, b.w + 4, 108); }
    g.strokeStyle = rgba(far ? '#3a2416' : '#5a3a22', 0.38); g.lineWidth = 0.8;
    for (const [u, v, l] of legHair) { const q = along(ls.line, u), wd = 22; const x = q.p[0] - q.t[1] * v * wd, y = q.p[1] + q.t[0] * v * wd; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + q.t[0] * l * 0.5 + 1, y + q.t[1] * l * 0.5, x + q.t[0] * l, y + q.t[1] * l); g.stroke(); }
    g.restore();
    return ls;
  }
  function legExtras(g, B, hind, far, ink = true) { // the point of the hock / the knee's front, and the dew claws
    const col = far ? shade(SMOKE, 0.3) : SMOKE;
    const dirv = (a, b) => { const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; };
    const u = dirv(B.K, B.F), back = hind ? [u[1], -u[0]] : [u[1], -u[0]];
    const side = hind ? -1 : 1; // hock point sticks out behind (-x side), the knee bulges in front
    const nx = -u[1] * side * -1, ny = u[0] * side * -1;
    if (!hind) return;
    const c = [B.K[0] + nx * 10 - u[0] * 5, B.K[1] + ny * 10 - u[1] * 5];
    const e = ellipse(c[0], c[1], 7, 5.5, 18, Math.atan2(u[1], u[0]));
    if (ink) penLine(g, e, { closed: true, w: 3.6, alpha: 0.78, seed: 61 });
    g.fillStyle = col; path(g, e); g.fill();
    void back;
  }
  function dewClaw(g, B, far) {
    const d = [B.F[0] - B.C[0], B.F[1] - B.C[1]], dl = Math.hypot(...d) || 1, n = [d[1] / dl, -d[0] / dl];
    // behind the fetlock (the side away from the toe)
    const sgn = (n[0] < 0) ? 1 : -1, p = [B.F[0] + n[0] * sgn * 11 + d[0] / dl * -3, B.F[1] + n[1] * sgn * 11 + d[1] / dl * -3];
    g.save(); g.fillStyle = far ? shade(HOOF, 0.1) : HOOF; g.beginPath(); g.ellipse(p[0], p[1], 3.4, 2.4, Math.atan2(d[1], d[0]), 0, 7); g.fill();
    g.strokeStyle = rgba(INK, 0.6); g.lineWidth = 1; g.stroke(); g.restore();
  }
  function drawHoof(g, L, B, far) { // cloven: two toes, the near one in front, a soft shine, the coronet band
    const { H, pitch } = L;
    g.save(); g.translate(H[0], H[1]); g.rotate(pitch);
    const col = far ? shade(HOOF, 0.05) : HOOF;
    const toe = (dx, k) => smooth([[-11 + dx, -1], [-12 + dx, -9], [-8 + dx, -14.5], [7 * k + dx, -14.5], [13 * k + dx, -2], [12 * k + dx, 0.5], [-9 + dx, 0.8]]);
    const fT = toe(3.5, 0.95), nT = toe(-0.5, 1);
    for (const sh of [fT, nT]) { g.fillStyle = sh === fT ? shade(col, 0.15) : col; path(g, sh); g.fill(); g.strokeStyle = rgba(INK, 0.85); g.lineWidth = 1.3; g.lineJoin = 'round'; g.stroke(); }
    g.strokeStyle = 'rgba(255,240,225,0.28)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(1, -12); g.quadraticCurveTo(6, -8, 8, -3); g.stroke();
    g.fillStyle = rgba(far ? DEEP : SMOKE, 1); g.beginPath(); g.ellipse(-1, -14.5, 10, 2.6, 0, 0, 7); g.fill(); // coronet hair
    g.restore();
    void B;
  }
  function drawTail(g, Rg) {
    const pts = Rg.tail, n = pts.length;
    taper(g, pts.slice(0, n - 1), 10, 4.5, FAWN, { shade: SMOKE, light: LIGHT, inkW: 1.4, inkA: 0.75 });
    const e = pts[n - 3], q = pts[n - 1], a = Math.atan2(q[1] - e[1], q[0] - e[0]);
    g.save(); g.translate(e[0], e[1]); g.rotate(a); drawSprite(g, switchS); g.restore();
  }
  function drawUdder(g, Rg) {
    const pb = Rg.pb, a = 1 - clamp(pb.lieR * 1.6); if (a <= 0) return;
    const u = bodyPt(pb, UDDER_AT, 0.4);
    g.save(); g.globalAlpha *= a; g.translate(u[0] + (pb.bsx || 0) * 0.5, u[1]); g.rotate(0.04 * Math.sin((Rg.raw.tt || 0) * 2) * (pb.wa || 0)); drawSprite(g, udder); g.restore();
  }
  // the body's form, light from the upper front: lit back, shadowed belly; it carries on over the tops of the near legs
  function formGrad(g, pb) {
    const top = bodyPt(pb, [0, -312]), bel = bodyPt(pb, [0, -124], 1), y1 = Math.max(bel[1] + 30, 0), f = (y) => clamp((y - top[1]) / (y1 - top[1]));
    const gr = g.createLinearGradient(0, top[1], 0, y1);
    gr.addColorStop(0, 'rgba(255,236,200,0.4)'); gr.addColorStop(f(top[1] + 60), 'rgba(255,236,200,0)'); gr.addColorStop(f(bel[1] - 90), rgba(SHADOW, 0));
    gr.addColorStop(f(bel[1] - 30), rgba(SHADOW, 0.3)); gr.addColorStop(f(bel[1]), rgba(SHADOW, 0.46)); gr.addColorStop(1, rgba(SHADOW, 0));
    return gr;
  }
  function paintBody(g, Rg, O, nearLs) {
    const pb = Rg.pb, sm = O.sm, b = bbox(sm);
    const BP = (p, u) => bodyPt(pb, p, u);
    g.save(); path(g, sm); g.clip();
    const o = BP([0, 0]); g.save(); g.translate(o[0], o[1]); drawSprite(g, coat); g.restore();
    // colour: smoky over the hips, the shoulder and up the neck; light along the barrel and back; pale under the belly
    const P2 = (p, rx, ry, c, al) => { const q = BP(p); pool(g, q[0], q[1], rx, ry, c, al); };
    { const po = O.pts[O.iPo], W = O.W; pool(g, lerp(po[0], W[0], 0.5), lerp(po[1], W[1], 0.5) + 10, 80, 44, SMOKE, 0.45); }
    g.fillStyle = formGrad(g, pb); g.fillRect(b.x0 - 4, b.y0 - 4, b.w + 8, b.h + 8);
    P2([10, -118], 120, 12, CREAM, 0.14);                   // reflected light under the barrel
    P2([96, -150], 26, 46, SHADOW, 0.3);                   // behind the elbow (the girth)
    P2([-72, -248], 26, 34, SHADOW, 0.18);                 // the hollow in front of the hip
    P2([-202, -200], 18, 60, SHADOW, 0.25);                // round the back of the thigh
    P2([-108, -300], 16, 8, '#fde8c4', 0.5);               // light on the hook bone
    { const th = O.pts[O.iTh], cf = O.pts[O.iU + UNDER.length - 1]; pool(g, lerp(th[0], cf[0], 0.5), lerp(th[1], cf[1], 0.5), 40, 30, SHADOW, 0.32); pool(g, th[0], th[1], 30, 26, SHADOW, 0.3); }
    // soft darker edge just inside the outline (like a drying wash)
    // the outline where it is really an edge (not where a near leg carries on out of the body)
    const inLeg = (q) => nearLs.some((ls) => inPoly(q, ls.shape));
    const runs = []; let cur = []; for (const q of sm) { if (inLeg(q)) { if (cur.length > 2) runs.push(cur); cur = []; } else cur.push(q); } if (cur.length > 2) runs.push(cur);
    if (runs.length > 1 && !inLeg(sm[0]) && !inLeg(sm[sm.length - 1])) { const last = runs.pop(); runs[0] = last.concat(runs[0]); }
    O.runs = runs;
    g.lineJoin = 'round'; g.save(); g.translate(0, -7); g.strokeStyle = rgba(SHADOW, 0.1); g.lineWidth = 16; for (const r of runs) { path(g, r, false); g.stroke(); } g.restore();
    g.restore();
    // rim light along the back
    const topLine = sm.slice(0, O.topN * 6 + 2).map(([x, y]) => [x, y + 5]);
    penLine(g, topLine, { color: '#fff0d4', w: 4.5, alpha: 0.28, seed: s(70), weight: (t) => 0.3 + Math.sin(Math.PI * t) });
    // anatomy, lightly: the hook bone and the pin, the thigh's front edge down to the stifle, the flank fold, the shoulder
    // blade and the back of the upper arm to the elbow, a few ribs
    const st = Rg.bones.hindNear.E, el = Rg.bones.foreNear.E;
    const L = (pts, w, a, sd) => penLine(g, smooth(pts, false, 6), { color: INK, w, alpha: a, seed: s(sd), weight: (t) => Math.sin(Math.PI * t) ** 0.7 });
    L([BP([-126, -304]), BP([-112, -298]), BP([-94, -301])], 1.4, 0.45, 71);
    L([BP([-112, -232]), [lerp(BP([-112, -232])[0], st[0] + 6, 0.5) + 5, lerp(BP([-112, -232])[1], st[1], 0.5)], [st[0] + 8, st[1] - 8]], 1.4, 0.3, 72);
    if (pb.lieR < 0.5) L([[st[0] + 10, st[1] + 2], [st[0] + 24, st[1] - 16], [st[0] + 36, st[1] - 34]], 1.2, 0.35 * (1 - 2 * pb.lieR), 73);
    if (pb.lieR > 0.05) { // lying: the folded thigh, a round haunch with its front edge sweeping down to the stifle
      const k = pb.lieR, hp = BP([-140, -230]);
      g.save(); path(g, sm); g.clip(); pool(g, hp[0] - 10, hp[1] + 30, 70, 60, SMOKE, 0.28 * k); pool(g, hp[0] + 10, hp[1] - 10, 50, 30, '#f6d6a4', 0.3 * k); g.restore();
      L([BP([-98, -292]), BP([-50, -238]), BP([-40, -180]), [lerp(BP([-40, -180])[0], st[0], 0.6) + 8, lerp(BP([-40, -180])[1], st[1], 0.6)], [st[0] + 6, st[1] - 2]], 2.2, 0.62 * k, 77);
    }
    L([BP([128, -290]), BP([146, -254]), BP([166, -214])], 1.2, 0.22, 74);
    L([BP([150, -212]), BP([132, -180]), [el[0] + 2, el[1] - 10]], 1.4, 0.38, 75);
    for (let k = 0; k < 3; k++) L([BP([20 + k * 26, -246 + k * 3]), BP([14 + k * 26, -216]), BP([18 + k * 26, -188 - k * 2])], 0.9, 0.07, 76 + k);
    // fur breaking the silhouette, combed back
    O.runs.forEach((r, i) => furEdge(g, r, { color: FAWN, count: Math.round(110 * r.length / sm.length), len: 7, width: 1.3, alpha: 0.6, seed: s(80 + i) }));
    void nearLs;
  }

  // ---------------------------------------------------------------- the head
  function drawHead(g, Rg, part) {
    const Hx = Rg.Hx, P = Rg.ph, pe = Rg.pe;
    const nearSg = Hx.vis([0, 0, 1]) >= 0 ? 1 : -1;
    const earAt = (sg, fl) => {
      const eb = clamp(pe.earBack + P.sleep * 0.4);
      // world-ish directions at the rest pitch -> head-local: back (-0.58, 0.81), down (0.81, 0.58), up (-0.81, -0.58)
      const bk = 0.7 + 0.5 * eb, dn = 0.62 + 0.35 * fl + 0.5 * P.sleep - 0.4 * eb;
      const d = nrm([-0.58 * bk + 0.81 * dn, 0.81 * bk + 0.58 * dn, sg * 0.5]), w0 = [-0.81, -0.58, 0];
      const w = nrm(w0.map((x, i) => x - d[i] * dot3(w0, d)));
      const base = Hx.at([-10, -14, sg * 36]), D = Hx.dir(d), Wd = Hx.dir(w);
      const n = cross(d, w), facing = Hx.vis(n) * (n[0] >= 0 ? 1 : -1) * sg; // the inner (cupped) side faces forward
      g.save(); g.transform(D[0] * 0.86, D[1] * 0.86, Wd[0] * sg * 0.86, Wd[1] * sg * 0.86, base[0], base[1]); drawSprite(g, facing > 0 ? earIn : earOut); g.restore();
    };
    const hornAt = (sg) => {
      const b0 = Hx.at([-20, -27, sg * 23]), tp = Hx.at([-25, -37, sg * 28]);
      const pts = [[b0[0], b0[1]], [lerp(b0[0], tp[0], 0.5), lerp(b0[1], tp[1], 0.5)], [tp[0], tp[1]]];
      taper(g, pts, 8, 4.5, '#ece0c2', { inkW: 1.3, inkA: 0.8, shade: '#a8946c' });
      g.fillStyle = 'rgba(120,100,70,0.6)'; g.beginPath(); g.arc(tp[0], tp[1], 2.4, 0, 7); g.fill();
    };
    if (part === 'back') { earAt(-nearSg, -nearSg > 0 ? pe.flN : pe.flF); hornAt(-nearSg); return; }
    const chin = chinE(P);
    // ONE calm contour: the hull of the head's masses (forehead curve, a straight-ish nose line, a round muzzle);
    // the bones (eye bumps, cheeks, the dish) only as soft shading inside
    const parts = [CRAN, FACE, CHEEK, MUZ, chin].map((e) => Hx.ell(e, 48));
    const HULL = hullPts([].concat(...parts.map((q) => q.pts)));
    penLine(g, HULL, { closed: true, w: 3.8, alpha: 0.85, seed: s(90), weight: (t) => 0.5 + 0.6 * Math.max(0, Math.sin(t * TAU * 2 + 0.5)) });
    const clipAll = () => { path(g, HULL); g.clip(); };
    const C = Hx.at([40, 8, 0]);
    g.save(); clipAll();
    g.save(); g.translate(C[0], C[1]); drawSprite(g, faceCoat); g.restore();
    const at = (q) => Hx.at(q);
    const pl = (q, rx, ry, c, a) => { const p = at(q); pool(g, p[0], p[1], rx, ry, c, a); };
    pl([-6, -26, 0], 46, 34, '#f0c890', 0.38);                       // light on the broad forehead
    pl([62, -10, 0], 22, 26, SMOKE, 0.22);                            // the dish of the face
    for (const sg of [1, -1]) if (Hx.vis(EYE_N(sg)) > -0.3) pl(EYE_AT(sg), 30, 26, '#4e301c', 0.5);   // smoky round the eyes
    pl([24, 40, 0], 56, 22, '#3a2414', 0.3); pl([0, 10, -nearSg * 40], 50, 50, '#3a2414', 0.22);       // under the jaw, the far side
    for (const sg of [1, -1]) if (Hx.vis([0.2, 0.3, sg]) > 0.1) pl([52, 22, sg * 28], 16, 10, '#d9826c', 0.2); // a warm cheek
    if (P.jaw) { const sg = P.jaw > 0 ? 1 : -1; if (Hx.vis([0, 0.3, sg]) > 0) pl([40, 22, sg * 32], 20, 14, '#6a4026', 0.25 * Math.abs(P.jaw)); }
    // the pale band round the muzzle, the dark wet nose
    { const m = Hx.ell(MUZ), ch = Hx.ell(chin);
      void ch; const nc = Hx.at([MUZ.c[0] + 10, MUZ.c[1] + 3, 0]);
      for (const [q, k] of [[m, 0.82]]) { g.save(); g.translate(nc[0], nc[1]); g.rotate(q.th); g.scale(q.rx * k, q.ry * k); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1.12); gr.addColorStop(0, rgba(PALE, 0.95)); gr.addColorStop(0.6, rgba(PALE, 0.88)); gr.addColorStop(0.95, rgba(PALE, 0)); g.fillStyle = gr; g.fillRect(-1.2, -1.2, 2.4, 2.4); g.restore(); } }
    const cap = (e, axis, k, sc = 1) => { const out = []; for (let i = 0; i < 14; i++) for (let j = 0; j <= 6; j++) { const th = Math.acos(lerp(1, k, j / 6)), ph = TAU * i / 14; const ax = nrm(axis), t1 = nrm(cross(ax, Math.abs(ax[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0])), t2 = cross(ax, t1); const d = [0, 1, 2].map((z) => ax[z] * Math.cos(th) + (t1[z] * Math.cos(ph) + t2[z] * Math.sin(ph)) * Math.sin(th)); out.push(at([e.c[0] + e.r[0] * d[0] * sc, e.c[1] + e.r[1] * d[1] * sc, e.c[2] + e.r[2] * d[2] * sc])); } return hullPts(out); };
    const NOSE_AX = [1, -0.3, 0];
    { const pad = cap(MUZ, NOSE_AX, 0.7, 1.01);
      g.save(); g.filter = 'blur(0.6px)'; g.fillStyle = NOSEC; path(g, pad); g.fill(); g.restore();
      g.save(); path(g, pad); g.clip(); const hp = at([MUZ.c[0] + 20, MUZ.c[1] - 20, nearSg * 6]); pool(g, hp[0], hp[1], 12, 6, '#a09090', 0.5);
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(hp[0], hp[1], 3.6, 1.8, -0.4, 0, 7); g.fill(); g.restore();
      g.save(); path(g, pad); g.strokeStyle = rgba(INK, 0.5); g.lineWidth = 1.1; g.stroke(); g.restore(); }
    // nostrils: commas on the sides of the nose pad
    for (const sg of [-1, 1]) { const n = nrm([0.8, -0.1, sg * 0.75]), v = Hx.vis(n); if (v < 0.05) continue;
      const c = at([MUZ.c[0] + MUZ.r[0] * 0.66, MUZ.c[1] - 9, sg * MUZ.r[2] * 0.6]);
      const t1 = Hx.dir(nrm(cross(n, [0, 1, 0]))), t2 = Hx.dir([0, 1, 0]);
      g.save(); g.translate(c[0], c[1]); g.transform(t1[0], t1[1], t2[0], t2[1], 0, 0); g.globalAlpha *= clamp(v * 4);
      g.fillStyle = '#1e1412'; g.beginPath(); g.ellipse(0, 0, 5.5, 3.6, sg * 0.5, 0, 7); g.fill();
      g.strokeStyle = 'rgba(140,120,110,0.5)'; g.lineWidth = 1; g.beginPath(); g.ellipse(-0.5, -1, 6.5, 4.5, sg * 0.5, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); g.restore(); }
    // hair strokes on the forehead and face
    g.strokeStyle = 'rgba(80,50,30,0.2)'; g.lineWidth = 0.8; g.lineCap = 'round';
    for (const [q, d, l] of headHair) { if (Hx.vis(d) < 0.15) continue; const a = at(q), b2 = at([q[0] + l, q[1] + l * 0.3, q[2]]); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b2[0], b2[1]); g.stroke(); }
    g.restore();
    // the mouth: a line round the bottom of the muzzle; open (moo), the gap down to the chin is dark with a tongue
    { const m = clamp(P.mouth), up = [], lo = [];
      for (let k = 0; k <= 12; k++) { const th = -1.25 + 2.5 * k / 12, d = nrm([0.48, 0.72 * Math.cos(th), 0.72 * Math.sin(th)]);
        const q = [MUZ.c[0] + MUZ.r[0] * d[0] * 0.98, MUZ.c[1] + MUZ.r[1] * d[1] * 0.98, MUZ.c[2] + MUZ.r[2] * d[2] * 0.98], pq = at(q);
        const nv = Hx.vis([d[0] / MUZ.r[0], d[1] / MUZ.r[1], d[2] / MUZ.r[2]]);
        up.push([pq[0], pq[1], nv]); const l2 = at(chinPt(P, [q[0] - 6, q[1] + 2, q[2] * 0.8])); lo.push([l2[0], l2[1], nv]); }
      const visU = up.filter((q) => q[2] > 0), visL = lo.filter((q) => q[2] > 0);
      if (m > 0.05 && visU.length > 2) {
        g.save(); g.beginPath(); visU.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); for (let i = visL.length - 1; i >= 0; i--) g.lineTo(visL[i][0], visL[i][1]); g.closePath();
        g.fillStyle = '#4e1f1c'; g.fill(); g.clip(); const tq = visL[Math.floor(visL.length / 2)]; g.fillStyle = '#d98a80'; g.beginPath(); g.ellipse(tq[0], tq[1] - 3, 12, 4 + 5 * m, 0, 0, 7); g.fill(); g.restore();
        penLine(g, visL.map((q) => [q[0], q[1]]), { w: 1.6, alpha: 0.7, seed: s(97) });
      }
      if (visU.length > 1) penLine(g, visU.map((q) => [q[0], q[1]]), { w: 2, alpha: 0.75, seed: s(98), weight: (t) => 0.3 + Math.sin(Math.PI * t) });
    }
    // eyes: on the eye bumps, each drawn in its own surface frame (so it foreshortens as the head turns)
    const eo = clamp(P.eye), happy = P.happy > 0.5;
    for (const sg of [-1, 1]) {
      const n = EYE_N(sg), v = Hx.vis(n); if (v < 0.02) continue;
      const fw = [0.58, -0.81, 0], fd = dot3(fw, n), c = Hx.at(EYE_AT(sg)), t1 = nrm(fw.map((x, i) => x - n[i] * fd)), t2 = cross(n, t1).map((x) => x * sg);
      const T1 = Hx.dir(t1), T2 = Hx.dir(t2);
      g.save(); g.translate(c[0], c[1]); g.transform(T1[0], T1[1], T2[0], T2[1], 0, 0); g.globalAlpha *= clamp(v * 5);
      drawEye(g, eo, happy, P.sleep);
      g.restore();
    }
    // forelock: a soft tuft of little curls on the poll, between the horns
    { g.save(); g.lineCap = 'round'; const r = rng(s(99));
      for (let k = 0; k < 16; k++) { const l = r.range(-16, 16), f0 = r.range(-30, -8), a = at([f0, -33 + Math.abs(l) * 0.25, l]), c2 = at([f0 + 9, -34 + Math.abs(l) * 0.25, l + r.range(-3, 3)]);
        if (Hx.vis(nrm([0.1, -1, l / 40])) < -0.2) continue;
        g.strokeStyle = k % 3 ? 'rgba(110,70,40,0.55)' : 'rgba(236,200,150,0.7)'; g.lineWidth = r.range(1.4, 2.4);
        g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(lerp(a[0], c2[0], 0.5) + r.range(-3, 3), lerp(a[1], c2[1], 0.5) - 4, c2[0], c2[1]); g.stroke(); }
      g.restore(); }
    hornAt(nearSg); earAt(nearSg, nearSg > 0 ? pe.flN : pe.flF);
  }
  // the eye in its surface frame: x forward (toward the nose), y down; one unit = one head unit
  function drawEye(g, eo, happy, sleep) {
    const R = ER, ry = R * 0.86;
    g.rotate(-0.2); // a level, open, friendly look (not drooping toward the nose)
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (eo < 0.12 || happy) {
      if (!happy) pool(g, 0, 0, R * 1.3, R * 1.0, '#d8b48a', 0.4);
      g.strokeStyle = rgba(INK, 0.9); g.lineWidth = 2.2; g.beginPath();
      if (happy) { g.moveTo(-R * 0.95, R * 0.1); g.quadraticCurveTo(0, -R * 0.85, R * 0.95, R * 0.05); g.stroke(); }
      else { g.moveTo(-R * 0.95, -R * 0.05); g.quadraticCurveTo(0, R * 0.62, R * 0.95, -R * 0.1); g.stroke();
        g.lineWidth = 1.3; for (let k = 0; k < 5; k++) { const x = -R * 0.6 + k * R * 0.3, y = R * 0.22 + Math.sin((k + 0.5) / 5 * Math.PI) * R * 0.08; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 2, y + 4, x - 4.5 - k * 0.3, y + 6); g.stroke(); } }
      return;
    }
    pool(g, 0, 1, R * 1.55, R * 1.35, '#f3dfc2', 0.7);              // the pale ring
    const top = -ry + 2 * ry * (1 - eo) * 0.9;
    g.save(); g.beginPath(); g.ellipse(0, 0, R, ry, 0, 0, 7); g.clip();
    const ig = g.createRadialGradient(R * 0.15, -ry * 0.1, 1, 0, 0, R * 1.05); ig.addColorStop(0, '#5a3824'); ig.addColorStop(0.5, '#2a1a10'); ig.addColorStop(1, '#100805');
    g.fillStyle = ig; g.fillRect(-R - 2, -R - 2, 2 * R + 4, 2 * R + 4);
    pool(g, -R * 0.1, ry * 0.55, R * 0.6, ry * 0.35, '#7a5238', 0.45);     // light through the iris
    g.fillStyle = '#0c0604'; g.beginPath(); g.ellipse(R * 0.2, ry * 0.02, R * 0.48, ry * 0.5, 0, 0, 7); g.fill();   // the pupil, looking forward
    g.fillStyle = 'rgba(255,255,255,0.94)'; g.beginPath(); g.ellipse(R * 0.38, -ry * 0.34, R * 0.26, R * 0.21, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(-R * 0.34, ry * 0.42, R * 0.1, 0, 7); g.fill();
    // the upper lid comes down (skin colour), soft
    g.fillStyle = '#a2704a'; g.fillRect(-R - 2, -R - 2, 2 * R + 4, top + R + 2);
    g.restore();
    g.strokeStyle = rgba(INK, 0.92); g.lineWidth = 2.1;
    g.beginPath(); g.moveTo(-R * 1.08, top * 0.4 + 1); g.quadraticCurveTo(0, top - 3.5, R * 1.06, top * 0.5 + 0.5); g.stroke();
    g.lineWidth = 1.1; g.strokeStyle = rgba(INK, 0.45); g.beginPath(); g.moveTo(-R * 0.85, ry * 0.6); g.quadraticCurveTo(0, ry * 1.05, R * 0.85, ry * 0.5); g.stroke();
    g.strokeStyle = rgba(INK, 0.22); g.beginPath(); g.moveTo(-R * 0.6, ry * 1.25); g.quadraticCurveTo(0, ry * 1.5, R * 0.6, ry * 1.2); g.stroke(); // a soft cheek: content
    // long lashes, sweeping up and back
    g.strokeStyle = rgba(INK, 0.9); g.lineWidth = 1.3;
    const lid = (u) => { const x = u * R * 1.06, t = (u + 1) / 2, a = (1 - t) * (1 - t) * (top * 0.4 + 1) + 2 * t * (1 - t) * (top - 3.5) + t * t * (top * 0.5 + 0.5); return [x, a]; };
    for (let k = 0; k < 5; k++) { const u = -0.75 + k * 0.32, [x, y] = lid(u), l = 5 + (1 - Math.abs(u + 0.3)) * 3;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 1 - u * 1.5, y - l * 0.7, x - 3 - k * 0.5 - (u < 0 ? 2 : 0), y - l); g.stroke(); }
    g.strokeStyle = rgba(INK, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(-R * 1.4, -R * 1.15); g.quadraticCurveTo(-R * 0.2, -R * 1.6, R * 0.8, -R * 1.3); g.stroke(); // a soft brow
    void sleep;
  }
  function hullPts(pts) {
    const p = pts.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return p;
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }

  function paint(g, Rg) {
    g.save(); g.scale(-1, 1);
    const B = Rg.bones, L = Rg.legs;
    // far legs (behind everything; their paler inner side, in shadow)
    for (const k of ['hindFar', 'foreFar']) { const fa = 1 - clamp((L[k].lieK - 0.5) / 0.4); if (fa <= 0) continue; g.save(); g.globalAlpha *= fa; const ls = limb(B[k].pts, B[k].ws); penLine(g, ls.shape, { closed: true, w: 3.2, alpha: 0.7, seed: s(60) }); legFill(g, L[k], B[k], true); legExtras(g, B[k], L[k].hind, true); drawHoof(g, L[k], B[k], true); dewClaw(g, B[k], true); g.restore(); }
    drawUdder(g, Rg);
    drawHead(g, Rg, 'back');
    // ONE silhouette: body + neck + near forearm + near gaskin are inked together, then filled over
    const O = outline(Rg);
    penLine(g, O.sm, { closed: true, w: 4.4, alpha: 0.74, seed: s(62), weight: (t) => 0.4 + 0.75 * Math.max(0, Math.sin(t * TAU * 4 + 1)) });
    const nears = ['hindNear', 'foreNear'];
    const exitY = (k) => { const ln = limb(B[k].pts, B[k].ws).line; for (const q of ln) if (!inPoly(q, O.sm)) return q[1]; return ln[ln.length - 1][1]; };
    for (const k of nears) { const ls = limb(B[k].pts, B[k].ws); penLine(g, ls.shape, { closed: true, w: 4, alpha: 0.85, seed: s(63) }); legExtras(g, B[k], L[k].hind, false); }
    const co = bodyPt(Rg.pb, [0, 0]), nearLs = nears.map((k) => legFill(g, L[k], B[k], false, co, exitY(k)));
    { g.save(); g.beginPath(); for (const ls of nearLs) { const q = ls.shape; g.moveTo(q[0][0], q[0][1]); for (const p of q) g.lineTo(p[0], p[1]); g.closePath(); } g.clip();
      g.fillStyle = formGrad(g, Rg.pb); g.fillRect(-400, -500, 900, 520); g.restore(); }
    for (const k of nears) legExtras(g, B[k], L[k].hind, false, false);
    paintBody(g, Rg, O, nearLs);
    // lying: the folded near legs lie over the side of the body: drawn again on top, fading in as she goes down
    for (const k of nears) {
      const Lg = L[k], lk = Lg.lieK; if (lk < 0.02) continue;
      const Bk = B[k], pts = Bk.hind ? [L2(Bk.E, Bk.K, 0.35), Bk.K, ...Bk.pts.slice(4)] : [L2(Bk.E, Bk.K, 0.3), Bk.K, ...Bk.pts.slice(4)];
      const ws = Bk.hind ? [42, 34, 23, 25, 19] : [34, 27, 19, 23, 18];
      const ls = limb(pts, ws);
      g.save(); g.globalAlpha *= clamp((lk - 0.15) / 0.5);
      const bx = bbox(ls.shape); bx.x0 -= 12; bx.y0 -= 12; bx.x1 += 12; bx.y1 += 12; bx.w += 24; bx.h += 24;
      faded(g, bx, pts[0], L2(pts[0], pts[1], 0.85), (o) => {
        penLine(o, ls.open, { w: 4, alpha: 0.85, seed: s(64) });
        legFill(o, { ...Lg, R: [0, -999] }, { ...Bk, pts, ws, K: Bk.K }, false, bodyPt(Rg.pb, [0, 0]));
        legExtras(o, Bk, Bk.hind, false); });
      g.restore();
    }
    for (const k of nears) { drawHoof(g, L[k], B[k], false); dewClaw(g, B[k], false); }
    drawTail(g, Rg);
    drawHead(g, Rg, 'front');
    g.restore();
  }
  const toCaller = (p, o = {}) => { const lx = -p[0], ly = p[1]; if (o.x === undefined && o.y === undefined && o.scale === undefined && o.face === undefined) return { x: lx, y: ly }; const f = o.face ?? 1, k = o.scale ?? 1; return { x: (o.x ?? 0) + f * k * lx, y: (o.y ?? 0) + k * ly }; };
  return {
    STRIDE,
    draw(g, st = {}) { paint(g, rigFromState(st)); },
    drawAt(g, poseFn, t, o = {}) { paint(g, rigAt(poseFn, t, o).R); },
    hoovesAt(poseFn, t, o = {}) { const R = rigAt(poseFn, t, o).R; return LEGS.map(([n]) => ({ ...toCaller(R.legs[n].H, o), planted: R.legs[n].planted })); },
    udderAt(st = {}, o = {}) { const R = rigFromState(st), u = bodyPt(R.pb, UDDER_AT, 0.4); return { ...toCaller(u, o), teats: [-24, -14, 10, 20].map((x, i) => toCaller([u[0] + x, u[1] + (i % 2 ? 33 : 36)], o)) }; },
    noseAt(poseFn, t, o = {}) { const R = rigAt(poseFn, t, o).R; return toCaller(R.Hx.at([MUZ.c[0] + MUZ.r[0], MUZ.c[1] - 4, 0]), o); },
    mouthAt(poseFn, t, o = {}) { const R = rigAt(poseFn, t, o).R; return toCaller(R.Hx.at([MUZ.c[0] + 10, MUZ.c[1] + MUZ.r[1] - 2, 0]), o); },
    headAt(poseFn, t, o = {}) { const R = rigAt(poseFn, t, o).R; return toCaller(R.Hc, o); },
    shadow(g, st = {}) { const lie = ease(st.lie || 0); g.save(); g.globalAlpha *= 0.55; pool(g, 10, 4, 270 + 40 * lie, 24 + 6 * lie, '#2a1e12', 0.45); g.restore(); },
  };
}
