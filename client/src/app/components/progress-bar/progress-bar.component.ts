import { GameHandlingService } from '@angular/../../client/src/app/services/game-handling.service';
import { Component, OnInit } from '@angular/core';
import { TimerService } from '@app/services/timer.service';
import { Game } from '@common/game';

@Component({
    selector: 'app-progress-bar',
    templateUrl: './progress-bar.component.html',
    styleUrls: ['./progress-bar.component.scss'],
})
export class ProgressBarComponent implements OnInit {
    currentGame: Game;

    constructor(
        private timer: TimerService,
        private gameService: GameHandlingService,
    ) {}

    get count() {
        return this.timer.count;
    }

    ngOnInit() {
        this.currentGame = this.gameService.currentGame;
        this.timer.startCountDown(this.currentGame.duration);
    }
}
