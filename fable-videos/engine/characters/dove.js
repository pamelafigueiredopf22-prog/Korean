// A gentle, plump dove, perched and facing left (built on the crow's skeleton). Feet on the branch at y = 0.
// Pale dove-grey with a blush breast, a lilac-and-green sheen on her neck, two dark bars on each wing,
// button eye, small pink-grey beak, pink feet. She can hold a leaf in her beak.
import { wash, ink, strokes, pool, ellipse, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, pencil, rgba, shade, tint, clamp, furEdge, blooms, soften, penLine, hatch, looseWash, path } from '../watercolor.js';
import { buttonEye } from './kit.js';

const C = { body: '#d4d2da', belly: '#ece6e6', blush: '#e8c6c8', wing: '#c4c2cc', bar: '#5e5866', dark: '#8a8696', ink: '#3a3440',
  beak: '#b8909a', cere: '#f2ece8', leg: '#d8787e', leaf: '#7f9a4a', paper: '#f4ead6' };
const SHEEN = ['#a890c8', '#8fb8a0', '#b8a8d4'];
const SOFT = ['#dcd6e0', '#c8c6d2', '#e8e0e4'];

const BODY = smooth([[-74, -74], [-56, -106], [-8, -116], [48, -100], [90, -70], [124, -46], [74, -22], [12, -10], [-46, -24]]);
const BREAST = smooth([[-74, -74], [-60, -100], [-30, -104], [-24, -60], [-40, -26], [-62, -40]]);
const HEAD = smooth([[-88, -126], [-83, -146], [-64, -154], [-44, -146], [-38, -122], [-46, -100], [-60, -96], [-78, -106]]);
const NECK = smooth([[-74, -112], [-46, -108], [-36, -116], [-34, -96], [-54, -90], [-72, -96]]);
const WING = smooth([[-30, -98], [30, -102], [84, -76], [140, -40], [94, -42], [30, -48], [-14, -60]]);
const TAIL = smooth([[86, -54], [140, -50], [172, -36], [166, -24], [130, -26], [90, -32]]);
const TAIL_BAND = smooth([[150, -48], [172, -36], [166, -24], [148, -26]]);
const BEAK_UP = smooth([[-84, -131], [-96, -130], [-105, -125], [-95, -122], [-84, -122]]);
const BEAK_LO = smooth([[-84, -121], [-94, -120], [-101, -120], [-93, -116], [-84, -114]]);
const BEAK_PIVOT = [-84, -122];
export const DOVE_EYE = [-66, -133];
const ARM = smooth([[-6, 8], [-14, -30], [-16, -66], [-8, -88], [14, -94], [38, -84], [46, -52], [32, -12], [12, 8]]);
const HAND = smooth([[-12, 6], [-16, -30], [-10, -56], [2, -66], [18, -62], [30, -40], [32, -12], [22, 6]]);
const HFING = [[-8, -50, -0.34, 54], [2, -58, -0.16, 70], [12, -60, 0.02, 76], [22, -56, 0.2, 68], [30, -44, 0.4, 54]];
const FWING = smooth([[-14, 6], [-22, -60], [-20, -112], [-10, -146], [8, -156], [26, -152], [40, -136], [48, -96], [50, -50], [40, 6]]);
const FINGERS = [[-8, -144, -0.34, 64], [4, -152, -0.16, 80], [16, -154, 0.02, 86], [28, -150, 0.2, 80], [38, -140, 0.38, 66]];
// an oak leaf held by the stalk in the beak, hanging down-left
const LEAF = smooth([[-104, -120], [-112, -110], [-124, -106], [-128, -94], [-140, -88], [-142, -74], [-152, -66], [-148, -54], [-136, -56], [-128, -66], [-118, -70], [-112, -84], [-104, -92], [-102, -106]]);

