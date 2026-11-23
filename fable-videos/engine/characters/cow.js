// BUTTERCUP, the gentle Jersey cow: soft fawn coat (darker over the shoulders, hips and round the eyes), cream belly
// and inner legs, big soft button eyes with long lashes, a pink muzzle with a pale ring round it, little cream horn
// nubs, a brass bell on a leather strap, a pink udder, a long tail with a dark switch. Built like cat3: the body is a
// painted profile, the legs are solved with the right joints (the foreleg's elbow goes BACK and its knee (carpus)
// folds with the hoof swinging back; the hind leg's stifle goes FORWARD and its HOCK points BACKWARD), and the head
// is ONE 3D shape (cranium, face and muzzle ellipsoids, their convex outline) with every feature placed on it and seen
// from one yaw, so a turn of the head stays a single consistent view.
//
// FACING: drawn facing LEFT, hooves on the ground at y = 0 (standing, the withers are about 315 units up, the body
// about 420 long: Molly's shoulder height). Mirror with scale(-1, 1). Walking moves the root LEFT.
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
//   walk (cycles) + walkAmt 0..1
//   lie 0..1       lie down in the straw (legs folded under), sleep 0..1 (eyes closed, head lower, slow breathing)
import { wash, pool, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, rgba, shade, tint, mix, clamp, lerp, ease, penLine, hatch, looseWash,
  blooms, soften, path, ellipse, furEdge } from '../watercolor.js';
import { buttonEye, PAPER, INK } from './kit.js';
import { TAU, fr, easeInOut, bell, key, glance, event, kernel, makeFilter, ik2, taper, on } from './rig3.js';
import { headRot, proj, hull, unionInk, fillSprite, A3, M3, limbShape, paintLimb } from './folk3.js';

const FAWN = '#c99c6c', DARK = '#8a5e3e', LEGC = '#9a6c48', CREAM = '#f4e6cc', PINK = '#e9a7a0', HOOF = '#4a3a30';
// ---- geometry (internal: facing RIGHT, ground y = 0)
// withers, a soft dip in the back, the hooks (hip bones), the rump sloping to the pin bones, a round belly, a deep chest
const BODY = smooth([[-218, -286], [-210, -300], [-180, -306], [-150, -326], [-126, -330], [-104, -312], [-60, -300], [-10, -296], [50, -300], [104, -312], [146, -320], [184, -304], [204, -278], [214, -236], [208, -186], [186, -150], [150, -132], [100, -128], [40, -118], [-26, -118], [-84, -128], [-128, -146], [-172, -168], [-204, -196], [-224, -244]]);
const BCN = [0, -230];
const NECK_T = [168, -322], NECK_B = [206, -160];
const H0 = [302, -326]; // cranium centre (standing)
const TAIL_ROOT = [-200, -296], TAIL_N = 14, TAIL_L = 210;
// legs: [name, root (body-local), hoof rest x, hind?, near?, phase]
const LEGS = [['hindFar', [-140, -232], -128, true, false, 0.5], ['foreFar', [138, -222], 150, false, false, 0.75],
  ['hindNear', [-150, -226], -146, true, true, 0], ['foreNear', [124, -218], 134, false, true, 0.25]];
const UP = { fore: 66, hind: 88 }, LO = { fore: 74, hind: 84 }, CAN = { fore: 62, hind: 70 }, PAST = 24;
export const STRIDE = 150;
const LIFT = 26;
export const walkRest = (p) => Math.ceil(p * 2 - 1e-6) / 2;
function walkHoof(q) { q = fr(q + 0.02) - 0.02; if (q < 0.76) return [-STRIDE * (q - 0.37), 0, 0]; const u = (q - 0.76) / 0.24, s = Math.sin(Math.PI * u); return [-STRIDE * 0.39 + STRIDE * 0.78 * easeInOut(u), LIFT * s ** 0.8, s]; }

