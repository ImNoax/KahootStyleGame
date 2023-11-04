// import { TestBed } from '@angular/core/testing';
// import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

// import { Route } from '@app/enums';
// import { ClientSocketService } from '@app/services/client-socket.service';
// import { lobbyGuard } from './lobby.guard';

// class ClientSocketServiceMock {
//     canAccessLobby = false;
// }

// describe('lobbyGuard', () => {
//     const executeGuard: CanActivateFn = async (...guardParameters) =>
//         TestBed.runInInjectionContext(async () => lobbyGuard(...guardParameters) as Promise<boolean>);
//     let routerMock: jasmine.SpyObj<Router>;
//     let clientSocketServiceMock: ClientSocketServiceMock;
//     let route: ActivatedRouteSnapshot;
//     let state: RouterStateSnapshot;

//     beforeEach(() => {
//         routerMock = jasmine.createSpyObj('Router', ['navigate']);
//         clientSocketServiceMock = new ClientSocketServiceMock();

//         TestBed.configureTestingModule({
//             providers: [
//                 { provide: Router, useValue: routerMock },
//                 { provide: ClientSocketService, useValue: clientSocketServiceMock },
//                 { provide: ActivatedRouteSnapshot, useValue: {} },
//                 { provide: RouterStateSnapshot, useValue: {} },
//             ],
//         });
//     });

//     it('should be created', () => {
//         expect(executeGuard).toBeTruthy();
//     });

//     it('should prevent access to the waiting view if canAccessLobby is false', async () => {
//         const isAccessGranted = await executeGuard(route, state);
//         clientSocketServiceMock.canAccessLobby = false;
//         expect(isAccessGranted).toBeFalse();
//         expect(routerMock.navigate).toHaveBeenCalledWith([Route.MainMenu]);
//     });

//     it('should allow access to the waiting view if canAccessLobby is true', async () => {
//         clientSocketServiceMock.canAccessLobby = true;
//         const isAccessGranted = await executeGuard(route, state);
//         expect(isAccessGranted).toBeTrue();
//     });
// });
