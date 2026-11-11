import { TestBed } from '@angular/core/testing';

import { ApiWaitlistNotificationService } from './api-waitlist-notification.service';

describe('ApiWaitlistNotificationService', () => {
  let service: ApiWaitlistNotificationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApiWaitlistNotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
