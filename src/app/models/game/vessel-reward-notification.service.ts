import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface VesselReward {
  /** Or gagné (clics). */
  gold?: number;
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
