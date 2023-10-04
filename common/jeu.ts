export enum QuestionType {
    QCM = 'QCM',
    QRL = 'QRL',
}

export interface Choice {
    answer: string;
    isCorrect: boolean;
}

export interface Question {
    text: string;
    points: number;
    type: QuestionType;
    choices: Choice[];
}

export interface Jeu {
    id: number;
    title: string;
    description: string;
    duration: number;
    lastModification: string;
    isVisible?: boolean;
    questions: Question[];
}
