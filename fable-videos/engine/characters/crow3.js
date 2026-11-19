// crow3: a little female crow built as a RIG of painted parts driven by continuous parameters.
// Facing LEFT, feet on the ground at y = 0 (local units, same size as crow.js). Mirror with scale(-1, 1).
//
//   const crow = makeCrow3(res, seed);
//   crow.draw(g, st)                   draw one pose (a plain state object, see below)
//   crow.drawAt(g, poseFn, t, o)       draw with FOLLOW-THROUGH: poseFn(t) -> state. The rig samples the recent past
//                                      of poseFn per body part through small damped springs, so the head leads,
//                                      the body follows, and the wings and tail settle last (with a little overshoot).
//                                      o.since: earliest time to sample (use the shot's start time at a cut).
//                                      Root and feet are never delayed, so planted feet stay planted.
//   crow.beakTip(st, o) / crow.beakTipAt(poseFn, t, o)
//                                      -> { x, y, angle, gripX, gripY } in local crow space (before the stager's
//                                      own translate/scale): the tip of the closed beak, its direction, and where
//                                      a held pebble sits. Use it to place pebbles exactly (e.g. the moment one is
//                                      released, start its fall from grip). Pass o = { x, y, scale, face } (your
//                                      transform translate(x, y) scale(face * scale, scale); face 1 = as drawn,
//                                      facing left, -1 = mirrored) to get page coordinates instead.
//   crow.drawPebble(g, x, y, rot)      the same little grey pebble that `pebble: true` puts in the beak.
//   crow.feet(st) / crow.feetAt(poseFn, t, o)  -> [far, near] ankle positions {x, y} (y = -3 when planted).
//   crow.shadow(g, st, height)         a soft ground shadow (draw it before the crow); height = root above ground.
//   STRIDE, hopX(u), takeoffLift(u), landDrop(u), walkRest(phase)  helpers, see "moving the root" below.
//
// ---- state parameters (all optional; numbers ease smoothly - never switch them in steps) ----
// Blend weights (peck, think, sleep, ...) are 0..1 and are eased by the stager. Event PHASES (hop, idea, takeoff,
// land) run 0 -> 1 once; any value <= 0 or >= 1 means 'not happening', so it is fine to drop them back to 0 after
// they end. Cycles (walk, beat, drinkPhase) are unwrapped and keep counting up. drawAt delays phases per body part
// instead of averaging them, so a part never sees a bogus mid-hop.
//   t            time in seconds (drives breathing, blinks, glances, wing beats of effort, ...)
//   life   0..1  idle life (default 1): breathing, blinks, saccadic head glances, an occasional feather shake
//                and tail flick. It is reduced automatically while an action is busy.
//   beak   0..1  open the beak (talking: feed the voice envelope).            pebble  bool: a pebble in the beak
//   eye    0..1  eye openness multiplier (default 1; blinks are automatic, noBlink: true turns them off)
//   happy  0..1  happy: eyes close into smiling arcs, feathers fluff, a little bounce
//   lookUp -1..1 eye glances up (+) / down (-).    eyeBig 0..1  eyes wide (surprise)
//   headTilt     radians, + = nose up.    headTurn 0..1: 0 profile (left), 1 turned right round (looking back)
//   headX, headY extra head offset (neck stretch), local units
//   crouch -0.5..1  bend the legs (1 = deep crouch, negative = stretch up tall).   lean  radians, + = tip forward
//   bodyX, bodyY body offset;  fluff 0..1 puff the feathers;  squash -1..1 (+ = squashed flat, - = stretched)
//   wingLift 0..1 half-open wings (balance);  wingDroop 0..1 tired drooping wings;  flap 0..1 effort flapping
//   tailLift     radians, + = tail up
//   walk         walk phase in CYCLES, unwrapped (never use % 1). One cycle = STRIDE local units of travel
//                (two steps). Drive it from distance: walk = distance / STRIDE, and move the root forward
//                (to the LEFT, -x) by exactly that distance. The feet then never slide, at any speed,
//                including speeding up and slowing down.  walkAmt 0..1: body bob, head bob (default 1 when
//                walking, set 0 when standing). Standing still with both feet down: stop at walk = k/2
//                (any multiple of 0.5, i.e. distance a multiple of STRIDE/2); walkRest(p) gives the next one.
//   footUp 0..1  lift the near foot (thinking pose)
//   hop    0..1  phase of one hop: 0-0.3 anticipation crouch, 0.34 launch, airborne arc (legs tucked, wings
//                half open), 0.72 touchdown, squash and settle by 1. hopHeight (default 50). The rig adds the
//                vertical arc itself; move the root horizontally by hopX(u) * distance.
//   peck   0..1  bend down so the beak tip reaches the ground point (aimX, aimY) (default (-96, -2)), e.g. a
//                pebble. Open the beak on the way down, close it on the pebble, set pebble: true, rise.
//   aim    0..1  lean and put the beak tip on (aimX, aimY) at angle aimTilt (default 1.0 rad nose-down):
//                dropping a pebble over a rim, dipping into a pitcher's mouth.
//   peer   0..1  lean forward and look down (into a pitcher), eye looking down.
//   reach  0..1  push the beak in as far as it goes toward (aimX, aimY): long neck, deep lean, tail up for
//                balance, little wing flaps of effort (combine with strain for wriggling)
//   push   0..1  brace the legs and lean the chest forward into something (to the left)
//   pushChest 0..1  push with the CHEST and shoulder leading into the object (to the left): head turned away
//                (toward us) and up, legs braced back, tail down. Combine with strain for the effort.
//   strain 0..1  effort: trembling, eyes squeezed, wings beating a little, beak clenched
//   drink  0..1  drinking, with drinkPhase (cycles): at whole numbers the beak dips to (aimX, aimY) (the water),
//                at .5 the head is tipped back to swallow. Drive drinkPhase at ~0.4-0.5 cycles per second.
//   think  0..1  thinking: head tilted up, eye looking up, near foot raised, slow little head tilts
//   idea   0..1  phase of an "idea!" moment: head snaps up, feathers puff, a little hop; back to rest at 1
//   weary  0..1  thirsty and tired: droopy wings, half-closed eyes, beak a little open, slow deep breaths
//   sleep  0..1  asleep (in a nest): sits down low and round, the head turns back and tucks into the wing on
//                its back, eyes closed, slow breathing. legs: false hides the legs (in a nest).
//   fly    0..1  flying (wings unfold into the two-part flight wing; legs tucked). beat: wingbeat phase in
//                cycles (about 2.6-3.2 per second); glide 0..1; flare 0..1 (wings forward to brake);
//                pitch radians (+ = nose up)
//   takeoff 0..1 phase of a take-off from the ground: 0-0.3 crouch, 0.42 spring (feet leave), first big
//                downstroke, blending into the normal beat by 1 (keep fly = 1 after it ends). Feet stay planted
//                until 0.42; lift the root by takeoffLift(u) * height (and then follow your flight path).
//   land   0..1  phase of a landing: wings flare forward and brake, legs reach down, touchdown at 0.55
//                (squash), wings fold, settle by 1 (set fly = 0 after it ends). Bring the root down by
//                landDrop(u) * height: it reaches the ground exactly at u = 0.55 and must stay there.
//   legs   bool  draw the legs (default true)
//   turn   0..1  turn round to face the other way: the head leads, the body follows, the tail comes last. Near
//                0.5 she is seen front-on (narrow body, both eyes). At 1 the picture is exactly drawing her with
//                scale(-1, 1) at turn 0, so swap to the mirrored transform with turn 0 (and a fresh `since` for
//                drawAt) once it reaches 1: no pop. Standing, the feet step round one at a time (no sliding);
//                in flight the wings keep beating. Ease it over about 1-1.5 s. Aim/peck with turn at 0.
//
// Moving the root: the stager translates to the root point (between the feet) and scales; the crow never
// moves its root by itself except for the vertical arcs of hop and idea.
import { wash, ink, strokes, pool, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, pencil, rgba, shade, clamp, lerp, ease, furEdge, blooms, soften, penLine, hatch, canvas } from '../watercolor.js';
import { buttonEye } from './kit.js';

const SHEEN = ['#3b4a7a', '#4a3d6e', '#2f5a66', '#1c1f2b', '#55608a'];
const C = { body: '#12141c', sheen: '#5d6d96', belly: '#232838', beak: '#4b4a52', beakLight: '#8a8790', ink: '#1e1d26', line: '#0a0a0f',
  leg: '#2f2e36', legLight: '#6a6874', pebble: '#9a958c', pebbleDark: '#6d6860', pebbleLight: '#c9c4b8' };

