// Storybook mice (profile, facing right, standing upright) with little clothes, and a big sleepy house cat.
// Line-and-wash, button eyes, one-piece mouths. Local units: feet at y = 0.
import { wash, pool, ellipse, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, furEdge, rgba, shade, tint, clamp, lerp,
  penLine, hatch, looseWash, blooms, soften, path, drawBent, ribbon } from '../watercolor.js';
import { buttonEye, PAPER, INK } from './kit.js';

function furry(res, shape, col, sd, o = {}) {
  return sprite(bbox(shape.concat(o.extra || [])), res, (g) => {
    wash(g, shape, { color: PAPER, opacity: 1, under: PAPER, seed: sd, edge: 0 });
    looseWash(g, shape, col, { opacity: o.op ?? 0.88, seed: sd + 1, shift: 2, reserves: 1 });
    if (o.blooms) blooms(g, shape, o.blooms, { n: 5, seed: sd + 2, alpha: 0.28 });
    if (o.paint) o.paint(g);
    shadeEdge(g, shape, { color: o.shadow || '#3a2a1e', alpha: 0.32, width: o.shadeW || 12, dx: o.sdx || 0, dy: o.sdy ?? -5 });
    soften(g, 0.9 * res);
    if (o.after) o.after(g);
    if (o.hatch) hatch(g, shape, { color: o.hatchColor || '#4a3a2e', count: o.hatch, len: o.hlen || 6, width: 0.7, alpha: 0.4, seed: sd + 3, dir: o.dir || (() => Math.PI) });
    if (o.fur) furEdge(g, shape, { color: col, count: o.fur, len: 5, width: 1.4, alpha: 0.7, seed: sd + 4 });
    penLine(g, shape, { closed: true, color: INK, w: o.pw || 1.8, alpha: 0.8, seed: sd + 5, weight: (t) => 0.3 + 0.8 * Math.max(0, Math.sin(t * Math.PI * 2 + (o.phase || 0))) });
  }, { seed: sd + 6, grain: 0.12 });
}
function smileMouth(g, x, y, w, m, sm = 0.5) {
  const top = (k) => [x - w / 2 + k * w, y - Math.sin(k * Math.PI) * 2 * (1 - sm) + (Math.abs(k - 0.5) * 2) ** 2 * (-sm * 5)];
  const pts = []; for (let k = 0; k <= 10; k++) pts.push(top(k / 10));
  const outline = (depth) => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.quadraticCurveTo(x, y + depth * 1.6, pts[0][0], pts[0][1]); g.closePath(); };
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  if (m > 0.04) {
    const depth = 3 + 11 * m;
    outline(depth); g.fillStyle = '#5c2622'; g.fill(); g.save(); g.clip();
    g.fillStyle = '#d8857c'; g.beginPath(); g.ellipse(x, y + depth * 0.9, w * 0.3, depth * 0.4, 0, 0, 7); g.fill(); g.restore();
    outline(depth); g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 1.6; g.stroke();
  } else { g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 1.6; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.stroke(); }
  g.restore();
}
function limb(g, pts, w0, w1, col) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = lerp(w0, w1, i / (pts.length - 1)) / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  const sh = L.concat(R.reverse());
  g.save(); g.fillStyle = col; path(g, sh); g.fill(); g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1.3; g.lineJoin = 'round'; path(g, sh); g.stroke(); g.restore();
}
const joint = (r, a1, l1, a2, l2) => { const k = [r[0] + Math.cos(a1) * l1, r[1] + Math.sin(a1) * l1]; return [r, k, [k[0] + Math.cos(a2) * l2, k[1] + Math.sin(a2) * l2]]; };

// ================================================================== a mouse
const BODY = smooth([[-38, -10], [-46, -60], [-36, -104], [-6, -126], [24, -118], [40, -84], [40, -40], [26, -8], [-6, 2]]);
const HEAD = smooth([[-20, -150], [-6, -176], [24, -184], [52, -170], [76, -150], [86, -136], [74, -126], [44, -118], [10, -118], [-14, -130]]);
const EAR = ellipse(0, 0, 21, 24, 24);
const EAR_IN = ellipse(1, 2, 13, 16, 20);
const EYE = [44, -156];
const TAIL = ribbon([[-36, -24], [-80, -14], [-112, -36], [-130, -70], [-150, -76]], 7, 2);
const FOOT = smooth([[-8, -6], [22, -8], [34, -2], [28, 3], [-8, 3]]);

