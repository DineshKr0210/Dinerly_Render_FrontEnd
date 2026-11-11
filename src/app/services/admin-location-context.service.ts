import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AdminLocationSummary } from 'src/app/models/admin.model';
import { WaitListAdminService } from './wait-list-admin.service';

@Injectable({
  providedIn: 'root'
})
export class AdminLocationContextService {
  private locationsSubject = new BehaviorSubject<AdminLocationSummary[]>([]);
  private selectedLocationSubject = new BehaviorSubject<AdminLocationSummary | null>(null);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  locations$ = this.locationsSubject.asObservable();
  selectedLocation$ = this.selectedLocationSubject.asObservable();
  isLoadingLocations$ = this.loadingSubject.asObservable();

  constructor(private waitListAdminService: WaitListAdminService) {}

  loadLocations(selectedLocationId?: number): void {
    this.loadingSubject.next(true);
    this.waitListAdminService.getLocations().subscribe({
      next: response => {
        this.loadingSubject.next(false);
        if (!response?.success) {
          this.locationsSubject.next([]);
          this.selectedLocationSubject.next(null);
          return;
        }

        const locations = response.data?.locations || [];
        this.locationsSubject.next(locations);

        const currentSelected = this.selectedLocationSubject.value;

        let selectedLocation: AdminLocationSummary | null = null;

        if (selectedLocationId) {
          selectedLocation = locations.find(
            location => location.id === selectedLocationId
          ) || null;
        }

        if (!selectedLocation && currentSelected) {
          selectedLocation = locations.find(
            location => location.id === currentSelected.id
          ) || null;
        }

        this.selectedLocationSubject.next(
          selectedLocation || locations[0] || null
        );
      },
      error: error => {
        console.error('Locations API error:', error);
        this.loadingSubject.next(false);
        this.locationsSubject.next([]);
        this.selectedLocationSubject.next(null);
      }
    });
  }

  refreshLocations(selectedLocationId?: number): void {
    this.loadLocations(selectedLocationId);
  }

  selectLocation(location: AdminLocationSummary): void {
    this.selectedLocationSubject.next(location);
  }

  selectLocationById(locationId: number): void {
    const location = this.locationsSubject.value.find(
      item => item.id === locationId
    );

    if (location) {
      this.selectedLocationSubject.next(location);
    }
  }

  getCurrentLocation(): AdminLocationSummary | null {
    return this.selectedLocationSubject.value;
  }

  getCurrentLocations(): AdminLocationSummary[] {
    return this.locationsSubject.value;
  }
}