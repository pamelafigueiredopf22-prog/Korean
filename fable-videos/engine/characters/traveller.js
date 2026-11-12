// A little storybook traveller: round head, felt hat, long red coat, yellow scarf, walking stick, satchel.
// Three-quarter view facing right, feet at y = 0, about 250 tall. Poses: walk, huddle into the wind
// (holding his hat), coat off / carrying the coat, sitting against a tree, asleep. Plus the coat laid on the grass.
import { wash, pool, ellipse, smooth, bbox, sprite, drawSprite, shadeEdge, glaze, rgba, shade, tint, lerp,
  penLine, looseWash, soften, path } from '../watercolor.js';
import { buttonEye, PAPER, INK } from './kit.js';

const SKIN = '#f4d0b4', COAT = '#c0473c', HAT = '#7a5638', BAND = '#c0473c', SCARF = '#ecbc4c', TROUSER = '#6a5a4c', BOOT = '#4a3428', SHIRT = '#f4ecdc', VEST = '#6f8a52', HAIR = '#8a5e3c';

function part(res, shape, col, sd, o = {}) {
  return sprite(bbox(shape.concat(o.extra || [])), res, (g) => {
    wash(g, shape, { color: PAPER, opacity: 1, under: PAPER, seed: sd, edge: 0 });
    looseWash(g, shape, col, { opacity: 0.93, seed: sd + 1, shift: 2, reserves: 1 });
    if (o.paint) o.paint(g);
    shadeEdge(g, shape, { color: shade(col, 0.55), alpha: 0.34, width: o.shadeW || 14, dx: o.sdx ?? -5, dy: o.sdy ?? -2 });
    if (o.hi) glaze(g, shape, ...o.hi, '#ffffff', 0.35);
    soften(g, 0.9 * res);
    if (o.after) o.after(g);
    penLine(g, shape, { closed: true, color: INK, w: 1.9, alpha: 0.82, seed: sd + 5, weight: (t) => 0.35 + 0.8 * Math.max(0, Math.sin(t * Math.PI * 2 + 0.6)) });
  }, { seed: sd + 6, grain: 0.12 });
}
// a soft, rounded limb (sleeve or trouser leg), with a shaded underside
function limb(g, pts, w0, w1, col) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
    const w = lerp(w0, w1, i / (pts.length - 1)) / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]); R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  const sh = smooth(L.concat(R.reverse()));
  g.save(); g.lineJoin = 'round';
  g.fillStyle = col; path(g, sh); g.fill();
  g.save(); path(g, sh); g.clip(); g.strokeStyle = rgba(shade(col, 0.45), 0.35); g.lineWidth = w0 * 0.5; g.beginPath(); g.moveTo(...L[0]); for (const p of L) g.lineTo(...p); g.stroke(); g.restore();
  g.strokeStyle = rgba(INK, 0.75); g.lineWidth = 1.7; path(g, sh); g.stroke(); g.restore();
}
const joint = (r, a1, l1, a2, l2) => { const k = [r[0] + Math.cos(a1) * l1, r[1] + Math.sin(a1) * l1]; return [r, k, [k[0] + Math.cos(a2) * l2, k[1] + Math.sin(a2) * l2]]; };
function mitten(g, x, y, r = 9) {
  g.save(); g.fillStyle = SKIN; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.strokeStyle = rgba(INK, 0.7); g.lineWidth = 1.5; g.stroke(); g.restore();
}
// one-piece mouth: a smile line, or an open mouth whose top edge is the smile
function mouth(g, x, y, w, m, sm) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const pts = []; for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push([x - w / 2 + u * w, y - (Math.abs(u - 0.5) * 2) ** 2 * sm * 4]); }
  if (m > 0.04) {
    const d = 3 + 9 * m, outline = () => { g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.quadraticCurveTo(x, y + d * 1.7, pts[0][0], pts[0][1]); g.closePath(); };
    outline(); g.fillStyle = '#6a2a26'; g.fill(); g.save(); g.clip(); g.fillStyle = '#e08a80'; g.beginPath(); g.ellipse(x, y + d * 1.1, w * 0.3, d * 0.45, 0, 0, 7); g.fill(); g.restore();
    outline(); g.strokeStyle = rgba(INK, 0.85); g.lineWidth = 1.7; g.stroke();
  } else { g.strokeStyle = rgba(INK, 0.85); g.lineWidth = 1.8; g.beginPath(); g.moveTo(...pts[0]); for (const p of pts) g.lineTo(...p); g.stroke(); }
  g.restore();
}

