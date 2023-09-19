export type Jeu = {
    id: number,
    name: string,
    description: string,
    timePerQuestion: number,
    questions: {
        id: number,
        text: string,
        type: string,
        scorePoint: number,
        responses?: {
            answer: string,
            isCorrect: boolean
        }[],
        choices?: {
            answer: string,
            isCorrect: boolean
        }[]
    }[]
}