// ---- geometry (standing pose, local units) ----
const BODY = smooth([[-62, -78], [-56, -100], [-34, -113], [10, -114], [56, -96], [94, -62], [126, -42], [72, -24], [14, -16], [-34, -30]]);
const HP = [6, -38];            // body pivot (hips)
const N0 = [-40, -98];          // neck base on the body
const NV0 = [-18, -26];         // rest head centre relative to the neck base -> head at (-58, -124)
const T0 = [92, -46];           // tail root
const SH_N = [-20, -88], SH_F = [-8, -97], SH_F2 = [10, -100]; // wing shoulders (near, far folded, far open)
const HIP_N = [-2, -36], HIP_F = [12, -38];
const LEG_A = 24, LEG_B = 31;   // tibia (feathered) and tarsus
const TAIL = smooth([[86, -52], [150, -46], [188, -28], [178, -16], [140, -22], [90, -32]]);
// head-local: centre (0, 0), facing left
const HEAD = smooth([[-36, 6], [-33, -15], [-19, -30], [2, -35], [23, -28], [34, -10], [35, 12], [24, 29], [2, 35], [-20, 30]]);
const BEAK_UP = smooth([[-30, -9], [-50, -8], [-70, -1], [-86, 7], [-70, 8], [-50, 10], [-30, 11]]);
const BEAK_LO = smooth([[-30, 10], [-50, 11], [-74, 10], [-56, 16], [-30, 19]]);
const BEAK_PIV = [-30, 10], BEAK_TIP = [-84, 8], GRIP = [-70, 11];
const EYE = [-12, -7], EYE_R = 7.6;
const EYE_AZ = Math.PI / 3, EYE_RAD = 24; // the eyes sit 60 degrees either side of the beak on a sphere: profile x = -12
const NECK = smooth([[-32, -24], [0, -27], [32, -24], [40, 0], [32, 24], [0, 27], [-32, 24], [-40, 0]]);
// crow.js' folded wing, moved onto this body's shoulder (SH_N)
const WING = smooth([[-36, -100], [24, -104], [78, -76], [140, -38], [88, -44], [24, -50], [-20, -62]]);
// the two-part flight wing, built pointing straight up from the shoulder at (0, 0)
const ARM = smooth([[-8, 10], [-16, -30], [-17, -68], [-8, -92], [16, -98], [40, -86], [50, -52], [36, -12], [14, 10]]);
const WRIST = [14, -88];
const HAND = smooth([[-12, 6], [-16, -30], [-10, -58], [2, -68], [18, -64], [30, -42], [32, -12], [22, 6]]);
// primaries: [base x, base y, spread angle, length] in hand space
const PRIM = [[-8, -50, -0.36, 62], [2, -58, -0.17, 80], [12, -60, 0.02, 88], [22, -55, 0.21, 82], [30, -42, 0.4, 66]];
const FEATHER = (L) => smooth([[-7, 22], [-8, -L * 0.45], [-3, -L + 8], [0, -L], [4, -L + 9], [8, -L * 0.42], [7, 22]]);
const PEBBLE = smooth([[-7, -1], [-5, -5], [1, -6], [6, -4], [7, 1], [4, 5], [-2, 6], [-6, 4]]);

export const STRIDE = 58;
const BETA = 0.6, LIFT = 16, FOOT_X = 2, FOOT_Y = -3;

