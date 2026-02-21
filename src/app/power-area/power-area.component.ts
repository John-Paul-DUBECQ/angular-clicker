import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { Power } from '../models/powers/power.model';
import { GameStateService } from '../models/game/game-state.service';

const POPUP_OFFSET = 12;

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
    }
  }

  onSlotMouseEnter(): void {
    this.updatePopupPosition();
    this.popupVisible = true;
  }

  onSlotMouseLeave(): void {
    this.popupVisible = false;
  }

}
