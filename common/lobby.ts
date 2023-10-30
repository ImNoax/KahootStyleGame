export type SocketId = string;
export type Pin = string;

export const REQUIRED_PIN_LENGTH = 4;

export interface LobbyDetails {
    isLocked: boolean;
    players: { socketId: SocketId; name: string }[];
    bannedNames: string[];
    gameId: string;
}
