import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistUserReviewComponent } from './waitlist-user-review.component';

describe('WaitlistUserReviewComponent', () => {
  let component: WaitlistUserReviewComponent;
  let fixture: ComponentFixture<WaitlistUserReviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistUserReviewComponent]
    });
    fixture = TestBed.createComponent(WaitlistUserReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
