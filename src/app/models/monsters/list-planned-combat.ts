import { UnlockMethod } from '../unlocks/unlock-method';
import { MONSTER_WORKER_INDEX } from '../unlocks/monster-unlock';
import {
  PlannedCombat,
  PlannedCombatBaitEncounter,
  PlannedCombatDamageMode,
  PlannedCombatEnemy,
  PlannedCombatReward,
} from './planned-combat.model';
import { MonsterBiomeId } from './monster-biome.model';

function enemy(id: string, name: string, maxHp: number, imageUrl: string): PlannedCombatEnemy {
  return { id, name, maxHp, imageUrl };
}

function createCombat(
  id: string,
  biome: MonsterBiomeId,
  level: number,
  name: string,
  description: string,
  enemies: PlannedCombatEnemy[],
  timeLimitSeconds: number,
  cooldownSeconds: number,
  firstReward: PlannedCombatReward,
  repeatReward: PlannedCombatReward,
  options: {
    previousCombatId?: string;
    damageMode?: PlannedCombatDamageMode;
    baitEncounter?: PlannedCombatBaitEncounter;
  } = {}
): PlannedCombat {
  return {
    id,
    biome,
    level,
    name,
    description,
    enemies,
    timeLimitSeconds,
    cooldownSeconds,
    unlockMethod: options.previousCombatId
      ? UnlockMethod.plannedCombatCompleted(options.previousCombatId)
      : UnlockMethod.workerLevel(MONSTER_WORKER_INDEX, 1),
    damageMode: options.damageMode ?? 'any',
    firstReward,
    repeatReward,
    baitEncounter: options.baitEncounter,
  };
}

