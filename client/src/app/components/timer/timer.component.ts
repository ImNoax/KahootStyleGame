import { Component, OnDestroy, OnInit } from '@angular/core';
import { TimeService } from '@app/services/time.service';

const TOTALTIME = 60;
const TIME = 60;
@Component({
    selector: 'app-timer',
    templateUrl: './timer.component.html',
    styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnInit, OnDestroy {
    constructor(private timeService: TimeService) {}

    get currentTime() {
        return this.timeService.time;
    }

    get totalTime() {
        return TOTALTIME;
    }

    ngOnInit() {
        this.timeService.startTimer(TIME);
    }

    ngOnDestroy() {
        this.timeService.stopTimer();
    }
}
