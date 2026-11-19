import { ResourceReward } from '../resource';
import { UnlockMethod } from '../unlocks/unlock-method';
import { MonsterBiomeId } from './monster-biome.model';

export interface PlannedCombatReward {
  clicks?: number;
  essence?: number;
  resources?: ResourceReward[];
}

export interface PlannedCombatBaitEncounter {
  unlockWins: number;
  baitCost: number;
  rewards: ResourceReward[];
}

export interface PlannedCombatEnemy {
  id: string;
  name: string;
  imageUrl?: string;
  maxHp: number;
}

export type PlannedCombatDamageMode = 'any' | 'click' | 'afk';

export interface PlannedCombat {
  id: string;
  name: string;
  description: string;
  biome: MonsterBiomeId;
  level: number;
  enemies: PlannedCombatEnemy[];
  damageMode?: PlannedCombatDamageMode;
  timeLimitSeconds: number;
  cooldownSeconds: number;
  unlockMethod?: UnlockMethod;
  firstReward: PlannedCombatReward;
  repeatReward: PlannedCombatReward;
  baitEncounter?: PlannedCombatBaitEncounter;
}

export interface PlannedCombatView extends PlannedCombat {
  totalHp: number;
  unlocked: boolean;
  wins: number;
  cooldownRemainingSeconds: number;
}