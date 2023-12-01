import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ClientSocketServiceMock } from '@app/classes/client-socket-service-mock';
import { SocketMock } from '@app/classes/socket-mock';
import { ButtonResponseComponent } from '@app/components/button-response/button-response.component';
import { ChatBoxComponent } from '@app/components/chat-box/chat-box.component';
import { ProgressBarComponent } from '@app/components/progress-bar/progress-bar.component';
import { Route } from '@app/constants/enums';
import { ClientSocketService } from '@app/services/client-socket/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling/game-handling.service';
import { RouteControllerService } from '@app/services/route-controller/route-controller.service';
import { TimerService } from '@app/services/timer/timer.service';
import { Game, QuestionType } from '@common/game';
import { GameMode } from '@common/game-mode';
import { Observable, Subject } from 'rxjs';
import { InGamePageComponent } from './in-game-page.component';

const QUESTIONS_MOCK = [
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

const GAME_MOCK: Game = {
    id: '1',
    title: 'Game 1',
    description: 'Test ',
    duration: 5,
    lastModification: '2018-11-13',
    questions: [QUESTIONS_MOCK[0], QUESTIONS_MOCK[0]],
};

describe('InGamePageComponent', () => {
    let component: InGamePageComponent;
    let fixture: ComponentFixture<InGamePageComponent>;
    let gameServiceSpy: jasmine.SpyObj<GameHandlingService>;
    let currentQuestionObservableSpy: Subject<string>;
    let scoreObservableSpy: Subject<number>;
    let routerMock: jasmine.SpyObj<Router>;
    let timerMock: jasmine.SpyObj<TimerService>;
    let clientSocketServiceMock: ClientSocketServiceMock;
    let socketMock: SocketMock;
    let nEmittedEvents: number;

    beforeEach(() => {
        currentQuestionObservableSpy = new Subject<string>();
        scoreObservableSpy = new Subject<number>();
        routerMock = jasmine.createSpyObj('Router', ['navigate']);
        timerMock = jasmine.createSpyObj('Timer', ['reset']);
        clientSocketServiceMock = new ClientSocketServiceMock();
        gameServiceSpy = jasmine.createSpyObj('GameHandlingService', [
            'getGames',
            'setScore',
            'setCurrentQuestionId',
            'getCorrectAnswersForCurrentQuestion',
            'updateHistogramDataForQuestion',
        ]);
        gameServiceSpy.currentQuestion$ = currentQuestionObservableSpy.asObservable();
        gameServiceSpy.score$ = scoreObservableSpy.asObservable();
        gameServiceSpy.currentQuestionId = 0;

        TestBed.configureTestingModule({
            declarations: [InGamePageComponent, ButtonResponseComponent, ProgressBarComponent, MatIcon, ChatBoxComponent],
            providers: [
                { provide: ClientSocketService, useValue: clientSocketServiceMock },
                { provide: GameHandlingService, useValue: gameServiceSpy },
                { provide: Router, useValue: routerMock },
                { provide: TimerService, useValue: timerMock },
            ],
            imports: [MatSnackBarModule],
        });

        fixture = TestBed.createComponent(InGamePageComponent);
        component = fixture.componentInstance;
        socketMock = clientSocketServiceMock.socket as unknown as SocketMock;
        spyOn(socketMock, 'emit').and.callThrough();
        socketMock.clientUniqueEvents.clear();
        gameServiceSpy.currentGame = GAME_MOCK;
        nEmittedEvents = 0;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('isOrganizer getter should get isOrganizer from the ClientSocketService', () => {
        clientSocketServiceMock.isOrganizer = true;
        expect(component.isOrganizer).toEqual(clientSocketServiceMock.isOrganizer);
    });

    it('isQuestionTransition getter should get isQuestionTransition from the TimerService', () => {
        timerMock.isQuestionTransition = true;
        expect(component.isQuestionTransition).toEqual(timerMock.isQuestionTransition);
    });

    it('transitionCount getter should get transitionCount from the TimerService', () => {
        timerMock.transitionCount = 10;
        expect(component.transitionCount).toEqual(timerMock.transitionCount);
    });

    it('transitionMessage getter should get transitionMessage from the TimerService', () => {
        timerMock.transitionMessage = 'message';
        expect(component.transitionMessage).toEqual(timerMock.transitionMessage);
    });

    it('should assign currentGame from GameHandlingService to currentGame member on component initialization', () => {
        component.ngOnInit();
        expect(component.currentGame).toEqual(GAME_MOCK);
    });

    it('should call setScore with 0 on component initialization', () => {
        component.ngOnInit();
        expect(gameServiceSpy.setScore).toHaveBeenCalledWith(0);
    });

    it('should subscribe to currentQuestion from GameHandlingService on component initialization', () => {
        const testQuestion = 'What is the capital of France?';

        component.ngOnInit();
        currentQuestionObservableSpy.next(testQuestion);
        expect(component.currentQuestion).toEqual(testQuestion);
    });

    it('should subscribe to score from GameHandlingService on component initialization', () => {
        const testScore = 50;
        component.ngOnInit();
        scoreObservableSpy.next(testScore);
        expect(component.score).toEqual(testScore);
        expect(socketMock.emit).toHaveBeenCalledWith('submitScore', testScore);
        expect(socketMock.nEmittedEvents).toEqual(++nEmittedEvents);
    });

    it('should subscribe to observable returned by listenUpdateHistogram from ClientSocketService on component initialization', () => {
        const histogramData = { test: 1 };
        const observable: Observable<{ [key: string]: number }> = new Observable((subscriber) => subscriber.next(histogramData));
        spyOn(clientSocketServiceMock, 'listenUpdateHistogram').and.returnValue(observable);

        component.ngOnInit();
        expect(clientSocketServiceMock.listenUpdateHistogram).toHaveBeenCalled();
        expect(component.histogramData).toEqual(histogramData);
    });

    it('should call setCurrentQuestionId on component initialization', () => {
        component.ngOnInit();
        expect(gameServiceSpy.setCurrentQuestionId).toHaveBeenCalledWith(0);
    });

    it('should set current question and current score on component initialization', () => {
        const currentQuestionId = 1;
        gameServiceSpy.currentQuestionId = currentQuestionId;
        gameServiceSpy.currentQuestionId = currentQuestionId;

        component.ngOnInit();
        expect(component.currentQuestion).toEqual(component.currentGame.questions[currentQuestionId].text);
        expect(component.currentQuestionScore).toEqual(component.currentGame.questions[currentQuestionId].points);
    });

    it('should handle showResults event by setting showResults member to true on component initialization', () => {
        component.ngOnInit();
        component.showResults = false;
        socketMock.simulateServerEmit('showResults');
        expect(component.showResults).toEqual(true);
    });

    it('should unsubscribe on component destruction', () => {
        component.ngOnInit();
        const scoreSubSpy = spyOn(component['subscriptionScore'], 'unsubscribe');
        const questionSubSpy = spyOn(component['questionSubscription'], 'unsubscribe');
        const histogramSubSpy = spyOn(component['histogramSubscription'], 'unsubscribe');

        component.ngOnDestroy();
        expect(scoreSubSpy).toHaveBeenCalled();
        expect(questionSubSpy).toHaveBeenCalled();
        expect(histogramSubSpy).toHaveBeenCalled();
    });

    it('should reset timer and remove listeners on component destruction', () => {
        spyOn(socketMock, 'removeAllListeners');
        component.ngOnDestroy();
        expect(timerMock.reset).toHaveBeenCalled();
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('showResults');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('qcmEnd');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('qrlEnd');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('qrlResults');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('panicMode');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('countdownEnd');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('noPlayers');
    });

    it('should call resetPlayerInfo from ClientSocketService and setRouteAccess from RouteControllerService on component destruction', () => {
        spyOn(clientSocketServiceMock, 'resetPlayerInfo');
        const routeController = TestBed.inject(RouteControllerService);
        spyOn(routeController, 'setRouteAccess');
        component.ngOnDestroy();
        expect(clientSocketServiceMock.resetPlayerInfo).toHaveBeenCalled();
        expect(routeController.setRouteAccess).toHaveBeenCalledWith(Route.InGame, false);
    });

    it('onUpdateQuestionScore should set currentQuestionScore member to score argument', () => {
        const newScore = 10;
        component.currentQuestionScore = 0;

        component.onUpdateQuestionScore(newScore);
        expect(component.currentQuestionScore).toEqual(newScore);
    });

    it("setEvaluationPhase should change the evaluation message and histogram's visibility", () => {
        component.isEvaluationMessageVisible = false;
        component.isHistogramVisible = true;

        component.setEvaluationPhase(true);
        expect(component.isEvaluationMessageVisible).toBeTrue();
        expect(component.isHistogramVisible).toBeFalse();
    });

    it('leaveGame should navigate to game creation page if game mode is Testing', () => {
        gameServiceSpy.gameMode = GameMode.Testing;
        component.leaveGame();
        expect(routerMock.navigate).toHaveBeenCalledWith([Route.GameCreation]);
    });

    it('leaveGame should navigate to main menu if game mode is RealGame', () => {
        gameServiceSpy.gameMode = GameMode.RealGame;
        component.leaveGame();
        expect(routerMock.navigate).toHaveBeenCalledWith([Route.MainMenu]);
    });
});
