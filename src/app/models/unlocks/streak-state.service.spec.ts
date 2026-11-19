import { TestBed } from '@angular/core/testing';
import { MissionStateService } from '../game/mission-state.service';
import { WorkerStateService } from '../game/worker-state.service';
import { StreakStateService } from './streak-state.service';

describe('StreakStateService mission progress', () => {
  it('counts each transition into the active streak phase', () => {
    TestBed.configureTestingModule({});
    const streak = TestBed.inject(StreakStateService);
    const missions = TestBed.inject(MissionStateService);
    const workerState = TestBed.inject(WorkerStateService);
    const workersAvailable = workerState.getWorkersAvailable();
    const smith = workersAvailable[3];
    smith.level = 10;
    workerState.setWorkers([smith]);
    missions.setSaveData({
      slots: [{
        id: 0,
        mission: {
          id: 'streak-test',
          objective: {
            type: 'activate-streak',
            target: 3,
            progress: 0,
            description: 'Activer la barre de streak 3 fois',
          },
          ticketReward: 2,
        },
        cooldownEndsAt: 0,
        cooldownReason: null,
        lastReward: 0,
      }],
      unlockedSlots: 1,
      unseen: false,
    });

    streak.onClick([smith], workersAvailable, 800);
    for (let i = 0; i < 20; i += 1) {
      streak.tick(1, [smith], workersAvailable);
    }
    streak.onClick([smith], workersAvailable, 800);

    expect(missions.getView(true)[0].mission?.objective.progress).toBe(2);
    TestBed.resetTestingModule();
  });
});
