// The same lion, standing and walking (facing left). Reuses the lying lion's
// head and mane so his face and expressions are identical.
// Local units match the lying lion; ground at y = 0, origin under the middle.
import { wash, strokes, pool, ellipse, smooth, ribbon, bbox, sprite, drawSprite, shadeEdge, glaze, pencil, rng, shade, tint } from '../watercolor.js';
import { makeLion, LION_COLORS as C, pawShape, toeLines, LION_HC } from './lion.js';

const TORSO = smooth([[-170, -300], [-120, -352], [0, -350], [120, -340], [220, -356], [282, -310], [290, -240], [250, -196], [120, -186], [0, -192], [-120, -190], [-180, -226]]);
// a leg hangs from (0,0) down to the ground at y = LEG
const LEG = 200;
const FRONT = smooth([[-34, -10], [30, -10], [26, 80], [20, 150], [22, LEG - 26], [-24, LEG - 26], [-28, 150], [-34, 80]]);
const HIND = smooth([[-50, -30], [46, -30], [52, 40], [28, 100], [24, LEG - 26], [-22, LEG - 26], [-20, 110], [-46, 50]]);
const PAW = pawShape(-14, LEG - 14, 66, 20);
const TAIL = ribbon([[0, 0], [40, 30], [62, 90], [56, 150], [74, 182]], 20, 11);
const TUFT = ellipse(78, 194, 22, 26, 20);
// where the face sits on the standing body
const HEAD_AT = [-190, -330];

export function makeLionWalk(res = 1, seed = 1) {
  const lying = makeLion(res, seed);
  const s = (n) => seed * 100 + 500 + n;
  const torso = sprite(bbox(TORSO), res, (g) => {
    wash(g, TORSO, { under: true, color: C.body, opacity: 0.9, seed: s(1), bleed: 0.03 });
    glaze(g, TORSO, 60, -205, 200, 30, C.cream, 0.5);
    shadeEdge(g, TORSO, { color: C.shadow, alpha: 0.42, width: 34, dy: -14 });
    shadeEdge(g, TORSO, { color: C.bodyLight, alpha: 0.6, width: 30, dy: 14 });
    shadeEdge(g, TORSO, { edge: ellipse(200, -270, 95, 80, 30), color: C.shadow, alpha: 0.3, width: 22, dx: 10, dy: -6 });
    strokes(g, TORSO, { color: C.bodyDark, count: 480, len: 11, width: 1, alpha: 0.26, seed: s(2), dir: (x) => Math.PI + 0.2 * Math.sin(x / 70), curve: 0.25 });
    strokes(g, TORSO, { color: '#fbe3b0', count: 180, len: 10, width: 1, alpha: 0.35, seed: s(3), dir: () => Math.PI, curve: 0.25 });
    pencil(g, TORSO.slice(0, Math.floor(TORSO.length * 0.62)), { seed: s(4) });
    pencil(g, TORSO.slice(Math.floor(TORSO.length * 0.62)), { seed: s(5), alpha: 0.4 });
  }, { seed: s(6) });
  const leg = (shape, dark, sd) => sprite(bbox(shape.concat(PAW)), res, (g) => {
    const col = dark ? shade(C.body, 0.18) : C.body;
    wash(g, shape, { under: true, color: col, opacity: 0.93, seed: s(sd) });
    shadeEdge(g, shape, { color: C.shadow, alpha: dark ? 0.45 : 0.35, width: 16, dx: 6 });
    if (!dark) shadeEdge(g, shape, { color: C.bodyLight, alpha: 0.45, width: 12, dx: -6 });
    strokes(g, shape, { color: C.bodyDark, count: 60, len: 9, width: 1, alpha: 0.25, seed: s(sd + 1), dir: () => Math.PI / 2, curve: 0.2 });
    wash(g, PAW, { under: true, color: dark ? shade(C.paw, 0.14) : C.paw, opacity: 0.95, seed: s(sd + 2) });
    shadeEdge(g, PAW, { color: C.shadow, alpha: 0.3, width: 8, dy: -4 });
    pencil(g, shape, { closed: true, seed: s(sd + 3), alpha: dark ? 0.35 : 0.5 });
    pencil(g, PAW.slice(0, 40), { seed: s(sd + 4), alpha: 0.45 });
    toeLines(g, -14, LEG - 14, 66, 20, s(sd + 5));
  }, { seed: s(sd + 6) });
  const frontNear = leg(FRONT, false, 10), frontFar = leg(FRONT, true, 20);
  const hindNear = leg(HIND, false, 30), hindFar = leg(HIND, true, 40);
  const tail = sprite(bbox(TAIL.concat(TUFT)), res, (g) => {
    wash(g, TAIL, { under: true, color: C.body, opacity: 0.9, seed: s(50), bleed: 0.02 });
    shadeEdge(g, TAIL, { color: C.shadow, alpha: 0.35, width: 8, dx: 3 });
    wash(g, TUFT, { under: true, color: C.maneDeep, opacity: 0.92, seed: s(51) });
    strokes(g, TUFT, { color: '#4e1d0e', count: 30, len: 10, alpha: 0.45, seed: s(52), dir: () => 1.6 });
    pencil(g, TAIL.slice(0, Math.floor(TAIL.length / 2)), { seed: s(53), alpha: 0.45 });
  }, { seed: s(54) });

  // st: walk (cycles; null = standing still), head expression fields as for the lying lion
  function draw(g, st = {}) {
    const ph = (st.walk ?? 0) * Math.PI * 2, moving = st.walk != null;
    const swing = (o) => moving ? Math.sin(ph + o) * 0.32 : 0;
    const lift = (o) => moving ? Math.max(0, Math.cos(ph + o)) * 10 : 0;
    const bob = moving ? Math.abs(Math.sin(ph)) * 5 : (st.breath || 0) * 1.5;
    g.save();
    pool(g, 50, 2, 330, 26, '#4a3020', 0.25);
    const limb = (spr, x, o, near) => {
      g.save(); g.translate(x, -LEG - bob * 0.3 - lift(o)); g.rotate(swing(o)); drawSprite(g, spr); g.restore();
    };
    limb(frontFar, -70, Math.PI, false); limb(hindFar, 222, 0, false);
    g.save(); g.translate(270, -300 - bob); g.rotate(Math.sin((st.t || 0) * 1.4) * 0.12 + 0.1); drawSprite(g, tail); g.restore();
    limb(hindNear, 190, Math.PI, true); limb(frontNear, -110, 0, true);
    g.save(); g.translate(0, -bob); drawSprite(g, torso); g.restore();
    g.save();
    g.translate(HEAD_AT[0] - LION_HC[0], HEAD_AT[1] - LION_HC[1] - bob * 1.2 + (st.headDY || 0));
    lying.drawHead(g, st);
    g.restore();
    g.restore();
  }
  return { draw, lying };
}
