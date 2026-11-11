import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';


export type CustomerTab =
  | 'HOME'
  | 'WAITLIST'
  | 'OFFERS'
  | 'MENU'
  | 'REWARDS'
  | 'PROFILE'
  | 'REVIEWS';


export interface CustomerAccount {
  id?: number | string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt?: string;
}


export interface RestaurantDetails {
  id?: number | string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
}


@Component({
  selector: 'app-waitlist-user-sidebar',
  templateUrl: './waitlist-user-sidebar.component.html',
  styleUrls: ['./waitlist-user-sidebar.component.css']
})
export class WaitlistUserSidebarComponent {

  @Input()
  activeTab: CustomerTab = 'HOME';

  @Input()
  hasWaitlistAccess = false;

  @Input()
  hasAccountAccess = false;

  @Input()
  customerAccount: CustomerAccount | null = null;

  @Input()
  restaurant: RestaurantDetails | null = null;


  @Output()
  tabChange = new EventEmitter<CustomerTab>();

  @Output()
  accountLogin = new EventEmitter<void>();

  @Output()
  accountLogout = new EventEmitter<void>();


  get canAccessAccountFeatures(): boolean {
    return Boolean(
      this.hasAccountAccess &&
      this.customerAccount
    );
  }


  selectTab(
    tab: CustomerTab
  ): void {

    if (
      (tab === 'WAITLIST' || tab === 'REVIEWS') &&
      !this.hasWaitlistAccess
    ) {
      return;
    }

    const accountOnlyTabs: CustomerTab[] = [
      'OFFERS',
      'MENU',
      'REWARDS',
      'PROFILE'
    ];

    if (
      accountOnlyTabs.includes(tab) &&
      !this.canAccessAccountFeatures
    ) {
      this.accountLogin.emit();
      return;
    }

    this.tabChange.emit(tab);
  }


  loginWithEmail(
    event: MouseEvent
  ): void {

    event.stopPropagation();

    this.accountLogin.emit();
  }


  logoutAccount(
    event: MouseEvent
  ): void {

    event.stopPropagation();

    this.accountLogout.emit();
  }


  getInitial(): string {

    const name =
      this.customerAccount?.name?.trim();

    if (!name) {
      return 'U';
    }

    return name.charAt(0).toUpperCase();
  }

}