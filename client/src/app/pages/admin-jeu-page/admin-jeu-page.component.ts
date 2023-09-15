import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-admin-jeu-page',
    templateUrl: './admin-jeu-page.component.html',
    styleUrls: ['./admin-jeu-page.component.scss'],
})
export class AdminJeuPageComponent implements OnInit {
    ngOnInit() {
        const toggleImages = document.querySelectorAll('.toggle-image');

        toggleImages.forEach((imageElement) => {
            const image = imageElement as HTMLImageElement;

            image.addEventListener('click', () => {
                const currentSrc = image.src;
                const altSrc = image.getAttribute('data-alt-src');

                if (altSrc !== null) {
                    image.src = altSrc;
                    image.setAttribute('data-alt-src', currentSrc);
                }
            });
        });
    }
}
