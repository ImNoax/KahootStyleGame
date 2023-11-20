import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { MessageData } from '@common/message';
import { Subscription } from 'rxjs/internal/Subscription';
const SCROLL_SENSITIVITY = 5;
const MESSAGE_TIMEOUT = 5;

@Component({
    selector: 'app-chat-box',
    templateUrl: './chat-box.component.html',
    styleUrls: ['./chat-box.component.scss'],
})
export class ChatBoxComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('messagesContainer') private messagesContainer: ElementRef;
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
            this.messages.push(newMessage);
            this.scrollChatBottom();
        });
    }

    ngOnDestroy() {
        if (this.chatSubscription) {
            this.chatSubscription.unsubscribe();
        }
    }
    ngAfterViewInit() {
        this.scrollChatBottom();
    }

    sendMessage() {
        if (this.newMessage.trim().length > 0) {
            const messageData = {
                sender: 'unknown',
                content: this.newMessage,
                time: new Date(),
            };
            this.clientSocket.socket.emit('chatMessage', messageData);
            this.newMessage = '';
            this.scrollChatBottom();
        }
    }
    scrollChatBottom() {
        if (this.messagesContainer) {
            const chatComponent = this.messagesContainer.nativeElement;
            const isChatAtBottom = chatComponent.scrollHeight - chatComponent.scrollTop - chatComponent.clientHeight < SCROLL_SENSITIVITY;
            setTimeout(() => {
                // timeout car sinon la fonction s'execute avant l'arriver des messages
                if (isChatAtBottom) {
                    chatComponent.scrollTop = chatComponent.scrollHeight;
                }
            }, MESSAGE_TIMEOUT);
        }
    }
}
