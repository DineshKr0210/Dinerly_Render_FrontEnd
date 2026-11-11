import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor() { }

  private pendingCountSubject = new BehaviorSubject<number>(0);

  pendingCount$ = this.pendingCountSubject.asObservable();

  private restaurantRefreshSubject = new Subject<void>();

  restaurantRefresh$ = this.restaurantRefreshSubject.asObservable();

  setPendingCount(count: number): void {

    this.pendingCountSubject.next(count);

  }

  triggerRestaurantRefresh(): void {

    this.restaurantRefreshSubject.next();

  }

  clear(): void {

    this.pendingCountSubject.next(0);

  }
}
