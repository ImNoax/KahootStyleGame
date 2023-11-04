// import { ComponentFixture, TestBed } from '@angular/core/testing';
// import { ReactiveFormsModule } from '@angular/forms';
// import { MatIconModule } from '@angular/material/icon';
// import { MatInputModule } from '@angular/material/input';
// import { MatSnackBar, MatSnackBarModule, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
// import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { Router } from '@angular/router';
// import { ClientSocketServiceMock } from '@app/classes/client-socket-service-mock';
// import { SocketMock } from '@app/classes/socket-mock';
// import { HeaderComponent } from '@app/components/header/header.component';
// <<<<<<< HEAD
// import { NameDefinitionComponent } from '@app/components/name-definition/name-definition.component';
// import { snackBarConfiguration } from '@app/constants';
// import { Route } from '@app/enums';
// import { ClientSocketService } from '@app/services/client-socket.service';
// import { Observable } from 'rxjs';
// import { WaitingViewPageComponent } from './waiting-view-page.component';
// =======
// import { WaitingViewPageComponent } from '@app/pages/waiting-view-page/waiting-view-page.component';
// import { ClientSocketService } from '@app/services/client-socket.service';
// import { GameHandlingService } from '@app/services/game-handling.service';
// import { of } from 'rxjs';
// >>>>>>> dev

// fdescribe('WaitingViewPageComponent', () => {
//     let component: WaitingViewPageComponent;
//     let fixture: ComponentFixture<WaitingViewPageComponent>;
// <<<<<<< HEAD
//     let routerMock: jasmine.SpyObj<Router>;
//     let snackBarMock: jasmine.SpyObj<MatSnackBar>;
//     let socketMock: SocketMock;
//     let clientSocketServiceMock: ClientSocketServiceMock;
//     let nEmittedEvents: number;

//     beforeEach(() => {
//         routerMock = jasmine.createSpyObj('Router', ['navigate']);
//         snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
//         clientSocketServiceMock = new ClientSocketServiceMock(routerMock);
// =======
//     let clientSocketServiceMock: jasmine.SpyObj<ClientSocketService>;
//     let gameHandlingServiceMock: jasmine.SpyObj<GameHandlingService>;
//     let routerMock: jasmine.SpyObj<Router>;

//     beforeEach(() => {
//         clientSocketServiceMock = jasmine.createSpyObj('ClientSocketService', ['listenForStartGame', 'send', 'configureOrganisatorLobby']);
//         gameHandlingServiceMock = jasmine.createSpyObj('GameHandlingService', ['setPlayers']);
//         const mockSocket = jasmine.createSpyObj('Socket', ['on', 'emit']);
//         clientSocketServiceMock.socket = mockSocket;
//         routerMock = jasmine.createSpyObj('Router', ['navigate']);
// >>>>>>> dev

//         TestBed.configureTestingModule({
//             declarations: [WaitingViewPageComponent, HeaderComponent, NameDefinitionComponent],
//             imports: [MatIconModule, MatSnackBarModule, ReactiveFormsModule, MatInputModule, BrowserAnimationsModule],
//             providers: [
// <<<<<<< HEAD
//                 HttpClient,
//                 HttpHandler,
//                 { provide: Router, useValue: routerMock },
//                 { provide: ClientSocketService, useValue: clientSocketServiceMock },
//                 { provide: MatSnackBar, useValue: snackBarMock },
// =======
//                 { provide: ClientSocketService, useValue: clientSocketServiceMock },
//                 { provide: GameHandlingService, useValue: gameHandlingServiceMock },
//                 { provide: Router, useValue: routerMock },
// >>>>>>> dev
//             ],
//         });

//         fixture = TestBed.createComponent(WaitingViewPageComponent);
//         component = fixture.componentInstance;
// <<<<<<< HEAD
//         fixture.detectChanges();

