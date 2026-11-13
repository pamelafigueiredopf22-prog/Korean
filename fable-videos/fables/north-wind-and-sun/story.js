// The North Wind and the Sun: scenes, staging and timing.
import { W, H, rng, canvas, pool, smooth, ellipse, sprite, drawSprite, noise1, rgba, shade, tint, clamp, lerp, ease, span, granulate, penLine, wash, glaze } from '../../engine/watercolor.js';
import { leaf } from '../../engine/scenery.js';
import { M, MY, LW, LH, INK, layer, cam, drawLayer, fireflies, motes, nightGrade, sunlight, stars, moon, zzz, makeStage } from '../../engine/stage.js';
import { makeWind, makeSun, windStreams } from '../../engine/characters/sky.js';
import { makeTraveller } from '../../engine/characters/traveller.js';
import { MOOD, LANE, laneW, paintSky, paintLand, paintLaneAndWalls, flowerSpots, drawFlowers, appleTree, drawAppleTree, CLOUDS, cloudSprite, TREE } from './scene.js';

let S, wind, sun, tr, P = {}, FLOWERS, BUF, LEAVES;
const line = (id) => S.line(id);
const say = (id, t) => S.talking(id, t);
const SPLIT = 880;                       // walls whose foot is nearer than this are drawn in front of the traveller
const SKYCAM = { z: 1.3, x: 0, y: -170 }; // looking up into the sky
const TREECAM = { z: 1.5, x: 405, y: 180 };
const DUSKCAM = { z: 1.15, x: 150, y: 90 };
const SIT = [1650, 905], COAT_AT = [1850, 915], PACK_AT = [1500, 905];
const camLerp = (a, b, k) => ({ z: lerp(a.z, b.z, k), x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });

// ---------------------------------------------------------------- painting the places (two moods)
function paintMood(m, seed) {
  const Q = {};
  Q.sky = layer((g) => paintSky(g, m, 3, { clouds: false }));
  const front = canvas(LW, LH), fg = front.getContext('2d'); fg.translate(M, MY);
  Q.land = layer((g) => { paintLand(g, m); paintLaneAndWalls(g, fg, m, SPLIT); });
  granulate(Q.land.getContext('2d'), LW, LH, 0.2, 5);
  Q.front = front;
  Q.clouds = CLOUDS.map(([cx, cy, cw], i) => ({ cx, cy, s: cloudSprite(m, cx, cy, cw, 150 + i * 13) }));
  Q.tree = appleTree(m);
  return Q;
}
// the lane as a walkable path: points far -> near, with the "ground distance" so he walks at an even pace
let PATH;
function lanePath() {
  const pts = smooth(LANE, false, 12), out = [];
  let d = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; d += Math.hypot(x1 - x0, (y1 - y0) / 0.35) / (laneW((y0 + y1) / 2) / 270); }
    out.push({ x: pts[i][0], y: pts[i][1], d });
  }
  return out;
}
// where on the lane is the traveller after walking `d` (ground distance)? returns x, y, scale, facing
function onLane(d) {
  let i = 1; while (i < PATH.length - 1 && PATH[i].d < d) i++;
  const a = PATH[i - 1], b = PATH[i], k = clamp((d - a.d) / ((b.d - a.d) || 1));
  const x = lerp(a.x, b.x, k), y = lerp(a.y, b.y, k);
  let j = i; while (j < PATH.length - 1 && Math.abs(PATH[j].x - a.x) < 4) j++;
  return { x, y, sc: laneW(y) / 270, face: PATH[j].x >= a.x ? 1 : -1 };
}
let STOP_D, RATE = 26;   // the spot where he stands to face the wind
function findStop() { let best = PATH[0]; for (const p of PATH) if (Math.abs(p.y - 792) < Math.abs(best.y - 792)) best = p; return best.d; }

