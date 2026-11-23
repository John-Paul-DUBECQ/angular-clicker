import { Injectable, Optional } from '@angular/core';
import { listMonster } from '../monsters/list-monster';
import { Monster } from '../monsters/monster.model';
import { MonsterBiomeId } from '../monsters/monster-biome.model';
import { RESOURCE_DEFINITIONS } from '../resource';
import { UnlockContext } from '../unlocks/unlock-method';
import { UnlockUpgradeService } from '../game/unlock-upgrade.service';
import { ResourcesService } from '../game/resources.service';
import { MonsterRewardNotificationService } from '../game/monster-reward-notification.service';
import {
  buildPrimeReward,
  discountedGoldCost,
  formatPrimeAmount,
  formatRespectGain,
  pickPrimeMonster,
  primeRespectGainBase,
  primeRespectLoss,
  randomInt,
  round2,
  respectGain,
  PRIME_DELAY_MS,
  PRIME_HP_PER_SECOND_MAX,
  PRIME_HP_PER_SECOND_MIN,
  PRIME_LISTING_MAX_MS,
  PRIME_LISTING_MIN_MS,
  PRIME_MAX_OFFERS,
  PRIME_MERCHANTS,
  PRIME_SPAWN_MAX_MS,
  PRIME_SPAWN_MIN_MS,
  PRIME_TIME_MAX_SECONDS,
  PRIME_TIME_MIN_SECONDS,
  PRIME_TRADES,
  PrimeBoardView,
  PrimeContractReward,
  PrimeHouseBonuses,
  PrimeOfferData,
  PrimeOfferView,
  PrimeSaveData,
  PrimeTraderData,
  PrimeTraderView,
  TRADER_BASE_DURATION_MS,
  TRADER_INTERVAL_MS,
} from './prime.model';

const EMPTY_HOUSE_BONUSES: PrimeHouseBonuses = { chanceBonus: 0, extraDurationSeconds: 0 };

@Injectable({ providedIn: 'root' })
export class PrimeStateService {
  private respect = 0;
  private nextPrimeAt = 0;
  private unseen = false;
  private offers: PrimeOfferData[] = [];
  private fightOfferId: string | null = null;
  private nextTraderAt = 0;
  private traders: PrimeTraderData[] = [];
  private nextInstanceId = 1;
  private nextOfferId = 1;
  private boardUnlocked = false;
  private lastNow = Date.now();

  constructor(
    private resources: ResourcesService,
    @Optional() private unlockUpgrades?: UnlockUpgradeService,
    @Optional() private rewardNotify?: MonsterRewardNotificationService
  ) {}

  getRespect(): number {
    return this.respect;
  }

  isBoardUnlocked(): boolean {
    return this.boardUnlocked;
  }

  getUnseen(): boolean {
    return this.unseen;
  }

  markSeen(): void {
    this.unseen = false;
  }

  getOffer(offerId: string): PrimeOfferData | null {
    const offer = this.offers.find((entry) => entry.id === offerId);
    return offer ? { ...offer } : null;
  }

  getFightDurationSeconds(offerId: string): number {
    const offer = this.offers.find((entry) => entry.id === offerId);
    if (!offer) return 0;
    return offer.rolledSeconds + this.timeBonusSeconds();
  }

  beginFight(offerId: string): boolean {
    if (!this.offers.some((offer) => offer.id === offerId)) return false;
    this.fightOfferId = offerId;
    return true;
  }

  /** Abandon du combat : le contrat reste affiché et aucun respect n'est retiré. */
  endFight(): void {
    this.fightOfferId = null;
  }

  tick(
    now: number,
    biome: MonsterBiomeId,
    unlocked: boolean,
    houseBonuses: PrimeHouseBonuses = EMPTY_HOUSE_BONUSES,
    baseProduction = 0
  ): void {
    this.lastNow = now;
    this.boardUnlocked = unlocked;
    this.traders = this.traders.filter((trader) => trader.endsAt > now);
    if (!unlocked) return;

    this.expireOffers(now);
    if (this.offers.length < PRIME_MAX_OFFERS) {
      if (this.nextPrimeAt <= 0) {
        this.nextPrimeAt = now + this.spawnDelay();
      } else if (this.offers.length === 0 && this.nextPrimeAt - now > PRIME_DELAY_MS) {
        this.nextPrimeAt = now + PRIME_DELAY_MS;
      } else if (now >= this.nextPrimeAt) {
        this.createOffer(biome, now, baseProduction);
      }
    }

    if (this.nextTraderAt <= 0) {
      this.nextTraderAt = now + TRADER_INTERVAL_MS;
    } else if (now >= this.nextTraderAt) {
      this.nextTraderAt = now + TRADER_INTERVAL_MS;
      this.trySpawnTrader(now, houseBonuses);
    }
  }

