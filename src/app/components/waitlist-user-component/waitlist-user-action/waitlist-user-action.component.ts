import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Restaurant } from 'src/app/models/waitlist-api-guest-to-restaurant.model';
import { WaitlistApiRestaurantService } from 'src/app/services/waitlist-api-restaurant.service';

@Component({
  selector: 'app-waitlist-user-action',
  templateUrl: './waitlist-user-action.component.html',
  styleUrls: ['./waitlist-user-action.component.css']
})
export class WaitlistUserActionComponent {
  @Output() guestJoined = new EventEmitter<any>();
  showModal = false;
  modalType: 'join' | 'status' = 'join';
  restaurants: Restaurant[] = [];
  isRestaurantLoaded = false;

  @Input() cancelledGuest: any = null;
  @Input() restoreRequestSent = false;

  @Output() restoreRequested = new EventEmitter<any>();

  isRestoring = false;
  restoreError = '';

  constructor(
    private waitlistApi: WaitlistApiRestaurantService) { }

  ngOnInit(): void {
    this.loadRestaurants();
  }

  loadRestaurants(): void {
    this.waitlistApi.getRestaurantDetails().subscribe({
      next: (res) => {
        if (res?.success && res?.data) {
          this.restaurants = res.data;
          this.isRestaurantLoaded = true;
        }
      },

      error: () => {
        this.isRestaurantLoaded = false;
      }
    });
  }

  openModal(type: 'join' | 'status'): void {
    if (!this.isRestaurantLoaded) {

      alert('Restaurants are still loading. Please try again.');

      return;

    }
    this.modalType = type;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  onJoinedWaitlist(guest: any): void {
    this.guestJoined.emit(guest);
    this.showModal = false;

  }

  requestRestore(): void {
    if (!this.cancelledGuest?.id) {
      this.restoreError =
        'Previous waitlist details are missing.';
      return;
    }

    const restaurantId = Number(
      localStorage.getItem('waitlistRestaurantId')
    );

    if (!restaurantId) {
      this.restoreError =
        'Restaurant details are missing.';
      return;
    }

    this.isRestoring = true;
    this.restoreError = '';

    this.waitlistApi
      .requestWaitlistRestore(
        restaurantId,
        this.cancelledGuest.id
      )
      .subscribe({
        next: (res: any) => {
          this.isRestoring = false;

          const restoredGuest = {
            ...this.cancelledGuest,
            ...(res?.data || {}),
            status: 'RESTORE_REQUESTED'
          };

          localStorage.setItem(
            'waitlistGuest',
            JSON.stringify(restoredGuest)
          );

          this.restoreRequested.emit(restoredGuest);
        },
        error: (error: any) => {
          this.isRestoring = false;

          this.restoreError =
            error?.error?.message ||
            'Unable to send restore request.';
        }
      });
  }
}
