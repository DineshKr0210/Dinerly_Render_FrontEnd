import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistRestaurantModalComponent } from './waitlist-restaurant-modal.component';

describe('WaitlistRestaurantModalComponent', () => {
  let component: WaitlistRestaurantModalComponent;
  let fixture: ComponentFixture<WaitlistRestaurantModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistRestaurantModalComponent]
    });
    fixture = TestBed.createComponent(WaitlistRestaurantModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
