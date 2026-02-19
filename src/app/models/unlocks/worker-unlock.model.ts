/** Définition d'un pouvoir débloqué par un worker (achat ou niveau atteint). */
export interface WorkerUnlock {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  /** Niveau du worker requis pour débloquer ; si absent, débloqué dès que le worker est acheté. */
  levelRequired?: number;
  /** Renseigné par le game state selon worker acheté et level >= levelRequired. */
  doesAppearInGame?: boolean;
}