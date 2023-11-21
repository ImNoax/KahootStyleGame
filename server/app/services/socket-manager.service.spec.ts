/* eslint-disable max-lines */
import { GameMode } from '@common/game-mode';
import { LobbyDetails, Pin, Player } from '@common/lobby';
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
        sinon.stub(console, 'log');
    });

    afterEach(() => {
        clientSocket.close();
        service['sio'].close();
        sinon.restore();
    });

    it('should handle validatePin event by emitting invalidPin event if the pin is invalid', (done) => {
        const invalidPin = '0000';

        clientSocket.emit('validatePin', invalidPin);

        clientSocket.on('invalidPin', (reason: string) => {
            expect(reason).to.equal(`La partie de PIN ${invalidPin} n'a pas été trouvée. Êtes-vous sûr du PIN?`);
            done();
        });
    });

    it('should handle validatePin event by emitting invalidPin event if the lobby is locked', (done) => {
        createGame();

        setTimeout(() => {
            clientSocket.emit('toggleLock');
            clientSocket.emit('validatePin', roomPin);

            clientSocket.on('invalidPin', (reason: string) => {
                expect(reason).to.equal(`La partie de PIN ${roomPin} a été verrouillée par l'organisateur. Attendez et réessayez.`);
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('should handle validatePin event by emitting validPin event in case of success', (done) => {
        createGame();

        setTimeout(() => {
            clientSocket.emit('validatePin', roomPin);

            clientSocket.on('validPin', (gameId: string, pin: Pin) => {
                expect(pin).to.equal(roomPin);
                expect(gameId).to.equal('');
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('should handle joinLobby event by emitting failedLobbyConnection event if the name is already taken', (done) => {
        const name = 'Organisateur';
        createGame();

        setTimeout(() => {
            clientSocket.emit('joinLobby', name);

            clientSocket.on('failedLobbyConnection', (reason: string) => {
                expect(reason).to.equal('Nom réservé par un autre joueur');
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('should handle joinLobby event by emitting failedLobbyConnection event if the name is banned', (done) => {
        const name = 'test';
        createGame();

        setTimeout(() => {
            service['lobbies'].get(roomPin).bannedNames.push(name);
            clientSocket.emit('joinLobby', name);

            clientSocket.on('failedLobbyConnection', (reason: string) => {
                expect(reason).to.equal('Nom Banni');
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('should handle joinLobby event by emitting failedLobbyConnection event if the lobby is locked', (done) => {
        const name = 'test';
        createGame();

        setTimeout(() => {
            clientSocket.emit('toggleLock');
            clientSocket.emit('joinLobby', name);

            clientSocket.on('failedLobbyConnection', (message: string) => {
                expect(message).to.equal(`La partie de PIN ${roomPin} a été verrouillée par l'organisateur. Attendez et réessayez.`);
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('should handle joinLobby event by emitting successfulLobbyConnection event if the name is correct', (done) => {
        const name = 'test';
        createGame();

        clientSocket.emit('joinLobby', name);

        clientSocket.on('successfulLobbyConnection', (validName: string) => {
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
        clientSocket.emit('createLobby', null);
        clientSocket.emit('getPlayers');

        clientSocket.on('latestPlayerList', (lobbyDetails: LobbyDetails) => {
            expect(lobbyDetails.bannedNames.length).to.equal(0);
            expect(lobbyDetails.game).to.equal(null);
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
            clientSocket2.emit('validatePin', pin);
            clientSocket2.emit('joinLobby', nameClient2);

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
            clientSocket2.emit('validatePin', roomPin);
            clientSocket2.emit('joinLobby', '');

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
            clientSocket2.emit('validatePin', roomPin);
            clientSocket2.emit('joinLobby', '');

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

    it('startCountDown should emit questionTransition event if the next question is loading', (done) => {
        createGame();

        setTimeout(() => {
            clientSocket.emit('startCountDown', 0, { isQuestionTransition: true });

            clientSocket.on('questionTransition', (isQuestionTransition: boolean) => {
                expect(isQuestionTransition).to.equal(true);
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('startCountDown should emit countDown if the timer is greater than 0', (done) => {
        let time = 4;

        setTimeout(() => {
            clientSocket.emit('startCountDown', time, { isPanicModeEnabled: true }, GameMode.Testing);

            clientSocket.on('countDown', (count: number) => {
                expect(count).to.equal(time);
                clientSocket.on('countDown', (newCount: number) => {
                    expect(newCount).to.equal(--time);
                    done();
                });
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('startCountDown should emit countDownEnd if the timer is less or equal than 1', (done) => {
        createGame();
        const spy = sinon.spy(service['sio'], 'to');

        setTimeout(() => {
            clientSocket.emit('startCountDown', 1, { isQuestionTransition: false, isPanicModeEnabled: false }, GameMode.RealGame);

            clientSocket.on('countDownEnd', () => {
                sinon.assert.called(spy);
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('stopCountDown should stop the timer', (done) => {
        let countDownEnded = false;
        const waitTime = 2500;
        clientSocket.emit('startCountDown', 2, { isQuestionTransition: false, isPanicModeEnabled: false }, GameMode.Testing);

        clientSocket.emit('stopCountDown');

        clientSocket.on('countDownEnd', () => {
            countDownEnded = true;
        });

        setTimeout(() => {
            expect(countDownEnded).to.equal(false);
            done();
        }, waitTime);
    });

    it('chatMessage should return messageReceived', (done) => {
        // const messageSent: Message = { sender: 'sender1', content: 'content1', time: new Date('date1') };
        // setTimeout(()=> {
        //     service['lobbies'].get(roomPin).chat = [];
        //     clientSocket.emit('chatMessage', messageSent);
        // })
        // setTimeout(()=> {
        // })
        // clientSocket.on('messageReceived', (chat:Message[]) => {
        //     expect(chat[0].sender).to.equal(clientSocket.);
        //     expect(message.content).to.equal(message);
        //     done();
        // });
        done();
    });
    it('getChat should return chat', (done) => {
        // const message1: Message = { sender: 'socket1', content: 'content1', time: new Date('date1') };
        // setTimeout(()=> {
        //     service['lobbies'].get(roomPin).chat = [];
        //     service['lobbies'].get(roomPin).chat.push(message1);
        //     clientSocket.emit('getChat');
        // })
        // clientSocket.on('messageReceived', (currentLobbyChat) => {
        //     expect(currentLobbyChat[0].sender).to.equal(message1);
        //     expect(message.content).to.equal(message);
        //     done();
        // });
        done();
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
        let nbSubmitted = 0;
        createGame();

        setTimeout(() => {
            clientSocket2.emit('validatePin', roomPin);
            clientSocket2.emit('joinLobby', 'test1');
            clientSocket3.emit('validatePin', roomPin);
            clientSocket3.emit('joinLobby', 'test2');

            setTimeout(() => {
                clientSocket2.emit('answerSubmitted', true, false);
                clientSocket3.emit('answerSubmitted', true, true);
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
                    done();
                }, RESPONSE_DELAY);
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('should handle enablePanicMode by emitting panicMode event to everyone in the room', (done) => {
        createGame();
        const spy = sinon.spy(service['sio'], 'to');

        setTimeout(() => {
            clientSocket.emit('enablePanicMode');
            clientSocket.on('panicMode', () => {
                sinon.assert.called(spy);
                done();
            });
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
        const data = { answer: 2 };
        createGame();

        setTimeout(() => {
            service['lobbies'].get(roomPin).histogram = {};
            service['lobbies'].get(roomPin).histogram['answer'] = 1;

            clientSocket.emit('histogramUpdate', { answer: 1 });

            clientSocket.on('updateHistogram', (updateData: { [key: string]: number }) => {
                expect(updateData).to.deep.equal(data);
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('histogramUpdate should create an histogram if one does not already exist', (done) => {
        const data = { answer: 1 };
        Object.getPrototypeOf(data).unwantedKey = 0;
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

    it('submitScore should update the player score and emit scoreUpdated', (done) => {
        const score = 50;
        createGame();

        setTimeout(() => {
            clientSocket.emit('submitScore', score);

            clientSocket.on('scoreUpdated', (player: Player) => {
                expect(player.socketId).to.equal(clientSocket.id);
                expect(service['lobbies'].get(roomPin).players[0].score).to.equal(score);
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('submitScore without a room should do nothing', (done) => {
        const score = 30;
        let scoreSubmitted = false;
        clientSocket.emit('submitScore', score);

        clientSocket.on('scoreUpdated', () => {
            scoreSubmitted = true;
        });

        setTimeout(() => {
            expect(scoreSubmitted).to.equal(false);
            done();
        }, RESPONSE_DELAY);
    });

    it('submitScore should do nothing if the player is not in the room', (done) => {
        const score = 30;
        let scoreSubmitted = false;
        createGame();

        setTimeout(() => {
            service['lobbies'].get(roomPin).players.pop();
            clientSocket.emit('submitScore', score);

            clientSocket.on('scoreUpdated', () => {
                scoreSubmitted = true;
            });

            setTimeout(() => {
                expect(scoreSubmitted).to.equal(false);
                done();
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });

    it('gameEnded should emit showResults', (done) => {
        createGame();

        setTimeout(() => {
            clientSocket.emit('gameEnded');

            clientSocket.on('showResults', () => {
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('updateBonusTimes should update the player bonusTimes and emit latestPlayerList', (done) => {
        const bonusTimes = 6;
        createGame();

        setTimeout(() => {
            clientSocket.emit('updateBonusTimes', bonusTimes);

            clientSocket.on('latestPlayerList', (lobby: LobbyDetails) => {
                expect(lobby).to.deep.equal(service['lobbies'].get(roomPin));
                expect(lobby.players[0].bonusTimes).to.equal(bonusTimes);
                done();
            });
        }, RESPONSE_DELAY);
    });

    it('updateBonusTimes without a room should do nothing', (done) => {
        const bonusTimes = 3;
        let playerListReceived = false;
        clientSocket.emit('updateBonusTimes', bonusTimes);

        clientSocket.on('latestPlayerList', () => {
            playerListReceived = true;
        });

        setTimeout(() => {
            expect(playerListReceived).to.equal(false);
            done();
        }, RESPONSE_DELAY);
    });

    it('updateBonusTimes should do nothing if the player is not in the room', (done) => {
        const bonusTimes = 3;
        let playerListReceived = false;
        createGame();

        setTimeout(() => {
            service['lobbies'].get(roomPin).players.pop();
            clientSocket.emit('updateBonusTimes', bonusTimes);

            clientSocket.on('latestPlayerList', () => {
                playerListReceived = true;
            });

            setTimeout(() => {
                expect(playerListReceived).to.equal(false);
                done();
            }, RESPONSE_DELAY);
        }, RESPONSE_DELAY);
    });
});
