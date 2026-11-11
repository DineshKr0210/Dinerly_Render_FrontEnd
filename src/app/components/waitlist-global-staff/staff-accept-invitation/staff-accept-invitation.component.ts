import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import { WaitListAdminService } from 'src/app/services/wait-list-admin.service';

@Component({
  selector: 'app-staff-accept-invitation',
  templateUrl: './staff-accept-invitation.component.html',
  styleUrls: ['./staff-accept-invitation.component.css']
})
export class StaffAcceptInvitationComponent implements OnInit {
  passwordForm!: FormGroup;
  token = '';
  isVerifying = true;
  isSaving = false;
  isVerified = false;
  passwordSet = false;
  errorMessage = '';
  successMessage = '';
  staffName = '';
  staffEmail = '';
  restaurantName = '';
  invitationMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private adminService: WaitListAdminService
  ) {}

  ngOnInit(): void {
    this.createPasswordForm();

    this.token =
      this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.isVerifying = false;
      this.isVerified = false;
      this.errorMessage =
        'Invalid invitation link. Invitation token is missing.';
      return;
    }

    this.verifyInvitation();
  }

  createPasswordForm(): void {
    this.passwordForm = this.fb.group({
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8)
        ]
      ],
      confirmPassword: [
        '',
        Validators.required
      ]
    });
  }

  verifyInvitation(): void {
    this.isVerifying = true;
    this.isVerified = false;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminService
      .verifyStaffInvitation({
        token: this.token
      })
      .subscribe({
        next: response => {
          this.isVerifying = false;

          if (
            response?.success === true &&
            response?.data?.valid === true
          ) {
            this.isVerified = true;

            this.staffName =
              response.data.staffName || '';

            this.staffEmail =
              response.data.staffEmail || '';

            this.restaurantName =
              response.data.restaurantName || '';

            this.invitationMessage =
              response.data.message ||
              response.message ||
              'Invitation token is valid. Please set your password.';

            this.successMessage =
              response.message ||
              'Invitation token verified.';

            return;
          }

          this.isVerified = false;

          this.errorMessage =
            response?.message ||
            response?.data?.message ||
            'This invitation link is invalid or expired.';
        },

        error: error => {
          console.error(
            'Verify staff invitation error:',
            error
          );

          this.isVerifying = false;
          this.isVerified = false;

          this.errorMessage =
            error?.error?.message ||
            'This invitation link is invalid or expired.';
        }
      });
  }

  setPassword(): void {
    if (
      this.passwordForm.invalid ||
      this.isSaving
    ) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const password =
      this.passwordForm.get('password')?.value || '';

    const confirmPassword =
      this.passwordForm.get('confirmPassword')?.value || '';

    if (password !== confirmPassword) {
      this.errorMessage =
        'Passwords do not match.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminService
      .setStaffPassword({
        token: this.token,
        password,
        confirmPassword
      })
      .subscribe({
        next: response => {
          this.isSaving = false;

          const success =
            response?.success === true ||
            response?.statusCode === 200;

          if (success) {
            this.passwordSet = true;
            this.successMessage =
              response?.message ||
              'Password set successfully. Your account is now active.';

            this.passwordForm.reset();

            return;
          }

          this.errorMessage =
            response?.message ||
            'Unable to set password.';
        },

        error: error => {
          console.error(
            'Set staff password error:',
            error
          );

          this.isSaving = false;

          this.errorMessage =
            error?.error?.message ||
            'Unable to set password.';
        }
      });
  }

  isInvalid(controlName: string): boolean {
    const control =
      this.passwordForm.get(controlName);

    return !!(
      control &&
      control.invalid &&
      control.touched
    );
  }

  passwordsDoNotMatch(): boolean {
    const password =
      this.passwordForm.get('password')?.value;

    const confirmPassword =
      this.passwordForm.get('confirmPassword')?.value;

    return !!(
      confirmPassword &&
      password !== confirmPassword
    );
  }

  goToLogin(): void {
    this.router.navigate([
      '/login/restaurant'
    ]);
  }
}