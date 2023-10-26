import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientSocketService } from '@app/services/client-socket.service';
import { LobbyDetails, Pin, SocketId } from '@common/lobby';

@Component({
    selector: 'app-waiting-view-page',
    templateUrl: './waiting-view-page.component.html',
    styleUrls: ['./waiting-view-page.component.scss'],
})
export class WaitingViewPageComponent implements OnInit, OnDestroy {
    players: { socketId: SocketId; name: string }[] = [];
    pin: Pin = '';
    isLocked: boolean = false;

    constructor(
        public router: Router,
        private clientSocket: ClientSocketService,
    ) {}

    get isNameDefined(): boolean {
        return this.clientSocket.isNameDefined;
    }

    get isOrganizer(): boolean {
        return this.clientSocket.isOrganizer;
    }

    get playerName(): string {
        return this.clientSocket.playerName;
    }

    ngOnInit(): void {
        this.configureBaseSocketFeatures();
        this.clientSocket.send('getPlayers');
    }

    ngOnDestroy(): void {
        this.clientSocket.configureOrganisatorLobby(false);
        // Dangereux. Lorsque la partie aura commencé, ce code va trigger et tout le monde quittera le room
        // Je l'ai mis dans le bouton menu principal et dans lobbyClose. Commentaire à supprimer
        // this.clientSocket.send('leaveLobby');
    }

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on('latestPlayerList', (pin: Pin, lobbyDetails: LobbyDetails) => {
            this.pin = pin;
            this.isLocked = lobbyDetails.isLocked;
            this.players = lobbyDetails.players;
        });

        this.clientSocket.socket.on('lobbyClosed', (/*reason*/) => {
            this.clientSocket.send('leaveLobby');
            this.router.navigate(['/home']).then(() => {
                // BUG: Parfois, on reçoit plusieurs alertes. Je sais pas le problème est où
                // window.alert(reason);
            });
        });

        this.clientSocket.socket.on('lockToggled', (isLocked: boolean) => {
            this.isLocked = isLocked;
        });
    }

    banPlayer(player: { socketId: SocketId; name: string }) {
        this.clientSocket.send('banPlayer', player);
    }

    toggleLobbyLock() {
        this.clientSocket.send('toggleLock');
    }
}
