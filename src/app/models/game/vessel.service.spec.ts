import { TestBed } from '@angular/core/testing';
import { MonsterStateService } from './monster-state.service';
import { PowerStateService } from './power-state.service';
import { ResourcesService } from './resources.service';
import { VesselRewardNotificationService } from './vessel-reward-notification.service';
import { VesselService } from './vessel.service';
import { WorkerStateService } from './worker-state.service';
import { HouseStateService } from './house-state.service';
import { ShopStateService } from './shop-state.service';
import { listVessel } from './vessels/list-vessel';

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
        { provide: HouseStateService, useValue: { getVesselUpgradeBonuses: () => ({ rewardMultiplier: 1, spawnIntervalFactor: 1 }) } },
        { provide: ShopStateService, useValue: { getUnlockBonus: () => 0.5 } },
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

  it('applies shop bonuses to vessel movement speed', () => {
    service.summonVesselRush(1, 1);
    jasmine.clock().tick(1000);
    service.tick([], []);
    jasmine.clock().tick(1000);
    service.tick([], []);

    const vessel = service.getActiveVesselsView()[0];
    const baseSpeed = listVessel.find((entry) => entry.id === vessel.vesselId)?.speed ?? 25;

    expect(vessel.speed).toBe(baseSpeed * 1.5);
    expect(vessel.leftPercent).toBe(vessel.speed);
  });
});
