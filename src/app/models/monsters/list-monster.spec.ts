import { listMonster } from './list-monster';
import { MONSTER_WORKER_INDEX } from '../unlocks/monster-unlock';
import { EXPLORER_WORKER_INDEX } from '../unlocks/explorer-unlock';

describe('listMonster', () => {
  it('débloque les quatre nouveaux monstres avec l’Explorateur', () => {
    const context = {
      clicks: 0,
      getWorkerLevel: (workerIndex: number) => workerIndex === EXPLORER_WORKER_INDEX ? 1 : null,
    };

    const newMonsters = listMonster.filter((monster) =>
      ['monster4', 'monster5', 'monster6', 'monster7'].includes(monster.id)
    );

    expect(newMonsters.length).toBe(4);
    newMonsters.forEach((monster) => {
      expect(monster.unlockMethod?.isUnlocked(context)).toBeTrue();
      expect(monster.biome).toBe('beach');
    });
  });

  it('does not unlock aquatic monsters from the alchemist alone', () => {
    const context = {
      clicks: 0,
      getWorkerLevel: (workerIndex: number) => workerIndex === MONSTER_WORKER_INDEX ? 10 : null,
    };
    const aquaticMonsters = listMonster.filter((monster) => monster.biome === 'beach');

    aquaticMonsters.forEach((monster) => {
      expect(monster.unlockMethod?.isUnlocked(context)).toBeFalse();
    });
  });

  it('respecte les anciens paliers des monstres', () => {
    const context = {
      clicks: 0,
      getWorkerLevel: (workerIndex: number) => workerIndex === MONSTER_WORKER_INDEX ? 1 : null,
    };

    expect(listMonster[0].unlockMethod?.isUnlocked(context)).toBeTrue();
    expect(listMonster[1].unlockMethod?.isUnlocked(context)).toBeFalse();
    expect(listMonster[2].unlockMethod?.isUnlocked(context)).toBeFalse();
  });
});