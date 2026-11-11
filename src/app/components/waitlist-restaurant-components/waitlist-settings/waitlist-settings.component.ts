import {
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import {
  Subscription,
  timer
} from 'rxjs';
import {
  AdvancedSettingsResponse,
  GuestNotificationSettings,
  HolidayHour,
  MessageTemplateSettings,
  NotificationSettingsResponse,
  SettingsPlan,
  SettingsRestaurant,
  StaffNotificationSettings,
  WaitlistSettingsResponse
} from '../../../models/waitlist-settings.model';
import {
  SettingService
} from 'src/app/services/setting.service';
import {
  WaitlistAuthService
} from 'src/app/services/waitlist-auth.service';
import { ThemeService } from 'src/app/services/theme.service';

type SettingsTab =
  | 'profile'
  | 'notification'
  | 'waitlist'
  | 'tables'
  | 'holiday'
  | 'advanced';

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
  selector: 'app-waitlist-settings',
  templateUrl: './waitlist-settings.component.html',
  styleUrls: ['./waitlist-settings.component.css']
})
export class WaitlistSettingsComponent
  implements OnInit, OnDestroy {

  activeTab: SettingsTab = 'profile';

  restaurantId: any;
  restaurantName = '';

  showRestaurantMenu = false;

  profileError = '';
  notificationError = '';
  waitlistError = '';
  holidayError = '';
  advancedError = '';
  qrCodeError = '';

  restaurant: SettingsRestaurant | null = null;
  currentPlan: SettingsPlan | null = null;

  notificationConfiguration:
    NotificationSettingsResponse | null = null;

  guestNotifications:
    GuestNotificationSettings | null = null;

  staffNotifications:
    StaffNotificationSettings | null = null;

  messageTemplates!:
    MessageTemplateSettings;

  waitlistRules:
    WaitlistSettingsResponse | null = null;

  holidayHours: HolidayHour[] = [];

  advancedSettings!:
    AdvancedSettingsResponse;

  floorOverview: FloorOverview | null = null;

  staffList: StaffMember[] = [];

  guestJoinLink = '';

  qrCodeImageUrl = '';
  isQrLoading = false;

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

  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private settingApi: SettingService,
    private auth: WaitlistAuthService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.restaurantId = this.auth.getRestaurantId();
    this.restaurantName = this.auth.getRestaurantName();

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
      timer(0, 30000).subscribe(() => {
        this.updateCurrentTime();
      })
    );

    this.loadAllSettings();
    this.loadQrCode();
  }

  private loadAllSettings(): void {
    this.getSettingsProfile();
    this.getSettingsNotifications();
    this.getWaitlistSettings();
    this.getHolidaySettings();
    this.getAdvancedSettings();
  }

  getSettingsProfile(): void {
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

  getSettingsNotifications(): void {
    this.notificationError = '';

    this.subscription.add(
      this.settingApi
        .settingNotification(this.restaurantId)
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

  getWaitlistSettings(): void {
    this.waitlistError = '';

    this.subscription.add(
      this.settingApi
        .waitlistSettings(this.restaurantId)
        .subscribe({
          next: response => {
            if (
              response?.success &&
              response?.data
            ) {
              this.waitlistRules =
                response.data;
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

  getHolidaySettings(): void {
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

  getAdvancedSettings(): void {
    this.advancedError = '';

    this.subscription.add(
      this.settingApi
        .advancedsettings(this.restaurantId)
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

  private updateCurrentTime(): void {
    new Date().toLocaleTimeString('en-CA', {
      timeZone: 'America/Winnipeg',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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

  formatApiDate(dateValue: string): string {
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

  getLanguageLabel(
    language: string
  ): string {
    const item =
      this.languages.find(
        value => value.value === language
      );

    return item?.label ||
      language ||
      '—';
  }

  get staffOnFile(): number {
    return this.staffList.length;
  }

  getInitial(name: string): string {
    return name
      ? name.charAt(0).toUpperCase()
      : '';
  }

  toggleDarkMode(): void {
    if (!this.advancedSettings) {
      return;
    }

    this.advancedSettings.darkMode =
      !this.normalizeDarkMode(
        this.advancedSettings.darkMode
      );

    this.themeService.setDark(this.advancedSettings.darkMode);
    this.saveAdvancedSettings();
  }

  private saveAdvancedSettings(): void {
    if (!this.advancedSettings || !this.restaurantId) {
      return;
    }

    const payload = {
      darkMode:
        this.normalizeDarkMode(
          this.advancedSettings.darkMode
        ),
      desktopNotifications: this.advancedSettings.desktopNotifications,
      keepSignedIn: this.advancedSettings.keepSignedIn,
      language: this.advancedSettings.language || 'en',
      timezone: this.advancedSettings.timezone || 'America/Winnipeg',
      serverAssignmentMode: this.advancedSettings.serverAssignmentMode || null
    };

    this.settingApi.updateAdvancedSettings(this.restaurantId, payload).subscribe({
      next: () => {
        this.themeService.setDark(this.advancedSettings.darkMode);
      },
      error: error => {
        console.error('Unable to save advanced settings:', error);
      }
    });
  }

  private applyDarkMode(
    enabled: boolean
  ): void {
    // Settings API value acts as default; explicit user toggle still overrides and persists.
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
      document.execCommand('copy');

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
            document.createElement('a');

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
      this.qrCodeImageUrl.startsWith('blob:')
    ) {
      URL.revokeObjectURL(
        this.qrCodeImageUrl
      );
    }
  }

  @HostListener('document:click')
  closeRestaurantMenu(): void {
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
}