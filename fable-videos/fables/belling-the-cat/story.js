// Belling the Cat: shots, camera, timing and acting.
//
// The cast are rigs (engine/characters/mice3.js, cat3.js), always drawn with drawAt (follow-through) from a pose
// FUNCTION of time, so every number eases and nothing pops. Each place is one continuous performance (the home in the
// evening, the cat in the kitchen, the council by the candle, the nests, the kitchen at night); the shots are just
// cameras on it, eased, cut or dissolved. Walks are distance-driven (walk = distance / stride, stopping on a half
// cycle so both feet are down), turns use the rig's `turn` and then the mirrored transform with a fresh `since`.
// The word onsets the action is locked to were measured from the voice's loudness envelope (WORD below).
import { W, H, canvas, clamp, lerp, span, rgba, pool, noise1 } from '../../engine/watercolor.js';
import { INK, cam, zzz, makeStage } from '../../engine/stage.js';
import { makeMouseRig, hopX } from '../../engine/characters/mice3.js';
import { makeCatRig, pounceX } from '../../engine/characters/cat3.js';
import { HOME, KITCHEN, view, homeLayers, drawHome, kitchenLayers, drawKitchen, drawThoughtBubble, candleShadow, darkK } from './scene.js';

let S, MICE = {}, CAT;
const TAU = Math.PI * 2;
const say = (id, t) => S.talking(id, t);

// ---------------------------------------------------------------- timing helpers
const s5 = (x) => { x = clamp(x); return x * x * x * (x * (x * 6 - 15) + 10); };       // smootherstep
const sm = (t, a, b) => s5((t - a) / (b - a));                                          // eased ramp a..b
const bump = (t, a, b, c, d) => sm(t, a, b) * (1 - sm(t, c, d));                        // up a..b, down c..d
const hold = (t, a, b, r = 0.4) => bump(t, a - r, a, b, b + r);                          // on from a to b (eased edges)
const mixv = (a, b, k) => { const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), k)); // zoom eased in log space
  return { z, x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) }; };
const phase = (t, a, len) => { const u = (t - a) / len; return u > 0 && u < 1 ? u : 0; }; // a one-off event phase
// a camera path: [[t0, t1, view], ...] eased one after the other from a first view; { cut: t, v } jumps
function camPath(t, v0, moves) {
  let c = v0;
  for (const m of moves) {
    if (m.cut !== undefined) { if (t >= m.cut) c = m.v; continue; }
    c = mixv(c, m[2], sm(t, m[0], m[1]));
  }
  return c;
}
// distance profile of a walk: speeds up, cruises, slows down (C1-continuous), 0..1 -> 0..1
function walkDist(u) {
  const a = 0.3, v = 1 / (1 - a);
  if (u <= 0) return 0; if (u >= 1) return 1;
  if (u < a) return v * u * u / (2 * a);
  if (u > 1 - a) return 1 - v * (1 - u) * (1 - u) / (2 * a);
  return v * (a / 2 + (u - a));
}
// mouth chewing in little bursts (nibbling)
const chew = (t, seed = 0) => clamp(0.3 * (0.5 + 0.5 * Math.sin(t * 11 + seed)) * s5((Math.sin(t * 0.9 + seed) + 0.2) * 2));

// Word onsets measured from the voice envelope (build/belling-the-cat/timeline.json, 24 Hz)
const WORD = {
  mice: 11.08, nests: 20.59, cheese: 21.88, cake: 23.22, worry: 25.43,
  cat: 28.90, quiet: 32.32, crumb: 34.70, creep: 36.99, shadow: 38.07, pounce: 40.20,
  gathered: 44.64, candle: 47.10, whisper: 59.51, jumped: 63.88, onto: 64.34,
  know: 66.95, bell: 68.70, near: 71.30, jingle1: 74.17, jingle2: 74.55, run: 75.88, hide: 76.38,
  wonderful: 79.05, cheered: 81.84, clapped: 82.63, danced: 84.63,
  plan: 87.88, tellme: 90.51, who: 93.52, quietRoom: 99.32, toes: 104.69, ceiling: 106.77, slowly: 109.85, sat: 110.10,
  oh: 113.52, easy: 118.51, carefully: 128.86, close: 131.98, blew: 136.01, snuggled: 137.47,
  kitchen: 143.52, curled: 146.73, purred: 149.32, moon: 153.34, still: 157.80,
};
const OUT_AT = 136.30;                 // the candle goes out ("They blew out the candle")

// ---------------------------------------------------------------- actors
// An actor walks only sideways (no depth walks), turns round on the spot, and is drawn with drawAt.
//   rig, s (page units per rig unit), x0, y (feet), face0 (+1 facing right, -1 facing left)
//   moves [{ t0, t1, to }]: distance-driven walks along x, snapped to whole half-cycles (both feet down at the end)
//   turns [{ a, b, swap }]: turn 0 -> 1 from a to b, hold, mirror at swap (turn 0, fresh follow-through)
//   dx(t), dy(t): extra root offsets (hops, jumps);  pose(t) -> state (everything else)
function actor(o) {
  const half = 0.5 * o.s * o.rig.STRIDE;
  let from = o.x0, face = o.face0;
  const turns = o.turns || [];
  const moves = (o.moves || []).map((m) => {
    face = o.face0 * (turns.filter((q) => q.swap <= m.t0).length % 2 ? -1 : 1);
    const to = m.by !== undefined ? from + m.by : m.to;
    const d = Math.round((to - from) / half) * half, r = { ...m, from, d };
    if (d * face < 0) console.warn('[story] walking backwards!', o.name, m);
    from += d; return r;
  });
  const A = {
    name: o.name, rig: o.rig, s: o.s, o,
    x(t) { let x = o.x0; for (const m of moves) x += m.d * walkDist(clamp((t - m.t0) / (m.t1 - m.t0))); return x + (o.dx ? o.dx(t) : 0); },
    y(t) { return o.y + (o.dy ? o.dy(t) : 0); },
    face(t) { let f = o.face0; for (const T of turns) if (t >= T.swap) f = -f; return f; },
    since(t, s0) { let s = s0; for (const T of turns) if (t >= T.swap) s = Math.max(s, T.swap); return s; },
    st(t) {
      let walk = 0, amt = 0;
      for (const m of moves) {
        walk += Math.abs(m.d) * walkDist(clamp((t - m.t0) / (m.t1 - m.t0))) / (o.s * o.rig.STRIDE);
        amt = Math.max(amt, bump(t, m.t0 - 0.15, m.t0 + 0.3, m.t1 - 0.3, m.t1 + 0.15));
      }
      let turn = 0;
      for (const T of turns) if (t >= T.a - 0.02 && t < T.swap) turn = sm(t, T.a, T.b);
      const st = { t, walk, walkAmt: amt, turn, ...(o.pose ? o.pose(t) : {}) };
      if (st.walkAmt === undefined) st.walkAmt = amt;
      return st;
    },
    // the transform for the rig's helpers (pawsAt, mouthAt, headAt ...)
    tf(t) { return { x: A.x(t), y: A.y(t), scale: o.s, face: -A.face(t) }; },
    visible: o.visible || (() => true),
  };
  A.poseFn = (tt) => A.st(tt);
  return A;
}
// draw one actor: its shadow, then the rig with follow-through. o: { since, shadow: fn(g, x, y, A) | 'rig' | false }
function drawActor(g, A, t, since0, o = {}) {
  if (!A.visible(t)) return;
  const x = A.x(t), y = A.y(t), f = A.face(t), s = A.s;
  if (typeof o.shadow === 'function') o.shadow(g, x, y, A);
  g.save(); g.translate(x, y); g.scale(-f * s, s);
  if (o.shadow === 'rig' && !o.noShadow) A.rig.shadow(g, A.st(t), o.ground !== undefined ? (o.ground - y) / s : 0);
  A.rig.drawAt(g, A.poseFn, t, { since: A.since(t, since0) });
  g.restore();
}
// draw into a buffer, then tint everything drawn there (the colour of the light the actors stand in)
let ABUF;
function tinted(g, col, a, fn) {
  if (a <= 0.01) { fn(g); return; }
  const b = ABUF.getContext('2d');
  b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H);
  b.setTransform(g.getTransform()); fn(b);
  b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-atop'; b.globalAlpha = a; b.fillStyle = col; b.fillRect(0, 0, W, H);
  b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(ABUF, 0, 0); g.restore();
}

