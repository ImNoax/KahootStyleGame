import { Question } from './question';

export interface Game {
    id: number;
    name: string;
    description: string;
    timePerQuestion: number;
    questions: Question[];
}
