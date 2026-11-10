// A charming, slightly sly fox, facing right. Two bodies (trotting, sitting) share one
// expressive front-facing head. Local units: ground at y = 0, origin under the middle.
import { wash, ink, strokes, pool, ellipse, smooth, ribbon, bbox, sprite, drawSprite, shadeEdge, glaze, tuft, pencil,
  rng, rgba, shade, tint, clamp } from '../watercolor.js';

const C = {
  fur: '#d8743a', furDark: '#a24d22', furLight: '#f0a25e', white: '#f6ecdc', sock: '#4a3328', sockLight: '#6b4c3c',
  ink: '#3e2a20', eye: '#c98a2e', nose: '#2e211b', pink: '#e09a8a', shadow: '#7a3416',
};

// ---- head (front-facing), centred at HC ----
const HC = [0, 0];
const FACE = smooth([[-72, -40], [-56, -70], [0, -82], [56, -70], [72, -40], [80, 0], [58, 34], [26, 60], [0, 70], [-26, 60], [-58, 34], [-80, 0]]);
const CHEEK_L = smooth([[-80, 0], [-58, 34], [-26, 58], [-6, 64], [-10, 30], [-36, 8]]);
const CHEEK_R = CHEEK_L.map(([x, y]) => [-x, y]);
const MUZZLE = smooth([[-24, 22], [0, 14], [24, 22], [20, 50], [0, 66], [-20, 50]]);
const EAR_L = smooth([[-68, -48], [-86, -128], [-74, -150], [-40, -96], [-28, -70]]);
const EAR_R = EAR_L.map(([x, y]) => [-x, y]);
const EARIN_L = smooth([[-62, -60], [-76, -122], [-68, -134], [-46, -94], [-38, -72]]);
const EARIN_R = EARIN_L.map(([x, y]) => [-x, y]);
const EARTIP_L = smooth([[-80, -112], [-86, -128], [-74, -150], [-60, -122]]);
const EARTIP_R = EARTIP_L.map(([x, y]) => [-x, y]);
export const FOX_EYES = [[-30, -14], [30, -14]];

// ---- trotting body (facing right) ----
const TORSO = smooth([[-120, -214], [-50, -240], [40, -238], [112, -234], [158, -198], [146, -152], [50, -138], [-50, -140], [-120, -152], [-142, -184]]);
const LEG = 150;
const FLEG = smooth([[-18, -6], [18, -6], [14, 70], [12, LEG - 8], [-12, LEG - 8], [-14, 70]]);
const HLEG = smooth([[-34, -26], [30, -26], [26, 40], [12, 90], [12, LEG - 8], [-12, LEG - 8], [-14, 96], [-30, 40]]);
const PAW = ellipse(6, LEG - 4, 18, 9, 18);
const TAIL = smooth([[-150, -205], [-215, -238], [-292, -228], [-342, -186], [-356, -140], [-330, -116], [-284, -138], [-226, -158], [-168, -168]]);
const TAIL_TIP = smooth([[-318, -206], [-342, -186], [-356, -140], [-336, -118], [-312, -134], [-304, -170]]);
const HEAD_TROT = [166, -262];

// ---- sitting body (facing right, chest upright) ----
const SIT_BODY = smooth([[-70, -10], [-110, -70], [-96, -150], [-40, -210], [30, -250], [80, -232], [96, -170], [80, -90], [60, -10], [0, 4]]);
const SIT_CHEST = smooth([[40, -238], [84, -224], [96, -170], [84, -110], [52, -96], [36, -160]]);
const SIT_HAUNCH = ellipse(-56, -64, 70, 62, 30);
const SIT_FLEG = smooth([[46, -120], [78, -120], [76, -60], [74, -6], [50, -6], [50, -60]]);
const SIT_TAIL = smooth([[-90, -30], [-150, -30], [-190, -10], [-160, 10], [-60, 14], [40, 14], [120, 6], [150, -6], [120, -22], [40, -10], [-40, -14]]);
const SIT_TAIL_TIP = smooth([[96, -2], [150, -6], [122, -22], [90, -14]]);
const HEAD_SIT = [62, -300];

