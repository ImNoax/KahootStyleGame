import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Jeu } from '@common/jeu';
import { Observable } from 'rxjs';
import { GameHandlingService } from './game-handling.service';

const BASE_TIMER = 30;

@Injectable({
    providedIn: 'root',
})
export class FormManagerService {
    gameForm: FormGroup = this.createBaseForm();
    nameModif = '';

    constructor(
        private fb: FormBuilder,
        private gameHandler: GameHandlingService,
    ) {}

    get questions(): FormArray {
        return this.gameForm.get('questions') as FormArray;
    }

    initializeImportForm(gameData: Jeu): FormGroup {
        return (this.gameForm = this.fb.group({
            id: gameData.id,
            title: gameData.title,
            description: gameData.description,
            duration: gameData.duration,
            lastModification: formatDate(new Date(), 'yyyy-MM-dd', 'en'),
            isVisible: false,
            questions: this.fb.array(gameData.questions),
        }));
    }

    resetGameForm(): void {
        this.gameForm = this.createBaseForm();
        this.nameModif = '';
    }

    sendGameForm(importedGameForm?: FormGroup): void | Observable<Jeu[]> {
        if (this.nameModif !== '') {
            this.gameHandler.modifyGame(this.gameForm.value, this.nameModif).subscribe(() => {
                this.resetGameForm();
                // location.reload();
            });
        } else if (importedGameForm === undefined) {
            this.gameHandler.addGame(this.gameForm.value).subscribe(() => {
                this.resetGameForm();
                // location.reload();
            });
        } else return this.gameHandler.addGame(importedGameForm.value);
    }

    hasQuestions(): boolean {
        return this.questions.length > 0;
    }

    preventEmptyInput(control: AbstractControl) {
        const whiteSpaceRemoved = control.value.trim();
        return whiteSpaceRemoved.length === 0 ? { isEmpty: true } : null;
    }

    saveQuestions(questionsFormArray: FormArray) {
        this.questions.clear();

        for (let i = 0; i < questionsFormArray.length; i++) this.questions.push(questionsFormArray.at(i));
    }

    private createBaseForm(): FormGroup {
        const baseForm: FormGroup = this.fb.group({
            id: 0,
            title: ['', Validators.required],
            description: ['', Validators.required],
            duration: [BASE_TIMER, Validators.required],
            lastModification: formatDate(new Date(), 'yyyy-MM-dd', 'en'),
            isVisible: false,
            questions: this.fb.array([]),
        });

        return baseForm;
    }
}
