import { Component, OnDestroy, OnInit } from '@angular/core';
import { TimeService } from '@app/services/time.service';
import { GameHandlingService } from '@angular/../../client/src/app/services/game-handling.service';
import { Jeu } from '@common/jeu';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnInit, OnDestroy {
    games: Jeu[] = [];

    constructor(private timeService: TimeService, private gameService: GameHandlingService) { }

    get currentTime() {
        return this.timeService.time;
    }

    get totalTime() {
        return this.games[this.gameService.currentGameId].duration;
    }

    ngOnInit() {
        this.gameService.getGames().subscribe((data: Jeu[]) => {
            this.games = data;
            this.updateTimer();
        });
    }

    updateTimer() {
        this.timeService.startTimer(this.games[this.gameService.currentGameId].duration);
    }

    ngOnDestroy() {
        this.timeService.stopTimer();
    }
}
