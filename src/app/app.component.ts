import { Component, OnInit, OnDestroy } from '@angular/core';
import { GameStateService } from './models/game/game-state.service';
import { Game } from './models/game/game';
import { ShopItem } from './models/shop-item';
import { WorkerAuto } from './models/worker-auto-model';
import { Power } from './models/powers/power.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Clicker Game';
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  game: Game = {
    clicks: 0,
    mana: 0,
    maxMana: 100,
    workers: [],
    workersAvailable: [],
    clickValue: 1,
    valueAutoPerSecond: 0,
    shopItems: [],
    sunUnlocked: false,
    streakUnlocked: false,
    streakBarCurrent: 0,
    streakBarMax: 0,
    streakActive: false,
  };
  workers: WorkerAuto[] = [];
  workersAvailable: WorkerAuto[] = [];
  powersAvailable: Power[] = [];
  importError = false;
  
  constructor(private gameState: GameStateService) {}

  ngOnInit(): void {
    this.refreshGameState();
    this.refreshInterval = setInterval(() => this.refreshGameState(), 500);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval !== null) {
      clearInterval(this.refreshInterval);
    }
  }

  private refreshGameState(): void {
    const state = this.gameState.getState();
    this.game = state;
    this.workers = state.workers;
    this.workersAvailable = state.workersAvailable;
    this.powersAvailable = state.powersAvailable ?? [];
  }

  click($event: MouseEvent): void {
    this.gameState.click(1, $event?.clientX, $event?.clientY);
    this.refreshGameState();
  }

  upgradeWorker(workerId: number): void {
    this.gameState.upgradeWorker(workerId);
    this.refreshGameState();
  }

  /** Appelé par worker-area après un upgrade pour mettre à jour l’affichage immédiatement. */
  onWorkerUpgraded(): void {
    this.refreshGameState();
  }

  onSunClicked(): void {
    this.refreshGameState();
  }

  /** Rafraîchit l’affichage immédiatement après un achat shop (évite le délai du timer 500 ms). */
  onShopItemBought(): void {
    this.refreshGameState();
  }

  onPowerBought(): void {
    this.refreshGameState();
  }

  getCanCastPower(powerIndex: number): boolean {
    return this.gameState.getCanCastPower(powerIndex);
  }

  getPowerManaCost(powerIndex: number): number | null {
    return this.gameState.getPowerManaCost(powerIndex);
  }

  onPowerCast(powerIndex: number): void {
    this.gameState.castPower(powerIndex);
    this.refreshGameState();
  }

  trackByIndex(index: number, _worker: WorkerAuto): number {
    return index;
  }

  trackByShopIndex(index: number, _item: ShopItem): number {
    return index;
  }

  trackByShopEntry(_i: number, entry: { item: ShopItem; index: number }): number {
    return entry.index;
  }

  trackByPowerEntry(_i: number, entry: { power: Power; index: number }): number {
    return entry.index;
  }

  trackByPowerIndex(index: number, _power: Power): number {
    return index;
  }

  /** Shop affiché par ordre de prix (croissant), avec index d’origine pour l’achat. */
  get sortedShopItemsWithIndex(): { item: ShopItem; index: number }[] {
    return (this.game.shopItems ?? [])
      .map((item, index) => ({ item, index }))
      .filter((entry) => entry.item.doesAppearInGame && !entry.item.bought)
      .sort((a, b) => a.item.price - b.item.price);
  }

  /** Pouvoirs affichés par ordre de coût mana (croissant), avec index d’origine pour lancer le sort. */
  get sortedPowersWithIndex(): { power: Power; index: number }[] {
    return (this.game.powersAvailable ?? [])
      .map((power, index) => ({ power, index }))
      .filter((entry) => entry.power.doesAppearInGame)
      .sort((a, b) => (a.power.manaCost ?? 0) - (b.power.manaCost ?? 0));
  }

  get streakBarPercent(): number {
    const max = this.game.streakBarMax ?? 0;
    if (max <= 0) return 0;
    const current = this.game.streakBarCurrent ?? 0;
    return Math.min(100, (100 * current) / max);
  }

  get manaBarPercent(): number {
    const max = this.game.maxMana ?? 0;
    if (max <= 0) return 0;
    const current = this.game.mana ?? 0;
    return Math.min(100, (100 * current) / max);
  }

  /** Pourcentage de temps restant de l’effet du pouvoir (0–100), pour l’horloge sur la border. */
  getEffectRemainingPercent(powerId: string): number | null {
    const pct = this.game.powerEffectRemainingPercent?.[powerId];
    return pct != null ? pct : null;
  }
/*
  exportSave(): void {
    this.gameState.downloadSave();
  }

  importSave(event: Event): void {
    this.importError = false;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const json = reader.result as string;
      if (this.gameState.importSave(json)) {
        this.refreshGameState();
      } else {
        this.importError = true;
      }
    };
    reader.readAsText(file);
  }
  */
}
