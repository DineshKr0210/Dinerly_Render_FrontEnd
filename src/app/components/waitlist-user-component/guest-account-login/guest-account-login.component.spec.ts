import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestAccountLoginComponent } from './guest-account-login.component';

describe('GuestAccountLoginComponent', () => {
  let component: GuestAccountLoginComponent;
  let fixture: ComponentFixture<GuestAccountLoginComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GuestAccountLoginComponent]
    });
    fixture = TestBed.createComponent(GuestAccountLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