const DEF = { life: 1, eye: 0.9 };
const PHASES = new Set(['walk']);
const filtered = makeFilter(PHASES, DEF);
function solve(st, dl = 0) {
  const t = (st.t || 0) - dl, v = (k) => st[k] ?? DEF[k] ?? 0;
  const P = { bx: 0, by: 0, pitchB: 0, sy: 1, hx: 0, hy: 0, turn: v('headTurn'), back: clamp(v('lookBack')), nod: v('nod'), roll: 0,
    eye: v('eye'), happy: v('happy'), mouth: v('mouth'), moo: clamp(v('moo')), chew: clamp(v('chew')), jaw: 0, earBack: v('earsBack'), flN: 0, flF: 0,
    tSw: 0, tSwish: clamp(v('tailSwish')), lie: clamp(v('lie')), sleep: clamp(v('sleep')), down: clamp(v('headDown')) };
  const wa = clamp(v('walkAmt'));
  const busy = clamp(Math.max(wa * 0.5, P.lie, P.moo, P.back));
  const life = clamp(v('life')) * (1 - busy);
  const g1 = glance(t, 3.7, 11, 1.0), g2 = glance(t + 1.7, 5.3, 13, 1.2);
  P.turn += life * 0.18 * g2; P.nod += life * 0.05 * g1; P.hx += life * 5 * g1; P.hy += life * 4 * g2;
  const bl = event(t, 4.6, 0.45, 21); if (!st.noBlink && bl >= 0) P.eye *= 1 - Math.sin(Math.PI * bl) ** 1.2;
  const eN = event(t + 1.1, 3.9, 0.45, 25), eF = event(t + 2.6, 5.1, 0.45, 27);
  if (eN >= 0) P.flN += Math.sin(Math.PI * eN) * Math.sin(eN * TAU * 2);
  if (eF >= 0) P.flF += Math.sin(Math.PI * eF) * Math.sin(eF * TAU * 2);
  const sw = event(t + 0.5, 6.3, 1.4, 29); if (sw >= 0) P.tSwish = Math.max(P.tSwish, Math.sin(Math.PI * sw));
  P.tSw = Math.sin(t * TAU * 0.21) * 0.6 + P.tSwish * Math.sin(t * TAU * 1.3) * 1.6;
  // chewing the cud: the jaw grinds round (sideways and a little down)
  if (P.chew > 0) { const c = t * TAU * 1.25; P.jaw = P.chew * Math.sin(c); P.mouth = Math.max(P.mouth, P.chew * 0.12 * (0.5 + 0.5 * Math.cos(c))); P.hy += P.chew * 1.5 * Math.cos(c); }
  if (wa > 0) { const ph = v('walk'); P.by -= wa * 4 * Math.cos(ph * 2 * TAU); P.pitchB += wa * 0.012 * Math.sin(ph * TAU); P.hy += wa * 8 * Math.cos(ph * 2 * TAU + 0.8); P.hx += wa * 6 * Math.sin(ph * TAU); P.nod -= wa * 0.08; P.tSw += wa * 0.4 * Math.sin(ph * TAU); }
  if (P.moo > 0) { P.nod += P.moo * 0.45; P.hy -= P.moo * 16; P.hx += P.moo * 10; P.mouth = Math.max(P.mouth, P.moo * (0.7 + 0.15 * Math.sin(t * 9))); P.eye *= 1 - 0.45 * P.moo; P.earBack += P.moo * 0.4; P.turn -= P.moo * 0.15; }
  if (P.down > 0) { P.nod -= P.down * 0.5; P.hy += P.down * 70; P.hx += P.down * 24; }
  if (P.back > 0) { P.turn += P.back * 2.3; P.hx -= P.back * 70; P.hy += P.back * 40; P.nod -= P.back * 0.12; }
  const br = Math.sin(t * TAU * lerp(0.22, 0.14, P.sleep)); P.sy = 1 + br * 0.008 * (1 + P.sleep);
  if (P.lie > 0) { const k = ease(P.lie); P.by += k * 128; P.hy += k * 52; P.hx -= k * 30; P.nod += k * 0.05; P.turn += k * 0.1; P.tWrap = k; }
  if (P.sleep > 0) { P.eye *= 1 - ease(P.sleep / 0.6); P.hy += P.sleep * 14; P.hx -= P.sleep * 6; P.nod -= P.sleep * 0.12; P.earBack += P.sleep * 0.5; P.turn += P.sleep * 0.25; P.happy *= 1 - P.sleep; P.tSw *= 1 - 0.8 * P.sleep; }
  P.wa = wa;
  return P;
}
const K = { head: kernel(2.4, 0.6, 0.6, 9), body: kernel(1.9, 0.6, 0.7, 9), ear: kernel(2.6, 0.3, 0.8, 9), tail: kernel(1.2, 0.35, 1.3, 9) };
const LAG = { head: 0.03, body: 0.05, ear: 0.08, tail: 0.12 };
const TAIL_DELAYS = [0, 0.12, 0.25, 0.4, 0.58];

