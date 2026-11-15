import { getUpcomingPowerUnlockTiers } from './power-unlock';
import { VESSEL_WORKER_INDEX } from './vessel';

describe('getUpcomingPowerUnlockTiers', () => {
  it('lists Rafale stellaire as the Geometer level 35 milestone', () => {
    const tiers = getUpcomingPowerUnlockTiers(VESSEL_WORKER_INDEX, 31);

    expect(tiers.some((tier) => tier.name === 'Rafale stellaire' && tier.levelRequired === 35)).toBe(true);
  });
});
