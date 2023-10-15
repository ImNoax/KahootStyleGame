import { Component, OnDestroy } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Limit } from '@app/enums';
import { ClientSocketService } from '@app/services/client-socket.service';

@Component({
    selector: 'app-name-definition-page',
    templateUrl: './name-definition-page.component.html',
    styleUrls: ['./name-definition-page.component.scss'],
})
export class NameDefinitionPageComponent implements OnDestroy {
    nameForm: FormGroup;
    maxNameLength: number = Limit.MaxNameLength;
    nameIsInvalid: boolean = false;
    serverMessage: string = '';

    constructor(
        private clientSocket: ClientSocketService,
        private router: Router,
    ) {
        const fb: FormBuilder = new FormBuilder();
        this.nameForm = fb.group({
            name: ['', [Validators.required, this.preventEmptyInput]],
        });

        this.configureBaseSocketFeatures();
    }

    preventEmptyInput(control: AbstractControl) {
        const whiteSpaceRemoved = control.value.trim();
        return whiteSpaceRemoved.length === 0 ? { isEmpty: true } : null;
    }

    ngOnDestroy(): void {
        this.clientSocket.canAccessNameDefinition = false;
    }

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on('validName', () => {
            this.clientSocket.canAccessLobby = true;
            this.router.navigate(['/waiting']);
        });

        this.clientSocket.socket.on('invalidName', (message: string) => {
            this.serverMessage = message;
            this.nameIsInvalid = true;
        });
    }

    onSubmit() {
        const nameToValidate: string = this.nameForm.value.name.trim();
        this.clientSocket.send('validateName', nameToValidate);
    }
}
