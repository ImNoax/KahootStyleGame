import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { GameImportPopupComponent } from '@app/components/game-import-popup/game-import-popup.component';
import { HeaderComponent } from '@app/components/header/header.component';
import { FormManagerService } from '@app/services/form-manager.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { Game, QuestionType } from '@common/game';
import { Observable, of } from 'rxjs';
import { AdminJeuPageComponent } from './admin-jeu-page.component';
interface MockEvent {
    target: {
        files: File[];
        value: string;
    };
}
describe('AdminJeuPageComponent', () => {
    let mockRouter: jasmine.SpyObj<Router>;
    let component: AdminJeuPageComponent;
    let fixture: ComponentFixture<AdminJeuPageComponent>;
    let gameHandler: GameHandlingService;

    const mockGames: Game[] = [
        {
            id: '1',
            title: 'Test Game',
            description: 'Test Description',
            duration: 10,
            lastModification: '2023-09-30',
            isVisible: true,
            questions: [],
        },
    ];

    beforeEach(async () => {
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, MatIconModule, MatDialogModule],
            declarations: [AdminJeuPageComponent, HeaderComponent],
            providers: [GameHandlingService, FormManagerService, { provide: Router, useValue: mockRouter }, FormBuilder],
        }).compileComponents();

        fixture = TestBed.createComponent(AdminJeuPageComponent);
        component = fixture.componentInstance;
        gameHandler = TestBed.inject(GameHandlingService);

        spyOn(gameHandler, 'getGames').and.returnValue(of(mockGames));
        spyOn(gameHandler, 'export').and.returnValue(of(mockGames[0]));
        spyOn(gameHandler, 'changeVisibility').and.returnValue(of([{ ...mockGames[0], isVisible: false }]));
        spyOn(gameHandler, 'deleteGame').and.returnValue(of(undefined));
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should retrieve the list of games on initialization', () => {
        spyOn(sessionStorage, 'getItem').and.returnValue('true');
        component.ngOnInit();
        expect(gameHandler.getGames).toHaveBeenCalled();
        expect(component.games).toEqual(mockGames);
    });

    it('should redirect to main page if not authenticated', () => {
        spyOn(sessionStorage, 'getItem').and.returnValue(null);
        component.ngOnInit();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('modifyGame should save the game information in the formManager', () => {
        const mockQuestions = [
            {
                text: 'Test Question',
                points: 10,
                type: 'single-choice' as QuestionType,
                choices: [
                    { text: 'Choice 1', isCorrect: true },
                    { text: 'Choice 2', isCorrect: false },
                ],
            },
        ];

        mockGames[0].questions = mockQuestions;
        const formManager = component['formManager'];
        component.modifyGame(mockGames[0]);

        expect(formManager.nameModif).toEqual(mockGames[0].title);

        const questionsFormArray = formManager.gameForm.get('questions') as FormArray;

        questionsFormArray.controls.forEach((control, index) => {
            const questionGroup = control as FormGroup;
            const choicesFormArray = questionGroup.get('choices') as FormArray;
            expect(choicesFormArray instanceof FormArray).toBeTrue();

            choicesFormArray.controls.forEach((choiceControl, choiceIndex) => {
                const choiceGroup = choiceControl as FormGroup;
                expect(choiceGroup.get('text')?.value).toEqual(mockQuestions[index].choices[choiceIndex].text);
                expect(choiceGroup.get('isCorrect')?.value).toEqual(mockQuestions[index].choices[choiceIndex].isCorrect);
            });
        });
    });

    it('should retrieve the list of games on initialization', () => {
        spyOn(sessionStorage, 'getItem').and.callFake((key: string) => {
            if (key === 'isAdminAuthenticated') {
                return 'true';
            }
            return null;
        });
        component.ngOnInit();
        expect(gameHandler.getGames).toHaveBeenCalled();
        expect(component.games).toEqual(mockGames);
    });

    it('should export a game', () => {
        component.exportGame('0');
        expect(gameHandler.export).toHaveBeenCalledWith('0');
    });

    it('should toggle the visibility of a game', () => {
        component.games = [...mockGames];
        component.toggleVisibility(mockGames[0]);
        expect(gameHandler.changeVisibility).toHaveBeenCalledWith({ ...mockGames[0], isVisible: false });
        expect(component.games[0].isVisible).toBe(false);
    });

    it('isGameInList should return true if the game is in the list of games', () => {
        component.games = [...mockGames];
        const game = {
            id: '1',
            title: 'Test2',
            description: 'Test Description',
            duration: 10,
            lastModification: '2023-09-30',
            isVisible: true,
            questions: [],
        };
        expect(component.isGameInList(mockGames[0])).toBeTrue();
        expect(component.isGameInList(game)).toBeFalse();
    });

    it('deleteGame should call window.alert if the game is not in the list and confirmDeletion if it is', () => {
        const mockAlert = spyOn(window, 'alert');
        const mockConfirm = spyOn(component, 'confirmDeletion');
        component.games = [...mockGames];
        const game = {
            id: '1',
            title: 'Test2',
            description: 'Test Description',
            duration: 10,
            lastModification: '2023-09-30',
            isVisible: true,
            questions: [],
        };
        component.deleteGame(component.games[0]);
        expect(mockAlert).not.toHaveBeenCalled();
        expect(mockConfirm).toHaveBeenCalled();

        mockConfirm.calls.reset();
        component.deleteGame(game);
        expect(mockAlert).toHaveBeenCalled();
        expect(mockConfirm).not.toHaveBeenCalled();
    });

    it('confirmDeletion should delete a game', () => {
        spyOn(window, 'confirm').and.returnValue(true);
        component.games = [...mockGames];
        const initialLength = component.games.length;
        component.confirmDeletion(component.games[0]);
        expect(gameHandler.deleteGame).toHaveBeenCalledWith(mockGames[0].id);
        expect(component.games.length).toBe(initialLength - 1);
    });

    it('readFile should correctly handle valid JSON content', (done) => {
        const mockFileContent = '{"valid": "json"}';
        const mockFile = new File([mockFileContent], 'mockFile.txt', { type: 'application/json' });
        component.readFile(mockFile as File);

        setTimeout(() => {
            expect(component.isFormInvalid).toBeFalse();
            expect(component.isFileEmpty).toBeFalse();
            done();
        });
    });

    it('should set isFileEmpty for empty files', (done) => {
        const mockTimeOut = 100;
        const mockFile = new File([''], 'empty.txt', { type: 'text/plain' });
        component.readFile(mockFile as File);
        setTimeout(() => {
            expect(component.isFileEmpty).toBeTrue();
            expect(component.isFormInvalid).toBeFalse();
            done();
        }, mockTimeOut);
    });

    it('should set isFormInvalid for invalid JSON content', (done) => {
        const mockTimeOut = 100;
        const mockFile = new File(['Invalid JSON'], 'invalid.json', { type: 'text/plain' });
        component.readFile(mockFile as File);
        setTimeout(() => {
            expect(component.isFormInvalid).toBeTrue();
            expect(component.isFileEmpty).toBeFalse();
            done();
        }, mockTimeOut);
    });

    it('should read the file when provided', () => {
        const mockFileContent = '{"valid": "json"}';
        const mockFile = new File([mockFileContent], 'mockFile.txt', { type: 'application/json' });
        const mockEvent: MockEvent = {
            target: {
                files: [mockFile],
                value: '',
            },
        };
        spyOn(component, 'readFile').and.callThrough();
        component.importGame(mockEvent as unknown as Event);
        expect(component.readFile).toHaveBeenCalledWith(mockEvent.target.files[0]);
    });

    it('openImportPopup should open importDialog', () => {
        const gamesMockObservable: Observable<Game[]> = new Observable((subscriber) => subscriber.next(mockGames));
        const emptyObservable: Observable<void> = new Observable((subscriber) => subscriber.next(undefined));
        const dialogSpy = spyOn(TestBed.inject(MatDialog), 'open').and.returnValue({
            afterClosed: () => gamesMockObservable,
        } as MatDialogRef<GameImportPopupComponent>);

        component.openImportPopup(mockGames[0]);
        expect(dialogSpy).toHaveBeenCalled();
        expect(component.games).toEqual(mockGames);

        component.games = [];
        dialogSpy.and.returnValue({
            afterClosed: () => emptyObservable,
        } as MatDialogRef<GameImportPopupComponent>);
        component.openImportPopup(mockGames[0]);
        expect(component.games).toEqual([]);
    });
});
