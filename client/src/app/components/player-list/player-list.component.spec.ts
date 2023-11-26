import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ClientSocketServiceMock } from '@app/classes/client-socket-service-mock';
import { SocketMock } from '@app/classes/socket-mock';
import { ClientSocketService } from '@app/services/client-socket/client-socket.service';
import { Player } from '@common/lobby';
import { PlayerListComponent } from './player-list.component';
describe('PlayerListComponent', () => {
    let component: PlayerListComponent;
    let fixture: ComponentFixture<PlayerListComponent>;
    let socketMock: SocketMock;
    let clientSocketServiceMock: ClientSocketServiceMock;

    const lobbyDetails = {
        isLocked: true,
        players: [
            {
                socketId: 'id1',
                name: 'player1',
                answerSubmitted: true,
                score: 0,
                bonusTimes: 0,
                isStillInGame: true,
                isAbleToChat: true,
            },
            {
                socketId: 'id2',
                name: 'player2',
                answerSubmitted: true,
                score: 0,
                bonusTimes: 0,
                isStillInGame: true,
                isAbleToChat: true,
            },
        ],
        bannedNames: [],
        game: {},
    };

    beforeEach(() => {
        clientSocketServiceMock = new ClientSocketServiceMock();
        TestBed.configureTestingModule({
            declarations: [PlayerListComponent],
            imports: [MatSnackBarModule],
            providers: [{ provide: ClientSocketService, useValue: clientSocketServiceMock }],
        });
        fixture = TestBed.createComponent(PlayerListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        socketMock = clientSocketServiceMock.socket as unknown as SocketMock;
        spyOn(socketMock, 'emit').and.callThrough();
        socketMock.clientUniqueEvents.clear();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should set the base socket features on ngOnInit', () => {
        const configSpy = spyOn(component, 'configureBaseSocketFeatures');
        component.ngOnInit();
        expect(configSpy).toHaveBeenCalled();
        expect(socketMock.emit).toHaveBeenCalledWith('getPlayers');
    });

    it('should set the list of players when the list is empty', () => {
        component.players = [];
        const lobbyDetailsMock = lobbyDetails;
        const event = 'latestPlayerList';
        socketMock.simulateServerEmit(event, lobbyDetailsMock);
        expect(component.players).toBe(lobbyDetailsMock.players);
    });
    it('should update the score when event from server', () => {
        component.players = [
            {
                socketId: 'id1',
                name: 'player1',
                answerSubmitted: true,
                score: 0,
                bonusTimes: 0,
                isStillInGame: true,
                isAbleToChat: true,
            },
            {
                socketId: 'id2',
                name: 'player2',
                answerSubmitted: true,
                score: 0,
                bonusTimes: 0,
                isStillInGame: true,
                isAbleToChat: true,
            },
        ];
        const event = 'scoreUpdated';
        const playerToUpdateMock = {
            socketId: 'id1',
            name: 'player1',
            answerSubmitted: true,
            score: 50,
            bonusTimes: 0,
            isStillInGame: true,
            isAbleToChat: true,
        };
        socketMock.simulateServerEmit(event, playerToUpdateMock);
        expect(component.players[0].score).toBe(playerToUpdateMock.score);
        expect(component.players[1].score).toBe(0);
    });
    it('should change the property of players who left', () => {
        component.players = lobbyDetails.players;
        const event = 'latestPlayerList';
        const playerListMock = [
            {
                socketId: 'id1',
                name: 'player1',
                answerSubmitted: true,
                score: 0,
                bonusTimes: 0,
                isStillInGame: true,
                isAbleToChat: true,
            },
        ];
        const lobbyDetailsMock = lobbyDetails;
        lobbyDetailsMock.players = playerListMock;

        socketMock.simulateServerEmit(event, lobbyDetailsMock);
        expect(component.players.length).toBe(2);
        expect(component.players[0].isStillInGame).toBeTrue();
        expect(component.players[1].isStillInGame).toBeFalse();
    });

    it('should remove listeners on component destruction', () => {
        spyOn(socketMock, 'removeAllListeners');
        component.ngOnDestroy();
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('latestPlayerList');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('scoreUpdated');
    });

    it('should toggle mute status and emit toggleMute event on toggleMute()', () => {
        const player: Player = {
            socketId: 'testSocketId',
            name: 'TestPlayer',
            answerSubmitted: false,
            score: 0,
            isStillInGame: true,
            isAbleToChat: true,
            bonusTimes: 0,
        };

        component.toggleMute(player);

        expect(player.isAbleToChat).toBeFalse();
        expect(clientSocketServiceMock.socket.emit).toHaveBeenCalledWith('toggleMute', player);
    });
});
