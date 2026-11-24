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
export const PRIME_TIME_MAX_SECONDS = 60;
export const PRIME_HP_PER_SECOND_MIN = 15;
export const PRIME_HP_PER_SECOND_MAX = 50;
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
      'Le panneau paie mieux que la forêt, si tu survis assez longtemps pour encaisser.',
      'Je ne reste pas. Le respect attire les curieux, et les curieux attirent les ennuis.',
    ],
  },
  {
    id: 'lise',
    name: 'Lise Poche',
    imageUrl: 'assets/img/shadocks/gribouyi.png',
    dialogues: [
      'De la nourriture contre autre chose. Je ne prends pas les promesses.',
      'Tes primes sentent la viande. Moi, je vends ce qui reste dans le sac.',
    ],
  },
  {
    id: 'oldo',
    name: 'Oldo Sel',
    imageUrl: 'assets/img/shadocks/aquaticMobs/calque.png',
    dialogues: [
      'Le respect ouvre des caisses que l\'or n\'ouvre pas.',
      'Deux clients à la fois, c\'est déjà trop. Parle vite.',
    ],
  },
  {
    id: 'nila',
    name: 'Nila Grêle',
    imageUrl: 'assets/img/shadocks/sac-poubelle-sama.png',
    dialogues: [
      'Un piège pour ceux qui préfèrent ne pas se battre. Le respect, lui, se gagne autrement.',
      'Je repars avant que la prime suivante n\'attire quelque chose de plus gros que moi.',
    ],
  },
];

export const PRIME_TRADES: PrimeTradeDefinition[] = [
  {
    id: 'terry-baits',
    merchantId: 'terry',
    name: 'Paquet d\'appâts',
    description: 'Cinq appâts, payés en or.',
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
  {
    id: 'lise-teeth',
    merchantId: 'lise',
    name: 'Dents contre rations',
    description: 'De la nourriture contre des dents de Mosh.',
    costs: [{ resourceId: 'food', amount: 8 }],
    resourceRewards: [{ resourceId: 'mosh-tooth', amount: 3 }],
    maxPerVisit: 5,
  },
  {
    id: 'lise-sea',
    merchantId: 'lise',
    name: 'Ration de marée',
    description: 'De la nourriture contre des vivres de la plage.',
    costs: [{ resourceId: 'food', amount: 6 }],
    resourceRewards: [{ resourceId: 'sea-food', amount: 4 }],
    unlockMethod: UnlockMethod.minRespect(80),
    maxPerVisit: 3,
  },
  {
    id: 'oldo-essence',
    merchantId: 'oldo',
    name: 'Fiole de contrebande',
    description: 'De l\'essence, pour qui a déjà un peu de respect.',
    goldCost: 100000,
    essenceReward: 15,
    unlockMethod: UnlockMethod.minRespect(25),
    maxPerVisit: 2,
  },
  {
    id: 'oldo-shells',
    merchantId: 'oldo',
    name: 'Coquilles contre rations',
    description: 'Des coquilles échangées contre de la nourriture.',
    costs: [{ resourceId: 'shell', amount: 2 }],
    resourceRewards: [{ resourceId: 'food', amount: 6 }],
    unlockMethod: UnlockMethod.minRespect(15),
    maxPerVisit: 4,
  },
  {
    id: 'nila-trap',
    merchantId: 'nila',
    name: 'Piège du relais',
    description: 'Un piège, payé en vivres et en dents.',
    costs: [
      { resourceId: 'food', amount: 4 },
      { resourceId: 'mosh-tooth', amount: 2 },
    ],
    resourceRewards: [{ resourceId: 'trap', amount: 1 }],
    maxPerVisit: 3,
  },
  {
    id: 'nila-contract',
    merchantId: 'nila',
    name: 'Contrat discret',
    description: 'Deux pièges. Nila ne traite qu\'avec une réputation élevée.',
    costs: [{ resourceId: 'food', amount: 12 }],
    resourceRewards: [{ resourceId: 'trap', amount: 2 }],
    unlockMethod: UnlockMethod.minRespect(120),
    maxPerVisit: 1,
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

/** Au plus deux décimales, sans notation scientifique. */
export function formatPrimeAmount(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return round2(value).toLocaleString('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
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

/** `12 + 25% des bonus` : l'entier inclut le bonus fixe, le pourcentage est à part. */
export function formatRespectGain(base: number, flatBonus: number, percentBonus: number): string {
  const integer = base + flatBonus;
  const percentPoints = Math.round(percentBonus * 100);
  return `${integer} + ${percentPoints}% des bonus`;
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
