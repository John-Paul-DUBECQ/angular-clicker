import { Power } from "./power.model";

export const listPower: Power[] = [
  {
    id: 'power',
    name: '힘',
    description: 'Dégâts ×2 pendant 1 minute. Coût en mana à chaque lancement.',
    imageUrl: 'assets/imgUpgrades/swords/Sword1.png',
    doesAppearInGame: false,
    bought: false,
    manaCost: 60,
    cooldownSeconds: 120,
  },
  {
    id: 'weakness',
    name: '약점',
    description: 'Baisse le montant total de combo nécessaire pour activer le buff et baisse la vitesse de redescente.',
    imageUrl: 'assets/imgUpgrades/swords/Sword1.png',
    doesAppearInGame: false,
    bought: false,
    manaCost: 200,
    cooldownSeconds: 300,
  },
];

