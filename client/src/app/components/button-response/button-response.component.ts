import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, inject, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { PANIC_SOUNDS } from '@app/constants/audio';
import { ButtonState, Route } from '@app/constants/enums';
import { DELAY_BEFORE_INPUT_INACTIVITY, PAUSE_MESSAGE, POINTS_PERCENTAGES, TIME_OUT, UNPAUSE_MESSAGE } from '@app/constants/in-game';
import { SNACK_BAR_ERROR_CONFIGURATION } from '@app/constants/snack-bar-configuration';
import { Button } from '@app/interfaces/button-model';
import { AnswerValidatorService } from '@app/services/answer-validator/answer-validator.service';
import { AudioService } from '@app/services/audio/audio.service';
import { ClientSocketService } from '@app/services/client-socket/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling/game-handling.service';
import { TimerService } from '@app/services/timer/timer.service';
import { Choice, Game } from '@common/game';
import { GameMode } from '@common/game-mode';
import { Limit } from '@common/limit';
import { ACTIVE_PLAYERS_TEXT, Answer, FIFTY, HUNDRED, INACTIVE_PLAYERS_TEXT, ZERO } from '@common/lobby';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-button-response',
    templateUrl: './button-response.component.html',
    styleUrls: ['./button-response.component.scss'],
})
export class ButtonResponseComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('buttonFocus', { static: false }) buttonFocus: ElementRef;
    @Output() updateQuestionScore = new EventEmitter<number>();
    @Output() qrlEnd = new EventEmitter<boolean>();
    qrlAnswers: Answer[] = [];
    pointsPercentages: number[] = POINTS_PERCENTAGES;
    maxQrlAnswerLength: number = Limit.MaxQrlAnswerLength;
    currentAnswerIndex: number = 0;
    isEvaluationPhase: boolean = false;
    canLoadNextQuestion: boolean = false;
    submitted: boolean = false;
    isGamePaused: boolean = false;
    hasQuestionEnded: boolean = false;
    isOrganizer: boolean = this.clientSocket.isOrganizer;
    answerForm: FormControl = this.answerValidator.answerForm;
    playerHasInteracted: boolean = false;
    private studentGrades: { [studentName: string]: number } = {};
    private initialPlayers = this.clientSocket.players;
    private submittedFromTimer: boolean = false;
    private timerSubscription: Subscription;
    private currentGame: Game = this.gameService.currentGame;
    private router: Router = inject(Router);
    private snackBar: MatSnackBar = inject(MatSnackBar);
    private audio: AudioService = inject(AudioService);
    private timer: TimerService = inject(TimerService);

    constructor(
        private gameService: GameHandlingService,
        private answerValidator: AnswerValidatorService,
        private clientSocket: ClientSocketService,
    ) {}

    get pauseMessage(): string {
        return this.isGamePaused ? UNPAUSE_MESSAGE : PAUSE_MESSAGE;
    }

    get isCurrentQuestionQcm(): boolean {
        return this.gameService.isCurrentQuestionQcm();
    }

    get isPanicModeEnabled(): boolean {
        return this.timer.isPanicModeEnabled;
    }

    get isPanicModeAvailable(): boolean {
        return this.timer.count <= (this.isCurrentQuestionQcm ? Limit.QcmRequiredPanicCount : Limit.QrlRequiredPanicCount);
    }

    get remainingCountForPanic(): number {
        return this.timer.count - (this.isCurrentQuestionQcm ? Limit.QcmRequiredPanicCount : Limit.QrlRequiredPanicCount);
    }

    get isQuestionTransition(): boolean {
        return this.timer.isQuestionTransition;
    }

    get currentEvaluatedAnswer(): Answer {
        return this.qrlAnswers[this.currentAnswerIndex];
    }

    get buttons(): Button[] {
        return this.answerValidator.buttons;
    }

    get buttonLoadingMessage(): string {
        return this.gameService.currentQuestionId === this.gameService.currentGame.questions.length - 1
            ? 'Charger les résultats'
            : 'Charger la prochaine question';
    }

    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        const clickedElement = event.target as HTMLElement;
        if (this.buttonFocus && !clickedElement.closest('#chatInput')) this.buttonFocus.nativeElement.focus();
    }

    ngOnInit(): void {
        this.updateButtons();
        this.populateHistogram();
        this.configureBaseSocketFeatures();
    }

    ngOnDestroy(): void {
        if (this.timerSubscription) this.timerSubscription.unsubscribe();
        this.audio.pause();
        this.answerValidator.reset();
    }

    configureBaseSocketFeatures(): void {
        this.clientSocket.socket.on('qcmEnd', (bonusRecipient: string) => {
            if (this.clientSocket.isOrganizer) {
                this.timer.stopCountdown();
                this.canLoadNextQuestion = true;
                this.hasQuestionEnded = true;
                return;
            }
            if (this.clientSocket.socket.id === bonusRecipient) this.answerValidator.hasBonus = true;
            this.answerValidator.processAnswer();
        });

        this.clientSocket.socket.on('qrlEnd', (qrlAnswers: Answer[]) => {
            this.timer.stopCountdown();
            if (this.clientSocket.isOrganizer) this.qrlAnswers = qrlAnswers;
            this.qrlEnd.emit((this.isEvaluationPhase = true));
        });

        this.clientSocket.socket.on('qrlResults', (qrlAnswers: Answer[]) => {
            this.qrlEnd.emit((this.isEvaluationPhase = false));
            if (this.clientSocket.isOrganizer) {
                this.canLoadNextQuestion = true;
                this.hasQuestionEnded = true;
                return;
            }
            this.answerValidator.pointsPercentage = (
                qrlAnswers.find((answer: Answer) => answer.submitter === this.clientSocket.playerName) as Answer
            ).pointsPercentage;
            this.answerValidator.processAnswer();
        });

        this.clientSocket.socket.on('panicMode', () => {
            this.timer.isPanicModeEnabled = true;
            this.audio.play(PANIC_SOUNDS);
        });

        this.clientSocket.socket.on('countdownEnd', () => {
            if (this.isQuestionTransition) {
                this.loadNextQuestion();
                return;
            }
            this.onTimerEnded();
        });
        this.clientSocket.socket.on('noPlayers', () => {
            this.snackBar.open('Tous les joueurs ont quitté la partie.', '', SNACK_BAR_ERROR_CONFIGURATION);
            this.timer.stopCountdown();
            this.qrlEnd.emit((this.isEvaluationPhase = false));
            this.hasQuestionEnded = true;
            this.canLoadNextQuestion = false;
        });
    }

    ngAfterViewInit(): void {
        if (this.buttonFocus) this.buttonFocus.nativeElement.focus();
    }

    onTimerEnded(): void {
        this.submittedFromTimer = true;
        if (!this.clientSocket.isOrganizer) this.submit();
    }

    updateButtons(): void {
        if (this.isCurrentQuestionQcm) {
            const questionOfInterest = this.currentGame.questions[this.gameService.currentQuestionId];
            if (questionOfInterest.choices) {
                this.answerValidator.buttons = [];
                questionOfInterest.choices.forEach((choice: Choice, buttonIndex: number) => {
                    this.buttons.push({
                        color: 'white',
                        selected: false,
                        text: choice.text,
                        isCorrect: choice.isCorrect,
                        id: buttonIndex + 1,
                    });
                });
            }
        }
    }

    onButtonClick(button: Button) {
        if (this.answerValidator.isProcessing) return;
        if (!this.playerHasInteracted) {
            this.clientSocket.socket.emit('socketInteracted');
            this.playerHasInteracted = true;
        }
        button.selected = !button.selected;
        const changeValue: number = button.selected ? ButtonState.Selected : ButtonState.Unselected;
        if (this.gameService.gameMode === GameMode.RealGame) {
            const histogramUpdateData = { [button.text]: changeValue };
            this.clientSocket.sendUpdateHistogram(histogramUpdateData);
        }
    }

    playerEntries(event: KeyboardEvent): void {
        if (this.answerValidator.isProcessing) return;
        if (event.key === 'Enter' && !this.isAnswerEmpty()) {
            event.preventDefault();
            this.submit();
        } else {
            if (parseInt(event.key, 10) >= 1 && parseInt(event.key, 10) <= this.buttons.length) {
                const button = this.buttons[parseInt(event.key, 10) - 1];
                this.onButtonClick(button);
            }
        }
    }

    updateGameQuestions(): void {
        if (this.gameService.currentQuestionId === this.currentGame.questions.length - 1) {
            if (this.gameService.gameMode === GameMode.Testing) {
                this.router.navigate([Route.GameCreation]);
                return;
            }
            this.clientSocket.socket.emit('gameEnded');
        } else {
            this.gameService.setCurrentQuestionId(++this.gameService.currentQuestionId);
            if (this.isOrganizer) this.clientSocket.socket.emit('resetPlayersActivityState');
            this.playerHasInteracted = false;
            this.updateButtons();
            this.populateHistogram();
            this.gameService.setCurrentQuestion(this.currentGame.questions[this.gameService.currentQuestionId].text);
            this.updateQuestionScore.emit(this.currentGame.questions[this.gameService.currentQuestionId].points);
            if (this.clientSocket.isOrganizer || this.gameService.gameMode === GameMode.Testing)
                this.timer.startCountdown(this.gameService.getCurrentQuestionDuration());
            if (this.buttonFocus) this.buttonFocus.nativeElement.focus();
        }
    }

    loadNextQuestion(): void {
        this.answerValidator.prepareNextQuestion();
        this.submitted = false;
        this.submittedFromTimer = false;
        this.timer.isQuestionTransition = false;
        this.isGamePaused = false;
        this.hasQuestionEnded = false;
        this.currentAnswerIndex = 0;
        this.updateGameQuestions();
    }

    populateHistogram(): void {
        if (this.gameService.gameMode === GameMode.RealGame && this.isOrganizer) {
            let initialValue = 0;
            if (this.isCurrentQuestionQcm) this.buttons.forEach((button) => this.clientSocket.sendUpdateHistogram({ [button.text]: initialValue }));
            else {
                this.clientSocket.sendUpdateHistogram({ [ACTIVE_PLAYERS_TEXT]: initialValue++ });
                this.initialPlayers.forEach((player) => {
                    if (player.name !== 'Organisateur') this.clientSocket.sendUpdateHistogram({ [INACTIVE_PLAYERS_TEXT]: initialValue });
                });
            }
        }
    }

    startNextQuestionCountdown(): void {
        this.clientSocket.sendResetHistogram();
        this.canLoadNextQuestion = false;
        this.isGamePaused = false;
        this.timer.startCountdown(TIME_OUT, { isQuestionTransition: true });
    }

    pause(): void {
        if (this.isGamePaused) {
            if (this.timer.isQuestionTransition) this.timer.startCountdown(this.timer.transitionCount);
            else this.timer.startCountdown(this.timer.count, { isPanicModeEnabled: this.isPanicModeEnabled });
            this.isGamePaused = !this.isGamePaused;
            return;
        }
        this.timer.stopCountdown();
        this.isGamePaused = !this.isGamePaused;
    }

    panic(): void {
        this.clientSocket.socket.emit('enablePanicMode');
        this.timer.stopCountdown();
        this.timer.startCountdown(this.timer.count, { isPanicModeEnabled: true });
    }

    isAnswerEmpty(): boolean {
        return this.answerForm.value.trim().length === 0 && !this.buttons.some((button) => button.selected === true);
    }

    evaluateAnswer(points: number): void {
        this.currentEvaluatedAnswer.pointsPercentage = points;
        const studentName = this.currentEvaluatedAnswer.submitter;
        if (studentName !== undefined) this.studentGrades[studentName] = this.currentEvaluatedAnswer.pointsPercentage * HUNDRED;
        this.updateHistogram();
        if (this.currentAnswerIndex !== this.qrlAnswers.length - 1) ++this.currentAnswerIndex;
    }

    updateHistogram(): void {
        let count0 = 0;
        let count50 = 0;
        let count100 = 0;
        Object.values(this.studentGrades).forEach((grade) => {
            switch (grade) {
                case ZERO:
                    count0++;
                    break;
                case FIFTY:
                    count50++;
                    break;
                case HUNDRED:
                    count100++;
                    break;
            }
        });
        const histogramUpdateData: { [key: string]: number } = {};
        histogramUpdateData['0%'] = count0;
        histogramUpdateData['50%'] = count50;
        histogramUpdateData['100%'] = count100;
        this.clientSocket.sendQrlUpdateHistogram(histogramUpdateData);
    }

    getPreviousAnswer(): void {
        --this.currentAnswerIndex;
    }

    endEvaluationPhase(): void {
        this.clientSocket.socket.emit('evaluationPhaseCompleted', this.qrlAnswers);
    }

    submit(): void {
        this.submitted = true;
        this.answerValidator.submitAnswer(this.submittedFromTimer);
    }

    markInputActivity(): void {
        if (this.gameService.gameMode === GameMode.RealGame) {
            this.clientSocket.socket.emit('markInputActivity');
            this.timer.startCountdown(DELAY_BEFORE_INPUT_INACTIVITY, { isInputInactivityCountdown: true });
            if (!this.playerHasInteracted) {
                this.clientSocket.socket.emit('socketInteracted');
                this.playerHasInteracted = true;
            }
        }
    }
}
