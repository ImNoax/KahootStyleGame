import { Injectable } from '@angular/core';
import { ClientSocketService } from './client-socket.service';
import { GameHandlingService } from './game-handling.service';

@Injectable({
    providedIn: 'root',
})
export class TimerService {
    count: number = 0;
    transitionCount: number = 0;
    transitionMessage: string = '';
    isQuestionTransition: boolean = false;

    constructor(
        private clientSocket: ClientSocketService,
        private gameHandler: GameHandlingService,
    ) {
        this.listenForCountDown();
    }

    listenForCountDown() {
        this.clientSocket.socket.on('countDown', (newCount: number) => {
            if (this.isQuestionTransition) {
                this.transitionCount = newCount;
                return;
            }
            this.count = newCount;
        });

        this.clientSocket.socket.on('isQuestionTransition', (isQuestionTransition: boolean) => {
            this.isQuestionTransition = isQuestionTransition;

            if (isQuestionTransition) {
                let nextQuestionMessage = '';
                if (this.gameHandler.currentQuestionId === this.gameHandler.currentGame.questions.length - 1) nextQuestionMessage = 'Résultats';
                else nextQuestionMessage = 'Prochaine question';
                this.transitionMessage = nextQuestionMessage;
            }
        });
    }

    startCountDown(initialCount: number, isQuestionTransition?: boolean) {
        if (isQuestionTransition) this.transitionCount = initialCount;
        else this.count = initialCount;

        this.clientSocket.socket.emit('startCountDown', initialCount, isQuestionTransition, this.gameHandler.gameMode);
    }

    stopCountDown() {
        this.clientSocket.socket.emit('stopCountDown');
    }

    reset() {
        this.stopCountDown();
        this.count = 0;
        this.transitionCount = 0;
        this.isQuestionTransition = false;
    }
}
