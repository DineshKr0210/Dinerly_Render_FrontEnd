import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { Restaurant } from 'src/app/models/waitlist-api-guest-to-restaurant.model';
import { WaitlistApiRestaurantService } from 'src/app/services/waitlist-api-restaurant.service';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-waitlist-waiting-screen',
  templateUrl: './waitlist-waiting-screen.component.html',
  styleUrls: ['./waitlist-waiting-screen.component.css']
})
export class WaitlistWaitingScreenComponent implements OnInit {

  @Input() guest: any;
  restaurantId = 1;
  @Output() leaveSuccess = new EventEmitter<any>();
  pendingSeconds = 120;
  timerText = '';
  waitingTimerText = '';
  private pendingTimerSub?: Subscription;
  private waitingTimerSub?: Subscription;
  private pollingSub?: Subscription;
  showLeaveConfirm = false;
  isLeaving = false;
  isDarkMode = false;
  isSending = false;

  showMessageConfirm = false;

  selectedArrivalTime = '';
  specificMessage = '';
  messageFormSubmitted = false;

  arrivalTimeOptions = [
    {
      label: 'Immediately',
      value: 'IMMEDIATELY'
    },
    {
      label: '5–10 minutes',
      value: '5_10_MINUTES'
    },
    {
      label: '10–20 minutes',
      value: '10_20_MINUTES'
    },
    {
      label: '20–30 minutes',
      value: '20_30_MINUTES'
    },
    {
      label: "I'll not join",
      value: 'WILL_NOT_JOIN'
    }
  ];
  // Review rating
  stars: number[] = [1, 2, 3, 4, 5];

  rating = 0;
  comments = '';

  // Review categories
  mealOptions: string[] = [
    'Breakfast',
    'Brunch',
    'Lunch',
    'Dinner',
    'Other'
  ];

  spendingOptions: string[] = [
    '$1–10',
    '$10–20',
    '$20–30',
    '$30–40',
    '$40–50',
    '$50–60',
    '$60–70',
    '$70+'
  ];

  reviewWaitOptions: string[] = [
    'No wait',
    'Up to 10 min',
    '10–30 min',
    '30–60 min',
    '1+ hour'
  ];

  noiseOptions: string[] = [
    'Quiet',
    'Moderate',
    'Very loud'
  ];

  // Selected options
  selectedMeal = '';
  selectedSpending = '';
  selectedReviewWait = '';
  selectedNoise = '';

  // Submission state
  isSubmittingFeedback = false;
  feedbackSubmitted = false;
  feedbackError = '';
  restaurant?: Restaurant;

  constructor(private waitlistApi: WaitlistApiRestaurantService, private router: Router, private themeService: ThemeService) { }

  ngOnInit(): void {
    const guestData = localStorage.getItem('waitlistGuest');
    const storedRestaurantId = localStorage.getItem('waitlistRestaurantId');

    if (!guestData) {
      this.router.navigate(['/user']);
      return;
    }

    try {
      this.guest = JSON.parse(guestData);
    } catch {
      localStorage.removeItem('waitlistGuest');
      this.router.navigate(['/user']);
      return;
    }

    this.restaurantId = Number(storedRestaurantId) || 1;

    this.isDarkMode = this.themeService.isDark;

    // Restore whether this guest already submitted feedback.
    this.restoreFeedbackState();

    // Start the timer according to the current guest status.
    this.handleStatusTimer();

    this.loadRestaurantDetails();

    // Keep polling for WAITING guests so status changes are detected.
    // Do not poll completed statuses.
    if (
      this.guest?.status === 'SEATED' ||
      this.guest?.status === 'COMPLETED' ||
      this.guest?.status === 'CANCELLED'
    ) {
      this.stopStatusPolling();
      return;
    }

    if (
      this.guest?.status === 'NOTIFIED' &&
      this.confirmationSent
    ) {
      this.stopStatusPolling();
      return;
    }

    this.loadStatusOnce();
    this.startStatusPolling();
  }

