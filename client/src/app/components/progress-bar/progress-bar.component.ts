import { GameHandlingService } from '@angular/../../client/src/app/services/game-handling.service';
import { Component, OnInit } from '@angular/core';
import { ClientSocketService } from '@app/services/client-socket.service';
import { TimerService } from '@app/services/timer.service';
import { GameMode } from '@common/game-mode';

@Component({
    selector: 'app-progress-bar',
    templateUrl: './progress-bar.component.html',
    styleUrls: ['./progress-bar.component.scss'],
})
export class ProgressBarComponent implements OnInit {
    constructor(
        private timer: TimerService,
        private gameService: GameHandlingService,
        private clientsocket: ClientSocketService,
    ) {}

    get count(): number {
        return this.timer.count;
    }

    get isPanicModeEnabled(): boolean {
        return this.timer.isPanicModeEnabled;
    }

    get currentQuestionDuration(): number {
        return this.gameService.getCurrentQuestionDuration();
    }

    ngOnInit() {
        if (this.clientsocket.isOrganizer || this.gameService.gameMode === GameMode.Testing) this.timer.startCountDown(this.currentQuestionDuration);
    }
}
