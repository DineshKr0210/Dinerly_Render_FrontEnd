import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistUserActionComponent } from './waitlist-user-action.component';

describe('WaitlistUserActionComponent', () => {
  let component: WaitlistUserActionComponent;
  let fixture: ComponentFixture<WaitlistUserActionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistUserActionComponent]
    });
    fixture = TestBed.createComponent(WaitlistUserActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
