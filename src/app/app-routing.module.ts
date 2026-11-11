import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WaitlistUserComponentComponent } from './components/waitlist-user-component/waitlist-user-component.component';
import { WaitlistLoginComponent } from './components/waitlist-login/waitlist-login.component';
import { WaitlistActiveListComponent } from './components/waitlist-restaurant-components/waitlist-active-list/waitlist-active-list.component';
import { WaitlistRedemptionComponent } from './components/waitlist-restaurant-components/waitlist-redemption/waitlist-redemption.component';
import { WaitlistTablesComponent } from './components/waitlist-restaurant-components/waitlist-tables/waitlist-tables.component';
import { WaitlistRestaurantComponentComponent } from './components/waitlist-restaurant-components/waitlist-restaurant-component.component';
import { WaitlistAuthGuard } from './auth-guard/waitlist-auth.guard';
import { WaitlistAdminComponent } from './components/waitlist-admin/waitlist-admin.component';
import { WaitlistServerComponent } from './components/waitlist-server/waitlist-server.component';
import { ServerTablesComponent } from './components/waitlist-server/server-tables/server-tables.component';
import { ServerNotificationsComponent } from './components/waitlist-server/server-notifications/server-notifications.component';
import { AdminReportsComponent } from './components/waitlist-admin/admin-reports/admin-reports.component';
import { AdminHistoryComponent } from './components/waitlist-admin/admin-history/admin-history.component';
import { AdminSettingsComponent } from './components/waitlist-admin/admin-settings/admin-settings.component';
import { WaitlistSettingsComponent } from './components/waitlist-restaurant-components/waitlist-settings/waitlist-settings.component';
import { WaitlistRestaurantHistoryComponent } from './components/waitlist-restaurant-components/waitlist-restaurant-history/waitlist-restaurant-history.component';
import { WaitlistUserEmailVerifyComponent } from './components/waitlist-user-component/waitlist-user-email-verify/waitlist-user-email-verify.component';
import { WaitlistHelpComponent } from './components/waitlist-restaurant-components/waitlist-help/waitlist-help.component';
import { AdminDashboardComponent } from './components/waitlist-admin/admin-dashboard/admin-dashboard.component';
import { AdminManagementComponent } from './components/waitlist-admin/admin-management/admin-management.component';
import { LocationsComponent } from './components/waitlist-admin/locations/locations.component';
import { MenuManagementComponent } from './components/waitlist-admin/menu-management/menu-management.component';
import { AdminComponent } from './components/waitlist-admin/admin/admin.component';
import { AdminOffersComponent } from './components/waitlist-admin/admin-offers/admin-offers.component';
import { AdminRewardProgramComponent } from './components/waitlist-admin/admin-reward-program/admin-reward-program.component';
import { AdminRedemptionsComponent } from './components/waitlist-admin/admin-redemptions/admin-redemptions.component';
import { AdminReviewsComponent } from './components/waitlist-admin/admin-reviews/admin-reviews.component';
import { AdminPerformanceComponent } from './components/waitlist-admin/admin-performance/admin-performance.component';
import { AdminCustomersComponent } from './components/waitlist-admin/admin-customers/admin-customers.component';
import { AdminStoreComponent } from './components/waitlist-admin/admin-store/admin-store.component';
import { AdminMarketingComponent } from './components/waitlist-admin/admin-marketing/admin-marketing.component';
import { AdminStatementsComponent } from './components/waitlist-admin/admin-statements/admin-statements.component';
import { AdminHelpComponent } from './components/waitlist-admin/admin-help/admin-help.component';
import { StaffAcceptInvitationComponent } from './components/waitlist-global-staff/staff-accept-invitation/staff-accept-invitation.component';



const routes: Routes = [

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: WaitlistLoginComponent },
  { path: 'login/:role', component: WaitlistLoginComponent },
  {

    path: 'join/:restaurantId',

    component: WaitlistLoginComponent

  },
  {
    path: 'user',
    component: WaitlistUserComponentComponent
  },
  {

    path: 'verify-email',

    component: WaitlistUserEmailVerifyComponent

  },
  {

    path: 'staff/accept-invitation',

    component: StaffAcceptInvitationComponent

  },
  {
    path: 'restaurant',
    component: WaitlistRestaurantComponentComponent,
    data: {

      scope: 'restaurant'

    },
    canActivate: [WaitlistAuthGuard],
    children: [
      { path: '', redirectTo: 'waitlist', pathMatch: 'full' },
      { path: 'waitlist', component: WaitlistActiveListComponent },
      { path: 'tables', component: WaitlistTablesComponent },
      { path: 'offer-redeem', component: WaitlistRedemptionComponent },
      { path: 'settings', component: WaitlistSettingsComponent },
      { path: 'history', component: WaitlistRestaurantHistoryComponent },
      { path: 'help', component: WaitlistHelpComponent }
    ]
  },
  {
    path: 'server',
    component: WaitlistServerComponent,
    canActivate: [WaitlistAuthGuard],
    data: {

      scope: 'server'

    },
    children: [
      { path: '', redirectTo: 'tables', pathMatch: 'full' },
      { path: 'tables', component: ServerTablesComponent },
      { path: 'notifications', component: ServerNotificationsComponent }
    ]
  },
  {
    path: 'admin',
    component: WaitlistAdminComponent,
    canActivate: [WaitlistAuthGuard],
    data: {

      scope: 'admin'

    },
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: AdminDashboardComponent },
      { path: 'management', component: AdminManagementComponent },
      { path: 'locations', component: LocationsComponent },
      { path: 'menu-management', component: MenuManagementComponent },
      { path: 'admin', component: AdminComponent },
      { path: 'offers', component: AdminOffersComponent },
      // { path: 'rewards-program', component: AdminRewardProgramComponent }, will be added in future
      { path: 'redemptions', component: AdminRedemptionsComponent },
      { path: 'reviews', component: AdminReviewsComponent },
      { path: 'performance', component: AdminPerformanceComponent },
      { path: 'customers', component: AdminCustomersComponent },
      { path: 'marketing', component: AdminMarketingComponent },
      { path: 'store-availability', component: AdminStoreComponent },
      { path: 'statements', component: AdminStatementsComponent },
      { path: 'help', component: AdminHelpComponent },
      { path: 'history', component: AdminHistoryComponent },
      { path: 'settings', component: AdminSettingsComponent },
      { path: 'reports', component: AdminReportsComponent }
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
