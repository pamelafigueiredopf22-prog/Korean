// The grasshopper (with his fiddle) and the ant, standing upright like storybook insects, facing right.
// Line-and-wash, button eyes, one-piece mouths. Local units: feet at y = 0.
import { wash, pool, ellipse, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, rgba, shade, tint, clamp, lerp,
  penLine, hatch, looseWash, blooms, soften, path } from '../watercolor.js';
import { buttonEye, PAPER, INK } from './kit.js';

// a smooth, shiny body part: paper, wash, colour blooms, shading, a highlight, pen line
function shellPart(res, shape, col, sd, o = {}) {
  return sprite(bbox(shape.concat(o.extra || [])), res, (g) => {
    wash(g, shape, { color: PAPER, opacity: 1, under: PAPER, seed: sd, edge: 0 });
    looseWash(g, shape, col, { opacity: o.op ?? 0.9, seed: sd + 1, shift: 2, reserves: 1 });
    if (o.blooms) blooms(g, shape, o.blooms, { n: 5, seed: sd + 2, alpha: 0.3 });
    if (o.paint) o.paint(g);
    shadeEdge(g, shape, { color: o.shadow || '#2a1e12', alpha: 0.38, width: o.shadeW || 14, dx: o.sdx || 0, dy: o.sdy ?? -6 });
    const b = bbox(shape);
    glaze(g, shape, b.x0 + b.w * (o.hx ?? 0.4), b.y0 + b.h * (o.hy ?? 0.28), b.w * 0.22, b.h * 0.12, '#fff8e6', o.shine ?? 0.55);
    soften(g, 0.9 * res);
    if (o.after) o.after(g);
    penLine(g, shape, { closed: true, color: INK, w: o.pw || 1.9, alpha: 0.8, seed: sd + 5, weight: (t) => 0.3 + 0.9 * Math.max(0, Math.sin(t * Math.PI * 2 + (o.phase || 0))) });
  }, { seed: sd + 6, grain: 0.12 });
}
// a thin, jointed insect limb through points, tapering; drawn live so it can move
function limb(g, pts, w0, w1, col, alpha = 1) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = lerp(w0, w1, i / (pts.length - 1)) / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  const sh = L.concat(R.reverse());
  g.save(); g.globalAlpha *= alpha;
  g.fillStyle = col; path(g, sh); g.fill();
  g.strokeStyle = rgba(INK, 0.75); g.lineWidth = 1.5; g.lineJoin = 'round'; path(g, sh); g.stroke();
  for (let i = 1; i < pts.length - 1; i++) { g.fillStyle = shade(col, 0.15); g.beginPath(); g.arc(pts[i][0], pts[i][1], lerp(w0, w1, i / (pts.length - 1)) * 0.6, 0, 7); g.fill(); g.stroke(); }
  g.restore();
}
// a jointed limb from a root, by two angles (radians, 0 = pointing right, + = clockwise) and lengths
function joint(root, a1, l1, a2, l2) {
  const k = [root[0] + Math.cos(a1) * l1, root[1] + Math.sin(a1) * l1];
  return [root, k, [k[0] + Math.cos(a2) * l2, k[1] + Math.sin(a2) * l2]];
}
// one-piece mouth on a profile face: a smile line that opens into the mouth
function smileMouth(g, x, y, w, m, sm = 0.5) {
  const top = (k) => [x - w / 2 + k * w, y - Math.sin(k * Math.PI) * 2 * (1 - sm) + (Math.abs(k - 0.5) * 2) ** 2 * (-sm * 6)];
  const pts = []; for (let k = 0; k <= 10; k++) pts.push(top(k / 10));
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  if (m > 0.04) {
    const depth = 4 + 16 * m;
    g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p);
    g.quadraticCurveTo(x, y + depth * 1.6, pts[0][0], pts[0][1]); g.closePath();
    g.fillStyle = '#5c2622'; g.fill(); g.save(); g.clip();
    g.fillStyle = '#d8857c'; g.beginPath(); g.ellipse(x, y + depth * 0.9, w * 0.3, depth * 0.4, 0, 0, 7); g.fill(); g.restore();
    g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 1.8; g.stroke();
  } else {
    g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 1.8; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.stroke();
  }
  g.restore();
}

