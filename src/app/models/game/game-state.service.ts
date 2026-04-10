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
import { WorkerStateService } from './worker-state.service';
import { ShopStateService } from './shop-state.service';
import { PowerStateService } from './power-state.service';
import { MonsterStateService } from './monster-state.service';
import { VesselService } from './vessel.service';
import { getVesselUpgradeStats, isVesselUnlocked, VESSEL_WORKER_INDEX } from '../unlocks/vessel';
import { getSmithLevel, getStreakStats, SMITH_WORKER_INDEX } from '../unlocks/streak';
import { formatNumberValue } from '../../pipes/format-number.pipe';
import { LorePayload } from '../lore/lore-notification.service';

const TICKS_PER_SECOND = 10;

export interface WorkerInfoLine {
  label: string;
  value: string;
}

export interface WorkerInfoStats {
  lines: WorkerInfoLine[];
}

export interface SaveData {
  version: number;
  clicks: number;
  mana: number;
  workersAvailable: WorkerAutoData[];
  workerIndicesOwned: number[];
  shopItemsBought: boolean[];
  monsterEssence: number;
  totalManualClicks: number;
  loreHistory: LorePayload[];
}

@Injectable({ providedIn: 'root' })
export class GameStateService {
  private tickIntervalId: ReturnType<typeof setInterval> | null = null;

  private saveIntervalId: ReturnType<typeof setInterval> | null = null;

  private loreHistory: LorePayload[] = [];

