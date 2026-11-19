import { Injectable, Optional } from '@angular/core';
import { House } from '../house';
import { ResourcesService } from './resources.service';
import { ResourceCost } from '../resource';
import {
  VESSEL_RUSH_BASE_COUNT,
  VESSEL_RUSH_BASE_DURATION_SECONDS,
} from '../powers/effects/vessel-rush-effect';
import { UnlockMethod } from '../unlocks/unlock-method';
import { VESSEL_WORKER_INDEX } from '../unlocks/vessel';
import { SUN_WORKER_INDEX } from '../unlocks/sun-unlock';
import { UnlockUpgradeService } from './unlock-upgrade.service';

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
const BAIT_HOUSE_UNLOCK_PRICE = 5;
const BAIT_HOUSE_UNLOCK_COSTS: ResourceCost[] = [
  { resourceId: 'food', amount: 5 },
  { resourceId: 'mosh-tooth', amount: 2 },
];
const BAIT_HOUSE_UPGRADE_COSTS: ResourceCost[] = [
  { resourceId: 'food', amount: 1 },
  { resourceId: 'mosh-tooth', amount: 2  },
];
const VESSEL_RUSH_HOUSE_ID = 'vessel-rush-house';
const VESSEL_RUSH_HOUSE_VESSELS_PER_LEVEL = 2;
const VESSEL_RUSH_HOUSE_DURATION_PER_LEVEL_SECONDS = 1;
const VESSEL_RUSH_HOUSE_MAX_LEVEL = 10;
const VESSEL_RUSH_HOUSE_UNLOCK_COSTS: ResourceCost[] = [
  { resourceId: 'cargo-scrap', amount: 5 },
  { resourceId: 'warship-cell', amount: 3 },
  { resourceId: 'hunter-beacon', amount: 2 },
];
const VESSEL_RUSH_HOUSE_UPGRADE_COSTS: ResourceCost[] = [
  { resourceId: 'cargo-scrap', amount: 2 },
  { resourceId: 'warship-cell', amount: 1 },
  { resourceId: 'hunter-beacon', amount: 1 },
];
const VESSEL_REWARD_HOUSE_ID = 'vessel-reward-house';
const VESSEL_REWARD_HOUSE_UNLOCK_COSTS: ResourceCost[] = [
  { resourceId: 'cargo-scrap', amount: 3 },
  { resourceId: 'warship-cell', amount: 2 },
  { resourceId: 'hunter-beacon', amount: 1 },
];
const VESSEL_REWARD_HOUSE_UPGRADE_COSTS: ResourceCost[] = [
  { resourceId: 'cargo-scrap', amount: 2 },
  { resourceId: 'warship-cell', amount: 1 },
];
const VESSEL_REWARD_MULTIPLIER_PER_LEVEL = 1.1;
const VESSEL_SPAWN_INTERVAL_FACTOR_PER_LEVEL = 0.9;
const VESSEL_REWARD_HOUSE_MAX_LEVEL = 10;
const SOLAR_BALANCE_HOUSE_ID = 'solar-balance-house';
const SOLAR_BLUE_HOUSE_ID = 'solar-blue-house';
const SOLAR_YELLOW_HOUSE_ID = 'solar-yellow-house';
const SOLAR_HOUSE_MAX_LEVEL = 10;
const SOLAR_AFK_TO_CLICK_PER_LEVEL = 0.001;
const SOLAR_CLICK_TO_AFK_PER_LEVEL = 0.05;
const SOLAR_BLUE_CLICK_REWARD_PER_LEVEL = 1.05;
const SOLAR_BLUE_AUTO_DAMAGE_PER_LEVEL = 1.05;
const SOLAR_BLUE_MANA_PER_CLICK_PER_LEVEL = 0.1;
const SOLAR_BLUE_CRITICAL_CHANCE_PER_LEVEL = 0.005;
const SOLAR_BLUE_CRITICAL_DAMAGE_PER_LEVEL = 1.05;
const SOLAR_YELLOW_MONSTER_INTERVAL_PER_LEVEL = 0.95;
const SOLAR_YELLOW_STREAK_MULTIPLIER_PER_LEVEL = 1.1;

export type ActiveSolarColor = 'yellow' | 'blue';

