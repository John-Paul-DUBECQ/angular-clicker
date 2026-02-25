import type { LorePayload } from './lore-notification.service';

/**
 * Lore affiché lors du premier achat de chaque worker.
 * Les descriptions "narratives" initiales ont été déplacées ici.
 */
export const WORKER_LORE_BY_NAME: Record<string, LorePayload> = {
  'Épée': {
    key: 'worker:epee',
    title: 'Козьмино',
    text:
      "Après vous être rendu compte que Vladivostok était dévastée suite à la catastrophe, vous décidez de partir vers l'Est à la recherche d'un bateau afin d'aller au Japon et rejoindre votre village natal. C'est dans le village de Козьмино que vous trouvez cette épée, on ne sait pas encore à quel point elle va être utile mais il vaut mieux la prendre dans le doute.",
    imageUrl: null,
  },
  Fermier: {
    key: 'worker:fermier',
    title: 'Александр',
    text:
      "En continuant de marcher le long de la côte, aux abords de Преображение, vous faites la rencontre d'un fermier. Vous êtes suspicieux mais il a l'air d'être un homme de confiance. Pour survivre, il a décidé de se déplacer avec une charette dans laquelle il a planté différent types de plantes afin de survivre contre la faim. Ne sachant pas contre quel danger nous pourrions tomber, nous avons donc décidé de faire route ensemble. Il s'appelait Александр (Alexandre).",
    imageUrl: null,
  },
  Mineur: {
    key: 'worker:mineur',
    title: 'Михаил',
    text:
      "Afin de trouver des ressources pouvant être utile dans notre exploration, nous avons décidé de faire un détour dans la ville de Милоградово. La ville semblait calme et inhabitée aux premiers abords, jusqu'à ce qu'on entende un bruit ressemblant à celui d'une radio à l'intérieur. On décide donc de rentrer dans cette maison afin de pouvoir contacter d'autres survivants, or, en rentrant, quelle fut notre surprise de trouver un humain devant cette machine de radio. Il fit tout aussi surpris que nous et a failli nous transpercer à coup de pioche mais il a très vite vu que nous n'étions pas un danger. Il nous explique donc qu'il reçoit un message radio de Tokyo, disant en anglais que Tokyo est sauve. L'inconnu nous disait donc qu'il avait reçu de la même manière un message de Busan disant qu'il était impossible d'aller au Japon via l'Ouest en passant par l'île de Jeju, celle-ci étant infectée de monstres. Nous décidâmes donc de continuer notre chemin tous les trois vers le Nord et de passer par Сахалин pour arriver au Japon par Hokkaido, c'était un long voyage à faire mais si la liberté était de l'autre côté, c'était la seule solution. L'inconnu a décidé de nous suivre sans nous demander quoi que ce soit en répliquant \"Sans moi, vous n\'avez aucune chance de survie, alors je vous suis; c'est pas comme-ci il y avait grand chose à faire par ici de toute façon. D'ailleurs, je m'appelle Михаил (Mikhail)\".",
    imageUrl: null,
  },
  Forgeron: {
    key: 'worker:forgeron',
    title: 'Forgeron',
    text: 'Production automatique de 50 /s.',
    imageUrl: null,
  },
  Astrologue: {
    key: 'worker:astrologue',
    title: 'Astrologue',
    text: 'Production automatique de 500 /s.',
    imageUrl: null,
  },
  Magicien: {
    key: 'worker:magicien',
    title: 'Magicien',
    text: 'Production automatique de 1000 /s.',
    imageUrl: null,
  },
  Alchimiste: {
    key: 'worker:alchimiste',
    title: 'Alchimiste',
    text: 'Production automatique de 4500 /s.',
    imageUrl: null,
  },
  'Géomètre': {
    key: 'worker:geometre',
    title: 'Géomètre',
    text: 'Production automatique de 20000 /s.',
    imageUrl: null,
  },
  Architecte: {
    key: 'worker:architecte',
    title: 'Architecte',
    text: 'Production automatique de 100000 /s.',
    imageUrl: null,
  },
  Explorateur: {
    key: 'worker:explorateur',
    title: 'Explorateur',
    text: 'Production automatique de 40000000000000 /s.',
    imageUrl: null,
  },
};

