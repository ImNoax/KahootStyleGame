import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { ClientSocketServiceMock } from '@app/classes/client-socket-service-mock';
import { SocketMock } from '@app/classes/socket-mock';
import { Route } from '@app/enums';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { of, throwError } from 'rxjs';

describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let gameHandlingServiceMock: jasmine.SpyObj<GameHandlingService>;
    let routerMock: jasmine.SpyObj<Router>;
    let socketMock: SocketMock;
    let clientSocketServiceMock: ClientSocketServiceMock;
    let nEmittedEvents: number;

    beforeEach(async () => {
        gameHandlingServiceMock = jasmine.createSpyObj('GameHandlingService', ['verifyAdminPassword', 'setCurrentGameId']);
        routerMock = jasmine.createSpyObj('Router', ['navigate']);
        clientSocketServiceMock = new ClientSocketServiceMock(routerMock);

        TestBed.configureTestingModule({
            declarations: [MainPageComponent],
            imports: [MatSnackBarModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, BrowserAnimationsModule],
            providers: [
                { provide: GameHandlingService, useValue: gameHandlingServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: ClientSocketService, useValue: clientSocketServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        socketMock = clientSocketServiceMock.socket as unknown as SocketMock;
        socketMock = clientSocketServiceMock.socket as unknown as SocketMock;
        spyOn(socketMock, 'emit').and.callThrough();
        socketMock.clientUniqueEvents.clear();
        nEmittedEvents = 0;
    });

    beforeEach(() => {
        spyOn(window, 'prompt').and.returnValue('testPassword');
        spyOn(window, 'alert').and.stub();
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should navigate to admin route when password is correct', fakeAsync(() => {
        gameHandlingServiceMock.verifyAdminPassword.and.returnValue(of(true));
        component.adminLogin();
        tick();
        expect(routerMock.navigate).toHaveBeenCalledWith([Route.Admin]);
    }));

    it('should alert when password is incorrect', fakeAsync(() => {
        gameHandlingServiceMock.verifyAdminPassword.and.returnValue(throwError(() => ({ status: 401 })));
        component.adminLogin();
        tick();
        expect(window.alert).toHaveBeenCalledWith('Mot de passe incorrect !');
    }));

    it('should alert on other errors', fakeAsync(() => {
        gameHandlingServiceMock.verifyAdminPassword.and.returnValue(throwError(() => ({ status: 500 })));
        component.adminLogin();
        tick();
        expect(window.alert).toHaveBeenCalledWith('Une erreur est survenue');
    }));

    // it("should handle 'successfulLobbyConnection' event by navigating to the waiting view", () => {
    //     const gameId = '0';
    //     expect(clientSocketServiceMock.canAccessLobby).toBeFalse();

    //     socketMock.simulateServerEmit('successfulLobbyConnection', gameId);
    //     expect(gameHandlingServiceMock.setCurrentGameId).toHaveBeenCalledWith(gameId);
    //     expect(clientSocketServiceMock.canAccessLobby).toBeTrue();
    //     expect(routerMock.navigate).toHaveBeenCalledWith([Route.Lobby]);
    // });

    it("should handle 'failedLobbyConnection' event by receiving an error from the server", () => {
        const serverMessage = 'erreur';
        socketMock.simulateServerEmit('failedLobbyConnection', serverMessage);
        expect(component.serverErrorMessage).toEqual(serverMessage);
    });

    it('containsNonNumeric validator should check if a form control contains non-numeric characters', () => {
        const formControl: FormControl = new FormControl('');

        expect(component.containsNonNumeric(formControl)).toEqual({ containsNonNumeric: true });
        formControl.setValue('a1a2');
        expect(component.containsNonNumeric(formControl)).toEqual({ containsNonNumeric: true });
        formControl.setValue('1341');
        expect(component.containsNonNumeric(formControl)).toBeNull();
    });

    it('pinContainsNonNumeric should return true if the pin contains non-numeric character', () => {
        const invalidPin = '1a2.';

        component.pinForm.controls['pin'].setValue(invalidPin);
        expect(component.pinContainsNonNumeric()).toBeFalse();
        component.pinForm.controls['pin'].markAsDirty();
        expect(component.pinContainsNonNumeric()).toBeTrue();
    });

    it("pinContainsNonNumeric should return false if the pin doesn't contain non-numeric character", () => {
        const validPin = '1234';

        component.pinForm.controls['pin'].setValue(validPin);
        expect(component.pinContainsNonNumeric()).toBeFalse();

        component.pinForm.controls['pin'].markAsDirty();
        expect(component.pinContainsNonNumeric()).toBeFalse();
    });

    it('should return true if the form contains 4 characters', () => {
        const validPin = '1234';
        component.pinForm.controls['pin'].setValue(validPin);
        expect(component.pinForm.valid).toBeTrue();
    });

    it('should return false if the form contains less than 4 characters', () => {
        const invalidPin = '12.';
        component.pinForm.controls['pin'].setValue(invalidPin);
        expect(component.pinForm.valid).toBeFalse();
    });

    it('onSubmit should send joinLobby event through the ClientSocketService', () => {
        const event = 'joinLobby';
        const pin = '1234';
        component.pinForm.value.pin = pin;

        component.onSubmit();
        expect(socketMock.emit).toHaveBeenCalledWith(event, pin);
        expect(socketMock.nEmittedEvents).toEqual(++nEmittedEvents);
    });
});