  onPrimeResolved(success: boolean): void {
    const offer = this.offers.find((entry) => entry.id === this.fightOfferId);
    this.fightOfferId = null;
    if (!offer) return;
    const monster = listMonster.find((entry) => entry.id === offer.monsterId);
    if (success) {
      const gain = respectGain(
        monster ? primeRespectGainBase(monster) : 100,
        this.flatBonus(),
        this.percentBonus()
      );
      this.respect += gain;
      this.payContract(offer.reward);
    } else {
      const loss = monster ? primeRespectLoss(monster) : 2;
      this.respect = Math.max(0, this.respect - loss);
    }
    this.removeOffer(offer.id);
  }

  onWildDefeat(monsterId: string | null): void {
    if (!this.boardUnlocked) return;
    const monster = monsterId ? listMonster.find((entry) => entry.id === monsterId) : undefined;
    const loss = monster ? primeRespectLoss(monster) : 2;
    this.respect = Math.max(0, this.respect - loss);
  }

  buyTrade(tradeId: string, context: UnlockContext, quantity = 1): boolean {
    const trade = PRIME_TRADES.find((entry) => entry.id === tradeId);
    const trader = this.traders.find((entry) =>
      entry.merchantId === trade?.merchantId && entry.endsAt > this.lastNow
    );
    if (!trade || !trader) return false;
    const liveContext = this.withRespect(context);
    if (trade.unlockMethod && !trade.unlockMethod.isUnlocked(liveContext)) return false;

    const gold = trade.goldCost != null
      ? discountedGoldCost(trade.goldCost, this.discountBonus())
      : 0;
    const costs = trade.costs ?? [];
    const bought = trader.bought?.[trade.id] ?? 0;
    const remaining = Math.max(0, trade.maxPerVisit - bought);
    let qty = Math.floor(Math.min(quantity, remaining));
    if (gold > 0) qty = Math.min(qty, Math.floor(this.resources.getClicks() / gold));
    costs.forEach((cost) => {
      if (cost.amount > 0) {
        qty = Math.min(qty, Math.floor(this.resources.getResourceAmount(cost.resourceId) / cost.amount));
      }
    });
    if (qty < 1) return false;

    const goldCost = gold * qty;
    const scaledCosts = costs.map((cost) => ({ resourceId: cost.resourceId, amount: cost.amount * qty }));
    if (goldCost > 0 && !this.resources.spendClicks(goldCost)) return false;
    if (scaledCosts.length > 0 && !this.resources.spendResources(scaledCosts)) {
      if (goldCost > 0) this.resources.addClicks(goldCost);
      return false;
    }
    if (trade.goldReward) this.resources.addClicks(trade.goldReward * qty);
    if (trade.essenceReward) this.resources.addMonsterEssence(trade.essenceReward * qty);
    (trade.resourceRewards ?? []).forEach((reward) => {
      this.resources.addResource(reward.resourceId, reward.amount * qty);
    });
    trader.bought = { ...(trader.bought ?? {}), [trade.id]: bought + qty };
    return true;
  }

  getView(
    now: number,
    biome: MonsterBiomeId,
    unlocked: boolean,
    context: UnlockContext,
    houseBonuses: PrimeHouseBonuses = EMPTY_HOUSE_BONUSES,
    baseProduction = 0
  ): PrimeBoardView {
    this.tick(now, biome, unlocked, houseBonuses, baseProduction);
    const liveContext = this.withRespect(context);
    const flat = this.flatBonus();
    const percent = this.percentBonus();
    const offers = this.offers
      .map((offer) => this.toOfferView(offer, flat, percent, now))
      .filter((offer): offer is PrimeOfferView => offer != null);
    return {
      unlocked,
      respect: this.respect,
      gainLabel: offers.length > 0
        ? offers.map((offer) => `${offer.monsterName} : ${offer.gainLabel}`).join(' · ')
        : `Bonus : +${flat} + ${Math.round(percent * 100)}%`,
      offers,
      nextPrimeInSeconds: this.offers.length >= PRIME_MAX_OFFERS
        ? 0
        : Math.max(0, Math.ceil((this.nextPrimeAt - now) / 1000)),
      traders: this.traders.map((trader) => this.toTraderView(trader, now, liveContext)),
    };
  }

