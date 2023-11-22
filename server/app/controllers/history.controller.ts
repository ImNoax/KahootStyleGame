import { GameInfo } from '@common/game';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

const DATE_LENGTH = 19;

@Service()
export class HistoryController {
    router: Router;
    games: GameInfo[] = [
        { name: 'Ntest3', date: '2003-11-16 18:27:34', numberPlayers: 50, bestScore: 1130 },
        { name: 'Ctest', date: '2023-11-16 18:27:35', numberPlayers: 5, bestScore: 130 },
        { name: 'Atest2', date: '2003-11-26 18:27:35', numberPlayers: 500, bestScore: 13130 },
        { name: 'Ktest5', date: new Date().toISOString().replace('T', ' ').slice(0, DATE_LENGTH), numberPlayers: 3, bestScore: 60 },
        { name: 'Ptest4', date: '2053-11-16 18:27:35', numberPlayers: 1, bestScore: 0 },
    ];

    constructor() {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.get('/', async (req: Request, res: Response) => {
            if (this.games) res.status(StatusCodes.OK).send(this.games);
            else res.status(StatusCodes.NOT_FOUND).send();
        });

        this.router.delete('/', async (req: Request, res: Response) => {
            this.games = [];
            res.status(StatusCodes.OK).send(this.games);
        });
    }
}