// ================================================================ THE MICE'S HOME, EVENING (n01, n02)
// Mother and baby come home along the floor; the plump one nibbles a crumb of seed cake by the button table; the
// young one bounces by the cotton reel; the shy one yawns by the walnut nest. On "one big worry" everyone stops and
// looks toward the little door to the kitchen.
const H1 = 11.0;     // the shot's start
const HS = 0.95;
let homeCast;
function makeHomeCast() {
  const worry = (t) => bump(t, WORD.worry - 0.1, WORD.worry + 0.6, 27.4, 28.6);
  const mother = actor({ name: 'mother', rig: MICE.mother, s: HS, x0: 1420, y: 838, face0: -1,
    moves: [{ t0: 10.2, t1: 16.6, to: 1130 }],
    pose: (t) => ({ smile: 0.65, headTurn: 0.45 * bump(t, 17.2, 17.9, 19.6, 20.4) + 0.5 * worry(t), happy: 0.5 * bump(t, 17.4, 17.9, 19.4, 20.0),
      earsBack: 0.5 * worry(t), sad: 0.5 * worry(t), gaze: 0.2 * worry(t), nod: 0.6 * bump(t, 18.0, 18.3, 19.2, 19.6) }) });
  const baby = actor({ name: 'baby', rig: MICE.baby, s: HS, x0: 1520, y: 864, face0: -1,
    moves: [{ t0: 10.4, t1: 16.9, to: 1222 }],
    pose: (t) => ({ hop: phase(t, 17.6, 0.9) || phase(t, 18.6, 0.9), hopHeight: 28, happy: 0.7 * bump(t, 17.5, 17.8, 19.5, 20.0),
      headTurn: 0.3 * bump(t, 13, 13.6, 15.0, 15.6) + 0.35 * worry(t), earsBack: 0.4 * worry(t), sad: 0.6 * worry(t), cover: 0.0 }) });
  const plump = actor({ name: 'plump', rig: MICE.plump, s: HS, x0: 676, y: 832, face0: 1,
    pose: (t) => { const w = worry(t); return { shy: 0.95 * (1 - 0.4 * w), mouth: chew(t, 1) * (1 - w) * (0.4 + 0.6 * bump(t, 22.9, 23.3, 24.9, 25.3)),
      happy: 0.8 * bump(t, 23.3, 23.7, 24.6, 25.1) + 0.3 * bump(t, 13, 14, 16, 17), headTilt: -0.05 + 0.06 * Math.sin(t * 1.3), earsBack: 0.6 * w, sad: 0.7 * w, eyeBig: 0.4 * bump(t, 25.5, 25.8, 26.4, 27.0) }; } });
  const young = actor({ name: 'young', rig: MICE.young, s: HS, x0: 1580, y: 874, face0: -1,
    pose: (t) => ({ bounce: 0.8 * (1 - worry(t)), hop: phase(t, 12.6, 0.95) || phase(t, 15.4, 0.95), hopHeight: 30, happy: 0.6 * bump(t, 12.8, 13.1, 13.6, 14.0),
      headTurn: 0.35 * bump(t, 18.6, 19.2, 21.0, 21.8), earsBack: 0.4 * worry(t), sad: 0.45 * worry(t), eyeBig: 0.3 * worry(t) }) });
  const shy = actor({ name: 'shy', rig: MICE.shy, s: HS, x0: 372, y: 900, face0: -1,
    pose: (t) => ({ yawn: phase(t, 20.4, 2.3), explain: 0.6 * bump(t, 14.0, 14.6, 17.4, 18.4), lean: 0.08 * bump(t, 14.0, 14.6, 17.4, 18.4), happy: 0.5 * bump(t, 22.6, 23.0, 24.0, 24.6),
      headTurn: 0.5 * worry(t), earsBack: 0.4 * worry(t), sad: 0.5 * worry(t) }) });
  return [mother, baby, plump, young, shy];
}
// a crumb of seed cake in the plump mouse's paws
function drawCakeCrumb(g, x, y, r = 9) {
  g.save(); g.fillStyle = '#e8c890'; g.strokeStyle = rgba(INK, 0.6); g.lineWidth = 1;
  g.beginPath(); g.moveTo(x - r, y + r * 0.5); g.lineTo(x - r * 0.4, y - r * 0.8); g.lineTo(x + r, y - r * 0.2); g.lineTo(x + r * 0.7, y + r * 0.7); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#7a4a2a'; for (const [dx, dy] of [[-3, 0], [2, -3], [3, 3]]) { g.beginPath(); g.arc(x + dx, y + dy, 1.1, 0, TAU); g.fill(); }
  g.restore();
}
// home lighting for an actor standing at x: darker toward the walls, away from the candle
const homeShade = (x) => 0.32 * clamp((Math.abs(x - HOME.CANDLE.x) - 160) / 700);
function homeActors(g, t, list, since0, o = {}) {
  const items = list.filter((A) => A.visible(t)).sort((a, b) => a.y(t) - b.y(t));
  const dk = o.dark || 0;
  for (const A of items) {
    const x = A.x(t), y = A.y(t);
    if (!o.noShadow) {
      if (dk < 1) candleShadow(g, x, y, 70 * A.s * A.rig.size, 170 * A.s * A.rig.size, 0.75 * (1 - dk));
      if (dk > 0) pool(g, x, y + 2, 46 * A.s, 8 * A.s, '#141428', 0.4 * dk);
    }
    tinted(g, dk > 0 ? '#1e2250' : '#3a2214', dk > 0 ? lerp(homeShade(x), 0.55, dk) : homeShade(x), (h) => drawActor(h, A, t, since0));
    if (o.each) o.each(g, A, t);
  }
}
const camHome1 = (t) => camPath(t, view(1215, 660, 2.0), [
  [11.2, 15.6, view(900, 640, 1.2)],
  [WORD.nests - 0.4, WORD.nests + 0.9, view(430, 740, 1.75)],
  [WORD.cheese - 0.3, WORD.cheese + 0.9, view(740, 660, 2.0)],
  [WORD.cake - 0.2, WORD.cake + 1.2, view(690, 670, 2.25)],
  [WORD.worry - 0.3, 27.8, view(940, 650, 1.3)],
]);
function drawHome1(g, t) {
  S.paperBg(g);
  const c = camHome1(t);
  drawHome(g, t, c, {
    actors: (h) => homeActors(h, t, homeCast, H1, { each: (hh, A, tt) => {
      if (A.name !== 'plump') return;
      const p = A.rig.pawsAt(A.poseFn, tt, A.tf(tt));
      drawCakeCrumb(hh, (p.near.x + p.far.x) / 2 + 3, (p.near.y + p.far.y) / 2 - 4, 8);
    } }),
  });
}

