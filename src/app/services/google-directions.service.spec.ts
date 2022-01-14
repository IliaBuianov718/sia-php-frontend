import { TestBed } from '@angular/core/testing';

import { GoogleDirectionsService } from './google-directions.service';

describe('GoogleDirectionsService', () => {
  let service: GoogleDirectionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleDirectionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
