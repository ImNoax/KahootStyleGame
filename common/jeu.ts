export type Jeu = {
    name: string,
    description: string,
    duration: number,
    questions: {
        id: number,
        text: string,
        type: string,
        points: number,
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