// ================================================================ THE KITCHEN, EVENING: THE CAT (n03)
// The cat sits on the hearth in front of the range. A little mouse slips out of the mouse door for a crumb; she gets
// up and creeps toward it, soft as a shadow; the mouse has the crumb and is already darting home when she pounces
// (playfully, on nothing at all), sits back, and blinks.
const KCS = 0.46, KMS = 0.26;
const CRUMB = { x: 1112, y: 724 };
const GAP_X = 1064;                    // the mouse door is ajar: its dark gap starts here (the mouse comes and goes there)
const POUNCE = { t0: WORD.pounce + 0.05 - 0.42 * 2.2, len: 2.2, dist: 214 };
const CREEP = { t0: 37.15, t1: 39.05, from: 1478, d: 1.5 };   // d: cycles
let kitCat, kitMouse;
function makeKitchenCast() {
  const creepD = CREEP.d * CAT.STRIDE * KCS;
  const catX = (t) => CREEP.from - creepD * walkDist(clamp((t - CREEP.t0) / (CREEP.t1 - CREEP.t0))) - POUNCE.dist * pounceX(clamp((t - POUNCE.t0) / POUNCE.len));
  kitCat = {
    x: catX, y: () => 752,
    st: (t) => {
      const pu = phase(t, POUNCE.t0, POUNCE.len);
      return { t, sit: 1 - sm(t, 36.0, 37.4),                // she stands to creep; the pounce ends sitting back
        walk: CREEP.d * walkDist(clamp((t - CREEP.t0) / (CREEP.t1 - CREEP.t0))), walkAmt: bump(t, CREEP.t0 - 0.2, CREEP.t0 + 0.4, CREEP.t1 - 0.4, CREEP.t1 + 0.1),
        creep: bump(t, 36.8, 37.8, POUNCE.t0 + 0.1, POUNCE.t0 + 0.5), pounce: pu,
        blink: phase(t, WORD.quiet + 0.2, 1.6) || phase(t, 41.9, 1.6), eye: 0.86 - 0.1 * bump(t, 29, 30, 34, 35),
        headTurn: 0.5 * bump(t, 30.3, 31.0, 32.2, 32.9) - 0.15 * bump(t, 34.9, 35.6, 36.4, 37.0), happy: 0.4 * bump(t, 31.0, 31.5, 32.0, 32.4),
        tailLift: 0.1 * bump(t, 37, 37.6, 39, 39.4), headTilt: -0.06 * bump(t, 35, 35.6, 39, 39.4) };
    },
  };
  // after the pounce the rig is sitting back; keep her sat (sit = 1) from the end of the phase on
  const catSt = kitCat.st;
  kitCat.st = (t) => { const s = catSt(t); s.sit += sm(t, POUNCE.t0 + POUNCE.len - 0.55, POUNCE.t0 + POUNCE.len + 0.5); return s; };
  kitCat.poseFn = (tt) => kitCat.st(tt);
  // the little mouse: out of the gap, a few tiptoe steps to the crumb, pick it up, look round, turn, dart home
  kitMouse = actor({ name: 'kmouse', rig: MICE.young, s: KMS, x0: 1036, y: 722, face0: 1,
    moves: [{ t0: 34.85, t1: 36.4, to: 1098 }, { t0: 39.15, t1: 39.95, to: 1010 }],
    turns: [{ a: 38.45, b: 39.0, swap: 39.12 }],
    pose: (t) => ({ toes: 0.8 * bump(t, 36.3, 36.6, 37.0, 37.4), crouch: 0.35 * bump(t, 36.4, 36.7, 36.9, 37.3), shy: sm(t, 36.85, 37.25),
      eyeBig: 0.9 * bump(t, 38.1, 38.3, 39.2, 39.6), earsBack: 0.5 * bump(t, 38.2, 38.5, 39.6, 40), scurry: bump(t, 39.1, 39.3, 39.9, 40.0),
      headTurn: 0.2 * bump(t, 37.4, 37.8, 38.0, 38.3), mouth: 0.6 * chew(t, 2) * bump(t, 37.3, 37.5, 38.0, 38.2), walkAmt: undefined }),
    visible: (t) => t > 34.5 && t < 40.2 });
}
const camKitchenCat = (t) => camPath(t, view(1460, 610, 1.9), [
  [28.4, 34.0, view(1450, 620, 2.05)],
  [34.2, 36.0, view(1240, 650, 2.0)],
  [39.6, 42.6, view(1270, 650, 1.85)],
]);
function drawKitchenCat(g, t) {
  S.paperBg(g);
  const c = camKitchenCat(t);
  drawKitchen(g, t, c, 'evening', {
    actors: (h) => {
      // the crumb, until she picks it up; then in her paws
      if (t < 36.95) drawCakeCrumb(h, CRUMB.x, CRUMB.y - 2, 3.2);
      if (kitMouse.visible(t)) {
        h.save(); h.beginPath(); h.rect(GAP_X, -2000, 4000, 4000); h.clip();
        drawActor(h, kitMouse, t, 34, { shadow: 'rig' });
        if (t >= 36.95) { const p = MICE.young.pawsAt(kitMouse.poseFn, t, kitMouse.tf(t)); drawCakeCrumb(h, (p.near.x + p.far.x) / 2, (p.near.y + p.far.y) / 2 - 1, 3.2); }
        h.restore();
      }
      const x = kitCat.x(t), y = kitCat.y(t);
      h.save(); h.translate(x, y); h.scale(KCS, KCS);
      CAT.shadow(h, kitCat.st(t), 0);
      CAT.drawAt(h, kitCat.poseFn, t, { since: 28 });
      h.restore();
    },
  });
}

