import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { QuestionCreationPopupComponent } from '@app/components/question-creation-popup/question-creation-popup.component';
import { FormManagerService } from '@app/services/form-manager.service';
import { Limits } from '@common/Limits';
import { Question } from '@common/game';
import * as _ from 'lodash';

@Component({
    selector: 'app-questions-page',
    templateUrl: './questions-page.component.html',
    styleUrls: ['./questions-page.component.scss'],
})
export class QuestionsPageComponent {
    pageTitle: string = 'Liste des questions';
    gameName: string = this.formManager.gameForm.value.title;
    gameNameUnavailable: string = 'À déterminer';
    questionsFormArray: FormArray = _.cloneDeep(this.formManager.questions) as FormArray;

    constructor(
        private dialog: MatDialog,
        private formManager: FormManagerService,
    ) {}

    setQuestionStyle(question: Question) {
        if (question.type === 'QCM') return { background: '#78B9DE' };
        return { background: '#F2BB7B' };
    }

    drop(event: CdkDragDrop<Question[]>): void {
        moveItemInArray(this.questionsFormArray.controls, event.previousIndex, event.currentIndex);
        const questions: Question[] = this.questionsFormArray.value;

        // Sources: https://stackoverflow.com/questions/49273499/angular-formarray-contents-order
        // www.freecodecamp.org/news/swap-two-array-elements-in-javascript/
        [questions[event.previousIndex], questions[event.currentIndex]] = [questions[event.currentIndex], questions[event.previousIndex]];
        this.questionsFormArray.setValue(questions);
    }

    openQuestionCreator(index?: number): void {
        const questionsFormArray = this.questionsFormArray;
        const questionPopup: MatDialogRef<QuestionCreationPopupComponent, FormGroup> = this.dialog.open(QuestionCreationPopupComponent, {
            data: { questionsFormArray, index },
            width: '70%',
            height: '85%',
            backdropClass: 'backdropBackground',
            disableClose: true,
        });

        questionPopup.afterClosed().subscribe((questionForm: FormGroup | undefined) => {
            if (questionForm) {
                if (index === undefined) {
                    this.questionsFormArray.push(questionForm);
                } else {
                    this.questionsFormArray.controls[index] = questionForm;
                }
            }
        });
    }

    deleteQuestion(index: number) {
        this.questionsFormArray.removeAt(index);
    }

    saveQuestions() {
        this.formManager.saveQuestions(this.questionsFormArray);
    }

    isEmpty() {
        return this.questionsFormArray.length < Limits.MinQuestionsNumber;
    }
}
