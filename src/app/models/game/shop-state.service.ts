import { Injectable } from '@angular/core';
import { ShopItem, getDoesAppearInShop } from '../shop-item';
import { ShopUnlockContext } from '../shop-item';
import { listShopItem } from '../list-shop-item';
import { ResourcesService } from './resources.service';
import { PowerStateService } from './power-state.service';

@Injectable({ providedIn: 'root' })
export class ShopStateService {
  private shopItems: ShopItem[] = listShopItem;

  constructor(
    private resources: ResourcesService,
    private powerState: PowerStateService
  ) {}

  getShopItems(): ShopItem[] {
    return this.shopItems;
  }

  getShopMultiplierForWorker(workerIndex: number): number {
    return this.shopItems
      .filter((i) => i.bought && i.workerIndex === workerIndex)
      .reduce((p, i) => p * i.value, 1);
  }

  getShopContext(
    getWorkerLevel: (index: number) => number | null
  ): ShopUnlockContext {
    return {
      clicks: this.resources.getClicks(),
      getWorkerLevel: (index) => getWorkerLevel(index) ?? null,
      getShopItemBought: (ref: string | number) =>
        typeof ref === 'number'
          ? (this.shopItems[ref]?.bought ?? false)
          : (this.shopItems.find((i) => i.id === ref)?.bought ?? false),
      getPowerBought: (powerId: string) =>
        this.powerState.getPowers().some((p) => p.id === powerId),
    };
  }

  getPowerManaMultiplier(powerId: string): number {
    const factor = this.shopItems
      .filter((i) => i.bought && i.powerId === powerId && i.powerManaFactor != null)
      .reduce((p, i) => p * (i.powerManaFactor ?? 1), 1);
    return factor > 0 ? factor : 1;
  }

  getUnlockBonus(unlockId: string, type: string): number {
    return this.shopItems
      .filter(
        (i) =>
          i.bought &&
          i.unlockUpgrade?.unlockId === unlockId &&
          i.unlockUpgrade?.type === type
      )
      .reduce((s, i) => s + (i.unlockUpgrade?.value ?? 0), 0);
  }

  /** Bonus mana max des items achetés (s'ajoute à la base + bonus Magicien). */
  getManaMaxBonus(): number {
    return this.shopItems
      .filter((i) => i.bought && i.manaMaxBonus != null)
      .reduce((s, i) => s + (i.manaMaxBonus ?? 0), 0);
  }

  /** Bonus régénération mana (mana/s) des items achetés. */
  getManaRegenBonus(): number {
    return this.shopItems
      .filter((i) => i.bought && i.manaRegenBonus != null)
      .reduce((s, i) => s + (i.manaRegenBonus ?? 0), 0);
  }

  getShopItemsView(getWorkerLevel: (index: number) => number | null): ShopItem[] {
    const ctx = this.getShopContext(getWorkerLevel);
    return this.shopItems.map((item) => ({
      ...item,
      doesAppearInGame: getDoesAppearInShop(item, ctx),
      bought: item.bought,
    }));
  }

  canBuyShopItem(price: number): boolean {
    return this.resources.canSpend(price);
  }

  buyShopItem(shopItemIndex: number): boolean {
    if (shopItemIndex < 0 || shopItemIndex >= this.shopItems.length) return false;
    const shopItem = this.shopItems[shopItemIndex];
    if (shopItem.bought || !this.resources.canSpend(shopItem.price)) return false;
    this.resources.spendClicks(shopItem.price);
    shopItem.bought = true;
    return true;
  }
}
