import { FileManagerService } from '@app/services/file-manager.service';
import { Game } from '@common/jeu';
import { Service } from 'typedi';

const JSON_SPACE = 4;

@Service()
export class GameManagerService {
    constructor(private fileManager: FileManagerService) {}

    async getGames(): Promise<Game[]> {
        const fileBuffer: Buffer = await this.fileManager.readJsonFile('./data/jeux.json');
        return JSON.parse(fileBuffer.toString());
    }

    async exportGame(id: number): Promise<string> {
        const games: Game[] = await this.getGames();
        const gameToExport: Game = games[id];
        const file = `./data/Game${id}.json`;

        delete gameToExport.isVisible;
        await this.fileManager.writeJsonFile(file, JSON.stringify(gameToExport, null, JSON_SPACE));

        return file;
    }

    async modifyGame(id: number, modifiedGame: Game): Promise<Game[]> {
        const games: Game[] = await this.getGames();
        games[id] = modifiedGame;

        this.fileManager.writeJsonFile('./data/jeux.json', JSON.stringify(games, null, JSON_SPACE));

        return games;
    }

    async modifyGameVisibility(id: number, newVisibility: { isVisible: boolean }): Promise<Jeu[]> {
        const games: Jeu[] = await this.getGames();
        games[id].isVisible = newVisibility.isVisible;

        this.fileManager.writeJsonFile('./data/jeux.json', JSON.stringify(games, null, JSON_SPACE));

        return games;
    }

    async modifyGameVisibility(id: number, newVisibility: { isVisible: boolean }): Promise<Game[]> {
        const games: Game[] = await this.getGames();
        games[id].isVisible = newVisibility.isVisible;

        this.fileManager.writeJsonFile('./data/Gamex.json', JSON.stringify(games));

        return games;
    }

    async addGame(newGame: Game): Promise<Game[]> {
        const games: Game[] = await this.getGames();
        games.push(newGame);

        this.fileManager.writeJsonFile('./data/jeux.json', JSON.stringify(games, null, JSON_SPACE));

        return games;
    }

    async removeGame(id: number): Promise<void> {
        const games: Game[] = await this.getGames();
        delete games[id];

        this.fileManager.writeJsonFile('./data/jeux.json', JSON.stringify(games, null, JSON_SPACE));
    }
}