// ================================================================== the grasshopper
const GC = { body: '#7fae4a', dark: '#4f7a2e', light: '#bcd88a', belly: '#c8d98e', wing: '#a8c070', leg: '#6f9a3e', eye: '#1c120c' };
const G_ABD = smooth([[-8, -196], [22, -186], [24, -146], [6, -96], [-30, -50], [-58, -40], [-56, -70], [-40, -120], [-28, -168]]);
const G_THX = smooth([[-16, -236], [22, -238], [36, -210], [28, -178], [-6, -172], [-24, -198]]);
const G_HEAD = smooth([[-12, -282], [10, -306], [44, -308], [72, -290], [84, -262], [80, -236], [60, -226], [28, -230], [2, -244]]);
const G_WING = smooth([[-16, -228], [6, -222], [-8, -170], [-44, -96], [-74, -56], [-80, -68], [-60, -120], [-34, -176]]);
const G_THIGH = smooth([[6, -8], [-6, -50], [-28, -88], [-52, -102], [-70, -92], [-60, -56], [-36, -12], [-12, 10]]); // from the hip (0,0)
const G_EYE = [52, -270];
const FIDDLE = smooth([[-14, -40], [6, -46], [14, -30], [8, -18], [14, -6], [8, 8], [-8, 10], [-14, -4], [-8, -18], [-16, -30]]);

