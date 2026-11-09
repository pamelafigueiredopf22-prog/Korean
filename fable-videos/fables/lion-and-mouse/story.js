// The Lion and the Mouse: scenes, staging and timing.
import { W, H, rng, paper, canvas, wash, ink, pool, strokes, ellipse, smooth, fluffy, sprite, drawSprite, bbox,
  noise1, rgba, mix, tint, shade, clamp, lerp, ease, span, noiseTexture, glaze, shadeEdge, pencil } from '../../engine/watercolor.js';
import { PAL, foliage, trunk, grass, flower, berries, mushroom, fern, hills, cloud, leaf, plant } from '../../engine/scenery.js';
import { makeLion } from '../../engine/characters/lion.js';
import { makeMouse } from '../../engine/characters/mouse.js';
import { makeLionWalk } from '../../engine/characters/lion-walk.js';
import { drawNet, drawNetBundle } from '../../engine/props.js';

const M = 96, MY = 54;              // layer margin for camera moves
const LW = W + 2 * M, LH = H + 2 * MY;
const INK = '#4a3226';

let TL, L, ctx, PAPER, GRAIN, VIGNETTE, FRAME, FRAME_EDGE, bufA, bufB, mask, maskNoise;
let S1, S2, TITLE, lionW, lionC, mouseW, mouseC;

// ---------- timeline helpers ----------
function line(id) { return L[id]; }
function talking(id, t) {
  const l = L[id]; if (!l || t < l.start || t > l.end) return 0;
  const f = (t - l.start) * 24, i = Math.floor(f), k = f - i;
  return lerp(l.env[i] || 0, l.env[i + 1] || 0, k);
}
function talk(ids, t) { return Math.max(...ids.map((id) => talking(id, t))); }
// natural blinking: a quick close every few seconds
function blink(t, seed) {
  const period = 3.6 + noise1(seed, 3) * 2, ph = ((t + seed * 1.7) % period) / period * period;
  return ph < 0.16 ? Math.sin((ph / 0.16) * Math.PI) : 0;
}

function layer(paintFn) {
  const c = canvas(LW, LH), g = c.getContext('2d');
  g.translate(M, MY); paintFn(g); return c;
}
function cam(g, c, p = 1) {
  const z = 1 + (c.z - 1) * p;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.translate(W / 2, H / 2); g.scale(z, z); g.translate(-W / 2 - c.x * p, -H / 2 - c.y * p);
}
function drawLayer(g, c, img, p) { cam(g, c, p); g.drawImage(img, -M, -MY); }

// ================= SCENE 1: golden evening, the lion asleep under his tree =================
function paintScene1() {
  const sky = layer((g) => {
    const grd = g.createLinearGradient(0, -MY, 0, 760);
    grd.addColorStop(0, '#e8c6ad'); grd.addColorStop(0.55, '#f2d4ae'); grd.addColorStop(1, '#f6e0b6');
    g.fillStyle = grd; g.globalAlpha = 0.85; g.fillRect(-M, -MY, LW, LH); g.globalAlpha = 1;
    wash(g, [[-M, -MY], [W + M, -MY], [W + M, 220], [-M, 300]], { color: '#e3b9a6', opacity: 0.35, seed: 3, bleed: 0.12, edge: 0 });
    pool(g, 520, 600, 520, 300, '#fbd38a', 0.55);
    pool(g, 520, 610, 180, 120, '#fff0c8', 0.6);
  });
  const clouds = [[300, 170, 190, 50, 1], [880, 110, 240, 55, 2], [1500, 200, 200, 45, 3], [1900, 120, 170, 40, 4], [-150, 260, 160, 40, 5]].map(([x, y, w, h, sd]) =>
    ({ x, y, s: sprite({ x0: x - w, y0: y - h, x1: x + w, y1: y + h, w: 2 * w, h: 2 * h }, 1, (g) => cloud(g, x, y, w, h, { seed: sd * 13, color: sd % 2 ? '#f8e3d0' : '#f3d0bf' }), { granulate: false }) }));
  const far = layer((g) => {
    hills(g, 610, 70, '#c3a9b4', { seed: 4, opacity: 0.55, bumps: 3 });
    // misty distant tree line
    for (let i = 0; i < 26; i++) {
      const x = -60 + i * 85 + noise1(i, 2) * 40, y = 600 + noise1(i, 5) * 30;
      foliage(g, x, y - 20, 55, 45, { seed: 200 + i, haze: 0.62, hazeColor: '#e7cdb6', blobs: 4, opacity: 0.7, detail: false });
    }
    hills(g, 650, 40, '#b7b38e', { seed: 5, opacity: 0.55, bumps: 5 });
  });
  const mid = layer((g) => {
    // slender background trees with branching crowns, softened by evening haze
    const hz = { haze: 0.42, hazeColor: '#ecd2b4' };
    for (const [x, h, sd, w] of [[110, 600, 1, 28], [400, 520, 3, 18], [1660, 560, 4, 22], [1880, 640, 5, 30]]) {
      const base = 700, top = base - h;
      trunk(g, [[x, base], [x + 6, base - h * 0.5], [x - 4, top + 60]], w, w * 0.45, { seed: sd * 7, ...hz });
      trunk(g, [[x, base - h * 0.55], [x - 50, top + 90], [x - 90, top + 50]], w * 0.4, w * 0.15, { seed: sd * 7 + 1, ...hz });
      trunk(g, [[x + 2, base - h * 0.62], [x + 55, top + 80], [x + 95, top + 60]], w * 0.4, w * 0.15, { seed: sd * 7 + 2, ...hz });
      foliage(g, x - 80, top + 50, 120, 85, { seed: sd * 50, ...hz, blobs: 6, opacity: 0.8 });
      foliage(g, x + 85, top + 60, 115, 80, { seed: sd * 50 + 1, ...hz, blobs: 6, opacity: 0.8 });
      foliage(g, x, top - 10, 150, 105, { seed: sd * 50 + 2, ...hz, blobs: 7, opacity: 0.85 });
    }
    // soft bushes along the meadow edge
    for (let i = 0; i < 9; i++) foliage(g, -40 + i * 250 + noise1(i, 9) * 80, 690, 120, 50, { seed: 400 + i, haze: 0.25, hazeColor: '#e9d2b0', blobs: 6, opacity: 0.75 });
  });
  const ground = layer((g) => {
    wash(g, smooth([[-M - 50, 680], [400, 668], [900, 690], [1400, 676], [W + M + 50, 690], [W + M + 50, LH], [-M - 50, LH]]), { color: '#cdb478', opacity: 0.9, seed: 21, bleed: 0.02, layers: 24 });
    wash(g, smooth([[-M - 50, 820], [600, 790], [1300, 820], [W + M + 50, 800], [W + M + 50, LH], [-M - 50, LH]]), { color: '#a9ae7f', opacity: 0.6, seed: 22, bleed: 0.03, layers: 20 });
    wash(g, smooth([[-M - 50, 950], [700, 930], [1500, 960], [W + M + 50, 940], [W + M + 50, LH], [-M - 50, LH]]), { color: '#8f9a66', opacity: 0.45, seed: 23, bleed: 0.04, layers: 20 });
    pool(g, 520, 720, 700, 120, '#fbd896', 0.35);
    // warm shade under the big tree
    pool(g, 1250, 830, 520, 80, '#6b5a3a', 0.25);
    const r = rng(77);
    // dappled light and leaf shade across the meadow
    for (let i = 0; i < 26; i++) {
      const x = r.range(-60, W + 60), y = r.range(720, 1060), sz = r.range(60, 170);
      pool(g, x, y, sz, sz * 0.3, r() < 0.5 ? '#5f6b3a' : '#fbe2a0', r.range(0.12, 0.25));
    }
    strokes(g, [[-M, 700], [W + M, 700], [W + M, LH], [-M, LH]], { color: '#6f7d4c', count: 1400, len: 9, width: 1.1, alpha: 0.28, seed: 78, dir: () => -Math.PI / 2, curve: 0.4 });
    strokes(g, [[-M, 700], [W + M, 700], [W + M, LH], [-M, LH]], { color: '#e9d79a', count: 500, len: 8, width: 1, alpha: 0.3, seed: 79, dir: () => -Math.PI / 2, curve: 0.4 });
    for (let i = 0; i < 300; i++) {
      const x = r.range(-80, W + 80), y = r.range(700, 1120);
      if (x > 700 && x < 1560 && y < 860) continue; // keep the lion's bed clear
      grass(g, x, y, { seed: 900 + i, h: 18 + (y - 700) * 0.09, n: 6, alpha: 0.55 });
    }
    for (let i = 0; i < 60; i++) {
      const x = r.range(-60, W + 60), y = r.range(720, 1100);
      if (x > 680 && x < 1580 && y < 870) continue;
      const k = r();
      if (k < 0.55) flower(g, x, y, { seed: 1200 + i, size: 4 + (y - 700) * 0.012, color: r.pick([PAL.pink, '#f1e2c8', '#e7a35a', '#d7b0c4']), stem: 8 + (y - 700) * 0.03 });
      else if (k < 0.75) berries(g, x, y, { seed: 1300 + i, size: 3 + (y - 700) * 0.006 });
    }
  });
  const bigTree = layer((g) => {
    // roots and trunk of the lion's favourite old tree
    trunk(g, [[1420, 800], [1400, 560], [1415, 300], [1395, 60], [1420, -80]], 170, 120, { seed: 31, under: true });
    for (const [pts, w, sd] of [[[[1335, 795], [1290, 810], [1240, 818]], 40, 1], [[[1500, 795], [1550, 808], [1600, 815]], 40, 2], [[[1420, 800], [1440, 815], [1470, 822]], 30, 3]])
      trunk(g, pts, w, 6, { seed: 40 + sd, under: true });
    // a knot hole, cosy and dark
    wash(g, ellipse(1435, 470, 22, 32, 20), { color: '#3c2a20', opacity: 0.85, seed: 33 });
    ink(g, ellipse(1435, 470, 26, 36, 20), { alpha: 0.4, closed: true, seed: 34 });
    // the long branch reaching over the lion
    trunk(g, [[1380, 220], [1150, 170], [900, 150], [650, 165], [470, 140]], 60, 14, { seed: 35, under: true });
    trunk(g, [[1050, 165], [980, 100], [940, 40]], 18, 5, { seed: 36 });
    trunk(g, [[760, 160], [720, 205], [700, 250]], 12, 4, { seed: 37 });
    // moss and mushrooms at the roots
    for (const [x, y, sd, s] of [[1275, 815, 1, 1.0], [1300, 822, 2, 0.7], [1555, 812, 3, 0.9], [1585, 818, 4, 0.6], [1500, 805, 5, 0.55]]) mushroom(g, x, y, { seed: 60 + sd, s });
    for (let i = 0; i < 6; i++) fern(g, 1600 + i * 30, 830, { seed: 70 + i, len: 120 + i * 10, angle: -1.9 + i * 0.25, curl: 0.6, color: PAL.moss });
    for (let i = 0; i < 4; i++) fern(g, 1200 - i * 26, 830, { seed: 80 + i, len: 90, angle: -1.3 - i * 0.25, curl: -0.6, color: PAL.olive });
  });
  // canopy clusters along the top, each sways a little on its own
  const canopy = [[420, 120, 170, 95], [640, 60, 220, 120], [900, 40, 240, 110], [1150, 70, 230, 120], [1400, 30, 300, 150], [1700, 70, 260, 140], [1900, 140, 200, 120], [760, 210, 120, 60], [1080, 180, 130, 70]].map(([x, y, rx, ry], i) =>
    ({ x, y, s: sprite({ x0: x - rx, y0: y - ry, x1: x + rx, y1: y + ry, w: 2 * rx, h: 2 * ry }, 1, (g) => {
      foliage(g, x, y, rx, ry, { seed: 500 + i * 11, colors: [PAL.olive, PAL.moss, PAL.ochre, PAL.sage, '#c98a4a'], blobs: 11, opacity: 0.88 });
      for (let k = 0; k < 4; k++) leaf(g, x + (k - 1.5) * rx * 0.4, y + ry * 0.75 + (k % 2) * 12, 12, 0.3 * (k - 1.5), k % 2 ? PAL.ochre : PAL.olive);
    }) }));
  // foreground: lush clusters of leafy plants, ferns, berries and flowers that sway
  const fg = [];
  const r = rng(808);
  const clusters = [[-30, 230, 1], [250, 150, 0], [560, 110, 0], [1380, 120, 0], [1640, 170, 1], [1930, 240, 1]];
  for (const [i, [x, h, big]] of clusters.entries()) {
    const y = H + 40;
    fg.push({ x, y, ph: r() * 6, s: sprite({ x0: x - h * 1.3, y0: y - h * 1.35, x1: x + h * 1.3, y1: y + 10, w: h * 2.6, h: h * 1.35 + 10 }, 1, (g) => {
      grass(g, x, y, { seed: 2000 + i, h: h * 0.7, n: 18, width: 4.5, alpha: 0.8, colors: [PAL.moss, PAL.deep, PAL.olive, '#7d8a52'] });
      if (big) fern(g, x - h * 0.3, y, { seed: 2200 + i, len: h * 1.15, angle: -1.25, curl: 0.55, color: PAL.deep, alpha: 0.85, leaf: 1.6 });
      plant(g, x, y, { seed: 2300 + i, h, n: big ? 7 : 5, under: true, colors: [PAL.moss, '#7f9a6a', PAL.olive, '#62774a'] });
      if (i % 2) berries(g, x + h * 0.45, y - h * 0.55, { seed: 2400 + i, n: 5, size: 7 });
      else flower(g, x - h * 0.4, y - h * 0.7, { seed: 2500 + i, size: 11, color: i % 3 ? '#f0e0c4' : PAL.pink, stem: h * 0.7 });
      if (big) for (let k = 0; k < 3; k++) flower(g, x + (k - 1) * h * 0.35, y - h * (0.85 + k * 0.08), { seed: 2600 + i * 5 + k, size: 9, color: k % 2 ? PAL.pink : '#f3e6cc', stem: h * 0.8 });
    }) });
  }
  for (let i = 0; i < 14; i++) {
    const x = 120 + i * 130 + r.gauss(0, 25), y = H + 30, h = r.range(60, 110);
    fg.push({ x, y, ph: r() * 6, s: sprite({ x0: x - h, y0: y - h * 1.2, x1: x + h, y1: y, w: 2 * h, h: h * 1.2 }, 1, (g) => {
      grass(g, x, y, { seed: 2700 + i, h, n: 12, width: 4, alpha: 0.8, colors: [PAL.moss, PAL.deep, PAL.olive, '#7d8a52'] });
    }, { granulate: false }) });
  }
  fg.sort((p, q) => q.s.h - p.s.h); // big clusters behind the small tufts
  // sunbeams slanting through the canopy, painted once and softly blurred
  const beams = canvas(W, H);
  { const g = beams.getContext('2d'); g.filter = 'blur(28px)';
    for (const [x0, w0, a] of [[380, 70, 0.5], [620, 120, 0.42], [900, 60, 0.35], [1120, 100, 0.3]]) {
      const grd = g.createLinearGradient(x0, 0, x0 + 520, H);
      grd.addColorStop(0, `rgba(255,236,190,${a})`); grd.addColorStop(0.7, `rgba(255,226,170,${a * 0.4})`); grd.addColorStop(1, 'rgba(255,220,160,0)');
      g.fillStyle = grd; g.beginPath(); g.moveTo(x0, 150); g.lineTo(x0 + w0, 150); g.lineTo(x0 + w0 * 3 + 520, H); g.lineTo(x0 + 520, H); g.closePath(); g.fill();
    } }
  return { sky, clouds, far, mid, ground, bigTree, canopy, fg, beams };
}