  constructor(
    private resources: ResourcesService,
    private workerState: WorkerStateService,
    private shopState: ShopStateService,
    private powerState: PowerStateService,
    private streakState: StreakStateService,
    private monsterState: MonsterStateService,
    private vesselState: VesselService
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
      const baseAutoPerSecond = this.workerState.calculateClicksPerSecond(this.getShopMult);
      const streakMult = this.streakState.getMultiplier(workers, workersAvailable);
      const damageMult = this.powerState.getDamageMultiplier();
      const autoPerTick =
        (baseAutoPerSecond * streakMult * damageMult) / TICKS_PER_SECOND;
      if (this.monsterState.hasCurrentMonster()) {
        this.monsterState.dealDamage(autoPerTick, workers, workersAvailable);
      } else {
        this.resources.addClicks(autoPerTick);
      }
      this.resources.tickManaRegen();
      this.streakState.tick(TICKS_PER_SECOND, workers, workersAvailable);
      this.monsterState.tick(workers, workersAvailable);
      this.vesselState.tick(workers, workersAvailable);
    }, 1000 / TICKS_PER_SECOND);
  }

  getState(): Game {
    const clicks = this.resources.getClicks();
    const workers = this.workerState.getWorkers();
    const workersAvailable = this.workerState.getWorkersAvailable();
    const damageMult = this.powerState.getDamageMultiplier();
    const valueAutoPerSecond =
      this.workerState.calculateClicksPerSecond(this.getShopMult) *
      this.streakState.getMultiplier(workers, workersAvailable) *
      damageMult;
    const clickValue =
      this.workerState.getCurrentClickValue(this.getShopMult) * damageMult;
    const getWorkerLevel = (i: number) => this.workerState.getWorkerLevel(i);
    const streakView = this.streakState.getView(workers, workersAvailable);

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
      workers: this.workerState.getWorkersView(clicks, this.getShopMult),
      workersAvailable: this.workerState.getWorkersAvailableView(clicks, this.getShopMult),
      clickValue,
      valueAutoPerSecond,
      shopItems: this.shopState.getShopItemsView(getWorkerLevel),
      powersAvailable: this.powerState.getPowersAvailableView(powerWorkerLevel),
      sunUnlocked: isSunUnlocked(workers, workersAvailable),
      sunDamageMultiplier: (() => {
        if (!isSunUnlocked(workers, workersAvailable)) return undefined;
        const astrologue = workersAvailable[SUN_WORKER_INDEX];
        return getSunUpgradeStats(astrologue?.level ?? 0).damageMultiplier;
      })(),
      sunSpeedFactor: (() => {
        if (!isSunUnlocked(workers, workersAvailable)) return undefined;
        const astrologue = workersAvailable[SUN_WORKER_INDEX];
        return getSunUpgradeStats(astrologue?.level ?? 0).speedFactor;
      })(),
      sunSizeFactor: (() => {
        if (!isSunUnlocked(workers, workersAvailable)) return undefined;
        const astrologue = workersAvailable[SUN_WORKER_INDEX];
        return getSunUpgradeStats(astrologue?.level ?? 0).sizeFactor;
      })(),
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
      currentMonster: this.monsterState.getCurrentMonsterView(workers, workersAvailable),
      encounterMeterPercent: this.monsterState.getEncounterMeterPercent(),
      monsterEssence: this.resources.getMonsterEssence(),
      vesselUnlocked: isVesselUnlocked(workers, workersAvailable),
      activeVessels: this.vesselState.getActiveVesselsView(),
      acteActual: 1,
      loreHistory: this.loreHistory,
    };
  }

  click(valueMultiplier = 1, clientX?: number, clientY?: number): void {
    this.resources.incrementTotalManualClicks();
    const workers = this.workerState.getWorkers();
    const workersAvailable = this.workerState.getWorkersAvailable();
    let value = this.workerState.getCurrentClickValue(this.getShopMult);
    value *= this.powerState.getDamageMultiplier();

    if (isCriticalHitUnlocked(workers, workersAvailable)) {
      const miner = workersAvailable[MINER_WORKER_INDEX];
      const minerLevel = miner?.level ?? 0;
      const { totalChance, totalMultiplier } = getCriticalHitStats(minerLevel);
      const shopChanceBonus = this.shopState.getUnlockBonus('critical-hit', 'chance');
      if (Math.random() < totalChance + shopChanceBonus) {
        value *= totalMultiplier;
        this.showCriticalHit(value * valueMultiplier, clientX, clientY);
      }
    }

    this.streakState.onClick(workers, workersAvailable);
    value *= this.streakState.getMultiplier(workers, workersAvailable);

    if (this.monsterState.isMonsterUnlocked(workers, workersAvailable) && this.monsterState.hasCurrentMonster()) {
      this.monsterState.dealDamage(value * valueMultiplier, workers, workersAvailable);
      this.resources.addManaOnClick(0.5);
      return;
    }

    this.resources.addClicks(value * valueMultiplier);
    this.resources.addManaOnClick(0.5);
  }

  clickSun(event?: MouseEvent): void {
    const workers = this.workerState.getWorkers();
    const workersAvailable = this.workerState.getWorkersAvailable();
    if (!isSunUnlocked(workers, workersAvailable)) return;
    const astrologue = workersAvailable[SUN_WORKER_INDEX];
    const sunMult = getSunUpgradeStats(astrologue?.level ?? 0).damageMultiplier;
    this.click(sunMult, event?.clientX, event?.clientY);
  }

  showCriticalHit(value: number, clientX?: number, clientY?: number): void {
    const x = clientX ?? window.innerWidth / 2;
    const y = clientY ?? window.innerHeight / 2;
    const criticalHitPopup = document.createElement('div');
    criticalHitPopup.className = 'critical-hit-popup';
    criticalHitPopup.innerHTML = formatNumberValue(value, 2);
    criticalHitPopup.style.left = `${x}px`;
    criticalHitPopup.style.top = `${y}px`;
    document.body.appendChild(criticalHitPopup);
    setTimeout(() => criticalHitPopup.remove(), 1000);
  }

  upgradeWorker(workerIndex: number): void {
    this.workerState.upgradeWorker(workerIndex, this.getShopMult);
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
      const chancePercent = (totalChance + shopChanceBonus) * 100;
      lines.push(
        { label: 'Chance de coup critique', value: `${chancePercent.toFixed(1)} %` },
        { label: 'Dégâts critique', value: `×${totalMultiplier.toFixed(2)}` }
      );
    }

    if (workerIndex === SMITH_WORKER_INDEX) {
      const smithLevel = getSmithLevel(workers, workersAvailable);
      const stats = getStreakStats(smithLevel);
      lines.push(
        { label: 'Multiplicateur streak', value: `×${stats.damageMultiplier}` },
        { label: 'Clics pour activer la barre', value: `${stats.numberOfClicksRequiredForBar}` },
        { label: 'Descente barre (par s)', value: `${stats.speedOfDecreaseOfBar}` }
      );
    }

    if (workerIndex === SUN_WORKER_INDEX) {
      const astrologue = workersAvailable[SUN_WORKER_INDEX];
      const level = astrologue?.level ?? 0;
      const sun = getSunUpgradeStats(level);
      lines.push(
        { label: 'Dégâts clic soleil', value: `×${sun.damageMultiplier}` },
        { label: 'Vitesse rotation soleil', value: `${(sun.speedFactor * 100).toFixed(0)} %` },
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
      lines.push(
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

  getCanBuyPower(price: number): boolean {
    return this.powerState.getCanBuyPower(price);
  }

  buyPower(powerIndex: number): void {
    this.powerState.buyPower(powerIndex);
  }

  getCanCastPower(powerIndex: number): boolean {
    if (this.powerState.isPowerOnCooldown(powerIndex)) return false;
    const cost = this.getPowerManaCost(powerIndex);
    return cost != null && this.resources.canSpendMana(cost) && this.powerState.hasPowerEffect(powerIndex);
  }

  getPowerManaCost(powerIndex: number): number | null {
    const base = this.powerState.getPowerManaCost(powerIndex);
    if (base == null) return null;
    const mult = this.shopState.getPowerManaMultiplier(
      this.powerState.getPowersAvailable()[powerIndex]?.id ?? ''
    );
    return Math.max(1, Math.floor(base * mult));
  }

  castPower(powerIndex: number): void {
    const cost = this.getPowerManaCost(powerIndex);
    this.powerState.castPower(powerIndex, cost ?? undefined);
  }

  clickVessel(instanceId: string): void {
    const workers = this.workerState.getWorkers();
    const workersAvailable = this.workerState.getWorkersAvailable();
    this.vesselState.clickVessel(instanceId, workers, workersAvailable);
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
        monsterEssence: this.resources.getMonsterEssence(),
        totalManualClicks: this.resources.getTotalManualClicks(),        loreHistory: this.loreHistory,      };
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
      this.resources.setMonsterEssence(saveData.monsterEssence);
      this.resources.setTotalManualClicks(saveData.totalManualClicks);
      this.loreHistory = saveData.loreHistory || [];
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
      monsterEssence: this.resources.getMonsterEssence(),
      totalManualClicks: this.resources.getTotalManualClicks(),
      loreHistory: this.loreHistory,
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
      this.resources.setMonsterEssence(saveData.monsterEssence);
      this.resources.setTotalManualClicks(saveData.totalManualClicks);
      this.loreHistory = saveData.loreHistory || [];

      return true;
    } catch (e) {
      return false;
    }
  }
}
