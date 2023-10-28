import { GameHandlingService } from '@angular/../../client/src/app/services/game-handling.service';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Button } from '@app/interfaces/button-model';
import { TimeService } from '@app/services/time.service';
import { Choice, Game } from '@common/game';
import { Subscription } from 'rxjs/internal/Subscription';
const TIME_OUT = 3000;

@Component({
    selector: 'app-button-response',
    templateUrl: './button-response.component.html',
    styleUrls: ['./button-response.component.scss'],
})
export class ButtonResponseComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('buttonFocus', { static: false }) buttonFocus: ElementRef;
    buttons: Button[] = [];
    games: Game[] = [];
    timerSubscription: Subscription;
    isProcessing: boolean = false;

    constructor(
        private gameService: GameHandlingService,
        private timeService: TimeService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.gameService.getGames().subscribe((data: Game[]) => {
            this.games = data;
            this.updateButtons();
        });
        this.timerSubscription = this.timeService.timerEnded.subscribe(() => {
            this.onTimerEnded();
        });
    }

    ngAfterViewInit(): void {
        this.buttonFocus.nativeElement.focus();
    }

    onTimerEnded() {
        this.verifyResponsesAndCallUpdate();
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
        }
    }

    onButtonClick(button: Button) {
        if (this.isProcessing) return;
        button.selected = !button.selected;
    }

    verifyResponsesAndCallUpdate() {
        if (this.isProcessing) return;
        let clickedChoicesCount = 0;
        let correctChoicesCount = 0;
        let isAnswerCorrect = true;
        this.buttons.forEach((button) => {
            if (button.isCorrect) {
                correctChoicesCount++;
            }

            if (button.selected) {
                clickedChoicesCount++;
                if (!button.isCorrect) {
                    isAnswerCorrect = false;
                }
            }
        });

        if (clickedChoicesCount !== correctChoicesCount) {
            isAnswerCorrect = false;
        }
        this.isProcessing = true;
        if (isAnswerCorrect) {
            const currentGame = this.games.find((g) => g.id === this.gameService.currentGameId);
            if (currentGame === undefined) return;
            this.gameService.incrementScore(currentGame.questions[this.gameService.currentQuestionId].points);
            this.processAnswer();
        } else {
            this.processAnswer();
        }
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
            this.router.navigate(['/create-game']);
        } else {
            this.gameService.setCurrentQuestionId(++this.gameService.currentQuestionId);
            this.updateButtons();
            this.gameService.setCurrentQuestion(currentGame.questions[this.gameService.currentQuestionId].text);
            this.timeService.stopTimer();
            this.timeService.startTimer(currentGame.duration);
            this.buttonFocus.nativeElement.focus();
        }
    }

    ngOnDestroy(): void {
        if (this.timerSubscription) {
            this.timerSubscription.unsubscribe();
        }
    }

    processAnswer() {
        this.buttons.forEach((button) => {
            if (button.isCorrect) button.showCorrectButtons = true;
            if (!button.isCorrect) {
                button.showWrongButtons = true;
            }
        });

        setTimeout(() => {
            this.buttons.forEach((button) => {
                button.showCorrectButtons = false;
                button.showWrongButtons = false;
            });
            this.updateGameQuestions();
            this.isProcessing = false;
        }, TIME_OUT);
    }
}