// ---- small maths ----
const TAU = Math.PI * 2;
const hash = (n, s = 0) => { const v = Math.sin(n * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const fr = (x) => x - Math.floor(x);
const easeInOut = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const backOut = (x) => { x = clamp(x); const c = 1.4; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
const bell = (u, a, b) => (u <= a || u >= b ? 0 : Math.sin(Math.PI * (u - a) / (b - a)) ** 2);
const rot = (p, a) => [p[0] * Math.cos(a) - p[1] * Math.sin(a), p[0] * Math.sin(a) + p[1] * Math.cos(a)];
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
// smooth keyframes: [[u, v], ...], monotone cubic (no overshoot between keys, no stops at in-between keys)
function key(u, ks) {
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
// a bird-like glance: holds still, then darts to a new random value (with a tiny overshoot)
function saccade(t, period, seed, dur = 0.16) {
  const b = (j) => j * period + period * 0.5 * hash(j, seed);
  let j = Math.floor(t / period); if (t < b(j)) j--;
  const v = (k) => hash(k, seed + 7) * 2 - 1;
  return lerp(v(j - 1), v(j), backOut((t - b(j)) / dur));
}
// an occasional event (blink, shake, flick): returns {u: 0..1 progress, on} for windows of length dur
function event(t, period, dur, seed) {
  const j = Math.floor(t / period), st = j * period + (period - dur) * hash(j, seed);
  const u = (t - st) / dur;
  return u >= 0 && u <= 1 ? u : -1;
}

// ---- helpers for moving the root ----
export const hopX = (u) => clamp((u - 0.34) / 0.38);
export const takeoffLift = (u) => (u <= 0.42 ? 0 : Math.pow((u - 0.42) / 0.58, 1.5));
export const landDrop = (u) => (u >= 0.55 ? 0 : Math.pow(1 - u / 0.55, 1.7));
export const walkRest = (p) => Math.ceil(p * 2 - 1e-6) / 2;

// one foot of the walk cycle, in root space: [x, y, curl]
function walkFoot(p) {
  p = fr(p);
  if (p < BETA) return [FOOT_X + BETA * STRIDE * (p / BETA - 0.5), FOOT_Y, 0];
  const u = (p - BETA) / (1 - BETA);
  return [FOOT_X + BETA * STRIDE * (0.5 - easeInOut(u)), FOOT_Y - LIFT * Math.sin(Math.PI * u) ** 0.8, Math.sin(Math.PI * u) * 0.7];
}

// ---- wing configurations: a = arm angle (0 = straight up, + = swung back/down), h = hand angle relative to
// the arm, ak/hk/fk = length (foreshortening) of arm/hand/primaries, sp = primaries spread, w = width
const FOLD = { a: 1.93, h: -0.02, ak: 0.8, hk: 0.45, fk: 0.92, sp: 0, w: 0.8 };
const RAISED = { a: 0.95, h: 0.32, ak: 0.85, hk: 0.9, fk: 0.95, sp: 0.55, w: 1 };
const FLARE = { a: -0.2, h: -0.38, ak: 0.95, hk: 1, fk: 1, sp: 1, w: 1.05 };
const mixW = (A, B, k) => { const o = {}; for (const n in A) o[n] = A[n] + (B[n] - A[n]) * k; return o; };
function beatWing(beat, glide = 0) {
  const ph = beat * TAU, c = Math.cos(ph), s = Math.sin(ph), g1 = 1 - glide;
  const a = g1 * (1.05 + 1.4 * c) + glide * 0.5;
  const h = g1 * (0.6 * Math.max(0, s) - 0.12 * Math.max(0, -s)) + glide * 0.2;
  const k = g1 * (0.75 + 0.25 * Math.abs(c)) + glide * 0.78;
  const sp = g1 * (0.5 + 0.5 * Math.max(0, -s) - 0.25 * Math.max(0, s)) + glide * 0.7;
  return { a, h, ak: k, hk: k, fk: k, sp, w: 0.9 };
}

// ---- default values for averaging states over time ----
const DEF = { eye: 1, life: 1, hopHeight: 50, aimX: -128, aimY: -2, aimTilt: 1.0 };

// ---- the pose solver: state -> posture (relative to the root). dl: procedural time lag of this body part.
function solve(st, dl = 0) {
  const t = (st.t || 0) - dl;
  const v = (k) => st[k] ?? DEF[k] ?? 0;
  const P = {
    c: v('crouch'), lean: v('lean'), bx: v('bodyX'), by: v('bodyY'), fl: v('fluff'), sq: v('squash'),
    nvx: v('headX'), nvy: v('headY'), ha: v('headTilt'), turn: v('headTurn'),
    eye: v('eye'), beak: v('beak'), happy: v('happy'), look: v('lookUp'), big: v('eyeBig'), blush: 1,
    wLift: v('wingLift'), wDroop: v('wingDroop'), wFlap: v('flap'), tail: v('tailLift'), fan: 0,
    rdx: 0, rdy: 0, air: 0, tuck: [14, 12], tuckCurl: 1, footUp: v('footUp'), shake: 0, tremble: 0,
    breathA: 1, breathR: 1, fly: v('fly'), wingCfg: null, flapRate: 3.4,
  };
  const hop = v('hop'), peck = v('peck'), aim = v('aim'), peer = v('peer'), reach = v('reach'), push = v('push'), strain = v('strain');
  const drink = v('drink'), think = v('think'), idea = v('idea'), weary = v('weary'), happy = v('happy'), sleep = v('sleep');
  const takeoff = v('takeoff'), land = v('land'), wa = clamp(v('walkAmt'));
  const hopOn = hop > 0 && hop < 1 ? 1 : 0, ideaOn = idea > 0 && idea < 1 ? 1 : 0;
  const busy = clamp(Math.max(peck, aim, peer, reach, push, v('pushChest'), strain, v('turn') > 0 && v('turn') < 1 ? 1 : 0, drink, sleep, P.fly, think * 0.6, hopOn, ideaOn * 0.7, (takeoff > 0 && takeoff < 1) ? 1 : 0, (land > 0 && land < 1) ? 1 : 0, wa * 0.6));
  const life = clamp(v('life')) * (1 - busy);

  // -- idle life
  const gl1 = saccade(t, 1.9, 3), gl2 = saccade(t + 0.7, 2.6, 5), gl3 = saccade(t, 3.1, 9);
  P.ha += life * (0.1 * gl1 + 0.04);
  P.turn += life * 0.13 * Math.max(0, gl2);
  P.nvx += life * 2.5 * gl3; P.nvy += life * 1.5 * gl1;
  P.look += life * 0.3 * gl3;
  const bl = event(t, 4.3, 0.2, 41);
  if (!st.noBlink && bl >= 0 && !(st.eyeBig > 0.2) && !(st.idea > 0 && st.idea < 1)) P.eye *= 1 - Math.sin(Math.PI * bl) ** 0.6;
  const sh = event(t, 12, 0.95, 21);
  if (sh >= 0) { const e = bell(sh, 0, 1); P.shake += life * e; P.fl += life * 0.7 * Math.sin(Math.PI * Math.min(1, sh * 1.4)); }
  const fk = event(t + 3, 5.5, 0.55, 33);
  if (fk >= 0) P.tail += life * 0.22 * (fk < 0.25 ? easeInOut(fk / 0.25) : 1 - easeInOut((fk - 0.25) / 0.75));

  // -- walking: body bob, head bob (the head holds still in space, then darts forward)
  if (wa > 0) {
    const ph = v('walk');
    P.by += wa * 3 * Math.cos(ph * 2 * TAU);
    P.lean += wa * (0.07 + 0.025 * Math.sin(ph * TAU));
    P.tail += wa * 0.05 * Math.sin(ph * 2 * TAU - 1.2);
    const s = fr(ph * 2 + 0.12), hold = 0.66, D = 0.62 * hold * STRIDE / 2;
    const f = s < hold ? s / hold : 1 - easeInOut((s - hold) / (1 - hold));
    P.nvx += wa * (D * (f - 0.5) - 5);
    P.nvy += wa * (1.5 * Math.sin(Math.PI * clamp((s - hold) / (1 - hold))) + 2);
    P.ha -= wa * 0.06;
  }

  // -- hop
  if (hop > 0) {
    const u = hop, H = v('hopHeight');
    P.c += key(u, [[0, 0], [0.26, 0.85], [0.33, -0.45], [0.42, -0.1], [0.6, 0.05], [0.72, 0.15], [0.78, 0.85], [0.9, 0.12], [1, 0]]);
    P.lean += key(u, [[0, 0], [0.26, 0.14], [0.36, -0.14], [0.55, 0], [0.7, 0.12], [0.8, 0.12], [1, 0]]);
    if (u > 0.34 && u < 0.72) { const s = (u - 0.34) / 0.38; P.rdy -= H * 4 * s * (1 - s); }
    P.air = Math.max(P.air, key(u, [[0.34, 0], [0.42, 1], [0.62, 1], [0.72, 0]]));
    P.wLift += key(u, [[0, 0], [0.26, 0.15], [0.38, 0.75], [0.6, 0.45], [0.7, 0.8], [0.86, 0.1], [1, 0]]);
    P.tail += key(u, [[0, 0], [0.26, 0.2], [0.36, -0.16], [0.6, 0], [0.74, 0.3], [0.86, 0.12], [1, 0]]);
    P.sq += key(u, [[0.7, 0], [0.78, 0.45], [0.9, -0.05], [1, 0]]) + key(u, [[0.3, 0], [0.36, -0.4], [0.46, 0]]);
    P.nvy += key(u, [[0, 0], [0.26, 6], [0.36, -6], [0.6, 0], [0.78, 7], [1, 0]]);
    P.ha += key(u, [[0, 0], [0.26, -0.1], [0.4, 0.1], [0.7, -0.06], [1, 0]]);
  }

  // -- idea! head snaps up, puff, little hop
  if (idea > 0 && idea < 1) {
    const u = idea;
    P.ha += key(u, [[0, 0], [0.08, 0.42], [0.45, 0.28], [1, 0]]);
    P.nvy += key(u, [[0, 0], [0.08, -12], [0.45, -6], [1, 0]]);
    P.nvx += key(u, [[0, 0], [0.08, 4], [1, 0]]);
    P.big += key(u, [[0, 0], [0.06, 1], [0.6, 0.6], [1, 0]]);
    P.fl += key(u, [[0, 0], [0.12, 1], [0.6, 0.35], [1, 0]]);
    P.c += key(u, [[0, 0], [0.14, 0.4], [0.2, -0.3], [0.3, 0], [0.42, 0.45], [0.55, 0], [1, 0]]);
    if (u > 0.2 && u < 0.42) { const s = (u - 0.2) / 0.22; P.rdy -= 20 * 4 * s * (1 - s); }
    P.air = Math.max(P.air, 0.45 * bell(u, 0.2, 0.42));
    P.wLift += key(u, [[0, 0], [0.12, 0.65], [0.35, 0.3], [0.6, 0], [1, 0]]);
    P.tail += key(u, [[0, 0], [0.12, 0.3], [0.4, -0.08], [0.6, 0.06], [1, 0]]);
  }

  // -- thinking
  if (think > 0) {
    const w = think;
    P.ha += w * (0.3 + 0.08 * Math.sin(t * TAU / 4.6));
    P.turn += w * (0.12 + 0.06 * Math.sin(t * TAU / 6.1 + 1));
    P.look += w * 1.0; P.nvx += w * 4; P.nvy += w * -3;
    P.footUp += w; P.bx += w * 4; P.lean -= w * 0.04;
    P.tail += w * 0.04 * Math.sin(t * TAU / 4.6 + 2);
  }

  // -- weary / thirsty
  if (weary > 0) {
    const w = weary;
    P.lean += w * 0.05; P.c += w * 0.22; P.nvx -= w * 4; P.nvy += w * 11; P.ha -= w * 0.24;
    P.eye *= 1 - 0.5 * w; P.beak = Math.max(P.beak, w * 0.24); P.wDroop += w; P.tail -= w * 0.14;
    P.breathA += w * 0.9; P.breathR *= 1 - 0.38 * w; P.blush *= 1 - 0.5 * w;
  }

  // -- happy: fluffed, smiling eyes, a little bounce
  if (happy > 0) {
    const w = happy, b = 0.5 - 0.5 * Math.cos(t * TAU * 1.5);
    P.fl += w * 0.55; P.c += w * 0.2 * b; P.nvy -= w * (3 + 3 * b); P.ha += w * (0.12 + 0.05 * b);
    P.tail += w * 0.08 * Math.sin(t * TAU * 1.5 - 1); P.wLift += w * 0.08 * b;
  }

  // -- push with the chest: chest and shoulder lead, head turned away and up, legs braced back, tail down
  const pushC = v('pushChest');
  if (pushC > 0) {
    const w = pushC;
    P.bx -= w * 17; P.lean -= w * 0.04; P.c += w * 0.28; P.fl += w * 0.18; P.sq -= w * 0.06;
    P.nvx += w * 17; P.nvy -= w * 2; P.ha += w * 0.3; P.turn += w * 0.42; P.tail -= w * 0.16;
  }
  // -- push / strain
  if (push > 0) {
    const w = push;
    P.bx -= w * 14; P.lean += w * 0.22; P.c += w * 0.3; P.nvx -= w * 2; P.nvy += w * 16; P.ha -= w * 0.55; P.turn += w * 0.22;
    P.tail -= w * 0.08; P.fl += w * 0.15;
  }
  if (strain > 0) {
    const w = strain;
    P.tremble += w; P.eye *= 1 - 0.62 * w; P.beak *= 1 - w;
    P.wFlap += w * 0.85; P.flapRate = 4.2; P.fl += w * 0.2;
  }

  // -- peer down
  if (peer > 0) {
    const w = peer;
    P.lean += w * 0.32; P.c += w * 0.15; P.nvx -= w * 12; P.nvy += w * 10; P.ha -= w * 0.75; P.look -= w * 0.8;
    P.tail += w * 0.14;
  }

  // -- drink (swallow phase) / aim / peck / reach: put the beak tip on a target
  const dph = v('drinkPhase');
  const dip = drink * (0.5 + 0.5 * Math.cos(dph * TAU)) ** 0.6;  // 1 at whole cycles
  const up = drink * (1 - (0.5 + 0.5 * Math.cos(dph * TAU)) ** 0.6);
  if (up > 0) { // head tipped back to swallow, little gulps
    P.ha += up * 0.85; P.nvy -= up * 12; P.nvx += up * 6; P.eye *= 1 - 0.35 * up;
    P.ha += up * 0.05 * Math.sin(t * TAU * 3.2); P.beak = Math.max(P.beak, up * 0.12);
    P.lean -= up * 0.08; P.tail -= up * 0.06;
  }
  const aw = clamp(Math.max(peck, aim, reach, dip));
  let tgt = null, tilt = 0;
  if (aw > 0) {
    tgt = [v('aimX'), v('aimY')];
    const sum = peck + aim + reach + dip + 1e-6;
    tilt = (peck * 1.12 + aim * v('aimTilt') + reach * 1.38 + dip * 1.1) / sum;
    const drop = clamp((tgt[1] + 60) / 70, -1, 1.2), fwd = clamp((-tgt[0] - 100) / 60, -1, 1.5);
    P.lean += aw * (0.1 + 0.26 * drop + 0.1 * fwd) + reach * 0.12;
    P.c += aw * clamp(0.1 + 0.32 * drop, 0, 0.6);
    P.tail += aw * (0.12 + 0.2 * drop) + reach * 0.22;
    P.wLift += reach * 0.15;
    if (reach > 0) { P.wFlap += reach * 0.35 * (0.5 + 0.5 * Math.sin(t * TAU * 0.6)); P.flapRate = 3.6; }
  }

  // -- flight / take-off / landing
  let fly = P.fly, wcfg = null;
  if (takeoff > 0 && takeoff < 1) {
    const u = takeoff;
    P.c += key(u, [[0, 0], [0.3, 0.9], [0.4, -0.45], [0.52, -0.2], [0.7, 0]]);
    P.lean += key(u, [[0, 0], [0.3, 0.3], [0.42, -0.3], [0.6, -0.12], [1, 0]]);
    P.nvx += key(u, [[0, 0], [0.3, -6], [0.45, -8], [1, -6]]);
    P.nvy += key(u, [[0, 0], [0.3, 8], [0.42, -4], [1, 4]]);
    P.tail += key(u, [[0, 0], [0.3, 0.25], [0.45, -0.2], [0.7, 0], [1, -0.05]]);
    P.air = Math.max(P.air, key(u, [[0.42, 0], [0.55, 1]]));
    P.tuck = [lerp(26, 14, clamp((u - 0.5) / 0.4)), lerp(26, 12, clamp((u - 0.5) / 0.4))];
    // the wings: lift, rise high above the back, one big first downstroke, then into the stager's beat
    const iph = key(u, [[0, 0.5], [0.3, 0.5], [0.42, 0.5], [0.62, 1.0], [0.8, 1.5], [1, 2.0]]);
    // the folded wings stay folded through the crouch, then unfold fast as she springs (a few frames)
    wcfg = mixW(beatWing(iph), beatWing(v('beat'), v('glide')), clamp((u - 0.75) / 0.25));
    fly = Math.max(fly, key(u, [[0, 0], [0.26, 0], [0.42, 1]]));
  } else if (takeoff >= 1) fly = Math.max(fly, 1);
  if (land > 0 && land < 1) {
    const u = land;
    const fw = key(u, [[0, 1], [0.6, 1], [0.74, 0]]); // a quick fold after touchdown
    fly = fw;
    P.lean += key(u, [[0, 0], [0.35, -0.42], [0.55, -0.32], [0.63, 0.22], [0.8, 0.06], [1, 0]]);
    P.c += key(u, [[0.55, 0], [0.63, 0.9], [0.8, 0.18], [1, 0]]);
    P.sq += key(u, [[0.55, 0], [0.63, 0.35], [0.8, -0.04], [1, 0]]);
    P.tail += key(u, [[0, 0], [0.35, -0.25], [0.55, -0.15], [0.64, 0.35], [0.82, 0.08], [1, 0]]);
    P.fan += key(u, [[0, 0], [0.35, 1], [0.6, 0.8], [0.8, 0]]);
    P.nvx += key(u, [[0, -6], [0.4, 2], [0.62, -6], [1, 0]]);
    P.nvy += key(u, [[0, 4], [0.4, -4], [0.63, 8], [1, 0]]);
    P.air = Math.max(P.air, key(u, [[0, 1], [0.5, 1], [0.55, 0]]));
    const reachL = key(u, [[0, 0], [0.38, 1], [0.55, 1]]);
    P.tuck = [lerp(14, -14, reachL), lerp(12, 40, reachL)]; P.tuckCurl = 1 - reachL;
    const brake = mixW(FLARE, mixW(FLARE, RAISED, 0.5), 0.5 + 0.5 * Math.sin(u * 22));
    const flareK = key(u, [[0, 0], [0.32, 1], [0.6, 1], [0.7, 0.3], [0.85, 0]]);
    wcfg = mixW(beatWing(v('beat'), Math.max(v('glide'), key(u, [[0, 0], [0.2, 1]]))), u < 0.55 ? brake : mixW(FLARE, RAISED, clamp((u - 0.55) / 0.15)), flareK);
  }
  if (fly > 0) {
    if (!wcfg) wcfg = mixW(beatWing(v('beat'), v('glide')), FLARE, v('flare'));
    const c = Math.cos(v('beat') * TAU) * (1 - v('glide'));
    P.by += fly * c * -6 * (land > 0 ? 1 - clamp((land - 0.4) / 0.2) : 1);
    P.lean += fly * (0.24 - v('pitch') - v('flare') * 0.35);
    P.sq += fly * 0.35; P.nvx -= fly * 10; P.nvy += fly * 8; P.ha -= fly * 0.06; P.stretch = fly;
    P.lean += fly * 0.05 * Math.sin(v('beat') * TAU) * (1 - v('glide')); // the body pitches a little with each beat
    P.air = Math.max(P.air, fly * (takeoff > 0 && takeoff < 1 ? 0 : 1) * (land > 0 && land < 1 ? 0 : 1));
    P.tail += fly * (-0.1 + 0.04 * Math.sin(v('beat') * TAU - 1));
    P.fan += fly * (0.3 + v('flare') * 0.7);
  }
  P.fly = fly; P.wingCfg = wcfg;

  // -- breathing (and the strain tremble, the feather shake)
  const br = Math.sin(t * TAU * 0.32 * P.breathR);
  P.breath = br * P.breathA;
  if (P.shake > 0) { P.lean += 0.05 * P.shake * Math.sin(t * TAU * 7.5); P.ha += 0.12 * P.shake * Math.sin(t * TAU * 7.5 + 0.8); P.tail += 0.12 * P.shake * Math.sin(t * TAU * 7.5 + 1.8); P.wLift += 0.25 * P.shake; }
  if (P.tremble > 0) { P.bx += P.tremble * 1.1 * Math.sin(t * TAU * 13); P.lean += P.tremble * 0.012 * Math.sin(t * TAU * 11 + 1); }

  // -- asleep: overrides the rest
  if (sleep > 0) {
    const s = sleep;
    P.c = lerp(P.c, 1.05, s); P.lean = lerp(P.lean, -0.05, s); P.fl = lerp(P.fl, 0.7, s); P.sq = lerp(P.sq, 0.12, s);
    P.bx = lerp(P.bx, 0, s); P.by = lerp(P.by, 0, s);
    P.turn = lerp(P.turn, 1, key(s, [[0, 0], [0.25, 0], [0.7, 1]]));
    P.ha = lerp(P.ha, 0.85, key(s, [[0.2, 0], [0.8, 1]]));
    P.sleepK = key(s, [[0.25, 0], [0.9, 1]]);
    P.eye *= 1 - key(s, [[0, 0], [0.4, 1]]);
    P.beak *= 1 - s; P.happy *= 1 - s; P.look *= 1 - s; P.big *= 1 - s;
    P.wLift = lerp(P.wLift, 0, s); P.wDroop = lerp(P.wDroop, 0, s); P.wFlap *= 1 - s;
    P.tail = lerp(P.tail, -0.1, s); P.air = lerp(P.air, 1, s); P.tuck = [lerp(P.tuck[0], 4, s), lerp(P.tuck[1], 8, s)];
    P.footUp *= 1 - s; P.breathA = lerp(P.breathA, 1.8, s); P.breath = lerp(P.breath, 1.8 * Math.sin(t * TAU * 0.2), s);
  }

  // -- turning round: the head leads, the body follows, the tail comes last
  const tr = clamp(v('turn'));
  P.turnH = ease(tr / 0.7); P.turnB = ease((tr - 0.12) / 0.76); P.turnT = ease((tr - 0.18) / 0.76);

  // ---- derived transforms ----
  const fl = clamp(P.fl, 0, 1.5);
  P.rot = -P.lean;
  P.dx = P.bx - P.c * 2; P.dy = P.by + P.c * 19 - 9; // standing: the body rides 9 units above the painted pose
  P.sx = 1 + fl * 0.06 + P.sq * 0.08 + P.breath * 0.006 + (P.stretch || 0) * 0.1;
  P.sy = 1 + fl * 0.09 - P.sq * 0.1 + P.breath * 0.013 - (P.stretch || 0) * 0.12;
  const M = bodyMat(P);
  P.N = M(N0);
  // the head: neck offset, or (aiming) solved so the beak tip lands on the target
  let H = add(P.N, [NV0[0] + P.nvx, NV0[1] + P.nvy + fl * -3]);
  if (P.sleepK) { const B = M([14, -118]); H = [lerp(H[0], B[0], P.sleepK), lerp(H[1], B[1], P.sleepK)]; }
  let ha = P.ha;
  if (tgt) {
    const hk = -tilt; // nose down
    const tipL = headTipLocal(P.turn);
    const Hik = [tgt[0] - rot(tipL, hk)[0], tgt[1] - rot(tipL, hk)[1]];
    // the neck can only stretch so far
    const d = [Hik[0] - P.N[0], Hik[1] - P.N[1]], L = Math.hypot(d[0], d[1]), Lmax = 80 + reach * 26;
    const Hc = L > Lmax ? [P.N[0] + d[0] * Lmax / L, P.N[1] + d[1] * Lmax / L] : Hik;
    const e = easeInOut(aw);
    H = [lerp(H[0], Hc[0], e), lerp(H[1], Hc[1], e)]; ha = lerp(ha, hk, e);
  }
  P.H = H; P.ha = ha;
  return P;
}

function bodyMat(P) {
  const c = Math.cos(P.rot), s = Math.sin(P.rot);
  return (p) => {
    const x = (p[0] - HP[0]) * P.sx, y = (p[1] - HP[1]) * P.sy;
    return [HP[0] + P.dx + x * c - y * s, HP[1] + P.dy + x * s + y * c];
  };
}
function headTurnK(turn) {
  const c = Math.cos(Math.PI * clamp(turn)); const sg = c < 0 ? -1 : 1;
  return { c, sx: sg * (0.86 + 0.14 * Math.abs(c)) };
}
// the head's facing: the new `turn` swings it from profile-left (0) through front-on (0.5) to profile-right (1);
// past the middle it is drawn mirrored (sO = -1), so at 1 it is exactly the scale(-1, 1) picture. headTurn
// (glances, the sleep tuck) adds on top, inside that mirror.
function headYaw(turnH, headTurn) {
  const sO = turnH > 0.5 ? -1 : 1;
  return { sO, yaw: clamp(0.5 - Math.abs(0.5 - turnH) + headTurn) };
}
// yaw maps for a part turned by tu (0..1): points through the middle (cosine, continuous) and painted shapes
// (never thinner than `minW` of their width, mirrored past the middle, about the body's centre BC)
const BC = [10, -64];
function yawOf(tu, minW) {
  const c = Math.cos(Math.PI * tu), k = (c < 0 ? -1 : 1) * Math.max(Math.abs(c), minW);
  return { c, k, shape: (p) => [k * (p[0] - BC[0]) + c * BC[0], p[1]], point: (p) => [c * p[0], p[1]] };
}
function headTipLocal(turn) {
  const { c, sx } = headTurnK(turn);
  return [BEAK_PIV[0] * sx + (BEAK_TIP[0] - BEAK_PIV[0]) * c, BEAK_TIP[1]];
}

// ---- springs for follow-through: [tau, weight] taps of a damped spring's impulse response
function kernel(f, zeta, win, n) {
  const w = TAU * f, wd = w * Math.sqrt(1 - zeta * zeta), out = [];
  let sum = 0;
  for (let k = 0; k < n; k++) { const tau = (k + 0.5) * win / n, h = Math.exp(-zeta * w * tau) * Math.sin(wd * tau); out.push([tau, h]); sum += h; }
  for (const o of out) o[1] /= sum;
  out.lag = out.reduce((a, [tau, w]) => a + tau * w, 0);
  return out;
}
const K = { head: kernel(3.4, 0.62, 0.42, 9), body: kernel(2.3, 0.5, 0.7, 13), wing: kernel(1.9, 0.42, 0.9, 15), tail: kernel(1.6, 0.34, 1.15, 17) };
const LAG = { head: 0, body: 0.05, wing: 0.1, tail: 0.16 };

// Phases (event progress, cycles) must not be averaged: 0.98 and 0 would average to a bogus mid-hop. They are
// simply delayed by the spring's mean lag instead; every other number is blended through the spring.
const PHASES = new Set(['hop', 'idea', 'takeoff', 'land', 'walk', 'beat', 'drinkPhase']);
function filtered(poseFn, t, ker, since, cache) {
  const get = (tt) => { tt = Math.max(since, tt); let s = cache.get(tt); if (!s) { s = poseFn(tt); cache.set(tt, s); } return s; };
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
}

export function makeCrow3(res = 1, seed = 4) {
  const s = (n) => seed * 100 + n;
  const feathered = (g, shape, sd, dir, n = 1) => {
    strokes(g, shape, { color: '#151722', count: Math.round(120 * n), len: 10, width: 1, alpha: 0.4, seed: s(sd), dir, curve: 0.2 });
    strokes(g, shape, { color: C.sheen, count: Math.round(60 * n), len: 9, width: 1, alpha: 0.4, seed: s(sd + 1), dir, curve: 0.2 });
  };
  const darker = (sp, k = 0.7) => { const c = canvas(sp.c.width, sp.c.height), g = c.getContext('2d'); g.filter = `brightness(${k})`; g.drawImage(sp.c, 0, 0); return { ...sp, c }; };

  const tail = sprite(bbox(TAIL), res, (g) => {
    wash(g, TAIL, { under: true, color: shade(C.body, 0.1), opacity: 0.95, seed: s(1) });
    blooms(g, TAIL, SHEEN, { n: 4, seed: s(8), alpha: 0.45 });
    soften(g, 1.5 * res);
    furEdge(g, TAIL, { color: C.body, count: 24, len: 12, width: 4, alpha: 0.9, seed: s(9), lean: 0.4, skip: (x) => x < 140 });
    for (let i = 0; i < 4; i++) ink(g, [[96, -44 + i * 2], [172 - i * 4, -32 + i * 5]], { color: C.sheen, alpha: 0.5, width: 1.1, seed: s(2 + i) });
    penLine(g, TAIL, { closed: true, color: C.line, w: 1.8, alpha: 0.8, seed: s(6) });
  }, { seed: s(7) });

  const body = sprite(bbox(BODY), res, (g) => {
    wash(g, BODY, { under: true, color: C.body, opacity: 0.95, seed: s(10) });
    blooms(g, BODY, SHEEN, { n: 8, seed: s(19), alpha: 0.45 });
    glaze(g, BODY, -14, -44, 50, 24, C.belly, 0.6);
    shadeEdge(g, BODY, { color: C.sheen, alpha: 0.45, width: 16, dy: 7 });
    feathered(g, BODY, 11, () => 0.2);
    soften(g, 1.8 * res);
    furEdge(g, BODY, { color: C.body, count: 120, len: 7, width: 2.4, alpha: 0.9, seed: s(43), lean: 0.6, inner: 0.4 });
    furEdge(g, BODY, { color: C.sheen, count: 30, len: 5, width: 1, alpha: 0.35, seed: s(45), lean: 0.6 });
    hatch(g, BODY, { color: '#0c0d12', count: 260, len: 9, width: 0.8, alpha: 0.55, seed: s(50), dir: () => 0.25, curve: 0.35,
      density: (x, y) => 0.3 + 0.7 * Math.min(1, Math.max(0, (y + 90) / 80)) });
    hatch(g, BODY, { color: '#8a98c0', count: 70, len: 8, width: 0.7, alpha: 0.4, seed: s(51), dir: () => 0.25, density: (x, y) => (y < -70 ? 1 : 0.1) });
    penLine(g, BODY.slice(14, 72), { color: C.line, w: 2.2, alpha: 0.85, seed: s(16), weight: (t) => 0.3 + 0.9 * Math.sin(t * Math.PI) });
    penLine(g, BODY.slice(52, 80).concat(BODY.slice(0, 4)), { color: C.line, w: 1.8, alpha: 0.6, seed: s(17), weight: (t) => 0.2 + 0.8 * Math.sin(t * Math.PI) });
  }, { seed: s(18) });

  // the neck: the same washes, sheen and hatching as the body, NO ink, soft feathered edges, so head, neck and
  // body read as one continuous bird (the neck only shows where the head moves away from the body)
  const neck0 = sprite(bbox(NECK), res, (g) => {
    wash(g, NECK, { under: true, color: C.body, opacity: 0.96, seed: s(110), edge: 0 });
    blooms(g, NECK, SHEEN, { n: 4, seed: s(111), alpha: 0.4 });
    feathered(g, NECK, 112, () => 0.2, 0.4);
    soften(g, 1.8 * res);
    furEdge(g, NECK, { color: C.body, count: 70, len: 7, width: 2.4, alpha: 0.9, seed: s(113), lean: 0.6, inner: 0.4 });
    hatch(g, NECK, { color: '#0c0d12', count: 60, len: 8, width: 0.8, alpha: 0.5, seed: s(114), dir: () => 0.1, curve: 0.35 });
  }, { seed: s(116) });
  const neck = darker(neck0, 0.9); // a touch darker: it sits in the shade under the head

  // the head: crow.js' head painting, but inked only along its OUTER arc (forehead, crown, nape); the throat
  // and the underside where it meets the neck have soft feathers and no line
  const HEAD_OUTER = HEAD.slice(74).concat(HEAD.slice(0, 50));
  const head = sprite(bbox(HEAD.concat([[-48, 0]])), res, (g) => {
    wash(g, HEAD, { under: true, color: C.body, opacity: 0.96, seed: s(13), edge: 0.1 });
    blooms(g, HEAD, SHEEN, { n: 4, seed: s(15), alpha: 0.4 });
    shadeEdge(g, HEAD, { color: C.sheen, alpha: 0.5, width: 14, dy: 6, dx: 3 });
    glaze(g, HEAD, -12, -6, 14, 11, '#4a5470', 0.22); // the barest soft eye patch
    feathered(g, HEAD, 14, (x, y) => Math.atan2(y + 4, x + 4), 0.5);
    soften(g, 1.8 * res);
    furEdge(g, HEAD, { color: C.body, count: 70, len: 5, width: 2, alpha: 0.9, seed: s(44), lean: 0.5, inner: 0.4, skip: (x) => x < -30 });
    furEdge(g, HEAD, { color: C.body, count: 50, len: 7, width: 2.4, alpha: 0.9, seed: s(45), lean: 0.6, inner: 0.5, skip: (x, y) => y < 10 });
    hatch(g, HEAD, { color: '#0c0d12', count: 90, len: 6, width: 0.7, alpha: 0.5, seed: s(52), dir: (x, y) => Math.atan2(y, x) + 1.4 });
    // the bristly feathers over the nostrils, reaching onto the beak
    for (let i = 0; i < 7; i++) {
      const y = -8 + i * 2.4, x = -30 - (i % 3);
      ink(g, [[x + 4, y], [x - 6, y - 0.5], [x - 13 + (i % 2) * 2, y + 0.8]], { color: '#191b26', width: 2.2, alpha: 0.85, seed: s(120 + i), taper: true, wobble: 0.3 });
    }
    penLine(g, HEAD_OUTER, { color: C.line, w: 2, alpha: 0.8, seed: s(17), weight: (t) => 0.15 + 0.9 * Math.sin(Math.PI * t) ** 0.7 });
  }, { seed: s(19) });

  // the folded wing: crow.js' sleek layered WING (long, tapering, feather rows, primaries past the rump)
  const wingFold = sprite(bbox(WING), res, (g) => {
    wash(g, WING, { under: true, color: shade(C.body, 0.05), opacity: 0.96, seed: s(20) });
    blooms(g, WING, SHEEN, { n: 6, seed: s(46), alpha: 0.5 });
    shadeEdge(g, WING, { color: C.sheen, alpha: 0.5, width: 12, dy: 6 });
    for (let i = 0; i < 6; i++) ink(g, [[4 + i * 18, -54 - i * 3], [64 + i * 14, -44 - i * 4]], { color: C.sheen, alpha: 0.45, width: 1.1, seed: s(21 + i) });
    soften(g, 1.5 * res);
    furEdge(g, WING, { color: shade(C.body, 0.05), count: 16, len: 22, width: 6, alpha: 0.95, seed: s(47), lean: 0.9, inner: 0.25, skip: (x) => x < 54 });
    furEdge(g, WING, { color: C.sheen, count: 14, len: 14, width: 1, alpha: 0.4, seed: s(48), lean: 0.9, skip: (x) => x < 34 });
    for (let i = 0; i < 7; i++) penLine(g, [[-6 + i * 16, -90 + i * 5], [34 + i * 14, -70 + i * 3], [74 + i * 10, -50]], { color: C.line, w: 1.3, alpha: 0.55, seed: s(53 + i) });
    penLine(g, WING, { closed: true, color: C.line, w: 2, alpha: 0.8, seed: s(28), weight: (t) => 0.3 + 0.9 * Math.max(0, Math.sin(t * Math.PI * 2)) });
  }, { seed: s(29) });
  const wingFoldFar = darker(wingFold, 0.62);

  const beakUp = sprite(bbox(BEAK_UP), res, (g) => { wash(g, BEAK_UP, { under: true, color: C.beak, opacity: 0.97, seed: s(30) }); shadeEdge(g, BEAK_UP, { color: C.beakLight, alpha: 0.6, width: 5, dy: 3 }); pencil(g, BEAK_UP, { closed: true, color: C.ink, seed: s(31), alpha: 0.6, width: 1.1 }); }, { seed: s(32) });
  const beakLo = sprite(bbox(BEAK_LO), res, (g) => { wash(g, BEAK_LO, { under: true, color: shade(C.beak, 0.1), opacity: 0.97, seed: s(33) }); pencil(g, BEAK_LO, { closed: true, color: C.ink, seed: s(34), alpha: 0.6, width: 1.1 }); }, { seed: s(35) });
  const pebble = sprite(bbox(PEBBLE), res * 1.5, (g) => {
    wash(g, PEBBLE, { under: true, color: C.pebble, opacity: 0.97, seed: s(36), bleed: 0.01, layers: 14 });
    shadeEdge(g, PEBBLE, { color: C.pebbleDark, alpha: 0.7, width: 5, dy: -2 });
    pool(g, -2, -3, 3, 2, C.pebbleLight, 0.8);
    pencil(g, PEBBLE, { closed: true, color: '#4a4640', seed: s(37), alpha: 0.7, width: 1 });
  }, { seed: s(38) });

  // flight wing parts
  const wingPart = (shape, sd, covert) => sprite(bbox(shape), res, (g) => {
    wash(g, shape, { under: true, color: '#171a26', opacity: 0.97, seed: s(sd), bleed: 0.02 });
    blooms(g, shape, SHEEN, { n: 5, seed: s(sd + 1), alpha: 0.45 });
    if (covert) {
      for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) { // rows of small covert feathers
        const x = -12 + i * 14 + r * 3, y = -14 - r * 26 - i * 2;
        penLine(g, [[x, y], [x + 7, y - 13], [x + 15, y - 3]], { color: C.line, w: 1, alpha: 0.5, seed: s(sd + 10 + r * 5 + i) });
      }
      for (let i = 0; i < 5; i++) { const y = -20 - i * 17; penLine(g, [[14, y + 10], [34, y - 2], [50, y + 6]], { color: C.line, w: 1.1, alpha: 0.45, seed: s(sd + 40 + i) }); }
    } else {
      for (let i = 0; i < 4; i++) penLine(g, [[-8 + i * 4, -10 - i * 12], [10 + i * 4, -22 - i * 12], [26, -14 - i * 12]], { color: C.line, w: 1, alpha: 0.45, seed: s(sd + 50 + i) });
    }
    shadeEdge(g, shape, { color: C.sheen, alpha: 0.45, width: 14, dx: -6 });
    soften(g, 0.9 * res);
    furEdge(g, shape, { color: '#171a26', count: 24, len: 6, width: 2, alpha: 0.8, seed: s(sd + 60), lean: 0.3, inner: 0.5 });
    penLine(g, shape, { closed: true, color: C.line, w: 1.9, alpha: 0.85, seed: s(sd + 8), weight: (t) => 0.3 + 0.8 * Math.max(0, Math.sin(t * Math.PI * 2)) });
  }, { seed: s(sd + 12) });
  const arm = wingPart(ARM, 150, true), hand = wingPart(HAND, 170, false);
  const prims = PRIM.map(([, , , L], i) => { const f = FEATHER(L); return sprite(bbox(f), res, (g) => {
    wash(g, f, { under: true, color: '#141620', opacity: 0.97, seed: s(60 + i), bleed: 0.015, layers: 12 });
    blooms(g, f, SHEEN, { n: 2, seed: s(70 + i), alpha: 0.4 });
    penLine(g, [[0, 16], [0.5, -L + 6]], { color: '#6a78a0', w: 1, alpha: 0.55, seed: s(80 + i) });
    penLine(g, f, { closed: true, color: C.line, w: 1.4, alpha: 0.8, seed: s(90 + i) });
  }, { seed: s(100 + i) }); });
  const W_NEAR = { arm, hand, prims }, W_FAR = { arm: darker(arm), hand: darker(hand), prims: prims.map((p) => darker(p)) };

  // ---- drawing pieces ----
  function drawWing(g, parts, sh, baseRot, cfg, far) {
    const k = far ? 0.88 : 1;
    g.save(); g.translate(sh[0], sh[1]); g.rotate(baseRot + cfg.a * k + (far ? -0.16 : 0));
    // primaries first (under the hand), fanned by `sp`
    const wr = [WRIST[0] * cfg.w, WRIST[1] * cfg.ak];
    const drawHand = () => {
      g.save(); g.translate(wr[0], wr[1]); g.rotate(cfg.h * k);
      g.save(); g.scale(cfg.w, cfg.hk);
      for (let i = PRIM.length - 1; i >= 0; i--) {
        const [x, y, a] = PRIM[i], closed = 0.06 + i * 0.014;
        g.save(); g.translate(lerp(8 + i * 3, x, cfg.sp), lerp(-46 - i * 2, y, cfg.sp));
        g.scale(1 / cfg.w, 1 / cfg.hk); g.rotate(lerp(closed, a, cfg.sp)); g.scale(1, cfg.fk);
        drawSprite(g, parts.prims[i]); g.restore();
      }
      drawSprite(g, parts.hand);
      g.restore(); g.restore();
    };
    drawHand(); // the coverts of the arm lie over the base of the hand
    g.save(); g.scale(cfg.w, cfg.ak); drawSprite(g, parts.arm); g.restore();
    g.restore();
  }
  // two-bone leg from hip to foot, heel bending backward; toes curled by `curl`
  function drawLeg(g, hip, foot, curl, far, dir = 1) {
    let dx = foot[0] - hip[0], dy = foot[1] - hip[1]; const d = Math.hypot(dx, dy) || 1;
    const sc = Math.max(1, d / (LEG_A + LEG_B) * 1.0001), a = LEG_A * sc, b = LEG_B * sc;
    const ux = dx / d, uy = dy / d, px = uy, py = -ux;
    const x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x));
    const heel = [hip[0] + ux * x + px * h * dir, hip[1] + uy * x + py * h * Math.abs(dir)];
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    const legC = far ? '#24232a' : C.leg;
    // feathered thigh ("trousers"), blending into the belly
    g.strokeStyle = far ? '#0d0e14' : C.body; g.lineWidth = 11;
    g.beginPath(); g.moveTo(hip[0], hip[1]); g.lineTo(lerp(hip[0], heel[0], 0.8), lerp(hip[1], heel[1], 0.8)); g.stroke();
    g.strokeStyle = rgba(C.sheen, 0.35); g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(hip[0] - 2, hip[1] + 2); g.lineTo(lerp(hip[0], heel[0], 0.7) - 2, lerp(hip[1], heel[1], 0.7)); g.stroke();
    // tarsus
    g.strokeStyle = legC; g.lineWidth = 4.2;
    g.beginPath(); g.moveTo(heel[0], heel[1]); g.lineTo(foot[0], foot[1]); g.stroke();
    if (!far) { g.strokeStyle = rgba(C.legLight, 0.5); g.lineWidth = 1; g.beginPath(); g.moveTo(heel[0] - 1.2, heel[1] + 2); g.lineTo(foot[0] - 1.2, foot[1] - 2); g.stroke(); }
    // toes: three forward, one back. curl 0 = flat on the ground, 1 = closed fist
    g.strokeStyle = legC; g.lineWidth = 3;
    const toe = (base, len, ang) => {
      const a1 = ang + curl * 1.1 * Math.sign(Math.cos(ang) || 1) * -1;
      const m = [foot[0] + Math.cos(ang + (a1 - ang) * 0.4) * len * 0.55, foot[1] + Math.sin(ang + (a1 - ang) * 0.4) * len * 0.55];
      const e = [m[0] + Math.cos(a1 + (a1 - ang) * 0.8) * len * 0.5 * (1 - curl * 0.3), m[1] + Math.sin(a1 + (a1 - ang) * 0.8) * len * 0.5 * (1 - curl * 0.3)];
      g.beginPath(); g.moveTo(foot[0], foot[1]); g.quadraticCurveTo(m[0], m[1], e[0], e[1]); g.stroke();
    };
    // flat toes sit on the ground (y = 0 when the foot is planted at FOOT_Y); they point round as she turns
    const td = (dir < 0 ? -1 : 1) * Math.max(Math.abs(dir), 0.3);
    g.translate(foot[0], foot[1]); g.scale(td, 1); g.translate(-foot[0], -foot[1]);
    toe(foot, 15, Math.PI - 0.2); toe(foot, 13, Math.PI - 0.05); toe(foot, 11, Math.PI - 0.32);
    g.lineWidth = 2.6; toe(foot, 10, 0.25);
    g.restore();
  }
  function drawEye(g, x, y, open, happy, R) {
    // the kit.js button eye on a thin warm-light rim (as crow.js' eye reads on the black head)
    if (open > 0.12 && happy < 0.5) {
      g.fillStyle = 'rgba(228,221,207,0.95)';
      g.beginPath(); g.ellipse(x, y, R + 2.4, R * 0.95 * open + 2.4, 0, 0, 7); g.fill();
      buttonEye(g, x, y, open, { R });
    } else {
      g.save(); g.strokeStyle = 'rgba(232,228,220,0.9)'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath();
      if (happy >= 0.5) g.arc(x, y + R * 0.7, R * 1.15, Math.PI * 1.2, Math.PI * 1.8); else g.arc(x, y - R * 0.6, R * 1.15, Math.PI * 0.2, Math.PI * 0.8);
      g.stroke(); g.restore();
    }
  }
  function drawHead(g, R, st) {
    const { H, ha, turn, sO } = R.head, { c, sx } = headTurnK(turn);
    g.save(); g.translate(H[0], H[1]); g.scale(sO, 1); g.rotate(ha);
    // beak (under the head feathers): foreshortened as the head turns
    const open = clamp(R.head.beak);
    g.save(); g.translate(BEAK_PIV[0] * sx, BEAK_PIV[1]); g.scale(c, 1); g.translate(-BEAK_PIV[0], -BEAK_PIV[1]);
    g.save(); g.translate(BEAK_PIV[0], BEAK_PIV[1]); g.rotate(open * 0.28); g.translate(-BEAK_PIV[0], -BEAK_PIV[1]); drawSprite(g, beakUp); g.restore();
    g.save(); g.translate(BEAK_PIV[0], BEAK_PIV[1]); g.rotate(-open * 0.42); g.translate(-BEAK_PIV[0], -BEAK_PIV[1]); drawSprite(g, beakLo); g.restore();
    if (st.pebble) { const gp = rot([GRIP[0] - BEAK_PIV[0], GRIP[1] - BEAK_PIV[1]], -open * 0.12); g.save(); g.translate(BEAK_PIV[0] + gp[0], BEAK_PIV[1] + gp[1]); g.scale(1 / Math.max(0.3, Math.abs(c)), 1); drawSprite(g, pebble); g.restore(); }
    g.restore();
    g.save(); g.scale(sx, 1); drawSprite(g, head); g.restore();
    if (Math.abs(c) < 0.4) { // the beak seen end-on as the head turns through the front
      g.save(); g.globalAlpha *= 1 - Math.abs(c) / 0.4; g.fillStyle = C.beak; g.beginPath(); g.ellipse(BEAK_PIV[0] * sx * 0.95, 8, 7, 8, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(160,156,170,0.6)'; g.beginPath(); g.arc(BEAK_PIV[0] * sx * 0.95 - 1, 5, 2.2, 0, 7); g.fill(); g.restore();
    }
    // eyes and cheeks sit on the sides of a round head: each is drawn where it is on the sphere, narrowed as it
    // turns away, so the profile shows one eye and the front-on view shows both
    const e = R.head, yaw = Math.PI * clamp(turn);
    const R0 = EYE_R * (1 + 0.15 * clamp(e.big));
    const eo = clamp(e.eye * (1 + 0.15 * clamp(e.big)), 0, 1.15) * (1 - clamp((e.happy - 0.4) / 0.5));
    // (with `turn` at 0 this is exactly the old single-eye placement used by headTurn glances and the sleep tuck)
    const k3 = clamp((R.head.turnH || 0) / 0.15);
    for (const side of [-1, 1]) {
      const al = yaw + side * EYE_AZ, ez = Math.sin(al);
      let ex = -Math.cos(al) * EYE_RAD, ws = clamp(ez / Math.sin(EYE_AZ)), fade = clamp((ez - 0.06) / 0.2);
      if (side > 0) { ex = lerp(EYE[0] * c, ex, k3); ws = lerp(0.55 + 0.45 * Math.abs(c), ws, k3); fade = lerp(1, fade, k3); }
      else fade *= k3;
      if (fade <= 0.001) continue;
      g.save(); g.globalAlpha *= fade;
      const wb = side > 0 ? lerp(Math.abs(c), clamp(ez / Math.sin(EYE_AZ)), k3) : ws, bx = side > 0 && k3 === 0 ? -14 * c : ex * 1.17;
      pool(g, bx, 13, 9 * (0.5 + 0.5 * wb), 6, '#d08a96', 0.42 * e.blush);
      g.translate(ex, EYE[1] - e.look * 1.5); g.scale(ws, 1);
      drawEye(g, 0, 0, eo, e.happy, R0);
      g.restore();
    }
    g.restore();
  }

  // ---- assemble a rig from the per-part postures
  function rig(raw, ph, pb, pw, pt) {
    const rd = [raw.rdx, raw.rdy];
    // turning round: body shapes (body, wings, hips, tail root) and points through the middle (neck, head)
    const yB = yawOf(pb.turnB || 0, 0.42), yT = yawOf(pt.turnT || 0, 0.3);
    const Mb = bodyMat(pb), M = (p) => add(yB.shape(Mb(p)), rd);
    const R = { rd, body: pb, M, Mb, yB, yT };
    const hy = headYaw(ph.turnH || 0, ph.turn);
    R.head = { H: add(yB.point(ph.H), rd), ha: ph.ha, turn: hy.yaw, sO: hy.sO, turnH: ph.turnH || 0, beak: ph.beak, eye: ph.eye, happy: ph.happy, look: ph.look, big: ph.big, blush: ph.blush };
    R.N = add(yB.point(Mb(N0)), rd); R.sleepK = ph.sleepK || 0;
    // wings
    // Folded, the wing is crow.js' sleek folded-wing painting; small lifts, droops and effort flicks just turn it
    // about the shoulder. When it really opens (hop, idea, flight) it becomes the two-part arm + hand rig: the swap
    // happens at the folded configuration, halfway through a fast unfold (3-5 frames), never as a cross-fade.
    const liftRot = -0.42 * clamp(pw.wLift / 0.35);
    const flick = pw.wFlap > 0 ? -clamp(pw.wFlap) * (0.08 + 0.42 * (0.5 - 0.5 * Math.cos(((raw.t || 0) - LAG.wing) * pw.flapRate * TAU))) : 0;
    R.foldRot = liftRot + flick + 0.16 * clamp(pw.wDroop);
    R.open = Math.max(clamp(pw.fly), ease((pw.wLift - 0.35) / 0.25));
    let T = mixW(FOLD, RAISED, clamp((pw.wLift - 0.35) / 0.65));
    if (pw.fly > 0) T = mixW(T, pw.wingCfg || beatWing(0), clamp(pw.fly));
    const cfg = mixW(FOLD, T, clamp((R.open - 0.5) / 0.35));
    cfg.a += liftRot;
    R.wing = cfg; R.wingDrop = pw.wDroop * 4;
    R.tail = { a: pb.rot + pt.tail, fan: pt.fan };
    // legs: planted feet come from the walk phase (exact), tucked feet ride along with the hips
    const ph0 = raw.walkPhase, air = clamp(raw.air);
    const feet = [];
    const trn = clamp(raw.turnRaw || 0);
    for (const [hip, off, isNear] of [[HIP_F, 0.5, false], [HIP_N, 0, true]]) {
      let [fx, fy, curl] = walkFoot(ph0 + off + 0.05);
      if (trn > 0) { // turning round on the spot: one foot steps round, then the other (planted in between)
        const u = clamp((trn - (isNear ? 0.12 : 0.45)) / 0.33), e = easeInOut(u), lift = Math.sin(Math.PI * u);
        fx = lerp(fx, -fx, e); fy -= 11 * lift; curl = Math.max(curl, 0.7 * lift);
      }
      let f = [fx + rd[0], fy + rd[1]], cu = curl;
      if (isNear && raw.footUp > 0) { const u = clamp(raw.footUp); f = [lerp(f[0], 0, u * 0.6), f[1] - 15 * u]; cu = Math.max(cu, u * 0.85); }
      const hw = M(hip);
      if (air > 0) {
        const tk = add(hw, rot([raw.tuck[0] + (isNear ? 0 : 6), raw.tuck[1]], pb.rot * 0.5));
        f = [lerp(f[0], tk[0], air), lerp(f[1], tk[1], air)]; cu = lerp(cu, raw.tuckCurl, air);
      }
      feet.push({ hip: hw, foot: f, curl: cu, far: !isNear, dir: yB.c });
    }
    R.feet = feet;
    return R;
  }
  function postures(st) {
    const raw = solve(st, 0); raw.walkPhase = st.walk || 0; raw.t = st.t || 0; raw.turnRaw = st.turn || 0;
    return raw;
  }
  function rigFromState(st) { const p = postures(st); return rig(p, p, p, p, p); }
  function rigAt(poseFn, t, o = {}) {
    const since = o.since ?? -1e9, cache = new Map();
    const cur = poseFn(t); cache.set(t, cur);
    const raw = solve(cur, 0); raw.walkPhase = cur.walk || 0; raw.t = t; raw.turnRaw = cur.turn || 0;
    const f = (k) => ({ ...cur, ...filtered(poseFn, t, K[k], since, cache), t });
    const ph = solve(f('head'), LAG.head), pb = solve(f('body'), LAG.body), pw = solve(f('wing'), LAG.wing), pt = solve(f('tail'), LAG.tail);
    return { R: rig(raw, ph, pb, pw, pt), st: cur };
  }

  function paint(g, R, st) {
    const b = R.body, Mb = R.Mb;
    // the body's own space (profile coordinates), with the turn's yaw applied: body, wings and tail draw in here
    const bodySpace = () => { g.translate(R.rd[0], R.rd[1]); g.translate((R.yB.c - R.yB.k) * BC[0], 0); g.scale(R.yB.k, 1); };
    g.save();
    // far wing, tail, legs, neck, body, head, near wing
    const folded = R.open < 0.5;
    const foldAt = (sp, sh, rot) => { g.save(); bodySpace(); g.translate(sh[0], sh[1]); g.rotate(b.rot + rot); g.translate(-SH_N[0], -SH_N[1]); drawSprite(g, sp); g.restore(); };
    const wingAt = (parts, sh, far) => { g.save(); bodySpace(); drawWing(g, parts, sh, b.rot, R.wing, far); g.restore(); };
    if (folded) foldAt(wingFoldFar, add(Mb(SH_F), [0, R.wingDrop]), R.foldRot * 0.8 + 0.07);
    else wingAt(W_FAR, add(Mb(SH_F2), [0, R.wingDrop]), true);
    g.save(); bodySpace(); const tp = Mb(T0); g.translate(tp[0], tp[1]); g.scale(R.yT.k / R.yB.k, 1); g.rotate(R.tail.a); g.scale(1, 1 + R.tail.fan * 0.35); g.translate(-T0[0], -T0[1]); drawSprite(g, tail); g.restore();
    if (st.legs !== false) for (const f of R.feet) drawLeg(g, f.hip, f.foot, f.curl, f.far, f.dir);
    // neck: stretched between the neck base on the body and the head; drawn BEHIND the body so it only shows where the head moves out
    const N = R.N, H = R.head.H, dx = H[0] - N[0], dy = H[1] - N[1], L = Math.hypot(dx, dy);
    g.save(); g.translate((N[0] + H[0]) / 2, (N[1] + H[1]) / 2); g.rotate(Math.atan2(dy, dx)); g.scale(Math.max(0.8, (L + 40) / 70), 1 + 0.05 * clamp(b.fl)); drawSprite(g, neck, 1 - clamp(R.sleepK)); g.restore();
    g.save(); bodySpace(); const hp = Mb(HP); g.translate(hp[0], hp[1]); g.rotate(b.rot); g.scale(b.sx, b.sy); g.translate(-HP[0], -HP[1]); drawSprite(g, body); g.restore();
    drawHead(g, R, st);
    if (folded) foldAt(wingFold, add(Mb(SH_N), [0, R.wingDrop]), R.foldRot);
    else wingAt(W_NEAR, add(Mb(SH_N), [0, R.wingDrop]), false);
    g.restore();
  }
  // o (optional): { x, y, scale, face } = the stager's own transform, translate(x, y) scale(face * scale, scale);
  // with any of them given, the result is in that (world/page) space instead of the crow's local space
  const tipOf = (R, o = {}) => {
    const { H, ha, turn, sO } = R.head;
    const tl = headTipLocal(turn), { c, sx } = headTurnK(turn);
    const gl = [BEAK_PIV[0] * sx + (GRIP[0] - BEAK_PIV[0]) * c, GRIP[1]];
    const m = (p) => { const r = rot(p, ha); return add(H, [sO * r[0], r[1]]); };
    const p = m(tl), q = m(gl);
    let angle = ha + (c < 0 ? 0 : Math.PI); if (sO < 0) angle = Math.PI - angle;
    const out = { x: p[0], y: p[1], angle, gripX: q[0], gripY: q[1] };
    if (o.x === undefined && o.y === undefined && o.scale === undefined && o.face === undefined) return out;
    const f = o.face ?? 1, k = o.scale ?? 1, X = o.x ?? 0, Y = o.y ?? 0;
    return { x: X + f * k * out.x, y: Y + k * out.y, angle: f < 0 ? Math.PI - out.angle : out.angle, gripX: X + f * k * out.gripX, gripY: Y + k * out.gripY };
  };

  return {
    STRIDE,
    draw(g, st = {}) { paint(g, rigFromState(st), st); },
    drawAt(g, poseFn, t, o = {}) { const { R, st } = rigAt(poseFn, t, o); paint(g, R, st); },
    beakTip(st = {}, o = {}) { return tipOf(rigFromState(st), o); },
    beakTipAt(poseFn, t, o = {}) { return tipOf(rigAt(poseFn, t, o).R, o); },
    // where the feet (ankles) are, [far, near], in local space: footprints, perches, checks
    feet(st = {}) { return rigFromState(st).feet.map((f) => ({ x: f.foot[0], y: f.foot[1] })); },
    feetAt(poseFn, t, o = {}) { return rigAt(poseFn, t, o).R.feet.map((f) => ({ x: f.foot[0], y: f.foot[1] })); },
    drawPebble(g, x, y, r = 0) { g.save(); g.translate(x, y); g.rotate(r); drawSprite(g, pebble); g.restore(); },
    // a soft shadow on the ground under the crow; height: how far the root is above that ground (local units)
    shadow(g, st = {}, height = 0) {
      const p = solve(st, 0), hgt = height - p.rdy;
      g.save(); g.translate(0, height);
      const k = 1 / (1 + hgt / 120);
      g.globalAlpha *= 0.5 * k; pool(g, 20, 2, 110 * (0.7 + 0.3 * k), 14, '#3a2e28', 0.5); g.restore();
    },
  };
}
