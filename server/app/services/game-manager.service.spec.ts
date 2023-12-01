import { Choice, Game, Question, QuestionType } from '@common/game';
import { expect } from 'chai';
import * as Sinon from 'sinon';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { FileManagerService } from './file-manager.service';
import { GameManagerService } from './game-manager.service';

describe('GameManagerService', () => {
    let gameManager: GameManagerService;
    let fileManager: SinonStubbedInstance<FileManagerService>;

    const games: Buffer = Buffer.from(
        '[{"id": "0", "title": "test", "description": "description of test", "duration": 20,' +
            ' "lastModification": "2023-09-30", "isVisible": true, "questions": []}]',
    );
    const modifiedGame: Game = {
        id: '0',
        title: 'test2',
        description: 'description of test 2',
        duration: 10,
        lastModification: '2021-09-26',
        isVisible: false,
        questions: [],
    };
    const schema = Buffer.from(
        '{"$schema": "http://json-schema.org/draft-07/schema#","description": "A quiz","type": "object","properties": ' +
            '{"id": {"description":"The unique identifier of the quiz","type":["string", "null"]},"title": {"description": "The title of the quiz",' +
            '"type": "string"},"description":{"description":"The description of the quiz","type":"string"},"duration":{"description": "Maximum time' +
            ' for a QCM question in seconds","type": "number"},"lastModification": {"description": "The last modification date-time of the quiz in' +
            ' ISO8601 format","type": ["string", "null"]},"isVisible": {"description": "A boolean which indicate if the game is visible","type": ' +
            '"boolean"},"questions": {"description": "All questions part of the quiz","type": "array","items": {"description": "A quiz question",' +
            '"type": "object","properties": {"type": {"description": "The type of quiz. Multiple Choice (QCM) or Open Response (QRL)","type": ' +
            '"string","enum":["QCM", "QRL"]},"text":{"description":"The question itself","type":"string"},"points": {"description": "The number of ' +
            'points assigned to the question. Has to be a multiple of 10.","type":"number"},"choices":{"description":"The list of choices","type": ' +
            '["array"],"minItems":2,"items":{"description": "A choice","type": "object","properties": {"text": {"description": "The choice itself",' +
            '"type": "string"},"isCorrect": {"description": "A boolean which is true only when the choice is a correct answer","type": "boolean"}},' +
            '"required": ["text", "isCorrect"]}}},"if": {"properties": {"type": {"const": "QRL"}}},"then": {"required": ["type", "text", "points"],' +
            '"properties": {"choices": {"type": "null"}}},"else": {"required": ["type", "text", "points", "choices"]}}}},"required": ["title", ' +
            '"description", "duration", "questions"]}',
    );

    beforeEach(async () => {
        fileManager = createStubInstance(FileManagerService);
        fileManager.readJsonFile.resolves(games);
        fileManager.writeJsonFile.resolves();
        gameManager = new GameManagerService(fileManager);
    });

    it('getGames should call readJsonFile and return the result', async () => {
        await gameManager.getGames().then((res) => {
            expect(fileManager.readJsonFile.called).to.equal(true);
            expect(res).to.deep.equal(JSON.parse(games.toString()));
        });
    });

    it('exportGame should call writeJsonFile and return the correct path', async () => {
        Sinon.stub(gameManager, 'getGames').resolves(JSON.parse(games.toString()));

        const path = './data/Game0.json';
        await gameManager.exportGame('0').then((res) => {
            expect(fileManager.writeJsonFile.called).to.equal(true);
            expect(res).to.deep.equal(path);
        });
    });

    it('modifyGame should call writeJsonFile and return the list of games', async () => {
        Sinon.stub(gameManager, 'getGames').resolves(JSON.parse(games.toString()));

        await gameManager.modifyGame('0', modifiedGame).then((res) => {
            expect(fileManager.writeJsonFile.called).to.equal(true);
            expect(res[0]).to.deep.equal(modifiedGame);
            expect(res.length).to.equal(1);
        });

        const mockAdd = Sinon.stub(gameManager, 'addGame').resolves([modifiedGame, modifiedGame]);
        await gameManager.modifyGame('1', modifiedGame).then(() => {
            expect(mockAdd.called).to.equal(true);
        });
    });

    it('modifyGameVisibility should call writeJsonFile and return the list of games', async () => {
        Sinon.stub(gameManager, 'getGames').resolves(JSON.parse(games.toString()));

        await gameManager.modifyGameVisibility('1', { isVisible: false }).then((res) => {
            expect(fileManager.writeJsonFile.called).to.equal(false);
            expect(res[0].isVisible).to.equal(true);
            expect(res.length).to.equal(1);
        });

        await gameManager.modifyGameVisibility('0', { isVisible: false }).then((res) => {
            expect(fileManager.writeJsonFile.called).to.equal(true);
            expect(res[0].isVisible).to.equal(false);
            expect(res.length).to.equal(1);
        });
    });

    it('addGame should call writeJsonFile and return the list of games', async () => {
        Sinon.stub(gameManager, 'getGames').resolves(JSON.parse(games.toString()));
        const mockValidateGame = Sinon.stub(gameManager, 'validateGame').returns(true);
        fileManager.readJsonFile.resolves(schema);

        await gameManager.addGame(modifiedGame).then((res) => {
            expect(mockValidateGame.called).to.equal(true);
            expect(fileManager.writeJsonFile.called).to.equal(true);
            expect(res[1]).to.equal(modifiedGame);
        });

        gameManager.deleteGameById(modifiedGame.id);
        modifiedGame.description = null;

        await gameManager.addGame(modifiedGame).then((res) => {
            expect(res).to.equal(null);
        });

        mockValidateGame.returns(false);
        modifiedGame.description = 'test';

        await gameManager.addGame(modifiedGame).then((res) => {
            expect(res).to.equal(null);
        });
    });

    it('validateGame should return false if one of the elements is not valid and true otherwise', async () => {
        const nbChar = 1000;
        const wrongDuration = 100;
        const mockValidateQuestions = Sinon.stub(gameManager, 'validateQuestions').returns(true);

        expect(gameManager.validateGame(modifiedGame)).to.equal(false);
        expect(gameManager.error.message).to.equal('Questions invalides');

        modifiedGame.questions.push({
            text: '',
            points: 0,
            type: QuestionType.QCM,
            choices: [],
        });

        expect(gameManager.validateGame(modifiedGame)).to.equal(true);
        expect(mockValidateQuestions.called).to.equal(true);

        mockValidateQuestions.returns(false);
        expect(gameManager.validateGame(modifiedGame)).to.equal(false);
        mockValidateQuestions.returns(true);

        for (let i = 0; i < nbChar; i++) modifiedGame.title += 't';

        expect(gameManager.validateGame(modifiedGame)).to.equal(false);
        expect(gameManager.error.message).to.equal('Nom trop long');

        modifiedGame.title = 'test2';
        modifiedGame.description = '';

        expect(gameManager.validateGame(modifiedGame)).to.equal(false);
        expect(gameManager.error.message).to.equal('Description invalide');

        for (let i = 0; i < nbChar; i++) modifiedGame.description += 't';

        expect(gameManager.validateGame(modifiedGame)).to.equal(false);
        expect(gameManager.error.message).to.equal('Description invalide');

        modifiedGame.description = 'description of test 2';
        modifiedGame.duration = 0;

        expect(gameManager.validateGame(modifiedGame)).to.equal(false);
        expect(gameManager.error.message).to.equal('Temps invalide');

        modifiedGame.duration = wrongDuration;

        expect(gameManager.validateGame(modifiedGame)).to.equal(false);
        expect(gameManager.error.message).to.equal('Temps invalide');
    });

    it('validateQuestions should return false if one of the elements is invalid and true otherwise', async () => {
        const nbChar = 1000;
        const wrongPoints = 150;
        const wrongPoints2 = 54;

        const qcmQuestion: Question = {
            text: 'test',
            points: 10,
            type: QuestionType.QCM,
            choices: [
                { text: '', isCorrect: true },
                { text: '', isCorrect: false },
            ],
        };

        const qrlQuestion: Question = {
            text: 'test',
            points: 10,
            type: QuestionType.QRL,
        };

        const mockValidateChoices = Sinon.stub(gameManager, 'validateChoices').returns(true);

        expect(gameManager.validateQuestions([])).to.equal(true);

        expect(gameManager.validateQuestions([qcmQuestion])).to.equal(true);
        expect(mockValidateChoices.called).to.equal(true);

        expect(gameManager.validateQuestions([qrlQuestion])).to.equal(true);

        mockValidateChoices.returns(false);
        expect(gameManager.validateQuestions([qcmQuestion])).to.equal(false);
        mockValidateChoices.returns(true);

        qcmQuestion.text = '';
        expect(gameManager.validateQuestions([qcmQuestion])).to.equal(false);
        expect(gameManager.error.message).to.equal(`Question: "${qcmQuestion.text}" invalide`);

        for (let i = 0; i < nbChar; i++) qcmQuestion.text += 't';
        expect(gameManager.validateQuestions([qcmQuestion])).to.equal(false);
        expect(gameManager.error.message).to.equal(`Question: "${qcmQuestion.text}" invalide`);

        qcmQuestion.text = 'test';
        qcmQuestion.points = 0;

        expect(gameManager.validateQuestions([qcmQuestion])).to.equal(false);
        expect(gameManager.error.message).to.equal(`Points de la question: "${qcmQuestion.text}" invalides`);

        qcmQuestion.points = wrongPoints;

        expect(gameManager.validateQuestions([qcmQuestion])).to.equal(false);
        expect(gameManager.error.message).to.equal(`Points de la question: "${qcmQuestion.text}" invalides`);

        qcmQuestion.points = wrongPoints2;

        expect(gameManager.validateQuestions([qcmQuestion])).to.equal(false);
        expect(gameManager.error.message).to.equal(`Points de la question: "${qcmQuestion.text}" invalides`);

        qcmQuestion.points = 10;
        qcmQuestion.choices.push({ text: '', isCorrect: true });
        qcmQuestion.choices.push({ text: '', isCorrect: true });
        qcmQuestion.choices.push({ text: '', isCorrect: true });

        expect(gameManager.validateQuestions([qcmQuestion])).to.equal(false);
        expect(gameManager.error.message).to.equal(`Choix de la question: "${qcmQuestion.text}" invalides`);

        qcmQuestion.choices.pop();
        qcmQuestion.choices.pop();
        qcmQuestion.choices.pop();
        qcmQuestion.choices.pop();

        expect(gameManager.validateQuestions([qcmQuestion])).to.equal(false);
        expect(gameManager.error.message).to.equal(`Choix de la question: "${qcmQuestion.text}" invalides`);
    });

    it('validateChoices should return false if one of the elements is invalid and true otherwise', async () => {
        const nbChar = 1000;
        const choices: Choice[] = [
            {
                text: 'test',
                isCorrect: false,
            },
            {
                text: 'test2',
                isCorrect: true,
            },
        ];

        expect(gameManager.validateChoices(choices)).to.equal(true);

        choices[0].text = '';

        expect(gameManager.validateChoices(choices)).to.equal(false);
        expect(gameManager.error.message).to.equal(`Choix: "${choices[0].text}" invalide`);

        for (let i = 0; i < nbChar; i++) choices[0].text += 't';

        expect(gameManager.validateChoices(choices)).to.equal(false);
        expect(gameManager.error.message).to.equal(`Choix: "${choices[0].text}" invalide`);

        choices[0].text = 'test';
        choices[0].isCorrect = true;

        expect(gameManager.validateChoices(choices)).to.equal(false);
        expect(gameManager.error.message).to.equal('Nombre de mauvais choix invalides');

        choices[0].isCorrect = false;
        choices[1].isCorrect = false;

        expect(gameManager.validateChoices(choices)).to.equal(false);
        expect(gameManager.error.message).to.equal('Nombre de bons choix invalides');
    });

    it('deleteGameById should remove the game from the list', async () => {
        modifiedGame.id = '0';
        const game2: Game = {
            id: '1',
            title: 'test2',
            description: 'description of test 2',
            duration: 10,
            lastModification: '2021-09-26',
            isVisible: false,
            questions: [],
        };
        Sinon.stub(gameManager, 'getGames').resolves([modifiedGame, game2]);

        const wrongId = '-1';

        await gameManager.deleteGameById('10').then(() => {
            expect(fileManager.writeJsonFile.called).to.equal(false);
        });

        await gameManager.deleteGameById(wrongId).then(() => {
            expect(fileManager.writeJsonFile.called).to.equal(false);
        });

        await gameManager.deleteGameById('0').then(() => {
            expect(fileManager.writeJsonFile.called).to.equal(true);
            expect(game2.id).to.equal('1');
        });

        await gameManager.deleteGameById('1').then(() => {
            expect(fileManager.writeJsonFile.called).to.equal(true);
            expect(fileManager.writeJsonFile.calledWith('./data/games.json', '[]')).to.equal(true);
        });
    });
});

// a delete
