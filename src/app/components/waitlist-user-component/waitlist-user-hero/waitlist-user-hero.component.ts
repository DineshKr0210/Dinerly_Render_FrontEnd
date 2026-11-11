import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GuestAccount } from 'src/app/models/guest-portal.model';
import { Restaurant } from 'src/app/models/waitlist-api-guest-to-restaurant.model';
import { WaitlistApiRestaurantService } from 'src/app/services/waitlist-api-restaurant.service';

@Component({
  selector: 'app-waitlist-user-hero',
  templateUrl: './waitlist-user-hero.component.html',
  styleUrls: ['./waitlist-user-hero.component.css']
})
export class WaitlistUserHeroComponent implements OnInit {

  restaurantId = 1;
  partiesWaiting = 0;
  waitMinutes = 0;
  @Input() guest: any;
  restaurant?: Restaurant;
  @Output() logout = new EventEmitter<void>();
  @Input()
    customerAccount: GuestAccount | null = null;
  
    @Input()
    hasWaitlistAccess = false;
  
    @Input()
    hasAccountAccess = false;

  showProfileMenu = false;

  constructor(private waitlistApi: WaitlistApiRestaurantService) { }

  ngOnInit(): void {
    const guestData = localStorage.getItem('waitlistGuest');

    if (guestData) {
      this.guest = JSON.parse(guestData);
    }

    this.getWaitlistDashboardStatus();
    this.restaurantId = Number(localStorage.getItem('waitlistRestaurantId'));
    this.loadRestaurantDetails();
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

  getWaitlistDashboardStatus(): void {
    this.waitlistApi.getwaitlistdashBoardStatus(this.restaurantId).subscribe({
      next: (res: any) => {
        if (res?.success && res?.data) {
          this.partiesWaiting = res.data.totalWaiting || 0;
          this.waitMinutes = res.data.averageWaitTime || 0;
        }
      }
    });
  }

  get guestName(): string {

    return this.guest?.guestName || this.guest?.name || 'Guest';

  }

  get guestInitial(): string {
    return this.guestName.charAt(0).toUpperCase();
  }

  get guestShortName(): string {
    return this.guestName.length > 10
      ? this.guestName.substring(0, 10)
      : this.guestName;
  }

  toggleProfileMenu(): void {

    this.showProfileMenu = !this.showProfileMenu;

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

  logoutGuest(): void {

    this.showProfileMenu = false;

    this.logout.emit();

  }
}