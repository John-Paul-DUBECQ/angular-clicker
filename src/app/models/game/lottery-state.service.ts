import { Injectable } from '@angular/core';
import { ResourceReward } from '../resource';
import { UnlockContext } from '../unlocks/unlock-method';
import {
  LIST_CHEST,
  LOTTERY_LOOT,
  LOTTERY_STATS,
  LOTTERY_UNLOCK_METHOD,
  ChestDefinition,
  LotteryView,
  getLotteryDropChance,
} from '../monsters/lottery.model';
import { ResourcesService } from './resources.service';

@Injectable({ providedIn: 'root' })
export class LotteryStateService {
  private lastActivation = 0;

  constructor(private resources: ResourcesService) {}

  getView(context: UnlockContext): LotteryView {
    const cooldownMs = LOTTERY_STATS.cooldownMinutes * 60 * 1000;
    return {
      ...LOTTERY_STATS,
      unlocked: LOTTERY_UNLOCK_METHOD.isUnlocked(context),
      cooldownRemainingSeconds: Math.max(
        0,
        Math.ceil((this.lastActivation + cooldownMs - Date.now()) / 1000)
      ),
    };
  }

  /**
   * Lance la loterie. `null` si elle est verrouillée ou en recharge.
   * Sinon une liste, éventuellement vide : chaque loot a sa propre chance, très faible.
   */
  tryActivate(context: UnlockContext): ResourceReward[] | null {
    const view = this.getView(context);
    if (!view.unlocked || view.cooldownRemainingSeconds > 0) return null;

    this.lastActivation = Date.now();
    const rewards = this.drawLotteryLoot(context);
    rewards.forEach((reward) => this.resources.addResource(reward.resourceId, reward.amount));
    return rewards;
  }

  private drawLotteryLoot(context: UnlockContext): ResourceReward[] {
    const rewards: ResourceReward[] = [];
    for (const drop of LOTTERY_LOOT) {
      if (drop.unlockMethod && !drop.unlockMethod.isUnlocked(context)) continue;
      if (Math.random() >= getLotteryDropChance(drop, LOTTERY_STATS.luckMultiplier)) continue;
      const amount = drop.amount * LOTTERY_STATS.dropsMultiplier;
      const wholeAmount = Math.floor(amount);
      const rewardAmount = wholeAmount + (Math.random() < amount - wholeAmount ? 1 : 0);
      rewards.push({ resourceId: drop.resourceId, amount: Math.max(1, rewardAmount) });
    }
    return rewards;
  }

  tryDropFromMonster(context: UnlockContext): ResourceReward[] {
    if (!LOTTERY_UNLOCK_METHOD.isUnlocked(context)) return [];
    const chance = Math.min(1, LOTTERY_STATS.monsterChestChance * LOTTERY_STATS.luckMultiplier);
    if (Math.random() >= chance) return [];

    const reward = this.drawChest(context);
    this.resources.addResource(reward.resourceId, reward.amount);
    return [reward];
  }

  openChest(context: UnlockContext, chestId: string): ResourceReward | null {
    if (!LOTTERY_UNLOCK_METHOD.isUnlocked(context)) return null;
    const chest = LIST_CHEST.find((entry) => entry.id === chestId);
    if (!chest || !(chest.unlockMethod?.isUnlocked(context) ?? true)) return null;
    const reward = this.drawDrop(context, chest);
    if (!this.resources.spendResources([{ resourceId: chest.resourceId, amount: 1 }])) return null;
    this.resources.addResource(reward.resourceId, reward.amount);
    return reward;
  }

  private drawChest(context: UnlockContext): ResourceReward {
    const chests = LIST_CHEST.filter((chest) => chest.unlockMethod?.isUnlocked(context) ?? true);
    const chest = this.pickWeighted(
      chests,
      (entry) => entry.weight * Math.pow(LOTTERY_STATS.luckMultiplier, this.getRarityRank(entry.rarity))
    );
    return { resourceId: chest.resourceId, amount: 1 };
  }

  private drawDrop(context: UnlockContext, chest: ChestDefinition): ResourceReward {
    const drops = chest.drops.filter((drop) => drop.unlockMethod?.isUnlocked(context) ?? true);
    const selectedDrop = this.pickWeighted(drops, (drop) => drop.probability);
    const amount = selectedDrop.amount * LOTTERY_STATS.dropsMultiplier;
    const wholeAmount = Math.floor(amount);
    const rewardAmount = wholeAmount + (Math.random() < amount - wholeAmount ? 1 : 0);
    return { resourceId: selectedDrop.resourceId, amount: Math.max(1, rewardAmount) };
  }

  private pickWeighted<T>(entries: T[], getWeight: (entry: T) => number): T {
    const totalWeight = entries.reduce((total, entry) => total + Math.max(0, getWeight(entry)), 0);
    if (entries.length === 0 || totalWeight <= 0) {
      throw new Error('Impossible de tirer une récompense : aucune entrée éligible.');
    }

    let roll = Math.random() * totalWeight;
    for (const entry of entries) {
      const weight = Math.max(0, getWeight(entry));
      if (roll < weight) return entry;
      roll -= weight;
    }
    return entries[entries.length - 1];
  }

  private getRarityRank(rarity: string): number {
    switch (rarity) {
      case 'Rare': return 1;
      case 'Épique': return 2;
      default: return 0;
    }
  }

  getLastActivation(): number {
    return this.lastActivation;
  }

  setLastActivation(timestamp: number | undefined): void {
    this.lastActivation = typeof timestamp === 'number' && Number.isFinite(timestamp) && timestamp > 0
      ? timestamp
      : 0;
  }

  resetActivation(): void {
    this.lastActivation = 0;
  }
}
