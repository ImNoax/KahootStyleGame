import { Component, Input } from '@angular/core';
import { FormManagerService } from '@app/services/form-manager.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
    @Input() title: string = '';

    constructor(private formManager: FormManagerService) {}

    resetForm() {
        this.formManager.resetGameForm();
    }
}
