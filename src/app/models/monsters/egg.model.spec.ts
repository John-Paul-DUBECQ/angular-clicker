import { EGG_RESOURCES, EggResource, eggUnlockDefinition } from './egg.model';
import { listMonster } from './list-monster';

describe('eggs', () => {
  it('builds one egg named after each monster', () => {
    expect(EGG_RESOURCES.length).toBe(listMonster.length);
    const mosh = new EggResource({ id: 'monster1', name: 'Mosh', biome: 'forest' });
    expect(mosh.id).toBe('egg-monster1');
    expect(mosh.name).toBe('Œuf de Mosh');
    expect(EGG_RESOURCES.every((egg) => egg.name === `Œuf de ${listMonster.find((monster) => monster.id === egg.monsterId)?.name}`)).toBeTrue();
  });

  it('appears as a farmer tier at level 400', () => {
    expect(eggUnlockDefinition.levelRequired).toBe(400);
  });
});
