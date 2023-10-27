import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { MessageData } from '@common/message';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ClientSocketService {
    socket: Socket;
    canAccessLobby: boolean = false;
    isOrganizer: boolean = false;
    isNameDefined: boolean = false;
    playerName: string = '';

    constructor(private router: Router) {}

    isSocketAlive(): boolean {
        return this.socket && this.socket.connected;
    }

    connect(): void {
        if (!this.isSocketAlive()) {
            this.socket = io(environment.serverBaseUrl, { transports: ['websocket'], upgrade: false });

            this.socket.on('disconnect', () => {
                this.router.navigate(['/home']);
            });
        }
    }

    send(event: string, ...data: (string | number | object | boolean)[]): void {
        this.socket.emit(event, ...data);
    }

    configureOrganisatorLobby(canAccessLobby: boolean): void {
        this.canAccessLobby = canAccessLobby;
        this.isOrganizer = canAccessLobby;
        this.isNameDefined = canAccessLobby;

        if (canAccessLobby) {
            this.playerName = 'Organisateur';
            return;
        }
        this.playerName = '';
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
}
