// folk3: the shared machinery of the storybook PEOPLE (Molly the milkmaid, her mother: milkmaid.js, farmwife.js).
// It follows the "3" rigs (rig3: keyframes, damped-spring follow-through, one-piece mouth), but a person is built in
// real 3D and seen from ONE viewpoint per frame, so nothing can mix a front view with a profile:
//   - the body is a stack of elliptical rings (bodice, skirt) seen at the body's yaw; silhouettes, the apron, collar,
//     bib, folds, hem and buttons are all projected from those rings every frame (a fold line slides round as she turns)
//   - the head is ONE sphere; eyes, brows, nose, mouth, cheeks, freckles, ears, the hairline, the parting, the strands,
//     the plait roots, a kerchief or a mob cap are points / regions on it, seen at the head's own yaw and nod
//   - arms and legs are solved in 3D (two-bone IK with a pole: elbows go back / out, knees forward) and then projected,
//     so a limb pointing at us foreshortens instead of folding; boots are the convex hull of a projected 3D boot
// The look is pre-painted watercolour (fills painted once, clipped to the projected shapes) with live pen lines.
//
// FACING (same as crow3 / mice3 / cat3): drawn facing LEFT, feet on the ground at y = 0; mirror with scale(-1, 1).
// Internally everything faces RIGHT. yaw 0 = facing us, +SPEC.yaw = the default 3/4 view; turn 0 -> 1 goes through
// the true front view to -yaw, which is EXACTLY the mirrored picture of turn 0 (swap the facing, turn 0, fresh since).
import { wash, pool, smooth, bbox, sprite, drawSprite, rgba, shade, tint, mix, clamp, lerp, ease, penLine, hatch, looseWash,
  blooms, soften, path, ellipse } from '../watercolor.js';
import { PAPER, INK } from './kit.js';
import { TAU, fr, easeInOut, bell, key, glance, event, kernel, makeFilter, smileMouth, on, taper } from './rig3.js';

