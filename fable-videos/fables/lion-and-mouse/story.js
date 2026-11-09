// The Lion and the Mouse: scenes, staging and timing.
import { W, H, rng, paper, canvas, wash, ink, pool, strokes, ellipse, smooth, fluffy, sprite, drawSprite, bbox,
  noise1, rgba, mix, tint, shade, clamp, lerp, ease, span, noiseTexture } from '../../engine/watercolor.js';
import { PAL, foliage, trunk, grass, flower, berries, mushroom, fern, hills, cloud, leaf, plant } from '../../engine/scenery.js';
import { makeLion } from '../../engine/characters/lion.js';
import { makeMouse } from '../../engine/characters/mouse.js';

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

function drawScene1(g, t) {
  const t0 = 4, sceneEnd = line('n06').start + 1;
  const k = clamp((t - t0) / (sceneEnd - t0));
  const c = { z: 1.0 + 0.07 * ease(k), x: lerp(0, 60, ease(k)), y: lerp(0, 25, ease(k)) };
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.drawImage(PAPER, 0, 0);
  drawLayer(g, c, S1.sky, 0.15);
  for (const cl of S1.clouds) { cam(g, c, 0.2); g.translate(t * 3.5, 0); drawSprite(g, cl.s, 0.9); }
  drawLayer(g, c, S1.far, 0.35);
  drawLayer(g, c, S1.mid, 0.6);
  drawLayer(g, c, S1.ground, 1);
  drawLayer(g, c, S1.bigTree, 1);

  // the lion
  const mp = mousePath1(t);
  const tJump = line('n05').end - 2.4;
  const twitch = t > tJump + 0.4 && t < tJump + 1.4 ? Math.sin((t - tJump - 0.4) * Math.PI) : 0;
  cam(g, c, 1);
  g.save(); g.translate(1060, 815); g.scale(0.82, 0.82);
  lionW.draw(g, { breath: Math.sin(t * 2 * Math.PI / 5.2), eyes: [0, 0], headDY: -twitch * 4, headTilt: twitch * 0.02, tail: Math.sin(t * 0.7) * 0.6 + (noise1(t * 0.3, 4) - 0.5) });
  g.restore();
  zzz(g, t, 930, 560, line('n02').start, tJump);
  if (mp) {
    g.save(); g.translate(mp.x, mp.y); g.scale(0.55, 0.55);
    mouseW.draw(g, { t, run: mp.run, hop: 0, flutter: mp.run != null || mp.air ? 1 : 0.3, look: mp.air ? -0.25 : 0, blink: blink(t, 2) });
    g.restore();
  }
  // canopy, drifting leaves, fireflies, foreground
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
  g.save(); g.globalCompositeOperation = 'screen'; g.globalAlpha = 0.75 + 0.25 * Math.sin(t * 0.25);
  g.drawImage(S1.beams, 0, 0); g.restore();
  motes(g, t, 40, 11);
  fireflies(g, t, 22, { x0: 0, x1: W, y0: 380, y1: 980 }, 11, 0.8);
  for (const tuft of S1.fg) {
    cam(g, c, 1.2);
    g.translate(tuft.x, tuft.y); g.rotate(Math.sin(t * 0.6 + tuft.ph) * 0.02); g.translate(-tuft.x, -tuft.y);
    drawSprite(g, tuft.s);
  }
  g.setTransform(1, 0, 0, 1, 0, 0);
  // warm low sunlight
  g.save(); g.globalCompositeOperation = 'soft-light';
  const lg = g.createLinearGradient(0, 0, W, H);
  lg.addColorStop(0, 'rgba(255,200,120,0.55)'); lg.addColorStop(1, 'rgba(120,70,40,0.25)');
  g.fillStyle = lg; g.fillRect(0, 0, W, H); g.restore();
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
  const lst = {
    breath: Math.sin(t * 2 * Math.PI / 5.5) * (1 - awake * 0.5),
    eyes: chuckling ? [0, 0] : [Math.min(eyeL, 1 - bl), Math.min(eyeR, 1 - bl)],
    happy: chuckling,
    mouth: lionTalk * 0.9 + (chuckling ? 0.25 + 0.2 * Math.sin(t * 11) : 0),
    smile,
    headTilt: (chuckling ? Math.sin(t * 9) * 0.015 : 0) - 0.035 * awake + noise1(t * 0.4, 9) * 0.02,
    headDY: chuckling ? Math.abs(Math.sin(t * 9)) * -5 : 0,
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
  const fadeIn = 1 - span(t, 0, 1.2), fadeOut = span(t, TL.duration - 4, TL.duration - 0.5);
  const f = Math.max(fadeIn, fadeOut);
  if (f > 0) { g.fillStyle = `rgba(242,231,211,${f})`; g.fillRect(0, 0, W, H); }
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
  },
  frame(t) {
    const g = ctx;
    const titleEnd = 7.6, s2Start = line('n06').start - 0.7;
    if (t < titleEnd - 2.2) drawTitle(g, t);
    else if (t < titleEnd) dissolve(g, drawTitle, drawScene1, t, (t - (titleEnd - 2.2)) / 2.2);
    else if (t < s2Start) drawScene1(g, t);
    else if (t < s2Start + 1.8) dissolve(g, drawScene1, drawScene2, t, (t - s2Start) / 1.8);
    else drawScene2(g, t);
    finish(g, t);
  },
};
