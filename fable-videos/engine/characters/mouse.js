// A tiny mouse with a rust-red scarf, facing right.
// Local units: body about 100 long, ground at y = 0.
import { wash, ink, strokes, pool, ellipse, smooth, ribbon, bbox, sprite, drawSprite, rgba, shade, tint, clamp, shadeEdge, glaze, pencil } from '../watercolor.js';

const C = { fur: '#ab9b8d', furDark: '#6f5f55', furLight: '#d8cbbd', belly: '#f1e3cf', pink: '#e2a39b', ear: '#e09790', scarf: '#b4503a', ink: '#45302a' };

const TAIL = ribbon([[-40, -14], [-80, -4], [-112, -22], [-142, -16], [-160, -26]], 6, 2);
const TAIL_FWD = ribbon([[-38, -10], [-36, 4], [-6, 8], [40, 8], [100, 7], [168, 9]], 9, 5);
const BODY = smooth([[-44, -4], [-54, -30], [-40, -56], [-10, -68], [18, -64], [36, -46], [42, -18], [28, 0], [-14, 3]]);
const BELLY = smooth([[6, -42], [26, -36], [32, -14], [18, -2], [0, -6], [-4, -24]]);
const HEAD = smooth([[6, -84], [30, -95], [56, -86], [78, -68], [80, -60], [70, -53], [44, -46], [16, -50], [4, -64]]);
const EAR_B = ellipse(14, -98, 19, 21, 22), EAR_F = ellipse(38, -103, 23, 25, 22), EAR_IN = ellipse(39, -101, 14, 16, 18);
const SCARF = ribbon([[6, -60], [24, -50], [42, -52]], 13, 12);
const SCARF_TAIL = ribbon([[10, -56], [-4, -46], [-20, -36], [-30, -30]], 10, 7);
const FOOT = ellipse(0, 0, 11, 5, 16);
const ARM = ellipse(0, 0, 6, 9, 16);
export const MOUSE_EYE = [54, -74];

