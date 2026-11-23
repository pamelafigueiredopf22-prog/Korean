// MOLLY'S MOTHER, the farm wife: plump and rosy, kind small eyes and a warm smile, brown hair under a frilled white
// mob cap, a rose-pink print dress with a white collar and buttons down the front, a long white apron, sleeves rolled
// to the elbow, dark boots peeping under the long skirt. Built on folk3 (see folk3.js / milkmaid.js for the API).
//
//   const mum = makeMother(res, seed)
//   mum.draw / drawAt / pailAt / pail / headAt / mouthAt / handsAt / feetAt / lapAt / shadow   as Molly (milkmaid.js)
//   mum.STRIDE (walk = distance / STRIDE)
//
// ---- state (as Molly's, plus)
//   idle life, mouth (talking), smile (default 0.7: kind), happy, sad, eyeBig, browUp, gaze, look, headTurn, nod,
//   headTilt, nodding 0..1 (a gentle nodding, yes yes), turn / front, walk + walkAmt
//   pailOn 'hand' + give 0..1   handing the pail over: both hands forward holding it by the handle (giveY: body-local
//                               height of the hands, default -300)
//   wave 0..1                    waving goodbye (from the door)
//   kneel 0..1                   kneel down to Molly's height (the skirt pools on the floor); bend 0..1 bend forward
//   comfort 0..1                 the comforting hug: arms round someone in front (use with kneel); hug 0..1 a hug
//   brush 0..1                   brushing a tear: the near hand to brushAt ([forward, her left, down], body-local:
//                                default in front of her at Molly's cheek height when kneeling) with small strokes
//   tuck 0..1                    tucking into bed: hands smoothing the quilt at tuckAt (body-local, default [80, 0, -40]);
//                                use with bend
//   sit 0..1                     sit on a chair (seatH, default 62 -> pass ~110 for a chair); lapAt(st) for Molly
//   clasp 0..1                   hands folded in front
import { makeFolk, walkRest, PAIL, hairStrands, PARTING } from './folk3.js';
export { walkRest, PAIL };

export const STRIDE = 170;

export function makeMother(res = 2, seed = 83) {
  const SP = {
    seed: seed % 7, HR: 48, hairR: 1.06, yaw: 0.85, headYaw: 0.6,
    col: { dress: '#c99490', apron: '#f6f0e4', skin: '#f1cdb2', cheek: '#e8857a', hair: '#6e4630', sock: '#5a4a40', boot: '#5a3c2a', ribbon: '#c87a7a', collar: '#f8f2e6', cap: '#f8f4ea' },
    boxBody: [-130, -380, 130, 10],
    printDress: (g) => { // little cream sprigs and dots
      for (let y = -380; y < 10; y += 15) for (let x = -130 + ((y / 15) % 2) * 7.5; x < 130; x += 15) {
        g.fillStyle = 'rgba(252,244,232,0.85)'; g.beginPath(); g.arc(x, y, 1.6, 0, 7); g.fill();
        g.fillStyle = 'rgba(120,150,100,0.55)'; g.beginPath(); g.ellipse(x + 3, y + 2.5, 1.8, 0.9, 0.6, 0, 7); g.fill(); }
    },
    def: { smile: 0.7, strokeF: 90, strokeY: -320 },
    neck: [0, 0, -352], neckLen: 8, neckW: 17,
    hairline: [[0, -0.56], [0.45, -0.46], [0.85, -0.3], [1.15, -0.08], [1.35, 0.1], [1.5, -0.04], [1.72, -0.02], [2.0, 0.32], [2.4, 0.5], [Math.PI, 0.55]],
    strands: hairStrands(2.95, -0.1), parting: PARTING,
    capLine: [[0, -0.74], [0.7, -0.66], [1.3, -0.44], [1.9, -0.14], [2.5, 0.14], [Math.PI, 0.26]], capR: 1.2, capOn: true, frill: 3.4, capBow: '#c87a7a',
    plaits: false,
    eyeAz: 0.36, eyeEl: 0.05, eyeR: [3.7, 4.6], lashes: true, browAz: [0.18, 0.52], browEl: -0.2, browW: 1.0,
    noseEl: 0.27, mouthEl: 0.52, mouthW: 17, mouthDeep: 0.9, earAz: 1.6, earEl: 0.14, earS: 1.1,
    freckles: null,
    torso: [[-354, 25, 18], [-346, 50, 27], [-332, 55, 36], [-312, 54, 38], [-294, 51, 36], [-281, 50, 35]],
    sh: [-2, 46, -341], armA: 72, armB: 66, armW: 17, hand: 18, sleeve: 0.7, restOut: 60, skirtOut: 84, armK: 1.4,
    hug: [70, 28, -312], clasp: [40], milkAt: [90, 14, -280], giveAt: [74, 0, -300],
    waistY: -281, skirtTop: [-283, 52, 37], skirtHem: [-22, 96, 86], folds: 11, lapF: 70, apron: [1.0, 0.9], bib: null, lace: false,
    buttons: [-338, -324, -310, -296],
    hipY: -225, hipW: 18, footW: 15, ankleH: 14, toeL: 26, bootW: 10, thigh: 108, shin: 106, legW: 15,
    STRIDE, LIFT: 18, hopH: 10, sitFoot: 104, kneelDrop: 118, farLate: 0, pailSeat: 1.2, longSkirt: true,
    bed: false, shadowW: 95,
  };
  return makeFolk(res, seed, SP);
}
