import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GameService } from "./models/game/game.service";
import { HttpClientModule } from "@angular/common/http";
import { WorkerAreaComponent } from './worker-area/worker-area.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatIconModule } from '@angular/material/icon';
import {MatTooltipModule} from '@angular/material/tooltip';
import { ShopItemAreaComponent } from './shop-item-area/shop-item-area.component';
import { SunAreaComponent } from './sun-area/sun-area.component';

@NgModule({
  declarations: [
    AppComponent,
    WorkerAreaComponent,
    ShopItemAreaComponent,
    SunAreaComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatIconModule,
    MatTooltipModule,
  ],
  providers: [GameService],
  bootstrap: [AppComponent]
})
export class AppModule { }
