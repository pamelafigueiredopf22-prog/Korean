// A naturalistic fox in profile, drawn line-and-wash like a classic storybook illustration.
// Facing right. Two poses: sitting (looking up) and trotting. Ground at y = 0.
import { wash, pool, ellipse, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, blooms, soften, furEdge, rng, rgba, shade, tint, clamp,
  penLine, hatch, looseWash, path } from '../watercolor.js';

const C = {
  fur: '#c8693a', furDark: '#8a3f1e', furLight: '#e3a067', white: '#f3ead8', sock: '#3d2c24', ink: '#33241b',
  paper: '#f4ead6', shadow: '#6e3418', nose: '#2a1d17',
};
const WARM = ['#d27a44', '#b5552a', '#e0a062', '#9c4522'];

// ---------- head (profile), origin at the skull centre ----------
const HEAD = smooth([[-46, -6], [-40, -30], [-20, -44], [10, -46], [38, -36], [64, -22], [92, -12], [108, -4], [110, 4], [100, 10], [74, 14], [50, 22], [26, 34], [0, 42], [-26, 40], [-44, 24]]);
const EAR_N = smooth([[-20, -38], [-12, -76], [-4, -104], [8, -72], [20, -38]]);
const EAR_F = smooth([[-42, -28], [-46, -64], [-40, -94], [-28, -62], [-20, -40]]);
const EAR_IN = smooth([[-12, -44], [-6, -74], [-3, -92], [4, -70], [12, -44]]);
const EAR_TIP = smooth([[-10, -80], [-4, -104], [4, -80]]);
const RUFF = smooth([[-46, 14], [-34, 36], [-8, 46], [20, 40], [46, 24], [26, 16], [0, 18], [-28, 12]]);
const MUZ = smooth([[48, 22], [74, 14], [100, 10], [96, 17], [72, 23], [52, 28]]);
const JAW = smooth([[50, 18], [100, 10], [97, 16], [74, 24], [52, 28]]);
const JAW_PIVOT = [48, 18];
const EYE = [30, -15];

// ---------- sitting body ----------
const S_BODY = smooth([[-104, -18], [-118, -76], [-100, -142], [-62, -202], [-20, -252], [16, -288], [44, -300], [80, -292], [94, -250], [97, -200], [90, -150],
  [82, -104], [60, -96], [40, -86], [16, -56], [30, -26], [40, -8], [-60, 2]]);
const S_BIB = smooth([[44, -296], [80, -288], [94, -248], [96, -200], [88, -158], [70, -168], [60, -220], [50, -262]]);
const S_HAUNCH = ellipse(-34, -74, 74, 66, 34);
const S_FLEG = smooth([[56, -150], [90, -150], [88, -80], [92, -6], [64, -4], [60, -80]]);
const S_FLEG_FAR = smooth([[34, -120], [60, -120], [62, -60], [66, -6], [42, -6], [40, -60]]);
const S_HPAW = smooth([[-22, -16], [46, -18], [58, -6], [44, 2], [-22, 2]]);
const S_TAIL = smooth([[-70, -60], [-140, -76], [-190, -46], [-184, -4], [-110, 8], [-20, 12], [72, 12], [140, 4], [166, -24], [136, -50], [60, -40], [-10, -44]]);
const S_TAIL_TIP = smooth([[96, 8], [140, 4], [166, -24], [138, -48], [100, -38]]);
const S_HEAD_AT = [52, -318], S_HEAD_TILT = -0.22;

// ---------- trotting body ----------
const T_BODY = smooth([[-140, -208], [-112, -240], [-30, -248], [60, -254], [106, -262], [140, -288], [176, -300], [206, -262], [196, -206], [164, -168],
  [100, -160], [20, -166], [-60, -172], [-112, -150], [-142, -176]]);
const T_BIB = smooth([[170, -296], [204, -262], [196, -214], [170, -184], [160, -230]]);
const LEG = 132;
const T_FLEG = smooth([[-16, -8], [16, -8], [12, 80], [11, LEG - 4], [-10, LEG - 2], [-12, 80]]);
const T_HLEG = smooth([[-30, -14], [26, -14], [20, 56], [4, 106], [12, LEG - 4], [-8, LEG - 2], [-22, 110], [-32, 50]]);
const T_PAW = smooth([[-12, LEG - 10], [14, LEG - 12], [26, LEG - 4], [20, LEG + 2], [-12, LEG + 2]]);
const T_TAIL = smooth([[-134, -220], [-196, -246], [-268, -238], [-328, -204], [-356, -160], [-334, -140], [-284, -156], [-214, -170], [-140, -184]]);
const T_TAIL_TIP = smooth([[-310, -214], [-328, -204], [-356, -160], [-334, -140], [-306, -152]]);
const T_HEAD_AT = [204, -308], T_HEAD_TILT = 0.12;

