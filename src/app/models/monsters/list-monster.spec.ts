import { listMonster } from './list-monster';
import { MONSTER_WORKER_INDEX } from '../unlocks/monster-unlock';

describe('listMonster', () => {
  it('débloque les quatre nouveaux monstres avec l’Explorateur', () => {
    const context = {
      clicks: 0,
      getWorkerLevel: (workerIndex: number) => workerIndex === MONSTER_WORKER_INDEX ? 1 : null,
    };

    const newMonsters = listMonster.filter((monster) =>
      ['monster4', 'monster5', 'monster6', 'monster7'].includes(monster.id)
    );

    expect(newMonsters.length).toBe(4);
    newMonsters.forEach((monster) => {
      expect(monster.unlockMethod?.isUnlocked(context)).toBeTrue();
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