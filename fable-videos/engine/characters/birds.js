// The wise old owl and little songbirds (the race's audience), line-and-wash.
import { wash, pool, ellipse, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, furEdge, rgba, shade, tint, clamp,
  penLine, hatch, looseWash, blooms, soften } from '../watercolor.js';
import { buttonEye, PAPER, INK } from './kit.js';

const part = (res, shape, color, sd, o = {}) => sprite(bbox(shape.concat(o.extra || [])), res, (g) => {
  wash(g, shape, { color: PAPER, opacity: 1, under: PAPER, seed: sd, edge: 0 });
  looseWash(g, shape, color, { opacity: o.op ?? 0.88, seed: sd + 1, shift: 2, reserves: o.reserves ?? 1 });
  if (o.blooms) blooms(g, shape, o.blooms, { n: 5, seed: sd + 2, alpha: 0.3 });
  if (o.paint) o.paint(g);
  shadeEdge(g, shape, { color: o.shadow || '#3a2a1a', alpha: 0.32, width: o.shadeW || 12, dy: -5 });
  soften(g, 0.9 * res);
  if (o.hatch) hatch(g, shape, { color: o.hatchColor || '#3a2a1a', count: o.hatch, len: o.hlen || 6, width: 0.7, alpha: 0.45, seed: sd + 3, dir: o.dir || (() => Math.PI / 2) });
  if (o.fur) furEdge(g, shape, { color, count: o.fur, len: 6, width: 1.6, alpha: 0.75, seed: sd + 4 });
  penLine(g, shape, { closed: true, color: INK, w: 1.8, alpha: 0.78, seed: sd + 5, weight: (t) => 0.3 + 0.8 * Math.max(0, Math.sin(t * Math.PI * 2)) });
}, { seed: sd + 6, grain: 0.12 });

// ---------------- the owl (front-facing, sitting), feet at y = 0
const O_BODY = smooth([[-50, -10], [-62, -70], [-54, -130], [-30, -160], [0, -166], [30, -160], [54, -130], [62, -70], [50, -10], [0, 0]]);
const O_BELLY = smooth([[-34, -20], [-40, -80], [-26, -118], [0, -124], [26, -118], [40, -80], [34, -20], [0, -12]]);
const O_HEAD = smooth([[-58, -150], [-64, -200], [-50, -236], [-28, -224], [0, -232], [28, -224], [50, -236], [64, -200], [58, -150], [0, -136]]);
const O_DISC_L = ellipse(-24, -186, 26, 28, 26), O_DISC_R = ellipse(24, -186, 26, 28, 26);
const O_WING = smooth([[0, 0], [-14, 30], [-12, 80], [4, 110], [18, 80], [20, 30]]); // from the shoulder, hanging down

