import { PowerEffect } from '../power-effect.types';

/** Id du pouvoir qui force le spawn du prochain mob (à 0 mana pour les tests). */
export const SPAWN_MOB_POWER_ID = 'spawn-mob';

/** Effet : tue le mob actuel et fait apparaître le suivant immédiatement. */
export const spawnMobEffect: PowerEffect = (context) => {
  context.spawnMonster();
};
