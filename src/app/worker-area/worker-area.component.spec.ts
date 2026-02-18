import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkerAreaComponent } from './worker-area.component';

describe('WorkerAreaComponent', () => {
  let component: WorkerAreaComponent;
  let fixture: ComponentFixture<WorkerAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkerAreaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkerAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
