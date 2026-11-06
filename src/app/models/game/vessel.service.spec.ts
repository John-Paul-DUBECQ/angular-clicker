import { TestBed } from '@angular/core/testing';
import { MonsterStateService } from './monster-state.service';
import { PowerStateService } from './power-state.service';
import { ResourcesService } from './resources.service';
import { VesselRewardNotificationService } from './vessel-reward-notification.service';
import { VesselService } from './vessel.service';
import { WorkerStateService } from './worker-state.service';

describe('VesselService', () => {
  let service: VesselService;

  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(0));
    TestBed.configureTestingModule({
      providers: [
        VesselService,
        { provide: ResourcesService, useValue: {} },
        { provide: WorkerStateService, useValue: {} },
        { provide: PowerStateService, useValue: {} },
        { provide: MonsterStateService, useValue: {} },
        { provide: VesselRewardNotificationService, useValue: {} },
      ],
    });
    service = TestBed.inject(VesselService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    jasmine.clock().uninstall();
  });

  it('spawns the whole wave across its duration', () => {
    service.summonVesselRush(10, 3);

    jasmine.clock().tick(1500);
    service.tick([], []);
    expect(service.getActiveVesselsView().length).toBe(5);

    jasmine.clock().tick(1500);
    service.tick([], []);
    expect(service.getActiveVesselsView().length).toBe(10);
  });
});
