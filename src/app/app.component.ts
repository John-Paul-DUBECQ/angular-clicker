import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { GameStateService } from './models/game/game-state.service';
import { Game } from './models/game/game';
import type { ActiveVesselView } from './models/game/vessel.service';
import { ShopItem } from './models/shop-item';
import { WorkerAuto } from './models/worker-auto-model';
import { Power } from './models/powers/power.model';
import { EssenceShopItem } from './models/essence-shop-item';
import { House } from './models/house';
import { ResourceReward, ResourceStock } from './models/resource';
import { DishIngredientView, DishView } from './models/kitchen/dish.model';
import { formatNumberValue } from './pipes/format-number.pipe';
import { MonsterRewardNotificationService } from './models/game/monster-reward-notification.service';
import { VesselRewardNotificationService } from './models/game/vessel-reward-notification.service';
import type { VesselReward } from './models/game/vessel-reward-notification.service';
import { LoreNotificationService, LorePayload } from './models/lore/lore-notification.service';
import { listMonster } from './models/monsters/list-monster';
import { Monster } from './models/monsters/monster.model';
import { MONSTER_BIOMES, MonsterBiomeId } from './models/monsters/monster-biome.model';
import { MissionSlotView } from './models/missions/mission.model';
import { LIST_CHEST, LOTTERY_LOOT, getLotteryLuckBonus } from './models/monsters/lottery.model';
import {
  getResourceTradeCost,
  ResourceTradeQuantity,
  ResourceTradeView,
} from './models/resource-trade';
import { PrimeOfferView, PrimeTradeView, PrimeTraderView } from './models/primes/prime.model';
import { FEATURE_COLOR_OPTIONS, HOUSE_TAG_COLOR_OPTIONS } from './models/feature-colors';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Clicker Game';
  mobileScreen: 'game' | 'shop' | 'workers' | 'combat' | 'settings' | 'missions' | 'traders' = 'game';
  mobileMenuVisible = false;
  workerView: 'workers' | 'essenceShop' | 'quests' = 'workers';
  desktopView: 'characters' | 'houses' | 'shop' | 'essenceShop' | 'quests' | 'kitchen' | 'garden' | 'breeding' | 'missions' | 'lottery' | 'traders' = 'characters';
  selectedTraderId: string | null = null;
  devCommand = '';
  devCommandMessage = '';
  breedingView: 'monsters' | 'eggs' = 'monsters';
  readonly resourceTradeQuantities: ResourceTradeQuantity[] = [1, 10, 100, 1000, 'max'];
  tradeQuantity: ResourceTradeQuantity = 1;
  traderQuantity: ResourceTradeQuantity = 1;
  readonly featureColorOptions = FEATURE_COLOR_OPTIONS;
  readonly houseTagColorOptions = HOUSE_TAG_COLOR_OPTIONS;
  traderPopup: { trade: PrimeTradeView; left: string; top: string } | null = null;
  readonly monsterBiomes = MONSTER_BIOMES;
  readonly lotteryChests = LIST_CHEST;
  readonly lotteryLoot = LOTTERY_LOOT;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private vesselAnimationFrame: number | null = null;
  @ViewChild('vesselLane') private vesselLane?: ElementRef<HTMLDivElement>;
  private vesselLaneWidth = 0;
  /** Position left fluide (dérivée du temps) pour chaque vaisseau, mise à jour ~50 ms. */
  vesselSmoothLeft: Record<string, number> = {};

  /** Popup paramètres / récap global. */
  settingsVisible = false;
  settingsTab: 'items' | 'lore' | 'resources' | 'bestiary' | 'stats' | 'options' = 'items';

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
  private stableWorkersAvailable: WorkerAuto[] = [];
  private stableEssenceShopItems: EssenceShopItem[] = [];
  private stableHouses: House[] = [];
  private stablePlannedCombats: NonNullable<Game['plannedCombats']> = [];
  private stableMissionSlots: MissionSlotView[] = [];
  private stablePrimeOffers: PrimeOfferView[] = [];
  private stablePrimeTraders: PrimeTraderView[] = [];
  private stableResources: ResourceStock[] = [];
  private stableShopItems: ShopItem[] = [];
  private stableKitchenDishes: DishView[] = [];
  private stableActiveKitchenDishesCache: DishView[] = [];
  private stableResourceTrades: ResourceTradeView[] = [];
  private visibleResourceTradesCache: ResourceTradeView[] = [];
  private sortedShopItemsCache: { item: ShopItem; index: number }[] = [];
  private readonly seenShopItemKeys = new Set<string>();
  private readonly seenHouseIds = new Set<string>();
  private readonly seenDishIds = new Set<string>();
  private essenceShopSeen = false;
  private lotterySeen = false;
  resources: ResourceStock[] = [];
  resourcesVisible = false;
  selectedHouseTag: string | null = null;
  selectedKitchenTag: string | null = null;
  hideMaxLevelHouses = false;
  collapsedHouseIds: { [houseId: string]: boolean } = {};
  importError = false;
  private rewardSub: Subscription | null = null;
  private vesselRewardSub: Subscription | null = null;
  private loreSub: Subscription | null = null;
  private loreQueue: LorePayload[] = [];
  /** Historique complet des messages de lore vus. */
  get loreHistory(): LorePayload[] {
    return this.game.loreHistory || [];
  }

  get visibleResourceTrades(): ResourceTradeView[] {
    return this.visibleResourceTradesCache;
  }

  getResourceTradeQuantity(trade: ResourceTradeView): number {
    return this.tradeQuantity === 'max'
      ? this.gameState.getMaxResourceTradeQuantity(trade.id)
      : this.tradeQuantity;
  }

  getResourceTradeCost(trade: ResourceTradeView): number {
    return getResourceTradeCost(
      trade,
      this.getResourceTradeQuantity(trade),
      trade.tradedCount
    );
  }

  canTradeResource(trade: ResourceTradeView): boolean {
    const quantity = this.getResourceTradeQuantity(trade);
    const cost = this.getResourceTradeCost(trade);
    return quantity > 0 && Number.isFinite(cost)
      && this.getResourceAmount(trade.inputResourceId) >= cost;
  }

  tradeResource(trade: ResourceTradeView): void {
    const quantity = this.getResourceTradeQuantity(trade);
    if (this.canTradeResource(trade) && this.gameState.tradeResource(trade.id, quantity)) {
      this.refreshGameState();
    }
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
  ) {
    const notificationState = this.gameState.getNavigationNotificationState();
    notificationState.seenShopItemKeys.forEach((key) => this.seenShopItemKeys.add(key));
    notificationState.seenHouseIds.forEach((id) => this.seenHouseIds.add(id));
    notificationState.seenDishIds.forEach((id) => this.seenDishIds.add(id));
    this.essenceShopSeen = notificationState.essenceShopSeen;
    this.lotterySeen = notificationState.lotterySeen === true;
  }

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
    if (this.vesselAnimationFrame !== null) {
      cancelAnimationFrame(this.vesselAnimationFrame);
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
        this.vesselLaneWidth = this.vesselLane?.nativeElement.clientWidth
          ?? this.vesselLaneWidth;
        for (const v of vessels) {
          next[v.instanceId] = ((now - v.spawnTime) / 1000) * v.speed;
        }
        this.vesselSmoothLeft = next;
        this.cdr.detectChanges();
      }
      this.vesselAnimationFrame = requestAnimationFrame(tick);
    };
    tick();
  }

  /** Position left fluide pour le rendu (mouvement linéaire comme le soleil). */
  getVesselLeft(v: ActiveVesselView): number {
    return this.vesselSmoothLeft[v.instanceId] != null ? this.vesselSmoothLeft[v.instanceId] : v.leftPercent;
  }

  getVesselTransform(v: ActiveVesselView): string {
    const leftPercent = this.getVesselLeft(v);
    const centerX = this.vesselLaneWidth * leftPercent / 100;
    return `translate3d(${centerX - 40}px, -50%, 0)`;
  }

  private showMonsterReward(reward: {
    gold: number;
    essence: number;
    resources: ResourceReward[];
    title?: string;
  }): void {
    const goldStr = formatNumberValue(reward.gold, 0);
    const essenceStr = formatNumberValue(reward.essence, 0);
    const goldLine = reward.gold > 0 ? `<p>+${goldStr} clics</p>` : '';
    const essenceLine = reward.essence > 0 ? `<p>+${essenceStr} essence</p>` : '';
    const resourceLines = reward.resources
      .map((resource) => `<p>+${formatNumberValue(resource.amount, 0)} ${this.getResourceName(resource.resourceId)}</p>`)
      .join('');
    Swal.fire({
      title: reward.title || 'Récompense !',
      html: `${goldLine}${essenceLine}${resourceLines}`,
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
    (reward.resources ?? []).forEach((resource) => {
      parts.push(`<p>+${formatNumberValue(resource.amount, 0)} ${this.getResourceName(resource.resourceId)}</p>`);
    });
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
    this.workers = this.reuseViewItems(this.workers, state.workers);
    this.stableWorkersAvailable = this.reuseViewItems(this.stableWorkersAvailable, state.workersAvailable);
    this.stableEssenceShopItems = this.reuseViewItems(this.stableEssenceShopItems, state.essenceShopItems ?? []);
    this.stableHouses = this.reuseViewItems(this.stableHouses, state.houses ?? []);
    this.stablePlannedCombats = this.reuseViewItems(this.stablePlannedCombats, state.plannedCombats ?? []);
    this.stableMissionSlots = this.reuseViewItems(
      this.stableMissionSlots,
      state.missionSlots ?? [],
      ['cooldownRemainingSeconds', 'rerollAvailable']
    );
    this.stablePrimeOffers = this.reuseViewItems(
      this.stablePrimeOffers,
      state.primeBoard?.offers ?? [],
      ['remainingSeconds']
    );
    this.stablePrimeTraders = this.reuseViewItems(
      this.stablePrimeTraders,
      state.primeBoard?.traders ?? [],
      ['remainingSeconds']
    );
    this.stableResources = this.reuseViewItems(this.stableResources, state.resources ?? []);
    this.stableShopItems = this.reuseViewItems(this.stableShopItems, state.shopItems ?? []);
    this.stableResourceTrades = this.reuseViewItems(this.stableResourceTrades, state.resourceTrades ?? []);
    this.stableKitchenDishes = this.reuseViewItems(this.stableKitchenDishes, state.kitchen?.dishes ?? []);
    this.resources = this.stableResources;
    this.game = {
      ...state,
      workers: this.workers,
      workersAvailable: this.stableWorkersAvailable,
      essenceShopItems: this.stableEssenceShopItems,
      houses: this.stableHouses,
      plannedCombats: this.stablePlannedCombats,
      missionSlots: this.stableMissionSlots,
      primeBoard: state.primeBoard
        ? { ...state.primeBoard, offers: this.stablePrimeOffers, traders: this.stablePrimeTraders }
        : state.primeBoard,
      shopItems: this.stableShopItems,
      resourceTrades: this.stableResourceTrades,
      kitchen: state.kitchen
        ? {
          ...state.kitchen,
          dishes: this.stableKitchenDishes,
          activeDishes: this.stableActiveKitchenDishes(this.stableKitchenDishes),
        }
        : state.kitchen,
    };
    this.syncShopViewCaches();
    this.workersAvailable = this.stableWorkersAvailable;
    this.powersAvailable = state.powersAvailable ?? [];
    if (this.game.lottery?.unlocked && this.gameState.claimLotteryUnlockNotification()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Loterie débloquée !',
        showConfirmButton: false,
        timer: 3500,
        timerProgressBar: true,
      });
    }
    this.markCurrentSectionItemsAsSeen();
    this.paintFeatureColors();
  }

  /**
   * Conserve les objets de vue tant que leurs valeurs affichées restent identiques.
   * Les clés volatiles (minuteurs) sont recopiées sur l'objet déjà affiché pour ne pas
   * recréer le DOM, et donc ne pas recharger les images, à chaque seconde.
   */
  private reuseViewItems<T extends object>(previous: T[], next: T[], volatileKeys: (keyof T)[] = []): T[] {
    let unchanged = previous.length === next.length;
    const reused = next.map((item, index) => {
      const previousItem = previous[index];
      if (!previousItem || !this.sameViewItem(previousItem, item, volatileKeys)) {
        unchanged = false;
        return item;
      }
      volatileKeys.forEach((key) => {
        previousItem[key] = item[key];
      });
      return previousItem;
    });
    return unchanged ? previous : reused;
  }

  private sameViewItem<T extends object>(previousItem: T, item: T, volatileKeys: (keyof T)[]): boolean {
    const ignore = new Set<string>(volatileKeys.map((key) => String(key)));
    const previousKeys = Object.keys(previousItem).filter((key) => !ignore.has(key));
    const nextKeys = Object.keys(item).filter((key) => !ignore.has(key));
    if (previousKeys.length !== nextKeys.length) return false;
    return previousKeys.every((key) => {
      const left = previousItem[key as keyof T];
      const right = item[key as keyof T];
      return typeof left === 'object' || typeof right === 'object'
        ? JSON.stringify(left) === JSON.stringify(right)
        : left === right;
    });
  }

  private paintFeatureColors(): void {
    const colors = this.game.featureColors;
    if (!colors) return;
    const root = document.documentElement;
    Object.entries(colors.features).forEach(([id, color]) => {
      root.style.setProperty(`--feature-${id}`, color);
    });
    Object.entries(colors.houseTags).forEach(([tag, color]) => {
      root.style.setProperty(`--house-${this.houseTagSlug(tag)}`, color);
    });
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

  onSolarMainAreaClick(event: MouseEvent): void {
    if (!this.game.solarAreaExpanded || !(event.target instanceof Element)) return;
    if (event.target.closest(
      'button, input, select, textarea, a, [role="button"], app-power-area, .mobile-powers-dock, .mobile-mana, .vessel-lane'
    )) return;
    this.click(event);
  }

  /** Rafraîchit l’affichage immédiatement après un achat shop (évite le délai du timer 500 ms). */
  onShopItemBought(): void {
    this.refreshGameState();
  }

  onEssenceShopItemBought(): void {
    console.log('[EssenceShop] onEssenceShopItemBought');
    this.refreshGameState();
  }

  onHouseUpgraded(houseIndex: number): void {
    if (this.gameState.buyHouse(houseIndex)) {
      this.gameState.saveToLocalStorage();
      this.refreshGameState();
    }
  }

  getResourceName(resourceId: string): string {
    return this.resources.find((resource) => resource.id === resourceId)?.name ?? resourceId;
  }

  getResourceAmount(resourceId: string): number {
    return this.resources.find((resource) => resource.id === resourceId)?.amount ?? 0;
  }

  get houseTags(): string[] {
    return Array.from(new Set((this.game.houses ?? []).reduce(
      (tags, house) => tags.concat(house.tags ?? []),
      [] as string[]
    )));
  }

  get kitchenTags(): string[] {
    return Array.from(new Set((this.game.kitchen?.dishes ?? []).reduce(
      (tags, dish) => tags.concat(dish.tags ?? []),
      [] as string[]
    )));
  }

  get visibleKitchenDishes(): DishView[] {
    return (this.game.kitchen?.dishes ?? []).filter((dish) =>
      !this.selectedKitchenTag || dish.tags.includes(this.selectedKitchenTag)
    );
  }

  get visibleHouses(): House[] {
    return (this.game.houses ?? []).filter((house) =>
      (!this.selectedHouseTag || (house.tags ?? []).includes(this.selectedHouseTag))
      && (!this.hideMaxLevelHouses || house.maxLevel == null || house.level < house.maxLevel)
    );
  }

  toggleHouseCollapsed(houseId: string): void {
    this.collapsedHouseIds[houseId] = !this.collapsedHouseIds[houseId];
  }

  toggleResources(): void {
    this.resourcesVisible = !this.resourcesVisible;
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

  getPowerBaitCost(powerIndex: number): number {
    return this.gameState.getPowerBaitCost(powerIndex);
  }

  onPowerCast(powerIndex: number): void {
    this.gameState.castPower(powerIndex);
    this.refreshGameState();
  }

  startPlannedCombat(combatId: string): void {
    if (this.gameState.startPlannedCombat(combatId)) {
      this.refreshGameState();
    }
  }

  usePlannedCombatBait(combatId: string): void {
    if (this.gameState.usePlannedCombatBait(combatId)) {
      this.refreshGameState();
    }
  }

  cancelPlannedCombat(event: MouseEvent): void {
    event.stopPropagation();
    if (this.gameState.cancelPlannedCombat()) {
      this.refreshGameState();
    }
  }

  setSelectedBiome(biome: MonsterBiomeId): void {
    if (this.gameState.setSelectedBiome(biome)) {
      this.refreshGameState();
    }
  }

  get selectedBiomeDescription(): string {
    return this.monsterBiomes.find((biome) => biome.id === this.game.selectedBiome)?.description ?? '';
  }

  get plannedCombatsForSelectedBiome(): NonNullable<Game['plannedCombats']> {
    return (this.game.plannedCombats ?? []).filter(
      (combat) => combat.biome === this.game.selectedBiome
    );
  }

  getCompletedBiomeLevels(biome: MonsterBiomeId): number {
    return (this.game.plannedCombats ?? []).filter(
      (combat) => combat.biome === biome && combat.wins > 0
    ).length;
  }

  isBiomeUnlocked(biome: MonsterBiomeId): boolean {
    return this.game.unlockedBiomes?.[biome] === true;
  }

  trackByIndex(index: number, _worker: WorkerAuto): number {
    return index;
  }

  trackByPosition(index: number): number {
    return index;
  }

  trackByShopIndex(index: number, _item: ShopItem): number {
    return index;
  }

  trackByShopEntry(_i: number, entry: { item: ShopItem; index: number }): number {
    return entry.index;
  }

  trackByResourceTrade(_index: number, trade: ResourceTradeView): string {
    return trade.id;
  }

  /** Garde les mêmes tableaux tant que les objets affichés n'ont pas changé. */
  private syncShopViewCaches(): void {
    const trades = this.stableResourceTrades.filter((trade) => trade.unlocked);
    const previousTrades = this.visibleResourceTradesCache;
    if (
      previousTrades.length !== trades.length
      || trades.some((trade, index) => trade !== previousTrades[index])
    ) {
      this.visibleResourceTradesCache = trades;
    }

    const shopEntries = this.stableShopItems
      .map((item, index) => ({ item, index }))
      .filter((entry) => entry.item.doesAppearInGame && !entry.item.bought)
      .sort((a, b) => a.item.price - b.item.price);
    const previousEntries = this.sortedShopItemsCache;
    if (
      previousEntries.length !== shopEntries.length
      || shopEntries.some((entry, index) =>
        entry.item !== previousEntries[index].item || entry.index !== previousEntries[index].index
      )
    ) {
      this.sortedShopItemsCache = shopEntries;
    }
  }

  trackByEssenceShopEntry(_i: number, entry: { item: EssenceShopItem; index: number }): number {
    return entry.index;
  }

  trackByHouse(_i: number, house: House): string {
    return house.id;
  }

  trackByDish(_index: number, dish: DishView): string {
    return dish.id;
  }

  trackByIngredient(_index: number, ingredient: DishIngredientView): string {
    return ingredient.resourceId;
  }

  private stableActiveKitchenDishes(dishes: DishView[]): DishView[] {
    const active = dishes.filter((dish) => dish.active);
    const previous = this.stableActiveKitchenDishesCache;
    if (previous.length === active.length && active.every((dish, index) => dish === previous[index])) {
      return previous;
    }
    this.stableActiveKitchenDishesCache = active;
    return active;
  }

  trackByResource(_i: number, resource: ResourceStock): string {
    return resource.id;
  }

  trackByHouseEntry(_i: number, entry: { house: House; index: number }): number {
    return entry.index;
  }

  trackByPowerEntry(_i: number, entry: { power: Power; index: number }): number {
    return entry.index;
  }

  trackByVesselInstance(_i: number, v: { instanceId: string }): string {
    return v.instanceId;
  }

  trackByPlannedCombat(_index: number, combat: NonNullable<Game['plannedCombats']>[number]): string {
    return combat.id;
  }

  trackByMissionSlot(_index: number, slot: MissionSlotView): number {
    return slot.id;
  }

  trackByPrimeOffer(_index: number, offer: PrimeOfferView): string {
    return offer.id;
  }

  trackByPrimeTrader(_index: number, trader: PrimeTraderView): string {
    return trader.instanceId;
  }

  trackByPrimeTrade(_index: number, trade: PrimeTradeView): string {
    return trade.id;
  }

  showTraderPopup(trade: PrimeTradeView, event: MouseEvent): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.traderPopup = {
      trade,
      left: `${rect.right + 12}px`,
      top: `${rect.top + rect.height / 2}px`,
    };
  }

  hideTraderPopup(): void {
    this.traderPopup = null;
  }

  featureColor(id: string): string {
    return this.game.featureColors?.features[id]
      ?? this.featureColorOptions.find((option) => option.id === id)?.color
      ?? '#ffffff';
  }

  houseTagColor(tag: string): string {
    return this.game.featureColors?.houseTags[tag]
      ?? this.houseTagColorOptions.find((option) => option.id === tag)?.color
      ?? '#47e88f';
  }

  houseAccent(house: House): string | null {
    const tag = house.tags?.[0];
    return tag ? this.houseTagColor(tag) : null;
  }

  setFeatureColor(id: string, color: string): void {
    this.gameState.setFeatureColor(id, color);
    this.refreshGameState();
  }

  setHouseTagColor(tag: string, color: string): void {
    this.gameState.setHouseTagColor(tag, color);
    this.refreshGameState();
  }

  houseTagSlug(tag: string): string {
    return tag.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  trackByPowerIndex(index: number, _power: Power): number {
    return index;
  }

  /** Shop affiché par ordre de prix (croissant), avec index d’origine pour l’achat. */
  get sortedShopItemsWithIndex(): { item: ShopItem; index: number }[] {
    return this.sortedShopItemsCache;
  }

  get hasNewShopItems(): boolean {
    return this.sortedShopItemsWithIndex.some(({ item, index }) =>
      !this.seenShopItemKeys.has(this.getShopItemNotificationKey(item, index))
    );
  }

  get hasNewKitchenDishes(): boolean {
    if (!this.game.kitchen?.unlocked) return false;
    return this.game.kitchen.dishes.some((dish) => !this.seenDishIds.has(dish.id));
  }

  get hasNewHouses(): boolean {
    if (!this.game.housesUnlocked) {
      return false;
    }
    return (this.game.houses ?? []).some((house) => !this.seenHouseIds.has(house.id));
  }

  get hasNewEssenceShop(): boolean {
    return !!this.game.essenceShopUnlocked && !this.essenceShopSeen;
  }

  get hasNewMissions(): boolean {
    return !!this.game.missionsUnlocked && (this.gameState.hasUnseenMissions() || this.gameState.hasUnseenPrimes());
  }

  get selectedTrader(): PrimeTraderView | null {
    const traders = this.game.primeBoard?.traders ?? [];
    return traders.find((trader) => trader.instanceId === this.selectedTraderId) ?? traders[0] ?? null;
  }

  get hasNewLottery(): boolean {
    return !!this.game.lottery?.unlocked && !this.lotterySeen;
  }

  unlockNextMissionSlot(): void {
    if (this.gameState.unlockNextMissionSlot()) {
      this.refreshGameState();
    }
  }

  rerollMission(slotId: number): void {
    if (this.gameState.rerollMission(slotId)) {
      this.refreshGameState();
    }
  }

  startPrime(offerId: string): void {
    if (!this.gameState.startPrime(offerId)) return;
    if (this.mobileScreen === 'missions') this.mobileScreen = 'game';
    this.refreshGameState();
  }

  cancelPrime(event: MouseEvent): void {
    event.stopPropagation();
    if (this.gameState.cancelPrime()) {
      this.refreshGameState();
    }
  }

  applyDevCommand(): void {
    this.devCommandMessage = this.gameState.applyDevCommand(this.devCommand);
    this.refreshGameState();
  }

  buyPrimeTrade(trade: PrimeTradeView): void {
    const requested = this.traderQuantity === 'max' ? trade.remaining : this.traderQuantity;
    const quantity = Math.min(requested, trade.remaining);
    if (this.gameState.buyPrimeTrade(trade.id, quantity)) {
      this.refreshGameState();
    }
  }

  selectTrader(instanceId: string): void {
    this.selectedTraderId = instanceId;
  }

  private getShopItemNotificationKey(item: ShopItem, index: number): string {
    return item.id ?? `shop-index-${index}`;
  }

  private markCurrentSectionItemsAsSeen(): void {
    let changed = false;
    if (this.desktopView === 'shop') {
      this.sortedShopItemsWithIndex.forEach(({ item, index }) => {
        const key = this.getShopItemNotificationKey(item, index);
        if (!this.seenShopItemKeys.has(key)) {
          this.seenShopItemKeys.add(key);
          changed = true;
        }
      });
    } else if (this.desktopView === 'houses') {
      (this.game.houses ?? []).forEach((house) => {
        if (!this.seenHouseIds.has(house.id)) {
          this.seenHouseIds.add(house.id);
          changed = true;
        }
      });
    } else if (this.desktopView === 'kitchen') {
      (this.game.kitchen?.dishes ?? []).forEach((dish) => {
        if (!this.seenDishIds.has(dish.id)) {
          this.seenDishIds.add(dish.id);
          changed = true;
        }
      });
    }
    if (
      (this.desktopView === 'essenceShop' || this.workerView === 'essenceShop')
      && !this.essenceShopSeen
    ) {
      this.essenceShopSeen = true;
      changed = true;
    }
    if (this.desktopView === 'missions' && this.hasNewMissions) {
      this.gameState.markMissionsSeen();
    }
    if (changed) {
      this.persistNavigationNotificationState();
    }
  }

  private persistNavigationNotificationState(): void {
    this.gameState.setNavigationNotificationState({
      seenShopItemKeys: Array.from(this.seenShopItemKeys),
      seenHouseIds: Array.from(this.seenHouseIds),
      seenDishIds: Array.from(this.seenDishIds),
      essenceShopSeen: this.essenceShopSeen,
      lotterySeen: this.lotterySeen,
    });
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

  formatCooldown(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getMonsterHpPercent(): number {
    const m = this.game.currentMonster;
    if (!m || m.maxHp <= 0) return 0;
    return Math.min(100, (100 * m.currentHp) / m.maxHp);
  }

  getHealthBarTotal(current: { click: number; afk: number; pet: number }): number {
    return current.click + current.afk + current.pet;
  }

  getHealthBarPercent(kind: 'click' | 'afk' | 'pet'): number {
    const monster = this.game.currentMonster;
    const bars = monster?.healthBars;
    if (!monster || !bars || monster.maxHp <= 0) return 0;
    return Math.max(0, Math.min(100, (100 * bars.current[kind]) / monster.maxHp));
  }

  formatResourceValue(value: number): string {
    return formatNumberValue(value, 2);
  }

  formatPercent(multiplier: number): string {
    const percent = Math.round((multiplier - 1) * 100);
    return `${percent >= 0 ? '+' : ''}${percent}%`;
  }

  formatChance(probability: number): string {
    return `${Math.round(probability * 100)}%`;
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

  get bestiaryMonsters(): Monster[] {
    return listMonster;
  }

  getMonsterKillCount(monsterId: string): number {
    return this.game.monsterKillCounts?.[monsterId] ?? 0;
  }

  get totalMonsterKills(): number {
    return Object.values(this.game.monsterKillCounts ?? {}).reduce((total, count) => total + count, 0);
  }

  getMonsterDropName(resourceId: string): string {
    return this.getResourceName(resourceId);
  }

  isMonsterKnown(monster: Monster): boolean {
    return (this.game.monsterKillCounts?.[monster.id] ?? 0) > 0 || monster.doesAppearInGame;
  }

  setSettingsTab(tab: 'items' | 'lore' | 'resources' | 'bestiary' | 'stats' | 'options'): void {
    this.settingsTab = tab;
  }

  setShowDamageNumbers(value: boolean): void {
    this.gameState.setShowDamageNumbers(value);
    this.refreshGameState();
  }

  setShowCriticalHitNumbers(value: boolean): void {
    this.gameState.setShowCriticalHitNumbers(value);
    this.refreshGameState();
  }

  get essenceShopItemsWithIndex(): { item: EssenceShopItem; index: number }[] {
    return (this.game.essenceShopItems ?? []).map((item, index) => ({ item, index }));
  }

  setWorkerView(view: 'workers' | 'essenceShop' | 'quests'): void {
    this.workerView = view;
    if (view === 'essenceShop' && this.game.essenceShopUnlocked && !this.essenceShopSeen) {
      this.essenceShopSeen = true;
      this.persistNavigationNotificationState();
    }
  }

  setDesktopView(view: 'characters' | 'houses' | 'shop' | 'essenceShop' | 'quests' | 'kitchen' | 'garden' | 'breeding' | 'missions' | 'lottery' | 'traders'): void {
    this.desktopView = view;
    if (view === 'characters') {
      this.workerView = 'workers';
    }
    if (view === 'essenceShop') {
      this.workerView = 'essenceShop';
    }
    if (view === 'quests') {
      this.workerView = 'quests';
    }
    if (view === 'lottery' && !this.lotterySeen) {
      this.lotterySeen = true;
      this.gameState.markLotterySeen();
    }
    this.markCurrentSectionItemsAsSeen();
  }

  cookDish(dishId: string): void {
    if (!this.gameState.cookDish(dishId)) return;
    this.refreshGameState();
  }

  useDish(dishId: string): void {
    if (!this.gameState.useDish(dishId)) return;
    this.refreshGameState();
  }

  activateLottery(): void {
    const rewards = this.gameState.activateLottery();
    if (rewards == null) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'La loterie est en recharge.',
        showConfirmButton: false,
        timer: 2500,
      });
      return;
    }
    if (rewards.length === 0) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'info',
        title: 'Pas de chance cette fois.',
        showConfirmButton: false,
        timer: 2500,
      });
    }
    this.refreshGameState();
  }

  lotteryLuckBonus(baseChance: number): number {
    return getLotteryLuckBonus(baseChance, this.game.lottery?.luck ?? 0);
  }

  formatLuckPercent(probability: number): string {
    const percent = probability * 100;
    if (percent === 0) return '0%';
    if (percent >= 1) {
      const rounded = Math.round(percent * 10) / 10;
      return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}%`;
    }
    if (percent >= 0.01) {
      const rounded = Math.round(percent * 100) / 100;
      return `${Number.isInteger(rounded) ? rounded : rounded}%`;
    }
    return `${percent.toFixed(3)}%`;
  }

  openLotteryChest(chestId: string): void {
    if (this.gameState.openLotteryChest(chestId)) {
      this.refreshGameState();
    }
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
    this.settingsTab = 'items';
  }

  closeSettings(): void {
    this.settingsVisible = false;
  }

  setMobileScreen(screen: 'game' | 'shop' | 'workers' | 'combat' | 'settings' | 'missions' | 'traders'): void {
    this.mobileScreen = screen;
    this.mobileMenuVisible = false;
    if (screen === 'missions' && this.hasNewMissions) {
      this.gameState.markMissionsSeen();
    }
  }

  toggleMobileMenu(event?: MouseEvent): void {
    event?.stopPropagation();
    this.mobileMenuVisible = !this.mobileMenuVisible;
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
