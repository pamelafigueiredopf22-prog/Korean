// MOLLY the milkmaid (about eleven): a round friendly face with freckles and rosy cheeks, small dark oval eyes with a
// highlight, chestnut hair parted in the middle and done in two plaits with ribbons, a sage-green country dress with a
// round white collar and rolled-up sleeves, a white pinafore apron, cream stockings and sturdy little brown boots.
// Built on folk3 (one real 3D viewpoint per frame: see folk3.js for how the head, clothes and limbs are projected).
//
//   const molly = makeMilkmaid(res, seed, look)      look: { dress: 'sage' | 'blue' (the dreamed-of new dress, with
//                                                     ribbons), kerchief: true (a red spotted kerchief over the crown) }
//   molly.draw(g, st, o) / molly.drawAt(g, poseFn, t, o)   o.since (as mice3), o.layer: 'all' | 'back' | 'front'
//                                    ('front' = only the near arm and anything in that hand: draw another character
//                                    between 'back' and 'front' for a hug)
//   molly.STRIDE                     travel per walk cycle: walk = distance / STRIDE, the root moves LEFT by distance
//   molly.pailAt(poseFn, t, o) / molly.pail(st, o) -> { x, y (bottom centre of the pail), angle (rad on the page,
//                                    + = clockwise), milk, at: 'head' | 'hand' | 'ground' }  -- release it into a fall
//                                    at TOSS_RELEASE: from then on set pailOn: 'none' and draw it yourself with
//                                    molly.drawPail(g, x, y, angle, milk, { bail })  (same picture, page space)
//   molly.headAt / mouthAt / handsAt ({near, far}) / feetAt ([{x, y, planted, near}]) / lapAt(st) / quiltEdgeAt
//        o = { x, y, scale, face } gives page coordinates through your transform translate(x, y) scale(face*scale, scale)
//   molly.shadow(g, st, height)
//   exports: makeMilkmaid, STRIDE, walkRest, TOSS_RELEASE, PAIL (pail size: H 52 tall, R1 31 rim radius)
//
// ---- state (numbers; ease them. Weights 0..1; PHASES run 0 -> 1 once (<= 0 or >= 1 = not happening))
//   t, life (idle: breathing, blinks, glances, a little sway; plaits and skirt move by themselves)
//   mouth 0..1 (talking: feed the voice envelope), smile (default 0.6; < 0.25 turns the mouth down), happy (smiling
//   closed eyes), sad (worried brows, mouth down, eyes lowered), eyeBig, browUp, gaze -1..1 (eyes down / up),
//   look -1..1 (eyes toward / away), eye (openness; blinks are automatic, noBlink), tear 0..1 (a tear runs down)
//   headTurn -1..1 (+ = toward us, - = more profile), nod (rad, + = chin up), headTilt (rad, ear to shoulder)
//   gasp 0..1      oh! an O mouth, big eyes, brows up, hands fly to the cheeks
//   turn 0..1      turn round through the true front view (head leads); at 1 = the mirrored picture: swap, turn 0
//   front 0..1     turn to face us and stay
//   walk (cycles), walkAmt 0..1;  skip 0..1 (happy skipping: a hop on each step, arms swinging high, plaits bouncing);
//                  sadWalk 0..1 (slow, head down, shoulders low);  bounce 0..1 (happy bouncing on the spot)
//   pailOn 'head' | 'hand' | 'ground' | 'none' (default)
//     on the head: pailHands 0..2 (0 balanced, 1 the near hand steadies it, 2 both), the pail sways with the walk;
//     pailTilt (rad), milkLevel 0..1.  In the hand: hangs from the near hand and swings.  On the ground: in front.
//   toss 0..1      the head toss: 0-0.34 a smug little chin tuck (eyes closed, proud), 0.34-0.5 chin up, head
//                  flicked back and to the side, plaits fly, the hand leaves the pail and the pail tips; it leaves the
//                  head at TOSS_RELEASE (0.44); then a proud hold and a settle. tossSurprise 0..1 adds wide eyes after.
//   daydream 0..1  eyes up, dreamy smile, head tilted, hands clasped under the chin, a slow sway
//   twirl 0..1     one gentle full turn on the spot (as if in a new dress): steps round, the skirt flares, hands hold
//                  the skirt out, plaits fly out; ends exactly where it began
//   sit 0..1       sit down (seatH, default 62: the milking stool; stool: true draws the little stool)
//   milk 0..1      milking (sitting): hands forward working in turn (milkPhase cycles, default from t)
//   stroke 0..1    the near hand strokes a nose in front (strokeF, strokeY: body-local target, default 74, -232)
//   wave 0..1      the near hand waves;  hug 0..1  arms forward round someone in front;  clasp 0..1 hands together
//   reach 0..1     the near hand reaches forward
//   bed 1          in bed (draw her with the root on the mattress top at her hips): lie 0..1 (sitting up -> lying back
//                  on the pillow), sleep 0..1 (eyes closed, slow breathing); nightgown: true (also usable standing)
import { makeFolk, walkRest, TOSS_RELEASE, PAIL, hairStrands as strands, PARTING } from './folk3.js';
export { walkRest, TOSS_RELEASE, PAIL };

