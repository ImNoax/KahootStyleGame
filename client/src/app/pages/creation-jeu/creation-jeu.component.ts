import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { FormManagerService } from '@app/services/form-manager.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { Jeu } from '@common/jeu';

@Component({
    selector: 'app-creation-jeu',
    templateUrl: './creation-jeu.component.html',
    styleUrls: ['./creation-jeu.component.scss'],
})
export class CreationJeuComponent implements OnInit {
    pageTitle: string = "Création d'un jeu";
    maxCharName: number;
    maxCharDesc: number;
    isNameDuplicate: boolean;
    games: Jeu[];
    detailsForm: FormGroup;

    constructor(
        private gameHandler: GameHandlingService,
        private formManager: FormManagerService,
        private router: Router,
    ) {
        this.isNameDuplicate = false;
        this.maxCharName = 255;
        this.maxCharDesc = 2000;
    }

    ngOnInit() {
        this.gameHandler.getGames().subscribe((game) => {
            this.games = game;
        });

        this.detailsForm = this.formManager.gameForm;
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

    saveGameDetails(): void {
        this.formManager.saveGameForm(this.detailsForm);
    }

    onSubmit() {
        this.saveGameDetails();
        this.formManager.sendGameForm();

        this.router.navigate(['/admin']);
    }

    resetForm(): void {
        this.formManager.resetGameForm();
    }
}
