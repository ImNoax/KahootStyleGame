import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClientSocketServiceMock } from '@app/classes/client-socket-service-mock';
import { SocketMock } from '@app/classes/socket-mock';
import { ClientSocketService } from '@app/services/client-socket.service';
import { NameDefinitionComponent } from './name-definition.component';

describe('NameDefinitionComponent', () => {
    let component: NameDefinitionComponent;
    let fixture: ComponentFixture<NameDefinitionComponent>;
    let clientSocketServiceMock: ClientSocketServiceMock;
    let socketMock: SocketMock;
    let nEmittedEvents: number;

    beforeEach(() => {
        clientSocketServiceMock = new ClientSocketServiceMock(jasmine.createSpyObj('Router', ['']));

        TestBed.configureTestingModule({
            declarations: [NameDefinitionComponent],
            imports: [HttpClientModule, MatFormFieldModule, ReactiveFormsModule, FormsModule, MatInputModule, BrowserAnimationsModule],
            providers: [{ provide: ClientSocketService, useValue: clientSocketServiceMock }],
        });

        fixture = TestBed.createComponent(NameDefinitionComponent);
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

    // it('should handle validName event by receiving the player name', () => {
    //     const event = 'validName';
    //     const name = 'player1';

    //     expect(clientSocketServiceMock.isNameDefined).toBeFalse();
    //     expect(clientSocketServiceMock.playerName).toBe('');

    //     socketMock.simulateServerEmit(event, name);

    //     expect(clientSocketServiceMock.isNameDefined).toBeTrue();
    //     expect(clientSocketServiceMock.playerName).toBe(name);
    // });

    it('should handle invalidName event by receiving an error message from the server', () => {
        const event = 'invalidName';
        const message = 'server error message';

        expect(component.serverMessage).toBe('');
        expect(component.nameIsInvalid).toBeFalse();

        socketMock.simulateServerEmit(event, message);

        expect(component.serverMessage).toBe(message);
        expect(component.nameIsInvalid).toBeTrue();
    });

    it('onSubmit should send validateName event through the clientSocketService', () => {
        const event = 'validateName';
        const name = ' Player ';
        component.nameForm.controls['name'].setValue(name);

        component.onSubmit();
        expect(socketMock.emit).toHaveBeenCalledWith(event, name.trim());
        expect(socketMock.nEmittedEvents).toEqual(++nEmittedEvents);
    });
});
