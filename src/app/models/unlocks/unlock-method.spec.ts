import { UnlockContext, UnlockMethod } from './unlock-method';

describe('UnlockMethod', () => {
  const context: UnlockContext = {
    clicks: 100,
    totalManualClicks: 20,
    getWorkerLevel: (workerIndex) => workerIndex === 2 ? 10 : null,
    getShopItemBought: (ref) => ref === 'training',
    getEssenceShopItemLevel: (itemId) => itemId === 'bait' ? 2 : 0,
    getHouseLevel: (houseId) => houseId === 'mine' ? 3 : 0,
    getPowerBought: (powerId) => powerId === 'fire',
  };

  it('évalue les moyens d’unlock principaux', () => {
    expect(UnlockMethod.workerLevel(2, 10).isUnlocked(context)).toBeTrue();
    expect(UnlockMethod.minClicks(101).isUnlocked(context)).toBeFalse();
    expect(UnlockMethod.shopItemBought('training').isUnlocked(context)).toBeTrue();
    expect(UnlockMethod.essenceShopLevel('bait', 2).isUnlocked(context)).toBeTrue();
    expect(UnlockMethod.houseLevel('mine', 4).isUnlocked(context)).toBeFalse();
    expect(UnlockMethod.powerBought('fire').isUnlocked(context)).toBeTrue();
  });

  it('combine les conditions avec all et any', () => {
    const workerAndShop = UnlockMethod.all(
      UnlockMethod.workerLevel(2, 10),
      UnlockMethod.shopItemBought('training')
    );
    expect(workerAndShop.isUnlocked(context)).toBeTrue();
    expect(UnlockMethod.any(UnlockMethod.minClicks(101), UnlockMethod.houseLevel('mine', 3))
      .isUnlocked(context)).toBeTrue();
  });
});