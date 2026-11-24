import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GameService } from "./models/game/game.service";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import { WorkerAreaComponent } from './worker-area/worker-area.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import { ShopItemAreaComponent } from './shop-item-area/shop-item-area.component';
import { SunAreaComponent } from './sun-area/sun-area.component';
import { PowerAreaComponent } from './power-area/power-area.component';
import { FormatNumberPipe } from './pipes/format-number.pipe';
import { LoreMessageComponent } from './lore-message/lore-message.component';
import { EssenceShopItemAreaComponent } from './essence-shop-item-area/essence-shop-item-area.component';
import { HouseAreaComponent } from './house-area/house-area.component';
import { NgScrollbarModule } from 'ngx-scrollbar';


@NgModule({
    declarations: [
        AppComponent,
        WorkerAreaComponent,
        ShopItemAreaComponent,
        SunAreaComponent,
        PowerAreaComponent,
        LoreMessageComponent,
        EssenceShopItemAreaComponent,
        HouseAreaComponent,
        FormatNumberPipe,
    ],
    imports: [
        BrowserModule,
        CommonModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        MatIconModule,
        MatTooltipModule,
        NgScrollbarModule,
    ],
    providers: [
        GameService,
        provideHttpClient(withInterceptorsFromDi()),
    ],
    bootstrap: [AppComponent],
})
export class AppModule { }

