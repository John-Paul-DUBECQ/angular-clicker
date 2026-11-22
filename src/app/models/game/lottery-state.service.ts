import { Injectable } from '@angular/core';
import { ResourceReward } from '../resource';
import { UnlockContext } from '../unlocks/unlock-method';
import { MonsterBiomeId, MONSTER_BIOMES } from '../monsters/monster-biome.model';
import { MissionStateService } from './mission-state.service';
import {
  LIST_CHEST,
  LOTTERY_LOOT,
  LOTTERY_STATS,
  LOTTERY_UNLOCK_METHOD,
  ChestDefinition,
  LotteryView,
  collectChanceRewards,
  getChestLuckBonus,
  getEffectiveLuck,
  rollSuccesses,
} from '../monsters/lottery.model';
import {
  EGG_DROP_CHANCE_PER_LUCK,
  LOTTERY_BIOME_EGG_CHANCE,
  areEggsUnlocked,
  findEggByMonsterId,
  findEggsByBiome,
} from '../monsters/egg.model';
import { Monster } from '../monsters/monster.model';
import { ResourcesService } from './resources.service';
import { KitchenStateService } from '../kitchen/kitchen-state.service';

@Injectable({ providedIn: 'root' })
export class LotteryStateService {
  private lastActivation = 0;

  constructor(
    private resources: ResourcesService,
    private kitchen: KitchenStateService,
    private missionState: MissionStateService,
  ) {}

  getView(context: UnlockContext, biome: MonsterBiomeId = 'forest'): LotteryView {
    const cooldownMs = LOTTERY_STATS.cooldownMinutes * 60 * 1000;
    const unlocked = LOTTERY_UNLOCK_METHOD.isUnlocked(context);
    const luck = this.getLuck(context);
    const biomeEggs = findEggsByBiome(biome);
    return {
      ...LOTTERY_STATS,
      unlocked,
      cooldownRemainingSeconds: Math.max(
        0,
        Math.ceil((this.lastActivation + cooldownMs - Date.now()) / 1000)
      ),
      luck,
      chestLuckBonus: getChestLuckBonus(luck),
      biomeName: MONSTER_BIOMES.find((entry) => entry.id === biome)?.name ?? biome,
      biomeEggAvailable: areEggsUnlocked(context.getWorkerLevel) && biomeEggs.length > 0,
      biomeEggChance: LOTTERY_BIOME_EGG_CHANCE,
    };
  }

  /**
   * Lance la loterie. `null` si elle est verrouillée ou en recharge.
   * Sinon une liste, éventuellement vide : chaque loot a sa propre chance.
   * La chance multiplie ces chances et peut donner plusieurs exemplaires au-dessus de 100 %.
   */
  tryActivate(context: UnlockContext, biome: MonsterBiomeId = 'forest'): ResourceReward[] | null {
    const view = this.getView(context, biome);
    if (!view.unlocked || view.cooldownRemainingSeconds > 0) return null;

    this.lastActivation = Date.now();
    const rewards = this.drawLotteryLoot(context, biome, view.luck);
    rewards.forEach((reward) => this.resources.addResource(reward.resourceId, reward.amount));
    return rewards;
  }

  private drawLotteryLoot(context: UnlockContext, biome: MonsterBiomeId, luck: number): ResourceReward[] {
    const entries = LOTTERY_LOOT
      .filter((drop) => drop.unlockMethod?.isUnlocked(context) ?? true)
      .map((drop) => ({
        resourceId: drop.resourceId,
        amount: drop.amount * LOTTERY_STATS.dropsMultiplier,
        chance: drop.chance,
      }));
    const rewards = collectChanceRewards(entries, luck);
    const egg = this.drawBiomeEgg(context, biome, luck);
    if (egg) rewards.push(egg);
    return rewards;
  }

  private drawBiomeEgg(context: UnlockContext, biome: MonsterBiomeId, luck: number): ResourceReward | null {
    if (!areEggsUnlocked(context.getWorkerLevel)) return null;
    const eggs = findEggsByBiome(biome);
    if (eggs.length === 0) return null;
    const hits = rollSuccesses(LOTTERY_BIOME_EGG_CHANCE * Math.max(0, luck));
    if (hits <= 0) return null;
    const egg = eggs[Math.floor(Math.random() * eggs.length)];
    return { resourceId: egg.id, amount: hits };
  }

  tryDropFromMonster(context: UnlockContext): ResourceReward[] {
    if (!LOTTERY_UNLOCK_METHOD.isUnlocked(context)) return [];
    const luck = this.getLuck(context);
    const hits = rollSuccesses(LOTTERY_STATS.monsterChestChance + getChestLuckBonus(luck));
    const rewards: ResourceReward[] = [];
    for (let index = 0; index < hits; index += 1) {
      const reward = this.drawChest(context);
      this.resources.addResource(reward.resourceId, reward.amount);
      rewards.push(reward);
    }
    return rewards;
  }

  /** 0,01 % × chance de lâcher l'œuf de ce monstre, une fois le Fermier au niveau requis. */
  tryDropEgg(monster: Monster | undefined, context: UnlockContext): ResourceReward[] {
    if (!monster || !areEggsUnlocked(context.getWorkerLevel)) return [];
    const egg = findEggByMonsterId(monster.id);
    if (!egg) return [];
    const hits = rollSuccesses(EGG_DROP_CHANCE_PER_LUCK * this.getLuck(context));
    if (hits <= 0) return [];
    this.resources.addResource(egg.id, hits);
    return [{ resourceId: egg.id, amount: hits }];
  }

  openChest(context: UnlockContext, chestId: string): ResourceReward | null {
    this.missionState.recordChestOpening();
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
    const chest = this.pickWeighted(chests, (entry) => entry.weight);
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

  private getLuck(context: UnlockContext): number {
    return getEffectiveLuck(
      this.kitchen.getModifiers().luck,
      LOTTERY_UNLOCK_METHOD.isUnlocked(context)
    );
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
