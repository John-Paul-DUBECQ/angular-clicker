import { Monster } from '../monsters/monster.model';
import { MonsterBiomeId } from '../monsters/monster-biome.model';
import { ResourceCost } from '../resource';
import { UnlockMethod } from '../unlocks/unlock-method';

/** Délai avant la prochaine prime quand le panneau est vide. */
export const PRIME_DELAY_MS = 2 * 60 * 1000;
/** Intervalle entre deux primes quand il en reste déjà au moins une. */
export const PRIME_SPAWN_MIN_MS = 5 * 60 * 1000;
export const PRIME_SPAWN_MAX_MS = 10 * 60 * 1000;
/** Durée d'affichage d'une prime sur le panneau. */
export const PRIME_LISTING_MIN_MS = 5 * 60 * 1000;
export const PRIME_LISTING_MAX_MS = 10 * 60 * 1000;
export const PRIME_MAX_OFFERS = 3;
export const TRADER_INTERVAL_MS = 5 * 60 * 1000;
export const TRADER_BASE_DURATION_MS = 5 * 60 * 1000;
export const PRIME_TIME_MIN_SECONDS = 20;
export const PRIME_TIME_MAX_SECONDS = 45;
export const PRIME_HP_PER_SECOND_MIN = 5;
export const PRIME_HP_PER_SECOND_MAX = 20;
export const PRIME_HOUSE_ID = 'prime-relay-house';
export const PRIME_HOUSE_CHANCE_PER_LEVEL = 0.08;
export const PRIME_HOUSE_DURATION_PER_LEVEL_SECONDS = 60;
export const PRIME_HOUSE_RESPECT_PER_LEVEL = 25;
export const PRIME_DISCOUNT_CAP = 0.8;

export interface PrimeHouseBonuses {
  chanceBonus: number;
  extraDurationSeconds: number;
}

export interface PrimeContractReward {
  gold: number;
  essence: number;
  resources: { resourceId: string; amount: number }[];
}

export interface PrimeOfferData {
  id: string;
  monsterId: string;
  biome: MonsterBiomeId;
  rolledSeconds: number;
  hpPerSecond: number;
  expiresAt: number;
  reward?: PrimeContractReward;
}

export interface PrimeTraderData {
  instanceId: string;
  merchantId: string;
  dialogue: string;
  endsAt: number;
  /** Achats déjà faits pendant ce passage, par id d'échange. */
  bought?: Record<string, number>;
}

export interface PrimeSaveData {
  respect: number;
  nextPrimeAt: number;
  unseen: boolean;
  offers: PrimeOfferData[];
  /** Ancienne sauvegarde à une seule prime. */
  offer?: PrimeOfferData | null;
  nextTraderAt: number;
  traders: PrimeTraderData[];
}

export interface PrimeTradeDefinition {
  id: string;
  merchantId: string;
  name: string;
  description: string;
  unlockMethod?: UnlockMethod;
  /** Prix en or (clics), réduit par le bonus de respect. */
  goldCost?: number;
  costs?: ResourceCost[];
  goldReward?: number;
  essenceReward?: number;
  resourceRewards?: ResourceCost[];
  /** Nombre d'achats possibles pendant un passage du marchand. */
  maxPerVisit: number;
}

export interface PrimeMerchantDefinition {
  id: string;
  name: string;
  imageUrl?: string;
  dialogues: string[];
}

export interface PrimeOfferView {
  id: string;
  monsterId: string;
  monsterName: string;
  imageUrl?: string;
  biome: MonsterBiomeId;
  timeLimitSeconds: number;
  hpPerSecond: number;
  gain: number;
  loss: number;
  gainLabel: string;
  rewardLabel: string;
  remainingSeconds: number;
}

export interface PrimeTradeCostView {
  resourceId: string;
  name: string;
  amount: number;
  owned: number;
}

export interface PrimeTradeView {
  id: string;
  name: string;
  description: string;
  goldCost?: number;
  discountedGoldCost?: number;
  costs: PrimeTradeCostView[];
  resourceRewards: { resourceId: string; name: string; amount: number; owned: number }[];
  goldReward: number;
  essenceReward: number;
  rewardsLabel: string;
  canBuy: boolean;
  lockedReason?: string;
  maxPerVisit: number;
  remaining: number;
}

export interface PrimeTraderView {
  instanceId: string;
  merchantId: string;
  name: string;
  imageUrl?: string;
  dialogue: string;
  remainingSeconds: number;
  trades: PrimeTradeView[];
}

export interface PrimeBoardView {
  unlocked: boolean;
  respect: number;
  /** Texte au survol : gain des primes affichées, sous la forme `N + N% des bonus`. */
  gainLabel: string;
  offers: PrimeOfferView[];
  nextPrimeInSeconds: number;
  traders: PrimeTraderView[];
}

