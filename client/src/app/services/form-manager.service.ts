import { formatDate } from '@angular/common';
import { Injectable } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { GameHandlingService } from './game-handling.service';

const BASE_TIMER = 30;

@Injectable({
    providedIn: 'root',
})
export class FormManagerService {
    gameForm: FormGroup = this.fb.group({
        title: ['', Validators.required],
        description: ['', Validators.required],
        duration: BASE_TIMER,
        lastModification: formatDate(new Date(), 'yyyy-MM-dd', 'en'),
        isVisible: false,
        questions: this.fb.array([]),
    });

    constructor(
        private fb: FormBuilder,
        private gameHandler: GameHandlingService,
    ) {}

    get questions(): FormArray {
        return this.gameForm.get('questions') as FormArray;
    }

    saveGameForm(gameForm: FormGroup): void {
        this.gameForm.patchValue(gameForm.value);
    }

    resetGameForm(): void {
        this.gameForm.reset(this.gameForm.value);
    }

    sendGameForm(): void {
        this.gameHandler.addGame(this.gameForm.value).subscribe(() => {
            this.resetGameForm();
        });
    }
}
