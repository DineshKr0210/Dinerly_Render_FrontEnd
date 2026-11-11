import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitlistTablesComponent } from './waitlist-tables.component';

describe('WaitlistTablesComponent', () => {
  let component: WaitlistTablesComponent;
  let fixture: ComponentFixture<WaitlistTablesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [WaitlistTablesComponent]
    });
    fixture = TestBed.createComponent(WaitlistTablesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
