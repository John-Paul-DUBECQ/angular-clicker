import { UnlockContext, UnlockMethod } from '../unlocks/unlock-method';

/**
 * L'Explorateur est le dernier worker de `workersAvailable` (index 9).
 * `EXPLORER_WORKER_INDEX` désigne un autre worker et ne sert pas ici.
 */
export const KITCHEN_EXPLORER_INDEX = 9;
export const KITCHEN_EXPLORER_LEVEL = 60;

export function isKitchenUnlocked(getWorkerLevel: (workerIndex: number) => number | null): boolean {
  return (getWorkerLevel(KITCHEN_EXPLORER_INDEX) ?? 0) >= KITCHEN_EXPLORER_LEVEL;
}

export function explorerLevelUnlock(level: number, description = `Explorateur niveau ${level}`): UnlockMethod {
  return UnlockMethod.custom(
    (context: UnlockContext) => (context.getWorkerLevel(KITCHEN_EXPLORER_INDEX) ?? 0) >= level,
    description,
    [{ workerIndex: KITCHEN_EXPLORER_INDEX, level }]
  );
}
