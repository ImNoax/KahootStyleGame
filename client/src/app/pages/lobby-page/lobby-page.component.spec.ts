import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, RouterModule, convertToParamMap } from '@angular/router';
import { ClientSocketServiceMock } from '@app/classes/client-socket-service-mock';
import { SocketMock } from '@app/classes/socket-mock';
import { HeaderComponent } from '@app/components/header/header.component';
import { NameDefinitionComponent } from '@app/components/name-definition/name-definition.component';
import { snackBarConfiguration } from '@app/constants';
import { snackBarErrorConfiguration } from '@app/constants/snack-bar-configuration';
import { Route } from '@app/enums';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { RouteControllerService } from '@app/services/route-controller.service';
import { TimerService } from '@app/services/timer.service';
import { of } from 'rxjs';
import { LobbyPageComponent } from './lobby-page.component';

describe('LobbyPageComponent', () => {
    let component: LobbyPageComponent;
    let fixture: ComponentFixture<LobbyPageComponent>;
    let routerMock: jasmine.SpyObj<Router>;
    let snackBarMock: jasmine.SpyObj<MatSnackBar>;
    let socketMock: SocketMock;
    let clientSocketServiceMock: ClientSocketServiceMock;
    let timerServiceMock: jasmine.SpyObj<TimerService>;
    let gameHandlingServiceMock: jasmine.SpyObj<GameHandlingService>;
    let routeControllerMock: jasmine.SpyObj<RouteControllerService>;
    let nEmittedEvents: number;

    beforeEach(() => {
        routerMock = jasmine.createSpyObj('Router', ['navigate']);
        snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
        timerServiceMock = jasmine.createSpyObj('TimerService', ['reset', 'startCountDown']);
        gameHandlingServiceMock = jasmine.createSpyObj('GameHandlingService', ['setPlayers']);
        routeControllerMock = jasmine.createSpyObj('RouteControllerService', ['setRouteAccess']);
        clientSocketServiceMock = new ClientSocketServiceMock();

        TestBed.configureTestingModule({
            declarations: [LobbyPageComponent, HeaderComponent, NameDefinitionComponent],
            imports: [
                HttpClientTestingModule,
                MatIconModule,
                MatSnackBarModule,
                ReactiveFormsModule,
                MatInputModule,
                BrowserAnimationsModule,
                RouterModule,
            ],
            providers: [
                { provide: Router, useValue: routerMock },
                { provide: ClientSocketService, useValue: clientSocketServiceMock },
                { provide: MatSnackBar, useValue: snackBarMock },
                { provide: TimerService, useValue: timerServiceMock },
                { provide: GameHandlingService, useValue: gameHandlingServiceMock },
                { provide: RouteControllerService, useValue: routeControllerMock },
                {
                    provide: ActivatedRoute,
                    useValue: {
                        queryParams: of(
                            convertToParamMap({
                                search: '',
                            }),
                        ),
                    },
                },
            ],
        });

        fixture = TestBed.createComponent(LobbyPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();

        socketMock = clientSocketServiceMock.socket as unknown as SocketMock;
        spyOn(socketMock, 'emit').and.callThrough();
        socketMock.clientUniqueEvents.clear();
        nEmittedEvents = 0;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('isOrganizer getter should get isOrganizer from the ClientSocketService', () => {
        clientSocketServiceMock.isOrganizer = true;
        expect(component.isOrganizer).toEqual(clientSocketServiceMock.isOrganizer);
    });

    it('playerName getter should get playerName from the ClientSocketService', () => {
        clientSocketServiceMock.playerName = 'player';
        expect(component.playerName).toEqual(clientSocketServiceMock.playerName);
    });

    it('pin getter should get pin from the ClientSocketService', () => {
        clientSocketServiceMock.pin = '1234';
        expect(component.pin).toEqual(clientSocketServiceMock.pin);
    });

    it('count getter should get count from the TimerService', () => {
        timerServiceMock.count = 10;
        expect(component.count).toEqual(timerServiceMock.count);
    });

    it('should call configureBaseSocketFeatures and emit getPlayers event on component initialization', () => {
        spyOn(component, 'configureBaseSocketFeatures');
        component.ngOnInit();
        expect(component.configureBaseSocketFeatures).toHaveBeenCalled();
        expect(socketMock.emit).toHaveBeenCalledWith('getPlayers');
        expect(socketMock.nEmittedEvents).toEqual(++nEmittedEvents);
    });

    it('should remove all listeners on component destruction', () => {
        spyOn(socketMock, 'removeAllListeners');
        component.ngOnDestroy();
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('latestPlayerList');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('lockToggled');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('countDownEnd');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('noPlayers');
    });

    it('should reset timer and call setRouteAccess from RouteControllerService on component destruction', () => {
        component.ngOnDestroy();
        expect(timerServiceMock.reset).toHaveBeenCalled();
        expect(routeControllerMock.setRouteAccess).toHaveBeenCalledWith(Route.Lobby, false);
    });

    it('should not reset player information if gameStarted is true on component destruction', () => {
        spyOn(clientSocketServiceMock, 'resetPlayerInfo');
        component.gameStarted = true;
        component.ngOnDestroy();
        expect(clientSocketServiceMock.resetPlayerInfo).not.toHaveBeenCalled();
    });

    it('should reset player information if gameStarted is false on component destruction', () => {
        spyOn(clientSocketServiceMock, 'resetPlayerInfo');
        component.gameStarted = false;
        component.ngOnDestroy();
        expect(clientSocketServiceMock.resetPlayerInfo).toHaveBeenCalled();
    });

    it('should handle latestPlayerList event by getting details from lobbyDetails argument and call setPlayers from GameHandlingService', () => {
        const lobbyDetailsMock = {
            isLocked: true,
            players: [{ socketId: '', name: '' }],
        };
        component.isLocked = false;
        component.players = [];

        socketMock.simulateServerEmit('latestPlayerList', lobbyDetailsMock);
        expect(component.isLocked).toEqual(lobbyDetailsMock.isLocked);
        expect(component.players).toEqual(lobbyDetailsMock.players);
        expect(gameHandlingServiceMock.setPlayers).toHaveBeenCalledWith(component.players);
    });

    it('should handle lockToggled event by assigning isLocked argument to isLocked property', () => {
        component.isLocked = false;
        socketMock.simulateServerEmit('lockToggled', true);
        expect(component.isLocked).toBeTrue();
    });

    it('should handle countDownEnd event by calling startGame', () => {
        spyOn(component, 'startGame');

        socketMock.simulateServerEmit('countDownEnd');
        expect(component.startGame).toHaveBeenCalled();
    });

    it('should handle noPlayers event by resetting the timer if countDownStarted is true', () => {
        spyOn(component, 'toggleLobbyLock');
        component.countDownStarted = true;

        socketMock.simulateServerEmit('noPlayers');
        expect(timerServiceMock.reset).toHaveBeenCalled();
        expect(component.countDownStarted).toBeFalse();
    });

    it('should handle noPlayers event by calling toggleLobbyLock and opening a snack bar if countDownStarted is true', () => {
        spyOn(component, 'toggleLobbyLock');
        component.countDownStarted = true;

        socketMock.simulateServerEmit('noPlayers');
        expect(component.toggleLobbyLock).toHaveBeenCalled();
        expect(snackBarMock.open).toHaveBeenCalledWith("Tous les joueurs ont quitté la salle d'attente.", '', snackBarErrorConfiguration);
    });

    it('should handle noPlayers event by doing nothing if countDownStarted is false', () => {
        spyOn(component, 'toggleLobbyLock');
        component.countDownStarted = false;

        socketMock.simulateServerEmit('noPlayers');
        expect(timerServiceMock.reset).not.toHaveBeenCalled();
        expect(component.countDownStarted).toBeFalse();
        expect(component.toggleLobbyLock).not.toHaveBeenCalled();
        expect(snackBarMock.open).not.toHaveBeenCalled();
    });

    it('banPlayer should emit banPlayer event with the player to ban', () => {
        const bannedPlayer = { socketId: '', name: '' };
        component.banPlayer(bannedPlayer);
        expect(socketMock.emit).toHaveBeenCalledWith('banPlayer', bannedPlayer);
        expect(socketMock.nEmittedEvents).toEqual(++nEmittedEvents);
    });

    it('toggleLobbyLock should emit toggleLock event', () => {
        component.toggleLobbyLock();
        expect(socketMock.emit).toHaveBeenCalledWith('toggleLock');
        expect(socketMock.nEmittedEvents).toEqual(++nEmittedEvents);
    });

    it('startGameEmit should set countDownStarted to true and call startCountDown', () => {
        const initialCount = 5;
        component.countDownStarted = false;
        component.startGameEmit();
        expect(component.countDownStarted).toBeTrue();
        expect(timerServiceMock.startCountDown).toHaveBeenCalledWith(initialCount);
    });

    it('startGame should navigate to in-game page if playerName is defined', () => {
        clientSocketServiceMock.playerName = 'Nom';
        component.gameStarted = false;

        component.startGame();
        expect(component.gameStarted).toBeTrue();
        expect(routeControllerMock.setRouteAccess).toHaveBeenCalledWith(Route.InGame, true);
        expect(routerMock.navigate).toHaveBeenCalledWith([Route.InGame]);
    });

    it('startGame should navigate to main menu and open a snack bar if playerName is empty', () => {
        clientSocketServiceMock.playerName = '';
        component.gameStarted = false;

        component.startGame();
        expect(component.gameStarted).toBeFalse();
        expect(routerMock.navigate).toHaveBeenCalledWith([Route.MainMenu]);
        expect(snackBarMock.open).toHaveBeenCalledWith(
            "Votre nom de joueur n'a pas été défini avant le début de la partie",
            '',
            snackBarErrorConfiguration,
        );
    });

    it('notifyClipboardCopy should open a snackbar', () => {
        component.notifyClipboardCopy();
        expect(snackBarMock.open).toHaveBeenCalledWith('PIN copié!', '', snackBarConfiguration);
    });
});