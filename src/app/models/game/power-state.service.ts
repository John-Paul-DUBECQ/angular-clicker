import { Injectable } from '@angular/core';
import { Power, getPowerDoesAppearInGame } from '../powers/power.model';
import { PowerEffect } from '../powers/power-effect.types';
import { ResourcesService } from './resources.service';
import { listPower } from '../powers/list-power';
import { getLevelRequiredForPower } from '../unlocks/power-unlock';
import { DAMAGE_DOUBLE_POWER_ID, damageDoubleEffect } from '../powers/effects/damage-double.effect';
import { WEAKNESS_POWER_ID, weaknessPowerEffect } from '../powers/effects/weakness-power-effect';

/** Registre des effets par id de pouvoir. Un fichier par power, enregistré ici. */
const POWER_EFFECTS: Map<string, PowerEffect> = new Map([
  [DAMAGE_DOUBLE_POWER_ID, damageDoubleEffect],
  [WEAKNESS_POWER_ID, weaknessPowerEffect],
]);

@Injectable({ providedIn: 'root' })
export class PowerStateService {
  private powersAvailable: Power[] = listPower;
  private powers: Power[] = [];
  private damageBuffUntil = 0;
  private damageBuffMultiplier = 1;
  /** Buff "weakness" : moins de clics pour activer le streak, barre descend moins vite. */
  private weaknessBuffUntil = 0;
  private weaknessComboMultiplier = 1;
  private weaknessSpeedMultiplier = 1;
  /** Fin du cooldown par power.id (timestamp ms). */
  private cooldownUntilByPowerId = new Map<string, number>();

  constructor(private resources: ResourcesService) {}

  getPowersAvailable(): Power[] {
    return this.powersAvailable;
  }

  /** Liste des pouvoirs considérés comme possédés (pour le shop, etc.). Sans achat en clics, tous les pouvoirs affichés sont considérés possédés. */
  getPowers(): Power[] {
    return this.powers.length > 0 ? this.powers : this.powersAvailable;
  }

  setPowersAvailable(powers: Power[]): void {
    this.powersAvailable = powers;
  }

  getCanBuyPower(price: number): boolean {
    return this.resources.canSpend(price);
  }

  /** powerWorkerLevel : niveau du worker "power" (Magicien), pour débloquer les pouvoirs à certains niveaux. */
  getPowersAvailableView(powerWorkerLevel?: number): Power[] {
    const clicks = this.resources.getClicks();
    const now = Date.now();
    return this.powersAvailable.map((p) => {
      const until = this.cooldownUntilByPowerId.get(p.id) ?? 0;
      const onCooldown = now < until;
      const remaining = onCooldown ? Math.max(0, Math.ceil((until - now) / 1000)) : 0;
      return {
        ...p,
        doesAppearInGame: getPowerDoesAppearInGame(
          p,
          clicks,
          powerWorkerLevel,
          getLevelRequiredForPower(p.id)
        ),
        bought: true,
        isOnCooldown: onCooldown,
        cooldownRemainingSeconds: remaining,
      };
    });
  }

  buyPower(_powerIndex: number): boolean {
    return false;
  }

  /** Multiplicateur de dégâts actif (buff temporaire). 1 si aucun buff. */
  getDamageMultiplier(): number {
    if (Date.now() < this.damageBuffUntil) return this.damageBuffMultiplier;
    this.damageBuffUntil = 0;
    this.damageBuffMultiplier = 1;
    return 1;
  }

  /** Coût en mana effectif du pouvoir (peut être réduit par des items du shop plus tard). */
  getEffectiveManaCost(power: Power): number {
    return power.manaCost;
  }