export function makeFox2(res = 1, seed = 5) {
  const s = (n) => seed * 100 + n;
  // the standard recipe for a furry part: paper, loose wash, colour, shade, soften, fur hatching, pen line
  const furPart = (shape, o) => sprite(bbox(shape.concat(o.extra || [])), res, (g) => {
    wash(g, shape, { color: C.paper, opacity: 1, under: C.paper, seed: s(o.sd), edge: 0 });
    looseWash(g, shape, o.color || C.fur, { opacity: o.op ?? 0.8, seed: s(o.sd + 1), shift: 3, reserves: o.reserves ?? 3 });
    blooms(g, shape, o.blooms || WARM, { n: 6, seed: s(o.sd + 2), alpha: 0.25 });
    if (o.paint) o.paint(g);
    shadeEdge(g, shape, { color: C.shadow, alpha: 0.32, width: o.shadeW || 22, dx: o.sdx || 0, dy: o.sdy ?? -9 });
    soften(g, 1.2 * res);
    if (o.after) o.after(g);
    const b = bbox(shape);
    hatch(g, shape, { color: '#5a2c16', count: o.hatch ?? 220, len: o.hlen || 9, width: 0.8, alpha: 0.5, seed: s(o.sd + 3), dir: o.dir || (() => Math.PI),
      density: (x, y) => 0.25 + 0.75 * clamp((y - b.y0) / b.h) ** 1.4 });
    furEdge(g, shape, { color: o.color || C.fur, count: o.fur ?? 60, len: 7, width: 1.6, alpha: 0.7, seed: s(o.sd + 4) });
    if (o.pen !== false) penLine(g, o.penPts || shape, { closed: !o.penPts, color: C.ink, w: 2.2, alpha: 0.82, seed: s(o.sd + 5),
      weight: (t) => 0.25 + 0.9 * Math.max(0, Math.sin(t * Math.PI * 2 + (o.phase || 0))) });
  }, { seed: s(o.sd + 6), grain: 0.12 });

  // ---- head ----
  const head = sprite(bbox(HEAD.concat(EAR_N, EAR_F, RUFF)), res, (g) => {
    for (const [e, k] of [[EAR_F, 0], [EAR_N, 1]]) {
      wash(g, e, { color: C.paper, opacity: 1, under: C.paper, seed: s(1 + k), edge: 0 });
      looseWash(g, e, k ? C.fur : shade(C.fur, 0.15), { opacity: 0.85, seed: s(3 + k), shift: 2, reserves: 0 });
      g.save(); path(g, e); g.clip(); wash(g, EAR_TIP.map(([x, y]) => [x + (k ? 0 : -34), y + (k ? 0 : 12)]), { color: C.sock, opacity: 0.85, seed: s(5 + k) }); g.restore();
      if (k) { looseWash(g, EAR_IN, C.white, { opacity: 0.85, seed: s(7), shift: 1, reserves: 0 }); hatch(g, EAR_IN, { color: '#9a8a76', count: 30, len: 7, alpha: 0.45, seed: s(8), dir: () => -Math.PI / 2 }); }
      penLine(g, e, { closed: true, w: 1.8, seed: s(9 + k), weight: (t) => 0.3 + 0.8 * Math.sin(t * Math.PI) });
    }
    wash(g, HEAD, { color: C.paper, opacity: 1, under: C.paper, seed: s(11), edge: 0 });
    looseWash(g, HEAD, C.fur, { opacity: 0.82, seed: s(12), shift: 2, reserves: 2, reserveSize: 0.12 });
    blooms(g, HEAD, WARM, { n: 5, seed: s(13), alpha: 0.25 });
    looseWash(g, MUZ, C.white, { opacity: 0.55, seed: s(14), shift: 1, reserves: 0 });
    shadeEdge(g, HEAD, { color: C.shadow, alpha: 0.28, width: 14, dy: -5 });
    glaze(g, HEAD, 26, -24, 26, 12, C.furDark, 0.25); // the soft dark of the brow and eye socket
    soften(g, 1.0 * res);
    // cheek ruff, white and fluffy, sweeping back
    looseWash(g, RUFF, C.white, { opacity: 0.92, seed: s(15), shift: 1, reserves: 0 });
    furEdge(g, RUFF, { color: C.white, count: 70, len: 14, width: 2.4, alpha: 0.95, seed: s(16), lean: 0.8 });
    hatch(g, RUFF, { color: '#8f7d68', count: 50, len: 8, alpha: 0.4, seed: s(17), dir: () => Math.PI * 0.85 });
    hatch(g, HEAD, { color: '#5a2c16', count: 170, len: 7, width: 0.7, alpha: 0.5, seed: s(18), dir: (x) => Math.PI + (x > 40 ? 0.05 : 0.4),
      density: (x, y) => 0.3 + 0.7 * clamp((y + 10) / 50) });
    // dark line of the lips and the nose
    g.fillStyle = C.nose; g.beginPath(); g.ellipse(106, 0, 7.5, 6, 0.2, 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.beginPath(); g.arc(104, -2.5, 1.8, 0, 7); g.fill();
    g.save(); g.strokeStyle = rgba(C.ink, 0.3); g.lineWidth = 0.7; // whiskers
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(84, 8 + i * 2); g.quadraticCurveTo(70, 14 + i * 6, 54, 16 + i * 10); g.stroke(); }
    g.restore();
    penLine(g, HEAD.slice(0, Math.floor(HEAD.length * 0.62)), { w: 2.2, seed: s(19), weight: (t) => 0.3 + 0.8 * Math.sin(t * Math.PI) });
    penLine(g, HEAD.slice(Math.floor(HEAD.length * 0.62)), { w: 1.4, alpha: 0.5, seed: s(20) });
  }, { seed: s(21), grain: 0.12 });
  const jaw = sprite(bbox(JAW), res, (g) => {
    wash(g, JAW, { color: '#e9d2b6', opacity: 0.9, under: C.paper, seed: s(22) });
    hatch(g, JAW, { color: '#8f7d68', count: 20, len: 6, alpha: 0.4, seed: s(23), dir: () => Math.PI });
    penLine(g, JAW.slice(2), { w: 1.2, alpha: 0.35, seed: s(24) });
  }, { seed: s(25) });

  function drawHead(g, st = {}) {
    g.save();
    g.rotate(st.headTilt || 0);
    const m = clamp(st.mouth || 0), sm = st.smile || 0;
    if (m > 0.03) { // the inside of the mouth, seen when the jaw drops
      g.fillStyle = '#5c2622'; g.beginPath(); g.moveTo(50, 18); g.lineTo(102, 9); g.lineTo(100, 12 + m * 22); g.lineTo(54, 22 + m * 12); g.closePath(); g.fill();
    }
    drawSprite(g, head);
    g.save(); g.translate(JAW_PIVOT[0], JAW_PIVOT[1]); g.rotate(m * 0.32); g.translate(-JAW_PIVOT[0], -JAW_PIVOT[1]); drawSprite(g, jaw); g.restore();
    // mouth line, curling up at the corner when he smiles
    g.strokeStyle = rgba(C.ink, 0.8); g.lineWidth = 1.8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(102, 9); g.quadraticCurveTo(78, 15, 56, 18 - sm * 7); g.stroke();
    // eye: almond, amber, with a sly heavy lid
    const [ex, ey] = EYE, open = st.eyes ?? 1, sly = st.sly || 0;
    g.save();
    if (open < 0.12 || st.happy) {
      g.strokeStyle = rgba(C.ink, 0.9); g.lineWidth = 2.4; g.beginPath();
      if (st.happy) g.arc(ex, ey + 6, 11, Math.PI * 1.2, Math.PI * 1.8); else g.arc(ex, ey - 5, 11, Math.PI * 0.2, Math.PI * 0.8);
      g.stroke();
    } else {
      const h = 7 * open * (1 - 0.45 * sly);
      g.beginPath(); g.moveTo(ex - 13, ey + 1); g.quadraticCurveTo(ex, ey - h * 1.3, ex + 13, ey - 2); g.quadraticCurveTo(ex, ey + h, ex - 13, ey + 1); g.closePath();
      g.fillStyle = '#f2e6cc'; g.fill(); g.save(); g.clip();
      const ig = g.createRadialGradient(ex + 2, ey, 1, ex + 2, ey, 8); ig.addColorStop(0, '#f0b850'); ig.addColorStop(1, '#a8621c');
      g.fillStyle = ig; g.beginPath(); g.arc(ex + 2, ey - 1, 7, 0, 7); g.fill();
      g.fillStyle = '#1c120c'; g.beginPath(); g.ellipse(ex + 3, ey - 1, 2.6, 5, 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(ex, ey - 3, 1.8, 0, 7); g.fill();
      g.restore();
      g.strokeStyle = rgba(C.ink, 0.92); g.lineWidth = 2.6;
      g.beginPath(); g.moveTo(ex - 14, ey + 1); g.quadraticCurveTo(ex, ey - h * 1.3 - 1, ex + 14, ey - 2); g.stroke();
      g.lineWidth = 1.2; g.beginPath(); g.moveTo(ex - 12, ey + 2); g.quadraticCurveTo(ex, ey + h + 1, ex + 12, ey - 1); g.stroke();
      g.lineWidth = 2; g.beginPath(); g.moveTo(ex + 13, ey - 2); g.lineTo(ex + 20, ey + 1); g.stroke(); // the fox's dark eye line
    }
    // brow
    const bu = (st.browUp || 0) * 6;
    g.strokeStyle = rgba(C.ink, 0.5); g.lineWidth = 1.8;
    g.beginPath(); g.moveTo(ex - 12, ey - 13 - bu); g.quadraticCurveTo(ex + 2, ey - 19 - bu * 1.2, ex + 14, ey - 14 - bu * 0.6); g.stroke();
    g.restore();
    g.restore();
  }

  // ---- sitting ----
  const sTail = furPart(S_TAIL, { sd: 100, dir: () => Math.PI, hatch: 180, fur: 90, after: (g) => {
    looseWash(g, S_TAIL_TIP, C.white, { opacity: 0.95, seed: s(130), shift: 1, reserves: 0 });
    furEdge(g, S_TAIL_TIP, { color: C.white, count: 40, len: 12, width: 2.4, alpha: 0.95, seed: s(131) });
  } });
  const sFarLeg = furPart(S_FLEG_FAR, { sd: 140, color: shade(C.fur, 0.2), hatch: 40, fur: 10, penPts: [[62, -90], [66, -6], [42, -6], [40, -70]], after: (g) => {
    g.save(); path(g, S_FLEG_FAR); g.clip(); const gr = g.createLinearGradient(0, -80, 0, -40); gr.addColorStop(0, 'rgba(61,44,36,0)'); gr.addColorStop(1, 'rgba(61,44,36,0.92)');
    g.fillStyle = gr; g.fillRect(20, -130, 70, 130); g.restore();
  } });
  const sBody = furPart(S_BODY, { sd: 160, hatch: 380, fur: 120, extra: S_HPAW, sdx: -8, sdy: -4, dir: (x, y) => -Math.PI / 2 + 0.5 + x / 300, paint: (g) => {
    looseWash(g, S_BIB, C.white, { opacity: 0.92, seed: s(170), shift: 1, reserves: 0 });
    shadeEdge(g, S_BODY, { edge: S_HAUNCH, color: C.shadow, alpha: 0.3, width: 20, dx: 8, dy: -4 });
  }, after: (g) => {
    hatch(g, S_BIB, { color: '#8f7d68', count: 60, len: 8, alpha: 0.4, seed: s(171), dir: () => Math.PI / 2 + 0.2 });
    penLine(g, S_HAUNCH.slice(2, 16), { w: 1.6, alpha: 0.6, seed: s(172) });
    wash(g, S_HPAW, { color: C.fur, opacity: 0.85, under: C.paper, seed: s(173) });
    wash(g, smooth([[20, -16], [46, -18], [58, -6], [44, 2], [20, 2]]), { color: C.sock, opacity: 0.85, seed: s(175) });
    penLine(g, S_HPAW, { closed: true, w: 1.4, alpha: 0.7, seed: s(174) });
  } });
  const sLeg = furPart(S_FLEG, { sd: 180, hatch: 60, fur: 20, dir: () => Math.PI / 2, penPts: [[90, -130], [88, -80], [92, -6], [64, -4], [60, -80], [58, -120]], after: (g) => {
    g.save(); path(g, S_FLEG); g.clip(); const gr = g.createLinearGradient(0, -86, 0, -40); gr.addColorStop(0, 'rgba(61,44,36,0)'); gr.addColorStop(1, 'rgba(61,44,36,0.92)');
    g.fillStyle = gr; g.fillRect(40, -160, 70, 170); g.restore();
  } });

  function drawSit(g, st = {}) {
    const b = st.breath || 0;
    g.save();
    pool(g, 0, 4, 190, 16, '#3a2a1a', 0.22);
    g.save(); g.translate(-80, -20); g.rotate((st.tail || 0) * 0.05); g.translate(80, 20); drawSprite(g, sTail); g.restore();
    drawSprite(g, sFarLeg);
    g.save(); g.scale(1, 1 + b * 0.008); drawSprite(g, sBody); g.restore();
    drawSprite(g, sLeg);
    g.save(); g.translate(S_HEAD_AT[0], S_HEAD_AT[1] - b * 2 + (st.headDY || 0)); g.rotate(S_HEAD_TILT); drawHead(g, st); g.restore();
    if (st.cheese) { g.save(); g.translate(S_HEAD_AT[0], S_HEAD_AT[1]); g.rotate(S_HEAD_TILT); st.cheese(g, 80, 26); g.restore(); }
    g.restore();
  }

  // ---- trotting ----
  const tTail = furPart(T_TAIL, { sd: 200, dir: () => Math.PI + 0.3, hatch: 200, fur: 100, after: (g) => {
    looseWash(g, T_TAIL_TIP, C.white, { opacity: 0.95, seed: s(230), shift: 1, reserves: 0 });
    furEdge(g, T_TAIL_TIP, { color: C.white, count: 40, len: 12, width: 2.4, alpha: 0.95, seed: s(231) });
  } });
  const tBody = furPart(T_BODY, { sd: 240, hatch: 360, fur: 110, paint: (g) => looseWash(g, T_BIB, C.white, { opacity: 0.92, seed: s(250), shift: 1, reserves: 0 }),
    after: (g) => hatch(g, T_BIB, { color: '#8f7d68', count: 40, len: 8, alpha: 0.4, seed: s(251), dir: () => Math.PI / 2 }) });
  const legPart = (shape, dark, sd) => furPart(shape.concat([]), { sd, penPts: shape.slice(Math.floor(shape.length * 0.12), Math.floor(shape.length * 0.92)), color: dark ? shade(C.fur, 0.2) : C.fur, hatch: 50, fur: 14, dir: () => Math.PI / 2, extra: T_PAW, after: (g) => {
    g.save(); path(g, shape); g.clip(); const gr = g.createLinearGradient(0, 70, 0, 120); gr.addColorStop(0, 'rgba(61,44,36,0)'); gr.addColorStop(1, 'rgba(61,44,36,0.92)');
    g.fillStyle = gr; g.fillRect(-50, 0, 100, LEG + 10); g.restore();
    wash(g, T_PAW, { color: C.sock, opacity: 0.95, under: C.paper, seed: s(sd + 20) });
    penLine(g, T_PAW, { closed: true, w: 1.3, alpha: 0.7, seed: s(sd + 21) });
  } });
  const fN = legPart(T_FLEG, false, 260), fF = legPart(T_FLEG, true, 290), hN = legPart(T_HLEG, false, 320), hF = legPart(T_HLEG, true, 350);

  function drawTrot(g, st = {}) {
    const ph = (st.walk ?? 0) * Math.PI * 2, moving = st.walk != null;
    const DROP = 50; // the body is drawn for longer legs; lower it onto the shorter ones
    const swing = (o) => moving ? Math.sin(ph + o) * 0.4 : 0;
    const bob = moving ? Math.abs(Math.sin(ph)) * 5 : 0;
    g.save();
    pool(g, 0, 2, 230, 16, '#3a2a1a', 0.22);
    const limb = (spr, x, o) => { g.save(); g.translate(x, -LEG - DROP - bob * 0.3 - (moving ? Math.max(0, Math.cos(ph + o)) * 9 : 0)); g.rotate(swing(o)); drawSprite(g, spr); g.restore(); };
    g.save(); g.translate(0, DROP);
    limb(fF, 162, Math.PI); limb(hF, -86, 0);
    g.save(); g.translate(0, -bob); g.translate(-148, -200); g.rotate((st.tail || 0) * 0.12 + (moving ? Math.sin(ph * 2) * 0.04 : 0)); g.translate(148, 200); drawSprite(g, tTail); g.restore();
    limb(hN, -108, Math.PI); limb(fN, 140, 0);
    g.save(); g.translate(0, -bob); drawSprite(g, tBody); g.restore();
    g.save(); g.translate(T_HEAD_AT[0], T_HEAD_AT[1] - bob * 1.1 + (st.headDY || 0)); g.rotate(T_HEAD_TILT); drawHead(g, st); g.restore();
    if (st.cheese) { g.save(); g.translate(T_HEAD_AT[0], T_HEAD_AT[1] - bob * 1.1); g.rotate(T_HEAD_TILT); st.cheese(g, 80, 26); g.restore(); }
    g.restore();
    g.restore();
  }
  return { drawSit, drawTrot, drawHead };
}
