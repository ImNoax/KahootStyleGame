import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Limits } from '@app/enums';
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
    maxTitleLength: number;
    maxDescriptionLength: number;
    isNameDuplicate = false;
    isNameEmpty = false;
    isDescEmpty = false;
    isTimerInvalid = false;
    games: Jeu[];
    gameForm: FormGroup = this.formManager.gameForm;
    nameModif: string;

    constructor(
        private gameHandler: GameHandlingService,
        private formManager: FormManagerService,
    ) {
        this.maxTitleLength = Limits.MaxTitleLength;
        this.maxDescriptionLength = Limits.MaxDescriptionLength;
    }

    ngOnInit(): void {
        this.nameModif = this.formManager.nameModif;
        this.gameHandler.getGames().subscribe((games) => {
            this.games = games;
        });
    }

    verifyName(event: Event): void {
        this.isNameEmpty = (event.target as HTMLInputElement).value.trim() === '';

        if ((event.target as HTMLInputElement).value.trim().toLowerCase() === this.nameModif.toLowerCase() && !this.isNameEmpty) {
            this.isNameDuplicate = false;
            return;
        }

        for (const game of this.games) {
            this.isNameDuplicate = game.title.toLowerCase() === (event.target as HTMLInputElement).value.trim().toLowerCase();
            if (this.isNameDuplicate) {
                return;
            }
        }
    }

    verifyDesc(event: Event) {
        this.isDescEmpty = (event.target as HTMLInputElement).value.trim() === '';
    }

    verifyTimer(event: Event) {
        this.isTimerInvalid =
            (event.target as HTMLInputElement).value.trim() === '' ||
            Number((event.target as HTMLInputElement).value) < Limits.MinDuration ||
            Number((event.target as HTMLInputElement).value) > Limits.MaxDuration;
    }

    hasQuestions(): boolean {
        return this.formManager.hasQuestions();
    }

    onSubmit(): void {
        this.formManager.sendGameForm();
    }

    resetForm(): void {
        this.formManager.resetGameForm();
    }
}
