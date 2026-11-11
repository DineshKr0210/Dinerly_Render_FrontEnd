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
  Subscription
} from 'rxjs';

import {
  WaitingGuest
} from 'src/app/models/waitlist-api-guest-to-restaurant.model';

import {
  SeatingPreference
} from 'src/app/models/waitlist-restaurant.model';

import {
  WaitlistApiRestaurantService
} from 'src/app/services/waitlist-api-restaurant.service';
import { WaitlistAuthService } from 'src/app/services/waitlist-auth.service';

import {
  WaitlistRestaurantModalService
} from 'src/app/services/waitlist-restaurant-modal.service';


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
  selector: 'app-waitlist-restaurant-modal',
  templateUrl:
    './waitlist-restaurant-modal.component.html',
  styleUrls: [
    './waitlist-restaurant-modal.component.css'
  ]
})
export class WaitlistRestaurantModalComponent
  implements OnInit, OnDestroy {

  restaurantId = 1;

  visible = false;

  form: FormGroup;

  isLoading = false;

  selectedDate = '';

  waitingGuests: WaitingGuest[] = [];

  waitTimeOptions = [
    5,
    10,
    15,
    20,
    25,
    30
  ];

  selectedWaitTime = 5;

  position = 0;

  private sub =
    new Subscription();


  readonly preferences:
    SeatingPreference[] = [
      'No preference',
      'Indoor',
      'Outdoor',
      'Patio preferred',
      'Bar seating OK',
      'Quiet section'
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
      placeholder: '2045550000'
    },
    {
      iso: 'GB',
      name: 'United Kingdom',
      dialCode: '+44',
      flag: '🇬🇧',
      minLength: 10,
      maxLength: 10,
      placeholder: '7123456789'
    },

  ];


  constructor(
    private fb: FormBuilder,

    private waitlistService:
      WaitlistApiRestaurantService,

    public modalService:
      WaitlistRestaurantModalService,
      private auth: WaitlistAuthService
  ) {

    this.form =
      this.fb.group({

        name: [
          '',
          Validators.required
        ],

        phoneCountry: [
          'CA',
          Validators.required
        ],

        phone: [
          '',
          [
            Validators.required,
            Validators.pattern(
              '^[0-9]{10}$'
            )
          ]
        ],

        partySize: [
          2,
          [
            Validators.required,
            Validators.min(1),
            Validators.max(50)
          ]
        ],

        preference: [
          'No preference'
        ],

        notes: ['']
      });
  }


  ngOnInit(): void {

    this.restaurantId =

      this.auth.getRestaurantId();
    this.sub.add(
      this.modalService
        .visible$
        .subscribe(
          visible => {

            console.log(
              'Modal visible:',
              visible
            );

            this.visible =
              visible;
          }
        )
    );

    this.applyPhoneValidation();

    this.loadWaitingGuests();
  }


  get selectedCountry():
    CountryCodeOption {

    const selectedIso =
      this.form
        .get('phoneCountry')
        ?.value;

    return (
      this.countries.find(
        country =>
          country.iso ===
          selectedIso
      ) ||
      this.countries[0]
    );
  }


  onPhoneCountryChange(): void {

    const phoneControl =
      this.form.get('phone');

    if (!phoneControl) {
      return;
    }

    /*
     * Clear the previous phone number because
     * different countries use different lengths.
     */
    phoneControl.setValue('');

    phoneControl.markAsUntouched();

    this.applyPhoneValidation();
  }


  private applyPhoneValidation(): void {

    const country =
      this.selectedCountry;

    const phoneControl =
      this.form.get('phone');

    if (!country || !phoneControl) {
      return;
    }

    phoneControl.setValidators([
      Validators.required,

      Validators.pattern(
        `^[0-9]{${country.minLength},${country.maxLength}}$`
      )
    ]);

    phoneControl.updateValueAndValidity({
      emitEvent: false
    });
  }


  onPhoneInput(
    event: Event
  ): void {

    const input =
      event.target as HTMLInputElement;

    /*
     * Remove spaces, letters, brackets,
     * hyphens and all non-number characters.
     */
    const numbersOnly =
      input.value.replace(
        /\D/g,
        ''
      );

    const limitedNumber =
      numbersOnly.slice(
        0,
        this.selectedCountry.maxLength
      );

    input.value =
      limitedNumber;

    this.form
      .get('phone')
      ?.setValue(
        limitedNumber,
        {
          emitEvent: false
        }
      );
  }


  private buildFullPhoneNumber(
    countryIso: string,
    phoneNumber: unknown
  ): string {

    const country =
      this.countries.find(
        item =>
          item.iso ===
          countryIso
      );

    const dialCode =
      country?.dialCode || '';

    let cleanedPhone =
      String(
        phoneNumber || ''
      )
        .replace(
          /\D/g,
          ''
        );

    /*
     * Remove leading zero before adding
     * the international dial code.
     *
     * Example:
     * +94 and 0771234567
     * becomes +94771234567.
     */
    cleanedPhone =
      cleanedPhone.replace(
        /^0+/,
        ''
      );

    return (
      `${dialCode}${cleanedPhone}`
    );
  }


  loadWaitingGuests(): void {

    this.isLoading = true;

    const selectedStatus =
      'WAITING';

    this.waitlistService
      .getWaitingGuests(
        this.restaurantId,
        selectedStatus,
        this.selectedDate
      )
      .subscribe({

        next: response => {

          this.waitingGuests =
            response.data || [];

          this.position =
            this.waitingGuests.length +
            1;

          this.isLoading =
            false;
        },

        error: () => {

          this.isLoading =
            false;

          this.waitingGuests =
            [];

          alert(
            'Unable to load waiting guests'
          );
        }
      });
  }


  submit(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    if (this.isLoading) {
      return;
    }

    const formValue =
      this.form.getRawValue();

    this.position =
      this.waitingGuests.length +
      1;

    const fullPhoneNumber =
      this.buildFullPhoneNumber(
        formValue.phoneCountry,
        formValue.phone
      );

    const payload = {

      name:
        String(
          formValue.name || ''
        ).trim(),

      phone:
        fullPhoneNumber,

      partySize:
        Number(
          formValue.partySize
        ),

      preference:
        formValue.preference as
        SeatingPreference,

      notes:
        String(
          formValue.notes || ''
        ).trim(),

      position:
        this.position,

      estimatedWaitTime:
        this.selectedWaitTime
    };

    console.log(
      'Add guest payload:',
      payload
    );

    this.isLoading =
      true;

    this.waitlistService
      .addGuestInWaitlist(
        this.restaurantId,
        payload
      )
      .subscribe({

        next: () => {

          this.isLoading =
            false;

          this.reset();

          this.modalService.close();
        },

        error: error => {

          this.isLoading =
            false;

          console.error(
            'Add guest error:',
            error
          );

          alert(
            error?.error?.message ||
            'Unable to add the guest to the waitlist'
          );
        }
      });
  }


  close(): void {

    if (this.isLoading) {
      return;
    }

    this.reset();

    this.modalService.close();
  }


  private reset(): void {

    this.form.reset({

      name: '',

      phoneCountry: 'CA',

      phone: '',

      partySize: 2,

      preference:
        'No preference',

      notes: ''
    });

    this.selectedWaitTime =
      5;

    this.applyPhoneValidation();
  }


  ngOnDestroy(): void {

    this.sub.unsubscribe();
  }
}