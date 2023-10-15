import { Component, OnDestroy, OnInit } from '@angular/core';
import { ClientSocketService } from '@app/services/client-socket.service';

@Component({
    selector: 'app-waiting-view-page',
    templateUrl: './waiting-view-page.component.html',
    styleUrls: ['./waiting-view-page.component.scss'],
})
export class WaitingViewPageComponent implements OnInit, OnDestroy {
    players: { socketId: string; name: string }[] = [];
    constructor(private clientSocket: ClientSocketService) {}

    ngOnInit(): void {
        this.configureBaseSocketFeatures();
        this.clientSocket.send('getPlayers');
    }

    ngOnDestroy(): void {
        this.clientSocket.canAccessLobby = false;
    }

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on('latestPlayerList', (players: { socketId: string; name: string }[]) => {
            this.players = players;
        });
    }
}
