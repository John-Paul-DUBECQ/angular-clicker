import { Component, EventEmitter, Input, Output} from '@angular/core';
import { GameStateService } from '../models/game/game-state.service';


@Component({
  selector: 'app-sun-area',
  templateUrl: './sun-area.component.html',
  styleUrls: ['./sun-area.component.css']
})
export class SunAreaComponent {

  /** Affiche le soleil (x2 clics) quand true (Astrologue débloqué). */
  @Input() sunUnlocked = false;
  /** Facteur de durée de l'animation de rotation (1 = 8s, 0.9 = plus rapide). */
  @Input() sunSpeedFactor = 1;
  /** Facteur de taille du soleil (1 = base 44px). */
  @Input() sunSizeFactor = 1;
  /** Multiplicateur de dégâts du clic soleil (pour le tooltip). */
  @Input() sunDamageMultiplier: number | undefined;
  /** Émis après un clic sur le soleil pour que le parent rafraîchisse l'état. */
  @Output() clicked = new EventEmitter<void>();

  constructor(private gameState: GameStateService) {}

  clickSun($event: MouseEvent): void {
    $event.stopPropagation();
    this.gameState.clickSun($event);
    this.clicked.emit();
  }
}
