export interface EssenceShopItem {
  id: string;
  name: string;
  description: string;
  effectType: EssenceShopEffectType;
  effectValue: number;
  secondaryEssenceMultiplier?: number;
  basePrice: number;
  priceGrowth: number;
  price: number;
  level: number;
  imageUrl?: string;
  bought: boolean;
}

export type EssenceShopEffectType =
  | 'spawnRate'
  | 'essence'
  | 'hp'
  | 'time';
