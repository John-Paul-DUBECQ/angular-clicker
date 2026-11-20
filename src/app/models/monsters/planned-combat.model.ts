import { ResourceReward } from '../resource';
import { UnlockMethod } from '../unlocks/unlock-method';
import { MonsterBiomeId } from './monster-biome.model';

export interface PlannedCombatReward {
  clicks?: number;
  essence?: number;
  resources?: ResourceReward[];
}

export interface PlannedCombatTrapEncounter {
  unlockWins: number;
  trapCost: number;
  rewards: ResourceReward[];
}

export interface PlannedCombatEnemy {
  id: string;
  name: string;
  imageUrl?: string;
  /** Somme de healthBars. */
  maxHp: number;
  healthBars: PlannedCombatHealthBars;
}

export type PlannedCombatDamageMode = 'any' | 'click' | 'afk' | 'pet';

export interface PlannedCombatHealthBars {
  click: number;
  afk: number;
  pet: number;
}

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
  trapEncounter?: PlannedCombatTrapEncounter;
}

export interface PlannedCombatView extends PlannedCombat {
  totalHp: number;
  unlocked: boolean;
  wins: number;
  cooldownRemainingSeconds: number;
}