import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-histogram',
    templateUrl: './histogram.component.html',
    styleUrls: ['./histogram.component.scss'],
})
export class HistogramComponent {
    @Input() data: { [key: string]: number };
    @Input() correctAnswers: string[];
    object = Object;
}
