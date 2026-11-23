// The Milkmaid characters' test reel: every action of Molly, her mother, Buttercup the cow, the hens and the chicks,
// in labelled segments on plain paper. Each segment returns a list of items: rig actors { rig, x, y, s, face, sinceK,
// pose(q) -> state, layer } (drawn with drawAt, so follow-through is on) or props { draw(g, k) }.
//   node tools/render.js _milk --video --fps 30 --blur 5 --shutter 0.4 --workers 2
import { paper, sprite, bbox, wash, smooth, penLine, pool, clamp, lerp, ease, span, rgba, shade } from '../../engine/watercolor.js';
import { makeMilkmaid, STRIDE as MS, TOSS_RELEASE } from '../../engine/characters/milkmaid.js';
import { makeMother, STRIDE as WS } from '../../engine/characters/farmwife.js';
import { makeCow, STRIDE as CS } from '../../engine/characters/cow.js';
import { makeHen, makeChick } from '../../engine/characters/hens.js';

let PAPER; const R = {};
const GROUND = 900;
const talk = (k) => clamp(0.55 * Math.max(0, Math.sin(k * 13) * 0.7 + Math.sin(k * 5.3) * 0.5) + 0.1 * Math.sin(k * 29));
const on = (q, a, b, r = 0.4) => span(q, a, a + r) * (1 - span(q, b - r, b));
function smoothDist(u) { const a = 0.22, vmax = 1 / (1 - a); if (u <= 0) return 0; if (u >= 1) return 1; if (u < a) return vmax * u * u / (2 * a); if (u > 1 - a) return 1 - vmax * (1 - u) * (1 - u) / (2 * a); return vmax * (a / 2 + (u - a)); }
export const SEGS = [];
const seg = (len, label, fn) => { const t0 = SEGS.length ? SEGS[SEGS.length - 1][1] : 0; SEGS.push([t0, t0 + len, label, fn]); };
const act = (rig, x, y, s, pose, o = {}) => ({ rig, x, y, s, pose, face: o.face || 1, sinceK: o.sinceK || 0, layer: o.layer, noShadow: o.noShadow });
const prop = (draw) => ({ draw });

// ---- props
let BED, CHAIR, STRAW;
function makeProps() {
  const head = smooth([[-40, 0], [-40, -170], [-20, -200], [20, -200], [40, -170], [40, 0]]);
  const frame = [[-30, -40], [420, -40], [420, 0], [-30, 0]];
  BED = sprite(bbox(head.concat(frame, [[440, 30]])), 2, (g) => {
    wash(g, head, { color: '#a87850', opacity: 0.95, under: true, seed: 3 }); penLine(g, head, { closed: true, w: 2, alpha: 0.7 });
    wash(g, [[-36, -70], [430, -70], [430, -24], [-36, -24]], { color: '#f4ecdc', opacity: 0.95, under: true, seed: 4 });
    wash(g, frame, { color: '#a07048', opacity: 0.95, under: true, seed: 5 }); penLine(g, frame, { closed: true, w: 2, alpha: 0.7 });
    for (const x of [-30, 410]) { const leg = [[x, 0], [x + 14, 0], [x + 14, 28], [x, 28]]; wash(g, leg, { color: '#8a5a38', opacity: 0.95, under: true, seed: 6 + x }); penLine(g, leg, { closed: true, w: 1.6, alpha: 0.7 }); }
  });
  const back = [[-50, -230], [-30, -230], [-30, 0], [-50, 0]], seat = [[-56, -118], [70, -118], [70, -104], [-56, -104]];
  CHAIR = sprite(bbox(back.concat(seat, [[70, 0]])), 2, (g) => {
    for (const sh of [back, [[50, -104], [64, -104], [64, 0], [50, 0]], [[-46, -104], [-32, -104], [-32, 0], [-46, 0]]]) { wash(g, sh, { color: '#9a6a44', opacity: 0.95, under: true, seed: 9 }); penLine(g, sh, { closed: true, w: 1.6, alpha: 0.7 }); }
    for (const y of [-200, -160]) { const r = [[-50, y], [10, y], [10, y + 10], [-50, y + 10]]; wash(g, r, { color: '#a87850', opacity: 0.95, under: true, seed: 11 }); }
    wash(g, seat, { color: '#b08058', opacity: 0.95, under: true, seed: 10 }); penLine(g, seat, { closed: true, w: 1.6, alpha: 0.7 });
  });
  const st = smooth([[-260, 10], [-200, -14], [0, -22], [200, -14], [280, 10], [0, 22]]);
  STRAW = sprite(bbox(st), 2, (g) => { wash(g, st, { color: '#e2c27a', opacity: 0.9, under: true, seed: 13 }); for (let i = 0; i < 160; i++) { const x = -250 + Math.random() * 520, y = -14 + Math.random() * 30; penLine(g, [[x, y], [x + 18 * Math.cos(i), y + 5 * Math.sin(i * 3)]], { color: i % 3 ? '#b8964c' : '#f4e0a0', w: 1.2, alpha: 0.7 }); } });
}
const drawS = (g, s, x, y, k = 1) => { g.save(); g.translate(x, y); g.scale(k, k); g.drawImage(s.c, s.x0, s.y0, s.w, s.h); g.restore(); };
const ground = (g) => { g.save(); g.strokeStyle = 'rgba(90,70,50,0.22)'; g.lineWidth = 2; g.beginPath(); g.moveTo(80, GROUND + 2); g.lineTo(1840, GROUND + 2); g.stroke(); g.restore(); };

