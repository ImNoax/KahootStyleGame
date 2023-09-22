import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { QuestionCreationPopupComponent } from '@app/components/question-creation-popup/question-creation-popup.component';
import { FormManagerService } from '@app/services/form-manager.service';
import { Question, QuestionType } from '@common/jeu';

@Component({
    selector: 'app-questions-page',
    templateUrl: './questions-page.component.html',
    styleUrls: ['./questions-page.component.scss'],
})
export class QuestionsPageComponent implements OnInit {
    pageTitle: string = 'Liste des questions';
    questionsFormArray: FormArray;

    constructor(
        private dialog: MatDialog,
        private fb: FormBuilder,
        private formManager: FormManagerService,
    ) {}

    ngOnInit(): void {
        this.questionsFormArray = this.formManager.questions;
    }

    setQuestionStyle(question: Question) {
        if (question.type === QuestionType.QCM) return { background: '#78B9DE' };
        return { background: '#F2BB7B' };
    }

    drop(event: CdkDragDrop<Question[]>): void {
        moveItemInArray(this.questionsFormArray.controls, event.previousIndex, event.currentIndex);
        const questions: { answer: string; isCorrect: boolean }[] = this.formManager.questions.value;

        // Sources: https://stackoverflow.com/questions/49273499/angular-formarray-contents-order
        // www.freecodecamp.org/news/swap-two-array-elements-in-javascript/
        [questions[event.previousIndex], questions[event.currentIndex]] = [questions[event.currentIndex], questions[event.previousIndex]];
        this.formManager.questions.setValue(questions);
    }

    openQuestionCreator(): void {
        this.saveQuestionsForm();

        // ajouter disableClose: true après définition des routes
        this.dialog.open(QuestionCreationPopupComponent, {
            width: '75%',
            height: '80%',
            backdropClass: 'backdropBackground',
        });
    }

    deleteQuestion(index: number) {
        this.questionsFormArray.removeAt(index);
    }

    saveQuestionsForm() {
        const questionsForm: FormGroup = this.fb.group({
            questions: this.questionsFormArray,
        });
        this.formManager.saveGameForm(questionsForm);
    }

    openDialog(): void {
        // ajouter disableClose: true après définition des routes
        this.dialog.open(QuestionCreationPopupComponent, { width: '75%', height: '80%', backdropClass: 'backdropBackground' });
    }

    openDialog(): void {
        // ajouter disableClose: true après définition des routes
        this.dialog.open(QuestionCreationPopupComponent, { width: '75%', height: '80%', backdropClass: 'backdropBackground' });
    }
}
