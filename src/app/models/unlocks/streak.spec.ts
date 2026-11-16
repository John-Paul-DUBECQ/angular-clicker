import { processStreakOnClick } from './streak';

describe('streak click progress', () => {
  it('accepts fractional extra progress from click bonuses', () => {
    const result = processStreakOnClick(0, 'filling', 10, undefined, 1.1);

    expect(result.barCurrent).toBeCloseTo(1.1, 10);
  });
});
