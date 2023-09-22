import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Game } from '@app/interfaces/game';
import { GameHandlingService } from '@app/services/game-handling.service';

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
    ) {
        this.isNameDuplicate = false;
        this.maxCharName = 255;
        this.maxCharDesc = 2000;
    }
    ngOnInit() {
        this.myForm = this.fb.group({
            name: new FormControl('', [Validators.required]),
            description: new FormControl('', Validators.required),
            time: new FormControl('30'),
        });
        this.gameHandler.getGames().subscribe((game) => {
            this.games = game;
        });
    }

    verifyName(event: Event) {
        for (const game of this.games) {
            if (game.name === (event.target as HTMLInputElement).value) {
                this.isNameDuplicate = true;
                break;
            } else {
                this.isNameDuplicate = false;
            }
        }
    }

    onSubmit(form: FormGroup) {
        // Submit the form
    }
}
