import { getStreakStats, processStreakOnClick } from './streak';

describe('streak click progress', () => {
  it('accepts fractional extra progress from click bonuses', () => {
    const result = processStreakOnClick(0, 'filling', 10, undefined, 1.1);

    expect(result.barCurrent).toBeCloseTo(1.1, 10);
  });

  it('applies shop bonuses to damage, required clicks, and bar decay', () => {
    const base = getStreakStats(10);
    const upgraded = getStreakStats(10, undefined, {
      damage: 0.1,
      clicks: 0.1,
      decay: 0.1,
    });

    expect(upgraded.damageMultiplier).toBeCloseTo(base.damageMultiplier * 1.1, 10);
    expect(upgraded.numberOfClicksRequiredForBar).toBe(
      Math.max(1, Math.ceil(base.numberOfClicksRequiredForBar * 0.9))
    );
    expect(upgraded.speedOfDecreaseOfBar).toBe(
      Math.floor(base.speedOfDecreaseOfBar * 0.9)
    );
  });
});
