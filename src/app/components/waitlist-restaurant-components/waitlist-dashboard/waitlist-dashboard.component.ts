import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';

import {
  CancelledGuest,
  DashboardStatus,
  getDashboardData,
  NotifiedGuest,
  PendingGuest,
  SeatedGuest,
  tableList,
  WaitingGuest
} from 'src/app/models/waitlist-api-guest-to-restaurant.model';

import { NotificationService } from 'src/app/services/notification.service';
import { WaitlistApiRestaurantService } from 'src/app/services/waitlist-api-restaurant.service';
import { WaitlistRestaurantModalService } from 'src/app/services/waitlist-restaurant-modal.service';

interface DashboardLiveGuest {
  id: number;
  guestName: string;
  guestPhone: string;
  partySize: number;
  preference?: string;
  notes?: string;
  status: string;
  position?: number;
  estimatedWaitTime?: number;
  joinedAt?: string;
  approvedAt?: string;
  notifiedAt?: string;
  seatedAt?: string;
  cancelledAt?: string;
  tableName?: string;
}

type WaitlistTab = 'WAITING' | 'NOTIFIED' | 'SEATED' | 'CANCELLED';

type LiveGuest = DashboardLiveGuest;

@Component({
  selector: 'app-waitlist-dashboard',
  templateUrl: './waitlist-dashboard.component.html',
  styleUrls: ['./waitlist-dashboard.component.css']
})
export class WaitlistDashboardComponent implements OnInit, OnDestroy {

  restaurantId = 1;

  dashboardStatus: DashboardStatus[] = [];

  dashboardData: getDashboardData = {
    averageWaitTime: 0,
    noShowsToday: 0,
    occupiedTables: 0,
    openTables: 0,
    reservedTables: 0,
    seatedToday: 0,
    tablesNeedingCleaning: 0,
    totalNotified: 0,
    totalWaiting: 0
  };

  pendingGuests: PendingGuest[] = [];
  waitingGuests: WaitingGuest[] = [];
  notifiedGuests: NotifiedGuest[] = [];
  seatedGuests: SeatedGuest[] = [];
  cancelledGuests: CancelledGuest[] = [];

  activeTab: WaitlistTab = 'WAITING';

  showPendingBox = false;
  showGuestPopup = false;
  showRejectReason = false;

  selectedGuest: any = null;
  selectedWaitTime = 5;
  waitTimeOptions = [5, 10, 15, 20, 25, 30];

  rejectReason = '';

  isLoading = false;
  isApproving = false;
  isRejecting = false;
  isNotifying = false;
  isSeating = false;

  tables: tableList[] = [];
  openTables: tableList[] = [];
  selectedTable: tableList | null = null;
  showTable = false;

  tableStats = {
    total: 0,
    open: 0,
    occupied: 0,
    reserved: 0,
    cleaning: 0
  };

  donutStyle = '';

  currentDateTime = '';
  private clockInterval: any;
  private refreshInterval: any;
  private sub = new Subscription();

  recentChangedGuestId: number | null = null;

  constructor(
    private router: Router,
    public modalService: WaitlistRestaurantModalService,
    private waitlistApi: WaitlistApiRestaurantService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadDashboardAllData();

    this.updateDateTime();

    this.clockInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);

