// The Crow and the Pitcher: shots, camera, timing and acting.
//
// One little crow (engine/characters/crow3.js), always drawn with drawAt (follow-through) from a pose FUNCTION of
// time, so every number eases and nothing pops. Her whole day in the garden is one continuous performance, G(t):
// the shots (wide, medium, close, the look down into the pitcher, the peek through the clay) are just cameras on
// it, cut or dissolved; each shot starts the rig's follow-through afresh (`since`) so a cut never smears.
// The voice timeline gives the lines; the word onsets the action is locked to ("Plip!", "Plop!", "drank") were
// measured from its loudness envelope (WORD below).
import { W, H, canvas, clamp, lerp, span, drawSprite, rgba, pool, noise1 } from '../../engine/watercolor.js';
import { M, MY, LW, LH, INK, cam, sunlight, zzz, moon, makeStage } from '../../engine/stage.js';
import { makeCrow3, hopX, STRIDE } from '../../engine/characters/crow3.js';
import { PITCHER, NEST, MOON, PEBBLES, FIELDS_PAN, CLOSEUP, view, fieldsParallax, drawFieldsParallax, fieldsGardenAt, gardenLayers,
  drawGarden, drawPitcher, drawPebble, drawPitcherCloseup, drawPitcherCutaway, drawNestFront, heatShimmer, dustMotes,
  pitcherSprite, softStars } from './scene.js';

let S, crow;
const TAU = Math.PI * 2;
const CS = 0.5;                       // the crow's size in the garden (page units per rig unit)
const say = (id, t) => S.talking(id, t);

// ---------------------------------------------------------------- timing helpers
const s5 = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };       // smootherstep
const sm = (t, a, b) => s5((t - a) / (b - a));                                          // eased ramp a..b
const bump = (t, a, b, c, d) => sm(t, a, b) * (1 - sm(t, c, d));                        // up a..b, down c..d
const mixv = (a, b, k) => { const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), k)); // zoom eased in log space
  return { z, x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) }; };
// monotone cubic keyframes [[t, v], ...]: no overshoot, no stops at the in-between keys
function keys(u, ks) {
  const n = ks.length;
  if (u <= ks[0][0]) return ks[0][1];
  if (u >= ks[n - 1][0]) return ks[n - 1][1];
  let i = 1; while (u > ks[i][0]) i++;
  const [u0, v0] = ks[i - 1], [u1, v1] = ks[i], h = u1 - u0, d = v1 - v0;
  const tan = (j) => { if (j <= 0 || j >= n - 1) return 0; const va = ks[j - 1][1], v = ks[j][1], vb = ks[j + 1][1]; if ((v - va) * (vb - v) <= 0) return 0; return (vb - va) / (ks[j + 1][0] - ks[j - 1][0]); };
  let m0 = tan(i - 1) * h, m1 = tan(i) * h; const lim = 3 * Math.abs(d); m0 = clamp(m0, -lim, lim); m1 = clamp(m1, -lim, lim);
  const s = (u - u0) / h, s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * v0 + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * v1 + (s3 - s2) * m1;
}
// Turning round (crow3's `turn`: head leads, body and tail follow; in flight the wings keep beating). It runs 0 -> 1,
// holds at 1 a moment so the follow-through springs settle, then at `swap` we change to the mirrored transform with
// turn 0 and restart the follow-through there (the two pictures are identical).
const TURNS = [{ a: 59.15, b: 60.6, swap: 60.9, from: 1 }, { a: 130.15, b: 131.55, swap: 131.85, from: -1 }];
function turning(t) {
  for (const T of TURNS) if (t >= T.a - 0.5 && t < T.swap + 0.01) return { turn: t < T.swap ? sm(t, T.a, T.b) : 0, face: t < T.swap ? T.from : -T.from };
  return null;
}
const lastSwap = (t) => TURNS.reduce((a, T) => (t >= T.swap ? Math.max(a, T.swap) : a), -1e9);

// Word onsets measured from the voice envelope (build/crow-and-pitcher/timeline.json, 24 Hz)
const WORD = { plip: 84.66, plop: 87.40, drank1: 107.6, drank2: 108.5 };

// distance profile of a walk: speeds up, cruises, slows down (C1-continuous), 0..1 -> 0..1
function walkDist(u) {
  const a = 0.3, v = 1 / (1 - a);
  if (u <= 0) return 0; if (u >= 1) return 1;
  if (u < a) return v * u * u / (2 * a);
  if (u > 1 - a) return 1 - v * (1 - u) * (1 - u) / (2 * a);
  return v * (a / 2 + (u - a));
}
// ---------------------------------------------------------------- staging places (page coordinates)
const RIM_L = { x: PITCHER.x - 25, y: PITCHER.rimY - 5 };  // standing on the back lip, left of the mouth (facing right)
const RIM_R = { x: PITCHER.x + 25, y: PITCHER.rimY - 5 };  // ... right of the mouth (facing left)
const MOUTH = { x: PITCHER.mouth.cx, y: PITCHER.mouth.cy, rx: PITCHER.mouth.rx, ry: PITCHER.mouth.ry }; // the opening inside the rim
const PUSH = { x: PITCHER.x + 78, y: PITCHER.y + 16 };     // braced against the pitcher's right side
const PEB1 = PEBBLES[3], PEB3 = PEBBLES[9];                // the pebbles she picks up on screen (n08, and the last one)
const WALK = { t0: 79.1, t1: 80.45, from: { x: PUSH.x, y: PEB1.y }, D: 1.5 * STRIDE * CS }; // 3 steps: both feet down at the end
const PICK = { x: WALK.from.x - WALK.D, y: PEB1.y };
const PICK3 = { x: PITCHER.x + 25, y: PITCHER.y + 60 };    // straight below RIM_R, on the path
const PEB3_AT = { x: PICK3.x - 48, y: PICK3.y };          // where that last pebble lies (drawn by us)
const NEST_ROOT = { x: NEST[0] + 4, y: NEST[1] + 8 };
const pebScale = (p) => 13 / (2.6 * p.r);                  // carried pebbles are small, beak-sized ones

