export interface GameResource {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;  
  probabilityToSpawn?: number; // pour les ressources qui apparaissent aléatoirement (ex: loot de monstre)
}

export interface ResourceCost {
  resourceId: string;
  amount: number;
}

export interface ResourceStock extends GameResource {
  amount: number;
}

export interface ResourceReward {
  resourceId: string;
  amount: number;
}

export const RESOURCE_DEFINITIONS: GameResource[] = [
  {
    id: 'bait',
    name: 'Appât',
    description: 'Consommé par le sort Invocation pour attirer un monstre.',
  },
  {
    id: 'food',
    name: 'Stock de Nourriture',
    description: 'Quantité de nourriture restante',
  },
  {
    id: 'mosh-tooth',
    name: 'Dent de Mosh',
    description: "Les dents des moshs repoussent en quelques jours, c'est d'ailleurs la monnaie utilisée chez les moshs. Quand les moshs n'ont plus d'argent, ils leurs arrive de s'arracher leurs propres dents pour payer leurs dettes.",
  },
  {
    id: 'mosh-tail',
    name: 'Queue de Mosh',
    description: 'Le Mosh aurait préféré qu\'on ne lui arrache pas sa queue; en effet, contrairement aux dents, la queue ne repousse pas.',
  },
  {
    id: 'super-mosh-core',
    name: 'Noyau de Super-Mosh',
    description: 'Un fragment d’énergie mutante.',
  },
  {
    id: 'gribouy-ink',
    name: 'Encre de Gribouy',
    description: 'Une encre épaisse aux propriétés étranges.',
  },
];
