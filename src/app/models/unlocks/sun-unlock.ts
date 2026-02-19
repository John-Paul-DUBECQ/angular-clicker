import { WorkerUnlock } from './worker-unlock.model';
import type { WorkerAutoData } from '../worker-auto-model';

/** Index du worker Astrologue qui débloque le soleil. */
export const SUN_WORKER_INDEX = 4;

/** Niveau minimum de l'Astrologue pour débloquer le soleil (1 = dès l'achat). */
export const SUN_LEVEL_REQUIRED = 1;

/** Multiplicateur de dégâts quand on clique sur le soleil (x2). */
export const SUN_CLICK_MULTIPLIER = 2;

/** Définition de l'unlock "Soleil" pour l'Astrologue. */
export const sunUnlockDefinition: WorkerUnlock = {
  id: 'sun',
  name: 'Soleil',
  description: 'Un soleil en orbite : clic = x2 dégâts',
  imageUrl: 'assets/imgUpgrades/Star/Star1.png',
  levelRequired: SUN_LEVEL_REQUIRED,
};

/**
 * Indique si le soleil est débloqué (Astrologue possédé et niveau >= SUN_LEVEL_REQUIRED).
 */
export function isSunUnlocked(
  workers: WorkerAutoData[],
  workersAvailable: WorkerAutoData[]
): boolean {
  if (SUN_WORKER_INDEX < 0 || SUN_WORKER_INDEX >= workersAvailable.length) return false;
  const astrologue = workersAvailable[SUN_WORKER_INDEX];
  if (!astrologue || !workers.includes(astrologue)) return false;
  return astrologue.level >= SUN_LEVEL_REQUIRED;
}
