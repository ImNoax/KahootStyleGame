import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ButtonResponseComponent } from './button-response.component';

describe('ButtonResponseComponent', () => {
  let component: ButtonResponseComponent;
  let fixture: ComponentFixture<ButtonResponseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ButtonResponseComponent]
    });
    fixture = TestBed.createComponent(ButtonResponseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
