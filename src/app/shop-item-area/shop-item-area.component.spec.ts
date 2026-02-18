import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShopItemAreaComponent } from './shop-item-area.component';

describe('ShopItemAreaComponent', () => {
  let component: ShopItemAreaComponent;
  let fixture: ComponentFixture<ShopItemAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShopItemAreaComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ShopItemAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
