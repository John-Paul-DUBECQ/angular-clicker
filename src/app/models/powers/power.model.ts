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
  }
  
  
  /**
   * Un pouvoir apparaît si :
   * - il a un levelRequired et le niveau du worker "power" >= levelRequired, ou
   * - sinon si power.doesAppearInGame est true.
   */
  export function getPowerDoesAppearInGame(
    power: Power,
    _clicks: number,
    powerWorkerLevel?: number,
    levelRequiredForPower?: number
  ): boolean {
    if (levelRequiredForPower != null && powerWorkerLevel != null) {
      return powerWorkerLevel >= levelRequiredForPower;
    }
    return power.doesAppearInGame;
  }