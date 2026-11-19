import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'Clicker Game'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('Clicker Game');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Clicker Game');
  });

  it('shows a shop notification for new items until the shop is opened', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game.shopItems = [{
      id: 'new-shop-item',
      name: 'New item',
      description: '',
      price: 1,
      doesAppearInGame: true,
      bought: false,
      value: 1,
    }];

    expect(app.hasNewShopItems).toBeTrue();
    app.setDesktopView('shop');
    expect(app.hasNewShopItems).toBeFalse();

    app.game.shopItems.push({
      id: 'another-new-shop-item',
      name: 'Another item',
      description: '',
      price: 2,
      doesAppearInGame: true,
      bought: false,
      value: 1,
    });
    expect(app.hasNewShopItems).toBeTrue();
  });

  it('shows a houses notification for newly available houses until the houses page is opened', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    app.game.houses = [{
      id: 'new-house',
      name: 'New house',
      description: '',
      imageUrl: '',
      level: 0,
      bonusPerLevel: 0,
      price: 1,
      costs: [],
    }];

    expect(app.hasNewHouses).toBeFalse();
    app.game.housesUnlocked = true;
    expect(app.hasNewHouses).toBeTrue();
    app.setDesktopView('houses');
    expect(app.hasNewHouses).toBeFalse();

    app.game.houses.push({
      id: 'another-new-house',
      name: 'Another house',
      description: '',
      imageUrl: '',
      level: 0,
      bonusPerLevel: 0,
      price: 1,
      costs: [],
    });
    expect(app.hasNewHouses).toBeTrue();
  });

  it('shows an essence-shop notification until that shop is opened', () => {
    const app = TestBed.createComponent(AppComponent).componentInstance;
    expect(app.hasNewEssenceShop).toBeFalse();

    app.game.essenceShopUnlocked = true;
    expect(app.hasNewEssenceShop).toBeTrue();

    app.setDesktopView('essenceShop');
    expect(app.hasNewEssenceShop).toBeFalse();
  });

});
