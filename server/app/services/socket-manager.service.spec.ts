import { Server } from 'app/server';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Socket, io as ioClient } from 'socket.io-client';
import { Container } from 'typedi';
import { SocketManager } from './socket-manager.service';

// const RESPONSE_DELAY = 200;
describe('SocketManager service tests', () => {
    let service: SocketManager;
    let server: Server;
    let clientSocket: Socket;

    const urlString = 'http://localhost:3000';

    beforeEach(async () => {
        server = Container.get(Server);
        server.init();
        service = server['socketManager'];
        clientSocket = ioClient(urlString);
        sinon.stub(console, 'log'); // stop console.log
    });

    afterEach(() => {
        clientSocket.close();
        service['sio'].close();
        sinon.restore();
    });

    it('startCountDown should call countDown multiple times', (done) => {
        const mockCountDown = sinon.stub(service, 'countDown');
        const time = 3000;

        service.startCountDown('');

        setTimeout(() => {
            expect(mockCountDown.getCalls().length).greaterThan(1);
            done();
        }, time);
    });

    /* it('countDown should emit countDown if the timer is greater than 0 and gameStarted otherwise', (done) => {
        const time = 4;
        const waitTime = 1000;
        let timerReceived = false;
        let gameStarted = false;
        const pin = 'room';
        service['lobbies'].set(pin, {
            isLocked: false,
            players: [],
            bannedNames: [],
            gameId: '',
        });
        service['sio'].socketsJoin(pin);

        clientSocket.on('countDown', (timer) => {
            timerReceived = true;
            expect(timer).to.equal(time);
        });

        clientSocket.on('gameStarted', () => {
            gameStarted = true;
        });

        service.countDown(pin, time, null);

        service['sio'].emit('countDown', time);

        setTimeout(() => {
            expect(timerReceived).to.equal(true);
            expect(gameStarted).to.equal(false);
            done();
        }, waitTime);
    });*/
});
