import {
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router
} from '@angular/router';
import { filter, Subscription } from 'rxjs';

import {
  DashboardStatus,
  tableList
} from 'src/app/models/waitlist-api-guest-to-restaurant.model';

import { NotificationService } from 'src/app/services/notification.service';
import { ThemeService } from 'src/app/services/theme.service';
import { WaitlistApiRestaurantService } from 'src/app/services/waitlist-api-restaurant.service';
import { WaitlistAuthService } from 'src/app/services/waitlist-auth.service';
import { RestaurantSearchService } from 'src/app/services/restaurant-search.service';

type SettingsTab =
  | 'profile'
  | 'notification'
  | 'waitlist'
  | 'tables'
  | 'holiday'
  | 'advanced';

@Component({
  selector: 'app-waitlist-restaurant-component',
  templateUrl: './waitlist-restaurant-component.component.html',
  styleUrls: ['./waitlist-restaurant-component.component.css']
})
export class WaitlistRestaurantComponentComponent
  implements OnInit, OnDestroy {

  activeRoute = 'waitlist';

  searchQuery = '';

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery = this.search.setQuery(input.value);
    input.value = this.searchQuery;
  }

  activeSettingsTab: SettingsTab = 'profile';

  showSettingsMenu = false;

  guestCount = 0;
  notifyCount = 0;
  openTablesCount = 0;

  showModal = false;
  restaurantId = 1;

  tables: tableList[] = [];
  dashboardStatus: DashboardStatus[] = [];

  isLoading = false;

  isSidebarCollapsed = false;

  showUserMenu = false;
  restaurantName = '';

  settingsTabs: Array<{
    label: string;
    value: SettingsTab;
  }> = [
      { label: 'Profile', value: 'profile' },
      { label: 'Notification', value: 'notification' },
      { label: 'Waitlist settings', value: 'waitlist' },
      { label: 'Tables', value: 'tables' },
      { label: 'Holiday hours', value: 'holiday' },
      { label: 'Advanced', value: 'advanced' }
    ];

  private subscriptions = new Subscription();
  private refreshSub?: Subscription;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private waitlistService: WaitlistApiRestaurantService,
    private notificationService: NotificationService,
    private themeService: ThemeService,
    private authService: WaitlistAuthService,
    private search: RestaurantSearchService
  ) { }

  get isDarkMode(): boolean {
    return this.themeService.isDark;
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  /** Logo click: back to the default landing page. */
  goToLanding(): void {
    this.router.navigate(['/restaurant/waitlist']);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;

    if (this.isSidebarCollapsed && this.activeRoute === 'settings') {
      this.showSettingsMenu = false;
    }
  }

  get restaurantInitial(): string {
    return this.restaurantName?.trim()?.charAt(0)?.toUpperCase() || 'R';
  }

  ngOnInit(): void {
    this.restaurantName = this.authService.getRestaurantName() || 'Restaurant';
    this.setActiveRouteFromUrl(this.router.url);
    this.readSettingsTabFromUrl(this.router.url);

    this.subscriptions.add(
      this.router.events
        .pipe(
          filter(
            (event): event is NavigationEnd =>
              event instanceof NavigationEnd
          )
        )
        .subscribe((event: NavigationEnd) => {
          this.setActiveRouteFromUrl(event.urlAfterRedirects);
          this.readSettingsTabFromUrl(event.urlAfterRedirects);
        })
    );

    this.getRestaurantTables();
    this.loadDashboardWaitlist();

    this.refreshSub =
      this.notificationService.restaurantRefresh$.subscribe(() => {
        this.getRestaurantTables();
        this.loadDashboardWaitlist();
      });
  }

  toggleSettingsMenu(): void {
    if (this.activeRoute !== 'settings') {
      this.openSettingsTab('profile');
      return;
    }

    this.showSettingsMenu = !this.showSettingsMenu;
  }

  openSettingsTab(tab: SettingsTab): void {
    this.activeSettingsTab = tab;
    this.activeRoute = 'settings';
    this.showSettingsMenu = true;

    this.router.navigate(['/restaurant/settings'], {
      queryParams: {
        tab
      },
      queryParamsHandling: 'merge'
    });
  }

  navigate(route: string): void {
    this.activeRoute = route;

    if (route !== 'settings') {
      this.showSettingsMenu = false;
    }

    this.router.navigate(['/restaurant', route]);
  }

  setActiveRouteFromUrl(url: string): void {
    const cleanUrl = url.split('?')[0];
    const segments = cleanUrl.split('/').filter(Boolean);

    this.activeRoute =
      segments[segments.length - 1] || 'waitlist';

    this.showSettingsMenu =
      this.activeRoute === 'settings';
  }

  readSettingsTabFromUrl(url: string): void {
    const queryString = url.split('?')[1];

    if (!queryString) {
      this.activeSettingsTab = 'profile';
      return;
    }

    const params = new URLSearchParams(queryString);
    const tab = params.get('tab') as SettingsTab | null;

    const validTabs: SettingsTab[] = [
      'profile',
      'notification',
      'waitlist',
      'tables',
      'holiday',
      'advanced'
    ];

    this.activeSettingsTab =
      tab && validTabs.includes(tab) ? tab : 'profile';
  }

  getRestaurantTables(): void {
    this.waitlistService
      .getRestaurantTableslist(this.restaurantId)
      .subscribe({
        next: response => {
          this.tables = response?.data || [];

          this.openTablesCount = this.tables.filter(
            (table: any) => table.status === 'OPEN'
          ).length;
        },
        error: () => {
          console.error('Unable to load restaurant tables');
        }
      });
  }

  loadDashboardWaitlist(): void {
    this.isLoading = true;

    this.waitlistService
      .getDashboardStatus(this.restaurantId)
      .subscribe({
        next: response => {
          this.isLoading = false;

          if (response?.success) {
            this.guestCount = (response.data || []).filter(
              (guest: any) =>
                guest.status === 'PENDING' ||
                guest.status === 'WAITING' ||
                guest.status === 'NOTIFIED'
            ).length;
          }
        },
        error: () => {
          this.isLoading = false;
          console.error('Unable to load dashboard waitlist');
        }
      });
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showUserMenu = false;
  }

  logoutFromMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.logout();
  }

  logout(): void {
    this.showUserMenu = false;

    localStorage.removeItem('authToken');

    this.router.navigate(['/login']);
  }

  get capacityPercent(): number {
    return Math.round((43 / 60) * 100);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.refreshSub?.unsubscribe();
  }
}