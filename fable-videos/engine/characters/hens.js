// Storybook HENS (brown, speckled, white) and fluffy yellow CHICKS. Plump, round and soft, drawn in a clean PROFILE
// (one eye, the beak, comb and wattle all seen from the side: never a front feature on a side head). Line-and-wash
// sprites (scalloped feathers) on a small rig: the head rides a bending neck, legs with yellow scaly shanks and
// three forward toes plus a back toe, planted while they stand.
//
// FACING: drawn facing LEFT, feet on the ground at y = 0. A hen is about 110 units tall to the comb (Molly is 350),
// a chick about 34. Mirror with scale(-1, 1). Walking moves the root LEFT.
//
//   const hen = makeHen(res, seed, colour)      colour: 'brown' (default) | 'speckled' | 'white'
//   const chick = makeChick(res, seed)
//   x.draw(g, st) / x.drawAt(g, poseFn, t, { since })    (the head and tail follow through a little)
//   x.STRIDE (walk = distance / STRIDE), x.beakAt(poseFn, t, o) -> {x, y}, x.shadow(g, st)
//
// ---- hen state
//   t, life (idle: breathing, blinks, little head jerks and tilts, a tail flick now and then)
//   peck 0..1      phase: one peck at the ground in front (dip, a quick double tap, up)
//   pecking 0..1   keep pecking (automatic rhythm)
//   cluck 0..1     clucking: the head bobs forward and back, the beak opens and shuts
//   scratch 0..1   phase: rake the ground with one foot (a kick back), hop back a little and look down
//   walk (cycles) + walkAmt 0..1: a strut, the head holding still and then jerking forward (the hen head-bob)
//   sleep 0..1     settle down on the ground (legs tucked, feathers fluffed), the head turned back and tucked under
//                  the wing, eyes closed, slow breathing
//   happy 0..1, eye 0..1
// ---- chick state:  t, life, peep 0..1 (beak opens, a little bounce), peck 0..1 (phase), hop 0..1 (phase: one hop),
//                    walk + walkAmt (quick little steps), sleep 0..1 (squat down, eyes closed)
import { wash, pool, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, rgba, shade, tint, mix, clamp, lerp, ease, penLine, hatch, looseWash,
  blooms, soften, path, ellipse, furEdge, speckle } from '../watercolor.js';
import { buttonEye, PAPER, INK } from './kit.js';
import { TAU, fr, easeInOut, bell, key, glance, event, kernel, makeFilter, taper, on } from './rig3.js';

const PAL = {
  brown: { body: '#b9773e', light: '#d89a5c', dark: '#7a4a26', tail: '#3e2c22', neck: '#c98848', spots: null },
  speckled: { body: '#d6cfc2', light: '#efe9de', dark: '#8a8478', tail: '#3a3634', neck: '#ddd6ca', spots: '#2e2a28' },
  white: { body: '#f3eee2', light: '#fbf8f0', dark: '#c8bca4', tail: '#e8e0d0', neck: '#f6f2e8', spots: null },
};
const COMB = '#d84a3c', BEAK = '#e8b048', LEG = '#e6b44c';
const HB = smooth([[-50, -60], [-40, -82], [-8, -88], [24, -80], [42, -62], [46, -42], [32, -26], [2, -19], [-30, -24], [-48, -38]]);
const TAIL = smooth([[-42, -58], [-56, -82], [-66, -104], [-58, -108], [-48, -96], [-38, -88], [-30, -72]]);
const WING = smooth([[-36, -60], [-6, -70], [20, -62], [24, -48], [6, -36], [-22, -34], [-40, -44]]);
const NECK_B = [26, -70], HEAD0 = [38, -94];
const STRIDE_H = 46;
function walkFootH(q) { q = fr(q + 0.05) - 0.05; if (q < 0.55) return [-STRIDE_H * (q - 0.25), 0]; const u = (q - 0.55) / 0.4; return [-STRIDE_H * 0.3 + STRIDE_H * 0.6 * easeInOut(u), 10 * Math.sin(Math.PI * u)]; }

