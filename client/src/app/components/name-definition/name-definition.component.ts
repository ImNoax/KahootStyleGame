import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientSocketService } from '@app/services/client-socket.service';
import { FormManagerService } from '@app/services/form-manager.service';
import { Limit } from '@common/limit';

@Component({
    selector: 'app-name-definition',
    templateUrl: './name-definition.component.html',
    styleUrls: ['./name-definition.component.scss'],
})
export class NameDefinitionComponent implements OnDestroy {
    nameForm: FormGroup;
    maxNameLength: number = Limit.MaxNameLength;
    nameIsInvalid: boolean = false;
    serverMessage: string = '';

    constructor(
        private clientSocket: ClientSocketService,
        private formManager: FormManagerService,
    ) {
        const fb: FormBuilder = new FormBuilder();
        this.nameForm = fb.group({
            name: ['', [Validators.required, this.formManager.preventEmptyInput]],
        });

        this.configureBaseSocketFeatures();
    }

    ngOnDestroy(): void {
        this.clientSocket.socket.removeAllListeners('validName');
        this.clientSocket.socket.removeAllListeners('invalidName');
    }

    configureBaseSocketFeatures() {
        this.clientSocket.socket.on('validName', (name) => {
            this.clientSocket.playerName = name;
        });

        this.clientSocket.socket.on('invalidName', (message: string) => {
            this.serverMessage = message;
            this.nameIsInvalid = true;
        });
    }

    onSubmit() {
        const nameToValidate: string = this.nameForm.value.name.trim();
        this.clientSocket.socket.emit('validateName', nameToValidate);
    }
}