// ---------------------------------------------------------------- little creatures and things
function butterfly(g, x, y, t, col, s = 1) {
  const f = 0.25 + 0.75 * Math.abs(Math.sin(t * 13));
  g.save(); g.translate(x, y); g.scale(s, s); g.rotate(Math.sin(t * 2) * 0.2);
  for (const sd of [-1, 1]) {
    g.save(); g.scale(sd * f, 1);
    g.fillStyle = rgba(col, 0.92); g.beginPath(); g.ellipse(8, -6, 10, 8, -0.5, 0, 7); g.fill(); g.beginPath(); g.ellipse(6, 6, 7, 5, 0.5, 0, 7); g.fill();
    g.fillStyle = rgba('#ffffff', 0.5); g.beginPath(); g.arc(9, -7, 2.5, 0, 7); g.fill();
    g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1; g.beginPath(); g.ellipse(8, -6, 10, 8, -0.5, 0, 7); g.stroke(); g.beginPath(); g.ellipse(6, 6, 7, 5, 0.5, 0, 7); g.stroke();
    g.restore();
  }
  g.fillStyle = INK; g.beginPath(); g.ellipse(0, 0, 2, 8, 0, 0, 7); g.fill();
  g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -7); g.quadraticCurveTo(-3, -13, -5, -14); g.moveTo(0, -7); g.quadraticCurveTo(3, -13, 5, -14); g.stroke();
  g.restore();
}
function bee(g, x, y, t, s = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const f = Math.abs(Math.sin(t * 40));
  g.fillStyle = `rgba(255,255,255,${0.45 + 0.3 * f})`; g.beginPath(); g.ellipse(-2, -8, 5, 7 * (0.6 + 0.4 * f), -0.4, 0, 7); g.fill(); g.beginPath(); g.ellipse(4, -8, 5, 7 * (0.6 + 0.4 * f), 0.4, 0, 7); g.fill();
  g.fillStyle = '#e8b030'; g.beginPath(); g.ellipse(0, 0, 9, 6.5, 0, 0, 7); g.fill();
  g.fillStyle = '#3a2a20'; for (const x0 of [-3, 2]) { g.fillRect(x0, -6, 2.4, 12); }
  g.beginPath(); g.arc(8, -1, 3.4, 0, 7); g.fill();
  g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1; g.beginPath(); g.ellipse(0, 0, 9, 6.5, 0, 0, 7); g.stroke();
  g.restore();
}
// a robin on a branch: bobs, and sings little notes
function robin(g, x, y, t, s, singing, ph = 0) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const bob = Math.max(0, Math.sin(t * 3 + ph)) * 3, open = singing ? Math.max(0, Math.sin(t * 9 + ph)) : 0;
  g.strokeStyle = rgba(INK, 0.8); g.lineWidth = 1.4; g.beginPath(); g.moveTo(-2, 10); g.lineTo(-3, 18); g.moveTo(4, 10); g.lineTo(5, 18); g.stroke();
  g.fillStyle = '#8a6a4a'; g.beginPath(); g.moveTo(-14, 2); g.lineTo(-26, -2 + Math.sin(t * 4 + ph) * 2); g.lineTo(-24, 6); g.closePath(); g.fill();
  g.fillStyle = '#9a7656'; g.beginPath(); g.ellipse(0, 0, 16, 13, 0, 0, 7); g.fill();
  g.fillStyle = '#d8643a'; g.beginPath(); g.ellipse(6, 2, 10, 10, 0, 0, 7); g.fill();
  g.save(); g.translate(8, -12 - bob * 0.3); g.rotate(-open * 0.3);
  g.fillStyle = '#9a7656'; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.fill();
  g.fillStyle = '#d8643a'; g.beginPath(); g.arc(4, 4, 6, 0, 7); g.fill();
  g.fillStyle = '#e0b060'; g.beginPath(); g.moveTo(8, -2); g.lineTo(15, -1 - open * 3); g.lineTo(8, 1); g.closePath(); g.fill(); g.beginPath(); g.moveTo(8, 1); g.lineTo(14, 2 + open * 3); g.lineTo(8, 3); g.closePath(); g.fill();
  g.fillStyle = '#1a120c'; g.beginPath(); g.arc(3, -2, 2.2, 0, 7); g.fill(); g.fillStyle = '#ffffff'; g.beginPath(); g.arc(2.4, -2.8, 0.8, 0, 7); g.fill();
  g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1.1; g.beginPath(); g.arc(0, 0, 9, 0, 7); g.stroke();
  g.restore();
  g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, 0, 16, 13, 0, 0, 7); g.stroke();
  g.restore();
  if (singing) { // notes drifting up
    g.save(); g.font = '30px "Fell", serif'; g.fillStyle = INK;
    for (let k = 0; k < 3; k++) { const p = ((t * 0.45 + k / 3 + ph) % 1); g.globalAlpha = Math.sin(p * Math.PI) * 0.6; g.fillText(k % 2 ? '♫' : '♪', x + 20 * s + p * 50 + Math.sin(p * 7) * 8, y - 30 * s - p * 90); }
    g.restore();
  }
}
// leaves torn off in the gale, tumbling across to the left
function leafStorm(g, t, k, area, seed = 3) {
  if (k <= 0.01) return;
  const n = Math.round(26 * k);
  for (let i = 0; i < n; i++) {
    const sp = 500 + noise1(i, seed) * 300, span_ = area.x1 - area.x0 + 400;
    const x = area.x0 - 200 + ((t * sp + (noise1(i * 3, seed) + 1) * span_) % span_);
    const y = area.y0 + (noise1(i * 5, seed) * 0.5 + 0.5) * (area.y1 - area.y0) + Math.sin(t * 3 + i) * 40;
    g.save(); g.translate(x, y); g.rotate(t * (4 + (i % 3)) + i); g.scale(1, Math.sin(t * 6 + i)); drawSprite(g, LEAVES[i % LEAVES.length], Math.min(1, k * 1.5)); g.restore();
  }
}
// grass in the near corners that bows in the wind
function fgGrass(g, t, bend, seed = 7) {
  const r = rng(seed);
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const side = i % 2, x = side ? r.range(1450, 2000) : r.range(-80, 520), y = r.range(1010, 1110), h = r.range(50, 110);
    const b = -bend * (0.6 + r() * 0.4) + Math.sin(t * (1.5 + bend * 6) + i) * (0.05 + bend * 0.12);
    g.strokeStyle = i % 4 === 0 ? rgba('#3a2c24', 0.6) : rgba(['#7f9068', '#93a274', '#6a7a52'][i % 3], 0.9); g.lineWidth = i % 4 === 0 ? 1.2 : 2.6;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.sin(b) * h * 0.5, y - h * 0.55, x + Math.sin(b * 1.6) * h, y - h * Math.cos(b * 1.2)); g.stroke();
  }
  g.restore();
}