// ---- shapes (feet at 0; head centre (HX, HY))
const HX = 8, HY = -178, HR = 46;
const COAT_SH = smooth([[-26, -140], [0, -146], [28, -140], [40, -110], [50, -70], [58, -34], [30, -26], [-6, -24], [-44, -30], [-40, -76], [-36, -116]]);
const BODY_SH = smooth([[-24, -138], [0, -144], [26, -138], [34, -104], [36, -66], [-30, -64], [-32, -104]]); // coat off: shirt and vest
const VEST_SH = smooth([[-26, -134], [-4, -130], [6, -110], [32, -100], [34, -68], [-30, -66], [-32, -104]]);
const HEAD = ellipse(HX, HY, HR, HR * 0.96, 36);
const HAT_SH = smooth([[-48, -206], [-30, -212], [-26, -250], [8, -262], [38, -252], [42, -212], [62, -206], [60, -194], [-50, -196]]);
const BOOT_SH = smooth([[-11, -18], [11, -18], [13, -6], [26, -5], [27, 2], [-11, 2]]);
const BAG = smooth([[-50, -90], [-18, -92], [-16, -60], [-50, -60]]);
const COLLAR = smooth([[-26, -146], [8, -158], [36, -146], [30, -132], [8, -138], [-20, -132]]);

