// Story props: the hunters' rope net (falling, draped, nibbled through).
import { rng, rgba, noise1, smooth, path, wash, pencil, ellipse } from './watercolor.js';

const ROPE = '#8b6b45', ROPE_DARK = '#4a3226', ROPE_LIGHT = '#d9bf8f';

function rope(g, pts, w = 4) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = rgba(ROPE_DARK, 0.55); g.lineWidth = w + 2; path(g, pts, false); g.stroke();
  g.strokeStyle = rgba(ROPE, 0.95); g.lineWidth = w; path(g, pts, false); g.stroke();
  g.strokeStyle = rgba(ROPE_LIGHT, 0.55); g.lineWidth = Math.max(1, w * 0.3); path(g, pts, false); g.stroke();
}

// A net draped as a dome over (cx, ground), w wide, h tall.
// o: t (time, for the wobble), wiggle (0..1 struggle), cut (0..1 share of ropes snapped),
//    drop (0 = still up in the air .. 1 = landed), alpha
export function drawNet(g, cx, ground, w, h, o = {}) {
  const { t = 0, wiggle = 0, cut = 0, drop = 1, alpha = 1, seed = 5 } = o;
  const r = rng(seed);
  const lift = (1 - drop) * 620, hh = h * (1 + (1 - drop) * 0.5), ww = w * (1 - (1 - drop) * 0.25);
  const wob = (u, k) => (noise1(u * 4 + t * (0.6 + wiggle * 4), seed + k) - 0.5) * (6 + wiggle * 16);
  const top = (x) => { const u = (x - (cx - ww / 2)) / ww; return u <= 0 || u >= 1 ? ground - lift : ground - lift - hh * Math.pow(Math.sin(Math.PI * u), 0.75) + wob(u, 1); };
  const dome = [];
  for (let i = 0; i <= 40; i++) { const x = cx - ww / 2 + (i / 40) * ww; dome.push([x, top(x)]); }
  const clip = dome.concat([[cx + ww / 2 + 4, ground - lift + 8], [cx - ww / 2 - 4, ground - lift + 8]]);
  g.save();
  g.globalAlpha *= alpha;
  path(g, clip); g.save(); g.clip();
  // two families of diagonal ropes; each crossing is a knot
  const k = 1.15, sp = 46, y0 = ground - lift - hh - 20, y1 = ground - lift + 10;
  const fam = (sign, idx) => {
    const lines = [];
    for (let c = cx - ww - hh; c < cx + ww + hh; c += sp) lines.push(c);
    lines.forEach((c, i) => {
      const snapped = r() < cut, gapAt = r.range(0.35, 0.65);
      const seg = [];
      for (let s = 0; s <= 24; s++) {
        const y = y0 + (y1 - y0) * (s / 24), x = c + sign * (y - y0) / k;
        seg.push([x + wob(s / 24 + i, idx) * 0.4, y + Math.sin(s / 24 * Math.PI) * 6]);
      }
      if (!snapped) rope(g, seg, 3.6);
      else { // snapped: two loose ends that droop
        const a = Math.floor(seg.length * gapAt) - 1, b = a + 3;
        rope(g, seg.slice(0, a).concat([[seg[a][0] - 4, seg[a][1] + 10]]), 3.6);
        rope(g, [[seg[b][0] + 4, seg[b][1] + 12]].concat(seg.slice(b)), 3.6);
      }
    });
    return lines;
  };
  const A = fam(1, 1), B = fam(-1, 2);
  g.fillStyle = rgba(ROPE_DARK, 0.75);
  for (const a of A) for (const b of B) { // knots where the families cross
    const y = y0 + ((b - a) * k) / 2, x = a + (y - y0) / k;
    if (y < y0 || y > y1) continue;
    g.beginPath(); g.arc(x, y + Math.sin((y - y0) / (y1 - y0) * Math.PI) * 6, 3.4, 0, 7); g.fill();
  }
  g.restore();
  rope(g, dome, 6); // the heavy edge rope
  g.restore();
}

// the net bundled up in the branches, waiting
export function drawNetBundle(g, x, y, s = 1, t = 0) {
  const sway = Math.sin(t * 0.8) * 4;
  g.save(); g.translate(x + sway, y);
  rope(g, [[-sway, -130 * s], [0, -40 * s]], 3);
  const blob = smooth([[-60 * s, -30 * s], [0, -48 * s], [60 * s, -28 * s], [72 * s, 20 * s], [30 * s, 58 * s], [-30 * s, 60 * s], [-70 * s, 22 * s]]);
  wash(g, blob, { color: '#a88a62', opacity: 0.85, seed: 77, under: '#e8dcc4', layers: 14 });
  path(g, blob); g.save(); g.clip();
  for (let i = -6; i <= 6; i++) {
    rope(g, [[i * 16 * s - 60 * s, -60 * s], [i * 16 * s + 60 * s, 70 * s]], 2.5);
    rope(g, [[i * 16 * s + 60 * s, -60 * s], [i * 16 * s - 60 * s, 70 * s]], 2.5);
  }
  g.restore();
  pencil(g, blob, { closed: true, seed: 78, alpha: 0.5 });
  g.restore();
}
