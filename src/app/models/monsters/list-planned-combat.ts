import { UnlockMethod } from '../unlocks/unlock-method';
import { MONSTER_WORKER_INDEX } from '../unlocks/monster-unlock';
import { PlannedCombat } from './planned-combat.model';

export const listPlannedCombat: PlannedCombat[] = [
  {
    id: 'planned-mosh-hunt',
    name: 'Chasse au Mosh',
    description: 'Un affrontement préparé contre un Mosh particulièrement coriace.',
    imageUrl: 'assets/img/shadocks/mosh.png',
    maxHp: 250,
    timeLimitSeconds: 60,
    cooldownSeconds: 1 * 60,
    unlockMethod: UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, 1),
    firstReward: {
      clicks: 500,
      essence: 5,
      resources: [{ resourceId: 'mosh-tooth', amount: 3 }],
    },
    repeatReward: {
      clicks: 150,
      essence: 1,
    },
  },
  {
    id: 'planned-super-mosh',
    name: 'Le retour du Super-Mosh',
    description: 'Le combat suivant attend la victoire précédente.',
    imageUrl: 'assets/img/shadocks/mosh.png',
    maxHp: 1200,
    timeLimitSeconds: 90,
    cooldownSeconds: 5 * 60,
    unlockMethod: UnlockMethod.all(
      UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, 5),
      UnlockMethod.plannedCombatCompleted('planned-mosh-hunt')
    ),
    firstReward: {
      clicks: 2500,
      essence: 20,
      resources: [{ resourceId: 'super-mosh-core', amount: 1 }],
    },
    repeatReward: {
      clicks: 700,
      essence: 4,
    },
  },
];