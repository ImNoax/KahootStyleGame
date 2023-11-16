import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Route } from '@app/enums';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { RouteControllerService } from '@app/services/route-controller.service';
import { Game } from '@common/game';
import { Pin, REQUIRED_PIN_LENGTH } from '@common/lobby';
import { BehaviorSubject } from 'rxjs';

const ERROR401 = 401;

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
        const password = prompt('Veuillez entrer le mot de passe:');
        if (password) {
            this.gameHandler.verifyAdminPassword(password).subscribe({
                next: (response) => {
                    if (response) {
                        this.routeController.setRouteAccess(Route.Admin, true);
                        this.router.navigate([Route.Admin]);
                    }
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === ERROR401) {
                        alert('Mot de passe incorrect !');
                    } else {
                        alert('Une erreur est survenue');
                    }
                },
            });
        }
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
