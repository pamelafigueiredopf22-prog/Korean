// The North Wind (a billowy cloud with a face) and the Sun (a glowing face with soft, turning rays),
// plus the wind itself: flowing streams of air that carry leaves and petals.
import { wash, pool, ellipse, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, rgba, shade, tint, clamp, lerp, noise1,
  penLine, blooms, soften, fluffy, path } from '../watercolor.js';
import { leaf } from '../scenery.js';
import { buttonEye, PAPER, INK } from './kit.js';

function mouth(g, x, y, w, m, sm, round = 0) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  if (round > 0.05) { // blowing: a round 'o'
    const r = 6 + 10 * round;
    g.fillStyle = '#5c3a4a'; g.beginPath(); g.ellipse(x, y, r * 0.8, r, 0, 0, 7); g.fill();
    g.strokeStyle = rgba(INK, 0.75); g.lineWidth = 2.4; g.beginPath(); g.ellipse(x, y, r * 0.8, r, 0, 0, 7); g.stroke();
  } else if (m > 0.04) {
    const d = 4 + 16 * m, top = (k) => [x - w / 2 + k * w, y - (Math.abs(k - 0.5) * 2) ** 2 * sm * 6];
    const pts = []; for (let k = 0; k <= 10; k++) pts.push(top(k / 10));
    const outline = () => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.quadraticCurveTo(x, y + d * 1.6, pts[0][0], pts[0][1]); g.closePath(); };
    outline(); g.fillStyle = '#5c2622'; g.fill(); g.save(); g.clip(); g.fillStyle = '#d8857c'; g.beginPath(); g.ellipse(x, y + d * 0.9, w * 0.28, d * 0.4, 0, 0, 7); g.fill(); g.restore();
    outline(); g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 2.2; g.stroke();
  } else {
    g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 2.4; g.beginPath(); g.moveTo(x - w / 2, y - sm * 6); g.quadraticCurveTo(x, y + 4 + sm * 6, x + w / 2, y - sm * 6); g.stroke();
  }
  g.restore();
}

// ================================================================== the North Wind
export function makeWind(res = 1, seed = 71) {
  const s = (n) => seed * 100 + n;
  const puffs = [[0, 0, 150, 110], [-130, 30, 110, 80], [130, 20, 120, 90], [-60, -80, 110, 80], [70, -86, 100, 76], [-200, 70, 80, 56], [190, 80, 80, 56], [0, 80, 130, 70]];
  const cloud = sprite({ x0: -300, y0: -190, x1: 300, y1: 170, w: 600, h: 360 }, res, (g) => {
    const shapes = puffs.map(([x, y, rx, ry], i) => fluffy(x, y, rx, ry, 7, 0.16, s(i)));
    // one soft outline around the whole cloud: stroke every puff, then cover the insides
    g.save(); g.lineJoin = 'round'; g.strokeStyle = rgba('#5a6a84', 0.5); g.lineWidth = 3.4; for (const sh of shapes) { path(g, sh); g.stroke(); }
    g.fillStyle = '#e6ebf2'; for (const sh of shapes) { path(g, sh); g.fill(); } g.restore();
    for (const [i, [x, y, rx, ry]] of puffs.entries()) {
      const sh = shapes[i];
      wash(g, sh, { color: i % 2 ? '#cdd6e3' : '#dde5ef', opacity: 0.9, seed: s(10 + i), bleed: 0.04, layers: 16, edge: 0.05 });
      shadeEdge(g, sh, { color: '#8494ae', alpha: 0.3, width: 40, dy: -16 });
      glaze(g, sh, x - rx * 0.2, y - ry * 0.35, rx * 0.5, ry * 0.3, '#ffffff', 0.7);
    }
    soften(g, 1.2 * res);
  }, { seed: s(40) });
  // st: puff (0..1 cheeks puffed, blowing), eyes, happy, mouth (talking), smile, tired (0..1), browUp, frown, t
  function draw(g, st = {}) {
    const t = st.t || 0, puff = st.puff || 0, tired = st.tired || 0;
    g.save();
    g.translate(Math.sin(t * 0.5) * 6, Math.sin(t * 0.7) * 5);
    g.scale(1 + puff * 0.06, 1 - puff * 0.03 + tired * -0.04);
    drawSprite(g, cloud);
    // cheeks: big and round when he puffs
    for (const x of [-70, 70]) pool(g, x + (x > 0 ? 10 : -10) * puff, 36, 30 + 26 * puff, 22 + 18 * puff, '#e8a8b4', 0.45 + 0.25 * puff);
    const eo = st.eyes ?? 1;
    for (const x of [-46, 46]) buttonEye(g, x, -10 + tired * 4, puff > 0.6 ? 0 : eo, { R: 13, happy: st.happy || (puff > 0.6), sly: tired * 0.6 });
    // big bushy brows
    const bu = (st.browUp || 0) * 8, fr = (st.frown || 0) * 8 + puff * 6;
    g.strokeStyle = rgba('#5a6a84', 0.85); g.lineWidth = 5; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-72, -40 - bu + tired * 6); g.quadraticCurveTo(-48, -50 - bu, -24, -40 - bu + fr); g.stroke();
    g.beginPath(); g.moveTo(24, -40 - bu + fr); g.quadraticCurveTo(48, -50 - bu, 72, -40 - bu + tired * 6); g.stroke();
    mouth(g, 0, 46, 46, st.mouth || 0, st.smile ?? 0.5, puff);
    g.restore();
  }
  return { draw };
}

