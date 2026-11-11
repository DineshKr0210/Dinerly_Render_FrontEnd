import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import type { AuthScope } from './waitlist-auth.service';

@Injectable({ providedIn: 'root' })
export class IdleTimeoutService implements OnDestroy {
  private readonly IDLE_TIMEOUT = 5 * 60 * 1000;
  private readonly WARNING_TIMEOUT = 60;
  private readonly ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private countdownSubscription: Subscription | null = null;
  private activityHandler: (() => void) | null = null;
  private currentScope: AuthScope | null = null;
  private warningVisible = false;
  private countdown = this.WARNING_TIMEOUT;

  showWarning = false;
  remainingSeconds = this.WARNING_TIMEOUT;

  constructor(private router: Router, private ngZone: NgZone) {}

  start(scope: AuthScope): void {
    this.stop();
    this.currentScope = scope;
    this.ngZone.runOutsideAngular(() => {
      this.activityHandler = () => {
        this.ngZone.run(() => this.handleActivity());
      };
      this.ACTIVITY_EVENTS.forEach(event => {
        window.addEventListener(event, this.activityHandler!, { passive: true });
      });
      this.resetIdleTimer();
    });
  }

  stop(): void {
    this.clearIdleTimer();
    this.stopCountdown();
    this.removeActivityListeners();
    this.currentScope = null;
    this.warningVisible = false;
    this.countdown = this.WARNING_TIMEOUT;
    this.remainingSeconds = this.WARNING_TIMEOUT;
    this.showWarning = false;
  }

  private handleActivity(): void {
    if (this.warningVisible) {
      return;
    }
    this.resetIdleTimer();
  }

  private resetIdleTimer(): void {
    this.clearIdleTimer();
    this.idleTimer = setTimeout(() => {
      this.ngZone.run(() => this.showSessionWarning());
    }, this.IDLE_TIMEOUT);
  }

  private showSessionWarning(): void {
    if (!this.currentScope) {
      return;
    }
    this.warningVisible = true;
    this.showWarning = true;
    this.countdown = this.WARNING_TIMEOUT;
    this.remainingSeconds = this.WARNING_TIMEOUT;
    this.countdownSubscription = interval(1000).subscribe(() => {
      this.countdown--;
      this.remainingSeconds = this.countdown;
      if (this.countdown <= 0) {
        this.logout();
      }
    });
  }

  continueSession(): void {
    if (!this.currentScope) {
      return;
    }
    this.stopCountdown();
    this.warningVisible = false;
    this.showWarning = false;
    this.countdown = this.WARNING_TIMEOUT;
    this.remainingSeconds = this.WARNING_TIMEOUT;
    this.resetIdleTimer();
  }

  logout(): void {
    const scope = this.currentScope;
    this.stop();
    if (!scope) {
      return;
    }
    if (scope === 'guest') {
      this.router.navigate(['/user']);
    } else if (scope === 'admin') {
      this.router.navigate(['/login/admin']);
    } else {
      this.router.navigate(['/login/restaurant']);
    }
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private stopCountdown(): void {
    this.countdownSubscription?.unsubscribe();
    this.countdownSubscription = null;
  }

  private removeActivityListeners(): void {
    if (!this.activityHandler) {
      return;
    }
    this.ACTIVITY_EVENTS.forEach(event => {
      window.removeEventListener(event, this.activityHandler!);
    });
    this.activityHandler = null;
  }

  ngOnDestroy(): void {
    this.stop();
  }
}