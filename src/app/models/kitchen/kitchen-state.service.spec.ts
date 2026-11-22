import { TestBed } from '@angular/core/testing';
import { HouseStateService } from '../game/house-state.service';
import { ResourcesService } from '../game/resources.service';
import { ShopStateService } from '../game/shop-state.service';
import { UnlockUpgradeService } from '../game/unlock-upgrade.service';
import { ShopItem } from '../shop-item';
import { UnlockContext } from '../unlocks/unlock-method';
import { applyDishEffect, emptyKitchenModifiers } from './dish.model';
import { KitchenStateService } from './kitchen-state.service';
import { KITCHEN_EXPLORER_INDEX } from './kitchen-unlock';
import { LIST_DISH } from './list-dish';

describe('KitchenStateService', () => {
  let kitchen: KitchenStateService;
  let resources: ResourcesService;
  let houses: HouseStateService;
  let upgrades: UnlockUpgradeService;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(1_000_000));
    TestBed.configureTestingModule({});
    kitchen = TestBed.inject(KitchenStateService);
    resources = TestBed.inject(ResourcesService);
    houses = TestBed.inject(HouseStateService);
    upgrades = TestBed.inject(UnlockUpgradeService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    jasmine.clock().uninstall();
  });

  function context(level: number, geometerLevel = 0): UnlockContext {
    return {
      clicks: 0,
      getWorkerLevel: (workerIndex) => {
        if (workerIndex === KITCHEN_EXPLORER_INDEX) return level;
        if (workerIndex === 7) return geometerLevel;
        return null;
      },
    };
  }

  it('keeps the kitchen locked before Explorateur level 60', () => {
    expect(kitchen.getView(context(59)).unlocked).toBeFalse();
    resources.setResourceAmounts({ 'mosh-paw': 5, 'mosh-tooth': 2 });
    expect(kitchen.cook('ragout-de-mosh', context(59))).toBeFalse();
  });

  it('cooks a stored dish and stacks its duration when eaten again', () => {
    resources.setResourceAmounts({ 'mosh-paw': 10, 'mosh-tooth': 4 });

    expect(kitchen.cook('ragout-de-mosh', context(60))).toBeTrue();
    expect(kitchen.cook('ragout-de-mosh', context(60))).toBeTrue();
    expect(resources.getResourceAmount('mosh-paw')).toBe(0);
    expect(kitchen.use('ragout-de-mosh', context(60))).toBeTrue();
    expect(kitchen.use('ragout-de-mosh', context(60))).toBeTrue();

    const dish = kitchen.getView(context(60)).dishes.find((entry) => entry.id === 'ragout-de-mosh');
    expect(dish?.stock).toBe(0);
    expect(dish?.active).toBeTrue();
    expect(dish?.remainingSeconds).toBe(120);
    expect(dish?.effectLabels).toContain('Apparition des monstres +25 %');
    expect(kitchen.getModifiers().monsterSpawnRateMultiplier).toBeCloseTo(1.25, 10);
    expect(kitchen.use('ragout-de-mosh', context(60))).toBeFalse();
  });

  it('scales one dish from its shop purchases and its house level', () => {
    const shopItems = TestBed.inject(ShopStateService).getShopItems();
    const power: ShopItem = {
      name: 'Recette test',
      description: '',
      price: 0,
      doesAppearInGame: true,
      bought: true,
      value: 1,
      unlockUpgrade: { unlockId: 'dish:ragout-de-mosh', type: 'monsterSpawnRateMultiplier', value: 0.1 },
    };
    const duration: ShopItem = {
      name: 'Cuisson test',
      description: '',
      price: 0,
      doesAppearInGame: true,
      bought: true,
      value: 1,
      unlockUpgrade: { unlockId: 'dish:ragout-de-mosh', type: 'duration', value: 12 },
    };
    upgrades.setShopItems([...shopItems, power, duration]);
    const house = houses.getHousesView(0, 0, 60)
      .find((entry) => entry.id === 'kitchen-house-ragout-de-mosh-monsterSpawnRateMultiplier');
    const levels = houses.getLevels();
    levels[house!.houseIndex!] = 2;
    houses.setLevels(levels);

    resources.setResourceAmounts({ 'mosh-paw': 5, 'mosh-tooth': 2 });
    kitchen.cook('ragout-de-mosh', context(60));
    kitchen.use('ragout-de-mosh', context(60));

    const dish = kitchen.getView(context(60)).dishes.find((entry) => entry.id === 'ragout-de-mosh');
    expect(dish?.effectLabels).toContain('Apparition des monstres +40 %');
    expect(dish?.durationBonusSeconds).toBe(24);
    expect(dish?.durationSeconds).toBe(84);
    expect(kitchen.getModifiers().monsterSpawnRateMultiplier).toBeCloseTo(1.4, 10);
    expect(kitchen.getModifiers().resourceDropMultiplier).toBe(1);
    upgrades.setShopItems(shopItems);
  });

  it('adds a bought dish modifier only while that dish is active', () => {
    const shopItems = TestBed.inject(ShopStateService).getShopItems();
    upgrades.setShopItems([...shopItems, {
      name: 'Beacon',
      description: '',
      price: 0,
      bought: true,
      unlockUpgrade: { unlockId: 'dish:ration-de-chasseur', type: 'vesselSpawnRateMultiplier', value: 0.3 },
    }]);

    expect(kitchen.getModifiers().vesselSpawnRateMultiplier).toBe(1);
    resources.setResourceAmounts({ 'cargo-scrap': 2, 'hunter-beacon': 1 });
    kitchen.cook('ration-de-chasseur', context(60, 10));
    kitchen.use('ration-de-chasseur', context(60, 10));

    const dish = kitchen.getView(context(60, 10)).dishes.find((entry) => entry.id === 'ration-de-chasseur');
    expect(dish?.effectLabels).toContain('Apparition des vaisseaux +60 %');
    expect(kitchen.getModifiers().vesselSpawnRateMultiplier).toBeCloseTo(1.6, 10);
    expect(kitchen.getModifiers().monsterSpawnRateMultiplier).toBe(1);
    expect(kitchen.getView(context(60)).dishes.some((entry) => entry.id === 'queue-grillee')).toBeFalse();
    upgrades.setShopItems(shopItems);
  });

  it('adds 10 seconds to every dish per level of the consumption house', () => {
    const house = houses.getHousesView(0, 0, 60).find((entry) => entry.id === 'delay-kitchen-house');
    resources.setMonsterEssence(1000);
    resources.setResourceAmounts({ food: 100, 'mosh-tail': 100 });

    expect(houses.buy(house!.houseIndex!, 0, 0, 60)).toBeTrue();
    expect(houses.buy(house!.houseIndex!, 0, 0, 60)).toBeTrue();

    const dishes = kitchen.getView(context(90)).dishes;
    expect(dishes.length).toBeGreaterThan(1);
    dishes.forEach((dish) => expect(dish.durationBonusSeconds).toBe(20));
  });

  it('tracks luck without turning it into another modifier', () => {
    resources.setResourceAmounts({ 'peji-tongue': 1, 'mosh-tooth': 2, bulb: 1 });
    kitchen.cook('dessert-de-la-chance', context(90));
    kitchen.use('dessert-de-la-chance', context(90));

    const modifiers = kitchen.getModifiers();
    expect(modifiers.luck).toBe(8);
    expect(modifiers.damageMultiplier).toBe(1);
    expect(modifiers.monsterSpawnRateMultiplier).toBe(1);
  });

  it('caps stacked adventure cooldown reductions', () => {
    const modifiers = emptyKitchenModifiers();
    applyDishEffect(modifiers, 'adventure-cooldown', 0.5);
    applyDishEffect(modifiers, 'adventure-cooldown', 0.5);
    expect(modifiers.adventureCooldownFactor).toBeCloseTo(0.2, 10);
  });

  it('restores stock and active dishes from a save', () => {
    resources.setResourceAmounts({ 'mosh-paw': 5, 'mosh-tooth': 2 });
    kitchen.cook('ragout-de-mosh', context(60));
    kitchen.use('ragout-de-mosh', context(60));
    const saved = kitchen.getSaveData();

    kitchen.setSaveData(undefined);
    expect(kitchen.getView(context(60)).dishes.find((entry) => entry.id === 'ragout-de-mosh')?.stock).toBe(0);

    kitchen.setSaveData(saved);
    const dish = kitchen.getView(context(60)).dishes.find((entry) => entry.id === 'ragout-de-mosh');
    expect(dish?.active).toBeTrue();
    expect(LIST_DISH.some((entry) => entry.id === 'ragout-de-mosh')).toBeTrue();
  });
});
