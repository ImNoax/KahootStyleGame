import { HttpClient, HttpHandler } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { ClientSocketService } from '@app/services/client-socket.service';
import { WaitingViewPageComponent } from './waiting-view-page.component';

describe('WaitingViewPageComponent', () => {
    let component: WaitingViewPageComponent;
    let fixture: ComponentFixture<WaitingViewPageComponent>;
    let mockClientSocketService: jasmine.SpyObj<ClientSocketService>;
    let mockRouter: jasmine.SpyObj<Router>;

    beforeEach(() => {
        mockClientSocketService = jasmine.createSpyObj('ClientSocketService', ['send']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);
        TestBed.configureTestingModule({
            declarations: [WaitingViewPageComponent, HeaderComponent],
            providers: [
                HttpClient,
                HttpHandler,
                { provide: Router, useValue: mockRouter },
                { provide: ClientSocketService, useValue: mockClientSocketService },
            ],
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
