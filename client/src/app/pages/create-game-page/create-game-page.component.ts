import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GameHandlingService } from '@app/services/game-handling.service';
import { Jeu } from '@common/jeu';

@Component({
    selector: 'app-create-game-page',
    templateUrl: './create-game-page.component.html',
    styleUrls: ['./create-game-page.component.scss'],
})
export class CreateGamePageComponent implements OnInit {
    games: Jeu[] = [];
    selectedRowIndex: number | null = null;
    selectedGame: Jeu | null = null;
    constructor(
        private gameHandler: GameHandlingService,
        public router: Router,
    ) {}

    ngOnInit(): void {
        this.gameHandler.getGames().subscribe((games: Jeu[]) => {
            this.games = games;
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

    testerJeu() {
        this.gameHandler.getGames().subscribe((games: Jeu[]) => {
            this.games = games;

            for (const game of this.games) {
                if (game.id === this.selectedGame?.id && game.isVisible) {
                    this.gameHandler.setCurrentGameId(this.selectedGame.id);
                    this.router.navigate(['/game']);
                    return;
                }
            }
            window.alert('Erreur: Jeu Indisponible... Rafraichissement de page.');
            this.selectRow(null);
        });
    }
}
