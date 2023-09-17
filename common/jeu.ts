enum QuestionType {
    QCM,
    QRL
}

export interface Jeu {
    id: number,
    title: string,
    description: string,
    duration: number,
    lastModification: string,
    questions: {
        id: number,
        text: string,
        points: number,
        type: QuestionType,
        choices: {
            answer: string,
            isCorrect: boolean
        }[]
    }[]
}
