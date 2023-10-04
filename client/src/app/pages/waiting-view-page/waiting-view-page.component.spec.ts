import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HttpClient, HttpHandler } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { HeaderComponent } from '@app/components/header/header.component';
import { WaitingViewPageComponent } from './waiting-view-page.component';

describe('WaitingViewPageComponent', () => {
    let component: WaitingViewPageComponent;
    let fixture: ComponentFixture<WaitingViewPageComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [WaitingViewPageComponent, HeaderComponent],
            providers: [HttpClient, HttpHandler],
            imports: [MatIconModule],
        });
        fixture = TestBed.createComponent(WaitingViewPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
