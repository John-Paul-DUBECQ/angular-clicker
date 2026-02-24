import { Monster } from "./monster.model";

export const listMonster: Monster[] = [
  {
    id: 'monster1',
    name: 'Mosh',
    description: 'Mosh est un vrai monstre, il porte bien son nom.',
    imageUrl: 'assets/imgUpgrades/shadocks/mosh.png',
    doesAppearInGame: false,
    lootMultiplier: 1,
    probabilityToSpawn: 100,
  },
  {
    id: 'monster2',
    name: 'Super-Mosh',
    description: 'Super-Mosh est un Mosh qui a muté, C\'est dire à quel point il est idiot.',
    imageUrl: 'assets/imgUpgrades/shadocks/mosh.png',
    doesAppearInGame: false,
    lootMultiplier: 2,
    probabilityToSpawn: 1,
  },{
    id: 'monster3',
    name: 'Gribouy',
    description: 'Gribouy est un petit être très robuste, mais il a une phobie de ses mains, il faut donc le tuer avec ses propres mains.',
    imageUrl: 'assets/imgUpgrades/shadocks/gribouyi.png',
    doesAppearInGame: false,
    lootMultiplier: 3,
    probabilityToSpawn: 20,
  }
];

