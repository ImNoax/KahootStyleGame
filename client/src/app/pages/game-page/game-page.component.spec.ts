import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';
import { ClientSocketServiceMock } from '@app/classes/client-socket-service-mock';
import { SocketMock } from '@app/classes/socket-mock';
import { ButtonResponseComponent } from '@app/components/button-response/button-response.component';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { TimerComponent } from '@app/components/timer/timer.component';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { Game, QuestionType } from '@common/game';
import { Subject, of } from 'rxjs';
import { GamePageComponent } from './game-page.component';

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
describe('GamePageComponent', () => {
    let component: GamePageComponent;
    let fixture: ComponentFixture<GamePageComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameHandlingService>;
    let currentQuestionObservableSpy: Subject<string>;
    let scoreObservableSpy: Subject<number>;
    let clientSocketServiceMock: ClientSocketServiceMock;
    let socketMock: SocketMock;
    let nEmittedEvents: number;

    beforeEach(() => {
        currentQuestionObservableSpy = new Subject<string>();
        scoreObservableSpy = new Subject<number>();
        clientSocketServiceMock = new ClientSocketServiceMock(jasmine.createSpyObj('Router', ['']));
        gameServiceSpy = jasmine.createSpyObj('GameHandlingService', ['getGames', 'setScore', 'setCurrentQuestionId']);
        gameServiceSpy.currentQuestion$ = currentQuestionObservableSpy.asObservable();
        gameServiceSpy.score$ = scoreObservableSpy.asObservable();
        gameServiceSpy.currentGameId = '0';
        gameServiceSpy.currentQuestionId = 0;

        TestBed.configureTestingModule({
            declarations: [GamePageComponent, ButtonResponseComponent, TimerComponent, MatIcon, ChatBoxComponent],
            providers: [
                { provide: ClientSocketService, useValue: clientSocketServiceMock },
                { provide: GameHandlingService, useValue: gameServiceSpy },
            ],
        });

        fixture = TestBed.createComponent(GamePageComponent);
        component = fixture.componentInstance;
        socketMock = clientSocketServiceMock.socket as unknown as SocketMock;
        spyOn(socketMock, 'emit').and.callThrough();
        socketMock.clientUniqueEvents.clear();
        nEmittedEvents = 0;
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
        gameServiceSpy.currentGameId = '1';
        gameServiceSpy.getGames.and.returnValue(of(MOCK_GAME));
        component.ngOnInit();
        currentQuestionObservableSpy.next(testQuestion);
        expect(component.currentQuestion).toEqual(testQuestion);
    });

    it('leaveLobby should send "leaveLobby" with the clientSocketService', () => {
        component.leaveGame();
        expect(socketMock.emit).toHaveBeenCalledWith('leaveLobby');
        expect(socketMock.nEmittedEvents).toEqual(++nEmittedEvents);
    });
});
