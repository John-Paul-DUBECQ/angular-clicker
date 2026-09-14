import { Injectable } from '@angular/core';
import { EssenceShopItem } from '../essence-shop-item';
import { listEssenceShopItem } from '../list-essence-shop-item';
import { ResourcesService } from './resources.service';

@Injectable({ providedIn: 'root' })
export class EssenceShopStateService {
  private items: EssenceShopItem[] = listEssenceShopItem;

  constructor(private resources: ResourcesService) {}

  getItems(): EssenceShopItem[] {
    return this.items;
  }

  getItemsView(): EssenceShopItem[] {
    return this.items.map((item) => ({ ...item, price: this.getPrice(item) }));
  }

  getEssenceMultiplier(): number {
    return this.items.reduce((multiplier, item) => {
      const effect = item.secondaryEssenceMultiplier
        ?? (item.effectType === 'essence' ? item.effectValue : 1);
      return multiplier + (effect - 1) * item.level;
    }, 1);
  }

  getSpawnRateMultiplier(): number {
    return this.getMultiplier('spawnRate');
  }

  getMonsterHpMultiplier(): number {
    return this.getMultiplier('hp');
  }

  getMonsterTimeMultiplier(): number {
    return this.getMultiplier('time');
  }

  getStats(): { spawnRate: number; essence: number; hp: number; time: number } {
    return {
      spawnRate: this.getSpawnRateMultiplier(),
      essence: this.getEssenceMultiplier(),
      hp: this.getMonsterHpMultiplier(),
      time: this.getMonsterTimeMultiplier(),
    };
  }

  getLevels(): number[] {
    return this.items.map((item) => item.level);
  }

  canBuyItem(index: number): boolean {
    const item = this.items[index];
    return item != null && this.canBuy(this.getPrice(item));
  }

  private canBuy(price: number): boolean {
    const essence = this.resources.getMonsterEssence();
    return essence >= price;
  }

  buy(index: number): boolean {
    const item = this.items[index];
    if (!item) {
      console.warn('[EssenceShop] index introuvable', { index, itemCount: this.items.length });
      return false;
    }
    const price = this.getPrice(item);
    const essence = this.resources.getMonsterEssence();
    console.log('[EssenceShop] tentative achat service', {
      index,
      id: item.id,
      level: item.level,
      price,
      essence,
    });
    if (essence < price) {
      console.warn('[EssenceShop] essence insuffisante', { index, price, essence });
      return false;
    }
    this.resources.addMonsterEssence(-price);
    item.level += 1;
    item.bought = true;
    console.log('[EssenceShop] achat validé', { index, id: item.id, level: item.level, price });
    return true;
  }

  setBought(bought: boolean[]): void {
    const legacyIndexMap = bought.length === 3 ? [8, 7, 6] : [];
    this.items.forEach((item, index) => {
      const sourceIndex = legacyIndexMap.length > 0 ? legacyIndexMap.indexOf(index) : index;
      item.level = sourceIndex >= 0 && bought[sourceIndex] === true ? 1 : 0;
      item.bought = item.level > 0;
    });
  }

  setLevels(levels: number[]): void {
    this.items.forEach((item, index) => {
      item.level = Math.max(0, Math.floor(levels[index] ?? 0));
      item.bought = item.level > 0;
    });
  }

  private getPrice(item: EssenceShopItem): number {
    return Math.max(1, Math.floor(item.basePrice * Math.pow(item.priceGrowth, item.level)));
  }

  private getMultiplier(type: EssenceShopItem['effectType']): number {
    return this.items
      .filter((item) => item.effectType === type)
      .reduce((multiplier, item) => multiplier + (item.effectValue - 1) * item.level, 1);
  }
}
