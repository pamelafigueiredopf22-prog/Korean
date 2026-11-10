// A young, springy hare in profile (facing right), line-and-wash. Poses: sit, run (gallop), sleep.
// Local units: ground at y = 0, origin under the hips.
import { wash, pool, ellipse, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, furEdge, rgba, shade, tint, clamp, lerp,
  penLine, hatch, looseWash, path, drawBent } from '../watercolor.js';
import { makeFurPart, buttonEye, profileMouth, PAPER, INK } from './kit.js';

const C = {
  fur: '#b98a5c', furDark: '#7a5434', furLight: '#d9b88c', white: '#f3ebdc', pink: '#e6a49a', tip: '#3e2f26',
  shadow: '#5e3e24', hatch: '#4e3420', blooms: ['#c4945e', '#a87a4e', '#d6a874', '#9a7048'],
};

// ---- head (profile), origin at the skull centre
const HEAD = smooth([[-44, -8], [-40, -36], [-16, -50], [16, -48], [42, -34], [60, -14], [68, 4], [62, 18], [42, 28], [12, 34], [-20, 30], [-42, 14]]);
const MUZ = smooth([[30, 4], [56, -4], [68, 4], [62, 18], [44, 24], [30, 18]]);
const JAW = smooth([[42, 18], [62, 14], [60, 22], [50, 28], [42, 28]]);
const JAW_PIV = [42, 19], LIP_TIP = [63, 13];
const EYE = [18, -14];
const EAR = smooth([[-12, 0], [-22, -60], [-24, -112], [-12, -128], [2, -114], [6, -60], [8, 0]]);   // drawn from its base at (0,0)
const EAR_IN = smooth([[-8, -12], [-16, -60], [-17, -104], [-10, -114], [-2, -102], [1, -60], [3, -12]]);
const EAR_TIP = smooth([[-20, -96], [-24, -112], [-12, -128], [2, -114], [4, -98]]);
const EAR_BASE_N = [-6, -40], EAR_BASE_F = [-22, -36];

// ---- body, horizontal, origin under the hips
const TORSO = smooth([[-120, -36], [-118, -92], [-70, -134], [10, -142], [80, -126], [124, -92], [134, -56], [112, -28], [50, -20], [-30, -14], [-96, -16]]);
const HAUNCH = ellipse(-62, -74, 64, 58, 32);
const BELLY = smooth([[110, -40], [130, -70], [124, -98], [104, -60], [60, -30], [20, -24]]);
const TAIL = ellipse(0, 0, 18, 16, 20);
const TAIL_AT = [-122, -70];
const SHOULDER = [96, -64], HIP_FOOT = [-60, -18];
const FLEG = smooth([[-12, -6], [12, -6], [10, 60], [18, 84], [14, 94], [-8, 94], [-10, 60]]);   // from shoulder (0,0) down to paw
const FOOT = smooth([[-16, -12], [10, -14], [84, -11], [104, -4], [96, 5], [-12, 5], [-22, -2]]);  // long hind foot from heel (0,0)
const HEAD_AT = [128, -132];
// ---- sitting upright
const SIT = smooth([[-62, -6], [-74, -60], [-58, -120], [-20, -164], [26, -178], [56, -160], [62, -116], [54, -64], [40, -22], [10, -4]]);
const SIT_HAUNCH = ellipse(-26, -54, 48, 50, 30);
const SIT_BIB = smooth([[30, -172], [58, -156], [62, -112], [50, -70], [34, -90], [28, -140]]);
const SIT_HEAD = [44, -206];

