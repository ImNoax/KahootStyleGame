import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray, FormBuilder, FormControl, FormGroup, FormGroupName, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Choice, Question, QuestionType } from '@common/jeu';
// eslint-disable-next-line no-restricted-imports
import { HeaderComponent } from '../header/header.component';
import { QuestionCreationPopupComponent } from './question-creation-popup.component';
const DEFAULT_POINTS = 10;
describe('QuestionCreationPopupComponent', () => {
    let component: QuestionCreationPopupComponent;
    let fixture: ComponentFixture<QuestionCreationPopupComponent>;
    const matDialogRef = {
        close: jasmine.createSpy('close'),
    };
    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [QuestionCreationPopupComponent, HeaderComponent, FormGroupName],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: {} },
                { provide: MatDialogRef, useValue: matDialogRef },
            ],
            imports: [FormsModule, HttpClientModule, ReactiveFormsModule, MatSlideToggleModule, MatInputModule, BrowserAnimationsModule],
        });
        fixture = TestBed.createComponent(QuestionCreationPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('ngOnInit should call the correct method', () => {
        const mockCreate = spyOn(component, 'createNewForm');
        const mockLoad = spyOn(component, 'loadForm').and.returnValue(new FormGroup(0));
        const fb = new FormBuilder();
        const questionFormGroup: FormGroup = fb.group({
            text: 'Test',
            points: 10,
            type: QuestionType.QCM,
            choices: fb.array([{ answer: '123', isCorrect: true }]),
        });
        component.data = {
            index: 0,
            questionsFormArray: fb.array([questionFormGroup]),
        };

        component.ngOnInit();
        expect(mockLoad).toHaveBeenCalled();

        component.data.index = undefined;
        component.ngOnInit();
        expect(mockCreate).toHaveBeenCalled();
    });

    it('loadForm should correctly set the question form', () => {
        const fb = new FormBuilder();
        const questionFormGroup: FormGroup = fb.group({
            text: 'Test',
            points: 10,
            type: QuestionType.QCM,
            choices: fb.array([{ answer: '123', isCorrect: true }]),
        });
        component.data = {
            index: 0,
            questionsFormArray: fb.array([questionFormGroup]),
        };

        component.questionForm = component.loadForm(fb, 0);

        expect(component.questionForm.get('text')?.value).toBe('Test');
        expect(component.questionForm.get('points')?.value).toBe(DEFAULT_POINTS);
        expect(component.questionForm.get('type')?.value).toBe(QuestionType.QCM);
        expect(component.questionForm.get('choices')?.value).toEqual([{ answer: '123', isCorrect: true }]);
    });

    it('createNewForm should correctly set the question form', () => {
        const fb = new FormBuilder();
        component.data = {
            questionsFormArray: fb.array([]) as FormArray,
        };
        component.createNewForm(fb);
        expect(component.questionForm.get('text')?.value).toBe('');
        expect(component.questionForm.get('points')?.value).toBe(DEFAULT_POINTS);
        expect(component.questionForm.get('type')?.value).toBe(QuestionType.QCM);
        expect(component.questionForm.get('choices')?.value).toEqual([
            { answer: '', isCorrect: true },
            { answer: '', isCorrect: false },
        ]);
    });

    it('setAnswerStyle should return the correct style depending if it is correct or not', () => {
        const correctRes = { background: '#98FF7F' };
        const incorrectRes = { background: '#FF967F' };

        expect(component.setAnswerStyle(true)).toEqual(correctRes);
        expect(component.setAnswerStyle(false)).toEqual(incorrectRes);
    });

    it('addChoice should add a choice to the list', () => {
        let nbChoices = component.choices.length;

        component.addChoice(true);
        expect(component.choices.length).toEqual(++nbChoices);
        expect(component.choices.at(nbChoices - 1).value.isCorrect).toBeTrue();

        component.addChoice(false);
        expect(component.choices.length).toEqual(++nbChoices);
        expect(component.choices.at(nbChoices - 1).value.isCorrect).toBeFalse();
    });

    it('verifyChoice should change choiceDuplicate if the choice already exist', () => {
        const choiceInput = fixture.debugElement.nativeElement.querySelector('#choiceInput');
        const event = new KeyboardEvent('keyup');

        choiceInput.value = 'test';
        choiceInput.dispatchEvent(event);

        component.verifyChoice(event);
        expect(component.choiceDuplicate).toBeFalse();

        component.choices.value[0].answer = 'test';
        component.choices.value[1].answer = 'test';

        component.verifyChoice(event);
        expect(component.choiceDuplicate).toBeTrue();
    });

    it('deleteChoice should remove a choice from the list', () => {
        let nbChoices = component.choices.length;

        component.deleteChoice(--nbChoices);
        expect(component.choices.length).toEqual(nbChoices);
    });

    it('closeQuestionCreator should call close from the mat Dialog Ref', () => {
        component.closeQuestionCreator();
        expect(matDialogRef.close).toHaveBeenCalled();
    });

    it('canAddAnswer should return false if the answer count has reached its limit', () => {
        expect(component.canAddAnswer()).toBeTrue();

        component.addChoice(true);
        component.addChoice(true);

        expect(component.canAddAnswer()).toBeFalse();
    });

    it('canDeleteAnswer should return false if the answer count is 2', () => {
        expect(component.canDeleteAnswer()).toBeFalse();

        component.addChoice(true);

        expect(component.canDeleteAnswer()).toBeTrue();
    });

    it('isQuestionEmpty should return true if the text of the question is empty and the field is touched', () => {
        component.questionForm.controls['text'].setValue('   ');
        expect(component.isQuestionEmpty()).toBeFalse();

        component.questionForm.controls['text'].markAsTouched();
        expect(component.isQuestionEmpty()).toBeTrue();

        component.questionForm.controls['text'].setValue('a');
        expect(component.isQuestionEmpty()).not.toBeTrue();
    });

    it('showPointsError should return different messages depending on the points of the question', () => {
        const points1 = 5;
        const points2 = 120;
        const msg1 = 'Doit être entre 10 et 100.';
        const points3 = 23;
        const msg2 = 'Doit être un multiple de 10.';

        component.questionForm.controls['points'].setValue(points1);
        expect(component.showPointsError()).toEqual(msg1);

        component.questionForm.controls['points'].setValue(points2);
        expect(component.showPointsError()).toEqual(msg1);

        component.questionForm.controls['points'].setValue(points3);
        expect(component.showPointsError()).toEqual(msg2);
    });
    it('hasMinimumGooodChoices should return true if the number of good answers is between 1 and 3', () => {
        expect(component.hasMinimumGoodChoices()).toBeTrue();

        component.deleteChoice(0);
        expect(component.hasMinimumGoodChoices()).toBeFalse();
    });
    it('showCorrectnessError should return the correct message depending of the number of good choices', () => {
        const msg1 = 'Il manque un bon choix.';
        const msg2 = 'Il manque un mauvais choix.';

        component.deleteChoice(1);
        component.deleteChoice(0);
        component.addChoice(false);
        component.addChoice(false);
        component.nGoodChoices = component.choices.value.reduce((counter: number, choice: Choice) => (choice.isCorrect ? counter + 1 : counter), 0);
        expect(component.showCorrectnessError()).toEqual(msg1);

        component.deleteChoice(1);
        component.deleteChoice(0);
        component.addChoice(true);
        component.addChoice(true);
        component.nGoodChoices = component.choices.value.reduce((counter: number, choice: Choice) => (choice.isCorrect ? counter + 1 : counter), 0);
        expect(component.showCorrectnessError()).toEqual(msg2);
    });
    it('should reorder choices when dropped', () => {
        const initialChoices: Choice[] = [
            { answer: 'Choice 1', isCorrect: false },
            { answer: 'Choice 2', isCorrect: true },
            { answer: 'Choice 3', isCorrect: false },
        ];
        const formArray = new FormArray(
            initialChoices.map(
                (choice) =>
                    new FormGroup({
                        answer: new FormControl(choice.answer),
                        isCorrect: new FormControl(choice.isCorrect),
                    }),
            ),
        );

        spyOnProperty(component, 'choices', 'get').and.returnValue(formArray);

        const mockContainer: Partial<CdkDropList<Question[]>> = {
            data: [],
        };
        const mockDragItem = jasmine.createSpyObj('CdkDrag', ['someMethod1', 'someMethod2']);
        const event: CdkDragDrop<Question[]> = {
            previousIndex: 1,
            currentIndex: 2,
            container: mockContainer as CdkDropList<Question[]>,
            previousContainer: mockContainer as CdkDropList<Question[]>,
            isPointerOverContainer: true,
            item: mockDragItem,
            distance: { x: 0, y: 0 },
            dropPoint: { x: 0, y: 0 },
            event: new MouseEvent('drop'),
        };

        component.drop(event);
        const finalChoices = component.choices.value;
        expect(finalChoices[0].answer).toEqual('Choice 1');
        expect(finalChoices[1].answer).toEqual('Choice 3');
        expect(finalChoices[2].answer).toEqual('Choice 2');
    });

    it('should close the dialog with the questionForm on onSubmit ', () => {
        component.onSubmit();
        expect(matDialogRef.close).toHaveBeenCalledWith(component.questionForm);
    });
});
