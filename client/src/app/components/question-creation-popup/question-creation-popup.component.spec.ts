import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionCreationPopupComponent } from './question-creation-popup.component';

describe('QuestionCreationPopupComponent', () => {
    let component: QuestionCreationPopupComponent;
    let fixture: ComponentFixture<QuestionCreationPopupComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [QuestionCreationPopupComponent],
        });
        fixture = TestBed.createComponent(QuestionCreationPopupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
