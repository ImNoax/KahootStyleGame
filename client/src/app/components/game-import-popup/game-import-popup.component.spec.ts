import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ImportState, Limit } from '@app/enums';
import { FormManagerService } from '@app/services/form-manager.service';
import { Jeu, Question, QuestionType } from '@common/jeu';
import { Observable } from 'rxjs';
import { GameImportPopupComponent } from './game-import-popup.component';

describe('GameImportPopupComponent', () => {
    let component: GameImportPopupComponent;
    let fixture: ComponentFixture<GameImportPopupComponent>;

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

    const dataMock: { importedGame: Jeu; games: Jeu[] } = {
        importedGame: gameMock,
        games: [gameMock, gameMock],
    };

    const initializeQuestionsTest = () => {
        component.errors = [];
        component.questionsDetailsAreValid = true;
        component.choicesAreValid = true;
        component.emptyQuestionVerified = false;
        component.exceededQuestionTextVerified = false;
        component.pointsLimitsVerified = false;
        component.pointsMultipleVerified = false;
        component.emptyChoicesVerified = false;
        component.emptyAnswerVerified = false;
        component.exceededAnswerVerified = false;
        component.minimumChoicesVerified = false;
    };

    const createValidQuestion = (): Question => {
        return {
            text: ' text ',
            points: Limit.MinPoints,
            type: QuestionType.QCM,
            choices: [
                { answer: ' answer', isCorrect: true },
                { answer: ' answer ', isCorrect: false },
            ],
        };
    };

    const exceededValue = 1000;
    const exceededInput = '.'.repeat(exceededValue);
    const dialogRefSpy = { close: jasmine.createSpy('dialog') };

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [GameImportPopupComponent],
            imports: [HttpClientTestingModule, ReactiveFormsModule],
            providers: [{ provide: MAT_DIALOG_DATA, useValue: dataMock }, { provide: MatDialogRef, useValue: dialogRefSpy }, FormBuilder],
        });
        fixture = TestBed.createComponent(GameImportPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        initializeQuestionsTest();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should initialize games', () => {
        expect(component.games).toEqual(dataMock.games);
    });

    it('getImportState should initialize importState', () => {
        const formValiditySpy = spyOn(component, 'isFormValid').and.returnValue(true);
        const titleExistenceSpy = spyOn(component, 'titleAlreadyExists').and.returnValue(true);

        component.getImportState();
        expect(component.importState).toEqual(ImportState.NameExists);
        expect(formValiditySpy).toHaveBeenCalled();
        expect(titleExistenceSpy).toHaveBeenCalled();

        titleExistenceSpy.and.returnValue(false);
        component.getImportState();
        expect(component.importState).toEqual(ImportState.ValidForm);

        formValiditySpy.and.returnValue(false);
        component.getImportState();
        expect(component.importState).toEqual(ImportState.InvalidForm);
    });

    it('closeDialog should reset the form and close the dialog', () => {
        const formManagerSpy = spyOn(TestBed.inject(FormManagerService), 'resetGameForm');

        component.closeDialog();
        expect(formManagerSpy).toHaveBeenCalled();
        expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('titleAlreadyExists should return true if a game title is already used', () => {
        component.games[0] = {
            id: 0,
            title: 'Game 1',
            description: '',
            duration: 0,
            lastModification: '',
            isVisible: false,
            questions: [],
        };

        component.gameForm = TestBed.inject(FormBuilder).group({
            title: 'Game 1',
        });

        expect(component.titleAlreadyExists()).toBeTrue();
        component.gameForm.patchValue({ title: 'Game 2' });
        expect(component.titleAlreadyExists()).toBeFalse();
    });

    it('isNewTitleEmpty should return true if the entered title is empty', () => {
        component.gameForm = TestBed.inject(FormBuilder).group({
            title: '',
        });

        expect(component.isNewTitleEmpty()).toBeTrue();
        component.gameForm.patchValue({ title: 'Game 2' });
        expect(component.isNewTitleEmpty()).toBeFalse();
    });

    it('isGameDetailValid should return true if the title or description is valid', () => {
        const maxDetailLength = 5;
        let gameDetail = 'test';
        component.errors = [];
        let errorsCount = 0;

        expect(component.errors.length).toEqual(errorsCount);

        const titleIsValid = component.isGameDetailValid(gameDetail, maxDetailLength);
        expect(titleIsValid).toBeTrue();
        expect(component.errors.length).toEqual(errorsCount);

        const descriptionIsValid = component.isGameDetailValid(gameDetail, maxDetailLength, true);
        expect(descriptionIsValid).toBeTrue();
        expect(component.errors.length).toEqual(errorsCount);

        gameDetail = '';
        const isEmpty = component.isGameDetailValid(gameDetail, maxDetailLength);
        expect(isEmpty).toBeFalse();
        expect(component.errors.length).toEqual(++errorsCount);

        gameDetail = 'testing';
        const hasExceeded = component.isGameDetailValid(gameDetail, maxDetailLength);
        expect(hasExceeded).toBeFalse();
        expect(component.errors.length).toEqual(++errorsCount);
    });

    it('isDurationValid should return true if the duration is valid', () => {
        component.errors = [];
        let errorsCount = 0;
        component.importedGame.duration = Limit.MinDuration;

        expect(component.errors.length).toEqual(errorsCount);

        expect(component.isDurationValid()).toBeTrue();
        expect(component.errors.length).toEqual(errorsCount);

        component.importedGame.duration = 0;
        expect(component.isDurationValid()).toBeFalse();
        expect(component.errors.length).toEqual(++errorsCount);
    });

    it('areQuestionsValid should return true if every question is valid', () => {
        const questions: Question[] = [createValidQuestion(), createValidQuestion()];

        let errorsCount = 0;

        component.importedGame.questions = [];
        expect(component.areQuestionsValid()).toBeFalse();
        expect(component.errors.length).toEqual(++errorsCount);

        const questionSpy = spyOn(component, 'isQuestionValid').and.callFake(() => (component.questionsDetailsAreValid = true));
        const choiceSpy = spyOn(component, 'areChoicesValid').and.callFake(() => (component.choicesAreValid = true));

        component.importedGame.questions = questions;
        expect(component.areQuestionsValid()).toBeTrue();
        expect(questionSpy).toHaveBeenCalled();
        expect(choiceSpy).toHaveBeenCalled();

        questionSpy.and.callFake(() => (component.questionsDetailsAreValid = false));
        expect(component.areQuestionsValid()).toBeFalse();
    });

    it("isQuestionValid should change questionDetailsAreValid to false if a a question's details is invalid", () => {
        const question: Question = createValidQuestion();
        let errorsCount = 0;
        const nonMultipleValue = 1;

        component.isQuestionValid(question);
        expect(component.questionsDetailsAreValid).toBeTrue();
        expect(component.errors.length).toEqual(errorsCount);

        question.text = '';
        component.isQuestionValid(question);
        expect(component.questionsDetailsAreValid).toBeFalse();
        expect(component.errors.length).toEqual(++errorsCount);
        component.questionsDetailsAreValid = true;

        question.text = exceededInput;
        component.isQuestionValid(question);
        expect(component.questionsDetailsAreValid).toBeFalse();
        expect(component.errors.length).toEqual(++errorsCount);
        component.questionsDetailsAreValid = true;

        question.points = 0;
        component.isQuestionValid(question);
        expect(component.questionsDetailsAreValid).toBeFalse();
        expect(component.errors.length).toEqual(++errorsCount);
        component.questionsDetailsAreValid = true;
        component.pointsLimitsVerified = false;

        question.points = exceededValue;
        component.isQuestionValid(question);
        expect(component.questionsDetailsAreValid).toBeFalse();
        expect(component.errors.length).toEqual(++errorsCount);
        component.questionsDetailsAreValid = true;

        question.points = nonMultipleValue;
        component.isQuestionValid(question);
        expect(component.questionsDetailsAreValid).toBeFalse();
        expect(component.errors.length).toEqual(++errorsCount);
    });

    it('areChoicesValid should change choicesAreValid to false if a choice is invalid', () => {
        const question: Question = createValidQuestion();
        let errorsCount = 0;

        component.areChoicesValid(question);
        expect(component.choicesAreValid).toBeTrue();
        expect(component.errors.length).toEqual(errorsCount);

        question.choices[0].answer = '';
        component.areChoicesValid(question);
        expect(component.choicesAreValid).toBeFalse();
        expect(component.errors.length).toEqual(++errorsCount);
        component.choicesAreValid = true;

        question.choices[0].answer = exceededInput;
        component.areChoicesValid(question);
        expect(component.choicesAreValid).toBeFalse();
        expect(component.errors.length).toEqual(++errorsCount);
        component.choicesAreValid = true;

        question.choices[0].isCorrect = false;
        component.areChoicesValid(question);
        expect(component.choicesAreValid).toBeFalse();
        expect(component.errors.length).toEqual(++errorsCount);
        component.choicesAreValid = true;
        component.minimumChoicesVerified = false;

        question.choices[0].isCorrect = true;
        question.choices[1].isCorrect = true;
        component.areChoicesValid(question);
        expect(component.choicesAreValid).toBeFalse();
        expect(component.errors.length).toEqual(++errorsCount);
        component.choicesAreValid = true;

        question.choices = [];
        component.areChoicesValid(question);
        expect(component.choicesAreValid).toBeFalse();
        expect(component.errors.length).toEqual(++errorsCount);
    });

    it('onSubmit should submit the gameForm and close the dialog', () => {
        const gameObservable: Observable<Jeu[]> = new Observable((subscriber) => subscriber.next([]));
        const formManagerMock = spyOn(TestBed.inject(FormManagerService), 'sendGameForm').and.returnValue(gameObservable);

        component.onSubmit();
        expect(formManagerMock).toHaveBeenCalled();

        expect(dialogRefSpy.close).toHaveBeenCalledWith([]);
    });
});