  getSaveData(): PrimeSaveData {
    return {
      respect: this.respect,
      nextPrimeAt: this.nextPrimeAt,
      unseen: this.unseen,
      offers: this.offers.map((offer) => ({ ...offer })),
      nextTraderAt: this.nextTraderAt,
      traders: this.traders.map((trader) => ({ ...trader })),
    };
  }

  setSaveData(data?: PrimeSaveData): void {
    if (!data) {
      this.respect = 0;
      this.nextPrimeAt = 0;
      this.unseen = false;
      this.offers = [];
      this.fightOfferId = null;
      this.nextTraderAt = 0;
      this.traders = [];
      this.nextInstanceId = 1;
      this.nextOfferId = 1;
      return;
    }
    this.respect = Math.max(0, Math.floor(data.respect || 0));
    this.nextPrimeAt = Number.isFinite(data.nextPrimeAt) ? data.nextPrimeAt : 0;
    this.unseen = data.unseen === true;
    const savedOffers = Array.isArray(data.offers)
      ? data.offers
      : data.offer ? [data.offer] : [];
    this.offers = savedOffers
      .map((offer) => this.normalizeOffer(offer))
      .filter((offer): offer is PrimeOfferData => offer != null)
      .slice(0, PRIME_MAX_OFFERS);
    this.fightOfferId = null;
    this.nextTraderAt = Number.isFinite(data.nextTraderAt) ? data.nextTraderAt : 0;
    this.traders = Array.isArray(data.traders)
      ? data.traders
        .filter((trader) =>
          trader
          && typeof trader.instanceId === 'string'
          && PRIME_MERCHANTS.some((merchant) => merchant.id === trader.merchantId)
          && Number.isFinite(trader.endsAt)
        )
        .map((trader) => ({
          instanceId: trader.instanceId,
          merchantId: trader.merchantId,
          dialogue: typeof trader.dialogue === 'string' ? trader.dialogue : '',
          endsAt: trader.endsAt,
          bought: this.normalizeBought(trader.bought),
        }))
      : [];
    this.nextInstanceId = this.traders.reduce((max, trader) => {
      const id = Number(trader.instanceId.replace('trader-', ''));
      return Number.isFinite(id) ? Math.max(max, id + 1) : max;
    }, 1);
    this.nextOfferId = this.offers.reduce((max, offer) => {
      const id = Number(offer.id.replace('prime-', ''));
      return Number.isFinite(id) ? Math.max(max, id + 1) : max;
    }, 1);
  }

  private expireOffers(now: number): void {
    const before = this.offers.length;
    this.offers = this.offers.filter((offer) =>
      offer.expiresAt > now || offer.id === this.fightOfferId
    );
    if (before > 0 && this.offers.length === 0) {
      this.nextPrimeAt = now + PRIME_DELAY_MS;
    } else if (before >= PRIME_MAX_OFFERS && this.offers.length < PRIME_MAX_OFFERS) {
      this.nextPrimeAt = now + this.spawnDelay();
    }
  }

  forceSpawnTrader(now: number, bonuses: PrimeHouseBonuses = EMPTY_HOUSE_BONUSES): boolean {
    this.lastNow = now;
    const used = new Set(this.traders.filter((trader) => trader.endsAt > now).map((trader) => trader.merchantId));
    const available = PRIME_MERCHANTS.filter((merchant) => !used.has(merchant.id));
    if (available.length === 0) return false;
    const merchant = available[Math.floor(Math.random() * available.length)];
    const dialogue = merchant.dialogues[Math.floor(Math.random() * merchant.dialogues.length)] ?? '';
    this.traders = this.traders.filter((trader) => trader.endsAt > now);
    this.traders.push({
      instanceId: `trader-${this.nextInstanceId++}`,
      merchantId: merchant.id,
      dialogue,
      endsAt: now + TRADER_BASE_DURATION_MS + bonuses.extraDurationSeconds * 1000,
      bought: {},
    });
    return true;
  }

  private createOffer(biome: MonsterBiomeId, now: number, baseProduction: number): void {
    if (this.offers.length >= PRIME_MAX_OFFERS) return;
    const monster = pickPrimeMonster(listMonster, biome, Math.random());
    if (!monster) {
      this.nextPrimeAt = now + 30 * 1000;
      return;
    }
    const rolledSeconds = randomInt(PRIME_TIME_MIN_SECONDS, PRIME_TIME_MAX_SECONDS, Math.random());
    this.offers.push({
      id: `prime-${this.nextOfferId++}`,
      monsterId: monster.id,
      biome,
      rolledSeconds,
      hpPerSecond: randomInt(PRIME_HP_PER_SECOND_MIN, PRIME_HP_PER_SECOND_MAX, Math.random()),
      expiresAt: now + randomInt(PRIME_LISTING_MIN_MS, PRIME_LISTING_MAX_MS, Math.random()),
      reward: buildPrimeReward(monster, baseProduction, rolledSeconds),
    });
    this.unseen = true;
    this.nextPrimeAt = now + this.spawnDelay();
  }

