import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { of } from 'rxjs';

describe('ChatBoxComponent', () => {
    let component: ChatBoxComponent;
    let fixture: ComponentFixture<ChatBoxComponent>;
    let clientSocketServiceMock: jasmine.SpyObj<ClientSocketService>;
    let gameHandlingServiceMock: jasmine.SpyObj<GameHandlingService>;

    beforeEach(() => {
        clientSocketServiceMock = jasmine.createSpyObj('ClientSocketService', ['listenToMessageReceived', 'socket']);
        gameHandlingServiceMock = jasmine.createSpyObj('GameHandlingService', ['getPlayerNameBySocketId']);

        TestBed.configureTestingModule({
            declarations: [ChatBoxComponent],
            providers: [
                { provide: ClientSocketService, useValue: clientSocketServiceMock },
                { provide: GameHandlingService, useValue: gameHandlingServiceMock }
            ]
        });
        fixture = TestBed.createComponent(ChatBoxComponent);
        component = fixture.componentInstance;
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should emit message on sendMessage ', () => {
        component.newMessage = 'Test';
        clientSocketServiceMock.socket.emit = jasmine.createSpy();
        component.sendMessage();
        expect(clientSocketServiceMock.socket.emit).toHaveBeenCalledWith('chatMessage', jasmine.any(Object));
    });

    it('should update messages when message is received', () => {
        const testMessage = {
            sender: 'TestSocketId',
            content: 'Test',
            time: new Date().toString()
        };
        gameHandlingServiceMock.getPlayerNameBySocketId.and.returnValue('TestClient');
        clientSocketServiceMock.listenToMessageReceived.and.returnValue(of(testMessage));
        component.ngOnInit();
        expect(component.messages[0].sender).toBe('TestClient');
        expect(component.messages[0].content).toBe('Test');
    });
});
