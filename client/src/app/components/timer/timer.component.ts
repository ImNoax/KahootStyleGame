import { Component, OnDestroy, OnInit } from '@angular/core';
import { TimeService } from '../../services/time.service';

@Component({
  selector: 'app-timer',
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss']
})
export class TimerComponent implements OnInit, OnDestroy {
  constructor(private timeService: TimeService) { }

  ngOnInit() {
    this.timeService.startTimer(60);
  }

  ngOnDestroy() {
    this.timeService.stopTimer();
  }

  get currentTime() {
    return this.timeService.time;
  }
}