// ---------------------------------------------------------------- flights
// A short flight from perch to perch: take-off (phase), the flight path, landing (phase). The feet stay planted
// until the launch and are planted again from the touchdown. o: { t0, toLen, from, to, touch, ldLen, rate, bulge,
// via: { x, y, t } (optional middle point, e.g. where she turns round), glide }
function flutter(t, o) {
  const launch = o.t0 + 0.42 * o.toLen, ldStart = o.touch - 0.55 * o.ldLen;
  let x, y;
  const seg = (a, b, ta, tb, bulge) => { const u = clamp((t - ta) / (tb - ta)), e = s5(u);
    return [lerp(a.x, b.x, e), lerp(a.y, b.y, e) - bulge * Math.pow(Math.sin(Math.PI * u), 1.2)]; };
  if (t <= launch) [x, y] = [o.from.x, o.from.y];
  else if (t >= o.touch) [x, y] = [o.to.x, o.to.y];
  else if (o.via && t < o.via.t) [x, y] = seg(o.from, o.via, launch, o.via.t, o.bulge || 0);
  else if (o.via) [x, y] = seg(o.via, o.to, o.via.t, o.touch, o.bulge2 || 0);
  else [x, y] = seg(o.from, o.to, launch, o.touch, o.bulge || 0);
  const st = { beat: Math.max(0, t - launch) * (o.rate || 3), glide: o.glide ? o.glide(t) : 0 };
  if (t >= o.t0 && t < o.t0 + o.toLen) st.takeoff = (t - o.t0) / o.toLen;
  if (t >= ldStart && t < o.touch + 0.45 * o.ldLen) { st.land = (t - ldStart) / o.ldLen; delete st.takeoff; }
  else if (t >= o.t0 + o.toLen && t < ldStart) st.fly = 1;
  const air = t > launch && t < o.touch;
  return { x, y, st, air, active: t >= o.t0 && t < o.touch + 0.45 * o.ldLen };
}

// ---------------------------------------------------------------- the garden: her whole performance
const FL = {
  down: { t0: 58.8, toLen: 0.9, from: RIM_L, via: { x: PITCHER.x + 160, y: PITCHER.rimY + 30, t: 59.88 }, to: PUSH, touch: 61.15, ldLen: 1.1, rate: 3.0, bulge: 30, bulge2: 0 },
  up1: { t0: 81.75, toLen: 0.9, from: PICK, to: RIM_R, touch: 83.3, ldLen: 1.0, rate: 3.1, bulge: 22 },
  down3: { t0: 98.5, toLen: 0.9, from: RIM_R, to: PICK3, touch: 99.95, ldLen: 1.0, rate: 3.0, bulge: 18 },
  up3: { t0: 101.35, toLen: 0.9, from: PICK3, to: RIM_R, touch: 102.95, ldLen: 1.0, rate: 3.1, bulge: 22 },
  home: { t0: 129.6, toLen: 1.0, from: RIM_R, via: { x: PITCHER.x - 90, y: PITCHER.rimY - 120, t: 130.85 }, to: NEST_ROOT, touch: 134.0, ldLen: 1.5, rate: 2.7, bulge: 0, bulge2: 46,
    glide: (t) => bump(t, 131.6, 132.1, 132.7, 133.2) * 0.8 },
};
const HOP = { t0: 72.6, len: 1.15, from: PUSH, to: WALK.from };
const REL1 = 84.1, REL3 = 103.5;        // the moments she lets go of a pebble over the mouth

// local rig coordinates of a page point, for a crow at root r facing `face`
const toLocal = (r, face, px, py) => ({ x: (px - r.x) / (-face * CS), y: (py - r.y) / CS });

