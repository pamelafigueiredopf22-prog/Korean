import { makeMilkmaid } from '../../engine/characters/milkmaid.js';
export async function SETUP() { return { molly: makeMilkmaid(2) }; }
export const POSES = [{ t: 1 }, { t: 1, walk: 0.3, walkAmt: 1 }, { t: 1, pailOn: 'head', toss: 0.5 }, { t: 1, point: 1 }, { t: 1, hug: 1 },
  { t: 1, twirl: 0.52 }, { t: 1, wave: 1, palm: 1 }, { t: 1, clasp: 1 }, { t: 1, daydream: 1 }, { t: 1, reach: 1 }];
POSES.S = 1.15;
