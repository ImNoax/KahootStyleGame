import { Game } from '@common/game';
import { GameMode } from '@common/game-mode';

import { LobbyDetails, Pin, REQUIRED_PIN_LENGTH, SocketId } from '@common/lobby';
import * as http from 'http';
import * as io from 'socket.io';

const MAX_LOBBY_QUANTITY = 10000;
const COUNTDOWN_PERIOD = 1000;
const ORGANISER = 'Organisateur';

export class SocketManager {
    private sio: io.Server;
    private lobbies: Map<Pin, LobbyDetails> = new Map<Pin, LobbyDetails>();

    constructor(server: http.Server) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
    }

    handleSockets(): void {
        this.sio.on('connection', (socket) => {
            let pin: Pin = '';
            let isOrganizer = false;
            let counter: NodeJS.Timer;

            const sendLatestPlayersList = () => {
                const lobbyDetails = this.lobbies.get(pin);
                this.sio.to(pin).emit('latestPlayerList', lobbyDetails);
            };

            const leaveLobby = () => {
                if (pin) {
                    const currentLobby = this.lobbies.get(pin);
                    if (currentLobby) {
                        if (isOrganizer) socket.broadcast.to(pin).emit('lobbyClosed', 'NO HOST', "L'organisateur a quitté la partie.");

                        currentLobby.players = currentLobby.players.filter((player) => player.socketId !== socket.id);
                        if (currentLobby.players.length === 1 && currentLobby.players[0].name === ORGANISER) {
                            this.sio.to(pin).emit('noPlayers');
                        }

                        if (currentLobby.players.length === 0) this.lobbies.delete(pin);
                        else sendLatestPlayersList();
                    }
                }
                if (pin !== socket.id) socket.leave(pin);
                pin = '';
                isOrganizer = false;
            };

            const generateRandomPin = () => {
                const pinLength = REQUIRED_PIN_LENGTH;
                return Math.floor(Math.random() * MAX_LOBBY_QUANTITY)
                    .toString()
                    .padStart(pinLength, '0');
            };

            const generateUniquePin = () => {
                let newPin = '';
                do {
                    newPin = generateRandomPin();
                } while (this.lobbies.has(newPin));
                return newPin;
            };

            const startCountDown = (initialCount: number, gameMode: GameMode): void => {
                if (gameMode === GameMode.Testing) pin = socket.id;
                counter = setInterval(() => {
                    initialCount--;

                    if (initialCount > 0) {
                        this.sio.to(pin).emit('countDown', initialCount);
                    } else {
                        this.sio.to(pin).emit('countDownEnd', initialCount);
                        clearInterval(counter);
                    }
                }, COUNTDOWN_PERIOD);
            };

            socket.on('joinLobby', (pinToJoin: Pin) => {
                if (this.lobbies.has(pinToJoin)) {
                    const lobbyToJoin = this.lobbies.get(pinToJoin);
                    if (lobbyToJoin.isLocked)
                        socket.emit(
                            'failedLobbyConnection',
                            `La partie de PIN ${pinToJoin} a été verrouillée par l'organisateur. Attendez et réessayez.`,
                        );
                    else {
                        socket.join(pinToJoin);
                        pin = pinToJoin;
                        socket.emit('successfulLobbyConnection', lobbyToJoin.game, pin);
                    }
                } else
                    socket.emit(
                        'failedLobbyConnection',
                        `La partie de PIN ${pinToJoin} n'a pas été trouvée. Elle a soit commencé ou le PIN n'existe pas.`,
                    );
            });

            socket.on('validateName', (nameToValidate: string) => {
                const lowerCaseNameToValide = nameToValidate.toLowerCase();
                const currentLobby = this.lobbies.get(pin);

                if (currentLobby.players.find((player) => player.name.toLowerCase() === lowerCaseNameToValide))
                    socket.emit('invalidName', 'Nom réservé par un autre joueur');
                else if (currentLobby.bannedNames.find((bannedName) => bannedName.toLowerCase() === lowerCaseNameToValide))
                    socket.emit('invalidName', 'Nom Banni');
                else {
                    currentLobby.players.push({
                        socketId: socket.id,
                        name: nameToValidate,
                        answerSubmitted: false,
                        score: 0,
                        isStillInGame: true,
                        isAbleToChat: true,
                        bonusTimes: 0,
                    });
                    sendLatestPlayersList();
                    socket.emit('validName', nameToValidate);
                }
            });

            socket.on('createLobby', (currentGame: Game) => {
                if (this.lobbies.size <= MAX_LOBBY_QUANTITY) {
                    const newPin = generateUniquePin();
                    this.lobbies.set(newPin, { isLocked: false, players: [], bannedNames: [], game: currentGame });
                    socket.join(newPin);
                    pin = newPin;

                    const lobbyCreated = this.lobbies.get(newPin);
                    lobbyCreated.players.push({
                        socketId: socket.id,
                        name: ORGANISER,
                        answerSubmitted: true,
                        score: 0,
                        isStillInGame: true,
                        isAbleToChat: true,
                        bonusTimes: 0,
                    });
                    isOrganizer = true;
                    socket.emit('successfulLobbyCreation', pin);
                } else socket.emit('failedLobbyCreation', "Quantité maximale de salles d'attente atteinte");
            });

            socket.on('getPlayers', () => {
                sendLatestPlayersList();
            });

            socket.on('banPlayer', (playerToBan: { socketId: SocketId; name: string }) => {
                const socketToBan = this.sio.sockets.sockets.get(playerToBan.socketId);
                const currentLobby = this.lobbies.get(pin);
                currentLobby.players = currentLobby.players.filter((player) => player.name !== playerToBan.name);
                currentLobby.bannedNames.push(playerToBan.name);
                socketToBan.emit('lobbyClosed', 'BAN', "Vous avez été expulsé de la salle d'attente.");
            });

            socket.on('toggleLock', () => {
                const currentLobby = this.lobbies.get(pin);
                currentLobby.isLocked = !currentLobby.isLocked;
                socket.emit('lockToggled', currentLobby.isLocked);
            });

            socket.on('leaveLobby', () => {
                leaveLobby();
            });

            socket.on('disconnect', () => {
                leaveLobby();
            });

            socket.on('startCountDown', (initialCount: number, isQuestionTransition: boolean, gameMode: GameMode) => {
                if (isQuestionTransition) this.sio.emit('isQuestionTransition', isQuestionTransition);
                startCountDown(initialCount, gameMode);
            });

            socket.on('stopCountDown', () => {
                clearInterval(counter);
            });

            socket.on('chatMessage', (messageData) => {
                this.sio.to(pin).emit('messageReceived', {
                    sender: socket.id,
                    content: messageData.content,
                    time: new Date(),
                });
            });

            socket.on('answerSubmitted', (isCorrect: boolean, submittedFromTimer: boolean) => {
                const currentLobby = this.lobbies.get(pin);
                if (currentLobby) {
                    if (!currentLobby.bonusRecipient && isCorrect && !submittedFromTimer) currentLobby.bonusRecipient = socket.id;

                    currentLobby.players.forEach((player) => {
                        if (player.socketId === socket.id) player.answerSubmitted = true;
                    });

                    const areAllSubmitted = !currentLobby.players.some((player) => player.answerSubmitted === false);
                    if (areAllSubmitted) {
                        const organisatorSocketId = currentLobby.players[0].socketId;
                        const organisatorSocket = this.sio.sockets.sockets.get(organisatorSocketId);

                        organisatorSocket.broadcast.to(pin).emit('allSubmitted', currentLobby.bonusRecipient);
                        organisatorSocket.emit('canLoadNextQuestion');

                        currentLobby.players.forEach((player) => {
                            if (player.name !== ORGANISER) player.answerSubmitted = false;
                        });
                        currentLobby.bonusRecipient = '';
                    }
                }
            });

            socket.on('histogramUpdate', (updateData: { [key: string]: number }) => {
                const currentLobby = this.lobbies.get(pin);
                if (currentLobby) {
                    for (const key in updateData) {
                        if (Object.prototype.hasOwnProperty.call(updateData, key)) {
                            if (!currentLobby.histogram) {
                                currentLobby.histogram = {};
                            }
                            if (!currentLobby.histogram[key]) {
                                currentLobby.histogram[key] = 0;
                            }
                            currentLobby.histogram[key] += updateData[key];
                        }
                    }
                    this.sio.to(pin).emit('updateHistogram', currentLobby.histogram);
                }
            });

            socket.on('submitScore', (updatedScore: number) => {
                const currentLobby = this.lobbies.get(pin);
                if (currentLobby) {
                    const currentPlayer = currentLobby.players.find((player) => player.socketId === socket.id);
                    if (currentPlayer) {
                        currentPlayer.score = updatedScore;
                        this.sio.to(pin).emit('scoreUpdated', currentPlayer);
                    }
                }
            });

            socket.on('gameEnded', () => {
                this.sio.to(pin).emit('showResults');
            });

            socket.on('resetHistogram', () => {
                const currentLobby = this.lobbies.get(pin);
                if (currentLobby) {
                    currentLobby.histogram = {};
                    this.sio.to(pin).emit('updateHistogram', currentLobby.histogram);
                }
            });

            socket.on('updateBonusTimes', (bonusTimes: number) => {
                const currentLobby = this.lobbies.get(pin);
                if (currentLobby) {
                    const currentPlayer = currentLobby.players.find((player) => player.socketId === socket.id);
                    if (currentPlayer) {
                        currentPlayer.bonusTimes = bonusTimes;
                        this.sio.to(pin).emit('latestPlayerList', currentLobby);
                    }
                }
            });
        });
    }
}
