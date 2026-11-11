import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Search for the restaurant portal navbar.
 * Accepts guest names (letters) or phone numbers (digits) only.
 */
@Injectable({
  providedIn: 'root'
})
export class RestaurantSearchService {

  private readonly querySubject = new BehaviorSubject<string>('');

  readonly query$ = this.querySubject.asObservable();

  get query(): string {
    return this.querySubject.value;
  }

  /** Keeps letters, digits, spaces, apostrophes and hyphens; stores and returns the result. */
  setQuery(raw: string): string {
    const cleaned = RestaurantSearchService.sanitize(raw);
    this.querySubject.next(cleaned);
    return cleaned;
  }

  clear(): void {
    this.querySubject.next('');
  }

  static sanitize(raw: string): string {
    return (raw || '').replace(/[^\p{L}\p{N} '-]/gu, '');
  }

  /** True when the name contains the query, or the phone digits contain the query digits. */
  matches(name: string | null | undefined, phone: string | null | undefined): boolean {
    const query = this.query.trim();

    if (!query) {
      return true;
    }

    if ((name || '').toLowerCase().includes(query.toLowerCase())) {
      return true;
    }

    const queryDigits = query.replace(/\D/g, '');

    return queryDigits.length > 0 &&
      (phone || '').replace(/\D/g, '').includes(queryDigits);
  }
}
