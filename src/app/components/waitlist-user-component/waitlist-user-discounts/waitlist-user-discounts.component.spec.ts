import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistUserDiscountsComponent } from './waitlist-user-discounts.component';

describe('WaitlistUserDiscountsComponent', () => {
  let component: WaitlistUserDiscountsComponent;
  let fixture: ComponentFixture<WaitlistUserDiscountsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistUserDiscountsComponent]
    });
    fixture = TestBed.createComponent(WaitlistUserDiscountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
