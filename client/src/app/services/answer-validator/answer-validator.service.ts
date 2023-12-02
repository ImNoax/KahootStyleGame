import { Injectable, inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BONUS_FACTOR, TIME_OUT } from '@app/constants/in-game';
import { SNACK_BAR_NORMAL_CONFIGURATION } from '@app/constants/snack-bar-configuration';
import { Button } from '@app/interfaces/button-model';
import { ClientSocketService } from '@app/services/client-socket/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling/game-handling.service';
import { TimerService } from '@app/services/timer/timer.service';
import { QuestionType } from '@common/game';
import { GameMode } from '@common/game-mode';
import { Answer } from '@common/lobby';

@Injectable({
    providedIn: 'root',
})
export class AnswerValidatorService {
    buttons: Button[] = [];
    rewardMessage: string = '';
    isProcessing: boolean = false;
    answerForm: FormControl = new FormControl('', { nonNullable: true });
    bonusTimes: number = 0;
    hasBonus: boolean = false;
    pointsPercentage: number | undefined = undefined;
    isAnswerCorrect: boolean = true;
    private snackBar: MatSnackBar = inject(MatSnackBar);

    constructor(
        private gameService: GameHandlingService,
        private clientSocket: ClientSocketService,
        private timer: TimerService,
    ) {}

    submitAnswer(submittedFromTimer: boolean) {
        if (this.isProcessing) return;
        this.answerForm.disable();

        if (this.gameService.isCurrentQuestionQcm()) {
            let clickedChoicesCount = 0;
            let correctChoicesCount = 0;
            this.buttons.forEach((button) => {
                if (button.isCorrect) {
                    correctChoicesCount++;
                }

                if (button.selected) {
                    clickedChoicesCount++;
                    if (!button.isCorrect) this.isAnswerCorrect = false;
                }
            });

            if (clickedChoicesCount !== correctChoicesCount) this.isAnswerCorrect = false;
            this.isProcessing = true;
        }

        if (this.gameService.gameMode === GameMode.Testing) {
            this.timer.stopCountdown();
            this.processAnswer();
            return;
        }

        const answer: Answer = {
            submitter: this.clientSocket.playerName,
            ...(this.gameService.isCurrentQuestionQcm()
                ? { questionType: QuestionType.QCM, isCorrect: this.isAnswerCorrect }
                : { questionType: QuestionType.QRL, text: this.answerForm.value.trim() }),
        };

        this.clientSocket.socket.emit('answerSubmitted', answer, submittedFromTimer);
    }

    processAnswer() {
        let rewardedPoints = this.gameService.currentGame.questions[this.gameService.currentQuestionId].points;
        if (!this.gameService.isCurrentQuestionQcm() && this.gameService.gameMode === GameMode.RealGame) {
            rewardedPoints *= this.pointsPercentage as number;
            if (rewardedPoints === 0) this.isAnswerCorrect = false;
        }

        if (this.isAnswerCorrect) {
            this.rewardMessage = `+${rewardedPoints} points ✅`;
            rewardedPoints += this.giveBonus(rewardedPoints);
            this.gameService.incrementScore(rewardedPoints);
            this.snackBar.open(this.rewardMessage, '', SNACK_BAR_NORMAL_CONFIGURATION);
        } else this.snackBar.open('+0 points ❌', '', SNACK_BAR_NORMAL_CONFIGURATION);

        this.buttons.forEach((button) => {
            if (button.isCorrect) button.showCorrectButtons = true;
            if (!button.isCorrect) {
                button.showWrongButtons = true;
            }
        });

        if (this.gameService.gameMode === GameMode.Testing) this.timer.startCountdown(TIME_OUT, { isQuestionTransition: true });
    }

    prepareNextQuestion() {
        this.buttons.forEach((button) => {
            button.showCorrectButtons = false;
            button.showWrongButtons = false;
            button.selected = false;
        });
        this.rewardMessage = '';
        this.isProcessing = false;
        this.hasBonus = false;
        this.isAnswerCorrect = true;
        this.pointsPercentage = undefined;
        this.answerForm.reset();
        this.answerForm.enable();
    }

    reset() {
        this.prepareNextQuestion();
        this.buttons = [];
        this.bonusTimes = 0;
    }

    private giveBonus(currentRewardedPoints: number) {
        let bonus = 0;
        if (this.gameService.isCurrentQuestionQcm() && (this.hasBonus || this.gameService.gameMode === GameMode.Testing)) {
            bonus = currentRewardedPoints * BONUS_FACTOR;
            this.rewardMessage += ` + ${bonus} points bonus 🎉🎊`;
            this.bonusTimes++;
            this.clientSocket.socket.emit('updateBonusTimes', this.bonusTimes);
        }
        return bonus;
    }
}
