import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistRestaurantHistoryComponent } from './waitlist-restaurant-history.component';

describe('WaitlistRestaurantHistoryComponent', () => {
  let component: WaitlistRestaurantHistoryComponent;
  let fixture: ComponentFixture<WaitlistRestaurantHistoryComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistRestaurantHistoryComponent]
    });
    fixture = TestBed.createComponent(WaitlistRestaurantHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
