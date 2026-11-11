import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import {
  Observable,
  catchError,
  throwError
} from 'rxjs';

import {
  WaitlistAuthService
} from '../services/waitlist-auth.service';

@Injectable()
export class AuthInterceptor
  implements HttpInterceptor {

  private readonly publicApiPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/verify-email',
    '/admin/staff/verify-invitation',
    '/admin/staff/check-invitation-token',
    '/admin/staff/set-password'
  ];

  constructor(
    private auth: WaitlistAuthService
  ) { }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    if (this.isPublicEndpoint(req.url)) {
      return next.handle(req);
    }

    const token =
      this.getTokenForRequest(req.url);

    let request = req;

    if (
      token &&
      !req.headers.has('Authorization')
    ) {
      request = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError(
        (error: HttpErrorResponse) => {

          if (error.status === 401) {
            this.handleUnauthorized(
              req.url
            );
          }

          return throwError(
            () => error
          );
        }
      )
    );
  }

  private isPublicEndpoint(
    url: string
  ): boolean {

    return this.publicApiPaths.some(
      path => url.includes(path)
    );
  }

  private getTokenForRequest(
    url: string
  ): string | null {

    if (
      url.includes('/servers/me/')
    ) {
      return this.auth.getServerToken();
    }

    if (
      url.includes('/admin/')
    ) {
      return (
        this.auth.getAdminToken() ||
        this.auth.getRestaurantToken()
      );
    }

    if (
      url.includes('/restaurants/')
    ) {
      return (
        this.auth.getRestaurantToken() ||
        this.auth.getAdminToken()
      );
    }

    if (
      url.includes('/waitlist') ||
      url.includes('/feedback')
    ) {
      return (
        this.auth.getGuestToken() ||
        this.auth.getRestaurantToken() ||
        this.auth.getAdminToken()
      );
    }

    return null;
  }

  private handleUnauthorized(
    url: string
  ): void {

    if (
      url.includes('/servers/me/')
    ) {
      this.auth.signOutServer(false);

      return;
    }

    if (
      url.includes('/admin/')
    ) {
      if (this.auth.isAdminLoggedIn()) {
        this.auth.signOutAdmin(false);
      } else {
        this.auth.signOutRestaurant(false);
      }

      return;
    }

    if (
      url.includes('/restaurants/')
    ) {
      if (this.auth.isRestaurantLoggedIn()) {
        this.auth.signOutRestaurant(false);
      } else {
        this.auth.signOutAdmin(false);
      }

      return;
    }

    if (
      url.includes('/waitlist') ||
      url.includes('/feedback')
    ) {
      this.auth.signOutGuest(false);
    }
  }
}