import { Component, OnDestroy, OnInit } from '@angular/core';
import { catchError, of, Subject, switchMap, takeUntil, timer } from 'rxjs';
import { PendingGuest } from 'src/app/models/waitlist-api-guest-to-restaurant.model';
import { NotificationService } from 'src/app/services/notification.service';
import { WaitlistApiRestaurantService } from 'src/app/services/waitlist-api-restaurant.service';
import { WaitlistAuthService } from 'src/app/services/waitlist-auth.service';

@Component({
  selector: 'app-waitlist-restaurant-pending-request',
  templateUrl: './waitlist-restaurant-pending-request.component.html',
  styleUrls: ['./waitlist-restaurant-pending-request.component.css']
})
export class WaitlistRestaurantPendingRequestComponent implements OnInit, OnDestroy {
  restaurantId = 0;

  pendingGuests: PendingGuest[] = [];

  selectedGuest:

    PendingGuest | null = null;

  selectedWaitTime = 5;

  waitTimeOptions = [

    5,

    10,

    15,

    20,

    25,

    30

  ];

  showApprovalPopup = false;

  isLoading = false;

  isApproving = false;

  isRejecting = false;

  private readonly destroy$ =

    new Subject<void>();

  constructor(

    private waitlistApi:

      WaitlistApiRestaurantService,

    private auth:

      WaitlistAuthService,

    private notificationService:

      NotificationService

  ) { }

  ngOnInit(): void {

    this.restaurantId =

      Number(

        this.auth.getRestaurantId()

      );

    if (!this.restaurantId) {

      return;

    }

    /*

     * Immediately load once and then

     * check every five seconds.

     */

    timer(0, 5000)

      .pipe(

        switchMap(() =>

          this.waitlistApi

            .getGuestsStatus(

              this.restaurantId,

              'PENDING',

              ''

            )

            .pipe(

              catchError(error => {

                console.error(

                  'Pending guest polling error:',

                  error

                );

                /*

                 * Do not show an alert every five

                 * seconds when polling fails.

                 */

                return of({

                  success: false,

                  data: []

                });

              })

            )

        ),

        takeUntil(

          this.destroy$

        )

      )

      .subscribe(

        (response: any) => {

          this.pendingGuests =

            response?.data || [];

          /*

           * Keep the popup guest synchronized with

           * the latest server response.

           */

          if (

            this.selectedGuest &&

            this.showApprovalPopup

          ) {

            const updatedGuest =

              this.pendingGuests.find(

                guest =>

                  Number(guest.id) ===

                  Number(

                    this.selectedGuest?.id

                  )

              );

            if (updatedGuest) {

              this.selectedGuest =

                updatedGuest;

            } else {

              this.closeApprovalPopup();

            }

          }

        }

      );

  }

  get latestPendingGuest():

    PendingGuest | null {

    if (

      !this.pendingGuests.length

    ) {

      return null;

    }

    /*

     * If the API already returns newest first,

     * this returns the first item.

     */

    return this.pendingGuests[0];

  }

  openApprovalPopup(

    guest: PendingGuest

  ): void {

    this.selectedGuest = guest;

    this.selectedWaitTime = 5;

    this.showApprovalPopup = true;

  }

  closeApprovalPopup(): void {

    if (this.isApproving) {

      return;

    }

    this.showApprovalPopup = false;

    this.selectedGuest = null;

    this.selectedWaitTime = 5;

  }

  approveGuest(): void {

    if (

      !this.selectedGuest ||

      this.isApproving

    ) {

      return;

    }

    const guestId =

      Number(

        this.selectedGuest.id

      );

    if (!guestId) {

      return;

    }

    this.isApproving = true;

    this.waitlistApi

      .approveGuest(

        this.restaurantId,

        guestId,

        {

          estimatedWaitTime:

            this.selectedWaitTime

        }

      )

      .pipe(

        takeUntil(

          this.destroy$

        )

      )

      .subscribe({

        next: response => {

          this.isApproving = false;

          this.removePendingGuest(

            guestId

          );

          this.closeApprovalPopup();

          /*

           * Inform other restaurant components

           * that waitlist data has changed.

           */

          this.notificationService

            .triggerRestaurantRefresh();

          console.log(

            'Guest approved:',

            response

          );

        },

        error: error => {

          this.isApproving = false;

          alert(

            error?.error?.message ||

            'Unable to approve guest'

          );

        }

      });

  }

  declineGuest(

    guest: PendingGuest

  ): void {

    if (

      !guest ||

      this.isRejecting

    ) {

      return;

    }

    const guestId =

      Number(guest.id);

    if (!guestId) {

      return;

    }

    this.isRejecting = true;

    this.waitlistApi

      .rejectGuest(

        this.restaurantId,

        guestId

      )

      .pipe(

        takeUntil(

          this.destroy$

        )

      )

      .subscribe({

        next: () => {

          this.isRejecting = false;

          this.removePendingGuest(

            guestId

          );

          if (

            Number(

              this.selectedGuest?.id

            ) === guestId

          ) {

            this.closeApprovalPopup();

          }

          this.notificationService

            .triggerRestaurantRefresh();

        },

        error: error => {

          this.isRejecting = false;

          alert(

            error?.error?.message ||

            'Unable to decline guest'

          );

        }

      });

  }

  private removePendingGuest(

    guestId: number

  ): void {

    this.pendingGuests =

      this.pendingGuests.filter(

        guest =>

          Number(guest.id) !==

          guestId

      );

  }

  getGuestInitials(

    name?: string

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

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();

  }
}
