import { MatSnackBarConfig } from '@angular/material/snack-bar';

const snackBarDuration = 4000;
export const accessDeniedMessage = 'Erreur: Accès non autorisé ⚠️';

export const snackBarNormalConfiguration: MatSnackBarConfig = {
    duration: snackBarDuration,
    verticalPosition: 'top',
};

export const snackBarErrorConfiguration: MatSnackBarConfig = {
    duration: snackBarDuration,
    panelClass: ['snack-bar-error'],
    verticalPosition: 'top',
};
