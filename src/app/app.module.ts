import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WaitlistLoginComponent } from './components/waitlist-login/waitlist-login.component';
import { WaitlistNavbarComponent } from './components/waitlist-navbar/waitlist-navbar.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { WaitlistUserComponentComponent } from './components/waitlist-user-component/waitlist-user-component.component';
import { WaitlistUserHeroComponent } from './components/waitlist-user-component/waitlist-user-hero/waitlist-user-hero.component';
import { WaitlistUserMenuComponent } from './components/waitlist-user-component/waitlist-user-menu/waitlist-user-menu.component';
import { WaitlistUserBannerComponent } from './components/waitlist-user-component/waitlist-user-banner/waitlist-user-banner.component';
import { WaitlistUserSidebarComponent } from './components/waitlist-user-component/waitlist-user-sidebar/waitlist-user-sidebar.component';
import { WaitlistModalComponent } from './components/waitlist-modal/waitlist-modal.component';
import { WaitlistWaitingScreenComponent } from './components/waitlist-user-component/waitlist-waiting-screen/waitlist-waiting-screen.component';
import { WaitlistTablesComponent } from './components/waitlist-restaurant-components/waitlist-tables/waitlist-tables.component';
import { WaitlistActiveListComponent } from './components/waitlist-restaurant-components/waitlist-active-list/waitlist-active-list.component';
import { WaitlistRedemptionComponent } from './components/waitlist-restaurant-components/waitlist-redemption/waitlist-redemption.component';
import { WaitlistNotificationComponent } from './components/waitlist-restaurant-components/waitlist-notification/waitlist-notification.component';
import { WaitlistRestaurantComponentComponent } from './components/waitlist-restaurant-components/waitlist-restaurant-component.component';
import { CommonModule } from '@angular/common';
import { WaitlistRestaurantModalComponent } from './components/waitlist-restaurant-components/waitlist-restaurant-modal/waitlist-restaurant-modal.component';
import { WaitlistDashboardComponent } from './components/waitlist-restaurant-components/waitlist-dashboard/waitlist-dashboard.component';
import { AuthInterceptor } from './interceptor/auth.interceptor';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { MatStepperModule } from "@angular/material/stepper";
import { NgChartsModule } from 'ng2-charts';
import { WaitlistAdminComponent } from './components/waitlist-admin/waitlist-admin.component';
import { WaitlistServerComponent } from './components/waitlist-server/waitlist-server.component';
import { ServerTablesComponent } from './components/waitlist-server/server-tables/server-tables.component';
import { ServerNotificationsComponent } from './components/waitlist-server/server-notifications/server-notifications.component';
import { AdminHistoryComponent } from './components/waitlist-admin/admin-history/admin-history.component';
import { AdminReportsComponent } from './components/waitlist-admin/admin-reports/admin-reports.component';
import { AdminSettingsComponent } from './components/waitlist-admin/admin-settings/admin-settings.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { WaitlistSettingsComponent } from './components/waitlist-restaurant-components/waitlist-settings/waitlist-settings.component';
import { WaitlistRestaurantHistoryComponent } from './components/waitlist-restaurant-components/waitlist-restaurant-history/waitlist-restaurant-history.component';
import { DinerlyLoaderComponent } from './components/dinerly-loader/dinerly-loader.component';
import { WaitlistUserActionComponent } from './components/waitlist-user-component/waitlist-user-action/waitlist-user-action.component';
import { GuestAccountLoginComponent } from './components/waitlist-user-component/guest-account-login/guest-account-login.component';
import { CustomerAuthInterceptor } from './interceptor/customer-auth.interceptor';
import { WaitlistUserHomeComponent } from './components/waitlist-user-component/waitlist-user-home/waitlist-user-home.component';
import { WaitlistUserDiscountsComponent } from './components/waitlist-user-component/waitlist-user-discounts/waitlist-user-discounts.component';
import { WaitlistUserOffersComponent } from './components/waitlist-user-component/waitlist-user-offers/waitlist-user-offers.component';
import { WaitlistUserEmailVerifyComponent } from './components/waitlist-user-component/waitlist-user-email-verify/waitlist-user-email-verify.component';
import { WaitlistHelpComponent } from './components/waitlist-restaurant-components/waitlist-help/waitlist-help.component';
import { WaitlistRestaurantPendingRequestComponent } from './components/waitlist-restaurant-components/waitlist-restaurant-pending-request/waitlist-restaurant-pending-request.component';
import { AdminDashboardComponent } from './components/waitlist-admin/admin-dashboard/admin-dashboard.component';
import { ManagementComponent } from './components/waitlist-admin/management/management.component';
import { LocationsComponent } from './components/waitlist-admin/locations/locations.component';
import { MenuManagementComponent } from './components/waitlist-admin/menu-management/menu-management.component';
import { AdminComponent } from './components/waitlist-admin/admin/admin.component';
import { AdminOffersComponent } from './components/waitlist-admin/admin-offers/admin-offers.component';
import { AdminRewardProgramComponent } from './components/waitlist-admin/admin-reward-program/admin-reward-program.component';
import { AdminRedemptionsComponent } from './components/waitlist-admin/admin-redemptions/admin-redemptions.component';
import { AdminReviewsComponent } from './components/waitlist-admin/admin-reviews/admin-reviews.component';
import { AdminPerformanceComponent } from './components/waitlist-admin/admin-performance/admin-performance.component';
import { AdminCustomersComponent } from './components/waitlist-admin/admin-customers/admin-customers.component';
import { AdminStatementsComponent } from './components/waitlist-admin/admin-statements/admin-statements.component';
import { AdminStoreComponent } from './components/waitlist-admin/admin-store/admin-store.component';
import { AdminHelpComponent } from './components/waitlist-admin/admin-help/admin-help.component';
import { AdminManagementComponent } from './components/waitlist-admin/admin-management/admin-management.component';
import { AdminMarketingComponent } from './components/waitlist-admin/admin-marketing/admin-marketing.component';
import { StaffAcceptInvitationComponent } from './components/waitlist-global-staff/staff-accept-invitation/staff-accept-invitation.component';
import { WaitlistUserReviewComponent } from './components/waitlist-user-component/waitlist-user-review/waitlist-user-review.component';
import { SessionTimeoutComponent } from './components/session-timeout/session-timeout.component';
import { ToastContainerComponent } from './components/toast-container/toast-container.component';

