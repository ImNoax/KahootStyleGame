import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ClientSocketService } from '@app/services/client-socket.service';

export const lobbyGuard: CanActivateFn = () => {
    const clientSocket: ClientSocketService = inject(ClientSocketService);
    const router: Router = inject(Router);
    if (clientSocket.canAccessLobby) return true;
    router.navigate(['/home']);
    return false;
};
