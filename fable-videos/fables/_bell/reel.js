// mice3 + cat3 test reel: every action of the rigs on plain paper, a label per action.
// Each segment returns a list of actors { rig, x, y, s, face, since, fn(tt) -> state } plus props; every actor is
// drawn with drawAt (follow-through). Faces: 1 = as drawn (facing LEFT), -1 = mirrored.
import { paper, sprite, bbox, wash, ellipse, smooth, penLine, shadeEdge, blooms, soften, strokes, pool, glaze, furEdge, clamp, lerp, ease, span, rgba } from '../../engine/watercolor.js';
import { makeMouseRig, STRIDE, hopX, climbOffset, walkRest } from '../../engine/characters/mice3.js';
import { REEL_CAT, catSetup } from './reel-cat.js';
export let M = {};
let PAPER, REEL_S, CANDLE, NEST_B, NEST_F;
const GROUND = 900, S = 2.0;

// ---- props (in mouse units, root of the prop at its base centre)
const SPOOL_W = 92, SPOOL_H = 62;
function makeSpool() {
  const body = smooth([[-38, -6], [-38, -56], [38, -56], [38, -6]], true, 2);
  const rimT = ellipse(0, -59, 46, 6, 30), rimB = ellipse(0, -3, 46, 6, 30);
  const sh = [[-46, -62], [46, -62], [46, 0], [-46, 0]];
  return sprite(bbox(sh.concat([[-50, -70], [50, 8]])), 2, (g) => {
    wash(g, smooth([[-46, -8], [-46, 0], [46, 0], [46, -8]], true, 2), { under: true, color: '#c89a68', opacity: 0.95, seed: 3 });
    wash(g, body, { under: true, color: '#b84a48', opacity: 0.95, seed: 4 });
    for (let y = -54; y < -6; y += 3.2) penLine(g, [[-38, y], [0, y + 1.2], [38, y]], { color: '#8a2a2a', w: 0.8, alpha: 0.45, seed: 10 + y });
    shadeEdge(g, body, { color: '#5a1a1a', alpha: 0.45, width: 18, dx: 10, dy: 0 });
    pool(g, -18, -32, 10, 20, '#f0b0a0', 0.35);
    penLine(g, body, { closed: true, w: 1.6, alpha: 0.7 });
    wash(g, rimB, { under: true, color: '#c89a68', opacity: 0.95, seed: 5 }); penLine(g, rimB, { closed: true, w: 1.4, alpha: 0.7 });
    wash(g, ellipse(0, -59, 46, 8, 30), { under: true, color: '#d8ac7a', opacity: 0.97, seed: 6 });
    pool(g, 0, -59, 12, 3, '#6a4a2a', 0.6);
    penLine(g, ellipse(0, -59, 46, 8, 30), { closed: true, w: 1.4, alpha: 0.7 });
    // a loose end of thread
    penLine(g, [[34, -40], [48, -28], [52, -8], [62, -2]], { color: '#b84a48', w: 1.4, alpha: 0.9 });
  });
}
function makeCandle() {
  const stick = smooth([[-13, -2], [-13, -86], [-6, -90], [8, -88], [13, -84], [13, -2]], true, 3);
  const dish = ellipse(0, -2, 34, 8, 30);
  return sprite(bbox(stick.concat([[-40, 10], [40, -100]])), 2, (g) => {
    wash(g, dish, { under: true, color: '#b89a6a', opacity: 0.95, seed: 7 }); penLine(g, dish, { closed: true, w: 1.4, alpha: 0.7 });
    wash(g, stick, { under: true, color: '#f4e8c8', opacity: 0.97, seed: 8 });
    shadeEdge(g, stick, { color: '#c8a878', alpha: 0.5, width: 10, dx: 5, dy: 0 });
    penLine(g, [[-6, -90], [-8, -70], [-5, -60]], { color: '#e8d8b0', w: 3, alpha: 0.9 }); // a drip
    penLine(g, stick, { closed: true, w: 1.4, alpha: 0.6 });
    penLine(g, [[0, -88], [0.5, -96]], { color: '#2a1a10', w: 1.6, alpha: 0.9 });
  });
}
function drawFlame(g, t, x, y, k = 1) {
  const f = 1 + 0.08 * Math.sin(t * 13) + 0.05 * Math.sin(t * 7.3), sw = 1.5 * Math.sin(t * 3.1) + Math.sin(t * 5.7);
  g.save(); g.translate(x, y);
  g.globalCompositeOperation = 'lighter';
  pool(g, 0, -10, 140 * k * f, 140 * k * f, '#ffb050', 0.16);
  g.globalCompositeOperation = 'source-over';
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-7 * k, -10 * k, sw, -26 * k * f); g.quadraticCurveTo(7 * k, -10 * k, 0, 0);
  const gr = g.createLinearGradient(0, 0, 0, -26 * k); gr.addColorStop(0, '#ffd890'); gr.addColorStop(0.5, '#ffb040'); gr.addColorStop(1, '#ff8a20');
  g.fillStyle = gr; g.fill();
  g.fillStyle = 'rgba(255,250,220,0.9)'; g.beginPath(); g.ellipse(0, -7 * k, 2.4 * k, 5 * k, 0, 0, 7); g.fill();
  g.restore();
}
function makeNest() {
  const back = smooth([[-120, -20], [-100, -54], [0, -66], [100, -54], [126, -20], [0, -30]]);
  const front = smooth([[-140, -36], [-110, 20], [0, 34], [110, 20], [146, -36], [100, -24], [0, -18], [-100, -24]]);
  const wool = (g, shape, sd, n, col) => strokes(g, shape, { color: col, count: n, len: 30, width: 2.4, alpha: 0.6, seed: sd, dir: () => 0.1, curve: 0.8 });
  const b = sprite(bbox(back), 1.6, (g) => { wash(g, back, { under: true, color: '#b89a80', opacity: 0.9, seed: 21 }); wool(g, back, 22, 120, '#8a6a50'); penLine(g, back, { closed: true, w: 1.4, alpha: 0.5, seed: 23 }); });
  const f = sprite(bbox(front), 1.6, (g) => {
    wash(g, front, { under: true, color: '#d8c0a0', opacity: 0.95, seed: 24 }); blooms(g, front, ['#c8a888', '#e8d8c0', '#c89890'], { n: 6, seed: 25, alpha: 0.4 });
    wool(g, front, 26, 200, '#a88868'); wool(g, front, 27, 80, '#e8a0a0');
    for (let i = 0; i < 5; i++) penLine(g, [[-90 + i * 40, -20], [-80 + i * 40, -36], [-70 + i * 42, -30]], { color: '#f8f0e0', w: 3, alpha: 0.85, seed: 30 + i }); // feathers
    penLine(g, front, { closed: true, w: 1.6, alpha: 0.6, seed: 28 });
  });
  return { b, f };
}