// ================================================================ MOLLY
seg(4, 'Molly: idle life (breathing, blinks, glances, plaits and skirt), then talking', () =>
  [act(R.molly, 960, GROUND, 1.75, (q) => ({ mouth: q > 1.8 && q < 3.8 ? talk(q) * on(q, 1.8, 3.8, 0.2) : 0 }))]);
seg(6.5, 'Molly close-up: smile, happy, sad with a tear, gasp, wide eyes, talking', () =>
  [act(R.molly, 960, 1560, 3.7, (q) => ({ life: 0.5, happy: on(q, 1.0, 2.2, 0.25), mouth: Math.max(0.4 * on(q, 1.0, 2.2, 0.25), q > 5.2 ? talk(q) * on(q, 5.2, 6.4, 0.2) : 0),
    sad: on(q, 2.3, 3.9, 0.35), tear: clamp((q - 2.6) / 1.4), gasp: on(q, 4.0, 5.0, 0.18), eyeBig: on(q, 4.9, 5.6, 0.25), browUp: on(q, 4.9, 5.6, 0.25) }))]);
seg(3.5, 'Head turns and tilts within one 3/4 face; a nod', () =>
  [act(R.molly, 960, 1460, 3.4, (q) => ({ life: 0, headTurn: 0.8 * Math.sin(q * 1.8), headTilt: 0.18 * Math.sin(q * 1.3 + 1), nod: 0.15 * Math.sin(q * 2.4) * on(q, 2.0, 3.5, 0.3), mouth: q > 0.6 && q < 1.6 ? talk(q) * 0.6 : 0 }))]);
