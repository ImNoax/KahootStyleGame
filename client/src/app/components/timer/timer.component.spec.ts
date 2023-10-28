import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GameHandlingService } from '@app/services/game-handling.service';
import { TimeService } from '@app/services/time.service';
import { Game, QuestionType } from '@common/game';
import { of } from 'rxjs';
import { TimerComponent } from './timer.component';

const MOCK_QUESTIONS = [
    {
        text: 'What is the capital of France?',
        points: 10,
        type: QuestionType.QCM,
        choices: [
            { text: 'Paris', isCorrect: true },
            { text: 'London', isCorrect: false },
            { text: 'Berlin', isCorrect: false },
            { text: 'Madrid', isCorrect: false },
        ],
    },
];

const MOCK_GAME: Game[] = [
    {
        id: '1',
        title: 'Game 1',
        description: 'Test ',
        duration: 5,
        lastModification: '2018-11-13',
        questions: [MOCK_QUESTIONS[0], MOCK_QUESTIONS[0]],
    },
];
describe('TimerComponent', () => {
    let component: TimerComponent;
    let fixture: ComponentFixture<TimerComponent>;
    let timeServiceSpy: jasmine.SpyObj<TimeService>;
    let gameServiceSpy: jasmine.SpyObj<GameHandlingService>;

    beforeEach(() => {
        timeServiceSpy = jasmine.createSpyObj('TimeService', ['startTimer', 'stopTimer']);
        gameServiceSpy = jasmine.createSpyObj('GameHandlingService', ['getGames']);

        TestBed.configureTestingModule({
            declarations: [TimerComponent],
            providers: [
                { provide: TimeService, useValue: timeServiceSpy },
                { provide: GameHandlingService, useValue: gameServiceSpy },
            ],
        });

        fixture = TestBed.createComponent(TimerComponent);
        component = fixture.componentInstance;
    });
    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should get games and start initialization', () => {
        gameServiceSpy.getGames.and.returnValue(of(MOCK_GAME));
        gameServiceSpy.currentGameId = '1';
        component.ngOnInit();
        expect(gameServiceSpy.getGames).toHaveBeenCalled();
    });
    it('should stop timer on ngOnDestroy', () => {
        component.ngOnDestroy();
        expect(timeServiceSpy.stopTimer).toHaveBeenCalled();
    });

    it('should return currentTime', () => {
        const durationGame = 10;
        Object.defineProperty(timeServiceSpy, 'time', { value: durationGame });
        const time = component.currentTime;
        expect(time).toEqual(durationGame);
    });
    it('should return total time for right gameId', () => {
        const durationGame0 = 5;
        gameServiceSpy.currentGameId = '1';
        component.games = MOCK_GAME;
        expect(component.totalTime).toEqual(durationGame0);
    });
});
