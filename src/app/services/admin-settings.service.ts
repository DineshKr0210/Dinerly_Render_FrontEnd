import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AdvancedSettingsResponse, ApiResponse, CreateHolidayRequest, HolidaySettingsResponse, NotificationSettingsResponse, SettingsProfileResponse, UpdateAdvancedSettingsRequest, UpdateNotificationRequest, UpdateProfileRequest, UpdateWaitlistSettingsRequest, WaitlistSettingsResponse } from '../models/waitlist-settings.model';
import { Observable } from 'rxjs';
import { WaitlistAuthService } from './waitlist-auth.service';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class AdminSettingsService {

  private readonly baseUrl = environment.apiUrl;
    constructor(private http: HttpClient, private auth: WaitlistAuthService) { }
  
    settingProfile(
  
      restaurantId: any,
  
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
  
        `${this.baseUrl}/admin/settings/${restaurantId}/profile`,
  
        {
  
          headers: this.getHeaders(),
  
          params
  
        }
  
      );
  
    }
  
    settingNotification(
  
      restaurantId: any
  
    ): Observable<ApiResponse<NotificationSettingsResponse>> {
  
      return this.http.get<ApiResponse<NotificationSettingsResponse>>(
  
        `${this.baseUrl}/admin/settings/${restaurantId}/notifications`,
  
        {
  
          headers: this.getHeaders()
  
        }
  
      );
  
    }
  
    waitlistSettings(
  
      restaurantId: any
  
    ): Observable<ApiResponse<WaitlistSettingsResponse>> {
  
      return this.http.get<ApiResponse<WaitlistSettingsResponse>>(
  
        `${this.baseUrl}/admin/settings/${restaurantId}/waitlist-settings`,
  
        {
  
          headers: this.getHeaders()
  
        }
  
      );
  
    }
  
    settingsHolidaySchedule(
  
      restaurantId: any
  
    ): Observable<ApiResponse<HolidaySettingsResponse>> {
  
      return this.http.get<ApiResponse<HolidaySettingsResponse>>(
  
        `${this.baseUrl}/admin/settings/${restaurantId}/holiday-hours`,
  
        {
  
          headers: this.getHeaders()
  
        }
  
      );
  
    }
  
    advancedsettings(
  
      restaurantId: any
  
    ): Observable<ApiResponse<AdvancedSettingsResponse>> {
  
      return this.http.get<ApiResponse<AdvancedSettingsResponse>>(
  
        `${this.baseUrl}/admin/settings/${restaurantId}/advanced`,
  
        {
  
          headers: this.getHeaders()
  
        }
  
      );
  
    }
  
    restaurantQrCode(
  
      restaurantId: any
  
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
    restaurantId: any,
    payload: UpdateProfileRequest
  ): Observable<ApiResponse<any>> {
  
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/admin/settings/${restaurantId}/profile`,
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
    restaurantId: any,
    payload: UpdateNotificationRequest
  ): Observable<ApiResponse<any>> {
  
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/admin/settings/${restaurantId}/notifications`,
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
    restaurantId: any,
    payload: UpdateWaitlistSettingsRequest
  ): Observable<ApiResponse<any>> {
  
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/admin/settings/${restaurantId}/waitlist-settings`,
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
    restaurantId: any,
    payload: UpdateAdvancedSettingsRequest
  ): Observable<ApiResponse<any>> {
  
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/admin/settings/${restaurantId}/advanced`,
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
    restaurantId: any,
    payload: CreateHolidayRequest
  ): Observable<ApiResponse<any>> {
  
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/admin/settings/${restaurantId}/holiday-hours`,
      payload,
      {
        headers: this.getHeaders()
      }
    );
  }
  
    private getHeaders(): HttpHeaders {
  
      const token = this.auth.getAdminToken();
  
      return new HttpHeaders({
  
        Authorization: `Bearer ${token}`
  
      });
  
    }
  
}
