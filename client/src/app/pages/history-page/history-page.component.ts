import { Component, OnInit } from '@angular/core';
import { Route } from '@app/enums';
import { GameHandlingService } from '@app/services/game-handling.service';
import { GameInfo } from '@common/game';

const SORT_FALSE = -1;
const SORT_TRUE = 1;
const ARROW_UP = ' ▲';
const ARROW_DOWN = ' ▼';

@Component({
    selector: 'app-history-page',
    templateUrl: './history-page.component.html',
    styleUrls: ['./history-page.component.scss'],
})
export class HistoryPageComponent implements OnInit {
    adminRoute: string = '/' + Route.Admin;
    games: GameInfo[] = [];
    isNameSortedAscending: boolean = false;
    isDateSortedAscending: boolean = false;
    arrowName: string = '';
    arrowDate: string = '';

    constructor(private gameHandling: GameHandlingService) {}

    ngOnInit() {
        this.gameHandling.getHistory().subscribe((infos) => {
            this.games = infos;
        });
    }

    resetList() {
        this.gameHandling.resetHistory().subscribe((infos) => {
            this.games = infos;
        });
    }

    listIsEmpty(): boolean {
        return this.games.length === 0;
    }

    sortName() {
        if (!this.isNameSortedAscending) {
            this.games.sort((a, b) => (a.name > b.name ? SORT_TRUE : SORT_FALSE));
            this.arrowName = ARROW_UP;
        } else {
            this.games.sort((a, b) => (a.name > b.name ? SORT_FALSE : SORT_TRUE));
            this.arrowName = ARROW_DOWN;
        }

        this.isNameSortedAscending = !this.isNameSortedAscending;
        this.isDateSortedAscending = false;
        this.arrowDate = '';
    }

    sortDate() {
        if (!this.isDateSortedAscending) {
            this.games.sort((a, b) => (a.date > b.date ? SORT_TRUE : SORT_FALSE));
            this.arrowDate = ARROW_UP;
        } else {
            this.games.sort((a, b) => (a.date > b.date ? SORT_FALSE : SORT_TRUE));
            this.arrowDate = ARROW_DOWN;
        }

        this.isDateSortedAscending = !this.isDateSortedAscending;
        this.isNameSortedAscending = false;
        this.arrowName = '';
    }
}