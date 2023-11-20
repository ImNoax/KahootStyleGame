import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { ACCESS_DENIED_MESSAGE, SNACK_BAR_ERROR_CONFIGURATION } from '@app/constants/snack-bar-configuration';
import { Route } from '@app/enums';

export type IsRouteAccessible = boolean;

@Injectable({
    providedIn: 'root',
})
export class RouteControllerService {
    routes: Map<Route, IsRouteAccessible> = new Map<Route, boolean>([
        [Route.Admin, false],
        [Route.InGame, false],
        [Route.Lobby, false],
    ]);

    constructor(
        private snackBar: MatSnackBar,
        private router: Router,
    ) {}

    setRouteAccess(route: Route, isRouteAccessible: boolean): void {
        this.routes.set(route, isRouteAccessible);
    }

    isRouteAccessible(route: Route): boolean {
        if (this.routes.get(route)) return true;
        this.snackBar.open(ACCESS_DENIED_MESSAGE, '', SNACK_BAR_ERROR_CONFIGURATION);
        this.router.navigate([Route.MainMenu]);
        return false;
    }
}