// ================================================================ THE COUNCIL BY THE CANDLE (n04 .. n10)
const C0 = 42.6;                       // the place's start (follow-through since)
const CS = 0.9;                        // mice size at the council
const REEL_TOP = { x: HOME.REEL.top[0], y: HOME.REEL.top[1] + 2 };
const JUMP = { t0: WORD.jumped - 0.44, len: 1.3, from: { x: 410, y: 846 }, to: REEL_TOP };        // up onto the reel
const DOWN = { t0: 129.0, len: 1.25, to: { x: 528, y: 880 } };                                       // and down again
// the audience turns round to the young mouse when he jumps up, and back to the elder when he speaks again
const TURN1 = 63.85, TURN2 = 87.95;
const tw = (k, d = 0) => ({ a: k + d, b: k + d + 1.05, swap: k + d + 1.3 });
let council;
// what everyone in the audience does together (cover eyes, cheer, clap, dance, freeze) and what the young one says
function crowd(t, i) {
  const st = {};
  const o = i * 0.13;
  // listening to the elder (e01) and to the young mouse (y01, y02)
  st.listen = 0.7 * hold(t, 50.4, 57.8, 0.5) + 0.6 * hold(t, 66.7 + o, 70.4, 0.4) + 0.5 * hold(t, 71.2, 75.8, 0.4) + 0.7 * hold(t, 93.4, 97.0, 0.5) + 0.5 * hold(t, 118.4, 125.0, 0.5);
  st.nod = 0.5 * bump(t, 55.0 + o, 55.3 + o, 56.0 + o, 56.4 + o) + 0.6 * bump(t, 69.8 + o, 70.1 + o, 70.8, 71.2) + 0.6 * bump(t, 124.0 + o, 124.3 + o, 125.2, 125.6);
  st.eyeBig = 0.8 * bump(t, WORD.know - 0.05 + o * 0.3, WORD.know + 0.2, 67.6, 68.2) + 0.55 * bump(t, 99.2, 99.5, 102.0, 103.0) + 0.3 * bump(t, 95.8, 96.2, 98.4, 99.2);
  st.gaze = 0.45 * bump(t, 68.9 + o, 69.6 + o, 76.0, 76.4);           // up at the thought bubble
  // "run and hide!": they hide their eyes, giggling, and peek
  st.cover = bump(t, WORD.hide - 0.3 + o * 0.5, WORD.hide + 0.1 + o * 0.5, 78.0 + o, 78.6 + o);
  st.peek = bump(t, 77.2 + o, 77.5 + o, 78.0 + o, 78.4 + o);
  // "What a wonderful idea!" cheered, clapped, danced
  st.happy = 0.6 * bump(t, WORD.wonderful, 79.5, 80.8, 81.3) + 0.4 * bump(t, WORD.hide, WORD.hide + 0.4, 77.8, 78.4) + 0.5 * bump(t, 132.0 + o, 132.5 + o, 134.0, 134.8);
  st.cheer = bump(t, WORD.cheered - 0.25 + o * 0.4, WORD.cheered + 0.1 + o * 0.4, 82.45, 82.75);
  st.clap = bump(t, 82.45, 82.7, 84.2, 84.55); st.clapPhase = (t - WORD.clapped) * 2.6 + 0.25 + o;
  st.dance = bump(t, WORD.danced - 0.2, WORD.danced + 0.25, 86.9, 87.5); st.dancePhase = (t - WORD.danced) * 2.2 + i * 0.4;
  st.smile = 0.6 + 0.25 * hold(t, 79.0, 87.2) - 0.3 * hold(t, 99.3, 112.0, 0.6);
  // "the room went very, very quiet": a freeze (the idle life drops away), ears down
  const frz = hold(t, 99.4, 112.5, 0.5) * (1 - 0.5 * sm(t, 118.4, 121.0));
  st.life = 1 - 0.75 * frz; st.earsBack = 0.35 * frz;
  return st;
}
function makeCouncil() {
  const R = MICE;
  const elder = actor({ name: 'elder', rig: R.elder, s: CS, x0: 1185 + 7 * R.elder.STRIDE * CS, y: 838, face0: -1,
    moves: [{ t0: 42.3, t1: 48.6, to: 1185 }, { t0: 128.4, t1: 131.9, to: 1092 }],
    pose: (t) => ({
      mouth: Math.max(say('e01', t), say('e02', t), say('e03', t), say('e04', t)) * 0.9,
      explain: 0.55 * hold(t, 51.6, 54.8, 0.5) + 0.8 * hold(t, 56.3, 57.9, 0.4) + 0.5 * hold(t, 88.0, 89.9, 0.5) + 0.6 * hold(t, 121.1, 125.0, 0.5),
      point: 0.9 * hold(t, WORD.tellme - 0.15, 92.4, 0.45), pointUp: 0.75,
      specs: phase(t, 92.45, 1.5),
      happy: 0.45 * bump(t, 79.2, 79.8, 86.5, 87.4) + 0.3 * bump(t, 94.8, 95.2, 96.6, 97.4),
      chuckle: bump(t, 118.3, 118.6, 119.9, 120.4) + 0.35 * bump(t, 83.0, 83.5, 85.6, 86.4),
      nod: 0.5 * bump(t, 70.0, 70.3, 71.0, 71.4) + 0.6 * bump(t, 123.4, 123.7, 125.0, 125.5) + 0.5 * bump(t, 132.2, 132.5, 133.6, 134.0),
      headTilt: 0.06 * hold(t, 56.4, 57.8) - 0.08 * hold(t, 94.0, 96.6) + 0.15 * bump(t, 135.6, 135.9, 136.4, 136.9),
      gaze: -0.3 * hold(t, 94.0, 96.4), browUp: 0.6 * hold(t, 56.3, 57.9) + 0.5 * hold(t, 94.0, 96.6),
      listen: 0.4 * hold(t, 66.8, 77.3), smile: 0.62 + 0.15 * hold(t, 118, 126),
      sad: 0.25 * hold(t, 113.3, 116.4),
      // he blows the candle out: leans to the flame, lips rounded
      lean: 0.26 * bump(t, 135.5, 135.95, 136.45, 137.0), mouthBlow: 0,
      ...(t > 135.6 && t < 136.8 ? { mouth: 0.35 * bump(t, 135.75, 135.95, 136.3, 136.6), smile: 0.2 } : {}),
    }) });
  // the young mouse: by the reel, jumps up onto it, all his lines up there, sits, hops down
  const jump = (t) => { const u = clamp((t - JUMP.t0) / JUMP.len); const k = hopX(u); return { u, k }; };
  const down = (t) => { const u = clamp((t - DOWN.t0) / DOWN.len); return { u, k: hopX(u) }; };
  const young = actor({ name: 'young', rig: R.young, s: CS, x0: 410 - 7 * R.young.STRIDE * CS, y: 846, face0: 1,
    moves: [{ t0: 43.2, t1: 48.8, to: 410 }, { t0: 130.6, t1: 131.9, by: 50 }],
    dx: (t) => (JUMP.to.x - JUMP.from.x) * jump(t).k + (DOWN.to.x - JUMP.to.x) * down(t).k,
    dy: (t) => { const j = jump(t), d = down(t); return (JUMP.to.y - JUMP.from.y) * (1 - (1 - j.k) ** 2) + (DOWN.to.y - JUMP.to.y) * d.k * d.k; },
    pose: (t) => {
      const c = crowd(t, 0);
      const talk = Math.max(say('y01', t), say('y02', t), say('y03', t));
      return { ...c,
        listen: c.listen * (t < 66 ? 1 : 0) + 0.5 * hold(t, 87.9, 97.0) + 0.5 * hold(t, 118.4, 125.0),
        mouth: talk * 0.9, cover: c.cover * 0.9, peek: c.peek,
        hop: phase(t, JUMP.t0, JUMP.len) || phase(t, DOWN.t0, DOWN.len) || phase(t, WORD.cheered - 0.2, 0.9), hopHeight: t < 70 ? 44 : t < 100 ? 26 : 34,
        bounce: 0.5 * hold(t, 64.9, 79.0) + 0.3 * hold(t, 50, 63, 0.5),
        // y01 "I know!" a paw up; then explaining
        point: hold(t, WORD.know - 0.1, 67.6, 0.3), pointUp: 1,
        explain: 0.8 * hold(t, 67.9, 70.2, 0.35) + 0.7 * hold(t, 71.3, 73.9, 0.4),
        wave: 0.9 * hold(t, WORD.jingle1 - 0.05, 75.0, 0.25),      // "jingle, jingle": ringing a little bell in the air
        cheer: c.cheer, clap: c.clap, dance: c.dance,
        eyeBig: c.eyeBig * (t > 90 ? 1 : 0) + 0.8 * bump(t, 62.0, 62.4, 63.4, 63.8) + 0.9 * bump(t, WORD.know - 0.1, WORD.know + 0.1, 67.5, 68.0),
        gaze: 0.3 * bump(t, 60.0, 60.6, 61.6, 62.0) - 0.3 * hold(t, 109.8, 118.0, 0.6), headTilt: 0.12 * bump(t, 59.8, 60.4, 61.6, 62.0) + 0.1 * hold(t, 66.9, 67.6, 0.3),
        happy: Math.max(c.happy, 0.6 * bump(t, 64.6, 64.9, 65.6, 66.2), 0.4 * bump(t, 124.0, 124.6, 127.5, 128.2)),
        // n08: slowly sits back down; y03 sheepish; stands to hop down (n09)
        sit: bump(t, WORD.slowly, WORD.sat + 1.3, 127.6, 128.6), crouch: 0.4 * bump(t, WORD.slowly + 0.2, WORD.sat + 1.3, 127.4, 128.5), sad: 0.55 * hold(t, 110.0, 117.0, 0.8) + 0.25 * hold(t, 117, 121, 0.8),
        sheepish: hold(t, 113.3, 117.2, 0.5),
        smile: c.smile + 0.2 * hold(t, 66.8, 78) };
    } });
  // the audience, from left to right; they all face the elder, except while the young mouse has the floor
  const aud = (name, x, y, i, extra = () => ({}), more = {}) => {
    const rig = R[name];
    const walkIn = { t0: 42.3 + 0.25 * (4 - i), t1: 47.9 + 0.18 * (4 - i), to: x };
    return actor({ name, rig, s: CS, x0: x - Math.round(300 / (0.5 * rig.STRIDE * CS)) * 0.5 * rig.STRIDE * CS, y, face0: 1,
      moves: [walkIn, ...(more.moves || [])],
      turns: [tw(TURN1, [0.1, 0.0, 0.18, 0.28, 0.05][i]), tw(TURN2, [0.15, 0.3, 0.0, 0.4, 0.2][i])],
      pose: (t) => ({ ...crowd(t, i), ...extra(t, crowd(t, i)) }) });
  };
  const shy = aud('shy', 590, 856, 1, (t, c) => ({
    whisper: hold(t, 59.4, 60.6, 0.35), mouth: 0.4 * chew(t * 1.3, 3) * hold(t, 59.6, 60.5, 0.2),
    toes: hold(t, WORD.toes, 119.4, 0.45), sad: 0.3 * hold(t, WORD.toes, 119.4), headTilt: -0.22 * hold(t, WORD.toes, 119.4, 0.45), gaze: -0.5 * hold(t, WORD.toes, 119.4, 0.45),
  }), { moves: [{ t0: 131.0, t1: 132.4, to: 626 }] });
  const mother = aud('mother', 690, 826, 2, (t, c) => ({
    listen: Math.max(c.listen, 0.8 * hold(t, 59.5, 60.6, 0.3)), headTurn: 0.35 * hold(t, 59.5, 60.6, 0.3) + 0.3 * hold(t, 104.5, 112, 0.6),
    whisper: hold(t, 60.75, 61.9, 0.35), mouth: 0.4 * chew(t * 1.3, 5) * hold(t, 60.9, 61.8, 0.2),
    shy: 0.5 * hold(t, 105.2, 113, 0.6),
  }), { moves: [{ t0: 131.2, t1: 132.6, to: 724 }] });
  const baby = aud('baby', 760, 862, 3, (t, c) => ({
    listen: Math.max(c.listen, hold(t, 60.8, 61.9, 0.3)), happy: Math.max(c.happy, 0.8 * bump(t, 61.6, 61.9, 62.4, 62.8)),
    hop: phase(t, WORD.cheered - 0.1, 0.8) || phase(t, 82.0, 0.8), hopHeight: 30,
    shy: hold(t, 105.0, 118.5, 0.6), headTurn: 0.25 * hold(t, 108, 112, 0.6),
  }));
  const plump = aud('plump', 826, 846, 4, (t, c) => ({
    tailCurl: 0.7 * hold(t, TURN1 + 0.6, TURN2 + 1.0, 0.6), tailLift: 0.25 * hold(t, TURN1 + 0.6, TURN2 + 1.0, 0.6),
    ceiling: hold(t, WORD.ceiling, 119.4, 0.45), headTilt: 0.12 * bump(t, 59.8, 60.4, 61.4, 62.0) + 0.3 * hold(t, WORD.ceiling, 119.4, 0.45),
    gaze: Math.max(c.gaze, 0.35 * bump(t, 59.8, 60.4, 61.4, 62.0), 0.6 * hold(t, WORD.ceiling, 119.4, 0.45)), shrug: 0.6 * bump(t, 60.0, 60.4, 61.0, 61.5),
    hop: phase(t, WORD.cheered + 0.15, 0.9), hopHeight: 24, tummy: 0.6 * bump(t, 125.4, 126.0, 127.4, 128.0),
  }));
  return [elder, young, shy, mother, baby, plump];
}
// the thought bubble: the belled cat (cat3, a ribbon and a little bell at her neck), above the reel
const BUB = { x: 1000, y: 418, w: 580, h: 350, t0: WORD.bell - 0.35, t1: 77.9 };
const bubK = (t) => sm(t, BUB.t0, BUB.t0 + 1.3) * (1 - sm(t, BUB.t1 - 0.9, BUB.t1));
const BC = { s: 0.38, x0: BUB.x + 105, y: BUB.y + 90, walk: { t0: WORD.near - 0.1, t1: 73.85, d: 2.0 } };
function bubbleCatX(t) { return BC.x0 - BC.walk.d * CAT.STRIDE * BC.s * walkDist(clamp((t - BC.walk.t0) / (BC.walk.t1 - BC.walk.t0))); }
function bubbleCatSt(t) {
  const w = BC.walk;
  return { t, sit: 1 - sm(t, w.t0 - 0.6, w.t0 + 0.2) + sm(t, 75.3, 76.2), walk: w.d * walkDist(clamp((t - w.t0) / (w.t1 - w.t0))),
    walkAmt: bump(t, w.t0 - 0.1, w.t0 + 0.4, w.t1 - 0.4, w.t1 + 0.1), happy: 0.6 * bump(t, 69.4, 69.9, 70.6, 71.0) + 0.5 * bump(t, 76.3, 76.8, 77.6, 78),
    headTurn: 0.5 * bump(t, 74.0, 74.3, 75.2, 75.6), eyeBig: 0.5 * bump(t, 74.1, 74.3, 75.0, 75.4), blink: phase(t, 76.4, 1.4) };
}
// the bell's swing: it sways with her steps and rings on "jingle, jingle"
const bellSwing = (t) => 0.22 * Math.sin(t * 7.4) * bump(t, BC.walk.t0, BC.walk.t0 + 0.4, BC.walk.t1, BC.walk.t1 + 0.6)
  + 0.5 * Math.sin((t - WORD.jingle1) * 15) * (bump(t, WORD.jingle1 - 0.05, WORD.jingle1 + 0.05, WORD.jingle1 + 0.2, WORD.jingle1 + 0.4) + bump(t, WORD.jingle2 - 0.05, WORD.jingle2 + 0.05, WORD.jingle2 + 0.2, WORD.jingle2 + 0.45))
  + 0.06 * Math.sin(t * 2.1);
