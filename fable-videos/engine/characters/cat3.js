// cat3: the big fluffy farmhouse cat (makeCat's look: ginger with soft stripes, cream chest and muzzle, pink ears,
// button eyes, rosy cheeks) built as a RIG of painted parts with crow3's architecture. Gentle and sleepy, never
// scary: the eyes are soft half-open button eyes (wide and round only when playful), the mouth always smiles.
//
// FACING (same convention as crow3 / mice3): drawn facing LEFT, paws on the ground at y = 0, local units (standing,
// the top of the head is about 400 units up, the body about 560 long: three mice high at the same scale). Mirror with
// scale(-1, 1) to face right; walking moves the root LEFT. There is no turn-round view: mirror it off-screen.
//
//   const cat = makeCatRig(res, seed)
//   cat.draw(g, st) / cat.drawAt(g, poseFn, t, { since })   follow-through as crow3 (head leads, body, legs that
//                                    are not planted, ears and the long tail chain trail; planted paws never lag)
//   cat.STRIDE                       travel per walk cycle; walk = distance / STRIDE, root moves left by the distance
//   cat.pawsAt(poseFn, t, o) / cat.paws(st, o)   -> [hindFar, foreFar, hindNear, foreNear] {x, y, planted}
//   cat.mouthAt / cat.headAt / cat.neckAt(poseFn, t, o)   -> {x, y} (the neck: where a bell on a ribbon would hang)
//        o = { x, y, scale, face } gives page coordinates through your transform translate(x, y) scale(face*scale, scale)
//   cat.shadow(g, st, height)
//   helpers: STRIDE, pounceX(u) (horizontal share of a pounce), walkRest(p)
//
// ---- state (ease everything; weights 0..1; PHASES 0 -> 1 once, <= 0 or >= 1 = not happening)
//   t, life (idle: breathing, slow blinks, ear twitches, glances, tail curling and swaying)
//   eye 0..1 (default 0.86: soft and friendly), happy 0..1 (content closed-eye smile), eyeBig 0..1 (round playful eyes)
//   mouth 0..1, smile (default 0.6), headTilt rad (+ nose up), headTurn -1..1 (glance toward / away from us)
//   earTwitch: automatic; earsBack 0..1;  tailLift rad, tailCurl -1..1
//   walk (cycles) + walkAmt 0..1;  creep 0..1 (low, slow, soft as a shadow: use with walk)
//   sit 0..1      sit up (haunches down, front legs straight, tail wrapped round the paws)
//   sleep 0..1    curl up asleep (loaf -> round curl, head on the paws, tail round the nose, slow purring breaths)
//   purr 0..1     a soft purr (on by itself when asleep)
//   blink 0..1    phase of one slow, loving cat blink
//   yawn 0..1     phase of a big yawn
//   stretch 0..1  phase of a stretch: front paws walk forward into a bow (rear up, tail up), then back
//   pounce 0..1   phase of a playful pounce: 0-0.4 crouch with a bottom wiggle (eyes round, tail twitching), 0.42
//                 spring, arc (pounceHeight, default 110), front paws land first at 0.72, soft squash, a pleased
//                 sit-back by 1. Move the root horizontally by pounceX(u) * distance.
import { wash, pool, ellipse, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, furEdge, rgba, shade, tint, clamp, lerp, ease,
  penLine, hatch, looseWash, blooms, soften, path, canvas } from '../watercolor.js';
import { buttonEye, PAPER, INK } from './kit.js';
import { TAU, fr, easeInOut, bell, key, glance, event, kernel, makeFilter, ik2, smileMouth, rot, add, on, bendStrips } from './rig3.js';

const COL = '#e09a52', DARK = '#b8703a', CREAM = '#f8e6c8', PINK = '#e8a8a0';
// ---- geometry (internal: facing RIGHT, ground y = 0)
const BODY = smooth([[-215, -170], [-200, -232], [-140, -268], [-40, -280], [70, -276], [160, -256], [215, -214], [222, -168], [196, -128], [120, -112], [20, -110], [-90, -112], [-180, -124]]);
const RUFF = smooth([[-34, -50], [0, -62], [36, -44], [46, -6], [36, 34], [10, 58], [-14, 50], [-34, 24], [-44, -12]]);
// the head is ONE 3/4 view built on a sphere: every feature is a point on it seen at the same yaw
const HR = 72, HSX = 1.1, YAW0 = 0.5;
const HEAD = (() => { const pts = []; for (let i = 0; i < 36; i++) { const t = i / 36 * Math.PI * 2, c = Math.cos(t), sn = Math.sin(t);
  const tuft = sn > 0 ? 0.09 * Math.max(0, Math.sin(t * 2)) ** 2 + 0.09 * Math.max(0, -Math.sin(t * 2)) ** 2 : 0; // soft cheek ruffs low on each side
  pts.push([c * HR * HSX * (1 + tuft * 1.2), sn * HR * (sn > 0 ? 1.03 : 0.95) + tuft * 16]); } return smooth(pts, true, 3); })();
