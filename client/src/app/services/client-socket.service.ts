import { Injectable } from '@angular/core';
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
}
