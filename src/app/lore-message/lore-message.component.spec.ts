import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoreMessageComponent } from './lore-message.component';

describe('LoreMessageComponent', () => {
  let component: LoreMessageComponent;
  let fixture: ComponentFixture<LoreMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoreMessageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoreMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
