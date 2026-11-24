import { TestBed } from '@angular/core/testing';
import { GameStateService } from './game-state.service';
import { HouseStateService } from './house-state.service';
import { MonsterStateService } from './monster-state.service';
import { ResourcesService } from './resources.service';
import { WorkerStateService } from './worker-state.service';
import { ShopStateService } from './shop-state.service';
import { PowerStateService } from './power-state.service';
import { VesselService } from './vessel.service';
import { formatNumberValue } from '../../pipes/format-number.pipe';
import { listPlannedCombat } from '../monsters/list-planned-combat';
import { listShopItem } from '../list-shop-item';
import { getSunUpgradeStats } from '../unlocks/sun-unlock';
import { getCriticalHitStats } from '../unlocks/critical-hit';
import { ShopItem } from '../shop-item';
import { listPower } from '../powers/list-power';
import { LOTTERY_STATS } from '../monsters/lottery.model';

describe('GameStateService solar bonuses', () => {
  let gameState: GameStateService;
  let houseState: HouseStateService;
  let monsterState: MonsterStateService;
  let resources: ResourcesService;
  let workerState: WorkerStateService;
  let shopState: ShopStateService;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(60000));
    localStorage.removeItem('clickerGameSave');
    TestBed.configureTestingModule({});
    gameState = TestBed.inject(GameStateService);
    houseState = TestBed.inject(HouseStateService);
    monsterState = TestBed.inject(MonsterStateService);
    resources = TestBed.inject(ResourcesService);
    workerState = TestBed.inject(WorkerStateService);
    shopState = TestBed.inject(ShopStateService);

    const workersAvailable = workerState.getWorkersAvailable();
    workersAvailable[0].level = 1;
    workersAvailable[1].level = 1;
    workersAvailable[4].level = 75;
    workerState.setWorkers([
      workersAvailable[0],
      workersAvailable[1],
      workersAvailable[4],
    ]);
    houseState.setLevels([0, 0, 0, 0, 1, 1, 1]);
  });

  afterEach(() => {
    const goldenHoe = listShopItem.find((item) => item.id === 'golden-hoe');
    if (goldenHoe) goldenHoe.doesAppearInGame = false;
    document.querySelectorAll('.damage-popup, .critical-hit-popup').forEach((popup) => popup.remove());
    TestBed.resetTestingModule();
    jasmine.clock().uninstall();
  });

  it('applies the solar balance exchange to displayed click and AFK values', () => {
    const game = gameState.getState();
    const clickValue = workerState.getCurrentClickValue(() => 1);
    const autoPerSecond = workerState.calculateClicksPerSecond(() => 1);

    expect(game.clickValue).toBeCloseTo(clickValue + autoPerSecond * 1.05 * 0.003, 10);
    expect(game.valueAutoPerSecond).toBeCloseTo(
      (autoPerSecond + clickValue * 0.05) * 1.05,
      10
    );
    expect(game.workersAvailable[0].totalClickDamage).toBe(game.clickValue);
  });

  it('restores worker unlock methods when loading serialized workers', () => {
    const savedWorkers = JSON.parse(JSON.stringify(workerState.getWorkersAvailable()));

    workerState.setWorkersAvailable(savedWorkers);

    const unlockMethod = workerState.getWorkersAvailable()[1].unlocks[0].unlockMethod;
    expect(unlockMethod?.getWorkerLevelRequirement(1)).toBe(100);
  });

  it('unlocks the houses tab only at Farmer level 100', () => {
    expect(gameState.getState().housesUnlocked).toBeFalse();

    workerState.getWorkersAvailable()[1].level = 100;
    expect(gameState.getState().housesUnlocked).toBeTrue();
  });

  it('unlocks missions only after the beach biome is available', () => {
    expect(gameState.getState().explorerUnlocked).toBeFalse();
    expect(gameState.getState().missionsUnlocked).toBeFalse();

    const explorer = workerState.getWorkersAvailable()[8];
    explorer.level = 1;
    workerState.setWorkers([...workerState.getWorkers(), explorer]);

    expect(gameState.getState().explorerUnlocked).toBeTrue();
    expect(gameState.getState().missionsUnlocked).toBeFalse();

    monsterState.setPlannedCombatWins({ 'planned-forest-10': 1 });
    expect(gameState.getState().missionsUnlocked).toBeTrue();
  });

  it('unlocks each resource trade from its planned combat', () => {
    resources.setResourceAmounts({ ticket: 6 });
    expect(gameState.getState().resourceTrades?.every((trade) => !trade.unlocked)).toBeTrue();
    expect(gameState.tradeResource('tickets-for-bait', 1)).toBeFalse();

    monsterState.setPlannedCombatWins({ 'planned-forest-10': 1 });
    const afterForest = gameState.getState().resourceTrades ?? [];
    expect(afterForest.find((trade) => trade.id === 'tickets-for-trap')?.unlocked).toBeTrue();
    expect(afterForest.find((trade) => trade.id === 'tickets-for-bait')?.unlocked).toBeFalse();
    expect(gameState.tradeResource('tickets-for-trap', 1)).toBeTrue();
    expect(gameState.tradeResource('tickets-for-bait', 1)).toBeFalse();

    monsterState.setPlannedCombatWins({ 'planned-forest-10': 1, 'planned-beach-05': 1 });
    expect(gameState.getState().resourceTrades?.find((trade) => trade.id === 'tickets-for-bait')?.unlocked).toBeTrue();
    expect(gameState.tradeResource('tickets-for-bait', 1)).toBeTrue();
    expect(resources.getResourceAmount('ticket')).toBe(0);
    expect(resources.getResourceAmount('bait')).toBe(1);
    expect(gameState.getResourceTradeCost('tickets-for-bait', 1)).toBe(3);
  });

  it('changes passive damage and click transfer with the active solar phase', () => {
    workerState.getWorkersAvailable()[1].baseProduction = 10000;
    gameState.setShowDamageNumbers(true);
    spyOn(Math, 'random').and.returnValue(0.99);

    const bluePhase = gameState.getState();
    gameState.click();
    const blueDamage = document.querySelector('.damage-popup')?.textContent;
    document.querySelectorAll('.damage-popup').forEach((popup) => popup.remove());

    jasmine.clock().mockDate(new Date(120000));
    const yellowPhase = gameState.getState();
    gameState.click();
    const yellowDamage = document.querySelector('.damage-popup')?.textContent;

    expect(bluePhase.valueAutoPerSecond).toBeGreaterThan(yellowPhase.valueAutoPerSecond);
    expect(bluePhase.clickValue).toBeGreaterThan(yellowPhase.clickValue);
    expect(blueDamage).not.toBe(yellowDamage);
  });

  it('applies the blue reward and mana bonuses to clicks', () => {
    const clickValue = workerState.getCurrentClickValue(() => 1);
    const autoPerSecond = workerState.calculateClicksPerSecond(() => 1);

    gameState.click();

    expect(resources.getClicks()).toBeCloseTo(
      (clickValue + autoPerSecond * 1.05 * 0.003) * 1.05,
      10
    );
    expect(resources.getMana()).toBeCloseTo(0.6, 10);
  });

  it('shows the blue damage bonus in non-combat click numbers', () => {
    const clickValue = workerState.getCurrentClickValue(() => 1);
    const autoPerSecond = workerState.calculateClicksPerSecond(() => 1);
    spyOn(Math, 'random').and.returnValue(0.99);
    gameState.setShowDamageNumbers(true);

    gameState.click();

    const popup = document.querySelector('.damage-popup');
    expect(popup?.textContent).toBe(
      formatNumberValue(clickValue + autoPerSecond * 1.05 * 0.003, 2)
    );
  });

  it('increases blue-phase normal damage against monsters', () => {
    const workersAvailable = workerState.getWorkersAvailable();
    const clicker = workersAvailable[0];
    const astrologue = workersAvailable[4];
    const alchemist = workersAvailable[6];
    clicker.level = 1;
    alchemist.level = 1;
    alchemist.baseProduction = 10;
    workerState.setWorkers([clicker, astrologue, alchemist]);

    const workers = workerState.getWorkers();
    const clickValue = workerState.getCurrentClickValue(() => 1);
    const autoPerSecond = workerState.calculateClicksPerSecond(() => 1);
    const expectedDamage = clickValue + autoPerSecond * 1.05 * 0.003;

    spyOn(Math, 'random').and.returnValue(0.99);
    monsterState.forceSpawnNext(workers, workersAvailable);
    const monsterBefore = monsterState.getCurrentMonsterView(workers, workersAvailable);
    expect(monsterBefore).not.toBeNull();

    gameState.click();

    const monsterAfter = monsterState.getCurrentMonsterView(workers, workersAvailable);
    expect(monsterAfter).not.toBeNull();
    expect(Math.abs(monsterBefore!.currentHp - monsterAfter!.currentHp - expectedDamage))
      .toBeLessThan(expectedDamage * 1e-10);
  });

  it('applies the blue critical-damage bonus as well as direct damage', () => {
    const workersAvailable = workerState.getWorkersAvailable();
    const clicker = workersAvailable[0];
    const miner = workersAvailable[2];
    const astrologue = workersAvailable[4];
    const alchemist = workersAvailable[6];
    clicker.level = 1;
    miner.level = 1;
    alchemist.level = 1;
    alchemist.baseProduction = 10;
    workerState.setWorkers([clicker, miner, astrologue, alchemist]);

    const workers = workerState.getWorkers();
    const clickValue = workerState.getCurrentClickValue(() => 1);
    const autoPerSecond = workerState.calculateClicksPerSecond(() => 1);
    const expectedDamage = (clickValue + autoPerSecond * 1.05 * 0.003) * 2 * 1.05;

    spyOn(Math, 'random').and.returnValue(0);
    monsterState.forceSpawnNext(workers, workersAvailable, getShopMult);
    const monsterBefore = monsterState.getCurrentMonsterView(workers, workersAvailable);
    expect(monsterBefore).not.toBeNull();

    gameState.click();

    const monsterAfter = monsterState.getCurrentMonsterView(workers, workersAvailable);
    expect(monsterAfter).not.toBeNull();
    expect(Math.abs(monsterBefore!.currentHp - monsterAfter!.currentHp - expectedDamage))
      .toBeLessThan(expectedDamage * 1e-10);
  });

  it('spawns only aquatic monsters when the beach biome is selected', () => {
    const workersAvailable = workerState.getWorkersAvailable();
    const alchemist = workersAvailable[6];
    const explorer = workersAvailable[8];
    alchemist.level = 1;
    explorer.level = 1;
    workerState.setWorkers([alchemist, explorer]);
    monsterState.setPlannedCombatWins({ 'planned-forest-10': 1 });
    monsterState.setSelectedBiome('beach');

    spyOn(Math, 'random').and.returnValue(0.99);
    monsterState.forceSpawnNext(workerState.getWorkers(), workersAvailable, getShopMult);

    const monster = monsterState.getCurrentMonsterView(workerState.getWorkers(), workersAvailable);
    expect(monster).not.toBeNull();
    expect(['monster4', 'monster5', 'monster6', 'monster7']).toContain(monster!.monsterId);
  });

  it('keeps the forest as the default spawn biome', () => {
    const workersAvailable = workerState.getWorkersAvailable();
    const alchemist = workersAvailable[6];
    const explorer = workersAvailable[8];
    alchemist.level = 1;
    explorer.level = 1;
    workerState.setWorkers([alchemist, explorer]);

    spyOn(Math, 'random').and.returnValue(0.99);
    monsterState.forceSpawnNext(workerState.getWorkers(), workersAvailable, getShopMult);

    const monster = monsterState.getCurrentMonsterView(workerState.getWorkers(), workersAvailable);
    expect(monster?.monsterId).toBe('monster1');
  });

  it('does not spawn monsters in the mine before its content is defined', () => {
    const workersAvailable = workerState.getWorkersAvailable();
    const alchemist = workersAvailable[6];
    alchemist.level = 1;
    workerState.setWorkers([alchemist]);
    monsterState.setPlannedCombatWins({
      'planned-forest-10': 1,
      'planned-beach-10': 1,
    });
    monsterState.setSelectedBiome('mine');

    monsterState.forceSpawnNext(workerState.getWorkers(), workersAvailable, getShopMult);

    expect(monsterState.getCurrentMonsterView(workerState.getWorkers(), workersAvailable)).toBeNull();
  });

  it('unlocks biome selection with the explorer and includes it in saves', () => {
    expect(gameState.setSelectedBiome('beach')).toBeFalse();

    const workersAvailable = workerState.getWorkersAvailable();
    const explorer = workersAvailable[8];
    explorer.level = 1;
    workerState.setWorkers([...workerState.getWorkers(), explorer]);
    monsterState.setPlannedCombatWins({ 'planned-forest-10': 1 });

    expect(gameState.setSelectedBiome('beach')).toBeTrue();
    const save = localStorage.getItem('clickerGameSave');
    expect(save).not.toBeNull();
    expect(gameState.importSave(save!)).toBeTrue();
    expect(gameState.getState().selectedBiome).toBe('beach');
  });

  it('unlocks biomes only after the previous biome final level is won', () => {
    expect(monsterState.getUnlockedBiomes()).toEqual({
      forest: true,
      beach: false,
      mine: false,
    });

    monsterState.setPlannedCombatWins({ 'planned-forest-09': 1 });
    expect(monsterState.isBiomeUnlocked('beach')).toBeFalse();
    monsterState.setPlannedCombatWins({ 'planned-forest-10': 1 });
    expect(monsterState.isBiomeUnlocked('beach')).toBeTrue();
    expect(monsterState.isBiomeUnlocked('mine')).toBeFalse();
    monsterState.setPlannedCombatWins({
      'planned-forest-10': 1,
      'planned-beach-10': 1,
    });
    expect(monsterState.isBiomeUnlocked('mine')).toBeTrue();
  });

  it('defines ten sequential combat levels for both available biomes', () => {
    const forest = listPlannedCombat.filter((combat) => combat.biome === 'forest');
    const beach = listPlannedCombat.filter((combat) => combat.biome === 'beach');

    expect(forest.map((combat) => combat.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(beach.map((combat) => combat.level)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('unlocks each combat only after the previous level is won', () => {
    const workersAvailable = workerState.getWorkersAvailable();
    const alchemist = workersAvailable[6];
    const explorer = workersAvailable[8];
    alchemist.level = 1;
    explorer.level = 1;
    workerState.setWorkers([alchemist, explorer]);

    let combats = monsterState.getPlannedCombats(workerState.getWorkers(), workersAvailable);
    expect(combats.find((combat) => combat.id === 'planned-mosh-hunt')?.unlocked).toBeTrue();
    expect(combats.find((combat) => combat.id === 'planned-super-mosh')?.unlocked).toBeFalse();

    monsterState.setPlannedCombatWins({ 'planned-mosh-hunt': 1 });
    combats = monsterState.getPlannedCombats(workerState.getWorkers(), workersAvailable);
    expect(combats.find((combat) => combat.id === 'planned-super-mosh')?.unlocked).toBeTrue();
    expect(combats.find((combat) => combat.id === 'planned-forest-03')?.unlocked).toBeFalse();

    monsterState.setPlannedCombatWins({ 'planned-forest-10': 1 });
    combats = monsterState.getPlannedCombats(workerState.getWorkers(), workersAvailable);
    expect(combats.find((combat) => combat.id === 'planned-beach-01')?.unlocked).toBeTrue();
  });

  it('uses the fixed HP values configured for planned combat enemies', () => {
    const workersAvailable = workerState.getWorkersAvailable();
    const alchemist = workersAvailable[6];
    alchemist.level = 1;
    alchemist.baseProduction = 10;
    workerState.setWorkers([alchemist]);

    const firstCombat = monsterState.getPlannedCombats(
      workerState.getWorkers(),
      workersAvailable
    )[0];

    expect(firstCombat.totalHp).toBe(1.2e15);
    expect(firstCombat.enemies[0].maxHp).toBe(1.2e15);
  });

  it('advances through all enemies in one combat and rewards only after the last one', () => {
    const workersAvailable = workerState.getWorkersAvailable();
    const alchemist = workersAvailable[6];
    const explorer = workersAvailable[8];
    alchemist.level = 1;
    explorer.level = 1;
    workerState.setWorkers([alchemist, explorer]);
    monsterState.setPlannedCombatWins({ 'planned-super-mosh': 1 });

    expect(monsterState.startPlannedCombat(
      'planned-forest-03',
      workerState.getWorkers(),
      workersAvailable
    )).toBeTrue();

    const firstEnemy = monsterState.getCurrentMonsterView(workerState.getWorkers(), workersAvailable);
    expect(firstEnemy?.name).toBe('Sac Poubelle Sama');
    expect(firstEnemy?.plannedCombatEnemyNumber).toBe(1);
    expect(firstEnemy?.plannedCombatEnemyCount).toBe(2);

    expect(monsterState.dealDamage(1e15, workerState.getWorkers(), workersAvailable, getShopMult)).toBeTrue();

    const secondEnemy = monsterState.getCurrentMonsterView(workerState.getWorkers(), workersAvailable);
    expect(secondEnemy?.name).toBe('Mosh');
    expect(secondEnemy?.currentHp).toBe(4e14);
    expect(secondEnemy?.plannedCombatEnemyNumber).toBe(2);
    expect(secondEnemy?.remainingSeconds).toBe(firstEnemy?.remainingSeconds);
    expect(monsterState.getPlannedCombatWins()['planned-forest-03']).toBeUndefined();

    expect(monsterState.dealDamage(4e14, workerState.getWorkers(), workersAvailable, getShopMult)).toBeTrue();
    expect(monsterState.getCurrentMonsterView(workerState.getWorkers(), workersAvailable)).toBeNull();
    expect(monsterState.getPlannedCombatWins()['planned-forest-03']).toBe(1);
  });

  it('cancels a planned combat without awarding a win or reward', () => {
    const workersAvailable = workerState.getWorkersAvailable();
    const alchemist = workersAvailable[6];
    const explorer = workersAvailable[8];
    alchemist.level = 1;
    explorer.level = 1;
    workerState.setWorkers([alchemist, explorer]);
    monsterState.setPlannedCombatWins({ 'planned-super-mosh': 1 });
    const clicksBefore = resources.getClicks();
    const essenceBefore = resources.getMonsterEssence();

    expect(gameState.startPlannedCombat('planned-forest-03')).toBeTrue();
    expect(monsterState.getCurrentMonsterView(workerState.getWorkers(), workersAvailable)?.isPlannedCombat)
      .toBeTrue();

    expect(gameState.cancelPlannedCombat()).toBeTrue();
    expect(monsterState.getCurrentMonsterView(workerState.getWorkers(), workersAvailable)).toBeNull();
    expect(monsterState.getPlannedCombatWins()['planned-forest-03']).toBeUndefined();
    expect(resources.getClicks()).toBe(clicksBefore);
    expect(resources.getMonsterEssence()).toBe(essenceBefore);
    expect(gameState.cancelPlannedCombat()).toBeFalse();
    expect(gameState.startPlannedCombat('planned-forest-03')).toBeTrue();
    expect(gameState.cancelPlannedCombat()).toBeTrue();
  });

  it('exchanges traps for a configured planned-combat reward after the required wins and starts cooldown', () => {
    const workersAvailable = workerState.getWorkersAvailable();
    const alchemist = workersAvailable[6];
    const explorer = workersAvailable[8];
    alchemist.level = 1;
    explorer.level = 1;
    workerState.setWorkers([alchemist, explorer]);
    monsterState.setPlannedCombatWins({
      'planned-forest-04': 1,
      'planned-forest-05': 9,
    });
    resources.setResourceAmounts({ trap: 5 });

    expect(gameState.usePlannedCombatBait('planned-forest-05')).toBeFalse();
    expect(resources.getResourceAmount('trap')).toBe(5);

    monsterState.setPlannedCombatWins({
      'planned-forest-04': 1,
      'planned-forest-05': 10,
    });
    expect(gameState.usePlannedCombatBait('planned-forest-05')).toBeTrue();
    expect(resources.getResourceAmount('trap')).toBe(0);
    expect(resources.getResourceAmount('mosh-paw')).toBe(1);
    expect(monsterState.getPlannedCombatWins()['planned-forest-05']).toBe(10);
    expect(monsterState.getPlannedCombatCooldownEnds()['planned-forest-05'])
      .toBe(Date.now() + 5 * 60 * 1000);
    expect(gameState.usePlannedCombatBait('planned-forest-05')).toBeFalse();
    expect(gameState.startPlannedCombat('planned-forest-05')).toBeFalse();
  });

  it('persists and restores navigation notification state with the game save', () => {
    const notificationState = {
      seenShopItemKeys: ['shop-item-a'],
      seenHouseIds: ['house-a'],
      seenDishIds: ['dish-a'],
      essenceShopSeen: true,
    };
    gameState.setNavigationNotificationState(notificationState);

    const saved = JSON.parse(localStorage.getItem('clickerGameSave') || '{}');
    expect(saved.navigationNotificationState).toEqual(notificationState);
    gameState.setNavigationNotificationState({
      seenShopItemKeys: [],
      seenHouseIds: [],
      seenDishIds: [],
      essenceShopSeen: false,
    });

    expect(gameState.importSave(JSON.stringify(saved))).toBeTrue();
    expect(gameState.getNavigationNotificationState()).toEqual(notificationState);
  });

  it('accepts damage only from the configured source in planned combat', () => {
    const combat = listPlannedCombat.find((entry) => entry.id === 'planned-forest-03')!;
    const previousDamageMode = combat.damageMode;
    const workersAvailable = workerState.getWorkersAvailable();
    const alchemist = workersAvailable[6];
    const explorer = workersAvailable[8];
    alchemist.level = 1;
    explorer.level = 1;
    workerState.setWorkers([alchemist, explorer]);
    monsterState.setPlannedCombatWins({ 'planned-super-mosh': 1 });
    const workers = workerState.getWorkers();

    try {
      combat.damageMode = 'click';
      expect(gameState.startPlannedCombat(combat.id)).toBeTrue();
      const initialHp = monsterState.getCurrentMonsterView(workers, workersAvailable)!.currentHp;
      expect(monsterState.dealDamage(1e5, workers, workersAvailable, getShopMult, 'afk')).toBeFalse();
      expect(monsterState.getCurrentMonsterView(workers, workersAvailable)!.currentHp).toBe(initialHp);
      expect(monsterState.dealDamage(1e5, workers, workersAvailable, getShopMult, 'click')).toBeFalse();
      expect(monsterState.getCurrentMonsterView(workers, workersAvailable)!.currentHp).toBe(initialHp - 1e5);
      expect(gameState.cancelPlannedCombat()).toBeTrue();

      combat.damageMode = 'afk';
      expect(gameState.startPlannedCombat(combat.id)).toBeTrue();
      const afkInitialHp = monsterState.getCurrentMonsterView(workers, workersAvailable)!.currentHp;
      expect(monsterState.dealDamage(1e5, workers, workersAvailable, getShopMult, 'click')).toBeFalse();
      expect(monsterState.getCurrentMonsterView(workers, workersAvailable)!.currentHp).toBe(afkInitialHp);
      expect(monsterState.dealDamage(1e5, workers, workersAvailable, getShopMult, 'afk')).toBeFalse();
      expect(monsterState.getCurrentMonsterView(workers, workersAvailable)!.currentHp).toBe(afkInitialHp - 1e5);
      expect(gameState.cancelPlannedCombat()).toBeTrue();
    } finally {
      combat.damageMode = previousDamageMode;
    }
  });

  it('shows the golden hoe immediately after its planned combat unlock at 2B clicks', () => {
    const goldenHoe = listShopItem.find((item) => item.id === 'golden-hoe');
    expect(goldenHoe).toBeDefined();
    goldenHoe!.doesAppearInGame = false;
    resources.setClicks(2e9);

    expect(gameState.getState().shopItems.find((item) => item.id === 'golden-hoe')?.doesAppearInGame)
      .toBeFalse();

    monsterState.setPlannedCombatWins({ 'planned-beach-01': 1 });

    expect(gameState.getState().shopItems.find((item) => item.id === 'golden-hoe')?.doesAppearInGame)
      .toBeTrue();
  });

  it('applies shop unlock upgrades to sun stats, critical damage, and spell cost', () => {
    const upgrades: ShopItem[] = [
      {
        id: 'test-sun-upgrade',
        name: 'Test',
        description: '',
        price: 0,
        doesAppearInGame: true,
        bought: true,
        value: 1,
        unlockUpgrade: { unlockId: 'sun', type: 'size', value: 0.1 },
      },
      {
        id: 'test-sun-speed-upgrade',
        name: 'Test',
        description: '',
        price: 0,
        doesAppearInGame: true,
        bought: true,
        value: 1,
        unlockUpgrade: { unlockId: 'sun', type: 'speed', value: 0.1 },
      },
      {
        id: 'test-critical-upgrade',
        name: 'Test',
        description: '',
        price: 0,
        doesAppearInGame: true,
        bought: true,
        value: 1,
        unlockUpgrade: { unlockId: 'critical-hit', type: 'damage', value: 0.1 },
      },
      {
        id: 'test-power-upgrade',
        name: 'Test',
        description: '',
        price: 0,
        doesAppearInGame: true,
        bought: true,
        value: 1,
        unlockUpgrade: { unlockId: 'power:power', type: 'mana-cost', value: 0.1 },
      },
    ];
    const shopItems = shopState.getShopItems();
    shopItems.push(...upgrades);

    try {
      const baseSunStats = getSunUpgradeStats(75);
      const sunStats = gameState.getState();
      expect(sunStats.sunSizeFactor).toBeCloseTo(baseSunStats.sizeFactor * 1.1, 10);
      expect(sunStats.sunSpeedFactor).toBeCloseTo(baseSunStats.speedFactor / 1.1, 10);

      const baseCriticalMultiplier = getCriticalHitStats(0).totalMultiplier;
      const criticalDamage = gameState.getWorkerInfoStats(2).lines
        .find((line) => line.label === 'Dégâts critique');
      expect(criticalDamage?.value).toBe(`×${(baseCriticalMultiplier * 1.1).toFixed(2)}`);
      expect(gameState.getPowerManaCost(0)).toBe(180);
    } finally {
      shopItems.splice(shopItems.length - upgrades.length, upgrades.length);
    }
  });

  it('applies per-spell mana, cooldown, duration, and strength upgrades', () => {
    const upgrades: ShopItem[] = [
      {
        id: 'test-power-cost',
        name: 'Test',
        description: '',
        price: 0,
        doesAppearInGame: true,
        bought: true,
        value: 1,
        unlockUpgrade: { unlockId: 'power:power', type: 'mana-cost', value: 0.1 },
      },
      {
        id: 'test-power-cooldown',
        name: 'Test',
        description: '',
        price: 0,
        doesAppearInGame: true,
        bought: true,
        value: 1,
        unlockUpgrade: { unlockId: 'power:power', type: 'cooldown', value: 10 },
      },
      {
        id: 'test-power-duration',
        name: 'Test',
        description: '',
        price: 0,
        doesAppearInGame: true,
        bought: true,
        value: 1,
        unlockUpgrade: { unlockId: 'power:power', type: 'duration', value: 0.1 },
      },
      {
        id: 'test-power-strength',
        name: 'Test',
        description: '',
        price: 0,
        doesAppearInGame: true,
        bought: true,
        value: 1,
        unlockUpgrade: { unlockId: 'power:power', type: 'strength', value: 0.1 },
      },
    ];
    const shopItems = shopState.getShopItems();
    shopItems.push(...upgrades);
    const powerState = TestBed.inject(PowerStateService);
    const powerIndex = listPower.findIndex((power) => power.id === 'power');
    resources.setMana(1000);
    const manaBefore = resources.getMana();

    try {
      gameState.castPower(powerIndex);

      expect(resources.getMana()).toBe(manaBefore - 180);
      expect(powerState.getDamageMultiplier()).toBeCloseTo(2.2, 10);
      expect(powerState.getCooldowns()['power']).toBeCloseTo(110, 0);
      expect(powerState.getDamageBuffEndTime()).toBeGreaterThanOrEqual(Date.now() + 65999);
    } finally {
      shopItems.splice(shopItems.length - upgrades.length, upgrades.length);
    }
  });

  it('adds shop unlock upgrades to the number of vessels summoned by the spell', () => {
    const upgrade: ShopItem = {
      id: 'test-vessel-count',
      name: 'Test',
      description: '',
      price: 0,
      doesAppearInGame: true,
      bought: true,
      value: 1,
      unlockUpgrade: { unlockId: 'vessel-rush', type: 'count', value: 2 },
    };
    const shopItems = shopState.getShopItems();
    shopItems.push(upgrade);
    const vesselService = TestBed.inject(VesselService);
    spyOn(vesselService, 'summonVesselRush');
    const powerIndex = listPower.findIndex((power) => power.id === 'vessel-rush');
    resources.setMana(1000);
    resources.setResourceAmounts({ bait: 3 });

    try {
      gameState.castPower(powerIndex);
      expect(vesselService.summonVesselRush).toHaveBeenCalledWith(12, 3);
    } finally {
      shopItems.pop();
    }
  });

  it('unlocks the kitchen at Explorateur level 60 and applies a eaten dish', () => {
    const workersAvailable = workerState.getWorkersAvailable();
    const explorer = workersAvailable[9];
    explorer.level = 59;
    workerState.setWorkers([explorer]);
    resources.setResourceAmounts({ 'mosh-paw': 5, 'mosh-tooth': 2, 'super-mosh-core': 1 });

    expect(gameState.getState().kitchen?.unlocked).toBeFalse();
    expect(gameState.cookDish('ragout-de-mosh')).toBeFalse();

    explorer.level = 60;
    expect(gameState.getState().kitchen?.unlocked).toBeTrue();
    expect(gameState.getState().kitchen?.dishes.some((dish) => dish.id === 'noyau-saute')).toBeFalse();
    const before = gameState.getState().clickValue;
    expect(gameState.cookDish('ragout-de-mosh')).toBeTrue();
    expect(gameState.useDish('ragout-de-mosh')).toBeTrue();
    expect(gameState.getState().kitchen?.activeDishes[0].remainingSeconds).toBe(60);
    expect(gameState.getState().clickValue / before).toBeCloseTo(1, 5);

    explorer.level = 70;
    resources.setResourceAmounts({ 'super-mosh-core': 1, 'mosh-paw': 3 });
    const damageBefore = gameState.getState().clickValue;
    expect(gameState.cookDish('noyau-saute')).toBeTrue();
    expect(gameState.useDish('noyau-saute')).toBeTrue();
    expect(gameState.getState().clickValue / damageBefore).toBeCloseTo(1.5, 5);
  });

  it('shortens adventure and trap cooldowns while the dish is active and leaves luck unused', () => {
    const workersAvailable = workerState.getWorkersAvailable();
    const alchemist = workersAvailable[6];
    const legacyExplorer = workersAvailable[8];
    const explorer = workersAvailable[9];
    alchemist.level = 1;
    legacyExplorer.level = 1;
    explorer.level = 90;
    workerState.setWorkers([alchemist, legacyExplorer, explorer]);
    monsterState.setPlannedCombatWins({
      'planned-forest-04': 1,
      'planned-forest-05': 10,
    });
    resources.setResourceAmounts({
      food: 2,
      trap: 6,
      bait: 1,
      'peji-tongue': 1,
      'mosh-tooth': 2,
      bulb: 1,
    });

    expect(gameState.cookDish('gamelle-du-voyageur')).toBeTrue();
    expect(gameState.useDish('gamelle-du-voyageur')).toBeTrue();
    expect(gameState.usePlannedCombatBait('planned-forest-05')).toBeTrue();
    expect(monsterState.getPlannedCombatCooldownEnds()['planned-forest-05'])
      .toBe(Date.now() + 5 * 60 * 1000 * 0.75);

    expect(gameState.cookDish('dessert-de-la-chance')).toBeTrue();
    expect(gameState.useDish('dessert-de-la-chance')).toBeTrue();
    const state = gameState.getState();
    expect(state.kitchen?.luck).toBe(8);
    expect(state.lottery?.unlocked).toBeFalse();
    expect(state.lottery?.luck).toBe(0);
    expect(state.lottery?.luckMultiplier).toBe(LOTTERY_STATS.luckMultiplier);
  });
});
