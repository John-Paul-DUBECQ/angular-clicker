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
  name: 'Amélioration des chances de critique',
  description: 'Augmente les chances de coups critiques. +2%',
  imageUrl: '',
  levelRequired: 10,
  criticalChance: 0.02,
};

export const upgradeCriticalHitRate2: CriticalHitUpgrade = {
  id: 'upgrade-critical-hit-rate-2',
  name: 'Amélioration des chances de critique',
  description: 'Augmente les chances de coups critiques. +2%',
  imageUrl: '',
  levelRequired: 25,
  criticalChance: 0.02,
};

export const upgradeCriticalHitRate3: CriticalHitUpgrade = {
  id: 'upgrade-critical-hit-rate-3',
  name: 'Amélioration des chances de critique',
  description: 'Augmente les chances de coups critiques. +2%',
  imageUrl: '',
  levelRequired: 40,
  criticalChance: 0.02,
};
export const upgradeCriticalHitDamage1: CriticalHitUpgrade = {
  id: 'upgrade-critical-hit-damage-1',
  name: 'Amélioration des dégâts critique',
  description: 'Augmente les dégâts des coups critiques. +50% de dégâts',
  imageUrl: '',
  levelRequired: 15,
  damageMultiplier: 1.5,
};

export const upgradeCriticalHitDamage2: CriticalHitUpgrade = {
  id: 'upgrade-critical-hit-damage-2',
  name: 'Amélioration des dégâts critique',
  description: 'Augmente les dégâts des coups critiques. +50% de dégâts',
  imageUrl: '',
  levelRequired: 35,
  damageMultiplier: 1.5,
};

export const upgradeCriticalHitDamage3: CriticalHitUpgrade = {
  id: 'upgrade-critical-hit-damage-3',
  name: 'Amélioration des dégâts critique',
  description: 'Augmente les dégâts des coups critiques. +50% de dégâts',
  imageUrl: '',
  levelRequired: 50,
  damageMultiplier: 1.5,
};

/** Toutes les améliorations coup critique (ordre par levelRequired). */
export const CRITICAL_HIT_UPGRADES: CriticalHitUpgrade[] = [
  upgradeCriticalHitRate1,
  upgradeCriticalHitDamage1,
  upgradeCriticalHitRate2,
  upgradeCriticalHitDamage2,
  upgradeCriticalHitRate3,
  upgradeCriticalHitDamage3,
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
