export interface Button {
    color: string;
    selected: boolean;
    text: string;
    isCorrect: boolean;
    id: number;
    showCorrectButtons?: boolean;
    showWrongButtons?: boolean;
}

export interface Choice {
    answer: string;
    isCorrect: boolean;
}
