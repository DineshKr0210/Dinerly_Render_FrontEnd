import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DinerlyLoaderComponent } from './dinerly-loader.component';

describe('DinerlyLoaderComponent', () => {
  let component: DinerlyLoaderComponent;
  let fixture: ComponentFixture<DinerlyLoaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DinerlyLoaderComponent]
    });
    fixture = TestBed.createComponent(DinerlyLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
