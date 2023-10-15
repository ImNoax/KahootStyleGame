import { Component, OnInit } from '@angular/core';
import { ClientSocketService } from '@app/services/client-socket.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    constructor(private clientSocket: ClientSocketService) {}

    ngOnInit(): void {
        this.clientSocket.connect();
    }
}