function fireflies(g, t, n, area, seed, strength = 1) {
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

// dust motes drifting slowly in the sunbeams
function motes(g, t, n, seed) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const u = noise1(i * 7.3, seed), v = ((t * 0.012 * (0.6 + noise1(i, seed + 3))) + noise1(i * 3.1, seed + 9)) % 1;
    const x = 420 + u * 800 + v * 420 + Math.sin(t * 0.3 + i) * 12, y = 180 + v * 760;
    const a = Math.sin(v * Math.PI) * (0.35 + 0.35 * Math.sin(t * 1.3 + i * 2));
    if (a <= 0.02) continue;
    g.fillStyle = `rgba(255,240,205,${a})`; g.beginPath(); g.arc(x, y, 1.2 + (i % 3) * 0.6, 0, 7); g.fill();
  }
  g.restore();
}

function zzz(g, t, x, y, t0, t1) {
  if (t < t0 || t > t1) return;
  g.save();
  for (let k = 0; k < 3; k++) {
    const ph = ((t - t0) / 3.2 + k / 3) % 1;
    const a = Math.sin(ph * Math.PI) * clamp((t1 - t) / 1.2) * clamp((t - t0) / 1.5);
    g.globalAlpha = a * 0.75;
    g.fillStyle = INK;
    g.font = `italic ${22 + ph * 26}px "Fell"`;
    g.fillText('z', x + ph * 70 + Math.sin(ph * 6) * 8, y - ph * 120);
  }
  g.restore();
}

// where the mouse is in scene 1 (screen coords), and how she moves
function mousePath1(t) {
  const tIn = line('n04').start - 0.4, tPaw = line('n05').start + 2.2, tJump = line('n05').end - 2.4, tLand = tJump + 1.3;
  if (t < tIn) return null;
  const pts = [];
  if (t < tPaw) { const k = (t - tIn) / (tPaw - tIn); return { x: lerp(-90, 650, k), y: 845, run: t * 2.1 }; }
  if (t < tPaw + 0.5) { const k = ease((t - tPaw) / 0.5); return { x: lerp(650, 735, k), y: lerp(845, 782, k) - Math.sin(k * Math.PI) * 25, run: null, hop: 0 }; }
  if (t < tJump) { const k = (t - tPaw - 0.5) / (tJump - tPaw - 0.5); return { x: lerp(735, 790, k), y: 780, run: t * 2.1 }; }
  if (t < tLand) { const k = (t - tJump) / (tLand - tJump); return { x: lerp(790, 965, k), y: lerp(780, 765, k) - Math.sin(k * Math.PI) * 95, run: null, air: true }; }
  const k = (t - tLand); return { x: 965 + k * 70, y: 765 + Math.min(1, k) * 60, run: t * 2.4 };
}

