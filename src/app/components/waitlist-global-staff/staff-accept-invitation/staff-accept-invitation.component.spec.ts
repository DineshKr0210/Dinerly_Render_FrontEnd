import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffAcceptInvitationComponent } from './staff-accept-invitation.component';

describe('StaffAcceptInvitationComponent', () => {
  let component: StaffAcceptInvitationComponent;
  let fixture: ComponentFixture<StaffAcceptInvitationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StaffAcceptInvitationComponent]
    });
    fixture = TestBed.createComponent(StaffAcceptInvitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
