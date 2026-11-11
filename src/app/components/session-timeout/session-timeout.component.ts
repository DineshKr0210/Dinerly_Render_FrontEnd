import { Component } from '@angular/core';
import { IdleTimeoutService } from 'src/app/services/idle-timout.service';

@Component({
  selector: 'app-session-timeout',
  templateUrl: './session-timeout.component.html',
  styleUrls: ['./session-timeout.component.css']
})
export class SessionTimeoutComponent {

  constructor(public idleTimeout: IdleTimeoutService) {}

  continueSession(): void {
    this.idleTimeout.continueSession();
  }

  logout(): void {
    this.idleTimeout.logout();
  }
}
