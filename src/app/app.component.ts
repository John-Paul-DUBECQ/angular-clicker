import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameStateService } from './models/game/game-state.service';
import { Game } from './models/game/game';
import type { ActiveVesselView } from './models/game/vessel.service';
import { ShopItem } from './models/shop-item';
import { WorkerAuto } from './models/worker-auto-model';
import { Power } from './models/powers/power.model';
import { formatNumberValue } from './pipes/format-number.pipe';
import { MonsterRewardNotificationService } from './models/game/monster-reward-notification.service';
import { VesselRewardNotificationService } from './models/game/vessel-reward-notification.service';
import type { VesselReward } from './models/game/vessel-reward-notification.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Clicker Game';
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private vesselTickId: ReturnType<typeof setInterval> | null = null;
  /** Position left fluide (dérivée du temps) pour chaque vaisseau, mise à jour ~50 ms. */
  vesselSmoothLeft: Record<string, number> = {};

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
  private rewardSub: Subscription | null = null;
  private vesselRewardSub: Subscription | null = null;

  constructor(
    private gameState: GameStateService,
    private monsterRewardNotify: MonsterRewardNotificationService,
    private vesselRewardNotify: VesselRewardNotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.refreshGameState();
    this.refreshInterval = setInterval(() => this.refreshGameState(), 500);
    this.rewardSub = this.monsterRewardNotify.reward$.subscribe((r) => this.showMonsterReward(r));
    this.vesselRewardSub = this.vesselRewardNotify.reward$.subscribe((r) => this.showVesselReward(r));
    this.startVesselSmoothTick();
  }

  ngOnDestroy(): void {
    if (this.refreshInterval !== null) {
      clearInterval(this.refreshInterval);
    }
    if (this.vesselTickId !== null) {
      clearInterval(this.vesselTickId);
    }
    this.rewardSub?.unsubscribe();
    this.vesselRewardSub?.unsubscribe();
  }

  private startVesselSmoothTick(): void {
    const tick = (): void => {
      const vessels = this.game.activeVessels;
      if (vessels && vessels.length > 0) {
        const now = Date.now();
        const next: Record<string, number> = {};
        for (const v of vessels) {
          next[v.instanceId] = ((now - v.spawnTime) / 1000) * v.speed;
        }
        this.vesselSmoothLeft = next;
        this.cdr.detectChanges();
      }
    };
    tick();
    this.vesselTickId = setInterval(tick, 50);
  }

  /** Position left fluide pour le rendu (mouvement linéaire comme le soleil). */
  getVesselLeft(v: ActiveVesselView): number {
    return this.vesselSmoothLeft[v.instanceId] != null ? this.vesselSmoothLeft[v.instanceId] : v.leftPercent;
  }

  private showMonsterReward(reward: { gold: number; essence: number }): void {
    const goldStr = formatNumberValue(reward.gold, 0);
    const essenceStr = formatNumberValue(reward.essence, 0);
    Swal.fire({
      title: 'Récompense !',
      html: `<p>+${goldStr} clics</p><p>+${essenceStr} essence</p>`,
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      position: 'bottom-end',
      backdrop: false,
      customClass: {
        popup: 'reward-toast',
        container: 'reward-toast-container',
      },
    });
  }

  private showVesselReward(reward: VesselReward): void {
    const parts: string[] = [];
    if (reward.gold != null && reward.gold > 0) {
      parts.push(`<p>+${formatNumberValue(reward.gold, 0)} clics</p>`);
    }
    if (reward.message) {
      parts.push(`<p>${reward.message}</p>`);
    }
    if (parts.length === 0) return;
    Swal.fire({
      title: 'Récompense !',
      html: parts.join(''),
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
      position: 'bottom-end',
      backdrop: false,
      customClass: {
        popup: 'reward-toast',
        container: 'reward-toast-container',
      },
    });
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

  onVesselClick(instanceId: string): void {
    this.gameState.clickVessel(instanceId);
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

  trackByVesselInstance(_i: number, v: { instanceId: string }): string {
    return v.instanceId;
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

  /** Formate les PV du mob (k, M, B, T, A, B, C...). */
  formatMonsterHp(value: number): string {
    return formatNumberValue(value, 2);
  }

  getMonsterHpPercent(): number {
    const m = this.game.currentMonster;
    if (!m || m.maxHp <= 0) return 0;
    return Math.min(100, (100 * m.currentHp) / m.maxHp);
  }

  /** Formate une ressource (ex. essence) : k, M, B, T, A, B, C... */
  formatResourceValue(value: number): string {
    return formatNumberValue(value, 2);
  }

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