  loadRestaurantDetails(): void {
    this.waitlistApi.getRestaurantDetails().subscribe({
      next: (res) => {
        if (res?.success && res?.data?.length) {
          this.restaurant = res.data.find(item => item.id === this.restaurantId) || res.data[0];
        }
      },
      error: () => {
        console.log('Unable to load restaurant details');
      }
    });
  }

  restoreFromStorage(): void {

    const storedGuest = localStorage.getItem('waitlistGuest');
    const storedRestaurantId = localStorage.getItem('waitlistRestaurantId');
    if (!this.guest && storedGuest) {
      this.guest = JSON.parse(storedGuest);
    }
  }

  get activeStepIndex(): number {
    switch (this.guest?.status) {
      case 'PENDING':
        return 0;
      case 'WAITING':
        return 1;
      case 'NOTIFIED':
        return 2;
      case 'SEATED':
      case 'COMPLETED':
        return 3;
      default:
        return 0;
    }
  }

  startStatusPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = undefined;

    // Do not restart polling when confirmation was already sent
    // and the current status is NOTIFIED.
    if (
      this.guest?.status === 'NOTIFIED' &&
      this.confirmationSent
    ) {
      return;
    }

    // Polling is not required for completed statuses.
    if (
      this.guest?.status === 'SEATED' ||
      this.guest?.status === 'COMPLETED' ||
      this.guest?.status === 'CANCELLED'
    ) {
      return;
    }

