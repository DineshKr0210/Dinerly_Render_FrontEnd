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
  Router
} from '@angular/router';
import {
  Subscription
} from 'rxjs';
import {
  AdminLocationRequest,
  AdminLocationSummary,
  DashboardData,
  DashboardInsight,
  DishRequest,
  OfferRequest
} from 'src/app/models/admin.model';
import {
  WaitListAdminService
} from 'src/app/services/wait-list-admin.service';
import {
  AdminLocationContextService
} from 'src/app/services/admin-location-context.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  dashboardData: DashboardData | null = null;
  locations: AdminLocationSummary[] = [];
  selectedLocation: AdminLocationSummary | null = null;
  insights: DashboardInsight[] = [];
  filteredInsights: DashboardInsight[] = [];
  isLoadingInsights = false;
  private dashboardSubs = new Subscription();
  selectedInsightType = 'All';
  insightTabs = [
    'All',
    'Growth',
    'Operations',
    'Tips',
    'Announcements'
  ];
  isLoading = false;
  isLoadingLocations = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  showLocationModal = false;
  showDishModal = false;
  showOfferModal = false;
  showStaffModal = false;
  isEditMode = false;
  isDetailsLoading = false;
  locationForm!: FormGroup;
  dishForm!: FormGroup;
  offerForm!: FormGroup;
  staffForm!: FormGroup;
  availableTypes: string[] = [
    'VEGETARIAN',
    'VEGAN',
    'NON_VEGETARIAN'
  ];
  categories: any[] = [];
  selectedImage: File | null = null;
  imagePreview = '';

  constructor(
    private fb: FormBuilder,
    private waitListAdminService: WaitListAdminService,
    private locationContext: AdminLocationContextService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.createLocationForm();
    this.createDishForm();
    this.createOfferForm();
    this.createStaffForm();

    this.dashboardSubs.add(
      this.locationContext.locations$
        .subscribe(locations => {
          this.locations = locations || [];
          this.isLoadingLocations = false;
        })
    );

    this.dashboardSubs.add(
      this.locationContext.selectedLocation$
        .subscribe(location => {
          this.selectedLocation = location;

          if (location?.id) {
            this.getDashboardData(location.id);
          } else {
            this.dashboardData = null;
          }
        })
    );

    this.dashboardSubs.add(
      this.locationContext.isLoadingLocations$
        .subscribe(isLoading => {
          this.isLoadingLocations = isLoading;
        })
    );

    this.getInsightsFeed();
  }

  getDashboardData(locationId?: number): void {
    if (!locationId) {
      this.dashboardData = null;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.waitListAdminService
      .getDashBoardData(locationId, 5)
      .subscribe({
        next: response => {
          if (!response?.success) {
            this.dashboardData = null;
            this.errorMessage =
              response?.message ||
              'Unable to load dashboard data.';
            this.isLoading = false;
            return;
          }

          this.dashboardData = response.data;
          this.isLoading = false;
        },
        error: error => {
          console.error(
            'Dashboard API error:',
            error
          );

          this.dashboardData = null;
          this.errorMessage =
            error?.error?.message ||
            'Unable to load dashboard data.';
          this.isLoading = false;
        }
      });
  }

  loadLocations(): void {
    this.locationContext.refreshLocations();
  }

  getInsightsFeed(): void {
    this.isLoadingInsights = true;

    this.waitListAdminService
      .getInsightsFeed()
      .subscribe({
        next: response => {
          this.isLoadingInsights = false;

          if (!response?.success) {
            this.insights = [];
            this.filteredInsights = [];
            return;
          }

          this.insights = response.data || [];
          this.filterInsights();
        },
        error: error => {
          console.error(
            'Insights feed API error:',
            error
          );

          this.isLoadingInsights = false;
          this.insights = [];
          this.filteredInsights = [];
        }
      });
  }

  selectInsightTab(tab: string): void {
    this.selectedInsightType = tab;
    this.filterInsights();
  }

  filterInsights(): void {
    if (this.selectedInsightType === 'All') {
      this.filteredInsights = [...this.insights];
      return;
    }

    const selectedType =
      this.selectedInsightType.toUpperCase();

    this.filteredInsights = this.insights.filter(
      insight =>
        insight.type?.toUpperCase() === selectedType
    );
  }

  getInsightIcon(type: string): string {
    switch (type?.toUpperCase()) {
      case 'GROWTH':
        return 'fa-chart-line';
      case 'OPERATIONS':
        return 'fa-clock';
      case 'TIPS':
        return 'fa-lightbulb';
      case 'ANNOUNCEMENTS':
        return 'fa-bullhorn';
      default:
        return 'fa-circle-exclamation';
    }
  }

  getInsightColorClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'GROWTH':
        return 'purple';
      case 'OPERATIONS':
        return 'orange';
      case 'TIPS':
        return 'blue';
      case 'ANNOUNCEMENTS':
        return 'green';
      default:
        return 'red';
    }
  }

  handleInsightAction(actionUrl: string): void {
    if (!actionUrl) {
      return;
    }

    if (
      actionUrl.startsWith('http://') ||
      actionUrl.startsWith('https://')
    ) {
      window.location.href = actionUrl;
      return;
    }

    let route = actionUrl;

    if (!route.startsWith('/admin')) {
      route = route.startsWith('/')
        ? `/admin${route}`
        : `/admin/${route}`;
    }

    this.router.navigateByUrl(route);
  }

  formatInsightTime(timestamp: number): string {
    if (!timestamp) {
      return '';
    }

    return new Date(timestamp).toLocaleTimeString(
      'en-US',
      {
        hour: 'numeric',
        minute: '2-digit'
      }
    );
  }

  getInsightTagClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'GROWTH':
        return 'purple-text';
      case 'OPERATIONS':
        return 'orange-text';
      case 'TIPS':
        return 'blue-text';
      case 'ANNOUNCEMENTS':
        return 'green-text';
      default:
        return 'red-text';
    }
  }

  ngOnDestroy(): void {
    this.dashboardSubs.unsubscribe();
  }

  onQuickAction(action: string): void {
    this.clearMessages();

    switch (action) {
      case 'Add location':
        this.openAddLocation();
        break;
      case 'Add menu item':
        this.openAddMenuItem();
        break;
      case 'Create offer':
        this.openCreateOffer();
        break;
      case 'Invite staff':
        this.openInviteStaff();
        break;
      case 'Review reports':
        this.reviewReports();
        break;
    }
  }

  openAddLocation(): void {
    this.isEditMode = false;
    this.isDetailsLoading = false;
    this.selectedLocation = null;

    this.createLocationForm();

    this.locationForm.reset({
      name: '',
      phoneNumber: '',
      address: '',
      managerEmail: '',
      menuTemplate: '',
      ownerName: '',
      ownerEmail: '',
      seats: 1,
      locationOpen: true
    });

    this.showLocationModal = true;
  }

  closeLocationModal(): void {
    if (this.isSaving) {
      return;
    }

    this.showLocationModal = false;
    this.isEditMode = false;
    this.isDetailsLoading = false;
    this.selectedLocation = null;
  }

  createLocation(): void {
    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      return;
    }

    const request: AdminLocationRequest =
      this.locationForm.getRawValue();

    this.isSaving = true;
    this.clearMessages();

    this.waitListAdminService
      .createLocation(request)
      .subscribe({
        next: response => {
          this.isSaving = false;

          if (!response.success) {
            this.showError(
              response.message ||
              'Unable to create location.'
            );
            return;
          }

          this.showLocationModal = false;

          this.showSuccess(
            response.message ||
            'Location created successfully.'
          );

          this.loadLocations();

          if (this.selectedLocation?.id) {
            this.getDashboardData(
              this.selectedLocation.id
            );
          }
        },
        error: error => {
          console.error(
            'Create location error:',
            error
          );

          this.isSaving = false;

          this.showError(
            error?.error?.message ||
            'Unable to create location.'
          );
        }
      });
  }

  openAddMenuItem(): void {
    if (!this.locations.length) {
      this.showError(
        'No restaurant locations available.'
      );
      return;
    }

    this.selectedLocation =
      this.selectedLocation ||
      this.locations[0];

    this.createDishForm();

    this.dishForm.reset({
      dishName: '',
      categoryName: '',
      typeNames: [],
      price: 0,
      calories: 0,
      description: ''
    });

    this.selectedImage = null;
    this.imagePreview = '';

    this.loadCategories(
      this.selectedLocation.id
    );

    this.showDishModal = true;
  }

  closeDishModal(): void {
    if (this.isSaving) {
      return;
    }

    this.showDishModal = false;
    this.selectedImage = null;
    this.imagePreview = '';
  }

  loadCategories(locationId: number): void {
    this.waitListAdminService
      .getCategories(locationId)
      .subscribe({
        next: categories => {
          this.categories = categories || [];
        },
        error: error => {
          console.error(
            'Categories API error:',
            error
          );

          this.categories = [];
        }
      });
  }

  onTypeChange(
    type: string,
    event: Event
  ): void {
    const checked =
      (event.target as HTMLInputElement).checked;

    const currentTypes: string[] =
      this.dishForm.get('typeNames')?.value || [];

    if (checked) {
      this.dishForm.patchValue({
        typeNames: [
          ...currentTypes,
          type
        ]
      });
    } else {
      this.dishForm.patchValue({
        typeNames: currentTypes.filter(
          item => item !== type
        )
      });
    }

    this.dishForm
      .get('typeNames')
      ?.markAsTouched();
  }

  onImageSelected(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    if (
      !input.files ||
      !input.files.length
    ) {
      return;
    }

    this.selectedImage = input.files[0];

    const reader = new FileReader();

    reader.onload = () => {
      this.imagePreview =
        reader.result as string;
    };

    reader.readAsDataURL(this.selectedImage);
  }

  createDish(): void {
    if (!this.selectedLocation) {
      this.showError(
        'Please select a restaurant first.'
      );
      return;
    }

    if (this.dishForm.invalid) {
      this.dishForm.markAllAsTouched();
      return;
    }

    const value =
      this.dishForm.getRawValue();

    const typeNames: string[] =
      Array.isArray(value.typeNames)
        ? value.typeNames.filter(
          (type: unknown): type is string =>
            typeof type === 'string' &&
            type.trim().length > 0
        )
        : [];

    if (!typeNames.length) {
      this.showError(
        'Please select at least one dish type.'
      );
      return;
    }

    const request: DishRequest = {
      dishName: value.dishName,
      locationId: this.selectedLocation.id,
      categoryName: value.categoryName,
      typeNames,
      price: Number(value.price),
      calories: Number(value.calories || 0),
      description: value.description,
      image: this.selectedImage
    };

    this.isSaving = true;
    this.clearMessages();

    this.waitListAdminService
      .createDish(request)
      .subscribe({
        next: response => {
          this.isSaving = false;

          if (response.success === false) {
            this.showError(
              response.message ||
              'Unable to create dish.'
            );
            return;
          }

          this.closeDishModal();

          this.showSuccess(
            response.message ||
            'Dish created successfully.'
          );
        },
        error: error => {
          console.error(
            'Create dish error:',
            error
          );

          this.isSaving = false;

          this.showError(
            error?.error?.message ||
            'Unable to create dish.'
          );
        }
      });
  }

  openCreateOffer(): void {
    if (!this.locations.length) {
      this.showError(
        'No restaurant locations available.'
      );
      return;
    }

    this.createOfferForm();

    this.offerForm.reset({
      name: '',
      locationId:
        this.selectedLocation?.id ||
        this.locations[0].id,
      startDate: this.getToday(),
      endDate: this.getToday(),
      status: 'ACTIVE',
      discountValue: 0,
      discountLabel: '',
      description: '',
      photoUrl: '',
      perUserLimit: 1
    });

    this.showOfferModal = true;
  }

  closeOfferModal(): void {
    if (this.isSaving) {
      return;
    }

    this.showOfferModal = false;
  }

  createOffer(): void {
    if (this.offerForm.invalid) {
      this.offerForm.markAllAsTouched();
      return;
    }

    const value =
      this.offerForm.getRawValue();

    if (value.endDate < value.startDate) {
      this.showError(
        'End date cannot be before start date.'
      );
      return;
    }

    const request: OfferRequest = {
      name: String(value.name).trim(),
      locationId: Number(value.locationId),
      startDate: value.startDate,
      endDate: value.endDate,
      status: value.status,
      discountValue: Number(value.discountValue),
      discountLabel:
        String(value.discountLabel).trim(),
      description:
        String(value.description).trim(),
      photoUrl:
        String(value.photoUrl || '').trim(),
      perUserLimit:
        Number(value.perUserLimit)
    };

    this.isSaving = true;
    this.clearMessages();

    this.waitListAdminService
      .createOffer(request)
      .subscribe({
        next: response => {
          this.isSaving = false;

          if (response.success === false) {
            this.showError(
              response.message ||
              'Unable to create offer.'
            );
            return;
          }

          this.closeOfferModal();

          this.showSuccess(
            response.message ||
            'Offer created successfully.'
          );
        },
        error: error => {
          console.error(
            'Create offer error:',
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

  openInviteStaff(): void {
    this.createStaffForm();
    this.showStaffModal = true;
  }

  closeStaffModal(): void {
    if (this.isSaving) {
      return;
    }

    this.showStaffModal = false;
  }

  inviteStaff(): void {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    this.showError(
      'Connect your existing staff invite API in inviteStaff().'
    );
  }

  reviewReports(): void {
    window.location.href = '/admin/reports';
  }

  viewAllLocations(): void {
    window.location.href = '/admin/locations';
  }

  manageLocation(
    location: AdminLocationSummary
  ): void {
    this.isEditMode = true;
    this.isDetailsLoading = true;
    this.selectedLocation = location;
    this.showLocationModal = true;

    this.waitListAdminService
      .getLocationById(location.id)
      .subscribe({
        next: response => {
          this.isDetailsLoading = false;

          if (!response?.success) {
            this.showLocationModal = false;

            this.showError(
              response?.message ||
              'Unable to load location details.'
            );

            return;
          }

          this.selectedLocation = {
            id: response.data.id,
            name: response.data.name,
            address: response.data.address,
            phoneNumber: response.data.phoneNumber,
            status: response.data.status
          };

          this.locationForm.patchValue({
            name: response.data.name || '',
            phoneNumber:
              response.data.phoneNumber || '',
            address:
              response.data.address || '',
            managerEmail:
              response.data.managerEmail || '',
            menuTemplate:
              response.data.menuTemplate || '',
            ownerName:
              response.data.ownerName || '',
            ownerEmail:
              response.data.ownerEmail || '',
            seats:
              response.data.seats || 1,
            locationOpen:
              response.data.locationOpen ?? true
          });
        },
        error: error => {
          console.error(
            'Location details error:',
            error
          );

          this.isDetailsLoading = false;
          this.showLocationModal = false;

          this.showError(
            error?.error?.message ||
            'Unable to load location details.'
          );
        }
      });
  }

  createLocationForm(): void {
    this.locationForm = this.fb.group({
      name: [
        '',
        Validators.required
      ],
      phoneNumber: [
        '',
        Validators.required
      ],
      address: [
        '',
        Validators.required
      ],
      managerEmail: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],
      menuTemplate: [
        '',
        Validators.required
      ],
      ownerName: [
        '',
        Validators.required
      ],
      ownerEmail: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],
      seats: [
        1,
        [
          Validators.required,
          Validators.min(1)
        ]
      ],
      locationOpen: [
        true
      ]
    });
  }

  createDishForm(): void {
    this.dishForm = this.fb.group({
      dishName: [
        '',
        Validators.required
      ],
      categoryName: [
        '',
        Validators.required
      ],
      typeNames: [
        [],
        Validators.required
      ],
      price: [
        0,
        [
          Validators.required,
          Validators.min(0)
        ]
      ],
      calories: [
        0,
        Validators.min(0)
      ],
      description: [
        '',
        Validators.required
      ]
    });
  }

  createOfferForm(): void {
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
        Validators.required
      ],
      description: [
        '',
        Validators.required
      ],
      photoUrl: [
        ''
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

  createStaffForm(): void {
    this.staffForm = this.fb.group({
      name: [
        '',
        Validators.required
      ],
      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],
      locationId: [
        this.locations[0]?.id || null,
        Validators.required
      ]
    });
  }

  isInvalid(
    form: FormGroup,
    controlName: string
  ): boolean {
    const control =
      form.get(controlName);

    return !!(
      control &&
      control.invalid &&
      control.touched
    );
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US')
      .format(value);
  }

  getToday(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(
      today.getMonth() + 1
    ).padStart(2, '0');
    const day = String(
      today.getDate()
    ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  getLocationName(
    locationId: number
  ): string {
    const location =
      this.locations.find(
        item => item.id === locationId
      );

    return (
      location?.name ||
      'Unknown location'
    );
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';

    setTimeout(() => {
      this.successMessage = '';
    }, 3500);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';

    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  updateLocation(): void {
    if (!this.selectedLocation) {
      return;
    }

    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      return;
    }

    const locationId =
      this.selectedLocation.id;

    const request: AdminLocationRequest =
      this.locationForm.getRawValue();

    this.isSaving = true;
    this.clearMessages();

    this.waitListAdminService
      .updateLocation(
        locationId,
        request
      )
      .subscribe({
        next: response => {
          this.isSaving = false;

          if (!response?.success) {
            this.showError(
              response?.message ||
              'Unable to update location.'
            );
            return;
          }

          this.showLocationModal = false;
          this.isEditMode = false;

          this.showSuccess(
            response.message ||
            'Location updated successfully.'
          );

          this.loadLocations();

          this.getDashboardData(locationId);
        },
        error: error => {
          console.error(
            'Update location error:',
            error
          );

          this.isSaving = false;

          this.showError(
            error?.error?.message ||
            'Unable to update location.'
          );
        }
      });
  }
}