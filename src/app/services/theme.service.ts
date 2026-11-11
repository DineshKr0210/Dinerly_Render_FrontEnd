import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

const THEME_STORAGE_KEY = 'dinerly-theme';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {

  private readonly darkSubject = new BehaviorSubject<boolean>(true);

  readonly isDark$ = this.darkSubject.asObservable();

  get isDark(): boolean {
    return this.darkSubject.value;
  }

  init(): void {
    const saved = this.readStoredTheme();
    this.apply(saved);
  }

  hasSavedPreference(): boolean {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved !== null && saved !== undefined && saved.trim() !== '';
  }

  setDark(enabled: boolean): void {
    const normalized = this.normalizeEnabled(enabled);
    localStorage.setItem(THEME_STORAGE_KEY, normalized ? 'dark' : 'light');
    this.apply(normalized);
  }

  toggle(): void {
    this.setDark(!this.isDark);
  }

  private apply(enabled: boolean): void {
    const root = document.documentElement;
    const body = document.body;

    root.setAttribute('data-theme', enabled ? 'dark' : 'light');
    body.classList.toggle('dark-mode', enabled);
    body.classList.toggle('restaurant-dark-mode', enabled);

    this.darkSubject.next(enabled);
  }

  private readStoredTheme(): boolean {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);

    if (saved === null) {
      return true;
    }

    const normalized = saved.trim().toLowerCase();

    if (this.isLightThemeValue(normalized)) {
      return false;
    }

    if (this.isDarkThemeValue(normalized)) {
      return true;
    }

    return true;
  }

  private normalizeEnabled(enabled: boolean): boolean {
    return enabled !== false;
  }

  private isLightThemeValue(value: string): boolean {
    return value === 'light' || value === 'false' || value === '0' || value === 'no' || value === 'off';
  }

  private isDarkThemeValue(value: string): boolean {
    return value === 'dark' || value === 'true' || value === '1' || value === 'yes' || value === 'on';
  }
}
