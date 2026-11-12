import {
  Component,
  HostListener,
  Input
} from '@angular/core';

import { Router } from '@angular/router';

import { WaitlistAuthService } from 'src/app/services/waitlist-auth.service';
import { AdminLocationContextService } from 'src/app/services/admin-location-context.service';

export type PortalName = 'admin' | 'restaurant' | 'guest';

/**
 * Admin-only quick switcher: lets anyone with an active admin session jump
 * between the Admin, Restaurant and Guest portals in the same tab, without
 * a separate login. Shown on every portal's navbar; each instance just
 * hides the option matching the portal it's already on. Visibility is
 * driven entirely by WaitlistAuthService.canShowPortalSwitcher(), which
 * checks for an admin session in storage -- independent of which portal's
 * UI happens to be rendering it.
 */
@Component({
  selector: 'app-portal-switch-button',
  templateUrl: './portal-switch-button.component.html',
  styleUrls: ['./portal-switch-button.component.css']
})
export class PortalSwitchButtonComponent {

  /** Which portal this instance is rendered on, so it can hide its own entry. */
  @Input() currentPortal: PortalName = 'admin';

  showMenu = false;

  constructor(
    private router: Router,
    private authService: WaitlistAuthService,
    private locationContext: AdminLocationContextService
  ) { }

  get canShow(): boolean {
    return this.authService.canShowPortalSwitcher();
  }

  toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.showMenu = !this.showMenu;
  }

  goToAdmin(event: MouseEvent): void {
    event.stopPropagation();
    this.showMenu = false;
    this.router.navigate(['/admin/home']);
  }

  goToRestaurant(event: MouseEvent): void {
    event.stopPropagation();
    this.showMenu = false;

    const location = this.locationContext.getCurrentLocation();

    this.authService.switchAdminToRestaurant(
      location?.id,
      location?.name
    );

    this.router.navigate(['/restaurant/waitlist']);
  }

  goToGuest(event: MouseEvent): void {
    event.stopPropagation();
    this.showMenu = false;
    this.router.navigate(['/user']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('.portal-switch-wrapper')) {
      this.showMenu = false;
    }
  }
}
