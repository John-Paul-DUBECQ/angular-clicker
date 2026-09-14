import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { EssenceShopItem } from '../models/essence-shop-item';
import { GameStateService } from '../models/game/game-state.service';

const POPUP_OFFSET = 12;
const POPUP_VIEWPORT_MARGIN = 12;
const POPUP_SELECTOR = '.essence-shop-item-popup--fixed';

@Component({
	selector: 'app-essence-shop-item-area',
	templateUrl: './essence-shop-item-area.component.html',
	styleUrls: ['./essence-shop-item-area.component.css']
})
export class EssenceShopItemAreaComponent {
	@Input() item!: EssenceShopItem;
	@Input() itemIndex!: number;
	@Output() bought = new EventEmitter<number>();

	@ViewChild('itemRef') itemRef!: ElementRef<HTMLElement>;

	popupVisible = false;
	popupStyle: { left: string; top: string } | null = null;

	constructor(private gameState: GameStateService) {}

	get canBuy(): boolean {
		return this.gameState.canBuyEssenceShopItem(this.itemIndex);
	}

	buyItem(): void {
		if (!this.canBuy) return;
		if (this.gameState.buyEssenceShopItem(this.itemIndex)) {
			this.bought.emit(this.itemIndex);
		}
	}

	get effectLabel(): string {
		const labels: Record<string, string> = {
			spawnRate: 'Apparition',
			essence: 'Essence',
			hp: 'PV des monstres',
			time: 'Temps de combat',
		};
		return labels[this.item.effectType] || 'Effet';
	}

	get effectPercent(): string {
		return this.formatPercent(this.item.effectValue);
	}

	get effects(): Array<{ label: string; percent: string; value: number }> {
		const labels: Record<string, string> = {
			spawnRate: 'Apparition',
			essence: 'Essence',
			hp: 'PV des monstres',
			time: 'Temps de combat',
		};
		const effects = [{
			label: labels[this.item.effectType] || 'Effet',
			percent: this.formatPercent(this.item.effectValue, this.item.level),
			value: this.getCumulativeMultiplier(this.item.effectValue),
		}];

		if (this.item.secondaryEssenceMultiplier != null) {
			effects.push({
				label: labels.essence,
				percent: this.formatPercent(this.item.secondaryEssenceMultiplier, this.item.level),
				value: this.getCumulativeMultiplier(this.item.secondaryEssenceMultiplier),
			});
		}

		return effects.sort((first, second) => second.value - first.value);
	}

	private formatPercent(multiplier: number, level = 1): string {
		const percent = Math.round((multiplier - 1) * Math.max(1, level) * 100);
		return `${percent >= 0 ? '+' : ''}${percent} %`;
	}

	private getCumulativeMultiplier(multiplier: number): number {
		return 1 + (multiplier - 1) * Math.max(1, this.item.level);
	}

	onMouseEnter(): void {
		const element = this.itemRef?.nativeElement;
		if (!element) return;
		const rect = element.getBoundingClientRect();
		this.popupStyle = {
			left: `${rect.right + POPUP_OFFSET}px`,
			top: `${rect.top + rect.height / 2}px`,
		};
		this.popupVisible = true;
		setTimeout(() => this.clampPopupToViewport(), 0);
	}

	onMouseLeave(): void {
		this.popupVisible = false;
	}

	private clampPopupToViewport(): void {
		const popup = document.querySelector(POPUP_SELECTOR) as HTMLElement | null;
		if (!popup || !this.popupStyle) return;
		const rect = popup.getBoundingClientRect();
		const margin = POPUP_VIEWPORT_MARGIN;
		let left = parseFloat(this.popupStyle.left);
		let top = parseFloat(this.popupStyle.top);
		if (rect.right > window.innerWidth - margin) left -= rect.right - (window.innerWidth - margin);
		if (rect.left < margin) left += margin - rect.left;
		if (rect.top < margin) top += margin - rect.top;
		if (rect.bottom > window.innerHeight - margin) top -= rect.bottom - (window.innerHeight - margin);
		this.popupStyle = { left: `${left}px`, top: `${top}px` };
	}
}
