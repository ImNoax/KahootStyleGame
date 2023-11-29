import { Game } from './game';

export type SocketId = string;
export type Pin = string;

export const REQUIRED_PIN_LENGTH = 4;

export interface LobbyDetails {
    isLocked: boolean;
    players: Player[];
    bannedNames?: string[];
    game?: Game;
    bonusRecipient?: string;
    histogram?: { [key: string]: number };
    chat: Message[];
}
export enum PlayerColor {
    Red = 'red',
    Yellow = 'yellow',
    Green = 'green',
    Black = 'black',
}
export interface Player {
    socketId: SocketId;
    name: string;
    answerSubmitted?: boolean;
    score: number;
    bonusTimes?: number;
    activityState: PlayerColor;
    isAbleToChat: boolean;
}

export interface Message {
    sender: string;
    content: string;
    time: Date;
}
