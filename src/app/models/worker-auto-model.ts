export type WorkerType = 'auto' | 'click';

export interface WorkerAutoData {
  name: string;
  /** @deprecated Conservé pour compatibilité sauvegarde; utiliser baseProduction. */
  productivity?: number;
  level: number;
  basePrice: number;
  curvePrice: number;
  workerType: WorkerType;
  baseProduction: number;
  curveProduction: number;
  doesAppearInGame: boolean;
  bought: boolean;
}

/** Worker avec champs calculés pour la vue (price, canBuyWorker, doesAppearInGame à jour). */
export interface WorkerAuto extends WorkerAutoData {
  price: number;
  canBuyWorker: boolean;
}

/** Crée un worker de production automatique (/s). Courbe dégâts ≠ courbe prix. */
export function createAutoWorker(
  name: string,
  baseProduction: number,
  curveProduction: number,
  basePrice: number,
  curvePrice: number
): WorkerAutoData {
  return {
    name,
    level: 0,
    basePrice: Math.floor(basePrice),
    curvePrice,
    workerType: 'auto',
    baseProduction,
    curveProduction,
    doesAppearInGame: false,
    bought: false,
  };
}

/** Crée le worker unique qui augmente les dégâts par clic. */
export function createClickWorker(
  name: string,
  baseClickBonus: number,
  curveClickBonus: number,
  basePrice: number,
  curvePrice: number
): WorkerAutoData {
  return {
    name,
    level: 0,
    basePrice: Math.floor(basePrice),
    curvePrice,
    workerType: 'click',
    baseProduction: baseClickBonus,
    curveProduction: curveClickBonus,
    doesAppearInGame: false,
    bought: false,
  };
}

/** Prix du prochain niveau (courbe prix). */
export function getPrice(w: WorkerAutoData): number {
  return Math.floor(w.basePrice * Math.pow(w.curvePrice, w.level));
}

/** Valeur du worker (courbe dégâts, distincte du prix) : production/s pour auto, bonus clic pour click. */
export function getProductionOrClickBonus(w: WorkerAutoData): number {
  const base = w.baseProduction ?? (w as { productivity?: number }).productivity ?? 0;
  const curve = w.curveProduction ?? 1.1;
  return Number((base * Math.pow(curve, w.level)).toFixed(2));
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

/** Production par seconde (workers auto uniquement). */
export function calculateClicksPerSecondForWorker(w: WorkerAutoData): number {
  if (w.workerType === 'click') return 0;
  return getProductionOrClickBonus(w) * Math.pow(2, w.level < 10 ? 0 : w.level < 25 ? 1 : 2 + Math.floor((w.level - 25) / 25));
}

/** Bonus dégâts par clic (workers click uniquement). */
export function getClickBonus(w: WorkerAutoData): number {
  if (w.workerType !== 'click') return 0;
  return getProductionOrClickBonus(w);
}
