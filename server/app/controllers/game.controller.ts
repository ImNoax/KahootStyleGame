import { FileManagerService } from '@app/services/file-manager.service';
import { GameManagerService } from '@app/services/game-manager.service';
import { Game } from '@common/game';
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
            const games: Game[] = await this.gameManager.getGames();
            res.json(games);
        });

        this.router.get('/:id', async (req: Request, res: Response) => {
            const file: string = await this.gameManager.exportGame(Number(req.params.id));

            // 2e argument: Supprimer le fichier après téléchargement
            res.download(file, async () => {
                await this.fileManager.deleteFile(file);
            });
        });

        this.router.patch('/:id', async (req: Request, res: Response) => {
            const games: Game[] = await this.gameManager.modifyGame(Number(req.params.id), req.body);

            res.json(games);
        });

        this.router.patch('/visibility/:id', async (req: Request, res: Response) => {
            const games: Game[] = await this.gameManager.modifyGameVisibility(Number(req.params.id), req.body);

            res.json(games);
        });

        this.router.post('/', async (req: Request, res: Response) => {
            const games: Game[] = await this.gameManager.addGame(req.body);

            res.status(StatusCodes.CREATED).json(games);
        });

        this.router.delete('/:id', async (req: Request, res: Response) => {
            await this.gameManager.removeGame;

            res.status(StatusCodes.NO_CONTENT).send();
        });
    }
}
