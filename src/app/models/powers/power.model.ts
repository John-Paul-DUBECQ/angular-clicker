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
  
  
  /** IDs des pouvoirs qui n’apparaissent que si l’Alchimiste (zone mob) est débloqué. */
  const POWER_IDS_REQUIRING_MONSTER = ['spawn-mob', 'monster-time'];

  /**
   * Un pouvoir apparaît si :
   * - niveau Magicien >= levelRequired pour ce pouvoir,
   * - et si c’est un pouvoir mob (spawn-mob, monster-time), l’Alchimiste doit être débloqué.
   */
  export function getPowerDoesAppearInGame(
    power: Power,
    _clicks: number,
    powerWorkerLevel?: number,
    levelRequiredForPower?: number,
    monsterUnlocked?: boolean
  ): boolean {
    if (POWER_IDS_REQUIRING_MONSTER.includes(power.id) && !monsterUnlocked) {
      return false;
    }
    if (levelRequiredForPower != null && powerWorkerLevel != null) {
      return powerWorkerLevel >= levelRequiredForPower;
    }
    return power.doesAppearInGame;
  }