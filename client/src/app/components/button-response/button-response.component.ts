import { GameHandlingService } from '@angular/../../client/src/app/services/game-handling.service';
import { AfterViewInit, Component, ElementRef, EventEmitter, inject, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { snackBarNormalConfiguration } from '@app/constants/snack-bar-configuration';
import { GameMode, Route } from '@app/enums';
import { Button } from '@app/interfaces/button-model';
import { ClientSocketService } from '@app/services/client-socket.service';
import { TimeService } from '@app/services/time.service';
import { Choice, Game } from '@common/game';
import { Subscription } from 'rxjs/internal/Subscription';

const TIME_OUT = 3000;
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
    games: Game[] = [];
    timerSubscription: Subscription;
    isProcessing: boolean = false;
    canLoadNextQuestion: boolean = false;
    submitted: boolean = false;
    submittedFromTimer: boolean = false;
    hasBonus: boolean = false;
    isAnswerCorrect: boolean = true;
    private clientSocket: ClientSocketService = inject(ClientSocketService);
    private snackBar: MatSnackBar = inject(MatSnackBar);

    constructor(
        private gameService: GameHandlingService,
        private timeService: TimeService,
        private router: Router,
    ) {}

    get isOrganiser() {
        return this.clientSocket.isOrganizer;
    }

    ngOnInit(): void {
        this.gameService.getGames().subscribe((data: Game[]) => {
            this.games = data;
            this.updateButtons();
        });
        this.timerSubscription = this.timeService.timerEnded.subscribe(() => {
            this.onTimerEnded();
        });
        this.configureBaseSocketFeatures();
    }

    ngOnDestroy(): void {
        if (this.timerSubscription) {
            this.timerSubscription.unsubscribe();
        }

        this.clientSocket.socket.removeAllListeners('allSubmitted');
        this.clientSocket.socket.removeAllListeners('canLoadNextQuestion');
        this.clientSocket.socket.removeAllListeners('nextQuestionLoading');
    }

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on('allSubmitted', (bonusRecipient: string) => {
            if (this.clientSocket.socket.id === bonusRecipient) this.hasBonus = true;
            this.processAnswer();
        });

        this.clientSocket.socket.on('canLoadNextQuestion', () => {
            this.timeService.stopTimer();
            this.canLoadNextQuestion = true;
        });

        this.clientSocket.socket.on('nextQuestionLoading', () => {
            this.startNextQuestionTimeout();
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
        const currentGame = this.games.find((g) => g.id === this.gameService.currentGameId);
        if (currentGame === undefined) return;
        const questionOfInterest = currentGame.questions[this.gameService.currentQuestionId];

        if (questionOfInterest.choices) {
            this.buttons = [];
            questionOfInterest.choices.forEach((choice: Choice, butonIndex: number) => {
                this.buttons.push({
                    color: 'white',
                    selected: false,
                    text: choice.text,
                    isCorrect: choice.isCorrect,
                    id: butonIndex + 1,
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
        const currentGame = this.games.find((g) => g.id === this.gameService.currentGameId);
        if (currentGame === undefined) return;
        if (this.gameService.currentQuestionId === currentGame.questions.length - 1) {
            this.timeService.stopTimer();
            this.router.navigate([Route.GameCreation]);
        } else {
            this.gameService.setCurrentQuestionId(++this.gameService.currentQuestionId);
            this.updateButtons();
            this.gameService.setCurrentQuestion(currentGame.questions[this.gameService.currentQuestionId].text);
            this.updateQuestionScore.emit(currentGame.questions[this.gameService.currentQuestionId].points);
            this.timeService.stopTimer();
            this.timeService.startTimer(currentGame.duration);
            this.buttonFocus.nativeElement.focus();
        }
    }

    processAnswer() {
        this.timeService.stopTimer();
        if (this.isAnswerCorrect) {
            const currentGame = this.games.find((game) => game.id === this.gameService.currentGameId);
            if (currentGame === undefined) return;

            let rewardedPoints = currentGame.questions[this.gameService.currentQuestionId].points;
            let message = `+${rewardedPoints} points ✅`;
            if (this.hasBonus || this.gameService.gameMode === GameMode.Testing) {
                const bonus = rewardedPoints * BONUS_POINTS;
                rewardedPoints += bonus;
                message += ` + ${bonus} points bonis 🎉🎊`;
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

        if (this.gameService.gameMode === GameMode.Testing) this.startNextQuestionTimeout();
    }

    startNextQuestionTimeout(): void {
        setTimeout(() => {
            this.buttons.forEach((button) => {
                button.showCorrectButtons = false;
                button.showWrongButtons = false;
            });
            this.updateGameQuestions();
            this.isProcessing = false;
            this.submitted = false;
            this.hasBonus = false;
            this.isAnswerCorrect = true;
            this.submittedFromTimer = false;
        }, TIME_OUT);
    }

    populateHistogram() {
        const changeValue = 0;
        this.buttons.forEach((button) => {
            const histogramUpdateData = { [button.text]: changeValue };
            this.clientSocket.sendUpdateHistogram(histogramUpdateData);
        });
    }

    loadNextQuestion() {
        this.clientSocket.sendResetHistogram();
        this.clientSocket.socket.emit('loadNextQuestion');
        this.canLoadNextQuestion = false;
    }
}
