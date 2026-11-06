import { ResourceReward } from '../resource';
import { UnlockMethod } from '../unlocks/unlock-method';

export interface PlannedCombatReward {
  clicks?: number;
  essence?: number;
  resources?: ResourceReward[];
}

export interface PlannedCombat {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  maxHp: number;
  timeLimitSeconds: number;
  cooldownSeconds: number;
  unlockMethod?: UnlockMethod;
  firstReward: PlannedCombatReward;
  repeatReward: PlannedCombatReward;
}

export interface PlannedCombatView extends PlannedCombat {
  unlocked: boolean;
  wins: number;
  cooldownRemainingSeconds: number;
}