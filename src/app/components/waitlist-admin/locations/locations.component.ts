import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  AdminLocation,
  AdminLocationSummary,
  AdminLocationRequest
} from 'src/app/models/admin.model';
import { WaitListAdminService } from 'src/app/services/wait-list-admin.service';
import { AdminLocationContextService } from 'src/app/services/admin-location-context.service';

@Component({
  selector: 'app-locations',
  templateUrl: './locations.component.html',
  styleUrls: ['./locations.component.css']
})
export class LocationsComponent implements OnInit, OnDestroy {
  locations: AdminLocationSummary[] = [];
  selectedLocation: AdminLocation | null = null;
  isLoading = false;
  isDetailsLoading = false;
  isSaving = false;
  showLocationModal = false;
  isEditMode = false;
  locationForm!: FormGroup;
  successMessage = '';
  errorMessage = '';
  private subscriptions = new Subscription();

  constructor(
    private fb: FormBuilder,
    private locationService: WaitListAdminService,
    private locationContext: AdminLocationContextService
  ) {}

  ngOnInit(): void {
    this.createForm();

    this.subscriptions.add(
      this.locationContext.locations$.subscribe(locations => {
        this.locations = locations;
      })
    );

    this.subscriptions.add(
      this.locationContext.isLoadingLocations$.subscribe(isLoading => {
        this.isLoading = isLoading;
      })
    );

    this.locationContext.loadLocations();
  }

  createForm(): void {
    this.locationForm = this.fb.group({
      name: ['', [
        Validators.required,
        Validators.maxLength(100)
      ]],
      address: ['', [
        Validators.required,
        Validators.maxLength(250)
      ]],
      phoneNumber: ['', Validators.required],
      managerEmail: ['', [
        Validators.required,
        Validators.email
      ]],
      ownerName: ['', Validators.required],
      ownerEmail: ['', [
        Validators.required,
        Validators.email
      ]],
      menuTemplate: ['Menu Template', Validators.required],
      seats: [1, [
        Validators.required,
        Validators.min(1)
      ]],
      locationOpen: [true]
    });
  }

  loadLocations(selectedLocationId?: number): void {
    this.locationContext.refreshLocations(selectedLocationId);
  }

  openAddLocation(): void {
    this.isEditMode = false;
    this.selectedLocation = null;
    this.locationForm.reset({
      name: '',
      address: '',
      phoneNumber: '',
      managerEmail: '',
      ownerName: '',
      ownerEmail: '',
      menuTemplate: '',
      seats: 1,
      locationOpen: true
    });
    this.clearMessages();
    this.showLocationModal = true;
  }

  viewLocation(location: AdminLocationSummary): void {
    this.clearMessages();
    this.isEditMode = true;
    this.showLocationModal = true;
    this.isDetailsLoading = true;

    this.locationContext.selectLocation(location);

    this.selectedLocation = {
      id: location.id,
      name: location.name,
      address: location.address,
      phoneNumber: location.phoneNumber,
      managerEmail: '',
      ownerName: '',
      ownerEmail: '',
      menuTemplate: '',
      seats: 1,
      locationOpen: true,
      status: location.status
    };

    this.locationForm.reset({
      name: location.name,
      address: location.address,
      phoneNumber: location.phoneNumber,
      managerEmail: '',
      ownerName: '',
      ownerEmail: '',
      menuTemplate: '',
      seats: 1,
      locationOpen: true
    });

    this.locationService.getLocationById(location.id).subscribe({
      next: response => {
        this.isDetailsLoading = false;

        if (response?.success && response.data) {
          this.selectedLocation = response.data;

          this.locationForm.patchValue({
            name: response.data.name || '',
            address: response.data.address || '',
            phoneNumber: response.data.phoneNumber || '',
            managerEmail: response.data.managerEmail || '',
            ownerName: response.data.ownerName || '',
            ownerEmail: response.data.ownerEmail || '',
            menuTemplate: response.data.menuTemplate || '',
            seats: response.data.seats || 1,
            locationOpen: response.data.locationOpen ?? true
          });
        } else {
          this.showErrorMessage(
            response?.message || 'Unable to load location details.'
          );
        }
      },
      error: error => {
        console.error('Get location details error:', error);
        this.isDetailsLoading = false;
        this.showErrorMessage(
          error?.error?.message || 'Unable to load location details.'
        );
      }
    });
  }

  createLocation(): void {
    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      return;
    }

    const request: AdminLocationRequest = this.locationForm.getRawValue();

    this.isSaving = true;
    this.clearMessages();

    this.locationService.createLocation(request).subscribe({
      next: response => {
        this.isSaving = false;

        if (!response?.success) {
          this.showErrorMessage(
            response?.message || 'Unable to create location.'
          );
          return;
        }

        const newLocationId = response.data?.id;

        this.showLocationModal = false;

        this.showSuccessMessage(
          response.message || 'Location created successfully.'
        );

        this.locationContext.refreshLocations(newLocationId);
      },
      error: error => {
        console.error('Create location error:', error);
        this.isSaving = false;
        this.showErrorMessage(
          error?.error?.message || 'Unable to create location.'
        );
      }
    });
  }

  updateLocation(): void {
    if (!this.selectedLocation) {
      return;
    }

    if (this.locationForm.invalid) {
      this.locationForm.markAllAsTouched();
      return;
    }

    const locationId = this.selectedLocation.id;
    const request: AdminLocationRequest = this.locationForm.getRawValue();

    this.isSaving = true;
    this.clearMessages();

    this.locationService.updateLocation(
      locationId,
      request
    ).subscribe({
      next: response => {
        this.isSaving = false;

        if (!response?.success) {
          this.showErrorMessage(
            response?.message || 'Unable to update location.'
          );
          return;
        }

        this.selectedLocation = response.data;
        this.showLocationModal = false;
        this.showSuccessMessage(
          response.message || 'Location updated successfully.'
        );

        this.locationContext.refreshLocations(locationId);
      },
      error: error => {
        console.error('Update location error:', error);
        this.isSaving = false;
        this.showErrorMessage(
          error?.error?.message || 'Unable to update location.'
        );
      }
    });
  }

  closeLocationModal(): void {
    if (this.isSaving) {
      return;
    }

    this.showLocationModal = false;
    this.isDetailsLoading = false;
    this.selectedLocation = null;
    this.isEditMode = false;
    this.locationForm.reset();
  }

  viewPerformance(): void {
    if (!this.selectedLocation) {
      return;
    }

    console.log(
      'View performance for location:',
      this.selectedLocation.id
    );

    window.location.href = '/admin/performance';
  }

  getInitials(name: string): string {
    if (!name) {
      return '';
    }

    const words = name.trim().split(/\s+/);

    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }

    return (
      words[0].charAt(0) +
      words[1].charAt(0)
    ).toUpperCase();
  }

  showSuccessMessage(message: string): void {
    this.successMessage = message;

    setTimeout(() => {
      this.successMessage = '';
    }, 4000);
  }

  showErrorMessage(message: string): void {
    this.errorMessage = message;

    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  isInvalid(controlName: string): boolean {
    const control = this.locationForm.get(controlName);

    return !!(
      control &&
      control.invalid &&
      control.touched
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}