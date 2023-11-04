import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { snackBarErrorConfiguration } from '@app/constants/snack-bar-configuration';
import { Route } from '@app/enums';
import { Pin } from '@common/lobby';
import { MessageData } from '@common/message';
import { BehaviorSubject, Observable } from 'rxjs';
import { Socket, io } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ClientSocketService {
    socket: Socket;
    isOrganizer: boolean = false;
    playerName: string = '';
    pin: Pin = '';
    histogramData: BehaviorSubject<{ [key: string]: number }> = new BehaviorSubject({});
    histogramData$: Observable<{ [key: string]: number }> = this.histogramData.asObservable();
    private snackBar: MatSnackBar = inject(MatSnackBar);

    constructor(private router: Router) {}

    isSocketAlive(): boolean {
        return this.socket && this.socket.connected;
    }

    connect(): void {
        if (!this.isSocketAlive()) {
            this.socket = io(environment.serverBaseUrl, { transports: ['websocket'], upgrade: false });

            this.socket.on('disconnect', () => {
                this.snackBar.open('Erreur du serveur ⚠️', '', snackBarErrorConfiguration);
                this.router.navigate([Route.MainMenu]);
            });
        }
    }

    giveOrganiserPermissions(): void {
        this.isOrganizer = true;
        this.playerName = 'Organisateur';
    }

    resetPlayerInfo(): void {
        this.isOrganizer = false;
        this.playerName = '';
        this.socket.emit('leaveLobby');
    }

    listenForGameClosureByOrganiser() {
        this.socket.on('lobbyClosed', (reason, message) => {
            this.router.navigate([Route.MainMenu]);
            if (reason === 'NO HOST') {
                this.snackBar.open(message, '', snackBarErrorConfiguration);
            } else {
                this.snackBar
                    .open(message, 'Rentrer', snackBarErrorConfiguration)
                    .onAction()
                    .subscribe(() => {
                        this.socket.emit('joinLobby', this.pin);
                    });
            }
        });
    }

    listenForStartGame(): Observable<void> {
        return new Observable((observer) => {
            this.socket.on('gameStarted', () => {
                observer.next();
            });
        });
    }

    listenToMessageReceived(): Observable<MessageData> {
        return new Observable((observer) => {
            this.socket.on('messageReceived', (messageData: MessageData) => {
                observer.next(messageData);
            });
        });
    }

    listenUpdateHistogram(): Observable<{ [key: string]: number }> {
        return new Observable((observer) => {
            this.socket.on('updateHistogram', (histogram: { [key: string]: number }) => {
                this.histogramData.next(histogram);
                observer.next(histogram);
            });
        });
    }

    sendUpdateHistogram(histogramData: { [key: string]: number }): void {
        this.socket.emit('histogramUpdate', histogramData);
    }

    sendResetHistogram(): void {
        this.socket.emit('resetHistogram');
    }
}
