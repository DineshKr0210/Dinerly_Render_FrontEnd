import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistUserComponentComponent } from './waitlist-user-component.component';

describe('WaitlistUserComponentComponent', () => {
  let component: WaitlistUserComponentComponent;
  let fixture: ComponentFixture<WaitlistUserComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistUserComponentComponent]
    });
    fixture = TestBed.createComponent(WaitlistUserComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
