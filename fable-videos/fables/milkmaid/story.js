// The Milkmaid and Her Pail: shots, camera, timing and acting.
//
// The cast are folk3 / cow / hen rigs, always drawn with drawAt (follow-through) from a pose FUNCTION of time, so every
// number eases and nothing pops. Each place is one continuous performance (the farmyard at dawn, the lane, the
// farmyard again, dusk, the hen house at night, the bedroom); the shots are cameras on it, eased, cut or dissolved.
// Walks are distance-driven (walk = distance / stride, stopping on a half cycle so both feet are down); on the lane the
// ground itself scrolls under her (the multiplane set) at exactly her walking speed. Turns use the rig's `turn` and
// then the mirrored transform with a fresh `since`. Things that change hands across a cut (the pail onto her head, the
// empty pail in her hand on the way home) only change across a cut or a dissolve. The word onsets the action is locked
// to were measured from the voice's loudness envelope (WORD below).
import { W, H, canvas, clamp, lerp, span, rgba, pool, noise1, ease } from '../../engine/watercolor.js';
import { INK, cam, zzz, makeStage } from '../../engine/stage.js';
import { makeMilkmaid, TOSS_RELEASE, PAIL } from '../../engine/characters/milkmaid.js';
import { makeMother } from '../../engine/characters/farmwife.js';
import { makeCow } from '../../engine/characters/cow.js';
import { makeHen, makeChick } from '../../engine/characters/hens.js';
import { view, FARM, BYRE, BEDROOM, LANE_PAN, drawFarm, laneParallax, drawLaneParallax, drawSpill, drawDream, dreamSpot,
  drawDreamEgg, drawBedroom } from './scene.js';

let S;
const R = {};
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
// a monotone cubic through [[t, v, slope?], ...] (Fritsch-Carlson): a distance that never goes backwards
function monotone(keys) {
  const n = keys.length, T = keys.map((k) => k[0]), V = keys.map((k) => k[1]), d = [], m = [];
  for (let i = 0; i < n - 1; i++) d[i] = (V[i + 1] - V[i]) / (T[i + 1] - T[i]);
  m[0] = keys[0][2] ?? d[0]; m[n - 1] = keys[n - 1][2] ?? d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = keys[i][2] ?? (d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; }
  }
  return (t) => {
    if (t <= T[0]) return V[0] + m[0] * (t - T[0]);
    if (t >= T[n - 1]) return V[n - 1] + m[n - 1] * (t - T[n - 1]);
    let i = 0; while (t > T[i + 1]) i++;
    const h = T[i + 1] - T[i], u = (t - T[i]) / h, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * V[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * V[i + 1] + (u3 - u2) * h * m[i + 1];
  };
}

// Word onsets measured from the voice envelope (build/milkmaid/timeline.json, 24 Hz)
const WORD = {
  farm: 9.3, valley: 10.6, lived: 11.92, molly: 14.38,
  milked: 18.1, buttercup: 18.81, hens: 21.0, clucked: 21.5, sun: 22.31, hills: 24.1,
  goodMorning: 25.67, buttercup2: 26.67, lovely: 27.59, creamy: 28.46,
  mother: 31.29, kind: 32.85,
  take: 34.44, market: 35.56, dear: 36.02, whatever: 36.94, keep: 38.69,
  set: 40.6, head4: 42.3, off: 43.28, lane: 44.33,
  walked: 48.0, dream: 49.9,
  money: 52.6, eggs: 54.85,
  hatch: 57.2, fluffy: 58.02, chicks: 58.81, giggle: 59.43, grow: 61.6, fatHens: 62.89,
  sell: 64.5, dress: 67.2, blue: 68.75, ribbons: 69.83,
  fair: 72.44, look: 73.9, toss: 76.2, likeThis: 77.31,
  tossed: 79.47, headN: 80.27, splash: 80.93, down: 82.47, spilled: 85.9,
  ohno: 88.98, milk6: 91.32, eggs6: 93.23, chicks6: 95.32, hens6: 96.2, dress6: 98.07, allGone: 100.82,
  walkedHome: 103.08, empty: 105.58, told: 107.2,
  darling: 110.86, never: 111.73, remember: 113.19, count: 114.44, hatched: 116.2,
  giggle7: 118.29, iRemember: 119.17, oneStep: 121.42,
  evening: 127.22, sunset: 128.22, lay: 131.76, straw: 133.0,
  tucked: 136.75, curled: 138.84, bed: 140.4, window: 141.25,
  stars: 144.95, dreamed: 146.66, dresses: 148.07, sunny: 150.66, oneStep10: 153.62,
  night: 157.06, sweet: 159.72,
};