function G(t) {
  const st = { t };
  let x, y, face = 1, s = CS, ground = null, air = false;
  // ---- where she is (root), which way she faces
  if (t < 41.9) { // gliding in from the upper left onto the rim (no take-off: she is already flying)
    const t0 = 38.4, u = clamp((t - t0) / (41.9 - t0));
    x = lerp(PITCHER.x - 1000, RIM_L.x, 1 - Math.pow(1 - u, 2));
    y = lerp(PITCHER.rimY - 420, RIM_L.y, 1 - Math.pow(1 - u, 2.3));
    const ldLen = 1.5, ldStart = 41.9 - 0.55 * ldLen;
    st.beat = (t - t0) * 2.6; st.glide = 0.75 * (1 - sm(t, 39.9, 40.5));
    if (t >= ldStart) st.land = (t - ldStart) / ldLen; else st.fly = 1;
    air = true;
  } else if (t < FL.down.t0) { x = RIM_L.x; y = RIM_L.y; if (t < 42.6) st.land = (t - (41.9 - 0.825)) / 1.5; }
  else if (t < FL.down.touch + 0.6) {
    const f = flutter(t, FL.down); x = f.x; y = f.y; Object.assign(st, f.st); air = f.air;
    face = t < TURNS[0].swap ? 1 : -1; if (t > FL.down.touch - 0.2) ground = PUSH.y;
  } else if (t < HOP.t0) { x = PUSH.x; y = PUSH.y; face = -1; ground = y; }
  else if (t < FL.up1.t0) {
    const u = clamp((t - HOP.t0) / HOP.len), k = hopX(u);
    x = lerp(HOP.from.x, HOP.to.x, k); y = lerp(HOP.from.y, HOP.to.y, k); face = -1; ground = y;
    if (u > 0 && u < 1) { st.hop = u; st.hopHeight = 40; }
    if (t > WALK.t0) { // a few steps to the pebble: the walk phase is the distance covered, so the feet never slide
      const d = WALK.D * walkDist(clamp((t - WALK.t0) / (WALK.t1 - WALK.t0)));
      x = WALK.from.x - d; st.walk = d / CS / STRIDE; st.walkAmt = bump(t, WALK.t0 - 0.1, WALK.t0 + 0.3, WALK.t1 - 0.3, WALK.t1 + 0.1);
    }
  } else if (t < 88) {
    const f = flutter(t, FL.up1); x = f.x; y = f.y; Object.assign(st, f.st); face = -1; air = f.air;
    if (t < FL.up1.t0 + 0.42 * FL.up1.toLen) ground = PICK.y;
  } else if (t < FL.down3.t0) { x = RIM_R.x; y = RIM_R.y; face = -1; } // (the montage: she has been to and fro)
  else if (t < FL.up3.t0) { // down to the path for one more pebble ...
    const f = flutter(t, FL.down3); x = f.x; y = f.y; Object.assign(st, f.st); face = -1; air = f.air;
    if (t > FL.down3.touch - 0.2) ground = PICK3.y;
  } else if (t < FL.home.t0) { // ... and up again with it
    const f = flutter(t, FL.up3); x = f.x; y = f.y; Object.assign(st, f.st); face = -1; air = f.air;
    if (t < FL.up3.t0 + 0.42 * FL.up3.toLen) ground = PICK3.y;
  }
  else if (t < FL.home.touch + 1) {
    const f = flutter(t, FL.home); x = f.x; y = f.y; Object.assign(st, f.st); air = f.air;
    face = t < TURNS[1].swap ? -1 : 1; s = lerp(CS, 0.36, sm(t, 130.4, 133.6));
  } else { x = NEST_ROOT.x; y = NEST_ROOT.y; face = 1; s = 0.36; }
  const tu = turning(t); if (tu) { face = tu.face; st.turn = tu.turn; }
  const r = { x, y };

  // ---- how she feels and what she does (every weight eases)
  const flying = st.fly || (st.takeoff > 0.35) || (st.land > 0 && st.land < 0.6) ? 1 : 0;
  // thirsty and tired, until the idea
  let weary = 0.35 * (1 - sm(t, 75.4, 76.4)) + 0.4 * bump(t, 50.3, 51.2, 53.2, 54.2) + 0.45 * bump(t, 57.5, 58.3, 58.6, 59.0)
    + 0.6 * bump(t, 63.2, 64.0, 65.0, 66.2);
  if (t < 41.9) weary *= sm(t, 41.6, 42.4);
  st.weary = weary * (1 - flying);
  // c02 "Water!" - a happy start, then "Oh..."
  st.eyeBig = 0.9 * bump(t, 49.15, 49.35, 49.9, 50.5) + 0.5 * bump(t, 76.0, 76.2, 77.0, 77.6) + 0.5 * bump(t, 95.5, 95.7, 96.3, 96.9);
  st.headTilt = 0.18 * bump(t, 49.1, 49.4, 49.9, 50.6) - 0.22 * bump(t, 71.0, 71.8, 74.6, 75.6) + 0.08 * bump(t, 97.0, 97.4, 98.2, 98.7);
  st.lookUp = -0.9 * bump(t, 71.0, 71.6, 74.8, 75.6) + 0.3 * bump(t, 113.9, 114.3, 115.8, 116.4);
  // peering into the pitcher (n04, c02), and down at the pebbles (n07)
  st.peer = bump(t, 42.45, 43.2, 49.0, 49.4) + 0.8 * bump(t, 51.2, 51.9, 53.5, 54.3) + 0.35 * bump(t, 73.9, 74.4, 75.3, 75.8)
    + 0.7 * bump(t, 94.2, 94.9, 96.8, 97.3) + 0.55 * bump(t, 105.4, 105.8, 105.9, 106.5);
  // n05: the beak in as far as it will go, wriggling, then giving up
  st.reach = bump(t, 54.5, 55.6, 57.2, 58.0);
  st.strain = 0.85 * bump(t, 55.4, 55.8, 56.8, 57.25) + 0.85 * bump(t, 61.75, 62.05, 63.0, 63.4);
  // n06: her chest against the pitcher's side
  st.pushChest = bump(t, 61.3, 61.85, 63.1, 63.7);
  // c03: thinking
  st.think = bump(t, 65.3, 66.1, 69.9, 70.8);
  // the idea! (n07 "...she had an idea!")
  const iu = (t - 75.6) / 1.35; if (iu > 0 && iu < 1) st.idea = iu;
  st.happy = 0.6 * bump(t, 78.0, 78.4, 79.4, 80.1) + 0.65 * bump(t, 96.0, 96.5, 98.3, 98.9) + 0.9 * bump(t, 113.15, 113.5, 116.2, 116.9)
    + 0.25 * bump(t, 117.0, 118.0, 126.0, 128.0);
  // n08: the peck
  st.peck = bump(t, 80.45, 81.0, 81.3, 81.85) + bump(t, 100.35, 100.85, 101.05, 101.5);
  // dropping pebbles over the mouth
  st.aim = bump(t, 83.55, 84.0, 84.55, 85.1) + bump(t, 103.0, 103.4, 103.75, 104.2);
  st.aimTilt = 1.3;
  // n12: drinking
  st.drink = bump(t, 106.35, 106.95, 110.7, 111.4);
  st.drinkPhase = keys(t, [[106.0, -0.2], [107.15, 0], [WORD.drank1 + 0.3, 0.5], [108.3, 1], [WORD.drank2 + 0.4, 1.5], [109.6, 2], [110.4, 2.5], [111.6, 2.5]]);
  // asleep in the nest (n15)
  st.sleep = sm(t, 137.3, 140.3);
  if (t > FL.home.touch + 0.7) st.legs = false;
  if (t > FL.home.touch) st.fluff = 0.12 * sm(t, 140, 142) * (0.5 + 0.5 * Math.sin(t * 0.9)); // the breeze in her feathers
  // where the beak goes (aim / peck / reach / drink share one target; switched only while unused)
  let tg;
  if (t < 59) tg = toLocal(r, 1, PITCHER.x + 4, PITCHER.rimY + 26);              // deep in the neck (n05)
  else if (t < 82.5) tg = toLocal(r, -1, PEB1.x, PEB1.y - 0.62 * PEB1.r * pebScale(PEB1)); // the pebble
  else if (t < 99) tg = toLocal(RIM_R, -1, PITCHER.x - 8, PITCHER.rimY + 2);     // over the mouth
  else if (t < 102) tg = toLocal(PICK3, -1, PEB3_AT.x, PEB3_AT.y - 0.62 * PEB3.r * pebScale(PEB3)); // the last pebble
  else if (t < 104.5) tg = toLocal(RIM_R, -1, PITCHER.x - 8, PITCHER.rimY + 2);
  else tg = toLocal(RIM_R, -1, PITCHER.x - 12, PITCHER.rimY + 4);                 // the water at the brim
  st.aimX = tg.x; st.aimY = tg.y;
  // talking
  const talk = Math.max(say('c02', t), say('c03', t), say('c04', t), say('c05', t), say('c06', t));
  st.beak = Math.max(talk * 0.85, 0.7 * bump(t, 80.6, 80.75, 80.92, 81.02), 0.65 * bump(t, REL1 - 0.03, REL1 + 0.06, REL1 + 0.3, REL1 + 0.5),
    0.7 * bump(t, 100.45, 100.6, 100.77, 100.87), 0.65 * bump(t, REL3 - 0.03, REL3 + 0.06, REL3 + 0.3, REL3 + 0.5));
  // carrying a pebble?
  let held = null;
  if (t >= 81.0 && t < REL1) held = PEB1;
  else if (t >= 100.85 && t < REL3) held = PEB3;
  return { x: r.x, y: r.y, s, face, st, ground, air, held };
}
const poseG = (t) => G(t).st;

