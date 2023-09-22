import { formatDate } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Game } from '@app/interfaces/game';
import { GameHandlingService } from '@app/services/game-handling.service';

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
    games: Game[] = new Array();

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
            name: new FormControl('', [Validators.required]),
            description: new FormControl('', Validators.required),
            time: new FormControl(BASE_TIMER),
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

    onSubmit(form: FormGroup) {
        const game = {
            title: form.value.name,
            description: form.value.description,
            duration: form.value.time,
            lastModification: formatDate(new Date(), 'yyyy-MM-dd', 'en'),
            questions: [],
        };
        this.gameHandler.addGame(game);

        this.router.navigate(['/admin']);
    }
}
