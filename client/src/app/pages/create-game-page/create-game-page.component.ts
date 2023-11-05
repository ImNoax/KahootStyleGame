import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { snackBarErrorConfiguration } from '@app/constants/snack-bar-configuration';
import { GameMode, Route } from '@app/enums';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { RouteControllerService } from '@app/services/route-controller.service';
import { Game } from '@common/game';
import { Pin } from '@common/lobby';

@Component({
    selector: 'app-create-game-page',
    templateUrl: './create-game-page.component.html',
    styleUrls: ['./create-game-page.component.scss'],
})
export class CreateGamePageComponent implements OnInit, OnDestroy {
    games: Game[];
    selectedRowIndex: number | null = null;
    selectedGame: Game | null = null;
    testing: GameMode = GameMode.Testing;
    snackBar: MatSnackBar = inject(MatSnackBar);
    routeController: RouteControllerService = inject(RouteControllerService);

    constructor(
        public router: Router,
        private gameHandler: GameHandlingService,
        private clientSocket: ClientSocketService,
    ) {}

    ngOnInit(): void {
        this.routeController.setRouteAccess(Route.Admin, false);
        this.gameHandler.getGames().subscribe((games: Game[]) => {
            this.games = games;
        });
        this.configureBaseSocketFeatures();
    }

    ngOnDestroy(): void {
        this.clientSocket.socket.removeAllListeners('successfulLobbyCreation');
        this.clientSocket.socket.removeAllListeners('failedLobbyCreation');
    }

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on('successfulLobbyCreation', (pin: Pin) => {
            this.clientSocket.giveOrganiserPermissions();
            this.clientSocket.pin = pin;
            this.routeController.setRouteAccess(Route.Lobby, true);
            this.router.navigate([Route.Lobby]);
        });

        this.clientSocket.socket.on('failedLobbyCreation', (reason) => {
            this.snackBar.open(reason, '', snackBarErrorConfiguration);
        });
    }

    selectRow(index: number | null) {
        this.selectedRowIndex = index;
        this.selectedGame = index !== null ? this.games[index] : null;
    }

    allGamesAreHiddenOrListIsEmpty() {
        if (!this.games || this.games.length === 0) {
            return true;
        }
        return this.games.every((game) => !game.isVisible);
    }

    initializeGame(mode: GameMode = GameMode.RealGame) {
        this.gameHandler.getGames().subscribe((games: Game[]) => {
            this.games = games;

            for (const game of this.games) {
                if (game.id === this.selectedGame?.id && game.isVisible) {
                    this.gameHandler.setCurrentGameId(this.selectedGame.id);
                    this.gameHandler.gameMode = mode;
                    if (mode === GameMode.Testing) {
                        this.routeController.setRouteAccess(Route.InGame, true);
                        this.router.navigate([mode]);
                    } else this.clientSocket.socket.emit('createLobby', this.gameHandler.currentGameId);

                    return;
                }
            }
            window.alert('Erreur: Jeu Indisponible... Rafraichissement de page.');
            this.selectRow(null);
        });
    }
}
