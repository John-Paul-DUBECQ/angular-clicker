import type { WorkerAutoData } from '../worker-auto-model';
import { WorkerUnlock } from './worker-unlock.model';

export const SMITH_WORKER_INDEX = 3;

export const STREAK_LEVEL_REQUIRED = 10;

export const NUMBER_OF_CLICKS_REQUIRED_FOR_BAR = 800; // N clicks au début pour remplir la barre

export const SPEED_OF_DECREASE_OF_BAR = 40; // Une fois la barre remplie, elle se décrémente de N clicks par seconde 

export const DAMAGE_MULTIPLIER = 2; // bonus dégâts / prod quand la barre est active

export type StreakPhase = 'filling' | 'active';

export interface StreakView {
  streakUnlocked: boolean;
  streakBarCurrent: number;
  streakBarMax: number;
  streakActive: boolean;
  streakDamageMultiplier: number | undefined;
}

export interface StreakTickResult {
  barCurrent: number;
  phase: StreakPhase;
}

export interface StreakClickResult {
  barCurrent: number;
  phase: StreakPhase;
}

export interface StreakUnlock extends WorkerUnlock {
  speedOfDecreaseOfBar: number;
  numberOfClicksRequiredForBar: number;
  damageMultiplier: number;
}


export interface StreakUpgrade extends WorkerUnlock {
    damageMultiplier?: number; // on ajoute au multiplicateur de dégâts du streak
    speedOfDecreaseOfBar?: number; // on enlève à la vitesse de décrémentation de la barre (en secondes)
    numberOfClicksRequiredForBar?: number; // on réduit le nombre de clicks requis pour remplir la barre
  }

/** Ajoute une barre à remplir pour gagner des points. */
export const streakUnlockDefinition: StreakUnlock = {
  id: 'streak',
  name: 'Streak',
  description: 'Ajoute une barre à remplir pour gagner des points.',
  imageUrl: '',
  levelRequired: STREAK_LEVEL_REQUIRED,
  speedOfDecreaseOfBar: SPEED_OF_DECREASE_OF_BAR,
  numberOfClicksRequiredForBar: NUMBER_OF_CLICKS_REQUIRED_FOR_BAR,
  damageMultiplier: DAMAGE_MULTIPLIER,
};


export const upgradeStreakDamage1: StreakUpgrade = {
    id: 'upgrade-streak-damage-1',
    name: 'Amélioration du streak',
    description: 'Augmente les dégâts du streak.',
    imageUrl: '',
    levelRequired: 25,
    damageMultiplier: 2,
};

export const upgradeStreakDamage2: StreakUpgrade = {
    id: 'upgrade-streak-damage-2',
    name: 'Amélioration du streak',
    description: 'Augmente les dégâts du streak.',
    imageUrl: '',
    levelRequired: 50,
    damageMultiplier: 2,
};

export const upgradeStreakSpeed1: StreakUpgrade = {
    id: 'upgrade-streak-speed-1',
    name: 'Amélioration du streak',
    description: 'Réduit la vitesse de décrémentation de la barre.',
    imageUrl: '',
    levelRequired: 40,
    speedOfDecreaseOfBar: -5,
};

export const upgradeStreakSpeed2: StreakUpgrade = {
    id: 'upgrade-streak-speed-2',
    name: 'Amélioration du streak',
    description: 'Réduit la vitesse de décrémentation de la barre.',
    imageUrl: '',
    levelRequired: 60,
    speedOfDecreaseOfBar: -10,
};

export const upgradeStreakClicks1: StreakUpgrade = {
    id: 'upgrade-streak-clicks-1',
    name: 'Amélioration du streak',
    description: 'Réduit le nombre de clicks requis pour remplir la barre.',
    imageUrl: '',
    levelRequired: 20,
    numberOfClicksRequiredForBar: -100,
};

export const upgradeStreakClicks2: StreakUpgrade = {
    id: 'upgrade-streak-clicks-2',
    name: 'Amélioration du streak',
    description: 'Réduit le nombre de clicks requis pour remplir la barre.',
    imageUrl: '',
    levelRequired: 40,
    numberOfClicksRequiredForBar: -100,
};

export const upgradeStreakClicks3: StreakUpgrade = {
    id: 'upgrade-streak-clicks-3',
    name: 'Amélioration du streak',
    description: 'Réduit le nombre de clicks requis pour remplir la barre.',
    imageUrl: '',
    levelRequired: 100,
    numberOfClicksRequiredForBar: -200,
};

/** Toutes les améliorations streak (ordre par levelRequired). */
export const STREAK_UPGRADES: StreakUpgrade[] = [
  upgradeStreakDamage1,
  upgradeStreakDamage2,
  upgradeStreakSpeed1,
  upgradeStreakSpeed2,
  upgradeStreakClicks1,
  upgradeStreakClicks2,
  upgradeStreakClicks3,
];