export function makeHare(res = 1, seed = 6, o = {}) {
  const pal = { ...C, ...(o.colors || {}) };
  const s = (n) => seed * 100 + n;
  const fur = makeFurPart(res, seed, pal);
  const earSprite = (dark) => sprite(bbox(EAR), res, (g) => {
    wash(g, EAR, { color: PAPER, opacity: 1, under: PAPER, seed: s(1), edge: 0 });
    looseWash(g, EAR, dark ? shade(pal.fur, 0.15) : pal.fur, { opacity: 0.85, seed: s(2), shift: 2, reserves: 0 });
    if (!dark) { looseWash(g, EAR_IN, pal.pink, { opacity: 0.6, seed: s(3), shift: 1, reserves: 0 }); hatch(g, EAR_IN, { color: '#a0645e', count: 25, len: 8, alpha: 0.35, seed: s(4), dir: () => -Math.PI / 2 }); }
    g.save(); path(g, EAR); g.clip(); wash(g, EAR_TIP, { color: pal.tip, opacity: 0.85, seed: s(5), bleed: 0.06 }); g.restore();
    furEdge(g, EAR, { color: pal.fur, count: 30, len: 6, width: 1.4, alpha: 0.7, seed: s(6) });
    penLine(g, EAR, { closed: true, color: INK, w: 1.8, alpha: 0.75, seed: s(7), weight: (t) => 0.3 + 0.8 * Math.sin(t * Math.PI) });
  }, { seed: s(8), grain: 0.12 });
  const earN = earSprite(false), earF = earSprite(true);
  const head = fur(HEAD, { sd: 10, hatch: 120, fur: 50, dir: (x) => Math.PI + (x > 20 ? 0.05 : 0.3), shadeW: 14, paint: (g) => {
    looseWash(g, MUZ, pal.white, { opacity: 0.75, seed: s(20), shift: 1, reserves: 0 });
    glaze(g, HEAD, 14, -30, 26, 12, pal.furLight, 0.5);
  }, after: (g) => {
    pool(g, 30, 8, 14, 9, '#e2867a', 0.45);
    g.fillStyle = '#c97a72'; g.beginPath(); g.moveTo(62, 2); g.quadraticCurveTo(70, 0, 68, 8); g.quadraticCurveTo(64, 10, 62, 2); g.fill(); // little nose
    g.save(); g.strokeStyle = rgba(INK, 0.3); g.lineWidth = 0.7;
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(58, 10 + i * 2); g.quadraticCurveTo(76, 6 + i * 6, 96, 4 + i * 10); g.stroke(); }
    g.restore();
  } });
  const jaw = sprite(bbox(JAW), res, (g) => { wash(g, JAW, { color: pal.white, opacity: 0.95, under: PAPER, seed: s(21) }); }, { seed: s(22) });
  const torso = fur(TORSO, { sd: 30, hatch: 320, fur: 110, dir: (x) => Math.PI + 0.1, shadeW: 26, paint: (g) => {
    looseWash(g, BELLY, pal.white, { opacity: 0.85, seed: s(31), shift: 1, reserves: 0 });
    shadeEdge(g, TORSO, { edge: HAUNCH, color: pal.shadow, alpha: 0.3, width: 18, dx: 8, dy: -4 });
    glaze(g, TORSO, 0, -128, 90, 16, pal.furLight, 0.55);
  }, after: (g) => penLine(g, HAUNCH.slice(4, 20), { w: 1.5, alpha: 0.5, color: INK }) });
  const sit = fur(SIT, { sd: 80, hatch: 260, fur: 90, dir: (x, y) => -Math.PI / 2 + 0.4 + x / 300, sdx: -8, sdy: -2, paint: (g) => {
    looseWash(g, SIT_BIB, pal.white, { opacity: 0.85, seed: s(81), shift: 1, reserves: 0 });
    shadeEdge(g, SIT, { edge: SIT_HAUNCH, color: pal.shadow, alpha: 0.3, width: 16, dx: 6, dy: -4 });
  }, after: (g) => penLine(g, SIT_HAUNCH.slice(2, 18), { w: 1.4, alpha: 0.5, color: INK }) });
  const tail = sprite(bbox(TAIL), res, (g) => {
    wash(g, TAIL, { color: pal.white, opacity: 1, under: PAPER, seed: s(40) });
    furEdge(g, TAIL, { color: pal.white, count: 50, len: 8, width: 2.2, alpha: 0.95, seed: s(41) });
    penLine(g, TAIL.slice(4, 16), { w: 1.2, alpha: 0.4 });
  }, { seed: s(42) });
  const legN = fur(FLEG, { sd: 50, hatch: 40, fur: 14, dir: () => Math.PI / 2, shadeW: 8, sdx: 4, sdy: 0, penPts: FLEG.slice(2, -2) });
  const legF = fur(FLEG, { sd: 56, color: shade(pal.fur, 0.18), hatch: 30, fur: 10, dir: () => Math.PI / 2, shadeW: 8, sdx: 4, sdy: 0, penPts: FLEG.slice(2, -2) });
  const footN = fur(FOOT, { sd: 62, hatch: 40, fur: 18, dir: () => 0, shadeW: 8, paint: (g) => glaze(g, FOOT, 50, 0, 40, 4, pal.white, 0.6) });
  const footF = fur(FOOT, { sd: 68, color: shade(pal.fur, 0.18), hatch: 30, fur: 12, dir: () => 0, shadeW: 8 });

  // st: mouth, smile, eyes (0..1), happy, sly, earsBack (0..1), earL/earR wiggle, headTilt
  function drawHead(g, st = {}) {
    g.save(); g.rotate(st.headTilt || 0);
    const back = st.earsBack || 0, wig = st.earWiggle || 0;
    g.save(); g.translate(...EAR_BASE_F); g.rotate(-0.25 - back * 1.15 + wig * 0.1); drawSprite(g, earF); g.restore();
    drawSprite(g, head);
    profileMouth(g, jaw, JAW_PIV, LIP_TIP, st.mouth || 0, st.smile || 0, { open: 0.42, bow: 1.5 });
    buttonEye(g, EYE[0], EYE[1], st.eyes ?? 1, { R: 7.5, happy: st.happy, sly: st.sly || 0 });
    const bu = (st.browUp || 0) * 5;
    g.strokeStyle = rgba(INK, 0.5); g.lineWidth = 1.6; g.beginPath(); g.moveTo(EYE[0] - 10, EYE[1] - 12 - bu); g.quadraticCurveTo(EYE[0], EYE[1] - 17 - bu * 1.2, EYE[0] + 10, EYE[1] - 12 - bu * 0.6); g.stroke();
    g.save(); g.translate(...EAR_BASE_N); g.rotate(-0.12 - back * 1.25 - wig * 0.12); drawSprite(g, earN); g.restore();
    g.restore();
  }
  // a generic body draw: tilt (body pitch around the hips), legs: {fN, fF, hN, hF} angles, lift (y offset)
  function body(g, st, pose) {
    const { tilt = 0, lift = 0, fN = 0, fF = 0, hN = 0, hF = 0, headDY = 0, headTilt = 0, squash = 1, tuckLegs = false } = pose;
    g.save();
    pool(g, 10, 2, 170, 14, '#3a2a1a', 0.22 * (1 - Math.min(1, lift / 120)));
    g.translate(0, -lift);
    // far legs
    g.save(); g.translate(-96, -16); g.rotate(tilt); g.translate(96, 16);
    if (!tuckLegs) { g.save(); g.translate(SHOULDER[0] - 16, SHOULDER[1] + 4); g.rotate(fF); drawSprite(g, legF); g.restore(); }
    g.save(); g.translate(HIP_FOOT[0] - 14, HIP_FOOT[1]); g.rotate(hF); drawSprite(g, footF); g.restore();
    g.save(); g.translate(TAIL_AT[0], TAIL_AT[1]); drawSprite(g, tail); g.restore();
    g.save(); g.translate(0, -60); g.scale(1, squash); g.translate(0, 60); drawSprite(g, torso); g.restore();
    g.save(); g.translate(HIP_FOOT[0], HIP_FOOT[1] + 4); g.rotate(hN); drawSprite(g, footN); g.restore();
    if (!tuckLegs) { g.save(); g.translate(SHOULDER[0], SHOULDER[1]); g.rotate(fN); drawSprite(g, legN); g.restore(); }
    g.save(); g.translate(HEAD_AT[0], HEAD_AT[1] + headDY); g.rotate(headTilt - tilt * 0.85); drawHead(g, st); g.restore();
    g.restore();
    g.restore();
  }
  // sitting up, front paws on the ground, ears up
  function drawSit(g, st = {}) {
    const b = st.breath || 0;
    g.save();
    pool(g, 0, 2, 120, 12, '#3a2a1a', 0.22);
    g.save(); g.translate(-70, -30); drawSprite(g, tail); g.restore();
    g.save(); g.translate(-30, -2); g.rotate(-0.04); drawSprite(g, footF); g.restore();
    g.save(); g.translate(30, -112); g.rotate(-0.05); drawSprite(g, legF); g.restore();
    g.save(); g.scale(1, 1 + b * 0.008); drawSprite(g, sit); g.restore();
    g.save(); g.translate(-46, 2); drawSprite(g, footN); g.restore();
    g.save(); g.translate(44, -114); g.rotate(0.02 - (st.pawWave || 0) * 1.6); drawSprite(g, legN); g.restore();
    g.save(); g.translate(SIT_HEAD[0], SIT_HEAD[1] - b * 2 + (st.headDY || 0)); g.rotate((st.headTilt || 0) - 0.08); drawHead(g, st); g.restore();
    g.restore();
  }
  // galloping: st.run = phase in cycles. Front legs reach forward as the hind feet push back, then both gather.
  function drawRun(g, st = {}) {
    const p = (st.run || 0) % 1, a = Math.PI * 2 * p;
    const ext = Math.sin(a);                 // +1 stretched out, -1 gathered
    const lift = Math.max(0, Math.sin(a + 0.5)) * 52;
    body(g, { ...st, earsBack: Math.max(st.earsBack || 0, 0.6) }, {
      tilt: -0.1 * ext, lift, fN: -1.1 * ext + 0.15, fF: -1.1 * ext + 0.45, hN: 1.4 + 1.25 * ext, hF: 1.3 + 1.25 * ext,
      headDY: 4 * Math.sin(a), headTilt: 0.12 + (st.headTilt || 0) });
  }
  // asleep: low, legs tucked, ears laid back, head resting on the front paws
  function drawSleep(g, st = {}) {
    const b = st.breath || 0;
    body(g, { ...st, eyes: st.eyes ?? 0, earsBack: 1 }, { tilt: 0, lift: -18, fN: -1.45, fF: -1.45, hN: 0, hF: 0, squash: 0.92 + b * 0.01, headDY: 40, headTilt: 0.22, tuckLegs: false });
  }
  return { drawSit, drawRun, drawSleep, drawHead };
}
