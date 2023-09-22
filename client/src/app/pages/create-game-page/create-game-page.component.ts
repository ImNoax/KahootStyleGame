import { Component, OnInit } from '@angular/core';
import { GameHandlingService } from '@app/services/game-handling.service';
import { Jeu } from '@common/jeu';
// import { saveAs } from 'file-saver';

@Component({
    selector: 'app-create-game-page',
    templateUrl: './create-game-page.component.html',
    styleUrls: ['./create-game-page.component.scss'],
})
export class CreateGamePageComponent implements OnInit {
    games: Jeu[];

    constructor(private gameHandler: GameHandlingService) {}

    ngOnInit(): void {
        this.gameHandler.getGames().subscribe((games: Jeu[]) => {
            this.games = games;
        });
    }
}
