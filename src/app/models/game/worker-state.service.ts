import { Injectable } from '@angular/core';
import {
  WorkerAuto,
  WorkerAutoData,
  createAutoWorker,
  createClickWorker,
  getPrice,
  getDoesAppearInGame,
  getDoesAppearInGameWithDependencies,
  getCanBuyWorker,
  getCanBuyWorkerWithDependencies,
  calculateClicksPerSecondForWorker,
  getClickBonus,
} from '../worker-auto-model';
import { criticalHitUnlockDefinition, CRITICAL_HIT_UPGRADES } from '../unlocks/critical-hit';
import { STREAK_UPGRADES, streakUnlockDefinition } from '../unlocks/streak';
import { sunUnlockDefinition, SUN_UPGRADES } from '../unlocks/sun-unlock';
import { powerUnlockDefinition, POWER_MANA_UPGRADES } from '../unlocks/power-unlock';
import { monsterUnlockDefinition, MONSTER_UPGRADES } from '../unlocks/monster-unlock';
import { vesselUnlockDefinition, VESSEL_UPGRADES } from '../unlocks/vessel';
import { houseUnlockDefinition } from '../unlocks/house-unlock';
import { eggUnlockDefinition } from '../monsters/egg.model';
import { primeUnlockDefinition } from '../unlocks/prime-unlock';
import { ResourcesService } from './resources.service';
import { LoreNotificationService } from '../lore/lore-notification.service';
import { WORKER_LORE_BY_NAME, WORKER_LORE_BY_LEVEL } from '../lore/worker-lore';
import { attachDefaultWorkerUnlockMethods } from '../unlocks/worker-unlock.model';

export type GetShopMultiplierForWorker = (workerIndex: number) => number;

const UPGRADE_COOLDOWN_MS = 80;
const CLICKS_EPSILON = 0.001;

export interface WorkerUpgradePricePreview {
  levels: number;
  totalPrice: number;
  canBuy: boolean;
}

@Injectable({ providedIn: 'root' })
export class WorkerStateService {
  private workersAvailable: WorkerAutoData[] = [];
  private workers: WorkerAutoData[] = [];
  private lastUpgradedIndex = -1;
  private lastUpgradedTime = 0;

  constructor(
    private resources: ResourcesService,
    private loreNotify: LoreNotificationService
  ) {
    this.initWorkers();
  }

  getWorkersAvailable(): WorkerAutoData[] {
    return this.workersAvailable;
  }

  setWorkersAvailable(workers: WorkerAutoData[]): void {
    this.workersAvailable = workers.map((worker, index) => {
      const unlocks = this.workersAvailable[index]?.unlocks;
      if (unlocks) {
        worker.unlocks = unlocks;
      }
      return worker;
    });
  }

  getWorkers(): WorkerAutoData[] {
    return this.workers;
  }

  setWorkers(workers: WorkerAutoData[]): void {
    this.workers = workers;
  }

  initWorkers(): void {
    this.workersAvailable = [
      createClickWorker('Épée', 1.5, 1.05, 25, 1.10,
        "L'épée n'est plus en très bon état, il faudra trouver un moyen de la réparer de toute urgence."),
      createAutoWorker('Fermier', 5, 1.10, 125, 1.16, undefined, 1, [houseUnlockDefinition, eggUnlockDefinition], { workerIndex: 0, minLevel: 1 }),
      createAutoWorker('Mineur', 15, 1.15, 375, 1.22, undefined, 1, [criticalHitUnlockDefinition, ...CRITICAL_HIT_UPGRADES,], { workerIndex: 1, minLevel: 3 }),
      createAutoWorker('Forgeron', 50, 1.20, 2537, 1.27, undefined, 2, [streakUnlockDefinition, ...STREAK_UPGRADES], { workerIndex: 2, minLevel: 5 }),
      createAutoWorker('Astrologue', 500, 1.25, 12500, 1.33, undefined, 1, [sunUnlockDefinition, ...SUN_UPGRADES], { workerIndex: 3, minLevel: 8 }),
      createAutoWorker('Magicien', 1000, 1.30, 35000, 1.39, undefined, 1, [powerUnlockDefinition, ...POWER_MANA_UPGRADES], { workerIndex: 4, minLevel: 10 }),
      createAutoWorker('Alchimiste', 4500, 1.35, 512500, 1.45, undefined, 1, [monsterUnlockDefinition, ...MONSTER_UPGRADES], { workerIndex: 5, minLevel: 10 }),
      createAutoWorker('Géomètre', 20000, 1.40, 1e7, 1.51, undefined, 1, [vesselUnlockDefinition, ...VESSEL_UPGRADES], { workerIndex: 6, minLevel: 12 }),
      createAutoWorker('Architecte', 100000, 1.45, 55e8, 1.57, undefined, 1, [primeUnlockDefinition], { workerIndex: 7, minLevel: 10 }),
      createAutoWorker('Explorateur', 40000000000000, 1.50, 1e15, 1.63, undefined, 1, [], { workerIndex: 8, minLevel: 10 }),
    ];
    attachDefaultWorkerUnlockMethods(this.workersAvailable);
    this.workers = [];
  }

  getWorkerLevel(workerIndex: number): number | null {
    if (workerIndex < 0 || workerIndex >= this.workersAvailable.length) return null;
    const w = this.workersAvailable[workerIndex];
    return this.workers.includes(w) ? w.level : null;
  }

