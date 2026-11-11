import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  UrlTree
} from '@angular/router';

import {
  WaitlistAuthService,
  AuthScope
} from '../services/waitlist-auth.service';

@Injectable({
  providedIn: 'root'
})
export class WaitlistAuthGuard implements CanActivate {

  constructor(
    private auth: WaitlistAuthService,
    private router: Router
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot
  ): boolean | UrlTree {

    const scope =
      route.data['scope'] as AuthScope;

    switch (scope) {

      case 'restaurant':
        return this.canAccessRestaurant();

      case 'admin':
        return this.canAccessAdmin();

      case 'server':
        return this.canAccessServer();

      case 'guest':
        return this.canAccessGuest();

      default:
        return this.router.createUrlTree([
          '/login/restaurant'
        ]);
    }
  }

  private canAccessServer():
    boolean | UrlTree {

    if (
      !this.auth.isServerLoggedIn()
    ) {
      return this.router.createUrlTree([
        '/login/restaurant'
      ]);
    }

    const user =
      this.auth.getServerUser();

    if (
      !user ||
      !this.auth.isServerUser(user)
    ) {
      this.auth.signOutServer(false);

      return this.router.createUrlTree([
        '/login/restaurant'
      ]);
    }

    return true;
  }

  private canAccessRestaurant():
    boolean | UrlTree {

    if (
      !this.auth.isRestaurantLoggedIn()
    ) {
      return this.router.createUrlTree([
        '/login/restaurant'
      ]);
    }

    const user =
      this.auth.getRestaurantUser();

    if (
      !user ||
      !this.auth.isRestaurantUser(user)
    ) {
      this.auth.signOutRestaurant(false);

      return this.router.createUrlTree([
        '/login/restaurant'
      ]);
    }

    return true;
  }

  private canAccessAdmin():
    boolean | UrlTree {

    if (
      !this.auth.isAdminLoggedIn()
    ) {
      return this.router.createUrlTree([
        '/login/admin'
      ]);
    }

    const user =
      this.auth.getAdminUser();

    if (
      !user ||
      !this.auth.isAdminUser(user)
    ) {
      this.auth.signOutAdmin(false);

      return this.router.createUrlTree([
        '/login/admin'
      ]);
    }

    return true;
  }

  private canAccessGuest():
    boolean | UrlTree {

    if (
      !this.auth.isGuestLoggedIn()
    ) {
      return this.router.createUrlTree([
        '/user'
      ]);
    }

    const user =
      this.auth.getGuestUser();

    if (!user) {
      this.auth.signOutGuest(false);

      return this.router.createUrlTree([
        '/user'
      ]);
    }

    return true;
  }
}