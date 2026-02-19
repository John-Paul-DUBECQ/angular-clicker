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
 */
export class Game {
    clicks!: number;
    workers!: WorkerAuto[];
    workersAvailable!: WorkerAuto[];
    clickValue!: number;
    valueAutoPerSecond!: number;
    shopItems!: ShopItem[];
    sunUnlocked?: boolean;
}
