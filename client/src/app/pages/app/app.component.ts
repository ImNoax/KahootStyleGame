import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { serverErrorMessage, snackBarErrorConfiguration } from '@app/constants/snack-bar-configuration';
import { Route } from '@app/enums';
import { ClientSocketService } from '@app/services/client-socket.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
    constructor(
        private clientSocket: ClientSocketService,
        private snackBar: MatSnackBar,
        private router: Router,
    ) {}

    ngOnInit(): void {
        this.clientSocket.connect();

        this.clientSocket.socket.on('disconnect', () => {
            this.snackBar.open(serverErrorMessage, '', snackBarErrorConfiguration);
            this.router.navigate([Route.MainMenu]);
        });
    }

    ngOnDestroy(): void {
        this.clientSocket.socket.removeAllListeners('disconnect');
    }
}
