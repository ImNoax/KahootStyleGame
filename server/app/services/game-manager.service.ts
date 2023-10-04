import { FileManagerService } from '@app/services/file-manager.service';
import { Jeu } from '@common/jeu';
import { Service } from 'typedi';

const JSON_SPACE = 4;
const NOT_FOUND_INDEX = -1;

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
        await this.fileManager.writeJsonFile(file, JSON.stringify(gameToExport, null, JSON_SPACE));

        return file;
    }

    async modifyGame(id: number, modifiedGame: Jeu, gameName: string): Promise<Jeu[]> {
        const games: Jeu[] = await this.getGames();
        if (id >= games.length || gameName !== games[id].title) {
            return this.addGame(modifiedGame);
        }
        games[id] = modifiedGame;

        this.fileManager.writeJsonFile('./data/jeux.json', JSON.stringify(games, null, JSON_SPACE));

        return games;
    }

    async modifyGameVisibility(id: number, newVisibility: { isVisible: boolean }): Promise<Jeu[]> {
        const games: Jeu[] = await this.getGames();
        const gameToUpdate = games.find((game) => game.id === id);

        if (gameToUpdate) {
            gameToUpdate.isVisible = newVisibility.isVisible;
            await this.fileManager.writeJsonFile('./data/jeux.json', JSON.stringify(games, null, JSON_SPACE));
        }

        return games;
    }

    async addGame(newGame: Jeu): Promise<Jeu[]> {
        const games: Jeu[] = await this.getGames();
        newGame.id = games.length;
        games.push(newGame);

        this.fileManager.writeJsonFile('./data/jeux.json', JSON.stringify(games, null, JSON_SPACE));

        return games;
    }
    async deleteGameById(id: number): Promise<void> {
        const games: Jeu[] = await this.getGames();
        if (id >= games.length) return;
        const index = games.findIndex((game) => game.id === id);
        if (index !== NOT_FOUND_INDEX) {
            games.splice(index, 1);
            for (let i = index; i < games.length; i++) {
                games[i].id = i;
            }
            await this.fileManager.writeJsonFile('./data/jeux.json', JSON.stringify(games, null, JSON_SPACE));
        }
    }
}
