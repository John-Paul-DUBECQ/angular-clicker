import { UnlockMethod } from './unlocks/unlock-method';

export interface House {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  level: number;
  bonusPerLevel: number;
  price: number;
  costs: import('./resource').ResourceCost[];
  unlockPrice?: number;
  unlockCosts?: import('./resource').ResourceCost[];
  unlocked?: boolean;
  maxLevel?: number;
  baitIntervalSeconds?: number;
  nextBaitInSeconds?: number;
  /** Conditions cumulables nécessaires pour débloquer la maison. */
  unlockMethod?: UnlockMethod;
}
