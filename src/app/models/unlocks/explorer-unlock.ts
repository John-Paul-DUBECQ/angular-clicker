import { WorkerAutoData } from '../worker-auto-model';

export const EXPLORER_WORKER_INDEX = 8;
export const EXPLORER_LEVEL_REQUIRED = 1;

export function isExplorerUnlocked(
  workers: WorkerAutoData[],
  workersAvailable: WorkerAutoData[]
): boolean {
  const explorer = workersAvailable[EXPLORER_WORKER_INDEX];
  return !!explorer
    && workers.includes(explorer)
    && explorer.level >= EXPLORER_LEVEL_REQUIRED;
}
