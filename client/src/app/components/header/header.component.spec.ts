import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { FormManagerService } from '@app/services/form-manager.service';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
    let component: HeaderComponent;
    let fixture: ComponentFixture<HeaderComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [HeaderComponent],
            imports: [MatIconModule, HttpClientTestingModule],
            providers: [FormManagerService],
        });
        fixture = TestBed.createComponent(HeaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('reset should call resetGameForm from the formManager', () => {
        const mockReset = spyOn(TestBed.inject(FormManagerService), 'resetGameForm');
        component.reset();
        expect(mockReset).toHaveBeenCalled();
    });
});
