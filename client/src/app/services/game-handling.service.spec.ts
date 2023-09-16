import { TestBed } from '@angular/core/testing';

import { GameHandlingService } from './game-handling.service';

describe('GameHandlingService', () => {
    let service: GameHandlingService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(GameHandlingService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