export function makeGrasshopper(res = 1, seed = 31) {
  const s = (n) => seed * 100 + n;
  const abd = shellPart(res, G_ABD, GC.body, s(1), { blooms: ['#8fbe52', '#6f9a3e', '#a8c860'], hx: 0.55, hy: 0.15, paint: (g) => {
    glaze(g, G_ABD, 12, -110, 14, 40, GC.belly, 0.7);
    for (let k = 0; k < 7; k++) penLine(g, [[-30 + k * 2, -170 + k * 18], [18 - k * 4, -168 + k * 20]], { color: GC.dark, w: 1.1, alpha: 0.6 });
  } });
  const thx = shellPart(res, G_THX, GC.body, s(10), { blooms: ['#8fbe52', '#6f9a3e'] });
  const head = shellPart(res, G_HEAD, GC.body, s(20), { blooms: ['#8fbe52', '#a8c860', '#6f9a3e'], hx: 0.35, hy: 0.2, paint: (g) => {
    glaze(g, G_HEAD, 70, -250, 16, 14, GC.belly, 0.7);
    pool(g, 66, -250, 12, 8, '#e2867a', 0.45);
  } });
  const wing = shellPart(res, G_WING, GC.wing, s(30), { op: 0.75, shine: 0.3, after: (g) => {
    for (let k = 0; k < 5; k++) penLine(g, [[-8 - k * 4, -214 + k * 6], [-30 - k * 8, -150 + k * 12], [-60 - k * 3, -80 + k * 4]], { color: GC.dark, w: 0.9, alpha: 0.5 });
  } });
  const thigh = shellPart(res, G_THIGH, '#5f8c34', s(40), { hx: 0.3, hy: 0.4, sdx: -8, sdy: 0, after: (g) => {
    for (let k = 0; k < 7; k++) { const x = -6 - k * 8, y = -10 - k * 13; penLine(g, [[x - 8, y + 6], [x, y], [x + 4, y + 10]], { color: '#3a5a1c', w: 1.3, alpha: 0.7 }); }
  } });
  const thighF = shellPart(res, G_THIGH, shade(GC.leg, 0.2), s(45));
  const fiddle = sprite(bbox(FIDDLE.concat([[0, -90], [0, 30]])), res, (g) => {
    wash(g, FIDDLE, { color: '#b06a32', opacity: 0.97, under: PAPER, seed: s(50) });
    glaze(g, FIDDLE, -4, -30, 6, 10, '#f0c080', 0.7);
    g.fillStyle = '#3a2418'; g.fillRect(-2.5, -88, 5, 52); // neck
    g.beginPath(); g.ellipse(0, -90, 5, 7, 0, 0, 7); g.fill(); // scroll
    g.fillStyle = '#2a1a10'; g.fillRect(-5, -2, 10, 3); // bridge
    g.strokeStyle = 'rgba(240,230,210,0.85)'; g.lineWidth = 0.7; for (const dx of [-2, 0, 2]) { g.beginPath(); g.moveTo(dx, -86); g.lineTo(dx, 6); g.stroke(); }
    for (const sx of [-1, 1]) { g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1.2; g.beginPath(); g.moveTo(sx * 5, -26); g.quadraticCurveTo(sx * 8, -20, sx * 5, -14); g.stroke(); }
    penLine(g, FIDDLE, { closed: true, w: 1.6, alpha: 0.85 });
  }, { granulate: false });

  // st: play (0..1 fiddle up), bow (phase), mouth, smile, eyes, happy, browUp, hop (px), crouch (0..1), shiver, arms ('hug'|'eat'|'rest'),
  //     antenna (wiggle), lean, t
  function draw(g, st = {}) {
    const t = st.t || 0, crouch = st.crouch || 0, play = st.play || 0, shiver = st.shiver || 0;
    const jit = shiver * Math.sin(t * 40) * 2.5;
    g.save();
    pool(g, -20, 2, 90, 10, '#2a1e12', 0.24 * (1 - Math.min(1, (st.hop || 0) / 80)));
    g.translate(jit, -(st.hop || 0));
    g.rotate((st.lean || 0) - crouch * 0.08);
    const hipY = -100 + crouch * 30;
    // far hind leg
    const farHip = [-14, hipY - 6];
    g.save(); g.translate(...farHip); g.scale(1, 1 - crouch * 0.25); drawSprite(g, thighF); g.restore();
    const fKnee = [farHip[0] - 60, farHip[1] - 88 * (1 - crouch * 0.25)];
    limb(g, [fKnee, [-60, -4], [-30, 0]], 7, 4, shade(GC.leg, 0.2));
    // antennae (behind the head)
    const ant = st.antenna || 0, ab = Math.sin(t * 1.3) * 0.04 + ant * Math.sin(t * 7) * 0.08;
    for (const [dx, ph] of [[0, 0], [10, 0.6]]) {
      const r0 = [20 + dx, -300];
      const tip = [-70 + dx + Math.sin(t + ph) * 6, -400 + Math.cos(t * 0.8 + ph) * 6];
      g.save(); g.translate(...r0); g.rotate(ab); g.translate(-r0[0], -r0[1]);
      penLine(g, [r0, [r0[0] - 20, r0[1] - 60], [tip[0] + 30, tip[1] - 10], tip], { color: GC.dark, w: 2.4, alpha: 0.9, weight: (u) => 1 - u * 0.7 });
      g.restore();
    }
    drawSprite(g, wing);
    // body
    g.save(); g.translate(0, crouch * 26); drawSprite(g, abd); drawSprite(g, thx);
    // far arm (holds the fiddle under the chin when playing)
    const shoulderF = [14, -212];
    const armF = st.arms === 'hug' ? joint(shoulderF, 1.2, 34, -0.2, 30) : st.arms === 'eat' ? joint(shoulderF, 1.0, 34, -0.6, 30) : joint(shoulderF, lerp(1.4, 0.2, play), 34, lerp(1.2, -1.2, play), 30);
    limb(g, armF, 6, 4, shade(GC.leg, 0.2));
    if (play > 0.05) { // the fiddle sits on his shoulder under the chin, neck pointing forward
      g.save(); g.translate(armF[2][0] - 6, armF[2][1] + 6); g.rotate(lerp(1.2, 1.95, play)); g.scale(1.1, 1.1); drawSprite(g, fiddle); g.restore();
    }
    // head
    g.save(); g.translate(18, -230); g.rotate((st.headTilt || 0) + jit * 0.004); g.translate(-18, 230);
    drawSprite(g, head);
    buttonEye(g, G_EYE[0], G_EYE[1], st.eyes ?? 1, { R: 9, happy: st.happy, sly: st.sly || 0 });
    const bu = (st.browUp || 0) * 6, sad = st.sad || 0;
    g.strokeStyle = rgba(INK, 0.55); g.lineWidth = 2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(G_EYE[0] - 12, G_EYE[1] - 14 - bu + sad * 4); g.quadraticCurveTo(G_EYE[0], G_EYE[1] - 20 - bu, G_EYE[0] + 12, G_EYE[1] - 16 - bu - sad * 6); g.stroke();
    smileMouth(g, 66, -240, 22, st.mouth || 0, st.smile ?? 0.5);
    g.restore();
    // near arm (the bow arm)
    const shoulderN = [24, -206];
    let armN;
    if (st.arms === 'hug') armN = joint(shoulderN, 1.9, 32, -0.4, 34);
    else if (st.arms === 'eat') armN = joint(shoulderN, 1.3, 32, -1.2 + Math.sin(t * 3) * 0.3, 30);
    else if (st.arms === 'wave') armN = joint(shoulderN, 0.2, 40, -0.75 + Math.sin(t * 8) * 0.35, 32);
    else { const b = Math.sin((st.bow || 0) * Math.PI * 2); armN = joint(shoulderN, lerp(1.5, 0.9 + b * 0.25, play), 32, lerp(1.3, -0.1 + b * 0.35, play), 30); }
    limb(g, armN, 7, 4, GC.leg);
    if (play > 0.05 && st.arms !== 'hug' && st.arms !== 'eat' && st.arms !== 'wave') { // the bow across the strings
      const h = armN[2], a = -0.5 + Math.sin((st.bow || 0) * Math.PI * 2) * 0.12;
      g.save(); g.globalAlpha *= play; g.strokeStyle = '#4a2e1c'; g.lineWidth = 2.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(h[0] - Math.cos(a) * 40, h[1] - Math.sin(a) * 40); g.lineTo(h[0] + Math.cos(a) * 70, h[1] + Math.sin(a) * 70); g.stroke();
      g.strokeStyle = 'rgba(245,238,220,0.9)'; g.lineWidth = 1; g.beginPath(); g.moveTo(h[0] - Math.cos(a) * 36, h[1] - Math.sin(a) * 36 + 3); g.lineTo(h[0] + Math.cos(a) * 66, h[1] + Math.sin(a) * 66 + 3); g.stroke();
      g.restore();
    }
    if (st.hold) st.hold(g, armN[2]);
    g.restore();
    // near hind leg: the big drumstick thigh, the thin shin down to the ground, and the foot
    const hip = [0, hipY];
    g.save(); g.translate(...hip); g.scale(1, 1 - crouch * 0.25); drawSprite(g, thigh); g.restore();
    const knee = [hip[0] - 66, hip[1] - 96 * (1 - crouch * 0.25)];
    limb(g, [knee, [-44, -4], [-4, 0]], 9, 6, GC.leg);
    g.restore();
  }
  return { draw };
}

