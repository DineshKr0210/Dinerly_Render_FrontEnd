import {
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, timer } from 'rxjs';
import {
  AdvancedSettingsResponse,
  CreateHolidayRequest,
  GuestNotificationSettings,
  HolidayHour,
  MessageTemplateSettings,
  NotificationSettingsResponse,
  SettingsPlan,
  SettingsRestaurant,
  StaffNotificationSettings,
  UpdateAdvancedSettingsRequest,
  UpdateNotificationRequest,
  UpdateProfileRequest,
  UpdateWaitlistSettingsRequest,
  WaitlistSettingsResponse
} from 'src/app/models/waitlist-settings.model';
import { AdminSettingsService } from 'src/app/services/admin-settings.service';
import { WaitlistAuthService } from 'src/app/services/waitlist-auth.service';
import { ThemeService } from 'src/app/services/theme.service';
import { AdminLocationContextService } from 'src/app/services/admin-location-context.service';

type SettingsTab =
  | 'profile'
  | 'notification'
  | 'waitlist'
  | 'tables'
  | 'holiday'
  | 'advanced';

type WaitlistMode =
  | 'ONLINE'
  | 'WALK_IN';

interface StaffMember {
  id: number;
  name: string;
  role: string;
  onFloor: boolean;
}

interface FloorOverview {
  sections: number;
  totalTables: number;
  totalSeats: number;
}

@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.css']
})
export class AdminSettingsComponent implements OnInit, OnDestroy {
  readonly encodeURIComponent = encodeURIComponent;

  isSavingProfile = false;
  isSavingNotifications = false;
  isSavingWaitlist = false;
  isSavingAdvanced = false;
  isCreatingHoliday = false;

  showRestaurantMenu = false;

  profileSaveMessage = '';
  notificationSaveMessage = '';
  waitlistSaveMessage = '';
  advancedSaveMessage = '';
  holidaySaveMessage = '';

  private savedRestaurant: SettingsRestaurant | null = null;

  restaurantName = '';

  private savedNotificationConfiguration:
    NotificationSettingsResponse | null = null;

  private savedWaitlistRules:
    WaitlistSettingsResponse | null = null;

  private savedAdvancedSettings:
    AdvancedSettingsResponse | null = null;

  activeTab: SettingsTab = 'profile';

  currentTimeOnly = '';

  restaurantId: number | null = null;

  selectedLocationId: number | null = null;

  isLoading = false;

  profileError = '';
  notificationError = '';
  waitlistError = '';
  holidayError = '';
  advancedError = '';

  showHolidayForm = false;

  qrCodeImageUrl = '';
  isQrLoading = false;
  qrCodeError = '';

  newHoliday: CreateHolidayRequest = {
    date: '',
    title: '',
    openTime: '',
    closeTime: '',
    notes: '',
    closed: false
  };

  /* PROFILE */

  restaurant: SettingsRestaurant | null = null;
  currentPlan: SettingsPlan | null = null;

  isEditingProfile = false;
  private profileBackup: SettingsRestaurant | null = null;

  /* NOTIFICATIONS */

  notificationConfiguration:
    NotificationSettingsResponse | null = null;

  guestNotifications:
    GuestNotificationSettings | null = null;

  staffNotifications:
    StaffNotificationSettings | null = null;

  messageTemplates!: MessageTemplateSettings;

  textTemplate = '';
  callScript = '';
  selectedVoice = '';

  textTemplates: string[] = [];
  callScripts: string[] = [];

  voices = [
    'female',
    'male',
    'natural'
  ];

  /* WAITLIST */

  waitlistRules:
    WaitlistSettingsResponse | null = null;

  /* HOLIDAY */

  holidayHours: HolidayHour[] = [];

  /* ADVANCED */

  advancedSettings!: AdvancedSettingsResponse;

  languages = [
    {
      value: 'en',
      label: 'English'
    },
    {
      value: 'fr',
      label: 'French'
    },
    {
      value: 'es',
      label: 'Spanish'
    }
  ];

  serverAssignmentModes = [
    {
      value: 'ROTATION',
      label: 'Rotation'
    },
    {
      value: 'SECTION',
      label: 'Section'
    }
  ];

  /* TABLES AND STAFF */

  floorOverview: FloorOverview | null = null;

  staffName = '';
  staffRole = 'Server';

  staffRoles = [
    'Server',
    'Host',
    'Bartender',
    'Busser',
    'Manager'
  ];

  staffList: StaffMember[] = [];

  guestJoinLink = '';

  showPendingRequest = true;

  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private settingApi: AdminSettingsService,
    private auth: WaitlistAuthService,
    private locationContext: AdminLocationContextService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    const authRestaurantId = this.auth.getRestaurantId();

