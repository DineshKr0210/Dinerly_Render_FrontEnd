import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRedemptionsComponent } from './admin-redemptions.component';

describe('AdminRedemptionsComponent', () => {
  let component: AdminRedemptionsComponent;
  let fixture: ComponentFixture<AdminRedemptionsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminRedemptionsComponent]
    });
    fixture = TestBed.createComponent(AdminRedemptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
