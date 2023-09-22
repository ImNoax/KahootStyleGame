import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminJeuPageComponent } from '@app/pages/admin-jeu-page/admin-jeu-page.component';
import { CreateGamePageComponent } from '@app/pages/create-game-page/create-game-page.component';
import { CreationJeuComponent } from '@app/pages/creation-jeu/creation-jeu.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';
import { QuestionsPageComponent } from '@app/pages/questions-page/questions-page.component';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: MainPageComponent },
    { path: 'game', component: GamePageComponent },
    { path: 'material', component: MaterialPageComponent },
    { path: 'create-game', component: CreateGamePageComponent },
    { path: 'creation', component: CreationJeuComponent },
    { path: 'admin', component: AdminJeuPageComponent },
    { path: 'questions', component: QuestionsPageComponent },
    { path: '**', redirectTo: '/home' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
