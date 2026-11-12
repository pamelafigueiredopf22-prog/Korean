// The hills, the winding road and the apple tree, painted in two moods: 'cold' (the Wind's grey-blue day)
// and 'warm' (the Sun's golden day). Painters draw in the current ctx coordinates (a 1920x1080 page).
import { wash, pool, smooth, ellipse, fluffy, rng, rgba, shade, tint, mix, strokes, noise1, glaze, penLine, sprite } from '../../engine/watercolor.js';
import { PAL, foliage, trunk, grass, flower, hills, cloud, plant } from '../../engine/scenery.js';

export const MOOD = {
  cold: { skyTop: '#9fb0c4', skyMid: '#c9d2da', skyLow: '#e2e2dc', far: '#9aa4a8', mid: '#93a08a', ground: '#a8ad8a', ground2: '#8c9776', road: '#d8ccb0', haze: '#d6dbdc',
    leaves: ['#7f8f62', '#6a7a50', '#94a070', '#a89a5a'], flowers: ['#c8b8c4', '#d8d0c0'], cloud: '#e8ecf0' },
  warm: { skyTop: '#a8cce0', skyMid: '#f2e2b8', skyLow: '#f8e4b0', far: '#c4bf92', mid: '#b2b678', ground: '#c4b878', ground2: '#a2aa6c', road: '#ecd8a8', haze: '#f0dcb0',
    leaves: [PAL.olive, PAL.moss, PAL.sage, '#a8b45c'], flowers: [PAL.pink, '#f2e0a0', '#e8a0b0', '#f8f0e0', '#c8a0d0'], cloud: '#fbeedc' },
};

export const ROAD = [[1180, 600], [1060, 640], [1180, 700], [960, 780], [700, 870], [520, 1000], [380, 1120]];
export const TREE = { x: 1560, ground: 905 };

function roadShape(o = 0) {
  const L = [], R = [];
  ROAD.forEach(([x, y], i) => { const w = 10 + (y - 600) * 0.52 + o; L.push([x - w, y]); R.push([x + w, y]); });
  return smooth(L.concat(R.reverse()));
}

