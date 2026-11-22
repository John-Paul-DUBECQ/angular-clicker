import { Injectable } from '@angular/core';
import { RESOURCE_DEFINITIONS } from '../resource';
import { UnlockContext } from '../unlocks/unlock-method';
import { HouseStateService } from '../game/house-state.service';
import { ResourcesService } from '../game/resources.service';
import { UnlockUpgradeService } from '../game/unlock-upgrade.service';
import {
  DishDefinition,
  DishView,
  KitchenModifiers,
  KitchenView,
  applyDishEffect,
  DISH_EFFECT_MODIFIER,
  describeDishEffect,
  dishUpgradeId,
  emptyKitchenModifiers,
  isKitchenModifierType,
} from './dish.model';
import { isKitchenUnlocked } from './kitchen-unlock';
import { LIST_DISH } from './list-dish';

export interface KitchenSaveData {
  stock?: Record<string, number>;
  buffEndsAt?: Record<string, number>;
}

@Injectable({ providedIn: 'root' })
export class KitchenStateService {
  private stock: Record<string, number> = {};
  private buffEndsAt: Record<string, number> = {};

  constructor(
    private resources: ResourcesService,
    private unlockUpgrades: UnlockUpgradeService,
    private houseState: HouseStateService
  ) {}

  getView(context: UnlockContext, now = Date.now()): KitchenView {
    const unlocked = isKitchenUnlocked(context.getWorkerLevel);
    const modifiers = this.getModifiers(now);
    const dishes = unlocked
      ? LIST_DISH
        .filter((dish) => dish.unlockMethod?.isUnlocked(context) ?? true)
        .map((dish) => this.toView(dish, context, now))
      : [];
    return {
      unlocked,
      dishes,
      activeDishes: dishes.filter((dish) => dish.active),
      luck: modifiers.luck,
    };
  }

  getModifiers(now = Date.now()): KitchenModifiers {
    const modifiers = emptyKitchenModifiers();
    for (const dish of LIST_DISH) {
      if ((this.buffEndsAt[dish.id] ?? 0) <= now) continue;
      for (const effect of dish.effects) {
        applyDishEffect(modifiers, effect.kind, effect.baseValue);
      }
      this.applyDishBonuses(modifiers, dish.id);
    }
    return modifiers;
  }

  cook(dishId: string, context: UnlockContext): boolean {
    const dish = this.findDish(dishId);
    if (!dish || !this.canCook(dish, context)) return false;
    if (!this.resources.spendResources(dish.ingredients)) return false;
    this.stock[dish.id] = (this.stock[dish.id] ?? 0) + 1;
    return true;
  }

  /**
   * Consomme un plat en réserve. Si le même plat est déjà actif, sa durée s'ajoute.
   */
  use(dishId: string, context: UnlockContext, now = Date.now()): boolean {
    const dish = this.findDish(dishId);
    if (!dish || !isKitchenUnlocked(context.getWorkerLevel)) return false;
    if ((this.stock[dish.id] ?? 0) < 1) return false;
    this.stock[dish.id] -= 1;
    const durationMs = this.getDurationSeconds(dish) * 1000;
    const currentEnd = this.buffEndsAt[dish.id] ?? 0;
    this.buffEndsAt[dish.id] = Math.max(now, currentEnd) + durationMs;
    return true;
  }

  getSaveData(): KitchenSaveData {
    const now = Date.now();
    const stock: Record<string, number> = {};
    const buffEndsAt: Record<string, number> = {};
    for (const [dishId, amount] of Object.entries(this.stock)) {
      if (amount > 0) stock[dishId] = amount;
    }
    for (const [dishId, endsAt] of Object.entries(this.buffEndsAt)) {
      if (endsAt > now) buffEndsAt[dishId] = endsAt;
    }
    return { stock, buffEndsAt };
  }

  setSaveData(data: KitchenSaveData | undefined): void {
    this.stock = {};
    this.buffEndsAt = {};
    for (const [dishId, amount] of Object.entries(data?.stock ?? {})) {
      if (!LIST_DISH.some((dish) => dish.id === dishId)) continue;
      const stored = Math.floor(amount);
      if (stored > 0) this.stock[dishId] = stored;
    }
    for (const [dishId, endsAt] of Object.entries(data?.buffEndsAt ?? {})) {
      if (!LIST_DISH.some((dish) => dish.id === dishId)) continue;
      if (typeof endsAt === 'number' && Number.isFinite(endsAt) && endsAt > 0) {
        this.buffEndsAt[dishId] = endsAt;
      }
    }
  }

