import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { pinVerificationGuard } from './pin-verification.guard';

describe('pinVerificationGuard', () => {
    const executeGuard: CanActivateFn = async (...guardParameters) =>
        TestBed.runInInjectionContext(async () => pinVerificationGuard(...guardParameters));

    beforeEach(() => {
        TestBed.configureTestingModule({});
    });

    it('should be created', () => {
        expect(executeGuard).toBeTruthy();
    });
});
