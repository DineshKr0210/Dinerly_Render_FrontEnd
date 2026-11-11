import { TestBed } from '@angular/core/testing';

import { WaitlistApiRestaurantService } from './waitlist-api-restaurant.service';

describe('WaitlistApiRestaurantService', () => {
  let service: WaitlistApiRestaurantService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WaitlistApiRestaurantService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
