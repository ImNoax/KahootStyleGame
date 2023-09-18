import { Component } from '@angular/core';

@Component({
    selector: 'app-button-response',
    templateUrl: './button-response.component.html',
    styleUrls: ['./button-response.component.scss'],
})
export class ButtonResponseComponent {
      buttons = [
    { id: 1, color: 'white', clicked: false },
    { id: 2, color: 'white', clicked: false },
    { id: 3, color: 'white', clicked: false },
    { id: 4, color: 'white', clicked: false }
  ];

  onButtonClick(button: { clicked: boolean; color: string; }) {
    button.clicked = !button.clicked;
    button.color = button.clicked ? 'lightblue' : 'white'; 
  }

  sendInfo() {
    console.log(this.buttons);
    console.log("test")
   }

}
