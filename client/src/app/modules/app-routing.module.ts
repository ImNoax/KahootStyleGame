import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Route } from '@app/enums';
import { adminGuard } from '@app/guards/admin.guard';
import { inGameGuard } from '@app/guards/in-game.guard';
import { lobbyGuard } from '@app/guards/lobby.guard';
import { AdminJeuPageComponent } from '@app/pages/admin-jeu-page/admin-jeu-page.component';
import { CreateGamePageComponent } from '@app/pages/create-game-page/create-game-page.component';
import { CreationJeuComponent } from '@app/pages/creation-jeu/creation-jeu.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { LobbyPageComponent } from '@app/pages/lobby-page/lobby-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { QuestionsPageComponent } from '@app/pages/questions-page/questions-page.component';

const routes: Routes = [
    { path: '', redirectTo: Route.MainMenu, pathMatch: 'full' },
    { path: Route.MainMenu, component: MainPageComponent },
    { path: Route.Lobby, component: LobbyPageComponent, canActivate: [lobbyGuard] },
    { path: Route.GameCreation, component: CreateGamePageComponent },
    { path: Route.InGame, component: GamePageComponent, canActivate: [inGameGuard] },
    { path: Route.Admin, component: AdminJeuPageComponent, canActivate: [adminGuard] },
    { path: Route.QuizCreation, component: CreationJeuComponent, canActivate: [adminGuard] },
    { path: Route.QuestionCreation, component: QuestionsPageComponent, canActivate: [adminGuard] },
    { path: '**', redirectTo: Route.MainMenu },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
