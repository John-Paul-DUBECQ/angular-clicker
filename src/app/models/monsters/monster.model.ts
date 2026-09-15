/** Définition d'un type de monstre (liste + config de spawn). */
import { ResourceReward } from '../resource';
import { UnlockMethod } from '../unlocks/unlock-method';

export interface MonsterDrop extends ResourceReward {
  amount: number;
}

export interface Monster {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  doesAppearInGame: boolean;
  unlockMethod?: UnlockMethod;
  lootMultiplier?: number;

  probabilityToSpawn?: number;

  drops?: MonsterDrop[];
}
