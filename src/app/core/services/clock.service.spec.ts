import { TestBed } from '@angular/core/testing';

import { ClockService } from './clock.service';

describe('ClockService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 12, 23, 59, 30));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('moves today after midnight once the interval fires', () => {
    const clock = TestBed.inject(ClockService);
    expect(clock.today().getDate()).toBe(12);

    vi.setSystemTime(new Date(2026, 9, 13, 0, 0, 30));
    vi.advanceTimersByTime(60_000);

    expect(clock.today().getDate()).toBe(13);
  });

  it('moves today when the page becomes visible again', () => {
    const clock = TestBed.inject(ClockService);
    vi.setSystemTime(new Date(2026, 9, 13, 8, 0));

    document.dispatchEvent(new Event('visibilitychange'));

    expect(clock.today().getDate()).toBe(13);
  });

  it('keeps the same value when refreshed within the same day', () => {
    const clock = TestBed.inject(ClockService);
    const before = clock.today();

    vi.setSystemTime(new Date(2026, 9, 12, 23, 59, 50));
    clock.refresh();

    expect(clock.today()).toBe(before);
  });
});