// ---- helpers
const talk = (t) => clamp(0.55 * Math.max(0, Math.sin(t * 13) * 0.7 + Math.sin(t * 5.3) * 0.5) + 0.1 * Math.sin(t * 29));
const on = (k, a, b, r = 0.3) => span(k, a, a + r) * (1 - span(k, b - r, b));
function smoothDist(u) { const a = 0.22, vmax = 1 / (1 - a); if (u <= 0) return 0; if (u >= 1) return 1; if (u < a) return vmax * u * u / (2 * a); if (u > 1 - a) return 1 - vmax * (1 - u) * (1 - u) / (2 * a); return vmax * (a / 2 + (u - a)); }
// turning: turn 0 -> 1 between a and b, then the mirrored transform with turn 0 from `swap`
function turner(k, a, b, swap, face0 = 1) { if (k < swap) return { face: face0, since: 0, turn: span(k, a, b) }; return { face: -face0, since: swap, turn: 0 }; }

export const SEGS = [];
const seg = (len, label, fn) => { const t0 = SEGS.length ? SEGS[SEGS.length - 1][1] : 0; SEGS.push([t0, t0 + len, label, fn]); };
// an actor whose pose function is a function of the segment time k
const act = (name, x, y, s, poseK, o = {}) => ({ rig: M[name], x, y, s, face: o.face || 1, sinceK: o.sinceK ?? 0, poseK, ...o });