function drawBelledCat(g, x, y, s, poseFn, t, since) {
  g.save(); g.translate(x, y); g.scale(s, s); CAT.shadow(g, poseFn(t), 0); CAT.drawAt(g, poseFn, t, { since }); g.restore();
  const n = CAT.neckAt(poseFn, t, { x, y, scale: s, face: 1 });
  // a red ribbon round the neck (its near half, from the throat back to the nape), the bell hanging at the throat
  const r = 34 * s, k = s * 2.2;
  const p0 = [n.x - r * 0.45, n.y + r * 0.42], pc = [n.x + r * 0.2, n.y + r * 0.62], p1 = [n.x + r * 0.95, n.y - r * 0.2];
  g.save(); g.lineCap = 'round';
  g.strokeStyle = rgba('#3a1c18', 0.7); g.lineWidth = 7.4 * k;
  g.beginPath(); g.moveTo(...p0); g.quadraticCurveTo(...pc, ...p1); g.stroke();
  g.strokeStyle = '#c8443c'; g.lineWidth = 5.4 * k; g.stroke();
  g.strokeStyle = 'rgba(255,190,170,0.6)'; g.lineWidth = 1.2 * k; g.beginPath(); g.moveTo(p0[0], p0[1] - 1.2 * k); g.quadraticCurveTo(pc[0], pc[1] - 1.2 * k, p1[0], p1[1] - 1.2 * k); g.stroke();
  // the bell
  const bx = n.x - r * 0.2, by = n.y + r * 0.55, a = bellSwing(t), L = 12 * s * 2.2, R = 9 * s * 2.2;
  const cx = bx + Math.sin(a) * L, cy = by + Math.cos(a) * L;
  g.strokeStyle = rgba('#5a3a18', 0.8); g.lineWidth = 1.4; g.beginPath(); g.moveTo(bx, by); g.lineTo(cx, cy - R * 0.7); g.stroke();
  const gr = g.createRadialGradient(cx - R * 0.35, cy - R * 0.35, 1, cx, cy, R * 1.1); gr.addColorStop(0, '#fff2b0'); gr.addColorStop(0.45, '#e8c050'); gr.addColorStop(1, '#a87a20');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill(); g.strokeStyle = rgba('#5a3a18', 0.8); g.lineWidth = 1.3; g.stroke();
  g.fillStyle = '#4a3020'; g.beginPath(); g.arc(cx + Math.sin(a) * R * 0.4, cy + R * 0.45, R * 0.24, 0, TAU); g.fill();
  g.strokeStyle = rgba('#4a3020', 0.7); g.lineWidth = 1; g.beginPath(); g.moveTo(cx - R * 0.9, cy + R * 0.05); g.lineTo(cx + R * 0.9, cy + R * 0.05); g.stroke();
  // "jingle": little ringing marks
  for (const [w0, k0] of [[WORD.jingle1, 0], [WORD.jingle2, 1]]) {
    const u = (t - w0) / 0.7; if (u <= 0 || u >= 1) continue;
    const al = Math.sin(u * Math.PI) * 0.85;
    g.strokeStyle = `rgba(150,110,40,${al})`; g.lineWidth = 2.2;
    for (let q = 0; q < 3; q++) {
      const ang = -1.9 + q * 0.55 + k0 * 0.25, d0 = R * (1.6 + u * 1.4), d1 = d0 + R * 0.9;
      g.beginPath(); g.moveTo(cx + Math.cos(ang) * d0, cy + Math.sin(ang) * d0); g.lineTo(cx + Math.cos(ang) * d1, cy + Math.sin(ang) * d1); g.stroke();
    }
  }
  g.restore();
}
function drawBubble(g, t) {
  const k = bubK(t); if (k <= 0) return;
  const Y = council[1], hd = Y.rig.headAt(Y.poseFn, t, Y.tf(t));
  drawThoughtBubble(g, BUB.x, BUB.y, BUB.w, BUB.h, t, k, { tail: [hd.x + 40, hd.y - 50], inside: (h) => drawBelledCat(h, bubbleCatX(t), BC.y, BC.s, bubbleCatSt, t, 66) });
}
const camCouncil = (t) => camPath(t, view(860, 640, 1.18), [
  [WORD.candle - 0.6, 50.0, view(900, 650, 1.4)],
  [51.0, 56.0, view(1010, 655, 1.55)],                       // e01: toward the elder
  [58.4, 61.0, view(710, 690, 1.7)],                         // n05: the whispering audience
  [62.6, 65.0, view(690, 655, 1.5)],                         // he jumps up onto the reel
  [WORD.know - 0.6, 67.6, view(640, 676, 1.7)],
  [68.2, 70.6, view(820, 610, 1.3)],                        // the thought bubble
  [77.6, 80.4, view(770, 680, 1.6)],                         // cheering, clapping, dancing
  [87.6, 90.6, view(1000, 662, 1.55)],                       // e02: the elder
  [92.6, 97.6, view(1150, 708, 2.35)],                       // e03: a slow push-in ... "Who will put the bell on the cat?"
  { cut: 98.75, v: view(840, 650, 1.32) },                   // n07: wide, everyone frozen
  [99.0, 103.6, view(850, 650, 1.38)],
  [103.4, 104.9, view(640, 724, 2.0)],                       // n08: his toes
  [105.9, 107.1, view(820, 712, 2.0)],                       // the ceiling
  [108.0, 110.0, view(640, 700, 1.8)],                       // the young mouse sits down
  [112.4, 114.2, view(600, 700, 1.95)],                      // y03
  { cut: 117.95, v: view(1110, 702, 1.95) },                 // e04: the elder, kindly
  [120.6, 126.6, view(900, 660, 1.38)],
  [127.6, 132.6, view(840, 680, 1.3)],                       // n09: they huddle close
  [133.6, 136.2, view(960, 670, 1.55)],                      // n10: the candle
]);
function drawCouncil(g, t) {
  S.paperBg(g);
  const c = camCouncil(t);
  const dk = darkK(t, OUT_AT);
  drawHome(g, t, c, {
    outAt: OUT_AT, blow: bump(t, 135.95, 136.2, OUT_AT, OUT_AT + 0.1),
    actors: (h) => homeActors(h, t, council, C0, { dark: dk }),
    after: (h) => drawBubble(h, t),
  });
}

