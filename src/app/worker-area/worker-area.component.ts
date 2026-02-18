import { Component, EventEmitter, Input, Output } from '@angular/core';
import { WorkerAuto, calculateClicksPerSecondForWorker, getClickBonus } from '../models/worker-auto-model';
import { GameStateService } from '../models/game/game-state.service';

@Component({
  selector: 'app-worker-area',
  templateUrl: './worker-area.component.html',
  styleUrls: ['./worker-area.component.css']
})
export class WorkerAreaComponent {

  /** Worker à afficher : passé par le parent. */
  @Input() workerSelected: WorkerAuto | null = null;
  /** Index du worker dans la liste (pour le bouton Upgrade). */
  @Input() workerIndex = 0;
  /** Émis après un upgrade pour que le parent rafraîchisse l’affichage tout de suite. */
  @Output() upgraded = new EventEmitter<void>();

  constructor(private gameState: GameStateService) {}

  /** Production /s (workers auto) ou 0. */
  get clicksPerSecond(): number {
    return this.workerSelected ? calculateClicksPerSecondForWorker(this.workerSelected) : 0;
  }

  /** Bonus dégâts par clic (workers click) ou 0. */
  get clickBonus(): number {
    return this.workerSelected ? getClickBonus(this.workerSelected) : 0;
  }

  get isClickWorker(): boolean {
    return this.workerSelected?.workerType === 'click';
  }

  upgradeWorker(): void {
    this.gameState.upgradeWorker(this.workerIndex);
    this.upgraded.emit();
  }
}