  private toView(dish: DishDefinition, context: UnlockContext, now: number): DishView {
    const durationBonusSeconds = this.getDurationBonusSeconds(dish.id);
    const bonuses = this.getDishModifierBonuses(dish.id);
    const unlocked = dish.unlockMethod?.isUnlocked(context) ?? true;
    const ingredients = dish.ingredients.map((cost) => ({
      resourceId: cost.resourceId,
      name: RESOURCE_DEFINITIONS.find((resource) => resource.id === cost.resourceId)?.name ?? cost.resourceId,
      amount: cost.amount,
      owned: this.resources.getResourceAmount(cost.resourceId),
    }));
    const remainingMs = Math.max(0, (this.buffEndsAt[dish.id] ?? 0) - now);
    return {
      id: dish.id,
      name: dish.name,
      description: dish.description,
      tags: dish.tags ?? [],
      unlocked,
      unlockLabel: dish.unlockMethod?.description ?? '',
      ingredients,
      canCook: this.canCook(dish, context),
      stock: this.stock[dish.id] ?? 0,
      effectLabels: dish.effects.map((effect) => {
        const modifier = DISH_EFFECT_MODIFIER[effect.kind];
        return describeDishEffect(effect.kind, effect.baseValue + (bonuses[modifier] ?? 0));
      }),
      durationSeconds: dish.baseDurationSeconds + durationBonusSeconds,
      remainingSeconds: Math.ceil(remainingMs / 1000),
      active: remainingMs > 0,
      baseDurationSeconds: dish.baseDurationSeconds,
      durationBonusSeconds,
    };
  }

  private canCook(dish: DishDefinition, context: UnlockContext): boolean {
    return isKitchenUnlocked(context.getWorkerLevel)
      && (dish.unlockMethod?.isUnlocked(context) ?? true)
      && this.resources.canSpendResources(dish.ingredients);
  }

  private getDurationSeconds(dish: DishDefinition): number {
    return Math.max(1, dish.baseDurationSeconds + this.getDurationBonusSeconds(dish.id));
  }

  private getDurationBonusSeconds(dishId: string): number {
    return this.unlockUpgrades.getBonus(dishUpgradeId(dishId), 'duration')
      + this.houseState.getDishUpgradeBonuses(dishId).duration
      + this.houseState.getConsumptionDurationBonusSeconds();
  }

  private getDishModifierBonuses(dishId: string): Partial<KitchenModifiers> {
    const bonuses: Partial<KitchenModifiers> = { ...this.houseState.getDishUpgradeBonuses(dishId).modifiers };
    (Object.keys(emptyKitchenModifiers()) as (keyof KitchenModifiers)[]).forEach((type) => {
      const shopBonus = this.unlockUpgrades.getBonus(dishUpgradeId(dishId), type);
      if (shopBonus !== 0) bonuses[type] = (bonuses[type] ?? 0) + shopBonus;
    });
    return bonuses;
  }

  private applyDishBonuses(modifiers: KitchenModifiers, dishId: string): void {
    const bonuses = this.getDishModifierBonuses(dishId);
    (Object.keys(bonuses) as (keyof KitchenModifiers)[]).forEach((type) => {
      const bonus = bonuses[type];
      if (bonus) this.addModifierBonus(modifiers, type, bonus);
    });
  }

  private addModifierBonus(target: KitchenModifiers, type: keyof KitchenModifiers, value: number): void {
    if (!isKitchenModifierType(type)) return;
    if (type === 'damageMultiplier') {
      target.damageMultiplier += value;
      return;
    }
    if (type === 'adventureCooldownFactor') {
      target.adventureCooldownFactor = Math.max(0.2, target.adventureCooldownFactor - value);
      return;
    }
    target[type] += value;
  }

  private findDish(dishId: string): DishDefinition | undefined {
    return LIST_DISH.find((dish) => dish.id === dishId);
  }
}
