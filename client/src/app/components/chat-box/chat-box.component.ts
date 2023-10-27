import { Component, OnDestroy, OnInit } from '@angular/core';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { MessageData } from '@common/message';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-chat-box',
    templateUrl: './chat-box.component.html',
    styleUrls: ['./chat-box.component.scss'],
})
export class ChatBoxComponent implements OnInit, OnDestroy {
    newMessage: string = '';
    messages: { sender: string; time: Date; content: string }[] = [];
    chatSubscription: Subscription;

    constructor(
        private clientSocket: ClientSocketService,
        private gameHand: GameHandlingService,
    ) {}

    ngOnInit() {
        this.chatSubscription = this.clientSocket.listenToMessageReceived().subscribe((messageData: MessageData) => {
            const newMessage = {
                sender: this.gameHand.getPlayerNameBySocketId(messageData.sender),
                content: messageData.content,
                time: new Date(messageData.time),
            };
            // console.log("Message received in chatbox from server:", newMessage);
            this.messages.push(newMessage);
        });
    }

    ngOnDestroy() {
        if (this.chatSubscription) {
            this.chatSubscription.unsubscribe();
        }
    }

    sendMessage() {
        if (this.newMessage.trim().length > 0) {
            const messageData = {
                sender: 'unknown',
                content: this.newMessage,
                time: new Date(),
            };
            this.clientSocket.socket.emit('chatMessage', messageData);
            // console.log("emited messageData to server", messageData);
            this.newMessage = '';
        }
    }
}
