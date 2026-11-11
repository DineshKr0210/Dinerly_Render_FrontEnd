import { Component, OnInit } from '@angular/core';
import { Redemption, RedemptionsResponse } from 'src/app/models/admin.model';
import { WaitListAdminService } from 'src/app/services/wait-list-admin.service';

interface Location {
  id: number;
  name: string;
}



type RedemptionStatus = 'all' | 'coupons' | 'rewards';

@Component({
  selector: 'app-admin-redemptions',
  templateUrl: './admin-redemptions.component.html',
  styleUrls: ['./admin-redemptions.component.css']
})
export class AdminRedemptionsComponent implements OnInit {
  locations: Location[] = [];
  selectedLocationId: number | null = null;
  loadingLocations = false;

  selectedStatus: RedemptionStatus = 'all';

  fromDate = '';
  toDate = '';

  redemptions: Redemption[] = [];
  loading = false;
  errorMessage = '';

  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;
  jumpPageInput: number | null = null;

  exporting = false;

  constructor(
    private waitListAdminService: WaitListAdminService
  ) {}

  ngOnInit(): void {
    this.setDefaultDateRange();
    this.loadLocations();
  }

  loadLocations(): void {
  this.loadingLocations = true;
  this.errorMessage = '';

  this.waitListAdminService.getLocations().subscribe({
    next: (response: any) => {
      const data = response?.data;

      if (Array.isArray(data)) {
        this.locations = data;
      } else if (Array.isArray(data?.content)) {
        this.locations = data.content;
      } else if (Array.isArray(data?.locations)) {
        this.locations = data.locations;
      } else {
        this.locations = [];
      }

      this.selectedLocationId = null;
      this.loadingLocations = false;
      this.loadRedemptions();
    },

    error: () => {
      this.locations = [];
      this.loadingLocations = false;
      this.errorMessage = 'Unable to load locations.';
    }
  });
}

  setDefaultDateRange(): void {
    const now = new Date();
    const from = new Date(now);

    from.setDate(now.getDate() - 7);

    this.fromDate = this.toDateTimeLocalValue(from);
    this.toDate = this.toDateTimeLocalValue(now);
  }

  onLocationChange(): void {
    this.currentPage = 0;
    this.jumpPageInput = null;
    this.loadRedemptions();
  }

  onFromDateChange(): void {
    this.currentPage = 0;
    this.jumpPageInput = null;

    if (this.isDateRangeValid()) {
      this.loadRedemptions();
    }
  }

  onToDateChange(): void {
    this.currentPage = 0;
    this.jumpPageInput = null;

    if (this.isDateRangeValid()) {
      this.loadRedemptions();
    }
  }

  onStatusChange(status: RedemptionStatus): void {
    this.selectedStatus = status;
    this.currentPage = 0;
    this.jumpPageInput = null;
    this.loadRedemptions();
  }

  isDateRangeValid(): boolean {
    if (!this.fromDate || !this.toDate) {
      return false;
    }

    const from = new Date(this.fromDate);
    const to = new Date(this.toDate);

    return from <= to;
  }

  loadRedemptions(): void {
    if (!this.isDateRangeValid()) {
      this.errorMessage = 'From date must be before To date.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const fromDate = this.formatDateTimeForApi(this.fromDate);
    const toDate = this.formatDateTimeForApi(this.toDate);

    this.waitListAdminService.getRedemptions(
      this.selectedLocationId,
      this.selectedStatus,
      fromDate,
      toDate,
      this.currentPage,
      this.pageSize
    ).subscribe({
      next: (response: RedemptionsResponse) => {
        if (!response?.success) {
          this.redemptions = [];
          this.totalElements = 0;
          this.totalPages = 0;
          this.errorMessage =
            response?.message || 'Unable to load redemptions.';
          this.loading = false;
          return;
        }

        const data = response.data;

        this.redemptions = data?.content || [];
        this.currentPage = data?.number ?? 0;
        this.totalPages = data?.totalPages ?? 0;
        this.totalElements = data?.totalElements ?? 0;
        this.loading = false;
      },
      error: () => {
        this.redemptions = [];
        this.totalElements = 0;
        this.totalPages = 0;
        this.loading = false;
        this.errorMessage = 'Unable to load redemption history.';
      }
    });
  }

  private toDateTimeLocalValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  private formatDateTimeForApi(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadRedemptions();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadRedemptions();
    }
  }