// a point on the head: azimuth a (0 = middle of the face, + = toward the side it looks to), elevation e (+ = down), radius r
function hp(a, e, r, yaw) { const az = yaw + a; return { x: HSX * HR * r * Math.sin(az) * Math.cos(e), y: HR * r * Math.sin(e), z: HR * r * Math.cos(az) * Math.cos(e) }; }
const EAR = smooth([[-26, 10], [-18, -28], [-4, -52], [10, -30], [24, 8], [0, 14]]);
const EAR_IN = smooth([[-15, 4], [-10, -24], [-4, -38], [4, -22], [12, 2], [0, 6]]);
const UPPER = (w0, w1, L) => smooth([[-w0, -8], [0, -w0 * 0.9 - 6], [w0, -8], [w1 * 1.05, L * 0.55], [w1, L], [0, L + w1 * 0.6], [-w1, L], [-w1 * 1.05, L * 0.55]]);
const LOWER = (w0, w1, L) => smooth([[-w0, 0], [0, -w0 * 0.8], [w0, 0], [w1, L * 0.7], [w1 * 0.9, L], [-w1 * 0.9, L], [-w1, L * 0.7]]);
const PAW = smooth([[-26, -16], [0, -24], [26, -18], [36, -4], [30, 2], [-28, 2], [-34, -6]]);
const TAIL_L = 270, TAIL_N = 18;
const TAILS = (() => { const pts = []; for (let i = 0; i <= 20; i++) { const x = i / 20 * TAIL_L, w = lerp(25, 19, i / 20); pts.push([x, -w]); } const tip = [[TAIL_L + 14, -10], [TAIL_L + 18, 0], [TAIL_L + 14, 10]]; const lo = []; for (let i = 20; i >= 0; i--) { const x = i / 20 * TAIL_L, w = lerp(25, 19, i / 20); lo.push([x, w]); } return smooth(pts.concat(tip, lo, [[-10, 20], [-14, 0], [-10, -20]]), true, 3); })();
const BCN = [0, -190];                 // body pivot
const NECK = [170, -222], HV0 = [62, -70]; // neck on the body, head centre from the neck
const TAIL_ROOT = [-200, -200];
const LEGS = [ // [name, root (body-local), paw rest x (root space), hind?, near?, phase offset]
  ['hindFar', [-118, -170], -108, true, false, 0.5], ['foreFar', [138, -175], 138, false, false, 0.75],
  ['hindNear', [-132, -160], -128, true, true, 0], ['foreNear', [120, -165], 120, false, true, 0.25]];
// hind leg: thigh (hip -> knee, knee FORWARD), shin (knee -> hock, the hock points BACK), foot (hock -> paw: digitigrade)
const UP_L = { hind: 76, fore: 92 }, LO_L = { hind: 80, fore: 96 }, FOOT_L = 62;

export const STRIDE = 120;
const BETA = 0.8, LIFT = 24;
export const walkRest = (p) => Math.ceil(p * 2 - 1e-6) / 2;
export const pounceX = (u) => clamp((u - 0.42) / 0.28); // done when the front paws land (0.7)
function walkPaw(q) { // stance q in [-0.02, 0.78]
  q = fr(q + 0.02) - 0.02;
  if (q < 0.78) return [-STRIDE * (q - 0.38), 0, 0];
  const u = (q - 0.78) / 0.22, s = Math.sin(Math.PI * u);
  return [-STRIDE * 0.4 + STRIDE * 0.8 * easeInOut(u), LIFT * s ** 0.8, 0.4 * s];
}

function furry(res, shape, col, sd, o = {}) {
  return sprite(bbox(shape.concat(o.extra || [])), res, (g) => {
    wash(g, shape, { color: PAPER, opacity: 1, under: PAPER, seed: sd, edge: 0 });
    looseWash(g, shape, col, { opacity: 0.88, seed: sd + 1, shift: 3, reserves: o.reserves ?? 2 });
    blooms(g, shape, o.blooms || ['#e8a860', '#d08840', '#eaa868'], { n: 6, seed: sd + 2, alpha: 0.28 });
    if (o.paint) o.paint(g);
    shadeEdge(g, shape, { color: o.shadow || '#8a4a22', alpha: o.shadeA ?? 0.3, width: o.shadeW || 30, dx: o.sdx || 0, dy: o.sdy ?? -12 });
    soften(g, 1.0 * res);
    if (o.hatch) hatch(g, shape, { color: '#9a5a2a', count: o.hatch, len: o.hlen || 10, width: 0.8, alpha: 0.4, seed: sd + 3, dir: o.dir || (() => Math.PI) });
    if (o.fur) { furEdge(g, shape, { color: col, count: o.fur, len: o.furLen || 12, width: 2.2, alpha: 0.85, seed: sd + 4, skip: o.furSkip });
      furEdge(g, shape, { color: shade(col, 0.2), count: Math.round(o.fur * 0.4), len: (o.furLen || 12) * 0.8, width: 1.2, alpha: 0.6, seed: sd + 7, skip: o.furSkip }); }
    if (o.pen !== false) penLine(g, o.penPts || shape, { closed: !o.penPts, color: INK, w: o.pw || 2.2, alpha: 0.75, seed: sd + 5, weight: (t) => 0.25 + 0.85 * Math.max(0, Math.sin(t * Math.PI * 2 + (o.phase || 0))) });
    if (o.last) o.last(g);
  }, { seed: sd + 6, grain: 0.12 });
}
const stripes = (g, shape, sp = 46, w = 11, a = 0.38, ang = 0.35) => {
  g.save(); path(g, shape); g.clip(); const b = bbox(shape);
  for (let x = b.x0 - b.h; x < b.x1; x += sp) penLine(g, [[x, b.y0], [x + Math.sin(ang) * b.h * 0.5 + 10, b.y0 + b.h * 0.45], [x + Math.sin(ang) * b.h * 0.3, b.y1 - b.h * 0.25]], { color: DARK, w, alpha: a, weight: (t) => 0.2 + Math.sin(Math.PI * t) });
  g.restore();
};

