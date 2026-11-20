// mice3: the storybook mouse (makeMouse2's look: button eyes, pink ears and nose, line-and-wash fur, little clothes)
// built as a RIG of painted parts driven by continuous parameters, with crow3's architecture.
//
// FACING (same convention as crow3): drawn facing LEFT, feet on the ground at y = 0, local units (a mouse is about
// 190 units tall at size 1, the same as makeMouse2). Mirror with scale(-1, 1) to face right. Walking moves the
// root to the LEFT (-x).
//
//   const m = makeMouseRig(res, seed, outfit)     outfit: an object or the name of a preset in OUTFITS
//                                                   ('elder', 'young', 'mother', 'baby', 'plump', 'shy', 'granny', 'plain')
//   m.draw(g, st)                    one pose (a plain state object, see below)
//   m.drawAt(g, poseFn, t, o)        draw with FOLLOW-THROUGH: poseFn(t) -> state. Each body part samples the recent
//                                    past of poseFn through its own damped spring: the head leads, the body follows,
//                                    arms and ears trail, the tail bends as a chain with a travelling delay (the tip
//                                    settles last). o.since: earliest time to sample (the shot's start, or the moment
//                                    you swap the facing after a turn). Root and planted feet are never delayed.
//   m.size                           the outfit's size (baby 0.62 ...): already applied inside draw, so all the
//                                    numbers below (STRIDE, offsets, helper results) are in YOUR local units.
//   m.STRIDE                         travel per walk cycle (two steps) in your units (= STRIDE * size)
//   m.pawsAt(poseFn, t, o) / m.paws(st, o)   -> { near: {x, y}, far: {x, y} } paw tips
//   m.mouthAt(poseFn, t, o) / m.mouth(st, o) -> { x, y } the mouth (whisper targets, crumbs, speech bubbles)
//   m.headAt(poseFn, t, o)           -> { x, y } head centre
//   m.feetAt(poseFn, t, o)           -> [far, near] {x, y, planted}
//        o = { x, y, scale, face } (your transform translate(x, y) scale(face * scale, scale)) gives page coordinates.
//   m.shadow(g, st, height)          soft ground shadow (draw it first); height = root above the ground
//   helpers: STRIDE, hopX(u), walkRest(p), climbOffset(u, dist, height) -> [dx, dy] (see climb)
//
// ---- state parameters (numbers; ease them, never step them. Weights 0..1. Event PHASES run 0 -> 1 once; any
//      value <= 0 or >= 1 means 'not happening'. Cycles (walk, dancePhase, clapPhase) keep counting up.)
//   t              time in seconds (breathing, blinks, glances, ear flicks, whisker twitches, tail sway)
//   life    0..1   idle life (default 1); reduced automatically while busy
//   mouth   0..1   talking: feed the voice envelope (one-piece mouth).  smile 0..1 (default 0.55)
//   eye     0..1   eye openness (blinks are automatic; noBlink: true)   happy 0..1  smiling closed eyes
//   eyeBig  0..1   wide eyes (surprise)    gaze -1..1 eyes look down / up    browUp 0..1   sad 0..1 (worried brows)
//   headTilt  rad  + = nose up             headTurn 0..1 head yaw toward the viewer (0.5 = looking at us)
//   headX, headY   head offset             lean rad (+ = forward)   crouch -0.5..1   bodyX, bodyY
//   earsBack 0..1  ears down / back        tailLift rad (+ = up)    tailCurl -1..1
//   turn    0..1   turn round to face the other way: head leads, body follows, tail last; near 0.5 she is seen
//                  front-on (two eyes, round face, muzzle pointing at us, ears either side). At 1 the picture is
//                  exactly the scale(-1, 1) picture at turn 0: swap the transform, set turn 0 and a fresh `since`.
//                  Standing, the feet step round one at a time (no sliding). Ease it over ~1-1.4 s.
//   walk           walk phase in CYCLES (unwrapped). Drive it from distance: walk = distance / m.STRIDE, and move
//                  the root left by exactly that distance: the feet never slide. walkAmt 0..1 (body bob, arm swing;
//                  set 1 while walking). Stop at walk = k/2 (walkRest) to stand with both feet down.
//   scurry  0..1   the quick mouse run: low lean, paws to the chest, tail streaming (combine with walk)
//   hop     0..1   one hop: 0-0.3 crouch (anticipation), 0.34 launch, arc, 0.72 touchdown (squash), settle by 1.
//                  hopHeight (default 40). Move the root horizontally by hopX(u) * distance (0 = jump on the spot).
//   climb   0..1   climb up onto something (a cotton reel) in front: look up, reach up, paws on the edge, pull up,
//                  scrabble, knee over, stand up on top. climbHeight (top surface, default 62), climbDist (default
//                  70: where the root ends on top), the front face of the thing at x = climbEdge (default 44) in
//                  front of the start root. The rig moves itself; when climb reaches 1, move your root by
//                  climbOffset(1, dist, height) (= [-dist, -height], facing left) and drop climb to 0.
//   sit     0..1   sit down on the bottom (feet out in front, toes up, tail round)
//   sleep   0..1   curl up asleep (in a nest): a round ball, head tucked, tail wrapped round, slow breathing.
//                  feet: false hides the feet
//   arms (weights): wave, point (pointUp -1..1), explain, clap (clapPhase cycles, auto from t), cheer, shrug,
//                  cover (paws over eyes; peek 0..1 lowers one paw), tummy, whisper (lean in, paw to mouth),
//                  shy (paws together under the chin)
//   toes    0..1   look down at the toes      ceiling 0..1  look up at the ceiling
//   sheepish 0..1  ears down, rubs the back of the head, small smile
//   dance   0..1   a happy jig (dancePhase in beats, default t * 2.2): bobs, alternate kicks, arms swinging; can
//                  be combined with walk (dancing round the candle)
//   nod, shake 0..1  nodding / shaking the head (automatic rhythm)
//   listen  0..1   ears perked, leaning in a little
//   yawn    0..1   phase of a big yawn (stretch, mouth wide, eyes squeezed)
//   chuckle 0..1   a warm little laugh (shoulders bob, happy eyes, paw on the tummy)
//   specs   0..1   phase: push the spectacles up the nose (elder)
//   stoop   0..1   elderly stoop (default from the outfit);  stickLean 0..1 lean on the stick (default 1 if it has one)
//   bounce  0..1   springy, eager idle (young)
import { wash, pool, ellipse, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, furEdge, rgba, shade, tint, mix, clamp, lerp, ease,
  penLine, hatch, looseWash, blooms, soften, path } from '../watercolor.js';
import { buttonEye, PAPER, INK } from './kit.js';
import { TAU, fr, easeInOut, bell, key, glance, event, kernel, makeFilter, ik2, tube, taper, smileMouth, rot, add, on } from './rig3.js';

// ---- geometry (internal space faces RIGHT like makeMouse2; the whole picture is mirrored at the end) ----
const BODY = smooth([[-38, -10], [-46, -60], [-36, -104], [-6, -126], [24, -118], [40, -84], [40, -40], [26, -8], [-6, 2]]);
const FBODY = smooth([[-40, -10], [-45, -58], [-36, -100], [-16, -120], [0, -124], [16, -120], [36, -100], [45, -58], [40, -10], [0, 2]]);
const BP = [-3, -4];          // body pivot (bottom): lean and squash happen about it
const BC = [-3, -62];         // body centre (the turn axis for the body shapes)
const NP = [18, -116];        // neck on the body
const NV0 = [4, -34];         // head centre relative to the neck -> (22, -150)
const SH = [14, -101], SHZ = 21, ARM_A = 25, ARM_B = 24;
const HIP = [-4, -16], HIPZ = 9, FOOT_Z = 8, FOOT_X = -3;
const TAIL_ROOT = [-34, -22], TAIL_N = 16, TAIL_L = 150;
// head-local (centre (0, 0), facing right)
const SKULL = smooth([[-40, 2], [-34, -20], [-14, -33], [10, -33], [30, -22], [40, -2], [34, 20], [14, 32], [-12, 32], [-32, 22]]);
const SNOUT = smooth([[8, -24], [30, -19], [48, -9], [60, 2], [66, 12], [60, 21], [44, 27], [24, 31], [8, 30], [-2, 4]]);
const FMUZ = smooth([[-17, -4], [0, -9], [17, -4], [21, 11], [13, 25], [0, 29], [-13, 25], [-21, 11]]);
const EAR = ellipse(0, 0, 21, 24, 24), EAR_IN = ellipse(1, 2, 13, 16, 20);
const FOOT = smooth([[-8, -6], [22, -8], [34, -2], [28, 3], [-8, 3]]);
const EYE_R3 = 34, EYE_AZ = Math.acos(22 / 34), EYE_Y = -6;
const NOSE = [62, 12], MOUTH = [48, 23];

export const STRIDE = 44;
const STICK_X = 50, STICK_G = 74; // the stick's planted tip ahead of the root, and from the tip up to the paw
const BETA = 0.6, LIFT = 10;
export const hopX = (u) => clamp((u - 0.34) / 0.38);
export const walkRest = (p) => Math.ceil(p * 2 - 1e-6) / 2;
const CLIMB_X = [[0, 0], [0.46, 0], [0.56, 0.06], [0.66, 0.3], [0.8, 0.8], [0.9, 0.97], [1, 1]];
const CLIMB_Y = [[0, 0], [0.2, 0], [0.3, 0.08], [0.44, 0.42], [0.56, 0.86], [0.64, 1.1], [0.74, 1.04], [0.86, 1], [1, 1]];
// facing left: the root moves by (-dist, -height) over a climb
export const climbOffset = (u, dist = 70, height = 62) => [-dist * key(clamp(u), CLIMB_X), -height * key(clamp(u), CLIMB_Y)];

// one foot of the walk cycle (relative x, lift, pitch): planted for q in [-0.05, 0.55], so walk = k/2 has both down
function walkFoot(q) {
  q = fr(q + 0.05) - 0.05;
  if (q < 0.55) return [-STRIDE * (q - 0.25), 0, 0];
  const u = (q - 0.55) / 0.4, s = Math.sin(Math.PI * u);
  return [-STRIDE * 0.3 + STRIDE * 0.6 * easeInOut(u), LIFT * s ** 0.8, 0.35 * s - 0.1 * Math.sin(TAU * u)];
}

// ---- outfits ----
export const OUTFITS = {
  elder: { fur: '#a39a92', belly: '#efe6d8', muzzle: '#d9d4cc', shawl: '#8a5a6a', shawlEdge: '#e8d8b8', spectacles: true, stick: true, stoop: 1, brows: '#f2ece0', size: 1.04 },
  granny: { fur: '#b0a49a', belly: '#efe2cf', dress: '#7a8aa8', apron: '#f4ecdc', spectacles: true, mobcap: '#f6efe2', size: 0.98 },
  young: { fur: '#b08a68', belly: '#f2e2c8', scarf: '#c8503c', scarfStripe: '#f0d070', cap: '#4a7a9a', capBand: '#e8d8b0', size: 0.9 },
  mother: { fur: '#a8988a', belly: '#efe2cf', dress: '#a898c0', apron: '#f4ecdc', mobcap: '#f6efe2', size: 0.96 },
  baby: { fur: '#c8b4a0', belly: '#f6ecdc', bib: '#f4ecdc', bibEdge: '#e8a0a0', size: 0.6, headScale: 1.2, bodyScale: 0.86 },
  plump: { fur: '#94806c', belly: '#efdcc0', waistcoat: '#6a8a4a', buttons: '#d8b050', size: 1.0, bodyW: 1.2 },
  shy: { fur: '#c4b8ac', belly: '#f4ece0', jumper: '#d89a8a', jumperRib: '#f0d8c8', earsBack: 0.35, size: 0.86 },
  plain: { fur: '#a8988a', belly: '#efe2cf' },
};

