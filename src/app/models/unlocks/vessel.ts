import { WorkerAutoData } from "../worker-auto-model";
import { WorkerUnlock } from "./worker-unlock.model";

export const VESSEL_WORKER_INDEX = 7;

export const VESSEL_LEVEL_REQUIRED = 1;

/** Niveau du worker (Alchimiste) à partir duquel chaque monstre peut apparaître. */
export const VESSEL_LEVELS_BY_VESSEL_ID: Record<string, number> = {
  vessel1: 1,
  vessel2: 1,
};

export function getLevelRequiredForVessel(vesselId: string): number | undefined {
  return VESSEL_LEVELS_BY_VESSEL_ID[vesselId];
}

export interface VesselUnlockDefinition extends WorkerUnlock {
  /** Bonus dégâts vs vessels (pour plus tard). */
  damageMultiplier?: number;
  /** Réduit l'intervalle de spawn (ex. 0.85 = 15% de vaisseaux en plus). */
  spawnIntervalFactor?: number;
  /** Multiplicateur sur les récompenses or/buff (ex. 1.25 = +25%). */
  rewardMultiplier?: number;
}

/** Fais apparaître des vaisseaux qui traversent la colonne centrale. */
export const vesselUnlockDefinition: VesselUnlockDefinition = {
  id: 'vessel',
  name: 'Vessels',
  description: 'Des vaisseaux traversent l\'écran. Clique pour des récompenses.',
  imageUrl: 'assets/imgUpgrades/shadocks/shadock1.png',
  levelRequired: VESSEL_LEVEL_REQUIRED,
};

export const VESSEL_UPGRADES: VesselUnlockDefinition[] = [
  {
    id: 'vessel-spawn-1',
    name: 'Plus de vaisseaux',
    description: 'Les vaisseaux apparaissent plus souvent.',
    imageUrl: 'assets/imgUpgrades/shadocks/shadock1.png',
    levelRequired: 3,
    spawnIntervalFactor: 0.85,
  },
  {
    id: 'vessel-spawn-2',
    name: 'Encore plus de vaisseaux',
    description: 'Fréquence de vaisseaux encore augmentée.',
    imageUrl: 'assets/imgUpgrades/shadocks/shadock1.png',
    levelRequired: 6,
    spawnIntervalFactor: 0.75,
  },
  {
    id: 'vessel-reward-1',
    name: 'Récompenses améliorées',
    description: 'Or et bonus des vaisseaux augmentés.',
    imageUrl: 'assets/imgUpgrades/shadocks/shadock1.png',
    levelRequired: 4,
    rewardMultiplier: 1.4,
  },
  {
    id: 'vessel-reward-2',
    name: 'Récompenses supérieures',
    description: 'Encore plus d\'or et de bonus.',
    imageUrl: 'assets/imgUpgrades/shadocks/shadock1.png',
    levelRequired: 8,
    rewardMultiplier: 1.5,
  },
];

export function isVesselUnlocked(
  workers: WorkerAutoData[],
  workersAvailable: WorkerAutoData[]
): boolean {
  if (VESSEL_WORKER_INDEX < 0 || VESSEL_WORKER_INDEX >= workersAvailable.length) return false;
  const w = workersAvailable[VESSEL_WORKER_INDEX];
  if (!w || !workers.includes(w)) return false;
  return w.level >= VESSEL_LEVEL_REQUIRED;
}

export interface VesselUpgradeStats {
  /** Facteur sur l'intervalle de spawn (1 = base, 0.7 = 30% plus de vaisseaux). */
  spawnIntervalFactor: number;
  /** Multiplicateur sur les récompenses (1 = base, 2.1 = 2.1x or/buff). */
  rewardMultiplier: number;
}

export function getVesselUpgradeStats(
  workers: WorkerAutoData[],
  workersAvailable: WorkerAutoData[]
): VesselUpgradeStats {
  let spawnIntervalFactor = 1;
  let rewardMultiplier = 1;
  if (VESSEL_WORKER_INDEX < 0 || VESSEL_WORKER_INDEX >= workersAvailable.length) {
    return { spawnIntervalFactor, rewardMultiplier };
  }
  const geometer = workersAvailable[VESSEL_WORKER_INDEX];
  if (!geometer || !workers.includes(geometer)) return { spawnIntervalFactor, rewardMultiplier };
  const level = geometer.level;
  for (const u of VESSEL_UPGRADES) {
    const req = u.levelRequired ?? 0;
    if (level >= req) {
      if (u.spawnIntervalFactor != null) spawnIntervalFactor *= u.spawnIntervalFactor;
      if (u.rewardMultiplier != null) rewardMultiplier *= u.rewardMultiplier;
    }
  }
  return { spawnIntervalFactor, rewardMultiplier };
}