  private removeOffer(offerId: string): void {
    const wasFull = this.offers.length >= PRIME_MAX_OFFERS;
    this.offers = this.offers.filter((offer) => offer.id !== offerId);
    if (this.offers.length === 0) {
      this.nextPrimeAt = this.lastNow + PRIME_DELAY_MS;
    } else if (wasFull) {
      this.nextPrimeAt = this.lastNow + this.spawnDelay();
    }
  }

  private spawnDelay(): number {
    if (this.offers.length === 0) return PRIME_DELAY_MS;
    return randomInt(PRIME_SPAWN_MIN_MS, PRIME_SPAWN_MAX_MS, Math.random());
  }

  private trySpawnTrader(now: number, bonuses: PrimeHouseBonuses): void {
    const chance = Math.min(0.95, this.respect / 300 + bonuses.chanceBonus);
    if (Math.random() >= chance) return;
    const used = new Set(this.traders.map((trader) => trader.merchantId));
    const available = PRIME_MERCHANTS.filter((merchant) => !used.has(merchant.id));
    if (available.length === 0) return;
    const merchant = available[Math.floor(Math.random() * available.length)];
    const dialogue = merchant.dialogues[Math.floor(Math.random() * merchant.dialogues.length)] ?? '';
    this.traders.push({
      instanceId: `trader-${this.nextInstanceId++}`,
      merchantId: merchant.id,
      dialogue,
      endsAt: now + TRADER_BASE_DURATION_MS + bonuses.extraDurationSeconds * 1000,
      bought: {},
    });
  }

  private toOfferView(
    offer: PrimeOfferData,
    flat: number,
    percent: number,
    now: number
  ): PrimeOfferView | null {
    const monster = listMonster.find((entry) => entry.id === offer.monsterId);
    if (!monster) return null;
    const base = primeRespectGainBase(monster);
    return {
      id: offer.id,
      monsterId: monster.id,
      monsterName: monster.name,
      imageUrl: monster.imageUrl,
      biome: offer.biome,
      timeLimitSeconds: offer.rolledSeconds + this.timeBonusSeconds(),
      hpPerSecond: offer.hpPerSecond,
      gain: respectGain(base, flat, percent),
      loss: primeRespectLoss(monster),
      gainLabel: formatRespectGain(base, flat, percent),
      rewardLabel: this.rewardsLabel(offer.reward?.gold, offer.reward?.essence, offer.reward?.resources),
      remainingSeconds: Math.max(0, Math.ceil((offer.expiresAt - now) / 1000)),
    };
  }

  private toTraderView(trader: PrimeTraderData, now: number, context: UnlockContext): PrimeTraderView {
    const merchant = PRIME_MERCHANTS.find((entry) => entry.id === trader.merchantId);
    return {
      instanceId: trader.instanceId,
      merchantId: trader.merchantId,
      name: merchant?.name ?? trader.merchantId,
      imageUrl: merchant?.imageUrl,
      dialogue: trader.dialogue,
      remainingSeconds: Math.max(0, Math.ceil((trader.endsAt - now) / 1000)),
      trades: PRIME_TRADES
        .filter((trade) => trade.merchantId === trader.merchantId)
        .map((trade) => {
          const locked = trade.unlockMethod != null && !trade.unlockMethod.isUnlocked(context);
          const discounted = trade.goldCost != null
            ? discountedGoldCost(trade.goldCost, this.discountBonus())
            : undefined;
          const costs = (trade.costs ?? []).map((cost) => ({
            resourceId: cost.resourceId,
            name: this.resourceName(cost.resourceId),
            amount: cost.amount,
            owned: this.resources.getResourceAmount(cost.resourceId),
          }));
          const bought = trader.bought?.[trade.id] ?? 0;
          const remaining = Math.max(0, trade.maxPerVisit - bought);
          const goldOk = discounted == null || this.resources.getClicks() >= discounted;
          const resourcesOk = costs.every((cost) => cost.owned >= cost.amount);
          return {
            id: trade.id,
            name: trade.name,
            description: trade.description,
            goldCost: trade.goldCost,
            discountedGoldCost: discounted,
            costs,
            rewardsLabel: this.rewardsLabel(trade.goldReward, trade.essenceReward, trade.resourceRewards),
            canBuy: !locked && remaining > 0 && goldOk && resourcesOk,
            lockedReason: locked ? trade.unlockMethod?.description : undefined,
            maxPerVisit: trade.maxPerVisit,
            remaining,
          };
        }),
    };
  }

