import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { GameHandlingService } from '@app/services/game-handling.service';
import { BehaviorSubject } from 'rxjs';

const ERROR401 = 401;

@Component({
    selector: 'app-main-page',
    templateUrl: './main-page.component.html',
    styleUrls: ['./main-page.component.scss'],
})
export class MainPageComponent {
    readonly title: string = 'Survey Genius';
    message: BehaviorSubject<string> = new BehaviorSubject<string>('');

    constructor(
        private readonly gameHandler: GameHandlingService,
        private readonly router: Router,
    ) {}

    adminLogin(): void {
        const password = prompt('Veuillez entrer le mot de passe:');
        if (password) {
            this.gameHandler.verifyAdminPassword(password).subscribe({
                next: (response) => {
                    if (response) {
                        this.router.navigate(['/admin']);
                    }
                },
                error: (error: HttpErrorResponse) => {
                    if (error.status === ERROR401) {
                        alert('Mot de passe incorrect !');
                    } else {
                        alert('Une erreur est survenue');
                    }
                },
            });
        }
    }
}
