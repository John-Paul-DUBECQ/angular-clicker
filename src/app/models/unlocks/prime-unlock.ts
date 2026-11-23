import { WorkerUnlock } from './worker-unlock.model';
import { UnlockMethod } from './unlock-method';

/** L'Architecte est à l'index 8 de `workersAvailable`. */
export const ARCHITECT_WORKER_INDEX = 8;
export const PRIME_LEVEL_REQUIRED = 125;

export const primeUnlockDefinition: WorkerUnlock = {
  id: 'prime-board',
  name: 'Panneau des primes',
  description: 'Des primes arrivent dans les missions. Les réussir rapporte du respect, les rater en retire.',
  imageUrl: 'assets/img/shadocks/shadock1.png',
  levelRequired: PRIME_LEVEL_REQUIRED,
  unlockMethod: UnlockMethod.workerLevel(ARCHITECT_WORKER_INDEX, PRIME_LEVEL_REQUIRED),
};
