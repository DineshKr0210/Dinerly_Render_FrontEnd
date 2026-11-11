import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  Subject,
  takeUntil
} from 'rxjs';

import {
  Restaurant
} from 'src/app/models/waitlist-api-guest-to-restaurant.model';

import {
  WaitlistApiRestaurantService
} from 'src/app/services/waitlist-api-restaurant.service';

import {
  WaitlistAuthService
} from 'src/app/services/waitlist-auth.service';

import {
  ThemeService
} from 'src/app/services/theme.service';

export type UserRole =
  'restaurant' | 'admin';

@Component({
  selector: 'app-waitlist-login',
  templateUrl: './waitlist-login.component.html',
  styleUrls: [
    './waitlist-login.component.css'
  ]
})
export class WaitlistLoginComponent
  implements OnInit, OnDestroy {

  selectedRole: UserRole =
    'restaurant';

  loginForm: FormGroup;

  isLoading = false;
  showPassword = false;
  errorMessage = '';

  isDarkMode = false;

  /*
   * true  = restaurant login is currently shown
   * false = admin login is currently shown
   */
  isAdminLogin = true;

  showModal = false;

  modalType:
    'join' | 'status' = 'join';

  restaurants: Restaurant[] = [];

  isRestaurantLoaded = false;

  /*
   * Restaurant ID received from:
   *
   * /join/1
   */
  scannedRestaurantId:
    number | null = null;

  /*
   * Indicates that the page was opened
   * through the QR-code route.
   */
  isQrJoinRoute = false;

  private readonly destroy$ =
    new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private auth: WaitlistAuthService,
    private waitlistApi:
      WaitlistApiRestaurantService,
    private themeService: ThemeService
  ) {
    this.loginForm =
      this.fb.group({
        email: [
          '',
          [
            Validators.required,
            Validators.email
          ]
        ],

        password: [
          '',
          Validators.required
        ]
      });
  }

  ngOnInit(): void {
    this.loadSavedTheme();

    /*
     * Read either:
     *
     * /login/restaurant
     * /login/admin
     * /join/:restaurantId
     */
    this.subscribeToRouteChanges();

    /*
     * Load restaurants. After loading,
     * the QR modal will open automatically.
     */
    this.loadRestaurants();
  }

  private subscribeToRouteChanges(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(params => {
        const restaurantIdParam =
          params.get('restaurantId');

        const roleParam =
          params.get('role');

        /*
         * QR route:
         *
         * /join/1
         */
        if (restaurantIdParam !== null) {
          this.handleQrJoinRoute(
            restaurantIdParam
          );

          return;
        }

        /*
         * Normal login route:
         *
         * /login
         * /login/restaurant
         * /login/admin
         */
        this.handleNormalLoginRoute(
          roleParam
        );
      });
  }

  private handleQrJoinRoute(
    restaurantIdParam: string
  ): void {
    const restaurantId =
      Number(restaurantIdParam);

    if (
      !Number.isInteger(restaurantId) ||
      restaurantId <= 0
    ) {
      this.isQrJoinRoute = false;
      this.scannedRestaurantId = null;

      this.router.navigate(
        ['/login/restaurant'],
        {
          replaceUrl: true
        }
      );

      return;
    }

    this.isQrJoinRoute = true;

    this.scannedRestaurantId =
      restaurantId;

    this.modalType = 'join';

    /*
     * When restaurants were already loaded,
     * immediately open the QR modal.
     */
    if (this.isRestaurantLoaded) {
      this.openJoinModalFromQr();
    }
  }

  private handleNormalLoginRoute(
    roleParam: string | null
  ): void {
    this.isQrJoinRoute = false;
    this.scannedRestaurantId = null;
    this.showModal = false;

    /*
     * /login redirects only to
     * /login/restaurant.
     *
     * It will not affect /join/:restaurantId
     * because QR handling returns before here.
     */
    if (!roleParam) {
      this.router.navigate(
        ['/login/restaurant'],
        {
          replaceUrl: true
        }
      );

      return;
    }

    this.selectedRole =
      roleParam === 'admin'
        ? 'admin'
        : 'restaurant';

    /*
     * Your existing HTML uses:
     *
     * !isAdminLogin -> Admin Email
     * isAdminLogin  -> Restaurant Email
     */
    this.isAdminLogin =
      this.selectedRole ===
      'restaurant';

    this.loginForm.reset();
    this.errorMessage = '';
  }

  private loadSavedTheme(): void {
    this.isDarkMode =
      this.themeService.isDark;
  }

  toggleTheme(): void {
    this.themeService.toggle();

    this.isDarkMode =
      this.themeService.isDark;
  }

  togglePassword(): void {
    this.showPassword =
      !this.showPassword;
  }

  loadRestaurants(): void {
    this.isRestaurantLoaded = false;

    this.waitlistApi
      .getRestaurantDetails()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: any) => {
          if (
            res?.success &&
            Array.isArray(res?.data)
          ) {
            this.restaurants =
              res.data;
          } else if (
            Array.isArray(res)
          ) {
            this.restaurants =
              res;
          } else {
            this.restaurants = [];
          }

          this.isRestaurantLoaded =
            true;

          /*
           * Open the modal only when this
           * page came from /join/:restaurantId.
           */
          if (this.isQrJoinRoute) {
            this.openJoinModalFromQr();
          }
        },

        error: (error) => {
          this.isRestaurantLoaded =
            false;

          this.restaurants = [];

          console.error(
            'Unable to load restaurants:',
            error
          );

          if (this.isQrJoinRoute) {
            alert(
              'Unable to load the restaurant from this QR code.'
            );
          }
        }
      });
  }

  private openJoinModalFromQr(): void {
    if (
      !this.isQrJoinRoute ||
      !this.scannedRestaurantId
    ) {
      return;
    }

    if (
      !this.isRestaurantLoaded
    ) {
      return;
    }

    const restaurantExists =
      this.restaurants.some(
        restaurant =>
          Number(restaurant.id) ===
          Number(
            this.scannedRestaurantId
          )
      );

    if (!restaurantExists) {
      this.showModal = false;

      alert(
        'The restaurant from this QR code was not found.'
      );

      return;
    }

    this.modalType = 'join';
    this.showModal = true;
  }

  openModal(
    type: 'join' | 'status'
  ): void {
    this.modalType = type;

    /*
     * For a normal manual modal opening,
     * allow restaurant selection.
     */
    if (!this.isQrJoinRoute) {
      this.scannedRestaurantId =
        null;
    }

    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;

    /*
     * When the QR modal is closed,
     * return to the normal restaurant
     * login URL.
     */
    if (this.isQrJoinRoute) {
      this.router.navigate(
        ['/login/restaurant'],
        {
          replaceUrl: true
        }
      );
    }
  }

  onJoinedWaitlist(
    guest: any
  ): void {
    localStorage.setItem(
      'waitlistGuest',
      JSON.stringify(guest)
    );

    if (
      this.scannedRestaurantId
    ) {
      localStorage.setItem(
        'waitlistRestaurantId',
        String(
          this.scannedRestaurantId
        )
      );
    }

    this.showModal = false;

    this.router.navigate(
      ['/user']
    );
  }

  goToLogin(): void {
    /*
     * Current restaurant login:
     * navigate to admin login.
     */
    if (this.selectedRole === 'restaurant') {
      this.router.navigate(
        ['/login/admin']
      );

      return;
    }

    /*
     * Current admin login:
     * navigate to restaurant login.
     */
    this.router.navigate(
      ['/login/restaurant']
    );
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      this.loginForm
        .markAllAsTouched();

      return;
    }

    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    const {
      email,
      password
    } = this.loginForm.getRawValue();

    const loginRequest =
      this.selectedRole === 'admin'
        ? this.auth.loginAdmin(
          email,
          password
        )
        : this.auth.loginRestaurant(
          email,
          password
        );

    loginRequest.pipe(
      takeUntil(this.destroy$)
    )
      .subscribe({
        next: (user) => {
          this.isLoading = false;

          if (
            this.selectedRole ===
            'admin'
          ) {
            this.router.navigate(
              ['/admin']
            );
          } else if (
            this.auth.isServerUser(user)
          ) {
            this.router.navigate(
              ['/server']
            );
          } else {
            this.router.navigate(
              ['/restaurant/waitlist']
            );
          }
        },

        error: (error) => {
          this.isLoading = false;

          if (
            error.status === 401 ||
            error.status === 403
          ) {
            this.errorMessage =
              'Invalid email or password';
          } else {
            this.errorMessage =
              'Unable to login. Please try again.';
          }
        }
      });
  }

  get emailError(): string {
    const control =
      this.loginForm.get('email');

    if (
      control?.touched &&
      control?.errors
    ) {
      if (
        control.errors['required']
      ) {
        return 'Email is required';
      }

      if (
        control.errors['email']
      ) {
        return 'Enter a valid email address';
      }
    }

    return '';
  }

  get passwordError(): string {
    const control =
      this.loginForm.get(
        'password'
      );

    if (
      control?.touched &&
      control?.errors?.['required']
    ) {
      return 'Password is required';
    }

    return '';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}