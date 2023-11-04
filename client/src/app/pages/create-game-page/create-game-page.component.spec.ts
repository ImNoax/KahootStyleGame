import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { ClientSocketServiceMock } from '@app/classes/client-socket-service-mock';
import { SocketMock } from '@app/classes/socket-mock';
import { HeaderComponent } from '@app/components/header/header.component';
// import { snackBarConfiguration } from '@app/constants/snack-bar-configuration';
import { GameMode, Route } from '@app/enums';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { Game } from '@common/game';
import { of } from 'rxjs';
import { CreateGamePageComponent } from './create-game-page.component';

describe('CreateGamePageComponent', () => {
    let component: CreateGamePageComponent;
    let fixture: ComponentFixture<CreateGamePageComponent>;
    let gameHandler: GameHandlingService;
    let routerMock: jasmine.SpyObj<Router>;
    let socketMock: SocketMock;
    let clientSocketServiceMock: ClientSocketServiceMock;
    let nEmittedEvents: number;

    beforeEach(() => {
        routerMock = jasmine.createSpyObj('Router', ['navigate']);
        clientSocketServiceMock = new ClientSocketServiceMock(routerMock);

        TestBed.configureTestingModule({
            declarations: [CreateGamePageComponent, HeaderComponent],
            imports: [HttpClientTestingModule, MatIconModule, MatSnackBarModule, BrowserAnimationsModule],
            providers: [
                { provide: Router, useValue: routerMock },
                { provide: ClientSocketService, useValue: clientSocketServiceMock },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(CreateGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        gameHandler = TestBed.inject(GameHandlingService);
        socketMock = clientSocketServiceMock.socket as unknown as SocketMock;
        spyOn(socketMock, 'emit').and.callThrough();
        socketMock.clientUniqueEvents.clear();
        nEmittedEvents = 0;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should get the list of games', () => {
        const games: Game[] = [];
        const mockGetGames = spyOn(gameHandler, 'getGames').and.returnValue(of(games));

        component.ngOnInit();
        expect(mockGetGames).toHaveBeenCalled();
        expect(component.games).toBeDefined();
    });

    it('selectRow should select a row and set selectedGame', () => {
        const mockGames = [
            { id: '0', title: 'Game 1', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
            { id: '1', title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
        ];

        component.games = mockGames;
        component.selectRow(1);

        expect(component.selectedRowIndex).toBe(1);
        expect(component.selectedGame).toEqual(mockGames[1]);
    });

    it('selectRow should clear selection when index is null', () => {
        component.selectedRowIndex = 1;
        component.selectedGame = { id: '2', title: 'Game 3', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] };

        component.selectRow(null);

        expect(component.selectedRowIndex).toBeNull();
        expect(component.selectedGame).toBeNull();
    });

    it('initializeGame with argument GameMode.Testing should navigate to /game when game is visible and existing', () => {
        const games = [
            { id: '0', title: 'Game 1', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
            { id: '1', title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: true, questions: [] },
        ];
        component.selectedGame = { id: '1', title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: true, questions: [] };

        const mockGetGames = spyOn(gameHandler, 'getGames').and.returnValue(of(games));
        spyOn(gameHandler, 'setCurrentGameId');

        component.initializeGame(GameMode.Testing);

        expect(mockGetGames).toHaveBeenCalled();
        expect(component.games).toBeDefined();

        expect(gameHandler.setCurrentGameId).toHaveBeenCalledWith('1');
        expect(routerMock.navigate).toHaveBeenCalledWith([Route.InGame]);
    });

    it('initializeGame with argument GameMode.RealGame should put isOrganizer to true and send createLobby event', () => {
        const games = [
            { id: '0', title: 'Game 1', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
            { id: '1', title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: true, questions: [] },
        ];
        component.selectedGame = { id: '1', title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: true, questions: [] };

        spyOn(gameHandler, 'getGames').and.returnValue(of(games));
        spyOn(gameHandler, 'setCurrentGameId');

        expect(clientSocketServiceMock.isOrganizer).toBeFalse();
        component.initializeGame(GameMode.RealGame);
        expect(clientSocketServiceMock.isOrganizer).toBeTrue();
        expect(socketMock.emit).toHaveBeenCalledWith('createLobby');
        expect(socketMock.nEmittedEvents).toEqual(++nEmittedEvents);

        component.initializeGame();
        expect(clientSocketServiceMock.isOrganizer).toBeTrue();
        expect(socketMock.emit).toHaveBeenCalledWith('createLobby');
    });

    it('initializeGame should show an alert if game is no longer visible', () => {
        const games = [
            { id: '0', title: 'Game 1', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
            { id: '1', title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
        ];
        component.selectedGame = { id: '1', title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: true, questions: [] };

        const mockGetGames = spyOn(gameHandler, 'getGames').and.returnValue(of(games));

        spyOn(component, 'selectRow');
        spyOn(window, 'alert');

        component.initializeGame(GameMode.Testing);
        expect(mockGetGames).toHaveBeenCalled();
        expect(component.games).toBeDefined();

        expect(window.alert).toHaveBeenCalledWith('Erreur: Jeu Indisponible... Rafraichissement de page.');
        expect(component.selectRow).toHaveBeenCalledWith(null);
    });

    it('should return true when the list is empty', () => {
        const mockGames: Game[] = [];
        component.games = mockGames;
        expect(component.allGamesAreHiddenOrListIsEmpty()).toBeTrue();
    });

    it('should return true when all games are hidden', () => {
        const mockGames = [
            { id: '0', title: 'Game 1', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
            { id: '1', title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
        ];
        component.games = mockGames;

        expect(component.allGamesAreHiddenOrListIsEmpty()).toBeTrue();
    });

    it('should return false when at least one game is visible', () => {
        const mockGames = [
            { id: '0', title: 'Game 1', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
            { id: '1', title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: true, questions: [] },
        ];
        component.games = mockGames;

        expect(component.allGamesAreHiddenOrListIsEmpty()).toBeFalse();
    });

    // it('should handle successfulLobbyCreation event by navigating to the waiting view', () => {
    //     const event = 'successfulLobbyCreation';
    //     const clientSocketSpy = spyOn(clientSocketServiceMock, 'configureOrganisatorLobby');

    //     socketMock.simulateServerEmit(event);
    //     expect(clientSocketSpy).toHaveBeenCalledOnceWith(true);
    //     expect(routerMock.navigate).toHaveBeenCalledWith([Route.Lobby]);
    // });

    // it('should handle failedLobbyCreation event by opening a snackbar', () => {
    //     const event = 'failedLobbyCreation';
    //     const reason = 'reason for failed lobby creation';

    //     spyOn(component.snackBar, 'open');
    //     socketMock.simulateServerEmit(event, reason);
    //     expect(component.snackBar.open).toHaveBeenCalledWith(reason, '', snackBarConfiguration);
    // });
});
