// The North Wind and the Sun, drawn like the sky-faces in old fable books.
//  - The North Wind: a round, chubby cloud-face (three-quarter view, facing left) whose hair and beard
//    are long cloud curls streaming out behind him, each curling into a little spiral. He puffs his
//    cheeks and blows through pursed lips.
//  - The Sun: a golden face in a disc, crowned with alternating straight and wavy flame rays, inked.
// Plus windStreams(): the wind made visible, soft ribbons of air carrying leaves and petals.
import { wash, pool, ellipse, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, rgba, shade, tint, clamp, lerp, noise1, rng,
  penLine, blooms, soften, fluffy, path, ink, hatch } from '../watercolor.js';
import { leaf } from '../scenery.js';
import { buttonEye, PAPER, INK } from './kit.js';

const CLOUD = '#dfe5ee', CLOUD2 = '#c9d2e2', CLOUD_SH = '#8e98b4', CLOUD_INK = '#4a4a62';

// a tapered ribbon along a centre line, ending (at the tip) in a spiral curl
function curlShape(base, dir, len, w0, wave, curlR, seed) {
  const r = rng(seed), C = [];
  const n = 24;
  for (let k = 0; k <= n; k++) {
    const u = k / n;
    C.push([base[0] + dir[0] * len * u - dir[1] * Math.sin(u * Math.PI * 1.2 + wave) * len * 0.08, base[1] + dir[1] * len * u + dir[0] * Math.sin(u * Math.PI * 1.2 + wave) * len * 0.08]);
  }
  // the spiral at the tip, turning upward (anticlockwise on screen) and inward
  const [tx, ty] = C[n], a0 = Math.atan2(dir[1], dir[0]);
  const cx = tx - Math.sin(a0) * -curlR, cy = ty + Math.cos(a0) * -curlR;
  for (let k = 1; k <= 18; k++) {
    const u = k / 18, rr = curlR * (1 - u * 0.75), a = a0 + Math.PI / 2 - u * Math.PI * 1.6;
    C.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  const L = [], R = [], N = C.length;
  for (let i = 0; i < N; i++) {
    const p0 = C[Math.max(0, i - 1)], p1 = C[Math.min(N - 1, i + 1)];
    let dx = p1[0] - p0[0], dy = p1[1] - p0[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = w0 * Math.pow(1 - i / N, 0.8) * (0.9 + 0.2 * Math.sin(i * 0.9 + seed)) / 2 + 1.5;
    L.push([C[i][0] - dy * w, C[i][1] + dx * w]); R.push([C[i][0] + dy * w, C[i][1] - dx * w]);
  }
  return { shape: smooth(L.concat(R.reverse())), spine: C, L, R };
}
function cloudPaint(g, sh, sd, o = {}) {
  wash(g, sh, { color: PAPER, opacity: 1, under: '#f2f2f2', seed: sd, edge: 0 });
  wash(g, sh, { color: o.color || CLOUD, opacity: 0.85, seed: sd + 1, bleed: 0.04, layers: 20, edge: 0.3 });
  blooms(g, sh, ['#e8dcec', '#d4def0', '#f4f0f4'], { n: 5, seed: sd + 2, alpha: 0.3 });
  shadeEdge(g, sh, { color: CLOUD_SH, alpha: 0.42, width: o.shW || 26, dx: o.dx ?? 4, dy: o.dy ?? -10 });
  soften(g, 1.1);
}

// ================================================================== the North Wind (faces left)
export function makeWind(res = 1, seed = 71) {
  const s = (n) => seed * 100 + n;
  const FACE = fluffy(0, 0, 150, 138, 10, 0.08, s(1));
  const face = sprite(bbox(FACE), res, (g) => {
    cloudPaint(g, FACE, s(2), { shW: 40, dx: 8, dy: -14 });
    // a soft forehead light and warm glow on the face side
    glaze(g, FACE, -40, -60, 80, 40, '#ffffff', 0.6);
    hatch(g, FACE, { color: CLOUD_INK, count: 70, len: 10, width: 0.8, alpha: 0.25, seed: s(3), dir: () => Math.PI * 0.8, density: (x, y) => clamp((x + 30) / 180) });
    penLine(g, FACE, { closed: true, color: CLOUD_INK, w: 2.2, alpha: 0.75, seed: s(4), weight: (t) => 0.3 + 0.9 * Math.max(0, Math.sin(t * Math.PI * 2 + 1)) });
  }, { seed: s(5), grain: 0.14 });
  // his hair, beard and the long tail of his cloud: separate billows, each painted with a little curl
  const puffDefs = [
    // trailing stream (behind, drawn first), largest near his head, smaller further away
    [600, 10, 26, 'b'], [530, -14, 36, 'b'], [450, 14, 48, 'b'], [360, -26, 60, 'b'], [350, 66, 54, 'b'], [262, 80, 70, 'b'], [256, -70, 74, 'b'],
    [168, -16, 96, 'b'], [158, 80, 80, 'b'], [150, -104, 80, 'b'],
    // curly hair on his crown and a curly beard (drawn over the face's edges)
    [-70, -116, 46, 'f'], [-8, -142, 54, 'f'], [62, -136, 56, 'f'], [118, -96, 58, 'f'],
    [-108, 116, 40, 'f'], [-46, 140, 48, 'f'], [24, 148, 50, 'f'], [92, 128, 52, 'f'],
  ];
  const puffs = puffDefs.map(([x, y, rr, layer], i) => {
    const sh = fluffy(x, y, rr, rr * 0.86, 7, 0.14, s(150 + i));
    return { x, y, rr, layer, ph: i * 1.37, spr: sprite(bbox(sh), res, (g) => {
      cloudPaint(g, sh, s(170 + i * 3), { color: i % 2 ? CLOUD2 : CLOUD, shW: Math.max(12, rr * 0.4), dx: rr * 0.06, dy: -rr * 0.14 });
      glaze(g, sh, x - rr * 0.25, y - rr * 0.35, rr * 0.4, rr * 0.22, '#ffffff', 0.65);
      const pts = []; for (let k = 0; k <= 22; k++) { const u = k / 22, r0 = rr * 0.5 * (1 - u * 0.72), a = Math.PI * 0.85 - u * Math.PI * 1.8; pts.push([x + rr * 0.08 + Math.cos(a) * r0, y + rr * 0.05 + Math.sin(a) * r0]); }
      ink(g, pts, { color: CLOUD_INK, width: Math.max(1, rr * 0.022), alpha: 0.55, seed: s(200 + i) });
      penLine(g, sh.slice(Math.floor(sh.length * 0.5)).concat(sh.slice(0, Math.floor(sh.length * 0.08))), { color: CLOUD_INK, w: Math.max(1.4, rr * 0.035), alpha: 0.8, seed: s(230 + i) });
    }, { seed: s(260 + i), grain: 0.14 }) };
  });
  // st: puff 0..1 (cheeks puffed, blowing), eyes, happy, mouth (talking), smile, tired 0..1, browUp, frown, t, gust (hair streaming)
  function draw(g, st = {}) {
    const t = st.t || 0, puff = st.puff || 0, tired = st.tired || 0, gust = st.gust ?? (0.3 + puff * 0.7);
    g.save();
    g.translate(Math.sin(t * 0.5) * 6, Math.sin(t * 0.7) * 5 + tired * 10);
    const drawPuffs = (layer) => { for (const p of puffs) { if (p.layer !== layer) continue;
      const k = Math.max(0, p.x - 100) / 500; // the further back, the more it streams and stretches in the gust
      g.save(); g.translate(p.x * (1 + gust * 0.12 * k - tired * 0.15 * k) + Math.sin(t * (1 + gust * 2) + p.ph) * (3 + 10 * k * gust), p.y * (1 - tired * 0.1) + Math.cos(t * 0.9 + p.ph) * (2 + 6 * k) + tired * 18 * k);
      const sc = 1 + 0.04 * Math.sin(t * 1.3 + p.ph) - tired * 0.1 * k; g.scale(sc * (1 + gust * 0.08 * k), sc); g.translate(-p.x, -p.y); drawSprite(g, p.spr); g.restore(); } };
    drawPuffs('b');
    g.save(); g.scale(1 + puff * 0.04, 1 - tired * 0.03); drawSprite(g, face); g.restore();
    drawPuffs('f');
    // face (three-quarter, looking left): eyes, bushy cloud brows, round cheeks, little nose, mouth
    const ex = [-92, -24], ey = -18 + tired * 6;
    for (const [i, x] of ex.entries()) pool(g, x - 6 - puff * (i ? -14 : 14), 34, 34 + 26 * puff, 26 + 16 * puff, '#eaa0b0', 0.42 + 0.28 * puff);
    if (puff > 0.05) { // the puffed cheek bulging out, outlined
      const cr = 26 + 30 * puff;
      g.save(); g.strokeStyle = rgba(CLOUD_INK, 0.5 * puff); g.lineWidth = 2; g.beginPath(); g.arc(-98, 40, cr, Math.PI * 0.55, Math.PI * 1.25); g.stroke(); g.restore();
    }
    const eo = st.eyes ?? 1;
    for (const [i, x] of ex.entries()) buttonEye(g, x, ey, puff > 0.55 ? 0 : eo * (1 - tired * 0.5), { R: i ? 12 : 11, happy: st.happy, sly: tired * 0.7 });
    const bu = (st.browUp || 0) * 9 - (st.frown || 0) * 6 - puff * 4;
    for (const [i, x] of ex.entries()) { // a little cloud tuft for each eyebrow
      const bx = x + (i ? 4 : -2), by = ey - 30 - bu + tired * 6;
      const tuft = fluffy(bx, by, 26, 10, 6, 0.3, s(200 + i), (i ? 1 : -1) * ((st.frown || 0) * 0.25 + puff * 0.15 - tired * 0.2));
      g.save(); g.fillStyle = '#f0f2f6'; path(g, tuft); g.fill(); g.strokeStyle = rgba(CLOUD_INK, 0.7); g.lineWidth = 1.6; g.stroke(); g.restore();
    }
    // nose: a small round button
    g.save(); g.fillStyle = '#e8c0c8'; g.beginPath(); g.ellipse(-66, 18, 11, 9, 0, 0, 7); g.fill(); g.strokeStyle = rgba(CLOUD_INK, 0.6); g.lineWidth = 1.4; g.beginPath(); g.arc(-66, 18, 10, Math.PI * 0.1, Math.PI * 0.95); g.stroke(); g.restore();
    // mouth: pursed 'o' when blowing, a one-piece mouth when talking
    const mx = -70 - puff * 18, my = 56;
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
    if (puff > 0.05) {
      const rr = 7 + 7 * puff;
      g.fillStyle = '#d88a98'; g.beginPath(); g.ellipse(mx, my, rr + 5, rr * 1.15 + 5, 0, 0, 7); g.fill();
      g.fillStyle = '#5a3040'; g.beginPath(); g.ellipse(mx, my, rr * 0.7, rr * 0.85, 0, 0, 7); g.fill();
      g.strokeStyle = rgba(CLOUD_INK, 0.8); g.lineWidth = 2; g.beginPath(); g.ellipse(mx, my, rr + 5, rr * 1.15 + 5, 0, 0, 7); g.stroke();
    } else {
      const m = st.mouth || 0, sm = st.smile ?? 0.5, w = 40, d = 4 + 18 * m;
      const pts = []; for (let k = 0; k <= 10; k++) { const u = k / 10; pts.push([mx - w / 2 + u * w, my - (Math.abs(u - 0.5) * 2) ** 2 * sm * 7 + tired * Math.abs(u - 0.5) * 6]); }
      if (m > 0.04) {
        const outline = () => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.quadraticCurveTo(mx, my + d * 1.6, pts[0][0], pts[0][1]); g.closePath(); };
        outline(); g.fillStyle = '#5c2a36'; g.fill(); g.save(); g.clip(); g.fillStyle = '#d88a90'; g.beginPath(); g.ellipse(mx, my + d * 1.1, w * 0.26, d * 0.4, 0, 0, 7); g.fill(); g.restore();
        outline(); g.strokeStyle = rgba(CLOUD_INK, 0.85); g.lineWidth = 2; g.stroke();
      } else { g.strokeStyle = rgba(CLOUD_INK, 0.85); g.lineWidth = 2.2; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.stroke(); }
    }
    g.restore();
    g.restore();
  }
  // where his breath comes out (for the wind streams), in his own coordinates
  return { draw, mouth: [-110, 56] };
}

// ================================================================== the Sun
export function makeSun(res = 1, seed = 72) {
  const s = (n) => seed * 100 + n;
  const R = 112;
  const GOLD = '#ecb444', DEEP = '#d8862e', LIGHT = '#fbe2a0', SUN_INK = '#8a4e1a';
  const disc = ellipse(0, 0, R, R, 60);
  const face = sprite(bbox(disc), res, (g) => {
    wash(g, disc, { color: PAPER, opacity: 1, under: '#fbf3e0', seed: s(1), edge: 0 });
    wash(g, disc, { color: GOLD, opacity: 0.9, seed: s(2), bleed: 0.02, layers: 24, edge: 0.4 });
    blooms(g, disc, [LIGHT, '#f2c460', '#e8a040'], { n: 7, seed: s(3), alpha: 0.35 });
    glaze(g, disc, -30, -44, 64, 40, '#fff4d4', 0.75);
    shadeEdge(g, disc, { color: DEEP, alpha: 0.45, width: 34, dx: 6, dy: 10 });
    soften(g, 1);
    hatch(g, disc, { color: SUN_INK, count: 90, len: 9, width: 0.8, alpha: 0.25, seed: s(4), dir: (x, y) => Math.atan2(y, x) + Math.PI / 2, density: (x, y) => clamp((Math.hypot(x, y) - R * 0.7) / (R * 0.3)) });
    penLine(g, disc, { closed: true, color: SUN_INK, w: 2.6, alpha: 0.75, seed: s(5) });
  }, { seed: s(6), grain: 0.14 });
  // two kinds of ray: a straight pointed one, and a wavy flame
  const straight = smooth([[-15, 0], [-7, -50], [0, -96], [7, -50], [15, 0]]);
  const wavy = []; { const L = [], Rr = []; for (let k = 0; k <= 14; k++) { const u = k / 14, y = -u * 76, x = Math.sin(u * Math.PI * 2.2) * 10, w = 13 * (1 - u) + 1; L.push([x - w, y]); Rr.push([x + w, y]); } wavy.push(...smooth(L.concat(Rr.reverse()))); }
  const ray = (sh, col, sd) => sprite(bbox(sh), res, (g) => {
    wash(g, sh, { color: '#fff4dc', opacity: 1, under: '#fff4dc', seed: sd, edge: 0 });
    wash(g, sh, { color: col, opacity: 0.9, seed: sd + 1, bleed: 0.02, layers: 14, edge: 0.4 });
    glaze(g, sh, -3, -30, 5, 20, '#fff6dc', 0.6);
    penLine(g, sh, { closed: true, color: SUN_INK, w: 1.7, alpha: 0.7, seed: sd + 2 });
  }, { granulate: false });
  const rays = [ray(straight, '#f2c050', s(10)), ray(wavy, '#e89a3a', s(20))];
  // st: glow 0..1, eyes, happy, mouth, smile, browUp, t, set 0..1 (sleepy sunset: eyes drooping)
  function draw(g, st = {}) {
    const t = st.t || 0, glow = st.glow ?? 0.5;
    g.save();
    g.save(); g.globalCompositeOperation = 'lighter';
    pool(g, 0, 0, R * (2.4 + glow * 1.8), R * (2.4 + glow * 1.8), '#ffd890', 0.18 + glow * 0.3);
    pool(g, 0, 0, R * 1.5, R * 1.5, '#fff0c0', 0.25 + glow * 0.25);
    g.restore();
    const n = 18;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + t * 0.06, kind = i % 2, len = (1 + 0.1 * Math.sin(t * 1.3 + i * 1.7)) * (0.9 + glow * 0.25);
      g.save(); g.rotate(a); g.translate(0, -R + 6); g.scale(1, len * (kind ? 0.95 : 1)); if (kind) g.rotate(Math.sin(t * 2 + i) * 0.05); drawSprite(g, rays[kind]); g.restore();
    }
    drawSprite(g, face);
    for (const x of [-56, 56]) pool(g, x, 30, 26, 18, '#ec7a5a', 0.45);
    const eo = (st.eyes ?? 1) * (1 - (st.set || 0) * 0.6);
    for (const x of [-38, 38]) buttonEye(g, x, -14, eo, { R: 11, happy: st.happy, sly: (st.set || 0) * 0.6 });
    g.strokeStyle = rgba(SUN_INK, 0.7); g.lineWidth = 2.6; g.lineCap = 'round';
    const bu = (st.browUp || 0) * 8;
    for (const x of [-38, 38]) { g.beginPath(); g.moveTo(x - 15, -38 - bu); g.quadraticCurveTo(x, -48 - bu, x + 15, -38 - bu); g.stroke(); }
    // cheek contours, like an engraving
    g.strokeStyle = rgba(SUN_INK, 0.35); g.lineWidth = 1.4;
    for (const sx of [-1, 1]) { g.beginPath(); g.arc(sx * 56, 30, 30, sx > 0 ? Math.PI * 0.05 : Math.PI * 0.6, sx > 0 ? Math.PI * 0.4 : Math.PI * 0.95); g.stroke(); }
    // nose
    g.strokeStyle = rgba(SUN_INK, 0.55); g.lineWidth = 2; g.beginPath(); g.moveTo(2, 0); g.quadraticCurveTo(10, 16, 0, 20); g.stroke();
    // mouth
    const m = st.mouth || 0, sm = st.smile ?? 0.7, w = 44, mx = 0, my = 42;
    const pts = []; for (let k = 0; k <= 10; k++) { const u = k / 10; pts.push([mx - w / 2 + u * w, my - (Math.abs(u - 0.5) * 2) ** 2 * sm * 7]); }
    g.lineJoin = 'round';
    if (m > 0.04) {
      const d = 4 + 14 * m, outline = () => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.quadraticCurveTo(mx, my + d * 1.6, pts[0][0], pts[0][1]); g.closePath(); };
      outline(); g.fillStyle = '#7a3020'; g.fill(); g.save(); g.clip(); g.fillStyle = '#e88a70'; g.beginPath(); g.ellipse(mx, my + d * 1.1, w * 0.26, d * 0.4, 0, 0, 7); g.fill(); g.restore();
      outline(); g.strokeStyle = rgba(SUN_INK, 0.85); g.lineWidth = 2.2; g.stroke();
    } else { g.strokeStyle = rgba(SUN_INK, 0.85); g.lineWidth = 2.4; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.stroke(); }
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
    const hx = dir > 0 ? area.x0 + head : area.x1 - head;
    const y0 = area.y0 + (noise1(i * 7.7, seed + 3) * 0.5 + 0.5) * (area.y1 - area.y0);
    const amp = 16 + 22 * strength, ph = i * 1.7;
    const pts = [];
    for (let k = 0; k <= 28; k++) { const u = k / 28; pts.push([hx - dir * u * len, y0 + Math.sin(u * 4.2 + ph + t * 1.6) * amp * (0.4 + u * 0.6)]); }
    if (i % 3 === 0) {
      const [cx0, cy0] = pts[0], R0 = 34 + 14 * strength, spiral = [];
      for (let k = 0; k <= 22; k++) { const u = k / 22, r = R0 * (1 - u * 0.7); spiral.push([cx0 + dir * Math.sin(u * Math.PI * 1.7) * r, cy0 - R0 + Math.cos(u * Math.PI * 1.7) * r]); }
      pts.unshift(...spiral.reverse());
    }
    const fade = Math.min(1, strength * 1.5) * alpha;
    ribbonFill(g, pts, 22 + 26 * strength, color, 0.26 * fade);
    ribbonFill(g, pts, 7 + 6 * strength, color, 0.42 * fade);
    g.strokeStyle = rgba('#7a8aa8', 0.3 * fade); g.lineWidth = 1.2; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(p[0], p[1] + 4); g.stroke();
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
