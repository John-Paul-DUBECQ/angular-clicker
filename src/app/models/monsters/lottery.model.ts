import { ResourceReward } from '../resource';
import { UnlockMethod } from '../unlocks/unlock-method';

export interface ChestDrop extends ResourceReward {
  probability: number;
  unlockMethod?: UnlockMethod;
}

export interface ChestDefinition {
  id: string;
  resourceId: string;
  name: string;
  rarity: string;
  weight: number;
  unlockMethod?: UnlockMethod;
  drops: ChestDrop[];
}

export interface LotteryStats {
  cooldownMinutes: number;
  monsterChestChance: number;
  luckMultiplier: number;
  dropsMultiplier: number;
}

export interface LotteryView extends LotteryStats {
  unlocked: boolean;
  cooldownRemainingSeconds: number;
}

/** Loot de la loterie : chaque entrée est tirée seule, la chance n’est pas garantie. */
export interface LotteryLootDrop extends ResourceReward {
  /** Chance indépendante entre 0 et 1, avant le multiplicateur de chance. */
  chance: number;
  unlockMethod?: UnlockMethod;
}

export function getLotteryDropChance(drop: LotteryLootDrop, luckMultiplier: number): number {
  return Math.min(1, Math.max(0, drop.chance) * Math.max(0, luckMultiplier));
}

export const LOTTERY_UNLOCK_METHOD = UnlockMethod.plannedCombatCompleted('planned-mosh-hunt');

export const LOTTERY_STATS: LotteryStats = {
  cooldownMinutes: 30,
  monsterChestChance: 1,
  luckMultiplier: 1,
  dropsMultiplier: 1,
};

/** Tirages indépendants et rares : une activation peut ne rien donner, ou plusieurs loots. */
export const LOTTERY_LOOT: LotteryLootDrop[] = [
  { resourceId: 'food', amount: 5, chance: 0.08 },
  { resourceId: 'bait', amount: 2, chance: 0.04 },
  { resourceId: 'ticket', amount: 1, chance: 0.02 },
  { resourceId: 'mosh-tooth', amount: 1, chance: 0.015 },
  { resourceId: 'chest-common', amount: 1, chance: 0.01 },
  {
    resourceId: 'detritus',
    amount: 1,
    chance: 0.008,
    unlockMethod: UnlockMethod.plannedCombatCompleted('planned-forest-03'),
  },
  { resourceId: 'chest-rare', amount: 1, chance: 0.004 },
  { resourceId: 'super-mosh-core', amount: 1, chance: 0.002 },
  { resourceId: 'chest-epic', amount: 1, chance: 0.001 },
  {
    resourceId: 'mosh-paw',
    amount: 1,
    chance: 0.0005,
    unlockMethod: UnlockMethod.plannedCombatCompleted('planned-forest-05', 10),
  },
];

export const LIST_CHEST: ChestDefinition[] = [
  {
    id: 'common',
    resourceId: 'chest-common',
    name: 'Coffre commun',
    rarity: 'Commun',
    weight: 70,
    drops: [
      { resourceId: 'food', amount: 3, probability: 80 },
      { resourceId: 'bait', amount: 1, probability: 20 },
    ],
  },
  {
    id: 'rare',
    resourceId: 'chest-rare',
    name: 'Coffre rare',
    rarity: 'Rare',
    weight: 25,
    drops: [
      { resourceId: 'mosh-tooth', amount: 2, probability: 70 },
      { resourceId: 'ticket', amount: 1, probability: 25 },
      {
        resourceId: 'detritus',
        amount: 1,
        probability: 5,
        unlockMethod: UnlockMethod.plannedCombatCompleted('planned-forest-03'),
      },
    ],
  },
  {
    id: 'epic',
    resourceId: 'chest-epic',
    name: 'Coffre épique',
    rarity: 'Épique',
    weight: 5,
    drops: [
      { resourceId: 'super-mosh-core', amount: 1, probability: 90 },
      {
        resourceId: 'mosh-paw',
        amount: 1,
        probability: 10,
        unlockMethod: UnlockMethod.plannedCombatCompleted('planned-forest-05', 10),
      },
    ],
  },
];