// ================================================================== the Sun
export function makeSun(res = 1, seed = 72) {
  const s = (n) => seed * 100 + n;
  const R = 120;
  const face = sprite({ x0: -R - 10, y0: -R - 10, x1: R + 10, y1: R + 10, w: 2 * R + 20, h: 2 * R + 20 }, res, (g) => {
    const disc = ellipse(0, 0, R, R, 48);
    wash(g, disc, { color: '#f6c24a', opacity: 0.97, under: '#fff2c8', seed: s(1) });
    blooms(g, disc, ['#f8d060', '#f0a83a', '#fbe08a'], { n: 6, seed: s(2), alpha: 0.35 });
    glaze(g, disc, -30, -40, 60, 40, '#fff6d8', 0.8);
    shadeEdge(g, disc, { color: '#d8862a', alpha: 0.4, width: 30, dy: -10 });
    soften(g, 1 * res);
    penLine(g, disc, { closed: true, color: '#a8661a', w: 2.2, alpha: 0.6 });
  }, { seed: s(3) });
  const ray = sprite({ x0: -26, y0: -70, x1: 26, y1: 4, w: 52, h: 74 }, res, (g) => {
    const sh = smooth([[-22, 0], [-14, -40], [0, -66], [14, -40], [22, 0]]);
    wash(g, sh, { color: '#f8c860', opacity: 0.92, under: '#fff2c8', seed: s(4), layers: 12 });
    glaze(g, sh, 0, -30, 8, 20, '#fff6d8', 0.7);
    penLine(g, sh, { closed: true, color: '#a8661a', w: 1.6, alpha: 0.5 });
  }, { granulate: false });
  // st: glow (0..1 brightness/warmth), eyes, happy, mouth, smile, t, peek (0..1 hidden behind cloud)
  function draw(g, st = {}) {
    const t = st.t || 0, glow = st.glow ?? 0.5;
    g.save();
    // the warm halo
    g.save(); g.globalCompositeOperation = 'lighter';
    pool(g, 0, 0, R * (2.6 + glow * 1.6), R * (2.6 + glow * 1.6), '#ffd890', 0.25 + glow * 0.3);
    pool(g, 0, 0, R * 1.6, R * 1.6, '#fff0c0', 0.3 + glow * 0.3);
    g.restore();
    // soft rays, slowly turning, breathing in and out
    const n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + t * 0.08, len = 1 + 0.12 * Math.sin(t * 1.2 + i * 1.3) + glow * 0.25;
      g.save(); g.rotate(a); g.translate(0, -R - 6); g.scale(1, len * (i % 2 ? 0.8 : 1.1)); drawSprite(g, ray); g.restore();
    }
    drawSprite(g, face);
    for (const x of [-56, 56]) pool(g, x, 30, 26, 18, '#f08a6a', 0.5);
    for (const x of [-38, 38]) buttonEye(g, x, -18, st.eyes ?? 1, { R: 11, happy: st.happy });
    g.strokeStyle = rgba('#a8661a', 0.7); g.lineWidth = 3; g.lineCap = 'round';
    for (const x of [-38, 38]) { g.beginPath(); g.moveTo(x - 14, -44 - (st.browUp || 0) * 6); g.quadraticCurveTo(x, -52 - (st.browUp || 0) * 8, x + 14, -44 - (st.browUp || 0) * 6); g.stroke(); }
    mouth(g, 0, 38, 44, st.mouth || 0, st.smile ?? 0.7);
    g.restore();
  }
  return { draw };
}

