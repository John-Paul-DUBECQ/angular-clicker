import { Injectable } from '@angular/core';
import { House } from '../house';
import { ResourcesService } from './resources.service';
import { ResourceCost } from '../resource';

const CRITICAL_HOUSE_ID = 'critical-house';
const CRITICAL_HOUSE_BASE_PRICE = 10;
const CRITICAL_HOUSE_PRICE_GROWTH = 1.8;
const CRITICAL_HOUSE_BONUS_PER_LEVEL = 0.03;
const CRITICAL_HOUSE_COSTS: ResourceCost[] = [
  { resourceId: 'food', amount: 5 },
  { resourceId: 'mosh-tooth', amount: 2 },
];
const BAIT_HOUSE_ID = 'bait-house';
const BAIT_HOUSE_BASE_INTERVAL_SECONDS = 10 * 60;
const BAIT_HOUSE_INTERVAL_STEP_SECONDS = 20;
const BAIT_HOUSE_MIN_INTERVAL_SECONDS = 80;
const BAIT_HOUSE_MAX_LEVEL = Math.floor(
  (BAIT_HOUSE_BASE_INTERVAL_SECONDS - BAIT_HOUSE_MIN_INTERVAL_SECONDS) / BAIT_HOUSE_INTERVAL_STEP_SECONDS
);
const BAIT_HOUSE_UNLOCK_PRICE = 1;
const BAIT_HOUSE_UNLOCK_COSTS: ResourceCost[] = [
  { resourceId: 'food', amount: 0 },
  { resourceId: 'mosh-tooth', amount: 0 },
];
const BAIT_HOUSE_UPGRADE_COSTS: ResourceCost[] = [
  { resourceId: 'food', amount: 0 },
  { resourceId: 'mosh-tooth', amount: 0 },
];

@Injectable({ providedIn: 'root' })
export class HouseStateService {
  private houses: House[] = [
    {
      id: CRITICAL_HOUSE_ID,
      name: 'Maison du Mineur',
      description: '+3 % de chance de coup critique par niveau.',
      imageUrl: 'assets/img/House/House1.png',
      level: 0,
      bonusPerLevel: CRITICAL_HOUSE_BONUS_PER_LEVEL,
      price: CRITICAL_HOUSE_BASE_PRICE,
      costs: CRITICAL_HOUSE_COSTS,
      unlocked: true,
    },
    {
      id: BAIT_HOUSE_ID,
      name: 'Maison des Appâts',
      description: 'Génère automatiquement un appât qui attire un monstre. -20 secondes par niveau.',
      imageUrl: 'assets/img/House/House1.png',
      level: 0,
      bonusPerLevel: 0,
      price: 0,
      costs: BAIT_HOUSE_UPGRADE_COSTS,
      unlockPrice: BAIT_HOUSE_UNLOCK_PRICE,
      unlockCosts: BAIT_HOUSE_UNLOCK_COSTS,
      unlocked: false,
      maxLevel: BAIT_HOUSE_MAX_LEVEL,
      baitIntervalSeconds: BAIT_HOUSE_BASE_INTERVAL_SECONDS,
      nextBaitInSeconds: BAIT_HOUSE_BASE_INTERVAL_SECONDS,
    },
  ];

  constructor(private resources: ResourcesService) {}

  getHousesView(): House[] {
    return this.houses.map((house) => ({
      ...house,
      price: this.getPrice(house),
      costs: house.costs.map((cost) => ({
        ...cost,
        amount: cost.amount * Math.max(1, house.level + 1),
      })),
      unlockCosts: house.unlockCosts?.map((cost) => ({ ...cost })),
      unlocked: house.unlocked,
      maxLevel: house.maxLevel,
      baitIntervalSeconds: house.id === BAIT_HOUSE_ID
        ? this.getBaitIntervalSeconds(house)
        : house.baitIntervalSeconds,
      nextBaitInSeconds: house.nextBaitInSeconds,
    }));
  }

  getCriticalHitChanceBonus(): number {
    const house = this.houses.find((item) => item.id === CRITICAL_HOUSE_ID);
    return house ? house.level * house.bonusPerLevel : 0;
  }

  tick(seconds: number, onBaitGenerated: () => void): void {
    const house = this.houses.find((item) => item.id === BAIT_HOUSE_ID);
    if (!house || !house.unlocked || house.level <= 0 || house.nextBaitInSeconds == null) return;
    house.nextBaitInSeconds -= seconds;
    while (house.nextBaitInSeconds <= 0) {
      house.nextBaitInSeconds += this.getBaitIntervalSeconds(house);
      onBaitGenerated();
    }
  }

  canBuy(index: number): boolean {
    const house = this.houses[index];
    if (!house) return false;
    if (!house.unlocked) {
      return this.resources.getMonsterEssence() >= (house.unlockPrice ?? 0)
        && this.resources.canSpendResources(house.unlockCosts ?? []);
    }
    if (house.maxLevel != null && house.level >= house.maxLevel) return false;
    return this.resources.getMonsterEssence() >= this.getPrice(house)
      && this.resources.canSpendResources(this.getCostsForNextLevel(house));
  }

  buy(index: number): boolean {
    const house = this.houses[index];
    if (!house) return false;
    if (!house.unlocked) {
      const unlockPrice = house.unlockPrice ?? 0;
      const unlockCosts = house.unlockCosts ?? [];
      if (this.resources.getMonsterEssence() < unlockPrice
        || !this.resources.canSpendResources(unlockCosts)) return false;
      if (!this.resources.spendMonsterEssence(unlockPrice)) return false;
      if (!this.resources.spendResources(unlockCosts)) return false;
      house.unlocked = true;
      house.level = 1;
      house.nextBaitInSeconds = this.getBaitIntervalSeconds(house);
      return true;
    }
    if (house.maxLevel != null && house.level >= house.maxLevel) return false;
    const price = this.getPrice(house);
    const costs = this.getCostsForNextLevel(house);
    if (!this.resources.spendMonsterEssence(price) || !this.resources.spendResources(costs)) return false;
    house.level += 1;
    return true;
  }

  getLevels(): number[] {
    return this.houses.map((house) => house.level);
  }

  setLevels(levels: number[]): void {
    this.houses.forEach((house, index) => {
      house.level = Math.max(0, Math.floor(levels[index] ?? 0));
      if (house.id === BAIT_HOUSE_ID) {
        house.unlocked = house.level > 0;
        house.nextBaitInSeconds = this.getBaitIntervalSeconds(house);
      }
    });
  }

  private getPrice(house: House): number {
    return Math.max(1, Math.floor(house.price * Math.pow(CRITICAL_HOUSE_PRICE_GROWTH, house.level)));
  }

  private getCostsForNextLevel(house: House): ResourceCost[] {
    return house.costs.map((cost) => ({
      ...cost,
      amount: cost.amount * Math.max(1, house.level + 1),
    }));
  }

  private getBaitIntervalSeconds(house: House): number {
    return Math.max(
      BAIT_HOUSE_MIN_INTERVAL_SECONDS,
      BAIT_HOUSE_BASE_INTERVAL_SECONDS - Math.max(0, house.level - 1) * BAIT_HOUSE_INTERVAL_STEP_SECONDS
    );
  }
}
