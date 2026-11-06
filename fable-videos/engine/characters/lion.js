// A cosy, round, sleepy lion, lying down and facing left.
// Local units: about 700 wide, ground at y = 0, origin under the middle of the body.
import { wash, ink, strokes, pool, ellipse, smooth, ribbon, fluffy, bbox, sprite, drawSprite,
  rng, rgba, shade, tint, lerp, clamp } from '../watercolor.js';

const C = {
  body: '#d6a557', bodyDark: '#b27a3c', cream: '#f1dfbf', paw: '#ecd2a2',
  mane: '#b8592d', maneDeep: '#8c3b20', maneLight: '#d98845',
  pink: '#d98c84', nose: '#a4574a', ink: '#4a3226', eye: '#c98a2e',
};

// ---- shapes ----
const BODY = smooth([[-150, -8], [-175, -115], [-95, -182], [60, -198], [190, -184], [272, -120], [286, -35], [245, 0], [0, 6]]);
const HAUNCH = ellipse(170, -92, 112, 90, 32);
const REAR_PAW = ellipse(118, -13, 58, 18, 24);
const FAR_LEG = smooth([[-60, -130], [-150, -100], [-250, -76], [-300, -62], [-305, -22], [-240, -20], [-140, -36], [-70, -60]]);
const FAR_PAW = ellipse(-310, -40, 40, 21, 24);
const NEAR_LEG = smooth([[-50, -112], [-130, -92], [-230, -64], [-305, -52], [-318, -6], [-250, 2], [-150, -4], [-70, -18], [-30, -60]]);
const NEAR_PAW = ellipse(-336, -22, 44, 24, 24);
const TAIL = ribbon([[240, -64], [318, -54], [356, -24], [332, -2], [272, 6]], 24, 13);
const TUFT = fluffy(258, 6, 28, 16, 6, 0.25, 41);
const MANE_BACK = fluffy(-235, -198, 182, 168, 15, 0.22, 7);
const MANE = fluffy(-235, -204, 160, 148, 13, 0.2, 8);
const HEAD = smooth([[-235, -292], [-160, -268], [-140, -195], [-160, -130], [-235, -108], [-310, -130], [-330, -195], [-310, -268]]);
const EAR_L = ellipse(-312, -282, 30, 28, 20), EAR_R = ellipse(-158, -282, 30, 28, 20);
const EARIN_L = ellipse(-310, -279, 15, 14, 16), EARIN_R = ellipse(-160, -279, 15, 14, 16);
const MUZ_L = ellipse(-258, -150, 34, 26, 22), MUZ_R = ellipse(-212, -150, 34, 26, 22);
const CHIN = ellipse(-235, -128, 26, 15, 18);
const NOSE = smooth([[-258, -180], [-212, -180], [-235, -158]]);
export const LION_EYES = [[-276, -204], [-194, -204]];
const NECK = [-215, -125]; // head pivot

