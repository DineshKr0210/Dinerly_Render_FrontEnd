import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output
} from '@angular/core';

import {
  GuestAccount,
  GuestPortalTab
} from 'src/app/models/guest-portal.model';


@Component({
  selector: 'app-waitlist-navbar',
  templateUrl:
    './waitlist-navbar.component.html',
  styleUrls: [
    './waitlist-navbar.component.css'
  ]
})
export class WaitlistNavbarComponent {

  @Input()
  isDarkMode = false;

  @Input()
  mobileMenuOpen = false;

  @Input()
  activeTab: GuestPortalTab = 'HOME';

  @Input()
  waitlistGuest: any = null;

  @Input()
  customerAccount:
    GuestAccount | null = null;

  @Input()
  restaurant: any = null;

  @Input()
  hasWaitlistAccess = false;

  @Input()
  hasAccountAccess = false;


  @Output()
  themeToggle =
    new EventEmitter<void>();

  @Output()
  mobileMenuToggle =
    new EventEmitter<void>();

  @Output()
  tabChange =
    new EventEmitter<GuestPortalTab>();

  @Output()
  accountLogin =
    new EventEmitter<void>();

  @Output()
  accountLogout =
    new EventEmitter<void>();

  @Output()
  waitlistLogout =
    new EventEmitter<void>();


  showProfileMenu = false;


  get displayName(): string {

    return (
      this.customerAccount?.name ||
      this.waitlistGuest?.guestName ||
      this.waitlistGuest?.name ||
      'Guest'
    );
  }


  get displayInitial(): string {

    const name =
      this.displayName.trim();

    return name
      ? name.charAt(0).toUpperCase()
      : 'G';
  }


  get restaurantName(): string {

    return (
      this.restaurant?.name ||
      'Dinerly'
    );
  }


  get waitTimeLabel(): string {

    const waitMinutes =
      Number(
        this.waitlistGuest
          ?.estimatedWaitTime || 0
      );

    return waitMinutes > 0
      ? `~${waitMinutes} min`
      : '';
  }


  toggleTheme(): void {

    this.themeToggle.emit();
  }


  toggleMobileMenu(
    event: MouseEvent
  ): void {

    event.stopPropagation();

    this.showProfileMenu = false;

    this.mobileMenuToggle.emit();
  }


  toggleProfileMenu(
    event: MouseEvent
  ): void {

    event.stopPropagation();

    this.showProfileMenu =
      !this.showProfileMenu;
  }


  selectTab(
    tab: GuestPortalTab
  ): void {

    this.showProfileMenu = false;

    this.tabChange.emit(tab);
  }


  login(): void {

    this.showProfileMenu = false;

    this.accountLogin.emit();
  }


  logoutAccount(): void {

    this.showProfileMenu = false;

    this.accountLogout.emit();
  }


  logoutWaitlist(): void {

    this.showProfileMenu = false;

    this.waitlistLogout.emit();
  }


  @HostListener('document:click')
  closeMenus(): void {

    this.showProfileMenu = false;
  }
}