// ---------------------------------------------------------------- actors
// An actor walks only sideways (no depth walks), turns round on the spot, and is drawn with drawAt.
//   rig, s (page units per rig unit), x0, y (feet), face0 (+1 facing right, -1 facing left)
//   moves [{ t0, t1, to | by }]: distance-driven walks along x, snapped to whole half-cycles (both feet down at the end)
//   turns [{ a, b, swap }]: turn 0 -> 1 from a to b, hold, mirror at swap (turn 0, fresh follow-through)
//   dx(t), dy(t): extra root offsets;  pose(t) -> state (everything else)
function actor(o) {
  const half = 0.5 * o.s * o.rig.STRIDE;
  let from = o.x0;
  const turns = o.turns || [];
  const moves = (o.moves || []).map((m) => {
    const face = o.face0 * (turns.filter((q) => q.swap <= m.t0).length % 2 ? -1 : 1);
    const to = m.by !== undefined ? from + m.by : m.to;
    const d = Math.round((to - from) / half) * half, r = { ...m, from, d };
    if (d * face < 0) console.warn('[story] walking backwards!', o.name, m);
    from += d; return r;
  });
  const A = {
    name: o.name, rig: o.rig, s: o.s, o, moves,
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
    // the transform for the rig's helpers (headAt, handsAt, pailAt ...)
    tf(t) { return { x: A.x(t), y: A.y(t), scale: o.s, face: -A.face(t) }; },
    visible: o.visible || (() => true),
  };
  A.poseFn = (tt) => A.st(tt);
  return A;
}
// draw one actor: its shadow, then the rig with follow-through. o: { shadow: false, layer }
function drawActor(g, A, t, since0, o = {}) {
  if (!A.visible(t)) return;
  const x = A.x(t), y = A.y(t), f = A.face(t), s = A.s;
  g.save(); g.translate(x, y); g.scale(-f * s, s);
  if (o.shadow !== false && o.layer !== 'front') A.rig.shadow(g, A.st(t), 0);
  A.rig.drawAt(g, A.poseFn, t, { since: A.since(t, since0), layer: o.layer });
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
// draw a list of depth items { y, draw(h) } far to near
const drawItems = (h, items) => { for (const it of items.sort((a, b) => a.y - b.y)) it.draw(h); };
const act = (A, since0, o = {}) => ({ y: A.y(0) + (o.dy || 0), draw: (h) => drawActor(h, A, o.t, since0, o) });

// ---------------------------------------------------------------- little props
// the three-legged milking stool (Molly's own, so it stays when she stands up)
function drawStool(g, x, y, s) {
  const top = y - 60 * s, rx = 30 * s, ry = 9 * s;
  g.save(); g.lineCap = 'round';
  for (const [dx0, dx1, dy] of [[-16, -30, 0], [16, 30, 0], [2, 4, -4]]) {
    g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 7.5 * s; g.beginPath(); g.moveTo(x + dx0 * s, top + 4 * s); g.lineTo(x + dx1 * s, y + dy * s); g.stroke();
    g.strokeStyle = '#9a6a44'; g.lineWidth = 5 * s; g.stroke();
  }
  g.fillStyle = '#a8744a'; g.beginPath(); g.ellipse(x, top + 4 * s, rx, ry + 3 * s, 0, 0, TAU); g.fill();
  g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1.4; g.stroke();
  g.fillStyle = '#c08a5c'; g.beginPath(); g.ellipse(x, top, rx, ry, 0, 0, TAU); g.fill(); g.stroke();
  g.restore();
}
// a stream of milk from a teat into the pail (k: how hard it squirts)
function milkStream(g, x0, y0, x1, y1, k, t, seed) {
  if (k <= 0.02) return;
  g.save(); g.lineCap = 'round';
  const wob = Math.sin(t * 23 + seed) * 1.5, mx = (x0 + x1) / 2 + wob, my = (y0 + y1) / 2;
  g.strokeStyle = `rgba(255,253,246,${0.85 * k})`; g.lineWidth = 2.4 * k + 0.6;
  g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(mx, my, x1, y1); g.stroke();
  g.strokeStyle = `rgba(200,190,170,${0.35 * k})`; g.lineWidth = 0.8; g.stroke();
  // a little froth where it lands
  g.fillStyle = `rgba(255,255,250,${0.7 * k})`;
  for (let i = 0; i < 3; i++) { const a = t * 9 + i * 2.1 + seed; g.beginPath(); g.arc(x1 + Math.cos(a) * 3, y1 + Math.sin(a) * 1.2, 1.3, 0, TAU); g.fill(); }
  g.restore();
}
// a soap-bubble sphere with a little picture inside; pop 0..1 (bursting into droplets)
function bubble(g, x, y, r, t, alpha, inside, pop = 0) {
  if (alpha <= 0.01) return;
  const grow = 1 + 0.18 * ease(pop / 0.35), a = alpha * (1 - ease((pop - 0.25) / 0.2));
  g.save();
  if (a > 0.01) {
    g.globalAlpha = a;
    g.save(); g.beginPath(); g.arc(x, y, r * grow, 0, TAU); g.clip();
    const gr = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r * grow);
    gr.addColorStop(0, 'rgba(255,250,244,0.55)'); gr.addColorStop(0.7, 'rgba(250,232,240,0.38)'); gr.addColorStop(1, 'rgba(210,220,250,0.55)');
    g.fillStyle = gr; g.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
    g.globalAlpha = a * (1 - ease(pop / 0.25)); inside(g);
    g.restore();
    g.globalAlpha = a;
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 2.2; g.beginPath(); g.arc(x, y, r * grow, 0, TAU); g.stroke();
    g.strokeStyle = 'rgba(200,150,190,0.45)'; g.lineWidth = 1.2; g.beginPath(); g.arc(x, y, r * grow - 2, 0.3, 2.2); g.stroke();
    g.strokeStyle = 'rgba(140,180,230,0.4)'; g.beginPath(); g.arc(x, y, r * grow - 2, 3.4, 5.0); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.ellipse(x - r * 0.42, y - r * 0.45, r * 0.16, r * 0.08, -0.7, 0, TAU); g.fill();
  }
  // the burst: little droplets and a twinkle flying out
  if (pop > 0.2 && pop < 1) {
    const u = (pop - 0.2) / 0.8;
    g.globalAlpha = alpha * (1 - u);
    for (let i = 0; i < 10; i++) {
      const ang = i / 10 * TAU + 0.3, d = r * (1.05 + 0.9 * ease(u));
      g.fillStyle = i % 2 ? 'rgba(255,255,255,0.9)' : 'rgba(250,220,235,0.9)';
      g.beginPath(); g.arc(x + Math.cos(ang) * d, y + Math.sin(ang) * d + 20 * u * u, 2.6 * (1 - u) + 0.8, 0, TAU); g.fill();
    }
    g.globalCompositeOperation = 'lighter';
    pool(g, x, y, r * 0.9, r * 0.9, '#fff4e8', 0.35 * (1 - u));
  }
  g.restore();
}
// the dreamed-of blue dress with ribbons (for its bubble)
function drawDress(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round';
  const skirt = [[-14, -20], [14, -20], [34, 30], [20, 36], [0, 38], [-20, 36], [-34, 30]];
  const bod = [[-14, -48], [14, -48], [16, -20], [-16, -20]];
  const fill = (pts, col) => { g.fillStyle = col; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fill(); g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1.4 / s; g.stroke(); };
  fill(skirt, '#8fa6c8'); fill(bod, '#9ab0d0');
  for (const sg of [-1, 1]) { g.fillStyle = '#9ab0d0'; g.beginPath(); g.ellipse(sg * 18, -44, 8, 7, sg * 0.4, 0, TAU); g.fill(); g.strokeStyle = rgba(INK, 0.6); g.stroke(); }
  g.fillStyle = 'rgba(255,252,245,0.85)'; for (let i = 0; i < 26; i++) { const px = -26 + (i * 37 % 52), py = -16 + (i * 23 % 50); g.beginPath(); g.arc(px * (0.4 + 0.6 * (py + 20) / 56), py, 1.2, 0, TAU); g.fill(); }
  g.fillStyle = '#f8f2e6'; g.beginPath(); g.ellipse(0, -47, 10, 4, 0, 0, TAU); g.fill();
  g.fillStyle = '#e8a0b0'; g.fillRect(-16, -24, 32, 5);
  g.beginPath(); g.ellipse(-6, -22, 6, 4, -0.5, 0, TAU); g.ellipse(6, -22, 6, 4, 0.5, 0, TAU); g.fill();
  g.strokeStyle = '#e8a0b0'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-2, -20); g.quadraticCurveTo(-6, -8, -10, 2); g.moveTo(2, -20); g.quadraticCurveTo(6, -8, 9, 3); g.stroke();
  g.restore();
}

// ================================================================ TITLE CARD (0 .. 7)
const TITLE_Y = 868;
const titleMolly = (t) => ({ t, pailOn: 'ground', milkLevel: 0.85, wave: bump(t, 1.6, 2.1, 4.4, 5.0), headTurn: 0.5 + 0.2 * bump(t, 1.4, 1.9, 4.6, 5.2), smile: 0.85,
  happy: 0.6 * bump(t, 2.0, 2.4, 3.0, 3.4) + 0.6 * bump(t, 5.3, 5.7, 6.5, 7.0), bounce: 0.5 * bump(t, 5.1, 5.4, 6.3, 6.8) });
const titleCow = (t) => ({ t, chew: 1 - bump(t, 3.6, 3.9, 4.8, 5.2), headTurn: 0.55 * bump(t, 0.8, 1.6, 6.0, 7.0), moo: 0.8 * bump(t, 3.7, 4.0, 4.6, 5.0),
  happy: 0.6 * bump(t, 5.4, 5.8, 6.4, 6.9), tailSwish: bump(t, 2.2, 2.6, 3.2, 3.6) });
function drawTitle(g, t) {
  S.paperBg(g); g.fillStyle = 'rgba(250,214,160,0.16)'; g.fillRect(0, 0, W, H);
  cam(g, { z: 1 + t * 0.004, x: 0, y: 0 }, 1);
  g.save(); g.textAlign = 'center'; g.fillStyle = INK;
  const a1 = span(t, 0.6, 2.4), a2 = span(t, 1.4, 3.2), a3 = span(t, 2.4, 4.0);
  g.globalAlpha = a1 * 0.9; g.font = '112px "Fell"'; g.fillText('The Milkmaid', 960, 250 + (1 - a1) * 10);
  g.globalAlpha = a2 * 0.9; g.font = 'italic 100px "Fell"'; g.fillText('& Her Pail', 960, 365 + (1 - a2) * 10);
  g.globalAlpha = a3 * 0.75; g.font = 'italic 40px "Fell"'; g.fillText('an Aesop’s fable, for sleepy little ones', 960, 450);
  g.restore();
  g.save(); g.globalAlpha = span(t, 0.2, 1.4);
  pool(g, 1240, TITLE_Y + 4, 300, 20, '#8a7058', 0.2);
  const cs = 0.8, ms = 0.95;
  g.save(); g.translate(1250, TITLE_Y); g.scale(cs, cs); R.cow.shadow(g, titleCow(t)); R.cow.drawAt(g, titleCow, t, { since: 0 }); g.restore();
  g.save(); g.translate(720, TITLE_Y); g.scale(-ms, ms); R.molly.shadow(g, titleMolly(t)); R.molly.drawAt(g, titleMolly, t, { since: 0 }); g.restore();
  g.restore();
}

