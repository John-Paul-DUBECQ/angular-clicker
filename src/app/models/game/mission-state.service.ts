import { Injectable, Optional } from '@angular/core';
import { Mission, MissionObjectiveType, MissionSaveData, MissionSlot, MissionSlotView,
  MISSION_REROLL_COOLDOWN_SECONDS, MISSION_SLOT_COOLDOWN_SECONDS, MAX_MISSION_SLOTS } from '../missions/mission.model';
import { ResourcesService } from './resources.service';
import { UnlockContext, UnlockMethod } from '../unlocks/unlock-method';
import { MONSTER_WORKER_INDEX } from '../unlocks/monster-unlock';
import { POWER_WORKER_INDEX } from '../unlocks/worker-indexes';
import { VESSEL_WORKER_INDEX } from '../unlocks/vessel';
import { SMITH_WORKER_INDEX, STREAK_LEVEL_REQUIRED } from '../unlocks/streak';
import { EXPLORER_WORKER_INDEX } from '../unlocks/explorer-unlock';
import { KitchenStateService } from '../kitchen/kitchen-state.service';
import { scaleResourceAmount } from '../kitchen/dish.model';
import { LOTTERY_WORKER_INDEX } from '../monsters/lottery.model';
interface MissionTemplate {
  type: MissionObjectiveType;
  target: number; 
  reward: number;
  description: (target: number) => string;
  unlockMethod?: () => UnlockMethod;
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  { type: 'defeat-monsters', target: 10, reward: 1, description: (n) => `Vaincre ${n} monstres`,
    unlockMethod: () => UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, 1) },
  { type: 'defeat-monsters', target: 20, reward: 2, description: (n) => `Vaincre ${n} monstres`,
    unlockMethod: () => UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, 1) },
  { type: 'defeat-monsters', target: 30, reward: 3, description: (n) => `Vaincre ${n} monstres`,
    unlockMethod: () => UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, 1) },
  { type: 'use-trap', target: 2, reward: 2, description: (n) => `Capturer ${n} boss avec un piège`,
    unlockMethod: () => UnlockMethod.workerLevel(POWER_WORKER_INDEX, 1) },
  { type: 'use-trap', target: 5, reward: 3, description: (n) => `Capturer ${n} boss avec un piège`,
    unlockMethod: () => UnlockMethod.workerLevel(POWER_WORKER_INDEX, 1) },
  { type: 'collect-vessels', target: 5, reward: 1, description: (n) => `Récupérer ${n} vaisseau`,
    unlockMethod: () => UnlockMethod.workerLevel(VESSEL_WORKER_INDEX, 1) },
  { type: 'collect-vessels', target: 15, reward: 2, description: (n) => `Récupérer ${n} vaisseaux`,
    unlockMethod: () => UnlockMethod.workerLevel(VESSEL_WORKER_INDEX, 1) },
  { type: 'chest-opening', target: 3, reward: 1, description: (n) => `Ouvrir ${n} coffre`,
    unlockMethod: () => UnlockMethod.workerLevel(LOTTERY_WORKER_INDEX, 1) },
  { type: 'chest-opening', target: 15, reward: 3, description: (n) => `Ouvrir ${n} coffres`,
    unlockMethod: () => UnlockMethod.workerLevel(LOTTERY_WORKER_INDEX, 1) },
  { type: 'activate-streak', target: 1, reward: 1, description: (n) => `Activer la barre de streak ${n} fois`,
    unlockMethod: () => UnlockMethod.workerLevel(SMITH_WORKER_INDEX, STREAK_LEVEL_REQUIRED) },
  { type: 'activate-streak', target: 3, reward: 3, description: (n) => `Activer la barre de streak ${n} fois`,
    unlockMethod: () => UnlockMethod.workerLevel(SMITH_WORKER_INDEX, STREAK_LEVEL_REQUIRED) },
  { type: 'clicks', target: 250, reward: 1, description: (n) => `Cliquer ${n} fois` },
  { type: 'clicks', target: 1250, reward: 3, description: (n) => `Cliquer ${n} fois` },
  // { type: 'complete-missions', target: 2, reward: 2, description: (n) => `Terminer ${n} missions`,
  //   unlockMethod: () => UnlockMethod.workerLevel(EXPLORER_WORKER_INDEX, 1) },
  // { type: 'complete-missions', target: 3, reward: 3, description: (n) => `Terminer ${n} missions`,
  //   unlockMethod: () => UnlockMethod.workerLevel(EXPLORER_WORKER_INDEX, 1) },
  // { type: 'hold-clicks', target: 100, reward: 1, description: (n) => `Avoir ${n} clics en réserve` },
  // { type: 'hold-clicks', target: 100, reward: 2, description: (n) => `Avoir ${n} clics en réserve` },
];

