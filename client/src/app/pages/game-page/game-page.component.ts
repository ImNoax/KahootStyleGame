import { Component } from '@angular/core';
import { GameHandlingService } from '@angular/../../client/src/app/services/game-handling.service';
import { Jeu } from '@common/jeu';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent {
    games: Jeu[] = [];
    currentQuestion: string = '';
    constructor(private gameService: GameHandlingService) { }

    ngOnInit(): void {
        this.gameService.getGames().subscribe((data: Jeu[]) => {
            this.games = data;
            if (this.games.length > 0) {
                this.currentQuestion = this.games[this.gameService.currentGameId].questions[this.gameService.currentQuestionId].text;
            }
        });
    }

    updateQuestion() {
        this.currentQuestion = this.games[this.gameService.currentGameId].questions[this.gameService.currentQuestionId].text;
    }
}