const DEF = { life: 1, eye: 1 };
const PH = new Set(['walk', 'peck', 'scratch', 'hop']);
const filt = makeFilter(PH, DEF);
const KH = kernel(4.5, 0.7, 0.3, 7), KT = kernel(2.4, 0.35, 0.7, 9);

function henSolve(st, dl = 0) {
  const t = (st.t || 0) - dl, v = (k) => st[k] ?? DEF[k] ?? 0;
  const P = { hx: 0, hy: 0, ha: 0, beak: 0, eye: v('eye'), happy: v('happy'), pitch: 0, by: 0, fluff: 0, tuck: 0, tail: 0, scr: 0, scrSide: 0, sq: 0 };
  const wa = clamp(v('walkAmt')), sleep = clamp(v('sleep')), peck = v('peck'), scratch = v('scratch'), cluck = clamp(v('cluck')), pecking = clamp(v('pecking'));
  const busy = clamp(Math.max(wa, sleep, on(peck), on(scratch), cluck, pecking));
  const life = clamp(v('life')) * (1 - busy);
  // idle: little jerky head moves (a hen holds still, then snaps to a new look), tilts, blinks, a tail flick
  const g1 = glance(t, 1.3, 5, 0.12), g2 = glance(t + 0.6, 1.9, 9, 0.1);
  P.hx += life * 4 * g1; P.hy += life * 3 * g2; P.ha += life * 0.25 * g2;
  const bl = event(t, 3.1, 0.18, 7); if (bl >= 0) P.eye *= 1 - Math.sin(Math.PI * bl);
  const tf = event(t + 1, 5.5, 0.4, 3); if (tf >= 0) P.tail += Math.sin(Math.PI * tf) * Math.sin(tf * TAU * 2) * 0.15;
  if (wa > 0) { // strut: the head holds still in space, then jerks forward
    const ph = v('walk'), hp = fr(ph * 2), jerk = hp < 0.7 ? -hp / 0.7 : -1 + (hp - 0.7) / 0.3;
    P.hx += wa * STRIDE_H * 0.5 * (jerk + 0.5); P.by -= wa * 2 * Math.abs(Math.sin(ph * TAU * 2)); P.tail += wa * 0.05 * Math.sin(ph * TAU * 2);
  }
  if (cluck > 0) { const c = Math.sin(t * TAU * 2.2); P.hx += cluck * 7 * c; P.hy -= cluck * 2 * c; P.beak = Math.max(P.beak, cluck * 0.6 * Math.max(0, Math.sin(t * TAU * 4.4))); P.ha += cluck * 0.1 * c; }
  const pk = (u) => { const d = key(u, [[0, 0], [0.3, 1], [0.42, 0.85], [0.52, 1], [0.62, 0.85], [0.72, 1], [1, 0]]); P.hx += d * 18; P.hy += d * 74; P.ha -= d * 0.9; P.pitch += d * 0.22; P.beak = Math.max(P.beak, 0.35 * bell(u, 0.35, 0.75)); P.tail += d * 0.2; };
  if (peck > 0 && peck < 1) pk(peck);
  if (pecking > 0) { const u = fr(t * 0.7); const d0 = P.hy; pk(u); P.hy = lerp(d0, P.hy, pecking); }
  if (scratch > 0 && scratch < 1) { const u = scratch; P.scr = key(u, [[0, 0], [0.15, 0.3], [0.3, 1], [0.38, 0], [0.5, 0.2], [0.62, 1], [0.7, 0], [1, 0]]); P.scrSide = u < 0.45 ? 0 : 1; P.pitch += 0.12 * bell(u, 0.05, 0.75); P.hy += 30 * bell(u, 0.7, 1); P.hx += 10 * bell(u, 0.7, 1); P.ha -= 0.5 * bell(u, 0.7, 1); P.by -= 3 * bell(u, 0.25, 0.35); }
  if (sleep > 0) { const k = ease(sleep); P.by += k * 18; P.fluff = k; P.tuck = ease((sleep - 0.25) / 0.75); P.eye *= 1 - ease(sleep / 0.5); P.happy *= 1 - sleep; }
  P.breath = Math.sin(t * TAU * lerp(0.5, 0.25, sleep)) * (1 + sleep);
  return P;
}