// ================================================================ THE FARMYARD AT DAWN (n01 .. n04)
// Buttercup stands in the yard in front of the byre, facing left; Molly sits on her stool at Buttercup's hind end,
// facing the udder, milking into the pail (streams of milk, the pail filling). On "called Molly" she looks round at
// us; Buttercup turns her head back to her; the hens peck and cluck; the sun clears the hills. m01: Molly stops,
// pats Buttercup, Buttercup's head comes round to her, a gentle moo. Mother walks in from the left (n03), smiles, and
// tells her to take the milk to market (w01); Molly is delighted. n04: Molly kneels and takes the pail -- cut on the
// action to the wide: she rises with it on her head, turns, and skips off to the right; Mother waves.
const fs = (y) => FARM.personH(y) / 440;          // page px per rig unit for someone standing at page y (Mother: 440 units tall)
const F = { cowX: 1560, cowY: 838, mY: 862, wY: 880 };
const CUT_C = 41.0;                               // the cut on the action: kneeling at the pail -> rising with it on her head
const MILK_AT = [110, 8, -212], GIVE_Y = -140;
let farmCast, PAILF;                              // PAILF: where the milking pail stands { x, y, s, teats }
function makeFarmCast() {
  const cow = actor({ name: 'cow', rig: R.cow, s: fs(F.cowY), x0: F.cowX, y: F.cowY, face0: -1,
    pose: (t) => ({ chew: 1 - bump(t, 30.3, 30.6, 31.3, 31.7),
      lookBack: 0.45 * bump(t, WORD.buttercup - 0.2, WORD.buttercup + 0.7, 21.0, 22.0) + 0.85 * bump(t, 26.2, 27.0, 30.9, 31.9),
      headTurn: 0.4 * bump(t, 8.5, 10.0, 13.0, 14.5) + 0.3 * bump(t, 33.0, 34.0, 38.0, 39.5) + 0.35 * bump(t, 42.5, 43.5, 47, 48),
      happy: 0.8 * bump(t, 27.4, 27.8, 29.6, 30.0) + 0.5 * bump(t, 19.8, 20.2, 20.9, 21.3),
      tailSwish: 0.8 * bump(t, 11.5, 12.0, 13.0, 13.5) + bump(t, 23.0, 23.4, 24.4, 24.8) + 0.7 * bump(t, 35.0, 35.4, 36.4, 36.8),
      moo: 0.75 * bump(t, 30.35, 30.75, 31.2, 31.7) }) });
  // the pail stands under the udder, the stool behind it; Molly's milking hands reach the teats
  const u = R.cow.udderAt({ t: 0 }, cow.tf(0)), teats = u.teats;
  const tx = teats.reduce((a, q) => a + q.x, 0) / teats.length, ms = fs(F.mY);
  PAILF = { x: tx - 20, y: 850, s: fs(850), teats };
  const MX = tx + 34 * ms + 34;
  const molly = actor({ name: 'molly', rig: R.molly, s: ms, x0: MX, y: F.mY, face0: -1,
    turns: [{ a: 42.05, b: 42.95, swap: 43.0 }],
    moves: [{ t0: 39.25, t1: 40.0, by: -0.5 * 140 * ms }, { t0: 43.2, t1: 46.8, by: 3.5 * 140 * ms }],
    pose: (t) => {
      const after = t >= CUT_C;
      return {
        sit: 1 - sm(t, 31.35, 32.15), milk: 1 - sm(t, 24.9, 25.5), milkAt: MILK_AT, milkPhase: t * 1.5,
        pailOn: after ? 'head' : 'none', pailHands: after ? 2 - sm(t, 42.0, 42.7) : 0, milkLevel: 0.85,
        kneel: after ? 1 - sm(t, CUT_C + 0.05, CUT_C + 0.95) : sm(t, 39.95, 40.8),
        give: after ? 0 : sm(t, 40.15, 40.9), giveY: GIVE_Y,
        mouth: say('m01', t) * 0.9,
        headTurn: 0.65 * bump(t, 13.9, 14.5, 16.2, 17.0) + 0.25 * hold(t, 31.6, 39.6),
        happy: 0.7 * bump(t, 14.2, 14.6, 15.8, 16.4) + 0.6 * bump(t, 26.8, 27.1, 27.6, 28.0) + 0.6 * bump(t, 29.3, 29.6, 30.3, 30.7) + 0.8 * bump(t, 38.6, 38.9, 39.6, 40.0) + 0.5 * bump(t, 41.4, 41.8, 42.4, 42.8),
        smile: 0.75, eyeBig: 0.5 * bump(t, 36.9, 37.1, 38.3, 38.8),
        gaze: 0.5 * bump(t, 25.5, 26.0, 27.3, 27.7) - 0.6 * bump(t, 27.7, 28.1, 29.3, 29.8) - 0.6 * bump(t, 39.9, 40.3, 41.0, 41.2) + 0.15 * hold(t, 32, 39),
        nod: 0.12 * bump(t, 25.5, 26.0, 27.3, 27.7) - 0.1 * bump(t, 27.7, 28.1, 29.3, 29.8),
        stroke: bump(t, 26.4, 26.9, 28.3, 28.8), strokeF: 96, strokeY: -262,
        gasp: bump(t, 36.95, 37.2, 37.7, 38.1), bounce: bump(t, 38.5, 38.8, 39.5, 39.9), clasp: 0.8 * bump(t, 38.2, 38.6, 39.5, 39.9),
        skip: after ? 0.7 * sm(t, 43.3, 44.0) : 0,
      };
    } });
  const mum = actor({ name: 'mum', rig: R.mum, s: fs(F.wY), x0: 1300 - 3 * 170 * fs(F.wY), y: F.wY, face0: 1,
    moves: [{ t0: 29.4, t1: 32.6, to: 1300 }],
    visible: (t) => t > 25.2,
    pose: (t) => ({ mouth: say('w01', t),
      happy: 0.7 * bump(t, 32.6, 33.0, 34.0, 34.5) + 0.45 * bump(t, 38.3, 38.7, 39.6, 40.1) + 0.4 * bump(t, 43.6, 44.0, 45, 46),
      headTilt: 0.12 * bump(t, 32.5, 33.0, 34.2, 34.7) + 0.06 * hold(t, 36.2, 39.4), smile: 0.75 + 0.15 * hold(t, 32.5, 46),
      reach: 0.6 * bump(t, 34.35, 34.8, 35.7, 36.2), nodding: 0.6 * bump(t, 35.9, 36.2, 36.9, 37.2) + 0.5 * bump(t, 38.4, 38.7, 39.4, 39.8),
      clasp: 0.8 * bump(t, 36.7, 37.2, 39.9, 40.6), wave: bump(t, 43.3, 43.7, 46.0, 46.5), headTurn: 0.25 * bump(t, 43.2, 43.8, 46, 46.5) }) });
  // hens and chicks pecking about the yard
  const hen = (name, rig, x, y, f, pose) => actor({ name, rig, s: fs(y), x0: x, y, face0: f, pose });
  const hens = [
    hen('hen1', R.hens[0], 1215, 858, 1, (t) => ({ pecking: 1 - hold(t, 20.9, 22.4, 0.3), cluck: hold(t, 21.0, 22.3, 0.3) })),
    hen('hen2', R.hens[1], 1312, 872, -1, (t) => ({ cluck: hold(t, 21.1, 22.6, 0.3) + hold(t, 33.5, 34.6, 0.3), scratch: phase(t, 12.0, 1.6) || phase(t, 26.6, 1.6) || phase(t, 37.2, 1.6), pecking: 0.6 * hold(t, 14, 19) })),
    hen('hen3', R.hens[2], 940, 748, -1, (t) => ({ pecking: 1 - hold(t, 21, 22.4, 0.3), cluck: hold(t, 21.2, 22.4, 0.3) })),
    hen('chick1', R.chicks[0], 1178, 864, 1, (t) => ({ peep: hold(t, 21.3, 22.3, 0.2) + hold(t, 9.5, 10.4, 0.2), peck: phase(t, 13.0, 0.9) || phase(t, 17.5, 0.9) || phase(t, 28.0, 0.9), hop: phase(t, 24.0, 0.8) || phase(t, 35.5, 0.8) })),
    hen('chick2', R.chicks[1], 1262, 878, -1, (t) => ({ peep: hold(t, 21.6, 22.6, 0.2), peck: phase(t, 11.0, 0.9) || phase(t, 19.0, 0.9) || phase(t, 30.5, 0.9), hop: phase(t, 26.0, 0.8) })),
  ];
  farmCast = { cow, molly, mum, hens };
}
// everything in the yard, far to near, in the dawn light
function farmActors(h, t, since0) {
  const { cow, molly, mum, hens } = farmCast, items = [];
  items.push(act(cow, since0, { t }));
  // the pail (while it stands on the ground) and the milk streaming into it
  if (t < CUT_C) items.push({ y: PAILF.y, draw: (hh) => {
    const lvl = lerp(0.35, 0.85, sm(t, 6, 25));
    R.molly.drawPail(hh, PAILF.x, PAILF.y, 0, lvl, { scale: PAILF.s, face: 1, bail: 1.2 });
    const mk = 1 - sm(t, 24.6, 25.2);
    if (mk > 0) { const rim = PAILF.y - PAIL.H * PAILF.s + 4;
      PAILF.teats.slice(1, 3).forEach((q, i) => milkStream(hh, q.x - 2, q.y + 6, PAILF.x - 4 + i * 9, rim, mk * Math.pow(Math.max(0, Math.sin((t * 1.5 + i * 0.5) * TAU)), 0.6), t, i)); }
  } });
  items.push({ y: F.mY - 0.5, draw: (hh) => drawStool(hh, farmCast.stoolX, F.mY, molly.s) });
  items.push(act(molly, since0, { t }));
  items.push(act(mum, since0, { t }));
  for (const A of hens) items.push(act(A, since0, { t }));
  tinted(h, '#f0a080', 0.07, (hh) => drawItems(hh, items));
}
const camFarmA = (t) => camPath(t, view(1000, 470, 1.12), [
  [7.2, 12.2, view(1250, 560, 1.15)],
  [12.2, 15.4, view(1610, 728, 2.05)],                       // "called Molly"
  [16.6, 19.6, view(1570, 724, 1.9)],                        // milking, Buttercup
  [20.3, 21.8, view(1460, 730, 1.75)],                       // "while the hens clucked"
  [22.2, 24.9, view(1280, 560, 1.15)],                       // the sun over the hills
]);
const camFarmB = (t) => camPath(t, view(1600, 738, 2.2), [   // m01 .. n04 (cut in at 25.2)
  [29.0, 31.8, view(1490, 722, 1.7)],                        // Mother comes
  [36.7, 38.3, view(1530, 728, 1.85)],                       // Molly delighted
  [39.6, 40.9, view(1630, 745, 2.15)],                       // kneeling to the pail
]);
const camFarmC = (t) => camPath(t, view(1420, 630, 1.3), [[42.6, 46.5, view(1540, 640, 1.3)]]);   // the wide, from the cut
function drawFarmMorning(g, t, c, since0) {
  S.paperBg(g);
  drawFarm(g, t, c, 'dawn', { mistLift: sm(t, 6, 22), mistK: 0.5, sunK: 1 + 0.7 * bump(t, 21.8, 23.4, 25.0, 26.0), actors: (h) => farmActors(h, t, since0) });
}

