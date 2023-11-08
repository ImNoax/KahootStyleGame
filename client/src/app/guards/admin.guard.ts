import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { Route } from '@app/enums';
import { RouteControllerService } from '@app/services/route-controller.service';

export const adminGuard: CanActivateFn = () => {
    const routeController: RouteControllerService = inject(RouteControllerService);
    return routeController.isRouteAccessible(Route.Admin);
};
