import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game';

@Injectable({
    providedIn: 'root',
})
export class GameHandlingService {
    constructor(private http: HttpClient) {}

    getGames() {
        return this.http.get<Game[]>('assets/jeux.json');
    }
}
