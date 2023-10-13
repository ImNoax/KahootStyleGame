import { GameHandlingService } from '@angular/../../client/src/app/services/game-handling.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Jeu } from '@common/jeu';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    games: Jeu[] = [];
    currentQuestion: string = '';
    currentQuestionScore: number;
    score: number;
    private subscriptionScore: Subscription;
    private questionSubscription: Subscription;
    constructor(private gameService: GameHandlingService) {}

    ngOnInit(): void {
        this.gameService.setScore(0);
        this.questionSubscription = this.gameService.currentQuestion$.subscribe(() => {
            if (this.games[this.gameService.currentGameId]) {
                this.currentQuestion = this.games[this.gameService.currentGameId].questions[this.gameService.currentQuestionId].text;
                this.currentQuestionScore = this.games[this.gameService.currentGameId].questions[this.gameService.currentQuestionId].points;
            }
        });
        this.subscriptionScore = this.gameService.score$.subscribe((updatedScore) => {
            this.score = updatedScore;
        });
        this.gameService.setCurrentQuestionId(0);
        this.gameService.getGames().subscribe((data: Jeu[]) => {
            this.games = data;
            if (this.games.length > 0) {
                this.currentQuestion = this.games[this.gameService.currentGameId].questions[this.gameService.currentQuestionId].text;
                this.currentQuestionScore = this.games[this.gameService.currentGameId].questions[this.gameService.currentQuestionId].points;
            }
        });
    }

    ngOnDestroy(): void {
        if (this.subscriptionScore) {
            this.subscriptionScore.unsubscribe();
        }

        if (this.questionSubscription) {
            this.questionSubscription.unsubscribe();
        }
    }
}
