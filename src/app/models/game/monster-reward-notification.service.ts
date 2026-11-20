import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ResourceReward } from '../resource';

export interface MonsterReward {
  gold: number;
  essence: number;
  resources: ResourceReward[];
  title?: string;
}

/** Émet les récompenses de kill mob pour affichage (ex. Swal) dans l’UI. */
@Injectable({ providedIn: 'root' })
export class MonsterRewardNotificationService {
  private rewardSubject = new Subject<MonsterReward>();
  private batching = false;
  private buffer: MonsterReward | null = null;

  /** À souscrire dans l’UI pour afficher la récompense (ex. Swal). */
  readonly reward$ = this.rewardSubject.asObservable();

  /** Regroupe les toasts de kill pendant un rattrapage de temps (onglet inactif). */
  beginBatch(): void {
    this.batching = true;
  }

  endBatch(): void {
    this.batching = false;
    const buffered = this.buffer;
    this.buffer = null;
    if (!buffered) return;
    if (buffered.gold <= 0 && buffered.essence <= 0 && buffered.resources.length === 0) return;
    this.rewardSubject.next(buffered);
  }

  notifyReward(gold: number, essence: number, resources: ResourceReward[] = [], title?: string): void {
    if (this.batching) {
      this.addToBuffer({ gold, essence, resources, title });
      return;
    }
    this.rewardSubject.next({ gold, essence, resources, title });
  }

  private addToBuffer(reward: MonsterReward): void {
    if (!this.buffer) {
      this.buffer = { gold: 0, essence: 0, resources: [], title: 'Gains en arrière-plan' };
    }
    this.buffer.gold += reward.gold;
    this.buffer.essence += reward.essence;
    for (const resource of reward.resources) {
      const existing = this.buffer.resources.find((entry) => entry.resourceId === resource.resourceId);
      if (existing) {
        existing.amount += resource.amount;
      } else {
        this.buffer.resources.push({ ...resource });
      }
    }
  }
}
