import { formatDate } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { Jeu, QuestionType } from '@common/jeu';
import { of } from 'rxjs';
import { FormManagerService } from './form-manager.service';
import { GameHandlingService } from './game-handling.service';

describe('FormManagerService', () => {
    let service: FormManagerService;
    let fb: FormBuilder;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [GameHandlingService],
        });
        service = TestBed.inject(FormManagerService);
        fb = TestBed.inject(FormBuilder);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('resetGameForm should reset the values of the game Form', () => {
        const form = fb.group({
            id: 0,
            title: ['', Validators.required],
            description: ['', Validators.required],
            duration: 30,
            lastModification: formatDate(new Date(), 'yyyy-MM-dd', 'en'),
            isVisible: false,
            questions: fb.array([]),
        });

        service.resetGameForm();
        expect(service.gameForm.value).toEqual(form.value);
    });

    it('sendGameForm should reset the values of the game Form and send them to the game Handler', () => {
        const games: Jeu[] = [];
        const form = fb.group({
            id: 0,
            title: ['', Validators.required],
            description: ['', Validators.required],
            duration: 30,
            lastModification: formatDate(new Date(), 'yyyy-MM-dd', 'en'),
            isVisible: false,
            questions: fb.array([]),
        });

        const mockGameAdder = spyOn(TestBed.inject(GameHandlingService), 'addGame').and.returnValues(of(games));
        const mockModify = spyOn(TestBed.inject(GameHandlingService), 'modifyGame').and.returnValues(of(games));
        const mockReset = spyOn(TestBed.inject(FormManagerService), 'resetGameForm');

        service.sendGameForm();
        expect(mockGameAdder).toHaveBeenCalled();
        expect(mockReset).toHaveBeenCalled();
        expect(service.gameForm.value).toEqual(form.value);

        service.nameModif = 'test';
        service.sendGameForm();
        expect(mockModify).toHaveBeenCalled();
        expect(mockReset).toHaveBeenCalled();
        expect(service.gameForm.value).toEqual(form.value);
    });

    it('sendGameForm with importedGameForm parameter should return an Observable', () => {
        const games: Jeu[] = [];
        const importedGameForm = fb.group({
            title: ['', Validators.required],
            description: ['', Validators.required],
            duration: 30,
            lastModification: formatDate(new Date(), 'yyyy-MM-dd', 'en'),
            isVisible: false,
            questions: fb.array([]),
        });

        const mockGameAdder = spyOn(TestBed.inject(GameHandlingService), 'addGame').and.returnValue(of(games));

        service.sendGameForm(importedGameForm);
        expect(mockGameAdder).toHaveBeenCalled();
    });

    it('createBaseForm should return an empty form', () => {
        const form = service['createBaseForm']();
        expect(form).toBeTruthy();

        expect(form.get('title')).toBeTruthy();
        expect(form.get('description')).toBeTruthy();
        expect(form.get('duration')).toBeTruthy();
        expect(form.get('lastModification')).toBeTruthy();
        expect(form.get('isVisible')).toBeTruthy();
        expect(form.get('questions')).toBeTruthy();
    });

    it('hasQuestions should return true if the number of questions is superior to 0', () => {
        expect(service.hasQuestions()).toBeFalse();
        service.questions.controls[0] = fb.control({});
        expect(service.hasQuestions()).toBeTrue();
    });

    it('initializeImportForm should return a FormGroup used for game importation', () => {
        const gameMock: Jeu = {
            id: 0,
            title: ' title ',
            description: '  description ',
            duration: 0,
            lastModification: '',
            questions: [
                {
                    text: '  text   ',
                    points: 0,
                    type: QuestionType.QCM,
                    choices: [{ answer: ' answer  ', isCorrect: true }],
                },
            ],
        };
        const formMock = fb.group({
            id: gameMock.id,
            title: gameMock.title,
            description: gameMock.description,
            duration: gameMock.duration,
            lastModification: formatDate(new Date(), 'yyyy-MM-dd', 'en'),
            isVisible: false,
            questions: fb.array(gameMock.questions),
        });
        expect(service.initializeImportForm(gameMock).value).toEqual(formMock.value);
    });

    it('preventEmptyInput should return true if the string consist of only white spaces ', () => {
        const controlTest: FormControl = new FormControl();

        controlTest.setValue('  ');
        expect(service.preventEmptyInput(controlTest)?.isEmpty).toBeTrue();

        controlTest.setValue(' s  ');
        expect(service.preventEmptyInput(controlTest)?.isEmpty).not.toBeDefined();
    });

    it('saveQuestions should update the questions FormArray', () => {
        const questionsFormArray = TestBed.inject(FormBuilder).array([{}]);
        const clearSpy = spyOn(service.questions, 'clear');
        const pushSpy = spyOn(service.questions, 'push');

        service.saveQuestions(questionsFormArray);

        expect(clearSpy).toHaveBeenCalled();
        expect(pushSpy).toHaveBeenCalledTimes(questionsFormArray.length);
    });
});
