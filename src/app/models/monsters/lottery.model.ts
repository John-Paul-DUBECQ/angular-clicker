import { ResourceReward } from '../resource';
import { UnlockMethod } from '../unlocks/unlock-method';

export const LOTTERY_WORKER_INDEX = 8;

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
  /** 1 dès le déblocage, plus la chance des plats actifs. */
  luck: number;
  /** Bonus additif de coffre : +0,01 point de pourcentage par point de chance. */
  chestLuckBonus: number;
  biomeName: string;
  biomeEggAvailable: boolean;
  biomeEggChance: number;
}

/** Chance de départ une fois la loterie débloquée. */
export const BASE_LUCK = 1;
/** +0,01 % de chance de coffre par point de chance. */
export const CHEST_CHANCE_PER_LUCK = 0.001;

export function getEffectiveLuck(kitchenLuck: number, lotteryUnlocked: boolean): number {
  if (!lotteryUnlocked) return 0;
  return BASE_LUCK + Math.max(0, kitchenLuck);
}

export function getChestLuckBonus(luck: number): number {
  return Math.max(0, luck) * CHEST_CHANCE_PER_LUCK;
}

/**
 * Succès d'un tirage. Au-delà de 100 %, chaque tranche entière est un gain de plus,
 * et le reste garde sa chance d'en ajouter un.
 */
export function rollSuccesses(chance: number, random: () => number = Math.random): number {
  if (chance <= 0) return 0;
  const guaranteed = Math.floor(chance);
  const fraction = chance - guaranteed;
  return guaranteed + (random() < fraction ? 1 : 0);
}

export interface ChanceRewardEntry {
  resourceId: string;
  amount: number;
  chance: number;
}

/** La chance multiplie la probabilité. Un tirage au-dessus de 100 % peut donner plusieurs exemplaires. */
export function collectChanceRewards(
  entries: ChanceRewardEntry[],
  luck: number,
  random: () => number = Math.random
): ResourceReward[] {
  const multiplier = Math.max(0, luck);
  const rewards: ResourceReward[] = [];
  for (const entry of entries) {
    const hits = rollSuccesses(Math.max(0, entry.chance) * multiplier, random);
    if (hits <= 0) continue;
    const scaled = Math.max(0, entry.amount) * hits;
    const whole = Math.floor(scaled);
    const amount = whole + (random() < scaled - whole ? 1 : 0);
    if (amount > 0) rewards.push({ resourceId: entry.resourceId, amount });
  }
  return rewards;
}

/** Loot de la loterie : chaque entrée est tirée seule, la chance n’est pas garantie. */
export interface LotteryLootDrop extends ResourceReward {
  /** Chance indépendante entre 0 et 1, avant le multiplicateur de chance. */
  chance: number;
  unlockMethod?: UnlockMethod;
}

export function getLotteryDropChance(drop: LotteryLootDrop, luck: number): number {
  return Math.max(0, drop.chance) * Math.max(0, luck);
}

export function getLotteryLuckBonus(baseChance: number, luck: number): number {
  return Math.max(0, baseChance) * Math.max(0, luck - 1);
}

export const LOTTERY_UNLOCK_METHOD = UnlockMethod.plannedCombatCompleted('planned-mosh-hunt');

export const LOTTERY_STATS: LotteryStats = {
  cooldownMinutes: 30,
  monsterChestChance: 0.01,
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
function getResourceName(resourceId: string) {
  throw new Error('Function not implemented.');
}

