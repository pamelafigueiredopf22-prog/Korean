// The little butterfly net. Drawn with its handle along angle `a` from (0,0) (the grip), hoop at the far end.
// The mesh bag always hangs downward in the world: `world` is the total rotation already applied above us.
import { rgba } from '../../engine/watercolor.js';
export function net(g, len, a, o = {}) {
  const { world = 0, sway = 0, r = 34 } = o;
  g.save(); g.rotate(a); g.lineCap = 'round';
  g.strokeStyle = '#7a5a3a'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 0); g.lineTo(len, 0); g.stroke();
  g.strokeStyle = rgba('#3a2c24', 0.75); g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 3); g.lineTo(len, 3); g.stroke();
  g.translate(len + r * 0.9, 0);
  g.rotate(-a - world + sway);                      // back to world-upright: the bag hangs straight down
  const rim = () => { g.beginPath(); g.ellipse(0, 0, r, r * 0.38, a + world - sway - Math.PI / 2 + 0.3, 0, 7); };
  // the bag
  g.fillStyle = 'rgba(244,240,228,0.55)'; g.beginPath(); g.moveTo(-r * 0.95, 0); g.quadraticCurveTo(-r * 0.7, r * 1.6, 0, r * 2.1); g.quadraticCurveTo(r * 0.7, r * 1.6, r * 0.95, 0); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(110,100,80,0.55)'; g.lineWidth = 0.9;
  for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(k * r * 0.3, 0); g.quadraticCurveTo(k * r * 0.22, r * 1.4, k * r * 0.04, r * 2.05); g.stroke(); }
  for (let k = 1; k < 5; k++) { const y = k * r * 0.42, w = r * 0.95 * (1 - (k / 5) ** 2); g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(0, y + 6, w, y); g.stroke(); }
  g.strokeStyle = '#8a6a44'; g.lineWidth = 4; rim(); g.stroke();
  g.strokeStyle = rgba('#3a2c24', 0.6); g.lineWidth = 1; rim(); g.stroke();
  g.restore();
}
