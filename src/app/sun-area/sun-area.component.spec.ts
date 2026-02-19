import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SunAreaComponent } from './sun-area.component';

describe('SunAreaComponent', () => {
  let component: SunAreaComponent;
  let fixture: ComponentFixture<SunAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SunAreaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SunAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
