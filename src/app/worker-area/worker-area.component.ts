import { Component, Input, OnInit } from '@angular/core';
import { WorkerAuto, calculateClicksPerSecondForWorker } from '../models/worker-auto-model';
import { GameStateService } from '../models/game/game-state.service';

@Component({
  selector: 'app-worker-area',
  templateUrl: './worker-area.component.html',
  styleUrls: ['./worker-area.component.css']
})
export class WorkerAreaComponent implements OnInit {

  /** Worker à afficher : passé par le parent (ex. au clic sur une ligne). */
  @Input() workerSelected: WorkerAuto | null = null;
  /** Index du worker dans la liste (pour le bouton Upgrade). */
  @Input() workerIndex = 0;

  constructor(private gameState: GameStateService) {}

  ngOnInit(): void {
    // Si le parent n’a pas passé de worker, workerSelected reste null
  }

  /** Production /s de ce worker (utilise la fonction du modèle). */
  get clicksPerSecond(): number {
    return this.workerSelected ? calculateClicksPerSecondForWorker(this.workerSelected) : 0;
  }

  upgradeWorker(): void {
    this.gameState.upgradeWorker(this.workerIndex);
  }
}
