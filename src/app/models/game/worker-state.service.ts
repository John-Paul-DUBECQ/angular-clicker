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
  calculateClicksPerSecondForWorker,
  getClickBonus,
} from '../worker-auto-model';
import { criticalHitUnlockDefinition, CRITICAL_HIT_UPGRADES } from '../unlocks/critical-hit';
import { STREAK_UPGRADES, streakUnlockDefinition } from '../unlocks/streak';
import { sunUnlockDefinition, SUN_UPGRADES } from '../unlocks/sun-unlock';
import { powerUnlockDefinition, POWER_MANA_UPGRADES } from '../unlocks/power-unlock';
import { monsterUnlockDefinition, MONSTER_UPGRADES } from '../unlocks/monster-unlock';
import { vesselUnlockDefinition, VESSEL_UPGRADES } from '../unlocks/vessel';
import { ResourcesService } from './resources.service';
import { LoreNotificationService } from '../lore/lore-notification.service';
import { WORKER_LORE_BY_NAME, WORKER_LORE_BY_LEVEL } from '../lore/worker-lore';

export type GetShopMultiplierForWorker = (workerIndex: number) => number;

const UPGRADE_COOLDOWN_MS = 80;
const CLICKS_EPSILON = 0.001;

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
    this.workersAvailable = workers;
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
      createAutoWorker('Fermier', 5, 1.10, 125, 1.16, undefined, 1, [], { workerIndex: 0, minLevel: 1 }),
      createAutoWorker('Mineur', 15, 1.15, 375, 1.22, undefined, 1, [criticalHitUnlockDefinition, ...CRITICAL_HIT_UPGRADES,], { workerIndex: 1, minLevel: 3 }),
      createAutoWorker('Forgeron', 50, 1.20, 2537, 1.27, undefined, 2, [streakUnlockDefinition, ...STREAK_UPGRADES], { workerIndex: 2, minLevel: 5 }),
      createAutoWorker('Astrologue', 500, 1.25, 12500, 1.33, undefined, 1, [sunUnlockDefinition, ...SUN_UPGRADES], { workerIndex: 3, minLevel: 8 }),
      createAutoWorker('Magicien', 1000, 1.30, 25000, 1.39, undefined, 1, [powerUnlockDefinition, ...POWER_MANA_UPGRADES], { workerIndex: 4, minLevel: 10 }),
      createAutoWorker('Alchimiste', 4500, 1.35, 112500, 1.45, undefined, 1, [monsterUnlockDefinition, ...MONSTER_UPGRADES], { workerIndex: 5, minLevel: 10 }),
      createAutoWorker('Géomètre', 20000, 1.40, 500000, 1.51, undefined, 1, [vesselUnlockDefinition, ...VESSEL_UPGRADES], { workerIndex: 6, minLevel: 12 }),
      createAutoWorker('Architecte', 100000, 1.45, 2500000, 1.57, undefined, 1, [], { workerIndex: 7, minLevel: 10 }),
      createAutoWorker('Explorateur', 40000000000000, 1.50, 1000000000000000, 1.63, undefined, 1, [], { workerIndex: 8, minLevel: 10 }),
    ];
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

  upgradeWorker(workerIndex: number, getShopMult: GetShopMultiplierForWorker): boolean {
    if (workerIndex < 0 || workerIndex >= this.workersAvailable.length) return false;
    const now = Date.now();
    if (
      this.lastUpgradedIndex === workerIndex &&
      now - this.lastUpgradedTime < UPGRADE_COOLDOWN_MS
    ) {
      return false;
    }
    const worker = this.workersAvailable[workerIndex];
    const firstBuy = !worker.bought;
    const previousLevel = worker.level;
    const priceToPay = getPrice(worker);
    if (!this.resources.spendClicks(priceToPay, CLICKS_EPSILON)) return false;
    worker.level += 1;
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
      // Vérifier si un palier de niveau est atteint
      const levelLore = WORKER_LORE_BY_LEVEL[worker.name]?.[worker.level];
      if (levelLore) {
        this.loreNotify.notify(levelLore);
      }
    }
    this.lastUpgradedIndex = workerIndex;
    this.lastUpgradedTime = now;
    return true;
  }
}
