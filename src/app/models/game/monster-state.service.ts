import { Injectable } from '@angular/core';
import { WorkerAutoData } from '../worker-auto-model';
import { Monster } from '../monsters/monster.model';
import { listMonster } from '../monsters/list-monster';
import { isMonsterUnlocked, getLevelRequiredForMonster, MONSTER_WORKER_INDEX } from '../unlocks/monster-unlock';
import { ResourcesService } from './resources.service';
import { WorkerStateService } from './worker-state.service';
import { MonsterRewardNotificationService } from './monster-reward-notification.service';

/** Référence PV : baseProduction * ce multiplicateur (aléatoire autour). */
const MONSTER_HP_BASE_SECONDS = 12;
/** Borne min/max du multiplicateur de PV (ex. 1.5 à 3.2 = combats très durs possibles). */
const MONSTER_HP_MULT_MIN = 1.5;
const MONSTER_HP_MULT_MAX = 3.2;
/** Temps imparti : aléatoire entre ces deux valeurs (secondes). */
const MONSTER_TIME_LIMIT_MIN_SECONDS = 18;
const MONSTER_TIME_LIMIT_MAX_SECONDS = 42;
/** 1 chance sur BOSS_CHANCE = spawn "DANGER BOSS" (plus dur). */
const BOSS_CHANCE = 10;
/** Boss : PV et temps plus extrêmes. */
const BOSS_HP_MULT_MIN = 2.2;
const BOSS_HP_MULT_MAX = 3.5;
const BOSS_TIME_MIN_SECONDS = 15;
const BOSS_TIME_MAX_SECONDS = 28;
/** Récompense or de base (secondes de prod) ; scale avec difficulté de l’encounter. */
const MONSTER_KILL_REWARD_BASE_SECONDS = 45;
/** Base essence ; scale avec difficulté (temps restant + dureté encounter). */
const MONSTER_ESSENCE_BASE = 1;
const ENCOUNTER_FILL_SECONDS = 70;
const TICKS_PER_SECOND = 10;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export interface CurrentMonsterView {
  monsterId: string;
  name: string;
  imageUrl?: string;
  currentHp: number;
  maxHp: number;
  timeLimitSeconds: number;
  remainingSeconds: number;
  /** True si spawn "DANGER BOSS" (1/10, combat plus dur). */
  isBoss?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MonsterStateService {
  private currentMonsterId: string | null = null;
  private currentHp = 0;
  private maxHp = 0;
  private spawnTime = 0;
  /** Temps imparti pour ce combat (ms) — aléatoire à chaque spawn. */
  private timeLimitMs = 30000;
  /** Temps imparti en secondes (pour la vue). */
  private timeLimitSeconds = 30;
  /** True si ce combat est un "DANGER BOSS" (1/10). */
  private isBoss = false;
  /** Jauge de rencontre (0–100). Quand elle atteint 100 %, un monstre spawn. */
  private encounterMeter = 0;

  constructor(
    private resources: ResourcesService,
    private workerState: WorkerStateService,
    private rewardNotify: MonsterRewardNotificationService
  ) {}

  /** True si la zone monstre est débloquée (Alchimiste niveau requis). */
  isMonsterUnlocked(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): boolean {
    return isMonsterUnlocked(workers, workersAvailable);
  }

  /** Spawn un monstre : tiré selon probabilityToSpawn ; difficulté (PV) et récompenses scale avec lootMultiplier. 1/10 = "DANGER BOSS" en plus. */
  private spawnMonsterInternal(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): void {
    if (!this.isMonsterUnlocked(workers, workersAvailable)) return;

    const monsterLevel = workersAvailable[MONSTER_WORKER_INDEX]?.level ?? 0;
    const monster = this.pickMonsterForLevel(monsterLevel);
    if (!monster) return;

    const lootMult = Math.max(0.1, monster.lootMultiplier ?? 1);
    this.isBoss = Math.random() < 1 / BOSS_CHANCE;
    const baseProduction = this.workerState.getBaseProductionPerSecond();

    const hpMult = this.isBoss
      ? randomBetween(BOSS_HP_MULT_MIN, BOSS_HP_MULT_MAX)
      : randomBetween(MONSTER_HP_MULT_MIN, MONSTER_HP_MULT_MAX);
    const hpBase = baseProduction * MONSTER_HP_BASE_SECONDS * hpMult * lootMult;
    this.maxHp = Math.max(1, Math.floor(hpBase));
    this.currentHp = this.maxHp;

    this.timeLimitSeconds = this.isBoss
      ? Math.floor(randomBetween(BOSS_TIME_MIN_SECONDS, BOSS_TIME_MAX_SECONDS))
      : Math.floor(randomBetween(MONSTER_TIME_LIMIT_MIN_SECONDS, MONSTER_TIME_LIMIT_MAX_SECONDS));
    this.timeLimitMs = this.timeLimitSeconds * 1000;
    this.currentMonsterId = monster.id;
    this.spawnTime = Date.now();
  }

  /** Tire un monstre parmi ceux débloqués pour ce niveau, pondéré par probabilityToSpawn (ex. 100 vs 1 → ~100 Mosh, ~1 Super-Mosh sur 101 spawns). */
  private pickMonsterForLevel(workerLevel: number): Monster | null {
    const eligible = listMonster.filter((m) => {
      const required = getLevelRequiredForMonster(m.id);
      return required != null && workerLevel >= required;
    });
    if (eligible.length === 0) return null;
    if (eligible.length === 1) return eligible[0];
    const totalWeight = eligible.reduce((s, m) => s + (m.probabilityToSpawn ?? 1), 0);
    let r = Math.random() * totalWeight;
    for (const m of eligible) {
      const w = m.probabilityToSpawn ?? 1;
      if (r < w) return m;
      r -= w;
    }
    return eligible[eligible.length - 1];
  }

  /** Inflige des dégâts au monstre. Retourne true si le monstre est mort. */
  dealDamage(amount: number, workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): boolean {
    if (this.currentMonsterId == null) return false;
    this.currentHp = Math.max(0, this.currentHp - amount);
    if (this.currentHp <= 0) {
      const remainingMs = this.spawnTime + this.timeLimitMs - Date.now();
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
      this.onMonsterKill(remainingSeconds);
      this.currentMonsterId = null;
      this.encounterMeter = 0;
      return true;
    }
    return false;
  }

  /**
   * Récompense : or + essence + 50 % des gains équivalents ; tout scale avec lootMultiplier du monstre.
   */
  private onMonsterKill(remainingSeconds: number): void {
    const monster = listMonster.find((m) => m.id === this.currentMonsterId);
    const lootMult = Math.max(0.1, monster?.lootMultiplier ?? 1);

    const baseProduction = this.workerState.getBaseProductionPerSecond();
    const timeLimitSec = this.timeLimitMs / 1000;
    const difficultyTime = 1 + 2 * (1 - remainingSeconds / timeLimitSec);

    const encounterDifficulty = this.maxHp / Math.max(1, baseProduction * MONSTER_HP_BASE_SECONDS);
    const goldBase = baseProduction * MONSTER_KILL_REWARD_BASE_SECONDS;
    const goldReward = Math.max(1, Math.floor(goldBase * (0.7 + 0.3 * Math.min(encounterDifficulty, 3)) * lootMult));
    const gainsCompensation = Math.floor(0.5 * this.maxHp * lootMult);
    const totalGold = goldReward + gainsCompensation;
    this.resources.addClicks(totalGold);

    const essenceBase = MONSTER_ESSENCE_BASE * Math.min(encounterDifficulty / 2, 2) * lootMult;
    const essenceReward = Math.max(0, Math.floor(essenceBase * difficultyTime));
    this.resources.addMonsterEssence(essenceReward);

    this.rewardNotify.notifyReward(totalGold, essenceReward);
  }

  /** Tick : si monstre en cours → timeout ; sinon remplir la jauge rencontre et spawn à 100 %. */
  tick(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): void {
    if (this.currentMonsterId != null) {
      const remaining = this.spawnTime + this.timeLimitMs - Date.now();
      if (remaining <= 0) {
        this.currentMonsterId = null;
        this.encounterMeter = 0;
      }
      return;
    }
    if (!this.isMonsterUnlocked(workers, workersAvailable)) return;
    this.encounterMeter = Math.min(100, this.encounterMeter + 100 / (ENCOUNTER_FILL_SECONDS * TICKS_PER_SECOND));
    if (this.encounterMeter >= 100) {
      this.encounterMeter = 0;
      this.spawnMonsterInternal(workers, workersAvailable);
    }
  }

  /** Force le spawn du prochain mob (tue l’actuel sans récompense et en fait apparaître un nouveau). */
  forceSpawnNext(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): void {
    this.currentMonsterId = null;
    this.encounterMeter = 100;
    this.tick(workers, workersAvailable);
  }

  /** Ajoute des secondes au temps imparti du combat en cours. */
  addTimeToCurrentMonster(seconds: number): void {
    if (this.currentMonsterId == null) return;
    this.timeLimitMs += seconds * 1000;
  }

  /** Vue du monstre actuel pour l’UI (ou null). */
  getEncounterMeterPercent(): number {
    if (this.currentMonsterId != null) return 100;
    return Math.min(100, Math.max(0, this.encounterMeter));
  }

  getCurrentMonsterView(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): CurrentMonsterView | null {
    if (this.currentMonsterId == null) return null;
    const monster = listMonster.find((m) => m.id === this.currentMonsterId);
    if (!monster) return null;
    const remaining = Math.max(0, this.spawnTime + this.timeLimitMs - Date.now());
    return {
      monsterId: monster.id,
      name: monster.name,
      imageUrl: monster.imageUrl,
      currentHp: this.currentHp,
      maxHp: this.maxHp,
      timeLimitSeconds: this.timeLimitSeconds,
      remainingSeconds: Math.ceil(remaining / 1000),
      isBoss: this.isBoss,
    };
  }

  hasCurrentMonster(): boolean {
    return this.currentMonsterId != null;
  }
}

