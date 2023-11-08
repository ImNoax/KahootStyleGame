import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameHandlingService } from '@app/services/game-handling.service';
import { TimerService } from '@app/services/timer.service';
import { Game } from '@common/game';
import { ProgressBarComponent } from './progress-bar.component';

describe('ProgressBarComponent', () => {
    const gameMock: Game = {
        id: '',
        title: '',
        description: '',
        duration: 0,
        lastModification: '',
        questions: [],
    };

    const gameHandlingServiceMock: {
        currentGame: {
            duration: number;
        };
    } = { currentGame: gameMock };
    let component: ProgressBarComponent;
    let fixture: ComponentFixture<ProgressBarComponent>;
    let timeServiceMock: jasmine.SpyObj<TimerService>;

    beforeEach(() => {
        timeServiceMock = jasmine.createSpyObj('TimeService', ['startCountDown']);

        TestBed.configureTestingModule({
            declarations: [ProgressBarComponent],
            providers: [
                { provide: GameHandlingService, useValue: gameHandlingServiceMock },
                { provide: TimerService, useValue: timeServiceMock },
            ],
        });

        fixture = TestBed.createComponent(ProgressBarComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should assign currentGame from GameHandlingService to currentGame member on component initialization', () => {
        component.ngOnInit();
        expect(component.currentGame).toEqual(gameMock);
    });

    it('should start countDown on component initialization', () => {
        component.ngOnInit();
        expect(timeServiceMock.startCountDown).toHaveBeenCalledWith(gameMock.duration);
    });

    it('count getter should return count from TimerService', () => {
        const currentCount = 0;
        timeServiceMock.count = currentCount;
        expect(component.count).toEqual(currentCount);
    });
});
