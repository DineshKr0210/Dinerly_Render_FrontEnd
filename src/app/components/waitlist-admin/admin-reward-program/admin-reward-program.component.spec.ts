import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRewardProgramComponent } from './admin-reward-program.component';

describe('AdminRewardProgramComponent', () => {
  let component: AdminRewardProgramComponent;
  let fixture: ComponentFixture<AdminRewardProgramComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AdminRewardProgramComponent]
    });
    fixture = TestBed.createComponent(AdminRewardProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
