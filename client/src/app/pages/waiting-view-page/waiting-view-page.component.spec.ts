import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { WaitingViewPageComponent } from '@app/pages/waiting-view-page/waiting-view-page.component';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { of } from 'rxjs';

fdescribe('WaitingViewPageComponent', () => {
    let component: WaitingViewPageComponent;
    let fixture: ComponentFixture<WaitingViewPageComponent>;
    let clientSocketServiceMock: jasmine.SpyObj<ClientSocketService>;
    let gameHandlingServiceMock: jasmine.SpyObj<GameHandlingService>;
    let routerMock: jasmine.SpyObj<Router>;

    beforeEach(() => {
        clientSocketServiceMock = jasmine.createSpyObj('ClientSocketService', ['listenForStartGame', 'send', 'configureOrganisatorLobby']);
        gameHandlingServiceMock = jasmine.createSpyObj('GameHandlingService', ['setPlayers']);
        const mockSocket = jasmine.createSpyObj('Socket', ['on', 'emit']);
        clientSocketServiceMock.socket = mockSocket;
        routerMock = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            declarations: [WaitingViewPageComponent, HeaderComponent],
            providers: [
                { provide: ClientSocketService, useValue: clientSocketServiceMock },
                { provide: GameHandlingService, useValue: gameHandlingServiceMock },
                { provide: Router, useValue: routerMock },
            ],
            imports: [MatIconModule],
        });

        fixture = TestBed.createComponent(WaitingViewPageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize configureBaseSocketFeatures and listenForStartGame', () => {
        const spyconfigureBase = spyOn(component, 'configureBaseSocketFeatures');
        clientSocketServiceMock.listenForStartGame.and.returnValue(of(undefined));
        component.ngOnInit();
        expect(spyconfigureBase).toHaveBeenCalled();
    });

    it('should clean up on destroy', () => {
        component.ngOnDestroy();
        expect(clientSocketServiceMock.configureOrganisatorLobby).toHaveBeenCalledWith(false);
    });

    it('should configureBaseSocket', () => {
        component.configureBaseSocketFeatures();
        expect(clientSocketServiceMock.socket.on).toHaveBeenCalledTimes(3);
    });

    it('should ban player', () => {
        const player = { socketId: 'testId', name: 'testName' };
        component.banPlayer(player);
        expect(clientSocketServiceMock.send).toHaveBeenCalledWith('banPlayer', player);
    });

    it('should toggle lobby lock', () => {
        component.toggleLobbyLock();
        expect(clientSocketServiceMock.send).toHaveBeenCalledWith('toggleLock');
    });

    it('should emit start game event', () => {
        component.pin = '1234';
        component.startGameEmit();
        expect(clientSocketServiceMock.socket.emit).toHaveBeenCalledWith('startGame', { pin: '1234' });
    });

    it('should start the game', () => {
        component.startGame();
        expect(component.gameStarted).toBeTruthy();
        expect(routerMock.navigate).toHaveBeenCalledWith(['/game']);
    });

    it('should correctly proxy isNameDefined from clientSocket', () => {
        clientSocketServiceMock.isNameDefined = true;
        expect(component.isNameDefined).toBeTrue();
        clientSocketServiceMock.isNameDefined = false;
        expect(component.isNameDefined).toBeFalse();
    });

    it('should correctly proxy isOrganizer from clientSocket', () => {
        clientSocketServiceMock.isOrganizer = true;
        expect(component.isOrganizer).toBeTrue();
        clientSocketServiceMock.isOrganizer = false;
        expect(component.isOrganizer).toBeFalse();
    });

    it('should correctly proxy playerName from clientSocket', () => {
        const testName = 'testName';
        clientSocketServiceMock.playerName = testName;
        expect(component.playerName).toBe(testName);
    });

    it('should handle "lobbyClosed" event', () => {
        component.configureBaseSocketFeatures();
        routerMock.navigate.and.returnValue(Promise.resolve(true));
        const lobbyClosedCallback = (clientSocketServiceMock.socket.on as jasmine.Spy).calls.argsFor(1)[1]; 
        // Stimule la reception d'une emittion et appel la fonction associer
        
        lobbyClosedCallback();
        expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
        expect(clientSocketServiceMock.send).toHaveBeenCalledWith('leaveLobby');
    });

    it('should handle "lockToggled" event', () => {
        component.configureBaseSocketFeatures();
        (clientSocketServiceMock.socket.on as jasmine.Spy).calls.mostRecent().args[1](true);
        expect(component.isLocked).toBeTrue();
    });

    it('should update properties and call gameHandler.setPlayers when latestPlayerList is emitted', () => {
        const pinMock = '1234';
        const lobbyDetailsMock = {
            isLocked: true,
            players: [
                { socketId: 'id1', name: 'Player1' },
                { socketId: 'id2', name: 'Player2' },
            ],
        };

        component.configureBaseSocketFeatures();
        const latestPlayerListCallback = (clientSocketServiceMock.socket.on as jasmine.Spy).calls.argsFor(0)[1];

        latestPlayerListCallback(pinMock, lobbyDetailsMock);
        expect(component.pin).toBe(pinMock);
        expect(component.isLocked).toBe(lobbyDetailsMock.isLocked);
        expect(component.players).toEqual(lobbyDetailsMock.players);
        expect(gameHandlingServiceMock.setPlayers).toHaveBeenCalledWith(lobbyDetailsMock.players);
    });

    it('should call clientSocket.send and router.navigate when lobbyClosed is emitted', () => {
        component.configureBaseSocketFeatures();
        routerMock.navigate.and.returnValue(Promise.resolve(true));
        const lobbyClosedCallback = (clientSocketServiceMock.socket.on as jasmine.Spy).calls.argsFor(1)[1];
        lobbyClosedCallback();
        expect(clientSocketServiceMock.send).toHaveBeenCalledWith('leaveLobby');
        expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
    });
});
