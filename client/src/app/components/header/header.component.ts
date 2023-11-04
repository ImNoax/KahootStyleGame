import { Component, Input } from '@angular/core';
import { Route } from '@app/enums';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
    @Input() title: string = '';
    mainMenuRoute: string = '/' + Route.MainMenu;
}
