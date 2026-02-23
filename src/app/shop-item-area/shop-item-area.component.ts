import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ShopItem } from '../models/shop-item';
import { GameStateService } from '../models/game/game-state.service';

const POPUP_OFFSET = 12;
const POPUP_VIEWPORT_MARGIN = 12;
const POPUP_SELECTOR = '.shop-item-popup--fixed';

@Component({
  selector: 'app-shop-item-area',
  templateUrl: './shop-item-area.component.html',
  styleUrls: ['./shop-item-area.component.css']
})
export class ShopItemAreaComponent {

  @Input() shopItemSelected!: ShopItem;
  @Input() itemIndex!: number;
  @Output() bought = new EventEmitter<number>();

  @ViewChild('slotRef') slotRef!: ElementRef<HTMLElement>;

  popupVisible = false;
  popupStyle: { left: string; top: string } | null = null;

  constructor(private gameState: GameStateService) {}

  get canBuy(): boolean {
    return !this.shopItemSelected.bought && this.gameState.canBuyShopItem(this.shopItemSelected.price);
  }

  buyShopItem(): void {
    this.gameState.buyShopItem(this.itemIndex);
    this.bought.emit(this.itemIndex);
  }

  onSlotMouseEnter(): void {
    const el = this.slotRef?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    this.popupStyle = {
      left: `${rect.right + POPUP_OFFSET}px`,
      top: `${rect.top + rect.height / 2}px`,
    };
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
