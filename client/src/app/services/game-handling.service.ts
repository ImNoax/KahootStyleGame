import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Jeu } from '@common/jeu';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
    providedIn: 'root',
})
export class GameHandlingService {
    private readonly baseUrl: string = 'http://localhost:3000/api';

    constructor(private http: HttpClient) {}

    getGames(): Observable<Jeu[]> {
        return this.http.get<Jeu[]>(`${this.baseUrl}/jeux`).pipe(catchError(this.handleError<Jeu[]>('getGames')));
    }

    private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
        return () => of(result as T);
    }
}
