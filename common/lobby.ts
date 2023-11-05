export type SocketId = string;
export type Pin = string;

export const REQUIRED_PIN_LENGTH = 4;

export interface LobbyDetails {
    isLocked: boolean;
    players: Player[];
    bannedNames: string[];
    gameId: string;
    bonusRecipient?: string;
    histogram?: { [key: string]: number };
}

export interface Player {
    socketId: SocketId;
    name: string;
    answerSubmitted: boolean;
    score: number;
    bonusTimes: number;
    isStillInGame: boolean;
    isAbleToChat: boolean;
}