export function makeLion(res = 1, seed = 1) {
  const r = rng(seed);
  const s = (n) => seed * 100 + n;

  const tail = sprite(bbox(TAIL.concat(TUFT)), res, (g) => {
    wash(g, TAIL, { under: true, color: C.body, opacity: 0.85, seed: s(1), bleed: 0.03 });
    strokes(g, TAIL, { color: C.bodyDark, count: 30, len: 10, alpha: 0.3, seed: s(2), dir: () => 0.2 });
    wash(g, TUFT, { under: true, color: C.maneDeep, opacity: 0.9, seed: s(3) });
    strokes(g, TUFT, { color: '#5a2414', count: 30, len: 12, alpha: 0.4, seed: s(4), dir: () => 2.9 });
    ink(g, smooth([[240, -76], [320, -66], [366, -30], [340, 6]], false), { alpha: 0.45, seed: s(5), gaps: 1 });
  }, { seed: s(6) });

  const body = sprite(bbox(BODY.concat(HAUNCH, REAR_PAW, FAR_LEG, FAR_PAW)), res, (g) => {
    wash(g, FAR_LEG, { under: true, color: shade(C.body, 0.12), opacity: 0.9, seed: s(10) });
    wash(g, FAR_PAW, { under: true, color: shade(C.paw, 0.08), opacity: 0.9, seed: s(11) });
    wash(g, BODY, { under: true, color: C.body, opacity: 0.88, seed: s(12), bleed: 0.05 });
    // warm shading on the back and a lighter belly
    wash(g, smooth([[-120, -150], [60, -196], [200, -180], [140, -150], [-40, -140]]), { color: C.bodyDark, opacity: 0.22, seed: s(13), edge: 0 });
    wash(g, ellipse(30, -28, 175, 32, 24), { color: C.cream, opacity: 0.45, seed: s(14), edge: 0 });
    wash(g, HAUNCH, { color: C.body, opacity: 0.55, seed: s(15) });
    wash(g, ellipse(195, -120, 70, 50, 20), { color: C.bodyDark, opacity: 0.2, seed: s(16), edge: 0 });
    wash(g, REAR_PAW, { under: true, color: C.paw, opacity: 0.92, seed: s(17) });
    strokes(g, BODY, { color: C.bodyDark, count: 260, len: 15, alpha: 0.28, seed: s(18), dir: (x, y) => Math.PI + 0.15 * Math.sin(x / 80) });
    strokes(g, HAUNCH, { color: C.bodyDark, count: 80, len: 13, alpha: 0.25, seed: s(19), dir: (x, y) => Math.atan2(y + 92, x - 170) + 1.5 });
    ink(g, smooth([[-160, -110], [-95, -180], [60, -197], [190, -183], [270, -120], [284, -40]], false), { alpha: 0.55, seed: s(20), gaps: 1.2 });
    ink(g, smooth([[100, -160], [160, -182], [245, -150], [282, -92], [258, -40]], false), { alpha: 0.35, seed: s(21), gaps: 1 });
    ink(g, smooth([[64, -10], [120, -30], [176, -12]], false), { alpha: 0.45, seed: s(22) });
    for (const x of [-332, -316, -300]) ink(g, [[x, -36], [x + 2, -26]], { alpha: 0.5, seed: s(23 + x), width: 1.3 });
  }, { seed: s(24) });

  const nearLeg = sprite(bbox(NEAR_LEG.concat(NEAR_PAW)), res, (g) => {
    wash(g, NEAR_LEG, { under: true, color: C.body, opacity: 0.9, seed: s(30) });
    strokes(g, NEAR_LEG, { color: C.bodyDark, count: 70, len: 12, alpha: 0.25, seed: s(31), dir: () => Math.PI });
    wash(g, NEAR_PAW, { under: true, color: C.paw, opacity: 0.95, seed: s(32) });
    ink(g, smooth([[-60, -112], [-130, -93], [-230, -66], [-300, -50], [-362, -40], [-380, -14], [-340, 2], [-250, 0], [-150, -6]], false), { alpha: 0.5, seed: s(33), gaps: 1.5 });
    for (const x of [-362, -346, -330]) ink(g, [[x, -14], [x + 1, -1]], { alpha: 0.55, seed: s(34 + x), width: 1.4 });
  }, { seed: s(35) });

  const mane = sprite(bbox(MANE_BACK), res, (g) => {
    wash(g, MANE_BACK, { under: true, color: C.maneDeep, opacity: 0.85, seed: s(40), bleed: 0.05 });
    wash(g, MANE, { color: C.mane, opacity: 0.85, seed: s(41) });
    wash(g, fluffy(-245, -225, 120, 100, 9, 0.2, s(42)), { color: C.maneLight, opacity: 0.35, seed: s(43), edge: 0 });
    const radial = (x, y) => Math.atan2(y + 200, x + 235);
    strokes(g, MANE_BACK, { color: '#6e2a14', count: 420, len: 26, width: 1.4, alpha: 0.35, seed: s(44), dir: radial, curve: 0.4 });
    strokes(g, MANE, { color: '#f0b070', count: 160, len: 20, width: 1.1, alpha: 0.25, seed: s(45), dir: radial, curve: 0.4 });
    ink(g, MANE_BACK, { alpha: 0.35, seed: s(46), gaps: 2, closed: true });
  }, { seed: s(47) });

  const head = sprite(bbox(HEAD.concat(EAR_L, EAR_R)), res, (g) => {
    for (const [e, ei, n] of [[EAR_L, EARIN_L, 0], [EAR_R, EARIN_R, 1]]) {
      wash(g, e, { under: true, color: C.body, opacity: 0.92, seed: s(50 + n) });
      wash(g, ei, { color: C.pink, opacity: 0.6, seed: s(52 + n), edge: 0 });
      ink(g, e.slice(12).concat(e.slice(0, 3)), { alpha: 0.5, seed: s(54 + n) });
    }
    wash(g, HEAD, { under: true, color: C.body, opacity: 0.92, seed: s(56) });
    wash(g, ellipse(-235, -240, 60, 34, 20), { color: tint(C.body, 0.4), opacity: 0.35, seed: s(57), edge: 0 });
    strokes(g, HEAD, { color: C.bodyDark, count: 110, len: 9, alpha: 0.22, seed: s(58), dir: (x, y) => Math.atan2(y + 195, x + 235) });
    pool(g, -300, -165, 30, 20, C.pink, 0.4);
    pool(g, -170, -165, 30, 20, C.pink, 0.4);
    wash(g, MUZ_L, { under: true, color: C.cream, opacity: 0.95, seed: s(59) });
    wash(g, MUZ_R, { under: true, color: C.cream, opacity: 0.95, seed: s(60) });
    wash(g, CHIN, { color: C.cream, opacity: 0.85, seed: s(61) });
    for (const [x, y] of [[-268, -150], [-280, -142], [-262, -138], [-202, -150], [-190, -142], [-208, -138]]) {
      g.fillStyle = rgba(C.ink, 0.45); g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill();
    }
    wash(g, NOSE, { color: C.nose, opacity: 0.95, seed: s(62), bleed: 0.02 });
    pool(g, -240, -175, 8, 4, '#ffffff', 0.5);
    ink(g, HEAD, { alpha: 0.5, seed: s(63), gaps: 1.5, closed: true });
    ink(g, [[-235, -158], [-235, -146]], { alpha: 0.6, seed: s(64) });
    // little brows
    ink(g, [[-296, -228], [-276, -234], [-258, -230]], { alpha: 0.35, seed: s(65), width: 1.4 });
    ink(g, [[-212, -230], [-194, -234], [-174, -228]], { alpha: 0.35, seed: s(66), width: 1.4 });
  }, { seed: s(67) });

  function eye(g, x, y, open, happy) {
    g.save();
    g.lineCap = 'round';
    if (open < 0.12) {
      g.strokeStyle = rgba(C.ink, 0.85); g.lineWidth = 3.2;
      g.beginPath();
      if (happy) g.arc(x, y + 6, 13, Math.PI * 1.15, Math.PI * 1.85); // ^ laughing
      else g.arc(x, y - 6, 13, Math.PI * 0.15, Math.PI * 0.85);       // ‿ sleeping
      g.stroke();
    } else {
      const ry = 13 * open;
      g.fillStyle = '#fbf3e2'; g.beginPath(); g.ellipse(x, y, 14, ry + 1, 0, 0, 7); g.fill();
      g.fillStyle = C.eye; g.beginPath(); g.ellipse(x - 1, y, 11, Math.min(11, ry), 0, 0, 7); g.fill();
      g.fillStyle = '#2b1810'; g.beginPath(); g.ellipse(x - 2, y + 1, 6.5, Math.min(8, ry * 0.8), 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(x - 5, y - 4 * open, 3, 0, 7); g.fill();
      g.strokeStyle = rgba(C.ink, 0.85); g.lineWidth = 3;
      g.beginPath(); g.ellipse(x, y, 15, ry + 1.5, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    }
    g.restore();
  }

  // st: breath (-1..1), eyes [l,r] (0 closed..1 open), happy, mouth (0..1),
  //     smile, headTilt (rad), headDY, pawLift (0..1), tail (-1..1), zoomHead
  function draw(g, st = {}) {
    const b = st.breath || 0;
    g.save();
    pool(g, 40, 2, 420, 34, '#4a3020', 0.22);
    g.save(); // tail swish around its root
    g.translate(240, -64); g.rotate((st.tail || 0) * 0.08); g.translate(-240, 64);
    drawSprite(g, tail);
    g.restore();
    g.save(); // breathing body
    g.translate(60, 0); g.scale(1 + b * 0.004, 1 + b * 0.016); g.translate(-60, 0);
    drawSprite(g, body);
    g.restore();
    g.save(); // head + mane
    g.translate(0, -b * 3 + (st.headDY || 0));
    g.translate(NECK[0], NECK[1]); g.rotate(st.headTilt || 0); g.translate(-NECK[0], -NECK[1]);
    drawSprite(g, mane);
    drawSprite(g, head);
    const eo = st.eyes || [0, 0];
    eye(g, LION_EYES[0][0], LION_EYES[0][1], eo[0], st.happy);
    eye(g, LION_EYES[1][0], LION_EYES[1][1], eo[1], st.happy);
    const m = clamp(st.mouth || 0), sm = st.smile || 0;
    g.strokeStyle = rgba(C.ink, 0.75); g.lineWidth = 2.4; g.lineCap = 'round';
    if (m > 0.05) {
      g.fillStyle = '#6b2f28';
      g.beginPath(); g.ellipse(-235, -134 + m * 3, 12 + 4 * sm, 2 + 12 * m, 0, 0, 7); g.fill();
      g.fillStyle = '#d8857c';
      g.beginPath(); g.ellipse(-235, -128 + m * 6, 7, 2 + 4 * m, 0, 0, Math.PI); g.fill();
    }
    g.beginPath(); // the little "w" mouth
    g.moveTo(-258, -144 - sm * 4); g.quadraticCurveTo(-247, -134 + sm * 2, -235, -145);
    g.quadraticCurveTo(-223, -134 + sm * 2, -212, -144 - sm * 4); g.stroke();
    g.restore();
    if (st.leg !== false) drawLeg(g, st);
    g.restore();
  }
  function drawLeg(g, st = {}) {
    const lift = st.pawLift || 0;
    g.save(); // near front leg, lifts from the shoulder
    g.translate(-95, -52); g.rotate(lift * 0.2); g.translate(95, 52 - lift * 14);
    drawSprite(g, nearLeg);
    g.restore();
  }
  return { draw, drawLeg, parts: { tail, body, nearLeg, mane, head } };
}
