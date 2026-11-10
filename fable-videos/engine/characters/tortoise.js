// A gentle old tortoise in profile (facing right), line-and-wash. Poses: walk (slow plod), stand, tucked in.
// Local units: ground at y = 0, origin under the middle of the shell.
import { wash, pool, ellipse, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, rgba, shade, tint, clamp, lerp,
  penLine, hatch, looseWash, path, blooms, soften } from '../watercolor.js';
import { buttonEye, profileMouth, PAPER, INK } from './kit.js';

const C = {
  shell: '#8a7a4a', shellDark: '#5e5232', shellLight: '#b8a86a', rim: '#7a6438', skin: '#9aa070', skinDark: '#6f7650', skinLight: '#c2c494',
  belly: '#d8c690', shadow: '#3f3a22',
};
// the shell: a high, rounded dome with a rim
const DOME = smooth([[-150, -40], [-142, -110], [-96, -168], [-20, -190], [60, -178], [118, -132], [146, -70], [150, -40], [80, -32], [0, -30], [-80, -32]]);
const RIM = smooth([[-162, -44], [-150, -60], [-60, -44], [40, -42], [140, -56], [160, -42], [146, -24], [40, -22], [-60, -22], [-150, -26]]);
// scutes (the plates): a row along the top, plus side plates
const SCUTES = [
  smooth([[-60, -176], [-20, -186], [20, -184], [30, -150], [-10, -140], [-50, -150]]),
  smooth([[30, -180], [70, -170], [96, -146], [70, -126], [36, -134]]),
  smooth([[-70, -168], [-104, -150], [-118, -120], [-86, -110], [-58, -132]]),
  smooth([[-98, -104], [-60, -122], [-20, -128], [-24, -86], [-70, -76], [-120, -80]]),
  smooth([[-14, -128], [36, -128], [74, -118], [70, -76], [20, -72], [-18, -82]]),
  smooth([[80, -116], [114, -122], [134, -86], [130, -60], [80, -68]]),
  smooth([[-136, -90], [-122, -72], [-90, -66], [-110, -50], [-144, -54]]),
];
// head and neck (from the front of the shell)
const NECK = smooth([[0, -16], [40, -30], [86, -40], [104, -20], [90, 6], [44, 10], [0, 14]]); // origin at the neck root
const HEAD = smooth([[78, -46], [104, -62], [136, -60], [158, -44], [164, -24], [150, -8], [120, -2], [92, -10], [80, -26]]);
const JAW = smooth([[118, -12], [152, -14], [148, -6], [130, -2], [118, -4]]);
const JAW_PIV = [118, -14], LIP_TIP = [156, -18];
const EYE = [130, -42];
const LEG = smooth([[-18, -10], [18, -10], [20, 20], [24, 34], [14, 40], [-16, 40], [-22, 32], [-20, 20]]); // from the hip/shoulder
const TAIL = smooth([[0, -6], [-26, 0], [-34, 6], [-20, 6], [0, 6]]);
const NECK_ROOT = [140, -48];

