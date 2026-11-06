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
    const house = service.getHousesView().find((entry) => entry.id === 'vessel-rush-house');

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

    expect(service.buy(2)).toBe(true);
    expect(service.getVesselRushBonuses()).toEqual({ vesselCount: 2, durationSeconds: 1 });

    expect(service.buy(2)).toBe(true);
    expect(service.getVesselRushBonuses()).toEqual({ vesselCount: 4, durationSeconds: 2 });
  });
});