export interface StreakStats {
  damageMultiplier: number;
  speedOfDecreaseOfBar: number;
  numberOfClicksRequiredForBar: number;
}

/** Niveau du Forgeron (Smith) ou 0 si absent. */
export function getSmithLevel(
  workers: WorkerAutoData[],
  workersAvailable: WorkerAutoData[]
): number {
  if (SMITH_WORKER_INDEX < 0 || SMITH_WORKER_INDEX >= workersAvailable.length) return 0;
  const smith = workersAvailable[SMITH_WORKER_INDEX];
  if (!smith || !workers.includes(smith)) return 0;
  return smith.level ?? 0;
}

/**
 * Stats effectives du streak selon le niveau du Forgeron (base + améliorations débloquées).
 */
export function getStreakStats(smithLevel: number): StreakStats {
  let damageMultiplier = DAMAGE_MULTIPLIER;
  let speedOfDecreaseOfBar = SPEED_OF_DECREASE_OF_BAR;
  let numberOfClicksRequiredForBar = NUMBER_OF_CLICKS_REQUIRED_FOR_BAR;

  for (const upgrade of STREAK_UPGRADES) {
    if (smithLevel < (upgrade.levelRequired ?? 0)) continue;
    if (upgrade.damageMultiplier != null) damageMultiplier *= upgrade.damageMultiplier;
    if (upgrade.speedOfDecreaseOfBar != null) speedOfDecreaseOfBar += upgrade.speedOfDecreaseOfBar;
    if (upgrade.numberOfClicksRequiredForBar != null) numberOfClicksRequiredForBar += upgrade.numberOfClicksRequiredForBar;
  }

  return {
    damageMultiplier,
    speedOfDecreaseOfBar: Math.max(0, speedOfDecreaseOfBar),
    numberOfClicksRequiredForBar: Math.max(1, numberOfClicksRequiredForBar),
  };
}

export function isStreakUnlocked(
  workers: WorkerAutoData[],
  workersAvailable: WorkerAutoData[]
): boolean {
  return getSmithLevel(workers, workersAvailable) >= STREAK_LEVEL_REQUIRED;
}

/** Multiplicateur à appliquer aux clics et à la prod auto (1 ou stats.damageMultiplier). */
export function getStreakMultiplier(
  workers: WorkerAutoData[],
  workersAvailable: WorkerAutoData[],
  streakPhase: StreakPhase
): number {
  if (!isStreakUnlocked(workers, workersAvailable)) return 1;
  if (streakPhase !== 'active') return 1;
  const stats = getStreakStats(getSmithLevel(workers, workersAvailable));
  return stats.damageMultiplier;
}

/** Met à jour la barre et la phase après un tick (descente de la barre en phase active). */
export function tickStreak(
  barCurrent: number,
  phase: StreakPhase,
  ticksPerSecond: number,
  smithLevel: number
): StreakTickResult {
  if (phase !== 'active') return { barCurrent, phase };
  const stats = getStreakStats(smithLevel);
  const decreasePerTick = stats.speedOfDecreaseOfBar / ticksPerSecond;
  console.log('decreasePerTick', decreasePerTick);
  const newCurrent = Math.max(0, barCurrent - decreasePerTick);
  const newPhase: StreakPhase = newCurrent <= 0 ? 'filling' : 'active';
  return { barCurrent: newCurrent, phase: newPhase };
}

/** Met à jour la barre et la phase après un clic (+1, passage en active si barre pleine). */
export function processStreakOnClick(
  barCurrent: number,
  phase: StreakPhase,
  smithLevel: number
): StreakClickResult {
  const stats = getStreakStats(smithLevel);
  const max = stats.numberOfClicksRequiredForBar;
  const newCurrent = Math.min(max, barCurrent + 1);
  const newPhase: StreakPhase = newCurrent >= max ? 'active' : phase;
  return { barCurrent: newCurrent, phase: newPhase };
}

/** Données streak pour le state de la partie (affichage + multiplicateur). */
export function getStreakView(
  workers: WorkerAutoData[],
  workersAvailable: WorkerAutoData[],
  barCurrent: number,
  phase: StreakPhase
): StreakView {
  const streakUnlocked = isStreakUnlocked(workers, workersAvailable);
  const stats = getStreakStats(getSmithLevel(workers, workersAvailable));
  return {
    streakUnlocked,
    streakBarCurrent: streakUnlocked ? barCurrent : 0,
    streakBarMax: streakUnlocked ? stats.numberOfClicksRequiredForBar : 0,
    streakActive: streakUnlocked && phase === 'active',
    streakDamageMultiplier: streakUnlocked ? stats.damageMultiplier : undefined,
  };
}
