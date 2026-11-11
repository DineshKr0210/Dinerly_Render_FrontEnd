import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistUserHomeComponent } from './waitlist-user-home.component';

describe('WaitlistUserHomeComponent', () => {
  let component: WaitlistUserHomeComponent;
  let fixture: ComponentFixture<WaitlistUserHomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistUserHomeComponent]
    });
    fixture = TestBed.createComponent(WaitlistUserHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