// pebbles still lying on the path: the ones she takes vanish while we are looking elsewhere
const USED_LATER = [0, 1, 2, 3, 6, 7, 8, 9, 10, 13];
function pathPebbles(t) {
  return PEBBLES.filter((p, i) => {
    if (i === 3) return false;                          // drawn by us (small), until she picks it up
    if (i === 9) return false;                          // the last one: drawn by us beside PICK3
    if (i === 5) return t < 90;
    if (t > 104 && USED_LATER.includes(i)) return false;
    return true;
  });
}
// the water in the pitcher, 0 (a little at the bottom) .. 1 (at the brim), and the pebbles in it
const CUT_DROPS = [89.6, 90.7, 91.8, 92.9];              // seen through the clay, one by one
const DROPS = [WORD.plip, WORD.plop, ...CUT_DROPS, REL3 + 0.55];
const INC = [0.06, 0.06, 0.17, 0.17, 0.17, 0.17, 0.2];
const level = (t) => DROPS.reduce((a, d, i) => a + INC[i] * sm(t, d + 0.05, d + 0.8), 0);
const landed = (t) => DROPS.filter((d) => t >= d).length;
const lastDrop = (t) => { let l = -1; for (const d of DROPS) if (t >= d) l = d; return l; };

function drawCrowAt(g, r, poseFn, t, since, filter) {
  g.save(); g.translate(r.x, r.y); g.scale(-r.face * r.s, r.s);
  if (r.ground != null) crow.shadow(g, r.st, (r.ground - r.y) / r.s);
  if (filter) g.filter = filter; // evening light on her feathers
  crow.drawAt(g, poseFn, t, { since });
  g.restore();
}

