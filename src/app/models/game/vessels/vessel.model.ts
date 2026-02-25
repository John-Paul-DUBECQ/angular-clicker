import { Monster } from '../../monsters/monster.model';

/** Type de récompense au clic sur un vaisseau. */
export type VesselRewardType = 'clicks' | 'tempBonus' | 'spawnMonster';

/** Vaisseau qui traverse l'écran (gauche → droite). Clic = récompense (or, buff temporaire, ou spawn mob). */
export interface Vessel {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  doesAppearInGame: boolean;
  /** Poids pour le tirage au sort (comme probabilityToSpawn). */
  probabilityToSpawn?: number;
  /** Vitesse de déplacement en % de la largeur par seconde (défaut 25). */
  speed?: number;
  /** Type de récompense au clic. */
  rewardType: VesselRewardType;
  /** Pour 'clicks' : montant en or (ou facteur × prod base). Pour 'tempBonus' : durée en secondes (mult x2 fixe). Pour 'spawnMonster' : ignoré (utilise probabilityToSpawnMonster). */
  rewardValue?: number;
  /** Chance 0–1 de faire apparaître un mob spécial au clic (pour rewardType 'spawnMonster'). */
  probabilityToSpawnMonster?: number;
  /** Monstre à faire spawner (optionnel, sinon spawn normal). */
  monster?: Monster | null;
  acteUnlocked?: number; // à quel acte le vaisseau est débloqué
}
  