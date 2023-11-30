import { Game } from '@common/game';
import { expect } from 'chai';
import { Collection, Db, FindCursor, UpdateResult } from 'mongodb';
import * as Sinon from 'sinon';
import { DatabaseService } from './database.service';
import { FileManagerService } from './file-manager.service';
import { GameManagerService } from './game-manager.service';

describe('GameManagerService', () => {
    let gameManagerService: GameManagerService;
    let mockDatabaseService: Sinon.SinonStubbedInstance<DatabaseService>;
    let mockFileManagerService: Sinon.SinonStubbedInstance<FileManagerService>;
    let mockCollection: Sinon.SinonStubbedInstance<Collection<Game>>;
    let mockCursor: Sinon.SinonStubbedInstance<FindCursor<Game>>;

    const games: Game[] = [
        {
            id: '0',
            title: 'test',
            description: 'description of test',
            duration: 20,
            lastModification: '2023-09-30',
            isVisible: true,
            questions: [],
        },
    ];

    const modifiedGame: Game = {
        id: '0',
        title: 'modified test',
        description: 'modified description',
        duration: 30,
        lastModification: '2023-10-01',
        isVisible: false,
        questions: [],
    };
    const schemaObject = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        description: 'A quiz',
        type: 'object',
    };
    enum QuestionType {
        QCM = 'QCM',
        QRL = 'QRL',
    }

    beforeEach(() => {
        // Creating Sinon stub instances for DatabaseService and FileManagerService
        mockDatabaseService = Sinon.createStubInstance(DatabaseService);
        mockFileManagerService = Sinon.createStubInstance(FileManagerService);

        // Creating stubs for Collection and FindCursor
        mockCollection = {
            find: Sinon.stub(),
            insertOne: Sinon.stub(),
            updateOne: Sinon.stub(),
            deleteOne: Sinon.stub(),
            // Add other necessary methods from the Collection interface
        } as unknown as Sinon.SinonStubbedInstance<Collection<Game>>;

        mockCursor = {
            toArray: Sinon.stub(),
        } as unknown as Sinon.SinonStubbedInstance<FindCursor<Game>>;
        const schemaString = JSON.stringify(schemaObject);
        const schemaBuffer = Buffer.from(schemaString);

        mockFileManagerService.readJsonFile.resolves(schemaBuffer);

        // Link FindCursor stub to the Collection find method

        mockCollection.find.returns(mockCursor as unknown as FindCursor<Game>);

        mockDatabaseService.getDb.returns({ collection: () => mockCollection } as unknown as Db);

        // Initialize GameManagerService with mocked services
        gameManagerService = new GameManagerService(
            mockDatabaseService as unknown as DatabaseService,
            mockFileManagerService as unknown as FileManagerService,
        );
    });

    it('getGames should retrieve games from the database', async () => {
        mockCursor.toArray.resolves(games);
        const result = await gameManagerService.getGames();
        expect(result).to.deep.equal(games);
    });

    it('exportGame should export a game to a file', async () => {
        mockCursor.toArray.resolves([games[0]]);
        mockFileManagerService.writeJsonFile.resolves();
        const filePath = await gameManagerService.exportGame('0');
        expect(filePath).to.equal('./data/Game0.json');
    });

    it('modifyGame should update a game in the database', async () => {
        // Ensure the modified game meets all validation criteria
        const validQuestion = {
            text: 'Valid Question Text',
            points: 10, // Assuming this is a valid point value
            type: QuestionType.QCM, // Use enum value from QuestionType
            // Include any other required properties of a Question
            choices: [
                { text: 'Choice 1', isCorrect: true },
                { text: 'Choice 2', isCorrect: false },
                // Add more choices if required
            ],
        };

        // Ensure the modified game meets all validation criteria
        const validModifiedGame: Game = {
            ...modifiedGame,
            title: 'Valid Title',
            description: 'Valid Description',
            duration: 30, // within valid range
            questions: [validQuestion],
            // ... other fields as needed
        };

        // Mock setup
        const updateResult: UpdateResult<Game> = {
            matchedCount: 1,
            modifiedCount: 1,
            acknowledged: true,
            upsertedCount: 0,
            upsertedId: null,
        };
        mockCollection.updateOne.resolves(updateResult);
        mockCursor.toArray.resolves([validModifiedGame]);
        mockFileManagerService.readJsonFile.resolves(Buffer.from(JSON.stringify(schemaObject)));

        // Call the method under test
        const result = await gameManagerService.modifyGame('0', validModifiedGame);

        // Check the result
        expect(result).to.not.be.null;
        expect(result).to.be.an('array').that.is.not.empty;
        expect(result[0]).to.deep.equal(validModifiedGame);
    });

    it("modifyGameVisibility should update a game's visibility", async () => {
        const visibilityUpdate = { isVisible: false };
        mockCollection.updateOne.resolves();
        mockCursor.toArray.resolves([{ ...games[0], isVisible: visibilityUpdate.isVisible }]);
        const result = await gameManagerService.modifyGameVisibility('0', visibilityUpdate);
        expect(result[0].isVisible).to.equal(visibilityUpdate.isVisible);
    });

    it('deleteGameById should remove a game from the database', async () => {
        mockCollection.deleteOne.resolves();
        mockCursor.toArray.resolves([]);
        await gameManagerService.deleteGameById('0');
        const result = await gameManagerService.getGames();
        expect(result).to.be.empty;
    });
});
