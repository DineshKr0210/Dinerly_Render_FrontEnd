import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  AdminLocationSummary,
  AvailabilityResponse,
  HolidayHour,
  HolidayHourRequest,
  RegularHour
} from 'src/app/models/admin.model';
import { AdminLocationContextService } from 'src/app/services/admin-location-context.service';
import { WaitListAdminService } from 'src/app/services/wait-list-admin.service';

@Component({
  selector: 'app-admin-store',
  templateUrl: './admin-store.component.html',
  styleUrls: ['./admin-store.component.css']
})
export class AdminStoreComponent implements OnInit {
  locations: AdminLocationSummary[] = [];
  selectedRestaurantId: number | null = null;

  regularHours: RegularHour[] = [];
  holidayHours: HolidayHour[] = [];

  loadingLocations = false;
  loadingAvailability = false;
  loadingHolidayHours = false;
  saving = false;

  errorMessage = '';
  successMessage = '';

  showModal = false;
  editingHolidayHour: HolidayHour | null = null;

  showToggleModal = false;
  pendingRegularHour: RegularHour | null = null;
  pendingHolidayHour: HolidayHour | null = null;
  toggleTargetEnabled = false;

  private subscriptions = new Subscription();
    isLocationsLoading = false;
    selectedLocation: AdminLocationSummary | null = null;
    selectedLocationId: number | null = null;

  form: HolidayHourRequest = {
    date: '',
    title: '',
    openTime: '09:00',
    closeTime: '17:00',
    notes: '',
    closed: false
  };

  constructor(
    private availabilityService: WaitListAdminService,private locationContext: AdminLocationContextService
  ) {}

  ngOnInit(): void {
    this.loadLocations();
    this.subscriptions.add(
      this.locationContext.locations$.subscribe(locations => {
        this.locations = locations;
        this.isLocationsLoading = false;
      })
    );

    this.subscriptions.add(
      this.locationContext.isLoadingLocations$.subscribe(isLoading => {
        this.isLocationsLoading = isLoading;
      })
    );

    this.subscriptions.add(
      this.locationContext.selectedLocation$.subscribe(location => {
        if (!location) {
          this.selectedLocation = null;
          this.selectedLocationId = null;
          return;
        }

        const locationChanged =
          this.selectedLocationId !== location.id;

        this.selectedLocation = location;
        this.selectedLocationId = location.id;

        if (locationChanged) {
          this.loadLocations();
        }
      })
    );

    if (!this.locationContext.getCurrentLocations().length) {
      this.locationContext.loadLocations();
    }
  }

  loadLocations(): void {
    this.loadingLocations = true;
    this.clearMessages();

    this.availabilityService
      .getLocations()
      .pipe(
        finalize(() => {
          this.loadingLocations = false;
        })
      )
      .subscribe({
        next: response => {
          if (!response?.success) {
            this.locations = [];
            this.selectedRestaurantId = null;
            this.regularHours = [];
            this.holidayHours = [];

            this.showError(
              response?.message ||
              'Unable to load locations.'
            );

            return;
          }

          this.locations =
            response.data?.locations || [];

          if (!this.locations.length) {
            this.selectedRestaurantId = null;
            this.regularHours = [];
            this.holidayHours = [];

            this.showError(
              'No locations available.'
            );

            return;
          }

          const existingLocation =
            this.locations.find(
              location =>
                location.id ===
                this.selectedRestaurantId
            );

          this.selectedRestaurantId =
            existingLocation?.id ??
            this.locations[0].id;

          this.loadStoreAvailability();
        },
        error: error => {
          console.error(
            'Location API error:',
            error
          );

          this.locations = [];
          this.selectedRestaurantId = null;
          this.regularHours = [];
          this.holidayHours = [];

          this.showError(
            error?.error?.message ||
            'Unable to load locations.'
          );
        }
      });
  }

  loadStoreAvailability(): void {
    if (this.selectedRestaurantId === null) {
      this.regularHours = [];
      this.holidayHours = [];
      return;
    }

    this.regularHours = [];
    this.holidayHours = [];

    this.loadAvailability();
    this.loadHolidayHours();
  }

