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
  }
  
  
  /** IDs des pouvoirs qui n’apparaissent que si l’Alchimiste (zone mob) est débloqué. */
  const POWER_IDS_REQUIRING_MONSTER = ['spawn-mob', 'monster-time'];
  const POWER_IDS_REQUIRING_VESSELS = ['vessel-rush'];

  /**
   * Un pouvoir apparaît si :
   * - niveau Magicien >= levelRequired pour ce pouvoir,
   * - les sorts mob nécessitent l’Alchimiste; Rafale stellaire nécessite les vaisseaux.
   */
  export function getPowerDoesAppearInGame(
    power: Power,
    _clicks: number,
    powerWorkerLevel?: number,
    levelRequiredForPower?: number,
    monsterUnlocked?: boolean,
    vesselsUnlocked?: boolean
  ): boolean {
    if (POWER_IDS_REQUIRING_MONSTER.includes(power.id) && !monsterUnlocked) {
      return false;
    }
    if (POWER_IDS_REQUIRING_VESSELS.includes(power.id) && !vesselsUnlocked) {
      return false;
    }
    if (levelRequiredForPower != null && powerWorkerLevel != null) {
      return powerWorkerLevel >= levelRequiredForPower;
    }
    return power.doesAppearInGame;
  }