// the cat's mouth: a little 'w' under the philtrum that opens into ONE filled shape (no ring, no separate pieces)
function catMouth(g, nx, ny, x, y, w, m, sm, deep = 12) {
  const top = []; for (let k = 0; k <= 16; k++) { const u = k / 16; top.push([x - w / 2 + u * w, y + 3.2 * Math.sin(Math.PI * fr(u * 2)) * (u === 0.5 ? 0 : 1) - sm * 4 * (Math.abs(u - 0.5) * 2) ** 2]); }
  const d = deep * clamp(m);
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = rgba(INK, 0.75); g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(nx, ny); g.lineTo(x, y); g.stroke(); // philtrum: nose to the middle of the mouth
  const outline = () => { g.beginPath(); g.moveTo(...top[0]); for (const p of top) g.lineTo(...p); g.quadraticCurveTo(x, y + d * 1.7, top[0][0], top[0][1]); g.closePath(); };
  if (d > 0.3) {
    outline(); g.fillStyle = '#5c2622'; g.fill(); g.save(); g.clip(); g.fillStyle = '#d8857c'; g.beginPath(); g.ellipse(x, y + d * 1.05, w * 0.28, d * 0.45, 0, 0, 7); g.fill(); g.restore();
    outline(); g.stroke();
  } else { g.beginPath(); g.moveTo(...top[0]); for (const p of top) g.lineTo(...p); g.stroke(); }
  g.restore();
}

