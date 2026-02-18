export interface ShopItem {
  name: string;
  description: string;
  /** URL de l’icône (ex. assets/imgUpgrades/...). Si absent, affiche un placeholder. */
  imageUrl?: string;
  price: number;
  doesAppearInGame: boolean;
  bought: boolean;
  value: number; // valeur de l'item (pour multiplier ou add)
  /** Index du worker dans workersAvailable (game-state). Si absent, item pour la production globale. */
  workerIndex?: number; // 0 étant les dégâts par clic
}


export function getDoesAppearInShop(item: ShopItem, clicks: number): boolean {
  if (item.doesAppearInGame) return true;
  const should = item.bought || clicks >= Math.floor(item.price / 2);
  if (should) item.doesAppearInGame = true;
  return should;
}