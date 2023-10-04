import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { GameHandlingService } from '@app/services/game-handling.service';
import { of, throwError } from 'rxjs';
describe('MainPageComponent', () => {
    let component: MainPageComponent;
    let fixture: ComponentFixture<MainPageComponent>;
    let mockGameHandlingService: jasmine.SpyObj<GameHandlingService>;
    let mockRouter: jasmine.SpyObj<Router>;
    beforeEach(async () => {
        mockGameHandlingService = jasmine.createSpyObj('GameHandlingService', ['verifyAdminPassword']);
        mockRouter = jasmine.createSpyObj('Router', ['navigate']);

        TestBed.configureTestingModule({
            declarations: [MainPageComponent],
            providers: [
                { provide: GameHandlingService, useValue: mockGameHandlingService },
                { provide: Router, useValue: mockRouter },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
    });

    beforeEach(() => {
        spyOn(window, 'prompt').and.returnValue('testPassword');
        spyOn(window, 'alert').and.stub();
        fixture = TestBed.createComponent(MainPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('should navigate to admin route when password is correct', fakeAsync(() => {
        mockGameHandlingService.verifyAdminPassword.and.returnValue(of(true));
        component.adminLogin();
        tick();
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/admin']);
    }));

    it('should alert when password is incorrect', fakeAsync(() => {
        mockGameHandlingService.verifyAdminPassword.and.returnValue(throwError(() => ({ status: 401 })));
        component.adminLogin();
        tick();
        expect(window.alert).toHaveBeenCalledWith('Mot de passe incorrect !');
    }));

    it('should alert on other errors', fakeAsync(() => {
        mockGameHandlingService.verifyAdminPassword.and.returnValue(throwError(() => ({ status: 500 })));
        component.adminLogin();
        tick();
        expect(window.alert).toHaveBeenCalledWith('Une erreur est survenue');
    }));
});