// ================================================================ THE LANE (n04 .. m06)
// The side-on travelling set: Molly walks left to right at page x LX, the lane scrolling under her at exactly her
// walking speed. Skipping at first, slower and dreamier as the daydream comes (the rosy cloud above the lane ahead of
// her, its pictures melting one into the next), bouncier and bouncier; she stops for "like this!", the toss, the pail
// flies off backwards, "Splash!"; the dream bursts into four little bubbles that pop as she names what was in them.
const LS = 0.95, LSTR = 140 * LS, LX = 820;
const TOSS0 = 77.6, TOSSD = 6.0, RELEASE = TOSS0 + TOSSD * TOSS_RELEASE, SPLASH = WORD.splash;
const STOP = 77.3;                                // she stops on the stony bit (the near verge is clear of tall plants there)
let laneScroll, laneMolly, LPH0, FLIGHT, DREAM;
const laneY = (sc) => LANE_PAN.groundAt(LX, sc);
function makeLane() {
  const keys = [[44.2, 0, 176], [47.6, 600], [50.8, 1040], [55, 1520], [60, 2090], [64.2, 2560], [68, 3020], [71.4, 3560], [75, 4270], [STOP, 4500, 0]];
  const D = keys[keys.length - 1][1], Dq = Math.round(D / (LSTR / 2)) * (LSTR / 2);
  keys[keys.length - 1][1] = Dq;
  laneScroll = monotone(keys);
  const sc = (t) => laneScroll(Math.min(t, STOP));
  LPH0 = 0;
  const dreamW = (t) => 0.85 * bump(t, 49.6, 50.6, 56.4, 57.0) + 0.55 * bump(t, 57.6, 58.2, 59.3, 59.7) + 0.6 * bump(t, 61.2, 61.8, 64.4, 65.0);
  const skipW = (t) => 0.65 * (1 - sm(t, 46.9, 47.9)) + 0.45 * bump(t, 59.4, 59.9, 60.8, 61.3) + 0.5 * bump(t, 65.8, 66.4, 70.6, 71.2) + 0.8 * bump(t, 71.2, 71.8, 75.6, 76.3);
  laneMolly = {
    rig: R.molly, s: LS,
    x: () => LX, y: (t) => laneY(sc(t)),
    face: () => 1,
    since: (t, s0) => s0,
    st(t) {
      const dw = dreamW(t), toss = phase(t, TOSS0, TOSSD), spl = t > SPLASH;
      return { t, walk: LPH0 + sc(t) / LSTR, walkAmt: 1 - sm(t, STOP - 0.35, STOP + 0.1), skip: skipW(t) * (1 - sm(t, STOP - 0.6, STOP)),
        pailOn: t < RELEASE ? 'head' : 'none', pailHands: 1 - dw, milkLevel: 0.85,
        daydream: dw, toss, tossSurprise: 1,
        mouth: Math.max(say('m02', t), say('m03', t), say('m04', t), say('m05', t), say('m06', t)) * 0.9,
        happy: 0.6 * bump(t, 54.8, 55.2, 55.8, 56.3) + 0.7 * bump(t, 59.4, 59.7, 60.4, 60.8) + 0.5 * bump(t, 62.9, 63.3, 64.0, 64.5),
        eyeBig: 0.6 * bump(t, 57.1, 57.4, 58.0, 58.5) + 0.7 * bump(t, 68.6, 68.9, 69.8, 70.4) + 0.5 * bump(t, 80.9, 81.1, 82.4, 83.0),
        gasp: 0.85 * bump(t, 68.65, 68.95, 69.6, 70.1) + bump(t, 80.95, 81.15, 81.9, 82.4) + 0.9 * bump(t, 88.9, 89.15, 89.9, 90.4),
        sad: sm(t, 82.4, 83.6) * (0.7 + 0.3 * sm(t, 99.5, 100.8)), tear: sm(t, 99.3, 101.6),
        gaze: (-0.55 * hold(t, 82.9, 88.6) - 0.4 * hold(t, 91.3, 92.6) + 0.55 * (bump(t, 92.8, 93.1, 93.8, 94.2) + bump(t, 94.8, 95.1, 95.9, 96.2) + bump(t, 95.9, 96.2, 96.9, 97.3) + bump(t, 97.9, 98.2, 99.0, 99.5))),
        headTurn: 0.25 * (bump(t, 92.8, 93.2, 93.8, 94.2) + bump(t, 97.9, 98.3, 99.0, 99.5)) - 0.2 * (bump(t, 94.8, 95.2, 95.9, 96.3)),
        nod: -0.1 * hold(t, 100.6, 102.5),
      };
    },
    tf(t) { return { x: LX, y: laneY(sc(t)), scale: LS, face: -laneMolly.face(t) }; },
    visible: () => true,
  };
  laneMolly.poseFn = (tt) => laneMolly.st(tt);
  // the pail's flight: thrown from its last motion on her head; the fall is timed to land exactly on "Splash!"
  const o = laneMolly.tf(RELEASE), p0 = R.molly.pailAt(laneMolly.poseFn, RELEASE - 1e-3, o), p1 = R.molly.pailAt(laneMolly.poseFn, RELEASE - 1 / 30 - 1e-3, o);
  // the head flick throws it up and forward, tipping over the way it was already tipping as it left her head
  const T = SPLASH - RELEASE, gr = 2300, gy = laneY(Dq) + 2;
  const v = [(p0.x - p1.x) * 30 + 150, (gy - p0.y - 0.5 * gr * T * T) / T], a1 = Math.PI / 2 + 0.35, w = (a1 - p0.angle) / T;
  FLIGHT = { p0, v, w, gr, T, landX: p0.x + v[0] * T, landY: gy, a1, dir: 1, a0: p0.angle };
  console.warn('[story] pail flight', JSON.stringify({ p0x: Math.round(p0.x), p0y: Math.round(p0.y), a0: p0.angle.toFixed(2), rigw: ((p0.angle - p1.angle) * 30).toFixed(2), vx: Math.round(v[0]), vy: Math.round(v[1]), w: w.toFixed(2), land: Math.round(FLIGHT.landX) }));
  DREAM = { x: 1330, y: 440, w: 600, h: 400 };
}
// the pail: on the head (drawn by the rig), flying, landing on its side, the milk splashing out and spreading
function pailFlight(t) {
  const F = FLIGHT, dt = t - RELEASE;
  if (dt < 0) return null;
  if (dt < F.T) return { x: F.p0.x + F.v[0] * dt, y: F.p0.y + F.v[1] * dt + 0.5 * F.gr * dt * dt, a: F.p0.angle + F.w * dt, milk: lerp(0.85, 0.15, clamp(dt / F.T)), flying: true };
  const u = dt - F.T, k = ease(clamp(u / 0.35)), bounce = Math.sin(clamp(u / 0.3) * Math.PI) * 10 * (1 - k);
  const aEnd = F.dir * (Math.PI / 2 - 0.12);
  return { x: F.landX + F.v[0] * 0.06 * ease(clamp(u / 0.5)), y: lerp(F.landY, F.landY - 26 * LS, k) - bounce, a: lerp(F.a1, aEnd, k), milk: 0, landed: u };
}
function drawPailFlight(g, t) {
  const p = pailFlight(t); if (!p) return;
  const F = FLIGHT;
  // the milk: a creamy puddle spreading from the rim over the lane, droplets splashing up
  if (p.landed !== undefined) {
    const sx = p.x + F.dir * 70 * LS, k = clamp(p.landed / 3.2);
    drawSpill(g, sx, F.landY + 4, 0.05 + 0.95 * ease(k), t, { scale: LS, seed: 7 });
    const u = p.landed;
    if (u < 0.9) for (let i = 0; i < 16; i++) {
      const ang = -Math.PI / 2 + (noise1(i * 3.7, 2) - 0.5) * 2.4 + F.dir * 0.35, sp = 300 + 420 * noise1(i * 1.3, 5), x = sx + Math.cos(ang) * sp * u, y = F.landY - 6 + Math.sin(ang) * sp * u + 1300 * u * u;
      if (y > F.landY + 8) continue;
      g.fillStyle = `rgba(253,250,240,${0.9 * (1 - u / 0.9)})`; g.beginPath(); g.ellipse(x, y, 5 - i % 3, 6 - i % 3, ang, 0, TAU); g.fill();
    }
  } else {
    // a slosh of milk leaving the rim as it tips
    const dt = t - RELEASE;
    g.save(); g.fillStyle = 'rgba(252,248,238,0.92)';
    for (let i = 0; i < 9; i++) { const d = dt - i * 0.03; if (d < 0.02) continue;   // each drop left the rim i frames ago and flies on its own
      const a = F.a0 + F.w * d, rx = F.p0.x + F.v[0] * d + Math.sin(a) * PAIL.H * LS * 0.95, ry = F.p0.y + F.v[1] * d + 0.5 * F.gr * d * d - Math.cos(a) * PAIL.H * LS * 0.95;
      const e = dt - d; g.beginPath(); g.ellipse(rx + (F.v[0] * 0.6 + 60) * e, ry + (F.v[1] * 0.8 - 80) * e + 0.5 * F.gr * e * e, 6.5 - i * 0.5, 5 - i * 0.35, a, 0, TAU); g.fill(); }
    g.restore();
  }
  R.molly.drawPail(g, p.x, p.y, p.a, p.milk, { scale: LS, face: 1, bail: 1.35 });
}
// the dream: which pictures, melting one into the next
function dreamState(t) {
  if (t < 61.4) return { scene: 'eggs' };
  if (t < 65.0) return { scene: 'hens', from: 'eggs', mix: sm(t, 61.4, 62.9) };
  if (t < 71.8) return { scene: 'shop', from: 'hens', mix: sm(t, 65.0, 66.5) };
  return { scene: 'fair', from: 'shop', mix: sm(t, 71.8, 73.2) };
}
const EGGS = [1, 2, 4, 5, 6];                       // the dream basket's eggs that are bought (spots), each hatching a chick
const eggAppear = (t, i) => sm(t, WORD.eggs - 0.1 + i * 0.13, WORD.eggs + 0.3 + i * 0.13);
const eggCrack = (t, i) => sm(t, WORD.hatch - 0.15 + i * 0.14, WORD.hatch + 0.95 + i * 0.14);
const dreamHen = (i) => (t) => ({ t, walk: 2.2 * walkDist(clamp((t - 62.4 - i * 0.2) / 1.8)), walkAmt: bump(t, 62.3 + i * 0.2, 62.6 + i * 0.2, 64.0 + i * 0.2, 64.3 + i * 0.2),
  cluck: hold(t, 63.0 + i * 0.25, 64.0 + i * 0.2, 0.25), pecking: hold(t, 64.6, 70, 0.3), happy: 0.4 });
