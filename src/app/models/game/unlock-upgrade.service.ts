import { Injectable } from '@angular/core';
import { ShopItem } from '../shop-item';

@Injectable({ providedIn: 'root' })
export class UnlockUpgradeService {
  private shopItems: ShopItem[] = [];

  setShopItems(items: ShopItem[]): void {
    this.shopItems = items;
  }

  getBonus(unlockId: string, type: string): number {
    return this.sumBonus((item) =>
      item.unlockUpgrade?.unlockId === unlockId && item.unlockUpgrade?.type === type
    );
  }

  /** Somme des bonus achetés d'un type, filtrés par identifiant. */
  sumBonusByType(type: string, acceptUnlockId: (unlockId: string) => boolean): number {
    return this.sumBonus((item) =>
      item.unlockUpgrade?.type === type && acceptUnlockId(item.unlockUpgrade.unlockId)
    );
  }

  private sumBonus(matches: (item: ShopItem) => boolean): number {
    return this.shopItems
      .filter((item) => item.bought && item.unlockUpgrade != null && matches(item))
      .reduce((total, item) => total + (item.unlockUpgrade?.value ?? 0), 0);
  }

  getMultiplier(unlockId: string, type: string, minimum = 0.05): number {
    return Math.max(minimum, 1 + this.getBonus(unlockId, type));
  }
}
