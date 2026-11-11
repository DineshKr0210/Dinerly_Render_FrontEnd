import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationGuest, notificationSummary } from 'src/app/models/notification.model';
import { ApiWaitlistNotificationService } from 'src/app/services/api-waitlist-notification.service';

@Component({
  selector: 'app-waitlist-notification',
  templateUrl: './waitlist-notification.component.html',
  styleUrls: ['./waitlist-notification.component.css']
})
export class WaitlistNotificationComponent implements OnInit, OnDestroy {
  private sub = new Subscription();

  restaurantId = 1;
  searchText = '';
  selectedStatus = 'ALL';
  smsMessage = '';
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalApiPages = 0;
  jumpPageInput: number | null = null;
  guestSummary :notificationSummary[] = [];
  selectedDate = '';

  isLoading = false;

  selectedGuest: NotificationGuest | null = null;

  guests: NotificationGuest[] = [];

  templates = [
    {
      title: 'Welcome Message',
      message: 'Hi {name}, your table will be ready soon. Thank you!'
    },
    {
      title: 'Your Turn Soon',
      message: 'Hi {name}, your turn is coming soon. Please be nearby.'
    },
    {
      title: 'Table Ready',
      message: 'Hi {name}, your table is ready. Please check-in.'
    },
    {
      title: 'Thank You',
      message: 'Hi {name}, thank you for waiting with us today!'
    }
  ];

  constructor(private waitlistApi: ApiWaitlistNotificationService) { }

  ngOnInit(): void {
    this.loadNotifications();
  }
  loadNotificationSummary():void{
    this.isLoading = true;

    this.waitlistApi.getNotificationsSummary(this.restaurantId)
      .subscribe({
          next: (res) => {
            this.guests = res.data.content || [];
           

            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
            alert('Unable to load notifications');
          }
        })
    
  }

  loadNotifications(): void {
    this.isLoading = true;

    const apiPage = this.currentPage;
    const status = this.selectedStatus === 'ALL' ? '' : this.selectedStatus;

    this.sub.add(
      this.waitlistApi
        .getNotifications(
          this.restaurantId,
          apiPage,
          this.pageSize,
          this.searchText.trim(),
          status,
          this.selectedDate

        )
        .subscribe({
          next: (res) => {
            this.guests = res.data.content || [];
            this.totalElements = res.data.totalElements || 0;
            this.totalApiPages = res.data.totalPages || 0;

            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
            alert('Unable to load notifications');
          }
        })
    );
  }

  onFilterChange(): void {
    this.loadNotifications();
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.loadNotifications();
  }

  onStatusChange(): void {
    this.currentPage = 1;
    this.loadNotifications();
  }

  get stats() {
    return {
      total: this.guestSummary.filter(g => g.totalGuests).length,
      waiting: this.guestSummary.filter(g => g.waiting).length,
      notified: this.guestSummary.filter(g => g.notified).length,
      seated: this.guestSummary.filter(g => g.seated).length,
      cancelled: this.guestSummary.filter(g => g.cancelled).length
    };
  }

  get filteredGuests(): NotificationGuest[] {
    return this.guests;
  }

  selectGuest(guest: NotificationGuest): void {
    this.selectedGuest = guest;
    this.smsMessage = '';
  }

  closePanel(): void {
    this.selectedGuest = null;
  }

  sendSms(): void {
    this.restaurantId = 1;
    if (!this.selectedGuest) return;

    if (!this.smsMessage.trim()) {
      alert('Please enter SMS message');
      return;
    }


    this.waitlistApi.sendNoficationToGuest(this.restaurantId, this.selectedGuest.id, { message: this.smsMessage }).subscribe({
      next: (res) => {
        alert(`SMS sent`);

        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        alert('Unable to load notifications');
      }
    })


  }

  trackByGuest(_: number, guest: NotificationGuest): number {
    return guest.id;
  }

  get totalPages(): number {
    return this.totalApiPages;
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

  get paginatedGuests(): NotificationGuest[] {
    return this.guests;
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.loadNotifications();
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadNotifications();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadNotifications();
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
    this.loadNotifications();
    this.jumpPageInput = null;
  }

  formatDateTime(date?: string): string {
    if (!date) return '-';

    return new Date(date).toLocaleString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      day: '2-digit',
      month: 'short'
    });
  }

  getActualWaitTime(approvedAt?: string, notifiedAt?: string): string {
    if (!approvedAt || !notifiedAt) return '-';

    const diffMs =
      new Date(notifiedAt).getTime() -
      new Date(approvedAt).getTime();

    if (diffMs < 0) return '-';

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} mins`;
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}