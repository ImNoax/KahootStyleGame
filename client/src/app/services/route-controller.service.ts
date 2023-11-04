import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { accessDeniedMessage, snackBarErrorConfiguration } from '@app/constants/snack-bar-configuration';
import { Route } from '@app/enums';

@Injectable({
    providedIn: 'root',
})
export class RouteControllerService {
    private routes: Map<Route, boolean> = new Map<Route, boolean>([
        [Route.Admin, false],
        [Route.InGame, false],
        [Route.Lobby, false],
    ]);

    setRouteAccess(route: Route, isRouteAccessible: boolean): void {
        this.routes.set(route, isRouteAccessible);
    }

    isRouteAccessible(route: Route): boolean | undefined {
        return this.routes.get(route);
    }

    // clearAllAccesses() {
    //     this.routes.forEach((isRouteAccessible: boolean) => {
    //         isRouteAccessible = false;
    //     });
    // }

    guardRoute(route: Route) {
        const snackBar: MatSnackBar = inject(MatSnackBar);
        const router: Router = inject(Router);
        const routeController: RouteControllerService = inject(RouteControllerService);

        if (routeController.isRouteAccessible(route)) return true;
        snackBar.open(accessDeniedMessage, '', snackBarErrorConfiguration);
        router.navigate([Route.MainMenu]);
        return false;
    }
}
