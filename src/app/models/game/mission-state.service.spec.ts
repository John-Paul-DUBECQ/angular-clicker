import { MissionStateService } from './mission-state.service';
import { ResourcesService } from './resources.service';

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
    expect(missions.getView(false)).toEqual([]);
    expect(missions.getView(true)[0].mission?.objective.target).toBe(5);

    for (let i = 0; i < 4; i += 1) {
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
    const firstView = missions.getView(true);

    expect(missions.getView(true)).toBe(firstView);
    missions.recordMonsterKill();
    expect(missions.getView(true)).not.toBe(firstView);
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
});
