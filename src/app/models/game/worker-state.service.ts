import { Injectable } from '@angular/core';
import {
  WorkerAuto,
  WorkerAutoData,
  createAutoWorker,
  createClickWorker,
  getPrice,
  getDoesAppearInGame,
  getCanBuyWorker,
  calculateClicksPerSecondForWorker,
  getClickBonus,
} from '../worker-auto-model';
import { criticalHitUnlockDefinition, CRITICAL_HIT_UPGRADES } from '../unlocks/critical-hit';
import { STREAK_UPGRADES, streakUnlockDefinition } from '../unlocks/streak';
import { sunUnlockDefinition, SUN_UPGRADES } from '../unlocks/sun-unlock';
import { powerUnlockDefinition, POWER_MANA_UPGRADES } from '../unlocks/power-unlock';
import { monsterUnlockDefinition, MONSTER_UPGRADES } from '../unlocks/monster-unlock';
import { vesselUnlockDefinition, VESSEL_UPGRADES } from '../unlocks/vessel';
import { ResourcesService } from './resources.service';
import { LoreNotificationService } from '../lore/lore-notification.service';
import { WORKER_LORE_BY_NAME } from '../lore/worker-lore';

export type GetShopMultiplierForWorker = (workerIndex: number) => number;

const UPGRADE_COOLDOWN_MS = 80;
const CLICKS_EPSILON = 0.001;

@Injectable({ providedIn: 'root' })
export class WorkerStateService {
  private workersAvailable: WorkerAutoData[] = [];
  private workers: WorkerAutoData[] = [];
  private lastUpgradedIndex = -1;
  private lastUpgradedTime = 0;

  constructor(
    private resources: ResourcesService,
    private loreNotify: LoreNotificationService
  ) {
    this.initWorkers();
  }

  getWorkersAvailable(): WorkerAutoData[] {
    return this.workersAvailable;
  }

  getWorkers(): WorkerAutoData[] {
    return this.workers;
  }

  initWorkers(): void {
    this.workersAvailable = [
      createClickWorker('Épée', 1.5, 1.05, 25, 1.10,
        "L'épée n'est plus en très bon état, il faudra trouver un moyen de la réparer de toute urgence."),
      createAutoWorker('Fermier', 5, 1.10, 125, 1.16, "Alexandre a la carrure d'un fermier du haut de son mètre quatre-vingt-douze et de ses 112 kilos. \n\n En effet, il a grandi toute sa vie dans le village de Преображение, aujourd'hui dévasté par la guerre. Je pense que c'est un homme de confiance et que l'on peut compter l'un sur l'autre. Il m'a cependant avoué avoir peur de partir de ses terres natales, mais le contexte actuel ne lui laisse plus le choix ; nous sommes poursuivis par notre propre pays pour avoir survécu à cette insurrection et par les ennemis de la Russie qui veulent tous nous éliminer. \n\n Nous continuons donc vers l'Est afin de trouver un moyen de nous réfugier. Dans sa charrette, il a planté différents types de plantes afin de survivre face à la faim ; il ne sait cependant pas cuisiner.", 1),
      createAutoWorker('Mineur', 15, 1.15, 375, 1.22, "Mikhail est très petit et n'a pas l'air très costaud. Il a cependant l'air très colérique et belliqueux ; heureusement qu'il est de notre côté. \n\n Il nous expliqua qu'avant le traité de 2045, il habitait près de Moscou, mais que son travail l'obligeait à effectuer des déplacements réguliers dans tout le nord du pays. Il n'a pas vraiment eu le choix, car suite aux décisions économiques de la Russie à cette époque, lui, sa femme et son enfant ont eu du mal à se nourrir et que le seul moyen de gagner de l'argent était de partir dans les mines du Nord. Il se trouvait donc dans l'Est du pays quand Moscou a été bombardée. \n\n Nous avons préféré ne pas en demander davantage, sachant que les rescapés de Moscou se comptent sur les doigts d'une main. Il a donc décidé de nous suivre sans nous demander notre avis. Cependant, nous ne sommes pas contre un peu de compagnie, d'autant plus qu'il a l'air de bien connaître la région.", 1, [criticalHitUnlockDefinition, ...CRITICAL_HIT_UPGRADES,]),
      createAutoWorker('Forgeron', 50, 1.20, 0, 1.27, "Anatole est un homme trapu et robuste. Il a dû rester à Дальнегорск avec son compagnon, car seules les familles avec enfants étaient prioritaires à bord des avions. Au fil des semaines, il assista aux départs de tous les autres survivants ; il ne restait plus qu'eux ici. Mais c'était la ville de leur premier amour, un amour qui leur avait apporté tant de joie, mais aussi tant de reproches. Rester dans cette ville était leur vengeance, leur seul moyen de répondre aux regards lourds de jugement et aux paroles à demi-mot. Partir aurait été céder ; rester, c'était affirmer qu'ils avaient le droit d'exister, ici comme ailleurs.\n\n Cependant, il y a quelques semaines, l'armée russe a fouillé la ville de fond en comble afin de traquer les derniers survivants. Les rues autrefois désertes se sont remplies de bruits de bottes, d'ordres aboyés et de portes enfoncées. Chaque immeuble, chaque cave, chaque recoin était inspecté sans relâche. \n\n Anatole et son compagnon s'étaient cachés dans l'obscurité, retenant leur souffle au moindre écho, vivant dans la peur constante d'être découverts. Mais on ne se cache pas éternellement d'hommes qui savent où chercher. Un matin, les soldats sont passés plus près que jamais. Les voix étaient distinctes, les pas lourds, méthodiques. Anatole a réussi à se faufiler et à se dissimuler à temps, immobile, silencieux, presque absent. Son compagnon, lui, n'eut pas cette chance. Anatole assista à toute la scène, immobile, pendant que les coups de feu mettaient fin à tout. \n\n Depuis ce jour, le silence de la ville n'a plus jamais été le même. Il décida donc de brûler cette maison si chère à leurs coeurs en signe d'adieu.", 2, [streakUnlockDefinition, ...STREAK_UPGRADES]),
      createAutoWorker('Astrologue', 500, 1.25, 12500, 1.33, undefined, 1, [sunUnlockDefinition, ...SUN_UPGRADES]),
      createAutoWorker('Magicien', 1000, 1.30, 25000, 1.39, undefined, 1, [powerUnlockDefinition, ...POWER_MANA_UPGRADES]),
      createAutoWorker('Alchimiste', 4500, 1.35, 112500, 1.45, undefined, 1, [monsterUnlockDefinition, ...MONSTER_UPGRADES]),
      createAutoWorker('Géomètre', 20000, 1.40, 500000, 1.51, undefined, 1, [vesselUnlockDefinition, ...VESSEL_UPGRADES]),
      createAutoWorker('Architecte', 100000, 1.45, 2500000, 1.57, undefined, 1),
      createAutoWorker('Explorateur', 40000000000000, 1.50, 1000000000000000, 1.63, undefined, 1),
    ];
    this.workers = [];
  }

