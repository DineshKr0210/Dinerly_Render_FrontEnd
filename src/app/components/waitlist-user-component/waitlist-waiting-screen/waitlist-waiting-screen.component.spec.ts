import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistWaitingScreenComponent } from './waitlist-waiting-screen.component';

describe('WaitlistWaitingScreenComponent', () => {
  let component: WaitlistWaitingScreenComponent;
  let fixture: ComponentFixture<WaitlistWaitingScreenComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistWaitingScreenComponent]
    });
    fixture = TestBed.createComponent(WaitlistWaitingScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