seg(5, 'Turning round through the front view (swap), and back', (k) => {
  const r = k < 2.5 ? { face: 1, sinceK: 0 } : { face: -1, sinceK: 2.5 };
  return [act(R.molly, 960, GROUND, 1.75, (q) => (q < 2.5) === (k < 2.5) ? { turn: q < 2.5 ? span(q, 0.4, 1.9) : span(q, 3.0, 4.5) } : { turn: k < 2.5 ? 0 : 1 }, r)];
});
seg(4.5, 'Walking: distance-driven stride, planted feet', (k) => {
  const D = 4 * MS, dist = (q) => D * smoothDist(clamp((q - 0.3) / 3.9));
  return [act(R.molly, 1300 - dist(k) * 1.5, GROUND, 1.5, (q) => ({ walk: dist(q) / MS, walkAmt: on(q, 0.1, 4.4, 0.5) }))];
});
seg(4, 'Skipping (happy, bouncy)', (k) => {
  const D = 4 * MS, dist = (q) => D * smoothDist(clamp((q - 0.25) / 3.5));
  return [act(R.molly, 1300 - dist(k) * 1.5, GROUND, 1.5, (q) => ({ walk: dist(q) / MS, walkAmt: on(q, 0.05, 3.9, 0.4), skip: on(q, 0.1, 3.8, 0.4) }))];
});
seg(4.5, 'The pail on her head: one hand steadying it, swaying with the walk', (k) => {
  const D = 3.5 * MS, dist = (q) => D * smoothDist(clamp((q - 0.3) / 3.9));
  return [act(R.molly, 1250 - dist(k) * 1.5, GROUND, 1.5, (q) => ({ pailOn: 'head', pailHands: 1, walk: dist(q) / MS, walkAmt: on(q, 0.1, 4.4, 0.5), mouth: q > 1 && q < 3 ? talk(q) * 0.7 : 0, smile: 0.8 }))];
});
// the toss: the pail leaves the head at TOSS_RELEASE and falls (thrown from its last motion), lands and spills
const TOSS_A = 1.3, TOSS_D = 2.0, TR = TOSS_A + TOSS_D * TOSS_RELEASE;
const tossPose = (q) => ({ pailOn: q < TR ? 'head' : 'none', pailHands: 1 - span(q, 0.5, 1.1), daydream: 0.4 * on(q, 0, 1.3, 0.4),
  toss: q > TOSS_A && q < TOSS_A + TOSS_D ? (q - TOSS_A) / TOSS_D : 0, tossSurprise: 1, gasp: on(q, 3.5, 4.9, 0.25), sad: span(q, 4.6, 5.0) });
seg(5.2, 'The head toss: chin up, plaits fly, the pail tips off and falls - oh!', (k) => {
  const X = 1100, S = 1.5, mol = R.molly;
  const items = [act(mol, X, GROUND, S, tossPose)];
  items.push(prop((g, kk, t, t0) => {
    if (kk < TR) return;
    const o = { x: X, y: GROUND, scale: S, face: 1, since: t0 };
    const poseFn = (tt) => ({ ...tossPose(tt - t0), t: tt });
    const p0 = mol.pailAt(poseFn, t0 + TR - 1e-3, o), p1 = mol.pailAt(poseFn, t0 + TR - 1 / 30 - 1e-3, o);
    if (!p0 || !p1) return;
    const v = [(p0.x - p1.x) * 30, (p0.y - p1.y) * 30], w = (p0.angle - p1.angle) * 30, dt = kk - TR, gy = 2400;
    let x = p0.x + v[0] * dt, y = p0.y + v[1] * dt + 0.5 * gy * dt * dt, a = p0.angle + w * dt;
    const land = (() => { let tt = 0; while (p0.y + v[1] * tt + 0.5 * gy * tt * tt < GROUND - 20 && tt < 3) tt += 0.005; return tt; })();
    let milk = p0.milk;
    if (dt > land) { // landed: rolls onto its side, milk spreads on the lane
      const u = dt - land; x = p0.x + v[0] * land + v[0] * 0.25 * (1 - Math.exp(-u * 4)); y = GROUND - 22 * ease(u * 3);
      const a0 = p0.angle + w * land; a = lerp(a0, Math.sign(a0 || 1) * Math.PI / 2, ease(u * 3)); milk = 0;
      g.save(); g.globalAlpha = 0.9; pool(g, x - 70 * Math.sign(a), GROUND + 6, 40 + 120 * ease(u * 1.2), 10 + 14 * ease(u * 1.2), '#fbf6ea', 0.95); g.restore();
    } else if (dt > 0.05) { // a splash of milk flying from the rim
      g.save(); g.fillStyle = 'rgba(252,248,238,0.9)'; for (let i = 0; i < 6; i++) { const d = dt - i * 0.03; if (d < 0) continue; g.beginPath(); g.arc(p0.x + v[0] * d + i * 6 * Math.cos(a), p0.y + v[1] * d + 0.5 * gy * d * d - 70 + i * 4, 7 - i * 0.7, 0, 7); g.fill(); } g.restore();
    }
    mol.drawPail(g, x, y, a, milk, { scale: S, face: 1 });
  }));
  return items;
});
seg(4.2, 'Walking slowly home, sad, the empty pail in her hand', (k) => {
  const D = 2.5 * MS, dist = (q) => D * smoothDist(clamp((q - 0.2) / 3.9));
  return [act(R.molly, 1250 - dist(k) * 1.5, GROUND, 1.5, (q) => ({ pailOn: 'hand', milkLevel: 0, sadWalk: 1, walk: dist(q) / MS, walkAmt: on(q, 0.05, 4.2, 0.5) }))];
});
seg(3.8, 'Daydreaming: eyes up, a dreamy smile, hands clasped', () =>
  [act(R.molly, 960, GROUND, 1.75, (q) => ({ daydream: on(q, 0.3, 3.7, 0.6), mouth: q > 1.6 && q < 2.8 ? talk(q) * 0.5 : 0 }))]);
