import { WorkerAutoData } from "../worker-auto-model";
import { WorkerUnlock } from "./worker-unlock.model";
import { UnlockContext, UnlockMethod } from './unlock-method';

export const MONSTER_WORKER_INDEX = 6;

export const MONSTER_LEVEL_REQUIRED = 1;

export interface MonsterUnlockDefinition extends WorkerUnlock {
  /** Bonus dégâts vs monstres (pour plus tard). */
  damageMultiplier?: number;
}

/** Fais apparaître un monstre à la place du clicker : barre d'HP, à tuer dans un temps imparti. */
export const monsterUnlockDefinition: MonsterUnlockDefinition = {
  id: 'monster',
  name: 'Monstres',
  description: 'Un monstre apparaît à la place du clicker. Tue-le dans le temps imparti.',
  imageUrl: 'assets/img/shadocks/shadock1.png',
  levelRequired: MONSTER_LEVEL_REQUIRED,
  unlockMethod: UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, MONSTER_LEVEL_REQUIRED),
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
  const context: UnlockContext = {
    clicks: 0,
    getWorkerLevel: (workerIndex) => workersAvailable[workerIndex]?.level ?? null,
  };
  return monsterUnlockDefinition.unlockMethod?.isUnlocked(context) ?? false;
}
