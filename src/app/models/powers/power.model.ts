import { UnlockContext, UnlockMethod } from '../unlocks/unlock-method';

export interface Power {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    doesAppearInGame: boolean;
    bought: boolean;
    manaCost: number;
    /** Durée du cooldown en secondes après chaque lancement (on ne peut pas relancer avant). */
    cooldownSeconds: number;
    /** Renseigné par la vue : true si le sort est en cooldown. */
    isOnCooldown?: boolean;
    /** Renseigné par la vue : secondes restantes avant de pouvoir relancer. */
    cooldownRemainingSeconds?: number;
    /** Coût en appâts, utilisé par les sorts qui invoquent des créatures ou vaisseaux. */
    baitCost?: number;
    /** Condition de déblocage du sort et source de son palier de niveau. */
    unlockMethod?: UnlockMethod;
  }
  
  
  export function getPowerDoesAppearInGame(
    power: Power,
    context: UnlockContext
  ): boolean {
    return power.unlockMethod?.isUnlocked(context) ?? power.doesAppearInGame;
  }