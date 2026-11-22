import { collectChanceRewards, getChestLuckBonus, getEffectiveLuck, rollSuccesses } from './lottery.model';

describe('lottery luck', () => {
  it('starts at 1 once the lottery is unlocked and stays at 0 before', () => {
    expect(getEffectiveLuck(8, false)).toBe(0);
    expect(getEffectiveLuck(0, true)).toBe(1);
    expect(getEffectiveLuck(8, true)).toBe(9);
  });

  it('adds 0.01% chest chance per luck point', () => {
    expect(getChestLuckBonus(1)).toBeCloseTo(0.0001, 10);
    expect(getChestLuckBonus(600)).toBeCloseTo(0.06, 10);
  });

  it('grants extra copies when a chance goes past 100%', () => {
    const random = [0.1, 0];
    const rewards = collectChanceRewards(
      [{ resourceId: 'food', amount: 1, chance: 0.6 }],
      2,
      () => random.shift() ?? 0
    );
    expect(rewards).toEqual([{ resourceId: 'food', amount: 2 }]);
    expect(rollSuccesses(2, () => 0)).toBe(2);
    expect(rollSuccesses(0.25, () => 0.9)).toBe(0);
  });
});
