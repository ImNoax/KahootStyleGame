import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Limits } from '@app/enums';
import { FormManagerService } from '@app/services/form-manager.service';
import { Choice, Question, QuestionType } from '@common/jeu';
import * as _ from 'lodash';

@Component({
    selector: 'app-question-creation-popup',
    templateUrl: './question-creation-popup.component.html',
    styleUrls: ['./question-creation-popup.component.scss'],
})
export class QuestionCreationPopupComponent implements OnInit {
    pageTitle: string = 'Liste des questions';
    questionType: QuestionType = QuestionType.QCM;
    isChoiceEmpty: boolean = false;
    nGoodChoices: number = 0;
    maxQuestionLength: number = Limits.MaxQuestionLength;
    maxAnswerLength: number = Limits.MaxAnswerLength;
    questionForm: FormGroup;
    choiceDuplicate = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { questionsFormArray: FormArray; index?: number },
        public dialogRef: MatDialogRef<QuestionCreationPopupComponent>,
        private formManager: FormManagerService,
    ) {}

    get choices(): FormArray {
        return this.questionForm.get('choices') as FormArray;
    }

    ngOnInit() {
        const fb: FormBuilder = new FormBuilder();
        if (this.data.index === undefined) this.createNewForm(fb);
        else this.questionForm = _.cloneDeep(this.loadForm(fb, this.data.index)) as FormGroup;
    }

    loadForm(fb: FormBuilder, index: number): FormGroup {
        const question: AbstractControl = this.data.questionsFormArray.controls[index];
        const choices: FormArray = question.get('choices') as FormArray;
        return fb.group({
            text: [question.value.text, [Validators.required, this.formManager.preventEmptyInput]],
            points: [question.value.points, [Validators.required, Validators.pattern('^[1-9][0-9]*0$'), Validators.max(Limits.MaxPoints)]],
            type: question.value.type,
            choices: fb.array(choices.controls),
        });
    }

    createNewForm(fb: FormBuilder): void {
        this.questionForm = fb.group({
            // Source: https://stackoverflow.com/questions/18476318/regex-for-multiples-of-10
            text: ['', [Validators.required, this.formManager.preventEmptyInput]],
            points: [Limits.MinPoints, [Validators.required, Validators.pattern('^[1-9][0-9]*0$'), Validators.max(Limits.MaxPoints)]],
            type: QuestionType.QCM,
            choices: fb.array([]),
        });
        this.addChoice(true);
        this.addChoice(false);
    }

    setAnswerStyle(isCorrect: boolean): { background: string } {
        return isCorrect ? { background: '#98FF7F' } : { background: '#FF967F' };
    }

    drop(event: CdkDragDrop<Question[]>): void {
        moveItemInArray(this.choices.controls, event.previousIndex, event.currentIndex);

        const choices: Choice[] = this.choices.value;
        // Sources: https://stackoverflow.com/questions/49273499/angular-formarray-contents-order
        // www.freecodecamp.org/news/swap-two-array-elements-in-javascript/
        [choices[event.previousIndex], choices[event.currentIndex]] = [choices[event.currentIndex], choices[event.previousIndex]];
        this.choices.setValue(choices);
    }

    addChoice(isChoiceCorrect: boolean) {
        const fb: FormBuilder = new FormBuilder();
        this.choices.push(
            fb.group({
                answer: ['', [Validators.required, this.formManager.preventEmptyInput]],
                isCorrect: isChoiceCorrect,
            }),
        );
    }

    verifyChoice(): void {
        for (let i = 0; i < this.choices.length; i++) {
            for (let j = i + 1; j < this.choices.length; j++) {
                if (this.choices.value[i].answer.trim().toLowerCase() === this.choices.value[j].answer.trim().toLowerCase()) {
                    this.choiceDuplicate = true;
                    return;
                }
            }
        }
        this.choiceDuplicate = false;
    }

    deleteChoice(index: number) {
        this.choices.removeAt(index);
    }

    closeQuestionCreator() {
        this.dialogRef.close();
    }

    onSubmit() {
        this.dialogRef.close(this.questionForm);
    }

    canAddAnswer(): boolean {
        return this.choices.length !== Limits.MaxChoicesNumber;
    }

    canDeleteAnswer(): boolean {
        return this.choices.length !== Limits.MinChoicesNumber;
    }

    isQuestionEmpty(): boolean {
        return this.questionForm.controls['text'].touched && this.questionForm.controls['text'].errors?.isEmpty;
    }

    showPointsError(): string {
        const points: number = this.questionForm.controls['points'].value;
        return points < Limits.MinPoints || points > Limits.MaxPoints ? 'Doit être entre 10 et 100.' : 'Doit être un multiple de 10.';
    }

    hasMinimumGoodChoices(): boolean {
        this.nGoodChoices = this.choices.value.reduce((counter: number, choice: Choice) => (choice.isCorrect ? counter + 1 : counter), 0);
        return Limits.MinGoodChoices <= this.nGoodChoices && this.nGoodChoices < this.choices.length;
    }

    showCorrectnessError(): string {
        return this.nGoodChoices < Limits.MinGoodChoices ? 'Il manque un bon choix.' : 'Il manque un mauvais choix.';
    }
}
