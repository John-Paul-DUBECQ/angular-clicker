import { PrimeStateService } from './prime-state.service';
import { ResourcesService } from '../game/resources.service';
import { UnlockUpgradeService } from '../game/unlock-upgrade.service';
import { ShopItem } from '../shop-item';
import { pickPrimeMonster, formatRespectGain, PRIME_DELAY_MS, PRIME_HP_PER_SECOND_MAX, PRIME_MAX_OFFERS, PRIME_SPAWN_MIN_MS, PRIME_SPAWN_MAX_MS, PRIME_LISTING_MIN_MS, PRIME_LISTING_MAX_MS } from './prime.model';
import { Monster } from '../monsters/monster.model';
import { UnlockContext } from '../unlocks/unlock-method';

describe('PrimeStateService', () => {
  const context: UnlockContext = {
    clicks: 0,
    getWorkerLevel: () => 125,
  };
  let resources: ResourcesService;
  let upgrades: UnlockUpgradeService;
  let primes: PrimeStateService;

  beforeEach(() => {
    resources = new ResourcesService();
    upgrades = new UnlockUpgradeService();
    primes = new PrimeStateService(resources, upgrades);
  });

  it('exclut un monstre qui ne peut pas apparaître dans une prime', () => {
    const monsters: Monster[] = [
      {
        id: 'hidden',
        name: 'Caché',
        description: '',
        biome: 'forest',
        doesAppearInGame: false,
        canAppearInPrime: false,
      },
      {
        id: 'visible',
        name: 'Visible',
        description: '',
        biome: 'forest',
        doesAppearInGame: false,
        canAppearInPrime: true,
        unlockMethod: undefined,
      },
    ];

    expect(pickPrimeMonster(monsters, 'forest', 0)?.id).toBe('visible');
  });

  it('affiche le gain sous la forme entier + pourcentage et l\'applique à la prime', () => {
    upgrades.setShopItems([
      bought('respect-flat', 4),
      bought('respect-percent', 0.25),
    ]);
    primes.setSaveData({
      respect: 0,
      nextPrimeAt: 10_000,
      unseen: false,
      offers: [{
        id: 'prime-1',
        monsterId: 'monster1',
        biome: 'forest',
        rolledSeconds: 20,
        hpPerSecond: 1000,
        expiresAt: 500_000,
      }],
      nextTraderAt: 99_000,
      traders: [],
    });

    const view = primes.getView(1_000, 'forest', true, context);
    expect(view.offers[0]?.gainLabel).toBe(formatRespectGain(100, 4, 0.25));
    expect(view.offers[0]?.gainLabel).toBe('104 + 25% des bonus');
    expect(view.offers[0]?.gain).toBe(130);
    expect(view.offers[0]?.loss).toBe(8);
    expect(view.offers[0]?.hpPerSecond).toBe(PRIME_HP_PER_SECOND_MAX);
    expect(view.gainLabel).toBe('Mosh : 104 + 25% des bonus');

    expect(primes.beginFight('prime-1')).toBeTrue();
    primes.onPrimeResolved(true);
    expect(primes.getRespect()).toBe(130);

    primes.setSaveData({
      ...primes.getSaveData(),
      offers: [{
        id: 'prime-2',
        monsterId: 'monster1',
        biome: 'forest',
        rolledSeconds: 30,
        hpPerSecond: 80,
        expiresAt: 500_000,
      }],
    });
    expect(primes.beginFight('prime-2')).toBeTrue();
    primes.onPrimeResolved(false);
    expect(primes.getRespect()).toBe(122);
  });

  it('retire le respect de base quand un monstre sauvage n\'est pas tué à temps', () => {
    primes.setSaveData({
      respect: 10,
      nextPrimeAt: 1,
      unseen: false,
      offers: [],
      nextTraderAt: 1,
      traders: [],
    });
    primes.tick(1_000, 'forest', true);
    primes.onWildDefeat('monster1');
    expect(primes.getRespect()).toBe(2);
    primes.onWildDefeat('monster1');
    expect(primes.getRespect()).toBe(0);
  });

  it('fait apparaître des marchands différents et réduit le prix en or', () => {
    spyOn(Math, 'random').and.returnValue(0);
    upgrades.setShopItems([bought('discount', 0.1)]);
    primes.setSaveData({
      respect: 300,
      nextPrimeAt: 9_000_000,
      unseen: false,
      offers: [{
        id: 'prime-hold',
        monsterId: 'monster1',
        biome: 'forest',
        rolledSeconds: 20,
        hpPerSecond: 50,
        expiresAt: 9_000_000,
      }],
      nextTraderAt: 1_000,
      traders: [],
    });

    primes.tick(1_000, 'forest', true, { chanceBonus: 0, extraDurationSeconds: 60 });
    primes.tick(1_000 + 5 * 60 * 1000, 'forest', true, { chanceBonus: 0, extraDurationSeconds: 60 });
    const view = primes.getView(1_000 + 5 * 60 * 1000, 'forest', true, context);
    const names = view.traders.map((trader) => trader.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names.length).toBe(2);

    resources.setClicks(45000);
    const bait = view.traders
      .reduce((trades, trader) => trades.concat(trader.trades), [] as typeof view.traders[0]['trades'])
      .find((trade) => trade.id === 'bram-baits');
    expect(bait?.discountedGoldCost).toBe(45000);
    expect(primes.buyTrade('bram-baits', context)).toBeTrue();
    expect(resources.getResourceAmount('bait')).toBe(5);
    expect(bait?.remaining).toBe(4);
  });

  it('bloque un échange quand le stock du passage est épuisé', () => {
    primes.setSaveData({
      respect: 0,
      nextPrimeAt: 9_000_000,
      unseen: false,
      offers: [],
      nextTraderAt: 9_000_000,
      traders: [{
        instanceId: 'trader-1',
        merchantId: 'bram',
        dialogue: 'Bonjour.',
        endsAt: 60_000,
        bought: { 'bram-baits': 3 },
      }],
    });
    resources.setClicks(500000);
    const view = primes.getView(1_000, 'forest', true, context);
    const bait = view.traders[0].trades.find((entry) => entry.id === 'bram-baits');
    expect(bait?.remaining).toBe(1);
    expect(primes.buyTrade('bram-baits', context, 10)).toBeTrue();
    expect(resources.getResourceAmount('bait')).toBe(5);
    expect(primes.buyTrade('bram-baits', context, 1)).toBeFalse();
  });

  it('refuse un échange verrouillé par le respect', () => {
    primes.setSaveData({
      respect: 10,
      nextPrimeAt: 9_000_000,
      unseen: false,
      offers: [],
      nextTraderAt: 9_000_000,
      traders: [{
        instanceId: 'trader-1',
        merchantId: 'lise',
        dialogue: 'Bonjour.',
        endsAt: 60_000,
      }],
    });
    resources.setResourceAmounts({ food: 100 });
    const view = primes.getView(1_000, 'forest', true, context);
    const trade = view.traders[0].trades.find((entry) => entry.id === 'lise-sea');
    expect(trade?.canBuy).toBeFalse();
    expect(primes.buyTrade('lise-sea', context)).toBeFalse();
  });

  it('paie l\'or, l\'essence et le butin quand le contrat est réussi', () => {
    primes.setSaveData({
      respect: 0,
      nextPrimeAt: 9_000_000,
      unseen: false,
      offers: [{
        id: 'prime-pay',
        monsterId: 'monster1',
        biome: 'forest',
        rolledSeconds: 20,
        hpPerSecond: 20,
        expiresAt: 500_000,
        reward: { gold: 250, essence: 7, resources: [{ resourceId: 'food', amount: 3 }] },
      }],
      nextTraderAt: 9_000_000,
      traders: [],
    });

    const view = primes.getView(1_000, 'forest', true, context);
    expect(view.offers[0].rewardLabel).toContain('250 or');
    expect(view.offers[0].rewardLabel).toContain('7 essence');
    expect(view.offers[0].rewardLabel).toContain('3');

    expect(primes.beginFight('prime-pay')).toBeTrue();
    primes.onPrimeResolved(true);
    expect(resources.getClicks()).toBe(250);
    expect(resources.getMonsterEssence()).toBe(7);
    expect(resources.getResourceAmount('food')).toBe(3);
  });

  it('garde au plus trois primes, les retire à l\'échéance sans perte, et rapproche le spawn si le panneau est vide', () => {
    spyOn(Math, 'random').and.returnValue(0);
    const offers = [1, 2, 3].map((index) => ({
      id: `prime-${index}`,
      monsterId: 'monster1',
      biome: 'forest' as const,
      rolledSeconds: 20,
      hpPerSecond: 50,
      expiresAt: 1_000 + PRIME_LISTING_MIN_MS,
    }));
    primes.setSaveData({
      respect: 40,
      nextPrimeAt: 1_000,
      unseen: false,
      offers,
      nextTraderAt: 9_000_000,
      traders: [],
    });

    const full = primes.getView(1_000, 'forest', true, context);
    expect(full.offers.length).toBe(PRIME_MAX_OFFERS);
    expect(full.nextPrimeInSeconds).toBe(0);
    expect(primes.getRespect()).toBe(40);

    const afterExpiry = primes.getView(1_000 + PRIME_LISTING_MIN_MS, 'forest', true, context);
    expect(afterExpiry.offers.length).toBe(0);
    expect(primes.getRespect()).toBe(40);
    expect(afterExpiry.nextPrimeInSeconds).toBe(PRIME_DELAY_MS / 1000);

    const spawned = primes.getView(1_000 + PRIME_LISTING_MIN_MS + PRIME_DELAY_MS, 'forest', true, context);
    expect(spawned.offers.length).toBe(1);
    expect(spawned.offers[0].remainingSeconds).toBeGreaterThanOrEqual(PRIME_LISTING_MIN_MS / 1000);
    expect(spawned.offers[0].remainingSeconds).toBeLessThanOrEqual(PRIME_LISTING_MAX_MS / 1000);
    expect(spawned.nextPrimeInSeconds).toBeGreaterThanOrEqual(PRIME_SPAWN_MIN_MS / 1000);
    expect(spawned.nextPrimeInSeconds).toBeLessThanOrEqual(PRIME_SPAWN_MAX_MS / 1000);
  });
});

function bought(type: string, value: number): ShopItem {
  return {
    name: type,
    description: type,
    price: 1,
    bought: true,
    unlockUpgrade: { unlockId: 'prime', type, value },
  };
}
