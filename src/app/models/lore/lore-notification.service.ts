import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface LorePayload {
  /** Titre affiché dans la popup. */
  title: string;
  /** Texte principal. */
  text: string;
  /** Image optionnelle. */
  imageUrl?: string | null;
  /** Clé optionnelle (debug/anti-doublon). */
  key?: string;
}

/** Émet des messages de lore pour affichage en popup plein écran dans l’UI. */
@Injectable({ providedIn: 'root' })
export class LoreNotificationService {
  private subject = new Subject<LorePayload>();

  readonly lore$ = this.subject.asObservable();

  notify(payload: LorePayload): void {
    this.subject.next(payload);
  }
}

