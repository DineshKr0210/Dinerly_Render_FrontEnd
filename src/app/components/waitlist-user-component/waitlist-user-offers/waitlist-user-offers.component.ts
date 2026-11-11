import { Component, OnInit } from '@angular/core';
import { OfferRedemption, PortalOffer, Restaurant } from 'src/app/models/waitlist-api-guest-to-restaurant.model';
import { UserService } from 'src/app/services/USER/user.service';



@Component({
  selector: 'app-waitlist-user-offers',
  templateUrl: './waitlist-user-offers.component.html',
  styleUrls: ['./waitlist-user-offers.component.css']
})
export class WaitlistUserOffersComponent implements OnInit {
  offers: PortalOffer[] = [];
  restaurants: Restaurant[] = [];
  recentlyRedeemed: OfferRedemption[] = [];

  isLoading = false;
  errorMessage = '';

  redeemingOfferId: number | null = null;

  showRedeemPopup = false;
  selectedRedemption: OfferRedemption | null = null;

  currentPage = 0;
  pageSize = 20;
  totalPages = 0;

  constructor(
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadOffers();
  }

  loadOffers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService
      .getRestaurantDetails()
      .subscribe({
        next: response => {
          if (!response?.success) {
            this.restaurants = [];
            this.offers = [];

            this.errorMessage =
              response?.message ||
              'Unable to load restaurants.';

            this.isLoading = false;
            return;
          }

          this.restaurants =
            response.data || [];

          if (this.restaurants.length === 0) {
            this.offers = [];
            this.errorMessage =
              'No restaurants found.';
            this.isLoading = false;
            return;
          }

          this.loadOffersForRestaurants();
        },

        error: error => {
          console.error(
            'Restaurant details API error:',
            error
          );

          this.restaurants = [];
          this.offers = [];
          this.isLoading = false;

          this.errorMessage =
            error?.error?.message ||
            'Unable to load restaurants.';
        }
      });
  }

  private loadOffersForRestaurants(): void {
    const requests =
      this.restaurants.map(
        restaurant =>
          this.userService.getOffers(
            restaurant.id,
            'Active',
            this.currentPage,
            this.pageSize
          )
      );

    if (requests.length === 0) {
      this.offers = [];
      this.isLoading = false;
      return;
    }

    let completed = 0;
    const allOffers: PortalOffer[] = [];

    requests.forEach(request => {
      request.subscribe({
        next: response => {
          if (response?.success) {
            allOffers.push(
              ...(response.data?.content || [])
            );
          }

          completed++;

          if (completed === requests.length) {
            this.finishOfferLoading(
              allOffers
            );
          }
        },

        error: error => {
          console.error(
            'Offers API error:',
            error
          );

          completed++;

          if (completed === requests.length) {
            this.finishOfferLoading(
              allOffers
            );
          }
        }
      });
    });
  }

  private finishOfferLoading(
    offers: PortalOffer[]
  ): void {
    const uniqueOffers =
      new Map<number, PortalOffer>();

    offers.forEach(offer => {
      if (!uniqueOffers.has(offer.id)) {
        uniqueOffers.set(
          offer.id,
          offer
        );
      }
    });

    this.offers =
      Array.from(
        uniqueOffers.values()
      );

    this.totalPages = this.getTotalPages();

    this.isLoading = false;

    if (this.offers.length === 0) {
      this.errorMessage =
        'No active offers available.';
    }
  }

  private getTotalPages(): number {
    if (this.offers.length === 0) {
      return 0;
    }

    return Math.ceil(
      this.offers.length /
      this.pageSize
    );
  }

  redeemOffer(offer: PortalOffer): void {
    if (this.redeemingOfferId !== null || !offer.redeemable) {
      return;
    }

    const locationId = offer.restaurantId;

    if (!locationId) {
      this.errorMessage = 'Unable to identify the restaurant location for this offer.';
      return;
    }

    this.errorMessage = '';
    this.redeemingOfferId = offer.id;

    this.userService.redeemOffer(offer.id, locationId).subscribe({
      next: response => {
        this.redeemingOfferId = null;

        if (!response?.success || !response.data) {
          this.errorMessage = response?.message || 'Unable to redeem offer.';
          return;
        }

        const redemption = response.data;

        this.recentlyRedeemed = [
          redemption,
          ...this.recentlyRedeemed
        ];

        this.selectedRedemption = redemption;
        this.showRedeemPopup = true;
      },
      error: error => {
        console.error('Redeem offer API error:', error);
        this.redeemingOfferId = null;
        this.errorMessage = error?.error?.message || 'Unable to redeem offer.';
      }
    });
  }

  closeRedeemPopup(): void {
    this.showRedeemPopup = false;
    this.selectedRedemption = null;
  }

  isRedeeming(
    offerId: number
  ): boolean {
    return (
      this.redeemingOfferId ===
      offerId
    );
  }

  formatDate(
    dateValue: string
  ): string {
    if (!dateValue) {
      return '';
    }

    const date =
      new Date(dateValue);

    if (
      isNaN(date.getTime())
    ) {
      return dateValue;
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

  formatDateTime(
    dateValue: string
  ): string {
    if (!dateValue) {
      return '';
    }

    const date =
      new Date(dateValue);

    if (
      isNaN(date.getTime())
    ) {
      return dateValue;
    }

    return date.toLocaleString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }
    );
  }

  previousPage(): void {
    if (this.currentPage <= 0) {
      return;
    }

    this.currentPage--;
    this.loadOffers();
  }

  nextPage(): void {
    if (
      this.totalPages === 0 ||
      this.currentPage >=
      this.totalPages - 1
    ) {
      return;
    }

    this.currentPage++;
    this.loadOffers();
  }
}