import { ShopItem } from "../shop-item";
import { WorkerAuto } from "../worker-auto-model";
import { Power } from "../powers/power.model";
import type { CurrentMonsterView } from "./monster-state.service";
import type { ActiveVesselView } from "./vessel.service";
import { LorePayload } from "../lore/lore-notification.service";
import { EssenceShopItem } from "../essence-shop-item";
import { House } from "../house";
import { ResourceStock } from "../resource";

/**
 * Vue agrégée du jeu pour l'UI. Les données réelles sont dans Resources, WorkerState, ShopState, PowerState.
 */
export class Game {
    clicks!: number;
    mana!: number;
    maxMana!: number;
    /** Nombre total de clics manuels sur la zone de clic. */
    totalManualClicks?: number;
    workers!: WorkerAuto[];
    workersAvailable!: WorkerAuto[];
    clickValue!: number;
    valueAutoPerSecond!: number;
    shopItems!: ShopItem[];
    /** Pouvoirs disponibles (ex. débloqués par le Magicien). Renseigné par PowerStateService. */
    powersAvailable?: Power[];
    sunUnlocked?: boolean;
    /** Multiplicateur de dégâts du clic soleil (niveau Astrologue + upgrades). */
    sunDamageMultiplier?: number;
    /** Facteur durée rotation soleil (1 = 8s, <1 = plus rapide). */
    sunSpeedFactor?: number;
    /** Facteur taille du soleil (1 = base). */
    sunSizeFactor?: number;
    /** Zone pouvoirs/mana débloquée (Magicien niveau 1). */
    powerUnlocked?: boolean;
    criticalHitUnlocked?: boolean;
    streakUnlocked?: boolean;
    streakBarCurrent?: number;
    streakBarMax?: number;
    streakActive?: boolean;
    streakDamageMultiplier?: number;
    /** Buff dégâts actif (ex. x2 pendant 1 min). */
    damageBuffActive?: boolean;
    damageBuffMultiplier?: number;
    damageBuffRemainingSeconds?: number;
    /** Buff weakness actif (streak : moins de clics, barre descend moins vite → barre jaune). */
    weaknessBuffActive?: boolean;
    /** Pour chaque power.id ayant un effet à durée : pourcentage de temps restant (0–100) pour l’horloge sur la border. */
    powerEffectRemainingPercent?: Record<string, number>;
    /** Zone monstre débloquée (Alchimiste). */
    monsterUnlocked?: boolean;
    /** Monstre actuel à la place du clicker (PV, temps restant). */
    currentMonster?: CurrentMonsterView | null;
    /** Nombre de monstres en attente derrière le monstre actuel. */
    queuedMonsterCount?: number;
    /** Jauge rencontre 0–100 : plus c’est haut, plus le cercle s’assombrit (prochain mob proche). */
    encounterMeterPercent?: number;
    /** Essence / âmes (récompense mob, plus si tué à la dernière seconde). */
    monsterEssence?: number;
    /** Shop d'essences disponible après le déblocage de l'Architecte. */
    essenceShopUnlocked?: boolean;
    essenceShopItems?: EssenceShopItem[];
    essenceShopStats?: { spawnRate: number; essence: number; hp: number; time: number };
    /** Maisons passives débloquées avec le shop d'essences. */
    houses?: House[];
    resources?: ResourceStock[];
    /** Vaisseaux débloqués (Géomètre). */
    vesselUnlocked?: boolean;
    /** Vaisseaux en cours de traversée (gauche → droite). */
    activeVessels?: ActiveVesselView[];
    acteActual!: number; // à quel acte le jeu est actuellement (commence à 1)
    /** Historique des lores vus. */
    loreHistory?: LorePayload[];
}
