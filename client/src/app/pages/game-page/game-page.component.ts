import { GameHandlingService } from '@angular/../../client/src/app/services/game-handling.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ClientSocketService } from '@app/services/client-socket.service';
import { Game } from '@common/game';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    games: Game[] = [];
    currentQuestion: string = '';
    currentQuestionScore: number;
    score: number;
    private subscriptionScore: Subscription;
    private questionSubscription: Subscription;
    constructor(
        private gameService: GameHandlingService,
        private clientSocket: ClientSocketService,
    ) {}

    ngOnInit(): void {
        this.gameService.setScore(0);
        this.questionSubscription = this.gameService.currentQuestion$.subscribe(() => {
            const game = this.games.find((g) => g.id === this.gameService.currentGameId);
            if (game) {
                this.currentQuestion = game.questions[this.gameService.currentQuestionId].text;
            }
        });
        this.subscriptionScore = this.gameService.score$.subscribe((updatedScore) => {
            this.score = updatedScore;
        });
        this.gameService.setCurrentQuestionId(0);
        this.gameService.getGames().subscribe((data: Game[]) => {
            this.games = data;
            const game = this.games.find((g) => g.id === this.gameService.currentGameId);
            if (this.games.length > 0 && game) {
                this.currentQuestion = game.questions[this.gameService.currentQuestionId].text;
                this.currentQuestionScore = game.questions[this.gameService.currentQuestionId].points;
            }
        });
    }

    leaveLobby(): void {
        this.clientSocket.send('leaveLobby');
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
