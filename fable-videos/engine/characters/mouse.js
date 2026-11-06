// A tiny mouse with a rust-red scarf, facing right.
// Local units: body about 100 long, ground at y = 0.
import { wash, ink, strokes, pool, ellipse, smooth, ribbon, bbox, sprite, drawSprite, rgba, shade, tint, clamp } from '../watercolor.js';

const C = { fur: '#a99a8c', furDark: '#7d6d62', belly: '#efe0cb', pink: '#e2a39b', ear: '#d98f88', scarf: '#b4503a', ink: '#45302a' };

const TAIL = ribbon([[-40, -14], [-80, -4], [-112, -22], [-142, -16], [-160, -26]], 6, 2);
const TAIL_FWD = ribbon([[-38, -10], [-36, 3], [-6, 7], [40, 7], [90, 6], [132, 10]], 6, 3);
const BODY = smooth([[-46, -6], [-50, -34], [-28, -60], [8, -64], [34, -48], [40, -16], [26, 0], [-20, 2]]);
const BELLY = ellipse(8, -20, 24, 15, 18);
const HEAD = smooth([[8, -86], [34, -94], [58, -82], [80, -64], [72, -54], [44, -48], [14, -54]]);
const EAR_B = ellipse(14, -98, 19, 21, 20), EAR_F = ellipse(38, -103, 22, 24, 20), EAR_IN = ellipse(38, -101, 13, 15, 16);
const SCARF = ribbon([[6, -60], [24, -50], [42, -52]], 13, 12);
const SCARF_TAIL = ribbon([[10, -56], [-4, -46], [-20, -36], [-30, -30]], 10, 7);
const FOOT = ellipse(0, 0, 11, 5, 14);
const ARM = ellipse(0, 0, 6, 9, 14);
export const MOUSE_EYE = [54, -74];

