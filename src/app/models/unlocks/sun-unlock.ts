import { WorkerUnlock } from './worker-unlock.model';
import type { WorkerAutoData } from '../worker-auto-model';

export const SUN_WORKER_INDEX = 4;

export const SUN_LEVEL_REQUIRED = 1;

export const SUN_CLICK_MULTIPLIER = 2;

export interface SunUpgrade extends WorkerUnlock {
  damageMultiplier?: number; 
  speedOfSunRotation?: number;
  sunSize?: number;
}

export const sunUnlockDefinition: SunUpgrade = {
  id: 'sun',
  name: 'Soleil',
  description: 'Un soleil en orbite : clic = x2 dégâts',
  imageUrl: 'assets/imgUpgrades/Star/Star1.png',
  levelRequired: SUN_LEVEL_REQUIRED,
};

export const SUN_UPGRADES: SunUpgrade[] = [
  {
    id: 'sun-upgrade-damage-1',
    name: 'Soleil : x2 dégâts',
    description: 'Un soleil en orbite : clic = x2 dégâts',
    imageUrl: 'assets/imgUpgrades/Star/Star1.png',
    levelRequired: 10,
    damageMultiplier: 2,
  },
  {
    id: 'sun-upgrade-damage-2',
    name: 'Soleil : x2 dégâts',
    description: 'Un soleil en orbite : clic = x2 dégâts',
    imageUrl: 'assets/imgUpgrades/Star/Star1.png',
    levelRequired: 25,
    damageMultiplier: 2,
  }, {
    id: 'sun-upgrade-damage-3',
    name: 'Soleil : x2 dégâts',
    description: 'Un soleil en orbite : clic = x2 dégâts',
    imageUrl: 'assets/imgUpgrades/Star/Star1.png',
    levelRequired: 35,
    damageMultiplier: 2,
  },
  {
    id: 'sun-upgrade-size-1',
    name: 'Soleil : +20% taille',
    description: 'Un soleil en orbite : +20% taille',
    imageUrl: 'assets/imgUpgrades/Star/Star1.png',
    levelRequired: 15,
    sunSize: 1.2,
  },
  {
    id: 'sun-upgrade-size-2',
    name: 'Soleil : +40% taille',
    description: 'Un soleil en orbite : +40% taille',
    imageUrl: 'assets/imgUpgrades/Star/Star1.png',
    levelRequired: 30,
    sunSize: 1.4,
  },
  {
    id: 'sun-upgrade-size-3',
    name: 'Soleil : +40% taille',
    description: 'Un soleil en orbite : +40% taille',
    imageUrl: 'assets/imgUpgrades/Star/Star1.png',
    levelRequired: 60,
    sunSize: 1.4,
  },
  {
    id: 'sun-upgrade-speed-1',
    name: 'Soleil : -20% vitesse de rotation',
    description: 'Un soleil en orbite : -20% vitesse de rotation',
    imageUrl: 'assets/imgUpgrades/Star/Star1.png',
    levelRequired: 5,
    speedOfSunRotation: -0.2,
  },
  {
    id: 'sun-upgrade-speed-2',
    name: 'Soleil : -30% vitesse de rotation',
    description: 'Un soleil en orbite : -30% vitesse de rotation',
    imageUrl: 'assets/imgUpgrades/Star/Star1.png',
    levelRequired: 20,
    speedOfSunRotation: -0.3,
  },
  {
    id: 'sun-upgrade-speed-3',
    name: 'Soleil : -40% vitesse de rotation',
    description: 'Un soleil en orbite : -40% vitesse de rotation',
    imageUrl: 'assets/imgUpgrades/Star/Star1.png',
    levelRequired: 50,
    speedOfSunRotation: -0.4,
  }
];

export interface SunUpgradeStats {
  damageMultiplier: number;
  speedFactor: number;
  sizeFactor: number;
}

export function getSunUpgradeStats(astrologueLevel: number): SunUpgradeStats {
  let damageMultiplier = astrologueLevel >= SUN_LEVEL_REQUIRED ? SUN_CLICK_MULTIPLIER : 1;
  let speedFactor = 1;
  let sizeFactor = 1;

  for (const upgrade of SUN_UPGRADES) {
    if (astrologueLevel < (upgrade.levelRequired ?? 0)) continue;
    if (upgrade.damageMultiplier != null) damageMultiplier *= upgrade.damageMultiplier;
    if (upgrade.speedOfSunRotation != null) speedFactor /= 1 + upgrade.speedOfSunRotation;
    if (upgrade.sunSize != null) sizeFactor *= upgrade.sunSize;
  }
  return { damageMultiplier, speedFactor, sizeFactor };
}

export function isSunUnlocked(
  workers: WorkerAutoData[],
  workersAvailable: WorkerAutoData[]
): boolean {
  if (SUN_WORKER_INDEX < 0 || SUN_WORKER_INDEX >= workersAvailable.length) return false;
  const astrologue = workersAvailable[SUN_WORKER_INDEX];
  if (!astrologue || !workers.includes(astrologue)) return false;
  return astrologue.level >= SUN_LEVEL_REQUIRED;
}
