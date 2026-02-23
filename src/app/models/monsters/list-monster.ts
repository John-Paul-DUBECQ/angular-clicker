import { Monster } from "./monster.model";

export const listMonster: Monster[] = [
  {
    id: 'monster1',
    name: 'Mosh',
    description: 'Mosh est un vrai monstre, il porte bien son nom.',
    imageUrl: 'assets/imgUpgrades/shadocks/mosh.png',
    doesAppearInGame: false,
    bought: false,
    lootMultiplier: 1,
    probabilityToSpawn: 100,
  },
  {
    id: 'monster2',
    name: 'Super-Mosh',
    description: 'Super-Mosh est un Mosh qui a muté, C\'est dire à quel point il est idiot.',
    imageUrl: 'assets/imgUpgrades/shadocks/mosh.png',
    doesAppearInGame: false,
    bought: false,
    lootMultiplier: 2,
    probabilityToSpawn: 1,
  },
];

