import { Game } from '@common/game';
import { expect } from 'chai';
import * as fs from 'fs';
import { Collection, Db, InsertManyResult, MongoClient, ObjectId, WithId } from 'mongodb';
import * as Sinon from 'sinon';
import DatabaseService from './database.service';

describe('DatabaseService', () => {
    let databaseService: DatabaseService;
    let mockClient: Sinon.SinonStubbedInstance<MongoClient>;
    let mockDb: Sinon.SinonStubbedInstance<Db>;
    let mockCollection: Sinon.SinonStubbedInstance<Collection>;

    beforeEach(() => {
        mockClient = Sinon.createStubInstance(MongoClient);
        mockDb = Sinon.createStubInstance(Db);
        mockCollection = Sinon.createStubInstance(Collection);

        // Stub the MongoClient methods, but avoid stubbing 'db' again
        mockClient.connect.resolves();
        mockClient.close.resolves();
        // Link 'db' and 'collection' methods to the stubs
        mockClient.db.returns(mockDb as unknown as Db);
        mockDb.collection.returns(mockCollection as unknown as Collection);

        databaseService = new DatabaseService();
        databaseService['client'] = mockClient as unknown as MongoClient;
    });

    it('should connect to the database', async () => {
        await databaseService.connect();
        expect(mockClient.connect.calledOnce).to.be.true;
    });

    it('should disconnect from the database', async () => {
        await databaseService.disconnect();
        expect(mockClient.close.calledOnce).to.be.true;
    });
    it('should get the database', () => {
        const db = databaseService.getDb();
        expect(db).to.equal(mockDb);
        expect(mockClient.db.calledWith('Log2990_database')).to.be.true;
    });

    it('should import games from a file', async () => {
        const filePath = 'path/to/games.json';
        const gamesData: WithId<Game>[] = [
            // Define Game object here
        ];

        Sinon.stub(fs, 'readFileSync').returns(JSON.stringify(gamesData));

        mockCollection.insertMany.resolves({
            acknowledged: true,
            insertedCount: gamesData.length,
            insertedIds: gamesData.reduce((acc, _, i) => ({ ...acc, [i]: new ObjectId() }), {}),
        } as InsertManyResult<unknown>);

        await databaseService.importGames(filePath);

        expect(mockClient.connect.calledOnce).to.be.true;
        expect(mockDb.collection.calledWith('Games')).to.be.true;
        expect(mockCollection.insertMany.calledWith(gamesData)).to.be.true;
    });

    afterEach(() => {
        Sinon.restore(); // Reset all stubs
    });
});