    this.refreshInterval = setInterval(() => {
      this.loadDashboardAllData(false);
    }, 5000);
  }

  loadDashboardAllData(showLoader: boolean = true): void {
    if (showLoader) {
      this.isLoading = true;
    }

    forkJoin({
      dashboard: this.waitlistApi.getDashboardData(this.restaurantId),
      pending: this.waitlistApi.getGuestsStatus(this.restaurantId, 'PENDING', ''),
      waiting: this.waitlistApi.getWaitingGuests(this.restaurantId, 'WAITING', ''),
      notified: this.waitlistApi.getNotifiedGuests(this.restaurantId, 'NOTIFIED', ''),
      seated: this.waitlistApi.getSeatedGuests(this.restaurantId, 'SEATED', ''),
      cancelled: this.waitlistApi.getCancelledGuests(this.restaurantId, 'CANCELLED', ''),
      tables: this.waitlistApi.getRestaurantTableslist(this.restaurantId)
    }).subscribe({
      next: (res) => {
        this.isLoading = false;

        if (res.dashboard.success) {
          this.dashboardData = res.dashboard.data;
        }

        this.pendingGuests = res.pending.data || [];
        this.waitingGuests = res.waiting.data || [];
        this.notifiedGuests = res.notified.data || [];
        this.seatedGuests = res.seated.data || [];
        this.cancelledGuests = res.cancelled.data || [];

        this.tables = res.tables.data || [];
        this.openTables = this.tables.filter(table => table.status === 'OPEN');

        this.calculateTableStats();
      },
      error: () => {
        this.isLoading = false;
        alert('Unable to load dashboard data');
      }
    });
  }

  get allDashboardGuests(): DashboardLiveGuest[] {
  return [
    ...this.waitingGuests,
    ...this.notifiedGuests,
    ...this.seatedGuests,
    ...this.cancelledGuests
  ].map((guest: any) => ({
    id: guest.id,
    guestName: guest.guestName,
    guestPhone: guest.guestPhone,
    partySize: guest.partySize,
    preference: guest.preference,
    notes: guest.notes,
    status: guest.status,
    position: guest.position,
    estimatedWaitTime: guest.estimatedWaitTime,
    joinedAt: guest.joinedAt,
    approvedAt: guest.approvedAt,
    notifiedAt: guest.notifiedAt,
    seatedAt: guest.seatedAt,
    cancelledAt: guest.cancelledAt,
    tableName: guest.tableName
  }));
}

  updateDateTime(): void {
    this.currentDateTime = new Date().toLocaleString('en-IN', {
      timeZone: 'America/Toronto',
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  }

  togglePendingBox(): void {
    this.showPendingBox = !this.showPendingBox;
  }

  openPendingGuest(guest: PendingGuest): void {
    this.selectedGuest = guest;
    this.selectedWaitTime = 5;
    this.rejectReason = '';
    this.showRejectReason = false;
    this.showGuestPopup = true;
    this.showPendingBox = false;
  }

  closeGuestPopup(): void {
    this.selectedGuest = null;
    this.showGuestPopup = false;
    this.showRejectReason = false;
    this.rejectReason = '';
  }

  approveSelectedGuest(): void {
    if (!this.selectedGuest) return;

    this.isApproving = true;

    this.waitlistApi.approveGuest(this.restaurantId, this.selectedGuest.id, {
      estimatedWaitTime: this.selectedWaitTime
    }).subscribe({
      next: (res) => {
        const approvedGuest = res.data;

        this.pendingGuests = this.pendingGuests.filter(
          guest => guest.id !== approvedGuest.id
        );

        this.waitingGuests = [approvedGuest, ...this.waitingGuests];

        this.activeTab = 'WAITING';
        this.markRowChanged(approvedGuest.id);

        this.isApproving = false;
        this.closeGuestPopup();

        this.loadDashboardAllData(false);
      },
      error: () => {
        this.isApproving = false;
        alert('Unable to approve guest');
      }
    });
  }

  showRejectBox(): void {
    this.showRejectReason = true;
  }

  rejectSelectedGuest(): void {
    if (!this.selectedGuest) return;

    // if (!this.rejectReason.trim()) {
    //   alert('Please enter delete reason');
    //   {
    //   reason: this.rejectReason
    // }
    //   return;
    // }

    this.isRejecting = true;

    this.waitlistApi.rejectGuest(this.restaurantId, this.selectedGuest.id, ).subscribe({
      next: () => {
        this.pendingGuests = this.pendingGuests.filter(
          guest => guest.id !== this.selectedGuest.id
        );

        this.isRejecting = false;
        this.closeGuestPopup();

        this.loadDashboardAllData(false);
      },
      error: () => {
        this.isRejecting = false;
        alert('Unable to delete guest');
      }
    });
  }

  notifyGuest(guest: any): void {
    if (!guest) return;

    this.isNotifying = true;

    this.waitlistApi.notifyToGuest(this.restaurantId, guest.id, {
      estimatedWaitTime: guest.estimatedWaitTime,
      position: guest.position
    }).subscribe({
      next: (res) => {
        const notifiedGuest = res.data;

        this.waitingGuests = this.waitingGuests.filter(
          item => item.id !== notifiedGuest.id
        );

        this.notifiedGuests = [notifiedGuest, ...this.notifiedGuests];

        this.activeTab = 'NOTIFIED';
        this.markRowChanged(notifiedGuest.id);

        this.isNotifying = false;

        this.loadDashboardAllData(false);
      },
      error: () => {
        this.isNotifying = false;
        alert('Unable to notify guest');
      }
    });
  }

  openAvailableTableModal(guest: any): void {
    this.selectedGuest = guest;
    this.selectedTable = null;
    this.openTables = this.tables.filter(table => table.status === 'OPEN');
    this.showTable = true;
  }

  closeAvailableTableModal(): void {
    this.showTable = false;
    this.selectedGuest = null;
    this.selectedTable = null;
  }

  seatGuest(): void {
    if (!this.selectedGuest || !this.selectedTable) {
      alert('Please select table');
      return;
    }

    this.isSeating = true;

    forkJoin({
      tableStatus: this.waitlistApi.updateTableStatus(
        this.restaurantId,
        this.selectedTable.id,
        'OCCUPIED'
      ),
      seatedGuest: this.waitlistApi.seatedGuest(
        this.restaurantId,
        this.selectedGuest.id,
        {
          tableName: this.selectedTable.tableNumber
        }
      )
    }).subscribe({
      next: ({ seatedGuest }) => {
        const seated = seatedGuest.data;

        this.notifiedGuests = this.notifiedGuests.filter(
          guest => guest.id !== seated.id
        );

        this.seatedGuests = [seated, ...this.seatedGuests];

        this.activeTab = 'SEATED';
        this.markRowChanged(seated.id);

        this.isSeating = false;
        this.closeAvailableTableModal();

        this.loadDashboardAllData(false);
        this.notificationService.triggerRestaurantRefresh();
      },
      error: () => {
        this.isSeating = false;
        alert('Unable to seat guest');
      }
    });
  }

  calculateTableStats(): void {
    const total = this.tables.length;
    const open = this.tables.filter(t => t.status === 'OPEN').length;
    const occupied = this.tables.filter(t => t.status === 'OCCUPIED').length;
    const reserved = this.tables.filter(t => t.status === 'RESERVED').length;
    const cleaning = this.tables.filter(t => t.status === 'CLEANING').length;

    this.tableStats = {
      total,
      open,
      occupied,
      reserved,
      cleaning
    };

    if (total === 0) {
      this.donutStyle = '#e5e7eb 0 100%';
      return;
    }

    const openEnd = (open / total) * 100;
    const occupiedEnd = openEnd + (occupied / total) * 100;
    const reservedEnd = occupiedEnd + (reserved / total) * 100;
    const cleaningEnd = reservedEnd + (cleaning / total) * 100;

    this.donutStyle = `
      #22c55e 0 ${openEnd}%,
      #6d28d9 ${openEnd}% ${occupiedEnd}%,
      #f59e0b ${occupiedEnd}% ${reservedEnd}%,
      #94a3b8 ${reservedEnd}% ${cleaningEnd}%
    `;
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'WAITING':
        return 'Waiting';
      case 'NOTIFIED':
        return 'Notified';
      case 'SEATED':
        return 'Seated';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  getGuestInitials(name: string): string {
    if (!name) return 'G';

    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  formatTime(date?: string): string {
    if (!date) return '-';

    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  markRowChanged(id: number): void {
    this.recentChangedGuestId = id;

    setTimeout(() => {
      this.recentChangedGuestId = null;
    }, 1200);
  }

  trackByGuest(_: number, guest: any): number {
    return guest.id;
  }

  goToFloorMap(): void {
    this.router.navigate(['/restaurant/tables']);
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();

    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }

    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}