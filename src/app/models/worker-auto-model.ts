import { WorkerUnlock } from './unlocks/worker-unlock.model';

export type WorkerType = 'auto' | 'click';

export interface WorkerAutoData {
  name: string;
  description?: string;
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
  /** Pouvoirs débloqués par ce worker (achat ou niveau). */
  unlocks: WorkerUnlock[];
  acteUnlocked?: number; // à quel acte le worker est débloqué
  /** Index du worker précédent requis et son niveau minimum pour débloquer celui-ci. Ex: {workerIndex: 3, minLevel: 5} */
  requirePreviousWorker?: { workerIndex: number; minLevel: number };
}

/** Worker avec champs calculés pour la vue (price, canBuyWorker, valeurs effectives après bonus shop). */
export interface WorkerAuto extends WorkerAutoData {
  price: number;
  canBuyWorker: boolean;
  /** Production /s effective (auto) après multiplicateurs shop. Renseigné par le game state. */
  effectiveProductionPerSecond?: number;
  /** Bonus dégâts/clic effectif (click) après multiplicateurs shop. Renseigné par le game state. */
  effectiveClickBonus?: number;
}

/** Crée un worker de production automatique (/s). Courbe dégâts ≠ courbe prix. */
export function createAutoWorker(
  name: string,
  baseProduction: number,
  curveProduction: number,
  basePrice: number,
  curvePrice: number,
  description?: string,
  acteUnlocked?: number,
  unlocks: WorkerUnlock[] = [],
  requirePreviousWorker?: { workerIndex: number; minLevel: number }
): WorkerAutoData {
  return {
    name,
    level: 0,
    basePrice: Math.floor(basePrice),
    curvePrice,
    workerType: 'auto',
    description,
    baseProduction,
    curveProduction,
    doesAppearInGame: false,
    bought: false,
    unlocks,
    acteUnlocked: acteUnlocked ?? 1,
    requirePreviousWorker,
  };
}

/** Crée le worker unique qui augmente les dégâts par clic. */
export function createClickWorker(
  name: string,
  baseClickBonus: number,
  curveClickBonus: number,
  basePrice: number,
  curvePrice: number,
  description?: string,
  unlocks: WorkerUnlock[] = [],
  requirePreviousWorker?: { workerIndex: number; minLevel: number }
): WorkerAutoData {
  return {
    name,
    level: 0,
    basePrice: Math.floor(basePrice),
    curvePrice,
    workerType: 'click',
    description,
    baseProduction: baseClickBonus,
    curveProduction: curveClickBonus,
    doesAppearInGame: false,
    bought: false,
    unlocks,
    requirePreviousWorker,
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
  return base * Math.pow(curve, w.level);
}

export function getDoesAppearInGame(w: WorkerAutoData, clicks: number): boolean {
  if (w.doesAppearInGame) return true;
  const should = w.bought || clicks >= Math.floor(w.basePrice / 2);
  if (should) w.doesAppearInGame = true;
  return should;
}

/** Vérifie si un worker doit apparaître (basé sur les clics, pas les dépendances). */
export function getDoesAppearInGameWithDependencies(
  w: WorkerAutoData,
  clicks: number,
  workersAvailable: WorkerAutoData[]
): boolean {
  // Affiche le worker s'il a assez de clics ou a été acheté
  return getDoesAppearInGame(w, clicks);
}

/** Obtient le texte du bouton d'achat d'un worker (prix + condition si nécessaire). */
export function getWorkerBuyButtonText(
  w: WorkerAutoData,
  clicks: number,
  workersAvailable: WorkerAutoData[]
): string {
  const price = getPrice(w);
  const priceText = `Upgrade : ${price}`;
  
  // Vérifie la dépendance si elle existe
  if (w.requirePreviousWorker) {
    const { workerIndex, minLevel } = w.requirePreviousWorker;
    if (workerIndex >= 0 && workerIndex < workersAvailable.length) {
      const previousWorker = workersAvailable[workerIndex];
      if (previousWorker.level < minLevel) {
        return `${priceText} + ${previousWorker.name} lvl ${minLevel}`;
      }
    }
  }
  
  return priceText;
}

export function getCanBuyWorker(w: WorkerAutoData, clicks: number): boolean {
  return clicks >= getPrice(w);
}

/** Vérifie si un worker peut être acheté en tenant compte des dépendances. */
export function getCanBuyWorkerWithDependencies(
  w: WorkerAutoData,
  clicks: number,
  workersAvailable: WorkerAutoData[]
): boolean {
  // Vérifie les clics d'abord
  if (clicks < getPrice(w)) {
    return false;
  }
  
  // Vérifie la dépendance si elle existe
  if (w.requirePreviousWorker) {
    const { workerIndex, minLevel } = w.requirePreviousWorker;
    if (workerIndex < 0 || workerIndex >= workersAvailable.length) {
      return false;
    }
    const previousWorker = workersAvailable[workerIndex];
    return previousWorker.level >= minLevel;
  }
  
  return true;
}

/** Exposant du multiplicateur x2 par palier (niveau 10, 25, puis tous les 25). */
function getTierExponent(level: number): number {
  return level < 10 ? 0 : level < 25 ? 1 : 2 + Math.floor((level - 25) / 25);
}

/** Production par seconde (workers auto uniquement). */
export function calculateClicksPerSecondForWorker(w: WorkerAutoData): number {
  if (w.workerType === 'click') return 0;
  return getProductionOrClickBonus(w) * Math.pow(2, getTierExponent(w.level));
}

/** Bonus dégâts par clic (workers click uniquement), avec le même palier tous les 25 que la prod auto. */
export function getClickBonus(w: WorkerAutoData): number {
  if (w.workerType !== 'click') return 0;
  return getProductionOrClickBonus(w) * Math.pow(2, getTierExponent(w.level))*0.75;
}