  loadAvailability(): void {
    if (this.selectedRestaurantId === null) {
      this.regularHours = [];
      return;
    }

    this.loadingAvailability = true;

    this.availabilityService
      .getAvailability(
        this.selectedRestaurantId
      )
      .pipe(
        finalize(() => {
          this.loadingAvailability = false;
        })
      )
      .subscribe({
        next: (response: AvailabilityResponse) => {
          if (response?.success) {
            this.regularHours =
              response.data?.regularHours || [];
          } else {
            this.regularHours = [];

            this.showError(
              response?.message ||
              'Unable to load regular hours.'
            );
          }
        },
        error: error => {
          console.error(
            'Availability API error:',
            error
          );

          this.regularHours = [];

          this.showError(
            error?.error?.message ||
            'Unable to load regular hours.'
          );
        }
      });
  }

  loadHolidayHours(): void {
    if (this.selectedRestaurantId === null) {
      this.holidayHours = [];
      return;
    }

    this.loadingHolidayHours = true;

    this.availabilityService
      .getHolidayHours(
        this.selectedRestaurantId
      )
      .pipe(
        finalize(() => {
          this.loadingHolidayHours = false;
        })
      )
      .subscribe({
        next: response => {
          if (response?.success) {
            this.holidayHours =
              response.data?.holidayHours || [];
          } else {
            this.holidayHours = [];

            this.showError(
              response?.message ||
              'Unable to load holiday hours.'
            );
          }
        },
        error: error => {
          console.error(
            'Holiday hours API error:',
            error
          );

          this.holidayHours = [];

          this.showError(
            error?.error?.message ||
            'Unable to load holiday hours.'
          );
        }
      });
  }

  onLocationChange(): void {
    this.clearMessages();
    this.loadStoreAvailability();
  }

  openToggleModal(
    regularHour: RegularHour
  ): void {
    if (this.selectedRestaurantId === null) {
      this.showError(
        'Please select a location first.'
      );
      return;
    }

    const holidayHour =
      this.holidayHours.find(
        holiday =>
          holiday.date === regularHour.date
      );

    this.pendingRegularHour =
      regularHour;

    this.pendingHolidayHour =
      holidayHour || null;

    this.toggleTargetEnabled =
      !regularHour.enabled;

    this.clearMessages();
    this.showToggleModal = true;
  }

  closeToggleModal(): void {
    if (this.saving) {
      return;
    }

    this.showToggleModal = false;
    this.pendingRegularHour = null;
    this.pendingHolidayHour = null;
  }

