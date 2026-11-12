import { Component, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { GetGuestHistory } from 'src/app/models/waitlist-api-guest-to-restaurant.model';
import { WaitlistApiRestaurantService } from 'src/app/services/waitlist-api-restaurant.service';
import { WaitlistAuthService } from 'src/app/services/waitlist-auth.service';

@Component({
  selector: 'app-waitlist-restaurant-history',
  templateUrl: './waitlist-restaurant-history.component.html',
  styleUrls: ['./waitlist-restaurant-history.component.css']
})
export class WaitlistRestaurantHistoryComponent implements OnInit {

  restaurantId: number | null = null;
  history: GetGuestHistory[] = [];
  isLoading = false;
  selectedStatus = '';
  selectedStatusCSV = '';
  selectedDate = '';
  selectedDateCSV = '';
  selectedFromDate = '';
  selectedToDate = '';
  currentPage = 0;
  pageSize = 15;
  totalPages = 0;
  totalElements = 0;
  jumpPageInput: number | null = null;
  isDownloadingCSV = false;
  showRestaurantMenu = false;
  searchText = '';
  restaurantName = '';
  expandedHistoryId: number | null = null;

  constructor(
    private waitlistService: WaitlistApiRestaurantService,
    private router: Router,
    private auth: WaitlistAuthService
  ) { }

  ngOnInit(): void {
    this.restaurantId = this.auth.getRestaurantId();
    this.restaurantName = this.auth.getRestaurantName();
    this.loadGuestHistory();
  }

  loadGuestHistory(): void {
    if (!this.restaurantId) {
      return;
    }

    this.isLoading = true;

    this.waitlistService
      .getRestaurantGuestHistory(
        this.restaurantId,
        this.currentPage,
        this.pageSize,
        this.selectedStatus,
        this.selectedDate
      )
      .subscribe({
        next: (res) => {
          const page = res?.data || {};
          this.history = page.content || [];
          this.totalPages = page.totalPages || 0;
          this.totalElements = page.totalElements || 0;
          this.expandedHistoryId = null;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          alert('Unable to load history');
        }
      });
  }

  toggleHistoryAccordion(entry: GetGuestHistory): void {
    this.expandedHistoryId = this.expandedHistoryId === entry.id ? null : entry.id;
  }

  isHistoryExpanded(entry: GetGuestHistory): boolean {
    return this.expandedHistoryId === entry.id;
  }

  onFilterChange(): void {
    this.expandedHistoryId = null;
    this.selectedDateCSV = this.selectedDate;
    this.selectedStatusCSV = this.selectedStatus;
    this.currentPage = 0;
    this.loadGuestHistory();
  }

  resetAccordionAndPage(): void {
    this.expandedHistoryId = null;
    this.currentPage = 0;
  }

  formatHistoryDateTime(date: string | null | undefined): string {
    if (!date) {
      return '—';
    }

    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.expandedHistoryId = null;
      this.currentPage--;
      this.loadGuestHistory();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.expandedHistoryId = null;
      this.currentPage++;
      this.loadGuestHistory();
    }
  }

  goToPage(page: number): void {
    if (page !== this.currentPage) {
      this.expandedHistoryId = null;
      this.currentPage = page;
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
      return Array.from({ length: this.totalPages }, (_, index) => index);
    }

    let startPage = this.currentPage - 2;
    let endPage = this.currentPage + 2;

    if (startPage < 0) {
      startPage = 0;
      endPage = maxVisiblePages - 1;
    }

    if (endPage >= this.totalPages) {
      endPage = this.totalPages - 1;
      startPage = Math.max(0, this.totalPages - maxVisiblePages);
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
  }

  get startItem(): number {
    if (this.totalElements === 0) {
      return 0;
    }
    return this.currentPage * this.pageSize + 1;
  }

  get endItem(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
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

  exportHistoryCsv(): void {
    this.isDownloadingCSV = true;

    this.waitlistService
      .exportGuestHistoryCsv(this.restaurantId as number, this.selectedStatusCSV, this.selectedDateCSV)
      .subscribe({
        next: (blob: Blob) => {
          const fileName = `guest-history-${new Date().toISOString().slice(0, 10)}.csv`;
          const url = window.URL.createObjectURL(blob);
          const anchor = document.createElement('a');

          anchor.href = url;
          anchor.download = fileName;
          anchor.click();

          window.URL.revokeObjectURL(url);
          this.isDownloadingCSV = false;
        },
        error: (error) => {
          this.isDownloadingCSV = false;
          console.error('CSV export failed:', error);
          alert('Failed to export CSV');
        }
      });
  }

  get currentTimeOnly(): string {
    return new Date().toLocaleTimeString('en-IN', {
      timeZone: 'America/Toronto',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  todayLabel = new Date().toLocaleDateString('en-IN', {
    timeZone: 'America/Toronto',
    month: 'long',
    day: '2-digit',
    year: 'numeric'
  });

  setStatusFilter(status: string): void {
    this.selectedStatus = status;
    this.onFilterChange();
  }

  clearFilters(): void {
    this.expandedHistoryId = null;
    this.searchText = '';
    this.selectedStatus = '';
    this.selectedDate = '';
    this.selectedFromDate = '';
    this.selectedToDate = '';
    this.selectedStatusCSV = '';
    this.selectedDateCSV = '';
    this.currentPage = 0;
    this.loadGuestHistory();
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '';
  }

  formatStatus(status: string): string {
    const normalized = (status || '').toUpperCase();

    if (normalized === 'NO_SHOW') {
      return 'NO-SHOW';
    }

    if (normalized === 'CANCELLED') {
      return 'REMOVED';
    }

    if (normalized === 'SEATED' || normalized === 'COMPLETED') {
      return 'COMPLETED';
    }

    return normalized || '—';
  }

  getStatusClass(status: string): string {
    const normalized = (status || '').toUpperCase();

    if (normalized === 'SEATED' || normalized === 'COMPLETED') {
      return 'status-completed';
    }

    if (normalized === 'CANCELLED') {
      return 'status-removed';
    }

    if (normalized === 'NO_SHOW') {
      return 'status-no-show';
    }

    return 'status-default';
  }

  formatPreference(preference?: string | null): string {
    if (!preference || preference === 'NO_PREFERENCE') {
      return '—';
    }

    return preference
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  hasSmsReply(entry: GetGuestHistory): boolean {
    return Boolean(entry.latestCustomerReply || entry.customerReplyDescription);
  }

  hasVoiceReply(entry: GetGuestHistory): boolean {
    return Boolean(entry.latestVoiceReply || entry.callResponse || entry.voiceReplyDigits);
  }

  getVoiceReplyText(entry: GetGuestHistory): string {
    if (entry.latestVoiceReply) {
      return entry.latestVoiceReply;
    }

    if (entry.callResponse) {
      return entry.callResponse;
    }

    if (String(entry.voiceReplyDigits || '') === '1') {
      return 'Confirmed attending';
    }

    if (String(entry.voiceReplyDigits || '') === '2') {
      return 'Cannot attend';
    }

    return '—';
  }

  getSmsReplyText(entry: GetGuestHistory): string {
    return entry.customerReplyDescription || entry.latestCustomerReply || '—';
  }

  get filteredHistory(): GetGuestHistory[] {
    const search = this.searchText.trim().toLowerCase();
    const fromDate = this.selectedFromDate ? new Date(this.selectedFromDate) : null;
    const toDate = this.selectedToDate ? new Date(`${this.selectedToDate}T23:59:59`) : null;

    return this.history.filter((entry: GetGuestHistory) => {
      const matchesSearch = !search || (entry.guestName || '').toLowerCase().includes(search);
      const matchesStatus = !this.selectedStatus || entry.status === this.selectedStatus;

      const joinedDate = entry.joinedAt ? new Date(entry.joinedAt) : null;
      const matchesFrom = !fromDate || !joinedDate || joinedDate >= fromDate;
      const matchesTo = !toDate || !joinedDate || joinedDate <= toDate;

      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }

  trackById(_: number, entry: GetGuestHistory): number {
    return entry.id;
  }

  @HostListener('document:click')
  closeContactActions(): void {
    this.showRestaurantMenu = false;
  }

  toggleRestaurantMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showRestaurantMenu = !this.showRestaurantMenu;
  }

  logoutFromMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.logout();
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']);
  }
}
