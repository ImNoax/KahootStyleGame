import { FileManagerService } from '@app/services/file-manager.service';
import { Limits } from '@common/Limits';
import { Choice, Game, Question } from '@common/game';
import Ajv from 'ajv';
import * as randomstring from 'randomstring';
import { Service } from 'typedi';

const JSON_SPACE = 4;
const NOT_FOUND_INDEX = -1;
const ID_LENGTH = 6;

@Service()
export class GameManagerService {
    error: Error;
    constructor(private fileManager: FileManagerService) {}

    async getGames(): Promise<Game[]> {
        const fileBuffer: Buffer = await this.fileManager.readJsonFile('./data/games.json');
        return JSON.parse(fileBuffer.toString());
    }

    async exportGame(id: string): Promise<string> {
        const games: Game[] = await this.getGames();
        const gameToExport: Game = games.find((game) => game.id === id);
        const file = `./data/Game${id}.json`;

        delete gameToExport.isVisible;
        await this.fileManager.writeJsonFile(file, JSON.stringify(gameToExport, null, JSON_SPACE));

        return file;
    }

    async modifyGame(id: string, modifiedGame: Game): Promise<Game[]> {
        const games: Game[] = await this.getGames();
        const index = games.findIndex((game) => game.id === id);
        if (index !== NOT_FOUND_INDEX) {
            games[index] = modifiedGame;
            this.fileManager.writeJsonFile('./data/games.json', JSON.stringify(games, null, JSON_SPACE));
        } else {
            this.addGame(modifiedGame);
        }

        return games;
    }

    async modifyGameVisibility(id: string, newVisibility: { isVisible: boolean }): Promise<Game[]> {
        const games: Game[] = await this.getGames();
        const gameToUpdate = games.find((game) => game.id === id);

        if (gameToUpdate) {
            gameToUpdate.isVisible = newVisibility.isVisible;
            await this.fileManager.writeJsonFile('./data/games.json', JSON.stringify(games, null, JSON_SPACE));
        }

        return games;
    }

    async addGame(newGame: Game): Promise<Game[]> {
        const ajv = new Ajv({ allErrors: true });
        const schema = JSON.parse((await this.fileManager.readJsonFile('./data/game-schema.json')).toString());
        const games: Game[] = await this.getGames();
        do {
            newGame.id = randomstring.generate(ID_LENGTH);
        } while (games.find((game) => game.id === newGame.id));

        const valid = ajv.validate(schema, newGame) && this.validateGame(newGame);
        if (!valid) {
            if (ajv.errors) this.error = new Error(ajv.errors[0].instancePath + ' ' + ajv.errors[0].message);
            return null;
        }
        games.push(newGame);

        this.fileManager.writeJsonFile('./data/games.json', JSON.stringify(games, null, JSON_SPACE));

        return games;
    }

    validateGame(game: Game): boolean {
        if (game.title.length > Limits.MaxTitleLength) {
            this.error = new Error('Nom trop long');
            return false;
        }
        if (game.description.length === 0 || game.description.length > Limits.MaxDescriptionLength) {
            this.error = new Error('Description invalide');
            return false;
        }
        if (game.duration < Limits.MinDuration || game.duration > Limits.MaxDuration) {
            this.error = new Error('Temps invalide');
            return false;
        }
        if (game.questions.length === 0) {
            this.error = new Error('Questions invalides');
            return false;
        }
        return this.validateQuestions(game.questions);
    }

    validateQuestions(questions: Question[]): boolean {
        let choicesValid = true;
        for (const question of questions) {
            if (question.text.length === 0 || question.text.length > Limits.MaxQuestionLength) {
                this.error = new Error(`Question: "${question.text}" invalide`);
                return false;
            }
            if (question.points < Limits.MinPoints || question.points > Limits.MaxPoints) {
                this.error = new Error(`Points de la question: "${question.text}" invalides`);
                return false;
            }
            if (question.points % Limits.MinPoints !== 0) {
                this.error = new Error(`Points de la question: "${question.text}" invalides`);
                return false;
            }
            if (question.choices.length < Limits.MinChoicesNumber || question.choices.length > Limits.MaxChoicesNumber) {
                this.error = new Error(`Choix de la question: "${question.text}" invalides`);
                return false;
            }
            choicesValid = choicesValid && this.validateChoices(question.choices);
        }
        return choicesValid;
    }

    validateChoices(choices: Choice[]): boolean {
        let nBadChoices = 0;
        let nGoodChoices = 0;
        for (const choice of choices) {
            if (choice.text.length === 0 || choice.text.length > Limits.MaxChoiceLength) {
                this.error = new Error(`Choix: "${choice.text}" invalide`);
                return false;
            }
            if (choice.isCorrect) nGoodChoices++;
            else nBadChoices++;
        }
        if (nBadChoices < Limits.MinBadChoices) {
            this.error = new Error('Nombre de mauvais choix invalides');
            return false;
        }
        if (nGoodChoices < Limits.MinGoodChoices) {
            this.error = new Error('Nombre de bons choix invalides');
            return false;
        }

        return true;
    }

    async deleteGameById(id: string): Promise<void> {
        const games: Game[] = await this.getGames();
        const index = games.findIndex((game) => game.id === id);
        if (index !== NOT_FOUND_INDEX) {
            games.splice(index, 1);
            await this.fileManager.writeJsonFile('./data/games.json', JSON.stringify(games, null, JSON_SPACE));
        }
    }
}
