import { requirePlannedCombatWins, requireAll, requireBought, requirePower, requireWorkerLevel, ShopItem } from "./shop-item";
import { ARCHITECT_WORKER_INDEX, PRIME_LEVEL_REQUIRED } from "./unlocks/prime-unlock";
import { dishUpgradeId } from "./kitchen/dish.model";
import { LIST_DISH } from "./kitchen/list-dish";
import { FARMER_WORKER_INDEX } from "./monsters/egg.model";
/*
Recap des workers :
- Épée : 0
- Fourche : 1
- Pioche : 2
- Marteau : 3
- Etoile : 4
- Baguette : 5
- Potion : 6
- Machine : 7
- Maison : 8

*/
export const listShopItem: Array<ShopItem> = [
  {
    id: 'shop-sword-training',
    name: 'Epée d\'entrainement',
    description: 'Aussi piquant qu\'un cure-dent, multiplie les dégats de l\'épée définitivement par 1.2',
    imageUrl: 'assets/img/swords/Sword1.png',
    price: 100,
    doesAppearInGame: false,
    bought: false,
    value: 1.2,
    workerIndex: 0,
  },{ 
    id: 'shop-sword-tempered',
    name: 'Epée en bois trempé',
    description: 'Avec de l\'acier trempé, ça aurait été plus efficace, multiplie les dégats de l\'épée définitivement par 1.5',
    imageUrl: 'assets/img/swords/Sword2.png',
    price: 2000,
    doesAppearInGame: false,
    bought: false,
    value: 1.5,
    workerIndex: 0,
    unlockMethod: requireAll(requireBought('shop-sword-training'), requireWorkerLevel(0, 25)),
   },{ 
    id: 'shop-sword-calcaire',
    name: 'Epée en calcaire',
    description: 'Cette épée est un unique exemplaire, certainement parce qu\'elle est inutile. Multiplie les dégats de l\'épée définitivement par 1.2',
    imageUrl: 'assets/img/swords/Sword2.png',
    price: 8000,
    doesAppearInGame: false,
    bought: false,
    value: 1.2,
    workerIndex: 0,
    unlockMethod: requireAll(requireBought('shop-sword-tempered'), requireWorkerLevel(0, 50)),
  },{ 
    id: 'shop-sword-frangipane',
    name: 'Epée en frangipane',
    description: 'Dans un saladier, mélanger la poudre d\'amandes, le sucre, les 2 oeufs et le beurre mou. Enfourner pendant 20 à 30 min à 200°C (thermostat 6-7); vérifier régulièrement la cuisson ! Multiplie les dégats de l\'épée définitivement par 1.5',
    imageUrl: 'assets/img/swords/Sword1.png',
    price: 1000,
    doesAppearInGame: false,
    bought: false,
    value: 1.5,
    workerIndex: 0,
    unlockMethod: requireAll(requireBought('shop-sword-training'), requireWorkerLevel(1, 10)),
  },
  {
    name: 'FourcheLangue',
    description: 'Fourche légendaire datant d\'un temps oublié, dommage qu\'elle soit cassée. Multiplie les dégâts du fermier définitivement par 2',
    imageUrl: 'assets/img/Farmer/Farmer1.png',
    price: 50,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    workerIndex: 1,
  },{
    name: 'Piochette',
    description: 'Une pioche qui fait mal, elle multiplie les dégâts du mineur définitivement par 2',
    imageUrl: 'assets/img/Miner/Miner1.png',
    price: 1000,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    workerIndex: 2,
  },{
    id: 'shop-obsidian-hoe',
    name: 'Faux en obsidienne',
    description: 'Une pioche trouvée dans une mine, bien qu\'on ne voit pas l\'interêt de la construire en obsidienne, elle multiplie les dégâts du fermier définitivement par 500',
    imageUrl: 'assets/img/Farmer/Farmer1.png',
    price: 1e15,
    bought: false,
    value: 500,
    workerIndex: 1,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireWorkerLevel(1, 400),
  },{
    id: 'shop-obsidian-hoe-2',
    name: 'Faux en obsidienne 2 ',
    description: 'Une deuxième pioche trouvée dans une mine, bien qu\'on ne voit toujours pas l\'interêt de la construire en obsidienne, elle multiplie les dégâts du fermier définitivement par 500',
    imageUrl: 'assets/img/Farmer/Farmer1.png',
    price: 1e15,
    bought: false,
    value: 500,
    workerIndex: 1,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireAll(requireBought('shop-obsidian-hoe'), requireWorkerLevel(1, 425)),
  },{
    id: 'shop-obsidian-pickaxe',
    name: 'Piochette en obsidienne',
    description: 'Une pioche trouvée dans une mine, bien qu\'on ne voit encore une fois toujours pas l\'interêt de construire une pioche en obsidienne, elle multiplie les dégâts du mineur définitivement par 500',
    imageUrl: 'assets/img/Miner/Miner1.png',
    price: 1e30,
    bought: false,
    value: 500,
    workerIndex: 2,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireWorkerLevel(2, 300),
  },{
    id: 'mineral-book',
    name: 'Livre sur les mineraux',
    description: 'Un livre sur les mineraux, maintenant qu\'on sait reconnaitre les mineraux, on va pouvoir améliorer nos armes. il multiplie les dégâts du mineur définitivement par 5',
    imageUrl: 'assets/img/Miner/Miner1.png',
    price: 1e30,
    bought: false,
    value: 5,
    workerIndex: 2,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireWorkerLevel(2, 325),
  },{
    name: 'Marteau en bois',
    description: 'Un marteau qui fait pas très mal, on pourrait presque l\'appeler un maillet. Il multiplie les dégâts du forgeron définitivement par 2',
    imageUrl: 'assets/img/Smith/Smith1.png',
    price: 10000,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    workerIndex: 3,
  }, {
    name: 'Etoile en bois',
    description: 'Une étoile qui fait pas très mal, mais elle est très joli. Elle multiplie les dégâts de l\'astrologue définitivement par 2',
    imageUrl: 'assets/img/Star/Star1.png',
    price: 100000,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    workerIndex: 4,
  },
  {
    name: 'Baguette de boulanger',
    description: 'Très bonne, bien qu\'elle ne soit pas très utile pour le combat. Elle multiplie les dégâts du magicien définitivement par 2.',
    imageUrl: 'assets/img/Wand/Wand1.png',
    price: 1000000,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    workerIndex: 5,
  },
  {
    name: 'Potion en bois',
    description: 'Cette potion n\'est constitué que de bois, ce qui n\'améliore pas le goût étonnamment. Multiplie les dégâts du alchimiste définitivement par 2.',
    imageUrl: 'assets/img/Potion/Potion1.png',
    price: 10000000,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    workerIndex: 6,
  },
  {
    name: 'Machine en bois',
    description: 'Une machine qui fait pas très mal, on pourrait presque l\'appeler un maillet. Il multiplie les dégâts du géomètre définitivement par 2',
    imageUrl: 'assets/img/Machine/Machine1.png',
    price: 100000000,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    workerIndex: 7,
  },
  {
    name: 'Maison en bois',
    description: 'Une belle maison, pas très utile en combat cependant. Elle multiplie les dégâts de l\'architecte définitivement par 2',
    imageUrl: 'assets/img/House/House1.png',
    price: 1000000000,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    workerIndex: 8,
  },
  {
    id: 'shop-power-mana',
    name: 'Amulette de mana',
    description: 'Réduit le coût en mana du sort 마법 de 10%.',
    imageUrl: 'assets/img/power/power.png',
    price: 5000,
    doesAppearInGame: false,
    bought: false,
    value: 1,
    unlockMethod: requireWorkerLevel(5, 1),
    powerId: 'power',
    powerManaFactor: 0.9,
  },
  {
    id: 'shop-mana-max',
    name: 'Cristal de mana',
    description: '+300 mana max.',
    imageUrl: 'assets/img/power/power.png',
    price: 8000,
    doesAppearInGame: false,
    bought: false,
    value: 1,
    unlockMethod: requireWorkerLevel(5, 5),
    manaMaxBonus: 300,
  },
  {
    id: 'shop-mana-regen',
    name: 'Fontaine de mana',
    description: '+0.05 mana/s de régénération.',
    imageUrl: 'assets/img/power/power.png',
    price: 15000,
    doesAppearInGame: false,
    bought: false,
    value: 1,
    unlockMethod: requireWorkerLevel(5, 10),
    manaRegenBonus: 0.05,
  },
  {
    id: 'shop-critical-chance',
    name: 'Pierre de chance',
    description: '+1% de chance de coup critique (s\'ajoute au bonus du Mineur).',
    imageUrl: 'assets/img/Miner/Miner1.png',
    price: 2500,
    doesAppearInGame: false,
    bought: false,
    value: 1,
    unlockMethod: requireWorkerLevel(2, 1),
    unlockUpgrade: { unlockId: 'critical-hit', type: 'chance', value: 0.01 },
  },
  {
    id: 'shop-critical-chance-2',
    name: 'Pierre de chance 2',
    description: '+2% de chance de coup critique (s\'ajoute au bonus du Mineur).',
    imageUrl: 'assets/img/Miner/Miner1.png',
    price: 20000,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    unlockMethod: requireAll(requireBought('shop-critical-chance'), requireWorkerLevel(2, 30)),
    unlockUpgrade: { unlockId: 'critical-hit', type: 'chance', value: 0.02 },
  },{
    id: 'golden-hoe',
    name: 'Faux dorée',
    description: 'Augmente la production de ressources du fermier de 400%.',
    imageUrl: 'assets/img/Farmer/Farmer1.png',
    price: 2e14,
    doesAppearInGame: false,
    bought: false,
    value: 5,
    workerIndex: 1,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-beach-01', 1),
  },{
    id: 'golden-pickaxe',
    name: 'Pioche dorée',
    description: 'Augmente la production de ressources du mineur de 350%.',
    imageUrl: 'assets/img/Miner/Miner1.png',
    price: 4e14,
    doesAppearInGame: false,
    bought: false,
    value: 4.5,
    workerIndex: 2,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-beach-02', 1),
  },{
    id: 'golden-hammer',
    name: 'Marteau doré',
    description: 'Augmente la production de ressources du forgeron de 300%.',
    imageUrl: 'assets/img/Smith/Smith1.png',
    price: 6e14,
    doesAppearInGame: false,
    bought: false,
    value: 4,
    workerIndex: 3,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-beach-03', 1),
  },{
    id: 'oeil-de-verre',
    name: 'Oeil de verre',
    description: 'Regarder à travers permet de découvrir des secrets enfouis, multiplie les dégâts de l\'astrologue par 3.5.',
    imageUrl: 'assets/img/Star/Star1.png',
    price: 8e14,
    doesAppearInGame: false,
    bought: false,
    value: 3.5,
    workerIndex: 4,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-beach-04', 1),
  },{
    id: 'incantation-florale',
    name: 'Incantation florale',
    description: 'Invoquer des fleurs est un plaisir de chaque instant, x3 des dégâts du Magicien.',
    imageUrl: 'assets/img/Wand/Wand1.png',
    price: 1e15,
    doesAppearInGame: false,
    bought: false,
    value: 3,
    workerIndex: 5,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-beach-05', 1),
  },{
    id: 'potion-de-rapetissement',
    name: 'Potion de rapetissement',
    description: 'Le monde est tout aussi beau vu d\'en bas, c\'est juste plus dur pour chercher aux dessus des armoires. x2.5 des dégâts de l\'Alchimiste.',
    imageUrl: 'assets/img/Potion/Potion1.png',
    price: 2e15,
    doesAppearInGame: false,
    bought: false,
    value: 2.5,
    workerIndex: 6,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-beach-06', 1),
  },{
    id: 'glue-super-adhesive',
    name: 'Glue super adhésive',
    description: 'Colle les choses ensemble de manière très efficace. x2 de la production du géomètre.',
    imageUrl: 'assets/img/Machine/Machine1.png',
    price: 4e15,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    workerIndex: 7,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-beach-07', 1),
  },{
    id: 'dos-d-ane',
    name: 'Dos d\'âne',
    description: 'La loi veut qu\'on ralentisse à un dos d\'âne. Ralentit le soleil.',
    imageUrl: 'assets/img/Star/Star1.png',
    price: 1e16,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-beach-08', 1),
    unlockUpgrade: { unlockId: 'sun', type: 'speed', value: -0.25 },
  },{
    id: 'Appat-1',
    name: 'Appat 1',
    description: 'Reduit les temps de production des appâts de 10 secondes.',
    imageUrl: 'assets/img/Bait/Bait1.png',
    price: 1e16,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-mosh-hunt', 2),
    unlockUpgrade: { unlockId: 'house:bait', type: 'interval-seconds', value: 10 },
  },{
    id: 'Appat-2',
    name: 'Appat 2',
    description: 'Reduit les temps de production des appâts de 10 secondes.',
    imageUrl: 'assets/img/Bait/Bait1.png',
    price: 1e16,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-super-mosh', 2),
    unlockUpgrade: { unlockId: 'house:bait', type: 'interval-seconds', value: 10 },
  },{
    id: 'Appat-3',
    name: 'Appat 3',
    description: 'Reduit les temps de production des appâts de 10 secondes.',
    imageUrl: 'assets/img/Bait/Bait1.png',
    price: 1e16,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-forest-03', 2),
    unlockUpgrade: { unlockId: 'house:bait', type: 'interval-seconds', value: 10 },
  },{
    id: 'Appat-4',
    name: 'Appat 4',
    description: 'Reduit les temps de production des appâts de 10 secondes.',
    imageUrl: 'assets/img/Bait/Bait1.png',
    price: 1e16,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-forest-04', 2),
    unlockUpgrade: { unlockId: 'house:bait', type: 'interval-seconds', value: 10 },
  },{
    id: 'Appat-5',
    name: 'Appat 5',
    description: 'Reduit les temps de production des appâts de 10 secondes.',
    imageUrl: 'assets/img/Bait/Bait1.png',
    price: 1e16,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-forest-05', 2),
    unlockUpgrade: { unlockId: 'house:bait', type: 'interval-seconds', value: 10 },
  },{
    id: 'Appat-6',
    name: 'Appat 6',
    description: 'Reduit les temps de production des appâts de 10 secondes.',
    imageUrl: 'assets/img/Bait/Bait1.png',
    price: 1e16,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-forest-06', 2),
    unlockUpgrade: { unlockId: 'house:bait', type: 'interval-seconds', value: 10 },
  },{
    id: 'Appat-7',
    name: 'Appat 7',
    description: 'Reduit les temps de production des appâts de 10 secondes.',
    imageUrl: 'assets/img/Bait/Bait1.png',
    price: 1e16,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-forest-07', 2),
    unlockUpgrade: { unlockId: 'house:bait', type: 'interval-seconds', value: 10 },
  },{
    id: 'Appat-8',
    name: 'Appat 8',
    description: 'Reduit les temps de production des appâts de 10 secondes.',
    imageUrl: 'assets/img/Bait/Bait1.png',
    price: 1e16,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-forest-08', 2),
    unlockUpgrade: { unlockId: 'house:bait', type: 'interval-seconds', value: 10 },
  },{
    id: 'Appat-9',
    name: 'Appat 9',
    description: 'Reduit les temps de production des appâts de 10 secondes.',
    imageUrl: 'assets/img/Bait/Bait1.png',
    price: 1e16,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-forest-09', 2),
    unlockUpgrade: { unlockId: 'house:bait', type: 'interval-seconds', value: 10 },
  },{
    id: 'Appat-10',
    name: 'Appat 10',
    description: 'Reduit les temps de production des appâts de 10 secondes.',
    imageUrl: 'assets/img/Bait/Bait1.png',
    price: 1e16,
    doesAppearInGame: false,
    bought: false,
    value: 2,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requirePlannedCombatWins('planned-forest-10', 2),
    unlockUpgrade: { unlockId: 'house:bait', type: 'interval-seconds', value: 10 },
  },{
    id: 'hunter-beacon-upgrade1',
    name: 'Beacon de chasseur',
    description: 'Augmente la vitesse de spawn des vaisseaux de 30% pour les ration de chasseur.',
    imageUrl: 'assets/img/Hunter/Hunter1.png',
    price: 1e25,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireWorkerLevel(8,60),
    unlockUpgrade: { unlockId: dishUpgradeId('ration-de-chasseur'), type: 'vesselSpawnRateMultiplier', value: 0.3 },
  },{
    id: 'hunter-beacon-upgrade2',
    name: 'Beacon de chasseur',
    description: 'Augmente la vitesse de spawn des vaisseaux de 30% pour les ration de chasseur.',
    imageUrl: 'assets/img/Hunter/Hunter1.png',
    price: 1e28,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireAll(requireBought('hunter-beacon-upgrade1'), requireWorkerLevel(8,60)),
    unlockUpgrade: { unlockId: dishUpgradeId('ration-de-chasseur'), type: 'vesselSpawnRateMultiplier', value: 0.3 },
  },{
    id: 'hunter-beacon-upgrade3',
    name: 'Beacon de chasseur',
    description: 'Augmente la durée de la ration de chasseur de 10 secondes.',
    imageUrl: 'assets/img/Hunter/Hunter1.png',
    price: 1e28,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireAll(requireBought('hunter-beacon-upgrade1'), requireWorkerLevel(8,60)),
    unlockUpgrade: { unlockId: dishUpgradeId('ration-de-chasseur'), type: 'duration', value: 10 },
  },{
    id: 'hunter-beacon-upgrade4',
    name: 'Beacon de chasseur',
    description: 'Augmente la vitesse de spawn des vaisseaux de 30% pour les ration de chasseur.',
    imageUrl: 'assets/img/Hunter/Hunter1.png',
    price: 1e28,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireAll(requireBought('hunter-beacon-upgrade2'), requireWorkerLevel(8,65)),
    unlockUpgrade: { unlockId: dishUpgradeId('ration-de-chasseur'), type: 'vesselSpawnRateMultiplier', value: 0.3 },
  },
  {
    id: 'prime-respect-flat',
    name: 'Sceau de réputation',
    description: 'Chaque prime rapporte 4 de respect en plus.',
    imageUrl: 'assets/img/House/House1.png',
    price: 1e32,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireWorkerLevel(ARCHITECT_WORKER_INDEX, PRIME_LEVEL_REQUIRED),
    unlockUpgrade: { unlockId: 'prime', type: 'respect-flat', value: 4 },
  },
  {
    id: 'prime-respect-percent',
    name: 'Bannière des primes',
    description: 'Le respect gagné sur une prime augmente de 25 %.',
    imageUrl: 'assets/img/House/House1.png',
    price: 5e30,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireWorkerLevel(ARCHITECT_WORKER_INDEX, PRIME_LEVEL_REQUIRED),
    unlockUpgrade: { unlockId: 'prime', type: 'respect-percent', value: 0.25 },
  },
  {
    id: 'prime-time',
    name: 'Sablier du contrat',
    description: 'Ajoute 10 secondes au temps pour tuer la cible d\'une prime.',
    imageUrl: 'assets/img/House/House1.png',
    price: 2e27,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireWorkerLevel(ARCHITECT_WORKER_INDEX, PRIME_LEVEL_REQUIRED),
    unlockUpgrade: { unlockId: 'prime', type: 'time', value: 10 },
  },{
    id: 'prime-discount',
    name: 'Poignée de main',
    description: 'Le respect réduit de 10 % le prix en or des marchands itinérants.',
    imageUrl: 'assets/img/House/House1.png',
    price: 3e31,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireWorkerLevel(ARCHITECT_WORKER_INDEX, PRIME_LEVEL_REQUIRED),
    unlockUpgrade: { unlockId: 'prime', type: 'discount', value: 0.1 },
  },{
    id: 'dish-queue-grillee-1',
    name: 'Queue de billard',
    description: 'On pourrait essayer de la griller ? Augmente la production de ressources de la queue grillée de 10%.',
    imageUrl: 'assets/img/Wand/Wand1.png',
    price: 3.3e34,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireWorkerLevel(FARMER_WORKER_INDEX, 450),
    unlockUpgrade: { unlockId: 'dish:queue-grillee', type: 'resourceDropMultiplier', value: 0.1 },
  },{
    id: 'dish-queue-grillee-2',
    name: 'Queue de poisson',
    description: 'Sans sa queue, il va beaucoup moins bien nager. Augmente la production de ressources de la queue grillée de 10%.',
    imageUrl: 'assets/img/Wand/Wand1.png',
    price: 3.3e35,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireAll(requireBought('dish-queue-grillee-1'), requireWorkerLevel(FARMER_WORKER_INDEX, 455)),
    unlockUpgrade: { unlockId: 'dish:queue-grillee', type: 'resourceDropMultiplier', value: 0.1 },
  },{
    id: 'dish-queue-grillee-3',
    name: 'Queue de boeuf',
    description: 'Sans sa queue, il va tout aussi bien nager. Augmente la production de ressources de la queue grillée de 10%.',
    imageUrl: 'assets/img/Wand/Wand1.png',
    price: 3.3e36,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireAll(requireBought('dish-queue-grillee-2'), requireWorkerLevel(FARMER_WORKER_INDEX, 460)),
    unlockUpgrade: { unlockId: 'dish:queue-grillee', type: 'resourceDropMultiplier', value: 0.1 },
  },{
    id: 'dish-queue-grillee-4',
    name: 'Boule de billard',
    description: 'Le meilleur moyen d\'accompagner une queue de billard, c\'est avec ses boules. Augmente la production de ressources de la queue grillée de 40%.',
    imageUrl: 'assets/img/Wand/Wand1.png',
    price: 3.3e39,
    appearImmediatelyOnUnlock: true,
    unlockMethod: requireAll(requireBought('dish-queue-grillee-3'), requireWorkerLevel(FARMER_WORKER_INDEX, 490)),
    unlockUpgrade: { unlockId: 'dish:queue-grillee', type: 'resourceDropMultiplier', value: 0.4 },
  },
];


