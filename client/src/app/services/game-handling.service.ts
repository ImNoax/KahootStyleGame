import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Game } from '@common/game';
import { GameMode } from '@common/game-mode';
import { Observable, of } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GameHandlingService {
    currentGame: Game;
    gameMode: GameMode = GameMode.RealGame;
    currentQuestionId: number = 0;
    scoreSource = new BehaviorSubject<number>(0);
    score$ = this.scoreSource.asObservable();
    currentQuestionSource = new BehaviorSubject<string>('');
    currentQuestion$ = this.currentQuestionSource.asObservable();
    private readonly baseUrl: string = environment.serverGamesUrl;
    private players: { socketId: string; name: string }[] = [];

    constructor(private http: HttpClient) {}

    getGames(): Observable<Game[]> {
        return this.http.get<Game[]>(this.baseUrl).pipe(catchError(this.handleError<Game[]>('getGames')));
    }

    setPlayers(players: { socketId: string; name: string }[]): void {
        this.players = players;
    }

    getPlayerNameBySocketId(socketId: string): string {
        const player = this.players.find((plyer) => plyer.socketId === socketId);
        return player ? player.name : 'Unknown';
    }

    modifyGame(game: Game): Observable<Game[]> {
        return this.http.patch<Game[]>(`${this.baseUrl}/${game.id}`, game).pipe(catchError(this.handleError<Game[]>('modifyGame')));
    }

    addGame(newGame: Game): Observable<Game[]> {
        return this.http.post<Game[]>(this.baseUrl, newGame).pipe(catchError(this.handleError<Game[]>('addGame')));
    }

    changeVisibility(game: Game): Observable<Game[]> {
        return this.http
            .patch<Game[]>(`${this.baseUrl}/visibility/${game.id}`, { isVisible: game.isVisible })
            .pipe(catchError(this.handleError<Game[]>('changeVisibility')));
    }

    export(id: string) {
        return this.http.get<Game>(`${this.baseUrl}/${id}`, { responseType: 'json' });
    }

    setCurrentQuestion(question: string): void {
        this.currentQuestionSource.next(question);
    }

    setScore(newScore: number): void {
        this.scoreSource.next(newScore);
    }

    setCurrentQuestionId(id: number) {
        this.currentQuestionId = id;
    }

    incrementScore(amount: number): void {
        const newScore = this.scoreSource.value + amount;
        this.scoreSource.next(newScore);
    }

    deleteGame(id: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(catchError(this.handleError<void>('deleteGame')));
    }

    verifyAdminPassword(password: string): Observable<boolean> {
        return this.http
            .post<{ valid: boolean }>(`${environment.serverAdminUrl}/verify-admin-password`, { password })
            .pipe(map((response) => response.valid));
    }

    private handleError<T>(request: string, result?: T): (error: { error: Error }) => Observable<T> {
        return (error) => {
            window.alert(error.error.message);
            return of(result as T);
        };
    }
}