// the garden with her in it: mood, camera, the shot's start (for follow-through)
function garden(g, t, c, mood, since, o = {}) {
  S.paperBg(g);
  const r = G(t);
  // she pushes from the right: it rocks a hair to the left, and settles back with a tiny wobble
  const lv = level(t);
  const tilt = keys(t, [[61.8, 0], [62.2, -0.042], [62.5, -0.014], [62.85, -0.036], [63.25, 0], [63.45, 0.007], [63.75, -0.002], [64.0, 0]]);
  drawGarden(g, t, c, mood, {
    pebbles: pathPebbles(t), pitcher: { tilt }, sky: mood !== 'night', starsK: 0, glow: o.glow,
    behind: o.behind,
    actors: (h) => {
      // the water, once it has come up near the brim
      if (lv > 0.85 && mood !== 'night') drawMouthWater(h, t, sm(lv, 0.85, 0.97), mood);
      if (t < 81.0 && t > 60) drawPebble(h, PEB1, { scale: pebScale(PEB1), mood });
      if (t < 100.85 && t > 93) drawPebble(h, PEB3, { x: PEB3_AT.x, y: PEB3_AT.y, scale: pebScale(PEB3), mood });
      if (!o.crowAfter) actor(h);
      if (o.actors) o.actors(h);
    },
    after: (h) => { if (o.crowAfter) actor(h); if (o.after) o.after(h); },
  });
  function actor(h) {
      const sn = Math.max(since, lastSwap(t));
      drawCrowAt(h, r, poseG, t, sn, mood === 'night' ? 'brightness(0.42) saturate(0.8)' : mood === 'sunset' ? 'sepia(0.12) brightness(0.92)' : null);
      if (t > FL.home.touch - 0.8) drawNestFront(h, mood);
      // a pebble in her beak, exactly at the grip; and the one she lets go, falling into the mouth
      if (r.held) {
        const q = crow.beakTipAt(poseG, t, { since: sn, x: r.x, y: r.y, scale: r.s, face: -r.face });
        drawPebble(h, r.held, { x: q.gripX, y: q.gripY + r.held.r * 0.62 * pebScale(r.held), scale: pebScale(r.held), rot: 0.2 * Math.sin(t * 2), shadow: false, mood });
      }
      for (const [rel, p] of [[REL1, PEB1], [REL3, PEB3]]) {
        const dt = t - rel; if (dt <= 0 || dt > 0.5) continue;
        const rr = G(rel), q = crow.beakTipAt(poseG, rel, { since: sn, x: rr.x, y: rr.y, scale: rr.s, face: -rr.face });
        drawPebble(h, p, { x: q.gripX, y: q.gripY + 2200 * 0.5 * dt * dt + p.r * 0.62 * pebScale(p), scale: pebScale(p), shadow: false, mood });
      }
      // the pitcher's front lip in front of anything that dips into its mouth
      if (r.y < PITCHER.rimY + 60) {
        drawPitcher(h, mood, { lipOnly: true });
        if (lv > 0.85 && mood !== 'night') drawMouthWater(h, t, sm(lv, 0.85, 0.97), mood, true);
      }
  }
}
// cool water right up at the brim, seen in the pitcher's mouth (and its near half again over a dipping beak)
function drawMouthWater(g, t, k, mood, front = false) {
  const { x, y, rx, ry } = MOUTH;
  g.save(); g.globalAlpha = k;
  g.beginPath(); g.ellipse(x, y + 1, rx * 0.93, ry * 0.8, 0, front ? 0 : 0, front ? Math.PI : TAU); g.clip();
  const wg = g.createLinearGradient(0, y - ry, 0, y + ry);
  wg.addColorStop(0, mood === 'sunset' ? '#e8b8a0' : '#cfe4e4'); wg.addColorStop(0.5, mood === 'sunset' ? '#9a8090' : '#6e9ea6'); wg.addColorStop(1, '#3e6670');
  g.fillStyle = wg; g.fillRect(x - rx, y - ry, rx * 2, ry * 2 + 2);
  // rings where her beak touches the water
  const d = G(t).st.drink * clamp(1 - Math.abs(((G(t).st.drinkPhase % 1) + 1) % 1 - 0) * 3);
  g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 0.8;
  for (let i = 0; i < 2; i++) { const p = (t * 0.6 + i / 2) % 1; g.globalAlpha = k * (0.25 + d) * (1 - p) * 0.8; g.beginPath(); g.ellipse(x - 12, y + 1, 3 + p * 16, 1 + p * 4, 0, 0, TAU); g.stroke(); }
  g.globalAlpha = k * 0.8; g.fillStyle = 'rgba(255,252,236,0.85)'; g.beginPath(); g.ellipse(x + 8, y - 1.5, 6, 1.2, 0, 0, TAU); g.fill();
  g.restore();
}

