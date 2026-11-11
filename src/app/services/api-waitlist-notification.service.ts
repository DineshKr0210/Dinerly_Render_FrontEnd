import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { WaitlistAuthService } from './waitlist-auth.service';
import { NotificationApiResponse, sendNotificationRequest } from '../models/notification.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiWaitlistNotificationService {

  private readonly baseUrl = environment.apiUrl;
  constructor(private http: HttpClient, private auth: WaitlistAuthService) { }


  getNotificationsSummary(restaurantId: string | number): Observable<any> {
    const token = this.auth.getRestaurantToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    
    return this.http.get<NotificationApiResponse>(`${this.baseUrl}/restaurants/${restaurantId}/notifications/summary`, {  headers });
  }


  getNotifications(
    restaurantId: string | number, page: number, size: number, search: string, status: string,date:string): Observable<any> {
    const token = this.auth.getRestaurantToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    let params = new HttpParams().set('page', page).set('size', size).set('search', search).set('status', status).set('date',date)

    return this.http.get<NotificationApiResponse>(`${this.baseUrl}/restaurants/${restaurantId}/notifications`, { params, headers });
  }

  sendNoficationToGuest(restaurantId: number, waitlistId: number, payload: sendNotificationRequest): Observable<any> {
    const token = this.auth.getRestaurantToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post(`${this.baseUrl}/restaurants/${restaurantId}/notifications/${waitlistId}/send-sms`, payload, { headers });
  }
}