// ================================================================== the ant
const AC = { body: '#a4482e', dark: '#6e2a1a', light: '#d8805a', leg: '#7a3420' };
const A_GASTER = ellipse(-44, -78, 40, 48, 30, -0.3);
const A_THX = smooth([[-12, -140], [12, -142], [18, -110], [10, -82], [-8, -80], [-16, -110]]);
const A_HEAD = smooth([[-30, -176], [-20, -210], [12, -222], [44, -210], [58, -182], [52, -152], [28, -140], [-4, -142], [-24, -154]]);
const A_EYE = [30, -186];

export function makeAnt(res = 1, seed = 41) {
  const s = (n) => seed * 100 + n;
  const gaster = shellPart(res, A_GASTER, AC.body, s(1), { blooms: ['#b4583a', '#8a3a24', '#c06842'], hx: 0.35, hy: 0.15, after: (g) => {
    for (let k = 0; k < 3; k++) penLine(g, [[-78 + k * 4, -90 + k * 22], [-10 - k * 6, -100 + k * 24]], { color: AC.dark, w: 1.1, alpha: 0.6 });
  } });
  const thx = shellPart(res, A_THX, AC.body, s(10));
  const head = shellPart(res, A_HEAD, AC.body, s(20), { blooms: ['#b4583a', '#c06842'], hx: 0.3, hy: 0.15, paint: (g) => pool(g, 38, -164, 11, 7, '#f0a090', 0.5) });
  // st: walk (phase), carry (0..1 grain overhead), arms ('wave'|'give'|'rest'|'hug'), mouth, smile, eyes, happy, browUp, bob, t, hold(g, hand)
  function draw(g, st = {}) {
    const t = st.t || 0, p = (st.walk ?? 0) * Math.PI * 2, moving = st.walk != null;
    const bob = moving ? Math.abs(Math.sin(p)) * 3 : (st.breath || 0) * 1.2;
    g.save();
    pool(g, -10, 2, 70, 8, '#2a1e12', 0.24);
    // far legs
    const legs = (far) => {
      const col = far ? shade(AC.leg, 0.2) : AC.leg;
      [[-8, -64, 0], [4, -62, Math.PI]].forEach(([x, y, o], i) => {
        const sw = moving ? Math.sin(p + o + (far ? Math.PI : 0)) : 0, lift = moving ? Math.max(0, Math.cos(p + o + (far ? Math.PI : 0))) * 6 : 0;
        const footX = (i ? 34 : -46) + sw * 14 + (far ? 8 : 0);
        limb(g, [[x, y - bob], [x + (i ? 30 : -34) + sw * 6, y - 22 - bob], [footX, -lift]], 6.5, 4, col);
      });
    };
    legs(true);
    g.save(); g.translate(0, 30); // the body sits low on its bent legs
    // antennae: elbowed, curling forward
    for (const [dx, ph] of [[-6, 0.8], [6, 0]]) {
      const r0 = [14 + dx, -214 - bob], el = [24 + dx, -262 - bob + Math.sin(t * 2 + ph) * 3];
      const tip = [60 + dx + Math.sin(t * 1.6 + ph) * 6, -280 - bob + Math.cos(t * 1.3 + ph) * 5];
      penLine(g, [r0, el], { color: AC.dark, w: 2.6, alpha: 0.9 });
      penLine(g, [el, [el[0] + 16, el[1] - 12], tip], { color: AC.dark, w: 2.2, alpha: 0.9, weight: (u) => 1 - u * 0.5 });
      g.fillStyle = AC.dark; g.beginPath(); g.arc(tip[0], tip[1], 3.2, 0, 7); g.fill();
    }
    g.save(); g.translate(0, -bob);
    drawSprite(g, gaster); drawSprite(g, thx);
    // far arm
    const carry = st.carry || 0;
    const armF = carry > 0.05 ? joint([4, -128], -1.75, 34, -1.55, 46) : st.arms === 'give' ? joint([4, -128], 0.4, 30, -0.3, 30) : joint([4, -128], 1.3, 30, 1.0, 26);
    limb(g, armF, 5, 3.5, shade(AC.leg, 0.2));
    g.save(); g.rotate(st.headTilt || 0);
    drawSprite(g, head);
    buttonEye(g, A_EYE[0], A_EYE[1], st.eyes ?? 1, { R: 9, happy: st.happy });
    const bu = (st.browUp || 0) * 6;
    g.strokeStyle = rgba(INK, 0.55); g.lineWidth = 2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(A_EYE[0] - 12, A_EYE[1] - 14 - bu); g.quadraticCurveTo(A_EYE[0], A_EYE[1] - 20 - bu, A_EYE[0] + 12, A_EYE[1] - 15 - bu); g.stroke();
    smileMouth(g, 44, -158, 18, st.mouth || 0, st.smile ?? 0.55);
    g.restore();
    // near arm
    let armN;
    if (carry > 0.05) armN = joint([10, -124], -1.4, 34, -1.6, 46);
    else if (st.arms === 'wave') armN = joint([10, -124], 0.0, 44, -0.9 + Math.sin(t * 8) * 0.35, 34);
    else if (st.arms === 'give') armN = joint([10, -124], 0.3, 30, -0.2, 30);
    else if (st.arms === 'hug') armN = joint([10, -124], 0.9, 28, -0.6, 26);
    else armN = joint([10, -124], 1.2, 30, 0.9, 26);
    limb(g, armN, 6, 4, AC.leg);
    if (carry > 0.05 && st.grain) st.grain(g, [(armF[2][0] + armN[2][0]) / 2, Math.min(armF[2][1], armN[2][1]) - 12]);
    if (st.hold) st.hold(g, armN[2]);
    g.restore();
    g.restore();
    legs(false);
    g.restore();
  }
  return { draw };
}

// a golden grain of wheat (or a seed) centred at (0,0)
export function makeGrain(res = 1, col = '#e0b050') {
  const sh = ellipse(0, 0, 26, 16, 20, -0.3);
  return sprite(bbox(sh), res, (g) => {
    wash(g, sh, { color: col, opacity: 0.97, under: PAPER, seed: 501 });
    glaze(g, sh, -6, -6, 10, 5, '#fff2c8', 0.8);
    penLine(g, [[-20, 6], [18, -8]], { color: '#a87a2a', w: 1.2, alpha: 0.7 });
    penLine(g, sh, { closed: true, w: 1.6, alpha: 0.8 });
  }, { granulate: false });
}
