import { PowerEffect } from '../power-effect.types';

/** Id du pouvoir qui ajoute du temps au combat en cours. */
export const MONSTER_TIME_POWER_ID = 'monster-time';

const EXTRA_SECONDS = 30;

/** Effet : ajoute 30 secondes au temps imparti du combat actuel. */
export const monsterTimeEffect: PowerEffect = (context) => {
  context.addMonsterTime(EXTRA_SECONDS);
};
