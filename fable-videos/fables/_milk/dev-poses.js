import { makeMother } from '../../engine/characters/farmwife.js';
export async function SETUP() { return { mum: makeMother(2) }; }
export const POSES = [{ t: 1, rig: 'mum', tuck: 1, tuckAt: [120, 0, -250] }, { t: 1, rig: 'mum', tuck: 1, bend: 1, tuckAt: [120, 0, -250] }, { t: 1, rig: 'mum', reach: 1 }, { t: 1, rig: 'mum', brush: 1 }];
POSES.S = 0.9; POSES.cols = 4;
