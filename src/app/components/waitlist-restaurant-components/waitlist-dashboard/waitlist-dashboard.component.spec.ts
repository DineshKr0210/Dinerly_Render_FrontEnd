import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistDashboardComponent } from './waitlist-dashboard.component';

describe('WaitlistDashboardComponent', () => {
  let component: WaitlistDashboardComponent;
  let fixture: ComponentFixture<WaitlistDashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistDashboardComponent]
    });
    fixture = TestBed.createComponent(WaitlistDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
