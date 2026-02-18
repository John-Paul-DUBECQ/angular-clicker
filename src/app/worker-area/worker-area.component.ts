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

  /** Classe CSS pour la couleur du nom selon le niveau (pour ngClass). */
  getLevelNameClass(): string {
    const level = this.workerSelected?.level ?? 0;
    if (level >= 500) return 'level-tier-5';
    if (level >= 200) return 'level-tier-5';
    if (level >= 100) return 'level-tier-5';
    if (level >= 50) return 'level-tier-4';
    if (level >= 25) return 'level-tier-3';
    if (level >= 10) return 'level-tier-2';
    if (level >= 1) return 'level-tier-1';
    return 'level-tier-0';
  }

  upgradeWorker(): void {
    this.gameState.upgradeWorker(this.workerIndex);
    this.upgraded.emit();
  }
}
