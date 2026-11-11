import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistUserOffersComponent } from './waitlist-user-offers.component';

describe('WaitlistUserOffersComponent', () => {
  let component: WaitlistUserOffersComponent;
  let fixture: ComponentFixture<WaitlistUserOffersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistUserOffersComponent]
    });
    fixture = TestBed.createComponent(WaitlistUserOffersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
