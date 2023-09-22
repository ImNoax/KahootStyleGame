import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Game } from '@app/interfaces/game';
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

    getGames(): Observable<Game[]> {
        return this.http.get<Game[]>(`${this.baseUrl}/`).pipe(catchError(this.handleError<Game[]>('getGames')));
    }

    addGame(game: Game) {
        this.http.post(`${this.baseUrl}/`, game).subscribe();
    }

    changeVisibility(game: Game) {
        return this.http
            .patch<Game[]>(`${this.baseUrl}/Gamex/`, { isVisible: !game.isVisible })
            .pipe(catchError(this.handleError<Game[]>('changeVisibility')));
    }

    export(id: number) {
        return this.http.get<Game>(`${this.baseUrl}/Gamex/${id}`, { responseType: 'json' });
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }

    setCurrentGameId(id: number) {
        this.currentGameId = id;
    }

    setCurrentQuestionId(id: number) {
        this.currentQuestionId = id;
    }
}
