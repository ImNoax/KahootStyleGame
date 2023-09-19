import { Component } from '@angular/core';
import { GameHandlingService } from '@angular/../../client/src/app/services/game-handling.service';
import { Jeu } from '@common/jeu';

const ID_QUESTION = 1
const ID_GAME = 0 // a transformer en service pour share le game-question id pour update 
interface Button {

  id: number;
  color: string;
  clicked: boolean;
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

  constructor(private gameService: GameHandlingService) { }

  ngOnInit(): void {
    this.gameService.getGames().subscribe((data: Jeu[]) => {
      this.games = data;
      this.updateButtons();
    });
  }

  updateButtons() {
    if (this.games.length) {
      const questionOfInterest = this.games[ID_GAME].questions.find(question => question.id === ID_QUESTION);
      if (questionOfInterest && questionOfInterest.choices) {
        let buttonId = 1;
        questionOfInterest.choices.forEach((choice: Choice) => {
          this.buttons.push({
            id: buttonId,
            color: 'white',
            clicked: false,
            text: choice.answer,
            isCorrect: choice.isCorrect
          });
          buttonId++;
        });
      }
    }
  }

  onButtonClick(button: Button) {
    button.clicked = !button.clicked;
    button.color = button.clicked ? 'lightblue' : 'white';
  }

  sendInfo() {

    console.log(this.buttons);
    console.log("test")
  }

}
