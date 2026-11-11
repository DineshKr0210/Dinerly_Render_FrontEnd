export interface GetGuestHistory {
  id: number;
  guestName: string;
  guestPhone: string;
  partySize: number;
  preference: string;
  notes: string;
  status: string;
  joinedAt: string | null;
  approvedAt: string | null;
  notifiedAt: string | null;
  seatedAt: string | null;
  tableName?: string | null;
}

export interface GuestHistoryPage {
  content: GetGuestHistory[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface GuestHistoryResponse {
  success: boolean;
  message: string;
  data: GuestHistoryPage;
}

// -----------------------------------------------------------DASHBOARD -------------------------------------------------

export interface DashboardMetric {

  value: number;

  comparison: string;

}

export interface ActiveWaitlists {

  value: number;

  activeLocations: number;

}

export interface DashboardTopLocation {
  joins: number;
  name: string;
  restaurantId: number;
}

export interface DashboardData {
  averageRating: number;
  topLocations: DashboardTopLocation[];
  totalActiveWaitlists: number;
  totalRestaurants: number;
  totalWaitlistJoins: number;
  userName?: string;
}

export interface DashboardApiResponse {
  success: boolean;
  message: string;
  data: DashboardData;
}

export interface DashboardInsight {
  type: string;
  title: string;
  description: string;
  message: string;
  actionLabel: string;
  actionUrl: string;
  metric: string;
  timestamp: number;
  priority: string;
}

export interface InsightsFeedResponse {
  success: boolean;
  message: string;
  data: DashboardInsight[];
}


// -----------------------------------------------------Locations -------------------------------------------------------------


export interface AdminLocation {
  id: number;
  name: string;
  address: string;
  phoneNumber: string;
  managerEmail: string;
  ownerName: string;
  ownerEmail: string;
  menuTemplate: string;
  seats: number;
  locationOpen: boolean;
  status: string;
}

export interface AdminLocationSummary {

  id: number;

  name: string;

  address: string;

  phoneNumber: string;
  status: string;

}



export interface AdminLocationsResponse {

  success: boolean;

  message: string;

  data: {

    locations: AdminLocationSummary[];

    pagination: {

      page: number;

      size: number;

      totalElements: number;

      totalPages: number;

    };

  };

}


export interface AdminLocationRequest {
  name: string;
  address: string;
  phoneNumber: string;
  managerEmail: string;
  ownerName: string;
  ownerEmail: string;
  menuTemplate: string;
  seats: number;
  locationOpen: boolean;
}


export interface AdminLocationResponse {
  success: boolean;
  message: string;
  data: AdminLocation;
}





// -----------------------------------MENU ------------------------------------

export interface MenuType {
  id: number;
  name: string;
  status?: string;
  locationId?: number;
  location?: string;
}

export interface Dish {
  id: number;
  name: string;
  description: string;
  price: number;
  calories: number;
  imageUrl: string;
  category: string;
  locationId: number;
  location: string;
  types: MenuType[];
  status: string;
}

export interface MenuCategoryApi {
  id: number;
  name: string;
  locationId: number;
  location: string;
  status: string;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  locationId: number;
  location: string;
  dishes: Dish[];
  status: string;
}

export type MenuCategoriesResponse = MenuCategoryApi[];

export interface DishRequest {
  dishName: string;
  locationId: number;
  categoryName: string;
  typeNames: string[];
  price: number;
  calories: number;
  description: string;
  image?: File | null;
}

export interface CategoryRequest {
  name: string;
  description: string;
  locationId: number;
}

export interface DishResponse {
  success?: boolean;
  message?: string;
  data?: Dish;
}

export interface MenuApiResponse {
  success: boolean;
  message: string;
}

export interface CategoryResponse {
  success?: boolean;
  message?: string;
  data?: MenuCategoryApi;
}

//Admin -staff

export interface AdminStaff {
  id: number;
  name: string;
  role: string;
  locationId: number;
  location: string;
  email: string;
  status: string;
}

export interface CreateStaffRequest {
  name: string;
  role: string;
  locationId: number;
  email: string;
}

export interface UpdateStaffRequest {
  name: string;
  role: string;
  email: string;
  locationId: number;
  status: string;
}

export interface StaffPage {
  content: AdminStaff[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
  pageable?: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
  };
  sort?: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
}

export interface StaffListResponse {
  success: boolean;
  message: string;
  data: StaffPage;
}

export interface StaffResponse {
  success: boolean;
  message: string;
  data: AdminStaff;
}

export interface StaffApiResponse {
  success: boolean;
  message: string;
  data?: AdminStaff | AdminStaff[] | StaffPage | null;
}

export interface StaffRole {
  name: string;
  displayName: string;
}

export interface StaffRolesResponse {
  success: boolean;
  message: string;
  data: {
    roles: StaffRole[];
  };
}

export interface StaffPermission {
  canManageOffers: boolean;
  canManageStaff: boolean;
  role: string;
  canManageRewards: boolean;
  canManageSettings: boolean;
  staffId: number;
  canViewReports: boolean;
}

export interface StaffPermissionResponse {
  success: boolean;
  message: string;
  data: StaffPermission;
}

export interface UpdateStaffPermissionRequest {
  canManageOffers: boolean;
  canManageStaff: boolean;
  canManageRewards: boolean;
  canManageSettings: boolean;
  canViewReports: boolean;
}

export interface StaffActivity {
  action: string;
  details: string;
  id: number;
  timestamp: number;
  restaurantId?: number;
}

export interface StaffActivityPage {
  content: StaffActivity[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
  pageable?: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
  };
  sort?: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
}

export interface StaffActivityResponse {
  success: boolean;
  message: string;
  data: StaffActivityPage;
}

export interface VerifyStaffInvitationRequest {
  token: string;
}

export interface VerifyStaffInvitationData {
  valid: boolean;
  message: string;
  staffId: number;
  staffName: string;
  staffEmail: string;
  restaurantName: string;
}

export interface VerifyStaffInvitationResponse {
  success: boolean;
  message: string;
  data: VerifyStaffInvitationData | null;
}

export interface CheckStaffInvitationTokenRequest {
  token: string;
}

export interface CheckStaffInvitationTokenData {
  valid: boolean;
  message: string;
  expiresAt: string;
}

export interface CheckStaffInvitationTokenResponse {
  statusCode: number;
  message: string;
  data: CheckStaffInvitationTokenData | null;
}

export interface SetStaffPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface SetStaffPasswordResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: AdminStaff | null;
}



// REWARD PROGRAM

export interface RewardTier {
  id: number;
  name: string;
  perks: string[];
  points: number;
  pointsThreshold?: number;
  tierOrder?: number;
  restaurantId?: number;
  color?: string;
}

export interface RewardTierRequest {
  name: string;
  pointsThreshold: number;
  tierOrder: number;
  restaurantId: number;
  perks: string[];
  color: string;
  points: number;
}

export interface RewardTiersResponse {
  success: boolean;
  message: string;
  data: {
    content: RewardTier[];
    empty: boolean;
    first: boolean;
    last: boolean;
    number: number;
    numberOfElements: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

export interface RewardEarningRule {
  id: number;
  action: string;
  pointsValue: number;
  description: string;
  clickable: boolean;
  imageUrl: string;
  restaurantId: number;
  createdAt: string;
  updatedAt: string;
}

export interface RewardEarningRulesPage {
  content: RewardEarningRule[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
  pageable?: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
  };
  sort?: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
}

export interface RewardEarningRulesResponse {
  success: boolean;
  message: string;
  data: RewardEarningRulesPage;
}

export interface CreateRewardEarningRuleRequest {
  action: string;
  pointsValue: number;
  restaurantId: number;
  description: string;
}

export interface UpdateRewardEarningRuleRequest {
  action: string;
  pointsValue: number;
  restaurantId: number;
  description: string;
}

export interface RewardSettings {
  preventDuplicateRedemptionsWithinVisit: boolean;
  pointsPerDollar?: number;
  pointsExpirationDays?: number;
  minimumRedemptionPoints?: number;
}

export interface RewardSettingsResponse {
  success: boolean;
  message: string;
  data: RewardSettings;
}

export interface UpdateRewardSettingsRequest {
  preventDuplicateRedemptionsWithinVisit: boolean;
  pointsPerDollar?: number;
  pointsExpirationDays?: number;
  minimumRedemptionPoints?: number;
}

export interface RewardApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface RewardItem {
  id: number;
  title: string;
  description: string;
  pointsCost: number;
  restaurantId: number;
  icon?: string;
  category: string;
  available: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RewardItemRequest {
  title: string;
  description: string;
  pointsCost: number;
  restaurantId: number;
  category: string;
  available: boolean;
}

export interface RewardItemPage {
  content: RewardItem[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
  pageable?: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
  };
  sort?: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
}

export interface RewardItemListResponse {
  success: boolean;
  message: string;
  data: RewardItemPage;
}

export interface RewardItemResponse {
  success: boolean;
  message: string;
  data: RewardItem;
}


// Offers 

export type OfferStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'SCHEDULED'
  | 'EXPIRED';



export interface OfferRequest {
  name: string;
  locationId: number;
  startDate: string;
  endDate: string;
  status: OfferStatus;
  discountValue: number;
  discountLabel: string;
  description: string;
  photoUrl: string;
  perUserLimit: number;
}

export interface OfferPageResponse {
  success: boolean;
  message: string;
  data: OfferPage;
}

export interface OfferPage {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: Offer[];
  number: number;
  sort: {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
  };
  numberOfElements: number;
  pageable: {
    offset: number;
    sort: {
      empty: boolean;
      unsorted: boolean;
      sorted: boolean;
    };
    paged: boolean;
    pageNumber: number;
    pageSize: number;
    unpaged: boolean;
  };
  empty: boolean;
}

export interface OfferResponse {
  success: boolean;
  message: string;
  data: Offer;
}

export interface OfferCategoryResponse {
  success: boolean;
  message: string;
  data: string[];
}

export interface Offer {
  id: number;
  name: string;
  locationId: number;
  locationName?: string;

  startDate: string;
  endDate: string;

  status: OfferStatus;

  discountValue: number;
  discountLabel: string;

  description: string;
  photoUrl?: string;

  perUserLimit: number;
  redemptions?: number;
}




export interface OfferPage {
  content: Offer[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
}


export interface OfferListResponse {
  success: boolean;
  message: string;
  data: OfferPage;
}


export interface OfferCategoryResponse {
  success: boolean;
  message: string;
  data: string[];
}

// ---------------------------Performance---------------------------

export type PerformanceTab =
  | 'WAITLIST'
  | 'REVIEWS'
  | 'REWARDS_OFFERS';

export type PerformancePeriod =
  | 'thisWeek'
  | 'thisMonth'
  | 'pastMonth'
  | 'last3Months';

export interface WaitlistPerformanceSummary {
  waitlistJoins: number;
  guestsSeated: number;
  averageWaitTimeMinutes: number;
}

export interface WaitlistPerformanceTrend {
  date: string;
  label: string;
  value: number;
}

export interface WaitlistPerformanceLeaderboard {
  location: string;
  waitlistJoins: number;
  guestsSeated: number;
  avgWaitMinutes: number;
}

export interface WaitlistPerformanceData {
  summary: WaitlistPerformanceSummary;
  trend: WaitlistPerformanceTrend[];
  leaderboard: WaitlistPerformanceLeaderboard[];
}

export interface WaitlistPerformanceResponse {
  success: boolean;
  message: string;
  data: WaitlistPerformanceData;
}

export interface ReviewsPerformanceSummary {
  reviewsReceived: number;
  averageRating: number;
  replyRate: number;
}

export interface ReviewsPerformanceTrend {
  date: string;
  label: string;
  value: number;
}

export interface ReviewsPerformanceLeaderboard {
  location: string;
  reviewsReceived: number;
  avgRating: number;
  replyRate: number;
}

export interface ReviewsPerformanceData {
  summary: ReviewsPerformanceSummary;
  trend: ReviewsPerformanceTrend[];
  leaderboard: ReviewsPerformanceLeaderboard[];
}

export interface ReviewsPerformanceResponse {
  success: boolean;
  message: string;
  data: ReviewsPerformanceData;
}

export interface RewardsOffersPerformanceSummary {
  redemptions: number;
  pointsRedeemed: number;
  activeOffers: number;
}

export interface RewardsOffersPerformanceTrend {
  date: string;
  label: string;
  value: number;
}

export interface RewardsOffersPerformanceLeaderboard {
  location: string;
  redemptions: number;
  pointsRedeemed: number;
  activeOffers: number;
}

export interface RewardsOffersPerformanceData {
  summary: RewardsOffersPerformanceSummary;
  trend: RewardsOffersPerformanceTrend[];
  leaderboard: RewardsOffersPerformanceLeaderboard[];
}

export interface RewardsOffersPerformanceResponse {
  success: boolean;
  message: string;
  data: RewardsOffersPerformanceData;
}


//----------------------------------------------CUSTOMER-------------------------------------------

export interface Customer {

  guest: string;

  contact: string;

  visits: number;

  firstVisit: string;

  lastVisit: string;

  locations: string;
  status: string;
}


export interface CustomersResponse {

  totalElements: number;

  totalPages: number;

  first: boolean;

  last: boolean;

  size: number;

  content: Customer[];

  number: number;

  sort: {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
  };

  numberOfElements: number;

  pageable: {
    offset: number;

    sort: {
      empty: boolean;
      unsorted: boolean;
      sorted: boolean;
    };

    paged: boolean;

    pageNumber: number;

    pageSize: number;

    unpaged: boolean;
  };

  empty: boolean;
}

export interface SummaryCustomerResponse {
  totalUniqueGuests: number;
  totalGuestsLastMonth: number;
  totalGuestsTrendPercent: number;
  newCustomers: number;
  newCustomersPercent: number;
  newCustomersLastMonth: number;
  newCustomersTrendPercent: number;
  regularCustomers: number;
  regularCustomersPercent: number;
  regularCustomersLastMonth: number;
  regularCustomersTrendPercent: number;
  avgVisitsPerRegular: number;
  avgVisitsLastMonth: number;
  avgVisitsTrendPercent: number;
}

//-------------------------------------------------Marketing----------------------------------------------

export interface MarketingSummary {
  activeCampaigns: number;
  activeCampaignsTrendPercent: number;
  guestsReached: number;
  guestsReachedPercent: number;
  redemptions: number;
  redemptionsLastMonth: number;
  redemptionsTrendPercent: number;
  spendThisMonth: number;
  spendTrendPercent: number;
  locationId: number;
}

export interface MarketingCampaign {
  id: number;
  name: string;
  audience: string;
  channelDisplay: string;
  channels?: string;
  message: string;
  locationId: number;
  restaurantId: number;
  templateId: number;
  reach: number;
  redemptions: number;
  sentCount: number;
  status: string;
  scheduledAt: string;
  endDate: string;
  createdAt: string;
  dateRangeDisplay: string;
  codesGenerated: number;
  hasRedemptionCode: boolean;
  redemptionCode: string;
}

export interface MarketingCampaignRequest {
  name: string;
  channel: string;
  audience: string;
  templateId: number;
  message: string;
  restaurantId: number;
  scheduledAt: string;
  endDate: string;
  hasRedemptionCode: boolean;
  redemptionCode: string;
}

export interface MarketingCampaignSendRequest {
  restaurantId: number;
  templateType: string;
  message: string;
  phoneNumbers: string[];
}

export interface MarketingTemplate {
  id: number;
  createdAt: string;
  description: string;
  messageTemplate: string;
  templateType: string;
  updatedAt: string;
}

export interface MarketingTemplateRequest {
  templateType: string;
  messageTemplate: string;
  description: string;
}

export interface MarketingTemplateUpdateRequest {
  messageTemplate: string;
  description: string;
}

export interface MarketingCustomer {
  guest: string;
  contact: string;
  locations: string;
  visits: number;
  firstVisit: string;
  lastVisit: string;
  status: string;
}

export interface MarketingCustomersResponse {
  content: MarketingCustomer[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: {
    offset: number;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    unpaged: boolean;
  };
  size: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  totalElements: number;
  totalPages: number;
}

// ----------------------------------------Store Availability---------------------------------------------------


export interface HolidayHour {
  id: string;
  date: string;
  title: string;
  openTime: string;
  closeTime: string;
  notes: string;
  closed: boolean;
}

export interface HolidayHoursResponse {
  success: boolean;
  message: string;
  data: {
    holidayHours: HolidayHour[];
  };
}

export interface HolidayHourRequest {
  date: string;
  title: string;
  openTime: string;
  closeTime: string;
  notes: string;
  closed: boolean;
}

export interface RegularHour {
  date: string;
  day: string;
  open: string;
  close: string;
  enabled: boolean;
}

export interface SpecialHour {
  date: string;
  open: string;
  close: string;
  enabled: boolean;
}

export interface AvailabilityResponse {
  success: boolean;
  message: string;
  data: {
    locationId: number;
    location: string;
    currentlyOpen: boolean;
    regularHours: RegularHour[];
    specialHours: SpecialHour[];
  };
}

// ------------------ Redemption --------------------

export interface Redemption {
  id: number;
  type?: 'OFFER' | 'CAMPAIGN' | string;
  itemRedeemed?: string | null;
  location?: string | null;
  locationId?: number | null;
  guest?: string | null;
  mobileNumber: string | null;
  redeemedAt: string;
  value?: number | string | null;
  pointsRedeemed?: number | null;
  redemptionCode?: string | null;
  status?: string | null;
  offerId?: number | null;
  offerDiscountLabel?: string | null;
  campaignId?: number | null;
  rewardItemId?: number | null;
  userId?: number | null;
  waitlistId?: number | null;
  codeExpiresAt?: string | null;
  updatedAt?: string | null;
}

export interface RedemptionPage {
  content: Redemption[];

  empty: boolean;
  first: boolean;
  last: boolean;

  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface RedemptionsResponse {
  success: boolean;
  message: string;
  data: RedemptionPage;
}

// admin -reports

export interface AdminReport {
  id: number;
  fileName: string;
  type: string;
  scope: string;
  locationId?: number;
  period?: string;
  generatedAt: string;
}

export interface AdminReportsResponse {
  content: AdminReport[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: any;
  size: number;
  sort: any;
  totalElements: number;
  totalPages: number;
}

export interface GenerateReportResponse {
  id: number;
  fileName: string;
  type: string;
  scope: string;
  locationId?: number;
  period?: string;
  dateRange?: string;
  generatedAt: string;
}

export interface AdminReportLocation {
  id: number;
  name: string;
  address?: string;
  phoneNumber?: string;
  status?: string;
}

//-------------------------------------------Review----------------------------------------------

export interface Review {
  id: number;
  guest: string;
  locationId: number;
  location: string;
  rating: number;
  review: string;
  reply: string;
  createdAt: string;
  repliedAt: string | null;
}

export interface ReviewsPage {
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  size: number;
  content: Review[];
  number: number;
  sort: {
    empty: boolean;
    unsorted: boolean;
    sorted: boolean;
  };
  numberOfElements: number;
  pageable: {
    offset: number;
    sort: {
      empty: boolean;
      unsorted: boolean;
      sorted: boolean;
    };
    paged: boolean;
    pageNumber: number;
    pageSize: number;
    unpaged: boolean;
  };
  empty: boolean;
}

export interface ReviewsResponse {
  success: boolean;
  message: string;
  data: ReviewsPage;
}

export interface ReviewReplyRequest {
  reply: string;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* ============================================================
   COMMON API RESPONSE
============================================================ */

export interface SettingsResponse<T> {
  success: boolean;
  message: string;
  data: T;
}


/* ============================================================
   WAITLIST SETTINGS
============================================================ */

export interface WaitlistSettings {
  maxPartySize: number;
  tableReadyResponseMinutes: number;
  walkInsOnly: boolean;
  pauseNewJoinsAfterClosing: boolean;
  allowGoogleJoin: boolean;
  acceptOnlineJoin: boolean;
}


export type WaitlistSettingsResponse =
  SettingsResponse<WaitlistSettings>;


/* ============================================================
   PROFILE
============================================================ */

export interface RestaurantHours {
  open: string;
  close: string;
}


export interface RestaurantProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  hours: RestaurantHours;
}


export interface RestaurantPlan {
  name: string;
  smssentthismonth: number;
  marketingsmssentthismonth: number;
  smsChargesThisMonth: number;
  callChargesThisMonth: number;
  totalChargesThisMonth: number;
  nextRenewal: string;
}


export interface ProfileData {
  profile: {
    restaurant: RestaurantProfile;
    plan: RestaurantPlan;
  };
}


export interface ProfileUpdateRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  hours: {
    open: string;
    close: string;
  };
}


export type ProfileResponse =
  SettingsResponse<ProfileData>;


/* ============================================================
   NOTIFICATIONS
============================================================ */

export interface GuestNotifications {
  notifysmsenabled: boolean;
  notifycallenabled: boolean;
  approvesmsenabled: boolean;
  joinedwaitlistsmsenabled: boolean;
  autoRemoveNoShowEnabled: boolean;
  autoRemoveMinutes: number;
}


export interface MessageTemplates {
  smsTemplateId: number;
  smsTemplateName: string;
  smsTemplatePreview: string;

  approveSmsTemplateId: number;
  approveSmsTemplateName: string;
  approveSmsTemplatePreview: string;

  notifySmsTemplateId: number;
  notifySmsTemplateName: string;
  notifySmsTemplatePreview: string;

  voiceTemplateId: number;
  voiceTemplateName: string;
  voiceTemplatePreview: string;

  voice: string;
}


export interface StaffNotifications {
  partyWaitingTooLong: boolean;
  tableOccupiedTooLong: boolean;
}


export interface NotificationSettings {
  guestNotifications: GuestNotifications;
  messageTemplates: MessageTemplates;
  staffNotifications: StaffNotifications;
}


export interface NotificationsData {
  id: number;
  restaurantId: number;

  sendSmsNotifications: boolean;
  sendEmailNotifications: boolean;

  nightlySummaryEmail: string;

  averageServiceTime: number;
  bufferTime: number;
  operatingHours: string;
  maxWaitlistSize: number;

  notificationSettings: NotificationSettings;
}


export type NotificationsResponse =
  SettingsResponse<NotificationsData>;


/* ============================================================
   ADVANCED
============================================================ */

export interface AdvancedSettings {
  darkMode: boolean;
  desktopNotifications: boolean;
  keepSignedIn: boolean;
  language: string;
  timezone: string;
  serverAssignmentMode?: string | null;
}


export type AdvancedResponse =
  SettingsResponse<AdvancedSettings>;


/* ============================================================
   HOLIDAY HOURS
============================================================ */

export interface SettingsHolidayHour {
  id: string;
  date: string;
  title: string;
  openTime: string;
  closeTime: string;
  notes: string;
  closed: boolean;
}


export interface SettingsHolidayHoursData {
  holidayHours: SettingsHolidayHour[];
}


export interface SettingsHolidayHourRequest {
  date: string;
  title: string;
  openTime: string;
  closeTime: string;
  notes: string;
  closed: boolean;
}


export type SettingsHolidayHoursResponse =
  SettingsResponse<SettingsHolidayHoursData>;