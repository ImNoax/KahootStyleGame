/* eslint-disable max-lines */
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ClientSocketServiceMock } from '@app/classes/client-socket-service-mock';
import { SocketMock } from '@app/classes/socket-mock';
import { ButtonResponseComponent } from '@app/components/button-response/button-response.component';
import { PAUSE_MESSAGE, TIME_OUT, UNPAUSE_MESSAGE } from '@app/constants/in-game';
import { SNACK_BAR_ERROR_CONFIGURATION, SNACK_BAR_NORMAL_CONFIGURATION } from '@app/constants/snack-bar-configuration';
import { Route } from '@app/enums';
import { Button } from '@app/interfaces/button-model';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { TimerService } from '@app/services/timer.service';
import { Game, Question, QuestionType } from '@common/game';
import { GameMode } from '@common/game-mode';
import { Limit } from '@common/limit';

describe('ButtonResponseComponent', () => {
    const MOCK_BUTTONS: Button[] = [
        {
            color: 'white',
            selected: false,
            text: 'Test1',
            isCorrect: true,
            id: 1,
        },
        {
            color: 'white',
            selected: false,
            text: 'Test2',
            isCorrect: false,
            id: 2,
        },
        {
            color: 'white',
            selected: true,
            text: 'Test3',
            isCorrect: true,
            id: 3,
        },
        {
            color: 'white',
            selected: true,
            text: 'Test4',
            isCorrect: false,
            id: 4,
        },
    ];

    const MOCK_QUESTIONS: Question[] = [
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
        {
            text: 'Question 2',
            points: 10,
            type: QuestionType.QRL,
        },
    ];

    const MOCK_GAME: Game = {
        id: '1',
        title: 'Game 1',
        description: 'Test ',
        duration: 5,
        lastModification: '2018-11-13',
        questions: MOCK_QUESTIONS,
    };
    let component: ButtonResponseComponent;
    let fixture: ComponentFixture<ButtonResponseComponent>;
    let routerMock: jasmine.SpyObj<Router>;
    let timerMock: jasmine.SpyObj<TimerService>;
    let gameHandlingServiceMock: jasmine.SpyObj<GameHandlingService>;
    let snackBarMock: jasmine.SpyObj<MatSnackBar>;
    let clientSocketServiceMock: ClientSocketServiceMock;
    let socketMock: SocketMock;

    beforeEach(() => {
        routerMock = jasmine.createSpyObj('Router', ['navigate']);
        timerMock = jasmine.createSpyObj('Timer', ['reset', 'startCountDown', 'stopCountDown']);
        gameHandlingServiceMock = jasmine.createSpyObj('GameHandlingService', [
            'setCurrentQuestionId',
            'setCurrentQuestion',
            'incrementScore',
            'getCurrentQuestionDuration',
        ]);
        snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
        clientSocketServiceMock = new ClientSocketServiceMock();
        gameHandlingServiceMock.currentGame = MOCK_GAME;
        gameHandlingServiceMock.currentQuestionId = 0;
        TestBed.configureTestingModule({
            declarations: [ButtonResponseComponent],
            imports: [HttpClientTestingModule, MatSnackBarModule],
            providers: [
                { provide: ClientSocketService, useValue: clientSocketServiceMock },
                { provide: Router, useValue: routerMock },
                { provide: TimerService, useValue: timerMock },
                { provide: GameHandlingService, useValue: gameHandlingServiceMock },
                { provide: MatSnackBar, useValue: snackBarMock },
            ],
        });
        fixture = TestBed.createComponent(ButtonResponseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        socketMock = clientSocketServiceMock.socket as unknown as SocketMock;
        spyOn(socketMock, 'emit').and.callThrough();
        socketMock.clientUniqueEvents.clear();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('isOrganizer getter should get isOrganizer from the ClientSocketService', () => {
        clientSocketServiceMock.isOrganizer = true;
        expect(component.isOrganizer).toEqual(clientSocketServiceMock.isOrganizer);
    });

    it('pauseMessage getter should return unpause message if game is paused', () => {
        component.isGamePaused = true;
        expect(component.pauseMessage).toEqual(UNPAUSE_MESSAGE);
    });

    it('pauseMessage getter should return pause message if game is not paused', () => {
        component.isGamePaused = false;
        expect(component.pauseMessage).toEqual(PAUSE_MESSAGE);
    });

    it('questionType getter should return current question type', () => {
        gameHandlingServiceMock.currentQuestionId = 0;
        expect(component.questionType).toEqual(MOCK_GAME.questions[0].type);
    });

    it('isPanicModeEnabled getter should get isPanicModeEnabled from the TimerService', () => {
        timerMock.isPanicModeEnabled = true;
        expect(component.isPanicModeEnabled).toBeTrue();

        timerMock.isPanicModeEnabled = false;
        expect(component.isPanicModeEnabled).toBeFalse();
    });

    it('isPanicModeAvailable getter should return true if the current count is lower or equal than the required count for panic mode', () => {
        const count = 10;
        timerMock.count = count;
        gameHandlingServiceMock.currentQuestionId = 0;
        expect(component.isPanicModeAvailable).toBeTrue();

        gameHandlingServiceMock.currentQuestionId = 1;
        expect(component.isPanicModeAvailable).toBeTrue();
    });

    it('isPanicModeAvailable getter should return false if the current count is greater than the required count for panic mode', () => {
        const count = 30;
        timerMock.count = count;
        gameHandlingServiceMock.currentQuestionId = 0;
        expect(component.isPanicModeAvailable).toBeFalse();

        gameHandlingServiceMock.currentQuestionId = 1;
        expect(component.isPanicModeAvailable).toBeFalse();
    });

    it('remainingCountForPanic should return remaining count for panic mode to be available for a QCM', () => {
        const count = 5;
        component.currentGame = MOCK_GAME;
        timerMock.count = count;
        gameHandlingServiceMock.currentQuestionId = 0;
        expect(component.remainingCountForPanic).toEqual(count - Limit.QcmRequiredPanicCount);
    });

    it('remainingCountForPanic should return remaining count for panic mode to be available for a QRL', () => {
        const count = 5;
        component.currentGame = MOCK_GAME;
        timerMock.count = count;
        gameHandlingServiceMock.currentQuestionId = 1;
        expect(component.remainingCountForPanic).toEqual(count - Limit.QrlRequiredPanicCount);
    });

    it('isQuestionTransition getter should get isQuestionTransition from the TimerService', () => {
        timerMock.isQuestionTransition = true;
        expect(component.isQuestionTransition).toBeTrue();

        timerMock.isQuestionTransition = false;
        expect(component.isQuestionTransition).toBeFalse();
    });

    it('should get currentGame from GameHandlingService, call updateButtons and configureBaseSocketFeatures on component initialization', () => {
        spyOn(component, 'updateButtons');
        spyOn(component, 'configureBaseSocketFeatures');
        component.ngOnInit();
        expect(component.currentGame).toEqual(MOCK_GAME);
        expect(component.updateButtons).toHaveBeenCalled();
        expect(component.configureBaseSocketFeatures).toHaveBeenCalled();
    });

    it('should unsubscribe from timerSubscription on component destruction', () => {
        component.timerSubscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
        component.ngOnDestroy();
        const unsubscribeTimerSubscription = component.timerSubscription.unsubscribe;
        expect(unsubscribeTimerSubscription).toHaveBeenCalled();
    });

    it('should remove listeners on component destruction', () => {
        spyOn(socketMock, 'removeAllListeners');
        component.ngOnDestroy();
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('allSubmitted');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('panicMode');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('countDownEnd');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('noPlayers');
    });

    it('should handle allSubmitted event by calling processAnswer', () => {
        spyOn(component, 'processAnswer');
        socketMock.simulateServerEmit('allSubmitted');
        expect(component.processAnswer).toHaveBeenCalled();
    });

    it("should handle allSubmitted event by giving a bonus if the player's socket id matches bonusRecipient", () => {
        const bonusRecipientSocketId = '1';
        component.hasBonus = false;
        clientSocketServiceMock.socket.id = bonusRecipientSocketId;
        socketMock.simulateServerEmit('allSubmitted', bonusRecipientSocketId);
        expect(component.hasBonus).toBeTrue();
    });

    it('should handle allSubmitted event by stopping the countdown and setting canLoadNextQuestion and hasQuestionEnded to true\
        if player is the organizer', () => {
        const bonusRecipientSocketId = '1';
        clientSocketServiceMock.socket.id = '0';
        clientSocketServiceMock.isOrganizer = true;
        component.canLoadNextQuestion = false;
        component.hasQuestionEnded = false;
        spyOn(component, 'processAnswer');

        socketMock.simulateServerEmit('allSubmitted', bonusRecipientSocketId);
        expect(timerMock.stopCountDown).toHaveBeenCalled();
        expect(component.canLoadNextQuestion).toBeTrue();
        expect(component.hasQuestionEnded).toBeTrue();
        expect(component.processAnswer).not.toHaveBeenCalled();
    });

    it('should handle panicMode event by setting isPanicModeEnabled to true and playing the audio', () => {
        spyOn(component.audio, 'load');
        spyOn(component.audio, 'play');

        timerMock.isPanicModeEnabled = false;
        socketMock.simulateServerEmit('panicMode');
        expect(timerMock.isPanicModeEnabled).toBeTrue();
        expect(component.audio.load).toHaveBeenCalled();
        expect(component.audio.play).toHaveBeenCalled();
    });

    it('should handle countDownEnd event by loading the next question if isQuestionTransition from TimerService is true', () => {
        timerMock.isQuestionTransition = true;
        spyOn(component, 'loadNextQuestion');
        socketMock.simulateServerEmit('countDownEnd');
        expect(component.loadNextQuestion).toHaveBeenCalled();
    });

    it('should handle countDownEnd event by calling onTimerEnded if isQuestionTransition from TimerService is false', () => {
        timerMock.isQuestionTransition = false;
        spyOn(component, 'onTimerEnded');
        socketMock.simulateServerEmit('countDownEnd');
        expect(component.onTimerEnded).toHaveBeenCalled();
    });

    it('should handle noPlayers event by opening a snack bar, stopping the timer and setting canLoadNextQuestion to false', () => {
        component.hasQuestionEnded = false;
        component.canLoadNextQuestion = true;
        socketMock.simulateServerEmit('noPlayers');
        expect(snackBarMock.open).toHaveBeenCalledWith('Tous les joueurs ont quitté la partie.', '', SNACK_BAR_ERROR_CONFIGURATION);
        expect(timerMock.stopCountDown).toHaveBeenCalled();
        expect(component.hasQuestionEnded).toBeTrue();
        expect(component.canLoadNextQuestion).toBeFalse();
    });

    it('ngAfterViewInit should focus on buttonFocus', () => {
        const ngAfterViewInitSpy = spyOn(component.buttonFocus.nativeElement, 'focus');
        component.ngAfterViewInit();
        expect(ngAfterViewInitSpy).toHaveBeenCalled();
    });

    it('onTimerEnded should call verifyResponsesAndCallUpdate and set submittedFromTimer to true', () => {
        component.submittedFromTimer = false;
        spyOn(component, 'verifyResponsesAndCallUpdate');
        component.onTimerEnded();
        expect(component.verifyResponsesAndCallUpdate).toHaveBeenCalled();
        expect(component.submittedFromTimer).toBeTrue();
    });

    it('updateButtons should update buttons with correct game and possible texts', () => {
        const MOCK_BUTTONS_LENGTH = 4;
        gameHandlingServiceMock.currentQuestionId = 0;
        component.updateButtons();
        expect(component.buttons.length).toBe(MOCK_BUTTONS_LENGTH);
        expect(component.buttons[0].text).toBe('Paris');
        expect(component.buttons[0].isCorrect).toBe(true);
        component.updateGameQuestions();
        expect(component.updateButtons()).toBeUndefined();
    });

    it('updateButtons should populate histogram if game Mode is RealGame', () => {
        gameHandlingServiceMock.currentQuestionId = 0;
        gameHandlingServiceMock.gameMode = GameMode.RealGame;
        spyOn(component, 'populateHistogram');
        component.updateButtons();
        expect(component.populateHistogram).toHaveBeenCalled();
    });

    it('onButtonClick should toggle button.selected', () => {
        component.isProcessing = false;
        const testButton = MOCK_BUTTONS[1];
        component.onButtonClick(testButton);
        expect(testButton.selected).toBeTrue();
        component.onButtonClick(testButton);
        expect(testButton.selected).toBeFalse();
    });

    it('onButtonClick should do nothing if isProcessing is True', () => {
        const testButton = MOCK_BUTTONS[0];
        component.isProcessing = true;
        testButton.selected = false;
        component.onButtonClick(testButton);
        expect(testButton.selected).toBeFalse();
    });

    it('onButtonClick should call sendUpdateHistogram if game mode is RealGame', () => {
        const testButton = MOCK_BUTTONS[0];
        spyOn(clientSocketServiceMock, 'sendUpdateHistogram');
        component.isProcessing = false;
        gameHandlingServiceMock.gameMode = GameMode.RealGame;
        component.onButtonClick(testButton);
        expect(clientSocketServiceMock.sendUpdateHistogram).toHaveBeenCalled();
    });

    it('verifyResponsesAndCallUpdate should correctly process answer when text selected is correct', () => {
        component.buttons = [MOCK_BUTTONS[2]];
        gameHandlingServiceMock.gameMode = GameMode.Testing;
        spyOn(component, 'processAnswer');
        component.verifyResponsesAndCallUpdate();
        expect(component.isProcessing).toBeTrue();
        expect(component.processAnswer).toHaveBeenCalled();
        component.isProcessing = false;
        expect(component.verifyResponsesAndCallUpdate()).toBeUndefined();
    });

    it('verifyResponsesAndCallUpdate should process answer when selected number of correct texts don t match total correct texts', () => {
        component.buttons = [MOCK_BUTTONS[3], MOCK_BUTTONS[1]];
        const gameService = TestBed.inject(GameHandlingService);
        component.verifyResponsesAndCallUpdate();
        expect(gameService.incrementScore).not.toHaveBeenCalled();
        expect(component.isProcessing).toBeTrue();
    });

    it('verifyResponsesAndCallUpdate should correctly process texts when wrong text is selected', () => {
        component.buttons = [MOCK_BUTTONS[3]];

        const gameService = TestBed.inject(GameHandlingService);
        component.verifyResponsesAndCallUpdate();
        expect(gameService.incrementScore).not.toHaveBeenCalled();
        expect(component.isProcessing).toBeTrue();
    });

    it('verifyResponsesAndCallUpdate should do nothing if isProcessing is True', () => {
        component.buttons = [MOCK_BUTTONS[0]];
        component.isProcessing = true;
        const gameService = TestBed.inject(GameHandlingService);
        component.verifyResponsesAndCallUpdate();
        expect(gameService.incrementScore).not.toHaveBeenCalled();
    });

    it('playerEntries should call onButtonClick', () => {
        component.buttons = [MOCK_BUTTONS[0]];
        const event = new KeyboardEvent('keydown', { key: '1' });
        const onButtonClickSpy = spyOn(component, 'onButtonClick');
        component.playerEntries(event);
        expect(onButtonClickSpy).toHaveBeenCalled();
    });

    it('playerEntries should not work if isProcessing = true', () => {
        const event = new KeyboardEvent('keydown', { key: '1' });
        component.isProcessing = true;
        const onButtonClickSpy = spyOn(component, 'onButtonClick');
        component.playerEntries(event);
        expect(onButtonClickSpy).not.toHaveBeenCalled();
    });

    it('playerEntries should work with Enter when isProcessing is False', () => {
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        component.isProcessing = false;
        const onButtonClickSpy = spyOn(component, 'onButtonClick');
        const verifyResponsesAndCallUpdateSpy = spyOn(component, 'verifyResponsesAndCallUpdate');
        component.playerEntries(event);
        expect(onButtonClickSpy).not.toHaveBeenCalled();
        expect(verifyResponsesAndCallUpdateSpy).toHaveBeenCalled();
    });

    it('updateGameQuestions should navigate to game creation page if currentQuestionId equals last question and game mode is Testing', () => {
        gameHandlingServiceMock.currentQuestionId = component.currentGame.questions.length - 1;
        gameHandlingServiceMock.gameMode = GameMode.Testing;
        component.updateGameQuestions();
        expect(routerMock.navigate).toHaveBeenCalledWith([Route.GameCreation]);
    });

    it('updateGameQuestions should emit gameEnded event if currentQuestionId equals last question and game mode is RealGame', () => {
        gameHandlingServiceMock.currentQuestionId = component.currentGame.questions.length - 1;
        gameHandlingServiceMock.gameMode = GameMode.RealGame;
        component.updateGameQuestions();
        expect(socketMock.emit).toHaveBeenCalledWith('gameEnded');
    });

    // TEMPORAIRE. À revoir après la démo
    it('updateGameQuestions should set the current question to the next one, update the buttons if there is another question', () => {
        gameHandlingServiceMock.currentQuestionId = component.currentGame.questions.length - 2;
        // spyOn(component, 'updateButtons');
        spyOn(component.updateQuestionScore, 'emit');
        // spyOn(component.buttonFocus.nativeElement, 'focus');
        component.updateGameQuestions();
        expect(gameHandlingServiceMock.setCurrentQuestionId).toHaveBeenCalled();
        // expect(component.updateButtons).toHaveBeenCalled();
        expect(component.updateQuestionScore.emit).toHaveBeenCalled();
        expect(gameHandlingServiceMock.setCurrentQuestion).toHaveBeenCalled();
        // expect(component.buttonFocus.nativeElement.focus).toHaveBeenCalled();
    });

    it('updateGameQuestions should start countdown if there is another question and the player is the organizer', () => {
        const currentQuestionDuration = 10;
        gameHandlingServiceMock.currentQuestionId = component.currentGame.questions.length - 2;
        clientSocketServiceMock.isOrganizer = true;
        gameHandlingServiceMock.gameMode = GameMode.RealGame;
        gameHandlingServiceMock.getCurrentQuestionDuration.and.returnValue(currentQuestionDuration);

        component.updateGameQuestions();
        expect(gameHandlingServiceMock.getCurrentQuestionDuration).toHaveBeenCalled();
        expect(timerMock.startCountDown).toHaveBeenCalledWith(currentQuestionDuration);
    });

    it('updateGameQuestions should start countdown if there is another question and the player is a tester', () => {
        const currentQuestionDuration = 10;
        gameHandlingServiceMock.currentQuestionId = component.currentGame.questions.length - 2;
        clientSocketServiceMock.isOrganizer = false;
        gameHandlingServiceMock.gameMode = GameMode.Testing;
        gameHandlingServiceMock.getCurrentQuestionDuration.and.returnValue(currentQuestionDuration);

        component.updateGameQuestions();
        expect(gameHandlingServiceMock.getCurrentQuestionDuration).toHaveBeenCalled();
        expect(timerMock.startCountDown).toHaveBeenCalledWith(currentQuestionDuration);
    });

    it('processAnswer should open a snack bar and give points with bonus if answer is correct and the player has the bonus', () => {
        const bonusFactor = 1.2;
        let bonusTimes = 0;
        component.buttons = MOCK_BUTTONS;
        component.isAnswerCorrect = true;
        component.hasBonus = true;
        gameHandlingServiceMock.gameMode = GameMode.RealGame;
        component.bonusTimes = 0;
        component.processAnswer();
        expect(component.bonusTimes).toEqual(++bonusTimes);
        expect(socketMock.emit).toHaveBeenCalledWith('updateBonusTimes', bonusTimes);
        expect(gameHandlingServiceMock.incrementScore).toHaveBeenCalledWith(MOCK_GAME.questions[0].points * bonusFactor);
        expect(snackBarMock.open).toHaveBeenCalled();
    });

    it('processAnswer should always give bonus if the player is a tester', () => {
        const bonusFactor = 1.2;
        component.buttons = MOCK_BUTTONS;
        component.isAnswerCorrect = true;
        component.hasBonus = false;
        gameHandlingServiceMock.gameMode = GameMode.Testing;
        component.processAnswer();
        expect(gameHandlingServiceMock.incrementScore).toHaveBeenCalledWith(MOCK_GAME.questions[0].points * bonusFactor);
    });

    it('processAnswer should open a snack bar indicating that 0 points was rewarded', () => {
        component.buttons = MOCK_BUTTONS;
        component.isAnswerCorrect = false;
        component.processAnswer();
        expect(snackBarMock.open).toHaveBeenCalledWith('+0 points ❌', '', SNACK_BAR_NORMAL_CONFIGURATION);
    });

    it('processAnswer should restart countdown if the game mode is Testing', () => {
        component.buttons = MOCK_BUTTONS;
        gameHandlingServiceMock.gameMode = GameMode.Testing;
        component.processAnswer();
        expect(timerMock.startCountDown).toHaveBeenCalledWith(TIME_OUT, { isQuestionTransition: true });
    });

    it('processAnswer should not give a bonus if has bonus is false and the game mode is RealGame', () => {
        component.buttons = MOCK_BUTTONS;
        component.isAnswerCorrect = true;
        component.hasBonus = false;
        gameHandlingServiceMock.gameMode = GameMode.RealGame;
        component.processAnswer();
        expect(gameHandlingServiceMock.incrementScore).toHaveBeenCalledWith(MOCK_GAME.questions[0].points);
    });

    it('loadNextQuestion should call updateGameQuestions and reset every member', () => {
        spyOn(component, 'updateGameQuestions');
        component.isProcessing = true;
        component.submitted = true;
        component.hasBonus = true;
        component.isAnswerCorrect = false;
        component.submittedFromTimer = true;
        timerMock.isQuestionTransition = true;
        component.isGamePaused = true;
        component.hasQuestionEnded = true;
        component.buttons = MOCK_BUTTONS;
        component.loadNextQuestion();
        for (const button of component.buttons) {
            expect(button.showCorrectButtons).toBeFalse();
            expect(button.showWrongButtons).toBeFalse();
        }
        expect(component.isProcessing).toBeFalse();
        expect(component.submitted).toBeFalse();
        expect(component.hasBonus).toBeFalse();
        expect(component.isAnswerCorrect).toBeTrue();
        expect(component.submittedFromTimer).toBeFalse();
        expect(timerMock.isQuestionTransition).toBeFalse();
        expect(component.isGamePaused).toBeFalse();
        expect(component.hasQuestionEnded).toBeFalse();
        expect(component.updateGameQuestions).toHaveBeenCalled();
    });

    it('populateHistogram should call sendUpdateHistogram from ClientSocketService for each button', () => {
        spyOn(clientSocketServiceMock, 'sendUpdateHistogram');
        component.buttons = MOCK_BUTTONS;
        component.populateHistogram();
        expect(clientSocketServiceMock.sendUpdateHistogram).toHaveBeenCalledTimes(MOCK_BUTTONS.length);
        for (const button of component.buttons) expect(clientSocketServiceMock.sendUpdateHistogram).toHaveBeenCalledWith({ [button.text]: 0 });
    });

    it('startNextQuestionCountDown should reset histogram, start countdown and set canLoadNextQuestion as well as isGamePause to false', () => {
        spyOn(clientSocketServiceMock, 'sendResetHistogram');
        component.canLoadNextQuestion = true;
        component.isGamePaused = true;

        component.startNextQuestionCountDown();
        expect(clientSocketServiceMock.sendResetHistogram).toHaveBeenCalled();
        expect(component.canLoadNextQuestion).toBeFalse();
        expect(component.isGamePaused).toBeFalse();
        expect(timerMock.startCountDown).toHaveBeenCalledWith(TIME_OUT, { isQuestionTransition: true });
    });

    it('pause should restart transition countdown if game was paused during a question transition', () => {
        const transitionCount = 20;

        component.isGamePaused = true;
        timerMock.isQuestionTransition = true;
        timerMock.transitionCount = transitionCount;

        component.pause();
        expect(timerMock.startCountDown).toHaveBeenCalledWith(transitionCount);
        expect(component.isGamePaused).toBeFalse();
    });

    it('pause should restart countdown if game was paused during an ongoing question', () => {
        const count = 10;
        timerMock.isPanicModeEnabled = true;

        component.isGamePaused = true;
        timerMock.isQuestionTransition = false;
        timerMock.count = count;

        component.pause();
        expect(timerMock.startCountDown).toHaveBeenCalledWith(count, { isPanicModeEnabled: true });
        expect(component.isGamePaused).toBeFalse();
    });

    it('pause should stop countdown if game was not paused', () => {
        component.isGamePaused = false;

        component.pause();
        expect(timerMock.stopCountDown).toHaveBeenCalled();
        expect(component.isGamePaused).toBeTrue();
    });

    it('panic should emit enablePanicMode event and start countdown with configuration isPanicModeEnabled to true', () => {
        const currentCount = 10;
        timerMock.count = currentCount;
        component.panic();
        expect(socketMock.emit).toHaveBeenCalledWith('enablePanicMode');
        expect(timerMock.stopCountDown).toHaveBeenCalled();
        expect(timerMock.startCountDown).toHaveBeenCalledWith(currentCount, { isPanicModeEnabled: true });
    });
});
