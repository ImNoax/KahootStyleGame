import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Jeu } from '@common/jeu';
import { Observable, of } from 'rxjs';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
const BONUS_POINTS = 1.2;
@Injectable({
    providedIn: 'root',
})
export class GameHandlingService {
    currentGameId: number = 2;
    currentQuestionId: number = 0;
    scoreSource = new BehaviorSubject<number>(0);
    score$ = this.scoreSource.asObservable();
    currentQuestionSource = new BehaviorSubject<string>('');
    currentQuestion$ = this.currentQuestionSource.asObservable();
    private readonly baseUrl: string = environment.serverGamesUrl;
    private players: { socketId: string; name: string }[] = [];

    constructor(private http: HttpClient) {}

    getGames(): Observable<Jeu[]> {
        return this.http.get<Jeu[]>(this.baseUrl).pipe(catchError(this.handleError<Jeu[]>('getGames')));
    }

    setPlayers(players: { socketId: string; name: string }[]): void {
        this.players = players;
    }

    getPlayerNameBySocketId(socketId: string): string {
        const player = this.players.find((plyer) => plyer.socketId === socketId);
        return player ? player.name : 'Unknown';
    }

    modifyGame(game: Jeu, gameName: string): Observable<Jeu[]> {
        return this.http.patch<Jeu[]>(`${this.baseUrl}/${game.id}`, [game, gameName]).pipe(catchError(this.handleError<Jeu[]>('modifyGame')));
    }

    addGame(newGame: Jeu): Observable<Jeu[]> {
        return this.http.post<Jeu[]>(this.baseUrl, newGame).pipe(catchError(this.handleError<Jeu[]>('addGame')));
    }

    changeVisibility(game: Jeu): Observable<Jeu[]> {
        return this.http
            .patch<Jeu[]>(`${this.baseUrl}/visibility/${game.id}`, { isVisible: game.isVisible })
            .pipe(catchError(this.handleError<Jeu[]>('changeVisibility')));
    }

    export(id: number) {
        return this.http.get<Jeu>(`${this.baseUrl}/${id}`, { responseType: 'json' });
    }

    setCurrentGameId(id: number) {
        this.currentGameId = id;
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
        const newScore = this.scoreSource.value + amount * BONUS_POINTS;
        this.scoreSource.next(newScore);
    }

    deleteGame(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(catchError(this.handleError<void>('deleteGame')));
    }

    verifyAdminPassword(password: string): Observable<boolean> {
        return this.http
            .post<{ valid: boolean }>(`${environment.serverAdminUrl}/verify-admin-password`, { password })
            .pipe(map((response) => response.valid));
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
