import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';
import { WaitlistAuthService } from './waitlist-auth.service';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminLocationRequest, AdminLocationResponse, AdminLocationsResponse,
  AdminReportsResponse,
  AdvancedResponse, AdvancedSettings, AvailabilityResponse, CategoryRequest, CategoryResponse, CheckStaffInvitationTokenRequest, CheckStaffInvitationTokenResponse, CreateRewardEarningRuleRequest
  , CreateStaffRequest, CustomersResponse,
  DashboardApiResponse, Dish, DishRequest, DishResponse, GenerateReportResponse, GuestHistoryResponse, HolidayHourRequest, HolidayHoursResponse,
  InsightsFeedResponse,
  MarketingCampaignRequest, MarketingCampaignSendRequest, MarketingTemplateRequest, MarketingTemplateUpdateRequest, MenuApiResponse, MenuCategoriesResponse, NotificationsData,
  NotificationsResponse, OfferCategoryResponse, OfferListResponse, OfferPageResponse, OfferRequest, OfferResponse, PerformancePeriod, ProfileResponse, ProfileUpdateRequest,
  RedemptionsResponse, ReviewReplyRequest, ReviewsPerformanceResponse, ReviewsResponse, RewardApiResponse, RewardEarningRule, RewardEarningRulesResponse, RewardItemListResponse, RewardItemRequest, RewardItemResponse, RewardSettings, RewardSettingsResponse, RewardsOffersPerformanceResponse, RewardTier,
  RewardTierRequest,
  RewardTiersResponse,
  SetStaffPasswordRequest,
  SetStaffPasswordResponse,
  SettingsHolidayHourRequest, SettingsHolidayHoursResponse, StaffActivityResponse, StaffApiResponse, StaffListResponse, StaffPermissionResponse,
  StaffResponse, StaffRolesResponse, SummaryCustomerResponse, UpdateRewardEarningRuleRequest, UpdateRewardSettingsRequest, UpdateStaffPermissionRequest, UpdateStaffRequest, VerifyStaffInvitationRequest,
  VerifyStaffInvitationResponse, WaitlistPerformanceResponse, WaitlistSettings, WaitlistSettingsResponse
} from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class WaitListAdminService {

  private readonly baseUrl = environment.apiUrl;

  private readonly categoriesUrl =

    `${environment.apiUrl}/admin/menu/categories`;

  private dishByCategoryUrl = `${environment.apiUrl}/admin/menu/dishes/category`

  private readonly dishesUrl =

    `${environment.apiUrl}/admin/menu/dishes`;

  private readonly staffUrl =

    `${environment.apiUrl}/admin/staff`;

  private readonly offersUrl =

    `${environment.apiUrl}/admin/offers`;

  constructor(private http: HttpClient, private auth: WaitlistAuthService) { }

  getRestaurantGuestHistory(restaurantId: number, page: number, size: number, status: string, date: string): Observable<any> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }
    if (date) {
      params = params.set('date', date);
    }
    if (page) {
      params = params.set('page', page);
    }
    if (size) {
      params = params.set('size', size);
    }
    return this.http.get<GuestHistoryResponse>(`${this.baseUrl}/admin/${restaurantId}/guest-history`, { headers, params });
  }

  // download guest history as csv api 

  exportGuestHistoryCsv(restaurantId: number, status: string, date: string): Observable<any> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }
    if (date) {
      params = params.set('date', date);
    }

    return this.http.get(
      `${this.baseUrl}/admin/${restaurantId}/guest-history/export`, { headers, params, responseType: 'blob' });
  }

  //reports api

  getAdminReports(
    page: number = 0,
    size: number = 20
  ): Observable<AdminReportsResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<AdminReportsResponse>(
      `${this.baseUrl}/admin/reports`,
      {
        headers,
        params
      }
    );
  }

  generateAdminReport(
    type: 'overall' | 'location',
    locationId?: number,
    period?: string,
    startDate?: string,
    endDate?: string
  ): Observable<GenerateReportResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    let params = new HttpParams()
      .set('type', type);

    if (
      type === 'location' &&
      locationId !== undefined &&
      locationId !== null
    ) {
      params = params.set(
        'locationId',
        locationId.toString()
      );
    }

    if (period) {
      params = params.set(
        'period',
        period
      );
    }

    if (startDate) {
      params = params.set(
        'startDate',
        startDate
      );
    }

    if (endDate) {
      params = params.set(
        'endDate',
        endDate
      );
    }

    return this.http.post<GenerateReportResponse>(
      `${this.baseUrl}/admin/reports/generate`,
      null,
      {
        headers,
        params
      }
    );
  }

  downloadAdminReport(
    reportId: number
  ): Observable<Blob> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get(
      `${this.baseUrl}/admin/reports/${reportId}/download`,
      {
        headers,
        responseType: 'blob'
      }
    );
  }

  //-----------------------DASHBOARD---------------------------------------------------


  getDashBoardData(
    locationId?: number,
    topN: number = 5
  ): Observable<DashboardApiResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    let params = new HttpParams()
      .set('topN', topN.toString());

    if (locationId !== undefined && locationId !== null) {
      params = params.set('locationId', locationId.toString());
    }

    return this.http.get<DashboardApiResponse>(
      `${this.baseUrl}/admin/dashboard`,
      {
        headers,
        params
      }
    );
  }

  getInsightsFeed() {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<InsightsFeedResponse>(
      `${this.baseUrl}/admin/dashboard/insights-feed`, { headers }
    );
  }

  // --------------------------------------------locations API-----------------------------------------

  getLocations(): Observable<AdminLocationsResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<AdminLocationsResponse>(`${this.baseUrl}/admin/locations`, { headers });
  }

  // GET LOCATION BY ID

  getLocationById(locationId: number): Observable<AdminLocationResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<AdminLocationResponse>(`${this.baseUrl}/admin/locations/${locationId}`, { headers });
  }

  // POST
  createLocation(payload: AdminLocationRequest): Observable<AdminLocationResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<AdminLocationResponse>(`${this.baseUrl}/admin/locations`, payload, { headers });

  }



  //  * PUT

  updateLocation(locationId: number, payload: AdminLocationRequest): Observable<AdminLocationResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put<AdminLocationResponse>(`${this.baseUrl}/admin/locations/${locationId}`, payload, { headers });

  }


  // --------------------------------------------DISH MENU-----------------------------------------

  getCategories(locationId: number): Observable<MenuCategoriesResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const params = new HttpParams().set(
      'locationId',
      locationId.toString()
    );

    return this.http.get<MenuCategoriesResponse>(
      this.categoriesUrl,
      {
        params,
        headers
      }
    );
  }

  getDishesByCategory(categoryName: string, locationId: any): Observable<Dish[]> {
    const token = this.auth.getAdminToken();

    const params = new HttpParams().set(
      'locationId',
      locationId.toString()
    );

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<Dish[]>(
      `${this.dishByCategoryUrl}/${encodeURIComponent(categoryName)}`,
      { headers, params }
    );
  }

  createDish(

    request: DishRequest

  ): Observable<DishResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const formData =

      this.createDishFormData(request);

    return this.http.post<DishResponse>(

      this.dishesUrl,

      formData, { headers }

    );

  }

  updateDish(

    dishId: number,

    request: DishRequest

  ): Observable<DishResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const formData =

      this.createDishFormData(request);

    return this.http.put<DishResponse>(

      `${this.dishesUrl}/${dishId}`,

      formData, { headers }

    );

  }

  deleteDish(

    dishId: number,

    locationId: number

  ): Observable<MenuApiResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const params = new HttpParams()

      .set(

        'locationId',

        locationId.toString()

      )

      .set(

        'dishId',

        dishId.toString()

      );

    return this.http.delete<MenuApiResponse>(

      `${this.dishesUrl}/${dishId}`,

      { params, headers }

    );

  }

  restoreDish(

    dishId: number,

    locationId: number

  ): Observable<MenuApiResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    const params = new HttpParams()

      .set(

        'locationId',

        locationId.toString()

      )

      .set(

        'dishId',

        dishId.toString()

      );

    return this.http.put<MenuApiResponse>(

      `${this.dishesUrl}/${dishId}/restore`,

      {},

      { params, headers }

    );

  }





  createCategory(request: CategoryRequest): Observable<any> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post<any>(
      `${this.categoriesUrl}`,
      request,
      {
        headers
      }
    );
  }

  updateCategory(
    id: number,
    request: CategoryRequest
  ): Observable<any> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put<any>(
      `${this.categoriesUrl}/${id}`,
      request,
      {
        headers
      }
    );
  }

  deleteCategory(
    id: number,
    locationId: number
  ): Observable<any> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.delete<any>(
      `${this.categoriesUrl}/${id}`,
      {
        headers,
        params: {
          locationId: locationId.toString()
        }
      }
    );
  }

  restoreCategory(
    id: number,
    locationId: number
  ): Observable<any> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put<any>(
      `${this.categoriesUrl}/${id}/restore`,
      null,
      {
        headers,
        params: {
          locationId: locationId.toString()
        }
      }
    );
  }





  private createDishFormData(request: DishRequest): FormData {
    const formData = new FormData();

    formData.append('dishName', request.dishName);
    formData.append('locationId', request.locationId.toString());
    formData.append('categoryName', request.categoryName);

    request.typeNames.forEach(typeName => {
      formData.append('typeNames', typeName);
    });

    formData.append('price', request.price.toString());
    formData.append('calories', request.calories.toString());
    formData.append('description', request.description);
    formData.append('locationId', request.locationId.toString());

    if (request.image) {
      formData.append('image', request.image, request.image.name);
    }

    return formData;
  }


  // ---------------------------------------------ADMIN STAFF--------------------------------------

  getStaff(
    page: number = 0,
    size: number = 20
  ): Observable<StaffListResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<StaffListResponse>(
      `${this.baseUrl}/admin/staff`,
      {
        headers,
        params
      }
    );
  }

  getStaffById(
    staffId: number
  ): Observable<StaffResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<StaffResponse>(
      `${this.baseUrl}/admin/staff/${staffId}`,
      {
        headers
      }
    );
  }

  createStaff(
    request: CreateStaffRequest
  ): Observable<StaffResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<StaffResponse>(
      `${this.baseUrl}/admin/staff`,
      request,
      {
        headers
      }
    );
  }

  updateStaff(
    staffId: number,
    request: UpdateStaffRequest
  ): Observable<StaffResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<StaffResponse>(
      `${this.baseUrl}/admin/staff/${staffId}`,
      request,
      {
        headers
      }
    );
  }

  getStaffPermissions(
    staffId: number
  ): Observable<StaffPermissionResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<StaffPermissionResponse>(
      `${this.baseUrl}/admin/staff/${staffId}/permissions`,
      {
        headers
      }
    );
  }

  updateStaffPermissions(
    staffId: number,
    request: UpdateStaffPermissionRequest
  ): Observable<StaffPermissionResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<StaffPermissionResponse>(
      `${this.baseUrl}/admin/staff/${staffId}/permissions`,
      request,
      {
        headers
      }
    );
  }

  getStaffActivityLog(
    staffId: number,
    page: number = 0,
    size: number = 20
  ): Observable<StaffActivityResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<StaffActivityResponse>(
      `${this.baseUrl}/admin/staff/${staffId}/activity-log`,
      {
        headers,
        params
      }
    );
  }

  getStaffActivity(
    page: number = 0,
    size: number = 20
  ): Observable<StaffActivityResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<StaffActivityResponse>(
      `${this.baseUrl}/admin/staff/activity-log`,
      {
        headers,
        params
      }
    );
  }

  deactivateStaff(
    staffId: number
  ): Observable<StaffResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.patch<StaffResponse>(
      `${this.baseUrl}/admin/staff/${staffId}/deactivate`,
      {},
      {
        headers
      }
    );
  }

  activateStaff(
    staffId: number
  ): Observable<StaffResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.patch<StaffResponse>(
      `${this.baseUrl}/admin/staff/${staffId}/activate`,
      {},
      {
        headers
      }
    );
  }

  verifyStaffInvitation(
    request: VerifyStaffInvitationRequest
  ): Observable<VerifyStaffInvitationResponse> {
    const params = new HttpParams()
      .set('token', request.token);
    return this.http.get<VerifyStaffInvitationResponse>(
      `${this.baseUrl}/admin/staff/verify-invitation`,
      { params }
    );
  }

  checkStaffInvitationToken(
    request: CheckStaffInvitationTokenRequest
  ): Observable<CheckStaffInvitationTokenResponse> {
    return this.http.post<CheckStaffInvitationTokenResponse>(
      `${this.baseUrl}/admin/staff/check-invitation-token`,
      request
    );
  }

  setStaffPassword(
    request: SetStaffPasswordRequest
  ): Observable<SetStaffPasswordResponse> {
    return this.http.post<SetStaffPasswordResponse>(
      `${this.baseUrl}/admin/staff/set-password`,
      request
    );
  }

  getStaffRoles(): Observable<StaffRolesResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<StaffRolesResponse>(
      `${this.baseUrl}/admin/staff/roles`,
      {
        headers
      }
    );
  }

  //--------------------------------------------REWARD PROGRAM---------------------------------------

  updateRewardTier(
    tierId: number,
    request: RewardTierRequest
  ): Observable<RewardApiResponse<RewardTier>> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<RewardApiResponse<RewardTier>>(
      `${this.baseUrl}/admin/rewards/tiers/${tierId}`,
      request,
      { headers }
    );
  }

  getRewardTiers(
    page: number = 0,
    size: number = 20
  ): Observable<RewardTiersResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<RewardTiersResponse>(
      `${this.baseUrl}/admin/rewards/tiers`,
      {
        headers,
        params
      }
    );
  }

  createRewardTier(
    request: RewardTierRequest
  ): Observable<RewardApiResponse<RewardTier>> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<RewardApiResponse<RewardTier>>(
      `${this.baseUrl}/admin/rewards/tiers`,
      request,
      { headers }
    );
  }

  deleteRewardTier(
    tierId: number
  ): Observable<RewardApiResponse<void>> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.delete<RewardApiResponse<void>>(
      `${this.baseUrl}/admin/rewards/tiers/${tierId}`,
      { headers }
    );
  }

  getRewardEarningRules(
    // restaurantId :number,
    // action: string,
    page: number = 0,
    size: number = 20
  ): Observable<RewardEarningRulesResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<RewardEarningRulesResponse>(
      `${this.baseUrl}/admin/points/earning-rules`,
      {
        headers,
        params
      }
    );
  }

  createRewardEarningRule(
    request: CreateRewardEarningRuleRequest
  ): Observable<RewardApiResponse<RewardEarningRule>> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<RewardApiResponse<RewardEarningRule>>(
      `${this.baseUrl}/admin/points/earning-rules`,
      request,
      { headers }
    );
  }

  updateRewardEarningRule(
    ruleId: number,
    request: UpdateRewardEarningRuleRequest
  ): Observable<RewardApiResponse<RewardEarningRule>> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<RewardApiResponse<RewardEarningRule>>(
      `${this.baseUrl}/admin/points/earning-rules/${ruleId}`,
      request,
      { headers }
    );
  }

  deleteRewardEarningRule(
    ruleId: number
  ): Observable<RewardApiResponse<void>> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.delete<RewardApiResponse<void>>(
      `${this.baseUrl}/admin/points/earning-rules/${ruleId}`,
      { headers }
    );
  }

  getRewardSettings(): Observable<RewardSettingsResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<RewardSettingsResponse>(
      `${this.baseUrl}/admin/rewards/settings`,
      { headers }
    );
  }

  updateRewardSettings(
    request: UpdateRewardSettingsRequest
  ): Observable<RewardApiResponse<RewardSettings>> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<RewardApiResponse<RewardSettings>>(
      `${this.baseUrl}/admin/rewards/settings`,
      request,
      { headers }
    );
  }

  getRewardItems(
    restaurantId: number,
    page: number = 0,
    size: number = 20,
    category?: string,
    available: boolean = true
  ): Observable<RewardItemListResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    let params = new HttpParams()
      .set('restaurantId', restaurantId.toString())
      .set('available', available.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    if (category) {
      params = params.set('category', category);
    }

    return this.http.get<RewardItemListResponse>(
      `${this.baseUrl}/admin/reward-items`,
      {
        headers,
        params
      }
    );
  }

  createRewardItem(
    request: RewardItemRequest
  ): Observable<RewardItemResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<RewardItemResponse>(
      `${this.baseUrl}/admin/reward-items`,
      request,
      { headers }
    );
  }

  updateRewardItem(
    itemId: number,
    request: RewardItemRequest
  ): Observable<RewardItemResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.put<RewardItemResponse>(
      `${this.baseUrl}/admin/reward-items/${itemId}`,
      request,
      { headers }
    );
  }

  deleteRewardItem(
    itemId: number
  ): Observable<any> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.delete(
      `${this.baseUrl}/admin/reward-items/${itemId}`,
      { headers }
    );
  }

  // --------------------------------------------------------- ADMIN OFFERS -----------------------------------------------------------

  getOffers(
    locationId: number,
    status: string,
    page: number,
    size: number
  ): Observable<OfferPageResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (locationId !== null && locationId !== undefined) {
      params = params.set(
        'locationId',
        locationId.toString()
      );
    }

    if (status) {
      params = params.set(
        'status',
        status
      );
    }

    return this.http.get<OfferPageResponse>(
      `${this.baseUrl}/admin/offers`,
      {
        params,
        headers
      }
    );
  }


  createOffer(

    request: OfferRequest

  ): Observable<OfferResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post<OfferResponse>(

      this.offersUrl,

      request, { headers }

    );

  }


  updateOffer(

    offerId: number,

    request: OfferRequest

  ): Observable<OfferResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put<OfferResponse>(

      `${this.offersUrl}/${offerId}`,

      request, { headers }

    );

  }



  deleteOffer(

    offerId: number

  ): Observable<any> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.delete(

      `${this.offersUrl}/${offerId}`, { headers }

    );

  }

  getOfferCategories(
    locationId?: number
  ): Observable<OfferCategoryResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    let params = new HttpParams();

    if (locationId !== undefined && locationId !== null) {
      params = params.set(
        'locationId',
        locationId.toString()
      );
    }

    return this.http.get<OfferCategoryResponse>(
      `${this.offersUrl}/categories`,
      {
        headers,
        params
      }
    );
  }

  getOffersByCategory(
    category: string,
    locationId?: number,
    page: number = 0,
    size: number = 20
  ): Observable<OfferListResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (
      locationId !== undefined &&
      locationId !== null
    ) {
      params = params.set(
        'locationId',
        locationId.toString()
      );
    }

    return this.http.get<OfferListResponse>(
      `${this.offersUrl}/by-category/${encodeURIComponent(category)}`,
      {
        headers,
        params
      }
    );
  }


  // -------------------------Performance -----------------------------------


  getWaitlistPerformance(
    locationId?: number,
    period?: PerformancePeriod
  ): Observable<WaitlistPerformanceResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    let params = new HttpParams();

    if (locationId !== undefined && locationId !== null) {
      params = params.set('locationId', locationId.toString());
    }

    if (period) {
      params = params.set('period', period);
    }

    return this.http.get<WaitlistPerformanceResponse>(
      `${this.baseUrl}/admin/performance/waitlist`,
      {
        params,
        headers
      }
    );
  }

  getReviewsPerformance(
    locationId?: number,
    period?: PerformancePeriod
  ): Observable<ReviewsPerformanceResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    let params = new HttpParams();

    if (locationId !== undefined && locationId !== null) {
      params = params.set('locationId', locationId.toString());
    }

    if (period) {
      params = params.set('period', period);
    }

    return this.http.get<ReviewsPerformanceResponse>(
      `${this.baseUrl}/admin/performance/reviews`,
      {
        params,
        headers
      }
    );
  }

  getRewardsOffersPerformance(
    locationId?: number,
    period?: PerformancePeriod,
    page: number = 0,
    size: number = 20
  ): Observable<RewardsOffersPerformanceResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (locationId !== undefined && locationId !== null) {
      params = params.set(
        'locationId',
        locationId.toString()
      );
    }

    if (period) {
      params = params.set('period', period);
    }

    return this.http.get<RewardsOffersPerformanceResponse>(
      `${this.baseUrl}/admin/performance/rewards-offers`,
      {
        params,
        headers
      }
    );
  }

  //----------------- Customer API ---------------------------------------

  getCustomers(restaurantId: number, page: number, size: number): Observable<CustomersResponse> {

    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const params = new HttpParams().set('restaurantId', restaurantId.toString()).set('page', page.toString()).set('size', size.toString());

    return this.http.get<CustomersResponse>(`${this.baseUrl}/admin/customers`, { params, headers });

  }

  getsummaryCustomer(restaurantId: number): Observable<SummaryCustomerResponse> {
    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    let params = new HttpParams();

    params = params.set('restaurantId', restaurantId.toString());

    return this.http.get<SummaryCustomerResponse>(
      `${this.baseUrl}/admin/customers/summary`,
      { params, headers }
    );
  }

  //---------------------------------Marketing API------------------------------------

  getMarketingSummary() {

    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<any>(
      `${this.baseUrl}/admin/marketing/summary`, { headers }
    );
  }

  getMarketingCampaigns(
    locationId: number,
    status: string,
    channel: string,
    page: number,
    size: number
  ) {

    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    let url =
      `${this.baseUrl}/admin/marketing/campaigns` +
      `?locationId=${locationId}` +
      `&page=${page}` +
      `&size=${size}`;

    if (status) {
      url += `&status=${status}`;
    }

    if (channel) {
      url += `&channel=${channel}`;
    }

    return this.http.get<any>(url, { headers });
  }

  getMarketingCampaignById(id: number) {
    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<any>(
      `${this.baseUrl}/admin/marketing/campaigns/${id}`, { headers }
    );
  }

  createMarketingCampaign(
    request: MarketingCampaignRequest
  ) {
    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post<any>(
      `${this.baseUrl}/admin/marketing/campaigns`,
      request,
      { headers }
    );
  }

  updateMarketingCampaign(
    id: number,
    request: MarketingCampaignRequest
  ) {
    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.put<any>(
      `${this.baseUrl}/admin/marketing/campaigns/${id}`,
      request,
      { headers }
    );
  }

  publishMarketingCampaign(
    id: number,
    immediate: boolean
  ) {
    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post<any>(
      `${this.baseUrl}/admin/marketing/campaigns/${id}/publish?immediate=${immediate}`,
      {},
      { headers }
    );
  }

  sendMarketingCampaign(
    request: MarketingCampaignSendRequest
  ) {
    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post<any>(
      `${this.baseUrl}/admin/marketing/campaigns/send`,
      request,
      { headers }
    );
  }

  getMarketingCustomers(
    restaurantId: number,
    page: number,
    size: number
  ) {
    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<any>(
      `${this.baseUrl}/admin/customers` +
      `?restaurantId=${restaurantId}` +
      `&page=${page}` +
      `&size=${size}`,
      { headers }
    );
  }

  getMarketingTemplates() {
    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<any>(
      `${this.baseUrl}/admin/marketing/templates`,
      { headers }
    );
  }

  createMarketingTemplate(
    request: MarketingTemplateRequest
  ) {
    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.post<any>(
      `${this.baseUrl}/admin/marketing/templates`,
      request,
      { headers }
    );
  }

  updateMarketingTemplate(
    id: number,
    request: MarketingTemplateUpdateRequest
  ) {
    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.put<any>(
      `${this.baseUrl}/admin/marketing/templates/${id}`,
      request,
      { headers }
    );
  }

  deleteMarketingTemplate(
    id: number
  ) {
    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.delete<any>(
      `${this.baseUrl}/admin/marketing/templates/${id}`,
      { headers }
    );
  }

  //----------------------- -----------Store Availability ----------------------------------------------------

  getAvailability(
    restaurantId: number
  ): Observable<AvailabilityResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<AvailabilityResponse>(
      `${this.baseUrl}/admin/availability/${restaurantId}`,
      { headers }
    );
  }

  getHolidayHours(
    restaurantId: number
  ): Observable<HolidayHoursResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<HolidayHoursResponse>(
      `${this.baseUrl}/admin/availability/${restaurantId}/holiday-hours`,
      { headers }
    );
  }

  addHolidayHour(
    restaurantId: number,
    request: HolidayHourRequest
  ): Observable<any> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post(
      `${this.baseUrl}/admin/availability/${restaurantId}/holiday-hours`,
      request,
      { headers }
    );
  }

  updateHolidayHour(
    restaurantId: number,
    holidayHourId: string,
    request: HolidayHourRequest
  ): Observable<any> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put(
      `${this.baseUrl}/admin/availability/${restaurantId}/holiday-hours/${holidayHourId}`,
      request,
      { headers }
    );
  }

  // ----------------------------- Redemption -------------------------

  getRedemptions(
    locationId: number | null,
    status: string,
    fromDate: string,
    toDate: string,
    page: number,
    size: number
  ): Observable<RedemptionsResponse> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    let params = new HttpParams()
      .set('status', status)
      .set('from', fromDate)
      .set('to', toDate)
      .set('page', page.toString())
      .set('size', size.toString());

    /*
     * IMPORTANT:
     * Only add locationId when a specific location is selected.
     *
     * All Locations => locationId is completely omitted.
     */
    if (locationId !== null) {
      params = params.set(
        'locationId',
        locationId.toString()
      );
    }

    return this.http.get<RedemptionsResponse>(
      `${this.baseUrl}/admin/redemptions`,
      {
        params,
        headers
      }
    );
  }

  exportRedemptions(
    locationId: number | null,
    status: string,
    fromDate: string,
    toDate: string
  ): Observable<Blob> {

    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    let params = new HttpParams()
      .set('status', status);

    if (fromDate) {
      params = params.set('from', fromDate);
    }

    if (toDate) {
      params = params.set('to', toDate);
    }
    /*
     * All Locations:
     * Do NOT send locationId.
     */
    if (locationId !== null) {
      params = params.set(
        'locationId',
        locationId.toString()
      );
    }

    return this.http.get(
      `${this.baseUrl}/admin/redemptions/export`,
      {
        params,
        headers,
        responseType: 'blob'
      }
    );
  }

  //----------------------------------------------REVIEW---------------------------------------------------



  getReviews(
    page: number,
    size: number,
    locationId?: number | null,
    filter?: string | null
  ): Observable<ReviewsResponse> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (locationId !== null && locationId !== undefined) {
      params = params.set(
        'locationId',
        locationId.toString()
      );
    }

    if (filter && filter !== 'all') {
      params = params.set('filter', filter);
    }

    return this.http.get<ReviewsResponse>(
      `${this.baseUrl}/admin/reviews`,
      {
        params,
        headers
      }
    );
  }



  replyToReview(
    reviewId: number,
    request: ReviewReplyRequest
  ): Observable<any> {
    const token = this.auth.getAdminToken();

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post(
      `${this.baseUrl}/admin/reviews/${reviewId}/reply`,
      request,
      { headers }
    );
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  /* ============================================================

     WAITLIST SETTINGS

  ============================================================ */

  getWaitlistSettings(

    restaurantId: number

  ): Observable<WaitlistSettingsResponse> {

    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<WaitlistSettingsResponse>(

      `${this.baseUrl}/admin/settings/${restaurantId}/waitlist-settings`, { headers }

    );

  }

  updateWaitlistSettings(

    restaurantId: number,

    request: WaitlistSettings

  ): Observable<any> {

    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put(

      `${this.baseUrl}/admin/settings/${restaurantId}/waitlist-settings`,

      request, { headers }

    );

  }

  /* ============================================================

     PROFILE

  ============================================================ */

  getProfile(

    restaurantId: number,

    year: number,

    month: number

  ): Observable<ProfileResponse> {

    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    const params =

      new HttpParams()

        .set(

          'restaurantId',

          restaurantId.toString()

        )

        .set(

          'year',

          year.toString()

        )

        .set(

          'month',

          month.toString()

        );

    return this.http.get<ProfileResponse>(

      `${this.baseUrl}/admin/settings/${restaurantId}/profile`,

      {

        params, headers

      }

    );

  }

  updateProfile(

    restaurantId: number,

    request: ProfileUpdateRequest

  ): Observable<any> {

    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put(

      `${this.baseUrl}/admin/settings/${restaurantId}/profile`,

      request, { headers }

    );

  }

  /* ============================================================

     NOTIFICATIONS

  ============================================================ */

  getNotifications(

    restaurantId: number

  ): Observable<NotificationsResponse> {

    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<NotificationsResponse>(

      `${this.baseUrl}/admin/settings/${restaurantId}/notifications`, { headers }

    );

  }

  updateNotifications(

    restaurantId: number,

    request: NotificationsData

  ): Observable<any> {

    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put(

      `${this.baseUrl}/admin/settings/${restaurantId}/notifications`,

      request, { headers }

    );

  }

  /* ============================================================

     ADVANCED

  ============================================================ */

  getAdvanced(

    restaurantId: number

  ): Observable<AdvancedResponse> {
    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<AdvancedResponse>(

      `${this.baseUrl}/admin/settings/${restaurantId}/advanced`, { headers }

    );

  }

  updateAdvanced(

    restaurantId: number,

    request: AdvancedSettings

  ): Observable<any> {
    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put(

      `${this.baseUrl}/admin/settings/${restaurantId}/advanced`,

      request, { headers }

    );

  }

  /* ============================================================

     HOLIDAY HOURS

  ============================================================ */

  getSettingsHolidayHours(

    restaurantId: number

  ): Observable<SettingsHolidayHoursResponse> {

    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.get<SettingsHolidayHoursResponse>(

      `${this.baseUrl}/admin/settings/${restaurantId}/holiday-hours`, { headers }

    );

  }

  addSettingsHolidayHour(

    restaurantId: number,

    request: SettingsHolidayHourRequest

  ): Observable<any> {

    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post(

      `${this.baseUrl}/admin/settings/${restaurantId}/holiday-hours`,

      request, { headers }

    );

  }

  updateSettingsHolidayHour(

    restaurantId: number,

    holidayHourId: string,

    request: SettingsHolidayHourRequest

  ): Observable<any> {

    const token = this.auth.getAdminToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.put(

      `${this.baseUrl}/admin/settings/${restaurantId}/holiday-hours/${holidayHourId}`,

      request, { headers }

    );

  }
}




