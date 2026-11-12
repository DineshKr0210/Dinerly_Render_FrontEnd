import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  GuestAccount,
  GuestPortalTab
} from 'src/app/models/guest-portal.model';
import { IdleTimeoutService } from 'src/app/services/idle-timout.service';
import { ThemeService } from 'src/app/services/theme.service';
import { WaitlistAuthService } from 'src/app/services/waitlist-auth.service';


@Component({
  selector: 'app-waitlist-user-component',
  templateUrl:
    './waitlist-user-component.component.html',
  styleUrls: [
    './waitlist-user-component.component.css'
  ]
})
export class WaitlistUserComponentComponent
  implements OnInit, OnDestroy {
  /** Desktop sidebar hidden with the navbar toggle. */
  desktopSidebarHidden = false;


  isDarkMode = false;
  showMobileSidebar = false;
  activeTab: GuestPortalTab = 'HOME';

  waitlistGuest: any = null;

  customerAccount:
    GuestAccount | null = null;

  cancelledGuest: any = null;

  restoreRequestSent = false;

  showWaitlistAccessPopup = false;

  showAccountLoginPopup = false;

  showCancelledPopup = false;

  private requestedAccountTab:
    GuestPortalTab | null = null;

  accountSuccessMessage = '';

  restaurant: any = null;

  private readonly subscriptions = new Subscription();


  constructor(
    private route: ActivatedRoute,
    private router: Router, private auth: WaitlistAuthService, private idleTimeout: IdleTimeoutService,
    private themeService: ThemeService
  ) { }
  ngOnInit(): void {
    this.loadTheme();

    this.subscriptions.add(
      this.themeService.isDark$.subscribe(
        isDark => {
          this.isDarkMode = isDark;
        }
      )
    );

    this.loadWaitlistGuest();
    this.loadCustomerAccount();
    this.syncGuestIdleTimeout();
    this.route.queryParamMap

      .subscribe(params => {

        const shouldOpenLogin =

          params.get('accountLogin') ===

          'true';

        const emailVerified =

          params.get('emailVerified') ===

          'true';

        if (shouldOpenLogin) {

          this.openAccountLoginPopup();

          if (emailVerified) {

            this.accountSuccessMessage =

              'Your email has been verified successfully. Please login.';

          }

          this.router.navigate(

            [],

            {

              relativeTo: this.route,

              queryParams: {},

              replaceUrl: true

            }

          );

        }

      });
  }


  /* =====================================================
     ACCESS GETTERS
  ====================================================== */

  get hasWaitlistAccess(): boolean {

    if (!this.waitlistGuest) {
      return false;
    }

    const status =
      this.waitlistGuest?.status;

    return (
      status !== 'CANCELLED' &&
      status !== 'RESTORE_REQUESTED'
    );
  }


  get hasAccountAccess(): boolean {
    return !!this.customerAccount;
  }


  /**
   * Food, Offers and Rewards require:
   *
   * 1. Active waitlist
   * 2. Email account login
   */
  get canAccessAccountFeatures(): boolean {

    return (
      this.hasWaitlistAccess &&
      this.hasAccountAccess
    );
  }


  /* =====================================================
     THEME
  ====================================================== */

  private loadTheme(): void {
    this.isDarkMode =
      this.themeService.isDark;
  }


  toggleTheme(): void {
    this.themeService.toggle();

    this.isDarkMode =
      this.themeService.isDark;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  /* =====================================================
     LOAD WAITLIST GUEST
  ====================================================== */

  loadWaitlistGuest(): void {

    const guestData =
      localStorage.getItem(
        'waitlistGuest'
      );

    if (!guestData) {

      this.waitlistGuest = null;

      this.cancelledGuest = null;

      this.restoreRequestSent = false;

      this.moveAwayFromProtectedTabs();

      return;
    }

    try {

      const parsedGuest =
        JSON.parse(guestData);

      if (
        parsedGuest?.status ===
        'CANCELLED' ||
        parsedGuest?.status ===
        'RESTORE_REQUESTED'
      ) {

        this.waitlistGuest = null;

        this.cancelledGuest =
          parsedGuest;

        this.restoreRequestSent =
          parsedGuest.status ===
          'RESTORE_REQUESTED';

        this.moveAwayFromProtectedTabs();

        return;
      }

      this.waitlistGuest =
        parsedGuest;

      this.cancelledGuest = null;

      this.restoreRequestSent = false;

    } catch {

      this.clearWaitlistStorage();

      this.waitlistGuest = null;

      this.cancelledGuest = null;

      this.restoreRequestSent = false;

      this.moveAwayFromProtectedTabs();
    }
  }


  /* =====================================================
     LOAD CUSTOMER ACCOUNT
  ====================================================== */

  loadCustomerAccount(): void {

    /*
     * First check the custom guest account key.
     *
     * If it is unavailable, check the common
     * authentication service key.
     */
    const accountData =
      localStorage.getItem(
        'dinerlyCustomerAccount'
      ) ||
      localStorage.getItem(
        'waitlist_user'
      );

    if (!accountData) {

      this.customerAccount = null;

      this.moveAwayFromProtectedTabs();

      return;
    }

    try {

      const storedUser =
        JSON.parse(accountData);

      const token =
        localStorage.getItem(
          'dinerlyCustomerToken'
        ) ||
        localStorage.getItem(
          'waitlist_token'
        ) ||
        '';

      this.customerAccount = {

        id:
          storedUser?.id,

        name:
          storedUser?.name ||
          storedUser?.username ||
          'Guest',

        email:
          storedUser?.email ||
          '',

        phone:
          storedUser?.phone,

        token
      };

    } catch {

      this.clearCustomerAccountStorage();

      this.customerAccount = null;

      this.moveAwayFromProtectedTabs();
    }
  }


  /* =====================================================
     CHANGE TAB
  ====================================================== */

  changeTab(
    tab: GuestPortalTab
  ): void {

    this.closeMobileSidebar();
    this.showWaitlistAccessPopup = false;

    this.showAccountLoginPopup = false;


    /* HOME */

    if (tab === 'HOME') {

      this.activeTab = 'HOME';

      return;
    }


    /* WAITLIST */

    if (tab === 'WAITLIST') {

      if (!this.hasWaitlistAccess) {

        this.showWaitlistAccessPopup = true;

        return;
      }

      this.activeTab = 'WAITLIST';

      return;
    }
    if (tab === 'REVIEWS') {

      if (!this.hasWaitlistAccess) {

        this.showWaitlistAccessPopup = true;

        return;
      }

      this.activeTab = 'REVIEWS';

      return;
    }

    if (

      tab === 'PROFILE' &&

      !this.hasAccountAccess

    ) {

      this.openAccountLoginPopup();

      return;

    }


    /* MENU / OFFERS / REWARDS */

    if (this.isEmailProtectedTab(tab)) {

      /*
       * First require an active waitlist.
       */
      if (!this.hasWaitlistAccess) {

        this.requestedAccountTab = tab;

        this.showWaitlistAccessPopup = true;

        return;
      }

      /*
       * Then require email account login.
       */
      if (!this.hasAccountAccess) {

        this.requestedAccountTab = tab;

        this.showAccountLoginPopup = true;

        return;
      }

      this.activeTab = tab;

      return;
    }
  }


  private isEmailProtectedTab(
    tab: GuestPortalTab
  ): boolean {

    return (
      tab === 'MENU' ||
      tab === 'OFFERS' ||
      tab === 'REWARDS'
    );
  }


  private moveAwayFromProtectedTabs(): void {

    if (
      this.activeTab === 'WAITLIST' ||
      this.activeTab === 'REVIEWS' ||
      this.activeTab === 'MENU' ||
      this.activeTab === 'OFFERS' ||
      this.activeTab === 'REWARDS'
    ) {

      this.activeTab = 'HOME';
    }
  }


  /* =====================================================
     GUEST JOINED WAITLIST
  ====================================================== */

  onGuestJoined(
    guest: any
  ): void {

    if (!guest) {
      return;
    }

    if (
      guest.status === 'CANCELLED' ||
      guest.status ===
      'RESTORE_REQUESTED'
    ) {

      this.waitlistGuest = null;

      this.cancelledGuest =
        guest;

      this.restoreRequestSent =
        guest.status ===
        'RESTORE_REQUESTED';

      this.showCancelledPopup =
        guest.status ===
        'CANCELLED';

      this.activeTab = 'HOME';

      return;
    }

    this.waitlistGuest = guest;

    this.cancelledGuest = null;

    this.restoreRequestSent = false;

    localStorage.setItem(
      'waitlistGuest',
      JSON.stringify(guest)
    );

    this.activeTab = 'WAITLIST';
  }


  /* =====================================================
     ACCOUNT LOGIN SUCCESS
  ====================================================== */

  onAccountLoginSuccess(account: GuestAccount): void {
    this.customerAccount = account;
    localStorage.setItem('dinerlyCustomerAccount', JSON.stringify(account));

    if (account.token) {
      localStorage.setItem('dinerlyCustomerToken', account.token);
    }

    this.showAccountLoginPopup = false;
    this.syncGuestIdleTimeout();

    if (!this.hasWaitlistAccess) {
      this.activeTab = 'HOME';
      this.requestedAccountTab = null;
      return;
    }

    if (this.requestedAccountTab && this.isEmailProtectedTab(this.requestedAccountTab)) {
      this.activeTab = this.requestedAccountTab;
    } else {
      this.activeTab = 'HOME';
    }

    this.requestedAccountTab = null;
  }


  /* =====================================================
     WAITLIST LOGOUT
  ====================================================== */

  logoutWaitlistGuest(): void {

    this.closeMobileSidebar();

    this.clearWaitlistStorage();

    this.waitlistGuest = null;

    this.cancelledGuest = null;

    this.restoreRequestSent = false;

    this.requestedAccountTab = null;

    this.showWaitlistAccessPopup = false;

    this.showAccountLoginPopup = false;

    this.activeTab = 'HOME';
  }


  /* =====================================================
     CUSTOMER ACCOUNT LOGOUT
  ====================================================== */

  logoutCustomerAccount(): void {

    this.closeMobileSidebar();

    this.auth.signOutGuest(false);

    this.clearCustomerAccountStorage();

    this.customerAccount = null;

    this.requestedAccountTab = null;

    this.showAccountLoginPopup = false;

    if (
      this.activeTab === 'PROFILE' ||
      this.activeTab === 'MENU' ||
      this.activeTab === 'OFFERS' ||
      this.activeTab === 'REWARDS'
    ) {
      this.activeTab = 'HOME';
    }
  }


  /* =====================================================
     CLEAR STORAGE
  ====================================================== */

  private clearWaitlistStorage(): void {

    localStorage.removeItem(
      'waitlistGuest'
    );

    localStorage.removeItem(
      'waitlistRestaurantId'
    );
  }


  private clearCustomerAccountStorage(): void {

    localStorage.removeItem(
      'dinerlyCustomerAccount'
    );

    localStorage.removeItem(
      'dinerlyCustomerToken'
    );

    /*
     * These are created by WaitlistAuthService.
     */
    localStorage.removeItem(
      'waitlist_user'
    );

    localStorage.removeItem(
      'waitlist_token'
    );
  }


  /* =====================================================
     ACCOUNT POPUP
  ====================================================== */

  openAccountLoginPopup(
    requestedTab?: GuestPortalTab
  ): void {

    if (!this.hasWaitlistAccess) {

      if (requestedTab) {

        this.requestedAccountTab =
          requestedTab;
      }

      this.showWaitlistAccessPopup = true;

      return;
    }

    if (requestedTab) {

      this.requestedAccountTab =
        requestedTab;
    }

    this.showAccountLoginPopup = true;
  }


  closeAccountLoginPopup(): void {

    this.showAccountLoginPopup = false;

    this.requestedAccountTab = null;
  }


  closeWaitlistAccessPopup(): void {

    this.showWaitlistAccessPopup = false;
  }


  closeCancelledPopup(): void {

    this.showCancelledPopup = false;
  }


  /* =====================================================
     LEAVE / CANCEL WAITLIST
  ====================================================== */

  onLeaveSuccess(
    cancelledGuest: any
  ): void {

    this.clearWaitlistStorage();

    this.waitlistGuest = null;

    this.cancelledGuest =
      cancelledGuest;

    this.restoreRequestSent = false;

    this.requestedAccountTab = null;

    this.showAccountLoginPopup = false;

    this.showWaitlistAccessPopup = false;

    /*
     * Menu, rewards and offers are now blocked,
     * because there is no active waitlist.
     */
    this.activeTab = 'HOME';
  }


  /* =====================================================
     RESTORE REQUEST
  ====================================================== */

  onRestoreRequested(
    restoredGuest: any
  ): void {

    this.waitlistGuest = null;

    this.cancelledGuest =
      restoredGuest;

    this.restoreRequestSent = true;

    this.activeTab = 'HOME';

    localStorage.setItem(
      'waitlistGuest',
      JSON.stringify(restoredGuest)
    );
  }

  getCustomerInitial(): string {

    const name =
      this.customerAccount?.name?.trim();

    if (!name) {
      return 'U';
    }

    return name.charAt(0).toUpperCase();
  }


  editCustomerProfile(): void {

    // Open your edit profile popup here.
    console.log(
      'Edit customer profile',
      this.customerAccount
    );
  }

  toggleMobileSidebar(): void {

    if (window.innerWidth > 1024) {
      this.desktopSidebarHidden =
        !this.desktopSidebarHidden;
      return;
    }

    this.showMobileSidebar =
      !this.showMobileSidebar;

    document.body.classList.toggle(
      'guest-mobile-menu-open',
      this.showMobileSidebar
    );
  }


  closeMobileSidebar(): void {

    this.showMobileSidebar = false;

    document.body.classList.remove(
      'guest-mobile-menu-open'
    );
  }


  onNavbarTabChange(
    tab: GuestPortalTab
  ): void {

    this.closeMobileSidebar();

    this.changeTab(tab);
  }


  onSidebarTabChange(
    tab: GuestPortalTab
  ): void {

    this.closeMobileSidebar();

    this.changeTab(tab);
  }

  private syncGuestIdleTimeout(): void {
    const token = localStorage.getItem('dinerlyCustomerToken');
    const account = localStorage.getItem('dinerlyCustomerAccount');

    if (this.customerAccount && token && account) {
      this.idleTimeout.start('guest');
    } else {
      this.idleTimeout.stop();
    }
  }


}

