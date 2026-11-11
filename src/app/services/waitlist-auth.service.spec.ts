import { TestBed } from '@angular/core/testing';

import { WaitlistAuthService } from './waitlist-auth.service';

describe('WaitlistAuthService', () => {
  let service: WaitlistAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WaitlistAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
