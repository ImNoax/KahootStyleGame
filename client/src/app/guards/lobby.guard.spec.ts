import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';
import { lobbyGuard } from './lobby.guard';

describe('lobbyGuard', () => {
const executeGuard: CanActivateFn = async (...guardParameters) => {
    return TestBed.runInInjectionContext(() => lobbyGuard(...guardParameters)) as Promise<boolean>;
};

    beforeEach(() => {
        TestBed.configureTestingModule({});
    });

    it('should be created', () => {
        expect(executeGuard).toBeTruthy();
    });
});
