import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {Game} from "./game";
import {Observable} from "rxjs";
import { WorkerAuto } from '../worker-auto-model';

@Injectable({
  providedIn: 'root'
})
export class GameService {

  public workerSelected: WorkerAuto | null = null;
  
  private readonly gameUrl: string;

  constructor(private http: HttpClient) {
    this.gameUrl = 'http://localhost:8080/game';
  }

  public getGame(): Observable<Game> {
    return this.http.get<Game>(this.gameUrl);
  }

  public getGameInfo(): Observable<Game> {
    return this.http.get<Game>(this.gameUrl + '/gameInfo');
  }

  public click(): Observable<void> {
    return this.http.post<void>(this.gameUrl + '/click', null);
  }

  public upgradeWorker(workerId: number): Observable<void> {
    return this.http.post<void>(this.gameUrl + '/upgrade-worker?workerId=' + workerId, null);
  }
}
