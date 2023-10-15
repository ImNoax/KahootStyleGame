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
                this.sio.to(pin).emit('latestPlayerList', this.lobbies.get(pin).players);
            };

            const leaveLobby = () => {
                const pin: string = this.activeSockets.get(socket.id);

                if (pin) {
                    const currentLobby = this.lobbies.get(pin);
                    currentLobby.players = currentLobby.players.filter((player) => player.socketId !== socket.id);
                    socket.leave(pin);
                    sendLatestPlayersList(pin);
                    this.activeSockets.delete(socket.id);
                }
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

            socket.on('getPlayers', () => {
                const pin = this.activeSockets.get(socket.id);
                sendLatestPlayersList(pin);
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
