import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ResourceReward } from '../resource';

export interface VesselReward {
  /** Or gagné (clics). */
  gold?: number;
  /** Ressources obtenues en cliquant sur le vaisseau. */
  resources?: ResourceReward[];
  /** Message (buff, spawn mob, etc.). */
  message?: string;
}

/** Émet les récompenses de clic vaisseau pour affichage (ex. Swal) en bas à droite. */
@Injectable({ providedIn: 'root' })
export class VesselRewardNotificationService {
  private rewardSubject = new Subject<VesselReward>();

  readonly reward$ = this.rewardSubject.asObservable();

  notifyReward(payload: VesselReward): void {
    this.rewardSubject.next(payload);
  }
}
