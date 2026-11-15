import { HouseStateService } from './house-state.service';
import { ResourcesService } from './resources.service';

describe('HouseStateService vessel rush upgrades', () => {
  let resources: ResourcesService;
  let service: HouseStateService;

  beforeEach(() => {
    resources = new ResourcesService();
    service = new HouseStateService(resources);
  });

  it('starts with the base vessel rush values', () => {
    const house = service.getHousesView(35).find((entry) => entry.id === 'vessel-rush-house');

    expect(service.getVesselRushBonuses()).toEqual({ vesselCount: 0, durationSeconds: 0 });
    expect(house?.vesselRushVesselCount).toBe(10);
    expect(house?.vesselRushDurationSeconds).toBe(3);
  });

  it('unlocks and upgrades the rush with vessel resources', () => {
    resources.setMonsterEssence(100);
    resources.setResourceAmounts({
      'cargo-scrap': 100,
      'warship-cell': 100,
      'hunter-beacon': 100,
    });

    expect(service.buy(2, 35)).toBe(true);
    expect(service.getVesselRushBonuses()).toEqual({ vesselCount: 2, durationSeconds: 1 });

    expect(service.buy(2, 35)).toBe(true);
    expect(service.getVesselRushBonuses()).toEqual({ vesselCount: 4, durationSeconds: 2 });
  });

  it('only shows vessel houses at their Geometer unlock levels', () => {
    expect(service.getHousesView(19).some((house) => house.id === 'vessel-reward-house')).toBe(false);
    expect(service.getHousesView(20).some((house) => house.id === 'vessel-reward-house')).toBe(true);
    expect(service.getHousesView(34).some((house) => house.id === 'vessel-rush-house')).toBe(false);
    expect(service.getHousesView(35).some((house) => house.id === 'vessel-rush-house')).toBe(true);
  });

  it('applies vessel reward and spawn frequency improvements from the new house', () => {
    resources.setMonsterEssence(100);
    resources.setResourceAmounts({
      'cargo-scrap': 100,
      'warship-cell': 100,
      'hunter-beacon': 100,
    });

    expect(service.buy(3, 20)).toBe(true);
    expect(service.getVesselUpgradeBonuses()).toEqual({
      rewardMultiplier: 1.1,
      spawnIntervalFactor: 0.9,
    });
  });
});
