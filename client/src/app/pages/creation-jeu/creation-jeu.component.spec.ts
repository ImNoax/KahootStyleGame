import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GameHandlingService } from '@app/services/game-handling.service';
import { CreationJeuComponent } from './creation-jeu.component';

describe('CreationJeuComponent', () => {
    let component: CreationJeuComponent;
    let fixture: ComponentFixture<CreationJeuComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [CreationJeuComponent],
            providers: [GameHandlingService],
            imports: [HttpClientTestingModule],
        }).compileComponents();
        fixture = TestBed.createComponent(CreationJeuComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('verifyName should change isNameDuplicate if the name already exist', () => {
        const nameInput = fixture.debugElement.nativeElement.querySelector('#nameField');
        const event = new InputEvent('keyup');

        nameInput.value = 'Game 1';
        nameInput.dispatchEvent(event);
        spyOn(TestBed.inject(GameHandlingService), 'getGames').and.callThrough();

        component.ngOnInit();
        fixture.detectChanges();

        component.verifyName(event);
        expect(component.isNameDuplicate).toBe(true);
    });
});
