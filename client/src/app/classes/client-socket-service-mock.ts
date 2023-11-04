import { ClientSocketService } from '@app/services/client-socket.service';
import { Socket } from 'socket.io-client';
import { SocketMock } from './socket-mock';

export class ClientSocketServiceMock extends ClientSocketService {
    socket: Socket = new SocketMock() as unknown as Socket;
}