  private rewardsLabel(
    goldReward?: number,
    essenceReward?: number,
    resources?: { resourceId: string; amount: number }[]
  ): string {
    const parts: string[] = [];
    if (goldReward) parts.push(`${formatPrimeAmount(goldReward)} or`);
    if (essenceReward) parts.push(`${formatPrimeAmount(essenceReward)} essence`);
    (resources ?? []).forEach((reward) => {
      parts.push(`${formatPrimeAmount(reward.amount)} ${this.resourceName(reward.resourceId)}`);
    });
    return parts.join(', ');
  }

  private resourceName(resourceId: string): string {
    return RESOURCE_DEFINITIONS.find((resource) => resource.id === resourceId)?.name ?? resourceId;
  }

  private normalizeBought(bought: Record<string, number> | undefined): Record<string, number> {
    if (!bought) return {};
    return Object.entries(bought).reduce((next, [id, count]) => {
      if (Number.isFinite(count) && count > 0) next[id] = Math.floor(count);
      return next;
    }, {} as Record<string, number>);
  }

  private withRespect(context: UnlockContext): UnlockContext {
    return {
      ...context,
      getRespect: () => this.respect,
    };
  }

  private flatBonus(): number {
    return this.unlockUpgrades?.getBonus('prime', 'respect-flat') ?? 0;
  }

  private percentBonus(): number {
    return this.unlockUpgrades?.getBonus('prime', 'respect-percent') ?? 0;
  }

  private timeBonusSeconds(): number {
    return Math.max(0, this.unlockUpgrades?.getBonus('prime', 'time') ?? 0);
  }

  private discountBonus(): number {
    return this.unlockUpgrades?.getBonus('prime', 'discount') ?? 0;
  }

  private normalizeOffer(offer: PrimeOfferData | null | undefined): PrimeOfferData | null {
    if (!offer) return null;
    const monster = listMonster.find((entry) => entry.id === offer.monsterId);
    if (!monster || monster.canAppearInPrime === false) return null;
    const id = typeof offer.id === 'string' && offer.id.length > 0
      ? offer.id
      : `prime-${this.nextOfferId++}`;
    return {
      id,
      monsterId: offer.monsterId,
      biome: offer.biome,
      rolledSeconds: Math.max(PRIME_TIME_MIN_SECONDS, Math.floor(offer.rolledSeconds || PRIME_TIME_MIN_SECONDS)),
      hpPerSecond: Math.min(
        PRIME_HP_PER_SECOND_MAX,
        Math.max(PRIME_HP_PER_SECOND_MIN, Math.floor(offer.hpPerSecond || PRIME_HP_PER_SECOND_MIN))
      ),
      expiresAt: Number.isFinite(offer.expiresAt) ? offer.expiresAt : this.lastNow + PRIME_LISTING_MIN_MS,
      reward: this.normalizeReward(offer.reward, monster),
    };
  }

  private normalizeReward(reward: PrimeContractReward | undefined, monster: Monster): PrimeContractReward {
    if (reward && Number.isFinite(reward.gold) && Number.isFinite(reward.essence)) {
      return {
        gold: Math.max(0, round2(reward.gold)),
        essence: Math.max(0, round2(reward.essence)),
        resources: Array.isArray(reward.resources)
          ? reward.resources
            .filter((entry) => entry && typeof entry.resourceId === 'string' && entry.amount > 0)
            .map((entry) => ({ resourceId: entry.resourceId, amount: round2(entry.amount) }))
          : [],
      };
    }
    return buildPrimeReward(monster, 0, PRIME_TIME_MIN_SECONDS);
  }

  private payContract(reward: PrimeContractReward | undefined): void {
    if (!reward) return;
    if (reward.gold > 0) this.resources.addClicks(reward.gold);
    if (reward.essence > 0) this.resources.addMonsterEssence(reward.essence);
    reward.resources.forEach((entry) => this.resources.addResource(entry.resourceId, entry.amount));
    this.rewardNotify?.notifyReward(reward.gold, reward.essence, reward.resources, 'Prime réussie');
  }
}
