import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NameDefinitionPageComponent } from './name-definition-page.component';

describe('NameDefinitionPageComponent', () => {
    let component: NameDefinitionPageComponent;
    let fixture: ComponentFixture<NameDefinitionPageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [NameDefinitionPageComponent],
        });
        fixture = TestBed.createComponent(NameDefinitionPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
