export enum QuestionType {
    QCM,
    QRL,
}

export interface Question {
    text: string;
    points: number;
    type: QuestionType;
    choices: {
        answer: string;
        isCorrect: boolean;
    }[];
}

export interface Game {
    title: string;
    description: string;
    duration: number;
    lastModification: string;
    isVisible?: boolean;
    questions: Question[];
}