export interface SolarHouseBonuses {
  activeColor: ActiveSolarColor | null;
  clickRewardMultiplier: number;
  autoDamageMultiplier: number;
  manaPerClickBonus: number;
  criticalChanceBonus: number;
  criticalDamageMultiplier: number;
  monsterSpawnRateMultiplier: number;
  streakClickMultiplier: number;
}

export interface SolarDamageExchange {
  clickDamageBonus: number;
  autoDamageBonus: number;
}

@Injectable({ providedIn: 'root' })
export class HouseStateService {
  private houses: House[] = [
    {
      id: CRITICAL_HOUSE_ID,
      name: 'Maison du Mineur',
      description: '+3 % de chance de coup critique par niveau.',
      imageUrl: 'assets/img/House/House1.png',
      tags: ['Combat'],
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
      tags: ['Appâts'],
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
    {
      id: VESSEL_RUSH_HOUSE_ID,
      name: 'Observatoire des Vaisseaux',
      description: '+2 vaisseaux et +1 seconde à la Rafale stellaire par niveau.',
      imageUrl: 'assets/img/House/House1.png',
      tags: ['Vaisseaux'],
      level: 0,
      bonusPerLevel: 0,
      price: 5,
      costs: VESSEL_RUSH_HOUSE_UPGRADE_COSTS,
      unlockPrice: 0,
      unlockCosts: VESSEL_RUSH_HOUSE_UNLOCK_COSTS,
      unlocked: false,
      maxLevel: VESSEL_RUSH_HOUSE_MAX_LEVEL,
      unlockMethod: UnlockMethod.workerLevel(VESSEL_WORKER_INDEX, 25),
    },
    {
      id: VESSEL_REWARD_HOUSE_ID,
      name: 'Hangar de ravitaillement',
      description: '+10 % aux récompenses et vaisseaux 10 % plus fréquents par niveau.',
      imageUrl: 'assets/img/House/House1.png',
      tags: ['Vaisseaux'],
      level: 0,
      bonusPerLevel: 0,
      price: 5,
      costs: VESSEL_REWARD_HOUSE_UPGRADE_COSTS,
      unlockPrice: 0,
      unlockCosts: VESSEL_REWARD_HOUSE_UNLOCK_COSTS,
      unlocked: false,
      maxLevel: VESSEL_REWARD_HOUSE_MAX_LEVEL,
      unlockMethod: UnlockMethod.workerLevel(VESSEL_WORKER_INDEX, 20),
    },
    {
      id: SOLAR_BALANCE_HOUSE_ID,
      name: 'Maison d’équilibrage solaire',
      description: 'À l’achat, débloque les Maisons du Soleil bleu et jaune et étend la zone de clic à toute la colonne centrale. Par niveau : +0.1 % des dégâts AFK à chaque clic et +5 % des dégâts du clic à la production AFK.',
      imageUrl: 'assets/img/House/House1.png',
      tags: ['Soleil'],
      level: 0,
      bonusPerLevel: 0,
      price: 10,
      costs: [
        { resourceId: 'bulb', amount: 2 },
        { resourceId: 'shell', amount: 1 },
      ],
      unlockPrice: 25,
      unlockCosts: [
        { resourceId: 'bulb', amount: 5 },
        { resourceId: 'shell', amount: 3 },
      ],
      unlocked: false,
      maxLevel: SOLAR_HOUSE_MAX_LEVEL,
      unlockMethod: UnlockMethod.workerLevel(SUN_WORKER_INDEX, 75),
    },
    {
      id: SOLAR_BLUE_HOUSE_ID,
      name: 'Maison du Soleil bleu',
      description: 'Pendant la phase bleue, par niveau : +5 % de dégâts AFK, +5 % de récompense par clic, +0,1 mana par clic, +0,5 point de critique et +5 % de dégâts critiques.',
      imageUrl: 'assets/img/House/House1.png',
      tags: ['Soleil'],
      level: 0,
      bonusPerLevel: 0,
      price: 5,
      costs: [
        { resourceId: 'shell', amount: 2 },
        { resourceId: 'mermaid-tail', amount: 1 },
      ],
      unlockPrice: 10,
      unlockCosts: [
        { resourceId: 'shell', amount: 4 },
        { resourceId: 'mermaid-tail', amount: 2 },
      ],
      unlocked: false,
      maxLevel: SOLAR_HOUSE_MAX_LEVEL,
    },
    {
      id: SOLAR_YELLOW_HOUSE_ID,
      name: 'Maison du Soleil jaune',
      description: 'Pendant la phase jaune, par niveau : délai d’apparition des monstres réduit de 5 % et progression du streak augmentée de 10 % par clic.',
      imageUrl: 'assets/img/House/House1.png',
      tags: ['Soleil'],
      level: 0,
      bonusPerLevel: 0,
      price: 5,
      costs: [
        { resourceId: 'bulb', amount: 2 },
        { resourceId: 'gribouy-ink', amount: 1 },
      ],
      unlockPrice: 10,
      unlockCosts: [
        { resourceId: 'bulb', amount: 4 },
        { resourceId: 'gribouy-ink', amount: 2 },
      ],
      unlocked: false,
      maxLevel: SOLAR_HOUSE_MAX_LEVEL,
    },
  ];

  constructor(
    private resources: ResourcesService,
    @Optional() private unlockUpgrades?: UnlockUpgradeService
  ) {}

  getHousesView(geometerLevel = 0, astrologueLevel = 0): House[] {
    return this.houses
      .map((house, houseIndex) => ({ house, houseIndex }))
      .filter(({ house }) => this.isHouseAvailable(house, geometerLevel, astrologueLevel))
      .map(({ house, houseIndex }) => ({
      ...house,
      houseIndex,
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
      baitAmountPerCycle: house.id === BAIT_HOUSE_ID
        ? this.getBaitAmountPerCycle()
        : undefined,
      nextBaitInSeconds: house.nextBaitInSeconds,
      vesselRushVesselCount: house.id === VESSEL_RUSH_HOUSE_ID
        ? this.getVesselRushVesselCount(house)
        : undefined,
      vesselRushDurationSeconds: house.id === VESSEL_RUSH_HOUSE_ID
        ? this.getVesselRushDurationSeconds(house)
        : undefined,
      vesselRewardMultiplier: house.id === VESSEL_REWARD_HOUSE_ID
        ? this.getVesselRewardMultiplier(house)
        : undefined,
      vesselSpawnIntervalFactor: house.id === VESSEL_REWARD_HOUSE_ID
        ? this.getVesselSpawnIntervalFactor(house)
        : undefined,
    }));
  }

  isSolarHubUnlocked(): boolean {
    return !!this.houses.find((house) => house.id === SOLAR_BALANCE_HOUSE_ID)?.unlocked;
  }

  getActiveSolarColor(now = Date.now()): ActiveSolarColor | null {
    if (!this.isSolarHubUnlocked()) return null;
    return Math.floor(now / 60000) % 2 === 0 ? 'yellow' : 'blue';
  }

  getSolarBonuses(now = Date.now()): SolarHouseBonuses {
    const activeColor = this.getActiveSolarColor(now);
    const blueLevel = activeColor === 'blue'
      ? this.getUnlockedHouseLevel(SOLAR_BLUE_HOUSE_ID)
      : 0;
    const yellowLevel = activeColor === 'yellow'
      ? this.getUnlockedHouseLevel(SOLAR_YELLOW_HOUSE_ID)
      : 0;
    const blueClickBonus = this.unlockUpgrades?.getBonus('house:solar-blue', 'click-reward') ?? 0;
    const blueAutoBonus = this.unlockUpgrades?.getBonus('house:solar-blue', 'auto-damage') ?? 0;
    const blueManaBonus = this.unlockUpgrades?.getBonus('house:solar-blue', 'mana-per-click') ?? 0;
    const blueCriticalChanceBonus = this.unlockUpgrades?.getBonus('house:solar-blue', 'critical-chance') ?? 0;
    const blueCriticalDamageBonus = this.unlockUpgrades?.getBonus('house:solar-blue', 'critical-damage') ?? 0;
    const yellowSpawnBonus = this.unlockUpgrades?.getBonus('house:solar-yellow', 'spawn-rate') ?? 0;
    const yellowStreakBonus = this.unlockUpgrades?.getBonus('house:solar-yellow', 'streak-click') ?? 0;
    return {
      activeColor,
      clickRewardMultiplier: Math.pow(SOLAR_BLUE_CLICK_REWARD_PER_LEVEL, blueLevel) * (1 + blueClickBonus),
      autoDamageMultiplier: Math.pow(SOLAR_BLUE_AUTO_DAMAGE_PER_LEVEL, blueLevel) * (1 + blueAutoBonus),
      manaPerClickBonus: blueLevel * SOLAR_BLUE_MANA_PER_CLICK_PER_LEVEL + blueManaBonus,
      criticalChanceBonus: blueLevel * SOLAR_BLUE_CRITICAL_CHANCE_PER_LEVEL + blueCriticalChanceBonus,
      criticalDamageMultiplier: Math.pow(SOLAR_BLUE_CRITICAL_DAMAGE_PER_LEVEL, blueLevel) * (1 + blueCriticalDamageBonus),
      monsterSpawnRateMultiplier: Math.pow(1 / SOLAR_YELLOW_MONSTER_INTERVAL_PER_LEVEL, yellowLevel) * (1 + yellowSpawnBonus),
      streakClickMultiplier: (1 + (SOLAR_YELLOW_STREAK_MULTIPLIER_PER_LEVEL - 1) * yellowLevel) * (1 + yellowStreakBonus),
    };
  }

  getSolarDamageExchange(clickDamage: number, autoDamagePerSecond: number): SolarDamageExchange {
    const level = this.getUnlockedHouseLevel(SOLAR_BALANCE_HOUSE_ID);
    const afkToClick = SOLAR_AFK_TO_CLICK_PER_LEVEL
      + (this.unlockUpgrades?.getBonus('house:solar-balance', 'afk-to-click') ?? 0);
    const clickToAfk = SOLAR_CLICK_TO_AFK_PER_LEVEL
      + (this.unlockUpgrades?.getBonus('house:solar-balance', 'click-to-afk') ?? 0);
    return {
      clickDamageBonus: autoDamagePerSecond * afkToClick * level,
      autoDamageBonus: clickDamage * clickToAfk * level,
    };
  }

  getVesselRushBonuses(): { vesselCount: number; durationSeconds: number } {
    const house = this.houses.find((item) => item.id === VESSEL_RUSH_HOUSE_ID);
    const level = house?.unlocked ? house.level : 0;
    return {
      vesselCount: level * VESSEL_RUSH_HOUSE_VESSELS_PER_LEVEL
        + Math.floor(this.unlockUpgrades?.getBonus('house:vessel-rush', 'count') ?? 0),
      durationSeconds: level * VESSEL_RUSH_HOUSE_DURATION_PER_LEVEL_SECONDS
        + (this.unlockUpgrades?.getBonus('house:vessel-rush', 'duration') ?? 0),
    };
  }

  getVesselUpgradeBonuses(): { rewardMultiplier: number; spawnIntervalFactor: number } {
    const house = this.houses.find((item) => item.id === VESSEL_REWARD_HOUSE_ID);
    const level = house?.unlocked ? house.level : 0;
    return {
      rewardMultiplier: Math.pow(VESSEL_REWARD_MULTIPLIER_PER_LEVEL, level)
        * (1 + (this.unlockUpgrades?.getBonus('house:vessel-reward', 'reward') ?? 0)),
      spawnIntervalFactor: Math.max(0.05,
        Math.pow(VESSEL_SPAWN_INTERVAL_FACTOR_PER_LEVEL, level)
          * (1 - (this.unlockUpgrades?.getBonus('house:vessel-reward', 'spawn-interval') ?? 0))
      ),
    };
  }

  getCriticalHitChanceBonus(): number {
    const house = this.houses.find((item) => item.id === CRITICAL_HOUSE_ID);
    return (house ? house.level * house.bonusPerLevel : 0)
      + (this.unlockUpgrades?.getBonus('house:critical', 'chance') ?? 0);
  }

  tick(seconds: number, onBaitGenerated: () => void): void {
    const house = this.houses.find((item) => item.id === BAIT_HOUSE_ID);
    if (!house || !house.unlocked || house.level <= 0 || house.nextBaitInSeconds == null) return;
    house.nextBaitInSeconds -= seconds;
    while (house.nextBaitInSeconds <= 0) {
      house.nextBaitInSeconds += this.getBaitIntervalSeconds(house);
      const amount = this.getBaitAmountPerCycle();
      for (let i = 0; i < amount; i++) onBaitGenerated();
    }
  }

  getBaitCooldownSeconds(): number | undefined {
    return this.houses.find((house) => house.id === BAIT_HOUSE_ID)?.nextBaitInSeconds;
  }

  canBuy(index: number, geometerLevel = 0, astrologueLevel = 0): boolean {
    const house = this.houses[index];
    if (!house || !this.isHouseAvailable(house, geometerLevel, astrologueLevel)) return false;
    if (!house.unlocked) {
      return this.resources.getMonsterEssence() >= (house.unlockPrice ?? 0)
        && this.resources.canSpendResources(house.unlockCosts ?? []);
    }
    if (house.maxLevel != null && house.level >= house.maxLevel) return false;
    return this.resources.getMonsterEssence() >= this.getPrice(house)
      && this.resources.canSpendResources(this.getCostsForNextLevel(house));
  }

  buy(index: number, geometerLevel = 0, astrologueLevel = 0): boolean {
    const house = this.houses[index];
    if (!house || !this.isHouseAvailable(house, geometerLevel, astrologueLevel)) return false;
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
    if (house.id === BAIT_HOUSE_ID && house.nextBaitInSeconds != null) {
      house.nextBaitInSeconds = Math.min(house.nextBaitInSeconds, this.getBaitIntervalSeconds(house));
    }
    return true;
  }

  getLevels(): number[] {
    return this.houses.map((house) => house.level);
  }

  setLevels(levels: number[], baitCooldownSeconds?: number): void {
    this.houses.forEach((house, index) => {
      house.level = Math.max(0, Math.floor(levels[index] ?? 0));
      if (house.id !== CRITICAL_HOUSE_ID) {
        house.unlocked = house.level > 0;
      }
      if (house.id === BAIT_HOUSE_ID) {
        house.nextBaitInSeconds = baitCooldownSeconds != null
          ? Math.max(0, Math.min(baitCooldownSeconds, this.getBaitIntervalSeconds(house)))
          : this.getBaitIntervalSeconds(house);
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
      BAIT_HOUSE_BASE_INTERVAL_SECONDS
        - Math.max(0, house.level - 1) * BAIT_HOUSE_INTERVAL_STEP_SECONDS
        - (this.unlockUpgrades?.getBonus('house:bait', 'interval-seconds') ?? 0)
    );
  }

  private getBaitAmountPerCycle(): number {
    return Math.max(1, Math.floor(
      1 + (this.unlockUpgrades?.getBonus('house:bait', 'amount') ?? 0)
    ));
  }

  private getVesselRushVesselCount(house: House): number {
    return VESSEL_RUSH_BASE_COUNT
      + house.level * VESSEL_RUSH_HOUSE_VESSELS_PER_LEVEL
      + Math.floor(this.unlockUpgrades?.getBonus('house:vessel-rush', 'count') ?? 0);
  }

  private getVesselRushDurationSeconds(house: House): number {
    return VESSEL_RUSH_BASE_DURATION_SECONDS
      + house.level * VESSEL_RUSH_HOUSE_DURATION_PER_LEVEL_SECONDS
      + (this.unlockUpgrades?.getBonus('house:vessel-rush', 'duration') ?? 0);
  }

  private getVesselRewardMultiplier(house: House): number {
    return Math.pow(VESSEL_REWARD_MULTIPLIER_PER_LEVEL, house.level)
      * (1 + (this.unlockUpgrades?.getBonus('house:vessel-reward', 'reward') ?? 0));
  }

  private getVesselSpawnIntervalFactor(house: House): number {
    return Math.max(0.05,
      Math.pow(VESSEL_SPAWN_INTERVAL_FACTOR_PER_LEVEL, house.level)
        * (1 - (this.unlockUpgrades?.getBonus('house:vessel-reward', 'spawn-interval') ?? 0))
    );
  }

  private getUnlockedHouseLevel(id: string): number {
    const house = this.houses.find((item) => item.id === id);
    return house?.unlocked ? house.level : 0;
  }

  private isHouseAvailable(house: House, geometerLevel: number, astrologueLevel: number): boolean {
    if (house.id === SOLAR_BALANCE_HOUSE_ID) return astrologueLevel >= 75;
    if (house.id === SOLAR_BLUE_HOUSE_ID || house.id === SOLAR_YELLOW_HOUSE_ID) {
      return astrologueLevel >= 75 && this.isSolarHubUnlocked();
    }
    if (!house.unlockMethod) return true;
    return house.unlockMethod.isUnlocked({
      clicks: 0,
      getWorkerLevel: (workerIndex) => {
        if (workerIndex === VESSEL_WORKER_INDEX) return geometerLevel;
        if (workerIndex === SUN_WORKER_INDEX) return astrologueLevel;
        return null;
      },
    });
  }
}