export function makeMouse2(res = 1, seed = 51, o = {}) {
  const s = (n) => seed * 100 + n;
  const fur = o.fur || '#a8988a', furDark = shade(fur, 0.25), belly = o.belly || '#efe2cf';
  const tail = sprite(bbox(TAIL), res, (g) => { wash(g, TAIL, { color: '#dfa49a', opacity: 0.92, under: PAPER, seed: s(1) }); penLine(g, TAIL, { closed: true, w: 1.2, alpha: 0.6 }); }, { granulate: false });
  const body = furry(res, BODY, fur, s(10), { blooms: [tint(fur, 0.1), shade(fur, 0.1)], hatch: 60, fur: 30, paint: (g) => {
    glaze(g, BODY, 26, -60, 12, 40, belly, 0.8);
    // clothes
    if (o.dress) { // a dress with an apron
      const dress = smooth([[-44, -56], [-24, -96], [20, -96], [40, -60], [44, -14], [-48, -14]]);
      wash(g, dress, { color: o.dress, opacity: 0.95, seed: s(11), under: true });
      shadeEdge(g, dress, { color: shade(o.dress, 0.5), alpha: 0.35, width: 10, dx: -4 });
      for (let k = 0; k < 7; k++) penLine(g, [[-40 + k * 12, -20], [-34 + k * 10, -80]], { color: shade(o.dress, 0.3), w: 0.8, alpha: 0.35 });
      const apron = smooth([[4, -90], [34, -86], [42, -40], [40, -16], [10, -16], [6, -60]]);
      wash(g, apron, { color: '#f4ecdc', opacity: 0.97, seed: s(12), under: true });
      penLine(g, apron, { closed: true, w: 1.3, alpha: 0.6 });
      penLine(g, dress, { closed: true, w: 1.5, alpha: 0.7 });
      for (let k = 0; k < 9; k++) { g.fillStyle = rgba('#f4ecdc', 0.9); g.beginPath(); g.arc(-44 + k * 11, -14, 3.5, 0, 7); g.fill(); }  // lace hem
    }
    if (o.coat) { // a smart coat with brass buttons and a bow tie
      const coat = smooth([[-46, -30], [-40, -96], [-8, -122], [26, -116], [40, -84], [42, -40], [30, -18], [-20, -12]]);
      wash(g, coat, { color: o.coat, opacity: 0.95, seed: s(13), under: true });
      shadeEdge(g, coat, { color: shade(o.coat, 0.5), alpha: 0.4, width: 10, dx: -4 });
      wash(g, smooth([[14, -114], [34, -98], [40, -60], [30, -30], [20, -60]]), { color: '#f4ecdc', opacity: 0.95, seed: s(14) }); // shirt front
      penLine(g, [[18, -112], [8, -70], [28, -24]], { w: 1.4, alpha: 0.7 });
      for (const y of [-84, -64, -44]) { g.fillStyle = '#d8b050'; g.beginPath(); g.arc(14, y, 3.4, 0, 7); g.fill(); g.strokeStyle = rgba(INK, 0.6); g.lineWidth = 0.8; g.stroke(); }
      penLine(g, coat, { closed: true, w: 1.5, alpha: 0.7 });
      penLine(g, [[-46, -30], [-56, -6], [-30, -10]], { w: 1.4, alpha: 0.6, color: shade(o.coat, 0.4) }); // coat tails
      g.fillStyle = o.tie || '#c0443a'; g.beginPath(); g.moveTo(30, -114); g.lineTo(18, -122); g.lineTo(18, -106); g.closePath(); g.fill(); g.beginPath(); g.moveTo(30, -114); g.lineTo(42, -122); g.lineTo(42, -106); g.closePath(); g.fill();
    }
  } });
  const head = furry(res, HEAD, fur, s(20), { blooms: [tint(fur, 0.1)], hatch: 40, fur: 24, paint: (g) => {
    glaze(g, HEAD, 60, -136, 18, 10, belly, 0.7);
    pool(g, 54, -136, 10, 7, '#e2867a', 0.45);
  }, after: (g) => {
    g.fillStyle = '#c96f6c'; g.beginPath(); g.arc(84, -138, 5.5, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(82.5, -140, 1.6, 0, 7); g.fill();
    g.save(); g.strokeStyle = rgba(INK, 0.3); g.lineWidth = 0.7;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(76, -134 + i * 3); g.quadraticCurveTo(96, -140 + i * 6, 116, -144 + i * 10); g.stroke(); }
    g.restore();
    if (o.scarf) { const sc = smooth([[-18, -168], [10, -184], [40, -180], [30, -160], [0, -158]]); wash(g, sc, { color: o.scarf, opacity: 0.95, seed: s(21), under: true }); penLine(g, sc, { closed: true, w: 1.3, alpha: 0.7 }); for (let k = 0; k < 6; k++) { g.fillStyle = rgba('#f4ecdc', 0.9); g.beginPath(); g.arc(-8 + k * 8, -172 + Math.abs(k - 2.5) * 2, 2, 0, 7); g.fill(); } }
  } });
  const ear = sprite(bbox(EAR), res, (g) => {
    wash(g, EAR, { color: fur, opacity: 0.95, under: PAPER, seed: s(30) });
    wash(g, EAR_IN, { color: '#e8a09a', opacity: 0.8, seed: s(31) }); glaze(g, EAR_IN, -2, -6, 6, 8, '#ffe8e2', 0.6);
    penLine(g, EAR, { closed: true, w: 1.5, alpha: 0.75 });
  }, { granulate: false });
  const foot = sprite(bbox(FOOT), res, (g) => { wash(g, FOOT, { color: '#dfa49a', opacity: 0.95, under: PAPER, seed: s(40) }); penLine(g, FOOT, { closed: true, w: 1.2, alpha: 0.6 }); }, { granulate: false });
  const hat = o.hat ? sprite({ x0: -30, y0: -50, x1: 30, y1: 4, w: 60, h: 54 }, res, (g) => {
    const brim = ellipse(0, 0, 28, 6, 20), crown = smooth([[-16, 0], [-16, -40], [16, -40], [16, 0]]);
    wash(g, crown, { color: o.hat, opacity: 0.97, under: PAPER, seed: s(41) }); wash(g, brim, { color: o.hat, opacity: 0.97, under: PAPER, seed: s(42) });
    wash(g, smooth([[-16, -8], [16, -8], [16, -2], [-16, -2]]), { color: o.tie || '#c0443a', opacity: 0.95, seed: s(43) });
    penLine(g, crown, { closed: true, w: 1.3, alpha: 0.75 }); penLine(g, brim, { closed: true, w: 1.3, alpha: 0.75 });
  }, { granulate: false }) : null;

  // st: walk (phase), run (0..1 lean for scurrying), arms ('rest'|'wave'|'eat'|'point'|'hug'|'open'), mouth, smile, eyes, happy, browUp,
  //     sad, headTilt, hop, sit (0..1), t, hold(g, hand)
  function draw(g, st = {}) {
    const t = st.t || 0, p = (st.walk ?? 0) * Math.PI * 2, moving = st.walk != null, run = st.run || 0;
    const bob = moving ? Math.abs(Math.sin(p)) * (3 + run * 5) : (st.breath || 0) * 1.2;
    g.save();
    pool(g, -10, 2, 60, 7, '#2a1e12', 0.24);
    g.translate(0, -(st.hop || 0));
    // tail
    drawBent(g, tail, [-36, -24], -150, Math.sin(t * 1.4) * 0.2 + (moving ? Math.sin(p) * 0.15 : 0), { strips: 18 });
    // far foot / leg
    const step = (o) => moving ? Math.sin(p + o) * (12 + run * 10) : 0;
    const lift = (o) => moving ? Math.max(0, Math.cos(p + o)) * (5 + run * 6) : 0;
    g.save(); g.translate(-10 + step(Math.PI), -lift(Math.PI)); g.globalAlpha *= 0.9; drawSprite(g, foot); g.restore();
    g.save(); g.translate(0, -bob); g.rotate(run * 0.25);
    // far arm
    const shF = [6, -98];
    const armF = st.arms === 'open' ? joint(shF, -0.4, 22, -0.9, 20) : st.arms === 'eat' ? joint(shF, 1.0, 22, -1.0, 20) : moving ? joint(shF, 1.4 + Math.sin(p) * 0.5 * (1 + run), 22, 0.9, 18) : joint(shF, 1.4, 22, 1.2, 18);
    limb(g, armF, 6, 5, shade(st.sleeve || '#a8988a', 0.15));
    drawSprite(g, body);
    // head
    g.save(); g.translate(20, -120); g.rotate((st.headTilt || 0) + run * -0.15); g.translate(-20, 120);
    g.save(); g.translate(-18, -172); g.rotate(-0.35 - (st.earsBack || 0) * 0.5); drawSprite(g, ear); g.restore();
    drawSprite(g, head);
    if (hat) { g.save(); g.translate(26, -180); g.rotate(-0.12); drawSprite(g, hat); g.restore(); }
    g.save(); g.translate(2, -184); g.rotate(-0.1 - (st.earsBack || 0) * 0.5); drawSprite(g, ear); g.restore();
    buttonEye(g, EYE[0], EYE[1], st.eyes ?? 1, { R: 7.5, happy: st.happy });
    const bu = (st.browUp || 0) * 5, sad = st.sad || 0;
    g.strokeStyle = rgba(INK, 0.5); g.lineWidth = 1.7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(EYE[0] - 9, EYE[1] - 11 - bu + sad * 3); g.quadraticCurveTo(EYE[0], EYE[1] - 16 - bu, EYE[0] + 9, EYE[1] - 12 - bu - sad * 4); g.stroke();
    smileMouth(g, 70, -128, 16, st.mouth || 0, st.smile ?? 0.55);
    g.restore();
    // near arm
    const shN = [14, -96];
    let armN;
    if (st.arms === 'wave') armN = joint(shN, 0.0, 24, -1.0 + Math.sin(t * 8) * 0.4, 22);
    else if (st.arms === 'point' || st.arms === 'open') armN = joint(shN, 0.2, 24, -0.3, 22);
    else if (st.arms === 'eat') armN = joint(shN, 0.9, 22, -1.6 + Math.sin(t * 5) * 0.2, 22);
    else if (st.arms === 'hug') armN = joint(shN, 1.3, 22, -0.4, 20);
    else if (moving) armN = joint(shN, 1.4 - Math.sin(p) * 0.5 * (1 + run), 22, 0.9, 18);
    else armN = joint(shN, 1.35, 22, 1.4, 18);
    limb(g, armN, 6.5, 5, st.sleeve || '#a8988a');
    g.fillStyle = '#dfa49a'; g.beginPath(); g.arc(armN[2][0], armN[2][1], 4.5, 0, 7); g.fill();
    if (st.hold) st.hold(g, armN[2]);
    g.restore();
    g.save(); g.translate(4 + step(0), -lift(0)); drawSprite(g, foot); g.restore();
    g.restore();
  }
  // curled up asleep (in bed): a soft round body, the head resting, the tail curled round
  function drawSleep(g, st = {}) {
    const b = st.breath || 0;
    g.save(); g.scale(1, 1 + b * 0.02);
    const curl = ellipse(0, -40, 64, 40, 30);
    g.save(); g.translate(-10, -10); g.rotate(0.6); drawSprite(g, tail); g.restore();
    wash(g, curl, { color: o.fur || '#a8988a', opacity: 0.95, under: PAPER, seed: s(60), layers: 10 });
    penLine(g, curl, { closed: true, w: 1.5, alpha: 0.7 });
    g.save(); g.translate(30, 92); g.scale(0.95, 0.95); g.rotate(0.15);
    g.save(); g.translate(-12, -176); g.rotate(-0.9); drawSprite(g, ear); g.restore();
    drawSprite(g, head); buttonEye(g, EYE[0], EYE[1], 0, { R: 7.5 }); smileMouth(g, 70, -128, 16, 0, 0.6);
    g.restore();
    g.restore();
  }
  return { draw, drawSleep };
}

