import { FileManagerService } from '@app/services/file-manager.service';
import { GameManagerService } from '@app/services/game-manager.service';
import { Jeu } from '@common/jeu';
import { Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Service } from 'typedi';

@Service()
export class GameController {
    router: Router;

    constructor(
        private readonly gameManager: GameManagerService,
        private fileManager: FileManagerService,
    ) {
        this.configureRouter();
    }

    private configureRouter(): void {
        this.router = Router();

        this.router.get('/', async (req: Request, res: Response) => {
            const games: Jeu[] = await this.gameManager.getGames();
            res.json(games);
        });

        this.router.get('/:id', async (req: Request, res: Response) => {
            const file: string = await this.gameManager.exportGame(Number(req.params.id));

            res.download(file, async () => {
                await this.fileManager.deleteFile(file);
            });
        });

        this.router.patch('/:id', async (req: Request, res: Response) => {
            const games: Jeu[] = await this.gameManager.modifyGame(Number(req.params.id), req.body);

            res.json(games);
        });

        this.router.post('/:id', async (req: Request, res: Response) => {
            const games: Jeu[] = await this.gameManager.addGame(Number(req.params.id), req.body);

            res.status(StatusCodes.CREATED).json(games);
        });

        this.router.delete('/:id', async (req: Request, res: Response) => {
            await this.gameManager.removeGame;

            res.status(StatusCodes.NO_CONTENT).send();
        });
    }
}
