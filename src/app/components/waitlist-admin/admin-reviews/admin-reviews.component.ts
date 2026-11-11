import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import {
  AdminLocationSummary,
  Review
} from 'src/app/models/admin.model';
import { WaitListAdminService } from 'src/app/services/wait-list-admin.service';
import { AdminLocationContextService } from 'src/app/services/admin-location-context.service';

@Component({
  selector: 'app-admin-reviews',
  templateUrl: './admin-reviews.component.html',
  styleUrls: ['./admin-reviews.component.css']
})
export class AdminReviewsComponent implements OnInit, OnDestroy {
  locations: AdminLocationSummary[] = [];
  selectedLocationId: number | null = null;
  selectedLocation: AdminLocationSummary | null = null;

  selectedFilter = 'all';

  filters = [
    { value: 'all', label: 'All' },
    { value: 'needsReply', label: 'Needs reply' },
    { value: '5star', label: '5 ★' },
    { value: '1starUnder', label: '1 ★ & under' }
  ];

  reviews: Review[] = [];
  filteredReviews: Review[] = [];

  currentPage = 0;
  pageSize = 20;
  totalPages = 0;
  totalElements = 0;

  isLoadingLocations = false;
  loadingReviews = false;

  replyingReviewId: number | null = null;

  errorMessage = '';
  successMessage = '';

  replyTexts: { [reviewId: number]: string } = {};

  averageRating = 0;
  needsReplyCount = 0;
  replyRate = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private adminService: WaitListAdminService,
    private locationContext: AdminLocationContextService
  ) {}

  ngOnInit(): void {
    this.locationContext.locations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(locations => {
        this.locations = locations || [];
        this.isLoadingLocations = false;

        const currentLocation =
          this.locationContext.getCurrentLocation();

        if (currentLocation) {
          this.selectedLocation = currentLocation;
          this.selectedLocationId = currentLocation.id;
        }
      });

    this.locationContext.selectedLocation$
      .pipe(takeUntil(this.destroy$))
      .subscribe(location => {
        const previousLocationId =
          this.selectedLocation?.id ?? null;

        const newLocationId =
          location?.id ?? null;

        this.selectedLocation = location;
        this.selectedLocationId = newLocationId;

        if (
          newLocationId !== null 
        ) {
          this.currentPage = 0;
          this.loadReviews();
        }

        if (!location) {
          this.reviews = [];
          this.filteredReviews = [];
          this.totalPages = 0;
          this.totalElements = 0;
          this.resetSummary();
        }
      });

    this.locationContext.isLoadingLocations$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isLoading => {
        this.isLoadingLocations = isLoading;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLocationChange(locationId: number | null): void {
    if (locationId === null) {
      return;
    }

    this.currentPage = 0;

    this.locationContext.selectLocationById(locationId);
  }

  onFilterChange(filter: string): void {
    if (this.selectedFilter === filter) {
      this.selectedFilter = '';
      this.loadReviews();
      return;
    }

    this.selectedFilter = filter;
    this.currentPage = 0;
    this.loadReviews();
  }

  loadReviews(): void {
    // if (this.selectedLocationId === null) {
    //   this.reviews = [];
    //   this.filteredReviews = [];
    //   this.totalPages = 0;
    //   this.totalElements = 0;
    //   this.resetSummary();
    //   return;
    // }

    this.loadingReviews = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminService
      .getReviews(
        this.currentPage,
        this.pageSize,
        this.selectedLocationId,
        this.selectedFilter
      )
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loadingReviews = false;
        })
      )
      .subscribe({
        next: response => {
          if (!response?.success) {
            this.reviews = [];
            this.filteredReviews = [];
            this.totalPages = 0;
            this.totalElements = 0;
            this.resetSummary();

            this.errorMessage =
              response?.message ||
              'Unable to load reviews.';

            return;
          }

          this.reviews =
            response.data?.content || [];

          this.filteredReviews =
            this.reviews;

          this.totalPages =
            response.data?.totalPages || 0;

          this.totalElements =
            response.data?.totalElements || 0;

          this.reviews.forEach(review => {
            this.replyTexts[review.id] =
              review.reply || '';
          });

          this.calculateSummary();
        },
        error: error => {
          console.error(
            'Reviews API error:',
            error
          );

          this.reviews = [];
          this.filteredReviews = [];
          this.totalPages = 0;
          this.totalElements = 0;
          this.resetSummary();

          this.errorMessage =
            error?.error?.message ||
            'Unable to load reviews.';
        }
      });
  }

  calculateSummary(): void {
    if (!this.reviews.length) {
      this.resetSummary();
      return;
    }

    const ratings = this.reviews
      .map(review => Number(review.rating))
      .filter(rating => !isNaN(rating));

    if (ratings.length) {
      const totalRating = ratings.reduce(
        (total, rating) => total + rating,
        0
      );

      this.averageRating =
        totalRating / ratings.length;
    } else {
      this.averageRating = 0;
    }

    this.needsReplyCount =
      this.reviews.filter(review =>
        !review.reply ||
        !review.reply.trim()
      ).length;

    const repliedReviews =
      this.reviews.filter(review =>
        !!review.reply &&
        !!review.reply.trim()
      ).length;

    this.replyRate = Math.round(
      (repliedReviews / this.reviews.length) * 100
    );
  }

  resetSummary(): void {
    this.averageRating = 0;
    this.needsReplyCount = 0;
    this.replyRate = 0;
  }

  postReply(review: Review): void {
    const reply =
      (
        this.replyTexts[review.id] ||
        ''
      ).trim();

    if (!reply) {
      this.errorMessage =
        'Please enter a reply before posting.';
      return;
    }

    const hadExistingReply =
      !!review.reply &&
      !!review.reply.trim();

    this.replyingReviewId = review.id;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminService
      .replyToReview(review.id, { reply })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.replyingReviewId = null;
        })
      )
      .subscribe({
        next: response => {
          if (
            response &&
            response.success === false
          ) {
            this.errorMessage =
              response.message ||
              'Unable to post reply.';
            return;
          }

          review.reply = reply;
          review.repliedAt =
            new Date().toISOString();

          this.replyTexts[review.id] = reply;

          this.successMessage =
            hadExistingReply
              ? 'Reply updated successfully.'
              : 'Reply posted successfully.';

          this.calculateSummary();
        },
        error: error => {
          console.error(
            'Reply API error:',
            error
          );

          this.errorMessage =
            error?.error?.message ||
            'Unable to post reply.';
        }
      });
  }

  isReplying(reviewId: number): boolean {
    return this.replyingReviewId === reviewId;
  }

  getStars(rating: number): string[] {
    const stars: string[] = [];

    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? '★' : '☆'
      );
    }

    return stars;
  }

  formatReviewDate(dateValue: string): string {
    if (!dateValue) {
      return '';
    }

    const date = new Date(dateValue);

    if (isNaN(date.getTime())) {
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

  getCurrentPageDisplay(): number {
    return this.currentPage + 1;
  }

  nextPage(): void {
    if (
      this.currentPage + 1 >=
      this.totalPages
    ) {
      return;
    }

    this.currentPage++;
    this.loadReviews();
  }

  previousPage(): void {
    if (this.currentPage <= 0) {
      return;
    }

    this.currentPage--;
    this.loadReviews();
  }

  trackByReviewId(
    index: number,
    review: Review
  ): number {
    return review.id;
  }
}