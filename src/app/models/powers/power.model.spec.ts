import { getPowerDoesAppearInGame } from './power.model';
import { listPower } from './list-power';
import { VESSEL_WORKER_INDEX } from '../unlocks/vessel';

describe('Power unlock methods', () => {
  const vesselRush = listPower.find((power) => power.id === 'vessel-rush')!;

  it('unlocks Rafale stellaire at Geometer level 35', () => {
    expect(vesselRush.unlockMethod?.getWorkerLevelRequirement(VESSEL_WORKER_INDEX)).toBe(35);
    expect(getPowerDoesAppearInGame(vesselRush, {
      clicks: 0,
      getWorkerLevel: (workerIndex) => workerIndex === VESSEL_WORKER_INDEX ? 31 : 1,
    })).toBe(false);
    expect(getPowerDoesAppearInGame(vesselRush, {
      clicks: 0,
      getWorkerLevel: (workerIndex) => workerIndex === VESSEL_WORKER_INDEX ? 35 : 1,
    })).toBe(true);
  });
});
