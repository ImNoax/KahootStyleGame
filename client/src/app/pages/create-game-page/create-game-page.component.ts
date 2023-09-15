import { Component } from '@angular/core';
import { jeux } from '@app/pages/jeux';

@Component({
    selector: 'app-create-game-page',
    templateUrl: './create-game-page.component.html',
    styleUrls: ['./create-game-page.component.scss'],
})
export class CreateGamePageComponent {
    jeux = [...jeux];
}
