import { Component, OnDestroy, OnInit } from '@angular/core';
import { ClientSocketService } from '@app/services/client-socket.service';
import { LobbyDetails, Player } from '@common/lobby';
@Component({
    selector: 'app-player-list',
    templateUrl: './player-list.component.html',
    styleUrls: ['./player-list.component.scss'],
})
export class PlayerListComponent implements OnInit, OnDestroy {
    players: Player[] = [];
    constructor(private clientSocket: ClientSocketService) {}

    ngOnInit(): void {
        this.configureBaseSocketFeatures();
        this.clientSocket.socket.emit('getPlayers');
    }

    ngOnDestroy(): void {
        this.clientSocket.socket.removeAllListeners('latestPlayerList');
    }

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on('latestPlayerList', (lobbyDetails: LobbyDetails) => {
            this.players = lobbyDetails.players;
        });
    }
}
