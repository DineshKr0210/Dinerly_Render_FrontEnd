import {
  Component,
  EventEmitter,
  Output
} from '@angular/core';

import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';

import {
  Router
} from '@angular/router';

import {
  finalize
} from 'rxjs/operators';



import {
  WaitlistAuthService
} from 'src/app/services/waitlist-auth.service';

import {
  AuthUser,
  RegisterRequest
} from 'src/app/models/waitlist-auth.model';
import { GuestAccount } from 'src/app/models/guest-portal.model';


type AccountMode =
  | 'login'
  | 'register';


@Component({
  selector: 'app-guest-account-login',

  templateUrl:
    './guest-account-login.component.html',

  styleUrls: [
    './guest-account-login.component.css'
  ]
})
export class GuestAccountLoginComponent {

  @Output()
  loginSuccess =
    new EventEmitter<GuestAccount>();

  @Output()
  cancel =
    new EventEmitter<void>();


  mode: AccountMode = 'login';

  isSubmitting = false;

  showPassword = false;

  showConfirmPassword = false;

  errorMessage = '';

  successMessage = '';

  registrationCompleted = false;

registrationEmail = '';


  /* =====================================================
     LOGIN FORM
  ====================================================== */

  loginForm: FormGroup<{
    email: FormControl<string>;
    password: FormControl<string>;
  }>;


  /* =====================================================
     REGISTER FORM
  ====================================================== */

  registerForm: FormGroup<{
    name: FormControl<string>;
    email: FormControl<string>;
    phone: FormControl<string>;
    password: FormControl<string>;
    confirmPassword: FormControl<string>;
  }>;


  constructor(
    private fb: FormBuilder,
    private authService: WaitlistAuthService,
    private router: Router
  ) {

    this.loginForm =
      this.fb.nonNullable.group({

        email: [
          '',
          [
            Validators.required,
            Validators.email
          ]
        ],

        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6)
          ]
        ]
      });


    this.registerForm =
      this.fb.nonNullable.group({

        name: [
          '',
          [
            Validators.required,
            Validators.minLength(2)
          ]
        ],

        email: [
          '',
          [
            Validators.required,
            Validators.email
          ]
        ],

        phone: [
          '',
          [
            Validators.required,

            Validators.pattern(
              /^\+?[0-9]{10,15}$/
            )
          ]
        ],

        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6)
          ]
        ],

        confirmPassword: [
          '',
          [
            Validators.required
          ]
        ]
      });
  }


  /* =====================================================
     LOGIN FORM GETTERS
  ====================================================== */

  get emailControl():
    FormControl<string> {

    return this.loginForm.controls.email;
  }


  get passwordControl():
    FormControl<string> {

    return this.loginForm.controls.password;
  }


  /* =====================================================
     REGISTER FORM GETTERS
  ====================================================== */

  get registerNameControl():
    FormControl<string> {

    return this.registerForm.controls.name;
  }


  get registerEmailControl():
    FormControl<string> {

    return this.registerForm.controls.email;
  }


  get registerPhoneControl():
    FormControl<string> {

    return this.registerForm.controls.phone;
  }


  get registerPasswordControl():
    FormControl<string> {

    return this.registerForm.controls.password;
  }


  get confirmPasswordControl():
    FormControl<string> {

    return this.registerForm
      .controls.confirmPassword;
  }


  /* =====================================================
     SWITCH TO LOGIN
  ====================================================== */

  showLogin(): void {

    if (this.isSubmitting) {
      return;
    }

    this.mode = 'login';

    this.errorMessage = '';

    this.successMessage = '';

    this.showPassword = false;

    this.showConfirmPassword = false;

    this.registerForm.reset();
  }


  /* =====================================================
     SWITCH TO REGISTER
  ====================================================== */

 showRegister(): void {

  if (this.isSubmitting) {
    return;
  }

  this.mode = 'register';

  this.registrationCompleted = false;

  this.registrationEmail = '';

  this.errorMessage = '';

  this.successMessage = '';

  this.showPassword = false;

  this.showConfirmPassword = false;

  this.loginForm.reset();

  this.registerForm.reset();
}


  /* =====================================================
     LOGIN
  ====================================================== */

  submitLogin(): void {

    this.errorMessage = '';

    this.successMessage = '';

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;
    }

    if (this.isSubmitting) {
      return;
    }

    const formValue =
      this.loginForm.getRawValue();

    const email =
      formValue.email
        .trim()
        .toLowerCase();

    const password =
      formValue.password;

    this.isSubmitting = true;

    this.authService
  .loginGuest(
    email,
    password
  )
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe({
        next: user => {

          this.handleAuthenticationSuccess(
            user
          );
        },

        error: error => {

          console.error(
            'Guest login error:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Invalid email or password.';
        }
      });
  }


  /* =====================================================
     REGISTER
  ====================================================== */

  submitRegister(): void {

  this.errorMessage = '';
  this.successMessage = '';

  if (this.registerForm.invalid) {
    this.registerForm.markAllAsTouched();
    return;
  }

  if (this.isSubmitting) {
    return;
  }

  const formValue =
    this.registerForm.getRawValue();

  if (
    formValue.password !==
    formValue.confirmPassword
  ) {
    this.confirmPasswordControl.setErrors({
      passwordMismatch: true
    });

    this.confirmPasswordControl.markAsTouched();

    return;
  }

  const payload: RegisterRequest = {
    name: formValue.name.trim(),

    email: formValue.email
      .trim()
      .toLowerCase(),

    phone: formValue.phone.trim(),

    password: formValue.password
  };

  this.isSubmitting = true;

  this.authService
    .register(payload)
    .pipe(
      finalize(() => {
        this.isSubmitting = false;
      })
    )
    .subscribe({
      next: response => {

        console.log(
          'Guest registration response:',
          response
        );

        this.registrationEmail =
          payload.email;

        this.successMessage =
          response?.message ||
          'Registration successful. Please verify your email.';
          this.registrationCompleted = true;

        this.registerForm.reset();

        this.showPassword = false;
        this.showConfirmPassword = false;
      },

      error: error => {

        console.error(
          'Guest registration error:',
          error
        );

        this.errorMessage =
          error?.error?.message ||
          error?.message ||
          'Unable to create your account.';
      }
    });
}


  /* =====================================================
     AUTHENTICATION SUCCESS
  ====================================================== */

  private handleAuthenticationSuccess(
    user: AuthUser
  ): void {

    const account: GuestAccount = {

      id: user.id,

      name:
        user.name ||
        'Guest',

      email:
        user.email,

      phone:
        user.phone,

      token:
  this.authService.getGuestToken() || ''
    };

    this.loginSuccess.emit(account);

    if (
      this.authService.isGuestUser(user)
    ) {

      this.router.navigate(['/user']);

      return;
    }

    /*
     * If this component is only for guest login,
     * navigate every successful account to /user.
     */
    this.router.navigate(['/user']);
  }


  /* =====================================================
     CLOSE
  ====================================================== */

  close(): void {

    if (this.isSubmitting) {
      return;
    }

    this.cancel.emit();
  }
}