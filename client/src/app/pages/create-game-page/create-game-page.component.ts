import { Component, OnInit } from '@angular/core';
import { GameHandlingService } from '@app/services/game-handling.service';
import { Observable } from 'rxjs';

@Component({
    selector: 'app-create-game-page',
    templateUrl: './create-game-page.component.html',
    styleUrls: ['./create-game-page.component.scss'],
})
export class CreateGamePageComponent implements OnInit {
    games!: Observable<{ id: number, name: string, description: string, timePerQuestion: number, questions: object }[]>;
    
    constructor(private gameHandler: GameHandlingService) {
    }

    ngOnInit(): void {
      this.games = this.gameHandler.getGames();
    }
}
