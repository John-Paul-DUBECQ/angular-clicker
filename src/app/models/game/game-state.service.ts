import { Injectable } from '@angular/core';
import { WorkerAutoData } from '../worker-auto-model';
import { Game } from './game';
import { isSunUnlocked, SUN_CLICK_MULTIPLIER } from '../unlocks/sun-unlock';
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

const TICKS_PER_SECOND = 10;

export interface SaveData {
  version: number;
  clicks: number;
  workersAvailable: WorkerAutoData[];
  workerIndicesOwned: number[];
}

/**
 * Orchestrateur du jeu : délègue la logique aux services métier (Resources, Workers, Shop, Powers, Streak).
 * Reste léger pour pouvoir ajouter facilement de nouvelles fonctionnalités (ex. powers) sans le surcharger.
 */
@Injectable({ providedIn: 'root' })
export class GameStateService {
  private tickIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private resources: ResourcesService,
    private workerState: WorkerStateService,
    private shopState: ShopStateService,
    private powerState: PowerStateService,
    private streakState: StreakStateService
  ) {
    this.startTickLoop();
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
      this.resources.addClicks(autoPerTick);
      this.resources.tickManaRegen();
      this.streakState.tick(TICKS_PER_SECOND, workers, workersAvailable);
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
      workers: this.workerState.getWorkersView(clicks, this.getShopMult),
      workersAvailable: this.workerState.getWorkersAvailableView(clicks, this.getShopMult),
      clickValue,
      valueAutoPerSecond,
      shopItems: this.shopState.getShopItemsView(getWorkerLevel),
      powersAvailable: this.powerState.getPowersAvailableView(powerWorkerLevel),
      sunUnlocked: isSunUnlocked(workers, workersAvailable),
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
    };
  }

  click(valueMultiplier = 1, clientX?: number, clientY?: number): void {
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
    this.resources.addClicks(value * valueMultiplier);
    this.resources.addManaOnClick(0.5);
  }

  clickSun(event?: MouseEvent): void {
    const workers = this.workerState.getWorkers();
    const workersAvailable = this.workerState.getWorkersAvailable();
    if (!isSunUnlocked(workers, workersAvailable)) return;
    this.click(SUN_CLICK_MULTIPLIER, event?.clientX, event?.clientY);
  }

  showCriticalHit(value: number, clientX?: number, clientY?: number): void {
    const x = clientX ?? window.innerWidth / 2;
    const y = clientY ?? window.innerHeight / 2;
    const criticalHitPopup = document.createElement('div');
    criticalHitPopup.className = 'critical-hit-popup';
    criticalHitPopup.innerHTML = value.toFixed(2).toString();
    criticalHitPopup.style.left = `${x}px`;
    criticalHitPopup.style.top = `${y}px`;
    document.body.appendChild(criticalHitPopup);
    setTimeout(() => criticalHitPopup.remove(), 1000);
  }

  upgradeWorker(workerIndex: number): void {
    this.workerState.upgradeWorker(workerIndex, this.getShopMult);
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
}
