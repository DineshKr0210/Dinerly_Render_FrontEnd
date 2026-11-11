import { Component } from '@angular/core';
import { GetGuestHistory } from 'src/app/models/admin.model';
import { WaitListAdminService } from 'src/app/services/wait-list-admin.service';
import { WaitlistApiRestaurantService } from 'src/app/services/waitlist-api-restaurant.service';

@Component({
  selector: 'app-admin-history',
  templateUrl: './admin-history.component.html',
  styleUrls: ['./admin-history.component.css']
})
export class AdminHistoryComponent {
  restaurantId = 1;
  history: GetGuestHistory[] = [];
  isLoading = false;
  selectedStatus = '';
  selectedStatusCSV = ''
  selectedDate = '';
  selectedDateCSV = ''
  currentPage = 0;
  pageSize = 15;
  totalPages = 0;
  totalElements = 0;
  jumpPageInput: number | null = null;
  isDownloadingCSV: boolean = false;

  constructor(private waitlistService: WaitListAdminService) { }

  ngOnInit(): void {
    this.loadGuestHistory();
  }

  loadGuestHistory(): void {

    this.isLoading = true;

    this.waitlistService.getRestaurantGuestHistory(this.restaurantId, this.currentPage, this.pageSize, this.selectedStatus, this.selectedDate).subscribe({
      next: (res) => {
        this.history = res.data.content || [];
        this.totalPages = res.data.totalPages;
        this.totalElements = res.data.totalElements;
        this.isLoading = false;
      },

      error: () => {
        this.isLoading = false;
        alert('Unable to load history');
      }
    });

  }

  onFilterChange(): void {
    this.selectedDateCSV = this.selectedDate;
    this.selectedStatusCSV = this.selectedStatus
    this.currentPage = 0;
    this.loadGuestHistory();
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadGuestHistory();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadGuestHistory();
    }
  }

  jumpToPage(): void {
    if (!this.jumpPageInput) {
      alert('Please enter page number');
      return;
    }

    if (this.jumpPageInput < 1 || this.jumpPageInput > this.totalPages) {
      alert(`Please enter page between 1 and ${this.totalPages}`);
      return;
    }

    this.currentPage = this.jumpPageInput - 1;
    this.loadGuestHistory();
    this.jumpPageInput = null;
  }

  get pages(): number[] {

    const maxVisiblePages = 5;
    if (this.totalPages <= maxVisiblePages) {
      return Array.from({ length: this.totalPages }, (_, i) => i);
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
      (_, i) => startPage + i
    );
  }

  get startItem(): number {
    if (this.totalElements === 0) return 0;
    return this.currentPage * this.pageSize + 1;

  }

  get endItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  goToPage(page: number): void {
    if (page !== this.currentPage) {
      this.currentPage = page;
      this.loadGuestHistory();
    }
  }

  getWaitTime(entry: GetGuestHistory): string {
    if (!entry.joinedAt || !entry.seatedAt) {
      return '—';
    }
    const joined = new Date(entry.joinedAt).getTime();
    const seated = new Date(entry.seatedAt).getTime();
    const minutes = Math.round((seated - joined) / 60000);
    return `${minutes} min`;
  }

  exportHistoryCsv() {

    this.isDownloadingCSV = true;


    this.waitlistService

      .exportGuestHistoryCsv(this.restaurantId, this.selectedStatusCSV, this.selectedDateCSV)

      .subscribe({

        next: (blob: Blob) => {

          const fileName = `guest-history-${new Date().toISOString().slice(0, 10)}.csv`;

          const url = window.URL.createObjectURL(blob);

          const a = document.createElement('a');

          a.href = url;

          a.download = fileName;

          a.click();

          window.URL.revokeObjectURL(url);

          this.isDownloadingCSV = false;

        },

        error: (err) => {
          this.isDownloadingCSV = false;
          console.error('CSV export failed:', err);

          alert('Failed to export CSV');

        }

      });
  }

  trackById(_: number, entry: GetGuestHistory): number {
    return entry.id;
  }
}