  confirmToggle(): void {
    if (
      this.selectedRestaurantId === null ||
      !this.pendingRegularHour
    ) {
      return;
    }

    const regularHour =
      this.pendingRegularHour;

    const holidayHour =
      this.pendingHolidayHour;

    const targetEnabled =
      this.toggleTargetEnabled;

    const request: HolidayHourRequest = {
      date: regularHour.date,
      title:
        holidayHour?.title ||
        regularHour.day,
      openTime: targetEnabled
        ? regularHour.open
        : '',
      closeTime: targetEnabled
        ? regularHour.close
        : '',
      notes:
        holidayHour?.notes || '',
      closed: !targetEnabled
    };

    this.saving = true;
    this.clearMessages();

    const request$ =
      holidayHour
        ? this.availabilityService.updateHolidayHour(
            this.selectedRestaurantId,
            holidayHour.id,
            request
          )
        : this.availabilityService.addHolidayHour(
            this.selectedRestaurantId,
            request
          );

    request$
      .pipe(
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe({
        next: response => {
          if (
            response &&
            response.success === false
          ) {
            this.showError(
              response.message ||
              'Unable to update store availability.'
            );
            return;
          }

          this.showToggleModal = false;
          this.pendingRegularHour = null;
          this.pendingHolidayHour = null;

          this.showSuccess(
            targetEnabled
              ? `${regularHour.day} is now On.`
              : `${regularHour.day} is now Off.`
          );

          this.loadAvailability();
          this.loadHolidayHours();
        },
        error: error => {
          console.error(
            'Toggle availability error:',
            error
          );

          this.showError(
            error?.error?.message ||
            'Unable to update store availability.'
          );
        }
      });
  }

  openAddModal(): void {
    if (this.selectedRestaurantId === null) {
      this.showError(
        'Please select a location first.'
      );
      return;
    }

    this.editingHolidayHour = null;

    this.form = {
      date: '',
      title: '',
      openTime: '09:00',
      closeTime: '17:00',
      notes: '',
      closed: false
    };

    this.clearMessages();
    this.showModal = true;
  }

  openEditModal(
    holidayHour: HolidayHour
  ): void {
    this.editingHolidayHour =
      holidayHour;

    this.form = {
      date: holidayHour.date,
      title: holidayHour.title,
      openTime:
        holidayHour.openTime ||
        '09:00',
      closeTime:
        holidayHour.closeTime ||
        '17:00',
      notes:
        holidayHour.notes || '',
      closed:
        holidayHour.closed
    };

    this.clearMessages();
    this.showModal = true;
  }

  closeModal(): void {
    if (this.saving) {
      return;
    }

    this.showModal = false;
    this.editingHolidayHour = null;
  }

  saveHolidayHour(): void {
    if (this.selectedRestaurantId === null) {
      this.showError(
        'Please select a location first.'
      );
      return;
    }

    if (!this.form.date) {
      this.showError(
        'Please select a date.'
      );
      return;
    }

    if (!this.form.title?.trim()) {
      this.showError(
        'Please enter a title.'
      );
      return;
    }

    if (
      !this.form.closed &&
      this.form.closeTime <= this.form.openTime
    ) {
      this.showError(
        'Close time must be after open time.'
      );
      return;
    }

    this.saving = true;
    this.clearMessages();

    const request: HolidayHourRequest = {
      date: this.form.date,
      title: this.form.title.trim(),
      openTime: this.form.closed
        ? ''
        : this.form.openTime,
      closeTime: this.form.closed
        ? ''
        : this.form.closeTime,
      notes:
        this.form.notes?.trim() || '',
      closed:
        this.form.closed
    };

    const isEditing =
      !!this.editingHolidayHour;

    const request$ =
      isEditing
        ? this.availabilityService.updateHolidayHour(
            this.selectedRestaurantId,
            this.editingHolidayHour!.id,
            request
          )
        : this.availabilityService.addHolidayHour(
            this.selectedRestaurantId,
            request
          );

    request$
      .pipe(
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe({
        next: response => {
          if (
            response &&
            response.success === false
          ) {
            this.showError(
              response.message ||
              'Unable to save holiday hours.'
            );
            return;
          }

          this.showModal = false;
          this.editingHolidayHour = null;

          this.showSuccess(
            isEditing
              ? 'Holiday hours updated.'
              : 'Holiday hours added.'
          );

          this.loadHolidayHours();
          this.loadAvailability();
        },
        error: error => {
          console.error(
            'Save holiday hours error:',
            error
          );

          this.showError(
            error?.error?.message ||
            'Unable to save holiday hours.'
          );
        }
      });
  }

  formatDate(
    date: string
  ): string {
    if (!date) {
      return '-';
    }

    const parsed =
      new Date(date);

    if (
      isNaN(
        parsed.getTime()
      )
    ) {
      return date;
    }

    return parsed.toLocaleDateString(
      'en-US',
      {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }
    );
  }

  formatTime(
    time: string
  ): string {
    if (!time) {
      return '—';
    }

    if (
      time.includes('AM') ||
      time.includes('PM')
    ) {
      return time;
    }

    const parts =
      time.split(':');

    if (parts.length < 2) {
      return time;
    }

    const hour =
      Number(parts[0]);

    const minute =
      parts[1];

    const suffix =
      hour >= 12
        ? 'PM'
        : 'AM';

    const displayHour =
      hour % 12 || 12;

    return `${displayHour}:${minute} ${suffix}`;
  }

  getSelectedLocation():
    AdminLocationSummary | undefined {
    return this.locations.find(
      location =>
        location.id ===
        this.selectedRestaurantId
    );
  }

  getToggleTitle(): string {
    if (!this.pendingRegularHour) {
      return 'Update store availability';
    }

    return this.toggleTargetEnabled
      ? 'Turn store on?'
      : 'Turn store off?';
  }

  getToggleButtonText(): string {
    return this.toggleTargetEnabled
      ? 'Turn On'
      : 'Turn Off';
  }

  showSuccess(
    message: string
  ): void {
    this.successMessage = message;
    this.errorMessage = '';

    setTimeout(() => {
      this.successMessage = '';
    }, 4000);
  }

  showError(
    message: string
  ): void {
    this.errorMessage = message;
    this.successMessage = '';

    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}