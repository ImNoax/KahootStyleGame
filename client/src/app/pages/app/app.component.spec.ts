import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppComponent } from '@app/pages/app/app.component';
import { ClientSocketService } from '@app/services/client-socket.service';

describe('AppComponent', () => {
    let app: AppComponent;
    let fixture: ComponentFixture<AppComponent>;
    let clientSocketServiceSpy: jasmine.SpyObj<ClientSocketService>;

    beforeEach(async () => {
        clientSocketServiceSpy = jasmine.createSpyObj('ClientSocketService', ['connect']);

        await TestBed.configureTestingModule({
            imports: [AppRoutingModule],
            declarations: [AppComponent],
            providers: [{ provide: ClientSocketService, useValue: clientSocketServiceSpy }],
        }).compileComponents();

        fixture = TestBed.createComponent(AppComponent);
        app = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create the app', () => {
        expect(app).toBeTruthy();
    });

    it('ngOnInit should call connect through the ClientSocketService', () => {
        expect(clientSocketServiceSpy.connect).toHaveBeenCalled();
    });
});
