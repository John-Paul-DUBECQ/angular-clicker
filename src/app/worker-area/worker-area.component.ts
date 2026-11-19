import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';
import { WorkerAuto, WorkerAutoData, calculateClicksPerSecondForWorker, getClickBonus, getWorkerBuyButtonText, getWorkerDescription } from '../models/worker-auto-model';
import { GameStateService, WorkerInfoStats } from '../models/game/game-state.service';
import { WorkerUnlock } from '../models/unlocks/worker-unlock.model';
import { getUpcomingPowerUnlockTiers } from '../models/unlocks/power-unlock';
import { houseUnlockDefinition } from '../models/unlocks/house-unlock';
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
  @Input() workerIndex = 0;  /** Tous les workers disponibles (pour les dépendances). */
  @Input() workersAvailable: WorkerAutoData[] = [];
  /** Clics actuels (pour afficher le motif du blocage). */
  @Input() clicks = 0;  /** Émis après un upgrade pour que le parent rafraîchisse l’affichage tout de suite. */
  @Output() upgraded = new EventEmitter<void>();
  
  @ViewChild('unlockRef') unlockRef!: ElementRef<HTMLElement>;
  @ViewChild('infoRef') infoRef!: ElementRef<HTMLElement>;
  @ViewChild('upgradeRef') upgradeRef?: ElementRef<HTMLButtonElement>;

  unlockPopupVisible = false;
  unlockPopupStyle: { left: string; top: string } | null = null;
  upgradeButtonHovered = false;
  private readonly pressedUpgradeKeys = new Set<string>();
  private readonly consumedShortcutClicks = new Set<string>();

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

  get totalClickDamage(): number {
    return this.workerSelected?.totalClickDamage ?? this.clickBonus + 1;
  }

  get isClickWorker(): boolean {
    return this.workerSelected?.workerType === 'click';
  }

  /** Texte du bouton d'achat (prix + condition si nécessaire). */
  get buyButtonText(): string {
    if (!this.workerSelected) return '';
    return getWorkerBuyButtonText(this.workerSelected, this.clicks, this.workersAvailable);
  }

  get selectedUpgradeLevels(): number | 'max' {
    if (this.pressedUpgradeKeys.has('q')) return 'max';
    if (this.pressedUpgradeKeys.has('m')) return 1000;
    if (this.pressedUpgradeKeys.has('shift')) return 100;
    if (this.pressedUpgradeKeys.has('control')) return 10;
    return 1;
  }

  get upgradePricePreview(): { levels: number; totalPrice: number; canBuy: boolean } {
    return this.gameState.getWorkerUpgradePricePreview(this.workerIndex, this.selectedUpgradeLevels);
  }

  getUpgradePricePreviewLabel(preview: { levels: number; totalPrice: number; canBuy: boolean }): string {
    if (this.selectedUpgradeLevels === 'max') {
      return preview.levels > 0
        ? `Maximum (${preview.levels} niveau${preview.levels > 1 ? 'x' : ''}) :`
        : 'Maximum (prochain niveau) :';
    }
    return `${this.selectedUpgradeLevels == 1 ? 'Upgrade' : `${this.selectedUpgradeLevels} niveaux`} :`;
  }

  /** Prochains paliers (unlocks worker + déblocage sorts pour Magicien), triés par niveau, limité à 3 pour ne pas flood. */
  private readonly NEXT_UNLOCKS_MAX = 3;

  /** Stats à afficher dans le popup Infos (ex. Mineur : chance critique, dégâts critique). */
  get workerInfoStats(): WorkerInfoStats {
    return this.gameState.getWorkerInfoStats(this.workerIndex);
  }

  /** Description narrative du worker (sans label, alignée à gauche). Déduplique si la même phrase apparaît deux fois. */
  get workerDescription(): string | undefined {
    if (!this.workerSelected) return undefined;
    const d = getWorkerDescription(this.workerSelected);
    if (!d || d.length < 200) return d;
    const half = Math.floor(d.length / 2);
    if (d.slice(0, half).trim() === d.slice(half).trim()) return d.slice(0, half).trim();
    return d;
  }

  get nextWorkerUnlocks(): WorkerUnlock[] {
    const w = this.workerSelected;
    const level = w?.level ?? 0;
    const fromUnlocks: WorkerUnlock[] = (w?.unlocks ?? []).filter((unlock) => {
      const requiredLevel = unlock.unlockMethod?.getWorkerLevelRequirement(this.workerIndex)
        ?? unlock.levelRequired;
      return requiredLevel != null && level < requiredLevel;
    });
    const fromPowerTiers = getUpcomingPowerUnlockTiers(this.workerIndex, level);
    const fromHouseTier =
      this.workerIndex === 1 && level < (houseUnlockDefinition.levelRequired ?? 0)
        ? [houseUnlockDefinition]
        : [];
    const fromShopItems = getUpcomingShopItemUnlockTiers(this.workerIndex, level, listShopItem);
    const merged = [...fromUnlocks, ...fromPowerTiers, ...fromHouseTier, ...fromShopItems].sort(
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

  upgradeWorker(levels: number | 'max' = 1): void {
    if (this.gameState.upgradeWorker(this.workerIndex, levels)) {
      this.upgraded.emit();
    }
  }

  onUpgradeClick(event: MouseEvent): void {
    const levels = this.selectedUpgradeLevelsForClick(event);
    this.pressedUpgradeKeys.forEach((key) => {
      if (key === 'm' || key === 'q') {
        this.consumedShortcutClicks.add(key);
      }
    });
    this.upgradeWorker(levels);
  }

  @HostListener('document:keydown', ['$event'])
  onUpgradeShortcut(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (!['m', 'q', 'shift', 'control'].includes(key) || this.isEditableTarget(event.target)) {
      return;
    }
    this.pressedUpgradeKeys.add(key);
  }

  @HostListener('document:keyup', ['$event'])
  onUpgradeShortcutRelease(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    if (!this.pressedUpgradeKeys.delete(key)) {
      return;
    }
    if (key !== 'm' && key !== 'q') {
      return;
    }
    if (this.consumedShortcutClicks.delete(key)) {
      return;
    }
    if (
      (!this.upgradeButtonHovered && document.activeElement !== this.upgradeRef?.nativeElement)
      || this.isEditableTarget(event.target)
    ) {
      return;
    }
    this.upgradeWorker(key === 'm' ? 1000 : 'max');
  }

  @HostListener('window:blur')
  onWindowBlur(): void {
    this.pressedUpgradeKeys.clear();
    this.consumedShortcutClicks.clear();
  }

  private selectedUpgradeLevelsForClick(event: MouseEvent): number | 'max' {
    if (this.pressedUpgradeKeys.has('q')) return 'max';
    if (this.pressedUpgradeKeys.has('m')) return 1000;
    if (event.shiftKey || this.pressedUpgradeKeys.has('shift')) return 100;
    if (event.ctrlKey || this.pressedUpgradeKeys.has('control')) return 10;
    return 1;
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    return !!element
      && (element.isContentEditable
        || !!element.closest('input, textarea, select, [contenteditable="true"]'));
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
