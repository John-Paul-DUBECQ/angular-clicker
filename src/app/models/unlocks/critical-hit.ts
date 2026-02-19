import { WorkerUnlock } from './worker-unlock.model';
import type { WorkerAutoData } from '../worker-auto-model';

export interface CriticalHitUnlock extends WorkerUnlock {
  damageMultiplier: number;
  criticalChance: number;
}

export const MINER_WORKER_INDEX = 2;

export const CRITICAL_HIT_LEVEL_REQUIRED = 1;

export const criticalHitUnlockDefinition: CriticalHitUnlock = {
  id: 'critical-hit',
  name: 'Coup critique',
  description: 'Un coup critique : augmente les dégâts.',
  imageUrl: '',
  levelRequired: CRITICAL_HIT_LEVEL_REQUIRED,
  damageMultiplier: 2,
  criticalChance: 0.01,
};

export function isCriticalHitUnlocked(
  workers: WorkerAutoData[],
  workersAvailable: WorkerAutoData[]
): boolean {
  if (MINER_WORKER_INDEX < 0 || MINER_WORKER_INDEX >= workersAvailable.length) return false;
  const miner = workersAvailable[MINER_WORKER_INDEX];
  if (!miner || !workers.includes(miner)) return false;
  return miner.level >= CRITICAL_HIT_LEVEL_REQUIRED;
}
