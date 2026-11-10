// Shared painting kit for the storybook (line-and-wash) characters.
import { wash, sprite, bbox, shadeEdge, blooms, soften, furEdge, hatch, penLine, looseWash, clamp, rgba, lerp } from '../watercolor.js';

export const PAPER = '#f4ead6', INK = '#33241b';

// A furry part: paper base, loose wash, colour blooms, soft shading, fur hatching, furry edge, pen line.
export function makeFurPart(res, seedBase, pal) {
  const s = (n) => seedBase * 100 + n;
  return (shape, o = {}) => sprite(bbox(shape.concat(o.extra || [])), res, (g) => {
    wash(g, shape, { color: PAPER, opacity: 1, under: PAPER, seed: s(o.sd), edge: 0 });
    looseWash(g, shape, o.color || pal.fur, { opacity: o.op ?? 0.82, seed: s(o.sd + 1), shift: 3, reserves: o.reserves ?? 2 });
    blooms(g, shape, o.blooms || pal.blooms, { n: 6, seed: s(o.sd + 2), alpha: 0.25 });
    if (o.paint) o.paint(g);
    shadeEdge(g, shape, { color: pal.shadow, alpha: o.shadeA ?? 0.32, width: o.shadeW || 20, dx: o.sdx || 0, dy: o.sdy ?? -9 });
    soften(g, 1.1 * res);
    if (o.after) o.after(g);
    const b = bbox(shape);
    if (o.hatch !== 0) hatch(g, shape, { color: pal.hatch, count: o.hatch ?? 200, len: o.hlen || 8, width: 0.8, alpha: 0.45, seed: s(o.sd + 3), dir: o.dir || (() => Math.PI),
      density: (x, y) => 0.25 + 0.75 * clamp((y - b.y0) / b.h) ** 1.4 });
    if (o.fur !== 0) furEdge(g, shape, { color: o.color || pal.fur, count: o.fur ?? 60, len: o.furLen || 7, width: 1.6, alpha: 0.7, seed: s(o.sd + 4) });
    if (o.pen !== false) penLine(g, o.penPts || shape, { closed: !o.penPts, color: INK, w: 2.1, alpha: 0.8, seed: s(o.sd + 5),
      weight: (t) => 0.25 + 0.9 * Math.max(0, Math.sin(t * Math.PI * 2 + (o.phase || 0))) });
  }, { seed: s(o.sd + 6), grain: 0.12 });
}

// The little button eye used by all the storybook animals. open: 0 (closed) .. 1; happy: closed in a smile.
export function buttonEye(g, x, y, open = 1, o = {}) {
  const { R = 7, happy = false, sly = 0 } = o;
  g.save(); g.lineCap = 'round';
  if (open < 0.12 || happy) {
    g.strokeStyle = rgba(INK, 0.9); g.lineWidth = 2.4; g.beginPath();
    if (happy) g.arc(x, y + R * 0.7, R * 1.15, Math.PI * 1.2, Math.PI * 1.8); else g.arc(x, y - R * 0.6, R * 1.15, Math.PI * 0.2, Math.PI * 0.8);
    g.stroke();
  } else {
    const ry = R * 0.95 * open * (1 - 0.42 * sly);
    g.beginPath(); g.ellipse(x, y, R, ry, 0, 0, 7); g.save(); g.clip();
    const ig = g.createRadialGradient(x - 2, y - 3, 1, x, y, R); ig.addColorStop(0, '#5a3a26'); ig.addColorStop(0.55, '#24160f'); ig.addColorStop(1, '#120a06');
    g.fillStyle = ig; g.fillRect(x - R - 2, y - R - 2, 2 * R + 4, 2 * R + 4);
    g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.arc(x - R * 0.32, y - ry * 0.38, Math.max(1.6, R * 0.28), 0, 7); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.beginPath(); g.arc(x + R * 0.35, y + ry * 0.35, Math.max(0.8, R * 0.11), 0, 7); g.fill();
    g.restore();
    g.strokeStyle = rgba(INK, 0.9); g.lineWidth = 1.4 + sly * 1.2;
    g.beginPath(); g.moveTo(x - R - 1, y - ry * 0.2); g.quadraticCurveTo(x, y - ry - 3, x + R + 1, y - ry * 0.3); g.stroke();
  }
  g.restore();
}

// One-piece talking mouth for a profile face: the lower jaw (a sprite) swings down from the corner `piv`;
// the gap between the upper lip (corner -> tip) and the jaw is the inside of the mouth.
export function profileMouth(g, jaw, piv, tip, m, sm = 0, o = {}) {
  const a = clamp(m) * (o.open ?? 0.36);
  const rot = ([x, y]) => [piv[0] + (x - piv[0]) * Math.cos(a) - (y - piv[1]) * Math.sin(a), piv[1] + (x - piv[0]) * Math.sin(a) + (y - piv[1]) * Math.cos(a)];
  const lip = [];
  for (let k = 0; k <= 8; k++) { const u = k / 8; lip.push([lerp(piv[0] + 2, tip[0], u), lerp(piv[1] - 1 - sm * 6, tip[1], u) + Math.sin(u * Math.PI) * (o.bow ?? 2.5)]); }
  const jawTop = lip.map(([x, y], k) => rot([x, k === 0 ? y + sm * 6 : y]));
  if (a > 0.01) {
    g.save(); g.beginPath(); g.moveTo(...lip[0]);
    for (const p of lip) g.lineTo(...p);
    for (let k = jawTop.length - 1; k >= 0; k--) g.lineTo(...jawTop[k]);
    g.closePath(); g.fillStyle = '#5c2622'; g.fill(); g.clip();
    const tp = rot([lerp(piv[0], tip[0], 0.7), lerp(piv[1], tip[1], 0.7) + 3]);
    g.fillStyle = '#d8857c'; g.beginPath(); g.ellipse(tp[0] - 6, tp[1] - 1, (tip[0] - piv[0]) * 0.3, 2 + 3 * m, a * 0.8, 0, 7); g.fill();
    g.restore();
  }
  if (jaw) { g.save(); g.translate(piv[0], piv[1]); g.rotate(a); g.translate(-piv[0], -piv[1]); drawSpriteSafe(g, jaw); g.restore(); }
  g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 1.8; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(...lip[lip.length - 1]); for (let k = lip.length - 2; k >= 0; k--) g.lineTo(...lip[k]); g.stroke();
  if (a > 0.01) { g.lineWidth = 1.3; g.globalAlpha *= 0.7; g.beginPath(); g.moveTo(...jawTop[0]); for (const p of jawTop) g.lineTo(...p); g.stroke(); }
}
function drawSpriteSafe(g, s) { g.drawImage(s.c, s.x0, s.y0, s.w, s.h); }