  /** Lance le sort à l'index donné. effectiveManaCost si fourni (ex. après réduction shop), sinon base. */
  castPower(powerIndex: number, effectiveManaCost?: number): boolean {
    if (powerIndex < 0 || powerIndex >= this.powersAvailable.length) return false;
    const power = this.powersAvailable[powerIndex];
    if (this.isPowerOnCooldown(powerIndex)) return false;
    const effect = POWER_EFFECTS.get(power.id);
    if (!effect) return false;
    const cost = effectiveManaCost ?? this.getEffectiveManaCost(power);
    if (!this.resources.canSpendMana(cost) || !this.resources.spendMana(cost)) return false;

    const context = {
      setDamageBuff: (mult: number, durationSeconds: number) => {
        this.damageBuffUntil = Date.now() + durationSeconds * 1000;
        this.damageBuffMultiplier = mult;
      },
      setComboMultiplier: (mult: number, durationSeconds: number) => {
        this.weaknessBuffUntil = Date.now() + durationSeconds * 1000;
        this.weaknessComboMultiplier = mult;
      },
      setSpeedDecrease: (mult: number, durationSeconds: number) => {
        this.weaknessBuffUntil = Math.max(
          this.weaknessBuffUntil,
          Date.now() + durationSeconds * 1000
        );
        this.weaknessSpeedMultiplier = mult;
      },
    };
    effect(context);
    this.cooldownUntilByPowerId.set(
      power.id,
      Date.now() + (power.cooldownSeconds || 0) * 1000
    );
    return true;
  }

  /** Pour l’UI : indique si un buff de dégâts est actif. */
  isDamageBuffActive(): boolean {
    return Date.now() < this.damageBuffUntil;
  }

  /** Pour l’UI : timestamp de fin du buff (pour afficher le temps restant). */
  getDamageBuffEndTime(): number {
    return this.damageBuffUntil;
  }

  /** Multiplicateur combo streak actif (1 si pas de buff weakness). Moins de clics pour remplir la barre. */
  getWeaknessComboMultiplier(): number {
    if (Date.now() >= this.weaknessBuffUntil) {
      this.weaknessBuffUntil = 0;
      this.weaknessComboMultiplier = 1;
      this.weaknessSpeedMultiplier = 1;
      return 1;
    }
    return this.weaknessComboMultiplier;
  }

  /** Multiplicateur vitesse de descente du streak actif (1 si pas de buff). Plus petit = barre descend moins vite. */
  getWeaknessSpeedMultiplier(): number {
    if (Date.now() >= this.weaknessBuffUntil) {
      this.weaknessBuffUntil = 0;
      this.weaknessComboMultiplier = 1;
      this.weaknessSpeedMultiplier = 1;
      return 1;
    }
    return this.weaknessSpeedMultiplier;
  }

  /** Pour l’UI : le buff weakness est-il actif (barre streak jaune, etc.). */
  isWeaknessBuffActive(): boolean {
    return Date.now() < this.weaknessBuffUntil;
  }

  /** Pour l’UI / horloge : timestamp de fin du buff weakness. */
  getWeaknessBuffEndTime(): number {
    return this.weaknessBuffUntil;
  }

  getCanCastPower(powerIndex: number): boolean {
    if (powerIndex < 0 || powerIndex >= this.powersAvailable.length) return false;
    const power = this.powersAvailable[powerIndex];
    if (!POWER_EFFECTS.has(power.id)) return false;
    if (Date.now() < (this.cooldownUntilByPowerId.get(power.id) ?? 0)) return false;
    return this.resources.canSpendMana(this.getEffectiveManaCost(power));
  }

  hasPowerEffect(powerIndex: number): boolean {
    if (powerIndex < 0 || powerIndex >= this.powersAvailable.length) return false;
    return POWER_EFFECTS.has(this.powersAvailable[powerIndex].id);
  }

  isPowerOnCooldown(powerIndex: number): boolean {
    if (powerIndex < 0 || powerIndex >= this.powersAvailable.length) return false;
    const power = this.powersAvailable[powerIndex];
    return Date.now() < (this.cooldownUntilByPowerId.get(power.id) ?? 0);
  }

  getPowerManaCost(powerIndex: number): number | null {
    if (powerIndex < 0 || powerIndex >= this.powersAvailable.length) return null;
    const power = this.powersAvailable[powerIndex];
    return this.getEffectiveManaCost(power);
  }
}
