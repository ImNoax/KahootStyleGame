import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { QuestionCreationPopupComponent } from '@app/components/question-creation-popup/question-creation-popup.component';
import { Question } from '@app/interfaces/question';

@Component({
    selector: 'app-questions-page',
    templateUrl: './questions-page.component.html',
    styleUrls: ['./questions-page.component.scss'],
})
export class QuestionsPageComponent {
    pageTitle: string = 'Liste des questions';

    questions: Question[] = [
        { text: 'Orange?', type: 'QCM' },
        { text: 'Pomme?', type: 'QCM' },
        { text: 'Banane?', type: 'QCL' },
        { text: 'Citron?', type: 'QCM' },
    ];

    constructor(private dialog: MatDialog) {}

    setQuestionStyle(question: Question): object {
        if (question.type === 'QCM') return { background: '#78B9DE' };
        return { background: '#F2BB7B' };
    }

    drop(event: CdkDragDrop<Question[]>): void {
        moveItemInArray(this.questions, event.previousIndex, event.currentIndex);
    }

    openDialog(): void {
        // ajouter disableClose: true après définition des routes
        this.dialog.open(QuestionCreationPopupComponent, { width: '75%', height: '80%', backdropClass: 'backdropBackground' });
    }
}
