/** Définition d'un type de monstre (liste + config de spawn). */
export interface Monster {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  doesAppearInGame: boolean;
  lootMultiplier?: number;
  probabilityToSpawn?: number;
}