export function makeFox(res = 1, seed = 3) {
  const s = (n) => seed * 100 + n;
  const furred = (g, shape, col, sd, dir, n = 1) => {
    strokes(g, shape, { color: C.furDark, count: Math.round(160 * n), len: 9, width: 1, alpha: 0.28, seed: s(sd), dir, curve: 0.3 });
    strokes(g, shape, { color: '#ffd2a0', count: Math.round(60 * n), len: 8, width: 0.9, alpha: 0.3, seed: s(sd + 1), dir, curve: 0.3 });
  };

  const head = sprite(bbox(FACE.concat(EAR_L, EAR_R)), res, (g) => {
    for (const [e, ei, et, n] of [[EAR_L, EARIN_L, EARTIP_L, 0], [EAR_R, EARIN_R, EARTIP_R, 1]]) {
      wash(g, e, { under: true, color: C.fur, opacity: 0.95, seed: s(10 + n) });
      wash(g, ei, { color: C.white, opacity: 0.85, seed: s(12 + n), edge: 0.1 });
      glaze(g, ei, 0, -90, 80, 30, C.pink, 0.25);
      wash(g, et, { color: C.sock, opacity: 0.9, seed: s(14 + n) });
      pencil(g, e, { closed: true, seed: s(16 + n), alpha: 0.5 });
    }
    wash(g, FACE, { under: true, color: C.fur, opacity: 0.95, seed: s(20), bleed: 0.025 });
    glaze(g, FACE, 0, -50, 60, 30, C.furLight, 0.6);
    shadeEdge(g, FACE, { color: C.shadow, alpha: 0.25, width: 18, dy: -5 });
    furred(g, FACE, C.fur, 21, (x, y) => Math.atan2(y + 10, x) * 0.6 - Math.PI / 2, 0.6);
    for (const [ch, n] of [[CHEEK_L, 0], [CHEEK_R, 1]]) {
      wash(g, ch, { color: C.white, opacity: 0.95, seed: s(24 + n), bleed: 0.03 });
      strokes(g, ch, { color: '#c9b49a', count: 30, len: 6, width: 0.8, alpha: 0.35, seed: s(26 + n), dir: () => (n ? -0.6 : Math.PI + 0.6) });
    }
    wash(g, MUZZLE, { color: C.white, opacity: 0.95, seed: s(28) });
    shadeEdge(g, MUZZLE, { color: '#b09a80', alpha: 0.3, width: 8, dy: -3 });
    pool(g, -46, 18, 16, 10, C.pink, 0.4); pool(g, 46, 18, 16, 10, C.pink, 0.4);
    // nose
    const nose = smooth([[-11, 18], [0, 15], [11, 18], [6, 28], [0, 30], [-6, 28]]);
    wash(g, nose, { color: C.nose, opacity: 0.97, seed: s(30), under: true, bleed: 0.01 });
    pool(g, -3, 19, 4, 2, '#ffffff', 0.6);
    ink(g, [[0, 30], [0, 40]], { alpha: 0.6, seed: s(31), width: 1.4 });
    g.save(); g.strokeStyle = rgba(C.ink, 0.3); g.lineWidth = 0.7;
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(sd * 22, 34 + i * 5); g.quadraticCurveTo(sd * 50, 30 + i * 6, sd * 76, 36 + i * 10); g.stroke(); }
    g.restore();
    pencil(g, FACE, { closed: true, seed: s(32), alpha: 0.5 });
  }, { seed: s(33) });

  // a wide fluffy tail (shared look for both poses)
  const tailSprite = (shape, tip, sd) => sprite(bbox(shape), res, (g) => {
    wash(g, shape, { under: true, color: C.fur, opacity: 0.94, seed: s(sd), bleed: 0.04 });
    shadeEdge(g, shape, { color: C.shadow, alpha: 0.35, width: 20, dy: -8 });
    shadeEdge(g, shape, { color: C.furLight, alpha: 0.5, width: 16, dy: 8 });
    wash(g, tip, { color: C.white, opacity: 0.95, seed: s(sd + 1), bleed: 0.05 });
    strokes(g, shape, { color: C.furDark, count: 200, len: 13, width: 1, alpha: 0.3, seed: s(sd + 2), dir: (x, y) => Math.atan2(y - shape[0][1], x - shape[0][0]), curve: 0.4 });
    strokes(g, tip, { color: '#cbb89f', count: 30, len: 9, width: 0.8, alpha: 0.4, seed: s(sd + 3), dir: () => Math.PI });
    pencil(g, shape, { closed: true, seed: s(sd + 4), alpha: 0.45 });
  }, { seed: s(sd + 5) });
  const tail = tailSprite(TAIL, TAIL_TIP, 40);
  const sitTail = tailSprite(SIT_TAIL, SIT_TAIL_TIP, 50);

  const torso = sprite(bbox(TORSO), res, (g) => {
    wash(g, TORSO, { under: true, color: C.fur, opacity: 0.94, seed: s(60) });
    glaze(g, TORSO, 120, -160, 70, 25, C.white, 0.85); // pale chest
    glaze(g, TORSO, 0, -150, 140, 18, '#f3c79a', 0.5);
    shadeEdge(g, TORSO, { color: C.shadow, alpha: 0.38, width: 26, dy: -10 });
    shadeEdge(g, TORSO, { color: C.furLight, alpha: 0.55, width: 22, dy: 10 });
    furred(g, TORSO, C.fur, 61, () => Math.PI + 0.1);
    pencil(g, TORSO, { closed: true, seed: s(63), alpha: 0.45 });
  }, { seed: s(64) });
  const legSprite = (shape, dark, sd) => sprite(bbox(shape.concat(PAW)), res, (g) => {
    wash(g, shape, { under: true, color: dark ? shade(C.fur, 0.2) : C.fur, opacity: 0.94, seed: s(sd) });
    // dark socks on the lower leg, like a real fox
    g.save(); g.beginPath(); g.rect(-60, 84, 120, 200); g.clip();
    wash(g, shape, { color: dark ? shade(C.sock, 0.1) : C.sock, opacity: 0.95, seed: s(sd + 1) });
    g.restore();
    wash(g, PAW, { under: true, color: dark ? shade(C.sock, 0.15) : C.sock, opacity: 0.97, seed: s(sd + 2) });
    shadeEdge(g, shape, { color: C.shadow, alpha: 0.3, width: 10, dx: 4 });
    pencil(g, shape, { closed: true, seed: s(sd + 3), alpha: dark ? 0.3 : 0.45 });
  }, { seed: s(sd + 4) });
  const fNear = legSprite(FLEG, false, 70), fFar = legSprite(FLEG, true, 76);
  const hNear = legSprite(HLEG, false, 82), hFar = legSprite(HLEG, true, 88);

  const sitBody = sprite(bbox(SIT_BODY.concat(SIT_FLEG)), res, (g) => {
    wash(g, SIT_BODY, { under: true, color: C.fur, opacity: 0.94, seed: s(90) });
    shadeEdge(g, SIT_BODY, { color: C.shadow, alpha: 0.35, width: 26, dx: -10 });
    shadeEdge(g, SIT_BODY, { edge: SIT_HAUNCH, color: C.shadow, alpha: 0.3, width: 18, dx: 6, dy: -4 });
    glaze(g, SIT_BODY, -70, -90, 50, 40, C.furLight, 0.5);
    furred(g, SIT_BODY, C.fur, 91, (x, y) => -Math.PI / 2 + 0.4 + x / 400);
    wash(g, SIT_CHEST, { color: C.white, opacity: 0.95, seed: s(93), bleed: 0.03 });
    strokes(g, SIT_CHEST, { color: '#c9b49a', count: 40, len: 7, width: 0.8, alpha: 0.35, seed: s(94), dir: () => Math.PI / 2 });
    pencil(g, SIT_BODY, { closed: true, seed: s(95), alpha: 0.45 });
    wash(g, SIT_FLEG, { under: true, color: C.fur, opacity: 0.94, seed: s(96) });
    g.save(); g.beginPath(); g.rect(30, -66, 70, 80); g.clip(); wash(g, SIT_FLEG, { color: C.sock, opacity: 0.95, seed: s(97) }); g.restore();
    wash(g, ellipse(68, -6, 22, 9, 18), { under: true, color: C.sock, opacity: 0.97, seed: s(98) });
    pencil(g, SIT_FLEG, { closed: true, seed: s(99), alpha: 0.45 });
  }, { seed: s(100) });

  function eye(g, x, y, open, happy, sly) {
    g.save(); g.lineCap = 'round';
    if (open < 0.12) {
      g.strokeStyle = rgba(C.ink, 0.9); g.lineWidth = 3;
      g.beginPath();
      if (happy) g.arc(x, y + 5, 11, Math.PI * 1.15, Math.PI * 1.85); else g.arc(x, y - 5, 11, Math.PI * 0.15, Math.PI * 0.85);
      g.stroke();
    } else {
      const ry = 11 * open;
      g.fillStyle = '#fbf3e2'; g.beginPath(); g.ellipse(x, y, 12, ry + 1, 0, 0, 7); g.fill();
      const ig = g.createRadialGradient(x, y + 2, 1, x, y, 10); ig.addColorStop(0, '#f0c060'); ig.addColorStop(1, '#a8621c');
      g.fillStyle = ig; g.beginPath(); g.ellipse(x, y, 9.5, Math.min(9.5, ry), 0, 0, 7); g.fill();
      g.fillStyle = '#22150e'; g.beginPath(); g.ellipse(x, y + 1, 5, Math.min(7, ry * 0.85), 0, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.arc(x - 3.5, y - 3 * open, 2.6, 0, 7); g.fill();
      // a sly, heavy upper lid
      g.strokeStyle = rgba(C.ink, 0.9); g.lineWidth = 3;
      const lid = (sly || 0) * 5;
      g.beginPath(); g.ellipse(x, y + lid * 0.4, 13.5, ry + 1.5 - lid * 0.2, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      if (sly > 0.05) { g.fillStyle = C.fur; g.beginPath(); g.ellipse(x, y - ry - 2 + lid * 1.2, 15, lid * 1.1, 0, 0, Math.PI); g.fill(); }
    }
    g.restore();
  }
  // expression: eyes [l,r], happy, sly (0..1), mouth (0..1), smile, browUp, browL (one brow raised), headTilt
  function drawHead(g, st = {}) {
    g.save();
    g.rotate(st.headTilt || 0);
    drawSprite(g, head);
    const eo = st.eyes || [1, 1];
    eye(g, FOX_EYES[0][0], FOX_EYES[0][1], eo[0], st.happy, st.sly);
    eye(g, FOX_EYES[1][0], FOX_EYES[1][1], eo[1], st.happy, st.sly);
    const bu = (st.browUp || 0) * 7, bl = (st.browL || 0) * 8;
    g.strokeStyle = rgba(C.ink, 0.55); g.lineWidth = 2.2; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-44, -36 - bu - bl * 0.6); g.quadraticCurveTo(-30, -44 - bu - bl, -16, -38 - bu - bl * 0.4); g.stroke();
    g.beginPath(); g.moveTo(16, -38 - bu); g.quadraticCurveTo(30, -44 - bu, 44, -36 - bu); g.stroke();
    // one-piece mouth: a little smile that opens downward
    const m = clamp(st.mouth || 0), sm = st.smile || 0;
    const lx = -16 - 2 * m, rx = 16 + 2 * m, cy = 42 - sm * 4, mid = 42;
    const upper = () => { g.moveTo(lx, cy); g.quadraticCurveTo(-8, 48 + sm * 2, 0, mid); g.quadraticCurveTo(8, 48 + sm * 2, rx, cy); };
    g.strokeStyle = rgba(C.ink, 0.75); g.lineWidth = 2;
    if (m > 0.04) {
      const bot = 46 + 14 * m;
      const shape = () => { g.beginPath(); upper(); g.bezierCurveTo(rx - 1, bot + 2, lx + 1, bot + 2, lx, cy); g.closePath(); };
      shape(); g.save(); g.fillStyle = '#6b2f28'; g.fill(); g.clip();
      g.fillStyle = '#d8857c'; g.beginPath(); g.ellipse(0, bot, 9, 2 + 4 * m, 0, 0, 7); g.fill(); g.restore();
      shape(); g.stroke();
    } else { g.beginPath(); upper(); g.stroke(); }
    g.restore();
  }

  // trotting / standing. st.walk: phase in cycles (null = standing), st.tail swish
  function drawTrot(g, st = {}) {
    const ph = (st.walk ?? 0) * Math.PI * 2, moving = st.walk != null;
    const swing = (o) => moving ? Math.sin(ph + o) * 0.42 : 0;
    const bob = moving ? Math.abs(Math.sin(ph)) * 5 : 0;
    g.save();
    pool(g, 0, 2, 230, 18, '#4a3020', 0.25);
    const limb = (spr, x, o) => { g.save(); g.translate(x, -LEG - bob * 0.3 - (moving ? Math.max(0, Math.cos(ph + o)) * 8 : 0)); g.rotate(swing(o)); drawSprite(g, spr); g.restore(); };
    limb(fFar, 116, Math.PI); limb(hFar, -84, 0);
    g.save(); g.translate(30, -bob); g.translate(-160, -190); g.rotate((st.tail || 0) * 0.15 + (moving ? Math.sin(ph * 2) * 0.05 : 0)); g.translate(160, 190); drawSprite(g, tail); g.restore();
    limb(hNear, -104, Math.PI); limb(fNear, 94, 0);
    g.save(); g.translate(0, -bob); drawSprite(g, torso); g.restore();
    g.save(); g.translate(HEAD_TROT[0], HEAD_TROT[1] - bob * 1.2 + (st.headDY || 0)); drawHead(g, st); g.restore();
    g.restore();
  }
  // sitting upright, looking up
  function drawSit(g, st = {}) {
    const b = (st.breath || 0);
    g.save();
    pool(g, 0, 4, 180, 18, '#4a3020', 0.25);
    g.save(); g.translate(-90, -10); g.rotate((st.tail || 0) * 0.06); g.translate(90, 10); drawSprite(g, sitTail); g.restore();
    g.save(); g.translate(0, 0); g.scale(1, 1 + b * 0.01); drawSprite(g, sitBody); g.restore();
    g.save(); g.translate(HEAD_SIT[0], HEAD_SIT[1] - b * 2 + (st.headDY || 0)); drawHead(g, st); g.restore();
    g.restore();
  }
  return { drawTrot, drawSit, drawHead };
}
