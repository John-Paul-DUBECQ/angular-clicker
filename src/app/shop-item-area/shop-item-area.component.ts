import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { ShopItem } from '../models/shop-item';
import { GameStateService } from '../models/game/game-state.service';

const POPUP_OFFSET = 12;

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
  }

  onSlotMouseLeave(): void {
    this.popupVisible = false;
  }

}
