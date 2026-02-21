import { Injectable } from '@angular/core';

export const DEFAULT_MAX_MANA = 100;
/** Régénération de base par tick (10 ticks/s → 0.5 mana/s). */
const DEFAULT_MANA_REGEN_PER_TICK = 0.05;

/** Service global pour les ressources : clics (monnaie) et mana (sorts). */
@Injectable({ providedIn: 'root' })
export class ResourcesService {
  private clicks = 0;
  private mana = 0;
  private maxMana = DEFAULT_MAX_MANA;
  private manaRegenPerTick = DEFAULT_MANA_REGEN_PER_TICK;

  getClicks(): number {
    return this.clicks;
  }

  addClicks(amount: number): void {
    this.clicks = Math.max(0, this.clicks + amount);
  }

  canSpend(amount: number): boolean {
    return this.clicks >= amount;
  }

  /** Retourne true si le paiement a été effectué. */
  spendClicks(amount: number, epsilon = 0.001): boolean {
    if (this.clicks < amount - epsilon) return false;
    this.clicks = Math.max(0, this.clicks - amount);
    return true;
  }

  // --- Mana (pour lancer les sorts) ---

  getMana(): number {
    return this.mana;
  }

  getMaxMana(): number {
    return this.maxMana;
  }

  setMaxMana(value: number): void {
    this.maxMana = Math.max(0, value);
    this.mana = Math.min(this.mana, this.maxMana);
  }

  /** Régénération mana par tick (10 ticks/s). Les bonus Magicien/shop sont appliqués par le game state. */
  setManaRegenPerTick(value: number): void {
    this.manaRegenPerTick = Math.max(0, value);
  }

  addMana(amount: number): void {
    this.mana = Math.min(this.maxMana, Math.max(0, this.mana + amount));
  }

  canSpendMana(amount: number): boolean {
    return this.mana >= amount;
  }

  spendMana(amount: number, epsilon = 0.001): boolean {
    if (this.mana < amount - epsilon) return false;
    this.mana = Math.max(0, this.mana - amount);
    return true;
  }

  /** Appelé chaque tick pour régénérer le mana. */
  tickManaRegen(): void {
    this.addMana(this.manaRegenPerTick);
  }

  /** Optionnel : gagner du mana en cliquant (ex: 0.5 mana par clic). */
  addManaOnClick(amount: number): void {
    this.addMana(amount);
  }
}
