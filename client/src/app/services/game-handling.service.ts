import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Jeu } from '@common/jeu';

@Injectable({
    providedIn: 'root',
})
export class GameHandlingService {
    constructor(private http: HttpClient) {}

    getGames() {
        return this.http.get<Jeu[]>('assets/jeux.json');
    }
}
