import { Power } from "./power.model";
import { UnlockMethod } from '../unlocks/unlock-method';
import { MONSTER_WORKER_INDEX } from '../unlocks/monster-unlock';
import { VESSEL_WORKER_INDEX } from '../unlocks/vessel';
import { POWER_WORKER_INDEX } from '../unlocks/worker-indexes';

export const listPower: Power[] = [
  {
    id: 'power',
    name: '힘',
    description: 'Dégâts ×2 pendant 1 minute. Coût en mana à chaque lancement.',
    imageUrl: 'assets/img/swords/Sword1.png',
    doesAppearInGame: false,
    bought: false,
    manaCost: 200,
    cooldownSeconds: 120,
    unlockMethod: UnlockMethod.workerLevel(POWER_WORKER_INDEX, 1),
  },
  {
    id: 'weakness',
    name: '약점',
    description: 'Baisse le montant total de combo nécessaire pour activer le buff et baisse la vitesse de redescente.',
    imageUrl: 'assets/img/swords/Sword1.png',
    doesAppearInGame: false,
    bought: false,
    manaCost: 400,
    cooldownSeconds: 300,
    unlockMethod: UnlockMethod.workerLevel(POWER_WORKER_INDEX, 9),
  },
  {
    id: 'spawn-mob',
    name: 'Invocation',
    description: 'Fait apparaître le prochain monstre immédiatement. Coûte 1 appât et 100 mana.',
    imageUrl: 'assets/img/swords/Sword1.png',
    doesAppearInGame: false,
    bought: false,
    manaCost: 10,
    cooldownSeconds: 0,
    baitCost: 1,
    unlockMethod: UnlockMethod.all(
      UnlockMethod.workerLevel(POWER_WORKER_INDEX, 1),
      UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, 1)
    ),
  },
  {
    id: 'monster-time',
    name: '+30s combat',
    description: 'Ajoute 30 secondes au temps imparti du combat en cours.',
    imageUrl: 'assets/img/swords/Sword1.png',
    doesAppearInGame: false,
    bought: false,
    manaCost: 200,
    cooldownSeconds: 90,
    unlockMethod: UnlockMethod.all(
      UnlockMethod.workerLevel(POWER_WORKER_INDEX, 5),
      UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, 1)
    ),
  },
  {
    id: 'vessel-rush',
    name: 'Rafale stellaire',
    description: 'Fait apparaître des vaisseaux.',
    imageUrl: 'assets/img/Machine/Ship1.png',
    doesAppearInGame: false,
    bought: false,
    manaCost: 100,
    cooldownSeconds: 0,
    baitCost: 3,
    unlockMethod: UnlockMethod.all(
      UnlockMethod.workerLevel(POWER_WORKER_INDEX, 1),
      UnlockMethod.workerLevel(VESSEL_WORKER_INDEX, 25)
    ),
  },
];
