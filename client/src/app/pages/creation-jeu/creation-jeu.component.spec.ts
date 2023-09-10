import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreationJeuComponent } from './creation-jeu.component';

describe('CreationJeuComponent', () => {
  let component: CreationJeuComponent;
  let fixture: ComponentFixture<CreationJeuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CreationJeuComponent]
    });
    fixture = TestBed.createComponent(CreationJeuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