@Injectable({ providedIn: 'root' })
export class MissionStateService {
  private slots: MissionSlot[] = [];
  private cachedView: MissionSlotView[] = [];
  private unlockedSlots = 1;
  private unseen = false;
  private nextMissionId = 0;
  private unlockContext: UnlockContext = {
    clicks: 0,
    getWorkerLevel: () => null,
  };

  constructor(
    private resources: ResourcesService,
    @Optional() private kitchen?: KitchenStateService
  ) {}

  getView(beachUnlocked: boolean, unlockContext?: UnlockContext): MissionSlotView[] {
    if (!beachUnlocked) {
      return [];
    }
    if (unlockContext) {
      this.unlockContext = unlockContext;
    }
    if (this.slots.length === 0) {
      this.slots.push(this.createSlot(0));
      this.unseen = true;
    }
    this.refreshSlots();
    this.completeReadyMissions();
    const nextView = this.slots.map((slot) => ({
      ...slot,
      mission: slot.mission ? {
        ...slot.mission,
        objective: { ...slot.mission.objective },
      } : null,
      cooldownRemainingSeconds: Math.max(0, Math.ceil((slot.cooldownEndsAt - Date.now()) / 1000)),
      rerollAvailable: slot.mission != null && slot.cooldownEndsAt <= Date.now(),
    }));
    if (
      this.cachedView.length === nextView.length
      && this.cachedView.every((slot, index) => this.areViewsEqual(slot, nextView[index]))
    ) {
      return this.cachedView;
    }
    this.cachedView = nextView.map((slot, index) =>
      this.cachedView[index] && this.areViewsEqual(this.cachedView[index], slot)
        ? this.cachedView[index]
        : slot
    );
    return this.cachedView;
  }

  getUnlockedSlots(): number {
    return this.unlockedSlots;
  }

  getUnseen(): boolean {
    return this.unseen;
  }

  markSeen(): void {
    this.unseen = false;
  }

  getNextSlotCost(): { essence?: number; tickets?: number } | null {
    if (this.unlockedSlots >= MAX_MISSION_SLOTS) return null;
    return this.unlockedSlots === 1 ? { essence: 200 } : { tickets: 100 };
  }

  unlockNextSlot(): boolean {
    const cost = this.getNextSlotCost();
    if (!cost) return false;
    if (cost.essence != null && !this.resources.spendMonsterEssence(cost.essence)) return false;
    if (cost.tickets != null && !this.resources.spendResources([{ resourceId: 'ticket', amount: cost.tickets }])) {
      return false;
    }
    this.slots.push(this.createSlot(this.unlockedSlots));
    this.unlockedSlots += 1;
    this.unseen = true;
    return true;
  }

  reroll(slotId: number): boolean {
    const slot = this.slots.find((entry) => entry.id === slotId);
    if (!slot || !slot.mission || slot.cooldownEndsAt > Date.now()) return false;
    slot.mission = null;
    slot.cooldownEndsAt = Date.now() + MISSION_REROLL_COOLDOWN_SECONDS * 1000;
    slot.cooldownReason = 'rerolled';
    slot.lastReward = 0;
    return true;
  }

  recordMonsterKill(): void {
    this.record('defeat-monsters');
  }

  recordPlannedMission(): void {
    this.record('complete-missions');
  }

  recordTrapUse(): void {
    this.record('use-trap');
  }

  recordVesselCollection(): void {
    this.record('collect-vessels');
  }

  recordStreakActivation(): void {
    this.record('activate-streak');
  }
  
  recordClickActivation(): void {
    this.record('clicks');
  }

  recordChestOpening(): void {
    this.record('chest-opening');
  }

  getSaveData(): MissionSaveData {
    return {
      slots: this.slots.map((slot) => ({
        ...slot,
        mission: slot.mission ? {
          ...slot.mission,
          objective: { ...slot.mission.objective },
        } : null,
      })),
      unlockedSlots: this.unlockedSlots,
      unseen: this.unseen,
    };
  }

