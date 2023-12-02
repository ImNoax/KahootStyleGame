import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ClientSocketServiceMock } from '@app/classes/client-socket-service-mock';
import { SocketMock } from '@app/classes/socket-mock';
import { BONUS_FACTOR, TIME_OUT } from '@app/constants/in-game';
import { SNACK_BAR_NORMAL_CONFIGURATION } from '@app/constants/snack-bar-configuration';
import { Button } from '@app/interfaces/button-model';
import { ClientSocketService } from '@app/services/client-socket/client-socket.service';
import { GameHandlingService } from '@app/services/game-handling/game-handling.service';
import { TimerService } from '@app/services/timer/timer.service';
import { Game, Question, QuestionType } from '@common/game';
import { GameMode } from '@common/game-mode';
import { AnswerValidatorService } from './answer-validator.service';

describe('AnswerValidatorService', () => {
    let service: AnswerValidatorService;
    let clientSocketServiceMock: ClientSocketServiceMock;
    let gameHandlingServiceMock: jasmine.SpyObj<GameHandlingService>;
    let timerServiceMock: jasmine.SpyObj<TimerService>;
    let snackBarMock: jasmine.SpyObj<MatSnackBar>;
    let socketMock: SocketMock;
    let questionMocks: Question[];
    let gameMock: Game;
    let buttonMocks: Button[];

    beforeEach(() => {
        questionMocks = [
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

        gameMock = {
            id: '1',
            title: 'Game 1',
            description: 'Test ',
            duration: 5,
            lastModification: '2018-11-13',
            questions: [questionMocks[0], questionMocks[0]],
        };

        buttonMocks = [
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
        clientSocketServiceMock = new ClientSocketServiceMock();
        gameHandlingServiceMock = jasmine.createSpyObj('GameHandlingService', ['isCurrentQuestionQcm', 'incrementScore']);
        timerServiceMock = jasmine.createSpyObj('TimerService', ['startCountdown', 'stopCountdown']);
        snackBarMock = jasmine.createSpyObj('MatSnackBar', ['open']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, MatSnackBarModule],
            providers: [
                { provide: ClientSocketService, useValue: clientSocketServiceMock },
                { provide: GameHandlingService, useValue: gameHandlingServiceMock },
                { provide: MatSnackBar, useValue: snackBarMock },
                { provide: TimerService, useValue: timerServiceMock },
            ],
        });
        service = TestBed.inject(AnswerValidatorService);
        socketMock = clientSocketServiceMock.socket as unknown as SocketMock;
        gameHandlingServiceMock.gameMode = GameMode.RealGame;
        gameHandlingServiceMock.currentQuestionId = 0;
        gameHandlingServiceMock.currentGame = gameMock;
        service.buttons = buttonMocks;
        spyOn(socketMock, 'emit').and.callThrough();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    // it('verifyResponsesAndCallUpdate should correctly process answer when text selected is correct', () => {
    //     component.buttons = [mockButtons[2]];
    //     gameHandlingServiceMock.gameMode = GameMode.Testing;
    //     spyOn(component, 'processAnswer');
    //     component.verifyResponsesAndCallUpdate();
    //     expect(component.isProcessing).toBeTrue();
    //     expect(component.processAnswer).toHaveBeenCalled();
    //     component.isProcessing = false;
    //     expect(component.verifyResponsesAndCallUpdate()).toBeUndefined();
    // });

    // it('verifyResponsesAndCallUpdate should process answer when selected number of correct texts don t match total correct texts', () => {
    //     component.buttons = [mockButtons[3], mockButtons[1]];
    //     const gameService = TestBed.inject(GameHandlingService);
    //     component.verifyResponsesAndCallUpdate();
    //     expect(gameService.incrementScore).not.toHaveBeenCalled();
    //     expect(component.isProcessing).toBeTrue();
    // });

    // it('verifyResponsesAndCallUpdate should correctly process texts when wrong text is selected', () => {
    //     component.buttons = [mockButtons[3]];

    //     const gameService = TestBed.inject(GameHandlingService);
    //     component.verifyResponsesAndCallUpdate();
    //     expect(gameService.incrementScore).not.toHaveBeenCalled();
    //     expect(component.isProcessing).toBeTrue();
    // });

    // it('verifyResponsesAndCallUpdate should do nothing if isProcessing is True', () => {
    //     component.buttons = [mockButtons[0]];
    //     component.isProcessing = true;
    //     const gameService = TestBed.inject(GameHandlingService);
    //     component.verifyResponsesAndCallUpdate();
    //     expect(gameService.incrementScore).not.toHaveBeenCalled();
    // });

    it('processAnswer should open a snackBar indicating 0 points if game mode is QCM and the answer is wrong', () => {
        gameHandlingServiceMock.isCurrentQuestionQcm.and.returnValue(true);
        service.isAnswerCorrect = false;
        service.processAnswer();
        expect(snackBarMock.open).toHaveBeenCalledWith('+0 points ❌', '', SNACK_BAR_NORMAL_CONFIGURATION);
    });

    it('processAnswer should open a snackBar indicating 0 points if the game mode is Testing and the answer is wrong', () => {
        gameHandlingServiceMock.isCurrentQuestionQcm.and.returnValue(false);
        gameHandlingServiceMock.gameMode = GameMode.Testing;
        service.isAnswerCorrect = false;
        service.processAnswer();
        expect(snackBarMock.open).toHaveBeenCalledWith('+0 points ❌', '', SNACK_BAR_NORMAL_CONFIGURATION);
    });

    it('processAnswer should consider an answer as incorrect if the attributed points percentage is 0', () => {
        gameHandlingServiceMock.isCurrentQuestionQcm.and.returnValue(false);
        service.pointsPercentage = 0;
        service.processAnswer();
        expect(service.isAnswerCorrect).toBeFalse();
    });

    it('processAnswer should consider an answer as correct if the attributed points percentage is greater than 0', () => {
        gameHandlingServiceMock.isCurrentQuestionQcm.and.returnValue(false);
        service.pointsPercentage = 0.5;
        service.processAnswer();
        expect(service.isAnswerCorrect).toBeTrue();
    });

    it('processAnswer should start countdown if the game mode is Testing', () => {
        gameHandlingServiceMock.gameMode = GameMode.Testing;
        service.processAnswer();
        expect(timerServiceMock.startCountdown).toHaveBeenCalledWith(TIME_OUT, { isQuestionTransition: true });
    });

    it('giveBonus should give bonus if the current question is QCM and the player has the bonus', () => {
        const currentRewardedPoints = 10;
        gameHandlingServiceMock.isCurrentQuestionQcm.and.returnValue(true);
        gameHandlingServiceMock.gameMode = GameMode.RealGame;
        service.hasBonus = true;
        expect(service['giveBonus'](currentRewardedPoints)).toEqual(currentRewardedPoints * BONUS_FACTOR);
    });

    it('giveBonus should give bonus if the current question is QCM and the game mode is testing', () => {
        const currentRewardedPoints = 10;
        gameHandlingServiceMock.isCurrentQuestionQcm.and.returnValue(true);
        gameHandlingServiceMock.gameMode = GameMode.Testing;
        service.hasBonus = false;
        expect(service['giveBonus'](currentRewardedPoints)).toEqual(currentRewardedPoints * BONUS_FACTOR);
    });

    it('giveBonus should increment bonusTimes and emit updateBonusTimes event if the player gets a bonus', () => {
        const currentRewardedPoints = 10;
        gameHandlingServiceMock.isCurrentQuestionQcm.and.returnValue(true);
        gameHandlingServiceMock.gameMode = GameMode.Testing;
        service.bonusTimes = 0;
        service['giveBonus'](currentRewardedPoints);
        expect(service.bonusTimes).toEqual(1);
        expect(socketMock.emit).toHaveBeenCalledWith('updateBonusTimes', service.bonusTimes);
    });

    it('giveBonus should not give bonus if the current question is QRL', () => {
        const currentRewardedPoints = 10;
        gameHandlingServiceMock.isCurrentQuestionQcm.and.returnValue(false);
        gameHandlingServiceMock.gameMode = GameMode.Testing;
        service.hasBonus = true;
        expect(service['giveBonus'](currentRewardedPoints)).toEqual(0);
    });

    it('prepareNextQuestion should reinitialize necessary properties for the next question', () => {
        service.rewardMessage = '10 points';
        service.isProcessing = true;
        service.hasBonus = true;
        service.isAnswerCorrect = false;
        service.pointsPercentage = 1;
        service.answerForm = new FormControl('');
        spyOn(service.answerForm, 'reset');
        spyOn(service.answerForm, 'enable');

        service.prepareNextQuestion();
        for (const button of service.buttons) {
            expect(button.showCorrectButtons).toBeFalse();
            expect(button.showWrongButtons).toBeFalse();
            expect(button.selected).toBeFalse();
        }
        expect(service.rewardMessage).toEqual('');
        expect(service.isProcessing).toBeFalse();
        expect(service.hasBonus).toBeFalse();
        expect(service.isAnswerCorrect).toBeTrue();
        expect(service.pointsPercentage).toBeUndefined();
        expect(service.answerForm.reset).toHaveBeenCalled();
        expect(service.answerForm.enable).toHaveBeenCalled();
    });

    it('reset should reinitialize every property by calling prepareNextQuestion and reinitializing buttons and bonusTimes', () => {
        spyOn(service, 'prepareNextQuestion');
        service.bonusTimes = 10;
        service.reset();
        expect(service.prepareNextQuestion).toHaveBeenCalled();
        expect(service.buttons).toEqual([]);
        expect(service.bonusTimes).toEqual(0);
    });
});