export const STRIDE = 140;
const HAIRLINE = [[0, -0.5], [0.35, -0.4], [0.75, -0.22], [1.05, -0.02], [1.25, 0.16], [1.42, 0.0], [1.62, -0.1], [1.8, 0.18], [2.05, 0.5], [2.35, 0.66], [Math.PI, 0.7]];
export function makeMilkmaid(res = 2, seed = 71, look = {}) {
  const blue = look.dress === 'blue';
  const SP = {
    seed: seed % 7, HR: 43, hairR: 1.11, yaw: 0.85, headYaw: 0.62,
    col: { dress: blue ? '#8fa6c8' : '#9aae8c', apron: '#f6f0e4', skin: '#f3d6c0', cheek: '#ec9a8a', hair: '#9a5a32', sock: '#efe4d0', boot: '#7a5236',
      ribbon: blue ? '#e8a0b0' : '#d8706a', collar: '#f8f2e6', kerchief: look.kerchief ? '#c8604c' : null },
    boxBody: [-110, -290, 110, 10],
    printDress: blue ? (g, sh) => { // the new dress: a soft blue with tiny white flowers
      for (let y = -290; y < 10; y += 16) for (let x = -110 + ((y / 16) % 2) * 8; x < 110; x += 16) { g.fillStyle = 'rgba(255,252,245,0.8)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(x + Math.cos(k * 1.57) * 1.8, y + Math.sin(k * 1.57) * 1.8, 1.2, 0, 7); g.fill(); } }
    } : null,
    neck: [0, 0, -257], neckLen: 8, neckW: 13,
    hairline: HAIRLINE, strands: strands(2.2, 0.52), parting: PARTING,
    capLine: look.kerchief ? [[0, -0.66], [0.8, -0.56], [1.3, -0.34], [1.8, -0.12], [2.4, 0.16], [Math.PI, 0.3]] : null, capR: 1.13, capOn: !!look.kerchief,
    plaits: true, plaitAz: 2.2, plaitEl: 0.52, plaitL: 80, plaitW: 12,
    eyeAz: 0.37, eyeEl: 0.07, eyeR: [4.1, 5.5], lashes: true, browAz: [0.2, 0.52], browEl: -0.17, browW: 0.85,
    noseEl: 0.26, mouthEl: 0.5, mouthW: 16, mouthDeep: 0.85, earAz: 1.6, earEl: 0.16, earS: 1.0,
    freckles: [[0.18, 0.2], [0.27, 0.25], [0.36, 0.21], [0.45, 0.27], [0.24, 0.31], [0.4, 0.33], [0.53, 0.24]],
    // body (body-local 3D: [forward, her left, down]); rings [y, half-width, half-depth]
    torso: [[-259, 20, 13], [-252, 34, 18], [-240, 37, 20], [-222, 34, 20], [-206, 31, 19], [-194, 30, 19]],
    sh: [-1, 30, -248], armA: 52, armB: 47, armW: 10.5, hand: 13, sleeve: 0.62, restOut: 40, skirtOut: 60,
    hug: [46, 22, -226], clasp: [26], milkAt: [66, 10, -196], giveAt: [54, 0, -228],
    waistY: -194, skirtTop: [-196, 31, 21], skirtHem: [-100, 60, 52], folds: 9, lapF: 48, apron: [1.0, 0.86], bib: [0.5, -240], lace: true,
    hipY: -150, hipW: 13, footW: 11, ankleH: 12, toeL: 21, bootW: 8, thigh: 72, shin: 69, legW: 11,
    STRIDE, LIFT: 18, hopH: 16, sitFoot: 74, kneelDrop: 50, farLate: 0, pailSeat: 1.13, groundPail: 60,
    bed: true, bedLen: 210, shadowW: 70,
  };
  const r = makeFolk(res, seed, SP);
  return r;
}
