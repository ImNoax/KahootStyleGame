import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Jeu } from '@common/jeu';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameHandlingService {
    currentGameId: number = 0;
    currentQuestionId: number = 0;

    private readonly baseUrl: string = environment.serverUrl;

    constructor(private http: HttpClient) {}

    getGames(): Observable<Jeu[]> {
        return this.http.get<Jeu[]>(`${this.baseUrl}/jeux`).pipe(catchError(this.handleError<Jeu[]>('getGames')));
    }

    addGame(newGame: Jeu): Observable<Jeu[]> {
        return this.http.post<Jeu[]>(`${this.baseUrl}/jeux`, newGame).pipe(catchError(this.handleError<Jeu[]>('addGame')));
    }

    changeVisibility(game: Jeu) {
        return this.http
            .patch<Jeu[]>(`${this.baseUrl}/jeux`, { isVisible: !game.isVisible })
            .pipe(catchError(this.handleError<Jeu[]>('changeVisibility')));
    }

    export(id: number) {
        return this.http.get<Jeu>(`${this.baseUrl}/jeux/${id}`, { responseType: 'json' });
    }

    setCurrentGameId(id: number) {
        this.currentGameId = id;
    }

    setCurrentQuestionId(id: number) {
        this.currentQuestionId = id;
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
