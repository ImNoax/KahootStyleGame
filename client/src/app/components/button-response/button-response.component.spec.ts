import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ClientSocketServiceMock } from '@app/classes/client-socket-service-mock';
import { SocketMock } from '@app/classes/socket-mock';
import { ButtonResponseComponent } from '@app/components/button-response/button-response.component';
import { MOCK_BUTTONS, MOCK_GAME, TIME_OUT } from '@app/constants';
import { snackBarErrorConfiguration, snackBarNormalConfiguration } from '@app/constants/snack-bar-configuration';
import { Route } from '@app/enums';
import { ClientSocketService } from '@app/services/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { TimerService } from '@app/services/timer.service';
import { GameMode } from '@common/game-mode';

describe('ButtonResponseComponent', () => {
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
        gameHandlingServiceMock = jasmine.createSpyObj('GameHandlingService', ['setCurrentQuestionId', 'setCurrentQuestion', 'incrementScore']);
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
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('countDownEnd');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('canLoadNextQuestion');
        expect(socketMock.removeAllListeners).toHaveBeenCalledWith('noPlayers');
    });

    it('should handle allSubmitted event by calling processAnswer', () => {
        spyOn(component, 'processAnswer');
        socketMock.simulateServerEmit('allSubmitted');
        expect(component.processAnswer).toHaveBeenCalled();
    });

    it("should handle allSubmitted event by giving a bonus if the player's socket.id matches bonusRecipient", () => {
        const bonusRecipientSocketId = '1';
        component.hasBonus = false;
        clientSocketServiceMock.socket.id = bonusRecipientSocketId;
        socketMock.simulateServerEmit('allSubmitted', bonusRecipientSocketId);
        expect(component.hasBonus).toBeTrue();
    });

    it("should handle allSubmitted event by not giving a bonus if the player's socket.id doesn't match bonusRecipient", () => {
        const bonusRecipientSocketId = '1';
        component.hasBonus = false;
        clientSocketServiceMock.socket.id = '0';
        socketMock.simulateServerEmit('allSubmitted', bonusRecipientSocketId);
        expect(component.hasBonus).toBeFalse();
    });
    it('should handle countDownEnd event by loading the next question if isQuestionTransition from TimerService is true', () => {
        const lastCount = 0;
        timerMock.count = 10;
        timerMock.isQuestionTransition = true;
        spyOn(component, 'loadNextQuestion');
        socketMock.simulateServerEmit('countDownEnd', lastCount);
        expect(timerMock.count).toEqual(lastCount);
        expect(component.loadNextQuestion).toHaveBeenCalled();
    });

    it('should handle countDownEnd event by calling onTimerEnded if isQuestionTransition from TimerService is false', () => {
        const lastCount = 0;
        timerMock.count = 10;
        timerMock.isQuestionTransition = false;
        spyOn(component, 'onTimerEnded');
        socketMock.simulateServerEmit('countDownEnd', lastCount);
        expect(component.onTimerEnded).toHaveBeenCalled();
    });

    it('should handle canLoadNextQuestion event by calling stopCountDown and setting canLoadNextQuestion to true', () => {
        component.canLoadNextQuestion = false;
        socketMock.simulateServerEmit('canLoadNextQuestion');
        expect(timerMock.stopCountDown).toHaveBeenCalled();
        expect(component.canLoadNextQuestion).toBeTrue();
    });

    it('should handle noPlayers event by opening a snack bar, stop  the timer and setting canLoadNextQuestion to false', () => {
        component.canLoadNextQuestion = true;
        socketMock.simulateServerEmit('noPlayers');
        expect(snackBarMock.open).toHaveBeenCalledWith('Tous les joueurs ont quitté la partie.', '', snackBarErrorConfiguration);
        expect(timerMock.stopCountDown).toHaveBeenCalled();
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

    it('updateGameQuestions should navigate to create if currentQuestionId equals last question', () => {
        gameHandlingServiceMock.currentQuestionId = component.currentGame.questions.length - 1;
        gameHandlingServiceMock.gameMode = GameMode.Testing;
        component.updateGameQuestions();
        expect(timerMock.stopCountDown).toHaveBeenCalled();
        expect(routerMock.navigate).toHaveBeenCalledWith([Route.GameCreation]);
        gameHandlingServiceMock.gameMode = GameMode.RealGame;
        component.updateGameQuestions();
        expect(socketMock.emit).toHaveBeenCalledWith('gameEnded');
    });

    it('updateGameQuestions should set the current question to the next one, update the buttons and start the countdown if not last question', () => {
        gameHandlingServiceMock.currentQuestionId = component.currentGame.questions.length - 2;
        spyOn(component, 'updateButtons');
        spyOn(component.updateQuestionScore, 'emit');
        spyOn(component.buttonFocus.nativeElement, 'focus');
        component.updateGameQuestions();
        expect(gameHandlingServiceMock.setCurrentQuestionId).toHaveBeenCalled();
        expect(component.updateButtons).toHaveBeenCalled();
        expect(component.updateQuestionScore.emit).toHaveBeenCalled();
        expect(gameHandlingServiceMock.setCurrentQuestion).toHaveBeenCalled();
        expect(timerMock.startCountDown).toHaveBeenCalled();
        expect(component.buttonFocus.nativeElement.focus).toHaveBeenCalled();
    });

    it('processAnswer should stop the countdown, open a snack bar and increase or not score based on isAnswerCorrect', () => {
        const bonusFactor = 1.2;
        component.buttons = MOCK_BUTTONS;
        component.isAnswerCorrect = true;
        component.hasBonus = true;
        component.bonusTimes = 0;
        component.processAnswer();
        expect(timerMock.stopCountDown).toHaveBeenCalled();
        expect(socketMock.emit).toHaveBeenCalledWith('updateBonusTimes', 1);
        expect(gameHandlingServiceMock.incrementScore).toHaveBeenCalledWith(MOCK_GAME.questions[0].points * bonusFactor);
        expect(snackBarMock.open).toHaveBeenCalled();
    });

    it('processAnswer should restart countdown if the game mode is Testing', () => {
        component.buttons = MOCK_BUTTONS;
        component.isAnswerCorrect = false;
        gameHandlingServiceMock.gameMode = GameMode.Testing;
        component.processAnswer();
        expect(timerMock.startCountDown).toHaveBeenCalledWith(TIME_OUT, true);
        expect(snackBarMock.open).toHaveBeenCalledWith('+0 points ❌', '', snackBarNormalConfiguration);
    });

    it('loadNextQuestion should call updateGameQuestions and reset every member', () => {
        spyOn(component, 'updateGameQuestions');
        component.isProcessing = true;
        component.submitted = true;
        component.hasBonus = true;
        component.isAnswerCorrect = false;
        component.submittedFromTimer = true;
        timerMock.isQuestionTransition = true;
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
        expect(component.updateGameQuestions).toHaveBeenCalled();
    });

    it('populateHistogram should call sendUpdateHistogram from ClientSocketService for each button', () => {
        spyOn(clientSocketServiceMock, 'sendUpdateHistogram');
        component.buttons = MOCK_BUTTONS;
        component.populateHistogram();
        expect(clientSocketServiceMock.sendUpdateHistogram).toHaveBeenCalledTimes(MOCK_BUTTONS.length);
        for (const button of component.buttons) expect(clientSocketServiceMock.sendUpdateHistogram).toHaveBeenCalledWith({ [button.text]: 0 });
    });

    it('startNextQuestionCountDown should resetHstogram, start countdown and set canLoadNextQuestion to false', () => {
        spyOn(clientSocketServiceMock, 'sendResetHistogram');
        component.canLoadNextQuestion = true;
        component.startNextQuestionCountDown();
        expect(clientSocketServiceMock.sendResetHistogram).toHaveBeenCalled();
        expect(timerMock.startCountDown).toHaveBeenCalledWith(TIME_OUT, true);
        expect(component.canLoadNextQuestion).toBeFalse();
    });
});
