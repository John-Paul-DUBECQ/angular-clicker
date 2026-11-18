import { Injectable } from '@angular/core';
import { ShopItem } from '../shop-item';

@Injectable({ providedIn: 'root' })
export class UnlockUpgradeService {
  private shopItems: ShopItem[] = [];

  setShopItems(items: ShopItem[]): void {
    this.shopItems = items;
  }

  getBonus(unlockId: string, type: string): number {
    return this.shopItems
      .filter((item) =>
        item.bought &&
        item.unlockUpgrade?.unlockId === unlockId &&
        item.unlockUpgrade?.type === type
      )
      .reduce((total, item) => total + (item.unlockUpgrade?.value ?? 0), 0);
  }

  getMultiplier(unlockId: string, type: string, minimum = 0.05): number {
    return Math.max(minimum, 1 + this.getBonus(unlockId, type));
  }
}
