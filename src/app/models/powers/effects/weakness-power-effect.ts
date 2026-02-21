import { PowerEffect } from '../power-effect.types';

/** Id du pouvoir "약점" (baisse le montant total de combo nécessaire pour activer le buff et baisse la vitesse de redescente). */
export const WEAKNESS_POWER_ID = 'weakness';

/** Moitié des clics requis pour remplir la barre streak. */
const COMBO_MULTIPLIER = 0.5;
/** Barre streak active descend à moitié moins vite. */
const SPEED_DECREASE = 0.5;
/** Durée du buff en secondes. */
const WEAKNESS_DURATION_SECONDS = 60;

/**
 * Quand le pouvoir est activé :
 * - la streak nécessite moins de clics pour s’activer (combo × 0.5),
 * - une fois active, la barre descend moins vite (vitesse × 0.5).
 */
export const weaknessPowerEffect: PowerEffect = (context) => {
  context.setComboMultiplier(COMBO_MULTIPLIER, WEAKNESS_DURATION_SECONDS);
  context.setSpeedDecrease(SPEED_DECREASE, WEAKNESS_DURATION_SECONDS);
};
