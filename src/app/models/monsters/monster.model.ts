/** Définition d'un type de monstre (liste + config de spawn). */
import { ResourceReward } from '../resource';

export interface MonsterDrop extends ResourceReward {
  amount: number;
}

export interface Monster {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  doesAppearInGame: boolean;
  lootMultiplier?: number;
  probabilityToSpawn?: number;
  acteUnlocked?: number; // à quel acte le monstre est débloqué
  drops?: MonsterDrop[];
}
