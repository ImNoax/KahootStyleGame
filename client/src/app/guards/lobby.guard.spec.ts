import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { lobbyGuard } from './lobby.guard';

describe('lobbyGuard', () => {
    const executeGuard: CanActivateFn = async (...guardParameters) => TestBed.runInInjectionContext(async () => lobbyGuard(...guardParameters));

    beforeEach(() => {
        TestBed.configureTestingModule({});
    });

    it('should be created', () => {
        expect(executeGuard).toBeTruthy();
    });
});