export const listPlannedCombat: PlannedCombat[] = [
  createCombat(
    'planned-mosh-hunt', 'forest', 1, 'Chasse au Mosh',
    'Un affrontement préparé contre un Mosh particulièrement coriace.',
    [enemy('mosh', 'Mosh', 1.2e15, 'assets/img/shadocks/mosh.png')],
    60, 60,
    { clicks: 500, essence: 5, resources: [{ resourceId: 'mosh-tooth', amount: 3 }] },
    { clicks: 150, essence: 1 }
  ),
  createCombat(
    'planned-super-mosh', 'forest', 2, 'Le retour du Super-Mosh',
    'Le combat suivant attend la victoire précédente.',
    [enemy('super-mosh', 'Super-Mosh', 1.8e15, 'assets/img/shadocks/mosh.png')],
    90, 2 * 60,
    { clicks: 2500, essence: 20, resources: [{ resourceId: 'super-mosh-core', amount: 1 }] },
    { clicks: 700, essence: 4 },
    { previousCombatId: 'planned-mosh-hunt' }
  ),
  createCombat(
    'planned-forest-03', 'forest', 3, 'Le sac des clairières',
    'Sac Poubelle Sama bloque le sentier avec l’aide d’un Mosh.',
    [
      enemy('sac-poubelle-sama', 'Sac Poubelle Sama', 2e15, 'assets/img/shadocks/sac-poubelle-sama.png'),
      enemy('mosh', 'Mosh', 4e14, 'assets/img/shadocks/mosh.png'),
    ],
    90, 3 * 60,
    { clicks: 5000, essence: 35, resources: [{ resourceId: 'detritus', amount: 2 }] },
    { clicks: 1000, essence: 5 },
    { previousCombatId: 'planned-super-mosh' }
  ),
  createCombat(
    'planned-forest-04', 'forest', 4, 'Les mains de Gribouy',
    'Deux Gribouy défendent le passage au milieu des arbres.',
    [
      enemy('gribouy', 'Gribouy', 8.5e14, 'assets/img/shadocks/gribouyi.png'),
      enemy('gribouy-scout', 'Éclaireur Gribouy', 6.5e14, 'assets/img/shadocks/gribouyi.png'),
    ],
    90, 4 * 60,
    { clicks: 7500, essence: 45, resources: [{ resourceId: 'gribouy-ink', amount: 2 }] },
    { clicks: 1500, essence: 7 },
    { previousCombatId: 'planned-forest-03' }
  ),
  createCombat(
    'planned-forest-05', 'forest', 5, 'Le retour du Mosh',
    'Un Mosh et un Super-Mosh ont pris possession du vieux campement.',
    [
      enemy('mosh', 'Mosh', 9.5e14, 'assets/img/shadocks/mosh.png'),
      enemy('super-mosh', 'Super-Mosh', 7.5e14, 'assets/img/shadocks/mosh.png'),
    ],
    95, 5 * 60,
    { clicks: 10000, essence: 60, resources: [{ resourceId: 'mosh-tooth', amount: 5 }] },
    { clicks: 2000, essence: 10 },
    {
      previousCombatId: 'planned-forest-04',
      baitEncounter: {
        unlockWins: 10,
        baitCost: 5,
        rewards: [{ resourceId: 'mosh-paw', amount: 1 }],
      },
    }
  ),
  createCombat(
    'planned-forest-06', 'forest', 6, 'La décharge sauvage',
    'Sac Poubelle Sama s’est renforcé avec tout ce qu’il a trouvé.',
    [enemy('sac-poubelle-sama', 'Sac Poubelle Sama', 2.4e15, 'assets/img/shadocks/sac-poubelle-sama.png')],
    100, 6 * 60,
    { clicks: 15000, essence: 80, resources: [{ resourceId: 'detritus', amount: 4 }] },
    { clicks: 3000, essence: 14 },
    { previousCombatId: 'planned-forest-05' }
  ),
  createCombat(
    'planned-forest-07', 'forest', 7, 'L’encre du sous-bois',
    'Gribouy et son complice sont de retour, plus robustes que jamais.',
    [
      enemy('gribouy', 'Gribouy', 5.3e15, 'assets/img/shadocks/gribouyi.png'),
      enemy('gribouy-scout', 'Éclaireur Gribouy', 6e14, 'assets/img/shadocks/gribouyi.png'),
    ],
    105, 7 * 60,
    { clicks: 20000, essence: 110, resources: [{ resourceId: 'gribouy-ink', amount: 4 }] },
    { clicks: 4000, essence: 18 },
    { previousCombatId: 'planned-forest-06' }
  ),
  createCombat(
    'planned-forest-08', 'forest', 8, 'Le Super-Mosh rôdeur',
    'Le Super-Mosh a quitté son territoire avec un garde du corps.',
    [
      enemy('super-mosh', 'Super-Mosh', 9e15, 'assets/img/shadocks/mosh.png'),
      enemy('sac-poubelle-sama', 'Sac Poubelle Sama', 8e14, 'assets/img/shadocks/sac-poubelle-sama.png'),
    ],
    110, 8 * 60,
    { clicks: 26000, essence: 145, resources: [{ resourceId: 'super-mosh-core', amount: 2 }] },
    { clicks: 5200, essence: 23 },
    { previousCombatId: 'planned-forest-07' }
  ),
  createCombat(
    'planned-forest-09', 'forest', 9, 'Le gardien des racines',
    'Trois créatures se dressent entre vous et le cœur de la forêt.',
    [
      enemy('mosh', 'Mosh', 1e15, 'assets/img/shadocks/mosh.png'),
      enemy('gribouy', 'Gribouy', 3.9e15, 'assets/img/shadocks/gribouyi.png'),
      enemy('sac-poubelle-sama', 'Sac Poubelle Sama', 8e15, 'assets/img/shadocks/sac-poubelle-sama.png'),
    ],
    115, 9 * 60,
    { clicks: 34000, essence: 190, resources: [{ resourceId: 'detritus', amount: 6 }] },
    { clicks: 6800, essence: 30 },
    { previousCombatId: 'planned-forest-08' }
  ),
  createCombat(
    'planned-forest-10', 'forest', 10, 'Le cœur de la forêt',
    'Vainquez le dernier gardien pour ouvrir la route vers la plage.',
    [enemy('forest-guardian', 'Gardien de la forêt', 3.6e15, 'assets/img/shadocks/gribouyi.png')],
    120, 10 * 60,
    { clicks: 45000, essence: 250, resources: [{ resourceId: 'gribouy-ink', amount: 6 }] },
    { clicks: 9000, essence: 40, resources: [{ resourceId: 'bait', amount: 2 }]  },
    {
      previousCombatId: 'planned-forest-09',
      baitEncounter: {
        unlockWins: 3,
        baitCost: 10,
        rewards: [{ resourceId: 'mosh-paw', amount: 1 }],
      },
    }
  ),
  createCombat(
    'planned-beach-01', 'beach', 1, 'Éclaboussure de Calque',
    'Un Calque rapide vous barre l’accès au rivage.',
    [enemy('calque', 'Calque', 3.6e16, 'assets/img/shadocks/aquaticMobs/calque.png')],
    100, 1 * 60,
    { clicks: 60000, essence: 300, resources: [{ resourceId: 'sea-food', amount: 6 }] },
    { clicks: 12000, essence: 50 },
    { previousCombatId: 'planned-forest-10' }
  ),
  createCombat(
    'planned-beach-02', 'beach', 2, 'Le Molusk du récif',
    'Un Molusk et un Calque défendent les rochers de la côte.',
    [
      enemy('molusk', 'Molusk', 5.2e16, 'assets/img/shadocks/aquaticMobs/molusk.png'),
      enemy('calque', 'Calque', 8.7e16, 'assets/img/shadocks/aquaticMobs/calque.png'),
    ],
    105, 2 * 60,
    { clicks: 75000, essence: 375, resources: [{ resourceId: 'shell', amount: 2 }] },
    { clicks: 15000, essence: 60 },
    { previousCombatId: 'planned-beach-01' }
  ),
  createCombat(
    'planned-beach-03', 'beach', 3, 'Le mystère de Peji',
    'Peji surgit des eaux et défend le passage vers les falaises.',
    [enemy('peji', 'Peji', 8.32e17, 'assets/img/shadocks/aquaticMobs/peji.png')],
    110, 3 *60,
    { clicks: 90000, essence: 450, resources: [{ resourceId: 'mermaid-tail', amount: 1 }] },
    { clicks: 18000, essence: 72 },
    { previousCombatId: 'planned-beach-02' }
  ),
  createCombat(
    'planned-beach-04', 'beach', 4, 'Le chant du Pwaskay',
    'Un Pwaskay et un Calque vous attirent vers les eaux profondes.',
    [
      enemy('pwaskay', 'Pwaskay', 2.5e17, 'assets/img/shadocks/aquaticMobs/pwaskay.png'),
      enemy('calque', 'Calque', 1.8e17, 'assets/img/shadocks/aquaticMobs/calque.png'),
      enemy('calque', 'Calque', 1.9e17, 'assets/img/shadocks/aquaticMobs/calque.png'),
      enemy('calque', 'Calque', 2.0e18, 'assets/img/shadocks/aquaticMobs/calque.png'),
    ],
    115, 4 * 60,
    { clicks: 110000, essence: 550, resources: [{ resourceId: 'bulb', amount: 1 }] },
    { clicks: 22000, essence: 88 },
    { previousCombatId: 'planned-beach-03' }
  ),
  createCombat(
    'planned-beach-05', 'beach', 5, 'La carapace fendue',
    'Un Molusk et un Peji particulièrement robustes gardent la plage.',
    [
      enemy('molusk', 'Molusk', 2.7e18, 'assets/img/shadocks/aquaticMobs/molusk.png'),
      enemy('peji', 'Peji', 2.34e19, 'assets/img/shadocks/aquaticMobs/peji.png'),
    ],
    120, 5 * 60,
    { clicks: 135000, essence: 675, resources: [{ resourceId: 'shell', amount: 3 }] },
    { clicks: 27000, essence: 108 },
    {
      previousCombatId: 'planned-beach-04',
      damageMode: 'afk',
      baitEncounter: {
        unlockWins: 10,
        baitCost: 5,
        rewards: [{ resourceId: 'peji-tongue', amount: 1 }],
      },
    }
  ),
  createCombat(
    'planned-beach-06', 'beach', 6, 'Le retour de Calque',
    'Un Calque renforcé revient accompagné d’un courant violent.',
    [enemy('calque', 'Calque', 5.4e20, 'assets/img/shadocks/aquaticMobs/calque.png')],
    125, 6 * 60,
    { clicks: 165000, essence: 825, resources: [{ resourceId: 'sea-food', amount: 10 }] },
    { clicks: 33000, essence: 132 },
    { previousCombatId: 'planned-beach-05', damageMode: 'click' }
  ),
  createCombat(
    'planned-beach-07', 'beach', 7, 'La queue des profondeurs',
    'Peji et un Pwaskay se sont renforcés dans les profondeurs.',
    [
      enemy('peji', 'Peji', 3e20, 'assets/img/shadocks/aquaticMobs/peji.png'),
      enemy('pwaskay', 'Pwaskay', 2.76e20, 'assets/img/shadocks/aquaticMobs/pwaskay.png'),
    ],
    130, 7 * 60,
    { clicks: 200000, essence: 1000, resources: [{ resourceId: 'mermaid-tail', amount: 2 }] },
    { clicks: 40000, essence: 160 },
    { previousCombatId: 'planned-beach-06' }
  ),
  createCombat(
    'planned-beach-08', 'beach', 8, 'Lueur sous-marine',
    'Le Pwaskay protège une étrange lueur avec l’aide d’un Molusk.',
    [
      enemy('pwaskay', 'Pwaskay', 3.2e21, 'assets/img/shadocks/aquaticMobs/pwaskay.png'),
      enemy('molusk', 'Molusk', 2.92e21, 'assets/img/shadocks/aquaticMobs/molusk.png'),
    ],
    135, 8 * 60,
    { clicks: 240000, essence: 1200, resources: [{ resourceId: 'bulb', amount: 2 }] },
    { clicks: 48000, essence: 192 },
    { previousCombatId: 'planned-beach-07' }
  ),
  createCombat(
    'planned-beach-09', 'beach', 9, 'Le maître du récif',
    'Trois défenseurs gardent l’entrée de la haute mer.',
    [
      enemy('calque', 'Calque', 2.3e22, 'assets/img/shadocks/aquaticMobs/calque.png'),
      enemy('molusk', 'Molusk', 2.3e22, 'assets/img/shadocks/aquaticMobs/molusk.png'),
      enemy('peji', 'Peji', 9e21, 'assets/img/shadocks/aquaticMobs/peji.png'),
    ],
    140, 9 * 60,
    { clicks: 290000, essence: 1450, resources: [{ resourceId: 'shell', amount: 5 }] },
    { clicks: 58000, essence: 232 },
    { previousCombatId: 'planned-beach-08' }
  ),
  createCombat(
    'planned-beach-10', 'beach', 10, 'Le gardien des marées',
    'Vainquez le gardien pour révéler la prochaine destination.',
    [enemy('peji', 'Gardien des marées', 6.84e24, 'assets/img/shadocks/aquaticMobs/peji.png')],
    145, 10 * 60,
    { clicks: 350000, essence: 1750, resources: [{ resourceId: 'sea-food', amount: 15 }] },
    { clicks: 70000, essence: 280, resources: [{ resourceId: 'bait', amount: 2 }] },
    {
      previousCombatId: 'planned-beach-09',
      baitEncounter: {
        unlockWins: 10,
        baitCost: 10,
        rewards: [{ resourceId: 'peji-tongue', amount: 1 }],
      },
    }
  ),
];
