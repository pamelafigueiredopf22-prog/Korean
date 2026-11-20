// cat3 part of the _bell test reel (segments appended after the mice)
import { clamp, span, pool } from '../../engine/watercolor.js';
import { makeCatRig, STRIDE, pounceX } from '../../engine/characters/cat3.js';
const on = (k, a, b, r = 0.3) => span(k, a, a + r) * (1 - span(k, b - r, b));
function smoothDist(u) { const a = 0.25, vmax = 1 / (1 - a); if (u <= 0) return 0; if (u >= 1) return 1; if (u < a) return vmax * u * u / (2 * a); if (u > 1 - a) return 1 - vmax * (1 - u) * (1 - u) / (2 * a); return vmax * (a / 2 + (u - a)); }
let CAT;
const CS = 0.8;
export function REEL_CAT(SEGS, seg, act, GROUND) {
  const cat = (x, poseK, o = {}) => ({ x, y: GROUND, s: CS, face: o.face || 1, sinceK: 0, poseK, ...o, get rig() { return CAT; } });
  seg(7, 'Cat: sitting, tail curling, ear twitches, a slow loving blink', () => [
    cat(1000, (q) => ({ sit: 1, blink: clamp((q - 3.2) / 1.6) % 1, happy: 0.0 })),
  ]);
  seg(8, 'Cat: stands, walks, then creeps soft as a shadow', (k) => {
    const D1 = 2.5 * STRIDE, D2 = 2 * STRIDE;
    const d = (q) => D1 * smoothDist(clamp((q - 1.2) / 3)) + D2 * smoothDist(clamp((q - 4.6) / 3.2));
    return [cat(1550 - d(k) * CS, (q) => ({ sit: 1 - span(q, 0.2, 1.2), walk: d(q) / STRIDE, walkAmt: on(q, 1.1, 7.9, 0.5), creep: on(q, 4.2, 7.9, 0.6) }))];
  });
  seg(4.6, 'Cat: a playful pounce (wiggle, spring, soft landing)', (k) => {
    const u = (q) => clamp((q - 0.3) / 3.4), dist = 300;
    return [cat(1400 - pounceX(u(k)) * dist * CS, (q) => ({ pounce: u(q) % 1 })), { prop: 'ball', x: 1400 - (dist + 330) * CS, y: GROUND, s: 1, draw: (g) => { pool(g, 0, 2, 24, 5, '#2a1e12', 0.3); g.fillStyle = '#c84a48'; g.beginPath(); g.arc(0, -20, 20, 0, 7); g.fill(); g.strokeStyle = 'rgba(51,36,27,0.7)'; g.lineWidth = 2; g.stroke(); } }];
  });
  seg(6.5, 'Cat: a long stretch, then a big yawn', () => [
    cat(1000, (q) => ({ stretch: clamp((q - 0.2) / 3.2) % 1, sit: span(q, 3.4, 4.2), yawn: clamp((q - 4.0) / 2.3) % 1 })),
  ]);
  seg(8, 'Cat: curls up by the stove and purrs herself to sleep', () => [
    { prop: 'stove', x: 1500, y: GROUND, s: 1, draw: (g, t) => { g.fillStyle = '#3a3230'; g.fillRect(-120, -360, 240, 360); g.fillStyle = '#5a4a44'; g.fillRect(-130, -372, 260, 18); g.fillStyle = 'rgba(255,150,60,0.8)'; g.fillRect(-60, -170, 120, 70); g.globalCompositeOperation = 'lighter'; pool(g, 0, -140, 260, 200, '#ff9040', 0.12 + 0.02 * Math.sin(t * 3)); g.globalCompositeOperation = 'source-over'; } },
    cat(1080, (q) => ({ sit: 1 - span(q, 0.5, 2.6), sleep: span(q, 0.8, 3.6), blink: clamp((q - 0.2) / 1.2) % 1 })),
  ]);
}
export async function catSetup(M) { CAT = makeCatRig(1.2); M.cat = CAT; }
