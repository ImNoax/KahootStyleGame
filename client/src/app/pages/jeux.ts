export interface Jeu {
    id: number;
    name: string;
    description: string;
    questions: string[];
}
export const jeux = [
    {
        id: 1,
        name: 'jeu 1',
        description: 'A large phone with one of the best screens',
        questions: ['question 1.1', 'question 1.2', 'question 1.3'],
    },
    {
        id: 2,
        name: 'jeu 2',
        description: 'A great phone with one of the best cameras',
        questions: ['question 2.1', 'question 2.2', 'question 2.3'],
    },
    {
        id: 3,
        name: 'jeu 3',
        description: '',
        questions: ['question 3.1', 'question 3.2', 'question 3.3'],
    },
];
