import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import {
  AdminLocationSummary,
  Customer,
  CustomersResponse,
  SummaryCustomerResponse
} from 'src/app/models/admin.model';
import { AdminLocationContextService } from 'src/app/services/admin-location-context.service';
import { WaitListAdminService } from 'src/app/services/wait-list-admin.service';

@Component({
  selector: 'app-admin-customers',
  templateUrl: './admin-customers.component.html',
  styleUrls: ['./admin-customers.component.css']
})
export class AdminCustomersComponent implements OnInit {
  locations: AdminLocationSummary[] = [];
  selectedLocationId: number | null = null;
  selectedLocation: AdminLocationSummary | null = null;
  customersummary: SummaryCustomerResponse | null = null;

  customers: Customer[] = [];

  totalElements = 0;
  totalPages = 0;
  currentPage = 0;
  pageSize = 20;

  loadingLocations = false;
  loadingCustomers = false;

  errorMessage = '';

  private destroy$ = new Subject<void>();
  isLoadingLocations = false;

  constructor(
    private adminService: WaitListAdminService, private locationContext: AdminLocationContextService
  ) { }

  ngOnInit(): void {

    this.locationContext.locations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(locations => {
        this.locations = locations || [];
        this.isLoadingLocations = false;

        const currentLocation =
          this.locationContext.getCurrentLocation();

        if (currentLocation) {
          this.selectedLocation = currentLocation;
          this.selectedLocationId = currentLocation.id;
        }
      });

    this.locationContext.selectedLocation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(location => {
        const previousLocationId =
          this.selectedLocation?.id ?? null;

        const newLocationId =
          location?.id ?? null;

        this.selectedLocation = location;
        this.selectedLocationId = newLocationId;

        if (
          newLocationId !== null &&
          newLocationId !== previousLocationId
        ) {
          this.currentPage = 0;
          this.getcustomerSummary(newLocationId)
          this.loadCustomers();
        }

        if (!location) {
          this.customers = [];
          this.totalPages = 0;
          this.totalElements = 0;
        }
      });

    this.locationContext.isLoadingLocations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoading => {
        this.isLoadingLocations = isLoading;
      });

  }

  
  getcustomerSummary(locationId: number): void {
    this.loadingCustomers = true;

    this.adminService
      .getsummaryCustomer(locationId)
      .pipe(
        finalize(() => {
          this.loadingCustomers = false;
        })
      )
      .subscribe({
        next: (response: SummaryCustomerResponse) => {
          this.customersummary = response;
        },

        error: error => {
          console.error(
            'Customer Summary API error:',
            error
          );

          this.customersummary = null;
        }
      });
  }

  loadCustomers(): void {
    if (this.selectedLocationId === null) {
      this.customers = [];
      return;
    }

    this.loadingCustomers = true;
    this.errorMessage = '';

    this.adminService
      .getCustomers(
        this.selectedLocationId,
        this.currentPage,
        this.pageSize
      )
      .pipe(
        finalize(() => {
          this.loadingCustomers = false;
        })
      )
      .subscribe({
        next: (response: CustomersResponse) => {
          this.customers =
            response.content || [];

          this.totalElements =
            response.totalElements || 0;

          this.totalPages =
            response.totalPages || 0;
        },

        error: error => {
          console.error(
            'Customers API error:',
            error
          );

          this.customers = [];
          this.totalElements = 0;
          this.totalPages = 0;

          this.errorMessage =
            error?.error?.message ||
            'Unable to load customers.';
        }
      });
  }

  onLocationChange(): void {
    this.currentPage = 0;
    this.loadCustomers();
  }

  previousPage(): void {
    if (this.currentPage <= 0) {
      return;
    }

    this.currentPage--;
    this.loadCustomers();
  }

  nextPage(): void {
    if (
      this.currentPage >=
      this.totalPages - 1
    ) {
      return;
    }

    this.currentPage++;
    this.loadCustomers();
  }

  formatDate(date: string): string {
    if (!date) {
      return '-';
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }
    );
  }

  getLocationName(): string {
    const location =
      this.locations.find(
        item =>
          item.id ===
          this.selectedLocationId
      );

    return location?.name || '';
  }
}