export function makeMouse(res = 1, seed = 2) {
  const s = (n) => seed * 100 + n;
  const tailSprite = (shape, line, sd) => sprite(bbox(shape), res, (g) => {
    wash(g, shape, { under: true, color: '#d98b84', opacity: 0.92, seed: s(sd), bleed: 0.02 });
    shadeEdge(g, shape, { color: '#a0645e', alpha: 0.35, width: 3, dy: -1.2 });
    pencil(g, smooth(line, false), { seed: s(sd + 1), width: 1, alpha: 0.45 });
  }, { seed: s(sd + 2) });
  const tail = tailSprite(TAIL, [[-40, -18], [-80, -8], [-112, -26], [-160, -28]], 1);
  const tailFwd = tailSprite(TAIL_FWD, [[-42, -12], [-38, 8], [40, 12], [168, 12]], 29);
  const body = sprite(bbox(BODY), res, (g) => {
    wash(g, BODY, { under: true, color: C.fur, opacity: 0.93, seed: s(4) });
    shadeEdge(g, BODY, { color: C.furDark, alpha: 0.45, width: 14, dx: 3, dy: -6 });
    shadeEdge(g, BODY, { color: C.furLight, alpha: 0.6, width: 12, dx: 2, dy: 6 });
    wash(g, BELLY, { color: C.belly, opacity: 0.85, seed: s(6), edge: 0.1 });
    glaze(g, BELLY, 16, -30, 14, 10, '#ffffff', 0.4);
    strokes(g, BODY, { color: C.furDark, count: 110, len: 5, width: 0.8, alpha: 0.3, seed: s(7), dir: () => Math.PI + 0.35, curve: 0.3 });
    strokes(g, BODY, { color: '#f4ece2', count: 40, len: 5, width: 0.8, alpha: 0.35, seed: s(8), dir: () => Math.PI + 0.35, curve: 0.3 });
    pencil(g, BODY, { closed: true, seed: s(9), width: 1.2 });
  }, { seed: s(5) });
  const head = sprite(bbox(HEAD.concat(EAR_B, EAR_F)), res, (g) => {
    wash(g, EAR_B, { under: true, color: shade(C.fur, 0.15), opacity: 0.92, seed: s(10) });
    wash(g, ellipse(14, -97, 11, 13, 16), { color: shade(C.ear, 0.1), opacity: 0.6, seed: s(11), edge: 0 });
    wash(g, HEAD, { under: true, color: tint(C.fur, 0.12), opacity: 0.95, seed: s(12) });
    shadeEdge(g, HEAD, { color: C.furDark, alpha: 0.35, width: 10, dy: -4 });
    glaze(g, HEAD, 36, -82, 18, 10, C.furLight, 0.6);
    wash(g, EAR_F, { under: true, color: tint(C.fur, 0.12), opacity: 0.95, seed: s(13) });
    wash(g, EAR_IN, { color: C.ear, opacity: 0.85, seed: s(14), edge: 0.15 });
    shadeEdge(g, EAR_IN, { color: '#a5544e', alpha: 0.35, width: 6, dx: -2, dy: 3 });
    glaze(g, EAR_IN, 42, -106, 6, 5, '#ffe9e2', 0.6);
    pool(g, 57, -58, 10, 6, C.pink, 0.6);
    strokes(g, HEAD, { color: C.furDark, count: 50, len: 4, width: 0.8, alpha: 0.28, seed: s(15), dir: () => Math.PI + 0.2 });
    pencil(g, HEAD, { closed: true, seed: s(16), width: 1.2 });
    pencil(g, EAR_F, { closed: true, seed: s(17), width: 1.1, alpha: 0.5 });
    pencil(g, EAR_B.slice(5, 18), { seed: s(18), width: 1, alpha: 0.4 });
    g.fillStyle = '#c96f6c'; g.beginPath(); g.arc(80, -63, 4.2, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.arc(79, -64.5, 1.3, 0, 7); g.fill();
    for (const [dy, dx] of [[-6, 26], [0, 28], [6, 24]]) ink(g, [[74, -60], [74 + dx * 0.5, -60 + dy * 0.6], [74 + dx, -60 + dy]], { alpha: 0.4, width: 0.8, seed: s(19 + dy), taper: false });
  }, { seed: s(20) });
  const scarf = sprite(bbox(SCARF), res, (g) => {
    wash(g, SCARF, { under: true, color: C.scarf, opacity: 0.94, seed: s(21) });
    shadeEdge(g, SCARF, { color: '#6e2a1c', alpha: 0.4, width: 6, dy: -3 });
    strokes(g, SCARF, { color: '#f3d2b8', count: 10, len: 7, alpha: 0.45, seed: s(22), dir: () => 1.4, width: 0.9 });
    pencil(g, SCARF, { closed: true, seed: s(23), width: 1, alpha: 0.45 });
  }, { seed: s(24) });
  const scarfTail = sprite(bbox(SCARF_TAIL), res, (g) => {
    wash(g, SCARF_TAIL, { under: true, color: shade(C.scarf, 0.12), opacity: 0.94, seed: s(25) });
    pencil(g, SCARF_TAIL, { closed: true, seed: s(26), width: 1, alpha: 0.4 });
  }, { seed: s(27) });
  const foot = sprite(bbox(FOOT), res, (g) => { wash(g, FOOT, { under: true, color: C.pink, opacity: 0.92, seed: s(28) }); pencil(g, FOOT.slice(0, 10), { seed: s(29), width: 0.9, alpha: 0.45 }); }, { seed: s(30) });
  const arm = sprite(bbox(ARM), res, (g) => { wash(g, ARM, { under: true, color: tint(C.fur, 0.05), opacity: 0.95, seed: s(31) }); pencil(g, ARM, { closed: true, seed: s(32), width: 0.9, alpha: 0.4 }); }, { seed: s(33) });

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
    if (st.noTail) { /* tucked away while she sleeps */ }
    else if (st.tailForward) { g.save(); g.translate(0, up); drawSprite(g, tailFwd); g.restore(); }
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
