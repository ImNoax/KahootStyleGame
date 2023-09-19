import { FileManagerService } from '@app/services/file-manager.service';
import { Jeu } from '@common/jeu';
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
        await this.fileManager.writeJsonFile(file, JSON.stringify(gameToExport));

        return file;
    }

    async modifyGame(id: number, modifiedGame: Jeu): Promise<Jeu[]> {
        const games: Jeu[] = await this.getGames();
        games[id] = modifiedGame;

        this.fileManager.writeJsonFile('./data/jeux.json', JSON.stringify(games));

        return games;
    }

    async addGame(id: number, newGame: Jeu): Promise<Jeu[]> {
        const games: Jeu[] = await this.getGames();
        games.push(newGame);

        this.fileManager.writeJsonFile('./data/jeux.json', JSON.stringify(games));

        return games;
    }

    async removeGame(id: number): Promise<void> {
        const games: Jeu[] = await this.getGames();
        delete games[id];

        this.fileManager.writeJsonFile('./data/jeux.json', JSON.stringify(games));
    }
}
