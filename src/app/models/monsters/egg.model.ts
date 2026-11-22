import { GameResource } from '../resource';
import { WorkerUnlock } from '../unlocks/worker-unlock.model';
import { Monster } from './monster.model';
import { MonsterBiomeId } from './monster-biome.model';
import { listMonster } from './list-monster';

/** Le Fermier est le worker d'index 1. */
export const FARMER_WORKER_INDEX = 1;
export const EGG_FARMER_LEVEL_REQUIRED = 400;
/** 0,01 % par point de chance. */
export const EGG_DROP_CHANCE_PER_LUCK = 0.0001;
/** Chance de base, avant la chance, de tirer un œuf du biome à la loterie. */
export const LOTTERY_BIOME_EGG_CHANCE = 0.01;

export function eggResourceId(monsterId: string): string {
  return `egg-${monsterId}`;
}

/** Un œuf par monstre : le nom et l'identifiant suivent le monstre. */
export class EggResource implements GameResource {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly monsterId: string;
  readonly biome?: MonsterBiomeId;
  readonly imageUrl?: string | undefined;

  constructor(monster: Pick<Monster, 'id' | 'name' | 'biome'>) {
    this.monsterId = monster.id;
    this.biome = monster.biome;
    this.id = eggResourceId(monster.id);
    this.name = `Œuf de ${monster.name}`;
    this.description = `Un œuf de ${monster.name}.`;
    this.imageUrl = `assets/img/Monsters/${monster.id}.png`;
  }
}

export const EGG_RESOURCES: EggResource[] = listMonster.map((monster) => new EggResource(monster));

export const eggUnlockDefinition: WorkerUnlock = {
  id: 'eggs',
  name: 'Œufs',
  description: 'Les monstres peuvent lâcher leur œuf.',
  imageUrl: 'assets/img/Farmer/Farmer1.png',
  levelRequired: EGG_FARMER_LEVEL_REQUIRED,
};

export function areEggsUnlocked(getWorkerLevel: (workerIndex: number) => number | null): boolean {
  return (getWorkerLevel(FARMER_WORKER_INDEX) ?? 0) >= EGG_FARMER_LEVEL_REQUIRED;
}

export function findEggByMonsterId(monsterId: string): EggResource | undefined {
  return EGG_RESOURCES.find((egg) => egg.monsterId === monsterId);
}

export function findEggsByBiome(biome: MonsterBiomeId | undefined): EggResource[] {
  if (!biome) return [];
  return EGG_RESOURCES.filter((egg) => egg.biome === biome);
}

export function isEggResourceId(resourceId: string): boolean {
  return EGG_RESOURCES.some((egg) => egg.id === resourceId);
}
