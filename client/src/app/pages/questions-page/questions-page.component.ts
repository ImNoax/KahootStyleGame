import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { Question } from '@app/interfaces/question';

@Component({
    selector: 'app-questions-page',
    templateUrl: './questions-page.component.html',
    styleUrls: ['./questions-page.component.scss'],
})
export class QuestionsPageComponent {
    pageTitle: string = 'Liste des questions';
    questionTypeStyle: object;

    questions: Question[] = [
        { text: 'Orange?', type: 'QCM' },
        { text: 'Pomme?' , type: 'QCM' },
        { text: 'Banane?', type: 'QCL' },
        { text: 'Citron?', type: 'QCM' }
    ];

    setQuestionStyle(question: Question) {
        if (question.type === 'QCM') return { background: '#78B9DE' };
        return { background: '#F2BB7B' };
    }

    drop(event: CdkDragDrop<Question[]>) {
        moveItemInArray(this.questions, event.previousIndex, event.currentIndex);
    }
}