export function paintSky(g, m) {
  const grd = g.createLinearGradient(0, -100, 0, 760);
  grd.addColorStop(0, m.skyTop); grd.addColorStop(0.6, m.skyMid); grd.addColorStop(1, m.skyLow);
  g.fillStyle = grd; g.fillRect(-300, -300, 2520, 1600);
  for (let i = 0; i < 6; i++) pool(g, 200 + i * 330, 160 + noise1(i, 3) * 160, 300, 120, tint(m.skyTop, 0.4), 0.25);
}
export function paintLand(g, m, seed = 11) {
  hills(g, 560, 60, m.far, { seed, opacity: 0.6, bumps: 3 });
  for (let i = 0; i < 12; i++) { // little far-off trees, softened by the distance
    const x = -40 + i * 175 + noise1(i, 2) * 60, y = 556 + noise1(i, 5) * 24, c = mix(m.leaves[i % 2], m.haze, 0.45);
    g.save(); g.strokeStyle = rgba(mix('#6a5040', m.haze, 0.5), 0.7); g.lineWidth = 5; g.beginPath(); g.moveTo(x, y + 30); g.lineTo(x, y); g.stroke(); g.restore();
    wash(g, fluffy(x, y - 8, 44, 34, 6, 0.18, 300 + i), { color: c, opacity: 0.8, seed: 310 + i, bleed: 0.04, layers: 12 });
    pool(g, x - 12, y - 20, 20, 12, '#ffffff', 0.25);
  }
  hills(g, 610, 46, m.mid, { seed: seed + 1, opacity: 0.6, bumps: 5 });
  // the near meadow
  wash(g, smooth([[-350, 640], [500, 620], [1100, 650], [2300, 630], [2300, 1400], [-350, 1400]]), { color: m.ground, opacity: 0.92, seed: seed + 2, bleed: 0.02, layers: 24 });
  wash(g, smooth([[-350, 820], [800, 790], [2300, 820], [2300, 1400], [-350, 1400]]), { color: m.ground2, opacity: 0.5, seed: seed + 3, bleed: 0.03, layers: 20 });
  const r = rng(seed + 4);
  for (let i = 0; i < 30; i++) { const x = r.range(-100, 2020), y = r.range(650, 1100), s = r.range(60, 180); pool(g, x, y, s, s * 0.3, r() < 0.5 ? shade(m.ground2, 0.35) : tint(m.ground, 0.5), r.range(0.1, 0.22)); }
  // the winding road, with soft wheel ruts and a pebbly edge
  wash(g, roadShape(), { color: m.road, opacity: 0.95, seed: seed + 5, under: true, bleed: 0.02 });
  wash(g, roadShape(-6), { color: tint(m.road, 0.35), opacity: 0.6, seed: seed + 6, edge: 0 });
  strokes(g, roadShape(-4), { color: shade(m.road, 0.3), count: 500, len: 10, width: 1, alpha: 0.25, seed: seed + 7, dir: () => 0.3, curve: 0.3 });
  penLine(g, roadShape().slice(0, 40), { color: shade(m.road, 0.55), w: 1.4, alpha: 0.4 });
  strokes(g, [[-350, 640], [2300, 640], [2300, 1400], [-350, 1400]], { color: shade(m.ground2, 0.3), count: 1100, len: 9, width: 1.1, alpha: 0.26, seed: seed + 8, dir: () => -Math.PI / 2, curve: 0.4 });
  const inRoad = (x, y) => { for (let i = 1; i < ROAD.length; i++) { const [x0, y0] = ROAD[i - 1], [x1, y1] = ROAD[i]; if (y >= y0 && y <= y1) { const k = (y - y0) / (y1 - y0 || 1), cx = x0 + (x1 - x0) * k; return Math.abs(x - cx) < 20 + (y - 600) * 0.55; } } return false; };
  for (let i = 0; i < 150; i++) { const x = r.range(-80, 2000), y = r.range(660, 1080); if (inRoad(x, y)) continue; grass(g, x, y, { seed: seed + 10 + i, h: 14 + (y - 640) * 0.08, n: 6, alpha: 0.55, colors: m.leaves }); }
  return inRoad;
}
// meadow flowers: open: 0 (closed buds) .. 1 (wide open). Returns spots so the story can animate them.
export function flowerSpots(seed = 31, inRoad = () => false) {
  const r = rng(seed), out = [];
  for (let i = 0; i < 70; i++) { const x = r.range(40, 1880), y = r.range(700, 1060); if (inRoad(x, y) || (x > 1380 && x < 1760 && y < 930)) { continue; } out.push({ x, y, c: i, s: 5 + (y - 700) * 0.018, ph: r() * 6 }); }
  return out;
}
export function drawFlowers(g, m, spots, open, t = 0, sway = 0) {
  for (const f of spots) {
    const col = m.flowers[f.c % m.flowers.length], st = 10 + f.s * 2;
    const bend = Math.sin(t * 2 + f.ph) * 0.06 + sway;
    g.save(); g.translate(f.x, f.y); g.rotate(bend);
    g.strokeStyle = rgba(PAL.moss, 0.75); g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, st); g.quadraticCurveTo(2, st / 2, 0, 0); g.stroke();
    const o = Math.max(0, Math.min(1, open * 1.2 - (f.ph / 6) * 0.2));
    if (o < 0.15) { g.fillStyle = rgba(shade(col, 0.15), 0.9); g.beginPath(); g.ellipse(0, -f.s * 0.3, f.s * 0.35, f.s * 0.7, 0, 0, 7); g.fill(); }
    else {
      for (let k = 0; k < 5; k++) { const a = k / 5 * Math.PI * 2 + f.ph; g.fillStyle = rgba(col, 0.88); g.beginPath(); g.ellipse(Math.cos(a) * f.s * 0.6 * o, Math.sin(a) * f.s * 0.6 * o, f.s * (0.3 + 0.35 * o), f.s * 0.28, a, 0, 7); g.fill(); }
      g.fillStyle = rgba('#e8a030', 0.95); g.beginPath(); g.arc(0, 0, f.s * 0.3, 0, 7); g.fill();
    }
    g.restore();
  }
}

