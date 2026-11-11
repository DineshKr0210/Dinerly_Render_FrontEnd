import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { OffersResponse, PortalOffer } from 'src/app/models/guest-portal.model';
import { RedeemOfferResponse, RestaurantResponse } from 'src/app/models/waitlist-api-guest-to-restaurant.model';
import { environment } from 'src/environments/environment.prod';
import { WaitlistAuthService } from '../waitlist-auth.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private readonly baseUrl = `${environment.apiUrl}`;

  constructor(

    private http: HttpClient, private auth: WaitlistAuthService

  ) { }

  private getRestaurantHeaders():
    HttpHeaders {

    const token =
      this.auth.getGuestToken();

    if (!token) {
      console.warn(
        'Restaurant token is missing'
      );
    }

    return new HttpHeaders({
      Authorization:
        `Bearer ${token || ''}`
    });
  }

  getRestaurantDetails(): Observable<RestaurantResponse> {

    return this.http.get<RestaurantResponse>(`${this.baseUrl}/waitlist/restaurants`);
  }

  getOffers(
    locationId: number,
    status: string,
    page: number,
    size: number
  ): Observable<any> {

    const headers =
      this.getRestaurantHeaders();
    const params = new HttpParams()
      .set('locationId', locationId.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(
      `${this.baseUrl}/offers`,
      { params, headers }
    );
  }

  getOfferById(id: number): Observable<PortalOffer> {

    return this.http.get<PortalOffer>(`${this.baseUrl}/${id}`);
  }

  redeemOffer(offerId: number, locationId: number): Observable<RedeemOfferResponse> {
    return this.http.post<RedeemOfferResponse>(
      `${this.baseUrl}/offers/${offerId}/redeem`,
      {},
      {
        headers: this.getRestaurantHeaders(),
        params: { locationId: locationId.toString() }
      }
    );
  }
}
