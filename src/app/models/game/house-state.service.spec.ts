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
    const house = service.getHousesView(25).find((entry) => entry.id === 'vessel-rush-house');

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

    expect(service.buy(2, 25)).toBe(true);
    expect(service.getVesselRushBonuses()).toEqual({ vesselCount: 2, durationSeconds: 1 });

    expect(service.buy(2, 25)).toBe(true);
    expect(service.getVesselRushBonuses()).toEqual({ vesselCount: 4, durationSeconds: 2 });
  });

  it('only shows vessel houses at their Geometer unlock levels', () => {
    expect(service.getHousesView(19).some((house) => house.id === 'vessel-reward-house')).toBe(false);
    expect(service.getHousesView(20).some((house) => house.id === 'vessel-reward-house')).toBe(true);
    expect(service.getHousesView(24).some((house) => house.id === 'vessel-rush-house')).toBe(false);
    expect(service.getHousesView(25).some((house) => house.id === 'vessel-rush-house')).toBe(true);
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

    expect(service.buy(3, 20)).toBe(true);
    const levelTwoBonuses = service.getVesselUpgradeBonuses();
    expect(levelTwoBonuses.rewardMultiplier).toBeCloseTo(1.21, 10);
    expect(levelTwoBonuses.spawnIntervalFactor).toBeCloseTo(0.81, 10);
  });

  it('restores unlocked vessel houses from saved levels', () => {
    service.setLevels([0, 0, 0, 2]);

    const hangar = service.getHousesView(20).find((house) => house.id === 'vessel-reward-house');
    expect(hangar?.unlocked).toBe(true);
    expect(hangar?.level).toBe(2);
  });

  it('unlocks the solar hub at Astrologer 75 and reveals its two houses after purchase', () => {
    expect(service.getHousesView(0, 74).some((house) => house.id === 'solar-balance-house')).toBe(false);
    expect(service.getHousesView(0, 75).some((house) => house.id === 'solar-balance-house')).toBe(true);
    expect(service.getHousesView(0, 75).some((house) => house.id === 'solar-blue-house')).toBe(false);

    resources.setMonsterEssence(1000);
    resources.setResourceAmounts({
      bulb: 100,
      shell: 100,
      'mermaid-tail': 100,
      'gribouy-ink': 100,
    });

    expect(service.buy(4, 0, 75)).toBe(true);
    expect(service.getHousesView(0, 75).some((house) => house.id === 'solar-blue-house')).toBe(true);
    expect(service.getHousesView(0, 75).some((house) => house.id === 'solar-yellow-house')).toBe(true);
  });

  it('applies both solar damage exchanges at every balance-house level', () => {
    resources.setMonsterEssence(1000);
    resources.setResourceAmounts({ bulb: 100, shell: 100 });

    expect(service.buy(4, 0, 75)).toBe(true);
    expect(service.buy(4, 0, 75)).toBe(true);
    expect(service.getSolarDamageExchange(100, 200)).toEqual({
      clickDamageBonus: 1.2,
      autoDamageBonus: 10,
    });
  });

  it('activates only the matching blue or yellow house bonuses each minute', () => {
    resources.setMonsterEssence(1000);
    resources.setResourceAmounts({
      bulb: 100,
      shell: 100,
      'mermaid-tail': 100,
      'gribouy-ink': 100,
    });
    expect(service.buy(4, 0, 75)).toBe(true);
    expect(service.buy(5, 0, 75)).toBe(true);
    expect(service.buy(6, 0, 75)).toBe(true);

    const yellowPhase = service.getSolarBonuses(0);
    expect(yellowPhase.activeColor).toBe('yellow');
    expect(yellowPhase.monsterSpawnRateMultiplier).toBeCloseTo(1 / 0.95, 10);
    expect(yellowPhase.streakClickMultiplier).toBe(1.1);

    const bluePhase = service.getSolarBonuses(60000);
    expect(bluePhase.activeColor).toBe('blue');
    expect(bluePhase.clickRewardMultiplier).toBe(1.05);
    expect(bluePhase.autoDamageMultiplier).toBe(1.05);
    expect(bluePhase.manaPerClickBonus).toBe(0.1);
    expect(bluePhase.criticalChanceBonus).toBe(0.005);
    expect(bluePhase.criticalDamageMultiplier).toBe(1.05);
    expect(bluePhase.monsterSpawnRateMultiplier).toBe(1);
  });
});
