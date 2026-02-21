import { Injectable } from '@angular/core';
import type { WorkerAutoData } from '../worker-auto-model';
import {
  getSmithLevel,
  getStreakMultiplier,
  tickStreak,
  processStreakOnClick,
  getStreakView,
  StreakPhase,
  StreakView,
} from './streak';
import { PowerStateService } from '../game/power-state.service';

/** Service qui porte l'état de la barre streak (barre, phase) et délègue la logique à streak.ts */
@Injectable({ providedIn: 'root' })
export class StreakStateService {
  private barCurrent = 0;
  private phase: StreakPhase = 'filling';

  constructor(private powerState: PowerStateService) {}

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
      this.getWeaknessModifiers()
    );
    this.barCurrent = result.barCurrent;
    this.phase = result.phase;
  }

  onClick(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): void {
    const smithLevel = getSmithLevel(workers, workersAvailable);
    const result = processStreakOnClick(
      this.barCurrent,
      this.phase,
      smithLevel,
      this.getWeaknessModifiers()
    );
    this.barCurrent = result.barCurrent;
    this.phase = result.phase;
  }

  getMultiplier(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): number {
    return getStreakMultiplier(workers, workersAvailable, this.phase);
  }

  getView(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): StreakView {
    return getStreakView(
      workers,
      workersAvailable,
      this.barCurrent,
      this.phase,
      this.getWeaknessModifiers()
    );
  }
}
