import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { TimerService } from '@app/services/timer.service';
import { Game } from '@common/game';
import { GameMode } from '@common/game-mode';
import { ProgressBarComponent } from './progress-bar.component';

describe('ProgressBarComponent', () => {
    const GAME_MOCK: Game = {
        id: '',
        title: '',
        description: '',
        duration: 0,
        lastModification: '',
        questions: [],
    };

    let component: ProgressBarComponent;
    let fixture: ComponentFixture<ProgressBarComponent>;
    let gameHandlingServiceMock: jasmine.SpyObj<GameHandlingService>;
    let timeServiceMock: jasmine.SpyObj<TimerService>;
    let clientSocketServiceMock: jasmine.SpyObj<ClientSocketService>;

    beforeEach(() => {
        timeServiceMock = jasmine.createSpyObj('TimeService', ['startCountDown']);
        gameHandlingServiceMock = jasmine.createSpyObj('GameHandlingService', ['']);
        clientSocketServiceMock = jasmine.createSpyObj('ClientSocketService', ['']);

        TestBed.configureTestingModule({
            declarations: [ProgressBarComponent],
            imports: [MatSnackBarModule],
            providers: [
                { provide: GameHandlingService, useValue: gameHandlingServiceMock },
                { provide: TimerService, useValue: timeServiceMock },
                { provide: ClientSocketService, useValue: clientSocketServiceMock },
            ],
        });

        fixture = TestBed.createComponent(ProgressBarComponent);
        component = fixture.componentInstance;
        gameHandlingServiceMock.currentGame = GAME_MOCK;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('count getter should return count from TimerService', () => {
        const currentCount = 0;
        timeServiceMock.count = currentCount;
        expect(component.count).toEqual(currentCount);
    });

    it('isPanicModeEnabled getter should return isPanicModeEnabled from TimerService', () => {
        timeServiceMock.isPanicModeEnabled = true;
        expect(component.isPanicModeEnabled).toEqual(true);

        timeServiceMock.isPanicModeEnabled = false;
        expect(component.isPanicModeEnabled).toEqual(false);
    });

    it('currentGame getter should return currentGame from GameHandlingService', () => {
        expect(component.currentGame).toEqual(GAME_MOCK);
    });

    it('should start countDown on component initialization if the player is the organizer', () => {
        clientSocketServiceMock.isOrganizer = true;
        gameHandlingServiceMock.gameMode = GameMode.Testing;
        component.ngOnInit();
        expect(timeServiceMock.startCountDown).toHaveBeenCalledWith(GAME_MOCK.duration);
    });

    it('should start countDown on component initialization if the player is a tester', () => {
        gameHandlingServiceMock.gameMode = GameMode.Testing;
        clientSocketServiceMock.isOrganizer = false;
        component.ngOnInit();
        expect(timeServiceMock.startCountDown).toHaveBeenCalledWith(GAME_MOCK.duration);
    });

    it('should not start countDown on component initialization if the player is not the organizer or a tester', () => {
        gameHandlingServiceMock.gameMode = GameMode.RealGame;
        clientSocketServiceMock.isOrganizer = false;
        component.ngOnInit();
        expect(timeServiceMock.startCountDown).not.toHaveBeenCalledWith(GAME_MOCK.duration);
    });
});
