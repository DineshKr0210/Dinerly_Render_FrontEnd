import {
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';

import { Router } from '@angular/router';
import {
  forkJoin,
  Observable,
  of,
  Subject,
  Subscription,
  switchMap,
  takeUntil,
  timer,
  exhaustMap,
  finalize
} from 'rxjs';

import {
  CancelledGuest,
  DashboardStatus,
  getDashboardData,
  NotifiedGuest,
  PendingGuest,
  RestaurantFloorServer,
  SeatedGuest,
  tableList,
  WaitingGuest
} from 'src/app/models/waitlist-api-guest-to-restaurant.model';

import { NotificationService } from 'src/app/services/notification.service';
import { ToastService } from 'src/app/services/toast.service';
import { WaitlistApiRestaurantService } from 'src/app/services/waitlist-api-restaurant.service';
import { WaitlistAuthService } from 'src/app/services/waitlist-auth.service';
import { RestaurantSearchService } from 'src/app/services/restaurant-search.service';
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

  smsStatus?: string;
  smsMessage?: string;
  smsError?: string;

  latestCustomerReply?: string;
  customerReplyDescription?: string;
  customerReplyReceivedAt?: string;
  customerReplySid?: string;

  latestVoiceReply?: string;
  callStatus?: string;
  callResponse?: string;
  voiceReplyReceivedAt?: string;
  voiceReplyDigits?: string;

  tableName?: string;
}

type GuestReplySource =
  | 'SMS'
  | 'VOICE';

interface GuestReplyView {
  source: GuestReplySource;
  text: string;
  option: CustomerReplyType;
  negative: boolean;
  receivedAt?: string;
}

type WaitlistTab =
  | 'WAITING'
  | 'NOTIFIED'
  | 'SEATED'
  | 'CANCELLED';

type CustomerReplyType =
  | '1'
  | '2'
  | '3'
  | '';

