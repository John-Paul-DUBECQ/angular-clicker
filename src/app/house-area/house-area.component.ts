import { Component, EventEmitter, Input, Output } from '@angular/core';
import { House } from '../models/house';
import { ResourceStock } from '../models/resource';

@Component({
  selector: 'app-house-area',
  templateUrl: './house-area.component.html',
  styleUrls: ['./house-area.component.css'],
})
export class HouseAreaComponent {
  @Input() house!: House;
  @Input() essence = 0;
  @Input() resources: ResourceStock[] = [];
  @Output() upgraded = new EventEmitter<void>();

  get canBuy(): boolean {
    const costs = this.house.unlocked ? this.house.costs : (this.house.unlockCosts ?? []);
    const price = this.house.unlocked ? this.house.price : (this.house.unlockPrice ?? 0);
    if (this.house.maxLevel != null && (this.house.level >= this.house.maxLevel || !this.house.unlocked)) {
      return !this.house.unlocked && this.essence >= price && costs.every((cost) => {
        const stock = this.resources.find((resource) => resource.id === cost.resourceId);
        return (stock?.amount ?? 0) >= cost.amount;
      });
    }
    return this.essence >= price && costs.every((cost) => {
      const stock = this.resources.find((resource) => resource.id === cost.resourceId);
      return (stock?.amount ?? 0) >= cost.amount;
    });
  }

  get displayedCosts() {
    return this.house.unlocked ? this.house.costs : (this.house.unlockCosts ?? []);
  }

  get actionLabel(): string {
    if (!this.house.unlocked) return `Déverrouiller · ${this.house.unlockPrice ?? 0} essence`;
    if (this.house.maxLevel != null && this.house.level >= this.house.maxLevel) return 'Niveau maximum';
    return `Améliorer · ${this.house.price} essence`;
  }

  getResourceName(resourceId: string): string {
    return this.resources.find((resource) => resource.id === resourceId)?.name ?? resourceId;
  }

  getResourceAmount(resourceId: string): number {
    return this.resources.find((resource) => resource.id === resourceId)?.amount ?? 0;
  }

  buy(): void {
    if (this.canBuy) this.upgraded.emit();
  }
}
