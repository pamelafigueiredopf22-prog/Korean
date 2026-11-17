// The Dove and the Ant: scenes, staging and timing.
import { W, H, rng, canvas, pool, smooth, ellipse, sprite, drawSprite, noise1, rgba, shade, tint, mix, clamp, lerp, ease, span, granulate,
  penLine, wash, glaze, ink, path, fluffy, hatch } from '../../engine/watercolor.js';
import { M, MY, LW, LH, INK, layer, cam, fireflies, motes, nightGrade, sunlight, stars, moon, zzz, makeStage } from '../../engine/stage.js';
import { makeDove } from '../../engine/characters/dove.js';
import { makeAnt } from '../../engine/characters/insects.js';
import { makeFox2 } from '../../engine/characters/fox2.js';
import { MOOD, paintSky, paintLand, paintOak, reedSpots, drawReeds, DOOR } from './scene.js';
import { brushWash, flecks, grassFlicks } from '../north-wind-and-sun/scene.js';
import { net } from './props.js';

let S, dove, ant, fox, P = {}, REEDS, PERCH;
const line = (id) => S.line(id);
const say = (id, t) => S.talking(id, t);
const m = MOOD.day;

// ---------------------------------------------------------------- helpers
// a camera looking at (cx, cy) with zoom z, kept inside the painted page
function view(cx, cy, z) {
  const hw = W / 2 / z, hh = H / 2 / z;
  return { z, x: clamp(cx, -M + hw, W + M - hw) - W / 2, y: clamp(cy, -MY + hh, H + MY - hh) - H / 2 };
}
const mixv = (a, b, k) => ({ z: lerp(a.z, b.z, k), x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });
// a layer painted at twice the resolution, so the camera can move in close and stay crisp
function hlayer(fn) { const c = canvas(LW * 2, LH * 2), g = c.getContext('2d'); g.scale(2, 2); g.translate(M, MY); fn(g); g.setTransform(1, 0, 0, 1, 0, 0); granulate(g, LW * 2, LH * 2, 0.2, 5); return c; }
const drawH = (g, c, img) => { cam(g, c, 1); g.drawImage(img, -M, -MY, LW, LH); };

const DOVE = (g, x, y, sc, face, st, mode = 'draw') => { g.save(); g.translate(x, y); g.scale(sc * -face, sc); dove[mode](g, st); g.restore(); }; // face: -1 left (her own way), +1 right
const ANT = (g, x, y, sc, face, st) => { g.save(); g.translate(x, y); g.scale(sc * face, sc); ant.draw(g, st); g.restore(); };
const FOX = (g, x, y, sc, mode, st) => { g.save(); g.translate(x, y); g.scale(-sc, sc); fox[mode](g, st); g.restore(); };             // the fox always faces left here
const inMouthNet = (t) => (h) => { h.save(); h.translate(58, 20); net(h, 95, 0.75, { world: 0.12, sway: Math.sin(t * 9) * 0.18 }); h.restore(); };