// ---- pose solver
const DEF = { life: 1, eye: 0.86, smile: 0.6, pounceHeight: 110 };
const PHASES = new Set(['walk', 'blink', 'yawn', 'stretch', 'pounce']);
const filtered = makeFilter(PHASES, DEF);
function solve(st, dl = 0) {
  const t = (st.t || 0) - dl, v = (k) => st[k] ?? DEF[k] ?? 0;
  const P = { bx: 0, by: 0, pitch: 0, sx: 1, sy: 1, nvx: 0, nvy: 0, ha: v('headTilt'), hturn: v('headTurn'),
    eye: v('eye'), happy: v('happy'), big: v('eyeBig'), mouth: v('mouth'), smile: v('smile'), mdeep: 12,
    earBack: v('earsBack'), twN: 0, twF: 0, tLift: v('tailLift'), tCurl: v('tailCurl'), tSway: 0, tWrap: 0, tTwitch: 0, rdy: 0, air: 0, breath: 0,
    paw: { fore: [0, 0], hind: [0, 0], foreLift: 0, hindLift: 0 }, hk: 0, sit: 0, sleep: 0, creep: 0 };
  const sit = clamp(v('sit')), sleep = clamp(v('sleep')), creep = clamp(v('creep')), wa = clamp(v('walkAmt'));
  const blink = v('blink'), yawn = v('yawn'), stretch = v('stretch'), pounce = v('pounce'), purr = Math.max(clamp(v('purr')), sleep);
  const busy = clamp(Math.max(wa * 0.7, on(yawn), on(stretch), on(pounce), sleep, creep));
  const life = clamp(v('life')) * (1 - busy);
  // idle: breathing, glances, a slow blink now and then, ear twitches, tail curling and swaying
  const g1 = glance(t, 3.1, 4, 0.7), g2 = glance(t + 1.1, 4.3, 8, 0.9);
  P.ha += life * 0.05 * g1; P.hturn += life * 0.25 * g2; P.nvx += life * 3 * g1;
  const bl = event(t, 5.2, 0.55, 12);
  if (!st.noBlink && bl >= 0) P.eye *= 1 - Math.sin(Math.PI * bl) ** 1.5;
  const tN = event(t + 2, 6.1, 0.35, 5), tF = event(t + 4.4, 7.9, 0.35, 9);
  if (tN >= 0) P.twN += Math.sin(Math.PI * tN) * Math.sin(tN * TAU * 2) * 0.3;
  if (tF >= 0) P.twF += Math.sin(Math.PI * tF) * Math.sin(tF * TAU * 2) * 0.3;
  P.tCurl += 0.35 * Math.sin(t * TAU * 0.12) + 0.15 * Math.sin(t * TAU * 0.23 + 1);
  P.tSway += Math.sin(t * TAU * 0.17);
  P.tLift += 0.06 * Math.sin(t * TAU * 0.09 + 2);
  // slow loving blink
  if (blink > 0 && blink < 1) { P.eye *= 1 - key(blink, [[0, 0], [0.35, 1], [0.65, 1], [1, 0]]); P.ha += 0.06 * bell(blink, 0, 1); P.smile = lerp(P.smile, 0.85, bell(blink, 0, 1)); }
  // walking / creeping
  if (wa > 0) {
    const ph = v('walk');
    P.by -= wa * 4 * Math.cos(ph * 2 * TAU) * (1 - 0.6 * creep);
    P.pitch += wa * 0.015 * Math.sin(ph * TAU);
    P.ha -= wa * 0.03; P.nvy += wa * 3 * Math.cos(ph * 2 * TAU + 0.6);
    P.tSway += wa * 0.6 * Math.sin(ph * TAU); P.tLift -= wa * 0.1;
  }
  if (creep > 0) { P.by += creep * 46; P.nvy += creep * 46; P.nvx += creep * 22; P.ha -= creep * 0.05; P.tLift -= creep * 0.35; P.tCurl -= creep * 0.4; P.earBack += creep * 0.1; P.creep = creep; P.hk += creep * 0.8; P.eye = lerp(P.eye, 0.8, creep); P.big += creep * 0.2; }
  // sit up
  if (sit > 0) { const k = ease(sit); P.sit = k; P.pitch -= k * 0.78; P.sx *= 1 - 0.2 * k; P.bx -= k * 62; P.by += k * 20; P.nvx -= k * 40; P.nvy += k * 18; P.ha += k * 0.06; P.tWrap = Math.max(P.tWrap, k * 0.8); }
  // stretch (phase): a play bow
  if (stretch > 0 && stretch < 1) {
    const u = stretch, b = key(u, [[0, 0], [0.25, 1], [0.6, 1], [0.85, 0]]);
    P.pitch += b * 0.3; P.by += b * 40; P.bx -= b * 30; P.nvy += b * 60; P.nvx += b * 20; P.ha += b * 0.15;
    P.paw.fore = [70 * key(u, [[0.05, 0], [0.22, 1], [0.66, 1], [0.84, 0]]), 0]; P.paw.foreLift = bell(u, 0.05, 0.22) + bell(u, 0.66, 0.84);
    P.tLift += b * 0.9; P.tCurl += b * 0.6; P.eye *= 1 - 0.7 * b; P.happy = Math.max(P.happy, b * 0.6);
    P.mouth = Math.max(P.mouth, 0.55 * bell(u, 0.3, 0.55)); P.mdeep = 15;
  }
  // yawn (phase)
  if (yawn > 0 && yawn < 1) {
    const u = yawn;
    P.mouth = Math.max(P.mouth, key(u, [[0, 0], [0.18, 0.15], [0.35, 1], [0.62, 1], [0.78, 0.05], [0.86, 0.2], [0.94, 0]])); P.mdeep = 18;
    P.ha += key(u, [[0, 0], [0.2, -0.05], [0.38, 0.32], [0.62, 0.35], [0.85, 0], [1, 0]]);
    P.eye *= 1 - key(u, [[0.15, 0], [0.32, 1], [0.66, 1], [0.85, 0.4], [1, 0]]);
    P.earBack += key(u, [[0.2, 0], [0.36, 0.8], [0.64, 0.8], [0.84, 0]]);
    P.nvy -= 8 * bell(u, 0.2, 0.8); P.tCurl += 0.6 * bell(u, 0.2, 0.9);
  }
  // pounce (phase): playful
  if (pounce > 0 && pounce < 1) {
    const u = pounce, H = v('pounceHeight');
    const crouch = key(u, [[0, 0], [0.16, 1], [0.4, 1], [0.44, 0], [0.7, 0], [0.76, 0.45], [0.9, 0.1], [1, 0]]);
    const wig = bell(u, 0.18, 0.4) * Math.sin(u * 60);
    P.hk += crouch * 0.9;
    P.by += crouch * 50; P.pitch += crouch * 0.12 + wig * 0.04; P.bx -= crouch * 12;
    P.nvy += crouch * 40; P.nvx += crouch * 26 + key(u, [[0.4, 0], [0.5, 20], [0.7, 0]]); P.ha -= crouch * 0.05;
    P.big += key(u, [[0, 0], [0.12, 1], [0.7, 1], [0.86, 0]]); P.happy = Math.max(P.happy, key(u, [[0.76, 0], [0.86, 1], [1, 0]]));
    P.smile = lerp(P.smile, 1, bell(u, 0, 1)); P.earBack -= 0.25 * bell(u, 0.05, 0.42);
    P.tTwitch += bell(u, 0.12, 0.42); P.tLift += key(u, [[0, 0], [0.4, 0.1], [0.5, 0.4], [0.7, 0.1], [1, 0]]);
    P.bx += wig * 6;
    if (u > 0.42 && u < 0.72) { const s = (u - 0.42) / 0.3; P.rdy -= H * 4 * s * (1 - s); P.pitch += key(u, [[0.42, -0.2], [0.55, 0], [0.7, 0.18]]); }
    P.air = key(u, [[0.4, 0], [0.46, 1], [0.66, 1], [0.72, 0]]);
    P.airFore = key(u, [[0.4, 0], [0.46, 1], [0.6, 1], [0.7, 0]]);
    P.sq = key(u, [[0.7, 0], [0.76, 0.12], [0.88, -0.02], [1, 0]]) + key(u, [[0.4, 0], [0.48, -0.1], [0.58, 0]]);
    P.sit = Math.max(P.sit, 0.0);
  }
  P.sx *= 1 + (P.sq || 0) * 0.15; P.sy *= 1 - (P.sq || 0) * 0.25;
  // asleep: round curl, head on the paws, tail round the nose
  if (sleep > 0) {
    const k = key(sleep, [[0, 0], [0.75, 1]]);
    P.sleep = k; P.by = lerp(P.by, 92, k); P.pitch = lerp(P.pitch, 0.06, k); P.bx = lerp(P.bx, -10, k); P.sx *= 1 - 0.14 * k; P.sy *= 1 + 0.05 * k;
    P.nvx = lerp(P.nvx, -36, k); P.nvy = lerp(P.nvy, 118, k); P.ha = lerp(P.ha, -0.16, k); P.hturn *= 1 - k;
    P.eye *= 1 - key(sleep, [[0, 0], [0.45, 1]]); P.happy = lerp(P.happy, 0.0, k); P.big *= 1 - sleep; P.mouth *= 1 - k; P.smile = lerp(P.smile, 0.75, k);
    P.tWrap = Math.max(P.tWrap, k); P.tCurl *= 1 - k; P.tSway *= 1 - 0.8 * k; P.earBack = lerp(P.earBack, 0.25, k);
  }
  // breathing (slow, deeper asleep) and purring
  const br = Math.sin(t * TAU * lerp(0.26, 0.17, P.sleep));
  P.breath = br * (1 + 1.2 * P.sleep);
  P.purr = purr * 0.5 * Math.sin(t * TAU * 6.5);
  P.sy *= 1 + 0.012 * P.breath; P.sx *= 1 + 0.004 * P.breath;
  P.H = null;
  return P;
}
function bodyMat(P) {
  const c = Math.cos(P.pitch), s = Math.sin(P.pitch);
  return (p) => { const x = (p[0] - BCN[0]) * P.sx, y = (p[1] - BCN[1]) * P.sy; return [BCN[0] + P.bx + x * c - y * s, BCN[1] + P.by + P.purr * 0.3 + x * s + y * c]; };
}

const K = { head: kernel(2.6, 0.62, 0.55, 9), body: kernel(1.9, 0.55, 0.8, 11), leg: kernel(2.2, 0.6, 0.6, 9), ear: kernel(2.2, 0.32, 0.9, 11), tail: kernel(1.3, 0.4, 1.2, 9) };
const LAG = { head: 0, body: 0.06, leg: 0.04, ear: 0.12, tail: 0.15 };
const TAIL_DELAYS = [0, 0.1, 0.2, 0.32, 0.45, 0.6];

