import { FileManagerService } from '@app/services/file-manager.service';
import { Jeu } from '@common/game';
import { Service } from 'typedi';

@Service()
export class GameManagerService {
    constructor(private fileManager: FileManagerService) {}

    async getGames(): Promise<Jeu[]> {
        const fileBuffer: Buffer = await this.fileManager.readJsonFile('./data/jeux.json');
        return JSON.parse(fileBuffer.toString());
    }

    async exportGame(id: number): Promise<string> {
        const games: Jeu[] = await this.getGames();
        const gameToExport: Jeu = games[id];
        const file = `./data/jeu${id}.json`;

        delete gameToExport.isVisible;
        await this.fileManager.writeJsonFile(file, JSON.stringify(gameToExport, null, 4));

        return file;
    }

    async modifyGame(id: number, modifiedGame: Jeu): Promise<Jeu[]> {
        const games: Jeu[] = await this.getGames();
        games[id] = modifiedGame;

        this.fileManager.writeJsonFile('./data/jeux.json', JSON.stringify(games, null, 4));

        return games;
    }

    async modifyGameVisibility(id: number, newVisibility: { isVisible: boolean }): Promise<Jeu[]> {
        const games: Jeu[] = await this.getGames();
        games[id].isVisible = newVisibility.isVisible;

        this.fileManager.writeJsonFile('./data/jeux.json', JSON.stringify(games, null, 4));

        return games;
    }

    async addGame(newGame: Jeu): Promise<Jeu[]> {
        const games: Jeu[] = await this.getGames();
        games.push(newGame);

        this.fileManager.writeJsonFile('./data/jeux.json', JSON.stringify(games, null, 4));

        return games;
    }

    async removeGame(id: number): Promise<void> {
        const games: Jeu[] = await this.getGames();
        delete games[id];

        this.fileManager.writeJsonFile('./data/jeux.json', JSON.stringify(games, null, 4));
    }
}