function nestBack(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const bowl = smooth([[-70, -10], [-60, -34], [0, -40], [60, -34], [72, -10], [50, 12], [0, 18], [-52, 12]]);
  wash(g, bowl, { color: '#8a6a44', opacity: 0.97, under: '#e8dcc0', seed: 400 });
  g.fillStyle = 'rgba(60,40,24,0.55)'; g.beginPath(); g.ellipse(0, -28, 54, 10, 0, 0, 7); g.fill();
  g.restore();
}
function nestFront(g, x, y, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const rim = smooth([[-74, -26], [-40, -14], [0, -10], [40, -14], [76, -26], [70, 6], [40, 18], [0, 22], [-42, 18], [-70, 6]]);
  wash(g, rim, { color: '#9a7650', opacity: 0.97, under: '#e8dcc0', seed: 401 });
  const r = rng(9); g.lineCap = 'round';
  for (let k = 0; k < 40; k++) { const a = r.range(-70, 70), b = r.range(-20, 16); g.strokeStyle = rgba(r() < 0.5 ? '#5a4028' : '#c8a878', 0.8); g.lineWidth = r.range(1, 2.4); g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(a + r.gauss(0, 14), b + r.gauss(0, 4), a + r.range(-30, 30), b + r.gauss(0, 5)); g.stroke(); }
  penLine(g, rim, { closed: true, w: 1.6, alpha: 0.7 });
  g.restore();
}
function pinchStar(g, x, y, k) {
  if (k <= 0) return;
  g.save(); g.translate(x, y); g.strokeStyle = rgba('#e8a030', k); g.lineWidth = 3; g.lineCap = 'round';
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(Math.cos(a) * 8, Math.sin(a) * 8); g.lineTo(Math.cos(a) * (14 + 10 * k), Math.sin(a) * (14 + 10 * k)); g.stroke(); }
  g.restore();
}
function grade(g, o = {}) {
  sunlight(g, o.sun ?? 0.5, o.sunset || 0);
  if (o.sunset) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(255,160,150,${0.45 * o.sunset})`; g.fillRect(0, 0, W, H); g.restore(); }
  nightGrade(g, o.night || 0);
}

// ---------------------------------------------------------------- the ant's-eye stream (a close-up place)
const LBANK = smooth([[-260, 1200], [-260, 640], [400, 630], [640, 640], [730, 662], [785, 715], [800, 1200]]);
const RBEACH = smooth([[1200, 1200], [1215, 800], [1300, 742], [1460, 714], [1700, 700], [2200, 700], [2200, 1200]]);
const WL = 790; // the water line where the ant floats
function paintWater() {
  return layer((g) => {
    const r = rng(500);
    g.fillStyle = '#f4ecdc'; g.fillRect(-M, -MY, LW, LH);
    // the far bank: tall soft grasses and flowers, out of focus
    const far = layer((h) => {
      brushWash(h, [[-300, -200], [2300, -200], [2300, 470], [-300, 470]], ['#a8b878', '#c4c484', '#94a868', '#b8c890'], { seed: 501, count: 160, width: [20, 60], len: [60, 220], angle: () => -Math.PI / 2 + 0.1, alpha: [0.15, 0.32], base: 0.6, under: true });
      for (let i = 0; i < 90; i++) { const x = r.range(-100, 2100), y = r.range(300, 470); h.strokeStyle = rgba(['#6a8448', '#8aa058', '#56703a'][i % 3], 0.8); h.lineWidth = r.range(4, 9); h.lineCap = 'round'; h.beginPath(); h.moveTo(x, y); h.quadraticCurveTo(x + r.gauss(0, 20), y - 150, x + r.gauss(0, 40), y - r.range(200, 380)); h.stroke(); }
      for (let i = 0; i < 26; i++) { const x = r.range(-50, 2000), y = r.range(60, 330), c = ['#f4ead0', '#f0c050', '#8cb0e0', '#e89aa8'][i % 4]; for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2; h.fillStyle = rgba(c, 0.85); h.beginPath(); h.arc(x + Math.cos(a) * 14, y + Math.sin(a) * 12, 12, 0, 7); h.fill(); } h.fillStyle = '#e0a030'; h.beginPath(); h.arc(x, y, 7, 0, 7); h.fill(); }
    });
    g.save(); g.filter = 'blur(5px)'; g.drawImage(far, -M, -MY); g.restore();
    // pebbles along the far edge of the water
    for (let i = 0; i < 40; i++) { const x = r.range(-80, 2000), y = r.range(440, 480), s = r.range(10, 22); wash(g, ellipse(x, y, s * 1.5, s * 0.7, 12), { color: mix(['#c8bca8', '#b4aca0', '#d4c8b0'][i % 3], '#d8dcd4', 0.3), opacity: 0.9, seed: 520 + i, layers: 8 }); }
    // the water
    const water = [[-300, 470], [2300, 470], [2300, 1300], [-300, 1300]];
    brushWash(g, water, ['#8cb4b8', '#a8c8c4', '#78a0a8', '#9cc0c0'], { seed: 530, count: 260, width: [14, 50], len: [100, 420], angle: () => 0.02, alpha: [0.16, 0.34], base: 0.75, under: '#e8eeea', lifts: 0.3 });
    const grd = g.createLinearGradient(0, 470, 0, 1100); grd.addColorStop(0, 'rgba(255,255,255,0.25)'); grd.addColorStop(1, 'rgba(40,80,90,0.15)'); g.fillStyle = grd; g.fillRect(-M, 470, LW, 700);
    // the left bank: earth and grass, roots peeping out
    brushWash(g, LBANK, ['#a8906a', '#8f7858', '#b8a07a'], { seed: 540, count: 120, width: [10, 34], len: [30, 120], angle: () => 1.2, alpha: [0.2, 0.4], base: 0.7, under: true });
    const top = smooth([[-260, 600], [400, 592], [640, 604], [735, 640], [760, 668], [700, 672], [400, 660], [-260, 666]]);
    brushWash(g, top, ['#86a058', '#9cb064', '#b4bc6c'], { seed: 541, count: 60, width: [10, 24], len: [30, 90], alpha: [0.2, 0.4], base: 0.8, under: true });
    for (let i = 0; i < 70; i++) { const x = r.range(-200, 740), y = 640 + r.range(-6, 18); grassFlicks(g, x, y, r.range(30, 70), { seed: 550 + i, n: 6, colors: ['#7f9a52', '#9cb064', '#6a8448'] }); }
    penLine(g, LBANK.filter(([x, y]) => x > 700 && y > 660), { w: 2.2, alpha: 0.75 });
    for (let k = 0; k < 3; k++) penLine(g, [[600 + k * 40, 700], [640 + k * 50, 760 + k * 20], [700 + k * 30, 830]], { color: '#5a4028', w: 3, alpha: 0.6 }); // roots
    // the right beach: big round pebbles, and the dove's flat stone
    brushWash(g, RBEACH, ['#c8b48c', '#b8a478', '#d4c4a0'], { seed: 560, count: 80, width: [10, 30], len: [20, 90], alpha: [0.2, 0.4], base: 0.7, under: true });
    const stones = [];
    for (let i = 0; i < 46; i++) { const x = r.range(1240, 2050), y = r.range(712, 1080); if (y < 700 + Math.max(0, 1460 - x) * 0.32) continue; stones.push([x, y, r.range(16, 40) * (0.7 + (y - 700) / 600)]); }
    stones.sort((a, b) => a[1] - b[1]);
    for (const [i, [x, y, s]] of stones.entries()) {
      const peb = ellipse(x, y, s * 1.4, s * 0.8, 14, r.gauss(0, 0.15));
      g.fillStyle = 'rgba(70,60,70,0.22)'; g.beginPath(); g.ellipse(x + s * 0.2, y + s * 0.6, s * 1.4, s * 0.35, 0, 0, 7); g.fill();
      wash(g, peb, { color: m.stone[i % 4], opacity: 0.97, under: true, seed: 570 + i, layers: 10, edge: 0.35 });
      glaze(g, peb, x - s * 0.4, y - s * 0.35, s * 0.6, s * 0.25, '#ffffff', 0.5);
      ink(g, peb, { closed: true, width: 1.3, alpha: 0.6, wobble: 0.3, gaps: 0.4, seed: 600 + i });
    }
    const flat = smooth([[1580, 690], [1620, 664], [1780, 660], [1830, 690], [1800, 716], [1600, 718]]);
    wash(g, flat, { color: '#b8b0a8', opacity: 0.98, under: true, seed: 620 }); glaze(g, flat, 1680, 670, 90, 10, '#ffffff', 0.5); penLine(g, flat, { closed: true, w: 1.8, alpha: 0.75 });
    // ripples where the water meets each bank
    for (const [x0, x1, y] of [[620, 800, 700], [1210, 1480, 760]]) for (let k = 0; k < 4; k++) ink(g, [[x0 + k * 10, y + 20 + k * 22], [(x0 + x1) / 2, y + 28 + k * 22], [x1 - k * 10, y + 22 + k * 22]], { color: '#ffffff', width: 1.5, alpha: 0.45, wobble: 0.4 });
    // bulrushes at the ends
    for (const [bx, by] of [[90, 660], [150, 655], [1960, 708], [2010, 712]]) for (let k = 0; k < 4; k++) { g.strokeStyle = rgba('#6a8448', 0.9); g.lineWidth = 5; g.beginPath(); g.moveTo(bx + k * 12, by); g.quadraticCurveTo(bx + k * 12 + 10, by - 200, bx + k * 16 - 6, by - 380 + k * 20); g.stroke(); if (k % 2 === 0) { g.fillStyle = '#7a5a3a'; g.beginPath(); g.ellipse(bx + k * 16 - 4, by - 330 + k * 20, 10, 32, 0.05, 0, 7); g.fill(); } }
  });
}
// live water: little current lines drifting downstream (to the right) and glints of light
function waterLife(g, t) {
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    const y = 500 + noise1(i, 3) * 0.5 * 600 + 300 * (noise1(i * 2, 5) * 0.5 + 0.5);
    if (y > 1120) continue;
    const x = ((noise1(i * 3.3, 7) + 1) * 1200 + t * (40 + (y - 470) * 0.06)) % 2300 - 200;
    if ((x < 790 && y < 1200 && x > -260) || (x > 1200 && y > 700 + Math.max(0, 1460 - x) * 0.32 + 40)) continue;
    const l = 30 + (y - 470) * 0.08;
    g.strokeStyle = `rgba(255,255,255,${0.35 + 0.2 * Math.sin(t * 2 + i)})`; g.lineWidth = 1.6 + (y - 470) / 300;
    g.beginPath(); g.moveTo(x - l, y); g.quadraticCurveTo(x, y - 4, x + l, y); g.stroke();
  }
  g.restore();
}
// the ant, floating: her lower half under the water, with rings spreading round her
function floating(g, x, y, t, st, sc = 0.5) {
  g.save(); g.beginPath(); g.rect(x - 200, y - 400, 400, 408); g.clip(); ANT(g, x, y + 46, sc, 1, st); g.restore(); // only the part above the water shows
  g.save(); g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.ellipse(x, y + 8, 46, 7, 0, 0, 7); g.fill(); g.restore();
  g.save(); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 2;
  for (let k = 0; k < 3; k++) { const p = (t * 0.7 + k / 3) % 1; g.globalAlpha = 1 - p; g.beginPath(); g.ellipse(x, y + 8, 40 + p * 90, 8 + p * 16, 0, 0, 7); g.stroke(); }
  g.restore();
}
function leafBoat(g, x, y, s = 1, rot = 0) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  const lf = smooth([[-80, 0], [-62, -12], [-40, -10], [-24, -20], [0, -18], [22, -22], [44, -14], [66, -14], [86, 2], [64, 12], [40, 12], [20, 18], [-4, 14], [-28, 18], [-52, 12]]);
  g.fillStyle = 'rgba(40,80,90,0.25)'; g.beginPath(); g.ellipse(0, 10, 86, 10, 0, 0, 7); g.fill();
  wash(g, lf, { color: '#7f9a4a', opacity: 0.96, under: '#f4ead6', seed: 7, layers: 12 });
  glaze(g, lf, -20, -6, 30, 6, '#b8c878', 0.6);
  ink(g, [[-86, 2], [-80, 0], [86, 2]], { color: '#4a5a2a', width: 1.4, alpha: 0.7 });
  for (let k = -2; k <= 2; k++) ink(g, [[k * 26, 0], [k * 26 + 14, -12]], { color: '#4a5a2a', width: 0.9, alpha: 0.5 });
  penLine(g, lf, { closed: true, w: 1.5, alpha: 0.8 });
  g.restore();
}

// ---------------------------------------------------------------- the meadow, wide (painted large, so the camera can come close)
function meadow(g, t, c, o = {}) {
  S.paperBg(g);
  drawH(g, c, P.wide);
  cam(g, c, 1);
  drawReeds(g, m, REEDS, t, o.sway || 0);
  if (o.actors) o.actors(g);
  if (!o.night) motes(g, t, 26, 7, { x0: 200, x1: 1800, y0: 300, y1: 950 });
  if (o.after) o.after(g);
}

// ---------------------------------------------------------------- scenes
function drawTitle(g, t) {
  S.paperBg(g); g.fillStyle = 'rgba(250,214,160,0.18)'; g.fillRect(0, 0, W, H);
  cam(g, { z: 1 + t * 0.004, x: 0, y: 0 }, 1);
  g.save(); g.textAlign = 'center'; g.fillStyle = INK;
  const a1 = span(t, 0.6, 2.4), a2 = span(t, 1.4, 3.2), a3 = span(t, 2.4, 4.0);
  g.globalAlpha = a1 * 0.9; g.font = '110px "Fell"'; g.fillText('The Dove', 960, 420 + (1 - a1) * 10);
  g.globalAlpha = a2 * 0.9; g.font = 'italic 100px "Fell"'; g.fillText('& the Ant', 960, 550 + (1 - a2) * 10);
  g.globalAlpha = a3 * 0.75; g.font = 'italic 40px "Fell"'; g.fillText('an Aesop’s fable, for sleepy little ones', 960, 640);
  g.restore();
  g.save(); g.globalAlpha = span(t, 0.3, 1.8);
  DOVE(g, 560, 860, 1.0, 1, { t, coo: Math.max(0, Math.sin(t * 2)) * 0.4, eye: 1 - S.blink(t, 2) });
  ANT(g, 1360, 860, 0.55, -1, { t, arms: 'wave', smile: 0.7, eyes: 1 - S.blink(t, 5) });
  g.restore();
}

// the ant comes out of her little door and walks down to the stream for a drink
function drawWalk(g, t) {
  const n01 = line('n01');
  const k = clamp((t - 6.2) / (n01.end + 0.6 - 6.2));
  const x = lerp(DOOR[0] + 18, 712, ease(k)), y = lerp(DOOR[1] + 4, 842, ease(k));
  const c = mixv(view(960, 540, 1), view(720, 760, 2.3), ease(span(t, 7.5, 15.5)));
  meadow(g, t, c, { actors: (g2) => {
    DOVE(g2, PERCH[0], PERCH[1], 0.55, 1, { t, coo: Math.max(0, Math.sin(t * 1.6)) * 0.3, eye: 1 - S.blink(t, 2) });
    g2.save(); g2.globalAlpha = span(t, 6, 6.8); ANT(g2, x, y, 0.1, 1, { t, walk: k < 1 ? t * 1.6 : null, smile: 0.7, eyes: 1 - S.blink(t, 5) }); g2.restore();
  } });
  grade(g);
}

// at the water's edge: the wave, the cry for help, the leaf, the rescue, the thank-yous
function drawWater(g, t) {
  const n02 = line('n02'), n04 = line('n04'), n05 = line('n05'), a01 = line('a01'), a02 = line('a02'), d02 = line('d02');
  const leanT = n02.start + 2.5, waveT = n02.start + 5.6, inT = waveT + 0.9;
  const dropT = n04.start + 5.0, landLeaf = dropT + 2.2, climb0 = n05.start + 0.4, climb1 = climb0 + 1.1, sail1 = n05.end - 0.4, offT = sail1 + 0.2;
  // where things are
  const driftX = (tt) => lerp(800, 1000, clamp((tt - inT) / (landLeaf + 1 - inT)));
  const leafX = t < climb1 ? 1040 : lerp(1040, 1250, ease(clamp((t - climb1) / (sail1 - climb1))));
  const c = { z: 1.06, x: lerp(-60, 120, ease(span(t, inT, offT))), y: 20 + Math.sin(t * 0.2) * 6 };
  S.paperBg(g); cam(g, c, 1); g.drawImage(P.water, -M, -MY);
  cam(g, c, 1); waterLife(g, t);
  const bob = Math.sin(t * 2.2) * 5;
  // the little wave curling up and washing over the bank
  const wv = span(t, waveT - 0.7, waveT + 0.1) * (1 - span(t, waveT + 0.4, waveT + 1.2));
  if (wv > 0) {
    const crest = smooth([[700, 760], [760, 760 - 120 * wv], [700 - 40 * wv, 700 - 150 * wv], [640 - 30 * wv, 690 - 110 * wv], [670, 720 - 40 * wv], [740, 790]]);
    g.save(); g.globalAlpha = 0.85; g.fillStyle = '#9cc4c8'; path(g, crest); g.fill(); g.restore();
    ink(g, crest.slice(0, 18), { color: '#ffffff', width: 2.5, alpha: 0.8 * wv });
    for (let k = 0; k < 8; k++) { g.fillStyle = `rgba(255,255,255,${0.8 * wv})`; g.beginPath(); g.arc(660 + k * 14, 640 - 120 * wv + Math.sin(k) * 20, 4, 0, 7); g.fill(); }
  }
  // the leaf: tumbling down from above, then a little boat
  const leafFall = clamp((t - dropT) / (landLeaf - dropT));
  if (t > dropT && t < landLeaf) {
    const lx = lerp(1000, 1040, leafFall) + Math.sin(leafFall * Math.PI * 3) * 60, ly = lerp(300, WL + 6, leafFall);
    leafBoat(g, lx, ly, 0.55, Math.sin(leafFall * Math.PI * 3) * 0.6);
  } else if (t >= landLeaf && t < offT + 3) {
    const splash = span(t, landLeaf, landLeaf + 0.2) * (1 - span(t, landLeaf + 0.3, landLeaf + 1));
    if (splash > 0) { g.save(); g.strokeStyle = `rgba(255,255,255,${0.7 * splash})`; g.lineWidth = 2; g.beginPath(); g.ellipse(1040, WL + 10, 90 * (1.4 - splash * 0.4), 16, 0, 0, 7); g.stroke(); g.restore(); }
    leafBoat(g, leafX, WL + 6 + bob * 0.6, 0.55, Math.sin(t * 1.6) * 0.03);
  }
  // the ant
  const fear = S.mood(t, 'a01', 0.4, 2), glad = S.mood(t, 'a02', 0.3, 3);
  const stTalk = { t, mouth: Math.max(say('a01', t), say('a02', t)) * 0.9, eyes: 1 - S.blink(t, 5) };
  if (t < waveT - 0.1) { // on the bank, then leaning over for a sip
    const lean = span(t, leanT, leanT + 1.2) * (1 - span(t, waveT - 0.5, waveT - 0.1) * 0.5);
    g.save(); g.translate(700, 655); g.rotate(lean * 0.35); ANT(g, 0, 0, 0.5, 1, { ...stTalk, headTilt: lean * 0.3, smile: 0.7, walk: t < n02.start + 1.5 ? t * 1.6 : null }); g.restore();
  } else if (t < inT) { // swept off her feet!
    const u = clamp((t - waveT + 0.1) / (inT - waveT + 0.1));
    g.save(); g.translate(lerp(700, 800, u), lerp(655, WL, u) - Math.sin(u * Math.PI) * 70); g.rotate(u * Math.PI * 1.6);
    ANT(g, 0, 40, 0.5, 1, { t, browUp: 1, mouth: 0.8, smile: -0.2 }); g.restore();
  } else if (t < climb0) { // floating, calling out, then paddling toward the leaf
    const x = t < landLeaf ? driftX(t) : lerp(driftX(landLeaf), 1000, clamp((t - landLeaf) / 1));
    floating(g, x, WL + bob, t, { ...stTalk, arms: fear > 0.3 || t > landLeaf ? 'wave' : 'hug', browUp: 0.6 + fear * 0.4, smile: 0.1 - fear * 0.3 + (t > landLeaf ? 0.6 : 0) });
  } else if (t < climb1) { // climbing aboard
    const u = ease(clamp((t - climb0) / (climb1 - climb0)));
    if (u < 0.6) floating(g, lerp(1000, 1030, u), WL + bob - u * 30, t, { t, arms: 'give', browUp: 0.5, smile: 0.4 });
    else ANT(g, 1030, WL - 4 + bob * 0.6, 0.5, 1, { t, smile: 0.7, walk: t * 2 });
  } else if (t < offT) { // sailing
    ANT(g, leafX - 10, WL - 4 + bob * 0.6, 0.5, 1, { t, smile: 0.85, happy: Math.sin(t * 1.4) > 0.3, arms: t < climb1 + 2 ? 'wave' : 'rest' });
  } else { // ashore on the pebbles
    const u = ease(clamp((t - offT) / 1.2));
    ANT(g, lerp(1250, 1450, u), lerp(WL - 4, 726, u), 0.5, u < 0.9 ? 1 : -1, { ...stTalk, walk: u < 1 ? t * 1.8 : null, smile: 0.7 + glad * 0.3, arms: say('a02', t) > 0.1 ? 'wave' : 'rest', browUp: glad * 0.6 });
  }
  // the dove: swoops in from the oak with the leaf, lets it go, lands on the flat stone, and turns round
  if (t > n04.start + 3.4) {
    const t0 = n04.start + 3.6, flyEnd = landLeaf + 0.2;
    if (t < flyEnd) {
      const u = clamp((t - t0) / (flyEnd - t0));
      const x = lerp(-250, 1700, ease(u)), y = lerp(150, 682, ease(u)) - Math.sin(u * Math.PI) * 120;
      DOVE(g, x, y, 1.1, 1, { beat: t * 2.6, leaf: t < dropT, legs: span(t, flyEnd - 0.8, flyEnd), glide: span(t, flyEnd - 1.2, flyEnd - 0.4) * 0.6, pitch: u > 0.8 ? -0.15 : 0.1 }, 'drawFly');
    } else {
      const turn = span(t, n05.start - 0.6, n05.start - 0.2), face = 1 - 2 * turn; // turns round to watch the ant
      DOVE(g, 1700, 682, 1.1, face === 0 ? 0.01 : face, { t, beak: Math.max(say('d02', t), say('d01', t)) * 0.8, coo: Math.max(0, Math.sin(t * 2)) * 0.25, eye: 1 - S.blink(t, 2), happy: S.mood(t, 'd02') > 0.5 && say('d02', t) < 0.1, headTilt: -0.15 });
    }
  }
  grade(g);
}

// up in the oak, the dove hears the tiny cry, and plucks a leaf
function drawBranch(g, t) {
  const n03 = line('n03'), d01 = line('d01'), n04 = line('n04');
  const hear = span(t, n03.start + 2.4, n03.start + 3), pluckT = n04.start + 1.4, offT = n04.start + 2.2;
  let c = view(PERCH[0] + 60, PERCH[1] - 10, 2.2);
  c = mixv(c, view(PERCH[0] + 260, PERCH[1] + 200, 1.6), ease(span(t, offT, offT + 1.6)));
  meadow(g, t, c, { actors: (g2) => {
    if (t < offT) {
      const lean = span(t, pluckT - 0.6, pluckT) * (1 - span(t, pluckT + 0.1, pluckT + 0.5));
      DOVE(g2, PERCH[0], PERCH[1], 0.55, 1, { t, beak: say('d01', t) * 0.8 + lean * 0.4, eye: 1 - S.blink(t, 2), headTilt: 0.35 * hear - lean * 0.5, leaf: t > pluckT, coo: (1 - hear) * Math.max(0, Math.sin(t * 2)) * 0.4, wingOpen: span(t, offT - 0.4, offT) });
    } else {
      const u = clamp((t - offT) / 2.2);
      DOVE(g2, lerp(PERCH[0], 1500, u), lerp(PERCH[1], 1000, u * u), 0.55, 1, { beat: t * 2.6, leaf: true, pitch: 0.25 }, 'drawFly');
    }
  } });
  grade(g);
}

// a few days later: the fox and his net, the ant's pinch, and the dove flies free
function drawFox(g, t) {
  const n06 = line('n06'), f01 = line('f01'), n07 = line('n07'), n08 = line('n08'), a03 = line('a03'), n09 = line('n09'), f02 = line('f02'), n10 = line('n10');
  const DX = 1120, DY = 905, FY = 905;
  // the fox's path
  const stop1 = n06.end + 0.2, sitT = f01.start - 0.5, creepT = n07.start + 1.2, stop2 = n07.end - 0.4, raiseT = stop2 + 0.2;
  let fx = lerp(2200, 1560, ease(clamp((t - n06.start) / (stop1 - n06.start))));
  if (t > creepT) fx = lerp(1560, 1340, clamp((t - creepT) / (stop2 - creepT)));
  const pinchT = n09.end - 1.0, jumpT = pinchT + 0.25, dropT = f02.start + 0.4, flyT = n10.start + 1.4;
  const hopping = t > f02.start - 0.2 && t < n10.end + 1;
  if (t > f02.end) fx = lerp(1340, 1560, ease(clamp((t - f02.end) / (n10.end - f02.end))));
  const hop = hopping ? Math.abs(Math.sin((t - f02.start) * 6)) * 50 : t > jumpT && t < jumpT + 0.5 ? Math.sin((t - jumpT) / 0.5 * Math.PI) * 40 : 0;
  // the ant
  const runT = n09.start + 0.6, ax0 = 1190, paw = 1340 - 30;
  const ax = t < runT ? ax0 : lerp(ax0, paw, clamp((t - runT) / (pinchT - runT - 0.2)));
  // camera
  let c = view(1700, 760, 1.35);
  c = mixv(c, view(1500, 760, 1.8), ease(span(t, f01.start - 1, f01.start + 0.5)));
  c = mixv(c, view(1260, 780, 1.45), ease(span(t, n07.start, n07.start + 2)));
  c = mixv(c, view(1210, 860, 2.3), ease(span(t, n08.start - 0.2, n08.start + 1.6)));
  c = mixv(c, view(1300, 820, 1.8), ease(span(t, n09.end - 2.5, n09.end)));
  c = mixv(c, view(1050, 560, 1.0), ease(span(t, n10.start + 1, n10.end + 0.6)));
  meadow(g, t, c, { actors: (g2) => {
    // the dove pecking and cooing in the sunshine, then flying up and away
    if (t < flyT) DOVE(g2, DX, DY, 0.55, -1, { t, coo: Math.max(0, Math.sin(t * 2)) * 0.45, beak: Math.max(0, Math.sin(t * 2)) * 0.25, eye: (1 - S.blink(t, 2)) * (t > jumpT ? 1 : 0.9), bob: Math.max(0, Math.sin(t * 1.3)) * (t < n08.start ? 1 : 0), headTilt: t > jumpT ? -0.2 : 0 });
    else { const u = clamp((t - flyT) / 3.2); DOVE(g2, lerp(DX, 600, u), lerp(DY, -150, ease(u)) - Math.sin(u * 3) * 10, 0.55, -1, { beat: t * 2.8, pitch: -0.35 + u * 0.3 }, 'drawFly'); }
    // the net, once dropped
    const netK = clamp((t - dropT) / 0.7);
    if (t > dropT) { g2.save(); g2.translate(1390, FY); g2.scale(-0.5, 0.5); g2.translate(lerp(60, 160, netK), lerp(-300, -6, netK * netK)); net(g2, 160, lerp(-1.2, 0.05, netK), { flat: netK >= 1, world: 0, sway: Math.sin(t * 8) * (1 - netK) }); g2.restore(); }
    // the fox
    const sly = 0.5, base = { t, eyes: 1 - S.blink(t, 3), sly, smile: 0.55, mouth: say('f01', t) * 0.7 };
    const ouch = S.mood(t, 'f02', 0.6, 4);
    const sitK = span(t, sitT, sitT + 0.5) * (1 - span(t, creepT - 0.4, creepT)) + span(t, stop2, stop2 + 0.4);
    const trot = (b) => FOX(b, fx, FY, 0.5, 'drawTrot', { ...base, walk: (t < stop1 || (t > creepT && t < stop2)) ? t * (t > creepT ? 0.7 : 1.3) : null, mouth: 0.22, inMouth: inMouthNet(t), headDY: t > creepT ? 26 : 10 });
    const sit = (b) => {
      const raise = span(t, raiseT, raiseT + 0.8) * (1 - span(t, jumpT, jumpT + 0.3));
      const holdNet = t < dropT && t > sitT ? (gg, x, y) => { gg.save(); gg.translate(x, y); gg.rotate(lerp(0.9, 1.25, raise)); net(gg, 170, 0, { world: 0, sway: Math.sin(t * 3) * 0.1 }); gg.restore(); } : null;
      b.save(); b.translate(0, -hop); if (hopping) { b.translate(fx, FY); b.rotate(Math.sin((t - f02.start) * 6) * 0.12); b.translate(-fx, -FY); }
      FOX(b, fx, FY, 0.5, 'drawSit', { ...base, mouth: Math.max(say('f01', t) * 0.7, say('f02', t)), pawUp: t < dropT ? 0.35 + raise * 0.55 : 0.25 + Math.abs(Math.sin(t * 6)) * 0.3 * (hopping ? 1 : 0),
        pawHold: holdNet, browUp: ouch, eyes: ouch > 0.5 ? (Math.sin(t * 5) > 0 ? 0 : 1) : base.eyes, sly: sly * (1 - ouch), smile: 0.55 - ouch * 0.8 });
      b.restore();
    };
    if (sitK <= 0) trot(g2); else if (sitK >= 1) sit(g2);
    else { g2.save(); g2.globalAlpha = 1 - sitK; trot(g2); g2.restore(); g2.save(); g2.globalAlpha = sitK; sit(g2); g2.restore(); }
    // the ant
    const brave = S.mood(t, 'a03', 0.3, 1);
    if (t > n06.start + 2) ANT(g2, ax, FY + 18, 0.11, 1, { t, walk: t > runT && t < pinchT ? t * 4 : null, mouth: say('a03', t) * 0.9, eyes: 1 - S.blink(t, 5), browUp: t > n08.start && t < n08.end + 2 ? 1 : brave * 0.4, smile: 0.4 + brave * 0.3, arms: t > pinchT - 0.3 && t < pinchT + 0.6 ? 'give' : brave > 0.5 ? 'wave' : 'rest' });
    cam(g2, c, 1); pinchStar(g2, paw + 12, FY - 4, span(t, pinchT, pinchT + 0.15) * (1 - span(t, pinchT + 0.4, pinchT + 0.9)));
  } });
  grade(g);
}

// the thank-yous; the fox, rubbing his toe, decides doves are nicer to watch
function drawLesson(g, t) {
  const d03 = line('d03'), a04 = line('a04'), n11 = line('n11'), n12 = line('n12');
  const landT = d03.start - 0.3, DX = 1180, DY = 905, AX = 1290, AY = 925, FX = 1560;
  let c = view(1330, 820, 1.8);
  c = mixv(c, view(1450, 800, 1.7), ease(span(t, n11.start - 0.5, n11.start + 1.5)));
  c = mixv(c, view(960, 540, 1.0), ease(span(t, n12.start - 0.5, n12.end + 1.5)));
  const watch = span(t, n11.start + 4, n11.start + 5.2);
  meadow(g, t, c, { actors: (g2) => {
    if (t < landT) { const u = clamp((t - (landT - 2.4)) / 2.4); DOVE(g2, lerp(800, DX, ease(u)), lerp(500, DY, ease(u)), 0.55, 1, { beat: t * 2.6, legs: u, glide: u * 0.5 }, 'drawFly'); }
    else DOVE(g2, DX, DY, 0.55, 1, { t, beak: say('d03', t) * 0.8, coo: Math.max(0, Math.sin(t * 2)) * 0.3, eye: 1 - S.blink(t, 2), happy: S.mood(t, 'a04') > 0.5, headTilt: -0.1 + S.mood(t, 'd03') * 0.15 });
    const proud = S.mood(t, 'a04', 0.2, 2);
    ANT(g2, AX, AY, 0.11, -1, { t, mouth: say('a04', t) * 0.9, eyes: 1 - S.blink(t, 5), smile: 0.7 + proud * 0.3, arms: proud > 0.4 ? 'wave' : 'rest', happy: proud > 0.5 && say('a04', t) < 0.1, browUp: proud * 0.6 });
    FOX(g2, FX, 905, 0.5, 'drawSit', { t, pawUp: 0.28 + 0.08 * Math.sin(t * 5) * (1 - watch), eyes: watch > 0.5 ? 1 - S.blink(t, 3) : 0.55, smile: 0.2 + watch * 0.6, happy: watch > 0.5 && Math.sin(t * 0.8) > 0.6, headTilt: 0.1 * watch, sly: 0 });
  } });
  grade(g, { sun: 0.6 });
}

// goodnight: the dove in her nest, the ant at her little door, the stream, the fireflies, the stars
function drawNight(g, t) {
  const n13 = line('n13'), n14 = line('n14'), n15 = line('n15'), n16 = line('n16'), END = S.TL.duration;
  const NEST = [PERCH[0] - 150, PERCH[1] + 28];
  let c = view(NEST[0], NEST[1] - 20, 2.4);
  c = mixv(c, view(DOOR[0] + 30, DOOR[1] - 40, 2.4), ease(span(t, n14.start - 1.2, n14.start + 1.5)));
  c = mixv(c, view(900, 560, 1.0), ease(span(t, n15.start - 0.5, n15.end + 2)));
  c = mixv(c, view(760, 640, 1.25), ease(span(t, n16.end + 1, END - 6)));
  const dusk = span(t, n13.start - 1, n13.end), night = span(t, n14.start, n15.start + 3);
  const sleep = span(t, n13.start + 2.8, n13.start + 4);
  meadow(g, t, c, { night: night > 0.5, actors: (g2) => {
    nestBack(g2, NEST[0], NEST[1], 0.85);
    if (sleep < 1) { g2.save(); g2.globalAlpha = 1 - sleep; DOVE(g2, NEST[0] - 4, NEST[1] + 2, 0.55, 1, { t, eye: 0.7 - sleep * 0.7, coo: 0.2 }); g2.restore(); }
    if (sleep > 0) { g2.save(); g2.globalAlpha = sleep; DOVE(g2, NEST[0] - 4, NEST[1] + 6, 0.55, 1, { breath: Math.sin(t * 1.2) }, 'drawSleep'); g2.restore(); }
    nestFront(g2, NEST[0], NEST[1] + 4, 0.85);
    // the ant walks home and goes in; her window glows
    const k = clamp((t - (n14.start - 0.5)) / 3.6);
    const inside = span(t, n14.start + 3.1, n14.start + 3.7);
    if (inside < 1) { g2.save(); g2.globalAlpha = 1 - inside; ANT(g2, lerp(DOOR[0] + 110, DOOR[0] + 2, ease(k)), DOOR[1] + 4, 0.13, -1, { t, walk: k < 1 ? t * 1.4 : null, smile: 0.7, eyes: 0.8, arms: k >= 1 ? 'wave' : 'rest' }); g2.restore(); }
  } });
  grade(g, { sun: 0.5 * (1 - night), sunset: dusk * (1 - night * 0.6), night: night * 0.85 });
  cam(g, c, 1);
  g.save(); g.globalCompositeOperation = 'lighter';
  const glow = span(t, n14.start + 3.4, n14.start + 4.4) * (0.85 + 0.15 * Math.sin(t * 3));
  pool(g, DOOR[0] + 42, DOOR[1] - 34, 26, 26, '#ffcf80', 0.8 * glow);
  g.restore();
  if (night > 0) {
    cam(g, c, 1); moon(g, 1620, lerp(320, 170, ease(span(t, n15.start - 3, n15.end + 4))), 34, night * span(t, n15.start - 3, n15.start));
    stars(g, t, night, n15.start + 2, { x0: 500, x1: 1880, y0: 40, y1: 330 });
    fireflies(g, t, 30, { x0: 200, x1: 1900, y0: 520, y1: 1000 }, 41, night);
    zzz(g, t, NEST[0] + 10, NEST[1] - 60, n13.start + 4.5, END + 10);
  }
  const a = span(t, n16.end + 2.5, n16.end + 5) * (1 - span(t, END - 12, END - 7));
  if (a > 0) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.textAlign = 'center'; g.fillStyle = `rgba(250,238,210,${0.85 * a})`; g.font = 'italic 76px "Fell"'; g.fillText('Sweet dreams', 1220, 330); g.font = 'italic 34px "Fell"'; g.fillStyle = `rgba(250,238,210,${0.6 * a})`; g.fillText('the end', 1220, 385); g.restore(); }
}

// ---------------------------------------------------------------- entry points
let SCENES;
window.FABLE = {
  async setup(timeline) {
    S = makeStage(timeline);
    await S.setup(document.getElementById('c'));
    dove = makeDove(1.6); ant = makeAnt(1.4); fox = makeFox2(1.4);
    P.wide = hlayer((g) => { paintSky(g, m); paintLand(g, m); PERCH = paintOak(g, m).perch; });
    P.water = paintWater();
    REEDS = reedSpots();
    SCENES = [
      [0, drawTitle], [5.4, drawWalk], [line('n02').start - 0.8, drawWater], [line('n03').start - 0.8, drawBranch],
      [line('n04').start + 3.3, drawWater], [line('n06').start - 0.8, drawFox], [line('d03').start - 1.4, drawLesson], [line('n13').start - 1.2, drawNight],
    ];
  },
  frame(t) { S.frame(t, SCENES); },
};
