import { Injectable } from '@angular/core';
import { WorkerAutoData } from '../worker-auto-model';
import { Vessel } from './vessels/vessel.model';
import { listVessel } from './vessels/list-vessel';
import { isVesselUnlocked, getVesselUpgradeStats } from '../unlocks/vessel';
import { ResourcesService } from './resources.service';
import { WorkerStateService } from './worker-state.service';
import { PowerStateService } from './power-state.service';
import { MonsterStateService } from './monster-state.service';
import { VesselRewardNotificationService } from './vessel-reward-notification.service';

const VESSEL_SPAWN_INTERVAL_MS_MIN = 40000;
const VESSEL_SPAWN_INTERVAL_MS_MAX = 120000;
const VESSEL_DEFAULT_SPEED = 25; // % largeur / seconde
const TICKS_PER_SECOND = 10;

export interface ActiveVesselView {
  instanceId: string;
  vesselId: string;
  name: string;
  imageUrl?: string;
  leftPercent: number;
  /** Timestamp de spawn (pour position fluide dérivée du temps). */
  spawnTime: number;
  /** % largeur / seconde (pour position fluide). */
  speed: number;
  /** Position verticale aléatoire (0–100). */
  topPercent: number;
}

interface ActiveVessel {
  instanceId: string;
  vessel: Vessel;
  leftPercent: number;
  spawnTime: number;
  topPercent: number;
}

@Injectable({ providedIn: 'root' })
export class VesselService {
  private activeVessels: ActiveVessel[] = [];
  private nextSpawnAt = Date.now() + 5000;

  constructor(
    private resources: ResourcesService,
    private workerState: WorkerStateService,
    private powerState: PowerStateService,
    private monsterState: MonsterStateService,
    private vesselRewardNotify: VesselRewardNotificationService
  ) {}

  /** Tick : retirer les vaisseaux sortis (position = temps), en faire spawn si débloqué. */
  tick(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): void {
    const now = Date.now();

    this.activeVessels = this.activeVessels.filter((a) => {
      const speed = a.vessel.speed ?? VESSEL_DEFAULT_SPEED;
      const leftPercent = ((now - a.spawnTime) / 1000) * speed;
      a.leftPercent = leftPercent;
      return leftPercent < 100;
    });

    if (!isVesselUnlocked(workers, workersAvailable)) return;
    if (now < this.nextSpawnAt) return;
    const { spawnIntervalFactor } = getVesselUpgradeStats(workers, workersAvailable);
    const intervalMs =
      (VESSEL_SPAWN_INTERVAL_MS_MIN + Math.random() * (VESSEL_SPAWN_INTERVAL_MS_MAX - VESSEL_SPAWN_INTERVAL_MS_MIN)) *
      spawnIntervalFactor;
    this.nextSpawnAt = now + intervalMs;
    this.spawnVessel();
  }

  private spawnVessel(): void {
    const totalWeight = listVessel.reduce((s, v) => s + (v.probabilityToSpawn ?? 1), 0);
    if (totalWeight <= 0) return;
    let r = Math.random() * totalWeight;
    for (const v of listVessel) {
      const w = v.probabilityToSpawn ?? 1;
      if (r < w) {
        const now = Date.now();
        const inUpperHalf = Math.random() < 0.5;
        const topPercent = inUpperHalf
          ? 5 + Math.random() * 35
          : 60 + Math.random() * 35;
        this.activeVessels.push({
          instanceId: `${v.id}-${now}`,
          vessel: v,
          leftPercent: 0,
          spawnTime: now,
          topPercent,
        });
        return;
      }
      r -= w;
    }
  }

  /** Clic sur un vaisseau : applique la récompense et le retire. Retourne true si un vaisseau a été touché. */
  clickVessel(
    instanceId: string,
    workers: WorkerAutoData[],
    workersAvailable: WorkerAutoData[]
  ): boolean {
    const index = this.activeVessels.findIndex((a) => a.instanceId === instanceId);
    if (index === -1) return false;
    const active = this.activeVessels[index];
    this.activeVessels.splice(index, 1);

    const v = active.vessel;
    const { rewardMultiplier } = getVesselUpgradeStats(workers, workersAvailable);
    switch (v.rewardType) {
      case 'clicks': {
        const base = this.workerState.getBaseProductionPerSecond();
        const mult = 0.65 + Math.random() * 0.7;
        const amount = Math.max(1, Math.floor(base * (v.rewardValue ?? 10) * mult * rewardMultiplier));
        this.resources.addClicks(amount);
        this.vesselRewardNotify.notifyReward({ gold: amount });
        break;
      }
      case 'tempBonus': {
        const durationBase = v.rewardValue ?? 30;
        const duration = Math.max(1, Math.floor(durationBase * rewardMultiplier));
        this.powerState.applyDamageBuff(2, duration);
        this.vesselRewardNotify.notifyReward({ message: `Dégâts x2 pendant ${duration} s` });
        break;
      }
      case 'spawnMonster': {
        if (this.monsterState.isMonsterUnlocked(workers, workersAvailable)) {
          const chance = v.probabilityToSpawnMonster ?? 1;
          if (Math.random() < chance) {
            this.monsterState.forceSpawnNext(workers, workersAvailable);
            this.vesselRewardNotify.notifyReward({ message: 'Un monstre apparaît !' });
          }
        }
        break;
      }
    }
    return true;
  }

  getActiveVesselsView(): ActiveVesselView[] {
    const now = Date.now();
    return this.activeVessels.map((a) => {
      const speed = a.vessel.speed ?? VESSEL_DEFAULT_SPEED;
      const leftPercent = ((now - a.spawnTime) / 1000) * speed;
      return {
        instanceId: a.instanceId,
        vesselId: a.vessel.id,
        name: a.vessel.name,
        imageUrl: a.vessel.imageUrl,
        leftPercent,
        spawnTime: a.spawnTime,
        speed,
        topPercent: a.topPercent,
      };
    });
  }
}