export function makeOwl(res = 1, seed = 8) {
  const s = (n) => seed * 100 + n;
  const body = part(res, O_BODY, '#8a6a46', s(1), { blooms: ['#9a7a52', '#7a5a3a', '#a88a60'], hatch: 0, fur: 40, paint: (g) => {
    looseWash(g, O_BELLY, '#e6d6b4', { opacity: 0.9, seed: s(2), shift: 1, reserves: 0 });
    for (let r = 0; r < 6; r++) for (let k = 0; k < 5; k++) { const x = -26 + k * 13 + (r % 2) * 6, y = -100 + r * 15; penLine(g, [[x - 4, y], [x, y + 4], [x + 4, y]], { color: '#6a4a2a', w: 1.2, alpha: 0.6 }); }
  } });
  const head = part(res, O_HEAD, '#8a6a46', s(10), { fur: 30, paint: (g) => {
    for (const d of [O_DISC_L, O_DISC_R]) { looseWash(g, d, '#e8dcc0', { opacity: 0.95, seed: s(11), shift: 1, reserves: 0 }); }
    glaze(g, O_HEAD, 0, -228, 40, 10, '#6a4a2a', 0.4);
  }, after: (g) => {
    g.fillStyle = '#d8a040'; g.beginPath(); g.moveTo(-5, -176); g.lineTo(5, -176); g.lineTo(0, -162); g.closePath(); g.fill();
    penLine(g, [[-5, -176], [0, -162], [5, -176]], { w: 1.2, alpha: 0.7 });
  } });
  const wing = part(res, O_WING, '#6e5032', s(20), { hatch: 30, hlen: 8, dir: () => Math.PI / 2 });
  // st: wing (0..1 lift the right wing), blink, happy, hop
  function draw(g, st = {}) {
    g.save(); g.translate(0, -(st.hop || 0));
    pool(g, 0, (st.hop || 0) + 2, 60, 8, '#3a2a1a', 0.25);
    drawSprite(g, body);
    g.save(); g.translate(-54, -120); g.rotate(0.15); drawSprite(g, wing); g.restore();
    g.save(); g.translate(54, -120); g.rotate(-0.15 - (st.wing || 0) * 2.4); g.scale(-1, 1); drawSprite(g, wing); g.restore();
    g.save(); g.rotate(st.headTilt || 0); drawSprite(g, head);
    const op = 1 - (st.blink || 0);
    for (const x of [-24, 24]) {
      g.fillStyle = '#e8b040'; g.beginPath(); g.arc(x, -188, 11 * Math.max(0.15, op), 0, 7); g.fill();
      buttonEye(g, x, -188, op, { R: 7, happy: st.happy });
    }
    g.restore();
    g.strokeStyle = '#c89040'; g.lineWidth = 3; g.lineCap = 'round';
    for (const x of [-18, 18]) for (const dx of [-6, 0, 6]) { g.beginPath(); g.moveTo(x, -4); g.lineTo(x + dx, 4); g.stroke(); }
    g.restore();
  }
  return { draw };
}

// ---------------- a little songbird (profile, facing right), feet at y = 0
const B_BODY = smooth([[-30, -20], [-26, -44], [-4, -58], [22, -56], [36, -40], [32, -18], [10, -8], [-18, -10]]);
const B_BREAST = smooth([[10, -50], [32, -40], [30, -18], [10, -10], [4, -30]]);
const B_WING = smooth([[-18, -46], [10, -48], [20, -30], [-6, -24], [-30, -30]]);
const B_TAIL = smooth([[-26, -26], [-54, -36], [-58, -28], [-30, -16]]);
export function makeSongbird(res = 1, seed = 9, o = {}) {
  const s = (n) => seed * 100 + n;
  const body = part(res, B_BODY, o.color || '#8a7052', s(1), { extra: B_TAIL, paint: (g) => {
    looseWash(g, B_TAIL, shade(o.color || '#8a7052', 0.2), { opacity: 0.9, seed: s(2), shift: 1, reserves: 0 });
    looseWash(g, B_BREAST, o.breast || '#d86a3e', { opacity: 0.9, seed: s(3), shift: 1, reserves: 0 });
  } });
  const wing = part(res, B_WING, shade(o.color || '#8a7052', 0.15), s(10), { hatch: 10, dir: () => 0 });
  function draw(g, st = {}) {
    const flap = st.flap ? Math.sin((st.t || 0) * 24) : 0;
    g.save(); g.translate(0, -(st.hop || 0));
    g.strokeStyle = '#5a4030'; g.lineWidth = 2; for (const x of [-4, 6]) { g.beginPath(); g.moveTo(x, -10); g.lineTo(x - 2, 0); g.stroke(); }
    drawSprite(g, body);
    g.save(); g.translate(-6, -46); g.rotate(-flap * 0.9 * (st.flap || 0)); g.translate(6, 46); drawSprite(g, wing); g.restore();
    g.fillStyle = '#e0a040'; g.beginPath(); g.moveTo(34, -46); g.lineTo(46, -42); g.lineTo(34, -38); g.closePath(); g.fill();
    if (st.sing) { g.fillStyle = '#5a2a20'; g.beginPath(); g.moveTo(34, -42); g.lineTo(44, -40); g.lineTo(34, -36); g.fill(); }
    buttonEye(g, 22, -46, 1 - (st.blink || 0), { R: 4, happy: st.happy });
    g.restore();
  }
  return { draw };
}
