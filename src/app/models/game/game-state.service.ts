import { Injectable } from '@angular/core';
import {
  WorkerAuto,
  WorkerAutoData,
  WorkerType,
  createAutoWorker,
  createClickWorker,
  getPrice,
  getDoesAppearInGame,
  getCanBuyWorker,
  calculateClicksPerSecondForWorker,
  getClickBonus,
} from '../worker-auto-model';
import { Game } from './game';

const TICKS_PER_SECOND = 10;

export interface SaveData {
  version: number;
  clicks: number;
  workersAvailable: WorkerAutoData[];
  workerIndicesOwned: number[];
}

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private clicks = 0;
  private clickValue = 1;
  private workersAvailable: WorkerAutoData[] = [];
  private workers: WorkerAutoData[] = [];
  private tickIntervalId: ReturnType<typeof setInterval> | null = null;
  /** Évite uniquement le double envoi du même clic (ms), pas deux clics rapides volontaires. */
  private lastUpgradedIndex = -1;
  private lastUpgradedTime = 0;
  private static readonly UPGRADE_COOLDOWN_MS = 80;
  private static readonly CLICKS_EPSILON = 0.001;

  constructor() {
    this.initWorkers();
    this.startTickLoop();
  }

  private initWorkers(): void {
    this.workersAvailable = [
      createClickWorker('Épée', 1, 1.2, 10, 1.25),
      createAutoWorker('Worker 1', 1, 1.3, 50, 1.25),
      createAutoWorker('Worker 2', 2, 1.4, 150, 1.35),
      createAutoWorker('Worker 3', 3, 1.5, 500, 1.45),
      createAutoWorker('Worker 4', 4, 1.6, 2000, 1.55),
      createAutoWorker('Worker 5', 5, 1.7, 5000, 1.65),
      createAutoWorker('Worker 6', 6, 1.8, 20000, 1.75),
      createAutoWorker('Worker 7', 7, 1.9, 75000, 1.85),
      createAutoWorker('Worker 8', 8, 2.0, 150000, 1.95),
      createAutoWorker('Worker 9', 9, 2.1, 300000, 2.05),
      createAutoWorker('Worker 10', 10, 2.2, 600000, 2.15),
    ];
    this.workers = [];
  }

  private startTickLoop(): void {
    if (this.tickIntervalId != null) return;
    this.tickIntervalId = setInterval(() => {
      const autoPerTick = this.calculateClicksPerSecond() / TICKS_PER_SECOND;
      this.clicks += autoPerTick;
    }, 1000 / TICKS_PER_SECOND);
  }

  private stopTickLoop(): void {
    if (this.tickIntervalId != null) {
      clearInterval(this.tickIntervalId);
      this.tickIntervalId = null;
    }
  }

  private calculateClicksPerSecond(): number {
    return this.workers.reduce(
      (sum, w) => sum + calculateClicksPerSecondForWorker(w),
      0
    );
  }

  getState(): Game {
    const valueAutoPerSecond = this.calculateClicksPerSecond();
    this.clickValue = 1 + this.workers.reduce((sum, w) => sum + getClickBonus(w), 0);
    const workersAvailableView: WorkerAuto[] = this.workersAvailable.map((w) => ({
      ...w,
      price: getPrice(w),
      canBuyWorker: getCanBuyWorker(w, this.clicks),
      doesAppearInGame: getDoesAppearInGame(w, this.clicks),
    }));
    const workersView: WorkerAuto[] = this.workers.map((w) => ({
      ...w,
      price: getPrice(w),
      canBuyWorker: getCanBuyWorker(w, this.clicks),
      doesAppearInGame: getDoesAppearInGame(w, this.clicks),
    }));
    return {
      clicks: this.clicks,
      workers: workersView,
      workersAvailable: workersAvailableView,
      clickValue: this.clickValue,
      valueAutoPerSecond,
    };
  }

  click(): void {
    this.clicks += this.clickValue;
  }

  upgradeWorker(workerIndex: number): void {
    if (workerIndex < 0 || workerIndex >= this.workersAvailable.length) return;
    const now = Date.now();
    if (
      this.lastUpgradedIndex === workerIndex &&
      now - this.lastUpgradedTime < GameStateService.UPGRADE_COOLDOWN_MS
    ) {
      return;
    }
    const worker = this.workersAvailable[workerIndex];
    const priceToPay = getPrice(worker);
    if (this.clicks < priceToPay - GameStateService.CLICKS_EPSILON) return;
    this.clicks = Math.max(0, this.clicks - priceToPay);
    worker.level += 1;
    worker.bought = true;
    if (!this.workers.includes(worker)) {
      this.workers.push(worker);
    }
    this.lastUpgradedIndex = workerIndex;
    this.lastUpgradedTime = now;
  }
/*
  exportSave(): string {
    const workerIndicesOwned = this.workers.map((w) =>
      this.workersAvailable.indexOf(w)
    );
    const data: SaveData = {
      version: 1,
      clicks: this.clicks,
      workersAvailable: this.workersAvailable.map((w) => ({ ...w })),
      workerIndicesOwned,
    };
    return JSON.stringify(data, null, 2);
  }

  importSave(json: string): boolean {
    try {
      const data: SaveData = JSON.parse(json);
      if (data.version !== 1 || !Array.isArray(data.workersAvailable)) {
        return false;
      }
      this.clicks = data.clicks;
      this.workersAvailable = data.workersAvailable.map((w) => this.migrateWorkerData(w));
      if (!this.workersAvailable.some((w) => w.workerType === 'click')) {
        this.workersAvailable.push(createClickWorker('Épée', 1, 1.2, 50, 1.25));
      }
      this.workers = (data.workerIndicesOwned || [])
        .filter((i) => i >= 0 && i < this.workersAvailable.length)
        .map((i) => this.workersAvailable[i]);
      return true;
    } catch {
      return false;
    }
  }

  private migrateWorkerData(w: Partial<WorkerAutoData> & { name: string; level: number; basePrice: number; curvePrice: number }): WorkerAutoData {
    if (w.workerType != null && w.baseProduction != null && w.curveProduction != null) {
      return w as WorkerAutoData;
    }
    const prod = (w as { productivity?: number }).productivity ?? 1;
    return {
      ...w,
      workerType: (w as { workerType?: WorkerType }).workerType ?? 'auto',
      baseProduction: (w as { baseProduction?: number }).baseProduction ?? prod,
      curveProduction: (w as { curveProduction?: number }).curveProduction ?? 1.08,
      doesAppearInGame: w.doesAppearInGame ?? false,
      bought: w.bought ?? false,
    } as WorkerAutoData;
  }

  downloadSave(): void {
    const json = this.exportSave();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clicker-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  */
}
