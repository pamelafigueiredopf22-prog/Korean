// A shiny, slightly proud crow, perched and facing left. Local units: feet on the branch at y = 0.
import { wash, ink, strokes, pool, ellipse, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, pencil, rgba, shade, tint, clamp, furEdge, blooms, soften, sketch, penLine, hatch, looseWash } from '../watercolor.js';

const SHEEN = ['#3b4a7a', '#4a3d6e', '#2f5a66', '#1c1f2b', '#55608a'];

const C = { body: '#12141c', sheen: '#5d6d96', belly: '#232838', beak: '#4b4a52', beakLight: '#8a8790', ink: '#1e1d26', leg: '#3b3a42', cheese: '#f2c14e', cheeseDark: '#d99a2b' };

const BODY = smooth([[-62, -72], [-34, -104], [18, -110], [62, -90], [96, -58], [128, -40], [70, -24], [10, -16], [-36, -30]]);
const HEAD = smooth([[-90, -112], [-84, -142], [-54, -156], [-22, -140], [-14, -106], [-40, -86], [-76, -90]]);
const WING = smooth([[-30, -96], [30, -100], [84, -72], [146, -34], [94, -40], [30, -46], [-14, -58]]);
const TAIL = smooth([[86, -50], [150, -44], [186, -26], [176, -16], [140, -22], [92, -30]]);
const BEAK_UP = smooth([[-86, -128], [-114, -126], [-142, -115], [-114, -110], [-86, -110]]);
const BEAK_LO = smooth([[-86, -110], [-110, -108], [-134, -106], [-108, -100], [-86, -98]]);
const BEAK_PIVOT = [-86, -110];
const CHEESE = [[-136, -118], [-114, -90], [-106, -122]];
export const CROW_EYE = [-58, -126];

