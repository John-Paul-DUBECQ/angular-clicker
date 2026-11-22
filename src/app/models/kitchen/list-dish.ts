import { UnlockMethod } from '../unlocks/unlock-method';
import { VESSEL_WORKER_INDEX } from '../unlocks/vessel';
import { DishDefinition } from './dish.model';
import { explorerLevelUnlock } from './kitchen-unlock';

function workerLevel(workerIndex: number, level: number, description: string): UnlockMethod {
  return UnlockMethod.custom(
    (context) => (context.getWorkerLevel(workerIndex) ?? 0) >= level,
    description,
    [{ workerIndex, level }]
  );
}

/**
 * Recettes. Un futur plat s'ajoute ici, avec son `unlockMethod`
 * et un `kind` déjà branché — ou un nouveau kind, voir `dish.model.ts`.
 */
export const LIST_DISH: DishDefinition[] = [
  {
    id: 'ragout-de-mosh',
    name: 'Ragoût de Mosh',
    description: 'Un bouillon épais qui attire tout ce qui a faim.',
    ingredients: [
      { resourceId: 'mosh-paw', amount: 5 },
      { resourceId: 'mosh-tooth', amount: 2 },
    ],
    effects: [{ kind: 'monster-spawn-rate', baseValue: 0.25 }],
    tags: ['Monstres'],
    baseDurationSeconds: 60,
    unlockMethod: explorerLevelUnlock(60),
  },
  {
    id: 'queue-grillee',
    name: 'Queue grillée',
    description: 'La queue ne repousse pas. Autant qu\'elle serve à quelque chose.',
    ingredients: [
      { resourceId: 'mosh-tail', amount: 2 },
      { resourceId: 'mosh-tooth', amount: 1 },
    ],
    effects: [{ kind: 'resource-drop', baseValue: 0.3 }],
    tags: ['Ressources'],
    baseDurationSeconds: 45,
    unlockMethod: explorerLevelUnlock(65),
  },
  {
    id: 'noyau-saute',
    name: 'Noyau sauté',
    description: 'Le cœur du Super-Mosh, revenu à feu vif.',
    ingredients: [
      { resourceId: 'super-mosh-core', amount: 1 },
      { resourceId: 'mosh-paw', amount: 3 },
    ],
    effects: [{ kind: 'damage-multiplier', baseValue: 1.5 }],
    tags: ['Combat'],
    baseDurationSeconds: 40,
    unlockMethod: explorerLevelUnlock(70),
  },
  {
    id: 'encre-flambee',
    name: 'Encre flambée',
    description: 'L\'encre éclate au contact de la poêle.',
    ingredients: [
      { resourceId: 'gribouy-ink', amount: 2 },
      { resourceId: 'food', amount: 1 },
    ],
    effects: [
      { kind: 'critical-chance', baseValue: 0.05 },
      { kind: 'critical-damage', baseValue: 0.25 },
    ],
    tags: ['Combat'],
    baseDurationSeconds: 35,
    unlockMethod: explorerLevelUnlock(75),
  },
  {
    id: 'gamelle-du-voyageur',
    name: 'Gamelle du voyageur',
    description: 'Un repas de route. Les expéditions et les pièges repartent plus vite.',
    ingredients: [
      { resourceId: 'food', amount: 2 },
      { resourceId: 'trap', amount: 1 },
      { resourceId: 'bait', amount: 1 },
    ],
    effects: [{ kind: 'adventure-cooldown', baseValue: 0.25 }],
    tags: ['Aventures'],
    baseDurationSeconds: 90,
    unlockMethod: explorerLevelUnlock(75),
  },
  {
    id: 'tourte-aux-tickets',
    name: 'Tourte aux tickets',
    description: 'Personne ne sait ce qu\'il y a dedans. Les missions paient mieux.',
    ingredients: [
      { resourceId: 'food', amount: 2 },
      { resourceId: 'detritus', amount: 1 },
    ],
    effects: [{ kind: 'ticket-reward', baseValue: 0.5 }],
    tags: ['Missions'],
    baseDurationSeconds: 60,
    unlockMethod: explorerLevelUnlock(70),
  },
  {
    id: 'bouillabaisse',
    name: 'Bouillabaisse',
    description: 'Le fond de mer, réduit jusqu\'à l\'essence.',
    ingredients: [
      { resourceId: 'sea-food', amount: 3 },
      { resourceId: 'shell', amount: 1 },
      { resourceId: 'mermaid-tail', amount: 1 },
    ],
    effects: [{ kind: 'essence-drop', baseValue: 0.4 }],
    tags: ['Essence'],
    baseDurationSeconds: 50,
    unlockMethod: explorerLevelUnlock(80),
  },
  {
    id: 'ration-de-chasseur',
    name: 'Ration de chasseur',
    description: 'Une conserve métallique. Les vaisseaux se montrent plus souvent.',
    ingredients: [
      { resourceId: 'cargo-scrap', amount: 2 },
      { resourceId: 'hunter-beacon', amount: 1 },
    ],
    effects: [{ kind: 'vessel-spawn-rate', baseValue: 0.3 }],
    tags: ['Vaisseaux'],
    baseDurationSeconds: 50,
    unlockMethod: UnlockMethod.all(
      explorerLevelUnlock(60),
      workerLevel(VESSEL_WORKER_INDEX, 10, 'Géomètre niveau 10')
    ),
  },
  {
    id: 'dessert-de-la-chance',
    name: 'Dessert de la chance',
    description: 'Chaque point de chance ajoute 0,01 % à la chance de coffre et multiplie les gains de la loterie.',
    ingredients: [
      { resourceId: 'peji-tongue', amount: 1 },
      { resourceId: 'mosh-tooth', amount: 2 },
      { resourceId: 'bulb', amount: 1 },
    ],
    effects: [{ kind: 'luck', baseValue: 8 }],
    tags: ['Chance'],
    baseDurationSeconds: 120,
    unlockMethod: explorerLevelUnlock(90),
  },
];