// ===================== mice
seg(5, 'Mice: idle life, then talking (one-piece mouth)', (k) => [
  act('young', 1150, GROUND, S, (q) => ({ mouth: q > 2.6 && q < 4.6 ? talk(q) * on(q, 2.6, 4.6, 0.15) : 0, bounce: 0.6 })),
  act('elder', 700, GROUND, S, (q) => ({ mouth: q > 0.8 && q < 2.3 ? talk(q) * 0.8 * on(q, 0.8, 2.3, 0.15) : 0 })),
]);
seg(4, 'Close-up: blinks, whiskers, glance at us, talk', (k) => [
  act('young', 1060, 1240, 4.6, (q) => ({ headTurn: 0.42 * on(q, 1.2, 3.6, 0.5), mouth: q > 2 && q < 3.4 ? talk(q) * on(q, 2, 3.4, 0.12) : 0, smile: 0.7 })),
]);
seg(5, 'Walk (distance-driven, feet planted), stop', (k) => {
  const D = 7 * STRIDE * 0.9, u = clamp((k - 0.3) / 4.2), d = D * smoothDist(u);
  return [act('young', 1500, GROUND, S, (q) => { const uu = clamp((q - 0.3) / 4.2), dd = D * smoothDist(uu); return { walk: dd / (STRIDE * 0.9), walkAmt: on(q, 0.1, 4.6, 0.5) }; }, { x: 1500 - d * S })];
});
seg(3.4, 'Scurry!', (k) => {
  const D = 9 * STRIDE * 0.9, dist = (q) => D * smoothDist(clamp((q - 0.2) / 2.9));
  return [act('young', 300, GROUND, S, (q) => ({ walk: dist(q) / (STRIDE * 0.9), walkAmt: on(q, 0.05, 3.2, 0.3), scurry: on(q, 0.1, 3.2, 0.4) }), { face: -1, x: 300 + dist(k) * S })];
});
seg(5.2, 'Turn round (head leads, front view), swap, turn back', (k) => {
  const r = k < 2.5 ? { face: 1, sinceK: 0, turn: span(k, 0.4, 1.8) } : { face: -1, sinceK: 2.5, turn: span(k, 3.0, 4.4) };
  return [act('young', 960, GROUND, S, (q) => (q < 2.5) === (k < 2.5) ? { turn: q < 2.5 ? span(q, 0.4, 1.8) : span(q, 3.0, 4.4) } : { turn: k < 2.5 ? 0 : 1 }, { face: r.face, sinceK: r.sinceK })];
});
seg(4, 'Hop, hop, and a jump on the spot', (k) => {
  const h1 = clamp((k - 0.2) / 1.0), h2 = clamp((k - 1.3) / 1.0), h3 = clamp((k - 2.5) / 1.2);
  const ph = (q) => { const a = clamp((q - 0.2) / 1.0), b = clamp((q - 1.3) / 1.0), c = clamp((q - 2.5) / 1.2); const v = q < 1.3 ? a : q < 2.5 ? b : c; return v >= 1 ? 0 : v; };
  return [act('young', 1250, GROUND, S, (q) => ({ hop: ph(q), hopHeight: q > 2.5 ? 60 : 34, happy: on(q, 2.6, 3.9, 0.3) }), { x: 1250 - (hopX(h1) + hopX(h2)) * 60 * S })];
});
seg(5.6, 'Climb up onto a cotton reel', (k) => {
  const T = 3.6, u = clamp((k - 0.6) / T), done = u >= 1, off = climbOffset(1, 70, SPOOL_H);
  const pose = (q) => { const uu = clamp((q - 0.6) / T); return uu >= 1 ? { climb: 0, happy: on(q, 4.3, 5.6, 0.4) } : { climb: uu, climbHeight: SPOOL_H, climbDist: 70 }; };
  return [{ prop: 'spool', x: 1200 - 44 * S - SPOOL_W / 2 * S, y: GROUND, s: S },
    act('young', 1200 + (done ? off[0] * S : 0), GROUND + (done ? off[1] * S : 0), S, (q) => (clamp((q - 0.6) / T) >= 1) === done ? pose(q) : pose(done ? 0.6 + T : 0.6 + T - 1e-4), { sinceK: done ? 0.6 + T : 0 })];
});
seg(4.4, 'Sit down (on the reel) and stand up', (k) => [
  { prop: 'spool', x: 960 + 30 * S, y: GROUND, s: S },
  act('young', 960, GROUND - SPOOL_H * S, S, (q) => ({ sit: on(q, 0.5, 3.6, 0.8), sad: 0.4 * on(q, 1, 3.2, 0.5), toes: 0.3 * on(q, 1.2, 3.2, 0.6) })),
]);
seg(6.4, 'Wave, point, explain', (k) => [
  act('mother', 960, GROUND, S, (q) => ({ wave: on(q, 0.3, 2.0, 0.4), point: on(q, 2.2, 3.8, 0.4), pointUp: 0.3 * Math.sin(q * 1.5), explain: on(q, 4.0, 6.2, 0.4), mouth: q > 4.2 ? talk(q) * on(q, 4.2, 6, 0.15) : 0 })),
]);
seg(6.2, 'Clap, cheer, shrug', (k) => [
  act('plump', 960, GROUND, S, (q) => ({ clap: on(q, 0.3, 2.3, 0.3), cheer: on(q, 2.4, 4.2, 0.35), hop: clamp((q - 2.9) / 0.9) % 1, hopHeight: 30, shrug: on(q, 4.5, 6.1, 0.4) })),
]);
seg(5, 'Cover eyes, peek, hands on tummy', (k) => [
  act('baby', 960, GROUND, S * 1.4, (q) => ({ cover: on(q, 0.3, 3.2, 0.4), peek: on(q, 1.6, 2.6, 0.3), tummy: on(q, 3.4, 5, 0.4), happy: on(q, 3.6, 4.8, 0.3) })),
]);
seg(6.4, 'Look at toes, look at the ceiling, sheepish', (k) => [
  act('shy', 700, GROUND, S, (q) => ({ toes: on(q, 0.3, 2.4, 0.5) })),
  act('plump', 1250, GROUND, S, (q) => ({ ceiling: on(q, 1.0, 3.2, 0.5) })),
  act('young', 960, GROUND - 40, S * 0.8, (q) => ({ sheepish: on(q, 3.4, 6.2, 0.5), mouth: q > 4.4 && q < 5.6 ? talk(q) * 0.6 : 0 }), { hide: q0 => q0 < 3.2 }),
]);
seg(6, 'Whisper to a neighbour; listen; nod / shake', (k) => [
  act('mother', 820, GROUND, S, (q) => ({ whisper: on(q, 0.3, 3.0, 0.5), mouth: q > 0.9 && q < 2.6 ? talk(q) * 0.4 : 0, nod: on(q, 4.2, 5.8, 0.3) })),
  act('shy', 1080, GROUND, S, (q) => ({ listen: on(q, 0.6, 3.2, 0.4), happy: on(q, 2.5, 3.4, 0.3), shake: on(q, 3.6, 5.2, 0.3) }), { face: -1 }),
]);
seg(5, 'A happy little jig', (k) => [
  act('young', 960, GROUND, S, (q) => ({ dance: on(q, 0.3, 4.6, 0.5), dancePhase: q * 2.2 })),
]);
seg(9, 'Elder: leans on the stick, talks, chuckles, spectacles, walks', (k) => {
  const D = 3 * STRIDE * 1.04, dist = (q) => D * smoothDist(clamp((q - 6.2) / 2.6));
  return [act('elder', 1250, GROUND, S, (q) => ({ mouth: q > 0.4 && q < 2.2 ? talk(q) * 0.8 : 0, explain: on(q, 0.4, 2.4, 0.4), chuckle: on(q, 2.5, 4.2, 0.4), specs: clamp((q - 4.3) / 1.6) % 1,
    walk: dist(q) / (STRIDE * 1.04), walkAmt: on(q, 6.1, 8.9, 0.4) }), { x: 1250 - dist(k) * S })];
});
seg(7.5, 'Yawn, then curl up asleep in a nest', (k) => [
  { prop: 'nestB', x: 960, y: GROUND - 10, s: S },
  act('shy', 960, GROUND - 20, S, (q) => ({ yawn: clamp((q - 0.3) / 2.2) % 1, sleep: span(q, 2.8, 5.2), feet: q < 4 })),
  { prop: 'nestF', x: 960, y: GROUND - 10, s: S },
]);
// the council: six mice round a candle
const RING = ['elder', 'mother', 'plump', 'young', 'shy', 'baby'];
const C_X = 960, C_Y = 800, RX = 360, RY = 120, Q0 = 6.6, OMEGA = 0.5, TW = 0.36;
// where on the ring: angle (eased start), position, depth scale
const ringAng = (i, q) => Math.PI * 2 * i / 6 + 0.42 + OMEGA * smoothT(q - Q0, 1.6);
const ringPos = (a) => ({ x: C_X + RX * Math.cos(a), y: C_Y + RY * Math.sin(a), s: 1.15 * (0.86 + 0.14 * Math.sin(a)) });
// facing round the ring: the front half walks left (face 1), the back half right (-1). Near each end it turns round:
// turn eases 0 -> 1 across a small arc, then the facing swaps with turn 0 (the exact mirror).
function ringFace(a) {
  const m = ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  for (const e of [Math.PI, 0, 2 * Math.PI]) {
    const d = m - e;
    if (d > -TW && d < TW) return { face: e === Math.PI ? 1 : -1, turn: ease((d + TW) / (2 * TW)), end: e };
  }
  return { face: Math.sin(m) >= 0 ? 1 : -1, turn: 0 };
}
// the last moment the facing swapped (for drawAt's `since`): bisection on the eased angle
function lastSwap(i, q) {
  const a = ringAng(i, q), m0 = a - (((a % Math.PI) + Math.PI) % Math.PI); // start of this half-turn
  let target = m0 + TW; if (target > a) target -= Math.PI;
  if (target < ringAng(i, Q0)) return 0;
  let lo = Q0, hi = q; for (let j = 0; j < 30; j++) { const mid = (lo + hi) / 2; if (ringAng(i, mid) < target) lo = mid; else hi = mid; }
  return hi;
}
seg(15, 'The council: idle, whispers, cheer and clap, dance round the candle', (k) => {
  const out = [{ prop: 'candle', x: C_X, y: C_Y + 4, s: 1.6, z: C_Y + 4 }];
  RING.forEach((n, i) => {
    // standing, they face the candle; those who will walk off the other way turn round just before
    const a0 = ringAng(i, 0), moveFace = ringFace(a0).face, standFace = Math.abs(Math.cos(a0)) < 0.2 ? moveFace : Math.cos(a0) > 0 ? 1 : -1;
    const stateAt = (q) => {
      const st = {};
      if (i === 1) { st.whisper = on(q, 0.5, 2.9, 0.4); st.mouth = talk(q) * 0.35 * on(q, 0.8, 2.6, 0.2); }
      if (i === 2) st.listen = on(q, 0.7, 2.9, 0.4);
      if (i === 4) { st.whisper = on(q, 0.9, 3.0, 0.4); st.mouth = talk(q + 1) * 0.3 * on(q, 1.1, 2.8, 0.2); }
      if (i === 5 || i === 0) st.listen = on(q, 1.0, 3.0, 0.4);
      if (i % 2) { st.cheer = on(q, 3.3, 5.2, 0.35); st.hop = q > 3.6 && q < 4.6 ? q - 3.6 : 0; st.hopHeight = 22; }
      else { st.clap = on(q, 3.3, 6.0, 0.3); st.clapPhase = q * 2.4 + i * 0.13; }
      if (n === 'elder') { st.clap = 0; st.chuckle = on(q, 3.4, 6.0, 0.4); }
      st.dance = on(q, 6.2, 14.6, 0.6) * (n === 'elder' ? 0.5 : 1); st.dancePhase = q * 2.2 + i * 0.5;
      return st;
    };
    const travel = (q) => { if (q <= Q0) return 0; let d = 0; const N = 40; for (let j = 0; j < N; j++) { const a = ringAng(i, Q0 + (q - Q0) * j / N), b = ringAng(i, Q0 + (q - Q0) * (j + 1) / N); const pa = ringPos(a), pb = ringPos(b); d += Math.abs(pb.x - pa.x) / ((pa.s + pb.s) / 2); } return d; };
    const facing = (q) => (q < Q0 ? { face: standFace, turn: standFace === moveFace ? 0 : span(q, Q0 - 1.5, Q0 - 0.02) } : ringFace(ringAng(i, q)));
    const f = facing(k), p = ringPos(ringAng(i, k)), sinceK = k < Q0 ? 0 : Math.max(lastSwap(i, k), standFace === moveFace ? 0 : Q0);
    const full = (q) => ({ ...stateAt(q), turn: facing(q).turn, walk: travel(q) / (M[n].STRIDE), walkAmt: span(q, Q0, Q0 + 0.8) });
    out.push({ rig: M[n], x: p.x, y: p.y, s: p.s, z: p.y, face: f.face, sinceK,
      poseK: (q) => (facing(q).face === f.face ? full(q) : full(k)) });
  });
  return out;
});
function smoothT(x, ramp) { if (x <= 0) return 0; if (x < ramp) return x * x / (2 * ramp) * 1; return ramp / 2 + (x - ramp); }

