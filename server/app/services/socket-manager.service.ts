import { Game } from '@common/game';
import { GameMode } from '@common/game-mode';
import { TimerConfiguration } from '@common/timer';

import { LobbyDetails, Message, Pin, Player, PlayerColor, REQUIRED_PIN_LENGTH, SocketId } from '@common/lobby';
import * as http from 'http';
import * as io from 'socket.io';

const MAX_LOBBY_QUANTITY = 10000;
const DEFAULT_COUNTDOWN_PERIOD = 1000;
const PANIC_COUNTDOWN_PERIOD = 250;
const ORGANISER = 'Organisateur';
const TESTER = 'Testeur';

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
                        if (isOrganizer) socket.broadcast.to(pin).emit('lobbyClosed', 'NO HOST', "L'organisateur a quitté la partie");

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

            const startCountDown = (initialCount: number, isPanicModeEnabled: boolean | undefined): void => {
                let countDownPeriod = DEFAULT_COUNTDOWN_PERIOD;
                if (isPanicModeEnabled) countDownPeriod = PANIC_COUNTDOWN_PERIOD;

                this.sio.to(pin).emit('countDown', initialCount);
                counter = setInterval(() => {
                    initialCount--;

                    if (initialCount > 0) {
                        this.sio.to(pin).emit('countDown', initialCount);
                    } else {
                        this.sio.to(pin).emit('countDown', initialCount);
                        this.sio.to(pin).emit('countDownEnd');
                        clearInterval(counter);
                    }
                }, countDownPeriod);
            };

            socket.on('validatePin', (pinToJoin: Pin) => {
                if (this.lobbies.has(pinToJoin)) {
                    const lobbyToJoin = this.lobbies.get(pinToJoin);
                    if (lobbyToJoin.isLocked)
                        socket.emit('invalidPin', `La partie de PIN ${pinToJoin} a été verrouillée par l'organisateur. Attendez et réessayez.`);
                    else {
                        socket.join(pinToJoin);
                        pin = pinToJoin;
                        socket.emit('validPin', lobbyToJoin.game, pin);
                    }
                } else socket.emit('invalidPin', `La partie de PIN ${pinToJoin} n'a pas été trouvée. Êtes-vous sûr du PIN?`);
            });

            socket.on('joinLobby', (nameToValidate: string) => {
                const lowerCaseNameToValide = nameToValidate.toLowerCase();
                const currentLobby = this.lobbies.get(pin);

                // Message d'erreurs à ajuster selon les cas
                if (currentLobby.players.find((player) => player.name.toLowerCase() === lowerCaseNameToValide))
                    socket.emit('failedLobbyConnection', 'Nom réservé par un autre joueur');
                else if (currentLobby.bannedNames.find((bannedName) => bannedName.toLowerCase() === lowerCaseNameToValide))
                    socket.emit('failedLobbyConnection', 'Nom Banni');
                else if (currentLobby.isLocked)
                    socket.emit('failedLobbyConnection', `La partie de PIN ${pin} a été verrouillée par l'organisateur. Attendez et réessayez.`);
                else {
                    currentLobby.players.push({
                        socketId: socket.id,
                        name: nameToValidate,
                        answerSubmitted: false,
                        score: 0,
                        activityState: PlayerColor.Red,
                        isAbleToChat: true,
                        bonusTimes: 0,
                    });
                    sendLatestPlayersList();
                    socket.emit('successfulLobbyConnection', nameToValidate);
                }
            });

            socket.on('createLobby', (currentGame: Game) => {
                if (this.lobbies.size <= MAX_LOBBY_QUANTITY) {
                    const newPin = generateUniquePin();
                    this.lobbies.set(newPin, { isLocked: false, players: [], bannedNames: [], game: currentGame, chat: [] });
                    socket.join(newPin);
                    pin = newPin;

                    const lobbyCreated = this.lobbies.get(newPin);
                    lobbyCreated.players.push({
                        socketId: socket.id,
                        name: ORGANISER,
                        answerSubmitted: true,
                        score: 0,
                        activityState: PlayerColor.Green,
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
                socketToBan.emit('lobbyClosed', 'BAN', "Vous avez été expulsé de la salle d'attente");
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

            socket.on('startCountDown', (initialCount: number, configuration: TimerConfiguration, gameMode: GameMode) => {
                if (configuration.isQuestionTransition) this.sio.emit('questionTransition', configuration.isQuestionTransition);
                if (gameMode === GameMode.Testing) pin = socket.id;
                startCountDown(initialCount, configuration.isPanicModeEnabled);
            });

            socket.on('stopCountDown', () => {
                clearInterval(counter);
            });

            socket.on('chatMessage', (message: Message) => {
                const currentLobby = this.lobbies.get(pin);
                if (currentLobby) {
                    const sender = currentLobby.players.find((player) => player.socketId === message.sender);
                    message.sender = sender.name;
                    if (sender.isAbleToChat) {
                        currentLobby.chat.push(message);
                        this.sio.to(pin).emit('messageReceived', currentLobby.chat);
                    } else {
                        socket.emit('PlayerMuted');
                    }
                }
            });
            socket.on('getChat', (gameMode: GameMode) => {
                if (gameMode === GameMode.Testing) {
                    pin = socket.id;
                    this.lobbies.set(pin, {
                        isLocked: false,
                        players: [{ socketId: socket.id, name: TESTER, score: 0, activityState: PlayerColor.Green, isAbleToChat: true }],
                        chat: [],
                    });
                }
                const currentLobby = this.lobbies.get(pin);
                if (currentLobby) {
                    this.sio.to(pin).emit('messageReceived', currentLobby.chat);
                }
            });
            socket.on('answerSubmitted', (isCorrect: boolean, submittedFromTimer: boolean) => {
                const currentLobby = this.lobbies.get(pin);
                if (currentLobby) {
                    if (!currentLobby.bonusRecipient && isCorrect && !submittedFromTimer) currentLobby.bonusRecipient = socket.id;

                    currentLobby.players.forEach((player) => {
                        if (player.socketId === socket.id) {
                            player.answerSubmitted = true;
                            if (!submittedFromTimer) {
                                player.activityState = PlayerColor.Green;
                            }
                        }
                    });
                    sendLatestPlayersList();
                    const areAllSubmitted = !currentLobby.players.some((player) => !player.answerSubmitted);
                    if (areAllSubmitted) {
                        this.sio.to(pin).emit('allSubmitted', currentLobby.bonusRecipient);

                        currentLobby.players.forEach((player) => {
                            if (player.name !== ORGANISER) {
                                player.answerSubmitted = false;
                            }
                        });
                        currentLobby.bonusRecipient = '';
                    }
                }
            });

            socket.on('enablePanicMode', () => {
                this.sio.to(pin).emit('panicMode');
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

            socket.on('toggleMute', (playerToMute: Player) => {
                const currentLobby = this.lobbies.get(pin);
                if (currentLobby) {
                    const socketToMute = this.sio.sockets.sockets.get(playerToMute.socketId);
                    const player = currentLobby.players.find((p) => p.socketId === playerToMute.socketId);
                    if (player) {
                        player.isAbleToChat = !player.isAbleToChat;
                        const eventToEmit = player.isAbleToChat ? 'PlayerUnmuted' : 'PlayerMuted';
                        socketToMute.emit(eventToEmit);
                    }
                }
            });
            socket.on('socketInteracted', () => {
                const currentLobby = this.lobbies.get(pin);
                if (currentLobby) {
                    currentLobby.players.forEach((player) => {
                        if (player.socketId === socket.id) {
                            player.activityState = PlayerColor.Yellow;
                        }
                    });
                    sendLatestPlayersList();
                }
            });
            socket.on('resetPlayersActivityState', () => {
                const currentLobby = this.lobbies.get(pin);
                if (currentLobby) {
                    currentLobby.players.forEach((player) => {
                        player.activityState = PlayerColor.Red;
                    });
                    sendLatestPlayersList();
                }
            });
        });
    }
}