// ---------- night helpers ----------
let STARS, NIGHT_SKY;
function nightGrade(g, k) {
  if (k <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(52,66,124,${0.68 * k})`; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(30,40,100,${0.3 * k})`; g.fillRect(0, 0, W, H);
  g.restore();
}
function stars(g, t, k, appear = 0, area = { x0: 560, x1: 1290, y0: 245, y1: 540 }) {
  if (k <= 0) return;
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
// phase: 0 = full, 1 = thin crescent
function moon(g, x, y, r, k, phase = 0, skyCol = '#2a3360') {
  if (k <= 0) return;
  g.save();
  g.globalAlpha = k;
  pool(g, x, y, r * 4, r * 4, '#f4e6c0', 0.18, 'lighter');
  g.fillStyle = '#f7eed6'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.fillStyle = 'rgba(214,200,170,0.5)';
  for (const [dx, dy, rr] of [[-0.3, -0.2, 0.22], [0.25, 0.3, 0.15], [0.1, -0.4, 0.1]]) { g.beginPath(); g.arc(x + dx * r, y + dy * r, rr * r, 0, 7); g.fill(); }
  if (phase > 0.01) { g.fillStyle = skyCol; g.beginPath(); g.arc(x - r * 2 * (1 - phase * 0.78), y - r * 0.08, r * 1.02, 0, 7); g.fill(); }
  g.restore();
}

// The glade under the old tree, by day or night. `actors(g)` draws the characters in world space.
function drawGlade(g, t, o) {
  const c = o.cam, night = o.night || 0;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(PAPER, 0, 0);
  drawLayer(g, c, S1.sky, 0.15);
  if (night > 0) { cam(g, c, 0.15); g.globalAlpha = night; g.drawImage(NIGHT_SKY, -M, -MY); g.globalAlpha = 1; }
  for (const cl of S1.clouds) { cam(g, c, 0.2); g.translate(t * 3.5, 0); drawSprite(g, cl.s, 0.9 * (1 - night)); }
  drawLayer(g, c, S1.far, 0.35);
  drawLayer(g, c, S1.mid, 0.6);
  drawLayer(g, c, S1.ground, 1);
  drawLayer(g, c, S1.bigTree, 1);
  cam(g, c, 1);
  o.actors(g);
  for (const [i, cn] of S1.canopy.entries()) {
    cam(g, c, 1.05);
    const a = Math.sin(t * 0.5 + i) * 0.012;
    g.translate(cn.x, cn.y - 80); g.rotate(a); g.translate(-cn.x, -(cn.y - 80));
    drawSprite(g, cn.s);
  }
  cam(g, c, 1.05);
  for (let i = 0; i < 4; i++) {
    const period = 14, ph = ((t + i * 3.7) % period) / period;
    const x = 500 + i * 330 + Math.sin(ph * 9 + i) * 60, y = 120 + ph * 900;
    g.save(); g.globalAlpha = Math.sin(ph * Math.PI);
    leafSprite(g, x, y, ph * 8 + i, i);
    g.restore();
  }
  cam(g, c, 1);
  if (night < 1) {
    g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = (0.75 + 0.25 * Math.sin(t * 0.25)) * (1 - night);
    g.drawImage(S1.beams, 0, 0); g.restore();
    g.save(); g.globalAlpha = 1 - night; motes(g, t, 40, 11); g.restore();
  }
  if (night < 0.5) fireflies(g, t, 22, { x0: 0, x1: W, y0: 380, y1: 980 }, 11, 0.8 * (1 - night));
  for (const tuft of S1.fg) {
    cam(g, c, 1.2);
    g.translate(tuft.x, tuft.y); g.rotate(Math.sin(t * 0.6 + tuft.ph) * 0.02); g.translate(-tuft.x, -tuft.y);
    drawSprite(g, tuft.s);
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 1 - night;
  const lg = g.createLinearGradient(0, 0, W, H);
  lg.addColorStop(0, 'rgba(255,200,120,0.55)'); lg.addColorStop(1, 'rgba(120,70,40,0.25)');
  g.fillStyle = lg; g.fillRect(0, 0, W, H); g.restore();
  nightGrade(g, night);
  if (night > 0) {
    cam(g, c, 0.15);
    stars(g, t, night, o.starsFrom ?? -99);
    moon(g, 1160, 320, 30, night * (o.moonK ?? 1), o.moonPhase || 0);
    cam(g, c, 1);
    fireflies(g, t, o.flies ?? 26, { x0: 0, x1: W, y0: 420, y1: 1000 }, 41, night);
    if (o.after) o.after(g);
  }
}

function drawScene1(g, t) {
  const t0 = 4, sceneEnd = line('n06').start + 1;
  const k = clamp((t - t0) / (sceneEnd - t0));
  const c = { z: 1.0 + 0.07 * ease(k), x: lerp(0, 60, ease(k)), y: lerp(0, 25, ease(k)) };
  drawGlade(g, t, { cam: c, night: 0, actors: (g) => {
    const mp = mousePath1(t);
    const tJump = line('n05').end - 2.4;
    const twitch = t > tJump + 0.4 && t < tJump + 1.4 ? Math.sin((t - tJump - 0.4) * Math.PI) : 0;
    g.save(); g.translate(1060, 815); g.scale(0.82, 0.82);
    lionW.draw(g, { breath: Math.sin(t * 2 * Math.PI / 5.2), eyes: [0, 0], headDY: -twitch * 4, headTilt: twitch * 0.02, tail: Math.sin(t * 0.7) * 0.6 + (noise1(t * 0.3, 4) - 0.5) });
    g.restore();
    zzz(g, t, 930, 560, line('n02').start, tJump);
    if (mp) {
      g.save(); g.translate(mp.x, mp.y); g.scale(0.55, 0.55);
      mouseW.draw(g, { t, run: mp.run, hop: 0, flutter: mp.run != null || mp.air ? 1 : 0.3, look: mp.air ? -0.25 : 0, blink: blink(t, 2) });
      g.restore();
    }
  } });
}

// ================= SCENE 3: night falls, the moon waxes and wanes =================
function drawScene3(g, t) {
  const n09 = line('n09'), n10 = line('n10');
  const k = clamp((t - n09.start + 1) / (n10.end + 3 - n09.start));
  const c = { z: 1.04 - 0.04 * ease(k), x: lerp(40, 0, ease(k)), y: lerp(15, 0, ease(k)) };
  const night = span(t, n09.start + 0.5, n09.start + 6);
  // the moon grows round, then thin, then round again
  const mp = span(t, n10.start + 1.0, n10.start + 2.6) - span(t, n10.start + 3.0, n10.start + 4.6);
  drawGlade(g, t, { cam: c, night, starsFrom: n09.start + 3.2, moonPhase: mp, actors: (g) => {
    g.save(); g.translate(1060, 815); g.scale(0.82, 0.82);
    const sleepy = span(t, n09.start + 1, n09.start + 4);
    lionW.draw(g, { breath: Math.sin(t * 2 * Math.PI / 5.6), eyes: [1 - sleepy, 1 - sleepy], smile: 0.6, headDY: sleepy * 4, tail: Math.sin(t * 0.6) * 0.5 });
    g.restore();
    zzz(g, t, 930, 560, n09.start + 5, n10.end + 4);
    // the mouse scampers home through the grass
    const run = (t - n09.start + 0.6);
    const mx = 760 - run * 150;
    if (mx > -80) {
      g.save(); g.translate(mx, 842 + Math.min(1, run) * 4); g.scale(-0.55, 0.55);
      mouseW.draw(g, { t, run: t * 2.4, flutter: 1, blink: blink(t, 2) });
      g.restore();
    }
  } });
}

let LEAVES;
function leafSprite(g, x, y, rot, i) {
  const s = LEAVES[i % LEAVES.length];
  g.translate(x, y); g.rotate(rot); g.translate(-x, -y);
  g.drawImage(s.c, x - s.w / 2, y - s.h / 2, s.w, s.h);
}

// ================= SCENE 2: close up, a paw on a tiny tail =================
function paintScene2() {
  const bg = layer((g) => {
    const grd = g.createLinearGradient(0, -MY, 0, H);
    grd.addColorStop(0, '#ecc9a6'); grd.addColorStop(0.6, '#f2d9ae'); grd.addColorStop(1, '#e8cf9a');
    g.fillStyle = grd; g.globalAlpha = 0.8; g.fillRect(-M, -MY, LW, LH); g.globalAlpha = 1;
    // out-of-focus trees and leaves, painted sharp then blurred as one (depth of field)
    const soft = layer((h) => {
      for (const [x, w, sd] of [[180, 90, 1], [520, 50, 2], [1250, 70, 3]]) trunk(h, [[x, 1100], [x + 10, 500], [x - 10, -60]], w, w * 0.7, { seed: sd * 3, haze: 0.5, hazeColor: '#efd3b2' });
      for (let i = 0; i < 10; i++) foliage(h, i * 230 - 50, 60 + (i % 3) * 70, 200, 120, { seed: 600 + i, haze: 0.4, hazeColor: '#efd3b2', blobs: 7, detail: false });
    });
    g.filter = 'blur(9px)'; g.drawImage(soft, -M, -MY); g.filter = 'none';
    pool(g, 450, 380, 600, 380, '#fde0a0', 0.45);
    // bokeh
    const r = rng(41);
    for (let i = 0; i < 30; i++) pool(g, r.range(-50, W + 50), r.range(0, 600), r.range(14, 40), r.range(14, 40), r() < 0.5 ? '#fff3cf' : '#f9d79a', r.range(0.25, 0.55));
    // ground
    wash(g, smooth([[-M - 50, 760], [700, 740], [1300, 770], [W + M + 50, 750], [W + M + 50, LH], [-M - 50, LH]]), { color: '#c4ae74', opacity: 0.9, seed: 51, bleed: 0.04 });
    wash(g, smooth([[-M - 50, 900], [800, 880], [W + M + 50, 900], [W + M + 50, LH], [-M - 50, LH]]), { color: '#9da477', opacity: 0.55, seed: 52, bleed: 0.03 });
    for (let i = 0; i < 70; i++) grass(g, r.range(-80, W + 80), r.range(790, 1100), { seed: 700 + i, h: 40 + r() * 40, n: 7, width: 4, alpha: 0.5 });
    for (let i = 0; i < 14; i++) flower(g, r.range(0, 560), r.range(820, 1060), { seed: 800 + i, size: 10, color: r.pick([PAL.pink, '#f1e2c8', '#e7a35a']), stem: 30 });
    for (const [x, y, s, sd] of [[260, 1000, 2.2, 1], [360, 1020, 1.5, 2], [120, 960, 1.2, 3]]) mushroom(g, x, y, { seed: 90 + sd, s });
  });
  const sharpFg = layer((g) => {
    for (let i = 0; i < 5; i++) grass(g, -40 + i * 45, H + 40, { seed: 3000 + i, h: 260, n: 8, width: 9, alpha: 0.8, colors: [PAL.deep, PAL.moss], lean: 0.3 });
    plant(g, 40, H + 60, { seed: 3300, h: 330, n: 6, colors: [PAL.deep, PAL.moss, '#62774a'], under: true });
    plant(g, W - 60, H + 80, { seed: 3301, h: 300, n: 5, colors: [PAL.moss, PAL.deep, '#62774a'], spread: 1.6, under: true });
    fern(g, W - 40, H + 20, { seed: 3200, len: 420, angle: -2.2, curl: -0.6, color: PAL.deep, alpha: 0.75, leaf: 3 });
  });
  const fg = canvas(LW, LH);
  { const g = fg.getContext('2d'); g.filter = 'blur(6px)'; g.drawImage(sharpFg, 0, 0); }
  return { bg, fg };
}

function drawScene2(g, t) {
  const s0 = line('n06').start - 1, sEnd = TL.duration;
  const k = clamp((t - s0) / (sEnd - s0));
  // gentle drift toward whoever is speaking
  const lionTalk = talk(['l01', 'l02', 'l03'], t), mouseTalk = talk(['m01', 'm02', 'm03'], t);
  const focus = noise1(t * 0.1, 3) * 0.3;
  const c = { z: 1.02 + 0.05 * ease(k), x: lerp(-10, 30, ease(k)) + focus * 20, y: -10 };
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(PAPER, 0, 0);
  drawLayer(g, c, S2.bg, 0.5);

  const n06 = line('n06'), n07 = line('n07'), n08 = line('n08'), m03 = line('m03'), l01 = line('l01');
  // lion acting
  const eyeR = span(t, n06.start + 1.0, n06.start + 2.2);
  const eyeL = span(t, n06.start + 6.0, n06.start + 6.8);
  const awake = Math.min(eyeR, 1);
  const bl = t > l01.start ? blink(t, 7) : 0;
  const chuckling = t > n07.start + 0.5 && t < n07.end + 0.3;
  const smile = clamp(span(t, n07.start, n07.start + 1) * 1 - span(t, n07.end + 0.3, l01.start + 30) * 0.4 + span(t, line('l03').start, line('l03').start + 1) * 0.6);
  // the paw: tucked back, then up, forward, and gently down onto the tail tip...
  const T = n06.start, press = T + 5.2;
  const up1 = span(t, T + 3.4, T + 4.5), down1 = span(t, T + 4.6, press);
  // ...and later lifted away again so the tail springs free
  const R = n08.start, up2 = span(t, R + 0.6, R + 1.6), down2 = span(t, R + 1.8, R + 2.8);
  const pinned = t >= press && t < R + 1.0;
  const pawLift = up1 * (1 - down1) + up2 * (1 - down2);
  const pawReach = 85 * (1 - up1) + 85 * up2;
  // moods, eased in and out around each line
  const mood = (id, pre = 0.3, post = 0.8) => { const l = line(id); return span(t, l.start - pre, l.start + 0.4) * (1 - span(t, l.end + post - 0.4, l.end + post)); };
  const curious = mood('l01'), amused = mood('l02'), tender = mood('l03', 0.3, 1.5);
  const listen = Math.max(mood('m01', 0.2, 0.4), mood('m02', 0.2, 0.6));
  const l02 = line('l02'), hoho = t > l02.start - 0.05 && t < l02.start + 1.0;
  const laughing = chuckling || hoho;
  const soft = 1 - 0.3 * tender; // softer, half-lidded eyes when he is being kind
  const nod = -lionTalk * 4 - (tender * Math.max(0, Math.sin((t - line('l03').start) * 2.2)) * 4);
  const lst = {
    breath: Math.sin(t * 2 * Math.PI / 5.5) * (1 - awake * 0.5),
    eyes: laughing ? [0, 0] : [Math.min(eyeL, 1 - bl) * soft, Math.min(eyeR, 1 - bl) * soft],
    happy: laughing,
    mouth: lionTalk * 0.85 + (chuckling ? 0.25 + 0.2 * Math.sin(t * 11) : 0),
    smile: clamp(smile + curious * 0.25 + amused * 0.6 + tender * 0.8),
    browUp: Math.max(curious, amused * 0.8, listen * 0.35),
    browSad: Math.max(tender * 0.7, mood('m02', 0.2, 0.6) * 0.4),
    headTilt: (laughing ? Math.sin(t * 9) * 0.015 : 0) - 0.035 * awake + noise1(t * 0.4, 9) * 0.02 - curious * 0.05 + amused * 0.04 - tender * 0.03 - listen * 0.04,
    headDY: (laughing ? Math.abs(Math.sin(t * 9)) * -5 : 0) + nod,
    tail: Math.sin(t * 0.8) * 0.7,
    pawLift, pawReach,
    leg: false,
  };
  cam(g, c, 1);
  g.save(); g.translate(1650, 954); g.scale(2.3, 2.3);
  lionC.draw(g, lst);
  g.restore();

  // the mouse: frozen, then pleading, then joyful, then away home
  const leave = m03.end + 0.4;
  const jumpy = span(t, press, press + 0.18) - span(t, press + 0.25, press + 0.7);
  const lookBack = span(t, press + 0.1, press + 0.4) - span(t, press + 1.4, press + 2.0);
  const joy = t > n08.end - 0.4 && t < leave ? 1 : 0;
  let mx = 600, flip = 1, run = null, hop = jumpy * 26;
  if (joy) hop = Math.abs(Math.sin((t - n08.end) * 6)) * 26;
  if (t > leave) { flip = -1; run = t * 2.6; mx = 600 - (t - leave) * 260; }
  const mst = {
    t, run, hop, flip, tailForward: t < R + 2.0,
    talk: mouseTalk, look: run ? 0 : (-0.2 - mouseTalk * 0.05) * (1 - lookBack) + 0.32 * lookBack,
    blink: t > press - 0.3 && t < press + 1.5 ? 0 : blink(t, 3),
    happy: joy && !mouseTalk, joy: joy ? 0.6 + 0.4 * Math.sin(t * 8) : 0, flutter: run ? 1 : 0.3 + jumpy,
  };
  if (mx > -200) {
    g.save(); g.translate(mx, 918); g.scale(1.55 * flip, 1.55);
    mouseC.draw(g, mst);
    g.restore();
  }
  g.save(); g.translate(1650, 954); g.scale(2.3, 2.3);
  const leg = lionC.drawLeg(g, lst);
  // a soft little puff where the paw meets the tail
  const puff = span(t, press - 0.05, press + 0.1) * (1 - span(t, press + 0.2, press + 0.9));
  if (puff > 0.01) {
    g.save(); g.strokeStyle = rgba(INK, 0.55 * puff); g.lineWidth = 1.6; g.lineCap = 'round';
    const [px, py] = [leg.tip[0] + 6, leg.tip[1] + 22], grow = span(t, press, press + 0.6) * 10;
    for (const [a, l] of [[-2.6, 14], [-2.1, 12], [-1.6, 10], [-0.55, 10]]) {
      g.beginPath(); g.moveTo(px + Math.cos(a) * (12 + grow), py + Math.sin(a) * (12 + grow));
      g.lineTo(px + Math.cos(a) * (12 + grow + l), py + Math.sin(a) * (12 + grow + l)); g.stroke();
    }
    g.restore();
  }
  g.restore();

  fireflies(g, t, 10, { x0: 0, x1: W, y0: 100, y1: 800 }, 21, 0.6);
  drawLayer(g, c, S2.fg, 1.25);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.save(); g.globalCompositeOperation = 'soft-light';
  const lg = g.createLinearGradient(0, 0, W, H);
  lg.addColorStop(0, 'rgba(255,200,120,0.5)'); lg.addColorStop(1, 'rgba(120,70,40,0.25)');
  g.fillStyle = lg; g.fillRect(0, 0, W, H); g.restore();
}

// ================= title card =================
function paintTitle() {
  return layer((g) => {
    wash(g, fluffy(960, 470, 560, 260, 9, 0.12, 5), { color: '#e9c98f', opacity: 0.45, seed: 1, bleed: 0.12, edge: 0.2 });
    wash(g, fluffy(1010, 520, 380, 170, 8, 0.15, 6), { color: '#c9b98a', opacity: 0.25, seed: 2, bleed: 0.12, edge: 0 });
    for (let i = 0; i < 7; i++) fern(g, 420 + i * 30, 760, { seed: 10 + i, len: 140 - i * 6, angle: -2.0 + i * 0.22, curl: 0.5, color: i % 2 ? PAL.moss : PAL.olive });
    for (let i = 0; i < 6; i++) fern(g, 1530 - i * 28, 760, { seed: 20 + i, len: 130 - i * 6, angle: -1.1 - i * 0.2, curl: -0.5, color: i % 2 ? PAL.olive : PAL.moss });
    berries(g, 560, 735, { seed: 3, size: 7 }); berries(g, 1390, 740, { seed: 4, size: 6 });
    for (const [x, c, sd] of [[620, PAL.pink, 1], [680, '#f1e2c8', 2], [1320, '#e7a35a', 3], [1260, PAL.pink, 4]]) flower(g, x, 735, { seed: sd, size: 11, color: c, stem: 30 });
    mushroom(g, 1450, 770, { seed: 5, s: 1.4 }); mushroom(g, 1490, 772, { seed: 6, s: 0.9 });
    wash(g, smooth([[380, 770], [960, 750], [1560, 772], [1560, 800], [380, 800]]), { color: '#a9ae7f', opacity: 0.4, seed: 7, edge: 0 });
  });
}

function drawTitle(g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(PAPER, 0, 0);
  // a warm evening glow on the title page
  g.fillStyle = 'rgba(250,214,160,0.22)'; g.fillRect(0, 0, W, H);
  pool(g, 960, 470, 900, 520, '#fbd9a0', 0.35);
  const c = { z: 1 + t * 0.004, x: 0, y: 0 };
  drawLayer(g, c, TITLE, 1);
  cam(g, c, 1);
  g.save();
  g.textAlign = 'center';
  const a1 = span(t, 0.6, 2.4), a2 = span(t, 1.4, 3.2), a3 = span(t, 2.4, 4.0);
  g.fillStyle = INK;
  g.globalAlpha = a1 * 0.9; g.font = '150px "Fell"'; g.fillText('The Lion', 960, 420 + (1 - a1) * 10);
  g.globalAlpha = a2 * 0.9; g.font = 'italic 120px "Fell"'; g.fillText('& the Mouse', 960, 560 + (1 - a2) * 10);
  g.globalAlpha = a3 * 0.75; g.font = 'italic 40px "Fell"'; g.fillText('an Aesop’s fable, for sleepy little ones', 960, 650);
  g.restore();
  g.save(); g.translate(800, 768); g.scale(0.8, 0.8);
  mouseW.draw(g, { t, blink: blink(t, 5), look: -0.1, tailForward: false, flutter: 0.2 });
  g.restore();
  fireflies(g, t, 8, { x0: 300, x1: 1600, y0: 150, y1: 800 }, 31, 0.7);
}

// ================= painted edge: the picture stops just short of the paper's edge =================
function buildFrame() {
  const r = rng(2024), pts = [], inset = 30;
  const side = (x0, y0, x1, y1) => {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 28);
    for (let i = 0; i < n; i++) {
      const k = i / n, nx = -(y1 - y0), ny = x1 - x0, d = Math.hypot(nx, ny);
      const bite = r() < 0.03 ? r.range(6, 14) : 0;               // the odd dry-brush bite
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
  FRAME = m;
  const e = canvas(W, H, false), eg = e.getContext('2d');
  eg.filter = 'blur(1.6px)'; eg.strokeStyle = 'rgba(110,75,45,0.28)'; eg.lineWidth = 3.5; eg.lineJoin = 'round';
  eg.beginPath(); eg.moveTo(shape[0][0], shape[0][1]); for (const p of shape) eg.lineTo(p[0], p[1]); eg.closePath(); eg.stroke();
  eg.filter = 'none';
  // a few splatters flicked past the edge
  for (const [cx, cy, n] of [[60, 70, 14], [W - 80, H - 60, 18], [W - 120, 40, 8], [90, H - 50, 10]]) {
    for (let i = 0; i < n; i++) {
      eg.fillStyle = rgba(r.pick([PAL.moss, PAL.ochre, PAL.rust, PAL.olive]), r.range(0.25, 0.55));
      eg.beginPath(); eg.arc(cx + r.gauss(0, 45), cy + r.gauss(0, 30), Math.pow(r(), 2) * 5 + 0.8, 0, 7); eg.fill();
    }
  }
  FRAME_EDGE = e;
}

// ================= transitions & finish =================
function buildMaskNoise() {
  const w = 240, h = 135, c = canvas(w, h, false), g = c.getContext('2d');
  g.drawImage(noiseTexture(), 0, 0, 512, 512, 0, 0, w * 1.1, h * 1.1);
  const d = g.getImageData(0, 0, w, h).data, out = new Float32Array(w * h);
  let lo = 1, hi = 0;
  for (let i = 0; i < w * h; i++) { out[i] = d[i * 4] / 255; lo = Math.min(lo, out[i]); hi = Math.max(hi, out[i]); }
  for (let i = 0; i < w * h; i++) {
    const x = (i % w) / w, y = Math.floor(i / w) / h;
    // blend in a soft radial bias so colour blooms outward from the centre like a wet wash
    out[i] = 0.55 * (out[i] - lo) / (hi - lo) + 0.45 * Math.hypot(x - 0.5, (y - 0.5) * 0.6) * 1.6;
  }
  mask = canvas(w, h, false);
  return out;
}
function dissolve(g, drawA, drawB, t, p) {
  const ga = bufA.getContext('2d'), gb = bufB.getContext('2d');
  drawA(ga, t); drawB(gb, t);
  const w = mask.width, h = mask.height, mg = mask.getContext('2d');
  const img = mg.createImageData(w, h);
  const th = p * 1.5 - 0.3;
  for (let i = 0; i < w * h; i++) img.data[i * 4 + 3] = 255 * clamp((th - maskNoise[i]) / 0.3);
  mg.putImageData(img, 0, 0);
  gb.save(); gb.setTransform(1, 0, 0, 1, 0, 0); gb.globalCompositeOperation = 'destination-in';
  gb.imageSmoothingQuality = 'high'; gb.filter = 'blur(14px)'; gb.drawImage(mask, -20, -20, W + 40, H + 40); gb.restore();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(bufA, 0, 0); g.drawImage(bufB, 0, 0);
}

function finish(g, t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.filter = 'contrast(1.14) saturate(1.12)'; g.drawImage(g.canvas, 0, 0); g.filter = 'none';
  g.drawImage(VIGNETTE, 0, 0);
  g.save();
  g.globalCompositeOperation = 'destination-in'; g.drawImage(FRAME, 0, 0);   // trim to the painted edge
  g.globalCompositeOperation = 'destination-over'; g.drawImage(PAPER, 0, 0); // bare paper around it
  g.globalCompositeOperation = 'source-over'; g.drawImage(FRAME_EDGE, 0, 0);
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.35; g.drawImage(GRAIN, 0, 0);
  g.restore();
  const fadeIn = 1 - span(t, 0, 1.2), fadeOut = span(t, TL.duration - 7, TL.duration - 0.5);
  if (fadeIn > 0) { g.fillStyle = `rgba(242,231,211,${fadeIn})`; g.fillRect(0, 0, W, H); }
  if (fadeOut > 0) { g.fillStyle = `rgba(20,24,44,${fadeOut})`; g.fillRect(0, 0, W, H); }
}

// ================= entry points =================
window.FABLE = {
  async setup(timeline) {
    TL = timeline; L = Object.fromEntries(timeline.lines.map((l) => [l.id, l]));
    for (const [name, style] of [['im-fell-english-latin-400-normal', 'normal'], ['im-fell-english-latin-400-italic', 'italic']]) {
      const f = new FontFace('Fell', `url(../../engine/fonts/${name}.woff2)`, { style });
      document.fonts.add(await f.load());
    }
    ctx = document.getElementById('c').getContext('2d');
    PAPER = paper(W, H, '#f3e8d5', 7);
    GRAIN = paper(W, H, '#ffffff', 8);
    VIGNETTE = canvas(W, H);
    { const g = VIGNETTE.getContext('2d'), v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.0);
      v.addColorStop(0, 'rgba(60,35,20,0)'); v.addColorStop(1, 'rgba(70,40,20,0.22)'); g.fillStyle = v; g.fillRect(0, 0, W, H); }
    bufA = canvas(W, H, false); bufB = canvas(W, H, false);
    buildFrame();
    maskNoise = buildMaskNoise();
    lionW = makeLion(1.0, 1); lionC = makeLion(2.6, 1);
    mouseW = makeMouse(0.9, 2); mouseC = makeMouse(1.9, 2);
    LEAVES = [PAL.ochre, PAL.rust, PAL.olive, '#d7954a'].map((col, i) => sprite({ x0: -14, y0: -14, x1: 14, y1: 14, w: 28, h: 28 }, 1, (g) => leaf(g, 0, 0, 12, 0, col), { granulate: false }));
    TITLE = paintTitle();
    S1 = paintScene1();
    S2 = paintScene2();
    lionWalk = makeLionWalk(1.6, 1);
    NIGHT_SKY = layer((g) => {
      const grd = g.createLinearGradient(0, -MY, 0, 760);
      grd.addColorStop(0, '#5d6aa8'); grd.addColorStop(0.7, '#8c8fbf'); grd.addColorStop(1, '#b7a9c6');
      g.fillStyle = grd; g.fillRect(-M, -MY, LW, LH);
      wash(g, fluffy(900, 300, 520, 90, 9, 0.3, 3), { color: '#a6a3d0', opacity: 0.25, seed: 5, bleed: 0.12, edge: 0 });
    });
    { const r = rng(4242); STARS = []; for (let i = 0; i < 46; i++) STARS.push([r(), r(), r.range(0.6, 1.4), r()]); }
    S4 = paintForest();
    S5 = paintHome();
    S5R = paintRun();
    S6BG = paintFriendsBg();
    // the order of the story, and when each picture dissolves into the next
    SCENES = [
      [0, drawTitle], [7.6 - 2.2, drawScene1], [line('n06').start - 0.7, drawScene2],
      [line('n09').start - 0.9, drawScene3], [line('n11').start - 1.2, drawScene4],
      [line('n15').start - 0.9, drawHome], [line('n16').start - 0.5, drawRun],
      [line('m05').start - 1.5, drawRescue], [line('l05').start - 1.3, drawFriends],
      [line('n20').start - 1.3, drawGoodnight],
    ];
  },
  frame(t) {
    const g = ctx;
    let i = 0;
    while (i + 1 < SCENES.length && t >= SCENES[i + 1][0]) i++;
    const [start, draw] = SCENES[i], D = i === 1 ? 2.2 : 1.8;
    if (i > 0 && t < start + D) dissolve(g, SCENES[i - 1][1], draw, t, (t - start) / D);
    else draw(g, t);
    finish(g, t);
  },
};
let SCENES;

// =====================================================================================
// THE REST OF THE STORY
// =====================================================================================
let S4, S5, S5R, S6BG, lionWalk;

// ---------- the forest at dusk, where the net waits ----------
function paintForest() {
  const DUSK = '#c9a7b4';
  const sky = layer((g) => {
    const grd = g.createLinearGradient(0, -MY, 0, 800);
    grd.addColorStop(0, '#a99bc4'); grd.addColorStop(0.55, '#e3b8ad'); grd.addColorStop(1, '#f2d2ae');
    g.fillStyle = grd; g.fillRect(-M, -MY, LW, LH);
    pool(g, 1250, 620, 600, 300, '#fbd9a4', 0.45);
  });
  const far = layer((g) => {
    const r = rng(404);
    for (let i = 0; i < 13; i++) { // misty trunks far away, fading into the dusk
      const x = -60 + i * 160 + r.range(-50, 50), w = r.range(16, 36);
      trunk(g, [[x, 820], [x + r.gauss(0, 6), 300], [x + r.gauss(0, 8), -60]], w, w * 0.7, { seed: 600 + i, haze: r.range(0.68, 0.8), hazeColor: DUSK });
    }
    for (let i = 0; i < 12; i++) foliage(g, i * 180 - 40, r.range(-20, 80), 170, 110, { seed: 650 + i, haze: 0.6, hazeColor: DUSK, blobs: 6, opacity: 0.7, leafDensity: 160 });
    hills(g, 760, 30, '#b5a6a6', { seed: 66, opacity: 0.5 });
  });
  const mid = layer((g) => {
    const hz = { haze: 0.3, hazeColor: DUSK };
    for (const [x, w, sd] of [[80, 70, 1], [420, 46, 2], [1640, 56, 3]]) {
      trunk(g, [[x, 880], [x + 8, 400], [x - 6, -60]], w, w * 0.75, { seed: 700 + sd, ...hz });
      foliage(g, x + 30, 40 + sd * 20, 190, 120, { seed: 720 + sd, ...hz, blobs: 7, opacity: 0.85 });
    }
    for (let i = 0; i < 8; i++) foliage(g, -60 + i * 290, 840, 150, 60, { seed: 740 + i, haze: 0.2, hazeColor: DUSK, blobs: 6, opacity: 0.8 });
  });
  const ground = layer((g) => {
    wash(g, smooth([[-M - 50, 840], [600, 820], [1300, 850], [W + M + 50, 830], [W + M + 50, LH], [-M - 50, LH]]), { color: '#a9a172', opacity: 0.9, seed: 801, bleed: 0.02, layers: 24 });
    wash(g, smooth([[-M - 50, 960], [700, 940], [1500, 970], [W + M + 50, 950], [W + M + 50, LH], [-M - 50, LH]]), { color: '#7f8a5e', opacity: 0.55, seed: 802, bleed: 0.03, layers: 20 });
    // a soft path through the trees
    wash(g, smooth([[300, 900], [800, 880], [1400, 890], [W + 60, 905], [W + 60, 960], [1300, 950], [700, 960], [200, 950]]), { color: '#d8c39a', opacity: 0.55, seed: 803, edge: 0.1 });
    strokes(g, [[-M, 840], [W + M, 840], [W + M, LH], [-M, LH]], { color: '#5f6b3a', count: 1300, len: 9, width: 1.1, alpha: 0.28, seed: 804, dir: () => -Math.PI / 2, curve: 0.4 });
    const r = rng(805);
    for (let i = 0; i < 160; i++) { const x = r.range(-80, W + 80), y = r.range(850, 1120); if (y < 975 && x > 700 && x < 1450) continue; grass(g, x, y, { seed: 810 + i, h: 18 + (y - 840) * 0.1, n: 6, alpha: 0.55 }); }
    for (let i = 0; i < 40; i++) { const x = r.range(-60, W + 60), y = r.range(860, 1100); if (y < 975 && x > 700 && x < 1450) continue; if (r() < 0.6) flower(g, x, y, { seed: 900 + i, size: 4 + (y - 840) * 0.012, color: r.pick([PAL.pink, '#f1e2c8', '#cdb3d6']), stem: 10 }); }
    for (const [x, y, s] of [[260, 905, 1.1], [300, 912, 0.7], [1620, 905, 0.9], [1580, 912, 0.6]]) mushroom(g, x, y, { seed: x, s });
    for (let i = 0; i < 5; i++) fern(g, 120 + i * 30, 900, { seed: 950 + i, len: 130, angle: -1.9 + i * 0.25, curl: 0.6, color: PAL.moss });
  });
  // the tree whose branch hides the net
  const tree = layer((g) => {
    trunk(g, [[1560, 900], [1540, 600], [1555, 300], [1540, -60]], 150, 110, { seed: 830, under: true });
    for (const [pts, w, sd] of [[[[1490, 895], [1440, 910], [1400, 915]], 36, 1], [[[1630, 895], [1680, 910], [1720, 915]], 36, 2]]) trunk(g, pts, w, 6, { seed: 840 + sd, under: true });
    trunk(g, [[1520, 200], [1300, 165], [1080, 150], [860, 160], [700, 140]], 54, 14, { seed: 835, under: true });
  });
  const canopy = [[760, 150, 170, 105], [1010, 110, 210, 120], [1250, 60, 230, 115], [1520, 30, 260, 130], [1820, 120, 220, 150], [480, 20, 220, 110], [180, 70, 220, 140], [880, 240, 90, 60], [1380, 215, 100, 60]].map(([x, y, rx, ry], i) =>
    ({ x, y, s: sprite({ x0: x - rx, y0: y - ry, x1: x + rx, y1: y + ry, w: 2 * rx, h: 2 * ry }, 1, (g) => {
      foliage(g, x, y, rx, ry, { seed: 860 + i * 11, colors: [PAL.moss, '#6f8a6e', PAL.olive, '#8a9a6a', PAL.ochre], blobs: 10, opacity: 0.9 });
      for (let k = 0; k < 3; k++) { // a few trailing strands of leaves
        const sx = x + (k - 1) * rx * 0.5, len = ry * (0.6 + k * 0.25);
        for (let j = 0; j < 6; j++) leaf(g, sx + Math.sin(j) * 6, y + ry * 0.6 + j * len / 6, 9, 0.5 * (j % 2 ? 1 : -1), j % 2 ? PAL.olive : PAL.moss);
      }
    }) }));
  const fg = [];
  const r = rng(870);
  for (const [i, [x, h, big]] of [[-20, 230, 1], [300, 130, 0], [1480, 120, 0], [1900, 240, 1]].entries()) {
    const y = H + 40;
    fg.push({ x, y, ph: r() * 6, s: sprite({ x0: x - h * 1.3, y0: y - h * 1.35, x1: x + h * 1.3, y1: y + 10, w: h * 2.6, h: h * 1.35 + 10 }, 1, (g) => {
      grass(g, x, y, { seed: 880 + i, h: h * 0.7, n: 18, width: 4.5, alpha: 0.8, colors: [PAL.moss, PAL.deep, PAL.olive] });
      if (big) fern(g, x - h * 0.3, y, { seed: 890 + i, len: h * 1.15, angle: -1.25, curl: 0.55, color: PAL.deep, alpha: 0.85, leaf: 1.6 });
      plant(g, x, y, { seed: 895 + i, h, n: big ? 7 : 5, under: true, colors: [PAL.moss, '#6f8a6e', PAL.olive, '#5c7048'] });
    }) });
  }
  return { sky, far, mid, ground, tree, canopy, fg };
}

function drawForest(g, t, c, night, actors, after) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(PAPER, 0, 0);
  drawLayer(g, c, S4.sky, 0.15);
  drawLayer(g, c, S4.far, 0.35);
  drawLayer(g, c, S4.mid, 0.65);
  drawLayer(g, c, S4.ground, 1);
  drawLayer(g, c, S4.tree, 1);
  cam(g, c, 1);
  actors(g);
  for (const [i, cn] of S4.canopy.entries()) {
    cam(g, c, 1.03); g.translate(cn.x, cn.y - 60); g.rotate(Math.sin(t * 0.5 + i) * 0.012); g.translate(-cn.x, -(cn.y - 60)); drawSprite(g, cn.s);
  }
  cam(g, c, 1);
  fireflies(g, t, 18, { x0: 0, x1: W, y0: 300, y1: 950 }, 51, 0.7 * (1 - night));
  for (const tuft of S4.fg) {
    cam(g, c, 1.2); g.translate(tuft.x, tuft.y); g.rotate(Math.sin(t * 0.6 + tuft.ph) * 0.02); g.translate(-tuft.x, -tuft.y); drawSprite(g, tuft.s);
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.save(); g.globalCompositeOperation = 'soft-light'; g.globalAlpha = 1 - night;
  const lg = g.createLinearGradient(W, 0, 0, H);
  lg.addColorStop(0, 'rgba(255,190,140,0.5)'); lg.addColorStop(1, 'rgba(90,60,90,0.3)');
  g.fillStyle = lg; g.fillRect(0, 0, W, H); g.restore();
  nightGrade(g, night);
  if (night > 0) { cam(g, c, 1); fireflies(g, t, 24, { x0: 0, x1: W, y0: 300, y1: 1000 }, 61, night); }
  if (after) { cam(g, c, 1); after(g); }
}

// soft roar waves: gentle curved lines spreading out
function roarWaves(g, t, x, y, t0, t1, dir = -1, scale = 1) {
  if (t < t0 || t > t1 + 2) return;
  g.save(); g.strokeStyle = INK; g.lineCap = 'round';
  for (let k = 0; k < 6; k++) {
    const ph = (t - t0) / 1.6 - k * 0.33;
    if (ph < 0 || ph > 1 || t0 + (k * 0.33 + 0) * 1.6 > t1) continue;
    const rr = (30 + ph * 260) * scale;
    g.globalAlpha = 0.5 * Math.sin(ph * Math.PI); g.lineWidth = 3.2 * (1 - ph * 0.5);
    g.beginPath(); g.arc(x, y, rr, dir < 0 ? Math.PI * 0.82 : -Math.PI * 0.18, dir < 0 ? Math.PI * 1.18 : Math.PI * 0.18); g.stroke();
    g.beginPath(); g.arc(x, y, rr, dir < 0 ? Math.PI * 1.25 : -Math.PI * 0.4, dir < 0 ? Math.PI * 1.4 : -Math.PI * 0.25); g.stroke();
  }
  g.restore();
}

// ================= SCENE 4: a walk in the forest, and the net =================
const LION4 = [1050, 905], LS4 = 0.62;
function drawScene4(g, t) {
  const n11 = line('n11'), n12 = line('n12'), n13 = line('n13'), l04 = line('l04'), n14 = line('n14');
  // camera: wide, then a slow look up at the hidden net, then back down to the lion
  const up = span(t, n12.start + 0.6, n12.start + 3.0) * (1 - span(t, n12.end - 0.3, n13.start + 0.6));
  const drift = clamp((t - n11.start) / 40);
  const c = { z: 1.0 + 0.2 * up + 0.05 * drift, x: lerp(0, 20, up) + drift * 20, y: lerp(0, -120, up) + drift * 10 };
  const dropT0 = n13.start + 0.35, drop = clamp((t - dropT0) / 0.7) ** 2;
  const landed = t > dropT0 + 0.7;
  const struggle = landed ? span(t, dropT0 + 0.8, dropT0 + 1.4) * (1 - span(t, n13.end - 0.5, n13.end + 0.6)) : 0;
  const roarK = span(t, n14.start + 2.6, n14.start + 3.2) * (1 - span(t, n14.end + 0.2, n14.end + 1.0));
  const lookUp = span(t, n14.start + 0.8, n14.start + 2.4) * (1 - span(t, n14.end + 0.4, n14.end + 1.6));
  const sad = Math.max(span(t, l04.start - 0.6, l04.start + 0.2) * (1 - span(t, n14.start + 0.6, n14.start + 1.4)), struggle * 0.5);
  // walking in from the right
  const arrive = n12.start + 1.2, tIn = n11.start - 1.2;
  const wk = clamp((t - tIn) / (arrive - tIn));
  const lx = lerp(2200, LION4[0], 1 - (1 - wk) * (1 - wk));
  const walking = wk < 1;
  const jitter = struggle * (Math.sin(t * 7) * 6 + Math.sin(t * 11.3) * 3);
  drawForest(g, t, c, 0.2 * clamp((t - n11.start) / 30), (g) => {
    if (drop <= 0) drawNetBundle(g, 980, 300, 1, t);
    g.save(); g.translate(lx + jitter, LION4[1]); g.scale(LS4, LS4);
    const curious = span(t, n12.start, n12.start + 1) * (1 - span(t, n13.start, n13.start + 0.5));
    lionWalk.draw(g, {
      t, walk: walking ? t * 0.85 : (struggle > 0.05 ? Math.sin(t * 3) * 0.08 : null),
      breath: Math.sin(t * 2 * Math.PI / 4.5),
      eyes: roarK > 0.3 ? [0, 0] : [1 - blink(t, 9) - sad * 0.25, 1 - blink(t, 9) - sad * 0.25],
      browUp: Math.max(curious * 0.6, landed && t < dropT0 + 1.6 ? 1 : 0),
      browSad: sad,
      smile: walking ? 0.5 : 0.2 * (1 - sad),
      mouth: Math.max(talking('l04', t) * 0.8, roarK * (0.85 + 0.1 * Math.sin(t * 6))),
      headTilt: (struggle ? Math.sin(t * 5) * 0.05 : 0) + curious * Math.sin(t * 1.5) * 0.04 + lookUp * 0.12,
      headDY: sad * 10 - lookUp * 18,
    });
    g.restore();
    if (drop > 0) drawNet(g, lx - 30 + jitter * 0.6, LION4[1] + 4, 560, 380, { t, wiggle: struggle, drop, seed: 9 });
    const head = [lx - 150 * LS4, LION4[1] - 280 * LS4 - lookUp * 18 * LS4];
    roarWaves(g, t, head[0] - 40, head[1], n14.start + 2.7, n14.end + 0.2, -1, 1.2);
  });
}

// ================= SCENE 5a: the mouse's cosy home in the roots =================
function paintHome() {
  const bg = layer((g) => {
    const grd = g.createLinearGradient(0, -MY, 0, 900);
    grd.addColorStop(0, '#7d86b8'); grd.addColorStop(1, '#c7b8c8');
    g.fillStyle = grd; g.fillRect(-M, -MY, LW, LH);
    const r = rng(1001);
    for (let i = 0; i < 18; i++) { const x = r.range(900, W + 80), w = r.range(20, 50); trunk(g, [[x, 860], [x, 300], [x, -60]], w, w * 0.8, { seed: 1010 + i, haze: 0.55, hazeColor: '#b9b0c8' }); }
    for (let i = 0; i < 7; i++) foliage(g, 950 + i * 170, r.range(40, 140), 160, 100, { seed: 1030 + i, haze: 0.55, hazeColor: '#b9b0c8', blobs: 6, leaves: false, detail: false });
    wash(g, smooth([[-M - 50, 880], [800, 860], [W + M + 50, 875], [W + M + 50, LH], [-M - 50, LH]]), { color: '#9a9a70', opacity: 0.9, seed: 1040, bleed: 0.02 });
    strokes(g, [[-M, 870], [W + M, 870], [W + M, LH], [-M, LH]], { color: '#5f6b3a', count: 900, len: 9, width: 1.1, alpha: 0.3, seed: 1041, dir: () => -Math.PI / 2, curve: 0.4 });
    for (let i = 0; i < 60; i++) grass(g, r.range(-60, W + 60), r.range(880, 1110), { seed: 1050 + i, h: 30, n: 7, alpha: 0.6 });
  });
  // the great old tree base with a little round-topped door
  const home = layer((g) => {
    const base = smooth([[-M - 40, -MY - 20], [520, -MY - 20], [600, 300], [640, 600], [760, 820], [900, 905], [700, 915], [400, 908], [-M - 40, 912]]);
    wash(g, base, { color: PAL.bark, opacity: 0.94, seed: 1100, under: true, bleed: 0.015 });
    shadeEdge(g, base, { color: PAL.barkDark, alpha: 0.5, width: 80, dx: 30 });
    strokes(g, base, { color: PAL.barkDark, count: 700, len: 30, width: 1.5, alpha: 0.35, seed: 1101, dir: () => -Math.PI / 2 + 0.1, curve: 0.15 });
    pencil(g, base.slice(5, 60), { seed: 1102, alpha: 0.5 });
    // roots
    for (const [pts, w, sd] of [[[[700, 880], [820, 905], [960, 915]], 46, 1], [[[300, 900], [180, 915], [60, 920]], 40, 2]]) trunk(g, pts, w, 8, { seed: 1110 + sd, under: true });
    // moss
    for (let i = 0; i < 6; i++) foliage(g, 520 + i * 60, 890 - (i % 2) * 10, 60, 22, { seed: 1120 + i, colors: [PAL.moss, PAL.olive, PAL.sage], blobs: 4, leaves: false, opacity: 0.8 });
    // the door: an arched opening glowing warm inside
    const arch = smooth([[330, 900], [320, 760], [360, 680], [430, 655], [500, 680], [540, 760], [530, 900]]);
    wash(g, arch, { color: '#f1b768', opacity: 0.95, seed: 1130, under: true });
    glaze(g, arch, 430, 820, 120, 110, '#fff0c2', 0.8);
    // little shelves and a tiny bed inside
    wash(g, [[350, 780], [510, 780], [510, 790], [350, 790]], { color: '#8a5a38', opacity: 0.8, seed: 1131 });
    for (const [x, c] of [[370, '#b4503a'], [392, '#6f8a6e'], [410, '#c9a24f'], [470, '#d99a8e']]) wash(g, [[x, 780], [x + 14, 780], [x + 14, 755], [x, 755]], { color: c, opacity: 0.85, seed: x, layers: 10 });
    wash(g, smooth([[360, 900], [370, 860], [480, 858], [500, 900]]), { color: '#d99a8e', opacity: 0.85, seed: 1132 });
    const door = smooth([[530, 900], [540, 770], [600, 715], [640, 740], [645, 900]]); // swung open
    wash(g, door, { color: '#9a6a44', opacity: 0.95, seed: 1133, under: true });
    for (const x of [565, 590, 615]) ink(g, [[x, 905], [x + 4, 760]], { alpha: 0.35, seed: x });
    g.fillStyle = '#e8c070'; g.beginPath(); g.arc(560, 830, 5, 0, 7); g.fill();
    pencil(g, arch, { closed: true, seed: 1134, width: 2, alpha: 0.6 });
    pencil(g, door, { closed: true, seed: 1135, alpha: 0.55 });
    // round window
    const win = ellipse(230, 560, 46, 46, 30);
    wash(g, win, { color: '#f4c27a', opacity: 0.95, seed: 1136, under: true });
    ink(g, [[184, 560], [276, 560]], { alpha: 0.6, width: 3 }); ink(g, [[230, 514], [230, 606]], { alpha: 0.6, width: 3 });
    pencil(g, win, { closed: true, seed: 1137, width: 2.5, alpha: 0.7 });
    // doorstep, mushrooms, flowers
    wash(g, smooth([[300, 910], [580, 902], [600, 925], [290, 930]]), { color: '#bfa98a', opacity: 0.9, seed: 1138, under: true });
    for (const [x, sc] of [[700, 1.3], [745, 0.9], [130, 1.1], [170, 0.7]]) mushroom(g, x, 910, { seed: x, s: sc });
    for (let i = 0; i < 6; i++) flower(g, 620 + i * 32, 890 - (i % 2) * 8, { seed: 1140 + i, size: 7, color: i % 2 ? PAL.pink : '#f1e2c8', stem: 20 });
    // a little lantern on a twig post
    ink(g, [[760, 905], [758, 700]], { width: 5, alpha: 0.8, color: '#5a3d2b', taper: false });
    ink(g, [[758, 702], [742, 690]], { width: 3, alpha: 0.8, color: '#5a3d2b', taper: false });
    const lamp = smooth([[748, 690], [772, 690], [778, 720], [742, 720]]);
    wash(g, lamp, { color: '#ffd27a', opacity: 0.95, seed: 1150, under: true, layers: 10 });
    pencil(g, lamp, { closed: true, seed: 1151, width: 2, alpha: 0.7 });
    // ivy and moss climbing the old tree
    const r = rng(1160);
    for (let v = 0; v < 4; v++) {
      let x = 90 + v * 150, y = 120 + v * 60;
      for (let j = 0; j < 16; j++) { x += r.gauss(0, 8); y += 26; leaf(g, x + (j % 2 ? 10 : -10), y, 11, j % 2 ? 0.6 : -0.6, j % 3 ? PAL.moss : PAL.olive); }
    }
    for (let i = 0; i < 5; i++) foliage(g, 80 + i * 110, 300 + (i % 2) * 260, 50, 30, { seed: 1170 + i, colors: [PAL.moss, PAL.olive], blobs: 4, opacity: 0.75 });
  });
  // plants and ferns along the open side
  const plants = layer((g) => {
    plant(g, 1250, 930, { seed: 1180, h: 140, n: 6, under: true }); plant(g, 1560, 940, { seed: 1181, h: 180, n: 7, under: true });
    plant(g, 1880, 950, { seed: 1182, h: 230, n: 7, under: true });
    for (let i = 0; i < 6; i++) fern(g, 1380 + i * 28, 935, { seed: 1190 + i, len: 140, angle: -2.0 + i * 0.25, curl: 0.55, color: PAL.moss });
    for (const [x, sc] of [[1450, 1.0], [1490, 0.7], [1700, 0.8]]) mushroom(g, x, 935, { seed: x, s: sc });
    berries(g, 1320, 870, { seed: 1195, size: 7 }); berries(g, 1660, 860, { seed: 1196, size: 7 });
  });
  return { bg, home, plants };
}

function drawHome(g, t) {
  const n15 = line('n15'), m04 = line('m04');
  const k = clamp((t - n15.start + 1) / (m04.end - n15.start + 2));
  const c = { z: 1.0 + 0.06 * ease(k), x: 30 * ease(k), y: 10 * ease(k) };
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(PAPER, 0, 0);
  drawLayer(g, c, S5.bg, 0.5);
  drawLayer(g, c, S5.home, 1);
  drawLayer(g, c, S5.plants, 1);
  // the mouse on her doorstep: dozing, then she hears the roar far away
  const hear = n15.start + 3.6, leave = m04.end + 0.2;
  const startle = span(t, hear, hear + 0.25) - span(t, hear + 0.3, hear + 0.8);
  const run = t > leave;
  const mx = run ? 860 + (t - leave) * 520 : 860;
  cam(g, c, 1);
  g.save(); g.translate(mx, 905); g.scale(1.25, 1.25);
  mouseC.draw(g, {
    t, run: run ? t * 2.8 : null, hop: startle * 30, flutter: run ? 1 : 0.3,
    happy: t < hear - 0.2, look: run ? 0 : (t < hear ? 0.05 : -0.1), talk: talking('m04', t),
    blink: t > hear && t < hear + 2 ? 0 : blink(t, 4), joy: t > m04.start && !run ? 0.5 + 0.3 * Math.sin(t * 7) : 0,
  });
  g.restore();
  g.setTransform(1, 0, 0, 1, 0, 0);
  nightGrade(g, 0.6);
  cam(g, c, 1);
  pool(g, 760, 690, 90, 90, '#ffd88a', 0.35 + 0.05 * Math.sin(t * 3), 'lighter'); // lantern
  // warm light spilling from the door and window, glowing through the night
  g.save(); g.globalCompositeOperation = 'lighter';
  pool(g, 430, 800, 260, 200, '#ffcf80', 0.28); pool(g, 230, 560, 120, 120, '#ffcf80', 0.3);
  pool(g, 700, 920, 300, 60, '#ffcf80', 0.12);
  g.restore();
  cam(g, c, 0.5); stars(g, t, 1, -99, { x0: 1000, x1: 1850, y0: 40, y1: 330 }); moon(g, 1650, 160, 34, 1, 0, '#2c3366');
  cam(g, c, 1);
  fireflies(g, t, 16, { x0: 600, x1: W, y0: 400, y1: 950 }, 71, 1);
  roarWaves(g, t, 2050, 640, hear - 0.2, hear + 2.2, -1, 1.6);
}

// ================= SCENE 5b: running through the moonlit forest =================
const RUN_W = 5600, RUN_GROUND = 880;
const ROOTS = [1000, 2050, 3100, 4200];
function rootHump(x) { let h = 0; for (const r of ROOTS) h = Math.max(h, 64 * Math.max(0, 1 - ((x - r) / 120) ** 2)); return h; }
function paintRun() {
  const strip = (w, h, fn) => { const c = canvas(w, h), g = c.getContext('2d'); fn(g); return c; };
  const far = strip(3200, H, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 900); grd.addColorStop(0, '#7d86b8'); grd.addColorStop(1, '#c4b6c6');
    g.fillStyle = grd; g.fillRect(0, 0, 3200, H);
    const r = rng(1201);
    for (let i = 0; i < 40; i++) { const x = r.range(0, 3200), w = r.range(18, 46); trunk(g, [[x, 880], [x, 300], [x, -60]], w, w * 0.8, { seed: 1210 + i, haze: 0.55, hazeColor: '#b9b0c8' }); }
    for (let i = 0; i < 18; i++) foliage(g, i * 190, r.range(30, 150), 170, 100, { seed: 1260 + i, haze: 0.5, hazeColor: '#b9b0c8', blobs: 6, leaves: false, detail: false });
  });
  const ground = strip(RUN_W, H, (g) => {
    wash(g, smooth([[-50, RUN_GROUND - 10], [RUN_W / 2, RUN_GROUND - 20], [RUN_W + 50, RUN_GROUND - 10], [RUN_W + 50, H + 50], [-50, H + 50]]), { color: '#9a9a70', opacity: 0.92, seed: 1300, bleed: 0.01 });
    strokes(g, [[0, RUN_GROUND], [RUN_W, RUN_GROUND], [RUN_W, H], [0, H]], { color: '#5f6b3a', count: 2600, len: 9, width: 1.1, alpha: 0.3, seed: 1301, dir: () => -Math.PI / 2, curve: 0.4 });
    const r = rng(1302);
    for (let i = 0; i < 260; i++) grass(g, r.range(0, RUN_W), r.range(RUN_GROUND - 5, H), { seed: 1310 + i, h: r.range(25, 60), n: 8, alpha: 0.7 });
    for (const x of ROOTS) { // big roots she hops over
      const pts = []; for (let k = -140; k <= 140; k += 20) pts.push([x + k, RUN_GROUND - rootHump(x + k) + 14]);
      trunk(g, pts, 46, 46, { seed: 1350 + x, under: true });
    }
    for (let i = 0; i < 26; i++) { const x = r.range(0, RUN_W); if (r() < 0.5) mushroom(g, x, RUN_GROUND + r.range(10, 60), { seed: 1400 + i, s: r.range(0.6, 1.2) }); else flower(g, x, RUN_GROUND + r.range(0, 80), { seed: 1450 + i, size: 7, color: r.pick([PAL.pink, '#f1e2c8', '#cdb3d6']), stem: 18 }); }
    for (let i = 0; i < 14; i++) fern(g, 200 + i * 400 + r.range(-80, 80), RUN_GROUND + 20, { seed: 1500 + i, len: 150, angle: -1.6 + r.gauss(0, 0.4), curl: 0.5, color: PAL.moss });
  });
  const top = ((w, h, fn) => { const c = canvas(w, h, false); fn(c.getContext('2d')); return c; })(RUN_W * 1.3, H, (g) => { // ferns hanging from above, very close
    const r = rng(1600);
    for (let i = 0; i < 9; i++) {
      const x = 500 + i * 820 + r.range(-100, 100);
      for (let k = 0; k < 5; k++) fern(g, x + k * 26, -20, { seed: 1610 + i * 5 + k, len: 340 + k * 20, angle: 1.2 + k * 0.12, curl: -0.5, color: PAL.deep, alpha: 0.9, leaf: 2.2 });
    }
  });
  const topBlur = canvas(top.width, H, false); { const g = topBlur.getContext('2d'); g.filter = 'blur(4px)'; g.drawImage(top, 0, 0); }
  return { far, ground, top: topBlur };
}

function drawRun(g, t) {
  const n16 = line('n16'), t0 = n16.start - 0.6;
  const sx = Math.max(0, (t - t0)) * 330;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(PAPER, 0, 0);
  g.drawImage(S5R.far, -sx * 0.25 - 100, 0);
  g.drawImage(S5R.ground, -sx, 0);
  const mx = 820, gx = sx + mx, hump = rootHump(gx);
  const slope = rootHump(gx + 20) - rootHump(gx - 20);
  g.save(); g.translate(mx, RUN_GROUND + 4 - hump); g.rotate(-slope * 0.008); g.scale(1.1, 1.1);
  mouseC.draw(g, { t, run: t * 2.9, flutter: 1, look: -slope * 0.004, blink: blink(t, 6) });
  g.restore();
  g.drawImage(S5R.top, -sx * 1.3, 0);
  nightGrade(g, 0.8);
  stars(g, t, 0.8, -99, { x0: 100, x1: 1800, y0: 30, y1: 300 });
  moon(g, 1500 - sx * 0.05, 150, 30, 1, 0, '#2c3366');
  fireflies(g, t, 20, { x0: 0, x1: W, y0: 300, y1: 950 }, 81, 1);
}

// ================= SCENE 5c: nibble, nibble, nibble =================
const LION5 = [1050, 908], LS5 = 0.62;
function netCut(t) {
  const n17 = line('n17'), n18 = line('n18');
  // a little during the nibbling, then "one rope... another... and another... until at last"
  return 0.22 * span(t, n17.start + 2.5, n17.end) + 0.12 * span(t, n18.start + 0.6, n18.start + 0.9)
    + 0.12 * span(t, n18.start + 1.8, n18.start + 2.1) + 0.12 * span(t, n18.start + 2.9, n18.start + 3.2)
    + 0.42 * span(t, n18.start + 4.0, n18.start + 5.8);
}
function drawRescue(g, t) {
  const m05 = line('m05'), n17 = line('n17'), n18 = line('n18');
  const k = clamp((t - m05.start + 1.5) / (n18.end - m05.start + 3));
  const c = { z: 1.95 + 0.08 * ease(k), x: -40 + 10 * ease(k), y: 255 };
  const free = n18.start + 6.0, freeK = span(t, free, free + 1.4);
  drawForest(g, t, c, 0.75, (g) => {
    const watching = span(t, m05.start - 0.5, m05.start + 0.5);
    const joy = span(t, free + 0.3, free + 1.2);
    g.save(); g.translate(LION5[0], LION5[1]); g.scale(LS5, LS5);
    lionC.draw(g, {
      breath: Math.sin(t * 2 * Math.PI / 5),
      eyes: joy > 0.5 ? [1, 1] : [1 - blink(t, 13) - 0.2 * (1 - watching), 1 - blink(t, 13) - 0.2 * (1 - watching)],
      browSad: (1 - joy) * (0.7 - 0.3 * watching), browUp: Math.max(watching * 0.4 * (1 - joy), joy),
      smile: 0.15 + 0.5 * watching * span(t, n17.start, n17.end) + joy, headTilt: -0.04 * watching, tail: Math.sin(t * 0.8) * (0.3 + joy),
      headDY: (1 - watching) * 6,
    });
    g.restore();
    // the net: draped over him, ropes snapping, then slipping away (drawn before the mouse so she stays in front)
    if (freeK < 1) drawNet(g, LION5[0] - 25, LION5[1] + 4, 540, 300 * (1 - freeK * 0.9), { t, cut: Math.min(1, netCut(t)), alpha: 1 - freeK, seed: 11, wiggle: 0.05 });
    // the mouse: arrives running, speaks, then nibbles along the edge rope
    const arriveAt = m05.start + 0.2, tIn = arriveAt - 2.2;
    let mx, run = null, look = -0.18, chew = 0, hop = 0;
    if (t < arriveAt) { const q = clamp((t - tIn) / 2.2); mx = lerp(380, 735, q); run = t * 2.8; look = 0; }
    else if (t < n17.start + 0.8) { mx = 735; }
    else if (t < free) { const q = clamp((t - n17.start - 0.8) / (free - n17.start - 0.8)); mx = lerp(745, 800, q); chew = 0.5 + 0.5 * Math.sin(t * 16); look = 0.18; hop = (Math.abs(Math.sin(t * 8)) * 2); }
    else { mx = 800; hop = Math.abs(Math.sin((t - free) * 6)) * 14 * (1 - span(t, free + 3, free + 4)); look = -0.25; }
    g.save(); g.translate(mx, LION5[1] + 2); g.scale(0.5, 0.5);
    mouseC.draw(g, { t, run, look, hop, talk: Math.max(talking('m05', t), chew * 0.7), flutter: run ? 1 : 0.3, blink: blink(t, 5),
      happy: t > free + 0.4, joy: t > free + 0.4 ? 0.6 + 0.4 * Math.sin(t * 8) : 0 });
    g.restore();
    // tiny bits of rope fluff while she nibbles
    if (t > n17.start + 1 && t < free) {
      g.save(); g.fillStyle = rgba('#b8986a', 0.8);
      for (let i = 0; i < 6; i++) {
        const ph = ((t * 1.3 + i / 6) % 1), x = mx + 40 + Math.sin(i * 2.1) * 10 + ph * (i % 2 ? 18 : -10), y = LION5[1] - 30 - ph * 22 + ph * ph * 40;
        g.globalAlpha = 1 - ph; g.fillRect(x, y, 3, 1.4);
      }
      g.restore();
    }
  });
}

// ================= SCENE 6: friends =================
function paintFriendsBg() {
  const c = canvas(LW, LH), g = c.getContext('2d');
  const tmp = canvas(LW, LH), h = tmp.getContext('2d');
  for (const L2 of [S4.sky, S4.far, S4.mid, S4.ground, S4.tree]) h.drawImage(L2, 0, 0);
  g.filter = 'blur(10px)'; g.drawImage(tmp, 0, 0); g.filter = 'none';
  return c;
}
function drawFriends(g, t) {
  const l05 = line('l05'), m06 = line('m06'), n19 = line('n19');
  const k = clamp((t - l05.start + 1) / (n19.end - l05.start + 3));
  const c = { z: 1.02 + 0.06 * ease(k), x: lerp(-10, 30, ease(k)), y: -10 };
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(PAPER, 0, 0);
  drawLayer(g, c, S6BG, 0.5);
  const lionTalk = talking('l05', t), mouseTalk = talking('m06', t);
  const tender = span(t, l05.start + 2.2, l05.start + 3);
  const best = span(t, n19.start + 1.5, n19.start + 2.5);
  cam(g, c, 1);
  g.save(); g.translate(1650, 954); g.scale(2.3, 2.3);
  const lst = {
    breath: Math.sin(t * 2 * Math.PI / 5.5),
    eyes: best > 0.5 ? [0, 0] : [(1 - blink(t, 17)) * (1 - 0.25 * tender), (1 - blink(t, 17)) * (1 - 0.25 * tender)], happy: best > 0.5,
    mouth: lionTalk * 0.85, smile: 0.5 + 0.5 * Math.max(tender, best, span(t, m06.start, m06.start + 1)),
    browUp: (1 - tender) * span(t, l05.start - 0.3, l05.start + 0.4), browSad: tender * 0.6 * (1 - best),
    headTilt: -0.04 - best * 0.05 + noise1(t * 0.4, 19) * 0.02, headDY: -lionTalk * 4 + best * 8,
    tail: Math.sin(t * 0.8) * 0.8, leg: false,
  };
  lionC.draw(g, lst);
  g.restore();
  // she stands on his big paw, looking up at him
  const hop = best > 0.2 ? Math.abs(Math.sin((t - n19.start) * 5)) * 18 * (1 - span(t, n19.end - 1, n19.end)) : 0;
  g.save(); g.translate(1650, 954); g.scale(2.3, 2.3); lionC.drawLeg(g, lst); g.restore();
  g.save(); g.translate(905, 862); g.scale(1.3, 1.3);
  mouseC.draw(g, { t, talk: mouseTalk, look: -0.22, hop, blink: blink(t, 8), happy: best > 0.5 && !mouseTalk, joy: best > 0.5 ? 0.5 + 0.4 * Math.sin(t * 7) : 0, flutter: 0.3 });
  g.restore();
  // a few little painted hearts drifting up
  if (best > 0) {
    g.save();
    for (let i = 0; i < 4; i++) {
      const ph = clamp((t - n19.start - 1.6 - i * 0.7) / 4);
      if (ph <= 0 || ph >= 1) continue;
      const x = 1050 + i * 60 + Math.sin(ph * 6 + i) * 20, y = 640 - ph * 260, s2 = 10 + i * 2;
      g.globalAlpha = Math.sin(ph * Math.PI) * 0.8; g.fillStyle = '#d97a76';
      g.beginPath(); g.moveTo(x, y + s2 * 0.9);
      g.bezierCurveTo(x - s2 * 1.4, y - s2 * 0.2, x - s2 * 0.5, y - s2 * 1.2, x, y - s2 * 0.4);
      g.bezierCurveTo(x + s2 * 0.5, y - s2 * 1.2, x + s2 * 1.4, y - s2 * 0.2, x, y + s2 * 0.9); g.fill();
    }
    g.restore();
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  nightGrade(g, 0.55);
  cam(g, c, 1);
  fireflies(g, t, 16, { x0: 0, x1: W, y0: 100, y1: 900 }, 91, 1);
}

// ================= SCENE 7: goodnight under the old tree =================
function drawGoodnight(g, t) {
  const n20 = line('n20'), n21 = line('n21'), n22 = line('n22'), n23 = line('n23'), n24 = line('n24');
  const push = span(t, n20.start, n23.end + 6), slow = clamp((t - n24.end) / 40);
  const c = { z: 1.0 + 0.16 * push + 0.04 * slow, x: -110 * push, y: 60 * push };
  const yawn = span(t, n22.start + 0.2, n22.start + 1.0) * (1 - span(t, n22.start + 2.4, n22.start + 3.2));
  const sleep = span(t, n22.start + 3.0, n22.start + 4.0);
  const hopT = n22.start + 3.4, hop = clamp((t - hopT) / 1.2);
  drawGlade(g, t, { cam: c, night: 1, flies: 26, actors: (g) => {
    g.save(); g.translate(1060, 815); g.scale(0.82, 0.82);
    const watch = 1 - sleep;
    lionW.draw(g, {
      breath: Math.sin(t * 2 * Math.PI / (5.2 + sleep)),
      eyes: yawn > 0.3 || sleep > 0.5 ? [0, 0] : [(1 - blink(t, 23)) * 0.75, (1 - blink(t, 23)) * 0.75],
      mouth: yawn, smile: 0.7 * (1 - yawn), headTilt: -0.05 * watch + yawn * 0.06, headDY: -yawn * 8 + sleep * 4,
      tail: Math.sin(t * 0.5) * 0.4 * watch,
    });
    g.restore();
    // the mouse: on his paw watching the fireflies, then up into his warm mane
    const p0 = [792, 778], p1 = [772, 655];
    const x = lerp(p0[0], p1[0], hop), y = lerp(p0[1], p1[1], hop) - Math.sin(hop * Math.PI) * 80;
    g.save(); g.translate(x, y); g.scale(0.5, 0.5);
    mouseW.draw(g, { t, look: hop < 1 ? -0.3 : 0.15, happy: hop >= 1, blink: blink(t, 29), hop: 0, flutter: 0.2, tailForward: hop >= 1 });
    g.restore();
    zzz(g, t, 960, 560, n23.start + 2.5, TL.duration + 10);
  }, after: (g) => {
    // closing words, painted softly in the sky
    const a = span(t, n24.end + 2.5, n24.end + 5) * (1 - span(t, TL.duration - 12, TL.duration - 7));
    if (a > 0) {
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.textAlign = 'center';
      g.fillStyle = `rgba(250,238,210,${0.85 * a})`; g.font = 'italic 76px "Fell"'; g.fillText('Sweet dreams', 960, 220);
      g.font = 'italic 34px "Fell"'; g.fillStyle = `rgba(250,238,210,${0.6 * a})`; g.fillText('the end', 960, 280);
      g.restore();
    }
  } });
}
