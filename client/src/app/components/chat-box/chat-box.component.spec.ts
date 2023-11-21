import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ClientSocketServiceMock } from '@app/classes/client-socket-service-mock';
import { SocketMock } from '@app/classes/socket-mock';
import { snackBarNormalConfiguration } from '@app/constants/snack-bar-configuration';
import { ClientSocketService } from '@app/services/client-socket.service';
import { Message } from '@common/lobby';
import { ChatBoxComponent } from './chat-box.component';
describe('ChatBoxComponent', () => {
    let component: ChatBoxComponent;
    let fixture: ComponentFixture<ChatBoxComponent>;
    let socketMock: SocketMock;
    let clientSocketServiceMock: ClientSocketServiceMock;
    let snackBarMock: jasmine.SpyObj<MatSnackBar>;
    beforeEach(() => {
        clientSocketServiceMock = new ClientSocketServiceMock();
        snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
        TestBed.configureTestingModule({
            declarations: [ChatBoxComponent],
            imports: [HttpClientModule, FormsModule, MatSnackBarModule],
            providers: [
                { provide: ClientSocketService, useValue: clientSocketServiceMock },
                { provide: MatSnackBar, useValue: snackBarMock },
            ],
        });
        fixture = TestBed.createComponent(ChatBoxComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        socketMock = clientSocketServiceMock.socket as unknown as SocketMock;
        spyOn(socketMock, 'emit').and.callThrough();
        socketMock.clientUniqueEvents.clear();
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should get current chat on init ', () => {
        const configSpy = spyOn(component, 'configureBaseSocketFeatures');
        component.ngOnInit();
        expect(configSpy).toHaveBeenCalled();
        expect(socketMock.emit).toHaveBeenCalledWith('getChat');
    });

    it('should remove listeners on component destruction', () => {
        spyOn(socketMock, 'removeAllListeners');
        component.ngOnDestroy();
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('messageReceived');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('PlayerMuted');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('PlayerUnmuted');
    });

    it('should update chat when a new message is received', () => {
        component.chat = [];
        const event = 'messageReceived';
        const chatMock: Message[] = [{ sender: 'sender1', content: 'content1', time: new Date('date1') }];

        socketMock.simulateServerEmit(event, chatMock);
        expect(component.chat[0].sender).toBe(chatMock[0].sender);
        expect(component.chat[0].content).toBe(chatMock[0].content);
        expect(component.chat[0].time).toEqual(chatMock[0].time);
    });
    it('should notify the player when he is muted and unmuted', () => {
        const muteEvent = 'PlayerMuted';
        const unmuteEvent = 'PlayerUnmuted';
        socketMock.simulateServerEmit(muteEvent);
        expect(snackBarMock.open).toHaveBeenCalledWith('Vous ne pouvez plus clavarder ❌', '', snackBarNormalConfiguration);
        socketMock.simulateServerEmit(unmuteEvent);
        expect(snackBarMock.open).toHaveBeenCalledWith('Vous pouvez maintenant clavarder ✅', '', snackBarNormalConfiguration);
    });
    it('should emit message on sendMessage ', () => {
        component.newMessage = 'Test';
        component.sendMessage();
        expect(socketMock.emit).toHaveBeenCalledWith('chatMessage', jasmine.any(Object));
    });
});
