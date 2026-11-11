import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistSettingsComponent } from './waitlist-settings.component';

describe('WaitlistSettingsComponent', () => {
  let component: WaitlistSettingsComponent;
  let fixture: ComponentFixture<WaitlistSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistSettingsComponent]
    });
    fixture = TestBed.createComponent(WaitlistSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
