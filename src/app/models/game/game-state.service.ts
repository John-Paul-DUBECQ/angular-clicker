import { Injectable } from '@angular/core';
import {
  WorkerAuto,
  WorkerAutoData,
  createWorker,
  getPrice,
  getDoesAppearInGame,
  getCanBuyWorker,
  calculateClicksPerSecondForWorker,
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
      createWorker('Worker 1', 1, 10, 1.0),
      createWorker('Worker 2', 2, 20, 1.1),
      createWorker('Worker 3', 3, 300, 1.2),
      createWorker('Worker 4', 4, 400, 1.3),
      createWorker('Worker 5', 5, 500, 1.4),
      createWorker('Worker 6', 6, 600, 1.5),
      createWorker('Worker 7', 7, 700, 1.6),
      createWorker('Worker 8', 8, 800, 1.7),
      createWorker('Worker 9', 9, 900, 1.8),
      createWorker('Worker 10', 10, 1000, 1.9),
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
      this.workersAvailable = data.workersAvailable;
      this.workers = (data.workerIndicesOwned || [])
        .filter((i) => i >= 0 && i < this.workersAvailable.length)
        .map((i) => this.workersAvailable[i]);
      return true;
    } catch {
      return false;
    }
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
}
