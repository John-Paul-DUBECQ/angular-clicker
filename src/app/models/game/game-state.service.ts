import { Injectable } from '@angular/core';
import { WorkerAutoData } from '../worker-auto-model';
import { Game } from './game';
import { isSunUnlocked, getSunUpgradeStats, SUN_WORKER_INDEX } from '../unlocks/sun-unlock';
import {
  getCriticalHitStats,
  isCriticalHitUnlocked,
  MINER_WORKER_INDEX,
} from '../unlocks/critical-hit';
import { getManaStatsFromPowerWorker, isPowerUnlocked, POWER_WORKER_INDEX } from '../unlocks/power-unlock';
import { DAMAGE_DOUBLE_POWER_ID } from '../powers/effects/damage-double.effect';
import { WEAKNESS_POWER_ID } from '../powers/effects/weakness-power-effect';
import { StreakStateService } from '../unlocks/streak-state.service';
import { DEFAULT_MAX_MANA, ResourcesService } from './resources.service';
import { WorkerStateService, WorkerUpgradePricePreview } from './worker-state.service';
import { ShopStateService } from './shop-state.service';
import { PowerStateService } from './power-state.service';
import { MonsterStateService } from './monster-state.service';
import { VesselService } from './vessel.service';
import { getVesselUpgradeStats, isVesselUnlocked, VESSEL_WORKER_INDEX } from '../unlocks/vessel';
import { getSmithLevel, getStreakStats, SMITH_WORKER_INDEX } from '../unlocks/streak';
import { formatNumberValue } from '../../pipes/format-number.pipe';
import { LorePayload } from '../lore/lore-notification.service';
import { EssenceShopStateService } from './essence-shop-state.service';
import { HouseStateService } from './house-state.service';
import { listMonster } from '../monsters/list-monster';
import { Monster } from '../monsters/monster.model';
import { isMonsterBiomeId, MonsterBiomeId } from '../monsters/monster-biome.model';
import { isExplorerUnlocked } from '../unlocks/explorer-unlock';
import { HOUSE_LEVEL_REQUIRED } from '../unlocks/house-unlock';
import { MissionSaveData } from '../missions/mission.model';
import { MissionStateService } from './mission-state.service';

const TICKS_PER_SECOND = 10;

export interface WorkerInfoLine {
  label: string;
  value: string;
}

export interface WorkerInfoStats {
  lines: WorkerInfoLine[];
}

export interface NavigationNotificationState {
  seenShopItemKeys: string[];
  seenHouseIds: string[];
  essenceShopSeen: boolean;
}