  getWorkerLevel(workerIndex: number): number | null {
    if (workerIndex < 0 || workerIndex >= this.workersAvailable.length) return null;
    const w = this.workersAvailable[workerIndex];
    return this.workers.includes(w) ? w.level : null;
  }

  getEffectiveProductionForWorker(w: WorkerAutoData, getShopMult: GetShopMultiplierForWorker): number {
    const base = calculateClicksPerSecondForWorker(w);
    const workerIndex = this.workersAvailable.indexOf(w);
    if (workerIndex === -1) return base;
    return base * getShopMult(workerIndex);
  }

  getEffectiveClickBonusForWorker(w: WorkerAutoData, getShopMult: GetShopMultiplierForWorker): number {
    const base = getClickBonus(w);
    const workerIndex = this.workersAvailable.indexOf(w);
    if (workerIndex === -1) return base;
    return base * getShopMult(workerIndex);
  }

  calculateClicksPerSecond(getShopMult: GetShopMultiplierForWorker): number {
    return this.workers.reduce(
      (sum, w) => sum + this.getEffectiveProductionForWorker(w, getShopMult),
      0
    );
  }

  /** Production /s sans aucun bonus (shop, streak, buff). Utilisée pour les PV des monstres. */
  getBaseProductionPerSecond(): number {
    return this.workers.reduce(
      (sum, w) => sum + calculateClicksPerSecondForWorker(w),
      0
    );
  }

  getCurrentClickValue(getShopMult: GetShopMultiplierForWorker): number {
    return 1 + this.workers.reduce(
      (sum, w) => sum + this.getEffectiveClickBonusForWorker(w, getShopMult),
      0
    );
  }

  getWorkersView(clicks: number, getShopMult: GetShopMultiplierForWorker): WorkerAuto[] {
    return this.workers.map((w) => ({
      ...w,
      price: getPrice(w),
      canBuyWorker: getCanBuyWorker(w, clicks),
      doesAppearInGame: getDoesAppearInGame(w, clicks),
      effectiveProductionPerSecond: this.getEffectiveProductionForWorker(w, getShopMult),
      effectiveClickBonus: this.getEffectiveClickBonusForWorker(w, getShopMult),
    }));
  }

  getWorkersAvailableView(clicks: number, getShopMult: GetShopMultiplierForWorker): WorkerAuto[] {
    return this.workersAvailable.map((w) => ({
      ...w,
      price: getPrice(w),
      canBuyWorker: getCanBuyWorker(w, clicks),
      doesAppearInGame: getDoesAppearInGame(w, clicks),
      effectiveProductionPerSecond: this.getEffectiveProductionForWorker(w, getShopMult),
      effectiveClickBonus: this.getEffectiveClickBonusForWorker(w, getShopMult),
    }));
  }

  upgradeWorker(workerIndex: number, getShopMult: GetShopMultiplierForWorker): boolean {
    if (workerIndex < 0 || workerIndex >= this.workersAvailable.length) return false;
    const now = Date.now();
    if (
      this.lastUpgradedIndex === workerIndex &&
      now - this.lastUpgradedTime < UPGRADE_COOLDOWN_MS
    ) {
      return false;
    }
    const worker = this.workersAvailable[workerIndex];
    const firstBuy = !worker.bought;
    const priceToPay = getPrice(worker);
    if (!this.resources.spendClicks(priceToPay, CLICKS_EPSILON)) return false;
    worker.level += 1;
    worker.bought = true;
    if (!this.workers.includes(worker)) {
      this.workers.push(worker);
    }
    if (firstBuy) {
      const lore = WORKER_LORE_BY_NAME[worker.name];
      if (lore) {
        this.loreNotify.notify(lore);
      }
    }
    this.lastUpgradedIndex = workerIndex;
    this.lastUpgradedTime = now;
    return true;
  }
}
