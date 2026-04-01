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
      "Après vous être rendu compte que Vladivostok était dévastée suite à la catastrophe, vous décidez de partir vers l'Est à la recherche d'un bateau afin d'aller au Japon. C'est dans le village de Козьмино que vous trouvez cette épée, on ne sait pas encore à quel point elle va être utile mais il vaut mieux la prendre dans le doute.",
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
      "Afin de trouver des ressources pouvant être utile dans notre exploration, nous avons décidé de faire un détour dans la ville de Милоградово.\n\n La ville semblait calme et inhabitée aux premiers abords, jusqu'à ce qu'on entende un bruit ressemblant à celui d'une radio à l'intérieur. On décide donc de rentrer dans cette maison afin de pouvoir contacter d'autres survivants, or, en rentrant, quelle fut notre surprise de trouver un humain devant cette machine de radio. Il fit tout aussi surpris que nous et a failli nous transpercer à coup de pioche mais il a très vite vu que nous n'étions pas un danger. \n Il nous explique donc qu'il reçoit un message radio de Tokyo, disant en anglais que Tokyo est sauve. L'inconnu nous disait donc qu'il avait reçu de la même manière un message de Busan disant qu'il était impossible d'aller au Japon via l'Ouest en passant par l'île de Jeju, celle-ci étant infectée de monstres. \n\n Nous décidâmes donc de continuer notre chemin tous les trois vers le Nord et de passer par Сахалин pour arriver au Japon par Hokkaido, c'était un long voyage à faire mais si la liberté était de l'autre côté, c'était la seule solution. L'inconnu a décidé de nous suivre sans nous demander quoi que ce soit en répliquant \"Sans moi, vous n\'avez aucune chance de survie, alors je vous suis; c'est pas comme-ci il y avait grand chose à faire par ici de toute façon. D'ailleurs, je m'appelle Михаил (Mikhail)\".",
    imageUrl: null,
  },
  Forgeron: {
    key: 'worker:forgeron',
    title: 'Анатолий',
    text: "Cela fait maintenant quelques jours que nous continuons notre chemin vers l\'Est et nous n\'avons encore vu aucun signe de vie humaine. Cependant nous arrivons bientôt dans la ville de Дальнегорск et bien que la population ait déjà certainement pris l\'avion afin de fuir, nous pouvons toujours espérer trouver un groupe de survivants. \n\n En entrant dans la ville, nous pouvons voir une grande fumée à l\'horizon; nous n\'étions donc pas seul. En nous rapprochant, nous trouvons un homme regardant un immeuble en train de brûler; Les barils d\'essence à ses côtés ne laissaient aucun doute sur le fait qu\'il était à l'origine de ce feu. Nous décidons donc de nous présenter à lui et de lui demander ce qu\'il se passait ici et si nous pouvions être d\'un quelconque utilité.\n Il répondit d'un ton sec et solennel \"Je viens de faire mes derniers adieux à un être cher. Quant à vous, je ne sais pas ce que vous faites par ici, mais dans cette ville, je suis le dernier. Et tous les avions sont déjà partis il y a des semaines\".\n\n Après lui avoir expliqué notre situation, Mikhail sortit une bouteille d\'alcool et en proposa une autre à l\'inconnu, \"Nous sommes semblables tous les deux, ça te dirait de te joindre à nous ?\" Alexandre et moi fûmes surpris de voir que l\'inconnu accepta sans hésiter. Il nous expliqua qu\'il travaillait avec le fer en tant que soudeur et se proposa pour rendre nos armes encore plus tranchantes, bien qu\'il ne voyait pas vraiment l\'interêt d'avoir des armes dans ces terres désolées. Il s\'appelait donc Анатолий (Anatole).",
    imageUrl: null,
  },
  Astrologue: {
    key: 'worker:astrologue',
    title: 'София',
    text: "C'est en partant de Терней dans la bonne humeur que nous vîmes une charrette au pied d'un arbre. En nous approchant de celle-ci, une jeune femme s'approcha de nous et nous dit \"Je vous attendais ; enfin, je ne savais pas quand, ni où pour être honnête, mais je savais que j'allais vous rencontrer. Je m'appelle София (Sofia) et c'est un plaisir de vous rencontrer\". \n\nNous étions tous les quatre très surpris par ce qu'elle venait de dire et Mikhail lui répondit \"On n'a pas de temps à perdre avec des diseuses de bonne aventure. Désolé petite, mais nous, on va continuer notre chemin vers le Nord et on ne peut pas se permettre de parler à tous les fous sur notre route\". \n\nSa réponse fut assez directe et surprenante mais, dans le fond, il n'avait pas si tort que ça ; on ne peut pas faire confiance à n'importe qui. Mais en même temps, elle avait l'air sincère et honnête. Je pris Mikhail à part et lui dis \"On ne peut pas se permettre de la laisser ici toute seule, t'imagines les dangers qui pourraient lui arriver, ou même si les Russes décident de la pourchasser\" ; Mikhail me répondit droit dans les yeux \"J'adorerais que tu aies raison mais si elle était tant en danger que ça, qu'est-ce qu'elle fait aux abords d'une ville abandonnée ? Et même, comment a-t-elle survécu jusque-là ? Si ça se trouve, elle nous a espionnés pendant qu'on était dans la ville et a décidé de se jouer de nous pour voler nos ressources plus tard, voire pire, nous vendre à l'armée russe.\". Il avait raison. \n\nAprès avoir dit à Sofia que nous devions poursuivre notre chemin, elle cria \"Depuis ce qu'il s'est passé à Kaliningrad, je ressens des choses. Jusque-là, ça m'a porté chance ; ça peut être un pressentiment sur le chemin à suivre ou parfois, ça peut être bien plus fort. Par exemple, quand je te regarde toi, je ne sais pas ton nom mais quand je te vois, je vois que tu recherches des réponses sur qui tu es et je sens que toi aussi tu es lié à ce jour de l'insurrection de Kaliningrad. Ce n'est peut-être rien mais le fait que deux personnes liées à ce point-là se rencontrent ne peut pas être un hasard\".\n\nMikhail se retourna vers elle et lui dit \"Tu sais quoi, je sens que depuis quelques mois, rien n'est comme avant et ça ne tient pas qu'à l'état du pays. Mais le fait que tu aies réussi à mettre le doigt dessus, j'ai envie de te croire. Et après tout, un petit peu de compagnie féminine ne va pas nous faire de mal\". Bien évidemment, il ne pouvait pas finir sur une note de gentillesse, il devait bien sortir une remarque sexiste. \n\nSofia nous rejoignit en courant et c'est ainsi que nous continuâmes notre chemin à cinq vers le Nord. \"Je suis sûr qu'on va trouver toutes les réponses sur qui tu es à la fin de ce voyage\".",
    imageUrl: null,
  },
  Magicien: {
    key: 'worker:magicien',
    title: 'Magicien',
    text: "En continuant notre route, nous tombâmes sur un chemin bloqué par un arbre tombé. Sofia dit sans attendre \"Je sens que ce n'est pas normal...\". Alexandre se proposa pour le déplacer, cependant il fallait bien compter plusieurs heures. On décida donc de passer la nuit dans une maison à proximité. En effet, depuis que Sofia nous a rejoints, nous avons maintenant deux charrettes à transporter, ce qui certes nous permet d'avoir plus de bagages, mais rend les difficultés de la route bien plus problématiques. \n\nDans la maison se trouvait un chien seul ; il avait l'air affamé mais n'était pas agressif. Il nous observait en silence, sans bouger, comme s'il attendait quelque chose. On décida donc de chasser vers 20h afin de le nourrir et d'en profiter pour faire des réserves. Une fois rentrés vers 21h30, Alexandre avait terminé avec le tronc et on en profita pour donner à manger au chien. \"C'est drôle, il me rappelle mon chien\" rétorqua Anatole ; je répondis \"C'est dommage que tu aies déjà décidé de donner le nom de ton ancien chien à moi-même...\". La soirée continua dans la bonne humeur, même si le chien, lui, ne quittait presque pas la porte du regard. \n\nCependant, peu de temps après, Anatole revint de l'extérieur et cria \"Alexandre, tu te fiches de nous ? Pourquoi le tronc n'a pas bougé ?\". Personne ne comprit et on décida de tous se rendre sur les lieux. \"Mais je vous assure que je l'avais déplacé\" répondit Alexandre, tout aussi perdu que nous. \"En effet, quand je suis passé tout à l'heure, il était déjà à moitié dégagé... mais là il est revenu comme avant\" ajouta Mikhail. Alexandre était trop fatigué pour recommencer, donc on décida de retourner à la maison et de se reposer pour le faire demain. \n\nEn rentrant, Sofia fronça légèrement les sourcils \"Vous êtes déjà de retour ? Il n'est pourtant que 20h30... vous avez bien trouvé à manger pour le chien ?\" \n\"Mais il est presque minuit, qu'est-ce que tu racontes ?\". \n\nAprès avoir jeté un œil à l'horloge du salon, il était à peine 21h. Nous restâmes tous figés quelques secondes. \"Mais... quoi ?\".",
    imageUrl: "assets/img/Wand/Magichien.png",
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

/**
 * Lore affiché lors de l'atteinte de certains paliers de niveau pour chaque worker.
 * Structure: WORKER_LORE_BY_LEVEL[workerName][level] = LorePayload
 */
export const WORKER_LORE_BY_LEVEL: Record<string, Record<number, LorePayload>> = {
  Fermier: {},
  Mineur: {},
  Forgeron: {
    8: {
      key: 'worker:forgeron:level8',
      title: 'Юрий',
      text: "En continuant notre chemin vers le nord, nous décidons de rester quelques jours dans la ville de Терней afin de faire le plein de ressources. \n\n Un soir au coin du feu, l'alcool coulait à flot et les discussions sur nos vies passées allaient bon train; cependant on remarquait bien que Anatole et Mikhail ne nous disaient pas tout mais en ces temps de désolation, chacun a le droit de garder le silence sur certains sujets. C'est à ce moment que Alexandre se tourna vers moi et me demandit \"Et toi ? On ne sait au final même pas ton nom ou même pourquoi tu tiens tant à rester en vie et à continuer ce voyage.\" \n\n Un vertige commenca à s'installer en moi et d'une voix tremblante je répondis \"Je ne me rappelle de rien... Je me suis réveillé au centre de Vladivostok mais je n'ai aucun souvenir de quoi que ce soit... Et suite à toutes les rumeurs qui disent que Tokyo est une zone sécurisée, j'ai donc décidé d'y aller, pour peut-être retrouver des connaissances, de la famille; je ne sais pas. En tout cas, même si je ne retrouve personne et que la mémoire ne me revient pas, je veux rester en vie.\". \n\n Après lui avoir raconté ça, je ressentis un silence pesant mais je suis conscient que je me devais de leur dire la vérité, même si je ne me rappelle de rien, même si je ne sais pas qui je suis, je ne veux pas mourir ici, dans ces terres désolées. \n\n C'est à ce moment que Mikhail se leva et dit \"Tu sais, on a tous nos raisons de vouloir rester en vie, et c'est très bien comme ça. Je pense que le plus important, c'est qu'on continue à avancer ensemble, peu importe les obstacles qu'on peut rencontrer sur notre chemin.\" \n\n Anatole acquiesça et ajouta \"Exactement, on est une équipe maintenant, et on va s'entraider pour survivre et atteindre notre objectif. Peu importe d'où on vient ou ce qu'on a vécu avant, ce qui compte c'est ce qu'on fait maintenant. Cependant, cela ne nous dit pas comment on peut t'appeler, et si on t'appelait \"Yuri\", c'était le nom de mon chien, je suis sûr que ça lui ferait plaisir.\". \n\n Je répondis sans attendre \"Content de savoir que quand tu penses à moi, tu penses à ton chien!\".",
      imageUrl: null,
    }
  },
    Astrologue: {
      3: {
        key: 'worker:astrologue:level3',
        title: 'Le début de la confiance, et même plus',
        text: "Le premier jour avec Sofia se finit après une grosse journée de marche. Nous n'avions pas forcément l'habitude de voyager avec une femme mais je suis sûr qu'on s'y habituera rapidement. \n\nLa soirée se poursuivit donc au coin du feu \"Merci de m'avoir laissé rejoindre votre groupe, les gars. Je dois bien avouer que cela fait maintenant trois mois que je suis seule et je peux vous dire que ça fait du bien de pouvoir dormir sans avoir peur de se faire piller ou agresser pendant notre sommeil.\" La soirée continua ; on faisait cependant chambre à part, elle préférait dormir dans une tente tandis que nous, on dormait à l'intérieur d'une maison si possible ou sinon à la belle étoile. Avant de dormir, Alexandre se retourna vers moi et me dit \"Eh, Yuri ? Tu es la personne en qui j'ai le plus confiance ici ; pas que je n'aie pas confiance en Mikhail ou Anatole, mais ils sont quand même plus vieux que nous... Alors je me demandais, tu penses quoi de Sofia ? Parce que... je sais pas trop comment dire, mais je la trouve vraiment gentille... et j'aimerais bien apprendre à la connaître un peu plus...\"\n  \"Il est vrai qu'elle est très gentille mais je ne suis en aucun cas intéressé par elle, alors je te souhaite bon courage avec Sofia ! Juste n'en fais pas trop, ce serait dommage de ruiner l'ambiance.\"\n \"Merci de m'avoir écouté, je devais vraiment me confier... et ça me rassure un peu d'en avoir parlé.\"",
        imageUrl: null,
      }
    },
    Magicien: {
      2: {
        key: 'worker:magicien:level2',
        title: 'Un jour sans fin',
        text: "En regardant les réserves, nous nous rendîmes compte que nous avions exactement la même quantité de nourriture qu'avant la chasse, comme si nous n'étions jamais partis. Le chien, lui, remuait doucement la queue en nous regardant. \n\n\"Il va donc falloir retourner chasser...\" dis-je en soupirant \"J'ai faim, et je pense que lui ne dira pas non\". On décida donc d'y aller tous les cinq, accompagnés du chien. Cette fois-ci, il nous suivait de près, presque trop calme. En revenant, on mangea tous ensemble au coin du feu. Le chien dévora sa part avec un appétit impressionnant, comme s'il n'avait pas mangé depuis des jours. Par précaution, on lui donna même un peu plus. \n\nLa nuit passa et le chien dormit près de moi. Le lendemain matin, Alexandre, réveillé plus tôt pour déplacer le tronc, me réveilla en criant \"Yuri ! Le tronc ne bloque plus le passage, on peut continuer !\" \n\"Ah, merci Alexandre, tu dois être fatigué...\" \n\"Non, tu ne comprends pas... il est revenu tout seul dans l'état où je l'avais laissé hier soir\". \n\nJe sortis immédiatement et, en effet, le tronc était dégagé, comme si quelqu'un avait terminé le travail à notre place. \n\nEn revenant vers la maison, Sofia s'approcha de nous \"Je ne suis pas sûre... mais depuis Kaliningrad, je ressens des choses étranges. Là... j'ai l'impression que quelque chose vous a fait revivre ce moment. Comme si... le temps s'était répété.\". Anatole sortit en criant \"Eh Yuri, la nourriture est revenue comme par magie !\" \n\"Et le chien ?\" \n\"Dans la cuisine... mais il n'a même pas touché à sa gamelle ce matin.\". \n\nNous échangeâmes un regard. Le chien nous observait, assis calmement, presque... fier. \n\nSofia reprit doucement \"Je pense qu'il s'est servi de nous... peut-être pour manger. Mais pas seulement. Il est resté seul ici pendant longtemps.\" \n\nMikhail soupira \"Donc maintenant, on garde un chien qui joue avec le temps ?\" \n\nPersonne ne répondit tout de suite. Puis Anatole haussa les épaules \"Honnêtement... il nous a pas fait de mal.\" \n\nJe regardai le chien \"Et puis... je crois qu'il a choisi de rester avec nous.\" \n\nAprès un court silence, Mikhail leva les yeux au ciel \"Bon... très bien. Mais il se débrouille pour manger, je ne chasse pas pour lui tous les jours.\" \n\n\"On l'appellera donc Magichien (Магпёс)\" rétorqua Anatole avec un sourire. \n\n\"Ça lui va bien\" ajouta Alexandre. \n\nEt c'est ainsi que Magichien nous accompagna dans notre périple vers le Nord.",
      }
    },
  // Ajoutez d'autres workers et paliers selon vos besoins
};

