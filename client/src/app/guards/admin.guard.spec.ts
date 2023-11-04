// import { TestBed } from '@angular/core/testing';
// import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
// import { RouteControllerService } from '@app/services/route-controller.service';
// import { adminGuard } from './admin.guard';

// describe('adminGuard', () => {
//     const executeGuard: CanActivateFn = async (...guardParameters) =>
//         TestBed.runInInjectionContext(async () => adminGuard(...guardParameters) as Promise<boolean>);
//     let routerControllerServiceMock: jasmine.SpyObj<RouteControllerService>;
//     let routerMock: jasmine.SpyObj<Router>;
//     let route: ActivatedRouteSnapshot;
//     let state: RouterStateSnapshot;

//     beforeEach(() => {
//         routerMock = jasmine.createSpyObj('Router', ['navigate']);
//         routerControllerServiceMock = jasmine.createSpyObj('RouteControllerService', ['isRouteAccessible']);

//         TestBed.configureTestingModule({
//             providers: [
//                 { provide: RouteControllerService, useValue: routerControllerServiceMock },
//                 { provide: Router, useValue: routerMock },
//                 { provide: ActivatedRouteSnapshot, useValue: {} },
//                 { provide: RouterStateSnapshot, useValue: {} },
//             ],
//         });
//     });

//     it('should prevent access to the admin and quiz creation view if isRouteAccessible(Route.Admin)
// from RouteControllerService is false', async () => {
//         routerControllerServiceMock.isRouteAccessible.and.returnValue(false);
//         const isAccessGranted = await executeGuard(route, state);
//         expect(routerControllerServiceMock.isRouteAccessible).toBeFalse();
//         expect(routerMock.navigate).toHaveBeenCalledWith(['/home']);
//         expect(isAccessGranted).toBeFalse();
//     });

//     it('should allow access to the admin and quiz creation view if isRouteAccessible(Route.Admin)
// from RouteControllerService is true', async () => {
//         routerControllerServiceMock.isRouteAccessible.and.returnValue(true);
//         const isAccessGranted = await executeGuard(route, state);
//         expect(routerControllerServiceMock.isRouteAccessible).toBeTrue();
//         expect(isAccessGranted).toBeTrue();
//     });
// });
