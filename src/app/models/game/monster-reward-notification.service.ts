import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface MonsterReward {
  gold: number;
  essence: number;
}

/** Émet les récompenses de kill mob pour affichage (ex. Swal) dans l’UI. */
@Injectable({ providedIn: 'root' })
export class MonsterRewardNotificationService {
  private rewardSubject = new Subject<MonsterReward>();

  /** À souscrire dans l’UI pour afficher la récompense (ex. Swal). */
  readonly reward$ = this.rewardSubject.asObservable();

  notifyReward(gold: number, essence: number): void {
    this.rewardSubject.next({ gold, essence });
  }
}