// ---------------------------------------------------------------- small 3D helpers ([f, l, y]: forward, her left, down)
export const A3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const S3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const M3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const D3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const L3 = (a) => Math.hypot(a[0], a[1], a[2]);
const N3 = (a) => { const l = L3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const X3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const lerp3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const slerp = (a, b, k) => N3(lerp3(a, b, k));
export const wrapA = (a) => a - TAU * Math.round(a / TAU);
const sph = (az, el) => [Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), Math.sin(el)];
// a 3x3 matrix as rows; rotations: pitch about the lateral axis (+ = chin up), roll about forward, yaw about vertical
const mmul = (A, B) => A.map((r) => [0, 1, 2].map((j) => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
const mv = (A, v) => [D3(A[0], v), D3(A[1], v), D3(A[2], v)];
const mT = (A) => [0, 1, 2].map((i) => [A[0][i], A[1][i], A[2][i]]);
export function headRot(dyaw, pitch, roll) {
  const cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll), cy = Math.cos(dyaw), sy = Math.sin(dyaw);
  const Rp = [[cp, 0, sp], [0, 1, 0], [-sp, 0, cp]];          // f' = f cp + y sp, y' = y cp - f sp
  const Rr = [[1, 0, 0], [0, cr, -sr], [0, sr, cr]];
  const Ry = [[cy, -sy, 0], [sy, cy, 0], [0, 0, 1]];          // f' = f cy - l sy, l' = f sy + l cy
  return mmul(Ry, mmul(Rr, Rp));
}
// project a body point at yaw Y: [screen x, screen y, depth toward us]. pitch: the camera looks a little down, so the
// nearer side of a ring sits lower (hems and waistbands curve); used for clothing rings only.
export function proj(Y, pitch = 0) {
  const c = Math.cos(Y), s = Math.sin(Y);
  return (p) => { const d = p[0] * c - p[1] * s; return [p[0] * s + p[1] * c, p[2] + d * pitch, d]; };
}
// two-bone IK in 3D: the joint goes to the side of `pole`
export function ik3(S, T, a, b, pole, stretch = 1) {
  const d = S3(T, S); const L = L3(d) || 1e-6; const u = M3(d, 1 / L);
  if (L > a + b) { const k = Math.min(stretch, L / (a + b)); a *= k; b *= k; }
  const dd = clamp(L, Math.abs(a - b) + 0.01, (a + b) * 0.9999);
  const x = (a * a - b * b + dd * dd) / (2 * dd), h = Math.sqrt(Math.max(0, a * a - x * x));
  let p = S3(pole, M3(u, D3(pole, u))); if (L3(p) < 1e-6) p = Math.abs(u[2]) < 0.9 ? X3(u, [0, 0, 1]) : X3(u, [1, 0, 0]);
  p = N3(p);
  return { E: A3(A3(S, M3(u, x)), M3(p, h)), T: A3(S, M3(u, dd)) };
}
// convex hull (monotone chain) of 2D points
export function hull(pts) {
  const p = pts.map((q) => [q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
// a filled outline with ONE pen line round the union of several shapes (stroke all wide, then fill all over)
export function unionInk(g, shapes, fill, o = {}) {
  g.save(); g.lineJoin = 'round';
  g.strokeStyle = rgba(o.ink || INK, o.inkA ?? 0.8); g.lineWidth = (o.w ?? 1.8) * 2;
  for (const s of shapes) { path(g, s); g.stroke(); }
  g.fillStyle = fill; for (const s of shapes) { path(g, s); g.fill(); }
  g.restore();
}

// a sheet of painted fabric / skin / hair: painted once, then clipped to projected shapes every frame
export function fillSprite(res, box, col, sd, o = {}) {
  const sh = [[box[0], box[1]], [box[2], box[1]], [box[2], box[3]], [box[0], box[3]]];
  return sprite(bbox(sh), res, (g) => {
    g.fillStyle = PAPER; g.fillRect(box[0] - 20, box[1] - 20, box[2] - box[0] + 40, box[3] - box[1] + 40);
    g.fillStyle = rgba(col, (o.base ?? 0.72) * 0.75); g.fillRect(box[0] - 20, box[1] - 20, box[2] - box[0] + 40, box[3] - box[1] + 40);
    looseWash(g, sh, col, { opacity: 0.55, seed: sd + 9, shift: 6, reserves: 6, reserveSize: 0.1 });
    blooms(g, sh, o.blooms || [tint(col, 0.25), shade(col, 0.14), tint(col, 0.4), col], { n: o.nb ?? 18, size: o.bsize ?? 0.16, seed: sd + 2, alpha: o.ba ?? 0.4 });
    if (o.paint) o.paint(g, sh);
    soften(g, 0.9 * res);
    if (o.weave) hatch(g, sh, { color: shade(col, 0.45), count: o.weave, len: o.wlen || 7, width: 0.7, alpha: o.wa ?? 0.2, seed: sd + 3, dir: o.dir || (() => Math.PI / 2), curve: 0.25 });
    if (o.after) o.after(g, sh);
  }, { seed: sd + 6, grain: o.grain ?? 0.14, margin: 0.02 });
}
function clipFill(g, poly, spr, o = {}) {
  if (!poly || poly.length < 3) return;
  g.save(); path(g, poly); g.clip(); if (o.at) { g.save(); g.translate(o.at[0], o.at[1]); drawSprite(g, spr); g.restore(); } else drawSprite(g, spr);
  if (o.shade) { // form shading across the shape: darker toward both limbs, more on the side away from the light
    const b = bbox(poly), gr = g.createLinearGradient(b.x0, 0, b.x1, 0);
    gr.addColorStop(0, rgba(o.shade, o.sl ?? 0.16)); gr.addColorStop(0.35, rgba(o.shade, 0)); gr.addColorStop(0.7, rgba(o.shade, 0.04)); gr.addColorStop(1, rgba(o.shade, o.sr ?? 0.3));
    g.fillStyle = gr; g.fillRect(b.x0 - 2, b.y0 - 2, b.w + 4, b.h + 4);
    if (o.top) { const gv = g.createLinearGradient(0, b.y0, 0, b.y1); gv.addColorStop(0, rgba(o.shade, 0)); gv.addColorStop(1, rgba(o.shade, o.top)); g.fillStyle = gv; g.fillRect(b.x0 - 2, b.y0 - 2, b.w + 4, b.h + 4); }
  }
  if (o.shade) { // shadeEdge, cheaply: soft darker strokes just inside the outline
    g.lineJoin = 'round'; g.strokeStyle = rgba(o.shade, 0.16); g.lineWidth = 14; path(g, poly); g.stroke();
    g.strokeStyle = rgba(o.shade, 0.14); g.lineWidth = 5; path(g, poly); g.stroke(); }
  if (o.after) o.after();
  g.restore();
}
const ink = (g, pts, w = 1.8, a = 0.8, o = {}) => { const ph = (o.seed || 7) * 0.7; if (pts.length > 1) penLine(g, pts, { closed: !!o.closed, color: o.color || INK, w: w * 0.95, alpha: a, seed: o.seed || 7, wobble: 0.45, weight: o.weight || ((t) => 0.3 + 0.85 * Math.abs(Math.sin(t * Math.PI * (o.closed ? 3 : 1.5) + ph))) }); };
const thin = (g, pts, w, col, a = 1) => { if (pts.length < 2) return; g.save(); g.strokeStyle = rgba(col, a); g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); g.stroke(); g.restore(); };

// ---------------------------------------------------------------- soft painted limbs
// ONE closed outline round a smooth centre line with a width profile (widths per control point), rounded ends
export function limbShape(pts, widths, seg = 6) {
  const c = smooth(pts, false, seg), n = c.length, L = [], R = [];
  const wAt = (t) => { const x = t * (widths.length - 1), i = Math.min(widths.length - 2, Math.floor(x)); return lerp(widths[i], widths[i + 1], x - i); };
  const nrm = (i) => { const a = c[Math.max(0, i - 1)], b = c[Math.min(n - 1, i + 1)]; let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; };
  for (let i = 0; i < n; i++) { const [dx, dy] = nrm(i), w = wAt(i / (n - 1)) / 2; L.push([c[i][0] - dy * w, c[i][1] + dx * w]); R.push([c[i][0] + dy * w, c[i][1] - dx * w]); }
  // round ends: from the left edge round the tip to the right edge, and round the root back to the left edge
  const cap = (i, a0) => { const [dx, dy] = nrm(i), w = wAt(i === 0 ? 0 : 1) / 2, o = []; for (let k = 1; k < 6; k++) { const a = a0(dx, dy) - Math.PI * k / 6; o.push([c[i][0] + Math.cos(a) * w, c[i][1] + Math.sin(a) * w]); } return o; };
  return { shape: L.concat(cap(n - 1, (dx, dy) => Math.atan2(dx, -dy)), R.reverse(), cap(0, (dx, dy) => Math.atan2(-dx, dy))), line: c };
}
// paint a limb shape: colour, soft shading on the far side, a light along the near side, a pen line of varying weight
export function paintLimb(g, ls, col, o = {}) {
  const sh = ls.shape, b = bbox(sh), w = o.w || 12;
  g.save(); path(g, sh); g.clip();
  g.fillStyle = col; g.fillRect(b.x0 - 2, b.y0 - 2, b.w + 4, b.h + 4);
  if (o.spr) { g.save(); g.globalAlpha *= o.sprA ?? 0.9; g.translate(o.at[0], o.at[1]); drawSprite(g, o.spr); g.restore(); }
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.save(); g.translate(w * 0.32, w * 0.12); g.strokeStyle = rgba(shade(col, 0.55), 0.22); g.lineWidth = w * 0.7; path(g, sh); g.stroke(); g.restore();
  g.strokeStyle = rgba(shade(col, 0.5), 0.12); g.lineWidth = w * 0.35; path(g, sh); g.stroke();
  g.save(); g.translate(-w * 0.2, -w * 0.05); g.strokeStyle = rgba(tint(col, 0.6), 0.35); g.lineWidth = w * 0.22; g.beginPath(); ls.line.slice(1, -2).forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); g.restore();
  if (o.after) o.after();
  g.restore();
  penLine(g, sh, { closed: true, color: INK, w: o.pw ?? 1.7, alpha: 0.8, seed: o.seed || 3, wobble: 0.35, weight: (t) => 0.35 + 0.8 * Math.max(0, Math.sin(t * TAU * 2 + 0.7)) });
}

// ---------------------------------------------------------------- walking (shared with the stager through STRIDE)
// one foot of the walk cycle in ROOT space: [dx, lift, toe pitch (+ = toe up), heelOff]; planted for q in [-0.05, 0.55]
// (so walk = k/2 rests with both feet down). The heel rises at the end of the stance while the toe stays put.
export function walkFoot(q, S, LIFT) {
  q = fr(q + 0.05) - 0.05;
  if (q < 0.55) { const ho = ease((q - 0.4) / 0.15), toeIn = key(q, [[-0.05, 0.3], [0.06, 0]]); return [-S * (q - 0.25), 0, toeIn - 0.5 * ho, ho]; }
  const u = (q - 0.55) / 0.4, s = Math.sin(Math.PI * u);
  return [-S * 0.3 + S * 0.6 * easeInOut(u), LIFT * s ** 0.8, key(u, [[0, -0.5], [0.35, -0.2], [0.75, 0.15], [1, 0.3]]), 0];
}
export const walkRest = (p) => Math.ceil(p * 2 - 1e-6) / 2;
const dx0 = (q) => { q = fr(q + 0.05) - 0.05; return q < 0.55 ? -140 * (q - 0.25) : 0; };
// the skip's hop: the standing foot springs up during its single support (q in 0.1..0.4), the body with it
const hopOf = (q) => { q = fr(q + 0.05) - 0.05; return q > 0.1 && q < 0.4 ? Math.sin(Math.PI * (q - 0.1) / 0.3) : 0; };

// ---------------------------------------------------------------- the pail (shared: Molly carries it, Mother hands it over)
export const PAIL = { H: 52, R0: 24, R1: 31, RY: 8 };
export function makePailSprite(res, sd) {
  const { H, R0, R1, RY } = PAIL;
  const body = smooth([[-R1, -H], [-R0, -3], [-R0 + 4, 2], [0, 4], [R0 - 4, 2], [R0, -3], [R1, -H], [0, -H + RY]], true, 6);
  return sprite(bbox(body.concat([[-R1 - 4, -H - RY - 4], [R1 + 4, 8]])), res, (g) => {
    wash(g, body, { color: '#c7b8a0', opacity: 0.95, under: PAPER, seed: sd });
    blooms(g, body, ['#d8ccb8', '#a89a84', '#e4dccc'], { n: 6, seed: sd + 1, alpha: 0.35 });
    g.save(); path(g, body); g.clip();
    const gr = g.createLinearGradient(-R1, 0, R1, 0); gr.addColorStop(0, 'rgba(70,55,40,0.28)'); gr.addColorStop(0.35, 'rgba(255,250,240,0.25)'); gr.addColorStop(0.55, 'rgba(255,250,240,0)'); gr.addColorStop(1, 'rgba(70,55,40,0.38)');
    g.fillStyle = gr; g.fillRect(-R1 - 4, -H - 10, 2 * R1 + 8, H + 20);
    for (let k = -3; k <= 3; k++) penLine(g, [[k * R1 / 3.4, -H + RY * 0.9], [k * R0 / 3.4, 2]], { color: '#6a5a44', w: 0.9, alpha: 0.35, seed: sd + 2 + k });
    for (const y of [-H + 12, -12]) { const r = lerp(R1, R0, (y + H) / H); penLine(g, smooth([[-r, y], [0, y + RY * 0.7], [r, y]], false, 6), { color: '#5a5048', w: 3.2, alpha: 0.6, seed: sd + 9 }); }
    g.restore();
    penLine(g, body, { closed: true, color: INK, w: 1.8, alpha: 0.8, seed: sd + 4 });
  }, { seed: sd + 5, grain: 0.12 });
}
// draw a pail: bottom centre at (x, y), turned by ang (0 = upright), milk 0..1; o.bail: angle of the handle from upright
export function drawPail(g, spr, x, y, ang, milk = 0.8, o = {}) {
  const { H, R1, RY } = PAIL;
  g.save(); g.translate(x, y); g.rotate(ang); if (o.hang) g.translate(0, H + R1 * 1.05);
  const bail = o.bail ?? 1.3, br = R1 + 1;
  // the handle behind (far half) then the pail
  const bailPts = (half) => { const out = []; for (let k = 0; k <= 16; k++) { const a = Math.PI * k / 16; const px = -br * Math.cos(a), lift = br * 1.05 * Math.sin(a); const z = Math.sin(a); if (half === 'back' ? z < 0.5 : true) out.push([px, -H - lift * Math.cos(bail), z]); } return out; };
  const arc = bailPts('all').map(([px, py]) => [px, py + Math.sin(bail) * 0]);
  const tip = Math.sin(bail); // handle lying down to one side: squash its height, push it toward +x
  const hp = arc.map(([px, py]) => [px + tip * (py + H) * -0.25, -H + (py + H) * Math.cos(bail)]);
  if (Math.cos(bail) > 0) thin(g, hp, 2.6, '#4a4038', 0.85);
  drawSprite(g, spr);
  // inside: dark interior, milk surface
  g.save(); g.beginPath(); g.ellipse(0, -H, R1 - 2.5, RY - 1.5, 0, 0, 7); g.clip();
  g.fillStyle = '#3e342a'; g.fillRect(-R1, -H - RY, 2 * R1, 2 * RY);
  if (milk > 0.02) { const my = -H + (1 - milk) * 9; g.fillStyle = '#fbf6ea'; g.beginPath(); g.ellipse(0, my + 1.5, (R1 - 3) * (0.86 + 0.14 * milk), (RY - 2) * (0.86 + 0.14 * milk), 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(-8, my, 7, 1.6, 0, 0, 7); g.fill(); }
  g.restore();
  g.strokeStyle = rgba(INK, 0.75); g.lineWidth = 1.6; g.beginPath(); g.ellipse(0, -H, R1, RY, 0, 0, 7); g.stroke();
  g.strokeStyle = 'rgba(255,250,240,0.6)'; g.lineWidth = 1.1; g.beginPath(); g.ellipse(0, -H + 0.8, R1 - 1.5, RY - 1.2, 0, 0.2, Math.PI - 0.2); g.stroke();
  if (Math.cos(bail) <= 0) thin(g, hp, 2.6, '#4a4038', 0.85);
  for (const sx of [-1, 1]) { g.fillStyle = '#5a5048'; g.beginPath(); g.arc(sx * br, -H + 1, 2.4, 0, 7); g.fill(); }
  g.restore();
}

// ---------------------------------------------------------------- the pose solver (state -> posture numbers)
const ARMW = ['wave', 'stroke', 'hug', 'daydream', 'gasp', 'twirlW', 'milk', 'pailUp', 'pailUp2', 'hold', 'give', 'brush', 'tuck', 'comfort', 'lap', 'clasp', 'tossW', 'skirt', 'bedArms', 'reach', 'hips', 'skipW'];
export const DEF = { life: 1, eye: 1, smile: 0.6, seatH: 62, milkLevel: 0.85, pailHands: 1, strokeF: 74, strokeY: -232, give: 0 };
const PHASES = new Set(['walk', 'toss', 'twirl', 'milkPhase']);
const filtered = makeFilter(PHASES, DEF);
// the head toss (phase 0..1): the pail leaves the head at TOSS_RELEASE
export const TOSS_RELEASE = 0.44;

function solve(st, SP, dl = 0) {
  const t = (st.t || 0) - dl, v = (k) => st[k] ?? SP.def?.[k] ?? DEF[k] ?? 0, sd = SP.seed || 0;
  const P = { lean: v('lean'), bx: v('bodyX'), by: v('bodyY'), sq: 0, shUp: 0, rdy: 0,
    turnH: v('headTurn'), pitch: v('nod'), roll: v('headTilt'), hx: 0, hy: 0,
    eye: v('eye'), happy: v('happy'), big: v('eyeBig'), gaze: v('gaze'), look: v('look'), brow: v('browUp'), sad: v('sad'),
    mouth: v('mouth'), smile: v('smile'), mdeep: 11, mO: 0, tear: v('tear'), blush: 0,
    swing: 0, plSwing: 0, plFly: 0, plLift: 0, skFlare: 0, skSwish: 0, pailSway: 0, pailTilt: v('pailTilt'), W: {}, A: {} };
  const W = P.W; for (const k of ARMW) W[k] = 0;
  for (const k of ['wave', 'stroke', 'hug', 'daydream', 'gasp', 'milk', 'give', 'brush', 'tuck', 'comfort', 'lap', 'clasp', 'reach', 'hips']) W[k] = clamp(v(k));
  const wa = clamp(v('walkAmt')), skip = clamp(v('skip')), sadW = clamp(v('sadWalk')), sit = clamp(v('sit')), kneel = clamp(v('kneel')), bend = clamp(v('bend'));
  const toss = v('toss'), twirl = v('twirl'), dream = W.daydream, gasp = W.gasp, sadV = clamp(v('sad')), turn = clamp(v('turn')), front = clamp(v('front'));
  const busy = clamp(Math.max(wa * 0.6, on(toss), on(twirl), dream * 0.7, gasp, W.milk * 0.7, W.stroke * 0.5, W.hug, W.comfort, W.tuck * 0.8, turn > 0 && turn < 1 ? 1 : 0, clamp(v('bed'))));
  const life = clamp(v('life')) * (1 - busy);
  // idle life: breathing, glances, blinks, a little weight shift, plaits and apron sway
  const g1 = glance(t, 2.9, 3 + sd, 0.55), g2 = glance(t + 1.3, 4.1, 7 + sd, 0.7);
  P.turnH += life * 0.18 * g2; P.pitch += life * 0.05 * g1; P.roll += life * 0.04 * g2; P.look += life * 0.5 * g2; P.gaze += life * 0.25 * g1;
  P.lean += life * 0.012 * Math.sin(t * TAU * 0.1 + sd); P.bx += life * 1.5 * Math.sin(t * TAU * 0.1 + sd);
  const bl = event(t, 3.9, 0.22, 41 + sd);
  if (!st.noBlink && bl >= 0 && !(st.eyeBig > 0.4)) P.eye *= 1 - Math.sin(Math.PI * bl) ** 0.6;
  P.plSwing += 0.05 * Math.sin(t * TAU * 0.23 + sd); P.skSwish += 0.25 * Math.sin(t * TAU * 0.17 + sd);
  // walking / skipping / the sad slow walk
  const ph = v('walk');
  if (wa > 0) {
    const s2 = Math.cos(ph * 2 * TAU), s1 = Math.sin(ph * TAU);
    P.by -= wa * (1 + 3 * (0.5 - 0.5 * s2)) * (1 - 0.5 * sadW);
    P.lean += wa * (0.03 + 0.012 * s1); P.roll += wa * 0.03 * s1 * (1 - sadW); P.pitch -= wa * 0.02 * s2;
    P.swing = wa * Math.cos(TAU * (ph - 0.55)) * (1 - 0.6 * sadW); P.plSwing += wa * 0.1 * Math.sin(ph * 2 * TAU - 1.2); P.skSwish += wa * 1.0 * s1; P.pailSway += wa * Math.sin(ph * TAU - 0.6);
    P.turnH -= wa * 0.05;
  }
  if (skip > 0) {
    const hp = Math.max(hopOf(ph), hopOf(ph + 0.5)), H = SP.hopH || 16;
    P.rdy -= skip * H * hp; P.sq -= skip * 0.04 * hp; P.happy = Math.max(P.happy, skip * 0.6); P.smile = lerp(P.smile, 1, skip); P.mouth = Math.max(P.mouth, skip * 0.18);
    P.plLift += skip * 0.5 * hp; P.plSwing += skip * 0.18 * Math.sin(ph * 2 * TAU - 1.8); P.pitch += skip * 0.06; W.skipW = skip;
    P.skFlare += skip * 0.06 * hp;
  }
  if (sadW > 0) { P.pitch -= sadW * 0.32; P.lean += sadW * 0.06; P.sad = Math.max(P.sad, sadW); P.smile = lerp(P.smile, 0.15, sadW); P.eye *= 1 - 0.25 * sadW; P.gaze -= sadW * 0.7; P.shUp -= sadW * 4; P.turnH += sadW * 0.12; }
  // feelings
  if (sadV > 0) { P.smile = lerp(P.smile, 0.12, sadV); P.pitch -= sadV * 0.12; P.brow -= 0; P.eye *= 1 - 0.18 * sadV; P.gaze -= sadV * 0.4; }
  if (gasp > 0) { P.mO = Math.max(P.mO, gasp); P.big = Math.max(P.big, gasp); P.brow += gasp; P.pitch += gasp * 0.08; P.lean -= gasp * 0.05; P.shUp += gasp * 4; P.smile = lerp(P.smile, 0.3, gasp); }
  if (dream > 0) { const s = Math.sin(t * TAU * 0.12); P.gaze += dream * 1.4; P.pitch += dream * 0.2; P.roll += dream * (0.16 + 0.04 * s); P.turnH += dream * 0.2; P.smile = lerp(P.smile, 0.95, dream); P.eye *= 1 - 0.22 * dream; P.lean -= dream * 0.03; P.bx += dream * 2 * s; P.blush += dream * 0.4; }
  const nodA = clamp(v('nodding')); if (nodA > 0) { const s = Math.sin(t * TAU * 1.5); P.pitch -= nodA * (0.08 + 0.1 * s); }
  const happyB = clamp(v('bounce')); if (happyB > 0) { const b = Math.abs(Math.sin(t * TAU * 1.3)); P.rdy -= happyB * 6 * b; P.happy = Math.max(P.happy, happyB * 0.7); P.plLift += happyB * 0.3 * b; P.smile = lerp(P.smile, 1, happyB); }
  // the head toss (phase): chin tucked for a smug moment, then up and back and to the side, plaits fly, settle
  if (toss > 0 && toss < 1) {
    const u = toss;
    const up = key(u, [[0, 0], [0.22, -0.12], [0.34, -0.14], [0.46, 0.5], [0.62, 0.46], [0.86, 0.04], [1, 0]]);
    P.pitch += up; P.roll += key(u, [[0, 0], [0.3, -0.05], [0.46, 0.3], [0.64, 0.26], [1, 0]]); P.turnH += key(u, [[0, 0], [0.3, 0.1], [0.46, -0.35], [0.66, -0.3], [1, 0]]);
    P.happy = Math.max(P.happy, key(u, [[0.05, 0], [0.18, 1], [0.38, 1], [0.44, 0], [1, 0]])); P.smile = lerp(P.smile, 1, bell(u, 0, 0.7));
    P.lean += key(u, [[0, 0], [0.3, 0.03], [0.46, -0.07], [0.7, -0.04], [1, 0]]); P.shUp += 5 * bell(u, 0.3, 0.7);
    P.plFly += key(u, [[0.36, 0], [0.48, 1], [0.62, 0.7], [0.85, 0], [1, 0]]); P.plSwing -= 0.5 * bell(u, 0.38, 0.8);
    P.pailTilt += key(u, [[0.3, 0], [TOSS_RELEASE, 0.55], [0.6, 1.6]]); W.tossW = key(u, [[0.3, 0], [0.4, 1], [0.7, 1], [1, 0]]);
    P.big = Math.max(P.big, key(u, [[0.5, 0], [0.62, 0.8], [0.8, 0.8], [1, 0.3]]) * (v('tossSurprise') || 0));
  }
  // twirl (phase): a gentle full turn on the spot, the skirt flaring, arms out holding the skirt
  if (twirl > 0 && twirl < 1) {
    const w = bell(twirl, 0, 1); W.twirlW = key(twirl, [[0, 0], [0.12, 1], [0.88, 1], [1, 0]]);
    P.happy = Math.max(P.happy, 0.8 * w); P.smile = lerp(P.smile, 1, w); P.roll += 0.1 * w; P.pitch += 0.12 * w; P.mouth = Math.max(P.mouth, 0.2 * w);
    P.skFlare += 0.32 * w; P.plFly += 0.55 * w; P.rdy -= 4 * w;
  }
  // milking (sitting on the stool, hands working in turn), stroking a nose, waving, the hug, the hold
  if (W.milk > 0) { P.pitch -= W.milk * 0.12; P.lean += W.milk * 0.16; P.turnH += W.milk * 0.12 * Math.sin(t * 0.7); P.A.milkPh = st.milkPhase ?? t * 1.6; P.smile = lerp(P.smile, 0.75, W.milk); }
  if (W.stroke > 0) { P.lean += W.stroke * 0.05; P.smile = lerp(P.smile, 0.85, W.stroke); P.eye *= 1 - 0.15 * W.stroke; P.roll += 0.08 * W.stroke; }
  if (W.wave > 0) { P.smile = lerp(P.smile, 0.95, W.wave); P.turnH += 0.15 * W.wave; P.happy = Math.max(P.happy, 0.25 * W.wave); }
  if (W.hug > 0) { P.happy = Math.max(P.happy, W.hug * 0.9); P.smile = lerp(P.smile, 0.9, W.hug); P.roll += W.hug * 0.2; P.lean += W.hug * 0.08; P.turnH -= W.hug * 0.15; }
  if (W.comfort > 0) { P.smile = lerp(P.smile, 0.75, W.comfort); P.roll += W.comfort * 0.18; P.pitch -= W.comfort * 0.18; P.eye *= 1 - 0.25 * W.comfort; P.lean += W.comfort * 0.12; }
  if (W.give > 0) { P.lean += W.give * 0.06; P.pitch -= W.give * 0.12; }
  if (W.tuck > 0) { P.pitch -= W.tuck * 0.3; P.eye *= 1 - 0.3 * W.tuck; P.smile = lerp(P.smile, 0.8, W.tuck); }
  if (W.brush > 0) { P.pitch -= W.brush * 0.12; P.roll += W.brush * 0.12; P.smile = lerp(P.smile, 0.7, W.brush); }
  if (W.clasp > 0) P.smile = lerp(P.smile, 0.8, W.clasp);
  // the pail: carried on the head (hands steadying it), held in a hand, or nowhere
  P.A.pailOn = st.pailOn || 'none';
  if (P.A.pailOn === 'head') { const n = clamp(v('pailHands'), 0, 2); W.pailUp = clamp(n) * (1 - clamp(W.tossW * 1.2)); W.pailUp2 = clamp(n - 1) * (1 - clamp(W.tossW * 1.2)); P.pitch *= 0.5; P.roll *= 0.6; P.turnH *= 0.7; }
  if (P.A.pailOn === 'hand') W.hold = 1;
  // sitting (on the stool, a chair or a lap), kneeling, bending
  P.sit = sit; P.kneel = kneel;
  if (sit > 0) { P.lean -= sit * 0.04; P.plSwing *= 1 - 0.5 * sit; }
  if (kneel > 0) { P.lean += kneel * 0.06; }
  if (bend > 0) { P.lean += bend * 0.85; P.pitch += bend * 0.45; }
  // breathing
  const sleep = clamp(v('sleep'));
  P.breath = Math.sin(t * TAU * lerp(0.28, 0.17, sleep)) * (1 + 1.2 * sleep);
  P.sq += P.breath * 0.006;
  // in bed: sitting up (lie 0) or lying back on the pillow (lie 1), asleep
  P.bed = clamp(v('bed')); P.lie = clamp(v('lie'));
  if (P.bed > 0) {
    const k = ease(P.lie);
    P.lean = lerp(P.lean, -1.32, k); P.pitch = lerp(P.pitch, -0.05, k); P.roll = lerp(P.roll, -0.25, k); P.turnH = lerp(P.turnH, 0.95, k); P.look *= 1 - k;
    W.bedArms = 1; P.plSwing *= 1 - k; P.skSwish *= 0.2;
  }
  if (sleep > 0) { P.eye *= 1 - ease(sleep / 0.6); P.happy *= 1 - sleep; P.big *= 1 - sleep; P.mouth *= 1 - sleep; P.mO *= 1 - sleep; P.smile = lerp(P.smile, 0.7, sleep); P.gaze *= 1 - sleep; }
  // turning round (head leads, body follows) / turning to face us; the twirl's full circle
  P.turnRaw = turn;
  const tH = ease(turn / 0.7), tB = ease((turn - 0.15) / 0.75);
  P.sgnH = 1 - 2 * tH; P.sgnB = 1 - 2 * tB;
  P.front = front;
  P.spin = 0; P.spinH = 0;
  if (twirl > 0 && twirl < 1) { P.spin = TAU * easeInOut(clamp((twirl - 0.04) / 0.92)); P.spinH = TAU * easeInOut(clamp((twirl - 0.035) / 0.91)); }
  P.skip = skip; P.sadW = sadW; P.wa = wa;
  return P;
}

// ---------------------------------------------------------------- springs
const K = { head: kernel(3.0, 0.6, 0.45, 9), body: kernel(2.4, 0.55, 0.6, 9), arm: kernel(2.3, 0.5, 0.7, 9), skirt: kernel(2.2, 0.45, 0.75, 11), plait: kernel(1.6, 0.32, 1.1, 11), pail: kernel(1.4, 0.3, 1.2, 11) };
const LAG = { head: 0, body: 0.04, arm: 0.07, skirt: 0.08, plait: 0.1, pail: 0.12 };
const PLAIT_DELAYS = [0, 0.06, 0.13, 0.21, 0.3];

// ---------------------------------------------------------------- the rig factory
// SP: the person's proportions and look (see milkmaid.js / farmwife.js)
export function makeFolk(res, seed, SP) {
  const s = (n) => seed * 100 + n;
  const HR = SP.HR, C = SP.col;
  const pailSpr = makePailSprite(res, s(90));
  // painted sheets
  const fills = {
    dress: fillSprite(res, SP.boxBody, C.dress, s(1), { weave: 160, wa: 0.12, paint: SP.printDress }),
    apron: fillSprite(res, SP.boxBody, C.apron, s(2), { base: 0.55, blooms: ['#ffffff', '#efe6d4', '#f8f2e4', '#e8dcc6'], weave: 60, wa: 0.08 }),
    skin: fillSprite(res, SP.boxBody, C.skin, s(3), { base: 0.75, blooms: [tint(C.skin, 0.3), C.cheek, shade(C.skin, 0.08)], ba: 0.3, nb: 10 }),
    hair: fillSprite(res, [-HR * 1.5, -HR * 1.6, HR * 1.5, HR * 1.4], C.hair, s(4), { base: 0.85, blooms: [tint(C.hair, 0.2), shade(C.hair, 0.2), mix(C.hair, '#d8a060', 0.3)], weave: 140, wlen: 10, wa: 0.25, dir: () => 0.3 }),
    sock: fillSprite(res, [-80, -140, 80, 10], C.sock, s(5), { base: 0.6, weave: 60, wa: 0.15, dir: () => 0 }),
    night: fillSprite(res, SP.boxBody, '#f2ebdd', s(6), { base: 0.6, blooms: ['#ffffff', '#e8dcc8'], paint: (g, sh) => { const b = bbox(sh); for (let y = b.y0; y < b.y1; y += 14) for (let x = b.x0 + ((y / 14) % 2) * 7; x < b.x1; x += 14) { g.fillStyle = 'rgba(150,170,210,0.55)'; g.beginPath(); g.arc(x, y, 1.8, 0, 7); g.fill(); } } }),
  };
  if (C.kerchief) fills.kerchief = fillSprite(res, [-HR * 1.6, -HR * 1.6, HR * 1.6, HR * 1.4], C.kerchief, s(7), { base: 0.85, paint: (g, sh) => { const b = bbox(sh); for (let y = b.y0; y < b.y1; y += 9) for (let x = b.x0 + ((y / 9) % 2) * 4.5; x < b.x1; x += 9) { g.fillStyle = 'rgba(255,248,235,0.85)'; g.beginPath(); g.arc(x, y, 1.7, 0, 7); g.fill(); } } });
  if (C.cap) fills.cap = fillSprite(res, [-HR * 1.8, -HR * 1.8, HR * 1.8, HR * 1.4], C.cap, s(8), { base: 0.5, blooms: ['#ffffff', '#efe6d4'], weave: 80, wa: 0.12 });
  if (SP.bed) fills.quilt = fillSprite(res, [-300, -260, 340, 40], '#c9a88a', s(9), { base: 0.4, nb: 0, paint: (g) => {
    const cols = ['#c97a6a', '#e8d8b8', '#8fa58a', '#d9b86a', '#8c9db0', '#e8c0b0', '#b08a6a'];
    let k = 0; for (let y = -260; y < 40; y += 34) for (let x = -300; x < 340; x += 34) { const c = cols[(k++ * 5 + Math.floor(y / 34) * 3) % cols.length]; const sq = [[x, y], [x + 34, y], [x + 34, y + 34], [x, y + 34]];
      wash(g, sq, { color: c, opacity: 0.8, seed: s(200 + k), edge: 0.3 }); if (k % 3 === 0) for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(255,250,240,0.7)'; g.beginPath(); g.arc(x + 8 + (i % 2) * 18, y + 8 + Math.floor(i / 2) * 18, 2, 0, 7); g.fill(); } }
    for (let y = -260; y < 40; y += 34) penLine(g, [[-300, y], [340, y]], { color: '#7a5a44', w: 0.9, alpha: 0.35 });
    for (let x = -300; x < 340; x += 34) penLine(g, [[x, -260], [x, 40]], { color: '#7a5a44', w: 0.9, alpha: 0.35 });
  } });
  // the head's skin ball (round from every side): painted once
  const headSpr = sprite(bbox(ellipse(0, 0, HR + 4, HR + 4, 8)), res, (g) => {
    const sh = ellipse(0, 0, HR, HR, 48);
    wash(g, sh, { color: C.skin, opacity: 0.85, under: PAPER, seed: s(10), edge: 0.2 });
    blooms(g, sh, [tint(C.skin, 0.35), mix(C.skin, C.cheek, 0.4)], { n: 5, seed: s(11), alpha: 0.25 });
    g.save(); path(g, sh); g.clip();
    const gr = g.createRadialGradient(-HR * 0.3, -HR * 0.35, HR * 0.2, 0, 0, HR * 1.05); gr.addColorStop(0, 'rgba(255,248,236,0.35)'); gr.addColorStop(0.6, 'rgba(255,248,236,0)'); gr.addColorStop(1, rgba(shade(C.skin, 0.45), 0.4));
    g.fillStyle = gr; g.fillRect(-HR - 2, -HR - 2, 2 * HR + 4, 2 * HR + 4); g.restore();
    soften(g, 0.7 * res);
  }, { seed: s(13), grain: 0.1 });
  // the soft lower face: a jaw ellipsoid (head-local unit space) whose outline joins the skull's: an egg-shaped chin,
  // fuller lower cheeks
  const JAW = []; for (let i = 0; i < 16; i++) for (let j = 1; j < 8; j++) { const a = TAU * i / 16, b = Math.PI * j / 8; JAW.push([0.1 + 0.86 * Math.cos(b), 0.93 * Math.sin(b) * Math.cos(a), 0.27 + 0.76 * Math.sin(b) * Math.sin(a)]); }
  const EAR = smooth([[-3, -9], [3, -10], [7, -4], [6, 4], [2, 9], [-3, 8], [-4, 0]]);
  const earSpr = sprite(bbox(EAR), res, (g) => { wash(g, EAR, { color: C.skin, opacity: 0.9, under: PAPER, seed: s(14) }); g.fillStyle = rgba(C.cheek, 0.45); g.beginPath(); g.ellipse(1.5, 0, 2.6, 5, 0.1, 0, 7); g.fill(); penLine(g, EAR, { closed: true, w: 1.3, alpha: 0.75 }); penLine(g, [[2, -5], [4, 0], [1, 5]], { w: 0.9, alpha: 0.45 }); }, { granulate: false });

  // ---- geometry helpers
  const ringPt = (y, a, b, th, rm = 1) => [b * rm * Math.cos(th), a * rm * Math.sin(th), y];
  const NR = 40, THS = Array.from({ length: NR }, (_, i) => -Math.PI + TAU * i / NR);
  // a body matrix: lean (rotation) and squash about the hip pivot, plus offsets. [a, b, c, d, e, f] like setTransform
  function bodyM(P, pivot) {
    const c = Math.cos(P.lean), sn = Math.sin(P.lean), sx = 1 - P.sq * 0.4, sy = 1 + P.sq;
    const a = c * sx, b = sn * sx, cc = -sn * sy, d = c * sy;
    const e = pivot[0] + P.bx - (a * pivot[0] + cc * pivot[1]), f = pivot[1] + P.by + P.rdy - (b * pivot[0] + d * pivot[1]);
    return [a, b, cc, d, e, f];
  }
  const ap = (M, p) => [M[0] * p[0] + M[2] * p[1] + M[4], M[1] * p[0] + M[3] * p[1] + M[5]];
  const inv = (M) => { const det = M[0] * M[3] - M[1] * M[2]; return [M[3] / det, -M[1] / det, -M[2] / det, M[0] / det, (M[2] * M[5] - M[3] * M[4]) / det, (M[1] * M[4] - M[0] * M[5]) / det]; };

  // ---- the head: where it is and how it is turned, as a 3D transform (head-local unit sphere -> body 3D)
  function headXf(P, yawB, spinH) {
    const yawH = (SP.headYaw - 0.5 * P.turnH) * P.sgnH * (1 - P.front * 0.92) - (spinH ?? P.spinH);
    const R = headRot(yawH - yawB, P.pitch, P.roll);
    const C3 = [SP.neck[0] + 4 + P.hx, 0, SP.neck[2] - SP.neckLen - HR * 0.82 + P.hy];
    return { R, C3, yawH, toBody: (u, r = 1) => A3(C3, mv(R, M3(u, HR * r))) };
  }
  // the region test / boundary of the hairline: hair where elevation < h(az)
  const HL = SP.hairline;
  const hairH = (az) => key(Math.abs(wrapA(az)), HL);
  const inHair = (u) => Math.asin(clamp(u[2], -1, 1)) < hairH(Math.atan2(u[1], u[0]));
  const HAIR_B = Array.from({ length: 72 }, (_, i) => { const az = -Math.PI + TAU * i / 72; return sph(az, hairH(az)); });
  // a cap region (kerchief / mob cap): el < capH(az)
  const CAPL = SP.capLine;
  const capH = (az) => key(Math.abs(wrapA(az)), CAPL || [[0, -2]]);
  const inCap = (u) => Math.asin(clamp(u[2], -1, 1)) < capH(Math.atan2(u[1], u[0]));
  const CAP_B = CAPL ? Array.from({ length: 72 }, (_, i) => { const az = -Math.PI + TAU * i / 72; return sph(az, capH(az)); }) : null;

  // the visible picture of a region on the head shell: its boundary where it faces us, the limb arc where it goes round
  // inside(u) -> true for the region whose visible polygon we want; B: boundary unit vectors (closed, ordered)
  function regionPoly(B, inside, Hd, r, pr) {
    const V = Hd.view, xs = Hd.xL, ys = Hd.yL;
    const pts = B.map((u) => ({ u, d: D3(u, V) }));
    const n = pts.length, vis = pts.map((p) => p.d > 0);
    const P2 = (u) => { const q = pr(Hd.toBody(u, r)); return [q[0], q[1]]; };
    const limbAt = (a) => N3(A3(M3(xs, Math.cos(a)), M3(ys, Math.sin(a))));
    const ang = (u) => Math.atan2(D3(u, ys), D3(u, xs));
    if (vis.every((x) => x)) return pts.map((p) => P2(p.u));
    if (!vis.some((x) => x)) {
      if (inside(V)) return Array.from({ length: 48 }, (_, i) => P2(limbAt(TAU * i / 48)));
      return null;
    }
    let i0 = 0; while (!(vis[i0] && !vis[(i0 + n - 1) % n])) i0++;
    const out = [];
    for (let k = 0; k < n; k++) {
      const i = (i0 + k) % n, j = (i + 1) % n;
      if (vis[i]) out.push(P2(pts[i].u));
      if (vis[i] && !vis[j]) { // exit: walk the limb to the next entry
        const ex = slerp(pts[i].u, pts[j].u, pts[i].d / (pts[i].d - pts[j].d));
        let m = j; while (!vis[m]) m = (m + 1) % n;
        const pm = pts[(m + n - 1) % n], en = slerp(pm.u, pts[m].u, pm.d / (pm.d - pts[m].d));
        let a0 = ang(ex), a1 = ang(en); let da = wrapA(a1 - a0);
        const mid = limbAt(a0 + da / 2);
        if (!inside(mid)) da = da > 0 ? da - TAU : da + TAU;
        const steps = Math.max(2, Math.ceil(Math.abs(da) / 0.12));
        for (let q = 0; q <= steps; q++) out.push(P2(limbAt(a0 + da * q / steps)));
      }
    }
    return out;
  }

  // ---- the rig: postures -> geometry (internal, facing right; root at (0, 0))
  function rig(raw, ph, pb, pa, psk, pls, ppa) {
    const R = { raw, pb };
    const yawB = (SP.yaw * pb.sgnB) * (1 - pb.front * 0.95) - raw.spin; // the spin itself is not delayed (head and body turn together; only the skirt swirls behind)
    const yawS = (SP.yaw * psk.sgnB) * (1 - psk.front * 0.95) - psk.spin; // the skirt's own (lagging) yaw
    R.yawB = yawB; R.yawS = yawS;
    const pr = proj(yawB), prC = proj(yawB, 0.1), prS = proj(yawS, 0.1);
    R.pr = pr; R.prC = prC;
    const hipY = SP.hipY, sitK = ease(pb.sit), knK = ease(pb.kneel);
    const pivot = [0, hipY];
    // sitting / kneeling lower the hips
    const drop = raw.bed > 0.5 ? -hipY - 14 : -sitK * (hipY + (raw.seatH ?? 62) + 8) + knK * SP.kneelDrop;
    R.drop = drop;
    const M = bodyM({ ...pb, by: pb.by + drop }, pivot);
    R.M = M; R.Mi = inv(M);
    // the skirt hangs from the waist: it takes only part of the lean, turning about the waist (no plank-like tilt)
    { const d = pb.lean * 0.65, w = proj(yawB)([0, 0, SP.waistY]), c = Math.cos(-d), sn = Math.sin(-d);
      const Rw = [c, sn, -sn, c, w[0] - c * w[0] + sn * w[1], w[1] - sn * w[0] - c * w[1]];
      R.Ms = [M[0] * Rw[0] + M[2] * Rw[1], M[1] * Rw[0] + M[3] * Rw[1], M[0] * Rw[2] + M[2] * Rw[3], M[1] * Rw[2] + M[3] * Rw[3], M[0] * Rw[4] + M[2] * Rw[5] + M[4], M[1] * Rw[4] + M[3] * Rw[5] + M[5]]; }
    // ---- head transform from the head posture (its own spring), placed on the body
    const Hx = headXf(ph, yawB, raw.spinH);
    const Rt = mT(Hx.R), c = Math.cos(yawB), sn = Math.sin(yawB);
    Hx.view = N3(mv(Rt, [c, -sn, 0])); Hx.xL = N3(mv(Rt, [sn, c, 0])); Hx.yL = N3(mv(Rt, [0, 0, 1]));
    R.H = Hx; R.ph = ph;
    // ---- legs (root space) from the raw state: planted feet never lag
    R.legs = legsSolve(raw, pb, M, yawB, sitK, knK);
    R.arms = [-1, 1].map((side) => armSolve(pa, raw, side, yawB, Hx, R));
    R.skirt = skirtSolve(psk, raw, yawS, prS, ease(psk.sit), ease(psk.kneel), R, -ease(psk.sit) * (hipY + (raw.seatH ?? 62) + 8) + ease(psk.kneel) * SP.kneelDrop);
    R.bodice = bodiceSolve(pb, prC);
    R.plaits = SP.plaits ? [-1, 1].map((side) => plaitSolve(pls, side, R)) : null;
    R.pail = pailSolve(ppa, raw, R);
    return R;
  }

  function legsSolve(raw, pb, M, yawB, sitK, knK) {
    const out = [], ph = raw.walkPhase || 0, sY = Math.sin(yawB), cY = Math.cos(yawB), skip = raw.skip || 0;
    const fw0 = [1, 0, 0];
    for (const side of [-1, 1]) {
      const near = side * Math.sin(yawB) < 0; // her right side is near when she faces right
      const off = side < 0 ? 0 : 0.5;
      let [dx, lift, pitch, ho] = walkFoot(ph + off, SP.STRIDE, SP.LIFT * (1 + skip * 0.8));
      const hp = skip * hopOf(ph + off) * (SP.hopH || 16);
      const hip3 = [0, side * SP.hipW, SP.hipY];
      const hipP = proj(yawB)(hip3), hipR = ap(M, hipP);
      const l = side * SP.footW;
      let lift2 = lift + hp, toe = pitch;
      // standing still the feet come together under her, each in a little step of its own (never sliding)
      const standK = 1 - clamp(raw.wa ?? 0), su = clamp((standK - (near ? 0 : 0.45)) / 0.55);
      if (su > 0) { dx *= 1 - easeInOut(su); if (su < 1) { lift2 += 9 * Math.sin(Math.PI * su) * Math.abs(dx) / (SP.STRIDE * 0.25 + 1e-6) * 0 + 7 * Math.sin(Math.PI * su) * clamp(Math.abs(dx0(ph + off)) / 10); toe += 0.25 * Math.sin(Math.PI * su); } ho *= 1 - easeInOut(su); }
      // turning round on the spot / twirling: each foot steps round in its own window (planted feet never slide)
      const tr = raw.turnRaw || 0;
      let footYaw = yawB;
      if (tr > 0 && tr < 1) {
        const w = near ? [0.12, 0.45] : [0.42, 0.78], u = clamp((tr - w[0]) / (w[1] - w[0]));
        footYaw = SP.yaw * (1 - 2 * easeInOut(u)); lift2 += 7 * Math.sin(Math.PI * u);
      }
      if (raw.spinF) { const [fyw, u] = raw.spinF[side < 0 ? 0 : 1]; footYaw = fyw; lift2 += 8 * Math.sin(Math.PI * u); }
      // standing / walking: the ankle in root space (the cheat walk runs along the screen); feet sit a little lower nearer us
      let X = l * Math.cos(footYaw) + dx; const gy = l * Math.sin(footYaw) * 0.1;
      // sitting: feet forward on the floor under the knees
      if (sitK > 0) { const fx = SP.sitFoot * sY + l * cY; X = lerp(X, fx, sitK); lift2 *= 1 - sitK; toe *= 1 - sitK; ho *= 1 - sitK; }
      const fy = proj(footYaw);
      const fwS = fy([1, 0, 0]); // the foot's forward direction on screen [x, y, d]
      const ankle = [X, gy - SP.ankleH - lift2 - ho * SP.toeL * 0.42];
      // 3D ankle (for the knee solve): f from the screen x
      const f3 = (X - l * cY) / Math.max(0.35, Math.abs(sY)) * Math.sign(sY || 1);
      out.push({ side, near, hipR, hip3, ankle, f3, lift: lift2, toe: toe - ho * 0.55, footYaw, fwS, planted: lift2 < 0.5, knK, sitK });
    }
    return out;
  }

  // ---- arms: targets in body-local 3D ([f, out, y]: out = away from the middle on the arm's own side)
  function armSolve(P, raw, side, yawB, Hx, R) {
    const W = P.W, A = P.A, t = P.tt || 0, sY = Math.sin(yawB);
    const nearK = ease(0.5 - 1.6 * side * sY);
    const sh = [SP.sh[0], side * SP.sh[1], SP.sh[2] - P.shUp];
    const T = (f, o, y) => [f, side * o, y];
    const items = []; let wsum = 0;
    const g = (w, near, far, pole, o = {}) => { if (w < 0.001) return; const k = nearK; items.push([w, { p: lerp3(far, near, k), pole: pole || [-1, side * 0.6, 0.2], fist: o.fist ?? 0, palm: o.palm ?? 0 }]); wsum += w; };
    const sw = P.swing || 0, k = SP.armK || 1;
    const restP = T(6 * k, SP.restOut, SP.sh[2] + SP.armA + SP.armB - 6);
    const rest = { p: [restP[0] + 26 * k * sw * (side < 0 ? 1 : -1), restP[1], restP[2] - 5 * Math.abs(sw)], pole: [-1, side * 0.5, 0.1], fist: 0.2 };
    // head-attached targets come from the drawn head (no lag between the hand and the pail / cheek)
    const Hp = (u, r = 1) => R.H.toBody(N3(u), r);
    const pailSide = (sgn, dy = 0.3) => { const top = Hp([0, 0, -1], SP.pailSeat); const pr2 = R.H.R; const sideV = mv(pr2, [0, sgn, 0]), up = mv(pr2, [0, 0, -1]); return A3(A3(top, M3(sideV, PAIL.R0 + 6)), M3(up, PAIL.H * dy)); };
    { const w = lerp(W.pailUp2, W.pailUp, nearK); if (w > 0.001) { items.push([w, { p: pailSide(side), pole: [-0.3, side * 1, 0.3], fist: 0.5, palm: 0.3 }]); wsum += w; } }
    if (W.tossW) g(W.tossW * 0.8, T(18, 58, SP.sh[2] + 40), T(8, 46, SP.sh[2] + 70), [-1, side * 0.8, 0.2], { palm: 1 });
    if (W.wave) { const o = Math.sin(t * TAU * 1.9), k2 = SP.armK || 1; g(W.wave, T((-8 + 16 * o) * k2, 62 * k2, SP.sh[2] - 56 * k2 - 4 * Math.abs(o)), rest.p, [-0.3, side * 1, 0.8], { palm: 1 }); }
    if (W.stroke) { const o = Math.sin(t * TAU * 0.6); g(W.stroke, T(raw.strokeF + 8 * o, 10, raw.strokeY + 3 * Math.abs(o)), rest.p, [-0.6, side * 0.8, 0.5], { palm: 1 }); }
    if (W.hug) g(W.hug, T(SP.hug[0], SP.hug[1], SP.hug[2]), T(SP.hug[0] - 4, SP.hug[1] - 6, SP.hug[2] + 4), [-0.2, side * 1, 0.4], { palm: 1 });
    if (W.comfort) g(W.comfort, T(SP.hug[0] + 6, SP.hug[1] - 4, SP.hug[2] + 10), T(SP.hug[0], SP.hug[1] - 10, SP.hug[2] + 16), [-0.3, side * 1, 0.4], { palm: 1 });
    if (W.daydream || W.clasp) { const w = Math.max(W.daydream, W.clasp), y = W.daydream > W.clasp ? SP.sh[2] - 6 : SP.sh[2] + 44; g(w, T(SP.clasp[0], 3, y), T(SP.clasp[0] - 2, 3, y + 2), [-0.5, side * 1, 0.6], { fist: 0.7 }); }
    if (W.gasp) { const ck = (sg) => Hp(sph(sg * 0.85, 0.42), 1.12); g(W.gasp, side < 0 ? ck(-1) : ck(1), side < 0 ? ck(-1) : ck(1), [-0.4, side * 0.8, 0.6], { palm: 1 }); }
    if (W.twirlW) g(W.twirlW, T(8, SP.skirtOut, SP.waistY + 28), T(8, SP.skirtOut, SP.waistY + 28), [-0.6, side * 1, 0.1], { fist: 0.6 });
    if (W.milk) { const mp = (A.milkPh || 0) * TAU + (side < 0 ? 0 : Math.PI), o = Math.sin(mp), m = raw.milkAt || SP.milkAt; g(W.milk, T(m[0] + 3 * o, m[1], m[2] + 9 * o), T(m[0] - 2 - 3 * o, m[1] - 4, m[2] - 9 * o), [-0.4, side * 1, 0.5], { fist: 0.5 + 0.5 * Math.max(0, o) }); }
    if (W.hold) g(W.hold, T(8, SP.restOut + 4, SP.sh[2] + SP.armA + SP.armB - 4), rest.p, [-1, side * 0.4, 0.1], { fist: 1 });
    if (W.give) { const gv = raw.giveY ?? SP.giveAt[2]; g(W.give, T(SP.giveAt[0], 8, gv), T(SP.giveAt[0] - 2, 8, gv + 2), [-0.4, side * 1, 0.6], { fist: 1 }); }
    if (W.brush) { const o = Math.sin(t * TAU * 0.9); const tgt = raw.brushAt ? raw.brushAt : T(SP.giveAt[0] + 10, 10, SP.sh[2] - 30); g(W.brush, [tgt[0], tgt[1] + 0 * o, tgt[2] + 4 * o], rest.p, [-0.6, side * 1, 0.6], { palm: 1 }); }
    if (W.tuck) { const o = Math.sin(t * TAU * 0.7 + side); const tw = raw.tuckAt || [SP.giveAt[0] + 20, 0, -40];
      // tuckAt stays put in the room: undo the body's lean (the quilt does not tilt when she bends)
      const L = P.lean, c = Math.cos(L), sn = Math.sin(L), rx = tw[0], ry = tw[2] - SP.hipY, tgt = [rx * c + ry * sn, tw[1], SP.hipY - rx * sn + ry * c]; g(W.tuck, [tgt[0] + 10 * o, side * 16, tgt[2]], [tgt[0] - 10 * o - 20, side * 20, tgt[2] + 2], [-0.4, side * 1, 0.6], { palm: 1 }); }
    if (W.lap) g(W.lap, T(40, 18, SP.hipY + 6), T(38, 18, SP.hipY + 8), [-0.5, side * 1, 0.3], { palm: 0.5 });
    if (W.hips) g(W.hips, T(-4, SP.skirtOut - 6, SP.waistY + 4), T(-4, SP.skirtOut - 6, SP.waistY + 4), [-0.6, side * 1, -0.2], { fist: 0.8 });
    if (W.reach) g(W.reach, T(70, 16, SP.sh[2] - 4), rest.p, [-0.5, side * 0.8, 0.4], { palm: 1 });
    if (W.skipW) { const q = sw * (side < 0 ? 1 : -1); g(W.skipW, T(10 + 44 * q, SP.restOut + 8, SP.sh[2] + 86 - 34 * Math.max(0, q)), T(10 + 44 * q, SP.restOut + 8, SP.sh[2] + 86 - 34 * Math.max(0, q)), [-1, side * 0.5, 0.2], { palm: 0.5 }); }
    if (W.bedArms) { const k2 = ease(P.lie || 0); g(W.bedArms, T(lerp(46, 26, k2), lerp(14, 10, k2), lerp(SP.hipY - 6, SP.sh[2] + 30, k2)), T(lerp(44, 24, k2), lerp(16, 6, k2), lerp(SP.hipY - 4, SP.sh[2] + 34, k2)), [-0.6, side * 1, 0.2], { palm: 0.5 }); }
    const rw = Math.max(0, 1 - wsum); let tot = rw, p = M3(rest.p, rw), pole = M3(rest.pole, rw), fist = rest.fist * rw, palm = 0;
    for (const [w, it] of items) { p = A3(p, M3(it.p, w)); pole = A3(pole, M3(it.pole, w)); fist += w * it.fist; palm += w * it.palm; tot += w; }
    p = M3(p, 1 / tot); pole = M3(pole, 1 / tot); fist /= tot; palm /= tot;
    const sol = ik3(sh, p, SP.armA, SP.armB, pole, 1.15);
    const pr = proj(yawB);
    const S2 = pr(sh), E2 = pr(sol.E), T2 = pr(sol.T);
    return { side, nearK, S: S2, E: E2, T: T2, d: (pr(p)[2] * 0.7 + S2[2] * 0.3), fist, palm, T3: sol.T };
  }

  // ---- clothing rings (body-local 3D) -> projected outlines
  function bodiceSolve(P, prC) {
    const rings = SP.torso.map(([y, a, b]) => THS.map((th) => prC(ringPt(y, a, b, th))));
    const all = [].concat(...rings);
    const outline = hull(all);
    // the front visible half of a ring between two azimuths
    const arc = (y, a, b, t0, t1, n = 14, dy = 0, rm = 1) => { const o = []; for (let i = 0; i <= n; i++) { const th = lerp(t0, t1, i / n); o.push(prC(ringPt(y + dy * Math.cos(th), a, b, th, rm))); } return o; };
    return { outline, rings, arc };
  }
  // visible-clamped surface polygon on a ring stack: rows [y, a, b], azimuth range
  function surfPoly(rows, t0, t1, prX, Y, n = 12) {
    const vis = (a, b) => Math.atan2(b * Math.cos(Y), a * Math.sin(Y)); // the far-limb azimuth (visible: (vis - pi, vis))
    const thm = (t0 + t1) / 2;
    const pt = (r, th) => { // clamp to the limb, measured continuously from the patch's middle (a patch wholly round
      // the back collapses onto ONE limb instead of spreading across the front)
      const [y, a, b, rm = 1, dy = 0] = r; const lim = vis(a, b), cc = lim - Math.PI / 2;
      let d = wrapA(thm - cc) + (th - thm); d = clamp(d, -Math.PI / 2, Math.PI / 2); const th2 = cc + d;
      return prX(ringPt(y + dy, a, b, th2, rm));
    };
    const top = [], bot = [], L = [], Rr = [];
    for (let i = 0; i <= n; i++) top.push(pt(rows[0], lerp(t0, t1, i / n)));
    for (let i = 1; i < rows.length; i++) Rr.push(pt(rows[i], t1));
    for (let i = n; i >= 0; i--) bot.push(pt(rows[rows.length - 1], lerp(t0, t1, i / n)));
    for (let i = rows.length - 2; i >= 1; i--) L.push(pt(rows[i], t0));
    return top.concat(Rr, bot, L);
  }
  function skirtSolve(P, raw, Y, prS, sitK, knK, R, drop) {
    const flare = clamp(P.skFlare || 0, 0, 0.6), sw = P.skSwish || 0;
    const [wy, wa, wb] = SP.skirtTop, [hy0, ha, hb] = SP.skirtHem;
    // kneeling: the hem rests on the floor; sitting: the lap goes forward over the knees
    const hy = Math.min(lerp(hy0, SP.hipY + 24, sitK), -drop - 1);
    const NRW = 7, rows = [];
    for (let i = 0; i < NRW; i++) {
      const u = i / (NRW - 1), k = 1 - (1 - u) ** 1.7;
      const y = lerp(wy, hy, u);
      const a = lerp(wa, ha * (1 + flare * 0.9 + knK * 0.25 + sitK * 0.05), k), b = lerp(wb, hb * (1 + flare * 0.9 + knK * 0.3) + sitK * SP.lapF * 0.5 * u, k);
      rows.push([y, a, b, u]);
    }
    // the hem (last row) waves softly: folds; the folds swing with the walk and twirl
    const fold = (th, u) => 1 + u * (0.045 + flare * 0.06) * Math.sin(th * SP.folds + sw * 0.5 + (P.spin || 0) * 1.5);
    const fwdShift = (u) => sitK * SP.lapF * 0.55 * u; // the lap
    const M = R.Ms, floorY = -1;
    const pt = (r, th) => { const [y, a, b, u] = r; const q = ringPt(y + u * 3 * Math.sin(th * SP.folds + 1 + sw * 0.4) - u * u * 2 * flare * 10, a, b, th, fold(th, u)); q[0] += fwdShift(u) + u * u * sw * 2.5; const p = prS(q);
      if (knK > 0 || sitK > 0) { const yr = M[1] * p[0] + M[3] * p[1] + M[5]; if (yr > floorY) p[1] -= (yr - floorY) / M[3]; } // the hem rests on the floor
      return p; };
    const P2 = rows.map((r) => THS.map((th) => pt(r, th)));
    // outline: left limb down, the visible hem round the front, right limb up
    const left = [], right = [];
    for (const ring of P2) { let mi = 0, ma = 0; ring.forEach((q, i) => { if (q[0] < ring[mi][0]) mi = i; if (q[0] > ring[ma][0]) ma = i; }); left.push([ring[mi], mi]); right.push([ring[ma], ma]); }
    const hemRing = P2[P2.length - 1], [, i0] = left[left.length - 1], [, i1] = right[right.length - 1];
    let dmax = 0; hemRing.forEach((q, i) => { if (q[2] > hemRing[dmax][2]) dmax = i; });
    const walk = (a, b, dir) => { const o = []; let i = a; for (let n = 0; n <= NR; n++) { o.push(hemRing[i]); if (i === b) break; i = (i + dir + NR) % NR; } return o; };
    let hemArc = walk(i0, i1, 1); if (!hemArc.some((q) => q === hemRing[dmax])) hemArc = walk(i0, i1, -1);
    const outline = left.map((x) => x[0]).concat(hemArc.slice(1, -1), right.slice().reverse().map((x) => x[0]));
    const surf = (t0, t1, u0, u1, n = 12) => { // a patch of the skirt surface (apron), clamped to what faces us
      const rr = []; for (let i = 0; i <= 5; i++) { const u = lerp(u0, u1, i / 5), j = u * (NRW - 1), j0 = Math.min(NRW - 2, Math.floor(j)), kk = j - j0;
        const r0 = rows[j0], r1 = rows[j0 + 1]; rr.push([lerp(r0[0], r1[0], kk), lerp(r0[1], r1[1], kk), lerp(r0[2], r1[2], kk), u]); }
      const vis = (a, b) => Math.atan2(b * Math.cos(Y), a * Math.sin(Y));
      const thm = (t0 + t1) / 2;
      const cl = (r, th) => { const lim = vis(r[1], r[2]), cc = lim - Math.PI / 2; let d = wrapA(thm - cc) + (th - thm); d = clamp(d, -Math.PI / 2 + 0.02, Math.PI / 2 - 0.02); return pt(r, cc + d); };
      const o = []; for (let i = 0; i <= n; i++) o.push(cl(rr[0], lerp(t0, t1, i / n)));
      for (let i = 1; i <= 5; i++) o.push(cl(rr[i], t1));
      for (let i = n; i >= 0; i--) o.push(cl(rr[5], lerp(t0, t1, i / n)));
      for (let i = 4; i >= 1; i--) o.push(cl(rr[i], t0));
      return o;
    };
    // fold lines: meridians from the hips down, only where they face us
    const folds = [];
    for (let k = 0; k < SP.folds; k++) { const th = -Math.PI + TAU * (k + 0.5) / SP.folds - (sw * 0.5) / SP.folds; const line = rows.slice(2).map((r) => pt(r, th + 0.15)); if (line[line.length - 1][2] > 4) folds.push(line); }
    return { outline, hemArc, rows, pt, surf, folds, P2, Y, flare };
  }

  // ---- plaits: a chain from the root behind the ear, over the shoulder, down the front; follow-through by delays
  function plaitSolve(pls, side, R) {
    const Hx = R.H, pr = R.pr;
    const root3 = Hx.toBody(sph(side * SP.plaitAz, SP.plaitEl), 1.02);
    const sh3 = [SP.sh[0] + 6, side * (SP.sh[1] - 8), SP.sh[2] - 6], ch3 = [SP.sh[0] + 22, side * (SP.sh[1] - 12), SP.sh[2] + 30];
    const r = pr(root3), a = pr(sh3), b = pr(ch3);
    // rest path in picture space, resampled to N equal segments
    const N = 8, Lp = SP.plaitL, ds = Lp / N;
    const ctrl = smooth([[r[0], r[1]], [lerp(r[0], a[0], 0.6), lerp(r[1], a[1], 0.6) - 2], [a[0], a[1]], [b[0], b[1]], [b[0] + (b[0] - a[0]) * 0.6, b[1] + 60]], false, 8);
    const rest = [[ctrl[0][0], ctrl[0][1]]]; let acc = 0, prev = ctrl[0];
    for (let i = 1; i < ctrl.length && rest.length <= N; i++) { const q = ctrl[i]; const d = Math.hypot(q[0] - prev[0], q[1] - prev[1]); acc += d; while (acc >= ds && rest.length <= N) { acc -= ds; const k = 1 - acc / d; rest.push([lerp(prev[0], q[0], k), lerp(prev[1], q[1], k)]); } prev = q; }
    while (rest.length <= N) { const l = rest[rest.length - 1]; rest.push([l[0], l[1] + ds]); }
    // bend: each segment's angle from its rest angle, turned by the (delayed) swing, lift and fly
    const pts = [rest[0]]; let p = rest[0];
    for (let i = 0; i < N; i++) {
      const f = i / (N - 1), tau = f * (pls.length - 1), j = Math.min(pls.length - 2, Math.floor(tau)), kk = tau - j;
      const Q = (k) => { const P = pls[k].P; return { sw: P.plSwing, fly: P.plFly, lift: P.plLift }; };
      const q0 = Q(j), q1 = Q(j + 1), sw = lerp(q0.sw, q1.sw, kk), fly = lerp(q0.fly, q1.fly, kk), lift = lerp(q0.lift, q1.lift, kk);
      const a0 = Math.atan2(rest[i + 1][1] - rest[i][1], rest[i + 1][0] - rest[i][0]);
      const fe = ease((f - 0.15) / 0.5);
      const ang = a0 + sw * fe * 1.6 + fly * fe * (1.25 + 0.25 * side) - lift * fe * 0.4;
      pts.push(p = [p[0] + Math.cos(ang) * ds, p[1] + Math.sin(ang) * ds]);
    }
    return { pts, root: r, d: r[2], side, dChest: b[2] };
  }

  function pailSolve(ppa, raw, R) {
    const on2 = raw.A.pailOn;
    if (on2 === 'head') {
      const Hx = R.H, b3 = Hx.toBody([0, 0, -1], SP.pailSeat), u3 = Hx.toBody([0, 0, -1], SP.pailSeat + 1);
      const b = R.pr(b3), u = R.pr(u3);
      const ang = Math.atan2(u[0] - b[0], -(u[1] - b[1])) + (ppa.pailTilt || 0) + 0.06 * (ppa.pailSway || 0);
      return { at: 'head', x: b[0], y: b[1], ang, milk: raw.milkLevel };
    }
    if (on2 === 'hand' && raw.W.give > 0.5) { const [a, b] = R.arms; return { at: 'hand', x: (a.T[0] + b.T[0]) / 2, y: (a.T[1] + b.T[1]) / 2 - 4, ang: 0.08 * (ppa.swing || 0), milk: raw.milkLevel, hang: true }; }
    if (on2 === 'hand') {
      const arm = R.arms.reduce((a, b) => (a.nearK >= b.nearK ? a : b));
      const sw = 0.12 * (ppa.swing || 0) + (ppa.pailTilt || 0);
      return { at: 'hand', arm, x: arm.T[0], y: arm.T[1], ang: sw, milk: raw.milkLevel, hang: true };
    }
    if (on2 === 'ground') { const q = R.pr([SP.groundPail ?? 56, 0, 0]); return { at: 'ground', x: q[0], y: 0, ang: 0, milk: raw.milkLevel, root: true }; }
    return null;
  }

  function fill(raw, st) {
    raw.walkPhase = st.walk || 0; raw.seatH = st.seatH ?? DEF.seatH; raw.milkLevel = st.milkLevel ?? DEF.milkLevel;
    raw.strokeF = st.strokeF ?? SP.def?.strokeF ?? DEF.strokeF; raw.strokeY = st.strokeY ?? SP.def?.strokeY ?? DEF.strokeY;
    raw.brushAt = st.brushAt; raw.tuckAt = st.tuckAt; raw.giveY = st.giveY; raw.milkAt = st.milkAt || SP.milkAt;
    raw.spinF = null;
    if (raw.spin) { const tw = st.twirl, stepU = (a, b) => { const u = clamp((tw - a) / (b - a)); return [SP.yaw - TAU * easeInOut(u), u]; }; raw.spinF = [stepU(0.04, 0.62), stepU(0.34, 0.96)]; }
    return raw;
  }
  function rigFromState(st) { const p = fill(solve(st, SP, 0), st); p.tt = st.t || 0; return rig(p, p, p, p, p, PLAIT_DELAYS.map(() => ({ P: p })), p); }
  function rigAt(poseFn, t, o = {}) {
    const since = o.since ?? -1e9, cache = new Map();
    const cur = poseFn(t); cache.set(Math.round(t * 960) / 960, cur);
    const raw = fill(solve(cur, SP, 0), cur); raw.tt = t;
    const one = (k, dt = 0) => { const p = solve({ ...cur, ...filtered(poseFn, t - dt, K[k], since, cache), t: t - dt }, SP, LAG[k]); p.tt = t - dt - LAG[k]; return p; };
    const ph = one('head'), pb = one('body'), pa = one('arm'), psk = one('skirt'), ppa = one('pail');
    const pls = PLAIT_DELAYS.map((d) => ({ P: one('plait', d) }));
    return { R: rig(raw, ph, pb, pa, psk, pls, ppa), st: cur };
  }

  // ================================================================ painting (internal: facing right)
  function drawLeg(g, L, far) {
    if (L.sitK > 0.98 && SP.longSkirt) return;
    // the knee bends toward where the foot points (forward on the page; toward us in the front view, so barely bent)
    const hip = L.hipR, an = L.ankle, kf = Math.sin(L.footYaw);
    const d = Math.hypot(an[0] - hip[0], an[1] - hip[1]), a = SP.thigh, b = SP.shin;
    let knee;
    if (d < a + b) { const ux = (an[0] - hip[0]) / d, uy = (an[1] - hip[1]) / d, x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x)) * clamp(Math.abs(kf) * 1.6, 0.25, 1); const px = -uy, py = ux; const sgn = px * (kf >= 0 ? 1 : -1) >= 0 ? 1 : -1; knee = [hip[0] + ux * x + px * h * sgn, hip[1] + uy * x + py * h * sgn]; }
    else knee = [lerp(hip[0], an[0], a / (a + b)), lerp(hip[1], an[1], a / (a + b))];
    const col = far ? shade(C.sock, 0.12) : C.sock, lw = SP.legW;
    const calf = [lerp(knee[0], an[0], 0.35), lerp(knee[1], an[1], 0.35)], th = [lerp(hip[0], knee[0], 0.5), lerp(hip[1], knee[1], 0.5)];
    paintLimb(g, limbShape([hip, th, knee, calf, an], [lw * 1.35, lw * 1.2, lw * 0.98, lw * 1.08, lw * 0.74]), col, { w: lw, seed: 5 + (far ? 1 : 0), pw: 1.6,
      after: () => { g.strokeStyle = rgba(shade(col, 0.3), 0.25); g.lineWidth = 0.8; for (let k = 1; k < 5; k++) { const q = [lerp(knee[0], an[0], k / 5), lerp(knee[1], an[1], k / 5)]; g.beginPath(); g.arc(q[0], q[1] - 2, lw * 0.5, 0.3, Math.PI - 0.3); g.stroke(); } } });
    drawBoot(g, L, far);
  }
  function tubeLeg(g, pts, w, col) {
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    const pl = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); };
    pl(); g.strokeStyle = rgba(INK, 0.75); g.lineWidth = w + 3; g.stroke();
    pl(); g.strokeStyle = col; g.lineWidth = w; g.stroke();
    g.globalAlpha = 0.25; g.translate(w * 0.22, 0); pl(); g.strokeStyle = shade(col, 0.4); g.lineWidth = w * 0.35; g.stroke();
    g.restore();
  }
  function drawBoot(g, L, far) {
    const an = L.ankle, Y = L.footYaw, sY = Math.sin(Y), cY = Math.cos(Y);
    // foot frame in 3D: forward (yawed), toe pitch about the lateral axis
    const ca = Math.cos(L.toe), sa = Math.sin(L.toe);
    const fw = [ca, 0, -sa], up = [sa, 0, ca].map((x) => -x), lat = [0, 1, 0];
    const pj = (p) => [p[0] * sY + p[1] * cY, p[2]];
    const P = (a, l, u) => { const q = A3(A3(M3(fw, a), M3(lat, l)), M3(up, u)); const s2 = pj(q); return [an[0] + s2[0], an[1] + s2[1]]; };
    const BL = SP.toeL, BW = SP.bootW, AH = SP.ankleH;
    const sole = [], top = [], shaft = [];
    for (let i = 0; i < 16; i++) { const a = TAU * i / 16; const fx = Math.cos(a) > 0 ? Math.cos(a) * BL : Math.cos(a) * 9; sole.push(P(fx, Math.sin(a) * BW * (Math.cos(a) > 0.6 ? 0.85 : 1), -AH)); top.push(P(fx * 0.8 + 2, Math.sin(a) * BW * 0.8, -AH + 9)); }
    for (let i = 0; i < 12; i++) { const a = TAU * i / 12; shaft.push(P(Math.cos(a) * 7.5 - 1, Math.sin(a) * 7.5, 4), P(Math.cos(a) * 8.5 - 1, Math.sin(a) * 8.5, -AH + 4)); }
    const footH = hull(sole.concat(top)), shaftH = hull(shaft);
    const col = far ? shade(C.boot, 0.15) : C.boot;
    unionInk(g, [footH, shaftH], col, { w: 1.6 });
    // sole edge, highlight, laces on the instep where it faces us
    g.save(); path(g, footH); g.clip();
    g.fillStyle = rgba(shade(C.boot, 0.5), 0.8); g.beginPath(); for (const q of hull(sole.map((q) => [q[0], q[1] + 0]).concat(sole.map((q) => [q[0], q[1] - 3])))) g.lineTo(q[0], q[1]); g.closePath();
    const lo = sole.map((q) => [q[0], q[1] - 2.6]); g.beginPath(); g.rect(-9999, an[1] + AH - 3.2 + 0, 1, 1); g.restore();
    g.save(); path(g, footH); g.clip(); const by = Math.max(...sole.map((q) => q[1])); g.fillStyle = rgba(shade(C.boot, 0.55), 0.85); g.fillRect(an[0] - 60, by - 3.5, 120, 6);
    g.fillStyle = 'rgba(255,240,220,0.28)'; const tq = P(BL * 0.55, -BW * 0.2, -AH + 8); g.beginPath(); g.ellipse(tq[0], tq[1], 5, 2.2, 0, 0, 7); g.fill(); g.restore();
    if (cY > -0.2) { g.save(); g.strokeStyle = rgba('#e8d8b8', 0.8); g.lineWidth = 1; for (let k = 0; k < 3; k++) { const p = P(5 + k * 3, -3, -AH + 11 + k * 3), q = P(5 + k * 3, 3, -AH + 11 + k * 3); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); } g.restore(); }
  }
  function drawArm(g, a, far, R) {
    const skin = far ? shade(C.skin, 0.1) : C.skin, slv = far ? shade(C.dress, 0.15) : C.dress;
    const S = a.S, E = a.E, T = a.T, w = SP.armW;
    // the arm: one soft shape from the shoulder through a rounded elbow to the wrist, a gentle curve in the upper arm
    const ux = E[0] - S[0], uy = E[1] - S[1], ul = Math.hypot(ux, uy) || 1, bow = 0.06 * ul;
    const m1 = [lerp(S[0], E[0], 0.5) - uy / ul * bow, lerp(S[1], E[1], 0.5) + ux / ul * bow], m2 = [lerp(E[0], T[0], 0.45), lerp(E[1], T[1], 0.45)];
    paintLimb(g, limbShape([S, m1, E, m2, T], [w * 1.15, w * 1.02, w * 0.84, w * 0.9, w * 0.66]), skin, { w, seed: 9 + (far ? 1 : 0) });
    // the sleeve: a gathered puff growing out of the shoulder seam, narrowing to the rolled cuff above the elbow
    const cuff = [lerp(S[0], E[0], SP.sleeve), lerp(S[1], E[1], SP.sleeve)], inS = [S[0] - ux / ul * w * 0.55, S[1] - uy / ul * w * 0.55];
    const sm = [lerp(S[0], cuff[0], 0.45), lerp(S[1], cuff[1], 0.45)];
    const ls = limbShape([inS, S, sm, cuff], [w * 1.7, w * 2.15, w * 2.0, w * 1.62], 5);
    paintLimb(g, ls, slv, { w: w * 2, spr: fills.dress, at: [0, 0], sprA: 0.85, seed: 13, after: () => {
      // gathers at the shoulder seam and soft folds down the puff
      g.strokeStyle = rgba(shade(slv, 0.5), 0.45); g.lineWidth = 0.9; g.lineCap = 'round';
      const nx = -uy / ul, ny = ux / ul;
      for (let k = -2; k <= 2; k++) { const o = k * w * 0.36, p0 = [S[0] + nx * o, S[1] + ny * o], p1 = [lerp(S[0], cuff[0], 0.55) + nx * o * 1.05, lerp(S[1], cuff[1], 0.55) + ny * o * 1.05]; g.beginPath(); g.moveTo(p0[0], p0[1]); g.quadraticCurveTo((p0[0] + p1[0]) / 2 + nx * 2, (p0[1] + p1[1]) / 2 + ny * 2, p1[0], p1[1]); g.stroke(); }
      // the rolled cuff band
      g.strokeStyle = rgba(tint(slv, 0.45), 0.9); g.lineWidth = w * 0.55; const c2 = [cuff[0] - ux / ul * w * 0.3, cuff[1] - uy / ul * w * 0.3];
      g.beginPath(); g.moveTo(c2[0] - nx * w * 1.2, c2[1] - ny * w * 1.2); g.quadraticCurveTo(c2[0] + ux / ul * 2, c2[1] + uy / ul * 2, c2[0] + nx * w * 1.2, c2[1] + ny * w * 1.2); g.stroke();
      g.strokeStyle = rgba(INK, 0.45); g.lineWidth = 1; g.beginPath(); const c3 = [cuff[0] - ux / ul * w * 0.62, cuff[1] - uy / ul * w * 0.62]; g.moveTo(c3[0] - nx * w * 1.2, c3[1] - ny * w * 1.2); g.quadraticCurveTo(c3[0] + ux / ul * 2, c3[1] + uy / ul * 2, c3[0] + nx * w * 1.2, c3[1] + ny * w * 1.2); g.stroke();
    } });
    drawHand(g, a, skin, R);
  }
  function drawHand(g, a, skin, R) {
    const E = a.E, T = a.T, ang = Math.atan2(T[1] - E[1], T[0] - E[0]);
    const hs = SP.hand, f = a.fist, op = a.palm;
    g.save(); g.translate(T[0] - Math.cos(ang) * hs * 0.15, T[1] - Math.sin(ang) * hs * 0.15); g.rotate(ang);
    const th = (a.side < 0 ? 1 : -1) * (Math.cos(R.yawB) >= 0 ? 1 : -1) * (Math.sin(ang) > 0 ? -1 : 1) * -1;
    const L = hs * (1.12 - 0.3 * f + 0.12 * op), Wd = hs * (0.74 + 0.1 * op);
    // one little rounded hand: palm, fingers together, a thumb lobe
    const P = [[0, -0.36], [0.4, -0.5], [0.82, -0.44], [1.04, -0.12], [1.0, 0.22], [0.78, 0.4], [0.68 - 0.1 * f, 0.66], [0.5 - 0.1 * f, 0.82], [0.32, 0.62], [0.12, 0.42]].map(([x, y]) => [x * L, y * Wd * th]);
    const hand = smooth(P, true, 4);
    g.save(); path(g, hand); g.fillStyle = skin; g.fill(); g.clip(); pool(g, L * 0.5, th * Wd * 0.3, L * 0.5, Wd * 0.5, shade(skin, 0.3), 0.25); pool(g, L * 0.55, -th * Wd * 0.15, L * 0.3, Wd * 0.25, C.cheek, 0.3); g.restore();
    penLine(g, hand, { closed: true, w: 1.3, alpha: 0.8, wobble: 0.2, weight: (t) => 0.4 + 0.7 * Math.max(0, Math.sin(t * TAU + 1)) });
    g.strokeStyle = rgba(INK, 0.35); g.lineWidth = 0.8; g.lineCap = 'round';
    if (f < 0.6) for (const y of [-0.22, 0.05]) { g.beginPath(); g.moveTo(L * 0.7, y * Wd * th); g.lineTo(L * 0.98, y * Wd * th * 1.1); g.stroke(); }
    else { g.beginPath(); g.arc(L * 0.6, 0, Wd * 0.3, -1.2, 1.2); g.stroke(); }
    g.restore();
  }

  function drawSkirt(g, R, st) {
    const S = R.skirt, night = st.nightgown;
    clipFill(g, S.outline, night ? fills.night : fills.dress, { shade: shade(night ? '#d8ccb8' : C.dress, 0.5), sl: 0.2, sr: 0.34, top: 0.12, after: () => {
      // folds
      const fc = shade(night ? '#c8bca8' : C.dress, 0.45);
      for (const f of S.folds) { const a = clamp(f[f.length - 1][2] / 30, 0, 1); thin(g, f.map((q) => [q[0], q[1]]), 1.3, fc, 0.4 * a);
        g.save(); g.strokeStyle = rgba(fc, 0.3 * a); g.lineWidth = 0.8; for (let i = 1; i < f.length; i++) { const q = f[i], p = f[i - 1]; for (let k = 0; k < 3; k++) { const x = lerp(p[0], q[0], k / 3) + 2.5, y = lerp(p[1], q[1], k / 3); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y + 3); g.stroke(); } } g.restore(); }
      // the apron
      if (SP.apron && !night) {
        const ap = S.surf(-SP.apron[0], SP.apron[0], 0.02, SP.apron[1], 12);
        clipFill(g, ap, fills.apron, { shade: '#8a7a60', sl: 0.12, sr: 0.22, after: () => {
          for (let k = -3; k <= 3; k++) { const th = (k + 0.5) * SP.apron[0] / 3.6, line = [0.15, 0.4, 0.65, 0.88].map((u) => { const j = u * (S.rows.length - 1), j0 = Math.min(S.rows.length - 2, Math.floor(j)), r0 = S.rows[j0], r1 = S.rows[j0 + 1], kk = j - j0; return S.pt([lerp(r0[0], r1[0], kk), lerp(r0[1], r1[1], kk), lerp(r0[2], r1[2], kk), u], th); });
            if (line[2][2] < 4) continue; thin(g, line.map((q) => [q[0] + 1, q[1]]), 1.1, '#a8987c', 0.35);
            g.save(); g.strokeStyle = 'rgba(150,135,110,0.25)'; g.lineWidth = 0.7; for (let i = 1; i < line.length; i++) { const q = line[i]; for (let m = 0; m < 2; m++) { g.beginPath(); g.moveTo(q[0] + 2, q[1] - m * 6); g.lineTo(q[0] + 5, q[1] - m * 6 + 2.5); g.stroke(); } } g.restore(); }
        } });
        ink(g, ap.map((q) => [q[0], q[1]]), 1.4, 0.65, { closed: true, seed: 3 });
        // apron gathers at the waist
        for (let k = -2; k <= 2; k++) { const th = k * SP.apron[0] / 3; const a2 = S.pt(S.rows[0], th), b2 = S.pt(S.rows[2], th * 1.05); if (a2[2] > 3) thin(g, [[a2[0], a2[1]], [lerp(a2[0], b2[0], 0.45), lerp(a2[1], b2[1], 0.45)]], 1, '#8a7a60', 0.4); }
      }
      // petticoat lace just under the hem
    } });
    // lace edge of the petticoat peeping under the hem
    const hem = S.hemArc;
    if (SP.lace && !night) { g.save(); g.fillStyle = '#f6efe2'; g.strokeStyle = rgba(INK, 0.45); g.lineWidth = 0.8; for (let i = 1; i < hem.length - 1; i += 2) { const q = hem[i]; if (q[2] < 2) continue; g.beginPath(); g.arc(q[0], q[1] + 1.5, 3.2, 0, Math.PI); g.fill(); g.stroke(); } g.restore(); }
    ink(g, S.outline.map((q) => [q[0], q[1]]), 1.9, 0.82, { closed: true, seed: 5 });
  }
  function drawBodice(g, R, st) {
    const B = R.bodice, night = st.nightgown, Y = R.yawB, prC = R.prC;
    clipFill(g, B.outline, night ? fills.night : fills.dress, { shade: shade(night ? '#d8ccb8' : C.dress, 0.5), sl: 0.18, sr: 0.32, after: () => {
      const [, a0, b0] = SP.torso[2];
      if (SP.bib && !night) {
        const rows = [[SP.bib[1], SP.torso[1][1] * 0.98, SP.torso[1][2] * 1.02], [lerp(SP.bib[1], SP.waistY, 0.5), a0, b0 * 1.03], [SP.waistY + 4, SP.torso[SP.torso.length - 1][1], SP.torso[SP.torso.length - 1][2] * 1.03]];
        const bib = surfPoly(rows, -SP.bib[0], SP.bib[0], prC, Y, 10);
        clipFill(g, bib, fills.apron, { shade: '#8a7a60', sl: 0.1, sr: 0.2 });
        ink(g, bib.map((q) => [q[0], q[1]]), 1.3, 0.6, { closed: true, seed: 9 });
        // straps over the shoulders
        for (const sg of [-1, 1]) { const th = sg * SP.bib[0] * 0.8; const p0 = prC(ringPt(SP.bib[1], SP.torso[1][1], SP.torso[1][2], th)), p1 = prC(ringPt(SP.torso[0][0], SP.torso[0][1] * 1.3, SP.torso[0][2] * 1.2, sg * 1.25)); if (p0[2] > -2) thin(g, [[p0[0], p0[1]], [p1[0], p1[1]]], 4.2, '#f4ecdc', 0.95), thin(g, [[p0[0] + 2, p0[1]], [p1[0] + 2, p1[1]]], 0.8, INK, 0.35); }
      }
      // buttons down the front (the night gown has none) / a print of little sprigs is in the fabric
      if (SP.buttons && !night) for (const y of SP.buttons) { const q = prC(ringPt(y, SP.torso[2][1], SP.torso[2][2] * 1.04, 0)); if (q[2] > 6) { g.fillStyle = '#f2e6cc'; g.beginPath(); g.arc(q[0], q[1], 2.1, 0, 7); g.fill(); g.strokeStyle = rgba(INK, 0.5); g.lineWidth = 0.7; g.stroke(); } }
      // the waistband / apron strings
      const wb = B.arc(SP.waistY, SP.torso[SP.torso.length - 1][1] * 1.03, SP.torso[SP.torso.length - 1][2] * 1.04, -Math.PI, Math.PI, 40);
      const vis = wb.filter((q) => q[2] > -1);
      if (!night) thin(g, vis.map((q) => [q[0], q[1]]), SP.apron ? 4.5 : 3.5, SP.apron ? '#f4ecdc' : shade(C.dress, 0.3), 0.95);
    } });
    ink(g, B.outline.map((q) => [q[0], q[1]]), 1.8, 0.8, { closed: true, seed: 11 });
    // collar: a soft round collar round the neckline (the part that faces us)
    const [ny, na, nb] = SP.torso[0];
    const col = [];
    for (let i = 0; i <= 24; i++) { const th = -Math.PI + TAU * i / 24; col.push(prC(ringPt(ny + 1, na * 1.05, nb * 1.1, th))); }
    const outer = [];
    for (let i = 0; i <= 24; i++) { const th = -Math.PI + TAU * i / 24; const fr2 = Math.cos(th) > 0 ? 1 : 0.2; outer.push(prC(ringPt(ny + 7 + 6 * Math.max(0, Math.cos(th)), na * 1.32, nb * 1.45, th))); }
    const collar = hull(outer.concat(col));
    if (!night || true) { g.save(); path(g, collar); g.fillStyle = night ? '#fbf6ec' : (C.collar || '#f6efe2'); g.fill(); g.restore(); ink(g, collar, 1.3, 0.7, { closed: true, seed: 13 }); }
    return collar;
  }
  function drawNeck(g, R) {
    const Hx = R.H, top = R.pr(Hx.toBody([0.1, 0, 0.6], 0.9)), base = R.pr([SP.neck[0] + 2, 0, SP.neck[2] + 6]);
    tube(g, [[base[0], base[1]], [top[0], top[1]]], SP.neckW, C.skin);
  }
  function tube(g, pts, w, col) { g.save(); g.lineCap = 'round'; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); g.lineTo(pts[1][0], pts[1][1]); g.strokeStyle = rgba(INK, 0.7); g.lineWidth = w + 2.6; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); g.restore(); }

  function drawPlait(g, pl) {
    const pts = pl.pts, n = pts.length;
    taper(g, pts, SP.plaitW, SP.plaitW * 0.62, C.hair, { shade: shade(C.hair, 0.4), light: tint(C.hair, 0.4), inkW: 1.3, inkA: 0.75 });
    // the braid: alternating little crossings
    g.save(); g.strokeStyle = rgba(shade(C.hair, 0.55), 0.75); g.lineWidth = 1.1; g.lineCap = 'round';
    for (let i = 1; i < n - 1; i++) for (const k of [0.25, 0.75]) {
      const a = pts[i], b = pts[i + 1], x = lerp(a[0], b[0], k), y = lerp(a[1], b[1], k), an = Math.atan2(b[1] - a[1], b[0] - a[0]), w = lerp(SP.plaitW, SP.plaitW * 0.62, i / n) * 0.42, sg = (i * 2 + (k > 0.5 ? 1 : 0)) % 2 ? 1 : -1;
      g.beginPath(); g.moveTo(x - Math.sin(an) * w, y + Math.cos(an) * w); g.quadraticCurveTo(x + Math.cos(an) * 3 * sg, y + Math.sin(an) * 3 * sg, x + Math.sin(an) * w, y - Math.cos(an) * w); g.stroke();
    }
    g.restore();
    // the ribbon bow and the soft tuft below it
    const e = pts[n - 1], q = pts[n - 2], an = Math.atan2(e[1] - q[1], e[0] - q[0]);
    g.save(); g.translate(e[0], e[1]); g.rotate(an - Math.PI / 2);
    g.fillStyle = C.hair; g.strokeStyle = rgba(INK, 0.6); g.lineWidth = 1;
    g.beginPath(); g.moveTo(-4, 0); g.quadraticCurveTo(-6, 10, -2, 16); g.lineTo(0, 12); g.lineTo(2, 16); g.quadraticCurveTo(6, 10, 4, 0); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = C.ribbon; g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1.1;
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(sx * 12, -9, sx * 14, 5, 0, 1); g.fill(); g.stroke(); g.beginPath(); g.moveTo(0, 1); g.quadraticCurveTo(sx * 5, 8, sx * 7, 14); g.lineTo(sx * 3, 13); g.closePath(); g.fill(); g.stroke(); }
    g.beginPath(); g.ellipse(0, 0, 3, 2.6, 0, 0, 7); g.fill(); g.stroke();
    g.restore();
  }

  // ---- the head: skin ball, ears, hair (and kerchief / cap), the face
  function drawHead(g, R, st) {
    const Hx = R.H, P = R.ph, pr = R.pr;
    const at = (u, r = 1) => pr(Hx.toBody(N3(u), r));
    const Cs = pr(Hx.C3);
    const depth = (u) => D3(N3(u), Hx.view);
    // local "across the face" direction on screen at a point (for orienting eyes, brows, mouth)
    const across = (az, el) => { const a = at(sph(az - 0.06, el)), b = at(sph(az + 0.06, el)); return Math.atan2(b[1] - a[1], b[0] - a[0]); };
    const shellR = SP.hairR;
    // back hair / bun behind the head
    if (SP.bun) { const u = sph(Math.PI, SP.bun[0]), q = at(u, SP.bun[1]); if (depth(u) < 0) drawBun(g, q, true); }
    // ears: occluded by the skull as they go round the back (a growing hole, no pop)
    const earAt = (sg) => {
      const u = sph(sg * SP.earAz, SP.earEl), q = at(u, 1.0), dn = depth(u), occ = clamp(0.3 - dn * 1.6);
      if (dn < -0.6) return;
      const a = across(sg * SP.earAz - sg * 0.5, SP.earEl);
      g.save();
      if (occ > 0.001) { g.beginPath(); g.rect(Cs[0] - 400, Cs[1] - 400, 800, 800); g.ellipse(Cs[0], Cs[1], HR * occ, HR * occ, 0, 0, 7); g.clip('evenodd'); }
      const sideV = mv(Hx.R, [0, sg, 0]), facing = sideV[0] * Math.cos(R.yawB) - sideV[1] * Math.sin(R.yawB);
      const sx = Math.max(0.3, Math.abs(facing)) * (q[0] < Cs[0] ? -1 : 1);
      g.translate(q[0], q[1]); g.rotate(a - (q[0] < Cs[0] ? Math.PI : 0) * 0); g.scale(sx * SP.earS, SP.earS); drawSprite(g, earSpr); g.restore();
    };
    { // the skin: skull + jaw as one shape, one pen line round both
      const disc = Array.from({ length: 48 }, (_, i) => { const a = TAU * i / 48; return [Cs[0] + Math.cos(a) * HR, Cs[1] + Math.sin(a) * HR]; });
      const jaw = hull(JAW.map((u) => { const q = pr(A3(Hx.C3, mv(Hx.R, M3(u, HR)))); return [q[0], q[1]]; }));
      g.save(); g.lineJoin = 'round'; g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 3.6; for (const sh of [disc, jaw]) { path(g, sh); g.stroke(); }
      g.fillStyle = C.skin; for (const sh of [disc, jaw]) { path(g, sh); g.fill(); }
      g.beginPath(); path2(g, disc); path2(g, jaw); g.clip('nonzero');
      g.save(); g.translate(Cs[0], Cs[1]); drawSprite(g, headSpr); g.restore();
      const gr = g.createLinearGradient(0, Cs[1] + HR * 0.3, 0, Cs[1] + HR * 1.1); gr.addColorStop(0, rgba(shade(C.skin, 0.4), 0)); gr.addColorStop(1, rgba(shade(C.skin, 0.4), 0.3));
      g.fillStyle = gr; g.fillRect(Cs[0] - HR * 1.3, Cs[1], HR * 2.6, HR * 1.3);
      g.restore(); }
    earAt(-1); earAt(1);
    // ---- face features (under the hair)
    const P2 = (az, el, r = 1) => at(sph(az, el), r);
    const vis = (az, el) => depth(sph(az, el));
    // cheeks
    for (const sg of [-1, 1]) { const dn = vis(sg * 0.62, 0.3); if (dn > 0.05) { const q = P2(sg * 0.62, 0.3); pool(g, q[0], q[1], HR * 0.26 * (0.5 + 0.5 * dn), HR * 0.17, C.cheek, (0.5 + 0.3 * P.blush) * Math.min(1, dn * 2)); } }
    // freckles
    if (SP.freckles) { g.save(); g.fillStyle = rgba('#a86a48', 0.55); for (const [az, el] of SP.freckles) for (const sg of [-1, 1]) { const dn = vis(sg * az, el); if (dn > 0.15) { const q = P2(sg * az, el, 1.01); g.beginPath(); g.ellipse(q[0], q[1], 1.1 * dn + 0.3, 1.1, 0, 0, 7); g.fill(); } } g.restore(); }
    // eyes: small dark ovals with a highlight; the far one narrows as it goes round, hidden by the skull
    const big = clamp(P.big), eo = clamp(P.eye * (1 + 0.2 * big), 0, 1.1), happy = P.happy > 0.5, gz = P.gaze * 0.07, lk = P.look * 0.06;
    for (const sg of [1, -1]) {
      const az = sg * SP.eyeAz + lk, el = SP.eyeEl - gz, dn = vis(az, el);
      if (dn < 0.02) continue;
      const q = P2(az, el, 1.0), w = clamp(Math.pow(dn, 0.75), 0.25, 1), a = across(az, el);
      g.save(); g.translate(q[0], q[1]); g.rotate(a); g.scale(w, 1);
      const rx = SP.eyeR[0] * (1 + 0.25 * big), ry = SP.eyeR[1] * (1 + 0.2 * big);
      if (happy || eo < 0.12) {
        g.strokeStyle = rgba(INK, 0.88); g.lineWidth = 2.1; g.lineCap = 'round'; g.beginPath();
        if (happy) g.arc(0, ry * 0.5, rx * 1.3, Math.PI * 1.15, Math.PI * 1.85); else g.arc(0, -ry * 0.45, rx * 1.3, Math.PI * 0.15, Math.PI * 0.85);
        g.stroke();
        if (!happy && SP.lashes) { g.lineWidth = 1.2; g.beginPath(); g.moveTo(rx * 1.1, ry * 0.1); g.lineTo(rx * 1.6, ry * 0.0); g.stroke(); }
      } else {
        const ey = ry * eo;
        g.beginPath(); g.ellipse(0, 0, rx, ey, 0, 0, 7); g.save(); g.clip();
        const ig = g.createRadialGradient(-1, -2, 0.5, 0, 0, ry); ig.addColorStop(0, '#5a3a26'); ig.addColorStop(0.6, '#24160f'); ig.addColorStop(1, '#120a06');
        g.fillStyle = ig; g.fillRect(-rx - 2, -ry - 2, 2 * rx + 4, 2 * ry + 4);
        g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.arc(-rx * 0.3, -ey * 0.38, Math.max(1.1, rx * 0.36), 0, 7); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(rx * 0.32, ey * 0.4, Math.max(0.6, rx * 0.14), 0, 7); g.fill();
        g.restore();
        // lash line / soft upper lid
        g.strokeStyle = rgba(INK, 0.85); g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-rx - 1, -ey * 0.25); g.quadraticCurveTo(0, -ey - 2.2, rx + 1, -ey * 0.4); g.stroke();
        if (SP.lashes) { g.lineWidth = 1.1; g.beginPath(); g.moveTo(rx + 0.5, -ey * 0.45); g.lineTo(rx + 3, -ey * 0.75); g.stroke(); }
      }
      g.restore();
      // brows: soft arcs (worried when sad, up when surprised)
      const bu = P.brow * 0.07, sd2 = P.sad * 0.06;
      const bIn = P2(sg * SP.browAz[0] + lk * 0.3, SP.browEl - bu - sd2, 1.0), bMid = P2(sg * (SP.browAz[0] + SP.browAz[1]) / 2 + lk * 0.3, SP.browEl - 0.04 - bu - sd2 * 0.3, 1.0), bOut = P2(sg * SP.browAz[1] + lk * 0.3, SP.browEl - bu + sd2 * 0.6, 1.0);
      if (vis(sg * SP.browAz[1], SP.browEl) > 0.05 || vis(sg * SP.browAz[0], SP.browEl) > 0.1) penLine(g, smooth([[bIn[0], bIn[1]], [bMid[0], bMid[1]], [bOut[0], bOut[1]]], false, 4), { color: shade(C.hair, 0.2), w: 2.4 * SP.browW, alpha: 0.75 * clamp(dn * 3), weight: (t) => 0.4 + 0.8 * Math.sin(Math.PI * t) });
    }
    // tear on the near cheek
    if (P.tear > 0.01) { const sg = Math.sin(R.yawB) >= 0 ? -1 : 1, dn = vis(sg * 0.42, 0.3); const q = P2(sg * 0.42, SP.eyeEl + 0.14 + 0.2 * clamp(P.tear), 1.02); g.save(); g.globalAlpha = clamp(P.tear * 3) * clamp(1.3 - P.tear) * clamp(dn * 2); g.fillStyle = 'rgba(200,225,245,0.9)'; g.strokeStyle = rgba('#6a8aa8', 0.7); g.lineWidth = 0.8; g.beginPath(); g.moveTo(q[0], q[1] - 5); g.quadraticCurveTo(q[0] + 3.2, q[1], q[0], q[1] + 2.6); g.quadraticCurveTo(q[0] - 3.2, q[1], q[0], q[1] - 5); g.fill(); g.stroke(); g.restore(); }
    // nose: a tiny button, its shadow and a little curve on the side away from us
    { const u = sph(0, SP.noseEl), q = at(u, 1.03), dn = depth(u); const a = across(0, SP.noseEl), yawRel = Math.atan2(Hx.view[1], Hx.view[0]);
      pool(g, q[0], q[1], HR * 0.09, HR * 0.07, C.cheek, 0.5);
      g.save(); g.translate(q[0], q[1]); g.rotate(a); g.strokeStyle = rgba(INK, 0.6); g.lineWidth = 1.3; g.lineCap = 'round';
      const c0 = Math.PI / 2 + clamp(yawRel, -1.2, 1.2) * 0.9; g.beginPath(); g.arc(0, -1, HR * 0.07, c0 - 0.9, c0 + 0.9); g.stroke(); g.restore(); }
    // mouth: one piece; an O when gasping
    { const el = SP.mouthEl, u = sph(0, el), q = at(u, 1.0), dn = depth(u), a = across(0, el), w = clamp(Math.pow(Math.max(0, dn), 0.6), 0.3, 1);
      g.save(); g.translate(q[0], q[1]); g.rotate(a); g.scale(w, 1);
      const mO = clamp(P.mO);
      if (mO > 0.05) { // a small round 'oh'
        const rx = SP.mouthW * (0.2 + 0.12 * mO), ry = SP.mouthW * (0.18 + 0.22 * mO) * (0.6 + 0.4 * Math.max(P.mouth, mO));
        g.fillStyle = '#5c2622'; g.beginPath(); g.ellipse(0, 2, rx, ry, 0, 0, 7); g.fill(); g.fillStyle = '#d8857c'; g.beginPath(); g.ellipse(0, 2 + ry * 0.45, rx * 0.6, ry * 0.4, 0, 0, 7); g.fill();
        g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 1.4; g.beginPath(); g.ellipse(0, 2, rx, ry, 0, 0, 7); g.stroke();
      } else {
        const sm = P.smile;
        if (sm < 0.25 && P.mouth < 0.1) { // sad: a soft downturned line
          g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 1.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(-SP.mouthW * 0.4, 2 + (0.25 - sm) * 8); g.quadraticCurveTo(0, -2 - (0.25 - sm) * 6, SP.mouthW * 0.4, 2 + (0.25 - sm) * 8); g.stroke();
        } else smileMouth(g, 0, 0, SP.mouthW, clamp(P.mouth), sm, { deep: P.mdeep * SP.mouthDeep, lw: 1.5 });
      }
      g.restore(); }
    // ---- hair: the visible part of the hair region on its shell (minus the face), strands, parting, hairline
    const faceIn = (u) => !inHair(u);
    const facePoly = regionPoly(HAIR_B, faceIn, Hx, shellR, pr);
    const shellPts = Array.from({ length: 48 }, (_, i) => { const a = TAU * i / 48; return at(N3(A3(M3(Hx.xL, Math.cos(a)), M3(Hx.yL, Math.sin(a)))), shellR); });
    g.save(); g.beginPath(); path2(g, shellPts); if (facePoly) path2(g, facePoly); g.clip('evenodd');
    g.save(); g.translate(Cs[0], Cs[1]); drawSprite(g, fills.hair); g.restore();
    // form shading on the hair
    const gr = g.createRadialGradient(Cs[0] - HR * 0.35, Cs[1] - HR * 0.5, HR * 0.2, Cs[0], Cs[1], HR * 1.15); gr.addColorStop(0, 'rgba(255,230,190,0.28)'); gr.addColorStop(0.55, 'rgba(255,230,190,0)'); gr.addColorStop(1, rgba(shade(C.hair, 0.6), 0.45));
    g.fillStyle = gr; g.fillRect(Cs[0] - HR * 1.4, Cs[1] - HR * 1.4, HR * 2.8, HR * 2.8);
    // strands: from the parting round to the plait roots (or the bun), where they face us
    for (const st2 of SP.strands) {
      const line = st2.map((u) => ({ q: at(u, shellR), d: depth(u) }));
      let run = []; const flush = () => { if (run.length > 1) {
        g.save(); g.translate(-1.5, -1); thin(g, run, 4.5, tint(C.hair, 0.45), 0.22); g.restore(); thin(g, run, 3.2, shade(C.hair, 0.3), 0.14);
        penLine(g, run, { color: shade(C.hair, 0.5), w: 1.2, alpha: 0.55, seed: 3, weight: (t) => 0.3 + Math.sin(Math.PI * t) }); } run = []; };
      for (const p of line) { if (p.d > 0.02) run.push([p.q[0], p.q[1]]); else flush(); } flush();
    }
    // the parting
    if (SP.parting) { const line = SP.parting.map((u) => ({ q: at(u, shellR), d: depth(u) })); let run = []; const fl = () => { if (run.length > 1) { thin(g, run, 1.6, tint(C.skin, 0.2), 0.6);
        g.save(); g.strokeStyle = rgba(shade(C.hair, 0.4), 0.55); g.lineWidth = 0.9; for (let i = 1; i < run.length; i++) { const a = run[i - 1], b = run[i], an = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2, sg = i % 2 ? 1 : -1; g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(b[0] + Math.cos(an) * 3.5 * sg, b[1] + Math.sin(an) * 3.5 * sg); g.stroke(); } g.restore(); } run = []; }; for (const p of line) { if (p.d > 0.05) run.push([p.q[0], p.q[1]]); else fl(); } fl(); }
    g.restore();
    // hair outline: the limb where it is hair, and the hairline where it faces us
    { const runs = []; let run = [];
      for (let i = 0; i <= 48; i++) { const a = TAU * i / 48, u = N3(A3(M3(Hx.xL, Math.cos(a)), M3(Hx.yL, Math.sin(a)))); if (inHair(u)) run.push(at(u, shellR)); else { if (run.length > 1) runs.push(run); run = []; } }
      if (run.length > 1) runs.push(run);
      for (const r of runs) {
        // soft locks bulging a little out of the outline, and a few flyaway hairs
        g.save(); g.beginPath(); g.rect(Cs[0] - 400, Cs[1] - 400, 800, 800); path2(g, shellPts.slice().reverse()); g.clip('evenodd');
        g.fillStyle = mix(C.hair, '#c08050', 0.15); g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1.2;
        for (let i = 2; i < r.length - 1; i += 4) { const q = r[i], a = Math.atan2(q[1] - Cs[1], q[0] - Cs[0]); g.beginPath(); g.ellipse(q[0] - Math.cos(a) * 2.5, q[1] - Math.sin(a) * 2.5, HR * 0.17, HR * 0.075, a + Math.PI / 2 + 0.3, 0, 7); g.fill(); }
        g.restore();
        ink(g, r.map((q) => [q[0], q[1]]), 1.9, 0.8, { seed: 17 });
        g.save(); g.strokeStyle = rgba(shade(C.hair, 0.3), 0.6); g.lineWidth = 0.9; g.lineCap = 'round';
        for (let i = 3; i < r.length - 1; i += 7) { const q = r[i], a = Math.atan2(q[1] - Cs[1], q[0] - Cs[0]) + 0.5 * ((i % 2) ? 1 : -1); g.beginPath(); g.moveTo(q[0], q[1]); g.quadraticCurveTo(q[0] + Math.cos(a) * 4, q[1] + Math.sin(a) * 4, q[0] + Math.cos(a + 0.6) * 6.5, q[1] + Math.sin(a + 0.6) * 6.5); g.stroke(); }
        g.restore();
      }
      // a softer hairline: a light broken line with little wisps falling onto the forehead
      const hl = HAIR_B.map((u) => ({ q: at(u, shellR), d: depth(u) })); let rr = []; const fl = () => { if (rr.length > 1) ink(g, rr, 1.0, 0.4, { seed: 19, color: shade(C.hair, 0.4) }); rr = []; };
      for (const p of hl) { if (p.d > 0.03) rr.push([p.q[0], p.q[1]]); else fl(); } fl();
      g.save(); g.strokeStyle = rgba(shade(C.hair, 0.15), 0.7); g.lineWidth = 1.1; g.lineCap = 'round';
      for (let i = 0; i < HAIR_B.length; i += 3) { const u = HAIR_B[i], dn = depth(u); if (dn < 0.25) continue; const az = Math.atan2(u[1], u[0]); if (Math.abs(az) > 1.2) continue;
        const a = at(u, shellR), b = at(sph(az * 1.04, Math.asin(u[2]) + 0.09), 1.0); g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(lerp(a[0], b[0], 0.5) + 1.5, lerp(a[1], b[1], 0.5), b[0], b[1]); g.stroke(); }
      g.restore(); }
    // kerchief / mob cap on a bigger shell over the crown
    if (CAPL && (st.cap ?? SP.capOn)) drawCap(g, R, at, depth, Cs);
    if (SP.bun) { const u = sph(Math.PI, SP.bun[0]), q = at(u, SP.bun[1]); if (depth(u) >= 0) drawBun(g, q, false); }
  }
  function path2(g, pts) { g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
  function drawBun(g, q, behind) { const r = SP.bunR; g.save(); g.fillStyle = C.hair; g.strokeStyle = rgba(INK, 0.75); g.lineWidth = 1.6; g.beginPath(); g.arc(q[0], q[1], r, 0, 7); g.fill(); g.stroke(); g.strokeStyle = rgba(shade(C.hair, 0.5), 0.6); g.lineWidth = 1; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(q[0], q[1], r * (0.35 + 0.2 * k), 0.4 + k, 2.6 + k); g.stroke(); } g.restore(); }
  function drawCap(g, R, at, depth, Cs) {
    const Hx = R.H, cr = SP.capR, fillS = fills.kerchief || fills.cap;
    const capPoly = regionPoly(CAP_B, inCap, Hx, cr, R.pr);
    if (!capPoly || capPoly.length < 3) return;
    clipFill(g, capPoly, fillS, { at: Cs, shade: '#6a5a4a', sl: 0.15, sr: 0.28, after: () => {
      // a few soft gathers from the band toward the crown
      for (let k = -4; k <= 4; k++) { const az = k * 0.42; const a = sph(az, capH(az) - 0.05), b = sph(az * 0.6, -1.2); const l = [0, 0.33, 0.66, 1].map((x) => ({ q: at(slerp(a, b, x), cr), d: depth(slerp(a, b, x)) })); const vv = l.filter((p) => p.d > 0.05).map((p) => [p.q[0], p.q[1]]); if (vv.length > 1) thin(g, vv, 1, shade(C.cap || C.kerchief, 0.4), 0.35); }
    } });
    ink(g, capPoly, 1.6, 0.78, { closed: true, seed: 23 });
    // the frill (mob cap) or the band edge (kerchief) along the boundary where it faces us
    const b = CAP_B.map((u) => ({ q: at(u, cr * 1.01), d: depth(u) }));
    if (SP.frill) { g.save(); g.fillStyle = '#fbf6ec'; g.strokeStyle = rgba(INK, 0.5); g.lineWidth = 0.9; for (let i = 0; i < b.length; i += 2) { const p = b[i]; if (p.d < 0.02) continue; g.beginPath(); g.arc(p.q[0], p.q[1], SP.frill * (0.6 + 0.4 * p.d), 0, 7); g.fill(); g.stroke(); } g.restore(); }
    if (SP.capBow) { const u = sph(Math.PI * 0.62, capH(Math.PI * 0.62) - 0.1), q = at(u, cr * 1.02); if (depth(u) > 0) { g.save(); g.fillStyle = SP.capBow; g.strokeStyle = rgba(INK, 0.6); g.lineWidth = 1; for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(q[0] + sx * 5, q[1], 5.5, 3.2, sx * 0.4, 0, 7); g.fill(); g.stroke(); } g.restore(); } }
  }

  // ---- bed: the pillow behind, the quilt over her
  function drawPillow(g, R) {
    const q = R.bedHead; if (!q) return;
    const sh = smooth([[q[0] - 70, q[1] + 30], [q[0] - 80, q[1] - 10], [q[0] - 40, q[1] - 34], [q[0] + 50, q[1] - 30], [q[0] + 80, q[1] - 4], [q[0] + 76, q[1] + 34]]);
    g.save(); path(g, sh); g.fillStyle = '#fbf7ee'; g.fill(); g.clip(); pool(g, q[0] + 10, q[1] + 10, 60, 30, '#c8bca8', 0.4); g.restore(); ink(g, sh, 1.6, 0.6, { closed: true, seed: 31 });
  }
  function quiltShape(R) {
    // from the chest (the edge rises with the lie) along the body to past the feet, a bump at the knees and toes
    const M = R.M, lie = ease(R.raw.lie || 0), hip = ap(M, R.pr([0, 0, SP.hipY]));
    const chest = ap(M, R.pr([8, 0, lerp(SP.hipY - 20, SP.sh[2] + 18, lie)])), br = R.raw.breath || 0;
    const L = SP.bedLen, top = Math.min(chest[1], hip[1] - 40);
    const edge = [chest[0] - 30 * lie, chest[1] - 4 - br * 1.2];
    return { edge, pts: smooth([[edge[0] - 30, edge[1] + 10], [edge[0], edge[1] - 4 - br], [hip[0] + 50, hip[1] - 36 - br * 0.6], [hip[0] + 120, hip[1] - 30], [hip[0] + L - 36, hip[1] - 38], [hip[0] + L - 6, hip[1] - 22], [hip[0] + L + 10, hip[1] + 20], [Math.min(edge[0], hip[0]) - 40, hip[1] + 20]]) };
  }
  function drawQuilt(g, R) {
    const Q = quiltShape(R);
    clipFill(g, Q.pts, fills.quilt, { shade: '#4a3a2c', sl: 0.1, sr: 0.2, top: 0.2 });
    ink(g, Q.pts, 1.9, 0.8, { closed: true, seed: 37 });
    // the turned-down sheet along the top edge
    const e = Q.edge, band = smooth([[e[0] - 28, e[1] + 6], [e[0] + 10, e[1] - 6], [e[0] + 80, e[1] - 2], [e[0] + 84, e[1] + 10], [e[0] + 10, e[1] + 8], [e[0] - 26, e[1] + 16]]);
    g.save(); path(g, band); g.fillStyle = '#fbf7ee'; g.fill(); g.restore(); ink(g, band, 1.2, 0.6, { closed: true, seed: 39 });
  }

  function paint(g, R, st, layer = 'all') {
    g.save(); g.scale(-1, 1);
    const near = R.arms.reduce((a, b) => (a.nearK >= b.nearK ? a : b)), far = near === R.arms[0] ? R.arms[1] : R.arms[0];
    const back = layer !== 'front', frontL = layer !== 'back', inBed = R.raw.bed > 0.5;
    const base = g.getTransform();
    const body = (fn) => { g.save(); g.setTransform(...mulT(base, R.M)); fn(); g.restore(); };
    if (back) {
      if (inBed) { // the pillow lies where her head will rest when she lies back
        const piv = ap(R.M, [0, SP.hipY]), hc = ap(R.M, R.pr(R.H.C3)), a = -1.32 - R.pb.lean, c = Math.cos(a), sn = Math.sin(a), v = [hc[0] - piv[0], hc[1] - piv[1]];
        const L = Math.hypot(v[0], v[1]); R.bedHead = [piv[0] - L * 0.97, piv[1] - L * 0.22 + 14]; drawPillow(g, R); }
      if (st.stool && R.raw.sit > 0.01) drawStool(g, R);
      if (!inBed) for (const L of R.legs.slice().sort((a, b) => (a.near ? 1 : 0) - (b.near ? 1 : 0))) if (!(SP.longSkirt && L.knK > 0.5)) drawLeg(g, L, !L.near);
      if (R.pail && R.pail.at === 'ground') drawPail(g, pailSpr, R.pail.x, R.pail.y, 0, R.pail.milk, { bail: 1.2 });
      const farLate = far.d > SP.farLate;
      body(() => {
        if (!farLate && !inBed) drawArm(g, far, true, R);
        const plB = R.plaits ? R.plaits.filter((p) => p.dChest < 0) : [], plF = R.plaits ? R.plaits.filter((p) => p.dChest >= 0) : [];
        for (const p of plB) drawPlait(g, p);
        if (!inBed) { g.save(); g.setTransform(...mulT(base, R.Ms)); drawSkirt(g, R, st); g.restore(); }
        drawNeck(g, R);
        drawBodice(g, R, st);
        if (farLate && !inBed) drawArm(g, far, true, R);
        for (const p of plF.sort((a, b) => a.d - b.d)) drawPlait(g, p);
        drawHead(g, R, st);
        if (R.pail && R.pail.at === 'head') drawPail(g, pailSpr, R.pail.x, R.pail.y, R.pail.ang, R.pail.milk, { bail: 1.35 });
      });
      if (inBed) { drawQuilt(g, R); body(() => { drawArm(g, far, true, R); drawArm(g, near, false, R); }); }
    }
    if (frontL && !inBed) body(() => {
      if (R.pail && R.pail.at === 'hand') { const p = R.pail; drawPail(g, pailSpr, p.x, p.y, p.ang - R.pb.lean, p.milk, { bail: 0, hang: true }); }
      drawArm(g, near, false, R);
    });
    g.restore();
  }
  const mulT = (m, M) => { // DOMMatrix m times our affine M
    return [m.a * M[0] + m.c * M[1], m.b * M[0] + m.d * M[1], m.a * M[2] + m.c * M[3], m.b * M[2] + m.d * M[3], m.a * M[4] + m.c * M[5] + m.e, m.b * M[4] + m.d * M[5] + m.f];
  };
  function drawStool(g, R) {
    const top = -(R.raw.seatH ?? 62) + 2, pr = proj(R.yawB, 0.1);
    const seat = Array.from({ length: 24 }, (_, i) => { const th = TAU * i / 24; return pr([-4 + 30 * Math.cos(th), 30 * Math.sin(th), top]); });
    const seatB = seat.map((q) => [q[0], q[1] + 8]);
    for (const th of [0.6, 2.7, 4.6]) { const a = pr([-4 + 22 * Math.cos(th), 22 * Math.sin(th), top + 6]), b = pr([-4 + 34 * Math.cos(th), 34 * Math.sin(th), 0]); tube(g, [[a[0], a[1]], [b[0], b[1]]], 6, '#9a6a44'); }
    unionInk(g, [hull(seat.concat(seatB))], '#a8744a', { w: 1.5 });
    g.save(); g.fillStyle = '#c08a5c'; path(g, seat); g.fill(); g.strokeStyle = rgba(INK, 0.6); g.lineWidth = 1.2; g.stroke(); g.restore();
  }

  // ---- results in the caller's space (facing left), optionally through the caller's transform
  const toCaller = (p, o = {}) => { const lx = -p[0], ly = p[1]; if (o.x === undefined && o.y === undefined && o.scale === undefined && o.face === undefined) return { x: lx, y: ly }; const f = o.face ?? 1, k = o.scale ?? 1; return { x: (o.x ?? 0) + f * k * lx, y: (o.y ?? 0) + k * ly }; };
  const pailOf = (R, o) => { if (!R.pail) return null; const p = R.pail; let q, ang;
    if (p.at === 'head') { q = ap(R.M, [p.x, p.y]); ang = p.ang + R.pb.lean; }
    else if (p.at === 'hand') { const h = ap(R.M, [p.x, p.y]), L = PAIL.H + PAIL.R1 * 1.05; q = [h[0] - Math.sin(p.ang) * L, h[1] + Math.cos(p.ang) * L]; ang = p.ang; }
    else { q = [p.x, p.y]; ang = 0; }
    const c = toCaller(q, o); return { ...c, angle: -(ang) * (o.face ?? 1), milk: p.milk, at: p.at }; };
  return {
    SP, STRIDE: SP.STRIDE, pailSprite: pailSpr,
    draw(g, st = {}, o = {}) { paint(g, rigFromState(st), st, o.layer); },
    drawAt(g, poseFn, t, o = {}) { const { R, st } = rigAt(poseFn, t, o); paint(g, R, st, o.layer); },
    // where the pail is: {x, y (bottom centre), angle (radians, + = clockwise on the page), milk, at}
    pailAt(poseFn, t, o = {}) { return pailOf(rigAt(poseFn, t, o).R, o); },
    pail(st = {}, o = {}) { return pailOf(rigFromState(st), o); },
    headAt(poseFn, t, o = {}) { const { R } = rigAt(poseFn, t, o); return toCaller(ap(R.M, R.pr(R.H.C3)), o); },
    mouthAt(poseFn, t, o = {}) { const { R } = rigAt(poseFn, t, o); return toCaller(ap(R.M, R.pr(R.H.toBody(sph(0, SP.mouthEl)))), o); },
    handsAt(poseFn, t, o = {}) { const { R } = rigAt(poseFn, t, o); const nr = R.arms.reduce((a, b) => (a.nearK >= b.nearK ? a : b)), fa = nr === R.arms[0] ? R.arms[1] : R.arms[0]; return { near: toCaller(ap(R.M, nr.T), o), far: toCaller(ap(R.M, fa.T), o) }; },
    feetAt(poseFn, t, o = {}) { const { R } = rigAt(poseFn, t, o); return R.legs.map((L) => ({ ...toCaller(L.ankle, o), planted: L.planted, near: L.near })); },
    lapAt(st = {}, o = {}) { const R = rigFromState(st); return toCaller(ap(R.M, R.pr([SP.lapF * 0.6, 0, SP.hipY - 4])), o); },
    quiltEdgeAt(poseFn, t, o = {}) { const { R } = rigAt(poseFn, t, o); const q = quiltShape(R).edge; return toCaller([q[0] + 30, q[1]], o); },
    // draw the pail as the rig draws it (page space): angle as pailAt reports it; o.scale / o.face as your transform
    drawPail(g, x, y, angle = 0, milk = 0.8, o = {}) { g.save(); g.translate(x, y); g.rotate(angle); g.scale(-(o.face ?? 1) * (o.scale ?? 1), o.scale ?? 1); drawPail(g, pailSpr, 0, 0, 0, milk, { bail: o.bail ?? 1.35 }); g.restore(); },
    shadow(g, st = {}, height = 0) { g.save(); g.translate(0, height); g.globalAlpha *= 0.5 / (1 + Math.max(0, height) / 120); pool(g, 0, 2, SP.shadowW, 12, '#2a1e12', 0.5); g.restore(); },
  };
}
// hair strands: from the parting round over the head into the plait roots
export function hairStrands(rootAz, rootEl) {
  const out = [];
  for (const side of [-1, 1]) for (let k = 0; k < 11; k++) {
    const f = k / 10, ph = 0.46 + f * (Math.PI + 0.45 - 0.46), st = [Math.cos(ph), side * 0.02, -Math.sin(ph)];
    const mid = sph(side * (1.32 + 1.5 * f ** 1.2), -0.32 + 0.5 * f), end = sph(side * rootAz, rootEl);
    const pts = [];
    for (let i = 0; i <= 8; i++) { const u = i / 8; const a = u < 0.5 ? lerpN(st, mid, u * 2) : lerpN(mid, end, (u - 0.5) * 2); pts.push(a); }
    out.push(pts);
  }
  return out;
}
const lerpN = (a, b, k) => { const p = [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k], l = Math.hypot(...p); return p.map((x) => x / l); };
export const PARTING = Array.from({ length: 24 }, (_, i) => { const ph = 0.46 + (Math.PI + 0.4 - 0.46) * i / 23; return [Math.cos(ph), 0, -Math.sin(ph)]; });

export { sph };
