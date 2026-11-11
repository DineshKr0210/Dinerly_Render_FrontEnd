import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WaitlistRestaurantModalService {

  constructor() { }
  private visibleSubject = new BehaviorSubject<boolean>(false);
  visible$ = this.visibleSubject.asObservable();

  open(): void { this.visibleSubject.next(true); }
  close(): void { this.visibleSubject.next(false); }
  get isVisible(): boolean { return this.visibleSubject.getValue(); }
}
