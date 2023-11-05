import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, inject } from '@angular/core';
import { FormArray, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { QuestionCreationPopupComponent } from '@app/components/question-creation-popup/question-creation-popup.component';
import { Route } from '@app/enums';
import { FormManagerService } from '@app/services/form-manager.service';
import { RouteControllerService } from '@app/services/route-controller.service';
import { Question } from '@common/game';
import { Limit } from '@common/limit';
import * as _ from 'lodash';

@Component({
    selector: 'app-questions-page',
    templateUrl: './questions-page.component.html',
    styleUrls: ['./questions-page.component.scss'],
})
export class QuestionsPageComponent {
    quizCreationRoute: string = '/' + Route.QuizCreation;
    isAccessingQuizCreation: boolean = false;
    pageTitle: string = 'Liste des questions';
    gameName: string = this.formManager.gameForm.value.title;
    gameNameUnavailable: string = 'À déterminer';
    questionsFormArray: FormArray = _.cloneDeep(this.formManager.questions) as FormArray;
    routeController: RouteControllerService = inject(RouteControllerService);

    constructor(
        private dialog: MatDialog,
        private formManager: FormManagerService,
    ) {}

    setQuestionStyle(question: Question) {
        if (question.type === 'QCM') return { background: '#3F51B5' };
        return { background: '#F2BB7B' };
    }

    drop(event: CdkDragDrop<Question[]>): void {
        moveItemInArray(this.questionsFormArray.controls, event.previousIndex, event.currentIndex);
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

    saveQuestions(): void {
        this.formManager.saveQuestions(this.questionsFormArray);
    }

    isEmpty(): boolean {
        return this.questionsFormArray.length < Limit.MinQuestionsNumber;
    }
}