seg(4.2, 'Twirling (as if in a new blue dress with ribbons)', () =>
  [act(R.blue, 960, GROUND, 1.75, (q) => ({ twirl: clamp((q - 0.4) / 3.2) % 1 }))]);
// milking: Molly on her stool by the udder, facing it; the pail under the udder
seg(5, 'Milking Buttercup: sitting on the little stool, hands working', () => {
  const CX = 1180, S = 1.35, U = R.cow.udderAt({}, { x: CX, y: GROUND, scale: S, face: 1 });
  const MX = U.x - 118;
  return [act(R.cow, CX, GROUND, S, (q) => ({ chew: 1, lookBack: 0.35 * on(q, 1.5, 4.5, 0.8) })),
    prop((g) => R.molly.drawPail(g, U.x + 6, GROUND - 2, 0, 0.5, { scale: S * 0.95, bail: 1.2 })),
    act(R.molly, MX, GROUND + 20, S, (q) => ({ sit: 1, stool: true, milk: 1, milkAt: [74, 4, -214], smile: 0.8 }), { face: -1 })];
});
seg(4, 'Stroking Buttercup\'s nose', () => {
  const CX = 1150, S = 1.4;
  return [act(R.cow, CX, GROUND, S, (q) => ({ headDown: 0.7, headTurn: 0.4, happy: on(q, 1.2, 3.8, 0.4), chew: 0 })),
    act(R.molly, CX - 590, GROUND, S, (q) => ({ stroke: on(q, 0.3, 3.8, 0.5), strokeF: 118, strokeY: -205, happy: on(q, 1.5, 3.5, 0.4) }), { face: -1 })];
});
seg(4, 'Waving (an open hand), then pointing', () => [act(R.molly, 960, GROUND, 1.75, (q) => ({ wave: on(q, 0.2, 2.1, 0.4), point: on(q, 2.3, 3.9, 0.4), mouth: q > 0.8 && q < 2 ? talk(q) * 0.6 : 0 }))]);

// ================================================================ MOTHER
seg(4.5, 'Mother: idle, talking, a kind smile, gentle nodding', () =>
  [act(R.mum, 960, GROUND, 1.45, (q) => ({ mouth: q > 0.6 && q < 3.0 ? talk(q) : 0, nodding: on(q, 2.8, 4.4, 0.4), happy: on(q, 3.2, 4.3, 0.3) }))]);
