export type Jeu = {
    id: number,
    name: string,
    description: string,
    timePerQuestion: number,
    questions: {
        id: number,
        question: string,
        type: string,
        scorePoint: number,
        responses: {
            answer: string,
            isCorrect: boolean
        }[]
    }[]
}
