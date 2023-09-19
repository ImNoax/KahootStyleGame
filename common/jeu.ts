enum QuestionType {
    QCM,
    QRL
}

export interface Question {
    id: number,
    text: string,
    points: number,
    type: QuestionType,
    choices: {
        answer: string,
        isCorrect: boolean
    }[]
}

export interface Jeu {
    id: number,
    title: string,
    description: string,
    duration: number,
    lastModification: string,
    isVisible?: boolean
    questions: Question[],
}
