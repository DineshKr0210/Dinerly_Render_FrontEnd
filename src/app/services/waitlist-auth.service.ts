import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpParams
} from '@angular/common/http';
import {
  Router
} from '@angular/router';
import {
  BehaviorSubject,
  Observable,
  map,
  tap
} from 'rxjs';

import type {
  AuthUser,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailResponse,
  UserRole
} from '../models/waitlist-auth.model';

import {
  environment
} from 'src/environments/environment.prod';
import { IdleTimeoutService } from './idle-timout.service';

export type AuthScope =
  | 'guest'
  | 'restaurant'
  | 'server'
  | 'admin';

interface AuthStorageKeys {
  token: string;
  user: string;
}

@Injectable({
  providedIn: 'root'
})
export class WaitlistAuthService {

  private readonly baseUrl = environment.apiUrl;

  private readonly STORAGE_KEYS: Record<AuthScope, AuthStorageKeys> = {
    guest: {
      token: 'waitlist_guest_token',
      user: 'waitlist_guest_user'
    },
    restaurant: {
      token: 'waitlist_restaurant_token',
      user: 'waitlist_restaurant_user'
    },
    server: {
      token: 'waitlist_server_token',
      user: 'waitlist_server_user'
    },
    admin: {
      token: 'waitlist_admin_token',
      user: 'waitlist_admin_user'
    }
  };

  private readonly guestUserSubject =
    new BehaviorSubject<AuthUser | null>(
      this.getStoredUser('guest')
    );

  private readonly restaurantUserSubject =
    new BehaviorSubject<AuthUser | null>(
      this.getStoredUser('restaurant')
    );

  private readonly adminUserSubject =
    new BehaviorSubject<AuthUser | null>(
      this.getStoredUser('admin')
    );

  guestUser$ =
    this.guestUserSubject.asObservable();

  restaurantUser$ =
    this.restaurantUserSubject.asObservable();

  adminUser$ =
    this.adminUserSubject.asObservable();

  private readonly serverUserSubject =
    new BehaviorSubject<AuthUser | null>(
      this.getStoredUser('server')
    );

