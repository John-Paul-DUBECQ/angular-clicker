/**
 * Contexte passé aux conditions d'apparition des items du shop.
 * Tout ce dont une condition peut avoir besoin doit être exposé ici.
 */
export interface ShopUnlockContext {
  /** Nombre de clics (argent) actuel. */
  clicks: number;
  /** Niveau du worker à cet index si possédé, sinon null. */
  getWorkerLevel: (workerIndex: number) => number | null;
  /** true si l'item est acheté : passer l'index (0-based) dans la liste, ou son id si l'item a un champ id. */
  getShopItemBought: (ref: string | number) => boolean;
  /** true si le pouvoir avec cet id est possédé. */
  getPowerBought?: (powerId: string) => boolean;
}

/** Condition d'apparition : prend le contexte et retourne true si l'item peut apparaître. */
export type ShopUnlockCondition = (ctx: ShopUnlockContext) => boolean;

export interface ShopItem {
  name: string;
  description: string;
  imageUrl?: string;
  price: number;
  doesAppearInGame: boolean;
  bought: boolean;
  value: number;
  workerIndex?: number;
  /** Optionnel : identifiant pour les conditions requireBought(id). Sinon utiliser l'index dans la liste. */
  id?: string;
  /**
   * Condition optionnelle : l'item n'apparaît que si cette fonction retourne true
   * (en plus de la règle de base clicks >= price/2).
   * Utiliser les helpers requireMinClicks, requireWorkerLevel, requireAll, requireAny.
   */
  unlockCondition?: ShopUnlockCondition;
  /** Amélioration de pouvoir : réduit le coût en mana (ex: 0.9 = -10%). Un seul type d'effet power pour l'instant. */
  powerId?: string;
  powerManaFactor?: number;
  /** Bonus mana max (s'ajoute à la base + bonus Magicien). */
  manaMaxBonus?: number;
  /** Bonus régénération mana en mana/s (s'ajoute à la base + bonus Magicien). */
  manaRegenBonus?: number;
  /** Amélioration d'un unlock (ex: coup critique, streak). */
  unlockUpgrade?: { unlockId: string; type: string; value: number };
}

/** Règle de base : l'item est visible à partir de la moitié du prix. */
const BASE_VISIBILITY_CLICKS_RATIO = 1 / 2;

/**
 * Détermine si l'item doit apparaître dans le shop.
 * Toute la logique d'apparition est ici : règle de base + condition optionnelle.
 */
export function getDoesAppearInShop(item: ShopItem, ctx: ShopUnlockContext): boolean {
  if (item.doesAppearInGame) return true;
  if (item.bought) {
    item.doesAppearInGame = true;
    return true;
  }
  if (ctx.clicks < Math.floor(item.price * BASE_VISIBILITY_CLICKS_RATIO)) return false;
  if (item.unlockCondition != null && !item.unlockCondition(ctx)) return false;
  item.doesAppearInGame = true;
  return true;
}

// --- Helpers pour construire des conditions (tout reste dans ce fichier) ---

/** Condition : au moins `minClicks` d'argent (ex: requireMinClicks(100000) pour 100k). */
export function requireMinClicks(minClicks: number): ShopUnlockCondition {
  return (ctx) => ctx.clicks >= minClicks;
}

/** Condition : le worker à cet index est possédé et a au moins ce niveau. */
export function requireWorkerLevel(workerIndex: number, level: number): ShopUnlockCondition {
  return (ctx) => (ctx.getWorkerLevel(workerIndex) ?? 0) >= level;
}

/** Condition : le power avec cet id est possédé. */
export function requirePower(powerId: string): ShopUnlockCondition {
  return (ctx) => (ctx.getPowerBought ? ctx.getPowerBought(powerId) : false);
}

/** Condition : l'item du shop est acheté. `ref` = index (0-based) dans la liste, ou id (string) si l'item a un id. */
export function requireBought(ref: string | number): ShopUnlockCondition {
  return (ctx) => ctx.getShopItemBought(ref);
}


/** Condition : toutes les conditions doivent être vraies. */
export function requireAll(...conditions: ShopUnlockCondition[]): ShopUnlockCondition {
  return (ctx) => conditions.every((c) => c(ctx));
}


