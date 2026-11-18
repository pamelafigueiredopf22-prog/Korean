// crow3 test reel: every action of the rig in sequence on plain paper, with a label per action.
// Each segment returns the root position and a pose function; the crow is drawn with drawAt (follow-through).
import { paper, sprite, bbox, wash, ellipse, smooth, penLine, shadeEdge, blooms, soften, strokes, pool, clamp, lerp, ease, span } from '../../engine/watercolor.js';
import { makeCrow3, STRIDE, hopX, takeoffLift, landDrop } from '../../engine/characters/crow3.js';
export let crow;
let PAPER, JUG_BACK, JUG_FRONT, JUG_BODY, NEST_BACK, NEST_FRONT;
const GROUND = 880, S = 1.75;

// ---- props, painted once, in crow units (the crow's root at (0, 0))
// a jug seen from the side, its mouth to the left of the crow standing on its back rim
const MOUTH = { x: -104, y: 0, rx: 118, ry: 20, irx: 92, iry: 14 };
function makeJug() {
  const body = smooth([[-230, 6], [-250, 120], [-262, 300], [-200, 460], [-104, 500], [-8, 460], [54, 300], [42, 120], [22, 6]]);
  const back = sprite(bbox(body), 1.6, (g) => {
    wash(g, body, { under: true, color: '#c9825a', opacity: 0.9, seed: 3 });
    blooms(g, body, ['#b86e4a', '#d89a70', '#a8603c'], { n: 6, seed: 4, alpha: 0.35 });
    shadeEdge(g, body, { color: '#7a3e24', alpha: 0.45, width: 40, dx: 18, dy: 0 });
    soften(g, 1.5);
    penLine(g, body, { closed: true, color: '#4a2a1a', w: 2.4, alpha: 0.7, seed: 5 });
    const rim = ellipse(MOUTH.x, MOUTH.y, MOUTH.rx, MOUTH.ry, 40);
    wash(g, rim, { under: true, color: '#d4936a', opacity: 0.95, seed: 6 });
    const hole = ellipse(MOUTH.x, MOUTH.y, MOUTH.irx, MOUTH.iry, 40);
    wash(g, hole, { under: true, color: '#3a2218', opacity: 0.97, seed: 7 });
    penLine(g, rim, { closed: true, color: '#4a2a1a', w: 2, alpha: 0.7, seed: 8 });
  });
  // the front half of the lip, drawn over the crow's beak when it dips inside
  const lip = ellipse(MOUTH.x, MOUTH.y, MOUTH.rx, MOUTH.ry, 40).filter(([, y]) => y >= -0.5);
  const lipIn = ellipse(MOUTH.x, MOUTH.y, MOUTH.irx, MOUTH.iry, 40).filter(([, y]) => y >= -0.5).reverse();
  const front = smooth(lip.concat(lipIn), true, 2);
  const fr = sprite(bbox(front.concat([[MOUTH.x - MOUTH.rx, 60], [MOUTH.x + MOUTH.rx, 60]])), 1.6, (g) => {
    wash(g, front, { under: true, color: '#d4936a', opacity: 0.95, seed: 9, bleed: 0.01 });
    penLine(g, lip, { color: '#4a2a1a', w: 2, alpha: 0.7, seed: 10 });
    penLine(g, lipIn.slice().reverse(), { color: '#4a2a1a', w: 1.5, alpha: 0.5, seed: 11 });
    // the outside of the jug's neck below the lip
    const neck = [[MOUTH.x - MOUTH.rx + 4, 4], [MOUTH.x - MOUTH.rx + 10, 40], [MOUTH.x + MOUTH.rx - 10, 40], [MOUTH.x + MOUTH.rx - 4, 4]];
    wash(g, neck.concat(lip.slice().reverse()), { color: '#c9825a', opacity: 0.6, seed: 12 });
  });
  return { back, front: fr };
}
function makeNest() {
  const back = smooth([[-150, -10], [-120, -40], [0, -52], [120, -40], [160, -10], [0, -20]]);
  const front = smooth([[-170, -40], [-120, 30], [0, 46], [130, 30], [180, -40], [120, -22], [0, -16], [-120, -22]]);
  const twigs = (g, shape, sd, n) => strokes(g, shape, { color: '#5a3c22', count: n, len: 40, width: 2.2, alpha: 0.7, seed: sd, dir: () => 0.1, curve: 0.5 });
  const b = sprite(bbox(back), 1.6, (g) => { wash(g, back, { under: true, color: '#8a6440', opacity: 0.9, seed: 21 }); twigs(g, back, 22, 120); penLine(g, back, { closed: true, color: '#3a2618', w: 1.6, alpha: 0.6, seed: 23 }); });
  const f = sprite(bbox(front), 1.6, (g) => { wash(g, front, { under: true, color: '#9a7048', opacity: 0.95, seed: 24 }); blooms(g, front, ['#7a5434', '#b08458'], { n: 5, seed: 25, alpha: 0.4 }); twigs(g, front, 26, 260); strokes(g, front, { color: '#c8a070', count: 80, len: 30, width: 1.4, alpha: 0.6, seed: 27, dir: () => -0.1, curve: 0.5 }); penLine(g, front, { closed: true, color: '#3a2618', w: 1.8, alpha: 0.7, seed: 28 }); });
  return { back: b, front: f };
}

