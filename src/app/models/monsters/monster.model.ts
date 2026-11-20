/** Définition d'un type de monstre (liste + config de spawn). */
import { ResourceReward } from '../resource';
import { UnlockMethod } from '../unlocks/unlock-method';
import { MonsterBiomeId } from './monster-biome.model';
import { PlannedCombatDamageMode } from './planned-combat.model';

export interface MonsterDrop extends ResourceReward {
  amount: number;
}

export interface Monster {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  biome?: MonsterBiomeId;
  doesAppearInGame: boolean;
  unlockMethod?: UnlockMethod;
  /** Restriction facultative, à configurer pour les familiers futurs. */
  damageMode?: PlannedCombatDamageMode;
  lootMultiplier?: number;

  probabilityToSpawn?: number;

  drops?: MonsterDrop[];
}