export function makeCow(res = 2, seed = 91) {
  const s = (n) => seed * 100 + n;
  const body = sprite(bbox(BODY), res, (g) => {
    wash(g, BODY, { color: PAPER, opacity: 1, under: PAPER, seed: s(1), edge: 0 });
    looseWash(g, BODY, FAWN, { opacity: 0.9, seed: s(2), shift: 3, reserves: 2 });
    blooms(g, BODY, ['#d6a272', '#b07a4c', '#c89464'], { n: 8, seed: s(3), alpha: 0.3 });
    glaze(g, BODY, 150, -250, 70, 80, DARK, 0.45); glaze(g, BODY, -160, -250, 70, 70, DARK, 0.4); // shoulder, hip
    glaze(g, BODY, 0, -150, 160, 24, CREAM, 0.75); glaze(g, BODY, -40, -300, 140, 20, '#e0b483', 0.35);
    shadeEdge(g, BODY, { color: '#5a3a22', alpha: 0.32, width: 40, dy: -14 });
    soften(g, 1.0 * res);
    hatch(g, BODY, { color: '#7a4e2e', count: 160, len: 12, width: 0.8, alpha: 0.35, seed: s(4), dir: () => Math.PI / 2 + 0.2 });
    furEdge(g, BODY, { color: FAWN, count: 90, len: 8, width: 1.4, alpha: 0.6, seed: s(5) });
    // hip bone and the ribs, softly
    // the hooks (hip bone), the pin bone by the tail, the shoulder blade, a few ribs: soft pen and shadow
    penLine(g, smooth([[-156, -312], [-128, -300], [-104, -306]], false), { w: 1.3, alpha: 0.45 }); glaze(g, BODY, -128, -292, 26, 14, '#7a5030', 0.4);
    penLine(g, smooth([[-206, -276], [-196, -268], [-188, -276]], false), { w: 1.1, alpha: 0.35 });
    penLine(g, smooth([[150, -306], [160, -260], [176, -214]], false), { w: 1.1, alpha: 0.25 });
    for (let k = 0; k < 4; k++) penLine(g, smooth([[0 + k * 24, -268], [-4 + k * 24, -230], [4 + k * 24, -190]], false), { w: 0.9, alpha: 0.14 });
    glaze(g, BODY, -10, -150, 120, 22, CREAM, 0.5);
    penLine(g, BODY, { closed: true, color: INK, w: 2.2, alpha: 0.8, seed: s(6), weight: (t) => 0.35 + 0.8 * Math.max(0, Math.sin(t * TAU + 1)) });
  }, { seed: s(7), grain: 0.12 });
  const fur = fillSprite(res, [-160, -160, 160, 160], FAWN, s(10), { base: 0.85, blooms: ['#d6a272', '#b07a4c', '#c89464'], weave: 120, wlen: 9, wa: 0.25, dir: () => Math.PI / 2 });
  const legFur = (sh) => sh;
  const EAR = smooth([[0, -10], [18, -14], [38, -10], [50, 0], [38, 10], [18, 13], [0, 9]]);
  const EAR_IN = smooth([[6, -5], [20, -8], [36, -5], [44, 0], [36, 5], [20, 7], [6, 4]]);
  const earS = sprite(bbox(EAR), res, (g) => { wash(g, EAR, { color: FAWN, opacity: 0.95, under: PAPER, seed: s(20) }); wash(g, EAR_IN, { color: PINK, opacity: 0.85, seed: s(21) }); for (let k = 0; k < 5; k++) penLine(g, [[10 + k * 6, -4], [16 + k * 6, 4]], { color: '#fff4ee', w: 0.8, alpha: 0.6 }); penLine(g, EAR, { closed: true, w: 1.5, alpha: 0.8 }); }, { granulate: false });
  const UDDER = smooth([[-46, -18], [-20, -24], [20, -24], [48, -14], [44, 12], [20, 26], [-20, 26], [-44, 12]]);
  const udder = sprite(bbox(UDDER.concat([[0, 50]])), res, (g) => {
    for (const x of [-30, -10, 14, 32]) { const tt = smooth([[x - 5, 18], [x + 5, 18], [x + 4, 40], [x, 44], [x - 4, 40]]); wash(g, tt, { color: PINK, opacity: 0.95, under: PAPER, seed: s(30 + x) }); penLine(g, tt, { closed: true, w: 1.1, alpha: 0.7 }); }
    wash(g, UDDER, { color: PINK, opacity: 0.95, under: PAPER, seed: s(31) }); glaze(g, UDDER, -8, -6, 30, 12, '#fbe4de', 0.6); shadeEdge(g, UDDER, { color: '#a8605a', alpha: 0.3, width: 12, dy: -5 });
    penLine(g, UDDER, { closed: true, w: 1.5, alpha: 0.75 });
  }, { granulate: false });

  // ---- the 3D head: head-local [f along the face (poll -> nose), l her left, y down]; four ellipsoids
  const PARTS = [{ c: [0, 0, 0], r: [38, 46, 37] }, { c: [40, 0, 8], r: [32, 37, 30] }, { c: [80, 0, 12], r: [25, 37, 25] }, { c: [32, 0, 24], r: [32, 37, 20] }];
  const MUZ = PARTS[2];
  const ELL = (P, n = 14) => { const o = []; for (let i = 0; i < n; i++) for (let j = 1; j < 8; j++) { const a = TAU * i / n, b = Math.PI * j / 8; o.push([P.c[0] + P.r[0] * Math.cos(b), P.c[1] + P.r[1] * Math.sin(b) * Math.cos(a), P.c[2] + P.r[2] * Math.sin(b) * Math.sin(a)]); } o.push([P.c[0] + P.r[0], P.c[1], P.c[2]], [P.c[0] - P.r[0], P.c[1], P.c[2]]); return o; };
  const HEADPTS = [].concat(...PARTS.map((P) => ELL(P)));
  const MUZPTS = ELL(MUZ, 18);

  function headXf(P, Hc) {
    const yaw = (0.78 - 0.55 * P.turn), pitch = -0.95 + P.nod;
    const R = headRot(0, pitch, P.roll);
    const pr = proj(yaw);
    const at = (p) => { const q = pr(mv(R, p)); return [Hc[0] + q[0], Hc[1] + q[1], q[2]]; };
    // the view direction in head-local space (for "does this face us")
    const c = Math.cos(yaw), sn = Math.sin(yaw), Rt = [[R[0][0], R[1][0], R[2][0]], [R[0][1], R[1][1], R[2][1]], [R[0][2], R[1][2], R[2][2]]];
    const view = mv(Rt, [c, -sn, 0]);
    return { R, at, view, yaw, pitch };
  }
  const mv = (A, v) => [A[0][0] * v[0] + A[0][1] * v[1] + A[0][2] * v[2], A[1][0] * v[0] + A[1][1] * v[1] + A[1][2] * v[2], A[2][0] * v[0] + A[2][1] * v[1] + A[2][2] * v[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  // ---- rig
  function bodyMat(P) { const c = Math.cos(P.pitchB), sn = Math.sin(P.pitchB); return (p) => { const x = p[0] - BCN[0], y = (p[1] - BCN[1]) * P.sy; return [BCN[0] + P.bx + x * c - y * sn, BCN[1] + P.by + x * sn + y * c]; }; }
  function legsSolve(raw, pb) {
    const Mb = bodyMat(pb), out = {}, lie = ease(raw.lie);
    for (const [name, root, px, hind, near, off] of LEGS) {
      const R = Mb(root);
      let [dx, lift, sw] = walkHoof((raw.walkPhase || 0) + off);
      // standing square: each hoof steps into place in its own window (no sliding while the walk eases in or out)
      const stand = 1 - clamp(raw.wa || 0), su = clamp((stand - off * 0.6) / 0.4);
      if (su > 0) { const d0 = Math.abs(dx); dx *= 1 - easeInOut(su); if (su < 1) lift += 16 * Math.sin(Math.PI * su) * clamp(d0 / 8); }
      let x = px + dx, y = -lift;
      // fore: the cannon's angle from straight down (+ = hoof behind the knee: folding back); hind: the cannon's angle
      // (+ = hoof ahead of the hock)
      let ang = hind ? 0.08 + 0.55 * sw : 0.85 * sw;
      if (lie > 0) { // folded under: fore knee forward on the straw, cannon tucked back; hind hock out behind, hoof forward
        const tx = hind ? root[0] + 96 : root[0] - 30, ty = hind ? -6 : -8;
        x = lerp(x, tx + (near ? 8 : -6), lie); y = lerp(y, ty, lie); ang = lerp(ang, hind ? 1.5 : 1.75, lie);
      }
      out[name] = { R, P: [x, y], hind, near, ang, planted: lift < 0.5 && lie < 0.01, lie };
    }
    return out;
  }
  function tailShape(P) {
    const angs = [];
    for (let i = 0; i < TAIL_N; i++) { const f = (i + 1) / TAIL_N;
      let a = Math.PI / 2 + 0.38 - 0.3 * f + P.tSw * 0.22 * Math.sin(f * 2.6) * f;
      a = lerp(a, lerp(Math.PI / 2 + 0.22, Math.PI - 0.08, ease((f - 0.6) / 0.3)), ease(P.tWrap || 0)); // lying: down the rump, then back along the straw
      angs.push(a); }
    return angs;
  }
  function rig(raw, ph, pb, pe, tails) {
    const Mb = bodyMat(pb);
    const Hc = add2(Mb([H0[0], H0[1]]), [ph.hx, ph.hy]);
    const Hx = headXf(ph, Hc);
    const legs = legsSolve(raw, pb);
    // tail chain
    const shapes = tails.map((x) => tailShape(x.P)), ds = TAIL_L / TAIL_N; let p = Mb(TAIL_ROOT); const tail = [p];
    for (let i = 0; i < TAIL_N; i++) { const f = i / (TAIL_N - 1), tau = f * (tails.length - 1), j = Math.min(tails.length - 2, Math.floor(tau)), k = tau - j; const a = lerp(shapes[j][i], shapes[j + 1][i], k); p = [p[0] + Math.cos(a) * ds, Math.min(p[1] + Math.sin(a) * ds, -4)]; tail.push(p); }
    return { raw, pb, ph, pe, Mb, Hx, Hc, legs, tail };
  }
  const add2 = (a, b) => [a[0] + b[0], a[1] + b[1]];
  function fill(raw, st) { raw.walkPhase = st.walk || 0; return raw; }
  function rigFromState(st) { const p = fill(solve(st), st); p.tt = st.t || 0; return rig(p, p, p, p, TAIL_DELAYS.map(() => ({ P: p }))); }
  function rigAt(poseFn, t, o = {}) {
    const since = o.since ?? -1e9, cache = new Map(); const cur = poseFn(t); cache.set(Math.round(t * 960) / 960, cur);
    const raw = fill(solve(cur), cur); raw.tt = t;
    const one = (k, dt = 0) => { const p = solve({ ...cur, ...filtered(poseFn, t - dt, K[k], since, cache), t: t - dt }, LAG[k]); p.tt = t - dt - LAG[k]; return p; };
    return { R: rig(raw, one('head'), one('body'), one('ear'), TAIL_DELAYS.map((d) => ({ P: one('tail', d) }))), st: cur };
  }

  // ---- painting (internal, facing right)
  // a soft limb: round-capped segments, ink under colour (no seams at the joints), widths per point
  function legTube(g, pts, w0, w1, col) {
    const n = pts.length, W = (i) => lerp(w0, w1, i / (n - 1));
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    for (let pass = 0; pass < 3; pass++) for (let i = 0; i < n - 1; i++) {
      const w = (W(i) + W(i + 1)) / 2; g.beginPath(); g.moveTo(pts[i][0], pts[i][1]); g.lineTo(pts[i + 1][0], pts[i + 1][1]);
      if (pass === 0) { g.strokeStyle = rgba(INK, 0.75); g.lineWidth = w + 3.2; } else if (pass === 1) { g.strokeStyle = col; g.lineWidth = w; } else { g.strokeStyle = rgba(shade(col, 0.35), 0.35); g.lineWidth = w * 0.3; g.save(); g.translate(w * 0.25, 0); g.stroke(); g.restore(); continue; }
      g.stroke(); }
    g.restore();
  }
  function drawHoof(g, x, y, ang, far) {
    g.save(); g.translate(x, y); g.rotate(ang);
    const sh = smooth([[-11, -14], [10, -13], [17, -2], [16, 3], [-12, 3], [-14, -6]]);
    g.fillStyle = far ? shade(HOOF, 0.15) : HOOF; path(g, sh); g.fill(); g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 1.5; g.stroke();
    g.strokeStyle = 'rgba(200,180,160,0.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(4, -12); g.lineTo(6, 2); g.stroke(); // the cleft
    g.restore();
  }
  function drawLeg(g, L, far) {
    const col = far ? shade(FAWN, 0.2) : FAWN, low = far ? shade(LEGC, 0.2) : LEGC;
    const hoof = L.P, fet = [hoof[0] - 6 * Math.cos(L.lie * 1.4), hoof[1] - PAST * (1 - 0.7 * L.lie) - 4], toe = [hoof[0] + 2, hoof[1] - 9];
    let pts, ws, split;
    if (L.hind) { // thigh, stifle (forward), gaskin, the hock pointing back, cannon, fetlock, pastern
      const hock = [fet[0] - CAN.hind * Math.sin(L.ang), fet[1] - CAN.hind * Math.cos(L.ang)];
      const { E: stifle, T: hk } = ik2(L.R, hock, UP.hind, LO.hind, [1, 0.1], 1.15);
      const gas = [lerp(stifle[0], hk[0], 0.5) - 3, lerp(stifle[1], hk[1], 0.5)], can = [lerp(hk[0], fet[0], 0.5), lerp(hk[1], fet[1], 0.5)];
      pts = [L.R, stifle, gas, [hk[0] - 3, hk[1]], can, fet, toe]; ws = [74, 58, 36, 30, 19, 24, 18]; split = hk[1];
    } else { // forearm (elbow back), the knee, cannon, fetlock, pastern
      const kn = [fet[0] + CAN.fore * Math.sin(L.ang), fet[1] - CAN.fore * Math.cos(L.ang)];
      const { E: elbow, T: kk } = ik2(L.R, kn, UP.fore, LO.fore, [-1, 0.1], 1.15);
      const fa = [lerp(elbow[0], kk[0], 0.4), lerp(elbow[1], kk[1], 0.4)], can = [lerp(kk[0], fet[0], 0.5), lerp(kk[1], fet[1], 0.5)];
      pts = [L.R, elbow, fa, kk, can, fet, toe]; ws = [64, 50, 38, 27, 20, 24, 18]; split = kk[1] - 10;
    }
    paintLimb(g, limbShape(pts, ws, 5), col, { w: 26, seed: 21 + (far ? 1 : 0), pw: 1.9, after: () => {
      const gr = g.createLinearGradient(0, split - 30, 0, split + 30); gr.addColorStop(0, rgba(low, 0)); gr.addColorStop(1, rgba(low, 0.9));
      g.fillStyle = gr; g.fillRect(-2000, split - 30, 4000, 400);
      hatch(g, limbShape(pts, ws, 5).shape, { color: '#6a4628', count: 30, len: 7, width: 0.7, alpha: 0.3, seed: 33, dir: () => Math.PI / 2 });
    } });
    drawHoof(g, hoof[0] + 2, hoof[1], L.lie * (L.hind ? -0.2 : 1.2), far);
  }
  function drawTail(g, R) {
    const pts = R.tail;
    taper(g, pts, 10, 5, FAWN, { shade: DARK, inkW: 1.3, inkA: 0.7 });
    const e = pts[pts.length - 1], q = pts[pts.length - 3], a = Math.atan2(e[1] - q[1], e[0] - q[0]);
    g.save(); g.translate(e[0], e[1]); g.rotate(a - Math.PI / 2);
    const sw = smooth([[-6, -14], [6, -14], [12, 10], [8, 30], [2, 40], [-4, 32], [-12, 12]]);
    g.fillStyle = '#4a3226'; path(g, sw); g.fill(); g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = 'rgba(140,110,90,0.6)'; g.lineWidth = 0.9; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * 2, -8); g.quadraticCurveTo(k * 4, 14, k * 3, 34); g.stroke(); }
    g.restore();
  }
  function neckShape(R) {
    const Mb = R.Mb, Hx = R.Hx, t = Mb(NECK_T), b = Mb(NECK_B);
    const poll = Hx.at([-20, 0, -34]), throat = Hx.at([30, 0, 40]), jawB = Hx.at([-10, 0, 34]);
    const mid = [lerp(b[0], throat[0], 0.5) - 8, Math.max(b[1], throat[1]) + 40]; // the dewlap: soft loose skin under the neck
    return smooth([[t[0] - 50, t[1] + 26], [t[0] - 10, t[1] - 4], [lerp(t[0], poll[0], 0.5), lerp(t[1], poll[1], 0.5) - 10], [poll[0], poll[1]], [jawB[0], jawB[1]], [throat[0], throat[1]], mid, [b[0], b[1]], [b[0] - 50, b[1] - 10]]);
  }
  function drawHead(g, R, part) {
    const Hx = R.Hx, P = R.ph, pe = R.pe, V = Hx.view;
    const facing = (n) => dot(n, V);
    // ears and horns: [side, base, direction]
    const earAt = (sg, fl) => {
      const base = [-6, sg * 42, -14], dir = [-0.35 - 0.3 * clamp(pe.earBack + P.sleep * 0.3), sg * 1, 0.25 + 0.35 * clamp(pe.earBack) + 0.3 * fl];
      const b = Hx.at(base), tip = Hx.at([base[0] + dir[0] * 46, base[1] + dir[1] * 46, base[2] + dir[2] * 46]);
      const L = Math.hypot(tip[0] - b[0], tip[1] - b[1]), a = Math.atan2(tip[1] - b[1], tip[0] - b[0]);
      const wf = clamp(0.45 + 0.55 * Math.abs(facing([1, 0, -0.3])), 0.4, 1);
      g.save(); g.translate(b[0], b[1]); g.rotate(a); g.scale(Math.max(0.35, L / 46), wf); drawSprite(g, earS); g.restore();
    };
    const hornAt = (sg) => { const b = Hx.at([-22, sg * 24, -32]), tp = Hx.at([-26, sg * 34, -52]); g.save(); g.lineCap = 'round'; g.strokeStyle = rgba(INK, 0.75); g.lineWidth = 11; g.beginPath(); g.moveTo(b[0], b[1]); g.lineTo(tp[0], tp[1]); g.stroke(); g.strokeStyle = '#efe4cc'; g.lineWidth = 8; g.stroke(); g.strokeStyle = '#a89070'; g.lineWidth = 3; g.beginPath(); g.moveTo(lerp(b[0], tp[0], 0.7), lerp(b[1], tp[1], 0.7)); g.lineTo(tp[0], tp[1]); g.stroke(); g.restore(); };
    const sideDepth = (sg) => Hx.at([0, sg * 40, 0])[2];
    const farSg = sideDepth(1) < sideDepth(-1) ? 1 : -1;
    if (part === 'back') { earAt(farSg, farSg > 0 ? pe.flF : pe.flN); hornAt(farSg); return; }
    // the head's outline: convex hull of the projected ellipsoids
    const pts = HEADPTS.map((p) => Hx.at(p)), H = hull(pts);
    const C = Hx.at([30, 0, 6]);
    g.save(); path(g, H); g.clip();
    g.save(); g.translate(C[0], C[1]); drawSprite(g, fur); g.restore();
    // Jersey shading: dark round the eyes and on the face's far side, lighter down the forehead
    for (const sg of [-1, 1]) { const e = Hx.at([22, sg * 34, -8]); pool(g, e[0], e[1], 30, 26, DARK, 0.5); }
    const fh = Hx.at([34, 0, -26]); pool(g, fh[0], fh[1], 26, 40, '#e8bc8c', 0.45);
    const lowJ = Hx.at([40, 0, 34]); pool(g, lowJ[0], lowJ[1], 40, 18, '#5a3a22', 0.25);
    g.restore();
    unionInk(g, [H], 'rgba(0,0,0,0)', { w: 1.9 }); // ink only (the fill was the fur)
    // chewing: the cheek bulges on the side the jaw goes
    if (P.jaw) { const sg = P.jaw > 0 ? 1 : -1, ck = Hx.at([46, sg * 34, 18]); if (ck[2] > -5) pool(g, ck[0], ck[1], 16, 12, '#7a4e2e', 0.3 * Math.abs(P.jaw)); }
    // forelock / poll tuft
    { const a = Hx.at([-34, 0, -30]); g.save(); g.strokeStyle = rgba('#6a4428', 0.7); g.lineWidth = 1.6; g.lineCap = 'round'; for (let k = -3; k <= 3; k++) { const b = Hx.at([-20 + Math.abs(k) * 2, k * 6, -40]), c2 = Hx.at([-6, k * 7, -30]); g.beginPath(); g.moveTo(b[0], b[1]); g.quadraticCurveTo(a[0] + k * 2, a[1], c2[0], c2[1]); g.stroke(); } g.restore(); }
    // the muzzle: a pale ring, the pink nose pad on its front, nostrils, the mouth beneath
    const muzH = hull(MUZPTS.map((p) => Hx.at(p)));
    g.save(); path(g, muzH); g.fillStyle = rgba('#f4e6d0', 0.92); g.fill(); g.restore();
    const padPts = []; for (let i = 0; i < 18; i++) for (let j = 0; j <= 4; j++) { const a = TAU * i / 18, b = 0.75 * j / 4; padPts.push([MUZ.c[0] + MUZ.r[0] * Math.cos(b) + 2, MUZ.r[1] * 0.92 * Math.sin(b) * Math.cos(a), MUZ.c[2] - 3 + MUZ.r[2] * 0.9 * Math.sin(b) * Math.sin(a)]); }
    const padH = hull(padPts.map((p) => Hx.at(p)));
    g.save(); path(g, padH); g.fillStyle = PINK; g.fill(); g.clip(); const pc = Hx.at([MUZ.c[0] + MUZ.r[0], 0, MUZ.c[2] - 8]); pool(g, pc[0], pc[1], 16, 10, '#fff0ea', 0.6); g.restore();
    g.save(); path(g, padH); g.strokeStyle = rgba(INK, 0.6); g.lineWidth = 1.3; g.stroke(); g.restore();
    for (const sg of [-1, 1]) { const n = [0.75, sg * 0.55, -0.1], p = Hx.at([MUZ.c[0] + MUZ.r[0] * 0.8, sg * MUZ.r[1] * 0.42, MUZ.c[2] - 6]); const vis = facing(n); if (vis > 0.05) { g.save(); g.translate(p[0], p[1]); g.scale(clamp(vis * 1.4, 0.35, 1), 1); g.fillStyle = '#6a3a36'; g.beginPath(); g.ellipse(0, 0, 4.2, 2.8, sg * 0.5, 0, 7); g.fill(); g.restore(); } }
    // mouth: round the bottom of the muzzle; opens (moo) into one dark shape; the jaw slides sideways when chewing
    const m = clamp(P.mouth), jx = (P.jaw || 0) * 7;
    const lip = [], jawL = [];
    for (let k = 0; k <= 10; k++) { const b = -1.05 + 2.1 * k / 10, f = MUZ.c[0] + MUZ.r[0] * 0.62 * Math.cos(b * 0.5), l = MUZ.r[1] * 0.78 * Math.sin(b), y = MUZ.c[2] + MUZ.r[2] * 0.62;
      const q = Hx.at([f, l, y]), n = [0.4, Math.sin(b), 0.7]; lip.push([q[0], q[1], facing(n)]); const q2 = Hx.at([f - 4 - m * 6, l + jx, y + 4 + m * 18]); jawL.push([q2[0], q2[1]]); }
    const visL = lip.filter((q) => q[2] > -0.1);
    if (m > 0.05) { g.save(); g.beginPath(); lip.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); for (let i = jawL.length - 1; i >= 0; i--) g.lineTo(jawL[i][0], jawL[i][1]); g.closePath(); g.fillStyle = '#5c2622'; g.fill(); g.clip(); const tq = jawL[5]; g.fillStyle = '#d8857c'; g.beginPath(); g.ellipse(tq[0], tq[1] - 4, 14, 5 + 5 * m, 0, 0, 7); g.fill(); g.restore();
      g.save(); g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1.4; g.beginPath(); jawL.forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); g.restore(); }
    if (visL.length > 1) { g.save(); g.strokeStyle = rgba(INK, 0.75); g.lineWidth = 1.6; g.lineCap = 'round'; g.beginPath(); visL.forEach((q, i) => (i ? g.lineTo(q[0] + jx * 0.3, q[1]) : g.moveTo(q[0] + jx * 0.3, q[1]))); g.stroke(); g.restore(); }
    // chin (moves with the chewing jaw)
    { const c = Hx.at([MUZ.c[0] - 8, jx, MUZ.c[2] + MUZ.r[2] + 2]); g.save(); g.strokeStyle = rgba(INK, 0.45); g.lineWidth = 1.3; g.beginPath(); g.arc(c[0], c[1] - 4, 12, 0.3 * Math.PI, 0.7 * Math.PI); g.stroke(); g.restore(); }
    // eyes: big soft button eyes on the sides of the head, long lashes; the far one narrower and hidden round the back
    const big = 1, eo = clamp(P.eye), happy = P.happy > 0.5;
    for (const sg of [-1, 1]) {
      const n = [0.25, sg * 0.92, -0.25], vis = facing(n); if (vis < 0.04) continue;
      const p = Hx.at([22, sg * 35, -9]), w = clamp(Math.pow(vis, 0.7), 0.3, 1);
      const a = Math.atan2(Hx.at([40, sg * 30, -9])[1] - Hx.at([12, sg * 34, -9])[1], Hx.at([40, sg * 30, -9])[0] - Hx.at([12, sg * 34, -9])[0]);
      const fwdX = Math.sign(Hx.at([60, 0, 0])[0] - Hx.at([0, 0, 0])[0]) || 1;
      g.save(); g.translate(p[0], p[1]); g.rotate(clamp(a, -0.5, 0.5) * 0.5); g.scale(w, 1);
      if (eo > 0.12 && !happy) pool(g, 0, 1, 15, 13, '#f2dcc0', 0.7); // the pale ring round a Jersey's eye
      buttonEye(g, 0, 0, eo, { R: 10, happy });
      if (eo > 0.12 && !happy) { g.strokeStyle = rgba(INK, 0.85); g.lineWidth = 1.3; g.lineCap = 'round'; const ry = 10 * 0.95 * eo;
        for (let k = 0; k < 3; k++) { const x = (-3 + k * 4) * -fwdX; g.beginPath(); g.moveTo(x, -ry + 0.5); g.lineTo(x - fwdX * -(2 + k * 1.5), -ry - 5 - k * 0.5); g.stroke(); } }
      else if (!happy) { g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 1.1; for (let k = 0; k < 3; k++) { const x = -5 + k * 5; g.beginPath(); g.moveTo(x, -3); g.lineTo(x + (k - 1) * 1.5, 2); g.stroke(); } }
      g.restore();
    }
    hornAt(-farSg); earAt(-farSg, -farSg > 0 ? pe.flF : pe.flN);
  }
  function drawBell(g, R) {
    const Hx = R.Hx, Mb = R.Mb;
    const top = Hx.at([-34, 0, -36]), a = Mb([NECK_T[0] + 18, NECK_T[1] + 4]), thr = Hx.at([-6, 0, 40]), b = Mb([NECK_B[0] - 4, NECK_B[1] - 30]);
    const s0 = [lerp(a[0], top[0], 0.45), lerp(a[1], top[1], 0.45)], s1 = [lerp(b[0], thr[0], 0.45), lerp(b[1], thr[1], 0.45) + 12];
    g.save(); g.lineCap = 'round';
    g.strokeStyle = rgba(INK, 0.75); g.lineWidth = 11; g.beginPath(); g.moveTo(s0[0], s0[1]); g.quadraticCurveTo(lerp(s0[0], s1[0], 0.5) + 10, lerp(s0[1], s1[1], 0.5), s1[0], s1[1]); g.stroke();
    g.strokeStyle = '#8a4a2a'; g.lineWidth = 8; g.stroke();
    g.strokeStyle = 'rgba(230,200,150,0.5)'; g.lineWidth = 1; g.stroke();
    // the bell swings a little behind the head's motion
    const sw = 0.2 * Math.sin((R.raw.tt || 0) * 2.1) * (R.raw.wa ? 1 : 0.3) + (R.ph.hx - R.raw.hx) * 0.01;
    g.translate(s1[0], s1[1] + 2); g.rotate(sw);
    const bell = smooth([[-7, 0], [7, 0], [11, 16], [15, 26], [-15, 26], [-11, 16]]);
    g.fillStyle = '#d8b050'; path(g, bell); g.fill(); g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 1.4; g.stroke();
    g.fillStyle = 'rgba(255,240,190,0.7)'; g.beginPath(); g.ellipse(-4, 12, 2.5, 7, 0.2, 0, 7); g.fill();
    g.fillStyle = '#6a5030'; g.beginPath(); g.arc(0, 28, 3, 0, 7); g.fill();
    g.restore();
  }
  function paint(g, R) {
    g.save(); g.scale(-1, 1);
    const L = R.legs, Mb = R.Mb, pb = R.pb;
    drawLeg(g, L.hindFar, true); drawLeg(g, L.foreFar, true);
    drawLeg(g, L.hindNear, false); drawLeg(g, L.foreNear, false);
    drawHead(g, R, 'back');
    // the neck (painted fur clipped to its shape), then the body over its root
    const N = neckShape(R);
    g.save(); path(g, N); g.clip(); const nc = Mb([200, -250]); g.save(); g.translate(nc[0], nc[1]); drawSprite(g, fur); g.restore(); pool(g, nc[0] + 20, nc[1] + 40, 60, 30, CREAM, 0.4); g.restore();
    g.save(); path(g, N); g.strokeStyle = rgba(INK, 0.78); g.lineWidth = 2; g.stroke(); g.restore();
    g.save(); const bp = Mb(BCN); g.translate(bp[0], bp[1]); g.rotate(pb.pitchB); g.scale(1, pb.sy); g.translate(-BCN[0], -BCN[1]); drawSprite(g, body);
    g.save(); g.translate(-96, -150 + 6 * R.raw.lie); g.scale(1, 1 - 0.5 * ease(R.raw.lie)); drawSprite(g, udder); g.restore();
    g.restore();
    drawTail(g, R);
    drawBell(g, R);
    drawHead(g, R, 'front');
    g.restore();
  }
  const toCaller = (p, o = {}) => { const lx = -p[0], ly = p[1]; if (o.x === undefined && o.y === undefined && o.scale === undefined && o.face === undefined) return { x: lx, y: ly }; const f = o.face ?? 1, k = o.scale ?? 1; return { x: (o.x ?? 0) + f * k * lx, y: (o.y ?? 0) + k * ly }; };
  return {
    STRIDE,
    draw(g, st = {}) { paint(g, rigFromState(st)); },
    drawAt(g, poseFn, t, o = {}) { paint(g, rigAt(poseFn, t, o).R); },
    hoovesAt(poseFn, t, o = {}) { const R = rigAt(poseFn, t, o).R; return LEGS.map(([n]) => ({ ...toCaller(R.legs[n].P, o), planted: R.legs[n].planted })); },
    udderAt(st = {}, o = {}) { const R = rigFromState(st), M = R.Mb; const c = M([-96, -150]); return { ...toCaller(c, o), teats: [-30, -10, 14, 32].map((x) => toCaller(M([-96 + x, -150 + 40]), o)) }; },
    noseAt(poseFn, t, o = {}) { const R = rigAt(poseFn, t, o).R; return toCaller(R.Hx.at([MUZ.c[0] + MUZ.r[0], 0, MUZ.c[2]]), o); },
    mouthAt(poseFn, t, o = {}) { const R = rigAt(poseFn, t, o).R; return toCaller(R.Hx.at([MUZ.c[0] + 8, 0, MUZ.c[2] + MUZ.r[2]]), o); },
    headAt(poseFn, t, o = {}) { const R = rigAt(poseFn, t, o).R; return toCaller(R.Hc, o); },
    shadow(g, st = {}) { const lie = ease(st.lie || 0); g.save(); g.globalAlpha *= 0.55; pool(g, 0, 4, 280 + 30 * lie, 26, '#2a1e12', 0.45); g.restore(); },
  };
}