export const PRIME_MERCHANTS: PrimeMerchantDefinition[] = [
  {
    id: 'terry',
    name: 'Terry',
    imageUrl: 'assets/img/shadocks/mosh.png',
    dialogues: [
      'Je viens d\'une région lointaine qui me manque beaucoup. C\'est juste dommage que en 30 minutes, on puisse aller d\'un volcan mortel à des montagnes où le gel tuerait les mammiféres les plus préparés.',
      'J\'avais un habitué qui avait pour mission de sauver le royaume du terrible Gonanon là où je vivais. J\'espère qu\'il a survécu...',
      'D\'habitude je vends des insectes mais je n\'ai pas encore mes fournisseurs ici.'
    ],
  },
];

export const PRIME_TRADES: PrimeTradeDefinition[] = [
  {
    id: 'terry-baits',
    merchantId: 'terry',
    name: 'Pièges à Bokoboblin',
    description: "Pièges utilsés pour les Bokoboblins, je n'en ai cependant pas encore vu dans ces régions.",
    goldCost: 50000,
    resourceRewards: [{ resourceId: 'bait', amount: 5 }],
    maxPerVisit: 4,
  },
  {
    id: 'terry-tickets',
    merchantId: 'terry',
    name: 'Liasse de tickets',
    description: 'Dix tickets. terry ne les sort que pour une réputation déjà solide.',
    goldCost: 200000,
    resourceRewards: [{ resourceId: 'ticket', amount: 10 }],
    unlockMethod: UnlockMethod.minRespect(40),
    maxPerVisit: 2,
  },
];

/** Or, essence et butin garantis d'un contrat. L'or suit la production AFK sur la durée du combat. */
export function buildPrimeReward(
  monster: Pick<Monster, 'lootMultiplier' | 'drops'>,
  baseProduction: number,
  seconds: number
): PrimeContractReward {
  const loot = Math.max(0.1, monster.lootMultiplier ?? 1);
  const resources = (monster.drops ?? [])
    .map((drop) => ({
      resourceId: drop.resourceId,
      amount: Math.max(1, Math.round(drop.amount * loot)),
    }))
    .filter((drop) => drop.amount > 0);
  return {
    gold: Math.max(1, round2(Math.max(0, baseProduction) * Math.max(1, seconds) * loot)),
    essence: Math.max(1, round2(5 * loot)),
    resources: resources.map((drop) => ({ ...drop, amount: round2(drop.amount) })),
  };
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatRespectGain(base: number, flatBonus: number, percentBonus: number): string {
  const integer = base + flatBonus;
  const percentPoints = Math.round(percentBonus * 100);
  return `${integer} + ${percentPoints}% des bonus`;
}

/** Respect gagné avant bonus. Un Mosh (loot 1) rapporte 100. */
export function primeRespectGainBase(monster: Pick<Monster, 'lootMultiplier'>): number {
  const loot = monster.lootMultiplier ?? 1;
  return Math.max(1, Math.round(80 + loot * 20));
}

/** Respect perdu à la fuite ou contre un monstre sauvage, sans bonus. Un Mosh retire 8. */
export function primeRespectLoss(monster: Pick<Monster, 'lootMultiplier'>): number {
  const loot = monster.lootMultiplier ?? 1;
  return Math.max(1, Math.round(6 + loot * 2));
}

export function respectGain(base: number, flatBonus: number, percentBonus: number): number {
  return Math.max(1, Math.floor((base + flatBonus) * (1 + percentBonus)));
}

export function discountedGoldCost(goldCost: number, discount: number): number {
  const factor = 1 - Math.min(PRIME_DISCOUNT_CAP, Math.max(0, discount));
  return Math.max(1, Math.floor(goldCost * factor));
}

export function pickPrimeMonster(
  monsters: Monster[],
  biome: MonsterBiomeId,
  roll: number
): Monster | null {
  const pool = monsters.filter((monster) =>
    (monster.biome ?? 'forest') === biome && monster.canAppearInPrime !== false
  );
  if (pool.length === 0) return null;
  const total = pool.reduce((sum, monster) => sum + Math.max(0, monster.probabilityToSpawn ?? 1), 0);
  if (total <= 0) return pool[0];
  let cursor = Math.min(0.999999, Math.max(0, roll)) * total;
  for (const monster of pool) {
    const weight = Math.max(0, monster.probabilityToSpawn ?? 1);
    if (cursor < weight) return monster;
    cursor -= weight;
  }
  return pool[pool.length - 1];
}

export function randomInt(min: number, max: number, roll: number): number {
  const span = max - min + 1;
  return min + Math.min(span - 1, Math.floor(Math.min(0.999999, Math.max(0, roll)) * span));
}