  serverUser$ =
    this.serverUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private idleTimeout: IdleTimeoutService
  ) { }

  login(
    email: string,
    password: string,
    scope: AuthScope
  ): Observable<AuthUser> {

    const payload = {
      email: email.trim().toLowerCase(),
      password
    };

    return this.http
      .post<LoginResponse>(
        `${this.baseUrl}/auth/login`,
        payload
      )
      .pipe(
        tap(response => {

          console.log(
            'AUTH API RESPONSE:',
            response
          );

          if (!response?.success) {
            throw new Error(
              response?.message ||
              'Login failed'
            );
          }

          const user =
            response?.data?.user;

          const token =
            response?.data?.token;

          if (!user) {
            throw new Error(
              'User information is missing from login response'
            );
          }

          if (!token) {
            throw new Error(
              'Authentication token is missing from login response'
            );
          }

          const normalizedRole =
            this.getNormalizedRole(user);

          console.log(
            'AUTH ROLE:',
            normalizedRole
          );

          console.log(
            'AUTH SCOPE:',
            scope
          );

          const targetScope =
            this.resolveScopeForUser(
              user,
              scope
            );

          const allowed =
            this.isUserAllowedForScope(
              user,
              targetScope
            );

          console.log(
            'AUTH ROLE ALLOWED:',
            allowed
          );

          if (!allowed) {
            throw new Error(
              this.getInvalidRoleMessage(targetScope)
            );
          }

          this.storeAuthenticationResponse(
            response,
            targetScope
          );

          console.log(
            'AUTH STORED SUCCESSFULLY'
          );

          console.log(
            'USER:',
            this.getCurrentUser(targetScope)
          );
        }),

        map(response => {
          return response.data.user;
        })
      );
  }

  loginGuest(
    email: string,
    password: string
  ): Observable<AuthUser> {

    return this.login(
      email,
      password,
      'guest'
    );
  }

  loginRestaurant(
    email: string,
    password: string
  ): Observable<AuthUser> {

    return this.login(
      email,
      password,
      'restaurant'
    );
  }

  loginAdmin(
    email: string,
    password: string
  ): Observable<AuthUser> {

    return this.login(
      email,
      password,
      'admin'
    );
  }

  /**
   * SERVER accounts share the restaurant login page but are
   * stored in their own scope so they never receive restaurant access.
   */
  private resolveScopeForUser(
    user: AuthUser,
    scope: AuthScope
  ): AuthScope {

    if (
      scope === 'restaurant' &&
      this.getNormalizedRole(user) === 'SERVER'
    ) {
      return 'server';
    }

    return scope;
  }

  register(
    payload: RegisterRequest
  ): Observable<RegisterResponse> {

    const requestBody: RegisterRequest = {
      name: payload.name.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      password: payload.password
    };

    return this.http.post<RegisterResponse>(
      `${this.baseUrl}/auth/register`,
      requestBody
    );
  }

  verifyEmail(
    token: string
  ): Observable<VerifyEmailResponse> {

    const params =
      new HttpParams().set(
        'token',
        token
      );

    return this.http.get<VerifyEmailResponse>(
      `${this.baseUrl}/auth/verify-email`,
      {
        params
      }
    );
  }

  private storeAuthenticationResponse(
    response: LoginResponse,
    scope: AuthScope
  ): void {

    const token =
      response?.data?.token;

    const user: AuthUser = {
      ...response.data.user,
      restaurantName:
        response.data.restaurantName ||
        response.data.user.restaurantName
    };

    if (!token || !user) {
      throw new Error(
        response?.message ||
        'Invalid authentication response'
      );
    }

    const keys =
      this.STORAGE_KEYS[scope];

    localStorage.setItem(
      keys.token,
      token
    );

    localStorage.setItem(
      keys.user,
      JSON.stringify(user)
    );

    this.getUserSubject(scope).next(user);
    this.idleTimeout.start(scope);
  }

  getRestaurantId(): number {

    const user =
      this.getCurrentUser('restaurant');

    return user?.restaurantId ?? 0;
  }

  getRestaurantName(): string {

    const user =
      this.getCurrentUser('restaurant');

    return user?.restaurantName ?? '';
  }

  getToken(
    scope: AuthScope
  ): string | null {

    const keys =
      this.STORAGE_KEYS[scope];

    return localStorage.getItem(
      keys.token
    );
  }

  getGuestToken(): string | null {

    return this.getToken('guest');
  }

  getRestaurantToken(): string | null {

    return this.getToken('restaurant');
  }

  getAdminToken(): string | null {

    return this.getToken('admin');
  }

  getServerToken(): string | null {

    return this.getToken('server');
  }

  getCurrentUser(
    scope: AuthScope
  ): AuthUser | null {

    return this.getUserSubject(scope).value;
  }

  getGuestUser(): AuthUser | null {

    return this.getCurrentUser('guest');
  }

  getRestaurantUser(): AuthUser | null {

    return this.getCurrentUser('restaurant');
  }

  getAdminUser(): AuthUser | null {

    return this.getCurrentUser('admin');
  }

  getServerUser(): AuthUser | null {

    return this.getCurrentUser('server');
  }

  isLoggedIn(
    scope: AuthScope
  ): boolean {

    return Boolean(
      this.getToken(scope) &&
      this.getCurrentUser(scope)
    );
  }

  isGuestLoggedIn(): boolean {

    return this.isLoggedIn('guest');
  }

  isRestaurantLoggedIn(): boolean {

    return this.isLoggedIn('restaurant');
  }

  isAdminLoggedIn(): boolean {

    return this.isLoggedIn('admin');
  }

  isServerLoggedIn(): boolean {

    return this.isLoggedIn('server');
  }

  hasRole(
    requiredRole: UserRole | string,
    scope: AuthScope
  ): boolean {

    const user =
      this.getCurrentUser(scope);

    if (!user) {
      return false;
    }

    return (
      this.getNormalizedRole(user) ===
      requiredRole.trim().toUpperCase()
    );
  }

  isGuestUser(
    user?: AuthUser | null
  ): boolean {

    const currentUser =
      user ?? this.getGuestUser();

    return (
      this.getNormalizedRole(currentUser) ===
      'GUEST'
    );
  }

  isRestaurantUser(
    user?: AuthUser | null
  ): boolean {

    const currentUser =
      user ?? this.getRestaurantUser();

    const role =
      this.getNormalizedRole(currentUser);

    return [
      'ADMIN',
      'MANAGER',
      'HOST'
    ].includes(role);
  }

  isAdminUser(
    user?: AuthUser | null
  ): boolean {

    const currentUser =
      user ?? this.getAdminUser();

    return (
      this.getNormalizedRole(currentUser) ===
      'ADMIN'
    );
  }

  isServerUser(
    user?: AuthUser | null
  ): boolean {

    const currentUser =
      user ?? this.getServerUser();

    return (
      this.getNormalizedRole(currentUser) ===
      'SERVER'
    );
  }

  private getNormalizedRole(
    user: AuthUser | null | undefined
  ): string {

    if (!user) {
      return '';
    }

    return String(
      user.role || ''
    )
      .trim()
      .toUpperCase();
  }

  private isUserAllowedForScope(
    user: AuthUser,
    scope: AuthScope
  ): boolean {

    const role =
      this.getNormalizedRole(user);

    if (scope === 'admin') {
      return role === 'ADMIN';
    }

    if (scope === 'server') {
      return role === 'SERVER';
    }

    if (scope === 'restaurant') {
      return [
        'ADMIN',
        'MANAGER',
        'HOST'
      ].includes(role);
    }

    if (scope === 'guest') {
      return [
        'ADMIN',
        'MANAGER',
        'HOST',
        'GUEST'
      ].includes(role);
    }

    return false;
  }

  private getInvalidRoleMessage(
    scope: AuthScope
  ): string {

    if (scope === 'admin') {
      return (
        'Only administrator accounts can access the admin portal.'
      );
    }

    if (scope === 'server') {
      return (
        'Only server accounts can access the server portal.'
      );
    }

    if (scope === 'restaurant') {
      return (
        'Only administrator, manager, or host accounts can access the restaurant portal.'
      );
    }

    return (
      'This account cannot access the guest portal.'
    );
  }

  signOut(
    scope: AuthScope,
    navigate = true
  ): void {
    if (this.getToken(scope)) {
      this.idleTimeout.stop();
  }

    const keys =
      this.STORAGE_KEYS[scope];

    localStorage.removeItem(
      keys.token
    );

    localStorage.removeItem(
      keys.user
    );

    this.getUserSubject(scope).next(null);

    if (!navigate) {
      return;
    }

    if (scope === 'guest') {
      this.router.navigate(['/user']);
      return;
    }

    if (scope === 'admin') {
      this.router.navigate(['/login/admin']);
      return;
    }

    this.router.navigate(['/login/restaurant']);
  }

  signOutGuest(
    navigate = true
  ): void {

    this.signOut(
      'guest',
      navigate
    );
  }

  signOutRestaurant(
    navigate = true
  ): void {

    this.signOut(
      'restaurant',
      navigate
    );
  }

  signOutAdmin(
    navigate = true
  ): void {

    this.signOut(
      'admin',
      navigate
    );
  }

  signOutServer(
    navigate = true
  ): void {

    this.signOut(
      'server',
      navigate
    );
  }

  signOutAll(): void {
    this.idleTimeout.stop();
    this.clearAuthentication('guest');
    this.clearAuthentication('restaurant');
    this.clearAuthentication('server');
    this.clearAuthentication('admin');

    this.router.navigate([
      '/login/restaurant'
    ]);
  }

  private clearAuthentication(
    scope: AuthScope
  ): void {

    const keys =
      this.STORAGE_KEYS[scope];

    localStorage.removeItem(
      keys.token
    );

    localStorage.removeItem(
      keys.user
    );

    this.getUserSubject(scope).next(null);
  }

  private getStoredUser(
    scope: AuthScope
  ): AuthUser | null {

    const keys =
      this.STORAGE_KEYS[scope];

    const data =
      localStorage.getItem(
        keys.user
      );

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as AuthUser;
    } catch {
      localStorage.removeItem(
        keys.user
      );

      localStorage.removeItem(
        keys.token
      );

      return null;
    }
  }

  private getUserSubject(
    scope: AuthScope
  ): BehaviorSubject<AuthUser | null> {

    if (scope === 'guest') {
      return this.guestUserSubject;
    }

    if (scope === 'admin') {
      return this.adminUserSubject;
    }

    if (scope === 'server') {
      return this.serverUserSubject;
    }

    return this.restaurantUserSubject;
  }
}