// ================================================================ THE NESTS IN THE DARK (n10)
const NS = 0.74, SINK = 22;
let sleepers;
function makeSleepers() {
  const N = HOME.NESTS;
  const sleep = (d) => (t) => ({ sleep: lerp(0.45, 1, sm(t, 137.4 + d, 140.6 + d)), feet: false, yawn: 0, smile: 0.6 });
  const mk = (name, x, y, face, s, d, extra = () => ({})) => actor({ name, rig: MICE[name], s, x0: x, y, face0: face, pose: (t) => ({ ...sleep(d)(t), ...extra(t) }) });
  return [
    mk('mother', N[0].sleep[0] + 12, N[0].sleep[1] + SINK, 1, NS, 0),
    mk('baby', N[0].sleep[0] - 30, N[0].sleep[1] + SINK + 4, 1, NS, 0.5),
    mk('young', N[1].sleep[0] + 4, N[1].sleep[1] + SINK, 1, NS * 0.9, 0.3, (t) => ({ yawn: phase(t, 137.2, 2.0) })),
    mk('elder', N[2].sleep[0] - 4, N[2].sleep[1] + SINK, -1, NS * 0.9, 1.0, () => ({ stickLean: 0 })),
    mk('plump', N[3].sleep[0] + 16, N[3].sleep[1] + SINK, -1, NS * 0.85, 0.6),
    mk('shy', N[3].sleep[0] - 26, N[3].sleep[1] + SINK + 6, -1, NS * 0.75, 0.8),
  ];
}
const camNests = (t) => camPath(t, view(420, 690, 2.05), [[137.6, 140.6, view(470, 700, 1.85)], [140.6, 143.6, view(960, 660, 1.15)]]);
function drawNests(g, t) {
  S.paperBg(g);
  const c = camNests(t);
  const draw = (h, list) => { for (const A of list) tinted(h, '#1e2250', 0.45, (hh) => drawActor(hh, A, t, 137)); };
  drawHome(g, t, c, {
    dark: 1,
    sleepers: (h) => draw(h, sleepers),
    after: (h) => zzz(h, t, HOME.NESTS[2].sleep[0] - 50, HOME.NESTS[2].sleep[1] - 80, 140.2, 1e9),
  });
}