  setSaveData(data?: MissionSaveData, unlockContext?: UnlockContext): void {
    if (unlockContext) {
      this.unlockContext = unlockContext;
    }
    if (!data) {
      this.slots = [];
      this.unlockedSlots = 1;
      this.unseen = false;
      this.nextMissionId = 0;
      this.cachedView = [];
      return;
    }
    this.unlockedSlots = Math.max(1, Math.min(MAX_MISSION_SLOTS, Math.floor(data.unlockedSlots || 1)));
    this.slots = Array.isArray(data.slots)
      ? data.slots
        .filter((slot) => slot && Number.isInteger(slot.id) && slot.id >= 0 && slot.id < this.unlockedSlots)
        .map((slot) => ({
          id: slot.id,
          mission: this.normalizeMission(slot.mission),
          cooldownEndsAt: Number.isFinite(slot.cooldownEndsAt) ? slot.cooldownEndsAt : 0,
          cooldownReason: slot.cooldownReason === 'completed' || slot.cooldownReason === 'rerolled'
            ? slot.cooldownReason
            : null,
          lastReward: Math.max(0, Math.floor(slot.lastReward || 0)),
        }))
      : [];
    this.unseen = data.unseen === true;
    this.nextMissionId = this.slots.reduce((max, slot) => {
      const id = Number(slot.mission && slot.mission.id.replace('mission-', ''));
      return Number.isFinite(id) ? Math.max(max, id + 1) : max;
    }, this.nextMissionId);
    this.refreshSlots();
  }

  private normalizeMission(mission: Mission | null): Mission | null {
    if (!mission) {
      return null;
    }
    const normalized = {
      ...mission,
      objective: { ...mission.objective },
    };
    if (normalized.objective.type === 'complete-missions' && normalized.objective.target < 2) {
      normalized.objective.target = 2;
      normalized.objective.description = 'Terminer 2 missions';
    }
    return normalized;
  }

  private record(type: MissionObjectiveType): void {
    this.slots.forEach((slot) => {
      if (slot.mission && slot.mission.objective.type === type) {
        slot.mission.objective.progress += 1;
      }
    });
    this.completeReadyMissions();
  }

  private refreshSlots(): void {
    this.slots.forEach((slot) => {
      if (slot.mission && !this.isMissionTypeUnlocked(slot.mission.objective.type)) {
        slot.mission = this.createMission();
        slot.cooldownEndsAt = 0;
        slot.cooldownReason = null;
        slot.lastReward = 0;
        this.unseen = true;
      }
      if (!slot.mission && slot.cooldownEndsAt <= Date.now()) {
        slot.mission = this.createMission();
        slot.cooldownReason = null;
        slot.lastReward = 0;
        this.unseen = true;
      }
      if (slot.mission && slot.mission.objective.type === 'hold-clicks') {
        slot.mission.objective.progress = this.resources.getClicks();
      }
    });
  }

  private completeReadyMissions(): void {
    this.slots.forEach((slot) => {
      const mission = slot.mission;
      if (!mission || mission.objective.progress < mission.objective.target) return;
      const ticketReward = scaleResourceAmount(
        mission.ticketReward,
        this.kitchen?.getModifiers().ticketRewardMultiplier ?? 1
      );
      this.resources.addResource('ticket', ticketReward);
      slot.lastReward = ticketReward;
      slot.mission = null;
      slot.cooldownEndsAt = Date.now() + MISSION_SLOT_COOLDOWN_SECONDS * 1000;
      slot.cooldownReason = 'completed';
      this.unseen = true;
    });
  }

  private createSlot(id: number): MissionSlot {
    return {
      id,
      mission: this.createMission(),
      cooldownEndsAt: 0,
      cooldownReason: null,
      lastReward: 0,
    };
  }

  private createMission(): Mission {
    const availableTemplates = MISSION_TEMPLATES.filter((candidate) =>
      !candidate.unlockMethod || candidate.unlockMethod().isUnlocked(this.unlockContext)
    );
    const selectedTemplate = availableTemplates[Math.floor(Math.random() * availableTemplates.length)];
    const target = selectedTemplate.type === 'hold-clicks'
      ? Math.max(selectedTemplate.target, Math.ceil(this.resources.getClicks() * 1.1))
      : selectedTemplate.target;
    return {
      id: `mission-${this.nextMissionId++}`,
      objective: {
        type: selectedTemplate.type,
        target,
        progress: selectedTemplate.type === 'hold-clicks' ? this.resources.getClicks() : 0,
        description: selectedTemplate.description(target),
      },
      ticketReward: selectedTemplate.reward,
    };
  }

  private isMissionTypeUnlocked(type: MissionObjectiveType): boolean {
    return MISSION_TEMPLATES.some((template) =>
      template.type === type
      && (!template.unlockMethod || template.unlockMethod().isUnlocked(this.unlockContext))
    );
  }

  private areViewsEqual(left: MissionSlotView, right: MissionSlotView): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
  }
}
