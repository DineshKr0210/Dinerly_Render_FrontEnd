import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should restore light theme when the saved preference is off', () => {
    localStorage.setItem('dinerly-theme', 'light');

    const enabled = service['readStoredTheme']();

    expect(enabled).toBeFalse();
    expect(service.hasSavedPreference()).toBeTrue();
  });

  it('should keep the light state when dark mode is explicitly disabled', () => {
    service.setDark(false);

    expect(localStorage.getItem('dinerly-theme')).toBe('light');
    expect(service.hasSavedPreference()).toBeTrue();
    expect(service.isDark).toBeFalse();
  });
});
