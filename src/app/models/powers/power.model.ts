export interface Power {
    name: string;
    description: string;
    imageUrl?: string;
    price: number;
    doesAppearInGame: boolean;
    bought: boolean;
  }
  
  
  export function getPowerDoesAppearInGame(power: Power, clicks: number): boolean {
    if (power.doesAppearInGame) return true;
    const should = power.bought || clicks >= Math.floor(power.price / 2);
    if (should) power.doesAppearInGame = true;
    return should;
  }