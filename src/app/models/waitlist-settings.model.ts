export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/* =====================================================
   PROFILE SETTINGS
===================================================== */

export interface SettingsProfileResponse {
  profile: SettingsProfile;
}

export interface SettingsProfile {
  plan: SettingsPlan;
  restaurant: SettingsRestaurant;
}

export interface SettingsPlan {
  callChargesThisMonth: number;
  marketingsmssentthismonth: number;
  name: string;
  nextRenewal: string;
  smsChargesThisMonth: number;
  smssentthismonth: number;
  totalChargesThisMonth: number;
}

export interface SettingsRestaurant {
  id: number;
  name: string;
  address: string;
  email: string;
  phone: string;
  hours: RestaurantHours;
}

export interface RestaurantHours {
  open: string;
  close: string;
}

/* =====================================================
   NOTIFICATION SETTINGS
===================================================== */

export interface NotificationSettingsResponse {
  averageServiceTime: number;
  bufferTime: number;
  id: number;
  maxWaitlistSize: number;
  operatingHours: string;
  restaurantId: number;
  sendEmailNotifications: boolean;
  sendSmsNotifications: boolean;
  nightlySummaryEmail?: string;
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  guestNotifications: GuestNotificationSettings;
  messageTemplates: MessageTemplateSettings;
  staffNotifications: StaffNotificationSettings;
}

export interface GuestNotificationSettings {
  notifysmsenabled: boolean;
  notifycallenabled: boolean;
  approvesmsenabled: boolean;
  joinedwaitlistsmsenabled: boolean;
  autoRemoveNoShowEnabled: boolean;
  autoRemoveMinutes: number;
}

export interface MessageTemplateSettings {
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

export interface StaffNotificationSettings {
  partyWaitingTooLong: boolean;
  tableOccupiedTooLong: boolean;
}

/* =====================================================
   WAITLIST SETTINGS
===================================================== */

export interface WaitlistSettingsResponse {
  acceptOnlineJoin: boolean;
  allowGoogleJoin: boolean;
  maxPartySize: number;
  pauseNewJoinsAfterClosing: boolean;
  tableReadyResponseMinutes: number;
  walkInsOnly: boolean;
}

/* =====================================================
   HOLIDAY SETTINGS
===================================================== */

export interface HolidaySettingsResponse {
  holidayHours: HolidayHour[];
}

export interface HolidayHour {
  id: string;
  title: string;
  date: string;
  closed: boolean;
  openTime: string;
  closeTime: string;
  notes: string;
}

/* =====================================================
   ADVANCED SETTINGS
===================================================== */

export interface AdvancedSettingsResponse {
  darkMode: boolean;
  desktopNotifications: boolean;
  keepSignedIn: boolean;
  language: string;
  timezone: string;
  serverAssignmentMode?: string | null;
}

/* =====================================================
   PROFILE UPDATE REQUEST
===================================================== */

export interface UpdateProfileRequest {
  name: string;
  email: string;
  phone: string;
  address: string;
  hours: {
    open: string;
    close: string;
  };
}

/* =====================================================
   NOTIFICATION UPDATE REQUEST
===================================================== */

export interface UpdateNotificationRequest {
  sendSmsNotifications: boolean;
  sendEmailNotifications: boolean;
  nightlySummaryEmail: string;
  averageServiceTime: number;
  bufferTime: number;
  operatingHours: string;
  maxWaitlistSize: number;
  notificationSettings: {
    guestNotifications: GuestNotificationSettings;
    messageTemplates: MessageTemplateSettings;
    staffNotifications: StaffNotificationSettings;
  };
}

/* =====================================================
   WAITLIST UPDATE REQUEST
===================================================== */

export interface UpdateWaitlistSettingsRequest {
  acceptOnlineJoin: boolean;
  allowGoogleJoin: boolean;
  maxPartySize: number;
  pauseNewJoinsAfterClosing: boolean;
  tableReadyResponseMinutes: number;
  walkInsOnly: boolean;
}

/* =====================================================
   ADVANCED UPDATE REQUEST
===================================================== */

export interface UpdateAdvancedSettingsRequest {
  darkMode: boolean;
  desktopNotifications: boolean;
  keepSignedIn: boolean;
  language: string;
  timezone: string;
  serverAssignmentMode?: string | null;
}

/* =====================================================
   HOLIDAY CREATE REQUEST
===================================================== */

export interface CreateHolidayRequest {
  date: string;
  title: string;
  openTime: string;
  closeTime: string;
  notes: string;
  closed: boolean;
}