export function makeHen(res = 2, seed = 41, colour = 'brown') {
  const C = PAL[colour] || PAL.brown, s = (n) => seed * 100 + n;
  const feathers = (g, shape, col, n, sd) => { // scalloped feather marks
    const b = bbox(shape); g.save(); path(g, shape); g.clip(); g.strokeStyle = rgba(shade(col, 0.45), 0.4); g.lineWidth = 0.9;
    let k = 0; for (let y = b.y0 + 6; y < b.y1; y += 7) for (let x = b.x0 + ((k++) % 2) * 4; x < b.x1; x += 8) { g.beginPath(); g.arc(x, y, 3.6, 0.2, Math.PI - 0.2); g.stroke(); }
    g.restore();
  };
  const body = sprite(bbox(HB.concat(TAIL)), res, (g) => {
    wash(g, TAIL, { color: C.tail, opacity: 0.95, under: PAPER, seed: s(1) });
    for (let k = 0; k < 4; k++) penLine(g, smooth([[-40, -70 + k * 3], [-52 - k * 3, -90 + k * 2], [-58 - k * 2, -100 + k * 3]], false), { color: colour === 'white' ? '#b8ac94' : '#1e1612', w: 1.2, alpha: 0.6 });
    penLine(g, TAIL, { closed: true, w: 1.6, alpha: 0.75 });
    wash(g, HB, { color: PAPER, opacity: 1, under: PAPER, seed: s(2), edge: 0 });
    looseWash(g, HB, C.body, { opacity: 0.9, seed: s(3), shift: 2, reserves: 2 });
    blooms(g, HB, [C.light, C.dark, C.body], { n: 5, seed: s(4), alpha: 0.3 });
    glaze(g, HB, 22, -36, 26, 12, C.light, 0.5);
    feathers(g, HB, C.body, 0, s(5));
    if (C.spots) { g.save(); path(g, HB); g.clip(); speckle(g, bbox(HB), { color: C.spots, count: 140, size: 2.2, alpha: 0.55, seed: s(6) }); g.restore(); }
    shadeEdge(g, HB, { color: C.dark, alpha: 0.4, width: 16, dy: -6 });
    soften(g, 0.6 * res);
    furEdge(g, HB, { color: C.body, count: 50, len: 5, width: 1.2, alpha: 0.6, seed: s(7) });
    penLine(g, HB, { closed: true, w: 1.8, alpha: 0.8, seed: s(8) });
  }, { seed: s(9), grain: 0.12 });
  const wing = sprite(bbox(WING), res, (g) => {
    wash(g, WING, { color: shade(C.body, 0.08), opacity: 0.95, under: PAPER, seed: s(10) });
    if (C.spots) { g.save(); path(g, WING); g.clip(); speckle(g, bbox(WING), { color: C.spots, count: 50, size: 2, alpha: 0.5, seed: s(11) }); g.restore(); }
    for (let k = 0; k < 5; k++) penLine(g, smooth([[-30 + k * 2, -48 + k * 2], [-6 + k * 4, -56 + k * 3], [16, -50 + k * 2]], false), { color: shade(C.body, 0.5), w: 0.9, alpha: 0.5 });
    for (let k = 0; k < 4; k++) penLine(g, [[-34 + k * 9, -40], [-28 + k * 9, -34]], { color: shade(C.body, 0.5), w: 0.9, alpha: 0.5 });
    shadeEdge(g, WING, { color: C.dark, alpha: 0.35, width: 10, dy: -4 });
    penLine(g, WING, { closed: true, w: 1.5, alpha: 0.75, seed: s(12) });
  }, { granulate: false });
  const HEAD = ellipse(0, 0, 14, 13, 24);
  const head = sprite(bbox(HEAD.concat([[-14, -26], [24, 20]])), res, (g) => {
    // comb (three lobes) and wattle, then the head
    const comb = smooth([[-8, -10], [-10, -18], [-5, -22], [-1, -17], [2, -24], [7, -19], [9, -23], [13, -16], [12, -8]]);
    wash(g, comb, { color: COMB, opacity: 0.95, under: PAPER, seed: s(13) }); penLine(g, comb, { closed: true, w: 1.2, alpha: 0.75 });
    wash(g, HEAD, { color: C.neck, opacity: 0.95, under: PAPER, seed: s(14) }); glaze(g, HEAD, -4, -4, 8, 6, C.light, 0.5);
    if (C.spots) { g.save(); path(g, HEAD); g.clip(); speckle(g, bbox(HEAD), { color: C.spots, count: 16, size: 1.6, alpha: 0.5, seed: s(15) }); g.restore(); }
    g.fillStyle = rgba('#e88a7c', 0.6); g.beginPath(); g.ellipse(6, 3, 5, 4, 0, 0, 7); g.fill(); // red face patch
    penLine(g, HEAD, { closed: true, w: 1.4, alpha: 0.8 });
  }, { granulate: false });

  function rig(raw, ph, pt) {
    const sq = 1 + 0.08 * raw.fluff + 0.01 * raw.breath;
    const pitch = raw.pitch, by = raw.by;
    const M = (p) => { const c = Math.cos(pitch), sn = Math.sin(pitch); const x = p[0] * sq, y = (p[1] + 40) * sq; return [x * c - y * sn, -40 + by + x * sn + y * c]; };
    let H = [HEAD0[0] + ph.hx, HEAD0[1] + ph.hy + by];
    // asleep: the head goes back over the body and in under the wing
    H = [lerp(H[0], -2, raw.tuck), lerp(H[1], -52 + by, raw.tuck)];
    return { raw, ph, pt, M, H, ha: lerp(ph.ha, 0.6, raw.tuck) };
  }
  function legs(g, R) {
    const raw = R.raw; if (raw.fluff > 0.8) return;
    for (const near of [false, true]) {
      let [dx, lift] = walkFootH((raw.walkPhase || 0) + (near ? 0 : 0.5));
      const stand = 1 - clamp(raw.wa || 0); dx *= 1 - stand;
      const scr = raw.scr * (raw.scrSide === (near ? 0 : 1) ? 1 : 0);
      const fx = (near ? 2 : -6) + dx - scr * 26, fy = -lift - scr * 6;
      const hip = R.M([near ? 0 : -6, -26]);
      const knee = [lerp(hip[0], fx, 0.5) - 6, lerp(hip[1], fy - 10, 0.55)];
      const col = near ? LEG : shade(LEG, 0.15);
      const k = 1 - raw.fluff;
      g.save(); g.globalAlpha *= clamp(k * 1.3); g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 6; g.beginPath(); g.moveTo(knee[0], knee[1]); g.lineTo(fx, fy - 2); g.stroke();
      g.strokeStyle = col; g.lineWidth = 3.6; g.stroke();
      // toes: three forward (spread when planted, curled when lifted), one back
      g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 2.6; const curl = clamp(lift / 6 + scr);
      for (const a of [-0.25, 0.05, 0.3]) { g.beginPath(); g.moveTo(fx, fy - 1); g.lineTo(fx + Math.cos(a + curl * 0.9) * 11, fy - 1 + Math.sin(a + curl * 0.9) * 5); g.stroke(); }
      g.beginPath(); g.moveTo(fx, fy - 1); g.lineTo(fx - 6, fy - 1 + curl * 3); g.stroke();
      g.strokeStyle = col; g.lineWidth = 1.4; for (const a of [-0.25, 0.05, 0.3]) { g.beginPath(); g.moveTo(fx, fy - 1); g.lineTo(fx + Math.cos(a + curl * 0.9) * 10, fy - 1 + Math.sin(a + curl * 0.9) * 4.5); g.stroke(); }
      g.restore();
      // the feathered thigh
      g.save(); g.fillStyle = shade(C.body, near ? 0 : 0.15); g.beginPath(); g.ellipse(lerp(hip[0], knee[0], 0.6), lerp(hip[1], knee[1], 0.6), 10, 9, 0.3, 0, 7); g.fill(); g.restore();
    }
  }
  function paint(g, R) {
    g.save(); g.scale(-1, 1);
    const raw = R.raw, M = R.M, b0 = M([0, -40]);
    legs(g, R);
    // the body (tail flicks with the follow-through)
    g.save(); g.translate(b0[0], b0[1]); g.rotate(raw.pitch); const sq = 1 + 0.08 * raw.fluff + 0.012 * raw.breath; g.scale(sq, sq); g.translate(0, 40);
    g.save(); g.translate(-38, -70); g.rotate(-R.pt.tail); g.translate(38, 70); drawSprite(g, body); g.restore();
    g.restore();
    // neck + head (in front of the body unless tucked away under the wing)
    const drawHeadNeck = () => {
      const nb = M(NECK_B), H = R.H, ha = R.ha;
      const neck = [nb, [lerp(nb[0], H[0], 0.5) + 4, lerp(nb[1], H[1], 0.5)], [H[0] - 4, H[1] + 6]];
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); g.moveTo(neck[0][0], neck[0][1]); g.quadraticCurveTo(neck[1][0], neck[1][1], neck[2][0], neck[2][1]);
      g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 25; g.stroke(); g.strokeStyle = C.neck; g.lineWidth = 22; g.stroke(); g.restore();
      g.save(); g.translate(H[0], H[1]); g.rotate(ha);
      // beak (upper and lower, opening), wattle, head, eye
      const bk = R.raw.beak * 0.5;
      g.fillStyle = BEAK; g.strokeStyle = rgba(INK, 0.75); g.lineWidth = 1.1;
      g.beginPath(); g.moveTo(11, -3); g.quadraticCurveTo(20, -3, 25, 2); g.lineTo(12, 3); g.closePath(); g.fill(); g.stroke();
      g.save(); g.translate(12, 3); g.rotate(bk); g.beginPath(); g.moveTo(0, 0); g.lineTo(11, -0.5); g.quadraticCurveTo(6, 4, 0, 4); g.closePath(); g.fill(); g.stroke(); g.restore();
      const wt = smooth([[8, 6], [14, 7], [15, 15], [11, 20], [7, 15]]); g.fillStyle = COMB; path(g, wt); g.fill(); g.stroke();
      drawSprite(g, head);
      if (R.raw.eye > 0.12 && !(R.raw.happy > 0.5)) buttonEye(g, 3, -3, R.raw.eye, { R: 3.6 });
      else { g.strokeStyle = rgba(INK, 0.85); g.lineWidth = 1.5; g.beginPath(); if (R.raw.happy > 0.5) g.arc(3, -1, 3.6, Math.PI * 1.15, Math.PI * 1.85); else g.arc(3, -5, 3.6, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
      g.restore();
    };
    if (raw.tuck < 0.5) drawHeadNeck();
    else drawHeadNeck();
    // the wing on top (covers the head when it is tucked in)
    g.save(); g.translate(b0[0], b0[1]); g.rotate(raw.pitch); const s2 = 1 + 0.1 * raw.fluff; g.scale(s2, s2); g.translate(0, 40);
    g.translate(-6, -52); g.rotate(-0.15 * raw.tuck - 0.05 * raw.fluff); g.scale(1 + 0.12 * raw.tuck, 1 + 0.18 * raw.tuck); g.translate(6, 52); drawSprite(g, wing); g.restore();
    g.restore();
  }
  function fill(raw, st) { raw.walkPhase = st.walk || 0; raw.wa = clamp(st.walkAmt || 0); return raw; }
  const rigS = (st) => { const p = fill(henSolve(st), st); return rig(p, p, p); };
  const rigAt = (poseFn, t, o = {}) => { const since = o.since ?? -1e9, cache = new Map(), cur = poseFn(t); cache.set(Math.round(t * 960) / 960, cur);
    const raw = fill(henSolve(cur), cur); const one = (K, l) => henSolve({ ...cur, ...filt(poseFn, t, K, since, cache), t }, l); return rig(raw, one(KH, 0.01), one(KT, 0.08)); };
  const toCaller = (p, o = {}) => { const lx = -p[0], ly = p[1]; if (o.x === undefined && o.scale === undefined && o.face === undefined) return { x: lx, y: ly }; const f = o.face ?? 1, k = o.scale ?? 1; return { x: (o.x ?? 0) + f * k * lx, y: (o.y ?? 0) + k * ly }; };
  return {
    STRIDE: STRIDE_H,
    draw(g, st = {}) { paint(g, rigS(st)); },
    drawAt(g, poseFn, t, o = {}) { paint(g, rigAt(poseFn, t, o)); },
    beakAt(poseFn, t, o = {}) { const R = rigAt(poseFn, t, o); return toCaller([R.H[0] + 22, R.H[1] + 2], o); },
    shadow(g, st = {}) { g.save(); g.globalAlpha *= 0.5; pool(g, 0, 2, 62, 8, '#2a1e12', 0.5); g.restore(); },
  };
}

// ---------------------------------------------------------------- chicks
const STRIDE_C = 16;
function chickSolve(st, dl = 0) {
  const t = (st.t || 0) - dl, v = (k) => st[k] ?? DEF[k] ?? 0;
  const P = { hx: 0, hy: 0, ha: 0, beak: 0, eye: v('eye'), by: 0, sq: 0, sleep: clamp(v('sleep')), lift: 0 };
  const life = clamp(v('life'));
  const g1 = glance(t, 0.9, 3, 0.08); P.hx += life * 2 * g1; P.ha += life * 0.2 * glance(t + 0.3, 1.3, 7, 0.08);
  const bl = event(t, 2.7, 0.16, 5); if (bl >= 0) P.eye *= 1 - Math.sin(Math.PI * bl);
  const peep = clamp(v('peep')); if (peep > 0) { const c = Math.max(0, Math.sin(t * TAU * 3)); P.beak = Math.max(P.beak, peep * c); P.ha -= peep * 0.25; P.by -= peep * 3 * c; }
  const peck = v('peck'); if (peck > 0 && peck < 1) { const d = key(peck, [[0, 0], [0.35, 1], [0.5, 0.8], [0.62, 1], [1, 0]]); P.hx += 6 * d; P.hy += 16 * d; P.ha -= 0.8 * d; }
  const hop = v('hop'); if (hop > 0 && hop < 1) { P.sq = key(hop, [[0, 0], [0.2, 0.25], [0.3, -0.15], [0.7, 0], [0.8, 0.2], [1, 0]]); if (hop > 0.28 && hop < 0.78) { const s = (hop - 0.28) / 0.5; P.lift = 22 * 4 * s * (1 - s); } }
  const wa = clamp(v('walkAmt')); if (wa > 0) { const ph = v('walk'); P.by -= wa * 2 * Math.abs(Math.sin(ph * TAU * 2)); P.ha += wa * 0.08 * Math.sin(ph * TAU * 2); }
  if (P.sleep > 0) { P.by += P.sleep * 7; P.eye *= 1 - ease(P.sleep / 0.5); P.hy += P.sleep * 5; P.hx -= P.sleep * 4; P.ha += P.sleep * 0.25; }
  P.breath = Math.sin(t * TAU * 0.6);
  return P;
}
export function makeChick(res = 2, seed = 47) {
  const s = (n) => seed * 100 + n, Y = '#f6d65a', YD = '#d8a830';
  const BODY = ellipse(0, -18, 17, 15, 28);
  const fluffy = (sh, sd) => sprite(bbox(sh), res, (g) => { wash(g, sh, { color: Y, opacity: 0.95, under: PAPER, seed: sd }); glaze(g, sh, -4, -6, 10, 8, '#fff2b0', 0.7); shadeEdge(g, sh, { color: YD, alpha: 0.45, width: 8, dy: -4 }); furEdge(g, sh, { color: Y, count: 70, len: 4, width: 1.4, alpha: 0.9, seed: sd + 1 }); penLine(g, sh, { closed: true, w: 1.2, alpha: 0.55, seed: sd + 2 }); }, { granulate: false });
  const body = fluffy(BODY, s(1)), head = fluffy(ellipse(0, 0, 11, 10.5, 22), s(2));
  const WG = smooth([[-12, -20], [2, -22], [8, -16], [-2, -10], [-12, -12]]);
  const wing = sprite(bbox(WG), res, (g) => { wash(g, WG, { color: '#efc848', opacity: 0.9, under: PAPER, seed: s(3) }); penLine(g, WG, { closed: true, w: 1, alpha: 0.5 }); }, { granulate: false });
  function paint(g, P, raw) {
    g.save(); g.scale(-1, 1);
    const by = P.by - (P.lift || 0), sq = P.sq || 0;
    // legs
    if (P.sleep < 0.7) for (const near of [false, true]) {
      let [dx, lift] = walkFootH((raw.walk || 0) + (near ? 0 : 0.5)); dx *= (raw.walkAmt || 0) * STRIDE_C / STRIDE_H; lift *= (raw.walkAmt || 0) * 0.5;
      const fx = (near ? 3 : -3) + dx, fy = -lift - (P.lift || 0);
      g.save(); g.globalAlpha *= 1 - P.sleep; g.strokeStyle = '#d89a3a'; g.lineWidth = 1.8; g.lineCap = 'round'; g.beginPath(); g.moveTo(fx - 1, by - 6); g.lineTo(fx, fy); g.stroke();
      for (const a of [-0.2, 0.15, 0.45]) { g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + Math.cos(a) * 5, fy + Math.sin(a) * 1.5); g.stroke(); } g.restore();
    }
    g.save(); g.translate(0, by); g.scale(1 + sq * 0.2 + 0.01 * P.breath, 1 - sq * 0.25 + 0.015 * P.breath); drawSprite(g, body); drawSprite(g, wing); g.restore();
    const H = [12 + P.hx, -36 + P.hy + by];
    g.save(); g.translate(H[0], H[1]); g.rotate(P.ha);
    g.fillStyle = '#f0a040'; g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 0.9;
    g.beginPath(); g.moveTo(9, -2); g.lineTo(15, 0.5 - P.beak * 1.5); g.lineTo(9.5, 1); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(9.5, 1.5); g.lineTo(14, 1.5 + P.beak * 3.5); g.lineTo(9, 3); g.closePath(); g.fill(); g.stroke();
    drawSprite(g, head);
    if (P.eye > 0.12) buttonEye(g, 4, -2, P.eye, { R: 2.6 }); else { g.strokeStyle = rgba(INK, 0.85); g.lineWidth = 1.2; g.beginPath(); g.arc(4, -4, 2.6, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
    pool(g, 6, 4, 3, 2, '#f09080', 0.5);
    g.restore();
    g.restore();
  }
  const fill = (P, st) => P;
  return {
    STRIDE: STRIDE_C,
    draw(g, st = {}) { paint(g, chickSolve(st), st); },
    drawAt(g, poseFn, t, o = {}) { const since = o.since ?? -1e9, cache = new Map(), cur = poseFn(t); const P = chickSolve({ ...cur, ...filt(poseFn, t, KH, since, cache), t }, 0.01); paint(g, P, cur); },
    beakAt(poseFn, t, o = {}) { const P = chickSolve(poseFn(t)); const x = -(12 + P.hx + 14), y = -36 + P.hy + P.by - (P.lift || 0); if (o.x === undefined) return { x, y }; const f = o.face ?? 1, k = o.scale ?? 1; return { x: o.x + f * k * x, y: (o.y ?? 0) + k * y }; },
    shadow(g, st = {}) { g.save(); g.globalAlpha *= 0.5; pool(g, 0, 1, 20, 4, '#2a1e12', 0.5); g.restore(); },
  };
}
