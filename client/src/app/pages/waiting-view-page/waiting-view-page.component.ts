import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { LobbyDetails, Pin, SocketId } from '@common/lobby';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-waiting-view-page',
    templateUrl: './waiting-view-page.component.html',
    styleUrls: ['./waiting-view-page.component.scss'],
})
export class WaitingViewPageComponent implements OnInit, OnDestroy {
    players: { socketId: SocketId; name: string }[] = [];
    pin: Pin = '';
    isLocked: boolean = false;
    gameStarted: boolean = false;
    private startGameSubscription: Subscription;

    constructor(
        public router: Router,
        private clientSocket: ClientSocketService,
        private gameHandler: GameHandlingService,
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
        this.startGameSubscription = this.clientSocket.listenForStartGame().subscribe(() => {
            this.startGame();
        });
    }

    ngOnDestroy(): void {
        this.clientSocket.configureOrganisatorLobby(false);
        if (this.startGameSubscription) {
            this.startGameSubscription.unsubscribe();
        }
    }

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on('latestPlayerList', (pin: Pin, lobbyDetails: LobbyDetails) => {
            this.pin = pin;
            this.isLocked = lobbyDetails.isLocked;
            this.players = lobbyDetails.players;
            this.gameHandler.setPlayers(this.players);
        });

        this.clientSocket.socket.on('lobbyClosed', (/* reason*/) => {
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

    startGameEmit() {
        this.clientSocket.socket.emit('startGame', { pin: this.pin });
    }

    startGame() {
        this.gameStarted = true;
        this.router.navigate(['/game']);
    }
}
