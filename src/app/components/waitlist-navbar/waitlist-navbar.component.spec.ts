import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistNavbarComponent } from './waitlist-navbar.component';

describe('WaitlistNavbarComponent', () => {
  let component: WaitlistNavbarComponent;
  let fixture: ComponentFixture<WaitlistNavbarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistNavbarComponent]
    });
    fixture = TestBed.createComponent(WaitlistNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
