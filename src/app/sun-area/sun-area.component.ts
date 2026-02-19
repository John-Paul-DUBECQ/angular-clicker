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
  /** Émis après un clic sur le soleil pour que le parent rafraîchisse l'état. */
  @Output() clicked = new EventEmitter<void>();


  constructor(private gameState: GameStateService) {}



  clickSun($event: Event): void {
    $event.stopPropagation();
    this.gameState.clickSun();
    this.clicked.emit();
  }


}