    this.pollingSub = interval(5000).subscribe(() => {
      if (
        this.guest?.status === 'NOTIFIED' &&
        this.confirmationSent
      ) {
        this.stopStatusPolling();
        return;
      }

      if (
        this.guest?.status === 'SEATED' ||
        this.guest?.status === 'COMPLETED' ||
        this.guest?.status === 'CANCELLED'
      ) {
        this.stopStatusPolling();
        return;
      }

      this.loadStatusOnce();
    });
  }

  loadStatusOnce(): void {
    if (!this.guest) {
      return;
    }

    const payload = {
      restaurantId: this.restaurantId,
      phone: this.guest.guestPhone || this.guest.phone
    };

    this.waitlistApi.getWaitlistStatus(payload).subscribe({
      next: (res) => {
        if (!res?.success || !res?.data) {
          return;
        }

        const oldStatus = this.guest?.status;
        const newGuest = res.data;

        this.guest = newGuest;

        localStorage.setItem(
          'waitlistGuest',
          JSON.stringify(this.guest)
        );

        // Restore feedback state for this specific waitlist entry.
        this.restoreFeedbackState();

        // Start or stop timers only when status changes.
        if (oldStatus !== newGuest.status) {
          this.handleStatusTimer();
        }

        if (newGuest.status === 'NOTIFIED') {
          this.openConfirmationModalAutomatically();
        }

        // Stop polling once the guest is seated, completed, or cancelled.
        if (
          newGuest.status === 'SEATED' ||
          newGuest.status === 'COMPLETED' ||
          newGuest.status === 'CANCELLED'
        ) {
          this.stopStatusPolling();
        }
      },
      error: () => {
        console.error('Unable to load guest status');
      }
    });
  }
  handleStatusTimer(): void {
    if (this.guest?.status === 'PENDING') {
      this.waitingTimerSub?.unsubscribe();
      this.waitingTimerSub = undefined;
      this.waitingTimerText = '';
      return;
    }

    if (this.guest?.status === 'WAITING') {
      this.pendingTimerSub?.unsubscribe();
      this.pendingTimerSub = undefined;

      this.removePendingTimerStorage();
      this.startWaitingCountdown();
      return;
    }

    if (
      this.guest?.status === 'NOTIFIED' ||
      this.guest?.status === 'SEATED' ||
      this.guest?.status === 'COMPLETED' ||
      this.guest?.status === 'CANCELLED'
    ) {
      this.pendingTimerSub?.unsubscribe();
      this.waitingTimerSub?.unsubscribe();

      this.pendingTimerSub = undefined;
      this.waitingTimerSub = undefined;

      this.removePendingTimerStorage();
      this.removeWaitingTimerStorage();

      if (this.guest?.status === 'CANCELLED') {
        this.showMessageConfirm = false;
      }

      this.stopStatusPolling();
    }
  }

  private removePendingTimerStorage(): void {
    const guestKey = this.getGuestKey();
    if (!guestKey) return;
    localStorage.removeItem(`pendingStart_${guestKey}`);
  }


  private getGuestKey(): string {
    return this.guest?.guestPhone || this.guest?.phone;
  }

  startWaitingCountdown(): void {
    this.waitingTimerSub?.unsubscribe();
    this.waitingTimerSub = undefined;

    if (this.guest?.status !== 'WAITING') {
      return;
    }

    const guestKey = this.guest?.id ?? this.getGuestKey();

    if (guestKey === null || guestKey === undefined || guestKey === '') {
      this.waitingTimerText = '0:00';
      return;
    }

    const estimatedMinutes = Math.max(
      0,
      Number(this.guest?.estimatedWaitTime) || 0
    );

    const deadlineKey = `waitingDeadline_${guestKey}`;

    let deadline = Number(localStorage.getItem(deadlineKey));

    // Create the deadline only once for this waitlist entry.
    if (!Number.isFinite(deadline) || deadline <= 0) {
      deadline = Date.now() + estimatedMinutes * 60 * 1000;

      localStorage.setItem(deadlineKey, String(deadline));
    }

    const updateTimer = (): void => {
      const remainingSeconds = Math.max(
        0,
        Math.ceil((deadline - Date.now()) / 1000)
      );

      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;

      this.waitingTimerText =
        `${minutes}:${seconds.toString().padStart(2, '0')}`;

      if (remainingSeconds <= 0) {
        this.waitingTimerSub?.unsubscribe();
        this.waitingTimerSub = undefined;
      }
    };

    updateTimer();

    if (deadline > Date.now()) {
      this.waitingTimerSub = interval(1000).subscribe(() => {
        updateTimer();
      });
    }
  }

  private removeWaitingTimerStorage(): void {
    const guestKey = this.guest?.id ?? this.getGuestKey();

    if (guestKey === null || guestKey === undefined || guestKey === '') {
      return;
    }

    localStorage.removeItem(`waitingDeadline_${guestKey}`);

    // Remove the previous timer key if it exists.
    localStorage.removeItem(`waitingStart_${guestKey}`);
  }


  openLeaveConfirm(): void {
    this.showLeaveConfirm = true;
  }

  closeLeaveConfirm(): void {
    this.showLeaveConfirm = false;
  }


  // cancel waiting guest from waitlist
  confirmLeaveWaitlist(): void {
    const waitlistId = this.guest?.id;

    if (!this.restaurantId || !waitlistId) {
      alert('Waitlist details missing');
      return;
    }
    this.isLeaving = true;

    this.waitlistApi.leaveWaitlistTable(this.restaurantId, waitlistId).subscribe({
      next: (res: any) => {
        this.isLeaving = false;
        this.showLeaveConfirm = false;

        const guestKey = this.getGuestKey();
        if (guestKey) {
          localStorage.removeItem(`arrivalConfirmationSent_${guestKey}`);
          localStorage.removeItem(`notificationConfirmationShown_${guestKey}`);
          localStorage.removeItem(`waitingStart_${guestKey}`);
          localStorage.removeItem(`pendingStart_${guestKey}`);
        }
        this.stopStatusPolling();

        const cancelledGuest = { ...this.guest, ...(res?.data || {}), status: 'CANCELLED' };

        // Keep cancelled guest for restoring

        localStorage.setItem('waitlistGuest', JSON.stringify(cancelledGuest));

        localStorage.setItem('waitlistRestaurantId', String(this.restaurantId));

        this.guest = cancelledGuest;
        this.leaveSuccess.emit(cancelledGuest);


        // localStorage.removeItem('waitlistGuest');
        // localStorage.removeItem('waitlistRestaurantId');
        // this.leaveSuccess.emit();
        // this.router.navigate(['/user']);
      }, error: () => {
        this.isLeaving = false;
        alert('Unable to leave waitlist. Please try again.');
      }
    });
  }

  goBackButtonMethod() {
    this.router.navigate(['/user']);
  }


  get partiesAhead(): number {
    return this.guest?.position ? this.guest.position - 1 : 0;
  }


  get guestName(): string {
    return this.guest?.guestName || this.guest?.name || 'Guest';
  }

  get guestPhone(): string {
    return this.guest?.guestPhone || this.guest?.phone || '-';
  }

  get guestPreference(): string {
    const value = this.guest?.preference;

    if (!value) return 'No preference';

    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (char: string) => char.toUpperCase());
  }

  get waitingMinutesOnly(): string {
    if (this.guest?.status !== 'WAITING') return '0';

    const parts = this.waitingTimerText.split(':');
    return parts[0] || '0';
  }

  get stepWaitingActive(): boolean {
    return this.guest?.status === 'WAITING';
  }

  get stepNotifiedActive(): boolean {
    return this.guest?.status === 'NOTIFIED';
  }

  get stepSeatedActive(): boolean {
    return this.guest?.status === 'SEATED' || this.guest?.status === 'COMPLETED';
  }

  openConfirmationModal(): void {
    this.resetMessageForm();
    this.showMessageConfirm = true;
  }

  get hasSelectedArrivalTime(): boolean {
    return this.selectedArrivalTime.trim().length > 0;
  }

  get hasSpecificMessage(): boolean {
    return this.specificMessage.trim().length > 0;
  }

  get isMessageFormValid(): boolean {
    return this.hasSelectedArrivalTime || this.hasSpecificMessage;
  }

  get showMessageValidationError(): boolean {
    return this.messageFormSubmitted && !this.isMessageFormValid;
  }

  openMessageConfirm(): void {
    this.showMessageConfirm = true;
    this.messageFormSubmitted = false;
  }

  closeMessageConfirm(): void {
    if (this.isSending) {
      return;
    }

    this.showMessageConfirm = false;
    this.resetMessageForm();
  }

  onMessageFieldChange(): void {
    if (this.isMessageFormValid) {
      this.messageFormSubmitted = false;
    }
  }

  private resetMessageForm(): void {
    this.selectedArrivalTime = '';
    this.specificMessage = '';
    this.messageFormSubmitted = false;
  }

  private openConfirmationModalAutomatically(): void {
    const guestKey = this.getGuestKey();

    if (!guestKey) {
      return;
    }

    // Do not open when confirmation was already sent
    if (this.confirmationSent) {
      return;
    }

    const popupStorageKey =
      `notificationConfirmationShown_${guestKey}`;

    const alreadyShown =
      localStorage.getItem(popupStorageKey);

    if (alreadyShown === 'true') {
      return;
    }

    this.resetMessageForm();
    this.showMessageConfirm = true;

    localStorage.setItem(popupStorageKey, 'true');
  }

  get confirmationSent(): boolean {
    const guestKey = this.getGuestKey();

    if (!guestKey) {
      return false;
    }

    return localStorage.getItem(
      `arrivalConfirmationSent_${guestKey}`
    ) === 'true';
  }

  sendArrivalMessage(): void {
    this.messageFormSubmitted = true;

    if (!this.isMessageFormValid) {
      return;
    }

    if (!this.guest?.id) {
      alert('Waitlist details are missing.');
      return;
    }

    const selectedOption = this.arrivalTimeOptions.find(
      option => option.value === this.selectedArrivalTime
    );

    const payload = {
      restaurantId: this.restaurantId,
      waitlistId: this.guest.id,
      arrivalTime: this.selectedArrivalTime || null,
      arrivalTimeLabel: selectedOption?.label || null,
      message: this.specificMessage.trim() || null
    };

    this.isSending = true;

    // dummy payload request to send arrival confirmation
    this.waitlistApi.sendArrivalConfirmation(this.restaurantId, this.guest.id, payload).subscribe({
      next: (res: any) => {
        this.isSending = false;
        this.showMessageConfirm = false;

        const guestKey = this.getGuestKey();

        if (guestKey) {
          localStorage.setItem(
            `arrivalConfirmationSent_${guestKey}`,
            'true'
          );
        }

        // Stop polling after successful confirmation
        this.stopStatusPolling();

        this.resetMessageForm();

        alert(
          res?.message ||
          'Confirmation sent successfully.'
        );
      },
      error: () => {
        this.isSending = false;

        alert(
          'Unable to send confirmation. Please try again.'
        );
      }
    });
  }

  selectMeal(option: string): void {
    this.selectedMeal = option;
  }

  selectSpending(option: string): void {
    this.selectedSpending = option;
  }

  selectReviewWait(option: string): void {
    this.selectedReviewWait = option;
  }

  selectNoise(option: string): void {
    this.selectedNoise = option;
  }

  setRating(value: number): void {
    this.rating = value;
    this.feedbackError = '';
  }

  closeReview(): void {
    this.router.navigate(['/user']);
  }

  submitFeedback(): void {
    this.feedbackError = '';

    // Validate the waitlist ID.
    if (this.guest?.id === null || this.guest?.id === undefined) {
      this.feedbackError = 'Waitlist ID is missing.';
      return;
    }

    // Validate the rating.
    if (!this.rating) {
      this.feedbackError = 'Please select a rating.';
      return;
    }

    // Prevent duplicate submissions in the current component.
    if (this.isSubmittingFeedback || this.feedbackSubmitted) {
      return;
    }

    const storageKey = this.getFeedbackStorageKey();

    if (!storageKey) {
      this.feedbackError = 'Unable to identify this waitlist entry.';
      return;
    }

    // Prevent another submission after revisiting the page.
    if (localStorage.getItem(storageKey) === 'true') {
      this.feedbackSubmitted = true;
      return;
    }

    const tags: string[] = [
      this.selectedMeal,
      this.selectedSpending,
      this.selectedReviewWait,
      this.selectedNoise
    ].filter((tag): tag is string => tag.trim().length > 0);

    const payload = {
      waitlistId: this.guest.id,
      rating: this.rating,
      comments: this.comments.trim(),
      tags
    };

    this.isSubmittingFeedback = true;

    this.waitlistApi.submitFeedback(payload).subscribe({
      next: () => {
        this.isSubmittingFeedback = false;

        // Persist the success before displaying the thank-you message.
        localStorage.setItem(storageKey, 'true');

        this.feedbackSubmitted = true;
        this.feedbackError = '';
      },
      error: (error) => {
        this.isSubmittingFeedback = false;

        console.error('Submit feedback API error:', error);

        this.feedbackError =
          error?.error?.message ||
          'Unable to submit your review. Please try again.';
      }
    });
  }

  private getFeedbackStorageKey(): string | null {
    const waitlistId = this.guest?.id;

    if (waitlistId === null || waitlistId === undefined) {
      return null;
    }

    return `feedbackSubmitted_${waitlistId}`;
  }
  private restoreFeedbackState(): void {
    const key = this.getFeedbackStorageKey();

    this.feedbackSubmitted =
      key !== null && localStorage.getItem(key) === 'true';
  }

  private stopStatusPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = undefined;
  }


  ngOnDestroy(): void {
    this.pendingTimerSub?.unsubscribe();
    this.waitingTimerSub?.unsubscribe();
    this.pollingSub?.unsubscribe();
  }

}
