import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PasswordPopupComponent } from '@app/components/password-popup/password-popup.component';
import { Route } from '@app/constants/enums';
import { ClientSocketService } from '@app/services/client-socket/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling/game-handling.service';
import { RouteControllerService } from '@app/services/route-controller/route-controller.service';
import { Game } from '@common/game';
import { Pin, REQUIRED_PIN_LENGTH } from '@common/lobby';
import { BehaviorSubject } from 'rxjs';

@Component({
    selector: 'app-main-menu-page',
    templateUrl: './main-menu-page.component.html',
    styleUrls: ['./main-menu-page.component.scss'],
})
export class MainMenuPageComponent implements OnInit, OnDestroy {
    gameCreationRoute: string = '/' + Route.GameCreation;
    title: string = 'Survey Genius';
    message: BehaviorSubject<string> = new BehaviorSubject<string>('');
    pinForm: FormGroup;
    serverErrorMessage: string = '';
    private routeController: RouteControllerService = inject(RouteControllerService);
    private dialog: MatDialog = inject(MatDialog);

    constructor(
        private readonly gameHandler: GameHandlingService,
        private readonly router: Router,
        private readonly clientSocket: ClientSocketService,
    ) {
        const fb: FormBuilder = new FormBuilder();
        this.pinForm = fb.group({
            pin: ['', [Validators.required, Validators.minLength(REQUIRED_PIN_LENGTH), this.containsNonNumeric]],
        });

        this.configureBaseSocketFeatures();
    }

    ngOnInit(): void {
        this.routeController.setRouteAccess(Route.Admin, false);
    }

    ngOnDestroy(): void {
        this.clientSocket.socket.removeAllListeners('validPin');
        this.clientSocket.socket.removeAllListeners('invalidPin');
    }

    adminLogin(): void {
        this.dialog.open(PasswordPopupComponent, {
            backdropClass: 'backdropBackground',
            disableClose: true,
        });
    }

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on('validPin', (game: Game, pin: Pin) => {
            this.routeController.setRouteAccess(Route.Lobby, true);
            this.clientSocket.pin = pin;
            this.gameHandler.currentGame = game;
            this.router.navigate([Route.Lobby]);
        });

        this.clientSocket.socket.on('invalidPin', (message: string) => {
            this.serverErrorMessage = message;
        });
    }

    containsNonNumeric(control: AbstractControl): null | { containsNonNumeric: boolean } {
        return /^\d+$/.test(control.value) ? null : { containsNonNumeric: true };
    }

    pinContainsNonNumeric(): boolean {
        return this.pinForm.controls['pin'].dirty && this.pinForm.invalid;
    }

    onSubmit(): void {
        this.clientSocket.socket.emit('validatePin', this.pinForm.value.pin);
    }
}
