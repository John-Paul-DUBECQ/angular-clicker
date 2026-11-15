import { WorkerAutoData } from "../worker-auto-model";
import { WorkerUnlock } from "./worker-unlock.model";
import { listPower } from "../powers/list-power";
import { POWER_WORKER_INDEX } from './worker-indexes';

export { POWER_WORKER_INDEX } from './worker-indexes';

export const POWER_LEVEL_REQUIRED = 1;

export function getLevelRequiredForPower(powerId: string): number | undefined {
  return listPower
    .find((power) => power.id === powerId)
    ?.unlockMethod
    ?.getWorkerLevelRequirement(POWER_WORKER_INDEX);
}

/** Améliorations mana (max + régénération) débloquées aux niveaux du Magicien. */
export interface PowerUnlockDefinition extends WorkerUnlock {
  manaMax?: number; // augmente la mana max
  manaRegen?: number; // augmente la régénération de mana par tick
}

export const powerUnlockDefinition: PowerUnlockDefinition = {
  id: 'power',
  name: '마술',
  description: 'Vous donne accès à la zone des pouvoirs/mana.',
  imageUrl: 'assets/img/shadocks/shadock1.png',
  levelRequired: POWER_LEVEL_REQUIRED,
  manaMax: 0,
  manaRegen: 0,
};

/** Améliorations mana débloquées quand le Magicien monte de niveau. */
export const POWER_MANA_UPGRADES: PowerUnlockDefinition[] = [
  {
    id: 'power-mana-max-1',
    name: 'Réserves de mana',
    description: '+50 mana max.',
    imageUrl: 'assets/img/shadocks/shadock1.png',
    levelRequired: 5,
    manaMax: 50,
  },
  {
    id: 'power-mana-regen-1',
    name: 'Régénération',
    description: '+0.02 mana/s de régénération.',
    imageUrl: 'assets/img/shadocks/shadock1.png',
    levelRequired: 15,
    manaRegen: 0.02,
  },
  {
    id: 'power-mana-max-2',
    name: 'Réserves de mana II',
    description: '+100 mana max.',
    imageUrl: 'assets/img/shadocks/shadock1.png',
    levelRequired: 30,
    manaMax: 100,
  },
  {
    id: 'power-mana-regen-2',
    name: 'Régénération II',
    description: '+0.05 mana/s de régénération.',
    imageUrl: 'assets/img/shadocks/shadock1.png',
    levelRequired: 50,
    manaRegen: 0.05,
  },
  {
    id: 'power-mana-max-3',
    name: 'Réserves de mana III',
    description: '+200 mana max.',
    imageUrl: 'assets/img/shadocks/shadock1.png',
    levelRequired: 100,
    manaMax: 200,
  },
  {
    id: 'power-mana-regen-3',
    name: 'Régénération III',
    description: '+0.1 mana/s de régénération.',
    imageUrl: 'assets/img/shadocks/shadock1.png',
    levelRequired: 150,
    manaRegen: 0.1,
  },
];

export interface ManaStatsFromPower {
  manaMax: number;
  manaRegen: number;
}

/** Bonus mana (max + régénération) selon le niveau du Magicien (unlocks débloqués). */
export function getManaStatsFromPowerWorker(magicienLevel: number): ManaStatsFromPower {
  let manaMax = powerUnlockDefinition.manaMax ?? 0;
  let manaRegen = powerUnlockDefinition.manaRegen ?? 0;
  for (const upgrade of POWER_MANA_UPGRADES) {
    if (magicienLevel < (upgrade.levelRequired ?? 0)) continue;
    if (upgrade.manaMax != null) manaMax += upgrade.manaMax;
    if (upgrade.manaRegen != null) manaRegen += upgrade.manaRegen;
  }
  return { manaMax, manaRegen };
}

export function isPowerUnlocked(
  workers: WorkerAutoData[],
  workersAvailable: WorkerAutoData[]
): boolean {
  if (POWER_WORKER_INDEX < 0 || POWER_WORKER_INDEX >= workersAvailable.length) return false;
  const power = workersAvailable[POWER_WORKER_INDEX];
  if (!power || !workers.includes(power)) return false;
  return power.level >= POWER_LEVEL_REQUIRED;
}

/** Paliers "déblocage de sort" pour le Magicien, où niveau requis > magicienLevel, triés par niveau. */
export function getUpcomingPowerUnlockTiers(workerIndex: number, workerLevel: number): WorkerUnlock[] {
  return listPower
    .filter((power) => power.unlockMethod != null)
    .map((power) => ({
      power,
      levelRequired: power.unlockMethod?.getWorkerLevelRequirement(workerIndex),
    }))
    .filter((entry) => entry.levelRequired != null && entry.levelRequired > workerLevel)
    .map(({ power, levelRequired }) => ({
      id: `power-unlock-${power.id}`,
      name: power.name,
      description: power.description,
      imageUrl: power.imageUrl ?? '',
      levelRequired: levelRequired!,
      unlockMethod: power.unlockMethod,
      unlockType: 'spell' as const,
      manaCost: power.manaCost,
    }))
    .sort((a, b) => (a.levelRequired ?? 0) - (b.levelRequired ?? 0));
}