seg(4.5, 'Mother hands Molly the pail', (k) => {
  const S = 1.35, HO = 2.6;
  return [act(R.mum, 1250, GROUND, S, (q) => ({ pailOn: q < HO ? 'hand' : 'none', give: on(q, 0.3, 3.4, 0.6), giveY: -300, mouth: q > 0.3 && q < 1.8 ? talk(q) * 0.8 : 0 })),
    act(R.molly, 760, GROUND, S, (q) => ({ pailOn: q < HO ? 'none' : 'hand', reach: on(q, 1.6, HO + 0.1, 0.5), happy: on(q, 3.0, 4.4, 0.3) }), { face: -1 })];
});
seg(3, 'Mother waves goodbye', () => [act(R.mum, 960, GROUND, 1.45, (q) => ({ wave: on(q, 0.2, 2.9, 0.4), smile: 0.9 }))]);
seg(6, 'The comforting hug: Mother kneels, hugs Molly, brushes a tear', (k) => {
  const S = 1.5, MX = 860, WX = 1010;
  const mum = (q) => ({ kneel: on(q, 0.2, 6, 0.9), comfort: on(q, 1.2, 3.8, 0.6), brush: on(q, 3.8, 5.8, 0.5), brushAt: [92, -8, -318], mouth: q > 4.2 && q < 5.6 ? talk(q) * 0.7 : 0 });
  const mol = (q) => ({ sad: 1 - span(q, 4.4, 5.4), tear: clamp((q - 0.2) / 2.5) * (1 - span(q, 4.2, 4.8)), hug: on(q, 1.3, 3.8, 0.6), smile: lerp(0.3, 0.8, span(q, 4.6, 5.6)) });
  return [act(R.mum, WX, GROUND, S, mum, { layer: 'back' }), act(R.molly, MX, GROUND, S, mol, { face: -1 }), act(R.mum, WX, GROUND, S, mum, { layer: 'front', noShadow: true })];
});
seg(3.5, 'Sitting on Mother\'s lap', () => {
  const S = 1.35, WX = 1060, mst = { sit: 1, seatH: 112, hug: 0.6 };
  const lap = R.mum.lapAt({ ...mst, t: 0 }, { x: WX, y: GROUND, scale: S, face: 1 });
  const seatH = (GROUND - lap.y) / S - 6;
  return [prop((g) => drawS(g, CHAIR, WX + 30, GROUND, S)), act(R.mum, WX, GROUND, S, () => mst, { layer: 'back' }),
    act(R.molly, lap.x - 45, GROUND, S, (q) => ({ sit: 1, seatH, happy: on(q, 0.8, 3.0, 0.3), smile: 0.9, clasp: 0.6 })),
    act(R.mum, WX, GROUND, S, () => mst, { layer: 'front', noShadow: true })];
});
seg(7, 'Bedtime: sitting up in bed, lying back, Mother tucks her in, asleep', () => {
  const S = 1.45, MX = 1000, BY = GROUND - 80 * S;
  const mol = (q) => ({ bed: 1, nightgown: true, lie: span(q, 1.2, 3.0), sleep: span(q, 3.6, 5.2), mouth: q < 1.1 ? talk(q) * 0.5 : 0, smile: 0.75, happy: on(q, 0.2, 1.0, 0.2) });
  const mum = (q) => ({ bend: on(q, 2.6, 6.4, 0.8), tuck: on(q, 3.0, 6.0, 0.6), tuckAt: [150, 0, -40], smile: 0.85, eye: 0.8 });
  const bed = (g) => { g.save(); g.translate(MX + 260 * S, GROUND - 28 * S); g.scale(-S, S); g.drawImage(BED.c, BED.x0, BED.y0, BED.w, BED.h); g.restore(); };
  return [act(R.mum, MX - 110, GROUND - 40, S * 0.98, mum, { layer: 'back', noShadow: true, face: -1 }), prop(bed),
    act(R.molly, MX, BY, S, mol, { noShadow: true }), act(R.mum, MX - 110, GROUND - 40, S * 0.98, mum, { layer: 'front', noShadow: true, face: -1 })];
});

// ================================================================ BUTTERCUP
seg(4.5, 'Buttercup: chewing the cud, ear flicks, tail swish, slow blinks', () =>
  [act(R.cow, 1000, GROUND, 1.45, (q) => ({ chew: 1, tailSwish: on(q, 2.2, 3.8, 0.4) }))]);
seg(4.5, 'Buttercup turns her head: toward us, then back toward her flank', () =>
  [act(R.cow, 1000, GROUND, 1.45, (q) => ({ headTurn: on(q, 0.3, 1.9, 0.5), lookBack: on(q, 2.2, 4.3, 0.6), happy: on(q, 2.9, 3.8, 0.3) }))]);
seg(3, 'Buttercup moos (gently)', () => [act(R.cow, 1000, GROUND, 1.45, (q) => ({ moo: on(q, 0.5, 2.4, 0.4) }))]);
seg(4.5, 'Buttercup walks: hooves planted, the hock points back', (k) => {
  const D = 2.5 * CS, dist = (q) => D * smoothDist(clamp((q - 0.2) / 4.1));
  return [act(R.cow, 1380 - dist(k) * 1.3, GROUND, 1.3, (q) => ({ walk: dist(q) / CS, walkAmt: on(q, 0.05, 4.4, 0.5) }))];
});
seg(5, 'Buttercup lies down in the straw and goes to sleep', () =>
  [prop((g) => drawS(g, STRAW, 1000, GROUND, 1.6)), act(R.cow, 1000, GROUND, 1.45, (q) => ({ lie: span(q, 0.3, 2.4), sleep: span(q, 2.6, 4.2), chew: 1 - span(q, 0, 1) }))]);

