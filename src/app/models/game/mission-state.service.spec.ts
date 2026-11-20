import { MissionStateService } from './mission-state.service';
import { ResourcesService } from './resources.service';
import { MissionSaveData } from '../missions/mission.model';
import { UnlockContext } from '../unlocks/unlock-method';
import { EXPLORER_WORKER_INDEX } from '../unlocks/explorer-unlock';

describe('MissionStateService', () => {
  let missions: MissionStateService;
  let resources: ResourcesService;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(60000));
    resources = new ResourcesService();
    missions = new MissionStateService(resources);
    spyOn(Math, 'random').and.returnValue(0);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
  });

  it('unlocks missions at the beach and pays tickets when an objective is completed', () => {
    const monsterUnlocked: UnlockContext = {
      clicks: 0,
      getWorkerLevel: (workerIndex) => workerIndex === 6 ? 1 : 0,
    };
    expect(missions.getView(false)).toEqual([]);
    expect(missions.getView(true, monsterUnlocked)[0].mission?.objective.target).toBe(10);

    for (let i = 0; i < 9; i += 1) {
      missions.recordMonsterKill();
    }
    expect(resources.getResourceAmount('ticket')).toBe(0);

    missions.recordMonsterKill();

    expect(resources.getResourceAmount('ticket')).toBe(1);
    const slot = missions.getView(true)[0];
    expect(slot.mission).toBeNull();
    expect(slot.cooldownReason).toBe('completed');
    expect(slot.cooldownRemainingSeconds).toBe(300);
  });

  it('reuses unchanged slot views between game refreshes', () => {
    const monsterUnlocked: UnlockContext = {
      clicks: 0,
      getWorkerLevel: (workerIndex) => workerIndex === 6 ? 1 : 0,
    };
    const firstView = missions.getView(true, monsterUnlocked);

    expect(missions.getView(true, monsterUnlocked)).toBe(firstView);
    missions.recordMonsterKill();
    expect(missions.getView(true, monsterUnlocked)).not.toBe(firstView);
  });

  it('unlocks the extra slots for essence and then tickets', () => {
    missions.getView(true);
    resources.setMonsterEssence(200);
    expect(missions.unlockNextSlot()).toBeTrue();
    expect(resources.getMonsterEssence()).toBe(0);
    expect(missions.getView(true).length).toBe(2);

    resources.setResourceAmounts({ ticket: 100 });
    expect(missions.unlockNextSlot()).toBeTrue();
    expect(resources.getResourceAmount('ticket')).toBe(0);
    expect(missions.getView(true).length).toBe(3);
    expect(missions.unlockNextSlot()).toBeFalse();
  });

  it('puts a rerolled mission on cooldown before generating its replacement', () => {
    missions.getView(true);
    expect(missions.reroll(0)).toBeTrue();
    expect(missions.getView(true)[0].mission).toBeNull();
    expect(missions.reroll(0)).toBeFalse();

    jasmine.clock().tick(60000);

    expect(missions.getView(true)[0].mission).not.toBeNull();
    expect(missions.getUnseen()).toBeTrue();
  });

  it('only offers missions whose matching feature is unlocked', () => {
    const lockedFeatures: UnlockContext = {
      clicks: 0,
      getWorkerLevel: () => 0,
    };
    expect(missions.getView(true, lockedFeatures)[0].mission?.objective.type).toBe('clicks');

    missions.setSaveData();
    const monsterUnlocked: UnlockContext = {
      ...lockedFeatures,
      getWorkerLevel: (workerIndex) => workerIndex === 6 ? 1 : 0,
    };
    expect(missions.getView(true, monsterUnlocked)[0].mission?.objective.type).toBe('defeat-monsters');
  });

  it('requires each planned mission victory toward a multi-mission objective', () => {
    const missionUnlocked: UnlockContext = {
      clicks: 0,
      getWorkerLevel: (workerIndex) => workerIndex === EXPLORER_WORKER_INDEX ? 1 : 0,
    };
    const savedMissions: MissionSaveData = {
      slots: [{
        id: 0,
        mission: {
          id: 'mission-1',
          objective: {
            type: 'complete-missions',
            target: 1,
            progress: 0,
            description: 'Terminer 1 mission',
          },
          ticketReward: 2,
        },
        cooldownEndsAt: 0,
        cooldownReason: null,
        lastReward: 0,
      }],
      unlockedSlots: 1,
      unseen: false,
    };
    missions.setSaveData(savedMissions, missionUnlocked);
    missions.getView(true, missionUnlocked);
    expect(missions.getView(true, missionUnlocked)[0].mission?.objective.target).toBe(2);

    missions.recordPlannedMission();
    expect(missions.getView(true, missionUnlocked)[0].mission?.objective.progress).toBe(1);
    expect(resources.getResourceAmount('ticket')).toBe(0);

    missions.recordPlannedMission();
    expect(missions.getView(true, missionUnlocked)[0].mission).toBeNull();
    expect(resources.getResourceAmount('ticket')).toBe(2);
  });
});