  goToPage(page: number): void {
    if (
      page !== this.currentPage &&
      page >= 0 &&
      page < this.totalPages
    ) {
      this.currentPage = page;
      this.loadRedemptions();
    }
  }

  jumpToPage(): void {
    if (
      this.jumpPageInput === null ||
      this.jumpPageInput === undefined
    ) {
      return;
    }

    if (
      this.jumpPageInput < 1 ||
      this.jumpPageInput > this.totalPages
    ) {
      return;
    }

    this.currentPage = this.jumpPageInput - 1;
    this.loadRedemptions();
    this.jumpPageInput = null;
  }

  get pages(): number[] {
    const maxVisiblePages = 5;

    if (this.totalPages <= maxVisiblePages) {
      return Array.from(
        { length: this.totalPages },
        (_, index) => index
      );
    }

    let startPage = this.currentPage - 2;
    let endPage = this.currentPage + 2;

    if (startPage < 0) {
      startPage = 0;
      endPage = maxVisiblePages - 1;
    }

    if (endPage >= this.totalPages) {
      endPage = this.totalPages - 1;
      startPage = this.totalPages - maxVisiblePages;
    }

    return Array.from(
      { length: endPage - startPage + 1 },
      (_, index) => startPage + index
    );
  }

  get startItem(): number {
    if (this.totalElements === 0) {
      return 0;
    }

    return this.currentPage * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min(
      (this.currentPage + 1) * this.pageSize,
      this.totalElements
    );
  }

  formatRedeemedAt(redeemedAt: string): string {
    if (!redeemedAt) {
      return '—';
    }

    const date = new Date(redeemedAt);

    if (Number.isNaN(date.getTime())) {
      return redeemedAt;
    }

    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  getSelectedLocationName(): string {
    if (this.selectedLocationId === null) {
      return 'All locations';
    }

    const location = this.locations.find(
      item => item.id === this.selectedLocationId
    );

    return location?.name || 'All locations';
  }

  getRedemptionTypeLabel(type?: string): string {
    switch (type) {
      case 'OFFER':
        return 'Offer';
      case 'CAMPAIGN':
        return 'Campaign';
      default:
        return type ? type : '';
    }
  }

  getRedemptionCode(redemption: Redemption): string {
    return redemption.redemptionCode || `#${redemption.id}`;
  }

  getRedemptionItem(redemption: Redemption): string {
    return redemption.itemRedeemed || redemption.offerDiscountLabel || '';
  }

  exportCsv(): void {
    if (this.exporting) {
      return;
    }

    this.exporting = true;
    this.errorMessage = '';

    this.waitListAdminService.exportRedemptions(
      this.selectedLocationId,
      this.selectedStatus,
      this.formatDateTimeForApi(this.fromDate),
      this.formatDateTimeForApi(this.toDate)
    ).subscribe({
      next: (blob: Blob) => {
        this.downloadExportFile(blob);
        this.exporting = false;
      },
      error: () => {
        this.exporting = false;
        this.errorMessage = 'Unable to export redemptions.';
      }
    });
  }

  private downloadExportFile(blob: Blob): void {
    let extension = 'csv';

    if (
      blob.type &&
      blob.type.toLowerCase().includes('pdf')
    ) {
      extension = 'pdf';
    }

    const fileName =
      `redemptions-${this.formatFileDate()}.${extension}`;

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = fileName;

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    window.URL.revokeObjectURL(url);
  }

  private formatFileDate(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}