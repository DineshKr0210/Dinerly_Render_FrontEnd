import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMarketingComponent } from './admin-marketing.component';

describe('AdminMarketingComponent', () => {
  let component: AdminMarketingComponent;
  let fixture: ComponentFixture<AdminMarketingComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminMarketingComponent]
    });
    fixture = TestBed.createComponent(AdminMarketingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
