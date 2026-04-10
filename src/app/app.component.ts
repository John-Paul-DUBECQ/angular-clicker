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
import { LoreNotificationService, LorePayload } from './models/lore/lore-notification.service';
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

  /** Popup paramètres / récap global. */
  settingsVisible = false;

  /** Timestamp du début de la session (ms). */
  private sessionStartTime = Date.now();

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
    acteActual: 1,
  };
  workers: WorkerAuto[] = [];
  workersAvailable: WorkerAuto[] = [];
  powersAvailable: Power[] = [];
  importError = false;
  private rewardSub: Subscription | null = null;
  private vesselRewardSub: Subscription | null = null;
  private loreSub: Subscription | null = null;
  private loreQueue: LorePayload[] = [];

  /** Historique complet des messages de lore vus. */
  get loreHistory(): LorePayload[] {
    return this.game.loreHistory || [];
  }

  /** Index du lore sélectionné dans le panneau d'historique. */
  selectedLoreIndex: number | null = null;

  /** État actuel du popup de lore plein écran. */
  loreVisible = false;
  loreTitle = '';
  loreText = '';
  loreImageUrl: string | null = null;

  constructor(
    private gameState: GameStateService,
    private monsterRewardNotify: MonsterRewardNotificationService,
    private vesselRewardNotify: VesselRewardNotificationService,
    private loreNotify: LoreNotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.refreshGameState();
    this.refreshInterval = setInterval(() => this.refreshGameState(), 500);
    this.rewardSub = this.monsterRewardNotify.reward$.subscribe((r) => this.showMonsterReward(r));
    this.vesselRewardSub = this.vesselRewardNotify.reward$.subscribe((r) => this.showVesselReward(r));
    this.startVesselSmoothTick();
    this.loreSub = this.loreNotify.lore$.subscribe((payload) => this.enqueueOrShowLore(payload));

    // Popup de lore d'intro au lancement du jeu.
    this.openIntroLore();

    // Sauvegarde automatique avant de quitter la page
    window.addEventListener('beforeunload', () => {
      this.gameState.saveToLocalStorage();
    });
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
    this.loreSub?.unsubscribe();
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

  /** Ferme le popup de lore actuel. */
  onLoreClosed(): void {
    this.loreVisible = false;
    const next = this.loreQueue.shift();
    if (next) {
      // Laisse le temps au DOM de masquer l'ancien avant d'afficher le suivant.
      setTimeout(() => this.showLore(next), 0);
    }
  }

  private enqueueOrShowLore(payload: LorePayload): void {
    this.rememberLore(payload);
    if (this.loreVisible) {
      this.loreQueue.push(payload);
      return;
    }
    this.showLore(payload);
  }

  private showLore(payload: LorePayload): void {
    this.loreTitle = payload.title;
    this.loreText = payload.text;
    this.loreImageUrl = payload.imageUrl ?? null;
    this.loreVisible = true;
  }

  private rememberLore(payload: LorePayload): void {
    this.gameState.addLore(payload);
    this.gameState.saveToLocalStorage(); // Sauvegarde immédiate pour éviter la répétition au rechargement
    this.selectedLoreIndex = this.loreHistory.length - 1;
  }

  /** Ouvre le popup de lore d'introduction (acte 1). */
  private openIntroLore(): void {
    const key = 'intro:act1';
    if (this.loreHistory.some(l => l.key === key)) {
      return; // Déjà vu, ne pas afficher
    }
    const payload: LorePayload = {
      title: 'Acte I – Prologue',
      text:
        'An 2056 du calendrier grégorien, alors que les puissances mondiales s\'affrontent dans une nouvelle guerre froide. Les conflits éclatent rapidement en Occident où les états de l\'Union européenne se regroupent afin de contrer la menace russe. \n\n Suite à la rupture du traité de non-agression établi en 2045 par la Russie, les puissances mondiales doivent réagir et commencent à bombarder la Russie ainsi que ses alliés. La population de la Russie a été radicalement changée, en effet les bombardements continus ont anéanti toute forme de vie sur le front Ouest emportant Moscou ainsi que Saint-Pétersbourg, les lieux de décisions principaux du camp de la Russie.\n\n Notre histoire débute à Vladivostok, qui suite à une insurrection de son peuple a perdu près de 98 % de ses habitants.  Le peu d\'habitants qui restent préfère rester dans les décombres cependant certains préfèrent partir afin de rejoindre le Japon, qui d\'après les rumeurs, serait une zone de refuge. \n\n "Il faut aller vers l\'Est à tout prix" ',
      imageUrl: null,
      key: key,
    };
    this.rememberLore(payload);
    this.showLore(payload);
  }

  /*
   * Exemple (à brancher plus tard) : lore lors de l'unlock d'un personnage,
   * par exemple l'Explorateur qui fera passer le jeu à l'acte 2.
   *
   * private openExplorerUnlockLore(): void {
   *   this.loreTitle = 'Acte II – Premiers pas au-delà';
   *   this.loreText =
   *     'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
   *   this.loreImageUrl = null;
   *   this.gameState.saveToLocalStorage(); // Sauvegarde immédiate pour éviter la répétition au rechargement
   *   this.loreVisible = true;
   * }
   */

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

  formatMonsterHp(value: number): string {
    return formatNumberValue(value, 2);
  }

  getMonsterHpPercent(): number {
    const m = this.game.currentMonster;
    if (!m || m.maxHp <= 0) return 0;
    return Math.min(100, (100 * m.currentHp) / m.maxHp);
  }

  formatResourceValue(value: number): string {
    return formatNumberValue(value, 2);
  }

  getEffectRemainingPercent(powerId: string): number | null {
    const pct = this.game.powerEffectRemainingPercent?.[powerId];
    return pct != null ? pct : null;
  }

  get totalManualClicks(): number {
    return this.game.totalManualClicks ?? 0;
  }

  get playTimeLabel(): string {
    const totalSeconds = Math.floor((Date.now() - this.sessionStartTime) / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}h ${this.padNumber(minutes)}m ${this.padNumber(seconds)}s`;
    }
    return `${minutes}m ${this.padNumber(seconds)}s`;
  }

  get boughtShopItemsWithIndex(): { item: ShopItem; index: number }[] {
    return (this.game.shopItems ?? [])
      .map((item, index) => ({ item, index }))
      .filter((entry) => entry.item.bought);
  }

  get selectedLore(): LorePayload | null {
    if (this.selectedLoreIndex == null) return null;
    if (this.selectedLoreIndex < 0 || this.selectedLoreIndex >= this.loreHistory.length) {
      return null;
    }
    return this.loreHistory[this.selectedLoreIndex];
  }

  openSettings(event?: MouseEvent): void {
    event?.stopPropagation();
    this.settingsVisible = true;
  }

  closeSettings(): void {
    this.settingsVisible = false;
  }

  selectLore(index: number): void {
    if (index < 0 || index >= this.loreHistory.length) {
      this.selectedLoreIndex = null;
      return;
    }
    this.selectedLoreIndex = index;
  }

  private padNumber(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }

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
}