@NgModule({
  declarations: [
    AppComponent,
    WaitlistLoginComponent,
    WaitlistNavbarComponent,
    WaitlistUserComponentComponent,
    WaitlistUserHeroComponent,
    WaitlistUserMenuComponent,
    WaitlistUserBannerComponent,
    WaitlistUserSidebarComponent,
    WaitlistModalComponent,
    WaitlistWaitingScreenComponent,
    WaitlistTablesComponent,
    WaitlistActiveListComponent,
    WaitlistRedemptionComponent,
    WaitlistNotificationComponent,
    WaitlistRestaurantComponentComponent,
    WaitlistRestaurantModalComponent,
    WaitlistDashboardComponent,
    WaitlistAdminComponent,
    WaitlistServerComponent,
    ServerTablesComponent,
    ServerNotificationsComponent,
    AdminHistoryComponent,
    AdminReportsComponent,
    AdminSettingsComponent,
    WaitlistSettingsComponent,
    WaitlistRestaurantHistoryComponent,
    DinerlyLoaderComponent,
    WaitlistUserActionComponent,
    GuestAccountLoginComponent,
    WaitlistUserHomeComponent,
    WaitlistUserDiscountsComponent,
    WaitlistUserOffersComponent,
    WaitlistUserEmailVerifyComponent,
    WaitlistHelpComponent,
    WaitlistRestaurantPendingRequestComponent,
    AdminDashboardComponent,
    ManagementComponent,
    LocationsComponent,
    MenuManagementComponent,
    AdminComponent,
    AdminOffersComponent,
    AdminRewardProgramComponent,
    AdminRedemptionsComponent,
    AdminReviewsComponent,
    AdminPerformanceComponent,
    AdminCustomersComponent,
    AdminStatementsComponent,
    AdminStoreComponent,
    AdminHelpComponent,
    AdminManagementComponent,
    AdminMarketingComponent,
    StaffAcceptInvitationComponent,
    WaitlistUserReviewComponent,
    SessionTimeoutComponent,
    ToastContainerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    CommonModule,
    HttpClientModule,
    FormsModule,
    MatStepperModule,
    NgChartsModule,
    DragDropModule

],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CustomerAuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
