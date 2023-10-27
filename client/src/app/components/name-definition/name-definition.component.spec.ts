import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NameDefinitionComponent } from './name-definition.component';

describe('NameDefinitionComponent', () => {
    let component: NameDefinitionComponent;
    let fixture: ComponentFixture<NameDefinitionComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [NameDefinitionComponent],
        });
        fixture = TestBed.createComponent(NameDefinitionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
