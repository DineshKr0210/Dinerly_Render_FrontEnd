import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistUserSidebarComponent } from './waitlist-user-sidebar.component';

describe('WaitlistUserSidebarComponent', () => {
  let component: WaitlistUserSidebarComponent;
  let fixture: ComponentFixture<WaitlistUserSidebarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistUserSidebarComponent]
    });
    fixture = TestBed.createComponent(WaitlistUserSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