const dreamChick = (i) => (t) => ({ t, peep: hold(t, WORD.fluffy + i * 0.15, WORD.fluffy + 0.6 + i * 0.15, 0.15) + hold(t, 59.5 + i * 0.2, 60.2 + i * 0.2, 0.15) });
const blueMolly = (t) => ({ t, twirl: phase(t, 73.2, 2.4), toss: phase(t, WORD.toss - 0.44 * 2.5, 2.5), smile: 0.9, happy: 0.4 * hold(t, 72.5, 73.1) + 0.5 * bump(t, 74.0, 74.4, 75.0, 75.5) });
function dreamInside(g, t, x, y, w, h) {
  const ds = dreamState(t), bob = Math.sin(t * 0.8) * 4, Y = y + bob;
  const aOf = (sc) => (ds.scene === sc ? (ds.from ? ease(ds.mix) : 1) : ds.from === sc ? 1 - ease(ds.mix) : 0);
  // eggs in the basket, cracking, chicks peeping out of them (and growing as the picture melts into the hen run)
  const aE = aOf('eggs');
  if (aE > 0) {
    const spots = dreamSpot('eggs', 'eggs', x, Y, w, h), es = h / 520 * 48;
    g.save(); g.globalAlpha *= aE;
    EGGS.map((si, i) => [si, i]).sort((a, b) => spots[a[0]][1] - spots[b[0]][1]).forEach(([si, i]) => {
      const k = eggAppear(t, i); if (k <= 0) return;
      const [ex, ey] = spots[si], s = es * (0.9 + 0.1 * (si % 3)) * (0.6 + 0.4 * k), cr = eggCrack(t, i);
      g.save(); g.globalAlpha *= k; drawDreamEgg(g, ex, ey, s, cr, ['#f4e6cc', '#e8cca4', '#f8eedc', '#d8b088', '#f0dcc0', '#ead2b0', '#f6e8d0'][si], si); g.restore();
      const rise = ease(clamp((cr - 0.55) / 0.4));
      if (rise > 0) {
        const grow = 1 + 0.45 * sm(t, WORD.grow - 0.3, WORD.grow + 0.9), cs = es / 34 * 0.95 * grow, cy = ey - s * 0.3 + (1 - rise) * s * 0.7;
        g.save(); g.beginPath(); g.rect(ex - 200, ey - s * 0.5 - 400, 400, 400); g.clip();
        g.translate(ex, cy); g.scale((i % 2 ? 1 : -1) * cs, cs); R.chicks[i % 2].drawAt(g, dreamChick(i), t, { since: 56 }); g.restore();
      }
    });
    g.restore();
  }
  // the fine fat hens in the sunny hen run, strutting in and clucking
  const aH = aOf('hens');
  if (aH > 0) {
    g.save(); g.globalAlpha *= aH;
    ['hen1', 'hen2', 'hen3'].forEach((n, i) => {
      const [hx, hy] = dreamSpot('hens', n, x, Y, w, h), hs = h / 470 * 0.62 * (i === 1 ? 1.08 : 1), f = i === 2 ? 1 : -1;
      const fn = dreamHen(i), D = 2.2 * R.hens[i].STRIDE * hs, wd = walkDist(clamp((t - 62.4 - i * 0.2) / 1.8));
      g.save(); g.translate(hx + (f > 0 ? 1 : -1) * D * (1 - wd), hy);
      g.scale(f * hs, hs); R.hens[i].shadow(g, fn(t)); R.hens[i].drawAt(g, fn, t, { since: 60 }); g.restore();
    });
    g.restore();
  }
  // Molly in the blue dress at the fair: a twirl ("everyone will look at me"), then the toss of the head
  const aF = aOf('fair');
  if (aF > 0) {
    const [mx, my] = dreamSpot('fair', 'molly', x, Y, w, h), bs = h / 470 * 0.45;
    g.save(); g.globalAlpha *= aF; g.translate(mx, my); g.scale(-bs, bs); R.blue.shadow(g, blueMolly(t)); R.blue.drawAt(g, blueMolly, t, { since: 70 }); g.restore();
  }
  // "A blue one, with ribbons!": twinkles round the dress in the window
  const aS = aOf('shop');
  if (aS > 0) {
    const [dx, dy] = dreamSpot('shop', 'dress', x, Y, w, h), k = aS * bump(t, WORD.blue - 0.2, WORD.blue + 0.3, 70.6, 71.6);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + t * 0.6, r = 70 + 26 * Math.sin(t * 2 + i), tw = k * Math.pow(Math.max(0, Math.sin(t * 3 + i * 1.7)), 2);
      if (tw < 0.03) continue; const px = dx + Math.cos(a) * r, py = dy + Math.sin(a) * r * 1.3, L = 9 * tw + 3;
      g.fillStyle = `rgba(255,240,215,${0.9 * tw})`; g.beginPath(); g.moveTo(px, py - L); g.quadraticCurveTo(px, py, px + L * 0.6, py); g.quadraticCurveTo(px, py, px, py + L); g.quadraticCurveTo(px, py, px - L * 0.6, py); g.quadraticCurveTo(px, py, px, py - L); g.fill(); }
    g.restore();
  }
}
// after the splash: four little bubbles, each holding one piece of the dream, that pop one by one as she names them
const BUBS = [
  { pop: WORD.eggs6 + 0.05, dx: -230, dy: -380, r: 58, what: 'egg' },
  { pop: WORD.chicks6 + 0.05, dx: -90, dy: -460, r: 58, what: 'chick' },
  { pop: WORD.hens6 + 0.1, dx: 70, dy: -440, r: 64, what: 'hen' },
  { pop: WORD.dress6 + 0.45, dx: 220, dy: -370, r: 64, what: 'dress' },
];
function drawBubbles(g, t) {
  if (t < SPLASH || t > 100) return;
  const hx = LX + 10, hy = laneY(laneScroll(STOP));
  BUBS.forEach((b, i) => {
    const out = ease(clamp((t - SPLASH - 0.05 - i * 0.12) / 1.3));
    if (out <= 0) return;
    const pop = clamp((t - b.pop) / 0.6); if (pop >= 1) return;
    const sx = DREAM.x - 40 + (i - 1.5) * 60, sy = DREAM.y + 40;
    const x = lerp(sx, hx + b.dx, out) + Math.sin(t * 0.9 + i * 1.7) * 10, y = lerp(sy, hy + b.dy, out) + Math.sin(t * 1.3 + i) * 8, r = b.r * (0.4 + 0.6 * out);
    bubble(g, x, y, r, t, out, (h) => {
      if (b.what === 'egg') drawDreamEgg(h, x, y + r * 0.45, r * 0.95, 0, '#f4e6cc', 3);
      else if (b.what === 'chick') { h.save(); h.translate(x, y + r * 0.4); h.scale(1.5, 1.5); R.chicks[0].drawAt(h, (tt) => ({ t: tt, peep: 0.4 * Math.max(0, Math.sin(tt * 3)) }), t, { since: 80 }); h.restore(); }
      else if (b.what === 'hen') { h.save(); h.translate(x + 4, y + r * 0.55); h.scale(-0.62, 0.62); R.hens[0].drawAt(h, (tt) => ({ t: tt }), t, { since: 80 }); h.restore(); }
      else drawDress(h, x, y + 6, r / 52);
    }, pop);
  });
}
const camLane = (t) => camPath(t, view(930, 650, 1.12), [
  [48.6, 51.2, view(1000, 650, 1.12)],                       // the dream begins: room for the cloud
  [71.6, 76.8, view(980, 662, 1.25)],                        // m05: closer, bouncing toward the toss
  [81.3, 83.8, view(920, 668, 1.32)],                        // the splash: the pail and the milk in front of her
  [88.4, 91.0, view(900, 670, 1.38)],                        // m06
  [96.4, 100.6, view(870, 676, 1.48)],
]);
function drawLane(g, t) {
  S.paperBg(g);
  const c = camLane(t), sc = laneScroll(Math.min(t, STOP));
  drawLaneParallax(g, laneParallax('morning'), c, sc, t, {
    actors: (h) => {
      if (t > RELEASE && pailFlight(t).landed !== undefined) drawPailFlight(h, t);
      drawActor(h, laneMolly, t, 44);
      if (t > RELEASE && pailFlight(t).landed === undefined) drawPailFlight(h, t);
    },
    after: (h) => {
      const k = sm(t, WORD.dream - 0.3, WORD.dream + 1.1) * (1 - sm(t, SPLASH, SPLASH + 0.5));
      if (k > 0) {
        const hd = R.molly.headAt(laneMolly.poseFn, t, laneMolly.tf(t));
        drawDream(h, DREAM.x, DREAM.y, DREAM.w, DREAM.h, t, k, { ...dreamState(t), tail: [hd.x + 40, hd.y - 60], eggs: { show: 0 },
          inside: (hh) => dreamInside(hh, t, DREAM.x, DREAM.y, DREAM.w, DREAM.h) });
      }
      drawBubbles(h, t);
    },
  });
}

