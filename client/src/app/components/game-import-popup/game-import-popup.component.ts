import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ImportState, Limit } from '@app/enums';
import { FormManagerService } from '@app/services/form-manager.service';
import { Jeu, Question } from '@common/jeu';
import { Observable } from 'rxjs';

const POINTS_MULTIPLE = 10;

@Component({
    selector: 'app-game-import-popup',
    templateUrl: './game-import-popup.component.html',
    styleUrls: ['./game-import-popup.component.scss'],
})
export class GameImportPopupComponent implements OnInit {
    games: Jeu[];
    errors: string[] = [];
    newName: string = '';
    gameForm: FormGroup = this.formManager.gameForm;
    importState: string = '';
    maxTitleLength = Limit.MaxTitleLength;
    importedGame: Jeu;

    questionsDetailsAreValid: boolean = true;
    choicesAreValid: boolean = true;
    emptyQuestionVerified: boolean = false;
    exceededQuestionTextVerified: boolean = false;
    pointsLimitsVerified: boolean = false;
    pointsMultipleVerified: boolean = false;
    emptyChoicesVerified: boolean = false;
    emptyAnswerVerified: boolean = false;
    exceededAnswerVerified: boolean = false;
    minimumChoicesVerified: boolean = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { importedGame: Jeu; games: Jeu[]; fileName: string },
        public dialogRef: MatDialogRef<GameImportPopupComponent>,
        private formManager: FormManagerService,
    ) {}

    ngOnInit(): void {
        this.games = this.data.games;
        this.importedGame = this.data.importedGame;
        this.getImportState();
    }

    getImportState() {
        if (this.isFormValid()) {
            this.gameForm = this.formManager.initializeImportForm(this.importedGame);
            if (this.titleAlreadyExists()) {
                this.importState = ImportState.NameExists;
            } else {
                this.importState = ImportState.ValidForm;
            }
        } else {
            this.importState = ImportState.InvalidForm;
        }
    }

    closeDialog(newGames?: Jeu[]) {
        this.formManager.resetGameForm();
        this.dialogRef.close(newGames);
    }

    isFormValid(): boolean {
        return [
            this.isGameDetailValid(this.importedGame.title, Limit.MaxTitleLength),
            this.isGameDetailValid(this.importedGame.description, Limit.MaxDescriptionLength, true),
            this.isDurationValid(),
            this.areQuestionsValid(),
        ].every((value: boolean) => value === true);
    }

    titleAlreadyExists(): boolean {
        for (const game of this.games) {
            if (game.title.toLowerCase().trim() === this.gameForm.value.title.toLowerCase().trim()) return true;
        }
        return false;
    }

    isNewTitleEmpty(): boolean {
        return this.gameForm.value.title.trim().length === 0;
    }

    isGameDetailValid(gameDetail: string, maxLength: number, isDescription?: boolean): boolean {
        let property = 'title';
        if (isDescription) property = 'description';

        if (gameDetail === undefined || gameDetail.trim().length === 0) {
            this.errors.push(`La propriété '${property}' est vide.`);
            return false;
        } else if (gameDetail.length > maxLength) {
            this.errors.push(`La propriété '${property}' dépasse le nombre de caractères permis ${maxLength}.\
            Le fichier en contient ${gameDetail.length}`);
            return false;
        }
        return true;
    }

    isDurationValid(): boolean {
        const gameDuration: number = this.importedGame.duration;
        if (gameDuration === undefined || gameDuration < Limit.MinDuration || Limit.MaxDuration < gameDuration) {
            this.errors.push(`La propriété 'duration' doit être entre ${Limit.MinDuration} et ${Limit.MaxDuration}`);
            return false;
        }
        return true;
    }

    areQuestionsValid(): boolean {
        const gameQuestions: Question[] = this.importedGame.questions;

        if (gameQuestions === undefined || gameQuestions.length === 0) {
            this.errors.push("La propriété 'questions' est vide");
            return false;
        } else {
            for (const question of gameQuestions) {
                this.isQuestionValid(question);
                this.areChoicesValid(question);
            }
        }
        return this.questionsDetailsAreValid && this.choicesAreValid;
    }

    isQuestionValid(question: Question): void {
        const text = question.text.trim();

        if (!this.emptyQuestionVerified && text.length === 0) {
            this.errors.push("Une propriété 'text' est vide");
            this.questionsDetailsAreValid = false;
            this.emptyQuestionVerified = true;
        }

        if (!this.exceededQuestionTextVerified && text.length > Limit.MaxQuestionLength) {
            this.errors.push(`Une propriété 'text' dépasse le nombre de caractères permis (${Limit.MaxQuestionLength})`);
            this.questionsDetailsAreValid = false;
            this.exceededQuestionTextVerified = true;
        }

        if (!this.pointsLimitsVerified && (question.points < Limit.MinPoints || Limit.MaxPoints < question.points)) {
            this.errors.push(`La propriété 'points' doit être entre ${Limit.MinPoints} et ${Limit.MaxPoints}`);
            this.questionsDetailsAreValid = false;
            this.pointsLimitsVerified = true;
        }

        if (!this.pointsMultipleVerified && !(question.points % POINTS_MULTIPLE === 0)) {
            this.errors.push("La propriété 'points' doit être un multiple de 10");
            this.questionsDetailsAreValid = false;
            this.pointsMultipleVerified = true;
        }
    }

    areChoicesValid(question: Question): void {
        let nGoodChoices = 0;
        let nBadChoices = 0;

        if (question.choices === undefined || question.choices.length === 0) {
            if (!this.emptyChoicesVerified) {
                this.errors.push("Une propriété 'choices' est vide");
                this.choicesAreValid = false;
                this.emptyChoicesVerified = true;
            }
        } else {
            for (const choice of question.choices) {
                const answer = choice.answer.trim();
                if (!this.emptyAnswerVerified && answer.length === 0) {
                    this.errors.push("Une propriété 'answer' est vide");
                    this.choicesAreValid = false;
                    this.emptyAnswerVerified = true;
                }

                if (!this.exceededAnswerVerified && answer.length > Limit.MaxAnswerLength) {
                    this.errors.push(`Une propriété 'answer' dépasse le nombre de caractères permis ${Limit.MaxAnswerLength}`);
                    this.choicesAreValid = false;
                    this.exceededAnswerVerified = true;
                }

                if (choice.isCorrect) ++nGoodChoices;
                else ++nBadChoices;
            }

            if (!this.minimumChoicesVerified && (nGoodChoices < Limit.MinGoodChoices || nBadChoices < Limit.MinGoodChoices)) {
                this.errors.push('Il doit y avoir au moins un bon et un mauvais choix pour chaque question');
                this.choicesAreValid = false;
                this.minimumChoicesVerified = true;
            }
        }
    }

    onSubmit() {
        const response: Observable<Jeu[]> | void = this.formManager.sendGameForm(this.gameForm);
        if (response) {
            response.subscribe((games: Jeu[]) => {
                this.closeDialog(games);
            });
        }
    }
}
