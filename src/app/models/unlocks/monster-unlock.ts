import { WorkerAutoData } from "../worker-auto-model";
import { WorkerUnlock } from "./worker-unlock.model";

export const MONSTER_WORKER_INDEX = 6;

export const MONSTER_LEVEL_REQUIRED = 1;

/** Niveau du worker (Alchimiste) à partir duquel chaque monstre peut apparaître. */
export const MONSTER_LEVELS_BY_MONSTER_ID: Record<string, number> = {
  monster1: 1,
  monster2: 5,
};

export function getLevelRequiredForMonster(monsterId: string): number | undefined {
  return MONSTER_LEVELS_BY_MONSTER_ID[monsterId];
}

export interface MonsterUnlockDefinition extends WorkerUnlock {
  /** Bonus dégâts vs monstres (pour plus tard). */
  damageMultiplier?: number;
}

/** Fais apparaître un monstre à la place du clicker : barre d'HP, à tuer dans un temps imparti. */
export const monsterUnlockDefinition: MonsterUnlockDefinition = {
  id: 'monster',
  name: 'Monstres',
  description: 'Un monstre apparaît à la place du clicker. Tue-le dans le temps imparti.',
  imageUrl: 'assets/imgUpgrades/shadocks/shadock1.png',
  levelRequired: MONSTER_LEVEL_REQUIRED,
};

export const MONSTER_UPGRADES: MonsterUnlockDefinition[] = [
 
];

export function isMonsterUnlocked(
  workers: WorkerAutoData[],
  workersAvailable: WorkerAutoData[]
): boolean {
  if (MONSTER_WORKER_INDEX < 0 || MONSTER_WORKER_INDEX >= workersAvailable.length) return false;
  const w = workersAvailable[MONSTER_WORKER_INDEX];
  if (!w || !workers.includes(w)) return false;
  return w.level >= MONSTER_LEVEL_REQUIRED;
}
