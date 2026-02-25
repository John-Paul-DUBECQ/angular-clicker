import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { WorkerAuto, calculateClicksPerSecondForWorker, getClickBonus } from '../models/worker-auto-model';
import { GameStateService, WorkerInfoStats } from '../models/game/game-state.service';
import { WorkerUnlock } from '../models/unlocks/worker-unlock.model';
import { getUpcomingPowerUnlockTiers, POWER_WORKER_INDEX } from '../models/unlocks/power-unlock';
import { getUpcomingShopItemUnlockTiers } from '../models/shop-item';
import { listShopItem } from '../models/list-shop-item';

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
  @ViewChild('infoRef') infoRef!: ElementRef<HTMLElement>;

  unlockPopupVisible = false;
  unlockPopupStyle: { left: string; top: string } | null = null;

  infoPopupVisible = false;
  infoPopupStyle: { left: string; top: string } | null = null;

  private readonly POPUP_VIEWPORT_MARGIN = 12;
  private readonly POPUP_SELECTOR = '.worker-unlock-popup--fixed';
  private readonly INFO_POPUP_SELECTOR = '.worker-info-popup--fixed';

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

  /** Stats à afficher dans le popup Infos (ex. Mineur : chance critique, dégâts critique). */
  get workerInfoStats(): WorkerInfoStats {
    return this.gameState.getWorkerInfoStats(this.workerIndex);
  }

  /** Description narrative du worker (sans label, alignée à gauche). Déduplique si la même phrase apparaît deux fois. */
  get workerDescription(): string | undefined {
    const d = this.workerSelected?.description;
    if (!d || d.length < 200) return d;
    const half = Math.floor(d.length / 2);
    if (d.slice(0, half).trim() === d.slice(half).trim()) return d.slice(0, half).trim();
    return d;
  }

  get nextWorkerUnlocks(): WorkerUnlock[] {
    const w = this.workerSelected;
    const level = w?.level ?? 0;
    const fromUnlocks: WorkerUnlock[] = (w?.unlocks ?? []).filter(
      (u) => level < (u.levelRequired ?? 1)
    );
    const fromPowerTiers =
      this.workerIndex === POWER_WORKER_INDEX ? getUpcomingPowerUnlockTiers(level) : [];
    const fromShopItems = getUpcomingShopItemUnlockTiers(this.workerIndex, level, listShopItem);
    const merged = [...fromUnlocks, ...fromPowerTiers, ...fromShopItems].sort(
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

  onInfoMouseEnter(): void {
    const el = this.infoRef?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const triggerCenterY = rect.top + rect.height / 2;
    // Popup à gauche du trigger (comportement inverse du shop) pour ne pas être masqué par la souris / tooltip
    this.infoPopupStyle = {
      left: `${rect.left - POPUP_OFFSET}px`,
      top: `${triggerCenterY}px`,
    };
    this.infoPopupVisible = true;
    setTimeout(() => this.clampInfoPopupToViewport(), 0);
  }

  /** Garde le popup Infos dans la fenêtre (haut, bas, gauche, droite). */
  private clampInfoPopupToViewport(): void {
    const popupEl = document.querySelector(this.INFO_POPUP_SELECTOR) as HTMLElement | null;
    if (!popupEl || !this.infoPopupStyle) return;
    const r = popupEl.getBoundingClientRect();
    const margin = this.POPUP_VIEWPORT_MARGIN;
    let leftPx = parseFloat(this.infoPopupStyle.left);
    let topPx = parseFloat(this.infoPopupStyle.top);
    if (r.left < margin) leftPx += margin - r.left;
    if (r.right > window.innerWidth - margin) leftPx -= r.right - (window.innerWidth - margin);
    if (r.top < margin) topPx += margin - r.top;
    if (r.bottom > window.innerHeight - margin) topPx -= r.bottom - (window.innerHeight - margin);
    this.infoPopupStyle = { ...this.infoPopupStyle, left: `${leftPx}px`, top: `${topPx}px` };
  }

  onInfoMouseLeave(): void {
    this.infoPopupVisible = false;
  }

}
