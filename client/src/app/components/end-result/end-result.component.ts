import { Component, OnInit } from '@angular/core';
import { ClientSocketService } from '@app/services/client-socket.service';
import { LobbyDetails, Player } from '@common/lobby';
@Component({
    selector: 'app-end-result',
    templateUrl: './end-result.component.html',
    styleUrls: ['./end-result.component.scss'],
})
export class EndResultComponent implements OnInit {
    players: Player[] = [];
    constructor(private clientSocket: ClientSocketService) {}
    ngOnInit(): void {
        this.configureBaseSocketFeatures();
        this.clientSocket.socket.emit('getPlayers');
    }

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on('latestPlayerList', (lobbyDetails: LobbyDetails) => {
            this.players = lobbyDetails.players;
        });
    }
}