// ================================================================ HENS AND CHICKS
seg(5, 'Hens: pecking, clucking, scratching, strutting', (k) => {
  const D = 3 * R.hen1.STRIDE, dist = (q) => D * smoothDist(clamp((q - 0.5) / 3.8));
  return [act(R.hen1, 560, GROUND, 2.4, (q) => ({ pecking: on(q, 0.2, 4.8, 0.3) })),
    act(R.hen2, 1000, GROUND, 2.4, (q) => ({ cluck: on(q, 0.3, 2.4, 0.3), scratch: clamp((q - 2.6) / 1.8) % 1 }), { face: -1 }),
    act(R.hen3, 1560 - dist(k) * 2.4, GROUND, 2.4, (q) => ({ walk: dist(q) / R.hen1.STRIDE, walkAmt: on(q, 0.4, 4.6, 0.3) }))];
});
seg(4, 'Hens settle down for the night, heads under their wings', () =>
  [act(R.hen1, 600, GROUND, 2.4, (q) => ({ sleep: span(q, 0.4, 2.6) })), act(R.hen2, 1000, GROUND, 2.4, (q) => ({ sleep: span(q, 0.8, 3.0) }), { face: -1 }), act(R.hen3, 1400, GROUND, 2.4, (q) => ({ sleep: span(q, 0.2, 2.2) }))]);
seg(3.5, 'Fluffy chicks (the daydream): peeping, hopping, pecking', () => [
  act(R.chick, 700, GROUND, 4.5, (q) => ({ peep: on(q, 0.3, 1.6, 0.2), hop: clamp((q - 1.8) / 0.8) % 1 })),
  act(R.chick2, 960, GROUND, 4.5, (q) => ({ peck: clamp((q - 0.4) / 0.9) % 1 + 0 * q, peep: on(q, 1.8, 3.2, 0.2) }), { face: -1 }),
  act(R.chick, 1220, GROUND, 4.5, (q) => ({ hop: clamp((q - 0.3) / 0.8) % 1, peep: on(q, 1.5, 3.0, 0.2) }))]);

export const REEL = {
  async setup() {
    PAPER = paper(); makeProps();
    R.molly = makeMilkmaid(2); R.blue = makeMilkmaid(2, 71, { dress: 'blue' }); R.mum = makeMother(2); R.cow = makeCow(2);
    R.hen1 = makeHen(2, 41, 'brown'); R.hen2 = makeHen(2, 42, 'speckled'); R.hen3 = makeHen(2, 43, 'white'); R.chick = makeChick(2, 47); R.chick2 = makeChick(2, 48);
  },
  duration: () => SEGS[SEGS.length - 1][1],
  frame(g, t) {
    g.drawImage(PAPER, 0, 0);
    const sg = SEGS.find(([a, b]) => t >= a && t < b) || SEGS[SEGS.length - 1];
    const [t0, t1, label, fn] = sg, k = t - t0;
    ground(g);
    for (const it of fn(k)) {
      if (it.draw) { it.draw(g, k, t, t0); continue; }
      g.save(); g.translate(it.x, it.y); g.scale(it.s * it.face, it.s);
      const poseFn = (tt) => ({ ...it.pose(tt - t0), t: tt });
      if (!it.noShadow && it.layer !== 'front') it.rig.shadow(g, poseFn(t));
      it.rig.drawAt(g, poseFn, t, { since: t0 + it.sinceK, layer: it.layer });
      g.restore();
    }
    const a = span(t, t0, t0 + 0.4) * (1 - span(t, t1 - 0.3, t1));
    g.save(); g.globalAlpha = a; g.fillStyle = '#4a3a2c'; g.font = 'italic 50px Fell, serif'; g.fillText(label, 90, 100);
    g.globalAlpha = a * 0.6; g.font = 'italic 28px Fell, serif'; g.fillText(`milkmaid characters test - ${k.toFixed(1)} s`, 92, 144); g.restore();
  },
};
