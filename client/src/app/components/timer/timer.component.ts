import { GameHandlingService } from '@angular/../../client/src/app/services/game-handling.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { TimeService } from '@app/services/time.service';
import { Game } from '@common/game';

@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnInit, OnDestroy {
    games: Game[] = [];

    constructor(
        private timeService: TimeService,
        private gameService: GameHandlingService,
    ) {}

    get currentTime() {
        return this.timeService.time;
    }

    get totalTime() {
        return this.games.find((g) => g.id === this.gameService.currentGameId)?.duration;
    }

    ngOnInit() {
        this.gameService.getGames().subscribe((data: Game[]) => {
            this.games = data;
            const game = this.games.find((g) => g.id === this.gameService.currentGameId);
            if (game) this.timeService.startTimer(game.duration);
        });
    }

    ngOnDestroy() {
        this.timeService.stopTimer();
    }
}