// ---------------------------------------------------------------- cameras
function camGarden(t) {
  let c = view(PITCHER.x - 200, PITCHER.rimY - 40, 1.3);
  c = mixv(c, view(PITCHER.x, PITCHER.rimY + 20, 2.4), sm(t, 39.6, 43.3));
  c = mixv(c, view(PITCHER.x + 45, PITCHER.rimY + 125, 2.05), sm(t, 58.7, 61.0));      // down with her to the ground
  c = mixv(c, view(PITCHER.x + 60, PITCHER.rimY + 120, 2.25), sm(t, 64.8, 68.6));      // in a little while she thinks
  c = mixv(c, view(PITCHER.x + 45, PITCHER.rimY + 125, 2.05), sm(t, 70.4, 73.2));
  c = mixv(c, view(PITCHER.x + 10, PITCHER.rimY - 25, 3.0), sm(t, 103.9, 104.5));     // (during the look down the neck)
  c = mixv(c, view(PITCHER.x + 10, PITCHER.rimY - 20, 3.25), sm(t, 105.6, 112.0));
  c = mixv(c, view(960, 540, 1.0), sm(t, 117.6, 126.2));                               // n13: pull back over the garden
  return c;
}
function camEvening(t) {
  let c = view(960, 540, 1.0);
  c = mixv(c, view(1470, 430, 1.55), sm(t, 130.3, 134.7));
  c = mixv(c, view(NEST[0] - 10, NEST[1] + 15, 2.6), sm(t, 134.9, 139.6));
  c = mixv(c, view(1080, 470, 1.15), sm(t, 144.6, 152.2));
  c = mixv(c, view(1180, 400, 1.2), sm(t, 152.4, 175.0));        // the moon and her nest, both in the picture
  return c;
}

// ---------------------------------------------------------------- shots
function drawTitle(g, t) {
  S.paperBg(g); g.fillStyle = 'rgba(250,214,160,0.16)'; g.fillRect(0, 0, W, H);
  cam(g, { z: 1 + t * 0.004, x: 0, y: 0 }, 1);
  g.save(); g.textAlign = 'center'; g.fillStyle = INK;
  const a1 = span(t, 0.6, 2.4), a2 = span(t, 1.4, 3.2), a3 = span(t, 2.4, 4.0);
  g.globalAlpha = a1 * 0.9; g.font = '110px "Fell"'; g.fillText('The Crow', 960, 330 + (1 - a1) * 10);
  g.globalAlpha = a2 * 0.9; g.font = 'italic 100px "Fell"'; g.fillText('& the Pitcher', 960, 460 + (1 - a2) * 10);
  g.globalAlpha = a3 * 0.75; g.font = 'italic 40px "Fell"'; g.fillText('an Aesop’s fable, for sleepy little ones', 960, 550);
  g.restore();
  // a little pitcher, and the crow gliding in to land beside it
  const GY = 840, PX = 1095, PS = 0.72;
  g.save(); g.globalAlpha = span(t, 0.2, 1.4);
  pool(g, PX + 30, GY + 4, 260, 16, '#8a7058', 0.18);
  g.save(); g.translate(PX, GY); g.scale(PS, PS); g.translate(-PITCHER.x, -PITCHER.y); drawSprite(g, pitcherSprite('hot')); g.restore();
  const r = titleCrow(t);
  g.save(); g.translate(r.x, r.y); g.scale(-0.62, 0.62);
  if (!r.air) crow.shadow(g, r.st, 0);
  crow.drawAt(g, (tt) => titleCrow(tt).st, t, { since: 0 });
  g.restore(); g.restore();
}
function titleCrow(t) {
  const touch = 3.5, t0 = 0.3, ldLen = 1.5, ldStart = touch - 0.55 * ldLen, X = 900, Y = 840;
  const u = clamp((t - t0) / (touch - t0));
  const st = { t, beat: (t - t0) * 2.7, glide: 0.8 * (1 - sm(t, 1.6, 2.3)) };
  if (t < ldStart) st.fly = 1; else if (t < ldStart + ldLen) st.land = (t - ldStart) / ldLen;
  st.headTilt = 0.1 * bump(t, 4.2, 4.6, 5.6, 6.2); st.lookUp = 0.4 * bump(t, 4.2, 4.5, 5.6, 6.2);
  return { x: lerp(-180, X, 1 - Math.pow(1 - u, 2)), y: lerp(420, Y, 1 - Math.pow(1 - u, 2.4)), st, air: t < touch };
}

