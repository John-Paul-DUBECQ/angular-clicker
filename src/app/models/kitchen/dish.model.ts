import { ResourceCost } from '../resource';
import { UnlockMethod } from '../unlocks/unlock-method';

/**
 * Effets de plat. Pour en ajouter un :
 * 1. étendre `DishEffectKind` ;
 * 2. l'appliquer dans `applyDishEffect` ;
 * 3. le décrire dans `describeDishEffect` ;
 * 4. brancher le modificateur correspondant là où le jeu le consomme.
 * Un plat verrouillé par une fonctionnalité future se contente d'un `unlockMethod`.
 */
export type DishEffectKind =
  | 'monster-spawn-rate'
  | 'vessel-spawn-rate'
  | 'damage-multiplier'
  | 'critical-chance'
  | 'critical-damage'
  | 'luck'
  | 'essence-drop'
  | 'resource-drop'
  | 'ticket-reward'
  | 'adventure-cooldown';

export interface DishEffect {
  kind: DishEffectKind;
  /** Valeur de base, avant les bonus de shop et de maison. */
  baseValue: number;
}

export interface DishDefinition {
  id: string;
  name: string;
  description: string;
  ingredients: ResourceCost[];
  effects: DishEffect[];
  baseDurationSeconds: number;
  tags?: string[];
  unlockMethod?: UnlockMethod;
}

/** Bonus de shop lié à un plat : `unlockUpgrade.unlockId = dishUpgradeId(dishId)`. */
export function dishUpgradeId(dishId: string): string {
  return `dish:${dishId}`;
}

/** Chaque effet de plat correspond à une seule propriété de `KitchenModifiers`. */
export const DISH_EFFECT_MODIFIER: Record<DishEffectKind, keyof KitchenModifiers> = {
  'monster-spawn-rate': 'monsterSpawnRateMultiplier',
  'vessel-spawn-rate': 'vesselSpawnRateMultiplier',
  'damage-multiplier': 'damageMultiplier',
  'critical-chance': 'criticalChanceBonus',
  'critical-damage': 'criticalDamageBonus',
  'luck': 'luck',
  'essence-drop': 'essenceDropMultiplier',
  'resource-drop': 'resourceDropMultiplier',
  'ticket-reward': 'ticketRewardMultiplier',
  'adventure-cooldown': 'adventureCooldownFactor',
};

const MODIFIER_EFFECT_KIND: Record<keyof KitchenModifiers, DishEffectKind> = {
  monsterSpawnRateMultiplier: 'monster-spawn-rate',
  vesselSpawnRateMultiplier: 'vessel-spawn-rate',
  damageMultiplier: 'damage-multiplier',
  criticalChanceBonus: 'critical-chance',
  criticalDamageBonus: 'critical-damage',
  luck: 'luck',
  essenceDropMultiplier: 'essence-drop',
  resourceDropMultiplier: 'resource-drop',
  ticketRewardMultiplier: 'ticket-reward',
  adventureCooldownFactor: 'adventure-cooldown',
};

export function isKitchenModifierType(type: string): type is keyof KitchenModifiers {
  return Object.prototype.hasOwnProperty.call(MODIFIER_EFFECT_KIND, type);
}

export interface KitchenModifiers {
  monsterSpawnRateMultiplier: number;
  vesselSpawnRateMultiplier: number;
  damageMultiplier: number;
  criticalChanceBonus: number;
  criticalDamageBonus: number;
  /** Chance ajoutée par les plats actifs. Elle s'ajoute au point de chance de la loterie. */
  luck: number;
  essenceDropMultiplier: number;
  resourceDropMultiplier: number;
  ticketRewardMultiplier: number;
  /** 1 = recharge normale. 0.75 = aventures et pièges 25 % plus courts. */
  adventureCooldownFactor: number;
}

export interface ActiveDishEffect {
  kind: DishEffectKind;
  value: number;
}

