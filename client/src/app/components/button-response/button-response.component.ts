import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { GameHandlingService } from '@angular/../../client/src/app/services/game-handling.service';
import { Jeu } from '@common/jeu';
import { GamePageComponent } from '@angular/../../client/src/app/pages/game-page/game-page.component';
import { TimeService } from '@app/services/time.service';
import { Router } from '@angular/router';
const ALERT_DELAY = 100;
interface Button {
    color: string;
    selected: boolean;
    text: string;
    isCorrect: boolean;
    id: number;
}

interface Choice {
    answer: string;
    isCorrect: boolean;
}
@Component({
    selector: 'app-button-response',
    templateUrl: './button-response.component.html',
    styleUrls: ['./button-response.component.scss'],
})
export class ButtonResponseComponent implements OnInit, AfterViewInit {
    @ViewChild('buttonFocus', { static: false }) buttonFocus: ElementRef;
    buttons: Button[] = [];
    games: Jeu[] = [];

    // eslint-disable-next-line max-params
    constructor(
        private gameService: GameHandlingService,
        private gamePage: GamePageComponent,
        private timeService: TimeService,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.gameService.getGames().subscribe((data: Jeu[]) => {
            this.games = data;
            this.updateButtons();
        });
        this.timeService.timerEnded.subscribe(() => {
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
        const currentGame = this.games[this.gameService.currentGameId];
        const questionOfInterest = currentGame.questions[this.gameService.currentQuestionId];

        if (questionOfInterest.choices) {
            this.buttons = [];
            questionOfInterest.choices.forEach((choice: Choice, butonIndex: number) => {
                this.buttons.push({
                    color: 'white',
                    selected: false,
                    text: choice.answer,
                    isCorrect: choice.isCorrect,
                    id: butonIndex + 1,
                });
            });
        }
    }

    onButtonClick(button: Button) {
        button.selected = !button.selected;
        button.color = button.selected ? 'lightblue' : 'white';
    }

    verifyResponsesAndCallUpdate() {
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
        if (isAnswerCorrect) {
            this.gamePage.incrementScore(this.games[this.gameService.currentGameId].questions[this.gameService.currentQuestionId].points);

            setTimeout(() => {
                // a enlever plustard car les alerts bloque la update du view de angular
                alert('bonne reponse');
                this.updateGameQuestions();
            }, ALERT_DELAY);
        } else {
            alert('mauvaise reponse');
            this.updateGameQuestions();
        }
    }

    playerEntries(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            this.verifyResponsesAndCallUpdate();
        } else {
            if (parseInt(event.key, 10) >= 1 && parseInt(event.key, 10) <= this.buttons.length) {
                const button = this.buttons[parseInt(event.key, 10) - 1];
                this.onButtonClick(button);
            }
        }
    }

    updateGameQuestions() {
        if (this.gameService.currentQuestionId === this.games[this.gameService.currentGameId].questions.length - 1) {
            // on verifie si c'est la derniere question de la game
            alert('Fin de la partie !');
            this.router.navigate(['/home']);
        } else {
            this.gameService.setCurrentQuestionId(++this.gameService.currentQuestionId);
            this.updateButtons();
            this.gamePage.updateQuestion();
            this.timeService.stopTimer();
            this.timeService.startTimer(this.games[this.gameService.currentGameId].duration);
        }
    }
}
