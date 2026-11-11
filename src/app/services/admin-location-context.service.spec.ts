import { TestBed } from '@angular/core/testing';

import { AdminLocationContextService } from './admin-location-context.service';

describe('AdminLocationContextService', () => {
  let service: AdminLocationContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminLocationContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
