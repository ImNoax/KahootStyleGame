import { GameHandlingService } from '@angular/../../client/src/app/services/game-handling.service';
import { AfterViewInit, Component, ElementRef, EventEmitter, inject, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { snackBarErrorConfiguration, snackBarNormalConfiguration } from '@app/constants/snack-bar-configuration';
import { Route } from '@app/enums';
import { Button } from '@app/interfaces/button-model';
import { ClientSocketService } from '@app/services/client-socket.service';
import { TimerService } from '@app/services/timer.service';
import { Choice, Game } from '@common/game';
import { GameMode } from '@common/game-mode';
import { Subscription } from 'rxjs/internal/Subscription';

const TIME_OUT = 3;
const BONUS_POINTS = 0.2;
const BUTTON_SELECTED = 1;
const BUTTON_UNSELECTED = -1;

@Component({
    selector: 'app-button-response',
    templateUrl: './button-response.component.html',
    styleUrls: ['./button-response.component.scss'],
})
export class ButtonResponseComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('buttonFocus', { static: false }) buttonFocus: ElementRef;
    @Output() updateQuestionScore = new EventEmitter<number>();
    buttons: Button[] = [];
    currentGame: Game;
    timerSubscription: Subscription;
    isProcessing: boolean = false;
    canLoadNextQuestion: boolean = false;
    submitted: boolean = false;
    submittedFromTimer: boolean = false;
    bonusTimes: number = 0;
    hasBonus: boolean = false;
    isAnswerCorrect: boolean = true;
    loadingMessage: string = '';
    private clientSocket: ClientSocketService = inject(ClientSocketService);
    private snackBar: MatSnackBar = inject(MatSnackBar);

    constructor(
        private gameService: GameHandlingService,
        private timer: TimerService,
        private router: Router,
    ) {}

    get isOrganiser() {
        return this.clientSocket.isOrganizer;
    }

    ngOnInit(): void {
        this.currentGame = this.gameService.currentGame;
        this.updateButtons();
        this.configureBaseSocketFeatures();
    }

    ngOnDestroy(): void {
        if (this.timerSubscription) {
            this.timerSubscription.unsubscribe();
        }

        this.clientSocket.socket.removeAllListeners('allSubmitted');
        this.clientSocket.socket.removeAllListeners('countDownEnd');
        this.clientSocket.socket.removeAllListeners('canLoadNextQuestion');
        this.clientSocket.socket.removeAllListeners('noPlayers');
    }

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on('allSubmitted', (bonusRecipient: string) => {
            if (this.clientSocket.socket.id === bonusRecipient) this.hasBonus = true;
            this.processAnswer();
        });

        this.clientSocket.socket.on('countDownEnd', (lastCount: number) => {
            this.timer.count = lastCount;
            if (this.timer.isQuestionTransition) {
                this.loadNextQuestion();
                return;
            }
            this.onTimerEnded();
        });

        this.clientSocket.socket.on('canLoadNextQuestion', () => {
            this.timer.stopCountDown();
            this.canLoadNextQuestion = true;
        });

        this.clientSocket.socket.on('noPlayers', () => {
            this.snackBar.open('Tous les joueurs ont quitté la partie.', '', snackBarErrorConfiguration);
            this.timer.stopCountDown();
            this.canLoadNextQuestion = false;
        });
    }

    ngAfterViewInit(): void {
        this.buttonFocus.nativeElement.focus();
    }

    onTimerEnded() {
        this.verifyResponsesAndCallUpdate();
        this.submittedFromTimer = true;
    }

    updateButtons() {
        const questionOfInterest = this.currentGame.questions[this.gameService.currentQuestionId];

        if (questionOfInterest.choices) {
            this.buttons = [];
            questionOfInterest.choices.forEach((choice: Choice, buttonIndex: number) => {
                this.buttons.push({
                    color: 'white',
                    selected: false,
                    text: choice.text,
                    isCorrect: choice.isCorrect,
                    id: buttonIndex + 1,
                });
            });
            if (this.gameService.gameMode === GameMode.RealGame) {
                this.populateHistogram();
            }
        }
    }

    onButtonClick(button: Button) {
        if (this.isProcessing) return;
        button.selected = !button.selected;

        const changeValue = button.selected ? BUTTON_SELECTED : BUTTON_UNSELECTED;

        if (this.gameService.gameMode === GameMode.RealGame) {
            const histogramUpdateData = { [button.text]: changeValue };
            this.clientSocket.sendUpdateHistogram(histogramUpdateData);
        }
    }

    verifyResponsesAndCallUpdate() {
        this.submitted = true;
        if (this.isProcessing) return;
        let clickedChoicesCount = 0;
        let correctChoicesCount = 0;
        this.buttons.forEach((button) => {
            if (button.isCorrect) {
                correctChoicesCount++;
            }

            if (button.selected) {
                clickedChoicesCount++;
                if (!button.isCorrect) {
                    this.isAnswerCorrect = false;
                }
            }
        });

        if (clickedChoicesCount !== correctChoicesCount) {
            this.isAnswerCorrect = false;
        }
        this.isProcessing = true;

        if (this.gameService.gameMode === GameMode.Testing) {
            this.processAnswer();
            return;
        }
        this.clientSocket.socket.emit('answerSubmitted', this.isAnswerCorrect, this.submittedFromTimer);
    }

    playerEntries(event: KeyboardEvent) {
        if (this.isProcessing) return;
        if (event.key === 'Enter') {
            event.preventDefault();
            this.verifyResponsesAndCallUpdate();
        } else {
            if (parseInt(event.key, 10) >= 1 && parseInt(event.key, 10) <= this.buttons.length) {
                const button = this.buttons[parseInt(event.key, 10) - 1];
                this.onButtonClick(button);
            }
        }
    }

    updateGameQuestions() {
        if (this.gameService.currentQuestionId === this.currentGame.questions.length - 1) {
            this.timer.stopCountDown();
            if (this.gameService.gameMode === GameMode.Testing) {
                this.router.navigate([Route.GameCreation]);
                return;
            }
            this.clientSocket.socket.emit('gameEnded');
        } else {
            this.gameService.setCurrentQuestionId(++this.gameService.currentQuestionId);
            this.updateButtons();
            this.gameService.setCurrentQuestion(this.currentGame.questions[this.gameService.currentQuestionId].text);
            this.updateQuestionScore.emit(this.currentGame.questions[this.gameService.currentQuestionId].points);
            this.timer.startCountDown(this.currentGame.duration);
            this.buttonFocus.nativeElement.focus();
        }
    }

    processAnswer() {
        this.timer.stopCountDown();
        if (this.isAnswerCorrect) {
            let rewardedPoints = this.currentGame.questions[this.gameService.currentQuestionId].points;
            let message = `+${rewardedPoints} points ✅`;
            if (this.hasBonus || this.gameService.gameMode === GameMode.Testing) {
                const bonus = rewardedPoints * BONUS_POINTS;
                rewardedPoints += bonus;
                message += ` + ${bonus} points bonus 🎉🎊`;
                this.bonusTimes++;
                this.clientSocket.socket.emit('updateBonusTimes', this.bonusTimes);
            }
            this.gameService.incrementScore(rewardedPoints);
            this.snackBar.open(message, '', snackBarNormalConfiguration);
        } else {
            this.snackBar.open('+0 points ❌', '', snackBarNormalConfiguration);
        }

        this.buttons.forEach((button) => {
            if (button.isCorrect) button.showCorrectButtons = true;
            if (!button.isCorrect) {
                button.showWrongButtons = true;
            }
        });

        if (this.gameService.gameMode === GameMode.Testing) this.timer.startCountDown(TIME_OUT, true);
    }

    loadNextQuestion(): void {
        this.buttons.forEach((button) => {
            button.showCorrectButtons = false;
            button.showWrongButtons = false;
        });
        this.isProcessing = false;
        this.submitted = false;
        this.hasBonus = false;
        this.isAnswerCorrect = true;
        this.submittedFromTimer = false;
        this.timer.isQuestionTransition = false;
        this.updateGameQuestions();
    }

    populateHistogram() {
        const changeValue = 0;
        this.buttons.forEach((button) => {
            const histogramUpdateData = { [button.text]: changeValue };
            this.clientSocket.sendUpdateHistogram(histogramUpdateData);
        });
    }

    startNextQuestionCountDown() {
        this.clientSocket.sendResetHistogram();
        this.timer.startCountDown(TIME_OUT, true);
        this.canLoadNextQuestion = false;
    }
}
