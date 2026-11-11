import {
  Injectable
} from '@angular/core';

import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';

import {
  Observable
} from 'rxjs';

@Injectable()
export class CustomerAuthInterceptor
  implements HttpInterceptor {

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    const token =
      localStorage.getItem(
        'dinerlyCustomerToken'
      );

    if (!token) {
      return next.handle(request);
    }

    /**
     * Restrict token attachment to customer
     * protected APIs when needed.
     */
    const isProtectedCustomerRequest =
      request.url.includes(
        '/api/customers'
      ) ||
      request.url.includes(
        '/api/offers'
      ) ||
      request.url.includes(
        '/api/rewards'
      ) ||
      request.url.includes(
        '/api/menu'
      );

    if (!isProtectedCustomerRequest) {
      return next.handle(request);
    }

    const authenticatedRequest =
      request.clone({
        setHeaders: {
          Authorization:
            `Bearer ${token}`
        }
      });

    return next.handle(
      authenticatedRequest
    );
  }
}