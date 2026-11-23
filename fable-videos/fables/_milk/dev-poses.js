import { makeCow } from '../../engine/characters/cow.js';
export async function SETUP() { return { cow: makeCow(2) }; }
export const POSES = [{ t: 1, rig: 'cow', life: 0 }, { t: 1, rig: 'cow', walk: 0.3, walkAmt: 1 }, { t: 1, rig: 'cow', lie: 1, sleep: 1 }, { t: 1, rig: 'cow', headTurn: 1, life: 0 }];
POSES.S = 0.95; POSES.cols = 2; POSES.Y = 470;
