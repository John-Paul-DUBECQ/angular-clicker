/**
 * Contexte passé à l'exécution d'un sort (power).
 * Permet aux effets d'appliquer des buffs (dégâts, streak, etc.) ou d'interagir avec le jeu.
 */
export interface PowerCastContext {
  /** Active un buff "dégâts multipliés par multiplier" pendant durationSeconds. */
  setDamageBuff(multiplier: number, durationSeconds: number): void;
  /** Pendant durationSeconds : le streak demande moins de clics pour s’activer (mult = 0.5 → moitié des clics). */
  setComboMultiplier(mult: number, durationSeconds: number): void;
  /** Pendant durationSeconds : une fois le streak actif, la barre descend moins vite (mult = 0.5 → moitié moins vite). */
  setSpeedDecrease(mult: number, durationSeconds: number): void;
}

/** Fonction d'effet d'un sort : exécutée quand le joueur lance le sort (après paiement du mana). */
export type PowerEffect = (context: PowerCastContext) => void;
