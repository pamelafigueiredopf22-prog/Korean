// A cosy, round, sleepy lion, lying down and facing left.
// Local units: about 700 wide, ground at y = 0, origin under the middle of the body.
//
// Painted like a picture-book illustration: each part is a base wash, then soft
// form shading (shadow along the underside, light along the top), directional
// fur strokes and a steady sepia pencil contour. The mane is built lock by lock.
import { wash, ink, strokes, pool, ellipse, smooth, ribbon, fluffy, bbox, sprite, drawSprite, shadeEdge, glaze, lock, tuft, pencil,
  rng, rgba, shade, tint, mix, lerp, clamp } from '../watercolor.js';

const C = {
  body: '#d9a95c', bodyDark: '#a8692f', bodyLight: '#f0cf8e', cream: '#f4e3c3', paw: '#efd6a6',
  mane: '#bd5f2f', maneDeep: '#94431f', maneLight: '#de8c47', maneGlow: '#f0b26a',
  pink: '#de8f86', nose: '#a65a4c', ink: '#4a3226', eye: '#c98a2e', shadow: '#7a4524',
};

// a paw seen from the side, toes pointing left, with three toe bumps
function pawShape(cx, cy, L, H) {
  return smooth([[cx + L * 0.5, cy - H * 0.95], [cx, cy - H * 1.05], [cx - L * 0.32, cy - H * 0.9], [cx - L * 0.48, cy - H * 0.6],
    [cx - L * 0.44, cy - H * 0.36], [cx - L * 0.56, cy - H * 0.16], [cx - L * 0.5, cy + H * 0.05], [cx - L * 0.56, cy + H * 0.26],
    [cx - L * 0.44, cy + H * 0.46], [cx - L * 0.05, cy + H * 0.5], [cx + L * 0.5, cy + H * 0.36]]);
}
function toeLines(g, cx, cy, L, H, seed) {
  for (const [y0, y1] of [[-0.36, -0.12], [0.05, 0.24]])
    pencil(g, smooth([[cx - L * 0.44, cy + H * y0], [cx - L * 0.3, cy + H * (y0 + y1) / 2 + 1], [cx - L * 0.2, cy + H * y1 * 0.8]], false), { seed: seed + y0 * 10, width: 1.3, alpha: 0.5, gaps: 0 });
}

// ---- shapes ----
const BODY = smooth([[-150, -6], [-182, -86], [-158, -150], [-90, -186], [0, -186], [86, -174], [150, -188], [222, -182], [272, -146], [294, -84], [284, -26], [248, 2], [120, 7], [0, 7]]);
const HAUNCH = ellipse(178, -96, 108, 86, 36);
const REAR_PAW = pawShape(112, -14, 104, 22);
const FAR_LEG = smooth([[-70, -128], [-150, -102], [-250, -78], [-292, -66], [-300, -24], [-240, -18], [-140, -34], [-80, -60]]);
const FAR_PAW = pawShape(-306, -40, 82, 23);
const NEAR_LEG = smooth([[-46, -116], [-130, -96], [-230, -68], [-296, -54], [-306, -6], [-250, 2], [-150, -4], [-70, -18], [-26, -62]]);
const NEAR_PAW = pawShape(-336, -24, 96, 26);
const TAIL = ribbon([[240, -64], [318, -54], [356, -24], [332, -2], [272, 6]], 24, 12);
const TUFT_C = [256, 6];
const HC = [-235, -198]; // head / mane centre
const HEAD = smooth([[-235, -290], [-170, -274], [-142, -220], [-146, -168], [-160, -138], [-196, -114], [-235, -106], [-274, -114], [-310, -138], [-324, -168], [-328, -220], [-300, -274]]);
const EAR_L = ellipse(-310, -280, 30, 28, 22), EAR_R = ellipse(-160, -280, 30, 28, 22);
const EARIN_L = ellipse(-308, -276, 15, 14, 16), EARIN_R = ellipse(-162, -276, 15, 14, 16);
const MUZ_L = ellipse(-257, -148, 35, 26, 24), MUZ_R = ellipse(-213, -148, 35, 26, 24);
const CHIN = ellipse(-235, -124, 24, 14, 18);
const NOSE = smooth([[-258, -181], [-235, -184], [-212, -181], [-224, -165], [-235, -158], [-246, -165]]);
export const LION_EYES = [[-276, -204], [-194, -204]];
const NECK = [-215, -125]; // head pivot
const LEG_PIVOT = [-60, -80];

