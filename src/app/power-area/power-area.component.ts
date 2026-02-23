import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Power } from '../models/powers/power.model';
import { GameStateService } from '../models/game/game-state.service';

const POPUP_OFFSET = 12;
const POPUP_VIEWPORT_MARGIN = 12;
const POPUP_SELECTOR = '.power-popup--fixed';

@Component({
  selector: 'app-power-area',
  templateUrl: './power-area.component.html',
  styleUrls: ['./power-area.component.css']
})
export class PowerAreaComponent {

  @Input() powerSelected!: Power;
  @Input() powerIndex!: number;
  @Input() manaCost: number | null = null;
  @Input() canCast = false;
  /** Pourcentage de temps restant de l’effet (0–100) pour afficher la border en horloge. */
  @Input() effectRemainingPercent: number | null = null;
  @Output() bought = new EventEmitter<number>();
  @Output() cast = new EventEmitter<number>();

  @ViewChild('slotRef') slotRef!: ElementRef<HTMLElement>;

  popupVisible = false;
  popupStyle: { left: string; top: string } | null = null;

  constructor(private gameState: GameStateService) {}

  onSlotClick(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.canCast) {
      this.gameState.castPower(this.powerIndex);
      this.cast.emit(this.powerIndex);
    }
    this.togglePopup();
  }

  private updatePopupPosition(): void {
    const el = this.slotRef?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    this.popupStyle = {
      left: `${rect.right + POPUP_OFFSET}px`,
      top: `${rect.top + rect.height / 2}px`,
    };
  }

  private togglePopup(): void {
    if (this.popupVisible) {
      this.popupVisible = false;
    } else {
      this.updatePopupPosition();
      this.popupVisible = true;
      setTimeout(() => this.clampPopupToViewport(), 0);
    }
  }

  onSlotMouseEnter(): void {
    this.updatePopupPosition();
    this.popupVisible = true;
    setTimeout(() => this.clampPopupToViewport(), 0);
  }

  onSlotMouseLeave(): void {
    this.popupVisible = false;
  }

  /** Garde le popup dans la fenêtre (horizontal et vertical). */
  private clampPopupToViewport(): void {
    const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement | null;
    if (!popup || !this.popupStyle) return;
    const r = popup.getBoundingClientRect();
    const margin = POPUP_VIEWPORT_MARGIN;
    const maxLeft = window.innerWidth - margin - r.width;
    const minLeft = margin;
    const minTop = margin;
    const maxBottom = window.innerHeight - margin;
    let leftPx = parseFloat(this.popupStyle.left);
    let topPx = parseFloat(this.popupStyle.top);
    if (r.right > window.innerWidth - margin) leftPx = maxLeft;
    if (r.left < margin) leftPx = minLeft;
    if (r.top < minTop) topPx += minTop - r.top;
    if (r.bottom > maxBottom) topPx -= r.bottom - maxBottom;
    this.popupStyle = { left: `${leftPx}px`, top: `${topPx}px` };
  }

}
