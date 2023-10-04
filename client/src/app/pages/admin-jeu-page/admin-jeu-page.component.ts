import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { GameImportPopupComponent } from '@app/components/game-import-popup/game-import-popup.component';
import { Limits } from '@app/enums';
import { FormManagerService } from '@app/services/form-manager.service';
import { GameHandlingService } from '@app/services/game-handling.service';
import { Jeu } from '@common/jeu';
import { saveAs } from 'file-saver';

const JSON_SPACE = 4;

@Component({
    selector: 'app-admin-jeu-page',
    templateUrl: './admin-jeu-page.component.html',
    styleUrls: ['./admin-jeu-page.component.scss'],
})
export class AdminJeuPageComponent implements OnInit {
    games: Jeu[];
    fileName: string = '';
    isFileEmpty: boolean = false;
    isFormInvalid: boolean = false;

    constructor(
        private gameHandler: GameHandlingService,
        private dialog: MatDialog,
        private formManager: FormManagerService,
    ) {}

    ngOnInit(): void {
        this.gameHandler.getGames().subscribe((games: Jeu[]) => {
            this.games = games;
        });
    }

    modifyGame(game: Jeu): void {
        const fb = new FormBuilder();
        const gameForm: FormGroup = fb.group({
            id: game.id,
            title: [game.title, Validators.required],
            description: [game.description, Validators.required],
            duration: [game.duration, Validators.required],
            lastModification: game.lastModification,
            isVisible: game.isVisible,
            questions: fb.array(
                game.questions.map((question) => {
                    return fb.group({
                        text: [question.text, [Validators.required, this.formManager.preventEmptyInput]],
                        points: [question.points, [Validators.required, Validators.pattern('^[1-9][0-9]*0$'), Validators.max(Limits.MaxPoints)]],
                        type: question.type,
                        choices: fb.array(
                            question.choices.map((choice) => {
                                return fb.group({
                                    answer: [choice.answer, [Validators.required, this.formManager.preventEmptyInput]],
                                    isCorrect: choice.isCorrect,
                                });
                            }),
                        ),
                    });
                }),
            ),
        });
        this.formManager.gameForm = gameForm;
        this.formManager.nameModif = game.title;
    }

    exportGame(i: number): void {
        this.gameHandler.export(i).subscribe((data) => {
            const file = new Blob([JSON.stringify(data, null, JSON_SPACE)], { type: 'application/json' });
            const downloadURL = window.URL.createObjectURL(file);
            saveAs(downloadURL, `Game_${i}.json`);
        });
    }

    toggleVisibility(game: Jeu): void {
        const toggledVisibility = !game.isVisible;

        this.gameHandler.changeVisibility({ ...game, isVisible: toggledVisibility }).subscribe({
            next: () => {
                game.isVisible = toggledVisibility;
            },
        });
    }

    isGameInList(game: Jeu): boolean {
        for (const g of this.games) {
            if (g.title === game.title) {
                return true;
            }
        }
        return false;
    }

    confirmDeletion(game: Jeu): void {
        const confirmation = window.confirm('Are you sure you want to delete this game?');
        if (confirmation) {
            this.gameHandler.deleteGame(game.id).subscribe({
                next: () => {
                    this.games = this.games.filter((g) => g.id !== game.id);
                },
            });
        }
    }

    deleteGame(game: Jeu): void {
        this.gameHandler.getGames().subscribe((games) => {
            this.games = games;
            if (!this.isGameInList(game)) {
                window.alert('The game has already been deleted');
            } else {
                this.confirmDeletion(game);
            }
        });
    }

    importGame($event: Event): void {
        const gameFiles: FileList | null = ($event.target as HTMLInputElement).files;

        if (gameFiles != null) {
            const gameFile: File = gameFiles[0];
            this.readFile(gameFile);
        }
        ($event.target as HTMLInputElement).value = '';
    }

    readFile(gameFile: File): void {
        const fileReader = new FileReader();
        fileReader.onload = () => {
            try {
                const importedGame: string = fileReader.result as string;

                if (importedGame !== undefined && importedGame.trim().length !== 0) {
                    this.isFileEmpty = false;
                    this.isFormInvalid = false;
                    this.openImportPopup(JSON.parse(importedGame));
                } else {
                    this.isFileEmpty = true;
                    this.isFormInvalid = false;
                }
            } catch {
                this.isFormInvalid = true;
                this.isFileEmpty = false;
            }
        };
        this.fileName = gameFile.name;
        fileReader.readAsText(gameFile);
    }

    openImportPopup(importedGame: Jeu) {
        const fileName: string = this.fileName;
        const games: Jeu[] = this.games;
        const importPopup: MatDialogRef<GameImportPopupComponent> = this.dialog.open(GameImportPopupComponent, {
            data: { importedGame, games, fileName },
            width: '60%',
            height: '70%',
            backdropClass: 'backdropBackground',
            disableClose: true,
        });

        importPopup.afterClosed().subscribe((newGames: Jeu[]) => {
            if (newGames !== undefined) {
                this.games = newGames;
            }
        });
    }

    resetForm(): void {
        this.formManager.resetGameForm();
    }
}
