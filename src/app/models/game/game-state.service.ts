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
import { ShopItem, getDoesAppearInShop } from '../shop-item';
import { listShopItem } from '../list-shop-item';
import { Game } from './game';
import {
  isSunUnlocked,
  SUN_CLICK_MULTIPLIER,
  sunUnlockDefinition,
} from '../unlocks/sun-unlock';
import { criticalHitUnlockDefinition, isCriticalHitUnlocked } from '../unlocks/critical-hit';

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
  private shopItems: Array<ShopItem> = listShopItem;
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
      createClickWorker('Épée', 1, 1.1, 10, 1.25),
      createAutoWorker('Fermier', 2, 1.3, 50, 1.50),
      createAutoWorker('Mineur', 4, 1.4, 150, 1.50, [criticalHitUnlockDefinition]),
      createAutoWorker('Forgeron', 12, 1.5, 500, 1.50),
      createAutoWorker('Astrologue', 32, 1.6, 2000, 1.50, [sunUnlockDefinition]),
      createAutoWorker('Magicien', 64, 1.7, 5000, 1.50),
      createAutoWorker('Alchimiste', 128, 1.8, 20000, 1.50),
      createAutoWorker('Géomètre', 256, 1.9, 75000, 1.50),
      createAutoWorker('Architecte', 512, 2.0, 150000, 1.50),
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

  /** Multiplicateur total des items shop achetés pour un worker (index dans workersAvailable). */
  private getShopMultiplierForWorker(workerIndex: number): number {
    return this.shopItems
      .filter((i) => i.bought && i.workerIndex === workerIndex)
      .reduce((p, i) => p * i.value, 1);
  }

  private getEffectiveProductionForWorker(w: WorkerAutoData): number {
    const base = calculateClicksPerSecondForWorker(w);
    const workerIndex = this.workersAvailable.indexOf(w);
    if (workerIndex === -1) return base;
    return base * this.getShopMultiplierForWorker(workerIndex);
  }

  private getEffectiveClickBonusForWorker(w: WorkerAutoData): number {
    const base = getClickBonus(w);
    const workerIndex = this.workersAvailable.indexOf(w);
    if (workerIndex === -1) return base;
    return base * this.getShopMultiplierForWorker(workerIndex);
  }

  private calculateClicksPerSecond(): number {
    return this.workers.reduce(
      (sum, w) => sum + this.getEffectiveProductionForWorker(w),
      0
    );
  }

  /** Valeur d'un clic actuelle (1 + somme des bonus clic des workers). */
  private getCurrentClickValue(): number {
    return 1 + this.workers.reduce((sum, w) => sum + this.getEffectiveClickBonusForWorker(w), 0);
  }

  getState(): Game {
    const valueAutoPerSecond = this.calculateClicksPerSecond();
    this.clickValue = this.getCurrentClickValue();
    const workersAvailableView: WorkerAuto[] = this.workersAvailable.map((w) => ({
      ...w,
      price: getPrice(w),
      canBuyWorker: getCanBuyWorker(w, this.clicks),
      doesAppearInGame: getDoesAppearInGame(w, this.clicks),
      effectiveProductionPerSecond: this.getEffectiveProductionForWorker(w),
      effectiveClickBonus: this.getEffectiveClickBonusForWorker(w),
    }));
    const shopItemsView: ShopItem[] = this.shopItems.map((item) => ({
      ...item,
      doesAppearInGame: getDoesAppearInShop(item, this.clicks),
      bought: item.bought,
    }));
    const workersView: WorkerAuto[] = this.workers.map((w) => {
      return {
        ...w,
        price: getPrice(w),
        canBuyWorker: getCanBuyWorker(w, this.clicks),
        doesAppearInGame: getDoesAppearInGame(w, this.clicks),
        effectiveProductionPerSecond: this.getEffectiveProductionForWorker(w),
        effectiveClickBonus: this.getEffectiveClickBonusForWorker(w),
      };
    });
    return {
      clicks: this.clicks,
      workers: workersView,
      workersAvailable: workersAvailableView,
      clickValue: this.clickValue,
      valueAutoPerSecond,
      shopItems: shopItemsView,
      sunUnlocked: isSunUnlocked(this.workers, this.workersAvailable),
      criticalHitUnlocked: isCriticalHitUnlocked(this.workers, this.workersAvailable),
    };
  }

  click(valueMultiplier: number = 1, clientX?: number, clientY?: number): void {
    let value = this.getCurrentClickValue();
    if (isCriticalHitUnlocked(this.workers, this.workersAvailable) && Math.random() < criticalHitUnlockDefinition.criticalChance) {
      value *= criticalHitUnlockDefinition.damageMultiplier;
      this.showCriticalHit(clientX, clientY);
    }
    this.clicks += value * valueMultiplier;
  }

  clickSun(event?: MouseEvent): void {
    if (!isSunUnlocked(this.workers, this.workersAvailable)) return;
    this.click(SUN_CLICK_MULTIPLIER, event?.clientX, event?.clientY);
  }

  showCriticalHit(clientX?: number, clientY?: number): void {
    const x = clientX ?? window.innerWidth / 2;
    const y = clientY ?? window.innerHeight / 2;
    const criticalHitPopup = document.createElement('div');
    criticalHitPopup.className = 'critical-hit-popup';
    criticalHitPopup.innerHTML = 'Critical Hit !';
    criticalHitPopup.style.left = `${x}px`;
    criticalHitPopup.style.top = `${y}px`;
    document.body.appendChild(criticalHitPopup);
    setTimeout(() => {
      criticalHitPopup.remove();
    }, 1000);
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

  canBuyShopItem(price: number): boolean {
    return this.clicks >= price;
  }

  buyShopItem(shopItemIndex: number): void {
    if (shopItemIndex < 0 || shopItemIndex >= this.shopItems.length) return;
    const shopItem = this.shopItems[shopItemIndex];
    if (shopItem.bought || !this.canBuyShopItem(shopItem.price)) return;
    this.clicks = Math.max(0, this.clicks - shopItem.price);
    shopItem.bought = true;
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
