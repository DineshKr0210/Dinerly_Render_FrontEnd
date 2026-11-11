import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistAdminComponent } from './waitlist-admin.component';

describe('WaitlistAdminComponent', () => {
  let component: WaitlistAdminComponent;
  let fixture: ComponentFixture<WaitlistAdminComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistAdminComponent]
    });
    fixture = TestBed.createComponent(WaitlistAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
