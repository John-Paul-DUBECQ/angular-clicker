import { UnlockMethod } from './unlocks/unlock-method';
import { KitchenModifiers } from './kitchen/dish.model';

export interface House {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  tags?: string[];
  level: number;
  bonusPerLevel: number;
  price: number;
  costs: import('./resource').ResourceCost[];
  unlockPrice?: number;
  unlockCosts?: import('./resource').ResourceCost[];
  unlocked?: boolean;
  maxLevel?: number;
  baitIntervalSeconds?: number;
  baitAmountPerCycle?: number;
  nextBaitInSeconds?: number;
  vesselRushVesselCount?: number;
  vesselRushDurationSeconds?: number;
  vesselRewardMultiplier?: number;
  vesselSpawnIntervalFactor?: number;
  /** Secondes ajoutées à tous les plats par la maison du délai de consommation. */
  delayKitchenDurationBonusSeconds?: number;
  houseIndex?: number;
  /** Conditions cumulables nécessaires pour débloquer la maison. */
  unlockMethod?: UnlockMethod;
  /**
   * Améliore une seule propriété d'un plat tant qu'il est actif.
   * `bonusPerLevel` utilise la même unité que la propriété dans `KitchenModifiers`.
   * `durationPerLevel` ajoute des secondes à la durée du plat.
   */
  dishUpgrade?: {
    dishId: string;
    modifier?: keyof KitchenModifiers;
    bonusPerLevel?: number;
    durationPerLevel?: number;
  };
}
