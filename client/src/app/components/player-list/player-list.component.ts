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
            if (this.players.length === 0) {
                this.players = lobbyDetails.players;
            }
            this.players.forEach((player) => {
                const updatedPlayer = lobbyDetails.players.find((p) => p.socketId === player.socketId);
                if (!updatedPlayer) {
                    player.isStillInGame = false;
                }
            });
        });

        this.clientSocket.socket.on('scoreUpdated', (updatedPlayer: Player) => {
            const player = this.players.find((p) => p.socketId === updatedPlayer.socketId);
            if (player) {
                player.score = updatedPlayer.score;
            }
        });
    }
}
