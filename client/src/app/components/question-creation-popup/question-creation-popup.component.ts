import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { Question } from '@common/game';

@Component({
    selector: 'app-question-creation-popup',
    templateUrl: './question-creation-popup.component.html',
    styleUrls: ['./question-creation-popup.component.scss'],
})
export class QuestionCreationPopupComponent implements OnInit {
    pageTitle: string = 'Liste des questions';
    maxAnswerNumbers: number = 4; // où mettre une constante?
    canAddAnswer: boolean;
    isChecked: boolean = false;

    answers: Question[] = [
        // { text: 'Choix 1', type: 'Bon' },
        // { text: 'Choix 2', type: 'Mauvais' },
        // { text: 'Choix 3', type: 'Bon' },
    ];

    ngOnInit() {
        this.canAddAnswer = this.answers.length !== this.maxAnswerNumbers;
    }

    setAnswerStyle(answer: Question) {
        // if (answer.type === 'Bon') {
        //     this.isChecked = true;
        //     return { background: '#98FF7F' };
        // }
        // this.isChecked = false;
        // return { background: '#FF967F' };
    }

    drop(event: CdkDragDrop<Question[]>): void {
        moveItemInArray(this.answers, event.previousIndex, event.currentIndex);
    }
}
