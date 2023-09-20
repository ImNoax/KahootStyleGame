import { Component } from '@angular/core';
import { GameHandlingService } from '@angular/../../client/src/app/services/game-handling.service';
import { Jeu } from '@common/jeu';
import { GamePageComponent } from "@angular/../../client/src/app/pages/game-page/game-page.component";

interface Button {
  color: string;
  selected: boolean;
  text: string;
  isCorrect: boolean;
}

interface Choice {
  answer: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-button-response',
  templateUrl: './button-response.component.html',
  styleUrls: ['./button-response.component.scss'],
})

export class ButtonResponseComponent {
  buttons: Button[] = [];
  games: Jeu[] = [];

  constructor(private gameService: GameHandlingService, private gamePage: GamePageComponent) { }

  ngOnInit(): void {
    this.gameService.getGames().subscribe((data: Jeu[]) => {
      this.games = data;
      this.updateButtons();
    });
  }

  updateButtons() {
    const currentGame = this.games[this.gameService.currentGameId];
    let questionOfInterest;
    questionOfInterest = currentGame.questions[this.gameService.currentQuestionId];

    if (questionOfInterest.choices) {
      this.buttons = [];
      questionOfInterest.choices.forEach((choice: Choice) => {
        this.buttons.push({
          color: 'white',
          selected: false,
          text: choice.answer,
          isCorrect: choice.isCorrect
        });
      });
    }
  }

  onButtonClick(button: Button) {
    button.selected = !button.selected;
    button.color = button.selected ? 'lightblue' : 'white';
  }

  verifyResponsesAndCallUpdate() {
    let clickedChoicesCount = 0;
    let correctChoicesCount = 0;
    let isAnswerCorrect = true;

    this.buttons.forEach(button => {

      if (button.isCorrect) {
        correctChoicesCount++
      }

      if (button.selected) {
        clickedChoicesCount++;
        if (!button.isCorrect) {
          isAnswerCorrect = false;
        }
      }
    });

    if (clickedChoicesCount !== correctChoicesCount) {
      isAnswerCorrect = false;
    }


    if (isAnswerCorrect) {
      console.log("la reponse est bonne");
      this.UpdateGameQuestions();

    }
    else {
      console.log("Mauvaise reponse ")
      this.UpdateGameQuestions();
    }

  }

  UpdateGameQuestions() {
    if (this.gameService.currentQuestionId === ((this.games[this.gameService.currentGameId]).questions.length - 1))// on verifie si c'est la derniere question de la game
    {
      alert("Fin de la partie !")
    } else {
      //ajuster pointage
      this.gameService.setCurrentQuestionId(++this.gameService.currentQuestionId);
      this.updateButtons();
      this.gamePage.updateQuestion();
    }
  }

}


