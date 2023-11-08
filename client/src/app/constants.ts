import { MatSnackBarConfig } from '@angular/material/snack-bar';
import { Game, Question, QuestionType } from '@common/game';
import { Button } from './interfaces/button-model';

export const snackBarConfiguration: MatSnackBarConfig = { duration: 4000, verticalPosition: 'top' };

export const MOCK_BUTTONS: Button[] = [
    {
        color: 'white',
        selected: false,
        text: 'Test1',
        isCorrect: true,
        id: 1,
    },
    {
        color: 'white',
        selected: false,
        text: 'Test2',
        isCorrect: false,
        id: 2,
    },
    {
        color: 'white',
        selected: true,
        text: 'Test3',
        isCorrect: true,
        id: 3,
    },
    {
        color: 'white',
        selected: true,
        text: 'Test4',
        isCorrect: false,
        id: 4,
    },
];

export const MOCK_QUESTIONS: Question[] = [
    {
        text: 'What is the capital of France?',
        points: 10,
        type: QuestionType.QCM,
        choices: [
            { text: 'Paris', isCorrect: true },
            { text: 'London', isCorrect: false },
            { text: 'Berlin', isCorrect: false },
            { text: 'Madrid', isCorrect: false },
        ],
    },
];

export const MOCK_GAME: Game = {
    id: '1',
    title: 'Game 1',
    description: 'Test ',
    duration: 5,
    lastModification: '2018-11-13',
    questions: MOCK_QUESTIONS,
};

export const TIME_OUT = 3;
export const BONUS_POINTS = 0.2;
export const BUTTON_SELECTED = 1;
export const BUTTON_UNSELECTED = -1;