// ================================================================ THE WALK HOME (n07)
const HX = 1150;
let homeLane;
function makeHomeLane() {
  const S0 = 2000, v = 92;            // px/s: slow and sad
  homeLane = {
    rig: R.molly, s: LS, sc: (t) => S0 - v * (t - 101.4),
    x: () => HX, y: (t) => LANE_PAN.groundAt(HX, homeLane.sc(t)), face: () => -1, since: (t, s0) => s0,
    st: (t) => ({ t, walk: (S0 - homeLane.sc(t)) / LSTR, walkAmt: 1, sadWalk: 1, pailOn: 'hand', milkLevel: 0, sad: 0.8, tear: 0.6 }),
    visible: () => true,
  };
  homeLane.poseFn = (tt) => homeLane.st(tt);
}
function drawHomeLane(g, t) {
  S.paperBg(g);
  const c = camPath(t, view(1080, 650, 1.12), [[101.5, 107, view(1020, 650, 1.16)]]);
  drawLaneParallax(g, laneParallax('morning'), c, homeLane.sc(t), t, { actors: (h) => drawActor(h, homeLane, t, 101.2) });
}

// ================================================================ HOME AGAIN: MOTHER'S COMFORT (n07 .. m07)
// Mother waits in the yard; Molly trudges in from the right with the empty pail, drops it, and Mother kneels and hugs
// her (Mother drawn in two layers with Molly between), brushes the tear away, and gently tells her the lesson. Molly
// giggles, wiser; a last hug.
const RY = 872;
let homeCast, DROP;
function makeHomeCast() {
  const s = fs(RY), WX = 868, MX = WX + 100 * s;
  const molly = actor({ name: 'molly', rig: R.molly, s, x0: MX + 4.5 * 140 * s, y: RY, face0: -1,
    moves: [{ t0: 104.6, t1: 109.3, to: MX }],
    pose: (t) => ({ sadWalk: 1 - sm(t, 109.0, 109.6), pailOn: t < DROP.t ? 'hand' : 'none', milkLevel: 0,
      sad: 0.85 * (1 - sm(t, 116.2, 117.6)), tear: (0.6 + 0.4 * sm(t, 109, 111)) * (1 - sm(t, 113.3, 114.0)),
      hug: hold(t, 110.5, 113.0, 0.5) + hold(t, 123.0, 125.6, 0.5),
      mouth: say('m07', t) * 0.9, happy: 0.8 * bump(t, 118.2, 118.5, 119.0, 119.4) + 0.5 * hold(t, 121.4, 123.5),
      smile: lerp(0.3, 0.85, sm(t, 116.4, 117.6)), bounce: bump(t, 118.1, 118.4, 119.0, 119.4),
      nod: 0.12 * bump(t, 119.6, 119.9, 120.2, 120.5) - 0.06 * bump(t, 120.2, 120.5, 120.8, 121.1),
      gaze: 0.35 * hold(t, 113.2, 117.4) + 0.2 * hold(t, 119.2, 122.6), headTurn: 0.15 * hold(t, 114, 117) }) });
  const mum = actor({ name: 'mum', rig: R.mum, s, x0: WX, y: RY, face0: 1,
    pose: (t) => ({ kneel: sm(t, 108.9, 110.2) * (1 - sm(t, 125.8, 127.4)), comfort: hold(t, 110.45, 113.0, 0.5) + hold(t, 123.0, 125.6, 0.5),
      brush: hold(t, 113.2, 114.3, 0.35), point: 0.7 * hold(t, 114.6, 116.4, 0.35), pointUp: 1,
      mouth: say('w02', t) * 0.9, happy: 0.6 * bump(t, 110.0, 110.4, 110.9, 111.3) + 0.7 * bump(t, 118.4, 118.8, 120.2, 120.8) + 0.5 * hold(t, 123.2, 125.4),
      smile: 0.8, nodding: 0.5 * hold(t, 111.7, 112.5, 0.25) + 0.5 * hold(t, 119.2, 120.4, 0.3), headTilt: 0.12 * hold(t, 114.4, 117.0), sad: 0.3 * hold(t, 106, 110.2) }) });
  homeCast = { molly, mum };
  // the empty pail slips from her hand and drops beside her, upright
  DROP = { t: 109.45 };
  const p = R.molly.pailAt(molly.poseFn, DROP.t - 1e-3, molly.tf(DROP.t));
  DROP.p = p; DROP.gy = RY + 6;
}
function drawDroppedPail(g, t) {
  if (t < DROP.t) return;
  const p = DROP.p, u = t - DROP.t, T = Math.sqrt(2 * Math.max(1, DROP.gy - p.y) / 2400);
  let y, a;
  if (u < T) { y = p.y + 0.5 * 2400 * u * u; a = p.angle * (1 - u / T); }
  else { const w = u - T; y = DROP.gy - 5 * Math.abs(Math.sin(w * 12)) * Math.exp(-w * 6); a = 0.12 * Math.sin(w * 14) * Math.exp(-w * 5); }
  R.molly.drawPail(g, p.x, y, a, 0, { scale: homeCast.molly.s, face: 1, bail: 1.25 });
}
const camHome = (t) => camPath(t, view(1010, 730, 1.9), [
  [107.4, 110.4, view(940, 742, 2.15)],                      // the hug
  [113.0, 116.6, view(930, 752, 2.3)],                       // the lesson
  [117.8, 120.4, view(945, 742, 2.1)],                       // Molly giggles
  [122.8, 126.6, view(900, 690, 1.6)],
]);
function drawHome(g, t) {
  S.paperBg(g);
  const c = camHome(t), { molly, mum } = homeCast;
  drawFarm(g, t, c, 'dawn', { mistK: 0, sunK: 0.5, actors: (h) => tinted(h, '#f0b090', 0.05, (hh) => {
    if (DROP && t >= DROP.t) drawDroppedPail(hh, t);
    drawActor(hh, mum, t, 104, { layer: 'back' });
    drawActor(hh, molly, t, 104);
    drawActor(hh, mum, t, 104, { layer: 'front', shadow: false });
  }) });
}

