import {
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  NavigationEnd,
  Router
} from '@angular/router';

import {
  filter,
  Subscription
} from 'rxjs';

import {
  AdminLocationSummary
} from 'src/app/models/admin.model';

import {
  AdminLocationContextService
} from 'src/app/services/admin-location-context.service';

import {
  ThemeService
} from 'src/app/services/theme.service';

type SettingsTab =
  | 'profile'
  | 'notification'
  | 'waitlist'
  | 'tables'
  | 'holiday'
  | 'advanced';

@Component({
  selector: 'app-waitlist-admin',
  templateUrl: './waitlist-admin.component.html',
  styleUrls: ['./waitlist-admin.component.css']
})
export class WaitlistAdminComponent
  implements OnInit, OnDestroy {
  /** Sidebar hidden with the navbar toggle (desktop). */
  sidebarHidden = false;

  toggleSidebarVisibility(): void {
    this.sidebarHidden = !this.sidebarHidden;
  }


  activeRoute = 'home';

  activeSettingsTab: SettingsTab =
    'profile';

  showSettingsMenu = false;

  showLocationDropdown = false;

  showAdminMenu = false;

  notificationCount = 3;

  locations: AdminLocationSummary[] = [];

  selectedLocation:
    AdminLocationSummary | null = null;

  private subs =
    new Subscription();

  settingsTabs: Array<{
    label: string;
    value: SettingsTab;
  }> = [
      {
        label: 'Profile',
        value: 'profile'
      },
      {
        label: 'Notification',
        value: 'notification'
      },
      {
        label: 'Waitlist settings',
        value: 'waitlist'
      },
      {
        label: 'Tables',
        value: 'tables'
      },
      {
        label: 'Holiday hours',
        value: 'holiday'
      },
      {
        label: 'Advanced',
        value: 'advanced'
      }
    ];

  currentUserId: number | null = null;
  currentUserRole = '';
  permissions = {
    canManageOffers: false,
    canManageStaff: false,
    canManageRewards: false,
    canManageSettings: false,
    canViewReports: false
  };

  constructor(
    private router: Router,
    private locationContext:
      AdminLocationContextService,
    private themeService: ThemeService
  ) { }

  get isDarkMode(): boolean {
    return this.themeService.isDark;
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  ngOnInit(): void {

    this.setActiveRouteFromUrl(
      this.router.url
    );

    /*
     * Get locations from shared service.
     */
    this.subs.add(
      this.locationContext
        .locations$
        .subscribe(locations => {

          this.locations =
            locations;

        })
    );

    /*
     * Get selected location.
     */
    this.subs.add(
      this.locationContext
        .selectedLocation$
        .subscribe(location => {

          this.selectedLocation =
            location;

        })
    );

    /*
     * Load locations.
     */
    this.locationContext
      .loadLocations();

    /*
     * Watch router changes.
     */
    this.subs.add(
      this.router.events
        .pipe(
          filter(
            event =>
              event instanceof NavigationEnd
          )
        )
        .subscribe(
          (event: any) => {

            this.setActiveRouteFromUrl(
              event.urlAfterRedirects
            );

          }
        )
    );
  }

  setActiveRouteFromUrl(
    url: string
  ): void {

    const segments =
      url
        .split('/')
        .filter(Boolean);

    this.activeRoute =
      segments[segments.length - 1] ||
      'home';
  }

  navigate(
    route: string
  ): void {

    this.activeRoute =
      route;

    this.router.navigate([
      '/admin',
      route
    ]);
  }

  /*
   * LOCATION DROPDOWN
   */
  toggleLocationDropdown(): void {

    this.showLocationDropdown =
      !this.showLocationDropdown;

    this.showAdminMenu =
      false;
  }

  selectLocation(
    location: AdminLocationSummary
  ): void {

    this.locationContext
      .selectLocation(location);

    this.showLocationDropdown =
      false;
  }

  /*
   * SETTINGS
   */
  toggleSettingsMenu(): void {

    if (
      this.activeRoute !==
      'settings'
    ) {

      this.openSettingsTab(
        'profile'
      );

      return;
    }

    this.showSettingsMenu =
      !this.showSettingsMenu;
  }

  openSettingsTab(
    tab: SettingsTab
  ): void {

    this.activeSettingsTab =
      tab;

    this.activeRoute =
      'settings';

    this.showSettingsMenu =
      true;

    this.router.navigate(
      ['/admin/settings'],
      {
        queryParams: {
          tab
        },
        queryParamsHandling:
          'merge'
      }
    );
  }

  /*
   * ADMIN USER DROPDOWN
   */
  toggleAdminMenu(): void {

    this.showAdminMenu =
      !this.showAdminMenu;

    this.showLocationDropdown =
      false;
  }

  logoutFromMenu(
    event: MouseEvent
  ): void {

    event.stopPropagation();

    this.logout();
  }

  logout(): void {

    this.showAdminMenu =
      false;

    localStorage.removeItem(
      'authToken'
    );

    this.router.navigate([
      '/login'
    ]);
  }

  /*
   * CLOSE DROPDOWNS WHEN CLICKING
   * OUTSIDE THEM.
   */
  @HostListener(
    'document:click',
    ['$event']
  )
  onDocumentClick(
    event: MouseEvent
  ): void {

    const target =
      event.target as HTMLElement;

    if (
      !target.closest(
        '.location-selector-wrapper'
      )
    ) {

      this.showLocationDropdown =
        false;
    }

    if (
      !target.closest(
        '.admin-user-wrapper'
      )
    ) {

      this.showAdminMenu =
        false;
    }
  }


  // canAccessOffers(): boolean {
  //   return this.currentUserRole === 'ADMIN' ||
  //     this.permissions.canManageOffers;
  // }

  // canAccessRewards(): boolean {
  //   return this.currentUserRole === 'ADMIN' ||
  //     this.permissions.canManageRewards;
  // }

  // canAccessReports(): boolean {
  //   return this.currentUserRole === 'ADMIN' ||
  //     this.permissions.canViewReports;
  // }

  // canAccessSettings(): boolean {
  //   return this.currentUserRole === 'ADMIN' ||
  //     this.permissions.canManageSettings;
  // }

  // canManageStaff(): boolean {
  //   return this.currentUserRole === 'ADMIN' ||
  //     this.permissions.canManageStaff;
  // }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}