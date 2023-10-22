import * as http from 'http';
import * as io from 'socket.io';

interface LobbyDetails {
    locked: boolean;
    players: { socketId: string; name: string }[];
    bannedNames: string[];
}

export class SocketManager {
    private sio: io.Server;

    private lobbies: Map<string, LobbyDetails> = new Map<string, LobbyDetails>([
        ['4567', { locked: true, players: [], bannedNames: ['Not Banned'] }],
        ['1234', { locked: false, players: [], bannedNames: ['BaNnED'] }],
    ]); // Valeurs pour tester

    private activeSockets: Map<string, string> = new Map<string, string>();

    constructor(server: http.Server) {
        this.sio = new io.Server(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });
    }

    handleSockets(): void {
        this.sio.on('connection', (socket) => {
            const sendLatestPlayersList = (pin: string) => {
                const lobbyDetails = this.lobbies.get(pin);
                if (lobbyDetails) {
                    const roomData = {
                        pin,
                        players: lobbyDetails.players,
                        isLocked: lobbyDetails.locked,
                    };
                    this.sio.to(pin).emit('latestPlayerList', roomData);
                }
            };

            const leaveLobby = () => {
                const pin: string = this.activeSockets.get(socket.id);

                if (pin) {
                    const currentLobby = this.lobbies.get(pin);
                    if (currentLobby) {
                        if (isOrganizer(pin)) {
                            // est ce que ca fait leave les autres socket de la room avec pin sachant que ca fait
                            // renvoie au /home mais ca ne fait pas socket.leave(pin) aux autres donc peuvent-ils tjrs recevoir les emit?
                            this.sio.to(pin).emit('lobbyClosed');
                            this.lobbies.delete(pin);
                        } else {
                            currentLobby.players = currentLobby.players.filter((player) => player.socketId !== socket.id);
                            socket.leave(pin);
                            sendLatestPlayersList(pin);
                            this.activeSockets.delete(socket.id);
                        }
                    }
                }
            };

            const isOrganizer = (pin: string) => {
                const currentLobby = this.lobbies.get(pin);
                if (currentLobby) {
                    return currentLobby.players.some((player) => player.socketId === socket.id && player.name.toLowerCase() === 'organisateur');
                }
                return null;
            };

            const generateRandomPin = () => {
                const pinLength = 4;
                // eslint-disable-next-line @typescript-eslint/no-magic-numbers
                return Math.floor(1 + Math.random() * 9999)
                    .toString()
                    .padStart(pinLength, '0');
            };

            const generateUniquePin = () => {
                const maxAttempts = 10;
                let attempts = 0;
                while (attempts < maxAttempts) {
                    const newPin = generateRandomPin();
                    if (!this.lobbies.has(newPin)) {
                        return newPin;
                    }
                    attempts++;
                }
                return null;
            };

            socket.on('joinLobby', (pin: string) => {
                if (this.lobbies.has(pin)) {
                    const lobbyToJoin = this.lobbies.get(pin);
                    if (lobbyToJoin.locked)
                        socket.emit('failedLobbyConnection', `La partie de PIN ${pin} a été verrouillée par l'organisateur. Attendez et réessayez.`);
                    else {
                        socket.join(pin);
                        this.activeSockets.set(socket.id, pin);
                        socket.emit('successfulLobbyConnection', pin);
                    }
                } else socket.emit('failedLobbyConnection', `La partie de PIN ${pin} n'a pas été trouvée. Êtes-vous sûr du PIN entré?`);
            });

            socket.on('validateName', (nameToValidate: string) => {
                const pin = this.activeSockets.get(socket.id);
                nameToValidate = nameToValidate.toLowerCase();
                const currentLobby = this.lobbies.get(pin);

                if (currentLobby.players.find((player) => player.name.toLowerCase() === nameToValidate))
                    socket.emit('invalidName', 'Nom réservé par un autre joueur');
                else if (nameToValidate === 'organisateur') socket.emit('invalidName', "Nom réservé par l'organisateur");
                else if (currentLobby.bannedNames.find((bannedName) => bannedName.toLowerCase() === nameToValidate))
                    socket.emit('invalidName', 'Nom Banni');
                else {
                    currentLobby.players.push({ socketId: socket.id, name: nameToValidate });
                    sendLatestPlayersList(pin);
                    socket.emit('validName', nameToValidate);
                }
            });

            socket.on('createLobby', () => {
                const newPin = generateUniquePin();
                if (!newPin) {
                    socket.emit('failedLobbyCreation', 'Impossible de générer un PIN unique.');
                } else {
                    this.lobbies.set(newPin, { locked: false, players: [], bannedNames: [] });
                    socket.join(newPin);
                    this.activeSockets.set(socket.id, newPin);
                    const lobbyCreated = this.lobbies.get(newPin);
                    lobbyCreated.players.push({ socketId: socket.id, name: 'Organisateur' });
                    socket.emit('successfulLobbyCreation');
                }
            });

            socket.on('getPlayers', () => {
                const pin = this.activeSockets.get(socket.id);
                sendLatestPlayersList(pin);
            });

            socket.on('getStatus', () => {
                const pin = this.activeSockets.get(socket.id);
                if (isOrganizer(pin)) {
                    socket.emit('statusOrganizer');
                } else {
                    socket.emit('statusNotOrganizer');
                }
            });

            socket.on('banPlayer', (player: { socketId: string; name: string }) => {
                const socketToBan = this.sio.sockets.sockets.get(player.socketId);
                const pin = this.activeSockets.get(socket.id);
                const currentLobby = this.lobbies.get(pin);
                if (currentLobby) {
                    currentLobby.players = currentLobby.players.filter((playerr) => playerr.name !== player.name);
                    currentLobby.bannedNames.push(player.name);
                    if (socketToBan) {
                        socketToBan.leave(pin);
                        socketToBan.emit('lobbyClosed');
                    }
                }
                socket.emit('successfulBan', 'Le nom ${player.name} a été banni');
            });

            socket.on('leaveLobby', () => {
                leaveLobby();
            });

            socket.on('disconnect', () => {
                leaveLobby();
            });
        });
    }
}
// fonction getlobby pour eviter repetition de constpin et const currentlobby?
