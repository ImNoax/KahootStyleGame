import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Jeu } from '@common/jeu';

@Injectable({
    providedIn: 'root',
})
export class GameHandlingService {
    currentGameId: number = 0;
    currentQuestionId: number = 0;

    constructor(private http: HttpClient) {}

    getGames() {
        return this.http.get<Jeu[]>('assets/jeux.json');
    }

    setCurrentGameId(id: number) {
        this.currentGameId = id;
    }

    setCurrentQuestionId(id: number) {
        this.currentQuestionId = id;
    }
}