export function makeCatRig(res = 1, seed = 61) {
  const s = (n) => seed * 100 + n;
  const darker = (sp, k = 0.78) => { const c = canvas(sp.c.width, sp.c.height), g = c.getContext('2d'); g.filter = `brightness(${k})`; g.drawImage(sp.c, 0, 0); return { ...sp, c }; };
  const body = furry(res, BODY, COL, s(1), { fur: 170, furLen: 16, hatch: 160, shadeW: 46, sdy: -18, paint: (g) => {
    stripes(g, BODY, 52, 16, 0.32); glaze(g, BODY, 60, -120, 130, 26, CREAM, 0.85); glaze(g, BODY, -60, -255, 120, 20, '#f0b070', 0.35); } });
  const ruff = furry(res, RUFF, CREAM, s(10), { fur: 70, furLen: 14, blooms: ['#fff2dc', '#f0dcc0'], shadow: '#b89070', shadeA: 0.25, shadeW: 18, sdx: -6, sdy: 0, pen: false });
  // the skull: round and symmetric (it looks the same at every yaw); stripes, muzzle and face are drawn on it per frame
  const head = furry(res, HEAD, COL, s(20), { fur: 170, furLen: 15, hatch: 50, shadeW: 26, sdy: -12, reserves: 1,
    penPts: HEAD.filter(([, y]) => y < 18).sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0])), // ink only round the top: no line across the throat
    paint: (g) => { glaze(g, HEAD, 0, -30, 60, 26, '#f0b878', 0.45); glaze(g, HEAD, 0, HR * 0.82, HR * 0.4, 16, CREAM, 0.7); } });
  // soft fur that blends the head into the neck and chest: a ginger nape tuft behind and soft fur at the throat
  const NAPE = smooth([[-46, -30], [10, -40], [46, -10], [40, 30], [-10, 40], [-50, 12]]);
  const nape = furry(res, NAPE, COL, s(26), { fur: 90, furLen: 14, shadeW: 20, sdy: -8, pen: false });

  const ear = furry(res, EAR, COL, s(30), { fur: 16, furLen: 8, shadeW: 10, paint: (g) => { wash(g, EAR_IN, { color: PINK, opacity: 0.85, seed: s(31) }); glaze(g, EAR_IN, 0, -14, 6, 12, '#ffe0da', 0.6); } });
  const mkLeg = (hind, sd) => ({
    up: furry(res, UPPER(hind ? 52 : 34, hind ? 26 : 24, hind ? UP_L.hind : UP_L.fore), COL, s(sd), { fur: 80, furLen: 13, hatch: 30, shadeW: 22, sdx: 6, sdy: 0, pen: false, paint: (g) => stripes(g, UPPER(hind ? 50 : 34, hind ? 28 : 24, 100), 36, 9, 0.3, 1.4) }),
    ft: hind ? furry(res, LOWER(15, 12, FOOT_L), COL, s(sd + 20), { fur: 20, furLen: 7, hatch: 8, shadeW: 10, sdx: 4, sdy: 0, paint: (g) => glaze(g, LOWER(15, 12, FOOT_L), 0, FOOT_L, 16, 16, CREAM, 0.7) }) : null,
    lo: furry(res, LOWER(hind ? 20 : 22, hind ? 15 : 20, hind ? LO_L.hind : LO_L.fore), COL, s(sd + 10), { fur: 30, furLen: 9, hatch: 14, shadeW: 14, sdx: 5, sdy: 0, paint: (g) => { stripes(g, LOWER(22, 20, 96), 30, 7, 0.28, 1.5); glaze(g, LOWER(22, 20, 96), 0, 90, 24, 20, CREAM, 0.7); } }),
  });
  const legH = mkLeg(true, 40), legF = mkLeg(false, 60);
  const paw = furry(res, PAW, CREAM, s(80), { fur: 26, furLen: 6, blooms: ['#fff2dc'], shadow: '#b89070', shadeA: 0.25, shadeW: 10, sdy: -4, last: (g) => { for (const x of [4, 16]) penLine(g, [[x, -4], [x + 2, 2]], { w: 1.2, alpha: 0.5 }); } });
  const LEGSPR = { hindNear: legH, foreNear: legF, hindFar: { up: darker(legH.up), lo: darker(legH.lo), ft: darker(legH.ft) }, foreFar: { up: darker(legF.up), lo: darker(legF.lo) } };
  const pawFar = darker(paw, 0.85);
  const tail = furry(res, TAILS, COL, s(90), { fur: 120, furLen: 14, hatch: 50, shadeW: 22, sdy: -8, dir: () => 0, paint: (g) => {
    g.save(); path(g, TAILS); g.clip(); for (let x = 30; x < TAIL_L; x += 42) penLine(g, [[x, -30], [x - 6, 0], [x, 30]], { color: DARK, w: 12, alpha: 0.4 }); g.restore();
    glaze(g, TAILS, TAIL_L + 4, 0, 30, 24, CREAM, 0.8); } });

  // ---- legs: hip / shoulder from the body; paws planted from the walk (raw, never delayed) or tucked in the air
  function legsSolve(raw, pb, pl) {
    const Mb = bodyMat(pb), out = {};
    for (const [name, root, px, hind, near, off] of LEGS) {
      const R = Mb(root);
      let [dx, lift, pitch] = walkPaw((raw.walkPhase || 0) + off);
      let x = px + dx + (near ? 0 : 0), y = -lift;
      // sitting: hind paws step forward under the haunch, front paws in under the chest
      const sk = raw.sit;
      if (sk > 0) { const tx = hind ? px + 60 : px - 46; const u = clamp(sk * 1.2 - (hind ? 0 : 0.2)); x = lerp(x, tx, ease(u)); y -= 16 * Math.sin(Math.PI * u); }
      // stretch: the front paws walk forward
      if (!hind && raw.paw.fore[0]) { x += raw.paw.fore[0]; y -= 18 * raw.paw.foreLift; }
      // asleep: tucked under
      if (raw.sleep > 0) { const tx = hind ? -60 : 70 + (near ? 26 : 0); x = lerp(x, tx, raw.sleep); y = lerp(y, near && !hind ? -6 : 0, raw.sleep); }
      // in the air (pounce): front legs reach forward, hind legs trail
      const air = hind ? raw.air : (raw.airFore ?? raw.air);
      if (air > 0) { const tk = hind ? [R[0] - 60, R[1] + 120] : [R[0] + 90, R[1] + 110]; x = lerp(x, tk[0], air); y = lerp(y, tk[1] + raw.rdy, air); }
      // the hind foot's angle from the vertical (+ = hock behind the paw): standing a little back, lower when crouching,
      // flat on the ground sitting / asleep, toes trailing (hock ahead of the paw) while the paw swings, trailing in the air
      let fa = 0.5 + 0.55 * clamp(raw.hk) - 1.0 * (lift / LIFT);
      if (sk > 0) fa = lerp(fa, 1.5, ease(sk));
      if (raw.sleep > 0) fa = lerp(fa, 1.45, raw.sleep);
      if (air > 0) fa = lerp(fa, -0.5, air);
      out[name] = { R: [R[0], R[1] + raw.rdy], P: [x, y], hind, near, fa, planted: air <= 0 && Math.abs(y) < 0.01 };
    }
    return out;
  }
  function tailShape(P) {
    const angs = [], base = Math.PI + 0.55 + P.pitch * 0.9 + P.tLift;
    for (let i = 0; i < TAIL_N; i++) {
      const f = (i + 1) / TAIL_N;
      // standing: down and back, then curling up (a question mark)
      let a = base - 1.1 * ease(f / 0.4) + (1.6 + 0.6 * P.tCurl) * ease((f - 0.35) / 0.65) + P.tSway * 0.12 * Math.sin(f * 3) + P.tTwitch * 0.25 * Math.sin(f * 6 - (P.tt || 0) * 14);
      // wrapped round (sitting / asleep): down to the floor then forward round the paws
      a = lerp(a, lerp(Math.PI * 0.62 + P.pitch * 0.4, -0.12 - 0.1 * f, ease(f / 0.7)), ease(P.tWrap));
      angs.push(a);
    }
    return angs;
  }
  function tailSolve(tails, pb, rd) {
    const shapes = tails.map((x) => tailShape(x.P)), M = bodyMat(pb), r0 = M(TAIL_ROOT), ds = TAIL_L / TAIL_N;
    const pts = [[r0[0], r0[1] + rd]];
    let p = pts[0];
    for (let i = 0; i < TAIL_N; i++) {
      const f = i / (TAIL_N - 1), tau = f * (tails.length - 1), j = Math.min(tails.length - 2, Math.floor(tau)), k = tau - j;
      const a = lerp(shapes[j][i], shapes[j + 1][i], k);
      p = [p[0] + Math.cos(a) * ds, Math.min(p[1] + Math.sin(a) * ds, -22)];
      pts.push(p);
    }
    return { pts, wrap: tails[0].P.tWrap };
  }
  function rig(raw, ph, pb, pl, pe, tails) {
    const Mb = bodyMat(pb), N = Mb(NECK);
    const H = add(add(N, rot([HV0[0] + ph.nvx, HV0[1] + ph.nvy], pb.pitch * 0.5)), [0, raw.rdy]);
    return { raw, pb, Mb, rd: raw.rdy, legs: legsSolve(raw, pb, pl), head: { H, P: ph, ha: ph.ha - pb.pitch * 0.25, ears: pe }, N: [N[0], N[1] + raw.rdy], tail: tailSolve(tails, pb, raw.rdy) };
  }
  function fill(raw, st) { raw.walkPhase = st.walk || 0; raw.tt = st.t || 0; return raw; }
  function rigFromState(st) { const p = fill(solve(st, 0), st); return rig(p, p, p, p, p, TAIL_DELAYS.map(() => ({ P: p }))); }
  function rigAt(poseFn, t, o = {}) {
    const since = o.since ?? -1e9, cache = new Map();
    const cur = poseFn(t); cache.set(Math.round(t * 960) / 960, cur);
    const raw = fill(solve(cur, 0), cur);
    const one = (k, dt = 0) => { const p = solve({ ...cur, ...filtered(poseFn, t - dt, K[k], since, cache), t: t - dt }, LAG[k]); p.tt = t - dt - LAG[k]; return p; };
    const ph = one('head'), pb = one('body'), pl = one('leg'), pe = one('ear');
    return { R: rig(raw, ph, pb, pl, pe, TAIL_DELAYS.map((d) => ({ P: one('tail', d) }))), st: cur };
  }

  // ---- painting (internal: facing right)
  function drawLeg(g, L, spr, far) {
    const bone = (sp, A, B, len) => { const d = Math.hypot(B[0] - A[0], B[1] - A[1]); g.save(); g.translate(A[0], A[1]); g.rotate(Math.atan2(B[1] - A[1], B[0] - A[0]) - Math.PI / 2); g.scale(1, Math.max(0.6, d / len)); drawSprite(g, sp); g.restore(); };
    if (L.hind) { // three segments: the foot from the paw up to the hock, then hip -> knee (forward) -> hock
      const toe = [L.P[0] + 8, L.P[1] - 10];
      const hock = [toe[0] - FOOT_L * Math.sin(L.fa), toe[1] - FOOT_L * Math.cos(L.fa)];
      const { E, T } = ik2(L.R, hock, UP_L.hind, LO_L.hind, [1, 0.25], 1.2);
      bone(spr.ft, T, toe, FOOT_L);
      bone(spr.lo, E, T, LO_L.hind);
      bone(spr.up, L.R, E, UP_L.hind);
      g.save(); g.translate(toe[0] - 6, L.P[1]); drawSprite(g, far ? pawFar : paw); g.restore();
      return;
    }
    // front leg: elbow BACK, the wrist just behind the paw
    const a = UP_L.fore * 0.95, b = LO_L.fore;
    const { E, T } = ik2(L.R, [L.P[0] - 5, L.P[1] - 14], a, b, [-1, 0.1], 1.25);
    bone(spr.lo, E, T, b);
    bone(spr.up, L.R, E, a);
    g.save(); g.translate(T[0] + 5, L.P[1]); drawSprite(g, far ? pawFar : paw); g.restore();
  }
  function drawHead(g, R) {
    const h = R.head, P = h.P, e = h.ears;
    const yaw = YAW0 + 0.3 * clamp(P.hturn, -1, 1); // glances stay inside the 3/4 family
    const H = (a, el, r = 1) => hp(a, el, r, yaw);
    g.save(); g.translate(h.H[0], h.H[1]); g.rotate(-h.ha);
    // ears: both triangles above the skull (their bases hidden behind it), placed by projecting base and tip
    const eb = clamp(P.earBack || 0);
    const earAt = (side, tw, sp) => {
      const a0 = side * 0.92, B = H(a0, -0.74, 0.9), L0 = H(a0 - 0.38, -0.66, 0.95), R0 = H(a0 + 0.38, -0.66, 0.95);
      const T = H(a0 + side * (0.12 + 0.2 * eb) + tw, -1.2 + 0.28 * eb, 1.4 - 0.14 * eb);
      const w = Math.hypot(R0.x - L0.x, R0.y - L0.y), len = Math.hypot(T.x - B.x, T.y - B.y);
      g.save(); g.translate(B.x, B.y); g.rotate(Math.atan2(T.y - B.y, T.x - B.x) + Math.PI / 2);
      g.scale(Math.max(0.62, w / 40), len / 62); g.translate(0, -8); drawSprite(g, sp); g.restore();
    };
    earAt(+1, e.twF, ear); earAt(-1, e.twN, ear);
    { const n = H(-0.9, 0.55, 0.9); g.save(); g.translate(n.x, n.y + 10); drawSprite(g, nape); g.restore(); }
    { const c = H(0.05, 0.9, 0.9); g.save(); g.translate(c.x, c.y + 6); g.scale(0.72, 0.5); drawSprite(g, nape); g.restore(); } // soft throat fur, tucked behind the head's lower edge
    drawSprite(g, head);

    // everything below lies on the skull: clip to it
    g.save(); g.beginPath(); for (const [x, y] of HEAD) g.lineTo(x, y); g.closePath(); g.clip();
    const lineOn = (pts, col, w, alpha) => { // a stroke along sphere points, only where they face us
      const q = pts.map(([a, el, r]) => H(a, el, r ?? 1));
      let run = []; const flush = () => { if (run.length > 1) penLine(g, run, { color: col, w, alpha, seed: 7, weight: (t) => 0.25 + Math.sin(Math.PI * t) }); run = []; };
      for (const p of q) { if (p.z > 4) run.push([p.x, p.y]); else flush(); } flush();
    };
    // tabby: an M on the forehead, lines back over the crown, stripes on the cheeks following the form
    for (const a of [-0.2, 0, 0.2]) lineOn([[a * 1.05, -0.46], [a * 1.12, -0.66], [a * 1.25, -0.9]], DARK, a ? 8 : 9, 0.24);
    for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) lineOn([[sd * 1.0, 0.04 + k * 0.2], [sd * 1.22, 0.07 + k * 0.2], [sd * 1.45, 0.12 + k * 0.19]], DARK, 6, 0.2);
    // cream chin and muzzle (whisker pads), soft rosy cheeks under the eyes
    const chin = H(0, 0.78, 1); pool(g, chin.x, chin.y, 26, 14, CREAM, 0.8);
    const lowF = H(0, 0.42, 1.02); pool(g, lowF.x, lowF.y, 44, 30, CREAM, 0.75);
    for (const sd of [-1, 1]) { const p = H(sd * 0.25, 0.42, 1.09), k = clamp(p.z / (HR * 1.09), 0.45, 1);
      g.save(); g.translate(p.x, p.y); g.scale(k, 1); pool(g, 0, 2, 26, 20, '#fbf0dc', 0.9); g.fillStyle = rgba('#fcf3e2', 0.97); g.beginPath(); g.ellipse(0, 0, 21, 17, 0, 0, 7); g.fill();
      g.fillStyle = rgba(INK, 0.32); for (const [dx, dy] of [[-6, -3], [1, -5], [7, -2], [-3, 3], [4, 2]]) { g.beginPath(); g.arc(dx * -sd, dy, 1.1, 0, 7); g.fill(); }
      g.restore(); }
    g.restore(); // (unclip)
    // eyes: button eyes on the 3/4 face, the far one narrower and nearer the far edge; a gentle upper lid
    const big = clamp(P.big), R0 = 10.5 * (1 + 0.18 * big), eo = clamp(P.eye * (1 + 0.5 * big), 0, 1);
    const pN = H(-0.46, -0.08, 0.99), pF = H(0.46, -0.08, 0.99), ey = (pN.y + pF.y) / 2;
    const wN = clamp(0.55 + 0.45 * pN.z / (HR * 0.99), 0.6, 1), wF = Math.max(0.88 * wN, clamp(0.55 + 0.45 * pF.z / (HR * 0.99), 0.6, 1));
    for (const [p, w, k] of [[pF, wF, 0.9], [pN, wN, 1]]) {
      const ch = { x: p.x * 1.08, y: ey + 26 }; pool(g, ch.x, ch.y, 15 * w, 9, '#ec8a80', 0.4);
      g.save(); g.translate(p.x, ey); g.scale(w * k, k); buttonEye(g, 0, 0, eo, { R: R0, happy: P.happy > 0.5 });
      if (eo > 0.12 && P.happy <= 0.5) { // a soft upper lid: cosy, not sleepy-grumpy
        const ry = R0 * 0.95 * eo; g.strokeStyle = rgba('#7a4a2a', 0.45); g.lineWidth = 2.2; g.lineCap = 'round';
        g.beginPath(); g.moveTo(-R0 - 3, -ry * 0.15); g.quadraticCurveTo(0, -ry - 7, R0 + 3, -ry * 0.3); g.stroke(); }
      g.restore();
    }
    // nose (small pink triangle), the little w mouth under it (one piece when it opens), whiskers both sides
    const nz = H(0, 0.2, 1.12), nk = 0.65 + 0.35 * Math.cos(yaw);
    g.save(); g.translate(nz.x, nz.y); g.scale(nk, 1);
    g.fillStyle = '#d87a7c'; g.beginPath(); g.moveTo(-10, -5); g.bezierCurveTo(-9, -11, 9, -11, 10, -5); g.quadraticCurveTo(3, 4, 0, 6.5); g.quadraticCurveTo(-3, 4, -10, -5); g.fill();
    g.strokeStyle = rgba(INK, 0.45); g.lineWidth = 1; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.ellipse(-3, -5, 2.8, 1.5, 0, 0, 7); g.fill();
    g.restore();
    const mz = H(0, 0.46, 1.06);
    catMouth(g, nz.x, nz.y + 5, mz.x, mz.y, 26 * nk, clamp(P.mouth), P.smile, P.mdeep);
    g.save(); g.strokeStyle = rgba(INK, 0.34); g.lineWidth = 1.1; g.lineCap = 'round';
    const wt = Math.sin((P.tt || 0) * 1.7) * 0.03;
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
      const el = 0.4 + i * 0.07, r0 = H(sd * 0.3, el, 1.08), m = H(sd * 0.95, el + (i - 1) * 0.08 + wt, 1.32), q = H(sd * (sd < 0 ? 1.25 : 1.5), el + (i - 1) * 0.2 + wt, sd < 0 ? 1.42 : 1.62);
      g.beginPath(); g.moveTo(r0.x, r0.y); g.quadraticCurveTo(m.x, m.y, q.x, q.y); g.stroke();
    }
    g.restore();
    g.restore();
  }
  function paint(g, R, st) {
    g.save(); g.scale(-1, 1);
    const pb = R.pb, L = R.legs;
    const tailPts = R.tail.pts;
    bendStrips(g, tail, tailPts, TAIL_L);
    drawLeg(g, L.hindFar, LEGSPR.hindFar, true); drawLeg(g, L.foreFar, LEGSPR.foreFar, true);
    g.save(); g.translate(0, R.rd); const bp = R.Mb(BCN); g.translate(bp[0], bp[1]); g.rotate(pb.pitch); g.scale(pb.sx, pb.sy); g.translate(-BCN[0], -BCN[1]); drawSprite(g, body); g.restore();
    drawLeg(g, L.hindNear, LEGSPR.hindNear, false);
    g.save(); g.translate(R.N[0] + 4, R.N[1] + 34); g.rotate(pb.pitch * 0.6); g.scale(1, pb.sy); drawSprite(g, ruff); g.restore();
    drawLeg(g, L.foreNear, LEGSPR.foreNear, false);
    drawHead(g, R);
    // wrapped round, the end of the tail lies in front of the paws
    const w = clamp((R.tail.wrap - 0.3) / 0.4);
    if (w > 0) bendStrips(g, tail, tailPts, TAIL_L, { from: Math.floor(lerp(TAIL_N, TAIL_N * 0.45, w)) });
    g.restore();
  }
  const toCaller = (p, o = {}) => {
    const lx = -p[0], ly = p[1];
    if (o.x === undefined && o.y === undefined && o.scale === undefined && o.face === undefined) return { x: lx, y: ly };
    const f = o.face ?? 1, k = o.scale ?? 1; return { x: (o.x ?? 0) + f * k * lx, y: (o.y ?? 0) + k * ly };
  };
  const mouthOf = (R, o) => { const h = R.head, q = hp(0, 0.46, 1.06, YAW0 + 0.3 * clamp(h.P.hturn, -1, 1)), r = rot([q.x, q.y], -h.ha); return toCaller([h.H[0] + r[0], h.H[1] + r[1]], o); };
  const neckOf = (R, o) => { const h = R.head, r = rot([6, 64], -h.ha); return toCaller([h.H[0] + r[0], h.H[1] + r[1]], o); };
  const pawsOf = (R, o) => LEGS.map(([n]) => ({ ...toCaller(R.legs[n].P, o), planted: R.legs[n].planted }));
  return {
    STRIDE,
    draw(g, st = {}) { paint(g, rigFromState(st), st); },
    drawAt(g, poseFn, t, o = {}) { const { R, st } = rigAt(poseFn, t, o); paint(g, R, st); },
    paws(st = {}, o) { return pawsOf(rigFromState(st), o); },
    pawsAt(poseFn, t, o = {}) { return pawsOf(rigAt(poseFn, t, o).R, o); },
    mouthAt(poseFn, t, o = {}) { return mouthOf(rigAt(poseFn, t, o).R, o); },
    headAt(poseFn, t, o = {}) { return toCaller(rigAt(poseFn, t, o).R.head.H, o); },
    neckAt(poseFn, t, o = {}) { return neckOf(rigAt(poseFn, t, o).R, o); },
    shadow(g, st = {}, height = 0) {
      const p = solve(st, 0), k = 1 / (1 + Math.max(0, height - p.rdy) / 160);
      g.save(); g.translate(0, height); g.globalAlpha *= 0.6 * k; pool(g, 10, 4, 300 * (0.7 + 0.3 * k), 22, '#2a1e12', 0.45); g.restore();
    },
  };
}
