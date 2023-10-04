import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';
import { ButtonResponseComponent } from '@app/components/button-response/button-response.component';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { GameHandlingService } from '@app/services/game-handling.service';
import { Jeu, QuestionType } from '@common/jeu';
import { Subject, of } from 'rxjs';
import { GamePageComponent } from './game-page.component';

const MOCK_QUESTIONS = [
    {
        text: 'What is the capital of France?',
        points: 10,
        type: QuestionType.QCM,
        choices: [
            { answer: 'Paris', isCorrect: true },
            { answer: 'London', isCorrect: false },
            { answer: 'Berlin', isCorrect: false },
            { answer: 'Madrid', isCorrect: false },
        ],
    },
];

const MOCK_GAME: Jeu[] = [
    {
        id: 1,
        title: 'Game 1',
        description: 'Test ',
        duration: 5,
        lastModification: '2018-11-13',
        questions: [MOCK_QUESTIONS[0], MOCK_QUESTIONS[0]],
    },
];
describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameHandlingService>;
    let currentQuestionObservableSpy: Subject<string>;
    let scoreObservableSpy: Subject<number>;

    beforeEach(() => {
        currentQuestionObservableSpy = new Subject<string>();
        scoreObservableSpy = new Subject<number>();

        gameServiceSpy = jasmine.createSpyObj('GameHandlingService', ['getGames', 'setScore', 'setCurrentQuestionId']);
        gameServiceSpy.currentQuestion$ = currentQuestionObservableSpy.asObservable();
        gameServiceSpy.score$ = scoreObservableSpy.asObservable();
        gameServiceSpy.currentGameId = 0;
        gameServiceSpy.currentQuestionId = 0;

        TestBed.configureTestingModule({
            declarations: [GamePageComponent, SidebarComponent, ButtonResponseComponent, TimerComponent, MatIcon],
            providers: [{ provide: GameHandlingService, useValue: gameServiceSpy }],
        });

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialize correctly', () => {
        gameServiceSpy.getGames.and.returnValue(of(MOCK_GAME));
        component.ngOnInit();
        expect(component).toBeTruthy();
    });

    it('should unsubscribe on destroy', () => {
        gameServiceSpy.getGames.and.returnValue(of(MOCK_GAME));
        component.ngOnInit();
        const scoreSubSpy = spyOn(component['subscriptionScore'], 'unsubscribe');
        const questionSubSpy = spyOn(component['questionSubscription'], 'unsubscribe');
        component.ngOnDestroy();
        expect(scoreSubSpy).toHaveBeenCalled();
        expect(questionSubSpy).toHaveBeenCalled();
    });

    it('should update score on ngOnInit', () => {
        gameServiceSpy.getGames.and.returnValue(of(MOCK_GAME));
        const testScore = 50;
        component.ngOnInit();
        scoreObservableSpy.next(testScore);
        expect(component.score).toEqual(testScore);
    });

    it('should update question on ngOnInit', () => {
        const testQuestion = 'What is the capital of France?';
        gameServiceSpy.getGames.and.returnValue(of(MOCK_GAME));
        component.ngOnInit();
        currentQuestionObservableSpy.next(testQuestion);
        expect(component.currentQuestion).toEqual(testQuestion);
    });
});
