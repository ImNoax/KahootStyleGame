import { formatDate } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Game } from '@common/game';
import { of } from 'rxjs';
import { GameHandlingService } from './game-handling.service';

describe('GameHandlingService', () => {
    let service: GameHandlingService;
    const games: Game[] = [];
    const game: Game = {
        id: '0',
        title: '',
        description: '',
        duration: 30,
        lastModification: formatDate(new Date(), 'yyyy-MM-dd', 'en'),
        isVisible: false,
        questions: [],
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [HttpClient],
        });
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameHandlingService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getGames should send a get request', () => {
        const mockGet = spyOn(TestBed.inject(HttpClient), 'get').and.returnValue(of(games));
        expect(service.getGames()).toBeTruthy();
        expect(mockGet).toHaveBeenCalled();
    });

    it('modifyGame should send a patch request', () => {
        const mockPost = spyOn(TestBed.inject(HttpClient), 'patch').and.returnValue(of(games));
        service.modifyGame(game);
        expect(mockPost).toHaveBeenCalled();
    });

    it('addGame should send a post request', () => {
        const mockPost = spyOn(TestBed.inject(HttpClient), 'post').and.returnValue(of(games));
        service.addGame(game);
        expect(mockPost).toHaveBeenCalled();
    });

    it('changeVisibility should send a patch request', () => {
        const mockPatch = spyOn(TestBed.inject(HttpClient), 'patch').and.returnValue(of(games));
        service.changeVisibility(game);
        expect(mockPatch).toHaveBeenCalled();
    });

    it('export should send a get request', () => {
        const mockGet = spyOn(TestBed.inject(HttpClient), 'get');
        service.export('0');
        expect(mockGet).toHaveBeenCalled();
    });

    it('setCurrentGameId should change the current Game id', () => {
        const id = '45';
        service.setCurrentGameId(id);
        expect(service.currentGameId).toEqual(id);
    });

    it('handleError should return a function that returns an observable', (done) => {
        const testErrorMessage = 'Test Error';
        const testResult = 'Result Value';
        const res = service['handleError'](testErrorMessage, testResult);
        spyOn(window, 'alert');
        res({ error: new Error(testErrorMessage) }).subscribe({
            next: (result) => {
                expect(result).toBe(testResult);
                done();
            },
            error: () => {
                fail('Expected to complete successfully.');
                done();
            },
        });
    });
    it('setCurrentQuestion should update current question', () => {
        const testQuestion = 'What is the capital of France?';
        service.setCurrentQuestion(testQuestion);
        expect(service.currentQuestionSource.value).toEqual(testQuestion);
    });
    it('setScore should update the score', () => {
        const testNewScore = 42;
        service.setScore(testNewScore);
        expect(service.scoreSource.value).toEqual(testNewScore);
    });
    it('setCurrentQuestionId should update current questionId', () => {
        const id = 123;
        service.setCurrentQuestionId(id);
        expect(service.currentQuestionId).toEqual(id);
    });
    it('incrementScore should increment the score', () => {
        const BONUS_POINTS = 1.2;
        const testInitScore = 10;
        const testPointToAdd = 5;
        service.setScore(testInitScore);
        service.incrementScore(testPointToAdd);
        expect(service.scoreSource.value).toEqual(testInitScore + testPointToAdd * BONUS_POINTS);
    });

    it('deleteGame should send a delete request', () => {
        const gameId = '1';
        const deleteSpy = spyOn(TestBed.inject(HttpClient), 'delete').and.returnValue(of(null));
        service.deleteGame(gameId);
        expect(deleteSpy).toHaveBeenCalled();
    });

    it('verifyAdminPassword should verify the admin password', () => {
        const postSpy = spyOn(TestBed.inject(HttpClient), 'post').and.returnValue(of({ valid: true }));
        const mockPassword = 'admin123';
        service.verifyAdminPassword(mockPassword).subscribe((isValid) => {
            expect(isValid).toBeTrue();
        });
        expect(postSpy).toHaveBeenCalled();
    });
});
