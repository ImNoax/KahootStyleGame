import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { FormManagerService } from '@app/services/form-manager.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { Jeu } from '@common/jeu';
import { of } from 'rxjs';
import { CreationJeuComponent } from './creation-jeu.component';

describe('CreationJeuComponent', () => {
    let component: CreationJeuComponent;
    let fixture: ComponentFixture<CreationJeuComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [CreationJeuComponent, HeaderComponent],
            providers: [GameHandlingService, FormManagerService, Router],
            imports: [HttpClientTestingModule, ReactiveFormsModule, MatIconModule],
        }).compileComponents();
        fixture = TestBed.createComponent(CreationJeuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('ngOnInit should get the list of games', () => {
        const games: Jeu[] = [];
        const mockGetGames = spyOn(TestBed.inject(GameHandlingService), 'getGames').and.returnValue(of(games));

        component.ngOnInit();
        expect(mockGetGames).toHaveBeenCalled();
        expect(component.games).toBeDefined();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('verifyName should change isNameEmpty if the name is empty', () => {
        const nameInput = fixture.debugElement.nativeElement.querySelector('#nameField');
        const event = new InputEvent('keyup');
        component.games = new Array();
        component.games.push({
            id: 0,
            title: 'Game 1',
            description: '',
            duration: 0,
            lastModification: '',
            isVisible: false,
            questions: [],
        });

        nameInput.value = '';
        nameInput.dispatchEvent(event);

        component.verifyName(event);
        expect(component.isNameEmpty).toBeTrue();

        nameInput.value = ' ';
        component.verifyName(event);
        expect(component.isNameEmpty).toBeTrue();
    });

    it('verifyName should change isNameDuplicate if the name already exist', () => {
        const nameInput = fixture.debugElement.nativeElement.querySelector('#nameField');
        const event = new InputEvent('keyup');

        component.games = new Array();
        component.games.push({
            id: 0,
            title: 'Game 1',
            description: '',
            duration: 0,
            lastModification: '',
            isVisible: false,
            questions: [],
        });
        nameInput.value = 'Game 1';
        nameInput.dispatchEvent(event);

        component.verifyName(event);
        expect(component.isNameDuplicate).toBeTrue();
        expect(component.isNameEmpty).toBeFalse();

        nameInput.value = 'Game 1   ';
        component.verifyName(event);
        expect(component.isNameDuplicate).toBeTrue();
        expect(component.isNameEmpty).toBeFalse();

        component.nameModif = 'Game 1';
        component.verifyName(event);
        expect(component.isNameDuplicate).toBeFalse();
        expect(component.isNameEmpty).toBeFalse();

        nameInput.value = 'Game 2';
        component.verifyName(event);
        expect(component.isNameDuplicate).toBeFalse();
        expect(component.isNameEmpty).toBeFalse();
    });

    it('verifyDesc should change isDescEmpty if the description is empty', () => {
        const nameInput = fixture.debugElement.nativeElement.querySelector('#description');
        const event = new InputEvent('keyup');

        nameInput.dispatchEvent(event);
        nameInput.value = '';

        component.verifyDesc(event);
        expect(component.isDescEmpty).toBeTrue();

        nameInput.value = ' ';
        component.verifyDesc(event);
        expect(component.isDescEmpty).toBeTrue();
    });

    it('verifyTimer should change isTimerInvalid if the timer is invalid', () => {
        const nameInput = fixture.debugElement.nativeElement.querySelector('#time_field');
        const event = new InputEvent('change');

        nameInput.dispatchEvent(event);
        nameInput.value = '';

        component.verifyTimer(event);
        expect(component.isTimerInvalid).toBeTrue();

        nameInput.value = ' ';
        component.verifyTimer(event);
        expect(component.isTimerInvalid).toBeTrue();

        nameInput.value = 1;
        component.verifyTimer(event);
        expect(component.isTimerInvalid).toBeTrue();

        nameInput.value = 23;
        component.verifyTimer(event);
        expect(component.isTimerInvalid).toBeFalse();

        nameInput.value = 87;
        component.verifyTimer(event);
        expect(component.isTimerInvalid).toBeTrue();
    });

    it('onSubmit should call sendGameForm from the form Manager', () => {
        const mockSend = spyOn(TestBed.inject(FormManagerService), 'sendGameForm');

        component.onSubmit();

        expect(mockSend).toHaveBeenCalled();
    });

    it('resetForm should call resetGameForm from the form Manager', () => {
        const mockReset = spyOn(TestBed.inject(FormManagerService), 'resetGameForm');

        component.resetForm();

        expect(mockReset).toHaveBeenCalled();
    });

    it('games should be equal to the games from the GameHandlingService', () => {
        const response: Jeu[] = [];
        spyOn(TestBed.inject(GameHandlingService), 'getGames').and.returnValue(of(response));

        component.ngOnInit();
        fixture.detectChanges();

        expect(component.games).toEqual(response);
    });

    it('hasQuestions should call hasQuestion from the form Manager', () => {
        const mockHasQuestions = spyOn(TestBed.inject(FormManagerService), 'hasQuestions').and.returnValue(true);
        component.hasQuestions();
        expect(mockHasQuestions).toHaveBeenCalled();
    });
});
