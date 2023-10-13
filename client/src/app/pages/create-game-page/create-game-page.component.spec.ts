import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { HeaderComponent } from '@app/components/header/header.component';
import { GameHandlingService } from '@app/services/game-handling.service';
import { Jeu } from '@common/jeu';
import { of } from 'rxjs';
import { CreateGamePageComponent } from './create-game-page.component';

describe('CreateGamePageComponent', () => {
    let component: CreateGamePageComponent;
    let fixture: ComponentFixture<CreateGamePageComponent>;
    let gameHandler: GameHandlingService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, MatIconModule],
            declarations: [CreateGamePageComponent, HeaderComponent],
            providers: [GameHandlingService, Router],
        }).compileComponents();
        fixture = TestBed.createComponent(CreateGamePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        gameHandler = TestBed.inject(GameHandlingService);
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
    it('ngOnInit should get the list of games', () => {
        const games: Jeu[] = [];
        const mockGetGames = spyOn(gameHandler, 'getGames').and.returnValue(of(games));

        component.ngOnInit();
        expect(mockGetGames).toHaveBeenCalled();
        expect(component.games).toBeDefined();
    });

    it('selectRow should select a row and set selectedGame', () => {
        const mockGames = [
            { id: 0, title: 'Game 1', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
            { id: 1, title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
        ];

        component.games = mockGames;
        component.selectRow(1);

        expect(component.selectedRowIndex).toBe(1);
        expect(component.selectedGame).toEqual(mockGames[1]);
    });

    it('selectRow should clear selection when index is null', () => {
        component.selectedRowIndex = 1;
        component.selectedGame = { id: 2, title: 'Game 3', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] };

        component.selectRow(null);

        expect(component.selectedRowIndex).toBeNull();
        expect(component.selectedGame).toBeNull();
    });

    it('testerJeu should navigate to /game when game is visible and existing', () => {
        const games = [
            { id: 0, title: 'Game 1', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
            { id: 1, title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: true, questions: [] },
        ];
        component.selectedGame = { id: 1, title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: true, questions: [] };

        const mockGetGames = spyOn(gameHandler, 'getGames').and.returnValue(of(games));
        spyOn(gameHandler, 'setCurrentGameId');
        const navigateSpy = spyOn(component.router, 'navigate');

        component.testerJeu();

        expect(mockGetGames).toHaveBeenCalled();
        expect(component.games).toBeDefined();

        expect(gameHandler.setCurrentGameId).toHaveBeenCalledWith(1);
        expect(navigateSpy).toHaveBeenCalledWith(['/game']);
    });

    it('testerJeu should show an alert if game is no longer visible', () => {
        const games = [
            { id: 0, title: 'Game 1', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
            { id: 1, title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
        ];
        component.selectedGame = { id: 1, title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: true, questions: [] };

        const mockGetGames = spyOn(gameHandler, 'getGames').and.returnValue(of(games));

        spyOn(component, 'selectRow');
        spyOn(window, 'alert');

        component.testerJeu();
        expect(mockGetGames).toHaveBeenCalled();
        expect(component.games).toBeDefined();

        expect(window.alert).toHaveBeenCalledWith('Erreur: Jeu Indisponible... Rafraichissement de page.');
        expect(component.selectRow).toHaveBeenCalledWith(null);
    });

    it('should return true when the list is empty', () => {
        const mockGames: Jeu[] = [];
        component.games = mockGames;
        expect(component.allGamesAreHiddenOrListIsEmpty()).toBeTrue();
    });

    it('should return true when all games are hidden', () => {
        const mockGames = [
            { id: 0, title: 'Game 1', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
            { id: 1, title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
        ];
        component.games = mockGames;

        expect(component.allGamesAreHiddenOrListIsEmpty()).toBeTrue();
    });

    it('should return false when at least one game is visible', () => {
        const mockGames = [
            { id: 0, title: 'Game 1', description: '', duration: 0, lastModification: '', isVisible: false, questions: [] },
            { id: 1, title: 'Game 2', description: '', duration: 0, lastModification: '', isVisible: true, questions: [] },
        ];
        component.games = mockGames;

        expect(component.allGamesAreHiddenOrListIsEmpty()).toBeFalse();
    });
});
