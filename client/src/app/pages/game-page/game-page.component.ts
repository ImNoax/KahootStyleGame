import { GameHandlingService } from '@angular/../../client/src/app/services/game-handling.service';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Route } from '@app/enums';
import { ClientSocketService } from '@app/services/client-socket.service';
import { RouteControllerService } from '@app/services/route-controller.service';
import { TimerService } from '@app/services/timer.service';
import { Game } from '@common/game';
import { GameMode } from '@common/game-mode';

import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-game-page',
    templateUrl: './game-page.component.html',
    styleUrls: ['./game-page.component.scss'],
})
export class GamePageComponent implements OnInit, OnDestroy {
    currentGame: Game;
    currentQuestion: string = '';
    currentQuestionScore: number;
    bonusTimes: number;
    score: number;
    showResults: boolean = false;
    histogramData: { [key: string]: number };
    private subscriptionScore: Subscription;
    private questionSubscription: Subscription;
    private histogramSubscription: Subscription;
    private routeController: RouteControllerService = inject(RouteControllerService);
    private timer: TimerService = inject(TimerService);

    constructor(
        private gameService: GameHandlingService,
        private clientSocket: ClientSocketService,
        private router: Router,
    ) {}

    get isOrganiser() {
        return this.clientSocket.isOrganizer;
    }

    get isQuestionTransition(): boolean {
        return this.timer.isQuestionTransition;
    }

    get transitionCount(): number {
        return this.timer.transitionCount;
    }

    get transitionMessage(): string {
        return this.timer.transitionMessage;
    }

    ngOnInit(): void {
        this.currentGame = this.gameService.currentGame;
        this.gameService.setScore(0);

        this.questionSubscription = this.gameService.currentQuestion$.subscribe(() => {
            this.currentQuestion = this.currentGame.questions[this.gameService.currentQuestionId].text;
        });

        this.subscriptionScore = this.gameService.score$.subscribe((updatedScore) => {
            this.score = updatedScore;
            this.clientSocket.socket.emit('submitScore', updatedScore);
        });

        this.histogramSubscription = this.clientSocket.listenUpdateHistogram().subscribe((data) => {
            this.histogramData = data;
        });

        this.gameService.setCurrentQuestionId(0);
        this.currentQuestion = this.currentGame.questions[this.gameService.currentQuestionId].text;
        this.currentQuestionScore = this.currentGame.questions[this.gameService.currentQuestionId].points;

        this.clientSocket.socket.on('showResults', () => {
            this.showResults = true;
        });
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

        this.timer.reset();
        this.clientSocket.socket.removeAllListeners('showResults');
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