// ---- the reel: [start, end, label, fn(t, t0) -> { x, y, s, st, props }]
const talk = (t) => clamp(0.55 * Math.max(0, Math.sin(t * 13) * 0.7 + Math.sin(t * 5.3) * 0.5) + 0.1 * Math.sin(t * 29));
export const SEGS = [];
const seg = (len, label, fn) => { const t0 = SEGS.length ? SEGS[SEGS.length - 1][1] : 0; SEGS.push([t0, t0 + len, label, fn]); };

seg(5, 'Idle, then talking', (t, t0) => {
  const k = t - t0;
  return { x: 1180, y: GROUND, st: { t, beak: k > 2.4 && k < 4.6 ? talk(k) * span(k, 2.4, 2.6) * (1 - span(k, 4.4, 4.6)) : 0 } };
});
seg(4.6, 'Walking (feet planted, head bob)', (t, t0) => {
  // distance eases in and out; walk phase = distance / STRIDE; 4 full strides
  const k = t - t0, D = 4 * STRIDE, u = clamp((k - 0.3) / 3.9);
  const dist = D * smoothDist(u);
  return { x: 1400 - dist * S, y: GROUND, st: { t, walk: dist / STRIDE, walkAmt: span(k, 0.1, 0.6) * (1 - span(k, 4.0, 4.5)) } };
});
// distance profile: accelerate, cruise, decelerate (C1-continuous)
function smoothDist(u) {
  const a = 0.2, vmax = 1 / (1 - a); // ramps of length a at both ends
  if (u <= 0) return 0; if (u >= 1) return 1;
  if (u < a) return vmax * u * u / (2 * a);
  if (u > 1 - a) return 1 - vmax * (1 - u) * (1 - u) / (2 * a);
  return vmax * (a / 2 + (u - a));
}
seg(3.4, 'Hop, hop', (t, t0) => {
  const k = t - t0, d1 = 60, d2 = 60;
  const h1 = clamp((k - 0.2) / 1.2), h2 = clamp((k - 1.6) / 1.2);
  const hop = k < 1.5 ? h1 : h2;
  return { x: 1000 - (hopX(h1) * d1 + hopX(h2) * d2) * S, y: GROUND, st: { t, hop: hop >= 1 ? 0 : hop, hopHeight: 46 } };
});
// pick up a pebble from the ground ahead
const PEB = [-128, -4];
function peckPose(t, t0) {
  const k = t - t0;
  const down = span(k, 0.8, 1.35) * (1 - span(k, 2.0, 2.6));
  const grab = 1.75;
  const beak = span(k, 0.95, 1.3) * 0.75 * (1 - span(k, grab - 0.12, grab));
  return { t, peck: down, aimX: PEB[0], aimY: PEB[1] + 4, beak, pebble: k >= grab, life: 1, happy: 0 };
}
seg(4, 'Peck: pick up a pebble', (t, t0) => {
  const st = peckPose(t, t0);
  return { x: 900, y: GROUND, st, fn: (tt) => peckPose(tt, t0), loosePebble: t - t0 < 1.75 ? PEB : null };
});
// drop it into the jug from the rim
function dropPose(t, t0) {
  const k = t - t0;
  const lean = span(k, 0.6, 1.3) * (1 - span(k, 2.6, 3.3));
  const open = span(k, 1.6, 1.75) * (1 - span(k, 2.2, 2.5));
  return { t, aim: lean, aimX: -108, aimY: -4, aimTilt: 1.0, beak: open * 0.7, pebble: k < 1.65 };
}
seg(4, 'Lean over the rim, drop the pebble', (t, t0) => ({ x: 1250, y: 600, jug: true, st: dropPose(t, t0), fn: (tt) => dropPose(tt, t0), drop: t0 + 1.65 }));
function peerPose(t, t0) {
  const k = t - t0;
  const peer = span(k, 0.3, 0.9) * (1 - span(k, 1.6, 2.0));
  const reach = span(k, 1.6, 2.3) * (1 - span(k, 4.0, 4.6));
  return { t, peer, reach, aimX: -112, aimY: 34, strain: span(k, 2.5, 2.8) * (1 - span(k, 3.7, 4.0)) * 0.7, eye: 1 };
}
seg(5, 'Peer in, push the beak in as far as it goes', (t, t0) => ({ x: 1250, y: 600, jug: true, st: peerPose(t, t0), fn: (tt) => peerPose(tt, t0) }));
function pushPose(t, t0) {
  const k = t - t0;
  const push = span(k, 0.5, 1.1) * (1 - span(k, 3.4, 3.9));
  const strain = span(k, 1.0, 1.3) * (1 - span(k, 3.3, 3.6));
  const slump = span(k, 3.6, 4.2);
  return { t, push, strain, weary: slump, beak: slump * 0.1 };
}
seg(5.2, 'Push (too heavy!), tired slump', (t, t0) => ({ x: 1350, y: GROUND, side: true, st: pushPose(t, t0), fn: (tt) => pushPose(tt, t0) }));
function drinkPose(t, t0) {
  const k = t - t0;
  const on = span(k, 0.4, 0.9) * (1 - span(k, 4.4, 4.9));
  return { t, drink: on, drinkPhase: Math.max(0, k - 0.6) * 0.42, aimX: -92, aimY: 16 };
}
seg(5.2, 'Drink: dip, tip the head back to swallow', (t, t0) => ({ x: 1250, y: 600, jug: true, water: true, st: drinkPose(t, t0), fn: (tt) => drinkPose(tt, t0) }));
seg(4.6, 'Thinking... "idea!"', (t, t0) => {
  const k = t - t0;
  const think = span(k, 0.3, 1.0) * (1 - span(k, 3.0, 3.25));
  const idea = clamp((k - 3.05) / 1.3);
  return { x: 1000, y: GROUND, st: { t, think, idea: idea >= 1 ? 0 : idea, beak: k > 1.4 && k < 2.6 ? talk(k) * 0.6 : 0 } };
});
seg(4, 'Weary and thirsty', (t, t0) => {
  const k = t - t0;
  return { x: 1000, y: GROUND, st: { t, weary: span(k, 0.3, 1.6) * (1 - span(k, 3.4, 3.9)), beak: k > 2 && k < 3.2 ? talk(k) * 0.4 : 0 } };
});
seg(3.8, 'Happy', (t, t0) => {
  const k = t - t0;
  return { x: 1000, y: GROUND, st: { t, happy: span(k, 0.3, 0.8) * (1 - span(k, 3.2, 3.7)) } };
});
// take off, fly across, glide, land
const FLY = { to0: 0.4, toLen: 1.2, landStart: 5.1, landLen: 1.7, x0: 1560, x1: 480, H: 300 };
function flyPose(t, t0) {
  const k = t - t0, F = FLY;
  const tu = clamp((k - F.to0) / F.toLen), lu = clamp((k - F.landStart) / F.landLen);
  const launch = F.to0 + 0.42 * F.toLen, touch = F.landStart + 0.55 * F.landLen;
  // root path: holds on the ground before launch and after touchdown
  const p = clamp((k - launch) / (touch - launch));
  const xs = lerp(F.x0, F.x1, key2(p));
  let y;
  if (k < F.to0 + F.toLen) y = GROUND - takeoffLift(tu) * 120 * S;
  else if (k < F.landStart) { const q = (k - F.to0 - F.toLen) / (F.landStart - F.to0 - F.toLen); y = GROUND - S * (120 + (F.H - 120) * Math.sin(Math.PI * 0.5 * Math.min(1, q * 1.6)) - 60 * Math.max(0, q - 0.6)); }
  else y = GROUND - landDrop(lu) * S * (F.H - 120 * 0.5 - 30);
  const glide = span(k, 3.2, 3.6) * (1 - span(k, 4.6, 5.1));
  const beat = Math.max(0, k - F.to0 - 0.42 * F.toLen) * 2.9;
  const st = { t, beat, glide, pitch: 0.06 * (1 - glide) };
  if (tu > 0 && tu < 1) st.takeoff = tu;
  else if (k >= F.to0 + F.toLen && lu <= 0) st.fly = 1;
  if (lu > 0 && lu < 1) st.land = lu;
  return { x: xs, y, st };
}
// smooth 0..1 travel with a gentle start and a braking end
function key2(p) { p = clamp(p); return 0.6 * p + 1.8 * p * p - 1.4 * p * p * p; }
seg(8.4, 'Take-off, flapping, glide, landing', (t, t0) => { const r = flyPose(t, t0); return { ...r, s: 1.25, fn: (tt) => flyPose(tt, t0).st }; });
function sleepPose(t, t0) {
  const k = t - t0;
  return { t, sleep: span(k, 0.6, 3.2), legs: false };
}
seg(6.2, 'Asleep in the nest', (t, t0) => ({ x: 980, y: 760, nest: true, st: sleepPose(t, t0), fn: (tt) => sleepPose(tt, t0) }));
// (segments are laid end to end)
export const DURATION = SEGS[SEGS.length - 1][1];