// ---- painting ----
function furry(res, shape, col, sd, o = {}) {
  return sprite(bbox(shape.concat(o.extra || [])), res, (g) => {
    wash(g, shape, { color: PAPER, opacity: 1, under: PAPER, seed: sd, edge: 0 });
    looseWash(g, shape, col, { opacity: o.op ?? 0.88, seed: sd + 1, shift: 2, reserves: 1 });
    if (o.blooms) blooms(g, shape, o.blooms, { n: 5, seed: sd + 2, alpha: 0.28 });
    if (o.paint) o.paint(g);
    shadeEdge(g, shape, { color: o.shadow || '#3a2a1e', alpha: 0.32, width: o.shadeW || 12, dx: o.sdx || 0, dy: o.sdy ?? -5 });
    soften(g, 0.9 * res);
    if (o.after) o.after(g);
    if (o.hatch) hatch(g, shape, { color: o.hatchColor || '#4a3a2e', count: o.hatch, len: o.hlen || 6, width: 0.7, alpha: 0.4, seed: sd + 3, dir: o.dir || (() => Math.PI) });
    if (o.fur) furEdge(g, shape, { color: col, count: o.fur, len: 5, width: 1.4, alpha: 0.7, seed: sd + 4, skip: o.furSkip });
    if (o.pen !== false) penLine(g, o.penPts || shape, { closed: !o.penPts, color: INK, w: o.pw || 1.8, alpha: 0.8, seed: sd + 5, weight: o.weight || ((t) => 0.3 + 0.8 * Math.max(0, Math.sin(t * Math.PI * 2 + (o.phase || 0)))) });
    if (o.last) o.last(g);
  }, { seed: sd + 6, grain: 0.12 });
}
const knit = (g, shape, col, sd, rows = 6) => { // a soft knitted texture: little v rows
  const b = bbox(shape);
  g.save(); path(g, shape); g.clip(); g.strokeStyle = rgba(shade(col, 0.35), 0.35); g.lineWidth = 0.8;
  for (let y = b.y0 + 4; y < b.y1; y += rows) for (let x = b.x0 + ((y / rows) % 2) * 3; x < b.x1; x += 6) { g.beginPath(); g.moveTo(x - 2, y - 2); g.lineTo(x, y + 1); g.lineTo(x + 2, y - 2); g.stroke(); }
  g.restore();
};

// the outfit painted on the PROFILE body (facing right)
function paintClothesProfile(g, o, s) {
  if (o.dress) {
    const dress = smooth([[-44, -56], [-24, -96], [20, -96], [40, -60], [44, -14], [-48, -14]]);
    wash(g, dress, { color: o.dress, opacity: 0.95, seed: s(11), under: true });
    shadeEdge(g, dress, { color: shade(o.dress, 0.5), alpha: 0.35, width: 10, dx: -4 });
    for (let k = 0; k < 7; k++) penLine(g, [[-40 + k * 12, -20], [-34 + k * 10, -80]], { color: shade(o.dress, 0.3), w: 0.8, alpha: 0.35 });
    if (o.apron) {
      const apron = smooth([[4, -90], [34, -86], [42, -40], [40, -16], [10, -16], [6, -60]]);
      wash(g, apron, { color: o.apron, opacity: 0.97, seed: s(12), under: true });
      penLine(g, apron, { closed: true, w: 1.3, alpha: 0.6 });
    }
    penLine(g, dress, { closed: true, w: 1.5, alpha: 0.7 });
    for (let k = 0; k < 9; k++) { g.fillStyle = rgba('#f4ecdc', 0.9); g.beginPath(); g.arc(-44 + k * 11, -14, 3.5, 0, 7); g.fill(); }
  }
  if (o.shawl) { // a knitted shawl over the shoulders, a point down the back, fringe
    const sh = smooth([[-40, -96], [-20, -120], [14, -122], [36, -100], [40, -78], [24, -74], [6, -84], [-14, -80], [-34, -56], [-44, -70]]);
    wash(g, sh, { color: o.shawl, opacity: 0.95, seed: s(15), under: true });
    knit(g, sh, o.shawl, s(16), 6);
    shadeEdge(g, sh, { color: shade(o.shawl, 0.5), alpha: 0.35, width: 10, dy: -5 });
    penLine(g, sh, { closed: true, w: 1.4, alpha: 0.7 });
    for (let k = 0; k < 8; k++) { const x = 40 - k * 10, y = -77 + (k > 3 ? (k - 3) * 6 : 0); penLine(g, [[x, y], [x - 1, y + 7]], { color: o.shawlEdge, w: 1.6, alpha: 0.9 }); }
  }
  if (o.waistcoat) {
    const wc = smooth([[-42, -36], [-38, -94], [-6, -118], [22, -112], [38, -84], [42, -44], [30, -22], [-24, -18]]);
    wash(g, wc, { color: o.waistcoat, opacity: 0.95, seed: s(13), under: true });
    shadeEdge(g, wc, { color: shade(o.waistcoat, 0.5), alpha: 0.4, width: 10, dx: -4 });
    wash(g, smooth([[16, -112], [34, -96], [40, -64], [32, -38], [22, -64]]), { color: '#f4ecdc', opacity: 0.95, seed: s(14) });
    penLine(g, [[18, -110], [10, -70], [28, -26]], { w: 1.4, alpha: 0.7 });
    for (const y of [-84, -64, -44]) { g.fillStyle = o.buttons || '#d8b050'; g.beginPath(); g.arc(14, y, 3.4, 0, 7); g.fill(); g.strokeStyle = rgba(INK, 0.6); g.lineWidth = 0.8; g.stroke(); }
    penLine(g, wc, { closed: true, w: 1.5, alpha: 0.7 });
  }
  if (o.jumper) {
    const j = smooth([[-44, -30], [-40, -92], [-10, -120], [22, -114], [40, -84], [42, -30], [0, -24]]);
    wash(g, j, { color: o.jumper, opacity: 0.95, seed: s(17), under: true });
    knit(g, j, o.jumper, s(18), 5);
    shadeEdge(g, j, { color: shade(o.jumper, 0.5), alpha: 0.35, width: 10, dx: -4 });
    const rib = smooth([[-45, -36], [42, -36], [42, -26], [-45, -26]]);
    wash(g, rib, { color: o.jumperRib, opacity: 0.9, seed: s(19) });
    for (let x = -42; x < 42; x += 4) penLine(g, [[x, -35], [x, -27]], { color: shade(o.jumperRib, 0.3), w: 0.7, alpha: 0.5 });
    penLine(g, j, { closed: true, w: 1.4, alpha: 0.7 });
  }
  if (o.bib) {
    const bib = smooth([[6, -108], [30, -104], [40, -80], [32, -62], [14, -64], [6, -86]]);
    wash(g, bib, { color: o.bib, opacity: 0.97, seed: s(20), under: true });
    penLine(g, bib, { closed: true, w: 1.2, alpha: 0.6 });
    penLine(g, bib.slice(10, 44), { color: o.bibEdge, w: 2.2, alpha: 0.7 });
  }
}
// the outfit seen FRONT-ON (symmetric, centred on x = 0)
function paintClothesFront(g, o, s) {
  if (o.dress) {
    const dress = smooth([[-46, -14], [-40, -60], [-26, -96], [26, -96], [40, -60], [46, -14]]);
    wash(g, dress, { color: o.dress, opacity: 0.95, seed: s(51), under: true });
    shadeEdge(g, dress, { color: shade(o.dress, 0.5), alpha: 0.35, width: 12, dy: -6 });
    for (let k = 0; k < 8; k++) penLine(g, [[-40 + k * 11.5, -18], [-26 + k * 7.5, -84]], { color: shade(o.dress, 0.3), w: 0.8, alpha: 0.3 });
    if (o.apron) {
      const ap = smooth([[-18, -92], [18, -92], [20, -60], [28, -18], [-28, -18], [-20, -60]]);
      wash(g, ap, { color: o.apron, opacity: 0.97, seed: s(52), under: true });
      penLine(g, ap, { closed: true, w: 1.3, alpha: 0.6 });
    }
    penLine(g, dress, { closed: true, w: 1.5, alpha: 0.7 });
    for (let k = 0; k < 9; k++) { g.fillStyle = rgba('#f4ecdc', 0.9); g.beginPath(); g.arc(-44 + k * 11, -14, 3.5, 0, 7); g.fill(); }
  }
  if (o.shawl) {
    const sh = smooth([[-44, -74], [-34, -104], [-14, -120], [14, -120], [34, -104], [44, -74], [26, -78], [8, -66], [0, -56], [-8, -66], [-26, -78]]);
    wash(g, sh, { color: o.shawl, opacity: 0.95, seed: s(55), under: true });
    knit(g, sh, o.shawl, s(56), 6);
    shadeEdge(g, sh, { color: shade(o.shawl, 0.5), alpha: 0.35, width: 10, dy: -5 });
    penLine(g, sh, { closed: true, w: 1.4, alpha: 0.7 });
    g.fillStyle = o.shawl; g.beginPath(); g.ellipse(0, -86, 6, 5, 0, 0, 7); g.fill(); g.strokeStyle = rgba(INK, 0.6); g.lineWidth = 1; g.stroke(); // the knot
    for (let k = 0; k < 9; k++) { const x = -40 + k * 10, y = -76 + Math.max(0, 4 - Math.abs(k - 4)) * 4; penLine(g, [[x, y], [x, y + 7]], { color: o.shawlEdge, w: 1.6, alpha: 0.9 }); }
  }
  if (o.waistcoat) {
    const wc = smooth([[-44, -36], [-38, -96], [-14, -118], [14, -118], [38, -96], [44, -36], [24, -18], [-24, -18]]);
    wash(g, wc, { color: o.waistcoat, opacity: 0.95, seed: s(53), under: true });
    shadeEdge(g, wc, { color: shade(o.waistcoat, 0.5), alpha: 0.4, width: 12, dy: -6 });
    wash(g, smooth([[-12, -116], [12, -116], [6, -70], [0, -48], [-6, -70]]), { color: '#f4ecdc', opacity: 0.95, seed: s(54) });
    penLine(g, [[-12, -114], [-2, -60], [-8, -22]], { w: 1.3, alpha: 0.6 }); penLine(g, [[12, -114], [2, -60], [8, -22]], { w: 1.3, alpha: 0.6 });
    for (const y of [-84, -64, -44]) { g.fillStyle = o.buttons || '#d8b050'; g.beginPath(); g.arc(-4, y, 3.4, 0, 7); g.fill(); g.strokeStyle = rgba(INK, 0.6); g.lineWidth = 0.8; g.stroke(); }
    penLine(g, wc, { closed: true, w: 1.5, alpha: 0.7 });
  }
  if (o.jumper) {
    const j = smooth([[-46, -30], [-40, -94], [-14, -120], [14, -120], [40, -94], [46, -30], [0, -24]]);
    wash(g, j, { color: o.jumper, opacity: 0.95, seed: s(57), under: true });
    knit(g, j, o.jumper, s(58), 5);
    shadeEdge(g, j, { color: shade(o.jumper, 0.5), alpha: 0.35, width: 12, dy: -6 });
    const rib = smooth([[-46, -36], [46, -36], [46, -26], [-46, -26]]);
    wash(g, rib, { color: o.jumperRib, opacity: 0.9, seed: s(59) });
    for (let x = -44; x < 46; x += 4) penLine(g, [[x, -35], [x, -27]], { color: shade(o.jumperRib, 0.3), w: 0.7, alpha: 0.5 });
    penLine(g, j, { closed: true, w: 1.4, alpha: 0.7 });
  }
  if (o.bib) {
    const bib = smooth([[-16, -110], [16, -110], [22, -86], [12, -66], [0, -62], [-12, -66], [-22, -86]]);
    wash(g, bib, { color: o.bib, opacity: 0.97, seed: s(60), under: true });
    penLine(g, bib, { closed: true, w: 1.2, alpha: 0.6 });
    penLine(g, bib.slice(6, 50), { color: o.bibEdge, w: 2.2, alpha: 0.7 });
  }
}

// ---- the pose solver ----
const DEF = { life: 1, eye: 1, smile: 0.55, hopHeight: 40, climbHeight: 62, climbDist: 70, climbEdge: 44, stickLean: 1 };
const PHASES = new Set(['hop', 'climb', 'yawn', 'specs', 'walk', 'dancePhase', 'clapPhase']);
const filtered = makeFilter(PHASES, DEF);
const ARMW = ['wave', 'point', 'explain', 'clap', 'cheer', 'shrug', 'cover', 'tummy', 'whisper', 'shy', 'rub', 'specsW', 'dance', 'chuckleW', 'yawnW',
  'reach', 'push', 'air', 'back', 'sleepW', 'sitW', 'scurry'];

