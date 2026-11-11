import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistUserEmailVerifyComponent } from './waitlist-user-email-verify.component';

describe('WaitlistUserEmailVerifyComponent', () => {
  let component: WaitlistUserEmailVerifyComponent;
  let fixture: ComponentFixture<WaitlistUserEmailVerifyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistUserEmailVerifyComponent]
    });
    fixture = TestBed.createComponent(WaitlistUserEmailVerifyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
