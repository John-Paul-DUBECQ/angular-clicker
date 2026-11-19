import { Injectable, Optional } from '@angular/core';
import { WorkerAutoData } from '../worker-auto-model';
import { Monster } from '../monsters/monster.model';
import { listMonster } from '../monsters/list-monster';
import { isMonsterUnlocked, MONSTER_WORKER_INDEX } from '../unlocks/monster-unlock';
import { UnlockContext } from '../unlocks/unlock-method';
import { ResourcesService } from './resources.service';
import { WorkerStateService } from './worker-state.service';
import { MonsterRewardNotificationService } from './monster-reward-notification.service';
import { EssenceShopStateService } from './essence-shop-state.service';
import { ResourceReward } from '../resource';
import { listPlannedCombat } from '../monsters/list-planned-combat';
import { PlannedCombat, PlannedCombatEnemy, PlannedCombatView } from '../monsters/planned-combat.model';
import { isMonsterBiomeId, MONSTER_BIOMES, MonsterBiomeId } from '../monsters/monster-biome.model';
import { EXPLORER_WORKER_INDEX, isExplorerUnlocked } from '../unlocks/explorer-unlock';
import { UnlockUpgradeService } from './unlock-upgrade.service';

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
  plannedCombatEnemyNumber?: number;
  plannedCombatEnemyCount?: number;
  /** True si spawn "DANGER BOSS" (1/10, combat plus dur). */
  isBoss?: boolean;
  isPlannedCombat?: boolean;
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
  /** Nombre de monstres demandés alors qu'un combat est déjà en cours. */
  private queuedMonsterCount = 0;
  private killCounts: Record<string, number> = {};
  private plannedCombatWins: Record<string, number> = {};
  private plannedCombatCooldownEnds: Record<string, number> = {};
  private currentPlannedCombatId: string | null = null;
  private currentPlannedCombatEnemyIndex = 0;
  private selectedBiome: MonsterBiomeId = 'forest';

  constructor(
    private resources: ResourcesService,
    private workerState: WorkerStateService,
    private rewardNotify: MonsterRewardNotificationService,
    private essenceShopState: EssenceShopStateService,
    @Optional() private unlockUpgrades?: UnlockUpgradeService
  ) {}

  /** True si la zone monstre est débloquée (Alchimiste niveau requis). */
  isMonsterUnlocked(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): boolean {
    return isMonsterUnlocked(workers, workersAvailable);
  }

  /** Spawn un monstre : tiré selon probabilityToSpawn ; difficulté (PV) et récompenses scale avec lootMultiplier. 1/10 = "DANGER BOSS" en plus. */
  private spawnMonsterInternal(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): void {
    if (!this.isMonsterUnlocked(workers, workersAvailable)) return;

    const monsterLevel = workersAvailable[MONSTER_WORKER_INDEX]?.level ?? 0;
    const monster = this.pickMonsterForLevel(monsterLevel, this.selectedBiome, workers, workersAvailable);
    if (!monster) return;

    const lootMult = Math.max(0.1, monster.lootMultiplier ?? 1);
    this.isBoss = Math.random() < 1 / BOSS_CHANCE;
    const baseProduction = this.workerState.getBaseProductionPerSecond();

    const shopStats = this.essenceShopState.getStats();
    const hpMult = (this.isBoss
      ? randomBetween(BOSS_HP_MULT_MIN, BOSS_HP_MULT_MAX)
      : randomBetween(MONSTER_HP_MULT_MIN, MONSTER_HP_MULT_MAX)) * shopStats.hp;
    const hpBase = baseProduction * MONSTER_HP_BASE_SECONDS * hpMult * lootMult;
    this.maxHp = Math.max(1, Math.floor(hpBase));
    this.currentHp = this.maxHp;

    const baseTimeLimit = this.isBoss
      ? Math.floor(randomBetween(BOSS_TIME_MIN_SECONDS, BOSS_TIME_MAX_SECONDS))
      : Math.floor(randomBetween(MONSTER_TIME_LIMIT_MIN_SECONDS, MONSTER_TIME_LIMIT_MAX_SECONDS));
    this.timeLimitSeconds = Math.max(1, Math.floor(baseTimeLimit * shopStats.time));
    this.timeLimitMs = this.timeLimitSeconds * 1000;
    this.currentMonsterId = monster.id;
    this.spawnTime = Date.now();
  }

  getPlannedCombats(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): PlannedCombatView[] {
    return listPlannedCombat.map((combat) => ({
      ...combat,
      totalHp: combat.enemies.reduce((total, enemy) => total + enemy.maxHp, 0),
      unlocked: isExplorerUnlocked(workers, workersAvailable)
        && this.isBiomeUnlocked(combat.biome)
        && this.isPlannedCombatUnlocked(combat, workers, workersAvailable),
      wins: this.plannedCombatWins[combat.id] ?? 0,
      cooldownRemainingSeconds: Math.max(
        0,
        Math.ceil(((this.plannedCombatCooldownEnds[combat.id] ?? 0) - Date.now()) / 1000)
      ),
    }));
  }

  startPlannedCombat(id: string, workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): boolean {
    if (this.currentMonsterId != null) return false;
    const combat = listPlannedCombat.find((entry) => entry.id === id);
    if (
      !combat
      || combat.enemies.length === 0
      || !isExplorerUnlocked(workers, workersAvailable)
      || combat.biome !== this.selectedBiome
      || !this.isBiomeUnlocked(combat.biome)
      || !this.isPlannedCombatUnlocked(combat, workers, workersAvailable)
    ) return false;
    if ((this.plannedCombatCooldownEnds[combat.id] ?? 0) > Date.now()) return false;

    this.currentPlannedCombatId = combat.id;
    this.currentPlannedCombatEnemyIndex = 0;
    this.currentMonsterId = combat.id;
    this.maxHp = combat.enemies[0].maxHp;
    this.currentHp = this.maxHp;
    this.timeLimitSeconds = combat.timeLimitSeconds;
    this.timeLimitMs = combat.timeLimitSeconds * 1000;
    this.isBoss = true;
    this.spawnTime = Date.now();
    return true;
  }

  usePlannedCombatBait(
    id: string,
    workers: WorkerAutoData[],
    workersAvailable: WorkerAutoData[]
  ): boolean {
    const combat = listPlannedCombat.find((entry) => entry.id === id);
    const baitEncounter = combat?.baitEncounter;
    if (
      !combat
      || !baitEncounter
      || this.currentMonsterId != null
      || combat.biome !== this.selectedBiome
      || !this.isBiomeUnlocked(combat.biome)
      || !isExplorerUnlocked(workers, workersAvailable)
      || !this.isPlannedCombatUnlocked(combat, workers, workersAvailable)
      || (this.plannedCombatWins[id] ?? 0) < baitEncounter.unlockWins
      || (this.plannedCombatCooldownEnds[id] ?? 0) > Date.now()
      || !this.resources.spendResources([{ resourceId: 'bait', amount: baitEncounter.baitCost }])
    ) {
      return false;
    }

    baitEncounter.rewards.forEach((reward) => this.resources.addResource(reward.resourceId, reward.amount));
    this.plannedCombatCooldownEnds[id] = Date.now() + combat.cooldownSeconds * 1000;
    this.rewardNotify.notifyReward(0, 0, baitEncounter.rewards);
    return true;
  }

  cancelPlannedCombat(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[]): boolean {
    if (this.currentPlannedCombatId == null) return false;

    this.currentMonsterId = null;
    this.currentPlannedCombatId = null;
    this.currentPlannedCombatEnemyIndex = 0;
    this.currentHp = 0;
    this.maxHp = 0;
    this.isBoss = false;

    if (!this.spawnQueuedMonster(workers, workersAvailable)) this.encounterMeter = 0;
    return true;
  }

  isBiomeUnlocked(biome: MonsterBiomeId): boolean {
    const definition = MONSTER_BIOMES.find((entry) => entry.id === biome);
    return !!definition && (
      definition.unlockAfterCombatId == null
      || (this.plannedCombatWins[definition.unlockAfterCombatId] ?? 0) > 0
    );
  }

  getUnlockedBiomes(): Record<MonsterBiomeId, boolean> {
    return {
      forest: this.isBiomeUnlocked('forest'),
      beach: this.isBiomeUnlocked('beach'),
      mine: this.isBiomeUnlocked('mine'),
    };
  }

  private isPlannedCombatUnlocked(
    combat: PlannedCombat,
    workers: WorkerAutoData[],
    workersAvailable: WorkerAutoData[]
  ): boolean {
    const context: UnlockContext = {
      clicks: 0,
      getWorkerLevel: (workerIndex) => workersAvailable[workerIndex]?.level ?? workers[workerIndex]?.level ?? null,
      getPlannedCombatWins: (combatId) => this.plannedCombatWins[combatId] ?? 0,
    };
    return combat.unlockMethod?.isUnlocked(context) ?? true;
  }

  /** Tire un monstre parmi ceux débloqués, pondéré par probabilityToSpawn. */
  private pickMonsterForLevel(
    workerLevel: number,
    biome: MonsterBiomeId,
    workers: WorkerAutoData[],
    workersAvailable: WorkerAutoData[]
  ): Monster | null {
    const explorer = workersAvailable[EXPLORER_WORKER_INDEX];
    const explorerLevel = explorer && workers.includes(explorer) ? explorer.level : 0;
    const context: UnlockContext = {
      clicks: 0,
      getWorkerLevel: (workerIndex) => {
        if (workerIndex === MONSTER_WORKER_INDEX) return workerLevel;
        if (workerIndex === EXPLORER_WORKER_INDEX) return explorerLevel;
        return null;
      },
    };
    const eligible = listMonster.filter((m) => {
      return (m.biome ?? 'forest') === biome && (m.unlockMethod?.isUnlocked(context) ?? false);
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
  dealDamage(
    amount: number,
    workers: WorkerAutoData[],
    workersAvailable: WorkerAutoData[],
    source: 'click' | 'afk' = 'click'
  ): boolean {
    if (this.currentMonsterId == null) return false;
    if (this.currentPlannedCombatId != null) {
      const combat = listPlannedCombat.find((entry) => entry.id === this.currentPlannedCombatId);
      const damageMode = combat?.damageMode ?? 'any';
      if (damageMode !== 'any' && damageMode !== source) return false;
    }
    this.currentHp = Math.max(0, this.currentHp - amount);
    if (this.currentHp <= 0) {
      if (this.advanceToNextPlannedCombatEnemy()) return true;

      const remainingMs = this.spawnTime + this.timeLimitMs - Date.now();
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
      this.onMonsterKill(remainingSeconds);
      this.currentMonsterId = null;
      this.currentPlannedCombatId = null;
      this.currentPlannedCombatEnemyIndex = 0;
      if (!this.spawnQueuedMonster(workers, workersAvailable)) this.encounterMeter = 0;
      return true;
    }
    return false;
  }

  private advanceToNextPlannedCombatEnemy(): boolean {
    if (this.currentPlannedCombatId == null) return false;
    const combat = listPlannedCombat.find((entry) => entry.id === this.currentPlannedCombatId);
    if (!combat) return false;

    const nextIndex = this.currentPlannedCombatEnemyIndex + 1;
    const nextEnemy = combat.enemies[nextIndex];
    if (!nextEnemy) return false;

    this.currentPlannedCombatEnemyIndex = nextIndex;
    this.maxHp = nextEnemy.maxHp;
    this.currentHp = nextEnemy.maxHp;
    return true;
  }

  /**
   * Récompense : or + essence + 50 % des gains équivalents ; tout scale avec lootMultiplier du monstre.
   */
  private onMonsterKill(remainingSeconds: number): void {
    if (this.currentPlannedCombatId != null) {
      this.onPlannedCombatKill(this.currentPlannedCombatId);
      return;
    }
    const monster = listMonster.find((m) => m.id === this.currentMonsterId);
    if (this.currentMonsterId != null) {
      this.killCounts[this.currentMonsterId] = (this.killCounts[this.currentMonsterId] ?? 0) + 1;
    }
    const lootMult = Math.max(0.1, monster?.lootMultiplier ?? 1);

    const baseProduction = this.workerState.getBaseProductionPerSecond();
    const timeLimitSec = this.timeLimitMs / 1000;
    const difficultyTime = 1 + 2 * (1 - remainingSeconds / timeLimitSec);

    const encounterDifficulty = this.maxHp / Math.max(1, baseProduction * MONSTER_HP_BASE_SECONDS);
    const goldBase = baseProduction * MONSTER_KILL_REWARD_BASE_SECONDS;
    const goldMultiplier = 1 + (this.unlockUpgrades?.getBonus('monster', 'gold') ?? 0);
    const goldReward = Math.max(1, Math.floor(
      goldBase * (0.7 + 0.3 * Math.min(encounterDifficulty, 3)) * lootMult * goldMultiplier
    ));
    const gainsCompensation = Math.floor(0.5 * this.maxHp * lootMult);
    const totalGold = goldReward + gainsCompensation;
    this.resources.addClicks(totalGold);

    const essenceBase = MONSTER_ESSENCE_BASE * Math.min(encounterDifficulty / 2, 2) * lootMult;
    const essenceReward = Math.max(0, Math.floor(
      essenceBase * difficultyTime * this.essenceShopState.getEssenceMultiplier()
    ));
    this.resources.addMonsterEssence(essenceReward);

    const dropsMultiplier = 1 + (this.unlockUpgrades?.getBonus('monster', 'drops') ?? 0);
    const resourceRewards: ResourceReward[] = (monster?.drops ?? []).map((drop) => ({
      resourceId: drop.resourceId,
      amount: Math.floor(drop.amount * dropsMultiplier) * lootMult
        + (Math.random() < ((drop.amount * dropsMultiplier) % 1) ? lootMult : 0),
  }));
    resourceRewards.forEach((reward) => this.resources.addResource(reward.resourceId, reward.amount));
    this.rewardNotify.notifyReward(totalGold, essenceReward, resourceRewards);
  }

  private onPlannedCombatKill(combatId: string): void {
    const combat = listPlannedCombat.find((entry) => entry.id === combatId);
    if (!combat) return;
    const reward = (this.plannedCombatWins[combatId] ?? 0) === 0
      ? combat.firstReward
      : combat.repeatReward;
    this.plannedCombatWins[combatId] = (this.plannedCombatWins[combatId] ?? 0) + 1;
    this.plannedCombatCooldownEnds[combatId] = Date.now() + combat.cooldownSeconds * 1000;
    const clicks = Math.max(0, reward.clicks ?? 0);
    const essence = Math.max(0, reward.essence ?? 0);
    const resources = (reward.resources ?? []).map((entry) => ({ ...entry }));
    this.resources.addClicks(clicks);
    this.resources.addMonsterEssence(essence);
    resources.forEach((reward) => this.resources.addResource(reward.resourceId, reward.amount));
    this.rewardNotify.notifyReward(clicks, essence, resources);
  }

  getKillCounts(): Record<string, number> {
    return { ...this.killCounts };
  }

  setKillCounts(killCounts: Record<string, number> | undefined): void {
    this.killCounts = { ...(killCounts ?? {}) };
  }

  getPlannedCombatWins(): Record<string, number> {
    return { ...this.plannedCombatWins };
  }

  getPlannedCombatWinCount(combatId: string): number {
    return this.plannedCombatWins[combatId] ?? 0;
  }

  setPlannedCombatWins(wins: Record<string, number> | undefined): void {
    this.plannedCombatWins = { ...(wins ?? {}) };
  }

  getPlannedCombatCooldownEnds(): Record<string, number> {
    return { ...this.plannedCombatCooldownEnds };
  }

  setPlannedCombatCooldownEnds(cooldownEnds: Record<string, number> | undefined): void {
    this.plannedCombatCooldownEnds = { ...(cooldownEnds ?? {}) };
  }

  /** Tick : si monstre en cours → timeout ; sinon remplir la jauge rencontre et spawn à 100 %. */
  tick(
    workers: WorkerAutoData[],
    workersAvailable: WorkerAutoData[],
    additionalSpawnRateMultiplier = 1
  ): void {
    if (this.currentMonsterId != null) {
      const remaining = this.spawnTime + this.timeLimitMs - Date.now();
      if (remaining <= 0) {
        this.currentMonsterId = null;
        this.currentPlannedCombatId = null;
        this.currentPlannedCombatEnemyIndex = 0;
        if (!this.spawnQueuedMonster(workers, workersAvailable)) this.encounterMeter = 0;
      }
      return;
    }
    if (!this.isMonsterUnlocked(workers, workersAvailable)) return;
    const spawnRate = this.essenceShopState.getSpawnRateMultiplier()
      * Math.max(0, additionalSpawnRateMultiplier);
    this.encounterMeter = Math.min(100, this.encounterMeter + (100 * spawnRate) / (ENCOUNTER_FILL_SECONDS * TICKS_PER_SECOND));
    if (this.encounterMeter >= 100) {
      this.encounterMeter = 0;
      this.spawnMonsterInternal(workers, workersAvailable);
    }
  }

  /** Met un mob en attente si un combat est en cours, sinon le fait apparaître immédiatement. */
  forceSpawnNext(workers: WorkerAutoData[], workersAvailable: WorkerAutoData[], seconds = 0): void {
    if (this.currentMonsterId != null) {
      this.queuedMonsterCount += 1;
      this.addTimeToCurrentMonster(seconds);
      return;
    }
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
    const plannedCombat = this.currentPlannedCombatId == null
      ? null
      : listPlannedCombat.find((combat) => combat.id === this.currentPlannedCombatId);
    const plannedEnemy: PlannedCombatEnemy | undefined = plannedCombat?.enemies[this.currentPlannedCombatEnemyIndex];
    const monster = plannedCombat == null
      ? listMonster.find((m) => m.id === this.currentMonsterId)
      : plannedEnemy;
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
      isBoss: plannedCombat != null || this.isBoss,
      isPlannedCombat: plannedCombat != null,
      plannedCombatEnemyNumber: plannedCombat == null ? undefined : this.currentPlannedCombatEnemyIndex + 1,
      plannedCombatEnemyCount: plannedCombat?.enemies.length,
    };
  }

  hasCurrentMonster(): boolean {
    return this.currentMonsterId != null;
  }

  getQueuedMonsterCount(): number {
    return this.queuedMonsterCount;
  }

  getSelectedBiome(): MonsterBiomeId {
    return this.selectedBiome;
  }

  setSelectedBiome(biome: MonsterBiomeId): void {
    if (isMonsterBiomeId(biome) && this.isBiomeUnlocked(biome)) this.selectedBiome = biome;
  }

  private spawnQueuedMonster(
    workers: WorkerAutoData[],
    workersAvailable: WorkerAutoData[]
  ): boolean {
    if (this.queuedMonsterCount <= 0 || !this.isMonsterUnlocked(workers, workersAvailable)) return false;
    this.spawnMonsterInternal(workers, workersAvailable);
    if (this.currentMonsterId == null) return false;
    this.queuedMonsterCount -= 1;
    return true;
  }
}
