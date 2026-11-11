import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminOffersComponent } from './admin-offers.component';

describe('AdminOffersComponent', () => {
  let component: AdminOffersComponent;
  let fixture: ComponentFixture<AdminOffersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminOffersComponent]
    });
    fixture = TestBed.createComponent(AdminOffersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
