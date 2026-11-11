import { TestBed } from '@angular/core/testing';

import { WaitlistRestaurantService } from './waitlist-restaurant.service';

describe('WaitlistRestaurantService', () => {
  let service: WaitlistRestaurantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WaitlistRestaurantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
