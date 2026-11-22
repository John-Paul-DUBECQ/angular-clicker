export type MissionObjectiveType =
  | 'defeat-monsters'
  | 'complete-missions'
  | 'use-trap'
  | 'hold-clicks'
  | 'collect-vessels'
  | 'clicks'
  | 'activate-streak'
  | 'chest-opening';

export interface MissionObjective {
  type: MissionObjectiveType;
  target: number;
  progress: number;
  description: string;
}

export interface Mission {
  id: string;
  objective: MissionObjective;
  ticketReward: number;
}

export interface MissionSlot {
  id: number;
  mission: Mission | null;
  cooldownEndsAt: number;
  cooldownReason: 'completed' | 'rerolled' | null;
  lastReward: number;
}

export interface MissionSlotView extends MissionSlot {
  cooldownRemainingSeconds: number;
  rerollAvailable: boolean;
}

export interface MissionSaveData {
  slots: MissionSlot[];
  unlockedSlots: number;
  unseen: boolean;
}

export const MISSION_SLOT_COOLDOWN_SECONDS = 5 * 60;
export const MISSION_REROLL_COOLDOWN_SECONDS = 60;
export const MAX_MISSION_SLOTS = 3;
