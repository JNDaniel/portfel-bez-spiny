import { DestroyRef, Injectable, inject, signal } from '@angular/core';

const REFRESH_INTERVAL_MS = 60_000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly todaySignal = signal<Date>(startOfDay(this.now()), {
    equal: (a, b) => a.getTime() === b.getTime(),
  });

  readonly today = this.todaySignal.asReadonly();

  constructor() {
    const interval = setInterval(() => this.refresh(), REFRESH_INTERVAL_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        this.refresh();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    });
  }

  now(): Date {
    return new Date();
  }

  refresh(): void {
    this.todaySignal.set(startOfDay(this.now()));
  }
}
