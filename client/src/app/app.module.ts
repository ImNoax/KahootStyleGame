import { ClipboardModule } from '@angular/cdk/clipboard';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { QuestionCreationPopupComponent } from '@app/components/question-creation-popup/question-creation-popup.component';
import { AppRoutingModule } from '@app/modules/app-routing.module';
import { AppMaterialModule } from '@app/modules/material.module';
import { AdminJeuPageComponent } from '@app/pages/admin-jeu-page/admin-jeu-page.component';
import { AppComponent } from '@app/pages/app/app.component';
import { CreateGamePageComponent } from '@app/pages/create-game-page/create-game-page.component';
import { GamePageComponent } from '@app/pages/game-page/game-page.component';
import { MainPageComponent } from '@app/pages/main-page/main-page.component';
import { MaterialPageComponent } from '@app/pages/material-page/material-page.component';
import { WaitingViewPageComponent } from '@app/pages/waiting-view-page/waiting-view-page.component';
import { ButtonResponseComponent } from './components/button-response/button-response.component';
import { ChatBoxComponent } from './components/chat-box/chat-box.component';
import { EndResultComponent } from './components/end-result/end-result.component';
import { GameImportPopupComponent } from './components/game-import-popup/game-import-popup.component';
import { HeaderComponent } from './components/header/header.component';
import { HistogramComponent } from './components/histogram/histogram.component';
import { NameDefinitionComponent } from './components/name-definition/name-definition.component';
import { PlayerListComponent } from './components/player-list/player-list.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { CreationJeuComponent } from './pages/creation-jeu/creation-jeu.component';
import { QuestionsPageComponent } from './pages/questions-page/questions-page.component';

/**
 * Main module that is used in main.ts.
 * All automatically generated components will appear in this module.
 * Please do not move this module in the module folder.
 * Otherwise Angular Cli will not know in which module to put new component
 */
@NgModule({
    declarations: [
        AppComponent,
        AdminJeuPageComponent,
        GamePageComponent,
        MainPageComponent,
        MaterialPageComponent,
        ProgressBarComponent,
        ButtonResponseComponent,
        CreationJeuComponent,
        HeaderComponent,
        QuestionsPageComponent,
        CreateGamePageComponent,
        QuestionCreationPopupComponent,
        GameImportPopupComponent,
        WaitingViewPageComponent,
        NameDefinitionComponent,
        ChatBoxComponent,
        EndResultComponent,
        HistogramComponent,
        PlayerListComponent,
    ],
    imports: [
        AppMaterialModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        BrowserModule,
        FormsModule,
        HttpClientModule,
        DragDropModule,
        ReactiveFormsModule,
        MatSlideToggleModule,
        MatInputModule,
        MatIconModule,
        MatSnackBarModule,
        ClipboardModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
