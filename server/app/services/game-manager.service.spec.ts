import { Jeu } from '@common/jeu';
import { expect } from 'chai';
import * as Sinon from 'sinon';
import { SinonStubbedInstance, createStubInstance } from 'sinon';
import { FileManagerService } from './file-manager.service';
import { GameManagerService } from './game-manager.service';

describe('GameManagerService', () => {
    let gameManager: GameManagerService;
    let fileManager: SinonStubbedInstance<FileManagerService>;

    const games: Buffer = Buffer.from(
        '[{"id": 0, "title": "test", "description": "description of test", "duration": 20,' +
            ' "lastModification": "2023-09-30", "isVisible": true, "questions": []}]',
    );
    const modifiedGame: Jeu = {
        id: 0,
        title: 'test2',
        description: 'description of test 2',
        duration: 10,
        lastModification: '2021-09-26',
        isVisible: false,
        questions: [],
    };

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
        const path = './data/jeu0.json';
        await gameManager.exportGame(0).then((res) => {
            expect(fileManager.writeJsonFile.called).to.equal(true);
            expect(res).to.deep.equal(path);
        });
    });

    it('modifyGame should call writeJsonFile and return the list of games', async () => {
        await gameManager.modifyGame(0, modifiedGame, 'test').then((res) => {
            expect(fileManager.writeJsonFile.called).to.equal(true);
            expect(res[0]).to.deep.equal(modifiedGame);
            expect(res.length).to.equal(1);
        });

        const mockAdd = Sinon.stub(gameManager, 'addGame').resolves([modifiedGame, modifiedGame]);
        await gameManager.modifyGame(1, modifiedGame, 'test').then((res) => {
            expect(mockAdd.called).to.equal(true);
            expect(res[1]).to.deep.equal(modifiedGame);
            expect(res.length).to.equal(2);
        });
        await gameManager.modifyGame(0, modifiedGame, 'test2').then((res) => {
            expect(mockAdd.called).to.equal(true);
            expect(res[1]).to.deep.equal(modifiedGame);
            expect(res.length).to.equal(2);
        });
    });

    it('modifyGameVisibility should call writeJsonFile and return the list of games', async () => {
        await gameManager.modifyGameVisibility(1, { isVisible: false }).then((res) => {
            expect(fileManager.writeJsonFile.called).to.equal(false);
            expect(res[0].isVisible).to.equal(true);
            expect(res.length).to.equal(1);
        });

        await gameManager.modifyGameVisibility(0, { isVisible: false }).then((res) => {
            expect(fileManager.writeJsonFile.called).to.equal(true);
            expect(res[0].isVisible).to.equal(false);
            expect(res.length).to.equal(1);
        });
    });

    it('addGame should call writeJsonFile and return the list of games', async () => {
        await gameManager.addGame(modifiedGame).then((res) => {
            expect(fileManager.writeJsonFile.called).to.equal(true);
            expect(res.length).to.equal(2);
            expect(res[1]).to.equal(modifiedGame);
        });
    });

    it('deleteGameById should remove the game from the list', async () => {
        const wrongId = -1;
        await gameManager.deleteGameById(1).then(() => {
            expect(fileManager.writeJsonFile.called).to.equal(false);
        });
        await gameManager.deleteGameById(wrongId).then(() => {
            expect(fileManager.writeJsonFile.called).to.equal(false);
        });

        modifiedGame.id = 0;
        const game2: Jeu = {
            id: 1,
            title: 'test2',
            description: 'description of test 2',
            duration: 10,
            lastModification: '2021-09-26',
            isVisible: false,
            questions: [],
        };
        Sinon.stub(gameManager, 'getGames').resolves([modifiedGame, game2]);
        await gameManager.deleteGameById(0).then(() => {
            expect(fileManager.writeJsonFile.called).to.equal(true);
            expect(game2.id).to.equal(0);
        });

        await gameManager.deleteGameById(0).then(() => {
            expect(fileManager.writeJsonFile.called).to.equal(true);
            expect(fileManager.writeJsonFile.calledWith('./data/jeux.json', '[]')).to.equal(true);
        });
    });
});