/*
UnlockUpgrade disponibles (appliques quand l'item est achete) :
- house:bait / interval-seconds : reduction du délai entre deux appâts (seconds).
- house:bait / amount : nombre d'appâts produits a chaque cycle (1 avec 1).
- house:vessel-rush / count : vaisseaux supplementaires pour la Rafale stellaire.
- house:vessel-rush / duration : secondes supplementaires pour la Rafale stellaire.
- house:vessel-reward / reward : multiplicateur des récompenses des vaisseaux (0.1 = +10 %).
- house:vessel-reward / spawn-interval : reduction additive du facteur d'intervalle des vaisseaux (0.1 = -10 %).
- house:solar-balance / afk-to-click : bonus des dégâts AFK transferes au clic.
- house:solar-balance / click-to-afk : bonus des dégâts de clic transferes en AFK.
- house:solar-blue / click-reward : bonus des récompenses en phase bleue.
- house:solar-blue / auto-damage : bonus des dégâts AFK en phase bleue.
- house:solar-blue / mana-per-click : mana gagne par clic en phase bleue.
- house:solar-blue / critical-chance : chance critique ajoutee en phase bleue.
- house:solar-blue / critical-damage : multiplicateur des dégâts critiques en phase bleue.
- house:solar-yellow / spawn-rate : bonus du taux d'apparition des monstres en phase jaune.
- house:solar-yellow / streak-click : bonus de progression du streak en phase jaune.
- house:critical / chance : bonus de chance critique ajoute par la maison du Mineur.
- monster / spawn-rate : bonus du taux d'apparition des monstres.
- monster / essence : bonus des gains d'essence des monstres.
- monster / hp : multiplicateur des PV des monstres.
- monster / time : multiplicateur du temps disponible contre les monstres.
- monster / drops : bonus multiplicatif des drops de monstres.
- monster / gold : bonus multiplicatif des récompenses en clics des monstres.
- prime / respect-flat : respect entier ajouté au gain d'une prime (4 avec 4).
- prime / respect-percent : pourcentage ajouté au gain d'une prime (0.25 = +25 %).
- prime / time : secondes ajoutées au temps pour tuer la cible d'une prime (10 avec 10).
- prime / discount : réduction du prix en or des marchands itinérants (0.1 = -10 %).
- sun / chance : chance critique ajoutee (0.01 = +1 point de pourcentage).
- sun / damage : multiplicateur de degats du clic Soleil (+10 % avec 0.1).
- sun / size : taille du Soleil (+10 % avec 0.1).
- sun / speed : vitesse de rotation du Soleil (+10 % avec 0.1).
- critical-hit / chance : chance critique ajoutee (0.01 = +1 point de pourcentage).
- critical-hit / damage : degats critiques (+10 % avec 0.1).
- vessel / speed : vitesse de deplacement des vaisseaux (+10 % avec 0.1).
- vessel-rush / count : nombre de vaisseaux ajoutes a Rafale stellaire (+2 avec 2).
- streak / damage : multiplicateur de degats du streak (+10 % avec 0.1).
- streak / clicks : reduction du nombre de clics requis pour remplir le streak (10 % avec 0.1).
- streak / decay : ralentissement de la baisse de la barre streak (10 % avec 0.1).
- power:<id> / mana-cost : reduction du cout de mana du sort (10 % avec 0.1).
- power:<id> / cooldown : reduction du cooldown du sort en secondes (10 avec 10).
- power:<id> / duration : augmentation de la duree des effets temporises (10 % avec 0.1).
- power:<id> / strength : augmentation de la puissance (10 % avec 0.1; degats et weakness).
  IDs de sorts : power, weakness, spawn-mob, monster-time, vessel-rush.
- dish:<id> / duration : secondes ajoutees a la duree du plat tant qu'il est actif (+10 s avec 10).
- dish:<id> / <propriete> : bonus d'une seule propriete, ajoute seulement pendant que ce plat est actif.
  Exemple : { unlockId: 'dish:ration-de-chasseur', type: 'vesselSpawnRateMultiplier', value: 0.3 }.
  Proprietes : monsterSpawnRateMultiplier, vesselSpawnRateMultiplier, damageMultiplier,
  criticalChanceBonus, criticalDamageBonus, luck, essenceDropMultiplier,
  resourceDropMultiplier, ticketRewardMultiplier, adventureCooldownFactor.
  0.3 sur un taux = +30 %. damageMultiplier s'ajoute au multiplicateur du plat.
  adventureCooldownFactor se retranche (0.25 = -25 %). luck s'ajoute a la chance de la loterie.
*/

