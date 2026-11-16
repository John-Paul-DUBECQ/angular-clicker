import { TestBed } from '@angular/core/testing';
import { GameStateService } from './game-state.service';
import { HouseStateService } from './house-state.service';
import { MonsterStateService } from './monster-state.service';
import { ResourcesService } from './resources.service';
import { WorkerStateService } from './worker-state.service';
import { formatNumberValue } from '../../pipes/format-number.pipe';

describe('GameStateService solar bonuses', () => {
  let gameState: GameStateService;
  let houseState: HouseStateService;
  let monsterState: MonsterStateService;
  let resources: ResourcesService;
  let workerState: WorkerStateService;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(60000));
    TestBed.configureTestingModule({});
    gameState = TestBed.inject(GameStateService);
    houseState = TestBed.inject(HouseStateService);
    monsterState = TestBed.inject(MonsterStateService);
    resources = TestBed.inject(ResourcesService);
    workerState = TestBed.inject(WorkerStateService);

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
    monsterState.forceSpawnNext(workers, workersAvailable);
    const monsterBefore = monsterState.getCurrentMonsterView(workers, workersAvailable);
    expect(monsterBefore).not.toBeNull();

    gameState.click();

    const monsterAfter = monsterState.getCurrentMonsterView(workers, workersAvailable);
    expect(monsterAfter).not.toBeNull();
    expect(Math.abs(monsterBefore!.currentHp - monsterAfter!.currentHp - expectedDamage))
      .toBeLessThan(expectedDamage * 1e-10);
  });
});