export function makeCrow(res = 1, seed = 4) {
  const s = (n) => seed * 100 + n;
  const feathered = (g, shape, sd, dir, n = 1) => {
    strokes(g, shape, { color: '#151722', count: Math.round(120 * n), len: 10, width: 1, alpha: 0.4, seed: s(sd), dir, curve: 0.2 });
    strokes(g, shape, { color: C.sheen, count: Math.round(60 * n), len: 9, width: 1, alpha: 0.4, seed: s(sd + 1), dir, curve: 0.2 });
  };
  const tail = sprite(bbox(TAIL), res, (g) => {
    wash(g, TAIL, { under: true, color: shade(C.body, 0.1), opacity: 0.95, seed: s(1) });
    blooms(g, TAIL, SHEEN, { n: 4, seed: s(8), alpha: 0.45 });
    soften(g, 1.5 * res);
    furEdge(g, TAIL, { color: C.body, count: 24, len: 12, width: 4, alpha: 0.9, seed: s(9), lean: 0.4, skip: (x) => x < 140 });
    for (let i = 0; i < 4; i++) ink(g, [[96, -40 + i * 2], [170 - i * 4, -32 + i * 5]], { color: C.sheen, alpha: 0.5, width: 1.1, seed: s(2 + i) });
    penLine(g, TAIL, { closed: true, color: '#0a0a0f', w: 1.8, alpha: 0.8, seed: s(6) });
  }, { seed: s(7) });
  const body = sprite(bbox(BODY.concat(HEAD)), res, (g) => {
    wash(g, BODY, { under: true, color: C.body, opacity: 0.95, seed: s(10) });
    blooms(g, BODY, SHEEN, { n: 8, seed: s(19), alpha: 0.45 });
    glaze(g, BODY, -10, -40, 50, 22, C.belly, 0.6);
    shadeEdge(g, BODY, { color: C.sheen, alpha: 0.45, width: 16, dy: 7 }); // sheen along the back
    feathered(g, BODY, 11, () => 0.2);
    wash(g, HEAD, { under: true, color: C.body, opacity: 0.96, seed: s(13) });
    blooms(g, HEAD, SHEEN, { n: 4, seed: s(15), alpha: 0.4 });
    shadeEdge(g, HEAD, { color: C.sheen, alpha: 0.5, width: 14, dy: 6, dx: 3 });
    glaze(g, HEAD, -66, -128, 18, 14, '#4a5470', 0.6); // soft eye patch
    feathered(g, HEAD, 14, (x, y) => Math.atan2(y + 116, x + 56), 0.5);
    pool(g, -64, -104, 13, 8, '#d08a96', 0.45);
    soften(g, 1.8 * res);
    // soft, ruffled feather edges, combed back toward the tail
    furEdge(g, BODY, { color: C.body, count: 110, len: 7, width: 2.4, alpha: 0.9, seed: s(43), lean: 0.6, inner: 0.4 });
    furEdge(g, HEAD, { color: C.body, count: 60, len: 5, width: 2, alpha: 0.9, seed: s(44), lean: 0.5, inner: 0.4, skip: (x) => x < -88 });
    furEdge(g, BODY, { color: C.sheen, count: 30, len: 5, width: 1, alpha: 0.35, seed: s(45), lean: 0.6 });
    hatch(g, BODY, { color: '#0c0d12', count: 260, len: 9, width: 0.8, alpha: 0.55, seed: s(50), dir: () => 0.25, curve: 0.35,
      density: (x, y) => 0.3 + 0.7 * Math.min(1, Math.max(0, (y + 90) / 80)) });
    hatch(g, BODY, { color: '#8a98c0', count: 70, len: 8, width: 0.7, alpha: 0.4, seed: s(51), dir: () => 0.25, density: (x, y) => (y < -70 ? 1 : 0.1) });
    hatch(g, HEAD, { color: '#0c0d12', count: 90, len: 6, width: 0.7, alpha: 0.5, seed: s(52), dir: (x, y) => Math.atan2(y + 116, x + 56) + 1.4 });
    penLine(g, BODY.slice(10, 72), { color: '#0a0a0f', w: 2.2, alpha: 0.85, seed: s(16), weight: (t) => 0.3 + 0.9 * Math.sin(t * Math.PI) });
    penLine(g, HEAD, { closed: true, color: '#0a0a0f', w: 2, alpha: 0.8, seed: s(17), weight: (t) => 0.3 + 0.8 * Math.max(0, Math.sin(t * Math.PI * 2 + 1)) });
  }, { seed: s(18) });
  const wing = sprite(bbox(WING), res, (g) => {
    wash(g, WING, { under: true, color: shade(C.body, 0.05), opacity: 0.96, seed: s(20) });
    blooms(g, WING, SHEEN, { n: 6, seed: s(46), alpha: 0.5 });
    shadeEdge(g, WING, { color: C.sheen, alpha: 0.5, width: 12, dy: 6 });
    for (let i = 0; i < 6; i++) ink(g, [[10 + i * 18, -50 - i * 3], [70 + i * 14, -40 - i * 4]], { color: C.sheen, alpha: 0.45, width: 1.1, seed: s(21 + i) });
    soften(g, 1.5 * res);
    // long flight feathers fanning out at the wing tip
    furEdge(g, WING, { color: shade(C.body, 0.05), count: 16, len: 22, width: 6, alpha: 0.95, seed: s(47), lean: 0.9, inner: 0.25, skip: (x, y) => x < 60 });
    furEdge(g, WING, { color: C.sheen, count: 14, len: 14, width: 1, alpha: 0.4, seed: s(48), lean: 0.9, skip: (x) => x < 40 });
    for (let i = 0; i < 7; i++) penLine(g, [[0 + i * 16, -86 + i * 5], [40 + i * 14, -66 + i * 3], [80 + i * 10, -46]], { color: '#0a0a0f', w: 1.3, alpha: 0.55, seed: s(53 + i) });
    penLine(g, WING, { closed: true, color: '#0a0a0f', w: 2, alpha: 0.8, seed: s(28), weight: (t) => 0.3 + 0.9 * Math.max(0, Math.sin(t * Math.PI * 2)) });
  }, { seed: s(29) });
  const beakUp = sprite(bbox(BEAK_UP), res, (g) => { wash(g, BEAK_UP, { under: true, color: C.beak, opacity: 0.97, seed: s(30) }); shadeEdge(g, BEAK_UP, { color: C.beakLight, alpha: 0.6, width: 5, dy: 3 }); pencil(g, BEAK_UP, { closed: true, color: C.ink, seed: s(31), alpha: 0.55, width: 1.1 }); }, { seed: s(32) });
  const beakLo = sprite(bbox(BEAK_LO), res, (g) => { wash(g, BEAK_LO, { under: true, color: C.beakLight, opacity: 0.97, seed: s(33) }); glaze(g, BEAK_LO, -100, -104, 14, 5, '#5a3238', 0.5); pencil(g, BEAK_LO, { closed: true, color: C.ink, seed: s(34), alpha: 0.55, width: 1.1 }); }, { seed: s(35) });
  const cheese = sprite(bbox(CHEESE), res, (g) => {
    wash(g, CHEESE, { under: true, color: C.cheese, opacity: 0.97, seed: s(40), bleed: 0.01, layers: 12 });
    shadeEdge(g, CHEESE, { color: C.cheeseDark, alpha: 0.6, width: 6, dy: -2 });
    g.fillStyle = rgba(C.cheeseDark, 0.8);
    for (const [x, y, r] of [[-118, -112, 3], [-112, -102, 2.2], [-110, -116, 1.8]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    pencil(g, CHEESE, { closed: true, color: '#8a5a1a', seed: s(41), alpha: 0.6, width: 1.1 });
  }, { seed: s(42) });

  function legs(g) {
    g.save(); g.strokeStyle = C.leg; g.lineCap = 'round'; g.lineWidth = 4;
    for (const x of [-10, 14]) {
      g.beginPath(); g.moveTo(x, -20); g.lineTo(x - 2, -2); g.stroke();
      g.lineWidth = 3; for (const dx of [-12, -4, 6]) { g.beginPath(); g.moveTo(x - 2, -2); g.quadraticCurveTo(x - 2 + dx * 0.6, 2, x - 2 + dx, 4); g.stroke(); }
      g.lineWidth = 4;
    }
    g.restore();
  }
  function eye(g, open, happy) {
    const [x, y] = CROW_EYE;
    g.save(); g.lineCap = 'round';
    if (open < 0.15) {
      g.strokeStyle = 'rgba(240,235,225,0.85)'; g.lineWidth = 2.6; g.beginPath();
      if (happy) g.arc(x, y + 4, 8, Math.PI * 1.15, Math.PI * 1.85); else g.arc(x, y - 4, 8, Math.PI * 0.15, Math.PI * 0.85);
      g.stroke();
    } else {
      g.fillStyle = '#e4ddcf'; g.beginPath(); g.ellipse(x, y, 10, 10 * open + 1, 0, 0, 7); g.fill();
      g.fillStyle = '#120f14'; g.beginPath(); g.ellipse(x - 1, y, 7.6, Math.min(7.6, 8 * open), 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.arc(x - 3.5, y - 3 * open, 2.8, 0, 7); g.fill();
      g.beginPath(); g.arc(x + 2.5, y + 3 * open, 1.1, 0, 7); g.fill();
    }
    g.restore();
  }
  // st: beak (0..1 open), cheese (bool), fluff (0..1), headTilt, eye (0..1), happy, flap (0..1 strength),
  //     t (time), wingOpen (0..1), tuck (0..1: head under wing, asleep)
  function draw(g, st = {}) {
    const fl = st.fluff || 0, t = st.t || 0;
    g.save();
    if (!st.flying) legs(g);
    g.save(); g.translate(90, -40); g.rotate(-(st.tailLift || 0) * 0.3); g.translate(-90, 40); drawSprite(g, tail); g.restore();
    // far wing when flying
    const flap = st.flap ? Math.sin(t * 9) * st.flap : 0;
    if (st.flap) { g.save(); g.translate(0, -90); g.rotate(-0.4 - flap * 0.9); g.scale(1, -1); g.translate(0, 90); g.globalAlpha *= 0.85; drawSprite(g, wing); g.restore(); }
    g.save(); g.translate(20, -40); g.scale(1 + fl * 0.08, 1 + fl * 0.12); g.translate(-20, 40);
    drawSprite(g, body);
    g.restore();
    g.save(); g.translate(-14, -84); g.rotate((st.wingOpen || 0) * -0.8 + (st.flap ? 0.3 + flap * 0.9 : 0) - fl * 0.05); g.translate(14, 84); drawSprite(g, wing); g.restore();
    if (!st.tuck) {
      // head group: beak, cheese and eye tilt together
      g.save(); g.translate(-56, -116); g.rotate(st.headTilt || 0); g.translate(56, 116);
      const open = clamp(st.beak || 0);
      g.save(); g.translate(BEAK_PIVOT[0], BEAK_PIVOT[1]); g.rotate(open * 0.32); g.translate(-BEAK_PIVOT[0], -BEAK_PIVOT[1]); drawSprite(g, beakUp); g.restore();
      g.save(); g.translate(BEAK_PIVOT[0], BEAK_PIVOT[1]); g.rotate(-open * 0.42); g.translate(-BEAK_PIVOT[0], -BEAK_PIVOT[1]); drawSprite(g, beakLo); g.restore();
      if (st.cheese) drawSprite(g, cheese);
      eye(g, st.eye ?? 1, st.happy);
      g.restore();
    }
    g.restore();
  }
  // the cheese on its own (falling, in the fox's mouth, on a windowsill); centred near (0,0)
  function drawCheese(g) { g.save(); g.translate(118, 110); drawSprite(g, cheese); g.restore(); }
  return { draw, drawCheese };
}
