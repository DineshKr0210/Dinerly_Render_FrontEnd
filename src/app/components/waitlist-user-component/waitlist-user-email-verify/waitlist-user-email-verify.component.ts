import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  Subject,
  finalize,
  takeUntil
} from 'rxjs';

import {
  WaitlistAuthService
} from 'src/app/services/waitlist-auth.service';


type VerificationStatus =
  | 'loading'
  | 'success'
  | 'error';


@Component({
  selector: 'app-waitlist-user-email-verify',
  templateUrl: './waitlist-user-email-verify.component.html',
  styleUrls: ['./waitlist-user-email-verify.component.css']
})
export class WaitlistUserEmailVerifyComponent
  implements OnInit, OnDestroy {

  status: VerificationStatus =
    'loading';

  message =
    'Verifying your email address...';

  isLoading = true;

  showPopup = false;

  private redirectTimer?: ReturnType<
    typeof setTimeout
  >;

  private readonly destroy$ =
    new Subject<void>();


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService:
      WaitlistAuthService
  ) {}


  ngOnInit(): void {

    const token =
      this.route.snapshot
        .queryParamMap
        .get('token');

    if (!token) {

      this.showVerificationError(
        'Verification token is missing.'
      );

      return;
    }

    this.verifyEmail(token);
  }


  private verifyEmail(
    token: string
  ): void {

    this.status = 'loading';

    this.isLoading = true;

    this.message =
      'Verifying your email address...';

    this.authService
      .verifyEmail(token)
      .pipe(
        takeUntil(this.destroy$),

        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe({
        next: response => {

          if (!response?.success) {

            this.showVerificationError(
              response?.message ||
              'Unable to verify your email.'
            );

            return;
          }

          this.status = 'success';

          this.message =
            response.message ||
            'Email verified successfully.';

          this.showPopup = true;

          this.redirectTimer =
            setTimeout(() => {

              this.showPopup = false;

              this.router.navigate(
                ['/user'],
                {
                  queryParams: {
                    accountLogin: 'true',
                    emailVerified: 'true'
                  }
                }
              );

            }, 3000);
        },

        error: error => {

          console.error(
            'Email verification error:',
            error
          );

          this.showVerificationError(
            error?.error?.message ||
            error?.message ||
            'The verification link is invalid or has expired.'
          );
        }
      });
  }


  private showVerificationError(
    message: string
  ): void {

    this.isLoading = false;

    this.status = 'error';

    this.message = message;

    this.showPopup = true;
  }


  goToLogin(): void {

    this.clearRedirectTimer();

    this.showPopup = false;

    this.router.navigate(
      ['/user'],
      {
        queryParams: {
          accountLogin: 'true'
        }
      }
    );
  }


  closePopup(): void {

    this.showPopup = false;
  }


  private clearRedirectTimer(): void {

    if (this.redirectTimer) {

      clearTimeout(
        this.redirectTimer
      );

      this.redirectTimer = undefined;
    }
  }


  ngOnDestroy(): void {

    this.clearRedirectTimer();

    this.destroy$.next();

    this.destroy$.complete();
  }
}