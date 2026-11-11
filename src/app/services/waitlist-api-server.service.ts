import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';

import { environment } from 'src/environments/environment.prod';
import {
  ServerApiResponse,
  ServerAssignedTable,
  ServerNotificationPage,
  ServerUnreadCount
} from '../models/waitlist-server.model';
import { WaitlistAuthService } from './waitlist-auth.service';

@Injectable({
  providedIn: 'root'
})
export class WaitlistApiServerService {

  private readonly baseUrl = environment.apiUrl;

  /** null until the first unread-count response arrives. */
  private readonly unreadCountSubject =
    new BehaviorSubject<number | null>(null);

  readonly unreadCount$ =
    this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private auth: WaitlistAuthService
  ) { }

  getMyTables(): Observable<ServerAssignedTable[]> {

    return this.http
      .get<ServerApiResponse<ServerAssignedTable[]>>(
        `${this.mePath}/tables`
      )
      .pipe(
        map(response => response?.data ?? [])
      );
  }

  saveOrderNotes(
    waitlistId: number,
    orderNotes: string
  ): Observable<ServerAssignedTable> {

    return this.http
      .post<ServerApiResponse<ServerAssignedTable>>(
        `${this.mePath}/tables/${waitlistId}/notes`,
        { orderNotes }
      )
      .pipe(
        map(response => response.data)
      );
  }

  getNotifications(
    page: number,
    size: number
  ): Observable<ServerNotificationPage> {

    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http
      .get<ServerApiResponse<ServerNotificationPage>>(
        `${this.mePath}/notifications`,
        { params }
      )
      .pipe(
        map(response => response.data)
      );
  }

  refreshUnreadCount(): Observable<number> {

    return this.http
      .get<ServerApiResponse<ServerUnreadCount>>(
        `${this.mePath}/notifications/unread-count`
      )
      .pipe(
        map(response => response?.data?.unreadCount ?? 0),
        tap(count => this.unreadCountSubject.next(count))
      );
  }

  markNotificationRead(
    notificationId: number
  ): Observable<ServerApiResponse<void>> {

    return this.http.post<ServerApiResponse<void>>(
      `${this.mePath}/notifications/${notificationId}/read`,
      {}
    );
  }

  private get mePath(): string {

    const restaurantId =
      this.auth.getServerUser()?.restaurantId ?? 0;

    return `${this.baseUrl}/restaurants/${restaurantId}/servers/me`;
  }
}
