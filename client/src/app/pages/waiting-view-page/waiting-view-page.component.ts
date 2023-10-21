import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientSocketService } from '@app/services/client-socket.service';

@Component({
    selector: 'app-waiting-view-page',
    templateUrl: './waiting-view-page.component.html',
    styleUrls: ['./waiting-view-page.component.scss'],
})
export class WaitingViewPageComponent implements OnInit, OnDestroy {
    players: { socketId: string; name: string }[] = [];
    pin: string;
    isLocked: boolean;
    isOrganizer: boolean;

    constructor(
        public router: Router,
        private clientSocket: ClientSocketService,
    ) {}

    ngOnInit(): void {
        this.configureBaseSocketFeatures();
        this.clientSocket.send('getPlayers');
        this.clientSocket.send('getStatus');
    }

    ngOnDestroy(): void {
        this.clientSocket.canAccessLobby = false;
    }

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on(
            'latestPlayerList',
            (roomData: { pin: string; players: { socketId: string; name: string }[]; isLocked: boolean }) => {
                this.players = roomData.players;
                this.pin = roomData.pin;
                this.isLocked = roomData.isLocked;
            },
        );

        this.clientSocket.socket.on('lobbyClosed', () => {
            this.router.navigate(['/home']);
        });

        this.clientSocket.socket.on('statusOrganizer', () => {
            this.isOrganizer = true;
        });

        this.clientSocket.socket.on('statusNotOrganizer', () => {
            this.isOrganizer = false;
        });
    }
}
