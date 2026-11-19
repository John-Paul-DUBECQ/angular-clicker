import { Injectable } from '@angular/core';
import { Mission, MissionObjectiveType, MissionSaveData, MissionSlot, MissionSlotView,
  MISSION_REROLL_COOLDOWN_SECONDS, MISSION_SLOT_COOLDOWN_SECONDS, MAX_MISSION_SLOTS } from '../missions/mission.model';
import { ResourcesService } from './resources.service';

interface MissionTemplate {
  type: MissionObjectiveType;
  target: number;
  reward: number;
  description: (target: number) => string;
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  { type: 'defeat-monsters', target: 5, reward: 1, description: (n) => `Vaincre ${n} monstres` },
  { type: 'defeat-monsters', target: 10, reward: 2, description: (n) => `Vaincre ${n} monstres` },
  { type: 'defeat-monsters', target: 20, reward: 3, description: (n) => `Vaincre ${n} monstres` },
  { type: 'complete-missions', target: 1, reward: 1, description: (n) => `Terminer ${n} mission` },
  { type: 'complete-missions', target: 2, reward: 2, description: (n) => `Terminer ${n} missions` },
  { type: 'complete-missions', target: 3, reward: 3, description: (n) => `Terminer ${n} missions` },
  { type: 'use-bait', target: 1, reward: 2, description: (n) => `Utiliser ${n} appât sur un boss` },
  { type: 'use-bait', target: 2, reward: 3, description: (n) => `Utiliser ${n} appâts sur des boss` },
  { type: 'hold-clicks', target: 100, reward: 1, description: (n) => `Avoir ${n} clics en réserve` },
  { type: 'hold-clicks', target: 100, reward: 2, description: (n) => `Avoir ${n} clics en réserve` },
  { type: 'collect-vessels', target: 1, reward: 1, description: (n) => `Récupérer ${n} vaisseau` },
  { type: 'collect-vessels', target: 3, reward: 2, description: (n) => `Récupérer ${n} vaisseaux` },
  { type: 'activate-streak', target: 1, reward: 1, description: (n) => `Activer la barre de streak ${n} fois` },
  { type: 'activate-streak', target: 3, reward: 2, description: (n) => `Activer la barre de streak ${n} fois` },
];

@Injectable({ providedIn: 'root' })
export class MissionStateService {
  private slots: MissionSlot[] = [];
  private cachedView: MissionSlotView[] = [];
  private unlockedSlots = 1;
  private unseen = false;
  private nextMissionId = 0;

  constructor(private resources: ResourcesService) {}

  getView(beachUnlocked: boolean): MissionSlotView[] {
    if (!beachUnlocked) return [];
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

  recordBaitUse(): void {
    this.record('use-bait');
  }

  recordVesselCollection(): void {
    this.record('collect-vessels');
  }

  recordStreakActivation(): void {
    this.record('activate-streak');
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

  setSaveData(data?: MissionSaveData): void {
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
          mission: slot.mission,
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
      this.resources.addResource('ticket', mission.ticketReward);
      slot.lastReward = mission.ticketReward;
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
    const template = MISSION_TEMPLATES[Math.floor(Math.random() * MISSION_TEMPLATES.length)];
    const target = template.type === 'hold-clicks'
      ? Math.max(template.target, Math.ceil(this.resources.getClicks() * 1.1))
      : template.target;
    return {
      id: `mission-${this.nextMissionId++}`,
      objective: {
        type: template.type,
        target,
        progress: template.type === 'hold-clicks' ? this.resources.getClicks() : 0,
        description: template.description(target),
      },
      ticketReward: template.reward,
    };
  }

  private areViewsEqual(left: MissionSlotView, right: MissionSlotView): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
  }
}