// The apple tree, in pieces: the trunk (static), and crown clumps (each a sprite that can sway/bend).
export function appleTree(m, seed = 51) {
  const { x, ground } = TREE, r = rng(seed);
  const trunkS = sprite({ x0: x - 330, y0: ground - 560, x1: x + 330, y1: ground + 30, w: 660, h: 590 }, 1, (g) => {
    pool(g, x - 20, ground + 6, 300, 40, '#3a3020', 0.25);
    trunk(g, [[x, ground], [x - 10, ground - 120], [x + 8, ground - 240], [x - 6, ground - 330]], 86, 50, { seed: seed + 1, under: true });
    trunk(g, [[x - 4, ground - 260], [x - 110, ground - 340], [x - 220, ground - 400]], 44, 14, { seed: seed + 2, under: true });
    trunk(g, [[x + 4, ground - 270], [x + 120, ground - 350], [x + 230, ground - 400]], 42, 14, { seed: seed + 3, under: true });
    trunk(g, [[x - 4, ground - 320], [x - 20, ground - 420], [x, ground - 500]], 40, 12, { seed: seed + 4, under: true });
    trunk(g, [[x - 30, ground - 8], [x - 80, ground + 4]], 30, 6, { seed: seed + 5 }); trunk(g, [[x + 30, ground - 8], [x + 80, ground + 4]], 30, 6, { seed: seed + 6 });
  });
  const mass = sprite({ x0: x - 420, y0: ground - 720, x1: x + 420, y1: ground - 220, w: 840, h: 500 }, 1, (g) => {
    wash(g, fluffy(x, ground - 440, 310, 170, 9, 0.18, seed + 9), { color: shade(m.leaves[1], 0.35), opacity: 1, seed: seed + 10, under: true, bleed: 0.03 });
  });
  const clumps = [];
  const spots = [[-200, -420, 150], [200, -430, 150], [0, -520, 170], [-90, -390, 130], [110, -380, 130], [-290, -360, 100], [290, -360, 100], [0, -410, 140], [-150, -540, 120], [150, -540, 120]];
  for (const [i, [dx, dy, rr]] of spots.entries()) {
    const cx = x + dx, cy = ground + dy;
    const apples = [];
    for (let k = 0; k < 3; k++) apples.push([cx + r.range(-rr * 0.6, rr * 0.6), cy + r.range(-rr * 0.2, rr * 0.5)]);
    clumps.push({ cx, cy, ph: r() * 6, s: sprite({ x0: cx - rr * 1.15, y0: cy - rr, x1: cx + rr * 1.15, y1: cy + rr, w: rr * 2.3, h: rr * 2 }, 1, (g) => {
      foliage(g, cx, cy, rr, rr * 0.78, { seed: seed + 20 + i * 7, colors: m.leaves, blobs: 10, opacity: 1 });
      for (const [ax, ay] of apples) {
        const ap = ellipse(ax, ay, 13, 12, 18);
        wash(g, ap, { color: m === MOOD.cold ? '#a8544a' : '#c8443a', opacity: 0.95, seed: Math.round(ax + ay), under: true, layers: 10 });
        glaze(g, ap, ax - 4, ay - 5, 5, 4, '#ffe8d8', 0.75);
        penLine(g, ap, { closed: true, w: 1.1, alpha: 0.5 });
        g.strokeStyle = rgba('#5a4028', 0.8); g.lineWidth = 1.6; g.beginPath(); g.moveTo(ax, ay - 11); g.lineTo(ax + 2, ay - 17); g.stroke();
      }
    }) });
  }
  return { trunk: trunkS, mass, clumps };
}
// wind: bend 0..1 (leans the crown to the right), t for flutter
export function drawAppleTree(g, tree, t = 0, bend = 0, drawSprite) {
  drawSprite(g, tree.trunk);
  const { x, ground } = TREE;
  g.save(); g.translate(x, ground - 260); g.rotate(-bend * 0.06); g.translate(-bend * 36, 0); g.translate(-x, -(ground - 260)); drawSprite(g, tree.mass); g.restore();
  for (const c of tree.clumps) {
    const h = ground - c.cy, sw = Math.sin(t * (1 + bend * 5) + c.ph) * (0.01 + bend * 0.03);
    g.save(); g.translate(x, ground - 260); g.rotate(-bend * 0.06 * (h / 400) + sw); g.translate(c.cx - x, c.cy - (ground - 260)); g.translate(-bend * h * 0.1, 0); g.translate(-c.cx, -c.cy);
    drawSprite(g, c.s); g.restore();
  }
}
export function skyClouds(m, seed = 61) {
  return [[300, 200, 180, 44], [1000, 140, 220, 50], [1650, 230, 180, 42]].map(([x, y, w, h], i) => ({ x, y, s: sprite({ x0: x - w * 1.1, y0: y - h * 1.2, x1: x + w * 1.1, y1: y + h * 1.2, w: 2.2 * w, h: 2.4 * h }, 1, (g) => cloud(g, x, y, w, h, { seed: seed + i * 7, color: m.cloud, opacity: 0.6 }), { granulate: false }) }));
}
