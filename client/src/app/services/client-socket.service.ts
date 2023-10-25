import { Injectable } from '@angular/core';
import { MessageData } from '@common/message';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class ClientSocketService {
    socket: Socket;
    canAccessNameDefinition: boolean = false;
    canAccessLobby: boolean = false;

    get socketId() {
        return this.socket.id ? this.socket.id : '';
    }

    isSocketAlive() {
        return this.socket && this.socket.connected;
    }

    connect() {
        if (!this.isSocketAlive()) {
            this.socket = io(environment.serverBaseUrl, { transports: ['websocket'], upgrade: false });
        }
    }

    send(event: string, ...data: (string | number | object | boolean)[]): void {
        this.socket.emit(event, ...data);
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
