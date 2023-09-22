import { formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GameHandlingService } from '@app/services/game-handling.service';
import { Jeu } from '@common/game';

const BASE_TIMER = 30;

@Component({
    selector: 'app-creation-jeu',
    templateUrl: './creation-jeu.component.html',
    styleUrls: ['./creation-jeu.component.scss'],
})
export class CreationJeuComponent implements OnInit {
    maxCharName: number;
    maxCharDesc: number;
    isNameDuplicate: boolean;
    myForm: FormGroup;
    games: Jeu[] = new Array();

    constructor(
        private gameHandler: GameHandlingService,
        private fb: FormBuilder,
        private router: Router,
    ) {
        this.isNameDuplicate = false;
        this.maxCharName = 255;
        this.maxCharDesc = 2000;
    }
    ngOnInit() {
        this.myForm = this.fb.group({
            title: ['', Validators.required],
            description: ['', Validators.required],
            duration: BASE_TIMER,
            lastModification: formatDate(new Date(), 'yyyy-MM-dd', 'en'),
            isVisible: false,
            questions: [],
        });
        
        this.gameHandler.getGames().subscribe((game) => {
            this.games = game;
        });
    }

    verifyName(event: Event) {
        for (const game of this.games) {
            if (game.title === (event.target as HTMLInputElement).value) {
                this.isNameDuplicate = true;
                break;
            } else {
                this.isNameDuplicate = false;
            }
        }
    }

    onSubmit() {
        this.gameHandler.addGame(this.myForm.value);

        this.router.navigate(['/admin']);
    }
}
