import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { snackBarErrorConfiguration, snackBarNormalConfiguration } from '@app/constants/snack-bar-configuration';
import { Route } from '@app/enums';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { RouteControllerService } from '@app/services/route-controller.service';
import { LobbyDetails, Pin, SocketId } from '@common/lobby';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-waiting-view-page',
    templateUrl: './waiting-view-page.component.html',
    styleUrls: ['./waiting-view-page.component.scss'],
})
export class WaitingViewPageComponent implements OnInit, OnDestroy {
    players: { socketId: SocketId; name: string }[] = [];
    isLocked: boolean = false;
    gameStarted: boolean = false;
    startTimer: number = 0;
    gameStarting: boolean = false;
    private snackBar: MatSnackBar = inject(MatSnackBar);
    private routeController: RouteControllerService = inject(RouteControllerService);
    private startGameSubscription: Subscription;

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

    ngOnInit(): void {
        this.configureBaseSocketFeatures();
        this.clientSocket.socket.emit('getPlayers');
        this.startGameSubscription = this.clientSocket.listenForStartGame().subscribe(() => {
            this.startGame();
        });
    }

    ngOnDestroy(): void {
        if (this.startGameSubscription) {
            this.startGameSubscription.unsubscribe();
        }

        this.clientSocket.socket.removeAllListeners('latestPlayerList');
        this.clientSocket.socket.removeAllListeners('lockToggled');
        this.clientSocket.socket.removeAllListeners('countDown');
        if (this.gameStarted) return;
        this.clientSocket.resetPlayerInfo();
        this.routeController.setRouteAccess(Route.Lobby, false);
    }

    configureBaseSocketFeatures() {
        this.clientSocket.listenForGameClosureByOrganiser();

        this.clientSocket.socket.on('latestPlayerList', (lobbyDetails: LobbyDetails) => {
            this.isLocked = lobbyDetails.isLocked;
            this.players = lobbyDetails.players;
            this.gameHandler.setPlayers(this.players);
        });

        this.clientSocket.socket.on('lockToggled', (isLocked: boolean) => {
            this.isLocked = isLocked;
        });

        this.clientSocket.socket.on('countDown', (countDown: number) => {
            this.startTimer = countDown;
        });
    }

    banPlayer(player: { socketId: SocketId; name: string }) {
        this.clientSocket.socket.emit('banPlayer', player);
    }

    toggleLobbyLock() {
        this.clientSocket.socket.emit('toggleLock');
    }

    startGameEmit() {
        this.gameStarting = true;
        this.clientSocket.socket.emit('startGame');
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
