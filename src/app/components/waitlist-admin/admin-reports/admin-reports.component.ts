import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  Subscription
} from 'rxjs';
import {
  AdminLocationSummary,
  AdminReport,
  AdminReportLocation
} from 'src/app/models/admin.model';
import {
  WaitListAdminService
} from 'src/app/services/wait-list-admin.service';
import {
  AdminLocationContextService
} from 'src/app/services/admin-location-context.service';

type ReportScope = 'overall' | 'location';
type ReportPeriod = 'last30days' | 'last90days' | '';

@Component({
  selector: 'app-admin-reports',
  templateUrl: './admin-reports.component.html',
  styleUrls: ['./admin-reports.component.css']
})
export class AdminReportsComponent
  implements OnInit, OnDestroy {

  locations: AdminReportLocation[] = [];
  reports: AdminReport[] = [];

  selectedScope: ReportScope = 'overall';
  selectedPeriod: ReportPeriod = 'last30days';

  selectedLocationId: number | null = null;
  selectedLocation: AdminReportLocation | null = null;

  fromDate = '';
  toDate = '';

  showLocationModal = false;

  isLoading = false;
  isLoadingReports = false;
  isLoadingLocations = false;
  isGenerating = false;
  isDownloading = false;

  errorMessage = '';
  successMessage = '';

  private subscriptions =
    new Subscription();

  constructor(
    private waitListAdminService:
      WaitListAdminService,
    private locationContext:
      AdminLocationContextService
  ) {}

  ngOnInit(): void {
    this.loadReports();
    this.loadLocations();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadReports(): void {
    this.isLoadingReports = true;
    this.errorMessage = '';

    this.waitListAdminService
      .getAdminReports(0, 20)
      .subscribe({
        next: response => {
          this.isLoadingReports = false;

          this.reports =
            response?.content || [];
        },
        error: error => {
          console.error(
            'Get reports error:',
            error
          );

          this.isLoadingReports = false;
          this.reports = [];

          this.errorMessage =
            error?.error?.message ||
            'Unable to load reports.';
        }
      });
  }

  loadLocations(): void {
    this.isLoadingLocations = true;
    this.errorMessage = '';

    this.waitListAdminService
      .getLocations()
      .subscribe({
        next: (response: any) => {
          const data =
            response?.data;

          if (Array.isArray(data)) {
            this.locations = data;
          } else if (
            Array.isArray(data?.content)
          ) {
            this.locations =
              data.content;
          } else if (
            Array.isArray(data?.locations)
          ) {
            this.locations =
              data.locations;
          } else {
            this.locations = [];
          }

          this.isLoadingLocations = false;
        },
        error: error => {
          console.error(
            'Get locations error:',
            error
          );

          this.locations = [];
          this.isLoadingLocations = false;

          this.errorMessage =
            error?.error?.message ||
            'Unable to load locations.';
        }
      });
  }

  selectScope(
    scope: ReportScope
  ): void {
    this.selectedScope = scope;

    this.clearMessages();

    if (scope === 'overall') {
      this.selectedLocationId = null;
      this.selectedLocation = null;
      this.showLocationModal = false;
      return;
    }

    this.openLocationModal();
  }

  openLocationModal(): void {
    if (!this.locations.length) {
      this.loadLocations();
    }

    this.showLocationModal = true;
  }

  closeLocationModal(): void {
    if (this.isGenerating) {
      return;
    }

    this.showLocationModal = false;
  }

  selectLocation(
    location: AdminReportLocation
  ): void {
    this.selectedLocation =
      location;

    this.selectedLocationId =
      location.id;

    this.showLocationModal = false;
    this.clearMessages();
  }

  clearSelectedLocation(): void {
    this.selectedLocation = null;
    this.selectedLocationId = null;
  }

  onPeriodChange(): void {
    if (this.selectedPeriod) {
      this.fromDate = '';
      this.toDate = '';
    }

    this.clearMessages();
  }

  onFromDateChange(): void {
    if (this.fromDate) {
      this.selectedPeriod = '';
    }

    this.clearMessages();
  }

  onToDateChange(): void {
    if (this.toDate) {
      this.selectedPeriod = '';
    }

    this.clearMessages();
  }

  get periodDisabled(): boolean {
    return !!(
      this.fromDate ||
      this.toDate
    );
  }

  get dateDisabled(): boolean {
    return !!this.selectedPeriod;
  }

  get canGenerate(): boolean {
    if (this.isGenerating) {
      return false;
    }

    if (
      this.selectedScope ===
      'location' &&
      !this.selectedLocationId
    ) {
      return false;
    }

    if (this.selectedPeriod) {
      return true;
    }

    if (
      this.fromDate &&
      this.toDate
    ) {
      return true;
    }

    return false;
  }

  generateReport(): void {
  if (!this.canGenerate) {
    this.showError(
      this.getValidationMessage()
    );
    return;
  }

  this.isGenerating = true;
  this.clearMessages();

  const type = this.selectedScope;

  const locationId =
    type === 'location'
      ? this.selectedLocationId || undefined
      : undefined;

  const period =
    this.selectedPeriod || undefined;

  const startDate =
    !period && this.fromDate
      ? this.fromDate
      : undefined;

  const endDate =
    !period && this.toDate
      ? this.toDate
      : undefined;

  this.waitListAdminService
    .generateAdminReport(
      type,
      locationId,
      period,
      startDate,
      endDate
    )
    .subscribe({
      next: response => {
        this.isGenerating = false;

        if (!response?.id) {
          this.showError(
            'Report was generated but no report ID was returned.'
          );
          return;
        }

        this.showSuccess(
          'Report generated successfully. Downloading...'
        );

        this.downloadReport(
          response.id,
          response.fileName
        );

        this.loadReports();
      },
      error: error => {
        console.error(
          'Generate report error:',
          error
        );

        this.isGenerating = false;

        this.showError(
          error?.error?.message ||
          'Unable to generate report.'
        );
      }
    });
}

  downloadReport(
    reportId: number,
    fileName?: string
  ): void {
    if (!reportId) {
      return;
    }

    this.isDownloading = true;

    this.waitListAdminService
      .downloadAdminReport(
        reportId
      )
      .subscribe({
        next: blob => {
          this.isDownloading = false;

          const downloadUrl =
            window.URL.createObjectURL(
              blob
            );

          const link =
            document.createElement(
              'a'
            );

          link.href =
            downloadUrl;

          link.download =
            fileName ||
            `report-${reportId}.csv`;

          link.click();

          window.URL.revokeObjectURL(
            downloadUrl
          );
        },
        error: error => {
          console.error(
            'Download report error:',
            error
          );

          this.isDownloading = false;

          this.showError(
            'Unable to download report.'
          );
        }
      });
  }

  getValidationMessage(): string {
    if (
      this.selectedScope ===
        'location' &&
      !this.selectedLocationId
    ) {
      return 'Please select a location.';
    }

    if (
      !this.selectedPeriod &&
      !this.fromDate &&
      !this.toDate
    ) {
      return 'Please select a period or date range.';
    }

    if (
      !this.selectedPeriod &&
      (
        !this.fromDate ||
        !this.toDate
      )
    ) {
      return 'Please select both From and To dates.';
    }

    if (
      this.fromDate &&
      this.toDate &&
      this.fromDate >
        this.toDate
    ) {
      return 'From date cannot be after To date.';
    }

    return 'Please complete the report options.';
  }



  getPeriodLabel(
    period?: string
  ): string {
    switch (period) {
      case 'last30days':
        return 'Past month';

      case 'last90days':
        return 'Last 3 months';

      default:
        return period || 'Custom range';
    }
  }

  getReportScopeLabel(
    report: AdminReport
  ): string {
    if (
      report.type === 'overall' ||
      report.type === 'reports'
    ) {
      return 'All locations';
    }

    return (
      report.scope ||
      this.getLocationName(
        report.locationId
      )
    );
  }

  getLocationName(
    locationId?: number
  ): string {
    if (!locationId) {
      return 'Unknown location';
    }

    const location =
      this.locations.find(
        item =>
          item.id ===
          locationId
      );

    return (
      location?.name ||
      `Location ${locationId}`
    );
  }

  formatGeneratedDate(
    value: string
  ): string {
    if (!value) {
      return '';
    }

    const date =
      new Date(value);

    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }
    );
  }

  getReportPeriod(
    report: AdminReport
  ): string {
    if (report.period) {
      return this.getPeriodLabel(
        report.period
      );
    }

    return 'Custom range';
  }

  getReportIcon(
    report: AdminReport
  ): string {
    return report.type === 'location'
      ? 'fa-location-dot'
      : 'fa-file-lines';
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

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}