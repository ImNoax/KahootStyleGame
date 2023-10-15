import { Component, Input } from '@angular/core';
import { ClientSocketService } from '@app/services/client-socket.service';
import { FormManagerService } from '@app/services/form-manager.service';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
    @Input() title: string = '';

    constructor(
        private formManager: FormManagerService,
        private clientSocket: ClientSocketService,
    ) {}

    reset() {
        this.formManager.resetGameForm();
        this.clientSocket.send('leaveLobby');
    }
}
