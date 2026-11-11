import { TestBed } from '@angular/core/testing';

import { WaitListAdminService } from './wait-list-admin.service';

describe('WaitListAdminService', () => {
  let service: WaitListAdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WaitListAdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
