import { Component, OnDestroy, OnInit } from '@angular/core';
import { ClientSocketService } from '@app/services/client-socket.service';
import { LobbyDetails, Pin, Player } from '@common/lobby';
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
        this.clientSocket.socket.on('latestPlayerList', (pin: Pin, lobbyDetails: LobbyDetails) => {
            if (this.players.length === 0) {
                this.players = lobbyDetails.players;
            } else {
                for (const player of this.players) {
                    const playerStillPresent = lobbyDetails.players.some((p) => p.socketId === player.socketId);
                    player.isStillInGame = playerStillPresent;
                }
            }
        });
    }
}