// ================================================================== the wind you can see
// Soft, broad ribbons of air streaming across (dir -1: blowing to the left), some ending in a curl,
// with leaves and petals riding along. strength 0..1.
function ribbonFill(g, pts, wmax, col, a) {
  const L = [], R = [], n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)];
    let dx = p1[0] - p0[0], dy = p1[1] - p0[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = wmax * Math.pow(Math.sin(Math.PI * Math.min(0.999, Math.max(0.001, i / (n - 1)))), 0.7) / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  g.fillStyle = rgba(col, a); path(g, L.concat(R.reverse())); g.fill();
}
export function windStreams(g, t, strength, area, o = {}) {
  if (strength <= 0.01) return;
  const { n = 12, seed = 5, dir = -1, color = '#ffffff', items = true, alpha = 1 } = o;
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 0; i < n; i++) {
    const speed = 300 + 480 * strength + noise1(i, seed) * 160;
    const len = 300 + 380 * strength + noise1(i * 2.3, seed) * 120;
    const span = area.x1 - area.x0 + len * 2 + 400;
    const head = ((t * speed + (noise1(i * 3.1, seed) + 1) * span) % span) - 200;
    const hx = dir > 0 ? area.x0 + head : area.x1 - head;            // the leading end
    const y0 = area.y0 + (noise1(i * 7.7, seed + 3) * 0.5 + 0.5) * (area.y1 - area.y0);
    const amp = 16 + 22 * strength, ph = i * 1.7;
    const pts = [];
    for (let k = 0; k <= 28; k++) { const u = k / 28; pts.push([hx - dir * u * len, y0 + Math.sin(u * 4.2 + ph + t * 1.6) * amp * (0.4 + u * 0.6)]); }
    // a curl at the head: a little spiral turning back on itself
    if (i % 3 === 0) {
      const [cx0, cy0] = pts[0], R0 = 34 + 14 * strength, spiral = [];
      for (let k = 0; k <= 22; k++) { const u = k / 22, r = R0 * (1 - u * 0.7); spiral.push([cx0 + dir * Math.sin(u * Math.PI * 1.7) * r, cy0 - R0 + Math.cos(u * Math.PI * 1.7) * r]); }
      pts.unshift(...spiral.reverse());
    }
    const fade = Math.min(1, strength * 1.5) * alpha;
    ribbonFill(g, pts, 22 + 26 * strength, color, 0.28 * fade);
    ribbonFill(g, pts, 7 + 6 * strength, color, 0.45 * fade);
    g.strokeStyle = rgba('#8aa0bc', 0.28 * fade); g.lineWidth = 1.3; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(p[0], p[1] + 4); g.stroke();
    if (items && i % 2 === 0) {
      const [lx, ly] = pts[Math.min(pts.length - 1, (i % 3 === 0 ? 24 : 2))];
      g.save(); g.globalAlpha = Math.min(1, strength * 2) * alpha;
      if (i % 4 === 0) leaf(g, lx, ly, 14, t * 5 + i, ['#d89a3a', '#8fa252', '#c86a3a'][i % 3]);
      else { g.fillStyle = rgba(['#f2c4d0', '#f8f0dc', '#e8a04a'][i % 3], 0.95); g.beginPath(); g.ellipse(lx, ly, 7, 4, t * 5 + i, 0, 7); g.fill(); }
      g.restore();
    }
  }
  g.restore();
}