//         socketMock = clientSocketServiceMock.socket as unknown as SocketMock;
//         spyOn(socketMock, 'emit').and.callThrough();
//         socketMock.clientUniqueEvents.clear();
//         nEmittedEvents = 0;
// =======
// >>>>>>> dev
//     });

//     it('should create', () => {
//         expect(component).toBeTruthy();
//     });

// <<<<<<< HEAD
//     it('isNameDefined should get isNameDefined from the ClientSocketService', () => {
//         expect(component).toBeTruthy();
//         expect(component.isNameDefined).toEqual(clientSocketServiceMock.isNameDefined);
//     });

//     it('isOrganizer should get isOrganizer from the ClientSocketService', () => {
//         expect(component).toBeTruthy();
//         expect(component.isOrganizer).toEqual(clientSocketServiceMock.isOrganizer);
//     });

//     it('playerName should get playerName from the ClientSocketService', () => {
//         expect(component).toBeTruthy();
//         expect(component.playerName).toEqual(clientSocketServiceMock.playerName);
//     });

//     it("should handle lobbyClosed event by navigating to /home and opening a snackbar with no clickable action if reason is 'NO HOST '", () => {
//         const event = 'lobbyClosed';
//         const message = 'Closed due to no host';
//         const reason = 'NO HOST';

//         socketMock.simulateServerEmit(event, reason, message);
//         expect(socketMock.emit).toHaveBeenCalledWith('leaveLobby');
//         expect(socketMock.nEmittedEvents).toEqual(++nEmittedEvents);
//         expect(routerMock.navigate).toHaveBeenCalledWith([Route.MainMenu]);
//         expect(snackBarMock.open).toHaveBeenCalledWith(message, '', snackBarConfiguration);
//     });

//     it("should handle lobbyClosed event by opening a snackBar with a clickable action if reason is 'BAN'", () => {
//         const event = 'lobbyClosed';
//         const message = 'You have been banned';
//         const reason = 'BAN';
//         const observableMock: Observable<void> = new Observable((subscriber) => subscriber.next());
//         component.pin = '1234';

//         routerMock.navigate.and.returnValue(Promise.resolve(true));
//         snackBarMock.open.and.returnValue({
//             onAction: () => observableMock,
//         } as MatSnackBarRef<TextOnlySnackBar>);

//         socketMock.simulateServerEmit(event, reason, message);
//         expect(socketMock.emit).toHaveBeenCalledWith('leaveLobby');
//         expect(snackBarMock.open).toHaveBeenCalledWith(message, 'Rentrer', snackBarConfiguration);
//         expect(socketMock.emit).toHaveBeenCalledWith('joinLobby', component.pin);
//     });

//     it('notifyClipboardCopy should open a snackbar', () => {
//         component.notifyClipboardCopy();
//         expect(snackBarMock.open).toHaveBeenCalledWith('PIN copié!', '', snackBarConfiguration);
// =======
//     it('should initialize configureBaseSocketFeatures and listenForStartGame', () => {
//         const spyconfigureBase = spyOn(component, 'configureBaseSocketFeatures');
//         clientSocketServiceMock.listenForStartGame.and.returnValue(of(undefined));
//         component.ngOnInit();
//         expect(spyconfigureBase).toHaveBeenCalled();
//     });

//     it('should clean up on destroy', () => {
//         component.ngOnDestroy();
//         expect(clientSocketServiceMock.configureOrganisatorLobby).toHaveBeenCalledWith(false);
//     });

//     it('should configureBaseSocket', () => {
//         component.configureBaseSocketFeatures();
//         expect(clientSocketServiceMock.socket.on).toHaveBeenCalledTimes(3);
//     });

//     it('should ban player', () => {
//         const player = { socketId: 'testId', name: 'testName' };
//         component.banPlayer(player);
//         expect(clientSocketServiceMock.send).toHaveBeenCalledWith('banPlayer', player);
//     });