    this.restaurantId = authRestaurantId
      ? Number(authRestaurantId)
      : null;

    this.restaurantName =
      this.auth.getRestaurantName();

    this.subscription.add(
      this.route.queryParamMap.subscribe(params => {
        const requestedTab =
          params.get('tab') as SettingsTab | null;

        this.activeTab =
          this.isValidTab(requestedTab)
            ? requestedTab
            : 'profile';
      })
    );

    this.subscription.add(
      this.locationContext.selectedLocation$.subscribe(
        location => {
          if (!location?.id) {
            return;
          }

          const locationId = Number(location.id);

          if (!locationId) {
            return;
          }

          if (
            this.selectedLocationId === locationId &&
            this.restaurant
          ) {
            return;
          }

          this.selectedLocationId = locationId;
          this.restaurantId = locationId;
          this.restaurantName = location.name || '';

          this.resetProfileEditState();
          this.clearLocationMessages();

          this.loadAllSettings();
          this.loadQrCode();
        }
      )
    );

    this.subscription.add(
      timer(0, 30000).subscribe(() => {
        this.updateCurrentTime();
      })
    );

    if (this.restaurantId) {
      this.loadAllSettings();
      this.loadQrCode();
    }
  }

  /* LOCATION */

  private resetProfileEditState(): void {
    this.isEditingProfile = false;
    this.profileBackup = null;
    this.isSavingProfile = false;
  }

  private clearLocationMessages(): void {
    this.profileError = '';
    this.notificationError = '';
    this.waitlistError = '';
    this.holidayError = '';
    this.advancedError = '';

    this.profileSaveMessage = '';
    this.notificationSaveMessage = '';
    this.waitlistSaveMessage = '';
    this.advancedSaveMessage = '';
    this.holidaySaveMessage = '';
  }

  /* LOAD ALL SETTINGS */

  private loadAllSettings(): void {
    if (!this.restaurantId) {
      return;
    }

    this.getSettingsProfile();
    this.getSettingsNotifications();
    this.getWaitlistSettings();
    this.getHolidaySettings();
    this.getAdvancedSettings();
  }

  /* PROFILE */

  getSettingsProfile(): void {
    if (!this.restaurantId) {
      return;
    }

    this.profileError = '';

    const dateParts =
      this.getWinnipegYearAndMonth();

    this.subscription.add(
      this.settingApi
        .settingProfile(
          this.restaurantId,
          dateParts.year,
          dateParts.month
        )
        .subscribe({
          next: response => {
            if (
              response?.success &&
              response?.data?.profile
            ) {
              this.restaurant =
                response.data.profile.restaurant;

              this.currentPlan =
                response.data.profile.plan;

              this.savedRestaurant =
                this.cloneData(this.restaurant);

              this.isEditingProfile = false;
              this.profileBackup = null;

              this.createGuestJoinLink();
            } else {
              this.profileError =
                response?.message ||
                'Unable to load profile settings.';
            }
          },
          error: error => {
            console.error(
              'Profile settings error:',
              error
            );

            this.profileError =
              'Unable to load profile settings.';
          }
        })
    );
  }

  startEditProfile(): void {
    if (!this.restaurant || this.isSavingProfile) {
      return;
    }

    this.profileBackup =
      this.cloneData(this.restaurant);

    this.isEditingProfile = true;
    this.profileSaveMessage = '';
    this.profileError = '';
  }

  cancelEditProfile(): void {
    if (this.profileBackup) {
      this.restaurant =
        this.cloneData(this.profileBackup);
    } else if (this.savedRestaurant) {
      this.restaurant =
        this.cloneData(this.savedRestaurant);
    }

    this.profileBackup = null;
    this.isEditingProfile = false;
    this.isSavingProfile = false;
    this.profileSaveMessage = '';
    this.profileError = '';
  }

  saveProfileDetails(): void {
    if (
      !this.restaurant ||
      this.isSavingProfile
    ) {
      return;
    }

    this.profileError = '';
    this.profileSaveMessage = '';

    this.updateProfileSettings();
  }

  updateProfileSettings(): void {
    if (
      !this.restaurant ||
      this.isSavingProfile ||
      !this.restaurantId
    ) {
      return;
    }

    const payload: UpdateProfileRequest = {
      name:
        this.restaurant.name?.trim() || '',

      email:
        this.restaurant.email?.trim() || '',

      phone:
        this.restaurant.phone?.trim() || '',

      address:
        this.restaurant.address?.trim() || '',

      hours: {
        open:
          this.restaurant.hours?.open?.trim() || '',

        close:
          this.restaurant.hours?.close?.trim() || ''
      }
    };

    if (
      !payload.name ||
      !payload.email ||
      !payload.phone ||
      !payload.address ||
      !payload.hours.open ||
      !payload.hours.close
    ) {
      this.profileSaveMessage =
        'Please complete all restaurant fields.';

      return;
    }

    this.isSavingProfile = true;
    this.profileSaveMessage = '';

    this.settingApi
      .updateSettingProfile(
        this.restaurantId,
        payload
      )
      .subscribe({
        next: response => {
          this.isSavingProfile = false;

          if (response?.success) {
            this.savedRestaurant =
              this.cloneData(this.restaurant);

            this.profileBackup = null;
            this.isEditingProfile = false;

            this.profileSaveMessage =
              response.message ||
              'Profile updated successfully.';

            this.createGuestJoinLink();
          } else {
            this.restoreProfileValues();

            this.profileSaveMessage =
              response?.message ||
              'Unable to update profile.';

            this.isEditingProfile = true;
          }
        },
        error: error => {
          console.error(
            'Update profile error:',
            error
          );

          this.isSavingProfile = false;

          this.restoreProfileValues();

          this.profileSaveMessage =
            'Unable to update profile.';

          this.isEditingProfile = true;
        }
      });
  }

  private restoreProfileValues(): void {
    if (this.profileBackup) {
      this.restaurant =
        this.cloneData(this.profileBackup);

      return;
    }

    if (this.savedRestaurant) {
      this.restaurant =
        this.cloneData(this.savedRestaurant);
    }
  }

  getRestaurantImageUrl(): string {
    const restaurant =
      this.restaurant as any;

    return (
      restaurant?.imageUrl ||
      restaurant?.image ||
      restaurant?.photoUrl ||
      restaurant?.logoUrl ||
      ''
    );
  }

  getRestaurantCuisine(): string {
    const restaurant =
      this.restaurant as any;

    return (
      restaurant?.cuisineType ||
      restaurant?.cuisine ||
      '—'
    );
  }

  setRestaurantCuisine(value: string): void {
    const restaurant =
      this.restaurant as any;

    if (!restaurant) {
      return;
    }

    if (
      'cuisineType' in restaurant ||
      !('cuisine' in restaurant)
    ) {
      restaurant.cuisineType = value;
    } else {
      restaurant.cuisine = value;
    }
  }

  getRestaurantDescription(): string {
    const restaurant =
      this.restaurant as any;

    return (
      restaurant?.description ||
      '—'
    );
  }

  setRestaurantDescription(
    value: string
  ): void {
    const restaurant =
      this.restaurant as any;

    if (!restaurant) {
      return;
    }

    restaurant.description = value;
  }

  getLocationsUsed(): number {
    const plan =
      this.currentPlan as any;

    const restaurant =
      this.restaurant as any;

    return Number(
      plan?.locationsUsed ??
      plan?.locationCount ??
      restaurant?.locationsUsed ??
      restaurant?.locationCount ??
      0
    );
  }

  getLocationsLimit(): number {
    const plan =
      this.currentPlan as any;

    return Number(
      plan?.locationsLimit ??
      plan?.maxLocations ??
      5
    );
  }

  /* NOTIFICATIONS */

  getSettingsNotifications(): void {
    if (!this.restaurantId) {
      return;
    }

    this.notificationError = '';

    this.subscription.add(
      this.settingApi
        .settingNotification(
          this.restaurantId
        )
        .subscribe({
          next: response => {
            if (
              response?.success &&
              response?.data?.notificationSettings
            ) {
              this.notificationConfiguration =
                response.data;

              this.guestNotifications =
                response.data
                  .notificationSettings
                  .guestNotifications;

              this.staffNotifications =
                response.data
                  .notificationSettings
                  .staffNotifications;

              this.messageTemplates =
                response.data
                  .notificationSettings
                  .messageTemplates;

              this.savedNotificationConfiguration =
                this.cloneData(response.data);

              this.mapMessageTemplateValues();
            } else {
              this.notificationError =
                response?.message ||
                'Unable to load notification settings.';
            }
          },
          error: error => {
            console.error(
              'Notification settings error:',
              error
            );

            this.notificationError =
              'Unable to load notification settings.';
          }
        })
    );
  }

  private mapMessageTemplateValues(): void {
    if (!this.messageTemplates) {
      return;
    }

    this.textTemplate =
      this.messageTemplates
        .notifySmsTemplateName;

    this.callScript =
      this.messageTemplates
        .voiceTemplateName;

    this.selectedVoice =
      this.messageTemplates.voice || '';

    this.textTemplates = [
      this.messageTemplates.smsTemplateName,
      this.messageTemplates.approveSmsTemplateName,
      this.messageTemplates.notifySmsTemplateName
    ].filter(
      (template, index, templates) =>
        Boolean(template) &&
        templates.indexOf(template) === index
    );

    this.callScripts = [
      this.messageTemplates
        .voiceTemplateName
    ].filter(Boolean);
  }

  updateNotificationSettings(): void {
    if (
      !this.notificationConfiguration ||
      !this.guestNotifications ||
      !this.staffNotifications ||
      !this.messageTemplates ||
      this.isSavingNotifications ||
      !this.restaurantId
    ) {
      return;
    }

    const payload:
      UpdateNotificationRequest = {
      sendSmsNotifications:
        Boolean(
          this.notificationConfiguration
            .sendSmsNotifications
        ),

      sendEmailNotifications:
        Boolean(
          this.notificationConfiguration
            .sendEmailNotifications
        ),

      nightlySummaryEmail:
        this.notificationConfiguration
          .nightlySummaryEmail || '',

      averageServiceTime:
        Number(
          this.notificationConfiguration
            .averageServiceTime
        ),

      bufferTime:
        Number(
          this.notificationConfiguration
            .bufferTime
        ),

      operatingHours:
        this.notificationConfiguration
          .operatingHours || '',

      maxWaitlistSize:
        Number(
          this.notificationConfiguration
            .maxWaitlistSize
        ),

      notificationSettings: {
        guestNotifications: {
          notifysmsenabled:
            Boolean(
              this.guestNotifications
                .notifysmsenabled
            ),

          notifycallenabled:
            Boolean(
              this.guestNotifications
                .notifycallenabled
            ),

          approvesmsenabled:
            Boolean(
              this.guestNotifications
                .approvesmsenabled
            ),

          joinedwaitlistsmsenabled:
            Boolean(
              this.guestNotifications
                .joinedwaitlistsmsenabled
            ),

          autoRemoveNoShowEnabled:
            Boolean(
              this.guestNotifications
                .autoRemoveNoShowEnabled
            ),

          autoRemoveMinutes:
            Number(
              this.guestNotifications
                .autoRemoveMinutes
            )
        },

        messageTemplates: {
          smsTemplateId:
            Number(
              this.messageTemplates
                .smsTemplateId
            ),

          smsTemplateName:
            this.messageTemplates
              .smsTemplateName || '',

          smsTemplatePreview:
            this.messageTemplates
              .smsTemplatePreview || '',

          approveSmsTemplateId:
            Number(
              this.messageTemplates
                .approveSmsTemplateId
            ),

          approveSmsTemplateName:
            this.messageTemplates
              .approveSmsTemplateName || '',

          approveSmsTemplatePreview:
            this.messageTemplates
              .approveSmsTemplatePreview || '',

          notifySmsTemplateId:
            Number(
              this.messageTemplates
                .notifySmsTemplateId
            ),

          notifySmsTemplateName:
            this.messageTemplates
              .notifySmsTemplateName || '',

          notifySmsTemplatePreview:
            this.messageTemplates
              .notifySmsTemplatePreview || '',

          voiceTemplateId:
            Number(
              this.messageTemplates
                .voiceTemplateId
            ),

          voiceTemplateName:
            this.messageTemplates
              .voiceTemplateName || '',

          voiceTemplatePreview:
            this.messageTemplates
              .voiceTemplatePreview || '',

          voice:
            this.selectedVoice ||
            this.messageTemplates.voice ||
            ''
        },

        staffNotifications: {
          partyWaitingTooLong:
            Boolean(
              this.staffNotifications
                .partyWaitingTooLong
            ),

          tableOccupiedTooLong:
            Boolean(
              this.staffNotifications
                .tableOccupiedTooLong
            )
        }
      }
    };

    this.isSavingNotifications = true;
    this.notificationSaveMessage = '';

    this.settingApi
      .updateSettingNotification(
        this.restaurantId,
        payload
      )
      .subscribe({
        next: response => {
          this.isSavingNotifications = false;

          if (response?.success) {
            this.messageTemplates.voice =
              this.selectedVoice;

            this.savedNotificationConfiguration =
              this.cloneData({
                ...this.notificationConfiguration!,
                notificationSettings: {
                  guestNotifications:
                    this.guestNotifications!,

                  messageTemplates:
                    this.messageTemplates!,

                  staffNotifications:
                    this.staffNotifications!
                }
              });

            this.notificationSaveMessage =
              response.message ||
              'Notification settings updated.';
          } else {
            this.restoreNotificationValues();

            this.notificationSaveMessage =
              response?.message ||
              'Unable to update notification settings.';
          }
        },
        error: error => {
          console.error(
            'Update notification error:',
            error
          );

          this.isSavingNotifications = false;

          this.restoreNotificationValues();

          this.notificationSaveMessage =
            'Unable to update notification settings.';
        }
      });
  }

  private restoreNotificationValues(): void {
    if (!this.savedNotificationConfiguration) {
      return;
    }

    this.notificationConfiguration =
      this.cloneData(
        this.savedNotificationConfiguration
      );

    this.guestNotifications =
      this.notificationConfiguration
        .notificationSettings
        .guestNotifications;

    this.messageTemplates =
      this.notificationConfiguration
        .notificationSettings
        .messageTemplates;

    this.staffNotifications =
      this.notificationConfiguration
        .notificationSettings
        .staffNotifications;

    this.selectedVoice =
      this.messageTemplates.voice || '';

    this.mapMessageTemplateValues();
  }

  /* WAITLIST */

  getWaitlistSettings(): void {
    if (!this.restaurantId) {
      return;
    }

    this.waitlistError = '';

    this.subscription.add(
      this.settingApi
        .waitlistSettings(
          this.restaurantId
        )
        .subscribe({
          next: response => {
            if (
              response?.success &&
              response?.data
            ) {
              this.waitlistRules =
                response.data;

              this.savedWaitlistRules =
                this.cloneData(response.data);
            } else {
              this.waitlistError =
                response?.message ||
                'Unable to load waitlist settings.';
            }
          },
          error: error => {
            console.error(
              'Waitlist settings error:',
              error
            );

            this.waitlistError =
              'Unable to load waitlist settings.';
          }
        })
    );
  }

  onWaitlistModeChange(
    mode: WaitlistMode,
    enabled: boolean
  ): void {
    if (!this.waitlistRules) {
      return;
    }

    if (mode === 'ONLINE') {
      this.waitlistRules.acceptOnlineJoin =
        enabled;

      if (enabled) {
        this.waitlistRules.walkInsOnly =
          false;
      }
    }

    if (mode === 'WALK_IN') {
      this.waitlistRules.walkInsOnly =
        enabled;

      if (enabled) {
        this.waitlistRules.acceptOnlineJoin =
          false;
      }
    }

    this.updateWaitlistSetting();
  }

  updateWaitlistSetting(): void {
    if (
      !this.waitlistRules ||
      this.isSavingWaitlist ||
      !this.restaurantId
    ) {
      return;
    }

    const payload:
      UpdateWaitlistSettingsRequest = {
      acceptOnlineJoin:
        Boolean(
          this.waitlistRules.acceptOnlineJoin
        ),

      allowGoogleJoin:
        Boolean(
          this.waitlistRules.allowGoogleJoin
        ),

      maxPartySize:
        Number(
          this.waitlistRules.maxPartySize
        ),

      pauseNewJoinsAfterClosing:
        Boolean(
          this.waitlistRules
            .pauseNewJoinsAfterClosing
        ),

      tableReadyResponseMinutes:
        Number(
          this.waitlistRules
            .tableReadyResponseMinutes
        ),

      walkInsOnly:
        Boolean(
          this.waitlistRules.walkInsOnly
        )
    };

    if (
      payload.maxPartySize < 1 ||
      payload.tableReadyResponseMinutes < 1
    ) {
      this.waitlistSaveMessage =
        'Party size and response time must be greater than zero.';

      this.restoreWaitlistValues();
      return;
    }

    this.isSavingWaitlist = true;
    this.waitlistSaveMessage = '';

    this.settingApi
      .updateWaitlistSettings(
        this.restaurantId,
        payload
      )
      .subscribe({
        next: response => {
          this.isSavingWaitlist = false;

          if (response?.success) {
            this.savedWaitlistRules =
              this.cloneData(
                this.waitlistRules
              );

            this.waitlistSaveMessage =
              response.message ||
              'Waitlist settings updated.';
          } else {
            this.restoreWaitlistValues();

            this.waitlistSaveMessage =
              response?.message ||
              'Unable to update waitlist settings.';
          }
        },
        error: error => {
          console.error(
            'Update waitlist settings error:',
            error
          );

          this.isSavingWaitlist = false;

          this.restoreWaitlistValues();

          this.waitlistSaveMessage =
            'Unable to update waitlist settings.';
        }
      });
  }

  private restoreWaitlistValues(): void {
    if (!this.savedWaitlistRules) {
      return;
    }

    this.waitlistRules =
      this.cloneData(
        this.savedWaitlistRules
      );
  }

  /* HOLIDAY */

  getHolidaySettings(): void {
    if (!this.restaurantId) {
      return;
    }

    this.holidayError = '';

    this.subscription.add(
      this.settingApi
        .settingsHolidaySchedule(
          this.restaurantId
        )
        .subscribe({
          next: response => {
            if (
              response?.success &&
              Array.isArray(
                response?.data?.holidayHours
              )
            ) {
              this.holidayHours =
                response.data.holidayHours;
            } else {
              this.holidayHours = [];

              this.holidayError =
                response?.message ||
                'Unable to load holiday settings.';
            }
          },
          error: error => {
            console.error(
              'Holiday settings error:',
              error
            );

            this.holidayHours = [];

            this.holidayError =
              'Unable to load holiday settings.';
          }
        })
    );
  }

  closeHolidayForm(): void {
    if (this.isCreatingHoliday) {
      return;
    }

    this.showHolidayForm = false;
  }

  saveHoliday(): void {
    if (
      this.isCreatingHoliday ||
      !this.restaurantId
    ) {
      return;
    }

    const payload: CreateHolidayRequest = {
      date: this.newHoliday.date,
      title: this.newHoliday.title.trim(),

      openTime:
        this.newHoliday.closed
          ? ''
          : this.newHoliday.openTime,

      closeTime:
        this.newHoliday.closed
          ? ''
          : this.newHoliday.closeTime,

      notes:
        this.newHoliday.notes.trim(),

      closed:
        Boolean(this.newHoliday.closed)
    };

    if (
      !payload.title ||
      !payload.date
    ) {
      this.holidaySaveMessage =
        'Holiday title and date are required.';

      return;
    }

    if (
      !payload.closed &&
      (
        !payload.openTime ||
        !payload.closeTime
      )
    ) {
      this.holidaySaveMessage =
        'Opening and closing times are required when the restaurant is open.';

      return;
    }

    this.isCreatingHoliday = true;
    this.holidaySaveMessage = '';

    this.settingApi
      .createHolidaySchedule(
        this.restaurantId,
        payload
      )
      .subscribe({
        next: response => {
          this.isCreatingHoliday = false;

          if (response?.success) {
            this.holidaySaveMessage =
              response.message ||
              'Holiday added successfully.';

            this.showHolidayForm = false;

            this.getHolidaySettings();
          } else {
            this.holidaySaveMessage =
              response?.message ||
              'Unable to add holiday.';
          }
        },
        error: error => {
          console.error(
            'Create holiday error:',
            error
          );

          this.isCreatingHoliday = false;

          this.holidaySaveMessage =
            'Unable to add holiday.';
        }
      });
  }

  /* ADVANCED */

  getAdvancedSettings(): void {
    if (!this.restaurantId) {
      return;
    }

    this.advancedError = '';

    this.subscription.add(
      this.settingApi
        .advancedsettings(
          this.restaurantId
        )
        .subscribe({
          next: response => {
            if (
              response?.success &&
              response?.data
            ) {
              this.advancedSettings = {
                ...response.data,
                darkMode:
                  this.normalizeDarkMode(
                    response.data.darkMode
                  )
              };

              this.savedAdvancedSettings =
                this.cloneData(
                  this.advancedSettings
                );

              this.applyDarkMode(
                this.advancedSettings.darkMode
              );
            } else {
              this.advancedError =
                response?.message ||
                'Unable to load advanced settings.';
            }
          },
          error: error => {
            console.error(
              'Advanced settings error:',
              error
            );

            this.advancedError =
              'Unable to load advanced settings.';
          }
        })
    );
  }

  updateAdvancedSetting(): void {
    if (
      !this.advancedSettings ||
      this.isSavingAdvanced ||
      !this.restaurantId
    ) {
      return;
    }

    const payload:
      UpdateAdvancedSettingsRequest = {
      darkMode:
        this.normalizeDarkMode(
          this.advancedSettings.darkMode
        ),

      desktopNotifications:
        Boolean(
          this.advancedSettings
            .desktopNotifications
        ),

      keepSignedIn:
        Boolean(
          this.advancedSettings
            .keepSignedIn
        ),

      language:
        this.advancedSettings.language ||
        'en',

      timezone:
        this.advancedSettings.timezone ||
        '',

      serverAssignmentMode:
        this.advancedSettings
          .serverAssignmentMode ?? null
    };

    this.isSavingAdvanced = true;
    this.advancedSaveMessage = '';

    this.settingApi
      .updateAdvancedSettings(
        this.restaurantId,
        payload
      )
      .subscribe({
        next: response => {
          this.isSavingAdvanced = false;

          if (response?.success) {
            this.savedAdvancedSettings =
              this.cloneData(
                this.advancedSettings
              );

            this.applyDarkMode(
              this.advancedSettings.darkMode
            );

            this.advancedSaveMessage =
              response.message ||
              'Advanced settings updated.';
          } else {
            this.restoreAdvancedValues();

            this.advancedSaveMessage =
              response?.message ||
              'Unable to update advanced settings.';
          }
        },
        error: error => {
          console.error(
            'Update advanced settings error:',
            error
          );

          this.isSavingAdvanced = false;

          this.restoreAdvancedValues();

          this.advancedSaveMessage =
            'Unable to update advanced settings.';
        }
      });
  }

  private restoreAdvancedValues(): void {
    if (!this.savedAdvancedSettings) {
      return;
    }

    this.advancedSettings =
      this.cloneData(
        this.savedAdvancedSettings
      );

    this.applyDarkMode(
      this.advancedSettings.darkMode
    );
  }

  /* TAB VALIDATION */

  private isValidTab(
    tab: SettingsTab | null
  ): tab is SettingsTab {
    return [
      'profile',
      'notification',
      'waitlist',
      'tables',
      'holiday',
      'advanced'
    ].includes(tab as SettingsTab);
  }

  /* DATE AND TIME */

  private updateCurrentTime(): void {
    this.currentTimeOnly =
      new Date().toLocaleTimeString(
        'en-CA',
        {
          timeZone: 'America/Winnipeg',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }
      );
  }

  private getWinnipegYearAndMonth(): {
    year: string;
    month: string;
  } {
    const parts =
      new Intl.DateTimeFormat(
        'en-CA',
        {
          timeZone: 'America/Winnipeg',
          year: 'numeric',
          month: '2-digit'
        }
      ).formatToParts(new Date());

    const year =
      parts.find(
        part => part.type === 'year'
      )?.value || '';

    const month =
      parts.find(
        part => part.type === 'month'
      )?.value || '';

    return {
      year,
      month
    };
  }

  formatApiDate(
    dateValue: string
  ): string {
    if (!dateValue) {
      return '—';
    }

    const dateParts =
      dateValue.split('-');

    if (dateParts.length !== 3) {
      return dateValue;
    }

    const year =
      Number(dateParts[0]);

    const month =
      Number(dateParts[1]);

    const day =
      Number(dateParts[2]);

    const localDate =
      new Date(
        year,
        month - 1,
        day
      );

    return localDate.toLocaleDateString(
      'en-CA',
      {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
    );
  }

  /* DISPLAY GETTERS */

  get restaurantHours(): string {
    if (!this.restaurant?.hours) {
      return '—';
    }

    const open =
      this.restaurant.hours.open || '';

    const close =
      this.restaurant.hours.close || '';

    if (!open && !close) {
      return '—';
    }

    return `${open} – ${close}`;
  }

  get restaurantInitial(): string {
    const name =
      this.restaurant?.name?.trim();

    return name
      ? name.charAt(0).toUpperCase()
      : 'R';
  }

  get selectedSmsPreview(): string {
    if (!this.messageTemplates) {
      return '';
    }

    if (
      this.textTemplate ===
      this.messageTemplates
        .smsTemplateName
    ) {
      return this.messageTemplates
        .smsTemplatePreview;
    }

    if (
      this.textTemplate ===
      this.messageTemplates
        .approveSmsTemplateName
    ) {
      return this.messageTemplates
        .approveSmsTemplatePreview;
    }

    return this.messageTemplates
      .notifySmsTemplatePreview;
  }

  get selectedCallPreview(): string {
    return this.messageTemplates
      ?.voiceTemplatePreview || '';
  }

  get desktopNotificationStatus(): string {
    if (!this.advancedSettings) {
      return 'Unavailable';
    }

    return this.advancedSettings
      .desktopNotifications
      ? 'Enabled'
      : 'Blocked';
  }

  get staffOnFile(): number {
    return this.staffList.length;
  }

  /* ACTIONS */

  approvePendingRequest(): void {
    this.showPendingRequest = false;
  }

  declinePendingRequest(): void {
    this.showPendingRequest = false;
  }

  updatePackage(): void {
    alert(
      'Connect package selection here.'
    );
  }

  editTextTemplate(): void {
    alert(
      'Connect text template editor here.'
    );
  }

  editCallScript(): void {
    alert(
      'Connect call script editor here.'
    );
  }

  previewCall(): void {
    alert(
      'Connect voice preview API here.'
    );
  }

  openTerms(): void {
    alert(
      'Open terms and conditions modal here.'
    );
  }

  editFloorPlan(): void {
    this.router.navigate(
      ['/restaurant/tables'],
      {
        queryParams: {
          mode: 'edit'
        }
      }
    );
  }

  addStaff(): void {
    const trimmedName =
      this.staffName.trim();

    if (!trimmedName) {
      return;
    }

    this.staffList = [
      ...this.staffList,
      {
        id: Date.now(),
        name: trimmedName,
        role: this.staffRole,
        onFloor: false
      }
    ];

    this.staffName = '';
    this.staffRole = 'Server';
  }

  removeStaff(id: number): void {
    this.staffList =
      this.staffList.filter(
        staff => staff.id !== id
      );
  }

  toggleFloor(
    staff: StaffMember
  ): void {
    staff.onFloor = !staff.onFloor;
  }

  getInitial(
    name: string
  ): string {
    return name
      ? name.charAt(0).toUpperCase()
      : '';
  }

  addHoliday(): void {
    this.showHolidayForm = true;
    this.holidaySaveMessage = '';

    this.newHoliday = {
      date: '',
      title: '',
      openTime: '',
      closeTime: '',
      notes: '',
      closed: false
    };
  }

  editHoliday(
    holiday: HolidayHour
  ): void {
    alert(
      `Edit ${holiday.title}`
    );
  }

  updateTimeZone(): void {
    alert(
      'Open time zone selection modal here.'
    );
  }

  private applyDarkMode(
    enabled: boolean
  ): void {
    /* Backend value is only the default for a device without a saved choice. */
    if (!this.themeService.hasSavedPreference()) {
      this.themeService.setDark(
        this.normalizeDarkMode(enabled)
      );
    }
  }

  private normalizeDarkMode(
    value: boolean | null | undefined
  ): boolean {
    // Default is dark. Only explicit false should disable dark mode.
    return value !== false;
  }

  private createGuestJoinLink(): void {
    if (!this.restaurantId) {
      this.guestJoinLink = '';
      return;
    }

    this.guestJoinLink =
      `${window.location.origin}/join/${this.restaurantId}`;
  }

  loadQrCode(): void {
    if (!this.restaurantId) {
      this.qrCodeError =
        'Restaurant ID is not available.';

      return;
    }

    this.isQrLoading = true;
    this.qrCodeError = '';

    this.revokeQrObjectUrl();

    this.settingApi
      .restaurantQrCode(
        this.restaurantId
      )
      .subscribe({
        next: (qrCodeBlob: Blob) => {
          this.isQrLoading = false;

          this.revokeQrObjectUrl();

          this.qrCodeImageUrl =
            URL.createObjectURL(
              qrCodeBlob
            );
        },
        error: error => {
          this.isQrLoading = false;

          this.qrCodeError =
            'Unable to load QR code.';

          console.error(
            'QR code API error:',
            error
          );
        }
      });
  }

  async copyLink(): Promise<void> {
    if (!this.guestJoinLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        this.guestJoinLink
      );

      alert(
        'Guest join link copied.'
      );
    } catch {
      this.fallbackCopyLink();
    }
  }

  private fallbackCopyLink(): void {
    if (!this.guestJoinLink) {
      return;
    }

    const textArea =
      document.createElement(
        'textarea'
      );

    textArea.value =
      this.guestJoinLink;

    textArea.style.position =
      'fixed';

    textArea.style.opacity =
      '0';

    document.body.appendChild(
      textArea
    );

    textArea.focus();
    textArea.select();

    try {
      document.execCommand(
        'copy'
      );

      alert(
        'Guest join link copied.'
      );
    } catch {
      alert(
        'Unable to copy link.'
      );
    } finally {
      document.body.removeChild(
        textArea
      );
    }
  }

  downloadQrCode(): void {
    if (!this.restaurantId) {
      return;
    }

    this.settingApi
      .restaurantQrCode(
        this.restaurantId
      )
      .subscribe({
        next: (qrCodeBlob: Blob) => {
          const downloadUrl =
            URL.createObjectURL(
              qrCodeBlob
            );

          const anchor =
            document.createElement(
              'a'
            );

          anchor.href =
            downloadUrl;

          anchor.download =
            `dinerly-restaurant-${this.restaurantId}-qr-code.png`;

          document.body.appendChild(
            anchor
          );

          anchor.click();

          document.body.removeChild(
            anchor
          );

          URL.revokeObjectURL(
            downloadUrl
          );
        },
        error: error => {
          console.error(
            'QR download error:',
            error
          );

          alert(
            'Unable to download QR code.'
          );
        }
      });
  }

  private revokeQrObjectUrl(): void {
    if (
      this.qrCodeImageUrl &&
      this.qrCodeImageUrl.startsWith(
        'blob:'
      )
    ) {
      URL.revokeObjectURL(
        this.qrCodeImageUrl
      );
    }

    this.qrCodeImageUrl = '';
  }

  @HostListener('document:click')
  closeContactActions(): void {
    this.showRestaurantMenu = false;
  }

  toggleRestaurantMenu(
    event: MouseEvent
  ): void {
    event.stopPropagation();

    this.showRestaurantMenu =
      !this.showRestaurantMenu;
  }

  logoutFromMenu(
    event: MouseEvent
  ): void {
    event.stopPropagation();

    this.logout();
  }

  logout(): void {
    localStorage.removeItem(
      'authToken'
    );

    this.router.navigate([
      '/login'
    ]);
  }

  ngOnDestroy(): void {
    this.revokeQrObjectUrl();
    this.subscription.unsubscribe();
  }

  private cloneData<T>(value: T): T {
    return JSON.parse(
      JSON.stringify(value)
    );
  }
}