function solve(st, out, dl = 0) {
  const O = out; // outfit
  const t = (st.t || 0) - dl, sz = O.size || 1;
  const v = (k) => st[k] ?? (k === 'stoop' ? (O.stoop || 0) : k === 'stickLean' ? (O.stick ? 1 : 0) : k === 'earsBack' ? (O.earsBack || 0) : DEF[k] ?? 0);
  const P = {
    lean: v('lean'), bx: v('bodyX'), by: v('bodyY'), sq: v('crouch') * 0.3, sxm: 0,
    nvx: v('headX'), nvy: v('headY'), ha: v('headTilt'), hturn: v('headTurn'),
    eye: v('eye'), happy: v('happy'), big: v('eyeBig'), gaze: v('gaze'), brow: v('browUp'), sad: v('sad'), mouth: v('mouth'), smile: v('smile'), mdeep: 11,
    earBack: v('earsBack'), earPerk: 0, flickN: 0, flickF: 0, whisk: 0, sniff: 0,
    tLift: v('tailLift'), tCurl: v('tailCurl'), tSway: 0, tWrap: 0, tDrag: 0, tFlat: 0,
    rdx: 0, rdy: 0, air: 0, shUp: 0, specsY: 0, breathA: 1, breathR: 1, W: {}, A: {},
  };
  const W = P.W;
  for (const k of ARMW) W[k] = 0;
  for (const k of ['wave', 'point', 'explain', 'clap', 'cheer', 'shrug', 'cover', 'tummy', 'whisper', 'shy']) W[k] = clamp(v(k));
  P.A.pointUp = v('pointUp'); P.A.peek = clamp(v('peek'));
  const hop = v('hop'), climb = v('climb'), sit = clamp(v('sit')), sleep = clamp(v('sleep')), dance = clamp(v('dance')), yawn = v('yawn'), specs = v('specs');
  const wa = clamp(v('walkAmt')), scurry = clamp(v('scurry')), stoop = clamp(v('stoop'));
  const busy = clamp(Math.max(on(hop), on(climb), sleep, dance, on(yawn) * 0.8, wa * 0.6, W.cover, W.whisper * 0.7, clamp(v('toes')), clamp(v('ceiling')), clamp(v('sheepish')) * 0.7,
    v('turn') > 0 && v('turn') < 1 ? 1 : 0, clamp(v('nod')), clamp(v('shake'))));
  const life = clamp(v('life')) * (1 - busy);

  // -- idle life: breathing, soft glances, blinks, ear flicks, whisker twitches, sniffing, tail sway
  const g1 = glance(t, 2.3, 3 + (O.seed || 0), 0.45), g2 = glance(t + 0.9, 3.4, 5 + (O.seed || 0), 0.6);
  P.ha += life * (0.06 * g1 + 0.02); P.hturn += life * 0.07 * Math.max(0, g2); P.nvx += life * 1.5 * g2; P.gaze += life * 0.25 * g1;
  P.lean += life * 0.018 * Math.sin(t * TAU * 0.11 + (O.seed || 0));
  const bl = event(t, 3.7, 0.2, 41 + (O.seed || 0));
  if (!st.noBlink && bl >= 0 && !(st.eyeBig > 0.3)) P.eye *= 1 - Math.sin(Math.PI * bl) ** 0.6;
  const fN = event(t + 1.3, 5.3, 0.4, 19 + (O.seed || 0)), fF = event(t + 2.9, 6.7, 0.4, 23 + (O.seed || 0));
  if (fN >= 0) P.flickN += Math.sin(Math.PI * fN) * Math.sin(fN * TAU * 1.5) * 0.35;
  if (fF >= 0) P.flickF += Math.sin(Math.PI * fF) * Math.sin(fF * TAU * 1.5) * 0.35;
  const sn = event(t + 0.4, 4.1, 0.7, 31 + (O.seed || 0));
  if (sn >= 0) { const e = Math.sin(Math.PI * sn); P.sniff += e * Math.sin(t * TAU * 7); P.whisk += e * 0.5 * Math.sin(t * TAU * 7 + 0.6); P.ha += life * e * 0.04; }
  P.whisk += 0.08 * Math.sin(t * TAU * 0.37);
  P.tCurl += 0.25 * Math.sin(t * TAU * 0.17 + 1) + 0.12 * Math.sin(t * TAU * 0.29);
  P.tLift += 0.06 * Math.sin(t * TAU * 0.13 + 2);
  P.tSway += Math.sin(t * TAU * 0.21);

  // -- elder stoop, young bounce
  if (stoop > 0) { P.lean += stoop * 0.16; P.nvx += stoop * 8; P.nvy += stoop * 6; P.ha += stoop * 0.14; P.tLift -= stoop * 0.12; P.breathR *= 1 - 0.2 * stoop; }
  const bounce = clamp(v('bounce'));
  if (bounce > 0) { const b = Math.sin(t * TAU * 1.7) ** 2; P.sq += bounce * 0.06 * b - 0.02 * bounce; P.nvy -= bounce * 3 * b; P.earPerk += bounce * 0.5; P.tLift += bounce * 0.15; P.tCurl += bounce * 0.2 * Math.sin(t * TAU * 1.7); }

  // -- walking / scurrying
  if (wa > 0) {
    const ph = v('walk'), s2 = Math.cos(ph * 2 * TAU);
    P.by -= wa * (2 + 2.5 * (1 + scurry) * (0.5 - 0.5 * s2));
    P.lean += wa * (0.05 + 0.02 * Math.sin(ph * TAU));
    P.ha -= wa * 0.03 * s2; P.nvy += wa * 1.5 * s2;
    P.A.swing = wa * Math.sin(ph * TAU);
    P.tDrag += wa * 0.5; P.tCurl += wa * 0.15 * Math.sin(ph * TAU * 2 - 1);
  }
  if (scurry > 0) { P.lean += scurry * 0.3; P.nvx += scurry * 6; P.nvy += scurry * 10; P.ha += scurry * 0.22; P.earBack += scurry * 0.5; W.scurry = scurry; P.tDrag += scurry; P.tLift -= scurry * 0.05; }

  // -- hop / jump
  if (hop > 0 && hop < 1) {
    const u = hop, H = v('hopHeight') / sz;
    P.sq += key(u, [[0, 0], [0.26, 0.32], [0.33, -0.22], [0.42, -0.08], [0.6, 0], [0.72, 0.04], [0.78, 0.3], [0.9, -0.03], [1, 0]]);
    P.lean += key(u, [[0, 0], [0.26, 0.16], [0.36, -0.12], [0.55, 0], [0.7, 0.1], [0.8, 0.1], [1, 0]]);
    if (u > 0.34 && u < 0.72) { const s = (u - 0.34) / 0.38; P.rdy -= H * 4 * s * (1 - s); }
    P.air = Math.max(P.air, key(u, [[0.33, 0], [0.4, 1], [0.66, 1], [0.72, 0]]));
    W.back += key(u, [[0, 0], [0.26, 1], [0.34, 0]]);
    W.air += key(u, [[0.28, 0], [0.4, 1], [0.62, 0.7], [0.76, 0], [1, 0]]);
    P.earBack += key(u, [[0.3, 0], [0.42, 0.7], [0.65, 0.4], [0.8, 0], [0.86, 0.3], [1, 0]]);
    P.tLift += key(u, [[0, 0], [0.26, 0.15], [0.4, -0.25], [0.66, 0.1], [0.78, 0.35], [1, 0]]);
    P.nvy += key(u, [[0, 0], [0.26, 6], [0.36, -6], [0.6, 0], [0.78, 7], [1, 0]]);
    P.ha += key(u, [[0, 0], [0.26, -0.08], [0.4, 0.1], [0.7, -0.05], [1, 0]]);
  }

  // -- climbing up onto something in front
  if (climb > 0 && climb < 1) {
    const u = climb, Hh = v('climbHeight') / sz, D = v('climbDist') / sz;
    P.rdx += D * key(u, CLIMB_X); P.rdy -= Hh * key(u, CLIMB_Y);
    P.sq += key(u, [[0, 0], [0.14, 0.22], [0.26, -0.12], [0.4, -0.18], [0.56, 0], [0.66, 0.12], [0.8, 0.02], [0.9, 0.1], [1, 0]]);
    P.lean += key(u, [[0, 0], [0.14, -0.06], [0.28, -0.1], [0.44, 0.08], [0.62, 0.5], [0.74, 0.42], [0.88, 0.04], [1, 0]]);
    P.ha += key(u, [[0, 0], [0.12, 0.4], [0.3, 0.34], [0.5, 0.2], [0.66, -0.2], [0.8, -0.05], [1, 0]]);
    P.nvy += key(u, [[0, 0], [0.12, -4], [0.6, 2], [0.7, 6], [1, 0]]);
    P.earBack += key(u, [[0.3, 0], [0.45, 0.6], [0.66, 0.5], [0.85, 0], [1, 0]]);
    P.tLift += key(u, [[0, 0], [0.3, -0.1], [0.5, -0.5], [0.66, 0.3], [0.85, 0.1], [1, 0]]);
    P.tCurl += key(u, [[0, 0], [0.5, -0.6], [0.7, 0.5], [1, 0]]);
    W.reach += key(u, [[0.12, 0], [0.26, 1], [0.6, 1], [0.66, 0]]);
    W.push += key(u, [[0.58, 0], [0.66, 1], [0.76, 1], [0.86, 0]]);
    W.back += key(u, [[0, 0], [0.12, 0.6], [0.2, 0]]);
    P.A.climb = u; P.A.edge = [v('climbEdge') / sz, -Hh];
    P.climbAir = key(u, [[0.3, 0], [0.38, 1], [0.66, 1], [0.7, 0]]);
  }

  // -- sit down
  if (sit > 0) { P.sq += sit * 0.16; P.lean -= sit * 0.1; P.by += sit * 1; P.tFlat += sit; W.sitW = sit; P.nvx -= sit * 2; P.ha += sit * 0.05; }

  // -- looking at the toes / up at the ceiling / sheepish / listen
  const toes = clamp(v('toes')), ceil = clamp(v('ceiling')), shp = clamp(v('sheepish')), listen = clamp(v('listen'));
  if (toes > 0) { P.ha -= toes * 0.5; P.nvy += toes * 7; P.nvx += toes * 3; P.gaze -= toes * 1.2; P.eye *= 1 - 0.15 * toes; P.lean += toes * 0.06; P.earBack += toes * 0.3; P.hturn += toes * 0.04 * Math.sin(t * TAU * 0.3); }
  if (ceil > 0) { P.ha += ceil * 0.6; P.nvx -= ceil * 5; P.nvy -= ceil * 2; P.gaze += ceil * 1.2; P.lean -= ceil * 0.07; P.hturn += ceil * 0.06; }
  if (shp > 0) { P.earBack += shp * 0.85; P.ha -= shp * 0.2; P.nvy += shp * 5; P.hturn += shp * 0.14; P.smile = lerp(P.smile, 0.35, shp); P.gaze -= shp * 0.4; P.sad += shp * 0.6; W.rub += shp; P.lean -= shp * 0.03; P.tCurl += shp * 0.4; }
  if (listen > 0) { P.earPerk += listen; P.lean += listen * 0.06; P.nvx += listen * 4; P.ha -= listen * 0.04; P.hturn += listen * 0.05; P.eye *= 1 + 0.08 * listen; }

  // -- gestures that drive the face too
  if (W.whisper > 0) { const w = W.whisper; P.lean += w * 0.14; P.nvx += w * 9; P.nvy += w * 5; P.ha -= w * 0.08; P.hturn += w * 0.06; P.smile = lerp(P.smile, 0.7, w); P.eye *= 1 - 0.2 * w; P.earBack += w * 0.15; }
  if (W.cheer > 0) { const w = W.cheer, b = Math.abs(Math.sin(t * TAU * 1.5)); P.happy = Math.max(P.happy, w * 0.9); P.mouth = Math.max(P.mouth, w * (0.45 + 0.15 * b)); P.smile = lerp(P.smile, 1, w); P.by -= w * 4 * b; P.ha += w * 0.14; P.earPerk += w * 0.6; P.tLift += w * 0.3; P.sq -= w * 0.05 * b; }
  if (W.clap > 0) { const w = W.clap, cp = st.clapPhase ?? t * 2.4; P.A.clapPhase = cp; const hit = Math.max(0, Math.cos(cp * TAU)) ** 6; P.happy = Math.max(P.happy, w * 0.6); P.mouth = Math.max(P.mouth, w * 0.3); P.smile = lerp(P.smile, 1, w); P.by += w * 1.5 * hit; P.ha += w * 0.05 * hit; P.tLift += w * 0.15; }
  if (W.shrug > 0) { const w = W.shrug; P.shUp += w * 6; P.ha += w * 0.08; P.hturn += w * 0.08; P.brow += w * 0.8; P.smile = lerp(P.smile, 0.3, w); P.nvy += w * 3; }
  if (W.cover > 0) { const w = W.cover; P.ha -= w * 0.22; P.nvy += w * 10; P.lean += w * 0.04; P.earBack += w * 0.4; P.smile = lerp(P.smile, 0.7, w); P.eye *= 1 - w * (1 - P.A.peek); }
  if (W.shy > 0) { const w = W.shy; P.ha -= w * 0.16; P.hturn += w * 0.14; P.earBack += w * 0.45; P.lean -= w * 0.03 * (1 + Math.sin(t * TAU * 0.35)); P.smile = lerp(P.smile, 0.6, w); P.gaze -= w * 0.3; P.tCurl += w * 0.6; }
  if (W.explain > 0) { const w = W.explain; P.ha += w * 0.05 * Math.sin(t * TAU * 0.7); P.brow += w * 0.3 * (0.5 + 0.5 * Math.sin(t * TAU * 0.7)); }
  if (W.point > 0) { const w = W.point; P.ha += w * 0.1 * (P.A.pointUp || 0); P.lean += w * 0.04; P.brow += w * 0.3; }
  if (W.wave > 0) { const w = W.wave; P.happy = Math.max(P.happy, w * 0.3); P.smile = lerp(P.smile, 0.9, w); P.hturn += w * 0.1; }

  // -- chuckle (elder): warm little laugh
  const chk = clamp(v('chuckle'));
  if (chk > 0) { const b = Math.max(0, Math.sin(t * TAU * 2.6)); P.happy = Math.max(P.happy, chk * 0.85); P.mouth = Math.max(P.mouth, chk * (0.12 + 0.28 * b)); P.smile = lerp(P.smile, 0.9, chk); P.by += chk * 1.6 * b; P.shUp += chk * 2 * b; P.ha += chk * (0.1 + 0.04 * b); W.chuckleW = chk; P.mdeep = 8; }
  // -- spectacles nudge (phase)
  if (specs > 0 && specs < 1) { W.specsW = key(specs, [[0, 0], [0.32, 1], [0.7, 1], [1, 0]]); P.specsY -= 3 * key(specs, [[0.38, 0], [0.5, 1], [1, 1]]) * (1 - key(specs, [[0.85, 0], [1, 1]])); P.ha -= 0.12 * bell(specs, 0.2, 0.9); P.nvy += 7 * bell(specs, 0.15, 0.95); P.eye *= 1 - 0.8 * bell(specs, 0.5, 0.62); P.gaze -= 0.3 * bell(specs, 0.3, 0.8); }

  // -- nod / shake
  const nod = clamp(v('nod')), shake = clamp(v('shake'));
  if (nod > 0) { const s = Math.sin(t * TAU * 1.7); P.ha -= nod * (0.06 + 0.12 * s); P.nvy += nod * 2 * s; P.eye *= 1 - nod * 0.1; }
  if (shake > 0) { const s = Math.sin(t * TAU * 2.0); P.hturn += shake * 0.11 * s; P.ha -= shake * 0.06; P.earBack += shake * 0.2; P.flickN += shake * 0.12 * s; P.flickF -= shake * 0.12 * s; }

  // -- dance: a happy jig (beats)
  if (dance > 0) {
    const b = st.dancePhase ?? t * 2.2, sb = Math.sin(Math.PI * b), ab = Math.abs(sb);
    P.A.beat = b; P.A.dance = dance;
    P.rdy -= dance * 7 * ab ** 1.5; P.sq += dance * 0.1 * (1 - ab) ** 3 - dance * 0.04 * ab;
    P.lean += dance * 0.07 * sb; P.ha += dance * (0.08 + 0.1 * Math.sin(Math.PI * b + 0.6)); P.hturn += dance * 0.1 * (0.5 + 0.5 * Math.sin(Math.PI * b * 0.5));
    P.happy = Math.max(P.happy, dance * 0.85); P.smile = lerp(P.smile, 1, dance); P.mouth = Math.max(P.mouth, dance * 0.22);
    P.tSway += dance * 1.5 * sb; P.tCurl += dance * 0.5 * sb; P.tLift += dance * 0.2; W.dance = dance; P.earPerk += dance * 0.3;
    P.flickN += dance * 0.15 * sb; P.flickF -= dance * 0.15 * sb;
  }

  // -- yawn (phase)
  if (yawn > 0 && yawn < 1) {
    const u = yawn;
    P.mouth = Math.max(P.mouth, key(u, [[0, 0], [0.15, 0.2], [0.3, 1], [0.6, 1], [0.75, 0.1], [0.82, 0.25], [0.9, 0]]));
    P.mdeep = lerp(11, 16, key(u, [[0.2, 0], [0.3, 1], [0.6, 1], [0.75, 0]]));
    P.ha += key(u, [[0, 0], [0.15, -0.05], [0.32, 0.38], [0.6, 0.42], [0.8, 0.02], [1, 0]]);
    P.eye *= 1 - key(u, [[0.15, 0], [0.3, 1], [0.64, 1], [0.8, 0.5], [0.9, 0.3], [1, 0]]);
    P.sq += key(u, [[0, 0], [0.15, 0.08], [0.32, -0.14], [0.6, -0.16], [0.78, 0.04], [1, 0]]);
    P.earBack += key(u, [[0.2, 0], [0.32, 0.8], [0.62, 0.8], [0.8, 0]]);
    W.yawnW = key(u, [[0.12, 0], [0.32, 1], [0.6, 1], [0.8, 0]]);
    P.tLift += key(u, [[0.2, 0], [0.4, 0.3], [0.7, 0], [1, 0]]); P.tCurl += key(u, [[0.2, 0], [0.45, 0.8], [0.8, 0]]);
  }

  // -- breathing
  const br = Math.sin(t * TAU * 0.3 * P.breathR);
  P.breath = br * P.breathA;

  // -- asleep: overrides
  if (sleep > 0) {
    const s = sleep, k = key(s, [[0, 0], [0.7, 1]]);
    P.lean = lerp(P.lean, 0.3, k); P.sq = lerp(P.sq, 1.05, k); P.sxm = lerp(P.sxm, 0.08, k); P.bx = lerp(P.bx, -14, k); P.by = lerp(P.by, 0, k);
    P.nvx = lerp(P.nvx, 22, k); P.nvy = lerp(P.nvy, 34, k); P.ha = lerp(P.ha, -0.3, k); P.hturn = lerp(P.hturn, 0.12, k);
    P.eye *= 1 - key(s, [[0, 0], [0.4, 1]]); P.happy *= 1 - s; P.big *= 1 - s; P.mouth *= 1 - s; P.smile = lerp(P.smile, 0.7, s); P.gaze *= 1 - s;
    P.earBack = lerp(P.earBack, 0.55, k); P.earPerk *= 1 - s; P.tWrap = s; P.tLift = lerp(P.tLift, 0, k); P.tCurl = lerp(P.tCurl, 0, k); P.tSway *= 1 - s;
    for (const kk of ARMW) W[kk] *= 1 - k; W.sleepW = k;
    P.breath = lerp(P.breath, 2.2 * Math.sin(t * TAU * 0.19), s); P.whisk *= 1 - 0.7 * s; P.sniff *= 1 - s;
  }

  // -- turning round: head leads, body follows, tail last
  const tr = clamp(v('turn'));
  P.turnH = ease(tr / 0.7); P.turnB = ease((tr - 0.12) / 0.76); P.turnT = ease((tr - 0.2) / 0.78);
  P.turnRaw = tr; P.stickLean = clamp(v('stickLean'));

  // ---- derived body transform
  const bS = O.bodyScale || 1, bW = O.bodyW || 1;
  P.sx = (1 + P.sq * 0.22 + P.sxm + P.breath * 0.006) * bW * bS;
  P.sy = (1 - P.sq * 0.25 + P.breath * 0.014) * bS;
  P.rot = P.lean;
  const M = bodyMat(P);
  P.N = M(NP);
  const nv = rot([NV0[0] + P.nvx, NV0[1] * (O.headScale ? 1 + (O.headScale - 1) * 0.6 : 1) + P.nvy], P.lean * 0.55);
  P.H = add(P.N, nv);
  P.haT = P.ha - P.lean * 0.4;
  return P;
}
function bodyMat(P) {
  const c = Math.cos(P.rot), s = Math.sin(P.rot);
  return (p) => {
    const x = (p[0] - BP[0]) * P.sx, y = (p[1] - BP[1]) * P.sy;
    return [BP[0] + P.bx + x * c - y * s, BP[1] + P.by + x * s + y * c];
  };
}
// pseudo-3D: a body point (x, y in the side plane, z toward the viewer at turn 0) seen at yaw phi (0 = facing right,
// pi = facing left). Hidden points slide a little toward the back, which separates near and far limbs in profile.
const OBL = 0.22;
function proj3(x, y, z, phi, obl = OBL) {
  const c = Math.cos(phi), s = Math.sin(phi), depth = x * s + z * c;
  return { x: x * c - z * s + obl * depth * c, y, d: depth };
}