// ================================================================ THE KITCHEN AT NIGHT (n11 .. n13)
const NCS = 0.58;
const NCAT = { x: KITCHEN.CAT[0] + 30, y: KITCHEN.CAT[1] };
function nightCatSt(t) {
  return { t, sit: 1 - sm(t, WORD.curled - 0.2, 148.6), sleep: sm(t, WORD.curled, 149.6), yawn: phase(t, 144.3, 2.3), blink: phase(t, 142.9, 1.6),
    purr: sm(t, WORD.purred - 0.4, WORD.purred + 0.6), headTurn: 0.3 * bump(t, 143.0, 143.6, 144.0, 144.4) };
}
const camNight = (t) => camPath(t, view(1420, 680, 1.85), [
  [143.6, 150.6, view(1400, 700, 2.0)],
  [WORD.moon - 1.4, 155.2, view(760, 270, 1.8)],          // the moon in the window
  [156.0, 164.0, view(960, 540, 1.0)],                      // the whole farmhouse, quiet and still
  [164.0, 207, view(960, 560, 1.06)],
]);
function drawNight(g, t) {
  S.paperBg(g);
  const c = camNight(t);
  drawKitchen(g, t, c, 'night', {
    actors: (h) => {
      tinted(h, '#262a5c', 0.38, (hh) => {
        hh.save(); hh.translate(NCAT.x, NCAT.y); hh.scale(NCS, NCS);
        CAT.shadow(hh, nightCatSt(t), 0); CAT.drawAt(hh, nightCatSt, t, { since: 142 });
        hh.restore();
      });
    },
    after: (h) => zzz(h, t, NCAT.x - 60, NCAT.y - 130, 150.2, 1e9),
  });
}

