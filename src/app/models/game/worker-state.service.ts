import { Injectable } from '@angular/core';
import {
  WorkerAuto,
  WorkerAutoData,
  createAutoWorker,
  createClickWorker,
  getPrice,
  getDoesAppearInGame,
  getCanBuyWorker,
  calculateClicksPerSecondForWorker,
  getClickBonus,
} from '../worker-auto-model';
import { criticalHitUnlockDefinition, CRITICAL_HIT_UPGRADES } from '../unlocks/critical-hit';
import { STREAK_UPGRADES, streakUnlockDefinition } from '../unlocks/streak';
import { sunUnlockDefinition } from '../unlocks/sun-unlock';
import { powerUnlockDefinition, POWER_MANA_UPGRADES } from '../unlocks/power-unlock';
import { ResourcesService } from './resources.service';

export type GetShopMultiplierForWorker = (workerIndex: number) => number;

const UPGRADE_COOLDOWN_MS = 80;
const CLICKS_EPSILON = 0.001;

@Injectable({ providedIn: 'root' })
export class WorkerStateService {
  private workersAvailable: WorkerAutoData[] = [];
  private workers: WorkerAutoData[] = [];
  private lastUpgradedIndex = -1;
  private lastUpgradedTime = 0;

  constructor(private resources: ResourcesService) {
    this.initWorkers();
  }

  getWorkersAvailable(): WorkerAutoData[] {
    return this.workersAvailable;
  }

  getWorkers(): WorkerAutoData[] {
    return this.workers;
  }

  initWorkers(): void {
    this.workersAvailable = [
      createClickWorker('Épée', 1, 1.05, 10, 1.25),
      createAutoWorker('Fermier', 2, 1.3, 50, 1.50),
      createAutoWorker('Mineur', 4, 1.4, 150, 1.50, [
        criticalHitUnlockDefinition,
        ...CRITICAL_HIT_UPGRADES,
      ]),
      createAutoWorker('Forgeron', 16, 1.5, 500, 1.60, [streakUnlockDefinition, ...STREAK_UPGRADES]),
      createAutoWorker('Astrologue', 32, 1.6, 2000, 1.85, [sunUnlockDefinition]),
      createAutoWorker('Magicien', 64, 1.7, 5000, 2, [powerUnlockDefinition, ...POWER_MANA_UPGRADES]),
      createAutoWorker('Alchimiste', 128, 1.8, 20000, 2.5),
      createAutoWorker('Géomètre', 256, 1.9, 75000, 3),
      createAutoWorker('Architecte', 512, 2.0, 150000, 4),
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
      doesAppearInGame: getDoesAppearInGame(w, clicks),
      effectiveProductionPerSecond: this.getEffectiveProductionForWorker(w, getShopMult),
      effectiveClickBonus: this.getEffectiveClickBonusForWorker(w, getShopMult),
    }));
  }

  getWorkersAvailableView(clicks: number, getShopMult: GetShopMultiplierForWorker): WorkerAuto[] {
    return this.workersAvailable.map((w) => ({
      ...w,
      price: getPrice(w),
      canBuyWorker: getCanBuyWorker(w, clicks),
      doesAppearInGame: getDoesAppearInGame(w, clicks),
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
    const priceToPay = getPrice(worker);
    if (!this.resources.spendClicks(priceToPay, CLICKS_EPSILON)) return false;
    worker.level += 1;
    worker.bought = true;
    if (!this.workers.includes(worker)) {
      this.workers.push(worker);
    }
    this.lastUpgradedIndex = workerIndex;
    this.lastUpgradedTime = now;
    return true;
  }
}