// ---------------------------------------------------------------- the world, drawn in layers
// o: mood k (0 cold .. 1 warm), wind strength, tree bend, flower opening, sun/wind actors, actors (traveller), extras
function world(g, t, c, o = {}) {
  const k = o.warm ?? 0, cold = P.cold, warm = P.warm;
  S.paperBg(g);
  const both = (fn) => { if (k < 1) { g.globalAlpha = 1; fn(cold); } if (k > 0) { g.globalAlpha = k; fn(warm); } g.globalAlpha = 1; };
  both((Q) => drawLayer(g, c, Q.sky, 0.3));
  // drifting clouds (the wind pushes them along)
  const drift = o.cloudDrift ?? -t * 4;
  both((Q) => { const a = g.globalAlpha; cam(g, c, 0.4); for (const [i, cl] of Q.clouds.entries()) { g.save(); g.translate(((-drift * (1 + i * 0.15) + cl.cx + 400) % 2700 + 2700) % 2700 - 400 - cl.cx, 0); g.globalAlpha = a * (o.cloudA ?? 1); drawSprite(g, cl.s); g.restore(); } });
  if (o.behindHills) { cam(g, c, 1); o.behindHills(g); }
  both((Q) => drawLayer(g, c, Q.land, 1));
  cam(g, c, 1);
  drawFlowers(g, k > 0.5 ? MOOD.warm : MOOD.cold, FLOWERS, o.open ?? 0, t, (o.wind || 0) * 0.5);
  both((Q) => { const a = g.globalAlpha; cam(g, c, 1); g.globalAlpha = a; drawAppleTree(g, Q.tree, t, -(o.bend ?? 0), (gg, sp) => drawSprite(gg, sp)); });
  cam(g, c, 1);
  if (o.actors) o.actors(g);
  both((Q) => drawLayer(g, c, Q.front, 1));
  if (o.sky) { cam(g, c, 1); o.sky(g); }
  cam(g, c, 1);
  if (o.after) o.after(g);
}
function grade(g, o = {}) {
  sunlight(g, o.sun ?? 0, o.sunset || 0);
  if (o.sunset) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(255,160,150,${0.5 * o.sunset})`; g.fillRect(0, 0, W, H); g.restore(); }
  if (o.grey) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'soft-light'; g.fillStyle = `rgba(120,135,160,${0.35 * o.grey})`; g.fillRect(0, 0, W, H); g.restore(); }
  nightGrade(g, o.night || 0);
}
// cross-fade between two drawings of the same character (a change of pose or clothes)
function blend(g, k, drawA, drawB) {
  if (k <= 0) return drawA(g);
  if (k >= 1) return drawB(g);
  const b = BUF.getContext('2d');
  for (const [fn, a] of [[drawA, 1 - k], [drawB, k]]) {
    b.setTransform(1, 0, 0, 1, 0, 0); b.clearRect(0, 0, W, H); b.setTransform(g.getTransform()); fn(b);
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = a; g.drawImage(BUF, 0, 0); g.restore();
  }
}
const TR = (g, x, y, sc, face, st) => { g.save(); g.translate(x, y); g.scale(sc * face, sc); tr.draw(g, st); g.restore(); };
const WIND = (g, x, y, sc, st) => { g.save(); g.translate(x, y); g.scale(-sc, sc); wind.draw(g, st); g.restore(); }; // he faces right, blowing to the right
const SUN = (g, x, y, sc, st) => { g.save(); g.translate(x, y); g.scale(sc, sc); sun.draw(g, st); g.restore(); };

// ---------------------------------------------------------------- scenes
function drawTitle(g, t) {
  S.paperBg(g); g.fillStyle = 'rgba(250,214,160,0.18)'; g.fillRect(0, 0, W, H);
  cam(g, { z: 1 + t * 0.004, x: 0, y: 0 }, 1);
  g.save(); g.textAlign = 'center'; g.fillStyle = INK;
  const a1 = span(t, 0.6, 2.4), a2 = span(t, 1.4, 3.2), a3 = span(t, 2.4, 4.0);
  g.globalAlpha = a1 * 0.9; g.font = '110px "Fell"'; g.fillText('The North Wind', 960, 470 + (1 - a1) * 10);
  g.globalAlpha = a2 * 0.9; g.font = 'italic 100px "Fell"'; g.fillText('& the Sun', 960, 600 + (1 - a2) * 10);
  g.globalAlpha = a3 * 0.75; g.font = 'italic 40px "Fell"'; g.fillText('an Aesop’s fable, for sleepy little ones', 960, 690);
  g.restore();
  g.save(); g.globalAlpha = span(t, 0.3, 1.8); WIND(g, 520, 260, 0.5, { t, eyes: 1 - S.blink(t, 6), smile: 0.6, gust: 0.2 }); SUN(g, 1400, 270, 0.6, { t, glow: 0.4, eyes: 1 - S.blink(t, 2) }); g.restore();
}

// the Sun and the Wind argue; then we look down and see the traveller on the lane
function drawSky(g, t) {
  const n03 = line('n03'), w01 = line('w01'), w02 = line('w02'), s01 = line('s01'), s02 = line('s02');
  const down = ease(span(t, n03.start + 0.5, n03.start + 6));
  const c = camLerp({ z: SKYCAM.z + Math.sin(t * 0.1) * 0.01, x: Math.sin(t * 0.07) * 20, y: SKYCAM.y }, { z: 1, x: 0, y: 0 }, down);
  const boast = S.mood(t, 'w01', 0.2, 0.6), laugh = S.mood(t, 'w02', 0.2, 0.8), amused = S.mood(t, 's01', 0.3, 1.2);
  const walkD = Math.max(0, t - (n03.start + 1)) * RATE;   // ground distance walked
  world(g, t, c, {
    warm: 0, wind: 0.05, bend: 0.05, open: 0,
    actors: (g2) => { if (t > n03.start) { const p = onLane(Math.min(walkD, STOP_D)); TR(g2, p.x, p.y, p.sc, p.face, { t, walk: t * 1.3, smile: 0.6 }); } },
    sky: (g2) => {
      SUN(g2, 1010, 210, 0.75, { t, glow: 0.4, eyes: 1 - S.blink(t, 2), mouth: Math.max(say('s01', t), say('s02', t)) * 0.9, smile: 0.7 + amused * 0.2, browUp: amused * 0.5 });
      WIND(g2, 560, 230, 0.62 * (1 + boast * 0.08 + Math.abs(Math.sin(t * 10)) * laugh * 0.03), { t, eyes: 1 - S.blink(t, 6), mouth: Math.max(say('w01', t), say('w02', t)) * 0.9, smile: 0.6 + boast * 0.3, browUp: boast * 0.8, happy: laugh > 0.5 && say('w02', t) < 0.3, gust: 0.25 + boast * 0.3 });
    },
  });
  grade(g, { grey: 0.6 });
}

// the Wind blows and blows
function drawBlow(g, t) {
  const n04 = line('n04'), n05 = line('n05'), t01 = line('t01'), n06 = line('n06'), n07 = line('n07');
  const inhale = span(t, n04.start + 0.6, n04.start + 2.2) * (1 - span(t, n04.start + 2.4, n04.start + 2.6));
  const blowT = n04.start + 2.4;
  const harder = 0.18 * span(t, n06.start + 1.5, n06.start + 2.2) + 0.18 * span(t, n06.start + 2.6, n06.start + 3.3);
  const tiredK = span(t, n07.start + 1, n07.end + 0.5);
  let strength = 0.62 * span(t, blowT, blowT + 0.8) + harder;
  strength *= 1 - ease(span(t, n07.start + 1.5, n07.end - 0.5)) * 0.85;
  const huff = t > n07.start + 1.5 && t < n07.end - 1 ? 0.5 + 0.5 * Math.sin(t * 5) : 0;
  const puff = t < n07.start + 1.5 ? span(t, blowT - 0.2, blowT + 0.2) : huff * (1 - tiredK);
  const gaveUp = span(t, n07.end - 1.2, n07.end + 0.2);
  const s = strength * (1 - gaveUp);
  // the camera pushes in as the gale grows, with a little shake
  const push1 = ease(span(t, n04.start + 3, n05.start + 3)), push2 = ease(span(t, n06.start, n06.end));
  const shake = s * 4;
  let c = camLerp({ z: 1, x: 0, y: 0 }, { z: 1.3, x: -310, y: 20 }, push1);
  c = camLerp(c, { z: 1.42, x: -260, y: 50 }, push2);
  c.x += Math.sin(t * 23) * shake; c.y += Math.cos(t * 19) * shake;
  // the traveller: walks on into the wind until he reaches his spot, then braces himself
  const walkD = Math.max(0, t - (line('n03').start + 1)) * RATE, there = walkD >= STOP_D;
  const p = onLane(Math.min(walkD, STOP_D));
  // the gust snatches his hat: it tumbles up and back, his paw shoots up and catches it, and he pulls it back on
  const tA = n05.start + 3.5, catchT = tA + 0.55, backT = tA + 0.85;
  let hatFly = null;
  if (t > tA && t < backT + 0.6) {
    const at = (tt) => { const e = clamp((tt - tA) / 0.55); return { dx: -95 * e, dy: -110 * Math.sin(e * Math.PI / 2) + 20 * e * e, rot: -1.5 * e }; };
    const f = at(Math.min(t, catchT)), b = ease(clamp((t - backT) / 0.6));
    const wob = t < catchT ? Math.sin(t * 25) * 0.12 : 0;
    hatFly = { dx: f.dx * (1 - b), dy: f.dy * (1 - b), rot: (f.rot + wob) * (1 - b) };
  }
  const hatReach = ease(span(t, tA + 0.12, catchT)) * (1 - span(t, n07.end + 0.8, n07.end + 1.6));
  const hud = Math.max(0.35 * span(t, blowT, blowT + 1.5), span(t, n06.start + 3.5, n06.start + 5)) * (1 - 0.6 * span(t, n07.end, n07.end + 1.5));
  const shiver = s * Math.sin(t * 30) * 1.5;
  world(g, t, c, {
    warm: 0, wind: s, bend: 0.05 + s, open: 0, cloudDrift: -t * 4 - Math.max(0, t - blowT) * 60 * Math.min(1, s * 2),
    actors: (g2) => TR(g2, p.x + shiver, p.y, p.sc, p.face, { t, walk: there ? null : t * (1.3 - s * 0.6), huddle: hud, wind: s, hatFly, hatReach, mouth: say('t01', t) * 0.9,
      browUp: S.mood(t, 't01') * 0.8, eyes: (1 - S.blink(t, 4)) * (1 - 0.5 * s), smile: 0.4 - s * 0.4 }),
    sky: (g2) => {
      WIND(g2, 420, 300, 0.58 * (1 + inhale * 0.14 + puff * 0.04 - tiredK * 0.1), { t, puff: Math.max(puff, inhale * 0.6), eyes: inhale > 0.3 ? 0 : 1 - S.blink(t, 6), tired: tiredK, gust: 0.3 + s * 0.7, smile: 0.4 - tiredK * 0.6, browUp: inhale * 0.6 });
      if (s > 0.01) { cam(g2, c, 0); windStreams(g2, t, s, { x0: 380, x1: 2100, y0: 300, y1: 900 }, { n: Math.round(6 + 8 * s), seed: 5, dir: 1 }); leafStorm(g2, t, Math.max(0, s - 0.3) * 1.4, { x0: 300, x1: 2100, y0: 300, y1: 900 }); }
    },
    after: (g2) => { cam(g2, c, 1.15); fgGrass(g2, t, -s * 0.8); },
  });
  grade(g, { grey: 0.8 });
}

// the Sun's turn: the clouds part, everything warms, the flowers open
function drawShine(g, t) {
  const s03 = line('s03'), n08 = line('n08'), n09 = line('n09'), t02 = line('t02'), n10 = line('n10');
  const rise = ease(span(t, s03.start - 2.5, s03.start + 0.4));
  const part = ease(span(t, n08.start + 0.5, n08.start + 5));
  const k = ease(span(t, n08.start + 1, n08.end + 0.5));
  const open = span(t, n09.start, n09.start + 5);
  const close = ease(span(t, t02.start - 2.5, t02.start));
  const c = camLerp({ z: 1.0 + 0.04 * Math.sin(t * 0.1), x: 0, y: 20 }, { z: 1.35, x: -120, y: 40 }, close);
  const p = onLane(STOP_D);
  const off = span(t, n10.start + 3.1, n10.start + 3.7);          // the coat comes off
  const wipe = t > t02.start - 0.3 && t < t02.end + 0.3;
  const st = { t, eyes: 1 - S.blink(t, 4), mouth: say('t02', t) * 0.9, smile: 0.5 + 0.4 * k, happy: S.mood(t, 't02') > 0.5 && say('t02', t) < 0.2 && t < t02.start + 1.4,
    huddle: 0.25 * (1 - k), wipe: wipe ? 1 : 0, unbutton: t > n10.start + 0.3 && t < n10.start + 3.2, browUp: S.mood(t, 't02') * 0.5 };
  world(g, t, c, {
    warm: k, wind: 0, bend: 0.03, open, cloudA: 1,
    actors: (g2) => blend(g2, off, (b) => TR(b, p.x, p.y, p.sc, p.face, st), (b) => TR(b, p.x, p.y, p.sc, p.face, { ...st, coatOff: true, carryCoat: true, happy: true, smile: 0.8, unbutton: false })),
    sky: (g2) => {
      // the Sun rises from behind a cloud bank, which then drifts away
      SUN(g2, 1010, lerp(380, 220, rise) + 60 * close, 0.75, { t, glow: 0.2 + 0.8 * k, eyes: 1 - S.blink(t, 2), mouth: say('s03', t) * 0.9, smile: 0.75 });
      g2.save(); g2.translate(part * 900, part * 40); g2.globalAlpha = 1 - span(t, n08.start + 3, n08.start + 6); drawSprite(g2, P.coverCold, 1 - k); drawSprite(g2, P.coverWarm, k); g2.restore();
      // the Wind, tired out, drifts off into the corner
      const away = ease(span(t, s03.start, n08.start + 6));
      g2.save(); g2.globalAlpha = 1 - span(t, n08.start + 4, n08.start + 7); WIND(g2, lerp(400, 120, away), lerp(230, 130, away), 0.58 * (1 - away * 0.4), { t, tired: 1, eyes: 0.4, smile: 0, gust: 0.1 }); g2.restore();
      // bees and butterflies come out
      const life = span(t, n09.start + 2, n09.start + 4);
      if (life > 0) {
        g2.save(); g2.globalAlpha = life;
        for (let i = 0; i < 5; i++) butterfly(g2, 260 + i * 330 + Math.sin(t * 0.6 + i * 2) * 120, 700 + Math.sin(t * 0.9 + i) * 80, t + i, ['#e8a0b0', '#f0c050', '#a8c0e8', '#f4ead8', '#c8a0d8'][i], 1.7);
        for (let i = 0; i < 6; i++) bee(g2, 200 + i * 300 + Math.sin(t * 1.7 + i * 3) * 70, 780 + Math.cos(t * 2.3 + i) * 50, t + i, 1.5);
        g2.restore();
      }
    },
  });
  grade(g, { sun: k * 0.6, grey: 0.8 * (1 - k) });
  if (k > 0) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k * 0.03; g.fillStyle = '#ffe0a0'; g.fillRect(0, 0, W, H); g.restore(); }
}

// under the apple tree
function drawTree(g, t, o = {}) {
  const n10 = line('n10'), n11 = line('n11');
  const t0 = n10.end + 0.2 - 1.6;           // walking in during the dissolve
  const arrive = n11.start + 0.2, layT = arrive + 0.2, sitT = arrive + 1.3;
  const c = { z: TREECAM.z + Math.sin(t * 0.13) * 0.01, x: TREECAM.x, y: TREECAM.y };
  const x = lerp(1180, SIT[0], clamp((t - t0) / (arrive - t0)));
  const laid = span(t, layT, layT + 0.6), sit = span(t, sitT, sitT + 0.35);
  const birds = t > n11.start + 3;
  world(g, t, o.cam || c, {
    warm: 1, wind: o.breeze || 0, bend: 0.03 + (o.breeze || 0) * 0.4, open: 1,
    actors: (g2) => {
      if (laid > 0) { g2.save(); g2.globalAlpha = laid; g2.translate(...COAT_AT); tr.drawCoatLaid(g2); g2.restore(); g2.save(); g2.globalAlpha = laid; g2.translate(...PACK_AT); g2.scale(0.9, 0.9); tr.drawPackLaid(g2); g2.restore(); }
      const standing = (b) => TR(b, x, 905, 1, 1, { t, walk: t < arrive ? t * 1.6 : null, coatOff: true, carryCoat: laid < 0.5, happy: true, smile: 0.8 });
      const sitting = (b) => { b.save(); b.translate(...SIT); tr.drawSit(b, { t, smile: 0.85, eyes: (1 - S.blink(t, 4)) * (o.eyes ?? 0.9), breath: Math.sin(t * 1.2), sleep: o.sleep || 0 }); b.restore(); };
      blend(g2, sit, standing, sitting);
    },
    sky: (g2) => {
      if (birds || o.birds) { robin(g2, 1395, 545, t, 1.1, true, 0); robin(g2, 1750, 505, t, 1.0, Math.sin(t * 0.7) > -0.3, 0.4); }
      for (let i = 0; i < 3; i++) butterfly(g2, 1300 + i * 220 + Math.sin(t * 0.5 + i * 2) * 100, 760 + Math.sin(t * 0.8 + i) * 60, t + i, ['#e8a0b0', '#f0c050', '#a8c0e8'][i], 1.2);
      if (o.breeze) { cam(g2, o.cam || c, 0); windStreams(g2, t, o.breeze, { x0: -100, x1: 2100, y0: 200, y1: 800 }, { n: 4, seed: 9, items: true, alpha: 0.6, dir: 1 }); }
    },
  });
  grade(g, { sun: 0.6 });
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.03; g.fillStyle = '#ffe0a0'; g.fillRect(0, 0, W, H); g.restore();
  cam(g, o.cam || c, 1); motes(g, t, 24, 11, { x0: 900, x1: 2000, y0: 400, y1: 900 });
}

// the lesson, up in the sky
function drawLesson(g, t) {
  const w03 = line('w03'), s04 = line('s04');
  const c = { z: SKYCAM.z, x: Math.sin(t * 0.07) * 20, y: SKYCAM.y };
  const glad = span(t, s04.end - 1, s04.end + 0.5);
  world(g, t, c, {
    warm: 1, open: 1, bend: 0.03,
    sky: (g2) => {
      SUN(g2, 1010, 210, 0.75, { t, glow: 0.8, eyes: 1 - S.blink(t, 2), mouth: say('s04', t) * 0.9, smile: 0.8 });
      WIND(g2, 560, 240, 0.55, { t, eyes: (1 - S.blink(t, 6)) * 0.8, mouth: say('w03', t) * 0.9, smile: 0.4 + glad * 0.5, happy: glad > 0.5, tired: 0.25 * (1 - glad), gust: 0.15, browUp: S.mood(t, 'w03') * 0.6 });
    },
  });
  grade(g, { sun: 0.6 });
}

// goodnight: a gentle breeze, the sunset, the moon and the stars
function drawNight(g, t) {
  const n12 = line('n12'), n13 = line('n13'), n14 = line('n14'), n15 = line('n15'), END = S.TL.duration;
  const out = ease(span(t, n13.start, n13.start + 6));
  const zoomIn = ease(span(t, n15.start - 2, END - 8));
  let c = camLerp(TREECAM, DUSKCAM, out);
  c = camLerp(c, { z: 1.4, x: 350, y: 160 }, zoomIn);
  const sunset = span(t, n13.start, n13.start + 7), night = span(t, n13.end - 1, n14.start + 4);
  const sleep = span(t, n13.start + 5.5, n13.start + 8.5);
  const sunY = lerp(270, 470, ease(span(t, n13.start + 1, n14.start + 1)));
  const moonY = lerp(300, 175, ease(span(t, n14.start - 1, n14.end + 4))), moonA = night * span(t, n14.start - 1, n14.start + 2.5);
  world(g, t, c, {
    warm: 1, open: 1 - night * 0.6, bend: 0.06, wind: 0.08,
    behindHills: (g2) => { if (sunY < 470) SUN(g2, 1120, sunY, 0.6, { t, glow: 0.6, eyes: 1 - sunset * 0.7, set: sunset, smile: 0.7 }); },
    actors: (g2) => {
      g2.save(); g2.translate(...COAT_AT); tr.drawCoatLaid(g2); g2.restore(); g2.save(); g2.translate(...PACK_AT); g2.scale(0.9, 0.9); tr.drawPackLaid(g2); g2.restore();
      g2.save(); g2.translate(...SIT); tr.drawSit(g2, { t, smile: 0.8, eyes: (1 - S.blink(t, 4)) * (0.85 - sunset * 0.3), breath: Math.sin(t * (1.2 - sleep * 0.4)), sleep }); g2.restore();
    },
    sky: (g2) => {
      if (t < n13.start + 3) { robin(g2, 1395, 545, t, 1.1, t < n12.end, 0); }
      // the Wind, a soft little breeze now, dozing in the sky
      const wa = span(t, n13.start + 1, n13.start + 4);
      if (wa > 0) { g2.save(); g2.globalAlpha = wa * 0.95; WIND(g2, 600, 245, 0.32, { t, eyes: 0, smile: 0.7, gust: 0.05 }); g2.restore(); }
      if (t < n13.start + 2) { cam(g2, c, 0); windStreams(g2, t, 0.18 * (1 - span(t, n13.start, n13.start + 2)), { x0: -100, x1: 2100, y0: 200, y1: 800 }, { n: 4, seed: 9, alpha: 0.6, dir: 1 }); }
    },
  });
  grade(g, { sun: 0.6 * (1 - night), sunset: sunset * (1 - night * 0.5), night: night * 0.9 });
  if (night > 0) {
    cam(g, c, 1); moon(g, 880, moonY, 34, moonA);
    cam(g, c, 0.15); stars(g, t, night, n14.start, { x0: 100, x1: 1400, y0: 40, y1: 200 });
        fireflies(g, t, 26, { x0: 600, x1: 2000, y0: 500, y1: 1000 }, 41, night);
    zzz(g, t, SIT[0] + 30, SIT[1] - 150, n14.start, END + 10);
  }
  const a = span(t, n15.end + 2.5, n15.end + 5) * (1 - span(t, END - 12, END - 7));
  if (a > 0) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.textAlign = 'center'; g.fillStyle = `rgba(250,238,210,${0.85 * a})`; g.font = 'italic 76px "Fell"'; g.fillText('Sweet dreams', 700, 360); g.font = 'italic 34px "Fell"'; g.fillStyle = `rgba(250,238,210,${0.6 * a})`; g.fillText('the end', 700, 415); g.restore(); }
}

// ---------------------------------------------------------------- entry points
let SCENES;
window.FABLE = {
  async setup(timeline) {
    S = makeStage(timeline);
    await S.setup(document.getElementById('c'));
    BUF = canvas(W, H, false);
    wind = makeWind(1.2); sun = makeSun(1.2); tr = makeTraveller(1.6);
    P.cold = paintMood(MOOD.cold, 1); P.warm = paintMood(MOOD.warm, 2);
    P.coverCold = cloudSprite(MOOD.cold, 1020, 390, 300, 777); P.coverWarm = cloudSprite(MOOD.warm, 1020, 390, 300, 777);
    LEAVES = ['#d89a3a', '#8fa252', '#c86a3a', '#b8a050'].map((col, i) => sprite({ x0: -16, y0: -16, x1: 16, y1: 16, w: 32, h: 32 }, 1, (g) => leaf(g, 0, 0, 13, 0, col), { granulate: false }));
    FLOWERS = flowerSpots(31);
    PATH = lanePath(); STOP_D = findStop(); RATE = STOP_D / (line('n05').start - line('n03').start - 1);
    const n10 = line('n10');
    SCENES = [
      [0, drawTitle], [5.4, drawSky], [line('n04').start - 1.4, drawBlow], [line('s03').start - 1.6, drawShine],
      [n10.end + 0.2 - 1.6 + 0.0, drawTree], [line('w03').start - 1.4, drawLesson],
      [line('n12').start - 1.4, (g, t) => drawTree(g, t, { breeze: 0.2, birds: true, eyes: 0.7 })],
      [line('n13').start - 0.01, drawNight],
    ];
  },
  frame(t) { S.frame(t, SCENES); },
};
