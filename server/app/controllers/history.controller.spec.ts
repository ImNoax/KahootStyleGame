import { Application } from '@app/app';
import { GameInfo } from '@common/game';
import { expect } from 'chai';
import { StatusCodes } from 'http-status-codes';
import * as supertest from 'supertest';
import { Container } from 'typedi';

describe('HistoryController', () => {
    let expressApp: Express.Application;

    const games: GameInfo[] = [
        { name: 'Ntest3', date: '2003-11-16 18:27:34', numberPlayers: 50, bestScore: 1130 },
        { name: 'Ctest', date: '2023-11-16 18:27:35', numberPlayers: 5, bestScore: 130 },
        { name: 'Atest2', date: '2003-11-26 18:27:35', numberPlayers: 500, bestScore: 13130 },
        { name: 'Ptest4', date: '2053-11-16 18:27:35', numberPlayers: 1, bestScore: 0 },
    ];

    beforeEach(async () => {
        const app = Container.get(Application);
        expressApp = app.app;
        Object.defineProperty(app['historyController'], 'games', { value: games });
    });

    it('should return the list of games played on valid get request to root', async () => {
        return supertest(expressApp)
            .get('/api/history')
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body).to.deep.equal(games);
            });
    });

    it('should return NOT_FOUND if the list is not defined on valid get request to root', async () => {
        Object.defineProperty(Container.get(Application)['historyController'], 'games', { value: undefined });
        return supertest(expressApp).get('/api/history').expect(StatusCodes.NOT_FOUND);
    });

    it('should empty the list on valid delete request to root', async () => {
        return supertest(expressApp)
            .delete('/api/history')
            .expect(StatusCodes.OK)
            .then((response) => {
                expect(response.body).to.deep.equal([]);
            });
    });
});