export function makeTraveller(res = 1, seed = 81) {
  const s = (n) => seed * 100 + n;
  const coat = part(res, COAT_SH, COAT, s(1), { hi: [16, -110, 16, 30], after: (g) => {
    penLine(g, [[10, -144], [16, -90], [22, -28]], { w: 1.4, alpha: 0.6 });
    for (const y of [-124, -102, -80, -58]) { g.fillStyle = '#e0b850'; g.beginPath(); g.arc(24 + (y + 124) * 0.04, y, 3.8, 0, 7); g.fill(); g.strokeStyle = rgba(INK, 0.6); g.lineWidth = 0.9; g.stroke(); }
    for (const [x, y] of [[-30, -60], [44, -56]]) { g.strokeStyle = rgba(INK, 0.4); g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 8, y); g.lineTo(x + 8, y); g.stroke(); }
  } });
  const body = part(res, BODY_SH, SHIRT, s(10), { paint: (g) => { wash(g, VEST_SH, { color: VEST, opacity: 0.95, seed: s(11), under: true }); penLine(g, VEST_SH, { closed: true, w: 1.3, alpha: 0.6 }); for (const y of [-112, -92, -74]) { g.fillStyle = '#e0b850'; g.beginPath(); g.arc(0, y, 3, 0, 7); g.fill(); } } });
  const head = part(res, HEAD, SKIN, s(20), { hi: [HX + 10, HY - 18, 14, 10], paint: (g) => {
    pool(g, HX + 34, HY + 14, 12, 8, '#ec8a7e', 0.55); pool(g, HX - 4, HY + 14, 11, 7, '#ec8a7e', 0.45);
  }, after: (g) => {
    for (const [x, y] of [[HX - 40, HY - 12], [HX - 44, HY + 2], [HX - 38, HY + 16]]) {
      g.save(); g.strokeStyle = HAIR; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.arc(x, y, 6, Math.PI * 0.2, Math.PI * 1.7); g.stroke(); g.restore();
    }
    const ear = ellipse(HX - 22, HY + 2, 8, 11, 16); wash(g, ear, { color: '#f0c0a0', opacity: 0.95, seed: s(22), under: true }); penLine(g, ear.slice(3, 14), { w: 1.2, alpha: 0.6 });
    const nose = ellipse(HX + 30, HY + 4, 7, 6, 14); wash(g, nose, { color: '#f2b49a', opacity: 0.95, seed: s(21), under: true }); penLine(g, nose.slice(0, 9), { w: 1.2, alpha: 0.6 });
  } });
  const hat = part(res, HAT_SH, HAT, s(30), { hi: [10, -244, 14, 6], paint: (g) => { g.save(); path(g, HAT_SH); g.clip(); g.fillStyle = rgba(BAND, 0.92); g.beginPath(); g.moveTo(-30, -226); g.quadraticCurveTo(8, -230, 44, -226); g.lineTo(44, -212); g.quadraticCurveTo(8, -216, -30, -212); g.closePath(); g.fill(); g.restore(); } });
  const boot = part(res, BOOT_SH, BOOT, s(40), { shadeW: 6 });
  const bag = part(res, BAG, '#9a6638', s(50), { shadeW: 8, after: (g) => { penLine(g, [[-50, -80], [-16, -80]], { w: 1.2, alpha: 0.6 }); g.fillStyle = '#e0b850'; g.beginPath(); g.arc(-33, -76, 3, 0, 7); g.fill(); } });
  const collar = part(res, COLLAR, shade(COAT, 0.12), s(60), { shadeW: 5 });
  const scarfKnot = part(res, ellipse(6, -142, 30, 11, 20), SCARF, s(70), { shadeW: 6 });

  function face(g, st, hud) {
    const eo = hud > 0.6 ? 0.2 : st.eyes ?? 1;
    for (const x of [HX + 4, HX + 26]) buttonEye(g, x, HY - 4, eo, { R: 6.5, happy: st.happy, sly: hud * 0.5 });
    g.strokeStyle = rgba(HAIR, 0.8); g.lineWidth = 2.2; g.lineCap = 'round'; const bu = (st.browUp || 0) * 5 - hud * 3;
    for (const x of [HX + 4, HX + 26]) { g.beginPath(); g.moveTo(x - 6, HY - 18 - bu); g.quadraticCurveTo(x, HY - 22 - bu, x + 6, HY - 18 - bu); g.stroke(); }
    mouth(g, HX + 18, HY + 20, 14, st.mouth || 0, hud > 0.6 ? -0.4 : st.smile ?? 0.6);
  }

  // st: walk (phase 0..1), huddle 0..1 (leaning into the wind), wind 0..1 (flaps coat and scarf, blowing from the right),
  //     hatHold, wipe, coatOff, carryCoat, hatLift, mouth, smile, eyes, happy, browUp, headTilt, breath, t
  function draw(g, st = {}) {
    const t = st.t || 0, p = (st.walk ?? 0) * Math.PI * 2, moving = st.walk != null, hud = st.huddle || 0, wind = st.wind || 0;
    const bob = moving ? Math.abs(Math.sin(p)) * 3.5 : (st.breath || 0) * 1.2;
    g.save();
    pool(g, 0, 2, 62, 8, '#2a1e12', 0.22);
    const legs = (far) => {
      const o = far ? Math.PI : 0, sw = moving ? Math.sin(p + o) * 0.45 * (1 - hud * 0.35) : 0;
      const hip = [far ? -8 : 6, -40 - bob];
      const foot = [hip[0] + Math.sin(sw) * 36, -16 - (moving ? Math.max(0, Math.cos(p + o)) * 7 : 0)];
      limb(g, [hip, [(hip[0] + foot[0]) / 2 + 2, (hip[1] + foot[1]) / 2], foot], 22, 18, far ? shade(TROUSER, 0.18) : TROUSER);
      g.save(); g.translate(foot[0], foot[1] + 16); drawSprite(g, boot); g.restore();
    };
    legs(true);
    g.save(); g.translate(0, -bob); g.translate(0, -40); g.rotate(hud * 0.2); g.translate(0, 40);
    const sc = [];
    for (let k = 0; k <= 8; k++) { const u = k / 8; sc.push([-6 - u * (30 + 70 * wind), -140 + u * (36 - 48 * wind) + Math.sin(u * 6 - t * (4 + 12 * wind)) * (3 + 12 * wind) * u]); }
    limb(g, sc, 15, 11, SCARF);
    const shF = [-8, -128];
    const armF = st.hatHold ? joint(shF, -1.9, 38, -2.5, 34) : hud > 0.5 ? joint(shF, 0.7, 28, -0.3, 26) : st.carryCoat ? joint(shF, 1.3, 28, 0.6, 24)
      : moving ? joint(shF, 1.57 + Math.sin(p + Math.PI) * 0.45, 28, 1.4, 24) : joint(shF, 1.5, 28, 1.3, 24);
    if (!st.hatHold) { limb(g, armF, 18, 15, st.coatOff ? SHIRT : shade(COAT, 0.18)); mitten(g, ...armF[2], 8); }
    drawSprite(g, bag);
    if (!st.coatOff) {
      g.save();
      const flap = wind * (0.05 + 0.06 * Math.sin(t * 9));
      g.translate(0, -120); g.transform(1, 0, flap * 1.6, 1, 0, 0); g.translate(0, 120);
      drawSprite(g, coat); g.restore();
      drawSprite(g, collar);
    } else drawSprite(g, body);
    drawSprite(g, scarfKnot);
    g.save(); g.translate(HX, -140); g.rotate((st.headTilt || 0) + hud * 0.18); g.translate(-HX, 140);
    drawSprite(g, head);
    face(g, st, hud);
    if (!st.hatOff) { g.save(); const lift = st.hatLift || 0; g.translate(0, -lift * 26); g.rotate(-lift * 0.25); drawSprite(g, hat); g.restore(); }
    g.restore();
    if (st.hatHold) { limb(g, armF, 16, 13, st.coatOff ? SHIRT : shade(COAT, 0.18)); mitten(g, ...armF[2], 9); }
    const shN = [12, -126];
    let armN;
    if (hud > 0.5 || st.hatHold) armN = joint(shN, 0.9, 26, -2.4, 26);
    else if (st.wipe > 0.5) armN = joint(shN, -0.5, 30, -2.5 + Math.sin(t * 6) * 0.2, 26);
    else if (st.carryCoat) armN = joint(shN, 1.1, 28, -0.2, 26);
    else if (moving) armN = joint(shN, 1.3 + Math.sin(p) * 0.4, 28, 0.8, 26);
    else armN = joint(shN, 1.3, 28, 0.9, 26);
    limb(g, armN, 19, 16, st.coatOff ? SHIRT : COAT);
    const hand = armN[2];
    if (st.carryCoat) { g.save(); g.translate(hand[0] + 2, hand[1] + 2); g.rotate(-0.15); g.scale(0.5, 0.5); g.translate(-10, 120); drawSprite(g, coat); g.restore(); }
    if (!st.noStick && !st.hatHold && hud < 0.5 && !(st.wipe > 0.5) && !st.carryCoat) { g.save(); g.strokeStyle = '#6a4a2a'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(hand[0] + 2, hand[1] - 24); g.lineTo(hand[0] + 14, bob); g.stroke(); g.fillStyle = '#8a6a3a'; g.beginPath(); g.arc(hand[0] + 2, hand[1] - 26, 5, 0, 7); g.fill(); g.restore(); }
    mitten(g, ...hand, 9);
    g.restore();
    legs(false);
    g.restore();
  }
  function drawSit(g, st = {}) {
    const sl = st.sleep || 0, br = (st.breath || 0) * 1.6;
    g.save();
    pool(g, 40, 2, 110, 10, '#2a1e12', 0.22);
    for (const far of [true, false]) { // legs stretched out along the grass
      const hip = [far ? -8 : 4, -16], y1 = far ? -12 : -10;
      limb(g, [hip, [hip[0] + 42, y1 + 2], [hip[0] + 80, y1]], 24, 19, far ? shade(TROUSER, 0.18) : TROUSER);
      g.save(); g.translate(hip[0] + 84, y1 + 12); g.rotate(-0.5); drawSprite(g, boot); g.restore();
    }
    g.save(); g.translate(0, 58 - br);
    const armF = joint([-8, -128], 1.6, 28, 0.9, 24); limb(g, armF, 18, 15, SHIRT); mitten(g, ...armF[2], 8);
    drawSprite(g, body);
    drawSprite(g, scarfKnot);
    g.save(); g.translate(HX, -140); g.rotate(sl * 0.2 + (st.headTilt || 0)); g.translate(-HX, 140);
    drawSprite(g, head);
    face(g, { ...st, eyes: sl > 0.5 ? 0 : st.eyes, smile: st.smile ?? 0.7 }, 0);
    g.save(); g.translate(4 * sl, 7 * sl); g.rotate(sl * 0.1); drawSprite(g, hat); g.restore();
    g.restore();
    const armN = joint([12, -126], 1.25, 28, -0.1 + sl * 0.2, 26); limb(g, armN, 19, 16, SHIRT); mitten(g, ...armN[2], 9); // hands folded on his tummy
    g.restore();
    g.restore();
  }
  // the coat, neatly folded on the grass: a soft red bundle with its collar, buttons and a sleeve tucked over
  const FOLD = smooth([[-62, -6], [-56, -30], [-20, -40], [30, -38], [62, -26], [66, -4], [30, 6], [-30, 6]]);
  const folded = part(res, FOLD, COAT, s(80), { shadeW: 10, sdy: 4, hi: [0, -30, 30, 6], after: (g) => {
    const sleeve = smooth([[-40, -34], [10, -30], [44, -18], [40, -8], [6, -18], [-38, -22]]);
    wash(g, sleeve, { color: shade(COAT, 0.1), opacity: 0.95, seed: s(81), under: true }); penLine(g, sleeve, { closed: true, w: 1.4, alpha: 0.7 });
    const col = smooth([[-62, -6], [-56, -30], [-44, -30], [-48, -6]]); wash(g, col, { color: shade(COAT, 0.2), opacity: 0.9, seed: s(82) }); penLine(g, col, { closed: true, w: 1.2, alpha: 0.6 });
    for (const x of [-20, 6, 32]) { g.fillStyle = '#e0b850'; g.beginPath(); g.arc(x, -2, 3.4, 0, 7); g.fill(); g.strokeStyle = rgba(INK, 0.5); g.lineWidth = 0.8; g.stroke(); }
  } });
  function drawCoatLaid(g) { pool(g, 0, 4, 80, 10, '#2a1e12', 0.2); drawSprite(g, folded); }
  return { draw, drawSit, drawCoatLaid, coat };
}
