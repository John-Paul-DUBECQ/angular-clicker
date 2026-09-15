import { WorkerUnlock } from './worker-unlock.model';

export const HOUSE_LEVEL_REQUIRED = 100;

export const houseUnlockDefinition: WorkerUnlock = {
  id: 'houses',
  name: 'Maisons',
  description: 'Débloque l\'onglet des maisons.',
  imageUrl: 'assets/img/House/House1.png',
  levelRequired: HOUSE_LEVEL_REQUIRED,
};
