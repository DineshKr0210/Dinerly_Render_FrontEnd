import {
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import {
  EMPTY,
  Subscription,
  catchError,
  filter,
  switchMap,
  timer
} from 'rxjs';

import { ThemeService } from 'src/app/services/theme.service';
import { ToastService } from 'src/app/services/toast.service';
import { WaitlistAuthService } from 'src/app/services/waitlist-auth.service';
import { WaitlistApiServerService } from 'src/app/services/waitlist-api-server.service';

const UNREAD_POLL_MS = 30000;

@Component({
  selector: 'app-waitlist-server',
  templateUrl: './waitlist-server.component.html',
  styleUrls: ['./waitlist-server.component.css']
})
export class WaitlistServerComponent implements OnInit, OnDestroy {
  /** Sidebar hidden with the navbar toggle (desktop). */
  sidebarHidden = false;

  /** Logo click: back to the default landing page. */
  goToLanding(): void {
    this.router.navigate(['/server/tables']);
  }

  toggleSidebarVisibility(): void {
    this.sidebarHidden = !this.sidebarHidden;
  }


  activeRoute = 'tables';

  unreadCount: number | null = null;

  showUserMenu = false;

  get userName(): string {
    return this.auth.getServerUser()?.name || 'Server';
  }

  get restaurantName(): string {
    return this.auth.getServerUser()?.restaurantName || 'Restaurant';
  }

  private previousUnread: number | null = null;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private auth: WaitlistAuthService,
    private api: WaitlistApiServerService,
    private themeService: ThemeService,
    private toast: ToastService
  ) { }

  get isDarkMode(): boolean {
    return this.themeService.isDark;
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  ngOnInit(): void {
    this.setActiveRouteFromUrl(this.router.url);

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
        })
    );

    this.subscriptions.add(
      this.api.unreadCount$.subscribe(count => {
        this.unreadCount = count;
        this.notifyIfNew(count);
      })
    );

    this.subscriptions.add(
      timer(0, UNREAD_POLL_MS)
        .pipe(
          switchMap(() =>
            this.api.refreshUnreadCount().pipe(
              catchError(() => EMPTY)
            )
          )
        )
        .subscribe()
    );
  }

  navigate(route: 'tables' | 'notifications'): void {
    this.router.navigate(['/server', route]);
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  @HostListener('document:click')
  closeUserMenu(): void {
    this.showUserMenu = false;
  }

  logout(event: MouseEvent): void {
    event.stopPropagation();
    this.showUserMenu = false;
    this.auth.signOutServer();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /** Toasts only for new notifications, never on the first load. */
  private notifyIfNew(count: number | null): void {
    if (count === null) {
      return;
    }

    if (
      this.previousUnread !== null &&
      count > this.previousUnread
    ) {
      const newCount = count - this.previousUnread;

      this.toast.info(
        newCount === 1
          ? 'You have a new table notification.'
          : `You have ${newCount} new table notifications.`
      );
    }

    this.previousUnread = count;
  }

  private setActiveRouteFromUrl(url: string): void {
    this.activeRoute = url.includes('/notifications')
      ? 'notifications'
      : 'tables';
  }
}