export const MICE_DURATION = SEGS[SEGS.length - 1][1];
REEL_CAT(SEGS, seg, act, GROUND);
export const DURATION = SEGS[SEGS.length - 1][1];

export const REEL = {
  async setup() {
    PAPER = paper();
    const names = { elder: 'elder', young: 'young', mother: 'mother', baby: 'baby', plump: 'plump', shy: 'shy' };
    let sd = 61; for (const n in names) M[n] = makeMouseRig(2, sd++, names[n]);
    REEL_S = makeSpool(); CANDLE = makeCandle(); const ns = makeNest(); NEST_B = ns.b; NEST_F = ns.f;
    await catSetup(M);
  },
  actors(t) {
    const sg = SEGS.find(([a, b]) => t >= a && t < b) || SEGS[SEGS.length - 1];
    const [t0, t1, label, fn] = sg;
    return { t0, t1, label, list: fn(t - t0) };
  },
  frame(g, t) {
    g.drawImage(PAPER, 0, 0);
    const { t0, t1, label, list } = this.actors(t);
    const k = t - t0;
    g.save(); g.strokeStyle = 'rgba(90,70,50,0.22)'; g.lineWidth = 2; g.beginPath(); g.moveTo(60, GROUND + 2); g.lineTo(1860, GROUND + 2); g.stroke(); g.restore();
    const items = list.map((a, i) => ({ ...a, i }));
    items.sort((a, b) => (a.z ?? 0) - (b.z ?? 0) || a.i - b.i);
    for (const a of items) {
      if (a.prop) { drawProp(g, a, t); continue; }
      if (a.hide && a.hide(k)) continue;
      const poseFn = (tt) => ({ t: tt, ...a.poseK(tt - t0) });
      g.save(); g.translate(a.x, a.y); g.scale(a.s, a.s);
      if (a.rig.shadow) a.rig.shadow(g, poseFn(t), a.shadowH || 0);
      g.scale(a.face, 1);
      a.rig.drawAt(g, poseFn, t, { since: t0 + (a.sinceK || 0) });
      g.restore();
      if (a.after) a.after(g, t);
    }
    const al = span(t, t0, t0 + 0.4) * (1 - span(t, t1 - 0.3, t1));
    g.save(); g.globalAlpha = al; g.fillStyle = '#4a3a2c'; g.font = 'italic 50px Fell, serif'; g.fillText(label, 80, 100);
    g.globalAlpha = al * 0.6; g.font = 'italic 28px Fell, serif'; g.fillText(`mice3 / cat3 test - ${k.toFixed(1)} s`, 82, 144); g.restore();
  },
};
function drawProp(g, a, t) {
  g.save(); g.translate(a.x, a.y); g.scale(a.s, a.s);
  const d = (s) => g.drawImage(s.c, s.x0, s.y0, s.w, s.h);
  if (a.prop === 'spool') { pool(g, 0, 2, 56, 7, '#2a1e12', 0.25); d(REEL_S); }
  if (a.prop === 'candle') { pool(g, 0, 2, 40, 6, '#2a1e12', 0.25); d(CANDLE); drawFlame(g, t, 0.5, -96, 1); }
  if (a.prop === 'nestB') d(NEST_B);
  if (a.prop === 'nestF') d(NEST_F);
  if (a.draw) a.draw(g, t);
  g.restore();
}