// the opening: the parched fields from high up, the tired little crow flying over them
// the ground travels under her: the multiplane fields scroll (near planes faster), easing in and out
const fieldsScroll = (t) => FIELDS_PAN.max * walkDist(clamp((t - 5.0) / (37.0 - 5.0)));
function fieldsCam(t) {
  const P = fieldsGardenAt(fieldsScroll(t)).pitcher;
  let c = view(940, 540, 1.1);                                  // (the garden starts just out of the picture, on the right)
  c = mixv(c, view(970, 530, 1.13), sm(t, 6, 30));
  c = mixv(c, view(P[0], P[1] - 10, 2.7), sm(t, 33.0, 40.6));
  return c;
}
function fieldsCrow(t) {
  const st = { t, fly: 1, beat: t * 2.25 };
  st.glide = s5(clamp((Math.sin(t * TAU / 6.5 + 0.6) - 0.15) * 1.5)) * 0.85;
  st.glide = Math.max(st.glide, sm(t, 33.4, 34.6));
  st.pitch = 0.05 - 0.28 * sm(t, 33.6, 35.5);
  st.beak = say('c01', t) * 0.8; st.eye = 0.75;
  st.headTilt = -0.12 - 0.3 * bump(t, 31.0, 31.8, 35, 36.5); st.lookUp = -0.9 * bump(t, 31.0, 31.6, 36, 37);
  st.eyeBig = 0.7 * bump(t, 31.6, 31.9, 33.2, 34.0);
  // across the frame, slowing as she talks, then down toward the garden far below
  const x = keys(t, [[16.4, -180], [23.0, 520], [33.4, 820]]);
  const y = 330 + 14 * Math.sin(t * 0.55) + 30 * sm(t, 20, 30);
  const c = fieldsCam(t), P = fieldsGardenAt(fieldsScroll(t)).pitcher, gx = (P[0] - W / 2 - c.x) * c.z + W / 2, gy = (P[1] - 18 - H / 2 - c.y) * c.z + H / 2;
  const k = sm(t, 33.6, 38.3);
  return { x: lerp(x, gx, k), y: lerp(y, gy, k * k), s: lerp(0.62, 0.05, Math.pow(k, 0.8)), st };
}
function drawFields(g, t) {
  const c = fieldsCam(t);
  S.paperBg(g); drawFieldsParallax(g, fieldsParallax('hot'), c, fieldsScroll(t), { t });
  cam(g, c, 1); dustMotes(g, t, 20, { x0: 0, x1: 1920, y0: 300, y1: 1000 }, 3);
  if (t > 16 && t < 38.3) {
    const r = fieldsCrow(t);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.save(); g.translate(r.x, r.y); g.scale(-r.s, r.s); crow.drawAt(g, (tt) => fieldsCrow(tt).st, t, { since: 16 }); g.restore();
  }
  sunlight(g, 0.35);
}

