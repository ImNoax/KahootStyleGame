import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Limit } from '@app/enums';
import { ClientSocketService } from '@app/services/client-socket.service';

@Component({
    selector: 'app-name-definition',
    templateUrl: './name-definition.component.html',
    styleUrls: ['./name-definition.component.scss'],
})
export class NameDefinitionComponent {
    nameForm: FormGroup;
    maxNameLength: number = Limit.MaxNameLength;
    nameIsInvalid: boolean = false;
    serverMessage: string = '';

    constructor(private clientSocket: ClientSocketService) {
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

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on('validName', (name) => {
            this.clientSocket.isNameDefined = true;
            this.clientSocket.playerName = name;
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
