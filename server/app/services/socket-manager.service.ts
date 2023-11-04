import { LobbyDetails, Pin, REQUIRED_PIN_LENGTH, SocketId } from '@common/lobby';
import * as http from 'http';
import * as io from 'socket.io';

const MAX_LOBBY_QUANTITY = 10000;
const BASE_TIMER = 5;
const MS_TIMER = 1000;

export class SocketManager {
    private sio: io.Server;
    private lobbies: Map<Pin, LobbyDetails> = new Map<Pin, LobbyDetails>();

    constructor(server: http.Server) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
    }

    handleSockets(): void {
        this.sio.on('connection', (socket) => {
            let pin: Pin = '';

            const sendLatestPlayersList = () => {
                const lobbyDetails = this.lobbies.get(pin);
                this.sio.to(pin).emit('latestPlayerList', pin, lobbyDetails);
            };

            const leaveLobby = () => {
                if (pin) {
                    const currentLobby = this.lobbies.get(pin);

                    if (isOrganizer()) socket.broadcast.to(pin).emit('lobbyClosed', "L'organisateur a quitté la salle d'attente.");

                    currentLobby.players = currentLobby.players.filter((player) => player.socketId !== socket.id);
                    if (currentLobby.players.length === 0) this.lobbies.delete(pin);
                    else sendLatestPlayersList();

                    socket.leave(pin);
                    pin = '';
                }
            };

            const isOrganizer = () => {
                const currentLobby = this.lobbies.get(pin);
                return currentLobby.players.some((player) => player.socketId === socket.id && player.name.toLowerCase() === 'organisateur');
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
                        socket.emit('successfulLobbyConnection', pinToJoin, lobbyToJoin.gameId);
                    }
                } else socket.emit('failedLobbyConnection', `La partie de PIN ${pinToJoin} n'a pas été trouvée. Êtes-vous sûr du PIN entré?`);
            });

            socket.on('validateName', (nameToValidate: string) => {
                nameToValidate = nameToValidate.toLowerCase();
                const currentLobby = this.lobbies.get(pin);

                if (currentLobby.players.find((player) => player.name.toLowerCase() === nameToValidate))
                    socket.emit('invalidName', 'Nom réservé par un autre joueur');
                else if (currentLobby.bannedNames.find((bannedName) => bannedName.toLowerCase() === nameToValidate))
                    socket.emit('invalidName', 'Nom Banni');
                else {
                    currentLobby.players.push({ socketId: socket.id, name: nameToValidate });
                    sendLatestPlayersList();
                    socket.emit('validName', nameToValidate);
                }
            });

            socket.on('createLobby', (currentGameId: string) => {
                if (this.lobbies.size <= MAX_LOBBY_QUANTITY) {
                    const newPin = generateUniquePin();
                    this.lobbies.set(newPin, { isLocked: false, players: [], bannedNames: [], gameId: currentGameId });
                    socket.join(newPin);
                    pin = newPin;

                    const lobbyCreated = this.lobbies.get(newPin);
                    lobbyCreated.players.push({ socketId: socket.id, name: 'Organisateur' });
                    socket.emit('successfulLobbyCreation');
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
                socketToBan.emit('lobbyClosed', "Vous avez été exclu de la salle d'attente.");
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

            socket.on('startGame', () => {
                this.startCountDown(pin);
            });

            socket.on('chatMessage', (messageData) => {
                this.sio.to(pin).emit('messageReceived', {
                    sender: socket.id,
                    content: messageData.content,
                    time: new Date(),
                });
            });
        });
    }

    startCountDown(pin: Pin) {
        let timer = BASE_TIMER;
        const counter = setInterval(() => {
            this.countDown(pin, timer, counter);
            timer--;
        }, MS_TIMER);
    }

    countDown(pin: Pin, timer: number, counter: NodeJS.Timer) {
        if (timer > 0) {
            this.sio.to(pin).emit('countDown', timer);
        } else {
            this.sio.to(pin).emit('gameStarted');
            clearInterval(counter);
        }
    }
}