export function makeMouse(res = 1, seed = 2) {
  const s = (n) => seed * 100 + n;
  const tail = sprite(bbox(TAIL), res, (g) => {
    wash(g, TAIL, { under: true, color: C.pink, opacity: 0.85, seed: s(1), bleed: 0.02 });
    ink(g, smooth([[-40, -18], [-80, -8], [-112, -26], [-160, -28]], false), { alpha: 0.4, seed: s(2), width: 1 });
  }, { seed: s(3) });
  const tailFwd = sprite(bbox(TAIL_FWD), res, (g) => {
    wash(g, TAIL_FWD, { under: true, color: C.pink, opacity: 0.85, seed: s(29), bleed: 0.02 });
    ink(g, smooth([[-40, -12], [-36, 6], [40, 11], [132, 13]], false), { alpha: 0.4, seed: s(30), width: 1 });
  }, { seed: s(31) });
  const body = sprite(bbox(BODY), res, (g) => {
    wash(g, BODY, { under: true, color: C.fur, opacity: 0.92, seed: s(4) });
    wash(g, ellipse(-18, -44, 26, 14, 16), { color: C.furDark, opacity: 0.3, seed: s(5), edge: 0 });
    wash(g, BELLY, { color: C.belly, opacity: 0.85, seed: s(6) });
    strokes(g, BODY, { color: C.furDark, count: 60, len: 6, alpha: 0.3, seed: s(7), dir: () => Math.PI + 0.3 });
    ink(g, BODY, { alpha: 0.55, seed: s(8), gaps: 1, closed: true, width: 1.3 });
  }, { seed: s(9) });
  const head = sprite(bbox(HEAD.concat(EAR_B, EAR_F)), res, (g) => {
    wash(g, EAR_B, { under: true, color: shade(C.fur, 0.1), opacity: 0.9, seed: s(10) });
    wash(g, ellipse(14, -97, 11, 13, 14), { color: C.ear, opacity: 0.5, seed: s(11), edge: 0 });
    wash(g, HEAD, { under: true, color: tint(C.fur, 0.1), opacity: 0.94, seed: s(12) });
    wash(g, EAR_F, { under: true, color: tint(C.fur, 0.1), opacity: 0.94, seed: s(13) });
    wash(g, EAR_IN, { color: C.ear, opacity: 0.8, seed: s(14) });
    pool(g, 56, -58, 9, 6, C.pink, 0.55);
    strokes(g, HEAD, { color: C.furDark, count: 30, len: 5, alpha: 0.25, seed: s(15), dir: () => Math.PI });
    ink(g, HEAD, { alpha: 0.55, seed: s(16), gaps: 1, closed: true, width: 1.3 });
    ink(g, EAR_F, { alpha: 0.45, seed: s(17), gaps: 1, closed: true, width: 1.1 });
    g.fillStyle = '#c96f6c'; g.beginPath(); g.arc(80, -63, 4.2, 0, 7); g.fill();
    for (const [dy, dx] of [[-6, 26], [0, 28], [6, 24]]) ink(g, [[74, -60], [74 + dx * 0.5, -60 + dy * 0.6], [74 + dx, -60 + dy]], { alpha: 0.4, width: 0.8, seed: s(18 + dy), taper: false });
  }, { seed: s(19) });
  const scarf = sprite(bbox(SCARF), res, (g) => {
    wash(g, SCARF, { under: true, color: C.scarf, opacity: 0.92, seed: s(20) });
    strokes(g, SCARF, { color: '#f3d2b8', count: 8, len: 8, alpha: 0.5, seed: s(21), dir: () => 1.4, width: 1 });
  }, { seed: s(22) });
  const scarfTail = sprite(bbox(SCARF_TAIL), res, (g) => {
    wash(g, SCARF_TAIL, { under: true, color: shade(C.scarf, 0.1), opacity: 0.92, seed: s(23) });
  }, { seed: s(24) });
  const foot = sprite(bbox(FOOT), res, (g) => wash(g, FOOT, { under: true, color: C.pink, opacity: 0.9, seed: s(25) }), { seed: s(26) });
  const arm = sprite(bbox(ARM), res, (g) => wash(g, ARM, { under: true, color: tint(C.fur, 0.05), opacity: 0.95, seed: s(27) }), { seed: s(28) });

  // st: run (phase in cycles, or null when standing), blink (0..1), talk (0..1),
  //     look (head tilt rad), hop (px up), flutter, joy
  function draw(g, st = {}) {
    const run = st.run, p = run != null ? run * Math.PI * 2 : 0;
    const bob = run != null ? Math.abs(Math.sin(p)) * 7 : 0;
    const talk = clamp(st.talk || 0);
    const up = (st.hop || 0) + bob + talk * 3;
    pool(g, 0, 1, 60, 6, '#4a3020', 0.25);
    // feet
    const fx = run != null ? [Math.sin(p) * 14, -Math.sin(p) * 14] : [0, 0];
    const fy = run != null ? [Math.max(0, Math.cos(p)) * -6, Math.max(0, -Math.cos(p)) * -6] : [0, 0];
    for (const [i, x] of [[0, -24], [1, 22]]) {
      g.save(); g.translate(x + fx[i], -3 + fy[i] - (st.hop || 0) * 0.6); drawSprite(g, foot); g.restore();
    }
    g.save();
    g.translate(0, -up);
    if (st.tailForward) { g.save(); g.translate(0, up); drawSprite(g, tailFwd); g.restore(); }
    else { g.save(); g.translate(-40, -14); g.rotate(Math.sin(p * 0.5 + (st.t || 0) * 2) * 0.12); g.translate(40, 14); drawSprite(g, tail); g.restore(); }
    g.save(); g.translate(10, -56); g.rotate((st.flutter || 0) * 0.35 + Math.sin((st.t || 0) * 9) * 0.06 * (st.flutter || 0)); g.translate(-10, 56); drawSprite(g, scarfTail); g.restore();
    drawSprite(g, body);
    g.save(); g.translate(30, -30); g.rotate(run != null ? Math.sin(p) * 0.5 : -(st.joy || 0) * 1.6 + talk * 0.2); drawSprite(g, arm); g.restore();
    g.save(); // head
    g.translate(24, -58); g.rotate((st.look || 0) + talk * 0.05); g.translate(-24, 58);
    drawSprite(g, head);
    const [ex, ey] = MOUSE_EYE, bl = st.blink || 0;
    if (bl > 0.6 || st.happy) {
      g.strokeStyle = rgba(C.ink, 0.9); g.lineWidth = 1.8; g.lineCap = 'round';
      g.beginPath(); g.arc(ex, ey + (st.happy ? 3 : -2), 4.5, st.happy ? Math.PI * 1.1 : 0.2, st.happy ? Math.PI * 1.9 : Math.PI - 0.2); g.stroke();
    } else {
      g.fillStyle = '#21140f'; g.beginPath(); g.ellipse(ex, ey, 4.4, 5.2 * (1 - bl), 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - 1.4, ey - 1.8, 1.5, 0, 7); g.fill();
    }
    g.strokeStyle = rgba(C.ink, 0.7); g.lineWidth = 1.3;
    g.beginPath();
    if (talk > 0.08) { g.fillStyle = '#7b3832'; g.ellipse(70, -54, 3.5, 1 + talk * 4, 0, 0, 7); g.fill(); }
    else { g.arc(68, -57, 4, 0.3, Math.PI - 0.6); g.stroke(); }
    g.restore();
    drawSprite(g, scarf);
    g.restore();
  }
  return { draw };
}