export const REEL = {
  async setup() {
    PAPER = paper(); crow = makeCrow3(2.0);
    const j = makeJug(); JUG_BACK = j.back; JUG_FRONT = j.front;
    const n = makeNest(); NEST_BACK = n.back; NEST_FRONT = n.front;
  },
  frame(g, t) {
    g.drawImage(PAPER, 0, 0);
    const sg = SEGS.find(([a, b]) => t >= a && t < b) || SEGS[SEGS.length - 1];
    const [t0, t1, label, fn] = sg;
    const r = fn(t, t0), s = r.s || S;
    const poseFn = r.fn || ((tt) => fn(tt, t0).st);
    // ground line
    if (!r.jug && !r.nest) { g.save(); g.strokeStyle = 'rgba(90,70,50,0.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(80, GROUND + 2); g.lineTo(1840, GROUND + 2); g.stroke(); g.restore(); }
    g.save(); g.translate(r.x, r.y); g.scale(s, s);
    if (r.jug) { drawSprite2(g, JUG_BACK); if (r.water) { g.save(); g.fillStyle = 'rgba(120,160,190,0.75)'; g.beginPath(); g.ellipse(MOUTH.x, 16, MOUTH.irx * 0.92, MOUTH.iry * 0.8, 0, 0, 7); g.fill(); g.restore(); } }
    if (r.side) { g.save(); g.translate(-86, -270); g.scale(0.56, 0.56); drawSprite2(g, JUG_BACK); g.restore(); }
    if (r.nest) drawSprite2(g, NEST_BACK);
    if (!r.jug && !r.nest) crow.shadow(g, r.st, (GROUND - r.y) / s);
    if (r.loosePebble) crow.drawPebble(g, r.loosePebble[0], r.loosePebble[1]);
    crow.drawAt(g, poseFn, t, { since: t0 });
    if (r.drop && t > r.drop) { // the released pebble falls into the jug
      const p = crow.beakTipAt(poseFn, r.drop, { since: t0 }), dt = t - r.drop;
      const y = p.gripY + 0.5 * 900 * dt * dt;
      if (y < 40) crow.drawPebble(g, p.gripX, y, dt * 3);
    }
    if (r.jug) { // the jug's wall in front of anything that dips inside its mouth
      g.save(); g.beginPath();
      for (let i = 0; i <= 32; i++) { const a = Math.PI * i / 32; g.lineTo(MOUTH.x + Math.cos(a) * MOUTH.irx, MOUTH.y + Math.sin(a) * MOUTH.iry); }
      g.lineTo(MOUTH.x - 400, 700); g.lineTo(MOUTH.x + 400, 700); g.closePath();
      g.moveTo(0, 0); g.clip(); drawSprite2(g, JUG_BACK); g.restore();
      drawSprite2(g, JUG_FRONT);
    }
    if (r.nest) drawSprite2(g, NEST_FRONT);
    g.restore();
    // label
    const a = span(t, t0, t0 + 0.4) * (1 - span(t, t1 - 0.3, t1));
    g.save(); g.globalAlpha = a; g.fillStyle = '#4a3a2c'; g.font = 'italic 54px Fell, serif'; g.fillText(label, 90, 110);
    g.globalAlpha = a * 0.6; g.font = 'italic 30px Fell, serif'; g.fillText(`crow3 test - ${(t - t0).toFixed(1)} s`, 92, 158); g.restore();
  }
};
function drawSprite2(g, s) { g.drawImage(s.c, s.x0, s.y0, s.w, s.h); }