  getEffectiveProductionForWorker(w: WorkerAutoData, getShopMult: GetShopMultiplierForWorker): number {
    const base = calculateClicksPerSecondForWorker(w);
    const workerIndex = this.workersAvailable.indexOf(w);
    if (workerIndex === -1) return base;
    return base * getShopMult(workerIndex);
  }

  getEffectiveClickBonusForWorker(w: WorkerAutoData, getShopMult: GetShopMultiplierForWorker): number {
    const base = getClickBonus(w);
    const workerIndex = this.workersAvailable.indexOf(w);
    if (workerIndex === -1) return base;
    return base * getShopMult(workerIndex);
  }

  calculateClicksPerSecond(getShopMult: GetShopMultiplierForWorker): number {
    return this.workers.reduce(
      (sum, w) => sum + this.getEffectiveProductionForWorker(w, getShopMult),
      0
    );
  }

  /** Production /s sans aucun bonus (shop, streak, buff). Utilisée pour les PV des monstres. */
  getBaseProductionPerSecond(): number {
    return this.workers.reduce(
      (sum, w) => sum + calculateClicksPerSecondForWorker(w),
      0
    );
  }

  getCurrentClickValue(getShopMult: GetShopMultiplierForWorker): number {
    return 1 + this.workers.reduce(
      (sum, w) => sum + this.getEffectiveClickBonusForWorker(w, getShopMult),
      0
    );
  }

  getWorkersView(clicks: number, getShopMult: GetShopMultiplierForWorker): WorkerAuto[] {
    return this.workers.map((w) => ({
      ...w,
      price: getPrice(w),
      canBuyWorker: getCanBuyWorker(w, clicks),
      doesAppearInGame: getDoesAppearInGameWithDependencies(w, clicks, this.workersAvailable),
      effectiveProductionPerSecond: this.getEffectiveProductionForWorker(w, getShopMult),
      effectiveClickBonus: this.getEffectiveClickBonusForWorker(w, getShopMult),
    }));
  }

  getWorkersAvailableView(clicks: number, getShopMult: GetShopMultiplierForWorker): WorkerAuto[] {
    return this.workersAvailable.map((w) => ({
      ...w,
      price: getPrice(w),
      canBuyWorker: getCanBuyWorker(w, clicks),
      doesAppearInGame: getDoesAppearInGameWithDependencies(w, clicks, this.workersAvailable),
      effectiveProductionPerSecond: this.getEffectiveProductionForWorker(w, getShopMult),
      effectiveClickBonus: this.getEffectiveClickBonusForWorker(w, getShopMult),
    }));
  }

  getUpgradePricePreview(workerIndex: number, requestedLevels: number | 'max'): WorkerUpgradePricePreview {
    const worker = this.workersAvailable[workerIndex];
    if (!worker || (requestedLevels !== 'max'
      && (!Number.isInteger(requestedLevels) || requestedLevels < 1))) {
      return { levels: 0, totalPrice: 0, canBuy: false };
    }

    const availableClicks = this.resources.getClicks();
    const levelLimit = requestedLevels === 'max' ? Infinity : requestedLevels;
    let levels = 0;
    let totalPrice = 0;

    while (levels < levelLimit) {
      const nextPrice = Math.floor(
        worker.basePrice * Math.pow(worker.curvePrice, worker.level + levels)
      );
      if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
        totalPrice = Infinity;
        break;
      }
      if (requestedLevels === 'max'
        && totalPrice + nextPrice > availableClicks + CLICKS_EPSILON) {
        if (levels === 0) {
          totalPrice = nextPrice;
        }
        break;
      }
      totalPrice += nextPrice;
      levels += 1;
    }

    const canAfford = requestedLevels === 'max'
      ? levels > 0
      : levels === levelLimit && totalPrice <= availableClicks + CLICKS_EPSILON;

    return {
      levels: requestedLevels === 'max' ? levels : levelLimit,
      totalPrice,
      canBuy: canAfford
        && getCanBuyWorkerWithDependencies(worker, availableClicks, this.workersAvailable),
    };
  }

  upgradeWorker(
    workerIndex: number,
    getShopMult: GetShopMultiplierForWorker,
    requestedLevels: number | 'max' = 1
  ): boolean {
    if (workerIndex < 0 || workerIndex >= this.workersAvailable.length) {
      return false;
    }
    const now = Date.now();
    if (
      this.lastUpgradedIndex === workerIndex &&
      now - this.lastUpgradedTime < UPGRADE_COOLDOWN_MS
    ) {
      return false;
    }
    const worker = this.workersAvailable[workerIndex];
    const preview = this.getUpgradePricePreview(workerIndex, requestedLevels);
    if (!preview.canBuy || !this.resources.spendClicks(preview.totalPrice, CLICKS_EPSILON)) {
      return false;
    }

    const firstBuy = !worker.bought;
    const previousLevel = worker.level;
    worker.level += preview.levels;
    worker.bought = true;
    if (!this.workers.includes(worker)) {
      this.workers.push(worker);
    }
    if (firstBuy) {
      const lore = WORKER_LORE_BY_NAME[worker.name];
      if (lore) {
        this.loreNotify.notify(lore);
      }
    } else {
      for (let level = previousLevel + 1; level <= worker.level; level++) {
        const levelLore = WORKER_LORE_BY_LEVEL[worker.name]?.[level];
        if (levelLore) {
          this.loreNotify.notify(levelLore);
        }
      }
    }
    this.lastUpgradedIndex = workerIndex;
    this.lastUpgradedTime = now;
    return true;
  }
}
