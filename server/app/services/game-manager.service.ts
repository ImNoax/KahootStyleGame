import { FileManagerService } from '@app/services/file-manager.service';
import { Game } from '@common/game';
import { Service } from 'typedi';

@Service()
export class GameManagerService {
    constructor(private fileManager: FileManagerService) {}

    async getGames(): Promise<Game[]> {
        const fileBuffer: Buffer = await this.fileManager.readJsonFile('./data/games.json');
        return JSON.parse(fileBuffer.toString());
    }

    async exportGame(id: number): Promise<string> {
        const games: Game[] = await this.getGames();
        const gameToExport: Game = games[id];
        const file = `./data/game${id}.json`;

        delete gameToExport.isVisible;
        await this.fileManager.writeJsonFile(file, JSON.stringify(gameToExport, null, 4));

        return file;
    }

    async modifyGame(id: number, modifiedGame: Game): Promise<Game[]> {
        const games: Game[] = await this.getGames();
        games[id] = modifiedGame;

        this.fileManager.writeJsonFile('./data/games.json', JSON.stringify(games, null, 4));

        return games;
    }

    async modifyGameVisibility(id: number, newVisibility: { isVisible: boolean }): Promise<Game[]> {
        const games: Game[] = await this.getGames();
        games[id].isVisible = newVisibility.isVisible;

        this.fileManager.writeJsonFile('./data/games.json', JSON.stringify(games, null, 4));

        return games;
    }

    async addGame(newGame: Game): Promise<Game[]> {
        const games: Game[] = await this.getGames();
        games.push(newGame);

        this.fileManager.writeJsonFile('./data/games.json', JSON.stringify(games, null, 4));

        return games;
    }

    async removeGame(id: number): Promise<void> {
        const games: Game[] = await this.getGames();
        delete games[id];

        this.fileManager.writeJsonFile('./data/games.json', JSON.stringify(games, null, 4));
    }
}
