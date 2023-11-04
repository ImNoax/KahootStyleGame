import { GameHandlingService } from '@angular/../../client/src/app/services/game-handling.service';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { GameMode, Route } from '@app/enums';
import { ClientSocketService } from '@app/services/client-socket.service';
import { RouteControllerService } from '@app/services/route-controller.service';
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
    histogramData: { [key: string]: number };
    private subscriptionScore: Subscription;
    private questionSubscription: Subscription;
    private histogramSubscription: Subscription;
    private routeController: RouteControllerService = inject(RouteControllerService);

    constructor(
        private gameService: GameHandlingService,
        private clientSocket: ClientSocketService,
        private router: Router,
    ) {}

    get isOrganiser() {
        return this.clientSocket.isOrganizer;
    }

    ngOnInit(): void {
        this.gameService.setScore(0);
        this.questionSubscription = this.gameService.currentQuestion$.subscribe(() => {
            const currentGame = this.games.find((game) => game.id === this.gameService.currentGameId);
            if (currentGame) {
                this.currentQuestion = currentGame.questions[this.gameService.currentQuestionId].text;
            }
        });
        this.subscriptionScore = this.gameService.score$.subscribe((updatedScore) => {
            this.score = updatedScore;
        });
        this.histogramSubscription = this.clientSocket.listenUpdateHistogram().subscribe((data) => {
            this.histogramData = data;
        });
        this.gameService.setCurrentQuestionId(0);
        this.gameService.getGames().subscribe((data: Game[]) => {
            this.games = data;
            const currentGame = this.games.find((game) => game.id === this.gameService.currentGameId);
            if (this.games.length > 0 && currentGame) {
                this.currentQuestion = currentGame.questions[this.gameService.currentQuestionId].text;
                this.currentQuestionScore = currentGame.questions[this.gameService.currentQuestionId].points;
            }
        });

        this.clientSocket.listenForGameClosureByOrganiser();
    }

    ngOnDestroy(): void {
        if (this.subscriptionScore) {
            this.subscriptionScore.unsubscribe();
        }

        if (this.questionSubscription) {
            this.questionSubscription.unsubscribe();
        }

        if (this.histogramSubscription) {
            this.histogramSubscription.unsubscribe();
        }

        this.clientSocket.resetPlayerInfo();
        this.routeController.setRouteAccess(Route.InGame, false);
    }

    leaveGame(): void {
        if (this.gameService.gameMode === GameMode.Testing) {
            this.router.navigate([Route.GameCreation]);
            return;
        }
        this.router.navigate([Route.MainMenu]);
    }

    onUpdateQuestionScore(score: number) {
        this.currentQuestionScore = score;
    }
}
