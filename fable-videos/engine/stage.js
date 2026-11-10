// Shared staging for every fable: painted layers, camera, paper, painted edge, watercolour
// dissolves between scenes, night grading, stars, moon and fireflies.
import { W, H, rng, paper, canvas, smooth, noise1, rgba, clamp, span, noiseTexture, pool } from './watercolor.js';

export const M = 96, MY = 54;               // layer margin for camera moves
export const LW = W + 2 * M, LH = H + 2 * MY;
export const INK = '#4a3226';

export function layer(paintFn, w = LW, h = LH) {
  const c = canvas(w, h), g = c.getContext('2d');
  g.translate(M, MY); paintFn(g); return c;
}
// camera: c = { z, x, y }; p = parallax (0 = fixed, 1 = moves with the world)
export function cam(g, c, p = 1) {
  const z = 1 + (c.z - 1) * p;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2 - c.x * p, -H / 2 - c.y * p);
}
export function drawLayer(g, c, img, p) { cam(g, c, p); g.drawImage(img, -M, -MY); }

export function fireflies(g, t, n, area, seed, strength = 1) {
  if (strength <= 0) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = area.x0 + (area.x1 - area.x0) * noise1(t * 0.05 + i * 3.1, seed + i);
    const y = area.y0 + (area.y1 - area.y0) * noise1(t * 0.04 + i * 5.7, seed + i + 50);
    const glow = (0.5 + 0.5 * Math.sin(t * (0.8 + (i % 5) * 0.23) + i)) * strength;
    if (glow < 0.05) continue;
    const grd = g.createRadialGradient(x, y, 0, x, y, 18);
    grd.addColorStop(0, `rgba(255,236,170,${0.75 * glow})`); grd.addColorStop(0.25, `rgba(255,210,120,${0.3 * glow})`); grd.addColorStop(1, 'rgba(255,200,100,0)');
    g.fillStyle = grd; g.fillRect(x - 18, y - 18, 36, 36);
  }
  g.restore();
}
export function motes(g, t, n, seed, area = { x0: 420, x1: 1640, y0: 180, y1: 940 }) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const u = noise1(i * 7.3, seed), v = ((t * 0.012 * (0.6 + noise1(i, seed + 3))) + noise1(i * 3.1, seed + 9)) % 1;
    const x = area.x0 + u * (area.x1 - area.x0) * 0.66 + v * (area.x1 - area.x0) * 0.34 + Math.sin(t * 0.3 + i) * 12, y = area.y0 + v * (area.y1 - area.y0);
    const a = Math.sin(v * Math.PI) * (0.35 + 0.35 * Math.sin(t * 1.3 + i * 2));
    if (a <= 0.02) continue;
    g.fillStyle = `rgba(255,240,205,${a})`; g.beginPath(); g.arc(x, y, 1.2 + (i % 3) * 0.6, 0, 7); g.fill();
  }
  g.restore();
}
export function nightGrade(g, k) {
  if (k <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(52,66,124,${0.68 * k})`; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(30,40,100,${0.3 * k})`; g.fillRect(0, 0, W, H);
  g.restore();
}
// warm, low sunlight (k: strength), or a pink-gold sunset (sunset: 0..1)
export function sunlight(g, k = 1, sunset = 0) {
  if (k <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = k;
  const lg = g.createLinearGradient(0, 0, W, H);
  lg.addColorStop(0, sunset ? `rgba(255,${Math.round(200 - 60 * sunset)},${Math.round(120 + 40 * sunset)},0.6)` : 'rgba(255,200,120,0.55)');
  lg.addColorStop(1, 'rgba(120,70,40,0.25)');
  g.fillStyle = lg; g.fillRect(0, 0, W, H); g.restore();
}
let STARS;
export function stars(g, t, k, appear = -99, area = { x0: 200, x1: 1700, y0: 60, y1: 420 }) {
  if (k <= 0) return;
  if (!STARS) { const r = rng(4242); STARS = []; for (let i = 0; i < 46; i++) STARS.push([r(), r(), r.range(0.6, 1.4), r()]); }
  g.save(); g.globalCompositeOperation = 'lighter';
  STARS.forEach(([u, v, sz, ph], i) => {
    const a = k * clamp((t - appear - i * 0.12) / 0.8) * (0.55 + 0.45 * Math.sin(t * (0.6 + ph) + i * 1.7));
    if (a <= 0.02) return;
    const x = area.x0 + u * (area.x1 - area.x0), y = area.y0 + v * (area.y1 - area.y0);
    const grd = g.createRadialGradient(x, y, 0, x, y, 6 * sz);
    grd.addColorStop(0, `rgba(255,248,220,${a})`); grd.addColorStop(0.3, `rgba(220,225,255,${a * 0.35})`); grd.addColorStop(1, 'rgba(200,210,255,0)');
    g.fillStyle = grd; g.fillRect(x - 6 * sz, y - 6 * sz, 12 * sz, 12 * sz);
  });
  g.restore();
}
export function moon(g, x, y, r, k) {
  if (k <= 0) return;
  g.save(); g.globalAlpha = k;
  pool(g, x, y, r * 4, r * 4, '#f4e6c0', 0.18, 'lighter');
  g.fillStyle = '#f7eed6'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.fillStyle = 'rgba(214,200,170,0.5)';
  for (const [dx, dy, rr] of [[-0.3, -0.2, 0.22], [0.25, 0.3, 0.15], [0.1, -0.4, 0.1]]) { g.beginPath(); g.arc(x + dx * r, y + dy * r, rr * r, 0, 7); g.fill(); }
  g.restore();
}
export function zzz(g, t, x, y, t0, t1, font = '"Fell"') {
  if (t < t0 || t > t1) return;
  g.save();
  for (let k = 0; k < 3; k++) {
    const ph = ((t - t0) / 3.2 + k / 3) % 1;
    g.globalAlpha = Math.sin(ph * Math.PI) * clamp((t1 - t) / 1.2) * clamp((t - t0) / 1.5) * 0.75;
    g.fillStyle = INK; g.font = `italic ${22 + ph * 26}px ${font}`;
    g.fillText('z', x + ph * 70 + Math.sin(ph * 6) * 8, y - ph * 120);
  }
  g.restore();
}

// ---------- the stage itself ----------
export function makeStage(timeline) {
  const TL = timeline, L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
  const S = { TL, L };
  S.line = (id) => L[id];
  S.talking = (id, t) => {
    const l = L[id]; if (!l || t < l.start || t > l.end) return 0;
    const f = (t - l.start) * 24, i = Math.floor(f), k = f - i;
    return (l.env[i] || 0) * (1 - k) + (l.env[i + 1] || 0) * k;
  };
  S.talk = (ids, t) => Math.max(...ids.map((id) => S.talking(id, t)));
  S.blink = (t, seed) => { const period = 3.6 + noise1(seed, 3) * 2, ph = (t + seed * 1.7) % period; return ph < 0.16 ? Math.sin((ph / 0.16) * Math.PI) : 0; };
  S.mood = (t, id, pre = 0.3, post = 0.8) => { const l = L[id]; return span(t, l.start - pre, l.start + 0.4) * (1 - span(t, l.end + post - 0.4, l.end + post)); };

  S.setup = async (ctxCanvas) => {
    for (const [name, style] of [['im-fell-english-latin-400-normal', 'normal'], ['im-fell-english-latin-400-italic', 'italic']]) {
      const f = new FontFace('Fell', `url(../../engine/fonts/${name}.woff2)`, { style });
      document.fonts.add(await f.load());
    }
    S.ctx = ctxCanvas.getContext('2d');
    S.PAPER = paper(W, H, '#f3e8d5', 7);
    S.GRAIN = paper(W, H, '#ffffff', 8);
    S.VIGNETTE = canvas(W, H);
    { const g = S.VIGNETTE.getContext('2d'), v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H);
      v.addColorStop(0, 'rgba(60,35,20,0)'); v.addColorStop(1, 'rgba(70,40,20,0.22)'); g.fillStyle = v; g.fillRect(0, 0, W, H); }
    S.bufA = canvas(W, H, false); S.bufB = canvas(W, H, false);
    buildFrame(S); buildMask(S);
  };
  // scenes: [[startTime, drawFn], ...]; dissolve D seconds into each new scene
  S.frame = (t, scenes, D = 1.8) => {
    const g = S.ctx;
    let i = 0;
    while (i + 1 < scenes.length && t >= scenes[i + 1][0]) i++;
    const [start, draw] = scenes[i];
    if (i > 0 && t < start + D) dissolve(S, scenes[i - 1][1], draw, t, (t - start) / D);
    else draw(g, t);
    finish(S, t);
  };
  S.paperBg = (g) => { g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(S.PAPER, 0, 0); };
  return S;
}

function buildFrame(S) {
  const r = rng(2024), pts = [], inset = 30;
  const side = (x0, y0, x1, y1) => {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 28);
    for (let i = 0; i < n; i++) {
      const k = i / n, nx = -(y1 - y0), ny = x1 - x0, d = Math.hypot(nx, ny);
      const bite = r() < 0.03 ? r.range(6, 14) : 0;
      const off = (noise1(i * 0.22, x0 + y0) - 0.5) * 16 + r.gauss(0, 0.8) - bite;
      pts.push([x0 + (x1 - x0) * k + nx / d * off, y0 + (y1 - y0) * k + ny / d * off]);
    }
  };
  side(inset, inset, W - inset, inset); side(W - inset, inset, W - inset, H - inset);
  side(W - inset, H - inset, inset, H - inset); side(inset, H - inset, inset, inset);
  const shape = smooth(pts, true, 2);
  const m = canvas(W, H, false), mg = m.getContext('2d');
  mg.filter = 'blur(2.5px)'; mg.fillStyle = '#fff'; mg.beginPath(); mg.moveTo(shape[0][0], shape[0][1]);
  for (const p of shape) mg.lineTo(p[0], p[1]); mg.closePath(); mg.fill();
  S.FRAME = m;
  const e = canvas(W, H, false), eg = e.getContext('2d');
  eg.filter = 'blur(1.6px)'; eg.strokeStyle = 'rgba(110,75,45,0.28)'; eg.lineWidth = 3.5; eg.lineJoin = 'round';
  eg.beginPath(); eg.moveTo(shape[0][0], shape[0][1]); for (const p of shape) eg.lineTo(p[0], p[1]); eg.closePath(); eg.stroke();
  eg.filter = 'none';
  for (const [cx, cy, n] of [[60, 70, 14], [W - 80, H - 60, 18], [W - 120, 40, 8], [90, H - 50, 10]]) {
    for (let i = 0; i < n; i++) {
      eg.fillStyle = rgba(r.pick(['#6f7d4c', '#c9a24f', '#b8603a', '#8f9a5b']), r.range(0.25, 0.55));
      eg.beginPath(); eg.arc(cx + r.gauss(0, 45), cy + r.gauss(0, 30), Math.pow(r(), 2) * 5 + 0.8, 0, 7); eg.fill();
    }
  }
  S.FRAME_EDGE = e;
}
function buildMask(S) {
  const w = 240, h = 135, c = canvas(w, h, false), g = c.getContext('2d');
  g.drawImage(noiseTexture(), 0, 0, 512, 512, 0, 0, w * 1.1, h * 1.1);
  const d = g.getImageData(0, 0, w, h).data, out = new Float32Array(w * h);
  let lo = 1, hi = 0;
  for (let i = 0; i < w * h; i++) { out[i] = d[i * 4] / 255; lo = Math.min(lo, out[i]); hi = Math.max(hi, out[i]); }
  for (let i = 0; i < w * h; i++) {
    const x = (i % w) / w, y = Math.floor(i / w) / h;
    out[i] = 0.55 * (out[i] - lo) / (hi - lo) + 0.45 * Math.hypot(x - 0.5, (y - 0.5) * 0.6) * 1.6;
  }
  S.mask = canvas(w, h, false); S.maskNoise = out;
}
function dissolve(S, drawA, drawB, t, p) {
  const ga = S.bufA.getContext('2d'), gb = S.bufB.getContext('2d');
  drawA(ga, t); drawB(gb, t);
  const w = S.mask.width, h = S.mask.height, mg = S.mask.getContext('2d');
  const img = mg.createImageData(w, h), th = p * 1.5 - 0.3;
  for (let i = 0; i < w * h; i++) img.data[i * 4 + 3] = 255 * clamp((th - S.maskNoise[i]) / 0.3);
  mg.putImageData(img, 0, 0);
  gb.save(); gb.setTransform(1, 0, 0, 1, 0, 0); gb.globalCompositeOperation = 'destination-in';
  gb.imageSmoothingQuality = 'high'; gb.filter = 'blur(14px)'; gb.drawImage(S.mask, -20, -20, W + 40, H + 40); gb.restore();
  const g = S.ctx;
  g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(S.bufA, 0, 0); g.drawImage(S.bufB, 0, 0);
}
function finish(S, t) {
  const g = S.ctx;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.filter = 'contrast(1.12) saturate(1.1)'; g.drawImage(g.canvas, 0, 0); g.filter = 'none';
  g.drawImage(S.VIGNETTE, 0, 0);
  g.save();
  g.globalCompositeOperation = 'destination-in'; g.drawImage(S.FRAME, 0, 0);
  g.globalCompositeOperation = 'destination-over'; g.drawImage(S.PAPER, 0, 0);
  g.globalCompositeOperation = 'source-over'; g.drawImage(S.FRAME_EDGE, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.35; g.drawImage(S.GRAIN, 0, 0);
  g.restore();
  if (S.captions !== false) drawCaption(g, t, S.TL);
  const fadeIn = 1 - span(t, 0, 1.2), fadeOut = span(t, S.TL.duration - 7, S.TL.duration - 0.5);
  if (fadeIn > 0) { g.fillStyle = `rgba(242,231,211,${fadeIn})`; g.fillRect(0, 0, W, H); }
  if (fadeOut > 0) { g.fillStyle = `rgba(20,24,44,${fadeOut})`; g.fillRect(0, 0, W, H); }
}

// ---------- captions: the words of each line, shown softly at the bottom while they are spoken ----------
let CAP_CACHE = null;
export function drawCaption(g, t, timeline) {
  if (!CAP_CACHE || CAP_CACHE.tl !== timeline) CAP_CACHE = { tl: timeline, lines: timeline.lines.slice().sort((a, b) => a.start - b.start) };
  const lines = CAP_CACHE.lines;
  let cur = null, next = null;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i], nx = lines[i + 1];
    const end = Math.min(l.end + 0.6, nx ? nx.start - 0.15 : l.end + 0.6);
    if (t >= l.start - 0.15 && t <= end) { cur = l; next = end; break; }
  }
  if (!cur) return;
  const a = clamp((t - (cur.start - 0.15)) / 0.3) * clamp((next - t) / 0.3);
  if (a <= 0) return;
  const quote = cur.speaker !== 'narrator';
  const text = quote ? `“${cur.text}”` : cur.text;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.font = '46px "Fell", Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  // wrap into at most two balanced lines
  const maxW = 1380, words = text.split(' ');
  let rows = [text];
  if (g.measureText(text).width > maxW) {
    let best = null;
    for (let k = 1; k < words.length; k++) {
      const r1 = words.slice(0, k).join(' '), r2 = words.slice(k).join(' ');
      const w = Math.max(g.measureText(r1).width, g.measureText(r2).width);
      if (!best || w < best.w) best = { w, rows: [r1, r2] };
    }
    rows = best.rows;
  }
  const lh = 58, boxW = Math.max(...rows.map((r) => g.measureText(r).width)) + 70, boxH = rows.length * lh + 30;
  const cx = W / 2, cy = H - 70 - boxH / 2;
  g.globalAlpha = a;
  g.filter = 'blur(6px)'; g.fillStyle = 'rgba(34,24,16,0.5)';
  g.beginPath(); g.roundRect(cx - boxW / 2, cy - boxH / 2, boxW, boxH, 26); g.fill();
  g.filter = 'none';
  rows.forEach((r, i) => {
    const y = cy - (rows.length - 1) * lh / 2 + i * lh;
    g.fillStyle = 'rgba(20,14,10,0.6)'; g.fillText(r, cx + 1.5, y + 2);
    g.fillStyle = '#fbf3e2'; g.fillText(r, cx, y);
  });
  g.restore();
}
