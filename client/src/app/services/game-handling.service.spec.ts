import { formatDate } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Game } from '@common/game';
import { of, throwError } from 'rxjs';
import { GameHandlingService } from './game-handling.service';

describe('GameHandlingService', () => {
    let service: GameHandlingService;
    let httpClientSpy: jasmine.SpyObj<HttpClient>;
    const mockGame: Game = {
        id: '0',
        title: 'Test Game',
        description: 'Test Description',
        duration: 30,
        lastModification: formatDate(new Date(), 'yyyy-MM-dd', 'en'),
        isVisible: false,
        questions: [],
    };

    beforeEach(() => {
        httpClientSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'patch', 'delete']);
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [GameHandlingService, { provide: HttpClient, useValue: httpClientSpy }],
        });
        service = TestBed.inject(GameHandlingService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('getGames should send a get request', (done) => {
        httpClientSpy.get.and.returnValue(of([mockGame]));
        service.getGames().subscribe((games) => {
            expect(games).toEqual([mockGame]);
            done();
        });
        expect(httpClientSpy.get.calls.count()).withContext('one call').toBe(1);
    });
    it('should show an alert when there is an error', (done) => {
        const errorResponse = {
            error: new Error('Test error message'),
            status: 500,
            statusText: 'Internal Server Error',
        };

        httpClientSpy.get.and.returnValue(throwError(() => errorResponse));
        spyOn(window, 'alert');
        service.getGames().subscribe({
            next: () => {
                expect(window.alert).toHaveBeenCalledWith('Test error message');
                done();
            },
            error: () => {
                done.fail('The error callback should not have been called');
            },
        });
    });

    it('currentGame should be able to be set', () => {
        service.currentGame = mockGame;
        expect(service.currentGame).toEqual(mockGame);
    });
    it('getPlayerNameBySocketId should return Unknown when player is not found', () => {
        const socketId = 'nonexistent-socket-id';
        expect(service.getPlayerNameBySocketId(socketId)).toEqual('Unknown');
    });
    it('getPlayerNameBySocketId should return player name when player is found', () => {
        const players = [{ socketId: '123', name: 'Noah Nam' }];
        service.setPlayers(players);
        expect(service.getPlayerNameBySocketId('123')).toEqual('Noah Nam');
    });

    it('modifyGame should send a patch request', (done) => {
        httpClientSpy.patch.and.returnValue(of([mockGame]));
        service.modifyGame(mockGame).subscribe((games) => {
            expect(games).toEqual([mockGame]);
            done();
        });
        expect(httpClientSpy.patch.calls.count()).withContext('one call').toBe(1);
    });

    it('addGame should send a post request', (done) => {
        httpClientSpy.post.and.returnValue(of([mockGame]));
        service.addGame(mockGame).subscribe((games) => {
            expect(games).toEqual([mockGame]);
            done();
        });
        expect(httpClientSpy.post.calls.count()).withContext('one call').toBe(1);
    });

    it('changeVisibility should send a patch request', (done) => {
        httpClientSpy.patch.and.returnValue(of([mockGame]));
        service.changeVisibility(mockGame).subscribe((games) => {
            expect(games).toEqual([mockGame]);
            done();
        });
        expect(httpClientSpy.patch.calls.count()).withContext('one call').toBe(1);
    });

    it('export should send a get request', (done) => {
        httpClientSpy.get.and.returnValue(of(mockGame));
        service.export(mockGame.id).subscribe((game) => {
            expect(game).toEqual(mockGame);
            done();
        });
        expect(httpClientSpy.get.calls.count()).withContext('one call').toBe(1);
    });

    it('deleteGame should send a delete request', (done) => {
        httpClientSpy.delete.and.returnValue(of(null));
        service.deleteGame(mockGame.id).subscribe(() => {
            done();
        });
        expect(httpClientSpy.delete.calls.count()).withContext('one call').toBe(1);
    });

    it('setCurrentQuestion should update current question', () => {
        const testQuestion = 'What is the capital of France?';
        service.setCurrentQuestion(testQuestion);
        service.currentQuestion$.subscribe((question) => {
            expect(question).toEqual(testQuestion);
        });
    });

    it('setScore should update the score', () => {
        const testNewScore = 42;
        service.setScore(testNewScore);
        service.score$.subscribe((score) => {
            expect(score).toEqual(testNewScore);
        });
    });

    it('setCurrentQuestionId should update current questionId', () => {
        const testQuestionId = 123;
        service.setCurrentQuestionId(testQuestionId);
        expect(service.currentQuestionId).toEqual(testQuestionId);
    });

    it('incrementScore should increment the score', () => {
        const initialScore = 10;
        const incrementAmount = 5;
        service.setScore(initialScore);
        service.incrementScore(incrementAmount);
        service.score$.subscribe((score) => {
            expect(score).toEqual(initialScore + incrementAmount);
        });
    });

    it('verifyAdminPassword should verify the admin password', (done) => {
        const mockResponse = { valid: true };
        httpClientSpy.post.and.returnValue(of(mockResponse));
        service.verifyAdminPassword('admin123').subscribe((isValid) => {
            expect(isValid).toBeTrue();
            done();
        });
        expect(httpClientSpy.post.calls.count()).toBe(1);
    });
});