export function makeDove(res = 1, seed = 12) {
  const s = (n) => seed * 100 + n;
  const soft = (g, shape, sd, dir, n = 1) => {
    strokes(g, shape, { color: C.dark, count: Math.round(70 * n), len: 9, width: 0.9, alpha: 0.25, seed: s(sd), dir, curve: 0.25 });
    strokes(g, shape, { color: '#ffffff', count: Math.round(40 * n), len: 8, width: 1, alpha: 0.35, seed: s(sd + 1), dir, curve: 0.25 });
  };
  const tail = sprite(bbox(TAIL), res, (g) => {
    wash(g, TAIL, { under: C.paper, color: C.wing, opacity: 0.95, seed: s(1) });
    wash(g, TAIL_BAND, { color: C.bar, opacity: 0.6, seed: s(2) });
    soften(g, 1.2 * res);
    for (let i = 0; i < 4; i++) ink(g, [[96, -44 + i * 3], [160 - i * 4, -38 + i * 4]], { color: C.dark, alpha: 0.45, width: 0.9, seed: s(3 + i) });
    penLine(g, TAIL, { closed: true, color: C.ink, w: 1.6, alpha: 0.75, seed: s(6) });
  }, { seed: s(7) });
  const body = sprite(bbox(BODY.concat(HEAD)), res, (g) => {
    wash(g, BODY, { under: C.paper, color: C.body, opacity: 0.92, seed: s(10) });
    blooms(g, BODY, SOFT, { n: 6, seed: s(11), alpha: 0.35 });
    looseWash(g, BREAST, C.blush, { opacity: 0.7, seed: s(12), shift: 1, reserves: 1 });
    glaze(g, BODY, -20, -40, 60, 20, C.belly, 0.7);
    shadeEdge(g, BODY, { color: '#8e8aa0', alpha: 0.35, width: 18, dy: -8, dx: 4 });
    soft(g, BODY, 13, () => 0.2);
    wash(g, HEAD, { under: C.paper, color: C.body, opacity: 0.93, seed: s(14) });
    glaze(g, HEAD, -52, -104, 22, 12, SHEEN[1], 0.45); glaze(g, HEAD, -60, -100, 18, 9, SHEEN[0], 0.4); // a soft shimmer on the neck
    glaze(g, HEAD, -64, -146, 16, 8, '#ffffff', 0.6);
    shadeEdge(g, HEAD, { color: '#8e8aa0', alpha: 0.3, width: 10, dy: -5, dx: 3 });
    pool(g, -70, -116, 9, 5, '#e8a0a8', 0.45); // a rosy cheek
    soften(g, 1.4 * res);
    furEdge(g, BODY, { color: C.body, count: 70, len: 6, width: 2, alpha: 0.8, seed: s(17), lean: 0.6, inner: 0.4 });
    hatch(g, BODY, { color: '#7a7488', count: 140, len: 8, width: 0.7, alpha: 0.35, seed: s(18), dir: () => 0.25, curve: 0.4,
      density: (x, y) => 0.25 + 0.75 * Math.min(1, Math.max(0, (y + 90) / 80)) });
    penLine(g, BODY.slice(10, 72), { color: C.ink, w: 2, alpha: 0.8, seed: s(19), weight: (t) => 0.3 + 0.9 * Math.sin(t * Math.PI) });
    penLine(g, HEAD, { closed: true, color: C.ink, w: 1.8, alpha: 0.75, seed: s(20), weight: (t) => 0.3 + 0.8 * Math.max(0, Math.sin(t * Math.PI * 2 + 1)) });
  }, { seed: s(21) });
  const wing = sprite(bbox(WING), res, (g) => {
    wash(g, WING, { under: C.paper, color: C.wing, opacity: 0.95, seed: s(22) });
    blooms(g, WING, SOFT, { n: 5, seed: s(23), alpha: 0.4 });
    shadeEdge(g, WING, { color: '#8e8aa0', alpha: 0.4, width: 12, dy: 6 });
    // the two dark bars of a dove's wing, and scalloped feather rows
    for (const [x0, y0] of [[20, -78], [46, -66]]) for (let k = 0; k < 3; k++) { const e = ellipse(x0 + k * 16, y0 + k * 3, 7, 4, 10, 0.3); wash(g, e, { color: C.bar, opacity: 0.75, seed: s(24) + x0 + k, layers: 8 }); }
    soften(g, 1.2 * res);
    furEdge(g, WING, { color: C.wing, count: 14, len: 18, width: 5, alpha: 0.9, seed: s(25), lean: 0.9, inner: 0.25, skip: (x) => x < 60 });
    for (let i = 0; i < 6; i++) penLine(g, [[0 + i * 16, -86 + i * 5], [40 + i * 14, -66 + i * 3], [80 + i * 10, -48]], { color: C.ink, w: 1.1, alpha: 0.4, seed: s(26 + i) });
    penLine(g, WING, { closed: true, color: C.ink, w: 1.8, alpha: 0.75, seed: s(33), weight: (t) => 0.3 + 0.9 * Math.max(0, Math.sin(t * Math.PI * 2)) });
  }, { seed: s(34) });
  const fwing = sprite(bbox(FWING.concat([[-30, -260], [100, -260]])), res, (g) => {
    for (const [x, y, a, L] of FINGERS) {
      const ca = Math.sin(a), tipx = x + ca * L, tipy = y - Math.cos(a) * L;
      const f = smooth([[x - 6, y + 24], [x - 7 + ca * L * 0.5, y - L * 0.5], [tipx - 3, tipy + 8], [tipx, tipy], [tipx + 4, tipy + 9], [x + 8 + ca * L * 0.5, y - L * 0.45], [x + 7, y + 24]]);
      wash(g, f, { under: C.paper, color: shade(C.wing, 0.12), opacity: 0.95, seed: s(40) + x, bleed: 0.015, layers: 12 });
      glaze(g, f, tipx, tipy + 14, 8, 16, C.bar, 0.5);
      penLine(g, f, { closed: true, color: C.ink, w: 1.2, alpha: 0.7, seed: s(41) + x });
    }
    wash(g, FWING, { under: C.paper, color: C.wing, opacity: 0.95, seed: s(42), bleed: 0.02 });
    blooms(g, FWING, SOFT, { n: 5, seed: s(43), alpha: 0.4 });
    for (let i = 0; i < 6; i++) { const y = -40 - i * 20; penLine(g, [[-16, y + 10], [20, y - 4], [58, y + 4]], { color: C.ink, w: 1, alpha: 0.4, seed: s(44 + i) }); }
    for (const [x0, y0] of [[-6, -30], [10, -52]]) for (let k = 0; k < 3; k++) { const e = ellipse(x0 + k * 16, y0, 7, 4, 10); wash(g, e, { color: C.bar, opacity: 0.7, seed: s(52) + x0 + k, layers: 8 }); }
    shadeEdge(g, FWING, { color: '#8e8aa0', alpha: 0.35, width: 14, dx: -6 });
    soften(g, 0.9 * res);
    penLine(g, FWING, { closed: true, color: C.ink, w: 1.8, alpha: 0.8, seed: s(58), weight: (t) => 0.3 + 0.8 * Math.max(0, Math.sin(t * Math.PI * 2)) });
  }, { seed: s(59) });
  const wingPart = (shape, fingers, sd) => sprite(bbox(shape.concat([[-50, -150], [90, -150]])), res, (g) => {
    for (const [x, y, a, L] of fingers) {
      const ca = Math.sin(a), tipx = x + ca * L, tipy = y - Math.cos(a) * L;
      const f = smooth([[x - 6, y + 20], [x - 7 + ca * L * 0.5, y - L * 0.5], [tipx - 3, tipy + 8], [tipx, tipy], [tipx + 4, tipy + 9], [x + 8 + ca * L * 0.5, y - L * 0.45], [x + 7, y + 20]]);
      wash(g, f, { under: C.paper, color: shade(C.wing, 0.12), opacity: 0.96, seed: s(sd) + x, bleed: 0.015, layers: 12 });
      glaze(g, f, tipx, tipy + 12, 7, 14, C.bar, 0.45);
      penLine(g, f, { closed: true, color: C.ink, w: 1.1, alpha: 0.7, seed: s(sd + 1) + x });
    }
    wash(g, shape, { under: C.paper, color: C.wing, opacity: 0.96, seed: s(sd + 2), bleed: 0.02 });
    blooms(g, shape, SOFT, { n: 4, seed: s(sd + 3), alpha: 0.4 });
    if (!fingers.length) for (let i = 0; i < 6; i++) { const y = -4 - i * 14, x = 30 + Math.sin(i * 0.5) * 12 - i * 1.5, e = ellipse(x, y, 13, 8, 12, 0.5); wash(g, e, { under: C.paper, color: shade(C.wing, 0.06), opacity: 0.95, seed: s(sd + 4) + i, layers: 8 }); penLine(g, e.slice(2, 10), { color: C.ink, w: 0.9, alpha: 0.5, seed: s(sd + 5) + i }); }
    else penLine(g, [[-6, -10], [10, -30], [22, -48]], { color: C.ink, w: 0.8, alpha: 0.35, seed: s(sd + 4) });
    if (!fingers.length) for (const [x0, y0] of [[-4, -30], [8, -52]]) for (let k = 0; k < 3; k++) wash(g, ellipse(x0 + k * 14, y0, 6, 3.5, 10), { color: C.bar, opacity: 0.7, seed: s(sd + 9) + x0 + k, layers: 8 });
    shadeEdge(g, shape, { color: '#8e8aa0', alpha: 0.35, width: 12, dx: -5 });
    soften(g, 0.9 * res);
    penLine(g, shape, { closed: true, color: C.ink, w: 1.6, alpha: 0.8, seed: s(sd + 8), weight: (t) => 0.3 + 0.8 * Math.max(0, Math.sin(t * Math.PI * 2)) });
  }, { seed: s(sd + 12) });
  const arm = wingPart(ARM, [], 150), hand = wingPart(HAND, HFING, 170);
  const beakUp = sprite(bbox(BEAK_UP), res, (g) => { wash(g, BEAK_UP, { under: true, color: C.beak, opacity: 0.97, seed: s(60) }); pool(g, -90, -129, 4, 3, C.cere, 0.9); pencil(g, BEAK_UP, { closed: true, color: C.ink, seed: s(61), alpha: 0.55, width: 1 }); }, { seed: s(62) });
  const beakLo = sprite(bbox(BEAK_LO), res, (g) => { wash(g, BEAK_LO, { under: true, color: shade(C.beak, 0.08), opacity: 0.97, seed: s(63) }); pencil(g, BEAK_LO, { closed: true, color: C.ink, seed: s(64), alpha: 0.55, width: 1 }); }, { seed: s(65) });
  const leaf = sprite(bbox(LEAF), res, (g) => {
    wash(g, LEAF, { under: C.paper, color: C.leaf, opacity: 0.95, seed: s(70) });
    glaze(g, LEAF, -126, -86, 10, 14, '#b8c878', 0.6);
    ink(g, [[-104, -116], [-122, -94], [-146, -62]], { color: '#4a5a2a', width: 1.1, alpha: 0.7 });
    penLine(g, LEAF, { closed: true, color: C.ink, w: 1.3, alpha: 0.7, seed: s(71) });
  }, { seed: s(72) });

  function legs(g) {
    g.save(); g.strokeStyle = C.leg; g.lineCap = 'round'; g.lineWidth = 4;
    for (const x of [-12, 10]) {
      g.beginPath(); g.moveTo(x, -16); g.lineTo(x - 2, -2); g.stroke();
      g.lineWidth = 3; for (const dx of [-11, -4, 5]) { g.beginPath(); g.moveTo(x - 2, -2); g.quadraticCurveTo(x - 2 + dx * 0.6, 2, x - 2 + dx, 4); g.stroke(); }
      g.lineWidth = 4;
    }
    g.restore();
  }
  function head(g, st, beakOpen) {
    g.save(); g.translate(-60, -124); g.rotate(st.headTilt || 0); g.translate(60, 124);
    g.save(); g.translate(BEAK_PIVOT[0], BEAK_PIVOT[1]); g.rotate(beakOpen * 0.3); g.translate(-BEAK_PIVOT[0], -BEAK_PIVOT[1]); drawSprite(g, beakUp); g.restore();
    g.save(); g.translate(BEAK_PIVOT[0], BEAK_PIVOT[1]); g.rotate(-beakOpen * 0.4); g.translate(-BEAK_PIVOT[0], -BEAK_PIVOT[1]); drawSprite(g, beakLo); g.restore();
    if (st.leaf) drawSprite(g, leaf);
    buttonEye(g, DOVE_EYE[0], DOVE_EYE[1], st.eye ?? 1, { R: 7, happy: st.happy });
    g.restore();
  }
  // perched. st: beak (0..1 open: talking or cooing), coo (0..1 the chest puffs), leaf, headTilt, eye, happy,
  //     wingOpen, flap, t, bob (head bob while walking/cooing), breath
  function draw(g, st = {}) {
    const t = st.t || 0, coo = st.coo || 0, br = st.breath || 0;
    g.save();
    if (!st.flying) legs(g);
    g.save(); g.translate(90, -40); g.rotate(-(st.tailLift || 0) * 0.3); g.translate(-90, 40); drawSprite(g, tail); g.restore();
    const flap = st.flap ? Math.sin(t * 9) * st.flap : 0;
    if (st.flap) { g.save(); g.translate(0, -90); g.rotate(-0.4 - flap * 0.9); g.scale(1, -1); g.translate(0, 90); g.globalAlpha *= 0.85; drawSprite(g, wing); g.restore(); }
    g.save(); g.translate(-30, -40); g.scale(1 + coo * 0.06 + br * 0.01, 1 + coo * 0.1 + br * 0.015); g.translate(30, 40);
    drawSprite(g, body);
    g.restore();
    g.save(); g.translate(-14, -84); g.rotate((st.wingOpen || 0) * -0.8 + (st.flap ? 0.3 + flap * 0.9 : 0)); g.translate(14, 84); drawSprite(g, wing); g.restore();
    g.save(); g.translate((st.bob || 0) * -6, -coo * 6 + (st.bob || 0) * 2); head(g, st, clamp(st.beak || 0)); g.restore();
    g.restore();
  }
  // flying (facing left): st.beat (wingbeat phase, cycles), st.glide 0..1, st.pitch, st.legs 0..1, st.flare 0..1, st.leaf
  // flying (facing left). st.beat: wingbeat phase (cycles); st.glide 0..1; st.pitch; st.legs 0..1; st.leaf.
  // Each wing is an arm and a hand: the arm swings about the shoulder on a smooth sine, the hand follows a
  // moment later, so the wing bends on the upstroke and spreads flat on the downstroke.
  function drawFly(g, st = {}) {
    const ph = (st.beat || 0) * Math.PI * 2, glide = st.glide || 0;
    const c = Math.cos(ph), sn = Math.sin(ph);
    // angle of the arm from straight up (+ = swung back/down over the body side); hand lags behind
    const armA = (1 - glide) * (0.85 + 1.15 * c) + glide * 0.5;              // 2.0: down past the belly, -0.3: high over the back
    const handA = armA + (1 - glide) * (0.6 * Math.max(0, sn) - 0.12 * Math.max(0, -sn)) + glide * 0.2; // folds back on the upstroke
    const k = 0.75 + 0.25 * Math.abs(c); // foreshortening: the wing looks shorter when it points at us
    const lift = (1 - glide) * -c * 6;   // the body rises a little on each downstroke
    g.save();
    g.translate(0, lift);
    g.translate(20, -60); g.rotate(st.pitch || 0); g.translate(-20, 60);
    const wingAt = (sx, sy, far) => {
      g.save(); g.translate(sx, sy);
      if (far) g.filter = 'brightness(0.82)';
      g.rotate(armA * (far ? 0.85 : 1)); g.scale(1, k); drawSprite(g, arm);
      g.translate(14, -86); g.rotate((handA - armA) * (far ? 0.85 : 1)); drawSprite(g, hand);
      g.restore();
    };
    wingAt(26, -92, true);
    g.save(); g.translate(90, -40); g.rotate(-0.12 - glide * 0.1 + sn * 0.04); g.translate(-90, 40); drawSprite(g, tail); g.restore();
    if (st.legs) { g.save(); g.globalAlpha *= st.legs; g.strokeStyle = C.leg; g.lineCap = 'round'; g.lineWidth = 4;
      for (const x of [-6, 14]) { g.beginPath(); g.moveTo(x, -24); g.lineTo(x - 8, -4); g.stroke(); } g.restore(); }
    g.save(); g.translate(20, -40); g.scale(1.04, 0.94); g.translate(-20, 40); drawSprite(g, body); g.restore();
    head(g, st, clamp(st.beak || 0));
    wingAt(14, -86, false);
    g.restore();
  }
  // asleep in the nest: head drawn down into the shoulders, eyes closed
  function drawSleep(g, st = {}) {
    const br = st.breath || 0;
    g.save();
    g.save(); g.translate(90, -40); g.rotate(-0.1); g.translate(-90, 40); drawSprite(g, tail); g.restore();
    g.save(); g.translate(-30, -40); g.scale(1.05 + br * 0.012, 1.03 + br * 0.02); g.translate(30, 40); drawSprite(g, body); g.restore(); // fluffed up for the night
    g.save(); g.translate(-14, -84); g.rotate(0.05); g.translate(14, 84); drawSprite(g, wing); g.restore();
    head(g, { ...st, eye: 0, headTilt: 0 }, 0); // eyes closed; the face stays on the head (the head is part of the body painting)
    g.restore();
  }
  return { draw, drawFly, drawSleep };
}