export function makeTortoise(res = 1, seed = 7) {
  const s = (n) => seed * 100 + n;
  const skinPart = (shape, sd, dark = false, extra) => sprite(bbox(shape), res, (g) => {
    wash(g, shape, { color: PAPER, opacity: 1, under: PAPER, seed: s(sd), edge: 0 });
    looseWash(g, shape, dark ? shade(C.skin, 0.18) : C.skin, { opacity: 0.85, seed: s(sd + 1), shift: 2, reserves: 1 });
    if (extra) extra(g);
    shadeEdge(g, shape, { color: C.shadow, alpha: 0.3, width: 12, dy: -5 });
    soften(g, 1 * res);
    // the wrinkly, scaly skin
    const b = bbox(shape);
    for (let k = 0; k < Math.round(b.w * b.h / 260); k++) {
      const x = b.x0 + ((k * 37) % 100) / 100 * b.w, y = b.y0 + ((k * 61) % 100) / 100 * b.h;
      g.save(); path(g, shape); g.clip(); g.strokeStyle = rgba(C.skinDark, 0.5); g.lineWidth = 0.9;
      g.beginPath(); g.arc(x, y, 3.5, Math.PI * 0.1, Math.PI * 0.9); g.stroke(); g.restore();
    }
    penLine(g, shape, { closed: true, color: INK, w: 1.9, alpha: 0.78, seed: s(sd + 2), weight: (t) => 0.3 + 0.9 * Math.max(0, Math.sin(t * Math.PI * 2)) });
  }, { seed: s(sd + 3), grain: 0.12 });

  const shell = sprite(bbox(DOME.concat(RIM)), res, (g) => {
    wash(g, DOME, { color: PAPER, opacity: 1, under: PAPER, seed: s(10), edge: 0 });
    looseWash(g, DOME, C.shell, { opacity: 0.9, seed: s(11), shift: 2, reserves: 2 });
    blooms(g, DOME, ['#9a8a52', '#7a6a3e', '#a89458', '#6e6a3e'], { n: 7, seed: s(12), alpha: 0.3 });
    for (const [i, sc] of SCUTES.entries()) {
      wash(g, sc, { color: i % 2 ? C.shellLight : tint(C.shell, 0.15), opacity: 0.55, seed: s(20 + i), edge: 0.5 });
      // growth rings in each plate
      const b = bbox(sc), cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      g.save(); path(g, sc); g.clip();
      for (let r = 1; r <= 3; r++) penLine(g, sc.map(([x, y]) => [cx + (x - cx) * (1 - r * 0.22), cy + (y - cy) * (1 - r * 0.22)]), { closed: true, color: C.shellDark, w: 1, alpha: 0.4, seed: s(30 + i * 3 + r) });
      g.restore();
      penLine(g, sc, { closed: true, color: INK, w: 1.6, alpha: 0.6, seed: s(40 + i) });
    }
    shadeEdge(g, DOME, { color: C.shadow, alpha: 0.4, width: 40, dy: -16 });
    glaze(g, DOME, -40, -170, 80, 22, '#e6d8a0', 0.55);           // light catching the top of the shell
    soften(g, 0.9 * res);
    hatch(g, DOME, { color: '#3e3420', count: 160, len: 7, width: 0.7, alpha: 0.35, seed: s(50), dir: () => Math.PI / 2 + 0.3,
      density: (x, y) => clamp((y + 160) / 140) });
    wash(g, RIM, { color: PAPER, opacity: 1, under: PAPER, seed: s(51), edge: 0 });
    looseWash(g, RIM, C.rim, { opacity: 0.9, seed: s(52), shift: 1, reserves: 0 });
    for (let k = 0; k < 12; k++) { const x = -150 + k * 26; penLine(g, [[x, -26], [x + 4, -46]], { color: INK, w: 1.2, alpha: 0.5 }); }
    glaze(g, RIM, 0, -30, 140, 8, C.belly, 0.6);
    penLine(g, RIM, { closed: true, color: INK, w: 1.8, alpha: 0.75, seed: s(53) });
    penLine(g, DOME.slice(0, Math.floor(DOME.length * 0.72)), { color: INK, w: 2.4, alpha: 0.8, seed: s(54), weight: (t) => 0.3 + 0.9 * Math.sin(t * Math.PI) });
  }, { seed: s(55), grain: 0.12 });

  const neck = skinPart(NECK, 60);
  const head = skinPart(HEAD, 70, false, (g) => { glaze(g, HEAD, 130, -56, 22, 10, C.skinLight, 0.6); pool(g, 138, -26, 10, 6, '#d88a7a', 0.35); });
  const jaw = sprite(bbox(JAW), res, (g) => { wash(g, JAW, { color: C.belly, opacity: 0.95, under: PAPER, seed: s(80) }); }, { seed: s(81) });
  const legN = skinPart(LEG, 90), legF = skinPart(LEG, 95, true);
  const tail = skinPart(TAIL, 99, true);

  // the head and neck stretch out from the shell (out: 0 = tucked in .. 1 = out)
  function drawNeckHead(g, st) {
    const out = st.out ?? 1, a = st.neckLift || 0;
    g.save();
    g.translate(NECK_ROOT[0] - 70 * (1 - out), NECK_ROOT[1] + 10 * (1 - out));
    g.rotate(-a);
    g.translate(-0, 0);
    drawSprite(g, neck);
    g.save(); g.translate(0, st.headDY || 0); g.rotate(st.headTilt || 0);
    g.translate(92, -26); g.scale(1.22, 1.22); g.translate(-92, 26); // a big, sweet head
    drawSprite(g, head);
    profileMouth(g, jaw, JAW_PIV, LIP_TIP, st.mouth || 0, st.smile ?? 0.5, { open: 0.38, bow: 1 });
    buttonEye(g, EYE[0], EYE[1], st.eyes ?? 1, { R: 7, happy: st.happy, sly: st.sleepy || 0 });
    // a heavy, kindly brow
    g.strokeStyle = rgba(INK, 0.55); g.lineWidth = 1.8; g.lineCap = 'round';
    g.beginPath(); g.moveTo(EYE[0] - 11, EYE[1] - 9 - (st.browUp || 0) * 4); g.quadraticCurveTo(EYE[0], EYE[1] - 15 - (st.browUp || 0) * 5, EYE[0] + 12, EYE[1] - 10); g.stroke();
    g.restore();
    g.restore();
  }
  // st.walk: phase in cycles (null = standing); st.out: head out (0 tucked .. 1 out)
  function draw(g, st = {}) {
    const p = (st.walk ?? 0) * Math.PI * 2, moving = st.walk != null;
    const step = (o) => moving ? Math.sin(p + o) : 0;
    const lift = (o) => moving ? Math.max(0, Math.cos(p + o)) * 6 : 0;
    const bob = moving ? Math.abs(Math.sin(p)) * 2 : (st.breath || 0) * 1;
    const legsIn = st.legsIn || 0;
    g.save();
    pool(g, 0, 2, 190, 14, '#3a2a1a', 0.26);
    const leg = (spr, x, o) => { g.save(); g.translate(x + step(o) * 14, -36 + 20 * legsIn - lift(o)); g.rotate(step(o) * 0.25); g.scale(1, 1 - 0.6 * legsIn); drawSprite(g, spr); g.restore(); };
    leg(legF, 80, Math.PI); leg(legF, -60, 0);
    g.save(); g.translate(-152, -36); drawSprite(g, tail); g.restore();
    g.save(); g.translate(0, -bob + 14 * legsIn); drawSprite(g, shell); g.restore();
    if ((st.out ?? 1) > 0.02) { g.save(); g.translate(0, -bob + 14 * legsIn); drawNeckHead(g, st); g.restore(); }
    leg(legN, 100, 0); leg(legN, -84, Math.PI);
    if ((st.out ?? 1) <= 0.02) { // tucked in: just a glimpse of a sleepy face in the shell opening
      g.save(); g.translate(0, 14 * legsIn);
      g.fillStyle = '#2a2418'; g.beginPath(); g.ellipse(146, -46, 14, 16, 0, 0, 7); g.fill();
      g.restore();
    }
    g.restore();
  }
  return { draw };
}
