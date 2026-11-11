import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistUserHeroComponent } from './waitlist-user-hero.component';

describe('WaitlistUserHeroComponent', () => {
  let component: WaitlistUserHeroComponent;
  let fixture: ComponentFixture<WaitlistUserHeroComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistUserHeroComponent]
    });
    fixture = TestBed.createComponent(WaitlistUserHeroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
