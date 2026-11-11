import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { WaitlistAuthService } from './waitlist-auth.service';
import { Observable } from 'rxjs';
import { AdvancedSettingsResponse, ApiResponse, CreateHolidayRequest, HolidaySettingsResponse, NotificationSettingsResponse, SettingsProfileResponse, UpdateAdvancedSettingsRequest, UpdateNotificationRequest, UpdateProfileRequest, UpdateWaitlistSettingsRequest, WaitlistSettingsResponse } from '../models/waitlist-settings.model';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  private readonly baseUrl = environment.apiUrl;
  constructor(private http: HttpClient, private auth: WaitlistAuthService) { }

  settingProfile(

    restaurantId: string,

    year: string,

    month: string

  ): Observable<ApiResponse<SettingsProfileResponse>> {

    let params = new HttpParams();

    if (year) {

      params = params.set('year', year);

    }

    if (month) {

      params = params.set('month', month);

    }

    return this.http.get<ApiResponse<SettingsProfileResponse>>(

      `${this.baseUrl}/settings/${restaurantId}/profile`,

      {

        headers: this.getHeaders(),

        params

      }

    );

  }

  settingNotification(

    restaurantId: string

  ): Observable<ApiResponse<NotificationSettingsResponse>> {

    return this.http.get<ApiResponse<NotificationSettingsResponse>>(

      `${this.baseUrl}/settings/${restaurantId}/notifications`,

      {

        headers: this.getHeaders()

      }

    );

  }

  waitlistSettings(

    restaurantId: string

  ): Observable<ApiResponse<WaitlistSettingsResponse>> {

    return this.http.get<ApiResponse<WaitlistSettingsResponse>>(

      `${this.baseUrl}/settings/${restaurantId}/waitlist-settings`,

      {

        headers: this.getHeaders()

      }

    );

  }

  settingsHolidaySchedule(

    restaurantId: string

  ): Observable<ApiResponse<HolidaySettingsResponse>> {

    return this.http.get<ApiResponse<HolidaySettingsResponse>>(

      `${this.baseUrl}/settings/${restaurantId}/holiday-hours`,

      {

        headers: this.getHeaders()

      }

    );

  }

  advancedsettings(

    restaurantId: string

  ): Observable<ApiResponse<AdvancedSettingsResponse>> {

    return this.http.get<ApiResponse<AdvancedSettingsResponse>>(

      `${this.baseUrl}/settings/${restaurantId}/advanced`,

      {

        headers: this.getHeaders()

      }

    );

  }

  restaurantQrCode(

    restaurantId: string

  ): Observable<Blob> {

    return this.http.get(

      `${this.baseUrl}/settings/${restaurantId}/qr-code`,

      {

        responseType: 'blob',headers:this.getHeaders()

      }

    );

  }

  /* =====================================================
   UPDATE PROFILE
===================================================== */

updateSettingProfile(
  restaurantId: string,
  payload: UpdateProfileRequest
): Observable<ApiResponse<any>> {

  return this.http.put<ApiResponse<any>>(
    `${this.baseUrl}/settings/${restaurantId}/profile`,
    payload,
    {
      headers: this.getHeaders()
    }
  );
}

/* =====================================================
   UPDATE NOTIFICATIONS
===================================================== */

updateSettingNotification(
  restaurantId: string,
  payload: UpdateNotificationRequest
): Observable<ApiResponse<any>> {

  return this.http.put<ApiResponse<any>>(
    `${this.baseUrl}/settings/${restaurantId}/notifications`,
    payload,
    {
      headers: this.getHeaders()
    }
  );
}

/* =====================================================
   UPDATE WAITLIST SETTINGS
===================================================== */

updateWaitlistSettings(
  restaurantId: string,
  payload: UpdateWaitlistSettingsRequest
): Observable<ApiResponse<any>> {

  return this.http.put<ApiResponse<any>>(
    `${this.baseUrl}/settings/${restaurantId}/waitlist-settings`,
    payload,
    {
      headers: this.getHeaders()
    }
  );
}

/* =====================================================
   UPDATE ADVANCED SETTINGS
===================================================== */

updateAdvancedSettings(
  restaurantId: string,
  payload: UpdateAdvancedSettingsRequest
): Observable<ApiResponse<any>> {

  return this.http.put<ApiResponse<any>>(
    `${this.baseUrl}/settings/${restaurantId}/advanced`,
    payload,
    {
      headers: this.getHeaders()
    }
  );
}

/* =====================================================
   CREATE HOLIDAY
===================================================== */

createHolidaySchedule(
  restaurantId: string,
  payload: CreateHolidayRequest
): Observable<ApiResponse<any>> {

  return this.http.post<ApiResponse<any>>(
    `${this.baseUrl}/settings/${restaurantId}/holiday-hours`,
    payload,
    {
      headers: this.getHeaders()
    }
  );
}

  private getHeaders(): HttpHeaders {

    const token = this.auth.getRestaurantToken();

    return new HttpHeaders({

      Authorization: `Bearer ${token}`

    });

  }


}