export function makeLion(res = 1, seed = 1) {
  const s = (n) => seed * 100 + n;

  const tail = sprite(bbox(TAIL.concat(ellipse(TUFT_C[0], TUFT_C[1], 46, 30))), res, (g) => {
    wash(g, TAIL, { under: true, color: C.body, opacity: 0.88, seed: s(1), bleed: 0.025 });
    shadeEdge(g, TAIL, { color: C.shadow, alpha: 0.35, width: 10, dy: -4 });
    strokes(g, TAIL, { color: C.bodyDark, count: 50, len: 8, alpha: 0.3, seed: s(2), dir: () => 0.2 });
    pencil(g, smooth([[240, -76], [320, -66], [366, -30], [340, 6]], false), { seed: s(5) });
    // tail tuft, a little brush of locks
    const r = rng(s(3));
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (0.75 + r() * 0.6), sh = lock(TUFT_C[0] + 10, TUFT_C[1] - 2, a, 0, r.range(30, 44), r.range(12, 18), r.gauss(0, 0.5));
      wash(g, sh, { under: i === 0, color: i % 3 ? C.maneDeep : C.mane, opacity: 0.9, seed: s(10 + i), bleed: 0.03, layers: 14 });
    }
    strokes(g, ellipse(TUFT_C[0] - 8, TUFT_C[1], 36, 16), { color: '#4e1d0e', count: 40, len: 14, alpha: 0.45, seed: s(4), dir: () => 2.95 });
  }, { seed: s(6) });

  const body = sprite(bbox(BODY.concat(HAUNCH, REAR_PAW, FAR_LEG, FAR_PAW)), res, (g) => {
    // far legs, in shadow
    wash(g, FAR_LEG, { under: true, color: shade(C.body, 0.16), opacity: 0.92, seed: s(20) });
    shadeEdge(g, FAR_LEG, { color: C.shadow, alpha: 0.4, width: 18, dy: -8 });
    wash(g, FAR_PAW, { under: true, color: shade(C.paw, 0.12), opacity: 0.92, seed: s(21) });
    shadeEdge(g, FAR_PAW, { color: C.shadow, alpha: 0.35, width: 10, dy: -5 });
    // the body
    wash(g, BODY, { under: true, color: C.body, opacity: 0.9, seed: s(22), bleed: 0.035 });
    glaze(g, BODY, 60, -40, 200, 40, C.cream, 0.55);                     // soft pale belly
    shadeEdge(g, BODY, { color: C.shadow, alpha: 0.42, width: 34, dy: -14 }); // underside in shadow
    shadeEdge(g, BODY, { color: C.bodyLight, alpha: 0.6, width: 30, dy: 16 }); // light along the back
    // haunch: a round thigh, shaded on its front and underside
    shadeEdge(g, BODY, { edge: HAUNCH, color: C.shadow, alpha: 0.35, width: 26, dx: 10, dy: -8 });
    glaze(g, BODY, 200, -130, 70, 45, C.bodyLight, 0.45);
    // shoulder roundness behind the leg
    shadeEdge(g, BODY, { edge: ellipse(-70, -96, 90, 80, 30), color: C.shadow, alpha: 0.22, width: 22, dx: -8, dy: -4 });
    wash(g, REAR_PAW, { under: true, color: C.paw, opacity: 0.94, seed: s(23) });
    shadeEdge(g, REAR_PAW, { color: C.shadow, alpha: 0.3, width: 10, dy: -5 });
    // fur
    strokes(g, BODY, { color: C.bodyDark, count: 520, len: 11, width: 1, alpha: 0.26, seed: s(24), dir: (x) => Math.PI + 0.25 * Math.sin(x / 70), curve: 0.25 });
    strokes(g, BODY, { color: '#fbe3b0', count: 200, len: 10, width: 1, alpha: 0.35, seed: s(25), dir: (x) => Math.PI + 0.2 * Math.sin(x / 90), curve: 0.25 });
    strokes(g, HAUNCH, { color: C.bodyDark, count: 140, len: 10, width: 1, alpha: 0.24, seed: s(26), dir: (x, y) => Math.atan2(y + 96, x - 178) + 1.6 });
    // contours
    pencil(g, smooth([[-160, -150], [-90, -186], [0, -186], [86, -174], [150, -188], [222, -182], [272, -146], [294, -84], [284, -26], [248, 2]], false), { seed: s(27) });
    pencil(g, smooth([[96, -150], [140, -178], [210, -180], [258, -142], [272, -92], [256, -40]], false), { seed: s(28), alpha: 0.35 });
    pencil(g, smooth([[60, -8], [110, -36], [178, -14]], false), { seed: s(29), alpha: 0.5 });
    pencil(g, FAR_PAW.slice(8, 30), { seed: s(30), alpha: 0.45 });
    pencil(g, REAR_PAW.slice(10, 34), { seed: s(31), alpha: 0.5 });
    toeLines(g, 112, -14, 104, 22, s(32));
  }, { seed: s(33) });

  const nearLeg = sprite(bbox(NEAR_LEG.concat(NEAR_PAW)), res, (g) => {
    wash(g, NEAR_LEG, { under: true, color: C.body, opacity: 0.92, seed: s(40) });
    shadeEdge(g, NEAR_LEG, { color: C.shadow, alpha: 0.42, width: 22, dy: -10 });
    shadeEdge(g, NEAR_LEG, { color: C.bodyLight, alpha: 0.55, width: 18, dy: 9 });
    strokes(g, NEAR_LEG, { color: C.bodyDark, count: 170, len: 10, width: 1, alpha: 0.26, seed: s(41), dir: () => Math.PI + 0.12, curve: 0.2 });
    wash(g, NEAR_PAW, { under: true, color: C.paw, opacity: 0.96, seed: s(42) });
    shadeEdge(g, NEAR_PAW, { color: C.shadow, alpha: 0.32, width: 12, dy: -6 });
    glaze(g, NEAR_PAW, -340, -38, 40, 12, '#fff4dc', 0.6);
    pencil(g, smooth([[-50, -116], [-130, -97], [-230, -69], [-300, -52]], false), { seed: s(43) });
    pencil(g, NEAR_PAW.slice(0, 40), { seed: s(44) });
    pencil(g, smooth([[-306, 0], [-250, 2], [-150, -4], [-80, -16]], false), { seed: s(45), alpha: 0.4 });
    toeLines(g, -336, -24, 96, 26, s(46));
  }, { seed: s(47) });

  // ---- mane: three rings of painted locks, back to front ----
  const maneBox = { x0: HC[0] - 220, y0: HC[1] - 205, x1: HC[0] + 220, y1: HC[1] + 205, w: 440, h: 410 };
  const mane = sprite(maneBox, res, (g) => {
    const r = rng(s(50));
    const ring = (n, r0, r1, w, colors, op, from = 0, to = Math.PI * 2, sd = 0) => {
      for (let i = 0; i < n; i++) {
        const a = from + (to - from) * (i + r.range(-0.25, 0.25)) / n;
        const k = 1 + 0.08 * Math.cos(a) ** 2; // a little wider than tall
        const sh = tuft(HC[0], HC[1] + 6, a, r0 * k, r1 * k * r.range(0.92, 1.06), w * r.range(0.9, 1.12), r.gauss(0.45, 0.25));
        const col = colors[i % colors.length];
        wash(g, sh, { under: sd === 0, color: col, opacity: op, seed: s(60 + sd * 50 + i), bleed: 0.03, layers: 16 });
        shadeEdge(g, sh, { color: '#5a200d', alpha: 0.3, width: 14, dx: -Math.cos(a) * 8, dy: -Math.sin(a) * 8 });
        // strands along the lock
        const ca = Math.cos(a), sa = Math.sin(a);
        g.save(); g.strokeStyle = rgba(sd === 2 ? C.maneGlow : '#5e230f', 0.28); g.lineWidth = 1; g.lineCap = 'round';
        for (let j = 0; j < 2; j++) {
          const o = (j - 0.5) * w * 0.25, d0 = r0 * k + 10, d1 = r1 * k * 0.8;
          g.beginPath(); g.moveTo(HC[0] + ca * d0 - sa * o, HC[1] + 6 + sa * d0 + ca * o);
          g.quadraticCurveTo(HC[0] + ca * (d0 + d1) / 2 - sa * (o + w * 0.15), HC[1] + 6 + sa * (d0 + d1) / 2 + ca * (o + w * 0.15), HC[0] + ca * d1 - sa * (o + w * 0.25), HC[1] + 6 + sa * d1 + ca * (o + w * 0.25));
          g.stroke();
        }
        g.restore();
      }
    };
    wash(g, ellipse(HC[0], HC[1] + 6, 150, 140, 30), { under: true, color: C.maneDeep, opacity: 0.9, seed: s(55) });
    ring(18, 92, 190, 80, [C.maneDeep, '#a64e26', C.maneDeep], 0.92, 0, Math.PI * 2, 0);
    ring(16, 82, 166, 76, [C.mane, '#c76a35', C.mane], 0.9, 0.2, Math.PI * 2 + 0.2, 1);
    ring(11, 80, 136, 56, [C.maneLight, C.mane, C.maneGlow], 0.85, Math.PI * 0.08, Math.PI * 0.92, 2); // cheek ruff below the face
    strokes(g, ellipse(HC[0], HC[1] + 6, 185, 180, 40), { color: '#5a200d', count: 260, len: 16, width: 1, alpha: 0.18, seed: s(57), dir: (x, y) => Math.atan2(y - HC[1] - 6, x - HC[0]) + 0.35, curve: 0.5 });
  }, { seed: s(59) });

  const head = sprite(bbox(HEAD.concat(EAR_L, EAR_R)), res, (g) => {
    for (const [e, ei, n] of [[EAR_L, EARIN_L, 0], [EAR_R, EARIN_R, 1]]) {
      wash(g, e, { under: true, color: C.body, opacity: 0.94, seed: s(100 + n) });
      shadeEdge(g, e, { color: C.shadow, alpha: 0.3, width: 10, dy: 5 });
      wash(g, ei, { color: C.pink, opacity: 0.7, seed: s(102 + n), edge: 0.2 });
      shadeEdge(g, ei, { color: '#9c4f48', alpha: 0.3, width: 6, dy: 3 });
      pencil(g, e.slice(13).concat(e.slice(0, 4)), { seed: s(104 + n) });
    }
    wash(g, HEAD, { under: true, color: C.body, opacity: 0.94, seed: s(106), bleed: 0.025 });
    glaze(g, HEAD, -235, -246, 70, 36, C.bodyLight, 0.6);                    // forehead light
    shadeEdge(g, HEAD, { color: C.shadow, alpha: 0.28, width: 24, dy: -6 }); // jaw shadow
    // gentle sockets & brow
    glaze(g, HEAD, -276, -210, 30, 18, C.bodyDark, 0.18);
    glaze(g, HEAD, -194, -210, 30, 18, C.bodyDark, 0.18);
    strokes(g, HEAD, { color: C.bodyDark, count: 190, len: 7, width: 0.9, alpha: 0.22, seed: s(107), dir: (x, y) => Math.atan2(y + 190, x + 235) });
    pool(g, -301, -162, 30, 18, C.pink, 0.45);
    pool(g, -169, -162, 30, 18, C.pink, 0.45);
    // muzzle
    for (const [m, n] of [[MUZ_L, 0], [MUZ_R, 1]]) {
      wash(g, m, { under: true, color: C.cream, opacity: 0.96, seed: s(120 + n), bleed: 0.03 });
      shadeEdge(g, m, { color: '#b89060', alpha: 0.28, width: 10, dy: -4 });
    }
    wash(g, CHIN, { under: true, color: C.cream, opacity: 0.9, seed: s(122) });
    shadeEdge(g, CHIN, { color: '#b89060', alpha: 0.3, width: 8, dy: -3 });
    for (const [x, y] of [[-266, -150], [-279, -141], [-262, -136], [-204, -150], [-191, -141], [-208, -136]]) {
      g.fillStyle = rgba(C.ink, 0.5); g.beginPath(); g.arc(x, y, 1.7, 0, 7); g.fill();
    }
    g.save(); g.strokeStyle = rgba(C.ink, 0.28); g.lineWidth = 0.8; // whiskers
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) {
      g.beginPath(); g.moveTo(-235 + side * 42, -146 + i * 7);
      g.quadraticCurveTo(-235 + side * 75, -150 + i * 9, -235 + side * 105, -146 + i * 14); g.stroke();
    }
    g.restore();
    wash(g, NOSE, { under: true, color: C.nose, opacity: 0.96, seed: s(123), bleed: 0.015 });
    shadeEdge(g, NOSE, { color: '#5e2a22', alpha: 0.4, width: 6, dy: -3 });
    pool(g, -243, -177, 9, 4, '#ffffff', 0.55);
    pencil(g, NOSE, { closed: true, seed: s(124), alpha: 0.5, width: 1.2 });
    pencil(g, HEAD.slice(0, 96), { seed: s(125), alpha: 0.5 });
    ink(g, [[-235, -158], [-235, -146]], { alpha: 0.6, seed: s(126) });
    ink(g, [[-298, -228], [-277, -235], [-257, -230]], { alpha: 0.4, seed: s(127), width: 1.6 });
    ink(g, [[-213, -230], [-193, -235], [-172, -228]], { alpha: 0.4, seed: s(128), width: 1.6 });
  }, { seed: s(129) });

  function eye(g, x, y, open, happy) {
    g.save();
    g.lineCap = 'round';
    if (open < 0.12) {
      g.strokeStyle = rgba(C.ink, 0.85); g.lineWidth = 3.2;
      g.beginPath();
      if (happy) g.arc(x, y + 6, 13, Math.PI * 1.15, Math.PI * 1.85); // ^ laughing
      else g.arc(x, y - 6, 13, Math.PI * 0.15, Math.PI * 0.85);       // ‿ sleeping
      g.stroke();
      g.lineWidth = 1.6; // tiny lashes
      if (!happy) for (const dx of [-8, 0, 8]) { g.beginPath(); g.moveTo(x + dx, y + 6); g.lineTo(x + dx * 1.3, y + 11); g.stroke(); }
    } else {
      const ry = 13 * open;
      g.fillStyle = '#fbf3e2'; g.beginPath(); g.ellipse(x, y, 14, ry + 1, 0, 0, 7); g.fill();
      const ig = g.createRadialGradient(x - 2, y + 2, 1, x - 1, y, 12);
      ig.addColorStop(0, '#e9b45a'); ig.addColorStop(1, '#9a5e1e');
      g.fillStyle = ig; g.beginPath(); g.ellipse(x - 1, y, 11, Math.min(11, ry), 0, 0, 7); g.fill();
      g.fillStyle = '#2b1810'; g.beginPath(); g.ellipse(x - 2, y + 1, 6.5, Math.min(8, ry * 0.8), 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.arc(x - 5, y - 4 * open, 3, 0, 7); g.fill();
      g.beginPath(); g.arc(x + 3, y + 4 * open, 1.3, 0, 7); g.fill();
      g.strokeStyle = rgba(C.ink, 0.85); g.lineWidth = 3;
      g.beginPath(); g.ellipse(x, y, 15, ry + 1.5, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    }
    g.restore();
  }

  // st: breath (-1..1), eyes [l,r] (0 closed..1 open), happy, mouth (0..1), smile,
  //     headTilt (rad), headDY, pawLift (0..1), pawReach (units back toward the body), tail (-1..1)
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
  // the near front leg: lifts up from the shoulder and can be drawn back toward the chest
  function drawLeg(g, st = {}) {
    const lift = st.pawLift || 0, reach = st.pawReach || 0;
    g.save();
    g.translate(reach - lift * 10, -lift * 24);
    g.translate(LEG_PIVOT[0], LEG_PIVOT[1]); g.rotate(lift * 0.05); g.translate(-LEG_PIVOT[0], -LEG_PIVOT[1]);
    drawSprite(g, nearLeg);
    g.restore();
    return { tip: [-386 + reach - lift * 10, -24 - lift * 24] };
  }
  return { draw, drawLeg, parts: { tail, body, nearLeg, mane, head } };
}
