import { ResourceTrade } from './resource-trade';
import { UnlockMethod } from './unlocks/unlock-method';

export const listResourceTrade: ResourceTrade[] = [
  {
    id: 'tickets-for-trap',
    name: 'Tickets pour Piège',
    inputResourceId: 'ticket',
    inputAmount: 3,
    outputResourceId: 'trap',
    outputAmount: 1,
    priceCoefficient: 1,
    unlockMethod: UnlockMethod.plannedCombatCompleted('planned-forest-10'),
  },{
    id: 'tickets-for-bait',
    name: 'Tickets pour Appât',
    inputResourceId: 'ticket',
    inputAmount: 3,
    outputResourceId: 'bait',
    outputAmount: 1,
    priceCoefficient: 1,
    unlockMethod: UnlockMethod.plannedCombatCompleted('planned-beach-05'),
  },
];