import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ButtonResponseComponent } from '@app/components/button-response/button-response.component';
import { Button } from '@app/interfaces/button-model';
import { GameHandlingService } from '@app/services/game-handling.service';
import { TimeService } from '@app/services/time.service';
import { Jeu, QuestionType } from '@common/jeu';
import { of } from 'rxjs';
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

describe('ButtonResponseComponent', () => {
    let component: ButtonResponseComponent;
    let fixture: ComponentFixture<ButtonResponseComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ButtonResponseComponent],
            imports: [HttpClientTestingModule],
            providers: [GameHandlingService, TimeService, Router],
        });
        fixture = TestBed.createComponent(ButtonResponseComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should get list of games &&  call update buttons', () => {
        const games: Jeu[] = [];
        const gameHandlingServiceGetGamesSpy = spyOn(TestBed.inject(GameHandlingService), 'getGames').and.returnValue(of(games));
        const updateButtonsSpy = spyOn(component, 'updateButtons');
        component.ngOnInit();
        expect(gameHandlingServiceGetGamesSpy).toHaveBeenCalled();
        expect(updateButtonsSpy).toHaveBeenCalled();
    });
    it('should call onTimerEnded when timerEnded has ended from timeService', () => {
        const timeService = TestBed.inject(TimeService);
        spyOn(timeService.timerEnded, 'emit').and.callThrough();
        const onTimerEndedSpy = spyOn(component, 'onTimerEnded');
        component.ngOnInit();
        timeService.timerEnded.emit();
        expect(onTimerEndedSpy).toHaveBeenCalled();
    });

    it('onButtonClick should change button selection to True', () => {
        const testButton = MOCK_BUTTONS[0];
        component.onButtonClick(testButton);
        expect(testButton.selected).toBeTrue();
        testButton.selected = false;
    });
    it('onButtonClick should do nothing if isProcessing is True', () => {
        const testButton = MOCK_BUTTONS[0];
        component.isProcessing = true;
        component.onButtonClick(testButton);
        expect(testButton.selected).toBeFalse();
    });

    it('onTimerEnded should call verifyResponsesAndCallUpdate', () => {
        const verifyResponsesAndCallUpdate = spyOn(component, 'verifyResponsesAndCallUpdate');
        component.onTimerEnded();
        expect(verifyResponsesAndCallUpdate).toHaveBeenCalled();
    });

    it('updateButtons should update buttons with correct game and possible answers', () => {
        component.games = [MOCK_GAME[0], MOCK_GAME[0]];
        const MOCK_BUTTONS_LENGTH = 4;
        const gameService = TestBed.inject(GameHandlingService);
        gameService.currentGameId = 0;
        gameService.currentQuestionId = 0;

        component.updateButtons();

        expect(component.buttons.length).toBe(MOCK_BUTTONS_LENGTH);
        expect(component.buttons[0].text).toBe('Paris');
        expect(component.buttons[0].isCorrect).toBe(true);

        component.updateGameQuestions();
        expect(gameService.currentQuestionId).toBe(1);
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
        component.games = [MOCK_GAME[0]];
        const event = new KeyboardEvent('keydown', { key: 'Enter' });
        component.isProcessing = false;
        const onButtonClickSpy = spyOn(component, 'onButtonClick');
        const verifyResponsesAndCallUpdateSpy = spyOn(component, 'verifyResponsesAndCallUpdate');
        component.playerEntries(event);
        expect(onButtonClickSpy).not.toHaveBeenCalled();
        expect(verifyResponsesAndCallUpdateSpy).toHaveBeenCalled();
    });
    it('should set and reset button properties correctly with processAnswer', fakeAsync(() => {
        const TIME_OUT = 3000;
        component.buttons = [
            {
                color: 'white',
                selected: false,
                text: 'Test1',
                id: 1,
                isCorrect: true,
                showCorrectButtons: false,
                showWrongButtons: false,
            },
            {
                color: 'white',
                selected: false,
                text: 'Test2',
                id: 2,
                isCorrect: false,
                showCorrectButtons: false,
                showWrongButtons: false,
            },
        ];
        spyOn(component, 'updateGameQuestions').and.stub();
        component.processAnswer();
        expect(component.buttons[0].showCorrectButtons).toBeTrue();
        expect(component.buttons[1].showWrongButtons).toBeTrue();

        tick(TIME_OUT);

        expect(component.buttons[0].showCorrectButtons).toBeFalse();
        expect(component.buttons[1].showWrongButtons).toBeFalse();
    }));

    it('ngAfterViewInit should focus on buttonFocus', () => {
        const ngAfterViewInitSpy = spyOn(component.buttonFocus.nativeElement, 'focus');
        component.ngAfterViewInit();
        expect(ngAfterViewInitSpy).toHaveBeenCalled();
    });

    it('updateGameQuestions should navigate to create if currentQuestionId equals last question', () => {
        component.games = [MOCK_GAME[0]];
        const router = TestBed.inject(Router);
        const gameService = TestBed.inject(GameHandlingService);
        gameService.currentGameId = 0;
        gameService.currentQuestionId = component.games[gameService.currentGameId].questions.length - 1;
        const spyRouter = spyOn(router, 'navigate');
        component.updateGameQuestions();
        expect(spyRouter).toHaveBeenCalledWith(['/create-game']);
    });
    it('verifyResponsesAndCallUpdate should correctly process answers when answer selected is correct', () => {
        component.games = [MOCK_GAME[0]];
        component.buttons = [MOCK_BUTTONS[2]];
        const gameService = TestBed.inject(GameHandlingService);
        gameService.currentGameId = 0;
        const incrementScoreSpy = spyOn(gameService, 'incrementScore');
        component.verifyResponsesAndCallUpdate();
        expect(incrementScoreSpy).toHaveBeenCalled();
        expect(component.isProcessing).toBeTrue();
    });

    it('verifyResponsesAndCallUpdate should process answers when selected number of correct answers don t match total correct answers', () => {
        component.games = [MOCK_GAME[0]];
        component.buttons = [MOCK_BUTTONS[3], MOCK_BUTTONS[1]];
        const gameService = TestBed.inject(GameHandlingService);
        const incrementScoreSpy = spyOn(gameService, 'incrementScore');
        component.verifyResponsesAndCallUpdate();
        expect(incrementScoreSpy).not.toHaveBeenCalled();
        expect(component.isProcessing).toBeTrue();
    });

    it('verifyResponsesAndCallUpdate should correctly process answers when wrong answer is selected', () => {
        component.games = [MOCK_GAME[0]];
        component.buttons = [MOCK_BUTTONS[3]];

        const gameService = TestBed.inject(GameHandlingService);
        const incrementScoreSpy = spyOn(gameService, 'incrementScore');
        component.verifyResponsesAndCallUpdate();
        expect(incrementScoreSpy).not.toHaveBeenCalled();
        expect(component.isProcessing).toBeTrue();
    });

    it('verifyResponsesAndCallUpdate should do nothing if isProcessing is True', () => {
        component.games = [MOCK_GAME[0]];
        component.buttons = [MOCK_BUTTONS[0]];
        component.isProcessing = true;
        const gameService = TestBed.inject(GameHandlingService);
        const incrementScoreSpy = spyOn(gameService, 'incrementScore');
        component.verifyResponsesAndCallUpdate();
        expect(incrementScoreSpy).not.toHaveBeenCalled();
    });
    it('ngOnDestroy should unsubscribe from timerSubscription', () => {
        component.timerSubscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
        component.ngOnDestroy();
        const unsubscribeTimerSubscription = component.timerSubscription.unsubscribe;
        expect(unsubscribeTimerSubscription).toHaveBeenCalled();
    });
});