const MAX_ADVENTURE_COOLDOWN_REDUCTION = 0.8;

export function emptyKitchenModifiers(): KitchenModifiers {
  return {
    monsterSpawnRateMultiplier: 1,
    vesselSpawnRateMultiplier: 1,
    damageMultiplier: 1,
    criticalChanceBonus: 0,
    criticalDamageBonus: 0,
    luck: 0,
    essenceDropMultiplier: 1,
    resourceDropMultiplier: 1,
    ticketRewardMultiplier: 1,
    adventureCooldownFactor: 1,
  };
}

export function applyDishEffect(target: KitchenModifiers, kind: DishEffectKind, value: number): void {
  switch (kind) {
    case 'monster-spawn-rate':
      target.monsterSpawnRateMultiplier += value;
      return;
    case 'vessel-spawn-rate':
      target.vesselSpawnRateMultiplier += value;
      return;
    case 'damage-multiplier':
      target.damageMultiplier *= value;
      return;
    case 'critical-chance':
      target.criticalChanceBonus += value;
      return;
    case 'critical-damage':
      target.criticalDamageBonus += value;
      return;
    case 'luck':
      target.luck += value;
      return;
    case 'essence-drop':
      target.essenceDropMultiplier += value;
      return;
    case 'resource-drop':
      target.resourceDropMultiplier += value;
      return;
    case 'ticket-reward':
      target.ticketRewardMultiplier += value;
      return;
    case 'adventure-cooldown':
      target.adventureCooldownFactor = Math.max(
        1 - MAX_ADVENTURE_COOLDOWN_REDUCTION,
        target.adventureCooldownFactor - value
      );
      return;
  }
}

export function describeDishEffect(kind: DishEffectKind, value: number): string {
  switch (kind) {
    case 'monster-spawn-rate':
      return `Apparition des monstres +${formatPercent(value)}`;
    case 'vessel-spawn-rate':
      return `Apparition des vaisseaux +${formatPercent(value)}`;
    case 'damage-multiplier':
      return `Dégâts ×${formatMultiplier(value)}`;
    case 'critical-chance':
      return `Chance de critique +${formatPercent(value)}`;
    case 'critical-damage':
      return `Dégâts critiques +${formatPercent(value)}`;
    case 'luck':
      return `Chance +${formatAmount(value)}`;
    case 'essence-drop':
      return `Drop d'essence +${formatPercent(value)}`;
    case 'resource-drop':
      return `Drop de ressources +${formatPercent(value)}`;
    case 'ticket-reward':
      return `Tickets de mission +${formatPercent(value)}`;
    case 'adventure-cooldown':
      return `Recharge des aventures et des pièges −${formatPercent(value)}`;
  }
}

export function scaleResourceAmount(amount: number, multiplier: number): number {
  const scaled = Math.max(0, amount) * Math.max(0, multiplier);
  const whole = Math.floor(scaled);
  return whole + (Math.random() < scaled - whole ? 1 : 0);
}

export interface DishIngredientView {
  resourceId: string;
  name: string;
  amount: number;
  owned: number;
}

export interface DishView {
  id: string;
  name: string;
  description: string;
  tags: string[];
  unlocked: boolean;
  unlockLabel: string;
  ingredients: DishIngredientView[];
  canCook: boolean;
  stock: number;
  effectLabels: string[];
  durationSeconds: number;
  remainingSeconds: number;
  active: boolean;
  baseDurationSeconds: number;
  durationBonusSeconds: number;
}

export interface KitchenView {
  unlocked: boolean;
  dishes: DishView[];
  activeDishes: DishView[];
  /** Chance des plats actifs, ajoutée à la chance de la loterie. */
  luck: number;
}

function formatPercent(value: number): string {
  return `${formatAmount(value * 100)} %`;
}

function formatMultiplier(value: number): string {
  return formatAmount(value);
}

function formatAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2).replace(/0$/, '');
}
