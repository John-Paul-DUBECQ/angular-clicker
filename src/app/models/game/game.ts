import { ShopItem } from "../shop-item";
import { WorkerAuto } from "../worker-auto-model";
/**
 * Game class
 * @class Game
 * @description Game class
 * @property clicks - number of clicks
 * @property workers - array of workers
 * @property workersAvailable - array of all workers
 * @property clickValue - value of each click
 * @property valueAutoPerSecond - value of auto per second
 * @property shopItems - array of shop items
 * @property sunUnlocked - if the sun is unlocked
 * @property criticalHitUnlocked - if the critical hit is unlocked
 * @property streakUnlocked - if the streak bar is unlocked
 * @property streakBarCurrent - current fill of the streak bar (0..streakBarMax)
 * @property streakBarMax - clicks required to fill the bar
 * @property streakActive - true when bar is in "bonus" phase (descending)
 * @property streakDamageMultiplier - damage multiplier when streak is active (e.g. 3)
 */
export class Game {
    clicks!: number;
    workers!: WorkerAuto[];
    workersAvailable!: WorkerAuto[];
    clickValue!: number;
    valueAutoPerSecond!: number;
    shopItems!: ShopItem[];
    sunUnlocked?: boolean;
    criticalHitUnlocked?: boolean;
    streakUnlocked?: boolean;
    streakBarCurrent?: number;
    streakBarMax?: number;
    streakActive?: boolean;
    streakDamageMultiplier?: number;
}
