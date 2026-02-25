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

export type GetShopMultiplierForWorker = (workerIndex: number) => number;

const UPGRADE_COOLDOWN_MS = 80;
const CLICKS_EPSILON = 0.001;

@Injectable({ providedIn: 'root' })
export class WorkerStateService {
  private workersAvailable: WorkerAutoData[] = [];
  private workers: WorkerAutoData[] = [];
  private lastUpgradedIndex = -1;
  private lastUpgradedTime = 0;

  constructor(private resources: ResourcesService) {
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
         'Après vous être rendu compte que Vladivostok était dévastée suite à la catastrophe, vous décidez de partir vers l\'Est à la recherche d\'un bateau afin d\'aller au Japon et rejondre votre village natal. C\'est dans le village de Козьмино que vous trouvez cette épée, on ne sait pas encore à quel point elle va être utile mais il vaut mieux la prendre dans le doute.'),
      createAutoWorker('Fermier', 5, 1.10, 125, 1.16, 'En continuant de marcher le long de la côte, aux abords de Преображение, vous faites la rencontre d\'un fermier. Vous êtes suspicieux mais il a l\'air d\'être un homme de confiance. Pour survivre, il a décidé de se déplacer avec une charette dans laquelle il a planté différent types de plantes afin de survivre contre la faim. Ne sachant pas contre quel danger nous pourrions tomber, nous avons donc décidé de faire route ensemble. Il s\'appelait Александр (Alexandre).', 1),
      createAutoWorker('Mineur', 15, 1.15, 375, 1.22, 'Afin de trouver des ressources pouvant être utile dans notre exploration, nous avons décidé de faire un détour dans la ville de Милоградово. La ville semblait calme et inhabitée aux premiers abords, jusqu\'à ce qu\'on entende un bruit ressemblant à celui d\'une radio à l\'intérieur. On décide donc de rentrer dans cette maison afin de pouvoir contacter d\'autres survivants, or, en rentrant, quelle fut notre surprise de trouver un humain devant cette machine de radio. Il fit tout aussi surpris que nous et a failli nous transpercer à coup de pioche mais il a très vite vu que nous n\'étions pas un danger. Il nous explique donc qu\'il reçoit un message radio de Tokyo, disant en anglais que Tokyo est sauve. L\'inconnu nous disait donc qu\'il avait reçu de la même manière un message de Busan disant qu\'il était impossible d\'aller au Japon via l\'Ouest en passant par l\'île de Jeju, celle-ci étant infectée de monstres. Nous décidâmes donc de continuer notre chemin tous les trois vers le Nord et de passer par Сахалин pour arriver au Japon par Hokkaido, c\'était un long voyage à faire mais si la liberté était de l\'autre côté, c\'était la seule solution.', 1, [criticalHitUnlockDefinition,...CRITICAL_HIT_UPGRADES,]),
      createAutoWorker('Forgeron', 50, 1.20, 1250, 1.27, 'Production automatique de ' + 50 + ' /s.', 2, [streakUnlockDefinition, ...STREAK_UPGRADES]),
      createAutoWorker('Astrologue', 500, 1.25, 12500, 1.33, 'Production automatique de ' + 500 + ' /s.', 1, [sunUnlockDefinition, ...SUN_UPGRADES]),
      createAutoWorker('Magicien', 1000, 1.30, 25000, 1.39, 'Production automatique de ' + 1000 + ' /s.', 1, [powerUnlockDefinition, ...POWER_MANA_UPGRADES]),
      createAutoWorker('Alchimiste', 4500, 1.35, 112500, 1.45, 'Production automatique de ' + 4500 + ' /s.', 1, [monsterUnlockDefinition, ...MONSTER_UPGRADES]),
      createAutoWorker('Géomètre', 20000, 1.40, 500000, 1.51, 'Production automatique de ' + 20000 + ' /s.', 1, [vesselUnlockDefinition, ...VESSEL_UPGRADES]),
      createAutoWorker('Architecte', 100000, 1.45, 2500000, 1.57, 'Production automatique de ' + 100000 + ' /s.', 1),
      createAutoWorker('Explorateur', 40000000000000, 1.50, 1000000000000000, 1.63, 'Production automatique de ' + 40000000000000 + ' /s.', 1),
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
    const priceToPay = getPrice(worker);
    if (!this.resources.spendClicks(priceToPay, CLICKS_EPSILON)) return false;
    worker.level += 1;
    worker.bought = true;
    if (!this.workers.includes(worker)) {
      this.workers.push(worker);
    }
    this.lastUpgradedIndex = workerIndex;
    this.lastUpgradedTime = now;
    return true;
  }
}
