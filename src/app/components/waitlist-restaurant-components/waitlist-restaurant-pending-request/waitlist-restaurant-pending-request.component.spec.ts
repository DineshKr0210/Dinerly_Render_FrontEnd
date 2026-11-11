import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistRestaurantPendingRequestComponent } from './waitlist-restaurant-pending-request.component';

describe('WaitlistRestaurantPendingRequestComponent', () => {
  let component: WaitlistRestaurantPendingRequestComponent;
  let fixture: ComponentFixture<WaitlistRestaurantPendingRequestComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistRestaurantPendingRequestComponent]
    });
    fixture = TestBed.createComponent(WaitlistRestaurantPendingRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
