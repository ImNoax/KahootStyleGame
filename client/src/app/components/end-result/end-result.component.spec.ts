import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EndResultComponent } from './end-result.component';

describe('EndResultComponent', () => {
    let component: EndResultComponent;
    let fixture: ComponentFixture<EndResultComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [EndResultComponent],
        });
        fixture = TestBed.createComponent(EndResultComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
