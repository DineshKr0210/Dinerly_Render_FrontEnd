import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

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

interface CountryCodeOption {
  iso: string;
  name: string;
  dialCode: string;
  flag: string;
  minLength: number;
  maxLength: number;
  placeholder: string;
}

@Component({
  selector: 'app-waitlist-modal',
  templateUrl: './waitlist-modal.component.html',
  styleUrls: ['./waitlist-modal.component.css']
})
export class WaitlistModalComponent
  implements OnInit, OnChanges, OnDestroy {

  @Input()
  type: 'join' | 'status' = 'join';

  @Input()
  restaurants: Restaurant[] = [];

  @Input()
  initialRestaurantId: number | null = null;

  @Input()
  lockRestaurantSelection = false;

  @Output()
  closeModal = new EventEmitter<void>();

  @Output()
  joinedWaitlist = new EventEmitter<any>();

  selectedRestaurantId = 0;
  restaurantId = 0;

  selectedRestaurant: Restaurant | null = null;

  selectedTags: string[] = [];

  showPartyPicker = false;
  tempPartySize = 1;

  partySize: number[] = [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8
  ];

  countries: CountryCodeOption[] = [
    {
      iso: 'IN',
      name: 'India',
      dialCode: '+91',
      flag: '🇮🇳',
      minLength: 10,
      maxLength: 10,
      placeholder: '9876543210'
    },
    {
      iso: 'US',
      name: 'United States',
      dialCode: '+1',
      flag: '🇺🇸',
      minLength: 10,
      maxLength: 10,
      placeholder: '2025550123'
    },
    {
      iso: 'CA',
      name: 'Canada',
      dialCode: '+1',
      flag: '🇨🇦',
      minLength: 10,
      maxLength: 10,
      placeholder: '4165550123'
    },
    {
      iso: 'GB',
      name: 'United Kingdom',
      dialCode: '+44',
      flag: '🇬🇧',
      minLength: 10,
      maxLength: 10,
      placeholder: '7123456789'
    }
  ];

  isSubmitting = false;
  isRestaurantLoading = false;

  partiesWaiting = 0;
  waitMinutes = 0;

  showWaitConfirmPopup = false;

  waitPopupType:
    | 'WAIT_CONFIRMATION'
    | 'ONLINE_JOIN_DISABLED'
    = 'WAIT_CONFIRMATION';

  isWaitStatusLoading = false;

  waitStatusLoaded = false;

  pendingSubmit = false;

  preference = [
    {
      label: 'No Preference',
      value: 'NO_PREFERENCE'
    },
    {
      label: 'Indoor',
      value: 'INDOOR'
    },
    {
      label: 'Outdoor',
      value: 'OUTDOOR'
    }
  ];

  notes = [
    {
      label: 'Birthday 🎂',
      value: 'BIRTHDAY'
    },
    {
      label: 'Anniversary',
      value: 'ANNIVERSARY'
    },
    {
      label: 'High chair needed',
      value: 'HIGH_CHAIR'
    },
    {
      label: 'Wheelchair access',
      value: 'WHEELCHAIR_ACCESS'
    }
  ];

  waitlistForm: FormGroup;
  statusForm: FormGroup;

  guestStatusData: any;

  private readonly destroy$ =
    new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private waitlistApi: WaitlistApiRestaurantService
  ) {
    this.waitlistForm = this.fb.group({
      restaurantId: [
        null,
        Validators.required
      ],

      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2)
        ]
      ],

      phoneCountry: [
        'CA',
        Validators.required
      ],

      phone: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]{10}$')
        ]
      ],

      partySize: [
        1,
        Validators.required
      ],

      preference: [
        'INDOOR',
        Validators.required
      ],

      notes: [''],

      /*
       * Marketing SMS consent.
       *
       * Default is false.
       * User can enable/disable this
       * using the toggle in the UI.
       */
      marketingSmsConsent: [false]
    });

    this.statusForm = this.fb.group({
      restaurantId: [
        null,
        Validators.required
      ],

      phoneCountry: [
        'CA',
        Validators.required
      ],

      phoneNumber: [
        '',
        [
          Validators.required,
          Validators.pattern(
            '^\\+?[0-9]{10,15}$'
          )
        ]
      ]
    });
  }

  ngOnInit(): void {
    this.subscribeToRestaurantChanges();

    this.setInitialRestaurant();
  }

  ngOnChanges(
    changes: SimpleChanges
  ): void {
    if (
      changes['restaurants'] ||
      changes['initialRestaurantId']
    ) {
      this.setInitialRestaurant();
    }
  }

  private subscribeToRestaurantChanges(): void {
    this.waitlistForm
      .get('restaurantId')
      ?.valueChanges
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(
        restaurantId => {
          this.onRestaurantChange(
            restaurantId
          );
        }
      );

    this.statusForm
      .get('restaurantId')
      ?.valueChanges
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe(
        restaurantId => {
          this.onStatusRestaurantChange(
            restaurantId
          );
        }
      );
  }

  private setInitialRestaurant(): void {
    if (
      !this.restaurants ||
      this.restaurants.length === 0
    ) {
      this.selectedRestaurant = null;
      this.selectedRestaurantId = 0;
      this.restaurantId = 0;

      this.waitStatusLoaded = false;

      return;
    }

    let restaurant:
      Restaurant | undefined;

    if (this.initialRestaurantId) {
      restaurant =
        this.restaurants.find(
          item =>
            Number(item.id) ===
            Number(this.initialRestaurantId)
        );
    }

    if (!restaurant) {
      const currentRestaurantId =
        Number(
          this.waitlistForm
            .get('restaurantId')
            ?.value
        );

      if (currentRestaurantId) {
        restaurant =
          this.restaurants.find(
            item =>
              Number(item.id) ===
              currentRestaurantId
          );
      }
    }

    if (!restaurant) {
      if (this.type === 'join') {
        restaurant =
          this.restaurants.find(
            item =>
              this.canRestaurantAcceptOnlineJoin(
                item
              )
          );
      }

      restaurant =
        restaurant ||
        this.restaurants[0];
    }

    const restaurantId =
      Number(restaurant.id);

    this.selectedRestaurant =
      restaurant;

    this.selectedRestaurantId =
      restaurantId;

    this.restaurantId =
      restaurantId;

    this.waitlistForm.patchValue(
      {
        restaurantId
      },
      {
        emitEvent: true
      }
    );

    this.statusForm.patchValue(
      {
        restaurantId
      },
      {
        emitEvent: false
      }
    );
  }

  get selectedJoinCountry(): CountryCodeOption {
    const selectedIso =
      this.waitlistForm
        .get('phoneCountry')
        ?.value;

    return (
      this.countries.find(
        country =>
          country.iso === selectedIso
      ) ||
      this.countries[0]
    );
  }

  get selectedStatusCountry(): CountryCodeOption {
    const selectedIso =
      this.statusForm
        .get('phoneCountry')
        ?.value;

    return (
      this.countries.find(
        country =>
          country.iso === selectedIso
      ) ||
      this.countries[0]
    );
  }

  onPhoneCountryChange(
    formType: 'join' | 'status'
  ): void {
    const form =
      formType === 'join'
        ? this.waitlistForm
        : this.statusForm;

    const phoneControlName =
      formType === 'join'
        ? 'phone'
        : 'phoneNumber';

    const countryIso =
      form.get('phoneCountry')?.value;

    const country =
      this.countries.find(
        item =>
          item.iso === countryIso
      );

    const phoneControl =
      form.get(phoneControlName);

    if (!country || !phoneControl) {
      return;
    }

    phoneControl.setValidators([
      Validators.required,
      Validators.pattern(
        `^[0-9]{${country.minLength},${country.maxLength}}$`
      )
    ]);

    phoneControl.setValue('');

    phoneControl.updateValueAndValidity();
  }

  onPhoneInput(
    event: Event,
    formType: 'join' | 'status'
  ): void {
    const input =
      event.target as HTMLInputElement;

    const form =
      formType === 'join'
        ? this.waitlistForm
        : this.statusForm;

    const controlName =
      formType === 'join'
        ? 'phone'
        : 'phoneNumber';

    const country =
      formType === 'join'
        ? this.selectedJoinCountry
        : this.selectedStatusCountry;

    const numbersOnly =
      input.value.replace(/\D/g, '');

    const limitedValue =
      numbersOnly.slice(
        0,
        country.maxLength
      );

    input.value = limitedValue;

    form.get(controlName)?.setValue(
      limitedValue,
      {
        emitEvent: false
      }
    );
  }

  private buildFullPhoneNumber(
    countryIso: string,
    phoneNumber: unknown
  ): string {
    const selectedCountry =
      this.countries.find(
        country =>
          country.iso === countryIso
      );

    const dialCode =
      selectedCountry?.dialCode || '';

    let cleanedPhone =
      String(phoneNumber || '')
        .replace(/\D/g, '');

    cleanedPhone =
      cleanedPhone.replace(/^0+/, '');

    return `${dialCode}${cleanedPhone}`;
  }

  onRestaurantChange(
    restaurantId:
      number | string | null
  ): void {
    const selectedId =
      Number(restaurantId);

    if (
      !selectedId ||
      Number.isNaN(selectedId)
    ) {
      this.selectedRestaurant = null;
      this.selectedRestaurantId = 0;
      this.restaurantId = 0;

      return;
    }

    this.selectedRestaurantId =
      selectedId;

    this.restaurantId =
      selectedId;

    this.selectedRestaurant =
      this.restaurants.find(
        restaurant =>
          Number(restaurant.id) ===
          selectedId
      ) ?? null;

    if (
      Number(
        this.statusForm
          .get('restaurantId')
          ?.value
      ) !== selectedId
    ) {
      this.statusForm.patchValue(
        {
          restaurantId: selectedId
        },
        {
          emitEvent: false
        }
      );
    }

    this.pendingSubmit = false;
    this.showWaitConfirmPopup = false;

    this.waitPopupType =
      'WAIT_CONFIRMATION';

    if (
      !this.canSelectedRestaurantAcceptOnlineJoin
    ) {
      this.partiesWaiting = 0;
      this.waitMinutes = 0;
      this.waitStatusLoaded = true;
      this.isWaitStatusLoading = false;

      return;
    }

    this.getWaitlistDashboardStatus();
  }

  onStatusRestaurantChange(
    restaurantId:
      number | string | null
  ): void {
    const selectedId =
      Number(restaurantId);

    if (
      !selectedId ||
      Number.isNaN(selectedId)
    ) {
      return;
    }

    this.selectedRestaurantId =
      selectedId;

    this.restaurantId =
      selectedId;

    this.selectedRestaurant =
      this.restaurants.find(
        restaurant =>
          Number(restaurant.id) ===
          selectedId
      ) ?? null;

    if (
      Number(
        this.waitlistForm
          .get('restaurantId')
          ?.value
      ) !== selectedId
    ) {
      this.waitlistForm.patchValue(
        {
          restaurantId: selectedId
        },
        {
          emitEvent: false
        }
      );
    }

    this.getWaitlistDashboardStatus();
  }

  getWaitlistDashboardStatus(): void {
    if (!this.restaurantId) {
      this.partiesWaiting = 0;
      this.waitMinutes = 0;
      this.waitStatusLoaded = false;

      return;
    }

    this.isWaitStatusLoading = true;
    this.waitStatusLoaded = false;

    this.waitlistApi
      .getwaitlistdashBoardStatus(
        this.restaurantId
      )
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          this.isWaitStatusLoading = false;
          this.waitStatusLoaded = true;

          const data =
            response?.data ??
            response;

          this.partiesWaiting =
            Number(
              data?.totalWaiting ??
              data?.partiesWaiting ??
              0
            );

          this.waitMinutes =
            Number(
              data?.averageWaitTime ??
              data?.estimatedWaitTime ??
              data?.waitMinutes ??
              0
            );

          if (
            Number.isNaN(
              this.partiesWaiting
            )
          ) {
            this.partiesWaiting = 0;
          }

          if (
            Number.isNaN(
              this.waitMinutes
            )
          ) {
            this.waitMinutes = 0;
          }

          console.log(
            'Waitlist dashboard response:',
            response
          );

          console.log(
            'Waitlist dashboard values:',
            {
              partiesWaiting:
                this.partiesWaiting,

              waitMinutes:
                this.waitMinutes
            }
          );
        },

        error: error => {
          this.isWaitStatusLoading = false;
          this.waitStatusLoaded = true;

          this.partiesWaiting = 0;
          this.waitMinutes = 0;

          console.error(
            'Waitlist dashboard status error:',
            error
          );
        }
      });
  }

  confirmWaitAndJoin(): void {
    if (
      this.waitPopupType ===
      'ONLINE_JOIN_DISABLED'
    ) {
      this.closeUnavailableRestaurantPopup();

      return;
    }

    this.showWaitConfirmPopup = false;

    this.pendingSubmit = true;

    this.submitJoinWaitlist();
  }

  cancelWaitConfirm(): void {
    this.showWaitConfirmPopup = false;
    this.pendingSubmit = false;

    this.waitPopupType =
      'WAIT_CONFIRMATION';
  }

  closeUnavailableRestaurantPopup(): void {
    this.showWaitConfirmPopup = false;
    this.pendingSubmit = false;

    this.waitPopupType =
      'WAIT_CONFIRMATION';
  }

  selectPartySize(
    size: number
  ): void {
    this.waitlistForm.patchValue({
      partySize: size
    });
  }

  toggleTag(
    tag: string
  ): void {
    const selectedNotes = [
      ...this.selectedTags
    ];

    const index =
      selectedNotes.indexOf(tag);

    if (index > -1) {
      selectedNotes.splice(
        index,
        1
      );
    } else {
      selectedNotes.push(tag);
    }

    this.selectedTags =
      selectedNotes;

    this.waitlistForm.patchValue({
      notes:
        selectedNotes.join(', ')
    });
  }

  isSelectedTag(
    tag: string
  ): boolean {
    return this.selectedTags.includes(
      tag
    );
  }

  openPartyPicker(): void {
    this.tempPartySize =
      Number(
        this.waitlistForm
          .get('partySize')
          ?.value || 1
      );

    this.showPartyPicker = true;
  }

  closePartyPicker(): void {
    this.showPartyPicker = false;
  }

  confirmPartyPicker(): void {
    this.waitlistForm.patchValue({
      partySize:
        this.tempPartySize
    });

    this.showPartyPicker = false;
  }

  submitJoinWaitlist(): void {
    if (this.waitlistForm.invalid) {
      this.waitlistForm
        .markAllAsTouched();

      return;
    }

    if (this.isSubmitting) {
      return;
    }

    const formValue =
      this.waitlistForm
        .getRawValue();

    const restaurantId =
      Number(
        formValue.restaurantId
      );

    const selectedRestaurant =
      this.restaurants.find(
        restaurant =>
          Number(restaurant.id) ===
          restaurantId
      ) ?? this.selectedRestaurant;

    this.selectedRestaurant =
      selectedRestaurant ?? null;

    this.selectedRestaurantId =
      restaurantId;

    this.restaurantId =
      restaurantId;

    /*
     * Restaurant online joining validation.
     */
    if (
      !this.canRestaurantAcceptOnlineJoin(
        selectedRestaurant
      )
    ) {
      this.waitPopupType =
        'ONLINE_JOIN_DISABLED';

      this.showWaitConfirmPopup =
        true;

      this.pendingSubmit =
        false;

      return;
    }

    /*
     * Prevent submission while dashboard
     * status is loading.
     */
    if (this.isWaitStatusLoading) {
      return;
    }

    /*
     * Show wait confirmation when there
     * are customers already waiting.
     */
    if (
      this.partiesWaiting > 0 &&
      !this.pendingSubmit
    ) {
      this.waitPopupType =
        'WAIT_CONFIRMATION';

      this.showWaitConfirmPopup =
        true;

      return;
    }

    this.isSubmitting = true;

    /*
     * Build the API payload.
     */
    const payload = {
      restaurantId,

      name:
        String(
          formValue.name || ''
        ).trim(),

      phone:
        this.buildFullPhoneNumber(
          formValue.phoneCountry,
          formValue.phone
        ),

      partySize:
        Number(
          formValue.partySize
        ),

      preference:
        formValue.preference,

      notes:
        this.buildNotesValue(
          formValue.notes
        ),

      /*
       * New API field.
       *
       * Always send a real boolean.
       */
      marketingSmsConsent:
        Boolean(
          formValue.marketingSmsConsent
        )
    };

    console.log(
      'Join waitlist payload:',
      payload
    );

    this.waitlistApi
      .joinWaitlist(payload)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          this.isSubmitting = false;
          this.pendingSubmit = false;

          const responseData =
            response?.data ??
            response;

          const isSuccessful =
            response?.success !== false &&
            responseData;

          if (isSuccessful) {
            localStorage.setItem(
              'waitlistGuest',
              JSON.stringify(
                responseData
              )
            );

            localStorage.setItem(
              'waitlistRestaurantId',
              String(
                restaurantId
              )
            );

            this.joinedWaitlist.emit(
              responseData
            );

            this.closeModal.emit();
          } else {
            alert(
              response?.message ||
              'Unable to join waitlist'
            );
          }
        },

        error: error => {
          this.isSubmitting = false;
          this.pendingSubmit = false;

          console.error(
            'Join waitlist error:',
            error
          );

          alert(
            error?.error?.message ||
            'Unable to join waitlist. Please try again.'
          );
        }
      });
  }

  private buildNotesValue(
    typedNotes: unknown
  ): string {
    const manualNotes =
      String(
        typedNotes || ''
      ).trim();

    const tagNotes =
      this.selectedTags.join(', ');

    if (
      manualNotes &&
      tagNotes
    ) {
      return `${tagNotes}, ${manualNotes}`;
    }

    return (
      manualNotes ||
      tagNotes ||
      ''
    );
  }

  checkStatus(): void {
    if (this.statusForm.invalid) {
      this.statusForm
        .markAllAsTouched();

      return;
    }

    if (this.isSubmitting) {
      return;
    }

    const formValue =
      this.statusForm
        .getRawValue();

    const restaurantId =
      Number(
        formValue.restaurantId
      );

    if (!restaurantId) {
      alert(
        'Please select a restaurant.'
      );

      return;
    }

    const phone =
      this.buildFullPhoneNumber(
        formValue.phoneCountry,
        formValue.phoneNumber
      );

    const payload = {
      restaurantId,
      phone
    };

    this.isSubmitting = true;

    this.waitlistApi
      .getWaitlistStatus(payload)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          this.isSubmitting = false;

          if (
            response?.success &&
            response?.data
          ) {
            localStorage.setItem(
              'waitlistGuest',
              JSON.stringify(
                response.data
              )
            );

            localStorage.setItem(
              'waitlistRestaurantId',
              String(
                restaurantId
              )
            );

            this.joinedWaitlist.emit(
              response.data
            );

            this.closeModal.emit();
          } else {
            alert(
              response?.message ||
              'No waitlist record found'
            );
          }
        },

        error: error => {
          this.isSubmitting = false;

          console.error(
            'Check waitlist status error:',
            error
          );

          alert(
            error?.error?.message ||
            'Unable to check waitlist status. Please try again.'
          );
        }
      });
  }

  get canSelectedRestaurantAcceptOnlineJoin(): boolean {
    if (!this.selectedRestaurant) {
      return false;
    }

    return (
      this.selectedRestaurant
        .acceptOnlineJoin !== false
    );
  }

  get waitPopupTitle(): string {
    if (
      this.waitPopupType ===
      'ONLINE_JOIN_DISABLED'
    ) {
      return 'Online waitlist unavailable';
    }

    return 'Estimated Wait Time';
  }

  get isOnlineJoinDisabledPopup(): boolean {
    return (
      this.waitPopupType ===
      'ONLINE_JOIN_DISABLED'
    );
  }

  canRestaurantAcceptOnlineJoin(
    restaurant:
      Restaurant | null | undefined
  ): boolean {
    return Boolean(
      restaurant &&
      restaurant.acceptOnlineJoin !== false
    );
  }

  getRestaurantOptionText(
    restaurant: Restaurant
  ): string {
    const availability =
      this.canRestaurantAcceptOnlineJoin(
        restaurant
      )
        ? ''
        : ' — Online join unavailable';

    return (
      `${restaurant.name} — ` +
      `${restaurant.address}` +
      availability
    );
  }

  close(): void {
    if (this.isSubmitting) {
      return;
    }

    this.showPartyPicker = false;
    this.showWaitConfirmPopup = false;
    this.pendingSubmit = false;

    this.closeModal.emit();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}