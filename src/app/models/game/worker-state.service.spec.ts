import { LoreNotificationService } from '../lore/lore-notification.service';
import { ResourcesService } from './resources.service';
import { WorkerStateService } from './worker-state.service';

describe('WorkerStateService bulk upgrades', () => {
  let resources: ResourcesService;
  let service: WorkerStateService;

  beforeEach(() => {
    resources = new ResourcesService();
    service = new WorkerStateService(resources, new LoreNotificationService());
    const worker = service.getWorkersAvailable()[0];
    worker.basePrice = 10;
    worker.curvePrice = 2;
  });

  it('charges the cumulative price curve for a fixed number of levels', () => {
    resources.setClicks(70);

    expect(service.upgradeWorker(0, () => 1, 3)).toBeTrue();
    expect(service.getWorkersAvailable()[0].level).toBe(3);
    expect(resources.getClicks()).toBe(0);
  });

  it('does not partially buy a fixed batch the player cannot afford', () => {
    resources.setClicks(69);

    expect(service.upgradeWorker(0, () => 1, 3)).toBeFalse();
    expect(service.getWorkersAvailable()[0].level).toBe(0);
    expect(resources.getClicks()).toBe(69);
  });

  it('previews the full fixed-batch cost and marks it unaffordable', () => {
    resources.setClicks(69);

    expect(service.getUpgradePricePreview(0, 3)).toEqual({
      levels: 3,
      totalPrice: 70,
      canBuy: false,
    });
  });

  it('previews the levels and total cost available for a maximum purchase', () => {
    resources.setClicks(69);

    expect(service.getUpgradePricePreview(0, 'max')).toEqual({
      levels: 2,
      totalPrice: 30,
      canBuy: true,
    });
  });

  it('buys the maximum affordable number of levels', () => {
    resources.setClicks(70);

    expect(service.upgradeWorker(0, () => 1, 'max')).toBeTrue();
    expect(service.getWorkersAvailable()[0].level).toBe(3);
    expect(resources.getClicks()).toBe(0);
  });
});