// ================================================================ DUSK: BUTTERCUP LIES DOWN IN THE STRAW (n08)
const CB = { x: BYRE.straw.x, y: BYRE.straw.y + 6 };
let duskCow, duskHens;
function makeDusk() {
  duskCow = actor({ name: 'cow', rig: R.cow, s: fs(CB.y), x0: CB.x, y: CB.y, face0: -1,
    pose: (t) => ({ chew: 1 - sm(t, 131.4, 132.0), lie: sm(t, WORD.lay - 0.1, 134.3), sleep: sm(t, 134.6, 136.6), headTurn: 0.3 * bump(t, 129.5, 130.5, 131.5, 132.0), happy: 0.5 * bump(t, 133.6, 134.0, 135, 136) }) });
  // two hens strutting home to the hen house in the low gold light
  duskHens = [0, 1].map((i) => { const y = 742 + i * 10, s = fs(y);
    return actor({ name: 'dhen' + i, rig: R.hens[i], s, x0: 1110 + i * 40, y, face0: -1, moves: [{ t0: 125.6 + i * 0.4, t1: 131.6 + i * 0.4, by: -(150 + i * 40) }],
      pose: (t) => ({ cluck: hold(t, 127.6 + i, 128.4 + i, 0.2), pecking: hold(t, 132.2 + i * 0.3, 136, 0.3) }) }); });
}
const camDusk = (t) => camPath(t, view(820, 470, 1.08), [[127.6, 130.4, view(900, 480, 1.12)], [130.6, 132.4, view(1630, 600, 2.15)]]);
function drawDusk(g, t) {
  S.paperBg(g);
  drawFarm(g, t, camDusk(t), 'dusk', { actors: (h) => tinted(h, '#c87060', 0.14, (hh) => drawItems(hh, [act(duskCow, 125, { t }), ...duskHens.map((A) => act(A, 125, { t }))])) });
}