//     it('should toggle lobby lock', () => {
//         component.toggleLobbyLock();
//         expect(clientSocketServiceMock.send).toHaveBeenCalledWith('toggleLock');
//     });

//     it('should emit start game event', () => {
//         component.pin = '1234';
//         component.startGameEmit();
//         expect(clientSocketServiceMock.socket.emit).toHaveBeenCalledWith('startGame', { pin: '1234' });
//     });

//     it('should start the game', () => {
//         component.startGame();
//         expect(component.gameStarted).toBeTruthy();
//         expect(routerMock.navigate).toHaveBeenCalledWith([Route.InGame]);
//     });

//     it('should correctly proxy isNameDefined from clientSocket', () => {
//         clientSocketServiceMock.isNameDefined = true;
//         expect(component.isNameDefined).toBeTrue();
//         clientSocketServiceMock.isNameDefined = false;
//         expect(component.isNameDefined).toBeFalse();
//     });

//     it('should correctly proxy isOrganizer from clientSocket', () => {
//         clientSocketServiceMock.isOrganizer = true;
//         expect(component.isOrganizer).toBeTrue();
//         clientSocketServiceMock.isOrganizer = false;
//         expect(component.isOrganizer).toBeFalse();
//     });

//     it('should correctly proxy playerName from clientSocket', () => {
//         const testName = 'testName';
//         clientSocketServiceMock.playerName = testName;
//         expect(component.playerName).toBe(testName);
//     });

//     it('should handle "lobbyClosed" event', () => {
//         component.configureBaseSocketFeatures();
//         routerMock.navigate.and.returnValue(Promise.resolve(true));
//         const lobbyClosedCallback = (clientSocketServiceMock.socket.on as jasmine.Spy).calls.argsFor(1)[1];
//         // Stimule la reception d'une emittion et appel la fonction associer

//         lobbyClosedCallback();
//         expect(routerMock.navigate).toHaveBeenCalledWith([Route.MainMenu]);
//         expect(clientSocketServiceMock.send).toHaveBeenCalledWith('leaveLobby');
//     });

//     it('should handle "lockToggled" event', () => {
//         component.configureBaseSocketFeatures();
//         (clientSocketServiceMock.socket.on as jasmine.Spy).calls.mostRecent().args[1](true);
//         expect(component.isLocked).toBeTrue();
//     });

//     it('should update properties and call gameHandler.setPlayers when latestPlayerList is emitted', () => {
//         const pinMock = '1234';
//         const lobbyDetailsMock = {
//             isLocked: true,
//             players: [
//                 { socketId: 'id1', name: 'Player1' },
//                 { socketId: 'id2', name: 'Player2' },
//             ],
//         };

//         component.configureBaseSocketFeatures();
//         const latestPlayerListCallback = (clientSocketServiceMock.socket.on as jasmine.Spy).calls.argsFor(0)[1];

//         latestPlayerListCallback(pinMock, lobbyDetailsMock);
//         expect(component.pin).toBe(pinMock);
//         expect(component.isLocked).toBe(lobbyDetailsMock.isLocked);
//         expect(component.players).toEqual(lobbyDetailsMock.players);
//         expect(gameHandlingServiceMock.setPlayers).toHaveBeenCalledWith(lobbyDetailsMock.players);
//     });

//     it('should call clientSocket.send and router.navigate when lobbyClosed is emitted', () => {
//         component.configureBaseSocketFeatures();
//         routerMock.navigate.and.returnValue(Promise.resolve(true));
//         const lobbyClosedCallback = (clientSocketServiceMock.socket.on as jasmine.Spy).calls.argsFor(1)[1];
//         lobbyClosedCallback();
//         expect(clientSocketServiceMock.send).toHaveBeenCalledWith('leaveLobby');
//         expect(routerMock.navigate).toHaveBeenCalledWith([Route.MainMenu]);
// >>>>>>> dev
//     });
// });
