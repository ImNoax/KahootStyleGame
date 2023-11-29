import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientSocketServiceMock } from '@app/classes/client-socket-service-mock';
import { SocketMock } from '@app/classes/socket-mock';
import { HistogramComponent } from '@app/components/histogram/histogram.component';
import { ClientSocketService } from '@app/services/client-socket/client-socket.service';
import { PlayerColor } from '@common/lobby';
import { EndResultComponent } from './end-result.component';
describe('EndResultComponent', () => {
    let component: EndResultComponent;
    let fixture: ComponentFixture<EndResultComponent>;
    let clientSocketServiceMock: ClientSocketServiceMock;
    let socketMock: SocketMock;
    // let nEmittedEvents: number;

    beforeEach(() => {
        clientSocketServiceMock = new ClientSocketServiceMock();

        TestBed.configureTestingModule({
            imports: [HttpClientModule],
            declarations: [EndResultComponent, HistogramComponent],
            providers: [{ provide: ClientSocketService, useValue: clientSocketServiceMock }],
        }).compileComponents();

        fixture = TestBed.createComponent(EndResultComponent);
        component = fixture.componentInstance;
        socketMock = clientSocketServiceMock.socket as unknown as SocketMock;
        spyOn(socketMock, 'emit').and.callThrough();
        socketMock.clientUniqueEvents.clear();
        // nEmittedEvents = 0;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    /* it('should call configureBaseSocketFeatures and emit getPlayers event on component initialization', () => {
        spyOn(component, 'configureBaseSocketFeatures');
        component.ngOnInit();
        expect(component.configureBaseSocketFeatures).toHaveBeenCalled();
        expect(socketMock.emit).toHaveBeenCalledWith('getPlayers');
        expect(socketMock.nEmittedEvents).toEqual(++nEmittedEvents);
    });*/

    it('should remove "latestPlayerList" listener on component destruction', () => {
        socketMock.removeAllListeners = jasmine.createSpy('removeAllListeners');
        component.ngOnDestroy();
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('latestPlayerList');
    });

    it('should handle "latestPlayerList" event by assigning lobbyDetails.players to players member', () => {
        const testLobby = {
            players: [
                {
                    socketId: 'testSocketID',
                    name: 'testName',
                    answerSubmitted: true,
                    score: 1,
                    bonusTimes: 1,
                    activityState: PlayerColor.Red,
                    isAbleToChat: true,
                },
            ],
        };

        component.configureBaseSocketFeatures();
        socketMock.simulateServerEmit('latestPlayerList', testLobby);
        expect(component.players).toEqual(testLobby.players);
    });
});