// ================================================================== the house cat (big, fluffy, sleepy, ginger)
const CAT_BODY = smooth([[-260, -150], [-200, -250], [-60, -280], [100, -270], [200, -230], [230, -150], [200, -110], [60, -100], [-120, -100], [-240, -110]]);
const CAT_HEAD = smooth([[150, -330], [180, -380], [214, -350], [250, -356], [276, -390], [292, -340], [310, -300], [300, -250], [260, -224], [200, -222], [160, -246], [146, -290]]);
const CAT_LEG = smooth([[-22, 0], [22, 0], [24, 80], [30, 120], [28, 136], [-20, 136], [-22, 110], [-20, 60]]);
const CAT_TAIL = ribbon([[-250, -170], [-330, -160], [-380, -220], [-390, -300], [-360, -330]], 46, 30);
export function makeCat(res = 1, seed = 61) {
  const s = (n) => seed * 100 + n;
  const col = '#e09a52', dark = '#b8703a';
  const stripes = (g, shape, dir) => { g.save(); path(g, shape); g.clip(); const b = bbox(shape); for (let x = b.x0; x < b.x1; x += 34) penLine(g, [[x, b.y0], [x + 18, b.y0 + b.h * 0.5], [x + 4, b.y1]], { color: dark, w: 9, alpha: 0.45 }); g.restore(); };
  const body = furry(res, CAT_BODY, col, s(1), { blooms: ['#e8a860', '#d08840'], fur: 120, hatch: 160, paint: (g) => { stripes(g, CAT_BODY); glaze(g, CAT_BODY, 140, -120, 60, 20, '#f8e6c8', 0.8); } });
  const head = furry(res, CAT_HEAD, col, s(10), { fur: 60, hatch: 60, paint: (g) => {
    glaze(g, CAT_HEAD, 260, -240, 40, 20, '#f8e6c8', 0.9);
    for (const [x, y] of [[214, -350], [276, -372]]) wash(g, ellipse(x, y + 6, 12, 14, 16), { color: '#e8a8a0', opacity: 0.8, seed: x });
    pool(g, 270, -262, 14, 9, '#e2867a', 0.45);
  }, after: (g) => { g.fillStyle = '#c96f6c'; g.beginPath(); g.moveTo(298, -278); g.lineTo(308, -278); g.lineTo(303, -270); g.closePath(); g.fill();
    g.save(); g.strokeStyle = rgba(INK, 0.35); g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(296, -262 + i * 4); g.quadraticCurveTo(340, -270 + i * 8, 380, -276 + i * 14); g.stroke(); } g.restore(); } });
  const leg = furry(res, CAT_LEG, col, s(20), { fur: 30, paint: (g) => wash(g, ellipse(4, 128, 30, 12, 16), { color: '#f8e6c8', opacity: 0.9, seed: s(21) }) });
  const legF = furry(res, CAT_LEG, shade(col, 0.15), s(25), { fur: 20 });
  const tail = furry(res, CAT_TAIL, col, s(30), { fur: 50, paint: (g) => stripes(g, CAT_TAIL) });
  // st: walk (phase), yawn (0..1), eyes (0..1 open), t
  function draw(g, st = {}) {
    const p = (st.walk ?? 0) * Math.PI * 2, moving = st.walk != null;
    const sw = (o) => moving ? Math.sin(p + o) * 0.28 : 0;
    g.save();
    pool(g, 0, 4, 330, 22, '#2a1e12', 0.25);
    const L = (spr, x, o) => { g.save(); g.translate(x, -136 - (moving ? Math.max(0, Math.cos(p + o)) * 8 : 0)); g.rotate(sw(o)); drawSprite(g, spr); g.restore(); };
    L(legF, 150, Math.PI); L(legF, -170, 0);
    drawBent(g, tail, [-250, -170], -390, Math.sin((st.t || 0) * 1.2) * 0.25, { strips: 20 });
    drawSprite(g, body);
    L(leg, 120, 0); L(leg, -200, Math.PI);
    g.save(); g.translate(0, moving ? Math.abs(Math.sin(p)) * -4 : 0);
    drawSprite(g, head);
    const y = st.yawn || 0, e = st.eyes ?? 0.35;
    for (const x of [236, 280]) buttonEye(g, x, -300, y > 0.4 ? 0 : e, { R: 11, sly: 0.6 });
    smileMouth(g, 290, -246, 26, y, 0.3);
    g.restore();
    g.restore();
  }
  return { draw };
}
