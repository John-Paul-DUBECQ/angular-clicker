export type MonsterBiomeId = 'forest' | 'beach' | 'mine';

export interface MonsterBiome {
  id: MonsterBiomeId;
  name: string;
  description: string;
  levelCount?: number;
  unlockAfterCombatId?: string;
}

export const MONSTER_BIOMES: MonsterBiome[] = [
  { id: 'forest', name: 'Forêt', description: 'Les créatures de la forêt.', levelCount: 10 },
  {
    id: 'beach',
    name: 'Plage',
    description: 'Les monstres aquatiques.',
    levelCount: 10,
    unlockAfterCombatId: 'planned-forest-10',
  },
  {
    id: 'mine',
    name: 'Mine',
    description: 'Cette zone est encore en préparation.',
    unlockAfterCombatId: 'planned-beach-10',
  },
];

export function isMonsterBiomeId(value: unknown): value is MonsterBiomeId {
  return value === 'forest' || value === 'beach' || value === 'mine';
}