// looking down into the pitcher: pebbles fall in from where we (she) are, and splash
function drawPOV(g, t) {
  const lv = level(t);
  S.paperBg(g); cam(g, { z: 1 + 0.06 * sm(t, 43.5, 48.6) + 0.002 * (t % 100), x: 0, y: 8 * Math.sin(t * 0.3) }, 1);
  const ld = lastDrop(t);
  drawPitcherCloseup(g, lv, t, { stones: landed(t), splashT: ld > 0 ? t - ld : -1, maxStones: 12 });
  // the falling pebble: from just in front of us down the dark neck to the water
  for (const d of DROPS) {
    const u = (t - (d - 0.44)) / 0.44; if (u <= 0 || u >= 1) continue;
    const e = 1 - lv, k = 1 - CLOSEUP.shrink * e, wx = CLOSEUP.cx + e * 12, wy = CLOSEUP.icy + e * CLOSEUP.DY, q = u * u;
    const sc = lerp(5.5, 2.4 * k, 1 - Math.pow(1 - q, 1.6));
    drawPebble(g, PEBBLES[(DROPS.indexOf(d) + 3) % PEBBLES.length], { x: lerp(CLOSEUP.cx - 140, wx, q), y: lerp(-80, wy, q), scale: sc, rot: u * 2, shadow: false });
  }
}
// the peek through the clay: pebble by pebble, the water rises
function drawCutaway(g, t) {
  S.paperBg(g); cam(g, { z: 1.0 + 0.04 * sm(t, 88.8, 94.8), x: 0, y: 0 }, 1);
  const n = 2 + CUT_DROPS.reduce((a, d) => a + clamp((t - (d - 0.32)) / 0.72), 0);
  drawPitcherCutaway(g, level(t), n, t, { x: 960, base: 860, h: 640 });
}
const gardenShot = (since, mood = 'hot') => (g, t) => {
  garden(g, t, camGarden(t), mood, since);
  if (t > 117) sunlight(g, 0.7 * sm(t, 118, 126.5), 0.8 * sm(t, 118, 126.5));
};
function drawEvening(g, t, night = false) {
  const c = camEvening(t), mood = night ? 'night' : 'sunset';
  const L = gardenLayers(mood);
  garden(g, t, c, mood, 126.9, {
    crowAfter: true, glow: sm(t, 145, 150),
    behind: night ? (h) => nightSkyRising(h, t, c, L) : null,
    after: (h) => { if (t > 140.5) zzz(h, t, NEST[0] + 28, NEST[1] - 34, 141.0, 1e9); },
  });
  if (!night) sunlight(g, 0.35, 1);
}
// stars and a rising moon, kept in the sky (behind the elm, the cottage and everything else)
let SKYBUF;
function nightSkyRising(g, t, c, L) {
  if (!SKYBUF) SKYBUF = canvas(W, H, false);
  const b = SKYBUF.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H); cam(b, c, 1);
  softStars(b, t, 1, 148.0);
  moon(b, MOON[0], MOON[1] + 120 * (1 - sm(t, 143.5, 153)), 40, sm(t, 143.5, 146.5));
  b.globalCompositeOperation = 'destination-in'; b.drawImage(L.skyMask, -M, -MY, LW, LH); b.globalCompositeOperation = 'source-over';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(SKYBUF, 0, 0); g.restore();
}
function drawEnd(g, t) {
  const n17 = S.line('n17'), END = S.TL.duration;
  const a = span(t, n17.end + 1.5, n17.end + 4.5) * (1 - span(t, END - 12, END - 7));
  if (a <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.textAlign = 'center';
  g.fillStyle = `rgba(250,238,210,${0.85 * a})`; g.font = 'italic 76px "Fell"'; g.fillText('Sweet dreams', 1010, 300);
  g.font = 'italic 34px "Fell"'; g.fillStyle = `rgba(250,238,210,${0.6 * a})`; g.fillText('the end', 1010, 355);
  g.restore();
}

// ---------------------------------------------------------------- the edit: shots with cuts, dissolves and fades
// [start, draw, transition into it: seconds (watercolour dissolve), 0 (cut), or { fade: seconds } (plain cross-fade)]
let SHOTS;
let BUF_A, BUF_B, MASKC;
function dissolveInto(g, t, A, B, p, fade) {
  const ga = BUF_A.getContext('2d'), gb = BUF_B.getContext('2d');
  ga.setTransform(1, 0, 0, 1, 0, 0); gb.setTransform(1, 0, 0, 1, 0, 0);
  A(ga, t); B(gb, t);
  ga.setTransform(1, 0, 0, 1, 0, 0); gb.setTransform(1, 0, 0, 1, 0, 0);
  g.setTransform(1, 0, 0, 1, 0, 0);
  if (fade) { g.drawImage(BUF_A, 0, 0); g.globalAlpha = s5(p); g.drawImage(BUF_B, 0, 0); g.globalAlpha = 1; return; }
  const w = MASKC.width, h = MASKC.height, mg = MASKC.getContext('2d'), img = mg.createImageData(w, h), th = p * 1.5 - 0.3;
  for (let i = 0; i < w * h; i++) img.data[i * 4 + 3] = 255 * clamp((th - S.maskNoise[i]) / 0.3);
  mg.putImageData(img, 0, 0);
  gb.save(); gb.globalCompositeOperation = 'destination-in'; gb.imageSmoothingQuality = 'high'; gb.filter = 'blur(14px)';
  gb.drawImage(MASKC, -20, -20, W + 40, H + 40); gb.restore();
  g.drawImage(BUF_A, 0, 0); g.drawImage(BUF_B, 0, 0);
}
function master(g, t) {
  let i = 0; while (i + 1 < SHOTS.length && t >= SHOTS[i + 1][0]) i++;
  const [start, draw, tr] = SHOTS[i], D = typeof tr === 'object' ? tr.fade : tr || 0;
  if (i > 0 && D > 0 && t < start + D) dissolveInto(g, t, SHOTS[i - 1][1], draw, (t - start) / D, typeof tr === 'object');
  else draw(g, t);
  drawEnd(g, t);
}

window.FABLE = {
  async setup(timeline) {
    S = makeStage(timeline);
    await S.setup(document.getElementById('c'));
    crow = makeCrow3(2.0, 4);
    BUF_A = canvas(W, H, false); BUF_B = canvas(W, H, false); MASKC = canvas(240, 135, false);
    fieldsParallax('hot'); for (const m of ['hot', 'sunset', 'night']) gardenLayers(m);
    { const g = canvas(8, 8, false).getContext('2d'); drawPitcherCloseup(g, 0, 0); drawPitcherCutaway(g, 0.2, 1, 0, { x: 960, base: 860, h: 640 }); }
    SHOTS = [
      [0, drawTitle],
      [5.6, drawFields, 1.8],
      [38.6, gardenShot(38.6), 2.0],          // she flies down onto the rim
      [43.45, drawPOV, 0.7],                  // "There was water! But only a little..."
      [48.5, gardenShot(48.4), 0.9],          // c02 .. n08
      [84.22, drawPOV, 0],                    // cut down the neck: "Plip!" ... then another: "Plop!"
      [88.8, drawCutaway, 1.2],               // and another, and another: pebble by pebble, the water rose
      [93.6, gardenShot(93.5), 1.2],          // "It's working! Just a few more..." - down for one more, and up
      [103.62, drawPOV, 0],                   // the last one: right up to the top
      [105.6, gardenShot(105.5), 1.0],        // she drinks; the lesson; pull back as the light warms
      [127.0, (g, t) => drawEvening(g, t, false), 2.2],
      [142.8, (g, t) => drawEvening(g, t, true), { fade: 4.5 }],
    ];
  },
  frame(t) { S.frame(t, [[0, master]]); },
};
