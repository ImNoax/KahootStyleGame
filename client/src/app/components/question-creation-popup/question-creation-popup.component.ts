import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { FormManagerService } from '@app/services/form-manager.service';
import { Question, QuestionType } from '@common/jeu';

const MAX_CHOICES_NUMBER = 4;
const BASE_POINTS = 10;

@Component({
    selector: 'app-question-creation-popup',
    templateUrl: './question-creation-popup.component.html',
    styleUrls: ['./question-creation-popup.component.scss'],
})

export class QuestionCreationPopupComponent implements OnInit {
    pageTitle: string = 'Liste des questions';

    questionForm: FormGroup;
    questionType: QuestionType = QuestionType.QCM;

    canAddAnswer: boolean = true;
    isChecked: boolean = true;

    constructor(
        public dialogRef: MatDialogRef<QuestionCreationPopupComponent>,
        private fb: FormBuilder,
        private formManager: FormManagerService
    ) {}

    ngOnInit() {
        this.questionForm = this.fb.group({
            text: ['', Validators.required],
            points: BASE_POINTS,
            type: this.questionType,
            choices: this.fb.array([
                this.fb.group({
                    answer: ['', Validators.required],
                    isCorrect: this.isChecked
                })
            ])
        });        
    }

    setAnswerStyle(isCorrect: boolean) {
        if (isCorrect) {
            this.isChecked = true;
            return { background: '#98FF7F' };
        }
        this.isChecked = false;
        return { background: '#FF967F' };
    }

    drop(event: CdkDragDrop<Question[]>): void {
        moveItemInArray(this.choices.controls, event.previousIndex, event.currentIndex);
        
        const choices: {answer: string, isCorrect: boolean}[] = this.choices.value;
        // Sources: https://stackoverflow.com/questions/49273499/angular-formarray-contents-order
                    https://www.freecodecamp.org/news/swap-two-array-elements-in-javascript/
        [choices[event.previousIndex], choices[event.currentIndex]] = [choices[event.currentIndex], choices[event.previousIndex]];
        this.choices.setValue(choices);
    }

    get choices(): FormArray {
        return this.questionForm.get("choices") as FormArray;
    }
    
    addChoice() {
        this.choices.push(
            this.fb.group({
                answer: ['', Validators.required],
                isCorrect: true
            })
        );
        this.canAddAnswer = this.choices.length !== MAX_CHOICES_NUMBER;
    }

    deleteChoice(index: number) {
        this.choices.removeAt(index);
        this.canAddAnswer = this.choices.length !== MAX_CHOICES_NUMBER;
    }
    
    closeQuestionCreator() {
        this.dialogRef.close();
    }

    onSubmit() {
        this.formManager.questions.push(this.questionForm);
        this.dialogRef.close();
    }
}
