import { ShopItem } from "../shop-item";
import { WorkerAuto } from "../worker-auto-model";
import { Power } from "../powers/power.model";

/**
 * Vue agrégée du jeu pour l'UI. Les données réelles sont dans Resources, WorkerState, ShopState, PowerState.
 */
export class Game {
    clicks!: number;
    mana!: number;
    maxMana!: number;
    workers!: WorkerAuto[];
    workersAvailable!: WorkerAuto[];
    clickValue!: number;
    valueAutoPerSecond!: number;
    shopItems!: ShopItem[];
    /** Pouvoirs disponibles (ex. débloqués par le Magicien). Renseigné par PowerStateService. */
    powersAvailable?: Power[];
    sunUnlocked?: boolean;
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
}
