/* eslint-disable max-lines */
import { LobbyDetails, Pin } from '@common/lobby';
import { Server } from 'app/server';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { Socket, io as ioClient } from 'socket.io-client';
import { Container } from 'typedi';
import { SocketManager } from './socket-manager.service';

const RESPONSE_DELAY = 100;

describe('SocketManager service tests', () => {
    let service: SocketManager;
    let server: Server;
    let clientSocket: Socket;
    let roomPin: Pin;

    const urlString = 'http://localhost:3000';

    const createGame = () => {
        clientSocket.emit('createLobby', '');

        clientSocket.on('successfulLobbyCreation', (pin: Pin) => {
            roomPin = pin;
        });
    };

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

    it('countDown should emit countDown if the timer is greater than 0', (done) => {
        const time = 4;

        createGame();

        setTimeout(() => {
            service.countDown(roomPin, time, null);

            clientSocket.on('countDown', (timer) => {
                expect(timer).to.equal(time);
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('countDown should emit gameStarted if the timer is equal to 0', (done) => {
        let isGameStarted = false;

        createGame();

        setTimeout(() => {
            service.countDown(roomPin, 0, undefined);

            clientSocket.on('gameStarted', () => {
                isGameStarted = true;
            });

            setTimeout(() => {
                expect(isGameStarted).to.equal(true);
                done();
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('joinLobby should return failedLobbyConnection if the pin is invalid', (done) => {
        const invalidPin = 'invalid';

        clientSocket.emit('joinLobby', invalidPin);

        clientSocket.on('failedLobbyConnection', (reason: string) => {
            expect(reason).to.equal(`La partie de PIN ${invalidPin} n'a pas été trouvée. Elle a soit commencé ou le PIN n'existe pas.`);
            done();
        });
    });

    it('joinLobby should return failedLobbyConnection if the lobby is locked', (done) => {
        createGame();

        setTimeout(() => {
            clientSocket.emit('toggleLock');
            clientSocket.emit('joinLobby', roomPin);

            clientSocket.on('failedLobbyConnection', (reason: string) => {
                expect(reason).to.equal(`La partie de PIN ${roomPin} a été verrouillée par l'organisateur. Attendez et réessayez.`);
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('joinLobby should return successfulLobbyConnection in case of success', (done) => {
        createGame();

        setTimeout(() => {
            clientSocket.emit('joinLobby', roomPin);

            clientSocket.on('successfulLobbyConnection', (gameId: string, pin: Pin) => {
                expect(pin).to.equal(roomPin);
                expect(gameId).to.equal('');
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('validateName should return invalidName if the name is already taken', (done) => {
        const name = 'test';
        createGame();

        clientSocket.emit('validateName', name);
        clientSocket.emit('validateName', name);

        clientSocket.on('invalidName', (reason: string) => {
            expect(reason).to.equal('Nom réservé par un autre joueur');
            done();
        });
    });

    it('validateName should return invalidName if the name is banned', (done) => {
        const name = 'test';
        createGame();

        setTimeout(() => {
            service['lobbies'].get(roomPin).bannedNames.push(name);
            clientSocket.emit('validateName', name);

            clientSocket.on('invalidName', (reason: string) => {
                expect(reason).to.equal('Nom Banni');
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('validateName should return validName if the name is correct', (done) => {
        const name = 'test';
        createGame();

        clientSocket.emit('validateName', name);

        clientSocket.on('validName', (validName: string) => {
            expect(validName).to.equal(name);
            done();
        });
    });

    it('createLobby should return failedLobbyCreation if the maximum number of lobby is reached', (done) => {
        const maxLobby = 10000;
        for (let i = 0; i <= maxLobby; i++) {
            service['lobbies'].set(i.toString(), null);
        }

        clientSocket.emit('createLobby', '');

        clientSocket.on('failedLobbyCreation', (reason: string) => {
            expect(reason).to.equal("Quantité maximale de salles d'attente atteinte");
            done();
        });
    });

    it('createLobby should return successfulLobbyyCreation if the creation is a success', (done) => {
        let isSuccessful = false;

        clientSocket.emit('createLobby', '');

        clientSocket.on('successfulLobbyCreation', () => {
            isSuccessful = true;
        });

        setTimeout(() => {
            expect(isSuccessful).to.equal(true);
            done();
        }, RESPONSE_DELAY);
    });

    it('getPlayers should return latestPlayerList with the lobby details', (done) => {
        clientSocket.emit('createLobby', '');
        clientSocket.emit('getPlayers');

        clientSocket.on('latestPlayerList', (lobbyDetails: LobbyDetails) => {
            expect(lobbyDetails.bannedNames.length).to.equal(0);
            expect(lobbyDetails.gameId).to.equal('');
            expect(lobbyDetails.isLocked).to.equal(false);
            expect(lobbyDetails.players.length).to.equal(1);

            done();
        });
    });

    it('banPlayer should add the name of the player banned to the list of banned names and return lobbyClosed', (done) => {
        const clientSocket2 = ioClient(urlString);
        const nameClient2 = 'test';
        createGame();

        setTimeout(() => {
            const pin = roomPin;
            clientSocket2.emit('joinLobby', pin);
            clientSocket2.emit('validateName', nameClient2);

            setTimeout(() => {
                clientSocket.emit('banPlayer', { socketId: clientSocket2.id, name: nameClient2 });

                clientSocket2.once('lobbyClosed', (reason: string, message: string) => {
                    expect(reason).to.equal('BAN');
                    expect(message).to.equal("Vous avez été expulsé de la salle d'attente.");
                });

                setTimeout(() => {
                    expect(service['lobbies'].get(pin).bannedNames.length).to.equal(1);
                    expect(service['lobbies'].get(pin).bannedNames[0]).to.equal(nameClient2);

                    expect(service['lobbies'].get(pin).players.length).to.equal(1);
                    expect(service['lobbies'].get(pin).players[0].name).to.not.equal(nameClient2);

                    clientSocket2.close();
                    done();
                }, RESPONSE_DELAY);
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('toggleLock should return lockToggled and change isLocked', (done) => {
        createGame();

        clientSocket.emit('toggleLock');

        clientSocket.on('lockToggled', (isLocked: boolean) => {
            expect(isLocked).to.equal(true);
            done();
        });
    });

    it('leaveLobby should return nothing if the player is not in a lobby', (done) => {
        createGame();

        setTimeout(() => {
            clientSocket.emit('leaveLobby');
            service['lobbies'].delete(roomPin);

            setTimeout(() => {
                expect(service['lobbies'].get(roomPin)).to.equal(undefined);
                done();
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('leaveLobby should return lobbyClosed if the host leave', (done) => {
        const clientSocket2 = ioClient(urlString);
        createGame();

        setTimeout(() => {
            clientSocket2.emit('joinLobby', roomPin);
            clientSocket2.emit('validateName', '');

            setTimeout(() => {
                clientSocket.emit('leaveLobby');
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);

        clientSocket2.once('lobbyClosed', (reason: string, message: string) => {
            expect(reason).to.equal('NO HOST');
            expect(message).to.equal("L'organisateur a quitté la partie.");
            clientSocket2.close();
            done();
        });
    });

    it('leaveLobby should delete the lobby if the last player leaves', (done) => {
        const lobbyNb = service['lobbies'].size;
        createGame();

        setTimeout(() => {
            expect(service['lobbies'].size).to.equal(lobbyNb + 1);

            clientSocket.emit('leaveLobby');

            setTimeout(() => {
                expect(service['lobbies'].size).to.equal(lobbyNb);
                done();
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('leaveLobby should return latestPlayerList if a player leaves', (done) => {
        const clientSocket2 = ioClient(urlString);
        createGame();

        setTimeout(() => {
            clientSocket2.emit('joinLobby', roomPin);
            clientSocket2.emit('validateName', '');

            setTimeout(() => {
                expect(service['lobbies'].get(roomPin).players.length).to.equal(2);

                clientSocket2.emit('leaveLobby');
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);

        clientSocket2.once('latestPlayerList', () => {
            setTimeout(() => {
                expect(service['lobbies'].get(roomPin).players.length).to.equal(1);
                clientSocket2.close();
                done();
            }, RESPONSE_DELAY);
        });
    });

    it('startGame should call startCountDown', (done) => {
        const mockStartCountDown = sinon.stub(service, 'startCountDown');
        createGame();

        clientSocket.emit('startGame');

        setTimeout(() => {
            expect(mockStartCountDown.called).to.equal(true);
            done();
        }, RESPONSE_DELAY);
    });

    it('chatMessage should return messageReceived', (done) => {
        const message = 'Hello';
        createGame();

        clientSocket.emit('chatMessage', { content: message });

        clientSocket.on('messageReceived', (messageData) => {
            expect(messageData.sender).to.equal(clientSocket.id);
            expect(messageData.content).to.equal(message);

            done();
        });
    });

    it('loadNextQuestion should return nextQuestionLoading', (done) => {
        createGame();

        clientSocket.emit('loadNextQuestion');

        clientSocket.on('nextQuestionLoading', () => {
            done();
        });
    });

    it('answerSubmitted should do nothing if the player is not in a lobby', (done) => {
        let answerSubmitted = false;

        clientSocket.emit('answerSubmitted');

        clientSocket.on('canLoadNextQuestion', () => {
            answerSubmitted = true;
        });
        clientSocket.on('allSubmitted', () => {
            answerSubmitted = true;
        });

        setTimeout(() => {
            expect(answerSubmitted).to.equal(false);
            done();
        }, RESPONSE_DELAY);
    });

    it('answerSubmitted should return canLoadNextQuestion to the host and all submitted to the others', (done) => {
        const clientSocket2 = ioClient(urlString);
        const clientSocket3 = ioClient(urlString);
        let canLoadQuestion = false;
        let nbSubmitted = 0;
        createGame();

        setTimeout(() => {
            clientSocket2.emit('joinLobby', roomPin);
            clientSocket2.emit('validateName', 'test1');
            clientSocket3.emit('joinLobby', roomPin);
            clientSocket3.emit('validateName', 'test2');

            setTimeout(() => {
                clientSocket2.emit('answerSubmitted', true, false);
                clientSocket3.emit('answerSubmitted', true, true);
                clientSocket.on('canLoadNextQuestion', () => {
                    canLoadQuestion = true;
                });
                clientSocket2.on('allSubmitted', (bonusRecipient: string) => {
                    expect(bonusRecipient).to.equal(clientSocket2.id);
                    nbSubmitted++;
                });
                clientSocket3.on('allSubmitted', (bonusRecipient: string) => {
                    expect(bonusRecipient).to.not.equal(clientSocket3.id);
                    nbSubmitted++;
                });

                setTimeout(() => {
                    expect(nbSubmitted).to.equal(2);
                    expect(canLoadQuestion).to.equal(true);
                    done();
                }, RESPONSE_DELAY);
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('histogramUpdate should do nothing if the player is not in a lobby', (done) => {
        let histogramUpdated = false;

        clientSocket.emit('histogramUpdate');

        clientSocket.on('updateHistogram', () => {
            histogramUpdated = true;
        });

        setTimeout(() => {
            expect(histogramUpdated).to.equal(false);
            done();
        }, RESPONSE_DELAY);
    });

    it('histogramUpdate should update the histogram and send updateHistogram', (done) => {
        const data = { ['1']: 2 };
        createGame();

        setTimeout(() => {
            service['lobbies'].get(roomPin).histogram = {};
            service['lobbies'].get(roomPin).histogram['1'] = 1;

            clientSocket.emit('histogramUpdate', { ['1']: 1 });

            clientSocket.on('updateHistogram', (updateData: { [key: string]: number }) => {
                expect(updateData).to.deep.equal(data);
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('histogramUpdate should create an histogram if one does not already exist', (done) => {
        const data = { ['1']: 1 };
        createGame();

        clientSocket.emit('histogramUpdate', data);

        clientSocket.on('updateHistogram', (updateData: { [key: string]: number }) => {
            expect(updateData).to.deep.equal(data);
            done();
        });
    });

    it('resetHistogram should do nothing if the player is not in a lobby', (done) => {
        let histogramUpdated = false;

        clientSocket.emit('resetHistogram');

        clientSocket.on('updateHistogram', () => {
            histogramUpdated = true;
        });

        setTimeout(() => {
            expect(histogramUpdated).to.equal(false);
            done();
        }, RESPONSE_DELAY);
    });

    it('resetHistogram should update the histogram and send updateHistogram', (done) => {
        const data = { ['1']: 1 };
        createGame();

        clientSocket.emit('resetHistogram', data);

        clientSocket.on('updateHistogram', (updateData: { [key: string]: number }) => {
            expect(updateData).to.deep.equal({});
            done();
        });
    });
});
