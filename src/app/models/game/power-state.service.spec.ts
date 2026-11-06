import { TestBed } from '@angular/core/testing';
import { listPower } from '../powers/list-power';
import { MonsterStateService } from './monster-state.service';
import { PowerStateService } from './power-state.service';
import { ResourcesService } from './resources.service';
import { WorkerStateService } from './worker-state.service';

describe('PowerStateService vessel rush', () => {
  let resources: ResourcesService;
  let service: PowerStateService;
  let vesselRushIndex: number;

  beforeEach(() => {
    resources = new ResourcesService();
    resources.setMana(100);
    resources.setResourceAmounts({ bait: 10 });
    TestBed.configureTestingModule({
      providers: [
        PowerStateService,
        { provide: ResourcesService, useValue: resources },
        { provide: MonsterStateService, useValue: {} },
        { provide: WorkerStateService, useValue: {} },
      ],
    });
    service = TestBed.inject(PowerStateService);
    vesselRushIndex = listPower.findIndex((power) => power.id === 'vessel-rush');
  });

  afterEach(() => TestBed.resetTestingModule());

  it('spends 10 bait and 100 mana to cast the vessel rush', () => {
    const summonVessels = jasmine.createSpy('summonVessels');

    expect(service.castPower(vesselRushIndex, undefined, summonVessels)).toBe(true);
    expect(resources.getResourceAmount('bait')).toBe(0);
    expect(resources.getMana()).toBe(0);
    expect(summonVessels).toHaveBeenCalledWith(10, 3);
  });

  it('does not spend mana or cast when the bait cost cannot be paid', () => {
    resources.setResourceAmounts({ bait: 9 });
    const summonVessels = jasmine.createSpy('summonVessels');

    expect(service.castPower(vesselRushIndex, undefined, summonVessels)).toBe(false);
    expect(resources.getMana()).toBe(100);
    expect(summonVessels).not.toHaveBeenCalled();
  });
});
