import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistUserBannerComponent } from './waitlist-user-banner.component';

describe('WaitlistUserBannerComponent', () => {
  let component: WaitlistUserBannerComponent;
  let fixture: ComponentFixture<WaitlistUserBannerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistUserBannerComponent]
    });
    fixture = TestBed.createComponent(WaitlistUserBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
