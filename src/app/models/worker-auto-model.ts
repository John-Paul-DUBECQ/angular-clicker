/** Données persistées d’un worker (sauvegarde / chargement). */
export interface WorkerAutoData {
  name: string;
  productivity: number;
  level: number;
  basePrice: number;
  curvePrice: number;
  doesAppearInGame: boolean;
  bought: boolean;
}

/** Worker avec champs calculés pour la vue (price, canBuyWorker, doesAppearInGame à jour). */
export interface WorkerAuto extends WorkerAutoData {
  price: number;
  canBuyWorker: boolean;
}

export function createWorker(
  name: string,
  productivity: number,
  basePrice: number,
  curvePrice: number
): WorkerAutoData {
  return {
    name,
    productivity,
    level: 0,
    basePrice: Math.floor(basePrice),
    curvePrice,
    doesAppearInGame: false,
    bought: false,
  };
}

export function getPrice(w: WorkerAutoData): number {
  return Math.floor(w.basePrice * Math.pow(w.curvePrice, w.level));
}

export function getDoesAppearInGame(w: WorkerAutoData, clicks: number): boolean {
  if (w.doesAppearInGame) return true;
  const should = w.bought || clicks >= Math.floor(w.basePrice / 2);
  if (should) w.doesAppearInGame = true;
  return should;
}

export function getCanBuyWorker(w: WorkerAutoData, clicks: number): boolean {
  return clicks >= getPrice(w);
}

export function calculateClicksPerSecondForWorker(w: WorkerAutoData): number {
  return Number((w.productivity * w.level * (1 + (w.level - 1) * 0.1)).toFixed(2));
}
