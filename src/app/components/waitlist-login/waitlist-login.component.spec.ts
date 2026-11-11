import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistLoginComponent } from './waitlist-login.component';

describe('WaitlistLoginComponent', () => {
  let component: WaitlistLoginComponent;
  let fixture: ComponentFixture<WaitlistLoginComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistLoginComponent]
    });
    fixture = TestBed.createComponent(WaitlistLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