// ---- springs ----
const K = { head: kernel(3.2, 0.6, 0.45, 9), body: kernel(2.4, 0.5, 0.7, 11), arm: kernel(2.2, 0.45, 0.8, 11), ear: kernel(2.0, 0.32, 1.0, 13), tail: kernel(1.7, 0.38, 0.9, 9) };
const LAG = { head: 0, body: 0.05, arm: 0.08, ear: 0.1, tail: 0.12 };
const TAIL_DELAYS = [0, 0.07, 0.14, 0.22, 0.3, 0.38];

export function makeMouseRig(res = 1, seed = 51, outfit = {}) {
  const O = { ...(typeof outfit === 'string' ? OUTFITS[outfit] : outfit) };
  O.seed = seed % 7;
  const size = O.size || 1;
  const s = (n) => seed * 100 + n;
  const fur = O.fur || '#a8988a', belly = O.belly || '#efe2cf', pink = '#dfa49a';
  const sleeve = O.sleeve || (O.jumper ? O.jumper : O.waistcoat ? fur : O.dress ? O.dress : fur);
  const muz = O.muzzle;

  // -- sprites
  const body = furry(res, BODY, fur, s(10), { blooms: [tint(fur, 0.1), shade(fur, 0.1)], hatch: 60, fur: 30, paint: (g) => {
    glaze(g, BODY, 26, -60, 12, 40, belly, 0.8);
    paintClothesProfile(g, O, s);
  } });
  const fbody = furry(res, FBODY, fur, s(70), { blooms: [tint(fur, 0.1), shade(fur, 0.1)], hatch: 60, fur: 30, sdy: -5, paint: (g) => {
    glaze(g, FBODY, 0, -58, 24, 44, belly, 0.85);
    paintClothesFront(g, O, s);
  } });
  const skull = furry(res, SKULL, fur, s(20), { blooms: [tint(fur, 0.1)], hatch: 34, fur: 22, sdy: -6, paint: (g) => {
    if (muz) glaze(g, SKULL, 20, 14, 22, 16, muz, 0.7);
    glaze(g, SKULL, 0, 18, 26, 12, belly, 0.35);
  } });
  const snout = furry(res, SNOUT, muz ? mix(fur, muz, 0.55) : fur, s(25), { hatch: 16, fur: 10, sdy: -4, furSkip: (x) => x < 26,
    penPts: SNOUT.slice(4, 66), paint: (g) => { glaze(g, SNOUT, 50, 22, 22, 9, muz || belly, 0.75); if (muz) glaze(g, SNOUT, 40, 12, 24, 14, muz, 0.5); } });
  const fmuz = furry(res, FMUZ, muz ? mix(fur, muz, 0.55) : fur, s(28), { hatch: 10, fur: 0, sdy: -3, pen: false,
    paint: (g) => { glaze(g, FMUZ, 0, 18, 16, 10, muz || belly, 0.85); } });
  const ear = sprite(bbox(EAR), res, (g) => {
    wash(g, EAR, { color: fur, opacity: 0.95, under: PAPER, seed: s(30) });
    wash(g, EAR_IN, { color: '#e8a09a', opacity: 0.8, seed: s(31) }); glaze(g, EAR_IN, -2, -6, 6, 8, '#ffe8e2', 0.6);
    penLine(g, EAR, { closed: true, w: 1.5, alpha: 0.75 });
  }, { granulate: false });
  const foot = sprite(bbox(FOOT), res, (g) => { wash(g, FOOT, { color: pink, opacity: 0.95, under: PAPER, seed: s(40) }); penLine(g, FOOT, { closed: true, w: 1.2, alpha: 0.6 }); }, { granulate: false });
  const CAP = smooth([[-30, -14], [-26, -32], [-10, -42], [10, -42], [26, -32], [30, -14], [0, -10]]);
  const cap = (O.cap || O.mobcap) ? sprite(bbox(CAP.concat([[0, -60], [-36, -4], [36, -4]])), res, (g) => {
    if (O.cap) {
      wash(g, CAP, { color: O.cap, opacity: 0.96, under: PAPER, seed: s(45) }); knit(g, CAP, O.cap, s(46), 5);
      shadeEdge(g, CAP, { color: shade(O.cap, 0.5), alpha: 0.35, width: 8, dy: -4 });
      const band = smooth([[-31, -20], [0, -15], [31, -20], [31, -12], [0, -7], [-31, -12]]);
      wash(g, band, { color: O.capBand, opacity: 0.95, seed: s(47) }); penLine(g, band, { closed: true, w: 1.1, alpha: 0.6 });
      penLine(g, CAP, { closed: true, w: 1.4, alpha: 0.75 });
      const pom = ellipse(0, -46, 9, 8, 16); wash(g, pom, { color: O.capBand, opacity: 0.95, under: PAPER, seed: s(48) }); furEdge(g, pom, { color: shade(O.capBand, 0.2), count: 30, len: 4, width: 1.2, alpha: 0.8, seed: s(49) }); penLine(g, pom, { closed: true, w: 1, alpha: 0.5 });
    } else { // a frilled mob cap
      const mc = smooth([[-32, -10], [-30, -30], [-14, -42], [14, -42], [30, -30], [32, -10], [0, -16]]);
      wash(g, mc, { color: O.mobcap, opacity: 0.97, under: PAPER, seed: s(45) });
      shadeEdge(g, mc, { color: '#b8a890', alpha: 0.35, width: 8, dy: -4 });
      penLine(g, mc, { closed: true, w: 1.2, alpha: 0.6 });
      for (let k = 0; k < 11; k++) { const a = Math.PI * (1.05 + k * 0.09); const x = Math.cos(a) * 33, y = -12 + Math.sin(a) * 30; g.fillStyle = O.mobcap; g.beginPath(); g.arc(x, y, 4.2, 0, 7); g.fill(); g.strokeStyle = rgba(INK, 0.35); g.lineWidth = 0.7; g.stroke(); }
      g.fillStyle = '#d88a90'; g.beginPath(); g.ellipse(18, -30, 5, 3.5, 0.5, 0, 7); g.fill(); // a little ribbon
    }
  }, { granulate: false }) : null;

  // ---- the rig: per-part postures -> screen-space pieces (internal, facing right) ----
  function postures(st, dl) { return solve(st, O, dl); }
  function rig(raw, ph, pb, pa, pe, tails) {
    const rd = [raw.rdx, raw.rdy];
    const phiB = Math.PI * (pb.turnB || 0), cB = Math.cos(phiB), sB = Math.sin(phiB);
    const Mb = bodyMat(pb);
    const P3 = (p, z, P = pb, phi = phiB) => { const q = proj3(p[0], p[1], z, phi); return { x: q.x + rd[0], y: q.y + rd[1], d: q.d }; };
    const R = { rd, pb, Mb, phiB, cB, sB, raw };
    R.front = ease(1 - Math.abs(cB) / 0.55);
    R.kB = (cB < 0 ? -1 : 1) * Math.max(Math.abs(cB), 0.6);
    // head
    const phiH = Math.PI * clamp((ph.turnH || 0) + ph.hturn, 0, 1);
    const Hs = proj3(ph.H[0], ph.H[1], 0, phiB);
    // the head's own bob/offsets come from the head posture, its placement relative to the body from the body
    const Hb = proj3(pb.H[0], pb.H[1], 0, phiB);
    R.head = { P: ph, phi: phiH, H: [Hs.x + rd[0], Hs.y + rd[1]], ha: ph.haT, ears: pe };
    R.N = P3(Mb(NP), 0);
    // arms: role blend over the turn (the z+ arm's pose goes from 'near' to 'far' through the front view)
    const roleK = ease((phiB / Math.PI - 0.38) / 0.24);
    R.arms = [+1, -1].map((zs) => {
      const nearK = zs > 0 ? 1 - roleK : roleK;
      return armSolve(pa, raw, zs, nearK, phiB, rd, R);
    });
    // feet (from the raw, undelayed state: planted feet never lag)
    R.feet = feetSolve(raw, pb, phiB, rd);
    if (O.stick) { // the stick passes from paw to paw through the front view of a turn
      const [a, b] = R.arms; // a: z+ (near at turn 0), b: z- (holds the stick at turn 0)
      const grip = [lerp(b.T[0], a.T[0], roleK), lerp(b.T[1], a.T[1], roleK)];
      const tq = proj3(R.stickTip[0], R.stickTip[1], 0, phiB);
      R.stick = { grip, tip: [tq.x, tq.y], lean: clamp(pb.stickLean), arm: roleK < 0.5 ? b : a };
    }
    // tail chain
    R.tail = tailSolve(tails, pb, rd);
    R.scarf = O.scarf ? scarfSolve(pa, pb, phiB, rd) : null;
    return R;
  }

  // ---- arms
  function headPoint(P, hp, phi) { // head-local 3D point -> side-plane point near the head (before the body yaw)
    const q = proj3(hp[0], hp[1], hp[2], phi - 0, 0);
    const hs = O.headScale || 1;
    const r = rot([q.x * hs, q.y * hs], -P.haT);
    return [P.H[0] + r[0], P.H[1] + r[1]];
  }
  function armSolve(P, raw, zs, nearK, phiB, rd, R) {
    const W = P.W, A = P.A, t = (P.tt || 0);
    const M = bodyMat(P);
    const sh0 = M([SH[0], SH[1] - P.shUp]);
    // targets in the side plane [x, y] (body-local unless noted), z magnitude, elbow hint (side plane)
    const items = [];
    const nearW = nearK, farW = 1 - nearK;
    const both = (w, n, f) => { if (w > 0.001) items.push([w, lerp3(f, n, nearW)]); };
    const lerp3 = (a, b, k) => ({ p: [lerp(a.p[0], b.p[0], k), lerp(a.p[1], b.p[1], k)], z: lerp(a.z, b.z, k), h: [lerp(a.h[0], b.h[0], k), lerp(a.h[1], b.h[1], k)], fist: lerp(a.fist || 0, b.fist || 0, k), world: a.world || b.world });
    const B = (x, y, z, hx = -0.3, hy = 1, fist = 0) => ({ p: M([x, y]), z, h: [hx, hy], fist });
    const Hd = (hp, z, hx = 0.3, hy = 1) => ({ p: headPoint(P, [hp[0], hp[1], 0], 0), z, h: [hx, hy] });
    const tm = (P.tt || 0);
    // rest: paws held softly in front of the tummy, swinging when walking
    const sw = A.swing || 0;
    const rest = { n: B(26 + 14 * sw, -58 - 4 * Math.abs(sw), 17), f: B(20 - 14 * sw, -60 - 4 * Math.abs(sw), 17) };
    if (O.stick) { // the stick's tip is planted ahead (stepping with the walk like a third foot); the paw holds it
      const [sx, sl] = walkFoot((raw.walkPhase || 0) + 0.25);
      const tip = [STICK_X + sx, -sl], to = M([24, -100]);
      const dd = Math.hypot(to[0] - tip[0], to[1] - tip[1]) || 1;
      const grip = [tip[0] + (to[0] - tip[0]) / dd * STICK_G, tip[1] + (to[1] - tip[1]) / dd * STICK_G];
      const hold = { p: [grip[0] - raw.rdx * 0, grip[1]], z: 15, h: [0.4, 1], fist: 1 };
      const k = clamp(P.stickLean);
      rest.f = { p: [lerp(rest.f.p[0] + 12, hold.p[0], k), lerp(rest.f.p[1], hold.p[1], k)], z: lerp(17, 15, k), h: [0.4, 1], fist: 1 };
      R.stickTip = [STICK_X + sx, -sl];
    }
    let wsum = 0;
    const g = (w, n, f) => { both(w, n, f); wsum += w; };
    if (W.wave) { const o = Math.sin(tm * TAU * 2.1); g(W.wave, B(44 + 8 * o, -128 - 3 * Math.abs(o), 26, 1, 0.7), rest.f); }
    if (W.point) { const a = -0.15 - 0.6 * (A.pointUp || 0), L = 48; const S0 = [SH[0], SH[1]]; g(W.point, B(S0[0] + Math.cos(a) * L + 6, S0[1] + Math.sin(a) * L, 18, -0.2, 1, 1), rest.f); }
    if (W.explain) { const a = tm * TAU * 0.7; g(W.explain, B(46 + 6 * Math.sin(a), -100 + 7 * Math.sin(2 * a), 24, -0.2, 1), B(30 - 4 * Math.sin(a + 1), -86 + 4 * Math.sin(2 * a + 1), 22)); }
    if (W.clap) { const cp = A.clapPhase || 0, gap = 1.5 + 11 * (0.5 + 0.5 * Math.cos(cp * TAU)) ** 0.7; g(W.clap, B(40, -98, gap, -0.3, 1), B(38, -98, gap, -0.3, 1)); }
    if (W.cheer) { const o = Math.sin(tm * TAU * 3); g(W.cheer, B(28 + 3 * o, -170, 30, 0.8, 0.2), B(20 - 3 * o, -168, 30, 0.8, 0.2)); }
    if (W.shrug) g(W.shrug, B(40, -92, 36, -0.2, 1), B(34, -92, 36, -0.2, 1));
    if (W.cover) { const pk = A.peek || 0; g(W.cover, Hd([28 + 6 * pk, -2 + 16 * pk], 20), Hd([24, -4], 20)); }
    if (W.tummy) g(W.tummy, B(32, -58, 8), B(28, -50, 8));
    if (W.whisper) g(W.whisper, Hd([60, 14], 18, 0.2, 1), rest.f);
    if (W.shy) g(W.shy, Hd([30, 44], 4, -0.2, 1), Hd([26, 46], 4, -0.2, 1));
    if (W.rub) { const o = tm * TAU * 2.2; g(W.rub, Hd([-22 + 5 * Math.cos(o), 4 + 5 * Math.sin(o)], 24, 0.3, 1), rest.f); }
    if (W.specsW) g(W.specsW, Hd([30, -4 + (P.specsY || 0)], 20, 0.4, 1), rest.f);
    if (W.chuckleW) g(W.chuckleW, B(32, -60, 10), rest.f);
    if (W.yawnW) g(W.yawnW, B(22, -176, 34, 0.9, 0.1), B(12, -174, 34, 0.9, 0.1));
    if (W.dance) { const b = A.beat || 0, sb = Math.sin(Math.PI * b); g(W.dance, B(30 + 6 * sb, -112 - 34 * Math.max(0, sb), 30, 0.7, 0.6), B(26 - 6 * sb, -112 - 34 * Math.max(0, -sb), 30, 0.7, 0.6)); }
    if (W.reach) { const e = A.edge || [44, -62]; const wp = (dx) => ({ p: [e[0] + dx - raw.rdx, e[1] - 2 - raw.rdy], z: 16, h: [-0.6, 0.5], world: 1 }); g(W.reach, wp(2), wp(8)); }
    if (W.push) { const e = A.edge || [44, -62]; const wp = (dx) => ({ p: [e[0] + dx - raw.rdx, e[1] - 1 - raw.rdy], z: 14, h: [-1, -0.2], world: 1 }); g(W.push, wp(14), wp(22)); }
    if (W.air) g(W.air, B(34, -138, 26, 0.6, 0.4), B(26, -134, 26, 0.6, 0.4));
    if (W.back) g(W.back, B(-18, -70, 20, 1, 0.2), B(-22, -72, 20, 1, 0.2));
    if (W.sleepW) g(W.sleepW, Hd([20, 40], 10), Hd([16, 42], 10));
    if (W.sitW) g(W.sitW * 0.6, B(30, -50, 14), B(26, -48, 14));
    if (W.scurry) g(W.scurry, B(40, -92, 12, -0.3, 1), B(36, -90, 12, -0.3, 1));
    // blend: gestures over the rest pose (weights above 1 normalise)
    const rw = Math.max(0, 1 - wsum);
    let px = 0, py = 0, pz = 0, hx = 0, hy = 0, fist = 0, tot = rw;
    const R0 = lerp3(rest.f, rest.n, nearW);
    px += rw * R0.p[0]; py += rw * R0.p[1]; pz += rw * R0.z; hx += rw * R0.h[0]; hy += rw * R0.h[1]; fist += rw * (R0.fist || 0);
    for (const [w, it] of items) { px += w * it.p[0]; py += w * it.p[1]; pz += w * it.z; hx += w * it.h[0]; hy += w * it.h[1]; fist += w * (it.fist || 0); tot += w; }
    px /= tot; py /= tot; pz /= tot; hx /= tot; hy /= tot; fist /= tot;
    // project shoulder and target with the body's yaw, solve the elbow in the picture plane
    const Sp = proj3(sh0[0], sh0[1], zs * SHZ, phiB), Tp = proj3(px, py, zs * pz, phiB);
    const S = [Sp.x + rd[0], Sp.y + rd[1]], T = [Tp.x + rd[0], Tp.y + rd[1]];
    const hint = [hx * Math.cos(phiB) - 0.25 * zs * Math.sin(phiB), hy];
    const sol = ik2(S, T, ARM_A, ARM_B, hint, 1.12);
    // the stick (elder): held in the 'far' role paw
    return { S, E: sol.E, T: sol.T, d: (Sp.d + Tp.d) / 2, pd: Tp.d * 0.7 + Sp.d * 0.3, z: zs, fist, nearK };
  }

  // ---- feet
  function feetSolve(raw, pb, phiB, rd) {
    const p0 = raw.walkPhase || 0, tr = clamp(raw.turnRaw || 0), air = clamp(raw.air), dance = raw.A.dance || 0;
    const out = [];
    const sit = clamp(raw.W.sitW || 0), sleepK = raw.W.sleepW || 0;
    const Mb = bodyMat(pb);
    for (const zs of [-1, +1]) {
      const isNearRole = zs > 0; // at turn 0
      const wf = (near) => walkFoot(p0 + (near ? 0 : 0.5));
      let [dx, lift, pitch] = wf(isNearRole);
      let x = FOOT_X + dx, y = -lift;
      let turnX = null;
      if (tr > 0) { // turning on the spot: each foot steps (in picture space, so a planted foot never moves) from
        // its own place to the mirror of the other foot's place: at turn 1 this is exactly the mirrored picture
        const [ox] = wf(!isNearRole), xo = FOOT_X + ox;
        const w = isNearRole ? [0.12, 0.42] : [0.46, 0.78];
        const u = clamp((tr - w[0]) / (w[1] - w[0]));
        const X0 = proj3(FOOT_X + dx, 0, zs * FOOT_Z, 0, 0.875).x, X1 = -proj3(xo, 0, -zs * FOOT_Z, 0, 0.875).x;
        turnX = lerp(X0, X1, easeInOut(u));
        const l = Math.sin(Math.PI * u); y -= 9 * l; pitch += 0.3 * l;
      }
      if (dance > 0 && !(raw.walkAmt > 0.5)) { // alternate kicks (the other foot stays planted)
        const sb = Math.sin(Math.PI * (raw.A.beat || 0)), k = Math.max(0, isNearRole ? sb : -sb);
        y -= dance * 12 * k ** 1.3; x += dance * 10 * k ** 1.3; pitch += dance * 0.5 * k;
      }
      if (sit > 0) { const sx = isNearRole ? 30 : 22; x = lerp(x, sx, ease(sit)); y -= 6 * Math.sin(Math.PI * clamp(sit)); pitch = lerp(pitch, -0.22, ease(sit)); }
      if (sleepK > 0) { x = lerp(x, isNearRole ? 6 : -4, sleepK); pitch = lerp(pitch, 0.1, sleepK); }
      // climbing: planted on the ground, scrabbling in the air, then planted on top
      const c = raw.A.climb;
      let px = x, py = y;
      if (c > 0 && c < 1) {
        const D = raw.climbD, Hh = raw.climbH, edge = raw.A.edge[0];
        const land = isNearRole ? [0.6, 0.7] : [0.68, 0.78];
        const ca = clamp(raw.climbAir || 0);
        const hip = Mb(HIP);
        const scr = c * 18 + (isNearRole ? 0 : 0.5);
        const ax = Math.min(edge - 6, hip[0] + 6 + 8 * Math.sin(scr * TAU) - raw.rdx) , ay = hip[1] + 14 + 5 * Math.cos(scr * TAU);
        const top = [x + D, y - Hh];
        const lu = easeInOut((c - land[0]) / (land[1] - land[0]));
        const airP = [ax + raw.rdx, ay + raw.rdy];
        px = lerp(lerp(x, airP[0], ca), top[0], lu); py = lerp(lerp(y, airP[1], ca), top[1], lu);
        if (c > land[1]) { px = top[0]; py = top[1]; }
        pitch = lerp(pitch, -0.5 + 0.3 * Math.sin(scr * TAU), ca * (1 - lu));
      } else if (air > 0) {
        const hip = Mb(HIP), tk = [hip[0] + 4 + (isNearRole ? 4 : -2), hip[1] + 16];
        px = lerp(x, tk[0] + raw.rdx, air); py = lerp(y, tk[1] + raw.rdy, air); pitch = lerp(pitch, 0.4, air);
      }
      // project (planted feet use the raw yaw)
      const phiF = Math.PI * (raw.turnB || 0);
      const q = proj3(px, py, zs * FOOT_Z, phiF, 0.875);
      const fx = turnX !== null && !(c > 0 && c < 1) && !(air > 0) && !(sit > 0) && !(sleepK > 0) ? turnX : q.x, fy = q.y;
      const hip = Mb(HIP), hq = proj3(hip[0], hip[1], zs * HIPZ, phiB);
      out.push({ foot: [fx, fy], hip: [hq.x + rd[0], hq.y + rd[1]], pitch, d: q.d, dir: Math.cos(phiF), planted: c > 0 && c < 1 ? c > (isNearRole ? 0.7 : 0.78) || c < 0.3 : air <= 0 && Math.abs(fy) < 0.01, z: zs });
    }
    return out;
  }

  // ---- tail: a chain whose segments see the pose at increasing delays (the bend travels down to the tip)
  function tailShape(P) { // absolute angles of the tail segments for one posture, in the side plane (facing right)
    const angs = [];
    const base = Math.PI - 0.24 + P.rot * 0.9 + P.tLift - P.tDrag * 0.08;
    const curl = (1 + 0.5 * P.tCurl) * (1 - 0.65 * clamp(P.tDrag));
    const sstep = (x) => ease(x);
    for (let i = 0; i < TAIL_N; i++) {
      const f = (i + 1) / TAIL_N;
      let a = base + curl * (1.45 * sstep(f / 0.8) - 0.75 * sstep((f - 0.62) / 0.38)) + P.tSway * 0.14 * Math.sin(f * 3.2);
      a = lerp(a, Math.PI - 0.12 - 0.35 * f + 0.1 * Math.sin(f * 4 + P.tSway), clamp(P.tFlat)); // lying along the floor
      a = lerp(a, lerp(Math.PI - 0.9, -0.1, sstep(f / 0.42)), ease(P.tWrap)); // asleep: down and round the front
      angs.push(a);
    }
    return angs;
  }
  function tailSolve(tails, pb, rd) {
    // tails: [{P, d}] postures at increasing delays; each segment takes its angle from its own delay
    const shapes = tails.map((x) => tailShape(x.P));
    const M = bodyMat(pb);
    const root = M(TAIL_ROOT);
    const ds = TAIL_L / TAIL_N;
    const pts3 = [[root[0], root[1], 0]];
    let p = [root[0], root[1]];
    for (let i = 0; i < TAIL_N; i++) {
      const f = i / (TAIL_N - 1), tau = f * (tails.length - 1), j = Math.min(tails.length - 2, Math.floor(tau)), k = tau - j;
      const a = lerp(shapes[j][i], shapes[j + 1][i], k);
      p = [p[0] + Math.cos(a) * ds, p[1] + Math.sin(a) * ds];
      const P = tails[Math.round(tau)].P;
      const z = (P.tSway * 10 + P.tWrap * 34) * ((i + 1) / TAIL_N) ** 1.4;
      pts3.push([p[0], Math.min(p[1], -2 - rd[1]), z]);
    }
    const phiT = Math.PI * (tails[0].P.turnT || 0);
    return { pts: pts3.map(([x, y, z]) => { const q = proj3(x, y, z, phiT, 0); return [q.x + rd[0], q.y + rd[1], q.d]; }), wrap: tails[0].P.tWrap };
  }
  function scarfSolve(pa, pb, phiB, rd) {
    // the visible (front) half of a ring round the neck, and a loose end hanging from its near side
    const M = bodyMat(pb), C = M([4, -110]), r = 25, c = Math.cos(phiB), sn = Math.sin(phiB);
    const ring = [];
    for (let k = 0; k <= 12; k++) {
      const th = -phiB + Math.PI * k / 12, x = C[0] + r * Math.cos(th), z = r * Math.sin(th);
      const q = proj3(x, C[1] + 5 * Math.sin(th + phiB) + 3 * Math.cos(th) * c, z, phiB, 0);
      ring.push([q.x + rd[0], q.y + rd[1]]);
    }
    const ex = C[0] + r - 2, ez = 0; // the knot at the throat: the same picture mirrored, so no pop at the swap
    const sw = Math.sin((pa.tt || 0) * TAU * 0.5) * 0.08;
    const a0 = Math.PI / 2 - 0.2 - pa.rot * 0.6 + sw - 0.5 * clamp(pa.tDrag), a1 = a0 + 0.18 + sw;
    const e0 = [ex, C[1] + 4], e1 = [e0[0] + Math.cos(a0) * 15, e0[1] + Math.sin(a0) * 15], e2 = [e1[0] + Math.cos(a1) * 15, e1[1] + Math.sin(a1) * 15];
    const end = [e0, e1, e2].map(([x, y]) => { const q = proj3(x, y, ez + 2, phiB, 0); return [q.x + rd[0], q.y + rd[1], q.d]; });
    return { ring, end, d: ex * sn + ez * c };
  }
  function rigFromState(st) { const p = solve(st, O, 0); p.tt = st.t || 0; return rig(fill(p, st), p, p, p, p, TAIL_DELAYS.map(() => ({ P: p }))); }
  function fill(raw, st) { raw.walkPhase = st.walk || 0; raw.walkAmt = st.walkAmt || 0; raw.climbD = (st.climbDist ?? DEF.climbDist) / size; raw.climbH = (st.climbHeight ?? DEF.climbHeight) / size; return raw; }
  function rigAt(poseFn, t, o = {}) {
    const since = o.since ?? -1e9, cache = new Map();
    const cur = poseFn(t); cache.set(Math.round(t * 960) / 960, cur);
    const raw = fill(solve(cur, O, 0), cur); raw.tt = t;
    const f = (k, dt = 0) => ({ ...cur, ...filtered(poseFn, t - dt, K[k], since, cache), t: t - dt });
    const one = (k, dt = 0) => { const p = solve(f(k, dt), O, LAG[k]); p.tt = t - dt - LAG[k]; return p; };
    const ph = one('head'), pb = one('body'), pa = one('arm'), pe = one('ear');
    const tails = TAIL_DELAYS.map((d) => ({ P: one('tail', d), d }));
    return { R: rig(raw, ph, pb, pa, pe, tails), st: cur };
  }

  // ---------------------------------------------------------------- painting (internal: facing right)
  function drawFoot(g, f) {
    g.save(); g.translate(f.foot[0], f.foot[1]);
    const k = (f.dir < 0 ? -1 : 1) * Math.max(Math.abs(f.dir), 0.32);
    g.scale(k, 1); g.rotate(f.pitch); g.translate(-2, 0);
    drawSprite(g, foot); g.restore();
  }
  function drawLeg(g, f) {
    const a = f.hip, b = [f.foot[0] + 2 * Math.sign(f.dir || 1), f.foot[1] - 4];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) < 8) return;
    tube(g, [a, b], 9, shade(fur, f.z < 0 ? 0.15 : 0.02), { inkW: 2.2, inkA: 0.6 });
  }
  function drawArm(g, a, far) {
    const col = far ? shade(sleeve, 0.15) : sleeve;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    const seg = (p, q, w, st) => { g.strokeStyle = st; g.lineWidth = w; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); };
    seg(a.S, a.E, 10.4, rgba(INK, 0.7)); seg(a.E, a.T, 8.6, rgba(INK, 0.7));
    seg(a.S, a.E, 8, col); seg(a.E, a.T, 6.4, col);
    g.globalAlpha *= 0.35; g.translate(-1.2, -1.2); seg(a.S, a.E, 2.2, tint(col, 0.45)); seg(a.E, [lerp(a.E[0], a.T[0], 0.7), lerp(a.E[1], a.T[1], 0.7)], 1.8, tint(col, 0.45));
    g.restore();
    // the paw: a soft pink mitten along the forearm
    const ang = Math.atan2(a.T[1] - a.E[1], a.T[0] - a.E[0]);
    g.save(); g.translate(a.T[0], a.T[1]); g.rotate(ang);
    g.fillStyle = far ? shade(pink, 0.12) : pink; g.strokeStyle = rgba(INK, 0.6); g.lineWidth = 1;
    g.beginPath(); g.ellipse(2.5, 0, 5.6 - a.fist * 0.8, 4.6, 0, 0, 7); g.fill(); g.stroke();
    g.strokeStyle = rgba(INK, 0.35); g.lineWidth = 0.7;
    if (a.fist < 0.5) for (const y of [-1.6, 1.6]) { g.beginPath(); g.moveTo(5.5, y); g.lineTo(8, y * 1.2); g.stroke(); }
    g.restore();
  }
  function drawStick(g, R) {
    // the walking stick in the elder's paw: tip planted ahead (leaning on it) or hanging from the paw
    const lean = R.stick.lean, L = STICK_G + 12, grip = R.stick.grip, tipPlant = R.stick.tip;
    let dir = [tipPlant[0] - grip[0], tipPlant[1] - grip[1]]; const dl = Math.hypot(...dir) || 1; dir = [dir[0] / dl, dir[1] / dl];
    const hang = [Math.sin(0.12), Math.cos(0.12)];
    const d = [lerp(hang[0], dir[0], lean), lerp(hang[1], dir[1], lean)], dn = Math.hypot(...d);
    const u = [d[0] / dn, d[1] / dn];
    const free = [grip[0] + u[0] * STICK_G, grip[1] + u[1] * STICK_G];
    const tip = [lerp(free[0], tipPlant[0], lean), lerp(free[1], tipPlant[1], lean)];
    const uu = [tip[0] - grip[0], tip[1] - grip[1]], ul = Math.hypot(...uu) || 1, kk = ul / STICK_G;
    const top = [grip[0] - uu[0] / ul * 12 * kk, grip[1] - uu[1] / ul * 12 * kk];
    g.save(); g.lineCap = 'round';
    g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 6.4; g.beginPath(); g.moveTo(...top); g.lineTo(...tip); g.stroke();
    g.strokeStyle = '#8a5e3a'; g.lineWidth = 4; g.beginPath(); g.moveTo(...top); g.lineTo(...tip); g.stroke();
    g.strokeStyle = 'rgba(220,180,130,0.6)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(top[0] - 1, top[1]); g.lineTo(tip[0] - 1, tip[1]); g.stroke();
    // the crook (curved handle) over the paw
    const n = [-u[1], u[0]], side = R.cB >= 0 ? 1 : -1;
    g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 6.4; g.beginPath(); g.moveTo(...top);
    g.quadraticCurveTo(top[0] - u[0] * 10 + n[0] * 6 * side, top[1] - u[1] * 10 + n[1] * 6 * side, top[0] + n[0] * 12 * side, top[1] + n[1] * 12 * side - 2); g.stroke();
    g.strokeStyle = '#8a5e3a'; g.lineWidth = 4; g.stroke();
    g.restore();
  }
  function drawTail(g, R, front) {
    const pts = R.tail.pts.map((p) => [p[0], p[1]]);
    if (!front) { taper(g, pts, 7, 2, pink, { shade: '#b87a74', light: '#f8d8d0', inkW: 1.2, inkA: 0.6 }); return; }
    // asleep, the wrapped end of the tail lies in front of the curled body
    const w = clamp((R.tail.wrap - 0.35) / 0.4);
    if (w <= 0) return;
    const i0 = Math.floor(lerp(TAIL_N, TAIL_N * 0.4, w));
    if (i0 >= TAIL_N - 1) return;
    taper(g, pts.slice(i0), lerp(7, 2, i0 / TAIL_N), 2, pink, { shade: '#b87a74', inkW: 1.2, inkA: 0.6 });
  }
  function drawScarf(g, R, front) {
    if (!R.scarf) return;
    const sc = R.scarf;
    if (!front) { // the ring (the head covers its back)
      tube(g, sc.ring, 12, O.scarf, { inkW: 2.4, inkA: 0.7 });
      g.save(); g.strokeStyle = rgba(O.scarfStripe, 0.9); g.lineWidth = 2.2; g.lineCap = 'round';
      for (const i of [3, 6, 9]) { const p = sc.ring[i], q = sc.ring[i + 1], a = Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2; g.beginPath(); g.moveTo(p[0] - Math.cos(a) * 5, p[1] - Math.sin(a) * 5); g.lineTo(p[0] + Math.cos(a) * 5, p[1] + Math.sin(a) * 5); g.stroke(); }
      g.restore();
      return;
    }
    const p = sc.end.map((q) => [q[0], q[1]]);
    tube(g, p, 10, O.scarf, { inkW: 2.2, inkA: 0.65 });
    g.save(); g.strokeStyle = rgba(O.scarfStripe, 0.9); g.lineWidth = 2.2; g.lineCap = 'round';
    for (const f of [0.45, 0.75]) { const i = f * (p.length - 1), j = Math.min(p.length - 2, Math.floor(i)), k = i - j; const q = [lerp(p[j][0], p[j + 1][0], k), lerp(p[j][1], p[j + 1][1], k)]; const a = Math.atan2(p[j + 1][1] - p[j][1], p[j + 1][0] - p[j][0]) + Math.PI / 2; g.beginPath(); g.moveTo(q[0] - Math.cos(a) * 4, q[1] - Math.sin(a) * 4); g.lineTo(q[0] + Math.cos(a) * 4, q[1] + Math.sin(a) * 4); g.stroke(); }
    const e = p[p.length - 1], a = Math.atan2(e[1] - p[p.length - 2][1], e[0] - p[p.length - 2][0]);
    g.strokeStyle = rgba(O.scarfStripe, 0.95); g.lineWidth = 1.4;
    for (let k = -2; k <= 2; k++) { const b = a + k * 0.18; g.beginPath(); g.moveTo(e[0] + Math.cos(a + Math.PI / 2) * k * 1.8, e[1] + Math.sin(a + Math.PI / 2) * k * 1.8); g.lineTo(e[0] + Math.cos(b) * 7 + Math.cos(a + Math.PI / 2) * k * 2, e[1] + Math.sin(b) * 7 + Math.sin(a + Math.PI / 2) * k * 2); g.stroke(); }
    g.restore();
  }
  // the head, in head-local space (centre at 0, facing right), turned to yaw phi
  function drawHead(g, R, st) {
    const h = R.head, P = h.P, pe = h.ears, phi = h.phi, c = Math.cos(phi), sn = Math.sin(phi), sg = c < 0 ? -1 : 1;
    g.save(); g.translate(h.H[0], h.H[1]); g.rotate(-h.ha); const hs = O.headScale || 1; g.scale(hs, hs);
    const skx = sg * (0.88 + 0.12 * Math.abs(c));
    const whiskers = (side) => {
      g.save(); g.strokeStyle = rgba(INK, side > 0 ? 0.32 : 0.2); g.lineWidth = 0.7; g.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const tw = P.whisk * (0.6 + 0.2 * i) * side;
        const r0 = proj3(56, 14 + i * 2.5, side * 7, phi, 0);
        const dir = [0.62, (-0.22 + i * 0.2) + tw * 0.4, side * 0.78];
        const L = 40 - i * 3;
        const mid = proj3(56 + dir[0] * L * 0.5, 14 + i * 2.5 + dir[1] * L * 0.5 - 2, side * (7 + dir[2] * L * 0.5), phi, 0);
        const end = proj3(56 + dir[0] * L, 14 + i * 2.5 + dir[1] * L + 2 * i, side * (7 + dir[2] * L), phi, 0);
        g.beginPath(); g.moveTo(r0.x, r0.y + P.sniff * 0.6); g.quadraticCurveTo(mid.x, mid.y, end.x, end.y); g.stroke();
      }
      g.restore();
    };
    // ears: drawn over the skull, but the skull hides (a growing hole) whichever is behind it
    const earAt = (zs, flick) => {
      const x = -22, y = -30, z = zs * 26;
      const d = x * sn + z * c, X = x * c - z * sn + 0.5 * d * c, dn = d / 26;
      const Y = y + 2 - 0.23 * d * Math.abs(c) - P.earPerk * 4 + (P.earBack || 0) * 6;
      const r = -0.22 * c - 0.32 * (z / 26) * sn + 0.12 * dn * c - (P.earBack || 0) * 0.6 * c + flick * c + P.earPerk * 0.1 * c;
      const sc = 1 - 0.12 * clamp(P.earBack || 0);
      const occ = clamp(0.55 - dn * 0.9);
      g.save();
      if (occ > 0.001) { // clip out the part of the ear the skull hides
        g.beginPath(); g.rect(-200, -200, 400, 400);
        g.ellipse(0, 0, 40 * Math.abs(skx) * occ, 33 * occ, 0, 0, 7); g.clip('evenodd');
      }
      g.translate(X, Y); g.rotate(r); g.scale(sg * sc, sc); drawSprite(g, ear);
      g.restore();
    };
    whiskers(-1);
    g.save(); g.scale(skx, 1); drawSprite(g, skull); g.restore();
    const capAt = () => { if (cap && O.cap) { g.save(); g.rotate(-0.22 * c); g.translate(2 * c, -14); g.scale(skx * 1.05, 1.05); drawSprite(g, cap); g.restore(); } };
    // far ear, the cap, near ear (by depth)
    const ed = (zs) => -22 * sn + zs * 26 * c;
    const ears = [[-1, pe.flickF], [+1, pe.flickN]];
    for (const [zs, fl] of ears) if (ed(zs) <= 8) earAt(zs, fl);
    capAt();
    for (const [zs, fl] of ears) if (ed(zs) > 8) earAt(zs, fl);
    if (cap && O.mobcap) { g.save(); g.rotate(-0.2 * c); g.translate(-8 * c, -12); g.scale(skx, 1); drawSprite(g, cap); g.restore(); }
    // the muzzle: the profile snout foreshortens as the head turns; the front muzzle grows as it does
    const occS = clamp(1 - Math.abs(c) / 0.62);
    g.save();
    if (occS > 0.001) { g.beginPath(); g.rect(-200, -200, 400, 400); g.ellipse(0, 0, 40 * Math.abs(skx) * occS, 33 * occS, 0, 0, 7); g.clip('evenodd'); }
    g.scale(c, 1); drawSprite(g, snout); g.restore();
    const fb = ease(1 - Math.abs(c) / 0.8);
    if (fb > 0.002) { g.save(); g.translate(48 * c, 0); g.scale(fb, 0.75 + 0.25 * fb); drawSprite(g, fmuz); g.restore(); }
    // eyes (on a sphere: both visible as she faces us; the far one hidden by the skull, never faded)
    const R0 = 7.5 * (1 + 0.15 * clamp(P.big));
    const eo = clamp(P.eye * (1 + 0.15 * clamp(P.big)), 0, 1.15);
    const happy = P.happy > 0.5;
    const eyeAt = (zs) => {
      const az = zs * EYE_AZ, x = EYE_R3 * Math.cos(az), z = EYE_R3 * Math.sin(az);
      const q = proj3(x, EYE_Y, z, phi, 0);
      const vis = q.d / EYE_R3; if (vis < -0.25) return;
      const w = clamp(0.35 + 0.65 * Math.max(0, vis + 0.1) ** 0.7, 0.35, 1);
      const ey = EYE_Y - P.gaze * 1.6;
      g.save();
      if (vis < 0.3) { g.beginPath(); g.ellipse(0, 0, 40 * Math.abs(skx), 33, 0, 0, 7); g.clip(); }
      pool(g, q.x + 8 * c, 12, 9 * w, 6, '#e2867a', 0.42 * (1 - 0.3 * (P.sad || 0)));
      g.translate(q.x, ey); g.scale(w, 1);
      buttonEye(g, 0, 0, eo, { R: R0, happy });
      // brow
      const bu = (P.brow || 0) * 5, sad = P.sad || 0;
      if (O.brows) { g.fillStyle = rgba(O.brows, 0.95); g.strokeStyle = rgba(INK, 0.45); g.lineWidth = 0.8; for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(-8 + k * 5, -14 - bu - k * 0.6 + sad * (2 - k), 4.2, 2.6, -0.3 + k * 0.1, 0, 7); g.fill(); g.stroke(); } }
      else { g.strokeStyle = rgba(INK, 0.5); g.lineWidth = 1.7; g.lineCap = 'round'; g.beginPath(); g.moveTo(-9 * sg, -11 - bu + sad * 3); g.quadraticCurveTo(0, -16 - bu, 9 * sg, -12 - bu - sad * 4); g.stroke(); }
      g.restore();
      return q;
    };
    const eF = eyeAt(-1), eN = eyeAt(+1);
    // spectacles: a little round lens over each eye, a bridge over the muzzle, the arm back to the ear
    if (O.spectacles) {
      const sy = (P.specsY || 0);
      g.save(); g.strokeStyle = rgba('#5a4a3a', 0.9); g.lineWidth = 1.4; g.lineCap = 'round';
      const lens = (q, zs) => {
        if (!q) return null; const vis = q.d / EYE_R3; const w = clamp(0.35 + 0.65 * Math.max(0, vis + 0.1) ** 0.7, 0.35, 1);
        g.save(); if (vis < 0.3) { g.beginPath(); g.ellipse(0, 0, 41 * Math.abs(skx), 34, 0, 0, 7); g.clip(); }
        g.fillStyle = 'rgba(255,250,235,0.18)'; g.beginPath(); g.ellipse(q.x + 1 * c, EYE_Y + 1 + sy, 11.5 * w, 11, 0, 0, 7); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 1; g.beginPath(); g.arc(q.x - 3 * w, EYE_Y - 3 + sy, 5, Math.PI * 1.1, Math.PI * 1.45); g.stroke();
        g.restore();
        return w;
      };
      lens(eF, -1); lens(eN, +1);
      const br = (zs) => proj3(EYE_R3 * Math.cos(zs * EYE_AZ) + 6, EYE_Y - 2 + sy, EYE_R3 * Math.sin(zs * EYE_AZ) * 0.55, phi, 0);
      const b0 = br(+1), b1 = br(-1), top = proj3(44, EYE_Y - 7 + sy, 0, phi, 0);
      g.beginPath(); g.moveTo(b0.x, b0.y); g.quadraticCurveTo(top.x, top.y, b1.x, b1.y); g.stroke();
      for (const zs of [-1, 1]) { // the arms back to the ears (visible from the side only)
        const a0 = proj3(EYE_R3 * Math.cos(zs * EYE_AZ) - 10, EYE_Y - 1 + sy, EYE_R3 * Math.sin(zs * EYE_AZ) + zs * 2, phi, 0), a1 = proj3(-16, -10 + sy, zs * 30, phi, 0);
        if (a0.d < 0 && a1.d < 0) continue;
        g.globalAlpha = clamp((Math.min(a0.d, 30) + 5) / 20); g.beginPath(); g.moveTo(a0.x, a0.y); g.lineTo(a1.x, a1.y); g.stroke(); g.globalAlpha = 1;
      }
      g.restore();
    }
    // nose and mouth on the muzzle (their 3D spots seen from the head's yaw)
    const nq = proj3(NOSE[0], NOSE[1] + P.sniff * 0.8, 0, phi, 0);
    g.fillStyle = '#c96f6c'; g.beginPath(); g.ellipse(nq.x, nq.y, 5.5, 5.2, 0, 0, 7); g.fill();
    g.strokeStyle = rgba(INK, 0.35); g.lineWidth = 0.8; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(nq.x - 1.5 * sg, nq.y - 2, 1.6, 0, 7); g.fill();
    const mq = proj3(MOUTH[0], MOUTH[1], 0, phi, 0);
    smileMouth(g, mq.x, mq.y, 14 + 4 * Math.abs(sn), clamp(P.mouth), P.smile, { deep: P.mdeep, lw: 1.5 });
    whiskers(+1);
    g.restore();
  }

  function paint(g, R, st) {
    g.save();
    g.scale(-size, size); // facing LEFT, and the outfit's size
    const pb = R.pb, F = R.front;
    // the body's own space, yawed (a squeezed, mirrored-past-the-middle profile; the front view grows over it)
    const bodySpace = () => { g.translate(R.rd[0], R.rd[1]); g.translate((R.cB - R.kB) * BC[0], 0); g.scale(R.kB, 1); };
    const order = (a, b) => (a.d <= b.d ? [a, b] : [b, a]);
    const [armB, armF] = order(R.arms[0], R.arms[1]);
    const [footB, footF] = order(R.feet[0], R.feet[1]);
    const showFeet = st.feet !== false;
    drawTail(g, R, false);
    if (showFeet) { drawLeg(g, footB); drawLeg(g, footF); drawFoot(g, footB); }
    const bodyT = () => { bodySpace(); const bp = R.Mb(BP); g.translate(bp[0], bp[1]); g.rotate(pb.rot); g.scale(pb.sx, pb.sy); g.translate(-BP[0], -BP[1]); };
    g.save(); bodyT(); drawSprite(g, body); g.restore();
    if (F > 0.001) {
      const C = proj3(...R.Mb(BP), 0, R.phiB, 0);
      g.save(); g.translate(C.x + R.rd[0], C.y + R.rd[1]); g.rotate(pb.rot * Math.abs(R.cB)); g.scale(F * pb.sx * 1.02, pb.sy); g.translate(0, -BP[1]); drawSprite(g, fbody); g.restore();
    }
    drawScarf(g, R, false);
    drawTail(g, R, true);
    if (showFeet) drawFoot(g, footF);
    // an arm behind the body is drawn over it with the body's silhouette cut out (a hole that grows from the
    // middle as the paw goes round behind): no pop when an arm passes behind or in front during a turn
    const armDraw = (a) => {
      const occ = clamp(0.4 - a.pd / 22);
      g.save();
      if (occ > 0.001) {
        g.beginPath(); g.rect(-400, -500, 800, 800);
        g.save(); bodyT(); g.translate(BC[0], BC[1]); g.scale(occ, occ); g.translate(-BC[0], -BC[1]); g.moveTo(...BODY[0]); for (const q of BODY) g.lineTo(q[0], q[1]); g.closePath(); g.restore();
        if (F > 0.3) { const C = proj3(...R.Mb(BC), 0, R.phiB, 0); g.ellipse(C.x + R.rd[0], C.y + R.rd[1], 44 * F * occ * pb.sx, 60 * occ * pb.sy, 0, 0, 7); }
        g.clip('evenodd');
      }
      if (O.stick && R.stick.arm === a) drawStick(g, R);
      drawArm(g, a, a.pd < 0);
      g.restore();
    };
    const early = R.arms.filter((a) => a.pd <= 8).sort((a, b) => a.pd - b.pd), late = R.arms.filter((a) => a.pd > 8).sort((a, b) => a.pd - b.pd);
    for (const a of early) armDraw(a);
    drawHead(g, R, st);
    drawScarf(g, R, true);
    for (const a of late) armDraw(a);
    g.restore();
  }

  // results in the caller's space (facing left, scaled by size), optionally through the caller's transform
  const toCaller = (p, o = {}) => {
    const lx = -p[0] * size, ly = p[1] * size;
    if (o.x === undefined && o.y === undefined && o.scale === undefined && o.face === undefined) return { x: lx, y: ly };
    const f = o.face ?? 1, k = o.scale ?? 1;
    return { x: (o.x ?? 0) + f * k * lx, y: (o.y ?? 0) + k * ly };
  };
  const pawsOf = (R, o) => { const [a, b] = R.arms; const nr = a.d >= b.d ? a : b, fr2 = nr === a ? b : a; return { near: toCaller(nr.T, o), far: toCaller(fr2.T, o) }; };
  const mouthOf = (R, o) => {
    const h = R.head, q = proj3(MOUTH[0], MOUTH[1], 0, h.phi, 0), hs = O.headScale || 1, r = rot([q.x * hs, q.y * hs], -h.ha);
    return toCaller([h.H[0] + r[0], h.H[1] + r[1]], o);
  };

  return {
    size, outfit: O, STRIDE: STRIDE * size,
    draw(g, st = {}) { paint(g, rigFromState(st), st); },
    drawAt(g, poseFn, t, o = {}) { const { R, st } = rigAt(poseFn, t, o); paint(g, R, st); },
    paws(st = {}, o) { return pawsOf(rigFromState(st), o); },
    pawsAt(poseFn, t, o = {}) { return pawsOf(rigAt(poseFn, t, o).R, o); },
    mouth(st = {}, o) { return mouthOf(rigFromState(st), o); },
    mouthAt(poseFn, t, o = {}) { return mouthOf(rigAt(poseFn, t, o).R, o); },
    headAt(poseFn, t, o = {}) { return toCaller(rigAt(poseFn, t, o).R.head.H, o); },
    feet(st = {}, o) { return rigFromState(st).feet.map((f) => ({ ...toCaller(f.foot, o), planted: f.planted })); },
    feetAt(poseFn, t, o = {}) { return rigAt(poseFn, t, o).R.feet.map((f) => ({ ...toCaller(f.foot, o), planted: f.planted })); },
    shadow(g, st = {}, height = 0) {
      const p = solve(st, O, 0), hgt = height / size - p.rdy;
      g.save(); g.translate(0, height); g.scale(size, size);
      const k = 1 / (1 + Math.max(0, hgt) / 90);
      g.globalAlpha *= 0.55 * k; pool(g, -(p.rdx || 0) + 4, 2, 62 * (0.7 + 0.3 * k), 8, '#2a1e12', 0.5); g.restore();
    },
  };
}
