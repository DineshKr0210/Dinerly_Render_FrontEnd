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
  AdminLocationSummary,
  Offer,
  OfferRequest,
  OfferStatus
} from 'src/app/models/admin.model';

import {
  WaitListAdminService
} from 'src/app/services/wait-list-admin.service';

import {
  AdminLocationContextService
} from 'src/app/services/admin-location-context.service';

@Component({
  selector: 'app-admin-offers',
  templateUrl: './admin-offers.component.html',
  styleUrls: ['./admin-offers.component.css']
})
export class AdminOffersComponent
  implements OnInit, OnDestroy {

  locations: AdminLocationSummary[] = [];

  offers: Offer[] = [];

  categories: string[] = [];

  selectedCategory = '';

  selectedLocationId: number | null = null;

  currentPage = 0;

  pageSize = 20;

  totalPages = 0;

  totalElements = 0;

  isLoadingLocations = false;

  isLoadingCategories = false;

  isLoadingOffers = false;

  isSaving = false;

  isDeleting = false;

  showOfferModal = false;

  showDeleteModal = false;

  isEditMode = false;

  selectedOffer: Offer | null = null;
  offerToDelete: Offer | null = null;

  offerForm!: FormGroup;

  successMessage = '';

  errorMessage = '';

  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private offersService: WaitListAdminService,
    private locationContext: AdminLocationContextService
  ) { }

  ngOnInit(): void {
    this.createForm();

    this.subscribeToLocationContext();

    this.loadCategories();
  }

  private subscribeToLocationContext(): void {
    this.subscriptions.add(
      this.locationContext.locations$.subscribe(
        locations => {
          this.locations = locations || [];
        }
      )
    );

    this.subscriptions.add(
      this.locationContext.isLoadingLocations$.subscribe(
        loading => {
          this.isLoadingLocations = loading;
        }
      )
    );

    this.subscriptions.add(
      this.locationContext.selectedLocation$.subscribe(
        location => {
          const newLocationId =
            location?.id ?? null;

          const locationChanged =
            this.selectedLocationId !==
            newLocationId;

          this.selectedLocationId =
            newLocationId;

          if (!locationChanged) {
            return;
          }

          this.currentPage = 0;

          if (this.offerForm) {
            this.offerForm.patchValue({
              locationId:
                this.selectedLocationId
            });
          }

          this.loadCategories();
        }
      )
    );

    if (
      !this.locationContext.getCurrentLocations().length
    ) {
      this.locationContext.loadLocations();
    }
  }

  createForm(): void {
    this.offerForm = this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.maxLength(150)
        ]
      ],

      locationId: [
        null,
        Validators.required
      ],

      startDate: [
        '',
        Validators.required
      ],

      endDate: [
        '',
        Validators.required
      ],

      status: [
        'ACTIVE',
        Validators.required
      ],

      discountValue: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],

      discountLabel: [
        '',
        [
          Validators.required,
          Validators.maxLength(100)
        ]
      ],

      description: [
        '',
        [
          Validators.required,
          Validators.maxLength(500)
        ]
      ],

      photoUrl: [
        '',
        Validators.maxLength(1000)
      ],

      perUserLimit: [
        1,
        [
          Validators.required,
          Validators.min(1)
        ]
      ]
    });
  }

  loadCategories(): void {
    if (
      this.selectedLocationId === null
    ) {
      this.categories = [];
      this.selectedCategory = '';
      this.offers = [];
      return;
    }

    this.isLoadingCategories = true;

    this.clearMessages();

    this.offersService
      .getOfferCategories(
        this.selectedLocationId
      )
      .subscribe({
        next: response => {
          this.isLoadingCategories = false;

          if (!response?.success) {
            this.categories = [];
            this.selectedCategory = '';
            this.offers = [];

            this.showError(
              response?.message ||
              'Unable to load offer categories.'
            );

            return;
          }

          this.categories =
            response.data || [];

          if (!this.categories.length) {
            this.selectedCategory = '';
            this.offers = [];
            this.totalPages = 0;
            this.totalElements = 0;
            return;
          }

          const existingCategory =
            this.categories.find(
              category =>
                category ===
                this.selectedCategory
            );

          this.selectedCategory =
            existingCategory ||
            this.categories[0];

          this.currentPage = 0;

          this.loadOffersByCategory();
        },

        error: error => {
          console.error(
            'Unable to load offer categories:',
            error
          );

          this.isLoadingCategories = false;

          this.categories = [];

          this.selectedCategory = '';

          this.offers = [];

          this.showError(
            error?.error?.message ||
            'Unable to load offer categories.'
          );
        }
      });
  }

  selectCategory(
    category: string
  ): void {
    if (
      this.selectedCategory === category
    ) {
      return;
    }

    this.selectedCategory = category;

    this.currentPage = 0;

    this.loadOffersByCategory();
  }

  loadOffersByCategory(): void {
    if (
      this.selectedLocationId === null ||
      !this.selectedCategory
    ) {
      this.offers = [];
      this.totalPages = 0;
      this.totalElements = 0;
      return;
    }

    this.isLoadingOffers = true;

    this.clearMessages();

    this.offersService
      .getOffersByCategory(
        this.selectedCategory,
        this.selectedLocationId,
        this.currentPage,
        this.pageSize
      )
      .subscribe({
        next: response => {
          this.isLoadingOffers = false;

          if (!response?.success) {
            this.offers = [];
            this.totalPages = 0;
            this.totalElements = 0;

            this.showError(
              response?.message ||
              'Unable to load offers.'
            );

            return;
          }

          this.offers =
            response.data?.content || [];

          this.totalPages =
            response.data?.totalPages || 0;

          this.totalElements =
            response.data?.totalElements || 0;
        },

        error: error => {
          console.error(
            'Unable to load offers:',
            error
          );

          this.offers = [];

          this.totalPages = 0;

          this.totalElements = 0;

          this.isLoadingOffers = false;

          this.showError(
            error?.error?.message ||
            'Unable to load offers.'
          );
        }
      });
  }

  selectLocation(
    location: AdminLocationSummary
  ): void {
    this.locationContext.selectLocation(
      location
    );
  }

  openAddOffer(): void {
    if (
      !this.locations.length
    ) {
      this.showError(
        'No locations available.'
      );

      return;
    }

    if (
      this.selectedLocationId === null
    ) {
      this.showError(
        'Please select a location.'
      );

      return;
    }

    this.isEditMode = false;

    this.selectedOffer = null;

    this.offerForm.reset({
      name: '',

      locationId:
        this.selectedLocationId,

      startDate:
        this.getToday(),

      endDate:
        this.getToday(),

      status:
        'ACTIVE',

      discountValue:
        0,

      discountLabel:
        '',

      description:
        '',

      photoUrl:
        '',

      perUserLimit:
        1
    });

    this.showOfferModal = true;

    this.clearMessages();
  }

  openEditOffer(
    offer: Offer
  ): void {
    this.isEditMode = true;

    this.selectedOffer = offer;

    this.offerForm.patchValue({
      name:
        offer.name,

      locationId:
        offer.locationId,

      startDate:
        offer.startDate,

      endDate:
        offer.endDate,

      status:
        this.normalizeStatus(
          offer.status
        ),

      discountValue:
        offer.discountValue ?? 0,

      discountLabel:
        offer.discountLabel || '',

      description:
        offer.description || '',

      photoUrl:
        offer.photoUrl || '',

      perUserLimit:
        offer.perUserLimit ?? 1
    });

    this.showOfferModal = true;

    this.clearMessages();
  }

  closeOfferModal(): void {
    if (this.isSaving) {
      return;
    }

    this.showOfferModal = false;

    this.isEditMode = false;

    this.selectedOffer = null;
  }

  saveOffer(): void {
    if (
      this.offerForm.invalid
    ) {
      this.offerForm.markAllAsTouched();
      return;
    }

    const formValue =
      this.offerForm.getRawValue();

    const locationId =
      Number(
        formValue.locationId
      );

    if (!locationId) {
      this.showError(
        'Please select a location.'
      );

      return;
    }

    const startDate =
      formValue.startDate;

    const endDate =
      formValue.endDate;

    if (
      endDate < startDate
    ) {
      this.showError(
        'End date cannot be before start date.'
      );

      return;
    }

    const request: OfferRequest = {
      name:
        String(
          formValue.name
        ).trim(),

      locationId,

      startDate,

      endDate,

      status:
        this.normalizeStatus(
          formValue.status
        ),

      discountValue:
        Number(
          formValue.discountValue
        ),

      discountLabel:
        String(
          formValue.discountLabel
        ).trim(),

      description:
        String(
          formValue.description
        ).trim(),

      photoUrl:
        String(
          formValue.photoUrl || ''
        ).trim(),

      perUserLimit:
        Number(
          formValue.perUserLimit
        )
    };

    this.isSaving = true;

    this.clearMessages();

    if (
      this.isEditMode &&
      this.selectedOffer
    ) {
      this.offersService
        .updateOffer(
          this.selectedOffer.id,
          request
        )
        .subscribe({
          next: response => {
            this.isSaving = false;

            this.closeOfferModal();

            this.showSuccess(
              response?.message ||
              'Offer updated successfully.'
            );

            this.loadOffersByCategory();
          },

          error: error => {
            console.error(
              'Update offer failed:',
              error
            );

            this.isSaving = false;

            this.showError(
              error?.error?.message ||
              'Unable to update offer.'
            );
          }
        });

      return;
    }

    this.offersService
      .createOffer(request)
      .subscribe({
        next: response => {
          this.isSaving = false;

          this.closeOfferModal();

          this.showSuccess(
            response?.message ||
            'Offer created successfully.'
          );

          this.currentPage = 0;

          this.loadOffersByCategory();
        },

        error: error => {
          console.error(
            'Create offer failed:',
            error
          );

          this.isSaving = false;

          this.showError(
            error?.error?.message ||
            'Unable to create offer.'
          );
        }
      });
  }

  deleteOffer(
    offer: Offer
  ): void {
    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${offer.name}"?`
      );

    if (!confirmed) {
      return;
    }

    this.isDeleting = true;

    this.offersService
      .deleteOffer(
        offer.id
      )
      .subscribe({
        next: () => {
          this.isDeleting = false;

          this.showSuccess(
            'Offer deleted successfully.'
          );

          if (
            this.offers.length === 1 &&
            this.currentPage > 0
          ) {
            this.currentPage--;
          }

          this.loadOffersByCategory();
        },

        error: error => {
          console.error(
            'Delete offer failed:',
            error
          );

          this.isDeleting = false;

          this.showError(
            error?.error?.message ||
            'Unable to delete offer.'
          );
        }
      });
  }

  nextPage(): void {
    if (
      this.currentPage <
      this.totalPages - 1
    ) {
      this.currentPage++;

      this.loadOffersByCategory();
    }
  }

  previousPage(): void {
    if (
      this.currentPage > 0
    ) {
      this.currentPage--;

      this.loadOffersByCategory();
    }
  }

  getLocationName(
    locationId: number
  ): string {
    const location =
      this.locations.find(
        item =>
          item.id === locationId
      );

    return (
      location?.name ||
      'Unknown location'
    );
  }

  getLocationInitials(
    offer: Offer
  ): string {
    const locationName =
      offer.locationName ||
      this.getLocationName(
        offer.locationId
      );

    if (
      !locationName ||
      locationName ===
      'Unknown location'
    ) {
      return 'OF';
    }

    const words =
      locationName
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (words.length === 1) {
      return words[0]
        .substring(0, 2)
        .toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[1].charAt(0)
    ).toUpperCase();
  }

  getCardClass(
    index: number
  ): string {
    const classes = [
      'purple-one',
      'purple-two',
      'purple-three',
      'purple-four'
    ];

    return classes[
      index % classes.length
    ];
  }

  getOfferMeta(
    offer: Offer
  ): string {
    const location =
      offer.locationName ||
      this.getLocationName(
        offer.locationId
      );

    const endDate =
      offer.endDate
        ? this.formatOfferDate(
          offer.endDate
        )
        : '';

    if (location && endDate) {
      return `${location} · Ends ${endDate}`;
    }

    if (location) {
      return location;
    }

    if (endDate) {
      return `Ends ${endDate}`;
    }

    return '';
  }

  formatOfferDate(
    date: string
  ): string {
    if (!date) {
      return '';
    }

    const parsedDate =
      new Date(
        `${date}T00:00:00`
      );

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric'
      }
    );
  }

  getStatusLabel(
    status: string
  ): string {
    return String(
      status || ''
    )
      .toLowerCase()
      .replace(
        /^./,
        letter =>
          letter.toUpperCase()
      );
  }

  isOfferActive(
    offer: Offer
  ): boolean {
    return (
      this.normalizeStatus(
        offer.status
      ) === 'ACTIVE'
    );
  }

  private normalizeStatus(
    status: string
  ): OfferStatus {
    const normalized =
      String(
        status || ''
      )
        .trim()
        .toUpperCase();

    if (
      normalized ===
      'INACTIVE'
    ) {
      return 'INACTIVE';
    }

    if (
      normalized ===
      'SCHEDULED'
    ) {
      return 'SCHEDULED';
    }

    if (
      normalized ===
      'EXPIRED'
    ) {
      return 'EXPIRED';
    }

    return 'ACTIVE';
  }

  private getToday(): string {
    const today =
      new Date();

    const year =
      today.getFullYear();

    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        today.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  isInvalid(
    controlName: string
  ): boolean {
    const control =
      this.offerForm.get(
        controlName
      );

    return !!(
      control &&
      control.invalid &&
      control.touched
    );
  }

  showSuccess(
    message: string
  ): void {
    this.successMessage =
      message;

    this.errorMessage = '';

    setTimeout(() => {
      this.successMessage = '';
    }, 3500);
  }

  showError(
    message: string
  ): void {
    this.errorMessage =
      message;

    this.successMessage = '';

    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  onLocationChange(locationId: number): void {
    const location = this.locations.find(
      item => item.id === Number(locationId)
    );

    if (!location) {
      return;
    }

    this.locationContext.selectLocation(location);
  }

  openDeleteModal(offer: Offer): void {
  this.offerToDelete = offer;
  this.showDeleteModal = true;
  this.clearMessages();
}

closeDeleteModal(): void {
  if (this.isDeleting) {
    return;
  }

  this.showDeleteModal = false;
  this.offerToDelete = null;
}

confirmDeleteOffer(): void {
  if (!this.offerToDelete) {
    return;
  }

  const offerId = this.offerToDelete.id;

  this.isDeleting = true;

  this.offersService
    .deleteOffer(offerId)
    .subscribe({
      next: response => {
        this.isDeleting = false;

        this.showDeleteModal = false;
        this.offerToDelete = null;

        this.showSuccess(
          response?.message ||
          'Offer deleted successfully.'
        );

        if (
          this.offers.length === 1 &&
          this.currentPage > 0
        ) {
          this.currentPage--;
        }

        this.loadOffersByCategory();
      },

      error: error => {
        console.error(
          'Delete offer failed:',
          error
        );

        this.isDeleting = false;

        this.showError(
          error?.error?.message ||
          'Unable to delete offer.'
        );
      }
    });
}

  clearMessages(): void {
    this.successMessage = '';

    this.errorMessage = '';
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}