@Component({
  selector: 'app-waitlist-active-list',
  templateUrl: './waitlist-active-list.component.html',
  styleUrls: ['./waitlist-active-list.component.css']
})
export class WaitlistActiveListComponent
  implements OnInit, OnDestroy {

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

  get activeSeatedGuests(): SeatedGuest[] {
    return (this.seatedGuests || []).filter((guest: any) => guest?.status === 'SEATED' && this.matchesSearch(guest));
  }

  get completedGuests(): SeatedGuest[] {
    return (this.seatedGuests || []).filter((guest: any) => guest?.status === 'COMPLETED' && this.matchesSearch(guest));
  }

  /** Navbar search: filters by guest name or phone number. */
  private matchesSearch(guest: any): boolean {
    return this.search.matches(guest?.guestName, guest?.guestPhone);
  }

  activeTab: WaitlistTab = 'WAITING';

  showPendingBox = false;
  showGuestPopup = false;
  showRejectReason = false;

  selectedGuest: any = null;
  selectedWaitTime = 5;
  waitTimeOptions = [
    5,
    10,
    15,
    20,
    25,
    30
  ];

  rejectReason = '';

  isInitialLoading = false;
  isRefreshing = false;
  isLoading = false;
  isApproving = false;
  isRejecting = false;
  isNotifying = false;
  isSeating = false;

  notifyingGuestId: number | null = null;
  seatingGuestId: number | null = null;
  cancellingGuestId: number | null = null;

  tables: tableList[] = [];
  openTables: tableList[] = [];
  seatModalTables: tableList[] = [];
  selectedTable: tableList | null = null;
  seatTableAvailabilityMessage = '';

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

  private clockInterval: ReturnType<
    typeof setInterval
  > | null = null;

  private refreshInterval: Subscription | null = null;

  private readonly destroy$ = new Subject<void>();

  private dashboardRequestInFlight = false;

  private sub = new Subscription();

  recentChangedGuestId: number | null = null;

  showLeaveConfirm = false;
  isSending = false;
  isLeaving = false;

  shownotificationPopup = false;
  specificMessage = '';
  messageFormSubmitted = false;

  selectedContactGuestId:
    number | string | null = null;

  showCallingPopup = false;
  callingGuest: DashboardLiveGuest | null =
    null;

  isCallInProgress = false;

  showSmsPopup = false;

  selectedSmsGuest:
    DashboardLiveGuest | null = null;

  customSmsMessage = '';

  smsFormSubmitted = false;

  isSendingSms = false;

  callRequestStarted = false;

  private activeCallGuestId:
    number | null = null;

  private callPopupTimeout:
    ReturnType<typeof setTimeout> | null =
    null;

  private readonly callPopupTimeoutMs =
    90_000;

  replyRotationIndex = 0;

  private replyRotationInterval:
    ReturnType<typeof setInterval> | null =
    null;

  /*
   * Customer reply detection.
   */

  private previousCustomerReplies =
    new Map<number, string>();

  shakingGuestIds = new Set<number>();

  private customerReplyInitialLoadCompleted =
    false;

  private replyShakeTimeouts =
    new Map<
      number,
      ReturnType<typeof setTimeout>
    >();

  /*
   * Seated guest edit functionality.
   */

  showEditSeatedGuestModal = false;

  selectedSeatedGuest:
    DashboardLiveGuest | null = null;

  additionalGuestCount = 0;

  editSeatedAction:
    'RESEAT' | 'WAITING' = 'RESEAT';

  selectedEditTable: any = null;

  editWaitingMinutes: number | null = null;

  isUpdatingSeatedGuest = false;
  completingGuestId: number | null = null;
  restaurantName: string = '';

  showFullReplyPopup = false;

  selectedFullReply:
    GuestReplyView | null = null;

  selectedFullReplyGuest:
    DashboardLiveGuest | null = null;

  selectedFullReplyIndex = 0;

  showRestaurantMenu = false;

  private fullReplyRotationInterval:
    ReturnType<typeof setInterval> | null =
    null;

  servers: RestaurantFloorServer[] = [];
  nextUpServer: RestaurantFloorServer | null = null;
  selectedServerId: number | null = null;
  assignServerManually = false;
  isLoadingServers = false;

  constructor(
    private router: Router,
    public modalService:
      WaitlistRestaurantModalService,
    private waitlistApi:
      WaitlistApiRestaurantService,
    private notificationService:
      NotificationService,
    private auth: WaitlistAuthService,
    private toastService: ToastService,
    public search: RestaurantSearchService
  ) { }

  ngOnInit(): void {
    this.restaurantId =
      this.auth.getRestaurantId();

    this.restaurantName =
      this.auth.getRestaurantName();

    this.loadDashboardAllData(true);

    this.updateDateTime();

    this.clockInterval = setInterval(() => {
      this.updateDateTime();
    }, 1000);

    this.startDashboardPolling();

    this.replyRotationInterval = setInterval(() => { this.replyRotationIndex = this.replyRotationIndex === 0 ? 1 : 0; }, 4000);
    //this.loadFloorServers();
  }

  private startDashboardPolling(): void {
    this.refreshInterval = timer(5000, 5000)
      .pipe(
        exhaustMap(() => {
          if (this.dashboardRequestInFlight) {
            return of(null);
          }

          this.isRefreshing = true;

          return this.fetchDashboardData().pipe(
            finalize(() => {
              this.isRefreshing = false;
            })
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res) => {
          if (res) {
            this.applyDashboardData(res, false);
          }
        },
        error: () => {
          this.isRefreshing = false;
        }
      });
  }

  private fetchDashboardData(): Observable<any> {
    return forkJoin({
      dashboard:
        this.waitlistApi.getDashboardData(
          this.restaurantId
        ),

      pending:
        this.waitlistApi.getGuestsStatus(
          this.restaurantId,
          'PENDING',
          ''
        ),

      waiting:
        this.waitlistApi.getWaitingGuests(
          this.restaurantId,
          'WAITING',
          ''
        ),

      notified:
        this.waitlistApi.getNotifiedGuests(
          this.restaurantId,
          'NOTIFIED',
          ''
        ),

      seated:
        this.waitlistApi.getSeatedGuests(
          this.restaurantId,
          'SEATED',
          ''
        ),

      completed:
        this.waitlistApi.getSeatedGuests(
          this.restaurantId,
          'COMPLETED',
          ''
        ),

      cancelled:
        this.waitlistApi.getCancelledGuests(
          this.restaurantId,
          'CANCELLED',
          ''
        ),

      tables:
        this.waitlistApi
          .getRestaurantTableslist(
            this.restaurantId
          )
    });
  }

  private applyDashboardData(
    res: any,
    showLoader: boolean
  ): void {
    if (showLoader) {
      this.isInitialLoading = false;
    }

    if (res?.dashboard?.success) {
      this.dashboardData =
        res.dashboard.data;
    }

    this.pendingGuests =
      res.pending.data || [];

    this.waitingGuests =
      this.reconcileGuestList(
        this.waitingGuests,
        res.waiting.data || []
      );

    this.notifiedGuests =
      this.reconcileGuestList(
        this.notifiedGuests,
        res.notified.data || []
      );

    const seatedGuests =
      res.seated.data || [];

    const completedGuests =
      res.completed?.data || [];

    const mergedSeatedGuests =
      [...seatedGuests, ...completedGuests].filter((guest: any) =>
        guest?.status === 'SEATED' || guest?.status === 'COMPLETED'
      );

    this.seatedGuests =
      this.reconcileGuestList(
        this.seatedGuests,
        mergedSeatedGuests
      );

    this.cancelledGuests =
      this.reconcileGuestList(
        this.cancelledGuests,
        res.cancelled.data || []
      );

    this.tables =
      res.tables.data || [];

    this.openTables =
      this.tables.filter(
        table =>
          table.status === 'OPEN'
      );

    this.calculateTableStats();

    this.detectNewCustomerReplies(
      this.allDashboardGuests
    );

    this.handleActiveCallStatus();
  }

  private reconcileGuestList(
    currentGuests: any[] = [],
    incomingGuests: any[] = []
  ): any[] {
    const incomingById = new Map<number, any>();

    incomingGuests.forEach((guest: any) => {
      if (guest?.id) {
        incomingById.set(Number(guest.id), guest);
      }
    });

    const nextGuests = [...currentGuests];

    nextGuests.forEach((guest, index) => {
      const matchedGuest = incomingById.get(Number(guest.id));

      if (matchedGuest) {
        nextGuests[index] = {
          ...nextGuests[index],
          ...matchedGuest
        };
        incomingById.delete(Number(guest.id));
      }
    });

    incomingById.forEach((guest) => {
      nextGuests.push(guest);
    });

    return nextGuests.filter((guest) =>
      incomingGuests.some((incomingGuest) => Number(incomingGuest.id) === Number(guest.id))
    );
  }

  loadDashboardAllData(
    showLoader: boolean = true
  ): void {
    if (this.dashboardRequestInFlight) {
      return;
    }

    this.dashboardRequestInFlight = true;

    if (showLoader) {
      this.isInitialLoading = true;
    } else {
      this.isRefreshing = true;
    }

    this.fetchDashboardData()
      .pipe(
        finalize(() => {
          this.dashboardRequestInFlight = false;

          if (showLoader) {
            this.isInitialLoading = false;
          } else {
            this.isRefreshing = false;
          }
        })
      )
      .subscribe({
        next: (res) => {
          this.applyDashboardData(res, showLoader);
        },
        error: () => {
          if (showLoader) {
            this.isInitialLoading = false;
          } else {
            this.isRefreshing = false;
          }
        }
      });
  }

  get allDashboardGuests():
    DashboardLiveGuest[] {

    return [
      ...this.waitingGuests,
      ...this.notifiedGuests,
      ...this.seatedGuests,
      ...this.cancelledGuests
    ].map((guest: any) =>
      this.mapDashboardGuest(guest)
    );
  }

  get liveWaitlistGuests():
    DashboardLiveGuest[] {

    return [
      ...this.waitingGuests,
      ...this.notifiedGuests
    ].filter((guest: any) =>
      this.matchesSearch(guest)
    ).map((guest: any) =>
      this.mapDashboardGuest(guest)
    );
  }

  private mapDashboardGuest(
    guest: any
  ): DashboardLiveGuest {

    return {
      id: guest.id,
      guestName: guest.guestName,
      guestPhone: guest.guestPhone,
      partySize: guest.partySize,

      preference: guest.preference,
      notes: guest.notes,
      status: guest.status,
      position: guest.position,

      estimatedWaitTime:
        guest.estimatedWaitTime,

      joinedAt: guest.joinedAt,
      approvedAt: guest.approvedAt,
      notifiedAt: guest.notifiedAt,
      seatedAt: guest.seatedAt,
      cancelledAt: guest.cancelledAt,

      smsStatus: guest.smsStatus,
      smsMessage: guest.smsMessage,
      smsError: guest.smsError,

      latestCustomerReply:
        guest.latestCustomerReply,

      customerReplyDescription:
        guest.customerReplyDescription,

      customerReplyReceivedAt:
        guest.customerReplyReceivedAt,

      customerReplySid:
        guest.customerReplySid,

      latestVoiceReply:
        guest.latestVoiceReply,

      callStatus: guest.callStatus,
      callResponse: guest.callResponse,

      voiceReplyReceivedAt:
        guest.voiceReplyReceivedAt,

      voiceReplyDigits:
        guest.voiceReplyDigits,

      tableName: guest.tableName
    };
  }

  updateDateTime(): void {
    this.currentDateTime =
      new Date().toLocaleString(
        'en-IN',
        {
          timeZone: 'America/Toronto',
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }
      );
  }

  togglePendingBox(): void {
    this.showPendingBox =
      !this.showPendingBox;
  }

  openPendingGuest(
    guest: PendingGuest
  ): void {

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
    if (!this.selectedGuest) {
      return;
    }

    this.isApproving = true;

    this.waitlistApi
      .approveGuest(
        this.restaurantId,
        this.selectedGuest.id,
        {
          estimatedWaitTime:
            this.selectedWaitTime
        }
      )
      .subscribe({
        next: (res) => {
          const approvedGuest =
            res.data;

          this.pendingGuests =
            this.pendingGuests.filter(
              guest =>
                guest.id !==
                approvedGuest.id
            );

          this.activeTab = 'WAITING';

          this.markRowChanged(
            approvedGuest.id
          );

          this.isApproving = false;

          this.closeGuestPopup();
          this.loadDashboardAllData(false);
        },

        error: () => {
          this.isApproving = false;

          alert(
            'Unable to approve guest'
          );
        }
      });
  }

  showRejectBox(): void {
    this.showRejectReason = true;
  }

  removequeue(guest: PendingGuest) {
    this.selectedGuest = guest;
    this.rejectSelectedGuest()
  }

  rejectSelectedGuest(): void {
    if (!this.selectedGuest) {
      return;
    }

    this.isRejecting = true;

    this.waitlistApi
      .rejectGuest(
        this.restaurantId,
        this.selectedGuest.id
      )
      .subscribe({
        next: () => {
          this.pendingGuests =
            this.pendingGuests.filter(
              guest =>
                guest.id !==
                this.selectedGuest.id
            );

          this.isRejecting = false;

          this.closeGuestPopup();
          this.loadDashboardAllData(false);
        },

        error: () => {
          this.isRejecting = false;

          alert(
            'Unable to delete guest'
          );
        }
      });
  }

  notifyGuest(guest: any): void {
    if (!guest || this.notifyingGuestId === Number(guest.id)) {
      return;
    }

    const guestId = Number(guest.id);

    this.notifyingGuestId = guestId;
    this.isNotifying = true;

    this.waitlistApi
      .notifyToGuest(
        this.restaurantId,
        guest.id,
        {
          estimatedWaitTime:
            guest.estimatedWaitTime,

          position:
            guest.position
        }
      )
      .subscribe({
        next: (res) => {
          const notifiedGuest =
            res.data?.waitlist ??
            res.data;

          this.waitingGuests =
            this.waitingGuests.filter(
              item =>
                item.id !==
                guestId
            );

          if (notifiedGuest) {
            const existingGuest =
              this.notifiedGuests.find(
                item => item.id === guestId
              );

            const updatedGuest = {
              ...(existingGuest || {}),
              ...notifiedGuest,
              id: guestId,
              status: 'NOTIFIED'
            };

            this.notifiedGuests = [
              updatedGuest,
              ...this.notifiedGuests.filter(
                item => item.id !== guestId
              )
            ];
          }

          this.activeTab = 'NOTIFIED';

          this.markRowChanged(
            guestId
          );

          this.notifyingGuestId = null;
          this.isNotifying = false;

          this.loadDashboardAllData(false);
        },

        error: () => {
          this.notifyingGuestId = null;
          this.isNotifying = false;

          alert(
            'Unable to notify guest'
          );
        }
      });
  }

  openAvailableTableModal(
    guest: any
  ): void {

    this.selectedGuest = guest;
    this.selectedTable = null;
    this.seatTableAvailabilityMessage = '';

    const requiredSeats = Number(
      guest?.partySize || 0
    );

    this.seatModalTables =
      this.tables.filter(
        table =>
          table.status === 'OPEN' &&
          this.getTableCapacity(
            table
          ) >= requiredSeats
      );

    this.seatModalTables.sort(
      (a, b) =>
        this.getTableCapacity(a) -
        this.getTableCapacity(b)
    );

    if (
      this.seatModalTables.length === 0
    ) {
      this.seatTableAvailabilityMessage =
        'Table is not available, wait for some times.';
    }

    this.showTable = true;
    this.loadFloorServers();
  }

  closeAvailableTableModal(): void {
    this.showTable = false;
    this.selectedGuest = null;
    this.selectedTable = null;
    this.seatModalTables = [];
    this.seatTableAvailabilityMessage = '';
  }

  seatGuest(): void {
  // Prevent duplicate submissions immediately.
  if (this.isSeating) {
    return;
  }

  // Validate the selected guest and table.
  if (!this.selectedGuest || !this.selectedTable) {
    alert('Please select a guest and table');
    return;
  }

  if (
    this.getTableCapacity(
      this.selectedTable
    ) <
    Number(
      this.selectedGuest.partySize ||
      0
    )
  ) {
    alert(
      'Selected table does not have enough seats for this guest.'
    );
    return;
  }

  if (this.isLoadingServers) {
    alert('Please wait while the server list loads');
    return;
  }

  // Validate server assignment.
  if (this.assignServerManually) {
    const selectedServer = this.servers.find(
      server =>
        server.staffId === this.selectedServerId &&
        server.onFloor
    );

    if (!selectedServer) {
      alert('Please select an available server');
      return;
    }
  } else if (!this.nextUpServer) {
    alert('No next-up server is available');
    return;
  }

  // Capture the selected values before making requests.
  const restaurantId = this.restaurantId;
  const tableId = this.selectedTable.id;
  const tableName = this.selectedTable.tableNumber;
  const selectedGuestId = this.selectedGuest.id;

  // Lock the operation before making API calls.
  this.isSeating = true;
  this.isLoading = true;

  // Manual flow: assign server -> update table status -> seat selected guest
  // Automatic flow: seatNextParty already performs seating, so do not call seatedGuest again.
  const seatOperation$: Observable<any> =
    this.assignServerManually
      ? this.waitlistApi
          .assignServer(
            restaurantId,
            tableId,
            {
              serverId: this.selectedServerId!,
              sectionName: `S${tableId}`
            }
          )
          .pipe(
            switchMap(() =>
              this.waitlistApi.updateTableStatus(
                restaurantId,
                tableId,
                'OCCUPIED'
              )
            ),
            switchMap(() =>
              this.waitlistApi.seatedGuest(
                restaurantId,
                selectedGuestId,
                {
                  tableName
                }
              )
            )
          )
      : this.waitlistApi
          .seatNextParty(
            restaurantId,
            tableId
          )
          .pipe(
            switchMap(() =>
              this.waitlistApi.updateTableStatus(
                restaurantId,
                tableId,
                'OCCUPIED'
              )
            )
          );

  seatOperation$
    .subscribe({
      next: response => {
        const seatedId = this.assignServerManually
          ? (response?.data?.id || selectedGuestId)
          : selectedGuestId;

        this.notifiedGuests =
          this.notifiedGuests.filter(
            guest => guest.id !== seatedId
          );

        this.waitingGuests =
          this.waitingGuests.filter(
            guest => guest.id !== seatedId
          );

        this.activeTab = 'SEATED';

        this.markRowChanged(seatedId);

        this.closeAvailableTableModal();

        this.toastService.success('Guest seated');

        this.loadDashboardAllData(false);

        this.notificationService
          .triggerRestaurantRefresh();
      },

      error: error => {
        console.error(
          'Failed to assign server or seat guest:',
          error
        );

        alert(
          error?.error?.message ||
          'Unable to assign server or seat guest. Please try again.'
        );
        this.isLoading = false;
        this.isSeating = false;
      },

      complete: () => {
        this.isLoading = false;
        this.isSeating = false;
      }
    });
}

  openLeaveConfirm(
    guest: any
  ): void {

    this.selectedGuest = guest;
    this.showLeaveConfirm = true;
  }

  closeLeaveConfirm(): void {
    this.showLeaveConfirm = false;
  }

  confirmLeaveWaitlist(): void {
    if (!this.selectedGuest) {
      return;
    }

    this.isLeaving = true;
    this.isLoading = true;

    const guestId =
      this.selectedGuest.id;

    const guestStatus =
      this.selectedGuest.status;

    this.waitlistApi
      .deleteGuestFromWaitlist(
        this.restaurantId,
        guestId
      )
      .subscribe({
        next: () => {
          this.isLeaving = false;
          this.isLoading = false;

          if (guestStatus === 'WAITING') {
            this.waitingGuests =
              this.waitingGuests.filter(
                guest =>
                  guest.id !== guestId
              );
          }

          if (guestStatus === 'NOTIFIED') {
            this.notifiedGuests =
              this.notifiedGuests.filter(
                guest =>
                  guest.id !== guestId
              );
          }

          this.activeTab = 'CANCELLED';

          this.markRowChanged(guestId);

          this.closeLeaveConfirm();
          this.loadDashboardAllData(false);
        },

        error: () => {
          this.isLeaving = false;
          this.isLoading = false;

          alert(
            'Unable to remove guest from waitlist'
          );
        }
      });
  }

  calculateTableStats(): void {
    const total =
      this.tables.length;

    const open =
      this.tables.filter(
        table =>
          table.status === 'OPEN'
      ).length;

    const occupied =
      this.tables.filter(
        table =>
          table.status === 'OCCUPIED'
      ).length;

    const reserved =
      this.tables.filter(
        table =>
          table.status === 'RESERVED'
      ).length;

    const cleaning =
      this.tables.filter(
        table =>
          table.status === 'CLEANING'
      ).length;

    this.tableStats = {
      total,
      open,
      occupied,
      reserved,
      cleaning
    };

    if (total === 0) {
      this.donutStyle =
        '#e5e7eb 0 100%';

      return;
    }

    const openEnd =
      (open / total) * 100;

    const occupiedEnd =
      openEnd +
      (occupied / total) * 100;

    const reservedEnd =
      occupiedEnd +
      (reserved / total) * 100;

    const cleaningEnd =
      reservedEnd +
      (cleaning / total) * 100;

    this.donutStyle = `
      #22c55e 0 ${openEnd}%,
      #6d28d9 ${openEnd}% ${occupiedEnd}%,
      #f59e0b ${occupiedEnd}% ${reservedEnd}%,
      #94a3b8 ${reservedEnd}% ${cleaningEnd}%
    `;
  }

  getStatusLabel(
    status: string
  ): string {

    switch (status) {
      case 'PENDING':
        return 'Pending';

      case 'WAITING':
        return 'Waiting';

      case 'NOTIFIED':
        return 'Notified';

      case 'SEATED':
        return 'Seated';

      case 'COMPLETED':
        return 'Completed';

      case 'CANCELLED':
        return 'Cancelled';

      default:
        return status;
    }
  }

  getGuestInitials(
    name: string
  ): string {

    if (!name) {
      return 'G';
    }

    return name
      .split(' ')
      .filter(Boolean)
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  formatTime(
    date?: string
  ): string {

    if (!date) {
      return '-';
    }

    return new Date(
      date
    ).toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
    );
  }

  markRowChanged(
    id: number
  ): void {

    this.recentChangedGuestId = id;

    setTimeout(() => {
      this.recentChangedGuestId = null;
    }, 1200);
  }

  trackByGuest(
    _: number,
    guest: DashboardLiveGuest
  ): number {

    return guest.id;
  }

  tabletAccordionState: Record<string, boolean> = {};

  toggleTabletAccordion(
    sectionKey: string,
    guestId: number
  ): void {
    const accordionKey = `${sectionKey}-${guestId}`;
    this.tabletAccordionState[accordionKey] =
      !this.tabletAccordionState[accordionKey];
  }

  isTabletAccordionOpen(
    sectionKey: string,
    guestId: number
  ): boolean {
    return !!this.tabletAccordionState[`${sectionKey}-${guestId}`];
  }

  goToFloorMap(): void {
    this.router.navigate([
      '/restaurant/tables'
    ]);
  }

  logout(): void {
    localStorage.removeItem(
      'authToken'
    );

    this.router.navigate([
      '/login'
    ]);
  }

  get latestPendingGuest():
    PendingGuest | null {

    return this.pendingGuests.length
      ? this.pendingGuests[0]
      : null;
  }

  get currentTimeOnly(): string {
    return new Date().toLocaleTimeString(
      'en-IN',
      {
        timeZone: 'America/Toronto',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }
    );
  }

  get tableOpenPercentage(): number {
    if (!this.tableStats.total) {
      return 0;
    }

    return (
      this.tableStats.open /
      this.tableStats.total
    ) * 100;
  }

  getGuestSubText(
    guest: DashboardLiveGuest
  ): string {

    if (guest.notes) {
      return guest.notes;
    }

    if (
      guest.preference === 'PATIO' ||
      guest.preference === 'OUTDOOR'
    ) {
      return 'prefers outdoor seating';
    }

    return 'First time at Brothers Café';
  }

  getPreferenceLabel(
    preference?: string
  ): string {

    if (
      !preference ||
      preference === 'NO_PREFERENCE'
    ) {
      return 'No pref';
    }

    return preference
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(
        /\b\w/g,
        character =>
          character.toUpperCase()
      );
  }

  getPreferenceIcon(
    preference?: string
  ): string {

    if (preference === 'INDOOR') {
      return 'fa-regular fa-house';
    }

    if (
      preference === 'PATIO' ||
      preference === 'OUTDOOR'
    ) {
      return 'fa-regular fa-sun';
    }

    return 'fa-regular fa-building';
  }

  openNotificationPopup(
    guest: any
  ): void {

    this.selectedGuest = guest;
    this.shownotificationPopup = true;
  }

  closeNotificationPopup(): void {
    this.shownotificationPopup = false;
    this.selectedGuest = null;
  }

  get showMessageValidationError():
    boolean {

    return this.messageFormSubmitted;
  }

  openRemoveGuest(
    guest: DashboardLiveGuest
  ): void {

    this.selectedGuest = guest;
    this.showRejectReason = true;
    this.rejectReason = '';
    this.showGuestPopup = true;
  }

  toggleContactActions(
    guest: any,
    event: MouseEvent
  ): void {

    event.stopPropagation();

    if (
      this.selectedContactGuestId ===
      guest.id
    ) {
      this.selectedContactGuestId = null;
      return;
    }

    this.selectedContactGuestId =
      guest.id;
  }

  openCallingPopup(guest: DashboardLiveGuest): void {
    const guestId = Number(guest?.id);
    const phoneNumber = guest?.guestPhone;

    if (!guestId) {
      alert('Guest details are not available');
      return;
    }

    if (!phoneNumber) {
      alert('Guest phone number is not available');
      return;
    }

    this.clearCallPopupTimeout();
    this.selectedContactGuestId = null;

    this.callingGuest = {
      ...guest
    };

    this.activeCallGuestId = guestId;
    this.callRequestStarted = false;
    this.isCallInProgress = true;
    this.showCallingPopup = false;
    this.startCallRecord(guestId);

    this.waitlistApi
      .makecallToGuest(
        this.restaurantId,
        guestId,
        {
          message: this.specificMessage || ''
        }
      )
      .subscribe({
        next: () => {
          /*
           * The call request was accepted.
           *
           * The popup can be hidden by the manager,
           * but the call remains active in the background.
           */
          this.callRequestStarted = true;
          this.isCallInProgress = true;

          /*
           * Refresh immediately so we can detect
           * the customer's response.
           */
          this.loadDashboardAllData(false);

          /*
           * Safety timeout.
           */
          this.startCallPopupTimeout();
        },

        error: (error: any) => {
          this.clearCallPopupTimeout();

          this.showCallingPopup = false;
          this.isCallInProgress = false;
          this.callingGuest = null;
          this.activeCallGuestId = null;
          this.callRequestStarted = false;

          alert(
            error?.error?.message ||
            error?.message ||
            'Unable to make call'
          );
        }
      });
  }

  hideCallingPopup(): void {

    this.showCallingPopup = false;
  }

  showActiveCallingPopup(): void {
    if (!this.isCallInProgress || !this.callingGuest) {
      return;
    }

    this.showCallingPopup = true;
  }

  @HostListener('document:click')
  closeContactActions(): void {
    this.selectedContactGuestId = null;
    this.showRestaurantMenu = false;
  }

  closeCallingPopup(): void {
    if (this.activeCallGuestId) {
      this.markCallEnded(this.activeCallGuestId, false);
    }

    this.clearCallPopupTimeout();

    this.showCallingPopup = false;
    this.isCallInProgress = false;

    this.callingGuest = null;
    this.activeCallGuestId = null;
    this.callRequestStarted = false;
  }

  /* ===== Inline call status (shown as a pill in the guest row) ===== */

  callRecords: {
    [guestId: number]: {
      state: 'calling' | 'in-call' | 'answered' | 'ended';
      startedAt: number;
      endedAt?: number;
      noAnswer?: boolean;
    };
  } = {};

  private callAnswerTimers: { [guestId: number]: any } = {};
  private callTickTimer: any = null;

  private startCallRecord(guestId: number): void {
    this.callRecords[guestId] = {
      state: 'calling',
      startedAt: Date.now()
    };
    this.startCallTicker();
  }

  private markCallInProgress(guestId: number): void {
    const rec = this.callRecords[guestId];
    if (rec && rec.state === 'calling') {
      rec.state = 'in-call';
    }
  }

  private markCallAnswered(guestId: number): void {
    const rec = this.callRecords[guestId];
    if (!rec || rec.state === 'ended' || rec.state === 'answered') {
      return;
    }

    rec.state = 'answered';
    rec.endedAt = Date.now();

    /* Show the answered animation briefly, then settle to ended. */
    this.callAnswerTimers[guestId] = setTimeout(() => {
      const current = this.callRecords[guestId];
      if (current && current.state === 'answered') {
        current.state = 'ended';
      }
    }, 2600);
  }

  private markCallEnded(guestId: number, noAnswer: boolean): void {
    const rec = this.callRecords[guestId];
    if (!rec || rec.state === 'ended' || rec.state === 'answered') {
      return;
    }

    rec.state = 'ended';
    rec.endedAt = Date.now();
    rec.noAnswer = noAnswer;
  }

  private isConnectedCallStatus(status?: string): boolean {
    const normalized = String(status || '').trim().toUpperCase();
    return normalized.includes('IN_PROGRESS') || normalized.includes('CONNECTED');
  }

  /** Keeps the timer text moving once per second while a call is live. */
  private startCallTicker(): void {
    if (this.callTickTimer) {
      return;
    }

    this.callTickTimer = setInterval(() => {
      const live = Object.values(this.callRecords).some(
        rec => rec.state === 'calling' || rec.state === 'in-call'
      );

      if (!live) {
        clearInterval(this.callTickTimer);
        this.callTickTimer = null;
      }
    }, 1000);
  }

  private formatCallTime(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const mm = String(Math.floor(total / 60)).padStart(2, '0');
    const ss = String(total % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  /** The pill shown in place of the Notify / call button, or null. */
  getCallPill(guest: DashboardLiveGuest): { state: string; label: string } | null {
    const rec = this.callRecords[Number(guest?.id)];

    if (!rec) {
      return null;
    }

    if (guest.status !== 'WAITING' && guest.status !== 'NOTIFIED') {
      return null;
    }

    const now = Date.now();

    switch (rec.state) {
      case 'calling':
        return { state: 'calling', label: `Calling ${this.formatCallTime(now - rec.startedAt)}` };
      case 'in-call':
        return { state: 'in-call', label: `In call ${this.formatCallTime(now - rec.startedAt)}` };
      case 'answered':
        return { state: 'answered', label: 'Answered' };
      case 'ended':
        return {
          state: 'ended',
          label: rec.noAnswer
            ? 'No answer'
            : `Called ${this.formatCallTime((rec.endedAt || now) - rec.startedAt)}`
        };
    }
  }

  /** True while the pill is calling, in call or answered (hides Notify / call button). */
  isCallLive(guest: DashboardLiveGuest): boolean {
    const pill = this.getCallPill(guest);
    return !!pill && pill.state !== 'ended';
  }

  private handleActiveCallStatus(): void {
    if (
      !this.isCallInProgress ||
      !this.activeCallGuestId
    ) {
      return;
    }

    const updatedGuest =
      this.allDashboardGuests.find(
        guest =>
          Number(guest.id) ===
          Number(this.activeCallGuestId)
      );

    if (!updatedGuest) {
      return;
    }

    this.callingGuest = {
      ...updatedGuest
    };

    if (
      this.hasCompletedVoiceResponse(
        updatedGuest
      )
    ) {
      this.markCallAnswered(updatedGuest.id);
      this.closeCallingPopup();
      return;
    }

    if (
      this.isConnectedCallStatus(
        updatedGuest.callStatus
      )
    ) {
      this.markCallInProgress(updatedGuest.id);
    }

    if (
      this.isTerminalCallStatus(
        updatedGuest.callStatus
      )
    ) {
      this.markCallEnded(updatedGuest.id, true);
      this.closeCallingPopup();
    }
  }

  private hasCompletedVoiceResponse(
    guest: DashboardLiveGuest
  ): boolean {

    const status =
      String(
        guest.callStatus || ''
      )
        .trim()
        .toUpperCase();

    return (
      status ===
      'CALL_RESPONSE_RECEIVED' ||
      this.hasReplyValue(
        guest.voiceReplyDigits
      ) ||
      this.hasReplyValue(
        guest.latestVoiceReply
      ) ||
      this.hasReplyValue(
        guest.callResponse
      ) ||
      this.hasReplyValue(
        guest.voiceReplyReceivedAt
      )
    );
  }

  private isTerminalCallStatus(
    status?: string
  ): boolean {

    const normalizedStatus =
      String(status || '')
        .trim()
        .toUpperCase();

    const terminalStatuses = [
      'NO_ANSWER',
      'CALL_NO_ANSWER',
      'NO_RESPONSE',
      'CALL_NO_RESPONSE',

      'BUSY',
      'CALL_BUSY',

      'FAILED',
      'CALL_FAILED',

      'REJECTED',
      'CALL_REJECTED',

      'CANCELLED',
      'CALL_CANCELLED',

      'COMPLETED',
      'CALL_COMPLETED',

      'COMPLETED_WITHOUT_RESPONSE',
      'CALL_COMPLETED_WITHOUT_RESPONSE'
    ];

    return terminalStatuses.includes(
      normalizedStatus
    );
  }

  private startCallPopupTimeout(): void {
    this.clearCallPopupTimeout();

    this.callPopupTimeout = setTimeout(() => {

      this.loadDashboardAllData(false);

      this.closeCallingPopup();
    }, this.callPopupTimeoutMs);
  }

  private clearCallPopupTimeout(): void {
    if (this.callPopupTimeout) {
      clearTimeout(
        this.callPopupTimeout
      );

      this.callPopupTimeout = null;
    }
  }

  sendCustomSms(): void {

    this.smsFormSubmitted = true;

    if (
      this.isSendingSms ||
      !this.selectedSmsGuest
    ) {
      return;
    }

    const message =
      this.customSmsMessage.trim();

    if (!message) {
      return;
    }

    const guestId =
      Number(
        this.selectedSmsGuest.id
      );

    const phoneNumber =
      this.selectedSmsGuest
        .guestPhone;

    if (!guestId) {
      alert(
        'Guest details are not available'
      );

      return;
    }

    if (!phoneNumber) {
      alert(
        'Guest phone number is not available'
      );

      return;
    }

    this.isSendingSms = true;

    const payload = {
      phone: phoneNumber,
      message
    };

    this.waitlistApi
      .sendNoficationToGuest(
        this.restaurantId,
        guestId,
        payload
      )
      .subscribe({

        next: (response: any) => {

          this.isSendingSms = false;

          if (
            response?.success === false
          ) {
            alert(
              response?.message ||
              'Unable to send SMS'
            );

            return;
          }

          const successMessage =
            response?.message ||
            'SMS sent successfully';

          this.closeSmsPopup();

          alert(successMessage);

          this.loadDashboardAllData(false);
        },

        error: (error: any) => {

          this.isSendingSms = false;

          alert(
            error?.error?.message ||
            error?.message ||
            'Unable to send SMS. Please try again.'
          );
        }

      });
  }

  openRestoremethod(
    guest: any
  ): void {

    this.waitlistApi
      .rejoinGuestApi(
        this.restaurantId,
        guest.id
      )
      .subscribe({
        next: (response) => {
          alert(
            response?.message ||
            'Restore guest successfully'
          );

          this.loadDashboardAllData(false);
        },

        error: (error) => {
          alert(
            error?.error?.message ||
            error?.message ||
            'Unable to restore guest. Please try again.'
          );
        }
      });
  }

  /*
   * Customer reply functions.
   */

  /*
 * Customer reply functions.
 */

  hasCustomerReply(
    guest: DashboardLiveGuest | null
  ): boolean {

    if (!guest) {
      return false;
    }

    return (
      this.getGuestReplies(
        guest
      ).length > 0
    );
  }

  getGuestReplies(
    guest: DashboardLiveGuest | null
  ): GuestReplyView[] {

    if (!guest) {
      return [];
    }

    const replies:
      GuestReplyView[] = [];

    const smsReply =
      this.getSmsReplyView(
        guest
      );

    const voiceReply =
      this.getVoiceReplyView(
        guest
      );

    if (smsReply) {
      replies.push(smsReply);
    }

    if (voiceReply) {
      replies.push(voiceReply);
    }

    /*
     * Latest response should appear first.
     *
     * In your example the voice response is
     * newer than the SMS response, so voice
     * will display first.
     */
    return replies.sort(
      (
        firstReply,
        secondReply
      ) => {

        const firstTime =
          this.getReplyTimestamp(
            firstReply.receivedAt
          );

        const secondTime =
          this.getReplyTimestamp(
            secondReply.receivedAt
          );

        return secondTime - firstTime;
      }
    );
  }

  getVisibleReply(
    guest: DashboardLiveGuest | null
  ): GuestReplyView | null {

    const replies =
      this.getGuestReplies(
        guest
      );

    if (!replies.length) {
      return null;
    }

    if (replies.length === 1) {
      return replies[0];
    }

    const visibleIndex =
      this.replyRotationIndex %
      replies.length;

    return replies[visibleIndex];
  }

  getReplyViewClass(
    reply: GuestReplyView | null
  ): string {

    if (!reply) {
      return '';
    }

    if (reply.negative) {
      return 'reply-unavailable';
    }

    if (reply.option === '2') {
      return 'reply-delayed';
    }

    return 'reply-coming';
  }

  private getSmsReplyView(
    guest: DashboardLiveGuest
  ): GuestReplyView | null {

    const rawSmsReply =
      guest.latestCustomerReply ||
      guest.customerReplyDescription;

    if (
      !this.hasReplyValue(
        rawSmsReply
      )
    ) {
      return null;
    }

    const normalizedReply =
      this.normalizeCustomerReply(
        rawSmsReply
      );

    const option =
      this.convertSmsReplyToOption(
        normalizedReply
      );

    let text =
      String(
        guest.customerReplyDescription ||
        guest.latestCustomerReply ||
        ''
      ).trim();

    if (option === '1') {
      text = 'On my way';
    }

    if (option === '2') {
      text = 'Arriving in 5 minutes';
    }

    if (option === '3') {
      text = 'Unable to join';
    }

    if (!text) {
      return null;
    }

    return {
      source: 'SMS',
      text,
      option,
      negative:
        option === '3' ||
        this.isNegativeReplyText(text),

      receivedAt:
        guest.customerReplyReceivedAt
    };
  }

  private getVoiceReplyView(
    guest: DashboardLiveGuest
  ): GuestReplyView | null {

    const rawVoiceReply =
      guest.latestVoiceReply ||
      guest.callResponse ||
      guest.voiceReplyDigits;

    if (
      !this.hasReplyValue(
        rawVoiceReply
      )
    ) {
      return null;
    }

    const voiceDigit =
      this.normalizeCustomerReply(
        guest.voiceReplyDigits
      );

    let option:
      CustomerReplyType = '';

    let text =
      String(
        guest.latestVoiceReply ||
        guest.callResponse ||
        ''
      ).trim();

    /*
     * Your voice API currently uses:
     *
     * 1 = Confirmed attending
     * 2 = Cannot attend
     */
    if (
      voiceDigit === '1'
    ) {
      option = '1';

      if (!text) {
        text =
          'Confirmed attending';
      }
    }

    if (
      voiceDigit === '2'
    ) {
      option = '3';

      if (!text) {
        text = 'Cannot attend';
      }
    }

    /*
     * Also map textual responses.
     */
    const normalizedText =
      this.normalizeCustomerReply(
        text
      );

    if (
      normalizedText ===
      'confirmed attending' ||
      normalizedText ===
      'will attend' ||
      normalizedText ===
      'attending'
    ) {
      option = '1';
      text = 'Confirmed attending';
    }

    if (
      normalizedText ===
      'cannot attend' ||
      normalizedText ===
      'unable to attend' ||
      normalizedText ===
      'not attending'
    ) {
      option = '3';
      text = 'Cannot attend';
    }

    if (!text) {
      text = 'Call response received';
    }

    return {
      source: 'VOICE',
      text,
      option,
      negative:
        option === '3' ||
        this.isNegativeReplyText(text),

      receivedAt:
        guest.voiceReplyReceivedAt
    };
  }

  private hasReplyValue(
    value: unknown
  ): boolean {

    return (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ''
    );
  }

  private normalizeCustomerReply(
    value: unknown
  ): string {

    return String(value ?? '')
      .replace(/[️⃣️]/g, '')
      .trim()
      .toLowerCase();
  }

  private convertSmsReplyToOption(
    value: string
  ): CustomerReplyType {

    switch (value) {
      case '1':
      case 'on my way':
        return '1';

      case '2':
      case 'arriving in 5 minutes':
        return '2';

      case '3':
      case 'unable to join':
      case 'unable to make it':
      case 'cannot attend':
        return '3';

      default:
        return '';
    }
  }

  private isNegativeReplyText(
    text: string
  ): boolean {

    const normalizedText =
      String(text || '')
        .trim()
        .toLowerCase();

    const negativeTexts = [
      'cannot attend',
      'unable to attend',
      'unable to join',
      'unable to make it',
      'will not join',
      'not attending',
      'cancelled',
      'canceled',
      'declined'
    ];

    return negativeTexts.some(
      negativeText =>
        normalizedText.includes(
          negativeText
        )
    );
  }

  private getReplyTimestamp(
    receivedAt?: string
  ): number {

    if (!receivedAt) {
      return 0;
    }

    const timestamp =
      new Date(
        receivedAt
      ).getTime();

    return Number.isNaN(timestamp)
      ? 0
      : timestamp;
  }

  private getCustomerReplySignature(
    guest: DashboardLiveGuest
  ): string {

    const replies =
      this.getGuestReplies(
        guest
      );

    if (!replies.length) {
      return '';
    }

    return replies
      .map(reply =>
        [
          guest.id,
          reply.source,
          reply.text,
          reply.option,
          reply.receivedAt || ''
        ].join('|')
      )
      .join('::');
  }

  getCustomerReplyText(
    guest: DashboardLiveGuest | null
  ): string {

    const reply =
      this.getCustomerReplyValue(
        guest
      );

    switch (reply) {
      case '1':
        return 'On my way';

      case '2':
        return 'Arriving in 5 minutes';

      case '3':
        return 'Unable to join';

      default:
        return '';
    }
  }

  getCustomerReplyClass(
    guest: DashboardLiveGuest | null
  ): string {

    const reply =
      this.getCustomerReplyValue(
        guest
      );

    switch (reply) {
      case '1':
        return 'reply-coming';

      case '2':
        return 'reply-delayed';

      case '3':
        return 'reply-unavailable';

      default:
        return '';
    }
  }

  getCustomerReplyPreviewIcon(
    guest: DashboardLiveGuest | null
  ): string {

    const reply =
      this.getCustomerReplyValue(
        guest
      );

    switch (reply) {
      case '1':
        return 'fa-solid fa-car-side';

      case '2':
        return 'fa-solid fa-clock';

      case '3':
        return 'fa-solid fa-circle-xmark';

      default:
        return 'fa-solid fa-reply';
    }
  }

  private getCustomerReplyValue(
    guest: DashboardLiveGuest | null
  ): CustomerReplyType {

    if (!guest) {
      return '';
    }

    /*
     * These fields may contain the actual
     * customer response.
     */
    const replyCandidates: unknown[] = [
      guest.latestCustomerReply,
      guest.customerReplyDescription,
      guest.voiceReplyDigits,
      guest.latestVoiceReply
    ];

    for (
      const candidate
      of replyCandidates
    ) {
      const normalizedValue =
        this.normalizeCustomerReply(
          candidate
        );

      const replyType =
        this.convertReplyToOption(
          normalizedValue
        );

      if (replyType) {
        return replyType;
      }
    }

    /*
     * customerReplySid is normally an external
     * SMS identifier. Use it only when its
     * entire value is exactly 1, 2 or 3.
     */
    const replySid =
      this.normalizeCustomerReply(
        guest.customerReplySid
      );

    if (
      replySid === '1' ||
      replySid === '2' ||
      replySid === '3'
    ) {
      return replySid;
    }

    return '';
  }

  // private normalizeCustomerReply(
  //   value: unknown
  // ): string {

  //   return String(value ?? '')
  //     .replace(/[️⃣️]/g, '')
  //     .trim()
  //     .toLowerCase();
  // }

  private convertReplyToOption(
    value: string
  ): CustomerReplyType {

    switch (value) {
      case '1':
      case 'on my way':
        return '1';

      case '2':
      case 'arriving in 5 minutes':
        return '2';

      case '3':
      case 'unable to join':
        return '3';

      default:
        return '';
    }
  }

  // private getCustomerReplySignature(
  //   guest: DashboardLiveGuest
  // ): string {

  //   const replyValue =
  //     this.getCustomerReplyValue(
  //       guest
  //     );

  //   if (!replyValue) {
  //     return '';
  //   }

  //   return [
  //     guest.id,
  //     replyValue,
  //     guest.customerReplyReceivedAt ??
  //     ''
  //   ].join('|');
  // }

  private detectNewCustomerReplies(
    guests: DashboardLiveGuest[]
  ): void {

    guests.forEach(
      (
        guest:
          DashboardLiveGuest
      ) => {

        const currentSignature =
          this.getCustomerReplySignature(
            guest
          );

        const previousSignature =
          this.previousCustomerReplies.get(
            guest.id
          );

        /*
         * Initial page loading:
         * remember existing SMS and voice
         * responses without shaking the row.
         */
        if (
          !this
            .customerReplyInitialLoadCompleted
        ) {
          if (currentSignature) {
            this.previousCustomerReplies.set(
              guest.id,
              currentSignature
            );
          }

          return;
        }

        /*
         * Trigger animation when:
         *
         * 1. A new SMS response arrives.
         * 2. A voice response arrives.
         * 3. An existing reply changes.
         */
        if (
          currentSignature &&
          currentSignature !==
          previousSignature
        ) {
          this.previousCustomerReplies.set(
            guest.id,
            currentSignature
          );

          this.triggerGuestReplyAnimation(
            guest.id
          );
        }
      }
    );

    this.customerReplyInitialLoadCompleted =
      true;
  }

  private triggerGuestReplyAnimation(
    guestId: number
  ): void {

    const existingTimeout =
      this.replyShakeTimeouts.get(
        guestId
      );

    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    /*
     * Remove and add the ID again so a second
     * customer reply can restart the animation.
     */
    this.shakingGuestIds.delete(
      guestId
    );

    setTimeout(() => {
      this.shakingGuestIds.add(
        guestId
      );
    });

    const timeout =
      setTimeout(() => {
        this.shakingGuestIds.delete(
          guestId
        );

        this.replyShakeTimeouts.delete(
          guestId
        );
      }, 1400);

    this.replyShakeTimeouts.set(
      guestId,
      timeout
    );
  }

  /*
   * Seated guest edit functions.
   */

  get currentSeatedPartySize():
    number {

    return Number(
      this.selectedSeatedGuest
        ?.partySize || 0
    );
  }

  get requiredPartyCapacity():
    number {

    return (
      this.currentSeatedPartySize +
      Number(
        this.additionalGuestCount ||
        0
      )
    );
  }

  private getTableCapacity(
    table: any
  ): number {
    const capacity = Number(
      table?.capacity
    );

    return Number.isFinite(
      capacity
    )
      ? capacity
      : 0;
  }

  get suitableOpenTables():
    any[] {

    return this.tables
      .filter(
        (table: any) =>
          table?.status === 'OPEN' &&
          this.getTableCapacity(
            table
          ) >=
          this.requiredPartyCapacity
      )
      .sort(
        (a: any, b: any) =>
          this.getTableCapacity(a) -
          this.getTableCapacity(b)
      );
  }

  get currentSeatedTable():
    any | null {

    const tableName =
      this.selectedSeatedGuest
        ?.tableName;

    if (!tableName) {
      return null;
    }

    return (
      this.tables.find(
        (table: any) =>
          table.tableNumber ===
          tableName
      ) || null
    );
  }

  get hasSuitableOpenTable():
    boolean {

    return (
      this.suitableOpenTables.length >
      0
    );
  }

  completeSeatedGuest(
    guest: DashboardLiveGuest | SeatedGuest
  ): void {
    if (!guest?.id) {
      return;
    }

    const guestName =
      guest.guestName || 'Guest';

    this.completingGuestId = guest.id;

    this.waitlistApi
      .completeGuest(
        this.restaurantId,
        guest.id
      )
      .subscribe({
        next: () => {
          this.completingGuestId = null;
          this.loadDashboardAllData(false);
          this.notificationService.triggerRestaurantRefresh();
          alert(`${guestName} marked as completed`);
        },
        error: (error: any) => {
          this.completingGuestId = null;
          alert(
            error?.error?.message ||
            'Unable to complete the guest'
          );
        }
      });
  }

  openEditSeatedGuestModal(
    guest: DashboardLiveGuest
  ): void {

    this.selectedSeatedGuest =
      guest;

    this.additionalGuestCount = 0;
    this.editWaitingMinutes = null;
    this.selectedEditTable = null;
    this.editSeatedAction = 'RESEAT';

    this.openTables =
      this.tables.filter(
        table =>
          table.status === 'OPEN'
      );

    this.showEditSeatedGuestModal =
      true;
  }

  closeEditSeatedGuestModal(): void {
    if (this.isUpdatingSeatedGuest) {
      return;
    }

    this.showEditSeatedGuestModal =
      false;

    this.selectedSeatedGuest = null;
    this.selectedEditTable = null;
    this.additionalGuestCount = 0;
    this.editWaitingMinutes = null;
    this.editSeatedAction = 'RESEAT';
  }

  decreaseAdditionalGuests(): void {
    if (
      this.additionalGuestCount > 0
    ) {
      this.additionalGuestCount--;

      this.checkSelectedEditTableCapacity();
      this.ensureValidEditActionForCapacity();
    }
  }

  increaseAdditionalGuests(): void {
    this.additionalGuestCount++;

    this.checkSelectedEditTableCapacity();
    this.ensureValidEditActionForCapacity();
  }

  onAdditionalGuestCountChange(): void {
    if (
      this.additionalGuestCount ===
      null ||
      this.additionalGuestCount < 0
    ) {
      this.additionalGuestCount = 0;
    }

    this.checkSelectedEditTableCapacity();
    this.ensureValidEditActionForCapacity();
  }

  private ensureValidEditActionForCapacity():
    void {

    if (
      this.editSeatedAction !==
      'RESEAT'
    ) {
      return;
    }

    if (
      this.suitableOpenTables.length ===
      0
    ) {
      this.selectedEditTable = null;
      this.editSeatedAction =
        'WAITING';
    }
  }

  private checkSelectedEditTableCapacity():
    void {

    if (
      this.selectedEditTable &&
      Number(
        this.selectedEditTable.capacity
      ) <
      this.requiredPartyCapacity
    ) {
      this.selectedEditTable = null;
    }
  }

  submitSeatedGuestEdit(): void {
    if (!this.selectedSeatedGuest) {
      return;
    }

    if (
      this.additionalGuestCount <= 0
    ) {
      alert(
        'Please enter the number of additional guests'
      );

      return;
    }

    if (
      this.editSeatedAction ===
      'RESEAT'
    ) {
      if (
        this.suitableOpenTables.length ===
        0
      ) {
        this.selectedEditTable = null;
        this.editSeatedAction =
          'WAITING';

        alert(
          'No open table has enough seats. Move the guest to waiting and set an estimated wait time.'
        );

        return;
      }

      this.reseatGuestAtLargerTable();
      return;
    }

    this.moveSeatedGuestBackToWaiting();
  }

  private reseatGuestAtLargerTable():
    void {

    if (
      !this.selectedSeatedGuest ||
      !this.selectedEditTable
    ) {
      alert(
        'Please select an available table'
      );

      return;
    }

    if (
      Number(
        this.selectedEditTable.capacity
      ) <
      this.requiredPartyCapacity
    ) {
      alert(
        'The selected table does not have enough seats'
      );

      return;
    }

    const isSelectedTableSuitable =
      this.suitableOpenTables.some(
        (table: any) =>
          table.id ===
          this.selectedEditTable.id
      );

    if (!isSelectedTableSuitable) {
      alert(
        'Please select a table with enough seats for this party size'
      );

      return;
    }

    const guestName =
      this.selectedSeatedGuest
        .guestName;

    const oldTable =
      this.currentSeatedTable;

    this.isUpdatingSeatedGuest =
      true;

    this.isLoading = true;

    this.waitlistApi
      .updateSeatedGuest(
        this.restaurantId,
        this.selectedSeatedGuest.id,
        {
          partySize: this.requiredPartyCapacity,
          tableName:
            this.selectedEditTable
              .tableNumber
        }
      )
      .pipe(
        switchMap(() =>
          this.waitlistApi
            .updateTableStatus(
              this.restaurantId,
              this.selectedEditTable.id,
              'OCCUPIED'
            )
        ),
        switchMap(() => {
          if (
            !oldTable ||
            oldTable.id ===
            this.selectedEditTable.id
          ) {
            return of(null);
          }

          return this.waitlistApi
            .updateTableStatus(
              this.restaurantId,
              oldTable.id,
              'OPEN'
            );
        })
      )
      .subscribe({
      next: () => {
        this.isUpdatingSeatedGuest =
          false;

        this.isLoading = false;

        this.closeEditSeatedGuestModal();
        this.loadDashboardAllData(false);

        this.notificationService
          .triggerRestaurantRefresh();

        alert(
          `${guestName} moved successfully`
        );
      },

      error: (error: any) => {
        this.isUpdatingSeatedGuest =
          false;

        this.isLoading = false;

        alert(
          error?.error?.message ||
          'Unable to update the seated guest'
        );
      }
      });
  }

  private moveSeatedGuestBackToWaiting():
    void {

    if (!this.selectedSeatedGuest) {
      return;
    }

    if (
      !this.editWaitingMinutes ||
      this.editWaitingMinutes <= 0
    ) {
      alert(
        'Please enter the estimated waiting time'
      );

      return;
    }

    const guestName =
      this.selectedSeatedGuest
        .guestName;

    const oldTable =
      this.currentSeatedTable;

    this.isUpdatingSeatedGuest =
      true;

    this.isLoading = true;

    this.waitlistApi
      .moveSeatedGuestToWaiting(
        this.restaurantId,
        this.selectedSeatedGuest.id,
        {
          status: 'WAITING',
          partySize:
            this.requiredPartyCapacity,

          estimatedWaitTime:
            Number(
              this.editWaitingMinutes
            )
        }
      )
      .pipe(
        switchMap(() => {
          if (!oldTable) {
            return of(null);
          }

          return this.waitlistApi
            .updateTableStatus(
              this.restaurantId,
              oldTable.id,
              'OPEN'
            );
        })
      )
      .subscribe({
      next: () => {
        this.isUpdatingSeatedGuest =
          false;

        this.isLoading = false;

        this.closeEditSeatedGuestModal();

        this.activeTab = 'WAITING';

        this.loadDashboardAllData(false);

        this.notificationService
          .triggerRestaurantRefresh();

        alert(
          `${guestName} moved back to the waiting list`
        );
      },

      error: (error: any) => {
        this.isUpdatingSeatedGuest =
          false;

        this.isLoading = false;

        alert(
          error?.error?.message ||
          'Unable to move the guest to waiting'
        );
      }
      });
  }

  openFullReplyPopup(
    guest: DashboardLiveGuest,
    reply: GuestReplyView,
    event?: MouseEvent
  ): void {

    event?.stopPropagation();

    this.stopFullReplyRotation();

    this.selectedFullReplyGuest = {
      ...guest
    };

    const replies =
      this.getGuestReplies(
        this.selectedFullReplyGuest
      );

    /*
     * Open the popup using the reply that
     * the user clicked.
     */
    const clickedReplyIndex =
      replies.findIndex(
        item =>
          item.source === reply.source &&
          item.text === reply.text
      );

    this.selectedFullReplyIndex =
      clickedReplyIndex >= 0
        ? clickedReplyIndex
        : 0;

    this.updateSelectedFullReply();

    this.showFullReplyPopup = true;

    /*
     * Rotate only when both SMS and voice
     * responses are available.
     */
    if (replies.length > 1) {
      this.startFullReplyRotation();
    }
  }

  closeFullReplyPopup(): void {
    this.stopFullReplyRotation();

    this.showFullReplyPopup = false;

    this.selectedFullReply = null;
    this.selectedFullReplyGuest = null;

    this.selectedFullReplyIndex = 0;
  }

  private startFullReplyRotation(): void {
    this.stopFullReplyRotation();

    this.fullReplyRotationInterval =
      setInterval(() => {
        this.showNextFullReply();
      }, 4000);
  }

  private stopFullReplyRotation(): void {
    if (
      this.fullReplyRotationInterval
    ) {
      clearInterval(
        this.fullReplyRotationInterval
      );

      this.fullReplyRotationInterval =
        null;
    }
  }

  updateSelectedFullReply(): void {
    if (!this.selectedFullReplyGuest) {
      this.selectedFullReply = null;
      return;
    }

    const replies =
      this.getGuestReplies(
        this.selectedFullReplyGuest
      );

    if (!replies.length) {
      this.selectedFullReply = null;
      return;
    }

    this.selectedFullReplyIndex =
      this.selectedFullReplyIndex %
      replies.length;

    this.selectedFullReply = {
      ...replies[
      this.selectedFullReplyIndex
      ]
    };
  }

  showNextFullReply(): void {
    if (!this.selectedFullReplyGuest) {
      return;
    }

    const replies =
      this.getGuestReplies(
        this.selectedFullReplyGuest
      );

    if (replies.length <= 1) {
      return;
    }

    this.selectedFullReplyIndex =
      (
        this.selectedFullReplyIndex + 1
      ) % replies.length;

    this.updateSelectedFullReply();
  }

  showPreviousFullReply(): void {
    if (!this.selectedFullReplyGuest) {
      return;
    }

    const replies =
      this.getGuestReplies(
        this.selectedFullReplyGuest
      );

    if (replies.length <= 1) {
      return;
    }

    this.selectedFullReplyIndex =
      (
        this.selectedFullReplyIndex -
        1 +
        replies.length
      ) % replies.length;

    this.updateSelectedFullReply();
  }

  getSelectedReplyPosition(): string {
    if (!this.selectedFullReplyGuest) {
      return '';
    }

    const replies =
      this.getGuestReplies(
        this.selectedFullReplyGuest
      );

    if (replies.length <= 1) {
      return '';
    }

    return `${this.selectedFullReplyIndex + 1
      } of ${replies.length}`;
  }

  hasMultipleSelectedReplies(): boolean {
    if (!this.selectedFullReplyGuest) {
      return false;
    }

    return (
      this.getGuestReplies(
        this.selectedFullReplyGuest
      ).length > 1
    );
  }

  getFullReplyIcon(
    reply: GuestReplyView | null
  ): string {

    if (!reply) {
      return 'fa-solid fa-message';
    }

    return reply.source === 'VOICE'
      ? 'fa-solid fa-phone-volume'
      : 'fa-solid fa-comment-sms';
  }

  formatReplyDateTime(
    date?: string
  ): string {

    if (!date) {
      return '-';
    }

    return new Date(date)
      .toLocaleString(
        'en-IN',
        {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }
      );
  }

  toggleRestaurantMenu(
    event: MouseEvent
  ): void {

    event.stopPropagation();

    this.showRestaurantMenu =
      !this.showRestaurantMenu;
  }



  logoutFromMenu(
    event: MouseEvent
  ): void {

    event.stopPropagation();

    this.logout();
  }

  openSmsPopup(
    guest: DashboardLiveGuest,
    event?: MouseEvent
  ): void {

    event?.stopPropagation();

    const guestId =
      Number(guest?.id);

    const phoneNumber =
      guest?.guestPhone;

    if (!guestId) {
      alert(
        'Guest details are not available'
      );

      return;
    }

    if (!phoneNumber) {
      alert(
        'Guest phone number is not available'
      );

      return;
    }

    this.selectedContactGuestId = null;

    this.selectedSmsGuest = {
      ...guest
    };

    this.customSmsMessage =
      `Hello ${guest.guestName || 'Guest'}, your table is ready. Please reply to confirm your arrival.`;

    this.smsFormSubmitted = false;
    this.showSmsPopup = true;
  }

  closeSmsPopup(): void {

    if (this.isSendingSms) {
      return;
    }

    this.showSmsPopup = false;
    this.selectedSmsGuest = null;
    this.customSmsMessage = '';
    this.smsFormSubmitted = false;
  }

  selectQuickSmsMessage(
    messageType:
      | 'TABLE_READY'
      | 'WAIT_5_MINUTES'
      | 'PLEASE_CONFIRM'
  ): void {

    const guestName =
      this.selectedSmsGuest
        ?.guestName ||
      'Guest';

    switch (messageType) {

      case 'TABLE_READY':
        this.customSmsMessage =
          `Hello ${guestName}, your table is ready. Please come to the restaurant entrance.`;

        break;

      case 'WAIT_5_MINUTES':
        this.customSmsMessage =
          `Hello ${guestName}, please wait for another 5 minutes. We will notify you once your table is ready.`;

        break;

      case 'PLEASE_CONFIRM':
        this.customSmsMessage =
          `Hello ${guestName}, please reply to confirm whether you are still joining us today.`;

        break;
    }

    this.smsFormSubmitted = false;
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.sub.unsubscribe();

    if (this.clockInterval) {
      clearInterval(
        this.clockInterval
      );
    }

    if (this.refreshInterval) {
      this.refreshInterval.unsubscribe();
      this.refreshInterval = null;
    }

    if (this.replyRotationInterval) {
      clearInterval(
        this.replyRotationInterval
      );

      this.replyRotationInterval = null;
    }

    if (this.fullReplyRotationInterval) {
      clearInterval(
        this.fullReplyRotationInterval
      );

      this.fullReplyRotationInterval = null;
    }

    this.clearCallPopupTimeout();

    this.replyShakeTimeouts.forEach(
      timeout =>
        clearTimeout(timeout)
    );

    this.replyShakeTimeouts.clear();
  }

  loadFloorServers(): void {
    this.isLoadingServers = true;
    this.servers = [];
    this.nextUpServer = null;
    this.selectedServerId = null;

    this.waitlistApi.getFloorServers(this.restaurantId).subscribe({
      next: response => {
        this.servers = response?.data?.servers ?? [];
        this.nextUpServer = this.servers.find(server => server.nextUp) ?? null;
        this.isLoadingServers = false;
      },
      error: error => {
        console.error('Failed to load floor servers:', error);
        this.isLoadingServers = false;
        this.servers = [];
        this.nextUpServer = null;
      }
    });
  }

  onManualAssignmentToggle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.assignServerManually = input.checked;
    this.selectedServerId = null;
  }

  get isSeatButtonDisabled(): boolean {
    if (!this.selectedTable || this.isSeating || this.isLoadingServers) {
      return true;
    }

    if (this.assignServerManually) {
      return !this.selectedServerId ||
        !this.servers.some(
          server => server.staffId === this.selectedServerId && server.onFloor
        );
    }

    return !this.nextUpServer;
  }

}