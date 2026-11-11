import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistNotificationComponent } from './waitlist-notification.component';

describe('WaitlistNotificationComponent', () => {
  let component: WaitlistNotificationComponent;
  let fixture: ComponentFixture<WaitlistNotificationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistNotificationComponent]
    });
    fixture = TestBed.createComponent(WaitlistNotificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
