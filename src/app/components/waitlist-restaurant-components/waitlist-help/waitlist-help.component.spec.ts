import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistHelpComponent } from './waitlist-help.component';

describe('WaitlistHelpComponent', () => {
  let component: WaitlistHelpComponent;
  let fixture: ComponentFixture<WaitlistHelpComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistHelpComponent]
    });
    fixture = TestBed.createComponent(WaitlistHelpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