export interface SaveData {
  version: number;
  clicks: number;
  mana: number;
  workersAvailable: WorkerAutoData[];
  workerIndicesOwned: number[];
  shopItemsBought: boolean[];
  essenceShopItemsBought: boolean[];
  essenceShopLevels?: number[];
  houseLevels?: number[];
  baitCooldownSeconds?: number;
  powerCooldowns?: Record<string, number>;
  streakState?: { barCurrent?: number; phase?: 'filling' | 'active' };
  resourceAmounts?: Record<string, number>;
  monsterEssence: number;
  totalManualClicks: number;
  loreHistory: LorePayload[];
  monsterKillCounts?: Record<string, number>;
  plannedCombatWins?: Record<string, number>;
  plannedCombatCooldownEnds?: Record<string, number>;
  selectedBiome?: MonsterBiomeId;
  navigationNotificationState?: NavigationNotificationState;
  missions?: MissionSaveData;
  showDamageNumbers?: boolean;
  showCriticalHitNumbers?: boolean;
}

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private tickIntervalId: ReturnType<typeof setInterval> | null = null;

  private saveIntervalId: ReturnType<typeof setInterval> | null = null;

  private loreHistory: LorePayload[] = [];
  private navigationNotificationState: NavigationNotificationState = {
    seenShopItemKeys: [],
    seenHouseIds: [],
    essenceShopSeen: false,
  };
  private showDamageNumbers = false;
  private showCriticalHitNumbers = true;

  constructor(
    private resources: ResourcesService,
    private workerState: WorkerStateService,
    private shopState: ShopStateService,
    private essenceShopState: EssenceShopStateService,
    private houseState: HouseStateService,
    private powerState: PowerStateService,
    private streakState: StreakStateService,
    private monsterState: MonsterStateService,
    private vesselState: VesselService,
    private missionState: MissionStateService
  ) {
    this.startTickLoop();
    this.startAutoSave();
    this.loadFromLocalStorage();
  }

  private getShopMult = (workerIndex: number): number =>
    this.shopState.getShopMultiplierForWorker(workerIndex);

  private startTickLoop(): void {
    if (this.tickIntervalId != null) return;
    this.tickIntervalId = setInterval(() => {
      const workers = this.workerState.getWorkers();
      const workersAvailable = this.workerState.getWorkersAvailable();
      const streakMult = this.streakState.getMultiplier(workers, workersAvailable);
      const damageMult = this.powerState.getDamageMultiplier();
      const solarBonuses = this.houseState.getSolarBonuses();
      const baseAutoPerSecond =
        this.workerState.calculateClicksPerSecond(this.getShopMult) * damageMult;
      const baseClickValue =
        this.workerState.getCurrentClickValue(this.getShopMult) * damageMult;
      const solarAutoPerSecond =
        baseAutoPerSecond * solarBonuses.autoDamageMultiplier;
      const solarExchange =
        this.houseState.getSolarDamageExchange(baseClickValue, solarAutoPerSecond);
      const autoPerTick =
        ((baseAutoPerSecond + solarExchange.autoDamageBonus)
          * solarBonuses.autoDamageMultiplier
          * streakMult) / TICKS_PER_SECOND;
      if (this.monsterState.hasCurrentMonster()) {
        if (this.monsterState.dealDamage(autoPerTick, workers, workersAvailable, 'afk')) {
          this.saveToLocalStorage();
        }
      } else {
        this.resources.addClicks(autoPerTick);
      }
      this.resources.tickManaRegen();
      this.streakState.tick(TICKS_PER_SECOND, workers, workersAvailable);
      this.monsterState.tick(workers, workersAvailable, solarBonuses.monsterSpawnRateMultiplier);
      this.houseState.tick(1 / TICKS_PER_SECOND, () => {
        this.resources.addResource('bait', 1);
      });
      this.vesselState.tick(workers, workersAvailable);
    }, 1000 / TICKS_PER_SECOND);
  }

  getState(): Game {
    const clicks = this.resources.getClicks();
    const workers = this.workerState.getWorkers();
    const workersAvailable = this.workerState.getWorkersAvailable();
    const damageMult = this.powerState.getDamageMultiplier();
    const streakMultiplier = this.streakState.getMultiplier(workers, workersAvailable);
    const solarBonuses = this.houseState.getSolarBonuses();
    const baseAutoPerSecond =
      this.workerState.calculateClicksPerSecond(this.getShopMult) * damageMult;
    const baseClickValue =
      this.workerState.getCurrentClickValue(this.getShopMult) * damageMult;
    const solarAutoPerSecond =
      baseAutoPerSecond * solarBonuses.autoDamageMultiplier;
    const solarExchange =
      this.houseState.getSolarDamageExchange(baseClickValue, solarAutoPerSecond);
    const valueAutoPerSecond =
      (baseAutoPerSecond + solarExchange.autoDamageBonus)
      * solarBonuses.autoDamageMultiplier
      * streakMultiplier;
    const clickValue = baseClickValue + solarExchange.clickDamageBonus;
    const workerViews = this.workerState.getWorkersView(clicks, this.getShopMult);
    const workersAvailableViews = this.workerState.getWorkersAvailableView(clicks, this.getShopMult);
    [...workerViews, ...workersAvailableViews]
      .filter((worker) => worker.workerType === 'click')
      .forEach((worker) => {
        worker.totalClickDamage = clickValue;
      });
    const getWorkerLevel = (i: number) => this.workerState.getWorkerLevel(i);
    const streakView = this.streakState.getView(workers, workersAvailable);
    const architectLevel = this.workerState.getWorkerLevel(7) ?? 0;
    const farmerLevel = this.workerState.getWorkerLevel(1) ?? 0;
    const astrologueLevel = this.workerState.getWorkerLevel(SUN_WORKER_INDEX) ?? 0;
    const vesselUnlocked = isVesselUnlocked(workers, workersAvailable);
    const missionsUnlocked = this.monsterState.isBiomeUnlocked('beach');
    const missionSlots = this.missionState.getView(missionsUnlocked);

    const damageBuffActive = this.powerState.isDamageBuffActive();
    const damageBuffEnd = this.powerState.getDamageBuffEndTime();
    const damageBuffRemainingSeconds = damageBuffActive
      ? Math.max(0, Math.ceil((damageBuffEnd - Date.now()) / 1000))
      : undefined;

    const weaknessBuffActive = this.powerState.isWeaknessBuffActive();
    const weaknessBuffEnd = this.powerState.getWeaknessBuffEndTime();
    const now = Date.now();
    const DAMAGE_BUFF_DURATION_MS = 60 * 1000;
    const WEAKNESS_BUFF_DURATION_MS = 60 * 1000;
    const powerEffectRemainingPercent: Record<string, number> = {};
    if (damageBuffActive && damageBuffEnd > now) {
      powerEffectRemainingPercent[DAMAGE_DOUBLE_POWER_ID] = Math.max(
        0,
        Math.min(100, (100 * (damageBuffEnd - now)) / DAMAGE_BUFF_DURATION_MS)
      );
    }
    if (weaknessBuffActive && weaknessBuffEnd > now) {
      powerEffectRemainingPercent[WEAKNESS_POWER_ID] = Math.max(
        0,
        Math.min(100, (100 * (weaknessBuffEnd - now)) / WEAKNESS_BUFF_DURATION_MS)
      );
    }

    const powerWorkerLevel =
      workersAvailable[POWER_WORKER_INDEX]?.level ?? 0;

    const powerManaStats = getManaStatsFromPowerWorker(powerWorkerLevel);
    const effectiveMaxMana =
      DEFAULT_MAX_MANA +
      powerManaStats.manaMax +
      this.shopState.getManaMaxBonus();
    const baseManaRegenPerSecond = 0.5;
    const effectiveRegenPerSecond =
      baseManaRegenPerSecond +
      powerManaStats.manaRegen +
      this.shopState.getManaRegenBonus();
    this.resources.setMaxMana(effectiveMaxMana);
    this.resources.setManaRegenPerTick(effectiveRegenPerSecond / TICKS_PER_SECOND);

    return {
      clicks,
      mana: this.resources.getMana(),
      maxMana: this.resources.getMaxMana(),
      totalManualClicks: this.resources.getTotalManualClicks(),
      workers: workerViews,
      workersAvailable: workersAvailableViews,
      clickValue,
      valueAutoPerSecond,
      shopItems: this.shopState.getShopItemsView(
        getWorkerLevel,
        (combatId) => this.monsterState.getPlannedCombatWinCount(combatId)
      ),
      powersAvailable: this.powerState.getPowersAvailableView(),
      sunUnlocked: isSunUnlocked(workers, workersAvailable),
      sunDamageMultiplier: (() => {
        if (!isSunUnlocked(workers, workersAvailable)) return undefined;
        const astrologue = workersAvailable[SUN_WORKER_INDEX];
        return this.getSunStats(astrologue?.level ?? 0).damageMultiplier;
      })(),
      sunSpeedFactor: (() => {
        if (!isSunUnlocked(workers, workersAvailable)) return undefined;
        const astrologue = workersAvailable[SUN_WORKER_INDEX];
        return this.getSunStats(astrologue?.level ?? 0).speedFactor;
      })(),
      sunSizeFactor: (() => {
        if (!isSunUnlocked(workers, workersAvailable)) return undefined;
        const astrologue = workersAvailable[SUN_WORKER_INDEX];
        return this.getSunStats(astrologue?.level ?? 0).sizeFactor;
      })(),
      solarAreaExpanded: this.houseState.isSolarHubUnlocked(),
      activeSolarColor: solarBonuses.activeColor ?? undefined,
      powerUnlocked: isPowerUnlocked(workers, workersAvailable),
      criticalHitUnlocked: isCriticalHitUnlocked(workers, workersAvailable),
      streakUnlocked: streakView.streakUnlocked,
      streakBarCurrent: streakView.streakBarCurrent,
      streakBarMax: streakView.streakBarMax,
      streakActive: streakView.streakActive,
      streakDamageMultiplier: streakView.streakDamageMultiplier,
      damageBuffActive,
      damageBuffMultiplier: damageBuffActive ? this.powerState.getDamageMultiplier() : undefined,
      damageBuffRemainingSeconds,
      weaknessBuffActive,
      powerEffectRemainingPercent: Object.keys(powerEffectRemainingPercent).length
        ? powerEffectRemainingPercent
        : undefined,
      monsterUnlocked: this.monsterState.isMonsterUnlocked(workers, workersAvailable),
      explorerUnlocked: isExplorerUnlocked(workers, workersAvailable),
      selectedBiome: this.monsterState.getSelectedBiome(),
      unlockedBiomes: this.monsterState.getUnlockedBiomes(),
      currentMonster: this.monsterState.getCurrentMonsterView(workers, workersAvailable),
      queuedMonsterCount: this.monsterState.getQueuedMonsterCount(),
      encounterMeterPercent: this.monsterState.getEncounterMeterPercent(),
      monsterEssence: this.resources.getMonsterEssence(),
      essenceShopUnlocked: architectLevel >= 1,
      essenceShopItems: this.essenceShopState.getItemsView(),
      essenceShopStats: this.essenceShopState.getStats(),
      housesUnlocked: farmerLevel >= HOUSE_LEVEL_REQUIRED,
      houses: farmerLevel >= HOUSE_LEVEL_REQUIRED || vesselUnlocked || astrologueLevel >= 75
        ? this.houseState.getHousesView(
          workersAvailable[VESSEL_WORKER_INDEX]?.level ?? 0,
          astrologueLevel
        )
        : undefined,
      resources: this.resources.getResourceStocks(),
      plannedCombats: this.monsterState.getPlannedCombats(workers, workersAvailable),
      missionsUnlocked,
      missionSlots,
      missionSlotsUnlocked: this.missionState.getUnlockedSlots(),
      nextMissionSlotCost: this.missionState.getNextSlotCost(),
      vesselUnlocked,
      activeVessels: this.vesselState.getActiveVesselsView(),
      acteActual: 1,
      loreHistory: this.loreHistory,
      monsterKillCounts: this.monsterState.getKillCounts(),
      showDamageNumbers: this.showDamageNumbers,
      showCriticalHitNumbers: this.showCriticalHitNumbers,
    };
  }

  click(valueMultiplier = 1, clientX?: number, clientY?: number): void {
    this.resources.incrementTotalManualClicks();
    const workers = this.workerState.getWorkers();
    const workersAvailable = this.workerState.getWorkersAvailable();
    const damageMultiplier = this.powerState.getDamageMultiplier();
    const solarBonuses = this.houseState.getSolarBonuses();
    const baseClickValue =
      this.workerState.getCurrentClickValue(this.getShopMult) * damageMultiplier;
    const baseAutoPerSecond =
      this.workerState.calculateClicksPerSecond(this.getShopMult) * damageMultiplier;
    const solarAutoPerSecond =
      baseAutoPerSecond * solarBonuses.autoDamageMultiplier;
    const solarExchange =
      this.houseState.getSolarDamageExchange(baseClickValue, solarAutoPerSecond);
    let value = baseClickValue + solarExchange.clickDamageBonus;

    let criticalHit = false;
    const criticalHitUnlocked = isCriticalHitUnlocked(workers, workersAvailable);
    const shopChanceBonus = this.shopState.getUnlockBonus('critical-hit', 'chance');
    const sunChanceBonus = this.shopState.getUnlockBonus('sun', 'chance');
    if (
      criticalHitUnlocked
      || solarBonuses.criticalChanceBonus > 0
      || shopChanceBonus > 0
      || sunChanceBonus > 0
    ) {
      const miner = workersAvailable[MINER_WORKER_INDEX];
      const minerLevel = miner?.level ?? 0;
      const { totalChance, totalMultiplier } = getCriticalHitStats(minerLevel);
      const shopDamageBonus = this.shopState.getUnlockBonus('critical-hit', 'damage');
      const houseChanceBonus = this.houseState.getCriticalHitChanceBonus();
      const criticalChance = (criticalHitUnlocked ? totalChance : 0)
        + shopChanceBonus
        + houseChanceBonus
        + sunChanceBonus
        + solarBonuses.criticalChanceBonus;
      const criticalMultiplier = (criticalHitUnlocked ? totalMultiplier : 1)
        * (1 + shopDamageBonus)
        * solarBonuses.criticalDamageMultiplier;
      if (Math.random() < criticalChance) {
        value *= criticalMultiplier;
        criticalHit = true;
      }
    }

    this.streakState.onClick(workers, workersAvailable, solarBonuses.streakClickMultiplier);
    value *= this.streakState.getMultiplier(workers, workersAvailable);

    if (this.monsterState.isMonsterUnlocked(workers, workersAvailable) && this.monsterState.hasCurrentMonster()) {
      const damage = value * valueMultiplier;
      if (criticalHit) {
        if (this.showCriticalHitNumbers) this.showCriticalHit(damage, clientX, clientY);
      } else if (this.showDamageNumbers) {
        this.showDamage(damage, clientX, clientY);
      }
      if (this.monsterState.dealDamage(damage, workers, workersAvailable, 'click')) {
        this.saveToLocalStorage();
      }
      this.resources.addManaOnClick(0.5 + solarBonuses.manaPerClickBonus);
      return;
    }

    const damage = value * valueMultiplier;
    if (criticalHit) {
      if (this.showCriticalHitNumbers) this.showCriticalHit(damage, clientX, clientY);
    } else if (this.showDamageNumbers) {
      this.showDamage(damage, clientX, clientY);
    }
    this.resources.addClicks(value * valueMultiplier * solarBonuses.clickRewardMultiplier);
    this.resources.addManaOnClick(0.5 + solarBonuses.manaPerClickBonus);
  }

  clickSun(event?: MouseEvent): void {
    const workers = this.workerState.getWorkers();
    const workersAvailable = this.workerState.getWorkersAvailable();
    if (!isSunUnlocked(workers, workersAvailable)) return;
    const astrologue = workersAvailable[SUN_WORKER_INDEX];
    const sunMult = this.getSunStats(astrologue?.level ?? 0).damageMultiplier;
    this.click(sunMult, event?.clientX, event?.clientY);
  }

  showCriticalHit(value: number, clientX?: number, clientY?: number): void {
    this.showDamage(value, clientX, clientY, 'critical-hit-popup');
  }

  private showDamage(value: number, clientX?: number, clientY?: number, className = 'damage-popup'): void {
    const x = clientX ?? window.innerWidth / 2;
    const y = clientY ?? window.innerHeight / 2;
    const criticalHitPopup = document.createElement('div');
    criticalHitPopup.className = className;
    criticalHitPopup.innerHTML = formatNumberValue(value, 2);
    criticalHitPopup.style.left = `${x}px`;
    criticalHitPopup.style.top = `${y}px`;
    document.body.appendChild(criticalHitPopup);
    setTimeout(() => criticalHitPopup.remove(), 1000);
  }

  upgradeWorker(workerIndex: number, levels: number | 'max' = 1): boolean {
    return this.workerState.upgradeWorker(workerIndex, this.getShopMult, levels);
  }

  getWorkerUpgradePricePreview(
    workerIndex: number,
    levels: number | 'max'
  ): WorkerUpgradePricePreview {
    return this.workerState.getUpgradePricePreview(workerIndex, levels);
  }

  /**
   * Retourne les stats à afficher dans le popup "Infos" du worker (ex. Mineur : chance critique, dégâts critique).
   */
  getWorkerInfoStats(workerIndex: number): WorkerInfoStats {
    const workers = this.workerState.getWorkers();
    const workersAvailable = this.workerState.getWorkersAvailable();
    const lines: WorkerInfoLine[] = [];

    if (workerIndex === MINER_WORKER_INDEX) {
      const miner = workersAvailable[MINER_WORKER_INDEX];
      const minerLevel = miner?.level ?? 0;
      const { totalChance, totalMultiplier } = getCriticalHitStats(minerLevel);
      const shopChanceBonus = this.shopState.getUnlockBonus('critical-hit', 'chance');
      const shopDamageBonus = this.shopState.getUnlockBonus('critical-hit', 'damage');
      const houseChanceBonus = this.houseState.getCriticalHitChanceBonus();
      const sunChanceBonus = this.shopState.getUnlockBonus('sun', 'chance');
      const chancePercent = (
        totalChance + shopChanceBonus + houseChanceBonus + sunChanceBonus
      ) * 100;
      lines.push(
        { label: 'Chance de coup critique', value: `${chancePercent.toFixed(1)} %` },
        { label: 'Dégâts critique', value: `×${(totalMultiplier * (1 + shopDamageBonus)).toFixed(2)}` }
      );
    }

    if (workerIndex === SMITH_WORKER_INDEX) {
      const smithLevel = getSmithLevel(workers, workersAvailable);
      const stats = getStreakStats(
        smithLevel,
        undefined,
        this.streakState.getUpgradeBonuses()
      );
      lines.push(
        { label: 'Multiplicateur streak', value: `×${stats.damageMultiplier}` },
        { label: 'Clics pour activer la barre', value: `${stats.numberOfClicksRequiredForBar}` },
        { label: 'Descente barre (par s)', value: `${stats.speedOfDecreaseOfBar}` }
      );
    }

    if (workerIndex === SUN_WORKER_INDEX) {
      const astrologue = workersAvailable[SUN_WORKER_INDEX];
      const level = astrologue?.level ?? 0;
      const sun = this.getSunStats(level);
      lines.push(
        { label: 'Dégâts clic soleil', value: `×${sun.damageMultiplier}` },
        { label: 'Vitesse rotation soleil', value: `${(100 / sun.speedFactor).toFixed(0)} %` },
        { label: 'Taille soleil', value: `${(sun.sizeFactor * 100).toFixed(0)} %` }
      );
    }

    if (workerIndex === POWER_WORKER_INDEX) {
      const magicien = workersAvailable[POWER_WORKER_INDEX];
      const level = magicien?.level ?? 0;
      const manaStats = getManaStatsFromPowerWorker(level);
      const effectiveMaxMana = DEFAULT_MAX_MANA + manaStats.manaMax + this.shopState.getManaMaxBonus();
      const baseRegen = 0.5;
      const effectiveRegen = baseRegen + manaStats.manaRegen + this.shopState.getManaRegenBonus();
      lines.push(
        { label: 'Mana max', value: `${effectiveMaxMana}` },
        { label: 'Régénération mana', value: `${effectiveRegen.toFixed(2)}/s` }
      );
    }

    if (workerIndex === VESSEL_WORKER_INDEX) {
      const vessel = getVesselUpgradeStats(workers, workersAvailable);
      const freqPercent = vessel.spawnIntervalFactor <= 0 ? 0 : (100 / vessel.spawnIntervalFactor - 100);
      const speedPercent = (
        1 + this.shopState.getUnlockBonus('vessel', 'speed')
      ) * 100;
      lines.push(
        { label: 'Vitesse de déplacement vaisseaux', value: `${speedPercent.toFixed(0)} %` },
        { label: 'Vitesse apparition vaisseaux', value: `+${freqPercent.toFixed(0)} %` },
        { label: 'Gain récompenses vaisseaux', value: `×${vessel.rewardMultiplier.toFixed(2)}` }
      );
    }

    if (workerIndex === 0) {
      const epee = workersAvailable[0];
      // Description gérée par workerDescription (WorkerAreaComponent)
    }

    if (workerIndex === 1) {
      const farmer = workersAvailable[1];
      const level = farmer?.level ?? 0;
      // Description gérée par workerDescription (WorkerAreaComponent)
    }

    return { lines };
  }

  canBuyShopItem(price: number): boolean {
    return this.shopState.canBuyShopItem(price);
  }

  buyShopItem(shopItemIndex: number): void {
    this.shopState.buyShopItem(shopItemIndex);
  }

  canBuyEssenceShopItem(itemIndex: number): boolean {
    return this.essenceShopState.canBuyItem(itemIndex);
  }

  buyEssenceShopItem(itemIndex: number): boolean {
    return this.essenceShopState.buy(itemIndex);
  }

  buyHouse(houseIndex: number): boolean {
    const geometerLevel = this.workerState.getWorkerLevel(VESSEL_WORKER_INDEX) ?? 0;
    const astrologueLevel = this.workerState.getWorkerLevel(SUN_WORKER_INDEX) ?? 0;
    return this.houseState.buy(houseIndex, geometerLevel, astrologueLevel);
  }

  getCanBuyPower(price: number): boolean {
    return this.powerState.getCanBuyPower(price);
  }

  buyPower(powerIndex: number): void {
    this.powerState.buyPower(powerIndex);
  }

  getCanCastPower(powerIndex: number): boolean {
    if (this.powerState.isPowerOnCooldown(powerIndex)) return false;
    const cost = this.getPowerManaCost(powerIndex);
    const baitCost = this.getPowerBaitCost(powerIndex);
    return cost != null
      && this.resources.canSpendMana(cost)
      && (baitCost <= 0 || this.resources.getResourceAmount('bait') >= baitCost)
      && this.powerState.hasPowerEffect(powerIndex);
  }

  getPowerManaCost(powerIndex: number): number | null {
    const base = this.powerState.getPowerManaCost(powerIndex);
    if (base == null) return null;
    const mult = this.shopState.getPowerManaMultiplier(
      this.powerState.getPowersAvailable()[powerIndex]?.id ?? ''
    );
    return Math.max(1, Math.floor(base * mult));
  }

  private getSunStats(astrologueLevel: number): ReturnType<typeof getSunUpgradeStats> {
    const stats = getSunUpgradeStats(astrologueLevel);
    return {
      ...stats,
      damageMultiplier: stats.damageMultiplier
        * (1 + this.shopState.getUnlockBonus('sun', 'damage')),
      speedFactor: stats.speedFactor
        / (1 + this.shopState.getUnlockBonus('sun', 'speed')),
      sizeFactor: stats.sizeFactor
        * (1 + this.shopState.getUnlockBonus('sun', 'size')),
    };
  }

  getPowerBaitCost(powerIndex: number): number {
    return this.powerState.getPowerBaitCost(powerIndex);
  }

  castPower(powerIndex: number): void {
    const cost = this.getPowerManaCost(powerIndex);
    const power = this.powerState.getPowersAvailable()[powerIndex];
    const cooldownSeconds = power == null
      ? undefined
      : Math.max(0, Math.floor(
        this.shopState.getPowerCooldownSeconds(power.id, power.cooldownSeconds)
      ));
    const upgrades = power == null
      ? { duration: 1, strength: 1 }
      : {
        duration: this.shopState.getPowerDurationMultiplier(power.id),
        strength: this.shopState.getPowerStrengthMultiplier(power.id),
      };
    const bonuses = this.houseState.getVesselRushBonuses();
    const vesselCountBonus = Math.floor(
      this.shopState.getUnlockBonus('vessel-rush', 'count')
    );
    this.powerState.castPower(
      powerIndex,
      cost ?? undefined,
      (count, durationSeconds) => this.vesselState.summonVesselRush(
        count + bonuses.vesselCount + vesselCountBonus,
        durationSeconds + bonuses.durationSeconds
      ),
      cooldownSeconds,
      upgrades
    );
  }

  clickVessel(instanceId: string): void {
    const workers = this.workerState.getWorkers();
    const workersAvailable = this.workerState.getWorkersAvailable();
    this.vesselState.clickVessel(instanceId, workers, workersAvailable);
  }

  startPlannedCombat(combatId: string): boolean {
    const workers = this.workerState.getWorkers();
    const workersAvailable = this.workerState.getWorkersAvailable();
    const started = this.monsterState.startPlannedCombat(combatId, workers, workersAvailable);
    if (started) this.saveToLocalStorage();
    return started;
  }

  cancelPlannedCombat(): boolean {
    const workers = this.workerState.getWorkers();
    const workersAvailable = this.workerState.getWorkersAvailable();
    const cancelled = this.monsterState.cancelPlannedCombat(workers, workersAvailable);
    if (cancelled) this.saveToLocalStorage();
    return cancelled;
  }

  usePlannedCombatBait(combatId: string): boolean {
    const workers = this.workerState.getWorkers();
    const workersAvailable = this.workerState.getWorkersAvailable();
    const used = this.monsterState.usePlannedCombatBait(combatId, workers, workersAvailable);
    if (used) {
      this.saveToLocalStorage();
    }
    return used;
  }

  unlockNextMissionSlot(): boolean {
    const unlocked = this.missionState.unlockNextSlot();
    if (unlocked) this.saveToLocalStorage();
    return unlocked;
  }

  rerollMission(slotId: number): boolean {
    const rerolled = this.missionState.reroll(slotId);
    if (rerolled) this.saveToLocalStorage();
    return rerolled;
  }

  markMissionsSeen(): void {
    this.missionState.markSeen();
    this.saveToLocalStorage();
  }

  hasUnseenMissions(): boolean {
    return this.missionState.getUnseen();
  }

  tradeTicketsForBait(): boolean {
    if (!this.resources.spendResources([{ resourceId: 'ticket', amount: 3 }])) return false;
    this.resources.addResource('bait', 1);
    this.saveToLocalStorage();
    return true;
  }

  getNavigationNotificationState(): NavigationNotificationState {
    return {
      seenShopItemKeys: [...this.navigationNotificationState.seenShopItemKeys],
      seenHouseIds: [...this.navigationNotificationState.seenHouseIds],
      essenceShopSeen: this.navigationNotificationState.essenceShopSeen,
    };
  }

  setNavigationNotificationState(state: NavigationNotificationState): void {
    this.navigationNotificationState = {
      seenShopItemKeys: [...state.seenShopItemKeys],
      seenHouseIds: [...state.seenHouseIds],
      essenceShopSeen: state.essenceShopSeen,
    };
    this.saveToLocalStorage();
  }

  setSelectedBiome(biome: MonsterBiomeId): boolean {
    const workers = this.workerState.getWorkers();
    const workersAvailable = this.workerState.getWorkersAvailable();
    if (
      !isMonsterBiomeId(biome)
      || !isExplorerUnlocked(workers, workersAvailable)
      || !this.monsterState.isBiomeUnlocked(biome)
    ) return false;
    this.monsterState.setSelectedBiome(biome);
    this.saveToLocalStorage();
    return true;
  }

  /**
   * Transition vers l'acte 2 (déclenchée par l'unlock de l'Explorateur).
   * Pour l'instant, laissée vide : la logique sera ajoutée plus tard.
   */
  goToAct2(): void {
  }

  addLore(lore: LorePayload): void {
    if (this.loreHistory.some(l => l.key === lore.key)) return;
    this.loreHistory.push(lore);
  }

  setShowDamageNumbers(value: boolean): void {
    this.showDamageNumbers = value;
    this.saveToLocalStorage();
  }

  setShowCriticalHitNumbers(value: boolean): void {
    this.showCriticalHitNumbers = value;
    this.saveToLocalStorage();
  }

  getMonsterDefinitions(): Monster[] {
    return listMonster;
  }

  private startAutoSave(): void {
    if (this.saveIntervalId != null) return;
    this.saveIntervalId = setInterval(() => {
      this.saveToLocalStorage();
    }, 10000); // Save every 10 seconds
  }

  saveToLocalStorage(): void {
    try {
      const saveData: SaveData = {
        version: 1,
        clicks: this.resources.getClicks(),
        mana: this.resources.getMana(),
        workersAvailable: this.workerState.getWorkersAvailable(),
        workerIndicesOwned: this.workerState.getWorkers().map(w => this.workerState.getWorkersAvailable().indexOf(w)),
        shopItemsBought: this.shopState.getShopItems().map(item => item.bought),
        essenceShopItemsBought: this.essenceShopState.getItems().map(item => item.bought),
        essenceShopLevels: this.essenceShopState.getLevels(),
        houseLevels: this.houseState.getLevels(),
        baitCooldownSeconds: this.houseState.getBaitCooldownSeconds(),
        powerCooldowns: this.powerState.getCooldowns(),
        streakState: this.streakState.getSaveState(),
        resourceAmounts: this.resources.getResourceAmounts(),
        monsterEssence: this.resources.getMonsterEssence(),
        totalManualClicks: this.resources.getTotalManualClicks(),
        loreHistory: this.loreHistory,
        monsterKillCounts: this.monsterState.getKillCounts(),
        plannedCombatWins: this.monsterState.getPlannedCombatWins(),
        plannedCombatCooldownEnds: this.monsterState.getPlannedCombatCooldownEnds(),
        selectedBiome: this.monsterState.getSelectedBiome(),
        navigationNotificationState: this.getNavigationNotificationState(),
        missions: this.missionState.getSaveData(),
        showDamageNumbers: this.showDamageNumbers,
        showCriticalHitNumbers: this.showCriticalHitNumbers,
      };
      const dataStr = JSON.stringify(saveData);
      localStorage.setItem('clickerGameSave', dataStr);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const dataStr = localStorage.getItem('clickerGameSave');
      if (!dataStr) return;
      const saveData: SaveData = JSON.parse(dataStr);
      if (saveData.version !== 1) return;

      this.resources.setClicks(saveData.clicks);
      this.resources.setMana(saveData.mana);
      this.workerState.setWorkersAvailable(saveData.workersAvailable);
      this.workerState.setWorkers(saveData.workerIndicesOwned.map(index => saveData.workersAvailable[index]).filter(w => w != null));
      this.shopState.setShopItemsBought(saveData.shopItemsBought);
      if (saveData.essenceShopLevels) {
        this.essenceShopState.setLevels(saveData.essenceShopLevels);
      } else {
        this.essenceShopState.setBought(saveData.essenceShopItemsBought || []);
      }
      this.houseState.setLevels(saveData.houseLevels || [], saveData.baitCooldownSeconds);
      this.powerState.setCooldowns(saveData.powerCooldowns);
      this.streakState.setSaveState(saveData.streakState);
      this.resources.setResourceAmounts(saveData.resourceAmounts);
      this.resources.setMonsterEssence(saveData.monsterEssence);
      this.resources.setTotalManualClicks(saveData.totalManualClicks);
      this.loreHistory = saveData.loreHistory || [];
      this.monsterState.setKillCounts(saveData.monsterKillCounts);
      this.monsterState.setPlannedCombatWins(saveData.plannedCombatWins);
      this.monsterState.setPlannedCombatCooldownEnds(saveData.plannedCombatCooldownEnds);
      this.navigationNotificationState = this.normalizeNavigationNotificationState(
        saveData.navigationNotificationState
      );
      this.missionState.setSaveData(saveData.missions);
      if (isMonsterBiomeId(saveData.selectedBiome) && this.monsterState.isBiomeUnlocked(saveData.selectedBiome)) {
        this.monsterState.setSelectedBiome(saveData.selectedBiome);
      } else {
        this.monsterState.setSelectedBiome('forest');
      }
      this.showDamageNumbers = saveData.showDamageNumbers ?? false;
      this.showCriticalHitNumbers = saveData.showCriticalHitNumbers ?? true;
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
  }

  downloadSave(): void {
    const saveData: SaveData = {
      version: 1,
      clicks: this.resources.getClicks(),
      mana: this.resources.getMana(),
      workersAvailable: this.workerState.getWorkersAvailable(),
      workerIndicesOwned: this.workerState.getWorkers().map(w => this.workerState.getWorkersAvailable().indexOf(w)),
      shopItemsBought: this.shopState.getShopItems().map(item => item.bought),
      essenceShopItemsBought: this.essenceShopState.getItems().map(item => item.bought),
      essenceShopLevels: this.essenceShopState.getLevels(),
      houseLevels: this.houseState.getLevels(),
      baitCooldownSeconds: this.houseState.getBaitCooldownSeconds(),
      powerCooldowns: this.powerState.getCooldowns(),
      streakState: this.streakState.getSaveState(),
      resourceAmounts: this.resources.getResourceAmounts(),
      monsterEssence: this.resources.getMonsterEssence(),
      totalManualClicks: this.resources.getTotalManualClicks(),
      loreHistory: this.loreHistory,
      monsterKillCounts: this.monsterState.getKillCounts(),
      plannedCombatWins: this.monsterState.getPlannedCombatWins(),
      plannedCombatCooldownEnds: this.monsterState.getPlannedCombatCooldownEnds(),
      selectedBiome: this.monsterState.getSelectedBiome(),
      navigationNotificationState: this.getNavigationNotificationState(),
      missions: this.missionState.getSaveData(),
      showDamageNumbers: this.showDamageNumbers,
      showCriticalHitNumbers: this.showCriticalHitNumbers,
    };

    const dataStr = JSON.stringify(saveData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const now = new Date();

    const pad = (n: number) => n.toString().padStart(2, '0');

    const timestamp = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_`
                    + `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    const exportFileDefaultName = `clicker-save-${timestamp}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }

  importSave(json: string): boolean {
    try {
      const saveData: SaveData = JSON.parse(json);
      if (saveData.version !== 1) {
        return false; // Version mismatch
      }

      // Load the data
      this.resources.setClicks(saveData.clicks);
      this.resources.setMana(saveData.mana);
      this.workerState.setWorkersAvailable(saveData.workersAvailable);
      this.workerState.setWorkers(saveData.workerIndicesOwned.map(index => saveData.workersAvailable[index]).filter(w => w != null));
      this.shopState.setShopItemsBought(saveData.shopItemsBought);
      if (saveData.essenceShopLevels) {
        this.essenceShopState.setLevels(saveData.essenceShopLevels);
      } else {
        this.essenceShopState.setBought(saveData.essenceShopItemsBought || []);
      }
      this.houseState.setLevels(saveData.houseLevels || [], saveData.baitCooldownSeconds);
      this.powerState.setCooldowns(saveData.powerCooldowns);
      this.streakState.setSaveState(saveData.streakState);
      this.resources.setResourceAmounts(saveData.resourceAmounts);
      this.resources.setMonsterEssence(saveData.monsterEssence);
      this.resources.setTotalManualClicks(saveData.totalManualClicks);
      this.loreHistory = saveData.loreHistory || [];
      this.monsterState.setKillCounts(saveData.monsterKillCounts);
      this.monsterState.setPlannedCombatWins(saveData.plannedCombatWins);
      this.monsterState.setPlannedCombatCooldownEnds(saveData.plannedCombatCooldownEnds);
      this.navigationNotificationState = this.normalizeNavigationNotificationState(
        saveData.navigationNotificationState
      );
      this.missionState.setSaveData(saveData.missions);
      if (isMonsterBiomeId(saveData.selectedBiome) && this.monsterState.isBiomeUnlocked(saveData.selectedBiome)) {
        this.monsterState.setSelectedBiome(saveData.selectedBiome);
      } else {
        this.monsterState.setSelectedBiome('forest');
      }
      this.showDamageNumbers = saveData.showDamageNumbers ?? false;
      this.showCriticalHitNumbers = saveData.showCriticalHitNumbers ?? true;

      return true;
    } catch (e) {
      return false;
    }
  }

  private normalizeNavigationNotificationState(
    state?: Partial<NavigationNotificationState>
  ): NavigationNotificationState {
    return {
      seenShopItemKeys: state && Array.isArray(state.seenShopItemKeys) ? [...state.seenShopItemKeys] : [],
      seenHouseIds: state && Array.isArray(state.seenHouseIds) ? [...state.seenHouseIds] : [],
      essenceShopSeen: state?.essenceShopSeen === true,
    };
  }
}
