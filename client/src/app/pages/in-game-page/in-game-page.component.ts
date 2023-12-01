import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Route } from '@app/constants/enums';
import { ClientSocketService } from '@app/services/client-socket/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling/game-handling.service';
import { RouteControllerService } from '@app/services/route-controller/route-controller.service';
import { TimerService } from '@app/services/timer/timer.service';
import { Game } from '@common/game';
import { GameMode } from '@common/game-mode';

import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-in-game-page',
    templateUrl: './in-game-page.component.html',
    styleUrls: ['./in-game-page.component.scss'],
})
export class InGamePageComponent implements OnInit, OnDestroy {
    currentGame: Game;
    currentQuestion: string = '';
    currentQuestionScore: number;
    score: number;
    isEvaluationMessageVisible: boolean = false;
    isHistogramVisible: boolean = true;
    showResults: boolean = false;
    histogramData: { [key: string]: number };
    correctAnswers: string[];
    playerName = this.clientSocket.playerName;
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

    get isOrganizer() {
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
        this.gameService.setCurrentQuestionId(0);
        this.currentQuestion = this.currentGame.questions[this.gameService.currentQuestionId].text;
        this.currentQuestionScore = this.currentGame.questions[this.gameService.currentQuestionId].points;

        this.correctAnswers = this.gameService.getCorrectAnswersForCurrentQuestion();
        this.gameService.setScore(0);

        this.questionSubscription = this.gameService.currentQuestion$.subscribe(() => {
            this.currentQuestion = this.currentGame.questions[this.gameService.currentQuestionId].text;
        });

        this.subscriptionScore = this.gameService.score$.subscribe((updatedScore) => {
            this.score = updatedScore;
            this.clientSocket.socket.emit('submitScore', updatedScore);
        });

        this.histogramSubscription = this.clientSocket.listenUpdateHistogram().subscribe((data) => {
            this.correctAnswers = this.gameService.getCorrectAnswersForCurrentQuestion();
            this.histogramData = data;
            this.gameService.updateHistogramDataForQuestion(this.gameService.currentQuestionId, data);
        });

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
        this.clientSocket.socket.removeAllListeners('qcmEnd');
        this.clientSocket.socket.removeAllListeners('qrlEnd');
        this.clientSocket.socket.removeAllListeners('qrlResults');
        this.clientSocket.socket.removeAllListeners('panicMode');
        this.clientSocket.socket.removeAllListeners('countdownEnd');
        this.clientSocket.socket.removeAllListeners('noPlayers');
        this.clientSocket.resetPlayerInfo();
        this.routeController.setRouteAccess(Route.InGame, false);
        this.clientSocket.players = [];
    }

    onUpdateQuestionScore(score: number) {
        this.currentQuestionScore = score;
    }

    setEvaluationPhase(isEvaluationPhase: boolean) {
        this.isEvaluationMessageVisible = isEvaluationPhase;
        this.isHistogramVisible = !isEvaluationPhase;
    }

    leaveGame(): void {
        if (this.gameService.gameMode === GameMode.Testing) {
            this.router.navigate([Route.GameCreation]);
            return;
        }
        this.router.navigate([Route.MainMenu]);
    }
}
