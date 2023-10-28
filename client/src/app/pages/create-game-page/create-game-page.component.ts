import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameMode } from '@app/enums';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { Game } from '@common/game';

@Component({
    selector: 'app-create-game-page',
    templateUrl: './create-game-page.component.html',
    styleUrls: ['./create-game-page.component.scss'],
})
export class CreateGamePageComponent implements OnInit {
    games: Game[];
    selectedRowIndex: number | null = null;
    selectedGame: Game | null = null;
    testing: GameMode = GameMode.Testing;

    constructor(
        public router: Router,
        private gameHandler: GameHandlingService,
        private clientSocket: ClientSocketService,
    ) {}

    ngOnInit(): void {
        this.gameHandler.getGames().subscribe((games: Game[]) => {
            this.games = games;
        });
        this.configureBaseSocketFeatures();
    }

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on('successfulLobbyCreation', () => {
            this.clientSocket.configureOrganisatorLobby(true);
            this.router.navigate(['/waiting']);
        });

        this.clientSocket.socket.on('failedLobbyCreation', (reason) => {
            window.alert(reason);
        });
    }

    selectRow(index: number | null) {
        this.selectedRowIndex = index;
        this.selectedGame = index !== null ? this.games[index] : null;
    }

    allGamesAreHiddenOrListIsEmpty() {
        if (this.games.length === 0) {
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
                    if (mode !== this.testing) {
                        this.clientSocket.isOrganizer = true;
                        this.clientSocket.send('createLobby');
                    } else {
                        this.router.navigate([mode]);
                    }
                    return;
                }
            }
            window.alert('Erreur: Jeu Indisponible... Rafraichissement de page.');
            this.selectRow(null);
        });
    }
}
