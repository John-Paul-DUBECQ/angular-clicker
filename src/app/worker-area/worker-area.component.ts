import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { WorkerAuto, calculateClicksPerSecondForWorker, getClickBonus } from '../models/worker-auto-model';
import { GameStateService } from '../models/game/game-state.service';
import { WorkerUnlock } from '../models/unlocks/worker-unlock.model';
import { getUpcomingPowerUnlockTiers, POWER_WORKER_INDEX } from '../models/unlocks/power-unlock';

const POPUP_OFFSET = 12;

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
  
  @ViewChild('unlockRef') unlockRef!: ElementRef<HTMLElement>;

  unlockPopupVisible = false;
  unlockPopupStyle: { left: string; top: string } | null = null;

  private readonly POPUP_VIEWPORT_MARGIN = 12;
  private readonly POPUP_SELECTOR = '.worker-unlock-popup--fixed';

  constructor(private gameState: GameStateService) {}

  /** Production /s effective (workers auto), avec bonus shop. */
  get clicksPerSecond(): number {
    if (!this.workerSelected) return 0;
    return this.workerSelected.effectiveProductionPerSecond ?? calculateClicksPerSecondForWorker(this.workerSelected);
  }

  /** Bonus dégâts par clic effectif (workers click), avec bonus shop. */
  get clickBonus(): number {
    if (!this.workerSelected) return 0;
    return this.workerSelected.effectiveClickBonus ?? getClickBonus(this.workerSelected);
  }

  get isClickWorker(): boolean {
    return this.workerSelected?.workerType === 'click';
  }

  /** Prochains paliers (unlocks worker + déblocage sorts pour Magicien), triés par niveau, limité à 3 pour ne pas flood. */
  private readonly NEXT_UNLOCKS_MAX = 3;

  get nextWorkerUnlocks(): WorkerUnlock[] {
    const w = this.workerSelected;
    const level = w?.level ?? 0;
    const fromUnlocks: WorkerUnlock[] = (w?.unlocks ?? []).filter(
      (u) => level < (u.levelRequired ?? 1)
    );
    const fromPowerTiers =
      this.workerIndex === POWER_WORKER_INDEX ? getUpcomingPowerUnlockTiers(level) : [];
    const merged = [...fromUnlocks, ...fromPowerTiers].sort(
      (a, b) => (a.levelRequired ?? 0) - (b.levelRequired ?? 0)
    );
    return merged.slice(0, this.NEXT_UNLOCKS_MAX);
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

  onUnlockMouseEnter(): void {
    const el = this.unlockRef?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const triggerCenterY = rect.top + rect.height / 2;
    this.unlockPopupStyle = {
      left: `${rect.right + POPUP_OFFSET}px`,
      top: `${triggerCenterY}px`,
    };
    this.unlockPopupVisible = true;
    setTimeout(() => this.clampPopupToViewport(), 0);
  }

  /** Garde le popup dans la fenêtre (haut et bas). */
  private clampPopupToViewport(): void {
    const popup = document.querySelector(this.POPUP_SELECTOR) as HTMLElement | null;
    if (!popup || !this.unlockPopupStyle) return;
    const r = popup.getBoundingClientRect();
    const minTop = this.POPUP_VIEWPORT_MARGIN;
    const maxBottom = window.innerHeight - this.POPUP_VIEWPORT_MARGIN;
    let topPx = parseFloat(this.unlockPopupStyle.top);
    if (r.top < minTop) topPx += minTop - r.top;
    if (r.bottom > maxBottom) topPx -= r.bottom - maxBottom;
    this.unlockPopupStyle = { ...this.unlockPopupStyle, top: `${topPx}px` };
  }

  onUnlockMouseLeave(): void {
    this.unlockPopupVisible = false;
  }

}