// ================================================================ TITLE CARD
const TITLE_Y = 870;
const titleMouseSt = (t) => {
  const D = 7, u = clamp((t - 0.6) / 3.2);
  return { t, walk: D * walkDist(u), walkAmt: bump(t, 0.5, 0.9, 3.4, 3.9), headTurn: 0.45 * bump(t, 4.6, 5.1, 6.6, 7.2), happy: 0.5 * bump(t, 4.8, 5.2, 6.4, 6.9),
    wave: 0.8 * bump(t, 5.0, 5.4, 6.2, 6.7), smile: 0.75, eyeBig: 0.4 * bump(t, 3.9, 4.1, 4.6, 4.9) };
};
const titleCatSt = (t) => ({ t, sleep: 1, purr: 1, smile: 0.7 });
function drawTitle(g, t) {
  S.paperBg(g); g.fillStyle = 'rgba(250,214,160,0.16)'; g.fillRect(0, 0, W, H);
  cam(g, { z: 1 + t * 0.004, x: 0, y: 0 }, 1);
  g.save(); g.textAlign = 'center'; g.fillStyle = INK;
  const a1 = span(t, 0.6, 2.4), a2 = span(t, 1.4, 3.2), a3 = span(t, 2.4, 4.0);
  g.globalAlpha = a1 * 0.9; g.font = '112px "Fell"'; g.fillText('Belling', 960, 330 + (1 - a1) * 10);
  g.globalAlpha = a2 * 0.9; g.font = 'italic 100px "Fell"'; g.fillText('the Cat', 960, 450 + (1 - a2) * 10);
  g.globalAlpha = a3 * 0.75; g.font = 'italic 40px "Fell"'; g.fillText('an Aesop’s fable, for sleepy little ones', 960, 545);
  g.restore();
  // the sleepy cat curled up on the right, a little mouse tiptoeing in from the left to peek at her
  g.save(); g.globalAlpha = span(t, 0.2, 1.4);
  pool(g, 1330, TITLE_Y + 4, 230, 18, '#8a7058', 0.2);
  g.save(); g.translate(1330, TITLE_Y); g.scale(0.5, 0.5); CAT.drawAt(g, titleCatSt, t, { since: 0 }); g.restore();
  zzz(g, t, 1240, TITLE_Y - 150, 1.0, 1e9);
  const M = MICE.young, s = 0.62, x = 470 + 7 * M.STRIDE * s * walkDist(clamp((t - 0.6) / 3.2));
  g.save(); g.translate(x, TITLE_Y); g.scale(-s, s); M.shadow(g, titleMouseSt(t), 0); M.drawAt(g, titleMouseSt, t, { since: 0 }); g.restore();
  g.restore();
}
function drawEnd(g, t) {
  const n13 = S.line('n13'), END = S.TL.duration;
  const a = span(t, n13.end + 1.5, n13.end + 4.5) * (1 - span(t, END - 12, END - 7));
  if (a <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.textAlign = 'center';
  g.fillStyle = `rgba(250,238,210,${0.85 * a})`; g.font = 'italic 76px "Fell"'; g.fillText('Sweet dreams', 960, 300);
  g.font = 'italic 34px "Fell"'; g.fillStyle = `rgba(250,238,210,${0.6 * a})`; g.fillText('the end', 960, 355);
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
    const OUT = { elder: 'elder', young: 'young', mother: 'mother', baby: 'baby', plump: 'plump', shy: 'shy' };
    let sd = 61; for (const n in OUT) MICE[n] = makeMouseRig(2, sd++, OUT[n]);
    CAT = makeCatRig(1.2);
    BUF_A = canvas(W, H, false); BUF_B = canvas(W, H, false); MASKC = canvas(240, 135, false); ABUF = canvas(W, H, false);
    homeLayers(); kitchenLayers();
    homeCast = makeHomeCast(); makeKitchenCast(); council = makeCouncil(); sleepers = makeSleepers();
    SHOTS = [
      [0, drawTitle],
      [5.8, (g, t) => { S.paperBg(g); drawKitchen(g, t, camPath(t, view(960, 540, 1.0), [[7.4, 11.9, view(1056, 690, 2.7)]]), 'evening'); }, 1.8],
      [H1, drawHome1, 1.7],
      [28.3, drawKitchenCat, 1.1],
      [C0, drawCouncil, 1.8],
      [137.45, drawNests, 1.5],
      [142.7, drawNight, 2.2],
    ];
  },
  frame(t) { S.frame(t, [[0, master]]); },
};
