import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PowerAreaComponent } from './power-area.component';

describe('PowerAreaComponent', () => {
  let component: PowerAreaComponent;
  let fixture: ComponentFixture<PowerAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PowerAreaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PowerAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
