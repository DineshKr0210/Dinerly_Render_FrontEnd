import { TestBed } from '@angular/core/testing';

import { WaitlistRestaurantModalService } from './waitlist-restaurant-modal.service';

describe('WaitlistRestaurantModalService', () => {
  let service: WaitlistRestaurantModalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WaitlistRestaurantModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
