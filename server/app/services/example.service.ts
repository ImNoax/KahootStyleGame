import { DateService } from '@app/services/date.service';
import { Jeu } from '@common/jeu';
import { Message } from '@common/message';
import * as fs from 'fs';
import { Service } from 'typedi';

@Service()
export class ExampleService {
    clientMessages: Message[];

    constructor(private readonly dateService: DateService) {
        this.clientMessages = [];
    }

    about(): Message {
        return {
            title: 'Basic Server About Page',
            body: 'Try calling /api/docs to get the documentation',
        };
    }

    async readJsonFile(path: string): Promise<Buffer> {
        return await fs.promises.readFile(path);
    }

    async getGames(): Promise<Jeu[]> {
        const fileBuffer: Buffer = await this.readJsonFile("./data/jeux.json");
        return JSON.parse(fileBuffer.toString());
    }

    async helloWorld(): Promise<Message> {
        return this.dateService
            .currentTime()
            .then((timeMessage: Message) => {
                return {
                    title: 'Hello world',
                    body: 'Time is ' + timeMessage.body,
                };
            })
            .catch((error: unknown) => {
                return {
                    title: 'Error',
                    body: error as string,
                };
            });
    }

    // TODO : ceci est à titre d'exemple. À enlever pour la remise
    storeMessage(message: Message): void {
        // eslint-disable-next-line no-console
        console.log(message);
        this.clientMessages.push(message);
    }

    getAllMessages(): Message[] {
        return this.clientMessages;
    }
}
