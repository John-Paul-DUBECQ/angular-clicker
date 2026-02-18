import { ShopItem } from "./shop-item";
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
    name: 'Epée d\'entrainement',
    description: 'Aussi piquant qu\'un cure-dent, multiplie les dégats des clics définitivement par 2',
    imageUrl: 'assets/imgUpgrades/swords/Sword1.png',
    price: 10,
    doesAppearInGame: true,
    bought: false,
    value: 2,
    workerIndex: 0,
  },{
    name: 'FourcheLangue',
    description: 'Fourche légendaire datant d\'un temps oublié, dommage qu\'elle soit cassée. Multiplie les dégâts du fermier définitivement par 2',
    imageUrl: 'assets/imgUpgrades/Farmer/Farmer1.png',
    price: 100,
    doesAppearInGame: true,
    bought: false,
    value: 2,
    workerIndex: 1,
  },{
    name: 'Piochette',
    description: 'Une pioche qui fait mal, elle multiplie les dégâts du mineur définitivement par 2',
    imageUrl: 'assets/imgUpgrades/Miner/Miner1.png',
    price: 1000,
    doesAppearInGame: true,
    bought: false,
    value: 2,
    workerIndex: 2,
  },
  {
    name: 'Marteau en bois',
    description: 'Un marteau qui fait pas très mal, on pourrait presque l\'appeler un maillet. Il multiplie les dégâts du forgeron définitivement par 2',
    imageUrl: 'assets/imgUpgrades/Smith/Smith1.png',
    price: 10000,
    doesAppearInGame: true,
    bought: false,
    value: 2,
    workerIndex: 3,
  }, {
    name: 'Etoile en bois',
    description: 'Une étoile qui fait pas très mal, mais elle est très joli. Elle multiplie les dégâts de l\'astrologue définitivement par 2',
    imageUrl: 'assets/imgUpgrades/Star/Star1.png',
    price: 100000,
    doesAppearInGame: true,
    bought: false,
    value: 2,
    workerIndex: 4,
  },
  {
    name: 'Baguette de boulanger',
    description: 'Très bonne, bien qu\'elle ne soit pas très utile pour le combat. Elle multiplie les dégâts du magicien définitivement par 2.',
    imageUrl: 'assets/imgUpgrades/Wand/Wand1.png',
    price: 1000000,
    doesAppearInGame: true,
    bought: false,
    value: 2,
    workerIndex: 5,
  },
  {
    name: 'Potion en bois',
    description: 'Cette potion n\'est constitué que de bois, ce qui n\'améliore pas le goût étonnamment. Multiplie les dégâts du alchimiste définitivement par 2.',
    imageUrl: 'assets/imgUpgrades/Potion/Potion1.png',
    price: 10000000,
    doesAppearInGame: true,
    bought: false,
    value: 2,
    workerIndex: 6,
  },
  {
    name: 'Machine en bois',
    description: 'Une machine qui fait pas très mal, on pourrait presque l\'appeler un maillet. Il multiplie les dégâts du géomètre définitivement par 2',
    imageUrl: 'assets/imgUpgrades/Machine/Machine1.png',
    price: 100000000,
    doesAppearInGame: true,
    bought: false,
    value: 2,
    workerIndex: 7,
  },
  {
    name: 'Maison en bois',
    description: 'Une belle maison, pas très utile en combat cependant. Elle multiplie les dégâts de l\'architecte définitivement par 2',
    imageUrl: 'assets/imgUpgrades/House/House1.png',
    price: 1000000000,
    doesAppearInGame: true,
    bought: false,
    value: 2,
    workerIndex: 8,
  },
];

