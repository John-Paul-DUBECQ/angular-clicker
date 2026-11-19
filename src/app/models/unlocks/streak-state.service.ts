import { Injectable } from '@angular/core';
import type { WorkerAutoData } from '../worker-auto-model';
import {
  getSmithLevel,
  getStreakMultiplier,
  tickStreak,
  processStreakOnClick,
  getStreakView,
  StreakUnlockBonuses,
  StreakPhase,
  StreakView,
} from './streak';
import { PowerStateService } from '../game/power-state.service';
import { ShopStateService } from '../game/shop-state.service';
import { MissionStateService } from '../game/mission-state.service';

/** Service qui porte l'état de la barre streak (barre, phase) et délègue la logique à streak.ts */
@Injectable({ providedIn: 'root' })
export class StreakStateService {
  private barCurrent = 0;
  private phase: StreakPhase = 'filling';

  constructor(
    private powerState: PowerStateService,
    private shopState: ShopStateService,
    private missionState: MissionStateService
  ) {}

  getUpgradeBonuses(): StreakUnlockBonuses {
    return {
      damage: this.shopState.getUnlockBonus('streak', 'damage'),
      clicks: this.shopState.getUnlockBonus('streak', 'clicks'),
      decay: this.shopState.getUnlockBonus('streak', 'decay'),
    };
  }

  getSaveState(): { barCurrent: number; phase: StreakPhase } {
    return { barCurrent: this.barCurrent, phase: this.phase };
  }

  setSaveState(state: { barCurrent?: number; phase?: StreakPhase } | undefined): void {
    if (!state) return;
    if (state.barCurrent != null && Number.isFinite(state.barCurrent)) {
      this.barCurrent = Math.max(0, state.barCurrent);
    }
    if (state.phase === 'filling' || state.phase === 'active') this.phase = state.phase;
  }

  private getWeaknessModifiers(): { comboMultiplier: number; speedMultiplier: number } | undefined {
    const combo = this.powerState.getWeaknessComboMultiplier();
    const speed = this.powerState.getWeaknessSpeedMultiplier();
    if (combo === 1 && speed === 1) return undefined;
    return { comboMultiplier: combo, speedMultiplier: speed };
  }

  tick(ticksPerSecond: number, workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): void {
    const smithLevel = getSmithLevel(workers, workersAvailable);
    const result = tickStreak(
      this.barCurrent,
      this.phase,
      ticksPerSecond,
      smithLevel,
      this.getWeaknessModifiers(),
      this.getUpgradeBonuses()
    );
    this.barCurrent = result.barCurrent;
    this.phase = result.phase;
  }

  onClick(
    workers: WorkerAutoData[],
    workersAvailable: WorkerAutoData[],
    clickCount = 1
  ): void {
    const smithLevel = getSmithLevel(workers, workersAvailable);
    const result = processStreakOnClick(
      this.barCurrent,
      this.phase,
      smithLevel,
      this.getWeaknessModifiers(),
      clickCount,
      this.getUpgradeBonuses()
    );
    this.barCurrent = result.barCurrent;
    if (this.phase !== 'active' && result.phase === 'active') {
      this.missionState.recordStreakActivation();
    }
    this.phase = result.phase;
  }

  getMultiplier(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): number {
    return getStreakMultiplier(
      workers,
      workersAvailable,
      this.phase,
      this.getUpgradeBonuses()
    );
  }

  getView(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): StreakView {
    return getStreakView(
      workers,
      workersAvailable,
      this.barCurrent,
      this.phase,
      this.getWeaknessModifiers(),
      this.getUpgradeBonuses()
    );
  }
}