// ================================================================ NIGHT: THE HENS TUCK THEIR HEADS UNDER THEIR WINGS (n09)
let nightHens;
function makeNightHens() {
  nightHens = [[842, 722, 1, 0], [902, 730, -1, 1], [960, 724, -1, 2]].map(([x, y, f, i]) => actor({ name: 'nhen' + i, rig: R.hens[i], s: fs(y), x0: x, y, face0: f,
    pose: (t) => ({ sleep: sm(t, WORD.tucked - 0.5 + i * 0.35, WORD.tucked + 1.3 + i * 0.35), cluck: hold(t, 135.0 + i * 0.4, 135.6 + i * 0.4, 0.15) }) }));
}
function drawNightHens(g, t) {
  S.paperBg(g);
  const c = camPath(t, view(890, 640, 2.3), [[135.0, 139.5, view(900, 628, 2.5)]]);
  drawFarm(g, t, c, 'night', { starsAppear: 133, actors: (h) => tinted(h, '#262a5c', 0.35, (hh) => drawItems(hh, nightHens.map((A) => act(A, 133, { t })))) });
}

// ================================================================ THE BEDROOM (n09 .. n11)
// Molly sits up in her little bed under the window, smiles, lies back (n09 "curled up"); Mother kneels at the bedside
// and tucks her in; stars come out in the window (n10); asleep, she dreams a small sunny dream of tomorrow morning;
// the whispered goodnight; the candle burns down.
let bed, BEDS;
function makeBedroom() {
  const s = 1.0;
  // root on the mattress at her hips, chosen so that, lying back, her head rests on the pillow
  const probe = (st) => () => ({ t: 0, bed: 1, nightgown: true, lie: 1, ...st });
  const hd = R.molly.headAt(probe({}), 0, { x: 0, y: 0, scale: s, face: -1 });
  BEDS = { s, x: BEDROOM.head[0] - hd.x, y: BEDROOM.head[1] - hd.y + 4 };
  const mumS = 1.12;
  bed = {
    molly: actor({ name: 'molly', rig: R.molly, s, x0: BEDS.x, y: BEDS.y, face0: 1,
      pose: (t) => ({ bed: 1, nightgown: true, lie: sm(t, 139.2, 141.2), sleep: sm(t, 142.4, 145.0), smile: 0.8, happy: 0.6 * bump(t, 138.6, 139.0, 139.6, 140.0), headTurn: 0.3 * (1 - sm(t, 139.2, 140.4)) }) }),
    mum: actor({ name: 'mum', rig: R.mum, s: mumS, x0: BEDROOM.head[0] + 430, y: 905, face0: -1,
      pose: (t) => ({ kneel: 1, tuck: hold(t, 140.6, 143.4, 0.6), tuckAt: [110, 0, -110], bend: 0.3 * hold(t, 140.6, 143.4, 0.6), smile: 0.85, clasp: 0.7 * hold(t, 144.4, 160, 0.6),
        happy: 0.6 * hold(t, 143.8, 152, 0.6), headTilt: 0.12 * hold(t, 143.5, 156) }) }),
  };
}
const sunnyCow = (t) => ({ t, chew: 1, headDown: 0.4 + 0.3 * Math.sin(t * 0.5), happy: 0.4 });
function drawRoom(g, t) {
  S.paperBg(g);
  const c = camPath(t, view(880, 560, 1.45), [
    [140.6, 143.0, view(840, 520, 1.6)],
    [WORD.stars - 0.5, 147.0, view(880, 450, 1.7)],          // the window, stars coming out
    [153.6, 158.0, view(800, 560, 1.9)],                     // n11: close on her sleeping face
    [158.5, 168, view(820, 540, 1.6)],
  ]);
  drawBedroom(g, t, c, {
    candle: 1 - sm(t, 160.8, 165.5), starsK: 0.15 + 0.85 * sm(t, WORD.stars - 0.2, 146.8), moonK: 0.3 + 0.7 * sm(t, 145.5, 147.5),
    sleeper: (h) => drawActor(h, bed.molly, t, 138, { shadow: false }),
    actors: (h) => drawActor(h, bed.mum, t, 138, { shadow: false }),
    after: (h) => {
      // a small sunny dream: not of dresses and fairs, but of tomorrow morning (the hen run in the sun, Buttercup)
      const k = sm(t, WORD.dreamed, 147.8) * (1 - sm(t, 155.2, 157.4));
      if (k > 0) {
        const hd = R.molly.headAt(bed.molly.poseFn, t, bed.molly.tf(t)), DX = 1010, DY = 300, DW = 330, DH = 220;
        drawDream(h, DX, DY, DW, DH, t, k, { scene: 'hens', from: 'fair', mix: sm(t, WORD.sunny - 0.2, WORD.sunny + 1.4), tail: [hd.x + 30, hd.y - 30],
          inside: (hh) => { const a = sm(t, WORD.sunny, WORD.sunny + 1.4); if (a <= 0) return; const [gx, gy] = dreamSpot('hens', 'ground', DX, DY + Math.sin(t * 0.8) * 4, DW, DH);
            hh.save(); hh.globalAlpha *= a; hh.translate(gx + 20, gy); hh.scale(0.12, 0.12); R.cow.drawAt(hh, sunnyCow, t, { since: 148 }); hh.restore(); } });
      }
      zzz(h, t, BEDROOM.head[0] + 30, BEDROOM.head[1] - 70, 146.5, 1e9);
    },
  });
}

// ================================================================ THE NIGHT FARM (the end)
function drawNightFarm(g, t) {
  S.paperBg(g);
  const c = camPath(t, view(700, 470, 1.45), [[166, 182, view(960, 540, 1.04)]]);
  drawFarm(g, t, c, 'night', { starsAppear: 150, fireflies: 10 });
}
function drawEnd(g, t) {
  const n11 = S.line('n11'), END = S.TL.duration;
  const a = span(t, n11.end + 1.5, n11.end + 4.5) * (1 - span(t, END - 12, END - 7));
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
    R.molly = makeMilkmaid(2); R.blue = makeMilkmaid(2, 71, { dress: 'blue' }); R.mum = makeMother(2); R.cow = makeCow(2);
    R.hens = [makeHen(2, 41, 'brown'), makeHen(2, 42, 'speckled'), makeHen(2, 43, 'white')]; R.chicks = [makeChick(2, 47), makeChick(2, 48)];
    BUF_A = canvas(W, H, false); BUF_B = canvas(W, H, false); MASKC = canvas(240, 135, false); ABUF = canvas(W, H, false);
    makeFarmCast(); farmCast.stoolX = farmCast.molly.x(0) + 4 * farmCast.molly.s;
    makeLane(); makeHomeLane(); makeHomeCast(); makeDusk(); makeNightHens(); makeBedroom();
    SHOTS = [
      [0, drawTitle],
      [5.6, (g, t) => drawFarmMorning(g, t, camFarmA(t), 5), 2.0],
      [25.2, (g, t) => drawFarmMorning(g, t, camFarmB(t), 5), 0],
      [CUT_C, (g, t) => drawFarmMorning(g, t, camFarmC(t), CUT_C), 0],
      [44.2, drawLane, 1.6],
      [101.6, drawHomeLane, 1.5],
      [105.6, drawHome, 1.5],
      [125.9, drawDusk, 1.8],
      [134.8, drawNightHens, 1.6],
      [138.4, drawRoom, 1.6],
      [166.0, drawNightFarm, 3.0],
    ];
  },
  frame(t) { S.frame(t, [[0, master]]); },
};
