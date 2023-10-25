import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { Subscription } from 'rxjs/internal/Subscription';

@Component({
    selector: 'app-waiting-view-page',
    templateUrl: './waiting-view-page.component.html',
    styleUrls: ['./waiting-view-page.component.scss'],
})
export class WaitingViewPageComponent implements OnInit, OnDestroy {
    players: { socketId: string; name: string }[] = [];
    pin: string;
    isLocked: boolean;
    isOrganizer: boolean;
    gameStarted: boolean = false;
    private startGameSubscription: Subscription;

    constructor(
        public router: Router,
        private clientSocket: ClientSocketService,
        private gameHand: GameHandlingService,
    ) {}

    ngOnInit(): void {
        this.configureBaseSocketFeatures();
        this.clientSocket.send('getPlayers');
        this.clientSocket.send('getStatus');
        this.startGameSubscription = this.clientSocket.listenForStartGame().subscribe(() => {
            this.startGame();
        });
    }

    ngOnDestroy(): void {
        this.clientSocket.canAccessLobby = false;
        this.clientSocket.send('leaveLobby');
        if (this.startGameSubscription) {
            this.startGameSubscription.unsubscribe();
        }
    }

    getPlayers(): { socketId: string; name: string }[] {
        return this.players;
    }

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on(
            'latestPlayerList',
            (roomData: { pin: string; players: { socketId: string; name: string }[]; isLocked: boolean }) => {
                this.players = roomData.players;
                this.gameHand.setPlayers(this.players);
                this.pin = roomData.pin;
                this.isLocked = roomData.isLocked;
            },
        );

        this.clientSocket.socket.on('lobbyClosed', () => {
            if (!this.gameStarted) {
                // console.log('Lobby closed triggered');
                this.router.navigate(['/home']);
            }
        });

        this.clientSocket.socket.on('statusOrganizer', () => {
            this.isOrganizer = true;
        });

        this.clientSocket.socket.on('statusNotOrganizer', () => {
            this.isOrganizer = false;
        });

        this.clientSocket.socket.on('roomLocked', () => {
            this.isLocked = true;
        });

        this.clientSocket.socket.on('roomUnlocked', () => {
            this.isLocked = false;
        });
    }

    banPlayer(player: { socketId: string; name: string }) {
        this.clientSocket.send('banPlayer', player);
    }

    lockRoom() {
        this.clientSocket.send('lockRoom', true);
    }

    unlockRoom() {
        this.clientSocket.send('unlockRoom', true);
    }

    startGameEmit() {
        this.clientSocket.socket.emit('startGame', { pin: this.pin });
    }

    startGame() {
        this.gameStarted = true;
        this.router.navigate(['/game']);
    }
}
