import { Monster } from "./monster.model";
import { UnlockMethod } from '../unlocks/unlock-method';
import { MONSTER_WORKER_INDEX } from '../unlocks/monster-unlock';

export const listMonster: Monster[] = [
  {
    id: 'monster1',
    name: 'Mosh',
    description: 'Mosh est un vrai monstre, il porte bien son nom.',
    imageUrl: 'assets/img/shadocks/mosh.png',
    doesAppearInGame: false,
    unlockMethod: UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, 1),
    lootMultiplier: 1,
    probabilityToSpawn: 100,
    drops: [
      { resourceId: 'food', amount: 1 },
      { resourceId: 'mosh-tooth', amount: 1 },
      { resourceId: 'mosh-tail', amount: 1/3 },
    ],
  },
  {
    id: 'monster2',
    name: 'Super-Mosh',
    description: 'Super-Mosh est un Mosh qui a muté, C\'est dire à quel point il est idiot.',
    imageUrl: 'assets/img/shadocks/mosh.png',
    doesAppearInGame: false,
    unlockMethod: UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, 5),
    lootMultiplier: 2,
    probabilityToSpawn: 1,
    drops: [
      { resourceId: 'food', amount: 2 },
      { resourceId: 'super-mosh-core', amount: 1 },
    ],
  },{
    id: 'monster3',
    name: 'Gribouy',
    description: 'Gribouy est un petit être très robuste, mais il a une phobie de ses mains, il faut donc le tuer avec ses propres mains.',
    imageUrl: 'assets/img/shadocks/gribouyi.png',
    doesAppearInGame: false,
    unlockMethod: UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, 10),
    lootMultiplier: 3,
    probabilityToSpawn: 20,
    drops: [
      { resourceId: 'food', amount: 1 },
      { resourceId: 'gribouy-ink', amount: 1 },
    ],
  },
  {
    id: 'monster4',
    name: "Calque",
    imageUrl: 'assets/img/shadocks/aquaticMobs/calque.png',
    description: 'Calque est un monstre très rapide, il est donc difficile à tuer.',
    doesAppearInGame: false,
    unlockMethod: UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, 1),
    probabilityToSpawn: 10,
    drops: [
      { resourceId: 'sea-food', amount: 2 },
    ],
  }, 
  {
    id: 'monster5',
    name: "Molusk",
    imageUrl: 'assets/img/shadocks/aquaticMobs/molusk.png',
    description: 'Molusk est un monstre très fort, il est donc difficile à tuer.',
    doesAppearInGame: false,
    unlockMethod: UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, 10),
    probabilityToSpawn: 10,
    drops: [
      { resourceId: 'sea-food', amount: 1 },
      { resourceId: 'shell', amount: 1/2 },
    ],
  }, 
  {
    id: 'monster6',
    name: "Peji",
    imageUrl: 'assets/img/shadocks/aquaticMobs/peji.png',
    description: 'Peji est un monstre très mystérieux, il est donc difficile à tuer.',
    doesAppearInGame: false,
    unlockMethod: UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, 10),
    probabilityToSpawn: 10,
    lootMultiplier: 2,
    drops: [
      { resourceId: 'sea-food', amount: 2 },
      { resourceId: 'mermaid-tail', amount: 1/2 },
    ],
  }, 
  {
    id: 'monster7',
    name: "Pwaskay",
    imageUrl: 'assets/img/shadocks/aquaticMobs/pwaskay.png',
    description: 'Pwaskay est un monstre très étrange, il est donc difficile à tuer.',
    doesAppearInGame: false,
    unlockMethod: UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, 10),
    probabilityToSpawn: 10,
    drops: [
      { resourceId: 'sea-food', amount: 2 },
      { resourceId: 'bulb', amount: 1/4 },
    ],
  },

];

