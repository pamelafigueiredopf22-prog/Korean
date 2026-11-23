import { makeMilkmaid } from '../../engine/characters/milkmaid.js';
export async function SETUP() { return { molly: makeMilkmaid(2) }; }
export const POSES = [0.3, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.8, 0.9].map((tw) => ({ t: 0, twirl: tw, life: 0 }));
POSES.S = 1.0;
