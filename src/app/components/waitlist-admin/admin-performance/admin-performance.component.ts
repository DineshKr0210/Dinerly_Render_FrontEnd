import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';

import {
  AdminLocationSummary,
  PerformancePeriod,
  PerformanceTab,
  RewardsOffersPerformanceData,
  ReviewsPerformanceData,
  WaitlistPerformanceData
} from 'src/app/models/admin.model';

import { WaitListAdminService } from 'src/app/services/wait-list-admin.service';

@Component({
  selector: 'app-admin-performance',
  templateUrl: './admin-performance.component.html',
  styleUrls: ['./admin-performance.component.css']
})
export class AdminPerformanceComponent implements OnInit {
  activeTab: PerformanceTab = 'WAITLIST';

  selectedLocation: number | null = null;

  selectedPeriod: PerformancePeriod = 'thisWeek';

  locations: AdminLocationSummary[] = [];

  locationsLoading = false;

  loading = false;

  errorMessage = '';

  waitlistData: WaitlistPerformanceData | null = null;

  reviewsData: ReviewsPerformanceData | null = null;

  rewardsOffersData: RewardsOffersPerformanceData | null = null;

  periodOptions: {
    value: PerformancePeriod;
    label: string;
  }[] = [
    {
      value: 'thisWeek',
      label: 'This week'
    },
    {
      value: 'thisMonth',
      label: 'This month'
    },
    {
      value: 'pastMonth',
      label: 'Past month'
    },
    {
      value: 'last3Months',
      label: 'Last 3 months'
    }
  ];

  constructor(
    private performanceService: WaitListAdminService
  ) {}

  ngOnInit(): void {
    this.loadLocations();
    this.loadPerformance();
  }

  loadLocations(): void {
    this.locationsLoading = true;

    this.performanceService
      .getLocations()
      .pipe(
        finalize(() => {
          this.locationsLoading = false;
        })
      )
      .subscribe({
        next: response => {
          if (response?.success && response.data) {
            this.locations =
              response.data.locations || [];
          } else {
            this.locations = [];
          }
        },
        error: error => {
          console.error(
            'Locations API error:',
            error
          );

          this.locations = [];
        }
      });
  }

  loadPerformance(): void {
    this.errorMessage = '';

    if (this.activeTab === 'WAITLIST') {
      this.loadWaitlistPerformance();
      return;
    }

    if (this.activeTab === 'REVIEWS') {
      this.loadReviewsPerformance();
      return;
    }

    if (this.activeTab === 'REWARDS_OFFERS') {
      this.loadRewardsOffersPerformance();
    }
  }

  loadWaitlistPerformance(): void {
    this.loading = true;
    this.errorMessage = '';
    this.waitlistData = null;

    this.performanceService
      .getWaitlistPerformance(
        this.selectedLocation ?? undefined,
        this.selectedPeriod
      )
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: response => {
          if (
            response?.success &&
            response.data
          ) {
            this.waitlistData =
              response.data;
            return;
          }

          this.errorMessage =
            response?.message ||
            'Unable to load waitlist performance.';
        },
        error: error => {
          console.error(
            'Waitlist performance API error:',
            error
          );

          this.waitlistData = null;

          this.setPerformanceError(
            error,
            'Unable to load waitlist performance.'
          );
        }
      });
  }

  loadReviewsPerformance(): void {
    this.loading = true;
    this.errorMessage = '';
    this.reviewsData = null;

    this.performanceService
      .getReviewsPerformance(
        this.selectedLocation ?? undefined,
        this.selectedPeriod
      )
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: response => {
          if (
            response?.success &&
            response.data
          ) {
            this.reviewsData =
              response.data;
            return;
          }

          this.errorMessage =
            response?.message ||
            'Unable to load reviews performance.';
        },
        error: error => {
          console.error(
            'Reviews performance API error:',
            error
          );

          this.reviewsData = null;

          this.setPerformanceError(
            error,
            'Unable to load reviews performance.'
          );
        }
      });
  }

  loadRewardsOffersPerformance(): void {
    this.loading = true;
    this.errorMessage = '';
    this.rewardsOffersData = null;

    this.performanceService
      .getRewardsOffersPerformance(
        this.selectedLocation ?? undefined,
        this.selectedPeriod,
        0,
        20
      )
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: response => {
          if (
            response?.success &&
            response.data
          ) {
            this.rewardsOffersData =
              response.data;
            return;
          }

          this.errorMessage =
            response?.message ||
            'Unable to load rewards and offers performance.';
        },
        error: error => {
          console.error(
            'Rewards & Offers performance API error:',
            error
          );

          this.rewardsOffersData = null;

          this.setPerformanceError(
            error,
            'Unable to load rewards and offers performance.'
          );
        }
      });
  }

  onLocationChange(event: Event): void {
    const value =
      (event.target as HTMLSelectElement).value;

    if (value === 'ALL') {
      this.selectedLocation = null;
    } else {
      this.selectedLocation =
        Number(value);
    }

    this.loadPerformance();
  }

  onPeriodChange(event: Event): void {
    const value =
      (event.target as HTMLSelectElement).value;

    if (
      value === 'thisWeek' ||
      value === 'thisMonth' ||
      value === 'pastMonth' ||
      value === 'last3Months'
    ) {
      this.selectedPeriod = value;
      this.loadPerformance();
    }
  }

  changeTab(tab: PerformanceTab): void {
    if (this.activeTab === tab) {
      return;
    }

    this.activeTab = tab;
    this.loadPerformance();
  }

  getSelectedLocationName(): string {
    if (this.selectedLocation === null) {
      return 'All locations';
    }

    const location =
      this.locations.find(
        item =>
          item.id === this.selectedLocation
      );

    return (
      location?.name ||
      'All locations'
    );
  }

  getMaxTrendValue(
    trend:
      | {
          value: number;
        }[]
      | null
      | undefined
  ): number {
    if (!trend?.length) {
      return 1;
    }

    const max = Math.max(
      ...trend.map(item => item.value)
    );

    return max > 0 ? max : 1;
  }

  getTrendBarHeight(
    value: number,
    trend:
      | {
          value: number;
        }[]
      | null
      | undefined
  ): number {
    const max =
      this.getMaxTrendValue(trend);

    if (value <= 0) {
      return 4;
    }

    return Math.max(
      (value / max) * 100,
      8
    );
  }

  formatWaitTime(
    value: number | null | undefined
  ): string {
    if (
      value === null ||
      value === undefined
    ) {
      return '-';
    }

    return `${value} min`;
  }

  formatRating(
    value: number | null | undefined
  ): string {
    if (
      value === null ||
      value === undefined
    ) {
      return '-';
    }

    return value.toFixed(1);
  }

  formatPercentage(
    value: number | null | undefined
  ): string {
    if (
      value === null ||
      value === undefined
    ) {
      return '-';
    }

    return `${value}%`;
  }

  private setPerformanceError(
    error: any,
    fallbackMessage: string
  ): void {
    if (error?.status === 401) {
      this.errorMessage =
        'Your admin session has expired. Please log in again.';
      return;
    }

    if (error?.status === 403) {
      this.errorMessage =
        'Access denied. Your admin account does not have permission to view performance data.';
      return;
    }

    this.errorMessage =
      error?.error?.message ||
      fallbackMessage;
  }
}