import { WorkerUnlock } from './worker-unlock.model';
import type { WorkerAutoData } from '../worker-auto-model';

export interface CriticalHitUnlock extends WorkerUnlock {
  damageMultiplier: number;
  criticalChance: number;
}

export interface CriticalHitUpgrade extends WorkerUnlock {
  damageMultiplier?: number;
  criticalChance?: number;
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

export const upgradeCriticalHitRate1: CriticalHitUpgrade = {
  id: 'upgrade-critical-hit-rate-1',
  name: 'Amélioration du coup critique',
  description: 'Augmente les chances de coups critiques.',
  imageUrl: '',
  levelRequired: 10,
  criticalChance: 0.02,
};

export const upgradeCriticalHitDamage1: CriticalHitUpgrade = {
  id: 'upgrade-critical-hit-damage-1',
  name: 'Amélioration du coup critique',
  description: 'Augmente les dégâts des coups critiques.',
  imageUrl: '',
  levelRequired: 25,
  damageMultiplier: 1.5,
};

export const upgradeCriticalHitRate2: CriticalHitUpgrade = {
  id: 'upgrade-critical-hit-rate-2',
  name: 'Amélioration du coup critique',
  description: 'Augmente les chances de coups critiques.',
  imageUrl: '',
  levelRequired: 50,
  criticalChance: 0.02,
};

export const upgradeCriticalHitDamage2: CriticalHitUpgrade = {
  id: 'upgrade-critical-hit-damage-2',
  name: 'Amélioration du coup critique',
  description: 'Augmente les dégâts des coups critiques.',
  imageUrl: '',
  levelRequired: 100,
  damageMultiplier: 1.5,
};

/** Toutes les améliorations coup critique (ordre par levelRequired). */
export const CRITICAL_HIT_UPGRADES: CriticalHitUpgrade[] = [
  upgradeCriticalHitRate1,//10
  upgradeCriticalHitDamage1,//25
  upgradeCriticalHitRate2,//50
  upgradeCriticalHitDamage2,//100
];

export interface CriticalHitStats {
  totalChance: number;
  totalMultiplier: number;
}

/**
 * Calcule la chance totale et le multiplicateur total des coups critiques
 * selon le niveau du Mineur (base + toutes les améliorations débloquées).
 */
export function getCriticalHitStats(minerLevel: number): CriticalHitStats {
  let totalChance = criticalHitUnlockDefinition.criticalChance;
  let totalMultiplier = criticalHitUnlockDefinition.damageMultiplier;

  for (const upgrade of CRITICAL_HIT_UPGRADES) {
    if (minerLevel < (upgrade.levelRequired ?? 0)) continue;
    if (upgrade.criticalChance != null) totalChance += upgrade.criticalChance;
    if (upgrade.damageMultiplier != null) totalMultiplier *= upgrade.damageMultiplier;
  }

  return { totalChance, totalMultiplier };
}

export function isCriticalHitUnlocked(
  workers: WorkerAutoData[],
  workersAvailable: WorkerAutoData[]
): boolean {
  if (MINER_WORKER_INDEX < 0 || MINER_WORKER_INDEX >= workersAvailable.length) return false;
  const miner = workersAvailable[MINER_WORKER_INDEX];
  if (!miner || !workers.includes(miner)) return false;
  return miner.level >= CRITICAL_HIT_LEVEL_REQUIRED;
}
