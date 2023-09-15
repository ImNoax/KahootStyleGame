import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GameHandlingService {

    constructor(private http: HttpClient) {
    }

    getGames() {
        return this.http.get<{ id: number, name: string, description: string, timePerQuestion: number, questions: object }[]>('assets/jeux.json');
    }
}