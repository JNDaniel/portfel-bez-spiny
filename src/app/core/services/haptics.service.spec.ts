import { TestBed } from '@angular/core/testing';

import { HapticsService } from './haptics.service';

describe('HapticsService', () => {
  it('resolves even when the vibrate API is unavailable', async () => {
    const service = TestBed.inject(HapticsService);

    await expect(service.impact('light')).resolves.toBeUndefined();
  });
});
