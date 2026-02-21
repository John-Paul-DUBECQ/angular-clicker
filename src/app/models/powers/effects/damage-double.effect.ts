import { PowerEffect } from '../power-effect.types';

/** Id du pouvoir "마법" (double dégâts 1 min). */
export const DAMAGE_DOUBLE_POWER_ID = 'power';

const DURATION_SECONDS = 60;
const DAMAGE_MULTIPLIER = 2;

/** Effet : augmente les dégâts x2 pendant 1 minute. */
export const damageDoubleEffect: PowerEffect = (context) => {
  context.setDamageBuff(DAMAGE_MULTIPLIER, DURATION_SECONDS);
};
