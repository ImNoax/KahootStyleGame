import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { snackBarErrorConfiguration, snackBarNormalConfiguration } from '@app/constants/snack-bar-configuration';
import { Route } from '@app/enums';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { RouteControllerService } from '@app/services/route-controller.service';
import { TimerService } from '@app/services/timer.service';
import { LobbyDetails, Pin, SocketId } from '@common/lobby';

const GAME_START_INITIAL_COUNT = 5;

@Component({
    selector: 'app-waiting-view-page',
    templateUrl: './waiting-view-page.component.html',
    styleUrls: ['./waiting-view-page.component.scss'],
})
export class WaitingViewPageComponent implements OnInit, OnDestroy {
    players: { socketId: SocketId; name: string }[] = [];
    isLocked: boolean = false;
    gameStarted: boolean = false;
    countDownStarted: boolean = false;
    private snackBar: MatSnackBar = inject(MatSnackBar);
    private routeController: RouteControllerService = inject(RouteControllerService);
    private timer: TimerService = inject(TimerService);

    constructor(
        private router: Router,
        private clientSocket: ClientSocketService,
        private gameHandler: GameHandlingService,
    ) {}

    get isOrganizer(): boolean {
        return this.clientSocket.isOrganizer;
    }

    get playerName(): string {
        return this.clientSocket.playerName;
    }

    get pin(): Pin {
        return this.clientSocket.pin;
    }

    get count(): number {
        return this.timer.count;
    }

    ngOnInit(): void {
        this.configureBaseSocketFeatures();
        this.clientSocket.socket.emit('getPlayers');
    }

    ngOnDestroy(): void {
        this.clientSocket.socket.removeAllListeners('latestPlayerList');
        this.clientSocket.socket.removeAllListeners('lockToggled');
        this.clientSocket.socket.removeAllListeners('countDownEnd');
        this.clientSocket.socket.removeAllListeners('noPlayers');

        this.timer.reset();
        this.routeController.setRouteAccess(Route.Lobby, false);
        if (this.gameStarted) return;
        this.clientSocket.resetPlayerInfo();
    }

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on('latestPlayerList', (lobbyDetails: LobbyDetails) => {
            this.isLocked = lobbyDetails.isLocked;
            this.players = lobbyDetails.players;
            this.gameHandler.setPlayers(this.players);
        });

        this.clientSocket.socket.on('lockToggled', (isLocked: boolean) => {
            this.isLocked = isLocked;
        });

        this.clientSocket.socket.on('countDownEnd', (lastCount: number) => {
            this.timer.count = lastCount;
            this.startGame();
        });

        this.clientSocket.socket.on('noPlayers', () => {
            if (this.countDownStarted) {
                this.timer.reset();
                this.countDownStarted = false;
                this.toggleLobbyLock();
                this.snackBar.open("Tous les joueurs ont quitté la salle d'attente.", '', snackBarErrorConfiguration);
            }
        });
    }

    banPlayer(player: { socketId: SocketId; name: string }) {
        this.clientSocket.socket.emit('banPlayer', player);
    }

    toggleLobbyLock() {
        this.clientSocket.socket.emit('toggleLock');
    }

    startGameEmit() {
        this.countDownStarted = true;
        this.timer.startCountDown(GAME_START_INITIAL_COUNT);
    }

    startGame() {
        if (this.clientSocket.playerName) {
            this.gameStarted = true;
            this.routeController.setRouteAccess(Route.InGame, true);
            this.router.navigate([Route.InGame]);
            return;
        }
        this.router.navigate([Route.MainMenu]);
        this.snackBar.open("Votre nom de joueur n'a pas été défini avant le début de la partie", '', snackBarErrorConfiguration);
    }

    notifyClipboardCopy() {
        this.snackBar.open('PIN copié!', '', snackBarNormalConfiguration);
    }
}
