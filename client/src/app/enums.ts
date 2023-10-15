export enum Limit {
    MinQuestionsNumber = 1,
    MinChoicesNumber = 2,
    MaxChoicesNumber = 4,
    MinGoodChoices = 1,
    MinPoints = 10,
    MaxPoints = 100,
    MaxQuestionLength = 300,
    MaxTitleLength = 255,
    MaxDescriptionLength = 500,
    MaxDuration = 60,
    MinDuration = 10,
    MaxAnswerLength = 150,
    MaxNameLength = 50,
}

export enum ImportState {
    ValidForm = 'ValidForm',
    NameExists = 'NameExists',
    InvalidForm = 'InvalidForm',
}

export enum GameMode {
    Testing = '/game',
    RealGame = '/waiting',
}
