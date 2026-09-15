import type { WorkerUnlock } from './unlocks/worker-unlock.model';
import { UnlockContext, UnlockMethod } from './unlocks/unlock-method';

/**
 * Contexte passé aux conditions d'apparition des items du shop.
 * Tout ce dont une condition peut avoir besoin doit être exposé ici.
 */
export interface ShopUnlockContext extends UnlockContext {
  /** true si l'item est acheté : passer l'index (0-based) dans la liste, ou son id si l'item a un champ id. */
  getShopItemBought: (ref: string | number) => boolean;
  /** true si le pouvoir avec cet id est possédé. */
  getPowerBought?: (powerId: string) => boolean;
}

/** Condition d'apparition : prend le contexte et retourne true si l'item peut apparaître. */
export type ShopUnlockCondition = UnlockMethod;

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
  * Utiliser les helpers requireMinClicks, requireWorkerLevel, requireAll, requireAny
  * pour construire un UnlockMethod.
   */
  unlockMethod?: UnlockMethod;
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
  if (item.unlockMethod != null && !item.unlockMethod.isUnlocked(ctx)) return false;
  item.doesAppearInGame = true;
  return true;
}

// --- Helpers pour construire des conditions (tout reste dans ce fichier) ---

/** Condition : au moins `minClicks` d'argent (ex: requireMinClicks(100000) pour 100k). */
export function requireMinClicks(minClicks: number): ShopUnlockCondition {
  return UnlockMethod.minClicks(minClicks);
}

/** Condition : le worker à cet index est possédé et a au moins ce niveau. */
export function requireWorkerLevel(workerIndex: number, level: number): ShopUnlockCondition {
  return UnlockMethod.workerLevel(workerIndex, level);
}

/** Condition : le power avec cet id est possédé. */
export function requirePower(powerId: string): ShopUnlockCondition {
  return UnlockMethod.powerBought(powerId);
}

/** Condition : l'item du shop est acheté. `ref` = index (0-based) dans la liste, ou id (string) si l'item a un id. */
export function requireBought(ref: string | number): ShopUnlockCondition {
  return UnlockMethod.shopItemBought(ref);
}


/** Condition : toutes les conditions doivent être vraies. */
export function requireAll(...conditions: ShopUnlockCondition[]): ShopUnlockCondition {
  return UnlockMethod.all(...conditions);
}

/** Condition : au moins une des conditions doit être vraie. */
export function requireAny(...conditions: ShopUnlockCondition[]): ShopUnlockCondition {
  return UnlockMethod.any(...conditions);
}

/**
 * Paliers "déblocage d'item shop" dérivés de la condition unlockMethod.
 */
export function getUpcomingShopItemUnlockTiers(
  workerIndex: number,
  currentLevel: number,
  items: ShopItem[]
): WorkerUnlock[] {
  return items
    .filter(
      (item) =>
        item.unlockMethod?.getWorkerLevelRequirement(workerIndex) != null &&
        item.unlockMethod.getWorkerLevelRequirement(workerIndex)! > currentLevel
    )
    .map((item) => {
      const level = item.unlockMethod!.getWorkerLevelRequirement(workerIndex)!;
      return {
        id: `shop-item-${item.id ?? item.name}`,
        name: item.name,
        description: item.description,
        imageUrl: item.imageUrl ?? '',
        levelRequired: level,
        unlockType: 'item' as const,
        price: item.price,
      };
    })
    .sort((a, b) => (a.levelRequired ?? 0) - (b.levelRequired ?? 0));
}


