import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistUserMenuComponent } from './waitlist-user-menu.component';

describe('WaitlistUserMenuComponent', () => {
  let component: WaitlistUserMenuComponent;
  let fixture: ComponentFixture<WaitlistUserMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistUserMenuComponent]
    });
    fixture = TestBed.createComponent(WaitlistUserMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
