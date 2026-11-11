import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminStatementsComponent } from './admin-statements.component';

describe('AdminStatementsComponent', () => {
  let component: AdminStatementsComponent;
  let fixture: ComponentFixture<AdminStatementsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminStatementsComponent]
    });
    fixture = TestBed.createComponent(AdminStatementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
