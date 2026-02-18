import { Component, OnInit, OnDestroy } from '@angular/core';
import { GameStateService } from './models/game/game-state.service';
import { Game } from './models/game/game';
import { WorkerAuto } from './models/worker-auto-model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Clicker Game';
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  game: Game = { clicks: 0, workers: [], workersAvailable: [], clickValue: 1, valueAutoPerSecond: 0 };
  workers: WorkerAuto[] = [];
  workersAvailable: WorkerAuto[] = [];
  importError = false;

  constructor(private gameState: GameStateService) {}

  ngOnInit(): void {
    this.refreshGameState();
    this.refreshInterval = setInterval(() => this.refreshGameState(), 500);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval !== null) {
      clearInterval(this.refreshInterval);
    }
  }

  private refreshGameState(): void {
    const state = this.gameState.getState();
    this.game = state;
    this.workers = state.workers;
    this.workersAvailable = state.workersAvailable;
  }

  click(): void {
    this.gameState.click();
    this.refreshGameState();
  }

  upgradeWorker(workerId: number): void {
    this.gameState.upgradeWorker(workerId);
    this.refreshGameState();
  }

  exportSave(): void {
    this.gameState.downloadSave();
  }

  /** Garde les mêmes lignes DOM au refresh → le clic n’est pas perdu quand l’affichage s’actualise. */
  trackByIndex(index: number, _worker: WorkerAuto): number {
    return index;
  }

  importSave(event: Event): void {
    this.importError = false;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const json = reader.result as string;
      if (this.gameState.importSave(json)) {
        this.refreshGameState();
      } else {
        this.importError = true;
      }
    };
    reader.readAsText(file);
  }
}
